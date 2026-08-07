export const PLUGIN_RESULT_SCHEMA_V2 = 'pot.plugin-result.v2';

export function createPluginHostCapabilities() {
    return {
        name: 'pot-desktop',
        resultSchemas: [PLUGIN_RESULT_SCHEMA_V2],
        configSchemaVersion: 2,
    };
}
