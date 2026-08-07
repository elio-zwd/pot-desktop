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
import { BaseDirectory, readTextFile } from '@tauri-apps/api/fs';
import { sendNotification } from '@tauri-apps/api/notification';
import { writeText } from '@tauri-apps/api/clipboard';
import { useSpring, animated } from '@react-spring/web';
import { semanticColors } from '@nextui-org/theme';
import { BiCollapseVertical, BiExpandVertical } from 'react-icons/bi';
import { GiCycle } from 'react-icons/gi';
import { HiOutlineVolumeUp } from 'react-icons/hi';
import { MdContentCopy } from 'react-icons/md';
import { TbTransformFilled } from 'react-icons/tb';
import { useAtomValue } from 'jotai';
import { nanoid } from 'nanoid';
import { useTheme } from 'next-themes';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import PulseLoader from 'react-spinners/PulseLoader';
import useMeasure from 'react-use-measure';
import Database from 'tauri-plugin-sql-api';
import { info, error as logError } from 'tauri-plugin-log-api';

import * as builtinCollectionServices from '../../../../services/collection';
import * as builtinServices from '../../../../services/translate';
import * as builtinTtsServices from '../../../../services/tts';
import { useConfig, useToastStyle, useVoice } from '../../../../hooks';
import { invoke_plugin } from '../../../../utils/invoke_plugin';
import { isPluginResultV2, resolveResultCopyText } from '../../../../utils/plugin_result_schema';
import {
    INSTANCE_NAME_CONFIG_KEY,
    ServiceSourceType,
    getDisplayInstanceName,
    getServiceName,
    getServiceSouceType,
    whetherPluginService,
} from '../../../../utils/service_instance';
import { sourceLanguageAtom, targetLanguageAtom } from '../LanguageArea';
import { sourceTextAtom, detectLanguageAtom } from '../SourceArea';
import TranslationResult from '../TranslationResult';
import {
    createAutoCopyText,
    createTranslatePluginOptions,
    decideRequestRejection,
    decideResultCommit,
    isRequestCurrent,
    resolveTrustedCopyText,
} from './result_flow';

const MAX_STRUCTURED_TTS_LENGTH = 4000;

function resolveCollectionResultText(result) {
    try {
        if (typeof result === 'string') return result;
        if (isPluginResultV2(result)) return resolveResultCopyText(result);
        return result?.toString?.() || '';
    } catch (_) {
        return '';
    }
}

function resolveBuiltinCollectionResult(result) {
    return isPluginResultV2(result) ? resolveResultCopyText(result) : result;
}

function formatRequestError(reason) {
    if (typeof reason === 'string' && reason !== '') {
        return reason;
    }
    if (reason instanceof Error && typeof reason.message === 'string' && reason.message !== '') {
        return reason.message;
    }
    return 'Translation request failed';
}

