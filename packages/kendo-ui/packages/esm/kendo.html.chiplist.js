import './kendo.html.base.js';
import './kendo.core.js';
import './kendo.licensing.js';
import '@progress/kendo-licensing';

const __meta__ = {
    id: "html.chiplist",
    name: "Html.ChipList",
    category: "web",
    description: "HTML rendering utility for Kendo UI for jQuery.",
    depends: ["html.base"],
    features: []
};

(function($, undefined$1) {
    var kendo = window.kendo,
        HTMLBase = kendo.html.HTMLBase;

    var renderChipList = function(element, options) {
        if (arguments[0] === undefined$1 || $.isPlainObject(arguments[0])) {
            options = element;
            element = $("<div></div>");
        }

        return (new HTMLChipList(element, options)).html();
    };

    var HTMLChipList = HTMLBase.extend({
        init: function(element, options) {
            var that = this;
            HTMLBase.fn.init.call(that, element, options);
            that.wrapper = that.element.addClass("k-chip-list");
            that._applyAriaAttributes(options);
            that._addClasses();
        },
        options: {
            name: "HTMLChipList",
            size: "medium",
            stylingOptions: ["size"]
        },
        _applyAriaAttributes: function(options) {
            var that = this;
            options = $.extend({ selectable: "none" }, options);
            var ariaLabelOption = (options.attributes || {})["aria-label"];

            if (options.selectable !== "none") {
                that.element.attr({
                    "aria-multiselectable": options.selectable === "multiple",
                    role: "listbox",
                    "aria-label": ariaLabelOption || that.element.attr("id") + " listbox",
                    "aria-orientation": "horizontal"
                });
            } else {
                that.element.removeAttr("role aria-label aria-multiselectable aria-orientation");
            }
        }
    });

    $.extend(kendo.html, {
        renderChipList: renderChipList,
        HTMLChipList: HTMLChipList
    });

    kendo.cssProperties.registerPrefix("HTMLChipList", "k-chip-list-");

})(window.kendo.jQuery);
var kendo$1 = kendo;

export { __meta__, kendo$1 as default };
