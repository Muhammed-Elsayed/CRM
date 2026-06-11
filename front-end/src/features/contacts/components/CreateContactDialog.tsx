import { useState } from 'react'
import type { FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

import { useCompanyOptions } from '../hooks/useCompanyOptions'
import { useCreateContact } from '../hooks/useCreateContact'
import type { CreateContactInput } from '../types/contactTypes'

function CreateContactDialog() {
  const [open, setOpen] = useState(false)
  const createContactMutation = useCreateContact()
  const companyOptionsQuery = useCompanyOptions()
  const companies = companyOptionsQuery.data ?? []

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      createContactMutation.reset()
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = event.currentTarget
    const formData = new FormData(form)
    const input: CreateContactInput = {
      companyId: String(formData.get('companyId') ?? ''),
      firstName: String(formData.get('firstName') ?? ''),
      lastName: String(formData.get('lastName') ?? ''),
      email: String(formData.get('email') ?? ''),
      phone: String(formData.get('phone') ?? ''),
      jobTitle: String(formData.get('jobTitle') ?? ''),
    }

    createContactMutation.mutate(input, {
      onSuccess: () => {
        form.reset()
        setOpen(false)
      },
    })
  }

  const createError =
    createContactMutation.error instanceof Error
      ? createContactMutation.error.message
      : ''
  const companyError =
    companyOptionsQuery.error instanceof Error
      ? companyOptionsQuery.error.message
      : ''

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="h-9 rounded-md bg-sky-600 px-4 text-sm font-bold text-white hover:bg-sky-700">
          Create Contact
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[560px] rounded-lg bg-white p-5">
        <DialogHeader>
          <DialogTitle className="text-xl font-[750] text-[#172033]">
            Create Contact
          </DialogTitle>
          <DialogDescription className="sr-only">
            Create a contact record.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-semibold text-[#172033]">
              First Name *
              <Input
                name="firstName"
                required
                className="h-10 rounded-md bg-white"
                placeholder="Jane"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-[#172033]">
              Last Name *
              <Input
                name="lastName"
                required
                className="h-10 rounded-md bg-white"
                placeholder="Doe"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-[#172033]">
              Email
              <Input
                name="email"
                type="email"
                className="h-10 rounded-md bg-white"
                placeholder="jane@example.com"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-[#172033]">
              Phone
              <Input
                name="phone"
                className="h-10 rounded-md bg-white"
                placeholder="5550101"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-[#172033]">
              Job Title
              <Input
                name="jobTitle"
                className="h-10 rounded-md bg-white"
                placeholder="Decision Maker"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-[#172033]">
              Organization
              <select
                name="companyId"
                disabled={companyOptionsQuery.isLoading}
                className="h-10 rounded-md border border-[#d8e0ea] bg-white px-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              >
                <option value="">No organization</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {companyError ? (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
              {companyError}
            </p>
          ) : null}

          {createError ? (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
              {createError}
            </p>
          ) : null}

          <DialogFooter className="-mx-5 -mb-5 rounded-b-lg">
            <Button
              type="submit"
              disabled={createContactMutation.isPending}
              className="bg-sky-600 text-white hover:bg-sky-700"
            >
              {createContactMutation.isPending ? 'Creating' : 'Create Contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { CreateContactDialog }
