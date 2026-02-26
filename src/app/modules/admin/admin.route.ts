import express from 'express'
import auth from '../../middlewares/auth'
import validateRequest from '../../middlewares/validateRequest'
import { AdminController } from './admin.controller'
import { AdminValidation } from './admin.validation'

const router = express.Router()

router.get(
  '/users',
  auth('ADMIN'),
  validateRequest(AdminValidation.listUsersSchema),
  AdminController.listUsers
)

router.get('/users/:id/usage', auth('ADMIN'), AdminController.getUserUsage)

router.get('/overview', auth('ADMIN'), AdminController.getOverview)

export default router
