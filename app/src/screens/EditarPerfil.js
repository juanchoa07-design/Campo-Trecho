import React, { useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme';
import { useStore } from '../store';
import { Pantalla, Encabezado, Tarjeta, Boton, Campo } from '../components';

export default function EditarPerfil({ volver }) {
  const { state, api } = useStore();
  const u = state.usuarioActual;

  const [nombre,  setNombre]  = useState(u.nombre  ?? '');
  const [negocio, setNegocio] = useState(u.negocio ?? '');
  const [zona,    setZona]    = useState(u.zona    ?? '');
  const [fotoUri, setFotoUri] = useState(u.foto_url ?? u.fotoUri ?? null);
  const [guardando, setGuardando] = useState(false);

  const elegirFoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tu galería para subir fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.75,
    });
    if (!result.canceled) setFotoUri(result.assets[0].uri);
  };

  const guardar = async () => {
    if (!nombre.trim()) {
      Alert.alert('Falta tu nombre', 'El nombre no puede estar vacío.');
      return;
    }
    setGuardando(true);
    try {
      const cambios = { nombre: nombre.trim() };
      if (u.rol === 'productor') {
        cambios.negocio = negocio.trim() || null;
        cambios.zona    = zona.trim()    || null;
      }
      if (fotoUri && fotoUri !== u.foto_url) cambios.fotoUri = fotoUri;
      await api.actualizarPerfil(cambios);
      Alert.alert('Perfil actualizado', '', [{ text: 'OK', onPress: volver }]);
    } catch (e) {
      Alert.alert('Error al guardar', e.message || 'Intentá de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const inicial = (u.negocio || u.nombre || '?')[0].toUpperCase();

  return (
    <Pantalla>
      <Encabezado titulo="Editar perfil" onAtras={volver} />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Foto de perfil */}
        <View style={s.fotoWrap}>
          <TouchableOpacity onPress={elegirFoto} activeOpacity={0.85}>
            {fotoUri ? (
              <Image source={{ uri: fotoUri }} style={s.foto} />
            ) : (
              <View style={s.fotoPlaceholder}>
                <Text style={s.fotoInicial}>{inicial}</Text>
              </View>
            )}
            <View style={s.fotoBadge}>
              <Text style={s.fotoBadgeTxt}>📷</Text>
            </View>
          </TouchableOpacity>
          <Text style={s.fotoHint}>{u.rol === 'productor' ? 'Tocá para cambiar la foto del negocio' : 'Tocá para cambiar tu foto de perfil'}</Text>
        </View>

        <Tarjeta>
          <Text style={s.seccion}>Datos personales</Text>
          <Campo etiqueta="Nombre completo" placeholder="Tu nombre" value={nombre} onChangeText={setNombre} />
        </Tarjeta>

        {u.rol === 'productor' && (
          <Tarjeta>
            <Text style={s.seccion}>Datos del negocio</Text>
            <Campo etiqueta="Nombre del establecimiento" placeholder="Establecimiento García" value={negocio} onChangeText={setNegocio} />
            <Campo etiqueta="Zona" placeholder="Sauce, Canelones" value={zona} onChangeText={setZona} />
          </Tarjeta>
        )}

        <View style={{ paddingHorizontal: 16 }}>
          {guardando ? (
            <ActivityIndicator color={colors.verde} style={{ marginTop: 20 }} />
          ) : (
            <Boton titulo="Guardar cambios" onPress={guardar} />
          )}
        </View>
      </ScrollView>
    </Pantalla>
  );
}

const s = StyleSheet.create({
  fotoWrap: { alignItems: 'center', paddingVertical: 28 },
  foto: { width: 110, height: 110, borderRadius: 22, borderWidth: 3, borderColor: colors.verde },
  fotoPlaceholder: {
    width: 110, height: 110, borderRadius: 22,
    backgroundColor: colors.verdeFondo, borderWidth: 2, borderColor: colors.verdeClaro,
    alignItems: 'center', justifyContent: 'center',
  },
  fotoInicial: { fontSize: 44, fontWeight: '900', color: colors.verde },
  fotoBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: colors.verde, borderRadius: 999,
    width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.blanco,
  },
  fotoBadgeTxt: { fontSize: 14 },
  fotoHint: { marginTop: 10, fontSize: 13, color: colors.textoSuave },
  seccion: { fontSize: 13, fontWeight: '700', color: colors.textoSuave, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
});
