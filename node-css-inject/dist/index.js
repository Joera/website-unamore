"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
const pinata_js_1 = require("./pinata.js");
// Load environment variables from .env file
dotenv.config();
const assets_gateway = process.env.ASSETS_GATEWAY;
async function injectCSS() {
    try {
        const pinataService = new pinata_js_1.PinataService();
        const cssPath = path.join(__dirname, './css/styles.css');
        const newCid = await pinataService.uploadFileFromPath(cssPath);
        const templatePath = path.join(__dirname, '../../templates/partials/head.handlebars');
        // Read the current content of head.handlebars
        const templateContent = await fs.readFile(templatePath, 'utf-8');
        // Find and replace the stylesheet link
        const styleRegex = /<link[^>]*rel="stylesheet"[^>]*>/;
        const newStyleLink = `<link rel="stylesheet" href="${assets_gateway}/ipfs/${newCid}?filename=styles.css">`;
        console.log("newStyleLink", newStyleLink);
        // Create the modified content
        const updatedContent = templateContent.replace(styleRegex, newStyleLink);
        // Write the modified content back to the file
        await fs.writeFile(templatePath, updatedContent, 'utf-8');
        console.log('Successfully updated head.handlebars with new stylesheet link');
        return newStyleLink;
    }
    catch (error) {
        console.error('Error during CSS injection:', error);
        throw error;
    }
}
injectCSS()
    .then(result => console.log('Injected style link:', result))
    .catch(error => console.error('Failed to inject CSS:', error));
