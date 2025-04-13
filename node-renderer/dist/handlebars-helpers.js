"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.helpers = void 0;
exports.helpers = [
    {
        name: "extract_images",
        helper: (input) => {
            if (!input)
                return "";
            let arr = input.split('<').map((item) => item.trim());
            let prevWasImage = false;
            // Remove the first and last elements from the array
            arr[0] = "";
            arr.pop();
            // Process each element of the array
            arr = arr.map((item) => {
                if (item.startsWith("img") && !prevWasImage) {
                    prevWasImage = true;
                    return `/section><section class='container images'><${item}`;
                }
                else if (!item.startsWith("img") && prevWasImage) {
                    prevWasImage = false;
                    return `/section><section class='small-container'><${item}`;
                }
                else {
                    return item;
                }
            });
            // Join the array back into a string
            return arr.join("<");
        }
    },
    {
        name: "markdown",
        helper: (content) => {
            return content;
        }
    },
    {
        name: "trim_seo_desc",
        helper: (content) => {
            if (content) {
                return (content.length <= 140) ? content : content.substring(0, 140);
            }
        }
    },
    {
        name: "indexEqualsZero",
        helper: (index) => {
            return index === 0;
        }
    },
    {
        name: "moreTag",
        helper: (content) => {
            content = content.replace('===more', '<a href="#" class="more_link"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 30" fill="none" x="0px" y="0px"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.6159 9.67991C5.79268 9.46777 6.10797 9.4391 6.3201 9.61589L12 14.3491L17.6799 9.61589C17.8921 9.4391 18.2073 9.46777 18.3841 9.67991C18.5609 9.89204 18.5322 10.2073 18.3201 10.3841L12.3201 15.3841C12.1347 15.5386 11.8653 15.5386 11.6799 15.3841L5.67992 10.3841C5.46778 10.2073 5.43912 9.89204 5.6159 9.67991Z" fill="black"/></svg><span>Lees verder ...</span></a><div class="more">');
            content = content.replace('<p></p>', '');
            content = content + '</div>';
            return content;
        }
    },
    {
        name: "relPath",
        helper: (type, language, options) => {
            let path = './';
            if (language == 'en') {
                path = '../';
            }
            return path;
        }
    },
    {
        name: "backgroundify",
        helper: (content) => {
            content = content.replace(/<p>/g, '<p><span>');
            content = content.replace(/<\/p>/g, '</span></p>');
            return content;
        }
    },
    {
        name: "ifEquals",
        helper: (a, b, options) => {
            if (a === b) {
                return options.fn(this);
            }
            else {
                return options.inverse(this);
            }
        }
    },
    {
        name: "ifCond",
        helper: (v1, operator, v2, options) => {
            switch (operator) {
                case "==":
                    return (v1 == v2) ? options.fn(this) : options.inverse(this);
                case "===":
                    return (v1 === v2) ? options.fn(this) : options.inverse(this);
                case "!=":
                    return (v1 != v2) ? options.fn(this) : options.inverse(this);
                case "!==":
                    return (v1 !== v2) ? options.fn(this) : options.inverse(this);
                case "<":
                    return (v1 < v2) ? options.fn(this) : options.inverse(this);
                case "<=":
                    return (v1 <= v2) ? options.fn(this) : options.inverse(this);
                case ">":
                    return (v1 > v2) ? options.fn(this) : options.inverse(this);
                case ">=":
                    return (v1 >= v2) ? options.fn(this) : options.inverse(this);
                case "&&":
                    return (v1 && v2) ? options.fn(this) : options.inverse(this);
                case "||":
                    return (v1 !== null || v2 !== null) ? options.fn(this) : options.inverse(this);
                default:
                    return options.inverse(this);
            }
        }
    },
    {
        name: "isUndefined",
        helper: (value, options) => {
            if (typeof value === "undefined") {
                options.inverse(this);
            }
            else {
                options.fn(this);
            }
        }
    },
    {
        name: "or",
        helper: (first, second) => {
            return first || second;
        }
    },
    {
        name: "ifIn",
        helper: (elem, list, options) => {
            if (list.indexOf(elem) > -1) {
                return options.fn(this);
            }
            return options.inverse(this);
        }
    },
    {
        name: "unlessIn",
        helper: (elem, list, options) => {
            if (list.indexOf(elem) > -1) {
                return options.inverse(this);
            }
            return options.fn(this);
        }
    },
    {
        name: "limit",
        helper: (arr, limit) => {
            if (arr && arr.constructor === Array) {
                return arr.slice(0, limit);
            }
            else {
                return;
            }
        }
    },
    {
        name: "ifMoreThan",
        helper: (a, b, options) => {
            if (parseInt(a) > b) {
                return options.fn(this);
            }
            else {
                return options.inverse(this);
            }
        }
    },
    {
        name: "stripHTML",
        helper: (content) => {
            if (content !== null && content !== undefined) {
                const strippedFromHtml = content.toString().replace(/(&nbsp;|<([^>]+)>)/ig, "");
                return strippedFromHtml;
            }
            else {
                return "";
            }
        }
    },
    {
        name: "stripFromHashTags",
        helper: (content) => {
            if (content !== null && content !== undefined) {
                const strippedFromHashTags = content.replace(/^(\s*#\w+\s*)+$/gm, "");
                return strippedFromHashTags;
            }
            else {
                return "";
            }
        }
    },
    {
        name: "explode",
        helper: (array) => {
            if (array && array.length > 0) {
                const mappedArray = array.map(object => {
                    return object.slug;
                });
                return mappedArray.join(" ");
            }
            else {
                return "";
            }
        }
    },
    {
        name: "lowercase",
        helper: (words) => {
            if (words !== undefined && words !== null && typeof words !== "object") {
                return words.toLowerCase();
            }
            else {
                return "";
            }
        }
    },
    {
        name: "sluggify",
        helper: (words) => {
            if (words !== undefined && words !== null && typeof words !== "object") {
                return words.toLowerCase().replace(/[^a-zA-Z ]/g, "").trim().split(" ").join("-");
            }
            else {
                return "fout in naam";
            }
        }
    },
    {
        name: "anchorify",
        helper: (words) => {
            if (words !== undefined && words !== null && typeof words !== "object") {
                return words.toString().replace(/(&nbsp;|<([^>]+)>)/ig, "").toLowerCase().replace(/[^a-zA-Z ]/g, "").trim().split(" ").slice(0, 3).join("-");
            }
            else {
                return "fout-in-anchor";
            }
        }
    },
    {
        name: "index_of",
        helper: (context, index) => {
            return context[index];
        }
    },
    {
        name: "log",
        helper: (data) => {
            return "<script>console.log(" + data + ");</script>";
            // return '<script></script>';
        }
    },
    {
        name: "json",
        helper: (context) => {
            return JSON.stringify(context);
        }
    },
    {
        name: "concat",
        helper: (string1, string2) => {
            return string1 + string2;
        }
    },
    {
        name: "noObject",
        helper: (content) => {
            return (content instanceof Object) ? "" : content;
        }
    }
];
