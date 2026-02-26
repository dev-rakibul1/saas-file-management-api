import cors from 'cors'
import express, { Application, Request, Response } from 'express'
import env from './config/env'
import globalErrorHandler from './app/middlewares/globalErrorHandler'
import router from './app/routes'

const app: Application = express()

const allowedOrigins = env.FRONTEND_URL.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
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
