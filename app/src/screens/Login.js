import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { colors } from '../theme';
import { useStore } from '../store';
import { Campo, Boton } from '../components';

const logo = require('../../assets/logo.png');

export default function Login() {
  const { state, dispatch } = useStore();
  const [modo, setModo] = useState('login'); // 'login' | 'registro'
  const [rol, setRol] = useState('comprador');
  const [nombre, setNombre] = useState('');
  const [negocio, setNegocio] = useState('');
  const [zona, setZona] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (state.error) {
      Alert.alert('Error', state.error, [
        { text: 'OK', onPress: () => dispatch({ type: 'LIMPIAR_ERROR' }) },
      ]);
    }
  }, [state.error]);

  const limpiarFormulario = () => {
    setNombre(''); setNegocio(''); setZona(''); setEmail(''); setPassword('');
    dispatch({ type: 'LIMPIAR_ERROR' });
  };

  const cambiarModo = (m) => { setModo(m); limpiarFormulario(); };

  const entrar = () => {
    if (!email.trim() || !password) {
      Alert.alert('Faltan datos', 'Ingresá tu email y contraseña.');
      return;
    }
    dispatch({ type: 'LOGIN', payload: { email: email.trim().toLowerCase(), password } });
  };

  const registrar = () => {
    if (!nombre.trim() || !email.trim() || !password) {
      Alert.alert('Faltan datos', 'Completá nombre, email y contraseña.');
      return;
    }
    if (rol === 'productor' && !negocio.trim()) {
      Alert.alert('Faltan datos', 'Ingresá el nombre de tu negocio.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Contraseña muy corta', 'Usá al menos 6 caracteres.');
      return;
    }
    dispatch({
      type: 'REGISTRAR',
      payload: {
        email: email.trim().toLowerCase(),
        password,
        rol,
        nombre: nombre.trim(),
        negocio: negocio.trim() || null,
        zona: zona.trim() || null,
      },
    });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.fondo} contentContainerStyle={s.contenido} keyboardShouldPersistTaps="handled">
        <Image source={logo} style={s.logo} resizeMode="contain" />
        <Text style={s.marca}>Campo Trecho</Text>
        <Text style={s.lema}>Del productor a tu puerta.{'\n'}Sin intermediarios.</Text>

        <View style={s.tarjeta}>
          {/* Tabs login / registro */}
          <View style={s.tabs}>
            <TouchableOpacity
              style={[s.tab, modo === 'login' && s.tabActivo]}
              onPress={() => cambiarModo('login')}
            >
              <Text style={[s.tabTxt, modo === 'login' && s.tabTxtActivo]}>Iniciar sesión</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.tab, modo === 'registro' && s.tabActivo]}
              onPress={() => cambiarModo('registro')}
            >
              <Text style={[s.tabTxt, modo === 'registro' && s.tabTxtActivo]}>Registrarse</Text>
            </TouchableOpacity>
          </View>

          {modo === 'registro' && (
            <>
              {/* Selector de rol */}
              <Text style={s.seccionTitulo}>Soy...</Text>
              <View style={s.roles}>
                <TouchableOpacity
                  style={[s.rolBtn, rol === 'comprador' && s.rolActivo]}
                  onPress={() => setRol('comprador')}
                >
                  <Text style={s.rolEmoji}>🍽️</Text>
                  <Text style={[s.rolTxt, rol === 'comprador' && s.rolTxtActivo]}>Comprador</Text>
                  <Text style={s.rolSub}>Restaurante, feria{'\n'}o almacén</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.rolBtn, rol === 'productor' && s.rolActivo]}
                  onPress={() => setRol('productor')}
                >
                  <Text style={s.rolEmoji}>👨‍🌾</Text>
                  <Text style={[s.rolTxt, rol === 'productor' && s.rolTxtActivo]}>Productor</Text>
                  <Text style={s.rolSub}>Publicá tu{'\n'}cosecha</Text>
                </TouchableOpacity>
              </View>

              <Campo etiqueta="Tu nombre completo" placeholder="Juan García" value={nombre} onChangeText={setNombre} />

              {rol === 'productor' && (
                <>
                  <Campo
                    etiqueta="Nombre del negocio / establecimiento"
                    placeholder="Establecimiento García"
                    value={negocio}
                    onChangeText={setNegocio}
                  />
                  <Campo
                    etiqueta="Zona (ej: Sauce, Canelones)"
                    placeholder="Sauce, Canelones"
                    value={zona}
                    onChangeText={setZona}
                  />
                </>
              )}
            </>
          )}

          <Campo
            etiqueta="Email"
            placeholder="correo@ejemplo.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Campo
            etiqueta="Contraseña"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Boton
            titulo={modo === 'login' ? 'Entrar' : 'Crear cuenta'}
            onPress={modo === 'login' ? entrar : registrar}
          />
        </View>

        <Text style={s.pie}>Canelones → Montevideo · Beta v0.1</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colors.verde },
  contenido: { alignItems: 'center', paddingTop: 60, paddingBottom: 40, paddingHorizontal: 20 },
  logo: { width: 150, height: 150 },
  marca: { fontSize: 30, fontWeight: '900', color: colors.blanco, marginTop: 4 },
  lema: { fontSize: 14, color: '#CDE3D3', textAlign: 'center', marginTop: 6, lineHeight: 21, marginBottom: 24 },
  tarjeta: { backgroundColor: colors.blanco, borderRadius: 20, padding: 20, width: '100%' },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.verdeFondo,
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActivo: { backgroundColor: colors.blanco },
  tabTxt: { fontSize: 14, fontWeight: '600', color: colors.textoSuave },
  tabTxtActivo: { color: colors.verde },
  seccionTitulo: { fontSize: 13, fontWeight: '600', color: colors.textoSuave, marginBottom: 8 },
  roles: { flexDirection: 'row', gap: 10 },
  rolBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.borde,
    alignItems: 'center',
  },
  rolActivo: { borderColor: colors.verde, backgroundColor: colors.verdeFondo },
  rolEmoji: { fontSize: 26, marginBottom: 4 },
  rolTxt: { fontSize: 14, fontWeight: '700', color: colors.textoSuave },
  rolTxtActivo: { color: colors.verde },
  rolSub: { fontSize: 11, color: colors.textoSuave, textAlign: 'center', marginTop: 2 },
  pie: { color: '#9FC3AA', fontSize: 12, marginTop: 24 },
});
