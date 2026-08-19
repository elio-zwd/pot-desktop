const SECTION_TYPES = new Set(['summary', 'metadata', 'dictionary', 'code-list', 'note', 'status']);
const SOURCE_TYPES = new Set(['local', 'ai', 'mixed', 'unknown']);
const SEVERITIES = new Set(['info', 'success', 'warning', 'error']);
const PAIRED_STATES = new Set(['loading', 'complete']);

export const PLUGIN_RESULT_SCHEMA_LIMITS = Object.freeze({
    sections: 24,
    items: 48,
    tokens: 32,
    text: 4000,
    copyText: 12000,
    id: 64,
    token: 128,
});

function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizePrimitive(value, maxLength, allowEmpty = false) {
    if (!['string', 'number', 'boolean'].includes(typeof value)) {
        return '';
    }

    const text = String(value).trim();
    if (!allowEmpty && text === '') {
        return '';
    }
    return text.slice(0, maxLength);
}

function normalizeOptionalText(value, maxLength = PLUGIN_RESULT_SCHEMA_LIMITS.text) {
    return normalizePrimitive(value, maxLength, true);
}

function normalizeId(value, index, type) {
    const raw = normalizePrimitive(value, PLUGIN_RESULT_SCHEMA_LIMITS.id, true);
    const sanitized = raw.replace(/[^A-Za-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    return sanitized || `${type}-${index + 1}`;
}

function normalizeSource(value) {
    return SOURCE_TYPES.has(value) ? value : 'unknown';
}

function normalizeSeverity(value) {
    return SEVERITIES.has(value) ? value : 'info';
}

function normalizeCollapsible(section) {
    const collapsible = section.collapsible === true;
    return {
        collapsible,
        defaultCollapsed: collapsible && section.defaultCollapsed === true,
    };
}

function normalizeCopyText(value, fallback = '') {
    const text = normalizePrimitive(value, PLUGIN_RESULT_SCHEMA_LIMITS.copyText, true);
    return text || normalizePrimitive(fallback, PLUGIN_RESULT_SCHEMA_LIMITS.copyText, true);
}

function normalizePairedContent(value, { allowEmpty = false, requireContentWhenComplete = true } = {}) {
    if (!isPlainObject(value)) return null;
    const state = PAIRED_STATES.has(value.state) ? value.state : 'complete';
    const content = normalizeOptionalText(value.content);
    if (!allowEmpty && !content) return null;
    if (state === 'complete' && !content && requireContentWhenComplete) return null;
    return {
        label: normalizePrimitive(value.label, PLUGIN_RESULT_SCHEMA_LIMITS.text) || 'AI 翻译',
        content,
        source: normalizeSource(value.source),
        state,
    };
}

function normalizeMetadataItem(item) {
    if (!isPlainObject(item)) return null;
    const label = normalizePrimitive(item.label, PLUGIN_RESULT_SCHEMA_LIMITS.text);
    const value = normalizePrimitive(item.value, PLUGIN_RESULT_SCHEMA_LIMITS.text);
    if (!label || !value) return null;
    return {
        label,
        value,
        copyText: normalizeCopyText(item.copyText, value),
    };
}

function normalizeDictionaryItem(item) {
    if (!isPlainObject(item)) return null;
    const token = normalizePrimitive(item.token, PLUGIN_RESULT_SCHEMA_LIMITS.token);
    const phonetic = normalizeOptionalText(item.phonetic, PLUGIN_RESULT_SCHEMA_LIMITS.token);
    const meaning = normalizeOptionalText(item.meaning);
    if (!token || (!phonetic && !meaning)) return null;
    const fallback = `${token}${phonetic ? ` ${phonetic}` : ''}${meaning ? `：${meaning}` : ''}`;
    const result = {
        token,
        phonetic,
        meaning,
        source: normalizeSource(item.source),
        copyText: normalizeCopyText(item.copyText, fallback),
    };
    const paired = normalizePairedContent(item.paired, { allowEmpty: true });
    if (paired) result.paired = paired;
    return result;
}

function normalizeCodeItem(item) {
    if (!isPlainObject(item)) return null;
    const label = normalizePrimitive(item.label, PLUGIN_RESULT_SCHEMA_LIMITS.text);
    const value = normalizePrimitive(item.value, PLUGIN_RESULT_SCHEMA_LIMITS.text);
    if (!label || !value) return null;
    return {
        label,
        value,
        copyText: normalizeCopyText(item.copyText, value),
    };
}

function normalizeItems(items, normalizer) {
    if (!Array.isArray(items)) return [];
    return items
        .slice(0, PLUGIN_RESULT_SCHEMA_LIMITS.items)
        .map(normalizer)
        .filter(Boolean);
}

function normalizeTokens(tokens) {
    if (!Array.isArray(tokens)) return [];
    return tokens
        .slice(0, PLUGIN_RESULT_SCHEMA_LIMITS.tokens)
        .map((token) => normalizePrimitive(token, PLUGIN_RESULT_SCHEMA_LIMITS.token))
        .filter(Boolean);
}

export function isPluginResultV2(result) {
    try {
        return isPlainObject(result) && result.schemaVersion === 2 && Array.isArray(result.sections);
    } catch (_) {
        return false;
    }
}

export function isLegacyPluginResult(result) {
    try {
        if (!isPlainObject(result)) return false;
        return ['pronunciations', 'explanations', 'associations', 'sentence'].some((key) => key in result);
    } catch (_) {
        return false;
    }
}

export function normalizePluginResultSection(section, index = 0) {
    if (!isPlainObject(section)) return null;

    const rawType = normalizePrimitive(section.type, 32);
    const type = SECTION_TYPES.has(rawType) ? rawType : 'note';
    const title = normalizeOptionalText(section.title);
    const id = normalizeId(section.id, index, type);
    const collapsible = normalizeCollapsible(section);

    if (type === 'summary') {
        const content = normalizePrimitive(section.content, PLUGIN_RESULT_SCHEMA_LIMITS.text);
        if (!content) return null;
        const result = {
            id,
            type,
            title,
            content,
            source: normalizeSource(section.source),
            copyText: normalizeCopyText(section.copyText, content),
            ...collapsible,
        };
        const paired = normalizePairedContent(section.paired, { allowEmpty: true });
        if (paired) result.paired = paired;
        return result;
    }

    if (type === 'metadata') {
        const items = normalizeItems(section.items, normalizeMetadataItem);
        const tokens = normalizeTokens(section.tokens);
        if (items.length === 0 && tokens.length === 0) return null;
        return { id, type, title, items, tokens, ...collapsible };
    }

    if (type === 'dictionary') {
        const items = normalizeItems(section.items, normalizeDictionaryItem);
        if (items.length === 0) return null;
        const result = { id, type, title, items, ...collapsible };
        const paired = normalizePairedContent(section.paired, {
            allowEmpty: true,
            requireContentWhenComplete: false,
        });
        if (paired) result.paired = paired;
        return result;
    }

    if (type === 'code-list') {
        const items = normalizeItems(section.items, normalizeCodeItem);
        if (items.length === 0) return null;
        return { id, type, title, items, ...collapsible };
    }

    if (type === 'status') {
        const content = normalizePrimitive(section.content, PLUGIN_RESULT_SCHEMA_LIMITS.text);
        if (!content) return null;
        return {
            id,
            type,
            title,
            content,
            severity: normalizeSeverity(section.severity),
            copyText: normalizeCopyText(section.copyText, content),
            ...collapsible,
        };
    }

    const content = normalizePrimitive(section.content, PLUGIN_RESULT_SCHEMA_LIMITS.text);
    if (!content) return null;
    return {
        id,
        type: 'note',
        title,
        content,
        source: normalizeSource(section.source),
        copyText: normalizeCopyText(section.copyText, content),
        ...collapsible,
    };
}

function deduplicateSectionIds(sections) {
    const counts = new Map();
    return sections.map((section) => {
        const count = (counts.get(section.id) || 0) + 1;
        counts.set(section.id, count);
        if (count === 1) return section;

        const suffix = `-${count}`;
        const base = section.id.slice(0, Math.max(1, PLUGIN_RESULT_SCHEMA_LIMITS.id - suffix.length));
        return { ...section, id: `${base}${suffix}` };
    });
}

function sectionToCopyText(section) {
    if (['summary', 'note', 'status'].includes(section.type)) {
        return section.copyText || section.content;
    }
    if (section.type === 'metadata') {
        const itemText = section.items.map((item) => `${item.label}：${item.copyText || item.value}`);
        if (section.tokens.length > 0) itemText.push(section.tokens.join(' · '));
        return itemText.join('\n');
    }
    if (section.type === 'dictionary') {
        return section.items.map((item) => item.copyText).join('\n');
    }
    if (section.type === 'code-list') {
        return section.items.map((item) => `${item.label}：${item.copyText || item.value}`).join('\n');
    }
    return '';
}

export function normalizePluginResultV2(result) {
    if (!isPluginResultV2(result)) return null;

    try {
        const sections = deduplicateSectionIds(
            result.sections
                .slice(0, PLUGIN_RESULT_SCHEMA_LIMITS.sections)
                .map((section, index) => normalizePluginResultSection(section, index))
                .filter(Boolean)
        );
        const fallbackCopyText = sections.map(sectionToCopyText).filter(Boolean).join('\n\n');
        return {
            schemaVersion: 2,
            copyText: normalizeCopyText(result.copyText, fallbackCopyText),
            sections,
        };
    } catch (_) {
        return null;
    }
}

export function resolveResultCopyText(result) {
    if (typeof result === 'string') return result;
    const normalized = normalizePluginResultV2(result);
    return normalized?.copyText || '';
}
