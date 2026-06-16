import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_LISTO } from './config';

export const supabase = SUPABASE_LISTO
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

// ── Auth ──────────────────────────────────────────────────────

export async function sbRegistrar({ email, password, rol, nombre, negocio, zona }) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);

  await supabase.from('perfiles').insert({
    id: data.user.id,
    email,
    rol,
    nombre,
    negocio: negocio || null,
    zona: zona || null,
  });

  return { id: data.user.id, email, rol, nombre, negocio, zona, foto_url: null };
}

export async function sbLogin({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  return perfil;
}

export async function sbLogout() {
  await supabase.auth.signOut();
}

export async function sbSesionActual() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return null;

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', data.session.user.id)
    .single();

  return perfil;
}

// ── Perfil + foto ─────────────────────────────────────────────

export async function sbActualizarPerfil(userId, cambios) {
  const { error } = await supabase.from('perfiles').update(cambios).eq('id', userId);
  if (error) throw new Error(error.message);
}

export async function sbSubirFoto(userId, uri) {
  // Detectar extensión (iOS puede devolver .heic, Android .jpg, etc.)
  const match = uri.match(/\.(\w+)(\?|$)/);
  const ext   = match ? match[1].toLowerCase() : 'jpg';
  const mime  = ext === 'png' ? 'image/png' : 'image/jpeg';
  const path  = `${userId}/perfil.${ext}`;

  // Leer como base64 con expo-file-system (más confiable que fetch() en RN)
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Convertir base64 → Uint8Array para Supabase Storage
  const binary = atob(base64);
  const bytes  = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const { error } = await supabase.storage
    .from('fotos')
    .upload(path, bytes, { upsert: true, contentType: mime });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from('fotos').getPublicUrl(path);
  return data.publicUrl;
}

// ── Datos ─────────────────────────────────────────────────────

export async function sbCargarDatos(userId, rol) {
  const [pubRes, pedRes, calRes, usersRes] = await Promise.all([
    supabase.from('publicaciones').select('*').order('created_at', { ascending: false }),
    rol === 'comprador'
      ? supabase.from('pedidos').select('*').eq('comprador_id', userId).order('created_at', { ascending: false })
      : supabase.from('pedidos').select('*').eq('productor_id', userId).order('created_at', { ascending: false }),
    supabase.from('calificaciones').select('*'),
    supabase.from('perfiles').select('*').eq('rol', 'productor'),
  ]);

  return {
    publicaciones: pubRes.data ?? [],
    pedidos: pedRes.data ?? [],
    calificaciones: calRes.data ?? [],
    usuarios: usersRes.data ?? [],
  };
}

export async function sbPublicar(payload) {
  const { data, error } = await supabase.from('publicaciones').insert(payload).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function sbEditarPublicacion(id, cambios) {
  const { error } = await supabase.from('publicaciones').update(cambios).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function sbPedir(payload) {
  const { data, error } = await supabase.from('pedidos').insert(payload).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function sbCalificar(payload) {
  const { data, error } = await supabase.from('calificaciones').insert(payload).select().single();
  if (error) throw new Error(error.message);
  await supabase.from('pedidos').update({ calificado: true }).eq('id', payload.pedido_id);
  return data;
}
