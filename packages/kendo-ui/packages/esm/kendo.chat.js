import './kendo.textbox.js';
import { validatePackage, addWatermarkOverlayAndBanner } from './kendo.licensing.js';
import './kendo.avatar.js';
import './kendo.icons.js';
import './kendo.button.js';
import './kendo.appbar.js';
import './kendo.html.button.js';
import './kendo.textarea.js';
import './kendo.speechtotextbutton.js';
import './kendo.upload.js';
import './kendo.core.js';
import './kendo.toolbar.js';
import './kendo.dropdownbutton.js';
import './kendo.menu.js';
import './kendo.data.js';
import './kendo.floatinglabel.js';
import '@progress/kendo-licensing';
import './prefix-suffix-containers-Cid0cOEy.js';
import './kendo.html.icon.js';
import './kendo.html.base.js';
import '@progress/kendo-svg-icons';
import './kendo.badge.js';
import '@progress/kendo-webspeech-common';
import './kendo.progressbar.js';
import './kendo.splitbutton.js';
import './kendo.button.menu.js';
import './kendo.popup.js';
import './kendo.buttongroup.js';
import './kendo.togglebutton.js';
import './kendo.data.odata.js';
import './kendo.data.xml.js';

const OBJECT = "object";
const UNDEFINED = "undefined";
const FUNCTION$1 = "function";
const STRING$1 = "string";
const DOT = ".";

const CLICK = "click";
const FOCUS = "focus";
const BLUR = "blur";
const CHANGE = "change";
const INPUT = "input";
const KEYDOWN = "keydown";

const RTL = "rtl";
const LTR = "ltr";

const K_RTL = "k-rtl";

const KEYS = {
    ENTER: 13,
    UP: 38,
    DOWN: 40,
    END: 35,
    HOME: 36,
    SPACEBAR: 32};

const REGEX = {
    AMP: /&/g,
    LT: /</g,
    GT: />/g,
    QUOTE: /"/g,
    APOSTROPHE: /'/g,
    EDGE: /(edge)[ /]([\w.]+)/i,
    WEBKIT: /(chrome|crios)[ /]([\w.]+)/i,
    SAFARI: /(webkit)[ /]([\w.]+)/i,
    OPERA: /(opera)(?:.*version|)[ /]([\w.]+)/i,
    MSIE: /(msie\s|trident.*? rv:)([\w.]+)/i,
    MOZILLA: /(mozilla)(?:.*? rv:([\w.]+)|)/i,
    CHROMIUM_EDGE: /(edg)[ /]([\w.]+)/i
};

const deepExtend = (destination, ...sources) => {
    for (let i = 0; i < sources.length; i++) {
        deepExtendOne(destination, sources[i]);
    }
    return destination;
};

const isFunction = (value) => typeof value === FUNCTION$1;
const isObject = (value) => typeof value === OBJECT && value !== null;

const extend = $.extend;

function deepExtendOne(destination, source) {
    const ObservableArray = kendo?.data?.ObservableArray;
    const LazyObservableArray = kendo?.data?.LazyObservableArray;
    const DataSource = kendo?.data?.DataSource;
    const HierarchicalDataSource = kendo?.data?.HierarchicalDataSource;

    for (const property in source) {
        if (property === '__proto__' || property === 'constructor' || property === 'prototype') {
            continue;
        }

        const propValue = source[property];
        const propType = typeof propValue;
        let propInit = null;

        if (propType === OBJECT && propValue !== null) {
            propInit = propValue.constructor;
        }

        if (propInit &&
            propInit !== Array && propInit !== ObservableArray && propInit !== LazyObservableArray &&
            propInit !== DataSource && propInit !== HierarchicalDataSource && propInit !== RegExp &&
            (!isFunction(globalThis.ArrayBuffer) || propInit !== ArrayBuffer) && !(propValue instanceof HTMLElement)) {

            if (propValue instanceof Date) {
                destination[property] = new Date(propValue.getTime());
            } else if (isFunction(propValue.clone)) {
                destination[property] = propValue.clone();
            } else {
                const destProp = destination[property];
                if (typeof destProp === OBJECT) {
                    destination[property] = destProp || {};
                } else {
                    destination[property] = {};
                }
                deepExtendOne(destination[property], propValue);
            }
        } else if (propType !== UNDEFINED) {
            destination[property] = propValue;
        }
    }

    return destination;
}

const isRtl = (element) => $(element).closest(DOT + K_RTL).length > 0;

/**
 * Generates a GUID using crypto API with fallback
 * @returns {string} A GUID string
 */
const guid = () => {
    try {
        // This is available only in HTTPS.
        return crypto.randomUUID();
    } catch (e) {
        // Use this as a fallback.
        logToConsole(`crypto.randomUUID is not supported. Using fallback method. ${e}`, "warn");
        const randomValues = crypto.getRandomValues(new Uint8Array(16));
        return randomValues.reduce((acc, curr, i) => {
            if (i === 4 || i === 6 || i === 8 || i === 10) {
                acc += "-";
            }
            acc += curr.toString(16).padStart(2, '0');
            return acc;
        }, "");
    }
};

/**
 * Logs message to console if logging is enabled
 * @param {string} message - The message to log
 * @param {string} [type] - The log type (log, warn, error, etc.)
 */
const logToConsole = (message, type) => {
    const logger = window.console || console || {};

    if (!kendo.suppressLog && typeof (logger) != "undefined" && logger.log) {
        logger[type](message);
    }
};

const detectBrowser = (ua) => {
    let browser = {};
    let match = [];
    let chromiumEdgeMatch = [];
    const browserRegex = {
        edge: REGEX.EDGE,
        webkit: REGEX.WEBKIT,
        safari: REGEX.SAFARI,
        opera: REGEX.OPERA,
        msie: REGEX.MSIE,
        mozilla: REGEX.MOZILLA
    };

    for (let agent in browserRegex) {
        if (browserRegex.hasOwnProperty(agent)) {
            match = ua.match(browserRegex[agent]);
            if (match) {
                browser[agent] = true;
                browser[match[1].toLowerCase().split(" ")[0].split("/")[0]] = true;
                browser.version = parseInt(document.documentMode || match[2], 10);

                if (browser.chrome) {
                    chromiumEdgeMatch = ua.match(REGEX.CHROMIUM_EDGE);

                    if (chromiumEdgeMatch) {
                        browser.chromiumEdge = true;
                    }
                }

                break;
            }
        }
    }

    return browser;
};

/**
 * Converts URLs in text to clickable links
 * @param {string} text - The text containing URLs
 * @returns {string} HTML string with URLs converted to links
 */
const convertTextUrlToLink = (text, skipSanitization) => {
    const urlRegex = /((https?:\/\/[^\s]+)|(www\.[^\s]+))/gi;
    const processedText = skipSanitization ? text : htmlEncode(text);

    return processedText.replace(urlRegex, (match) => {
        let url = match.trim();
        const displayText = match.trim();

        if (/^www\./i.test(url)) {
            url = 'https://' + url;
        }

        try {
            url = new URL(url).href;

            let target = '_blank';
            let rel = 'noopener noreferrer';

            return `<a href="${url}" target="${target}"${rel ? ` rel="${rel}"` : ''}>${displayText}</a>`;
        } catch (e) { //NOSONAR - No need to handle/log the error here.
            return match;
        }
    });
};

/**
 * Encodes HTML entities in a string
 * @param {string} value - The value to encode
 * @param {boolean} shouldDecode - Whether to decode first
 * @returns {string} HTML encoded string
 */
const htmlEncode = (value, shouldDecode) => {

    const encoded = ("" + value).replace(REGEX.AMP, "&amp;").replace(REGEX.LT, "&lt;").replace(REGEX.GT, "&gt;").replace(REGEX.QUOTE, "&quot;").replace(REGEX.APOSTROPHE, "&#39;");

    return encoded;
};

/**
 * File type to extension mapping for categorizing files
 */
const fileGroupMap = {
    audio: [".aif", ".iff", ".m3u", ".m4a", ".mid", ".mp3", ".mpa", ".wav", ".wma", ".ogg", ".wav", ".wma", ".wpl"],
    video: [".3g2", ".3gp", ".avi", ".asf", ".flv", ".m4u", ".rm", ".h264", ".m4v", ".mkv", ".mov", ".mp4", ".mpg",
        ".rm", ".swf", ".vob", ".wmv"],
    image: [".ai", ".dds", ".heic", ".jpe", "jfif", ".jif", ".jp2", ".jps", ".eps", ".bmp", ".gif", ".jpeg",
        ".jpg", ".png", ".ps", ".psd", ".svg", ".svgz", ".tif", ".tiff"],
    txt: [".doc", ".docx", ".log", ".pages", ".tex", ".wpd", ".wps", ".odt", ".rtf", ".text", ".txt", ".wks"],
    presentation: [".key", ".odp", ".pps", ".ppt", ".pptx"],
    data: [".xlr", ".xls", ".xlsx"],
    programming: [".tmp", ".bak", ".msi", ".cab", ".cpl", ".cur", ".dll", ".dmp", ".drv", ".icns", ".ico", ".link",
        ".sys", ".cfg", ".ini", ".asp", ".aspx", ".cer", ".csr", ".css", ".dcr", ".htm", ".html", ".js",
        ".php", ".rss", ".xhtml"],
    pdf: [".pdf"],
    config: [".apk", ".app", ".bat", ".cgi", ".com", ".exe", ".gadget", ".jar", ".wsf"],
    zip: [".7z", ".cbr", ".gz", ".sitx", ".arj", ".deb", ".pkg", ".rar", ".rpm", ".tar.gz", ".z", ".zip", ".zipx"],
    "disc-image": [".dmg", ".iso", ".toast", ".vcd", ".bin", ".cue", ".mdf"]
};

/**
 * Gets the file group/category based on file extension
 * @param {string} extension - The file extension (with or without dot)
 * @param {boolean} withPrefix - Whether to include "file-" prefix
 * @returns {string} The file group/category
 */
const getFileGroup = (extension, withPrefix) => {
    const groups = Object.keys(fileGroupMap);
    const type = "file";

    if (extension === undefined || !extension.length) {
        return type;
    }

    for (let i = 0; i < groups.length; i += 1) {
        const extensions = fileGroupMap[groups[i]];
        const lowerCaseExtension = extension.toLowerCase();

        if (extensions.indexOf(lowerCaseExtension) > -1 || extensions.indexOf("." + lowerCaseExtension) > -1) {
            return withPrefix ? "file-" + groups[i] : groups[i];
        }
    }

    return type;
};

/**
 * Calculates and formats file size in KB or MB
 * @param {number} size - File size in bytes
 * @returns {string} Formatted file size string
 */
const calculateFileSize = (size) => {
    if (isNaN(size)) {
        return size;
    }

    size /= 1024;

    if (size < 1024) {
        return size.toFixed(2) + " KB";
    } else {
        return (size / 1024).toFixed(2) + " MB";
    }
};

/**
 * Generates a relative date string (Today, Yesterday, Last Wednesday, etc.)
 * @param {Date} date - The date to compare against
 * @param {Date} [currentDate] - The current date (defaults to new Date())
 * @returns {string} Relative date string
 */
const getRelativeDateString = (date, currentDate = new Date()) => {
    if (!date) {return '';}

    const today = new Date(currentDate);
    today.setHours(0, 0, 0, 0);

    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - dateObj.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays <= 6) {
        return `Last ${kendo.toString(dateObj, 'dddd')}`;
    } else {
        // For older dates, show formatted date
        return kendo.toString(dateObj, 'dddd, MMMM dd, yyyy');
    }
};

/**
 * Cross-browser scroll left implementation with RTL support
 * @param {Element|jQuery} element - The element to scroll
 * @param {number} [value] - The scroll position to set (if not provided, returns current position)
 * @returns {number|undefined} Current scroll position if value not provided
 */
const scrollLeft = (element, value) => {
    const browser = detectBrowser(navigator.userAgent);
    const webkit = browser.webkit;
    browser.mozilla;
    const safari = browser.safari;
    const browserVersion = browser.version;
    let el, isRtl$1;

    if (element instanceof $ && value !== undefined) ; else {
        el = element instanceof $ ? element[0] : element;
    }

    if (!el) {
        return;
    }

    isRtl$1 = isRtl(element);

    // After updating browser detection,
    // Test in which if should the Safari browsers go
    {
        let result;
        if (isRtl$1 && webkit && (browserVersion < 85 || safari)) {
            result = el.scrollWidth - el.clientWidth - el.scrollLeft;
        } else {
            result = Math.abs(el.scrollLeft);
        }
        return result;
    }
};

/**
 * Scroll the element by a certain delta
 * @param {JQuery} element
 * @param {number} delta
 */
const scrollByDelta = (element, delta) => {
    let scrOffset = scrollLeft(element);

    const animationProps = { "scrollLeft": scrOffset + delta };

    element.finish().animate(animationProps, "fast", "linear");

    const maxScroll = element[0].scrollWidth - element[0].clientWidth;
    const newScrollLeft = Math.min(Math.max(scrOffset + delta, 0), maxScroll);

    return {
        atStart: newScrollLeft === 0,
        atEnd: newScrollLeft >= maxScroll
    };
};

/**
 * Smoothly scroll to a specific element within a container
 * @param {JQuery} container - The scrollable container
 * @param {JQuery} targetElement - The element to scroll to
 * @param {Object} [options] - Scroll options
 * @param {string} [options.duration=300] - Animation duration in milliseconds
 * @param {string} [options.easing='swing'] - Animation easing
 * @param {string} [options.position='center'] - Where to position the target ('top', 'center', 'bottom')
 * @param {number} [options.offset=0] - Additional offset from the calculated position
 * @param {Function} [options.onComplete] - Callback function to execute when scroll completes
 * @returns {boolean} True if scroll was performed, false if target not found
 */
const scrollToElement = (container, targetElement, options = {}) => {
    if (!container.length || !targetElement.length) {
        return false;
    }

    const {
        duration = 0,
        easing = 'linear',
        position = 'center',
        offset = 0,
        onComplete
    } = options;

    const containerHeight = container.height();
    const containerScrollTop = container.scrollTop();
    const containerOffset = container.offset();
    const targetOffset = targetElement.offset();
    const targetHeight = targetElement.outerHeight();

    // Calculate the relative position of the target within the container
    const relativeTop = targetOffset.top - containerOffset.top + containerScrollTop;

    let targetScrollTop;

    switch (position) {
        case 'top':
            targetScrollTop = relativeTop + offset;
            break;
        case 'bottom':
            targetScrollTop = relativeTop - containerHeight + targetHeight + offset;
            break;
        case 'center':
        default:
            targetScrollTop = relativeTop - (containerHeight / 2) + (targetHeight / 2) + offset;
            break;
    }

    // Ensure scroll position is within bounds
    const maxScroll = container[0].scrollHeight - container[0].clientHeight;
    targetScrollTop = Math.min(Math.max(targetScrollTop, 0), maxScroll);

    container.finish().animate({
        scrollTop: targetScrollTop
    }, duration, easing, onComplete);

    return true;
};

const FUNCTION = "function";
const STRING = "string";
const ARIA_LABELLEDBY = "aria-labelledby";
const ARIA_LABEL = "aria-label";
const LABELIDPART = "_label";

const cssPropertiesNames = ["themeColor", "fillMode", "shape", "size", "rounded", "positionMode"];

class KendoClass {
    constructor() {
        if (!this.constructor._extendSetupDone) {
            this._setupExtendedClass();
        }
    }

    _setupExtendedClass() {
        this.constructor.extend = KendoClass.extend;
        this.constructor.fn = this.constructor.prototype;
        this.constructor._extendSetupDone = true;
    }

