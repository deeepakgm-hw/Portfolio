module.exports = (err, req, res, next) => {
  console.error('Unhandled Server Error:', err);

  const statusCode = err.status || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
