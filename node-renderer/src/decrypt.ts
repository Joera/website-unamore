import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { LitNetwork, LIT_RPC, LitAbility } from "@lit-protocol/constants";
import type { DecryptRequest } from "@lit-protocol/types";

import { publicationAbi, publicationAbiStripped, safeAbi } from "./abi2";
import { createSessionSignatures } from "./session";
import { ethers } from "ethers";
import { createSiweMessageWithRecaps, generateAuthSig, LitAccessControlConditionResource, LitPKPResource } from "@lit-protocol/auth-helpers";

import dotenv from "dotenv";

dotenv.config()

const canRead = (stream_id: string, safeAddress: string, publicationAddress: string) => [
    {
        conditionType: "evmContract" as const,
        contractAddress: publicationAddress,
        functionName: "canPublish",
        functionParams: [safeAddress],
        functionAbi: publicationAbiStripped[0],
        chain: "baseSepolia" as const,
        returnValueTest: {
          key: "",
          comparator: "=" as const,  
          value: "true",
        }
    },
    {operator: "and"},
    {
        conditionType: "evmContract" as const,
        contractAddress: safeAddress,
        functionName: "isOwner",
        functionParams: [":userAddress"],
        functionAbi: safeAbi[0],
        chain: "baseSepolia" as const,
        returnValueTest: {
            key: "",
            comparator: "=" as const,
            value: "true",
        }
    },
    {operator: "and"},
    {
        conditionType: "evmContract" as const,
        contractAddress: publicationAddress,
        functionName: "hasDeal",
        functionParams: [stream_id], 
        functionAbi: publicationAbiStripped[1],
        chain: "baseSepolia" as const,
        returnValueTest: {
            key: "",
            comparator: "=" as const,
            value: "true",
        }
    }
]


async function getSessionSignatures(litNodeClient: any) {
    // Connect to the wallet
    const ethWallet = new ethers.Wallet(process.env.PRIVATE_KEY!);

    // Get the latest blockhash from the LitNodeClient
    const latestBlockhash = await litNodeClient.getLatestBlockhash();

    const uri = "https://soul2soul.io"
    const expiration = new Date(Date.now() + 1000 * 60).toISOString(); // 1 minute from now

    const resourceAbilityRequests = [
        {
            resource: new LitAccessControlConditionResource('*'),
            ability: LitAbility.AccessControlConditionDecryption,
        }
    ];

      // Create the SIWE message
      const toSign = await createSiweMessageWithRecaps({
        uri: uri,
        expiration: expiration,
        resources: resourceAbilityRequests,
        walletAddress: ethWallet.address,
        nonce: latestBlockhash,
        litNodeClient: litNodeClient,
      });

      // Generate the authSig
      const authSig = await generateAuthSig({
        signer: ethWallet,
        toSign,
      });

      return authSig;
    };




export const decrypt = async (
  body: any,
  publicationAddress: string,
  safeAddress: string,
): Promise<string | undefined> => {
  const { ciphertext, dataToEncryptHash } = JSON.parse(body.encrypted);
  const ucc = canRead(body.stream_id, safeAddress, publicationAddress);

  // Initialize Lit client
  const litNodeClient = new LitNodeClient({
    litNetwork: LitNetwork.Datil, 
  });
  
  await litNodeClient.connect();
  const authSig  = await getSessionSignatures(litNodeClient);

  console.log(ucc);
  console.log(authSig);

  try {
    const decryptionParams = {
      unifiedAccessControlConditions: ucc,
      ciphertext: ciphertext,
      dataToEncryptHash: dataToEncryptHash,
      authSig: authSig, // Required outside Lit Actions
      chain: "baseSepolia",
    };

    const decryptedData = await litNodeClient.decrypt(decryptionParams);
    
    // Convert Uint8Array to string if needed
    const decrypted = new TextDecoder().decode(decryptedData.decryptedData);
    
    await litNodeClient.disconnect();
    return decrypted;
  } catch (error) {
    console.error("WARNING: could not decrypt " + body.stream_id, error);
    await litNodeClient.disconnect();
    return undefined;
  }


};