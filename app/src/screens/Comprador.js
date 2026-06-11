import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { colors } from '../theme';
import { useStore, calcularPedido, fmt } from '../store';
import { Pantalla, Encabezado, Tarjeta, Boton, Campo, Etiqueta, Vacio } from '../components';

// Pantallas del rol COMPRADOR (restaurante / feria / almacén):
//  - catalogo: ofertas disponibles en tiempo real
//  - detalle: armar pedido con cálculo de comisión
//  - pedidos: historial de pedidos

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
      elegir={(p) => {
        setSeleccion(p);
        setVista('detalle');
      }}
    />
  );
}

function Catalogo({ elegir, verPedidos, salir }) {
  const { state } = useStore();
  const disponibles = state.publicaciones.filter((p) => p.estado === 'disponible');

  return (
    <Pantalla>
      <Encabezado titulo="Campo Trecho · Comprador" onAtras={salir} />
      <ScrollView>
        <Tarjeta>
          <Text style={s.saludo}>Cosecha fresca, directo del campo 🥬</Text>
          <Text style={s.sub}>
            Comprá directo a productores de Canelones. Sin intermediarios, con logística incluida.
          </Text>
        </Tarjeta>

        {disponibles.length === 0 && <Vacio mensaje="No hay ofertas disponibles en este momento." />}
        {disponibles.map((p) => (
          <Tarjeta key={p.id}>
            <View style={s.filaEntre}>
              <Text style={s.titulo}>{p.producto}</Text>
              <Text style={s.precio}>{fmt(p.precioKg)}/kg</Text>
            </View>
            <Text style={s.detalle}>{p.cantidadKg} kg disponibles</Text>
            <Text style={s.detalleSuave}>
              👨‍🌾 {p.productor} — {p.zona}
            </Text>
            <Text style={s.detalleSuave}>📅 Entrega: {p.fechaEntrega} · 📍 {p.destino}</Text>
            <Boton titulo="Hacer pedido" onPress={() => elegir(p)} />
          </Tarjeta>
        ))}

        <View style={{ padding: 16 }}>
          <Boton titulo="Mis pedidos" variante="secundario" onPress={verPedidos} />
        </View>
      </ScrollView>
    </Pantalla>
  );
}

function Detalle({ publicacion, volver, irPedidos }) {
  const { dispatch } = useStore();
  const [kg, setKg] = useState('');
  const cantidad = Number(kg);
  const valido = cantidad > 0 && cantidad <= publicacion.cantidadKg;
  const { subtotal, comision, total } = valido
    ? calcularPedido(publicacion, cantidad)
    : { subtotal: 0, comision: 0, total: 0 };

  const confirmar = () => {
    dispatch({
      type: 'PEDIR',
      payload: { publicacion, kg: cantidad, comprador: 'Mi negocio' },
    });
    Alert.alert(
      'Pedido confirmado ✅',
      `Pedido de ${cantidad} kg de ${publicacion.producto} por ${fmt(total)}.\n\nEl pago va directo al productor. Te avisaremos cuando el flete esté en camino.`,
      [{ text: 'Ver mis pedidos', onPress: irPedidos }, { text: 'OK' }]
    );
  };

  return (
    <Pantalla>
      <Encabezado titulo="Hacer pedido" onAtras={volver} />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <Tarjeta>
          <Text style={s.titulo}>{publicacion.producto}</Text>
          <Text style={s.detalle}>
            {fmt(publicacion.precioKg)}/kg · {publicacion.cantidadKg} kg disponibles
          </Text>
          <Text style={s.detalleSuave}>👨‍🌾 {publicacion.productor} — {publicacion.zona}</Text>
          <Etiqueta texto={`Entrega ${publicacion.fechaEntrega}`} />
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
          <Fila label="Servicio Campo Trecho (7,5%)" valor={fmt(comision)} />
          <View style={s.separador} />
          <Fila label="Total" valor={fmt(total)} negrita />
          <Text style={s.nota}>El pago es digital y va directo al productor.</Text>
        </Tarjeta>

        <View style={{ paddingHorizontal: 16 }}>
          <Boton titulo="Confirmar pedido" onPress={confirmar} deshabilitado={!valido} />
        </View>
      </ScrollView>
    </Pantalla>
  );
}

function MisPedidos({ volver }) {
  const { state } = useStore();
  return (
    <Pantalla>
      <Encabezado titulo="Mis pedidos" onAtras={volver} />
      <ScrollView>
        {state.pedidos.length === 0 && <Vacio mensaje="Todavía no hiciste ningún pedido." />}
        {state.pedidos.map((p) => (
          <Tarjeta key={p.id}>
            <View style={s.filaEntre}>
              <Text style={s.titulo}>{p.producto}</Text>
              <Etiqueta texto="Confirmado" />
            </View>
            <Text style={s.detalle}>{p.kg} kg · Total {fmt(p.total)}</Text>
            <Text style={s.detalleSuave}>👨‍🌾 {p.productor} · 📅 {p.fecha}</Text>
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
  detalle: { fontSize: 14, color: colors.texto, marginTop: 4 },
  detalleSuave: { fontSize: 13, color: colors.textoSuave, marginTop: 4 },
  negrita: { fontWeight: '800' },
  nota: { marginTop: 10, fontSize: 12, color: colors.textoSuave },
  separador: { height: 1, backgroundColor: colors.borde, marginVertical: 10 },
});
