import { useMutation, useQueryClient } from '@tanstack/react-query'

import { moveLeadStage } from '../api/pipelineApi'
import { pipelineBoardQueryKey } from './usePipelineBoard'

function useMoveLeadStage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: moveLeadStage,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pipelineBoardQueryKey })
    },
  })
}

export { useMoveLeadStage }
