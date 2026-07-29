import React from 'react';
import { HiOutlineVolumeUp } from 'react-icons/hi';

function asArray(value) {
    return Array.isArray(value) ? value : [];
}

export default function LegacyResult({ result, appFontSize, speak }) {
    return (
        <div className='min-w-0'>
            {asArray(result?.pronunciations).map((pronunciation, index) => (
                <div key={`pronunciation-${index}`}>
                    {pronunciation?.region && (
                        <span className='mr-[12px] text-default-500' style={{ fontSize: `${appFontSize}px` }}>
                            {pronunciation.region}
                        </span>
                    )}
                    {pronunciation?.symbol && (
                        <span className='mr-[12px] text-default-500' style={{ fontSize: `${appFontSize}px` }}>
                            {pronunciation.symbol}
                        </span>
                    )}
                    {pronunciation?.voice && pronunciation.voice !== '' && (
                        <HiOutlineVolumeUp
                            className='inline-block my-auto cursor-pointer'
                            style={{ fontSize: `${appFontSize}px` }}
                            onClick={() => speak(pronunciation.voice)}
                        />
                    )}
                </div>
            ))}

            {asArray(result?.explanations).map((explanation, explanationIndex) => (
                <div key={`explanation-${explanationIndex}`}>
                    {asArray(explanation?.explains).map((explain, index) => (
                        <span key={`explain-${explanationIndex}-${index}`}>
                            {index === 0 ? (
                                <>
                                    <span
                                        className='mr-[12px] text-default-500'
                                        style={{ fontSize: `${Math.max(10, appFontSize - 2)}px` }}
                                    >
                                        {explanation?.trait}
                                    </span>
                                    <span
                                        className='font-bold select-text break-words'
                                        style={{ fontSize: `${appFontSize}px` }}
                                    >
                                        {explain}
                                    </span>
                                    <br />
                                </>
                            ) : (
                                <span
                                    className='mr-1 text-default-500 select-text break-words'
                                    style={{ fontSize: `${Math.max(10, appFontSize - 2)}px` }}
                                >
                                    {explain}
                                </span>
                            )}
                        </span>
                    ))}
                </div>
            ))}

            <br />

            {asArray(result?.associations).map((association, index) => (
                <div key={`association-${index}`}>
                    <span className='text-default-500 break-words' style={{ fontSize: `${appFontSize}px` }}>
                        {association}
                    </span>
                </div>
            ))}

            {asArray(result?.sentence).map((sentence, index) => (
                <div key={`sentence-${index}`} className='min-w-0'>
                    <span className='mr-[12px]' style={{ fontSize: `${Math.max(10, appFontSize - 2)}px` }}>
                        {index + 1}.
                    </span>
                    {sentence?.source && (
                        <span
                            className='select-text break-words'
                            style={{ fontSize: `${appFontSize}px` }}
                            dangerouslySetInnerHTML={{ __html: sentence.source }}
                        />
                    )}
                    {sentence?.target && (
                        <div
                            className='select-text text-default-500 break-words'
                            style={{ fontSize: `${appFontSize}px` }}
                            dangerouslySetInnerHTML={{ __html: sentence.target }}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}
