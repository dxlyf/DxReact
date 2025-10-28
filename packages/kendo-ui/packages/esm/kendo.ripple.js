import { register } from '@progress/kendo-ripple';

const __meta__ = {
    id: "ripplecontainer",
    name: "RippleContainer",
    category: "web",
    depends: [ "core" ]
};

(function($, undefined$1) {
    var kendo = window.kendo,
        ui = kendo.ui,
        Widget = ui.Widget,
        extend = $.extend;

    var RippleContainer = Widget.extend({
        init: function(element, options) {
            var that = this;

            Widget.fn.init.call(that, element);

            element = that.wrapper = that.element;

            element.addClass("k-ripple-container");

            that.options = extend({}, that.options, options);

            that.registerListeners();
        },

        options: {
            name: "RippleContainer",
            elements: [
                { selector: ".k-button:not(li)" },
                { selector: ".k-list-ul > .k-list-item", options: { global: true } },
                { selector: ".k-checkbox-label, .k-radio-label" },
                {
                    selector: ".k-checkbox, .k-radio",
                    options: {
                        events: [ "focusin", "animationend", "click"]
                    }
                }
            ]
        },

        removeListeners: function() {},

        registerListeners: function() {
            var that = this;
            var root = that.element[0];
            var elements = that.options.elements;

            that.removeListeners();

            var callback = register(root, elements);

            that.removeListeners = callback;
        },

        destroy: function() {
            var that = this;

            Widget.fn.destroy.call(that);

            that.removeListeners();
        }
    });

    ui.plugin(RippleContainer);

})(window.kendo.jQuery);
var kendo$1 = kendo;

export { __meta__, kendo$1 as default };
