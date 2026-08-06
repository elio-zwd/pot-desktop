export const PROGRAMMER_RESULT_SCHEMA = 'pot.programmer-result.v1';

const SUMMARY_SOURCES = new Set(['local', 'local_ai', 'ai', 'local_fallback']);
const DETECTED_TYPES = new Set([
    'function',
    'variable',
    'boolean',
    'class',
    'constant',
    'file',
    'text',
    'unknown',
]);
const DETECTION_MODES = new Set(['auto', 'configured']);
const TOKEN_MEANING_SOURCES = new Set(['local', 'ai', 'literal']);
const DIAGNOSTIC_SEVERITIES = new Set(['info', 'warning', 'error']);
const PRESENTATION_DENSITIES = new Set(['minimal', 'report']);
const PRESENTATION_SECTIONS = new Set(['identifier', 'tokenMeanings', 'naming', 'diagnostics']);
const LEGACY_ARRAY_FIELDS = ['pronunciations', 'explanations', 'associations', 'sentence'];
const NAMING_KEYS = ['camelCase', 'pascalCase', 'snakeCase', 'screamingSnakeCase', 'kebabCase'];
const DIAGNOSTIC_CODE_PATTERN = /^[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)+$/;

function isPlainObject(value) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }

    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
}

function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim() !== '';
}

function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
}

function freezeResult(result) {
    return Object.freeze(result);
}

function createUnsupportedResult(raw, reason) {
    return freezeResult({
        kind: 'unsupported',
        render: 'unsupported',
        raw,
        plainText: null,
        reason,
    });
}

function createPlainTextFallback(input, reason) {
    return freezeResult({
        kind: 'plain-text-fallback',
        render: 'text',
        raw: input,
        schema: typeof input.schema === 'string' ? input.schema : null,
        plainText: input.plainText,
        reason,
    });
}

function isValidSummary(summary) {
    return (
        isPlainObject(summary) &&
        isNonEmptyString(summary.text) &&
        SUMMARY_SOURCES.has(summary.source) &&
        typeof summary.fallback === 'boolean' &&
        summary.fallback === (summary.source === 'local_fallback')
    );
}

function isValidIdentifier(identifier) {
    return (
        isPlainObject(identifier) &&
        isNonEmptyString(identifier.original) &&
        DETECTED_TYPES.has(identifier.detectedType) &&
        DETECTION_MODES.has(identifier.detectionMode) &&
        Array.isArray(identifier.tokens) &&
        identifier.tokens.length > 0 &&
        identifier.tokens.every(isNonEmptyString)
    );
}

function isValidTokenMeaning(item, token, index) {
    return (
        isPlainObject(item) &&
        item.index === index &&
        item.token === token &&
        isNonEmptyString(item.meaning) &&
        TOKEN_MEANING_SOURCES.has(item.source) &&
        (!hasOwn(item, 'phonetic') || isNonEmptyString(item.phonetic))
    );
}

function isValidTokenMeanings(tokenMeanings, tokens) {
    return (
        Array.isArray(tokenMeanings) &&
        tokenMeanings.length === tokens.length &&
        tokenMeanings.every((item, index) => isValidTokenMeaning(item, tokens[index], index))
    );
}

function isValidNaming(naming) {
    return (
        isPlainObject(naming) &&
        NAMING_KEYS.every((key) => hasOwn(naming, key) && typeof naming[key] === 'string')
    );
}

function isValidDiagnostic(diagnostic) {
    return (
        isPlainObject(diagnostic) &&
        typeof diagnostic.code === 'string' &&
        DIAGNOSTIC_CODE_PATTERN.test(diagnostic.code) &&
        DIAGNOSTIC_SEVERITIES.has(diagnostic.severity) &&
        isNonEmptyString(diagnostic.message) &&
        typeof diagnostic.recoverable === 'boolean'
    );
}

function isValidDiagnostics(diagnostics) {
    return Array.isArray(diagnostics) && diagnostics.every(isValidDiagnostic);
}

