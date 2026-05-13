const AppError = require('../utils/AppError');
const config = require('../config/env');

module.exports = function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message },
    });
  }

  console.error('[errorHandler]', err);

  const body = {
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal Server Error' },
  };
  if (config.nodeEnv !== 'production') {
    body.error.stack = err.stack;
  }
  res.status(500).json(body);
};
