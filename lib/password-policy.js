export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_BYTES = 72;

export function passwordProblem(password) {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (new TextEncoder().encode(password).length > MAX_PASSWORD_BYTES) {
    return `Password is too long. Please use ${MAX_PASSWORD_BYTES} characters or fewer.`;
  }
  return null;
}