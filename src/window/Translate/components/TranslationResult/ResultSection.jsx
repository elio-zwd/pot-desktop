import React, { useState } from 'react';
import { Button, Chip, Tooltip } from '@nextui-org/react';
import { BiChevronDown, BiChevronRight } from 'react-icons/bi';
import { BsCheckCircleFill, BsStars } from 'react-icons/bs';
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
    info: 'border-blue-200 bg-blue-50/40 dark:border-blue-800 dark:bg-blue-950/30',
    success: 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-800 dark:bg-emerald-950/30',
    warning: 'border-amber-200 bg-amber-50/40 dark:border-amber-800 dark:bg-amber-950/30',
    error: 'border-rose-200 bg-rose-50/40 dark:border-rose-800 dark:bg-rose-950/30',
};

const PAIRED_SOURCE_STYLES = {
    local: 'border-blue-200/70 bg-blue-50 text-blue-600 dark:border-blue-800/60 dark:bg-blue-950/50 dark:text-blue-300',
    ai: 'border-purple-200/70 bg-purple-50 text-purple-600 dark:border-purple-800/60 dark:bg-purple-950/50 dark:text-purple-300',
};

const PAIRED_DIVIDER_CLASS = 'border-default-200/60 dark:border-default-100/20';

function PairedLabel({ label, source }) {
    const isLocal = source === 'local';
    const isAi = source === 'ai';
    return (
        <span
            className={`inline-flex w-fit items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-xs font-semibold tracking-wide ${
                PAIRED_SOURCE_STYLES[source] || 'border-default-200 bg-default-100 text-default-600'
            }`}
        >
            {isLocal && <BsCheckCircleFill className='text-[11px] text-blue-600 dark:text-blue-400 shrink-0' />}
            {isAi && <BsStars className='text-[11px] text-purple-600 dark:text-purple-400 shrink-0' />}
            <span>{label}</span>
        </span>
    );
}

function LoadingPlaceholder() {
    return (
        <div className='flex min-h-[44px] items-center' aria-label='AI 翻译加载中' role='status'>
            <div className='w-full animate-pulse space-y-2'>
                <div className='h-3 w-4/5 rounded-full bg-purple-200/70 dark:bg-purple-800/60' />
                <div className='h-3 w-3/5 rounded-full bg-purple-100 dark:bg-purple-900/40' />
            </div>
        </div>
    );
}

function SourceChip({ source }) {
    if (!source || source === 'unknown') return null;
    return (
        <Chip size='sm' variant='flat' className='h-5 shrink-0 text-[10px] uppercase font-mono'>
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
                className='h-6 min-h-6 w-6 min-w-6 shrink-0 rounded-md text-default-400 hover:text-default-700 hover:bg-default-100'
                aria-label={copyLabel || 'Copy'}
                onPress={() => onCopyText(text)}
            >
                <MdContentCopy className='text-[13px]' />
            </Button>
        </Tooltip>
    );
}

