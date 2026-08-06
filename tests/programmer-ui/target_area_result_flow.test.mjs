import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { normalizePluginResult } from '../../src/utils/plugin_result.js';
import {
    createAutoCopyText,
    createTranslatePluginOptions,
    decideResultCommit,
    getResultRenderType,
    getTrustedPlainText,
    isDisplayableResult,
    isRequestCurrent,
} from '../../src/window/Translate/components/TargetArea/result_flow.js';

function makeProgrammerFixture(name, source = 'local', diagnostics = []) {
    const tokens = name.split(/[_-]/).filter(Boolean);
    return {
        schema: 'pot.programmer-result.v1',
        plainText: `完整结果：${name}`,
        summary: {
            text: `摘要：${name}`,
            source,
            fallback: source === 'local_fallback',
        },
        identifier: {
            original: name,
            detectedType: 'function',
            detectionMode: 'auto',
            tokens,
        },
        tokenMeanings: tokens.map((token, index) => ({
            index,
            token,
            meaning: `含义：${token}`,
            source: 'local',
        })),
        naming: {
            camelCase: name,
            pascalCase: name,
            snakeCase: name,
            screamingSnakeCase: name.toUpperCase(),
            kebabCase: name.replaceAll('_', '-'),
        },
        diagnostics,
    };
}

const FIXED_PLUGIN_CANDIDATE_FIXTURES = [
    makeProgrammerFixture('NFC_WriteU16LE'),
    makeProgrammerFixture('getCustomxyzValue', 'local_ai'),
    makeProgrammerFixture('RxBufLen', 'ai'),
    makeProgrammerFixture('ST25DV_i2c_WriteData', 'local_fallback', [
        {
            code: 'ai.request_failed',
            severity: 'warning',
            message: 'AI 请求未完成，已使用完整本地结果。',
            recoverable: true,
        },
    ]),
];

test('createTranslatePluginOptions 在顶层加入独立 host 且不修改 config', () => {
    const config = { enable: 'true', nested: { keep: true } };
    const detect = 'en';
    const setResult = () => {};
    const utils = { helper: true };
    const before = structuredClone(config);

    const first = createTranslatePluginOptions({ config, detect, setResult, utils });
    const second = createTranslatePluginOptions({ config, detect, setResult, utils });

    assert.equal(first.config, config);
    assert.equal(first.detect, detect);
    assert.equal(first.setResult, setResult);
    assert.equal(first.utils, utils);
    assert.deepEqual(first.host.resultSchemas, ['pot.programmer-result.v1']);
    assert.equal(Object.hasOwn(config, 'host'), false);
    assert.equal(Object.hasOwn(first.config, 'host'), false);
    assert.notEqual(first, second);
    assert.notEqual(first.host, second.host);
    assert.notEqual(first.host.resultSchemas, second.host.resultSchemas);
    assert.deepEqual(config, before);
});

test('getTrustedPlainText 只返回标准化结果中的字符串 plainText', () => {
    const programmer = normalizePluginResult(FIXED_PLUGIN_CANDIDATE_FIXTURES[0]);
    const text = normalizePluginResult('  普通文本  ');
    const fallback = normalizePluginResult({ schema: 'example.unknown.v2', plainText: '安全回退文本' });
    const legacy = normalizePluginResult({ pronunciations: [] });
    const unsupported = normalizePluginResult({ arbitrary: true });

    assert.equal(getTrustedPlainText(programmer), FIXED_PLUGIN_CANDIDATE_FIXTURES[0].plainText);
    assert.equal(getTrustedPlainText(text), '普通文本');
    assert.equal(getTrustedPlainText(fallback), '安全回退文本');
    assert.equal(getTrustedPlainText(legacy), null);
    assert.equal(getTrustedPlainText(unsupported), null);
    assert.equal(getTrustedPlainText(null), null);
});

test('请求 ID 只允许当前请求提交', () => {
    assert.equal(isRequestCurrent('request-b', 'request-b'), true);
    assert.equal(isRequestCurrent('request-b', 'request-a'), false);
    assert.equal(isRequestCurrent(null, 'request-a'), false);
    assert.equal(isRequestCurrent('', ''), false);
});