    static extend(proto) {
        const ParentClass = this;

        // Create the new class
        class ExtendedClass extends ParentClass {
            constructor(...args) {
                if (proto.init) {
                    super();
                    proto.init.apply(this, args);
                } else {
                    super(...args);
                }
            }
        }

        // Copy prototype members
        for (const member in proto) {
            if (member !== 'init') {
                if (proto[member] != null && proto[member].constructor === Object) {
                    // Merge object members using spread operator
                    ExtendedClass.prototype[member] = {
                        ...ParentClass.prototype[member],
                        ...proto[member]
                    };
                } else {
                    ExtendedClass.prototype[member] = proto[member];
                }
            }
        }

        // Add extend method to new class
        ExtendedClass.extend = this.extend;

        // Add fn property for backwards compatibility
        ExtendedClass.fn = ExtendedClass.prototype;

        return ExtendedClass;
    }

    _initOptions(options) {
        this.options = deepExtend({}, this.options, options);
    }
}

const preventDefault = function() {
    this._defaultPrevented = true;
};

const isDefaultPrevented = function() {
    return this._defaultPrevented === true;
};

class Observable extends KendoClass {
    constructor() {
        super();
        this._events = {};
    }

    bind(eventName, handlers, one) {
        if (handlers === undefined) {
            for (const idx in eventName) {
                this.bind(idx, eventName[idx]);
            }
            return this;
        }

        const eventNames = typeof eventName === STRING ? [eventName] : eventName;
        const handlersIsFunction = typeof handlers === FUNCTION;

        for (let idx = 0; idx < eventNames.length; idx++) {
            const currentEventName = eventNames[idx];
            let handler = handlersIsFunction ? handlers : handlers[currentEventName];

            if (handler) {
                if (one) {
                    const original = handler;
                    handler = (...args) => {
                        this.unbind(currentEventName, handler);
                        original.apply(this, args);
                    };
                    handler.original = original;
                }
                const events = this._events[currentEventName] = this._events[currentEventName] || [];
                events.push(handler);
            }
        }

        return this;
    }

    one(eventNames, handlers) {
        return this.bind(eventNames, handlers, true);
    }

    first(eventName, handlers) {
        const eventNames = typeof eventName === STRING ? [eventName] : eventName;
        const handlersIsFunction = typeof handlers === FUNCTION;

        for (let idx = 0; idx < eventNames.length; idx++) {
            const currentEventName = eventNames[idx];
            const handler = handlersIsFunction ? handlers : handlers[currentEventName];

            if (handler) {
                const events = this._events[currentEventName] = this._events[currentEventName] || [];
                events.unshift(handler);
            }
        }

        return this;
    }

    trigger(eventName, e = {}) {
        const events = this._events[eventName];

        if (events) {
            e.sender = this;
            e._defaultPrevented = false;
            e.preventDefault = preventDefault;
            e.isDefaultPrevented = isDefaultPrevented;

            const eventsCopy = events.slice();

            for (let idx = 0; idx < eventsCopy.length; idx++) {
                eventsCopy[idx].call(this, e);
            }

            return e._defaultPrevented === true;
        }

        return false;
    }

    unbind(eventName, handler) {
        if (eventName === undefined) {
            this._events = {};
        } else {
            const events = this._events[eventName];
            if (events) {
                if (handler) {
                    for (let idx = events.length - 1; idx >= 0; idx--) {
                        if (events[idx] === handler || events[idx].original === handler) {
                            events.splice(idx, 1);
                        }
                    }
                } else {
                    this._events[eventName] = [];
                }
            }
        }

        return this;
    }
}

/**
 * @template {Object} [TOptions=Object]
 */
class Widget extends Observable {
    constructor(element, options) {
        super();

        // Check for licensing (placeholder for actual implementation)
        if (typeof validatePackage !== 'undefined' && !validatePackage()) {
            this._showWatermarkOverlay = addWatermarkOverlayAndBanner;
        }

        this.element = (kendo?.jQuery || $)?.(element);
        if (this.element?.handler) {
            this.element.handler(this);
        }

        const dataSource = options?.dataSource;
        let props;

        if (options) {
            props = (this.componentTypes || {})[options.componentType];
        }

        if (dataSource) {
            // avoid deep cloning the data source
            options = { ...options, dataSource: {} };
        }

        this.options = { ...this.options, ...this.defaults, ...props, ...options };

        if (dataSource) {
            this.options.dataSource = dataSource;
        }

        if (kendo?.attr && !this.element?.attr?.(kendo.attr("role"))) {
            this.element?.attr?.(kendo.attr("role"), (this.options.name || "").toLowerCase());
        }

        this.element?.data?.("kendo" + this.options.prefix + this.options.name, this);

        this.bind(this.events, this.options);
    }

    get events() {
        return [];
    }

    /**
     * @returns {TOptions}
     */
    get options() {
        return this._options || { prefix: "" };
    }

    /**
     * @param {TOptions} value
     */
    set options(value) {
        this._options = value;
    }

    _hasBindingTarget() {
        return !!this.element?.[0]?.kendoBindingTarget;
    }

    _tabindex(target) {
        target = target || this.wrapper;

        const element = this.element;
        const TABINDEX = "tabindex";
        const tabindex = target?.attr?.(TABINDEX) || element?.attr?.(TABINDEX);

        element?.removeAttr?.(TABINDEX);
        target?.attr?.(TABINDEX, !isNaN(tabindex) ? tabindex : 0);
    }

    setOptions(options) {
        this._clearCssClasses(options);
        this._setEvents(options);
        Object.assign(this.options, options);
        this._applyCssClasses();
    }

    _setEvents(options) {
        for (let idx = 0; idx < this.events.length; idx++) {
            const e = this.events[idx];
            if (this.options[e] && options[e]) {
                this.unbind(e, this.options[e]);
                if (this._events?.[e]) {
                    delete this._events[e];
                }
            }
        }

        this.bind(this.events, options);
    }

    resize(force) {
        const size = this.getSize();
        const currentSize = this._size;

        if (force || (size.width > 0 || size.height > 0) &&
            (!currentSize || size.width !== currentSize.width || size.height !== currentSize.height)) {
            this._size = size;
            this._resize(size, force);
            this.trigger("resize", size);
        }
    }

    getSize() {
        return kendo?.dimensions?.(this.element) || { width: 0, height: 0 };
    }

    size(size) {
        if (!size) {
            return this.getSize();
        } else {
            this.setSize(size);
        }
    }

    setSize() {
    }

    _resize() {
    }

    destroy() {
        this.element?.removeData?.("kendo" + this.options.prefix + this.options.name);
        this.element?.removeData?.("handler");
        this.unbind();
    }

    _destroy() {
        this.destroy();
    }

    _applyCssClasses(element) {
        const protoOptions = Object.getPrototypeOf(this).constructor.prototype.options;
        const options = this.options;
        const el = element || this.wrapper || this.element;
        const classes = [];

        if (!kendo?.cssProperties?.propertyDictionary?.[protoOptions?.name]) {
            return;
        }

        for (let i = 0; i < cssPropertiesNames.length; i++) {
            const prop = cssPropertiesNames[i];
            const widgetName = this.options._altname || protoOptions.name;

            if (protoOptions.hasOwnProperty(prop)) {
                if (prop === "themeColor") {
                    const validFill = kendo.cssProperties.getValidClass({
                        widget: widgetName,
                        propName: "fillMode",
                        value: options.fillMode
                    });

                    if (validFill?.length) {
                        classes.push(kendo.cssProperties.getValidClass({
                            widget: widgetName,
                            propName: prop,
                            value: options[prop],
                            fill: options.fillMode
                        }));
                    }
                } else {
                    classes.push(kendo.cssProperties.getValidClass({
                        widget: widgetName,
                        propName: prop,
                        value: options[prop]
                    }));
                }
            }
        }

        el?.addClass?.(classes.join(" "));
    }

    _ariaLabel(target) {
        const inputElm = this.element;
        const inputId = inputElm?.attr?.("id");
        const labelElm = $?.(`label[for="${inputId}"]`);
        const ariaLabel = inputElm?.attr?.(ARIA_LABEL);
        const ariaLabelledBy = inputElm?.attr?.(ARIA_LABELLEDBY);

        if (target?.[0] === inputElm?.[0]) {
            return;
        }

        if (ariaLabel) {
            target?.attr?.(ARIA_LABEL, ariaLabel);
        } else if (ariaLabelledBy) {
            target?.attr?.(ARIA_LABELLEDBY, ariaLabelledBy);
        } else if (labelElm?.length) {
            const labelId = labelElm?.attr?.("id") ||
                this._generateLabelId(labelElm, inputId || kendo?.guid?.());
            target?.attr?.(ARIA_LABELLEDBY, labelId);
        }
    }

    _clearCssClasses(newOptions, element) {
        const protoOptions = Object.getPrototypeOf(this).constructor.prototype.options;
        const currentOptions = this.options;
        const el = element || this.wrapper || this.element;

        if (!kendo?.cssProperties?.propertyDictionary?.[protoOptions?.name]) {
            return;
        }

        for (let i = 0; i < cssPropertiesNames.length; i++) {
            const prop = cssPropertiesNames[i];
            const widgetName = this.options._altname || protoOptions.name;

            if (protoOptions.hasOwnProperty(prop) && newOptions.hasOwnProperty(prop)) {
                if (prop === "themeColor") {
                    el?.removeClass?.(kendo.cssProperties.getValidClass({
                        widget: widgetName,
                        propName: prop,
                        value: currentOptions[prop],
                        fill: currentOptions.fillMode
                    }));
                } else {
                    if (prop === "fillMode") {
                        el?.removeClass?.(kendo.cssProperties.getValidClass({
                            widget: widgetName,
                            propName: "themeColor",
                            value: currentOptions.themeColor,
                            fill: currentOptions.fillMode
                        }));
                    }

                    el?.removeClass?.(kendo.cssProperties.getValidClass({
                        widget: widgetName,
                        propName: prop,
                        value: currentOptions[prop]
                    }));
                }
            }
        }
    }

    _generateLabelId(label, inputId) {
        const labelId = inputId + LABELIDPART;
        label?.attr?.("id", labelId);
        return labelId;
    }
}

class DataBoundWidget extends Widget {
    dataItems() {
        return this.dataSource ? this.dataSource.flatView() : [];
    }
}

// Add fn property for backwards compatibility (kendo.ui.Widget.fn.methodName pattern)
KendoClass.fn = KendoClass.prototype;
Observable.fn = Observable.prototype;
Widget.fn = Widget.prototype;
DataBoundWidget.fn = DataBoundWidget.prototype;

const slice = Array.prototype.slice;

function plugin(widget, register = kendo.ui, prefix = "") {
    const name = widget.options?.name || widget.fn.options.name;
    let getter;

    register[name] = widget;
    register.roles[name.toLowerCase()] = widget;

    widget.prototype.options = { ...widget.prototype.options, ...widget.options };
    widget.fn.options = { ...widget.fn.options, ...widget.options };

    getter = "getKendo" + prefix + name;
    const pluginName = "kendo" + prefix + name;

    const widgetEntry = { name: pluginName, widget: widget, prefix: prefix || "" };
    kendo.widgets.push(widgetEntry);

    const $ = window.jQuery || jQuery || kendo?.jQuery;

    $.fn[pluginName] = function(options) {
        let value = this;
        let args;

        if (typeof options === STRING$1) {
            args = slice.call(arguments, 1);

            this.each(function() {
                const widget = $.data(this, pluginName);
                let method;
                let result;

                if (!widget) {
                    throw new Error(kendo.format("Cannot call method '{0}' of {1} before it is initialized", options, pluginName));
                }

                method = widget[options];

                if (!isFunction(method)) {
                    throw new Error(kendo.format("Cannot find method '{0}' of {1}", options, pluginName));
                }

                result = method.apply(widget, args);

                if (result !== undefined) {
                    value = result;
                    return false;
                }
            });
        } else {
            this.each(function() {
                return new widget(this, options);
            });
        }

        return value;
    };

    $.fn[pluginName].widget = widget;

    $.fn[getter] = function() {
        return this.data(pluginName);
    };
}

const NS = ".kendoChat";

const STYLES = {
    active: "k-active",
    file: "k-chat-file",
    fileInfo: "k-chat-file-info",
    fileName: "k-chat-file-name",
    fileSize: "k-chat-file-size",
    fileWrapper: "k-chat-file-wrapper",
    bubble: "k-bubble",
    bubbleContent: "k-bubble-content",
    bubbleExpandable: "k-bubble-expandable",
    bubbleExpandableIndicator: "k-bubble-expandable-indicator",
    buttonIcon: "k-button-icon",
    chatBubble: "k-chat-bubble",
    chatBubbleText: "k-chat-bubble-text",
    chatSend: "k-chat-send",
    disabled: "k-disabled",
    downloadButton: "k-chat-download-button",
    downloadButtonWrapper: "k-chat-download-button-wrapper",
    expanded: "k-expanded",
    generating: "k-generating",
    header: "k-chat-header",
    hidden: "k-hidden",
    message: "k-message",
    messageAuthor: "k-message-author",
    messageBox: "k-message-box",
    messageBoxWrapper: "k-message-box-wrapper",
    messageGroup: "k-message-group",
    messageGroupContent: "k-message-group-content",
    messageGroupFullWidth: "k-message-group-full-width",
    messageGroupReceiver: "k-message-group-receiver",
    messageGroupSender: "k-message-group-sender",
    messageList: "k-avatars",
    messageListContent: "k-message-list-content",
    messagePinned: "k-message-pinned",
    messageReference: "k-message-reference",
    messageReferenceContent: "k-message-reference-content",
    messageReferenceReceiver: "k-message-reference-receiver",
    messageReferenceSender: "k-message-reference-sender",
    messageRemoved: "k-message-removed",
    messageTime: "k-message-time",
    messageToolbar: "k-chat-message-toolbar",
    noAvatar: "k-no-avatar",
    selected: "k-selected",
    focus: "k-focus",
    spacer: "k-spacer",
    suggestion: "k-suggestion",
    suggestionGroup: "k-suggestion-group",
    suggestionScrollWrap: "k-suggestion-scrollwrap",
    timestamp: "k-timestamp",
    typingIndicator: "k-typing-indicator",
    viewWrapper: "k-message-list",
    wrapper: "k-chat"
};

const ICONS = {
    attachment: "paperclip",
    attachmentMenu: "more-vertical",
    chevronDown: "chevron-down",
    chevronLeft: "chevron-left",
    chevronRight: "chevron-right",
    chevronUp: "chevron-up",
    download: "download",
    pin: "pin",
    undo: "undo",
    copy: "copy",
    trash: "trash",
    send: "paper-plane",
    stop: "stop-sm",
    x: "x"
};

const REFERENCES = {
    fileButton: "ref-chat-file-button",
    fileMenuButton: "ref-chat-file-menu-button",
    fileWrapper: "ref-chat-file-wrapper",
    fileCloseButton: "ref-chat-file-close-button",
    bubbleExpandableIndicator: "ref-chat-bubble-expandable-indicator",
    messageReferencePinWrapper: "ref-chat-message-reference-pin-wrapper",
    messageReferenceReplyWrapper: "ref-chat-message-reference-reply-wrapper",
    pinnedMessageCloseButton: "ref-chat-pinned-message-close-button",
    replyMessageCloseButton: "ref-chat-reply-message-close-button",
    leftScrollButton: "ref-chat-left-scroll-button",
    rightScrollButton: "ref-chat-right-scroll-button",
    sendButton: "ref-chat-message-box-send-button",
    speechToTextButton: "ref-chat-message-box-speech-to-text-button",
    suggestionGroup: "ref-chat-suggestion-group",
    fileUploadInput: "ref-chat-file-upload-input",
};

const EVENTS = {
    sendMessage: "sendMessage",
    suggestionClick: "suggestionClick",
    unpin: "unpin",
    input: "input",
    toolbarAction: "toolbarAction",
    fileMenuAction: "fileMenuAction",
    contextMenuAction: "contextMenuAction",
    download: "download"
};

const MESSAGE_WIDTH_MODE = {
    STANDARD: "standard",
    FULL: "full"
};

const COMMANDS = {
    reply: "reply",
    copy: "copy",
    pin: "pin",
    delete: "delete",
    download: "download"
};

