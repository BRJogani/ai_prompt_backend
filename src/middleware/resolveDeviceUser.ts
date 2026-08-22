import { NextFunction, Request, Response } from 'express';
import { ValidationError } from '@utils/ApiError';
import { userService } from '@modules/users/user.service';
import { catchAsync } from '@utils/catchAsync';
import { parseDevicePlatform, headerString } from '@utils/devicePlatform';

/**
 * Required on every endpoint that's scoped to a specific anonymous user
 * (favorites, history, analytics). Reads the client-generated UUID from
 * `X-Device-ID`, upserts the corresponding User row, and attaches it as
 * `req.deviceUser`. Optional headers (X-Platform, X-App-Version,
 * X-Device-Model, X-OS-Version) enrich the User record when present but
 * are never required.
 */
export const resolveDeviceUser = catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
  const uniqueId = headerString(req.headers['x-device-id']);

  if (!uniqueId) {
    throw new ValidationError('The X-Device-ID header is required');
  }

  const user = await userService.resolveOrCreate(uniqueId, {
    platform: parseDevicePlatform(headerString(req.headers['x-platform'])),
    appVersion: headerString(req.headers['x-app-version']),
    deviceModel: headerString(req.headers['x-device-model']),
    osVersion: headerString(req.headers['x-os-version']),
    language: req.headers['accept-language']?.toString().split(',')[0],
  });

  req.deviceUser = { id: user.id, uniqueId: user.uniqueId };
  next();
});

export default resolveDeviceUser;
