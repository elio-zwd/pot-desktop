/**
 * Pot Code Identifier plugin.
 *
 * Pot loads plugin scripts with eval(), so this file intentionally has no imports.
 * Keep the implementation self-contained so it can be packed directly into a
 * .potext archive.
 */

const KNOWN_ACRONYMS = [
    'ACK', 'ADC', 'AES', 'AI', 'API', 'ASCII', 'BLE', 'BSP', 'CAN', 'CPU', 'CRC',
    'CSS', 'DAC', 'DMA', 'DNS', 'EEPROM', 'FIFO', 'GPIO', 'GPU', 'HAL', 'HTML',
    'HTTP', 'HTTPS', 'I2C', 'IDE', 'ID', 'IP', 'IPv4', 'IPv6', 'ISR', 'JSON',
    'JTAG', 'MAC', 'MCU', 'NACK', 'NDEF', 'NFC', 'OTA', 'PID', 'PWM', 'RAM',
    'REST', 'ROM', 'RPC', 'RS232', 'RS485', 'RTOS', 'SDK', 'SPI', 'SQL', 'SRAM',
    'SSH', 'ST25DV', 'TCP', 'TLS', 'UART', 'UDP', 'UI', 'UID', 'URI', 'URL',
    'USART', 'USB', 'UTF8', 'UUID', 'UX', 'XML'
];

const ACRONYM_MAP = new Map(KNOWN_ACRONYMS.map((item) => [item.toLowerCase(), item]));

const ACTION_WORDS = new Set([
    'add', 'build', 'calculate', 'check', 'clear', 'close', 'convert', 'create',
    'decode', 'delete', 'disable', 'enable', 'encode', 'fetch', 'find', 'format',
    'generate', 'get', 'handle', 'init', 'initialize', 'load', 'open', 'parse',
    'read', 'receive', 'remove', 'reset', 'retry', 'save', 'search', 'send', 'set',
    'start', 'stop', 'update', 'validate', 'verify', 'wait', 'write'
]);

const BOOLEAN_PREFIXES = new Set(['is', 'has', 'can', 'should', 'needs', 'supports', 'enabled', 'disabled']);

const ENGLISH_TO_CHINESE = {
    add: '添加', address: '地址', buffer: '缓冲区', build: '构建', calculate: '计算',
    can: '可以', character: '角色', check: '检查', checksum: '校验和', clear: '清除',
    close: '关闭', code: '代码', command: '命令', config: '配置', configuration: '配置',
    connection: '连接', constant: '常量', convert: '转换', count: '次数', create: '创建',
    data: '数据', decode: '解码', delete: '删除', device: '设备', disabled: '已禁用',
    enable: '启用', enabled: '已启用', encode: '编码', error: '错误', failed: '失败',
    fetch: '获取', file: '文件', find: '查找', firmware: '固件', flag: '标志', format: '格式化',
    frame: '帧', function: '函数', generate: '生成', get: '获取', handle: '处理', has: '具有',
    identifier: '标识符', init: '初始化', initialize: '初始化', interrupt: '中断', is: '是否',
    length: '长度', load: '加载', max: '最大', message: '消息', min: '最小', name: '名称',
    needs: '需要', open: '打开', parameter: '参数', parse: '解析', protocol: '协议', queue: '队列',
    read: '读取', receive: '接收', register: '寄存器', remaining: '剩余', remove: '移除',
    request: '请求', reset: '重置', response: '响应', result: '结果', retry: '重试',
    retryable: '可重试', save: '保存', search: '搜索', semaphore: '信号量', send: '发送',
    set: '设置', should: '应当', start: '启动', state: '状态', status: '状态', stop: '停止',
    successful: '成功', supports: '支持', task: '任务', timeout: '超时', timer: '定时器',
    update: '更新', user: '用户', validate: '校验', value: '值', variable: '变量', verify: '验证',
    wait: '等待', watchdog: '看门狗', write: '写入'
};

