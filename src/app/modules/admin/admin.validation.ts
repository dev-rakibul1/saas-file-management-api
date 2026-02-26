import { z } from 'zod'

const listUsersSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/, 'page must be a positive integer.').optional(),
    limit: z.string().regex(/^\d+$/, 'limit must be a positive integer.').optional(),
    packageId: z.string().uuid('Invalid packageId.').optional(),
  }),
})

export const AdminValidation = {
  listUsersSchema,
}
