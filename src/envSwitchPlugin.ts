import { PluginOption, ViteDevServer, createServer } from 'vite'
import { resolve } from 'path'
const dotenv = require('dotenv')

export interface PluginConfig {
  root: string; // __dirname
  eventName?: string
  beforeRestart?: (server, newServer) => void
}

// 获取环境变量
function loadEnv (path, mode) {
  const basePath = resolve(path, `.env${mode ? `.${mode}` : ``}`)
  const localPath = `${basePath}.local`

  const load = envPath => {
    const env = dotenv.config({ path: envPath, debug: process.env.DEBUG })
    process.env = Object.assign({...process.env}, env.parsed)
  }

  load(localPath)
  load(basePath)
}

export const envSwitchPlugin = (pluginConfig: PluginConfig): PluginOption => {
  const { beforeRestart, eventName = 'env-switch', root } = pluginConfig
  return {
    enforce: 'post',
    name: 'vite:env-switch',

    configureServer(server: ViteDevServer) {
      const { ws, config } = server

      ws.on(eventName, async (data) => {
        const { env } = data

        const newServer = await createServer(Object.assign({},{...config.inlineConfig}, { mode: env }))
        newServer.config.server.open = false
        await server.close()
        // 重新获取环境变量
        loadEnv(root, env)
        // 兼容 process
        // @ts-ignore
        newServer.config.define['process.env'] = process.env
        if(beforeRestart) {
          await beforeRestart(server, newServer)
        }
        newServer.listen()
      })
    },
  }
}