const CHINESE_PHRASES = {
    '最大重试次数': ['max', 'retry', 'count'],
    '剩余可重试角色': ['remaining', 'retryable', 'character'],
    '读取用户配置': ['read', 'user', 'config'],
    '检查连接状态': ['check', 'connection', 'status'],
    '连接是否成功': ['is', 'connection', 'successful'],
    '读取NFC配置': ['read', 'NFC', 'config'],
    '写入NFC数据': ['write', 'NFC', 'data'],
    '解析数据帧': ['parse', 'data', 'frame'],
    '校验数据帧': ['validate', 'data', 'frame'],
    '发送命令': ['send', 'command'],
    '接收响应': ['receive', 'response'],
    '重试失败角色': ['retry', 'failed', 'character'],
    '初始化设备': ['init', 'device'],
    '重置看门狗': ['reset', 'watchdog'],
    '更新固件': ['update', 'firmware'],
    '用户配置': ['user', 'config'],
    '连接状态': ['connection', 'status'],
    '数据帧': ['data', 'frame'],
    '错误码': ['error', 'code'],
    '状态码': ['status', 'code'],
    '重试次数': ['retry', 'count'],
    '函数名': ['function', 'name'],
    '变量名': ['variable', 'name'],
    '标识符': ['identifier'],
    '最大': ['max'], '最小': ['min'], '剩余': ['remaining'], '可重试': ['retryable'],
    '获取': ['get'], '读取': ['read'], '写入': ['write'], '设置': ['set'], '更新': ['update'],
    '删除': ['delete'], '创建': ['create'], '检查': ['check'], '验证': ['verify'], '校验': ['validate'],
    '解析': ['parse'], '转换': ['convert'], '格式化': ['format'], '初始化': ['init'],
    '启动': ['start'], '停止': ['stop'], '重试': ['retry'], '发送': ['send'], '接收': ['receive'],
    '加载': ['load'], '保存': ['save'], '清除': ['clear'], '重置': ['reset'], '处理': ['handle'],
    '等待': ['wait'], '查找': ['find'], '搜索': ['search'], '构建': ['build'], '生成': ['generate'],
    '是否': ['is'], '可以': ['can'], '支持': ['supports'], '启用': ['enabled'], '禁用': ['disabled'],
    '用户': ['user'], '配置': ['config'], '数据': ['data'], '状态': ['status'], '响应': ['response'],
    '请求': ['request'], '错误': ['error'], '结果': ['result'], '消息': ['message'], '连接': ['connection'],
    '超时': ['timeout'], '失败': ['failed'], '成功': ['successful'], '角色': ['character'],
    '函数': ['function'], '变量': ['variable'], '名称': ['name'], '设备': ['device'], '帧': ['frame'],
    '协议': ['protocol'], '地址': ['address'], '寄存器': ['register'], '中断': ['interrupt'],
    '定时器': ['timer'], '任务': ['task'], '队列': ['queue'], '信号量': ['semaphore'],
    '看门狗': ['watchdog'], '固件': ['firmware'], '参数': ['parameter'], '命令': ['command'],
    '长度': ['length'], '缓冲区': ['buffer'], '值': ['value'], '代码': ['code'], '次数': ['count']
};

const SORTED_CHINESE_PHRASES = Object.entries(CHINESE_PHRASES)
    .sort((a, b) => b[0].length - a[0].length);

const TYPE_LABELS = {
    auto: '自动判断', function: '函数名', variable: '变量名', boolean: '布尔变量',
    class: '类名', constant: '常量/宏', file: '文件名'
};

function canonicalAcronym(token) {
    return ACRONYM_MAP.get(String(token).toLowerCase()) || null;
}

function normalizeWord(token) {
    const clean = String(token).replace(/^\$+/, '').replace(/[^A-Za-z0-9]/g, '');
    if (!clean) return null;
    const acronym = canonicalAcronym(clean);
    if (acronym) return acronym;
    if (/^[A-Z]{2,}\d*$/.test(clean)) return clean;
    return clean.toLowerCase();
}

function splitChunk(chunk) {
    const trimmed = chunk.trim();
    if (!trimmed) return [];

    const exactAcronym = canonicalAcronym(trimmed);
    if (exactAcronym) return [exactAcronym];

    const separated = trimmed
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
        .replace(/([A-Za-z])(\d)/g, '$1 $2')
        .replace(/(\d)([A-Za-z])/g, '$1 $2');

    return separated
        .split(/\s+/)
        .map(normalizeWord)
        .filter(Boolean);
}

