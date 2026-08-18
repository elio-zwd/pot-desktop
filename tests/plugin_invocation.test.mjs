import assert from 'node:assert/strict';
import test from 'node:test';

import {
    ECDICT_PLUGIN_ID,
    assertTranslatePluginInfo,
    invokeNestedTranslatePlugin,
    normalizeTranslatePluginInvocationRequest,
} from '../src/utils/plugin_invocation.js';

const callerChain = [{
    pluginType: 'translate',
    pluginName: 'plugin.com.elio.programmer-selection-translator',
}];

function ecdictTarget(translate = async () => ({ explanations: [] })) {
    return {
        info: { id: ECDICT_PLUGIN_ID, plugin_type: 'translate' },
        translate,
        utils: { Database: {} },
    };
}

test('插件间翻译调用只接受受控的单词请求', () => {
    assert.deepEqual(
        normalizeTranslatePluginInvocationRequest({
            pluginId: ECDICT_PLUGIN_ID,
            text: 'write',
            from: 'auto',
            to: 'zh',
        }),
        { pluginId: ECDICT_PLUGIN_ID, text: 'write', from: 'auto', to: 'zh' }
    );
    assert.equal(normalizeTranslatePluginInvocationRequest({
        pluginId: '../plugin.com.pot-app.ecdict', text: 'write', from: 'auto', to: 'zh',
    }), null);
    assert.equal(normalizeTranslatePluginInvocationRequest({
        pluginId: 'plugin.com.pot-app..ecdict', text: 'write', from: 'auto', to: 'zh',
    }), null);
    assert.equal(normalizeTranslatePluginInvocationRequest({
        pluginId: ECDICT_PLUGIN_ID, text: '', from: 'auto', to: 'zh',
    }), null);
});

test('嵌套调用校验 ECDict 信息并且不传入父插件设置或 setResult', async () => {
    const calls = [];
    const result = await invokeNestedTranslatePlugin({
        request: { pluginId: ECDICT_PLUGIN_ID, text: 'write', from: 'auto', to: 'zh' },
        invocationChain: callerChain,
        loadTarget: async (pluginId, nextChain) => {
            assert.equal(pluginId, ECDICT_PLUGIN_ID);
            assert.equal(nextChain.length, 2);
            return ecdictTarget(async (...args) => {
                calls.push(args);
                return { explanations: [{ trait: 'v.', explains: ['写'] }] };
            });
        },
    });
    assert.deepEqual(result, { explanations: [{ trait: 'v.', explains: ['写'] }] });
    assert.deepEqual(calls, [[
        'write', 'auto', 'zh', { config: {}, utils: { Database: {} } },
    ]]);
});

test('拒绝自调用、多层调用、缺失插件与错误信息泄漏', async () => {
    const baseRequest = { pluginId: ECDICT_PLUGIN_ID, text: 'write', from: 'auto', to: 'zh' };
    await assert.rejects(
        invokeNestedTranslatePlugin({
            request: { ...baseRequest, pluginId: callerChain[0].pluginName },
            invocationChain: callerChain,
            loadTarget: async () => ecdictTarget(),
        }),
        (error) => error.code === 'recursive_call_blocked'
    );
    await assert.rejects(
        invokeNestedTranslatePlugin({
            request: baseRequest,
            invocationChain: [...callerChain, { pluginType: 'translate', pluginName: ECDICT_PLUGIN_ID }],
            loadTarget: async () => ecdictTarget(),
        }),
        (error) => error.code === 'nested_call_blocked'
    );
    await assert.rejects(
        invokeNestedTranslatePlugin({
            request: baseRequest,
            invocationChain: callerChain,
            loadTarget: async () => {
                throw new Error('C:\\Users\\private\\plugin.js');
            },
        }),
        (error) => error.code === 'plugin_not_installed' && !String(error.message).includes('private')
    );
});

test('ECDict 未命中被归一化为稳定错误码，其他异常不暴露原始信息', async () => {
    const request = { pluginId: ECDICT_PLUGIN_ID, text: 'missingword', from: 'auto', to: 'zh' };
    await assert.rejects(
        invokeNestedTranslatePlugin({
            request,
            invocationChain: callerChain,
            loadTarget: async () => ecdictTarget(async () => {
                throw 'Http Request Error\nHttp Status: undefined\nundefined';
            }),
        }),
        (error) => error.code === 'word_not_found'
    );
    await assert.rejects(
        invokeNestedTranslatePlugin({
            request,
            invocationChain: callerChain,
            loadTarget: async () => ecdictTarget(async () => {
                throw new Error('sqlite:C:\\private\\stardict.db');
            }),
        }),
        (error) => error.code === 'plugin_call_failed' && !String(error.message).includes('private')
    );
});

test('错误的目标信息不被当作可调用翻译插件', () => {
    assert.throws(
        () => assertTranslatePluginInfo({ id: ECDICT_PLUGIN_ID, plugin_type: 'tts' }, ECDICT_PLUGIN_ID),
        (error) => error.code === 'plugin_invalid'
    );
});
