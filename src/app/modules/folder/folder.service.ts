import { Folder } from '@prisma/client'
import { prisma } from '../../db/prisma'
import ApiError from '../../errors/ApiError'
import { CloudinaryStorage } from '../../utils/cloudinary'
import { EnforcementService } from '../enforcement/enforcement.service'

type CreateFolderPayload = {
  name: string
  parentId?: string
}

type UpdateFolderPayload = {
  name: string
}

type FolderTreeNode = Folder & {
  children: FolderTreeNode[]
}

const buildFolderTree = (folders: Folder[]): FolderTreeNode[] => {
  const nodeMap = new Map<string, FolderTreeNode>()
  const roots: FolderTreeNode[] = []

  folders.forEach((folder) => {
    nodeMap.set(folder.id, {
      ...folder,
      children: [],
    })
  })

  nodeMap.forEach((node) => {
    if (!node.parentId) {
      roots.push(node)
      return
    }

    const parentNode = nodeMap.get(node.parentId)

    if (parentNode) {
      parentNode.children.push(node)
      return
    }

    roots.push(node)
  })

  return roots
}

const collectDescendantFolderIds = (folderId: string, folders: Folder[]): string[] => {
  const childMap = new Map<string, string[]>()

  folders.forEach((folder) => {
    if (!folder.parentId) {
      return
    }

    const children = childMap.get(folder.parentId) ?? []
    children.push(folder.id)
    childMap.set(folder.parentId, children)
  })

  const stack: string[] = [folderId]
  const result: string[] = []

  while (stack.length) {
    const currentId = stack.pop()

    if (!currentId) {
      continue
    }

    result.push(currentId)

    const childIds = childMap.get(currentId) ?? []

    childIds.forEach((childId) => {
      stack.push(childId)
    })
  }

  return result
}

const createFolder = async (userId: string, payload: CreateFolderPayload) => {
  const validatedData = await EnforcementService.validateFolderCreate(
    userId,
    payload.parentId
  )

  return prisma.folder.create({
    data: {
      userId,
      name: payload.name.trim(),
      parentId: payload.parentId ?? null,
      depth: validatedData.depth,
    },
  })
}

const getFolders = async (userId: string, parentId?: string) => {
  return prisma.folder.findMany({
    where: {
      userId,
      parentId: parentId ?? null,
    },
    orderBy: [{ depth: 'asc' }, { name: 'asc' }],
  })
}

const getFolderTree = async (userId: string) => {
  const folders = await prisma.folder.findMany({
    where: {
      userId,
    },
    orderBy: [{ depth: 'asc' }, { createdAt: 'asc' }],
  })

  return buildFolderTree(folders)
}

const updateFolder = async (
  userId: string,
  folderId: string,
  payload: UpdateFolderPayload
) => {
  const folder = await prisma.folder.findFirst({
    where: {
      id: folderId,
      userId,
    },
  })

  if (!folder) {
    throw new ApiError(404, 'Folder not found.')
  }

  return prisma.folder.update({
    where: {
      id: folderId,
    },
    data: {
      name: payload.name.trim(),
    },
  })
}

const deleteFolder = async (userId: string, folderId: string) => {
  const folder = await prisma.folder.findFirst({
    where: {
      id: folderId,
      userId,
    },
  })

  if (!folder) {
    throw new ApiError(404, 'Folder not found.')
  }

  const allFolders = await prisma.folder.findMany({
    where: {
      userId,
    },
  })

  const folderIdsToDelete = collectDescendantFolderIds(folderId, allFolders)

  const filesForCleanup = await prisma.file.findMany({
    where: {
      userId,
      folderId: {
        in: folderIdsToDelete,
      },
    },
    select: {
      storedName: true,
      storagePath: true,
    },
  })

  await prisma.folder.delete({
    where: {
      id: folderId,
    },
  })

  const cloudinaryPublicIds = filesForCleanup
    .filter((file) => CloudinaryStorage.isCloudinaryUrl(file.storagePath))
    .map((file) => file.storedName)

  try {
    await CloudinaryStorage.deleteCloudinaryAssets(cloudinaryPublicIds)
  } catch {
    // Keep folder delete successful even when cloud cleanup partially fails.
  }

  return {
    deletedFolderId: folderId,
    deletedFolderCount: folderIdsToDelete.length,
    deletedFileCount: filesForCleanup.length,
  }
}

export const FolderService = {
  createFolder,
  getFolders,
  getFolderTree,
  updateFolder,
  deleteFolder,
}
