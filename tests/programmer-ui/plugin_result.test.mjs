import assert from 'node:assert/strict';
import test from 'node:test';

import {
    PROGRAMMER_RESULT_SCHEMA,
    createPluginHostCapabilities,
    normalizePluginResult,
} from '../../src/utils/plugin_result.js';

const FIXTURES = [
    {
        schema: 'pot.programmer-result.v1',
        plainText:
            '函数名：NFC_WriteU16LE\n词语拆分：NFC · write · U16 · LE\n核心释义：以小端序向 NFC 设备写入 16 位无符号整数\n词义：\n- NFC：近场通信\n- write：写入\n- U16：16 位无符号整数\n- LE：小端序\n命名：\n- camelCase：nfcWriteU16Le\n- PascalCase：NfcWriteU16Le\n- snake_case：nfc_write_u16_le\n- SCREAMING_SNAKE_CASE：NFC_WRITE_U16_LE\n- kebab-case：nfc-write-u16-le',
        summary: {
            text: '以小端序向 NFC 设备写入 16 位无符号整数',
            source: 'local',
            fallback: false,
        },
        identifier: {
            original: 'NFC_WriteU16LE',
            detectedType: 'function',
            detectionMode: 'auto',
            tokens: ['NFC', 'write', 'U16', 'LE'],
        },
        tokenMeanings: [
            { index: 0, token: 'NFC', meaning: '近场通信', source: 'local' },
            { index: 1, token: 'write', meaning: '写入', source: 'local' },
            { index: 2, token: 'U16', meaning: '16 位无符号整数', source: 'local' },
            { index: 3, token: 'LE', meaning: '小端序', source: 'local' },
        ],
        naming: {
            camelCase: 'nfcWriteU16Le',
            pascalCase: 'NfcWriteU16Le',
            snakeCase: 'nfc_write_u16_le',
            screamingSnakeCase: 'NFC_WRITE_U16_LE',
            kebabCase: 'nfc-write-u16-le',
        },
        diagnostics: [],
        presentation: {
            preferredDensity: 'minimal',
            initiallyExpanded: [],
        },
    },
    {
        schema: 'pot.programmer-result.v1',
        plainText:
            '函数名：getCustomxyzValue\n词语拆分：get · Customxyz · Value\n核心释义：获取自定义 XYZ 值\n词义：\n- get：获取\n- Customxyz：自定义 XYZ〔AI〕\n- Value：值\n命名：\n- camelCase：getCustomxyzValue\n- PascalCase：GetCustomxyzValue\n- snake_case：get_customxyz_value\n- SCREAMING_SNAKE_CASE：GET_CUSTOMXYZ_VALUE\n- kebab-case：get-customxyz-value',
        summary: {
            text: '获取自定义 XYZ 值',
            source: 'local_ai',
            fallback: false,
        },
        identifier: {
            original: 'getCustomxyzValue',
            detectedType: 'function',
            detectionMode: 'auto',
            tokens: ['get', 'Customxyz', 'Value'],
        },
        tokenMeanings: [
            { index: 0, token: 'get', meaning: '获取', source: 'local' },
            { index: 1, token: 'Customxyz', meaning: '自定义 XYZ', source: 'ai' },
            { index: 2, token: 'Value', meaning: '值', source: 'local' },
        ],
        naming: {
            camelCase: 'getCustomxyzValue',
            pascalCase: 'GetCustomxyzValue',
            snakeCase: 'get_customxyz_value',
            screamingSnakeCase: 'GET_CUSTOMXYZ_VALUE',
            kebabCase: 'get-customxyz-value',
        },
        diagnostics: [],
        presentation: {
            preferredDensity: 'minimal',
            initiallyExpanded: [],
        },
    },
    {
        schema: 'pot.programmer-result.v1',
        plainText:
            '类名：RxBufLen\n词语拆分：Rx · Buf · Len\nAI 释义：接收缓冲区的长度\n词义：\n- Rx：接收\n- Buf：缓冲区\n- Len：长度\n命名：\n- camelCase：rxBufLen\n- PascalCase：RxBufLen\n- snake_case：rx_buf_len\n- SCREAMING_SNAKE_CASE：RX_BUF_LEN\n- kebab-case：rx-buf-len',
        summary: {
            text: '接收缓冲区的长度',
            source: 'ai',
            fallback: false,
        },
        identifier: {
            original: 'RxBufLen',
            detectedType: 'class',
            detectionMode: 'auto',
            tokens: ['Rx', 'Buf', 'Len'],
        },
        tokenMeanings: [
            { index: 0, token: 'Rx', meaning: '接收', source: 'local' },
            { index: 1, token: 'Buf', meaning: '缓冲区', source: 'local' },
            { index: 2, token: 'Len', meaning: '长度', source: 'local' },
        ],
        naming: {
            camelCase: 'rxBufLen',
            pascalCase: 'RxBufLen',
            snakeCase: 'rx_buf_len',
            screamingSnakeCase: 'RX_BUF_LEN',
            kebabCase: 'rx-buf-len',
        },
        diagnostics: [],
        presentation: {
            preferredDensity: 'minimal',
            initiallyExpanded: [],
        },
    },
    {
        schema: 'pot.programmer-result.v1',
        plainText:
            '函数名：ST25DV_i2c_WriteData\n词语拆分：ST25DV · I2C · write · data\n核心释义：ST25DV I2C 写入数据\n词义：\n- ST25DV：技术缩写或数字，保留原文\n- I2C：I²C 总线\n- write：写入\n- data：数据\n命名：\n- camelCase：st25dvI2cWriteData\n- PascalCase：St25dvI2cWriteData\n- snake_case：st25dv_i2c_write_data\n- SCREAMING_SNAKE_CASE：ST25DV_I2C_WRITE_DATA\n- kebab-case：st25dv-i2c-write-data\n诊断：AI 请求未完成，已使用完整本地结果。',
        summary: {
            text: 'ST25DV I2C 写入数据',
            source: 'local_fallback',
            fallback: true,
        },
        identifier: {
            original: 'ST25DV_i2c_WriteData',
            detectedType: 'function',
            detectionMode: 'auto',
            tokens: ['ST25DV', 'I2C', 'write', 'data'],
        },
        tokenMeanings: [
            {
                index: 0,
                token: 'ST25DV',
                meaning: '技术缩写或数字，保留原文',
                source: 'literal',
            },
            { index: 1, token: 'I2C', meaning: 'I²C 总线', source: 'local' },
            { index: 2, token: 'write', meaning: '写入', source: 'local' },
            { index: 3, token: 'data', meaning: '数据', source: 'local' },
        ],
        naming: {
            camelCase: 'st25dvI2cWriteData',
            pascalCase: 'St25dvI2cWriteData',
            snakeCase: 'st25dv_i2c_write_data',
            screamingSnakeCase: 'ST25DV_I2C_WRITE_DATA',
            kebabCase: 'st25dv-i2c-write-data',
        },
        diagnostics: [
            {
                code: 'ai.request_failed',
                severity: 'warning',
                message: 'AI 请求未完成，已使用完整本地结果。',
                recoverable: true,
            },
        ],
        presentation: {
            preferredDensity: 'minimal',
            initiallyExpanded: ['diagnostics'],
        },
    },
];

