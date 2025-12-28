import { neon } from '@neondatabase/serverless';

// Create a pooled connection
const sql = neon(process.env.DATABASE_URL);

// For non-pooled connections (if needed)
const directSql = neon(process.env.DIRECT_URL);

export async function query(text, params) {
  try {
    const start = Date.now();
    const result = await sql(text, ...(params || []));
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.length });
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function transaction(queries) {
  try {
    const results = [];
    for (const q of queries) {
      results.push(await sql(q.text, ...(q.params || [])));
    }
    return results;
  } catch (error) {
    console.error('Transaction error:', error);
    throw error;
  }
}

// Export the sql client for direct use
export { sql, directSql };
