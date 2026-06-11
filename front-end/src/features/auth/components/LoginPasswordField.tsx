import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type LoginPasswordFieldProps = {
  disabled: boolean
  isInvalid: boolean
}

function LoginPasswordField({ disabled, isInvalid }: LoginPasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
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
          disabled={disabled}
          aria-invalid={isInvalid}
          className="h-[39px] rounded-[5px] border-[#d8e0ea] bg-white pr-10 text-sm text-[#172033] focus-visible:border-teal-500 focus-visible:ring-teal-500/20"
        />
        <Button
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          className="absolute top-1/2 right-1 size-8 -translate-y-1/2 text-[#314158] hover:bg-[#eef7f8] hover:text-teal-700"
          disabled={disabled}
          onClick={() => setShowPassword((visible) => !visible)}
          size="icon"
          type="button"
          variant="ghost"
        >
          {showPassword ? <EyeOff /> : <Eye />}
        </Button>
      </div>
    </label>
  )
}

export { LoginPasswordField }
