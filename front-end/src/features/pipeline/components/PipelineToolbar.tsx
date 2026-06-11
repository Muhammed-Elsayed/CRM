import { LayoutGrid, ListFilter, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import type { BoardStage } from '../types/pipelineTypes'
import { CreateLeadDialog } from './CreateLeadDialog'

type PipelineToolbarProps = {
  pipelineName?: string
  searchTerm: string
  stages: BoardStage[]
  onSearchChange: (value: string) => void
}

function PipelineToolbar({
  pipelineName,
  searchTerm,
  stages,
  onSearchChange,
}: PipelineToolbarProps) {
  return (
    <div className="border-b border-[#d8e0ea] bg-white">
      <div className="flex min-h-[58px] flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
        <h1 className="text-2xl font-[750] text-[#172033]">Leads</h1>
        <CreateLeadDialog firstStage={stages[0]} />
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-[#f4f7fb] px-4 py-4 md:px-6">
        <label className="relative w-full max-w-[310px]">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-[#42526b]"
            aria-hidden="true"
          />
          <Input
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by Title"
            className="h-10 rounded-md bg-white pl-10"
          />
        </label>

        <Button
          type="button"
          variant="secondary"
          className="h-10 rounded-md bg-[#dff1fc] px-4 font-bold text-sky-700 hover:bg-[#cae8fa]"
        >
          <ListFilter className="size-4" aria-hidden="true" />
          Filter
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-md border-[#d8e0ea] bg-white px-4 text-[#42526b]"
          >
            {pipelineName ?? 'Default Pipeline'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-md border-[#d8e0ea] bg-white"
            title="Board view"
            aria-label="Board view"
          >
            <LayoutGrid className="size-5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export { PipelineToolbar }
