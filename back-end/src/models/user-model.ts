import type { Prisma, User } from '@prisma/client'

type UserModel = User
type PublicUserModel = Omit<UserModel, 'passwordHash'>

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
} satisfies Prisma.UserSelect

export type { PublicUserModel, UserModel }
export { publicUserSelect }
