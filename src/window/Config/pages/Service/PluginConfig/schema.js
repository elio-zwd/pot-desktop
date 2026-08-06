export const MIN_TEXTAREA_ROWS = 2;
export const DEFAULT_TEXTAREA_ROWS = 4;
export const MAX_TEXTAREA_ROWS = 12;

const KNOWN_TYPES = new Set(['section', 'select', 'input', 'secret', 'textarea', 'switch', 'help']);
const COMPARATORS = ['equals', 'notEquals', 'oneOf'];

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

const isPlainObject = (value) => {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
};

const isScalar = (value) =>
    typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';

const normalizeOptionalString = (value) => (typeof value === 'string' ? value : undefined);

const normalizeKey = (value) =>
    typeof value === 'string' && value.trim().length > 0 ? value : null;

const normalizeVisibleWhen = (value) => {
    if (value === undefined) {
        return null;
    }
    if (!isPlainObject(value)) {
        return { valid: false };
    }

    const key = normalizeKey(value.key);
    const comparators = COMPARATORS.filter((comparator) => hasOwn(value, comparator));
    const allowedKeys = new Set(['key', ...COMPARATORS]);
    const hasUnknownKey = Object.keys(value).some((entry) => !allowedKeys.has(entry));
    if (key === null || comparators.length !== 1 || hasUnknownKey) {
        return { valid: false };
    }

    const comparator = comparators[0];
    if (comparator === 'oneOf') {
        if (!Array.isArray(value.oneOf) || !value.oneOf.every(isScalar)) {
            return { valid: false };
        }
        return {
            valid: true,
            key,
            comparator,
            expected: [...value.oneOf],
        };
    }

    if (!isScalar(value[comparator])) {
        return { valid: false };
    }
    return {
        valid: true,
        key,
        comparator,
        expected: value[comparator],
    };
};

const normalizeOptions = (options) => {
    if (!isPlainObject(options)) {
        return [];
    }
    return Object.entries(options)
        .filter(([, label]) => typeof label === 'string')
        .map(([key, label]) => ({ key, label }));
};

export function getTextareaRows(rows) {
    if (typeof rows !== 'number' || !Number.isFinite(rows)) {
        return DEFAULT_TEXTAREA_ROWS;
    }
    return Math.min(MAX_TEXTAREA_ROWS, Math.max(MIN_TEXTAREA_ROWS, Math.trunc(rows)));
}

export function getSwitchValues(item) {
    return {
        onValue: typeof item?.onValue === 'string' ? item.onValue : 'true',
        offValue: typeof item?.offValue === 'string' ? item.offValue : 'false',
    };
}

export function isSafeExternalHref(href) {
    if (typeof href !== 'string' || href.length === 0 || href.trim() !== href) {
        return false;
    }
    try {
        const url = new URL(href);
        return (
            (url.protocol === 'https:' || url.protocol === 'http:') &&
            url.username.length === 0 &&
            url.password.length === 0
        );
    } catch {
        return false;
    }
}

const normalizeDefault = (item) => {
    if (hasOwn(item, 'default') && isScalar(item.default)) {
        return { hasDefault: true, defaultValue: item.default };
    }
    return { hasDefault: false, defaultValue: undefined };
};

const normalizeCommonItem = (item, index, type) => {
    const key = normalizeKey(item.key);
    if (key === null) {
        return null;
    }
    const defaultModel = normalizeDefault(item);
    return {
        id: `item-${index}`,
        index,
        type,
        key,
        display: typeof item.display === 'string' ? item.display : key,
        description: normalizeOptionalString(item.description),
        section: normalizeKey(item.section),
        visibleWhen: normalizeVisibleWhen(item.visibleWhen),
        persisted: type !== 'help',
        ...defaultModel,
    };
};

