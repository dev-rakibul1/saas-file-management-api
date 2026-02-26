import { z } from 'zod'
import { UserRole } from '@prisma/client'

const createUserSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Name is required.' })
      .min(2, 'Name must be at least 2 characters long.')
      .max(120, 'Name cannot exceed 120 characters.'),
    email: z
      .string({ required_error: 'Email is required.' })
      .email('A valid email is required.'),
    password: z
      .string({ required_error: 'Password is required.' })
      .min(6, 'Password must be at least 6 characters long.')
      .max(72, 'Password cannot exceed 72 characters.'),
  }),
})

const loginUserSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required.' })
      .email('A valid email is required.'),
    password: z
      .string({ required_error: 'Password is required.' })
      .min(6, 'Password must be at least 6 characters long.')
      .max(72, 'Password cannot exceed 72 characters.'),
  }),
})

const updateUserSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .min(2, 'Name must be at least 2 characters long.')
        .max(120, 'Name cannot exceed 120 characters.')
        .optional(),
      email: z.string().email('A valid email is required.').optional(),
      password: z
        .string()
        .min(6, 'Password must be at least 6 characters long.')
        .max(72, 'Password cannot exceed 72 characters.')
        .optional(),
    })
    .refine((payload) => Object.keys(payload).length > 0, {
      message: 'At least one field is required for update.',
    }),
})

const switchRoleForTestingSchema = z.object({
  body: z.object({
    role: z.nativeEnum(UserRole, {
      required_error: 'role is required.',
      invalid_type_error: 'Invalid role.',
    }),
  }),
})

export const UserValidation = {
  createUserSchema,
  loginUserSchema,
  updateUserSchema,
  switchRoleForTestingSchema,
}
