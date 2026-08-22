/**
 * Base application error. All operational errors thrown anywhere in the
 * codebase should extend this class so the centralized error handler can
 * respond with the correct HTTP status code and a consistent JSON shape.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: unknown[];

  constructor(statusCode: number, message: string, errors?: unknown[], isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends ApiError {
  constructor(message = 'Validation failed', errors?: unknown[]) {
    super(400, message, errors);
  }
}

export class AuthenticationError extends ApiError {
  constructor(message = 'Authentication required') {
    super(401, message);
  }
}

export class AuthorizationError extends ApiError {
  constructor(message = 'You do not have permission to perform this action') {
    super(403, message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(404, message);
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'Resource already exists') {
    super(409, message);
  }
}

export class RateLimitError extends ApiError {
  constructor(message = 'Too many requests, please try again later') {
    super(429, message);
  }
}

export class DatabaseError extends ApiError {
  constructor(message = 'A database error occurred') {
    super(500, message, undefined, false);
  }
}

export class CloudinaryError extends ApiError {
  constructor(message = 'A media storage error occurred') {
    super(502, message, undefined, false);
  }
}

export class InternalServerError extends ApiError {
  constructor(message = 'Internal server error') {
    super(500, message, undefined, false);
  }
}
