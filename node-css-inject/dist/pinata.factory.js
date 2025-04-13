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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateIPFSHashFromContent = exports.calculateIPFSHash = void 0;
const fs = __importStar(require("fs"));
//@ts-ignore
const electron_1 = __importDefault(require("electron"));
const net = electron_1.default.remote.net;
const ipfs_unixfs_importer_1 = require("ipfs-unixfs-importer");
const memory_1 = require("blockstore-core/memory");
// Function to calculate IPFS hash locally
const calculateIPFSHash = async (filePath) => {
    return new Promise(async (resolve, reject) => {
        try {
            const fileStream = fs.createReadStream(filePath);
            const chunks = [];
            for await (const chunk of fileStream) {
                chunks.push(chunk);
            }
            const content = Buffer.concat(chunks);
            const blockstore = new memory_1.MemoryBlockstore();
            let cid = null;
            for await (const { cid: entry } of (0, ipfs_unixfs_importer_1.importer)([{ content }], blockstore)) {
                cid = entry;
            }
            if (!cid) {
                reject(new Error('Failed to generate IPFS hash - no CID was created'));
                return;
            }
            resolve(cid.toString());
        }
        catch (error) {
            reject(error);
        }
    });
};
exports.calculateIPFSHash = calculateIPFSHash;
const calculateIPFSHashFromContent = async (content, fileName, contentType = 'application/octet-stream') => {
    return new Promise(async (resolve, reject) => {
        try {
            const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
            const blocks = new memory_1.MemoryBlockstore();
            let lastCid;
            for await (const { cid } of (0, ipfs_unixfs_importer_1.importer)([{ content: buffer }], blocks)) {
                lastCid = cid;
            }
            if (!lastCid) {
                reject(new Error('Failed to generate IPFS hash'));
                return;
            }
            resolve(lastCid.toString());
        }
        catch (error) {
            reject(error);
        }
    });
};
exports.calculateIPFSHashFromContent = calculateIPFSHashFromContent;
