function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    next(err);
    return;
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
}

module.exports = {
  errorHandler,
};
