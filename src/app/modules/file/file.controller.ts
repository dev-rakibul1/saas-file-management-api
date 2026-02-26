import { NextFunction, Request, Response } from 'express'
import { AuthRequest } from '../../middlewares/auth'
import ApiError from '../../errors/ApiError'
import catchAsync from '../../utils/catchAsync'
import sendResponse from '../../utils/sendResponse'
import { CloudinaryStorage } from '../../utils/cloudinary'
import { FileService } from './file.service'

const uploadFile = catchAsync(async (req: Request, res: Response) => {
  const authUser = (req as AuthRequest).user

  if (!authUser) {
    throw new ApiError(401, 'You are not authorized.')
  }

  const result = await FileService.uploadFile(authUser.userId, req.body)

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'File uploaded successfully.',
    data: result,
  })
})

const getFiles = catchAsync(async (req: Request, res: Response) => {
  const authUser = (req as AuthRequest).user

  if (!authUser) {
    throw new ApiError(401, 'You are not authorized.')
  }

  const folderId = typeof req.query.folderId === 'string' ? req.query.folderId : undefined
  const result = await FileService.getFiles(authUser.userId, folderId)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Files retrieved successfully.',
    data: result,
  })
})

const downloadFile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authUser = (req as AuthRequest).user

    if (!authUser) {
      throw new ApiError(401, 'You are not authorized.')
    }

    const fileId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    const file = await FileService.getDownloadFile(authUser.userId, fileId)

    if (CloudinaryStorage.isCloudinaryUrl(file.storagePath)) {
      return res.redirect(file.storagePath)
    }

    res.download(file.storagePath, file.originalName, (error) => {
      if (error) {
        next(error)
      }
    })
  }
)

const updateFile = catchAsync(async (req: Request, res: Response) => {
  const authUser = (req as AuthRequest).user

  if (!authUser) {
    throw new ApiError(401, 'You are not authorized.')
  }

  const fileId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  const result = await FileService.updateFile(authUser.userId, fileId, req.body)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'File updated successfully.',
    data: result,
  })
})

const deleteFile = catchAsync(async (req: Request, res: Response) => {
  const authUser = (req as AuthRequest).user

  if (!authUser) {
    throw new ApiError(401, 'You are not authorized.')
  }

  const fileId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  const result = await FileService.deleteFile(authUser.userId, fileId)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'File deleted successfully.',
    data: result,
  })
})

export const FileController = {
  uploadFile,
  getFiles,
  downloadFile,
  updateFile,
  deleteFile,
}
