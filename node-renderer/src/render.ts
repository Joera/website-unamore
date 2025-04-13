import Handlebars from 'handlebars';
import { NPTemplate, NPPublication } from "./interfaces";
import { helpers } from "./handlebars-helpers";
import path from 'path';
import { decode } from 'html-entities';
import * as fs from 'fs/promises';

export const render = async (mapping: NPTemplate, config: NPPublication, templateData: any) => {
    
    try {
        await registerHelpers();
        await registerLocalPartials(); 

        const templatePath = path.join(__dirname, '../../templates', mapping.file);
        let source = await fs.readFile(templatePath, 'utf-8');

        // Clean up the template source
        source = decode(source); // Decode HTML entities
        source = source.replace(/\\n/g, '\n'); // Convert \n to actual newlines
        source = source.replace(/\\([^\\])/g, '$1'); // Remove single backslashes except double backslashes
        source = source.replace(/\n{2,}/g, '\n'); // Replace multiple newlines with single newline
        source = source.replace(/"\n\s*"/g, ''); // Remove quoted newlines with spaces
        source = source.replace(/^"/, '').replace(/"$/, ''); // Remove leading/trailing quotes
        
        // Remove unnecessary escaping in HTML attributes
        source = source.replace(/\\"/g, '"'); // Convert \" to "
        
        const templater = Handlebars.compile(source, {
            noEscape: true // Don't escape HTML entities in variables
        });

        const rendered = templater(templateData);
        
        // Clean up the rendered output
        return rendered
            .replace(/\n{2,}/g, '\n') // Replace multiple newlines with single newline
            .replace(/>\s+</g, '>\n<') // Add proper newlines between tags
            .trim(); // Remove leading/trailing whitespace

    } catch (error) {
        console.error('Error rendering template:', error);
        throw error;
    }
}


const registerHelpers = async () => {
        
    if(helpers) {
        helpers.forEach((helper: any) => {
            try {
                Handlebars.registerHelper(helper.name, helper.helper); // register helper
            }
            catch (error) {
                console.error("failed to register helper: " + helper.name);
            }
        });
    }
}

const registerLocalPartials = async (): Promise<void> => {
    try {   
        const partialsDir = path.join(__dirname, '../../templates/partials');
        const files = await fs.readdir(partialsDir);
        
        for (const file of files) {
            if (file.endsWith('.handlebars')) {
                const partialName = path.parse(file).name;
                const partialContent = await fs.readFile(
                    path.join(partialsDir, file),
                    'utf-8'
                );
                Handlebars.registerPartial(partialName, partialContent);
            }
        }
    } catch (error) {
        console.error('Error registering partials:', error);
        throw error;
    }
}
