import express from 'express';
import path from 'path';
import { runQuery } from './orbis';
import fs from 'fs';
import { getTemplateData } from './data';
import { readConfig } from './ethers.factory';
import { NPPublication, NPTemplate } from './interfaces';
import { render } from './render';
import { store } from './store';

const ipfsUrl = process.env.IPFS_URL || '';
const model = process.env.MODEL || '';
const context = process.env.CONTEXT || '';

const proposeUpdate = async (publication: string) => {
    
};


const bulkrender = async (post_type?: string) => {
    
    const publication = '0x1e00a4d85cb0a58b48e3007f0e1d20b6621e78ed';
   

    try {
       
        let query = `SELECT * FROM ${model} WHERE publication = '${publication}'`;

        if (post_type) {
            query += ` AND post_type = '${post_type}'`;
        }

        console.log(query);
        
        const db_items = await runQuery(query, context);

        const configCid = await readConfig(publication);
        const response = await fetch(`${ipfsUrl}/api/v0/cat?arg=${configCid}`, {
            method: 'POST',
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch config from IPFS: ${response.statusText}`);
        }

        const rawConfig: any = await response.json();
        
        // Ensure the response matches NPPublication interface
        const pub_config: NPPublication = {
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

        const mappingPath = path.join(__dirname, '../../mapping.json');
        const localMappings = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
        
        for (const item of db_items) {

            // console.log(item);

            // Filter by post type if specified
            const requestedPostType = process.argv[2] || process.env.POST_TYPE;
            if (requestedPostType && item.post_type !== requestedPostType) {
                continue;
            }

            let mapping = localMappings.find((m: any) => m.reference === item.post_type);

            if (!mapping) {
                mapping = localMappings.find((m: NPTemplate) => {
                    return m.collections?.some(collection => collection.value === item.post_type);
                });
            }

            if (!mapping) {
                console.warn(`No mapping found for post_type ${item.post_type}`);
                continue;
            }

            const templateData = await getTemplateData(item, pub_config, mapping, model, context);

             console.log(templateData);

            const html = await render(mapping, pub_config, templateData);
            
            await store(item, mapping, html);


        }

        // create queue? 

        // filter

        // render 
    } catch (error) {
        console.error(error);
    }
}

// Get post_type from command line arguments
const post_type = process.argv[2];
bulkrender(post_type);
