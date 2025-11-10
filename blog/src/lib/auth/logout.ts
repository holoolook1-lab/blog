export async function logout(redirect?: string) {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {}
  if (redirect) {
    window.location.href = redirect;
  } else {
    window.location.reload();
  }
}

