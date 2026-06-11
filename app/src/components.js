import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { colors } from './theme';

export function Pantalla({ children }) {
  return <View style={s.pantalla}>{children}</View>;
}

export function Encabezado({ titulo, onAtras }) {
  return (
    <View style={s.encabezado}>
      {onAtras ? (
        <TouchableOpacity onPress={onAtras} style={s.atras}>
          <Text style={s.atrasTxt}>‹</Text>
        </TouchableOpacity>
      ) : (
        <View style={s.atras} />
      )}
      <Text style={s.encabezadoTitulo}>{titulo}</Text>
      <View style={s.atras} />
    </View>
  );
}

export function Tarjeta({ children, style }) {
  return <View style={[s.tarjeta, style]}>{children}</View>;
}

export function Boton({ titulo, onPress, variante = 'primario', deshabilitado }) {
  const fondo =
    deshabilitado ? colors.borde
    : variante === 'primario' ? colors.verde
    : variante === 'naranja' ? colors.naranja
    : colors.blanco;
  const texto = variante === 'secundario' ? colors.verde : colors.blanco;
  return (
    <TouchableOpacity
      onPress={deshabilitado ? undefined : onPress}
      style={[s.boton, { backgroundColor: fondo }, variante === 'secundario' && s.botonBorde]}
      activeOpacity={0.8}
    >
      <Text style={[s.botonTxt, { color: deshabilitado ? colors.textoSuave : texto }]}>
        {titulo}
      </Text>
    </TouchableOpacity>
  );
}

export function Campo({ etiqueta, ...props }) {
  return (
    <View style={s.campo}>
      <Text style={s.etiqueta}>{etiqueta}</Text>
      <TextInput
        style={s.input}
        placeholderTextColor={colors.textoSuave}
        {...props}
      />
    </View>
  );
}

export function Etiqueta({ texto, color = colors.verdeClaro }) {
  return (
    <View style={[s.chip, { backgroundColor: color + '22', borderColor: color }]}>
      <Text style={[s.chipTxt, { color }]}>{texto}</Text>
    </View>
  );
}

export function Vacio({ mensaje }) {
  return (
    <View style={s.vacio}>
      <Text style={s.vacioTxt}>{mensaje}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colors.crema },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.verde,
    paddingTop: 56,
    paddingBottom: 14,
    paddingHorizontal: 12,
  },
  encabezadoTitulo: { color: colors.blanco, fontSize: 18, fontWeight: '700' },
  atras: { width: 36, alignItems: 'center' },
  atrasTxt: { color: colors.blanco, fontSize: 30, lineHeight: 32 },
  tarjeta: {
    backgroundColor: colors.blanco,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.borde,
  },
  boton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  botonBorde: { borderWidth: 1.5, borderColor: colors.verde },
  botonTxt: { fontSize: 16, fontWeight: '700' },
  campo: { marginTop: 12 },
  etiqueta: { fontSize: 13, fontWeight: '600', color: colors.texto, marginBottom: 6 },
  input: {
    backgroundColor: colors.blanco,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.texto,
  },
  chip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  chipTxt: { fontSize: 12, fontWeight: '700' },
  vacio: { alignItems: 'center', padding: 40 },
  vacioTxt: { color: colors.textoSuave, fontSize: 15, textAlign: 'center' },
});
