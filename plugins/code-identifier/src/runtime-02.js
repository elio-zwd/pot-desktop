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
const SORTED_PROGRAMMING_PHRASES = Object.entries(PROGRAMMING_PHRASES)
    .sort((a, b) => b[0].split(' ').length - a[0].split(' ').length);

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

function findKnownAcronym(chunk) {
    let best = null;
    for (let index = 0; index < chunk.length; index += 1) {
        for (const acronym of SORTED_ACRONYMS) {
            const nextCharacter = chunk[index + acronym.length];
            const leftBoundary = index === 0 || /[a-z0-9]/.test(chunk[index - 1]);
            const rightBoundary = nextCharacter === undefined || /[A-Z0-9]/.test(nextCharacter);
            const exactMatch = leftBoundary && rightBoundary && chunk.startsWith(acronym, index);
            const digitAcronymAtStart =
                index === 0 &&
                /\d/.test(acronym) &&
                chunk.slice(0, acronym.length).toLowerCase() === acronym.toLowerCase() &&
                rightBoundary;
            if (exactMatch || digitAcronymAtStart) {
                if (!best || index < best.index || (index === best.index && acronym.length > best.acronym.length)) {
                    best = { index, acronym };
                }
            }
        }
        if (best && best.index === index) break;
    }
    return best;
}

function splitChunkWithoutKnownAcronyms(chunk) {
    const separated = chunk
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
        .replace(/([A-Za-z])(\d)/g, '$1 $2')
        .replace(/(\d)([A-Za-z])/g, '$1 $2');
    return separated.split(/\s+/).map(normalizeWord).filter(Boolean);
}

function splitChunk(chunk) {
    const trimmed = chunk.trim();
    if (!trimmed) return [];
    const exactAcronym = canonicalAcronym(trimmed);
    if (exactAcronym) return [exactAcronym];
    const match = findKnownAcronym(trimmed);
    if (!match) return splitChunkWithoutKnownAcronyms(trimmed);
    const prefix = trimmed.slice(0, match.index);
    const suffix = trimmed.slice(match.index + match.acronym.length);
    return [...splitChunk(prefix), match.acronym, ...splitChunk(suffix)];
}

function splitIdentifier(input) {
    const cleaned = String(input)
        .trim()
        .replace(/^[\'"`]+|[\'"`;]+$/g, '')
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
