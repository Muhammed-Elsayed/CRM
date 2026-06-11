import { useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Plus } from 'lucide-react'

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

import { useCreateLead } from '../hooks/useCreateLead'
import { useLeadLookups } from '../hooks/useLeadLookups'
import type {
  BoardStage,
  CreateLeadInput,
  LeadPriority,
  LeadSource,
} from '../types/pipelineTypes'

type CreateLeadDialogProps = {
  firstStage?: BoardStage
  trigger?: ReactNode
  triggerStage?: BoardStage
  onOpenChange?: (open: boolean) => void
}

const leadSources: LeadSource[] = [
  'WEBSITE',
  'REFERRAL',
  'EMAIL',
  'CALL',
  'SOCIAL_MEDIA',
  'AFFILIATE',
  'OTHER',
]

const leadPriorities: LeadPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

function CreateLeadDialog({
  firstStage,
  trigger,
  triggerStage,
  onOpenChange,
}: CreateLeadDialogProps) {
  const [open, setOpen] = useState(false)
  const createLeadMutation = useCreateLead()
  const { companiesQuery, contactsQuery } = useLeadLookups()
  const companies = companiesQuery.data ?? []
  const contacts = contactsQuery.data ?? []
  const canAttachLead = companies.length > 0 || contacts.length > 0
  const stageForCreate = firstStage
  const isLookupLoading = companiesQuery.isLoading || contactsQuery.isLoading

  const lookupError = useMemo(() => {
    const error = companiesQuery.error ?? contactsQuery.error
    return error instanceof Error ? error.message : ''
  }, [companiesQuery.error, contactsQuery.error])

  useEffect(() => {
    onOpenChange?.(open)
  }, [onOpenChange, open])

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      createLeadMutation.reset()
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!stageForCreate) {
      return
    }

    const form = event.currentTarget
    const formData = new FormData(form)
    const payload: CreateLeadInput = {
      title: String(formData.get('title') ?? ''),
      description: String(formData.get('description') ?? ''),
      companyId: String(formData.get('companyId') ?? ''),
      contactId: String(formData.get('contactId') ?? ''),
      stageId: stageForCreate.id,
      value: Number(formData.get('value') ?? 0),
      source: String(formData.get('source') ?? 'OTHER') as LeadSource,
      priority: String(formData.get('priority') ?? 'MEDIUM') as LeadPriority,
      expectedCloseDate: String(formData.get('expectedCloseDate') ?? ''),
    }

    createLeadMutation.mutate(payload, {
      onSuccess: () => {
        form.reset()
        setOpen(false)
      },
    })
  }

  const createError =
    createLeadMutation.error instanceof Error
      ? createLeadMutation.error.message
      : ''

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            type="button"
            className="h-9 rounded-md bg-sky-600 px-4 text-sm font-bold text-white hover:bg-sky-700"
            disabled={!firstStage}
          >
            <Plus className="size-4" aria-hidden="true" />
            Create Lead
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[560px] rounded-lg bg-white p-5">
        <DialogHeader>
          <DialogTitle className="text-xl font-[750] text-[#172033]">
            Create Lead
          </DialogTitle>
          <DialogDescription className="sr-only">
            Create a lead in {stageForCreate?.name ?? 'the first stage'}
            {triggerStage ? ` from ${triggerStage.name}` : ''}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-semibold text-[#172033] sm:col-span-2">
              Title *
              <Input
                name="title"
                required
                placeholder="Lead title"
                className="h-10 rounded-md bg-white"
              />
            </label>

            <label className="grid gap-1.5 text-sm font-semibold text-[#172033]">
              Company
              <select
                name="companyId"
                className="h-10 rounded-md border border-[#d8e0ea] bg-white px-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                disabled={isLookupLoading}
              >
                <option value="">No company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5 text-sm font-semibold text-[#172033]">
              Contact
              <select
                name="contactId"
                className="h-10 rounded-md border border-[#d8e0ea] bg-white px-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                disabled={isLookupLoading}
              >
                <option value="">No contact</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.firstName} {contact.lastName}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5 text-sm font-semibold text-[#172033]">
              Value
              <Input
                name="value"
                type="number"
                min="0"
                step="0.01"
                defaultValue="0"
                className="h-10 rounded-md bg-white"
              />
            </label>

            <label className="grid gap-1.5 text-sm font-semibold text-[#172033]">
              Expected Close Date
              <Input
                name="expectedCloseDate"
                type="date"
                className="h-10 rounded-md bg-white"
              />
            </label>

            <label className="grid gap-1.5 text-sm font-semibold text-[#172033]">
              Source
              <select
                name="source"
                defaultValue="OTHER"
                className="h-10 rounded-md border border-[#d8e0ea] bg-white px-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              >
                {leadSources.map((source) => (
                  <option key={source} value={source}>
                    {source.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5 text-sm font-semibold text-[#172033]">
              Priority
              <select
                name="priority"
                defaultValue="MEDIUM"
                className="h-10 rounded-md border border-[#d8e0ea] bg-white px-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              >
                {leadPriorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5 text-sm font-semibold text-[#172033] sm:col-span-2">
              Description
              <textarea
                name="description"
                rows={3}
                className="min-h-24 rounded-md border border-[#d8e0ea] bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                placeholder="Details"
              />
            </label>
          </div>

          {lookupError ? (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
              {lookupError}
            </p>
          ) : null}

          {!isLookupLoading && !canAttachLead ? (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
              Add at least one company or contact before creating a lead.
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
              className="bg-sky-600 text-white hover:bg-sky-700"
              disabled={
                createLeadMutation.isPending ||
                isLookupLoading ||
                !canAttachLead ||
                !stageForCreate
              }
            >
              {createLeadMutation.isPending ? 'Creating' : 'Create Lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { CreateLeadDialog }
