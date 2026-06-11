import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'

import { useMoveLeadStage } from './hooks/useMoveLeadStage'
import { usePipelineBoard } from './hooks/usePipelineBoard'
import { PipelineStageColumn } from './components/PipelineStageColumn'
import { PipelineToolbar } from './components/PipelineToolbar'
import type { Lead } from './types/pipelineTypes'

function LeadsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null)
  const boardQuery = usePipelineBoard()
  const moveLeadStageMutation = useMoveLeadStage()
  const movingLeadId = moveLeadStageMutation.isPending
    ? moveLeadStageMutation.variables?.leadId
    : undefined

  const board = boardQuery.data
  const filteredStages = useMemo(() => {
    const stages = board?.stages ?? []
    const normalizedSearch = searchTerm.trim().toLowerCase()

    if (!normalizedSearch) {
      return stages
    }

    return stages.map((stage) => ({
      ...stage,
      leads: stage.leads.filter((lead) =>
        lead.title.toLowerCase().includes(normalizedSearch),
      ),
    }))
  }, [board?.stages, searchTerm])

  function handleMoveLead(leadId: string, stageId: string) {
    const currentLead = board?.stages
      .flatMap((stage) => stage.leads)
      .find((lead) => lead.id === leadId)

    if (!currentLead || currentLead.stageId === stageId) {
      return
    }

    moveLeadStageMutation.mutate({ leadId, stageId })
  }

  function handleDropLead(stageId: string) {
    if (!draggedLead) {
      return
    }

    handleMoveLead(draggedLead.id, stageId)
    setDraggedLead(null)
  }

  const errorMessage =
    boardQuery.error instanceof Error
      ? boardQuery.error.message
      : 'Unable to load the pipeline.'

  if (boardQuery.isLoading) {
    return (
      <section className="grid min-h-[calc(100svh-66px)] place-items-center px-6">
        <p className="text-sm font-semibold text-[#42526b]">Loading leads</p>
      </section>
    )
  }

  if (boardQuery.isError) {
    return (
      <section className="grid min-h-[calc(100svh-66px)] place-items-center px-6">
        <div className="max-w-md rounded-lg border border-[#d8e0ea] bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-[750] text-[#172033]">Leads</h1>
          <p className="mt-2 text-sm text-[#42526b]">{errorMessage}</p>
          <Button
            type="button"
            onClick={() => void boardQuery.refetch()}
            className="mt-4 bg-sky-600 text-white hover:bg-sky-700"
          >
            Retry
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="min-h-[calc(100svh-66px)] bg-[#f4f7fb]">
      <PipelineToolbar
        pipelineName={board?.pipeline.name}
        stages={board?.stages ?? []}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <div className="overflow-x-auto px-4 py-4 md:px-6">
        <div className="flex min-w-max gap-3 pb-3">
          {filteredStages.map((stage) => (
            <PipelineStageColumn
              key={stage.id}
              stage={stage}
              allStages={board?.stages ?? []}
              draggedLeadId={draggedLead?.id}
              movingLeadId={movingLeadId}
              onDragStart={setDraggedLead}
              onDropLead={handleDropLead}
              onMoveLead={handleMoveLead}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export { LeadsPage }
