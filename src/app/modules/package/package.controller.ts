import { Request, Response } from 'express'
import catchAsync from '../../utils/catchAsync'
import sendResponse from '../../utils/sendResponse'
import { PackageService } from './package.service'

const createPackage = catchAsync(async (req: Request, res: Response) => {
  const result = await PackageService.createPackage(req.body)

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Package created successfully.',
    data: result,
  })
})

const getPackages = catchAsync(async (req: Request, res: Response) => {
  const includeInactive = req.query.includeInactive === 'true'
  const result = await PackageService.getPackages(includeInactive)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Packages retrieved successfully.',
    data: result,
  })
})

const getPackageById = catchAsync(async (req: Request, res: Response) => {
  const packageId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  const result = await PackageService.getPackageById(packageId)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Package retrieved successfully.',
    data: result,
  })
})

const updatePackage = catchAsync(async (req: Request, res: Response) => {
  const packageId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  const result = await PackageService.updatePackage(packageId, req.body)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Package updated successfully.',
    data: result,
  })
})

const deletePackage = catchAsync(async (req: Request, res: Response) => {
  const packageId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  const result = await PackageService.deletePackage(packageId)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Package deleted successfully.',
    data: result,
  })
})

export const PackageController = {
  createPackage,
  getPackages,
  getPackageById,
  updatePackage,
  deletePackage,
}
