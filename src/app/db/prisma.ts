import { PrismaClient } from '@prisma/client'
import env from '../../config/env'

const resolveRuntimeDatabaseUrl = (): string => {
  const preferredPoolerUrl = process.env.DATABASE_POOLER_URL?.trim()

  if (preferredPoolerUrl) {
    return preferredPoolerUrl
  }

  const configuredUrl = env.DATABASE_URL.trim()

  if (!configuredUrl) {
    return configuredUrl
  }

  try {
    const parsedUrl = new URL(configuredUrl)
    const isNeon = parsedUrl.hostname.includes('.aws.neon.tech')
    const isVercelRuntime = Boolean(process.env.VERCEL)

    if (isNeon) {
      const [firstLabel, ...rest] = parsedUrl.hostname.split('.')

      if (isVercelRuntime && firstLabel && !firstLabel.includes('-pooler')) {
        parsedUrl.hostname = `${firstLabel}-pooler.${rest.join('.')}`
      }

      if (!parsedUrl.searchParams.get('sslmode')) {
        parsedUrl.searchParams.set('sslmode', 'require')
      }

      if (isVercelRuntime) {
        if (!parsedUrl.searchParams.get('pgbouncer')) {
          parsedUrl.searchParams.set('pgbouncer', 'true')
        }

        if (!parsedUrl.searchParams.get('connect_timeout')) {
          parsedUrl.searchParams.set('connect_timeout', '15')
        }
      }
    }

    return parsedUrl.toString()
  } catch {
    return configuredUrl
  }
}

const runtimeDatabaseUrl = resolveRuntimeDatabaseUrl()

const prisma = new PrismaClient({
  errorFormat: 'minimal',
  datasources: {
    db: {
      url: runtimeDatabaseUrl,
    },
  },
})

export { prisma }
