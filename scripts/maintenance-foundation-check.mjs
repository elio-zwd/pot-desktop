import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const requiredMarkdownFiles = [
    'README.md',
    'AGENTS.md',
    'SECURITY.md',
    'UPSTREAM_PORTS.md',
    'docs/MAINTENANCE_SCOPE.md',
    'docs/RELEASE_POLICY.md',
    'docs/UPSTREAM_PORT_POLICY.md',
    'docs/UPDATER_AUDIT.md',
];

function readRepositoryFile(relativePath) {
    const absolutePath = resolve(repositoryRoot, relativePath);
    assert.equal(existsSync(absolutePath), true, `缺少必需文件：${relativePath}`);
    const content = readFileSync(absolutePath, 'utf8');
    assert.notEqual(content.trim(), '', `文件不能为空：${relativePath}`);
    return content;
}

function validateJson(relativePath) {
    const content = readRepositoryFile(relativePath);
    assert.doesNotThrow(() => JSON.parse(content), `JSON 无法解析：${relativePath}`);
    return JSON.parse(content);
}

function validateLocalMarkdownLinks(relativePath, content) {
    const linkPattern = /\[[^\]]*\]\(([^)]+)\)/g;
    for (const match of content.matchAll(linkPattern)) {
        const rawTarget = match[1].trim().replace(/^<|>$/g, '');
        if (
            rawTarget === '' ||
            rawTarget.startsWith('#') ||
            rawTarget.startsWith('http://') ||
            rawTarget.startsWith('https://') ||
            rawTarget.startsWith('mailto:')
        ) {
            continue;
        }

        const fileTarget = rawTarget.split('#', 1)[0].split('?', 1)[0];
        if (fileTarget === '') {
            continue;
        }

        const decodedTarget = decodeURIComponent(fileTarget);
        const absoluteTarget = resolve(repositoryRoot, dirname(relativePath), decodedTarget);
        assert.equal(existsSync(absoluteTarget), true, `${relativePath} 包含失效本地链接：${rawTarget}`);
    }
}

for (const relativePath of requiredMarkdownFiles) {
    const content = readRepositoryFile(relativePath);
    validateLocalMarkdownLinks(relativePath, content);
}

const packageJson = validateJson('package.json');
assert.equal(packageJson.scripts.build, 'vite build', 'package.json 的 build 入口发生意外变化');

const tauriConfig = validateJson('src-tauri/tauri.conf.json');
const updaterConfig = tauriConfig?.tauri?.updater;
assert.equal(updaterConfig?.active, false, '社区维护版必须关闭 Tauri Updater');
assert.equal(Object.hasOwn(updaterConfig, 'endpoints'), false, '运行时配置不得保留官方 updater endpoints');
assert.equal(Object.hasOwn(updaterConfig, 'pubkey'), false, '运行时配置不得保留官方 updater pubkey');

const updaterSource = readRepositoryFile('src-tauri/src/updater.rs');
assert.equal(updaterSource.includes('tauri::updater'), false, '启动检查不得调用 Tauri 官方更新器');
assert.equal(
    updaterSource.includes('尚未配置自有更新通道'),
    true,
    '启动日志必须说明维护版更新通道未配置'
);

for (const relativePath of [
    '.github/workflows/custom-ci.yml',
    '.github/ISSUE_TEMPLATE/bug_report.yml',
    '.github/PULL_REQUEST_TEMPLATE.md',
]) {
    readRepositoryFile(relativePath);
}

console.log('维护版基础配置自检通过');
