"use strict";
(() => {
  // renderer/src/constants.ts
  var IPFS_URL = "https://ipfs.transport-union.dev";

  // renderer/src/handlebars-helpers.ts
  var helpers = [
    {
      name: "unique_years",
      helper: function(posts) {
        if (!posts || !Array.isArray(posts)) {
          return [];
        }
        try {
          const years = [];
          for (let i = 0; i < posts.length; i++) {
            const post = posts[i];
            if (!post || !post.creation_date) continue;
            try {
              const dateStr = post.creation_date;
              let year = null;
              if (/^\d+$/.test(dateStr)) {
                const date = new Date(parseInt(dateStr) * 1e3);
                year = date.getFullYear().toString();
              } else {
                const match = dateStr.match(/\b(19|20)\d{2}\b/);
                if (match) {
                  year = match[0];
                } else if (dateStr.length >= 4 && /^\d{4}/.test(dateStr)) {
                  year = dateStr.substring(0, 4);
                }
              }
              if (year && !years.includes(year)) {
                years.push(year);
              }
            } catch (e) {
              console.error("Error processing post date:", e);
            }
          }
          years.sort((a, b) => parseInt(b) - parseInt(a));
          return years;
        } catch (error) {
          console.error("Error in unique_years helper:", error);
          return [];
        }
      }
    },
    {
      name: "filter_by_year",
      helper: function(year, posts) {
        if (!posts || !Array.isArray(posts) || !year) {
          return [];
        }
        try {
          const filtered = [];
          for (let i = 0; i < posts.length; i++) {
            const post = posts[i];
            if (!post || !post.creation_date) continue;
            try {
              const dateStr = post.creation_date;
              let matches = false;
              let timestamp = 0;
              if (/^\d+$/.test(dateStr)) {
                timestamp = parseInt(dateStr);
                const date = new Date(timestamp * 1e3);
                const postYear = date.getFullYear().toString();
                if (postYear === year) {
                  matches = true;
                }
              } else {
                const yearMatch = dateStr.match(/\b(19|20)\d{2}\b/);
                if (yearMatch && yearMatch[0] === year) {
                  matches = true;
                  const date = new Date(dateStr);
                  if (!isNaN(date.getTime())) {
                    timestamp = Math.floor(date.getTime() / 1e3);
                  }
                } else if (dateStr.length >= 4 && dateStr.substring(0, 4) === year) {
                  matches = true;
                }
              }
              if (matches) {
                filtered.push({
                  ...post,
                  _timestamp: timestamp
                });
              }
            } catch (e) {
            }
          }
          filtered.sort((a, b) => {
            const dateA = a._timestamp || (a.creation_date ? parseInt(a.creation_date) : 0);
            const dateB = b._timestamp || (b.creation_date ? parseInt(b.creation_date) : 0);
            return dateB - dateA;
          });
          return filtered;
        } catch (error) {
          console.error("Error in filter_by_year helper:", error);
          return [];
        }
      }
    },
    {
      name: "extract_images",
      helper: (input) => {
        if (!input) return "x";
        let arr = input.split("<").map((item) => item.trim());
        let prevWasImage = false;
        arr[0] = "";
        arr.pop();
        arr = arr.map((item) => {
          if (item.startsWith("img") && !prevWasImage) {
            prevWasImage = true;
            return `/section><section class='container images'><${item}`;
          } else if (!item.startsWith("img") && prevWasImage) {
            prevWasImage = false;
            return `/section><section class='small-container'><${item}`;
          } else {
            return item;
          }
        });
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
          return content.length <= 140 ? content : content.substring(0, 140);
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
        content = content.replace(
          "===more",
          '<a href="#" class="more_link"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 30" fill="none" x="0px" y="0px"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.6159 9.67991C5.79268 9.46777 6.10797 9.4391 6.3201 9.61589L12 14.3491L17.6799 9.61589C17.8921 9.4391 18.2073 9.46777 18.3841 9.67991C18.5609 9.89204 18.5322 10.2073 18.3201 10.3841L12.3201 15.3841C12.1347 15.5386 11.8653 15.5386 11.6799 15.3841L5.67992 10.3841C5.46778 10.2073 5.43912 9.89204 5.6159 9.67991Z" fill="black"/></svg><span>Lees verder ...</span></a><div class="more">'
        );
        content = content.replace("<p></p>", "");
        content = content + "</div>";
        return content;
      }
    },
    {
      name: "relPath",
      helper: (type, language, options) => {
        let path = "./";
        if (language == "en") {
          path = "../";
        }
        return path;
      }
    },
    {
      name: "backgroundify",
      helper: (content) => {
        if (!content) return "";
        try {
          if (typeof content !== "string") {
            content = String(content);
          }
          content = content.replace(/<p>/g, "<p><span>");
          content = content.replace(/<\/p>/g, "</span></p>");
          return content;
        } catch (error) {
          console.error("Error in backgroundify helper:", error);
          return "";
        }
      }
    },
    {
      name: "ifEquals",
      helper: function(a, b, options) {
        if (!options || typeof options.fn !== "function") {
          return "";
        }
        if (a === b) {
          return options.fn();
        }
        return typeof options.inverse === "function" ? options.inverse() : "";
      }
    },
    {
      name: "ifCond",
      helper: (v1, operator, v2, options) => {
        switch (operator) {
          case "==":
            return v1 == v2 ? options.fn(void 0) : options.inverse(void 0);
          case "===":
            return v1 === v2 ? options.fn(void 0) : options.inverse(void 0);
          case "!=":
            return v1 != v2 ? options.fn(void 0) : options.inverse(void 0);
          case "!==":
            return v1 !== v2 ? options.fn(void 0) : options.inverse(void 0);
          case "<":
            return v1 < v2 ? options.fn(void 0) : options.inverse(void 0);
          case "<=":
            return v1 <= v2 ? options.fn(void 0) : options.inverse(void 0);
          case ">":
            return v1 > v2 ? options.fn(void 0) : options.inverse(void 0);
          case ">=":
            return v1 >= v2 ? options.fn(void 0) : options.inverse(void 0);
          case "&&":
            return v1 && v2 ? options.fn(void 0) : options.inverse(void 0);
          case "||":
            return v1 !== null || v2 !== null ? options.fn(void 0) : options.inverse(void 0);
          default:
            return options.inverse(void 0);
        }
      }
    },
    {
      name: "isUndefined",
      helper: (value, options) => {
        if (typeof value === "undefined") {
          options.inverse(void 0);
        } else {
          options.fn(void 0);
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
          return options.fn(void 0);
        }
        return options.inverse(void 0);
      }
    },
    {
      name: "unlessIn",
      helper: (elem, list, options) => {
        if (list.indexOf(elem) > -1) {
          return options.inverse(void 0);
        }
        return options.fn(void 0);
      }
    },
    {
      name: "limit",
      helper: (arr, limit) => {
        if (arr && arr.constructor === Array) {
          return arr.slice(0, limit);
        } else {
          return;
        }
      }
    },
    {
      name: "ifMoreThan",
      helper: (a, b, options) => {
        if (parseInt(a) > b) {
          return options.fn(void 0);
        } else {
          return options.inverse(void 0);
        }
      }
    },
    {
      name: "stripHTML",
      helper: (content) => {
        if (content !== null && content !== void 0) {
          const strippedFromHtml = content.toString().replace(/(&nbsp;|<([^>]+)>)/gi, "");
          return strippedFromHtml;
        } else {
          return "";
        }
      }
    },
    {
      name: "stripFromHashTags",
      helper: (content) => {
        if (content !== null && content !== void 0) {
          const strippedFromHashTags = content.replace(/^(\s*#\w+\s*)+$/gm, "");
          return strippedFromHashTags;
        } else {
          return "";
        }
      }
    },
    {
      name: "explode",
      helper: (array) => {
        if (array && array.length > 0) {
          const mappedArray = array.map((object) => {
            return object.slug;
          });
          return mappedArray.join(" ");
        } else {
          return "";
        }
      }
    },
    {
      name: "lowercase",
      helper: (words) => {
        if (words !== void 0 && words !== null && typeof words !== "object") {
          return words.toLowerCase();
        } else {
          return "";
        }
      }
    },
    {
      name: "sluggify",
      helper: (words) => {
        if (words !== void 0 && words !== null && typeof words !== "object") {
          return words.toLowerCase().replace(/[^a-zA-Z ]/g, "").trim().split(" ").join("-");
        } else {
          return "fout in naam";
        }
      }
    },
    {
      name: "anchorify",
      helper: (words) => {
        if (words !== void 0 && words !== null && typeof words !== "object") {
          return words.toString().replace(/(&nbsp;|<([^>]+)>)/gi, "").toLowerCase().replace(/[^a-zA-Z ]/g, "").trim().split(" ").slice(0, 3).join("-");
        } else {
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
      name: "formatDate",
      helper: (date, language) => {
        try {
          let parsed;
          if (typeof date === "string") {
            parsed = new Date(date);
            if (isNaN(parsed.getTime())) {
              parsed = new Date(parseInt(date) * 1e3);
            }
          } else {
            parsed = new Date(date * 1e3);
          }
          if (isNaN(parsed.getTime())) {
            console.error("formatDate: Invalid date:", date);
            return "";
          }
          let lCode = "";
          switch (language) {
            case "nl":
              lCode = "nl-NL";
              break;
            default:
              lCode = "en-US";
              break;
          }
          const formatter = new Intl.DateTimeFormat(lCode, {
            day: "numeric",
            month: "numeric",
            year: "numeric"
          });
          return formatter.format(parsed);
        } catch (error) {
          console.error("formatDate error:", error);
          return "";
        }
      }
    },
    {
      name: "formatDateAsMonthYear",
      helper: (date, language) => {
        try {
          let parsed;
          if (typeof date === "string") {
            parsed = new Date(date);
            if (isNaN(parsed.getTime())) {
              parsed = new Date(parseInt(date) * 1e3);
            }
          } else {
            parsed = new Date(date * 1e3);
          }
          if (isNaN(parsed.getTime())) {
            console.error("formatDate: Invalid date:", date);
            return "";
          }
          let lCode = "";
          switch (language) {
            case "nl":
              lCode = "nl-NL";
              break;
            default:
              lCode = "en-US";
              break;
          }
          const formatter = new Intl.DateTimeFormat(lCode, {
            // day: 'numeric',
            month: "long",
            year: "numeric"
          });
          return formatter.format(parsed);
        } catch (error) {
          console.error("formatDate error:", error);
          return "";
        }
      }
    },
    {
      name: "log",
      helper: (data) => {
        return "<script>console.log(" + data + ");<\/script>";
      }
    },
    {
      name: "json",
      helper: (context) => {
        return JSON.stringify(context, null, 2);
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
        return content instanceof Object ? "" : content;
      }
    }
  ];

  // node_modules/.pnpm/html-entities@2.6.0/node_modules/html-entities/dist/esm/named-references.js
  var __assign = function() {
    __assign = Object.assign || function(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
          t[p] = s[p];
      }
      return t;
    };
    return __assign.apply(this, arguments);
  };
  var pairDivider = "~";
  var blockDivider = "~~";
  function generateNamedReferences(input, prev) {
    var entities = {};
    var characters = {};
    var blocks = input.split(blockDivider);
    var isOptionalBlock = false;
    for (var i = 0; blocks.length > i; i++) {
      var entries = blocks[i].split(pairDivider);
      for (var j = 0; j < entries.length; j += 2) {
        var entity = entries[j];
        var character = entries[j + 1];
        var fullEntity = "&" + entity + ";";
        entities[fullEntity] = character;
        if (isOptionalBlock) {
          entities["&" + entity] = character;
        }
        characters[character] = fullEntity;
      }
      isOptionalBlock = true;
    }
    return prev ? { entities: __assign(__assign({}, entities), prev.entities), characters: __assign(__assign({}, characters), prev.characters) } : { entities, characters };
  }
  var bodyRegExps = {
    xml: /&(?:#\d+|#[xX][\da-fA-F]+|[0-9a-zA-Z]+);?/g,
    html4: /&notin;|&(?:nbsp|iexcl|cent|pound|curren|yen|brvbar|sect|uml|copy|ordf|laquo|not|shy|reg|macr|deg|plusmn|sup2|sup3|acute|micro|para|middot|cedil|sup1|ordm|raquo|frac14|frac12|frac34|iquest|Agrave|Aacute|Acirc|Atilde|Auml|Aring|AElig|Ccedil|Egrave|Eacute|Ecirc|Euml|Igrave|Iacute|Icirc|Iuml|ETH|Ntilde|Ograve|Oacute|Ocirc|Otilde|Ouml|times|Oslash|Ugrave|Uacute|Ucirc|Uuml|Yacute|THORN|szlig|agrave|aacute|acirc|atilde|auml|aring|aelig|ccedil|egrave|eacute|ecirc|euml|igrave|iacute|icirc|iuml|eth|ntilde|ograve|oacute|ocirc|otilde|ouml|divide|oslash|ugrave|uacute|ucirc|uuml|yacute|thorn|yuml|quot|amp|lt|gt|#\d+|#[xX][\da-fA-F]+|[0-9a-zA-Z]+);?/g,
    html5: /&centerdot;|&copysr;|&divideontimes;|&gtcc;|&gtcir;|&gtdot;|&gtlPar;|&gtquest;|&gtrapprox;|&gtrarr;|&gtrdot;|&gtreqless;|&gtreqqless;|&gtrless;|&gtrsim;|&ltcc;|&ltcir;|&ltdot;|&lthree;|&ltimes;|&ltlarr;|&ltquest;|&ltrPar;|&ltri;|&ltrie;|&ltrif;|&notin;|&notinE;|&notindot;|&notinva;|&notinvb;|&notinvc;|&notni;|&notniva;|&notnivb;|&notnivc;|&parallel;|&timesb;|&timesbar;|&timesd;|&(?:AElig|AMP|Aacute|Acirc|Agrave|Aring|Atilde|Auml|COPY|Ccedil|ETH|Eacute|Ecirc|Egrave|Euml|GT|Iacute|Icirc|Igrave|Iuml|LT|Ntilde|Oacute|Ocirc|Ograve|Oslash|Otilde|Ouml|QUOT|REG|THORN|Uacute|Ucirc|Ugrave|Uuml|Yacute|aacute|acirc|acute|aelig|agrave|amp|aring|atilde|auml|brvbar|ccedil|cedil|cent|copy|curren|deg|divide|eacute|ecirc|egrave|eth|euml|frac12|frac14|frac34|gt|iacute|icirc|iexcl|igrave|iquest|iuml|laquo|lt|macr|micro|middot|nbsp|not|ntilde|oacute|ocirc|ograve|ordf|ordm|oslash|otilde|ouml|para|plusmn|pound|quot|raquo|reg|sect|shy|sup1|sup2|sup3|szlig|thorn|times|uacute|ucirc|ugrave|uml|uuml|yacute|yen|yuml|#\d+|#[xX][\da-fA-F]+|[0-9a-zA-Z]+);?/g
  };
  var namedReferences = {};
  namedReferences["xml"] = generateNamedReferences(`lt~<~gt~>~quot~"~apos~'~amp~&`);
  namedReferences["html4"] = generateNamedReferences(`apos~'~OElig~\u0152~oelig~\u0153~Scaron~\u0160~scaron~\u0161~Yuml~\u0178~circ~\u02C6~tilde~\u02DC~ensp~\u2002~emsp~\u2003~thinsp~\u2009~zwnj~\u200C~zwj~\u200D~lrm~\u200E~rlm~\u200F~ndash~\u2013~mdash~\u2014~lsquo~\u2018~rsquo~\u2019~sbquo~\u201A~ldquo~\u201C~rdquo~\u201D~bdquo~\u201E~dagger~\u2020~Dagger~\u2021~permil~\u2030~lsaquo~\u2039~rsaquo~\u203A~euro~\u20AC~fnof~\u0192~Alpha~\u0391~Beta~\u0392~Gamma~\u0393~Delta~\u0394~Epsilon~\u0395~Zeta~\u0396~Eta~\u0397~Theta~\u0398~Iota~\u0399~Kappa~\u039A~Lambda~\u039B~Mu~\u039C~Nu~\u039D~Xi~\u039E~Omicron~\u039F~Pi~\u03A0~Rho~\u03A1~Sigma~\u03A3~Tau~\u03A4~Upsilon~\u03A5~Phi~\u03A6~Chi~\u03A7~Psi~\u03A8~Omega~\u03A9~alpha~\u03B1~beta~\u03B2~gamma~\u03B3~delta~\u03B4~epsilon~\u03B5~zeta~\u03B6~eta~\u03B7~theta~\u03B8~iota~\u03B9~kappa~\u03BA~lambda~\u03BB~mu~\u03BC~nu~\u03BD~xi~\u03BE~omicron~\u03BF~pi~\u03C0~rho~\u03C1~sigmaf~\u03C2~sigma~\u03C3~tau~\u03C4~upsilon~\u03C5~phi~\u03C6~chi~\u03C7~psi~\u03C8~omega~\u03C9~thetasym~\u03D1~upsih~\u03D2~piv~\u03D6~bull~\u2022~hellip~\u2026~prime~\u2032~Prime~\u2033~oline~\u203E~frasl~\u2044~weierp~\u2118~image~\u2111~real~\u211C~trade~\u2122~alefsym~\u2135~larr~\u2190~uarr~\u2191~rarr~\u2192~darr~\u2193~harr~\u2194~crarr~\u21B5~lArr~\u21D0~uArr~\u21D1~rArr~\u21D2~dArr~\u21D3~hArr~\u21D4~forall~\u2200~part~\u2202~exist~\u2203~empty~\u2205~nabla~\u2207~isin~\u2208~notin~\u2209~ni~\u220B~prod~\u220F~sum~\u2211~minus~\u2212~lowast~\u2217~radic~\u221A~prop~\u221D~infin~\u221E~ang~\u2220~and~\u2227~or~\u2228~cap~\u2229~cup~\u222A~int~\u222B~there4~\u2234~sim~\u223C~cong~\u2245~asymp~\u2248~ne~\u2260~equiv~\u2261~le~\u2264~ge~\u2265~sub~\u2282~sup~\u2283~nsub~\u2284~sube~\u2286~supe~\u2287~oplus~\u2295~otimes~\u2297~perp~\u22A5~sdot~\u22C5~lceil~\u2308~rceil~\u2309~lfloor~\u230A~rfloor~\u230B~lang~\u2329~rang~\u232A~loz~\u25CA~spades~\u2660~clubs~\u2663~hearts~\u2665~diams~\u2666~~nbsp~\xA0~iexcl~\xA1~cent~\xA2~pound~\xA3~curren~\xA4~yen~\xA5~brvbar~\xA6~sect~\xA7~uml~\xA8~copy~\xA9~ordf~\xAA~laquo~\xAB~not~\xAC~shy~\xAD~reg~\xAE~macr~\xAF~deg~\xB0~plusmn~\xB1~sup2~\xB2~sup3~\xB3~acute~\xB4~micro~\xB5~para~\xB6~middot~\xB7~cedil~\xB8~sup1~\xB9~ordm~\xBA~raquo~\xBB~frac14~\xBC~frac12~\xBD~frac34~\xBE~iquest~\xBF~Agrave~\xC0~Aacute~\xC1~Acirc~\xC2~Atilde~\xC3~Auml~\xC4~Aring~\xC5~AElig~\xC6~Ccedil~\xC7~Egrave~\xC8~Eacute~\xC9~Ecirc~\xCA~Euml~\xCB~Igrave~\xCC~Iacute~\xCD~Icirc~\xCE~Iuml~\xCF~ETH~\xD0~Ntilde~\xD1~Ograve~\xD2~Oacute~\xD3~Ocirc~\xD4~Otilde~\xD5~Ouml~\xD6~times~\xD7~Oslash~\xD8~Ugrave~\xD9~Uacute~\xDA~Ucirc~\xDB~Uuml~\xDC~Yacute~\xDD~THORN~\xDE~szlig~\xDF~agrave~\xE0~aacute~\xE1~acirc~\xE2~atilde~\xE3~auml~\xE4~aring~\xE5~aelig~\xE6~ccedil~\xE7~egrave~\xE8~eacute~\xE9~ecirc~\xEA~euml~\xEB~igrave~\xEC~iacute~\xED~icirc~\xEE~iuml~\xEF~eth~\xF0~ntilde~\xF1~ograve~\xF2~oacute~\xF3~ocirc~\xF4~otilde~\xF5~ouml~\xF6~divide~\xF7~oslash~\xF8~ugrave~\xF9~uacute~\xFA~ucirc~\xFB~uuml~\xFC~yacute~\xFD~thorn~\xFE~yuml~\xFF~quot~"~amp~&~lt~<~gt~>`);
  namedReferences["html5"] = generateNamedReferences('Abreve~\u0102~Acy~\u0410~Afr~\u{1D504}~Amacr~\u0100~And~\u2A53~Aogon~\u0104~Aopf~\u{1D538}~ApplyFunction~\u2061~Ascr~\u{1D49C}~Assign~\u2254~Backslash~\u2216~Barv~\u2AE7~Barwed~\u2306~Bcy~\u0411~Because~\u2235~Bernoullis~\u212C~Bfr~\u{1D505}~Bopf~\u{1D539}~Breve~\u02D8~Bscr~\u212C~Bumpeq~\u224E~CHcy~\u0427~Cacute~\u0106~Cap~\u22D2~CapitalDifferentialD~\u2145~Cayleys~\u212D~Ccaron~\u010C~Ccirc~\u0108~Cconint~\u2230~Cdot~\u010A~Cedilla~\xB8~CenterDot~\xB7~Cfr~\u212D~CircleDot~\u2299~CircleMinus~\u2296~CirclePlus~\u2295~CircleTimes~\u2297~ClockwiseContourIntegral~\u2232~CloseCurlyDoubleQuote~\u201D~CloseCurlyQuote~\u2019~Colon~\u2237~Colone~\u2A74~Congruent~\u2261~Conint~\u222F~ContourIntegral~\u222E~Copf~\u2102~Coproduct~\u2210~CounterClockwiseContourIntegral~\u2233~Cross~\u2A2F~Cscr~\u{1D49E}~Cup~\u22D3~CupCap~\u224D~DD~\u2145~DDotrahd~\u2911~DJcy~\u0402~DScy~\u0405~DZcy~\u040F~Darr~\u21A1~Dashv~\u2AE4~Dcaron~\u010E~Dcy~\u0414~Del~\u2207~Dfr~\u{1D507}~DiacriticalAcute~\xB4~DiacriticalDot~\u02D9~DiacriticalDoubleAcute~\u02DD~DiacriticalGrave~`~DiacriticalTilde~\u02DC~Diamond~\u22C4~DifferentialD~\u2146~Dopf~\u{1D53B}~Dot~\xA8~DotDot~\u20DC~DotEqual~\u2250~DoubleContourIntegral~\u222F~DoubleDot~\xA8~DoubleDownArrow~\u21D3~DoubleLeftArrow~\u21D0~DoubleLeftRightArrow~\u21D4~DoubleLeftTee~\u2AE4~DoubleLongLeftArrow~\u27F8~DoubleLongLeftRightArrow~\u27FA~DoubleLongRightArrow~\u27F9~DoubleRightArrow~\u21D2~DoubleRightTee~\u22A8~DoubleUpArrow~\u21D1~DoubleUpDownArrow~\u21D5~DoubleVerticalBar~\u2225~DownArrow~\u2193~DownArrowBar~\u2913~DownArrowUpArrow~\u21F5~DownBreve~\u0311~DownLeftRightVector~\u2950~DownLeftTeeVector~\u295E~DownLeftVector~\u21BD~DownLeftVectorBar~\u2956~DownRightTeeVector~\u295F~DownRightVector~\u21C1~DownRightVectorBar~\u2957~DownTee~\u22A4~DownTeeArrow~\u21A7~Downarrow~\u21D3~Dscr~\u{1D49F}~Dstrok~\u0110~ENG~\u014A~Ecaron~\u011A~Ecy~\u042D~Edot~\u0116~Efr~\u{1D508}~Element~\u2208~Emacr~\u0112~EmptySmallSquare~\u25FB~EmptyVerySmallSquare~\u25AB~Eogon~\u0118~Eopf~\u{1D53C}~Equal~\u2A75~EqualTilde~\u2242~Equilibrium~\u21CC~Escr~\u2130~Esim~\u2A73~Exists~\u2203~ExponentialE~\u2147~Fcy~\u0424~Ffr~\u{1D509}~FilledSmallSquare~\u25FC~FilledVerySmallSquare~\u25AA~Fopf~\u{1D53D}~ForAll~\u2200~Fouriertrf~\u2131~Fscr~\u2131~GJcy~\u0403~Gammad~\u03DC~Gbreve~\u011E~Gcedil~\u0122~Gcirc~\u011C~Gcy~\u0413~Gdot~\u0120~Gfr~\u{1D50A}~Gg~\u22D9~Gopf~\u{1D53E}~GreaterEqual~\u2265~GreaterEqualLess~\u22DB~GreaterFullEqual~\u2267~GreaterGreater~\u2AA2~GreaterLess~\u2277~GreaterSlantEqual~\u2A7E~GreaterTilde~\u2273~Gscr~\u{1D4A2}~Gt~\u226B~HARDcy~\u042A~Hacek~\u02C7~Hat~^~Hcirc~\u0124~Hfr~\u210C~HilbertSpace~\u210B~Hopf~\u210D~HorizontalLine~\u2500~Hscr~\u210B~Hstrok~\u0126~HumpDownHump~\u224E~HumpEqual~\u224F~IEcy~\u0415~IJlig~\u0132~IOcy~\u0401~Icy~\u0418~Idot~\u0130~Ifr~\u2111~Im~\u2111~Imacr~\u012A~ImaginaryI~\u2148~Implies~\u21D2~Int~\u222C~Integral~\u222B~Intersection~\u22C2~InvisibleComma~\u2063~InvisibleTimes~\u2062~Iogon~\u012E~Iopf~\u{1D540}~Iscr~\u2110~Itilde~\u0128~Iukcy~\u0406~Jcirc~\u0134~Jcy~\u0419~Jfr~\u{1D50D}~Jopf~\u{1D541}~Jscr~\u{1D4A5}~Jsercy~\u0408~Jukcy~\u0404~KHcy~\u0425~KJcy~\u040C~Kcedil~\u0136~Kcy~\u041A~Kfr~\u{1D50E}~Kopf~\u{1D542}~Kscr~\u{1D4A6}~LJcy~\u0409~Lacute~\u0139~Lang~\u27EA~Laplacetrf~\u2112~Larr~\u219E~Lcaron~\u013D~Lcedil~\u013B~Lcy~\u041B~LeftAngleBracket~\u27E8~LeftArrow~\u2190~LeftArrowBar~\u21E4~LeftArrowRightArrow~\u21C6~LeftCeiling~\u2308~LeftDoubleBracket~\u27E6~LeftDownTeeVector~\u2961~LeftDownVector~\u21C3~LeftDownVectorBar~\u2959~LeftFloor~\u230A~LeftRightArrow~\u2194~LeftRightVector~\u294E~LeftTee~\u22A3~LeftTeeArrow~\u21A4~LeftTeeVector~\u295A~LeftTriangle~\u22B2~LeftTriangleBar~\u29CF~LeftTriangleEqual~\u22B4~LeftUpDownVector~\u2951~LeftUpTeeVector~\u2960~LeftUpVector~\u21BF~LeftUpVectorBar~\u2958~LeftVector~\u21BC~LeftVectorBar~\u2952~Leftarrow~\u21D0~Leftrightarrow~\u21D4~LessEqualGreater~\u22DA~LessFullEqual~\u2266~LessGreater~\u2276~LessLess~\u2AA1~LessSlantEqual~\u2A7D~LessTilde~\u2272~Lfr~\u{1D50F}~Ll~\u22D8~Lleftarrow~\u21DA~Lmidot~\u013F~LongLeftArrow~\u27F5~LongLeftRightArrow~\u27F7~LongRightArrow~\u27F6~Longleftarrow~\u27F8~Longleftrightarrow~\u27FA~Longrightarrow~\u27F9~Lopf~\u{1D543}~LowerLeftArrow~\u2199~LowerRightArrow~\u2198~Lscr~\u2112~Lsh~\u21B0~Lstrok~\u0141~Lt~\u226A~Map~\u2905~Mcy~\u041C~MediumSpace~\u205F~Mellintrf~\u2133~Mfr~\u{1D510}~MinusPlus~\u2213~Mopf~\u{1D544}~Mscr~\u2133~NJcy~\u040A~Nacute~\u0143~Ncaron~\u0147~Ncedil~\u0145~Ncy~\u041D~NegativeMediumSpace~\u200B~NegativeThickSpace~\u200B~NegativeThinSpace~\u200B~NegativeVeryThinSpace~\u200B~NestedGreaterGreater~\u226B~NestedLessLess~\u226A~NewLine~\n~Nfr~\u{1D511}~NoBreak~\u2060~NonBreakingSpace~\xA0~Nopf~\u2115~Not~\u2AEC~NotCongruent~\u2262~NotCupCap~\u226D~NotDoubleVerticalBar~\u2226~NotElement~\u2209~NotEqual~\u2260~NotEqualTilde~\u2242\u0338~NotExists~\u2204~NotGreater~\u226F~NotGreaterEqual~\u2271~NotGreaterFullEqual~\u2267\u0338~NotGreaterGreater~\u226B\u0338~NotGreaterLess~\u2279~NotGreaterSlantEqual~\u2A7E\u0338~NotGreaterTilde~\u2275~NotHumpDownHump~\u224E\u0338~NotHumpEqual~\u224F\u0338~NotLeftTriangle~\u22EA~NotLeftTriangleBar~\u29CF\u0338~NotLeftTriangleEqual~\u22EC~NotLess~\u226E~NotLessEqual~\u2270~NotLessGreater~\u2278~NotLessLess~\u226A\u0338~NotLessSlantEqual~\u2A7D\u0338~NotLessTilde~\u2274~NotNestedGreaterGreater~\u2AA2\u0338~NotNestedLessLess~\u2AA1\u0338~NotPrecedes~\u2280~NotPrecedesEqual~\u2AAF\u0338~NotPrecedesSlantEqual~\u22E0~NotReverseElement~\u220C~NotRightTriangle~\u22EB~NotRightTriangleBar~\u29D0\u0338~NotRightTriangleEqual~\u22ED~NotSquareSubset~\u228F\u0338~NotSquareSubsetEqual~\u22E2~NotSquareSuperset~\u2290\u0338~NotSquareSupersetEqual~\u22E3~NotSubset~\u2282\u20D2~NotSubsetEqual~\u2288~NotSucceeds~\u2281~NotSucceedsEqual~\u2AB0\u0338~NotSucceedsSlantEqual~\u22E1~NotSucceedsTilde~\u227F\u0338~NotSuperset~\u2283\u20D2~NotSupersetEqual~\u2289~NotTilde~\u2241~NotTildeEqual~\u2244~NotTildeFullEqual~\u2247~NotTildeTilde~\u2249~NotVerticalBar~\u2224~Nscr~\u{1D4A9}~Ocy~\u041E~Odblac~\u0150~Ofr~\u{1D512}~Omacr~\u014C~Oopf~\u{1D546}~OpenCurlyDoubleQuote~\u201C~OpenCurlyQuote~\u2018~Or~\u2A54~Oscr~\u{1D4AA}~Otimes~\u2A37~OverBar~\u203E~OverBrace~\u23DE~OverBracket~\u23B4~OverParenthesis~\u23DC~PartialD~\u2202~Pcy~\u041F~Pfr~\u{1D513}~PlusMinus~\xB1~Poincareplane~\u210C~Popf~\u2119~Pr~\u2ABB~Precedes~\u227A~PrecedesEqual~\u2AAF~PrecedesSlantEqual~\u227C~PrecedesTilde~\u227E~Product~\u220F~Proportion~\u2237~Proportional~\u221D~Pscr~\u{1D4AB}~Qfr~\u{1D514}~Qopf~\u211A~Qscr~\u{1D4AC}~RBarr~\u2910~Racute~\u0154~Rang~\u27EB~Rarr~\u21A0~Rarrtl~\u2916~Rcaron~\u0158~Rcedil~\u0156~Rcy~\u0420~Re~\u211C~ReverseElement~\u220B~ReverseEquilibrium~\u21CB~ReverseUpEquilibrium~\u296F~Rfr~\u211C~RightAngleBracket~\u27E9~RightArrow~\u2192~RightArrowBar~\u21E5~RightArrowLeftArrow~\u21C4~RightCeiling~\u2309~RightDoubleBracket~\u27E7~RightDownTeeVector~\u295D~RightDownVector~\u21C2~RightDownVectorBar~\u2955~RightFloor~\u230B~RightTee~\u22A2~RightTeeArrow~\u21A6~RightTeeVector~\u295B~RightTriangle~\u22B3~RightTriangleBar~\u29D0~RightTriangleEqual~\u22B5~RightUpDownVector~\u294F~RightUpTeeVector~\u295C~RightUpVector~\u21BE~RightUpVectorBar~\u2954~RightVector~\u21C0~RightVectorBar~\u2953~Rightarrow~\u21D2~Ropf~\u211D~RoundImplies~\u2970~Rrightarrow~\u21DB~Rscr~\u211B~Rsh~\u21B1~RuleDelayed~\u29F4~SHCHcy~\u0429~SHcy~\u0428~SOFTcy~\u042C~Sacute~\u015A~Sc~\u2ABC~Scedil~\u015E~Scirc~\u015C~Scy~\u0421~Sfr~\u{1D516}~ShortDownArrow~\u2193~ShortLeftArrow~\u2190~ShortRightArrow~\u2192~ShortUpArrow~\u2191~SmallCircle~\u2218~Sopf~\u{1D54A}~Sqrt~\u221A~Square~\u25A1~SquareIntersection~\u2293~SquareSubset~\u228F~SquareSubsetEqual~\u2291~SquareSuperset~\u2290~SquareSupersetEqual~\u2292~SquareUnion~\u2294~Sscr~\u{1D4AE}~Star~\u22C6~Sub~\u22D0~Subset~\u22D0~SubsetEqual~\u2286~Succeeds~\u227B~SucceedsEqual~\u2AB0~SucceedsSlantEqual~\u227D~SucceedsTilde~\u227F~SuchThat~\u220B~Sum~\u2211~Sup~\u22D1~Superset~\u2283~SupersetEqual~\u2287~Supset~\u22D1~TRADE~\u2122~TSHcy~\u040B~TScy~\u0426~Tab~	~Tcaron~\u0164~Tcedil~\u0162~Tcy~\u0422~Tfr~\u{1D517}~Therefore~\u2234~ThickSpace~\u205F\u200A~ThinSpace~\u2009~Tilde~\u223C~TildeEqual~\u2243~TildeFullEqual~\u2245~TildeTilde~\u2248~Topf~\u{1D54B}~TripleDot~\u20DB~Tscr~\u{1D4AF}~Tstrok~\u0166~Uarr~\u219F~Uarrocir~\u2949~Ubrcy~\u040E~Ubreve~\u016C~Ucy~\u0423~Udblac~\u0170~Ufr~\u{1D518}~Umacr~\u016A~UnderBar~_~UnderBrace~\u23DF~UnderBracket~\u23B5~UnderParenthesis~\u23DD~Union~\u22C3~UnionPlus~\u228E~Uogon~\u0172~Uopf~\u{1D54C}~UpArrow~\u2191~UpArrowBar~\u2912~UpArrowDownArrow~\u21C5~UpDownArrow~\u2195~UpEquilibrium~\u296E~UpTee~\u22A5~UpTeeArrow~\u21A5~Uparrow~\u21D1~Updownarrow~\u21D5~UpperLeftArrow~\u2196~UpperRightArrow~\u2197~Upsi~\u03D2~Uring~\u016E~Uscr~\u{1D4B0}~Utilde~\u0168~VDash~\u22AB~Vbar~\u2AEB~Vcy~\u0412~Vdash~\u22A9~Vdashl~\u2AE6~Vee~\u22C1~Verbar~\u2016~Vert~\u2016~VerticalBar~\u2223~VerticalLine~|~VerticalSeparator~\u2758~VerticalTilde~\u2240~VeryThinSpace~\u200A~Vfr~\u{1D519}~Vopf~\u{1D54D}~Vscr~\u{1D4B1}~Vvdash~\u22AA~Wcirc~\u0174~Wedge~\u22C0~Wfr~\u{1D51A}~Wopf~\u{1D54E}~Wscr~\u{1D4B2}~Xfr~\u{1D51B}~Xopf~\u{1D54F}~Xscr~\u{1D4B3}~YAcy~\u042F~YIcy~\u0407~YUcy~\u042E~Ycirc~\u0176~Ycy~\u042B~Yfr~\u{1D51C}~Yopf~\u{1D550}~Yscr~\u{1D4B4}~ZHcy~\u0416~Zacute~\u0179~Zcaron~\u017D~Zcy~\u0417~Zdot~\u017B~ZeroWidthSpace~\u200B~Zfr~\u2128~Zopf~\u2124~Zscr~\u{1D4B5}~abreve~\u0103~ac~\u223E~acE~\u223E\u0333~acd~\u223F~acy~\u0430~af~\u2061~afr~\u{1D51E}~aleph~\u2135~amacr~\u0101~amalg~\u2A3F~andand~\u2A55~andd~\u2A5C~andslope~\u2A58~andv~\u2A5A~ange~\u29A4~angle~\u2220~angmsd~\u2221~angmsdaa~\u29A8~angmsdab~\u29A9~angmsdac~\u29AA~angmsdad~\u29AB~angmsdae~\u29AC~angmsdaf~\u29AD~angmsdag~\u29AE~angmsdah~\u29AF~angrt~\u221F~angrtvb~\u22BE~angrtvbd~\u299D~angsph~\u2222~angst~\xC5~angzarr~\u237C~aogon~\u0105~aopf~\u{1D552}~ap~\u2248~apE~\u2A70~apacir~\u2A6F~ape~\u224A~apid~\u224B~approx~\u2248~approxeq~\u224A~ascr~\u{1D4B6}~ast~*~asympeq~\u224D~awconint~\u2233~awint~\u2A11~bNot~\u2AED~backcong~\u224C~backepsilon~\u03F6~backprime~\u2035~backsim~\u223D~backsimeq~\u22CD~barvee~\u22BD~barwed~\u2305~barwedge~\u2305~bbrk~\u23B5~bbrktbrk~\u23B6~bcong~\u224C~bcy~\u0431~becaus~\u2235~because~\u2235~bemptyv~\u29B0~bepsi~\u03F6~bernou~\u212C~beth~\u2136~between~\u226C~bfr~\u{1D51F}~bigcap~\u22C2~bigcirc~\u25EF~bigcup~\u22C3~bigodot~\u2A00~bigoplus~\u2A01~bigotimes~\u2A02~bigsqcup~\u2A06~bigstar~\u2605~bigtriangledown~\u25BD~bigtriangleup~\u25B3~biguplus~\u2A04~bigvee~\u22C1~bigwedge~\u22C0~bkarow~\u290D~blacklozenge~\u29EB~blacksquare~\u25AA~blacktriangle~\u25B4~blacktriangledown~\u25BE~blacktriangleleft~\u25C2~blacktriangleright~\u25B8~blank~\u2423~blk12~\u2592~blk14~\u2591~blk34~\u2593~block~\u2588~bne~=\u20E5~bnequiv~\u2261\u20E5~bnot~\u2310~bopf~\u{1D553}~bot~\u22A5~bottom~\u22A5~bowtie~\u22C8~boxDL~\u2557~boxDR~\u2554~boxDl~\u2556~boxDr~\u2553~boxH~\u2550~boxHD~\u2566~boxHU~\u2569~boxHd~\u2564~boxHu~\u2567~boxUL~\u255D~boxUR~\u255A~boxUl~\u255C~boxUr~\u2559~boxV~\u2551~boxVH~\u256C~boxVL~\u2563~boxVR~\u2560~boxVh~\u256B~boxVl~\u2562~boxVr~\u255F~boxbox~\u29C9~boxdL~\u2555~boxdR~\u2552~boxdl~\u2510~boxdr~\u250C~boxh~\u2500~boxhD~\u2565~boxhU~\u2568~boxhd~\u252C~boxhu~\u2534~boxminus~\u229F~boxplus~\u229E~boxtimes~\u22A0~boxuL~\u255B~boxuR~\u2558~boxul~\u2518~boxur~\u2514~boxv~\u2502~boxvH~\u256A~boxvL~\u2561~boxvR~\u255E~boxvh~\u253C~boxvl~\u2524~boxvr~\u251C~bprime~\u2035~breve~\u02D8~bscr~\u{1D4B7}~bsemi~\u204F~bsim~\u223D~bsime~\u22CD~bsol~\\~bsolb~\u29C5~bsolhsub~\u27C8~bullet~\u2022~bump~\u224E~bumpE~\u2AAE~bumpe~\u224F~bumpeq~\u224F~cacute~\u0107~capand~\u2A44~capbrcup~\u2A49~capcap~\u2A4B~capcup~\u2A47~capdot~\u2A40~caps~\u2229\uFE00~caret~\u2041~caron~\u02C7~ccaps~\u2A4D~ccaron~\u010D~ccirc~\u0109~ccups~\u2A4C~ccupssm~\u2A50~cdot~\u010B~cemptyv~\u29B2~centerdot~\xB7~cfr~\u{1D520}~chcy~\u0447~check~\u2713~checkmark~\u2713~cir~\u25CB~cirE~\u29C3~circeq~\u2257~circlearrowleft~\u21BA~circlearrowright~\u21BB~circledR~\xAE~circledS~\u24C8~circledast~\u229B~circledcirc~\u229A~circleddash~\u229D~cire~\u2257~cirfnint~\u2A10~cirmid~\u2AEF~cirscir~\u29C2~clubsuit~\u2663~colon~:~colone~\u2254~coloneq~\u2254~comma~,~commat~@~comp~\u2201~compfn~\u2218~complement~\u2201~complexes~\u2102~congdot~\u2A6D~conint~\u222E~copf~\u{1D554}~coprod~\u2210~copysr~\u2117~cross~\u2717~cscr~\u{1D4B8}~csub~\u2ACF~csube~\u2AD1~csup~\u2AD0~csupe~\u2AD2~ctdot~\u22EF~cudarrl~\u2938~cudarrr~\u2935~cuepr~\u22DE~cuesc~\u22DF~cularr~\u21B6~cularrp~\u293D~cupbrcap~\u2A48~cupcap~\u2A46~cupcup~\u2A4A~cupdot~\u228D~cupor~\u2A45~cups~\u222A\uFE00~curarr~\u21B7~curarrm~\u293C~curlyeqprec~\u22DE~curlyeqsucc~\u22DF~curlyvee~\u22CE~curlywedge~\u22CF~curvearrowleft~\u21B6~curvearrowright~\u21B7~cuvee~\u22CE~cuwed~\u22CF~cwconint~\u2232~cwint~\u2231~cylcty~\u232D~dHar~\u2965~daleth~\u2138~dash~\u2010~dashv~\u22A3~dbkarow~\u290F~dblac~\u02DD~dcaron~\u010F~dcy~\u0434~dd~\u2146~ddagger~\u2021~ddarr~\u21CA~ddotseq~\u2A77~demptyv~\u29B1~dfisht~\u297F~dfr~\u{1D521}~dharl~\u21C3~dharr~\u21C2~diam~\u22C4~diamond~\u22C4~diamondsuit~\u2666~die~\xA8~digamma~\u03DD~disin~\u22F2~div~\xF7~divideontimes~\u22C7~divonx~\u22C7~djcy~\u0452~dlcorn~\u231E~dlcrop~\u230D~dollar~$~dopf~\u{1D555}~dot~\u02D9~doteq~\u2250~doteqdot~\u2251~dotminus~\u2238~dotplus~\u2214~dotsquare~\u22A1~doublebarwedge~\u2306~downarrow~\u2193~downdownarrows~\u21CA~downharpoonleft~\u21C3~downharpoonright~\u21C2~drbkarow~\u2910~drcorn~\u231F~drcrop~\u230C~dscr~\u{1D4B9}~dscy~\u0455~dsol~\u29F6~dstrok~\u0111~dtdot~\u22F1~dtri~\u25BF~dtrif~\u25BE~duarr~\u21F5~duhar~\u296F~dwangle~\u29A6~dzcy~\u045F~dzigrarr~\u27FF~eDDot~\u2A77~eDot~\u2251~easter~\u2A6E~ecaron~\u011B~ecir~\u2256~ecolon~\u2255~ecy~\u044D~edot~\u0117~ee~\u2147~efDot~\u2252~efr~\u{1D522}~eg~\u2A9A~egs~\u2A96~egsdot~\u2A98~el~\u2A99~elinters~\u23E7~ell~\u2113~els~\u2A95~elsdot~\u2A97~emacr~\u0113~emptyset~\u2205~emptyv~\u2205~emsp13~\u2004~emsp14~\u2005~eng~\u014B~eogon~\u0119~eopf~\u{1D556}~epar~\u22D5~eparsl~\u29E3~eplus~\u2A71~epsi~\u03B5~epsiv~\u03F5~eqcirc~\u2256~eqcolon~\u2255~eqsim~\u2242~eqslantgtr~\u2A96~eqslantless~\u2A95~equals~=~equest~\u225F~equivDD~\u2A78~eqvparsl~\u29E5~erDot~\u2253~erarr~\u2971~escr~\u212F~esdot~\u2250~esim~\u2242~excl~!~expectation~\u2130~exponentiale~\u2147~fallingdotseq~\u2252~fcy~\u0444~female~\u2640~ffilig~\uFB03~fflig~\uFB00~ffllig~\uFB04~ffr~\u{1D523}~filig~\uFB01~fjlig~fj~flat~\u266D~fllig~\uFB02~fltns~\u25B1~fopf~\u{1D557}~fork~\u22D4~forkv~\u2AD9~fpartint~\u2A0D~frac13~\u2153~frac15~\u2155~frac16~\u2159~frac18~\u215B~frac23~\u2154~frac25~\u2156~frac35~\u2157~frac38~\u215C~frac45~\u2158~frac56~\u215A~frac58~\u215D~frac78~\u215E~frown~\u2322~fscr~\u{1D4BB}~gE~\u2267~gEl~\u2A8C~gacute~\u01F5~gammad~\u03DD~gap~\u2A86~gbreve~\u011F~gcirc~\u011D~gcy~\u0433~gdot~\u0121~gel~\u22DB~geq~\u2265~geqq~\u2267~geqslant~\u2A7E~ges~\u2A7E~gescc~\u2AA9~gesdot~\u2A80~gesdoto~\u2A82~gesdotol~\u2A84~gesl~\u22DB\uFE00~gesles~\u2A94~gfr~\u{1D524}~gg~\u226B~ggg~\u22D9~gimel~\u2137~gjcy~\u0453~gl~\u2277~glE~\u2A92~gla~\u2AA5~glj~\u2AA4~gnE~\u2269~gnap~\u2A8A~gnapprox~\u2A8A~gne~\u2A88~gneq~\u2A88~gneqq~\u2269~gnsim~\u22E7~gopf~\u{1D558}~grave~`~gscr~\u210A~gsim~\u2273~gsime~\u2A8E~gsiml~\u2A90~gtcc~\u2AA7~gtcir~\u2A7A~gtdot~\u22D7~gtlPar~\u2995~gtquest~\u2A7C~gtrapprox~\u2A86~gtrarr~\u2978~gtrdot~\u22D7~gtreqless~\u22DB~gtreqqless~\u2A8C~gtrless~\u2277~gtrsim~\u2273~gvertneqq~\u2269\uFE00~gvnE~\u2269\uFE00~hairsp~\u200A~half~\xBD~hamilt~\u210B~hardcy~\u044A~harrcir~\u2948~harrw~\u21AD~hbar~\u210F~hcirc~\u0125~heartsuit~\u2665~hercon~\u22B9~hfr~\u{1D525}~hksearow~\u2925~hkswarow~\u2926~hoarr~\u21FF~homtht~\u223B~hookleftarrow~\u21A9~hookrightarrow~\u21AA~hopf~\u{1D559}~horbar~\u2015~hscr~\u{1D4BD}~hslash~\u210F~hstrok~\u0127~hybull~\u2043~hyphen~\u2010~ic~\u2063~icy~\u0438~iecy~\u0435~iff~\u21D4~ifr~\u{1D526}~ii~\u2148~iiiint~\u2A0C~iiint~\u222D~iinfin~\u29DC~iiota~\u2129~ijlig~\u0133~imacr~\u012B~imagline~\u2110~imagpart~\u2111~imath~\u0131~imof~\u22B7~imped~\u01B5~in~\u2208~incare~\u2105~infintie~\u29DD~inodot~\u0131~intcal~\u22BA~integers~\u2124~intercal~\u22BA~intlarhk~\u2A17~intprod~\u2A3C~iocy~\u0451~iogon~\u012F~iopf~\u{1D55A}~iprod~\u2A3C~iscr~\u{1D4BE}~isinE~\u22F9~isindot~\u22F5~isins~\u22F4~isinsv~\u22F3~isinv~\u2208~it~\u2062~itilde~\u0129~iukcy~\u0456~jcirc~\u0135~jcy~\u0439~jfr~\u{1D527}~jmath~\u0237~jopf~\u{1D55B}~jscr~\u{1D4BF}~jsercy~\u0458~jukcy~\u0454~kappav~\u03F0~kcedil~\u0137~kcy~\u043A~kfr~\u{1D528}~kgreen~\u0138~khcy~\u0445~kjcy~\u045C~kopf~\u{1D55C}~kscr~\u{1D4C0}~lAarr~\u21DA~lAtail~\u291B~lBarr~\u290E~lE~\u2266~lEg~\u2A8B~lHar~\u2962~lacute~\u013A~laemptyv~\u29B4~lagran~\u2112~langd~\u2991~langle~\u27E8~lap~\u2A85~larrb~\u21E4~larrbfs~\u291F~larrfs~\u291D~larrhk~\u21A9~larrlp~\u21AB~larrpl~\u2939~larrsim~\u2973~larrtl~\u21A2~lat~\u2AAB~latail~\u2919~late~\u2AAD~lates~\u2AAD\uFE00~lbarr~\u290C~lbbrk~\u2772~lbrace~{~lbrack~[~lbrke~\u298B~lbrksld~\u298F~lbrkslu~\u298D~lcaron~\u013E~lcedil~\u013C~lcub~{~lcy~\u043B~ldca~\u2936~ldquor~\u201E~ldrdhar~\u2967~ldrushar~\u294B~ldsh~\u21B2~leftarrow~\u2190~leftarrowtail~\u21A2~leftharpoondown~\u21BD~leftharpoonup~\u21BC~leftleftarrows~\u21C7~leftrightarrow~\u2194~leftrightarrows~\u21C6~leftrightharpoons~\u21CB~leftrightsquigarrow~\u21AD~leftthreetimes~\u22CB~leg~\u22DA~leq~\u2264~leqq~\u2266~leqslant~\u2A7D~les~\u2A7D~lescc~\u2AA8~lesdot~\u2A7F~lesdoto~\u2A81~lesdotor~\u2A83~lesg~\u22DA\uFE00~lesges~\u2A93~lessapprox~\u2A85~lessdot~\u22D6~lesseqgtr~\u22DA~lesseqqgtr~\u2A8B~lessgtr~\u2276~lesssim~\u2272~lfisht~\u297C~lfr~\u{1D529}~lg~\u2276~lgE~\u2A91~lhard~\u21BD~lharu~\u21BC~lharul~\u296A~lhblk~\u2584~ljcy~\u0459~ll~\u226A~llarr~\u21C7~llcorner~\u231E~llhard~\u296B~lltri~\u25FA~lmidot~\u0140~lmoust~\u23B0~lmoustache~\u23B0~lnE~\u2268~lnap~\u2A89~lnapprox~\u2A89~lne~\u2A87~lneq~\u2A87~lneqq~\u2268~lnsim~\u22E6~loang~\u27EC~loarr~\u21FD~lobrk~\u27E6~longleftarrow~\u27F5~longleftrightarrow~\u27F7~longmapsto~\u27FC~longrightarrow~\u27F6~looparrowleft~\u21AB~looparrowright~\u21AC~lopar~\u2985~lopf~\u{1D55D}~loplus~\u2A2D~lotimes~\u2A34~lowbar~_~lozenge~\u25CA~lozf~\u29EB~lpar~(~lparlt~\u2993~lrarr~\u21C6~lrcorner~\u231F~lrhar~\u21CB~lrhard~\u296D~lrtri~\u22BF~lscr~\u{1D4C1}~lsh~\u21B0~lsim~\u2272~lsime~\u2A8D~lsimg~\u2A8F~lsqb~[~lsquor~\u201A~lstrok~\u0142~ltcc~\u2AA6~ltcir~\u2A79~ltdot~\u22D6~lthree~\u22CB~ltimes~\u22C9~ltlarr~\u2976~ltquest~\u2A7B~ltrPar~\u2996~ltri~\u25C3~ltrie~\u22B4~ltrif~\u25C2~lurdshar~\u294A~luruhar~\u2966~lvertneqq~\u2268\uFE00~lvnE~\u2268\uFE00~mDDot~\u223A~male~\u2642~malt~\u2720~maltese~\u2720~map~\u21A6~mapsto~\u21A6~mapstodown~\u21A7~mapstoleft~\u21A4~mapstoup~\u21A5~marker~\u25AE~mcomma~\u2A29~mcy~\u043C~measuredangle~\u2221~mfr~\u{1D52A}~mho~\u2127~mid~\u2223~midast~*~midcir~\u2AF0~minusb~\u229F~minusd~\u2238~minusdu~\u2A2A~mlcp~\u2ADB~mldr~\u2026~mnplus~\u2213~models~\u22A7~mopf~\u{1D55E}~mp~\u2213~mscr~\u{1D4C2}~mstpos~\u223E~multimap~\u22B8~mumap~\u22B8~nGg~\u22D9\u0338~nGt~\u226B\u20D2~nGtv~\u226B\u0338~nLeftarrow~\u21CD~nLeftrightarrow~\u21CE~nLl~\u22D8\u0338~nLt~\u226A\u20D2~nLtv~\u226A\u0338~nRightarrow~\u21CF~nVDash~\u22AF~nVdash~\u22AE~nacute~\u0144~nang~\u2220\u20D2~nap~\u2249~napE~\u2A70\u0338~napid~\u224B\u0338~napos~\u0149~napprox~\u2249~natur~\u266E~natural~\u266E~naturals~\u2115~nbump~\u224E\u0338~nbumpe~\u224F\u0338~ncap~\u2A43~ncaron~\u0148~ncedil~\u0146~ncong~\u2247~ncongdot~\u2A6D\u0338~ncup~\u2A42~ncy~\u043D~neArr~\u21D7~nearhk~\u2924~nearr~\u2197~nearrow~\u2197~nedot~\u2250\u0338~nequiv~\u2262~nesear~\u2928~nesim~\u2242\u0338~nexist~\u2204~nexists~\u2204~nfr~\u{1D52B}~ngE~\u2267\u0338~nge~\u2271~ngeq~\u2271~ngeqq~\u2267\u0338~ngeqslant~\u2A7E\u0338~nges~\u2A7E\u0338~ngsim~\u2275~ngt~\u226F~ngtr~\u226F~nhArr~\u21CE~nharr~\u21AE~nhpar~\u2AF2~nis~\u22FC~nisd~\u22FA~niv~\u220B~njcy~\u045A~nlArr~\u21CD~nlE~\u2266\u0338~nlarr~\u219A~nldr~\u2025~nle~\u2270~nleftarrow~\u219A~nleftrightarrow~\u21AE~nleq~\u2270~nleqq~\u2266\u0338~nleqslant~\u2A7D\u0338~nles~\u2A7D\u0338~nless~\u226E~nlsim~\u2274~nlt~\u226E~nltri~\u22EA~nltrie~\u22EC~nmid~\u2224~nopf~\u{1D55F}~notinE~\u22F9\u0338~notindot~\u22F5\u0338~notinva~\u2209~notinvb~\u22F7~notinvc~\u22F6~notni~\u220C~notniva~\u220C~notnivb~\u22FE~notnivc~\u22FD~npar~\u2226~nparallel~\u2226~nparsl~\u2AFD\u20E5~npart~\u2202\u0338~npolint~\u2A14~npr~\u2280~nprcue~\u22E0~npre~\u2AAF\u0338~nprec~\u2280~npreceq~\u2AAF\u0338~nrArr~\u21CF~nrarr~\u219B~nrarrc~\u2933\u0338~nrarrw~\u219D\u0338~nrightarrow~\u219B~nrtri~\u22EB~nrtrie~\u22ED~nsc~\u2281~nsccue~\u22E1~nsce~\u2AB0\u0338~nscr~\u{1D4C3}~nshortmid~\u2224~nshortparallel~\u2226~nsim~\u2241~nsime~\u2244~nsimeq~\u2244~nsmid~\u2224~nspar~\u2226~nsqsube~\u22E2~nsqsupe~\u22E3~nsubE~\u2AC5\u0338~nsube~\u2288~nsubset~\u2282\u20D2~nsubseteq~\u2288~nsubseteqq~\u2AC5\u0338~nsucc~\u2281~nsucceq~\u2AB0\u0338~nsup~\u2285~nsupE~\u2AC6\u0338~nsupe~\u2289~nsupset~\u2283\u20D2~nsupseteq~\u2289~nsupseteqq~\u2AC6\u0338~ntgl~\u2279~ntlg~\u2278~ntriangleleft~\u22EA~ntrianglelefteq~\u22EC~ntriangleright~\u22EB~ntrianglerighteq~\u22ED~num~#~numero~\u2116~numsp~\u2007~nvDash~\u22AD~nvHarr~\u2904~nvap~\u224D\u20D2~nvdash~\u22AC~nvge~\u2265\u20D2~nvgt~>\u20D2~nvinfin~\u29DE~nvlArr~\u2902~nvle~\u2264\u20D2~nvlt~<\u20D2~nvltrie~\u22B4\u20D2~nvrArr~\u2903~nvrtrie~\u22B5\u20D2~nvsim~\u223C\u20D2~nwArr~\u21D6~nwarhk~\u2923~nwarr~\u2196~nwarrow~\u2196~nwnear~\u2927~oS~\u24C8~oast~\u229B~ocir~\u229A~ocy~\u043E~odash~\u229D~odblac~\u0151~odiv~\u2A38~odot~\u2299~odsold~\u29BC~ofcir~\u29BF~ofr~\u{1D52C}~ogon~\u02DB~ogt~\u29C1~ohbar~\u29B5~ohm~\u03A9~oint~\u222E~olarr~\u21BA~olcir~\u29BE~olcross~\u29BB~olt~\u29C0~omacr~\u014D~omid~\u29B6~ominus~\u2296~oopf~\u{1D560}~opar~\u29B7~operp~\u29B9~orarr~\u21BB~ord~\u2A5D~order~\u2134~orderof~\u2134~origof~\u22B6~oror~\u2A56~orslope~\u2A57~orv~\u2A5B~oscr~\u2134~osol~\u2298~otimesas~\u2A36~ovbar~\u233D~par~\u2225~parallel~\u2225~parsim~\u2AF3~parsl~\u2AFD~pcy~\u043F~percnt~%~period~.~pertenk~\u2031~pfr~\u{1D52D}~phiv~\u03D5~phmmat~\u2133~phone~\u260E~pitchfork~\u22D4~planck~\u210F~planckh~\u210E~plankv~\u210F~plus~+~plusacir~\u2A23~plusb~\u229E~pluscir~\u2A22~plusdo~\u2214~plusdu~\u2A25~pluse~\u2A72~plussim~\u2A26~plustwo~\u2A27~pm~\xB1~pointint~\u2A15~popf~\u{1D561}~pr~\u227A~prE~\u2AB3~prap~\u2AB7~prcue~\u227C~pre~\u2AAF~prec~\u227A~precapprox~\u2AB7~preccurlyeq~\u227C~preceq~\u2AAF~precnapprox~\u2AB9~precneqq~\u2AB5~precnsim~\u22E8~precsim~\u227E~primes~\u2119~prnE~\u2AB5~prnap~\u2AB9~prnsim~\u22E8~profalar~\u232E~profline~\u2312~profsurf~\u2313~propto~\u221D~prsim~\u227E~prurel~\u22B0~pscr~\u{1D4C5}~puncsp~\u2008~qfr~\u{1D52E}~qint~\u2A0C~qopf~\u{1D562}~qprime~\u2057~qscr~\u{1D4C6}~quaternions~\u210D~quatint~\u2A16~quest~?~questeq~\u225F~rAarr~\u21DB~rAtail~\u291C~rBarr~\u290F~rHar~\u2964~race~\u223D\u0331~racute~\u0155~raemptyv~\u29B3~rangd~\u2992~range~\u29A5~rangle~\u27E9~rarrap~\u2975~rarrb~\u21E5~rarrbfs~\u2920~rarrc~\u2933~rarrfs~\u291E~rarrhk~\u21AA~rarrlp~\u21AC~rarrpl~\u2945~rarrsim~\u2974~rarrtl~\u21A3~rarrw~\u219D~ratail~\u291A~ratio~\u2236~rationals~\u211A~rbarr~\u290D~rbbrk~\u2773~rbrace~}~rbrack~]~rbrke~\u298C~rbrksld~\u298E~rbrkslu~\u2990~rcaron~\u0159~rcedil~\u0157~rcub~}~rcy~\u0440~rdca~\u2937~rdldhar~\u2969~rdquor~\u201D~rdsh~\u21B3~realine~\u211B~realpart~\u211C~reals~\u211D~rect~\u25AD~rfisht~\u297D~rfr~\u{1D52F}~rhard~\u21C1~rharu~\u21C0~rharul~\u296C~rhov~\u03F1~rightarrow~\u2192~rightarrowtail~\u21A3~rightharpoondown~\u21C1~rightharpoonup~\u21C0~rightleftarrows~\u21C4~rightleftharpoons~\u21CC~rightrightarrows~\u21C9~rightsquigarrow~\u219D~rightthreetimes~\u22CC~ring~\u02DA~risingdotseq~\u2253~rlarr~\u21C4~rlhar~\u21CC~rmoust~\u23B1~rmoustache~\u23B1~rnmid~\u2AEE~roang~\u27ED~roarr~\u21FE~robrk~\u27E7~ropar~\u2986~ropf~\u{1D563}~roplus~\u2A2E~rotimes~\u2A35~rpar~)~rpargt~\u2994~rppolint~\u2A12~rrarr~\u21C9~rscr~\u{1D4C7}~rsh~\u21B1~rsqb~]~rsquor~\u2019~rthree~\u22CC~rtimes~\u22CA~rtri~\u25B9~rtrie~\u22B5~rtrif~\u25B8~rtriltri~\u29CE~ruluhar~\u2968~rx~\u211E~sacute~\u015B~sc~\u227B~scE~\u2AB4~scap~\u2AB8~sccue~\u227D~sce~\u2AB0~scedil~\u015F~scirc~\u015D~scnE~\u2AB6~scnap~\u2ABA~scnsim~\u22E9~scpolint~\u2A13~scsim~\u227F~scy~\u0441~sdotb~\u22A1~sdote~\u2A66~seArr~\u21D8~searhk~\u2925~searr~\u2198~searrow~\u2198~semi~;~seswar~\u2929~setminus~\u2216~setmn~\u2216~sext~\u2736~sfr~\u{1D530}~sfrown~\u2322~sharp~\u266F~shchcy~\u0449~shcy~\u0448~shortmid~\u2223~shortparallel~\u2225~sigmav~\u03C2~simdot~\u2A6A~sime~\u2243~simeq~\u2243~simg~\u2A9E~simgE~\u2AA0~siml~\u2A9D~simlE~\u2A9F~simne~\u2246~simplus~\u2A24~simrarr~\u2972~slarr~\u2190~smallsetminus~\u2216~smashp~\u2A33~smeparsl~\u29E4~smid~\u2223~smile~\u2323~smt~\u2AAA~smte~\u2AAC~smtes~\u2AAC\uFE00~softcy~\u044C~sol~/~solb~\u29C4~solbar~\u233F~sopf~\u{1D564}~spadesuit~\u2660~spar~\u2225~sqcap~\u2293~sqcaps~\u2293\uFE00~sqcup~\u2294~sqcups~\u2294\uFE00~sqsub~\u228F~sqsube~\u2291~sqsubset~\u228F~sqsubseteq~\u2291~sqsup~\u2290~sqsupe~\u2292~sqsupset~\u2290~sqsupseteq~\u2292~squ~\u25A1~square~\u25A1~squarf~\u25AA~squf~\u25AA~srarr~\u2192~sscr~\u{1D4C8}~ssetmn~\u2216~ssmile~\u2323~sstarf~\u22C6~star~\u2606~starf~\u2605~straightepsilon~\u03F5~straightphi~\u03D5~strns~\xAF~subE~\u2AC5~subdot~\u2ABD~subedot~\u2AC3~submult~\u2AC1~subnE~\u2ACB~subne~\u228A~subplus~\u2ABF~subrarr~\u2979~subset~\u2282~subseteq~\u2286~subseteqq~\u2AC5~subsetneq~\u228A~subsetneqq~\u2ACB~subsim~\u2AC7~subsub~\u2AD5~subsup~\u2AD3~succ~\u227B~succapprox~\u2AB8~succcurlyeq~\u227D~succeq~\u2AB0~succnapprox~\u2ABA~succneqq~\u2AB6~succnsim~\u22E9~succsim~\u227F~sung~\u266A~supE~\u2AC6~supdot~\u2ABE~supdsub~\u2AD8~supedot~\u2AC4~suphsol~\u27C9~suphsub~\u2AD7~suplarr~\u297B~supmult~\u2AC2~supnE~\u2ACC~supne~\u228B~supplus~\u2AC0~supset~\u2283~supseteq~\u2287~supseteqq~\u2AC6~supsetneq~\u228B~supsetneqq~\u2ACC~supsim~\u2AC8~supsub~\u2AD4~supsup~\u2AD6~swArr~\u21D9~swarhk~\u2926~swarr~\u2199~swarrow~\u2199~swnwar~\u292A~target~\u2316~tbrk~\u23B4~tcaron~\u0165~tcedil~\u0163~tcy~\u0442~tdot~\u20DB~telrec~\u2315~tfr~\u{1D531}~therefore~\u2234~thetav~\u03D1~thickapprox~\u2248~thicksim~\u223C~thkap~\u2248~thksim~\u223C~timesb~\u22A0~timesbar~\u2A31~timesd~\u2A30~tint~\u222D~toea~\u2928~top~\u22A4~topbot~\u2336~topcir~\u2AF1~topf~\u{1D565}~topfork~\u2ADA~tosa~\u2929~tprime~\u2034~triangle~\u25B5~triangledown~\u25BF~triangleleft~\u25C3~trianglelefteq~\u22B4~triangleq~\u225C~triangleright~\u25B9~trianglerighteq~\u22B5~tridot~\u25EC~trie~\u225C~triminus~\u2A3A~triplus~\u2A39~trisb~\u29CD~tritime~\u2A3B~trpezium~\u23E2~tscr~\u{1D4C9}~tscy~\u0446~tshcy~\u045B~tstrok~\u0167~twixt~\u226C~twoheadleftarrow~\u219E~twoheadrightarrow~\u21A0~uHar~\u2963~ubrcy~\u045E~ubreve~\u016D~ucy~\u0443~udarr~\u21C5~udblac~\u0171~udhar~\u296E~ufisht~\u297E~ufr~\u{1D532}~uharl~\u21BF~uharr~\u21BE~uhblk~\u2580~ulcorn~\u231C~ulcorner~\u231C~ulcrop~\u230F~ultri~\u25F8~umacr~\u016B~uogon~\u0173~uopf~\u{1D566}~uparrow~\u2191~updownarrow~\u2195~upharpoonleft~\u21BF~upharpoonright~\u21BE~uplus~\u228E~upsi~\u03C5~upuparrows~\u21C8~urcorn~\u231D~urcorner~\u231D~urcrop~\u230E~uring~\u016F~urtri~\u25F9~uscr~\u{1D4CA}~utdot~\u22F0~utilde~\u0169~utri~\u25B5~utrif~\u25B4~uuarr~\u21C8~uwangle~\u29A7~vArr~\u21D5~vBar~\u2AE8~vBarv~\u2AE9~vDash~\u22A8~vangrt~\u299C~varepsilon~\u03F5~varkappa~\u03F0~varnothing~\u2205~varphi~\u03D5~varpi~\u03D6~varpropto~\u221D~varr~\u2195~varrho~\u03F1~varsigma~\u03C2~varsubsetneq~\u228A\uFE00~varsubsetneqq~\u2ACB\uFE00~varsupsetneq~\u228B\uFE00~varsupsetneqq~\u2ACC\uFE00~vartheta~\u03D1~vartriangleleft~\u22B2~vartriangleright~\u22B3~vcy~\u0432~vdash~\u22A2~vee~\u2228~veebar~\u22BB~veeeq~\u225A~vellip~\u22EE~verbar~|~vert~|~vfr~\u{1D533}~vltri~\u22B2~vnsub~\u2282\u20D2~vnsup~\u2283\u20D2~vopf~\u{1D567}~vprop~\u221D~vrtri~\u22B3~vscr~\u{1D4CB}~vsubnE~\u2ACB\uFE00~vsubne~\u228A\uFE00~vsupnE~\u2ACC\uFE00~vsupne~\u228B\uFE00~vzigzag~\u299A~wcirc~\u0175~wedbar~\u2A5F~wedge~\u2227~wedgeq~\u2259~wfr~\u{1D534}~wopf~\u{1D568}~wp~\u2118~wr~\u2240~wreath~\u2240~wscr~\u{1D4CC}~xcap~\u22C2~xcirc~\u25EF~xcup~\u22C3~xdtri~\u25BD~xfr~\u{1D535}~xhArr~\u27FA~xharr~\u27F7~xlArr~\u27F8~xlarr~\u27F5~xmap~\u27FC~xnis~\u22FB~xodot~\u2A00~xopf~\u{1D569}~xoplus~\u2A01~xotime~\u2A02~xrArr~\u27F9~xrarr~\u27F6~xscr~\u{1D4CD}~xsqcup~\u2A06~xuplus~\u2A04~xutri~\u25B3~xvee~\u22C1~xwedge~\u22C0~yacy~\u044F~ycirc~\u0177~ycy~\u044B~yfr~\u{1D536}~yicy~\u0457~yopf~\u{1D56A}~yscr~\u{1D4CE}~yucy~\u044E~zacute~\u017A~zcaron~\u017E~zcy~\u0437~zdot~\u017C~zeetrf~\u2128~zfr~\u{1D537}~zhcy~\u0436~zigrarr~\u21DD~zopf~\u{1D56B}~zscr~\u{1D4CF}~~AMP~&~COPY~\xA9~GT~>~LT~<~QUOT~"~REG~\xAE', namedReferences["html4"]);

  // node_modules/.pnpm/html-entities@2.6.0/node_modules/html-entities/dist/esm/numeric-unicode-map.js
  var numericUnicodeMap = {
    0: 65533,
    128: 8364,
    130: 8218,
    131: 402,
    132: 8222,
    133: 8230,
    134: 8224,
    135: 8225,
    136: 710,
    137: 8240,
    138: 352,
    139: 8249,
    140: 338,
    142: 381,
    145: 8216,
    146: 8217,
    147: 8220,
    148: 8221,
    149: 8226,
    150: 8211,
    151: 8212,
    152: 732,
    153: 8482,
    154: 353,
    155: 8250,
    156: 339,
    158: 382,
    159: 376
  };

  // node_modules/.pnpm/html-entities@2.6.0/node_modules/html-entities/dist/esm/surrogate-pairs.js
  var fromCodePoint = String.fromCodePoint || function(astralCodePoint) {
    return String.fromCharCode(Math.floor((astralCodePoint - 65536) / 1024) + 55296, (astralCodePoint - 65536) % 1024 + 56320);
  };
  var getCodePoint = String.prototype.codePointAt ? function(input, position) {
    return input.codePointAt(position);
  } : function(input, position) {
    return (input.charCodeAt(position) - 55296) * 1024 + input.charCodeAt(position + 1) - 56320 + 65536;
  };

  // node_modules/.pnpm/html-entities@2.6.0/node_modules/html-entities/dist/esm/index.js
  var __assign2 = function() {
    __assign2 = Object.assign || function(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
          t[p] = s[p];
      }
      return t;
    };
    return __assign2.apply(this, arguments);
  };
  var allNamedReferences = __assign2(__assign2({}, namedReferences), { all: namedReferences.html5 });
  var defaultDecodeOptions = {
    scope: "body",
    level: "all"
  };
  var strict = /&(?:#\d+|#[xX][\da-fA-F]+|[0-9a-zA-Z]+);/g;
  var attribute = /&(?:#\d+|#[xX][\da-fA-F]+|[0-9a-zA-Z]+)[;=]?/g;
  var baseDecodeRegExps = {
    xml: {
      strict,
      attribute,
      body: bodyRegExps.xml
    },
    html4: {
      strict,
      attribute,
      body: bodyRegExps.html4
    },
    html5: {
      strict,
      attribute,
      body: bodyRegExps.html5
    }
  };
  var decodeRegExps = __assign2(__assign2({}, baseDecodeRegExps), { all: baseDecodeRegExps.html5 });
  var fromCharCode = String.fromCharCode;
  var outOfBoundsChar = fromCharCode(65533);
  function getDecodedEntity(entity, references, isAttribute, isStrict) {
    var decodeResult = entity;
    var decodeEntityLastChar = entity[entity.length - 1];
    if (isAttribute && decodeEntityLastChar === "=") {
      decodeResult = entity;
    } else if (isStrict && decodeEntityLastChar !== ";") {
      decodeResult = entity;
    } else {
      var decodeResultByReference = references[entity];
      if (decodeResultByReference) {
        decodeResult = decodeResultByReference;
      } else if (entity[0] === "&" && entity[1] === "#") {
        var decodeSecondChar = entity[2];
        var decodeCode = decodeSecondChar == "x" || decodeSecondChar == "X" ? parseInt(entity.substr(3), 16) : parseInt(entity.substr(2));
        decodeResult = decodeCode >= 1114111 ? outOfBoundsChar : decodeCode > 65535 ? fromCodePoint(decodeCode) : fromCharCode(numericUnicodeMap[decodeCode] || decodeCode);
      }
    }
    return decodeResult;
  }
  function decode(text, _a) {
    var _b = _a === void 0 ? defaultDecodeOptions : _a, _c = _b.level, level = _c === void 0 ? "all" : _c, _d = _b.scope, scope = _d === void 0 ? level === "xml" ? "strict" : "body" : _d;
    if (!text) {
      return "";
    }
    var decodeRegExp = decodeRegExps[level][scope];
    var references = allNamedReferences[level].entities;
    var isAttribute = scope === "attribute";
    var isStrict = scope === "strict";
    return text.replace(decodeRegExp, function(entity) {
      return getDecodedEntity(entity, references, isAttribute, isStrict);
    });
  }

  // renderer/src/handlebars.factory.ts
  var getNestedValue = (path, data) => {
    if (!data) return void 0;
    const parts = path.split(".");
    const result = parts.reduce((obj, key) => {
      if (!obj) return void 0;
      if (key.startsWith("[") && key.endsWith("]")) {
        const index = parseInt(key.slice(1, -1));
        return Array.isArray(obj) ? obj[index] : void 0;
      }
      return obj[key];
    }, data);
    return result;
  };
  var getContextValue = (path, context) => {
    const trimmedPath = path.trim();
    if (trimmedPath === "@root") return context;
    if (trimmedPath === "@first" || trimmedPath === "@last" || trimmedPath === "@index") {
      return context[trimmedPath];
    }
    if (trimmedPath === "this") {
      return context.this || context;
    }
    if (trimmedPath.startsWith("../")) {
      let currentContext = context;
      let remainingPath = trimmedPath;
      while (remainingPath.startsWith("../")) {
        remainingPath = remainingPath.slice(3);
        if (currentContext.parentContext) {
          currentContext = currentContext.parentContext;
        } else {
          return void 0;
        }
      }
      if (remainingPath === "") {
        return currentContext;
      } else {
        return getContextValue(remainingPath, currentContext);
      }
    }
    if (context.hasOwnProperty(trimmedPath)) {
      return context[trimmedPath];
    }
    if (context.this && typeof context.this === "object") {
      const fromThis = getNestedValue(trimmedPath, context.this);
      if (fromThis !== void 0) {
        return fromThis;
      }
    }
    return getNestedValue(trimmedPath, context);
  };
  var processVariables = (text, context) => {
    if (!text.includes("{{")) return text;
    let result = text;
    const triplePattern = /{{{([^}]+)}}}/g;
    result = result.replace(triplePattern, (match, path) => {
      const value = getContextValue(path.trim(), context);
      return value !== void 0 ? String(value) : "";
    });
    const doublePattern = /{{([^#/>][^}]*)}}/g;
    result = result.replace(doublePattern, (match, path) => {
      const value = getContextValue(path.trim(), context);
      return value !== void 0 ? escapeHtml(String(value)) : "";
    });
    return result;
  };
  var processBlockHelpers = (text, context) => {
    if (!text.includes("{{#")) return text;
    let result = text;
    let changed = true;
    let iteration = 0;
    while (changed) {
      iteration++;
      changed = false;
      const beforeLength = result.length;
      const blocks = findAllBlocks(result);
      for (const block of blocks) {
        const oldResult = result;
        if (block.type === "if") {
          result = processIfBlocks(result, context);
        } else if (block.type === "with") {
          result = processWithBlocks(result, context);
        } else if (block.type === "each") {
          result = processEachBlocks(result, context);
        }
        if (result !== oldResult) {
          changed = true;
          break;
        }
      }
      if (!changed) {
        result = processIfBlocks(result, context);
        result = processWithBlocks(result, context);
        result = processEachBlocks(result, context);
        if (result.length !== beforeLength) {
          changed = true;
        }
      }
    }
    return result;
  };
  var findAllBlocks = (text) => {
    const blocks = [];
    const blockRegex = /{{#(if|with|each)\s/g;
    let match;
    while ((match = blockRegex.exec(text)) !== null) {
      blocks.push({
        type: match[1],
        position: match.index
      });
    }
    return blocks.sort((a, b) => a.position - b.position);
  };
  var processIfBlocks = (text, context) => {
    let result = text;
    let processedAny = false;
    const regex = /{{#if\s+([^}]+)}}/g;
    let match;
    while ((match = regex.exec(result)) !== null) {
      const startPos = match.index;
      const condition = match[1].trim();
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
          pos = nextElse + 8;
        } else if (nextClose < nextOpen) {
          depth--;
          if (depth === 0) {
            endPos = nextClose;
            break;
          }
          pos = nextClose + 7;
        } else if (nextOpen < Infinity) {
          depth++;
          pos = nextOpen + 5;
        } else {
          break;
        }
      }
      if (endPos !== -1) {
        const contentStart = startPos + match[0].length;
        const content = elsePos !== -1 ? result.substring(contentStart, elsePos) : result.substring(contentStart, endPos);
        const elseContent = elsePos !== -1 ? result.substring(elsePos + 8, endPos) : "";
        const fullMatch = result.substring(startPos, endPos + 7);
        try {
          if (condition.startsWith("(eq ")) {
            const argsStr = condition.slice(4, -1).trim();
            const args = argsStr.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
            if (args.length === 2) {
              const [arg1, arg2] = args;
              const val1 = arg1.startsWith('"') ? arg1.slice(1, -1) : arg1.startsWith("'") ? arg1.slice(1, -1) : getContextValue(arg1, context);
              const val2 = arg2.startsWith('"') ? arg2.slice(1, -1) : arg2.startsWith("'") ? arg2.slice(1, -1) : getContextValue(arg2, context);
              const ifContext = { ...context, parentContext: context };
              const processedContent = val1 === val2 ? processTemplate(content, ifContext) : elseContent ? processTemplate(elseContent, ifContext) : "";
              result = result.replace(fullMatch, processedContent);
            }
          } else {
            const value = getContextValue(condition, context);
            const ifContext = { ...context, parentContext: context };
            const processedContent = value ? processTemplate(content, ifContext) : elseContent ? processTemplate(elseContent, ifContext) : "";
            result = result.replace(fullMatch, processedContent);
          }
          processedAny = true;
          break;
        } catch (error) {
          console.error("Error in if block:", error);
          result = result.replace(fullMatch, "");
          processedAny = true;
          break;
        }
      }
    }
    return result;
  };
  var processEachBlocks = (text, context) => {
    let result = text;
    let processedAny = false;
    const regex = /{{#each\s+([^}]*?)(?=\s+as\s+|}})\s*(?:as\s+\|([^|]+)\|)?\s*}}/g;
    let match;
    while ((match = regex.exec(result)) !== null) {
      const startPos = match.index;
      const arrayPath = match[1].trim();
      const alias = match[2];
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
          pos = nextClose + 9;
        } else if (nextOpen < Infinity) {
          depth++;
          pos = nextOpen + 7;
        } else {
          break;
        }
      }
      if (endPos !== -1) {
        const content = result.substring(startPos + match[0].length, endPos);
        const fullMatch = result.substring(startPos, endPos + 9);
        try {
          const array = getContextValue(arrayPath, context);
          if (!Array.isArray(array)) {
            console.error(
              "Each block array not found or not an array:",
              arrayPath
            );
            result = result.replace(fullMatch, "");
          } else {
            const processedContent = array.map((item, index) => {
              const itemContext = {
                ...context,
                // Keep parent context
                "@index": index,
                "@first": index === 0,
                "@last": index === array.length - 1,
                "@key": arrayPath.split(".").pop() || "",
                parentContext: context
                // Preserve parent context reference
              };
              if (alias) {
                itemContext[alias] = item;
                itemContext.this = item;
              } else {
                itemContext.this = item;
                if (typeof item === "object" && item !== null && !Array.isArray(item)) {
                  Object.assign(itemContext, item);
                  itemContext.this = item;
                }
              }
              return processTemplate(content, itemContext);
            }).join("");
            result = result.replace(fullMatch, processedContent);
          }
          processedAny = true;
          break;
        } catch (error) {
          console.error("Error in each block:", error);
          result = result.replace(fullMatch, "");
          processedAny = true;
          break;
        }
      }
    }
    return result;
  };
  var processWithBlocks = (text, context) => {
    let result = text;
    let processedAny = false;
    const regex = /{{#with\s+([^}]*?)(?=\s+as\s+|}})\s*(?:as\s+\|([^|]+)\|)?\s*}}/g;
    let match;
    while ((match = regex.exec(result)) !== null) {
      const startPos = match.index;
      const expression = match[1].trim();
      const alias = match[2];
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
          pos = nextClose + 9;
        } else if (nextOpen < Infinity) {
          depth++;
          pos = nextOpen + 6;
        } else {
          break;
        }
      }
      if (endPos !== -1) {
        const content = result.substring(startPos + match[0].length, endPos);
        const fullMatch = result.substring(startPos, endPos + 9);
        try {
          let value;
          if (expression.includes(" ")) {
            const [helperName, ...args] = expression.split(" ").map((part) => part.trim());
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
                return resolved;
              });
              value = helper(...resolvedArgs);
            } else {
              value = getContextValue(expression, context);
            }
          } else {
            value = getContextValue(expression, context);
          }
          if (value === void 0 || value === null) {
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
            withContext.parentContext = context;
            const processedContent = processTemplate(content, withContext);
            result = result.replace(fullMatch, processedContent);
          }
          processedAny = true;
          break;
        } catch (error) {
          console.error("Error in with block:", error);
          result = result.replace(fullMatch, "");
          processedAny = true;
          break;
        }
      }
    }
    return result;
  };
  var helperMap = new Map(helpers.map((h) => [h.name, h.helper]));
  var processHelpers = (text, context) => {
    const helperRegex = /{{{?\s*(\w+)\s+([^}]+)}}}?/g;
    return text.replace(helperRegex, (match, helperName, args) => {
      if (match.startsWith("{{#") || match.startsWith("{{>")) {
        return match;
      }
      const helper = helperMap.get(helperName);
      if (!helper) return match;
      try {
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
        const result = helper(...resolvedArgs);
        return result !== void 0 ? String(result) : "";
      } catch (error) {
        console.error(`Error processing helper ${helperName}:`, error);
        return "";
      }
    });
  };
  var processTemplate = (text, context) => {
    if (!text) return "";
    let result = text;
    result = processBlockHelpers(result, context);
    result = processHelpers(result, context);
    result = processVariables(result, context);
    return result;
  };
  var cleanTemplateString = (content) => {
    if (!content) return "";
    return decode(content).replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\").replace(/^"/, "").replace(/"$/, "").replace(/(?<=>)"\s*/g, "").replace(/\s*"(?=<)/g, "").trim();
  };
  var processPartials = async (template, partials, templateData2) => {
    const processedPartials = {};
    for (const partial of partials) {
      try {
        const response = await fetch(
          `https://ipfs.transport-union.dev/api/v0/cat?arg=${partial.cid}`,
          {
            method: "POST"
          }
        );
        if (!response.ok) continue;
        let content = await response.text();
        content = cleanTemplateString(content);
        const name = partial.path.substring(partial.path.lastIndexOf("/") + 1).split(".")[0];
        processedPartials[name] = content;
      } catch (error) {
        continue;
      }
    }
    let html = template;
    let depth = 0;
    let changed = true;
    while (changed && depth < 10) {
      changed = false;
      for (const [name, content] of Object.entries(processedPartials)) {
        const regex = new RegExp(`{{\\s*>\\s*${name}\\s*}}`, "g");
        if (regex.test(html)) {
          html = html.replace(regex, content);
          changed = true;
        }
      }
      depth++;
      html = cleanTemplateString(html);
    }
    return processTemplate(html, templateData2);
  };
  var escapeHtml = (str) => {
    const htmlEscapes = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    return str.replace(/[&<>"']/g, (char) => htmlEscapes[char]);
  };

  // renderer/src/html.ctrlr.ts
  var renderHTML = async (config2, templateConfig2, templateData2) => {
    try {
      if (!config2?.template_cid || !templateConfig2?.file) {
        console.error("Missing required config:", {
          template_cid: config2?.template_cid,
          file: templateConfig2?.file
        });
        return "";
      }
      const response = await fetch(
        `${IPFS_URL}/api/v0/dag/get?arg=${config2.template_cid}`,
        {
          method: "POST"
        }
      );
      if (!response.ok) {
        console.error(
          "Template fetch failed:",
          response.status,
          response.statusText
        );
        return "";
      }
      const templateArray = await response.json();
      const templateFile = templateArray.find(
        (t) => t.path.includes(templateConfig2.file)
      );
      if (!templateFile?.cid) {
        console.error("Template file not found:", templateConfig2.file);
        return "";
      }
      const templateResponse = await fetch(
        `${IPFS_URL}/api/v0/cat?arg=${templateFile.cid}`,
        {
          method: "POST"
        }
      );
      if (!templateResponse.ok) {
        console.error(
          "Template content fetch failed:",
          templateResponse.status,
          templateResponse.statusText
        );
        return "";
      }
      const template = cleanTemplateString(await templateResponse.text()).replace(/^"/, "").replace(/"$/, "").replace(/(?<=>)"/g, "").replace(/"(?=<)/g, "");
      if (!template) {
        console.error("Empty template after cleaning");
        return "";
      }
      const partialFiles = templateArray.filter(
        (t) => t.path.includes("partials/")
      );
      const result = await processPartials(template, partialFiles, templateData2);
      if (!result) {
        console.error("Empty result after processing");
        return "";
      }
      return result.replace(/\n{2,}/g, "\n").replace(/>\s+</g, ">\n<").trim();
    } catch (error) {
      console.error("Error in renderer:", error);
      return "";
    }
  };

  // renderer/src/main.ts
  var main = async () => {
    try {
      const result = await renderHTML(config, templateConfig, templateData);
      LitActions.setResponse({
        response: JSON.stringify({ success: true, html: result })
      });
    } catch (error) {
      console.log("Error updating root:", error);
      LitActions.setResponse({ response: JSON.stringify({ error }) });
    }
  };
  main();
})();
