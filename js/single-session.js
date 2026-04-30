import { supabase } from './supabase-config.js';

const SESSION_KEY_PREFIX = 'active_session_id_';
const CHECK_INTERVAL_MS = 10000;
let guardIntervalId = null;

function createSessionId() {
    if (globalThis.crypto?.randomUUID) {
        return globalThis.crypto.randomUUID();
    }

    return 'session_' + Date.now() + '_' + Math.random().toString(36).slice(2);
}

function getSessionKey(userId) {
    return `${SESSION_KEY_PREFIX}${userId}`;
}

function clearLocalSessionData() {
    const keysToRemove = [];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        if (key && (
            key.startsWith('lancamentos_') ||
            key.includes('_lancamentos_') ||
            key.startsWith('cartoes_') ||
            key.endsWith('_cartoes_credito') ||
            key.startsWith('contas_') ||
            key.includes('_contas_') ||
            key === 'cartoes_credito' ||
            key === 'contas_bancarias' ||
            key === 'contas_config' ||
            key === 'nextContaId' ||
            key === '_last_user_id' ||
            key.startsWith('sb-')
        )) {
            keysToRemove.push(key);
        }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
}

async function signOutThisDevice() {
    try {
        await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
        console.warn('Erro ao sair localmente:', error);
    }

    clearLocalSessionData();
    sessionStorage.setItem('_single_session_logout', '1');
    window.location.href = 'login.html';
}

export async function activateSingleSession() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return false;

    const sessionId = createSessionId();
    localStorage.setItem(getSessionKey(user.id), sessionId);

    const metadata = {
        ...(user.user_metadata || {}),
        active_session_id: sessionId,
        active_session_started_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase.auth.updateUser({
        data: metadata
    });

    if (updateError) {
        console.error('Erro ao ativar sessao unica:', updateError);
        return false;
    }

    return true;
}

export async function checkSingleSession() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return false;

    const localSessionId = localStorage.getItem(getSessionKey(user.id));
    const activeSessionId = user.user_metadata?.active_session_id;

    if (!activeSessionId) {
        await activateSingleSession();
        return true;
    }

    if (!localSessionId) {
        localStorage.setItem(getSessionKey(user.id), activeSessionId);
        return true;
    }

    if (localSessionId !== activeSessionId) {
        await signOutThisDevice();
        return false;
    }

    return true;
}

export function startSingleSessionGuard() {
    if (guardIntervalId) return;

    checkSingleSession();
    guardIntervalId = setInterval(checkSingleSession, CHECK_INTERVAL_MS);
}
