import { prisma } from '../../db/prisma'
import ApiError from '../../errors/ApiError'

type SelectPackagePayload = {
  packageId: string
}

const getAvailablePackages = async () => {
  return prisma.package.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })
}

const getCurrentSubscription = async (userId: string) => {
  const currentSubscription = await prisma.userSubscription.findFirst({
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

  if (!currentSubscription) {
    throw new ApiError(404, 'No active subscription found for this user.')
  }

  return currentSubscription
}

const selectPackage = async (userId: string, payload: SelectPackagePayload) => {
  const selectedPackage = await prisma.package.findFirst({
    where: {
      id: payload.packageId,
      isActive: true,
    },
  })

  if (!selectedPackage) {
    throw new ApiError(404, 'Selected package not found or inactive.')
  }

  const activeSubscription = await prisma.userSubscription.findFirst({
    where: {
      userId,
      isActive: true,
      status: 'ACTIVE',
    },
  })

  if (activeSubscription && activeSubscription.packageId === payload.packageId) {
    return getCurrentSubscription(userId)
  }

  const now = new Date()

  await prisma.$transaction(async (tx) => {
    await tx.userSubscription.updateMany({
      where: {
        userId,
        isActive: true,
      },
      data: {
        isActive: false,
        status: 'SWITCHED',
        endDate: now,
      },
    })

    await tx.userSubscription.create({
      data: {
        userId,
        packageId: payload.packageId,
        status: 'ACTIVE',
        isActive: true,
        startDate: now,
      },
    })
  })

  return getCurrentSubscription(userId)
}

const getSubscriptionHistory = async (userId: string) => {
  return prisma.userSubscription.findMany({
    where: {
      userId,
    },
    include: {
      package: true,
    },
    orderBy: {
      startDate: 'desc',
    },
  })
}

export const SubscriptionService = {
  getAvailablePackages,
  getCurrentSubscription,
  selectPackage,
  getSubscriptionHistory,
}