function isValidProgrammerResult(input) {
    return (
        isPlainObject(input) &&
        input.schema === PROGRAMMER_RESULT_SCHEMA &&
        isNonEmptyString(input.plainText) &&
        isValidSummary(input.summary) &&
        isValidIdentifier(input.identifier) &&
        isValidTokenMeanings(input.tokenMeanings, input.identifier.tokens) &&
        isValidNaming(input.naming) &&
        isValidDiagnostics(input.diagnostics)
    );
}

function normalizePresentation(presentation) {
    if (!isPlainObject(presentation)) {
        return undefined;
    }

    const normalized = {};

    if (PRESENTATION_DENSITIES.has(presentation.preferredDensity)) {
        normalized.preferredDensity = presentation.preferredDensity;
    }

    if (Array.isArray(presentation.initiallyExpanded)) {
        normalized.initiallyExpanded = Object.freeze(
            presentation.initiallyExpanded.filter(
                (section, index, sections) =>
                    PRESENTATION_SECTIONS.has(section) && sections.indexOf(section) === index
            )
        );
    }

    return Object.keys(normalized).length > 0 ? Object.freeze(normalized) : undefined;
}

function createProgrammerResult(input) {
    const summary = Object.freeze({
        text: input.summary.text,
        source: input.summary.source,
        fallback: input.summary.fallback,
    });
    const tokens = Object.freeze([...input.identifier.tokens]);
    const identifier = Object.freeze({
        original: input.identifier.original,
        detectedType: input.identifier.detectedType,
        detectionMode: input.identifier.detectionMode,
        tokens,
    });
    const tokenMeanings = Object.freeze(
        input.tokenMeanings.map((item) => {
            const normalized = {
                index: item.index,
                token: item.token,
                meaning: item.meaning,
                source: item.source,
            };

            if (hasOwn(item, 'phonetic')) {
                normalized.phonetic = item.phonetic;
            }

            return Object.freeze(normalized);
        })
    );
    const naming = Object.freeze(
        Object.fromEntries(NAMING_KEYS.map((key) => [key, input.naming[key]]))
    );
    const diagnostics = Object.freeze(
        input.diagnostics.map((diagnostic) =>
            Object.freeze({
                code: diagnostic.code,
                severity: diagnostic.severity,
                message: diagnostic.message,
                recoverable: diagnostic.recoverable,
            })
        )
    );
    const presentation = normalizePresentation(input.presentation);
    const result = {
        kind: 'programmer',
        render: 'programmer',
        raw: input,
        schema: PROGRAMMER_RESULT_SCHEMA,
        plainText: input.plainText,
        summary,
        identifier,
        tokenMeanings,
        naming,
        diagnostics,
    };

    if (presentation !== undefined) {
        result.presentation = presentation;
    }

    return freezeResult(result);
}

function isLegacyObject(input) {
    return LEGACY_ARRAY_FIELDS.some((field) => Array.isArray(input[field]));
}

export function normalizePluginResult(input) {
    if (typeof input === 'string') {
        const plainText = input.trim();

        if (plainText === '') {
            return createUnsupportedResult(input, 'empty-string');
        }

        return freezeResult({
            kind: 'text',
            render: 'text',
            raw: input,
            plainText,
        });
    }

    if (!isPlainObject(input)) {
        return createUnsupportedResult(input, 'unsupported-value');
    }

    if (input.schema === PROGRAMMER_RESULT_SCHEMA) {
        if (isValidProgrammerResult(input)) {
            return createProgrammerResult(input);
        }

        if (isNonEmptyString(input.plainText)) {
            return createPlainTextFallback(input, 'invalid-programmer-schema');
        }

        return createUnsupportedResult(input, 'missing-plain-text');
    }

    if (isLegacyObject(input)) {
        return freezeResult({
            kind: 'legacy-object',
            render: 'legacy-object',
            raw: input,
            plainText: null,
        });
    }

    if (isNonEmptyString(input.plainText)) {
        return createPlainTextFallback(input, 'unknown-schema');
    }

    return createUnsupportedResult(input, 'missing-plain-text');
}

export function createPluginHostCapabilities() {
    return {
        name: 'pot-desktop',
        resultSchemas: [PROGRAMMER_RESULT_SCHEMA],
        configSchemaVersion: 1,
        presentationCapabilities: ['summary-details', 'per-item-copy'],
    };
}
