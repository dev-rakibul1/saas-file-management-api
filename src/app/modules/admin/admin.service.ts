import { Prisma, UserRole } from '@prisma/client'
import { prisma } from '../../db/prisma'
import ApiError from '../../errors/ApiError'

type ListUsersPayload = {
  page?: string
  limit?: string
  packageId?: string
}

const toPositiveNumber = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback
  }

  const parsedNumber = Number(value)

  if (!Number.isInteger(parsedNumber) || parsedNumber <= 0) {
    return fallback
  }

  return parsedNumber
}

const listUsers = async (payload: ListUsersPayload) => {
  const page = toPositiveNumber(payload.page, 1)
  const limit = toPositiveNumber(payload.limit, 10)
  const skip = (page - 1) * limit

  const where: Prisma.UserWhereInput = {
    role: UserRole.USER,
    ...(payload.packageId
      ? {
          subscriptions: {
            some: {
              packageId: payload.packageId,
              isActive: true,
              status: 'ACTIVE',
            },
          },
        }
      : {}),
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        subscriptions: {
          where: {
            isActive: true,
            status: 'ACTIVE',
          },
          include: {
            package: true,
          },
          take: 1,
          orderBy: {
            startDate: 'desc',
          },
        },
      },
    }),
  ])

  const userIds = users.map((user) => user.id)

  const [folderCounts, fileCounts] = await Promise.all([
    prisma.folder.groupBy({
      by: ['userId'],
      where: {
        userId: {
          in: userIds,
        },
      },
      _count: {
        _all: true,
      },
    }),
    prisma.file.groupBy({
      by: ['userId'],
      where: {
        userId: {
          in: userIds,
        },
      },
      _count: {
        _all: true,
      },
    }),
  ])

  const folderCountMap = new Map(
    folderCounts.map((item) => [item.userId, item._count._all])
  )
  const fileCountMap = new Map(fileCounts.map((item) => [item.userId, item._count._all]))

  const data = users.map((user) => {
    const activeSubscription = user.subscriptions[0] ?? null

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      activeSubscription,
      usage: {
        folderCount: folderCountMap.get(user.id) ?? 0,
        fileCount: fileCountMap.get(user.id) ?? 0,
      },
    }
  })

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
    data,
  }
}

const getUserUsage = async (targetUserId: string) => {
  const user = await prisma.user.findFirst({
    where: {
      id: targetUserId,
      role: 'USER',
    },
  })

  if (!user) {
    throw new ApiError(404, 'User not found.')
  }

  const [activeSubscription, folderCount, fileCount, totalStorageBytes] =
    await Promise.all([
      prisma.userSubscription.findFirst({
        where: {
          userId: targetUserId,
          isActive: true,
          status: 'ACTIVE',
        },
        include: {
          package: true,
        },
        orderBy: {
          startDate: 'desc',
        },
      }),
      prisma.folder.count({
        where: {
          userId: targetUserId,
        },
      }),
      prisma.file.count({
        where: {
          userId: targetUserId,
        },
      }),
      prisma.file.aggregate({
        where: {
          userId: targetUserId,
        },
        _sum: {
          sizeBytes: true,
        },
      }),
    ])

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
    activeSubscription,
    usage: {
      folderCount,
      fileCount,
      totalStorageBytes: totalStorageBytes._sum.sizeBytes ?? 0,
    },
  }
}

const getOverview = async () => {
  const [
    totalUsers,
    totalAdmins,
    totalFolders,
    totalFiles,
    totalPackages,
    activeSubscriptions,
    packageAggregates,
  ] = await Promise.all([
    prisma.user.count({
      where: {
        role: 'USER',
      },
    }),
    prisma.user.count({
      where: {
        role: 'ADMIN',
      },
    }),
    prisma.folder.count(),
    prisma.file.count(),
    prisma.package.count({
      where: {
        isActive: true,
      },
    }),
    prisma.userSubscription.count({
      where: {
        isActive: true,
        status: 'ACTIVE',
      },
    }),
    prisma.userSubscription.groupBy({
      by: ['packageId'],
      where: {
        isActive: true,
        status: 'ACTIVE',
      },
      _count: {
        _all: true,
      },
    }),
  ])

  const packageIds = packageAggregates.map((item) => item.packageId)

  const packages = await prisma.package.findMany({
    where: {
      id: {
        in: packageIds,
      },
    },
  })

  const packageNameMap = new Map(packages.map((item) => [item.id, item.name]))

  return {
    totalUsers,
    totalAdmins,
    totalFolders,
    totalFiles,
    totalPackages,
    activeSubscriptions,
    packageDistribution: packageAggregates.map((item) => ({
      packageId: item.packageId,
      packageName: packageNameMap.get(item.packageId) ?? 'Unknown',
      activeSubscribers: item._count._all,
    })),
  }
}

export const AdminService = {
  listUsers,
  getUserUsage,
  getOverview,
}
