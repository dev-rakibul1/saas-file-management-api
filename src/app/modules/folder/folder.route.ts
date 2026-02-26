import express from 'express'
import auth from '../../middlewares/auth'
import validateRequest from '../../middlewares/validateRequest'
import { FolderController } from './folder.controller'
import { FolderValidation } from './folder.validation'

const router = express.Router()

router.post(
  '/',
  auth('USER'),
  validateRequest(FolderValidation.createFolderSchema),
  FolderController.createFolder
)

router.get('/', auth('USER'), FolderController.getFolders)

router.get('/tree', auth('USER'), FolderController.getFolderTree)

router.patch(
  '/:id',
  auth('USER'),
  validateRequest(FolderValidation.updateFolderSchema),
  FolderController.updateFolder
)

router.delete('/:id', auth('USER'), FolderController.deleteFolder)

export default router