const SCROLLING_DELTA = 200;

const AVATAR_TEMPLATE = ({ url, text }) => new kendo.ui.Avatar("<div>", { type: "image", image: url, alt: htmlEncode(text ?? "") }).wrapper[0].outerHTML;

const TYPING_INDICATOR_TEMPLATE = () =>
    '<div class="' + STYLES.typingIndicator + '">' +
    '<span></span>' +
    '<span></span>' +
    '<span></span>' +
    '</div>';

const FILE_TEMPLATE = (file, closeButton, fileMenuButton = true) => `<li class="${STYLES.file}" data-uid="${htmlEncode(file.uid)}">
            ${kendo.ui.icon({ icon: getFileGroup(file.extension, true), size: "xxlarge" })}
            <div class="${STYLES.fileInfo}">
                <span class="${STYLES.fileName}">${htmlEncode(file.name)}</span>
                <span class="${STYLES.fileSize}">${htmlEncode(calculateFileSize(file.size))}</span>
            </div>
            ${closeButton ?
        new kendo.ui.Button(`<button class="" ${REFERENCES.fileCloseButton}>`, {
            icon: ICONS.x,
            fillMode: "flat",
        }).wrapper[0].outerHTML :
        ''
    }
            ${fileMenuButton && !closeButton ?
        `<button ${REFERENCES.fileMenuButton}></button>` :
        ''
    }
        </li>`;

const HEADER_TEMPLATE = (items) => new kendo.ui.AppBar(`<div class="${STYLES.header}">`, {
    items,
    positionMode: "sticky"
}).element[0].outerHTML;

const TEXT_MESSAGE_TEMPLATE = (message, replyMessage, downloadAll, messages, expandable, messageTimeFormat, skipSanitization) => {
    const isDeleted = message.isDeleted;
    const expandableClasses = expandable && !message.isTyping ? [STYLES.bubbleExpandable, STYLES.expanded] : [];

    const replyMessageHtml = replyMessage ? MESSAGE_REFERENCE_TEMPLATE({ text: replyMessage.text, files: replyMessage.files, isOwnMessage: replyMessage.isOwnMessage, isPinMessage: false, renderCloseButton: false, renderFileMenuButton: false }) : '';
    let text = '';
    if (isDeleted) {
        text = message.isOwnMessage
            ? htmlEncode(messages.selfMessageDeleted)
            : htmlEncode(messages.otherMessageDeleted);
    } else {
        text = convertTextUrlToLink(message.text || '', skipSanitization);
    }

    return '<div class="' + STYLES.message + (isDeleted ? ' ' + STYLES.messageRemoved : '') + '" data-uid="' + htmlEncode(message.uid) + '">' +
        '<time class="' + STYLES.messageTime + '">' + kendo.toString(kendo.parseDate(message.timestamp), messageTimeFormat) + '</time>' +
        '<div class="' + STYLES.chatBubble + ' ' + STYLES.bubble + ' ' + expandableClasses.join(' ') + '">' +
        '<div class="' + STYLES.bubbleContent + '">' +
        '<span class="' + STYLES.chatBubbleText + '">' +
        replyMessageHtml +
        (message.isTyping && !message.isOwnMessage ? TYPING_INDICATOR_TEMPLATE() : text) +
        '</span>' +
        (!isDeleted ? FILES_TEMPLATE(message.files, downloadAll, messages) : '') +
        '</div>' +
        (expandable && !message.isTyping ? '<span class="' + STYLES.bubbleExpandableIndicator + '" ' + REFERENCES.bubbleExpandableIndicator + '>' + kendo.ui.icon({ icon: ICONS.chevronUp }) + '</span>' : '') +
        '</div>' +
        (!isDeleted ? '<div class="' + STYLES.messageToolbar + '"></div>' : '') +
        '</div>';
};

const MESSAGE_GROUP_TEMPLATE = ({ message, author, isOwnMessage, replyMessage, downloadAll, messages, expandable, fullWidth, messageTimeFormat, timestampTemplate, showTimestamp, messageTemplate = TEXT_MESSAGE_TEMPLATE, skipSanitization }) => {
    const showAvatar = author && author.imageUrl;
    const groupClasses = STYLES.messageGroup + ' ' +
        (isOwnMessage ? STYLES.messageGroupSender : STYLES.messageGroupReceiver) +
        (showAvatar ? '' : ' ' + STYLES.noAvatar) +
        (fullWidth ? ' ' + STYLES.messageGroupFullWidth : '');

    let timestampContent = '';
    if (showTimestamp && message.timestamp) {
        const messageDate = kendo.parseDate(message.timestamp);
        if (isFunction(timestampTemplate)) {
            timestampContent = timestampTemplate({ date: messageDate, message: message });
        } else {
            const relativeDateText = getRelativeDateString(messageDate);
            timestampContent = '<div class="' + STYLES.timestamp + '">' + relativeDateText + '</div>';
        }
    }

    return (showTimestamp && timestampContent ? timestampContent : '') +
        '<div class="' + groupClasses + '">' +
        (showAvatar ? AVATAR_TEMPLATE({ url: author.imageUrl, text: author.imageAltText }) : '') +
        '<div class="' + STYLES.messageGroupContent + '">' +
        '<span class="' + STYLES.messageAuthor + '">' + htmlEncode(author.name) + '</span>' +
        messageTemplate(message, replyMessage, downloadAll, messages, expandable, messageTimeFormat, skipSanitization) +
        '</div>' +
        '</div>';
};

const FILES_TEMPLATE = (files, downloadAll, messages, closeButton) => {
    if (!files?.length) {
        return '';
    }

    let html = `<ul class="${STYLES.fileWrapper}" ${REFERENCES.fileWrapper}>`;

    files.forEach(file => {
        html += FILE_TEMPLATE(file, closeButton, true);
    });

    html += "</ul>";

    if (downloadAll && files.length > 1) {
        html += `<div class="${STYLES.downloadButtonWrapper}">
            ${new kendo.ui.Button(`<button class="${STYLES.downloadButton}">${messages.downloadAll}</button>`, {
            icon: ICONS.download,
            fillMode: "flat"
        }).wrapper[0].outerHTML}
        </div>`;
    }

    return html;
};

const MESSAGE_REFERENCE_TEMPLATE = ({ text, files, isOwnMessage, isPinMessage, isDeleted, renderCloseButton, renderFileMenuButton, messages }) => {
    const messageReferenceSenderStyle = isOwnMessage ? STYLES.messageReferenceSender : STYLES.messageReferenceReceiver;
    const pinMessageReferenceStyle = isPinMessage ? STYLES.messagePinned : '';
    const closeButtonReference = isPinMessage ? REFERENCES.pinnedMessageCloseButton : REFERENCES.replyMessageCloseButton;
    const wrapperReference = isPinMessage ? REFERENCES.messageReferencePinWrapper : REFERENCES.messageReferenceReplyWrapper;
    let content = convertTextUrlToLink(text || '');

    if (!content) {
        content = files?.length ? FILE_TEMPLATE(files[0], null, renderFileMenuButton) : '';
    }

    if (isDeleted) {
        content = isOwnMessage
            ? htmlEncode(messages.selfMessageDeleted)
            : htmlEncode(messages.otherMessageDeleted);
    }

    return '<div class="' + STYLES.messageReference + ' ' + messageReferenceSenderStyle + ' ' + pinMessageReferenceStyle + '" ' + wrapperReference + '>' +
        (isPinMessage ? kendo.ui.icon({ icon: ICONS.pin, size: "xlarge" }) : '') +
        '<div class="' + STYLES.messageReferenceContent + '">' + content + '</div>' +
        '<span class="' + STYLES.spacer + '"></span>' +
        (renderCloseButton ? new kendo.ui.Button('<button ' + closeButtonReference + '>', {
            icon: ICONS.x,
            fillMode: "flat"
        }).wrapper[0].outerHTML : '') +
        '</div>';
};

const SUGGESTIONS_TEMPLATE = (suggestions) => {
    if (!suggestions?.length) {
        return '';
    }

    return `<div class="${STYLES.suggestionGroup}" ${REFERENCES.suggestionGroup}>${suggestions.map(suggestion => `<span class="${STYLES.suggestion}">${htmlEncode(suggestion.text)}</span>`).join('')}</div>`;
};

const SCROLLABLE_SUGGESTIONS_TEMPLATE = (suggestionsElement, isRtl) =>
    '<div class="' + STYLES.suggestionScrollWrap + '">' +
    new kendo.ui.Button('<button ' + REFERENCES.leftScrollButton + '>', {
        icon: isRtl ? ICONS.chevronRight : ICONS.chevronLeft
    }).wrapper[0].outerHTML +
    suggestionsElement +
    new kendo.ui.Button('<button ' + REFERENCES.rightScrollButton + '>', {
        icon: isRtl ? ICONS.chevronLeft : ICONS.chevronRight
    }).wrapper[0].outerHTML +
    '</div>';

const NAVIGATION_NS = `${NS}navigation`;
let isKeyEvent = null;
let isShiftKey = false;

/**
 * Sets up ARIA attributes for the Chat component according to WCAG 2.1 AA compliance
 * @param {jQuery} wrapper - Chat wrapper element
 * @param {Object} options - Chat options containing messages
 */
const setupChatAriaAttributes = (wrapper, options) => {
    const messages = options.messages;

    const messageList = wrapper.find(`.${STYLES.messageList}`);
    if (messageList.length) {
        messageList
            .attr("role", "log")
            .attr("aria-live", "polite")
            .attr("aria-label", messages.messageListLabel);
    }

    setupBubbleTabNavigation(wrapper);

    const suggestionGroups = wrapper.find(`.${STYLES.suggestionGroup}`);
    suggestionGroups.each((_index, element) => {
        const $group = $(element);
        $group.attr("role", "group");

        const suggestions = $group.find(`.${STYLES.suggestion}`);
        suggestions.each((_suggestionIndex, suggestionElement) => {
            const $suggestion = $(suggestionElement);
            $suggestion
                .attr("role", "button")
                .attr("tabindex", "0");
        });
    });

    const suffixButtons = wrapper.find(".k-input-suffix > .k-button");
    suffixButtons.each((index, element) => {
        const $button = $(element);

        if (!$button.attr("role") && $button[0].nodeName.toLowerCase() !== "button") {
            $button.attr("role", "button");
        }

        if (!$button.attr("aria-label") && !$button.attr("title")) {
            if ($button.hasClass(STYLES.chatSend)) {
                $button.attr("aria-label", messages.sendButton);
            } else if ($button.hasClass("k-chat-upload")) {
                $button.attr("aria-label", messages.fileButton);
            }
        }

        if ($button.hasClass(STYLES.chatSend) && $button.hasClass("k-disabled")) {
            $button.attr("aria-disabled", "true");
        }
    });

    const downloadButtons = wrapper.find(`.${STYLES.downloadButton}`);
    downloadButtons.each((index, element) => {
        const $button = $(element);

        if (!$button.attr("role") && $button[0].nodeName.toLowerCase() !== "button") {
            $button.attr("role", "button");
        }

        if (!$button.attr("aria-label") && !$button.attr("title")) {
            $button.attr("aria-label", messages.downloadAll);
        }
    });

    const pinnedMessageCloseButton = wrapper.find(`[${REFERENCES.pinnedMessageCloseButton}]`);
    pinnedMessageCloseButton.each((index, element) => {
        const $button = $(element);

        if (!$button.attr("role") && $button[0].nodeName.toLowerCase() !== "button") {
            $button.attr("role", "button");
        }

        if (!$button.attr("aria-label") && !$button.attr("title")) {
            $button.attr("aria-label", options.messages.pinnedMessageCloseButton);
            $button.attr("title", options.messages.pinnedMessageCloseButton);
        }
    });

    setReplyMessageAriaAttributes(wrapper, options);

    const fileMenuButtons = wrapper.find(`[${REFERENCES.fileMenuButton}]`);
    fileMenuButtons.each((index, element) => {
        const $button = $(element);

        $button.attr("aria-label", options.messages.fileMenuButton);
        $button.attr("title", options.messages.fileMenuButton);
    });

    const expandableIndicators = wrapper.find(`.${STYLES.bubbleExpandableIndicator}`);
    expandableIndicators.each((index, element) => {
        const $indicator = $(element);
        $indicator
            .attr("role", "button")
            .attr("tabindex", "0");

        const bubble = $indicator.closest(`.${STYLES.bubble}`);
        const isExpanded = bubble.hasClass(STYLES.expanded);
        const label = isExpanded ? "Collapse message" : "Expand message";
        $indicator.attr("aria-label", label);
    });

    setScrollButtonsAriaAttributes(wrapper);

    const messageBox = wrapper.find(`.${STYLES.messageBox}`);
    messageBox.find("textarea").attr("aria-label", messages.messageBoxLabel);
};

/**
 * Sets up tabindex navigation for chat bubbles
 * @param {jQuery} wrapper - Chat wrapper element
 */
const setupBubbleTabNavigation = (wrapper) => {
    const allBubbles = wrapper.find(`.${STYLES.bubble}`);

    const interactableBubbles = allBubbles.filter(function() {
        return $(this).find(`.${STYLES.typingIndicator}`).length === 0;
    });

    const typingIndicatorBubbles = allBubbles.filter(function() {
        return $(this).find(`.${STYLES.typingIndicator}`).length > 0;
    });

    interactableBubbles.attr("tabindex", "0");
    typingIndicatorBubbles.attr("tabindex", "-1");

    interactableBubbles.off(`${FOCUS}${NAVIGATION_NS} ${BLUR}${NAVIGATION_NS} ${CLICK}${NAVIGATION_NS}`).on(`${FOCUS}${NAVIGATION_NS}`, function() {
        const $this = $(this);

        if (isKeyEvent) {
            allBubbles.removeClass(STYLES.selected);
        }

        allBubbles.removeClass(STYLES.focus);

        if (isKeyEvent) {
            $this.addClass(STYLES.selected);
        }

        $this.addClass(STYLES.focus);
        isKeyEvent = false;
    }).on(`${BLUR}${NAVIGATION_NS}`, function() {
        // Do not remove selected if we are using shift key(because of context menu open combo).
        // Only remove on keyboard navigation, do not remove when clicking on an element inside the bubble.
        if (isKeyEvent && !isShiftKey) {
            $(this).removeClass(STYLES.selected);
        }
        $(this).removeClass(STYLES.focus);
    }).on(`${CLICK}${NAVIGATION_NS}`, function(e) {
        if ($(e.target).closest(REFERENCES.fileMenuButton)) {
            return;
        }

        $(this).trigger(FOCUS);
    });
};

/**
 * Updates ARIA attributes for expandable indicators when their state changes
 * @param {jQuery} indicator - The expandable indicator element
 * @param {boolean} isExpanded - Whether the bubble is expanded
 */
const updateExpandableIndicatorAria = (indicator, isExpanded) => {
    const label = isExpanded ? "Collapse message" : "Expand message";
    indicator.attr("aria-label", label);
};

/**
 * Handles keyboard navigation for the Chat component
 * @param {Event} e - Keyboard event
 * @param {jQuery} wrapper - Chat wrapper element
 * @param {Object} messageBox - MessageBox instance for triggering send
 * @returns {Object|null} - Result object with action to be taken, or null if no action needed
 */
const handleChatKeyDown = (e, wrapper, messageBox) => {
    if (!$(e.target).closest(wrapper).length) {
        return null;
    }

    const target = $(e.target);
    const key = e.keyCode || e.which;

    isKeyEvent = true;
    isShiftKey = e.shiftKey;

    if (target.hasClass(STYLES.bubble)) {
        handleBubbleKeyDown(e, key, wrapper);
    }

    if (target.hasClass(STYLES.suggestion)) {
        handleClickableElementKeyDown(e, key);
    }

    if (target.hasClass(STYLES.bubbleExpandableIndicator)) {
        handleExpandableIndicatorKeyDown(e, key);
    }

    if (target.hasClass("k-input-inner")) {
        handleMessageInputKeyDown(e, key, wrapper, messageBox);
    }

    if (target.closest(".k-input-suffix .k-button").length) {
        handleClickableElementKeyDown(e, key);
    }

    return null;
};

