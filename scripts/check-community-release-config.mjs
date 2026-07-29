import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const expected = Object.freeze({
    packageName: 'pot-community',
    version: '3.1.0-elio.1',
    productName: 'Pot 社区维护版',
    identifier: 'com.elio.potcommunity',
    publisher: 'Elio Community',
    repository: 'https://github.com/elio-zwd/pot-desktop',
});

function readText(relativePath) {
    const absolutePath = resolve(repositoryRoot, relativePath);
    assert.equal(existsSync(absolutePath), true, `缺少文件：${relativePath}`);
    return readFileSync(absolutePath, 'utf8');
}

function readJson(relativePath) {
    const content = readText(relativePath);
    assert.doesNotThrow(() => JSON.parse(content), `JSON 无法解析：${relativePath}`);
    return JSON.parse(content);
}

function assertValidCommunitySemver(version) {
    const pattern = /^\d+\.\d+\.\d+-elio\.\d+$/;
    assert.match(version, pattern, '维护版版本必须使用 x.y.z-elio.n 格式');
}

const packageJson = readJson('package.json');
assert.equal(packageJson.name, expected.packageName, 'package.json name 不正确');
assert.equal(packageJson.version, expected.version, 'package.json version 不正确');
assertValidCommunitySemver(packageJson.version);
assert.equal(packageJson.private, true, '桌面应用包必须保持 private');
assert.equal(packageJson.scripts['release:check'], 'node scripts/check-community-release-config.mjs');
assert.equal(packageJson.scripts['release:manifest'], 'node scripts/generate-community-updater-manifest.mjs');
assert.equal(packageJson.scripts['release:manifest:test'], 'node --test tests/community_updater_manifest.test.mjs');
assert.equal(Object.hasOwn(packageJson.scripts, 'updater'), false, '不得保留容易误执行的 updater 脚本名');
assert.equal(Object.hasOwn(packageJson.scripts, 'updater:fixRuntime'), false, '不得保留容易误执行的 updater:fixRuntime 脚本名');
assert.equal(packageJson.scripts['upstream:updater'], 'node updater/updater.mjs');
assert.equal(packageJson.scripts['upstream:updater:fixRuntime'], 'node updater/updater-for-fix-runtime.mjs');

const tauriConfig = readJson('src-tauri/tauri.conf.json');
assert.equal(tauriConfig.package?.productName, expected.productName, 'Tauri productName 不正确');
assert.equal(tauriConfig.package?.version, '../package.json', 'Tauri 版本必须读取根目录 package.json');
assert.equal(tauriConfig.tauri?.bundle?.identifier, expected.identifier, 'Bundle identifier 不正确');
assert.equal(tauriConfig.tauri?.bundle?.publisher, expected.publisher, 'Windows publisher 不正确');
assert.equal(tauriConfig.tauri?.bundle?.active, true, 'Tauri bundler 必须启用');

const updaterConfig = tauriConfig.tauri?.updater;
assert.equal(updaterConfig?.active, false, '签名阶段完成前 updater 必须保持关闭');
assert.equal(Object.hasOwn(updaterConfig, 'endpoints'), false, '关闭阶段不得配置 updater endpoint');
assert.equal(Object.hasOwn(updaterConfig, 'pubkey'), false, '关闭阶段不得配置 updater pubkey');

const cargoToml = readText('src-tauri/Cargo.toml');
assert.equal(cargoToml.includes('repository = "https://github.com/elio-zwd/pot-desktop"'), true, 'Cargo repository 不正确');
assert.equal(cargoToml.includes('description = "Pot 社区维护版"'), true, 'Cargo description 不正确');
assert.equal(cargoToml.includes('"updater"'), false, '关闭阶段 Cargo 不得启用 tauri/updater feature');

const updaterSource = readText('src-tauri/src/updater.rs');
assert.equal(updaterSource.includes('tauri::updater'), false, '关闭阶段 Rust 不得调用 Tauri updater');
assert.equal(updaterSource.includes('尚未配置自有更新通道'), true, '关闭阶段必须保留明确日志');

for (const relativePath of [
    'plans/CUSTOM_RELEASE_CHANNEL_PLAN.md',
    'tasks/CUSTOM_RELEASE_CHANNEL_TASKS.md',
    'handoffs/CUSTOM_RELEASE_CHANNEL_HANDOFF.md',
    'docs/RELEASE_NOTES_TEMPLATE.md',
    '.github/workflows/custom-release-check.yml',
    '.github/workflows/custom-release-windows.yml',
]) {
    assert.notEqual(readText(relativePath).trim(), '', `文件不能为空：${relativePath}`);
}

console.log(`维护版发布配置自检通过：${expected.version} / ${expected.identifier}`);
