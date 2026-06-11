import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createLead } from '../api/pipelineApi'
import { pipelineBoardQueryKey } from './usePipelineBoard'

function useCreateLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createLead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pipelineBoardQueryKey })
    },
  })
}

export { useCreateLead }
