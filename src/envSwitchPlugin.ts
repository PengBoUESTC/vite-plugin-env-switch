import { PluginOption, ViteDevServer, createServer } from 'vite'
import { resolve } from 'path'
const dotenv = require('dotenv')

export interface PluginConfig {
  root: string; // __dirname
  envs: string[];
  wsPath: string
  eventName?: string
  wsProtocol?: string
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
  const { beforeRestart, eventName = 'env-switch', root, wsProtocol = 'vite-hmr', wsPath, envs = [] } = pluginConfig
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

    transformIndexHtml: {
      transform(html: string) {
        return {
          html,
          tags: [
            {
              tag: 'script',
              injectTo: 'body',
              children: wsPath ? '' : `
              const ws = new WebSocket('${wsPath}', '${wsProtocol}')
              function handleEnv(env) {
                ws.send(JSON.stringify({ type: 'custom', event: '${eventName}', data: { env } }))
              }
              document.querySelectorAll('.env-btn').forEach(dom => {
                const { dataset } = dom

                dom.addEventListener('click', () => handleEnv(dataset.env))
              })
              `
            },
            {
              tag: 'div',
              injectTo: 'body-prepend',
              attrs: {
                class: 'env-btn-wrapper'
              },
              children: `
                ${envs.map(env => {
                  return `<button class="env-btn" data-env="${env}">${env.slice(0,3)}</button>`
                }).join('\n')}
              `
            },
            {
              tag: 'style',
              injectTo: 'head',
              children: envs.length ? `
                .env-btn-wrapper .env-btn{
                  background-color: pink;
                  color: red;
                  border-radius: 4px;
                  box-shadow: 2px 2px 2px black;
                }
                .env-btn-wrapper {
                  position: fixed;
                  bottom: 0.7rem;
                  right: 0.2rem;
                }
              ` : ''
            }
          ]
        }
      }
    }
  }
}