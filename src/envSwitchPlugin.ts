import { PluginOption, ViteDevServer, createServer } from 'vite';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import init from './script';

export interface PluginConfig {
  root: string; // __dirname
  envs: string[];
  wsPath: string;
  eventName?: string;
  wsProtocol?: string;
  extraClass?: string;
  beforeRestart?: (server, newServer) => void;
}

const cssStr = readFileSync(resolve(__dirname, '../src/css.css'));

export const envSwitchPlugin = (pluginConfig: PluginConfig): PluginOption => {
  const {
    beforeRestart,
    eventName = 'env-switch',
    wsProtocol = 'vite-hmr',
    wsPath,
    envs = [],
    extraClass = '',
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
                const init = ${init.toString()};
                init('${wsPath}', '${wsProtocol}', '${initMode}', '${eventName}');
              `
                : '',
            },
            {
              tag: 'div',
              injectTo: 'body-prepend',
              attrs: {
                class: `${extraClass} env-btn-wrapper`,
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
              children: envs.length ? `${cssStr}` : '',
            },
          ],
        };
      },
    },
  };
};
