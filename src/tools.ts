import * as z from 'zod/v4';
import { mediquoteRequest } from './mediquote-client.js';

export type ToolDefinition = {
  name: string;
  description: string;
  inputSchema: z.ZodType;
  execute: (input: unknown) => Promise<unknown>;
  mutating?: boolean;
};

function json(method: string, body: unknown): RequestInit {
  return { method, body: JSON.stringify(body) };
}

const estados = z.enum(['prospecting', 'proposal_sent', 'proposal_accepted', 'closed', 'expired', 'released', 'exit_hold']);
const estadosEditables = z.enum(['prospecting', 'proposal_sent', 'proposal_accepted', 'closed']);

const crearClienteSchema = z.object({
  businessName: z.string().min(1).describe('Razón social'),
  cif: z.string().min(2).describe('CIF/NIF español'),
  fiscalAddress: z.string().min(1).describe('Domicilio fiscal'),
  contactPerson: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  sector: z.string().optional(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
});

const crearAtribucionSchema = z.object({
  cif: z.string().min(2),
  businessName: z.string().min(1),
  commercialId: z.string().min(1),
  service: z.string().min(1),
  contactPerson: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  notes: z.string().optional(),
});

export const tools: ToolDefinition[] = [
  {
    name: 'listar_clientes',
    description: 'Lista los clientes de MediQuote. Puede filtrar por texto en razón social, CIF, contacto o email. Solo lectura.',
    inputSchema: z.object({ search: z.string().trim().optional().describe('Texto opcional de búsqueda') }),
    execute: async (raw) => {
      const input = z.object({ search: z.string().trim().optional() }).parse(raw);
      return mediquoteRequest('clientes', {}, { search: input.search });
    },
  },
  {
    name: 'obtener_cliente',
    description: 'Obtiene un cliente concreto por CIF/NIF. Solo lectura.',
    inputSchema: z.object({ cif: z.string().min(2).describe('CIF/NIF del cliente') }),
    execute: async (raw) => {
      const { cif } = z.object({ cif: z.string().min(2) }).parse(raw);
      return mediquoteRequest(`clientes/${encodeURIComponent(cif)}`);
    },
  },
  {
    name: 'crear_cliente',
    description: 'Crea un cliente en MediQuote y aplica las reglas vigentes de sincronización con Atribución Comercial.',
    mutating: true,
    inputSchema: crearClienteSchema,
    execute: async (raw) => mediquoteRequest('clientes', json('POST', crearClienteSchema.parse(raw))),
  },
  {
    name: 'listar_atribuciones',
    description: 'Lista atribuciones comerciales. Puede filtrar por comercial y estado. Solo lectura.',
    inputSchema: z.object({ comercial: z.string().optional(), estado: estados.optional() }),
    execute: async (raw) => {
      const input = z.object({ comercial: z.string().optional(), estado: estados.optional() }).parse(raw);
      return mediquoteRequest('atribucion', {}, { comercial: input.comercial, estado: input.estado });
    },
  },
  {
    name: 'obtener_atribucion',
    description: 'Obtiene la atribución vigente o más relevante para un CIF. Solo lectura.',
    inputSchema: z.object({ cif: z.string().min(2) }),
    execute: async (raw) => {
      const { cif } = z.object({ cif: z.string().min(2) }).parse(raw);
      return mediquoteRequest(`atribucion/${encodeURIComponent(cif)}`);
    },
  },
  {
    name: 'crear_atribucion',
    description: 'Registra una atribución comercial respetando disponibilidad, grupos, reservas y reglas de MediQuote.',
    mutating: true,
    inputSchema: crearAtribucionSchema,
    execute: async (raw) => mediquoteRequest('atribucion', json('POST', crearAtribucionSchema.parse(raw))),
  },
  {
    name: 'cambiar_estado_atribucion',
    description: 'Cambia el estado de una atribución a un estado editable permitido por MediQuote.',
    mutating: true,
    inputSchema: z.object({ cif: z.string().min(2), estado: estadosEditables }),
    execute: async (raw) => {
      const input = z.object({ cif: z.string().min(2), estado: estadosEditables }).parse(raw);
      return mediquoteRequest(`atribucion/${encodeURIComponent(input.cif)}/estado`, json('PATCH', { estado: input.estado }));
    },
  },
  {
    name: 'prorrogar_atribucion',
    description: 'Prorroga manualmente una atribución. El motivo es obligatorio y MediQuote aplica los límites acumulados.',
    mutating: true,
    inputSchema: z.object({ cif: z.string().min(2), dias: z.number().int().min(1).max(60), motivo: z.string().min(3) }),
    execute: async (raw) => {
      const input = z.object({ cif: z.string().min(2), dias: z.number().int().min(1).max(60), motivo: z.string().min(3) }).parse(raw);
      return mediquoteRequest(`atribucion/${encodeURIComponent(input.cif)}/prorroga`, json('POST', { dias: input.dias, motivo: input.motivo }));
    },
  },
  {
    name: 'cerrar_atribucion',
    description: 'Marca una atribución como cerrada. No sustituye la validación final de Dirección. Requiere confirmación explícita del usuario.',
    mutating: true,
    inputSchema: z.object({ cif: z.string().min(2), confirmar: z.literal(true).describe('Debe ser true tras confirmación explícita del usuario') }),
    execute: async (raw) => {
      const input = z.object({ cif: z.string().min(2), confirmar: z.literal(true) }).parse(raw);
      return mediquoteRequest(`atribucion/${encodeURIComponent(input.cif)}/cerrar`, { method: 'POST' });
    },
  },
  {
    name: 'vencimientos_proximos',
    description: 'Lista atribuciones activas que vencen en los próximos N días. Solo lectura.',
    inputSchema: z.object({ dias: z.number().int().min(1).max(180).default(15) }),
    execute: async (raw) => {
      const { dias } = z.object({ dias: z.number().int().min(1).max(180).default(15) }).parse(raw);
      return mediquoteRequest('atribucion/vencimientos', {}, { dias });
    },
  },
  {
    name: 'listar_comerciales',
    description: 'Lista comerciales activos de MediQuote con sus identificadores. Solo lectura.',
    inputSchema: z.object({}),
    execute: async () => mediquoteRequest('comerciales'),
  },
];

export function toolByName(name: string): ToolDefinition | undefined {
  return tools.find((tool) => tool.name === name);
}

export function toolManifest() {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    mutating: Boolean(tool.mutating),
    inputSchema: z.toJSONSchema(tool.inputSchema, { io: 'input' }),
  }));
}
