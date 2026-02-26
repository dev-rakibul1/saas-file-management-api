import express from 'express'
import auth from '../../middlewares/auth'
import validateRequest from '../../middlewares/validateRequest'
import { FileController } from './file.controller'
import { FileValidation } from './file.validation'

const router = express.Router()

router.post(
  '/upload',
  auth('USER'),
  validateRequest(FileValidation.uploadFileSchema),
  FileController.uploadFile
)

router.get('/', auth('USER'), FileController.getFiles)

router.get('/:id/download', auth('USER'), FileController.downloadFile)

router.patch(
  '/:id',
  auth('USER'),
  validateRequest(FileValidation.updateFileSchema),
  FileController.updateFile
)

router.delete('/:id', auth('USER'), FileController.deleteFile)

export default router
