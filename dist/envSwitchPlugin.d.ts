import { PluginOption } from 'vite';
export interface PluginConfig {
    eventName?: string;
    beforeRestart?: (server: any, newServer: any) => void;
}
export declare const envSwitchPlugin: (pluginConfig: PluginConfig) => PluginOption;
