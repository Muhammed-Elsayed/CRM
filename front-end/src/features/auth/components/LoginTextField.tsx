import { Input } from '@/components/ui/input'

type LoginTextFieldProps = {
  autoComplete: string
  disabled: boolean
  id: string
  isInvalid: boolean
  label: string
  name: string
  placeholder: string
  type: 'email' | 'text'
}

function LoginTextField({
  autoComplete,
  disabled,
  id,
  isInvalid,
  label,
  name,
  placeholder,
  type,
}: LoginTextFieldProps) {
  return (
    <label
      className="grid gap-[7px] text-sm leading-tight text-[#26344d]"
      htmlFor={id}
    >
      <span>{label}</span>
      <Input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={isInvalid}
        className="h-[39px] rounded-[5px] border-[#d8e0ea] bg-white pr-2.5 text-sm text-[#172033] focus-visible:border-teal-500 focus-visible:ring-teal-500/20"
      />
    </label>
  )
}

export { LoginTextField }
