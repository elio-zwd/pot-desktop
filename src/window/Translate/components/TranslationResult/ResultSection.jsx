import React, { useState } from 'react';
import { Button, Chip, Tooltip } from '@nextui-org/react';
import { BiChevronDown, BiChevronRight } from 'react-icons/bi';
import { MdContentCopy } from 'react-icons/md';

const FALLBACK_TITLES = {
    summary: 'Summary',
    metadata: 'Details',
    dictionary: 'Dictionary',
    'code-list': 'Code',
    note: 'Note',
    status: 'Status',
};

const STATUS_STYLES = {
    info: 'border-primary-200 bg-primary-50/40',
    success: 'border-success-200 bg-success-50/40',
    warning: 'border-warning-200 bg-warning-50/40',
    error: 'border-danger-200 bg-danger-50/40',
};

const PAIRED_SOURCE_STYLES = {
    local: 'border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-700 dark:bg-primary-950 dark:text-primary-300',
    ai: 'border-secondary-200 bg-secondary-50 text-secondary-700 dark:border-secondary-700 dark:bg-secondary-950 dark:text-secondary-300',
};

function PairedLabel({ label, source }) {
    return (
        <span
            className={`inline-flex w-fit items-center rounded-medium border px-2 py-1 text-xs font-semibold ${
                PAIRED_SOURCE_STYLES[source] || 'border-divider bg-content2 text-default-600'
            }`}
        >
            {label}
        </span>
    );
}

function LoadingPlaceholder() {
    return (
        <div className='flex min-h-[44px] items-center' aria-label='AI 翻译加载中' role='status'>
            <div className='w-full animate-pulse space-y-2'>
                <div className='h-3 w-4/5 rounded-full bg-secondary-200/70 dark:bg-secondary-800/70' />
                <div className='h-3 w-3/5 rounded-full bg-secondary-100 dark:bg-secondary-900/70' />
            </div>
        </div>
    );
}

function SourceChip({ source }) {
    if (!source || source === 'unknown') return null;
    return (
        <Chip size='sm' variant='flat' className='h-5 shrink-0 text-[10px] uppercase'>
            {source}
        </Chip>
    );
}

function CopyButton({ text, onCopyText, copyLabel }) {
    if (!text || !onCopyText) return null;
    return (
        <Tooltip content={copyLabel || 'Copy'}>
            <Button
                isIconOnly
                size='sm'
                variant='light'
                className='h-7 min-h-7 w-7 min-w-7 shrink-0'
                aria-label={copyLabel || 'Copy'}
                onPress={() => onCopyText(text)}
            >
                <MdContentCopy className='text-[14px]' />
            </Button>
        </Tooltip>
    );
}

function SummarySection({ section, appFontSize, onCopyText, copyLabel }) {
    return (
        <div className='flex min-w-0 items-start gap-2'>
            <div
                className='min-w-0 flex-1 whitespace-pre-wrap break-words font-semibold leading-relaxed select-text'
                style={{ fontSize: `${appFontSize + 2}px` }}
            >
                {section.content}
            </div>
            <CopyButton text={section.copyText} onCopyText={onCopyText} copyLabel={copyLabel} />
        </div>
    );
}

function PairedSummarySection({ section, appFontSize, onCopyText, copyLabel }) {
    const paired = section.paired;
    return (
        <div className='grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-0'>
            <div className='min-w-0 space-y-2 sm:pr-4'>
                <PairedLabel label='本地词典' source={section.source} />
                <div className='flex min-w-0 items-start gap-2'>
                    <div
                        className='min-w-0 flex-1 whitespace-pre-wrap break-words font-semibold leading-relaxed select-text'
                        style={{ fontSize: `${appFontSize + 2}px` }}
                    >
                        {section.content}
                    </div>
                    <CopyButton text={section.copyText} onCopyText={onCopyText} copyLabel={copyLabel} />
                </div>
            </div>
            <div className='min-w-0 border-t border-divider pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0'>
                <PairedLabel label={paired.label} source={paired.source} />
                {paired.state === 'loading' ? (
                    <LoadingPlaceholder />
                ) : (
                    <div
                        className='mt-2 whitespace-pre-wrap break-words font-medium leading-relaxed select-text'
                        style={{ fontSize: `${appFontSize}px` }}
                    >
                        {paired.content}
                    </div>
                )}
            </div>
        </div>
    );
}

