import { Request, Response } from 'express'
import catchAsync from '../../utils/catchAsync'
import sendResponse from '../../utils/sendResponse'
import ApiError from '../../errors/ApiError'
import { AuthRequest } from '../../middlewares/auth'
import { UserService } from './user.service'

const createUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.createUser(req.body)

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'User created successfully.',
    data: result,
  })
})

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.loginUser(req.body)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User logged in successfully.',
    data: result,
  })
})

const getProfile = catchAsync(async (req: Request, res: Response) => {
  const authUser = (req as AuthRequest).user

  if (!authUser) {
    throw new ApiError(401, 'You are not authorized.')
  }

  const result = await UserService.getProfile(authUser.userId)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User profile retrieved successfully.',
    data: result,
  })
})

const updateUser = catchAsync(async (req: Request, res: Response) => {
  const authUser = (req as AuthRequest).user

  if (!authUser) {
    throw new ApiError(401, 'You are not authorized.')
  }

  const result = await UserService.updateUser(authUser.userId, req.body)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User updated successfully.',
    data: result,
  })
})

export const UserController = {
  createUser,
  loginUser,
  getProfile,
  updateUser,
}
