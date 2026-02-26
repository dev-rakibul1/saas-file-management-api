import { NextFunction, Request, RequestHandler, Response } from 'express'
import { verifyAccessToken } from '../../config/jwt'
import ApiError from '../errors/ApiError'
import { JwtUserPayload } from '../modules/user/user.model'

export type AuthRequest = Request & {
  user?: JwtUserPayload
}

const auth = (...requiredRoles: string[]): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const authorization = req.headers.authorization

      if (!authorization || !authorization.startsWith('Bearer ')) {
        throw new ApiError(401, 'You are not authorized.')
      }

      const token = authorization.split(' ')[1]
      const verifiedUser = verifyAccessToken(token)

      if (requiredRoles.length && !requiredRoles.includes(verifiedUser.role)) {
        throw new ApiError(403, 'Forbidden user.')
      }

      ;(req as AuthRequest).user = verifiedUser
      next()
    } catch (error) {
      next(error)
    }
  }
}

export default auth
