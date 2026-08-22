import { AdminRole } from '@prisma/client';

export interface AuthenticatedAdmin {
  id: string;
  email: string;
  role: AdminRole;
}

export interface AuthenticatedDeviceUser {
  id: string;
  uniqueId: string;
}

declare global {
  namespace Express {
    interface Request {
      /** Populated by the `authenticate` middleware after a valid access token is presented. */
      admin?: AuthenticatedAdmin;
      /** Populated by the `resolveDeviceUser` middleware from the X-Device-ID header. */
      deviceUser?: AuthenticatedDeviceUser;
    }
  }
}

export {};
