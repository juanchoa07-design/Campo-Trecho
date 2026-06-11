# Campo Trecho — App móvil (Beta)

*Del productor a tu puerta. Sin intermediarios.*

App móvil del marketplace de logística para productores familiares de Uruguay. Construida con **React Native + Expo**: un solo código que corre en **Android y iPhone**.

## Qué incluye esta versión

**Rol Productor**
- Publicar cosecha en segundos (producto, kg, precio, destino, fecha)
- Ver mis publicaciones y su estado (disponible / vendido)
- Fletes compartidos: el sistema agrupa productores con mismo destino y fechas similares (±1 día) y divide el costo del flete proporcional a los kg de cada uno, mostrando el ahorro de cada productor

**Rol Comprador** (restaurante, feria, almacén)
- Catálogo de ofertas disponibles en tiempo real
- Hacer pedido con cálculo automático: subtotal + comisión Campo Trecho (7,5%)
- Historial de pedidos

## Cómo probarla en tu celular

1. Instala **Node.js** en tu computadora: https://nodejs.org (versión LTS)
2. Instala la app **Expo Go** en tu celular (gratis en App Store / Google Play)
3. Abre una terminal en esta carpeta (`app`) y ejecuta:

```bash
npm install
npx expo start
```

4. Escanea el código QR que aparece:
   - **iPhone**: con la cámara
   - **Android**: desde la app Expo Go

La app se abre en tu celular. Cualquier cambio en el código se refleja al instante.

## Estructura del proyecto

```
app/
├── App.js                  # Entrada: pantalla de bienvenida y selección de rol
├── src/
│   ├── theme.js            # Colores e identidad visual
│   ├── store.js            # Datos + lógica de flete compartido y comisión
│   ├── components.js       # Componentes de interfaz reutilizables
│   └── screens/
│       ├── Productor.js    # Publicar cosecha, mis publicaciones, fletes
│       └── Comprador.js    # Catálogo, pedido, mis pedidos
```

## Estado actual y próximos pasos

Esta beta funciona con **datos en memoria** (de ejemplo) para poder probar y demostrar el flujo completo. Para pasar a producción:

1. **Backend**: conectar `src/store.js` a una base de datos real (recomendado: Supabase — gratis para empezar, con autenticación incluida). Las pantallas no necesitan cambios.
2. **Autenticación**: registro/login de productores y compradores con teléfono.
3. **Pagos digitales**: integrar Mercado Pago o dLocal para el pago directo al productor.
4. **Canal WhatsApp**: bot con la API de WhatsApp Business para productores que no usen la app.
5. **Publicación en tiendas**: con `eas build` (servicio de Expo) se generan los instaladores para Google Play y App Store.

## Parámetros del modelo (ajustables en `src/theme.js` y `src/store.js`)

- Comisión: **7,5%** (`COMISION`)
- Costo de flete de referencia Canelones → Montevideo: **$U 2.200** (`COSTO_FLETE_BASE`)
