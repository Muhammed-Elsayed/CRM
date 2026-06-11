import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createCompany } from '../api/companiesApi'

function useCreateCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createCompany,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })
}

export { useCreateCompany }
