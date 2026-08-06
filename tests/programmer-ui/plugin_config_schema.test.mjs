import test from 'node:test';
import assert from 'node:assert/strict';

import {
    DEFAULT_TEXTAREA_ROWS,
    MAX_TEXTAREA_ROWS,
    MIN_TEXTAREA_ROWS,
    buildPluginConfigModel,
    getControlValue,
    getSwitchValues,
    getTextareaRows,
    isSafeExternalHref,
    normalizePluginConfigSchema,
} from '../../src/window/Config/pages/Service/PluginConfig/schema.js';

const findItem = (schema, key) => schema.items.find((item) => item.key === key);

const visibleKeys = (model) => [
    ...model.rootItems.map((item) => item.key),
    ...model.sections.flatMap((section) => section.items.map((item) => item.key)),
];

test('省略 type 时按旧 input 处理', () => {
    const schema = normalizePluginConfigSchema([{ key: 'api', display: 'API' }]);
    assert.equal(schema.items[0].type, 'input');
    assert.equal(schema.items[0].persisted, true);
});

test('保留旧 input 行为', () => {
    const schema = normalizePluginConfigSchema([{ type: 'input', key: 'query', display: 'Query' }]);
    const item = findItem(schema, 'query');
    assert.equal(item.type, 'input');
    assert.equal(getControlValue(item, {}), '');
    assert.equal(getControlValue(item, { query: 'saved' }), 'saved');
});

test('保留旧 select 行为并选择第一个 option', () => {
    const schema = normalizePluginConfigSchema([
        { type: 'select', key: 'mode', display: 'Mode', options: { fast: 'Fast', safe: 'Safe' } },
    ]);
    const item = findItem(schema, 'mode');
    assert.deepEqual(item.options, [
        { key: 'fast', label: 'Fast' },
        { key: 'safe', label: 'Safe' },
    ]);
    assert.equal(getControlValue(item, {}), 'fast');
    assert.equal(getControlValue(item, { mode: 'safe' }), 'safe');
});

test('section 对字段进行分组', () => {
    const model = buildPluginConfigModel([
        { type: 'section', key: 'advanced', display: 'Advanced' },
        { key: 'token', display: 'Token', section: 'advanced' },
    ]);
    assert.equal(model.rootItems.length, 0);
    assert.deepEqual(model.sections[0].items.map((item) => item.key), ['token']);
});

test('无 section 的普通字段留在根级', () => {
    const model = buildPluginConfigModel([{ key: 'plain', display: 'Plain' }]);
    assert.deepEqual(model.rootItems.map((item) => item.key), ['plain']);
});

test('引用不存在 section 的字段回到根级', () => {
    const model = buildPluginConfigModel([{ key: 'plain', display: 'Plain', section: 'missing' }]);
    assert.deepEqual(model.rootItems.map((item) => item.key), ['plain']);
});

test('section 默认展开与折叠状态被归一化', () => {
    const schema = normalizePluginConfigSchema([
        { type: 'section', key: 'open', display: 'Open', defaultExpanded: true },
        { type: 'section', key: 'closed', display: 'Closed' },
    ]);
    assert.equal(schema.sections[0].defaultExpanded, true);
    assert.equal(schema.sections[1].defaultExpanded, false);
});

test('secret 默认使用遮罩模型', () => {
    const schema = normalizePluginConfigSchema([{ type: 'secret', key: 'key', display: 'Key' }]);
    const item = findItem(schema, 'key');
    assert.equal(item.inputType, 'password');
    assert.equal(item.maskedByDefault, true);
    assert.equal(item.persisted, true);
});

test('textarea rows 使用安全边界', () => {
    assert.equal(getTextareaRows(undefined), DEFAULT_TEXTAREA_ROWS);
    assert.equal(getTextareaRows(1), MIN_TEXTAREA_ROWS);
    assert.equal(getTextareaRows(999), MAX_TEXTAREA_ROWS);
    assert.equal(getTextareaRows(5.9), 5);
    assert.equal(getTextareaRows('6'), DEFAULT_TEXTAREA_ROWS);
});

test('switch 默认继续持久化字符串值', () => {
    const values = getSwitchValues({});
    assert.deepEqual(values, { onValue: 'true', offValue: 'false' });
    const schema = normalizePluginConfigSchema([{ type: 'switch', key: 'enabled', display: 'Enabled' }]);
    const item = findItem(schema, 'enabled');
    assert.equal(getControlValue(item, {}), 'false');
});

test('switch 支持自定义 onValue 与 offValue', () => {
    const schema = normalizePluginConfigSchema([
        { type: 'switch', key: 'enabled', display: 'Enabled', onValue: 'yes', offValue: 'no' },
    ]);
    const item = findItem(schema, 'enabled');
    assert.deepEqual(getSwitchValues(item), { onValue: 'yes', offValue: 'no' });
    assert.equal(getControlValue(item, {}), 'no');
});

test('help 不持久化且只保留安全链接', () => {
    const schema = normalizePluginConfigSchema([
        { type: 'help', key: 'docs', text: 'Docs', href: 'https://example.com/help' },
        { type: 'help', key: 'bad', text: 'Bad', href: 'javascript:alert(1)' },
    ]);
    assert.equal(findItem(schema, 'docs').persisted, false);
    assert.equal(findItem(schema, 'docs').href, 'https://example.com/help');
    assert.equal(findItem(schema, 'bad').href, null);
    assert.equal(isSafeExternalHref('http://example.com'), true);
    assert.equal(isSafeExternalHref('/relative'), false);
    assert.equal(isSafeExternalHref('javascript:alert(1)'), false);
});

