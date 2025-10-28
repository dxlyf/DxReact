import { defined, sankeyTheme, Sankey, createSankeyData } from '@progress/kendo-charts';
import './kendo.dataviz.core.js';
import './kendo.dataviz.themes.js';
import '@progress/kendo-charts/dist/es/core-export.js';
import './html-DIrOxn6k.js';
import './kendo.popup.js';
import './kendo.core.js';
import './kendo.licensing.js';
import '@progress/kendo-licensing';
import './kendo.icons.js';
import './kendo.html.icon.js';
import './kendo.html.base.js';
import '@progress/kendo-svg-icons';
import '@progress/kendo-drawing';
import './kendo.color.js';

(function($) {
    var kendo = window.kendo;
    var Widget = kendo.ui.Widget;

    var encode = kendo.htmlEncode;
    var styleAttr = '__style';
    var tooltipContentWrapStyle = `${styleAttr}="display: flex; align-items: center;"`;
    var space = 3;
    var TootipText = (text) => `<span ${styleAttr}="margin: 0 ${space}px">${text}</span>`;
    var Square = (color) => `<div ${styleAttr}="width: 15px; height: 15px; background-color: ${color}; display: inline-flex; margin-left: ${space}px"></div>`;
    var TooltipTemplates = {
        node: function({ dataItem, value }) {
            const { color, label } = dataItem;
            return (
                `<div ${tooltipContentWrapStyle}>
                    ${Square(color)}
                    ${TootipText(encode(label.text))}
                    ${TootipText(value)}
                </div>`
            );
        },
        link: function({ dataItem, value, rtl }) {
            const { source, target } = dataItem;
            return (
                `<div ${tooltipContentWrapStyle}>
                    ${Square(source.color)}
                    ${TootipText(encode(source.label.text))}
                    ${TootipText(kendo.ui.icon({ icon: rtl ? "arrow-left" : "arrow-right" }))}
                    ${Square(target.color)}
                    ${TootipText(encode(target.label.text))}
                    ${TootipText(value)}
                </div>`
            );
        }
    };

    var SankeyTooltip = Widget.extend({
        init: function(element, options) {
            this.options = options;

            Widget.fn.init.call(this, element);

            if (options.rtl) {
                this.element.addClass('k-rtl');
            }

            this.element.addClass('k-tooltip k-chart-tooltip k-chart-shared-tooltip')
                .append('<div class="k-tooltip-content"></div>');
        },

        size: function() {
            return {
                width: this.element.outerWidth(),
                height: this.element.outerHeight()
            };
        },

        setContent: function(content) {
            this.element.find('.k-tooltip-content').html(content);
            this.element.find(`[${styleAttr}]`).each((i, el) => {
                el.getAttribute(styleAttr)
                    .split(';')
                    .filter(s => s !== '')
                    .forEach(s => {
                        const parts = s.split(':');
                        el.style[parts[0].trim()] = parts[1].trim();
                    });
                el.removeAttribute(styleAttr);
            });
        },

        setPosition: function(popupAlign, popupOffset, offsetOption) {
            const size = this.size();
            const offset = { ...popupOffset };

            offset.left += (popupAlign.horizontal === 'left') ? offsetOption : (-1 * offsetOption);
            if (popupAlign.horizontal === 'right') {
                offset.left -= size.width;
            }

            if (popupAlign.vertical === 'bottom') {
                offset.top -= size.height + offsetOption;
            } else {
                offset.top += offsetOption;
            }

            this.element.css(offset);
        },

        show: function() {
            this.element.show();
        },

        hide: function() {
            this.element.hide();
        },

        destroy: function() {
            this.element.remove();
        }
    });

    kendo.deepExtend(kendo.dataviz, {
        SankeyTooltip: {
            Tooltip: SankeyTooltip,
            ContentTemplates: TooltipTemplates
        }
    });
})(window.kendo.jQuery);

const __meta__ = {
    id: "dataviz.sankey",
    name: "Sankey",
    category: "dataviz",
    description: "The Sankey widget uses modern browser technologies to render high-quality data visualizations in the browser.",
    depends: [ "data", "userevents", "drawing", "dataviz.core", "dataviz.themes" ],
    features: [{
        id: "dataviz.sankey-pdf-export",
        name: "PDF export",
        description: "Export Sankey as PDF",
        depends: [ "pdf" ]
    }]
};

