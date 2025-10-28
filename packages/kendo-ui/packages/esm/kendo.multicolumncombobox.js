import './kendo.combobox.js';
import './kendo.list.js';
import './kendo.data.js';
import './kendo.core.js';
import './kendo.licensing.js';
import '@progress/kendo-licensing';
import './kendo.data.odata.js';
import './kendo.data.xml.js';
import './kendo.popup.js';
import './kendo.label.js';
import './kendo.floatinglabel.js';
import './kendo.icons.js';
import './kendo.html.icon.js';
import './kendo.html.base.js';
import '@progress/kendo-svg-icons';
import './kendo.actionsheet.js';
import './kendo.html.button.js';
import './kendo.actionsheet.view.js';
import './kendo.button.js';
import './kendo.badge.js';
import './dropdowns-loader-00xUvouJ.js';
import './kendo.mobile.scroller.js';
import './kendo.fx.js';
import './kendo.draganddrop.js';
import './kendo.userevents.js';
import './kendo.virtuallist.js';
import './valueMapper-CXgI6HWc.js';
import './prefix-suffix-containers-Cid0cOEy.js';

const __meta__ = {
    id: "multicolumncombobox",
    name: "MultiColumnComboBox",
    category: "web",
    description: "The MultiColumnComboBox widget allows the selection from pre-defined values or entering a new value where the list popup is rendered in table layout.",
    depends: [ "combobox" ],
    features: [ {
        id: "mobile-scroller",
        name: "Mobile scroller",
        description: "Support for kinetic scrolling in mobile device",
        depends: [ "mobile.scroller" ]
    }, {
        id: "virtualization",
        name: "VirtualList",
        description: "Support for virtualization",
        depends: [ "virtuallist" ]
    } ]
};

(function($, undefined$1) {
    var kendo = window.kendo,
        ui = kendo.ui,
        ComboBox = ui.ComboBox,
        Select = ui.Select,
        percentageUnitsRegex = /^\d+(\.\d+)?%$/i,
        MCCOMBOBOX = "k-dropdowngrid",
        POPUPCLASS = "k-dropdowngrid-popup";

    var MultiColumnComboBox = ComboBox.extend({
        init: function(element, options) {
            ComboBox.fn.init.call(this, element, options);
            this.list.parent().addClass(POPUPCLASS);

            if (this._allColumnsWidthsAreSet(this.options)) {
                this.list.parent().width(this._calculateDropDownWidth(this.options));
            } else if (this.options.dropDownWidth) {
                this.list.parent().width(this.options.dropDownWidth);
            }
        },

        options: {
            name: "MultiColumnComboBox",
            ns: ".kendoMultiColumnComboBox",
            columns: [],
            dropDownWidth: null,
            filterFields: []
        },

        setOptions: function(options) {
            ComboBox.fn.setOptions.call(this, options);
            if (this._allColumnsWidthsAreSet(options)) {
                this.list.parent().width(this._calculateDropDownWidth(options));
            } else if (this.options.dropDownWidth) {
                this.list.parent().width(this.options.dropDownWidth);
            }
        },

        _popup: function() {
            Select.fn._popup.call(this);
            this.popup.element.removeClass("k-list-container");
        },

        _allColumnsWidthsAreSet: function(options) {
            var columns = options.columns;

            if (!columns || !columns.length) {
                return false;
            }

            for (var i = 0; i < columns.length; i++) {
                var currentWidth = columns[i].width;
                if (!currentWidth || isNaN(parseInt(currentWidth, 10)) || percentageUnitsRegex.test(currentWidth)) {
                    return false;
                }
            }

            return true;
        },

        _calculateDropDownWidth: function(options) {
            var columns = options.columns;
            var totalWidth = kendo.support.scrollbar();

            for (var i = 0; i < columns.length; i++) {
                var currentWidth = columns[i].width;
                totalWidth = totalWidth + parseInt(currentWidth, 10);
            }

            return totalWidth;
        },

        _wrapper: function() {
            ComboBox.fn._wrapper.call(this);
            this.wrapper.addClass(MCCOMBOBOX);
        }
    });

    ui.plugin(MultiColumnComboBox);

    kendo.cssProperties.registerPrefix("MultiColumnComboBox", "k-input-");

    kendo.cssProperties.registerValues("MultiColumnComboBox", [{
        prop: "rounded",
        values: kendo.cssProperties.roundedValues.concat([['full', 'full']])
    }]);
})(window.kendo.jQuery);
var kendo$1 = kendo;

export { __meta__, kendo$1 as default };