test('标准化结果映射到固定渲染类型且 unsupported 不可显示', () => {
    const programmer = normalizePluginResult(FIXED_PLUGIN_CANDIDATE_FIXTURES[0]);
    const text = normalizePluginResult('text');
    const fallback = normalizePluginResult({ schema: 'example.unknown.v2', plainText: 'fallback' });
    const legacy = normalizePluginResult({ explanations: [] });
    const unsupported = normalizePluginResult({ arbitrary: true });

    assert.equal(getResultRenderType(programmer), 'programmer');
    assert.equal(getResultRenderType(text), 'text');
    assert.equal(getResultRenderType(fallback), 'text');
    assert.equal(getResultRenderType(legacy), 'legacy-object');
    assert.equal(getResultRenderType(unsupported), 'unsupported');
    assert.equal(getResultRenderType(null), 'unsupported');

    assert.equal(isDisplayableResult(programmer), true);
    assert.equal(isDisplayableResult(text), true);
    assert.equal(isDisplayableResult(fallback), true);
    assert.equal(isDisplayableResult(legacy), true);
    assert.equal(isDisplayableResult(unsupported), false);
    assert.equal(isDisplayableResult(null), false);
});

test('四个固定插件候选 fixture 均标准化为 programmer 并保留完整 plainText', () => {
    for (const fixture of FIXED_PLUGIN_CANDIDATE_FIXTURES) {
        const normalized = normalizePluginResult(fixture);
        assert.equal(normalized.kind, 'programmer', fixture.identifier.original);
        assert.equal(getResultRenderType(normalized), 'programmer');
        assert.equal(getTrustedPlainText(normalized), fixture.plainText);
        assert.notEqual(getTrustedPlainText(normalized), fixture.summary.text);
    }
});

test('未知 Schema、无效 v1 与旧对象选择安全渲染路径', () => {
    const unknown = normalizePluginResult({
        schema: 'example.unknown.v2',
        plainText: '安全回退文本',
    });
    const invalidV1 = normalizePluginResult({
        schema: 'pot.programmer-result.v1',
        plainText: '无效 v1 回退全文',
        summary: null,
    });
    const legacyRaw = {
        pronunciations: [],
        explanations: [],
        associations: [],
        sentence: [],
    };
    const legacy = normalizePluginResult(legacyRaw);

    assert.equal(getResultRenderType(unknown), 'text');
    assert.equal(getTrustedPlainText(unknown), '安全回退文本');
    assert.equal(getResultRenderType(invalidV1), 'text');
    assert.equal(getTrustedPlainText(invalidV1), '无效 v1 回退全文');
    assert.equal(getResultRenderType(legacy), 'legacy-object');
    assert.equal(legacy.raw, legacyRaw);
    assert.equal(getTrustedPlainText(legacy), null);
});

test('流式提交仅显示当前请求，过期请求被拒绝', () => {
    const streamA = normalizePluginResult('A-stream');
    const streamB = normalizePluginResult('B-stream');

    assert.deepEqual(
        decideResultCommit({
            activeRequestId: 'request-b',
            requestId: 'request-a',
            normalized: streamA,
            latestStreamResult: null,
            final: false,
        }),
        { type: 'ignore', result: null, trustedPlainText: null }
    );

    assert.deepEqual(
        decideResultCommit({
            activeRequestId: 'request-b',
            requestId: 'request-b',
            normalized: streamB,
            latestStreamResult: null,
            final: false,
        }),
        { type: 'display', result: streamB, trustedPlainText: null }
    );
});

test('最终提交只为当前且可用结果暴露可信全文', () => {
    const finalA = normalizePluginResult('A-final');
    const finalB = normalizePluginResult('B-final');

    assert.equal(
        decideResultCommit({
            activeRequestId: 'request-b',
            requestId: 'request-a',
            normalized: finalA,
            latestStreamResult: null,
            final: true,
        }).type,
        'ignore'
    );

    assert.deepEqual(
        decideResultCommit({
            activeRequestId: 'request-b',
            requestId: 'request-b',
            normalized: finalB,
            latestStreamResult: null,
            final: true,
        }),
        { type: 'display', result: finalB, trustedPlainText: 'B-final' }
    );
});

