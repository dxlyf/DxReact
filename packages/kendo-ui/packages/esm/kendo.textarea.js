import './kendo.core.js';
import './kendo.floatinglabel.js';
import { a as addInputPrefixSuffixContainers } from './prefix-suffix-containers-Cid0cOEy.js';
import './kendo.licensing.js';
import '@progress/kendo-licensing';

const __meta__ = {
    id: "textarea",
    name: "TextArea",
    category: "web",
    description: "The TextArea widget represents a multi-line plain-text editing control which enables you to style and provide a floating label functionality to textarea elements",
    depends: ["core", "floatinglabel"]
};

(function($, undefined$1) {
    var kendo = window.kendo,
        Widget = kendo.ui.Widget,
        ui = kendo.ui,
        isPlainObject = $.isPlainObject,
        NS = ".kendoTextArea",
        CHANGE = "change",
        DISABLED = "disabled",
        READONLY = "readonly",
        INPUT = "k-input-inner",
        FOCUSED = "k-focus",
        LABELCLASSES = "k-label k-input-label",
        FLOATINGLABELCLASS = "k-floating-label",
        STATEDISABLED = "k-disabled",
        STATEREADONLY = "k-readonly",
        ARIA_DISABLED = "aria-disabled",
        TEXTAREACONTAINER = "k-textarea-container";

    var TextArea = Widget.extend({
        init: function(element, options) {
            var that = this;

            Widget.fn.init.call(that, element, options);
            options = $.extend(true, {}, options);

            that.options.value = options.value || that.element.val();
            that.options.readonly = options.readonly !== undefined$1 ? options.readonly : Boolean(that.element.attr("readonly"));
            that.options.enable = options.enable !== undefined$1 ? options.enable : !(Boolean(that.element.attr("disabled")));
            that.options.placeholder = options.placeholder || that.element.attr("placeholder");
            that.options.maxLength = options.maxLength || that.element.attr("maxlength");
            that.options.inputMode = options.inputMode || that.element.attr("inputmode") || "text";

            if (!that.options.value.replace(/\s/g, '').length) {
                that.options.value = '';
                that.element.val('');
            }

            that.value(that.options.value);
            that._wrapper();
            that._label();
            that._editable({
                readonly: that.options.readonly,
                disable: !(that.options.enable)
            });
            that._applyAttributes();
            that._applyCssClasses();
            that.element.attr("autocomplete", "off");
            that.element.attr("inputmode", that.options.inputMode);

            addInputPrefixSuffixContainers({ widget: that, wrapper: that.wrapper, options: that.options });
            if (that.floatingLabel) {
                that.floatingLabel.refresh();
            }

            kendo.notify(that);
        },

        events: [
            CHANGE
        ],

        attributes: [
            "maxLength",
            "rows",
            "placeholder"
        ],

        options: {
            name: 'TextArea',
            value: '',
            readonly: false,
            enable: true,
            placeholder: '',
            label: null,
            resizable: "none",
            maxLength: null,
            maxRows: null,
            cols: 20,
            rows: 1,
            rounded: "medium",
            size: "medium",
            fillMode: "solid",
            resize: "none",
            overflow: "auto",
            layoutFlow: "vertical",
            prefixOptions: {
                separator: true
            },
            suffixOptions: {
                separator: true
            }
        },

        _applyCssClasses: function(action) {
            let that = this;
            let options = that.options;
            let resize = kendo.cssProperties.getValidClass({
                widget: options.name,
                propName: "resize",
                value: options.resize
            });

            let overflow = kendo.cssProperties.getValidClass({
                widget: options.name,
                propName: "overflow",
                value: options.overflow
            });

            let layoutFlow = kendo.cssProperties.getValidClass({
                widget: options.name,
                propName: "layoutFlow",
                value: options.layoutFlow
            });

            Widget.fn._applyCssClasses.call(that);

            if (!resize && (options.resize === "none" || options.resize === "auto")) {
                resize = "k-resize-none";
            }

            if (overflow) {
                overflow = "!" + overflow;
            }

            action = action || "addClass";

            that.element[action](resize);
            that.element[action](overflow);
            that.element[action](INPUT);
            that.wrapper[action](layoutFlow);
            if (options.layoutFlow == "vertical") {
                that.element[action]("!k-flex-none");
            }
        },

        _applyAttributes: function() {
            var that = this;
            var property;
            var attributes = {};

            for (property in that.attributes) {
                attributes[that.attributes[property]] = that.options[that.attributes[property]];
            }

            that.element.attr(attributes);
        },

        value: function(value) {
            var that = this;

            if (value === undefined$1) {
                return that._value;
            }

            that._value = value;
            that.element.val(value);
        },

        readonly: function(readonly) {
            var that = this;

            this._editable({
                readonly: readonly === undefined$1 ? true : readonly,
                disable: false
            });

            if (that.floatingLabel) {
                that.floatingLabel.readonly(readonly === undefined$1 ? true : readonly);
            }
        },

        enable: function(enable) {
            var that = this;

            this._editable({
                readonly: false,
                disable: !(enable = enable === undefined$1 ? true : enable)
            });

            if (that.floatingLabel) {
                that.floatingLabel.enable(enable = enable === undefined$1 ? true : enable);
            }
        },

        focus: function() {
            var that = this;

            that.element[0].focus();
        },

        updateAutoHeight: function() {
            const that = this;
            const element = that.element;
            const options = that.options;

            if (options.resize === "auto" && options.maxRows) {
                const computedStyle = getComputedStyle(element[0]);
                const lineHeight = parseInt(computedStyle.lineHeight, 10) || 16;
                const paddingTop = parseInt(computedStyle.paddingTop, 10) || 0;
                const paddingBottom = parseInt(computedStyle.paddingBottom, 10) || 0;
                const totalPadding = paddingTop + paddingBottom;
                const minHeight = (options.rows * lineHeight) + totalPadding;
                const maxHeight = (options.maxRows * lineHeight) + totalPadding;

                element.css({
                    height: minHeight + "px"
                });

                const scrollHeight = element[0].scrollHeight;

                element.css({
                    maxHeight: maxHeight + "px",
                    height: scrollHeight + "px"
                });
            }
        },

        destroy: function() {
            var that = this;

            that._applyCssClasses("removeClass");

            if (that.floatingLabel) {
                that.floatingLabel.destroy();
            }

            if (that._inputLabel) {
                that._inputLabel.remove();
                that._inputLabel = null;
            }

            // Move the styles back to the element.
            that.element[0].style.cssText = that.wrapper[0].style.cssText;

            that.element.off(NS);
            that.element.unwrap();
            that.wrapper = null;
            Widget.fn.destroy.call(that);
        },

        setOptions: function(options) {
            var that = this;
            that.destroy();
            that.init(that.element, options);
        },

        _editable: function(options) {
            var that = this;
            var element = that.element;
            var wrapper = that.wrapper;
            var disable = options.disable;
            var readonly = options.readonly;

            element.off(NS);

            if (!readonly && !disable) {
                element.prop(DISABLED, false)
                       .prop(READONLY, false)
                       .attr(ARIA_DISABLED, false);

                wrapper.removeClass(STATEDISABLED)
                        .removeClass(STATEREADONLY);

                element.on("focusin" + NS, that._focusin.bind(that));
                element.on("focusout" + NS, that._focusout.bind(that));
                element.on("input" + NS, that._input.bind(that));
            } else {
                element.attr(DISABLED, disable)
                       .attr(READONLY, readonly)
                       .attr(ARIA_DISABLED, disable);

                wrapper.toggleClass(STATEDISABLED, disable)
                        .toggleClass(STATEREADONLY, readonly);
            }
        },

        _label: function() {
            var that = this;
            var element = that.element;
            var options = that.options;
            var id = element.attr("id");
            var floating;
            var labelText;

            if (options.label !== null) {
                floating = isPlainObject(options.label) ? options.label.floating : false;
                labelText = isPlainObject(options.label) ? options.label.content : options.label;

                if (floating) {
                    that._floatingLabelContainer = that.wrapper.wrap("<span></span>").parent();
                    that.floatingLabel = new kendo.ui.FloatingLabel(that._floatingLabelContainer, { widget: that });
                    that._floatingLabelContainer.addClass(TEXTAREACONTAINER);
                }

                if (kendo.isFunction(labelText)) {
                    labelText = labelText.call(that);
                }

                if (!labelText) {
                    labelText = "";
                }

                if (!id) {
                    id = options.name + "_" + kendo.guid();
                    element.attr("id", id);
                }

                that._inputLabel = $("<label class='" + (floating ? FLOATINGLABELCLASS : LABELCLASSES) + "' for='" + id + "'>" + labelText + "</label>'")[floating ? "insertAfter" : "insertBefore"](that.wrapper);
            }
        },

        _focusin: function() {
            var that = this;

            that.wrapper.addClass(FOCUSED);
        },

        _focusout: function() {
            var that = this;
            var value = that._value;
            var newValue = that.element.val();

            that.wrapper.removeClass(FOCUSED);

            if (value === null) {
                value = "";
            }

            if (value !== newValue) {
                that._value = newValue;

                that.trigger(CHANGE);
            }
        },

        _input: function() {
            this.updateAutoHeight();
        },

        _wrapper: function() {
            var that = this;
            var element = that.element;
            var DOMElement = element[0];
            var wrapper;

            wrapper = element.wrap("<span class='k-input k-textarea'></span>").parent();
            wrapper[0].style.cssText = DOMElement.style.cssText;
            DOMElement.style.width = "";

            that.wrapper = wrapper.addClass(DOMElement.className).removeClass('input-validation-error');
        }
    });

    kendo.cssProperties.registerPrefix("TextArea", "k-input-");

    kendo.cssProperties.registerValues("TextArea", [{
        prop: "rounded",
        values: kendo.cssProperties.roundedValues.concat([['full', 'full']])
    }]);

    ui.plugin(TextArea);
})(window.kendo.jQuery);
var kendo$1 = kendo;

export { __meta__, kendo$1 as default };