function splitIdentifier(input) {
    const cleaned = String(input)
        .trim()
        .replace(/^['"`]+|['"`;]+$/g, '')
        .replace(/\(\s*\)$/, '')
        .replace(/[\s_.\-/:\\]+/g, ' ');

    return cleaned.split(/\s+/).flatMap(splitChunk).filter(Boolean);
}

function tokenizeChinese(input) {
    const words = [];
    const unknown = [];
    let index = 0;

    while (index < input.length) {
        const rest = input.slice(index);
        const whitespace = rest.match(/^\s+/);
        if (whitespace) {
            index += whitespace[0].length;
            continue;
        }

        const ascii = rest.match(/^[A-Za-z][A-Za-z0-9]*/);
        if (ascii) {
            words.push(...splitChunk(ascii[0]));
            index += ascii[0].length;
            continue;
        }

        let matched = false;
        for (const [phrase, tokens] of SORTED_CHINESE_PHRASES) {
            if (rest.startsWith(phrase)) {
                words.push(...tokens.map((token) => canonicalAcronym(token) || token.toLowerCase()));
                index += phrase.length;
                matched = true;
                break;
            }
        }
        if (matched) continue;

        const char = input[index];
        if (/[,，。.!！?？、;；:：()（）]/.test(char)) {
            index += 1;
            continue;
        }
        unknown.push(char);
        index += 1;
    }

    return { words, unknown: [...new Set(unknown)].join('') };
}

function isAcronym(word) {
    return canonicalAcronym(word) !== null || /^[A-Z]{2,}\d*$/.test(word);
}

function lowerWord(word) {
    return String(word).toLowerCase();
}

function titleWord(word, acronymStyle) {
    const canonical = canonicalAcronym(word) || word;
    if (isAcronym(canonical) && acronymStyle === 'preserve') return canonical;
    const lower = canonical.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function toCamelCase(words, acronymStyle = 'standard') {
    if (!words.length) return '';
    return lowerWord(words[0]) + words.slice(1).map((word) => titleWord(word, acronymStyle)).join('');
}

function toPascalCase(words, acronymStyle = 'standard') {
    return words.map((word) => titleWord(word, acronymStyle)).join('');
}

function toSnakeCase(words) {
    return words.map(lowerWord).join('_');
}

function toScreamingSnakeCase(words) {
    return words.map((word) => lowerWord(word).toUpperCase()).join('_');
}

function toKebabCase(words) {
    return words.map(lowerWord).join('-');
}

function detectIdentifierType(input, words) {
    const original = String(input).trim();
    const lowerWords = words.map(lowerWord);

    if (/^[A-Z][A-Z0-9_]*$/.test(original) && original.includes('_')) return 'constant';
    if (BOOLEAN_PREFIXES.has(lowerWords[0])) return 'boolean';
    if (lowerWords.slice(0, 3).some((word) => ACTION_WORDS.has(word))) return 'function';
    if (/^[A-Z][A-Za-z0-9]*$/.test(original) && !/^[A-Z0-9]+$/.test(original)) return 'class';
    if (/[.\-]/.test(original)) return 'file';
    return 'variable';
}

function applyTypeHints(words, type) {
    const result = [...words];
    if (type === 'boolean' && !BOOLEAN_PREFIXES.has(lowerWord(result[0] || ''))) {
        result.unshift('is');
    }
    return result;
}

function toChineseDescription(words) {
    return words.map((word) => {
        const acronym = canonicalAcronym(word);
        if (acronym) return acronym;
        return ENGLISH_TO_CHINESE[lowerWord(word)] || word;
    }).join('');
}

function formatByStyle(words, style, acronymStyle) {
    switch (style) {
        case 'camel': return toCamelCase(words, acronymStyle);
        case 'pascal': return toPascalCase(words, acronymStyle);
        case 'snake': return toSnakeCase(words);
        case 'screaming': return toScreamingSnakeCase(words);
        case 'kebab': return toKebabCase(words);
        case 'words': return words.map((word) => canonicalAcronym(word) || lowerWord(word)).join(' ');
        case 'chinese': return toChineseDescription(words);
        default: return '';
    }
}

function createReport(input, words, type, acronymStyle, unknownChinese) {
    const lines = [
        `原文：${String(input).trim()}`,
        `识别类型：${TYPE_LABELS[type] || type}`,
        `拆分：${words.map((word) => canonicalAcronym(word) || word).join(' | ')}`,
        `中文含义：${toChineseDescription(words)}`,
        '',
        `camelCase：${toCamelCase(words, acronymStyle)}`,
        `PascalCase：${toPascalCase(words, acronymStyle)}`,
        `snake_case：${toSnakeCase(words)}`,
        `SCREAMING_SNAKE_CASE：${toScreamingSnakeCase(words)}`,
        `kebab-case：${toKebabCase(words)}`
    ];

    if (unknownChinese) {
        lines.push('', `未收录中文：${unknownChinese}`, '提示：可先使用常见编程术语，后续版本会继续扩展本地词典。');
    }
    return lines.join('\n');
}

function analyzeIdentifier(text, config = {}) {
    const input = String(text ?? '').trim();
    if (!input) throw new Error('请输入函数名、变量名或中文命名描述。');
    if (input.length > 500) throw new Error('输入过长。第一版仅处理 500 个字符以内的标识符或命名描述。');

    const isChineseInput = /[\u3400-\u9fff]/.test(input);
    const tokenized = isChineseInput ? tokenizeChinese(input) : { words: splitIdentifier(input), unknown: '' };
    if (!tokenized.words.length) throw new Error('没有识别到可处理的编程标识符。');

    const configuredType = config.identifierType || 'auto';
    const detectedType = configuredType === 'auto'
        ? detectIdentifierType(input, tokenized.words)
        : configuredType;
    const words = applyTypeHints(tokenized.words, detectedType);
    const acronymStyle = config.acronymStyle || 'standard';
    const outputStyle = config.outputStyle || 'report';

    if (outputStyle !== 'report') {
        return formatByStyle(words, outputStyle, acronymStyle);
    }
    return createReport(input, words, detectedType, acronymStyle, tokenized.unknown);
}

async function translate(text, from, to, options = {}) {
    const config = options.config || {};
    return analyzeIdentifier(text, config);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        analyzeIdentifier,
        splitIdentifier,
        tokenizeChinese,
        detectIdentifierType,
        toCamelCase,
        toPascalCase,
        toSnakeCase,
        toScreamingSnakeCase,
        toKebabCase,
        translate
    };
}
