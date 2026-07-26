const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const {
    analyzeIdentifier,
    splitIdentifier,
    tokenizeChinese,
    detectIdentifierType,
    toCamelCase,
    toPascalCase,
    toSnakeCase,
    toScreamingSnakeCase
} = require('../main.js');

test('splits camelCase', () => {
    assert.deepEqual(splitIdentifier('getUserName'), ['get', 'user', 'name']);
});

test('keeps uppercase acronym together', () => {
    assert.deepEqual(splitIdentifier('HTTPRequestCode'), ['HTTP', 'request', 'code']);
    assert.deepEqual(splitIdentifier('HTTPServer'), ['HTTP', 'server']);
    assert.deepEqual(splitIdentifier('HTTPSClient'), ['HTTPS', 'client']);
});

test('handles MCU style mixed identifier', () => {
    assert.deepEqual(splitIdentifier('ST25DV_i2c_WriteData'), ['ST25DV', 'I2C', 'write', 'data']);
});

test('protects embedded acronyms with digits', () => {
    assert.deepEqual(splitIdentifier('ST25DVConfig'), ['ST25DV', 'config']);
    assert.deepEqual(splitIdentifier('getST25DVUID'), ['get', 'ST25DV', 'UID']);
    assert.deepEqual(splitIdentifier('IPv6Address'), ['IPv6', 'address']);
    assert.deepEqual(splitIdentifier('getIPv6Address'), ['get', 'IPv6', 'address']);
    assert.deepEqual(splitIdentifier('I2CAddress'), ['I2C', 'address']);
    assert.deepEqual(splitIdentifier('i2cAddress'), ['I2C', 'address']);
    assert.deepEqual(splitIdentifier('RS485Frame'), ['RS485', 'frame']);
});

test('does not split a larger unknown acronym around a known substring', () => {
    assert.deepEqual(splitIdentifier('RAIIHelper'), ['RAII', 'helper']);
});

test('handles digits around known acronym', () => {
    assert.deepEqual(splitIdentifier('parseJSON2Object'), ['parse', 'JSON', '2', 'object']);
});

test('converts naming styles', () => {
    const words = ['get', 'HTTP', 'response', 'code'];
    assert.equal(toCamelCase(words), 'getHttpResponseCode');
    assert.equal(toCamelCase(words, 'preserve'), 'getHTTPResponseCode');
    assert.equal(toPascalCase(words), 'GetHttpResponseCode');
    assert.equal(toSnakeCase(words), 'get_http_response_code');
    assert.equal(toScreamingSnakeCase(words), 'GET_HTTP_RESPONSE_CODE');
});

test('supports common Chinese naming description', () => {
    assert.deepEqual(tokenizeChinese('读取用户配置').words, ['read', 'user', 'config']);
    assert.equal(
        analyzeIdentifier('读取用户配置', { identifierType: 'function', outputStyle: 'camel' }),
        'readUserConfig'
    );
    assert.match(analyzeIdentifier('读取用户配置'), /识别类型：函数名/);
});

test('adds boolean prefix in boolean mode', () => {
    assert.equal(
        analyzeIdentifier('连接成功', { identifierType: 'boolean', outputStyle: 'camel' }),
        'isConnectionSuccessful'
    );
});

test('detects common embedded C function patterns', () => {
    for (const input of ['ST25DV_i2c_WriteData', 'FreeRTOS_TaskInit', 'UART_IRQHandler', 'HAL_GPIO_EXTI_Callback']) {
        const words = splitIdentifier(input);
        assert.equal(detectIdentifierType(input, words), 'function', input);
    }
});

test('does not treat a later noun-like action word as a function', () => {
    assert.match(analyzeIdentifier('最大 UART 重试次数'), /识别类型：变量名/);
    const words = splitIdentifier('maxRetryCount');
    assert.equal(detectIdentifierType('maxRetryCount', words), 'variable');
});

test('creates a complete report by default', () => {
    const report = analyzeIdentifier('retryFailedCharacters');
    assert.match(report, /识别类型：函数名/);
    assert.match(report, /camelCase：retryFailedCharacters/);
    assert.match(report, /snake_case：retry_failed_characters/);
});

test('formats Chinese descriptions with readable acronym spacing', () => {
    assert.match(analyzeIdentifier('ST25DV_i2c_WriteData'), /中文含义：ST25DV I2C 写入数据/);
});

test('loads through the same eval entry contract used by Pot', async () => {
    const script = fs.readFileSync(path.join(__dirname, '../main.js'), 'utf8');
    const pluginTranslate = vm.runInNewContext(`${script}\ntranslate`);
    assert.equal(typeof pluginTranslate, 'function');
    const result = await pluginTranslate('getHTTPResponseCode', 'auto', 'zh_cn', { config: {} });
    assert.match(result, /HTTP/);
});