function SummarySection({ section, appFontSize, onCopyText, copyLabel }) {
    return (
        <div className='flex min-w-0 items-start gap-3'>
            <div
                className='min-w-0 flex-1 whitespace-pre-wrap break-words font-bold tracking-tight leading-tight select-text text-default-900'
                style={{ fontSize: `${Math.max(18, appFontSize + 4)}px` }}
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
        <div className='grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-0'>
            {/* 左侧：本地词典 */}
            <div className='min-w-0 space-y-2 sm:pr-5'>
                <PairedLabel label='本地词典' source={section.source} />
                <div>
                    <span
                        className='text-xs font-medium text-default-400 tracking-wider select-none'
                        style={{ fontSize: `${Math.max(11, appFontSize - 4)}px` }}
                    >
                        核心释义
                    </span>
                    <div className='flex min-w-0 items-start gap-2 mt-1'>
                        <div
                            className='min-w-0 flex-1 whitespace-pre-wrap break-words font-bold tracking-tight leading-tight select-text text-default-900'
                            style={{ fontSize: `${Math.max(20, appFontSize + 6)}px` }}
                        >
                            {section.content}
                        </div>
                        <CopyButton text={section.copyText} onCopyText={onCopyText} copyLabel={copyLabel} />
                    </div>
                </div>
            </div>
            {/* 右侧：AI 翻译 */}
            <div className={`min-w-0 border-t pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0 ${PAIRED_DIVIDER_CLASS}`}>
                <PairedLabel label={paired.label} source={paired.source} />
                {paired.state === 'loading' ? (
                    <div className='mt-3'>
                        <LoadingPlaceholder />
                    </div>
                ) : (
                    <div
                        className='mt-3 whitespace-pre-wrap break-words font-normal leading-relaxed select-text text-default-800'
                        style={{ fontSize: `${Math.max(14, appFontSize)}px` }}
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
        <div className='flex min-w-0 flex-col gap-2.5'>
            {section.items.length > 0 && (
                <div className='flex min-w-0 flex-col gap-2'>
                    {section.items.map((item, index) => (
                        <div key={`${section.id}-item-${index}`} className='flex min-w-0 flex-wrap items-start gap-2'>
                            <span
                                className='min-w-[72px] shrink-0 text-default-400 font-medium'
                                style={{ fontSize: `${Math.max(10, appFontSize - 3)}px` }}
                            >
                                {item.label}
                            </span>
                            <span
                                className='min-w-0 flex-1 basis-[160px] whitespace-pre-wrap break-words font-medium select-text text-default-800'
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
                <div className='flex min-w-0 flex-wrap gap-1.5 pt-1'>
                    {section.tokens.map((token, index) => (
                        <Chip
                            key={`${section.id}-token-${index}`}
                            size='sm'
                            variant='flat'
                            className='max-w-full bg-default-100 text-default-700 font-mono text-xs'
                        >
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
        <div className='min-w-0 divide-y divide-default-100'>
            {section.items.map((item, index) => (
                <div key={`${section.id}-item-${index}`} className='flex min-w-0 flex-wrap items-start gap-3 py-2.5 first:pt-0 last:pb-0'>
                    <div className='min-w-[96px] max-w-full shrink-0'>
                        <span
                            className='inline-block font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100/70 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/40 select-text'
                            style={{ fontSize: `${Math.max(12, appFontSize - 2)}px` }}
                        >
                            {item.token}
                        </span>
                        {item.phonetic && (
                            <div
                                className='mt-0.5 font-mono text-default-400 select-text'
                                style={{ fontSize: `${Math.max(10, appFontSize - 3)}px` }}
                            >
                                {item.phonetic}
                            </div>
                        )}
                    </div>
                    <div className='min-w-0 flex-1 basis-[160px]'>
                        <div
                            className='whitespace-pre-wrap break-words select-text text-default-800'
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
        <div className={`min-w-0 overflow-hidden rounded-xl border bg-background ${PAIRED_DIVIDER_CLASS}`}>
            {/* 表头 */}
            <div className={`grid grid-cols-1 border-b bg-default-50/60 py-2 sm:grid-cols-2 ${PAIRED_DIVIDER_CLASS}`}>
                <div className='px-3.5 sm:pr-4'>
                    <PairedLabel label='本地词典' source='local' />
                </div>
                <div className={`border-t px-3.5 pt-2 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0 ${PAIRED_DIVIDER_CLASS}`}>
                    <PairedLabel label={section.paired.label} source={section.paired.source} />
                </div>
            </div>
            {/* 数据行 */}
            {section.items.map((item, index) => {
                const paired = item.paired;
                return (
                    <div
                        key={`${section.id}-item-${index}`}
                        className={`grid min-w-0 grid-cols-1 border-b last:border-b-0 sm:grid-cols-2 hover:bg-default-50/20 transition-colors ${PAIRED_DIVIDER_CLASS}`}
                    >
                        {/* 左侧：本地词典词条 */}
                        <div className='min-w-0 px-3.5 py-3 sm:pr-4 flex items-start gap-3'>
                            <div className='shrink-0 min-w-[70px]'>
                                <span
                                    className='inline-block font-mono font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100/70 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/40 select-text'
                                    style={{ fontSize: `${Math.max(12, appFontSize - 2)}px` }}
                                >
                                    {item.token}
                                </span>
                                {item.phonetic && (
                                    <div
                                        className='mt-1 font-mono text-default-400 select-text'
                                        style={{ fontSize: `${Math.max(10, appFontSize - 3)}px` }}
                                    >
                                        /{item.phonetic.replace(/^\/+|\/+$/g, '')}/
                                    </div>
                                )}
                            </div>
                            <div
                                className='min-w-0 flex-1 whitespace-pre-wrap break-words text-default-800 pt-0.5 select-text'
                                style={{ fontSize: `${Math.max(13, appFontSize - 1)}px` }}
                            >
                                {item.meaning}
                            </div>
                        </div>
                        {/* 右侧：AI 翻译词条 */}
                        <div className={`min-w-0 border-t px-3.5 py-3 sm:border-l sm:border-t-0 sm:pl-4 ${PAIRED_DIVIDER_CLASS}`}>
                            {paired?.state === 'loading' ? (
                                <LoadingPlaceholder />
                            ) : paired?.content ? (
                                <div
                                    className='whitespace-pre-wrap break-words text-default-800 pt-0.5 select-text leading-relaxed'
                                    style={{ fontSize: `${Math.max(13, appFontSize - 1)}px` }}
                                >
                                    {paired.content}
                                </div>
                            ) : (
                                <span className='text-default-400 pt-0.5 block' style={{ fontSize: `${appFontSize}px` }}>
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
        <div className='flex min-w-0 flex-col gap-2'>
            {section.items.map((item, index) => (
                <div key={`${section.id}-item-${index}`} className='flex min-w-0 flex-wrap items-center gap-2.5'>
                    <span
                        className='min-w-[72px] shrink-0 text-default-400 font-medium'
                        style={{ fontSize: `${Math.max(10, appFontSize - 3)}px` }}
                    >
                        {item.label}
                    </span>
                    <code
                        className='min-w-0 flex-1 basis-[180px] whitespace-pre-wrap break-all rounded-md bg-default-100/70 border border-default-200/50 px-2 py-1 font-mono select-text text-default-900'
                        style={{ fontSize: `${Math.max(11, appFontSize - 1)}px` }}
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
        <div className='flex min-w-0 items-start gap-2.5'>
            <div
                className='min-w-0 flex-1 whitespace-pre-wrap break-words select-text text-default-800 leading-relaxed'
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
    const isPaired = section.paired !== undefined;
    const isSummary = section.type === 'summary';

    const statusClass =
        section.type === 'status'
            ? STATUS_STYLES[section.severity]
            : isPaired
              ? 'border-default-200/60 bg-background shadow-xs'
              : 'border-default-200/40 bg-background';

    // 核心释义（summary）在非折叠状态下采用通透卡片设计
    if (isSummary && !section.collapsible && isPaired) {
        return (
            <section className='min-w-0 rounded-2xl border border-default-200/60 bg-background p-4 shadow-xs'>
                <SectionContent
                    section={section}
                    appFontSize={appFontSize}
                    onCopyText={onCopyText}
                    copyLabel={copyLabel}
                />
            </section>
        );
    }

    return (
        <section className={`min-w-0 overflow-hidden rounded-xl border ${statusClass}`}>
            <div
                className={`flex min-w-0 items-center justify-between gap-2 px-3.5 py-2.5 ${
                    isPaired ? 'bg-default-50/50' : 'bg-default-50/30'
                }`}
            >
                <div className='flex min-w-0 items-center gap-2'>
                    {section.collapsible && (
                        <Button
                            isIconOnly
                            size='sm'
                            variant='light'
                            className='h-6 min-h-6 w-6 min-w-6 shrink-0 text-default-500 hover:text-default-800'
                            aria-label={collapsed ? 'Expand section' : 'Collapse section'}
                            onPress={() => setCollapsed((value) => !value)}
                        >
                            {collapsed ? <BiChevronRight className='text-[16px]' /> : <BiChevronDown className='text-[16px]' />}
                        </Button>
                    )}
                    <h3 className='min-w-0 break-words font-semibold text-default-800' style={{ fontSize: `${appFontSize}px` }}>
                        {section.title || FALLBACK_TITLES[section.type]}
                    </h3>
                </div>
                <div className='flex shrink-0 items-center gap-1.5'>
                    <SourceChip source={section.source} />
                    {section.type === 'status' && (
                        <Chip size='sm' variant='flat' className='h-5 text-[10px] uppercase font-mono'>
                            {section.severity}
                        </Chip>
                    )}
                </div>
            </div>
            {!collapsed && (
                <div
                    className={`min-w-0 border-t px-3.5 py-3.5 ${
                        isPaired ? PAIRED_DIVIDER_CLASS : 'border-default-100'
                    }`}
                >
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
