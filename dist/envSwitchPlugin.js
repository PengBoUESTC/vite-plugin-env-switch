"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envSwitchPlugin = void 0;
const vite_1 = require("vite");
const fs_1 = require("fs");
const path_1 = require("path");
const script_1 = require("./script");
const cssStr = (0, fs_1.readFileSync)((0, path_1.resolve)(__dirname, '../src/css.css'));
const envSwitchPlugin = (pluginConfig) => {
    const { beforeRestart, eventName = 'env-switch', wsProtocol = 'vite-hmr', wsPath, envs = [], extraClass = '', } = pluginConfig;
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
                const init = ${script_1.default.toString()};
                init('${wsPath}', '${wsProtocol}', '${initMode}', '${eventName}');
              `
                                : '',
                        },
                        {
                            tag: 'div',
                            injectTo: 'body-prepend',
                            attrs: {
                                class: [extraClass, 'env-btn-wrapper']
                                    .filter((cls) => !!cls)
                                    .join(' '),
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
                            children: envs.length ? `${cssStr}` : '',
                        },
                    ],
                };
            },
        },
    };
};
exports.envSwitchPlugin = envSwitchPlugin;
