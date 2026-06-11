import { useQuery } from '@tanstack/react-query'

import { listCompanies } from '../api/companiesApi'
import type { CompanyListParams } from '../types/companyTypes'

function companiesQueryKey(params: CompanyListParams) {
  return ['companies', params] as const
}

function useCompanies(params: CompanyListParams) {
  return useQuery({
    queryKey: companiesQueryKey(params),
    queryFn: () => listCompanies(params),
  })
}

export { companiesQueryKey, useCompanies }
