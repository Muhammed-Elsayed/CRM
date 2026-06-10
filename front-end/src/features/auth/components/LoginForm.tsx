import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

import { useSignIn } from '../hooks/useSignIn'
import type { SignInInput } from '../types'

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const signInMutation = useSignIn()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const input: SignInInput = {
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
    }

    setSuccessMessage('')
    signInMutation.mutate(input, {
      onSuccess: (result) => {
        setSuccessMessage(`Welcome back, ${result.user.name}.`)
      },
    })
  }

  const errorMessage =
    signInMutation.error instanceof Error
      ? signInMutation.error.message
      : 'Unable to sign in. Please try again.'

  return (
    <form onSubmit={handleSubmit} className="contents">
      <CardContent className="px-4 pt-[18px] pb-8">
        <div className="grid gap-[18px]">
          <label
            className="grid gap-[7px] text-sm leading-tight text-[#26344d]"
            htmlFor="email"
          >
            <span>Email Address *</span>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="admin@example.com"
              disabled={signInMutation.isPending}
              aria-invalid={signInMutation.isError}
              className="h-[39px] rounded-[5px] border-[#d8e0ea] bg-white pr-2.5 text-sm text-[#172033] focus-visible:border-teal-500 focus-visible:ring-teal-500/20"
            />
          </label>

          <label
            className="grid gap-[7px] text-sm leading-tight text-[#26344d]"
            htmlFor="password"
          >
            <span>Password *</span>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Password"
                disabled={signInMutation.isPending}
                aria-invalid={signInMutation.isError}
                className="h-[39px] rounded-[5px] border-[#d8e0ea] bg-white pr-10 text-sm text-[#172033] focus-visible:border-teal-500 focus-visible:ring-teal-500/20"
              />
              <Button
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute top-1/2 right-1 size-8 -translate-y-1/2 text-[#314158] hover:bg-[#eef7f8] hover:text-teal-700"
                disabled={signInMutation.isPending}
                onClick={() => setShowPassword((visible) => !visible)}
                size="icon"
                type="button"
                variant="ghost"
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </Button>
            </div>
          </label>

          {signInMutation.isError ? (
            <p
              className="rounded-[5px] border border-red-200 bg-red-50 px-3 py-2 text-sm leading-snug text-red-700"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}

          {successMessage ? (
            <p className="rounded-[5px] border border-teal-200 bg-teal-50 px-3 py-2 text-sm leading-snug text-teal-700">
              {successMessage}
            </p>
          ) : null}
        </div>
      </CardContent>

      <CardFooter className="justify-between gap-4 border-t border-[#e8edf3] bg-[#fbfcfe] px-4 pt-[15px] pb-4">
        <a
          href="#forgot-password"
          className="text-sm font-semibold text-sky-600 no-underline hover:underline"
        >
          Forget Password ?
        </a>
        <Button
          className="h-[34px] min-w-[70px] rounded-[5px] bg-sky-600 font-bold text-white hover:bg-sky-700"
          disabled={signInMutation.isPending}
          type="submit"
        >
          {signInMutation.isPending ? 'Signing In' : 'Sign In'}
        </Button>
      </CardFooter>
    </form>
  )
}

export { LoginForm }
