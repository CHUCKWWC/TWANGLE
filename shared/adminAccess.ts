// Admin users who have access to reports
const ADMIN_EMAILS = [
  'charle.watson@wholewellness-coaching.org',  // Note: typo in first name (charle vs charles)
  'charles.watson@wholewellness-coaching.org', // Correct spelling
  'charles.watsn@gmail.com',                   // Note: typo in last name (watsn vs watson)
];

export function isAdminUser(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
