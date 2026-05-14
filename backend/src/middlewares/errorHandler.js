const AppError = require('../utils/AppError');
const config = require('../config/env');
const logger = require('../utils/logger');

module.exports = function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    logger.warn('errorHandler', 'AppError', {
      code: err.code,
      statusCode: err.statusCode,
      message: err.message,
      method: req.method,
      path: req.originalUrl,
    });
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message },
    });
  }

  logger.error('errorHandler', 'unhandled error', {
    method: req.method,
    path: req.originalUrl,
    message: err.message,
    stack: err.stack,
  });

  const body = {
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal Server Error' },
  };
  if (config.nodeEnv !== 'production') {
    body.error.stack = err.stack;
  }
  res.status(500).json(body);
};