const moveToPreviousBubble = (bubbles, currentIndex) => {
    if (currentIndex > 0) {
        const newIndex = currentIndex - 1;
        focusBubbleAtIndex(bubbles, newIndex);
    }
};

const moveToNextBubble = (bubbles, currentIndex) => {
    if (currentIndex < bubbles.length - 1) {
        const newIndex = currentIndex + 1;
        focusBubbleAtIndex(bubbles, newIndex);
    }
};

const moveToFirstBubble = (bubbles) => {
    focusBubbleAtIndex(bubbles, 0);
};

const moveToLastBubble = (bubbles) => {
    focusBubbleAtIndex(bubbles, bubbles.length - 1);
};

const focusBubbleAtIndex = (bubbles, index) => {
    if (bubbles.length === 0 || index < 0 || index >= bubbles.length) {
        return;
    }

    const targetBubble = bubbles.eq(index);

    targetBubble.attr("data-keyboard-focus", "true");
    targetBubble.focus();
    targetBubble.removeAttr("data-keyboard-focus");
};

const handleBubbleKeyDown = (e, key, wrapper) => {
    const currentBubble = $(e.target);

    if (currentBubble.find(`.${STYLES.typingIndicator}`).length > 0) {
        return null;
    }

    const allBubbles = wrapper.find(`.${STYLES.bubble}`);
    const bubbles = allBubbles.filter(function() {
        return $(this).find(`.${STYLES.typingIndicator}`).length === 0;
    });

    const currentIndex = bubbles.index(currentBubble);

    switch (key) {
        case KEYS.UP:
            e.preventDefault();
            moveToPreviousBubble(bubbles, currentIndex);
            break;
        case KEYS.DOWN:
            e.preventDefault();
            moveToNextBubble(bubbles, currentIndex);
            break;
        case KEYS.HOME:
            e.preventDefault();
            moveToFirstBubble(bubbles);
            break;
        case KEYS.END:
            e.preventDefault();
            moveToLastBubble(bubbles);
            break;
    }

    return null;
};

const handleExpandableIndicatorKeyDown = (e, key) => {
    if (key === KEYS.ENTER || key === KEYS.SPACEBAR) {
        e.preventDefault();
        $(e.target).trigger(CLICK);
        const indicator = $(e.target);
        const bubble = indicator.closest(`.${STYLES.bubble}`);
        const isExpanded = bubble.hasClass(STYLES.expanded);
        updateExpandableIndicatorAria(indicator, !isExpanded);
    }
};

const handleMessageInputKeyDown = (e, key, wrapper, messageBox) => {
    if (key === KEYS.ENTER && !e.shiftKey) {
        e.preventDefault();

        messageBox._sendMessage();
    }
};

const handleClickableElementKeyDown = (e, key) => {
    if (key === KEYS.ENTER || key === KEYS.SPACEBAR) {
        e.preventDefault();
        $(e.target).trigger(CLICK);
    }
};

const setReplyMessageAriaAttributes = (wrapper, options) => {
    const replyMessageCloseButton = wrapper.find(`[${REFERENCES.replyMessageCloseButton}]`);
    replyMessageCloseButton.each((index, element) => {
        const $button = $(element);

        if (!$button.attr("role") && $button[0].nodeName.toLowerCase() !== "button") {
            $button.attr("role", "button");
        }

        if (!$button.attr("aria-label") && !$button.attr("title")) {
            $button.attr("aria-label", options.messages.replyMessageCloseButton);
            $button.attr("title", options.messages.replyMessageCloseButton);
        }
    });
};

const setFileCloseButtonAriaAttributes = (wrapper) => {
    const fileCloseButton = wrapper.find(`[${REFERENCES.fileCloseButton}]`);

    fileCloseButton.each((index, element) => {
        const $button = $(element);

        if (!$button.attr("role") && $button[0].nodeName.toLowerCase() !== "button") {
            $button.attr("role", "button");
        }

        if (!$button.attr("aria-label") && !$button.attr("title")) {
            $button.attr("aria-label", "Remove selected file");
            $button.attr("title", "Remove selected file");
        }
    });
};

const setScrollButtonsAriaAttributes = (wrapper) => {
    const leftScrollButton = wrapper.find(`[${REFERENCES.leftScrollButton}]`);
    const rightScrollButton = wrapper.find(`[${REFERENCES.rightScrollButton}]`);

    leftScrollButton.attr("aria-label", "Scroll Left");
    leftScrollButton.attr("title", "Scroll Left");

    rightScrollButton.attr("aria-label", "Scroll Right");
    rightScrollButton.attr("title", "Scroll Right");
};

/**
 * @typedef {import("../../typedefs/typedefs.js").Chat.MessageBoxOptions} MessageBoxOptions
 * @typedef {import("../../typedefs/typedefs.js").Chat.Message} Message
 * @typedef {import("../../typedefs/typedefs.js").Chat.File} ChatFile
 */

const suffixTemplate = ({ messages, speechToTextButtonEnabled, fileAttachmentButtonEnabled }) => {
    const speechToTextButton = speechToTextButtonEnabled ? `<button title="${messages.speechToTextButton}" aria-label="${messages.speechToTextButton}" ${REFERENCES.speechToTextButton}></button>` : "";

    const fileButton = fileAttachmentButtonEnabled ? kendo.html.renderButton(`<button title="${messages.fileButton}" aria-label="${messages.fileButton}" ${REFERENCES.fileButton}></button>`,
        {
            icon: ICONS.attachment,
            size: "medium",
            fillMode: "clear"
        }) : "";

    const sendButton = kendo.html.renderButton(`<button title="${messages.sendButton}" aria-label="${messages.sendButton}" class="${STYLES.chatSend} ${STYLES.disabled}" ${REFERENCES.sendButton}></button>`,
        {
            icon: ICONS.send,
            size: "medium",
            rounded: "full",
            fillMode: "solid",
            themeColor: "primary"
        });

    const fileInput = fileAttachmentButtonEnabled ? `<input type="file" ${REFERENCES.fileUploadInput} id="input_${guid()}" class="k-hidden" />` : "";

    const spacer = `<span class="${STYLES.spacer}"></span>`;

    return speechToTextButton + fileButton + fileInput + spacer + sendButton;
};

/**
 * MessageBox handles the input area of the chat component.
 * Manages text input, file attachments, speech-to-text, and message sending functionality.
 *
 * @extends {Widget<MessageBoxOptions>}
 */
class MessageBox extends Widget {
    /** @type {MessageBoxOptions} */
    static options = {
        name: "MessageBox"
    };

    /**
     * Constructs a new MessageBox instance
     * @param {jQuery} element - jQuery element to attach the message box to
     * @param {MessageBoxOptions} options - MessageBox configuration options
     */
    constructor(element, options) {
        super(element, extend(true, {}, MessageBox.options, options));
        this.chatElement = options.chatElement;
        this._files = [];
        this._generating = false;

        this._wrapper();
        this._initTextArea();

        if (options.fileAttachment !== false) {
            this._initUpload();
        }

        if (options.speechToText !== false) {
            this._initSpeechToTextButton();
        }

        this._attachEvents();
        this._typing = false;
        this._files = [];
    }

    /**
     * Creates the wrapper element for the message box
     */
    _wrapper() {
        const options = this.options;
        const suggestionsElement = options.suggestionsTemplate(options.suggestions);
        this.wrapper = $(`<div class="${STYLES.messageBoxWrapper}"></div>`);

        if (options.suggestions.length) {
            const suggestionsScrollableWrapper = options.suggestionsScrollable ?
                SCROLLABLE_SUGGESTIONS_TEMPLATE(suggestionsElement, options.dir === "rtl") :
                suggestionsElement;

            this.suggestions = this.wrapper.append(suggestionsScrollableWrapper);
        }

        this.wrapper.find(`[${REFERENCES.leftScrollButton}]`).addClass(STYLES.disabled);

        this.chatElement.append(this.wrapper);
    }

    /**
     * Updates the attachment list display in the message box
     */
    updateAttachmentList() {
        const attachmentContainer = this.getAttachmentListContainer();
        const attachmentTemplate = this.options.filesTemplate(this._files, false, {}, true);

        if (attachmentContainer.length === 0) {
            this.textAreaInstance._prefixContainer.append(attachmentTemplate);
        } else {
            attachmentContainer.replaceWith(attachmentTemplate);
        }

        setFileCloseButtonAriaAttributes(this.textAreaInstance._prefixContainer);

        this.toggleSendButton(this._files.length > 0);
    }

    /**
     * Gets the attachment list container element
     * @returns {jQuery} The attachment container element
     */
    getAttachmentListContainer() {
        return this.textAreaInstance._prefixContainer.find(`[${REFERENCES.fileWrapper}]`);
    }

    /**
     * Clears all file attachments from the message box
     */
    clearAttachmentList() {
        this._files = [];
        const attachmentContainer = this.getAttachmentListContainer();

        if (attachmentContainer.length > 0) {
            attachmentContainer.remove();
        }

        this.toggleSendButton(false);
    }

    /**
     * Sets a reply message in the message box interface
     * @param {Message} message - Message being replied to
     * @param {boolean} isOwnMessage - Whether the reply message belongs to current user
     */
    setReplyMessage(message, isOwnMessage) {
        const replyContainer = this.getReplyMessageContainer();
        const replyTemplate = this.options.messageReferenceTemplate({ text: message.text, files: message.files, isOwnMessage, renderCloseButton: true, renderFileMenuButton: false });

        if (replyContainer.length === 0) {
            this.textAreaInstance._prefixContainer.prepend(replyTemplate);
        } else {
            replyContainer.replaceWith(replyTemplate);
        }
    }

    /**
     * Removes the reply message from the message box interface
     */
    removeReplyMessage() {
        const replyContainer = this.getReplyMessageContainer();
        if (replyContainer.length > 0) {
            replyContainer.remove();
        }
    }

    /**
     * Gets the reply message container element
     * @returns {jQuery} The reply message container element
     */
    getReplyMessageContainer() {
        return this.textAreaInstance._prefixContainer.find(`[${REFERENCES.messageReferenceReplyWrapper}]`);
    }

    /**
     * Toggles the send button enabled/disabled state
     * @param {boolean} enabled - Whether the send button should be enabled
     */
    toggleSendButton(enabled) {
        const sendButton = this.wrapper.find(`[${REFERENCES.sendButton}]`);

        if (enabled) {
            sendButton.removeClass(STYLES.disabled);
        } else if (!this._generating) {
            sendButton.addClass(STYLES.disabled);
        }
    }

    /**
     * Toggles the send button generating state (shows loading indicator)
     * @param {boolean} generating - Whether to show generating state
     */
    toggleSendButtonGenerating(generating) {
        const sendButton = this.wrapper.find(`[${REFERENCES.sendButton}]`);

        sendButton.toggleClass(STYLES.generating, generating).toggleClass(STYLES.disabled, !generating);
        this._generating = generating;

        if (generating) {
            sendButton.attr("aria-disabled", false);
            sendButton.html(kendo.ui.icon({ icon: ICONS.stop, iconClass: STYLES.buttonIcon }));
        } else {
            sendButton.attr("aria-disabled", true);
            sendButton.html(kendo.ui.icon({ icon: ICONS.send, iconClass: STYLES.buttonIcon }));
        }
    }

    /**
     * Attaches event handlers to message box elements
     */
    _attachEvents() {
        this.element
            .on(INPUT + NS, this._input.bind(this));

        this.wrapper
            .on(CLICK + NS, `[${REFERENCES.sendButton}]`, this._sendButtonClick.bind(this))
            .on(CLICK + NS, `[${REFERENCES.fileButton}]`, this._fileButtonClick.bind(this))
            .on(CLICK + NS, `[${REFERENCES.replyMessageCloseButton}]`, this._replyMessageCloseButtonClick.bind(this))
            .on(CLICK + NS, `[${REFERENCES.suggestionGroup}]`, this._suggestionClick.bind(this))
            .on(CLICK + NS, `[${REFERENCES.leftScrollButton}]`, this._leftScrollButtonClick.bind(this))
            .on(CLICK + NS, `[${REFERENCES.rightScrollButton}]`, this._rightScrollButtonClick.bind(this))
            .on(CLICK + NS, `[${REFERENCES.fileCloseButton}]`, this._fileCloseButtonClick.bind(this));
    }

    /**
     * Initializes the text area component
     */
    _initTextArea() {
        const options = this.options;
        const messages = options.messages || {};
        const inputId = "inputId_" + guid();
        const speechToTextButtonEnabled = options.speechToText !== false;
        const fileAttachmentButtonEnabled = options.fileAttachment !== false;

        const textarea = this.element.kendoTextArea({
            resize: "auto",
            maxRows: 5,
            placeholder: messages.placeholder,
            suffixOptions: {
                template: () => suffixTemplate({ messages, speechToTextButtonEnabled, fileAttachmentButtonEnabled }),
                separator: false
            },
            prefixOptions: {
                template: () => "",
                separator: false
            }
        }).data("kendoTextArea");

        textarea.element.attr("id", inputId);

        textarea.wrapper
            .addClass(STYLES.messageBox)
            .appendTo(this.wrapper);

        this.textAreaInstance = textarea;
    }

    /**
     * Initializes the file upload component
     */
    _initUpload() {
        const upload = this.wrapper.find(`[${REFERENCES.fileUploadInput}]`).kendoUpload({
            multiple: true,
            async: false,
            uniqueFileUids: true,
            select: this._uploadSelect.bind(this),
        }).data("kendoUpload");

        upload.wrapper.addClass(STYLES.hidden);

        this.uploadInstance = upload;
    }

    /**
     * Handles file upload selection
     * @param {Object} e - Upload select event
     */
    _uploadSelect(e) {
        e.preventDefault();
        const files = e.files;
        this._files = [...this._files, ...files];
        this.updateAttachmentList();
    }

    /**
     * Initializes the speech-to-text button
     */
    _initSpeechToTextButton() {
        const options = this.options;
        const defaultOptions = {
            fillMode: "clear",
            result: this._speechToTextResult.bind(this)
        };
        const speechToTextOptions = isObject(options.speechToText) ? { ...defaultOptions, ...options.speechToText } : defaultOptions;

        this.speechToTextButtonInstance = this.wrapper.find(`[${REFERENCES.speechToTextButton}]`).kendoSpeechToTextButton(speechToTextOptions).data("kendoSpeechToTextButton");
    }

    /**
     * Handles speech-to-text result
     * @param {Object} e - Speech recognition result event
     */
    _speechToTextResult(e) {
        const textarea = this.textAreaInstance;
        let currentValue = textarea.value();
        let transcript = "";
        if (e.alternatives && e.alternatives[0]) {
            transcript = e.alternatives[0].transcript;
            currentValue += " " + transcript;
            textarea.value(currentValue);
        }

        if (currentValue.length > 0) {
            this.toggleSendButton(true);
        }
    }

    /**
     * Handles input events from the text area
     */
    _input() {
        const currentValue = this.element.val();
        const start = currentValue.length > 0;

        this.toggleSendButton(start);
        this.trigger("input", { value: currentValue });
    }

    /**
     * Handles send button click events
     * @param {Event} e - Click event
     */
    _sendButtonClick(e) {
        e.preventDefault();

        this._sendMessage();
    }

    /**
     * Handles file button click events
     * @param {Event} e - Click event
     */
    _fileButtonClick(e) {
        e.preventDefault();

        this.trigger("fileButtonClick");
    }

    /**
     * Handles file close button click events
     * @param {Event} e - Click event
     */
    _fileCloseButtonClick(e) {
        e.preventDefault();
        const fileElement = $(e.currentTarget).closest(`${DOT}${STYLES.file}`);
        const fileUid = fileElement.data("uid");

        this._files = this._files.filter(file => file.uid !== fileUid);
        this.updateAttachmentList();
    }

