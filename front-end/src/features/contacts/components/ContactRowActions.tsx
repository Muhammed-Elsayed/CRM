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

import { useCompanyOptions } from '../hooks/useCompanyOptions'
import {
  useContactDetails,
  useDeleteContact,
  useUpdateContact,
} from '../hooks/useContactActions'
import type { Contact, UpdateContactInput } from '../types/contactTypes'

type ContactRowActionsProps = {
  contact: Contact
}

function ContactRowActions({ contact }: ContactRowActionsProps) {
  const [viewOpen, setViewOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const contactDetailsQuery = useContactDetails(contact.id, viewOpen || editOpen)
  const companyOptionsQuery = useCompanyOptions()
  const updateContactMutation = useUpdateContact(contact.id)
  const deleteContactMutation = useDeleteContact()
  const contactDetails = contactDetailsQuery.data ?? contact
  const contactName = `${contactDetails.firstName} ${contactDetails.lastName}`

  function handleEditOpenChange(nextOpen: boolean) {
    setEditOpen(nextOpen)
    if (!nextOpen) {
      updateContactMutation.reset()
    }
  }

  function handleDeleteOpenChange(nextOpen: boolean) {
    setDeleteOpen(nextOpen)
    if (!nextOpen) {
      deleteContactMutation.reset()
    }
  }

  function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = event.currentTarget
    const formData = new FormData(form)
    const input: UpdateContactInput = {
      companyId: String(formData.get('companyId') ?? ''),
      firstName: String(formData.get('firstName') ?? ''),
      lastName: String(formData.get('lastName') ?? ''),
      email: String(formData.get('email') ?? ''),
      phone: String(formData.get('phone') ?? ''),
      jobTitle: String(formData.get('jobTitle') ?? ''),
    }

    updateContactMutation.mutate(input, {
      onSuccess: () => {
        setEditOpen(false)
      },
    })
  }

  function handleDelete() {
    deleteContactMutation.mutate(contact.id, {
      onSuccess: () => {
        setDeleteOpen(false)
      },
    })
  }

  const updateError =
    updateContactMutation.error instanceof Error
      ? updateContactMutation.error.message
      : ''
  const deleteError =
    deleteContactMutation.error instanceof Error
      ? deleteContactMutation.error.message
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
              {contactName}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Contact details.
            </DialogDescription>
          </DialogHeader>

          <dl className="grid gap-3 text-sm">
            {[
              ['Email', contactDetails.email],
              ['Phone', contactDetails.phone],
              ['Job Title', contactDetails.jobTitle],
              ['Organization', contactDetails.company?.name],
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
              Edit Contact
            </DialogTitle>
            <DialogDescription className="sr-only">
              Edit contact details.
            </DialogDescription>
          </DialogHeader>

          <form
            key={contactDetails.updatedAt}
            onSubmit={handleUpdate}
            className="grid gap-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-semibold text-[#172033]">
                First Name *
                <Input
                  name="firstName"
                  required
                  defaultValue={contactDetails.firstName}
                  className="h-10 rounded-md bg-white"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold text-[#172033]">
                Last Name *
                <Input
                  name="lastName"
                  required
                  defaultValue={contactDetails.lastName}
                  className="h-10 rounded-md bg-white"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold text-[#172033]">
                Email
                <Input
                  name="email"
                  type="email"
                  defaultValue={contactDetails.email ?? ''}
                  className="h-10 rounded-md bg-white"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold text-[#172033]">
                Phone
                <Input
                  name="phone"
                  defaultValue={contactDetails.phone ?? ''}
                  className="h-10 rounded-md bg-white"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold text-[#172033]">
                Job Title
                <Input
                  name="jobTitle"
                  defaultValue={contactDetails.jobTitle ?? ''}
                  className="h-10 rounded-md bg-white"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold text-[#172033]">
                Organization
                <select
                  name="companyId"
                  defaultValue={contactDetails.companyId ?? ''}
                  className="h-10 rounded-md border border-[#d8e0ea] bg-white px-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                >
                  <option value="">No organization</option>
                  {(companyOptionsQuery.data ?? []).map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
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
                disabled={updateContactMutation.isPending}
                className="bg-sky-600 text-white hover:bg-sky-700"
              >
                {updateContactMutation.isPending ? 'Saving' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={handleDeleteOpenChange}>
        <DialogContent className="max-w-[420px] rounded-lg bg-white p-5">
          <DialogHeader>
            <DialogTitle className="text-xl font-[750] text-[#172033]">
              Delete Contact
            </DialogTitle>
            <DialogDescription>
              Delete {contact.firstName} {contact.lastName}? Related leads will
              keep their records without this contact.
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
              disabled={deleteContactMutation.isPending}
              onClick={handleDelete}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              {deleteContactMutation.isPending ? 'Deleting' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export { ContactRowActions }
