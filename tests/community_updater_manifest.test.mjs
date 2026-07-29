import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
    buildCommunityUpdaterManifest,
    writeCommunityUpdaterManifest,
} from '../scripts/generate-community-updater-manifest.mjs';

const validInput = Object.freeze({
    version: '3.1.0-elio.1',
    tag: 'v3.1.0-elio.1',
    artifactUrl:
        'https://github.com/elio-zwd/pot-desktop/releases/download/v3.1.0-elio.1/pot-community_3.1.0-elio.1_windows-x64-setup.nsis.zip',
    signature: 'untrusted comment: test fixture only\nfixture-signature',
    notes: '测试版本，不用于真实发布。',
    pubDate: '2026-07-29T00:00:00Z',
});

test('生成仅包含 Windows x64 的维护版更新清单', () => {
    const manifest = buildCommunityUpdaterManifest(validInput);

    assert.deepEqual(Object.keys(manifest.platforms), ['windows-x86_64']);
    assert.equal(manifest.version, '3.1.0-elio.1');
    assert.equal(manifest.pub_date, '2026-07-29T00:00:00.000Z');
    assert.equal(manifest.platforms['windows-x86_64'].signature, validInput.signature);
    assert.equal(manifest.platforms['windows-x86_64'].url, validInput.artifactUrl);
});

test('写入格式化 JSON 并保留结尾换行', () => {
    const directory = mkdtempSync(join(tmpdir(), 'pot-community-manifest-'));
    const outputPath = join(directory, 'latest.json');

    try {
        writeCommunityUpdaterManifest(validInput, outputPath);
        const content = readFileSync(outputPath, 'utf8');
        assert.equal(content.endsWith('\n'), true);
        assert.deepEqual(JSON.parse(content), buildCommunityUpdaterManifest(validInput));
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
});

test('拒绝非维护版 semver', () => {
    assert.throws(
        () => buildCommunityUpdaterManifest({ ...validInput, version: '3.1.0' }),
        /x\.y\.z-elio\.n/
    );
});

test('拒绝与版本不一致的 tag', () => {
    assert.throws(
        () => buildCommunityUpdaterManifest({ ...validInput, tag: 'v3.1.0-elio.2' }),
        /tag 必须等于/
    );
});

test('拒绝其他仓库和非 HTTPS artifact URL', () => {
    assert.throws(
        () =>
            buildCommunityUpdaterManifest({
                ...validInput,
                artifactUrl:
                    'https://github.com/pot-app/pot-desktop/releases/download/v3.1.0-elio.1/pot.nsis.zip',
            }),
        /必须位于 elio-zwd\/pot-desktop/
    );

    assert.throws(
        () =>
            buildCommunityUpdaterManifest({
                ...validInput,
                artifactUrl: validInput.artifactUrl.replace('https://', 'http://'),
            }),
        /必须使用 HTTPS/
    );
});

test('拒绝空签名和非 NSIS updater bundle', () => {
    assert.throws(
        () => buildCommunityUpdaterManifest({ ...validInput, signature: '   ' }),
        /signature 不能为空/
    );

    assert.throws(
        () =>
            buildCommunityUpdaterManifest({
                ...validInput,
                artifactUrl: validInput.artifactUrl.replace('.nsis.zip', '-setup.exe'),
            }),
        /必须是 \.nsis\.zip/
    );
});
