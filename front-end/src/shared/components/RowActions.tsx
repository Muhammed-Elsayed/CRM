import { Eye, Pencil, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

type RowActionsProps = {
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}

function RowActions({ onView, onEdit, onDelete }: RowActionsProps) {
  return (
    <div className="flex justify-end gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="rounded-full text-[#172033]"
        onClick={onView}
        aria-label="View"
        title="View"
      >
        <Eye className="size-4" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="rounded-full text-[#172033]"
        onClick={onEdit}
        aria-label="Edit"
        title="Edit"
      >
        <Pencil className="size-4" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="rounded-full text-[#172033]"
        onClick={onDelete}
        aria-label="Delete"
        title="Delete"
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </Button>
    </div>
  )
}

export { RowActions }
