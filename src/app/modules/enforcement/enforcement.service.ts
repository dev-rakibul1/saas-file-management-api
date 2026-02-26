import { Package } from '@prisma/client'
import { prisma } from '../../db/prisma'
import ApiError from '../../errors/ApiError'

export const SUPPORTED_FILE_TYPE_CATEGORIES = ['IMAGE', 'VIDEO', 'AUDIO', 'PDF'] as const

export type SupportedFileTypeCategory = (typeof SUPPORTED_FILE_TYPE_CATEGORIES)[number]

type ValidateFileUploadPayload = {
  folderId: string
  mimeType: string
  sizeBytes: number
}

const resolveFileTypeCategory = (mimeType: string): SupportedFileTypeCategory | null => {
  const normalizedType = mimeType.toLowerCase()

  if (normalizedType.startsWith('image/')) {
    return 'IMAGE'
  }

  if (normalizedType.startsWith('video/')) {
    return 'VIDEO'
  }

  if (normalizedType.startsWith('audio/')) {
    return 'AUDIO'
  }

  if (normalizedType === 'application/pdf') {
    return 'PDF'
  }

  return null
}

const getActivePackageForUser = async (userId: string): Promise<Package> => {
  const activeSubscription = await prisma.userSubscription.findFirst({
    where: {
      userId,
      isActive: true,
      status: 'ACTIVE',
    },
    include: {
      package: true,
    },
    orderBy: {
      startDate: 'desc',
    },
  })

  if (!activeSubscription) {
    throw new ApiError(400, 'No active package found. Please select a package first.')
  }

  return activeSubscription.package
}

const validateFolderCreate = async (userId: string, parentId?: string) => {
  const activePackage = await getActivePackageForUser(userId)

  const totalFolderCount = await prisma.folder.count({
    where: {
      userId,
    },
  })

  if (totalFolderCount >= activePackage.maxFolders) {
    throw new ApiError(
      400,
      `Folder limit reached (${totalFolderCount}/${activePackage.maxFolders}).`
    )
  }

  let depth = 1

  if (parentId) {
    const parentFolder = await prisma.folder.findFirst({
      where: {
        id: parentId,
        userId,
      },
    })

    if (!parentFolder) {
      throw new ApiError(404, 'Parent folder not found.')
    }

    depth = parentFolder.depth + 1
  }

  if (depth > activePackage.maxNestingLevel) {
    throw new ApiError(
      400,
      `Nesting limit exceeded (${depth}/${activePackage.maxNestingLevel}).`
    )
  }

  return {
    activePackage,
    depth,
  }
}

const validateFileUpload = async (userId: string, payload: ValidateFileUploadPayload) => {
  const activePackage = await getActivePackageForUser(userId)

  const folder = await prisma.folder.findFirst({
    where: {
      id: payload.folderId,
      userId,
    },
  })

  if (!folder) {
    throw new ApiError(404, 'Target folder not found.')
  }

  const fileCategory = resolveFileTypeCategory(payload.mimeType)

  if (!fileCategory) {
    throw new ApiError(
      400,
      'Unsupported file type. Allowed categories: Image, Video, Audio, PDF.'
    )
  }

  const allowedTypeSet = new Set(
    activePackage.allowedFileTypes.map((item) => item.toUpperCase())
  )

  if (!allowedTypeSet.has(fileCategory)) {
    throw new ApiError(
      400,
      `File type ${fileCategory} is not allowed in your ${activePackage.name} package.`
    )
  }

  if (payload.sizeBytes > activePackage.maxFileSizeBytes) {
    throw new ApiError(
      400,
      `File size exceeds limit (${payload.sizeBytes}/${activePackage.maxFileSizeBytes} bytes).`
    )
  }

  const totalFileCount = await prisma.file.count({
    where: {
      userId,
    },
  })

  if (totalFileCount >= activePackage.totalFileLimit) {
    throw new ApiError(
      400,
      `Total file limit reached (${totalFileCount}/${activePackage.totalFileLimit}).`
    )
  }

  const folderFileCount = await prisma.file.count({
    where: {
      userId,
      folderId: payload.folderId,
    },
  })

  if (folderFileCount >= activePackage.filesPerFolder) {
    throw new ApiError(
      400,
      `Per-folder file limit reached (${folderFileCount}/${activePackage.filesPerFolder}).`
    )
  }

  return {
    activePackage,
    folder,
    fileCategory,
  }
}

export const EnforcementService = {
  SUPPORTED_FILE_TYPE_CATEGORIES,
  getActivePackageForUser,
  validateFolderCreate,
  validateFileUpload,
  resolveFileTypeCategory,
}