    /**
     * Handles reply message close button click events
     * @param {Event} e - Click event
     */
    _replyMessageCloseButtonClick(e) {
        e.preventDefault();
        this.trigger("replyMessageCloseButtonClick");
    }

    /**
     * Handles suggestion click events
     * @param {Event} e - Click event
     */
    _suggestionClick(e) {
        e.preventDefault();
        const text = $(e.target).closest(DOT + STYLES.suggestion).text();
        this.trigger("suggestionClick", { text });
        this.textAreaInstance.value(text);
        this.toggleSendButton(true);
    }

    /**
     * Sends a message from the message box
     */
    _sendMessage() {
        const value = this.element.val();

        if (this._generating) {
            this.trigger("sendMessage", { generating: true });
            return;
        }

        if ((!value.length && !this._files?.length)) {
            return;
        }

        const args = {
            text: value,
            files: this._files
        };

        this.trigger("sendMessage", args);

        this.textAreaInstance.value("");
        this.textAreaInstance.updateAutoHeight();
        this.clearAttachmentList();
    }

    /**
     * Handles left scroll button click for suggestions
     * @param {Event} e - Click event
     */
    _leftScrollButtonClick(e) {
        e.preventDefault();
        const button = $(e.currentTarget);
        const scrollableElement = this.wrapper.find(`${DOT}${STYLES.suggestionGroup}`);
        const isRtl = this.options.dir === RTL;

        const position = scrollByDelta(scrollableElement, isRtl ? SCROLLING_DELTA : -200);

        this.wrapper.find(`[${REFERENCES.rightScrollButton}]`).removeClass(STYLES.disabled);

        if (isRtl ? position.atEnd : position.atStart) {
            button.addClass(STYLES.disabled);
        }
    }

    /**
     * Handles right scroll button click for suggestions
     * @param {Event} e - Click event
     */
    _rightScrollButtonClick(e) {
        e.preventDefault();
        const button = $(e.currentTarget);
        const scrollableElement = this.wrapper.find(`${DOT}${STYLES.suggestionGroup}`);
        const isRtl = this.options.dir === RTL;

        const position = scrollByDelta(scrollableElement, isRtl ? -200 : SCROLLING_DELTA);

        this.wrapper.find(`[${REFERENCES.leftScrollButton}]`).removeClass(STYLES.disabled);

        if (isRtl ? position.atStart : position.atEnd) {
            button.addClass(STYLES.disabled);
        }
    }

    destroy() {
        if (this.textAreaInstance) {
            this.textAreaInstance.destroy();
        }

        if (this.speechToTextButtonInstance) {
            this.speechToTextButtonInstance.destroy();
        }

        this.wrapper.remove();
    }
}

/**
 * @typedef {import("../../typedefs/typedefs.js").Chat.MessageToolbarOptions} MessageToolbarOptions
 * @typedef {import("../../typedefs/typedefs.js").Chat.ToolbarAction} ChatToolbarAction
 */

/**
 * MessageToolbar provides toolbar functionality for chat messages.
 * Handles quick actions that can be performed on messages through toolbar buttons.
 *
 * @extends {Widget<MessageToolbarOptions>}
 */
class MessageToolbar extends Widget {
    /** @type {MessageToolbarOptions} */
    static options = {
        name: "MessageToolbar"
    };

    /**
     * Constructs a new MessageToolbar instance
     * @param {jQuery} element - jQuery element to attach the toolbar to
     * @param {MessageToolbarOptions} options - MessageToolbar configuration options
     */
    constructor(element, options) {
        super(element, extend(true, {}, MessageToolbar.options, options));

        this.extendItemsConfig();
        this.create();
        this.attachEvents();
    }

    /**
     * Creates the underlying Kendo UI ToolBar
     */
    create() {
        if (this.element.data("kendoMessageToolbar")) {
            this.destroy();
        }

        this.toolbar = new kendo.ui.ToolBar(this.element, this.options);
    }

    /**
     * Extends items configuration with default properties
     */
    extendItemsConfig() {
        if (this.options.items) {
            this.options.items.forEach((item) => {
                item.attributes = item.attributes || {};

                let ariaLabel = item.attributes["aria-label"];

                item.attributes["data-command"] = item.name.toLowerCase();
                item.attributes["aria-label"] = ariaLabel ?? item.name;
                item.type = "button";
                item.fillMode = "flat";
                item.overflow = "never";
            });
        }
    }

    /**
     * Destroys the MessageToolbar and cleans up resources
     */
    destroy() {
        if (this.toolbar) {
            this.toolbar.destroy();
            this.toolbar = null;
        }

        this.element.empty();
    }

    /**
     * Attaches event handlers to the toolbar
     */
    attachEvents() {
        this.toolbar.bind(CLICK, this.onClick.bind(this));
    }

    /**
     * Handles toolbar button clicks
     * @param {Object} e - Click event
     */
    onClick(e) {
        const message = e.target.closest(DOT + STYLES.message);
        const command = e.target.data("command");
        if (command) {
            this.executeCommand(command, e.target, message);
        }
    }

    /**
     * Executes a command from the toolbar
     * @param {string} command - Command to execute
     * @param {jQuery} item - Toolbar item element
     * @param {jQuery} message - Message element
     */
    executeCommand(command, item, message) {
        this.trigger("execute", { type: command, item, message });
    }
}

/**
 * @typedef {import("../../typedefs/typedefs.js").Chat.FileMenuOptions} FileMenuOptions
 * @typedef {import("../../typedefs/typedefs.js").Chat.MenuAction} ChatMenuAction
 */

/**
 * ChatFileMenu provides dropdown button functionality for file attachments.
 * Handles actions like download, preview, and delete for individual files.
 *
 * @extends {Widget<FileMenuOptions>}
 */
class ChatFileMenu extends Widget {
    /** @type {FileMenuOptions} */
    static options = {
        name: "ChatFileMenu",
        items: []
    };

    /**
     * Constructs a new ChatFileMenu instance
     * @param {jQuery} element - jQuery element to attach the menu to
     * @param {FileMenuOptions} options - FileMenu configuration options
     */
    constructor(element, options) {
        super(element, extend(true, {}, ChatFileMenu.options, options));

        this.setCommandAttributes();
        this.createDropdownButton();
    }

    /**
     * Creates a dropdown button on the element
     */
    createDropdownButton() {
        this.dropdownButton = new kendo.ui.DropDownButton(this.element, {
            items: this.options.items,
            fillMode: "flat",
            icon: ICONS.attachmentMenu
        });

        this.dropdownButton.bind("click", this.onClick.bind(this))
            .bind("open", this.onOpen.bind(this))
            .bind("close", this.onClose.bind(this));
    }

    /**
     * Sets command attributes on menu items for identification
     */
    setCommandAttributes() {
        this.options.items.forEach((item) => {
            item.attributes = item.attributes || {};
            item.attributes["data-command"] = item.name.toLowerCase();
            item.id = item.name.toLowerCase();
        });
    }

    /**
     * Destroys the ChatFileMenu and cleans up resources
     */
    destroy() {
        if (this.dropdownButton) {
            this.dropdownButton.destroy();
            this.dropdownButton = null;
        }

        super.destroy();
    }

    /**
     * Handles dropdown button item click
     * @param {Object} e - Click event
     */
    onClick(e) {
        const command = e.id;
        const file = $(e.sender.element).closest(DOT + STYLES.file);
        const message = $(e.sender.element).closest(DOT + STYLES.message);

        if (command) {
            this.executeCommand(command, $(e.sender.element), file, message);
        }
    }

    /**
     * Handles dropdown open event
     * @param {Object} e - Open event
     */
    onOpen(e) {
        let setActive = true;
        const target = $(e.sender.element);

        if (target.closest(DOT + STYLES.messageRemoved).length || target.find(DOT + STYLES.typingIndicator).length) {
            e.preventDefault();
            setActive = false;
        }

        this.setActive(target, setActive);
    }

    /**
     * Handles dropdown close event
     * @param {Object} e - Close event
     */
    onClose(e) {
        const target = $(e.sender.element);
        const message = target.closest(DOT + STYLES.message);
        this.setActive(target, false);
        this.trigger("close", { message });
    }

    /**
     * Executes a command from the file menu
     * @param {string} command - Command to execute
     * @param {jQuery} item - Menu item element
     * @param {jQuery} file - File element
     * @param {jQuery} message - Message element
     */
    executeCommand(command, item, file, message) {
        this.trigger("execute", { type: command, item, file, message });
    }

    /**
     * Sets the active state for a target element
     * @param {jQuery} target - Target element
     * @param {boolean} active - Whether to set active state
     */
    setActive(target, active) {
        const bubble = target.closest(DOT + STYLES.bubble);

        if (active) {
            bubble.addClass(STYLES.active);
        } else {
            bubble.removeClass(STYLES.active);
        }
    }
}

/**
 * @typedef {import("../../typedefs/typedefs.js").Chat.Message} Message
 * @typedef {import("../../typedefs/typedefs.js").Chat.ViewOptions} ChatViewOptions
 * @typedef {import("../../typedefs/typedefs.js").Chat.File} ChatFile
 * @typedef {import("../../typedefs/typedefs.js").Chat.DataManager} DataManager
 */

/**
 * ChatView handles the visual rendering and display of chat messages.
 * Manages message grouping, scrolling, and user interactions within the chat interface.
 *
 * @extends {Widget<ChatViewOptions>}
 */
class ChatView extends Widget {
    /** @type {ChatViewOptions} */
    static options = {
        name: "ChatView"
    };

    /**
     * Constructs a new ChatView instance
     * @param {jQuery} element - jQuery element to attach the view to
     * @param {ChatViewOptions} options - ChatView configuration options
     */
    constructor(element, options) {
        super(element, extend(true, {}, ChatView.options, options));

        this._dataManager = this.options.dataManager;
        this._list();

        this._attachEvents();
    }

    /**
     * Gets the list of events supported by the ChatView
     * @returns {string[]} Array of event names
     */
    get events() {
        return [];
    }

    /**
     * Destroys the ChatView and cleans up resources
     */
    destroy() {
        super.destroy();

        this.element.find("[data-role='chatfilemenu']").each(function() {
            const fileMenu = $(this).data("kendoChatFileMenu");
            if (fileMenu) {
                fileMenu.destroy();
            }
        });

        this.element.empty();
        this.element.off(NS);

        this.list = null;
    }

    /**
     * Initializes the message list element
     */
    _list() {
        this.element
            .addClass(STYLES.messageList)
            .attr("role", "log")
            .attr("aria-label", this.options.messages.messageListLabel);

        this.list = $("<div>")
            .addClass(STYLES.messageListContent)
            .appendTo(this.element);
    }

    /**
     * Attaches event handlers to the chat view
     */
    _attachEvents() {
        this.element
            .on(CLICK + NS, this._listClick.bind(this))
            .on(CLICK + NS, DOT + STYLES.message, this._messageClick.bind(this))
            .on(CLICK + NS, DOT + STYLES.suggestion, this._suggestionClick.bind(this))
            .on(CLICK + NS, `[${REFERENCES.leftScrollButton}]`, this._leftScrollButtonClick.bind(this))
            .on(CLICK + NS, `[${REFERENCES.rightScrollButton}]`, this._rightScrollButtonClick.bind(this))
            .on(CLICK + NS, DOT + STYLES.downloadButton, this._downloadAllClick.bind(this));
    }

    /**
     * Render a message in the chat view with proper grouping and formatting
     * @param {Message} message - Message to render
     */
    renderMessage(message) {
        const componentMessages = this.options.messages;
        const expandable = this.options.allowMessageCollapse;
        const fullWidth = this.options.messageWidthMode === MESSAGE_WIDTH_MODE.FULL;
        const author = {
            id: message.authorId,
            name: message.authorName,
            imageUrl: message.authorImageUrl,
            imageAltText: message.authorImageAltText
        };
        const isOwnMessage = author.id === this.options.authorId;
        const replyMessage = this.getReplyMessage(message);
        const messageTimeFormat = this.options.messageTimeFormat;
        const skipSanitization = this.options.skipSanitization;

        // Handle existing message updates
        if (this._handleExistingMessageUpdate({ message, author, isOwnMessage, replyMessage, componentMessages, expandable, messageTimeFormat, skipSanitization })) {
            return;
        }

        const targetGroupElement = this._findTargetMessageGroup();
        const canGroup = this._canGroupWithLastMessage(targetGroupElement, author.id);

        if (canGroup && targetGroupElement.length) {
            this._addMessageToExistingGroup({ message, author, isOwnMessage, replyMessage, componentMessages, expandable, targetGroupElement, messageTimeFormat, skipSanitization });
        } else {
            const showTimestamp = this._shouldShowTimestamp(message);
            this._createNewMessageGroup({ message, author, isOwnMessage, replyMessage, componentMessages, expandable, fullWidth, messageTimeFormat, showTimestamp, skipSanitization });
        }
    }

    /**
     * Determines whether a timebreak should be shown before this message
     * @param {Message} message - The message being rendered
     * @returns {boolean} True if a timebreak should be shown
     */
    _shouldShowTimestamp(message) {
        if (!message.timestamp) {
            return false;
        }

        // Find the last non-typing message in the chat
        const lastNonTypingMessage = this.list.find(DOT + STYLES.message).filter(function() {
            return $(this).find(DOT + STYLES.typingIndicator).length === 0;
        }).last();

        if (!lastNonTypingMessage.length) {
            // This is the first message, show timebreak
            return true;
        }

        const lastMessageData = this.dataItem(lastNonTypingMessage);
        if (!lastMessageData || !lastMessageData.timestamp) {
            return true;
        }

        // Parse dates and compare days
        const currentMessageDate = kendo.parseDate(message.timestamp);
        const lastMessageDate = kendo.parseDate(lastMessageData.timestamp);

        if (!currentMessageDate || !lastMessageDate) {
            return false;
        }

        // Compare dates at day level (ignore time)
        const currentDay = new Date(currentMessageDate);
        currentDay.setHours(0, 0, 0, 0);

        const lastDay = new Date(lastMessageDate);
        lastDay.setHours(0, 0, 0, 0);

        return currentDay.getTime() !== lastDay.getTime();
    }

    /**
     * Initializes the message toolbar for a message element
     * @param {jQuery} element - Message element to attach toolbar to
     */
    _initMessageToolbar(element) {
        const options = this.options;
        const messageToolbarActions = options.messageToolbarActions;

        if (!messageToolbarActions || !messageToolbarActions.length || !element.length) {
            element.remove();
            return;
        }

        const messageToolbar = new MessageToolbar(element, {
            items: messageToolbarActions,
            dir: options.dir,
            messages: options.messages,
            resizable: false
        });

        messageToolbar.bind("execute", (e) => this.trigger("messageToolbarExecute", e));
    }

    /**
     * Initializes file menus for file menu buttons in the given element
     * @param {jQuery} element - Element to search for file menu buttons
     */
    _initFileMenus(element) {
        const options = this.options;
        const fileActions = options.fileActions;
        const fileMenuButtons = element.find(`[${REFERENCES.fileMenuButton}]`);

        if (!fileActions || !fileActions.length || !element.length) {
            fileMenuButtons.remove();
            return;
        }

        fileMenuButtons.each((i, el) => {
            const $el = $(el);
            // Check if already initialized to avoid double initialization
            if (!$el.data('kendoDropDownButton')) {
                const menu = new ChatFileMenu($el, { items: fileActions });
                menu.bind("execute", (e) => this.trigger("fileMenuExecute", e));
            }
        });
    }

