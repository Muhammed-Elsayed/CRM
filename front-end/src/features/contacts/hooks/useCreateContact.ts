import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createContact } from '../api/contactsApi'

function useCreateContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createContact,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}

export { useCreateContact }
