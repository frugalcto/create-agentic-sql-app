import type { Pool } from "pg";

export async function callProcedure<T>(
  db: Pool,
  procedureName: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  const entries = Object.entries(params);
  const placeholders = entries.map((_, index) => `$${index + 1}`);
  const values = entries.map(([, value]) => value);
  const argumentList = placeholders.length > 0 ? placeholders.join(", ") : "";
  const query = `select ${procedureName}(${argumentList}) as result`;

  const result = await db.query<{ result: T }>(query, values);

  return result.rows[0].result;
}
