import cors, { CorsOptions } from 'cors'
import express, { Application, Request, Response } from 'express'
import globalErrorHandler from './app/middlewares/globalErrorHandler'
import router from './app/routes'
import env from './config/env'

const app: Application = express()

const normalizeOrigin = (origin: string): string => {
  const trimmed = origin.trim().replace(/\/+$/, '')

  if (!trimmed) {
    return ''
  }

  try {
    return new URL(trimmed).origin
  } catch {
    return trimmed
  }
}

// Allowed origins from ENV (production use)
const allowedOrigins =
  env.NODE_ENV === 'production'
    ? env.FRONTEND_URL.split(',')
        .map((origin) => normalizeOrigin(origin))
        .filter(Boolean)
    : []

// Dynamic CORS setup
const corsOrigin: CorsOptions['origin'] = (requestOrigin, callback) => {
  // Allow all in development
  if (env.NODE_ENV !== 'production') {
    callback(null, true)
    return
  }

  // Allow server-to-server or curl
  if (!requestOrigin) {
    callback(null, true)
    return
  }

  const normalizedRequestOrigin = normalizeOrigin(requestOrigin)

  if (allowedOrigins.includes(normalizedRequestOrigin)) {
    callback(null, true)
  } else {
    callback(new Error('Not allowed by CORS'))
  }
}

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
)

app.use(express.json({ limit: env.REQUEST_BODY_LIMIT }))
app.use(express.urlencoded({ extended: true, limit: env.REQUEST_BODY_LIMIT }))

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'SaaS File Management API is running.',
  })
})

app.use('/api/v1', router)

app.use(globalErrorHandler)

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'API path not found.',
    errorMessages: [{ path: req.originalUrl, message: 'Invalid URL.' }],
  })
})

export default app