export function normalizePluginConfigSchema(needs) {
    const sourceItems = Array.isArray(needs) ? needs : [];
    const sections = [];
    const items = [];
    const skipped = [];
    const sectionKeys = new Set();

    sourceItems.forEach((rawItem, index) => {
        if (!isPlainObject(rawItem)) {
            skipped.push({ index, key: null, type: null });
            return;
        }

        const type = rawItem.type === undefined ? 'input' : rawItem.type;
        const key = normalizeKey(rawItem.key);
        if (typeof type !== 'string' || !KNOWN_TYPES.has(type)) {
            skipped.push({ index, key, type: typeof type === 'string' ? type : null });
            return;
        }

        if (type === 'section') {
            if (key === null || sectionKeys.has(key)) {
                skipped.push({ index, key, type });
                return;
            }
            sectionKeys.add(key);
            sections.push({
                id: `section-${index}`,
                index,
                type,
                key,
                display: typeof rawItem.display === 'string' ? rawItem.display : key,
                description: normalizeOptionalString(rawItem.description),
                defaultExpanded: rawItem.defaultExpanded === true,
                persisted: false,
            });
            return;
        }

        const item = normalizeCommonItem(rawItem, index, type);
        if (item === null) {
            skipped.push({ index, key, type });
            return;
        }

        if (type === 'select') {
            item.options = normalizeOptions(rawItem.options);
        } else if (type === 'input') {
            item.placeholder = normalizeOptionalString(rawItem.placeholder);
            item.inputType = 'text';
        } else if (type === 'secret') {
            item.placeholder = normalizeOptionalString(rawItem.placeholder);
            item.inputType = 'password';
            item.maskedByDefault = true;
        } else if (type === 'textarea') {
            item.placeholder = normalizeOptionalString(rawItem.placeholder);
            item.rows = getTextareaRows(rawItem.rows);
        } else if (type === 'switch') {
            const values = getSwitchValues(rawItem);
            item.onValue = values.onValue;
            item.offValue = values.offValue;
        } else if (type === 'help') {
            item.display = typeof rawItem.display === 'string' ? rawItem.display : null;
            item.text = typeof rawItem.text === 'string' ? rawItem.text : '';
            item.href = isSafeExternalHref(rawItem.href) ? rawItem.href : null;
        }

        items.push(item);
    });

    return { sections, items, skipped };
}

const getConditionSource = (key, itemsByKey, config) => {
    if (hasOwn(config, key)) {
        return { found: true, value: config[key] };
    }
    const sourceItem = itemsByKey.get(key);
    if (sourceItem?.hasDefault) {
        return { found: true, value: sourceItem.defaultValue };
    }
    return { found: false, value: undefined };
};

export function isVisibleWhenSatisfied(item, schemaItems, config = {}) {
    const condition = item?.visibleWhen;
    if (condition === null || condition === undefined || condition.valid === false) {
        return true;
    }

    const safeConfig = isPlainObject(config) ? config : {};
    const itemsByKey =
        schemaItems instanceof Map
            ? schemaItems
            : new Map((Array.isArray(schemaItems) ? schemaItems : []).map((entry) => [entry.key, entry]));
    const source = getConditionSource(condition.key, itemsByKey, safeConfig);
    if (!source.found) {
        return false;
    }

    if (condition.comparator === 'equals') {
        return source.value === condition.expected;
    }
    if (condition.comparator === 'notEquals') {
        return source.value !== condition.expected;
    }
    return condition.expected.some((value) => value === source.value);
}

const scalarToString = (value) => (isScalar(value) ? String(value) : '');

export function getControlValue(item, config = {}) {
    const safeConfig = isPlainObject(config) ? config : {};
    if (hasOwn(safeConfig, item.key)) {
        if (item.type === 'switch') {
            return typeof safeConfig[item.key] === 'string'
                ? safeConfig[item.key]
                : getSwitchValues(item).offValue;
        }
        return scalarToString(safeConfig[item.key]);
    }

    if (item.type === 'select') {
        return item.options[0]?.key ?? '';
    }
    if (item.type === 'switch') {
        if (item.hasDefault && typeof item.defaultValue === 'string') {
            return item.defaultValue;
        }
        return getSwitchValues(item).offValue;
    }
    return '';
}

export function buildPluginConfigModel(needs, config = {}) {
    const schema = normalizePluginConfigSchema(needs);
    const safeConfig = isPlainObject(config) ? config : {};
    const itemsByKey = new Map();
    schema.items.forEach((item) => {
        if (!itemsByKey.has(item.key)) {
            itemsByKey.set(item.key, item);
        }
    });

    const visibleItems = schema.items.filter((item) =>
        isVisibleWhenSatisfied(item, itemsByKey, safeConfig)
    );
    const sectionsByKey = new Map(
        schema.sections.map((section) => [section.key, { ...section, items: [] }])
    );
    const rootItems = [];

    visibleItems.forEach((item) => {
        const section = item.section === null ? undefined : sectionsByKey.get(item.section);
        if (section) {
            section.items.push(item);
        } else {
            rootItems.push(item);
        }
    });

    const sections = schema.sections.map((section) => sectionsByKey.get(section.key));
    return {
        rootItems,
        sections,
        skipped: schema.skipped,
        hasItems: rootItems.length > 0 || sections.some((section) => section.items.length > 0),
    };
}
