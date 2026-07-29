import { Button, Card, CardBody, CardHeader } from '@nextui-org/react';
import React, { useId, useMemo, useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';

import { evaluateVisibleWhen } from '../../../../../utils/plugin_config_schema';
import { PluginConfigField } from './PluginConfigField';

function GroupFields({ fields, pluginConfig, onValueChange }) {
    return (
        <div className='divide-y divide-divider'>
            {fields.map((field) => (
                <PluginConfigField
                    key={`${field.key}-${field.sourceIndex}`}
                    field={field}
                    pluginConfig={pluginConfig}
                    onValueChange={onValueChange}
                />
            ))}
        </div>
    );
}

export function PluginConfigGroup({ group, pluginConfig, onValueChange }) {
    const [expanded, setExpanded] = useState(() => !group.advanced);
    const contentId = useId();
    const visibleFields = useMemo(
        () => group.fields.filter((field) => evaluateVisibleWhen(field.visibleWhen, pluginConfig)),
        [group.fields, pluginConfig]
    );

    if (visibleFields.length === 0) {
        return null;
    }

    if (group.legacy) {
        return (
            <GroupFields
                fields={visibleFields}
                pluginConfig={pluginConfig}
                onValueChange={onValueChange}
            />
        );
    }

    return (
        <Card
            shadow='none'
            className='border-small border-divider bg-content1/70'
        >
            <CardHeader className='px-3 py-2 min-h-11'>
                {group.advanced ? (
                    <Button
                        fullWidth
                        variant='light'
                        className='justify-between px-1 font-semibold text-medium'
                        aria-expanded={expanded}
                        aria-controls={contentId}
                        onPress={() => setExpanded((current) => !current)}
                    >
                        <span className='min-w-0 break-words text-left'>{group.display}</span>
                        <FiChevronDown
                            aria-hidden='true'
                            className={`shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
                        />
                    </Button>
                ) : (
                    <h3 className='font-semibold text-medium break-words'>{group.display}</h3>
                )}
            </CardHeader>
            {expanded && (
                <CardBody
                    id={contentId}
                    className='px-3 pt-0 pb-1'
                >
                    <GroupFields
                        fields={visibleFields}
                        pluginConfig={pluginConfig}
                        onValueChange={onValueChange}
                    />
                </CardBody>
            )}
        </Card>
    );
}
