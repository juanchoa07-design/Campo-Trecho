import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StoreProvider, useStore } from './src/store';
import Intro from './src/screens/Intro';
import Login from './src/screens/Login';
import Productor from './src/screens/Productor';
import Comprador from './src/screens/Comprador';

export default function App() {
  const [introVista, setIntroVista] = useState(false);

  return (
    <StoreProvider>
      <StatusBar style="light" />
      {!introVista ? (
        <Intro onFinish={() => setIntroVista(true)} />
      ) : (
        <Rutas />
      )}
    </StoreProvider>
  );
}

function Rutas() {
  const { state, api } = useStore();
  const { usuarioActual, cargando } = state;

  // Al montar, intenta restaurar sesión de Supabase (si está configurado)
  useEffect(() => { api.restaurarSesion(); }, []);

  if (cargando) return null; // pantalla en blanco mientras carga
  if (!usuarioActual) return <Login />;

  const salir = () => api.logout();

  if (usuarioActual.rol === 'productor') return <Productor salir={salir} />;
  return <Comprador salir={salir} />;
}
