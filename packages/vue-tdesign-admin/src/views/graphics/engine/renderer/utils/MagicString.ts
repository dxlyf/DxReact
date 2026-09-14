export class MagicString {
    static template = (function () {
        const invert = function (obj: Record<string, any>) {
            var result: Record<string, any> = {};
            for (var name in obj) {
                if (obj.hasOwnProperty(name)) {
                    result[obj[name]] = name;
                }
            }
            return result;
        }
        // List of HTML entities for escaping.
        const escapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '`': '&#x60;'
        };
        const unescapeMap = invert(escapeMap);

        // Functions for escaping and unescaping strings to/from HTML interpolation.
        const createEscaper = function (map: Record<string, any>) {
            const escaper = function (match: string) {
                return map[match];
            };
            // Regexes for identifying a key that needs to be escaped
            const source = '(?:' + Object.keys(map).join('|') + ')';
            const testRegexp = RegExp(source);
            const replaceRegexp = RegExp(source, 'g');
            return function (string: string) {
                string = string == null ? '' : '' + string;
                return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
            };
        };
        const defaultUtil = {
            escape: createEscaper(escapeMap),
            unescape: createEscaper(unescapeMap)
        }
        const parseTemplate = function (str: string, util?: any) {
            util = Object.assign({}, defaultUtil, util || {})
            let err = "";
            try {
                let func: any;
                const strFunc = `const __t_=[];
                with(obj){
                    __t_.push(\`${str
                        .replace(/<%=([\s\S]+?)%>/g, "`,$1,`")
                        .replace(/<%-([\s\S]+?)%>/g, "`,_.escape($1),`")
                        .split("<%").join("`);")
                        .split("%>").join("__t_.push(`")}
                    \`);
                }
                return __t_.join('');`
                func = new Function("obj", '_', strFunc);
                return function (this: any, data: any = {}) {
                    return func.call(this, data, util)
                }
            } catch (e: any) { err = e.message; }
            return () => {
                return "< # ERROR: " + err + " # >";
            }
        }
        return parseTemplate;
    })();
    source: string
    constructor(source: string = '') {
        this.source = source
    }
    private format(format: string, ...args: any[]) {
        return format.replace(/\{(\d+)\}/g, (match, index) => args[index])
    }
    appendFormat(format: string, ...args: any[]) {
        this.append(this.format(format, ...args))
    }
    appendLineFormat(format: string, ...args: any[]) {
        this.appendLine(this.format(format, ...args))
    }
    prependFormat(format: string, ...args: any[]) {
        this.prepend(this.format(format, ...args))
    }
    append(source: string) {
        this.source += source
    }
    appendLine(source: string) {
        if (this.source.length) {
            this.source += '\n' + source
        } else {
            this.source = source
        }
    }
    lineBreak() {
        this.append('\n')
    }
    prepend(source: string) {
        this.source = source + this.source
    }
    prependLine(source: string) {
        if (this.source.length) {
            this.source = '\n' + source + this.source
        } else {
            this.source = source + this.source
        }
    }
    replace(start: number, end: number, source: string) {
        this.source = this.source.slice(0, start) + source + this.source.slice(end)
    }
    insert(index: number, source: string) {
        this.source = this.source.slice(0, index) + source + this.source.slice(index)
    }
    toString() {
        return this.source
    }
    template(data: any, util?: any) {
        return MagicString.template(this.source, util)(data);
    }
}