function MetadataSection({ section, appFontSize, onCopyText, copyLabel }) {
    return (
        <div className='flex min-w-0 flex-col gap-3'>
            {section.items.length > 0 && (
                <div className='flex min-w-0 flex-col gap-2'>
                    {section.items.map((item, index) => (
                        <div key={`${section.id}-item-${index}`} className='flex min-w-0 flex-wrap items-start gap-2'>
                            <span
                                className='min-w-[72px] shrink-0 text-default-500'
                                style={{ fontSize: `${Math.max(10, appFontSize - 2)}px` }}
                            >
                                {item.label}
                            </span>
                            <span
                                className='min-w-0 flex-1 basis-[160px] whitespace-pre-wrap break-words font-medium select-text'
                                style={{ fontSize: `${appFontSize}px` }}
                            >
                                {item.value}
                            </span>
                            <CopyButton text={item.copyText} onCopyText={onCopyText} copyLabel={copyLabel} />
                        </div>
                    ))}
                </div>
            )}
            {section.tokens.length > 0 && (
                <div className='flex min-w-0 flex-wrap gap-1.5'>
                    {section.tokens.map((token, index) => (
                        <Chip key={`${section.id}-token-${index}`} size='sm' variant='flat' className='max-w-full'>
                            <span className='break-all font-mono'>{token}</span>
                        </Chip>
                    ))}
                </div>
            )}
        </div>
    );
}

function DictionarySection({ section, appFontSize, onCopyText, copyLabel }) {
    return (
        <div className='min-w-0 divide-y divide-divider'>
            {section.items.map((item, index) => (
                <div key={`${section.id}-item-${index}`} className='flex min-w-0 flex-wrap items-start gap-2 py-2 first:pt-0 last:pb-0'>
                    <div className='min-w-[92px] max-w-full shrink-0'>
                        <div className='break-all font-mono font-semibold select-text' style={{ fontSize: `${appFontSize}px` }}>
                            {item.token}
                        </div>
                        {item.phonetic && (
                            <div
                                className='break-words text-default-400 select-text'
                                style={{ fontSize: `${Math.max(10, appFontSize - 2)}px` }}
                            >
                                {item.phonetic}
                            </div>
                        )}
                    </div>
                    <div className='min-w-0 flex-1 basis-[160px]'>
                        <div
                            className='whitespace-pre-wrap break-words select-text'
                            style={{ fontSize: `${appFontSize}px` }}
                        >
                            {item.meaning}
                        </div>
                        <SourceChip source={item.source} />
                    </div>
                    <CopyButton text={item.copyText} onCopyText={onCopyText} copyLabel={copyLabel} />
                </div>
            ))}
        </div>
    );
}