    /**
     * Handle updating an existing message if it already exists in the view
     * @param {Message} message - Message to update
     * @param {Object} author - Author information
     * @param {boolean} isOwnMessage - Whether the message belongs to current user
     * @param {Message|null} replyMessage - Message being replied to
     * @param {Object} componentMessages - Localization messages
     * @param {boolean} expandable - Whether message should be expandable
     * @param {string} messageTimeFormat - Format for message timestamps
     * @returns {boolean} True if an existing message was updated, false otherwise
     */
    _handleExistingMessageUpdate({ message, author, isOwnMessage, replyMessage, componentMessages, expandable, messageTimeFormat, skipSanitization }) {
        const existingMessageElement = this.list.find(DOT + STYLES.message + `[data-uid="${htmlEncode(message.uid)}"]`);
        if (existingMessageElement.length) {
            const messageTemplate = this.options.messageTemplate;
            const updatedMessageElement = $(messageTemplate({
                ...message,
                isOwnMessage: isOwnMessage,
                author: author
            }, replyMessage, true, componentMessages, expandable, messageTimeFormat, skipSanitization));
            existingMessageElement.replaceWith(updatedMessageElement);
            this._initMessageToolbar(updatedMessageElement.find(DOT + STYLES.messageToolbar));
            this._initFileMenus(updatedMessageElement);
            return true;
        }
        return false;
    }

    /**
     * Find the appropriate target group for the new message
     * @returns {jQuery} The target message group element
     */
    _findTargetMessageGroup() {
        // 1. Get the last message group
        let lastGroupElement = this.list.children(DOT + STYLES.messageGroup).last();
        let targetGroupElement = lastGroupElement;

        // 2. Check if it has only one message
        const messagesInLastGroup = lastGroupElement.find(DOT + STYLES.message);
        if (messagesInLastGroup.length === 1) {
            // 3. Check if that only message is a typing indicator
            const onlyMessage = messagesInLastGroup.first();
            const isTypingIndicator = onlyMessage.find(DOT + STYLES.typingIndicator).length > 0;

            if (isTypingIndicator) {
                // 4. If it is, get the previous group
                targetGroupElement = lastGroupElement.prev(DOT + STYLES.messageGroup);
            }
        }

        return targetGroupElement;
    }

    /**
     * Check if the new message can be grouped with the last message in the target group
     * @param {jQuery} targetGroupElement - Target group element
     * @param {string} authorId - Author ID of the new message
     * @returns {boolean} True if messages can be grouped, false otherwise
     */
    _canGroupWithLastMessage(targetGroupElement, authorId) {
        // 5. Get the last message from the (possibly previous) group
        const lastMessageInTargetGroup = targetGroupElement.find(DOT + STYLES.message).filter(function() {
            // Exclude typing indicators
            return $(this).find(DOT + STYLES.typingIndicator).length === 0;
        }).last();

        // 6. Get the message dataitem
        const lastMessageData = this.dataItem(lastMessageInTargetGroup);

        // 7. Compare the dataitem author id to the author.id coming from the function param.
        return lastMessageData && lastMessageData.authorId === authorId;
    }

    /**
     * Add a message to an existing message group
     * @param {Object} params - Parameters object
     * @param {Message} params.message - Message to add
     * @param {Object} params.author - Author information
     * @param {boolean} params.isOwnMessage - Whether message belongs to current user
     * @param {Message|null} params.replyMessage - Message being replied to
     * @param {Object} params.componentMessages - Localization messages
     * @param {boolean} params.expandable - Whether message should be expandable
     * @param {jQuery} params.targetGroupElement - Target group element
     * @param {string} params.messageTimeFormat - Format for message timestamps
     */
    _addMessageToExistingGroup({ message, author, isOwnMessage, replyMessage, componentMessages, expandable, targetGroupElement, messageTimeFormat, skipSanitization }) {
        const messageTemplate = this.options.messageTemplate;
        const messageGroupContent = targetGroupElement.find(DOT + STYLES.messageGroupContent);
        const messageElement = $(messageTemplate({
            ...message,
            isOwnMessage: isOwnMessage,
            author: author
        }, replyMessage, true, componentMessages, expandable, messageTimeFormat, skipSanitization));
        messageGroupContent.append(messageElement);
        this._initMessageToolbar(messageElement.find(DOT + STYLES.messageToolbar));
        this._initFileMenus(messageElement);
        this._moveTypingIndicatorsToEnd();
    }

    /**
     * Create a new message group for the message
     * @param {Object} params - Parameters object
     * @param {Message} params.message - Message to add
     * @param {Object} params.author - Author information
     * @param {boolean} params.isOwnMessage - Whether message belongs to current user
     * @param {Message|null} params.replyMessage - Message being replied to
     * @param {Object} params.componentMessages - Localization messages
     * @param {boolean} params.expandable - Whether message should be expandable
     * @param {boolean} params.fullWidth - Whether to use full width layout
     * @param {string} params.messageTimeFormat - Format for message timestamps
     * @param {boolean} params.showTimestamp - Whether to show a timestamp before this message group
     * @returns {jQuery} The created group element
     */
    _createNewMessageGroup({ message, author, isOwnMessage, replyMessage, componentMessages, expandable, fullWidth, messageTimeFormat, showTimestamp = false, skipSanitization }) {
        const messageGroupTemplate = this.options.messageGroupTemplate;
        const timestampTemplate = this.options.timestampTemplate;
        const messageTemplate = this.options.messageTemplate;
        const groupElement = $(messageGroupTemplate({
            message: message,
            author: author,
            isOwnMessage: isOwnMessage,
            replyMessage: replyMessage,
            downloadAll: true,
            messages: componentMessages,
            expandable: expandable,
            fullWidth: fullWidth,
            messageTimeFormat: messageTimeFormat,
            timestampTemplate: timestampTemplate,
            showTimestamp: showTimestamp,
            messageTemplate: messageTemplate,
            skipSanitization: skipSanitization
        }));
        this.list.append(groupElement);
        this._initMessageToolbar(groupElement.find(DOT + STYLES.messageToolbar));
        this._initFileMenus(groupElement);
        this._moveTypingIndicatorsToEnd();

        return groupElement;
    }

    /**
     * Moves typing indicator messages to the end of the message list
     */
    _moveTypingIndicatorsToEnd() {
        const that = this;
        const messageGroupTemplate = this.options.messageGroupTemplate;
        const fullWidth = this.options.messageWidthMode === MESSAGE_WIDTH_MODE.FULL;
        // Find all typing indicator messages
        const typingMessages = that.list.find(DOT + STYLES.message).filter(function() {
            return $(this).find(DOT + STYLES.typingIndicator).length > 0;
        });

        typingMessages.each(function() {
            const typingMessage = $(this);
            const messageGroup = typingMessage.closest(DOT + STYLES.messageGroup);
            const messagesInGroup = messageGroup.find(DOT + STYLES.message);

            if (messagesInGroup.length === 1) {
                // Only typing message in group, move entire group
                messageGroup.detach().appendTo(that.list);
            } else {
                // Multiple messages in group, remove typing message from group
                typingMessage.remove();

                // Create new group with just the typing message
                const message = that.dataItem(typingMessage);

                const author = {
                    id: message.authorId,
                    name: message.authorName,
                    imageUrl: message.authorImageUrl,
                    imageAltText: message.authorImageAltText
                };

                const typingGroupElement = $(messageGroupTemplate({
                    message: message,
                    author: author,
                    isOwnMessage: author.id === that.options.authorId,
                    fullWidth: fullWidth,
                    messageTimeFormat: that.options.messageTimeFormat,
                    showTimestamp: false, // Typing indicators should not show timestamps
                    timestampTemplate: that.options.timestampTemplate,
                    messageTemplate: that.options.messageTemplate
                }));

                that.list.append(typingGroupElement);
            }
        });
    }

    /**
     * Gets the data item (Message) associated with a jQuery message element
     * @param {jQuery} message - JQuery Element
     * @returns {Message|null} - Message model or null if not found
     */
    dataItem(message) {
        const uid = message && message.data("uid");
        if (uid) {
            return this._dataManager.getMessageByUid(uid);
        }
        return null;
    }

    /**
     * Gets a file data item from a message by its UID
     * @param {Message} message - Message containing the file
     * @param {jQuery} file - JQuery Element representing the file
     * @returns {Object|null} - File data item or null if not found
     */
    fileDataItem(message, file) {
        const uid = file && file.data("uid");
        if (uid) {
            return this._dataManager.getFileByUid(message, uid);
        }
        return null;
    }

    /**
     * Gets a reply message for a given message
     * @param {Message} message - Message to get the reply for
     * @returns {Message|null} - Reply message model or null if not found
     */
    getReplyMessage(message) {
        if (!message?.replyToId) {
            return null;
        }

        const replyMessage = this._dataManager.getMessageById(message.replyToId);
        replyMessage.isOwnMessage = replyMessage?.authorId === this.options.authorId;

        return replyMessage;
    }

    /**
     * Renders suggested actions for the last message
     */
    renderSuggestedActions() {
        const options = this.options;
        const lastSuggestedActions = this._dataManager.getLastMessage()?.suggestedActions || [];
        const suggestedActionsElement = options.suggestedActionsTemplate(lastSuggestedActions);
        const suggestedActionsScrollableWrapper = options.suggestedActionsScrollable ?
            SCROLLABLE_SUGGESTIONS_TEMPLATE(suggestedActionsElement, options.dir === "rtl") :
            suggestedActionsElement;

        this._removeSuggestedActions();

        this.list.append(lastSuggestedActions.length ? suggestedActionsScrollableWrapper : '');

        this.list.find(`[${REFERENCES.leftScrollButton}]`).addClass(STYLES.disabled);
    }

    /**
     * Removes a message from the view by UID
     * @param {string} uid - Message UID to remove
     * @returns {boolean} True if message was removed, false if not found
     */
    removeMessage(uid) {
        const messageElement = this.list.find(DOT + STYLES.message + `[data-uid="${htmlEncode(uid)}"]`);

        if (!messageElement.length) {
            return false; // Message not found
        }

        const messageGroup = messageElement.closest(DOT + STYLES.messageGroup);
        const messagesInGroup = messageGroup.find(DOT + STYLES.message);

        if (messagesInGroup.length === 1) {
            // Remove the entire group if it's the only message
            messageGroup.remove();
        } else {
            // Remove just the message
            messageElement.remove();
        }

        return true; // Message successfully removed
    }

    /**
     * Clears all messages from the chat view
     */
    clearMessages() {
        // Remove all message groups
        this.list.find(DOT + STYLES.messageGroup).remove();

        // Remove timestamps
        this.list.find(DOT + STYLES.timestamp).remove();

        // Remove suggested actions if any
        this._removeSuggestedActions();
    }

    /**
     * Scrolls the chat view to the bottom
     */
    scrollToBottom() {
        this.element.scrollTop(this.element.prop("scrollHeight"));
    }

    /**
     * Scrolls to a specific message by its UID
     * @param {string} uid - The UID of the message to scroll to
     * @returns {boolean} True if message was found and scrolled to, false otherwise
     */
    scrollToMessage(uid) {
        if (!uid) {
            return false;
        }

        const messageElement = this.list.find(DOT + STYLES.message + `[data-uid="${htmlEncode(uid)}"]`);

        if (!messageElement.length) {
            return false;
        }

        // Use the scrollToElement utility for smooth scrolling
        return scrollToElement(this.element, messageElement, { position: "top" });
    }

    /**
     * Handles left scroll button click for suggestions
     * @param {Event} e - Click event
     */
    _leftScrollButtonClick(e) {
        e.preventDefault();
        const button = $(e.currentTarget);
        const scrollableElement = this.element.find(`${DOT}${STYLES.suggestionGroup}`);
        const isRtl = this.options.dir === RTL;

        const position = scrollByDelta(scrollableElement, isRtl ? SCROLLING_DELTA : -200);

        this.element.find(`[${REFERENCES.rightScrollButton}]`).removeClass(STYLES.disabled);

        if (isRtl ? position.atEnd : position.atStart) {
            button.addClass(STYLES.disabled);
        }
    }

    /**
     * Handles right scroll button click for suggestions
     * @param {Event} e - Click event
     */
    _rightScrollButtonClick(e) {
        e.preventDefault();
        const button = $(e.currentTarget);
        const scrollableElement = this.element.find(`${DOT}${STYLES.suggestionGroup}`);
        const isRtl = this.options.dir === RTL;

        const position = scrollByDelta(scrollableElement, isRtl ? -200 : SCROLLING_DELTA);

        this.element.find(`[${REFERENCES.leftScrollButton}]`).removeClass(STYLES.disabled);

        if (isRtl ? position.atStart : position.atEnd) {
            button.addClass(STYLES.disabled);
        }
    }

    /**
     * Removes suggested actions from the view
     */
    _removeSuggestedActions() {
        this.list.find(DOT + STYLES.suggestionGroup).remove();
        this.list.find(DOT + STYLES.suggestionScrollWrap).remove();
    }

    /**
     * Handles click events on the message list
     * @param {Event} e - Click event
     */
    _listClick(e) {
        const targetElement = $(e.target);

        if (targetElement.hasClass(STYLES.message) || targetElement.parents(DOT + STYLES.message).length) {
            return;
        }

        this._clearSelection(targetElement);
    }
    /**
     * Handles click events on suggestions
     * @param {Event} e - Click event
     */
    _suggestionClick(e) {
        const suggestionElement = $(e.currentTarget);

        if (suggestionElement.length) {
            this.trigger("suggestedActionClick", { text: suggestionElement.text() });
        }
    }

    /**
     * Handles click events on messages
     * @param {Event} e - Click event
     */
    _messageClick(e) {
        const target = $(e.target);
        const expandIcon = target.closest(`[${REFERENCES.bubbleExpandableIndicator}]`);

        if (this._allowMessageClick(target)) {
            return;
        }

        this._clearSelection(target);

        if (expandIcon.length) {
            const bubble = expandIcon.closest(DOT + STYLES.bubble);
            const isExpanded = bubble.hasClass(STYLES.expanded);

            bubble.toggleClass(STYLES.expanded, !isExpanded);
            expandIcon.html(kendo.ui.icon({ icon: isExpanded ? ICONS.chevronDown : ICONS.chevronUp }));

            // Trigger event for accessibility updates
            this.trigger("expandableToggle", { indicator: expandIcon, isExpanded: !isExpanded });
            return;
        }

        const messageElement = $(e.currentTarget);
        const bubble = messageElement.find(DOT + STYLES.bubble);
        bubble.addClass(STYLES.selected);
    }

    /**
     * Determines if a message click should be allowed based on the target element
     * @param {jQuery} target - Target element that was clicked
     * @returns {boolean} True if click should be allowed, false otherwise
     */
    _allowMessageClick(target) {
        const disallowedSelectors = [
            `[${REFERENCES.fileMenuButton}]`,
            DOT + STYLES.messageToolbar,
            DOT + STYLES.typingIndicator,
            DOT + STYLES.downloadButton
        ].join(", ");

        return target.closest(disallowedSelectors).length > 0 ||
                target.children(disallowedSelectors).length > 0 ||
                target.is(disallowedSelectors);
    }

    /**
     * Clears message selection from the view
     */
    _clearSelection(target) {
        const selectedMessages = this.element.find(DOT + STYLES.selected);

        if (target.closest(`[${REFERENCES.bubbleExpandableIndicator}]`).length) {
            return;
        }

        selectedMessages.each((_index, element) => {
            const bubble = $(element);
            bubble.removeClass(STYLES.selected);
        });
    }

    /**
     * Handles click events on download all button
     * @param {Event} e - Click event
     */
    _downloadAllClick(e) {
        const downloadButton = $(e.currentTarget);
        const message = downloadButton.closest(DOT + STYLES.message);

        if (message.length) {
            this.trigger("downloadAllFiles", {
                messageElement: message
            });
        }
    }

    /**
     * Adds a new message to the data source
     * @param {DataManager} dataManager - Data for the new message
     * @returns {Promise<Message>} Promise resolving to the added message
     */
    _refreshDataManager(dataManager) {
        this._dataManager = dataManager;
    }
}

/**
 * @typedef {import("../../typedefs/typedefs.js").Chat.Message} Message
 * @typedef {import("../../typedefs/typedefs.js").Chat.DataManager} ChatDataManager
 * @typedef {import("../../typedefs/typedefs.js").Chat.File} ChatFile
 * @typedef {import("../../typedefs/typedefs.js").Chat.Options} ChatOptions
 */

