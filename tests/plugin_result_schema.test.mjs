import test from 'node:test';
import assert from 'node:assert/strict';
import {
    PLUGIN_RESULT_SCHEMA_LIMITS,
    isLegacyPluginResult,
    isPluginResultV2,
    normalizePluginResultSection,
    normalizePluginResultV2,
    resolveResultCopyText,
} from '../src/utils/plugin_result_schema.js';
import { completeV2Fixture, legacyFixture } from './fixtures/plugin_result_schema_v2.mjs';

test('仅严格数字版本与 sections 数组识别为 V2', () => {
    assert.equal(isPluginResultV2({ schemaVersion: 2, sections: [] }), true);
    assert.equal(isPluginResultV2({ schemaVersion: '2', sections: [] }), false);
    assert.equal(isPluginResultV2({ schemaVersion: 2, sections: {} }), false);
    assert.equal(isPluginResultV2(null), false);
});

test('最小 V2 可归一化', () => {
    assert.deepEqual(normalizePluginResultV2({ schemaVersion: 2, sections: [] }), {
        schemaVersion: 2,
        copyText: '',
        sections: [],
    });
});

test('六种 section 均被归一化', () => {
    const normalized = normalizePluginResultV2(completeV2Fixture);
    assert.deepEqual(normalized.sections.map((section) => section.type), [
        'summary',
        'metadata',
        'dictionary',
        'code-list',
        'note',
        'status',
    ]);
    assert.equal(normalized.sections[4].defaultCollapsed, true);
    assert.equal(normalized.sections[5].severity, 'warning');
});

test('未知 section 安全降级为纯文本 note', () => {
    const normalized = normalizePluginResultSection(
        { id: 'custom', type: 'grid', title: '未知', content: '安全文本', html: '<img>' },
        0
    );
    assert.equal(normalized.type, 'note');
    assert.equal(normalized.content, '安全文本');
    assert.equal('html' in normalized, false);
});

test('重复 ID 使用稳定后缀', () => {
    const normalized = normalizePluginResultV2({
        schemaVersion: 2,
        sections: [
            { id: 'same', type: 'summary', content: '一' },
            { id: 'same', type: 'summary', content: '二' },
            { id: 'same', type: 'summary', content: '三' },
        ],
    });
    assert.deepEqual(normalized.sections.map((section) => section.id), ['same', 'same-2', 'same-3']);
});

test('超长和超量数据被限制', () => {
    const normalized = normalizePluginResultV2({
        schemaVersion: 2,
        copyText: 'x'.repeat(PLUGIN_RESULT_SCHEMA_LIMITS.copyText + 50),
        sections: Array.from({ length: PLUGIN_RESULT_SCHEMA_LIMITS.sections + 5 }, (_, index) => ({
            id: `section-${index}`,
            type: 'metadata',
            items: Array.from({ length: PLUGIN_RESULT_SCHEMA_LIMITS.items + 5 }, () => ({ label: 'l', value: 'v' })),
            tokens: Array.from({ length: PLUGIN_RESULT_SCHEMA_LIMITS.tokens + 5 }, () => 't'.repeat(200)),
        })),
    });
    assert.equal(normalized.sections.length, PLUGIN_RESULT_SCHEMA_LIMITS.sections);
    assert.equal(normalized.sections[0].items.length, PLUGIN_RESULT_SCHEMA_LIMITS.items);
    assert.equal(normalized.sections[0].tokens.length, PLUGIN_RESULT_SCHEMA_LIMITS.tokens);
    assert.equal(normalized.sections[0].tokens[0].length, PLUGIN_RESULT_SCHEMA_LIMITS.token);
    assert.equal(normalized.copyText.length, PLUGIN_RESULT_SCHEMA_LIMITS.copyText);
});

test('错误数组和对象形状不会抛出', () => {
    assert.doesNotThrow(() => normalizePluginResultV2({ schemaVersion: 2, sections: [null, [], 'x', 1] }));
    assert.deepEqual(normalizePluginResultV2({ schemaVersion: 2, sections: [null, [], 'x', 1] }).sections, []);
});

test('恶意 UI 注入字段被白名单归一化忽略', () => {
    const normalized = normalizePluginResultV2({
        schemaVersion: 2,
        html: '<script>alert(1)</script>',
        style: { color: 'red' },
        className: 'fixed inset-0',
        component: () => null,
        sections: [
            {
                id: 'safe',
                type: 'summary',
                content: '<b>普通文本</b>',
                html: '<img onerror=alert(1)>',
                style: 'color:red',
                className: 'absolute',
                component: 'Injected',
                markdown: '**bold**',
            },
        ],
    });
    assert.deepEqual(Object.keys(normalized), ['schemaVersion', 'copyText', 'sections']);
    assert.equal(normalized.sections[0].content, '<b>普通文本</b>');
    for (const key of ['html', 'style', 'className', 'component', 'markdown']) {
        assert.equal(key in normalized.sections[0], false);
    }
});

