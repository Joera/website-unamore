import { helpers } from "./handlebars-helpers";
import { decode } from "html-entities";

interface TemplateData {
  [key: string]: any;
}

interface Partial {
  path: string;
  cid: string;
}

// Get value from templateData using dot notation and array access
const getNestedValue = (path: string, data: TemplateData): any => {
  if (!data) return undefined;

  // Handle array access with dot notation: path.to.[0].property
  const parts = path.split(".");
  const result = parts.reduce((obj, key) => {
    if (!obj) return undefined;

    // Handle array index access: [0]
    if (key.startsWith("[") && key.endsWith("]")) {
      const index = parseInt(key.slice(1, -1));
      return Array.isArray(obj) ? obj[index] : undefined;
    }

    return obj[key];
  }, data);

  return result;
};

// Get value from context, handling special variables and this
const getContextValue = (path: string, context: TemplateData): any => {
  const trimmedPath = path.trim();

  // Handle special variables
  if (trimmedPath === "@root") return context;
  if (
    trimmedPath === "@first" ||
    trimmedPath === "@last" ||
    trimmedPath === "@index"
  ) {
    return context[trimmedPath];
  }

  // Handle this keyword
  if (trimmedPath === "this") {
    const thisValue = context.this || context;
    console.log("Resolving 'this' to:", thisValue);
    return thisValue;
  }

  // Handle parent context traversal (../)
  if (trimmedPath.startsWith("../")) {
    console.log("Resolving parent path:", trimmedPath, "in context with keys:", Object.keys(context));
    let currentContext = context;
    let remainingPath = trimmedPath;
    
    // Count how many levels up we need to go
    while (remainingPath.startsWith("../")) {
      remainingPath = remainingPath.slice(3); // Remove "../"
      console.log("Going up one level, remaining path:", remainingPath);
      if (currentContext.parentContext) {
        currentContext = currentContext.parentContext;
        console.log("New context keys:", Object.keys(currentContext));
      } else {
        console.log("No parent context available");
        // If no parent context available, return undefined
        return undefined;
      }
    }
    
    // Now resolve the remaining path in the parent context
    if (remainingPath === "") {
      console.log("Returning parent context:", currentContext);
      return currentContext;
    } else {
      const result = getContextValue(remainingPath, currentContext);
      console.log(`Resolved ${remainingPath} in parent context to:`, result);
      return result;
    }
  }

  // Try getting from this first if it exists
  if (context.this && typeof context.this === "object") {
    const fromThis = getNestedValue(trimmedPath, context.this);
    if (fromThis !== undefined) {
      return fromThis;
    }
  }

  // Fall back to root context
  return getNestedValue(trimmedPath, context);
};

