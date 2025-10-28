import './mixins-C63N9J7p.js';
import './kendo.ooxml.js';
import './kendo.progressbar.js';
import './kendo.core.js';
import './html-DIrOxn6k.js';
import './mixins-pM1BXjp5.js';
import './kendo.toolbar.js';
import './kendo.list.js';
import './kendo.spreadsheet.common.js';
import './kendo.binder.js';
import './kendo.validator.js';
import './kendo.icons.js';
import './kendo.window.js';
import './kendo.colorpicker.js';
import './kendo.combobox.js';
import './kendo.dropdownlist.js';
import './kendo.dropdownbutton.js';
import './kendo.popup.js';
import './kendo.togglebutton.js';
import './kendo.calendar.js';
import './kendo.listview.js';
import './kendo.dom.js';
import './kendo.sortable.js';
import './kendo.treeview.js';
import './kendo.numerictextbox.js';
import './kendo.datepicker.js';
import './kendo.datetimepicker.js';
import './kendo.data.js';
import './kendo.data.odata.js';
import './kendo.licensing.js';
import '@progress/kendo-licensing';
import './kendo.data.xml.js';
import '@progress/kendo-ooxml';
import '@progress/kendo-drawing';
import './kendo.color.js';
import './kendo.splitbutton.js';
import './kendo.html.button.js';
import './kendo.html.base.js';
import './kendo.html.icon.js';
import '@progress/kendo-svg-icons';
import './kendo.button.menu.js';
import './kendo.buttongroup.js';
import './kendo.button.js';
import './kendo.badge.js';
import './kendo.menu.js';
import './kendo.label.js';
import './kendo.floatinglabel.js';
import './kendo.actionsheet.js';
import './kendo.actionsheet.view.js';
import './dropdowns-loader-00xUvouJ.js';
import '@progress/kendo-spreadsheet-common';
import './kendo.draganddrop.js';
import './kendo.userevents.js';
import './kendo.slider.js';
import './kendo.textbox.js';
import './prefix-suffix-containers-Cid0cOEy.js';
import './kendo.mobile.scroller.js';
import './kendo.fx.js';
import './kendo.virtuallist.js';
import './valueMapper-CXgI6HWc.js';
import './kendo.selectable.js';
import './kendo.editable.js';
import './kendo.checkbox.js';
import './kendo.toggleinputbase.js';
import './kendo.html.input.js';
import './kendo.multiselect.js';
import './kendo.html.chip.js';
import './kendo.html.chiplist.js';
import './kendo.otpinput.js';
import './kendo.upload.js';
import './kendo.dateinput.js';
import '@progress/kendo-dateinputs-common';
import './kendo.pager.js';
import './kendo.treeview.draganddrop.js';
import './kendo.timepicker.js';

