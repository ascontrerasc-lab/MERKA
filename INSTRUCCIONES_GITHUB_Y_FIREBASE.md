# MERKA — Cómo subir a GitHub y obtener un enlace de la app

## A. Subir el código a GitHub (sin consola)

1. Abre https://github.com/new e inicia sesión.
2. Nombre: `MERKA`. Selecciona visibilidad **Private**. No agregues otro README, ya viene uno. Pulsa **Create repository**.
3. Descomprime `MERKA_LISTO_PARA_GITHUB_2026.zip`. Debes ver `public`, `functions`, `firebase.json` y `README.md` directamente dentro de la carpeta.
4. En el repositorio nuevo de GitHub, pulsa **uploading an existing file** (o **Add file → Upload files**).
5. Arrastra **todo el contenido descomprimido** (carpetas `public`, `functions` y archivos de raíz), NO subas el archivo `.zip` como único elemento.
6. Escribe el mensaje: `Primera versión técnica de MERKA` y pulsa **Commit changes**.
7. Comprueba que GitHub muestra `public/`, `functions/`, `firebase.json` y `README.md`. Tu código ya está almacenado; aún NO es una web publicada.

## B. Publicar en Firebase solo para pruebas

1. Crea un **proyecto nuevo de pruebas**, diferente al Firebase de MERKA anterior, en https://console.firebase.google.com/.
2. Activa Authentication → Email/Password, Firestore, Storage y Hosting. Revisa primero los requisitos de facturación de Cloud Functions.
3. Registra una app web en Firebase y copia la configuración web en `public/config.js` (reemplazando los valores `REEMPLAZAR_...`). Esta configuración identifica la app web; no incluyas claves privadas ni cuentas de servicio.
4. En un equipo con Node.js 22 y permisos autorizados, abre terminal **dentro de la carpeta del proyecto** y ejecuta:

```bash
npm install -g firebase-tools
npm install --prefix functions
firebase login
```

5. Para habilitar Live real, configura los secretos de Agora en el nuevo proyecto siguiendo `LEEME_LANZAMIENTO.md`. **Nunca** pegues credenciales Agora en GitHub.
6. Comprueba el ID de tu proyecto de pruebas y usa explícitamente `--project` al desplegar. Primero revisa la configuración y las reglas en emuladores. Después, para pruebas controladas:

```bash
firebase deploy --project TU_PROYECTO_DE_PRUEBAS --only firestore,storage,functions,hosting
```

7. Firebase mostrará un sitio HTTPS parecido a `https://TU_PROYECTO_DE_PRUEBAS.web.app`. Agrega el dominio como autorizado de Authentication si se requiere.
8. Crea usuarios de prueba, configura coberturas/tarifas reales, permisos de vendedor y pruebas de pagos, inventario y reparto. No lo presentes como app lista para vender.

**Importante:** publicar en GitHub NO hace este despliegue. GitHub Pages es solo una opción para una **demo estática** y no reemplaza Functions/Firestore.

## C. Errores a evitar

- No subas el ZIP consolidado que mezcla ramas distintas.
- No publiques el repositorio como Public si el proyecto es confidencial.
- No subas archivos `.env`, credenciales de service account ni claves de firma.
- No despliegues `firestore.rules` / `storage.rules` sobre el proyecto antiguo `merka-8a703`.
- No confundir un enlace web de pruebas con publicación en Google Play.
