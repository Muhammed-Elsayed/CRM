import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  deleteCompany,
  getCompany,
  updateCompany,
} from '../api/companiesApi'
import type { UpdateCompanyInput } from '../types/companyTypes'

function useCompanyDetails(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ['companies', id],
    queryFn: () => getCompany(id),
    enabled,
  })
}

function useUpdateCompany(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateCompanyInput) => updateCompany(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })
}

function useDeleteCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteCompany,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['companies'] })
      void queryClient.invalidateQueries({ queryKey: ['contacts'] })
      void queryClient.invalidateQueries({ queryKey: ['pipeline-board'] })
    },
  })
}

export { useCompanyDetails, useDeleteCompany, useUpdateCompany }
