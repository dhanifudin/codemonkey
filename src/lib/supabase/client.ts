import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

/** This Supabase project also hosts sibling apps ("lulu", "bomi") in their
 * own schemas. Pinning `db.schema` to "codemonkey" means every query this
 * client makes is scoped to our schema by construction — there is no way
 * for a query here to accidentally read or write another app's tables. */
export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
	db: { schema: 'codemonkey' }
});