test('visibleWhen equals 使用严格相等', () => {
    const needs = [
        { key: 'mode', display: 'Mode', default: 'advanced' },
        { key: 'detail', display: 'Detail', visibleWhen: { key: 'mode', equals: 'advanced' } },
    ];
    assert.deepEqual(visibleKeys(buildPluginConfigModel(needs, {})), ['mode', 'detail']);
    assert.deepEqual(visibleKeys(buildPluginConfigModel(needs, { mode: 'basic' })), ['mode']);
});

test('visibleWhen notEquals 使用严格相等的反值', () => {
    const needs = [
        { key: 'mode', display: 'Mode', default: 'basic' },
        { key: 'detail', display: 'Detail', visibleWhen: { key: 'mode', notEquals: 'hidden' } },
    ];
    assert.deepEqual(visibleKeys(buildPluginConfigModel(needs, {})), ['mode', 'detail']);
    assert.deepEqual(visibleKeys(buildPluginConfigModel(needs, { mode: 'hidden' })), ['mode']);
});

test('visibleWhen oneOf 使用严格相等', () => {
    const needs = [
        { key: 'mode', display: 'Mode' },
        { key: 'detail', display: 'Detail', visibleWhen: { key: 'mode', oneOf: ['a', 'b'] } },
    ];
    assert.deepEqual(visibleKeys(buildPluginConfigModel(needs, { mode: 'b' })), ['mode', 'detail']);
    assert.deepEqual(visibleKeys(buildPluginConfigModel(needs, { mode: 'c' })), ['mode']);
});

test('同时存在多个比较器时条件非法并安全显示', () => {
    const needs = [
        { key: 'mode', display: 'Mode' },
        {
            key: 'detail',
            display: 'Detail',
            visibleWhen: { key: 'mode', equals: 'a', notEquals: 'b' },
        },
    ];
    assert.deepEqual(visibleKeys(buildPluginConfigModel(needs, {})), ['mode', 'detail']);
});

test('条件合法但源字段和值都不存在时隐藏', () => {
    const model = buildPluginConfigModel([
        { key: 'detail', display: 'Detail', visibleWhen: { key: 'missing', equals: 'a' } },
    ]);
    assert.deepEqual(visibleKeys(model), []);
});

test('已保存值优先于字段 default', () => {
    const needs = [
        { key: 'mode', display: 'Mode', default: 'default-value' },
        { key: 'detail', display: 'Detail', visibleWhen: { key: 'mode', equals: 'saved-value' } },
    ];
    assert.deepEqual(visibleKeys(buildPluginConfigModel(needs, { mode: 'saved-value' })), [
        'mode',
        'detail',
    ]);
});

test('条件比较不自动转换字符串、数字或布尔', () => {
    const needs = [
        { key: 'count', display: 'Count', default: 1 },
        { key: 'numeric', display: 'Numeric', visibleWhen: { key: 'count', equals: 1 } },
        { key: 'string', display: 'String', visibleWhen: { key: 'count', equals: '1' } },
        { key: 'flag', display: 'Flag', default: false },
        { key: 'boolean', display: 'Boolean', visibleWhen: { key: 'flag', equals: false } },
        { key: 'boolean-string', display: 'Boolean String', visibleWhen: { key: 'flag', equals: 'false' } },
    ];
    assert.deepEqual(visibleKeys(buildPluginConfigModel(needs, {})), [
        'count',
        'numeric',
        'flag',
        'boolean',
    ]);
    assert.deepEqual(visibleKeys(buildPluginConfigModel(needs, { count: '1', flag: 'false' })), [
        'count',
        'string',
        'flag',
        'boolean-string',
    ]);
});

test('未知显式 type 被跳过', () => {
    const schema = normalizePluginConfigSchema([
        { type: 'future-control', key: 'future', display: 'Future' },
        { key: 'legacy', display: 'Legacy' },
    ]);
    assert.deepEqual(schema.items.map((item) => item.key), ['legacy']);
    assert.deepEqual(schema.skipped, [{ index: 0, key: 'future', type: 'future-control' }]);
});

test('异常 options 或 needs 不会抛出', () => {
    assert.doesNotThrow(() => normalizePluginConfigSchema(null));
    assert.doesNotThrow(() => normalizePluginConfigSchema({}));
    assert.doesNotThrow(() => normalizePluginConfigSchema([null, 42, 'bad']));
    const schema = normalizePluginConfigSchema([
        { type: 'select', key: 'bad-a', display: 'Bad A', options: null },
        { type: 'select', key: 'bad-b', display: 'Bad B', options: ['x'] },
    ]);
    assert.deepEqual(findItem(schema, 'bad-a').options, []);
    assert.deepEqual(findItem(schema, 'bad-b').options, []);
});

test('归一化和条件求值不修改输入 needs 或 config', () => {
    const needs = [
        { type: 'section', key: 'advanced', display: 'Advanced', defaultExpanded: true },
        {
            type: 'select',
            key: 'mode',
            display: 'Mode',
            options: { a: 'A' },
            section: 'advanced',
        },
        { key: 'detail', display: 'Detail', visibleWhen: { key: 'mode', equals: 'a' } },
    ];
    const config = { mode: 'a', untouched: 'keep' };
    const needsBefore = structuredClone(needs);
    const configBefore = structuredClone(config);
    buildPluginConfigModel(needs, config);
    assert.deepEqual(needs, needsBefore);
    assert.deepEqual(config, configBefore);
});
