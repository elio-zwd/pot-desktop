}

function toKebabCase(words) {
    return words.map(lowerWord).join('-');
}

function detectIdentifierType(input, words) {
    const original = String(input).trim();
    const lowerWords = words.map(lowerWord);
    const firstWord = lowerWords[0];
    const lastWord = lowerWords[lowerWords.length - 1];
    if (/^[A-Z][A-Z0-9_]*$/.test(original) && original.includes('_')) return 'constant';
    if (BOOLEAN_PREFIXES.has(firstWord)) return 'boolean';
    if (/[.\-]/.test(original)) return 'file';
    if (/^[A-Z][A-Za-z0-9]*$/.test(original) && !/^[A-Z0-9]+$/.test(original)) return 'class';
    if (FUNCTION_PREFIXES.has(firstWord)) return 'function';
    if (FUNCTION_SUFFIXES.has(lastWord)) return 'function';
    const vendorActionIndex = lowerWords.findIndex((word, index) =>
        index > 0 && ACTION_WORDS.has(word) && words.slice(0, index).every((prefix) => isAcronym(prefix))
    );
    if (vendorActionIndex >= 0) return 'function';
    return 'variable';
}

function applyTypeHints(words, type) {
    const result = [...words];
    if (type === 'boolean' && !BOOLEAN_PREFIXES.has(lowerWord(result[0] || ''))) {
        result.unshift('is');
    }
    return result;
}

function joinChineseParts(parts) {
    return parts.reduce((result, part) => {
        if (!result) return part;
        const previousIsAscii = /[A-Za-z0-9]$/.test(result);
        const currentIsAscii = /^[A-Za-z0-9]/.test(part);
        return result + (previousIsAscii || currentIsAscii ? ' ' : '') + part;
    }, '');
}

function conciseGloss(translation) {
    if (!translation) return '';
    const firstLine = String(translation)
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find((line) => line && !/^\[(?:网络|网络释义|例句)\]/.test(line));
    if (!firstLine) return '';
    const withoutTrait = firstLine.replace(/^(?:[a-z]{1,5}\.|\[[^\]]+\])\s*/i, '');
    return withoutTrait.split(/[；;，,。]/)[0].trim();
}

function generalEntryLines(entry, maxLines = 2) {
    if (!entry || !entry.translation) return [];
    return String(entry.translation)
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !/^\[(?:网络|网络释义|例句)\]/.test(line))
        .slice(0, maxLines);
}

function programmingTerm(word) {
    const lower = lowerWord(word);
    if (PROGRAMMING_TERMS[lower]) return PROGRAMMING_TERMS[lower];
    const candidates = [];
    if (lower.endsWith('ies') && lower.length > 3) candidates.push(`${lower.slice(0, -3)}y`);
    if (lower.endsWith('es') && lower.length > 2) candidates.push(lower.slice(0, -2));
    if (lower.endsWith('s') && lower.length > 1) candidates.push(lower.slice(0, -1));
    for (const candidate of candidates) {
        if (PROGRAMMING_TERMS[candidate]) return PROGRAMMING_TERMS[candidate];
    }
    return '';
}

function programmingPhraseParts(words, generalEntries = new Map()) {
    const lowerWords = words.map(lowerWord);
    const parts = [];
    const usedProgramming = new Set();
    let index = 0;
    while (index < words.length) {
        let phraseMatch = null;
        for (const [phrase, translation] of SORTED_PROGRAMMING_PHRASES) {
            const length = phrase.split(' ').length;
            if (lowerWords.slice(index, index + length).join(' ') === phrase) {
                phraseMatch = { length, translation };
                break;
            }
        }
        if (phraseMatch) {
            parts.push(phraseMatch.translation);
            for (let offset = 0; offset < phraseMatch.length; offset += 1) usedProgramming.add(index + offset);
            index += phraseMatch.length;
            continue;
        }
        const word = words[index];
        const lower = lowerWord(word);
        const acronym = canonicalAcronym(word);
        if (acronym) {
            parts.push(acronym);
            usedProgramming.add(index);
        } else if (programmingTerm(lower)) {
            parts.push(programmingTerm(lower));
            usedProgramming.add(index);
        } else {
            const entry = generalEntries.get(lower);
            parts.push(conciseGloss(entry && entry.translation) || word);
        }
        index += 1;
    }
    return {
        text: joinChineseParts(parts),
        hasProgrammingMeaning: usedProgramming.size > 0
    };
}

function toProgrammingDescription(words) {
    return programmingPhraseParts(words).text;
}

function formatByStyle(words, style, acronymStyle) {
    switch (style) {
        case 'camel': return toCamelCase(words, acronymStyle);
        case 'pascal': return toPascalCase(words, acronymStyle);
        case 'snake': return toSnakeCase(words);
        case 'screaming': return toScreamingSnakeCase(words);
        case 'kebab': return toKebabCase(words);
        case 'words': return words.map((word) => canonicalAcronym(word) || lowerWord(word)).join(' ');
        case 'chinese': return toProgrammingDescription(words);
        default: return '';
    }
}

function prepareIdentifier(text, config = {}) {
    const input = String(text ?? '').trim();
    if (!input) throw new Error('请输入函数名、变量名、英文单词或中文命名描述。');
    if (input.length > 500) throw new Error('输入过长。当前版本仅处理 500 个字符以内的标识符或简短文本。');
    const isChineseInput = /[\u3400-\u9fff]/.test(input);
    const tokenized = isChineseInput ? tokenizeChinese(input) : { words: splitIdentifier(input), unknown: '' };
    if (!tokenized.words.length) throw new Error('没有识别到可处理的英文单词或编程标识符。');
    const configuredType = config.identifierType || 'auto';
    const detectedType = configuredType === 'auto'
        ? detectIdentifierType(input, tokenized.words)
        : configuredType;
    return {
        input,
        isChineseInput,
        unknownChinese: tokenized.unknown,
        detectedType,
        words: applyTypeHints(tokenized.words, detectedType),
        acronymStyle: config.acronymStyle || 'standard',
        outputStyle: config.outputStyle || 'report',
        dictionaryMode: config.dictionaryMode || 'both'
    };
}

async function selectDictionaryRows(db, words) {
    const keys = [...new Set(words.map(lowerWord).filter((word) => /^[a-z][a-z0-9'\-]*$/.test(word)))];
    if (!keys.length) return [];
    const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
    return db.select(
