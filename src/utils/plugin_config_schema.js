const LEGACY_GROUP_KEY = '__legacy__';
const DEFAULT_TEXTAREA_ROWS = 4;
const MIN_TEXTAREA_ROWS = 2;
const MAX_TEXTAREA_ROWS = 8;
const MAX_FIELD_KEY_LENGTH = 160;
const MAX_DISPLAY_LENGTH = 160;
const MAX_HELP_TEXT_LENGTH = 1000;
const MAX_OPTIONS = 100;
const MAX_OPTION_VALUE_LENGTH = 256;
const SUPPORTED_OPERATORS = new Set(['equals', 'notEquals', 'in', 'notIn']);

function truncateString(value, maxLength, fallback = '') {
    if (value === null || value === undefined) {
        return fallback;
    }

    return String(value).slice(0, maxLength);
}

function normalizeRequiredString(value, maxLength) {
    const result = truncateString(value, maxLength).trim();
    return result.length > 0 ? result : null;
}

function normalizeOptions(options) {
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
        return null;
    }

    const entries = Object.entries(options).slice(0, MAX_OPTIONS);
    if (entries.length === 0) {
        return null;
    }

    const normalized = {};
    for (const [rawKey, rawLabel] of entries) {
        const key = normalizeRequiredString(rawKey, MAX_FIELD_KEY_LENGTH);
        if (!key || Object.prototype.hasOwnProperty.call(normalized, key)) {
            continue;
        }

        normalized[key] = truncateString(rawLabel, MAX_OPTION_VALUE_LENGTH, key);
    }

    return Object.keys(normalized).length > 0 ? normalized : null;
}

function normalizeConditionValue(value) {
    if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
        return value;
    }

    return undefined;
}

function normalizeVisibleWhen(condition) {
    if (!condition || typeof condition !== 'object' || Array.isArray(condition)) {
        return null;
    }

    const key = normalizeRequiredString(condition.key, MAX_FIELD_KEY_LENGTH);
    const operator = truncateString(condition.operator, 32).trim();
    if (!key || !SUPPORTED_OPERATORS.has(operator)) {
        return null;
    }

    if (operator === 'in' || operator === 'notIn') {
        if (!Array.isArray(condition.value)) {
            return null;
        }

        const values = condition.value
            .slice(0, MAX_OPTIONS)
            .map(normalizeConditionValue)
            .filter((value) => value !== undefined);

        return values.length > 0 ? { key, operator, value: values } : null;
    }

    const value = normalizeConditionValue(condition.value);
    return value === undefined ? null : { key, operator, value };
}

export function clampTextareaRows(value) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
        return DEFAULT_TEXTAREA_ROWS;
    }

    return Math.min(MAX_TEXTAREA_ROWS, Math.max(MIN_TEXTAREA_ROWS, Math.round(numericValue)));
}

function normalizeField(rawField, index) {
    if (!rawField || typeof rawField !== 'object' || Array.isArray(rawField)) {
        return null;
    }

    const key = normalizeRequiredString(rawField.key, MAX_FIELD_KEY_LENGTH);
    if (!key) {
        return null;
    }

    const requestedType = truncateString(rawField.type, 32, 'input').trim() || 'input';
    const options = normalizeOptions(rawField.options);
    const type = requestedType === 'select' && options ? 'select' : 'input';
    const group = normalizeRequiredString(rawField.group, MAX_FIELD_KEY_LENGTH) ?? LEGACY_GROUP_KEY;

    return {
        key,
        display: truncateString(rawField.display, MAX_DISPLAY_LENGTH, key) || key,
        type,
        options: type === 'select' ? options : null,
        group,
        groupDisplay: normalizeRequiredString(rawField.groupDisplay, MAX_DISPLAY_LENGTH),
        groupAdvanced: typeof rawField.groupAdvanced === 'boolean' ? rawField.groupAdvanced : null,
        description: truncateString(rawField.description, MAX_HELP_TEXT_LENGTH),
        placeholder: truncateString(rawField.placeholder, MAX_HELP_TEXT_LENGTH),
        secret: rawField.secret === true,
        multiline: rawField.multiline === true,
        rows: clampTextareaRows(rawField.rows),
        visibleWhen: normalizeVisibleWhen(rawField.visibleWhen),
        sourceIndex: index,
    };
}

export function normalizePluginNeeds(needs) {
    if (!Array.isArray(needs)) {
        return [];
    }

    const groups = [];
    const groupMap = new Map();

    needs.forEach((rawField, index) => {
        const field = normalizeField(rawField, index);
        if (!field) {
            return;
        }

        let group = groupMap.get(field.group);
        if (!group) {
            group = {
                key: field.group,
                display: null,
                advanced: false,
                fields: [],
                legacy: field.group === LEGACY_GROUP_KEY,
                hasDisplayDeclaration: false,
                hasAdvancedDeclaration: false,
            };
            groupMap.set(field.group, group);
            groups.push(group);
        }

        if (!group.hasDisplayDeclaration && field.groupDisplay) {
            group.display = field.groupDisplay;
            group.hasDisplayDeclaration = true;
        }

        if (!group.hasAdvancedDeclaration && field.groupAdvanced !== null) {
            group.advanced = field.groupAdvanced;
            group.hasAdvancedDeclaration = true;
        }

        group.fields.push(field);
    });

    return groups.map(({ hasDisplayDeclaration, hasAdvancedDeclaration, ...group }) => ({
        ...group,
        display: group.legacy ? null : group.display ?? group.key,
    }));
}

export function evaluateVisibleWhen(condition, config) {
    if (!condition) {
        return true;
    }

    const normalized = normalizeVisibleWhen(condition);
    if (!normalized || !config || typeof config !== 'object') {
        return true;
    }

    if (!Object.prototype.hasOwnProperty.call(config, normalized.key)) {
        return true;
    }

    const actualValue = config[normalized.key];
    switch (normalized.operator) {
        case 'equals':
            return actualValue === normalized.value;
        case 'notEquals':
            return actualValue !== normalized.value;
        case 'in':
            return normalized.value.includes(actualValue);
        case 'notIn':
            return !normalized.value.includes(actualValue);
        default:
            return true;
    }
}

export function resolvePluginFieldValue(field, config) {
    if (!field || typeof field !== 'object') {
        return '';
    }

    if (config && typeof config === 'object' && Object.prototype.hasOwnProperty.call(config, field.key)) {
        return config[field.key] === null || config[field.key] === undefined ? '' : String(config[field.key]);
    }

    if (field.type === 'select' && field.options) {
        return Object.keys(field.options)[0] ?? '';
    }

    return '';
}

export const pluginConfigSchemaLimits = Object.freeze({
    legacyGroupKey: LEGACY_GROUP_KEY,
    defaultTextareaRows: DEFAULT_TEXTAREA_ROWS,
    minTextareaRows: MIN_TEXTAREA_ROWS,
    maxTextareaRows: MAX_TEXTAREA_ROWS,
    maxFieldKeyLength: MAX_FIELD_KEY_LENGTH,
    maxDisplayLength: MAX_DISPLAY_LENGTH,
    maxHelpTextLength: MAX_HELP_TEXT_LENGTH,
    maxOptions: MAX_OPTIONS,
    maxOptionValueLength: MAX_OPTION_VALUE_LENGTH,
});
