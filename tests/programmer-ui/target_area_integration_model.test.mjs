import test from 'node:test';
import assert from 'node:assert/strict';

import { PROGRAMMER_RESULT_SCHEMA } from '../../src/utils/plugin_result.js';
import {
    createFinalResultEffects,
    createPluginTranslateOptions,
    describeResultForLog,
    getCollectionResultValue,
    getProgrammerResultKey,
    getResultRenderKind,
    getTrustedResultText,
    normalizeResultForDisplay,
} from '../../src/window/Translate/components/TargetArea/model.js';

function createProgrammerFixture({
    original,
    tokens,
    summaryText,
    source = 'local',
    diagnostics = [],
}) {
    const namingStem = tokens.map((token) => token.toLowerCase()).join('_');
    const plainText = [
        `原始标识符：${original}`,
        `词语拆分：${tokens.join(' · ')}`,
        `核心释义：${summaryText}`,
        '命名：',
        `- snake_case：${namingStem}`,
    ].join('\n');

    return {
        schema: PROGRAMMER_RESULT_SCHEMA,
        plainText,
        summary: {
            text: summaryText,
            source,
            fallback: source === 'local_fallback',
        },
        identifier: {
            original,
            detectedType: 'function',
            detectionMode: 'auto',
            tokens,
        },
        tokenMeanings: tokens.map((token, index) => ({
            index,
            token,
            meaning: `含义 ${token}`,
            source: index === 0 && source === 'local_fallback' ? 'literal' : 'local',
        })),
        naming: {
            camelCase: tokens.join(''),
            pascalCase: tokens.join(''),
            snakeCase: namingStem,
            screamingSnakeCase: namingStem.toUpperCase(),
            kebabCase: namingStem.replaceAll('_', '-'),
        },
        diagnostics,
        presentation: {
            preferredDensity: 'minimal',
            initiallyExpanded: [],
        },
    };
}

const REAL_PLUGIN_CANDIDATES = [
    createProgrammerFixture({
        original: 'NFC_WriteU16LE',
        tokens: ['NFC', 'write', 'U16', 'LE'],
        summaryText: '以小端序向 NFC 设备写入 16 位无符号整数',
    }),
    createProgrammerFixture({
        original: 'getCustomxyzValue',
        tokens: ['get', 'Customxyz', 'Value'],
        summaryText: '获取自定义 XYZ 值',
        source: 'local_ai',
    }),
    createProgrammerFixture({
        original: 'RxBufLen',
        tokens: ['Rx', 'Buf', 'Len'],
        summaryText: '接收缓冲区的长度',
        source: 'ai',
    }),
    createProgrammerFixture({
        original: 'ST25DV_i2c_WriteData',
        tokens: ['ST25DV', 'I2C', 'write', 'data'],
        summaryText: 'ST25DV I2C 写入数据',
        source: 'local_fallback',
        diagnostics: [
            {
                code: 'ai.request_failed',
                severity: 'warning',
                message: 'AI 请求未完成，已使用完整本地结果。',
                recoverable: true,
            },
        ],
    }),
];

test('插件调用在顶层声明精确 v1 宿主能力且每次返回新对象', () => {
    const setResult = () => {};
    const first = createPluginTranslateOptions({
        config: { outputStyle: 'minimal' },
        detect: 'en',
        setResult,
        utils: { marker: 1 },
    });
    const second = createPluginTranslateOptions({
        config: { outputStyle: 'minimal' },
        detect: 'en',
        setResult,
        utils: { marker: 1 },
    });

    assert.deepEqual(first.host.resultSchemas, [PROGRAMMER_RESULT_SCHEMA]);
    assert.equal(first.setResult, setResult);
    assert.equal(Object.hasOwn(first.config, 'host'), false);
    assert.notEqual(first.host, second.host);
    assert.notEqual(first.host.resultSchemas, second.host.resultSchemas);
});

test('setResult 是否存在不参与宿主能力判断', () => {
    const withSetResult = createPluginTranslateOptions({
        config: {},
        detect: 'en',
        setResult: () => {},
        utils: {},
    });
    const withoutSetResult = createPluginTranslateOptions({
        config: {},
        detect: 'en',
        setResult: undefined,
        utils: {},
    });

    assert.deepEqual(withSetResult.host.resultSchemas, [PROGRAMMER_RESULT_SCHEMA]);
    assert.deepEqual(withoutSetResult.host.resultSchemas, [PROGRAMMER_RESULT_SCHEMA]);
});

