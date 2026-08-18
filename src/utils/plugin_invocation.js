export const PLUGIN_INVOKE_TRANSLATE_V1 = 'pot.plugin-invoke.translate.v1';
export const ECDICT_PLUGIN_ID = 'plugin.com.pot-app.ecdict';

const PLUGIN_ID_PATTERN = /^plugin\.[a-z0-9](?:[a-z0-9.-]{0,126}[a-z0-9])?$/;
const MAX_TEXT_LENGTH = 500;
const MAX_LANGUAGE_LENGTH = 64;

function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeText(value, maximum) {
    if (typeof value !== 'string') return '';
    const text = value.trim();
    return text.length <= maximum ? text : '';
}

export function createPluginInvocationError(code) {
    const error = new Error(code);
    error.code = code;
    return error;
}

export function normalizeTranslatePluginInvocationRequest(value) {
    if (!isPlainObject(value)) return null;

    const pluginId = normalizeText(value.pluginId, 128);
    const text = normalizeText(value.text, MAX_TEXT_LENGTH);
    const from = normalizeText(value.from, MAX_LANGUAGE_LENGTH);
    const to = normalizeText(value.to, MAX_LANGUAGE_LENGTH);
    if (!PLUGIN_ID_PATTERN.test(pluginId) || pluginId.includes('..') || !text || !from || !to) return null;
    return { pluginId, text, from, to };
}

export function assertTranslatePluginInfo(info, pluginId) {
    if (!isPlainObject(info) || info.id !== pluginId || info.plugin_type !== 'translate') {
        throw createPluginInvocationError('plugin_invalid');
    }
    return info;
}

export function isEcdictNotFoundError(error) {
    if (!(error instanceof Error) && typeof error !== 'string') return false;
    const message = String(error).replace(/\r/g, '').trim();
    return /^Http Request Error\nHttp Status:\s*undefined(?:\nundefined)?$/.test(message);
}

export async function invokeNestedTranslatePlugin({
    request,
    invocationChain,
    loadTarget,
}) {
    const normalized = normalizeTranslatePluginInvocationRequest(request);
    if (!normalized) throw createPluginInvocationError('invalid_request');
    if (!Array.isArray(invocationChain) || invocationChain.length === 0) {
        throw createPluginInvocationError('invalid_context');
    }
    if (invocationChain.length >= 2) throw createPluginInvocationError('nested_call_blocked');
    if (invocationChain.some((entry) => entry?.pluginName === normalized.pluginId)) {
        throw createPluginInvocationError('recursive_call_blocked');
    }
    if (typeof loadTarget !== 'function') throw createPluginInvocationError('invalid_context');

    let target;
    try {
        target = await loadTarget(normalized.pluginId, [
            ...invocationChain,
            { pluginType: 'translate', pluginName: normalized.pluginId },
        ]);
        assertTranslatePluginInfo(target?.info, normalized.pluginId);
    } catch (error) {
        if (error?.code) throw error;
        throw createPluginInvocationError('plugin_not_installed');
    }

    if (typeof target.translate !== 'function' || !isPlainObject(target.utils)) {
        throw createPluginInvocationError('plugin_invalid');
    }

    try {
        return await target.translate(normalized.text, normalized.from, normalized.to, {
            config: {},
            utils: target.utils,
        });
    } catch (error) {
        if (normalized.pluginId === ECDICT_PLUGIN_ID && isEcdictNotFoundError(error)) {
            throw createPluginInvocationError('word_not_found');
        }
        throw createPluginInvocationError('plugin_call_failed');
    }
}
