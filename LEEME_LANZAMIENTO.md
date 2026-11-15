# MERKA — Código de aplicación y servidor (rama de lanzamiento técnico)

**IMPORTANTE:** Este ZIP **NO es una demo con datos ficticios**. Incluye una aplicación web instalable (PWA) que usa Firebase Auth, Firestore, Firebase Storage y Cloud Functions. **NO es todavía un APK Android compilado o una publicación operativa certificada**. Es una base de código desplegable que necesita configuración externa, pruebas reales y algunas funciones indispensables antes de abrir ventas al público.

## 1. Qué se entrega

- `public/`: aplicación web responsive de MERKA con pantalla principal visual tipo Pinterest, navegación Inicio / Videos / Live / Tiendas / Perfil, búsqueda, producto, carrito y pedidos.
- **Cuenta única** con correo y contraseña. Los modos B2C, B2B, Vendedor y Motorizado se solicitan desde Perfil.
- `functions/index.js`: **backend real** que registra comerciantes, aprueba roles, crea pedidos usando precios del servidor, verifica pago manual administrativamente, valida la disponibilidad del inventario, prepara pedidos multitienda, asigna motorizados y valida el código de entrega en el servidor.
- Ventas: guardar productos e imágenes, gestionar stock básico, publicar fotos/videos; catálogo, pedidos B2C y precios B2B separados en una colección privada.
- Live Shopping con intento de conexión Agora mediante token seguro generado por Cloud Functions; requiere credenciales de tu proyecto Agora y pruebas reales de cámara/streaming.
- `firestore.rules`, `storage.rules`, `firestore.indexes.json`, `firebase.json` con configuración de despliegue y modelo de permisos de mínimo privilegio.
- `functions/set-admin.js`: asigna rol administrador con las credenciales IAM de un operador autorizado, nunca desde el navegador.
- `scripts/checks.py`: verifica sintaxis JS/JSON y condiciones básicas del paquete (no sustituye pruebas de integración ni seguridad).
- `referencia_original/`: notas del código recibido, para facilitar el cotejo con el ZIP original. Tu ZIP original no fue modificado.

### Diferencia respecto a la entrega anterior

No se han incorporado productos falsos, ventas ficticias, repartos simulados ni pagos supuestamente aprobados. La pantalla de inicio estará vacía hasta que vendedores verificados publiquen datos auténticos en Firestore. Los botones que cambian estados de pedidos llaman al backend para que los valide.

## 2. Antes de desplegar (OBLIGATORIO)

**No publiques directamente sobre el proyecto original `merka-8a703`**. El esquema de esta nueva versión no es una migración compatible al 100 % con los documentos existentes. Un despliegue de reglas o funciones en ese mismo proyecto podría interrumpir tu aplicación anterior. Trabaja primero con **otro proyecto Firebase de pruebas** y una copia de los datos que tengas autorización para usar.

1. Crea un proyecto Firebase de staging con Firestore, Storage, Authentication (Email/Password), Hosting y Cloud Functions. Comprueba el plan de facturación y las cuotas (en especial Live, Storage y Functions).
2. **Reemplaza** todas las propiedades de `public/config.js` con la configuración web de staging. No confundas config pública con las claves de administrador.
3. Configura `.firebaserc` con el ID del proyecto de staging. El ZIP lleva un identificador **deliberadamente no válido** para impedir despliegues accidentales.
4. Añade el dominio del Hosting de staging en Firebase Authentication > Settings > Authorized domains.
5. Instala Node.js 22 y la CLI de Firebase en tu equipo; dentro de este directorio ejecuta:

```bash
npm install --prefix functions
npm install -g firebase-tools
firebase login
firebase use TU_PROYECTO_STAGING
```

6. Para habilitar Live, crea en Agora un App ID y habilita App Certificate. Guarda ambos en secretos de Cloud Functions (nunca en HTML ni JavaScript público):

```bash
firebase functions:secrets:set AGORA_APP_ID
firebase functions:secrets:set AGORA_CERTIFICATE
```

7. Despliega en **staging** (revisa el proyecto elegido antes de confirmar):

```bash
firebase deploy --project TU_PROYECTO_STAGING --only firestore,storage,functions,hosting
```

La primera vez que Storage Rules consultan Firestore puede ser necesario **autorizar la integración IAM Storage–Firestore** que solicita Firebase. Valida las reglas en el emulador y en el proyecto de staging.

8. Crea una cuenta normal mediante la aplicación. Obtén su Firebase Auth UID. Desde un equipo autorizado de operaciones, con credenciales de servicio/IAM de **staging** que no debes subir al código:

```bash
cd functions
GOOGLE_APPLICATION_CREDENTIALS=/ruta/SEGURA/operador.json node set-admin.js UID_DE_TU_CUENTA
```

Escribe `CONFIRMAR`, cierra sesión y vuelve a ingresar. Esta ruta no está expuesta al público.

9. En Perfil > Administración > Tarifas de entrega, activa **solo distritos con cobertura y precio real validado**. Si el comprador escribe un distrito sin tarifa, el servidor rechazará la compra; esto evita cobrar o prometer entregas sin cobertura.
10. Registra y aprueba vendedores/repartidores. Publica productos reales. Prueba permisos, precios B2B, pagos y ciclo de entrega en staging.

## 3. Qué funciona en el código y qué NO está listo

