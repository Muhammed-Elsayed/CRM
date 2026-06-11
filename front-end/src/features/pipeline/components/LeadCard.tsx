import { AlertTriangle, Building2, MoveRight, User } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

import type { BoardStage, Lead } from '../types/pipelineTypes'
import {
  formatCurrency,
  formatLabel,
  getContactName,
  getInitials,
  getLeadCompanyName,
} from './pipelineFormatters'
import { LeadCardActions } from './LeadCardActions'

type LeadCardProps = {
  lead: Lead
  stages: BoardStage[]
  isMoving: boolean
  onDragStart: (lead: Lead) => void
  onMove: (leadId: string, stageId: string) => void
}

const avatarColors = [
  'bg-[#d5fb7b] text-[#315018]',
  'bg-[#ffd7a3] text-[#7a3b08]',
  'bg-[#ffc4e5] text-[#7a2557]',
  'bg-[#bfdbfe] text-[#1d4f91]',
  'bg-[#fecaca] text-[#7f1d1d]',
]

function LeadCard({
  lead,
  stages,
  isMoving,
  onDragStart,
  onMove,
}: LeadCardProps) {
  const contactName = getContactName(lead.contact)
  const companyName = getLeadCompanyName(lead)
  const avatarClass = avatarColors[lead.id.charCodeAt(0) % avatarColors.length]

  return (
    <article
      draggable={!isMoving}
      onDragStart={() => onDragStart(lead)}
      className={cn(
        'rounded-lg border border-[#d8e0ea] bg-white p-3 shadow-sm transition hover:border-sky-200 hover:shadow-md',
        isMoving && 'opacity-60',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold',
            avatarClass,
          )}
        >
          {getInitials(contactName)}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-[#172033]">
            {contactName}
          </h3>
          <p className="truncate text-xs text-[#42526b]">{companyName}</p>
        </div>

        {lead.priority === 'HIGH' || lead.priority === 'CRITICAL' ? (
          <AlertTriangle
            className="size-4 shrink-0 text-rose-500"
            aria-label={`${formatLabel(lead.priority)} priority`}
          />
        ) : null}

        <LeadCardActions lead={lead} />
      </div>

      <p className="mt-4 line-clamp-2 min-h-10 text-sm font-medium leading-5 text-[#172033]">
        {lead.title}
      </p>

      {lead.description ? (
        <p className="mt-2 line-clamp-2 text-xs leading-4 text-[#66748a]">
          {lead.description}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge className="gap-1 rounded-full bg-[#eef2f7] px-2 py-1 text-xs font-semibold text-[#172033]">
          <User className="size-3.5" aria-hidden="true" />
          {lead.owner?.name ?? 'Owner'}
        </Badge>
        <Badge className="rounded-full bg-[#eef2f7] px-2 py-1 text-xs font-semibold text-[#172033]">
          {formatCurrency(lead.value)}
        </Badge>
        <Badge className="rounded-full bg-[#eef2f7] px-2 py-1 text-xs font-semibold text-[#172033]">
          {formatLabel(lead.source)}
        </Badge>
        <Badge
          className={cn(
            'rounded-full px-2 py-1 text-xs font-semibold',
            lead.priority === 'CRITICAL'
              ? 'bg-[#ffe0e0] text-[#dc2626]'
              : lead.priority === 'HIGH'
                ? 'bg-[#fff0c7] text-[#c2410c]'
                : 'bg-[#eef2f7] text-[#172033]',
          )}
        >
          {formatLabel(lead.priority)}
        </Badge>
        {lead.company?.industry ? (
          <Badge className="gap-1 rounded-full bg-[#eef2f7] px-2 py-1 text-xs font-semibold text-[#172033]">
            <Building2 className="size-3.5" aria-hidden="true" />
            {lead.company.industry}
          </Badge>
        ) : null}
      </div>

      <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#42526b]">
        <MoveRight className="size-4" aria-hidden="true" />
        <select
          value={lead.stageId}
          disabled={isMoving}
          onChange={(event) => onMove(lead.id, event.target.value)}
          className="h-8 min-w-0 flex-1 rounded-md border border-[#d8e0ea] bg-white px-2 text-xs text-[#172033] outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          aria-label={`Move ${lead.title}`}
        >
          {stages.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.name}
            </option>
          ))}
        </select>
      </label>
    </article>
  )
}

export { LeadCard }
