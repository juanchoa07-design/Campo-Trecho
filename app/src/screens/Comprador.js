import React, { useState } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, Alert, TextInput, TouchableOpacity } from 'react-native';
import { colors } from '../theme';
import { useStore, calcularPedido, promedioCalificacion, fmt } from '../store';
import { Pantalla, Encabezado, Tarjeta, Boton, Campo, Etiqueta, Vacio, Estrellas } from '../components';
import EditarPerfil from './EditarPerfil';

export default function Comprador({ salir }) {
  const [vista, setVista] = useState('negocios');
  const [negocioSeleccionado, setNegocioSeleccionado] = useState(null);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  if (vista === 'perfil') return <EditarPerfil volver={() => setVista('negocios')} />;

  if (vista === 'tienda' && negocioSeleccionado)
    return (
      <TiendaProductor
        productor={negocioSeleccionado}
        volver={() => setVista('negocios')}
        elegir={(p) => { setProductoSeleccionado(p); setVista('detalle'); }}
      />
    );

  if (vista === 'detalle' && productoSeleccionado)
    return (
      <Detalle
        publicacion={productoSeleccionado}
        volver={() => setVista('tienda')}
        irPedidos={() => setVista('pedidos')}
      />
    );

  if (vista === 'pedidos')
    return <MisPedidos volver={() => setVista('negocios')} />;

  return (
    <ListaNegocios
      salir={salir}
      verPedidos={() => setVista('pedidos')}
      editarPerfil={() => setVista('perfil')}
      abrirNegocio={(productor) => { setNegocioSeleccionado(productor); setVista('tienda'); }}
    />
  );
}

