import type { Company, Prisma } from '@prisma/client'

const companySelect = {
    id: true,
    name: true,
    website: true,
    industry: true,
    size: true,
    country: true,
    city: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.CompanySelect

type CompanyModel = Company
type PublicCompanyModel = Prisma.CompanyGetPayload<{ select: typeof companySelect }>

export { companySelect }
export type { CompanyModel, PublicCompanyModel }
