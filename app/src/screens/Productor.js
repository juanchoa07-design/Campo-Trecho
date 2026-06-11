import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { colors } from '../theme';
import { useStore, agruparFletes, fmt, COSTO_FLETE_BASE } from '../store';
import { Pantalla, Encabezado, Tarjeta, Boton, Campo, Etiqueta, Vacio } from '../components';

// Pantallas del rol PRODUCTOR:
//  - inicio: resumen + accesos
//  - publicar: formulario de cosecha
//  - publicaciones: mis publicaciones
//  - fletes: fletes compartidos propuestos

export default function Productor({ salir }) {
  const [vista, setVista] = useState('inicio');
  if (vista === 'publicar') return <Publicar volver={() => setVista('inicio')} />;
  if (vista === 'publicaciones') return <MisPublicaciones volver={() => setVista('inicio')} />;
  if (vista === 'fletes') return <Fletes volver={() => setVista('inicio')} />;
  return <Inicio ir={setVista} salir={salir} />;
}

function Inicio({ ir, salir }) {
  const { state } = useStore();
  const fletes = agruparFletes(state.publicaciones);
  const compartidos = fletes.filter((f) => f.publicaciones.length > 1).length;

  return (
    <Pantalla>
      <Encabezado titulo="Campo Trecho · Productor" onAtras={salir} />
      <ScrollView>
        <Tarjeta>
          <Text style={s.saludo}>¡Buen día! 🌱</Text>
          <Text style={s.sub}>
            Publicá tu cosecha en segundos y el sistema busca con quién compartir el flete.
          </Text>
        </Tarjeta>

        <View style={s.fila}>
          <Tarjeta style={s.mitad}>
            <Text style={s.numero}>{state.publicaciones.filter((p) => p.estado === 'disponible').length}</Text>
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
        </View>
      </ScrollView>
    </Pantalla>
  );
}

function Publicar({ volver }) {
  const { dispatch } = useStore();
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
        productor: 'Mi establecimiento',
        zona: 'Canelones',
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
        <Campo etiqueta="Producto" placeholder="Ej: Tomate redondo" value={producto} onChangeText={setProducto} />
        <Campo etiqueta="Cantidad (kg)" placeholder="Ej: 300" keyboardType="numeric" value={cantidad} onChangeText={setCantidad} />
        <Campo etiqueta="Precio por kg ($U)" placeholder="Ej: 38" keyboardType="numeric" value={precio} onChangeText={setPrecio} />
        <Campo etiqueta="Destino" placeholder="Ej: Montevideo Centro" value={destino} onChangeText={setDestino} />
        <Campo etiqueta="Fecha de entrega (AAAA-MM-DD)" placeholder="2026-06-15" value={fecha} onChangeText={setFecha} />
        <Boton titulo="Publicar" onPress={publicar} deshabilitado={!valido} />
        <Text style={s.nota}>
          Al publicar, tu oferta entra al sistema de flete compartido y queda visible para
          restaurantes, ferias y almacenes.
        </Text>
      </ScrollView>
    </Pantalla>
  );
}

function MisPublicaciones({ volver }) {
  const { state } = useStore();
  return (
    <Pantalla>
      <Encabezado titulo="Mis publicaciones" onAtras={volver} />
      <ScrollView>
        {state.publicaciones.length === 0 && <Vacio mensaje="Todavía no publicaste ninguna cosecha." />}
        {state.publicaciones.map((p) => (
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
            <Text style={s.detalleSuave}>{p.productor} — {p.zona}</Text>
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

const s = StyleSheet.create({
  saludo: { fontSize: 20, fontWeight: '800', color: colors.texto },
  sub: { marginTop: 6, color: colors.textoSuave, fontSize: 14, lineHeight: 20 },
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
  nota: { marginTop: 14, fontSize: 13, color: colors.textoSuave, lineHeight: 19 },
  separador: { height: 1, backgroundColor: colors.borde, marginVertical: 10 },
});
