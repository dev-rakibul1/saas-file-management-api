import express from 'express'
import auth from '../../middlewares/auth'
import validateRequest from '../../middlewares/validateRequest'
import { UserController } from './user.controller'
import { UserValidation } from './user.validation'

const router = express.Router()

router.post(
  '/register',
  validateRequest(UserValidation.createUserSchema),
  UserController.createUser
)

router.post(
  '/login',
  validateRequest(UserValidation.loginUserSchema),
  UserController.loginUser
)

router.get('/profile', auth(), UserController.getProfile)

router.patch(
  '/profile',
  auth(),
  validateRequest(UserValidation.updateUserSchema),
  UserController.updateUser
)

export default router
