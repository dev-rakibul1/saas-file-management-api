import { Prisma } from '@prisma/client'
import { prisma } from '../../db/prisma'
import ApiError from '../../errors/ApiError'

type CreatePackagePayload = {
  name: string
  maxFolders: number
  maxNestingLevel: number
  allowedFileTypes: string[]
  maxFileSizeBytes: number
  totalFileLimit: number
  filesPerFolder: number
}

type UpdatePackagePayload = Partial<CreatePackagePayload> & {
  isActive?: boolean
}

const normalizeAllowedTypes = (types: string[]): string[] => {
  return [...new Set(types.map((item) => item.toUpperCase()))]
}

const createPackage = async (payload: CreatePackagePayload) => {
  const existsByName = await prisma.package.findUnique({
    where: {
      name: payload.name,
    },
  })

  if (existsByName) {
    throw new ApiError(409, 'Package name already exists.')
  }

  return prisma.package.create({
    data: {
      ...payload,
      allowedFileTypes: normalizeAllowedTypes(payload.allowedFileTypes),
    },
  })
}

const getPackages = async (includeInactive = false) => {
  return prisma.package.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: {
      createdAt: 'asc',
    },
  })
}

const getPackageById = async (packageId: string) => {
  const packageData = await prisma.package.findUnique({
    where: {
      id: packageId,
    },
  })

  if (!packageData) {
    throw new ApiError(404, 'Package not found.')
  }

  return packageData
}

const updatePackage = async (packageId: string, payload: UpdatePackagePayload) => {
  await getPackageById(packageId)

  if (payload.name) {
    const packageByName = await prisma.package.findUnique({
      where: {
        name: payload.name,
      },
    })

    if (packageByName && packageByName.id !== packageId) {
      throw new ApiError(409, 'Package name already exists.')
    }
  }

  if (payload.isActive === false) {
    const activeSubscriptionCount = await prisma.userSubscription.count({
      where: {
        packageId,
        isActive: true,
        status: 'ACTIVE',
      },
    })

    if (activeSubscriptionCount > 0) {
      throw new ApiError(
        400,
        'Cannot deactivate package while users have active subscriptions on it.'
      )
    }
  }

  const updateData: Prisma.PackageUpdateInput = {
    ...payload,
  }

  if (payload.allowedFileTypes) {
    updateData.allowedFileTypes = normalizeAllowedTypes(payload.allowedFileTypes)
  }

  return prisma.package.update({
    where: {
      id: packageId,
    },
    data: updateData,
  })
}

const deletePackage = async (packageId: string) => {
  await getPackageById(packageId)

  const activeSubscriptionCount = await prisma.userSubscription.count({
    where: {
      packageId,
      isActive: true,
      status: 'ACTIVE',
    },
  })

  if (activeSubscriptionCount > 0) {
    throw new ApiError(400, 'Cannot delete package with active subscribers.')
  }

  return prisma.package.update({
    where: {
      id: packageId,
    },
    data: {
      isActive: false,
    },
  })
}

export const PackageService = {
  createPackage,
  getPackages,
  getPackageById,
  updatePackage,
  deletePackage,
}