export default function TargetArea(props) {
    const { index, name, translateServiceInstanceList, pluginList, serviceInstanceConfigMap, ...drag } = props;

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
    const [result, setResult] = useState('');
    const [resultRequestId, setResultRequestId] = useState('');
    const [error, setError] = useState('');
    const [ttsPluginInfo, setTtsPluginInfo] = useState();

    const sourceText = useAtomValue(sourceTextAtom);
    const sourceLanguage = useAtomValue(sourceLanguageAtom);
    const targetLanguage = useAtomValue(targetLanguageAtom);
    const detectLanguage = useAtomValue(detectLanguageAtom);

    const activeRequestIdRef = useRef(null);
    const latestStreamResultRef = useRef(null);
    const textAreaRef = useRef();
    const { t } = useTranslation();
    const toastStyle = useToastStyle();
    const speak = useVoice();
    const { resolvedTheme } = useTheme();

    const resultCopyText = useMemo(() => resolveTrustedCopyText(result) ?? '', [result]);
    const isStructuredResult = isPluginResultV2(result);
    const canUseResultText = resultCopyText !== '';
    const canSpeakResult =
        typeof result === 'string'
            ? resultCopyText !== ''
            : isStructuredResult &&
              resultCopyText !== '' &&
              resultCopyText.length <= MAX_STRUCTURED_TTS_LENGTH;
    const collectionResultText = useMemo(() => resolveCollectionResultText(result), [result]);
    const builtinCollectionResult = useMemo(() => resolveBuiltinCollectionResult(result), [result]);

    function getInstanceName(instanceKey, serviceNameSupplier) {
        const instanceConfig = serviceInstanceConfigMap[instanceKey] ?? {};
        return getDisplayInstanceName(instanceConfig[INSTANCE_NAME_CONFIG_KEY], serviceNameSupplier);
    }

    useEffect(() => {
        if (error) {
            logError(`[${currentTranslateServiceInstanceKey}] translation request failed`);
        }
    }, [error, currentTranslateServiceInstanceKey]);

    const invalidateCurrentRequest = () => {
        activeRequestIdRef.current = null;
        latestStreamResultRef.current = null;
    };

    const beginRequest = () => {
        const requestId = nanoid();
        activeRequestIdRef.current = requestId;
        latestStreamResultRef.current = null;
        setResultRequestId(requestId);
        setResult('');
        setError('');
        setIsLoading(true);
        setHide(true);
        return requestId;
    };

    const addToHistory = async ({
        requestId,
        text,
        source,
        target,
        serviceInstanceKey,
        result: historyResult,
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
                    [text, source, target, serviceInstanceKey, historyResult, Date.now()]
                );
            } catch {
                if (!isRequestCurrent(activeRequestIdRef.current, requestId)) {
                    return;
                }
                await db.execute(
                    'CREATE TABLE history(id INTEGER PRIMARY KEY AUTOINCREMENT, text TEXT NOT NULL,source TEXT NOT NULL,target TEXT NOT NULL,service TEXT NOT NULL, result TEXT NOT NULL,timestamp INTEGER NOT NULL)'
                );
                if (!isRequestCurrent(activeRequestIdRef.current, requestId)) {
                    return;
                }
                await db.execute(
                    'INSERT into history (text, source, target, service, result, timestamp) VALUES ($1, $2, $3, $4, $5, $6)',
                    [text, source, target, serviceInstanceKey, historyResult, Date.now()]
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
        trustedCopyText,
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
                result: trustedCopyText,
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
            trustedCopyText,
        });
        if (
            clipboardText === null ||
            !isRequestCurrent(activeRequestIdRef.current, requestId)
        ) {
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
        const decision = decideResultCommit({
            activeRequestId: activeRequestIdRef.current,
            requestId,
            value,
            latestStreamResult: latestStreamResultRef.current,
            final: false,
        });

        if (decision.type !== 'display') {
            return;
        }

        latestStreamResultRef.current = decision.result;
        setResult(decision.result);
        revealResult();
    };

    const commitFinalResult = ({ requestId, value, context, revealResult }) => {
        const decision = decideResultCommit({
            activeRequestId: activeRequestIdRef.current,
            requestId,
            value,
            latestStreamResult: latestStreamResultRef.current,
            final: true,
        });

        if (decision.type === 'ignore') {
            return;
        }

        setIsLoading(false);

        if (decision.type === 'display') {
            latestStreamResultRef.current = decision.result;
            setResult(decision.result);
            revealResult();
        } else if (decision.type === 'preserve-stream') {
            setResult(decision.result);
            revealResult();
        } else {
            setResult('');
            setError(t('translate.no_result', { defaultValue: 'No displayable result' }));
            setHide(false);
        }

        if (decision.trustedCopyText !== null) {
            runFinalSideEffects({
                requestId,
                ...context,
                trustedCopyText: decision.trustedCopyText,
            });
        }
    };

    const rejectRequest = (requestId, requestError) => {
        if (
            decideRequestRejection({
                activeRequestId: activeRequestIdRef.current,
                requestId,
            }) === 'ignore'
        ) {
            return;
        }

        info('Translation request rejected');
        setError(formatRequestError(requestError));
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
            if (!revealed && isRequestCurrent(activeRequestIdRef.current, requestId)) {
                revealed = true;
                setHide(false);
            }
        };

        if (whetherPluginService(currentTranslateServiceInstanceKey)) {
            const pluginInfo = pluginList.translate[translateServiceName];
            if (!(fromLanguage in pluginInfo.language) || !(toLanguage in pluginInfo.language)) {
                if (isRequestCurrent(activeRequestIdRef.current, requestId)) {
                    setError('Language not supported');
                    setIsLoading(false);
                    setHide(false);
                }
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

        const service = builtinServices[translateServiceName];
        const LanguageEnum = service.Language;
        if (!(fromLanguage in LanguageEnum) || !(toLanguage in LanguageEnum)) {
            if (isRequestCurrent(activeRequestIdRef.current, requestId)) {
                setError('Language not supported');
                setIsLoading(false);
                setHide(false);
            }
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
        if (!canUseResultText) {
            return undefined;
        }

        const reverseTargetLanguage = sourceLanguage === 'auto' ? detectLanguage : sourceLanguage;
        const reverseSourceLanguage = sourceLanguage === 'auto' ? 'auto' : targetLanguage;

        return startTranslation({
            inputText: resultCopyText,
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
        setResult('');
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

        void startInitialTranslation();
        const requestId = activeRequestIdRef.current;

        if (
            autoCopy === 'source' &&
            !clipboardMonitor &&
            isRequestCurrent(activeRequestIdRef.current, requestId)
        ) {
            const clipboardText = sourceText;
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
                    logError('Failed to auto-copy source text');
                });
        }

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
        if (textAreaRef.current !== null && textAreaRef.current !== undefined) {
            textAreaRef.current.style.height = '0px';
            if (typeof result === 'string' && result !== '') {
                textAreaRef.current.style.height = textAreaRef.current.scrollHeight + 'px';
            }
        }
    }, [result]);

    useEffect(() => {
        if (ttsServiceList && getServiceSouceType(ttsServiceList[0]) === ServiceSourceType.PLUGIN) {
            readTextFile(`plugins/tts/${getServiceName(ttsServiceList[0])}/info.json`, {
                dir: BaseDirectory.AppConfig,
            }).then((infoStr) => {
                setTtsPluginInfo(JSON.parse(infoStr));
            });
        }
    }, [ttsServiceList]);

    const handleSpeak = async () => {
        const instanceKey = ttsServiceList[0];
        if (getServiceSouceType(instanceKey) === ServiceSourceType.PLUGIN) {
            const pluginConfig = serviceInstanceConfigMap[instanceKey];
            if (!(targetLanguage in ttsPluginInfo.language)) {
                throw new Error('Language not supported');
            }
            const [func, utils] = await invoke_plugin('tts', getServiceName(instanceKey));
            const data = await func(resultCopyText, ttsPluginInfo.language[targetLanguage], {
                config: pluginConfig,
                utils,
            });
            speak(data);
            return;
        }

        if (!(targetLanguage in builtinTtsServices[getServiceName(instanceKey)].Language)) {
            throw new Error('Language not supported');
        }
        const instanceConfig = serviceInstanceConfigMap[instanceKey];
        const data = await builtinTtsServices[getServiceName(instanceKey)].tts(
            resultCopyText,
            builtinTtsServices[getServiceName(instanceKey)].Language[targetLanguage],
            { config: instanceConfig }
        );
        speak(data);
    };

    const [boundRef, bounds] = useMeasure({ scroll: true });
    const springs = useSpring({
        from: { height: 0 },
        to: { height: hide ? 0 : bounds.height },
    });

    return (
        <Card shadow='none' className='rounded-[10px]'>
            <Toaster />
            <CardHeader
                className={`flex justify-between py-1 px-0 bg-content2 h-[30px] ${hide ? 'rounded-[10px]' : 'rounded-t-[10px]'}`}
                {...drag}
            >
                <div className='flex'>
                    <Dropdown>
                        <DropdownTrigger>
                            <Button
                                size='sm'
                                variant='solid'
                                className='bg-transparent'
                                startContent={
                                    whetherPluginService(currentTranslateServiceInstanceKey) ? (
                                        <img
                                            src={
                                                pluginList.translate[getServiceName(currentTranslateServiceInstanceKey)]
                                                    .icon
                                            }
                                            className='h-[20px] my-auto'
                                        />
                                    ) : (
                                        <img
                                            src={
                                                builtinServices[getServiceName(currentTranslateServiceInstanceKey)].info
                                                    .icon
                                            }
                                            className='h-[20px] my-auto'
                                        />
                                    )
                                }
                            >
                                {whetherPluginService(currentTranslateServiceInstanceKey) ? (
                                    <div className='my-auto'>{`${getInstanceName(
                                        currentTranslateServiceInstanceKey,
                                        () =>
                                            pluginList.translate[getServiceName(currentTranslateServiceInstanceKey)]
                                                .display
                                    )} `}</div>
                                ) : (
                                    <div className='my-auto'>
                                        {getInstanceName(currentTranslateServiceInstanceKey, () =>
                                            t(
                                                `services.translate.${getServiceName(
                                                    currentTranslateServiceInstanceKey
                                                )}.title`
                                            )
                                        )}
                                    </div>
                                )}
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                            aria-label='app language'
                            className='max-h-[40vh] overflow-y-auto'
                            onAction={(key) => setCurrentTranslateServiceInstanceKey(key)}
                        >
                            {translateServiceInstanceList.map((instanceKey) => (
                                <DropdownItem
                                    key={instanceKey}
                                    startContent={
                                        whetherPluginService(instanceKey) ? (
                                            <img
                                                src={pluginList.translate[getServiceName(instanceKey)].icon}
                                                className='h-[20px] my-auto'
                                            />
                                        ) : (
                                            <img
                                                src={builtinServices[getServiceName(instanceKey)].info.icon}
                                                className='h-[20px] my-auto'
                                            />
                                        )
                                    }
                                >
                                    {whetherPluginService(instanceKey) ? (
                                        <div className='my-auto'>{`${getInstanceName(
                                            instanceKey,
                                            () => pluginList.translate[getServiceName(instanceKey)].display
                                        )} `}</div>
                                    ) : (
                                        <div className='my-auto'>
                                            {getInstanceName(instanceKey, () =>
                                                t(`services.translate.${getServiceName(instanceKey)}.title`)
                                            )}
                                        </div>
                                    )}
                                </DropdownItem>
                            ))}
                        </DropdownMenu>
                    </Dropdown>
                    <PulseLoader
                        loading={isLoading}
                        color={resolvedTheme === 'dark' ? semanticColors.dark.default[500] : semanticColors.light.default[500]}
                        size={8}
                        cssOverride={{ display: 'inline-block', margin: 'auto', marginLeft: '20px' }}
                    />
                </div>
                <div className='flex'>
                    <Button
                        size='sm'
                        isIconOnly
                        variant='light'
                        className='h-[20px] w-[20px]'
                        onPress={() => setHide(!hide)}
                    >
                        {hide ? (
                            <BiExpandVertical className='text-[16px]' />
                        ) : (
                            <BiCollapseVertical className='text-[16px]' />
                        )}
                    </Button>
                </div>
            </CardHeader>
            <animated.div style={{ ...springs }}>
                <div ref={boundRef}>
                    <CardBody className={`p-[12px] pb-0 ${hide && 'h-0 p-0'}`}>
                        <TranslationResult
                            key={resultRequestId}
                            result={result}
                            appFontSize={appFontSize}
                            textAreaRef={textAreaRef}
                            speak={speak}
                            onCopyText={(text) => writeText(text)}
                            copyLabel={t('translate.copy')}
                        />
                        {error !== '' &&
                            error.split('\n').map((value, errorIndex) => (
                                <p
                                    key={`${value}-${errorIndex}`}
                                    className='text-red-500'
                                    style={{ fontSize: `${appFontSize}px` }}
                                >
                                    {value}
                                </p>
                            ))}
                    </CardBody>
                    <CardFooter
                        className={`bg-content1 rounded-none rounded-b-[10px] flex px-[12px] p-[5px] ${hide && 'hidden'}`}
                    >
                        <ButtonGroup>
                            <Tooltip content={t('translate.speak')}>
                                <Button
                                    isIconOnly
                                    variant='light'
                                    size='sm'
                                    isDisabled={!canSpeakResult}
                                    onPress={() => {
                                        handleSpeak().catch((reason) => {
                                            toast.error(formatRequestError(reason), { style: toastStyle });
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
                                    isDisabled={!canUseResultText}
                                    onPress={() => writeText(resultCopyText)}
                                >
                                    <MdContentCopy className='text-[16px]' />
                                </Button>
                            </Tooltip>
                            <Tooltip content={t('translate.translate_back')}>
                                <Button
                                    isIconOnly
                                    variant='light'
                                    size='sm'
                                    isDisabled={!canUseResultText}
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
                                    className={`${error === '' && 'hidden'}`}
                                    onPress={() => {
                                        void startInitialTranslation();
                                    }}
                                >
                                    <GiCycle className='text-[16px]' />
                                </Button>
                            </Tooltip>
                            {collectionServiceList &&
                                collectionServiceList.map((collectionServiceInstanceName) => (
                                    <Button
                                        key={collectionServiceInstanceName}
                                        isIconOnly
                                        variant='light'
                                        size='sm'
                                        onPress={async () => {
                                            if (
                                                getServiceSouceType(collectionServiceInstanceName) ===
                                                ServiceSourceType.PLUGIN
                                            ) {
                                                const pluginConfig =
                                                    serviceInstanceConfigMap[collectionServiceInstanceName];
                                                const [func, utils] = await invoke_plugin(
                                                    'collection',
                                                    getServiceName(collectionServiceInstanceName)
                                                );
                                                func(sourceText.trim(), collectionResultText, {
                                                    config: pluginConfig,
                                                    utils,
                                                }).then(
                                                    () => {
                                                        toast.success(t('translate.add_collection_success'), {
                                                            style: toastStyle,
                                                        });
                                                    },
                                                    (reason) => {
                                                        toast.error(formatRequestError(reason), { style: toastStyle });
                                                    }
                                                );
                                            } else {
                                                const instanceConfig =
                                                    serviceInstanceConfigMap[collectionServiceInstanceName];
                                                builtinCollectionServices[
                                                    getServiceName(collectionServiceInstanceName)
                                                ]
                                                    .collection(sourceText, builtinCollectionResult, {
                                                        config: instanceConfig,
                                                    })
                                                    .then(
                                                        () => {
                                                            toast.success(t('translate.add_collection_success'), {
                                                                style: toastStyle,
                                                            });
                                                        },
                                                        (reason) => {
                                                            toast.error(formatRequestError(reason), {
                                                                style: toastStyle,
                                                            });
                                                        }
                                                    );
                                            }
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
