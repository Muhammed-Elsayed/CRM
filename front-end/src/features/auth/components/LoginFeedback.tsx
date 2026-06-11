type LoginFeedbackProps = {
  errorMessage: string
  isError: boolean
  successMessage: string
}

function LoginFeedback({
  errorMessage,
  isError,
  successMessage,
}: LoginFeedbackProps) {
  if (isError) {
    return (
      <p
        className="rounded-[5px] border border-red-200 bg-red-50 px-3 py-2 text-sm leading-snug text-red-700"
        role="alert"
      >
        {errorMessage}
      </p>
    )
  }

  if (successMessage) {
    return (
      <p className="rounded-[5px] border border-teal-200 bg-teal-50 px-3 py-2 text-sm leading-snug text-teal-700">
        {successMessage}
      </p>
    )
  }

  return null
}

export { LoginFeedback }
