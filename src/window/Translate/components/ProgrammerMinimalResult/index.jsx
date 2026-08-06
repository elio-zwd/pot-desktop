import { Button, Card, CardBody } from '@nextui-org/react';
import React, { useRef, useState } from 'react';
import { MdContentCopy, MdExpandLess, MdExpandMore, MdWarningAmber } from 'react-icons/md';

import {
    createFullCopyRequest,
    createInitialExpandedState,
    createNamingCopyRequest,
    createProgrammerMinimalResultIds,
    getNamingItems,
    getSourceLabelKey,
    getVisibleDetailSections,
    toggleExpanded,
} from './model';

function SourceLabel({ source, labels }) {
    return (
        <span className='inline-flex max-w-full items-center rounded-full bg-content2 px-2 py-1 text-tiny text-default-600'>
            <span className='break-words [overflow-wrap:anywhere]'>
                {labels.source[source] ?? source}
            </span>
        </span>
    );
}

export default function ProgrammerMinimalResult({ result, idPrefix, labels, onCopy }) {
    const [expanded, setExpanded] = useState(createInitialExpandedState);
    const copyStatusRef = useRef(null);
    const ids = createProgrammerMinimalResultIds(idPrefix);
    const visibleSections = getVisibleDetailSections(result);
    const sourceLabelKey = getSourceLabelKey(result.summary.source);
    const sourceLabel = sourceLabelKey ? labels.source[sourceLabelKey] : result.summary.source;

    const announceCopied = () => {
        if (!copyStatusRef.current) return;
        const liveRegion = copyStatusRef.current;
        liveRegion.textContent = '';
        requestAnimationFrame(() => {
            if (copyStatusRef.current === liveRegion) {
                liveRegion.textContent = labels.copied;
            }
        });
    };

    const handleCopy = (request) => {
        let copyResult;
        try {
            copyResult = onCopy(request.text, request.meta);
        } catch {
            return;
        }

        void Promise.resolve(copyResult).then(announceCopied).catch(() => undefined);
    };

    return (
        <Card
            id={ids.root}
            shadow='none'
            className='w-full min-w-0 max-w-full overflow-hidden rounded-[10px]'
        >
            <CardBody className='min-w-0 gap-3 p-3'>
                <div className='min-w-0 space-y-2'>
                    <code className='block min-w-0 whitespace-pre-wrap break-words text-medium font-semibold [overflow-wrap:anywhere]'>
                        {result.identifier.original}
                    </code>
                    <p className='min-w-0 whitespace-pre-wrap break-words text-small [overflow-wrap:anywhere]'>
                        {result.summary.text}
                    </p>
                    <SourceLabel
                        source={sourceLabelKey ?? result.summary.source}
                        labels={labels}
                    />
                </div>

                {result.summary.source === 'local_fallback' && (
                    <p
                        role='status'
                        aria-live='polite'
                        className='flex min-w-0 items-start gap-1.5 rounded-medium bg-warning-50 p-2 text-small text-warning-700'
                    >
                        <MdWarningAmber
                            aria-hidden='true'
                            focusable='false'
                            className='mt-0.5 shrink-0 text-base'
                        />
                        <span className='min-w-0 break-words [overflow-wrap:anywhere]'>{sourceLabel}</span>
                    </p>
                )}

                <div className='flex min-w-0 flex-wrap items-center gap-2'>
                    <button
                        id={ids.toggle}
                        type='button'
                        aria-expanded={expanded}
                        aria-controls={ids.details}
                        className='inline-flex min-h-8 max-w-full items-center justify-center gap-1 rounded-medium px-3 py-1.5 text-small font-medium text-primary outline-none hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary'
                        onClick={() => setExpanded((current) => toggleExpanded(current))}
                    >
                        {expanded ? (
                            <MdExpandLess
                                aria-hidden='true'
                                focusable='false'
                                className='shrink-0 text-lg'
                            />
                        ) : (
                            <MdExpandMore
                                aria-hidden='true'
                                focusable='false'
                                className='shrink-0 text-lg'
                            />
                        )}
                        <span className='min-w-0 break-words [overflow-wrap:anywhere]'>
                            {expanded ? labels.collapseDetails : labels.expandDetails}
                        </span>
                    </button>

                    <Button
                        size='sm'
                        variant='light'
                        aria-label={labels.copyFull}
                        startContent={
                            <MdContentCopy
                                aria-hidden='true'
                                focusable='false'
                                className='shrink-0 text-base'
                            />
                        }
                        className='h-auto min-h-8 max-w-full whitespace-normal px-3 py-1.5'
                        onPress={() => handleCopy(createFullCopyRequest(result))}
                    >
                        <span className='break-words [overflow-wrap:anywhere]'>{labels.copyFull}</span>
                    </Button>
                </div>

                <span
                    id={ids.copyStatus}
                    ref={copyStatusRef}
                    role='status'
                    aria-live='polite'
                    aria-atomic='true'
                    className='sr-only'
                />

                <div
                    id={ids.details}
                    role='region'
                    aria-labelledby={ids.toggle}
                    hidden={!expanded}
                    className='min-w-0 space-y-4 border-t border-divider pt-3'
                >
                    {visibleSections.includes('identifier') && (
                        <section
                            aria-labelledby={`${ids.details}-identifier-heading`}
                            className='min-w-0 space-y-2'
                        >
                            <h3
                                id={`${ids.details}-identifier-heading`}
                                className='text-small font-semibold'
                            >
                                {labels.identifier}
                            </h3>
                            <code className='block min-w-0 whitespace-pre-wrap break-words text-small [overflow-wrap:anywhere]'>
                                {result.identifier.original}
                            </code>
                            <p className='flex min-w-0 flex-wrap gap-x-2 gap-y-1 text-tiny text-default-600'>
                                <span className='break-words [overflow-wrap:anywhere]'>
                                    {result.identifier.detectedType}
                                </span>
                                <span aria-hidden='true'>·</span>
                                <span className='break-words [overflow-wrap:anywhere]'>
                                    {result.identifier.detectionMode}
                                </span>
                            </p>
                            <ul className='flex min-w-0 flex-wrap gap-1.5'>
                                {result.identifier.tokens.map((token, index) => (
                                    <li
                                        key={`${index}-${token}`}
                                        className='min-w-0 max-w-full rounded-medium bg-content2 px-2 py-1'
                                    >
                                        <code className='whitespace-pre-wrap break-words text-tiny [overflow-wrap:anywhere]'>
                                            {token}
                                        </code>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {visibleSections.includes('tokenMeanings') && (
                        <section
                            aria-labelledby={`${ids.details}-token-meanings-heading`}
                            className='min-w-0 space-y-2'
                        >
                            <h3
                                id={`${ids.details}-token-meanings-heading`}
                                className='text-small font-semibold'
                            >
                                {labels.tokenMeanings}
                            </h3>
                            <ul className='min-w-0 space-y-2'>
                                {result.tokenMeanings.map((item) => (
                                    <li
                                        key={`${item.index}-${item.token}`}
                                        className='min-w-0 rounded-medium bg-content2 p-2'
                                    >
                                        <div className='flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1'>
                                            <code className='min-w-0 whitespace-pre-wrap break-words text-small font-semibold [overflow-wrap:anywhere]'>
                                                {item.token}
                                            </code>
                                            {item.phonetic && (
                                                <span className='min-w-0 break-words text-tiny text-default-600 [overflow-wrap:anywhere]'>
                                                    {item.phonetic}
                                                </span>
                                            )}
                                            <SourceLabel
                                                source={item.source}
                                                labels={labels}
                                            />
                                        </div>
                                        <p className='mt-1 min-w-0 whitespace-pre-wrap break-words text-small [overflow-wrap:anywhere]'>
                                            {item.meaning}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {visibleSections.includes('naming') && (
                        <section
                            aria-labelledby={`${ids.details}-naming-heading`}
                            className='min-w-0 space-y-2'
                        >
                            <h3
                                id={`${ids.details}-naming-heading`}
                                className='text-small font-semibold'
                            >
                                {labels.naming}
                            </h3>
                            <ul className='min-w-0 space-y-2'>
                                {getNamingItems(result.naming).map((item) => (
                                    <li
                                        key={item.key}
                                        className='flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-medium bg-content2 p-2'
                                    >
                                        <div className='min-w-0 flex-1 basis-48'>
                                            <p className='min-w-0 break-words text-tiny text-default-600 [overflow-wrap:anywhere]'>
                                                {labels.namingKeys[item.key]}
                                            </p>
                                            <code className='block min-w-0 whitespace-pre-wrap break-words text-small [overflow-wrap:anywhere]'>
                                                {item.value}
                                            </code>
                                        </div>
                                        {item.copyable && (
                                            <Button
                                                isIconOnly
                                                size='sm'
                                                variant='light'
                                                aria-label={`${labels.copyItem}: ${labels.namingKeys[item.key]}`}
                                                className='shrink-0'
                                                onPress={() =>
                                                    handleCopy(createNamingCopyRequest(result, item.key))
                                                }
                                            >
                                                <MdContentCopy
                                                    aria-hidden='true'
                                                    focusable='false'
                                                    className='text-base'
                                                />
                                            </Button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {visibleSections.includes('diagnostics') && (
                        <section
                            aria-labelledby={`${ids.details}-diagnostics-heading`}
                            className='min-w-0 space-y-2'
                        >
                            <h3
                                id={`${ids.details}-diagnostics-heading`}
                                className='text-small font-semibold'
                            >
                                {labels.diagnostics}
                            </h3>
                            <ul className='min-w-0 space-y-2'>
                                {result.diagnostics.map((diagnostic, index) => (
                                    <li
                                        key={`${index}-${diagnostic.code}-${diagnostic.severity}`}
                                        className='min-w-0 rounded-medium border border-warning-300 p-2'
                                    >
                                        <p className='flex min-w-0 flex-wrap gap-x-2 gap-y-1 text-tiny font-medium'>
                                            <span className='break-words [overflow-wrap:anywhere]'>
                                                {diagnostic.severity}
                                            </span>
                                            <code className='break-words [overflow-wrap:anywhere]'>
                                                {diagnostic.code}
                                            </code>
                                        </p>
                                        <p className='mt-1 min-w-0 whitespace-pre-wrap break-words text-small [overflow-wrap:anywhere]'>
                                            {diagnostic.message}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </div>
            </CardBody>
        </Card>
    );
}
