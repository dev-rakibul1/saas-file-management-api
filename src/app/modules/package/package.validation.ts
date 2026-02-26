import { z } from 'zod'
import { EnforcementService } from '../enforcement/enforcement.service'

const allowedFileTypesSchema = z
  .array(z.enum(EnforcementService.SUPPORTED_FILE_TYPE_CATEGORIES))
  .min(1, 'At least one allowed file type is required.')

const createPackageSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Package name is required.' })
      .min(2, 'Package name must be at least 2 characters long.')
      .max(50, 'Package name cannot exceed 50 characters.'),
    maxFolders: z
      .number({ required_error: 'maxFolders is required.' })
      .int('maxFolders must be an integer.')
      .positive('maxFolders must be greater than 0.'),
    maxNestingLevel: z
      .number({ required_error: 'maxNestingLevel is required.' })
      .int('maxNestingLevel must be an integer.')
      .positive('maxNestingLevel must be greater than 0.'),
    allowedFileTypes: allowedFileTypesSchema,
    maxFileSizeBytes: z
      .number({ required_error: 'maxFileSizeBytes is required.' })
      .int('maxFileSizeBytes must be an integer.')
      .positive('maxFileSizeBytes must be greater than 0.'),
    totalFileLimit: z
      .number({ required_error: 'totalFileLimit is required.' })
      .int('totalFileLimit must be an integer.')
      .positive('totalFileLimit must be greater than 0.'),
    filesPerFolder: z
      .number({ required_error: 'filesPerFolder is required.' })
      .int('filesPerFolder must be an integer.')
      .positive('filesPerFolder must be greater than 0.'),
  }),
})

const updatePackageSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .min(2, 'Package name must be at least 2 characters long.')
        .max(50, 'Package name cannot exceed 50 characters.')
        .optional(),
      maxFolders: z.number().int('maxFolders must be an integer.').positive().optional(),
      maxNestingLevel: z
        .number()
        .int('maxNestingLevel must be an integer.')
        .positive()
        .optional(),
      allowedFileTypes: allowedFileTypesSchema.optional(),
      maxFileSizeBytes: z
        .number()
        .int('maxFileSizeBytes must be an integer.')
        .positive()
        .optional(),
      totalFileLimit: z
        .number()
        .int('totalFileLimit must be an integer.')
        .positive()
        .optional(),
      filesPerFolder: z
        .number()
        .int('filesPerFolder must be an integer.')
        .positive()
        .optional(),
      isActive: z.boolean().optional(),
    })
    .refine((payload) => Object.keys(payload).length > 0, {
      message: 'At least one field is required for update.',
    }),
})

export const PackageValidation = {
  createPackageSchema,
  updatePackageSchema,
}
