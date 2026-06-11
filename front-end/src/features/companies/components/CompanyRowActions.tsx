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
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { RowActions } from '@/shared/components/RowActions'

import {
  useCompanyDetails,
  useDeleteCompany,
  useUpdateCompany,
} from '../hooks/useCompanyActions'
import type { Company, UpdateCompanyInput } from '../types/companyTypes'

type CompanyRowActionsProps = {
  company: Company
}

function CompanyRowActions({ company }: CompanyRowActionsProps) {
  const [viewOpen, setViewOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const companyDetailsQuery = useCompanyDetails(
    company.id,
    viewOpen || editOpen,
  )
  const updateCompanyMutation = useUpdateCompany(company.id)
  const deleteCompanyMutation = useDeleteCompany()
  const companyDetails = companyDetailsQuery.data ?? company

  function handleEditOpenChange(nextOpen: boolean) {
    setEditOpen(nextOpen)
    if (!nextOpen) {
      updateCompanyMutation.reset()
    }
  }

  function handleDeleteOpenChange(nextOpen: boolean) {
    setDeleteOpen(nextOpen)
    if (!nextOpen) {
      deleteCompanyMutation.reset()
    }
  }

  function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = event.currentTarget
    const formData = new FormData(form)
    const input: UpdateCompanyInput = {
      name: String(formData.get('name') ?? ''),
      website: String(formData.get('website') ?? ''),
      industry: String(formData.get('industry') ?? ''),
      size: String(formData.get('size') ?? ''),
      country: String(formData.get('country') ?? ''),
      city: String(formData.get('city') ?? ''),
    }

    updateCompanyMutation.mutate(input, {
      onSuccess: () => {
        setEditOpen(false)
      },
    })
  }

  function handleDelete() {
    deleteCompanyMutation.mutate(company.id, {
      onSuccess: () => {
        setDeleteOpen(false)
      },
    })
  }

  const updateError =
    updateCompanyMutation.error instanceof Error
      ? updateCompanyMutation.error.message
      : ''
  const deleteError =
    deleteCompanyMutation.error instanceof Error
      ? deleteCompanyMutation.error.message
      : ''

  return (
    <>
      <RowActions
        onView={() => setViewOpen(true)}
        onEdit={() => setEditOpen(true)}
        onDelete={() => setDeleteOpen(true)}
      />

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-[520px] rounded-lg bg-white p-5">
          <DialogHeader>
            <DialogTitle className="text-xl font-[750] text-[#172033]">
              {companyDetails.name}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Company details.
            </DialogDescription>
          </DialogHeader>

          <dl className="grid gap-3 text-sm">
            {[
              ['Website', companyDetails.website],
              ['Industry', companyDetails.industry],
              ['Size', companyDetails.size],
              ['Country', companyDetails.country],
              ['City', companyDetails.city],
            ].map(([label, value]) => (
              <div
                key={label}
                className="grid gap-1 rounded-md border border-[#eef2f7] px-3 py-2"
              >
                <dt className="font-semibold text-[#42526b]">{label}</dt>
                <dd className="text-[#172033]">{value || '-'}</dd>
              </div>
            ))}
          </dl>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={handleEditOpenChange}>
        <DialogContent className="max-w-[560px] rounded-lg bg-white p-5">
          <DialogHeader>
            <DialogTitle className="text-xl font-[750] text-[#172033]">
              Edit Company
            </DialogTitle>
            <DialogDescription className="sr-only">
              Edit company details.
            </DialogDescription>
          </DialogHeader>

          <form
            key={companyDetails.updatedAt}
            onSubmit={handleUpdate}
            className="grid gap-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-semibold text-[#172033] sm:col-span-2">
                Name *
                <Input
                  name="name"
                  required
                  defaultValue={companyDetails.name}
                  className="h-10 rounded-md bg-white"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold text-[#172033]">
                Website
                <Input
                  name="website"
                  defaultValue={companyDetails.website ?? ''}
                  className="h-10 rounded-md bg-white"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold text-[#172033]">
                Industry
                <Input
                  name="industry"
                  defaultValue={companyDetails.industry ?? ''}
                  className="h-10 rounded-md bg-white"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold text-[#172033]">
                Size
                <Input
                  name="size"
                  defaultValue={companyDetails.size ?? ''}
                  className="h-10 rounded-md bg-white"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold text-[#172033]">
                Country
                <Input
                  name="country"
                  defaultValue={companyDetails.country ?? ''}
                  className="h-10 rounded-md bg-white"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold text-[#172033]">
                City
                <Input
                  name="city"
                  defaultValue={companyDetails.city ?? ''}
                  className="h-10 rounded-md bg-white"
                />
              </label>
            </div>

            {updateError ? (
              <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
                {updateError}
              </p>
            ) : null}

            <DialogFooter className="-mx-5 -mb-5 rounded-b-lg">
              <Button
                type="submit"
                disabled={updateCompanyMutation.isPending}
                className="bg-sky-600 text-white hover:bg-sky-700"
              >
                {updateCompanyMutation.isPending ? 'Saving' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={handleDeleteOpenChange}>
        <DialogContent className="max-w-[420px] rounded-lg bg-white p-5">
          <DialogHeader>
            <DialogTitle className="text-xl font-[750] text-[#172033]">
              Delete Company
            </DialogTitle>
            <DialogDescription>
              Delete {company.name}? Related contacts and leads will keep their
              records without this organization.
            </DialogDescription>
          </DialogHeader>

          {deleteError ? (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
              {deleteError}
            </p>
          ) : null}

          <DialogFooter className="-mx-5 -mb-5 rounded-b-lg">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={deleteCompanyMutation.isPending}
              onClick={handleDelete}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              {deleteCompanyMutation.isPending ? 'Deleting' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export { CompanyRowActions }
