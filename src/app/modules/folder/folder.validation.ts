import { z } from 'zod'

const createFolderSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Folder name is required.' })
      .min(1, 'Folder name is required.')
      .max(120, 'Folder name cannot exceed 120 characters.'),
    parentId: z.string().uuid('Invalid parentId.').optional(),
  }),
})

const updateFolderSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Folder name is required.' })
      .min(1, 'Folder name is required.')
      .max(120, 'Folder name cannot exceed 120 characters.'),
  }),
})

export const FolderValidation = {
  createFolderSchema,
  updateFolderSchema,
}
