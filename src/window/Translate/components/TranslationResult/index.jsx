import React from 'react';

import { isLegacyPluginResult, isPluginResultV2, normalizePluginResultV2 } from '../../../../utils/plugin_result_schema';
import LegacyResult from './LegacyResult';
import StructuredResult from './StructuredResult';

const DANGEROUS_FALLBACK_KEYS = new Set([
    'html',
    'style',
    'className',
    'component',
    'javascript',
    'icon',
    'iconUrl',
    'markdown',
    'sections',
]);

function resolveFallbackText(result) {
    try {
        if (result === null || result === undefined) return '';
        if (['string', 'number', 'boolean'].includes(typeof result)) return String(result);
        if (Array.isArray(result)) {
            return result
                .filter((value) => ['string', 'number', 'boolean'].includes(typeof value))
                .map(String)
                .join('\n');
        }
        if (typeof result !== 'object') return '';

        if (['string', 'number', 'boolean'].includes(typeof result.copyText)) {
            return String(result.copyText).slice(0, 12000);
        }

        return Object.entries(result)
            .filter(([key]) => !DANGEROUS_FALLBACK_KEYS.has(key))
            .flatMap(([, value]) => {
                if (['string', 'number', 'boolean'].includes(typeof value)) return [String(value)];
                if (Array.isArray(value)) {
                    return value.filter((item) => ['string', 'number', 'boolean'].includes(typeof item)).map(String);
                }
                return [];
            })
            .join('\n')
            .slice(0, 12000);
    } catch (_) {
        return '';
    }
}

export default function TranslationResult({
    result,
    appFontSize,
    textAreaRef,
    speak,
    onCopyText,
    copyLabel,
}) {
    if (typeof result === 'string') {
        return (
            <textarea
                ref={textAreaRef}
                className='h-0 w-full resize-none bg-transparent select-text outline-none'
                style={{ fontSize: `${appFontSize}px` }}
                readOnly
                value={result}
            />
        );
    }

    if (isPluginResultV2(result)) {
        const normalized = normalizePluginResultV2(result);
        if (normalized) {
            return (
                <StructuredResult
                    result={normalized}
                    appFontSize={appFontSize}
                    onCopyText={onCopyText}
                    copyLabel={copyLabel}
                />
            );
        }
    }

    if (isLegacyPluginResult(result)) {
        return <LegacyResult result={result} appFontSize={appFontSize} speak={speak} />;
    }

    const fallbackText = resolveFallbackText(result);
    return fallbackText ? (
        <div
            className='whitespace-pre-wrap break-words select-text'
            style={{ fontSize: `${appFontSize}px` }}
        >
            {fallbackText}
        </div>
    ) : null;
}
