import { AuthSig } from "@lit-protocol/types";
import { template } from "handlebars";
import { renderHTML } from "./html.ctrlr";

export interface ILitActionContext {
    authSig: AuthSig;
    ipfsId: string;
    pkp: {
        tokenId: string;
    }
}

const main = async () => {

    try {

        const result = await renderHTML(config, templateConfig, templateData)
        LitActions.setResponse({ response: JSON.stringify({ success: true, html: result  }) });

    } catch (error) {

        console.log("Error updating root:", error);
        LitActions.setResponse({ response: JSON.stringify({ error  }) });
    }
}
main();