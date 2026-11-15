# Migración desde MERKA V15.3

La versión previa `MERKA-main(1).zip` y la nueva arquitectura usan colecciones con nombres relacionados, pero **NO deben considerarse una migración automática**.

Original:
- `users` podía contener `roles`, `isAdmin`, `canSell` editables desde frontend.
- `orders` se creaba desde navegador, con `pending_admin_confirmation`, `deliveryCode` legible y estados originales.
- `stores` se activaba inmediatamente sin aprobación de servidor.
- `lives` incluía canal Agora fijo y token en el frontend.
- Las reglas desplegadas originales no están en el archivo entregado.

Nueva rama:
- `users` roles por aprobación en Functions; admin por Custom Claim.
- `orders` solo creados y modificados por Functions; código exclusivo en `buyerCodes`, no en pedido de delivery.
- `stores` usa `pending/approved` con control administrativo.
- `wholesaleOffers/{productId}` separa precio mayorista para cuentas B2B aprobadas.
- `deliveryRates/{slug}` exige tarifa de envío configurada.
- `lives` usa canal generado por transmisión y token entregado desde Functions.

## Estrategia recomendada

1. Respaldar proyecto original y exportar datos autorizados.
2. Desplegar la nueva rama en Firebase **staging separado**, nunca encima de V15 sin un plan aprobado.
3. Crear una tabla de transformación para `users`, `stores`, `products`, `orders`, `posts`, `lives` y roles.
4. Revisar consentimiento y permisos antes de migrar datos personales.
5. Migrar vendedores y productos de prueba, ejecutar 10 flujos de extremo a extremo.
6. Planificar periodo de transición, aviso a usuarios, respaldo y rollback.
7. Solo después de las verificaciones considerar corte a producción.

**Esta entrega no migra, borra ni modifica automáticamente tus datos existentes**. El código original se conserva en el ZIP que tú proporcionaste.
