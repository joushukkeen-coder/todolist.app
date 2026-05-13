class AppError extends Error {
  constructor(code, statusCode, message) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

module.exports = AppError;
