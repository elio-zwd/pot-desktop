import { INSTANCE_NAME_CONFIG_KEY } from '../../../../../utils/service_instance';
import {
    Button,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger,
    Input,
    Switch,
    Textarea,
} from '@nextui-org/react';
import { useTranslation } from 'react-i18next';
import { open } from '@tauri-apps/api/shell';
import React, { useEffect, useMemo, useState } from 'react';

import { useConfig } from '../../../../../hooks';
import {
    buildPluginConfigModel,
    getControlValue,
    getSwitchValues,
    isSafeExternalHref,
} from './schema';

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

const openSafeExternalHref = (href) => {
    if (!isSafeExternalHref(href)) {
        return;
    }
    open(href).catch(() => {});
};

function ConfigItemLabel({ display, description }) {
    return (
        <div className='min-w-0 flex-1'>
            <h3 className='my-auto select-none break-words cursor-default'>{display}</h3>
            {description && (
                <p className='mt-1 break-words text-small text-default-500'>{description}</p>
            )}
        </div>
    );
}

export function PluginConfig(props) {
    const { instanceKey, updateServiceList, onClose, name, pluginList } = props;
    const [pluginConfig, setPluginConfig] = useConfig(instanceKey, {}, { sync: false });
    const [sectionExpanded, setSectionExpanded] = useState({});
    const [revealedSecrets, setRevealedSecrets] = useState({});
    const { t } = useTranslation();
    const plugin = pluginList[name];
    const needs = Array.isArray(plugin?.needs) ? plugin.needs : [];
    const configModel = useMemo(
        () => buildPluginConfigModel(needs, pluginConfig ?? {}),
        [needs, pluginConfig]
    );

    useEffect(() => {
        setSectionExpanded({});
        setRevealedSecrets({});
    }, [name]);

    const updateConfigValue = (key, value) => {
        if (!pluginConfig) {
            return;
        }
        setPluginConfig({
            ...pluginConfig,
            [key]: value,
        });
    };

    const renderConfigItem = (item) => {
        if (!pluginConfig) {
            return null;
        }

        const commonClassName = 'config-item flex-col items-stretch gap-2 sm:flex-row sm:items-center';
        const controlClassName = 'w-full max-w-full sm:max-w-[50%]';

        if (item.type === 'help') {
            return (
                <div
                    key={item.id}
                    className={commonClassName}
                >
                    <div className='min-w-0 flex-1'>
                        <p className='break-words whitespace-pre-wrap'>{item.text}</p>
                        {item.description && (
                            <p className='mt-1 break-words text-small text-default-500'>
                                {item.description}
                            </p>
                        )}
                    </div>
                    {item.href && (
                        <Button
                            variant='bordered'
                            className={controlClassName}
                            onPress={() => openSafeExternalHref(item.href)}
                        >
                            {item.display || t('common.open', { defaultValue: '打开' })}
                        </Button>
                    )}
                </div>
            );
        }

        if (item.type === 'input') {
            return (
                <div
                    key={item.id}
                    className={commonClassName}
                >
                    <ConfigItemLabel
                        display={item.display}
                        description={item.description}
                    />
                    <Input
                        aria-label={item.display}
                        value={getControlValue(item, pluginConfig)}
                        placeholder={item.placeholder}
                        variant='bordered'
                        className={controlClassName}
                        onValueChange={(value) => updateConfigValue(item.key, value)}
                    />
                </div>
            );
        }

        if (item.type === 'secret') {
            const isRevealed = revealedSecrets[item.key] === true;
            const visibilityLabel = isRevealed
                ? t('common.hide', { defaultValue: '隐藏' })
                : t('common.show', { defaultValue: '显示' });
            return (
                <div
                    key={item.id}
                    className={commonClassName}
                >
                    <ConfigItemLabel
                        display={item.display}
                        description={item.description}
                    />
                    <Input
                        aria-label={item.display}
                        value={getControlValue(item, pluginConfig)}
                        placeholder={item.placeholder}
                        variant='bordered'
                        type={isRevealed ? 'text' : 'password'}
                        autoComplete='off'
                        className={controlClassName}
                        endContent={
                            <Button
                                size='sm'
                                variant='light'
                                className='h-7 min-w-fit px-2'
                                aria-label={visibilityLabel}
                                onPress={() => {
                                    setRevealedSecrets((current) => ({
                                        ...current,
                                        [item.key]: !isRevealed,
                                    }));
                                }}
                            >
                                {visibilityLabel}
                            </Button>
                        }
                        onValueChange={(value) => updateConfigValue(item.key, value)}
                    />
                </div>
            );
        }

        if (item.type === 'textarea') {
            return (
                <div
                    key={item.id}
                    className={commonClassName}
                >
                    <ConfigItemLabel
                        display={item.display}
                        description={item.description}
                    />
                    <Textarea
                        aria-label={item.display}
                        value={getControlValue(item, pluginConfig)}
                        placeholder={item.placeholder}
                        variant='bordered'
                        minRows={item.rows}
                        maxRows={item.rows}
                        className={controlClassName}
                        onValueChange={(value) => updateConfigValue(item.key, value)}
                    />
                </div>
            );
        }

        if (item.type === 'switch') {
            const { onValue, offValue } = getSwitchValues(item);
            const isSelected = getControlValue(item, pluginConfig) === onValue;
            return (
                <div
                    key={item.id}
                    className={commonClassName}
                >
                    <ConfigItemLabel
                        display={item.display}
                        description={item.description}
                    />
                    <div className={`${controlClassName} flex justify-end sm:justify-start`}>
                        <Switch
                            aria-label={item.display}
                            isSelected={isSelected}
                            onValueChange={(selected) =>
                                updateConfigValue(item.key, selected ? onValue : offValue)
                            }
                        />
                    </div>
                </div>
            );
        }

        if (item.type === 'select') {
            const selectedKey = getControlValue(item, pluginConfig);
            const selectedOption = item.options.find((option) => option.key === selectedKey);
            return (
                <div
                    key={item.id}
                    className={commonClassName}
                >
                    <ConfigItemLabel
                        display={item.display}
                        description={item.description}
                    />
                    {item.options.length === 0 ? (
                        <Button
                            isDisabled
                            variant='bordered'
                            className={controlClassName}
                        >
                            —
                        </Button>
                    ) : (
                        <Dropdown>
                            <DropdownTrigger>
                                <Button
                                    variant='bordered'
                                    className={controlClassName}
                                >
                                    {selectedOption?.label ?? selectedKey}
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                                aria-label={item.key}
                                className='max-h-[40vh] overflow-y-auto'
                                onAction={(key) => updateConfigValue(item.key, String(key))}
                            >
                                {item.options.map((option) => (
                                    <DropdownItem key={option.key}>{option.label}</DropdownItem>
                                ))}
                            </DropdownMenu>
                        </Dropdown>
                    )}
                </div>
            );
        }

        return null;
    };

    return (
        <>
            <div className='config-item flex-col items-stretch gap-2 sm:flex-row sm:items-center'>
                <h3 className='my-auto select-none cursor-default'>{t('config.service.homepage')}</h3>
                <Button
                    variant='bordered'
                    className='w-full max-w-full sm:max-w-[50%]'
                    isDisabled={!isSafeExternalHref(plugin?.homepage)}
                    onPress={() => openSafeExternalHref(plugin?.homepage)}
                >
                    {t('config.service.homepage')}
                </Button>
            </div>
            {pluginConfig && (
                <div className='config-item flex-col items-stretch gap-2 sm:flex-row sm:items-center'>
                    <Input
                        label={t('services.instance_name')}
                        labelPlacement='outside-left'
                        value={pluginConfig[INSTANCE_NAME_CONFIG_KEY] ?? plugin?.display ?? ''}
                        variant='bordered'
                        classNames={{
                            base: 'justify-between',
                            label: 'text-[length:--nextui-font-size-medium]',
                            mainWrapper: 'w-full max-w-full sm:max-w-[50%]',
                        }}
                        onValueChange={(value) => {
                            setPluginConfig({
                                ...pluginConfig,
                                [INSTANCE_NAME_CONFIG_KEY]: value,
                            });
                        }}
                    />
                </div>
            )}

            {!configModel.hasItems ? (
                <div>{t('services.no_need')}</div>
            ) : (
                <>
                    {configModel.rootItems.map(renderConfigItem)}
                    {configModel.sections.map((section) => {
                        if (section.items.length === 0) {
                            return null;
                        }
                        const isExpanded = hasOwn(sectionExpanded, section.key)
                            ? sectionExpanded[section.key]
                            : section.defaultExpanded;
                        const contentId = `plugin-config-${section.id}`;
                        return (
                            <section
                                key={section.id}
                                className='overflow-hidden rounded-medium border border-divider'
                            >
                                <Button
                                    fullWidth
                                    variant='light'
                                    className='h-auto justify-between gap-3 rounded-none px-3 py-2 text-left'
                                    aria-expanded={isExpanded}
                                    aria-controls={contentId}
                                    onPress={() => {
                                        setSectionExpanded((current) => ({
                                            ...current,
                                            [section.key]: !isExpanded,
                                        }));
                                    }}
                                >
                                    <span className='min-w-0 flex-1'>
                                        <span className='block break-words font-medium'>{section.display}</span>
                                        {section.description && (
                                            <span className='mt-1 block break-words text-small text-default-500'>
                                                {section.description}
                                            </span>
                                        )}
                                    </span>
                                    <span aria-hidden='true'>{isExpanded ? '−' : '+'}</span>
                                </Button>
                                {isExpanded && (
                                    <div
                                        id={contentId}
                                        className='border-t border-divider px-3'
                                    >
                                        {section.items.map(renderConfigItem)}
                                    </div>
                                )}
                            </section>
                        );
                    })}
                </>
            )}

            <div>
                <Button
                    fullWidth
                    color='primary'
                    isDisabled={!pluginConfig}
                    onPress={() => {
                        if (!pluginConfig) {
                            return;
                        }
                        setPluginConfig(pluginConfig, true);
                        updateServiceList(instanceKey);
                        onClose();
                    }}
                >
                    {t('common.save')}
                </Button>
            </div>
        </>
    );
}
