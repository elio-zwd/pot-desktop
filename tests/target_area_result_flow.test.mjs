import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
    beginRequestState,
    createAutoCopyText,
    createRequestState,
    createTranslatePluginOptions,
    decideResultCommit,
    isRequestCurrent,
    recordStreamResult,
    resolveTrustedCopyText,
} from '../src/window/Translate/components/TargetArea/result_flow.js';

const v2Result = (copyText = '完整 copyText') => ({
    schemaVersion: 2,
    copyText,
    sections: [
        {
            id: 'summary',
            type: 'summary',
            content: '摘要',
        },
    ],
});

const legacyResult = {
    explanations: [
        {
            trait: 'noun',
            explains: ['旧对象'],
        },
    ],
};

test('插件 options 在顶层加入独立 host 且不修改 config', () => {
    const config = { enable: 'true', nested: { keep: true } };
    const before = structuredClone(config);
    const detect = 'en';
    const setResult = () => {};
    const utils = { helper: true };

    const first = createTranslatePluginOptions({ config, detect, setResult, utils });
    const second = createTranslatePluginOptions({ config, detect, setResult, utils });

    assert.equal(first.config, config);
    assert.equal(first.detect, detect);
    assert.equal(first.setResult, setResult);
    assert.equal(first.utils, utils);
    assert.deepEqual(first.host, {
        name: 'pot-desktop',
        resultSchemas: ['pot.plugin-result.v2'],
        configSchemaVersion: 2,
    });
    assert.notEqual(first, second);
    assert.notEqual(first.host, second.host);
    assert.notEqual(first.host.resultSchemas, second.host.resultSchemas);
    assert.equal(Object.hasOwn(config, 'host'), false);
    assert.deepEqual(config, before);
});

test('请求 ID 只允许当前请求提交', () => {
    assert.equal(isRequestCurrent('request-b', 'request-b'), true);
    assert.equal(isRequestCurrent('request-b', 'request-a'), false);
    assert.equal(isRequestCurrent(null, 'request-a'), false);
    assert.equal(isRequestCurrent('', ''), false);
});

test('新请求替换旧请求并清空流式结果', () => {
    const initial = createRequestState();
    const requestA = beginRequestState(initial, 'request-a');
    const streamedA = recordStreamResult(requestA, 'request-a', 'A-stream');
    const requestB = beginRequestState(streamedA, 'request-b');

    assert.deepEqual(initial, {
        activeRequestId: null,
        latestStreamResult: null,
    });
    assert.equal(requestA.activeRequestId, 'request-a');
    assert.equal(streamedA.activeRequestId, 'request-a');
    assert.equal(streamedA.latestStreamResult, 'A-stream');
    assert.equal(requestB.activeRequestId, 'request-b');
    assert.equal(requestB.latestStreamResult, null);
});

test('同一请求的流式更新保持请求标识稳定', () => {
    const request = beginRequestState(createRequestState(), 'request-a');
    const first = recordStreamResult(request, 'request-a', 'A-stream-1');
    const second = recordStreamResult(first, 'request-a', 'A-stream-2');

    assert.equal(first.activeRequestId, 'request-a');
    assert.equal(second.activeRequestId, 'request-a');
    assert.equal(second.latestStreamResult, 'A-stream-2');
});

test('过期流式更新不修改状态', () => {
    const current = beginRequestState(createRequestState(), 'request-b');
    const stale = recordStreamResult(current, 'request-a', 'A-stream');

    assert.equal(stale, current);
    assert.equal(stale.latestStreamResult, null);
});

test('当前流式结果可以显示但不产生最终副作用文本', () => {
    assert.deepEqual(
        decideResultCommit({
            activeRequestId: 'request-a',
            requestId: 'request-a',
            value: v2Result('流式 copyText'),
            latestStreamResult: null,
            final: false,
        }),
        {
            type: 'display',
            result: v2Result('流式 copyText'),
            trustedCopyText: null,
        }
    );
});

test('过期流式结果完全忽略', () => {
    assert.deepEqual(
        decideResultCommit({
            activeRequestId: 'request-b',
            requestId: 'request-a',
            value: 'A-stream',
            latestStreamResult: null,
            final: false,
        }),
        {
            type: 'ignore',
            result: null,
            trustedCopyText: null,
        }
    );
});

test('当前字符串最终结果允许副作用并使用完整字符串', () => {
    assert.deepEqual(
        decideResultCommit({
            activeRequestId: 'request-a',
            requestId: 'request-a',
            value: '  完整字符串结果  ',
            latestStreamResult: null,
            final: true,
        }),
        {
            type: 'display',
            result: '完整字符串结果',
            trustedCopyText: '完整字符串结果',
        }
    );
});

