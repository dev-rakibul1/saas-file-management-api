import path from 'path'
import { prisma } from '../../db/prisma'
import ApiError from '../../errors/ApiError'
import { CloudinaryStorage } from '../../utils/cloudinary'
import {
  EnforcementService,
  SupportedFileTypeCategory,
} from '../enforcement/enforcement.service'

type UploadFilePayload = {
  folderId: string
  originalName: string
  mimeType: string
  contentBase64: string
}

type UpdateFilePayload = {
  originalName: string
}

const FILE_EXTENSION_BY_CATEGORY: Record<
  SupportedFileTypeCategory,
  ReadonlySet<string>
> = {
  IMAGE: new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg']),
  VIDEO: new Set(['mp4', 'mov', 'mkv', 'avi', 'wmv', 'webm', 'm4v']),
  AUDIO: new Set(['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac']),
  PDF: new Set(['pdf']),
}

const sanitizeBase64 = (contentBase64: string): string => {
  const trimmed = contentBase64.trim()

  if (!trimmed) {
    throw new ApiError(400, 'Invalid base64 payload.')
  }

  if (trimmed.includes(',')) {
    const segments = trimmed.split(',')

    return segments[segments.length - 1]
  }

  return trimmed
}

const getFileExtension = (fileName: string): string => {
  const ext = path.extname(fileName)

  if (!ext) {
    return 'bin'
  }

  return ext.replace('.', '').toLowerCase() || 'bin'
}

const validateMimeAndExtension = (mimeType: string, extension: string): void => {
  const fileCategory = EnforcementService.resolveFileTypeCategory(mimeType)

  if (!fileCategory) {
    throw new ApiError(
      400,
      'Unsupported file type. Allowed categories: Image, Video, Audio, PDF.'
    )
  }

  const allowedExtensions = FILE_EXTENSION_BY_CATEGORY[fileCategory]

  if (!allowedExtensions.has(extension)) {
    throw new ApiError(
      400,
      `File extension .${extension} does not match MIME type ${mimeType}.`
    )
  }
}

const uploadFile = async (userId: string, payload: UploadFilePayload) => {
  const normalizedBase64 = sanitizeBase64(payload.contentBase64)
  const fileBuffer = Buffer.from(normalizedBase64, 'base64')

  if (!fileBuffer.length) {
    throw new ApiError(400, 'Uploaded file content is empty.')
  }

  const extension = getFileExtension(payload.originalName)
  validateMimeAndExtension(payload.mimeType, extension)

  await EnforcementService.validateFileUpload(userId, {
    folderId: payload.folderId,
    mimeType: payload.mimeType,
    sizeBytes: fileBuffer.byteLength,
  })

  let uploadedPublicId: string | null = null

  try {
    const uploadResult = await CloudinaryStorage.uploadToCloudinary({
      userId,
      mimeType: payload.mimeType,
      contentBase64: normalizedBase64,
    })

    uploadedPublicId = uploadResult.publicId

    return await prisma.file.create({
      data: {
        userId,
        folderId: payload.folderId,
        originalName: payload.originalName.trim(),
        storedName: uploadResult.publicId,
        mimeType: payload.mimeType,
        extension,
        sizeBytes: fileBuffer.byteLength,
        storagePath: uploadResult.secureUrl,
      },
    })
  } catch (error) {
    if (uploadedPublicId) {
      try {
        await CloudinaryStorage.deleteCloudinaryAsset(uploadedPublicId)
      } catch {
        // Ignore cleanup errors and return the original upload failure.
      }
    }

    if (error instanceof ApiError) {
      throw error
    }

    throw new ApiError(502, 'Failed to upload file to cloud storage.')
  }
}

const getFiles = async (userId: string, folderId?: string) => {
  return prisma.file.findMany({
    where: {
      userId,
      folderId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

const getDownloadFile = async (userId: string, fileId: string) => {
  const file = await prisma.file.findFirst({
    where: {
      id: fileId,
      userId,
    },
  })

  if (!file) {
    throw new ApiError(404, 'File not found.')
  }

  return file
}

const updateFile = async (userId: string, fileId: string, payload: UpdateFilePayload) => {
  const file = await getDownloadFile(userId, fileId)

  return prisma.file.update({
    where: {
      id: file.id,
    },
    data: {
      originalName: payload.originalName.trim(),
    },
  })
}

const deleteFile = async (userId: string, fileId: string) => {
  const file = await getDownloadFile(userId, fileId)

  await prisma.file.delete({
    where: {
      id: file.id,
    },
  })

  if (CloudinaryStorage.isCloudinaryUrl(file.storagePath)) {
    try {
      await CloudinaryStorage.deleteCloudinaryAsset(file.storedName)
    } catch {
      // Keep DB delete successful even when cloud cleanup fails.
    }
  }

  return {
    deletedFileId: file.id,
  }
}

export const FileService = {
  uploadFile,
  getFiles,
  getDownloadFile,
  updateFile,
  deleteFile,
}
