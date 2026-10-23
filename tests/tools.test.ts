import { describe, expect, it } from 'vitest';
import { toolByName, toolManifest } from '../src/tools.js';

describe('tool registry', () => {
  it('expone las 13 herramientas esperadas con JSON Schema', () => {
    const manifest = toolManifest();
    expect(manifest).toHaveLength(13);
    const names = manifest.map((tool) => tool.name);
    expect(names).toContain('listar_clientes');
    expect(names).toContain('cerrar_atribucion');
    expect(names).toContain('listar_presupuestos');
    expect(names).toContain('obtener_presupuesto');
    expect(manifest.every((tool) => typeof tool.inputSchema === 'object')).toBe(true);
  });

  it('marca escrituras, mantiene presupuestos read-only y exige confirmación al cerrar', () => {
    const manifest = toolManifest();
    const close = manifest.find((tool) => tool.name === 'cerrar_atribucion');
    const budgets = manifest.find((tool) => tool.name === 'listar_presupuestos');
    expect(close?.mutating).toBe(true);
    expect(budgets?.mutating).toBe(false);
    expect(JSON.stringify(close?.inputSchema)).toContain('confirmar');
    expect(toolByName('no_existe')).toBeUndefined();
  });
});