test('四个真实插件候选 fixture 均标准化为 programmer 并保留完整 plainText', () => {
    for (const fixture of REAL_PLUGIN_CANDIDATES) {
        const normalized = normalizeResultForDisplay(fixture);

        assert.equal(normalized.kind, 'programmer', fixture.identifier.original);
        assert.equal(getResultRenderKind(normalized), 'programmer', fixture.identifier.original);
        assert.equal(getTrustedResultText(normalized), fixture.plainText, fixture.identifier.original);
        assert.equal(getCollectionResultValue(normalized, true), fixture.plainText);
        assert.doesNotMatch(getCollectionResultValue(normalized, true), /\[object Object\]/);
    }
});

test('复制、自动复制和历史统一使用完整 plainText', () => {
    const fixture = REAL_PLUGIN_CANDIDATES[0];
    const normalized = normalizeResultForDisplay(fixture);
    const targetEffects = createFinalResultEffects({
        result: normalized,
        sourceText: fixture.identifier.original,
        autoCopy: 'target',
        isPrimaryResult: true,
        clipboardMonitor: false,
    });
    const sourceTargetEffects = createFinalResultEffects({
        result: normalized,
        sourceText: fixture.identifier.original,
        autoCopy: 'source_target',
        isPrimaryResult: true,
        clipboardMonitor: false,
    });

    assert.equal(targetEffects.historyValue, fixture.plainText);
    assert.equal(targetEffects.clipboardText, fixture.plainText);
    assert.equal(
        sourceTargetEffects.clipboardText,
        `${fixture.identifier.original}\n\n${fixture.plainText}`
    );
});

test('非首个结果或剪贴板监听状态不会触发目标自动复制', () => {
    const normalized = normalizeResultForDisplay(REAL_PLUGIN_CANDIDATES[1]);

    assert.equal(
        createFinalResultEffects({
            result: normalized,
            sourceText: 'source',
            autoCopy: 'target',
            isPrimaryResult: false,
            clipboardMonitor: false,
        }).clipboardText,
        null
    );
    assert.equal(
        createFinalResultEffects({
            result: normalized,
            sourceText: 'source',
            autoCopy: 'target',
            isPrimaryResult: true,
            clipboardMonitor: true,
        }).clipboardText,
        null
    );
});

test('同一查询流式更新保持组件 key，新查询使用新 key', () => {
    assert.equal(getProgrammerResultKey('query-a'), getProgrammerResultKey('query-a'));
    assert.notEqual(getProgrammerResultKey('query-a'), getProgrammerResultKey('query-b'));
});

test('local_fallback 保留安全诊断且日志描述不包含结果正文', () => {
    const fixture = REAL_PLUGIN_CANDIDATES[3];
    const normalized = normalizeResultForDisplay(fixture);

    assert.equal(normalized.summary.source, 'local_fallback');
    assert.deepEqual(normalized.diagnostics, fixture.diagnostics);
    assert.equal(describeResultForLog(normalized), `programmer:${PROGRAMMER_RESULT_SCHEMA}`);
    assert.doesNotMatch(describeResultForLog(normalized), /ST25DV|AI 请求/);
});

test('空 diagnostics 保持空数组，交由极简组件隐藏空区块', () => {
    const normalized = normalizeResultForDisplay(REAL_PLUGIN_CANDIDATES[0]);

    assert.deepEqual(normalized.diagnostics, []);
});

test('旧词典对象继续保留原始对象，不伪造可信全文', () => {
    const legacy = {
        explanations: [{ trait: '词义', explains: ['测试'] }],
    };
    const normalized = normalizeResultForDisplay(legacy);

    assert.equal(normalized.kind, 'legacy-object');
    assert.equal(getResultRenderKind(normalized), 'legacy-object');
    assert.equal(getTrustedResultText(normalized), null);
    assert.equal(createFinalResultEffects({
        result: normalized,
        sourceText: 'source',
        autoCopy: 'target',
        isPrimaryResult: true,
        clipboardMonitor: false,
    }).clipboardText, null);
});
