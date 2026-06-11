import type { Contact, Prisma } from '@prisma/client'

import { companySelect } from './company-model.js'

const contactSelect = {
    id: true,
    companyId: true,
    firstName: true,
    lastName: true,
    email: true,
    phone: true,
    jobTitle: true,
    createdAt: true,
    updatedAt: true,
    company: {
        select: companySelect,
    },
} satisfies Prisma.ContactSelect

type ContactModel = Contact
type PublicContactModel = Prisma.ContactGetPayload<{ select: typeof contactSelect }>

export { contactSelect }
export type { ContactModel, PublicContactModel }
