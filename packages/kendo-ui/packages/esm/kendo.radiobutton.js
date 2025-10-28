import './kendo.toggleinputbase.js';
import './kendo.html.input.js';
import './kendo.core.js';
import './kendo.licensing.js';
import '@progress/kendo-licensing';
import './kendo.html.base.js';

const __meta__ = {
    id: "radiobutton",
    name: "RadioButton",
    category: "web",
    description: "The RadioButton widget is used to display an input of type radio.",
    depends: [ "toggleinputbase", "html.input" ]
};

(function($, undefined$1) {
    var kendo = window.kendo,
        ui = kendo.ui,
        ToggleInputBase = ui.ToggleInputBase;

    var RadioButton = ToggleInputBase.extend({
        init: function(element, options) {
            ToggleInputBase.fn.init.call(this, element, options);

            if (options && options.value && options.value.length) {
                this.element.attr("value", options.value);
            }
        },

        options: {
            name: "RadioButton",
            checked: null,
            value: "",
            enabled: true,
            encoded: true,
            label: null,
            size: "medium",
            wrapperClass: "k-radio-wrap"
        },

        RENDER_INPUT: kendo.html.renderRadioButton,
        NS: ".kendoRadioButton"
    });

    kendo.cssProperties.registerPrefix("RadioButton", "k-radio-");

    ui.plugin(RadioButton);
})(window.kendo.jQuery);
var kendo$1 = kendo;

export { __meta__, kendo$1 as default };
