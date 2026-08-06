export const DEFAULT_EXPANDED = false;

export const DETAIL_SECTION_ORDER = Object.freeze([
    'identifier',
    'tokenMeanings',
    'naming',
    'diagnostics',
]);

export const NAMING_KEYS = Object.freeze([
    'camelCase',
    'pascalCase',
    'snakeCase',
    'screamingSnakeCase',
    'kebabCase',
]);

const SOURCE_LABEL_KEYS = Object.freeze({
    local: 'local',
    local_ai: 'local_ai',
    ai: 'ai',
    local_fallback: 'local_fallback',
});

export function createInitialExpandedState() {
    return DEFAULT_EXPANDED;
}

export function toggleExpanded(expanded) {
    return !expanded;
}

export function getSourceLabelKey(source) {
    return SOURCE_LABEL_KEYS[source] ?? null;
}

export function getNamingItems(naming) {
    return NAMING_KEYS.map((key) => ({
        key,
        value: naming[key],
        copyable: naming[key] !== '',
    }));
}

export function getCopyableNamingItems(naming) {
    return getNamingItems(naming).filter((item) => item.copyable);
}

export function getVisibleDetailSections(result) {
    const visibility = {
        identifier: Boolean(result.identifier),
        tokenMeanings: result.tokenMeanings.length > 0,
        naming: getNamingItems(result.naming).length > 0,
        diagnostics: result.diagnostics.length > 0,
    };

    return DETAIL_SECTION_ORDER.filter((section) => visibility[section]);
}

export function createFullCopyRequest(result) {
    return {
        text: result.plainText,
        meta: { scope: 'full' },
    };
}

export function createNamingCopyRequest(result, key) {
    if (!NAMING_KEYS.includes(key)) {
        throw new RangeError(`Unknown naming key: ${key}`);
    }

    return {
        text: result.naming[key],
        meta: {
            scope: 'naming',
            key,
        },
    };
}

function normalizeIdPrefix(idPrefix) {
    const normalized = String(idPrefix ?? '')
        .trim()
        .replace(/\s+/g, '-');

    return normalized || 'programmer-minimal-result';
}

export function createProgrammerMinimalResultIds(idPrefix) {
    const prefix = normalizeIdPrefix(idPrefix);

    return {
        root: `${prefix}-root`,
        toggle: `${prefix}-toggle`,
        details: `${prefix}-details`,
        copyStatus: `${prefix}-copy-status`,
    };
}
