import {
  Building2,
  Gauge,
  LogOut,
  Moon,
  Plus,
  Search,
  SquareKanban,
  UsersRound,
} from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { clearStoredAuthToken } from '@/shared/auth/authTokenStorage'
import { ClientFlowLogo } from '@/shared/brand/ClientFlowLogo'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: Gauge },
  { label: 'Leads', href: '/leads', icon: SquareKanban },
  { label: 'Contacts', href: '/contacts', icon: UsersRound },
  { label: 'Companies', href: '/companies', icon: Building2 },
]

function CrmLayout() {
  const navigate = useNavigate()

  function handleSignOut() {
    clearStoredAuthToken()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-svh bg-[#f4f7fb] text-[#172033]">
      <header className="sticky top-0 z-30 border-b border-[#d8e0ea] bg-white">
        <div className="flex h-[66px] items-center gap-4 px-4 md:px-6">
          <ClientFlowLogo className="w-[180px]" />

          <div className="mx-auto hidden h-10 w-full max-w-[620px] items-center gap-2 rounded-full border border-[#d8e0ea] bg-white px-4 text-[#66748a] shadow-sm md:flex">
            <Search className="size-5" aria-hidden="true" />
            <span className="text-sm">Mega Search</span>
          </div>

          <Button
            type="button"
            size="icon"
            className="hidden rounded-full bg-sky-600 text-white hover:bg-sky-700 md:inline-flex"
            title="Quick create"
            aria-label="Quick create"
          >
            <Plus className="size-5" aria-hidden="true" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="ml-auto rounded-full text-[#172033] md:ml-0"
            title="Theme"
            aria-label="Theme"
          >
            <Moon className="size-5" aria-hidden="true" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="rounded-full text-[#172033]"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="size-5" aria-hidden="true" />
          </Button>

          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#ec62b2] text-sm font-bold text-white">
            E
          </div>
        </div>
      </header>

      <div className="grid min-h-[calc(100svh-66px)] grid-cols-1 md:grid-cols-[72px_minmax(0,1fr)]">
        <aside className="sticky top-[66px] z-20 hidden h-[calc(100svh-66px)] border-r border-[#d8e0ea] bg-white py-4 md:block">
          <nav className="flex flex-col items-center gap-3" aria-label="Primary">
            {navItems.map((item) => {
              const Icon = item.icon

              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) =>
                    [
                      'grid size-10 place-items-center rounded-lg transition',
                      isActive
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'text-[#172033] hover:bg-[#eef6fd] hover:text-sky-700',
                    ].join(' ')
                  }
                  title={item.label}
                  aria-label={item.label}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </NavLink>
              )
            })}
          </nav>
        </aside>

        <main className="min-w-0">
          <div className="mx-auto min-h-[calc(100svh-66px)] max-w-[1920px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export { CrmLayout }
