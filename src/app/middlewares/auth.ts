import { NextFunction, Request, RequestHandler, Response } from 'express'
import { UserRole } from '@prisma/client'
import { verifyAccessToken } from '../../config/jwt'
import { prisma } from '../db/prisma'
import ApiError from '../errors/ApiError'
import { JwtUserPayload } from '../modules/user/user.model'

export type AuthRequest = Request & {
  user?: JwtUserPayload
}

const auth = (...requiredRoles: UserRole[]): RequestHandler => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const authorization = req.headers.authorization

      if (!authorization || !authorization.startsWith('Bearer ')) {
        throw new ApiError(401, 'You are not authorized.')
      }

      const token = authorization.split(' ')[1]
      const verifiedUser = verifyAccessToken(token)

      const existingUser = await prisma.user.findUnique({
        where: { id: verifiedUser.userId },
        select: {
          email: true,
          role: true,
        },
      })

      if (!existingUser) {
        throw new ApiError(401, 'You are not authorized.')
      }

      if (requiredRoles.length && !requiredRoles.includes(existingUser.role)) {
        throw new ApiError(403, 'Forbidden user.')
      }

      ;(req as AuthRequest).user = {
        ...verifiedUser,
        email: existingUser.email,
        role: existingUser.role,
      }
      next()
    } catch (error) {
      next(error)
    }
  }
}

export default auth
