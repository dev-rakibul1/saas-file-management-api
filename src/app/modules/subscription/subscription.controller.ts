import { Request, Response } from 'express'
import { AuthRequest } from '../../middlewares/auth'
import catchAsync from '../../utils/catchAsync'
import sendResponse from '../../utils/sendResponse'
import ApiError from '../../errors/ApiError'
import { SubscriptionService } from './subscription.service'

const getAvailablePackages = catchAsync(async (_req: Request, res: Response) => {
  const result = await SubscriptionService.getAvailablePackages()

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Available packages retrieved successfully.',
    data: result,
  })
})

const selectPackage = catchAsync(async (req: Request, res: Response) => {
  const authUser = (req as AuthRequest).user

  if (!authUser) {
    throw new ApiError(401, 'You are not authorized.')
  }

  const result = await SubscriptionService.selectPackage(authUser.userId, req.body)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Package selected successfully.',
    data: result,
  })
})

const getCurrentSubscription = catchAsync(async (req: Request, res: Response) => {
  const authUser = (req as AuthRequest).user

  if (!authUser) {
    throw new ApiError(401, 'You are not authorized.')
  }

  const result = await SubscriptionService.getCurrentSubscription(authUser.userId)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Current subscription retrieved successfully.',
    data: result,
  })
})

const getSubscriptionHistory = catchAsync(async (req: Request, res: Response) => {
  const authUser = (req as AuthRequest).user

  if (!authUser) {
    throw new ApiError(401, 'You are not authorized.')
  }

  const result = await SubscriptionService.getSubscriptionHistory(authUser.userId)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Subscription history retrieved successfully.',
    data: result,
  })
})

export const SubscriptionController = {
  getAvailablePackages,
  selectPackage,
  getCurrentSubscription,
  getSubscriptionHistory,
}
