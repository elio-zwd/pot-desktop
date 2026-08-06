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
import React, { useEffect, useRef, useState } from 'react';
import { BiCollapseVertical, BiExpandVertical } from 'react-icons/bi';
import { GiCycle } from 'react-icons/gi';
import { HiOutlineVolumeUp } from 'react-icons/hi';
import { MdContentCopy } from 'react-icons/md';
import { TbTransformFilled } from 'react-icons/tb';
import toast, { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import PulseLoader from 'react-spinners/PulseLoader';
import useMeasure from 'react-use-measure';
import { info, error as logError } from 'tauri-plugin-log-api';
import Database from 'tauri-plugin-sql-api';

import * as builtinCollectionServices from '../../../../services/collection';
import * as builtinServices from '../../../../services/translate';
import * as builtinTtsServices from '../../../../services/tts';
import { useConfig, useToastStyle, useVoice } from '../../../../hooks';
import { invoke_plugin } from '../../../../utils/invoke_plugin';
import {
    INSTANCE_NAME_CONFIG_KEY,
    ServiceSourceType,
    getDisplayInstanceName,
    getServiceName,
    getServiceSouceType,
    whetherPluginService,
} from '../../../../utils/service_instance';
import ProgrammerMinimalResult from '../ProgrammerMinimalResult';
import { sourceLanguageAtom, targetLanguageAtom } from '../LanguageArea';
import { sourceTextAtom, detectLanguageAtom } from '../SourceArea';
import {
    createFinalResultEffects,
    createPluginTranslateOptions,
    describeResultForLog,
    getCollectionResultValue,
    getLegacyResultObject,
    getProgrammerResultKey,
    getResultRenderKind,
    getTrustedResultText,
    isDisplayableResult,
    normalizeResultForDisplay,
} from './model';

const translateID = [];

function LegacyDictionaryResult({ result, appFontSize, speak }) {
    return (
        <div>
            {result.pronunciations?.map((pronunciation, pronunciationIndex) => (
                <div key={`pronunciation-${pronunciationIndex}`}>
                    {pronunciation.region && (
                        <span className={`text-[${appFontSize}px] mr-[12px] text-default-500`}>
                            {pronunciation.region}
                        </span>
                    )}
                    {pronunciation.symbol && (
                        <span className={`text-[${appFontSize}px] mr-[12px] text-default-500`}>
                            {pronunciation.symbol}
                        </span>
                    )}
                    {pronunciation.voice && (
                        <HiOutlineVolumeUp
                            className={`text-[${appFontSize}px] inline-block my-auto cursor-pointer`}
                            onClick={() => speak(pronunciation.voice)}
                        />
                    )}
                </div>
            ))}
            {result.explanations?.map((explanation, explanationIndex) => (
                <div key={`explanation-${explanationIndex}`}>
                    {explanation.explains?.map((explain, explainIndex) => (
                        <span key={`explain-${explanationIndex}-${explainIndex}`}>
                            {explainIndex === 0 ? (
                                <>
                                    <span
                                        className={`text-[${appFontSize - 2}px] text-default-500 mr-[12px]`}
                                    >
                                        {explanation.trait}
                                    </span>
                                    <span className={`font-bold text-[${appFontSize}px] select-text`}>
                                        {explain}
                                    </span>
                                    <br />
                                </>
                            ) : (
                                <span
                                    className={`text-[${appFontSize - 2}px] text-default-500 select-text mr-1`}
                                >
                                    {explain}
                                </span>
                            )}
                        </span>
                    ))}
                </div>
            ))}
            <br />
            {result.associations?.map((association, associationIndex) => (
                <div key={`association-${associationIndex}`}>
                    <span className={`text-[${appFontSize}px] text-default-500`}>{association}</span>
                </div>
            ))}
            {result.sentence?.map((sentence, sentenceIndex) => (
                <div key={`sentence-${sentenceIndex}`}>
                    <span className={`text-[${appFontSize - 2}px] mr-[12px]`}>
                        {sentenceIndex + 1}.
                    </span>
                    {sentence.source && (
                        <span
                            className={`text-[${appFontSize}px] select-text`}
                            dangerouslySetInnerHTML={{ __html: sentence.source }}
                        />
                    )}
                    {sentence.target && (
                        <div
                            className={`text-[${appFontSize}px] select-text text-default-500`}
                            dangerouslySetInnerHTML={{ __html: sentence.target }}
                        />
                    )}
                </div>
            ))}
        </div>
    );
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
    const [result, setResult] = useState(null);
    const [resultQueryId, setResultQueryId] = useState('idle');
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
    const { theme } = useTheme();

    const resultRenderKind = getResultRenderKind(result);
    const trustedResultText = getTrustedResultText(result);
    const legacyResult = getLegacyResultObject(result);
    const hasTextActions = typeof trustedResultText === 'string';

    const programmerLabels = {
        expandDetails: t('translate.programmer.expand_details', { defaultValue: '展开详情' }),
        collapseDetails: t('translate.programmer.collapse_details', { defaultValue: '收起详情' }),
        copyFull: t('translate.programmer.copy_full', { defaultValue: '复制全文' }),
        copyItem: t('translate.programmer.copy_item', { defaultValue: '复制命名' }),
        copied: t('translate.programmer.copied', { defaultValue: '已复制' }),
        identifier: t('translate.programmer.identifier', { defaultValue: '标识符' }),
        tokenMeanings: t('translate.programmer.token_meanings', { defaultValue: '词义' }),
        naming: t('translate.programmer.naming', { defaultValue: '命名' }),
        diagnostics: t('translate.programmer.diagnostics', { defaultValue: '诊断' }),
        source: {
            local: t('translate.programmer.source.local', { defaultValue: '本地' }),
            local_ai: t('translate.programmer.source.local_ai', { defaultValue: '本地 + AI' }),
            ai: t('translate.programmer.source.ai', { defaultValue: 'AI' }),
            local_fallback: t('translate.programmer.source.local_fallback', {
                defaultValue: 'AI 请求失败，已使用完整本地结果',
            }),
            literal: t('translate.programmer.source.literal', { defaultValue: '原文保留' }),
        },
        namingKeys: {
            camelCase: 'camelCase',
            pascalCase: 'PascalCase',
            snakeCase: 'snake_case',
            screamingSnakeCase: 'SCREAMING_SNAKE_CASE',
            kebabCase: 'kebab-case',
        },
    };

    function getInstanceName(instanceKey, serviceNameSupplier) {
        const instanceConfig = serviceInstanceConfigMap[instanceKey] ?? {};
        return getDisplayInstanceName(instanceConfig[INSTANCE_NAME_CONFIG_KEY], serviceNameSupplier);
    }

    useEffect(() => {
        if (error) {
            logError(`[${currentTranslateServiceInstanceKey}]happened error: ${error}`);
        }
    }, [currentTranslateServiceInstanceKey, error]);

    useEffect(() => {
        setResult(null);
        setError('');

        const requestReady =
            sourceText.trim() !== '' &&
            sourceLanguage &&
            targetLanguage &&
            autoCopy !== null &&
            hideWindow !== null &&
            clipboardMonitor !== null;

        if (!requestReady) {
            translateID[index] = nanoid();
            setIsLoading(false);
            return;
        }

        if (autoCopy === 'source' && !clipboardMonitor) {
            writeText(sourceText).then(() => {
                if (hideWindow) {
                    sendNotification({ title: t('common.write_clipboard'), body: sourceText });
                }
            });
        }
        void translate();
    }, [
        sourceText,
        sourceLanguage,
        targetLanguage,
        autoCopy,
        hideWindow,
        currentTranslateServiceInstanceKey,
        clipboardMonitor,
    ]);

    const addToHistory = async (text, source, target, serviceInstanceKey, historyResult) => {
        const db = await Database.load('sqlite:history.db');

        await db
            .execute(
                'INSERT into history (text, source, target, service, result, timestamp) VALUES ($1, $2, $3, $4, $5, $6)',
                [text, source, target, serviceInstanceKey, historyResult, Date.now()]
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
                        addToHistory(text, source, target, serviceInstanceKey, historyResult);
                    });
                }
            );
    };

    function invokeOnce(fn) {
        let invoked = false;

        return (...args) => {
            if (invoked) return;
            invoked = true;
            fn(...args);
        };
    }

    const beginRequest = () => {
        const id = nanoid();
        translateID[index] = id;
        setResultQueryId(id);
        setResult(null);
        setError('');
        setIsLoading(false);
        return id;
    };

    const handleStreamingResult = (id, value, setHideOnce) => {
        if (translateID[index] !== id) return;
        const normalized = normalizeResultForDisplay(value);
        setResult(normalized);
        if (isDisplayableResult(normalized)) {
            setHideOnce(false);
        }
    };

    const completeRequest = ({
        id,
        value,
        setHideOnce,
        serviceName,
        resultSourceText,
        historySourceLanguage,
        historyTargetLanguage,
        persistResult,
    }) => {
        if (translateID[index] !== id) return;

        const normalized = normalizeResultForDisplay(value);
        info(`[${currentTranslateServiceInstanceKey}]resolve:${describeResultForLog(normalized)}`);
        setResult(normalized);
        setIsLoading(false);
        if (isDisplayableResult(normalized)) {
            setHideOnce(false);
        }

        if (!persistResult) return;

        const effects = createFinalResultEffects({
            result: normalized,
            sourceText: resultSourceText,
            autoCopy,
            isPrimaryResult: index === 0,
            clipboardMonitor,
        });

        if (!historyDisable && effects.historyValue !== null) {
            addToHistory(
                resultSourceText,
                historySourceLanguage,
                historyTargetLanguage,
                serviceName,
                effects.historyValue
            );
        }

        if (effects.clipboardText !== null) {
            writeText(effects.clipboardText).then(() => {
                if (hideWindow) {
                    sendNotification({
                        title: t('common.write_clipboard'),
                        body: effects.clipboardText,
                    });
                }
            });
        }
    };

    const rejectRequest = (id, reason) => {
        if (translateID[index] !== id) return;
        info(`[${currentTranslateServiceInstanceKey}]reject`);
        setError(reason instanceof Error ? reason.message : String(reason));
        setIsLoading(false);
    };

    const loadPluginForRequest = async (id, pluginType, serviceName) => {
        try {
            return await invoke_plugin(pluginType, serviceName);
        } catch (reason) {
            rejectRequest(id, reason);
            return null;
        }
    };

    const translate = async () => {
        const id = beginRequest();
        const translateServiceName = getServiceName(currentTranslateServiceInstanceKey);
        const resultSourceText = sourceText.trim();

        if (whetherPluginService(currentTranslateServiceInstanceKey)) {
            const pluginInfo = pluginList.translate[translateServiceName];
            if (!(sourceLanguage in pluginInfo.language)) {
                setError('Language not supported');
                return;
            }

            let newTargetLanguage = targetLanguage;
            if (sourceLanguage === 'auto' && targetLanguage === detectLanguage) {
                newTargetLanguage = translateSecondLanguage;
            }
            if (!(newTargetLanguage in pluginInfo.language)) {
                setError('Language not supported');
                return;
            }

            setIsLoading(true);
            setHide(true);
            const instanceConfig = {
                ...(serviceInstanceConfigMap[currentTranslateServiceInstanceKey] ?? {}),
                enable: 'true',
            };
            const setHideOnce = invokeOnce(setHide);
            const pluginRuntime = await loadPluginForRequest(id, 'translate', translateServiceName);
            if (pluginRuntime === null) return;
            const [func, utils] = pluginRuntime;
            const options = createPluginTranslateOptions({
                config: instanceConfig,
                detect: detectLanguage,
                setResult: (value) => handleStreamingResult(id, value, setHideOnce),
                utils,
            });

            Promise.resolve()
                .then(() =>
                    func(
                        resultSourceText,
                        pluginInfo.language[sourceLanguage],
                        pluginInfo.language[newTargetLanguage],
                        options
                    )
                )
                .then(
                    (value) =>
                        completeRequest({
                            id,
                            value,
                            setHideOnce,
                            serviceName: translateServiceName,
                            resultSourceText,
                            historySourceLanguage: detectLanguage,
                            historyTargetLanguage: newTargetLanguage,
                            persistResult: true,
                        }),
                    (reason) => rejectRequest(id, reason)
                );
            return;
        }

        const LanguageEnum = builtinServices[translateServiceName].Language;
        if (!(sourceLanguage in LanguageEnum)) {
            setError('Language not supported');
            return;
        }

        let newTargetLanguage = targetLanguage;
        if (sourceLanguage === 'auto' && targetLanguage === detectLanguage) {
            newTargetLanguage = translateSecondLanguage;
        }
        if (!(newTargetLanguage in LanguageEnum)) {
            setError('Language not supported');
            return;
        }

        setIsLoading(true);
        setHide(true);
        const instanceConfig = serviceInstanceConfigMap[currentTranslateServiceInstanceKey];
        const setHideOnce = invokeOnce(setHide);
        Promise.resolve()
            .then(() =>
                builtinServices[translateServiceName].translate(
                    resultSourceText,
                    LanguageEnum[sourceLanguage],
                    LanguageEnum[newTargetLanguage],
                    {
                        config: instanceConfig,
                        detect: detectLanguage,
                        setResult: (value) => handleStreamingResult(id, value, setHideOnce),
                    }
                )
            )
            .then(
                (value) =>
                    completeRequest({
                        id,
                        value,
                        setHideOnce,
                        serviceName: translateServiceName,
                        resultSourceText,
                        historySourceLanguage: detectLanguage,
                        historyTargetLanguage: newTargetLanguage,
                        persistResult: true,
                    }),
                (reason) => rejectRequest(id, reason)
            );
    };

    useEffect(() => {
        if (textAreaRef.current === null) return;
        textAreaRef.current.style.height = '0px';
        if (resultRenderKind === 'text' && trustedResultText !== null) {
            textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
        }
    }, [resultRenderKind, trustedResultText]);

    useEffect(() => {
        if (ttsServiceList && getServiceSouceType(ttsServiceList[0]) === ServiceSourceType.PLUGIN) {
            readTextFile(`plugins/tts/${getServiceName(ttsServiceList[0])}/info.json`, {
                dir: BaseDirectory.AppConfig,
            }).then((infoStr) => {
                setTtsPluginInfo(JSON.parse(infoStr));
            });
        }
    }, [ttsServiceList]);

    const handleSpeak = async (text) => {
        const instanceKey = ttsServiceList[0];
        if (getServiceSouceType(instanceKey) === ServiceSourceType.PLUGIN) {
            const pluginConfig = serviceInstanceConfigMap[instanceKey];
            if (!(targetLanguage in ttsPluginInfo.language)) {
                throw new Error('Language not supported');
            }
            const [func, utils] = await invoke_plugin('tts', getServiceName(instanceKey));
            const data = await func(text, ttsPluginInfo.language[targetLanguage], {
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
            text,
            builtinTtsServices[getServiceName(instanceKey)].Language[targetLanguage],
            { config: instanceConfig }
        );
        speak(data);
    };

    const handleTranslateBack = async () => {
        if (trustedResultText === null) return;
        const reverseSourceText = trustedResultText.trim();
        const id = beginRequest();
        const newTargetLanguage = sourceLanguage === 'auto' ? detectLanguage : sourceLanguage;
        const newSourceLanguage = sourceLanguage === 'auto' ? 'auto' : targetLanguage;
        const translateServiceName = getServiceName(currentTranslateServiceInstanceKey);

        if (whetherPluginService(currentTranslateServiceInstanceKey)) {
            const pluginInfo = pluginList.translate[translateServiceName];
            if (
                !(newSourceLanguage in pluginInfo.language) ||
                !(newTargetLanguage in pluginInfo.language)
            ) {
                setError('Language not supported');
                return;
            }

            setIsLoading(true);
            setHide(true);
            const instanceConfig = {
                ...(serviceInstanceConfigMap[currentTranslateServiceInstanceKey] ?? {}),
                enable: 'true',
            };
            const setHideOnce = invokeOnce(setHide);
            const pluginRuntime = await loadPluginForRequest(id, 'translate', translateServiceName);
            if (pluginRuntime === null) return;
            const [func, utils] = pluginRuntime;
            const options = createPluginTranslateOptions({
                config: instanceConfig,
                detect: detectLanguage,
                setResult: (value) => handleStreamingResult(id, value, setHideOnce),
                utils,
            });

            Promise.resolve()
                .then(() =>
                    func(
                        reverseSourceText,
                        pluginInfo.language[newSourceLanguage],
                        pluginInfo.language[newTargetLanguage],
                        options
                    )
                )
                .then(
                    (value) =>
                        completeRequest({
                            id,
                            value,
                            setHideOnce,
                            serviceName: translateServiceName,
                            resultSourceText: reverseSourceText,
                            historySourceLanguage: newSourceLanguage,
                            historyTargetLanguage: newTargetLanguage,
                            persistResult: false,
                        }),
                    (reason) => rejectRequest(id, reason)
                );
            return;
        }

        const LanguageEnum = builtinServices[translateServiceName].Language;
        if (!(newSourceLanguage in LanguageEnum) || !(newTargetLanguage in LanguageEnum)) {
            setError('Language not supported');
            return;
        }

        setIsLoading(true);
        setHide(true);
        const instanceConfig = serviceInstanceConfigMap[currentTranslateServiceInstanceKey];
        const setHideOnce = invokeOnce(setHide);
        Promise.resolve()
            .then(() =>
                builtinServices[translateServiceName].translate(
                    reverseSourceText,
                    LanguageEnum[newSourceLanguage],
                    LanguageEnum[newTargetLanguage],
                    {
                        config: instanceConfig,
                        detect: newSourceLanguage,
                        setResult: (value) => handleStreamingResult(id, value, setHideOnce),
                    }
                )
            )
            .then(
                (value) =>
                    completeRequest({
                        id,
                        value,
                        setHideOnce,
                        serviceName: translateServiceName,
                        resultSourceText: reverseSourceText,
                        historySourceLanguage: newSourceLanguage,
                        historyTargetLanguage: newTargetLanguage,
                        persistResult: false,
                    }),
                (reason) => rejectRequest(id, reason)
            );
    };

    const [boundRef, bounds] = useMeasure({ scroll: true });
    const springs = useSpring({
        from: { height: 0 },
        to: { height: hide ? 0 : bounds.height },
    });

    return (
        <Card
            shadow='none'
            className='rounded-[10px]'
        >
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
                                                pluginList.translate[
                                                    getServiceName(currentTranslateServiceInstanceKey)
                                                ].icon
                                            }
                                            className='h-[20px] my-auto'
                                        />
                                    ) : (
                                        <img
                                            src={
                                                builtinServices[
                                                    getServiceName(currentTranslateServiceInstanceKey)
                                                ].info.icon
                                            }
                                            className='h-[20px] my-auto'
                                        />
                                    )
                                }
                            >
                                {whetherPluginService(currentTranslateServiceInstanceKey) ? (
                                    <div className='my-auto'>
                                        {`${getInstanceName(
                                            currentTranslateServiceInstanceKey,
                                            () =>
                                                pluginList.translate[
                                                    getServiceName(currentTranslateServiceInstanceKey)
                                                ].display
                                        )} `}
                                    </div>
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
                                        <div className='my-auto'>
                                            {`${getInstanceName(
                                                instanceKey,
                                                () => pluginList.translate[getServiceName(instanceKey)].display
                                            )} `}
                                        </div>
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
                        color={
                            theme === 'dark'
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
                        {resultRenderKind === 'programmer' && (
                            <ProgrammerMinimalResult
                                key={getProgrammerResultKey(resultQueryId)}
                                result={result}
                                idPrefix={`target-${index}-${resultQueryId}`}
                                labels={programmerLabels}
                                onCopy={(text) => writeText(text)}
                            />
                        )}
                        {resultRenderKind === 'text' && (
                            <textarea
                                ref={textAreaRef}
                                className={`text-[${appFontSize}px] h-0 w-full resize-none bg-transparent select-text outline-none`}
                                readOnly
                                value={trustedResultText ?? ''}
                            />
                        )}
                        {resultRenderKind === 'legacy-object' && legacyResult && (
                            <LegacyDictionaryResult
                                result={legacyResult}
                                appFontSize={appFontSize}
                                speak={speak}
                            />
                        )}
                        {error !== '' &&
                            error.split('\n').map((line, errorIndex) => (
                                <p
                                    key={`${errorIndex}-${line}`}
                                    className={`text-[${appFontSize}px] text-red-500`}
                                >
                                    {line}
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
                                    isDisabled={!hasTextActions}
                                    onPress={() => {
                                        handleSpeak(trustedResultText).catch((reason) => {
                                            toast.error(String(reason), { style: toastStyle });
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
                                    isDisabled={!hasTextActions}
                                    onPress={() => writeText(trustedResultText)}
                                >
                                    <MdContentCopy className='text-[16px]' />
                                </Button>
                            </Tooltip>
                            <Tooltip content={t('translate.translate_back')}>
                                <Button
                                    isIconOnly
                                    variant='light'
                                    size='sm'
                                    isDisabled={!hasTextActions}
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
                                    onPress={translate}
                                >
                                    <GiCycle className='text-[16px]' />
                                </Button>
                            </Tooltip>
                            {collectionServiceList?.map((collectionServiceInstanceName) => {
                                const pluginCollection =
                                    getServiceSouceType(collectionServiceInstanceName) ===
                                    ServiceSourceType.PLUGIN;
                                const collectionResult = getCollectionResultValue(
                                    result,
                                    pluginCollection
                                );
                                return (
                                    <Button
                                        key={collectionServiceInstanceName}
                                        isIconOnly
                                        variant='light'
                                        size='sm'
                                        isDisabled={collectionResult === null}
                                        onPress={async () => {
                                            if (pluginCollection) {
                                                const pluginConfig =
                                                    serviceInstanceConfigMap[
                                                        collectionServiceInstanceName
                                                    ];
                                                const [func, utils] = await invoke_plugin(
                                                    'collection',
                                                    getServiceName(collectionServiceInstanceName)
                                                );
                                                func(sourceText.trim(), collectionResult, {
                                                    config: pluginConfig,
                                                    utils,
                                                }).then(
                                                    () => {
                                                        toast.success(
                                                            t('translate.add_collection_success'),
                                                            { style: toastStyle }
                                                        );
                                                    },
                                                    (reason) => {
                                                        toast.error(String(reason), {
                                                            style: toastStyle,
                                                        });
                                                    }
                                                );
                                                return;
                                            }

                                            const instanceConfig =
                                                serviceInstanceConfigMap[
                                                    collectionServiceInstanceName
                                                ];
                                            builtinCollectionServices[
                                                getServiceName(collectionServiceInstanceName)
                                            ]
                                                .collection(sourceText, collectionResult, {
                                                    config: instanceConfig,
                                                })
                                                .then(
                                                    () => {
                                                        toast.success(
                                                            t('translate.add_collection_success'),
                                                            { style: toastStyle }
                                                        );
                                                    },
                                                    (reason) => {
                                                        toast.error(String(reason), {
                                                            style: toastStyle,
                                                        });
                                                    }
                                                );
                                        }}
                                    >
                                        <img
                                            src={
                                                pluginCollection
                                                    ? pluginList.collection[
                                                          getServiceName(
                                                              collectionServiceInstanceName
                                                          )
                                                      ].icon
                                                    : builtinCollectionServices[
                                                          getServiceName(
                                                              collectionServiceInstanceName
                                                          )
                                                      ].info.icon
                                            }
                                            className='h-[16px] w-[16px]'
                                        />
                                    </Button>
                                );
                            })}
                        </ButtonGroup>
                    </CardFooter>
                </div>
            </animated.div>
        </Card>
    );
}
