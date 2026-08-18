import assert from 'node:assert/strict';
import test from 'node:test';

import {
    PLUGIN_INVOKE_TRANSLATE_V1,
    PLUGIN_RESULT_SCHEMA_V2,
    RESULT_STAGE_V1,
    createPluginHostCapabilities,
} from '../src/utils/plugin_host_capabilities.js';

test('宿主能力常量固定为社区插件结果 Schema V2', () => {
    assert.equal(PLUGIN_RESULT_SCHEMA_V2, 'pot.plugin-result.v2');
    assert.equal(PLUGIN_INVOKE_TRANSLATE_V1, 'pot.plugin-invoke.translate.v1');
    assert.equal(RESULT_STAGE_V1, 'pot.result-stage.v1');
});

test('宿主能力只包含精确允许字段', () => {
    assert.deepEqual(createPluginHostCapabilities(), {
        name: 'pot-desktop',
        resultSchemas: ['pot.plugin-result.v2'],
        configSchemaVersion: 2,
        pluginApis: ['pot.plugin-invoke.translate.v1'],
        resultStages: ['pot.result-stage.v1'],
    });
});

test('每次调用返回新的对象和新的 resultSchemas 数组', () => {
    const first = createPluginHostCapabilities();
    const second = createPluginHostCapabilities();

    assert.notEqual(first, second);
    assert.notEqual(first.resultSchemas, second.resultSchemas);
});

test('修改一次返回值不会污染后续调用', () => {
    const first = createPluginHostCapabilities();
    first.name = 'changed';
    first.resultSchemas.push('pot.programmer-result.v1');
    first.configSchemaVersion = 1;
    first.pluginApis.push('other');
    first.resultStages.push('other');

    assert.deepEqual(createPluginHostCapabilities(), {
        name: 'pot-desktop',
        resultSchemas: ['pot.plugin-result.v2'],
        configSchemaVersion: 2,
        pluginApis: ['pot.plugin-invoke.translate.v1'],
        resultStages: ['pot.result-stage.v1'],
    });
});

test('宿主能力不声明程序员专用 v1 或用户配置', () => {
    const host = createPluginHostCapabilities();

    assert.equal(host.resultSchemas.includes('pot.programmer-result.v1'), false);
    assert.equal(Object.hasOwn(host, 'config'), false);
    assert.equal(Object.hasOwn(host, 'apiKey'), false);
    assert.equal(Object.hasOwn(host, 'needs'), false);
    assert.deepEqual(host.pluginApis, ['pot.plugin-invoke.translate.v1']);
    assert.deepEqual(host.resultStages, ['pot.result-stage.v1']);
});
