import express from 'express';
import path from 'path';
import { runQuery } from './orbis';
import fs from 'fs';
import { getTemplateData } from './data';
import { readConfig } from './ethers.factory';
import { NPPublication, NPTemplate } from './interfaces';
import { renderer } from './renderer';
import { store } from './store';
import { decrypt } from './decrypt';

const ipfsUrl = process.env.IPFS_URL || '';
const model = process.env.MODEL || '';
const context = process.env.CONTEXT || '';

const proposeUpdate = async (publication: string) => {
    
};


const render = async (stream_id?: string) => {
    
    const publication = '0xb5989E4445C9c6aD95dd7b9aF324c31a4A28a90C';
    const publicationName = 'unamore.--web.eth'
    const safeAddress = "0xd065d8C47994cAC57e49785aCEE04FcA495afac4";
   

    try {
       
        let query = `SELECT * FROM ${model} WHERE publications ? '${publicationName}'`;

        if (stream_id) {
            query += ` AND stream_id = '${stream_id}'`;
        } else {
            query += ` LIMIT 1`;
        }

        

        console.log(query);
        
        const db_items = await runQuery(query, context);

        // console.log(db_items)

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

        // console.log(pub_config)

        const mappingPath = path.join(__dirname, '../../mapping.json');
        const localMappings = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));

        // console.log(localMappings)
        
        for (const item of db_items) {

            // const requestedPostType = process.argv[2] || process.env.POST_TYPE;
            // if (requestedPostType && item.post_type !== requestedPostType) {
            //     continue;
            // }

            let mapping = localMappings.templateConfig.find((m: any) => m.reference === item.post_type);

            if (!mapping) {
                mapping = localMappings.find((m: NPTemplate) => {
                    return m.collections?.some(collection => collection.value === item.post_type);
                });
            }

            if (!mapping) {
                console.warn(`No mapping found for post_type ${item.post_type}`);
                continue;
            }

            console.log(item)

            const decrypted = await decrypt(item, publication, safeAddress);

            console.log(decrypted)

            const templateData = await getTemplateData(item, pub_config, mapping, model, context);
            // console.log(templateData);
            const html = await renderer(mapping, pub_config, templateData);
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
const sid = process.argv[2];
render(sid);
