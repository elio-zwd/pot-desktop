import React from 'react';

import ResultSection from './ResultSection';

export default function StructuredResult({ result, appFontSize, onCopyText, copyLabel }) {
    return (
        <div className='flex min-w-0 flex-col gap-2'>
            {result.sections.map((section) => (
                <ResultSection
                    key={section.id}
                    section={section}
                    appFontSize={appFontSize}
                    onCopyText={onCopyText}
                    copyLabel={copyLabel}
                />
            ))}
        </div>
    );
}
