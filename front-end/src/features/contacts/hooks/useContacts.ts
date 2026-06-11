import { useQuery } from '@tanstack/react-query'

import { listContacts } from '../api/contactsApi'
import type { ContactListParams } from '../types/contactTypes'

function contactsQueryKey(params: ContactListParams) {
  return ['contacts', params] as const
}

function useContacts(params: ContactListParams) {
  return useQuery({
    queryKey: contactsQueryKey(params),
    queryFn: () => listContacts(params),
  })
}

export { contactsQueryKey, useContacts }
