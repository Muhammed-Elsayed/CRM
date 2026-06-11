import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { BoardStage, Lead } from '../types/pipelineTypes'
import { CreateLeadDialog } from './CreateLeadDialog'
import { formatCurrency } from './pipelineFormatters'
import { LeadCard } from './LeadCard'

type PipelineStageColumnProps = {
  stage: BoardStage
  allStages: BoardStage[]
  draggedLeadId?: string
  movingLeadId?: string
  onDragStart: (lead: Lead) => void
  onDropLead: (stageId: string) => void
  onMoveLead: (leadId: string, stageId: string) => void
}

function PipelineStageColumn({
  stage,
  allStages,
  draggedLeadId,
  movingLeadId,
  onDragStart,
  onDropLead,
  onMoveLead,
}: PipelineStageColumnProps) {
  const totalValue = stage.leads.reduce((sum, lead) => sum + lead.value, 0)
  const maxColumnValue = Math.max(
    ...allStages.map((item) =>
      item.leads.reduce((sum, lead) => sum + lead.value, 0),
    ),
    1,
  )
  const progressWidth = Math.max(6, (totalValue / maxColumnValue) * 100)

  return (
    <section
      className={cn(
        'flex h-[calc(100svh-248px)] min-h-[420px] w-[292px] shrink-0 flex-col rounded-lg border border-[#d8e0ea] bg-white',
        draggedLeadId && 'ring-1 ring-sky-100',
      )}
      onDragOver={(event) => event.preventDefault()}
      onDrop={() => onDropLead(stage.id)}
      aria-label={`${stage.name} stage`}
    >
      <div className="border-b border-[#eef2f7] p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold text-[#172033]">
              {stage.name} ({stage.leads.length})
            </h2>
            <p className="mt-1 text-xs font-semibold text-[#172033]">
              {formatCurrency(totalValue)}
            </p>
          </div>
          <CreateLeadDialog
            firstStage={allStages[0]}
            triggerStage={stage}
            trigger={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-full text-[#42526b] hover:bg-[#eef6fd] hover:text-sky-700"
                title={`Create lead in ${stage.name}`}
                aria-label={`Create lead in ${stage.name}`}
                disabled={!allStages[0]}
              >
                <Plus className="size-4" aria-hidden="true" />
              </Button>
            }
          />
        </div>
        <div className="mt-2 h-1 rounded-full bg-[#e5eaf0]">
          <div
            className="h-full rounded-full bg-[#22c55e]"
            style={{ width: `${progressWidth}%` }}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-[#f8fafc] p-2.5">
        {stage.leads.length > 0 ? (
          stage.leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              stages={allStages}
              isMoving={movingLeadId === lead.id}
              onDragStart={onDragStart}
              onMove={onMoveLead}
            />
          ))
        ) : (
          <div className="grid h-32 place-items-center rounded-lg border border-dashed border-[#d8e0ea] bg-white px-4 text-center text-sm font-semibold text-[#8a98aa]">
            No leads
          </div>
        )}
      </div>
    </section>
  )
}

export { PipelineStageColumn }