test('当前 V2 最终结果只使用顶层 copyText', () => {
    const value = {
        schemaVersion: 2,
        copyText: '顶层完整 copyText',
        sections: [
            {
                id: 'summary',
                type: 'summary',
                content: '摘要不能替代全文',
                copyText: '摘要不能替代全文',
            },
        ],
    };

    const decision = decideResultCommit({
        activeRequestId: 'request-a',
        requestId: 'request-a',
        value,
        latestStreamResult: null,
        final: true,
    });

    assert.equal(decision.type, 'display');
    assert.equal(decision.result, value);
    assert.equal(decision.trustedCopyText, '顶层完整 copyText');
});

test('旧对象可以显示但没有可信副作用文本', () => {
    assert.deepEqual(
        decideResultCommit({
            activeRequestId: 'request-a',
            requestId: 'request-a',
            value: legacyResult,
            latestStreamResult: null,
            final: true,
        }),
        {
            type: 'display',
            result: legacyResult,
            trustedCopyText: null,
        }
    );
});

test('过期 resolve 不显示也不产生副作用', () => {
    assert.deepEqual(
        decideResultCommit({
            activeRequestId: 'request-b',
            requestId: 'request-a',
            value: 'A-final',
            latestStreamResult: null,
            final: true,
        }),
        {
            type: 'ignore',
            result: null,
            trustedCopyText: null,
        }
    );
});

test('无效最终结果保留当前有效流式显示且不产生副作用', () => {
    const stream = v2Result('流式完整文本');

    assert.deepEqual(
        decideResultCommit({
            activeRequestId: 'request-a',
            requestId: 'request-a',
            value: { arbitrary: true },
            latestStreamResult: stream,
            final: true,
        }),
        {
            type: 'preserve-stream',
            result: stream,
            trustedCopyText: null,
        }
    );
});

test('空最终结果在没有流式结果时结束为空', () => {
    assert.deepEqual(
        decideResultCommit({
            activeRequestId: 'request-a',
            requestId: 'request-a',
            value: '',
            latestStreamResult: null,
            final: true,
        }),
        {
            type: 'empty',
            result: null,
            trustedCopyText: null,
        }
    );
});

test('正向、反向和后续请求使用同一 stale 规则', () => {
    const oldForward = decideResultCommit({
        activeRequestId: 'reverse-a',
        requestId: 'forward-a',
        value: '旧正向最终结果',
        latestStreamResult: null,
        final: true,
    });
    const currentReverse = decideResultCommit({
        activeRequestId: 'reverse-a',
        requestId: 'reverse-a',
        value: '当前反向最终结果',
        latestStreamResult: null,
        final: true,
    });
    const oldReverse = decideResultCommit({
        activeRequestId: 'request-c',
        requestId: 'reverse-a',
        value: '旧反向最终结果',
        latestStreamResult: null,
        final: true,
    });

    assert.equal(oldForward.type, 'ignore');
    assert.equal(currentReverse.trustedCopyText, '当前反向最终结果');
    assert.equal(oldReverse.type, 'ignore');
});

test('可信文本只接受非空字符串和 V2 顶层 copyText', () => {
    assert.equal(resolveTrustedCopyText('  文本结果  '), '文本结果');
    assert.equal(resolveTrustedCopyText(v2Result('V2 全文')), 'V2 全文');
    assert.equal(resolveTrustedCopyText(v2Result('   ')), null);
    assert.equal(resolveTrustedCopyText(legacyResult), null);
    assert.equal(resolveTrustedCopyText({ arbitrary: true }), null);
});

test('对象不会触发隐式字符串转换', () => {
    const hostile = {
        toString() {
            throw new Error('不得调用 toString');
        },
    };

    assert.doesNotThrow(() => resolveTrustedCopyText(hostile));
    assert.doesNotThrow(() =>
        decideResultCommit({
            activeRequestId: 'request-a',
            requestId: 'request-a',
            value: hostile,
            latestStreamResult: null,
            final: true,
        })
    );
    assert.equal(resolveTrustedCopyText(hostile), null);
});

test('自动复制仅由可信最终全文构造', () => {
    assert.equal(
        createAutoCopyText({
            autoCopy: 'target',
            sourceText: '原始输入',
            trustedCopyText: '完整 copyText',
        }),
        '完整 copyText'
    );
    assert.equal(
        createAutoCopyText({
            autoCopy: 'source_target',
            sourceText: '  原始输入  ',
            trustedCopyText: '完整 copyText',
        }),
        '原始输入\n\n完整 copyText'
    );
    assert.equal(
        createAutoCopyText({
            autoCopy: 'disable',
            sourceText: '原始输入',
            trustedCopyText: '完整 copyText',
        }),
        null
    );
    assert.equal(
        createAutoCopyText({
            autoCopy: 'target',
            sourceText: '原始输入',
            trustedCopyText: null,
        }),
        null
    );
});

