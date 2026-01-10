import type { Plugin } from 'vite'
import { spawn, fork, ChildProcess } from 'node:child_process'
import chokidar from 'chokidar'
import path from 'node:path'

interface ExternalServiceOptions {
  mode?: 'fork' | 'spawn'
  command: string
  args?: string[]
  cwd?: string
  env?: Record<string, string>

  /**
   * dev | build | preview | all
   */
  when?: 'dev' | 'build' | 'preview' | 'all'

  /**
   * 文件变化自动重启
   */
  watch?: string | string[]

  /**
   * fork 专用
   */
  execArgv?: string[]

  /**
   * 重启防抖(ms)
   */
  restartDelay?: number
}

export default function externalService(
  options: ExternalServiceOptions
): Plugin {
  let child: ChildProcess | null = null
  let restarting = false
  let exiting = false
  let restartTimer: NodeJS.Timeout | null = null

  const mode = options.mode ?? 'spawn'
  const restartDelay = options.restartDelay ?? 200

  /* ------------------ process control ------------------ */

  function start() {
    if (child || exiting) return

    if (mode === 'fork') {
      child = fork(
        path.resolve(options.command),
        options.args ?? [],
        {
          cwd: options.cwd,
          env: {
            ...process.env,
            ...options.env,
          },
          execArgv: options.execArgv,
          stdio: 'inherit',
        }
      )
    } else {
      child = spawn(options.command, options.args ?? [], {
        cwd: options.cwd,
        env: {
          ...process.env,
          ...options.env,
        },
        shell: true,
        stdio: 'inherit',
      })
    }

    console.log(`[external-service] started (${mode})`)

    child.on('exit', (code, signal) => {
      if (!restarting && !exiting) {
        console.log('[external-service] exited:', code, signal)
      }
      child = null
    })
  }

  function stop() {
    if (!child) return

    restarting = true

    if (mode === 'fork' && child.send) {
      // 给子进程一个优雅退出机会
      child.send({ type: 'shutdown' })
    }

    // 给一点时间处理 graceful shutdown
    setTimeout(() => {
      try {
        child?.kill('SIGTERM')
      } catch {}
      child = null
      restarting = false
    }, 100)
  }

  function restart() {
    if (exiting) return
    if (restartTimer) clearTimeout(restartTimer)

    restartTimer = setTimeout(() => {
      console.log('[external-service] restarting...')
      stop()
      start()
    }, restartDelay)
  }

  /* ------------------ watcher ------------------ */

  function setupWatcher() {
    if (!options.watch) return

    const watcher = chokidar.watch(options.watch, {
      ignoreInitial: true,
    })

    watcher.on('all', () => restart())
  }

  /* ------------------ shutdown handling ------------------ */

  function shutdown() {
    if (exiting) return
    exiting = true

    console.log('[external-service] shutting down...')
    stop()

    // ⚠️ 这里必须显式退出
    process.exit(0)
  }

  /* ------------------ vite plugin ------------------ */

  return {
    name: 'vite-plugin-external-service',

    apply(_, env) {
      if (options.when === 'all') return true
      if (options.when === 'build') return env.command === 'build'
      if (options.when === 'preview') return env.command === 'preview'
      return env.command === 'serve'
    },

    configureServer() {
      start()
      setupWatcher()

      // 关键：我们接管 SIGINT / SIGTERM
      process.on('SIGINT', shutdown)
      process.on('SIGTERM', shutdown)

      // exit 只用于兜底清理，不阻止退出
      process.on('exit', () => {
        exiting = true
        stop()
      })
    },

    closeBundle() {
      exiting = true
      stop()
    },
  }
}
