export async function register() {
  // Edge runtime does not have access to the database
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { initAdmin } = await import('@/lib/init-admin');
  await initAdmin();
}
