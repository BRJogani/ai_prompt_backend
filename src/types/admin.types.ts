import { AdminRole } from '@prisma/client';

/** Claims embedded in both admin access and refresh JWTs. */
export interface AdminTokenPayload {
  sub: string;
  email: string;
  role: AdminRole;
}
