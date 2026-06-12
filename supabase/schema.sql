-- ============================================================
-- Campo Trecho — Schema Supabase
-- Ejecutá este SQL en el SQL Editor de tu proyecto Supabase
-- https://supabase.com → SQL Editor → New query
-- ============================================================

-- ── Extensiones ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Perfiles (uno por usuario de Auth) ───────────────────────
create table public.perfiles (
  id        uuid primary key references auth.users(id) on delete cascade,
  email     text not null,
  rol       text not null check (rol in ('productor', 'comprador')),
  nombre    text not null,
  negocio   text,
  zona      text,
  foto_url  text,
  created_at timestamptz default now()
);

-- ── Publicaciones ─────────────────────────────────────────────
create table public.publicaciones (
  id                  uuid primary key default gen_random_uuid(),
  productor_id        uuid not null references public.perfiles(id) on delete cascade,
  productor_nombre    text not null,
  productor_negocio   text,
  zona                text,
  producto            text not null,
  cantidad_kg         numeric not null check (cantidad_kg > 0),
  precio_kg           numeric not null check (precio_kg > 0),
  destino             text not null,
  fecha_entrega       date not null,
  estado              text not null default 'disponible' check (estado in ('disponible', 'vendido')),
  created_at          timestamptz default now()
);

-- ── Pedidos ───────────────────────────────────────────────────
create table public.pedidos (
  id                  uuid primary key default gen_random_uuid(),
  publicacion_id      uuid references public.publicaciones(id),
  productor_id        uuid not null references public.perfiles(id),
  comprador_id        uuid not null references public.perfiles(id),
  comprador_nombre    text not null,
  producto            text not null,
  productor_nombre    text not null,
  productor_negocio   text,
  kg                  numeric not null check (kg > 0),
  subtotal            numeric not null,
  comision_comprador  numeric not null,
  comision_vendedor   numeric not null,
  total_comprador     numeric not null,
  netto_vendedor      numeric not null,
  estado              text not null default 'confirmado',
  calificado          boolean not null default false,
  fecha               date not null default current_date,
  created_at          timestamptz default now()
);

-- ── Calificaciones ────────────────────────────────────────────
create table public.calificaciones (
  id               uuid primary key default gen_random_uuid(),
  pedido_id        uuid not null references public.pedidos(id),
  productor_id     uuid not null references public.perfiles(id),
  comprador_id     uuid not null references public.perfiles(id),
  comprador_nombre text not null,
  puntuacion       integer not null check (puntuacion between 1 and 5),
  comentario       text,
  fecha            date not null default current_date,
  created_at       timestamptz default now(),
  unique (pedido_id)  -- una calificación por pedido
);

-- ── Storage bucket para fotos ─────────────────────────────────
insert into storage.buckets (id, name, public) values ('fotos', 'fotos', true);

-- ── Row Level Security ────────────────────────────────────────
alter table public.perfiles       enable row level security;
alter table public.publicaciones  enable row level security;
alter table public.pedidos        enable row level security;
alter table public.calificaciones enable row level security;

-- Perfiles: cada usuario ve y edita el suyo
create policy "ver perfiles" on public.perfiles for select using (true);
create policy "editar perfil propio" on public.perfiles for update using (auth.uid() = id);
create policy "insertar perfil propio" on public.perfiles for insert with check (auth.uid() = id);

-- Publicaciones: todos ven, productores gestionan las suyas
create policy "ver publicaciones" on public.publicaciones for select using (true);
create policy "crear publicacion propia" on public.publicaciones for insert with check (auth.uid() = productor_id);
create policy "editar publicacion propia" on public.publicaciones for update using (auth.uid() = productor_id);

-- Pedidos: cada parte ve los suyos
create policy "ver pedidos propios" on public.pedidos for select using (auth.uid() = comprador_id or auth.uid() = productor_id);
create policy "crear pedido" on public.pedidos for insert with check (auth.uid() = comprador_id);

-- Calificaciones: todos ven, comprador crea la suya
create policy "ver calificaciones" on public.calificaciones for select using (true);
create policy "crear calificacion" on public.calificaciones for insert with check (auth.uid() = comprador_id);

-- Storage: fotos públicas, cada usuario sube a su carpeta
create policy "fotos publicas" on storage.objects for select using (bucket_id = 'fotos');
create policy "subir foto propia" on storage.objects for insert with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "actualizar foto propia" on storage.objects for update using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
