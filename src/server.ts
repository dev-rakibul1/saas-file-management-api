import { Server } from 'http'
import app from './app'
import { prisma } from './app/db/prisma'
import env from './config/env'

let server: Server

const startServer = async (): Promise<void> => {
  try {
    await prisma.$connect()

    server = app.listen(env.PORT, () => {
      console.log(`Server is running on: http://localhost:${env.PORT}`)
    })
  } catch (error) {
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
