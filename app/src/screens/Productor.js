import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { colors } from '../theme';
import { useStore, agruparFletes, promedioCalificacion, fmt, COSTO_FLETE_BASE } from '../store';
import { Pantalla, Encabezado, Tarjeta, Boton, Campo, Etiqueta, Vacio, Estrellas } from '../components';

export default function Productor({ salir }) {
  const [vista, setVista] = useState('inicio');
  if (vista === 'publicar') return <Publicar volver={() => setVista('inicio')} />;
  if (vista === 'publicaciones') return <MisPublicaciones volver={() => setVista('inicio')} />;
  if (vista === 'fletes') return <Fletes volver={() => setVista('inicio')} />;
  if (vista === 'negocio') return <MiNegocio volver={() => setVista('inicio')} />;
  return <Inicio ir={setVista} salir={salir} />;
}

function Inicio({ ir, salir }) {
  const { state } = useStore();
  const { usuarioActual, publicaciones, calificaciones } = state;

  const misPublicaciones = publicaciones.filter((p) => p.productorId === usuarioActual.id);
  const activas = misPublicaciones.filter((p) => p.estado === 'disponible').length;
  const fletes = agruparFletes(publicaciones);
  const compartidos = fletes.filter((f) => f.publicaciones.length > 1).length;
  const rating = promedioCalificacion(calificaciones, usuarioActual.id);

  return (
    <Pantalla>
      <Encabezado titulo="Campo Trecho · Productor" onAtras={salir} />
      <ScrollView>
        <Tarjeta>
          <Text style={s.saludo}>¡Buen día, {usuarioActual.nombre}! 🌱</Text>
          <Text style={s.negocioNombre}>{usuarioActual.negocio}</Text>
          {usuarioActual.zona ? <Text style={s.sub}>{usuarioActual.zona}</Text> : null}
          {rating ? (
            <View style={{ marginTop: 8 }}>
              <Estrellas puntuacion={rating.promedio} cantidad={rating.cantidad} />
            </View>
          ) : (
            <Text style={[s.sub, { marginTop: 8 }]}>Aún sin calificaciones</Text>
          )}
        </Tarjeta>

        <View style={s.fila}>
          <Tarjeta style={s.mitad}>
            <Text style={s.numero}>{activas}</Text>
            <Text style={s.numeroLabel}>Ofertas activas</Text>
          </Tarjeta>
          <Tarjeta style={s.mitad}>
            <Text style={s.numero}>{compartidos}</Text>
            <Text style={s.numeroLabel}>Fletes compartidos</Text>
          </Tarjeta>
        </View>

        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          <Boton titulo="+ Publicar cosecha" onPress={() => ir('publicar')} />
          <Boton titulo="Mis publicaciones" variante="secundario" onPress={() => ir('publicaciones')} />
          <Boton titulo="Ver fletes compartidos" variante="secundario" onPress={() => ir('fletes')} />
          <Boton titulo="Mi negocio y calificaciones" variante="secundario" onPress={() => ir('negocio')} />
        </View>
      </ScrollView>
    </Pantalla>
  );
}

function Publicar({ volver }) {
  const { state, dispatch } = useStore();
  const { usuarioActual } = state;
  const [producto, setProducto] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [precio, setPrecio] = useState('');
  const [destino, setDestino] = useState('Montevideo Centro');
  const [fecha, setFecha] = useState('2026-06-15');

  const valido = producto && Number(cantidad) > 0 && Number(precio) > 0 && destino && fecha;

  const publicar = () => {
    dispatch({
      type: 'PUBLICAR',
      payload: {
        productorId: usuarioActual.id,
        productorNombre: usuarioActual.nombre,
        productorNegocio: usuarioActual.negocio,
        zona: usuarioActual.zona || '',
        producto,
        cantidadKg: Number(cantidad),
        precioKg: Number(precio),
        destino,
        fechaEntrega: fecha,
      },
    });
    Alert.alert(
      'Cosecha publicada ✅',
      'Tu oferta ya está visible para los compradores. Si hay otros productores con el mismo destino, te propondremos un flete compartido.'
    );
    volver();
  };

  return (
    <Pantalla>
      <Encabezado titulo="Publicar cosecha" onAtras={volver} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Tarjeta style={{ marginHorizontal: 0 }}>
          <Text style={s.sub}>
            Publicando como <Text style={{ fontWeight: '700', color: colors.verde }}>{usuarioActual.negocio || usuarioActual.nombre}</Text>
          </Text>
          <Text style={[s.sub, { marginTop: 4 }]}>
            La plataforma cobrará un 5% de la venta sobre el precio que fijes.
          </Text>
        </Tarjeta>

        <Campo etiqueta="Producto" placeholder="Ej: Tomate redondo" value={producto} onChangeText={setProducto} />
        <Campo etiqueta="Cantidad (kg)" placeholder="Ej: 300" keyboardType="numeric" value={cantidad} onChangeText={setCantidad} />
        <Campo etiqueta="Precio por kg ($U)" placeholder="Ej: 38" keyboardType="numeric" value={precio} onChangeText={setPrecio} />
        <Campo etiqueta="Destino" placeholder="Ej: Montevideo Centro" value={destino} onChangeText={setDestino} />
        <Campo etiqueta="Fecha de entrega (AAAA-MM-DD)" placeholder="2026-06-15" value={fecha} onChangeText={setFecha} />
        <Boton titulo="Publicar" onPress={publicar} deshabilitado={!valido} />
      </ScrollView>
    </Pantalla>
  );
}

