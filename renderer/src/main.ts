import { renderHTML } from "./html.ctrlr";

declare global {
    const config: any;
    const templateConfig: any;
    const templateData: any;
    const LitActions: any;

}

const main = async () => {

    try {

        console.log("in child");
        const result = {}; // await renderHTML(config, templateConfig, templateData);
        console.log("result in child", result);
        LitActions.setResponse({ response: JSON.stringify({ success: true, html: result  }) });

    } catch (error) {

        console.log("Error updating root:", error);
        LitActions.setResponse({ response: JSON.stringify({ error  }) });
    }
}
main();