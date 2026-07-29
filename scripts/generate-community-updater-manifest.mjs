import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repository = Object.freeze({
    owner: 'elio-zwd',
    name: 'pot-desktop',
});

const communityVersionPattern = /^\d+\.\d+\.\d+-elio\.\d+$/;

function requireText(value, fieldName) {
    assert.equal(typeof value, 'string', `${fieldName} 必须是字符串`);
    const normalized = value.trim();
    assert.notEqual(normalized, '', `${fieldName} 不能为空`);
    return normalized;
}

function validateArtifactUrl(rawUrl, tag) {
    const artifactUrl = new URL(requireText(rawUrl, 'artifactUrl'));
    assert.equal(artifactUrl.protocol, 'https:', 'artifactUrl 必须使用 HTTPS');
    assert.equal(artifactUrl.hostname, 'github.com', 'artifactUrl 必须托管在 github.com');

    const expectedPrefix = `/${repository.owner}/${repository.name}/releases/download/${tag}/`;
    assert.equal(
        artifactUrl.pathname.startsWith(expectedPrefix),
        true,
        `artifactUrl 必须位于 ${repository.owner}/${repository.name} 的 ${tag} Release`
    );
    assert.equal(artifactUrl.pathname.endsWith('.nsis.zip'), true, 'Windows updater artifact 必须是 .nsis.zip');
    return artifactUrl.toString();
}

function validatePubDate(rawPubDate) {
    const pubDate = requireText(rawPubDate, 'pubDate');
    const timestamp = Date.parse(pubDate);
    assert.equal(Number.isNaN(timestamp), false, 'pubDate 必须是有效日期');
    return new Date(timestamp).toISOString();
}

export function buildCommunityUpdaterManifest({
    version,
    tag,
    artifactUrl,
    signature,
    notes = '',
    pubDate = new Date().toISOString(),
}) {
    const normalizedVersion = requireText(version, 'version');
    assert.match(normalizedVersion, communityVersionPattern, 'version 必须使用 x.y.z-elio.n 格式');

    const normalizedTag = requireText(tag, 'tag');
    assert.equal(normalizedTag, `v${normalizedVersion}`, 'tag 必须等于 v + version');

    const normalizedSignature = requireText(signature, 'signature');
    const normalizedArtifactUrl = validateArtifactUrl(artifactUrl, normalizedTag);
    const normalizedPubDate = validatePubDate(pubDate);

    return {
        version: normalizedVersion,
        notes: typeof notes === 'string' ? notes.trim() : '',
        pub_date: normalizedPubDate,
        platforms: {
            'windows-x86_64': {
                signature: normalizedSignature,
                url: normalizedArtifactUrl,
            },
        },
    };
}

export function writeCommunityUpdaterManifest(options, outputPath) {
    const normalizedOutputPath = resolve(requireText(outputPath, 'outputPath'));
    const manifest = buildCommunityUpdaterManifest(options);
    mkdirSync(dirname(normalizedOutputPath), { recursive: true });
    writeFileSync(normalizedOutputPath, `${JSON.stringify(manifest, null, 4)}\n`, 'utf8');
    return manifest;
}

function parseArguments(argv) {
    const options = {};
    for (let index = 0; index < argv.length; index += 1) {
        const argument = argv[index];
        assert.equal(argument.startsWith('--'), true, `未知参数：${argument}`);
        const key = argument.slice(2);
        const value = argv[index + 1];
        assert.equal(value !== undefined && !value.startsWith('--'), true, `参数 --${key} 缺少值`);
        options[key] = value;
        index += 1;
    }
    return options;
}

function runCli() {
    const args = parseArguments(process.argv.slice(2));
    const signature = readFileSync(resolve(requireText(args['signature-file'], 'signature-file')), 'utf8');
    const notes = args['notes-file']
        ? readFileSync(resolve(args['notes-file']), 'utf8')
        : (args.notes ?? '');

    writeCommunityUpdaterManifest(
        {
            version: args.version,
            tag: args.tag,
            artifactUrl: args.url,
            signature,
            notes,
            pubDate: args['pub-date'] ?? new Date().toISOString(),
        },
        args.output ?? 'latest.json'
    );

    console.log(`已生成维护版更新清单：${resolve(args.output ?? 'latest.json')}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    runCli();
}
