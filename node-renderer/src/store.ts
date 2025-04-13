import { getRootCid, updateRootCid } from "./ethers.factory";
import { NPPublication, NPTemplate } from "./interfaces";
import fs from 'fs';
// import { getDag, uploadFile, updateDagAtPath, putDag } from "./ipfs.factory.js";

export const store = async ( body: any, mapping: NPTemplate, html: string) => {

    try {

        let path = body.language == 'nl' ? mapping.path: `/en${mapping.path}`;
        path = path.replace('{slug}', body.slug);

        const outputDir =  "../output";
        const outputPath = `${outputDir}/${path}/index.html`;
        await fs.promises.mkdir(`${outputDir}/${path}`, { recursive: true });
        await fs.promises.writeFile(outputPath, html, 'utf-8');

        console.log(`wrote to ${outputDir}${path}index.html`);

    } catch (error) {
        console.error(error);
    }
}