import { useId } from 'react'

import { cn } from '@/lib/utils'

type ClientFlowLogoProps = {
  className?: string
  markOnly?: boolean
}

function ClientFlowLogo({ className, markOnly = false }: ClientFlowLogoProps) {
  const gradientId = useId()

  return (
    <div
      className={cn('inline-flex items-center gap-2.5 text-slate-900', className)}
      aria-label="ClientFlow CRM"
    >
      <svg
        className="size-[42px] shrink-0"
        viewBox="0 0 48 48"
        role="img"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="7" y1="40" x2="41" y2="8">
            <stop stopColor="#0f766e" />
            <stop offset="1" stopColor="#0284c7" />
          </linearGradient>
        </defs>
        <path
          d="M31.9 9.8c-3.1-1.6-6.7-2.2-10.2-1.6C13.2 9.6 7 16.8 7 25.5 7 34.1 13.8 41 22.4 41c4.6 0 8.8-2 11.8-5.2"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeLinecap="round"
          strokeWidth="6"
        />
        <path
          d="M20 25h17.5M29 16l8.5 9L29 34"
          fill="none"
          stroke="#0f172a"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="5"
        />
        <circle cx="34" cy="11" r="4.5" fill="#14b8a6" />
        <circle cx="39" cy="25" r="4.5" fill="#38bdf8" />
        <circle cx="34" cy="37" r="4.5" fill="#0f766e" />
      </svg>

      {!markOnly && (
        <span className="text-[22px] leading-none font-[750] tracking-normal">
          Client<span className="text-teal-700">Flow</span>
        </span>
      )}
    </div>
  )
}

export { ClientFlowLogo }
