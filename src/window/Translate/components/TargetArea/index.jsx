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

const MAX_STRUCTURED_TTS_LENGTH = 4000;
let translateID = [];

function normalizeResolvedResult(value) {
    return typeof value === 'string' ? value.trim() : value;
}

function hasVisibleResult(value) {
    return typeof value === 'string' ? value !== '' : value !== null && value !== undefined;
}

function resolveCollectionResultText(result) {
    if (typeof result === 'string') return result;
    if (isPluginResultV2(result)) return resolveResultCopyText(result);
    return result?.toString?.() || '';
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
    const [error, setError] = useState('');
    const [ttsPluginInfo, setTtsPluginInfo] = useState();

    const sourceText = useAtomValue(sourceTextAtom);
    const sourceLanguage = useAtomValue(sourceLanguageAtom);
    const targetLanguage = useAtomValue(targetLanguageAtom);
    const detectLanguage = useAtomValue(detectLanguageAtom);

    const { t } = useTranslation();
    const textAreaRef = useRef();
    const toastStyle = useToastStyle();
    const speak = useVoice();
    const { resolvedTheme } = useTheme();

    const resultCopyText = useMemo(() => resolveResultCopyText(result), [result]);
    const isStructuredResult = isPluginResultV2(result);
    const canUseResultText = resultCopyText !== '' && (typeof result === 'string' || isStructuredResult);
    const canSpeakResult =
        typeof result === 'string'
            ? result !== ''
            : isStructuredResult && resultCopyText !== '' && resultCopyText.length <= MAX_STRUCTURED_TTS_LENGTH;
    const collectionResultText = useMemo(() => resolveCollectionResultText(result), [result]);

    function getInstanceName(instanceKey, serviceNameSupplier) {
        const instanceConfig = serviceInstanceConfigMap[instanceKey] ?? {};
        return getDisplayInstanceName(instanceConfig[INSTANCE_NAME_CONFIG_KEY], serviceNameSupplier);
    }

    useEffect(() => {
        if (error) {
            logError(`[${currentTranslateServiceInstanceKey}]happened error: ` + error);
        }
    }, [error]);

    useEffect(() => {
        setResult('');
        setError('');
        if (
            sourceText.trim() !== '' &&
            sourceLanguage &&
            targetLanguage &&
            autoCopy !== null &&
            hideWindow !== null &&
            clipboardMonitor !== null
        ) {
            if (autoCopy === 'source' && !clipboardMonitor) {
                writeText(sourceText).then(() => {
                    if (hideWindow) {
                        sendNotification({ title: t('common.write_clipboard'), body: sourceText });
                    }
                });
            }
            translate();
        }
    }, [
        sourceText,
        sourceLanguage,
        targetLanguage,
        autoCopy,
        hideWindow,
        currentTranslateServiceInstanceKey,
        clipboardMonitor,
    ]);

    const addToHistory = async (text, source, target, serviceInstanceKey, historyResultText) => {
        const db = await Database.load('sqlite:history.db');

        await db
            .execute(
                'INSERT into history (text, source, target, service, result, timestamp) VALUES ($1, $2, $3, $4, $5, $6)',
                [text, source, target, serviceInstanceKey, historyResultText, Date.now()]
            )
            .then(
                () => {
                    db.close();
                },
                () => {
                    db.execute(
                        'CREATE TABLE history(id INTEGER PRIMARY KEY AUTOINCREMENT, text TEXT NOT NULL,source TEXT NOT NULL,target TEXT NOT NULL,service TEXT NOT NULL, result TEXT NOT NULL,timestamp INTEGER NOT NULL)'
                    ).then(() => {
                        db.close();
                        addToHistory(text, source, target, serviceInstanceKey, historyResultText);
                    });
                }
            );
    };

    function invokeOnce(fn) {
        let isInvoke = false;
        return (...args) => {
            if (isInvoke) return;
            fn(...args);
            isInvoke = true;
        };
    }

    const copyResolvedResult = (copyText) => {
        if (!copyText || index !== 0 || clipboardMonitor) return;

        switch (autoCopy) {
            case 'target':
                writeText(copyText).then(() => {
                    if (hideWindow) {
                        sendNotification({ title: t('common.write_clipboard'), body: copyText });
                    }
                });
                break;
            case 'source_target': {
                const combinedText = sourceText.trim() + '\n\n' + copyText;
                writeText(combinedText).then(() => {
                    if (hideWindow) {
                        sendNotification({ title: t('common.write_clipboard'), body: combinedText });
                    }
                });
                break;
            }
            default:
                break;
        }
    };

    const finishTranslation = ({ value, id, newTargetLanguage, translateServiceName, setHideOnce }) => {
        info(`[${currentTranslateServiceInstanceKey}]resolve:` + value);
        if (translateID[index] !== id) return;

        const resolvedResult = normalizeResolvedResult(value);
        const copyText = resolveResultCopyText(resolvedResult);
        setResult(resolvedResult);
        setIsLoading(false);
        if (hasVisibleResult(resolvedResult)) {
            setHideOnce(false);
        }

        if (!historyDisable && copyText !== '') {
            addToHistory(sourceText.trim(), detectLanguage, newTargetLanguage, translateServiceName, copyText);
        }
        copyResolvedResult(copyText);
    };

    const rejectTranslation = (reason, id) => {
        info(`[${currentTranslateServiceInstanceKey}]reject:` + reason);
        if (translateID[index] !== id) return;
        setError(reason.toString());
        setIsLoading(false);
    };

    const translate = async () => {
        const id = nanoid();
        translateID[index] = id;
        const translateServiceName = getServiceName(currentTranslateServiceInstanceKey);

        if (whetherPluginService(currentTranslateServiceInstanceKey)) {
            const pluginInfo = pluginList.translate[translateServiceName];
            if (!(sourceLanguage in pluginInfo.language) || !(targetLanguage in pluginInfo.language)) {
                setError('Language not supported');
                return;
            }

            let newTargetLanguage = targetLanguage;
            if (sourceLanguage === 'auto' && targetLanguage === detectLanguage) {
                newTargetLanguage = translateSecondLanguage;
            }

            setIsLoading(true);
            setHide(true);
            const instanceConfig = serviceInstanceConfigMap[currentTranslateServiceInstanceKey];
            instanceConfig.enable = 'true';
            const setHideOnce = invokeOnce(setHide);
            const [func, utils] = await invoke_plugin('translate', translateServiceName);
            func(sourceText.trim(), pluginInfo.language[sourceLanguage], pluginInfo.language[newTargetLanguage], {
                config: instanceConfig,
                detect: detectLanguage,
                setResult: (value) => {
                    if (translateID[index] !== id) return;
                    setResult(value);
                    setHideOnce(false);
                },
                utils,
            }).then(
                (value) => finishTranslation({ value, id, newTargetLanguage, translateServiceName, setHideOnce }),
                (reason) => rejectTranslation(reason, id)
            );
            return;
        }

        const LanguageEnum = builtinServices[translateServiceName].Language;
        if (!(sourceLanguage in LanguageEnum) || !(targetLanguage in LanguageEnum)) {
            setError('Language not supported');
            return;
        }

        let newTargetLanguage = targetLanguage;
        if (sourceLanguage === 'auto' && targetLanguage === detectLanguage) {
            newTargetLanguage = translateSecondLanguage;
        }

        setIsLoading(true);
        setHide(true);
        const instanceConfig = serviceInstanceConfigMap[currentTranslateServiceInstanceKey];
        const setHideOnce = invokeOnce(setHide);
        builtinServices[translateServiceName]
            .translate(sourceText.trim(), LanguageEnum[sourceLanguage], LanguageEnum[newTargetLanguage], {
                config: instanceConfig,
                detect: detectLanguage,
                setResult: (value) => {
                    if (translateID[index] !== id) return;
                    setResult(value);
                    setHideOnce(false);
                },
            })
            .then(
                (value) => finishTranslation({ value, id, newTargetLanguage, translateServiceName, setHideOnce }),
                (reason) => rejectTranslation(reason, id)
            );
    };

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

    const handleTranslateBack = async () => {
        setError('');
        const reverseSourceText = resultCopyText.trim();
        let newTargetLanguage = sourceLanguage;
        if (sourceLanguage === 'auto') {
            newTargetLanguage = detectLanguage;
        }
        let newSourceLanguage = targetLanguage;
        if (sourceLanguage === 'auto') {
            newSourceLanguage = 'auto';
        }

        const setHideOnce = invokeOnce(setHide);
        const handleReverseResolved = (value) => {
            const normalized = normalizeResolvedResult(value);
            if (typeof normalized === 'string' && normalized === reverseSourceText) {
                setResult(normalized + ' ');
            } else {
                setResult(normalized);
            }
            setIsLoading(false);
            if (hasVisibleResult(normalized)) {
                setHideOnce(false);
            }
        };
        const handleReverseRejected = (reason) => {
            setError(reason.toString());
            setIsLoading(false);
        };

        if (whetherPluginService(currentTranslateServiceInstanceKey)) {
            const pluginInfo = pluginList.translate[getServiceName(currentTranslateServiceInstanceKey)];
            if (!(newSourceLanguage in pluginInfo.language) || !(newTargetLanguage in pluginInfo.language)) {
                setError('Language not supported');
                return;
            }

            setIsLoading(true);
            setHide(true);
            const instanceConfig = serviceInstanceConfigMap[currentTranslateServiceInstanceKey];
            instanceConfig.enable = 'true';
            const [func, utils] = await invoke_plugin('translate', getServiceName(currentTranslateServiceInstanceKey));
            func(reverseSourceText, pluginInfo.language[newSourceLanguage], pluginInfo.language[newTargetLanguage], {
                config: instanceConfig,
                detect: detectLanguage,
                setResult: (value) => {
                    setResult(value);
                    setHideOnce(false);
                },
                utils,
            }).then(handleReverseResolved, handleReverseRejected);
            return;
        }

        const LanguageEnum = builtinServices[getServiceName(currentTranslateServiceInstanceKey)].Language;
        if (!(newSourceLanguage in LanguageEnum) || !(newTargetLanguage in LanguageEnum)) {
            setError('Language not supported');
            return;
        }

        setIsLoading(true);
        setHide(true);
        const instanceConfig = serviceInstanceConfigMap[currentTranslateServiceInstanceKey];
        builtinServices[getServiceName(currentTranslateServiceInstanceKey)]
            .translate(reverseSourceText, LanguageEnum[newSourceLanguage], LanguageEnum[newTargetLanguage], {
                config: instanceConfig,
                detect: newSourceLanguage,
                setResult: (value) => {
                    setResult(value);
                    setHideOnce(false);
                },
            })
            .then(handleReverseResolved, handleReverseRejected);
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
                                            toast.error(reason.toString(), { style: toastStyle });
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
                                    onPress={handleTranslateBack}
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
                                        setError('');
                                        setResult('');
                                        translate();
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
                                                        toast.error(reason.toString(), { style: toastStyle });
                                                    }
                                                );
                                            } else {
                                                const instanceConfig =
                                                    serviceInstanceConfigMap[collectionServiceInstanceName];
                                                builtinCollectionServices[
                                                    getServiceName(collectionServiceInstanceName)
                                                ]
                                                    .collection(sourceText, collectionResultText, {
                                                        config: instanceConfig,
                                                    })
                                                    .then(
                                                        () => {
                                                            toast.success(t('translate.add_collection_success'), {
                                                                style: toastStyle,
                                                            });
                                                        },
                                                        (reason) => {
                                                            toast.error(reason.toString(), { style: toastStyle });
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
