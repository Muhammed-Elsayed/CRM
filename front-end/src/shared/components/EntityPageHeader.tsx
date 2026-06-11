import type { ReactNode } from 'react'

type EntityPageHeaderProps = {
  breadcrumbs: string[]
  title: string
  actions?: ReactNode
}

function EntityPageHeader({
  breadcrumbs,
  title,
  actions,
}: EntityPageHeaderProps) {
  return (
    <header className="rounded-lg border border-[#d8e0ea] bg-white px-4 py-4 shadow-sm md:px-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <nav className="mb-3 flex flex-wrap items-center gap-1 text-sm font-semibold">
            {breadcrumbs.map((crumb, index) => (
              <span
                key={`${crumb}-${index}`}
                className={
                  index === breadcrumbs.length - 1
                    ? 'text-[#42526b]'
                    : 'text-sky-600'
                }
              >
                {crumb}
                {index < breadcrumbs.length - 1 ? (
                  <span className="ml-1 text-[#42526b]">/</span>
                ) : null}
              </span>
            ))}
          </nav>
          <h1 className="truncate text-2xl font-[750] text-[#172033]">
            {title}
          </h1>
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-3">{actions}</div>
        ) : null}
      </div>
    </header>
  )
}

export { EntityPageHeader }