const targetAreaSource = await readFile(
    new URL('../src/window/Translate/components/TargetArea/index.jsx', import.meta.url),
    'utf8'
);

test('TargetArea 使用组件局部请求 ref 并删除模块级 translateID', () => {
    assert.match(targetAreaSource, /const activeRequestIdRef = useRef\(null\)/);
    assert.match(targetAreaSource, /const latestStreamResultRef = useRef\(null\)/);
    assert.match(targetAreaSource, /const requestId = nanoid\(\)/);
    assert.doesNotMatch(targetAreaSource, /(?:let|const)\s+translateID\s*=/);
    assert.doesNotMatch(targetAreaSource, /translateID\[/);
});

test('初始、重试和反向翻译都通过统一 startTranslation 生成新请求', () => {
    assert.match(targetAreaSource, /const startTranslation = async/);
    assert.match(targetAreaSource, /const startInitialTranslation = \(\) =>/);
    assert.match(targetAreaSource, /const startReverseTranslation = \(\) =>/);
    assert.match(targetAreaSource, /onPress=\{\(\) => \{\s*void startInitialTranslation\(\)/);
    assert.match(targetAreaSource, /onPress=\{\(\) => \{\s*void startReverseTranslation\(\)/);
});

test('插件初始和反向调用都由统一 options helper 注入新 host', () => {
    assert.match(targetAreaSource, /createTranslatePluginOptions\(\{/);
    assert.match(targetAreaSource, /host: createPluginHostCapabilities\(\)/);
    assert.doesNotMatch(targetAreaSource, /instanceConfig\.host\s*=/);
    assert.doesNotMatch(targetAreaSource, /instanceConfig\[['"]host['"]\]\s*=/);
    assert.doesNotMatch(targetAreaSource, /pot\.programmer-result\.v1/);
});

test('内置翻译、TTS 与收藏调用不传入 host', () => {
    assert.match(
        targetAreaSource,
        /service\.translate\([\s\S]*\{\s*config: instanceConfig,\s*detect: builtinDetectOption,\s*setResult:/
    );
    assert.match(targetAreaSource, /func\(resultCopyText,[\s\S]*\{\s*config: pluginConfig,\s*utils,\s*\}\)/);
    assert.doesNotMatch(targetAreaSource, /invoke_plugin\('tts'[\s\S]{0,1200}host:/);
    assert.doesNotMatch(targetAreaSource, /invoke_plugin\('collection'[\s\S]{0,1200}host:/);
});

test('流式、resolve 和 reject 都经过 stale 提交门禁', () => {
    assert.match(targetAreaSource, /const commitStreamResult =/);
    assert.match(targetAreaSource, /final: false/);
    assert.match(targetAreaSource, /const commitFinalResult =/);
    assert.match(targetAreaSource, /final: true/);
    assert.match(targetAreaSource, /const rejectRequest =/);
    assert.match(targetAreaSource, /isRequestCurrent\(activeRequestIdRef\.current, requestId\)/);
});

test('最终副作用只读取 trustedCopyText 并保留流式结果', () => {
    assert.match(targetAreaSource, /decision\.trustedCopyText !== null/);
    assert.match(targetAreaSource, /decision\.type === 'preserve-stream'/);
    assert.match(targetAreaSource, /result: trustedCopyText/);
    assert.doesNotMatch(targetAreaSource, /JSON\.stringify\(result/);
    assert.doesNotMatch(targetAreaSource, /String\(result\)/);
    assert.doesNotMatch(targetAreaSource, /result\?\.toString/);
});

test('新请求重置渲染器，同请求流式更新沿用稳定 key', () => {
    assert.match(targetAreaSource, /const \[resultRequestId, setResultRequestId\] = useState\(''\)/);
    assert.match(targetAreaSource, /setResultRequestId\(requestId\)/);
    assert.match(targetAreaSource, /<TranslationResult\s+key=\{resultRequestId\}/);
});

test('反向翻译只使用可信 resultCopyText 且不追加空格刷新', () => {
    assert.match(targetAreaSource, /inputText: resultCopyText/);
    assert.doesNotMatch(targetAreaSource, /normalized \+ ' '/);
    assert.doesNotMatch(targetAreaSource, /result\.trim\(\)/);
});

test('日志不拼接完整结果、配置或拒绝原因', () => {
    assert.doesNotMatch(targetAreaSource, /resolve:\s*['"]?\s*\+/);
    assert.doesNotMatch(targetAreaSource, /reject:\s*['"]?\s*\+/);
    assert.doesNotMatch(targetAreaSource, /logError\([^)]*reason/);
    assert.doesNotMatch(targetAreaSource, /logError\([^)]*instanceConfig/);
});
