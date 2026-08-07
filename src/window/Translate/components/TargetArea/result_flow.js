import { createPluginHostCapabilities } from '../../../../utils/plugin_host_capabilities.js';
import {
    isLegacyPluginResult,
    isPluginResultV2,
    normalizePluginResultV2,
    resolveResultCopyText,
} from '../../../../utils/plugin_result_schema.js';

export function createTranslatePluginOptions({ config, detect, setResult, utils }) {
    return {
        config,
        detect,
        setResult,
        utils,
        host: createPluginHostCapabilities(),
    };
}

export function isRequestCurrent(activeRequestId, requestId) {
    return (
        typeof activeRequestId === 'string' &&
        activeRequestId !== '' &&
        activeRequestId === requestId
    );
}

export function createRequestState() {
    return {
        activeRequestId: null,
        latestStreamResult: null,
    };
}

export function beginRequestState(_state, requestId) {
    return {
        activeRequestId: requestId,
        latestStreamResult: null,
    };
}

function normalizeResolvedResult(value) {
    return typeof value === 'string' ? value.trim() : value;
}

function isDisplayableResult(value) {
    if (typeof value === 'string') {
        return value !== '';
    }

    if (isPluginResultV2(value)) {
        const normalized = normalizePluginResultV2(value);
        return normalized !== null && (normalized.copyText !== '' || normalized.sections.length > 0);
    }

    return isLegacyPluginResult(value);
}

export function resolveTrustedCopyText(value) {
    const normalized = normalizeResolvedResult(value);

    if (typeof normalized === 'string') {
        return normalized !== '' ? resolveResultCopyText(normalized) : null;
    }

    if (!isPluginResultV2(normalized)) {
        return null;
    }

    try {
        if (typeof normalized.copyText !== 'string' || normalized.copyText.trim() === '') {
            return null;
        }
    } catch {
        return null;
    }

    const copyText = resolveResultCopyText(normalized);
    return typeof copyText === 'string' && copyText.trim() !== '' ? copyText : null;
}

export function recordStreamResult(state, requestId, value) {
    if (!isRequestCurrent(state?.activeRequestId, requestId)) {
        return state;
    }

    const normalized = normalizeResolvedResult(value);
    if (!isDisplayableResult(normalized)) {
        return state;
    }

    return {
        activeRequestId: state.activeRequestId,
        latestStreamResult: normalized,
    };
}

export function decideResultCommit({
    activeRequestId,
    requestId,
    value,
    latestStreamResult,
    final,
}) {
    if (!isRequestCurrent(activeRequestId, requestId)) {
        return {
            type: 'ignore',
            result: null,
            trustedCopyText: null,
        };
    }

    const normalized = normalizeResolvedResult(value);
    const displayable = isDisplayableResult(normalized);
    const trustedCopyText = final ? resolveTrustedCopyText(normalized) : null;

    if (
        displayable &&
        (!final || trustedCopyText !== null || !isDisplayableResult(latestStreamResult))
    ) {
        return {
            type: 'display',
            result: normalized,
            trustedCopyText,
        };
    }

    if (final && isDisplayableResult(latestStreamResult)) {
        return {
            type: 'preserve-stream',
            result: latestStreamResult,
            trustedCopyText: null,
        };
    }

    return final
        ? {
              type: 'empty',
              result: null,
              trustedCopyText: null,
          }
        : {
              type: 'ignore',
              result: null,
              trustedCopyText: null,
          };
}

export function decideRequestRejection({ activeRequestId, requestId }) {
    return isRequestCurrent(activeRequestId, requestId) ? 'reject' : 'ignore';
}

export function createAutoCopyText({ autoCopy, sourceText, trustedCopyText }) {
    if (typeof trustedCopyText !== 'string' || trustedCopyText.trim() === '') {
        return null;
    }

    if (autoCopy === 'target') {
        return trustedCopyText;
    }

    if (autoCopy === 'source_target') {
        const originalText = typeof sourceText === 'string' ? sourceText.trim() : '';
        return `${originalText}\n\n${trustedCopyText}`;
    }

    return null;
}
