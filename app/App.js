import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StoreProvider, useStore } from './src/store';
import Login from './src/screens/Login';
import Productor from './src/screens/Productor';
import Comprador from './src/screens/Comprador';

export default function App() {
  return (
    <StoreProvider>
      <StatusBar style="light" />
      <Rutas />
    </StoreProvider>
  );
}

function Rutas() {
  const { state, dispatch } = useStore();
  const { usuarioActual } = state;

  if (!usuarioActual) return <Login />;

  const salir = () => dispatch({ type: 'LOGOUT' });

  if (usuarioActual.rol === 'productor') return <Productor salir={salir} />;
  return <Comprador salir={salir} />;
}