/**
 * ChatDataManager handles all data operations for the Chat component.
 * Manages message storage, retrieval, updates, and data source configuration.
 *
 * @class ChatDataManager
 */
class ChatDataManager {
    /**
     * Default configuration options for the data manager
     * @static
     * @type {Object}
     */
    static options = {
        autoSync: true,
        schema: {
            model: {
                id: "id",
                fields: {
                    id: { type: "string" },
                    text: { type: "string" },
                    authorId: { type: "string" },
                    authorName: { type: "string" },
                    authorImageUrl: { type: "string" },
                    authorImageAltText: { type: "string" },
                    replyToId: { type: "string", defaultValue: null },
                    isDeleted: { type: "boolean", defaultValue: false },
                    isPinned: { type: "boolean", defaultValue: false },
                    isTyping: { type: "boolean", defaultValue: false },
                    timestamp: { type: "date" },
                    files: { parse: (value) => value || [] }
                }
            }
        }
    };

    /**
     * Constructs a new ChatDataManager instance
     * @param {ChatOptions} options - Configuration options for the chat data manager
     */
    constructor(options) {
        this.dataSource = this.createDataSource(options);
    }

    /**
     * Creates and configures a data source for the chat component
     * @param {Object} options - Chat options containing dataSource configuration
     * @returns {kendo.data.DataSource} Configured data source
     */
    createDataSource(options) {
        let dataSource;

        if (options.dataSource instanceof kendo.data.DataSource) {
            this.options = extend(true, {}, ChatDataManager.options, options.dataSource.options);
        } else if (options.dataSource instanceof Array) {
            this.options = extend(true, {}, ChatDataManager.options, { data: options.dataSource });
        } else {
            this.options = extend(true, {}, ChatDataManager.options, options.dataSource);
        }

        this.mapFields(this.options.schema.model.fields, options);

        dataSource = kendo.data.DataSource.create(this.options);

        return dataSource;
    }

    /**
     * Maps field configuration from chat options to data source field definitions.
     * This allows for flexible field mapping between the chat component and data source.
     * @param {Object} fields - The data source field definitions
     * @param {ChatOptions} options - Chat configuration options containing field mappings
     */
    mapFields(fields, options) {
        const fieldMap = {
            text: "textField",
            authorId: "authorIdField",
            authorName: "authorNameField",
            authorImageUrl: "authorImageUrlField",
            authorImageAltText: "authorImageAltTextField",
            id: "idField",
            timestamp: "timestampField",
            files: "filesField",
            replyToId: "replyToIdField",
            isDeleted: "isDeletedField",
            isPinned: "isPinnedField",
            isTyping: "isTypingField"
        };

        for (const key in fields) {
            if (fields.hasOwnProperty(key) && fieldMap[key]) {
                fields[key].from = options[fieldMap[key]];
            }
        }
    }

    /**
     * Sets the status of the message to deleted
     * @param {Message} message - Mark message as deleted
     * @returns {boolean} Success status
     */
    removeMessage(message) {
        if (!message) {
            return false;
        }

        message.set("isDeleted", true);
        return true;
    }

    /**
     * Updates a message in the data source
     * @param {Message} message - Message to update
     * @param {Message} newData - New data to apply
     * @returns {Message} - updated message object
     */
    updateMessage(message, newData) {
        if (!message) {
            return null;
        }

        if (!(message instanceof kendo.data.ObservableObject)) {
            message = this.getMessageById(message.id);
        }

        for (let key in newData) {
            if (newData.hasOwnProperty(key)) {
                message.set(key, newData[key]);
            }
        }
        return message;
    }

    /**
     * Gets a message by ID from the data source
     * @param {string|number} id - Message ID
     * @returns {Message|null} Message model or null if not found
     */
    getMessageById(id) {
        if (!id) {
            return null;
        }

        return this.dataSource.get(id);
    }

    /**
     * Gets a message by UID from the data source
     * @param {string} uid - Message UID
     * @returns {Message|null} Message model or null if not found
     */
    getMessageByUid(uid) {
        return this.dataSource.getByUid(uid);
    }

    /**
     * Gets a file by UID from a message's files array
     * @param {Message} message - Message containing files
     * @param {string} uid - File UID to search for
     * @returns {ChatFile|null} File object or null if not found
     */
    getFileByUid(message, uid) {
        if (!message || !uid) {
            return null;
        }

        const files = message.files;
        return files.find(file => file.uid === uid) || null;
    }

    /**
     * Adds a new message to the data source
     * @param {string|Message} message - Message text or message object
     * @param {any} currentUserId - Current user ID information
     * @returns {Message} - Updated message object
     */
    postMessage(message, currentUserId) {
        let messageData;

        if (typeof message === "string") {
            message = { text: message };
        }

        messageData = {
            timestamp: new Date(),
            files: [],
            ...message,
            authorId: message.authorId?.toString() || currentUserId
        };

        return this.dataSource.add(messageData);
    }

    /**
     * Updates the pinned status of a message
     * @param {Message} message - Message to update
     * @returns {Message|boolean} - Updated message object or false if message is invalid
     */
    pinMessage(message) {
        if (!message) {
            return false;
        }

        this.getPinnedMessage()?.set("isPinned", false);

        return message.set("isPinned", true);
    }

    /**
     * Sets the pinned status of the currently pinned message to false.
     */
    clearPinnedMessage() {
        this.getPinnedMessage()?.set("isPinned", false);
    }

    /**
     * Gets the currently pinned message
     * @returns {Message|null} The pinned message or null if no message is pinned
     */
    getPinnedMessage() {
        return this.dataSource.data().find(m => m.isPinned) || null;
    }

    /**
     * Gets the current data source view
     * @returns {Array} Array of data items
     */
    getView() {
        return this.dataSource.view();
    }

    /**
     * Gets the data source instance
     * @returns {kendo.data.DataSource} The data source
     */
    getDataSource() {
        return this.dataSource;
    }

    /**
     * Gets the last message in the data source view
     * @returns {Message|null} The last message or null if no messages exist
     */
    getLastMessage() {
        const view = this.getView();
        return view.length ? view[view.length - 1] : null;
    }
}

/**
 * @typedef {import("../../typedefs/typedefs.js").Chat.MessageMenuOptions} ChatMessageMenuOptions
 * @typedef {import("../../typedefs/typedefs.js").Chat.MenuAction} ChatMenuAction
 */

/**
 * ChatMessageMenu provides context menu functionality for chat messages.
 * Handles actions like reply, copy, pin, and delete for individual messages.
 *
 * @extends {Widget<ChatMessageMenuOptions>}
 */
class ChatMessageMenu extends Widget {
    /** @type {ChatMessageMenuOptions} */
    static options = {
        name: "ChatMessageMenu",
        filter: `${DOT}${STYLES.chatBubble}`,
        dataSource: [],
        keyboardAlignToAnchor: true
    };

    /**
     * Constructs a new ChatMessageMenu instance
     * @param {jQuery} element - jQuery element to attach the menu to
     * @param {ChatMessageMenuOptions} options - ChatMessageMenu configuration options
     */
    constructor(element, options) {
        super(element, extend(true, {}, ChatMessageMenu.options, options));

        this.setCommandAttributes();
        this.create();
        this.attachEvents();
    }

    /**
     * Creates the underlying Kendo UI ContextMenu
     */
    create() {
        this.menu = new kendo.ui.ContextMenu(this.element, this.options);
    }

    /**
     * Destroys the ChatMessageMenu and cleans up resources
     */
    destroy() {
        if (this.menu) {
            this.menu.destroy();
            this.menu = null;
            this.element.remove();
        }
    }

    /**
     * Attaches event handlers to the context menu
     */
    attachEvents() {
        this.menu.bind("select", this.onSelect.bind(this))
            .bind("open", this.onOpen.bind(this))
            .bind("close", this.onClose.bind(this));
    }

    /**
     * Sets command attributes on menu items for identification
     */
    setCommandAttributes() {
        this.options.dataSource.forEach((item) => {
            item.attr = item.attr || {};
            item.attr["data-command"] = item.name.toLowerCase();
        });
    }

    /**
     * Handles menu item selection
     * @param {Object} e - Selection event
     */
    onSelect(e) {
        const item = $(e.item);
        const message = $(e.target).closest(DOT + STYLES.message);
        const command = item.data("command");
        if (command) {
            this.executeCommand(command, item, message);
        }
    }

    /**
     * Handles menu open event
     * @param {Object} e - Open event
     */
    onOpen(e) {
        let setActive = true;
        const target = $(e.target);
        const originalTarget = $(e.event?.target).length ? $(e.event.target) : target;

        const isMessageRemoved = target.closest(DOT + STYLES.messageRemoved).length > 0;
        const hasTypingIndicator = target.find(DOT + STYLES.typingIndicator).length > 0;
        const isAttachmentMenuButton = originalTarget.closest(`[${REFERENCES.fileMenuButton}]`).length > 0;
        const message = target.closest(DOT + STYLES.message);

        if (isMessageRemoved || hasTypingIndicator || isAttachmentMenuButton || !message.length) {
            e.preventDefault();
            setActive = false;
        }

        target.toggleClass(STYLES.active, setActive);
        this.trigger("open", { message });
    }

    /**
     * Handles menu close event
     * @param {Object} e - Close event
     */
    onClose(e) {
        const target = $(e.target);
        const message = target.closest(DOT + STYLES.message);
        target.removeClass(STYLES.active);
        this.trigger("close", { message });
    }

    /**
     * Executes a command from the menu
     * @param {string} command - Command to execute
     * @param {jQuery} item - Menu item element
     * @param {jQuery} message - Message element
     */
    executeCommand(command, item, message) {
        this.trigger("execute", { type: command, item, message });
    }

    /**
     * Toggles the visibility of the delete menu item
     * @param {boolean} visible - Whether the delete item should be visible
     */
    toggleDeleteVisibility(visible) {
        const deleteItem = this.element.find("[data-command='delete']");
        if (deleteItem.length) {
            deleteItem.toggleClass(STYLES.hidden, !visible);
        }
    }
}

/**
 * @typedef {import("../typedefs/typedefs.js").Chat.Message} Message
 * @typedef {import("../typedefs/typedefs.js").Chat.Options} ChatOptions
 * @typedef {import("../typedefs/typedefs.js").Chat.File} ChatFile
 * @typedef {import("../typedefs/typedefs.js").Chat.MenuAction} ChatMenuAction
 */

const __meta__ = {
    id: "chat",
    name: "Chat",
    category: "web",
    description: "The Chat component.",
    depends: ["data", "draganddrop", "html.button", "textarea", "menu", "avatar", "toolbar", "speechtotextbutton"]
};

/**
 * The Kendo UI Chat component provides a conversational UI for sending and receiving messages.
 * It supports features like message grouping, file attachments, context menus, and real-time messaging.
 *
 * @extends {Widget<ChatOptions>}
 */
class Chat extends Widget {
    /** @type {ChatOptions} */
    static options = {
        name: "Chat",
        autoBind: true,
        allowMessageCollapse: false,
        authorId: null,
        suggestionsScrollable: false,
        suggestedActionsScrollable: false,
        speechToText: true,
        fileAttachment: true,
        messageToolbarActions: [],
        messageActions: [
            { name: COMMANDS.reply, text: "Reply", icon: ICONS.undo },
            { name: COMMANDS.copy, text: "Copy", icon: ICONS.copy },
            { name: COMMANDS.pin, text: "Pin", icon: ICONS.pin },
            { name: COMMANDS.delete, text: "Delete", icon: ICONS.trash }
        ],
        fileActions: [
            { name: COMMANDS.download, text: "Download", icon: ICONS.download }
        ],
        suggestions: [],
        headerItems: [],
        dir: LTR,
        messageTimeFormat: "ddd MMM dd yyyy",
        width: null,
        height: null,
        messages: {
            messageListLabel: "Message list",
            placeholder: "Type a message...",
            sendButton: "Send message",
            speechToTextButton: "Toggle speech to text",
            fileButton: "Attach file",
            downloadAll: "Download all",
            selfMessageDeleted: "You removed this message.",
            otherMessageDeleted: "This message was removed by its sender.",
            stopGeneration: "Stop generation",
            messageBoxLabel: "Type your message here",
            pinnedMessageCloseButton: "Unpin message",
            replyMessageCloseButton: "Remove reply",
            fileMenuButton: "File menu"
        },
        messageWidthMode: MESSAGE_WIDTH_MODE.STANDARD,
        messageTemplate: TEXT_MESSAGE_TEMPLATE,
        messageGroupTemplate: MESSAGE_GROUP_TEMPLATE,
        messageReferenceTemplate: MESSAGE_REFERENCE_TEMPLATE,
        filesTemplate: FILES_TEMPLATE,
        suggestionsTemplate: SUGGESTIONS_TEMPLATE,
        suggestedActionsTemplate: SUGGESTIONS_TEMPLATE,
        timestampTemplate: null,
        textField: "text",
        authorIdField: "authorId",
        authorNameField: "authorName",
        authorImageUrlField: "authorImageUrl",
        authorImageAltTextField: "authorImageAltText",
        idField: "id",
        timestampField: "timestamp",
        filesField: "files",
        replyToIdField: "replyToId",
        isDeletedField: "isDeleted",
        isPinnedField: "isPinned",
        isTypingField: "isTyping",
        skipSanitization: false
    };

    /**
     * Merges user and default context menu actions into the options object for a given property.
     * User actions override defaults with the same name.
     * @param {Object} options - User options object
     * @param {Object} defaultOptions - Default options object
     * @param {string} property - The property name to merge
     */
    static mergeContextMenuActions(options, defaultOptions, property) {
        const userActions = options[property];

        if (Array.isArray(userActions)) {
            const defaultActions = defaultOptions[property] || [];
            const defaultMap = {};
            for (const action of defaultActions) {
                defaultMap[action.name] = { ...action };
            }
            options[property] = userActions.map(userAction => {
                if (userAction.name in defaultMap) {
                    return { ...defaultMap[userAction.name], ...userAction };
                }
                return { ...userAction };
            });
        } else {
            options[property] = defaultOptions[property] || [];
        }
    }

    /**
     * Constructs a new Chat widget instance
     * @param {jQuery} element - jQuery element to attach the chat to
     * @param {ChatOptions} options - Chat configuration options
     * @param {Object} [events] - Event handlers
     */
    constructor(element, options, events) {
        options = options || {};
        Chat.mergeContextMenuActions(options, Chat.options, "messageActions");
        Chat.mergeContextMenuActions(options, Chat.options, "fileActions");

        super(element, extend(true, {}, Chat.options, options));

        this.options.messageActions = options.messageActions;
        this.options.fileActions = options.fileActions;

        if (events) {
            this._events = events;
        }

        this._init(options);

        kendo.notify(this);
    }

    /**
     * Gets the list of events supported by the Chat widget
     * @returns {string[]} Array of event names
     */
    get events() {
        return [
            EVENTS.sendMessage,
            EVENTS.suggestionClick,
            EVENTS.unpin,
            EVENTS.input,
            EVENTS.toolbarAction,
            EVENTS.fileMenuAction,
            EVENTS.contextMenuAction,
            EVENTS.download
        ];
    }

    _init(options) {
        this.currentMessageReplyId = null;

        this._hasHeader = !!options.headerItems?.length;

        this._user();
        this._wrapper();
        this._dataSource();
        this._view();

        if (this.options.autoBind) {
            this.dataSource.fetch();
        }

        if (options?.toolbar) {
            logToConsole("The 'toolbar' option has been deprecated.", "warn");
        }

        this._messageBox();
        this._createMenus();
        this._attachEvents();

        // Initialize accessibility features
        setupChatAriaAttributes(this.wrapper, this.options);
        setupBubbleTabNavigation(this.wrapper);

        this.scrollToBottom();
    }

    /**
     * Sets new options for the Chat widget and reinitializes components as needed
     * @param {ChatOptions} options - New configuration options
     */
    setOptions(options) {
        super.setOptions(options);

        this.destroy();

        this._init(options);
    }

