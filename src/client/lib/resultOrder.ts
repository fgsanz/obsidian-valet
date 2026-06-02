export type ResultStatus = 'failed' | 'not-applied' | 'success'

export const RESULT_ORDER: Record<ResultStatus, number> = {
  failed: 0,
  'not-applied': 1,
  success: 2,
}

export function getResultStatus(
  filePath: string,
  operationSucceeded: boolean,
  operationFailed: boolean,
): ResultStatus {
  if (operationFailed) return 'failed'
  if (operationSucceeded) return 'success'
  return 'not-applied'
}