function clone(value) {
    return structuredClone(value);
}

function makeValidResult() {
    return clone(FIXTURES[0]);
}

function assertFallback(result, reason) {
    assert.equal(result.kind, 'plain-text-fallback');
    assert.equal(result.render, 'text');
    assert.equal(result.reason, reason);
}

function assertInvalidProgrammerResult(input) {
    const result = normalizePluginResult(input);
    assertFallback(result, 'invalid-programmer-schema');
    assert.equal(result.raw, input);
    assert.equal(result.schema, PROGRAMMER_RESULT_SCHEMA);
    assert.equal(result.plainText, input.plainText);
}

test('导出固定协议名', () => {
    assert.equal(PROGRAMMER_RESULT_SCHEMA, 'pot.programmer-result.v1');
});

test('普通字符串裁剪后返回文本结果', () => {
    const result = normalizePluginResult('  hello world  ');

    assert.deepEqual(result, {
        kind: 'text',
        render: 'text',
        raw: '  hello world  ',
        plainText: 'hello world',
    });
    assert.ok(Object.isFrozen(result));
});

test('纯空白字符串返回 empty-string', () => {
    assert.deepEqual(normalizePluginResult(' \n\t '), {
        kind: 'unsupported',
        render: 'unsupported',
        raw: ' \n\t ',
        plainText: null,
        reason: 'empty-string',
    });
});