// Process variables in the template
const processVariables = (text: string, context: TemplateData): string => {
  if (!text.includes("{{")) return text;

  let result = text;

  // Handle triple braces first (unescaped HTML)
  const triplePattern = /{{{([^}]+)}}}/g;
  result = result.replace(triplePattern, (match, path) => {
    const value = getContextValue(path.trim(), context);
    return value !== undefined ? String(value) : "";
  });

  // Then handle double braces (escaped)
  const doublePattern = /{{([^#/>][^}]*)}}/g;
  result = result.replace(doublePattern, (match, path) => {
    const value = getContextValue(path.trim(), context);
    return value !== undefined ? escapeHtml(String(value)) : "";
  });

  return result;
};

// Process block helpers like {{#if}}, {{#each}}, etc.
const processBlockHelpers = (text: string, context: TemplateData): string => {
  // Skip if no block helpers
  if (!text.includes("{{#")) return text;

  let result = text;

  // Process if blocks with proper nesting support
  result = processIfBlocks(result, context);

  // Process with blocks using proper parser for nested blocks
  result = processWithBlocks(result, context);

  // Process each blocks with proper nesting support
  result = processEachBlocks(result, context);

  return result;
};

// Process nested if blocks properly
const processIfBlocks = (text: string, context: TemplateData): string => {
  let result = text;
  let changed = true;
  
  while (changed) {
    changed = false;
    const regex = /{{#if\s+([^}]+)}}/g;
    let match;
    
    while ((match = regex.exec(result)) !== null) {
      const startPos = match.index;
      const condition = match[1].trim();
      
      // Find the matching {{/if}} by counting nested blocks
      let depth = 1;
      let pos = match.index + match[0].length;
      let endPos = -1;
      let elsePos = -1;
      
      while (pos < result.length && depth > 0) {
        const remainingText = result.substring(pos);
        const openMatch = remainingText.match(/{{#if\s/);
        const closeMatch = remainingText.match(/{{\/if}}/);
        const elseMatch = remainingText.match(/{{else}}/);
        
        let nextOpen = openMatch ? pos + remainingText.indexOf(openMatch[0]) : Infinity;
        let nextClose = closeMatch ? pos + remainingText.indexOf(closeMatch[0]) : Infinity;
        let nextElse = elseMatch && depth === 1 && elsePos === -1 ? pos + remainingText.indexOf(elseMatch[0]) : Infinity;
        
        if (nextElse < nextOpen && nextElse < nextClose) {
          elsePos = nextElse;
          pos = nextElse + 8; // length of "{{else}}"
        } else if (nextClose < nextOpen) {
          depth--;
          if (depth === 0) {
            endPos = nextClose;
            break;
          }
          pos = nextClose + 7; // length of "{{/if}}"
        } else if (nextOpen < Infinity) {
          depth++;
          pos = nextOpen + 5; // length of "{{#if"
        } else {
          break;
        }
      }
      
      if (endPos !== -1) {
        const contentStart = startPos + match[0].length;
        const content = elsePos !== -1 
          ? result.substring(contentStart, elsePos)
          : result.substring(contentStart, endPos);
        const elseContent = elsePos !== -1 
          ? result.substring(elsePos + 8, endPos)
          : "";
        const fullMatch = result.substring(startPos, endPos + 7);
        
        try {
          // Handle eq helper in if blocks
          if (condition.startsWith("(eq ")) {
            const argsStr = condition.slice(4, -1).trim();
            const args = argsStr.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];

            if (args.length === 2) {
              const [arg1, arg2] = args;
              const val1 = arg1.startsWith('"')
                ? arg1.slice(1, -1)
                : arg1.startsWith("'")
                  ? arg1.slice(1, -1)
                  : getContextValue(arg1, context);
              const val2 = arg2.startsWith('"')
                ? arg2.slice(1, -1)
                : arg2.startsWith("'")
                  ? arg2.slice(1, -1)
                  : getContextValue(arg2, context);

              // Create context with parent reference for nested blocks
              const ifContext = { ...context, parentContext: context };
              const processedContent = val1 === val2
                ? processTemplate(content, ifContext)
                : elseContent
                  ? processTemplate(elseContent, ifContext)
                  : "";
              result = result.replace(fullMatch, processedContent);
            }
          } else {
            // Handle regular conditions
            const value = getContextValue(condition, context);
            // Create context with parent reference for nested blocks
            const ifContext = { ...context, parentContext: context };
            const processedContent = value
              ? processTemplate(content, ifContext)
              : elseContent
                ? processTemplate(elseContent, ifContext)
                : "";
            result = result.replace(fullMatch, processedContent);
          }
          
          changed = true;
          break;
        } catch (error) {
          console.error("Error in if block:", error);
          result = result.replace(fullMatch, "");
          changed = true;
          break;
        }
      }
    }
  }
  
  return result;
};

// Process nested each blocks properly
const processEachBlocks = (text: string, context: TemplateData): string => {
  let result = text;
  let changed = true;
  
  while (changed) {
    changed = false;
    const regex = /{{#each\s+([^}]+)}}/g;
    let match;
    
    while ((match = regex.exec(result)) !== null) {
      const startPos = match.index;
      const arrayPath = match[1].trim();
      
      // Find the matching {{/each}} by counting nested blocks
      let depth = 1;
      let pos = match.index + match[0].length;
      let endPos = -1;
      
      while (pos < result.length && depth > 0) {
        const remainingText = result.substring(pos);
        const openMatch = remainingText.match(/{{#each\s/);
        const closeMatch = remainingText.match(/{{\/each}}/);
        
        let nextOpen = openMatch ? pos + remainingText.indexOf(openMatch[0]) : Infinity;
        let nextClose = closeMatch ? pos + remainingText.indexOf(closeMatch[0]) : Infinity;
        
        if (nextClose < nextOpen) {
          depth--;
          if (depth === 0) {
            endPos = nextClose;
            break;
          }
          pos = nextClose + 9; // length of "{{/each}}"
        } else if (nextOpen < Infinity) {
          depth++;
          pos = nextOpen + 7; // length of "{{#each"
        } else {
          break;
        }
      }
      
      if (endPos !== -1) {
        const content = result.substring(startPos + match[0].length, endPos);
        const fullMatch = result.substring(startPos, endPos + 9);
        
        try {
          const array = getContextValue(arrayPath, context);
          console.log("Each block - arrayPath:", arrayPath, "resolved to:", array);
          if (!Array.isArray(array)) {
            console.error("Each block array not found or not an array:", arrayPath);
            result = result.replace(fullMatch, "");
          } else {
            const processedContent = array
              .map((item, index) => {
                console.log(`Each block - item ${index}:`, item);
                // Create a context with special variables while preserving parent context
                const itemContext = {
                  ...context, // Keep parent context
                  this: item, // Set current item as 'this'
                  "@index": index,
                  "@first": index === 0,
                  "@last": index === array.length - 1,
                  "@key": arrayPath.split(".").pop() || "",
                  ...item, // Spread item properties at top level
                  parentContext: context, // Preserve parent context reference
                };
                console.log("Each block - itemContext keys:", Object.keys(itemContext));
                console.log("Each block - itemContext.this:", itemContext.this);

                return processTemplate(content, itemContext);
              })
              .join("");
            
            result = result.replace(fullMatch, processedContent);
          }
          
          changed = true;
          break;
        } catch (error) {
          console.error("Error in each block:", error);
          result = result.replace(fullMatch, "");
          changed = true;
          break;
        }
      }
    }
  }
  
  return result;
};

// Process nested with blocks properly
const processWithBlocks = (text: string, context: TemplateData): string => {
  let result = text;
  let changed = true;
  
  while (changed) {
    changed = false;
    const regex = /{{#with\s+([^}]*?)(?=\s+as\s+|}})\s*(?:as\s+\|([^|]+)\|)?\s*}}/g;
    let match;
    
    while ((match = regex.exec(result)) !== null) {
      const startPos = match.index;
      const expression = match[1].trim();
      const alias = match[2];
      
      // Find the matching {{/with}} by counting nested blocks
      let depth = 1;
      let pos = match.index + match[0].length;
      let endPos = -1;
      
      while (pos < result.length && depth > 0) {
        const remainingText = result.substring(pos);
        const openMatch = remainingText.match(/{{#with\s/);
        const closeMatch = remainingText.match(/{{\/with}}/);
        
        let nextOpen = openMatch ? pos + remainingText.indexOf(openMatch[0]) : Infinity;
        let nextClose = closeMatch ? pos + remainingText.indexOf(closeMatch[0]) : Infinity;
        
        if (nextClose < nextOpen) {
          depth--;
          if (depth === 0) {
            endPos = nextClose;
            break;
          }
          pos = nextClose + 9; // length of "{{/with}}"
        } else if (nextOpen < Infinity) {
          depth++;
          pos = nextOpen + 6; // length of "{{#with"
        } else {
          break;
        }
      }
      
      if (endPos !== -1) {
        const content = result.substring(startPos + match[0].length, endPos);
        const fullMatch = result.substring(startPos, endPos + 9);
        
        // Process the with block
        try {
          let value;
          
          if (expression.includes(" ")) {
            const [helperName, ...args] = expression.split(" ").map(part => part.trim());
            console.log("Helper call:", helperName, "with args:", args);
            const helper = helperMap.get(helperName);
            
            if (helper) {
              const resolvedArgs = args.map((arg, index) => {
                let resolved;
                if (arg.startsWith('"') && arg.endsWith('"')) {
                  resolved = arg.slice(1, -1);
                } else if (arg.startsWith("'") && arg.endsWith("'")) {
                  resolved = arg.slice(1, -1);
                } else {
                  resolved = getContextValue(arg, context);
                }
                console.log(`Arg ${index} (${arg}) resolved to:`, resolved);
                return resolved;
              });
              console.log("Calling helper with resolved args:", resolvedArgs);
              
              // Special debug for filter_by_year
              if (helperName === "filter_by_year") {
                console.log("=== FILTER_BY_YEAR DEBUG ===");
                console.log("Original expression:", expression);
                console.log("Split args:", args);
                console.log("Context keys:", Object.keys(context));
                console.log("Context.this:", context.this);
                console.log("Context.parentContext exists:", !!context.parentContext);
                if (context.parentContext) {
                  console.log("Parent context keys:", Object.keys(context.parentContext));
                }
                console.log("Resolved args:");
                resolvedArgs.forEach((arg, i) => {
                  console.log(`  [${i}]: ${typeof arg} -`, arg);
                });
                console.log("=== END DEBUG ===");
              }
              
              value = helper(...resolvedArgs);
            } else {
              value = getContextValue(expression, context);
            }
          } else {
            value = getContextValue(expression, context);
          }
          
          if (value === undefined || value === null) {
            result = result.replace(fullMatch, "");
          } else {
            const withContext = { ...context };
            if (alias) {
              withContext[alias] = value;
            } else {
              if (typeof value === "object" && !Array.isArray(value)) {
                Object.assign(withContext, value);
              } else {
                withContext.this = value;
              }
            }
          
            // Preserve parent context reference for path traversal
            withContext.parentContext = context;
            
            const processedContent = processTemplate(content, withContext);
            result = result.replace(fullMatch, processedContent);
          }
          
          changed = true;
          break;
        } catch (error) {
          console.error("Error in with block:", error);
          result = result.replace(fullMatch, "");
          changed = true;
          break;
        }
      }
    }
  }
  
  return result;
};

// Create a map of helpers for faster lookup
const helperMap = new Map(helpers.map((h) => [h.name, h.helper]));

// Process helpers in the template
const processHelpers = (text: string, context: TemplateData): string => {
  // Match both double and triple braces
  const helperRegex = /{{{?\s*(\w+)\s+([^}]+)}}}?/g;
  return text.replace(helperRegex, (match, helperName, args) => {
    // Skip block helpers and partials
    if (match.startsWith("{{#") || match.startsWith("{{>")) {
      return match;
    }

    const helper = helperMap.get(helperName);
    if (!helper) return match;

    try {
      // Split args and resolve context values
      const resolvedArgs = args.split(" ").map((arg) => {
        const trimmed = arg.trim();
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
          return trimmed.slice(1, -1);
        }
        if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
          return trimmed.slice(1, -1);
        }
        return getContextValue(trimmed, context);
      });

      // Call the helper with resolved arguments
      const result = helper(...resolvedArgs);
      return result !== undefined ? String(result) : "";
    } catch (error) {
      console.error(`Error processing helper ${helperName}:`, error);
      return "";
    }
  });
};

export const processTemplate = (
  text: string,
  context: TemplateData,
): string => {
  if (!text) return "";

  // Process in specific order: blocks first, then helpers, then variables
  let result = text;
  result = processBlockHelpers(result, context);
  result = processHelpers(result, context);
  result = processVariables(result, context);
  return result;
};

export const cleanTemplateString = (content: string): string => {
  if (!content) return "";
  return decode(content)
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\")
    .replace(/^"/, "") // Remove leading quote
    .replace(/"$/, "") // Remove trailing quote
    .replace(/(?<=>)"\s*/g, "") // Remove quotes and spaces after >
    .replace(/\s*"(?=<)/g, "") // Remove quotes and spaces before <
    .trim();
};

export const processPartials = async (
  template: string,
  partials: Partial[],
  templateData: TemplateData,
): Promise<string> => {
  // First fetch and clean all partials
  const processedPartials: { [key: string]: string } = {};

  for (const partial of partials) {
    try {
      const response = await fetch(
        `https://ipfs.transport-union.dev/api/v0/cat?arg=${partial.cid}`,
        {
          method: "POST",
        },
      );

      if (!response.ok) continue;

      let content = await response.text();
      content = cleanTemplateString(content);

      // Get filename without path or extension
      const name = partial.path
        .substring(partial.path.lastIndexOf("/") + 1)
        .split(".")[0];
      processedPartials[name] = content;
    } catch (error) {
      continue;
    }
  }

  // Then recursively replace partials in template
  let html = template;
  let depth = 0;
  let changed = true;

  while (changed && depth < 10) {
    // Max 10 levels of nesting
    changed = false;
    for (const [name, content] of Object.entries(processedPartials)) {
      const regex = new RegExp(`{{\\s*>\\s*${name}\\s*}}`, "g");
      if (regex.test(html)) {
        // Clean the content again after replacing to handle any nested quotes
        html = html.replace(regex, content);
        changed = true;
      }
    }
    depth++;
    // Clean any quotes that might have been introduced
    html = cleanTemplateString(html);
  }

  // Process the complete template after all partials are inserted
  return processTemplate(html, templateData);
};

// HTML escape function
const escapeHtml = (str: string): string => {
  const htmlEscapes: { [key: string]: string } = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return str.replace(/[&<>"']/g, (char) => htmlEscapes[char]);
};
