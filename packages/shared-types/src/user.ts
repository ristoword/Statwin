export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
}
