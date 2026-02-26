import { Prisma, User, UserRole } from '@prisma/client'
import bcrypt from 'bcrypt'
import env from '../../../config/env'
import { createAccessToken, createLoginToken } from '../../../config/jwt'
import { prisma } from '../../db/prisma'
import ApiError from '../../errors/ApiError'
import { JwtUserPayload, LoginUserResponse, SafeUser } from './user.model'

type CreateUserPayload = {
  name: string
  email: string
  password: string
  role?: UserRole
}

type LoginUserPayload = {
  email: string
  password: string
}

type UpdateUserPayload = {
  name?: string
  email?: string
  password?: string
}

const buildJwtPayload = (user: User): JwtUserPayload => ({
  userId: user.id,
  email: user.email,
  role: user.role,
})

const sanitizeUser = (user: User): SafeUser => {
  const { password: _password, ...safeUser } = user
  return safeUser
}

const createUser = async (payload: CreateUserPayload): Promise<SafeUser> => {
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  })

  if (existingUser) {
    throw new ApiError(409, 'Email already exists.')
  }

  const hashedPassword = await bcrypt.hash(payload.password, env.BCRYPT_SALT_ROUNDS)

  const createdUser = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      password: hashedPassword,
      role: payload.role ?? UserRole.USER,
    },
  })

  return sanitizeUser(createdUser)
}

const loginUser = async (payload: LoginUserPayload): Promise<LoginUserResponse> => {
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  })

  if (!existingUser) {
    throw new ApiError(401, 'Invalid email or password.')
  }

  const isPasswordMatched = await bcrypt.compare(payload.password, existingUser.password)

  if (!isPasswordMatched) {
    throw new ApiError(401, 'Invalid email or password.')
  }

  const jwtPayload = buildJwtPayload(existingUser)

  return {
    user: sanitizeUser(existingUser),
    accessToken: createAccessToken(jwtPayload),
    loginToken: createLoginToken(jwtPayload),
  }
}

const getProfile = async (userId: string): Promise<SafeUser> => {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!existingUser) {
    throw new ApiError(404, 'User not found.')
  }

  return sanitizeUser(existingUser)
}

const updateUser = async (
  userId: string,
  payload: UpdateUserPayload
): Promise<SafeUser> => {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!existingUser) {
    throw new ApiError(404, 'User not found.')
  }

  const updateData: Prisma.UserUpdateInput = {}

  if (payload.name !== undefined) {
    updateData.name = payload.name
  }

  if (payload.email !== undefined) {
    updateData.email = payload.email
  }

  if (payload.password !== undefined) {
    updateData.password = await bcrypt.hash(payload.password, env.BCRYPT_SALT_ROUNDS)
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  })

  return sanitizeUser(updatedUser)
}

export const UserService = {
  createUser,
  loginUser,
  getProfile,
  updateUser,
}
