import { useMutation, useQueryClient } from '@tanstack/react-query'

import { deleteLead, updateLead } from '../api/pipelineApi'
import type { UpdateLeadInput } from '../types/pipelineTypes'
import { pipelineBoardQueryKey } from './usePipelineBoard'

function useUpdateLead(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateLeadInput) => updateLead(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pipelineBoardQueryKey })
    },
  })
}

function useDeleteLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteLead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pipelineBoardQueryKey })
    },
  })
}

export { useDeleteLead, useUpdateLead }
