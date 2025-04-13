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
exports.updateRootCid = exports.getRootCid = void 0;
exports.readConfig = readConfig;
const ethers = __importStar(require("ethers"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const abi_1 = require("./abi");
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '.env') });
async function readConfig(contractAddress) {
    // Setup ethers provider for Base Sepolia
    const provider = new ethers.JsonRpcProvider(`https://base-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`);
    // Verify contract exists
    const code = await provider.getCode(contractAddress);
    if (code === "0x") {
        throw new Error(`No contract found at address ${contractAddress}`);
    }
    console.log("Contract code exists at address");
    // Create contract instance
    const contract = new ethers.Contract(contractAddress, abi_1.publicationAbi, provider);
    try {
        console.log("Attempting to call config()...");
        // First try to get the function fragment
        const fragment = contract.interface.getFunction("getConfig");
        if (!fragment) {
            throw new Error("Failed to get function fragment");
        }
        console.log("Function signature:", fragment.format());
        // Call the config function
        const configCid = await contract.getConfig();
        console.log("Raw response:", configCid);
        if (!configCid || configCid === "0x") {
            throw new Error("Config returned empty value");
        }
        console.log("Retrieved config:", configCid);
        return configCid;
    }
    catch (error) {
        console.error("Error reading contract config:", error);
        throw error;
    }
}
const getRootCid = async (contractAddress) => {
    const provider = new ethers.JsonRpcProvider(`https://base-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`);
    if (!process.env.PRIVATE_KEY) {
        throw new Error("Private key not found in environment variables");
    }
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contract = new ethers.Contract(contractAddress, abi_1.publicationAbi, wallet);
    try {
        const fragment = contract.interface.getFunction("initUpdate");
        if (!fragment) {
            throw new Error("Failed to get function fragment");
        }
        // First initiate the update
        const tx = await contract.initUpdate();
        await tx.wait(); // Wait for the update to be confirmed
        // Now get the updated root CID
        return await contract.getHtmlRoot();
    }
    catch (error) {
        console.error("Error updating root CID:", error);
        throw error;
    }
};
exports.getRootCid = getRootCid;
const updateRootCid = async (cid, contractAddress) => {
    const provider = new ethers.JsonRpcProvider(`https://base-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`);
    if (!process.env.PRIVATE_KEY) {
        throw new Error("Private key not found in environment variables");
    }
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contract = new ethers.Contract(contractAddress, abi_1.publicationAbi, wallet);
    try {
        const tx = await contract.updateHtmlRoot(cid);
        await tx.wait();
        console.log("Successfully updated root CID");
        return true;
    }
    catch (error) {
        console.error("Error updating root CID:", error);
        throw error;
    }
};
exports.updateRootCid = updateRootCid;
