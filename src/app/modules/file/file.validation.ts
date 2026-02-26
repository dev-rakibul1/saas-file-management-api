import { z } from 'zod'

const uploadFileSchema = z.object({
  body: z.object({
    folderId: z
      .string({ required_error: 'folderId is required.' })
      .uuid('Invalid folderId.'),
    originalName: z
      .string({ required_error: 'originalName is required.' })
      .min(1, 'originalName is required.')
      .max(255, 'originalName cannot exceed 255 characters.'),
    mimeType: z
      .string({ required_error: 'mimeType is required.' })
      .min(3, 'mimeType is required.'),
    contentBase64: z
      .string({ required_error: 'contentBase64 is required.' })
      .min(10, 'contentBase64 is required.'),
  }),
})

const updateFileSchema = z.object({
  body: z.object({
    originalName: z
      .string({ required_error: 'originalName is required.' })
      .min(1, 'originalName is required.')
      .max(255, 'originalName cannot exceed 255 characters.'),
  }),
})

export const FileValidation = {
  uploadFileSchema,
  updateFileSchema,
}
