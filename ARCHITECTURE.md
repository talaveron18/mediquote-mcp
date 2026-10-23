# Arquitectura de IA de GASI / MediQuote

## Objetivo

MediQuote no depende de ChatGPT, Claude, Grok ni de ningún proveedor concreto. La lógica empresarial vive en MediQuote y se expone por una API limitada. Encima existe una capa estándar de herramientas para distintos clientes de IA.

## Capas

1. **MediQuote `/api/v1`**: fuente de verdad, permisos, validaciones, auditoría y reglas de negocio.
2. **mediquote-mcp**: traduce esas operaciones a herramientas neutrales.
3. **Transportes**:
   - `/mcp`: Model Context Protocol remoto, vía preferida.
   - `/bridge/tools`: manifiesto neutral JSON Schema para clientes que no implementen MCP.
   - `/bridge/call`: ejecución neutral de una herramienta por nombre.
4. **Clientes**: ChatGPT/OpenAI, Claude, Grok, IDEs/agentes MCP y cualquier orquestador que soporte JSON Schema/function calling.
5. **GASI AI (MediQuote)**: workspace de conversación dentro de la propia aplicación. Consumirá la misma capa de herramientas y podrá cambiar de proveedor sin cambiar la lógica de negocio.

## Proveedores para GASI AI

La interfaz interna usará un contrato `AiProvider` con adaptadores independientes. Objetivo de compatibilidad:

- OpenAI / Responses API
- Anthropic / Claude API
- xAI / Grok API
- endpoints OpenAI-compatible
- modelos locales (por ejemplo Ollama) cuando el entorno lo permita

El proveedor se selecciona por configuración de Dirección. Las claves de proveedor nunca se almacenan en el frontend ni se envían al navegador.

## Nota sobre suscripciones de consumidor

El chat embebido de MediQuote no debe asumir que una suscripción de consumidor de ChatGPT, Claude o Grok sea reutilizable como API. Para un chat realmente embebido hace falta un proveedor con credencial de API/servicio compatible o un modelo local. En cambio, los clientes externos compatibles con MCP pueden usar el servidor remoto directamente desde su propia aplicación y su propia cuenta.

## Memoria empresarial

El workspace interno tendrá memoria separada de los chats personales: conversaciones, decisiones y referencias empresariales de GASI. No importará memoria personal del usuario ni la mezclará con otros proyectos.

## Seguridad

- Dos credenciales separadas: cliente→gateway y gateway→MediQuote.
- Herramientas de borrado/seguridad/root no se exponen.
- Operaciones sensibles requieren confirmación explícita cuando proceda.
- Auditoría en MediQuote de todas las llamadas externas.
- El bridge neutral usa el mismo control de acceso que MCP.
