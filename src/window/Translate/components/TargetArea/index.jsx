import {
    Button,
    ButtonGroup,
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger,
    Tooltip,
} from '@nextui-org/react';
import { useSpring, animated } from '@react-spring/web';
import { writeText } from '@tauri-apps/api/clipboard';
import { BaseDirectory, readTextFile } from '@tauri-apps/api/fs';
import { sendNotification } from '@tauri-apps/api/notification';
import { semanticColors } from '@nextui-org/theme';
import { useAtomValue } from 'jotai';
import { nanoid } from 'nanoid';
import { useTheme } from 'next-themes';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { BiCollapseVertical, BiExpandVertical } from 'react-icons/bi';
import { GiCycle } from 'react-icons/gi';
import { HiOutlineVolumeUp } from 'react-icons/hi';
import { MdContentCopy } from 'react-icons/md';
import { TbTransformFilled } from 'react-icons/tb';
import PulseLoader from 'react-spinners/PulseLoader';
import { useTranslation } from 'react-i18next';
import useMeasure from 'react-use-measure';
import Database from 'tauri-plugin-sql-api';
import { error as logError, info } from 'tauri-plugin-log-api';

import { useConfig, useToastStyle, useVoice } from '../../../../hooks';
import * as builtinCollectionServices from '../../../../services/collection';
import * as builtinTranslateServices from '../../../../services/translate';
import * as builtinTtsServices from '../../../../services/tts';
import { invoke_plugin } from '../../../../utils/invoke_plugin';
import { normalizePluginResult } from '../../../../utils/plugin_result';
import {
    INSTANCE_NAME_CONFIG_KEY,
    ServiceSourceType,
    getDisplayInstanceName,
    getServiceName,
    getServiceSouceType,
    whetherPluginService,
} from '../../../../utils/service_instance';
import { sourceLanguageAtom, targetLanguageAtom } from '../LanguageArea';
import { detectLanguageAtom, sourceTextAtom } from '../SourceArea';
import ProgrammerMinimalResult from '../ProgrammerMinimalResult';
import {
    createAutoCopyText,
    createTranslatePluginOptions,
    decideResultCommit,
    getResultRenderType,
    getTrustedPlainText,
    isRequestCurrent,
} from './result_flow';

class ProgrammerResultErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { failed: false };
    }

    static getDerivedStateFromError() {
        return { failed: true };
    }

    componentDidCatch() {
        logError('Programmer result renderer failed');
    }

    render() {
        if (!this.state.failed) {
            return this.props.children;
        }

        return (
            <div className='min-w-0 max-w-full space-y-2'>
                <p
                    role='status'
                    aria-live='polite'
                    className='break-words text-small text-warning-700 [overflow-wrap:anywhere]'
                >
                    {this.props.fallbackLabel}
                </p>
                <textarea
                    className='block h-auto min-h-20 w-full min-w-0 max-w-full resize-y whitespace-pre-wrap break-words bg-transparent outline-none [overflow-wrap:anywhere]'
                    readOnly
                    value={this.props.plainText}
                />
            </div>
        );
    }
}

