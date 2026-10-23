import { describe, expect, it } from 'vitest';
import { toolByName, toolManifest } from '../src/tools.js';

describe('tool registry', () => {
  it('expone las 11 herramientas esperadas con JSON Schema', () => {
    const manifest = toolManifest();
    expect(manifest).toHaveLength(11);
    expect(manifest.map((tool) => tool.name)).toContain('listar_clientes');
    expect(manifest.map((tool) => tool.name)).toContain('cerrar_atribucion');
    expect(manifest.every((tool) => typeof tool.inputSchema === 'object')).toBe(true);
  });

  it('marca escrituras y exige confirmación al cerrar', () => {
    const close = toolManifest().find((tool) => tool.name === 'cerrar_atribucion');
    expect(close?.mutating).toBe(true);
    expect(JSON.stringify(close?.inputSchema)).toContain('confirmar');
    expect(toolByName('no_existe')).toBeUndefined();
  });
});
