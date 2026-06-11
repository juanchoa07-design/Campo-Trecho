import React, { createContext, useContext, useReducer } from 'react';
import { COMISION } from './theme';

// ============================================================
// Campo Trecho — capa de datos
// Hoy: estado en memoria con datos de ejemplo (demo / beta).
// Mañana: reemplazar estas funciones por llamadas a la API
// (Supabase / backend propio) sin tocar las pantallas.
// ============================================================

let nextId = 100;
const uid = () => String(nextId++);

// ---------- Datos de ejemplo (Canelones → Montevideo) ----------
const PUBLICACIONES_INICIALES = [
  {
    id: '1',
    productor: 'Raúl Méndez',
    zona: 'Sauce, Canelones',
    producto: 'Tomate redondo',
    cantidadKg: 300,
    precioKg: 38,
    destino: 'Montevideo Centro',
    fechaEntrega: '2026-06-15',
    estado: 'disponible',
  },
  {
    id: '2',
    productor: 'María Olivera',
    zona: 'Santa Rosa, Canelones',
    producto: 'Morrón rojo',
    cantidadKg: 120,
    precioKg: 95,
    destino: 'Montevideo Centro',
    fechaEntrega: '2026-06-15',
    estado: 'disponible',
  },
  {
    id: '3',
    productor: 'Jorge Píriz',
    zona: 'San Jacinto, Canelones',
    producto: 'Lechuga mantecosa',
    cantidadKg: 80,
    precioKg: 60,
    destino: 'Ciudad Vieja',
    fechaEntrega: '2026-06-16',
    estado: 'disponible',
  },
];

const PEDIDOS_INICIALES = [];

// ---------- Lógica de flete compartido ----------
// Agrupa publicaciones por destino y fecha (ventana de ±1 día).
// El costo del flete se divide proporcional a los kg de cada productor.
export const COSTO_FLETE_BASE = 2200; // UYU por viaje Canelones → Montevideo (estimado MVP)

export function agruparFletes(publicaciones) {
  const activas = publicaciones.filter((p) => p.estado !== 'entregado');
  const grupos = [];

  for (const pub of activas) {
    const grupo = grupos.find(
      (g) =>
        g.destino === pub.destino &&
        Math.abs(diasEntre(g.fecha, pub.fechaEntrega)) <= 1
    );
    if (grupo) {
      grupo.publicaciones.push(pub);
    } else {
      grupos.push({
        id: 'flete-' + pub.destino.replace(/\s+/g, '-') + '-' + pub.fechaEntrega,
        destino: pub.destino,
        fecha: pub.fechaEntrega,
        publicaciones: [pub],
      });
    }
  }

  // Cálculo del reparto proporcional del costo
  return grupos.map((g) => {
    const totalKg = g.publicaciones.reduce((s, p) => s + p.cantidadKg, 0);
    const costoIndividual = COSTO_FLETE_BASE; // lo que pagaría cada uno por su cuenta
    return {
      ...g,
      totalKg,
      costoTotal: COSTO_FLETE_BASE,
      detalle: g.publicaciones.map((p) => {
        const proporcion = totalKg > 0 ? p.cantidadKg / totalKg : 0;
        const costoCompartido = Math.round(COSTO_FLETE_BASE * proporcion);
        return {
          publicacionId: p.id,
          productor: p.productor,
          producto: p.producto,
          kg: p.cantidadKg,
          costoCompartido,
          ahorro: costoIndividual - costoCompartido,
          ahorroPct: Math.round((1 - costoCompartido / costoIndividual) * 100),
        };
      }),
    };
  });
}

function diasEntre(a, b) {
  return (new Date(a) - new Date(b)) / (1000 * 60 * 60 * 24);
}

// ---------- Cálculo de pedido ----------
export function calcularPedido(publicacion, kg) {
  const subtotal = kg * publicacion.precioKg;
  const comision = Math.round(subtotal * COMISION);
  return { subtotal, comision, total: subtotal + comision };
}

// ---------- Estado global ----------
const StoreContext = createContext(null);

function reducer(state, action) {
  switch (action.type) {
    case 'PUBLICAR': {
      const pub = { id: uid(), estado: 'disponible', ...action.payload };
      return { ...state, publicaciones: [pub, ...state.publicaciones] };
    }
    case 'PEDIR': {
      const { publicacion, kg, comprador } = action.payload;
      const { subtotal, comision, total } = calcularPedido(publicacion, kg);
      const pedido = {
        id: uid(),
        publicacionId: publicacion.id,
        producto: publicacion.producto,
        productor: publicacion.productor,
        comprador,
        kg,
        subtotal,
        comision,
        total,
        estado: 'confirmado',
        fecha: new Date().toISOString().slice(0, 10),
      };
      const publicaciones = state.publicaciones.map((p) => {
        if (p.id !== publicacion.id) return p;
        const restante = p.cantidadKg - kg;
        return {
          ...p,
          cantidadKg: Math.max(restante, 0),
          estado: restante <= 0 ? 'vendido' : 'disponible',
        };
      });
      return { ...state, publicaciones, pedidos: [pedido, ...state.pedidos] };
    }
    default:
      return state;
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, {
    publicaciones: PUBLICACIONES_INICIALES,
    pedidos: PEDIDOS_INICIALES,
  });
  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}

export const fmt = (n) => '$U ' + Number(n).toLocaleString('es-UY');
