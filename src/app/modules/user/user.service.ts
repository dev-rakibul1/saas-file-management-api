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

type SwitchRolePayload = {
  role: UserRole
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
  const createdUser = await prisma.$transaction(async (tx) => {
    const existingUser = await tx.user.findUnique({
      where: { email: payload.email },
    })

    if (existingUser) {
      throw new ApiError(409, 'Email already exists.')
    }

    const hashedPassword = await bcrypt.hash(payload.password, env.BCRYPT_SALT_ROUNDS)

    const newUser = await tx.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        password: hashedPassword,
        role: UserRole.USER,
      },
    })

    const defaultPackage = await tx.package.findFirst({
      where: {
        name: 'Free',
        isActive: true,
      },
    })

    if (!defaultPackage) {
      throw new ApiError(500, 'Default Free package is not configured by Admin.')
    }

    await tx.userSubscription.create({
      data: {
        userId: newUser.id,
        packageId: defaultPackage.id,
        status: 'ACTIVE',
        isActive: true,
      },
    })

    return newUser
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

const switchRoleForTesting = async (
  userId: string,
  payload: SwitchRolePayload
): Promise<SafeUser> => {
  if (!env.ENABLE_TEST_ROLE_SWITCH) {
    throw new ApiError(
      403,
      'Test-only role switch endpoint is disabled in this environment.'
    )
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!existingUser) {
    throw new ApiError(404, 'User not found.')
  }

  if (existingUser.role === payload.role) {
    return sanitizeUser(existingUser)
  }

  if (existingUser.role === UserRole.ADMIN && payload.role === UserRole.USER) {
    const remainingAdminCount = await prisma.user.count({
      where: {
        role: UserRole.ADMIN,
        id: {
          not: userId,
        },
      },
    })

    if (remainingAdminCount < 1) {
      throw new ApiError(400, 'At least one ADMIN user must remain in the system.')
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      role: payload.role,
    },
  })

  return sanitizeUser(updatedUser)
}

export const UserService = {
  createUser,
  loginUser,
  getProfile,
  updateUser,
  switchRoleForTesting,
}
