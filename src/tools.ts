import * as z from 'zod/v4';
import { mediquoteRequest, type MediQuoteCapabilities } from './mediquote-client.js';

export type Capability = keyof MediQuoteCapabilities;

export type ToolDefinition = {
  name: string;
  description: string;
  capability: Capability;
  inputSchema: z.ZodType;
  execute: (token: string, input: unknown) => Promise<unknown>;
  mutating?: boolean;
};

function json(method: string, body: unknown): RequestInit {
  return { method, body: JSON.stringify(body) };
}

const estados = z.enum(['prospecting', 'proposal_sent', 'proposal_accepted', 'closed', 'expired', 'released', 'exit_hold']);
const estadosEditables = z.enum(['prospecting', 'proposal_sent', 'proposal_accepted', 'closed']);
const estadosPresupuesto = z.enum(['borrador', 'enviado', 'aceptado', 'rechazado', 'caducado']);

const crearClienteSchema = z.object({
  businessName: z.string().min(1).describe('Razón social'),
  cif: z.string().min(2).describe('CIF/NIF español'),
  fiscalAddress: z.string().min(1).describe('Domicilio fiscal'),
  contactPerson: z.string().optional(), email: z.string().optional(), phone: z.string().optional(),
  sector: z.string().optional(), paymentTerms: z.string().optional(), notes: z.string().optional(),
});

const crearAtribucionSchema = z.object({
  cif: z.string().min(2), businessName: z.string().min(1),
  commercialId: z.string().min(1).optional().describe('Dirección puede indicar un comercial. Si el usuario conectado es comercial, MediQuote usa automáticamente su propio usuario.'),
  service: z.string().min(1), contactPerson: z.string().optional(), contactEmail: z.string().optional(), contactPhone: z.string().optional(), notes: z.string().optional(),
});

