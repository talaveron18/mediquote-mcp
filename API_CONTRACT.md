# Contrato esperado de MediQuote `/api/v1`

Todas las rutas requieren `Authorization: Bearer <MEDIQUOTE_API_TOKEN>` y `Accept: application/json`.

## Rutas

- `GET /clientes`
- `GET /clientes/{cif}`
- `POST /clientes`
- `GET /atribucion?comercial=X&estado=Y`
- `GET /atribucion/{cif}`
- `POST /atribucion`
- `PATCH /atribucion/{cif}/estado`
- `POST /atribucion/{cif}/prorroga`
- `POST /atribucion/{cif}/cerrar`
- `GET /atribucion/vencimientos?dias=N`
- `GET /presupuestos?status=X&client=Y&search=Z&limit=N`
- `GET /presupuestos/{id}`
- `GET /comerciales`

Las rutas de presupuestos son de solo lectura y no deben exponer costes internos, márgenes internos ni notas internas.

La lógica de disponibilidad, CIF, reservas, grupos, prórrogas, cierre, privacidad y auditoría pertenece exclusivamente a MediQuote. El gateway no debe duplicarla ni acceder directamente a la base de datos.

## Errores

Formato preferido: `{ "error": "Mensaje legible", "code": "CODIGO_ESTABLE" }`.

## Auditoría

Cada llamada externa debe registrar en MediQuote la identidad externa, IP, acción, entidad afectada y resultado. Nunca se registra el secreto Bearer.
