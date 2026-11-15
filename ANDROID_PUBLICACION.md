# Convertir MERKA web instalable en Android — después del despliegue HTTPS

MERKA entrega una PWA real. La PWA **no es** un paquete `.apk` ni `.aab`. Para ofrecerla en Google Play se recomienda la ruta **Trusted Web Activity (TWA)**, que requiere un sitio HTTPS operativo.

1. Publica y prueba `public/` y `functions/` en tu dominio definitivo de Firebase Hosting. Asegúrate de que todas las acciones que vas a presentar funcionan de verdad; no basta con abrir la pantalla inicial.
2. Revisa `public/manifest.webmanifest` (nombre, iconos, permisos). Usa iconos PNG de 192 y 512 px incluidos.
3. Con Node.js, Android Studio / SDK Android API 36 y JDK apropiado, utiliza la herramienta oficial Bubblewrap para iniciar un proyecto TWA desde `https://TU_DOMINIO/manifest.webmanifest`. Sigue las instrucciones actuales de Bubblewrap y genera una firma segura.
4. Configura el archivo `/.well-known/assetlinks.json` en Firebase Hosting con la huella SHA-256 del certificado de firma para vincular el dominio a la aplicación Android. **No publiques esa configuración sin haber generado y verificado tu firma.**
5. Compila y firma un `.aab` para Play Console. La clave privada de firma debe permanecer bajo el control de la empresa, fuera del código compartido.
6. Prueba cámara/micrófono para Live, autenticación de Firebase, enlaces externos de pago, subida de imágenes, navegación y cierre de sesión en teléfonos reales Android.
7. Completa cuenta desarrollador Google Play, política de privacidad, formulario de seguridad de datos, condiciones de venta, imágenes y evaluaciones de cumplimiento.

**Requisito vigente:** nuevas apps y actualizaciones enviadas a Google Play a partir del 31 de agosto de 2026 deben usar Android 16, API 36 o superior para teléfonos/tablets. Consulta la documentación oficial de Android Developers para cambios posteriores.

Este paquete **no contiene un APK firmado** porque no se aportaron los elementos necesarios para generarlo, ni se configuró un sitio HTTPS real de producción. No se ha afirmado ni simulado un paquete compilado.
