import { PluginOption, ViteDevServer, createServer } from 'vite';

export interface PluginConfig {
  root: string; // __dirname
  envs: string[];
  wsPath: string;
  eventName?: string;
  wsProtocol?: string;
  beforeRestart?: (server, newServer) => void;
}

export const envSwitchPlugin = (pluginConfig: PluginConfig): PluginOption => {
  const {
    beforeRestart,
    eventName = 'env-switch',
    wsProtocol = 'vite-hmr',
    wsPath,
    envs = [],
  } = pluginConfig;
  let initMode = '';

  return {
    enforce: 'post',
    name: 'vite:env-switch',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
      const { ws, config } = server;

      initMode = config.mode;

      ws.on(eventName, async (data) => {
        const { env } = data;

        const newServer = await createServer(
          Object.assign({}, { ...config.inlineConfig }, { mode: env }),
        );
        newServer.config.server.open = false;
        await server.close();
        if (beforeRestart) {
          await beforeRestart(server, newServer);
        }
        newServer.listen();
      });
    },

    transformIndexHtml: {
      transform(html: string) {
        return {
          html,
          tags: [
            {
              tag: 'script',
              injectTo: 'body',
              children: wsPath
                ? `
              const ws = new WebSocket('${wsPath}', '${wsProtocol}')
              const btns = document.querySelectorAll('.env-btn')
              function activeBtn(dom) {
                curBtn && curBtn.setAttribute('style', "background-color: pink")
                dom.setAttribute('style', "background-color: #C3E88D")
                curBtn = dom
              }
              let curBtn 
              function handleEnv(env, dom) {
                activeBtn(dom)
                ws.send(JSON.stringify({ type: 'custom', event: '${eventName}', data: { env } }))
              }
              btns.forEach(dom => {
                const { dataset } = dom
                if('${initMode}' == dataset.env) {
                  activeBtn(dom)
                }
                dom.addEventListener('click', () => handleEnv(dataset.env, dom))
              })
              `
                : '',
            },
            {
              tag: 'div',
              injectTo: 'body-prepend',
              attrs: {
                class: 'env-btn-wrapper',
              },
              children: `
                ${envs
                  .map((env) => {
                    return `<button class="env-btn" data-env="${env}">${env.slice(
                      0,
                      3,
                    )}</button>`;
                  })
                  .join('\n')}
              `,
            },
            {
              tag: 'style',
              injectTo: 'head',
              children: envs.length
                ? `
                .env-btn-wrapper .env-btn {
                  background-color: pink;
                  color: red;
                  border-radius: 4px;
                  box-shadow: 2px 2px 2px black;
                }
                .env-btn-wrapper {
                  position: fixed;
                  bottom: 0.7rem;
                  right: 0.2rem;
                  z-index: 100000;
                }
              `
                : '',
            },
          ],
        };
      },
    },
  };
};
