// js/storage-manager.js
import { getCurrentUser } from './supabase-config.js';

let currentUserId = null;

// Obter o ID do usuário atual
async function getCurrentUserId() {
    if (currentUserId) return currentUserId;
    const user = await getCurrentUser();
    if (user) {
        currentUserId = user.id;
    }
    return currentUserId;
}

// Gerar chave única por usuário
async function getUserKey(baseKey) {
    const userId = await getCurrentUserId();
    if (!userId) return baseKey;
    return `${userId}_${baseKey}`;
}

// Salvar dados no localStorage com chave de usuário
export async function setUserItem(key, value) {
    const userKey = await getUserKey(key);
    localStorage.setItem(userKey, JSON.stringify(value));
    console.log(`💾 Salvou ${userKey}`);
}

// Buscar dados do localStorage com chave de usuário
export async function getUserItem(key) {
    const userKey = await getUserKey(key);
    const data = localStorage.getItem(userKey);
    return data ? JSON.parse(data) : null;
}

// Remover dados do localStorage com chave de usuário
export async function removeUserItem(key) {
    const userKey = await getUserKey(key);
    localStorage.removeItem(userKey);
}

// Limpar TODOS os dados do usuário atual
export async function clearUserData() {
    const userId = await getCurrentUserId();
    if (!userId) return;
    
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`${userId}_lancamentos_`)) {
            keysToRemove.push(key);
        }
        if (key && key === `${userId}_cartoes_credito`) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`🧹 Limpos ${keysToRemove.length} itens do usuário ${userId.substring(0,8)}`);
}

// Listar todas as chaves do usuário atual
export async function listUserKeys() {
    const userId = await getCurrentUserId();
    if (!userId) return [];
    
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(userId)) {
            keys.push(key);
        }
    }
    return keys;
}