import { z } from "zod"

// ─── Primitives ──────────────────────────────────────────────────────────────

export const emailSchema = z
  .string()
  .min(1, "El correo electrónico es requerido")
  .email("Correo electrónico inválido")
  .toLowerCase()
  .trim()

export const passwordSchema = z
  .string()
  .min(1, "La contraseña es requerida")
  .min(8, "La contraseña debe tener al menos 8 caracteres")

export const nameSchema = (field: string) =>
  z
    .string()
    .min(1, `El ${field} es requerido`)
    .max(150, `El ${field} no puede exceder 150 caracteres`)
    .trim()

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "La contraseña es requerida"),
})

export const registerSchema = z
  .object({
    first_name: nameSchema("nombre"),
    last_name: nameSchema("apellido"),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirma tu contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })

// ─── Users ────────────────────────────────────────────────────────────────────

export const createUserSchema = z.object({
  first_name: nameSchema("nombre"),
  last_name: nameSchema("apellido"),
  email: emailSchema,
  password: passwordSchema,
  role_id: z.number({ error: "Selecciona un rol" }).nullable().optional(),
  is_active: z.boolean().default(true),
})

export const updateUserSchema = z.object({
  first_name: nameSchema("nombre"),
  last_name: nameSchema("apellido"),
  role_id: z.number({ error: "Selecciona un rol" }).nullable().optional(),
  is_active: z.boolean(),
})

// ─── Roles ────────────────────────────────────────────────────────────────────

export const createRoleSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre del rol es requerido")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .trim(),
  description: z.string().max(500, "La descripción no puede exceder 500 caracteres").optional(),
  permission_ids: z.array(z.number()).default([]),
})

export const updateRoleSchema = createRoleSchema

// ─── Inferred types ───────────────────────────────────────────────────────────

export type LoginFormValues = z.infer<typeof loginSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>
export type CreateUserFormValues = z.infer<typeof createUserSchema>
export type UpdateUserFormValues = z.infer<typeof updateUserSchema>
export type CreateRoleFormValues = z.infer<typeof createRoleSchema>
export type UpdateRoleFormValues = z.infer<typeof updateRoleSchema>
