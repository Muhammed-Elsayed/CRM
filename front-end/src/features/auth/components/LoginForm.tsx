import { useState } from 'react'
import type { FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { CardContent, CardFooter } from '@/components/ui/card'

import { LoginFeedback } from './LoginFeedback'
import { LoginPasswordField } from './LoginPasswordField'
import { LoginTextField } from './LoginTextField'
import { useSignIn } from '../hooks/useSignIn'
import type { SignInInput } from '../types'

function LoginForm() {
  const [successMessage, setSuccessMessage] = useState('')
  const signInMutation = useSignIn()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
          <LoginTextField
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            label="Email Address *"
            placeholder="admin@example.com"
            disabled={signInMutation.isPending}
            isInvalid={signInMutation.isError}
          />

          <LoginPasswordField
            disabled={signInMutation.isPending}
            isInvalid={signInMutation.isError}
          />

          <LoginFeedback
            errorMessage={errorMessage}
            isError={signInMutation.isError}
            successMessage={successMessage}
          />
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