(function($) {
    window.kendo.dataviz = window.kendo.dataviz || {};

    const kendo = window.kendo;
    const template = kendo.template;
    const Widget = kendo.ui.Widget;
    const dataviz = kendo.dataviz;
    const encode = kendo.htmlEncode;
    const isRtl = kendo.support.isRtl;
    const NODE_CLICK = "nodeClick";
    const LINK_CLICK = "linkClick";
    const NODE_ENTER = "nodeEnter";
    const NODE_LEAVE = "nodeLeave";
    const LINK_ENTER = "linkEnter";
    const LINK_LEAVE = "linkLeave";
    const TOOLTIP_SHOW = "tooltipShow";
    const TOOLTIP_HIDE = "tooltipHide";
    const NODE = 'node';

    const { Tooltip, ContentTemplates } = dataviz.SankeyTooltip;

    const Sankey$1 = Widget.extend({
        init: function(element, userOptions) {
            kendo.destroy(element);
            $(element).empty();

            this.options = kendo.deepExtend({}, this.options, userOptions, { rtl: isRtl(element) });

            this._parseAriaLabelTemplates(this.options);

            Widget.fn.init.call(this, element);

            this.wrapper = this.element;
            this._initSankey();

            this._attachEvents();

            kendo.notify(this, dataviz.ui);

            if (this._showWatermarkOverlay) {
                this._showWatermarkOverlay(this.wrapper[0]);
            }
        },

        setOptions: function(options) {
            var currentOptions = this.options;

            this.events.forEach(eventName => {
                if (currentOptions[eventName]) {
                    this.unbind(eventName, currentOptions[eventName]);
                }
            });

            const resultOptions = kendo.deepExtend(options, { rtl: isRtl(this.element) });
            this._parseAriaLabelTemplates(resultOptions);
            this._instance.setOptions(resultOptions);

            this.bind(this.events, this._instance.options);
        },

        _initSankey: function() {
            const themeOptions = this._getThemeOptions(this.options);
            this._createSankey(this.options, themeOptions);
            this.options = this._instance.options;
        },

        _createSankey: function(options, themeOptions) {
            this._instance = new Sankey(this.element[0], options, themeOptions);
        },

        _getThemeOptions: function(options) {
            var themeName = (options || {}).theme;

            if (themeName && dataviz.SASS_THEMES.indexOf(themeName.toLowerCase()) !== -1) {
                this.element.addClass("k-chart");
                const theme = sankeyTheme(this.element[0]);

                this.element.removeClass("k-chart");
                return theme;
            }

            if (defined(themeName)) {
                var themes = dataviz.ui.themes || {};
                var theme = themes[themeName] || themes[themeName.toLowerCase()] || {};
                const chartTheme = theme.chart || {};

                const { seriesColors: nodeColors, axisDefaults, seriesDefaults, legend, title } = chartTheme;
                const { line: links, labels } = axisDefaults;
                const strokeColor = seriesDefaults.labels.background;
                return { nodeColors, links, labels: { ...labels, stroke: { color: strokeColor } }, legend, title };
            }
        },

        _parseAriaLabelTemplates: function(options) {
            const { nodes, links } = options;

            if (nodes && nodes.labels && nodes.labels.ariaTemplate) {
                nodes.labels.ariaTemplate = template(nodes.labels.ariaTemplate);
            }

            if (links && links.labels && links.labels.ariaTemplate) {
                links.labels.ariaTemplate = template(links.labels.ariaTemplate);
            }
        },

        _attachEvents: function() {
            this.events.forEach(eventName => {
                this._instance.bind(eventName, event => {
                    if (this._events[eventName]) {
                        this._events[eventName].forEach(handler => handler.call(undefined, event));
                    }
                });
            });

            this._instance.bind(TOOLTIP_SHOW, this.tooltipShow.bind(this));
            this._instance.bind(TOOLTIP_HIDE, this.tooltipHide.bind(this));
        },

        tooltipShow: function(e) {
            const { tooltip, rtl } = this.options;
            const { nodeTemplate, linkTemplate, offset } = tooltip;

            if (!this._tooltip) {
                const doc = this.element[0].ownerDocument;
                this._tooltip = new Tooltip(doc.createElement('div'), { rtl });
                const { appendTo = doc.body } = this.options.tooltip;
                this._tooltip.element.appendTo($(appendTo));
            }

            const currentTemplate = template((e.targetType === NODE ? nodeTemplate : linkTemplate) || ContentTemplates[e.targetType]);
            const value = encode(kendo.format(this.options.messages.tooltipUnits, defined(e.nodeValue) ? e.nodeValue : e.dataItem.value));

            this._tooltip.setContent(currentTemplate({ dataItem: e.dataItem, value, rtl }));
            this._tooltip.setPosition(e.tooltipData.popupAlign, e.tooltipData.popupOffset, offset);
            this._tooltip.show();
        },

        tooltipHide: function() {
            if (this._tooltip) {
                this._tooltip.destroy();
                this._tooltip = null;
            }
        },

        exportVisual: function(exportOptions) {
            return this._instance.exportVisual(exportOptions);
        },

        destroy: function() {
            Widget.fn.destroy.call(this);
            this.tooltipHide();
            this._instance.destroy();
            this._instance = null;
        },

        events: [
            NODE_CLICK,
            LINK_CLICK,
            NODE_ENTER,
            NODE_LEAVE,
            LINK_ENTER,
            LINK_LEAVE
        ],
        options: {
            name: "Sankey",
            theme: "default",
            tooltip: {
                offset: 12
            },
            messages: {
                tooltipUnits: "({0} Units)"
            }
        }
    });

    dataviz.ExportMixin.extend(Sankey$1.fn);

    if (kendo.PDFMixin) {
        kendo.PDFMixin.extend(Sankey$1.fn);
    }

    dataviz.ui.plugin(Sankey$1);

    kendo.deepExtend(dataviz, {
        Sankey: Sankey$1,
        createSankeyData: createSankeyData
    });

})(window.kendo.jQuery);


var kendo$1 = kendo;

export { __meta__, kendo$1 as default };
