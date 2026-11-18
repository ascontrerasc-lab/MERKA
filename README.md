# MERKA — Aplicación y publicación en GitHub Pages

Repositorio de MERKA para conservar el código e implementar una **vista web de pruebas**.

## Carpetas

- `public/`: **sitio MERKA publicado en GitHub Pages**. Incluye interfaz, JS, configuración web Firebase, iconos y PWA.
- `functions/`: backend Firebase recuperado (GitHub Pages **no** ejecuta este código).
- `.github/workflows/publicar-merka.yml`: verifica la estructura y publica `public/` automáticamente.
- `scripts/checks.py`: pruebas estáticas básicas; **no** equivale a pruebas funcionales completas.
- `referencia_diseno/`: maquetas y diseño visual anterior como referencia, **no se publican**.
- `firestore.rules`, `storage.rules`, `firebase.json`: configuración Firebase recuperada; **no se despliegan** con GitHub Pages.
- `GUIA_PUBLICAR_SIN_TARJETA.md`: instrucciones paso a paso para publicar.

## Enlace esperado

Con el repositorio `ascontreras-lab/MERKA` publicado en GitHub Pages, la URL suele ser:

`https://ascontreras-lab.github.io/MERKA/`

Esta URL **no confirma** que el despliegue ya se haya realizado. Compruébalo en GitHub > Settings > Pages o en Actions.

## Limitaciones y seguridad

GitHub Pages solo sirve archivos estáticos; NO ejecuta `functions/`. El navegador puede intentar acceder a Firebase externo mediante `public/config.js`, pero el funcionamiento depende de que los servicios estén configurados, el dominio esté autorizado en Firebase Authentication, las reglas sean compatibles y exista un backend desplegado independientemente.

**Advertencia:** la app apunta al Firebase original `merka-8a703`. Publicar esta web puede mostrar datos reales si las reglas de Firestore los hacen públicos. Nunca desplegar reglas, Functions ni realizar operaciones de prueba con datos de producción sin evaluar seguridad y respaldos. No usar para compras, reparto, pagos reales, Yape ni Live sin pruebas integrales.

Los archivos del SDK web de Firebase no son llaves de administrador; no subir credenciales privadas.