export default function TargetArea(props) {
    const {
        index,
        name,
        translateServiceInstanceList,
        pluginList,
        serviceInstanceConfigMap,
        ...drag
    } = props;

    const [currentTranslateServiceInstanceKey, setCurrentTranslateServiceInstanceKey] = useState(name);
    const [appFontSize] = useConfig('app_font_size', 16);
    const [collectionServiceList] = useConfig('collection_service_list', []);
    const [ttsServiceList] = useConfig('tts_service_list', ['lingva_tts']);
    const [translateSecondLanguage] = useConfig('translate_second_language', 'en');
    const [historyDisable] = useConfig('history_disable', false);
    const [autoCopy] = useConfig('translate_auto_copy', 'disable');
    const [hideWindow] = useConfig('translate_hide_window', false);
    const [clipboardMonitor] = useConfig('clipboard_monitor', false);

    const [isLoading, setIsLoading] = useState(false);
    const [hide, setHide] = useState(true);
    const [normalizedResult, setNormalizedResult] = useState(null);
    const [resultRequestId, setResultRequestId] = useState('');
    const [error, setError] = useState('');
    const [ttsPluginInfo, setTtsPluginInfo] = useState();

    const sourceText = useAtomValue(sourceTextAtom);
    const sourceLanguage = useAtomValue(sourceLanguageAtom);
    const targetLanguage = useAtomValue(targetLanguageAtom);
    const detectLanguage = useAtomValue(detectLanguageAtom);

    const activeRequestIdRef = useRef(null);
    const latestStreamResultRef = useRef(null);
    const textAreaRef = useRef(null);
    const { t } = useTranslation();
    const toastStyle = useToastStyle();
    const speak = useVoice();
    const { resolvedTheme } = useTheme();

    const trustedPlainText = getTrustedPlainText(normalizedResult);
    const resultRenderType = getResultRenderType(normalizedResult);
    const legacyResult = resultRenderType === 'legacy-object' ? normalizedResult.raw : null;
    const oldStringResult = normalizedResult?.kind === 'text' ? trustedPlainText : null;

    const programmerLabels = useMemo(
        () => ({
            expandDetails: t('translate.programmer.expand_details', { defaultValue: '展开详情' }),
            collapseDetails: t('translate.programmer.collapse_details', { defaultValue: '收起详情' }),
            copyFull: t('translate.programmer.copy_full', { defaultValue: '复制全文' }),
            copyItem: t('translate.programmer.copy_item', { defaultValue: '复制此项' }),
            copied: t('translate.programmer.copied', { defaultValue: '已复制' }),
            identifier: t('translate.programmer.identifier', { defaultValue: '标识符' }),
            tokenMeanings: t('translate.programmer.token_meanings', { defaultValue: '词义' }),
            naming: t('translate.programmer.naming', { defaultValue: '命名转换' }),
            diagnostics: t('translate.programmer.diagnostics', { defaultValue: '诊断' }),
            source: {
                local: t('translate.programmer.source.local', { defaultValue: '本地' }),
                local_ai: t('translate.programmer.source.local_ai', { defaultValue: '本地 + AI' }),
                ai: t('translate.programmer.source.ai', { defaultValue: 'AI' }),
                local_fallback: t('translate.programmer.source.local_fallback', {
                    defaultValue: '本地回退',
                }),
                literal: t('translate.programmer.source.literal', { defaultValue: '保留原文' }),
            },
            namingKeys: {
                camelCase: t('translate.programmer.naming.camel_case', { defaultValue: 'camelCase' }),
                pascalCase: t('translate.programmer.naming.pascal_case', { defaultValue: 'PascalCase' }),
                snakeCase: t('translate.programmer.naming.snake_case', { defaultValue: 'snake_case' }),
                screamingSnakeCase: t('translate.programmer.naming.screaming_snake_case', {
                    defaultValue: 'SCREAMING_SNAKE_CASE',
                }),
                kebabCase: t('translate.programmer.naming.kebab_case', { defaultValue: 'kebab-case' }),
            },
        }),
        [t]
    );

    const getInstanceName = (instanceKey, serviceNameSupplier) => {
        const instanceConfig = serviceInstanceConfigMap[instanceKey] ?? {};
        return getDisplayInstanceName(instanceConfig[INSTANCE_NAME_CONFIG_KEY], serviceNameSupplier);
    };

    const invalidateCurrentRequest = () => {
        activeRequestIdRef.current = null;
        latestStreamResultRef.current = null;
    };

    const beginRequest = () => {
        const requestId = nanoid();
        activeRequestIdRef.current = requestId;
        latestStreamResultRef.current = null;
        setResultRequestId(requestId);
        setNormalizedResult(null);
        setError('');
        setIsLoading(true);
        setHide(true);
        return requestId;
    };

    const copyWithFeedback = async (text) => {
        try {
            await writeText(text);
        } catch (copyError) {
            toast.error(copyError.toString(), { style: toastStyle });
            throw copyError;
        }
    };

    const addToHistory = async ({
        requestId,
        text,
        source,
        target,
        serviceInstanceKey,
        result,
    }) => {
        if (!isRequestCurrent(activeRequestIdRef.current, requestId)) {
            return;
        }

        const db = await Database.load('sqlite:history.db');
        try {
            if (!isRequestCurrent(activeRequestIdRef.current, requestId)) {
                return;
            }

            try {
                await db.execute(
                    'INSERT into history (text, source, target, service, result, timestamp) VALUES ($1, $2, $3, $4, $5, $6)',
                    [text, source, target, serviceInstanceKey, result, Date.now()]
                );
            } catch {
                await db.execute(
                    'CREATE TABLE history(id INTEGER PRIMARY KEY AUTOINCREMENT, text TEXT NOT NULL,source TEXT NOT NULL,target TEXT NOT NULL,service TEXT NOT NULL, result TEXT NOT NULL,timestamp INTEGER NOT NULL)'
                );
                if (!isRequestCurrent(activeRequestIdRef.current, requestId)) {
                    return;
                }
                await db.execute(
                    'INSERT into history (text, source, target, service, result, timestamp) VALUES ($1, $2, $3, $4, $5, $6)',
                    [text, source, target, serviceInstanceKey, result, Date.now()]
                );
            }
        } finally {
            db.close();
        }
    };

    const runFinalSideEffects = ({
        requestId,
        inputText,
        historySource,
        historyTarget,
        serviceInstanceKey,
        trustedText,
    }) => {
        if (!isRequestCurrent(activeRequestIdRef.current, requestId)) {
            return;
        }

        if (!historyDisable) {
            void addToHistory({
                requestId,
                text: inputText,
                source: historySource,
                target: historyTarget,
                serviceInstanceKey,
                result: trustedText,
            }).catch(() => {
                logError('Failed to write translation history');
            });
        }

        if (index !== 0 || clipboardMonitor) {
            return;
        }

        const clipboardText = createAutoCopyText({
            autoCopy,
            sourceText: inputText,
            trustedPlainText: trustedText,
        });
        if (clipboardText === null) {
            return;
        }

        void writeText(clipboardText)
            .then(() => {
                if (
                    hideWindow &&
                    isRequestCurrent(activeRequestIdRef.current, requestId)
                ) {
                    return sendNotification({
                        title: t('common.write_clipboard'),
                        body: clipboardText,
                    });
                }
                return undefined;
            })
            .catch(() => {
                logError('Failed to auto-copy final translation result');
            });
    };

    const commitStreamResult = (requestId, value, revealResult) => {
        const normalized = normalizePluginResult(value);
        const decision = decideResultCommit({
            activeRequestId: activeRequestIdRef.current,
            requestId,
            normalized,
            latestStreamResult: latestStreamResultRef.current,
            final: false,
        });

        if (decision.type !== 'display') {
            return;
        }

        latestStreamResultRef.current = decision.result;
        setNormalizedResult(decision.result);
        revealResult();
    };

    const commitFinalResult = ({ requestId, value, context, revealResult }) => {
        const normalized = normalizePluginResult(value);
        const decision = decideResultCommit({
            activeRequestId: activeRequestIdRef.current,
            requestId,
            normalized,
            latestStreamResult: latestStreamResultRef.current,
            final: true,
        });

        if (decision.type === 'ignore') {
            return;
        }

        setIsLoading(false);

        if (decision.type === 'display') {
            latestStreamResultRef.current = decision.result;
            setNormalizedResult(decision.result);
            revealResult();
        } else if (decision.type === 'preserve-stream') {
            setNormalizedResult(decision.result);
            revealResult();
        } else {
            setNormalizedResult(null);
            setHide(false);
            setError(t('translate.no_result', { defaultValue: 'No displayable result' }));
        }

        if (decision.trustedPlainText !== null) {
            runFinalSideEffects({
                requestId,
                ...context,
                trustedText: decision.trustedPlainText,
            });
        } else if (normalized.kind === 'unsupported') {
            info(`Translation result ignored: ${normalized.reason}`);
        }
    };

    const rejectRequest = (requestId, requestError) => {
        if (!isRequestCurrent(activeRequestIdRef.current, requestId)) {
            return;
        }
        info('Translation request rejected');
        setError(requestError.toString());
        setIsLoading(false);
        setHide(false);
    };

    const startTranslation = async ({
        inputText,
        fromLanguage,
        toLanguage,
        pluginDetectOption,
        builtinDetectOption,
        historySource,
        historyTarget,
    }) => {
        const requestId = beginRequest();
        const translateServiceName = getServiceName(currentTranslateServiceInstanceKey);
        const context = {
            inputText,
            historySource,
            historyTarget,
            serviceInstanceKey: translateServiceName,
        };
        let revealed = false;
        const revealResult = () => {
            if (!revealed) {
                revealed = true;
                setHide(false);
            }
        };

        if (whetherPluginService(currentTranslateServiceInstanceKey)) {
            const pluginInfo = pluginList.translate[translateServiceName];
            if (!(fromLanguage in pluginInfo.language) || !(toLanguage in pluginInfo.language)) {
                setError('Language not supported');
                setIsLoading(false);
                setHide(false);
                return;
            }

            try {
                const [func, utils] = await invoke_plugin('translate', translateServiceName);
                if (!isRequestCurrent(activeRequestIdRef.current, requestId)) {
                    return;
                }
                const instanceConfig = serviceInstanceConfigMap[currentTranslateServiceInstanceKey] ?? {};
                const options = createTranslatePluginOptions({
                    config: instanceConfig,
                    detect: pluginDetectOption,
                    setResult: (value) => commitStreamResult(requestId, value, revealResult),
                    utils,
                });
                Promise.resolve(
                    func(
                        inputText,
                        pluginInfo.language[fromLanguage],
                        pluginInfo.language[toLanguage],
                        options
                    )
                ).then(
                    (value) => {
                        info('Translation request resolved');
                        commitFinalResult({ requestId, value, context, revealResult });
                    },
                    (requestError) => rejectRequest(requestId, requestError)
                );
            } catch (requestError) {
                rejectRequest(requestId, requestError);
            }
            return;
        }

        const service = builtinTranslateServices[translateServiceName];
        const LanguageEnum = service.Language;
        if (!(fromLanguage in LanguageEnum) || !(toLanguage in LanguageEnum)) {
            setError('Language not supported');
            setIsLoading(false);
            setHide(false);
            return;
        }

        const instanceConfig = serviceInstanceConfigMap[currentTranslateServiceInstanceKey] ?? {};
        try {
            Promise.resolve(
                service.translate(inputText, LanguageEnum[fromLanguage], LanguageEnum[toLanguage], {
                    config: instanceConfig,
                    detect: builtinDetectOption,
                    setResult: (value) => commitStreamResult(requestId, value, revealResult),
                })
            ).then(
                (value) => {
                    info('Translation request resolved');
                    commitFinalResult({ requestId, value, context, revealResult });
                },
                (requestError) => rejectRequest(requestId, requestError)
            );
        } catch (requestError) {
            rejectRequest(requestId, requestError);
        }
    };

    const startInitialTranslation = () => {
        let nextTargetLanguage = targetLanguage;
        if (sourceLanguage === 'auto' && targetLanguage === detectLanguage) {
            nextTargetLanguage = translateSecondLanguage;
        }
        return startTranslation({
            inputText: sourceText.trim(),
            fromLanguage: sourceLanguage,
            toLanguage: nextTargetLanguage,
            pluginDetectOption: detectLanguage,
            builtinDetectOption: detectLanguage,
            historySource: detectLanguage,
            historyTarget: nextTargetLanguage,
        });
    };

    const startReverseTranslation = () => {
        if (trustedPlainText === null) {
            return;
        }

        const reverseTargetLanguage = sourceLanguage === 'auto' ? detectLanguage : sourceLanguage;
        const reverseSourceLanguage = sourceLanguage === 'auto' ? 'auto' : targetLanguage;
        return startTranslation({
            inputText: trustedPlainText,
            fromLanguage: reverseSourceLanguage,
            toLanguage: reverseTargetLanguage,
            pluginDetectOption: detectLanguage,
            builtinDetectOption: reverseSourceLanguage,
            historySource: sourceLanguage === 'auto' ? detectLanguage : reverseSourceLanguage,
            historyTarget: reverseTargetLanguage,
        });
    };

    useEffect(() => {
        invalidateCurrentRequest();
        setNormalizedResult(null);
        setResultRequestId('');
        setError('');
        setIsLoading(false);
        setHide(true);

        if (
            sourceText.trim() === '' ||
            !sourceLanguage ||
            !targetLanguage ||
            autoCopy === null ||
            hideWindow === null ||
            clipboardMonitor === null
        ) {
            return undefined;
        }

        if (autoCopy === 'source' && !clipboardMonitor) {
            const clipboardText = sourceText;
            void writeText(clipboardText)
                .then(() => {
                    if (hideWindow) {
                        return sendNotification({
                            title: t('common.write_clipboard'),
                            body: clipboardText,
                        });
                    }
                    return undefined;
                })
                .catch(() => {
                    logError('Failed to auto-copy source text');
                });
        }

        void startInitialTranslation();
        return undefined;
    }, [
        sourceText,
        sourceLanguage,
        targetLanguage,
        autoCopy,
        hideWindow,
        currentTranslateServiceInstanceKey,
        clipboardMonitor,
    ]);

    useEffect(
        () => () => {
            invalidateCurrentRequest();
        },
        []
    );

    useEffect(() => {
        if (textAreaRef.current === null) {
            return;
        }
        textAreaRef.current.style.height = '0px';
        if (resultRenderType === 'text' && trustedPlainText !== null) {
            textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
        }
    }, [resultRenderType, trustedPlainText]);

    useEffect(() => {
        if (ttsServiceList && getServiceSouceType(ttsServiceList[0]) === ServiceSourceType.PLUGIN) {
            readTextFile(`plugins/tts/${getServiceName(ttsServiceList[0])}/info.json`, {
                dir: BaseDirectory.AppConfig,
            }).then((infoStr) => {
                setTtsPluginInfo(JSON.parse(infoStr));
            });
        }
    }, [ttsServiceList]);

    const handleSpeak = async (speechText) => {
        const instanceKey = ttsServiceList[0];
        if (getServiceSouceType(instanceKey) === ServiceSourceType.PLUGIN) {
            const pluginConfig = serviceInstanceConfigMap[instanceKey];
            if (!ttsPluginInfo || !(targetLanguage in ttsPluginInfo.language)) {
                throw new Error('Language not supported');
            }
            const [func, utils] = await invoke_plugin('tts', getServiceName(instanceKey));
            const data = await func(speechText, ttsPluginInfo.language[targetLanguage], {
                config: pluginConfig,
                utils,
            });
            speak(data);
            return;
        }

        const service = builtinTtsServices[getServiceName(instanceKey)];
        if (!(targetLanguage in service.Language)) {
            throw new Error('Language not supported');
        }
        const instanceConfig = serviceInstanceConfigMap[instanceKey];
        const data = await service.tts(speechText, service.Language[targetLanguage], {
            config: instanceConfig,
        });
        speak(data);
    };

    const handleCollection = async (collectionServiceInstanceName) => {
        if (trustedPlainText === null) {
            return;
        }

        if (getServiceSouceType(collectionServiceInstanceName) === ServiceSourceType.PLUGIN) {
            const pluginConfig = serviceInstanceConfigMap[collectionServiceInstanceName];
            const [func, utils] = await invoke_plugin(
                'collection',
                getServiceName(collectionServiceInstanceName)
            );
            await func(sourceText.trim(), trustedPlainText, {
                config: pluginConfig,
                utils,
            });
        } else {
            const instanceConfig = serviceInstanceConfigMap[collectionServiceInstanceName];
            await builtinCollectionServices[getServiceName(collectionServiceInstanceName)].collection(
                sourceText,
                trustedPlainText,
                { config: instanceConfig }
            );
        }

        toast.success(t('translate.add_collection_success'), { style: toastStyle });
    };

    const renderLegacyResult = () => (
        <div className='min-w-0 max-w-full overflow-x-hidden'>
            {legacyResult.pronunciations?.map((pronunciation, pronunciationIndex) => (
                <div key={`pronunciation-${pronunciationIndex}`}>
                    {pronunciation.region && (
                        <span
                            className='mr-[12px] text-default-500'
                            style={{ fontSize: `${appFontSize}px` }}
                        >
                            {pronunciation.region}
                        </span>
                    )}
                    {pronunciation.symbol && (
                        <span
                            className='mr-[12px] text-default-500'
                            style={{ fontSize: `${appFontSize}px` }}
                        >
                            {pronunciation.symbol}
                        </span>
                    )}
                    {pronunciation.voice && pronunciation.voice !== '' && (
                        <HiOutlineVolumeUp
                            className='inline-block cursor-pointer'
                            style={{ fontSize: `${appFontSize}px` }}
                            onClick={() => speak(pronunciation.voice)}
                        />
                    )}
                </div>
            ))}
            {legacyResult.explanations?.map((explanation, explanationIndex) => (
                <div key={`explanation-${explanationIndex}`}>
                    {explanation.explains?.map((explain, explainIndex) => (
                        <React.Fragment key={`explain-${explanationIndex}-${explainIndex}`}>
                            {explainIndex === 0 ? (
                                <>
                                    <span
                                        className='mr-[12px] text-default-500'
                                        style={{ fontSize: `${appFontSize - 2}px` }}
                                    >
                                        {explanation.trait}
                                    </span>
                                    <span
                                        className='select-text break-words font-bold [overflow-wrap:anywhere]'
                                        style={{ fontSize: `${appFontSize}px` }}
                                    >
                                        {explain}
                                    </span>
                                    <br />
                                </>
                            ) : (
                                <span
                                    className='mr-1 select-text break-words text-default-500 [overflow-wrap:anywhere]'
                                    style={{ fontSize: `${appFontSize - 2}px` }}
                                >
                                    {explain}
                                </span>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            ))}
            <br />
            {legacyResult.associations?.map((association, associationIndex) => (
                <div key={`association-${associationIndex}`}>
                    <span
                        className='break-words text-default-500 [overflow-wrap:anywhere]'
                        style={{ fontSize: `${appFontSize}px` }}
                    >
                        {association}
                    </span>
                </div>
            ))}
            {legacyResult.sentence?.map((sentence, sentenceIndex) => (
                <div
                    key={`sentence-${sentenceIndex}`}
                    className='min-w-0 max-w-full overflow-x-hidden'
                >
                    <span
                        className='mr-[12px]'
                        style={{ fontSize: `${appFontSize - 2}px` }}
                    >
                        {sentenceIndex + 1}.
                    </span>
                    {sentence.source && (
                        <span
                            className='select-text break-words [overflow-wrap:anywhere]'
                            style={{ fontSize: `${appFontSize}px` }}
                            dangerouslySetInnerHTML={{ __html: sentence.source }}
                        />
                    )}
                    {sentence.target && (
                        <div
                            className='select-text break-words text-default-500 [overflow-wrap:anywhere]'
                            style={{ fontSize: `${appFontSize}px` }}
                            dangerouslySetInnerHTML={{ __html: sentence.target }}
                        />
                    )}
                </div>
            ))}
        </div>
    );

    const renderResult = () => {
        if (resultRenderType === 'programmer') {
            const safeServiceId = currentTranslateServiceInstanceKey.replace(/[^A-Za-z0-9_-]/g, '-');
            return (
                <ProgrammerResultErrorBoundary
                    key={`programmer-boundary-${resultRequestId}`}
                    plainText={trustedPlainText}
                    fallbackLabel={t('translate.programmer.render_fallback', {
                        defaultValue: '结构化结果显示失败，已回退为纯文本。',
                    })}
                >
                    <ProgrammerMinimalResult
                        key={resultRequestId}
                        result={normalizedResult}
                        idPrefix={`target-${safeServiceId}-${resultRequestId}`}
                        labels={programmerLabels}
                        onCopy={(text) => copyWithFeedback(text)}
                    />
                </ProgrammerResultErrorBoundary>
            );
        }

        if (resultRenderType === 'text') {
            return (
                <textarea
                    ref={textAreaRef}
                    className='block h-0 w-full min-w-0 max-w-full resize-none whitespace-pre-wrap break-words bg-transparent select-text outline-none [overflow-wrap:anywhere]'
                    style={{ fontSize: `${appFontSize}px` }}
                    readOnly
                    value={trustedPlainText ?? ''}
                />
            );
        }

        if (resultRenderType === 'legacy-object') {
            return renderLegacyResult();
        }

        return null;
    };

    const [boundRef, bounds] = useMeasure({ scroll: true });
    const springs = useSpring({
        from: { height: 0 },
        to: { height: hide ? 0 : bounds.height },
    });

    return (
        <Card
            shadow='none'
            className='min-w-0 max-w-full overflow-hidden rounded-[10px]'
        >
            <Toaster />
            <CardHeader
                className={`flex h-[30px] justify-between bg-content2 px-0 py-1 ${
                    hide ? 'rounded-[10px]' : 'rounded-t-[10px]'
                }`}
                {...drag}
            >
                <div className='flex min-w-0'>
                    <Dropdown>
                        <DropdownTrigger>
                            <Button
                                size='sm'
                                variant='solid'
                                className='min-w-0 max-w-full bg-transparent'
                                startContent={
                                    whetherPluginService(currentTranslateServiceInstanceKey) ? (
                                        <img
                                            src={
                                                pluginList.translate[
                                                    getServiceName(currentTranslateServiceInstanceKey)
                                                ].icon
                                            }
                                            className='my-auto h-[20px] shrink-0'
                                            alt=''
                                        />
                                    ) : (
                                        <img
                                            src={
                                                builtinTranslateServices[
                                                    getServiceName(currentTranslateServiceInstanceKey)
                                                ].info.icon
                                            }
                                            className='my-auto h-[20px] shrink-0'
                                            alt=''
                                        />
                                    )
                                }
                            >
                                <span className='truncate'>
                                    {whetherPluginService(currentTranslateServiceInstanceKey)
                                        ? getInstanceName(currentTranslateServiceInstanceKey, () =>
                                              pluginList.translate[
                                                  getServiceName(currentTranslateServiceInstanceKey)
                                              ].display
                                          )
                                        : getInstanceName(currentTranslateServiceInstanceKey, () =>
                                              t(
                                                  `services.translate.${getServiceName(
                                                      currentTranslateServiceInstanceKey
                                                  )}.title`
                                              )
                                          )}
                                </span>
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                            aria-label='app language'
                            className='max-h-[40vh] overflow-y-auto'
                            onAction={(key) => setCurrentTranslateServiceInstanceKey(String(key))}
                        >
                            {translateServiceInstanceList.map((instanceKey) => (
                                <DropdownItem
                                    key={instanceKey}
                                    startContent={
                                        whetherPluginService(instanceKey) ? (
                                            <img
                                                src={pluginList.translate[getServiceName(instanceKey)].icon}
                                                className='my-auto h-[20px]'
                                                alt=''
                                            />
                                        ) : (
                                            <img
                                                src={
                                                    builtinTranslateServices[getServiceName(instanceKey)].info
                                                        .icon
                                                }
                                                className='my-auto h-[20px]'
                                                alt=''
                                            />
                                        )
                                    }
                                >
                                    {whetherPluginService(instanceKey)
                                        ? getInstanceName(
                                              instanceKey,
                                              () => pluginList.translate[getServiceName(instanceKey)].display
                                          )
                                        : getInstanceName(instanceKey, () =>
                                              t(`services.translate.${getServiceName(instanceKey)}.title`)
                                          )}
                                </DropdownItem>
                            ))}
                        </DropdownMenu>
                    </Dropdown>
                    <PulseLoader
                        loading={isLoading}
                        color={
                            resolvedTheme === 'dark'
                                ? semanticColors.dark.default[500]
                                : semanticColors.light.default[500]
                        }
                        size={8}
                        cssOverride={{
                            display: 'inline-block',
                            margin: 'auto',
                            marginLeft: '20px',
                        }}
                    />
                </div>
                <Button
                    size='sm'
                    isIconOnly
                    variant='light'
                    className='h-[20px] w-[20px] shrink-0'
                    onPress={() => setHide((current) => !current)}
                >
                    {hide ? (
                        <BiExpandVertical className='text-[16px]' />
                    ) : (
                        <BiCollapseVertical className='text-[16px]' />
                    )}
                </Button>
            </CardHeader>
            <animated.div style={{ ...springs }}>
                <div ref={boundRef}>
                    <CardBody
                        className={`min-w-0 max-w-full overflow-x-hidden p-[12px] pb-0 ${
                            hide ? 'h-0 p-0' : ''
                        }`}
                    >
                        {renderResult()}
                        {error !== '' &&
                            error.split('\n').map((line, lineIndex) => (
                                <p
                                    key={`${lineIndex}-${line}`}
                                    className='break-words text-red-500 [overflow-wrap:anywhere]'
                                    style={{ fontSize: `${appFontSize}px` }}
                                >
                                    {line}
                                </p>
                            ))}
                    </CardBody>
                    <CardFooter
                        className={`flex rounded-none rounded-b-[10px] bg-content1 p-[5px] px-[12px] ${
                            hide ? 'hidden' : ''
                        }`}
                    >
                        <ButtonGroup className='flex flex-wrap'>
                            <Tooltip content={t('translate.speak')}>
                                <Button
                                    isIconOnly
                                    variant='light'
                                    size='sm'
                                    isDisabled={oldStringResult === null}
                                    onPress={() => {
                                        handleSpeak(oldStringResult).catch((speakError) => {
                                            toast.error(speakError.toString(), { style: toastStyle });
                                        });
                                    }}
                                >
                                    <HiOutlineVolumeUp className='text-[16px]' />
                                </Button>
                            </Tooltip>
                            <Tooltip content={t('translate.copy')}>
                                <Button
                                    isIconOnly
                                    variant='light'
                                    size='sm'
                                    isDisabled={trustedPlainText === null}
                                    onPress={() => {
                                        void copyWithFeedback(trustedPlainText);
                                    }}
                                >
                                    <MdContentCopy className='text-[16px]' />
                                </Button>
                            </Tooltip>
                            <Tooltip content={t('translate.translate_back')}>
                                <Button
                                    isIconOnly
                                    variant='light'
                                    size='sm'
                                    isDisabled={trustedPlainText === null}
                                    onPress={() => {
                                        void startReverseTranslation();
                                    }}
                                >
                                    <TbTransformFilled className='text-[16px]' />
                                </Button>
                            </Tooltip>
                            <Tooltip content={t('translate.retry')}>
                                <Button
                                    isIconOnly
                                    variant='light'
                                    size='sm'
                                    className={error === '' ? 'hidden' : ''}
                                    onPress={() => {
                                        void startInitialTranslation();
                                    }}
                                >
                                    <GiCycle className='text-[16px]' />
                                </Button>
                            </Tooltip>
                            {collectionServiceList?.map((collectionServiceInstanceName) => (
                                <Button
                                    key={collectionServiceInstanceName}
                                    isIconOnly
                                    variant='light'
                                    size='sm'
                                    isDisabled={trustedPlainText === null}
                                    onPress={() => {
                                        handleCollection(collectionServiceInstanceName).catch(
                                            (collectionError) => {
                                                toast.error(collectionError.toString(), {
                                                    style: toastStyle,
                                                });
                                            }
                                        );
                                    }}
                                >
                                    <img
                                        src={
                                            getServiceSouceType(collectionServiceInstanceName) ===
                                            ServiceSourceType.PLUGIN
                                                ? pluginList.collection[
                                                      getServiceName(collectionServiceInstanceName)
                                                  ].icon
                                                : builtinCollectionServices[
                                                      getServiceName(collectionServiceInstanceName)
                                                  ].info.icon
                                        }
                                        className='h-[16px] w-[16px]'
                                        alt=''
                                    />
                                </Button>
                            ))}
                        </ButtonGroup>
                    </CardFooter>
                </div>
            </animated.div>
        </Card>
    );
}
