import { createClient } from '@supabase/supabase-js';

export interface TestUser {
  email: string;
  password: string;
  name: string;
  accessToken: string;
  userId: string;
}

/** Creates a unique test user via the Supabase admin API and logs them in. */
export async function createTestUser(tag = ''): Promise<TestUser> {
  const suffix = `${tag ? tag + '_' : ''}${Date.now()}`;
  const email = `e2e_${suffix}@llp-test.local`;
  const password = 'Test1234!';
  const name = `E2E User ${suffix}`;

  const admin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Create auth user
  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authErr || !authData.user) {
    throw new Error(`createTestUser auth failed: ${authErr?.message}`);
  }

  // Create profile row
  await admin.from('profiles').insert({
    id: authData.user.id,
    name,
    first_name: '',
    last_name: '',
  });

  // Sign in to get tokens
  const res = await fetch(`${process.env.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: process.env.SUPABASE_ANON_KEY! },
    body: JSON.stringify({ email, password }),
  });
  const session = await res.json() as { access_token: string };

  return { email, password, name, accessToken: session.access_token, userId: authData.user.id };
}

/** Deletes a test user completely (auth + profile). */
export async function deleteTestUser(userId: string): Promise<void> {
  const admin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  await admin.from('profiles').delete().eq('id', userId);
  await admin.auth.admin.deleteUser(userId);
}
