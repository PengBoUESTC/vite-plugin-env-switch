import { PluginOption, ViteDevServer, createServer } from 'vite';
import { readFileSync } from 'fs';
import { resolve } from 'path';

export interface PluginConfig {
  root: string; // __dirname
  envs: string[];
  wsPath: string;
  eventName?: string;
  wsProtocol?: string;
  beforeRestart?: (server, newServer) => void;
}

const bindMoveStr = readFileSync(resolve(__dirname, './bindmove.js'));
const scriptStr = readFileSync(resolve(__dirname, './script.js'));
const cssStr = readFileSync(resolve(__dirname, '../src/css.css'));

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
                ${scriptStr};
                init('${wsPath}', '${wsProtocol}', '${initMode}', '${eventName}');
                ${bindMoveStr};
                bindMove('.env-btn-wrapper');
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
              children: envs.length ? `${cssStr}` : '',
            },
          ],
        };
      },
    },
  };
};
