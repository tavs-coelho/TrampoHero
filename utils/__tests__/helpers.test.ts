import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate } from '../helpers';

describe('formatCurrency', () => {
  it('should format 100 as BRL currency', () => {
    const result = formatCurrency(100);
    expect(result).toContain('100');
    expect(result).toContain('R$');
  });

  it('should format 0 as BRL currency', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
    expect(result).toContain('R$');
  });

  it('should format 1234.56 correctly', () => {
    const result = formatCurrency(1234.56);
    expect(result).toContain('R$');
    expect(result).toContain('1.234,56');
  });

  it('should handle negative amounts', () => {
    const result = formatCurrency(-50);
    expect(result).toContain('50');
    expect(result).toContain('R$');
  });
});

describe('formatDate', () => {
  it('should format 2026-01-15 as DD/MM/YYYY in pt-BR', () => {
    const result = formatDate('2026-01-15');
    expect(result).toBe('15/01/2026');
  });

  it('should format 2026-12-31 correctly', () => {
    const result = formatDate('2026-12-31');
    expect(result).toBe('31/12/2026');
  });

  it('should handle invalid input gracefully', () => {
    const result = formatDate('not-a-date');
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });
});
