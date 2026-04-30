// js/supabase-config.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ⚠️ SUBSTITUA PELOS SEUS DADOS DO SUPABASE! ⚠️
const SUPABASE_URL = 'https://ycuhvwcjdolpeebymutl.supabase.co';  // COLOQUE SUA URL AQUI
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljdWh2d2NqZG9scGVlYnltdXRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MDI3NTgsImV4cCI6MjA5Mjk3ODc1OH0.J9_TQ5bixR47GXM4PDS7QxZkUD4DI4nEcOZm_0A2bmI';     // COLOQUE SUA CHAVE ANON AQUI

// Criar cliente Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Funções de autenticação
export async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
    });
    if (error) throw error;
    return data;
}

export async function signUp(email, password, displayName = '') {
    const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
            data: {
                display_name: displayName,
                name: displayName
            },
            emailRedirectTo: window.location.origin + '/index2.html'
        }
    });
    if (error) throw error;
    return data;
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

// Verificar se está logado
export async function isAuthenticated() {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
}
