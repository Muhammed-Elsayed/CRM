import { useQuery } from '@tanstack/react-query'

import { listCompanies, listContacts } from '../api/pipelineApi'

function useLeadLookups() {
  const companiesQuery = useQuery({
    queryKey: ['companies', 'lead-lookups'],
    queryFn: listCompanies,
  })

  const contactsQuery = useQuery({
    queryKey: ['contacts', 'lead-lookups'],
    queryFn: listContacts,
  })

  return { companiesQuery, contactsQuery }
}

export { useLeadLookups }
