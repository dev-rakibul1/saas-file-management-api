import { User, UserRole } from '@prisma/client'

export type SafeUser = Omit<User, 'password'>

export type JwtUserPayload = {
  userId: string
  email: string
  role: UserRole
}

export type LoginUserResponse = {
  user: SafeUser
  accessToken: string
  loginToken: string
}
