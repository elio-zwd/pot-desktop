import {
    createPluginHostCapabilities,
    normalizePluginResult,
} from '../../../../utils/plugin_result';

const NORMALIZED_KINDS = new Set([
    'text',
    'programmer',
    'legacy-object',
    'plain-text-fallback',
    'unsupported',
]);

export function createPluginTranslateOptions({ config, detect, setResult, utils }) {
    return {
        config,
        detect,
        setResult,
        utils,
        host: createPluginHostCapabilities(),
    };
}

export function normalizeResultForDisplay(value) {
    return normalizePluginResult(value);
}

export function isNormalizedResult(value) {
    return (
        value !== null &&
        typeof value === 'object' &&
        NORMALIZED_KINDS.has(value.kind) &&
        typeof value.render === 'string'
    );
}

export function getResultRenderKind(result) {
    if (!isNormalizedResult(result)) {
        return 'empty';
    }

    if (result.kind === 'programmer') {
        return 'programmer';
    }

    if (result.kind === 'legacy-object') {
        return 'legacy-object';
    }

    if (result.render === 'text') {
        return 'text';
    }

    return 'empty';
}

export function isDisplayableResult(result) {
    return getResultRenderKind(result) !== 'empty';
}

export function getTrustedResultText(result) {
    if (!isNormalizedResult(result) || typeof result.plainText !== 'string') {
        return null;
    }

    return result.plainText;
}

export function getLegacyResultObject(result) {
    return isNormalizedResult(result) && result.kind === 'legacy-object' ? result.raw : null;
}

export function getHistoryResultValue(result) {
    const trustedText = getTrustedResultText(result);
    if (trustedText !== null) {
        return trustedText;
    }

    return getLegacyResultObject(result);
}

export function getCollectionResultValue(result, stringifyLegacy = false) {
    const trustedText = getTrustedResultText(result);
    if (trustedText !== null) {
        return trustedText;
    }

    const legacyResult = getLegacyResultObject(result);
    if (legacyResult === null) {
        return null;
    }

    return stringifyLegacy ? legacyResult.toString() : legacyResult;
}

export function createAutoCopyText({ autoCopy, sourceText, targetText }) {
    if (typeof targetText !== 'string') {
        return null;
    }

    if (autoCopy === 'target') {
        return targetText;
    }

    if (autoCopy === 'source_target') {
        return `${sourceText}\n\n${targetText}`;
    }

    return null;
}

export function createFinalResultEffects({
    result,
    sourceText,
    autoCopy,
    isPrimaryResult,
    clipboardMonitor,
}) {
    const trustedText = getTrustedResultText(result);

    return Object.freeze({
        historyValue: getHistoryResultValue(result),
        clipboardText:
            isPrimaryResult && !clipboardMonitor
                ? createAutoCopyText({ autoCopy, sourceText, targetText: trustedText })
                : null,
    });
}

export function getProgrammerResultKey(queryId) {
    return `programmer-result-${queryId}`;
}

export function describeResultForLog(result) {
    if (!isNormalizedResult(result)) {
        return 'unsupported';
    }

    if (result.kind === 'programmer') {
        return `${result.kind}:${result.schema}`;
    }

    if (result.kind === 'plain-text-fallback') {
        return `${result.kind}:${result.reason}`;
    }

    if (result.kind === 'unsupported') {
        return `${result.kind}:${result.reason}`;
    }

    return result.kind;
}
