import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TextInput } from 'react-native';
import { colors } from '../theme';
import { useStore, calcularPedido, promedioCalificacion, fmt } from '../store';
import { Pantalla, Encabezado, Tarjeta, Boton, Campo, Etiqueta, Vacio, Estrellas } from '../components';

export default function Comprador({ salir }) {
  const [vista, setVista] = useState('catalogo');
  const [seleccion, setSeleccion] = useState(null);

  if (vista === 'detalle' && seleccion)
    return (
      <Detalle
        publicacion={seleccion}
        volver={() => setVista('catalogo')}
        irPedidos={() => setVista('pedidos')}
      />
    );
  if (vista === 'pedidos') return <MisPedidos volver={() => setVista('catalogo')} />;
  return (
    <Catalogo
      salir={salir}
      verPedidos={() => setVista('pedidos')}
      elegir={(p) => { setSeleccion(p); setVista('detalle'); }}
    />
  );
}

function Catalogo({ elegir, verPedidos, salir }) {
  const { state } = useStore();
  const { publicaciones, calificaciones, usuarioActual } = state;
  const disponibles = publicaciones.filter((p) => p.estado === 'disponible');

  return (
    <Pantalla>
      <Encabezado titulo="Campo Trecho · Comprador" onAtras={salir} />
      <ScrollView>
        <Tarjeta>
          <Text style={s.saludo}>Hola, {usuarioActual.nombre} 🥬</Text>
          <Text style={s.sub}>
            Comprá directo a productores de Canelones. Sin intermediarios, con logística incluida.
          </Text>
        </Tarjeta>

        {disponibles.length === 0 && <Vacio mensaje="No hay ofertas disponibles en este momento." />}
        {disponibles.map((p) => {
          const rating = promedioCalificacion(calificaciones, p.productorId);
          return (
            <Tarjeta key={p.id}>
              <View style={s.filaEntre}>
                <Text style={s.titulo}>{p.producto}</Text>
                <Text style={s.precio}>{fmt(p.precioKg)}/kg</Text>
              </View>
              <Text style={s.detalle}>{p.cantidadKg} kg disponibles</Text>
              <Text style={s.negocioNombre}>🏪 {p.productorNegocio || p.productorNombre}</Text>
              <View style={{ marginTop: 4 }}>
                {rating ? (
                  <Estrellas puntuacion={rating.promedio} cantidad={rating.cantidad} />
                ) : (
                  <Text style={s.detalleSuave}>Sin calificaciones aún</Text>
                )}
              </View>
              <Text style={s.detalleSuave}>📅 Entrega: {p.fechaEntrega} · 📍 {p.destino}</Text>
              <Boton titulo="Hacer pedido" onPress={() => elegir(p)} />
            </Tarjeta>
          );
        })}

        <View style={{ padding: 16 }}>
          <Boton titulo="Mis pedidos" variante="secundario" onPress={verPedidos} />
        </View>
      </ScrollView>
    </Pantalla>
  );
}

function Detalle({ publicacion, volver, irPedidos }) {
  const { state, dispatch } = useStore();
  const { usuarioActual, calificaciones } = state;
  const [kg, setKg] = useState('');
  const cantidad = Number(kg);
  const valido = cantidad > 0 && cantidad <= publicacion.cantidadKg;

  const { subtotal, comisionComprador, totalComprador, nettoVendedor } = valido
    ? calcularPedido(publicacion, cantidad)
    : { subtotal: 0, comisionComprador: 0, totalComprador: 0, nettoVendedor: 0 };

  const rating = promedioCalificacion(calificaciones, publicacion.productorId);

  const confirmar = () => {
    dispatch({
      type: 'PEDIR',
      payload: {
        publicacion,
        kg: cantidad,
        compradorId: usuarioActual.id,
        compradorNombre: usuarioActual.nombre,
      },
    });
    Alert.alert(
      'Pedido confirmado ✅',
      `${cantidad} kg de ${publicacion.producto} por ${fmt(totalComprador)}.\n\nEl pago va directo al productor. Te avisaremos cuando el flete esté en camino.`,
      [{ text: 'Ver mis pedidos', onPress: irPedidos }, { text: 'OK' }]
    );
  };

  return (
    <Pantalla>
      <Encabezado titulo="Hacer pedido" onAtras={volver} />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <Tarjeta>
          <Text style={s.titulo}>{publicacion.producto}</Text>
          <Text style={s.detalle}>{fmt(publicacion.precioKg)}/kg · {publicacion.cantidadKg} kg disponibles</Text>
          <Text style={s.negocioNombre}>🏪 {publicacion.productorNegocio || publicacion.productorNombre}</Text>
          {rating ? (
            <View style={{ marginTop: 6 }}>
              <Estrellas puntuacion={rating.promedio} cantidad={rating.cantidad} />
            </View>
          ) : null}
          <Etiqueta texto={`Entrega ${publicacion.fechaEntrega}`} style={{ marginTop: 8 }} />
        </Tarjeta>

        <View style={{ paddingHorizontal: 16 }}>
          <Campo
            etiqueta={`¿Cuántos kg querés? (máx. ${publicacion.cantidadKg})`}
            placeholder="Ej: 50"
            keyboardType="numeric"
            value={kg}
            onChangeText={setKg}
          />
        </View>

        <Tarjeta>
          <Fila label="Subtotal" valor={fmt(subtotal)} />
          <Fila label="Servicio Campo Trecho (5%)" valor={fmt(comisionComprador)} />
          <View style={s.separador} />
          <Fila label="Total a pagar" valor={fmt(totalComprador)} negrita />
          <Text style={s.nota}>
            El productor recibe {fmt(nettoVendedor)} (descontado el 5% de la plataforma).
          </Text>
        </Tarjeta>

        <View style={{ paddingHorizontal: 16 }}>
          <Boton titulo="Confirmar pedido" onPress={confirmar} deshabilitado={!valido} />
        </View>
      </ScrollView>
    </Pantalla>
  );
}

