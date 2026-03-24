

/**
 * Base class for all application errors.
 */
export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype); // fixes instanceof in transpiled JS
  }
}

/** HTTP 400 */
export class BadRequestError extends AppError {
  constructor(message = "Bad Request") {
    super(message, 400);
  }
}

/** HTTP 401 */
export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

/** HTTP 403 */
export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403);
  }
}

/** HTTP 404 */
export class NotFoundError extends AppError {
  constructor(message = "Not Found") {
    super(message, 404);
  }
}

/** HTTP 409 */
export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(message, 409);
  }
}

/** HTTP 500 */
export class InternalServerError extends AppError {
  constructor(message = "Internal Server Error") {
    super(message, 500);
  }
}

/** HTTP 501 */
export class NotImplementedError extends AppError {
  constructor(message = "Not Implemented") {
    super(message, 501);
  }
}