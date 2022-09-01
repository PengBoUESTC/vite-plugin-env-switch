import { PluginOption } from 'vite';
export interface PluginConfig {
    root: string;
    envs: string[];
    wsPath: string;
    eventName?: string;
    wsProtocol?: string;
    beforeRestart?: (server: any, newServer: any) => void;
}
export declare const envSwitchPlugin: (pluginConfig: PluginConfig) => PluginOption;
