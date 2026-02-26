import { Prisma } from '@prisma/client'
import { JsonWebTokenError, NotBeforeError, TokenExpiredError } from 'jsonwebtoken'
import { ZodError } from 'zod'
import ApiError from './ApiError'

export type IGenericErrorMessage = {
  path: string
  message: string
}

export type IGenericErrorResponse = {
  statusCode: number
  message: string
  errorMessages: IGenericErrorMessage[]
}

const handleError = (error: unknown): IGenericErrorResponse => {
  const statusCode =
    typeof error === 'object' && error !== null && 'statusCode' in error
      ? (error as { statusCode?: number }).statusCode
      : undefined
  const status =
    typeof error === 'object' && error !== null && 'status' in error
      ? (error as { status?: number }).status
      : undefined
  const type =
    typeof error === 'object' && error !== null && 'type' in error
      ? (error as { type?: string }).type
      : undefined

  if (type === 'entity.too.large' || statusCode === 413 || status === 413) {
    return {
      statusCode: 413,
      message: 'Request payload is too large.',
      errorMessages: [
        {
          path: 'body',
          message:
            'Payload exceeds server body limit. Reduce file size or increase REQUEST_BODY_LIMIT.',
        },
      ],
    }
  }

  if (error instanceof ApiError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
      errorMessages: [{ path: '', message: error.message }],
    }
  }

  if (error instanceof ZodError) {
    return {
      statusCode: 400,
      message: 'Validation failed.',
      errorMessages: error.issues.map((issue) => ({
        path: issue.path.join('.') || 'body',
        message: issue.message,
      })),
    }
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const target = Array.isArray(error.meta?.target)
        ? error.meta?.target.join(', ')
        : 'field'

      return {
        statusCode: 409,
        message: 'Unique constraint failed.',
        errorMessages: [{ path: target, message: `${target} already exists.` }],
      }
    }

    return {
      statusCode: 400,
      message: 'Database request failed.',
      errorMessages: [{ path: '', message: error.message }],
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return {
      statusCode: 400,
      message: 'Invalid database payload.',
      errorMessages: [{ path: '', message: error.message }],
    }
  }

  if (
    error instanceof TokenExpiredError ||
    error instanceof JsonWebTokenError ||
    error instanceof NotBeforeError
  ) {
    return {
      statusCode: 401,
      message: 'Invalid or expired token.',
      errorMessages: [{ path: 'authorization', message: 'Please login again.' }],
    }
  }

  if (error instanceof Error) {
    return {
      statusCode: 500,
      message: error.message || 'Something went wrong.',
      errorMessages: [{ path: '', message: error.message }],
    }
  }

  return {
    statusCode: 500,
    message: 'Something went wrong.',
    errorMessages: [{ path: '', message: 'Unexpected error occurred.' }],
  }
}

export default handleError
