import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { ClientFlowLogo } from '@/shared/brand/ClientFlowLogo'

import { LoginForm } from './components/LoginForm'

function LoginPage() {
  return (
    <main className="grid min-h-svh place-items-center bg-[#f4f7fb] bg-[radial-gradient(circle_at_50%_100%,rgba(20,184,166,0.16),transparent_28rem)] px-5 py-10 text-[#172033] max-[420px]:items-start max-[420px]:pt-18">
      <section
        className="flex w-full max-w-[304px] flex-col items-center gap-7 max-[420px]:max-w-80"
        aria-labelledby="login-title"
      >
        <ClientFlowLogo />

        <Card className="w-full gap-0 rounded-lg bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
          <CardHeader className="border-b border-[#e8edf3] px-4 pt-[18px] pb-3.5">
            <CardTitle
              id="login-title"
              className="text-[21px] font-[750] text-[#172033]"
            >
              Sign In
            </CardTitle>
          </CardHeader>

          <LoginForm />
        </Card>

        <p className="mt-4 text-sm text-[#42526b]">
          Powered by{' '}
          <a href="/" className="font-semibold text-sky-600 hover:underline">
            ClientFlow
          </a>{' '}
          CRM
        </p>
      </section>
    </main>
  )
}

export { LoginPage }
