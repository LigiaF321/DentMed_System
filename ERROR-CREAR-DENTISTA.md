# ERROR: No se pueden crear cuentas de dentista

## Descripción del error
Al intentar crear un dentista, el backend muestra:
notNull Violation: Auditoria.fecha_hora cannot be null,
notNull Violation: Auditoria.usuario_nombre cannot be null,
notNull Violation: Auditoria.usuario_rol cannot be null,
notNull Violation: Auditoria.resultado cannot be null


## Archivos involucrados
- `backend/src/controllers/adminDentists.controller.js` (línea 62)
- `backend/src/models/Auditoria.js`

## Posible causa
`req.user` viene vacío al intentar crear el registro en Auditoria.

## Pasos para reproducir
1. Iniciar sesión como admin (admin@dentmed.com / admin123)
2. Ir a "Crear cuenta de dentista"
3. Llenar el formulario con cualquier dato
4. Hacer clic en "Crear cuenta"
5. Error 500 en consola

## Contexto adicional
- La tabla `usuarios` tiene datos (admin@dentmed.com) que yo agregue porque estava vacia
- El error ocurre específicamente en `adminDentists.controller.js` línea 62
- Parece que el objeto `req.user` no se está pasando correctamente

## Nota adicional
La tabla `usuarios` estaba vacía inicialmente. Tuve que ejecutar `npm run db:seed` para poblarla.