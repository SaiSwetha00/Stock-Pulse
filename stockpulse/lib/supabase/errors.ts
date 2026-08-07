/**
 * Schema migrations in this project are applied by hand in the Supabase SQL
 * editor (see supabase/schema*.sql). A page that reads a table from a migration
 * the operator has not run yet should explain that, not blow up — so we need to
 * tell "table isn't there" apart from a genuine query failure.
 */

/** Postgres: undefined_table. */
const UNDEFINED_TABLE = '42P01'
/** PostgREST: the table is missing from the schema cache. */
const SCHEMA_CACHE_MISS = 'PGRST205'

export function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  if (error.code === UNDEFINED_TABLE || error.code === SCHEMA_CACHE_MISS) return true
  // PostgREST does not always populate `code`; fall back to the message shape.
  return /relation .* does not exist|could not find the table/i.test(error.message ?? '')
}