test('四个固定程序员 fixture 均通过并保留原始全文', () => {
    for (const fixture of FIXTURES) {
        const result = normalizePluginResult(fixture);

        assert.equal(result.kind, 'programmer');
        assert.equal(result.render, 'programmer');
        assert.equal(result.raw, fixture);
        assert.equal(result.schema, PROGRAMMER_RESULT_SCHEMA);
        assert.equal(result.plainText, fixture.plainText);
        assert.deepEqual(result.summary, fixture.summary);
        assert.deepEqual(result.identifier, fixture.identifier);
        assert.deepEqual(result.tokenMeanings, fixture.tokenMeanings);
        assert.deepEqual(result.naming, fixture.naming);
        assert.deepEqual(result.diagnostics, fixture.diagnostics);
        assert.deepEqual(result.presentation, fixture.presentation);
        assert.ok(Object.isFrozen(result));
        assert.ok(Object.isFrozen(result.summary));
        assert.ok(Object.isFrozen(result.identifier.tokens));
        assert.ok(Object.isFrozen(result.tokenMeanings));
        assert.ok(Object.isFrozen(result.naming));
        assert.ok(Object.isFrozen(result.diagnostics));
        assert.equal(Object.isFrozen(fixture), false);
    }
});

test('缺少七个核心字段中的任一字段均不会得到 programmer', () => {
    for (const field of [
        'schema',
        'plainText',
        'summary',
        'identifier',
        'tokenMeanings',
        'naming',
        'diagnostics',
    ]) {
        const input = makeValidResult();
        delete input[field];
        const result = normalizePluginResult(input);

        assert.notEqual(result.kind, 'programmer', field);
        if (field === 'schema') {
            assertFallback(result, 'unknown-schema');
        } else if (field === 'plainText') {
            assert.equal(result.kind, 'unsupported');
            assert.equal(result.reason, 'missing-plain-text');
        } else {
            assertFallback(result, 'invalid-programmer-schema');
        }
    }
});

test('核心子对象缺少必需字段时均安全回退', () => {
    const mutations = [
        (input) => delete input.summary.text,
        (input) => delete input.summary.source,
        (input) => delete input.summary.fallback,
        (input) => delete input.identifier.original,
        (input) => delete input.identifier.detectedType,
        (input) => delete input.identifier.detectionMode,
        (input) => delete input.identifier.tokens,
        (input) => delete input.tokenMeanings[0].index,
        (input) => delete input.tokenMeanings[0].token,
        (input) => delete input.tokenMeanings[0].meaning,
        (input) => delete input.tokenMeanings[0].source,
        (input) => delete input.diagnostics,
    ];

    for (const mutate of mutations) {
        const input = makeValidResult();
        mutate(input);
        assertInvalidProgrammerResult(input);
    }
});

test('非法 summary source 被拒绝', () => {
    const input = makeValidResult();
    input.summary.source = 'remote';
    assertInvalidProgrammerResult(input);
});

