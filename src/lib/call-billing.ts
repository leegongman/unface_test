export const CALL_TOKEN_FREE_SECONDS = 5

export function hasReachedCallTokenThreshold(durationSec: number) {
  return Math.max(0, durationSec) >= CALL_TOKEN_FREE_SECONDS
}

export function getChargeableCallDurationSec(durationSec: number) {
  return Math.max(0, durationSec - CALL_TOKEN_FREE_SECONDS)
}
