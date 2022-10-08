"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envSwitchPlugin = void 0;
const vite_1 = require("vite");
const path_1 = require("path");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const dotenv = require('dotenv');
// 获取环境变量
function loadEnv(path, mode) {
    const basePath = (0, path_1.resolve)(path, `.env${mode ? `.${mode}` : ``}`);
    const localPath = `${basePath}.local`;
    const load = (envPath) => {
        const env = dotenv.config({ path: envPath, debug: process.env.DEBUG });
        process.env = Object.assign(Object.assign({}, process.env), env.parsed);
    };
    load(localPath);
    load(basePath);
}
const envSwitchPlugin = (pluginConfig) => {
    const { beforeRestart, eventName = 'env-switch', root, wsProtocol = 'vite-hmr', wsPath, envs = [], } = pluginConfig;
    let initMode = '';
    return {
        enforce: 'post',
        name: 'vite:env-switch',
        apply: 'serve',
        configureServer(server) {
            const { ws, config } = server;
            initMode = config.mode;
            ws.on(eventName, async (data) => {
                const { env } = data;
                const newServer = await (0, vite_1.createServer)(Object.assign({}, Object.assign({}, config.inlineConfig), { mode: env }));
                newServer.config.server.open = false;
                await server.close();
                // 重新获取环境变量
                loadEnv(root, env);
                // 兼容 process
                newServer.config.define['process.env'] = process.env;
                if (beforeRestart) {
                    await beforeRestart(server, newServer);
                }
                newServer.listen();
            });
        },
        transformIndexHtml: {
            transform(html) {
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
                                return `<button class="env-btn" data-env="${env}">${env.slice(0, 3)}</button>`;
                            })
                                .join('\n')}
              `,
                        },
                        {
                            tag: 'style',
                            injectTo: 'head',
                            children: envs.length
                                ? `
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
              `
                                : '',
                        },
                    ],
                };
            },
        },
    };
};
exports.envSwitchPlugin = envSwitchPlugin;
