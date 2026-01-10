

type SigtermCallback = (signal?: 'SIGTERM', exitCode?: number) => Promise<void>

// Use a shared callback when attaching sigterm listeners to avoid `MaxListenersExceededWarning`
const sigtermCallbacks = new Set<SigtermCallback>()
const parentSigtermCallback: SigtermCallback = async (signal, exitCode) => {
  await Promise.all([...sigtermCallbacks].map((cb) => cb(signal, exitCode)))
}

export const setupSIGTERMListener = (
  callback: (signal?: 'SIGTERM', exitCode?: number) => Promise<void>,
): void => {
  if (sigtermCallbacks.size === 0) {
    process.once('SIGTERM', parentSigtermCallback)
    if (process.env.CI !== 'true') {
      process.stdin.on('end', parentSigtermCallback)
    }
  }
  sigtermCallbacks.add(callback)
}

export const teardownSIGTERMListener = (
  callback: Parameters<typeof setupSIGTERMListener>[0],
): void => {
  sigtermCallbacks.delete(callback)
  if (sigtermCallbacks.size === 0) {
    process.off('SIGTERM', parentSigtermCallback)
    if (process.env.CI !== 'true') {
      process.stdin.off('end', parentSigtermCallback)
    }
  }
}