import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { SUPABASE_LISTO } from './config';
import {
  sbRegistrar, sbLogin, sbLogout, sbSesionActual,
  sbActualizarPerfil, sbSubirFoto,
  sbCargarDatos, sbPublicar, sbEditarPublicacion, sbPedir, sbCalificar,
} from './supabase';

export const COMISION_COMPRADOR = 0.05;
export const COMISION_VENDEDOR  = 0.05;
export const COSTO_FLETE_BASE   = 2200;

let nextId = 1;
const uid = () => String(nextId++);

// ── Helpers de negocio ────────────────────────────────────────

export function agruparFletes(publicaciones) {
  const activas = publicaciones.filter((p) => p.estado !== 'vendido');
  const grupos  = [];
  for (const pub of activas) {
    const grupo = grupos.find(
      (g) => g.destino === pub.destino && Math.abs(diasEntre(g.fecha, pub.fechaEntrega)) <= 1
    );
    if (grupo) grupo.publicaciones.push(pub);
    else grupos.push({ id: `flete-${pub.destino}-${pub.fechaEntrega}`, destino: pub.destino, fecha: pub.fechaEntrega, publicaciones: [pub] });
  }
  return grupos.map((g) => {
    const totalKg = g.publicaciones.reduce((s, p) => s + p.cantidadKg, 0);
    return {
      ...g, totalKg, costoTotal: COSTO_FLETE_BASE,
      detalle: g.publicaciones.map((p) => {
        const prop = totalKg > 0 ? p.cantidadKg / totalKg : 0;
        const costoCompartido = Math.round(COSTO_FLETE_BASE * prop);
        return { publicacionId: p.id, productor: p.productorNombre, producto: p.producto, kg: p.cantidadKg, costoCompartido, ahorroPct: Math.round((1 - prop) * 100) };
      }),
    };
  });
}

function diasEntre(a, b) { return (new Date(a) - new Date(b)) / 86400000; }

export function calcularPedido(publicacion, kg) {
  const subtotal          = kg * publicacion.precioKg;
  const comisionComprador = Math.round(subtotal * COMISION_COMPRADOR);
  const comisionVendedor  = Math.round(subtotal * COMISION_VENDEDOR);
  return { subtotal, comisionComprador, comisionVendedor, totalComprador: subtotal + comisionComprador, nettoVendedor: subtotal - comisionVendedor };
}

export function promedioCalificacion(calificaciones, productorId) {
  const mias = calificaciones.filter((c) => c.productorId === productorId);
  if (!mias.length) return null;
  return { promedio: (mias.reduce((s, c) => s + c.puntuacion, 0) / mias.length).toFixed(1), cantidad: mias.length };
}

export const fmt = (n) => '$U ' + Number(n).toLocaleString('es-UY');

// ── Reducer ───────────────────────────────────────────────────

const ESTADO_INICIAL = {
  usuarios: [], usuarioActual: null,
  publicaciones: [], pedidos: [], calificaciones: [],
  error: null, cargando: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_CARGANDO':   return { ...state, cargando: action.payload };
    case 'SET_ERROR':      return { ...state, error: action.payload, cargando: false };
    case 'LIMPIAR_ERROR':  return { ...state, error: null };

    case 'SET_USUARIO':    return { ...state, usuarioActual: action.payload, cargando: false, error: null };
    case 'LOGOUT':         return { ...state, usuarioActual: null };

    case 'CARGAR_DATOS':   return { ...state, ...action.payload };

    case 'REGISTRAR': {
      const u = { id: uid(), ...action.payload };
      if (state.usuarios.find((x) => x.email === u.email))
        return { ...state, error: 'El email ya está registrado.' };
      return { ...state, usuarios: [...state.usuarios, u], usuarioActual: u, error: null };
    }
    case 'LOGIN': {
      const { email, password } = action.payload;
      const u = state.usuarios.find((x) => x.email === email && x.password === password);
      if (!u) return { ...state, error: 'Email o contraseña incorrectos.' };
      return { ...state, usuarioActual: u, error: null };
    }

    case 'ACTUALIZAR_PERFIL': {
      const { id, ...cambios } = action.payload;
      const usuarios     = state.usuarios.map((u) => u.id === id ? { ...u, ...cambios } : u);
      const usuarioActual = state.usuarioActual?.id === id ? { ...state.usuarioActual, ...cambios } : state.usuarioActual;
      return { ...state, usuarios, usuarioActual };
    }

    case 'PUBLICAR': {
      const pub = { id: uid(), estado: 'disponible', ...action.payload };
      return { ...state, publicaciones: [pub, ...state.publicaciones] };
    }
    case 'EDITAR_PUBLICACION': {
      const { id, ...cambios } = action.payload;
      return { ...state, publicaciones: state.publicaciones.map((p) => p.id === id ? { ...p, ...cambios } : p) };
    }

    case 'PEDIR': {
      const { publicacion, kg, compradorId, compradorNombre } = action.payload;
      const calc = calcularPedido(publicacion, kg);
      const pedido = {
        id: uid(), publicacionId: publicacion.id, producto: publicacion.producto,
        productorId: publicacion.productorId, productorNombre: publicacion.productorNombre, productorNegocio: publicacion.productorNegocio,
        compradorId, compradorNombre, kg, ...calc,
        estado: 'confirmado', calificado: false, fecha: new Date().toISOString().slice(0, 10),
      };
      const publicaciones = state.publicaciones.map((p) => {
        if (p.id !== publicacion.id) return p;
        const restante = p.cantidadKg - kg;
        return { ...p, cantidadKg: Math.max(restante, 0), estado: restante <= 0 ? 'vendido' : 'disponible' };
      });
      return { ...state, publicaciones, pedidos: [pedido, ...state.pedidos] };
    }

    case 'CALIFICAR': {
      const cal = { id: uid(), fecha: new Date().toISOString().slice(0, 10), ...action.payload };
      const pedidos = state.pedidos.map((p) => p.id === cal.pedidoId ? { ...p, calificado: true } : p);
      return { ...state, calificaciones: [...state.calificaciones, cal], pedidos };
    }

    default: return state;
  }
}