test('成对内容只接受固定文本、来源和加载状态', () => {
    const normalized = normalizePluginResultV2({
        schemaVersion: 2,
        sections: [
            {
                id: 'summary',
                type: 'summary',
                content: '获取值',
                source: 'local',
                paired: {
                    label: 'AI 翻译',
                    content: '',
                    source: 'ai',
                    state: 'loading',
                    html: '<img onerror=alert(1)>',
                    className: 'fixed inset-0',
                },
            },
            {
                id: 'dictionary',
                type: 'dictionary',
                title: '逐词释义',
                paired: { label: 'AI 翻译', content: '', source: 'ai', state: 'loading' },
                items: [
                    {
                        token: 'get',
                        phonetic: 'ɡet',
                        meaning: '获取；得到',
                        source: 'local',
                        paired: { content: '', source: 'ai', state: 'loading', style: 'color:red' },
                    },
                ],
            },
        ],
    });

    assert.deepEqual(normalized.sections[0].paired, {
        label: 'AI 翻译',
        content: '',
        source: 'ai',
        state: 'loading',
    });
    assert.deepEqual(normalized.sections[1].items[0].paired, {
        label: 'AI 翻译',
        content: '',
        source: 'ai',
        state: 'loading',
    });
    assert.equal('html' in normalized.sections[0].paired, false);
    assert.equal('style' in normalized.sections[1].items[0].paired, false);
});

test('成对内容拒绝无文本的完成状态', () => {
    const section = normalizePluginResultSection({
        type: 'summary',
        content: '本地释义',
        paired: { label: 'AI 翻译', content: '', source: 'ai', state: 'complete' },
    });
    assert.equal('paired' in section, false);
});

test('缺少顶层 copyText 时从 section 生成纯文本回退', () => {
    const normalized = normalizePluginResultV2({
        schemaVersion: 2,
        sections: [
            { type: 'summary', content: '核心' },
            { type: 'code-list', items: [{ label: '小驼峰', value: 'camelCase' }] },
        ],
    });
    assert.equal(normalized.copyText, '核心\n\n小驼峰：camelCase');
    assert.equal(resolveResultCopyText(normalized), normalized.copyText);
});

test('V2 与旧字段同时存在时仍优先解析 V2', () => {
    const mixed = { ...completeV2Fixture, ...legacyFixture };
    assert.equal(isPluginResultV2(mixed), true);
    assert.equal(resolveResultCopyText(mixed), completeV2Fixture.copyText);
});

test('字符串保持原复制文本，旧对象不伪造 V2 复制文本', () => {
    assert.equal(resolveResultCopyText('文本结果'), '文本结果');
    assert.equal(resolveResultCopyText(legacyFixture), '');
});

test('四类旧对象字段均保持可识别', () => {
    assert.equal(isLegacyPluginResult({ pronunciations: [] }), true);
    assert.equal(isLegacyPluginResult({ explanations: [] }), true);
    assert.equal(isLegacyPluginResult({ associations: [] }), true);
    assert.equal(isLegacyPluginResult({ sentence: [] }), true);
    assert.equal(isLegacyPluginResult({ schemaVersion: 2, sections: [] }), false);
    assert.equal(isLegacyPluginResult('文本结果'), false);
});

test('带异常属性访问的对象不会让检测或复制抛出', () => {
    const hostile = new Proxy({}, {
        get() {
            throw new Error('blocked');
        },
        has() {
            throw new Error('blocked');
        },
    });
    assert.doesNotThrow(() => isPluginResultV2(hostile));
    assert.doesNotThrow(() => isLegacyPluginResult(hostile));
    assert.doesNotThrow(() => resolveResultCopyText(hostile));
    assert.equal(isPluginResultV2(hostile), false);
    assert.equal(isLegacyPluginResult(hostile), false);
    assert.equal(resolveResultCopyText(hostile), '');
});

test('错误 V2 可安全回退给旧渲染器', () => {
    const malformed = { ...legacyFixture, schemaVersion: 2, sections: {} };
    assert.equal(isPluginResultV2(malformed), false);
    assert.equal(normalizePluginResultV2(malformed), null);
});
