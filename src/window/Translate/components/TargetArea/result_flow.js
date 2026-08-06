import { createPluginHostCapabilities } from '../../../../utils/plugin_result.js';

export function createTranslatePluginOptions({ config, detect, setResult, utils }) {
    return {
        config,
        detect,
        setResult,
        utils,
        host: createPluginHostCapabilities(),
    };
}

export function getTrustedPlainText(normalized) {
    return typeof normalized?.plainText === 'string' ? normalized.plainText : null;
}

export function isRequestCurrent(activeRequestId, requestId) {
    return typeof activeRequestId === 'string' && activeRequestId !== '' && activeRequestId === requestId;
}

export function getResultRenderType(normalized) {
    switch (normalized?.kind) {
        case 'programmer':
            return 'programmer';
        case 'text':
        case 'plain-text-fallback':
            return 'text';
        case 'legacy-object':
            return 'legacy-object';
        default:
            return 'unsupported';
    }
}

export function isDisplayableResult(normalized) {
    return getResultRenderType(normalized) !== 'unsupported';
}

export function decideResultCommit({
    activeRequestId,
    requestId,
    normalized,
    latestStreamResult,
    final,
}) {
    if (!isRequestCurrent(activeRequestId, requestId)) {
        return { type: 'ignore', result: null, trustedPlainText: null };
    }

    if (isDisplayableResult(normalized)) {
        return {
            type: 'display',
            result: normalized,
            trustedPlainText: final ? getTrustedPlainText(normalized) : null,
        };
    }

    if (final && isDisplayableResult(latestStreamResult)) {
        return {
            type: 'preserve-stream',
            result: latestStreamResult,
            trustedPlainText: null,
        };
    }

    return final
        ? { type: 'empty', result: null, trustedPlainText: null }
        : { type: 'ignore', result: null, trustedPlainText: null };
}

export function createAutoCopyText({ autoCopy, sourceText, trustedPlainText }) {
    if (typeof trustedPlainText !== 'string') {
        return null;
    }

    if (autoCopy === 'target') {
        return trustedPlainText;
    }

    if (autoCopy === 'source_target') {
        return `${typeof sourceText === 'string' ? sourceText.trim() : ''}\n\n${trustedPlainText}`;
    }

    return null;
}
