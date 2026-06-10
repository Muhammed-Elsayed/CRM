import { useMutation } from '@tanstack/react-query'

import { signIn } from '../api/authApi'

function useSignIn() {
  return useMutation({
    mutationFn: signIn,
  })
}

export { useSignIn }
