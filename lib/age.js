export function calculateAge(dateOfBirth) {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export function meetsMinimumAge(dateOfBirth, isEU) {
  const minimumAge = isEU ? 16 : 13;
  return calculateAge(dateOfBirth) >= minimumAge;
}