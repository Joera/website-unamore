"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.render = void 0;
const handlebars_1 = __importDefault(require("handlebars"));
const handlebars_helpers_1 = require("./handlebars-helpers");
const path_1 = __importDefault(require("path"));
const html_entities_1 = require("html-entities");
const render = async (mapping, config, templateData) => {
    try {
        const response = await fetch(`https://ipfs.transport-union.dev/api/v0/dag/get?arg=${config.template_cid}`, {
            method: 'POST',
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch template listing: ${response.status} ${response.statusText}`);
        }
        const templateArray = await response.json();
        // console.log(templateArray);
        await registerHelpers();
        await registerPartials(templateArray.filter((t) => t.path.includes("partials/")));
        const templateFile = templateArray.find((t) => t.path.includes(mapping.file));
        if (!templateFile) {
            throw new Error(`Template file ${mapping.file} not found`);
        }
        const contentResponse = await fetch(`https://ipfs.transport-union.dev/api/v0/cat?arg=${templateFile.cid}`, {
            method: 'POST',
        });
        if (!contentResponse.ok) {
            throw new Error(`Failed to load template: ${contentResponse.status} ${contentResponse.statusText}`);
        }
        let source = await contentResponse.text();
        // Clean up the template source
        source = (0, html_entities_1.decode)(source); // Decode HTML entities
        source = source.replace(/\\n/g, '\n'); // Convert \n to actual newlines
        source = source.replace(/\\([^\\])/g, '$1'); // Remove single backslashes except double backslashes
        source = source.replace(/\n{2,}/g, '\n'); // Replace multiple newlines with single newline
        source = source.replace(/"\n\s*"/g, ''); // Remove quoted newlines with spaces
        source = source.replace(/^"/, '').replace(/"$/, ''); // Remove leading/trailing quotes
        // Remove unnecessary escaping in HTML attributes
        source = source.replace(/\\"/g, '"'); // Convert \" to "
        const templater = handlebars_1.default.compile(source, {
            noEscape: true // Don't escape HTML entities in variables
        });
        const rendered = templater(templateData);
        // Clean up the rendered output
        return rendered
            .replace(/\n{2,}/g, '\n') // Replace multiple newlines with single newline
            .replace(/>\s+</g, '>\n<') // Add proper newlines between tags
            .trim(); // Remove leading/trailing whitespace
    }
    catch (error) {
        console.error('Error rendering template:', error);
        throw error;
    }
};
exports.render = render;
const registerHelpers = async () => {
    if (handlebars_helpers_1.helpers) {
        handlebars_helpers_1.helpers.forEach((helper) => {
            try {
                handlebars_1.default.registerHelper(helper.name, helper.helper); // register helper
            }
            catch (error) {
                console.error("failed to register helper: " + helper.name);
            }
        });
    }
};
const registerPartials = async (partials) => {
    try {
        for (let item of partials) {
            const response = await fetch(`https://ipfs.transport-union.dev/api/v0/cat?arg=${item.cid}`, {
                method: 'POST',
            });
            if (!response.ok) {
                console.warn(`Failed to fetch partial ${item.path}: ${response.status} ${response.statusText}`);
                continue;
            }
            let source = await response.text();
            // Clean up the partial source
            source = (0, html_entities_1.decode)(source);
            source = source.replace(/\\n/g, '\n');
            source = source.replace(/\\([^\\])/g, '$1');
            source = source.replace(/\n{2,}/g, '\n');
            source = source.replace(/"\n\s*"/g, '');
            source = source.replace(/^"/, '').replace(/"$/, '');
            source = source.replace(/\\"/g, '"');
            const partialName = path_1.default.basename(item.path).split(".")[0];
            handlebars_1.default.registerPartial(partialName, source);
        }
    }
    catch (error) {
        console.error("Failed to register partials:", error);
        throw error; // Propagate error to main render function
    }
};
