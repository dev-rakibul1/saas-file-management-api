import { Request, Response } from 'express'
import { AuthRequest } from '../../middlewares/auth'
import ApiError from '../../errors/ApiError'
import catchAsync from '../../utils/catchAsync'
import sendResponse from '../../utils/sendResponse'
import { FolderService } from './folder.service'

const createFolder = catchAsync(async (req: Request, res: Response) => {
  const authUser = (req as AuthRequest).user

  if (!authUser) {
    throw new ApiError(401, 'You are not authorized.')
  }

  const result = await FolderService.createFolder(authUser.userId, req.body)

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Folder created successfully.',
    data: result,
  })
})

const getFolders = catchAsync(async (req: Request, res: Response) => {
  const authUser = (req as AuthRequest).user

  if (!authUser) {
    throw new ApiError(401, 'You are not authorized.')
  }

  const parentId = typeof req.query.parentId === 'string' ? req.query.parentId : undefined
  const result = await FolderService.getFolders(authUser.userId, parentId)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Folders retrieved successfully.',
    data: result,
  })
})

const getFolderTree = catchAsync(async (req: Request, res: Response) => {
  const authUser = (req as AuthRequest).user

  if (!authUser) {
    throw new ApiError(401, 'You are not authorized.')
  }

  const result = await FolderService.getFolderTree(authUser.userId)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Folder tree retrieved successfully.',
    data: result,
  })
})

const updateFolder = catchAsync(async (req: Request, res: Response) => {
  const authUser = (req as AuthRequest).user

  if (!authUser) {
    throw new ApiError(401, 'You are not authorized.')
  }

  const folderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  const result = await FolderService.updateFolder(authUser.userId, folderId, req.body)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Folder updated successfully.',
    data: result,
  })
})

const deleteFolder = catchAsync(async (req: Request, res: Response) => {
  const authUser = (req as AuthRequest).user

  if (!authUser) {
    throw new ApiError(401, 'You are not authorized.')
  }

  const folderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  const result = await FolderService.deleteFolder(authUser.userId, folderId)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Folder deleted successfully.',
    data: result,
  })
})

export const FolderController = {
  createFolder,
  getFolders,
  getFolderTree,
  updateFolder,
  deleteFolder,
}
