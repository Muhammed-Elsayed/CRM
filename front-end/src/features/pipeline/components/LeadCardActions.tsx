import { useState } from 'react'
import type { FormEvent } from 'react'
import { Pencil, Trash2 } from 'lucide-react'

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

import { useDeleteLead, useUpdateLead } from '../hooks/useLeadActions'
import type { Lead, UpdateLeadInput } from '../types/pipelineTypes'

type LeadCardActionsProps = {
  lead: Lead
}

function LeadCardActions({ lead }: LeadCardActionsProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const updateLeadMutation = useUpdateLead(lead.id)
  const deleteLeadMutation = useDeleteLead()

  function handleEditOpenChange(nextOpen: boolean) {
    setEditOpen(nextOpen)
    if (!nextOpen) {
      updateLeadMutation.reset()
    }
  }

  function handleDeleteOpenChange(nextOpen: boolean) {
    setDeleteOpen(nextOpen)
    if (!nextOpen) {
      deleteLeadMutation.reset()
    }
  }

  function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const input: UpdateLeadInput = {
      title: String(formData.get('title') ?? ''),
      value: Number(formData.get('value') ?? 0),
      description: String(formData.get('description') ?? ''),
    }

    updateLeadMutation.mutate(input, {
      onSuccess: () => {
        setEditOpen(false)
      },
    })
  }

  function handleDelete() {
    deleteLeadMutation.mutate(lead.id, {
      onSuccess: () => {
        setDeleteOpen(false)
      },
    })
  }

  const updateError =
    updateLeadMutation.error instanceof Error
      ? updateLeadMutation.error.message
      : ''
  const deleteError =
    deleteLeadMutation.error instanceof Error
      ? deleteLeadMutation.error.message
      : ''

  return (
    <>
      <div
        className="flex shrink-0 items-center gap-1"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="rounded-full text-[#42526b] hover:bg-[#eef6fd] hover:text-sky-700"
          onClick={() => setEditOpen(true)}
          aria-label={`Edit ${lead.title}`}
          title="Edit lead"
        >
          <Pencil className="size-4" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="rounded-full text-[#42526b] hover:bg-rose-50 hover:text-rose-600"
          onClick={() => setDeleteOpen(true)}
          aria-label={`Delete ${lead.title}`}
          title="Delete lead"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </Button>
      </div>

      <Dialog open={editOpen} onOpenChange={handleEditOpenChange}>
        <DialogContent className="max-w-[520px] rounded-lg bg-white p-5">
          <DialogHeader>
            <DialogTitle className="text-xl font-[750] text-[#172033]">
              Edit Lead
            </DialogTitle>
            <DialogDescription className="sr-only">
              Edit lead title, value, and description.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="grid gap-4">
            <label className="grid gap-1.5 text-sm font-semibold text-[#172033]">
              Title *
              <Input
                name="title"
                required
                defaultValue={lead.title}
                className="h-10 rounded-md bg-white"
              />
            </label>

            <label className="grid gap-1.5 text-sm font-semibold text-[#172033]">
              Amount
              <Input
                name="value"
                type="number"
                min="0"
                step="0.01"
                defaultValue={lead.value}
                className="h-10 rounded-md bg-white"
              />
            </label>

            <label className="grid gap-1.5 text-sm font-semibold text-[#172033]">
              Description
              <textarea
                name="description"
                rows={4}
                defaultValue={lead.description ?? ''}
                className="min-h-28 rounded-md border border-[#d8e0ea] bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
            </label>

            {updateError ? (
              <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
                {updateError}
              </p>
            ) : null}

            <DialogFooter className="-mx-5 -mb-5 rounded-b-lg">
              <Button
                type="submit"
                disabled={updateLeadMutation.isPending}
                className="bg-sky-600 text-white hover:bg-sky-700"
              >
                {updateLeadMutation.isPending ? 'Saving' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={handleDeleteOpenChange}>
        <DialogContent className="max-w-[420px] rounded-lg bg-white p-5">
          <DialogHeader>
            <DialogTitle className="text-xl font-[750] text-[#172033]">
              Delete Lead
            </DialogTitle>
            <DialogDescription>
              Delete {lead.title}? This removes it from the pipeline and the
              database.
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
              disabled={deleteLeadMutation.isPending}
              onClick={handleDelete}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              {deleteLeadMutation.isPending ? 'Deleting' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export { LeadCardActions }