test('非法 identifier detectedType 被拒绝', () => {
    const input = makeValidResult();
    input.identifier.detectedType = 'method';
    assertInvalidProgrammerResult(input);
});

test('非法 identifier detectionMode 被拒绝', () => {
    const input = makeValidResult();
    input.identifier.detectionMode = 'manual';
    assertInvalidProgrammerResult(input);
});

test('非法 diagnostic severity 被拒绝', () => {
    const input = makeValidResult();
    input.diagnostics = [
        {
            code: 'ai.request_failed',
            severity: 'fatal',
            message: '失败',
            recoverable: true,
        },
    ];
    assertInvalidProgrammerResult(input);
});

test('summary fallback 必须与 local_fallback 严格一致', () => {
    const local = makeValidResult();
    local.summary.fallback = true;
    assertInvalidProgrammerResult(local);

    const fallback = makeValidResult();
    fallback.summary.source = 'local_fallback';
    fallback.summary.fallback = false;
    assertInvalidProgrammerResult(fallback);
});

test('tokenMeanings 数量、index 与 token 文本必须一一对应', () => {
    const countMismatch = makeValidResult();
    countMismatch.tokenMeanings.pop();
    assertInvalidProgrammerResult(countMismatch);

    const indexMismatch = makeValidResult();
    indexMismatch.tokenMeanings[1].index = 7;
    assertInvalidProgrammerResult(indexMismatch);

    const tokenMismatch = makeValidResult();
    tokenMismatch.tokenMeanings[1].token = 'Write';
    assertInvalidProgrammerResult(tokenMismatch);
});

test('naming 五个固定键缺一不可且值必须为字符串', () => {
    for (const key of [
        'camelCase',
        'pascalCase',
        'snakeCase',
        'screamingSnakeCase',
        'kebabCase',
    ]) {
        const missing = makeValidResult();
        delete missing.naming[key];
        assertInvalidProgrammerResult(missing);
    }

    const wrongType = makeValidResult();
    wrongType.naming.camelCase = null;
    assertInvalidProgrammerResult(wrongType);
});

test('diagnostics 必须具有稳定结构', () => {
    const invalidArray = makeValidResult();
    invalidArray.diagnostics = {};
    assertInvalidProgrammerResult(invalidArray);

    for (const diagnostic of [
        {
            code: 'request_failed',
            severity: 'warning',
            message: '失败',
            recoverable: true,
        },
        {
            code: 'ai.request_failed',
            severity: 'warning',
            message: '   ',
            recoverable: true,
        },
        {
            code: 'ai.request_failed',
            severity: 'warning',
            message: '失败',
            recoverable: 'yes',
        },
    ]) {
        const input = makeValidResult();
        input.diagnostics = [diagnostic];
        assertInvalidProgrammerResult(input);
    }
});

test('可选 phonetic 只接受非空字符串', () => {
    const valid = makeValidResult();
    valid.tokenMeanings[1].phonetic = '/raɪt/';
    assert.equal(normalizePluginResult(valid).kind, 'programmer');

    const invalid = makeValidResult();
    invalid.tokenMeanings[1].phonetic = '   ';
    assertInvalidProgrammerResult(invalid);
});

test('presentation 缺失不影响核心结果', () => {
    const input = makeValidResult();
    delete input.presentation;
    const result = normalizePluginResult(input);

    assert.equal(result.kind, 'programmer');
    assert.equal(Object.hasOwn(result, 'presentation'), false);
});

test('presentation 部分非法时仅丢弃非法提示并去重', () => {
    const input = makeValidResult();
    input.presentation = {
        preferredDensity: 'wide',
        initiallyExpanded: ['naming', 'unknown', 'naming', 'identifier', 42],
        pluginSpecific: true,
    };
    const result = normalizePluginResult(input);

    assert.equal(result.kind, 'programmer');
    assert.deepEqual(result.presentation, {
        initiallyExpanded: ['naming', 'identifier'],
    });

    const entirelyInvalid = makeValidResult();
    entirelyInvalid.presentation = {
        preferredDensity: 'wide',
        initiallyExpanded: 'naming',
    };
    const invalidResult = normalizePluginResult(entirelyInvalid);
    assert.equal(invalidResult.kind, 'programmer');
    assert.equal(Object.hasOwn(invalidResult, 'presentation'), false);
});

