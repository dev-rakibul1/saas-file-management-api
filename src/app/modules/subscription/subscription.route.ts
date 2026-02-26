import express from 'express'
import auth from '../../middlewares/auth'
import validateRequest from '../../middlewares/validateRequest'
import { SubscriptionController } from './subscription.controller'
import { SubscriptionValidation } from './subscription.validation'

const router = express.Router()

router.get('/packages', auth(), SubscriptionController.getAvailablePackages)

router.post(
  '/select',
  auth('USER'),
  validateRequest(SubscriptionValidation.selectPackageSchema),
  SubscriptionController.selectPackage
)

router.get('/current', auth(), SubscriptionController.getCurrentSubscription)

router.get('/history', auth(), SubscriptionController.getSubscriptionHistory)

export default router
