import { Request, Response } from 'express'
import app from './app'
import { prisma } from './app/db/prisma'
import runBootstrap from './app/utils/bootstrap'

let bootstrapPromise: Promise<void> | null = null

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
    console.error('Failed to initialize Vercel handler:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to initialize server.',
      errorMessages: [{ path: '', message: 'Vercel runtime bootstrap failed.' }],
    })
  }
}

export default vercelHandler