function MisPublicaciones({ volver }) {
  const { state } = useStore();
  const { usuarioActual, publicaciones } = state;
  const mias = publicaciones.filter((p) => p.productorId === usuarioActual.id);

  return (
    <Pantalla>
      <Encabezado titulo="Mis publicaciones" onAtras={volver} />
      <ScrollView>
        {mias.length === 0 && <Vacio mensaje="Todavía no publicaste ninguna cosecha." />}
        {mias.map((p) => (
          <Tarjeta key={p.id}>
            <View style={s.filaEntre}>
              <Text style={s.titulo}>{p.producto}</Text>
              <Etiqueta
                texto={p.estado === 'disponible' ? 'Disponible' : 'Vendido'}
                color={p.estado === 'disponible' ? colors.verdeClaro : colors.tierra}
              />
            </View>
            <Text style={s.detalle}>{p.cantidadKg} kg · {fmt(p.precioKg)}/kg</Text>
            <Text style={s.detalle}>📍 {p.destino} · 📅 {p.fechaEntrega}</Text>
          </Tarjeta>
        ))}
      </ScrollView>
    </Pantalla>
  );
}

function Fletes({ volver }) {
  const { state } = useStore();
  const fletes = agruparFletes(state.publicaciones);

  return (
    <Pantalla>
      <Encabezado titulo="Fletes compartidos" onAtras={volver} />
      <ScrollView>
        <Tarjeta style={{ backgroundColor: colors.verdeFondo }}>
          <Text style={s.detalle}>
            Flete individual de referencia: <Text style={s.negrita}>{fmt(COSTO_FLETE_BASE)}</Text>.
            Compartiendo, cada productor paga solo su parte proporcional por kg.
          </Text>
        </Tarjeta>
        {fletes.length === 0 && <Vacio mensaje="No hay fletes para agrupar todavía." />}
        {fletes.map((f) => (
          <Tarjeta key={f.id}>
            <View style={s.filaEntre}>
              <Text style={s.titulo}>🚚 {f.destino}</Text>
              <Etiqueta
                texto={f.publicaciones.length > 1 ? 'Compartido' : 'Esperando socios'}
                color={f.publicaciones.length > 1 ? colors.verdeClaro : colors.naranja}
              />
            </View>
            <Text style={s.detalle}>📅 {f.fecha} · {f.totalKg} kg en total</Text>
            <View style={s.separador} />
            {f.detalle.map((d) => (
              <View key={d.publicacionId} style={s.filaEntre}>
                <Text style={s.detalle}>{d.productor} · {d.kg} kg</Text>
                <Text style={s.negrita}>
                  {fmt(d.costoCompartido)}{' '}
                  {d.ahorroPct > 0 && <Text style={s.ahorro}>(-{d.ahorroPct}%)</Text>}
                </Text>
              </View>
            ))}
          </Tarjeta>
        ))}
      </ScrollView>
    </Pantalla>
  );
}

function MiNegocio({ volver }) {
  const { state } = useStore();
  const { usuarioActual, calificaciones } = state;
  const rating = promedioCalificacion(calificaciones, usuarioActual.id);
  const misCalificaciones = calificaciones.filter((c) => c.productorId === usuarioActual.id);

  return (
    <Pantalla>
      <Encabezado titulo="Mi negocio" onAtras={volver} />
      <ScrollView>
        <Tarjeta>
          <Text style={s.titulo}>{usuarioActual.negocio || usuarioActual.nombre}</Text>
          {usuarioActual.zona ? <Text style={s.detalle}>📍 {usuarioActual.zona}</Text> : null}
          <Text style={s.detalle}>✉️ {usuarioActual.email}</Text>
          {rating ? (
            <View style={{ marginTop: 10 }}>
              <Estrellas puntuacion={rating.promedio} cantidad={rating.cantidad} />
            </View>
          ) : (
            <Text style={[s.sub, { marginTop: 10 }]}>Todavía sin calificaciones de compradores.</Text>
          )}
        </Tarjeta>

        <Text style={s.seccion}>Calificaciones recibidas</Text>
        {misCalificaciones.length === 0 && (
          <Vacio mensaje="Cuando un comprador te califique, aparecerá aquí." />
        )}
        {misCalificaciones.map((c) => (
          <Tarjeta key={c.id}>
            <View style={s.filaEntre}>
              <Text style={s.negrita}>{c.compradorNombre}</Text>
              <Estrellas puntuacion={c.puntuacion} />
            </View>
            {c.comentario ? <Text style={s.detalle}>"{c.comentario}"</Text> : null}
            <Text style={s.detalleSuave}>📅 {c.fecha}</Text>
          </Tarjeta>
        ))}
      </ScrollView>
    </Pantalla>
  );
}

const s = StyleSheet.create({
  saludo: { fontSize: 19, fontWeight: '800', color: colors.texto },
  negocioNombre: { fontSize: 15, fontWeight: '700', color: colors.verde, marginTop: 2 },
  sub: { color: colors.textoSuave, fontSize: 13 },
  seccion: { fontSize: 14, fontWeight: '700', color: colors.textoSuave, paddingHorizontal: 20, marginTop: 16, marginBottom: 4 },
  fila: { flexDirection: 'row' },
  mitad: { flex: 1, alignItems: 'center' },
  filaEntre: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  numero: { fontSize: 28, fontWeight: '800', color: colors.verde },
  numeroLabel: { fontSize: 12, color: colors.textoSuave, marginTop: 2 },
  titulo: { fontSize: 16, fontWeight: '700', color: colors.texto },
  detalle: { fontSize: 14, color: colors.texto, marginTop: 4 },
  detalleSuave: { fontSize: 13, color: colors.textoSuave, marginTop: 4 },
  negrita: { fontWeight: '700', color: colors.texto },
  ahorro: { color: colors.verdeClaro, fontWeight: '700' },
  separador: { height: 1, backgroundColor: colors.borde, marginVertical: 10 },
});
