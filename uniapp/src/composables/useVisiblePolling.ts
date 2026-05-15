import { onHide, onShow, onUnload } from '@dcloudio/uni-app'

interface UseVisiblePollingOptions {
  interval?: number
  immediate?: boolean
}

export function useVisiblePolling(
  task: () => Promise<void> | void,
  options: UseVisiblePollingOptions = {},
) {
  const interval = options.interval ?? 8000
  let timer: ReturnType<typeof setInterval> | null = null
  let running = false

  async function run() {
    if (running) {
      return
    }

    running = true
    try {
      await task()
    } finally {
      running = false
    }
  }

  function start() {
    if (timer) {
      return
    }

    if (options.immediate) {
      void run()
    }

    timer = setInterval(() => {
      void run()
    }, interval)
  }

  function stop() {
    if (!timer) {
      return
    }

    clearInterval(timer)
    timer = null
  }

  onShow(start)
  onHide(stop)
  onUnload(stop)

  return {
    start,
    stop,
    run,
  }
}