// ── Context ───────────────────────────────────────────────────

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, ESTADO_INICIAL);

  // Async API — usa Supabase si está configurado, sino trabaja en memoria
  const api = {
    async registrar(datos) {
      dispatch({ type: 'SET_CARGANDO', payload: true });
      try {
        if (SUPABASE_LISTO) {
          const perfil = await sbRegistrar(datos);
          dispatch({ type: 'SET_USUARIO', payload: perfil });
        } else {
          dispatch({ type: 'REGISTRAR', payload: datos });
        }
      } catch (e) {
        dispatch({ type: 'SET_ERROR', payload: e.message });
      }
    },

    async login(email, password) {
      dispatch({ type: 'SET_CARGANDO', payload: true });
      try {
        if (SUPABASE_LISTO) {
          const perfil = await sbLogin({ email, password });
          const datos  = await sbCargarDatos(perfil.id, perfil.rol);
          dispatch({ type: 'CARGAR_DATOS', payload: { ...datos, usuarioActual: perfil } });
          dispatch({ type: 'SET_CARGANDO', payload: false });
        } else {
          dispatch({ type: 'LOGIN', payload: { email, password } });
          dispatch({ type: 'SET_CARGANDO', payload: false });
        }
      } catch (e) {
        dispatch({ type: 'SET_ERROR', payload: e.message });
      }
    },

    async logout() {
      if (SUPABASE_LISTO) await sbLogout();
      dispatch({ type: 'LOGOUT' });
    },

    async restaurarSesion() {
      if (!SUPABASE_LISTO) return;
      try {
        const perfil = await sbSesionActual();
        if (!perfil) return;
        const datos = await sbCargarDatos(perfil.id, perfil.rol);
        dispatch({ type: 'CARGAR_DATOS', payload: { ...datos, usuarioActual: perfil } });
      } catch (_) {}
    },

    async actualizarPerfil(cambios) {
      const id = state.usuarioActual.id;
      try {
        if (SUPABASE_LISTO) {
          let fotoUrl = undefined;
          if (cambios.fotoUri) {
            fotoUrl = await sbSubirFoto(id, cambios.fotoUri);
            delete cambios.fotoUri;
            cambios.foto_url = fotoUrl;
          }
          await sbActualizarPerfil(id, cambios);
        }
        dispatch({ type: 'ACTUALIZAR_PERFIL', payload: { id, ...cambios } });
      } catch (e) {
        dispatch({ type: 'SET_ERROR', payload: e.message });
      }
    },

    async publicar(payload) {
      try {
        if (SUPABASE_LISTO) {
          const row = await sbPublicar({ ...payload, estado: 'disponible' });
          dispatch({ type: 'PUBLICAR', payload: { ...payload, id: row.id } });
        } else {
          dispatch({ type: 'PUBLICAR', payload });
        }
      } catch (e) {
        dispatch({ type: 'SET_ERROR', payload: e.message });
      }
    },

    async editarPublicacion(id, cambios) {
      try {
        if (SUPABASE_LISTO) await sbEditarPublicacion(id, cambios);
        dispatch({ type: 'EDITAR_PUBLICACION', payload: { id, ...cambios } });
      } catch (e) {
        dispatch({ type: 'SET_ERROR', payload: e.message });
      }
    },

    async pedir(payload) {
      try {
        dispatch({ type: 'PEDIR', payload });
        if (SUPABASE_LISTO) {
          const calc = calcularPedido(payload.publicacion, payload.kg);
          await sbPedir({ ...calc, publicacion_id: payload.publicacion.id, comprador_id: payload.compradorId, comprador_nombre: payload.compradorNombre, kg: payload.kg, estado: 'confirmado' });
        }
      } catch (e) {
        dispatch({ type: 'SET_ERROR', payload: e.message });
      }
    },

    async calificar(payload) {
      try {
        dispatch({ type: 'CALIFICAR', payload });
        if (SUPABASE_LISTO) await sbCalificar({ pedido_id: payload.pedidoId, productor_id: payload.productorId, comprador_id: payload.compradorId, comprador_nombre: payload.compradorNombre, puntuacion: payload.puntuacion, comentario: payload.comentario });
      } catch (e) {
        dispatch({ type: 'SET_ERROR', payload: e.message });
      }
    },
  };

  return (
    <StoreContext.Provider value={{ state, dispatch, api }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() { return useContext(StoreContext); }
