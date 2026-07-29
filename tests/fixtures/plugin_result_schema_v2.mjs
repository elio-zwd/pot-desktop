export const completeV2Fixture = {
    schemaVersion: 2,
    copyText: 'NFC 写入 16 位无符号整数',
    sections: [
        { id: 'summary', type: 'summary', title: '核心释义', content: 'NFC 写入 16 位无符号整数', source: 'local' },
        {
            id: 'identifier',
            type: 'metadata',
            title: '标识符信息',
            items: [
                { label: '类型', value: '函数名' },
                { label: '原文', value: 'NFC_WriteU16LE', copyText: 'NFC_WriteU16LE' },
            ],
            tokens: ['NFC', 'write', 'U16', 'LE'],
        },
        {
            id: 'dictionary',
            type: 'dictionary',
            title: '逐词解释',
            items: [{ token: 'write', phonetic: '/raɪt/', meaning: '写入', source: 'ai' }],
        },
        {
            id: 'naming',
            type: 'code-list',
            title: '命名转换',
            items: [{ label: '小驼峰', value: 'nfcWriteU16Le' }],
        },
        {
            id: 'note',
            type: 'note',
            title: 'AI 补充',
            content: '补充说明',
            source: 'ai',
            collapsible: true,
            defaultCollapsed: true,
        },
        { id: 'status', type: 'status', title: '诊断', content: '已回退本地结果', severity: 'warning' },
    ],
};

export const legacyFixture = {
    pronunciations: [{ region: 'US', symbol: '/test/' }],
    explanations: [{ trait: 'n.', explains: ['测试'] }],
    associations: ['test case'],
    sentence: [{ source: '<b>test</b>', target: '测试' }],
};