| Área | Código entregado | Validación o integración aún necesaria |
| --- | --- | --- |
| Cuenta y acceso | Firebase email/contraseña, perfil y sesión persistente | Recuperación de cuentas, consentimiento y verificación de identidad en ambiente real |
| Inicio Pinterest | Cuadrícula responsive alimentada por productos Firestore | Cargar catálogo y fotografías reales |
| B2C | Catálogo, búsqueda, producto, carrito, creación de pedidos por función | Pruebas reales de pagos, stock concurrente, devoluciones |
| B2B | Solicitud y aprobación, oferta mayorista privada, compra por cantidades | Reglas de negociación, verificación comercial y cantidades por variante |
| Vendedor | Solicitud, aprobación, publicación/edición de producto y stock, archivos a Storage | Verificación documental, gestión de variantes (talla/color por SKU), devoluciones y moderación |
| Fotos/video | Publicación de imágenes y videos grabados; sin comentarios en video | Compresión, transcodificación, reportes y moderación |
| MERKA Live | Sesión Agora/token temporal por servidor, host/espectador | Pruebas con Agora real, productos fijados, comentarios, recuperación de conexión y límites de costos |
| Pagos | Comprobante privado y revisión manual; stock se descuenta al confirmar | **No hay integración bancaria/Yape que verifique automáticamente el abono**, reembolsos y conciliación contable |
| Delivery Lima | Solicitud/aprobación, toma de pedido, recojos, estados y código privado | Verificación documental motorizados, rutas GPS, soporte, cobertura y tarifas reales |
| Provincias | Dirección y control de tarifa por localidad | Integración real con transportistas, seguimiento y liquidaciones regionales |
| Administración | Solicitudes, pagos, tarifas y pedidos con claim protegido | Dashboard avanzado, auditoría operativa, facturación, soporte y atención de incidencias |
| Prueba virtual IA | No integrada | Proveedor, consentimiento, privacidad, costos y pruebas |
| Aplicación Android nativa | Web app instalable como PWA | Generar y firmar un Android App Bundle (`.aab`) con Trusted Web Activity o proyecto Android validado |

**Advertencias operativas:**
- El usuario comprador puede adjuntar un comprobante, pero **un comprobante NO valida el pago**; el administrador debe comprobar el ingreso real en la cuenta.
- Los pedidos se crean antes de pagar y **no reservan inventario**. Al validar el pago, se comprueba stock de forma transaccional. Si no hubiera stock, se necesita atención y eventual reembolso fuera de la app. **No abrir ventas públicas sin resolver este escenario y el procedimiento de reembolso.**
- No se implementaron inventario por talla/color ni la cancelación con devolución automática de stock. **No declarar listas para producción dichas funciones.**
- Falta trabajar textos legales completos, políticas de privacidad, términos, soporte, protección de datos (Perú), moderación de contenido, notificaciones operativas, verificación de identidad y Play Store.
- El Live se conectará solo si los secretos de Agora están configurados y sus credenciales son correctas. No está probado aquí.

## 4. Publicación Android / APK

El ZIP original recibido es HTML y JavaScript; no contiene un proyecto Gradle Android. Tampoco se entregó una clave de firma de Android ni un paquete instalable.

**Primera vía:** tras desplegar la PWA con HTTPS, abrir la URL en Chrome Android y elegir «Instalar aplicación». Es una aplicación instalable en la pantalla principal, pero **no es un APK de Play Store**.

**Para Google Play:** crear un Trusted Web Activity (TWA) con Bubblewrap a partir de `manifest.webmanifest`, configurar el enlace `/.well-known/assetlinks.json` con huella digital de la clave de firma, compilar, firmar y enviar un **Android App Bundle**. Google Play exige `targetSdkVersion` API 36 o superior para nuevas apps a partir del 31 de agosto de 2026. El equipo debe completar la política de privacidad, fichas, permisos y declaraciones de datos. No se entregó un `.aab` ni `.apk` porque no se dispone de credenciales de firma ni de una versión publicada del sitio.

## 5. Plan de pruebas antes de abrir MERKA al público

- [ ] Proyecto de staging independiente; respaldos de Firestore y Storage.
- [ ] Reglas Firestore y Storage probadas con usuarios compradores, vendedor aprobado/pendiente, B2B, motorizado y administrador; pruebas de acceso denegado.
- [ ] Bloqueados privilegios admin vía navegador; reclamaciones solo IAM.
- [ ] Subida de imagen/video real y consumo de almacenamiento revisados.
- [ ] Pago bancario confirmado por personal autorizado; rechazo de comprobante falso.
- [ ] Pedidos simultáneos no dejan stock negativo; incidencia de sobreventa y reembolsos definida.
- [ ] Motorizado no accede al código privado del comprador.
- [ ] Tarifas reales de Lima y provincias, operador y método de entrega formalizados.
- [ ] Registro, privacidad y verificación de comerciantes/repartidores conforme al marco legal aplicable.
- [ ] Live real probado entre dos dispositivos, audio, permisos, reconexión y cierre.
- [ ] Prueba virtual IA, notificaciones y operaciones regionales: completar o no prometer aún.
- [ ] Monitoreo, alertas de costos, soporte y procedimiento de incidentes.
- [ ] Pruebas de integración con Firebase real y pruebas E2E mobile completadas.
- [ ] Generación y firma de APK/AAB, si se distribuirá por Android/Play Store.

## 6. Comprobación local

```bash
python scripts/checks.py
```

Esta comprobación revisa archivos y sintaxis, **no significa que MERKA esté operativa en la nube**. Este entorno no tiene acceso administrativo a tu Firebase/Agora ni puede validar pagos reales.

## 7. Código original

Los archivos del ZIP original `MERKA-main(1).zip` **no se sobrescribieron**. Es recomendable conservar su copia por separado y comparar sus esquemas antes de migrar datos, sobre todo `orders`, `users`, `stores`, `products` y `lives`.

---
El producto final comercial requiere un despliegue autorizado y pruebas reales; **no lo anuncies como disponible al público solo por tener estos archivos**.
