import { PluginOption } from 'vite';
export interface PluginConfig {
    root: string;
    eventName?: string;
    beforeRestart?: (server: any, newServer: any) => void;
}
export declare const envSwitchPlugin: (pluginConfig: PluginConfig) => PluginOption;
