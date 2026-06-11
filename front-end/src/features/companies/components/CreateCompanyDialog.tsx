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

import { useCreateCompany } from '../hooks/useCreateCompany'
import type { CreateCompanyInput } from '../types/companyTypes'

function CreateCompanyDialog() {
  const [open, setOpen] = useState(false)
  const createCompanyMutation = useCreateCompany()

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      createCompanyMutation.reset()
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = event.currentTarget
    const formData = new FormData(form)
    const input: CreateCompanyInput = {
      name: String(formData.get('name') ?? ''),
      website: String(formData.get('website') ?? ''),
      industry: String(formData.get('industry') ?? ''),
      size: String(formData.get('size') ?? ''),
      country: String(formData.get('country') ?? ''),
      city: String(formData.get('city') ?? ''),
    }

    createCompanyMutation.mutate(input, {
      onSuccess: () => {
        form.reset()
        setOpen(false)
      },
    })
  }

  const errorMessage =
    createCompanyMutation.error instanceof Error
      ? createCompanyMutation.error.message
      : ''

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="h-9 rounded-md bg-sky-600 px-4 text-sm font-bold text-white hover:bg-sky-700">
          Create Company
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[560px] rounded-lg bg-white p-5">
        <DialogHeader>
          <DialogTitle className="text-xl font-[750] text-[#172033]">
            Create Company
          </DialogTitle>
          <DialogDescription className="sr-only">
            Create a company record.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-semibold text-[#172033] sm:col-span-2">
              Name *
              <Input
                name="name"
                required
                className="h-10 rounded-md bg-white"
                placeholder="Company name"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-[#172033]">
              Website
              <Input
                name="website"
                className="h-10 rounded-md bg-white"
                placeholder="https://example.com"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-[#172033]">
              Industry
              <Input
                name="industry"
                className="h-10 rounded-md bg-white"
                placeholder="Technology"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-[#172033]">
              Size
              <Input
                name="size"
                className="h-10 rounded-md bg-white"
                placeholder="Small Market Business"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-[#172033]">
              Country
              <Input
                name="country"
                className="h-10 rounded-md bg-white"
                placeholder="United States"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-[#172033]">
              City
              <Input
                name="city"
                className="h-10 rounded-md bg-white"
                placeholder="New York"
              />
            </label>
          </div>

          {errorMessage ? (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
              {errorMessage}
            </p>
          ) : null}

          <DialogFooter className="-mx-5 -mb-5 rounded-b-lg">
            <Button
              type="submit"
              disabled={createCompanyMutation.isPending}
              className="bg-sky-600 text-white hover:bg-sky-700"
            >
              {createCompanyMutation.isPending ? 'Creating' : 'Create Company'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { CreateCompanyDialog }
