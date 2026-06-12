import React, { createContext, useContext, useReducer } from 'react';

// Comisiones de la plataforma
export const COMISION_COMPRADOR = 0.05; // 5% que paga el comprador sobre el subtotal
export const COMISION_VENDEDOR = 0.05;  // 5% que descuenta la plataforma al vendedor
export const COSTO_FLETE_BASE = 2200;   // UYU por viaje Canelones → Montevideo (estimado MVP)

let nextId = 1;
const uid = () => String(nextId++);

// ---------- Lógica de flete compartido ----------
export function agruparFletes(publicaciones) {
  const activas = publicaciones.filter((p) => p.estado !== 'vendido');
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

  return grupos.map((g) => {
    const totalKg = g.publicaciones.reduce((s, p) => s + p.cantidadKg, 0);
    return {
      ...g,
      totalKg,
      costoTotal: COSTO_FLETE_BASE,
      detalle: g.publicaciones.map((p) => {
        const proporcion = totalKg > 0 ? p.cantidadKg / totalKg : 0;
        const costoCompartido = Math.round(COSTO_FLETE_BASE * proporcion);
        return {
          publicacionId: p.id,
          productor: p.productorNombre,
          producto: p.producto,
          kg: p.cantidadKg,
          costoCompartido,
          ahorro: COSTO_FLETE_BASE - costoCompartido,
          ahorroPct: Math.round((1 - costoCompartido / COSTO_FLETE_BASE) * 100),
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
  const comisionComprador = Math.round(subtotal * COMISION_COMPRADOR);
  const comisionVendedor = Math.round(subtotal * COMISION_VENDEDOR);
  return {
    subtotal,
    comisionComprador,
    comisionVendedor,
    totalComprador: subtotal + comisionComprador,
    nettoVendedor: subtotal - comisionVendedor,
  };
}

// ---------- Calificaciones ----------
export function promedioCalificacion(calificaciones, productorId) {
  const mias = calificaciones.filter((c) => c.productorId === productorId);
  if (mias.length === 0) return null;
  const promedio = mias.reduce((s, c) => s + c.puntuacion, 0) / mias.length;
  return { promedio: promedio.toFixed(1), cantidad: mias.length };
}

// ---------- Estado global ----------
const ESTADO_INICIAL = {
  usuarios: [],
  usuarioActual: null,
  publicaciones: [],
  pedidos: [],
  calificaciones: [],
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'REGISTRAR': {
      const { email, password, rol, nombre, negocio, zona } = action.payload;
      if (state.usuarios.find((u) => u.email === email)) {
        return { ...state, error: 'El email ya está registrado.' };
      }
      const usuario = {
        id: uid(),
        email,
        password,
        rol,
        nombre,
        negocio: negocio || null,
        zona: zona || null,
      };
      return { ...state, usuarios: [...state.usuarios, usuario], usuarioActual: usuario, error: null };
    }

    case 'LOGIN': {
      const { email, password } = action.payload;
      const usuario = state.usuarios.find((u) => u.email === email && u.password === password);
      if (!usuario) return { ...state, error: 'Email o contraseña incorrectos.' };
      return { ...state, usuarioActual: usuario, error: null };
    }

    case 'LOGOUT':
      return { ...state, usuarioActual: null };

    case 'LIMPIAR_ERROR':
      return { ...state, error: null };

    case 'PUBLICAR': {
      const pub = { id: uid(), estado: 'disponible', ...action.payload };
      return { ...state, publicaciones: [pub, ...state.publicaciones] };
    }

    case 'PEDIR': {
      const { publicacion, kg, compradorId, compradorNombre } = action.payload;
      const { subtotal, comisionComprador, comisionVendedor, totalComprador, nettoVendedor } =
        calcularPedido(publicacion, kg);
      const pedido = {
        id: uid(),
        publicacionId: publicacion.id,
        producto: publicacion.producto,
        productorId: publicacion.productorId,
        productorNombre: publicacion.productorNombre,
        productorNegocio: publicacion.productorNegocio,
        compradorId,
        compradorNombre,
        kg,
        subtotal,
        comisionComprador,
        comisionVendedor,
        totalComprador,
        nettoVendedor,
        estado: 'confirmado',
        calificado: false,
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

    case 'CALIFICAR': {
      const { pedidoId, productorId, compradorId, compradorNombre, puntuacion, comentario } = action.payload;
      const calificacion = {
        id: uid(),
        pedidoId,
        productorId,
        compradorId,
        compradorNombre,
        puntuacion,
        comentario,
        fecha: new Date().toISOString().slice(0, 10),
      };
      const pedidos = state.pedidos.map((p) =>
        p.id === pedidoId ? { ...p, calificado: true } : p
      );
      return {
        ...state,
        calificaciones: [...state.calificaciones, calificacion],
        pedidos,
      };
    }

    default:
      return state;
  }
}

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, ESTADO_INICIAL);
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