    /**
     * Destroys the Chat widget and cleans up all resources
     */
    destroy() {
        if (this.dataSource) {
            this._unbindDataSource();
            // Clear data source reference
            this.dataSource = null;
        }

        if (this.view) {
            this.view.unbind();
            this.view.destroy();
            this.view = null;
        }

        if (this.messageBox) {
            this.messageBox.unbind();
            this.messageBox.destroy();
            this.messageBox = null;
        }

        if (this.messageContextMenu) {
            this.messageContextMenu.destroy();
        }

        // Clean up wrapper and element
        if (this.wrapper) {
            this.wrapper.off();
            this.wrapper.empty();
            this.wrapper = null;
        }

        super.destroy();
    }

    /**
     * Attaches event handlers to chat components
     */
    _attachEvents() {
        const that = this;

        this.view
            .bind("suggestedActionClick", function(args) {
                const message = { text: args.text };
                that.trigger(EVENTS.sendMessage, { message });
                that.postMessage(message);
            })
            .bind("messageToolbarExecute", function(args) {
                const message = that.dataItem(args.message);
                that.trigger(EVENTS.toolbarAction, { type: args.type, message: message });
            })
            .bind("fileMenuExecute", function(args) {
                /* v8 ignore next */
                that.commandExecute(args);
            })
            .bind("downloadAllFiles", function(args) {
                const message = that.dataItem(args.messageElement);
                that.trigger(EVENTS.download, { files: message.files, message: message });
            })
            .bind("expandableToggle", function(args) {
                /* v8 ignore next */
                updateExpandableIndicatorAria(args.indicator, args.isExpanded);
            });

        this.messageBox
            .bind("input", function(args) {
                that.trigger(EVENTS.input, { value: args.value });
            })
            .bind("sendMessage", function(args) {
                const generating = args.generating;

                if (generating) {
                    that.trigger(EVENTS.sendMessage, { generating });
                } else {
                    const message = { text: args.text, files: args.files };
                    that.trigger(EVENTS.sendMessage, { message });
                    that.postMessage(message);

                    that.clearReplyState();
                }
            })
            .bind("suggestionClick", function(args) {
                that.trigger(EVENTS.suggestionClick, { text: args.text });
            })
            .bind("fileButtonClick", function() {
                that.messageBox.wrapper.find(`[${REFERENCES.fileUploadInput}]`).trigger("click");
            })
            .bind("replyMessageCloseButtonClick", function() {
                that.clearReplyState();
            });

        this.messageContextMenu
            .bind("execute", this.commandExecute.bind(this))
            .bind("open", this.messageContextMenuOpen.bind(this));

        this.wrapper.on(CLICK + NS, `[${REFERENCES.pinnedMessageCloseButton}]`, () => {
            this.trigger(EVENTS.unpin, { message: this._dataManager.getPinnedMessage() });
            this.clearPinnedMessage();
        });

        this.wrapper.on(CLICK + NS, `[${REFERENCES.messageReferencePinWrapper}]`, (e) => {
            if ($(e.target).closest(`[${REFERENCES.pinnedMessageCloseButton}]`).length) {
                return;
            }

            if ($(e.target).is("a")) {
                return;
            } else {
                e.preventDefault();
                e.stopPropagation();
            }

            const pinnedMessage = this._dataManager.getPinnedMessage();

            if (pinnedMessage && pinnedMessage.uid) {
                this.scrollToMessage(pinnedMessage.uid);
            }
        });

        this.wrapper.on(CLICK + NS, `[${REFERENCES.messageReferenceReplyWrapper}]`, (e) => {
            if ($(e.target).is("a")) {
                return;
            } else {
                e.preventDefault();
                e.stopPropagation();
            }

            const messageElement = $(e.currentTarget).closest(DOT + STYLES.message);
            const currentMessage = this.dataItem(messageElement);

            if (currentMessage && currentMessage.replyToId) {
                // Find the original message that is being replied to
                const originalMessage = this._dataManager.getMessageById(currentMessage.replyToId);

                if (originalMessage && originalMessage.uid) {
                    this.scrollToMessage(originalMessage.uid);
                }
            }
        });

        this.wrapper.on(KEYDOWN + NS, (e) => {
            /* v8 ignore next */
            handleChatKeyDown(e, this.wrapper, this.messageBox);
        });

        this.wrapper.on(`focus${NS}`, `.${STYLES.bubble}`, (e) => {
            /* v8 ignore next 14 */
            const bubbleElement = $(e.target);

            if (bubbleElement.find(`.${STYLES.typingIndicator}`).length > 0) {
                return;
            }

            if (bubbleElement.attr("data-keyboard-focus") === "true") {
                const messageElement = bubbleElement.closest(`.${STYLES.message}`);
                const message = this.dataItem(messageElement);

                if (message && message.uid) {
                    this.scrollToMessage(message.uid);
                }
            }
        });
    }

    /**
     * Initializes the data source for the chat
     */
    _dataSource() {
        const that = this;
        const options = that.options;

        that._refreshHandler = that.refresh.bind(that);

        that._dataManager = new ChatDataManager(options);
        that.dataSource = that._dataManager.getDataSource();

        that.dataSource.bind(CHANGE, that._refreshHandler);
    }

    /**
     * Unbinds event handlers from the data source
     */
    _unbindDataSource() {
        const that = this;

        that.dataSource.unbind(CHANGE, that._refreshHandler);
        this._dataManager = null;
    }

    /**
     * Sets a new data source for the Chat widget
     * @param {kendo.data.DataSource|Object|Array} dataSource - New data source configuration
     */
    setDataSource(dataSource) {
        const that = this;

        // Unbind current data source
        if (that.dataSource) {
            that._unbindDataSource();
        }

        // Clear current messages from view
        that.view.clearMessages();

        // Update options with new data source
        that.options.dataSource = dataSource;

        // Reinitialize data source
        that._dataSource();

        // Fetch new data if autoBind is enabled
        if (that.options.autoBind) {
            that.dataSource.fetch();
        }

        if (this.view) {
            this.view._refreshDataManager(that._dataManager);
        }
    }

    /**
     * Initializes the current user ID
     */
    _user() {
        const options = this.options;

        if (options.authorId) {
            this.options.authorId = options.authorId.toString();
            return;
        }

        this.options.authorId = guid();
    }

    /**
     * Gets the current user's ID
     * @returns {string} The current user's ID
     */
    getUserId() {
        return this.options.authorId;
    }

    /**
     * Creates the wrapper element for the chat widget
     */
    _wrapper() {
        const options = this.options;
        const height = options.height;
        const width = options.width;
        const headerItems = options.headerItems;
        const uiElements = "<div class='" + STYLES.viewWrapper + "'></div>";

        this.wrapper = this.element
            .addClass(STYLES.wrapper)
            .attr("dir", options.dir)
            .append(uiElements);

        if (this._hasHeader) {
            this.wrapper.prepend(HEADER_TEMPLATE(headerItems));
        }

        if (height) {
            this.wrapper.css({
                height: height,
                minHeight: height
            });
        }

        if (width) {
            this.wrapper.css({
                width: width,
                minWidth: width
            });
        }
    }

    /**
     * Creates the chat view component
     */
    _view() {
        const options = extend(true, {}, this.options, {
            dataManager: this._dataManager
        });

        const element = this.wrapper.find(DOT + STYLES.viewWrapper + "");

        this.view = new ChatView(element, options);
    }

    /**
     * Creates the message box component
     */
    _messageBox() {
        const options = extend(true, {}, this.options, {
            chatElement: this.wrapper
        });

        this.messageBox = new MessageBox($("<textarea></textarea>"), options);
    }

    /**
     * Creates the context menu components
     */
    _createMenus() {
        const options = this.options;
        const messageActions = options.messageActions;

        this.messageContextMenu = new ChatMessageMenu($("<ul></ul>"), { dataSource: messageActions });
    }

    /**
     * Executes a command from context menus or toolbar actions
     * @param {Object} e - Event arguments containing command details
     * @param {string} e.type - Command type (reply, copy, pin, delete, etc.)
     * @param {jQuery} e.message - Message element
     * @param {jQuery} [e.file] - File element for file-specific commands
     */
    commandExecute(e) {
        const message = this.dataItem(e.message);
        const file = this.fileDataItem(message, e.file);
        const type = e.type;

        if (!file) {
            switch (type) {
                case COMMANDS.reply:
                    this.messageReply(message);
                    break;
                case COMMANDS.copy:
                    this.messageCopy(message);
                    break;
                case COMMANDS.pin:
                    this.messagePin(message);
                    break;
                case COMMANDS.delete:
                    this.messageDelete(message);
                    break;
            }
            this.trigger(EVENTS.contextMenuAction, { type, message });
        } else {
            switch (type) { // NOSONAR
                case COMMANDS.download:
                    this.trigger(EVENTS.download, { files: [file], message });
                    break;
            }
            this.trigger(EVENTS.fileMenuAction, { type, file, message });
        }
    }

    /**
     * Sets up reply state for a message
     * @param {Message} message - Message to reply to
     */
    messageReply(message) {
        const isOwnMessage = message.authorId === this.getUserId();
        this.currentMessageReplyId = message.id;
        this.messageBox.setReplyMessage(message, isOwnMessage);
        setReplyMessageAriaAttributes(this.wrapper, this.options);
    }

    /**
     * Copies message text to clipboard
     * @param {Message} message - Message to copy
     */
    messageCopy(message) {
        if (navigator && navigator.clipboard) {
            navigator.clipboard.writeText(message.text);
        }
    }

    /**
     * Pins a message to the top of the chat
     * @param {Message} message - Message to pin
     */
    messagePin(message) {
        this._dataManager.pinMessage(message);
    }

    /**
     * Marks a message as deleted
     * @param {Message} message - Message to delete
     */
    messageDelete(message) {
        this.removeMessage(message);
    }

    messageContextMenuOpen(e) {
        const message = this.dataItem(e.message);

        if (!message) {
            return;
        }

        const isAuthor = message.authorId === this.getUserId();

        this.messageContextMenu.toggleDeleteVisibility(isAuthor);
    }

    /**
     * Gets the data item (Message) associated with a jQuery message element
     * @param {jQuery} message - Message element
     * @returns {Message} - Message object
     */
    dataItem(message) {
        return this.view.dataItem(message);
    }

    /**
     * Gets the file data item associated with a jQuery file element
     * @param {Message} message - Message containing the file
     * @param {jQuery} file - File element
     * @returns {ChatFile} - File object
     */
    fileDataItem(message, file) {
        return this.view.fileDataItem(message, file);
    }

    /**
     * Clears all messages from the view only (does not affect data source)
     */
    clearMessages() {
        this.view.clearMessages();
    }

    /**
     * Posts a new message to the chat and renders it.
     * @param {string|Message} message - Message text or message object
     */
    postMessage(message) {
        if (this.currentMessageReplyId) {
            message.replyToId = this.currentMessageReplyId;
        }

        const messageData = this._dataManager.postMessage(message, this.getUserId());

        return messageData;
    }

    /**
     * Removes a message from the chat (marks as deleted)
     * @param {Message} message - Message to remove
     * @returns {boolean} - Success status
     */
    removeMessage(message) {
        const success = this._dataManager.removeMessage(message);

        return success;
    }

    /**
     * Updates an existing message with new data
     * @param {Message} message - Message to update
     * @param {Object} newData - New data to apply to the message
     * @returns {Message} - Updated message object
     */
    updateMessage(message, newData) {
        const messageData = this._dataManager.updateMessage(message, newData);

        return messageData;
    }

    /**
     * Gets a message by its UID
     * @param {string} uid - Message UID
     * @returns {Message|null} - Message object or null if not found
     */
    getMessageByUid(uid) {
        return this._dataManager.getMessageByUid(uid);
    }


    /**
     * Renders a message in the chat view
     * @param {Message} message - Message to render
     */
    renderMessage(message) {
        this.view.renderMessage(message);

        // Update bubble tabindex navigation after rendering new message
        setupBubbleTabNavigation(this.wrapper);
    }

    /**
     * Render a pinned message in the chat view
     * @param {Message} message - Message to render as pinned
     */
    renderPinnedMessage(message) {
        const isOwnMessage = message.authorId === this.getUserId();
        const pinnedMessageElement = $(this.options.messageReferenceTemplate({
            text: message.text,
            files: message.files,
            isDeleted: message.isDeleted,
            isOwnMessage: isOwnMessage,
            messages: this.options.messages,
            isPinMessage: true,
            renderCloseButton: true,
            renderFileMenuButton: false
        }));

        // Remove any existing pinned messages
        this.wrapper.find(`[${REFERENCES.messageReferencePinWrapper}]`).remove();

        if (this._hasHeader) {
            pinnedMessageElement.insertAfter(this.wrapper.find(DOT + STYLES.header));
        } else {
            this.wrapper.prepend(pinnedMessageElement);
        }

        this.view._initFileMenus(pinnedMessageElement);
    }

    /**
     * Clears the currently pinned message
     */
    clearPinnedMessage() {
        this._dataManager.clearPinnedMessage();
        this.wrapper.find(DOT + STYLES.messagePinned).remove();
    }

    /**
     * Clears the current reply state
     */
    clearReplyState() {
        this.messageBox.removeReplyMessage();
        this.currentMessageReplyId = null;
    }

    /**
     * Scrolls the chat view to the bottom
     */
    scrollToBottom() {
        this.view.scrollToBottom();
    }

    /**
     * Scrolls to a specific message by its UID
     * @param {string} uid - The UID of the message to scroll to
     * @returns {boolean} True if message was found and scrolled to, false otherwise
     */
    scrollToMessage(uid) {
        return this.view.scrollToMessage(uid);
    }

    /**
     * Toggles the send button generating state (shows loading indicator)
     * @param {boolean} generating - Whether to show generating state
     */
    toggleSendButtonGenerating(generating) {
        this.messageBox.toggleSendButtonGenerating(generating);
    }

    /**
     * Refreshes the chat view when data source changes
     * @param {Object} e - Data source change event arguments
     * @param {string} [e.action] - Type of change action
     * @param {Array} [e.changedItems] - Items that were changed
     */
    refresh(e) {
        const that = this;
        const data = that.dataSource.view();
        const pinnedMessage = data.find((item) => item.isPinned);
        const changedItems = e.changedItems || [];

        if (!e || !e.action) {
            data.forEach((item) => {
                that.renderMessage(item);
            });
            that.scrollToBottom();
        }

        if (pinnedMessage) {
            that.renderPinnedMessage(pinnedMessage);
        }

        if (e.action === "sync") {
            // If a message is modified(deleted/edited), re-render that particular message.
            // If this is a brand new message, render the last message in the data source.
            const message = changedItems.length ? changedItems[0] : data[data.length - 1];
            that.renderMessage(message);

            if (!changedItems.length) {
                that.scrollToBottom();
            }
        }

        that.view.renderSuggestedActions();

        // Refresh accessibility attributes when content changes
        setupChatAriaAttributes(that.wrapper, that.options);

        // Refresh bubble tabindex navigation
        setupBubbleTabNavigation(that.wrapper);
    }
}

// Keep the chat namespace for a couple releases for backwards compatibility.
kendo.chat = {};
extend(kendo.chat, {
    ChatView: {},
    Component: {},
    Components: {},
    Templates: {},
    getTemplate: () => logToConsole("The getTemplate method is deprecated. Use one of the built-in templates or append elements manually.", "warn"),
    getComponent: () => logToConsole("The getComponent method is deprecated. Use one of the built-in templates or append elements manually.", "warn"),
    registerTemplate: () => logToConsole("The registerTemplate method is deprecated. Use one of the built-in templates or append elements manually.", "warn"),
    registerComponent: () => logToConsole("The registerComponent method is deprecated. Use one of the built-in templates or append elements manually.", "warn")
});

plugin(Chat);

var kendo$1 = kendo;

export { Chat, __meta__, kendo$1 as default };
