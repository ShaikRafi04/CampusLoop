export const sendSuccess = (res, statusCode = 200, message = 'Success', data = null, meta = null) => {
  const payload = {
    success: true,
    message,
    ...(data !== null && { data }),
    ...(meta !== null && { meta }),
  };
  return res.status(statusCode).json(payload);
};

export const sendError = (res, statusCode = 500, message = 'An error occurred', code = 'INTERNAL_ERROR', details = []) => {
  return res.status(statusCode).json({
    success: false,
    message,
    code,
    details,
  });
};
