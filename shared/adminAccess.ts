// Admin users who have access to reports
const ADMIN_EMAILS = [
  'charle.watson@wholewellness-coaching.org',
  'charles.watsn@gmail.com',
];

export function isAdminUser(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
