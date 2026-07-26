        `SELECT word, lemma, phonetic, translation, pos FROM dictionary WHERE word IN (${placeholders})`,
        keys
    );
}

async function lookupGeneralDictionary(words, options = {}) {
    const Database = options.utils && options.utils.Database;
    if (!Database || typeof Database.load !== 'function') {
        return {
            entries: new Map(),
            warning: '普通英语词典未加载；当前结果仅使用内置编程术语。'
        };
    }
    let db;
    try {
        db = await Database.load(DICTIONARY_DB_PATH);
        const rows = await selectDictionaryRows(db, words);
        const entries = new Map();
        for (const row of rows || []) {
            entries.set(lowerWord(row.word), row);
        }
        return { entries, warning: '' };
    } catch (error) {
        return {
            entries: new Map(),
            warning: `普通英语词典读取失败：${error && error.message ? error.message : String(error)}`
        };
    } finally {
        if (db && typeof db.close === 'function') {
            try { await db.close(); } catch (_) { /* ignore close failures */ }
        }
    }
}

function formatGeneralDictionary(words, entries) {
    const lines = [];
    const unknownWords = [];
    for (const word of words) {
        const lower = lowerWord(word);
        const entry = entries.get(lower);
        const acronym = canonicalAcronym(word);
        if (entry) {
            const phonetic = entry.phonetic ? ` /${entry.phonetic}/` : '';
            const lemma = entry.lemma && lowerWord(entry.lemma) !== lower ? `（原形：${entry.lemma}）` : '';
            const senses = generalEntryLines(entry);
            lines.push(`- ${canonicalAcronym(word) || lower}${phonetic}${lemma}：${senses.join('；') || '暂无中文释义'}`);
        } else if (acronym || /^\d+$/.test(lower)) {
            lines.push(`- ${acronym || word}：技术缩写或数字，保留原文`);
        } else {
            lines.push(`- ${lower}：未收录`);
            unknownWords.push(lower);
        }
    }
    return { lines, unknownWords: [...new Set(unknownWords)] };
}

async function buildDictionarySections(model, options = {}) {
    const lookup = await lookupGeneralDictionary(model.words, options);
    const programming = programmingPhraseParts(model.words, lookup.entries);
    const general = formatGeneralDictionary(model.words, lookup.entries);
    return {
        programmingText: programming.text,
        programmingLabel: programming.hasProgrammingMeaning ? '编程含义' : '组合含义',
        generalLines: general.lines,
        unknownWords: general.unknownWords,
        warning: lookup.warning
    };
}

function renderChineseOnly(model, sections) {
    let lines;
    switch (model.dictionaryMode) {
        case 'programming':
            lines = [sections.programmingText];
            break;
        case 'general':
            lines = [...sections.generalLines];
            break;
        case 'both':
        default:
            lines = [
                `${sections.programmingLabel}：${sections.programmingText}`,
                '普通词义：',
                ...sections.generalLines
            ];
            break;
    }
    if (sections.warning && model.dictionaryMode !== 'programming') {
        lines.push(`词典提示：${sections.warning}`);
    }
    return lines.join('\n');
}

function createReport(model, sections) {
    const lines = [
        `原文：${model.input}`,
        `识别类型：${TYPE_LABELS[model.detectedType] || model.detectedType}`,
        `拆分：${model.words.map((word) => canonicalAcronym(word) || word).join(' | ')}`
    ];
    if (model.dictionaryMode === 'programming' || model.dictionaryMode === 'both') {
        lines.push(`${sections.programmingLabel}：${sections.programmingText}`);
    }
    if (model.dictionaryMode === 'general' || model.dictionaryMode === 'both') {
        lines.push('普通词义：', ...sections.generalLines);
    }
    if (sections.unknownWords.length > 0) {
        lines.push(`未收录英文：${sections.unknownWords.join(', ')}`);
    }
    if (model.unknownChinese) {
        lines.push(`未收录中文：${model.unknownChinese}`);
    }
    if (sections.warning) {
        lines.push(`词典提示：${sections.warning}`);
    }
    lines.push(
        '',
        `camelCase：${toCamelCase(model.words, model.acronymStyle)}`,
        `PascalCase：${toPascalCase(model.words, model.acronymStyle)}`,
        `snake_case：${toSnakeCase(model.words)}`,
        `SCREAMING_SNAKE_CASE：${toScreamingSnakeCase(model.words)}`,
        `kebab-case：${toKebabCase(model.words)}`
    );
    return lines.join('\n');
}

/**
 * Synchronous local-only analysis kept for tests and integrations that do not
 * provide Pot's Database utility. Pot itself uses translate() below.
 */
function analyzeIdentifier(text, config = {}) {
    const model = prepareIdentifier(text, config);
    if (model.outputStyle !== 'report') {
        return formatByStyle(model.words, model.outputStyle, model.acronymStyle);
    }
    const emptySections = {
        programmingText: toProgrammingDescription(model.words),
        programmingLabel: '编程含义',
        generalLines: [],
        unknownWords: [],
        warning: '普通英语词典未加载；当前结果仅使用内置编程术语。'
    };
    return createReport({ ...model, dictionaryMode: 'programming' }, emptySections);
}

async function translate(text, _from, _to, options = {}) {
    const model = prepareIdentifier(text, options.config || {});
    if (model.outputStyle !== 'report' && model.outputStyle !== 'chinese') {
        return formatByStyle(model.words, model.outputStyle, model.acronymStyle);
    }
    const sections = await buildDictionarySections(model, options);
    if (model.outputStyle === 'chinese') return renderChineseOnly(model, sections);
    return createReport(model, sections);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        analyzeIdentifier,
        buildDictionarySections,
        conciseGloss,
        detectIdentifierType,
