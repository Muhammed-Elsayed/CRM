import { useQuery } from '@tanstack/react-query'

import { getPipelineBoard } from '../api/pipelineApi'

const pipelineBoardQueryKey = ['pipeline-board'] as const

function usePipelineBoard() {
  return useQuery({
    queryKey: pipelineBoardQueryKey,
    queryFn: getPipelineBoard,
  })
}

export { pipelineBoardQueryKey, usePipelineBoard }
