import { Request, Response } from 'express'
import catchAsync from '../../utils/catchAsync'
import sendResponse from '../../utils/sendResponse'
import { AdminService } from './admin.service'

const listUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.listUsers({
    page: typeof req.query.page === 'string' ? req.query.page : undefined,
    limit: typeof req.query.limit === 'string' ? req.query.limit : undefined,
    packageId: typeof req.query.packageId === 'string' ? req.query.packageId : undefined,
  })

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Users retrieved successfully.',
    data: result.data,
    meta: result.meta,
  })
})

const getUserUsage = catchAsync(async (req: Request, res: Response) => {
  const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  const result = await AdminService.getUserUsage(userId)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User usage retrieved successfully.',
    data: result,
  })
})

const getOverview = catchAsync(async (_req: Request, res: Response) => {
  const result = await AdminService.getOverview()

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Admin overview retrieved successfully.',
    data: result,
  })
})

export const AdminController = {
  listUsers,
  getUserUsage,
  getOverview,
}
