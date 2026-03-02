import { Request, Response } from 'express'
import app from './app'
import { prisma } from './app/db/prisma'
import runBootstrap from './app/utils/bootstrap'
import env from './config/env'

let bootstrapPromise: Promise<void> | null = null
const BOOTSTRAP_RETRY_DELAYS_MS = [0, 1200, 2500]

const getConfiguredDatabaseHost = (): string => {
  const configuredDbUrl =
    process.env.DATABASE_POOLER_URL?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    env.DATABASE_URL

  try {
    return new URL(configuredDbUrl).host
  } catch {
    return 'invalid DATABASE_URL/DATABASE_POOLER_URL'
  }
}

const getPrismaErrorCode = (error: unknown): string | null => {
  if (typeof error === 'object' && error !== null && 'errorCode' in error) {
    const value = (error as { errorCode?: unknown }).errorCode
    return typeof value === 'string' ? value : null
  }

  return null
}

const delay = async (ms: number): Promise<void> => {
  await new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

const initializePrismaWithRetry = async (): Promise<void> => {
  let lastError: unknown = null

  for (let index = 0; index < BOOTSTRAP_RETRY_DELAYS_MS.length; index += 1) {
    const waitMs = BOOTSTRAP_RETRY_DELAYS_MS[index]

    if (waitMs > 0) {
      await delay(waitMs)
    }

    try {
      await prisma.$connect()
      await runBootstrap()
      return
    } catch (error) {
      lastError = error

      await prisma.$disconnect().catch(() => undefined)

      const errorCode = getPrismaErrorCode(error)
      const hasNextAttempt = index < BOOTSTRAP_RETRY_DELAYS_MS.length - 1

      if (errorCode !== 'P1001' || !hasNextAttempt) {
        throw error
      }

      console.warn(`Prisma bootstrap attempt ${index + 1} failed with P1001. Retrying...`)
    }
  }

  throw lastError
}

const ensureBootstrap = async (): Promise<void> => {
  if (!bootstrapPromise) {
    bootstrapPromise = initializePrismaWithRetry().catch((error) => {
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
    if (getPrismaErrorCode(error) === 'P1001') {
      console.error(
        `Prisma P1001 on Vercel. DB host: ${getConfiguredDatabaseHost()}. ` +
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
