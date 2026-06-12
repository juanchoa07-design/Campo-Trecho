// ─────────────────────────────────────────────────────────────
// Configuración de Supabase
// 1. Creá un proyecto en https://supabase.com
// 2. Andá a Project Settings → API
// 3. Pegá la URL y la anon key acá
// ─────────────────────────────────────────────────────────────
export const SUPABASE_URL = 'https://TU_PROYECTO.supabase.co';
export const SUPABASE_ANON_KEY = 'TU_ANON_KEY';

// Cuando ambos estén cargados, el backend estará activo.
// Mientras tanto la app funciona en modo demo (datos en memoria).
export const SUPABASE_LISTO = !SUPABASE_URL.includes('TU_PROYECTO');
