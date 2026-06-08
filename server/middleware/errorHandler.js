/**
 * middleware/errorHandler.js
 * Centralized error handling middleware.
 * 
 * Usage in server.js (MUST be registered after all routes):
 *   app.use(notFound);
 *   app.use(errorHandler);
 */

/**
 * notFound — catches any route that wasn't matched and passes a 404 error
 * to the next error handler. Ensures JSON response (not Express HTML default).
 */
function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.status = 404;
  next(error);
}

/**
 * errorHandler — global Express error handler.
 * Handles both operational errors and unexpected crashes.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.status || res.statusCode === 200 ? 500 : res.statusCode;

  // Log full error in development; minimal in production
  if (process.env.NODE_ENV !== 'production') {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
  } else {
    console.error(`❌ [${statusCode}] ${req.method} ${req.originalUrl}: ${err.message}`);
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    // Only expose stack trace in development
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

module.exports = { notFound, errorHandler };
