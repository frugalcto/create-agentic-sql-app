import type { Pool, PoolClient } from "pg";

async function callProcedureOnClient<T>(
  client: PoolClient,
  procedureName: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  const entries = Object.entries(params);
  const placeholders = entries.map((_, index) => `$${index + 1}`);
  const values = entries.map(([, value]) => value);
  const argumentList = placeholders.length > 0 ? placeholders.join(", ") : "";
  const query = `select ${procedureName}(${argumentList}) as result`;

  const result = await client.query<{ result: T }>(query, values);

  return result.rows[0].result;
}

export async function callProcedure<T>(
  db: Pool,
  procedureName: string,
  params: Record<string, unknown> = {},
  sessionToken: string | null = null,
): Promise<T> {
  const client = await db.connect();

  try {
    await client.query("begin");
    if (sessionToken) {
      await client.query(`select set_config('app.session_token', $1, true)`, [
        sessionToken,
      ]);
    }

    const result = await callProcedureOnClient<T>(client, procedureName, params);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
