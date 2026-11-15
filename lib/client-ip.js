export function getClientIp(req) {
  const forwarded = req.headers.get('x-forwarded-for');
  const first = forwarded ? forwarded.split(',')[0].trim() : '';
  return first || req.headers.get('x-real-ip')?.trim() || null;
}