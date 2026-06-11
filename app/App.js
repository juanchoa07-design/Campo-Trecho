import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { StoreProvider } from './src/store';
import { colors } from './src/theme';
import Productor from './src/screens/Productor';
import Comprador from './src/screens/Comprador';

// Campo Trecho — Del productor a tu puerta. Sin intermediarios.
// Punto de entrada: selección de rol → flujo de productor o comprador.

export default function App() {
  const [rol, setRol] = useState(null);

  return (
    <StoreProvider>
      <StatusBar style="light" />
      {rol === 'productor' ? (
        <Productor salir={() => setRol(null)} />
      ) : rol === 'comprador' ? (
        <Comprador salir={() => setRol(null)} />
      ) : (
        <Bienvenida elegirRol={setRol} />
      )}
    </StoreProvider>
  );
}

function Bienvenida({ elegirRol }) {
  return (
    <View style={s.fondo}>
      <View style={s.centro}>
        <Text style={s.logo}>🌾</Text>
        <Text style={s.marca}>Campo Trecho</Text>
        <Text style={s.lema}>Del productor a tu puerta.{'\n'}Sin intermediarios.</Text>
      </View>

      <View style={s.botones}>
        <TouchableOpacity style={s.boton} onPress={() => elegirRol('productor')} activeOpacity={0.85}>
          <Text style={s.botonEmoji}>👨‍🌾</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.botonTitulo}>Soy productor</Text>
            <Text style={s.botonSub}>Publicá tu cosecha y compartí el flete</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={s.boton} onPress={() => elegirRol('comprador')} activeOpacity={0.85}>
          <Text style={s.botonEmoji}>🍽️</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.botonTitulo}>Soy comprador</Text>
            <Text style={s.botonSub}>Restaurante, feria o almacén</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={s.pie}>Canelones → Montevideo · Beta</Text>
    </View>
  );
}

const s = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colors.verde, justifyContent: 'space-between' },
  centro: { alignItems: 'center', marginTop: 120 },
  logo: { fontSize: 56 },
  marca: { fontSize: 34, fontWeight: '900', color: colors.blanco, marginTop: 8 },
  lema: { fontSize: 16, color: '#CDE3D3', textAlign: 'center', marginTop: 10, lineHeight: 23 },
  botones: { paddingHorizontal: 20 },
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.blanco,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
  },
  botonEmoji: { fontSize: 30, marginRight: 14 },
  botonTitulo: { fontSize: 17, fontWeight: '800', color: colors.texto },
  botonSub: { fontSize: 13, color: colors.textoSuave, marginTop: 2 },
  pie: { textAlign: 'center', color: '#9FC3AA', fontSize: 12, marginBottom: 28 },
});
