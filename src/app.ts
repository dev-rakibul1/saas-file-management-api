import cors from 'cors'
import express, { Application, Request, Response } from 'express'
import globalErrorHandler from './app/middlewares/globalErrorHandler'
import router from './app/routes'

const app: Application = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

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
