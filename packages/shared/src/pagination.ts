export interface CursorPage<T> {
  data: T[];
  nextCursor: string | null;
}

export interface CursorPayload {
  [key: string]: string | number | boolean | null;
}

export function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodeCursor<T extends CursorPayload = CursorPayload>(
  cursor: string,
): T {
  try {
    return JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as T;
  } catch {
    throw new Error('Cursor inválido');
  }
}

export function parseLimit(
  value: unknown,
  fallback = 20,
  max = 100,
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.trunc(parsed), max);
}
