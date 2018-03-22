import { ErrorsCode, HttpStatus } from '../constants/index';

class ApiError {
  constructor(message) {
    this.error = true;
    this.result = {
      description: message,
      status: ErrorsCode.API_ERROR,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    };
  }
}

class UnauthorizedError extends ApiError {
  constructor(message) {
    super(message);

    this.result.status = ErrorsCode.UNAUTHORIZED;
    this.result.statusCode = HttpStatus.UNAUTHORIZED;
  }
}

class ForbiddenError extends ApiError {
  constructor(message) {
    super(message);

    this.result.status = ErrorsCode.FORBIDDEN;
    this.result.statusCode = HttpStatus.FORBIDDEN;
  }
}

class NotFoundError extends ApiError {
  constructor(message) {
    super(message);

    this.result.status = ErrorsCode.NOT_FOUND;
    this.result.statusCode = HttpStatus.NOT_FOUND;
  }
}

class BadRequestError extends ApiError {
  constructor(message, details) {
    super(message);

    this.result.status = ErrorsCode.BAD_REQUEST;
    this.result.statusCode = HttpStatus.BAD_REQUEST;
    this.result.details = details;
  }
}

export {
  ApiError,
  UnauthorizedError,
  NotFoundError,
  BadRequestError,
  ForbiddenError,
};
