class ApiResult {
  constructor(obj) {
    this.error = false;
    this.result = {
      success: true,
      data: obj,
    };
  }
}

class InsertResult extends ApiResult {
  constructor(message, newId) {
    super({
      description: message,
      insertedId: newId,
    });
  }
}

class OkResult extends ApiResult {
  constructor(message) {
    super({
      description: message,
    });
  }
}

class WarningResult extends ApiResult {
  constructor(message) {
    super({});
    this.result.success = false;
    this.result.warning = {
      message: message,
    };
  }
}

export {
  ApiResult,
  InsertResult,
  OkResult,
  WarningResult,
};
