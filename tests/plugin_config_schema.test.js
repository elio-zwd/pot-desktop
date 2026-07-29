import assert from 'node:assert/strict';
import test from 'node:test';

import {
    clampTextareaRows,
    evaluateVisibleWhen,
    normalizePluginNeeds,
    pluginConfigSchemaLimits,
    resolvePluginFieldValue,
} from '../src/utils/plugin_config_schema.js';

test('空 needs 和错误 needs 安全返回空分组', () => {
    assert.deepEqual(normalizePluginNeeds([]), []);
    assert.deepEqual(normalizePluginNeeds(null), []);
    assert.deepEqual(normalizePluginNeeds({}), []);
});

test('旧版无 type 与 input 字段继续归一化为输入框', () => {
    const [group] = normalizePluginNeeds([
        { key: 'requestPath', display: '请求地址' },
        { key: 'token', display: '令牌', type: 'input' },
    ]);

    assert.equal(group.legacy, true);
    assert.equal(group.display, null);
    assert.deepEqual(group.fields.map(({ key, type }) => ({ key, type })), [
        { key: 'requestPath', type: 'input' },
        { key: 'token', type: 'input' },
    ]);
});

test('旧版 select 保持选项顺序和默认值', () => {
    const [group] = normalizePluginNeeds([
        { key: 'mode', display: '模式', type: 'select', options: { a: 'A', b: 'B' } },
    ]);
    const [field] = group.fields;

    assert.deepEqual(field.options, { a: 'A', b: 'B' });
    assert.equal(resolvePluginFieldValue(field, {}), 'a');
    assert.equal(resolvePluginFieldValue(field, { mode: 'b' }), 'b');
});

test('多分组按首次出现顺序，分组元数据采用第一次有效声明', () => {
    const groups = normalizePluginNeeds([
        { key: 'a', group: 'basic', groupDisplay: '', groupAdvanced: 'yes' },
        { key: 'b', group: 'advanced', groupDisplay: '高级 AI', groupAdvanced: true },
        { key: 'c', group: 'basic', groupDisplay: '基础使用', groupAdvanced: false },
        { key: 'd', group: 'basic', groupDisplay: '不会覆盖', groupAdvanced: true },
    ]);

    assert.deepEqual(groups.map(({ key }) => key), ['basic', 'advanced']);
    assert.equal(groups[0].display, '基础使用');
    assert.equal(groups[0].advanced, false);
    assert.equal(groups[1].display, '高级 AI');
    assert.equal(groups[1].advanced, true);
});

test('四种 visibleWhen 运算符按当前配置判断', () => {
    const config = { mode: 'custom', count: 2 };

    assert.equal(evaluateVisibleWhen({ key: 'mode', operator: 'equals', value: 'custom' }, config), true);
    assert.equal(evaluateVisibleWhen({ key: 'mode', operator: 'notEquals', value: 'custom' }, config), false);
    assert.equal(evaluateVisibleWhen({ key: 'count', operator: 'in', value: [1, 2, 3] }, config), true);
    assert.equal(evaluateVisibleWhen({ key: 'count', operator: 'notIn', value: [2, 4] }, config), false);
});

test('错误条件和不存在的引用键采用安全显示', () => {
    assert.equal(evaluateVisibleWhen({ key: 'mode', operator: 'matches', value: 'x' }, { mode: 'x' }), true);
    assert.equal(evaluateVisibleWhen({ key: 'missing', operator: 'equals', value: 'x' }, {}), true);
    assert.equal(evaluateVisibleWhen(null, {}), true);
});

test('错误 options 和未知 type 安全降级为普通输入框', () => {
    const [group] = normalizePluginNeeds([
        { key: 'brokenSelect', type: 'select', options: null },
        { key: 'unknown', type: 'slider' },
        null,
        { display: '缺少 key' },
    ]);

    assert.deepEqual(group.fields.map(({ key, type }) => ({ key, type })), [
        { key: 'brokenSelect', type: 'input' },
        { key: 'unknown', type: 'input' },
    ]);
});

test('特殊选项键不会污染对象原型', () => {
    const options = JSON.parse('{"__proto__":"原型选项","constructor":"构造器选项"}');
    const [group] = normalizePluginNeeds([{ key: 'mode', type: 'select', options }]);
    const [field] = group.fields;

    assert.equal(Object.prototype.hasOwnProperty.call(field.options, '__proto__'), true);
    assert.equal(field.options.__proto__, '原型选项');
    assert.equal(field.options.constructor, '构造器选项');
    assert.equal({}.polluted, undefined);
});

test('异常文本对象和配置值不会导致归一化抛错', () => {
    const invalidText = { toString: null, valueOf: null };
    const [group] = normalizePluginNeeds([
        {
            key: 'safeField',
            display: invalidText,
            description: invalidText,
            placeholder: invalidText,
            options: invalidText,
        },
    ]);
    const [field] = group.fields;

    assert.equal(field.display, 'safeField');
    assert.equal(field.description, '');
    assert.equal(field.placeholder, '');
    assert.equal(resolvePluginFieldValue(field, { safeField: invalidText }), '');
    assert.equal(clampTextareaRows(invalidText), pluginConfigSchemaLimits.defaultTextareaRows);
});

test('密钥字段遮罩元数据不改变真实配置值', () => {
    const [group] = normalizePluginNeeds([{ key: 'apiKey', secret: true, multiline: true, rows: 4 }]);
    const [field] = group.fields;
    const config = { apiKey: 'fake-key-for-test-only' };

    assert.equal(field.secret, true);
    assert.equal(field.multiline, true);
    assert.equal(resolvePluginFieldValue(field, config), 'fake-key-for-test-only');
    assert.deepEqual(config, { apiKey: 'fake-key-for-test-only' });
});

test('多行 rows 限制在安全边界', () => {
    assert.equal(clampTextareaRows(-10), pluginConfigSchemaLimits.minTextareaRows);
    assert.equal(clampTextareaRows(3.6), 4);
    assert.equal(clampTextareaRows(99), pluginConfigSchemaLimits.maxTextareaRows);
    assert.equal(clampTextareaRows('bad'), pluginConfigSchemaLimits.defaultTextareaRows);
});

test('超长显示、帮助和占位符会被截断', () => {
    const overlong = '测'.repeat(pluginConfigSchemaLimits.maxHelpTextLength + 50);
    const [group] = normalizePluginNeeds([
        {
            key: 'field',
            display: '名'.repeat(pluginConfigSchemaLimits.maxDisplayLength + 20),
            description: overlong,
            placeholder: overlong,
        },
    ]);
    const [field] = group.fields;

    assert.equal(field.display.length, pluginConfigSchemaLimits.maxDisplayLength);
    assert.equal(field.description.length, pluginConfigSchemaLimits.maxHelpTextLength);
    assert.equal(field.placeholder.length, pluginConfigSchemaLimits.maxHelpTextLength);
});

test('隐藏字段和值解析不会删除旧配置中的其他 Key', () => {
    const config = { mode: 'simple', customModel: 'model-x', legacyKey: 'keep-me' };
    const [group] = normalizePluginNeeds([
        {
            key: 'customModel',
            visibleWhen: { key: 'mode', operator: 'equals', value: 'custom' },
        },
    ]);
    const [field] = group.fields;

    assert.equal(evaluateVisibleWhen(field.visibleWhen, config), false);
    assert.equal(resolvePluginFieldValue(field, config), 'model-x');
    assert.equal(config.legacyKey, 'keep-me');
});