(function(kendo) {
    var $ = kendo.jQuery;
    var ObservableObject = kendo.data.ObservableObject;

    var MESSAGES = kendo.spreadsheet.messages.dialogs = {
        apply: "Apply",
        save: "Save",
        cancel: "Cancel",
        remove: "Remove",
        retry: "Retry",
        revert: "Revert",
        okText: "OK",
        formatCellsDialog: {
            title: "Format",
            categories: {
                number: "Number",
                currency: "Currency",
                date: "Date"
            }
        },
        fontFamilyDialog: {
            title: "Font"
        },
        fontSizeDialog: {
            title: "Font size"
        },
        bordersDialog: {
            title: "Borders"
        },
        alignmentDialog: {
            title: "Alignment",
            buttons: {
                justifyLeft: "Align left",
                justifyCenter: "Center",
                justifyRight: "Align right",
                justifyFull: "Justify",
                alignTop: "Align top",
                alignMiddle: "Align middle",
                alignBottom: "Align bottom"
            }
        },
        mergeDialog: {
            title: "Merge cells",
            buttons: {
                mergeCells: "Merge all",
                mergeHorizontally: "Merge horizontally",
                mergeVertically: "Merge vertically",
                unmerge: "Unmerge"
            }
        },
        freezeDialog: {
            title: "Freeze panes",
            buttons: {
                freezePanes: "Freeze panes",
                freezeRows: "Freeze rows",
                freezeColumns: "Freeze columns",
                unfreeze: "Unfreeze panes"
            }
        },
        confirmationDialog: {
            text: "Are you sure you want to remove this sheet?",
            title: "Sheet remove"
        },
        validationDialog: {
            title: "Data Validation",
            hintMessage: "Please enter a valid {0} value {1}.",
            hintTitle: "Validation {0}",
            criteria: {
                any: "Any value",
                number: "Number",
                text: "Text",
                date: "Date",
                custom: "Custom Formula",
                list: "List"
            },
            comparers: {
                greaterThan: "greater than",
                lessThan: "less than",
                between: "between",
                notBetween: "not between",
                equalTo: "equal to",
                notEqualTo: "not equal to",
                greaterThanOrEqualTo: "greater than or equal to",
                lessThanOrEqualTo: "less than or equal to"
            },
            comparerMessages: {
                greaterThan: "greater than {0}",
                lessThan: "less than {0}",
                between: "between {0} and {1}",
                notBetween: "not between {0} and {1}",
                equalTo: "equal to {0}",
                notEqualTo: "not equal to {0}",
                greaterThanOrEqualTo: "greater than or equal to {0}",
                lessThanOrEqualTo: "less than or equal to {0}",
                custom: "that satisfies the formula: {0}"
            },
            labels: {
                criteria: "Criteria",
                comparer: "Comparer",
                min: "Min",
                max: "Max",
                value: "Value",
                start: "Start",
                end: "End",
                onInvalidData: "On invalid data",
                rejectInput: "Reject input",
                showWarning: "Show warning",
                showHint: "Show hint",
                hintTitle: "Hint title",
                hintMessage: "Hint message",
                ignoreBlank: "Ignore blank",
                showListButton: "Display button to show list",
                showCalendarButton: "Display button to show calendar"
            },
            placeholders: {
                typeTitle: "Type title",
                typeMessage: "Type message"
            }
        },
        exportAsDialog: {
            title: "Export...",
            defaultFileName: "Workbook",
            xlsx: {
                description: "Excel Workbook (.xlsx)"
            },
            pdf: {
                description: "Portable Document Format (.pdf)",
                area: {
                    workbook: "Entire Workbook",
                    sheet: "Active Sheet",
                    selection: "Selection"
                },
                paper: {
                    a2        : "A2 (420 mm × 594 mm)",
                    a3        : "A3 (297 mm x 420 mm)",
                    a4        : "A4 (210 mm x 297 mm)",
                    a5        : "A5 (148 mm x 210 mm)",
                    b3        : "B3 (353 mm × 500 mm)",
                    b4        : "B4 (250 mm x 353 mm)",
                    b5        : "B5 (176 mm x 250 mm)",
                    folio     : 'Folio (8.5" x 13")',
                    legal     : 'Legal (8.5" x 14")',
                    letter    : 'Letter (8.5" x 11")',
                    tabloid   : 'Tabloid (11" x 17")',
                    executive : 'Executive (7.25" x 10.5")'
                },
                margin: {
                    normal: "Normal",
                    narrow: "Narrow",
                    wide: "Wide"
                }
            },
            labels: {
                scale: "Scale",
                fit: "Fit to page",
                fileName: "File name",
                saveAsType: "Save as type",
                exportArea: "Export",
                paperSize: "Paper size",
                margins: "Margins",
                orientation: "Orientation",
                print: "Print",
                guidelines: "Guidelines",
                center: "Center",
                horizontally: "Horizontally",
                vertically: "Vertically"
            }
        },
        modifyMergedDialog: {
            errorMessage: "Cannot change part of a merged cell."
        },
        rangeDisabledDialog: {
            errorMessage: "Destination range contains disabled cells."
        },
        intersectsArrayDialog: {
            errorMessage: "You cannot alter part of an array"
        },
        incompatibleRangesDialog: {
            errorMessage: "Incompatible ranges"
        },
        noFillDirectionDialog: {
            errorMessage: "Cannot determine fill direction"
        },
        duplicateSheetNameDialog: {
            errorMessage: "Duplicate sheet name"
        },
        overflowDialog: {
            errorMessage: "Cannot paste, because the copy area and the paste area are not the same size and shape."
        },
        useKeyboardDialog: {
            title: "Copying and pasting",
            errorMessage: "These actions cannot be invoked through the menu. Please use the keyboard shortcuts instead:",
            labels: {
                forCopy: "for copy",
                forCut: "for cut",
                forPaste: "for paste"
            }
        },
        unsupportedSelectionDialog: {
            errorMessage: "That action cannot be performed on multiple selection."
        },
        linkDialog: {
            title: "Hyperlink",
            labels: {
                text: "Text",
                url: "Address",
                removeLink: "Remove link"
            }
        },
        sheetRenameDialog: {
            title: "Rename Sheet",
            labels: {
                text: "Rename Sheet",
                rename: "Rename"
            }
        },
        insertCommentDialog: {
            title: "Insert comment",
            labels: {
                comment: "Comment",
                removeComment: "Remove comment"
            }
        },
        insertImageDialog: {
            title: "Insert image",
            info: "Drag an image here, or click to select",
            typeError: "Please select a JPEG, PNG or GIF image"
        }
    };

    var registry = {};
    kendo.spreadsheet.dialogs = {
        register: function(name, dialogClass) {
            registry[name] = dialogClass;
        },
        registered: function(name) {
            return !!registry[name];
        },
        create: function(name, options) {
            var dialogClass = registry[name];

            if (dialogClass) {
                return new dialogClass(options);
            }
        }
    };

    var SpreadsheetDialog = kendo.spreadsheet.SpreadsheetDialog = kendo.Observable.extend({
        init: function(options) {
            kendo.Observable.fn.init.call(this, options);

            this.options = translate($.extend(true, {}, this.options, options));

            this.bind(this.events, options);
        },
        events: [
            "close",
            "activate"
        ],
        options: {
            autoFocus: true
        },
        dialog: function() {
            if (!this._dialog) {
                var options = {
                    autoFocus: false,
                    scrollable: false,
                    resizable: false,
                    modal: true,
                    visible: false,
                    width: this.options.width || 320,
                    title: this.options.title,
                    open: function() {
                        this.center();
                    },
                    close: this._onDialogClose.bind(this),
                    activate: this._onDialogActivate.bind(this),
                    deactivate: this._onDialogDeactivate.bind(this)
                };
                this._dialog = $("<div class='k-spreadsheet-window k-action-window k-popup-edit-form' />")
                    .addClass(this.options.className || "")
                    .append(kendo.template(this.options.template)({
                        messages: kendo.spreadsheet.messages.dialogs || MESSAGES,
                        ns: kendo.ns,

                        // this is for ImportErrorDialog.  ugly that
                        // we need this line here, but I couldn't
                        // figure out a better way
                        errors: this.options.errors
                    }))
                    .kendoWindow(options)
                    .data("kendoWindow");
            }

            return this._dialog;
        },
        _onDialogClose: function() {
            this.trigger("close", {
                action: this._action
            });
        },
        _onDialogActivate: function() {
            this.trigger("activate");
        },
        _onDialogDeactivate: function() {
            this.trigger("deactivate");
            this.destroy();
        },
        destroy: function() {
            if (this._dialog) {
                this._dialog.destroy();
                this._dialog = null;
            }
        },
        open: function() {
            this.dialog().open();
            this.dialog().element.find(".k-button-solid-primary").trigger("focus");
        },
        apply: function() {
            this.close();
        },
        close: function() {
            this._action = "close";

            this.dialog().close();
        }
    });

    function formattedValue(value, format) {
        return kendo.spreadsheet.formatting.text(value, format);
    }

    var FormatCellsViewModel = kendo.spreadsheet.FormatCellsViewModel = ObservableObject.extend({
        init: function(options) {
            ObservableObject.fn.init.call(this, options);

            this.useCategory(this.category);
        },
        useCategory: function(category) {
            var type = category && category.type || "number";
            var formatCurrency = type == "currency";

            this.category = category;

            this.set("showCurrencyFilter", formatCurrency && this.currencies.length > 1);

            if (!formatCurrency) {
                this.set("formats", this.allFormats[type + "Formats"]);
            } else {
                this.currency(this.currencies[0]);
            }

            this.useFirstFormat();
        },
        useFirstFormat: function() {
            if (this.formats.length) {
                this.set("format", this.formats[0].value);
            }
        },
        currency: function(currency) {
            if (currency !== undefined) {
                this._currency = currency;

                var info = currency.value;
                var formats = [
                    { currency: info, decimals: true },
                    { currency: info, decimals: true, iso: true },
                    { currency: info, decimals: false }
                ];

                formats = formats.map(function(format) {
                    format = FormatCellsViewModel.convert.currency(format);

                    return { value: format, name: formattedValue(1000, format) };
                });

                this.set("formats", formats);

                this.useFirstFormat();
            }

            return this._currency || this.currencies[0];
        },
        categoryFilter: function(category) {
            if (category !== undefined) {
                this.useCategory(category);
            }

            return this.category;
        },
        preview: function() {
            var format = this.get("format");
            var value = this.value || 0;

            if (format && format.length) {
                return formattedValue(value, format);
            } else {
                return value;
            }
        }
    });

    FormatCellsViewModel.convert = {
        currency: function(options) {
            function repeat(token, n) {
                return new Array(n+1).join(token);
            }

            // convert culture info to spreadsheet format
            var info = options.currency;
            var format = info.pattern[1];

            if (options.decimals) {
                format = format.replace(/n/g, "n" + info["."] + repeat("0", info.decimals));
            }

            if (options.iso) {
                format = '"' + info.abbr + '" ' + format.replace(/\s*\$\s*/g, "");
            } else {
                format = format.replace(/\$/g, JSON.stringify(info.symbol));
            }

            format = format.replace(/n/g, "?");

            return format;
        },
        date: function(format) {
            if ((/T|Z/).test(format)) {
                return "";
            }

            return format.toLowerCase().replace(/tt/g, "AM/PM").replace(/'/g, '"');
        }
    };

    function uniqueBy(field, array) {
        var result = [];
        var values = [];

        for (var i = 0; i < array.length; i++) {
            if ($.inArray(array[i][field], values) == -1) {
                result.push(array[i]);
                values.push(array[i][field]);
            }
        }

        return result;
    }

    var FormatCellsDialog = SpreadsheetDialog.extend({
        init: function(options) {
            var messages = kendo.spreadsheet.messages.dialogs.formatCellsDialog || MESSAGES;
            var defaultOptions = {
                title: messages.title,
                categories: [
                    { type: "number", name: messages.categories.number },
                    { type: "currency", name: messages.categories.currency },
                    { type: "date", name: messages.categories.date }
                ]
            };

            SpreadsheetDialog.fn.init.call(this, $.extend(defaultOptions, options));

            this._generateFormats();
        },
        options: {
            className: "k-spreadsheet-format-cells",
            template: (data) => {
                let $kendoOutput;
                $kendoOutput = `<div class='k-edit-form-container'><div class='k-root-tabs' data-${kendo.htmlEncode(data.ns)}role='tabstrip' data-${kendo.htmlEncode(data.ns)}text-field='name' data-${kendo.htmlEncode(data.ns)}bind='source: categories, value: categoryFilter' data-${kendo.htmlEncode(data.ns)}animation='false'></div>
    <div class='k-spreadsheet-preview' data-${kendo.htmlEncode(data.ns)}bind='text: preview'></div><select data-${kendo.htmlEncode(data.ns)}role='dropdownlist' class='k-format-filter' data-${kendo.htmlEncode(data.ns)}text-field='description' data-${kendo.htmlEncode(data.ns)}value-field='value.name' data-${kendo.htmlEncode(data.ns)}bind='visible: showCurrencyFilter, value: currency, source: currencies'></select><ul data-${kendo.htmlEncode(data.ns)}role='staticlist' tabindex='0' id='formats-list' aria-label='formats list' class='k-list k-reset' bind:data-${kendo.htmlEncode(data.ns)}template='formatItemTemplate' data-${kendo.htmlEncode(data.ns)}value-primitive='true' data-${kendo.htmlEncode(data.ns)}value-field='value' data-${kendo.htmlEncode(data.ns)}bind='source: formats, value: format'></ul>
    <div class='k-actions'><button class='k-button k-button-md k-rounded-md k-button-solid k-button-solid-primary' data-${kendo.htmlEncode(data.ns)}bind='click: apply'><span class='k-button-text'>${kendo.htmlEncode(data.messages.apply)}</span></button><button class='k-button k-button-md k-rounded-md k-button-solid k-button-solid-base' data-${kendo.htmlEncode(data.ns)}bind='click: close'><span class='k-button-text'>${kendo.htmlEncode(data.messages.cancel)}</span></button></div>
</div>`;
                return $kendoOutput;
            }
        },
        _generateFormats: function() {
            var options = this.options;

            if (!options.currencies) {
                options.currencies = FormatCellsDialog.currenciesFrom(kendo.cultures);
            }

            if (!options.numberFormats) {
                options.numberFormats = [
                    { value: "#.00%", name: "100.00%" },
                    { value: "#%", name: "100%" },
                    { value: "#.00", name: "1024.00" },
                    { value: "#,###.00", name: "1,024.00" }
                ];
            }

            if (!options.dateFormats) {
                var calendarPatterns = kendo.cultures.current.calendars.standard.patterns;

                options.dateFormats = uniqueBy("value", $.map(calendarPatterns, function(format) {
                    format = FormatCellsViewModel.convert.date(format);

                    if (!format) {
                        return;
                    }

                    return { value: format, name: formattedValue(34567.7678, format) };
                }));
            }
        },
        open: function(range) {
            var options = this.options;
            var value = range.value();
            var categories = options.categories.slice(0);
            var element;

            this.viewModel = new FormatCellsViewModel({
                currencies: options.currencies.slice(0),
                allFormats: {
                    numberFormats: options.numberFormats.slice(0),
                    dateFormats: options.dateFormats.slice(0)
                },
                categories: categories,
                format: range.format(),
                category: value instanceof Date ? categories[2] : categories[0],
                apply: this.apply.bind(this),
                close: this.close.bind(this),
                value: value,
                formatItemTemplate: (data) => kendo.htmlEncode(data.name)
            });

            SpreadsheetDialog.fn.open.call(this);

            element = this.dialog().element;

            kendo.bind(element, this.viewModel);

            var currencyFilter = element.find("select.k-format-filter").data("kendoDropDownList");

            if (options.currencies.length > 10) {
                currencyFilter.setOptions({ filter: "contains" });
            }

            element.find(kendo.roleSelector("staticlist")).parent().addClass("k-list-wrapper");

            element.find(".k-tabstrip-item").attr("aria-controls", "formats-list");
        },
        apply: function() {
            var format = this.viewModel.format;

            SpreadsheetDialog.fn.apply.call(this);

            this.trigger("action", {
                command: "PropertyChangeCommand",
                options: {
                    property: "format",
                    value: format
                }
            });
        }
    });

    FormatCellsDialog.currenciesFrom = function (cultures) {
        return uniqueBy("description", $.map(cultures, function(culture, name) {
            if (!(/-/).test(name)) {
                return;
            }

            var currency = culture.numberFormat.currency;
            var description = kendo.format(
                "{0} ({1}, {2})",
                currency.name,
                currency.abbr,
                currency.symbol
            );

            return { description: description, value: currency };
        }));
    };

    kendo.spreadsheet.dialogs.register("formatCells", FormatCellsDialog);

    kendo.spreadsheet.dialogs.FormatCellsDialog = FormatCellsDialog;

    var MessageDialog = SpreadsheetDialog.extend({
        options: {
            className: "k-spreadsheet-message",
            title: "",
            messageId: "",
            text: "",
            template: (data) => {
                let $kendoOutput;
                $kendoOutput = `<div class='k-spreadsheet-message-content' data-${kendo.htmlEncode(data.ns)}bind='text: text'></div>
<div class='k-actions'><button class='k-button k-button-md k-rounded-md k-button-solid k-button-solid-primary'
        data-${kendo.htmlEncode(data.ns)}bind='click: close'><span
            class='k-button-text'>${data.messages.okText}</span></button></div>`;
                return $kendoOutput;
            }
        },
        open: function() {
            SpreadsheetDialog.fn.open.call(this);

            var options = this.options;
            var text = options.text;

            if (options.messageId) {
                text = kendo.getter(options.messageId, true)(kendo.spreadsheet.messages.dialogs);
            }

            kendo.bind(this.dialog().element, {
                text: text,
                close: this.close.bind(this)
            });
        }
    });

    kendo.spreadsheet.dialogs.register("message", MessageDialog);

    var ConfirmationDialog = SpreadsheetDialog.extend({
        init: function(options) {
            var messages = kendo.spreadsheet.messages.dialogs.confirmationDialog || MESSAGES;
            var defaultOptions = {
                title: messages.title,
                text: messages.text
            };

            SpreadsheetDialog.fn.init.call(this, $.extend(defaultOptions, options));
        },
        options: {
            className: "k-spreadsheet-message",
            messageId: "",
            template: (data) => {
                let $kendoOutput;
                $kendoOutput = `<div class='k-spreadsheet-message-content' data-${kendo.htmlEncode(data.ns)}bind='text: text'></div>
<div class='k-actions'><button class='k-button k-button-md k-rounded-md k-button-solid k-button-solid-primary'
        data-${kendo.htmlEncode(data.ns)}bind='click: confirm'><span
            class='k-button-text'>${data.messages.okText}</span></button><button
        class='k-button k-button-md k-rounded-md k-button-solid k-button-solid-base'
        data-${kendo.htmlEncode(data.ns)}bind='click: cancel'><span
            class='k-button-text'>${data.messages.cancel}</span></button></div>`;
                return $kendoOutput;
            }
        },
        open: function() {
            SpreadsheetDialog.fn.open.call(this);

            var options = this.options;
            var text = options.text;

            if (options.messageId) {
                text = kendo.getter(options.messageId, true)(kendo.spreadsheet.messages.dialogs);
            }

            kendo.bind(this.dialog().element, {
                text: text,
                confirm: this.confirm.bind(this),
                cancel: this.close.bind(this)
            });
        },
        isConfirmed: function() {
            return this._confirmed;
        },
        confirm: function() {
            this._confirmed = true;
            this.close();
        }
    });

    kendo.spreadsheet.dialogs.register("confirmation", ConfirmationDialog);

    var ValidationErrorDialog = SpreadsheetDialog.extend({
        options: {
            className: "k-spreadsheet-message",
            title: "",
            messageId: "",
            text: "",
            template: (data) => {
                let $kendoOutput;
                $kendoOutput = `<div class='k-spreadsheet-message-content' data-${kendo.htmlEncode(data.ns)}bind='text: text'></div><div class='k-actions'><button class='k-button k-button-md k-rounded-md k-button-solid k-button-solid-primary' data-${kendo.htmlEncode(data.ns)}bind='click: retry'><span class='k-button-text'>${data.messages.retry}</span></button><button class='k-button k-button-md k-rounded-md k-button-solid k-button-solid-base' data-${kendo.htmlEncode(data.ns)}bind='click: cancel'><span class='k-button-text'>${data.messages.cancel}</span></button></div>`;
                return $kendoOutput;
            }
        },
        open: function() {
            SpreadsheetDialog.fn.open.call(this);

            var options = this.options;
            var text = options.text;

            if (options.messageId) {
                text = kendo.getter(options.messageId, true)(kendo.spreadsheet.messages.dialogs);
            }

            kendo.bind(this.dialog().element, {
                text: text,
                retry: this.retry.bind(this),
                cancel: this.close.bind(this)
            });
        },
        retry: function() {
            this._retry = true;
            this.close();
        }
    });

    kendo.spreadsheet.dialogs.register("validationError", ValidationErrorDialog);

    var FontFamilyDialog = SpreadsheetDialog.extend({
        init: function(options) {
            var messages = kendo.spreadsheet.messages.dialogs.fontFamilyDialog || MESSAGES;

            SpreadsheetDialog.fn.init.call(this, $.extend({ title: messages.title }, options));

            this._list();
        },
        options: {
            template: () => "<ul class='k-list k-reset'></ul>"
        },
        _list: function() {
            var ul = this.dialog().element.find("ul");
            var fonts = this.options.options;
            var defaultFont = this.options.default;

            this.list = new kendo.ui.StaticList(ul, {
                dataSource: new kendo.data.DataSource({ data: fonts }),
                template: (data) => kendo.htmlEncode(data),
                value: defaultFont,
                change: this.apply.bind(this)
            });

            this.list.dataSource.fetch();
        },
        apply: function(e) {
            SpreadsheetDialog.fn.apply.call(this);

            this.trigger("action", {
                command: "PropertyChangeCommand",
                options: {
                    property: "fontFamily",
                    value: e.sender.value()[0]
                }
            });
        }
    });

    kendo.spreadsheet.dialogs.register("fontFamily", FontFamilyDialog);

    var FontSizeDialog = SpreadsheetDialog.extend({
        init: function(options) {
            var messages = kendo.spreadsheet.messages.dialogs.fontSizeDialog || MESSAGES;

            SpreadsheetDialog.fn.init.call(this, $.extend({ title: messages.title }, options));

            this._list();
        },
        options: {
            template: () => "<ul class='k-list k-reset'></ul>"
        },
        _list: function() {
            var ul = this.dialog().element.find("ul");
            var sizes = this.options.options;
            var defaultSize = this.options.default;

            this.list = new kendo.ui.StaticList(ul, {
                dataSource: new kendo.data.DataSource({ data: sizes }),
                template: (data) => kendo.htmlEncode(data),
                value: defaultSize,
                change: this.apply.bind(this)
            });

            this.list.dataSource.fetch();
        },
        apply: function(e) {
            SpreadsheetDialog.fn.apply.call(this);

            this.trigger("action", {
                command: "PropertyChangeCommand",
                options: {
                    property: "fontSize",
                    value: kendo.parseInt(e.sender.value()[0])
                }
            });
        }
    });

    kendo.spreadsheet.dialogs.register("fontSize", FontSizeDialog);

    var BordersDialog = SpreadsheetDialog.extend({
        init: function(options) {
            var messages = kendo.spreadsheet.messages.dialogs.bordersDialog || MESSAGES;

            SpreadsheetDialog.fn.init.call(this, $.extend({ title: messages.title }, options));

            this.element = this.dialog().element;
            this._borderPalette();

            this.viewModel = kendo.observable({
                apply: this.apply.bind(this),
                close: this.close.bind(this)
            });

            kendo.bind(this.element.find(".k-actions"), this.viewModel);
        },
        options: {
            template: (data) => {
                let $kendoOutput;
                $kendoOutput = `<div></div>
<div class='k-actions'><button class='k-button k-button-md k-rounded-md k-button-solid k-button-solid-primary'
        data-${kendo.htmlEncode(data.ns)}bind='click: apply'><span
            class='k-button-text'>${kendo.htmlEncode(data.messages.apply)}</span></button><button
        class='k-button k-button-md k-rounded-md k-button-solid k-button-solid-base'
        data-${kendo.htmlEncode(data.ns)}bind='click: close'><span
            class='k-button-text'>${kendo.htmlEncode(data.messages.cancel)}</span></button></div>`;
                return $kendoOutput;
            }
        },
        apply: function() {
            SpreadsheetDialog.fn.apply.call(this);

            var state = this.borderPalette.value();

            if (state.color && state.type) {
                this.trigger("action", {
                    command: "BorderChangeCommand",
                    options: {
                        border: state.type,
                        style: { size: 1, color: state.color }
                    }
                });
            }
        },
        _borderPalette: function() {
            var element = this.dialog().element.find("div").first();

            this.borderPalette = new kendo.spreadsheet.BorderPalette(element, {
                change: this.value.bind(this)
            });
        },
        value: function(state) {
            if (state === undefined) {
                return this._state;
            } else {
                this._state = state;
            }
        }
    });

    kendo.spreadsheet.dialogs.register("borders", BordersDialog);

    var ColorChooser = SpreadsheetDialog.extend({
        init: function(options) {
            SpreadsheetDialog.fn.init.call(this, options);

            this.element = this.dialog().element;
            this.property = options.property;
            this.options.title = options.title;

            this.viewModel = kendo.observable({
                apply: this.apply.bind(this),
                close: this.close.bind(this)
            });

            kendo.bind(this.element.find(".k-actions"), this.viewModel);
        },
        options: {
            template: (data) => {
                let $kendoOutput;
                $kendoOutput = `<div></div>
<div class='k-actions'><button class='k-button k-button-md k-rounded-md k-button-solid k-button-solid-primary'
        data-${kendo.htmlEncode(data.ns)}bind='click: apply'><span
            class='k-button-text'>${kendo.htmlEncode(data.messages.apply)}</span></button><button
        class='k-button k-button-md k-rounded-md k-button-solid k-button-solid-base'
        data-${kendo.htmlEncode(data.ns)}bind='click: close'><span
            class='k-button-text'>${kendo.htmlEncode(data.messages.cancel)}</span></button></div>`;
                return $kendoOutput;
            }
        },
        apply: function() {
            SpreadsheetDialog.fn.apply.call(this);

            this.trigger("action", {
                command: "PropertyChangeCommand",
                options: {
                    property: this.property,
                    value: this.value()
                }
            });
        },
        value: function(e) {
            if (e === undefined) {
                return this._value;
            } else {
                this._value = e.value;
            }
        }
    });

    var ColorPickerDialog = ColorChooser.extend({
        init: function(options) {
            options.width = 177;
            ColorChooser.fn.init.call(this, options);
            this._colorPalette();
        },
        _colorPalette: function() {
            var element = this.dialog().element.find("div").first();
            this.colorPalette = element.kendoColorPalette({
                palette: [ //metro palette
                    "#ffffff", "#000000", "#d6ecff", "#4e5b6f", "#7fd13b", "#ea157a", "#feb80a", "#00addc", "#738ac8", "#1ab39f",
                    "#f2f2f2", "#7f7f7f", "#a7d6ff", "#d9dde4", "#e5f5d7", "#fad0e4", "#fef0cd", "#c5f2ff", "#e2e7f4", "#c9f7f1",
                    "#d8d8d8", "#595959", "#60b5ff", "#b3bcca", "#cbecb0", "#f6a1c9", "#fee29c", "#8be6ff", "#c7d0e9", "#94efe3",
                    "#bfbfbf", "#3f3f3f", "#007dea", "#8d9baf", "#b2e389", "#f272af", "#fed46b", "#51d9ff", "#aab8de", "#5fe7d5",
                    "#a5a5a5", "#262626", "#003e75", "#3a4453", "#5ea226", "#af0f5b", "#c58c00", "#0081a5", "#425ea9", "#138677",
                    "#7f7f7f", "#0c0c0c", "#00192e", "#272d37", "#3f6c19", "#750a3d", "#835d00", "#00566e", "#2c3f71", "#0c594f"
                ],
                change: this.value.bind(this)
            }).data("kendoColorPalette");
        }
    });

    kendo.spreadsheet.dialogs.register("colorPicker", ColorPickerDialog);

    var CustomColorDialog = ColorChooser.extend({
        init: function(options) {
            options.width = 268;
            ColorChooser.fn.init.call(this, options);
            this.dialog().setOptions({ animation: false });
            this.dialog().one("activate", this._colorPicker.bind(this));
        },
        _colorPicker: function() {
            var element = this.dialog().element.find("div").first();
            this.colorPicker = element.kendoFlatColorPicker({
                change: this.value.bind(this)
            }).data("kendoFlatColorPicker");
        }
    });

    kendo.spreadsheet.dialogs.register("customColor", CustomColorDialog);

    var AlignmentDialog = SpreadsheetDialog.extend({
        init: function(options) {
            var messages = kendo.spreadsheet.messages.dialogs.alignmentDialog || MESSAGES;
            var defaultOptions = {
                title: messages.title,
                buttons: [
                    { property: "textAlign",     value: "left",    iconClass: "align-left",   text: messages.buttons.justifyLeft },
                    { property: "textAlign",     value: "center",  iconClass: "align-center", text: messages.buttons.justifyCenter },
                    { property: "textAlign",     value: "right",   iconClass: "align-right",  text: messages.buttons.justifyRight },
                    { property: "textAlign",     value: "justify", iconClass: "align-justify",   text: messages.buttons.justifyFull },
                    { property: "verticalAlign", value: "top",     iconClass: "align-top",      text: messages.buttons.alignTop },
                    { property: "verticalAlign", value: "center",  iconClass: "align-middle",   text: messages.buttons.alignMiddle },
                    { property: "verticalAlign", value: "bottom",  iconClass: "align-bottom",   text: messages.buttons.alignBottom }
                ]
            };

            SpreadsheetDialog.fn.init.call(this, $.extend(defaultOptions, options));

            this._list();
        },
        options: {
            template: () => "<ul class='k-list k-reset'></ul>"
        },
        _list: function() {
            var ul = this.dialog().element.find("ul");

            this.list = new kendo.ui.StaticList(ul, {
                dataSource: new kendo.data.DataSource({ data: this.options.buttons }),
                template: (data) => `<a role='button' title='${data.text}' data-property='${data.property}' data-value='${data.value}'>
                                ${kendo.ui.icon(data.iconClass)} ${data.text}
                           </a>`,
                change: this.apply.bind(this)
            });

            this.list.dataSource.fetch();
        },
        apply: function(e) {
            var dataItem = e.sender.value()[0];
            SpreadsheetDialog.fn.apply.call(this);

            this.trigger("action", {
                command: "PropertyChangeCommand",
                options: {
                    property: dataItem.property,
                    value: dataItem.value
                }
            });
        }
    });

    kendo.spreadsheet.dialogs.register("alignment", AlignmentDialog);

    var MergeDialog = SpreadsheetDialog.extend({
        init: function(options) {
            var messages = kendo.spreadsheet.messages.dialogs.mergeDialog || MESSAGES;
            var defaultOptions = {
                title: messages.title,
                buttons: [
                    { value: "cells",        iconClass: "cells-merge",        text: messages.buttons.mergeCells },
                    { value: "horizontally", iconClass: "cells-merge-horizontally", text: messages.buttons.mergeHorizontally },
                    { value: "vertically",   iconClass: "cells-merge-vertically",   text: messages.buttons.mergeVertically },
                    { value: "unmerge",      iconClass: "table-unmerge",      text: messages.buttons.unmerge }
                ]
            };

            SpreadsheetDialog.fn.init.call(this, $.extend(defaultOptions, options));

            this._list();
        },
        options: {
            template: () => "<ul class='k-list k-reset'></ul>"
        },
        _list: function() {
            var ul = this.dialog().element.find("ul");

            this.list = new kendo.ui.StaticList(ul, {
                dataSource: new kendo.data.DataSource({ data: this.options.buttons }),
                template: (data) => `<a role='button' title='${data.text}' data-value='${data.value}'>` +
                            `${kendo.ui.icon(data.iconClass)}${data.text}` +
                          "</a>",
                change: this.apply.bind(this)
            });

            this.list.dataSource.fetch();
        },
        apply: function(e) {
            var dataItem = e.sender.value()[0];
            SpreadsheetDialog.fn.apply.call(this);

            this.trigger("action", {
                command: "MergeCellCommand",
                options: {
                    value: dataItem.value
                }
            });
        }
    });

    kendo.spreadsheet.dialogs.register("merge", MergeDialog);

    var FreezeDialog = SpreadsheetDialog.extend({
        init: function(options) {
            var messages = kendo.spreadsheet.messages.dialogs.freezeDialog || MESSAGES;
            var defaultOptions = {
                title: messages.title,
                buttons: [
                    { value: "panes",    iconClass: "pane-freeze",  text: messages.buttons.freezePanes },
                    { value: "rows",     iconClass: "row-freeze",    text: messages.buttons.freezeRows },
                    { value: "columns",  iconClass: "column-freeze",    text: messages.buttons.freezeColumns },
                    { value: "unfreeze", iconClass: "table-unmerge", text: messages.buttons.unfreeze }
                ]
            };

            SpreadsheetDialog.fn.init.call(this, $.extend(defaultOptions, options));

            this._list();
        },
        options: {
            template: () => "<ul class='k-list k-reset'></ul>"
        },
        _list: function() {
            var ul = this.dialog().element.find("ul");

            this.list = new kendo.ui.StaticList(ul, {
                dataSource: new kendo.data.DataSource({ data: this.options.buttons }),
                template: (data) => `<a role='button' title='${data.text}' data-value='${data.value}'>` +
                            `${kendo.ui.icon(data.iconClass)}${data.text}` +
                          "</a>",
                change: this.apply.bind(this)
            });

            this.list.dataSource.fetch();
        },
        apply: function(e) {
            var dataItem = e.sender.value()[0];
            SpreadsheetDialog.fn.apply.call(this);

            this.trigger("action", {
                command: "FreezePanesCommand",
                options: {
                    value: dataItem.value
                }
            });
        }
    });

    kendo.spreadsheet.dialogs.register("freeze", FreezeDialog);

    var ValidationViewModel = kendo.spreadsheet.ValidationCellsViewModel = ObservableObject.extend({
        init: function(options) {
            ObservableObject.fn.init.call(this, options);

            this.bind("change", (function(e) {

                if (e.field === "criterion") {
                    this.reset();

                    if (this.criterion === "custom" || this.criterion === "list") {
                        this.setHintMessageTemplate();
                    }
                }

                if (e.field === "comparer") {
                    this.setHintMessageTemplate();
                }

                if ((e.field == "hintMessage" || e.field == "hintTitle") && !this._mute) {
                    this.shouldBuild = false;
                }

                if ((e.field == "from" || e.field == "to" || e.field == "hintMessageTemplate" || e.field == "type") && this.shouldBuild) {
                    this.buildMessages();
                }
            }).bind(this));

            this.reset();
        },
        buildMessages: function() {
            this._mute = true;
            this.set("hintTitle", this.hintTitleTemplate ? kendo.format(this.hintTitleTemplate, this.type) : "");
            this.set("hintMessage", this.hintMessageTemplate ? kendo.format(this.hintMessageTemplate, this.from, this.to) : "");
            this._mute = false;
        },
        reset: function() {
            this.setComparers();
            this.set("comparer", this.comparers[0].type);
            this.set("from", null);
            this.set("to", null);

            this.set("useCustomMessages", false);

            this.shouldBuild = true;

            this.hintTitleTemplate = this.defaultHintTitle;
            this.buildMessages();
        },
        //TODO: refactor
        setComparers: function() {
            var all = this.defaultComparers;
            var comparers = [];

            if (this.criterion === "text") {
                var text_comparers = ["equalTo", "notEqualTo"];
                for (var idx = 0; idx < all.length; idx++) {
                    if (text_comparers[0] == all[idx].type) {
                        comparers.push(all[idx]);
                        text_comparers.shift();
                    }
                }
            } else {
                comparers = all.slice();
            }

            this.set("comparers", comparers);
        },
        setHintMessageTemplate: function() {
           if (this.criterion !== "custom" && this.criterion !== "list") {
               this.set("hintMessageTemplate", kendo.format(this.defaultHintMessage, this.criterion, this.comparerMessages[this.comparer]));
           } else {
               this.set("hintMessageTemplate", "");
               this.set("hintMessage", "");
           }
        },
        isAny: function() {
            return this.get("criterion") === "any";
        },
        isNumber: function() {
            return this.get("criterion") === "number";
        },
        showToForNumber: function() {
            return this.showTo() && this.isNumber();
        },
        showToForDate: function() {
            return this.showTo() && this.isDate();
        },
        isText: function() {
            return this.get("criterion") === "text";
        },
        isDate: function() {
            return this.get("criterion") === "date";
        },
        isList: function() {
            return this.get("criterion") === "list";
        },
        isCustom: function() {
            return this.get("criterion") === "custom";
        },
        showRemove: function() {
            return this.get("hasValidation");
        },
        showTo: function() {
            return this.get("comparer") == "between" || this.get("comparer") == "notBetween";
        },
        update: function(validation) {
            this.set("hasValidation", !!validation);

            if (validation) {
                this.fromValidationObject(validation);
            }
        },
        fromValidationObject: function(validation) {
            this.set("criterion", validation.dataType);
            this.set("comparer", validation.comparerType);
            this.set("from", validation.from);
            this.set("to", validation.to);
            this.set("type", validation.type);
            this.set("ignoreBlank", validation.allowNulls);
            this.set("showButton", validation.showButton);

            if (validation.messageTemplate || validation.titleTemplate) {
                this.hintMessageTemplate = validation.messageTemplate;
                this.hintMessage = validation.messageTemplate;
                this.hintTitleTemplate = validation.titleTemplate;
                this.hintTitle = validation.titleTemplate;
                this.useCustomMessages = true;
                this.buildMessages();
            } else {
                this.useCustomMessages = false;
            }
        },
        toValidationObject: function() {
            if (this.criterion === "any") {
                return null;
            }

            var options = {
                type: this.type,
                dataType: this.criterion,
                comparerType: this.comparer,
                from: this.from,
                to: this.to,
                allowNulls: this.ignoreBlank,
                showButton: this.showButton
            };

            if (this.useCustomMessages) {
                options.messageTemplate = this.shouldBuild ? this.hintMessageTemplate : this.hintMessage;
                options.titleTemplate = this.hintTitle;
            }

            return options;
        }
    });

    var ValidationDialog = SpreadsheetDialog.extend({
        init: function(options) {
            var messages = kendo.spreadsheet.messages.dialogs.validationDialog || MESSAGES;
            var defaultOptions = {
                title: messages.title,
                hintMessage: messages.hintMessage,
                hintTitle: messages.hintTitle,
                criteria: [
                    { type: "any", name: messages.criteria.any },
                    { type: "number", name: messages.criteria.number },
                    { type: "text", name: messages.criteria.text },
                    { type: "date", name: messages.criteria.date },
                    { type: "custom", name: messages.criteria.custom },
                    { type: "list", name: messages.criteria.list }
                ],
                comparers: [
                    { type: "greaterThan", name: messages.comparers.greaterThan },
                    { type: "lessThan",    name: messages.comparers.lessThan },
                    { type: "between",     name: messages.comparers.between },
                    { type: "notBetween",  name: messages.comparers.notBetween },
                    { type: "equalTo",     name: messages.comparers.equalTo },
                    { type: "notEqualTo",  name: messages.comparers.notEqualTo },
                    { type: "greaterThanOrEqualTo", name: messages.comparers.greaterThanOrEqualTo },
                    { type: "lessThanOrEqualTo",    name: messages.comparers.lessThanOrEqualTo }
                ],
                comparerMessages: messages.comparerMessages
            };

            SpreadsheetDialog.fn.init.call(this, $.extend(defaultOptions, options));
        },
        options: {
            width: 450,
            criterion: "any",
            type: "reject",
            ignoreBlank: true,
            showButton: true,
            useCustomMessages: false,
            errorTemplate: (data) =>
                `<div class="k-tooltip k-tooltip-error k-validator-tooltip">
                    ${kendo.ui.icon({ icon: "exclamation-circle", iconClass: "k-tooltip-icon" })}
                    <span class="k-tooltip-content">${data.message}</span>
                    <span class="k-callout k-callout-n"></span>
                </div>`,
            template: (data) => {
                let $kendoOutput;
                $kendoOutput = `<div class="k-edit-form-container">
                    <div class="k-edit-label"><label for="criteria">${kendo.htmlEncode(data.messages.validationDialog.labels.criteria)}:</label></div>
                    <div class="k-edit-field"><select id="criteria" data-${kendo.htmlEncode(data.ns)}role="dropdownlist" title="${kendo.htmlEncode(data.messages.validationDialog.labels.criteria)}" data-${kendo.htmlEncode(data.ns)}text-field="name" data-${kendo.htmlEncode(data.ns)}value-field="type" data-${kendo.htmlEncode(data.ns)}bind="value: criterion, source: criteria"></select></div>
                    <div data-${kendo.htmlEncode(data.ns)}bind="visible: isNumber">
                    <div class="k-edit-label"><label for="number-comparer">${kendo.htmlEncode(data.messages.validationDialog.labels.comparer)}:</label></div>
                    <div class="k-edit-field"><select id="number-comparer" data-${kendo.htmlEncode(data.ns)}role="dropdownlist" title="${kendo.htmlEncode(data.messages.validationDialog.labels.comparer)}" data-${kendo.htmlEncode(data.ns)}text-field="name" data-${kendo.htmlEncode(data.ns)}value-field="type" data-${kendo.htmlEncode(data.ns)}bind="value: comparer, source: comparers"></select></div>
                    <div class="k-edit-label"><label for="comparer-min">${kendo.htmlEncode(data.messages.validationDialog.labels.min)}:</label></div>
                    <div class="k-edit-field"><span class="k-textbox k-input k-input-md k-rounded-md k-input-solid"><input id="comparer-min" name="${kendo.htmlEncode(data.messages.validationDialog.labels.min)}" title="${kendo.htmlEncode(data.messages.validationDialog.labels.min)}" placeholder="e.g. 10" class="k-input-inner" data-${kendo.htmlEncode(data.ns)}bind="value: from, enabled: isNumber" required="required" /></span></div>
                    <div data-${kendo.htmlEncode(data.ns)}bind="visible: showTo">
                    <div class="k-edit-label"><label for="comparer-max">${kendo.htmlEncode(data.messages.validationDialog.labels.max)}:</label></div>
                    <div class="k-edit-field"><span class="k-textbox k-input k-input-md k-rounded-md k-input-solid"><input id="comparer-max" name="${kendo.htmlEncode(data.messages.validationDialog.labels.max)}" title="${kendo.htmlEncode(data.messages.validationDialog.labels.max)}" placeholder="e.g. 100" class="k-input-inner" data-${kendo.htmlEncode(data.ns)}bind="value: to, enabled: showToForNumber" required="required" /></span></div>
                    </div>
                    </div><div data-${kendo.htmlEncode(data.ns)}bind="visible: isText">
                    <div class="k-edit-label"><label for="text-comparer">${kendo.htmlEncode(data.messages.validationDialog.labels.comparer)}:</label></div>
                    <div class="k-edit-field"><select id="text-comparer" data-${kendo.htmlEncode(data.ns)}role="dropdownlist" title="${kendo.htmlEncode(data.messages.validationDialog.labels.comparer)}" data-${kendo.htmlEncode(data.ns)}text-field="name" data-${kendo.htmlEncode(data.ns)}value-field="type" data-${kendo.htmlEncode(data.ns)}bind="value: comparer, source: comparers"></select></div>
                    <div class="k-edit-label"><label for="text-comparer-value">${kendo.htmlEncode(data.messages.validationDialog.labels.value)}:</label></div>
                    <div class="k-edit-field"><span class="k-textbox k-input k-input-md k-rounded-md k-input-solid"><input id="text-comparer-value" name="${kendo.htmlEncode(data.messages.validationDialog.labels.value)}" title="${kendo.htmlEncode(data.messages.validationDialog.labels.value)}" class="k-input-inner" data-${kendo.htmlEncode(data.ns)}bind="value: from, enabled: isText" required="required" /></span></div>
                    </div><div data-${kendo.htmlEncode(data.ns)}bind="visible: isDate">
                    <div class="k-edit-label"><label for="date-comparer">${kendo.htmlEncode(data.messages.validationDialog.labels.comparer)}:</label></div>
                    <div class="k-edit-field"><select id="date-comparer" data-${kendo.htmlEncode(data.ns)}role="dropdownlist" title="${kendo.htmlEncode(data.messages.validationDialog.labels.comparer)}" data-${kendo.htmlEncode(data.ns)}text-field="name" data-${kendo.htmlEncode(data.ns)}value-field="type" data-${kendo.htmlEncode(data.ns)}bind="value: comparer, source: comparers"></select></div>
                    <div class="k-edit-label"><label for="date-comparer-start">${kendo.htmlEncode(data.messages.validationDialog.labels.start)}:</label></div>
                    <div class="k-edit-field"><span class="k-textbox k-input k-input-md k-rounded-md k-input-solid"><input id="date-comparer-start" name="${kendo.htmlEncode(data.messages.validationDialog.labels.start)}" title="${kendo.htmlEncode(data.messages.validationDialog.labels.start)}" class="k-input-inner" data-${kendo.htmlEncode(data.ns)}bind="value: from, enabled: isDate" required="required" /></span></div>
                    <div data-${kendo.htmlEncode(data.ns)}bind="visible: showTo">
                    <div class="k-edit-label"><label for="date-comparer-end">${kendo.htmlEncode(data.messages.validationDialog.labels.end)}:</label></div>
                    <div class="k-edit-field"><span class="k-textbox k-input k-input-md k-rounded-md k-input-solid"><input id="date-comparer-end" name="${kendo.htmlEncode(data.messages.validationDialog.labels.end)}" title="${kendo.htmlEncode(data.messages.validationDialog.labels.end)}" class="k-input-inner" data-${kendo.htmlEncode(data.ns)}bind="value: to, enabled: showToForDate" required="required" /></span></div>
                    </div></div><div data-${kendo.htmlEncode(data.ns)}bind="visible: isCustom">
                    <div class="k-edit-label"><label for="custom-comparer-value">${kendo.htmlEncode(data.messages.validationDialog.labels.value)}:</label></div>
                    <div class="k-edit-field"><span class="k-textbox k-input k-input-md k-rounded-md k-input-solid"><input id="custom-comparer-value" name="${kendo.htmlEncode(data.messages.validationDialog.labels.value)}" title="${kendo.htmlEncode(data.messages.validationDialog.labels.value)}" class="k-input-inner" data-${kendo.htmlEncode(data.ns)}bind="value: from, enabled: isCustom" required="required" /></span></div>
                    </div><div data-${kendo.htmlEncode(data.ns)}bind="visible: isList">
                    <div class="k-edit-label"><label for="list-comparer-value">${kendo.htmlEncode(data.messages.validationDialog.labels.value)}:</label></div>
                    <div class="k-edit-field"><span class="k-textbox k-input k-input-md k-rounded-md k-input-solid"><input id="list-comparer-value" name="${kendo.htmlEncode(data.messages.validationDialog.labels.value)}" title="${kendo.htmlEncode(data.messages.validationDialog.labels.value)}" class="k-input-inner" data-${kendo.htmlEncode(data.ns)}bind="value: from, enabled: isList" required="required" /></span></div>
                    </div><div data-${kendo.htmlEncode(data.ns)}bind="visible: isList">
                    <div class="k-edit-field"><input type="checkbox" name="showButton" id="listShowButton" class="k-checkbox k-checkbox-md k-rounded-md" data-${kendo.htmlEncode(data.ns)}bind="checked: showButton" /><label for="listShowButton" class="k-checkbox-label"> ${kendo.htmlEncode(data.messages.validationDialog.labels.showListButton)}</label></div>
                    </div><div data-${kendo.htmlEncode(data.ns)}bind="visible: isDate">
                    <div class="k-edit-field"><input type="checkbox" name="showButton" id="dateShowButton" class="k-checkbox k-checkbox-md k-rounded-md" data-${kendo.htmlEncode(data.ns)}bind="checked: showButton" /><label for="dateShowButton" class="k-checkbox-label"> ${kendo.htmlEncode(data.messages.validationDialog.labels.showCalendarButton)}</label></div>
                    </div><div data-${kendo.htmlEncode(data.ns)}bind="invisible: isAny">
                    <div class="k-edit-field"><input type="checkbox" title="${kendo.htmlEncode(data.messages.validationDialog.labels.ignoreBlank)}" name="ignoreBlank" id="ignoreBlank" class="k-checkbox k-checkbox-md k-rounded-md" data-${kendo.htmlEncode(data.ns)}bind="checked: ignoreBlank" /><label for="ignoreBlank" class="k-checkbox-label"> ${kendo.htmlEncode(data.messages.validationDialog.labels.ignoreBlank)}</label></div>
                    </div><div data-${kendo.htmlEncode(data.ns)}bind="invisible: isAny">
                    <div class="k-hr"></div>
                    <div class="k-edit-label"><label>${kendo.htmlEncode(data.messages.validationDialog.labels.onInvalidData)}:</label></div>
                    <div class="k-edit-field"><input type="radio" title="${kendo.htmlEncode(data.messages.validationDialog.labels.rejectInput)}" id="validationTypeReject" name="validationType" value="reject" data-${kendo.htmlEncode(data.ns)}bind="checked: type" class="k-radio k-radio-md" /><label for="validationTypeReject" class="k-radio-label">${kendo.htmlEncode(data.messages.validationDialog.labels.rejectInput)}</label> <input type="radio" title="${kendo.htmlEncode(data.messages.validationDialog.labels.showWarning)}" id="validationTypeWarning" name="validationType" value="warning" data-${kendo.htmlEncode(data.ns)}bind="checked: type" class="k-radio k-radio-md" /><label for="validationTypeWarning" class="k-radio-label">${kendo.htmlEncode(data.messages.validationDialog.labels.showWarning)}</label></div>
                    </div><div data-${kendo.htmlEncode(data.ns)}bind="invisible: isAny" class="hint-wrapper">
                    <div class="k-edit-field"><input type="checkbox" title="${kendo.htmlEncode(data.messages.validationDialog.labels.showHint)}" name="useCustomMessages" id="useCustomMessages" class="k-checkbox k-checkbox-md k-rounded-md" data-${kendo.htmlEncode(data.ns)}bind="checked: useCustomMessages" /><label class="k-checkbox-label" for="useCustomMessages"> ${kendo.htmlEncode(data.messages.validationDialog.labels.showHint)}</label></div>
                    <div data-${kendo.htmlEncode(data.ns)}bind="visible: useCustomMessages">
                    <div class="k-edit-label"><label for="hint-title">${kendo.htmlEncode(data.messages.validationDialog.labels.hintTitle)}:</label></div>
                    <div class="k-edit-field"><span class="k-textbox k-input k-input-md k-rounded-md k-input-solid"><input id="hint-title" name="hint-title" class="k-input-inner" title="${kendo.htmlEncode(data.messages.validationDialog.labels.hintTitle)}" placeholder="${kendo.htmlEncode(data.messages.validationDialog.placeholders.typeTitle)}" data-${kendo.htmlEncode(data.ns)}bind="value: hintTitle" /></span></div>
                    <div class="k-edit-label"><label for="hint-message">${kendo.htmlEncode(data.messages.validationDialog.labels.hintMessage)}:</label></div>
                    <div class="k-edit-field"><span class="k-textbox k-input k-input-md k-rounded-md k-input-solid"><input id="hint-message" class="k-input-inner" title="${kendo.htmlEncode(data.messages.validationDialog.labels.hintMessage)}" placeholder="${kendo.htmlEncode(data.messages.validationDialog.placeholders.typeMessage)}" data-${kendo.htmlEncode(data.ns)}bind="value: hintMessage" /></span></div>
                    </div></div>
                    <div class="k-actions"><button class="k-button k-button-md k-rounded-md k-button-solid k-button-solid-base" data-${kendo.htmlEncode(data.ns)}bind="visible: showRemove, click: remove"><span class="k-button-text">${kendo.htmlEncode(data.messages.remove)}</span></button><button class="k-button k-button-md k-rounded-md k-button-solid k-button-solid-primary" data-${kendo.htmlEncode(data.ns)}bind="click: apply"><span class="k-button-text">${kendo.htmlEncode(data.messages.apply)}</span></button><button class="k-button k-button-md k-rounded-md k-button-solid k-button-solid-base" data-${kendo.htmlEncode(data.ns)}bind="click: close"><span class="k-button-text">${kendo.htmlEncode(data.messages.cancel)}</span></button></div>
                    </div>`;
                return $kendoOutput;
            }
        },
        open: function(range) {
            var options = this.options;
            var element;

            this.viewModel = new ValidationViewModel({
                type: options.type,
                defaultHintMessage: options.hintMessage,
                defaultHintTitle: options.hintTitle,
                defaultComparers: options.comparers.slice(0),
                comparerMessages: options.comparerMessages,
                criteria: options.criteria.slice(0),
                criterion: options.criterion,
                ignoreBlank: options.ignoreBlank,
                showButton: options.showButton,
                apply: this.apply.bind(this),
                close: this.close.bind(this),
                remove: this.remove.bind(this)
            });

            this.viewModel.update(range.validation());

            SpreadsheetDialog.fn.open.call(this);

            element = this.dialog().element;

            if (this.validatable) {
                this.validatable.destroy();
            }

            kendo.bind(element, this.viewModel);

            this.validatable = new kendo.ui.Validator(element.find(".k-edit-form-container"), {
                validateOnBlur: false,
                errorTemplate: this.options.errorTemplate || undefined
            });
        },
        apply: function() {

            if (this.validatable.validate()) {
                SpreadsheetDialog.fn.apply.call(this);

                this.trigger("action", {
                    command: "EditValidationCommand",
                    options: {
                        value: this.viewModel.toValidationObject()
                    }
                });
            }
        },
        remove: function() {
            this.viewModel.set("criterion", "any");
            this.apply();
        }
    });

    kendo.spreadsheet.dialogs.register("validation", ValidationDialog);
    kendo.spreadsheet.dialogs.ValidationDialog = ValidationDialog;

    function PDF_PAPER_SIZE(size) {
        return {
            value: size,
            text: TEXT("exportAsDialog.pdf.paper." + size)
        };
    }

    var ExportAsDialog = SpreadsheetDialog.extend({
        init: function(options) {
            SpreadsheetDialog.fn.init.call(this, options);
            options = this.options;

            this.viewModel = kendo.observable({
                title: options.title,
                name: options.name,
                extension: options.extension,
                fileFormats:options.fileFormats,
                excel: options.excelExport,
                pdf: {
                    proxyURL: options.pdfExport.proxyURL,
                    forceProxy: options.pdfExport.forceProxy,
                    title: options.pdfExport.title,
                    author: options.pdfExport.author,
                    autoPrint: options.pdfExport.autoPrint,
                    subject: options.pdfExport.subject,
                    keywords: options.pdfExport.keywords,
                    creator: options.pdfExport.creator,
                    date: options.pdfExport.date,

                    fitWidth: options.pdf.fitWidth,
                    area: options.pdf.area,
                    areas: options.pdf.areas,
                    paperSize: options.pdf.paperSize,
                    paperSizes: options.pdf.paperSizes,
                    margin: options.pdf.margin,
                    margins: options.pdf.margins,
                    landscape: options.pdf.landscape,
                    guidelines: options.pdf.guidelines,
                    hCenter: options.pdf.hCenter,
                    vCenter: options.pdf.vCenter
                },
                apply: this.apply.bind(this),
                close: this.close.bind(this)
            });

            var dialog = this.dialog();
            this.viewModel.bind("change", function(e) {
                if (e.field === "extension") {
                    this.set("showPdfOptions", this.extension === ".pdf" ? true : false);
                    dialog.center();
                }
            });

            kendo.bind(dialog.element, this.viewModel);
        },
        options: {
            title: TEXT("exportAsDialog.title", "Export..."),
            name: TEXT("exportAsDialog.defaultFileName", "Workbook"),
            extension: ".xlsx",
            fileFormats: [{
                description: TEXT("exportAsDialog.xlsx.description", "Excel Workbook (.xlsx)"),
                extension: ".xlsx"
            }, {
                description: TEXT("exportAsDialog.pdf.description", "Portable Document Format (.pdf)"),
                extension: ".pdf"
            }],
            pdf: {
                fitWidth: true,
                area: "workbook",
                areas: [{
                    area: "workbook",
                    text: TEXT("exportAsDialog.pdf.area.workbook", "Entire Workbook")
                },{
                    area: "sheet",
                    text: TEXT("exportAsDialog.pdf.area.sheet", "Active Sheet")
                },{
                    area: "selection",
                    text: TEXT("exportAsDialog.pdf.area.selection", "Selection")
                }],
                paperSize: "a4",
                paperSizes: [
                    "a2", "a3", "a4", "a5", "b3", "b4", "b5", "folio", "legal", "letter", "tabloid", "executive"
                ].map(PDF_PAPER_SIZE),
                margin: {bottom: "0.75in", left: "0.7in", right: "0.7in", top: "0.75in"},
                margins: [
                    { value: { bottom: "0.75in", left: "0.7in", right: "0.7in", top: "0.75in" },
                      text: TEXT("exportAsDialog.pdf.margin.normal", "Normal")
                    },
                    { value: { bottom: "0.75in", left: "0.25in", right: "0.25in", top: "0.75in" },
                      text: TEXT("exportAsDialog.pdf.margin.narrow", "Narrow")
                    },
                    { value: { bottom: "1in", left: "1in", right: "1in", top: "1in" },
                      text: TEXT("exportAsDialog.pdf.margin.wide", "Wide")
                    }
                ],
                landscape: true,
                guidelines: true,
                hCenter: true,
                vCenter: true
            },
            width: 520,
            template: (data) => {
                let $kendoOutput;
                $kendoOutput = `<div class='k-edit-label'><label id='name-label'>${kendo.htmlEncode(data.messages.exportAsDialog.labels.fileName)}:</label></div>
                    <div class='k-edit-field'><span class='k-textbox k-input k-input-md k-rounded-md k-input-solid'><input aria-labelledby='name-label' class='k-input-inner' data-${kendo.htmlEncode(data.ns)}bind='value: name' /></span></div>
                    <div >
                       <div class='k-edit-label'><label id='file-format-label'>${kendo.htmlEncode(data.messages.exportAsDialog.labels.saveAsType)}:</label></div>
                       <div class='k-edit-field'><select aria-labelledby='file-format-label' data-${kendo.htmlEncode(data.ns)}role='dropdownlist' class='k-file-format' data-${kendo.htmlEncode(data.ns)}text-field='description' data-${kendo.htmlEncode(data.ns)}value-field='extension' data-${kendo.htmlEncode(data.ns)}bind='value: extension, source: fileFormats'></select></div>
                    </div>
                    <div class='k-export-config' data-${kendo.htmlEncode(data.ns)}bind='visible: showPdfOptions'>
                    <hr class='k-hr' />
                    <div class='k-edit-label'><label id='export-area-label'>${kendo.htmlEncode(data.messages.exportAsDialog.labels.exportArea)}:</label></div>
                    <div class='k-edit-field'><select aria-labelledby='export-area-label' data-${kendo.htmlEncode(data.ns)}role='dropdownlist' class='k-file-format' data-${kendo.htmlEncode(data.ns)}text-field='text' data-${kendo.htmlEncode(data.ns)}value-field='area' data-${kendo.htmlEncode(data.ns)}bind='value: pdf.area, source: pdf.areas'></select></div>
                    <div class='k-edit-label'><label id='paper-size-label'>${kendo.htmlEncode(data.messages.exportAsDialog.labels.paperSize)}:</label></div>
                    <div class='k-edit-field'><select aria-labelledby='paper-size-label' data-${kendo.htmlEncode(data.ns)}role='dropdownlist' class='k-file-format' data-${kendo.htmlEncode(data.ns)}text-field='text' data-${kendo.htmlEncode(data.ns)}value-field='value' data-${kendo.htmlEncode(data.ns)}bind='value: pdf.paperSize, source: pdf.paperSizes'></select></div>
                    <div class='k-edit-label'><label id='margins-label'>${kendo.htmlEncode(data.messages.exportAsDialog.labels.margins)}:</label></div>
                    <div class='k-edit-field'><select aria-labelledby='margins-label' data-${kendo.htmlEncode(data.ns)}role='dropdownlist' class='k-file-format' data-${kendo.htmlEncode(data.ns)}value-primitive='true'data-${kendo.htmlEncode(data.ns)}text-field='text' data-${kendo.htmlEncode(data.ns)}value-field='value' data-${kendo.htmlEncode(data.ns)}bind='value: pdf.margin, source: pdf.margins'></select></div>
                    <div class='k-edit-label'><label>${kendo.htmlEncode(data.messages.exportAsDialog.labels.orientation)}:</label></div>
                    <div class='k-edit-field'>
                       <div class='k-button-group'>
                          <input type='radio' id='k-orientation-portrait' aria-label='orientation portrait' name='orientation' data-${kendo.htmlEncode(data.ns)}type='boolean' data-${kendo.htmlEncode(data.ns)}bind='checked: pdf.landscape' value='false' />
                          <label class='k-button k-button-md k-rounded-md k-button-solid k-button-solid-base k-icon-button k-group-start k-orientation-button' for='k-orientation-portrait'>
                          ${kendo.ui.icon({ icon: "file", iconClass: "k-button-icon" })}
                          </label>
                          <input type='radio' id='k-orientation-landscape' aria-label='orientation landscape' name='orientation' data-${kendo.htmlEncode(data.ns)}type='boolean' data-${kendo.htmlEncode(data.ns)}bind='checked: pdf.landscape' value='true' />
                          <label class='k-button k-button-md k-rounded-md k-button-solid k-button-solid-base k-icon-button k-group-end k-orientation-button' for='k-orientation-landscape'>
                          ${kendo.ui.icon({ icon: "file-horizontal", iconClass: "k-button-icon" })}
                          </label>
                       </div>
                    </div>
                    <div class='k-edit-label'><label>${kendo.htmlEncode(data.messages.exportAsDialog.labels.print)}:</label></div>
                    <div class='k-edit-field'><input class='k-checkbox k-checkbox-md k-rounded-md' id='guidelines' type='checkbox' data-${kendo.htmlEncode(data.ns)}bind='checked: pdf.guidelines'/><label class='k-checkbox-label' for='guidelines'>${kendo.htmlEncode(data.messages.exportAsDialog.labels.guidelines)}</label></div>
                    <div class='k-edit-label'><label>${kendo.htmlEncode(data.messages.exportAsDialog.labels.scale)}:</label></div>
                    <div class='k-edit-field'><input class='k-checkbox k-checkbox-md k-rounded-md' id='fitWidth' type='checkbox' data-${kendo.htmlEncode(data.ns)}bind='checked: pdf.fitWidth'/><label class='k-checkbox-label' for='fitWidth'>${kendo.htmlEncode(data.messages.exportAsDialog.labels.fit)}</label></div>
                    <div class='k-edit-label'><label>${kendo.htmlEncode(data.messages.exportAsDialog.labels.center)}:</label></div>
                    <div class='k-edit-field'><input class='k-checkbox k-checkbox-md k-rounded-md' id='hCenter' type='checkbox' data-${kendo.htmlEncode(data.ns)}bind='checked: pdf.hCenter'/><label class='k-checkbox-label' for='hCenter'>${kendo.htmlEncode(data.messages.exportAsDialog.labels.horizontally)}</label><input class='k-checkbox k-checkbox-md k-rounded-md' id='vCenter' type='checkbox' data-${kendo.htmlEncode(data.ns)}bind='checked: pdf.vCenter'/><label class='k-checkbox-label' for='vCenter'>${kendo.htmlEncode(data.messages.exportAsDialog.labels.vertically)}</label></div>
                    <div class='k-page-orientation'>
                       ${kendo.ui.icon($(`<span data-${data.ns}bind='invisible: pdf.landscape'></span>`), { icon: "file" })}
                       ${kendo.ui.icon($(`<span data-${data.ns}bind='visible: pdf.landscape'></span>`), { icon: "file-horizontal" })}
                    </div>
                    </div>
                    <div class='k-actions'><button class='k-button k-button-md k-rounded-md k-button-solid k-button-solid-primary' data-${kendo.htmlEncode(data.ns)}bind='click: apply'><span class='k-button-text'>${kendo.htmlEncode(data.messages.save)}</span></button><button class='k-button k-button-md k-rounded-md k-button-solid k-button-solid-base' data-${kendo.htmlEncode(data.ns)}bind='click: close'><span class='k-button-text'>${kendo.htmlEncode(data.messages.cancel)}</span></button></div>`;
                return $kendoOutput;
            }
        },
        apply: function() {
            SpreadsheetDialog.fn.apply.call(this);

            this.trigger("action", {
                command: "SaveAsCommand",
                options: this.viewModel
            });
        }
    });
    kendo.spreadsheet.dialogs.register("exportAs", ExportAsDialog);

    function basicErrorDialog(id, msg) {
        kendo.spreadsheet.dialogs.register(
            id,
            MessageDialog.extend({
                options: { messageId: msg }
            })
        );
    }

    basicErrorDialog("modifyMerged", "modifyMergedDialog.errorMessage");
    basicErrorDialog("rangeDisabled", "rangeDisabledDialog.errorMessage");
    basicErrorDialog("intersectsArray", "intersectsArrayDialog.errorMessage");
    basicErrorDialog("overflow", "overflowDialog.errorMessage");
    basicErrorDialog("unsupportedSelection", "unsupportedSelectionDialog.errorMessage");
    basicErrorDialog("incompatibleRanges", "incompatibleRangesDialog.errorMessage");
    basicErrorDialog("noFillDirection", "noFillDirectionDialog.errorMessage");
    basicErrorDialog("duplicateSheetName", "duplicateSheetNameDialog.errorMessage");

    var ImportErrorDialog = MessageDialog.extend({
        options: {
            width: 640,
            title: "Errors in import",
            template: (data) => {
                let $kendoOutput;
                $kendoOutput = `<div class='k-spreadsheet-message-content k-spreadsheet-import-errors'><div class='k--header-message'>We encountered ${data.errors.length} errors while reading this file.  Please be aware that some formulas might be missing, or contain invalid results.</div><div class='k--errors'><table><thead><tr><th>Context</th><th>Error message</th></tr></thead>`;
                for (let i = 0; i < errors.length; ++i) {
                    $kendoOutput += ``; let err = errors[i];                    $kendoOutput += `<tr><td>${kendo.htmlEncode(err.context)}</td><td>${kendo.htmlEncode(err.error)}</td></tr>`;
                }
                $kendoOutput += `</table></div></div><div class='k-actions'><button class='k-button k-button-md k-rounded-md k-button-solid k-button-solid-primary' data-${kendo.htmlEncode(data.ns)}bind='click: close'><span class='k-button-text'>${kendo.htmlEncode(data.messages.okText)}</span></button></div>`;
                return $kendoOutput;
            }
        }
    });

    kendo.spreadsheet.dialogs.register("importError", ImportErrorDialog);

    var UseKeyboardDialog = MessageDialog.extend({
        options: {
            title: TEXT("useKeyboardDialog.title", "Copying and pasting"),
            template: (data) => {
                let $kendoOutput;
                $kendoOutput = `${kendo.htmlEncode(data.messages.useKeyboardDialog.errorMessage)}
                <div>Ctrl+C ${kendo.htmlEncode(data.messages.useKeyboardDialog.labels.forCopy)}</div>
                <div>Ctrl+X ${kendo.htmlEncode(data.messages.useKeyboardDialog.labels.forCut)}</div>
                <div>Ctrl+V ${kendo.htmlEncode(data.messages.useKeyboardDialog.labels.forPaste)}</div>
                <div class="k-actions"><button class='k-button k-button-md k-rounded-md k-button-solid k-button-solid-primary'
                        data-${kendo.htmlEncode(data.ns)}bind='click: close'><span
                            class='k-button-text'>${data.messages.okText}</span></button></div>`;
                return $kendoOutput;
            }
        }
    });

    kendo.spreadsheet.dialogs.register("useKeyboard", UseKeyboardDialog);

    var HyperlinkDialog = SpreadsheetDialog.extend({
        options: {
            title: TEXT("linkDialog.title", "Hyperlink"),
            template: (data) => {
                let $kendoOutput;
                $kendoOutput = `<div class='k-edit-label'><label id='url-label'>${kendo.htmlEncode(data.messages.linkDialog.labels.url)}:</label></div>
<div class='k-edit-field'><span class='k-textbox k-input k-input-md k-rounded-md k-input-solid'><input
            class='k-input-inner' data-${kendo.htmlEncode(data.ns)}bind='value: url'
            title='${kendo.htmlEncode(data.messages.linkDialog.labels.url)}' aria-labelledby='url-label' /></span></div>
<div class='k-actions'><button class='k-button k-button-md k-rounded-md k-button-solid k-button-solid-base k-left'
        data-${kendo.htmlEncode(data.ns)}bind='click: remove'><span
            class='k-button-text'>${data.messages.linkDialog.labels.removeLink}</span></button><button
        class='k-button k-button-md k-rounded-md k-button-solid k-button-solid-primary'
        data-${kendo.htmlEncode(data.ns)}bind='click: apply'><span
            class='k-button-text'>${data.messages.okText}</span></button><button
        class='k-button k-button-md k-rounded-md k-button-solid k-button-solid-base'
        data-${kendo.htmlEncode(data.ns)}bind='click: cancel'><span
            class='k-button-text'>${data.messages.cancel}</span></button></div>`;
                return $kendoOutput;
            },
            autoFocus: false
        },
        open: function(range) {
            var self = this;
            SpreadsheetDialog.fn.open.apply(self, arguments);
            var element = self.dialog().element;
            var model = kendo.observable({
                url: range.link(),
                apply: function() {
                    if (!/\S/.test(model.url)) {
                        model.url = null;
                    }
                    self.trigger("action", {
                        command: "HyperlinkCommand",
                        options: {
                            link: model.url
                        }
                    });
                    self.close();
                },
                remove: function() {
                    model.url = null;
                    model.apply();
                },
                cancel: self.close.bind(self)
            });
            kendo.bind(element, model);

            // it would be nice if we could easily handle that in one
            // place for all dialogs, but it doesn't seem easily
            // doable.
            element.find("input")
                .trigger("focus")
                .on("keydown", function(ev){
                    if (ev.keyCode == 13 /*ENTER*/) {
                        model.url = $(this).val(); // there won't be a "change" event and the model wouldn't update :-\
                        ev.stopPropagation();
                        ev.preventDefault();
                        model.apply();
                    } else if (ev.keyCode == 27 /*ESC*/) {
                        ev.stopPropagation();
                        ev.preventDefault();
                        model.cancel();
                    }
                });
        }
    });

    kendo.spreadsheet.dialogs.register("hyperlink", HyperlinkDialog);

    var SheetRenameDialog = SpreadsheetDialog.extend({
        options: {
            title: TEXT("sheetRenameDialog.title", "Rename Sheet"),
            template: (data) => {
                let $kendoOutput;
                $kendoOutput = `<div class='k-edit-label'><label id='sheet-name-label'>${kendo.htmlEncode(data.messages.sheetRenameDialog.labels.text)}:</label></div>
<div class='k-edit-field'><span class='k-textbox k-input k-input-md k-rounded-md k-input-solid'><input
            class='k-input-inner' data-${kendo.htmlEncode(data.ns)}bind='value: sheetName'
            title='${kendo.htmlEncode(data.messages.sheetRenameDialog.labels.text)}' aria-labelledby='sheet-name-label' /></span></div>
<div class='k-actions'><button class='k-button k-button-md k-rounded-md k-button-solid k-button-solid-primary'
        data-${kendo.htmlEncode(data.ns)}bind='click: apply'><span
            class='k-button-text'>${data.messages.sheetRenameDialog.labels.rename}</span></button><button
        class='k-button k-button-md k-rounded-md k-button-solid k-button-solid-base'
        data-${kendo.htmlEncode(data.ns)}bind='click: cancel'><span
            class='k-button-text'>${data.messages.cancel}</span></button></div>`;
                return $kendoOutput;
            },
            autoFocus: false
        },
        open: function(range, args) {
            let sheet = range.sheet();
            let self = this;
            SpreadsheetDialog.fn.open.apply(self, arguments);
            let element = self.dialog().element;
            let model = kendo.observable({
                sheetName: args?._oldSheetName || sheet.name(),
                apply: function() {
                    self._newSheetName = model.sheetName;
                    self.close();
                },
                cancel: self.close.bind(self)
            });
            kendo.bind(element, model);

            element.find("input")
                .trigger("focus")
                .on("keydown", function(ev){
                    if (ev.keyCode == 13 /*ENTER*/) {
                        model.sheetName = $(this).val();
                        ev.stopPropagation();
                        ev.preventDefault();
                        model.apply();
                    } else if (ev.keyCode == 27 /*ESC*/) {
                        ev.stopPropagation();
                        ev.preventDefault();
                        model.cancel();
                    }
                });
        }
    });

    kendo.spreadsheet.dialogs.register("renameSheet", SheetRenameDialog);

    var InsertCommentDialog = SpreadsheetDialog.extend({
        options: {
            className: "k-spreadsheet-insert-comment",
            template: (data) => {
                let $kendoOutput;
                $kendoOutput = `<div class='k-edit-label'><label id='comment-label'>${kendo.htmlEncode(data.messages.insertCommentDialog.labels.comment)}:</label></div>
                <div class='k-edit-field'><span class='k-input k-textarea k-input-solid k-input-md k-rounded-md'><textarea
                    aria-labelledby='comment-label' rows='5' class='k-input-inner'
                    data-${kendo.htmlEncode(data.ns)}bind='value: comment'></textarea></span></div>
                <div class='k-actions'> <button class='k-button k-button-md k-rounded-md k-button-solid k-button-solid-base k-left'
                    data-${kendo.htmlEncode(data.ns)}bind='click: remove'><span
                    class='k-button-text'>${kendo.htmlEncode(data.messages.insertCommentDialog.labels.removeComment)}</span></button>
                <button class='k-button k-button-md k-rounded-md k-button-solid k-button-solid-primary'
                    data-${kendo.htmlEncode(data.ns)}bind='click: apply'><span
                    class='k-button-text'>${kendo.htmlEncode(data.messages.okText)}</span></button> <button
                    class='k-button k-button-md k-rounded-md k-button-solid k-button-solid-base'
                    data-${kendo.htmlEncode(data.ns)}bind='click: cancel'><span
                    class='k-button-text'>${data.messages.cancel}</span></button></div>`;
                return $kendoOutput;
            },
            title: TEXT("insertCommentDialog.title", "Insert comment"),
            autoFocus: false,
            width: 450
        },
        open: function(range) {
            var self = this;
            SpreadsheetDialog.fn.open.apply(self, arguments);
            var element = self.dialog().element;
            var model = kendo.observable({
                comment: range.comment(),
                apply: function() {
                    if (!/\S/.test(model.comment)) {
                        model.comment = null;
                    }
                    self.trigger("action", {
                        command: "InsertCommentCommand",
                        options: {
                            value: model.comment
                        }
                    });
                    self.close();
                },
                remove: function() {
                    model.comment = null;
                    model.apply();
                },
                cancel: self.close.bind(self)
            });
            kendo.bind(element, model);

            element.find("textarea").trigger("focus");
        }
    });

    kendo.spreadsheet.dialogs.register("insertComment", InsertCommentDialog);

    var InsertImageDialog = SpreadsheetDialog.extend({
        options: {
            template: (data) => {
                let $kendoOutput;
                $kendoOutput = `<div class='k-spreadsheet-insert-image-dialog'> <label
        data-${kendo.htmlEncode(data.ns)}bind='style: { background-image: imageUrl }, css: { k-spreadsheet-has-image: hasImage, k-hover: isHovered }, events: { dragenter: dragEnter, dragover: stopEvent, dragleave: dragLeave, drop: drop }'>
        <div data-${kendo.htmlEncode(data.ns)}bind='text: info'></div>
        <input type='file' data-${kendo.htmlEncode(data.ns)}bind='events: { change: change }'
            accept='image/png, image/jpeg, image/gif' />
    </label></div>
<div class='k-actions'> <button class='k-button k-button-md k-rounded-md k-button-solid k-button-solid-primary'
        data-${kendo.htmlEncode(data.ns)}bind='enabled: okEnabled, click: apply'><span
            class='k-button-text'>${kendo.htmlEncode(data.messages.okText)}</span></button> <button
        class='k-button k-button-md k-rounded-md k-button-solid k-button-solid-base'
        data-${kendo.htmlEncode(data.ns)}bind='click: cancel'><span
            class='k-button-text'>${data.messages.cancel}</span></button></div>`;
                return $kendoOutput;
            },
            title: TEXT("insertImageDialog.title", "Insert image"),
            width: "auto"
        },
        open: function() {
            var self = this;
            SpreadsheetDialog.fn.open.apply(self, arguments);
            var element = self.dialog().element;
            var model = kendo.observable({
                okEnabled: false,
                info: kendo.spreadsheet.messages.dialogs.insertImageDialog.info,
                imageUrl: "",
                hasImage: false,
                isHovered: false,
                _url: null,
                _image: null,
                apply: function() {
                    window.URL.revokeObjectURL(model._url);
                    self.trigger("action", {
                        command: "InsertImageCommand",
                        options: {
                            blob   : model._image,
                            width  : model._width,
                            height : model._height
                        }
                    });
                    self.close();
                },
                cancel: self.close.bind(self),
                stopEvent: function(ev) {
                    ev.stopPropagation();
                    ev.preventDefault();
                },
                drop: function(ev) {
                    model.stopEvent(ev);
                    model.selectFile(ev.originalEvent.dataTransfer.files);
                    model.set("isHovered", false);
                },
                dragEnter: function(ev) {
                    model.stopEvent(ev);
                    model.set("isHovered", true);
                },
                dragLeave: function(ev) {
                    model.stopEvent(ev);
                    model.set("isHovered", false);
                },
                change: function(ev) {
                    model.selectFile(ev.target.files);
                },
                selectFile: function(files) {
                    var image;
                    for (var i = 0; i < files.length; ++i) {
                        if (/^image\//i.test(files[i].type)) {
                            image = files[i];
                            break;
                        }
                    }
                    if (model._url) {
                        window.URL.revokeObjectURL(model._url);
                    }
                    if (image) {
                        model._image = image;
                        model._url = window.URL.createObjectURL(image);
                        var img = new Image();
                        img.src = model._url;
                        img.onload = function() {
                            model._width = img.width;
                            model._height = img.height;
                            model.set("info", kendo.spreadsheet.messages.dialogs.insertImageDialog.info);
                            model.set("okEnabled", true);
                            model.set("imageUrl", "url('" + model._url + "')");
                            model.set("hasImage", true);
                        };
                    } else {
                        model._image = null;
                        model.set("info", kendo.spreadsheet.messages.dialogs.insertImageDialog.typeError);
                        model.set("okEnabled", false);
                        model.set("imageUrl", "");
                        model.set("hasImage", false);
                    }
                }
            });
            kendo.bind(element, model);
        }
    });

    kendo.spreadsheet.dialogs.register("insertImage", InsertImageDialog);

    function Localizable(path, def) {
        this.path = path.split(".");
        this.def = def;
    }

    Localizable.prototype.trans = function() {
        var msg = kendo.spreadsheet.messages.dialogs;
        for (var i = 0; i < this.path.length; ++i) {
            msg = msg[this.path[i]];
            if (!msg) {
                return this.def;
            }
        }
        return msg;
    };

    function TEXT(path, def) {
        return new Localizable(path, def);
    }

    function translate(thing) {
        if (thing instanceof Localizable) {
            return thing.trans();
        }
        else if (Array.isArray(thing)) {
            return thing.map(translate);
        }
        else if (thing != null && typeof thing == "object") {
            return Object.keys(thing).reduce(function(ret, key){
                ret[key] = translate(thing[key]);
                return ret;
            }, {});
        }
        return thing;
    }

})(window.kendo);

(function(kendo) {

        var $ = kendo.jQuery;
        var BORDER_TYPES = [
            "allBorders",
            "insideBorders",
            "insideHorizontalBorders",
            "insideVerticalBorders",
            "outsideBorders",
            "leftBorder",
            "topBorder",
            "rightBorder",
            "bottomBorder",
            "noBorders"
        ];
        var BORDER_TYPES_ICONS = {
           allBorders: "bordersAll",
           insideBorders: "bordersInside",
           insideHorizontalBorders: "bordersInsideHorizontal",
           insideVerticalBorders: "bordersInsideVertical",
           outsideBorders: "bordersOutside",
           leftBorder: "borderLeft",
           topBorder: "borderTop",
           rightBorder: "borderRight",
           bottomBorder: "borderBottom",
           noBorders: "bordersNone"
        };

        var BORDER_PALETTE_MESSAGES = kendo.spreadsheet.messages.borderPalette = {
            allBorders: "All borders",
            insideBorders: "Inside borders",
            insideHorizontalBorders: "Inside horizontal borders",
            insideVerticalBorders: "Inside vertical borders",
            outsideBorders: "Outside borders",
            leftBorder: "Left border",
            topBorder: "Top border",
            rightBorder: "Right border",
            bottomBorder: "Bottom border",
            noBorders: "No border"
        };

        var colorPickerPalette = [ //metro palette
            "#ffffff", "#000000", "#d6ecff", "#4e5b6f", "#7fd13b", "#ea157a", "#feb80a", "#00addc", "#738ac8", "#1ab39f",
            "#f2f2f2", "#7f7f7f", "#a7d6ff", "#d9dde4", "#e5f5d7", "#fad0e4", "#fef0cd", "#c5f2ff", "#e2e7f4", "#c9f7f1",
            "#d8d8d8", "#595959", "#60b5ff", "#b3bcca", "#cbecb0", "#f6a1c9", "#fee29c", "#8be6ff", "#c7d0e9", "#94efe3",
            "#bfbfbf", "#3f3f3f", "#007dea", "#8d9baf", "#b2e389", "#f272af", "#fed46b", "#51d9ff", "#aab8de", "#5fe7d5",
            "#a5a5a5", "#262626", "#003e75", "#3a4453", "#5ea226", "#af0f5b", "#c58c00", "#0081a5", "#425ea9", "#138677",
            "#7f7f7f", "#0c0c0c", "#00192e", "#272d37", "#3f6c19", "#750a3d", "#835d00", "#00566e", "#2c3f71", "#0c594f"
        ];

        var BorderPalette = kendo.ui.Widget.extend({
            init: function(element, options) {
                kendo.ui.Widget.call(this, element, options);

                this.element = element;
                this.color = "#000";

                this.element.addClass("k-spreadsheet-popup");

                this._borderTypePalette();
                this._borderColorPalette();
            },

            options: {
                name: "BorderPalette"
            },

            events: [
                "change"
            ],

            destroy: function() {
                this.colorChooser.destroy();
                kendo.destroy(this.element.find(".k-spreadsheet-border-type-palette"));
            },

            value: function() {
                return { type: this.type, color: this.color };
            },

            _borderTypePalette: function() {
                var that = this;
                var messages = BORDER_PALETTE_MESSAGES;

                var element = $("<div />", {
                    "class": "k-spreadsheet-border-type-palette"
                });

                $('<span class="k-column-menu-group-header"><span class="k-column-menu-group-header-text">Border type</span></span>').appendTo(this.element);

                element.appendTo(this.element);

                BORDER_TYPES.map(function(type) {
                    $('<button title="' + messages[type] + '" aria-label="' + messages[type] + '" data-border-type="' + type + '">')
                        .appendTo(element)
                        .kendoToggleButton({
                            icon: kendo.toHyphens(BORDER_TYPES_ICONS[type]),
                            toggle: that._toggle.bind(that)
                        });
                });
            },

            _borderColorPalette: function() {
                var element = $("<div />", {
                    "class": "k-spreadsheet-border-color-palette"
                });

                $('<span class="k-column-menu-group-header"><span class="k-column-menu-group-header-text">Border color</span></span>').appendTo(this.element);
                element.appendTo(this.element);

                this.colorChooser = new kendo.ui.FlatColorPicker(element, {
                    buttons: !this.options.change,
                    color: this.color,
                    view: "palette",
                    palette: colorPickerPalette,
                    input: false,
                    change: this._change.bind(this)
                });

                this.colorChooser.wrapper.find(".k-coloreditor-apply").on("click", this._apply.bind(this));
                this.colorChooser.wrapper.find(".k-coloreditor-cancel").on("click", this._cancel.bind(this));
            },

            _change: function() {
                this.color = this.colorChooser.value();
            },

            _toggle: function(e) {
                var type = e.target.data("borderType"),
                    previous = e.target.siblings(".k-selected").data("kendoToggleButton");

                if (e.checked === true) {
                    if (previous) {
                        previous.toggle(false);
                    }

                    this.type = type;
                } else {
                    this.type = null;
                }
            },

            _apply: function() {
                this.trigger("change", { type: this.type, color: this.color });
            },

            _cancel: function() {
                this.trigger("change", { type: null, color: null });
            }
        });

        kendo.spreadsheet.BorderPalette = BorderPalette;

    })(window.kendo);

(function(kendo) {
    var $ = kendo.jQuery;

    function getDefaultToolElement(firstIconName) {
        return `<button role="button">${kendo.ui.icon({ icon: firstIconName, iconClass: "k-button-icon" })}<span class="k-button-text">${kendo.ui.icon("caret-alt-down")}</span></button>`
    }

    var ToolBar = kendo.ui.ToolBar;

    var MESSAGES = kendo.spreadsheet.messages.toolbar = {
        addColumnLeft: "Add column left",
        addColumnRight: "Add column right",
        addRowAbove: "Add row above",
        addRowBelow: "Add row below",
        alignment: "Alignment",
        alignmentButtons: {
            justifyLeft: "Align left",
            justifyCenter: "Center",
            justifyRight: "Align right",
            justifyFull: "Justify",
            alignTop: "Align top",
            alignMiddle: "Align middle",
            alignBottom: "Align bottom"
        },
        backgroundColor: "Background",
        increaseFontSize: "Increase font size",
        decreaseFontSize: "Decrease font size",
        bold: "Bold",
        borders: "Borders",
        copy: "Copy",
        cut: "Cut",
        deleteColumn: "Delete column",
        deleteRow: "Delete row",
        filter: "Filter",
        fontFamily: "Font",
        fontSize: "Font size",
        format: "Custom format...",
        formatTypesSamples: {
            number: "1,499.99",
            percent: "14.50%",
            financial: "(1,000.12)",
            currency: "$1,499.99",
            date: "4/21/2012",
            time: "5:49:00 PM",
            dateTime: "4/21/2012 5:49:00",
            duration: "168:05:00"
        },
        formatTypes: {
            automatic: "Automatic",
            text: "Text",
            number: "Number",
            percent: "Percent",
            financial: "Financial",
            currency: "Currency",
            date: "Date",
            time: "Time",
            dateTime: "Date time",
            duration: "Duration",
            moreFormats: "More formats..."
        },
        formatDecreaseDecimal: "Decrease decimal",
        formatIncreaseDecimal: "Increase decimal",
        freeze: "Freeze panes",
        freezeButtons: {
            freezePanes: "Freeze panes",
            freezeRows: "Freeze rows",
            freezeColumns: "Freeze columns",
            unfreeze: "Unfreeze panes"
        },
        insertComment: "Insert comment",
        insertImage: "Insert image",
        italic: "Italic",
        merge: "Merge cells",
        mergeButtons: {
            mergeCells: "Merge all",
            mergeHorizontally: "Merge horizontally",
            mergeVertically: "Merge vertically",
            unmerge: "Unmerge"
        },
        open: "Open...",
        paste: "Paste",
        redo: "Redo",
        undo: "Undo",
        exportAs: "Export...",
        toggleGridlines: "Toggle gridlines",
        sort: "Sort",
        sortButtons: {
            // sortSheetAsc: "Sort sheet A to Z",
            // sortSheetDesc: "Sort sheet Z to A",
            sortRangeAsc: "Sort range A to Z",
            sortRangeDesc: "Sort range Z to A"
        },
        textColor: "Text Color",
        textWrap: "Wrap text",
        underline: "Underline",
        validation: "Data validation...",
        hyperlink: "Link"
    };

    var defaultTools = {
        file: [
            "open",
            "exportAs",
        ],
        format: [
            "format",
            "formatDecreaseDecimal",
            "formatIncreaseDecimal"
        ],
        home: [
            ["undo", "redo"],
            "separator",
            ["cut", "copy", "paste"],
            "separator",
            "fontFamily", "fontSize", "increaseFontSize", "decreaseFontSize",
            "separator",
            ["bold", "italic", "underline"],
            "separator",
            "textColor",
            "separator",
            "backgroundColor",
            "borders",
            "separator",
            "alignment",
            "textWrap",
        ],
        insert: [
            "insertComment",
            "separator",
            "hyperlink",
            "separator",
            "insertImage",
            "separator",
            ["addColumnLeft", "addColumnRight", "addRowBelow", "addRowAbove"],
            "separator",
            ["deleteColumn", "deleteRow"]
        ],
        data: [
            "sort",
            "separator",
            "filter",
            "separator",
            "validation"
        ],
        view: [
            "freeze",
            "merge",
            "toggleGridlines"
        ]
    };

    var defaultFormats = kendo.spreadsheet.formats = {
        automatic: null,
        text: "@",
        number: "#,0.00",
        percent: "0.00%",
        financial: '_("$"* #,##0.00_);_("$"* (#,##0.00);_("$"* "-"??_);_(@_)',
        currency: "$#,##0.00;[Red]$#,##0.00",
        date: "m/d/yyyy",
        time: "h:mm:ss AM/PM",
        dateTime: "m/d/yyyy h:mm",
        duration: "[h]:mm:ss"
    };

    var colorPickerPalette = [ //metro palette
        "#ffffff", "#000000", "#d6ecff", "#4e5b6f", "#7fd13b", "#ea157a", "#feb80a", "#00addc", "#738ac8", "#1ab39f",
        "#f2f2f2", "#7f7f7f", "#a7d6ff", "#d9dde4", "#e5f5d7", "#fad0e4", "#fef0cd", "#c5f2ff", "#e2e7f4", "#c9f7f1",
        "#d8d8d8", "#595959", "#60b5ff", "#b3bcca", "#cbecb0", "#f6a1c9", "#fee29c", "#8be6ff", "#c7d0e9", "#94efe3",
        "#bfbfbf", "#3f3f3f", "#007dea", "#8d9baf", "#b2e389", "#f272af", "#fed46b", "#51d9ff", "#aab8de", "#5fe7d5",
        "#a5a5a5", "#262626", "#003e75", "#3a4453", "#5ea226", "#af0f5b", "#c58c00", "#0081a5", "#425ea9", "#138677",
        "#7f7f7f", "#0c0c0c", "#00192e", "#272d37", "#3f6c19", "#750a3d", "#835d00", "#00566e", "#2c3f71", "#0c594f"
    ];

    var COLOR_PICKER_MESSAGES = kendo.spreadsheet.messages.colorPicker = {
        reset: "Reset color",
        customColor: "Custom color...",
        apply: "Apply",
        cancel: "Cancel"
    };

    function getToolDefaults() {
        return {
        undo: {
           type: "button",
           name: "undo",
           icon: "undo",
           command: "undo"
        },
        redo: {
           type: "button",
           name: "redo",
           icon: "redo",
           command: "redo"
        },
        separator: { type: "separator" },
        //home tab
        open: {
            type: "open",
            name: "open",
            icon: "folder-open",
            extensions: ".xlsx",
            command: "OpenCommand"
        },
        exportAs: {
            type: "button",
            name: "exportAs",
            dialog: "exportAs",
            overflow: "never",
            icon: "download"
        },
        bold: {
            type: "button",
            command: "PropertyChangeCommand",
            property: "bold",
            value: true,
            icon: "bold",
            togglable: true
        },
        italic: {
            type: "button",
            command: "PropertyChangeCommand",
            property: "italic",
            value: true,
            icon: "italic",
            togglable: true
        },
        underline: {
            type: "button",
            command: "PropertyChangeCommand",
            property: "underline",
            value: true,
            icon: "underline",
            togglable: true
        },
        formatDecreaseDecimal: {
            type: "button",
            name: "formatDecreaseDecimal",
            command: "AdjustDecimalsCommand",
            value: -1,
            icon: "decimal-decrease"
        },
        formatIncreaseDecimal: {
            type: "button",
            name: "formatIncreaseDecimal",
            command: "AdjustDecimalsCommand",
            value: 1,
            icon: "decimal-increase"
        },
        textWrap: {
            type: "button",
            name: "textWrap",
            command: "TextWrapCommand",
            property: "wrap",
            value: true,
            icon: "text-wrap",
            togglable: true
        },
        cut: {
            type: "button",
            name: "cut",
            command: "ToolbarCutCommand",
            icon: "cut"
        },
        copy: {
            type: "button",
            name: "copy",
            command: "ToolbarCopyCommand",
            icon: "copy"
        },
        paste: {
            type: "button",
            name: "paste",
            command: "ToolbarPasteCommand",
            icon: "clipboard"
        },
        alignment: {
            type: "component",
            name: "alignment",
            property: "alignment",
            component: "DropDownButton",
            element: getDefaultToolElement("align-left"),
            overflowComponent: {
                type: "button",
                dialog: "alignment",
                icon: "align-left"
            },
            componentOptions: {
                fillMode: "flat",
                items: [
                    { attributes: { "data-value": "left", "data-property": "textAlign", "data-command": "PropertyChangeCommand" }, icon: "align-left", text: MESSAGES.alignmentButtons.justifyLeft },
                    { attributes: { "data-value": "center", "data-property": "textAlign", "data-command": "PropertyChangeCommand" }, icon: "align-center", text: MESSAGES.alignmentButtons.justifyCenter },
                    { attributes: { "data-value": "right", "data-property": "textAlign", "data-command": "PropertyChangeCommand" }, icon: "align-right", text: MESSAGES.alignmentButtons.justifyRight },
                    { attributes: { "data-value": "justify", "data-property": "textAlign", "data-command": "PropertyChangeCommand" }, icon: "align-justify", text: MESSAGES.alignmentButtons.justifyFull },
                    { attributes: { class: "k-separator" } },
                    { attributes: { "data-value": "top", "data-property": "verticalAlign", "data-command": "PropertyChangeCommand" }, icon: "align-top", text: MESSAGES.alignmentButtons.alignTop },
                    { attributes: { "data-value": "center", "data-property": "verticalAlign", "data-command": "PropertyChangeCommand" }, icon: "align-middle", text: MESSAGES.alignmentButtons.alignMiddle },
                    { attributes: { "data-value": "bottom", "data-property": "verticalAlign", "data-command": "PropertyChangeCommand" }, icon: "align-bottom", text: MESSAGES.alignmentButtons.alignBottom }
                ],
                commandOn: "click"
            }
        },
        backgroundColor: {
            type: "component",
            name: "backgroundColor",
            commandOn: "change",
            command: "PropertyChangeCommand",
            property: "background",
            component: "ColorPicker",
            componentOptions: {
                view: "palette",
                toolIcon: "droplet",
                fillMode: "flat",
                palette: colorPickerPalette,
                clearButton: true,
                messages: COLOR_PICKER_MESSAGES,
                input: false,
                commandOn: "change"
            },
            overflowComponent: {
                type: "button",
                dialog: "colorPicker",
                icon: "droplet",
                property: "background"
            }
        },
        textColor: {
            type: "component",
            name: "textColor",
            commandOn: "change",
            command: "PropertyChangeCommand",
            property: "color",
            component: "ColorPicker",
            componentOptions: {
                view: "palette",
                fillMode: "flat",
                toolIcon: "foreground-color",
                palette: colorPickerPalette,
                clearButton: true,
                messages: COLOR_PICKER_MESSAGES,
                input: false,
                commandOn: "change"
            },
            overflowComponent: {
                type: "button",
                dialog: "colorPicker",
                icon: "foreground-color",
                property: "color"
            }
        },
        fontFamily: {
            type: "component",
            name: "fontFamily",
            command: "PropertyChangeCommand",
            property: "fontFamily",
            component: "DropDownList",
            overflowComponent: {
                type: "button",
                dialog: "fontFamily",
                icon: "font-family"
            },
            componentOptions: {
                dataSource: ["Arial", "Courier New", "Georgia", "Times New Roman", "Trebuchet MS", "Verdana"],
                value: "Arial",
                fillMode: "flat",
                commandOn: "change"
            }
        },
        fontSize: {
            type: "component",
            name: "fontSize",
            command: "PropertyChangeCommand",
            property: "fontSize",
            component: "ComboBox",
            overflowComponent: {
                type: "button",
                dialog: "fontSize",
                icon: "font-size"
            },
            componentOptions: {
                dataSource: [8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72],
                value: 12,
                fillMode: "flat",
                commandOn: "change"
            }
        },
        increaseFontSize: {
            type: "button",
            name: "increaseFontSize",
            command: "IncreaseFontSize",
            property: "fontSize",
            icon: "font-grow"
        },
        decreaseFontSize: {
            type: "button",
            name: "decreaseFontSize",
            command: "DecreaseFontSize",
            property: "fontSize",
            icon: "font-shrink"
        },
        format: {
            type: "component",
            name: "format",
            component: "DropDownButton",
            element: getDefaultToolElement("custom-format"),
            overflowComponent: {
                type: "button",
                dialog: "formatCells",
                icon: "custom-format"
            },
            componentOptions: {
                fillMode: "flat",
                items: [
                    { attributes: { "data-value": defaultFormats.automatic, "data-command": "PropertyChangeCommand", "data-property": "format" }, text: MESSAGES.formatTypes.automatic },
                    { attributes: { "data-value": defaultFormats.text, "data-command": "PropertyChangeCommand", "data-property": "format" }, text: MESSAGES.formatTypes.text },
                    { attributes: { "data-value": defaultFormats.number, "data-command": "PropertyChangeCommand", "data-property": "format" }, text: MESSAGES.formatTypes.number, sample: MESSAGES.formatTypesSamples.number },
                    { attributes: { "data-value": defaultFormats.percent, "data-command": "PropertyChangeCommand", "data-property": "format" }, text: MESSAGES.formatTypes.percent, sample: MESSAGES.formatTypesSamples.percent },
                    { attributes: { "data-value": defaultFormats.financial, "data-command": "PropertyChangeCommand", "data-property": "format" }, text: MESSAGES.formatTypes.financial, sample: MESSAGES.formatTypesSamples.financial },
                    { attributes: { "data-value": defaultFormats.currency, "data-command": "PropertyChangeCommand", "data-property": "format" }, text: MESSAGES.formatTypes.currency, sample: MESSAGES.formatTypesSamples.currency },
                    { attributes: { "data-value": defaultFormats.date, "data-command": "PropertyChangeCommand", "data-property": "format" }, text: MESSAGES.formatTypes.date, sample: MESSAGES.formatTypesSamples.date },
                    { attributes: { "data-value": defaultFormats.time, "data-command": "PropertyChangeCommand", "data-property": "format" }, text: MESSAGES.formatTypes.time, sample: MESSAGES.formatTypesSamples.time },
                    { attributes: { "data-value": defaultFormats.dateTime, "data-command": "PropertyChangeCommand", "data-property": "format" }, text: MESSAGES.formatTypes.dateTime, sample: MESSAGES.formatTypesSamples.dateTime },
                    { attributes: { "data-value": defaultFormats.duration, "data-command": "PropertyChangeCommand", "data-property": "format" }, text: MESSAGES.formatTypes.duration, sample: MESSAGES.formatTypesSamples.duration },
                    { attributes: { "data-value": "popup", "data-popup": "formatCells" }, text: MESSAGES.formatTypes.moreFormats },
                ],
                itemTemplate: (data) => {
                    let $kendoOutput;
                    $kendoOutput = `<span class="k-link k-menu-link"><span class="k-menu-link-text">`; if (data.sample) {
                    $kendoOutput += `<span class='k-spreadsheet-sample'>${kendo.htmlEncode(data.sample)}</span> `; }
                    $kendoOutput += `${kendo.htmlEncode(data.text)}</span></span>`;
                    return $kendoOutput;
                },
                commandOn: "click"
            }
        },
        filter: {
            type: "button",
            name: "filter",
            property: "hasFilter",
            icon: "filter",
            command: "FilterCommand",
            togglable: true,
            enable: false
        },
        merge: {
            type: "component",
            name: "merge",
            component: "DropDownButton",
            element: getDefaultToolElement("cells-merge"),
            overflowComponent: {
                type: "button",
                dialog: "merge",
                icon: "cells-merge"
            },
            componentOptions: {
                fillMode: "flat",
                items: [
                    { attributes: { "data-value": "cells", "data-command": "MergeCellCommand" }, icon: "cells-merge", text: MESSAGES.mergeButtons.mergeCells },
                    { attributes: { "data-value": "horizontally", "data-command": "MergeCellCommand" }, icon: "cells-merge-horizontally", text: MESSAGES.mergeButtons.mergeHorizontally },
                    { attributes: { "data-value": "vertically", "data-command": "MergeCellCommand" }, icon: "cells-merge-vertically", text: MESSAGES.mergeButtons.mergeVertically },
                    { attributes: { "data-value": "unmerge", "data-command": "MergeCellCommand" }, icon: "table-unmerge", text: MESSAGES.mergeButtons.unmerge }
                ],
                commandOn: "click"
            }
        },
        freeze: {
            type: "component",
            name: "freeze",
            component: "DropDownButton",
            element: getDefaultToolElement("pane-freeze"),
            overflowComponent: {
                type: "button",
                dialog: "freeze",
                icon: "pane-freeze"
            },
            componentOptions: {
                fillMode: "flat",
                items: [
                    { attributes: { "data-value": "panes", "data-command": "FreezePanesCommand" }, icon: "pane-freeze", text: MESSAGES.freezeButtons.freezePanes },
                    { attributes: { "data-value": "rows", "data-command": "FreezePanesCommand" }, icon: "row-freeze", text: MESSAGES.freezeButtons.freezeRows },
                    { attributes: { "data-value": "columns", "data-command": "FreezePanesCommand" }, icon: "column-freeze", text: MESSAGES.freezeButtons.freezeColumns },
                    { attributes: { "data-value": "unfreeze", "data-command": "FreezePanesCommand" }, icon: "table-unmerge", text: MESSAGES.freezeButtons.unfreeze }
                ],
                commandOn: "click"
            }
        },
        borders: {
            type: "popupButton",
            name: "borders",
            icon: "borders-all",
            popupComponent: kendo.spreadsheet.BorderPalette,
            commandOn: "change",
            command: "BorderChangeCommand",
            overflowComponent: {
                type: "button",
                dialog: "borders"
            }
        },
        formatCells: {
            type: "button",
            dialog: "formatCells",
            overflow: "never"
        },
        hyperlink: {
            type: "button",
            name: "hyperlink",
            dialog: "hyperlink",
            icon: "link"
        },
        toggleGridlines: {
            type: "button",
            name: "toggleGridlines",
            command: "GridLinesChangeCommand",
            property: "gridLines",
            value: true,
            icon: "borders-none",
            togglable: true,
            selected: true
        },
        insertComment: {
            type: "button",
            name: "insertComment",
            dialog: "insertComment",
            property: "comment",
            togglable: true,
            icon: "comment"
        },
        insertImage: {
            type: "button",
            name: "insertImage",
            dialog: "insertImage",
            icon: "image",
        },

        //insert tab
        addColumnLeft: {
            type: "button",
            name: "addColumnLeft",
            command: "AddColumnCommand",
            value: "left",
            icon: "table-column-insert-left"
        },
        addColumnRight: {
            type: "button",
            name: "addColumnRight",
            command: "AddColumnCommand",
            value: "right",
            icon: "table-column-insert-right"
        },
        addRowBelow: {
            type: "button",
            name: "addRowBelow",
            command: "AddRowCommand",
            value: "below",
            icon: "table-row-insert-below"
        },
        addRowAbove: {
            type: "button",
            name: "addRowAbove",
            command: "AddRowCommand",
            value: "above",
            icon: "table-row-insert-above"
        },
        deleteColumn: {
            type: "button",
            name: "deleteColumn",
            command: "DeleteColumnCommand",
            icon: "table-column-delete"
        },
        deleteRow: {
            type: "button",
            name: "deleteRow",
            command: "DeleteRowCommand",
            icon: "table-row-delete"
        },

        //data tab
        sort: {
            type: "component",
            name: "sort",
            component: "DropDownButton",
            element: getDefaultToolElement("sort-desc"),
            overflowComponent: {
                type: "button",
                dialog: "sort",
                icon: "sort-desc"
            },
            componentOptions: {
                fillMode: "flat",
                items: [
                    { attributes: { "data-value": "asc", "data-command": "SortCommand" }, sheet: false, text: MESSAGES.sortButtons.sortRangeAsc, icon: "sort-asc" },
                    { attributes: { "data-value": "desc", "data-command": "SortCommand" }, sheet: false, text: MESSAGES.sortButtons.sortRangeDesc, icon: "sort-desc" },
                ],
                commandOn: "click"
            }
        },
        validation: {
            type: "button",
            name: "validation",
            dialog: "validation",
            icon: "exclamation-circle"
        }
    };
}

    var SpreadsheetToolBar = ToolBar.extend({
        init: function(element, options) {
            let toolDefaults = getToolDefaults();
            Object.keys(toolDefaults).forEach((t) => {
                if (t !== "validation") {
                    toolDefaults[t].showText = "overflow";
                }
            });

            options.tools = options.tools || SpreadsheetToolBar.prototype.options.tools[options.toolbarName];
            options.parentMessages = MESSAGES;
            options.defaultTools = toolDefaults;

            ToolBar.fn.init.call(this, element, options);
            var handleClick = this._click.bind(this);

            this.element.addClass("k-spreadsheet-toolbar k-toolbar-md");

            this.bind({
                click: handleClick,
                toggle: handleClick,
                change: handleClick
            });
        },
        _click: function(e) {
            var target = e.target,
                property = target.data("property"),
                value = e.value || target.data("value") || e.target.val(),
                commandType = target.data("command"),
                dialog = target.data("dialog"),
                options = target.data("options") || {};

            if (value === "popup") {
                // Special case to open custom format dialog from option of the format DDL
                dialog = target.data("popup");
            }

            if (commandType === "IncreaseFontSize") {
                commandType = "PropertyChangeCommand";
                value++;
            }

            if (commandType === "DecreaseFontSize") {
                commandType = "PropertyChangeCommand";
                value--;
            }

            options.property = property || null;
            options.value = value || null;

            if (dialog) {
                this.dialog({
                    name: dialog,
                    options: options
                });
                return;
            }

            if (!commandType) {
                return;
            }

            var args = {
                command: commandType,
                options: options
            };

            if (typeof args.options.value === "boolean") {
                args.options.value = e.checked ? true : null;
            }

            this.action(args);
        },
        events: [
            "action",
            "dialog"
        ],
        options: {
            name: "SpreadsheetToolBar",
            resizable: true,
            tools: defaultTools,
            fillMode: "flat"
        },
        action: function(args) {
            this.trigger("action", args);
        },
        dialog: function(args) {
            this.trigger("dialog", args);
        },
        refresh: function(activeCell) {
            var range = activeCell,
                tools = this._tools();

            for (var i = 0; i < tools.length; i++) {
                var property = tools[i].property,
                    tool = tools[i].tool,
                    value = kendo.isFunction(range[property]) ? range[property]() : range;

                if (property == "gridLines") {
                    // this isn't really a property of the range, it's per-sheet.
                    value = range.sheet().showGridLines();
                }

                this._updateTool(tool, value, property, range);
            }

            this.resize(true);
        },
        _tools: function() {
            return this.element.find("[data-property]").toArray().map(function(element) {
                element = $(element);
                return {
                    property: element.attr("data-property"),
                    tool: this._getItem(element)
                };
            }.bind(this));
        },
        _updateTool: function(tool, value, property, range) {
            var component = tool.component,
                toolbarEl = tool.toolbarEl,
                widget = kendo.widgetInstance(toolbarEl.find("[data-role]")),
                menuItem = tool.menuItem,
                toggle = false,
                vertical, text, menu, selection, enabled, label;

            if (property === "hasFilter") {
                selection = range.sheet().selection();

                if (selection && selection._ref && selection._ref.height) {
                    enabled = value || selection._ref.height() > 1;

                    this.enable(toolbarEl, enabled);
                }
            } else if (property === "alignment") {
                vertical = value.verticalAlign();
                text = value.textAlign();
                menu = component.menu.element;

                menu.find(".k-item .k-link").removeClass("k-selected");
                menu.find(".k-item[data-property=textAlign][data-value=" + text + "] .k-link").addClass("k-selected");
                menu.find(".k-item[data-property=verticalAlign][data-value=" + vertical + "] .k-link").addClass("k-selected");
            } else if (property === "background" || property === "color") {
                widget.value(value);
            } else if (property === "fontFamily" || property === "fontSize") {
                if (toolbarEl.is("button")) {
                    toolbarEl.attr("data-value", value);
                    toolbarEl.data("value", value);
                    return;
                }
                label = menuItem.find(".k-menu-link-text").text().split("(")[0].trim();
                menuItem.find(".k-menu-link-text").text(label + " (" + value + ") ...");
                widget.value(value);
            }

            if (component && component.toggle) {
                if (typeof value === "boolean") {
                    toggle = !!value;
                } else if (typeof value === "string") {
                    if (toolbarEl.data("value")) {
                        toggle = toolbarEl.data("value") === value;
                    } else {
                        // if no value is specified in the tool options,
                        // assume it should be ON if the range value is not null, and OFF otherwise.
                        toggle = value != null;
                    }
                }

                this.toggle(toolbarEl, toggle);
            }
        }
    });

    kendo.cssProperties.propertyDictionary["SpreadsheetToolBar"] = kendo.cssProperties.propertyDictionary["ToolBar"];

    kendo.spreadsheet.ToolBar = SpreadsheetToolBar;

    kendo.spreadsheet.Menu = kendo.ui.Menu;

})(window.kendo);

function clone(hash, target) {
        if (!target) {
            target = {};
        }
        if (Object.assign) {
            return Object.assign(target, hash);
        }
        return Object.keys(hash).reduce(function(copy, key) {
            copy[key] = hash[key];
            return copy;
        }, target);
    }

    function drawTabularData(options) {
        var progress = new $.Deferred();
        var promise = progress.promise();

        options = clone(options, {
            dataSource       : null,
            guidelines       : true,
            guideColor       : "#000",
            columns          : null,
            headerBackground : "#999",
            headerColor      : "#000",
            oddBackground    : null,
            evenBackground   : null,
            fontFamily       : "Arial",
            fontSize         : 12,
            paperSize        : "A4",
            margin           : "1cm",
            landscape        : true,
            fitWidth         : false,
            scale            : 1,
            rowHeight        : 20,
            maxEmpty         : 1,
            useGridFormat    : true
        });

        // retrieve fonts; custom fonts should be already loaded
        kendo.drawing.pdf.defineFont(
            kendo.drawing.drawDOM.getFontFaces(document)
        );

        var charWidth = charWidthFunction(options.fontFamily, options.fontSize);

        function textWidth(value) {
            if (value != null) {
                var width = 12;         // magic numbers :-/
                for (var i = value.length; --i >= 0;) {
                    width += charWidth(value.charAt(i));
                }
                return width;
            }
            return 0;
        }

        var border = options.guidelines ? { size: 1, color: options.guideColor } : null;

        function mkCell(data) {
            if (!border) {
                return data;
            }
            return clone(data, {
                borderLeft: border,
                borderTop: border,
                borderRight: border,
                borderBottom: border
            });
        }

        options.dataSource.fetch(function(){
            var data = options.dataSource.data();
            if (!data.length) {
                return progress.reject("Empty dataset");
            }

            // this really must be present
            var columns = options.columns.map(function(col){
                if (typeof col == "string") {
                    return { title: col, field: col };
                } else {
                    return col;
                }
            });
            var columnTitles = columns.map(function(col){
                return col.title || col.field;
            });
            var columnWidths = columnTitles.map(textWidth);

            // prepare data for a Sheet object's fromJSON method
            var rows = data.map(function(row, rowIndex){
                return {
                    cells: columns.map(function(col, colIndex){
                        var value = row[col.field];

                        // NOTE: value might not be string.  I added option useGridFormat (default
                        // true), which will use a column's format, if present, to convert the value
                        // to a string, so that we can measure the width right now.
                        if (options.useGridFormat) {
                            if (value != null) {
                                if (col.format) {
                                    value = kendo.format(col.format, value);
                                } else {
                                    value += "";
                                }
                            }
                            // adjust the column widths while we're at it
                            columnWidths[colIndex] = Math.max(
                                textWidth(value),
                                columnWidths[colIndex]
                            );
                        }

                        // if options.useGridFormat is false and col.format is present, pass it over
                        // to the spreadsheet.  In that case we should calculate the widths after
                        // the spreadsheet is created (XXX to be implemented when someone needs it).
                        return mkCell({
                            value: value,
                            format: options.useGridFormat ? null : col.format,
                            background: rowIndex % 2 ? options.evenBackground : options.oddBackground
                        });
                    })
                };
            });

            // insert header line
            rows.unshift({
                cells: columnTitles.map(function(label){
                    return mkCell({
                        value: label,
                        background: options.headerBackground,
                        color: options.headerColor
                    });
                })
            });

            // init a Sheet object.  Note that we have to add one
            // extra-row and column, because the very last ones can't
            // have right/bottom borders (known limitation).
            var sheet = new kendo.spreadsheet.Sheet(
                rows.length + 1,        // rows
                columns.length + 1,     // columns
                options.rowHeight,      // row height
                50,                     // column width
                20,                     // header height
                20,                     // header width,
                {                       // default cell style
                    fontFamily: options.fontFamily,
                    fontSize: options.fontSize,
                    verticalAlign: "center"
                }
            );

            // load data
            sheet.fromJSON({
                name: "Sheet1",
                rows: rows,
                columns: columnWidths.map(function(w, i){
                    return { index: i, width: w };
                })
            });

            sheet.draw({
                paperSize  : options.paperSize,
                landscape  : options.landscape,
                margin     : options.margin,
                guidelines : false, // using borders instead (better contrast)
                scale      : options.scale,
                fitWidth   : options.fitWidth,
                maxEmpty   : options.maxEmpty,
                headerRows : 1
            }, progress.resolve.bind(progress));
        });

        return promise;
    }

    var CACHE_CHAR_WIDTH = {};

    var charWidthFunction = function(fontFamily, fontSize) {
        var id = fontSize + ":" + fontFamily;
        var func = CACHE_CHAR_WIDTH[id];
        if (!func) {
            var span, div = document.createElement("div");
            div.style.position = "fixed";
            div.style.left = "-10000px";
            div.style.top = "-10000px";
            div.style.fontFamily = fontFamily;
            div.style.fontSize = fontSize + "px";
            div.style.whiteSpace = "pre";
            for (var i = 32; i < 128; ++i) {
                span = document.createElement("span");
                span.appendChild(document.createTextNode(String.fromCharCode(i)));
                div.appendChild(span);
            }
            document.body.appendChild(div);
            var widths = {};
            for (i = 32, span = div.firstChild; i < 128 && span; ++i, span = span.nextSibling) {
                widths[i] = span.offsetWidth;
            }
            while ((span = div.firstChild)) {
                div.removeChild(span);
            }
            func = CACHE_CHAR_WIDTH[id] = function(ch) {
                var code = ch.charCodeAt(0);
                var width = widths[code];
                if (width == null) {
                    // probably not an ASCII character, let's cache its width as well
                    span = document.createElement("span");
                    span.appendChild(document.createTextNode(String.fromCharCode(code)));
                    div.appendChild(span);
                    width = widths[code] = span.offsetWidth;
                    div.removeChild(span);
                }
                return width;
            };
        }
        return func;
    };

    kendo.spreadsheet.drawTabularData = drawTabularData;

(function(kendo) {


    let registerEditor = kendo.spreadsheet.registerEditor;
    var $ = kendo.jQuery;

    registerEditor("_validation_date", function(){
        var context, calendar, popup;

        function create() {
            if (!calendar) {
                calendar = $("<div>").kendoCalendar();
                popup = $("<div>").kendoPopup();
                calendar.appendTo(popup);
                calendar = calendar.getKendoCalendar();
                popup = popup.getKendoPopup();

                calendar.bind("change", function(){
                    popup.close();
                    var date = calendar.value();
                    if (!context.range.format()) {
                        context.range.format("yyyy-mm-dd");
                    }
                    context.callback(kendo.spreadsheet.dateToNumber(date));
                });
            }
            popup.setOptions({
                anchor: context.view.element.querySelector(".k-spreadsheet-editor-button"),
                origin: context.alignLeft ? "bottom right" : "bottom left",
                position: context.alignLeft ? "top right" : "top left"
            });
        }

        function open() {
            create();

            var date = context.range.value();
            var sheet = context.range.sheet();
            if (date != null) {
                calendar.value(kendo.spreadsheet.numberToDate(date));
            } else {
                calendar.value(null);
            }
            var val = context.validation;
            if (val) {
                var min = kendo.ui.Calendar.fn.options.min;
                var max = kendo.ui.Calendar.fn.options.max;
                var fromValidation = val.from;
                var toValidation = val.to;
                var formula = kendo.spreadsheet.calc.runtime.Formula;

                if (/^(?:greaterThan|between)/.test(val.comparerType)) {
                    if(fromValidation instanceof formula && _rowAndColPresent(fromValidation.value)) {
                        min = kendo.spreadsheet.numberToDate(sheet.range(fromValidation.value.row, fromValidation.value.col).value());
                    } else {
                        min = kendo.spreadsheet.numberToDate(fromValidation.value);
                    }
                }
                if (val.comparerType == "between") {
                    if(toValidation instanceof formula && _rowAndColPresent(toValidation.value)) {
                        max = kendo.spreadsheet.numberToDate(sheet.range(toValidation.value.row, toValidation.value.col).value());
                    } else {
                        max = kendo.spreadsheet.numberToDate(val.to.value);
                    }
                }
                if (val.comparerType == "lessThan" || val.comparerType == "lessThanOrEqualTo") {
                    if(fromValidation instanceof formula && _rowAndColPresent(fromValidation.value)) {
                        max = kendo.spreadsheet.numberToDate(sheet.range(fromValidation.value.row, fromValidation.value.col).value());
                    } else {
                        max = kendo.spreadsheet.numberToDate(val.from.value);
                    }
                }
                calendar.setOptions({
                    disableDates: function(date) {
                        var from, to;

                        if(fromValidation && fromValidation instanceof formula && _rowAndColPresent(fromValidation.value)) {
                            from = sheet.range(fromValidation.value.row, fromValidation.value.col).value();
                        } else {
                            from = fromValidation ? fromValidation.value|0 : 0;
                        }

                        if(toValidation && toValidation instanceof formula && _rowAndColPresent(toValidation.value)) {
                            to = sheet.range(toValidation.value.row, toValidation.value.col).value();
                        } else {
                            to = toValidation ? toValidation.value|0 : 0;
                        }

                        date = kendo.spreadsheet.dateToNumber(date) | 0;
                        return !kendo.spreadsheet.validation
                            .validationComparers[val.comparerType](date, from, to);
                    },
                    min: min,
                    max: max
                });
            } else {
                calendar.setOptions({ disableDates: null, min: null, max: null });
            }
            popup.open();
        }

        function _rowAndColPresent(value) {
            return (value && value.row !== null && value.col !== null && value.row > -1 && value.col > -1);
        }

        return {
            edit: function(options) {
                context = options;
                open();
            },
            icon: "calendar"
        };
    });

    registerEditor("_validation_list", function(){
        var context, list, popup;
        function create() {
            if (!list) {
                list = $("<ul class='k-list k-reset'/>").kendoStaticList({
                    template   : "#:value#",
                    selectable : true,
                    autoBind   : false
                });
                popup = $("<div class='k-spreadsheet-list-popup'>").kendoPopup();
                list.appendTo(popup);
                popup = popup.getKendoPopup();
                list = list.getKendoStaticList();

                list.bind("change", function(){
                    popup.close();
                    var item = list.value()[0];
                    if (item) {
                        context.callback(item.value);
                    }
                });
            }
            popup.setOptions({
                anchor: context.view.element.querySelector(".k-spreadsheet-editor-button"),
                origin: context.alignLeft ? "bottom right" : "bottom left",
                position: context.alignLeft ? "top right" : "top left"
            });
        }
        function open() {
            create();
            var items = context.validation.from.value;
            var data = [], add = function(el){ data.push({ value: el }); };
            if (items instanceof kendo.spreadsheet.calc.runtime.Matrix) {
                items.each(add);
            } else {
                // actually Excel expects a simple string for list
                // validation (comma-separated labels).
                (items+"").split(/\s*,\s*/).forEach(add);
            }
            var dataSource = new kendo.data.DataSource({ data: data });
            list.setDataSource(dataSource);
            dataSource.read();
            popup.open();
        }
        return {
            edit: function(options) {
                context = options;
                open();
            },
            icon: "caret-alt-down"
        };
    });

})(window.kendo);

(function(kendo) {

        var $ = kendo.jQuery;
        var outerWidth = kendo._outerWidth;
        var DOT = ".";
        var EMPTYCHAR = " ";
        var sheetsBarClassNames = {
            sheetsBarWrapper: "k-spreadsheet-sheets-bar",
            sheetsBarSheetsWrapper: "k-tabstrip k-tabstrip-bottom",
            sheetsBarAdd: "k-spreadsheet-sheet-add",
            sheetsBarSheetsMenu: "k-spreadsheet-sheets-menu",
            sheetsBarRemove: "k-spreadsheet-sheets-remove",
            sheetsBarItems: "k-spreadsheet-sheets",
            sheetsBarEditor: "k-spreadsheet-sheets-editor",
            sheetsBarScrollable: "k-tabstrip-scrollable",
            sheetsBarNext: "k-tabstrip-next",
            sheetsBarPrev: "k-tabstrip-prev",
            sheetsBarKItem: "k-item",
            sheetsBarKTabstripItem: "k-tabstrip-item",
            sheetsBarKActive: "k-active",
            sheetsBarKTextbox: "k-textbox",
            sheetsBarKLink: "k-link",
            sheetsBarKLinkText: "k-link-text",
            sheetsBarKIcon: "k-icon",
            sheetsBarKFontIcon: "k-icon",
            sheetsBarKButton: "k-button k-icon-button",
            sheetsBarKButtonDefaults: "k-button-md k-rounded-md k-button-solid k-button-solid-base",
            sheetsBarKButtonBare: "k-button-md k-rounded-md k-button-flat k-button-flat-base",
            sheetsBarArrowWIcon: "caret-alt-left",
            sheetsBarArrowEIcon: "caret-alt-right",
            sheetsBarKReset: "k-reset k-tabstrip-items k-tabstrip-items-start",
            sheetsBarXIcon: "x",
            sheetsBarMoreIcon: "caret-alt-down",
            sheetsBarKSprite: "k-sprite",
            sheetsBarPlusIcon: "plus",
            sheetsBarMenuIcon: "menu",
            sheetsBarHintWrapper: "k-widget k-tabstrip k-tabstrip-bottom k-spreadsheet-sheets-items-hint",
            sheetsBarKResetItems: "k-reset k-tabstrip-items k-tabstrip-items-start"
        };

        var SheetsBar = kendo.ui.Widget.extend({
            init: function(element, options) {
                var classNames = SheetsBar.classNames;

                kendo.ui.Widget.call(this, element, options);

                element = this.element;

                element.addClass(classNames.sheetsBarWrapper);

                this._openDialog = options.openDialog;

                this._addButton();
                this._menuButton();
                this._tree = new kendo.dom.Tree(element[0]);

                this._tree.render([this._createSheetsWrapper([])]);
                this._initSheetDropDownButtons();

                this._toggleScrollEvents(true);

                this._createSortable();

                this._sortable.bind("start", this._onSheetReorderStart.bind(this));

                this._sortable.bind("end", this._onSheetReorderEnd.bind(this));

                element.on("click", "[ref-sheetsbar-more-button]", this._onSheetContextMenu.bind(this));

                element.on("click", "li", this._onSheetSelect.bind(this));

                element.on("dblclick", "li" + DOT + classNames.sheetsBarKItem + DOT + classNames.sheetsBarKItem, this._createEditor.bind(this));
            },

            options: {
                name: "SheetsBar",
                scrollable: {
                    distance: 200
                }
            },

            events: [
                "select",
                "reorder",
                "rename"
            ],

            _createEditor: function() {
                if (this._editor) {
                    return;
                }

                this._renderSheets(this._sheets, this._selectedIndex, true);
                this._editor = this.element
                    .find(kendo.format("input{0}{1}", DOT, SheetsBar.classNames.sheetsBarEditor))
                    .trigger("focus")
                    .on("keydown", this._onEditorKeydown.bind(this))
                    .on("blur", this._onEditorBlur.bind(this));
            },

            _destroyEditor: function(canceled) {
                var newSheetName = canceled ? null : this._editor.val();
                this._editor.off();
                this._editor = null;
                this._renderSheets(this._sheets, this._selectedIndex, false);
                this._onSheetRename(newSheetName);
            },

            renderSheets: function(sheets, selectedIndex) {
                if (!sheets || selectedIndex < 0) {
                    return;
                }

                this._renderSheets(sheets, selectedIndex, false);
            },

            _renderSheets: function(sheets, selectedIndex, isInEditMode) {
                var that = this;
                var classNames = SheetsBar.classNames;

                that._isRtl = kendo.support.isRtl(that.element);
                that._sheets = sheets;
                that._selectedIndex = selectedIndex;

                that._renderHtml(isInEditMode, true);

                if (!that._scrollableAllowed()) {
                    return;
                }

                var sheetsWrapper = that._sheetsWrapper();

                sheetsWrapper.addClass(classNames.sheetsBarScrollable + EMPTYCHAR + classNames.sheetsBarSheetsWrapper);

                that._toggleScrollButtons();
            },

            _toggleScrollButtons: function(toggle) {
                var that = this;
                var ul = that._sheetsGroup();
                var wrapper = that._sheetsWrapper();
                var scrollLeft = kendo.scrollLeft(ul);
                var prev = wrapper.find(DOT + SheetsBar.classNames.sheetsBarPrev);
                var next = wrapper.find(DOT + SheetsBar.classNames.sheetsBarNext);

                if (toggle === false) {
                    prev.addClass('k-disabled');
                    next.addClass('k-disabled');
                } else {
                    prev.toggleClass('k-disabled', !(that._isRtl ? scrollLeft < ul[0].scrollWidth - ul[0].offsetWidth - 1 : scrollLeft !== 0));
                    next.toggleClass('k-disabled', !(that._isRtl ? scrollLeft !== 0 : scrollLeft < ul[0].scrollWidth - ul[0].offsetWidth - 1));
                }

            },

            _toggleScrollEvents: function(toggle) {
                var that = this;
                var classNames = SheetsBar.classNames;
                var options = that.options;
                var scrollPrevButton;
                var scrollNextButton;
                var sheetsWrapper = that._sheetsWrapper();
                scrollPrevButton = sheetsWrapper.find(DOT + classNames.sheetsBarPrev);
                scrollNextButton = sheetsWrapper.find(DOT + classNames.sheetsBarNext);

                if (toggle) {
                    scrollPrevButton.on("mousedown", function(event) {
                        event.preventDefault();
                        event.stopPropagation();
                        that._nowScrollingSheets = true;
                        that._scrollSheetsByDelta(options.scrollable.distance * (that._isRtl ? 1 : -1));
                    });

                    scrollNextButton.on("mousedown", function(event) {
                        event.preventDefault();
                        event.stopPropagation();
                        that._nowScrollingSheets = true;
                        that._scrollSheetsByDelta(options.scrollable.distance * (that._isRtl ? -1 : 1));
                    });

                    scrollPrevButton.add(scrollNextButton).on("mouseup", function() {
                        that._nowScrollingSheets = false;
                    });
                } else {
                    scrollPrevButton.off();
                    scrollNextButton.off();
                }
            },

            _renderHtml: function(isInEditMode, renderScrollButtons) {
                var idx;
                var sheetElements = [];
                var dom = kendo.dom;
                var element = dom.element;
                var sheets = this._sheets;
                var selectedIndex = this._selectedIndex;
                var classNames = SheetsBar.classNames;

                for (idx = 0; idx < sheets.length; idx++) {
                    var sheet = sheets[idx];

                    var isSelectedSheet = (idx === selectedIndex);
                    var attr = { className: classNames.sheetsBarKItem + EMPTYCHAR + classNames.sheetsBarKTabstripItem + EMPTYCHAR, role: "tab" };
                    var elementContent = [];
                    if (sheet.state() !== 'visible') {
                        attr.className += "k-hidden ";
                    }

                    if (isSelectedSheet) {
                        attr.className += classNames.sheetsBarKActive;
                    }

                    if (isSelectedSheet && isInEditMode) {
                        elementContent.push(element("input", {
                            type: "text",
                            value: sheet.name(),
                            className: classNames.sheetsBarKTextbox + EMPTYCHAR + classNames.sheetsBarEditor,
                            maxlength: 50
                        }, []));
                    } else {
                        elementContent.push(element("span", {
                            className: classNames.sheetsBarKLink,
                            title: sheet.name()
                        }, [element("span", { className: classNames.sheetsBarKLinkText }, [dom.text(sheet.name())])]));

                        let contextMenuButton = element($(kendo.html.renderButton($(`<button ref-sheetsbar-more-button data-sheet-name="${sheet.name()}" class="k-menu-button"></button>`), {
                            icon: classNames.sheetsBarMoreIcon,
                            fillMode: "flat"
                        }))[0]);

                        elementContent.push(element("span", {
                            className: "k-item-actions",
                            'data-type': 'context-menu',
                        }, [contextMenuButton]));
                    }

                    sheetElements.push(element("li", attr, elementContent));
                }

                kendo.destroy(this._sheetsWrapper());
                this._addButton();
                this._menuButton();
                this._tree.render([ this._createSheetsWrapper(sheetElements, renderScrollButtons)]);
                this._initSheetDropDownButtons();
            },
            _initSheetDropDownButtons: function() {
                let that = this;
                this.element.find("[ref-sheetsbar-more-button]").each(function(ind, btnEl){
                    let el = $(btnEl);
                    let allSheets = that._sheets || [];
                    let visibleSheets = allSheets.filter(sheet => sheet.state() === 'visible');
                    let isSingleVisibleSheet = !that._sheets || that._sheets && visibleSheets.length < 2;
                    let sheetName = el.data("sheetName");
                    let shouldAllowMoveRight = !(isSingleVisibleSheet || (that._sheets && ind == allSheets.length - 1));
                    let shouldAllowMoveLeft = !(isSingleVisibleSheet || (that._sheets && ind === 0));
                    el.kendoDropDownButton({
                        icon: SheetsBar.classNames.sheetsBarMoreIcon,
                        fillMode: "flat",
                        items: [
                            { text: "Delete", icon: "trash", attributes: { "data-command": "delete", "data-sheet-name": sheetName }, enabled: !isSingleVisibleSheet },
                            { text: "Duplicate", icon: "copy", attributes: { "data-command": "duplicate", "data-sheet-name": sheetName } },
                            { text: "Rename", icon: "pencil", attributes: { "data-command": "rename", "data-sheet-name": sheetName } },
                            { text: "Hide", icon: "eye-slash", attributes: { "data-command": "hide", "data-sheet-name": sheetName }, enabled: !isSingleVisibleSheet },
                            { text: "Move Right", icon: "arrow-right", attributes: { "data-command": "move-right", "data-sheet-name": sheetName }, enabled: shouldAllowMoveRight },
                            { text: "Move Left", icon: "arrow-left", attributes: { "data-command": "move-left", "data-sheet-name": sheetName }, enabled: shouldAllowMoveLeft },
                        ],
                        click: that._onSheetContextMenu.bind(that)
                    });
                });
            },
            _createSheetsWrapper: function(sheetElements, renderScrollButtons) {
                var element = kendo.dom.element;
                var classNames = SheetsBar.classNames;
                var itemsWrapper = element('div', { className: 'k-tabstrip-items-wrapper k-hstack' });
                var childrenElements = [element("ul", {
                    className: classNames.sheetsBarKReset,
                    role: "tablist"
                }, sheetElements), null, null];

                renderScrollButtons = true;

                if (renderScrollButtons) {
                    var baseButtonClass = classNames.sheetsBarKButton + EMPTYCHAR + classNames.sheetsBarKButtonBare + EMPTYCHAR;

                    childrenElements[1] = (element("span", { ariaHidden: "true", tabIndex: -1, className: baseButtonClass + classNames.sheetsBarPrev }, [
                        element($(kendo.ui.icon({ icon: classNames.sheetsBarArrowWIcon, iconClass: "k-button-icon" }))[0])
                    ]));

                    childrenElements[2] = (element("span", { ariaHidden: "true", tabIndex: -1, className: baseButtonClass + classNames.sheetsBarNext }, [
                        element($(kendo.ui.icon({ icon: classNames.sheetsBarArrowEIcon, iconClass: "k-button-icon" }))[0])
                    ]));
                }

                itemsWrapper.children = childrenElements;

                return element("div", { className: classNames.sheetsBarItems }, [itemsWrapper]);
            },

            _createSortable: function() {
                var classNames = SheetsBar.classNames;
                this._sortable = new kendo.ui.Sortable(this.element, {
                    filter: `ul li.${classNames.sheetsBarKItem}`,
                    container: DOT + classNames.sheetsBarItems,
                    axis: "x",
                    animation: false,
                    ignore: "input",
                    end: function() {
                        if (this.draggable.hint) {
                            this.draggable.hint.remove();
                        }
                    },
                    hint: function(element) {
                        var hint = $(element).clone().attr("ref-sheetsbar-sortable-hint", "");
                        return hint.wrap("<div class='" + classNames.sheetsBarHintWrapper + "'><ul class='" + classNames.sheetsBarKResetItems + "'></ul></div>").closest("div");
                    }
                });
            },

            _onEditorKeydown: function(e) {
                if (this._editor) {
                    if (e.which === 13) {
                        this._destroyEditor();
                    }

                    if (e.which === 27) {
                        this._destroyEditor(true);
                    }
                }
            },

            _onEditorBlur: function() {
                if (this._editor) {
                    this._destroyEditor();
                }
            },

            _onSheetReorderEnd: function(e) {
                e.preventDefault();
                this.trigger("reorder", { oldIndex: e.oldIndex, newIndex: e.newIndex });
            },

            _onSheetReorderStart: function(e) {
                if (this._editor) {
                    e.preventDefault();
                }
            },
            _onSheetContextMenu: function(e) {
                let sheetName = $(e.target).closest("li").data("sheetName");
                let command = $(e.target).closest("li").data("command");

                if (this._editor) {
                    this._destroyEditor();
                }

                if (sheetName && command) {
                    switch(command) {
                        case "delete":
                            this._onSheetRemove(e);
                            break;
                        case "duplicate":
                            this._onSheetDuplicate(sheetName);
                            break;
                        case "rename":
                            this._renamePrompt(sheetName);
                            break;
                        case "hide":
                            this._hideSheet(sheetName);
                            break;
                        case "move-right":
                            this._moveSheet(sheetName, 1);
                            break;
                        case "move-left":
                            this._moveSheet(sheetName, -1);
                            break;
                    }
                }
            },
            _onSheetDuplicate: function(sheetName) {
                this.trigger("duplicate", { name: sheetName });
            },
            _renamePrompt: function(sheetName) {
                let renameSheetIndex = this._sheets.findIndex(sh => sh.name() == sheetName);
                let closeCallback = function(e) {
                    let dlg = e.sender;
                    if (dlg._newSheetName && dlg._newSheetName !== sheetName) {
                        this.trigger("rename", { name: dlg._newSheetName, sheetIndex: renameSheetIndex });
                    }
                }.bind(this);

                this._openDialog("renameSheet", {
                    close: closeCallback,
                    _oldSheetName: sheetName
                });
            },
            _hideSheet: function(sheetName) {
                this.trigger("hide", { name: sheetName });
            },
            _moveSheet: function(sheetName, direction) {
                let sheetIndex = this._sheets.findIndex(sheet => sheet.name() === sheetName);
                let newSheetIndex = sheetIndex + direction;
                if (newSheetIndex < 0 || newSheetIndex >= this._sheets.length) {
                    return;
                }

                this.trigger("reorder", { oldIndex: sheetIndex, newIndex: newSheetIndex });
            },
            _onSheetRemove: function(e) {
                var removedSheetName = $(e.target).closest("li").data("sheetName");

                if (this._editor) {
                    this._destroyEditor();
                }

                var closeCallback = function(e) {
                    var dlg = e.sender;

                    if (dlg.isConfirmed()) {
                        this.trigger("remove", { name: removedSheetName, confirmation: true });
                    }
                }.bind(this);

                this._openDialog("confirmation", {
                    close: closeCallback
                });
            },

            _onSheetSelect: function(e) {
                var selectedSheetText = $(e.target).text();

                if ($(e.target).is(DOT + SheetsBar.classNames.sheetsBarEditor) || !selectedSheetText) {
                    e.preventDefault();
                    return;
                }

                if (this._editor) {
                    this._destroyEditor();
                }

                this._scrollSheetsToItem($(e.target).closest("li"));
                this.trigger("select", { name: selectedSheetText, isAddButton: false });
            },

            _onSheetRename: function(newSheetName) {
                if (this._sheets[this._selectedIndex].name() === newSheetName || newSheetName === null) {
                    return;
                }

                this.trigger("rename", { name: newSheetName, sheetIndex: this._selectedIndex });
            },

            _onAddSelect: function(ev) {
                ev.sender.element.removeClass("k-focus");
                this.trigger("select", { isAddButton: true });
            },

            _onMenuSelect: function(ev) {
                let sheetName = $(ev.target).closest("li").data("sheetName");
                if (sheetName) {
                    this.trigger("show", { name: sheetName });
                }
            },

            _addButton: function() {
                var classNames = SheetsBar.classNames;
                let addButton = this.element.find("." + classNames.sheetsBarAdd);
                if (!addButton.length) {
                    addButton = $(`<button class="${classNames.sheetsBarAdd}" aria-label="Add new sheet"></button>`).appendTo(this.element);
                } else {
                    kendo.destroy(addButton);
                }

                addButton.kendoButton({
                    icon: classNames.sheetsBarPlusIcon,
                    fillMode: "flat",
                    click: this._onAddSelect.bind(this)
                });
            },
            _menuButton: function() {
                var classNames = SheetsBar.classNames;
                let menuButton = this.element.find("." + classNames.sheetsBarSheetsMenu);
                if (!menuButton.length) {
                    menuButton = $(`<button class="${classNames.sheetsBarSheetsMenu}"></button>`).appendTo(this.element);
                } else {
                    kendo.destroy(menuButton);
                }

                menuButton.kendoDropDownButton({
                    icon: classNames.sheetsBarMenuIcon,
                    fillMode: "flat",
                    items: (this._sheets || []).map(sheet => ({
                        text: sheet.name(),
                        attributes: { 'data-sheet-name': sheet.name() },
                        icon: sheet.state() === 'visible' ? 'eye' : 'eye-slash',
                        cssClass: classNames
                    })),
                    click: this._onMenuSelect.bind(this)
                });
            },

            destroy: function() {
                this._sortable.destroy();
            },

            _scrollableAllowed: function() {
                var options = this.options;
                return options.scrollable && !isNaN(options.scrollable.distance);
            },

            _scrollSheetsToItem: function(item) {
                var that = this;
                var sheetsGroup = that._sheetsGroup();
                var currentScrollOffset = kendo.scrollLeft(sheetsGroup);
                var itemWidth = outerWidth(item);
                var itemOffset = that._isRtl ? item.position().left : item.position().left - sheetsGroup.children().first().position().left;
                var sheetsGroupWidth = sheetsGroup[0].offsetWidth;
                var itemPosition;

                if (that._isRtl) {
                    if (itemOffset < 0) {
                        itemPosition = currentScrollOffset + itemOffset - (sheetsGroupWidth - currentScrollOffset);
                    } else if (itemOffset + itemWidth > sheetsGroupWidth) {
                        itemPosition = currentScrollOffset + itemOffset - itemWidth;
                    }
                } else {
                    if (currentScrollOffset + sheetsGroupWidth < itemOffset + itemWidth) {
                        itemPosition = itemOffset + itemWidth - sheetsGroupWidth;
                    } else if (currentScrollOffset > itemOffset) {
                        itemPosition = itemOffset;
                    }
                }

                sheetsGroup.finish().animate({ "scrollLeft": itemPosition }, "fast", "linear", function() {
                    that._toggleScrollButtons();
                });
            },

            _sheetsGroup: function() {
                return this._sheetsWrapper().find("ul");
            },

            _sheetsWrapper: function() {
                return this.element.find(DOT + SheetsBar.classNames.sheetsBarItems);
            },

            _scrollSheetsByDelta: function(delta) {
                var that = this;
                var sheetsGroup = that._sheetsGroup();
                var scrLeft = kendo.scrollLeft(sheetsGroup);

                sheetsGroup.finish().animate({ "scrollLeft": scrLeft + delta }, "fast", "linear", function() {
                    if (that._nowScrollingSheets) {
                        that._scrollSheetsByDelta(delta);
                    } else {
                        that._toggleScrollButtons();
                    }
                });
            }
        });

        kendo.spreadsheet.SheetsBar = SheetsBar;
        $.extend(true, SheetsBar, { classNames: sheetsBarClassNames });
    })(window.kendo);

(function(kendo) {

        var $ = kendo.jQuery;
        var Widget = kendo.ui.Widget;
        var classNames = {
            details: "k-details",
            button: "k-button",
            detailsSummary: "k-details-summary",
            detailsContent: "k-details-content",
            icon: "k-icon",
            iconCollapseName: "caret-br",
            iconExpandName: "caret-alt-right",
            iconSearchName: "search",
            textbox: "k-textbox",
            wrapper: "k-spreadsheet-filter-menu",
            filterByCondition: "k-spreadsheet-condition-filter",
            filterByValue: "k-spreadsheet-value-filter",
            valuesTreeViewWrapper: "k-spreadsheet-value-treeview-wrapper",
            actionButtons: "k-actions"
        };

        kendo.spreadsheet.messages.filterMenu = {
            all: "All",
            sortAscending: "Sort range A to Z",
            sortDescending: "Sort range Z to A",
            filterByValue: "Filter by value",
            filterByCondition: "Filter by condition",
            apply: "Apply",
            search: "Search",
            addToCurrent: "Add to current selection",
            clear: "Clear",
            blanks: "(Blanks)",
            operatorNone: "None",
            and: "AND",
            or: "OR",
            operators: {
                string: {
                    contains: "Text contains",
                    doesnotcontain: "Text does not contain",
                    startswith: "Text starts with",
                    endswith: "Text ends with",
                    matches: "Text matches",
                    doesnotmatch: "Text does not match"
                },
                date: {
                    eq:  "Date is",
                    neq: "Date is not",
                    lt:  "Date is before",
                    gt:  "Date is after"
                },
                number: {
                    eq: "Is equal to",
                    neq: "Is not equal to",
                    gte: "Is greater than or equal to",
                    gt: "Is greater than",
                    lte: "Is less than or equal to",
                    lt: "Is less than"
                }
            }
        };

        var Details = Widget.extend({
            init: function(element, options) {
                Widget.fn.init.call(this, element, options);

                this.element.addClass(FilterMenu.classNames.details);

                this._summary = this.element.find("." + FilterMenu.classNames.detailsSummary)
                    .on("click", this._toggle.bind(this));

                var iconName = options.expanded ? FilterMenu.classNames.iconCollapseName : FilterMenu.classNames.iconExpandName;
                this._icon = $(kendo.ui.icon(iconName))
                    .prependTo(this._summary);

                this._container = kendo.wrap(this._summary.next(), true);

                if (!options.expanded) {
                    this._container.hide();
                }
            },
            options: {
                name: "Details"
            },
            events: [ "toggle" ],
            visible: function() {
                return this.options.expanded;
            },
            toggle: function(show) {
                var animation = kendo.fx(this._container).expand("vertical");

                animation.stop()[show ? "reverse" : "play"]();
                kendo.ui.icon(this._icon, { icon: show ? FilterMenu.classNames.iconExpandName : FilterMenu.classNames.iconCollapseName });

                this.options.expanded = !show;
            },
            _toggle: function() {
                var show = this.visible();
                this.toggle(show);
                this.trigger("toggle", { show: show });
            }
        });

        kendo.data.binders.spreadsheetFilterValue = kendo.data.Binder.extend({
            init: function(element, bindings, options) {
                kendo.data.Binder.fn.init.call(this, element, bindings, options);

                this._change = this.change.bind(this);
                $(this.element).on("change", this._change);
            },
            refresh: function() {
                var that = this,
                    value = that.bindings.spreadsheetFilterValue.get(); //get the value from the View-Model

                $(that.element).val(value instanceof Date ? "" : value);
            },
            change: function() {
                var value = this.element.value;
                this.bindings.spreadsheetFilterValue.set(value); //update the View-Model
            }
        });

        kendo.data.binders.widget.spreadsheetFilterValue = kendo.data.Binder.extend({
            init: function(widget, bindings, options) {
                kendo.data.Binder.fn.init.call(this, widget.element[0], bindings, options);

                this.widget = widget;
                this._change = this.change.bind(this);
                this.widget.first("change", this._change);
            },
            refresh: function() {
                var binding = this.bindings.spreadsheetFilterValue,
                    value = binding.get(),
                    type = $(this.widget.element).data("filterType");

                if ((type === "date" && value instanceof Date) || (type === "number" && !isNaN(value))) {
                    this.widget.value(value);
                } else {
                    this.widget.value(null);
                }
            },
            change: function() {
                var value = this.widget.value(),
                    binding = this.bindings.spreadsheetFilterValue;

                binding.set(value);
            }
        });

        var templates = {
            filterByValue: (data) =>
                `<div class='${classNames.detailsSummary}'>${data.messages.filterByValue}</div>` +
                `<div class='${classNames.detailsContent}'>` +
                    "<div class='k-searchbox k-input k-input-md k-rounded-md k-input-solid'>" +
                        kendo.ui.icon({ icon: "search", iconClass: "k-input-icon" }) +
                        `<input class='k-input-inner' autocomplete='off' placeholder='${data.messages.search}' data-${data.ns}bind='events: { input: filterValues }' />` +
                    "</div>" +
                    `<div data-${data.ns}bind='visible: hasActiveSearch'><input class='k-checkbox k-checkbox-md k-rounded-md' type='checkbox' data-${data.ns}bind='checked: appendToSearch' id='_${data.guid}'/><label class='k-checkbox-label' for='_${data.guid}'>${data.messages.addToCurrent}</label></div>` +
                    `<div class='${classNames.valuesTreeViewWrapper}'>` +
                        `<div data-${data.ns}role='treeview' ` +
                            `bind:data-${data.ns}checkboxes='checkboxesConfig' `+
                            `data-${data.ns}bind='source: valuesDataSource, events: { check: valuesChange, select: valueSelect }' `+
                            "></div>" +
                    "</div>" +
                "</div>",
            filterByCondition: (data) =>
                `<div class='${classNames.detailsSummary}'>${data.messages.filterByCondition}</div>` +
                `<div class='${classNames.detailsContent}'>` +
                    '<div>' +
                        '<select ' +
                            `aria-label="${data.messages.filterByCondition}" ` +
                            `data-${data.ns}role="dropdownlist"` +
                            `data-${data.ns}bind="value: operator, source: operators, events: { change: operatorChange } "` +
                            `data-${data.ns}value-primitive="false"` +
                            `data-${data.ns}option-label="${data.messages.operatorNone}"` +
                            `data-${data.ns}height="auto"` +
                            `data-${data.ns}text-field="text"` +
                            `data-${data.ns}value-field="unique">`+
                        '</select>'+
                    '</div>' +

                    `<div data-${data.ns}bind="visible: isString">` +
                        `<input aria-label="string-value" data-filter-type="string" data-${data.ns}bind="spreadsheetFilterValue: customFilter.criteria[0].value" class="k-textbox" />`+
                    '</div>' +

                    `<div data-${data.ns}bind="visible: isNumber">` +
                        `<input aria-label="number-value" data-filter-type="number" data-${data.ns}role="numerictextbox" data-${data.ns}bind="spreadsheetFilterValue: customFilter.criteria[0].value" />`+
                    '</div>' +

                    `<div data-${data.ns}bind="visible: isDate">` +
                        `<input aria-label="date-value" data-filter-type="date" data-${data.ns}role="datepicker" data-${data.ns}bind="spreadsheetFilterValue: customFilter.criteria[0].value" />`+
                    '</div>' +
                "</div>",
            menuItem: (data) =>
                `<li data-command='${data.command}' data-dir='${data.dir}'>` +
                    `${kendo.ui.icon(data.iconClass)}${data.text}` +
                "</li>",
            actionButtons: (data) =>
                `<button data-${data.ns}bind='click: apply' class='k-button k-button-md k-rounded-md k-button-solid k-button-solid-primary'><span class='k-button-text'>${data.messages.apply}</span></button>` +
                `<button data-${data.ns}bind='click: clear' class='k-button k-button-md k-rounded-md k-button-solid k-button-solid-base'><span class='k-button-text'>${data.messages.clear}</span></button>`
        };

        function distinctValues(values) {
            var hash = {};
            var result = [];

            for (var i = 0; i < values.length; i++) {
                if (!hash[values[i].value]) {
                    hash[values[i].value] = values[i];
                    result.push(values[i]);
                } else if (!hash[values[i].value].checked && values[i].checked) {
                    hash[values[i].value].checked = true;
                }
            }

            return result;
        }

        function filter(dataSource, query) {
            var hasVisibleChildren = false;
            var data = dataSource instanceof kendo.data.HierarchicalDataSource && dataSource.data();
            var valuesFilter = this;
            var values = this.values;
            for (var i = 0; i < data.length; i++) {
                var item = data[i];
                var text = item.text.toString().toLocaleLowerCase(kendo.culture().name);
                var itemVisible = query === true || query === "" || text.indexOf(query) >= 0;
                var filterSpread = filter.bind(valuesFilter);
                var anyVisibleChildren = filterSpread(item.children, query); // pass true if parent matches

                hasVisibleChildren = hasVisibleChildren || anyVisibleChildren || itemVisible;
                item.hidden = !itemVisible && !anyVisibleChildren;

                if (query.length || (values && !values.length)) {
                    item.checked = !item.hidden;
                } else if (values && values.indexOf(item.text) != -1){
                    item.checked = true;
                }
            }

            if (data) {
                // re-apply filter on children
                dataSource.filter({ field: "hidden", operator: "neq", value: true });
            }

            return hasVisibleChildren;
        }

        function uncheckAll(dataSource) {
            var data = dataSource instanceof kendo.data.HierarchicalDataSource && dataSource.data();

            for (var i = 0; i < data.length; i++) {
                var item = data[i];
                item.checked = false;

                if (item.hasChildren) {
                    uncheckAll(item.children);
                }
            }
        }

        var FilterMenuViewModel = kendo.spreadsheet.FilterMenuViewModel = kendo.data.ObservableObject.extend({
            valuesChange: function(e) {
                var dataSource = e ? e.sender.dataSource : this.valuesDataSource;
                var checked = function(item) {
                    return item.checked;
                };
                var value = function(item) {
                    return item.dataType === "date" ? kendo.spreadsheet.dateToNumber(item.value) : item.value;
                };
                var unique = function(value, index, array) {
                    return array.lastIndexOf(value) === index;
                };
                var data = dataSource.data();
                var values = data.toJSON()[0].items;
                var blanks = values.filter(function(item) {
                    return item.dataType === "blank";
                });

                blanks = blanks.length ? blanks[0].checked : false;
                values = values.filter(checked).map(value);

                if (this.appendToSearch && this.valueFilter && this.valueFilter.values.length) {
                    values = values.concat(this.valueFilter.values.toJSON()).sort().filter(unique);
                }

                this.set("valueFilter", {
                    values: values,
                    blanks: blanks
                });
            },
            valueSelect: function(e) {
                e.preventDefault();

                var node = e.sender.dataItem(e.node);
                node.set("checked", !node.checked);
            },
            hasActiveSearch: false,
            appendToSearch: false,
            filterValues: function(e) {
                var query = typeof e == "string" ? e : $(e.target).val().toLocaleLowerCase(kendo.culture().name);
                var dataSource = this.valuesDataSource;

                this.set("hasActiveSearch", !!query);

                var filterSpread = filter.bind(this.valueFilter);
                uncheckAll(dataSource);
                filterSpread(dataSource, query);
            },
            reset: function() {
                this.set("customFilter", { logic: "and", criteria: [ { operator: null, value: null } ] });
                this.set("valueFilter", { values: [] });
            },
            operatorChange: function(e) {
                var dataItem = e.sender.dataItem();
                this.set("operatorType", dataItem.type);

                // https://github.com/telerik/kendo-ui-core/issues/3317 - when switching from Value
                // filter to “filter by condition”, the customFilter property is lost.
                if (!this.get("customFilter")) {
                    this.reset();
                }

                this.set("customFilter.criteria[0].operator", dataItem.value);
            },
            isNone: function() {
                return this.get("operatorType") === undefined;
            },
            isString: function() {
                return this.get("operatorType") === "string";
            },
            isNumber: function() {
                return this.get("operatorType") === "number";
            },
            isDate: function() {
                return this.get("operatorType") === "date";
            }
        });

        function flattenOperators(operators) {
            var messages = kendo.spreadsheet.messages.filterMenu.operators;
            var result = [];
            for (var type in operators) {
                if (!operators.hasOwnProperty(type)) {
                    continue;
                }

                for (var operator in operators[type]) {
                    if (!operators[type].hasOwnProperty(operator)) {
                        continue;
                    }

                    result.push({
                        text: messages[type][operator],
                        value: operator,
                        unique: type + "_" + operator,
                        type: type
                    });
                }
            }
            return result;
        }

        var FilterMenuController = kendo.spreadsheet.FilterMenuController = {
            valuesTree: function(range, column) {
                return [{
                    text: kendo.spreadsheet.messages.filterMenu.all,
                    expanded: true,
                    checked: false,
                    items: this.values(range.resize({ top: 1 }), column)
                }];
            },
            values: function(range, column) {
                var values = [];
                var messages = kendo.spreadsheet.messages.filterMenu;
                var columnRange = range.column(column);
                var sheet = range.sheet();

                columnRange.forEachCell(function(row, col, cell) {
                    var checked = true;
                    if (sheet.isHiddenRow(row)) {
                        checked = false;
                    }

                    var value = cell.value;
                    var dataType = cell.dataType;
                    var text = cell.text;

                    if (value === undefined) {
                        dataType = "blank";
                    } else if (cell.format) {
                        dataType = kendo.spreadsheet.formatting.type(value, cell.format);
                    } else {
                        dataType = typeof value;
                    }

                    if (value !== null && cell.format) {
                        text = kendo.spreadsheet.formatting.text(value, cell.format);
                    } else {
                        text = dataType == "blank" ? messages.blanks : value;
                    }

                    if (dataType === "percent" || dataType === "currency") { //treat percent as number
                        dataType = "number";
                    }

                    if (dataType === "date") {
                        value = kendo.spreadsheet.numberToDate(value);
                    }

                    values.push({
                        dataType: dataType,
                        value: value,
                        text: text,
                        checked: checked
                    });
                });

                values = distinctValues(values);

                values.sort(function(a, b) {
                    if (a.dataType === b.dataType) {
                        return 0;
                    }

                    if (a.dataType === "blank" || b.dataType === "blank") {
                        return a.dataType === "blank" ? -1 : 1;
                    }

                    if (a.dataType === "number" || b.dataType === "number") {
                        return a.dataType === "number" ? -1 : 1;
                    }

                    if (a.dataType === "date" || b.dataType === "date") {
                        return a.dataType === "date" ? -1 : 1;
                    }

                    return 0;
                });

                return values;
            },

            filterType: function(range, column) {
                // 1. try to infer type from current filter
                var sheet = range.sheet();
                var filter = this.filterForColumn(column, sheet);
                var type;

                filter = filter && filter.filter.toJSON();

                if (filter && filter.filter == "custom") {
                    var value = filter.criteria[0].value;

                    if (value instanceof Date) {
                        type = "date";
                    } else if (typeof value == "string") {
                        type = "string";
                    } else if (typeof value == "number") {
                        type = "number";
                    }
                }

                if (!type) {
                    // 2. try to infer type from column data
                    var topValue = this.values(range.row(1), column)[0];
                    type = topValue && topValue.dataType;

                    if (type == "blank") {
                        type = null;
                    }
                }

                return type;
            },

            filterForColumn: function(column, sheet) {
                var allFilters = sheet.filter();
                var filters;

                if (allFilters) {
                    filters =  allFilters.columns.filter(function(item) {
                        return item.index === column;
                    })[0];
                }

                return filters;
            },

            filter: function(column, sheet) {
                var columnFilters = this.filterForColumn(column, sheet);

                if (!columnFilters) {
                    return;
                }

                var options = columnFilters.filter.toJSON();
                var type = options.filter;

                delete options.filter;

                var result = {
                    type: type,
                    options: options
                };

                var criteria = options.criteria;
                if (criteria && criteria.length) {
                    result.operator = criteria[0].operator;
                }

                return result;
            }
        };

        var FilterMenu = Widget.extend({
            init: function(element, options) {
                Widget.call(this, element, options);

                this.element.addClass(FilterMenu.classNames.wrapper);

                this.viewModel = new FilterMenuViewModel({
                    active: "value",
                    checkboxesConfig: { checkChildren: true },
                    operator: null,
                    operators: flattenOperators(this.options.operators),
                    clear: this.clear.bind(this),
                    apply: this.apply.bind(this)
                });

                this._filterInit();
                this._popup();
                this._sort();
                this._filterByCondition();
                this._filterByValue();
                this._actionButtons();
            },

            options: {
                name: "FilterMenu",
                column: 0,
                range: null,
                operators: {
                    string: {
                        contains: "Text contains",
                        doesnotcontain: "Text does not contain",
                        startswith: "Text starts with",
                        endswith: "Text ends with",
                        matches: "Text matches",
                        doesnotmatch: "Text does not match"
                    },
                    date: {
                        eq:  "Date is",
                        neq: "Date is not",
                        lt:  "Date is before",
                        gt:  "Date is after"
                    },
                    number: {
                        eq: "Is equal to",
                        neq: "Is not equal to",
                        gte: "Is greater than or equal to",
                        gt: "Is greater than",
                        lte: "Is less than or equal to",
                        lt: "Is less than"
                    }
                }
            },

            events: [
                "action"
            ],

            destroy: function() {
                Widget.fn.destroy.call(this);

                this.menu.destroy();
                this.valuesTreeView.destroy();
                this.popup.destroy();
            },

            openFor: function(anchor, event) {
                if ($(anchor).hasClass("k-spreadsheet-view-size")) {
                    // on touch devices this element will sit above to
                    // enable scrolling; it's not useful as an anchor,
                    // use event coords instead.
                    this.popup.open(event.pageX, event.pageY);
                } else {
                    this.popup.setOptions({ anchor: anchor });
                    this.popup.open();
                }
            },

            close: function() {
                this.popup.close();
            },

            clear: function() {
                this.action({
                    command: "ClearFilterCommand",
                    options: {
                        column: this.options.column
                    }
                });
                this.viewModel.reset();
                this.close();
            },

            apply: function() {
                this._active();

                var options = {
                    operatingRange: this.options.range,
                    column: this.options.column
                };

                var valueFilter;
                var customFilter;

                if (this.viewModel.active === "value") {
                    this.viewModel.valuesChange({ sender: this.valuesTreeView });
                    valueFilter = this.viewModel.valueFilter.toJSON();

                    if (valueFilter.blanks || (valueFilter.values && valueFilter.values.length)) {
                        options.valueFilter = valueFilter;
                    }
                } else if (this.viewModel.active === "custom") {
                    customFilter = this.viewModel.customFilter.toJSON();

                    if (customFilter.criteria.length && customFilter.criteria[0].value !== null) {
                        options.customFilter = customFilter;
                    }
                }

                if (options.valueFilter || options.customFilter) {
                    this.action({ command: "ApplyFilterCommand", options: options });
                }
            },

            action: function(options) {
                this.trigger("action", $.extend({ }, options));
            },

            _filterInit: function() {
                var column = this.options.column;
                var range = this.options.range;
                var sheet = range.sheet();
                var activeFilter = FilterMenuController.filter(column, sheet);

                if (activeFilter) {
                    var filterType = FilterMenuController.filterType(range, column);

                    this.viewModel.set("active", activeFilter.type);
                    this.viewModel.set(activeFilter.type + "Filter", activeFilter.options);

                    if (activeFilter.type == "custom") {
                        this.viewModel.set("operator", filterType + "_" + activeFilter.operator);
                        this.viewModel.set("operatorType", filterType);
                    }
                } else {
                    this.viewModel.reset();
                }
            },

            _popup: function() {
                this.popup = this.element.kendoPopup({
                    copyAnchorStyles: false
                }).data("kendoPopup");
            },

            _sort: function() {
                var template = kendo.template(FilterMenu.templates.menuItem);
                var messages = kendo.spreadsheet.messages.filterMenu;
                var items = [
                    { command: "sort", dir: "asc", text: messages.sortAscending, iconClass: "sort-asc" },
                    { command: "sort", dir: "desc", text: messages.sortDescending, iconClass: "sort-desc" }
                ];

                var ul = $("<ul></ul>", {
                    "html": kendo.render(template, items)
                }).appendTo(this.element);

                this.menu = ul.kendoMenu({
                    orientation: "vertical",
                    select: function(e) {
                        var dir = $(e.item).data("dir");
                        var range = this.options.range.resize({ top: 1 });
                        var options = {
                            value: dir,
                            sheet: false,
                            operatingRange: range,
                            column: this.options.column
                        };

                        this.action({ command: "SortCommand", options: options });
                    }.bind(this)
                }).data("kendoMenu");
            },

            _appendTemplate: function(template, className, details, expanded) {
                var compiledTemplate = kendo.template(template);
                var wrapper = $("<div class='" + className + "'/>").html(compiledTemplate({
                    messages: kendo.spreadsheet.messages.filterMenu,
                    guid: kendo.guid(),
                    ns: kendo.ns
                }));

                this.element.append(wrapper);

                if (details) {
                    details = new Details(wrapper, { expanded: expanded, toggle: this._detailToggle.bind(this) });
                }

                kendo.bind(wrapper, this.viewModel);

                return wrapper;
            },

            _detailToggle: function(e) {
                this.element
                    .find("[" + kendo.attr("role") + "=details]")
                    .not(e.sender.element)
                    .data("kendoDetails")
                    .toggle(!e.show);
            },

            _filterByCondition: function() {
                var isExpanded = this.viewModel.active === "custom";
                this._appendTemplate(FilterMenu.templates.filterByCondition, FilterMenu.classNames.filterByCondition, true, isExpanded);
            },

            _filterByValue: function() {
                var isExpanded = this.viewModel.active === "value";
                var wrapper = this._appendTemplate(FilterMenu.templates.filterByValue, FilterMenu.classNames.filterByValue, true, isExpanded);

                this.valuesTreeView = wrapper.find("[" + kendo.attr("role") + "=treeview]").data("kendoTreeView");

                var values = FilterMenuController.valuesTree(this.options.range, this.options.column);

                this.viewModel.set("valuesDataSource", new kendo.data.HierarchicalDataSource({ data: values, accentFoldingFiltering: kendo.culture().name }));
            },

            _actionButtons: function() {
                this._appendTemplate(FilterMenu.templates.actionButtons, FilterMenu.classNames.actionButtons, false);
            },

            _active: function() {
                var activeContainer = this.element.find("[" + kendo.attr("role") + "=details]").filter(function(index, element) {
                    return $(element).data("kendoDetails").visible();
                });

                if (activeContainer.hasClass(FilterMenu.classNames.filterByValue)) {
                    this.viewModel.set("active", "value");
                } else if (activeContainer.hasClass(FilterMenu.classNames.filterByCondition)) {
                    this.viewModel.set("active", "custom");
                }
            }
        });

        kendo.spreadsheet.FilterMenu = FilterMenu;
        $.extend(true, FilterMenu, { classNames: classNames, templates: templates });

    })(window.kendo);

(function(kendo) {

    kendo.spreadsheet.messages.workbook = {
        defaultSheetName: "Sheet"
    };

    kendo.spreadsheet.messages.view = {
        nameBox: "Name Box",
        formulaInput: "Formula Input",
        errors: {
            openUnsupported: "Unsupported format. Please select an .xlsx file.",
            shiftingNonblankCells: "Cannot insert cells due to data loss possibility. Select another insert location or delete the data from the end of your worksheet.",
            insertColumnWhenRowIsSelected: "Cannot insert column when all columns are selected.",
            insertRowWhenColumnIsSelected: "Cannot insert row when all rows are selected.",
            filterRangeContainingMerges: "Cannot create a filter within a range containing merges",
            sortRangeContainingMerges: "Cannot sort a range containing merges",
            cantSortMultipleSelection: "Cannot sort multiple selection",
            cantSortNullRef: "Cannot sort empty selection",
            cantSortMixedCells: "Cannot sort range containing cells of mixed shapes",
            validationError: "The value that you entered violates the validation rules set on the cell.",
            cannotModifyDisabled: "Cannot modify disabled cells.",
            insertRowBelowLastRow: "Cannot insert row below the last row.",
            insertColAfterLastCol: "Cannot insert column to the right of the last column."
        },
        tabs: {
            file: "File",
            home: "Home",
            insert: "Insert",
            format: "Format",
            data: "Data",
            view: "View"
        }
    };

    kendo.spreadsheet.messages.menus = {
        "cut": "Cut",
        "copy": "Copy",
        "paste": "Paste",
        "merge": "Merge",
        "unmerge": "Unmerge",
        "delete": "Delete",
        "hide": "Hide",
        "unhide": "Unhide",
        "bringToFront": "Bring to front",
        "sendToBack": "Send to back"
    };
})(window.kendo);

(function(kendo) {
    let $ = kendo.jQuery;

    if (kendo.PDFMixin) {
        let override_drawPDF = function(options) {
            var result = new $.Deferred();
            var callback = function(group) {
                result.resolve(group);
            };
            switch(options.area) {
            case "workbook":
                options.workbook.draw(options, callback);
                break;
            case "sheet":
                options.workbook.activeSheet().draw(options, callback);
                break;
            case "selection":
                options.workbook.activeSheet().selection().draw(options, callback);
                break;
            }

            return result.promise();
        };

         let overrideSaveAsPDF = function(options) {
            if (this.events.indexOf("pdfExport") === -1) {
                kendo.PDFMixin.extend(this);
                this.saveAsPDF = overrideSaveAsPDF;
                this._drawPDF = override_drawPDF;
            }

            var progress = new $.Deferred();
            var promise = progress.promise();
            var args = { promise: promise };
            if (this.trigger("pdfExport", args)) {
                return;
            }

            this._drawPDF(options, progress)
            .then(function(root) {
                let pdfResultPromise = options.forceProxy
                    ? kendo.pdf.exportPDF(root) // produce data URI for proxy
                    : kendo.pdf.exportPDFToBlob(root);
                return kendo.convertPromiseToDeferred(pdfResultPromise);
            })
            .done(function(dataURI) {
                kendo.saveAs({
                    dataURI: dataURI,
                    fileName: options.fileName,
                    proxyURL: options.proxyURL,
                    forceProxy: options.forceProxy,
                    proxyTarget: options.proxyTarget
                });

                progress.resolve();
            })
            .fail(function(err) {
                progress.reject(err);
            });

            return promise;
        };

        kendo.spreadsheet.Workbook.prototype.saveAsPDF = overrideSaveAsPDF;

        kendo.spreadsheet.Workbook.prototype._drawPDF = override_drawPDF;
    }
})(kendo);

const __meta__ = {
    id: "spreadsheet",
    name: "Spreadsheet",
    category: "web",
    description: "Spreadsheet component",
    depends: [
        "core", "binder", "colorpicker", "combobox", "data", "dom", "dropdownlist",
        "menu", "ooxml", "popup", "sortable", "toolbar", "treeview",
        "window", "validator", "excel", "pdf", "drawing", "list", "spreadsheet.common"]
};

(function(kendo, undefined$1) {
    if (kendo.support.browser.msie && kendo.support.browser.version < 9) {
        return;
    }

    const K_ACTIVE = "k-active";
    let $ = kendo.jQuery;
    let Widget = kendo.ui.Widget;
    let NS = ".kendoSpreadsheet";
    let DOT = ".";
    let commonEngine = kendo.spreadsheet.commonEngine;
    let FormulaInput = kendo.spreadsheet.FormulaInput;
    let SheetsBar = kendo.spreadsheet.SheetsBar;

    function toActionSelector(selectors) {
        return selectors.map(function(action) {
            return '[data-action="' + action + '"]';
        }).join(",");
    }

    function convertSpreadsheetDeferredToJQueryDeferred(spreadsheetDeferred) {
        const deferred = $.Deferred();

        spreadsheetDeferred.then(
            function(value) { deferred.resolve(value); },
            function(reason) { deferred.reject(reason); }
        );

        if (typeof spreadsheetDeferred.progress === "function") {
            spreadsheetDeferred.progress(function(val) {
                deferred.notify(val);
            });
        }

        const promise = deferred.promise();
        promise.progress = function(fn) {
            deferred.progress(fn);
            return promise;
        };
        return promise;
    }

    function removeEventsFromOptions(options, eventNames) {
        const sanitized = {};
        for (let key in options) {
            if (options.hasOwnProperty(key) && eventNames.indexOf(key) === -1) {
                sanitized[key] = options[key];
            }
        }
        return sanitized;
    }

    let COMPOSITE_UNAVAILABLE_ACTION_SELECTORS = toActionSelector(['cut', 'copy', 'paste', 'insert-left', 'insert-right', 'insert-above', 'insert-below']);
    let UNHIDE_ACTION_SELECTORS = toActionSelector(['unhide-row', 'unhide-column']);
    let classNames = {
        wrapper: "k-spreadsheet"
    };

    let viewClassNames = commonEngine.View.classNames;

    const SPREADSHEET_CONTENT_HTML_TEMPLATE = ({ messages }) => `
                            <div ref-header-container class="k-spreadsheet-header"><div ref-header-menu></div><div ref-header-toolbar></div></div>
                            <div class="k-spreadsheet-action-bar">
                                <div class="k-spreadsheet-name-editor">
                                    <input ref-namebox-input title="${messages.nameBox || "Name Box"}" aria-label="${messages.nameBox || "Name Box"}"></input>
                                </div>
                                <div class="k-spreadsheet-formula-bar">
                                    ${kendo.ui.icon("formula-fx")}
                                    <div class="k-spreadsheet-formula-input"
                                        role="combobox"
                                        title="${messages.view.formulaInput}"
                                        aria-haspopup="menu"
                                        aria-expanded="false"
                                        contentEditable="true"
                                        spellCheck="false">
                                    </div>
                                </div>
                            </div>
                            <div class="k-spreadsheet-view">
                                <div class="k-spreadsheet-fixed-container"></div>
                                <div class="k-spreadsheet-scroller">
                                    <div class="k-spreadsheet-view-size"></div>
                                </div>
                                <div tabIndex="0" class="k-spreadsheet-clipboard" contentEditable="true" ></div>
                                <div contentEditable="true"
                                    spellCheck="false"
                                    role="combobox"
                                    title="${messages.view.formulaInput}"
                                    aria-haspopup="menu"
                                    aria-expanded="false"
                                    class="k-spreadsheet-formula-input k-spreadsheet-cell-editor">
                                </div>
                            </div>
                            <div ref-sheets-bar></div>`;

    const CELL_CONTEXT_MENU = ({ messages }) => `
                    <ul class="${viewClassNames.cellContextMenu}">
                        <li data-action="cut">${messages.menus.cut}</li>
                        <li data-action="copy">${messages.menus.copy}</li>
                        <li data-action="paste">${messages.menus.paste}</li>
                        <li class="k-separator"></li>
                        <li data-action="merge">${messages.menus.merge}</li>
                        <li data-action="unmerge">${messages.menus.unmerge}</li>
                    </ul>`;

    const ROW_HEADER_CONTEXT_MENU = ({ messages }) => `
                    <ul class="${viewClassNames.rowHeaderContextMenu}">
                        <li data-action="cut">${messages.menus.cut}</li>
                        <li data-action="copy">${messages.menus.copy}</li>
                        <li data-action="paste">${messages.menus.paste}</li>
                        <li class="k-separator"></li>
                        <li data-action="delete-row">${messages.menus.delete}</li>
                        <li data-action="hide-row">${messages.menus.hide}</li>
                        <li data-action="unhide-row">${messages.menus.unhide}</li>
                    </ul>`;

    const COL_HEADER_CONTEXT_MENU = ({ messages }) => `
                    <ul class="${viewClassNames.colHeaderContextMenu}">
                        <li data-action="cut">${messages.menus.cut}</li>
                        <li data-action="copy">${messages.menus.copy}</li>
                        <li data-action="paste">${messages.menus.paste}</li>
                        <li class="k-separator"></li>
                        <li data-action="delete-column">${messages.menus.delete}</li>
                        <li data-action="hide-column">${messages.menus.hide}</li>
                        <li data-action="unhide-column">${messages.menus.unhide}</li>
                    </ul>`;

    const DRAWING_CONTEXT_MENU = ({ messages }) => `
                    <ul class="${viewClassNames.drawingContextMenu}">
                        <li data-action="bring-to-front">${messages.menus.bringToFront}</li>
                        <li data-action="send-to-back">${messages.menus.sendToBack}</li>
                        <li class="k-separator"></li>
                        <li data-action="delete-drawing">${messages.menus.delete}</li>
                    </ul>`;

    kendo.spreadsheet.ContextMenu = kendo.ui.ContextMenu;

    let FormulaInputStaticList = kendo.ui.StaticList.extend({
        data: function(d) {
            return this.dataSource.data(d);
        },
        itemClick: function(handler) {
            this.bind("change", function(ev) { handler(this.value()[0]); });
        }
    });

    class FormulaInputRefArgs {
        constructor({ list, popup }) {
            this.current = { list, popup };
            this.clone = function clone() {
                return this;
            };
        }
    }

    class NameBoxRefArgs {
        constructor({ nameEditor, container }) {
            let combo = this.initializeComboBox(container, nameEditor);
            this.current = {
                value: (val) => {
                    if (val === undefined$1) {
                        const item = combo.value();
                        return item ? (item.name || item) : item;
                    } else {
                        combo.value(val || '');
                    }
                }
            };

            this.nameEditor = nameEditor;

            this.clone = function clone() {
                return this;
            };
        }

        initializeComboBox(container) {
            let that = this;
            let dataSource = new kendo.data.DataSource({
                transport: {
                    read: function(options) {
                        let data = that.nameEditor()?.readData() || [];
                        options.success(data);
                    },
                    cache: false
                }
            });

            let combo = $(container).kendoComboBox({
                clearButton: false,
                dataTextField: "name",
                dataValueField: "name",
                template: ({ name }) => `${kendo.htmlEncode(name)}<a role='button' class='k-button-delete' href='\\#'>${kendo.ui.icon("x")}</a>`,
                dataSource: dataSource,
                autoBind: false,
                ignoreCase: true,
                change: that.onChange.bind(that),
                noDataTemplate: () => "<div></div>",
                open: function() {
                    dataSource.read();
                }
            }).data("kendoComboBox");

            combo.input
                .on("keydown", that.onKeyDown.bind(this));
            combo.popup.element
                .addClass("k-spreadsheet-names-popup")

                .on("mousemove", function(ev) {
                    // XXX: should remove this when we find a better
                    // solution for the popup closing as we hover the
                    // resize handles.
                    ev.stopPropagation();
                })

                .on("click", ".k-button-delete", function(ev) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    let item = $(ev.target).closest(".k-list-item");
                    item = combo.dataItem(item);
                    that.onDelete(item.name);
                });

            return combo;
        }

        // Event: Handle change in ComboBox
        onChange(event) {
            const editor = this.nameEditor();
            if (editor && event.sender.value()) {
                editor.trigger("select", { name: event.sender.value() });
            }
        }

        // Event: Delete button click within item
        onDelete(name) {
            this.nameEditor()?.trigger("delete", { name });
        }

        // Handling keyboard events like Enter, Escape
        onKeyDown(event) {
            const editor = this.nameEditor();
            if (editor) {
                if (event.key === 'Enter') {
                    const name = event.target.value;
                    editor.trigger("enter", { value: name });
                } else if (event.key === 'Escape') {
                    editor.trigger("cancel");
                }
            }
        }
    }

    let Spreadsheet = kendo.ui.Widget.extend({
        _renderInnerContent: function(element) {
            $(element).append(SPREADSHEET_CONTENT_HTML_TEMPLATE(this.options));
        },
        init: function(element, options) {
            let that = this;
            Widget.fn.init.call(this, element, options);

            this.options.messages = $.extend(true, {
                view: kendo.spreadsheet.messages.view,
                tabs: kendo.spreadsheet.messages.view.tabs,
                menus: kendo.spreadsheet.messages.menus,
                workbook: {
                    defaultSheetName: "Sheet",
                }
            }, this.options.messages);

            this.element.addClass(Spreadsheet.classNames.wrapper);
            this.element.attr("role", "application");
            this._renderInnerContent(this.element);

            this._createFormulaInputs();

            that.spreadsheetRef = this._initSpreadsheetWidget();

            this._bindWorkbookEvents();

            const activeSheet = this.activeSheet();
            this._onUpdateTools({ range: activeSheet.range(activeSheet.activeCell()) });

            this._resizeHandler = function() { that.resize(); };
            $(window).on("resize" + NS, this._resizeHandler);

            if (this._showWatermarkOverlay) {
                this._showWatermarkOverlay(this.element[0]);
            }
        },
        _initSpreadsheetWidget: function() {
            const that = this;
            const options = removeEventsFromOptions(that.options, that.events);

            let widgetOptions = $.extend({},
                options, {
                sheetsbar: that.options.sheetsbar != false ? that.options.sheetsbar : {},
                formulaBarInputRef: new FormulaInputRefArgs({
                    list: this._formulaBarInputRefList,
                    popup: this._formulaBarInputRefPopup
                }),
                formulaCellInputRef: new FormulaInputRefArgs({
                    list: this._formulaCellInputRefList,
                    popup: this._formulaCellInputRefPopup
                }),
                nameBoxRef: new NameBoxRefArgs({
                    container: that.element.find('.k-spreadsheet-name-editor [ref-namebox-input]'),
                    nameEditor: function() {
                        return that.spreadsheetRef?.view.nameEditor;
                    }
                }),
                createFilterMenu: function(options) {
                    let element = $("<div></div>").appendTo(that.element);
                    return new kendo.spreadsheet.FilterMenu(element, options);
                },
                createTabStrip: function(options) {
                    if (that.options.toolbar) {
                        that._initHeader();

                        return {
                            focus: function() { that.menu.wrapper.trigger("focus"); },
                            select: function(name) { that.menu.element.find(`li[ref-tab-name="${name}"]`).click(); },
                            destroy: function() { that.menu.destroy(); }
                        };
                    }
                },
                createSheetEditor: function(options) {
                    that.sheetsBar._createEditor();
                },
                createSheetBar: function(openDialogCallback) {
                    that._sheetsBar(openDialogCallback);
                },
                createContextMenus: function(options) {
                    that._dialogs = [];
                    that._initContextMenus();
                },
                createSheetDataSource: function(dataSource) {
                    return kendo.data.DataSource.create(dataSource);
                },
                getWorkbookCommand: function(commandName, commandOptions) {
                    return new kendo.spreadsheet[commandName](commandOptions);
                },
                getIconHTMLString: function(iconName) {
                    return $(kendo.ui.icon(iconName))[0];
                },
                update: function(e) {
                    that._onUpdateTools(e);
                    if (e.reason.sheetSelection && that.sheetsBar) {
                        that.sheetsBar.renderSheets(e.sender.sheets(), e.sender.sheetIndex(e.sheet));
                    }
                },
                message: (args) => {
                    // exclude these properties from the options
                    let { sender, name, ref, range, ...dialogOptions } = args;
                    let opts = $.extend({}, { pdfExport: that.options.pdf, excelExport: that.options.excel }, dialogOptions);
                    let dialog = kendo.spreadsheet.dialogs.create(args.name, opts);
                    const saveAsCallback = function(data, fileName, exportOptions) {
                        kendo.saveAs({ dataURI: data, fileName, ...exportOptions });
                    };


                    if (dialog) {
                        dialog.bind("action", function(args) {
                            if (args.command == "SaveAsCommand") {
                                let { sender, ...commandArgs } = args;
                                let fileName = args.options.name + args.options.extension;
                                if (args.options.extension === ".xlsx") {
                                    return that.spreadsheetRef.saveAsExcel($.extend(commandArgs, {
                                        fileName: fileName,
                                        Workbook: kendo.ooxml.Workbook,
                                        saveAs: saveAsCallback
                                    }));
                                } else if (this.options.extension === ".pdf") {
                                    return that.spreadsheetRef.saveAsPDF($.extend(args.options.pdf, { workbook: this.options.workbook, fileName: fileName }));
                                }
                            }

                            that.spreadsheetRef.executeCommand(args);
                        });

                        dialog.bind("deactivate", () => {
                            dialog.destroy();
                            that._dialogs.pop();
                        });

                        that._dialogs.push(dialog);

                        dialog.open(args.range, args);
                        args.dialog = dialog;
                    }
                },
                contextmenu: (e) => {
                    const { objectRef, targetType, showUnhide, showUnmerge, originalEvent, isComposite } = e;
                    const selection = e.sender.activeSheet().select();
                    const { topLeft, bottomRight } = selection;

                    this._cellContextMenu.close();
                    this._colHeaderContextMenu.close();
                    this._rowHeaderContextMenu.close();
                    this._drawingContextMenu.close();

                    let menu;

                    if (targetType == "columnheader") {
                        menu = this._colHeaderContextMenu;
                    } else if (targetType == "rowheader") {
                        menu = this._rowHeaderContextMenu;
                    } else if (targetType == "drawing") {
                        menu = this._drawingContextMenu;
                    } else {
                        menu = this._cellContextMenu;
                    }

                    menu.element.find(COMPOSITE_UNAVAILABLE_ACTION_SELECTORS).toggle(!isComposite);
                    menu.element.find(UNHIDE_ACTION_SELECTORS).toggle(showUnhide);
                    menu.element.find('[data-action=unmerge]').toggle(showUnmerge);

                    // avoid the immediate close
                    setTimeout(function() {
                        menu.open(e.originalEvent.pageX, e.originalEvent.pageY);
                    });
                },
                locale: kendo.cultures.current.name,
                intl: kendo.kendoCultureToIntl(),
            });

            return new kendo.spreadsheet.commonEngine.SpreadsheetWidget(this.element[0], widgetOptions);
        },
        _createFormulaInputs: function() {
            let formulaBarInputRefElement = this.element.find('.k-spreadsheet-action-bar .k-spreadsheet-formula-input');
            let formulaBarInputRefListId = kendo.guid();
            formulaBarInputRefElement.attr("aria-controls", formulaBarInputRefListId);

            this._formulaBarInputRefList = new FormulaInputStaticList($(`<ul id="${formulaBarInputRefListId}" />`)
                .addClass(FormulaInput.classNames.listWrapper)
                .insertAfter(formulaBarInputRefElement), {
                aria: {
                    role: 'menu',
                    itemRole: 'menuitem'
                },
                autoBind: false,
                selectable: true,
                dataTextField: "text",
                dataValueField: "value",
                template: ({ text, value }) => `${text || value}`
            });

            this._formulaBarInputRefList.element.on("mousedown", function(e) {
                e.preventDefault();
            });

            this._formulaBarInputRefPopup = new kendo.ui.Popup(this._formulaBarInputRefList.element, {
                anchor: this.element.find(".k-spreadsheet-formula-input:not(.k-spreadsheet-cell-editor)"),
                open: function(ev) { formulaBarInputRefElement.attr("aria-expanded", true); },
                close: function(ev) { formulaBarInputRefElement.attr("aria-expanded", false); }
            });

            let formulaCellInputRefElement = this.element.find('.k-spreadsheet-cell-editor');
            let formulaCellInputRefListId = kendo.guid();
            formulaCellInputRefElement.attr("aria-controls", formulaCellInputRefListId);

            this._formulaCellInputRefList = new FormulaInputStaticList($(`<ul id="${formulaCellInputRefListId}" />`)
                .addClass(FormulaInput.classNames.listWrapper)
                .insertAfter(formulaCellInputRefElement), {
                aria: {
                    role: 'menu',
                    itemRole: 'menuitem'
                },
                autoBind: false,
                selectable: true,
                dataValueField: "value",
                dataTextField: "text",
                template: ({ text, value }) => `${text || value}`

            });

            this._formulaCellInputRefList.element.on("mousedown", function(e) {
                e.preventDefault();
            });

            this._formulaCellInputRefPopup = new kendo.ui.Popup(this._formulaCellInputRefList.element, {
                anchor: this.element.find(DOT + commonEngine.View.classNames.cellEditor),
                open: function(ev) { formulaCellInputRefElement.attr("aria-expanded", true); },
                close: function(ev) { formulaCellInputRefElement.attr("aria-expanded", false); }
            });
        },
        _initContextMenus: function() {
            let that = this;

            let contextMenuConfig = {
                target: this.element,
                animation: false,
                showOn: "never" // this is just an invalid event name to prevent the show
            };

            this._cellContextMenu = new kendo.spreadsheet.ContextMenu($(CELL_CONTEXT_MENU(that.options)).appendTo(that.element), contextMenuConfig);

            this._colHeaderContextMenu = new kendo.spreadsheet.ContextMenu($(COL_HEADER_CONTEXT_MENU(that.options)).appendTo(that.element), contextMenuConfig);

            this._rowHeaderContextMenu = new kendo.spreadsheet.ContextMenu($(ROW_HEADER_CONTEXT_MENU(that.options)).appendTo(that.element), contextMenuConfig);

            this._drawingContextMenu = new kendo.spreadsheet.ContextMenu($(DRAWING_CONTEXT_MENU(that.options)).appendTo(that.element), contextMenuConfig);

            this._cellContextMenu.bind("select", this.onContextMenuSelect.bind(this));
            this._rowHeaderContextMenu.bind("select", this.onContextMenuSelect.bind(this));
            this._colHeaderContextMenu.bind("select", this.onContextMenuSelect.bind(this));
            this._drawingContextMenu.bind("select", this.onContextMenuSelect.bind(this));
        },
        onContextMenuSelect: function(e) {
            let that = this;
            let action = $(e.item).data("action");
            let command;
            switch (action) {
                case "cut":
                    command = { command: "ToolbarCutCommand", options: { workbook: this.spreadsheetRef.workbook } };
                    break;
                case "copy":
                    command = { command: "ToolbarCopyCommand", options: { workbook: this.spreadsheetRef.workbook } };
                    break;
                case "paste":
                    command = { command: "ToolbarPasteCommand", options: { workbook: this.spreadsheetRef.workbook } };
                    break;
                case "delete-drawing":
                    command = { command: "DeleteDrawingCommand", options: { drawing: this.spreadsheetRef._controller.navigator._sheet._activeDrawing } };
                    break;
                case "bring-to-front":
                    command = { command: "BringToFrontCommand", options: { drawing: this.spreadsheetRef._controller.navigator._sheet._activeDrawing } };
                    break;
                case "send-to-back":
                    command = { command: "SendToBackCommand", options: { drawing: this.spreadsheetRef._controller.navigator._sheet._activeDrawing } };
                    break;
                case "unmerge":
                    command = { command: "MergeCellCommand", options: { value: "unmerge" } };
                    break;
                case "merge":
                    this.spreadsheetRef.openDialog("merge");
                    break;
                case "hide-row":
                    command = { command: "HideLineCommand", options: { axis: "row" } };
                    break;
                case "hide-column":
                    command = { command: "HideLineCommand", options: { axis: "column" } };
                    break;
                case "unhide-row":
                    command = { command: "UnHideLineCommand", options: { axis: "row" } };
                    break;
                case "unhide-column":
                    command = { command: "UnHideLineCommand", options: { axis: "column" } };
                    break;
                case "delete-row":
                    command = { command: "DeleteRowCommand" };
                    break;
                case "delete-column":
                    command = { command: "DeleteColumnCommand" };
                    break;
            }

            if (command) {
                that.spreadsheetRef.executeCommand(command);
            }
        },
        _onUpdateTools: function(e) {
            let reason = e.reason;
            if (reason && (reason.overElement || reason.comment)) {
                return;
            }
            this.toolbar?.refresh(e.range);
        },
        _getCopyRegex: function(sheetName) {
            const newName = sheetName.replaceAll('(', '\\(').replaceAll(')', '\\)');
            const st = `(${newName})\\s?\\(`;
            return new RegExp(st, 's');
        },
        _sheetsBar: function(openDialogCallback) {
            let that = this;

            if (that.options.sheetsbar) {
                let sheetsbarOptions = $.extend(true, {
                    openDialog: openDialogCallback,
                }, that.options.sheetsbar);

                that.sheetsBar = new SheetsBar(that.element[0].querySelector('[ref-sheets-bar]'), sheetsbarOptions);

                that.sheetsBar.bind("select", function onSheetSelect(ev) {
                    if (ev.isAddButton) {
                        that.spreadsheetRef.view.sheetsbar.onAddSelect();
                    } else {
                        that.spreadsheetRef.view.sheetsbar.onSheetSelect(ev.name);
                    }
                });

                that.sheetsBar.bind("reorder", function onSheetReorderEnd(ev) {
                    that.spreadsheetRef.view.sheetsbar.onSheetReorderEnd(ev);
                });

                that.sheetsBar.bind("rename", function onSheetRename(ev) {
                    that.spreadsheetRef.view.sheetsbar.onSheetRename(ev.name, ev.sheetIndex);
                });

                that.sheetsBar.bind("duplicate", function onSheetDuplicate(ev) {
                    let name = ev.name;
                    let sheetToCopy = that.sheetByName(name);
                    let sheetIndex = that.sheetIndex(sheetToCopy);
                    let copies = 0;
                    const regex = that._getCopyRegex(name);
                    that.sheets().forEach(sheet => {
                        const isPresent = regex.test(sheet.name());
                        if (isPresent) {
                            copies += 1;
                        }
                    });

                    const newName = `${name} (${copies + 1})`;
                    that.insertSheet({ data: { ...sheetToCopy.toJSON(), name: newName }, index: sheetIndex + 1 });
                    that.spreadsheetRef.view.sheetsbar.onSheetSelect(newName);
                });

                that.sheetsBar.bind("remove", function onSheetBarRemove(ev) {
                    that.spreadsheetRef.view.sheetsbar.onSheetRemove(ev.name);
                });

                that.sheetsBar.bind("hide", function onSheetBarHide(ev) {
                    let sheetName = ev.name;
                    let sheetToHide = that.sheetByName(sheetName);
                    let visibleSheets = that.sheets().filter(x=> x.state() === "visible");
                    let visibleSheetIndex = visibleSheets.findIndex(x=> x.name() === sheetName);
                    let nextVisibleSheet = visibleSheets[visibleSheetIndex + 1] || visibleSheets[visibleSheetIndex - 1];
                    sheetToHide._state('hidden');

                    that.spreadsheetRef.workbook._sheetsSearchCache = {};
                    that.spreadsheetRef.view.sheetsbar.onSheetSelect(nextVisibleSheet.name());
                });

                that.sheetsBar.bind("show", function onSheetBarShow(ev) {
                    let sheetName = ev.name;
                    that.sheetByName(sheetName)._state('visible');
                    that.spreadsheetRef.workbook._sheetsSearchCache = {};
                    that.spreadsheetRef.view.sheetsbar.onSheetSelect(ev.name);
                });
            }
        },
        _createToolBar: function(options, tabs, toolbarId) {
            let that = this;

            if (that.toolbar) {
                that.toolbar.destroy();
                that.toolbar.element.empty();
            }

            let activeTabIndex = tabs.findIndex((item) => item.id === toolbarId);
            let activeToolbar = tabs[activeTabIndex];
            let tools = options[activeToolbar.id];

            that._activeToolBar = activeToolbar.text;

            that.toolbar = new kendo.spreadsheet.ToolBar(this.element.find("[ref-header-toolbar]"), {
                tools: typeof tools === "boolean" ? undefined$1 : tools,
                overflow: $.isPlainObject(options.overflow) ? options.overflow : undefined$1,
                toolbarName: activeToolbar.id,
                fillMode: "flat",
                action: function(args) {
                    if (args.command === 'undo' || args.command === 'redo') {
                        that.spreadsheetRef.workbook.undoRedoStack[args.command]();
                        return;
                    }

                    if (args.command == "OpenCommand") {
                        args.options.file = args.options.value;
                    } else if (args.command === "BorderChangeCommand") {
                        args.options.border = args.options.border || args.options.value.type;
                        args.options.style = args.options.style || args.options.value.style || { color: args.options.value.color, size: 1 };
                    }

                    that.spreadsheetRef.executeCommand(args);
                },
                dialog: function(args) {
                    that.spreadsheetRef.openDialog(args.name, args.options);
                }
            });
            that.toolbar.element.attr("aria-label", activeToolbar.text);
        },

        _initHeader: function() {
            let that = this;
            let messages = this.options.messages.tabs;
            let options = $.extend(true, { file: true, home: true, insert: true, format: true, data: true, view: true }, this.options.toolbar);
            let tabs = [];

            if (this.menu) {
                this.menu.destroy();
                this.menu.empty();
            }

            if (this.toolbar) {
                this.toolbar.destroy();
                this.toolbar.empty();
            }

            for (let name in options) {
                if (options[name] === true || options[name] instanceof Array) {
                    tabs.push({ id: name, text: messages[name], content: "", attr: { "ref-tab-name": name } });
                }
            }

            this.menu = new kendo.spreadsheet.Menu(this.element.find("[ref-header-menu]"), {
                dataSource: tabs,
                toolbarOptions: options,
                select: function(e) {
                    let text = $(e.item).text();
                    if (that._activeToolBar !== text) {
                        $(e.item).addClass(K_ACTIVE)
                            .siblings("li").removeClass(K_ACTIVE);

                        that._createToolBar(options, tabs, tabs.find((item) => item.text === text).id);
                        const activeSheet = that.activeSheet();
                        that._onUpdateTools({ range: activeSheet.range(activeSheet.activeCell()) });
                    }
                }
            });

            if (tabs.length) {
                let defaultTab = tabs.find((item)=> item.id === "home");
                this.menu.element.find(`li[ref-tab-name="home"]`).addClass(K_ACTIVE);
                that._createToolBar(options, tabs, defaultTab ? defaultTab.id : tabs[0].id);
            }
        },

        executeCommand(options) {
            return this.spreadsheetRef.executeCommand(options);
        },

        _resize: function() {
            this.refresh({ layout: true });
        },

        _workbookRender: function(e) {
            if (this.trigger("render", e)) {
                e.preventDefault();
            }
        },

        _workbookChanging: function(e) {
            if (this.trigger("changing", e)) {
                e.preventDefault();
            }
        },

        _workbookChange: function(e) {
            if (this.trigger("change", { range: e.range })) {
                e.preventDefault();
            }
        },

        _workbookCut: function(e) {
            this.trigger("cut", e);
        },

        _workbookCopy: function(e) {
            this.trigger("copy", e);
        },

        _workbookPaste: function(e) {
            this.trigger("paste", e);
        },

        activeSheet: function(sheet) {
            return this.spreadsheetRef.activeSheet(sheet);
        },

        moveSheetToIndex: function(sheet, index) {
            return this.spreadsheetRef.moveSheetToIndex(sheet, index);
        },

        insertSheet: function(options) {
            return this.spreadsheetRef.insertSheet(options);
        },

        sheets: function() {
            return this.spreadsheetRef.sheets();
        },

        removeSheet: function(sheet) {
            return this.spreadsheetRef.removeSheet(sheet);
        },

        sheetByName: function(sheetName) {
            return this.spreadsheetRef.sheetByName(sheetName);
        },

        sheetIndex: function(sheet) {
            return this.spreadsheetRef.sheetIndex(sheet);
        },

        sheetByIndex: function(index) {
            return this.spreadsheetRef.sheetByIndex(index);
        },

        renameSheet: function(sheet, newSheetName) {
            return this.spreadsheetRef.renameSheet(sheet, newSheetName);
        },

        refresh: function(reason) {
            this.spreadsheetRef.refresh(reason);

            return this;
        },

        openDialog: function(name, options) {
            return this.spreadsheetRef.openDialog(name, options);
        },

        autoRefresh: function(value) {
            if (value !== undefined$1) {
                this._autoRefresh = value;

                if (value === true) {
                    this.refresh();
                }

                return this;
            }

            return this._autoRefresh;
        },

        toJSON: function() {
            return this.spreadsheetRef.toJSON();
        },

        fromJSON: function(json) {
            this.spreadsheetRef.fromJSON(json);
        },

        saveJSON: function() {
            return this.spreadsheetRef.saveJSON();
        },

        fromFile: function(blob, name) {
            return this.spreadsheetRef.fromFile(blob, name);
        },

        saveAsPDF: function(options) {
            this.spreadsheetRef.saveAsPDF(
                $.extend({}, this.options.pdf, options, { workbook: this.spreadsheetRef._workbook })
            );
        },

        saveAsExcel: function(options) {
            const exportOps = $.extend({}, this.options.excel, options, {
                Workbook: kendo.ooxml.Workbook,
                saveAs: function(data, fileName, exportOptions) {
                    kendo.saveAs({ dataURI: data, fileName, ...exportOptions });
                }
            });
            this.spreadsheetRef.saveAsExcel(exportOps);
        },

        draw: function(options, callback) {
            this.spreadsheetRef.draw(options, callback);
        },

        _workbookExcelExport: function(e) {
            if (this.trigger("excelExport", e)) {
                e.preventDefault();
            }
        },

        _workbookExcelImport: function(e) {
            const eventData = {
                file: e.file,
                sender: e.sender,
                preventDefault: e.preventDefault,
                isDefaultPrevented: e.isDefaultPrevented,
                promise: convertSpreadsheetDeferredToJQueryDeferred(e.deferred),
                _defaultPrevented: e._defaultPrevented,
            };

            if (this.trigger("excelImport", eventData)) {
                e.preventDefault();
            } else {
                this._initProgress(e.deferred);
            }
        },

        _initProgress: function(deferred) {
            let loading =
                $("<div class='k-loading-mask' " +
                    "style='width: 100%; height: 100%; top: 0;'>" +
                    "<div class='k-loading-color'></div>" +
                    "</div>")
                    .appendTo(this.element);

            let pb = $("<div class='k-loading-progress'>")
                .appendTo(loading)
                .kendoProgressBar({
                    type: "chunk", chunkCount: 10,
                    min: 0, max: 1, value: 0
                }).data("kendoProgressBar");

            deferred.progress(function(e) {
                pb.value(e.progress);
            })
                .promise.finally(function() {
                    kendo.destroy(loading);
                    loading.remove();
                });
        },

        _workbookPdfExport: function(e) {
            if (this.trigger("pdfExport", e)) {
                e.preventDefault();
            }
        },

        _workbookInsertSheet: function(e) {
            if (this.trigger("insertSheet", e)) {
                e.preventDefault();
            }
        },

        _workbookRemoveSheet: function(e) {
            if (this.trigger("removeSheet", e)) {
                e.preventDefault();
            }
        },

        _workbookSelectSheet: function(e) {
            if (this.trigger("selectSheet", e)) {
                e.preventDefault();
            }
        },

        _workbookRenameSheet: function(e) {
            if (this.trigger("renameSheet", e)) {
                e.preventDefault();
            }
        },

        _workbookInsertRow: function(e) {
            if (this.trigger("insertRow", e)) {
                e.preventDefault();
            }
        },

        _workbookInsertColumn: function(e) {
            if (this.trigger("insertColumn", e)) {
                e.preventDefault();
            }
        },

        _workbookDeleteRow: function(e) {
            if (this.trigger("deleteRow", e)) {
                e.preventDefault();
            }
        },

        _workbookDeleteColumn: function(e) {
            if (this.trigger("deleteColumn", e)) {
                e.preventDefault();
            }
        },

        _workbookHideRow: function(e) {
            if (this.trigger("hideRow", e)) {
                e.preventDefault();
            }
        },

        _workbookHideColumn: function(e) {
            if (this.trigger("hideColumn", e)) {
                e.preventDefault();
            }
        },

        _workbookUnhideRow: function(e) {
            if (this.trigger("unhideRow", e)) {
                e.preventDefault();
            }
        },

        _workbookUnhideColumn: function(e) {
            if (this.trigger("unhideColumn", e)) {
                e.preventDefault();
            }
        },

        _workbookSelect: function(e) {
            this.trigger("select", e);
        },

        _workbookChangeFormat: function(e) {
            this.trigger("changeFormat", e);
        },

        _workbookDataBinding: function(e) {
            if (this.trigger("dataBinding", e)) {
                e.preventDefault();
            }
        },

        _workbookDataBound: function(e) {
            this.trigger("dataBound", e);
        },

        _workbookProgress: function(e) {
            kendo.ui.progress(this.element, e.toggle);
        },

        _bindWorkbookEvents: function() {
            this.spreadsheetRef.bind("render", this._workbookRender.bind(this));
            this.spreadsheetRef.bind("cut", this._workbookCut.bind(this));
            this.spreadsheetRef.bind("copy", this._workbookCopy.bind(this));
            this.spreadsheetRef.bind("paste", this._workbookPaste.bind(this));
            this.spreadsheetRef.bind("changing", this._workbookChanging.bind(this));
            this.spreadsheetRef.bind("change", this._workbookChange.bind(this));
            this.spreadsheetRef.bind("excelExport", this._workbookExcelExport.bind(this));
            this.spreadsheetRef.bind("excelImport", this._workbookExcelImport.bind(this));
            this.spreadsheetRef.bind("pdfExport", this._workbookPdfExport.bind(this));
            this.spreadsheetRef.bind("insertSheet", this._workbookInsertSheet.bind(this));
            this.spreadsheetRef.bind("removeSheet", this._workbookRemoveSheet.bind(this));
            this.spreadsheetRef.bind("selectSheet", this._workbookSelectSheet.bind(this));
            this.spreadsheetRef.bind("renameSheet", this._workbookRenameSheet.bind(this));
            this.spreadsheetRef.bind("insertRow", this._workbookInsertRow.bind(this));
            this.spreadsheetRef.bind("insertColumn", this._workbookInsertColumn.bind(this));
            this.spreadsheetRef.bind("deleteRow", this._workbookDeleteRow.bind(this));
            this.spreadsheetRef.bind("deleteColumn", this._workbookDeleteColumn.bind(this));
            this.spreadsheetRef.bind("hideRow", this._workbookHideRow.bind(this));
            this.spreadsheetRef.bind("hideColumn", this._workbookHideColumn.bind(this));
            this.spreadsheetRef.bind("unhideRow", this._workbookUnhideRow.bind(this));
            this.spreadsheetRef.bind("unhideColumn", this._workbookUnhideColumn.bind(this));
            this.spreadsheetRef.bind("select", this._workbookSelect.bind(this));
            this.spreadsheetRef.bind("changeFormat", this._workbookChangeFormat.bind(this));
            this.spreadsheetRef.bind("dataBinding", this._workbookDataBinding.bind(this));
            this.spreadsheetRef.bind("dataBound", this._workbookDataBound.bind(this));
            this.spreadsheetRef.bind("progress", this._workbookProgress.bind(this));
        },

        destroy: function() {
            kendo.ui.Widget.fn.destroy.call(this);

            this._formulaBarInputRefPopup?.destroy();
            this._formulaCellInputRefPopup?.destroy();
            this._formulaBarInputRefList?.destroy();
            this._formulaCellInputRefList?.destroy();

            this._formulaBarInputRefList = this._formulaCellInputRefList = null;
            this._formulaBarInputRefPopup = this._formulaCellInputRefPopup = null;

            if (this.menu) {
                this.menu.destroy();
            }

            if (this.toolbar) {
                this.toolbar.destroy();
            }

            if (this.sheetsBar) {
                this.sheetsBar.destroy();
            }

            this._dialogs?.forEach(function(dialog) {
                dialog?.destroy();
            });

            this.spreadsheetRef?.destroy();

            this._cellContextMenu?.destroy();

            this._rowHeaderContextMenu?.destroy();
            this._colHeaderContextMenu?.destroy();
            this._drawingContextMenu?.destroy();

            this._cellContextMenu = this._rowHeaderContextMenu =
                this._colHeaderContextMenu =
                this._drawingContextMenu = null;

            if (this._resizeHandler) {
                $(window).off("resize" + NS, this._resizeHandler);
            }

            kendo.destroy(this.element);
        },

        options: {
            name: "Spreadsheet",
            toolbar: true,
            sheetsbar: true,
            rows: 200,
            columns: 50,
            rowHeight: 30,
            columnWidth: 64,
            headerHeight: 30,
            headerWidth: 32,
            excel: {
                proxyURL: "",
                fileName: "Workbook.xlsx"
            },
            messages: {},
            pdf: {
                // which part of the workbook to be exported
                area: "workbook",
                fileName: "Workbook.pdf",
                proxyURL: "",
                // paperSize can be an usual name, i.e. "A4", or an array of two Number-s specifying the
                // width/height in points (1pt = 1/72in), or strings including unit, i.e. "10mm".  Supported
                // units are "mm", "cm", "in" and "pt".  The default "auto" means paper size is determined
                // by content.
                paperSize: "a4",
                // True to reverse the paper dimensions if needed such that width is the larger edge.
                landscape: true,
                // An object containing { left, top, bottom, right } margins with units.
                margin: null,
                // Optional information for the PDF Info dictionary; all strings except for the date.
                title: null,
                author: null,
                subject: null,
                keywords: null,
                creator: "Kendo UI PDF Generator v." + kendo.version,
                // Creation Date; defaults to new Date()
                date: null
            },
            defaultCellStyle: {
                fontFamily: "Arial",
                fontSize: 12
            },
            useCultureDecimals: false
        },

        defineName: function(name, value, hidden) {
            return this.spreadsheetRef.defineName(name, value, hidden);
        },

        undefineName: function(name) {
            return this.spreadsheetRef.undefineName(name);
        },

        nameValue: function(name) {
            return this.spreadsheetRef.nameValue(name);
        },

        forEachName: function(func) {
            return this.spreadsheetRef.forEachName(func);
        },

        cellContextMenu: function() {
            return this._cellContextMenu;
        },

        rowHeaderContextMenu: function() {
            return this._rowHeaderContextMenu;
        },

        colHeaderContextMenu: function() {
            return this._colHeaderContextMenu;
        },

        addImage: function(image) {
            return this.spreadsheetRef.addImage(image);
        },

        cleanupImages: function() {
            return this.spreadsheetRef.cleanupImages();
        },

        events: [
            "cut",
            "copy",
            "paste",
            "pdfExport",
            "excelExport",
            "excelImport",
            "changing",
            "change",
            "render",
            "removeSheet",
            "selectSheet",
            "renameSheet",
            "insertRow",
            "insertColumn",
            "deleteRow",
            "insertSheet",
            "deleteColumn",
            "hideRow",
            "hideColumn",
            "unhideRow",
            "unhideColumn",
            "select",
            "changeFormat",
            "dataBinding",
            "dataBound"
        ]
    });

    kendo.ui.plugin(Spreadsheet);
    $.extend(true, Spreadsheet, { classNames: classNames });
})(window.kendo);
var kendo$1 = kendo;

export { __meta__, kendo$1 as default };
