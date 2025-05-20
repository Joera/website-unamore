"use strict";
(() => {
  // renderer/src/main.ts
  var main = async () => {
    try {
      console.log("in child");
      const result = {};
      console.log("result in child", result);
      LitActions.setResponse({ response: JSON.stringify({ success: true, html: result }) });
    } catch (error) {
      console.log("Error updating root:", error);
      LitActions.setResponse({ response: JSON.stringify({ error }) });
    }
  };
  main();
})();
