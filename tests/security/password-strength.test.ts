import { describe, expect, it } from 'vitest';
import { evaluatePasswordStrength, MIN_PASSWORD_LENGTH } from '@/lib/auth/password-strength';

describe('password strength indicator', () => {
  it('reports an empty password as weak without hints', () => {
    const result = evaluatePasswordStrength('');

    expect(result.level).toBe(0);
    expect(result.label).toBe('Kurang Kuat');
    expect(result.meetsMinimumLength).toBe(false);
    expect(result.pendingHints).toEqual([]);
  });

  it('never reports below minimum length as stronger than weak', () => {
    for (const value of ['a', 'abc', 'abcdefg']) {
      const result = evaluatePasswordStrength(value);

      expect(value.length).toBeLessThan(MIN_PASSWORD_LENGTH);
      expect(result.score).toBe(0);
      expect(result.label).toBe('Kurang Kuat');
      expect(result.meetsMinimumLength).toBe(false);
    }
  });

  it('shows how many characters are still missing', () => {
    expect(evaluatePasswordStrength('abcde').pendingHints[0]).toContain('3 karakter');
  });

  it('rates a minimum-length single-class password as weak', () => {
    const result = evaluatePasswordStrength('abcdefgh');

    expect(result.meetsMinimumLength).toBe(true);
    expect(result.label).toBe('Kurang Kuat');
    expect(result.pendingHints.length).toBeGreaterThan(0);
  });

  it('rates a short two-class password as medium', () => {
    const result = evaluatePasswordStrength('Abcdefgh');

    expect(result.level).toBe(1);
    expect(result.label).toBe('Sedang');
  });

  it('rates mixed-case with a digit as strong', () => {
    const result = evaluatePasswordStrength('Abcdefg1');

    expect(result.meetsMinimumLength).toBe(true);
    expect(result.level).toBe(2);
    expect(result.label).toBe('Kuat');
    expect(result.filledSegments).toBe(4);
  });

  it('rates a long multi-class password as strong', () => {
    const result = evaluatePasswordStrength('Abcdefg1x9yz!');

    expect(result.score).toBe(4);
    expect(result.level).toBe(2);
    expect(result.label).toBe('Kuat');
  });

  it('awards a length bonus even with a single character class', () => {
    // Satu kelas karakter (huruf kecil) + panjang >= 12.
    expect(evaluatePasswordStrength('abcdefghijklm').score).toBe(2);
  });

  it('always fills at least one segment so the bar never looks empty', () => {
    expect(evaluatePasswordStrength('').filledSegments).toBe(1);
  });

  it('maps every level to a distinct visible label', () => {
    const labels = ['abcdefgh', 'Abcdefgh', 'Abcdefg1'].map(
      (value) => evaluatePasswordStrength(value).label,
    );

    expect(labels).toEqual(['Kurang Kuat', 'Sedang', 'Kuat']);
  });
});
