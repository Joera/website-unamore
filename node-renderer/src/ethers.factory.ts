import * as ethers from 'ethers';
import dotenv from 'dotenv';
import path from 'path';
import { publicationAbi } from './abi';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export async function readConfig(contractAddress: string): Promise<string> {
    // Setup ethers provider for Base Sepolia

    const provider = new ethers.JsonRpcProvider(`https://base-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`);
    
    // Verify contract exists
    const code = await provider.getCode(contractAddress);
    if (code === "0x") {
        throw new Error(`No contract found at address ${contractAddress}`);
    }
    
    console.log("Contract code exists at address");
    
    // Create contract instance
    const contract = new ethers.Contract(
        contractAddress,
        publicationAbi,
        provider
    );

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
    } catch (error) {
        console.error("Error reading contract config:", error);
        throw error;
    }
}

export const getRootCid = async (contractAddress: string) => {

    const provider = new ethers.JsonRpcProvider(`https://base-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`);

    if (!process.env.PRIVATE_KEY) {
        throw new Error("Private key not found in environment variables");
    }
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    const contract = new ethers.Contract(
        contractAddress,
        publicationAbi,
        wallet
    );

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
        
    } catch (error) {
        console.error("Error updating root CID:", error);
        throw error;
    }
}

export const updateRootCid = async (cid: string, contractAddress: string) => {

    const provider = new ethers.JsonRpcProvider(`https://base-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`);

    if (!process.env.PRIVATE_KEY) {
        throw new Error("Private key not found in environment variables");
    }
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    const contract = new ethers.Contract(
        contractAddress,
        publicationAbi,
        wallet
    );

    try {
        const tx = await contract.updateHtmlRoot(cid);
        await tx.wait();
        console.log("Successfully updated root CID");
        return true;
        
    } catch (error) {
        console.error("Error updating root CID:", error);
        throw error;
    }
}