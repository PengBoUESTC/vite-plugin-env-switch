"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envSwitchPlugin = void 0;
const vite_1 = require("vite");
const path_1 = require("path");
const dotenv = require('dotenv');
// 获取环境变量
function loadEnv(path, mode) {
    const basePath = (0, path_1.resolve)(path, `.env${mode ? `.${mode}` : ``}`);
    const localPath = `${basePath}.local`;
    const load = envPath => {
        const env = dotenv.config({ path: envPath, debug: process.env.DEBUG });
        process.env = Object.assign(Object.assign({}, process.env), env.parsed);
    };
    load(localPath);
    load(basePath);
}
const envSwitchPlugin = (pluginConfig) => {
    const { beforeRestart, eventName = 'env-switch', root } = pluginConfig;
    return {
        enforce: 'post',
        name: 'vite:env-switch',
        configureServer(server) {
            const { ws, config } = server;
            ws.on(eventName, async (data) => {
                const { env } = data;
                const newServer = await (0, vite_1.createServer)(Object.assign({}, Object.assign({}, config.inlineConfig), { mode: env }));
                newServer.config.server.open = false;
                await server.close();
                // 重新获取环境变量
                loadEnv(root, env);
                // 兼容 process
                // @ts-ignore
                newServer.config.define['process.env'] = process.env;
                if (beforeRestart) {
                    await beforeRestart(server, newServer);
                }
                newServer.listen();
            });
        },
    };
};
exports.envSwitchPlugin = envSwitchPlugin;
