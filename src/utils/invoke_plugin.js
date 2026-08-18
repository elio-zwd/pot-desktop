import { appCacheDir, appConfigDir, join } from "@tauri-apps/api/path";
import { readBinaryFile, readTextFile } from "@tauri-apps/api/fs";
import { invoke } from "@tauri-apps/api/tauri";
import Database from "tauri-plugin-sql-api";
import { http } from "@tauri-apps/api";
import CryptoJS from "crypto-js";
import { osType } from "./env";
import {
    assertTranslatePluginInfo,
    createPluginInvocationError,
    invokeNestedTranslatePlugin,
} from "./plugin_invocation";

function createManagedDatabase(Database) {
    return {
        async load(path) {
            const database = await Database.load(path);
            return new Proxy(database, {
                get(target, property, receiver) {
                    if (property === 'close') return async () => undefined;
                    const value = Reflect.get(target, property, receiver);
                    return typeof value === 'function' ? value.bind(target) : value;
                },
            });
        },
    };
}

function createPluginRun(pluginType, pluginName) {
    return async function run(cmdName, args) {
        return invoke("run_binary", {
            pluginType,
            pluginName,
            cmdName,
            args,
        });
    };
}

async function loadPlugin(pluginType, pluginName, invocationChain) {
    let configDir = await appConfigDir();
    let cacheDir = await appCacheDir();
    let pluginDir = await join(configDir, "plugins", pluginType, pluginName);
    let entryFile = await join(pluginDir, "main.js");
    let script = await readTextFile(entryFile);
    const run = createPluginRun(pluginType, pluginName);
    const nestedTargetCache = new Map();
    const loadNestedTranslatePlugin = async (targetPluginName, nextInvocationChain) => {
        const cacheKey = `${targetPluginName}:${nextInvocationChain.length}`;
        if (!nestedTargetCache.has(cacheKey)) {
            nestedTargetCache.set(cacheKey, (async () => {
                const targetDir = await join(configDir, "plugins", "translate", targetPluginName);
                const [infoText, targetScript] = await Promise.all([
                    readTextFile(await join(targetDir, "info.json")),
                    readTextFile(await join(targetDir, "main.js")),
                ]);
                let info;
                try {
                    info = JSON.parse(infoText);
                } catch (_) {
                    throw createPluginInvocationError('plugin_invalid');
                }
                assertTranslatePluginInfo(info, targetPluginName);
                const targetUtils = await createPluginUtils({
                    pluginType: 'translate',
                    pluginName: targetPluginName,
                    configDir,
                    cacheDir,
                    pluginDir: targetDir,
                    invocationChain: nextInvocationChain,
                    managedDatabase: true,
                    run: createPluginRun('translate', targetPluginName),
                });
                const translate = eval(`${targetScript} translate`);
                return { info, translate, utils: targetUtils };
            })());
        }
        return nestedTargetCache.get(cacheKey);
    };

    const utils = await createPluginUtils({
        pluginType,
        pluginName,
        configDir,
        cacheDir,
        pluginDir,
        invocationChain,
        managedDatabase: invocationChain.length > 1,
        loadNestedTranslatePlugin,
        run,
    });
    return [eval(`${script} ${pluginType}`), utils];
}

async function createPluginUtils({
    pluginType,
    pluginName,
    configDir,
    cacheDir,
    pluginDir,
    invocationChain,
    managedDatabase,
    loadNestedTranslatePlugin,
    run,
}) {
    const database = managedDatabase ? createManagedDatabase(Database) : Database;
    const utils = {
        tauriFetch: http.fetch,
        http,
        readBinaryFile,
        readTextFile,
        Database: database,
        CryptoJS,
        run,
        cacheDir, // String
        pluginDir, // String
        osType,// "Windows_NT", "Darwin", "Linux"
    };
    if (pluginType === 'translate' && typeof loadNestedTranslatePlugin === 'function') {
        utils.invokeTranslatePlugin = (request) => invokeNestedTranslatePlugin({
            request,
            invocationChain,
            loadTarget: loadNestedTranslatePlugin,
        });
    }
    return utils;
}

export async function invoke_plugin(pluginType, pluginName) {
    return loadPlugin(pluginType, pluginName, [{ pluginType, pluginName }]);
}
