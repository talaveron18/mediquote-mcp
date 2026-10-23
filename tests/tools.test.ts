import { describe, expect, it } from 'vitest';
import { toolByName, toolManifest } from '../src/tools.js';
import type { MediQuoteCapabilities } from '../src/mediquote-client.js';

const all: MediQuoteCapabilities = {
  readClients: true, createClient: true, readAttributions: true, createAttribution: true,
  changeAttributionStatus: true, extendAttribution: true, closeAttribution: true,
  readExpirations: true, readBudgets: true, listCommercials: true,
};

const commercial: MediQuoteCapabilities = {
  readClients: true, createClient: false, readAttributions: true, createAttribution: true,
  changeAttributionStatus: true, extendAttribution: false, closeAttribution: true,
  readExpirations: true, readBudgets: false, listCommercials: true,
};

describe('tool registry', () => {
  it('expone todas las herramientas permitidas para Dirección', () => {
    const manifest = toolManifest(all);
    expect(manifest).toHaveLength(13);
    const names = manifest.map((tool) => tool.name);
    expect(names).toContain('listar_clientes');
    expect(names).toContain('prorrogar_atribucion');
    expect(names).toContain('listar_presupuestos');
    expect(names).toContain('obtener_presupuesto');
    expect(manifest.every((tool) => typeof tool.inputSchema === 'object')).toBe(true);
  });

  it('oculta a un comercial herramientas para las que no tiene capacidad', () => {
    const manifest = toolManifest(commercial);
    const names = manifest.map((tool) => tool.name);
    expect(names).not.toContain('crear_cliente');
    expect(names).not.toContain('prorrogar_atribucion');
    expect(names).not.toContain('listar_presupuestos');
    expect(names).toContain('crear_atribucion');
    expect(names).toContain('cerrar_atribucion');
    expect(toolByName('prorrogar_atribucion', commercial)).toBeUndefined();
  });

  it('marca escrituras y exige confirmación al cerrar', () => {
    const manifest = toolManifest(all);
    const close = manifest.find((tool) => tool.name === 'cerrar_atribucion');
    const budgets = manifest.find((tool) => tool.name === 'listar_presupuestos');
    expect(close?.mutating).toBe(true);
    expect(budgets?.mutating).toBe(false);
    expect(JSON.stringify(close?.inputSchema)).toContain('confirmar');
    expect(toolByName('no_existe', all)).toBeUndefined();
  });
});