function MisPedidos({ volver }) {
  const { state, dispatch } = useStore();
  const { usuarioActual, pedidos } = state;
  const misPedidos = pedidos.filter((p) => p.compradorId === usuarioActual.id);
  const [calificando, setCalificando] = useState(null); // pedidoId en calificación
  const [estrellas, setEstrellas] = useState(0);
  const [comentario, setComentario] = useState('');

  const enviarCalificacion = (pedido) => {
    if (estrellas === 0) {
      Alert.alert('Seleccioná una calificación', 'Tocá las estrellas para calificar.');
      return;
    }
    dispatch({
      type: 'CALIFICAR',
      payload: {
        pedidoId: pedido.id,
        productorId: pedido.productorId,
        compradorId: usuarioActual.id,
        compradorNombre: usuarioActual.nombre,
        puntuacion: estrellas,
        comentario: comentario.trim(),
      },
    });
    setCalificando(null);
    setEstrellas(0);
    setComentario('');
    Alert.alert('¡Gracias por tu calificación! ⭐');
  };

  return (
    <Pantalla>
      <Encabezado titulo="Mis pedidos" onAtras={volver} />
      <ScrollView>
        {misPedidos.length === 0 && <Vacio mensaje="Todavía no hiciste ningún pedido." />}
        {misPedidos.map((p) => (
          <Tarjeta key={p.id}>
            <View style={s.filaEntre}>
              <Text style={s.titulo}>{p.producto}</Text>
              <Etiqueta texto="Confirmado" />
            </View>
            <Text style={s.detalle}>{p.kg} kg · Total {fmt(p.totalComprador)}</Text>
            <Text style={s.negocioNombre}>🏪 {p.productorNegocio || p.productorNombre}</Text>
            <Text style={s.detalleSuave}>📅 {p.fecha}</Text>

            {!p.calificado && calificando !== p.id && (
              <Boton
                titulo="Calificar productor"
                variante="secundario"
                onPress={() => { setCalificando(p.id); setEstrellas(0); setComentario(''); }}
              />
            )}

            {p.calificado && (
              <Text style={[s.detalleSuave, { marginTop: 8, color: colors.verdeClaro, fontWeight: '600' }]}>
                ✅ Ya calificaste este pedido
              </Text>
            )}

            {calificando === p.id && (
              <View style={s.calificacionBox}>
                <Text style={s.calificacionTitulo}>¿Cómo fue tu experiencia?</Text>
                <Estrellas puntuacion={estrellas} onSelect={setEstrellas} size="lg" />
                <TextInput
                  style={s.comentarioInput}
                  placeholder="Comentario opcional..."
                  placeholderTextColor={colors.textoSuave}
                  value={comentario}
                  onChangeText={setComentario}
                  multiline
                />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Boton titulo="Enviar" onPress={() => enviarCalificacion(p)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Boton titulo="Cancelar" variante="secundario" onPress={() => setCalificando(null)} />
                  </View>
                </View>
              </View>
            )}
          </Tarjeta>
        ))}
      </ScrollView>
    </Pantalla>
  );
}

function Fila({ label, valor, negrita }) {
  return (
    <View style={s.filaEntre}>
      <Text style={[s.detalle, negrita && s.negrita]}>{label}</Text>
      <Text style={[s.detalle, negrita && s.negrita]}>{valor}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  saludo: { fontSize: 19, fontWeight: '800', color: colors.texto },
  sub: { marginTop: 6, color: colors.textoSuave, fontSize: 14, lineHeight: 20 },
  filaEntre: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  titulo: { fontSize: 16, fontWeight: '700', color: colors.texto },
  precio: { fontSize: 16, fontWeight: '800', color: colors.verde },
  negocioNombre: { fontSize: 13, fontWeight: '600', color: colors.verde, marginTop: 4 },
  detalle: { fontSize: 14, color: colors.texto, marginTop: 4 },
  detalleSuave: { fontSize: 13, color: colors.textoSuave, marginTop: 4 },
  negrita: { fontWeight: '800' },
  nota: { marginTop: 10, fontSize: 12, color: colors.textoSuave },
  separador: { height: 1, backgroundColor: colors.borde, marginVertical: 10 },
  calificacionBox: {
    marginTop: 14,
    padding: 14,
    backgroundColor: colors.verdeFondo,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borde,
  },
  calificacionTitulo: { fontSize: 14, fontWeight: '700', color: colors.texto, marginBottom: 10 },
  comentarioInput: {
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    marginBottom: 4,
    fontSize: 14,
    color: colors.texto,
    backgroundColor: colors.blanco,
    minHeight: 60,
  },
});