export const tools: ToolDefinition[] = [
  {
    name: 'listar_clientes', capability: 'readClients',
    description: 'Lista los clientes de MediQuote. Puede filtrar por razón social, CIF, contacto o email. Solo lectura.',
    inputSchema: z.object({ search: z.string().trim().optional() }),
    execute: async (token, raw) => {
      const input = z.object({ search: z.string().trim().optional() }).parse(raw);
      return mediquoteRequest(token, 'clientes', {}, { search: input.search });
    },
  },
  {
    name: 'obtener_cliente', capability: 'readClients',
    description: 'Obtiene un cliente concreto por CIF/NIF. Solo lectura.',
    inputSchema: z.object({ cif: z.string().min(2) }),
    execute: async (token, raw) => {
      const { cif } = z.object({ cif: z.string().min(2) }).parse(raw);
      return mediquoteRequest(token, `clientes/${encodeURIComponent(cif)}`);
    },
  },
  {
    name: 'crear_cliente', capability: 'createClient',
    description: 'Crea un cliente. Solo se publica cuando el usuario conectado tiene permiso de Dirección.',
    mutating: true, inputSchema: crearClienteSchema,
    execute: async (token, raw) => mediquoteRequest(token, 'clientes', json('POST', crearClienteSchema.parse(raw))),
  },
  {
    name: 'listar_atribuciones', capability: 'readAttributions',
    description: 'Lista atribuciones comerciales. MediQuote limita automáticamente a un comercial a sus propias atribuciones. Solo lectura.',
    inputSchema: z.object({ comercial: z.string().optional(), estado: estados.optional() }),
    execute: async (token, raw) => {
      const input = z.object({ comercial: z.string().optional(), estado: estados.optional() }).parse(raw);
      return mediquoteRequest(token, 'atribucion', {}, { comercial: input.comercial, estado: input.estado });
    },
  },
  {
    name: 'obtener_atribucion', capability: 'readAttributions',
    description: 'Obtiene la atribución vigente o más relevante de un CIF. Un comercial solo puede obtener las suyas.',
    inputSchema: z.object({ cif: z.string().min(2) }),
    execute: async (token, raw) => {
      const { cif } = z.object({ cif: z.string().min(2) }).parse(raw);
      return mediquoteRequest(token, `atribucion/${encodeURIComponent(cif)}`);
    },
  },
  {
    name: 'crear_atribucion', capability: 'createAttribution',
    description: 'Registra una atribución. Un comercial queda siempre como titular de su propia alta; Dirección puede elegir otro comercial.',
    mutating: true, inputSchema: crearAtribucionSchema,
    execute: async (token, raw) => mediquoteRequest(token, 'atribucion', json('POST', crearAtribucionSchema.parse(raw))),
  },
  {
    name: 'cambiar_estado_atribucion', capability: 'changeAttributionStatus',
    description: 'Cambia el estado de una atribución. Un comercial solo puede modificar las suyas.',
    mutating: true,
    inputSchema: z.object({ cif: z.string().min(2), estado: estadosEditables }),
    execute: async (token, raw) => {
      const input = z.object({ cif: z.string().min(2), estado: estadosEditables }).parse(raw);
      return mediquoteRequest(token, `atribucion/${encodeURIComponent(input.cif)}/estado`, json('PATCH', { estado: input.estado }));
    },
  },
  {
    name: 'prorrogar_atribucion', capability: 'extendAttribution',
    description: 'Prorroga manualmente una atribución. Solo se publica para Dirección. El motivo es obligatorio.',
    mutating: true,
    inputSchema: z.object({ cif: z.string().min(2), dias: z.number().int().min(1).max(60), motivo: z.string().min(3) }),
    execute: async (token, raw) => {
      const input = z.object({ cif: z.string().min(2), dias: z.number().int().min(1).max(60), motivo: z.string().min(3) }).parse(raw);
      return mediquoteRequest(token, `atribucion/${encodeURIComponent(input.cif)}/prorroga`, json('POST', { dias: input.dias, motivo: input.motivo }));
    },
  },
  {
    name: 'cerrar_atribucion', capability: 'closeAttribution',
    description: 'Marca una atribución como cerrada. Un comercial solo puede cerrar las suyas. El cierre sigue requiriendo validación de Dirección y requiere confirmación explícita.',
    mutating: true,
    inputSchema: z.object({ cif: z.string().min(2), confirmar: z.literal(true) }),
    execute: async (token, raw) => {
      const input = z.object({ cif: z.string().min(2), confirmar: z.literal(true) }).parse(raw);
      return mediquoteRequest(token, `atribucion/${encodeURIComponent(input.cif)}/cerrar`, { method: 'POST' });
    },
  },
  {
    name: 'vencimientos_proximos', capability: 'readExpirations',
    description: 'Lista atribuciones que vencen en los próximos N días. Para comerciales devuelve solo las propias. Solo lectura.',
    inputSchema: z.object({ dias: z.number().int().min(1).max(180).default(15) }),
    execute: async (token, raw) => {
      const { dias } = z.object({ dias: z.number().int().min(1).max(180).default(15) }).parse(raw);
      return mediquoteRequest(token, 'atribucion/vencimientos', {}, { dias });
    },
  },
  {
    name: 'listar_presupuestos', capability: 'readBudgets',
    description: 'Lista presupuestos visibles para el usuario conectado, con filtros opcionales. Solo lectura; MediQuote aplica sus reglas de visibilidad y saneado.',
    inputSchema: z.object({ status: estadosPresupuesto.optional(), client: z.string().trim().optional(), search: z.string().trim().optional(), limit: z.number().int().min(1).max(100).default(50) }),
    execute: async (token, raw) => {
      const input = z.object({ status: estadosPresupuesto.optional(), client: z.string().trim().optional(), search: z.string().trim().optional(), limit: z.number().int().min(1).max(100).default(50) }).parse(raw);
      return mediquoteRequest(token, 'presupuestos', {}, { status: input.status, client: input.client, search: input.search, limit: input.limit });
    },
  },
  {
    name: 'obtener_presupuesto', capability: 'readBudgets',
    description: 'Obtiene el detalle de un presupuesto visible para el usuario conectado. Solo lectura.',
    inputSchema: z.object({ id: z.string().min(1) }),
    execute: async (token, raw) => {
      const { id } = z.object({ id: z.string().min(1) }).parse(raw);
      return mediquoteRequest(token, `presupuestos/${encodeURIComponent(id)}`);
    },
  },
  {
    name: 'listar_comerciales', capability: 'listCommercials',
    description: 'Lista comerciales visibles para el usuario. Un comercial solo recibe su propia identidad. Solo lectura.',
    inputSchema: z.object({}),
    execute: async (token) => mediquoteRequest(token, 'comerciales'),
  },
];

export function toolsForCapabilities(capabilities: MediQuoteCapabilities): ToolDefinition[] {
  return tools.filter((tool) => capabilities[tool.capability] === true);
}

export function toolByName(name: string, capabilities: MediQuoteCapabilities): ToolDefinition | undefined {
  return toolsForCapabilities(capabilities).find((tool) => tool.name === name);
}

export function toolManifest(capabilities: MediQuoteCapabilities) {
  return toolsForCapabilities(capabilities).map((tool) => ({
    name: tool.name,
    description: tool.description,
    mutating: Boolean(tool.mutating),
    inputSchema: z.toJSONSchema(tool.inputSchema, { io: 'input' }),
  }));
}