// ---------- Pantalla 1: lista de negocios (estilo Pedidos Ya) ----------
function ListaNegocios({ salir, verPedidos, editarPerfil, abrirNegocio }) {
  const { state } = useStore();
  const { publicaciones, calificaciones, usuarios, usuarioActual } = state;
  const productores = usuarios.filter((u) => u.rol === 'productor');
  const fotoUri = usuarioActual.foto_url ?? usuarioActual.fotoUri ?? null;
  const inicial = (usuarioActual.negocio || usuarioActual.nombre || '?')[0].toUpperCase();

  return (
    <Pantalla>
      <Encabezado titulo="Campo Trecho" onAtras={salir} />
      <ScrollView>
        <View style={s.heroBanner}>
          <View style={s.heroFila}>
            <View style={{ flex: 1 }}>
              <Text style={s.heroTitulo}>Cosecha fresca 🥬</Text>
              <Text style={s.heroSub}>Directo de productores de Canelones</Text>
            </View>
            <TouchableOpacity onPress={editarPerfil} activeOpacity={0.8}>
              {fotoUri
                ? <Image source={{ uri: fotoUri }} style={s.heroFoto} />
                : <View style={s.heroAvatar}><Text style={s.heroInicial}>{inicial}</Text></View>}
            </TouchableOpacity>
          </View>
        </View>

        <Text style={s.seccionTitulo}>Productores disponibles</Text>

        {productores.length === 0 && (
          <Vacio mensaje="Todavía no hay productores registrados." />
        )}

        {productores.map((productor) => {
          const susProductos = publicaciones.filter(
            (p) => p.productorId === productor.id && p.estado === 'disponible'
          );
          const rating = promedioCalificacion(calificaciones, productor.id);
          const inicial = (productor.negocio || productor.nombre || '?')[0].toUpperCase();

          return (
            <TouchableOpacity
              key={productor.id}
              activeOpacity={0.85}
              onPress={() => abrirNegocio(productor)}
            >
              <View style={s.negocioCard}>
                {/* Avatar con inicial */}
                <View style={s.avatar}>
                  <Text style={s.avatarLetra}>{inicial}</Text>
                </View>

                <View style={s.negocioInfo}>
                  <Text style={s.negocioNombre}>{productor.negocio || productor.nombre}</Text>
                  {productor.zona ? (
                    <Text style={s.negocioZona}>📍 {productor.zona}</Text>
                  ) : null}
                  <View style={s.negocioMeta}>
                    {rating ? (
                      <Estrellas puntuacion={rating.promedio} cantidad={rating.cantidad} />
                    ) : (
                      <Text style={s.sinRating}>Sin calificaciones aún</Text>
                    )}
                    <Text style={s.cantProd}>
                      {susProductos.length > 0
                        ? `${susProductos.length} producto${susProductos.length > 1 ? 's' : ''}`
                        : 'Sin stock'}
                    </Text>
                  </View>
                </View>

                <Text style={s.chevron}>›</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
          <Boton titulo="Mis pedidos" variante="secundario" onPress={verPedidos} />
        </View>
      </ScrollView>
    </Pantalla>
  );
}

// ---------- Pantalla 2: tienda del productor ----------
function TiendaProductor({ productor, volver, elegir }) {
  const { state } = useStore();
  const { publicaciones, calificaciones } = state;
  const rating = promedioCalificacion(calificaciones, productor.id);
  const productos = publicaciones.filter(
    (p) => p.productorId === productor.id && p.estado === 'disponible'
  );

  return (
    <Pantalla>
      <Encabezado titulo={productor.negocio || productor.nombre} onAtras={volver} />
      <ScrollView>
        {/* Header del negocio */}
        <View style={s.tiendaHeader}>
          <View style={s.avatarGrande}>
            <Text style={s.avatarLetraGrande}>
              {(productor.negocio || productor.nombre || '?')[0].toUpperCase()}
            </Text>
          </View>
          <Text style={s.tiendaNombre}>{productor.negocio || productor.nombre}</Text>
          {productor.zona ? <Text style={s.tiendaZona}>📍 {productor.zona}</Text> : null}
          {rating ? (
            <View style={{ marginTop: 6 }}>
              <Estrellas puntuacion={rating.promedio} cantidad={rating.cantidad} />
            </View>
          ) : (
            <Text style={s.sinRating}>Sin calificaciones aún</Text>
          )}
        </View>

        <Text style={s.seccionTitulo}>Productos disponibles</Text>

        {productos.length === 0 && (
          <Vacio mensaje="Este productor no tiene stock disponible ahora." />
        )}

        {productos.map((p) => (
          <Tarjeta key={p.id}>
            <View style={s.productoFila}>
              <View style={{ flex: 1 }}>
                <Text style={s.productoNombre}>{p.producto}</Text>
                <Text style={s.productoDetalle}>{p.cantidadKg} kg disponibles</Text>
                <Text style={s.productoDetalle}>📅 Entrega: {p.fechaEntrega} · 📍 {p.destino}</Text>
              </View>
              <View style={s.productoPrecioCol}>
                <Text style={s.productoPrecio}>{fmt(p.precioKg)}</Text>
                <Text style={s.productoPrecioSub}>por kg</Text>
                <TouchableOpacity style={s.btnAgregar} onPress={() => elegir(p)} activeOpacity={0.8}>
                  <Text style={s.btnAgregarTxt}>Pedir</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Tarjeta>
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>
    </Pantalla>
  );
}

// ---------- Pantalla 3: formulario de pedido ----------
function Detalle({ publicacion, volver, irPedidos }) {
  const { state, dispatch } = useStore();
  const { usuarioActual } = state;
  const [kg, setKg] = useState('');
  const cantidad = Number(kg);
  const valido = cantidad > 0 && cantidad <= publicacion.cantidadKg;

  const { subtotal, comisionComprador, totalComprador, nettoVendedor } = valido
    ? calcularPedido(publicacion, cantidad)
    : { subtotal: 0, comisionComprador: 0, totalComprador: 0, nettoVendedor: 0 };

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
      <Encabezado titulo="Confirmar pedido" onAtras={volver} />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <Tarjeta>
          <Text style={s.productoNombre}>{publicacion.producto}</Text>
          <Text style={s.productoDetalle}>{fmt(publicacion.precioKg)}/kg · {publicacion.cantidadKg} kg disponibles</Text>
          <Text style={[s.productoDetalle, { color: colors.verde, fontWeight: '600', marginTop: 4 }]}>
            🏪 {publicacion.productorNegocio || publicacion.productorNombre}
          </Text>
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

// ---------- Pantalla 4: mis pedidos + calificar negocio ----------
function MisPedidos({ volver }) {
  const { state, dispatch } = useStore();
  const { usuarioActual, pedidos } = state;
  const misPedidos = pedidos.filter((p) => p.compradorId === usuarioActual.id);
  const [calificando, setCalificando] = useState(null);
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
            <View style={s.pedidoFila}>
              <View style={{ flex: 1 }}>
                <Text style={s.productoNombre}>{p.producto}</Text>
                <Text style={[s.productoDetalle, { color: colors.verde, fontWeight: '600' }]}>
                  🏪 {p.productorNegocio || p.productorNombre}
                </Text>
                <Text style={s.productoDetalle}>{p.kg} kg · {fmt(p.totalComprador)}</Text>
                <Text style={s.detalleSuave}>📅 {p.fecha}</Text>
              </View>
              <Etiqueta texto="Confirmado" />
            </View>

            {!p.calificado && calificando !== p.id && (
              <Boton
                titulo="Calificar negocio"
                variante="secundario"
                onPress={() => { setCalificando(p.id); setEstrellas(0); setComentario(''); }}
              />
            )}

            {p.calificado && (
              <Text style={s.yaCalificado}>✅ Negocio calificado</Text>
            )}

            {calificando === p.id && (
              <View style={s.calificacionBox}>
                <Text style={s.calificacionTitulo}>
                  ¿Cómo fue tu experiencia con{'\n'}
                  <Text style={{ color: colors.verde }}>{p.productorNegocio || p.productorNombre}</Text>?
                </Text>
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
        <View style={{ height: 24 }} />
      </ScrollView>
    </Pantalla>
  );
}

function Fila({ label, valor, negrita }) {
  return (
    <View style={s.filaEntre}>
      <Text style={[s.productoDetalle, negrita && s.negrita]}>{label}</Text>
      <Text style={[s.productoDetalle, negrita && s.negrita]}>{valor}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  // Hero banner
  heroBanner: {
    backgroundColor: colors.verde,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  heroFila: { flexDirection: 'row', alignItems: 'center' },
  heroTitulo: { fontSize: 22, fontWeight: '900', color: colors.blanco },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  heroFoto: { width: 48, height: 48, borderRadius: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  heroAvatar: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', alignItems: 'center', justifyContent: 'center' },
  heroInicial: { fontSize: 20, fontWeight: '900', color: colors.blanco },

  // Sección
  seccionTitulo: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textoSuave,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },

  // Card de negocio en lista
  negocioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.blanco,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borde,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.verdeFondo,
    borderWidth: 1.5,
    borderColor: colors.verdeClaro,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarLetra: { fontSize: 22, fontWeight: '900', color: colors.verde },
  negocioInfo: { flex: 1 },
  negocioNombre: { fontSize: 16, fontWeight: '800', color: colors.texto },
  negocioZona: { fontSize: 12, color: colors.textoSuave, marginTop: 2 },
  negocioMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  cantProd: { fontSize: 12, fontWeight: '600', color: colors.verde },
  sinRating: { fontSize: 12, color: colors.textoSuave },
  chevron: { fontSize: 24, color: colors.borde, marginLeft: 8 },

  // Header de tienda
  tiendaHeader: {
    backgroundColor: colors.verde,
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  avatarGrande: {
    width: 76,
    height: 76,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarLetraGrande: { fontSize: 34, fontWeight: '900', color: colors.blanco },
  tiendaNombre: { fontSize: 22, fontWeight: '900', color: colors.blanco },
  tiendaZona: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },

  // Producto en tienda
  productoFila: { flexDirection: 'row', alignItems: 'center' },
  productoNombre: { fontSize: 15, fontWeight: '700', color: colors.texto },
  productoDetalle: { fontSize: 13, color: colors.textoSuave, marginTop: 3 },
  productoPrecioCol: { alignItems: 'flex-end', marginLeft: 12 },
  productoPrecio: { fontSize: 17, fontWeight: '900', color: colors.verde },
  productoPrecioSub: { fontSize: 11, color: colors.textoSuave },
  btnAgregar: {
    marginTop: 8,
    backgroundColor: colors.verde,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  btnAgregarTxt: { color: colors.blanco, fontWeight: '700', fontSize: 13 },

  // Pedidos
  pedidoFila: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  detalleSuave: { fontSize: 12, color: colors.textoSuave, marginTop: 3 },
  yaCalificado: { marginTop: 10, fontSize: 13, color: colors.verdeClaro, fontWeight: '600' },

  // Calificación
  calificacionBox: {
    marginTop: 14,
    padding: 14,
    backgroundColor: colors.verdeFondo,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borde,
  },
  calificacionTitulo: { fontSize: 14, fontWeight: '700', color: colors.texto, marginBottom: 10, lineHeight: 20 },
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

  // Compartidos
  filaEntre: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  negrita: { fontWeight: '800', color: colors.texto, fontSize: 15 },
  separador: { height: 1, backgroundColor: colors.borde, marginVertical: 10 },
  nota: { marginTop: 10, fontSize: 12, color: colors.textoSuave },
});
