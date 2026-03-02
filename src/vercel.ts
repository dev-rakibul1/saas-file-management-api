import { Request, Response } from 'express'
import app from './app'
import { prisma } from './app/db/prisma'
import runBootstrap from './app/utils/bootstrap'
import env from './config/env'

let bootstrapPromise: Promise<void> | null = null

const getDatabaseHost = (): string => {
  try {
    return new URL(env.DATABASE_URL).host
  } catch {
    return 'invalid DATABASE_URL'
  }
}

const ensureBootstrap = async (): Promise<void> => {
  if (!bootstrapPromise) {
    bootstrapPromise = prisma
      .$connect()
      .then(async () => {
        await runBootstrap()
      })
      .catch((error) => {
        bootstrapPromise = null
        throw error
      })
  }

  await bootstrapPromise
}

const vercelHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureBootstrap()
    app(req, res)
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'errorCode' in error &&
      error.errorCode === 'P1001'
    ) {
      console.error(
        `Prisma P1001 on Vercel. DATABASE_URL host: ${getDatabaseHost()}. ` +
          'Use a valid Neon pooled connection string in Vercel Project Settings -> Environment Variables.'
      )
    }

    console.error('Failed to initialize Vercel handler:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to initialize server.',
      errorMessages: [{ path: '', message: 'Vercel runtime bootstrap failed.' }],
    })
  }
}

export default vercelHandler