test('旧词典对象按固定顺序原样保留', () => {
    const input = {
        pronunciations: [],
        explanations: 'not-an-array',
        plainText: '不应覆盖旧对象路径',
    };
    const result = normalizePluginResult(input);

    assert.deepEqual(result, {
        kind: 'legacy-object',
        render: 'legacy-object',
        raw: input,
        plainText: null,
    });
    assert.equal(result.raw, input);
});

test('未知 Schema 且有 plainText 时安全回退并保留 schema', () => {
    const input = {
        schema: 'vendor.custom.v2',
        plainText: '  完整原文  ',
    };
    const result = normalizePluginResult(input);

    assertFallback(result, 'unknown-schema');
    assert.equal(result.raw, input);
    assert.equal(result.schema, 'vendor.custom.v2');
    assert.equal(result.plainText, '  完整原文  ');
});

test('无字符串 schema 的未知对象回退时 schema 为 null', () => {
    const input = { schema: 1, plainText: 'fallback' };
    const result = normalizePluginResult(input);

    assertFallback(result, 'unknown-schema');
    assert.equal(result.schema, null);
});

test('无效 v1 且有 plainText 时使用 invalid-programmer-schema 回退', () => {
    const input = makeValidResult();
    input.summary = null;
    assertInvalidProgrammerResult(input);
});

test('未知对象没有有效 plainText 时返回 missing-plain-text', () => {
    for (const input of [{}, { plainText: '' }, { plainText: '   ' }]) {
        const result = normalizePluginResult(input);
        assert.equal(result.kind, 'unsupported');
        assert.equal(result.reason, 'missing-plain-text');
        assert.equal(result.plainText, null);
    }
});

test('null、数组、数字和布尔值返回 unsupported-value', () => {
    for (const input of [null, [], 42, true, false]) {
        const result = normalizePluginResult(input);
        assert.equal(result.kind, 'unsupported');
        assert.equal(result.reason, 'unsupported-value');
        assert.equal(result.raw, input);
        assert.equal(result.plainText, null);
    }
});

test('未知对象不会触发隐式字符串转换', () => {
    const input = {
        toString() {
            throw new Error('不应调用 toString');
        },
    };

    assert.doesNotThrow(() => normalizePluginResult(input));
});

test('宿主能力每次调用返回全新的对象和数组', () => {
    const first = createPluginHostCapabilities();
    const second = createPluginHostCapabilities();

    assert.deepEqual(first, {
        name: 'pot-desktop',
        resultSchemas: ['pot.programmer-result.v1'],
        configSchemaVersion: 1,
        presentationCapabilities: ['summary-details', 'per-item-copy'],
    });
    assert.notEqual(first, second);
    assert.notEqual(first.resultSchemas, second.resultSchemas);
    assert.notEqual(first.presentationCapabilities, second.presentationCapabilities);

    first.resultSchemas.push('vendor.custom.v2');
    assert.deepEqual(second.resultSchemas, ['pot.programmer-result.v1']);
});

test('标准化不会修改或冻结输入对象', () => {
    const input = makeValidResult();
    const snapshot = clone(input);
    const result = normalizePluginResult(input);

    assert.deepEqual(input, snapshot);
    assert.equal(Object.isFrozen(input), false);
    assert.equal(Object.isFrozen(input.summary), false);
    assert.notEqual(result.summary, input.summary);
    assert.notEqual(result.identifier.tokens, input.identifier.tokens);
    assert.notEqual(result.tokenMeanings, input.tokenMeanings);
});
