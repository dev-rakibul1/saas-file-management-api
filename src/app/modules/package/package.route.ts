import express from 'express'
import auth from '../../middlewares/auth'
import validateRequest from '../../middlewares/validateRequest'
import { PackageController } from './package.controller'
import { PackageValidation } from './package.validation'

const router = express.Router()

router.post(
  '/',
  auth('ADMIN'),
  validateRequest(PackageValidation.createPackageSchema),
  PackageController.createPackage
)

router.get('/', auth(), PackageController.getPackages)

router.get('/:id', auth(), PackageController.getPackageById)

router.patch(
  '/:id',
  auth('ADMIN'),
  validateRequest(PackageValidation.updatePackageSchema),
  PackageController.updatePackage
)

router.delete('/:id', auth('ADMIN'), PackageController.deletePackage)

export default router
