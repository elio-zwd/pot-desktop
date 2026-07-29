import { INSTANCE_NAME_CONFIG_KEY } from '../../../../../utils/service_instance';
import { Button, Input } from '@nextui-org/react';
import { useTranslation } from 'react-i18next';
import { open } from '@tauri-apps/api/shell';
import React, { useCallback, useMemo } from 'react';

import { useConfig } from '../../../../../hooks';
import { normalizePluginNeeds } from '../../../../../utils/plugin_config_schema';
import { PluginConfigGroup } from './PluginConfigGroup';

export function PluginConfig(props) {
    const { instanceKey, updateServiceList, onClose, name, pluginList } = props;
    const [pluginConfig, setPluginConfig] = useConfig(instanceKey, {}, { sync: false });
    const { t } = useTranslation();
    const plugin = pluginList?.[name] ?? {};
    const groups = useMemo(() => normalizePluginNeeds(plugin.needs), [plugin.needs]);

    const updateFieldValue = useCallback(
        (key, value) => {
            setPluginConfig({
                ...pluginConfig,
                [key]: value,
            });
        },
        [pluginConfig, setPluginConfig]
    );

    return (
        <>
            <div className='config-item gap-3'>
                <h3 className='my-auto select-none cursor-default'>{t('config.service.homepage')}</h3>
                <Button
                    isDisabled={!plugin.homepage}
                    onPress={() => {
                        if (plugin.homepage) {
                            open(plugin.homepage);
                        }
                    }}
                >
                    {t('config.service.homepage')}
                </Button>
            </div>
            {pluginConfig && (
                <div className='config-item gap-3 max-[519px]:flex-col'>
                    <Input
                        label={t('services.instance_name')}
                        labelPlacement='outside-left'
                        value={pluginConfig[INSTANCE_NAME_CONFIG_KEY] ?? plugin.display ?? name}
                        variant='bordered'
                        classNames={{
                            base: 'justify-between max-[519px]:flex-col max-[519px]:items-stretch',
                            label: 'text-[length:--nextui-font-size-medium] max-[519px]:mb-1',
                            mainWrapper: 'max-w-[50%] max-[519px]:max-w-none',
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

            {groups.length === 0 ? (
                <div>{t('services.no_need')}</div>
            ) : (
                pluginConfig && (
                    <div className='flex flex-col gap-3'>
                        {groups.map((group) => (
                            <PluginConfigGroup
                                key={`${name}-${group.key}`}
                                group={group}
                                pluginConfig={pluginConfig}
                                onValueChange={updateFieldValue}
                            />
                        ))}
                    </div>
                )
            )}

            <div className='mt-3'>
                <Button
                    fullWidth
                    color='primary'
                    isDisabled={!pluginConfig}
                    onPress={() => {
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
