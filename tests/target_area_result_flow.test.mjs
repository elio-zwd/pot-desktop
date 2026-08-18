import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
    beginRequestState,
    createAutoCopyText,
    createRequestState,
    createTranslatePluginOptions,
    decideLocalCheckpointCommit,
    decideRequestRejection,
    decideResultCommit,
    isRequestCurrent,
    queueCurrentRequestEffect,
    recordStreamResult,
    resolveTrustedCopyText,
    RESULT_STAGE_V1,
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
        pluginApis: ['pot.plugin-invoke.translate.v1'],
        resultStages: ['pot.result-stage.v1'],
    });
    assert.notEqual(first, second);
    assert.notEqual(first.host, second.host);
    assert.notEqual(first.host.resultSchemas, second.host.resultSchemas);
    assert.equal(Object.hasOwn(config, 'host'), false);
    assert.deepEqual(config, before);
});

test('本地完成检查点只接受当前请求的受控阶段，并使用显式复制全文', () => {
    const metadata = {
        schema: RESULT_STAGE_V1,
        stage: 'local-complete',
        copyText: '本地可复制全文',
    };
    assert.deepEqual(
        decideLocalCheckpointCommit({
            activeRequestId: 'request-a',
            requestId: 'request-a',
            value: '展示中的 AI 加载提示',
            metadata,
            checkpointCommitted: false,
        }),
        { trustedCopyText: '本地可复制全文' }
    );
    assert.equal(
        decideLocalCheckpointCommit({
            activeRequestId: 'request-a',
            requestId: 'request-a',
            value: v2Result('本地全文'),
            metadata,
            checkpointCommitted: true,
        }),
        null
    );
});

test('普通流式元数据、过期请求和不安全阶段字段不触发本地副作用', () => {
    const valid = { schema: RESULT_STAGE_V1, stage: 'local-complete' };
    assert.equal(
        decideLocalCheckpointCommit({
            activeRequestId: 'request-b', requestId: 'request-a', value: v2Result(),
            metadata: valid, checkpointCommitted: false,
        }),
        null
    );
    assert.equal(
        decideLocalCheckpointCommit({
            activeRequestId: 'request-a', requestId: 'request-a', value: v2Result(),
            metadata: { ...valid, arbitrary: true }, checkpointCommitted: false,
        }),
        null
    );
    assert.equal(
        decideLocalCheckpointCommit({
            activeRequestId: 'request-a', requestId: 'request-a', value: legacyResult,
            metadata: valid, checkpointCommitted: false,
        }),
        null
    );
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

test('当前 reject 可提交错误，过期 reject 完全忽略', () => {
    assert.equal(
        decideRequestRejection({ activeRequestId: 'request-a', requestId: 'request-a' }),
        'reject'
    );
    assert.equal(
        decideRequestRejection({ activeRequestId: 'request-b', requestId: 'request-a' }),
        'ignore'
    );
});

test('无可信 copyText 的 V2 最终结果不覆盖有效流式显示', () => {
    const stream = v2Result('流式完整文本');
    const finalWithoutCopyText = {
        schemaVersion: 2,
        copyText: '   ',
        sections: [{ id: 'summary', type: 'summary', content: '最终摘要' }],
    };

    assert.deepEqual(
        decideResultCommit({
            activeRequestId: 'request-a',
            requestId: 'request-a',
            value: finalWithoutCopyText,
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
const resultFlowSource = await readFile(
    new URL('../src/window/Translate/components/TargetArea/result_flow.js', import.meta.url),
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
    assert.match(resultFlowSource, /host: createPluginHostCapabilities\(\)/);
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
    assert.doesNotMatch(resultFlowSource, /toString\s*\(/);
});

test('历史与剪贴板副作用串行执行，失效请求在执行前被跳过', async () => {
    const events = [];
    let current = 'request-a';
    let releaseFirst;
    const first = queueCurrentRequestEffect(Promise.resolve(), {
        isCurrent: () => current === 'request-a',
        task: async () => {
            events.push('local-start');
            await new Promise((resolve) => { releaseFirst = resolve; });
            events.push('local-end');
        },
    });
    const second = queueCurrentRequestEffect(first, {
        isCurrent: () => current === 'request-a',
        task: async () => { events.push('final'); },
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.deepEqual(events, ['local-start']);
    releaseFirst();
    await second;
    assert.deepEqual(events, ['local-start', 'local-end', 'final']);

    current = 'request-b';
    const stale = queueCurrentRequestEffect(Promise.resolve(), {
        isCurrent: () => current === 'request-a',
        task: async () => { events.push('stale'); },
    });
    await stale;
    assert.doesNotMatch(events.join(','), /stale/);
});

test('本地检查点与最终结果都经过当前请求门禁，普通流式不触发落盘', () => {
    assert.match(targetAreaSource, /const localCheckpointCommittedRef = useRef\(false\)/);
    assert.match(targetAreaSource, /const historyWriteQueueRef = useRef\(Promise\.resolve\(\)\)/);
    assert.match(targetAreaSource, /const clipboardWriteQueueRef = useRef\(Promise\.resolve\(\)\)/);
    assert.match(targetAreaSource, /queueCurrentRequestEffect\(historyWriteQueueRef\.current/);
    assert.match(targetAreaSource, /queueCurrentRequestEffect\(clipboardWriteQueueRef\.current/);
    assert.match(targetAreaSource, /decideLocalCheckpointCommit\(\{/);
    assert.match(targetAreaSource, /setResult: \(value, metadata\)/);
    assert.match(targetAreaSource, /runCommittedSideEffects\(/);
});

test('新请求重置渲染器，同请求流式更新沿用稳定 key', () => {
    assert.match(targetAreaSource, /const \[resultRequestId, setResultRequestId\] = useState\(''\)/);
    assert.match(targetAreaSource, /setResultRequestId\(requestId\)/);
    assert.match(targetAreaSource, /<TranslationResult\s+key=\{resultRequestId\}/);
});

test('工具栏与反向翻译只使用可信 resultCopyText 且不追加空格刷新', () => {
    assert.match(targetAreaSource, /const resultCopyText = useMemo\(\(\) => resolveTrustedCopyText\(result\) \?\? '', \[result\]\)/);
    assert.match(targetAreaSource, /inputText: resultCopyText/);
    assert.doesNotMatch(targetAreaSource, /normalized \+ ' '/);
    assert.doesNotMatch(targetAreaSource, /result\.trim\(\)/);
});

test('源文本自动复制与通知绑定当前请求', () => {
    assert.match(targetAreaSource, /void startInitialTranslation\(\);\s*const requestId = activeRequestIdRef\.current/);
    assert.match(
        targetAreaSource,
        /autoCopy === 'source'[\s\S]*isRequestCurrent\(activeRequestIdRef\.current, requestId\)[\s\S]*writeText\(clipboardText\)[\s\S]*isRequestCurrent\(activeRequestIdRef\.current, requestId\)[\s\S]*sendNotification/
    );
});

test('日志不拼接完整结果、配置或拒绝原因', () => {
    assert.doesNotMatch(targetAreaSource, /resolve:\s*['"]?\s*\+/);
    assert.doesNotMatch(targetAreaSource, /reject:\s*['"]?\s*\+/);
    assert.doesNotMatch(targetAreaSource, /logError\([^)]*reason/);
    assert.doesNotMatch(targetAreaSource, /logError\([^)]*instanceConfig/);
});
