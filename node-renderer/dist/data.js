"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTemplateData = void 0;
const orbis_1 = require("./orbis");
const model = process.env.MODEL || '';
const context = process.env.CONTEXT || '';
const getTemplateData = async (body, config, mapping) => {
    try {
        let collections = {};
        for (const collection of mapping.collections) {
            try {
                if (collection.source === 'orbisdb') {
                    let query = collection
                        .query.replace("{{table}}", model)
                        .replace("{{key}}", collection.key)
                        .replace("{{value}}", collection.value)
                        .replace("{{lang}}", body.language);
                    const results = await (0, orbis_1.runQuery)(query, context);
                    if (!results) {
                        console.warn(`No results found for collection ${collection.key}`);
                        continue;
                    }
                    for (let result of results) {
                        try {
                            if (result.custom) {
                                const custom = JSON.parse(result.custom);
                                for (const [key, value] of Object.entries(custom)) {
                                    result[key] = value;
                                }
                            }
                        }
                        catch (parseError) {
                            console.error(`Error parsing custom data for result in collection ${collection.key}:`, parseError);
                            // Continue with the next result
                            continue;
                        }
                    }
                    collections[collection.key] = results;
                }
            }
            catch (collectionError) {
                console.error(`Error processing collection ${collection.key}:`, collectionError);
                // Continue with the next collection
                continue;
            }
        }
        return {
            ...body,
            ...collections
        };
    }
    catch (error) {
        console.error('Error in getTemplateData:', error);
        throw error;
    }
};
exports.getTemplateData = getTemplateData;
