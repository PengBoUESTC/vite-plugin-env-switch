"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envSwitchPlugin = void 0;
const vite_1 = require("vite");
const fs_1 = require("fs");
const path_1 = require("path");
const bindMoveStr = (0, fs_1.readFileSync)((0, path_1.resolve)(__dirname, './bindmove.js'));
const scriptStr = (0, fs_1.readFileSync)((0, path_1.resolve)(__dirname, './script.js'));
const cssStr = (0, fs_1.readFileSync)((0, path_1.resolve)(__dirname, '../src/css.css'));
const envSwitchPlugin = (pluginConfig) => {
    const { beforeRestart, eventName = 'env-switch', wsProtocol = 'vite-hmr', wsPath, envs = [], } = pluginConfig;
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
