import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { LIT_ABILITY, LIT_NETWORK, LIT_RPC } from "@lit-protocol/constants";
import * as ethers from "ethers";
import 'dotenv/config';
import { LitContracts } from "@lit-protocol/contracts-sdk";
import { LitPKPResource, LitActionResource, createSiweMessageWithRecaps, generateAuthSig } from "@lit-protocol/auth-helpers";
import { uploadToPinata } from './pinata';
import { clearFolder} from './fs';
import { downloadHTML} from './ipfs';

const MAIN_ACTION_HASH = "QmeZ5WL8XRcX3B4FoEPGHBaQfXktggtkabVAVzZ9FnDChB";
const STREAM_ID = 'kjzl6kcym7w8y7mamk4c4xdbnn4y963xih6fbe1blmw1ac20ac4rtbakp24psou'
const publication = "unamore.--web.eth";
const safeAddress = "0xd065d8C47994cAC57e49785aCEE04FcA495afac4";

const epk = process.env.PRIVATE_KEY_UNAMORE || process.env.PRIVATE_KEY || "";
const SELECTED_LIT_NETWORK = LIT_NETWORK.Datil;

const main = async () => {

    let render_action = await uploadToPinata('./renderer/dist/main.js');

    console.log("Main Action CID:", render_action.IpfsHash);

    const litNodeClient = new LitNodeClient({
        litNetwork: SELECTED_LIT_NETWORK,
        debug: false
    });

    await litNodeClient.connect();
    const ethersWallet = new ethers.Wallet(
        epk,
        new ethers.providers.JsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE)
    );

    let capacityTokenId: string = "";
    if (!process.env.CAPACITY_TOKEN_ID) {

        const litContracts = new LitContracts({
            signer: ethersWallet,
            network: SELECTED_LIT_NETWORK,
        });
        await litContracts.connect();

        capacityTokenId = (
            await litContracts.mintCapacityCreditsNFT({
            requestsPerKilosecond: 10,
            daysUntilUTCMidnightExpiration: 1,
            })
        ).capacityTokenIdStr;

        console.log("Capacity token ID:", capacityTokenId);

    } else {
        capacityTokenId = process.env.CAPACITY_TOKEN_ID!;
    }

    const { capacityDelegationAuthSig } =
        await litNodeClient.createCapacityDelegationAuthSig({
        dAppOwnerWallet: ethersWallet,
        capacityTokenId,
        delegateeAddresses: [ethersWallet.address],
        uses: "1",
        });

    const sessionSignatures: any = await litNodeClient.getSessionSigs({    
        chain: "yellowstone",
        capabilityAuthSigs: [capacityDelegationAuthSig],
        expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 24 hours
        resourceAbilityRequests: [
            {
            resource: new LitPKPResource("*"),
            ability: LIT_ABILITY.PKPSigning,
            },
            {
            resource: new LitActionResource("*"),
            ability: LIT_ABILITY.LitActionExecution,
            },
        ],
        authNeededCallback: async ({
            resourceAbilityRequests,
            expiration,
            uri,
        }) => {
            const toSign = await createSiweMessageWithRecaps({
            uri: uri!,
            expiration: expiration!,
            resources: resourceAbilityRequests!,
            walletAddress: ethersWallet.address,
            nonce: await litNodeClient.getLatestBlockhash(),
            litNodeClient,
            });

            return await generateAuthSig({
            signer: ethersWallet,
            toSign,
            });
        },
    });

    // console.log(1);
    // console.log(MAIN_ACTION_HASH);
    // console.log(sessionSignatures);

    console.log(render_action.IpfsHash);

    try {

        const action: any = await litNodeClient.executeJs({
            sessionSigs: sessionSignatures,
            ipfsId: MAIN_ACTION_HASH,
            jsParams: { 
                safeAddress,
                publication, 
                stream_id: STREAM_ID,
                publish: false
            } 
        });


        console.log(action.logs);

        const response = JSON.parse(action.response);



        if(response.rootCid) {

            const folder = './html'
            clearFolder(folder);
            await downloadHTML(response.rootCid, folder);

        }


    } catch (error) {   
        console.error("Error deploying action:", error);
    }



}

main();
