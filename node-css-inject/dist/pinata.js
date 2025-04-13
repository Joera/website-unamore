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
exports.PinataService = void 0;
const pinata_factory_js_1 = require("./pinata.factory.js");
const fs = __importStar(require("fs"));
const https = __importStar(require("https"));
const http = __importStar(require("http"));
const path = __importStar(require("path"));
const pinata_web3_1 = require("pinata-web3");
const cid_1 = require("multiformats/cid");
const pinataJwt = process.env.PINATA_JWT;
const assetsGateway = process.env.ASSETS_GATEWAY;
class PinataService {
    constructor() {
        this.uploadFileFromPath = async (filePath, onlyHash = false) => {
            if (onlyHash) {
                const hash = await (0, pinata_factory_js_1.calculateIPFSHash)(filePath);
                const v0 = cid_1.CID.parse(hash);
                return v0.toV1().toString();
            }
            const fileName = path.basename(filePath);
            const fileExt = path.extname(filePath).toLowerCase();
            // console.log("fileName", fileName);
            let contentType = 'text/plain';
            switch (fileExt) {
                case '.css':
                    contentType = 'text/css';
                    break;
                case '.jpg':
                case '.jpeg':
                    contentType = 'image/jpeg';
                    break;
                case '.png':
                    contentType = 'image/png';
                    break;
                case '.gif':
                    contentType = 'image/gif';
                    break;
            }
            // console.log("contentType", contentType);
            try {
                const blob = new Blob([fs.readFileSync(filePath)]);
                const file = new File([blob], fileName, { type: contentType });
                const upload = await this.pinata.upload.file(file);
                return upload.IpfsHash;
            }
            catch (error) {
                console.log(error);
                return "QmUrU11u74YrLbj9d1Z9JvPPZ2nXmgMVTgh2ZvjrTUc4ZQ";
            }
        };
        this.pinata = new pinata_web3_1.PinataSDK({
            pinataJwt: pinataJwt,
            pinataGateway: assetsGateway
        });
    }
    async fetchUrl(url) {
        return new Promise((resolve, reject) => {
            const protocol = url.startsWith('https:') ? https : http;
            // For GitHub CSS files, we need to set proper headers
            const options = {};
            if (url.includes('raw.githubusercontent.com') && url.endsWith('.css')) {
                options.headers = {
                    'Accept': 'text/css,*/*;q=0.1', // Prefer CSS content type
                    'User-Agent': 'Mozilla/5.0' // GitHub requires a user agent
                };
            }
            const request = protocol.get(url, options, (response) => {
                const contentType = response.headers['content-type'];
                const chunks = [];
                response.on('data', (chunk) => {
                    chunks.push(chunk);
                });
                response.on('end', () => {
                    const data = Buffer.concat(chunks);
                    // For GitHub raw content, if it's a CSS file but served as text/plain,
                    // override the content type
                    let finalContentType = contentType;
                    if (url.includes('raw.githubusercontent.com') &&
                        url.endsWith('.css') &&
                        contentType?.includes('text/plain')) {
                        finalContentType = 'text/css';
                    }
                    resolve({ data, contentType: finalContentType });
                });
                response.on('error', (error) => {
                    reject(error);
                });
            });
            request.on('error', (error) => {
                reject(error);
            });
            // Add timeout to prevent hanging
            request.setTimeout(30000, () => {
                request.destroy();
                reject(new Error('Request timed out after 30 seconds'));
            });
        });
    }
    getContentType(fileExt, mimeType) {
        // Get content type based on file extension
        const getExtensionType = (ext) => {
            switch (ext.toLowerCase()) {
                case '.css':
                    return 'text/css';
                case '.jpg':
                case '.jpeg':
                    return 'image/jpeg';
                case '.png':
                    return 'image/png';
                case '.gif':
                    return 'image/gif';
                case '.svg':
                    return 'image/svg+xml';
                case '.webp':
                    return 'image/webp';
                case '.html':
                    return 'text/html';
                case '.js':
                    return 'application/javascript';
                case '.json':
                    return 'application/json';
                case '.txt':
                    return 'text/plain';
                default:
                    return 'application/octet-stream';
            }
        };
        const extensionType = getExtensionType(fileExt);
        // If we have a file extension type, use that instead of mimeType
        if (extensionType !== 'application/octet-stream') {
            return extensionType;
        }
        // If no specific extension type, fallback to mimeType or default
        return mimeType || 'application/octet-stream';
    }
    async uploadFileFromUrl(url, onlyHash = false) {
        try {
            const { data, contentType: responseMimeType } = await this.fetchUrl(url);
            console.log("responseMimeType:", responseMimeType);
            const fileName = path.basename(url);
            const fileExt = path.extname(url).toLowerCase();
            console.log("fileExt:", fileExt);
            const contentType = this.getContentType(fileExt, responseMimeType);
            if (onlyHash) {
                // console.log("onlyHash data length:", data.length);
                const hash = await (0, pinata_factory_js_1.calculateIPFSHashFromContent)(data, fileName, contentType);
                const v0 = cid_1.CID.parse(hash);
                return v0.toV1().toString();
            }
            console.log("uploading with contentType:", contentType);
            // console.log("upload data length:", data.length);
            const file = new File([data], fileName, { type: contentType });
            // console.log("upload file size:", file.size);
            const upload = await this.pinata.upload.file(file);
            console.log("cid from upload:", upload.IpfsHash);
            return upload.IpfsHash;
        }
        catch (error) {
            console.error('Error uploading file from URL:', error);
            throw error; // Better to throw than return a hardcoded CID
        }
    }
    async uploadFileFromContent(filePath, data, onlyHash = false) {
        try {
            if (onlyHash) {
                console.log("onlyHash data length:", data.length);
                const hash = await (0, pinata_factory_js_1.calculateIPFSHashFromContent)(data);
                const v0 = cid_1.CID.parse(hash);
                return v0.toV1().toString();
            }
            console.log("upload data length:", data.length);
            const fileName = path.basename(filePath);
            const fileExt = path.extname(fileName).toLowerCase();
            const contentType = this.getContentType(fileExt);
            console.log("contentType before upload:", contentType);
            const file = new File([data], fileName, { type: contentType });
            console.log("upload file size:", file.size);
            const upload = await this.pinata.upload.file(file);
            return upload.IpfsHash;
        }
        catch (error) {
            console.error('Error uploading file from content:', error);
            throw error; // Better to throw than return a hardcoded CID
        }
    }
}
exports.PinataService = PinataService;
