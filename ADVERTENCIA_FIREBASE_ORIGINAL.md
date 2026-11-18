# Importante: Firebase de MERKA existente

`public/config.js` ya incluye la configuración de la aplicación web Firebase
del proyecto `merka-8a703` que proporcionó la propietaria.

Esto NO migra datos ni garantiza que la nueva aplicación funcione con la
estructura antigua de Firestore. El proyecto técnico actual cambió roles,
permisos, pedidos y campos respecto a la versión antigua.

NO ejecutar `firebase deploy` sobre el proyecto original antes de comparar
colecciones, revisar reglas, hacer respaldo y probar con una copia.

La configuración `.firebaserc` conserva deliberadamente un ID de pruebas
inválido para evitar despliegues accidentales sobre producción.

El valor `apiKey` del SDK web identifica la aplicación cliente; nunca agregar
claves privadas de cuentas de servicio, tokens secretos de Agora o contraseñas.

Para actualizar SOLO el código fuente de GitHub:
  1. Abrir public/config.js en el repositorio.
  2. Sustituir su contenido por el archivo `merka_config_actualizado.js`.
  3. Guardar mediante Commit changes.
Esto NO publica la aplicación en Firebase Hosting por sí solo.