test('不可用最终值保留当前请求的有效流式显示但不产生可信全文', () => {
    const stream = normalizePluginResult('可显示的流式结果');
    const unsupported = normalizePluginResult({ arbitrary: true });

    assert.deepEqual(
        decideResultCommit({
            activeRequestId: 'request-b',
            requestId: 'request-b',
            normalized: unsupported,
            latestStreamResult: stream,
            final: true,
        }),
        { type: 'preserve-stream', result: stream, trustedPlainText: null }
    );

    assert.deepEqual(
        decideResultCommit({
            activeRequestId: 'request-b',
            requestId: 'request-b',
            normalized: unsupported,
            latestStreamResult: null,
            final: true,
        }),
        { type: 'empty', result: null, trustedPlainText: null }
    );
});

test('竞争请求与反向翻译共享相同 stale 保护', () => {
    const events = [
        ['request-a', false, 'A-stream'],
        ['request-b', false, 'B-stream'],
        ['request-a', true, 'A-final'],
        ['request-b', true, 'B-final'],
    ];
    const accepted = events
        .map(([requestId, final, value]) =>
            decideResultCommit({
                activeRequestId: 'request-b',
                requestId,
                normalized: normalizePluginResult(value),
                latestStreamResult: final ? normalizePluginResult('B-stream') : null,
                final,
            })
        )
        .filter((decision) => decision.type !== 'ignore');

    assert.deepEqual(
        accepted.map((decision) => [decision.type, decision.result?.plainText, decision.trustedPlainText]),
        [
            ['display', 'B-stream', null],
            ['display', 'B-final', 'B-final'],
        ]
    );

    const reverseStale = decideResultCommit({
        activeRequestId: 'reverse-b',
        requestId: 'reverse-a',
        normalized: normalizePluginResult('旧反向结果'),
        latestStreamResult: null,
        final: true,
    });
    assert.equal(reverseStale.type, 'ignore');
});

test('自动复制只根据可信全文构造 target 与 source_target 文本', () => {
    assert.equal(
        createAutoCopyText({ autoCopy: 'target', sourceText: '  source  ', trustedPlainText: 'target' }),
        'target'
    );
    assert.equal(
        createAutoCopyText({
            autoCopy: 'source_target',
            sourceText: '  source  ',
            trustedPlainText: 'target',
        }),
        'source\n\ntarget'
    );
    assert.equal(
        createAutoCopyText({ autoCopy: 'disable', sourceText: 'source', trustedPlainText: 'target' }),
        null
    );
    assert.equal(
        createAutoCopyText({ autoCopy: 'target', sourceText: 'source', trustedPlainText: null }),
        null
    );
});

test('helper 不修改 options、normalized result，也不触发对象字符串转换', () => {
    const raw = {
        toString() {
            throw new Error('不得调用 toString');
        },
    };
    const normalized = normalizePluginResult(raw);
    const normalizedBefore = {
        kind: normalized.kind,
        render: normalized.render,
        plainText: normalized.plainText,
        reason: normalized.reason,
    };
    const optionsInput = {
        config: { keep: true },
        detect: 'en',
        setResult: () => {},
        utils: {},
    };
    const configBefore = structuredClone(optionsInput.config);

    assert.doesNotThrow(() => getTrustedPlainText(normalized));
    assert.doesNotThrow(() => getResultRenderType(normalized));
    assert.doesNotThrow(() =>
        decideResultCommit({
            activeRequestId: 'current',
            requestId: 'current',
            normalized,
            latestStreamResult: null,
            final: true,
        })
    );
    createTranslatePluginOptions(optionsInput);

    assert.deepEqual(optionsInput.config, configBefore);
    assert.deepEqual(
        {
            kind: normalized.kind,
            render: normalized.render,
            plainText: normalized.plainText,
            reason: normalized.reason,
        },
        normalizedBefore
    );
});

