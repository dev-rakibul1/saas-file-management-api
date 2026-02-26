import { z } from 'zod'

const selectPackageSchema = z.object({
  body: z.object({
    packageId: z
      .string({ required_error: 'packageId is required.' })
      .uuid('Invalid packageId.'),
  }),
})

export const SubscriptionValidation = {
  selectPackageSchema,
}
