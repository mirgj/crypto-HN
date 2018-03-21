import { Errors, ErrorsCode } from '../constants/index';

class ApiError {
  constructor(message, statusCode) {
    this.error = true;
    this.result = {
      description: message,
      statusCode: statusCode,
      status: ErrorsCode.API_ERROR,
    };
  }
}

class UnauthorizedError extends ApiError {
  constructor(message, statusCode) {
    super(message, statusCode);

    this.result.status = ErrorsCode.UNAUTHORIZED;
  }
}

class NotFoundError extends ApiError {
  constructor(message, statusCode) {
    super(message, statusCode);

    this.result.status = ErrorsCode.NOT_FOUND;
  }
}

class BadRequest extends ApiError {
  constructor(message, details, statusCode) {
    super(message, statusCode);

    this.result.status = ErrorsCode.BAD_REQUEST;
    this.result.details = details;
  }
}

export {
  ApiError,
  UnauthorizedError,
  NotFoundError,
  BadRequest,
};
