import { useQuery } from '@tanstack/react-query'

import { listCompanyOptions } from '../api/contactsApi'

function useCompanyOptions() {
  return useQuery({
    queryKey: ['companies', 'contact-options'],
    queryFn: listCompanyOptions,
  })
}

export { useCompanyOptions }
