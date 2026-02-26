import bcrypt from 'bcrypt'
import { UserRole } from '@prisma/client'
import env from '../../config/env'
import { prisma } from '../db/prisma'

const DEFAULT_PACKAGES = [
  {
    name: 'Free',
    maxFolders: 5,
    maxNestingLevel: 3,
    allowedFileTypes: ['IMAGE', 'PDF'],
    maxFileSizeBytes: 5 * 1024 * 1024,
    totalFileLimit: 20,
    filesPerFolder: 10,
  },
  {
    name: 'Silver',
    maxFolders: 25,
    maxNestingLevel: 5,
    allowedFileTypes: ['IMAGE', 'AUDIO', 'PDF'],
    maxFileSizeBytes: 20 * 1024 * 1024,
    totalFileLimit: 200,
    filesPerFolder: 40,
  },
  {
    name: 'Gold',
    maxFolders: 75,
    maxNestingLevel: 8,
    allowedFileTypes: ['IMAGE', 'VIDEO', 'AUDIO', 'PDF'],
    maxFileSizeBytes: 100 * 1024 * 1024,
    totalFileLimit: 1000,
    filesPerFolder: 120,
  },
  {
    name: 'Diamond',
    maxFolders: 200,
    maxNestingLevel: 12,
    allowedFileTypes: ['IMAGE', 'VIDEO', 'AUDIO', 'PDF'],
    maxFileSizeBytes: 500 * 1024 * 1024,
    totalFileLimit: 5000,
    filesPerFolder: 500,
  },
]

const ensureDefaultPackages = async (): Promise<void> => {
  await Promise.all(
    DEFAULT_PACKAGES.map(async (item) => {
      const existing = await prisma.package.findUnique({
        where: {
          name: item.name,
        },
      })

      if (existing) {
        return
      }

      await prisma.package.create({
        data: item,
      })
    })
  )
}

const ensureDefaultAdmin = async (): Promise<void> => {
  const existingAdmin = await prisma.user.findUnique({
    where: {
      email: env.DEFAULT_ADMIN_EMAIL,
    },
  })

  const hashedPassword = await bcrypt.hash(
    env.DEFAULT_ADMIN_PASSWORD,
    env.BCRYPT_SALT_ROUNDS
  )

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        name: env.DEFAULT_ADMIN_NAME,
        email: env.DEFAULT_ADMIN_EMAIL,
        password: hashedPassword,
        role: UserRole.ADMIN,
      },
    })

    return
  }

  if (existingAdmin.role !== UserRole.ADMIN) {
    await prisma.user.update({
      where: {
        id: existingAdmin.id,
      },
      data: {
        role: UserRole.ADMIN,
      },
    })
  }
}

const runBootstrap = async (): Promise<void> => {
  await ensureDefaultPackages()
  await ensureDefaultAdmin()
}

export default runBootstrap
