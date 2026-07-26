const test = require('node:test');
const assert = require('node:assert/strict');
const {
    analyzeIdentifier,
    splitIdentifier,
    tokenizeChinese,
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
});

test('handles MCU style mixed identifier', () => {
    assert.deepEqual(splitIdentifier('ST25DV_i2c_WriteData'), ['ST25DV', 'I2C', 'write', 'data']);
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
});

test('adds boolean prefix in boolean mode', () => {
    assert.equal(
        analyzeIdentifier('连接成功', { identifierType: 'boolean', outputStyle: 'camel' }),
        'isConnectionSuccessful'
    );
});

test('creates a complete report by default', () => {
    const report = analyzeIdentifier('retryFailedCharacters');
    assert.match(report, /识别类型：函数名/);
    assert.match(report, /camelCase：retryFailedCharacters/);
    assert.match(report, /snake_case：retry_failed_characters/);
});
