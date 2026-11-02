import { parseTtlSeconds } from '../src/auth/auth.service';

describe('parseTtlSeconds', () => {
  it('interpreta segundos puros', () => {
    expect(parseTtlSeconds('900', 60)).toBe(900);
  });

  it('interpreta minutos, horas e dias', () => {
    expect(parseTtlSeconds('15m', 0)).toBe(900);
    expect(parseTtlSeconds('2h', 0)).toBe(7_200);
    expect(parseTtlSeconds('30d', 0)).toBe(2_592_000);
  });

  it('usa o fallback para valores inválidos', () => {
    expect(parseTtlSeconds('abc', 300)).toBe(300);
    expect(parseTtlSeconds('15x', 300)).toBe(300);
  });
});
