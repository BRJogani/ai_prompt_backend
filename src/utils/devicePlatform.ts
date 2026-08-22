import { DevicePlatform } from '@prisma/client';

export function parseDevicePlatform(header?: string): DevicePlatform | undefined {
  if (!header) return undefined;
  const upper = header.toUpperCase();
  return upper === 'ANDROID' || upper === 'IOS' ? (upper as DevicePlatform) : 'OTHER';
}

export function headerString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
