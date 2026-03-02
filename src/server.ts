import { Server } from 'http'
import { Prisma } from '@prisma/client'
import app from './app'
import { prisma } from './app/db/prisma'
import runBootstrap from './app/utils/bootstrap'
import env from './config/env'

let server: Server

const startServer = async (): Promise<void> => {
  try {
    await prisma.$connect()
    await runBootstrap()

    server = app.listen(env.PORT, () => {
      console.log(`Server is running on: http://localhost:${env.PORT}`)
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientInitializationError) {
      if (error.errorCode === 'P1001') {
        console.error(
          'Database connection failed (P1001). Verify DATABASE_URL and test it with: psql "$DATABASE_URL" -c "select 1"'
        )
      } else {
        console.error(
          `Database initialization failed (${error.errorCode ?? 'unknown Prisma error'}).`
        )
      }
    }

    console.error('Failed to start server:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

const gracefulShutdown = async (signal: string): Promise<void> => {
  console.log(`${signal} received. Shutting down gracefully...`)

  if (server) {
    server.close(async () => {
      await prisma.$disconnect()
      process.exit(0)
    })
    return
  }

  await prisma.$disconnect()
  process.exit(0)
}

void startServer()

process.on('SIGINT', () => {
  void gracefulShutdown('SIGINT')
})

process.on('SIGTERM', () => {
  void gracefulShutdown('SIGTERM')
})

process.on('unhandledRejection', async (error) => {
  console.error('Unhandled rejection detected:', error)
  await gracefulShutdown('unhandledRejection')
})
