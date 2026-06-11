import { ChevronLeft, ChevronRight, ListFilter, Search } from 'lucide-react'
import type { FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type EntityTableToolbarProps = {
  searchValue: string
  page: number
  perPage: number
  total: number
  totalPages: number
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
  onSearchChange: (value: string) => void
  onSearchSubmit: () => void
}

function EntityTableToolbar({
  searchValue,
  page,
  perPage,
  total,
  totalPages,
  onPageChange,
  onPerPageChange,
  onSearchChange,
  onSearchSubmit,
}: EntityTableToolbarProps) {
  const firstItem = total === 0 ? 0 : (page - 1) * perPage + 1
  const lastItem = Math.min(page * perPage, total)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSearchSubmit()
  }

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-[#d8e0ea] bg-white px-4 py-4">
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-2">
        <label className="relative w-[280px] max-w-full">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-[#42526b]"
            aria-hidden="true"
          />
          <Input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search"
            className="h-10 rounded-md bg-white pl-10"
          />
        </label>

        <Button
          type="submit"
          variant="secondary"
          className="h-10 rounded-md bg-[#dff1fc] px-4 font-bold text-sky-700 hover:bg-[#cae8fa]"
        >
          <ListFilter className="size-4" aria-hidden="true" />
          Filter
        </Button>
      </form>

      <div className="ml-auto flex flex-wrap items-center gap-3 text-sm text-[#42526b]">
        <label className="flex items-center gap-2">
          Per Page
          <select
            value={perPage}
            onChange={(event) => onPerPageChange(Number(event.target.value))}
            className="h-10 rounded-md border border-[#d8e0ea] bg-white px-3 text-[#172033] outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          >
            {[10, 20, 50].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <span className="min-w-[88px] text-right">
          {firstItem} - {lastItem} of {total}
        </span>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-full"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-full"
          disabled={page >= totalPages || totalPages === 0}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="size-5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}

export { EntityTableToolbar }
