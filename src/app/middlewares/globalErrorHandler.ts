import { ErrorRequestHandler } from 'express'
import env from '../../config/env'
import handleError from '../errors/handleError'

const globalErrorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const formattedError = handleError(error)

  res.status(formattedError.statusCode).json({
    success: false,
    message: formattedError.message,
    errorMessages: formattedError.errorMessages,
    stack:
      env.NODE_ENV !== 'production' && error instanceof Error ? error.stack : undefined,
  })
}

export default globalErrorHandler
