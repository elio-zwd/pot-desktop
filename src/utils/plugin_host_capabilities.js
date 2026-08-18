export const PLUGIN_RESULT_SCHEMA_V2 = 'pot.plugin-result.v2';
export const PLUGIN_INVOKE_TRANSLATE_V1 = 'pot.plugin-invoke.translate.v1';
export const RESULT_STAGE_V1 = 'pot.result-stage.v1';

export function createPluginHostCapabilities() {
    return {
        name: 'pot-desktop',
        resultSchemas: [PLUGIN_RESULT_SCHEMA_V2],
        configSchemaVersion: 2,
        pluginApis: [PLUGIN_INVOKE_TRANSLATE_V1],
        resultStages: [RESULT_STAGE_V1],
    };
}
