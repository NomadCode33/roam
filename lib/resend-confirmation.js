export async function requestResend(email) {
  try {
    const res = await fetch('/api/auth/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, message: data.error || 'Something went wrong. Please try again.' };
    }
    return { ok: true, message: data.message };
  } catch {
    return { ok: false, message: 'Network error. Please try again.' };
  }
}