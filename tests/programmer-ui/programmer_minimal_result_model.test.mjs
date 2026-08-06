import test from 'node:test';
import assert from 'node:assert/strict';

import {
    DEFAULT_EXPANDED,
    NAMING_KEYS,
    createFullCopyRequest,
    createInitialExpandedState,
    createNamingCopyRequest,
    createProgrammerMinimalResultIds,
    getCopyableNamingItems,
    getNamingItems,
    getSourceLabelKey,
    getVisibleDetailSections,
    toggleExpanded,
} from '../../src/window/Translate/components/ProgrammerMinimalResult/model.js';

const fixtures = {
    NFC_WriteU16LE: {
        schema: 'pot.programmer-result.v1',
        plainText: '函数名：NFC_WriteU16LE\n词语拆分：NFC · write · U16 · LE\n核心释义：以小端序向 NFC 设备写入 16 位无符号整数\n词义：\n- NFC：近场通信\n- write：写入\n- U16：16 位无符号整数\n- LE：小端序\n命名：\n- camelCase：nfcWriteU16Le\n- PascalCase：NfcWriteU16Le\n- snake_case：nfc_write_u16_le\n- SCREAMING_SNAKE_CASE：NFC_WRITE_U16_LE\n- kebab-case：nfc-write-u16-le',
        summary: { text: '以小端序向 NFC 设备写入 16 位无符号整数', source: 'local', fallback: false },
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
        presentation: { preferredDensity: 'minimal', initiallyExpanded: [] },
    },
    getCustomxyzValue: {
        schema: 'pot.programmer-result.v1',
        plainText: '函数名：getCustomxyzValue\n词语拆分：get · Customxyz · Value\n核心释义：获取自定义 XYZ 值\n词义：\n- get：获取\n- Customxyz：自定义 XYZ〔AI〕\n- Value：值\n命名：\n- camelCase：getCustomxyzValue\n- PascalCase：GetCustomxyzValue\n- snake_case：get_customxyz_value\n- SCREAMING_SNAKE_CASE：GET_CUSTOMXYZ_VALUE\n- kebab-case：get-customxyz-value',
        summary: { text: '获取自定义 XYZ 值', source: 'local_ai', fallback: false },
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
        presentation: { preferredDensity: 'minimal', initiallyExpanded: [] },
    },
    RxBufLen: {
        schema: 'pot.programmer-result.v1',
        plainText: '类名：RxBufLen\n词语拆分：Rx · Buf · Len\nAI 释义：接收缓冲区的长度\n词义：\n- Rx：接收\n- Buf：缓冲区\n- Len：长度\n命名：\n- camelCase：rxBufLen\n- PascalCase：RxBufLen\n- snake_case：rx_buf_len\n- SCREAMING_SNAKE_CASE：RX_BUF_LEN\n- kebab-case：rx-buf-len',
        summary: { text: '接收缓冲区的长度', source: 'ai', fallback: false },
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
        presentation: { preferredDensity: 'minimal', initiallyExpanded: [] },
    },
    ST25DV_i2c_WriteData: {
        schema: 'pot.programmer-result.v1',
        plainText: '函数名：ST25DV_i2c_WriteData\n词语拆分：ST25DV · I2C · write · data\n核心释义：ST25DV I2C 写入数据\n词义：\n- ST25DV：技术缩写或数字，保留原文\n- I2C：I²C 总线\n- write：写入\n- data：数据\n命名：\n- camelCase：st25dvI2cWriteData\n- PascalCase：St25dvI2cWriteData\n- snake_case：st25dv_i2c_write_data\n- SCREAMING_SNAKE_CASE：ST25DV_I2C_WRITE_DATA\n- kebab-case：st25dv-i2c-write-data\n诊断：AI 请求未完成，已使用完整本地结果。',
        summary: { text: 'ST25DV I2C 写入数据', source: 'local_fallback', fallback: true },
        identifier: {
            original: 'ST25DV_i2c_WriteData',
            detectedType: 'function',
            detectionMode: 'auto',
            tokens: ['ST25DV', 'I2C', 'write', 'data'],
        },
        tokenMeanings: [
            { index: 0, token: 'ST25DV', meaning: '技术缩写或数字，保留原文', source: 'literal' },
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
        presentation: { preferredDensity: 'minimal', initiallyExpanded: ['diagnostics'] },
    },
};

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

test('默认折叠状态固定为 false，且不读取 presentation.initiallyExpanded', () => {
    assert.equal(DEFAULT_EXPANDED, false);
    assert.equal(createInitialExpandedState(fixtures.ST25DV_i2c_WriteData), false);
    assert.equal(toggleExpanded(false), true);
    assert.equal(toggleExpanded(true), false);
});

test('详情 section 使用固定顺序，空 diagnostics 完全隐藏', () => {
    for (const [name, fixture] of Object.entries(fixtures)) {
        const sections = getVisibleDetailSections(fixture);
        const expected = ['identifier', 'tokenMeanings', 'naming'];
        if (name === 'ST25DV_i2c_WriteData') expected.push('diagnostics');
        assert.deepEqual(sections, expected);
    }
});

test('四种 summary source 稳定映射到同名标签 key', () => {
    assert.equal(getSourceLabelKey(fixtures.NFC_WriteU16LE.summary.source), 'local');
    assert.equal(getSourceLabelKey(fixtures.getCustomxyzValue.summary.source), 'local_ai');
    assert.equal(getSourceLabelKey(fixtures.RxBufLen.summary.source), 'ai');
    assert.equal(getSourceLabelKey(fixtures.ST25DV_i2c_WriteData.summary.source), 'local_fallback');
    assert.equal(getSourceLabelKey('unknown'), null);
});

test('naming 项保持固定顺序，空字符串只移除对应可复制项', () => {
    const naming = clone(fixtures.NFC_WriteU16LE.naming);
    naming.snakeCase = '';

    const items = getNamingItems(naming);
    assert.deepEqual(
        items.map((item) => item.key),
        NAMING_KEYS
    );
    assert.equal(items.find((item) => item.key === 'snakeCase').copyable, false);
    assert.deepEqual(
        getCopyableNamingItems(naming).map((item) => item.key),
        ['camelCase', 'pascalCase', 'screamingSnakeCase', 'kebabCase']
    );
    assert.equal(naming.snakeCase, '');
});

test('复制全文严格使用 plainText 和 full scope', () => {
    const request = createFullCopyRequest(fixtures.getCustomxyzValue);
    assert.deepEqual(request, {
        text: fixtures.getCustomxyzValue.plainText,
        meta: { scope: 'full' },
    });
    assert.notEqual(request.text, fixtures.getCustomxyzValue.summary.text);
});

test('命名逐项复制严格使用原始 naming 值、scope 和 key', () => {
    const request = createNamingCopyRequest(fixtures.RxBufLen, 'screamingSnakeCase');
    assert.deepEqual(request, {
        text: 'RX_BUF_LEN',
        meta: { scope: 'naming', key: 'screamingSnakeCase' },
    });
    assert.throws(() => createNamingCopyRequest(fixtures.RxBufLen, 'unknown'), RangeError);
});

test('idPrefix 生成稳定且互相匹配的 DOM ID', () => {
    const first = createProgrammerMinimalResultIds('result 42');
    const second = createProgrammerMinimalResultIds('result 42');

    assert.deepEqual(first, second);
    assert.deepEqual(first, {
        root: 'result-42-root',
        toggle: 'result-42-toggle',
        details: 'result-42-details',
        copyStatus: 'result-42-copy-status',
    });
    assert.notEqual(createProgrammerMinimalResultIds('result-43').details, first.details);
});

test('所有模型函数均不修改输入对象', () => {
    for (const fixture of Object.values(fixtures)) {
        const before = clone(fixture);

        createInitialExpandedState(fixture);
        getVisibleDetailSections(fixture);
        getNamingItems(fixture.naming);
        getCopyableNamingItems(fixture.naming);
        createFullCopyRequest(fixture);
        for (const key of NAMING_KEYS) createNamingCopyRequest(fixture, key);

        assert.deepEqual(fixture, before);
    }
});
