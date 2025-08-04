const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Default error
  let statusCode = 500;
  let message = 'Internal Server Error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Forbidden';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Not Found';
  } else if (err.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = 'Service Unavailable';
  } else if (err.code === 'ETIMEDOUT') {
    statusCode = 408;
    message = 'Request Timeout';
  }

  // Send error response
  res.status(statusCode).json({
    error: {
      message: message,
      statusCode: statusCode,
      timestamp: new Date().toISOString(),
      path: req.url
    }
  });
};

module.exports = errorHandler; 