const targetAreaSource = await readFile(
    new URL('../../src/window/Translate/components/TargetArea/index.jsx', import.meta.url),
    'utf8'
);

test('TargetArea 通过局部请求 ID 隔离初始、重试和反向请求', () => {
    assert.match(targetAreaSource, /const activeRequestIdRef = useRef\(null\)/);
    assert.match(targetAreaSource, /const requestId = beginRequest\(\)/);
    assert.match(targetAreaSource, /void startInitialTranslation\(\)/);
    assert.match(targetAreaSource, /void startReverseTranslation\(\)/);
    assert.doesNotMatch(targetAreaSource, /(?:let|const) translateID\s*=/);
    assert.doesNotMatch(targetAreaSource, /translateID\[/);
    assert.doesNotMatch(targetAreaSource, /v \+ ' '/);
});

test('TargetArea 对流式和最终入口统一执行标准化与提交判定', () => {
    assert.match(targetAreaSource, /const commitStreamResult[\s\S]*normalizePluginResult\(value\)/);
    assert.match(targetAreaSource, /const commitFinalResult[\s\S]*normalizePluginResult\(value\)/);
    assert.match(targetAreaSource, /final: false/);
    assert.match(targetAreaSource, /final: true/);
    assert.match(targetAreaSource, /decision\.trustedPlainText !== null/);
});

test('翻译插件使用顶层 host helper，内置服务保持原 options', () => {
    assert.match(targetAreaSource, /const options = createTranslatePluginOptions\(\{/);
    assert.match(targetAreaSource, /func\([\s\S]*options\s*\)/);
    assert.match(
        targetAreaSource,
        /service\.translate\([\s\S]*\{\s*config: instanceConfig,\s*detect: builtinDetectOption,\s*setResult:/
    );
    assert.doesNotMatch(targetAreaSource, /instanceConfig\[['"]host['"]\]/);
    assert.doesNotMatch(targetAreaSource, /instanceConfig\[['"]enable['"]\]\s*=/);
});

test('ProgrammerMinimalResult 使用请求 key、标准化结果和直接文本复制', () => {
    assert.match(targetAreaSource, /<ProgrammerMinimalResult/);
    assert.match(targetAreaSource, /key=\{resultRequestId\}/);
    assert.match(targetAreaSource, /result=\{normalizedResult\}/);
    assert.match(targetAreaSource, /onCopy=\{\(text\) => copyWithFeedback\(text\)\}/);
    assert.match(targetAreaSource, /class ProgrammerResultErrorBoundary extends React\.Component/);
    assert.match(targetAreaSource, /plainText=\{trustedPlainText\}/);
});

test('复制、自动复制、历史、反向翻译和收藏统一使用可信 plainText', () => {
    assert.match(targetAreaSource, /const trustedPlainText = getTrustedPlainText\(normalizedResult\)/);
    assert.match(targetAreaSource, /result: trustedText/);
    assert.match(targetAreaSource, /trustedPlainText: trustedText/);
    assert.match(targetAreaSource, /inputText: trustedPlainText/);
    assert.match(targetAreaSource, /sourceText\.trim\(\), trustedPlainText/);
    assert.doesNotMatch(targetAreaSource, /summary\.text/);
    assert.doesNotMatch(targetAreaSource, /writeText\(value\)/);
    assert.doesNotMatch(targetAreaSource, /result\.toString\(\)/);
    assert.doesNotMatch(targetAreaSource, /JSON\.stringify\(/);
});

test('旧对象只读取标准化 raw，未知结果不制造显示文本', () => {
    assert.match(
        targetAreaSource,
        /const legacyResult = resultRenderType === 'legacy-object' \? normalizedResult\.raw : null/
    );
    assert.match(targetAreaSource, /if \(resultRenderType === 'legacy-object'\)/);
    assert.match(targetAreaSource, /return null;/);
    assert.doesNotMatch(targetAreaSource, /String\(normalizedResult\)/);
    assert.doesNotMatch(targetAreaSource, /`\$\{normalizedResult\}`/);
});
