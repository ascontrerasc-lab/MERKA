# MERKA — CÓMO SUBIR Y PUBLICAR GRATIS EN GITHUB PAGES

**No necesitas registrarte con tarjeta para GitHub Pages en un repositorio público de GitHub Free.**

## A. Antes de subir

1. Este ZIP contiene la **carpeta raíz del proyecto**, no lo subas sin extraer.
2. Descomprime el ZIP con **Extraer todo**.
3. Abre `MERKA_GITHUB_PAGES_COMPLETO_2026`; deben verse `public`, `functions`, `.github`, `README.md`, etc.
4. Abre tu repo `https://github.com/ascontreras-lab/MERKA` con sesión iniciada.
5. Tu repositorio existente ya tiene archivos: al arrastrar el contenido completo de esta carpeta a **Add file > Upload files**, GitHub propondrá cambios a archivos de mismo nombre y agregará `.github/workflows/publicar-merka.yml`.
6. Asegúrate de **NO** subir accidentalmente una carpeta adicional `MERKA_GITHUB_PAGES_COMPLETO_2026` por fuera; `public` y `.github` deben quedar en la **raíz** del repo, al mismo nivel que `README.md`.
7. Haz clic **Commit changes** al final de la lista de archivos. No borres el repo ni su historial.
8. Si GitHub no permite subir la carpeta oculta `.github`, créala mediante **Add file > Create new file** usando el nombre `.github/workflows/publicar-merka.yml` y pega el contenido de este archivo del ZIP.

## B. Activar GitHub Pages (una sola vez)

1. En el repositorio, entra a **Settings > Pages**.
2. En **Build and deployment**, selecciona **Source: GitHub Actions**.
3. Ve a **Actions**, abre **Publicar MERKA en GitHub Pages**, y si hace falta pulsa **Run workflow > Run workflow**.
4. Verifica que aparezcan **build** y **deploy** con check verde.
5. En **Settings > Pages**, usa **Visit site**.
6. En un repo llamado `MERKA` del usuario `ascontreras-lab`, se espera `https://ascontreras-lab.github.io/MERKA/`, sujeto a que GitHub confirme el despliegue y el nombre.

Si ves el README en vez de MERKA, Pages aún publica la raíz del repo o tiene la fuente equivocada. Revisa que **Source sea GitHub Actions** y que el workflow `publicar-merka.yml` haya terminado en verde.

## C. ¿Qué está incluido y qué NO funciona solo con Pages?

- Incluido: pantallas del frontend técnico y PWA; configuración web Firebase `merka-8a703`.
- Incluido: Cloud Functions y reglas como archivos de código fuente, NO activados por GitHub Pages.
- No garantizado: autenticación, acceso a Firestore/Storage, funciones del servidor, pedidos, Yape, Live, prueba virtual IA.
- Para email/password con Firebase Auth, el dominio `ascontreras-lab.github.io` puede requerir agregarse en **Firebase Console > Authentication > Settings > Authorized domains**. Hacerlo solo cuando estés lista para probar con datos controlados.

## D. Seguridad

- GitHub Pages es accesible públicamente. Con GitHub Free, normalmente debes usar un repositorio público para Pages; el **código** también queda público. No usar un repo público si necesita permanecer confidencial. Puedes separar una demo pública de un repositorio privado de código.
- Nunca subir claves de servicio, claves privadas, contraseñas ni tokens Agora.
- El frontend puede solicitar datos al Firebase original. No usar producción para pruebas peligrosas.
- No ejecutar `firebase deploy` sobre `merka-8a703` para publicar en GitHub Pages.
- El archivo `.firebaserc` conserva a propósito un alias de pruebas para prevenir despliegues involuntarios al Firebase original.
