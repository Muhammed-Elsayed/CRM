import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  deleteContact,
  getContact,
  updateContact,
} from '../api/contactsApi'
import type { UpdateContactInput } from '../types/contactTypes'

function useContactDetails(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ['contacts', id],
    queryFn: () => getContact(id),
    enabled,
  })
}

function useUpdateContact(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateContactInput) => updateContact(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['contacts'] })
      void queryClient.invalidateQueries({ queryKey: ['pipeline-board'] })
    },
  })
}

function useDeleteContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteContact,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['contacts'] })
      void queryClient.invalidateQueries({ queryKey: ['pipeline-board'] })
    },
  })
}

export { useContactDetails, useDeleteContact, useUpdateContact }
