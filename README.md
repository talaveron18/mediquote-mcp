# MediQuote MCP / GASI AI Gateway

Capa neutral para conectar MediQuote/GASI con asistentes de IA sin acoplar el programa a un proveedor concreto ni compartir una cuenta de IA entre usuarios.

## Modelo

Cada persona usa **su propia IA** (ChatGPT, Claude, Grok u otro cliente compatible) y genera desde MediQuote una conexión personal `mqai_...`.

La llave identifica al usuario de MediQuote. El gateway valida esa llave contra `/api/v1/me`, obtiene el rol y las capacidades del usuario y publica únicamente las herramientas permitidas para esa persona.

GASI no presta una cuenta común de ChatGPT/Claude/Grok y el gateway no guarda contraseñas, cookies ni claves API de esos proveedores.

## Interfaces

- `POST /mcp` — MCP remoto estándar.
- `GET /bridge/tools` — manifiesto JSON Schema filtrado por usuario para clientes sin MCP.
- `POST /bridge/call` — ejecución neutral `{ "name": "...", "arguments": {...} }`, también filtrada por usuario.
- `GET /health` — estado del servicio.

## Herramientas

El registro contiene actualmente:

`listar_clientes`, `obtener_cliente`, `crear_cliente`, `listar_atribuciones`, `obtener_atribucion`, `crear_atribucion`, `cambiar_estado_atribucion`, `prorrogar_atribucion`, `cerrar_atribucion`, `vencimientos_proximos`, `listar_presupuestos`, `obtener_presupuesto`, `listar_comerciales`.

No todos los usuarios ven todas las herramientas. Por ejemplo, un comercial no recibe `crear_cliente` ni `prorrogar_atribucion`; MediQuote además limita sus atribuciones y presupuestos a los que le corresponden.

## Seguridad

- El gateway **no accede a la base de datos**.
- No existe una credencial maestra del gateway capaz de actuar como cualquier usuario.
- El cliente envía `Authorization: Bearer mqai_...`.
- La misma credencial personal se reenvía a MediQuote, que resuelve el usuario real y aplica permisos en servidor.
- MediQuote guarda únicamente SHA-256 de cada llave y la puede revocar individualmente.
- Las acciones quedan auditadas con usuario, conexión, proveedor e IP.
- Las herramientas mutantes siguen sometidas a las reglas de negocio de MediQuote. `cerrar_atribucion`, además, exige confirmación explícita en la llamada.

## Variable del servidor

El gateway solo necesita conocer la API de MediQuote:

```text
MEDIQUOTE_API_URL=https://gasi-mediquote.netlify.app/api/v1
```

No se configuran `MCP_ACCESS_TOKEN` ni `MEDIQUOTE_API_TOKEN` globales.

## Conexión de un usuario

1. El usuario inicia sesión en MediQuote.
2. Abre **Mi IA**.
3. Elige un proveedor y genera una conexión.
4. MediQuote muestra una sola vez la llave `mqai_...`.
5. En su IA añade el MCP remoto `https://mediquote-mcp.netlify.app/mcp` y usa su llave como Bearer.
6. Si revoca la conexión desde MediQuote, deja de funcionar inmediatamente.

La disponibilidad de conectores MCP depende del proveedor y del plan de cada usuario. Si un proveedor no admite MCP remoto, `/bridge/tools` y `/bridge/call` permiten construir un adaptador sin cambiar MediQuote.

## GASI AI vs Mi IA

- **GASI AI**: workspace corporativo de Dirección dentro de MediQuote, con su propio historial y proveedores configurados por GASI.
- **Mi IA**: conexión personal para que cada usuario use su propia cuenta de IA con sus propios límites y sus permisos de MediQuote.

Ambos consumen la misma lógica de negocio; son puertas de entrada diferentes.

## Desarrollo

```bash
npm install
npm run typecheck
npm test
```

Ver `ARCHITECTURE.md` y `API_CONTRACT.md`.