function PairedDictionarySection({ section, appFontSize }) {
    return (
        <div className='min-w-0 overflow-hidden rounded-medium border border-divider'>
            <div className='grid grid-cols-1 border-b border-divider sm:grid-cols-2'>
                <div className='px-3 py-2 sm:pr-4'>
                    <PairedLabel label='本地词典' source='local' />
                </div>
                <div className='border-t border-divider px-3 py-2 sm:border-l sm:border-t-0 sm:pl-4'>
                    <PairedLabel label={section.paired.label} source={section.paired.source} />
                </div>
            </div>
            {section.items.map((item, index) => {
                const paired = item.paired;
                return (
                    <div
                        key={`${section.id}-item-${index}`}
                        className='grid min-w-0 grid-cols-1 border-b border-divider last:border-b-0 sm:grid-cols-2'
                    >
                        <div className='min-w-0 px-3 py-3 sm:pr-4'>
                            <div
                                className='break-all font-mono font-semibold text-primary select-text'
                                style={{ fontSize: `${appFontSize}px` }}
                            >
                                {item.token}
                            </div>
                            {item.phonetic && (
                                <div
                                    className='mt-0.5 break-words text-default-400 select-text'
                                    style={{ fontSize: `${Math.max(10, appFontSize - 2)}px` }}
                                >
                                    /{item.phonetic.replace(/^\/+|\/+$/g, '')}/
                                </div>
                            )}
                            <div
                                className='mt-1 whitespace-pre-wrap break-words select-text'
                                style={{ fontSize: `${appFontSize}px` }}
                            >
                                {item.meaning}
                            </div>
                        </div>
                        <div className='min-w-0 border-t border-divider px-3 py-3 sm:border-l sm:border-t-0 sm:pl-4'>
                            {paired?.state === 'loading' ? (
                                <LoadingPlaceholder />
                            ) : paired?.content ? (
                                <div
                                    className='whitespace-pre-wrap break-words select-text'
                                    style={{ fontSize: `${appFontSize}px` }}
                                >
                                    {paired.content}
                                </div>
                            ) : (
                                <span className='text-default-400' style={{ fontSize: `${appFontSize}px` }}>
                                    —
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function CodeListSection({ section, appFontSize, onCopyText, copyLabel }) {
    return (
        <div className='flex min-w-0 flex-col gap-1.5'>
            {section.items.map((item, index) => (
                <div key={`${section.id}-item-${index}`} className='flex min-w-0 flex-wrap items-center gap-2'>
                    <span
                        className='min-w-[72px] shrink-0 text-default-500'
                        style={{ fontSize: `${Math.max(10, appFontSize - 2)}px` }}
                    >
                        {item.label}
                    </span>
                    <code
                        className='min-w-0 flex-1 basis-[180px] whitespace-pre-wrap break-all rounded-medium bg-content1 px-2 py-1 select-text'
                        style={{ fontSize: `${Math.max(10, appFontSize - 1)}px` }}
                    >
                        {item.value}
                    </code>
                    <CopyButton text={item.copyText} onCopyText={onCopyText} copyLabel={copyLabel} />
                </div>
            ))}
        </div>
    );
}

function TextSection({ section, appFontSize, onCopyText, copyLabel }) {
    return (
        <div className='flex min-w-0 items-start gap-2'>
            <div
                className='min-w-0 flex-1 whitespace-pre-wrap break-words select-text'
                style={{ fontSize: `${appFontSize}px` }}
            >
                {section.content}
            </div>
            <CopyButton text={section.copyText} onCopyText={onCopyText} copyLabel={copyLabel} />
        </div>
    );
}

function SectionContent({ section, appFontSize, onCopyText, copyLabel }) {
    const props = { section, appFontSize, onCopyText, copyLabel };
    switch (section.type) {
        case 'summary':
            return section.paired ? <PairedSummarySection {...props} /> : <SummarySection {...props} />;
        case 'metadata':
            return <MetadataSection {...props} />;
        case 'dictionary':
            return section.paired ? <PairedDictionarySection {...props} /> : <DictionarySection {...props} />;
        case 'code-list':
            return <CodeListSection {...props} />;
        case 'note':
        case 'status':
            return <TextSection {...props} />;
        default:
            return null;
    }
}

export default function ResultSection({ section, appFontSize, onCopyText, copyLabel }) {
    const [collapsed, setCollapsed] = useState(section.defaultCollapsed);
    const statusClass = section.type === 'status' ? STATUS_STYLES[section.severity] : 'border-divider bg-content2/50';

    return (
        <section className={`min-w-0 overflow-hidden rounded-large border ${statusClass}`}>
            <div className='flex min-w-0 items-center justify-between gap-2 px-3 py-2'>
                <div className='flex min-w-0 items-center gap-2'>
                    {section.collapsible && (
                        <Button
                            isIconOnly
                            size='sm'
                            variant='light'
                            className='h-6 min-h-6 w-6 min-w-6 shrink-0'
                            aria-label={collapsed ? 'Expand section' : 'Collapse section'}
                            onPress={() => setCollapsed((value) => !value)}
                        >
                            {collapsed ? <BiChevronRight /> : <BiChevronDown />}
                        </Button>
                    )}
                    <h3 className='min-w-0 break-words font-semibold' style={{ fontSize: `${appFontSize}px` }}>
                        {section.title || FALLBACK_TITLES[section.type]}
                    </h3>
                </div>
                <div className='flex shrink-0 items-center gap-1'>
                    <SourceChip source={section.source} />
                    {section.type === 'status' && (
                        <Chip size='sm' variant='flat' className='h-5 text-[10px] uppercase'>
                            {section.severity}
                        </Chip>
                    )}
                </div>
            </div>
            {!collapsed && (
                <div className='min-w-0 border-t border-divider px-3 py-3'>
                    <SectionContent
                        section={section}
                        appFontSize={appFontSize}
                        onCopyText={onCopyText}
                        copyLabel={copyLabel}
                    />
                </div>
            )}
        </section>
    );
}
