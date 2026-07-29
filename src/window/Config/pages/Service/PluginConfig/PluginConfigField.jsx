import {
    Button,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger,
    Input,
    Textarea,
} from '@nextui-org/react';
import React, { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

import { resolvePluginFieldValue } from '../../../../../utils/plugin_config_schema';

const SINGLE_LINE_INPUT_CLASS_NAMES = Object.freeze({
    base: 'w-full',
    inputWrapper: 'min-h-10 h-auto py-2',
    innerWrapper: 'items-center',
    input: 'h-auto min-h-0 leading-normal py-0',
});

function SecretToggle({ visible, onToggle, fieldDisplay }) {
    const actionLabel = visible ? '隐藏' : '显示';

    return (
        <Button
            isIconOnly
            size='sm'
            variant='light'
            className='min-w-8 h-8'
            aria-label={`${actionLabel}${fieldDisplay}`}
            title={`${actionLabel}${fieldDisplay}`}
            onPress={onToggle}
        >
            {visible ? <FiEyeOff aria-hidden='true' /> : <FiEye aria-hidden='true' />}
        </Button>
    );
}

export function PluginConfigField({ field, pluginConfig, onValueChange }) {
    const [secretVisible, setSecretVisible] = useState(false);
    const value = resolvePluginFieldValue(field, pluginConfig);
    const descriptionId = field.description ? `plugin-config-description-${field.sourceIndex}` : undefined;

    const fieldControl = (() => {
        if (field.type === 'select') {
            const selectedLabel = Object.prototype.hasOwnProperty.call(field.options, value)
                ? field.options[value]
                : value;

            return (
                <Dropdown>
                    <DropdownTrigger>
                        <Button
                            variant='bordered'
                            className='w-full min-w-0 justify-between whitespace-normal text-left h-auto min-h-10 py-2'
                            aria-describedby={descriptionId}
                        >
                            <span className='min-w-0 break-words'>{selectedLabel}</span>
                        </Button>
                    </DropdownTrigger>
                    <DropdownMenu
                        aria-label={field.display}
                        className='max-h-[40vh] max-w-[min(90vw,520px)] overflow-y-auto'
                        onAction={(key) => onValueChange(field.key, String(key))}
                    >
                        {Object.keys(field.options).map((optionKey) => (
                            <DropdownItem
                                key={optionKey}
                                className='whitespace-normal'
                            >
                                {field.options[optionKey]}
                            </DropdownItem>
                        ))}
                    </DropdownMenu>
                </Dropdown>
            );
        }

        if (field.multiline) {
            const secretInputClass = field.secret
                ? secretVisible
                    ? 'pr-10'
                    : '[-webkit-text-security:disc] pr-10'
                : '';

            return (
                <div className='relative w-full'>
                    <Textarea
                        value={value}
                        variant='bordered'
                        minRows={field.rows}
                        placeholder={field.placeholder || undefined}
                        aria-label={field.display}
                        aria-describedby={descriptionId}
                        classNames={{
                            base: 'w-full',
                            input: secretInputClass,
                        }}
                        onValueChange={(nextValue) => onValueChange(field.key, nextValue)}
                    />
                    {field.secret && (
                        <div className='absolute right-2 top-2 z-10'>
                            <SecretToggle
                                visible={secretVisible}
                                fieldDisplay={field.display}
                                onToggle={() => setSecretVisible((current) => !current)}
                            />
                        </div>
                    )}
                </div>
            );
        }

        return (
            <Input
                value={value}
                variant='bordered'
                type={field.secret && !secretVisible ? 'password' : 'text'}
                placeholder={field.placeholder || undefined}
                aria-label={field.display}
                aria-describedby={descriptionId}
                classNames={SINGLE_LINE_INPUT_CLASS_NAMES}
                endContent={
                    field.secret ? (
                        <SecretToggle
                            visible={secretVisible}
                            fieldDisplay={field.display}
                            onToggle={() => setSecretVisible((current) => !current)}
                        />
                    ) : null
                }
                onValueChange={(nextValue) => onValueChange(field.key, nextValue)}
            />
        );
    })();

    return (
        <div className='grid gap-2 py-3 min-[520px]:grid-cols-[minmax(0,1fr)_minmax(220px,50%)] min-[520px]:gap-x-4'>
            <div className='min-w-0'>
                <h3 className='select-none cursor-default break-words'>{field.display}</h3>
                {field.description && (
                    <p
                        id={descriptionId}
                        className='mt-1 text-small text-default-500 whitespace-pre-wrap break-words select-text cursor-text'
                    >
                        {field.description}
                    </p>
                )}
            </div>
            <div className='min-w-0 w-full'>{fieldControl}</div>
        </div>
    );
}
