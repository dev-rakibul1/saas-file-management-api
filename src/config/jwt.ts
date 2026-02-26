import jwt, { Secret, SignOptions } from 'jsonwebtoken'
import { JwtUserPayload } from '../app/modules/user/user.model'
import env from './env'

const createAccessToken = (payload: JwtUserPayload): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET as Secret, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'],
  })
}

const createLoginToken = (payload: JwtUserPayload): string => {
  return jwt.sign(payload, env.JWT_LOGIN_SECRET as Secret, {
    expiresIn: env.JWT_LOGIN_EXPIRES_IN as SignOptions['expiresIn'],
  })
}

const verifyAccessToken = (token: string): JwtUserPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET as Secret) as JwtUserPayload
}

export { createAccessToken, createLoginToken, verifyAccessToken }
