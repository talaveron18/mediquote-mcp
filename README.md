# MediQuote MCP / GASI AI Gateway

Capa neutral para conectar MediQuote/GASI con asistentes de IA sin acoplar el programa a un proveedor concreto.

## Interfaces

- `POST /mcp` — MCP remoto estándar.
- `GET /bridge/tools` — herramientas en JSON Schema para clientes sin MCP.
- `POST /bridge/call` — ejecución neutral `{ "name": "...", "arguments": {...} }`.
- `GET /health` — estado del servicio.

## Herramientas

`listar_clientes`, `obtener_cliente`, `crear_cliente`, `listar_atribuciones`, `obtener_atribucion`, `crear_atribucion`, `cambiar_estado_atribucion`, `prorrogar_atribucion`, `cerrar_atribucion`, `vencimientos_proximos`, `listar_presupuestos`, `obtener_presupuesto`, `listar_comerciales`.

Las herramientas de presupuestos son de solo lectura y no devuelven costes internos, márgenes internos ni notas internas.

## Seguridad

El gateway no accede a la base de datos. Llama a `MEDIQUOTE_API_URL` con `MEDIQUOTE_API_TOKEN`. Los clientes de IA entran al gateway con otro secreto distinto, `MCP_ACCESS_TOKEN`. Ningún secreto va al repositorio.

## Variables

```text
MEDIQUOTE_API_URL=https://gasi-mediquote.netlify.app/api/v1
MEDIQUOTE_API_TOKEN=...
MCP_ACCESS_TOKEN=...
```

## Compatibilidad

MCP es el transporte preferido. El bridge JSON permite adaptadores para proveedores que solo soporten function/tool calling. El workspace `GASI AI` dentro de MediQuote usa la misma filosofía y puede cambiar de proveedor (OpenAI, Claude, Grok, OpenAI-compatible o local) sin reescribir las operaciones de negocio.

## Desarrollo

```bash
npm install
npm run typecheck
npm test
```

Ver `ARCHITECTURE.md` y `API_CONTRACT.md`.
