"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const orbis_1 = require("./orbis");
const fs_1 = __importDefault(require("fs"));
const data_1 = require("./data");
const ethers_factory_1 = require("./ethers.factory");
const render_1 = require("./render");
const ipfsUrl = process.env.IPFS_URL || '';
// propose changes 
const proposeUpdate = () => {
};
const bulkrender = async () => {
    // can i go through mapping ? 
    // or through db? 
    const publication = '0x1e00a4d85cb0a58b48e3007f0e1d20b6621e78ed';
    const model = 'kjzl6hvfrbw6c9azzndholpflixynj59zr85g87quflikiem9mfeevnl2v0oz52';
    const context = 'kjzl6kcym7w8ya9eooishoahx3dehdyzticwolc95udtobxcnpk3m3zrpf5o4fa';
    const db_items = await (0, orbis_1.runQuery)(`SELECT * FROM ${model} WHERE publication = '${publication}'`, context);
    const configCid = await (0, ethers_factory_1.readConfig)(publication);
    const response = await fetch(`${ipfsUrl}/api/v0/cat?arg=${configCid}`, {
        method: 'POST',
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch config from IPFS: ${response.statusText}`);
    }
    const rawConfig = await response.json();
    // Ensure the response matches NPPublication interface
    const config = {
        assets: rawConfig.assets || '',
        assets_gateway: rawConfig.assets_gateway || '',
        contract: rawConfig.contract || publication,
        data_gateway: rawConfig.data_gateway || '',
        domains: Array.isArray(rawConfig.domains) ? rawConfig.domains : [],
        mapping: Array.isArray(rawConfig.mapping) ? rawConfig.mapping : [],
        name: rawConfig.name || '',
        owners: Array.isArray(rawConfig.owners) ? rawConfig.owners : [],
        rpc: rawConfig.rpc || '',
        stylesheets: rawConfig.stylesheets || '',
        table: rawConfig.table || { gateway: '', id: '' },
        template_cid: rawConfig.template_cid || '',
        templates: rawConfig.templates || ''
    };
    const mappingPath = path_1.default.join(__dirname, '../../mapping.json');
    const localMappings = JSON.parse(fs_1.default.readFileSync(mappingPath, 'utf-8'));
    for (const item of db_items) {
        let mapping = localMappings.find((m) => m.reference === item.post_type);
        if (!mapping) {
            mapping = localMappings.find((m) => {
                return m.collections?.some(collection => collection.value === item.post_type);
            });
        }
        if (!mapping) {
            console.warn(`No mapping found for post_type ${item.post_type}`);
            continue;
        }
        const templateData = await (0, data_1.getTemplateData)(item, config, mapping);
        console.log(templateData);
        const html = await (0, render_1.render)(mapping, config, templateData);
    }
    // create queue? 
    // filter
    // render 
};
bulkrender();
