import './kendo.data.js';
import './kendo.columnsorter.js';
import './kendo.editable.js';
import './kendo.window.js';
import './kendo.aiprompt.js';
import './kendo.badge.js';
import './kendo.filtermenu.js';
import './kendo.filtercell.js';
import './kendo.columnmenu.js';
import './kendo.groupable.js';
import './kendo.pager.js';
import './kendo.selectable.js';
import './kendo.sortable.js';
import './kendo.reorderable.js';
import './kendo.resizable.js';
import './kendo.ooxml.js';
import './mixins-C63N9J7p.js';
import './kendo.pane.js';
import './kendo.core.js';
import './html-DIrOxn6k.js';
import './mixins-pM1BXjp5.js';
import './kendo.dialog.js';
import './kendo.switch.js';
import './kendo.html.button.js';
import './kendo.textbox.js';
import './kendo.form.js';
import './kendo.toolbar.js';
import './kendo.icons.js';
import './kendo.menu.js';
import './kendo.loader.js';
import './kendo.html.loadercontainer.js';
import { u as useLoaderContainer } from './loaderContainer-CKYFB4vJ.js';
import './kendo.data.odata.js';
import './kendo.licensing.js';
import '@progress/kendo-licensing';
import './kendo.data.xml.js';
import './kendo.html.icon.js';
import './kendo.html.base.js';
import '@progress/kendo-svg-icons';
import './kendo.checkbox.js';
import './kendo.toggleinputbase.js';
import './kendo.html.input.js';
import './kendo.dropdownlist.js';
import './kendo.list.js';
import './kendo.popup.js';
import './kendo.label.js';
import './kendo.floatinglabel.js';
import './kendo.actionsheet.js';
import './kendo.actionsheet.view.js';
import './kendo.button.js';
import './dropdowns-loader-00xUvouJ.js';
import './kendo.mobile.scroller.js';
import './kendo.fx.js';
import './kendo.draganddrop.js';
import './kendo.userevents.js';
import './kendo.virtuallist.js';
import './valueMapper-CXgI6HWc.js';
import './kendo.datepicker.js';
import './kendo.calendar.js';
import './kendo.dateinput.js';
import '@progress/kendo-dateinputs-common';
import './kendo.numerictextbox.js';
import './prefix-suffix-containers-Cid0cOEy.js';
import './kendo.combobox.js';
import './kendo.multiselect.js';
import './kendo.html.chip.js';
import './kendo.html.chiplist.js';
import './kendo.validator.js';
import './kendo.binder.js';
import './kendo.otpinput.js';
import './kendo.upload.js';
import './kendo.progressbar.js';
import './kendo.textarea.js';
import './kendo.skeletoncontainer.js';
import './kendo.speechtotextbutton.js';
import '@progress/kendo-webspeech-common';
import './kendo.panelbar.js';
import './kendo.floatingactionbutton.js';
import './kendo.splitbutton.js';
import './kendo.button.menu.js';
import './kendo.dropdownbutton.js';
import './kendo.buttongroup.js';
import './kendo.togglebutton.js';
import './kendo.autocomplete.js';
import './kendo.tabstrip.js';
import './kendo.expansionpanel.js';
import './kendo.view.js';
import './kendo.chip.js';
import './kendo.chiplist.js';
import '@progress/kendo-ooxml';
import '@progress/kendo-drawing';
import './kendo.color.js';

(function($, undefined$1) {
    var kendo = window.kendo,
        ui = kendo.ui,
        ContextMenu = ui.ContextMenu,
        extend = $.extend,
        encode = kendo.htmlEncode;

    var ACTION = "action";

    var GridContextMenu = ContextMenu.extend({
        init: function(element, options) {
            var that = this;

            ContextMenu.fn.init.call(that, element, options);

            that._overrideTemplates();
            that._extendItems();

            that.bind("select", that._onSelect.bind(that));
            that.bind("open", that._onOpen.bind(that));
        },

        _overrideTemplates: function() {
            this.templates.sprite = ({ icon, spriteCssClass }) => `${(icon || spriteCssClass) ? kendo.ui.icon({ icon: encode(icon || ""), iconClass: encode(spriteCssClass || "") }) : ''}`;
        },

        defaultItems: {
            "separator": { name: "separator", separator: true },
            "create": { name: "create", text: "Add", icon: "plus", command: "AddCommand", rules: "isEditable" },
            "edit": { name: "edit", text: "Edit", icon: "pencil", command: "EditCommand", rules: "isEditable" },
            "destroy": { name: "destroy", text: "Delete", icon: "trash", command: "DeleteCommand", rules: "isEditable" },
            "select": { name: "select", text: "Select", icon: "table-body", rules: "isSelectable", items: [
                { name: "selectRow", text: "Row", icon: "table-row-groups", command: "SelectRowCommand" },
                { name: "selectAllRows", text: "All rows", icon: "grid", command: "SelectAllRowsCommand" },
                { name: "clearSelection", text: "Clear selection", icon: "table-unmerge", softRules: "hasSelection", command: "ClearSelectionCommand" },
            ] },
            "copySelection": { name: "copySelection", text: "Copy selection", icon: "page-header-section", rules: "isSelectable", softRules: "hasSelection", command: "CopySelectionCommand", options: "withHeaders" },
            "copySelectionNoHeaders": { name: "copySelectionNoHeaders", text: "Copy selection (No Headers)", icon: "file-txt", rules: "isSelectable", softRules: "hasSelection", command: "CopySelectionCommand" },
            "paste": { name: "paste", text: "Paste (use CTRL/⌘ + V)", rules: "allowPaste", softRules: "alwaysDisabled", icon: "clipboard" },
            "reorderRow": { name: "reorderRow", text: "Reorder row", icon: "caret-alt-expand", rules: "isRowReorderable", softRules: "isSorted", items: [
                { name: "reorderRowUp", text: "Up", icon: "caret-alt-up", command: "ReorderRowCommand", options: "dir:up" },
                { name: "reorderRowDown", text: "Down", icon: "caret-alt-down", command: "ReorderRowCommand", options: "dir:down" },
                { name: "reorderRowTop", text: "Top", icon: "caret-alt-to-top", command: "ReorderRowCommand", options: "dir:top" },
                { name: "reorderRowBottom", text: "Bottom", icon: "caret-alt-to-bottom", command: "ReorderRowCommand", options: "dir:bottom" }
            ] },
            "exportPDF": { name: "exportPDF", text: "Export to PDF", icon: "file-pdf", command: "ExportPDFCommand" },
            "exportExcel": { name: "exportExcel", text: "Export to Excel", icon: "file-excel", items: [
                { name: "exportToExcelAll", text: "All", command: "ExportExcelCommand" },
                { name: "exportToExcelSelection", text: "Selection", command: "ExportExcelCommand", softRules: "hasSelection", options: "selection,withHeaders" },
                { name: "exportToExcelSelectionNoHeaders", text: "Selection (No Headers)", softRules: "hasSelection", command: "ExportExcelCommand", options: "selection" }
            ] },
            "sortAsc": { name: "sortAsc", text: "Sort Ascending", icon: "sort-asc-small", rules: "isSortable", command: "SortCommand", options: "dir:asc" },
            "sortDesc": { name: "sortDesc", text: "Sort Descending", icon: "sort-desc-small", rules: "isSortable", command: "SortCommand", options: "dir:desc" },
            "moveGroupPrevious": { name: "moveGroupPrevious", text: "Move previous", icon: "arrow-left", rules: "isGroupable", softRules: "canMoveGroupPrev", command: "MoveGroupCommand", options: "dir:prev" },
            "moveGroupNext": { name: "moveGroupNext", text: "Move next", icon: "arrow-right", rules: "isGroupable", softRules: "canMoveGroupNext", command: "MoveGroupCommand", options: "dir:next" }
            // "filter": { name: "filter", text: "Filter", icon: "filter", attr: { [kendo.attr("is-filter")]: true }, items: [
            //     { content: '<div class="k-columnmenu-item-wrapper"><div class="k-columnmenu-item-content k-column-menu-filter"><div class="k-filterable"></div></div></div>' }
            // ] },
        },

        events: ContextMenu.fn.events.concat([
            ACTION
        ]),

        _onSelect: function(ev) {
            var command = $(ev.item).data("command");
            var options = $(ev.item).data("options");
                options = options ? options.split(",")
                .map(val => {
                    if (val.indexOf(":") > -1) {
                        var [key, val] = val.split(":");
                        return { [key || "_"]: val };
                    }

                    return { [val]: true };
                })
                .reduce((acc, v) => Object.assign(acc, v), {}) : {};

            var target = $(ev.target);

            if (!command) {
                return;
            }

            this.action({
                command: command,
                options: Object.assign(options, { target: target })
            });
        },

        _onOpen: function(ev) {
            var menu = ev.sender,
                items = menu.options.items,
                elTarget = $(ev.event ? ev.event.target : null);

            if ((!items && $.isEmptyObject(this.defaultItems)) || elTarget.closest(".k-grid-column-menu").length) {
                ev.preventDefault();
                return;
            }

            this._toggleSeparatorVisibility();

            menu.element.find(`[${kendo.attr('soft-rules')}]`).each((i, item) => {
                var rules = $(item).attr(kendo.attr('soft-rules')).split(";");
                menu.enable(item, this._validateSoftRules(rules, elTarget));
            });
        },

        _toggleSeparatorVisibility: function() {
            var that = this,
                items = that.element.find(".k-item.k-separator").filter((i, item) => {
                    var prev = $(item).prev(".k-item:not(.k-separator)");
                    var next = $(item).next(".k-item:not(.k-separator)");

                    return !(prev.length && next.length);
                });

            items.hide();
        },

        _extendItems: function() {
            var that = this,
                items = that.options.items,
                item, isBuiltInTool;

            if (items && items.length) {
                for (var i = 0; i < items.length; i++) {
                    item = items[i];
                    isBuiltInTool = $.isPlainObject(item) && Object.keys(item).length === 1 && item.name;

                    if (isBuiltInTool) {
                        item = item.name;
                    }

                    if ($.isPlainObject(item)) {
                        that._append(item);
                    } else if (that.defaultItems[item]) {
                        item = that.defaultItems[item];
                        that._append(item);
                    } else if (typeof(item) === "string") {
                        item = { name: item, text: item, spriteCssClass: item, command: item + "Command" };
                        that._append(item);
                    }
                }
            } else {
                for (var key in that.defaultItems) {
                    item = that.defaultItems[key];
                    that._append(item);
                }
            }
        },

        _extendItem: function(item) {
            var that = this,
                messages = that.options.messages,
                attr = item.attr || {};

            if (item.command) {
                attr[kendo.attr("command")] = item.command;
            }

            if (item.options) {
                attr[kendo.attr("options")] = item.options;
            }

            if (item.softRules) {
                attr[kendo.attr("soft-rules")] = item.softRules;
            }

            if (item.items) {
                for (var j = 0; j < item.items.length; j++) {
                    item.items.forEach(subItem => {
                        that._extendItem(subItem);
                    });
                }
            }

            extend(item, {
                text: messages.commands[item.name],
                icon: item.icon || "",
                spriteCssClass: item.spriteCssClass || "",
                attr: attr,
                uid: kendo.guid()
            });
        },

        _validateSoftRules: function(rules, target) {

            if (!rules || !(rules && rules.length)) {
                return true;
            }

            for (var i = 0; i < rules.length; i++) {
                if (!this._readState(rules[i], target)) {
                    return false;
                }
            }

            return true;
        },

        _validateRules: function(tool) {
            var rules = tool.rules ? tool.rules.split(";") : [];

            if (!rules.length) {
                return true;
            }

            for (var i = 0; i < rules.length; i++) {
                if (!this._readState(rules[i])) {
                    return false;
                }
            }

            return true;
        },

        _readState: function(state, target) {
            var that = this,
                states = that.options.states;

            if (kendo.isFunction(states[state])) {
                return states[state](target);
            } else {
                return states[state];
            }
        },

        _append: function(item) {
            var that = this;

            that._extendItem(item);

            if (that._validateRules(item)) {
                that.append(item);
            }
        },

        action: function(args) {
            this.trigger(ACTION, args);
        }
    });

    kendo.ui.grid = kendo.ui.grid || {};

    extend(kendo.ui.grid, {
        ContextMenu: GridContextMenu
    });
})(window.kendo.jQuery);

(function($, undefined$1) {
    var kendo = window.kendo,
        extend = $.extend,
        Class = kendo.Class;

    var Command = Class.extend({
        init: function(options) {
            this.options = options;
            this.grid = options.grid;
        }
    });

    var MoveGroupCommand = Command.extend({
        exec: function() {
            var that = this,
                grid = that.grid,
                groupable = grid.groupable,
                options = that.options,
                target = options.target.closest(".k-chip"),
                method = options.dir === "next" ? "after" : "before",
                position = options.dir === "next" ? target.next() : target.prev();

            position[method](target);
            groupable._change();
        },
    });

    var SortCommand = Command.extend({
        exec: function() {
            var that = this,
                grid = that.grid,
                dataSource = grid.dataSource,
                sort = dataSource.sort() || [],
                options = that.options,
                dir = options.dir,
                field = grid._getCellField(options.target),
                multipleMode = grid.options.sortable.mode && grid.options.sortable.mode === "multiple",
                compare = grid.options.compare,
                length, idx;

            if (multipleMode) {
                for (idx = 0, length = sort.length; idx < length; idx++) {
                    if (sort[idx].field === field) {
                        sort.splice(idx, 1);
                        break;
                    }
                }
                sort.push({ field: field, dir: dir, compare: compare });
            } else {
                sort = [{ field: field, dir: dir, compare: compare }];
            }

            dataSource.sort(sort);
        },
    });

    var AddCommand = Command.extend({
        exec: function() {
            var that = this,
                grid = that.grid;

            grid.addRow();
        }
    });

    var EditCommand = Command.extend({
        exec: function() {
            var that = this,
                grid = that.grid,
                inCellMode = grid._editMode() === "incell",
                target = inCellMode ? that.options.target : that.options.target.closest("tr");

            if (inCellMode) {
                grid.editCell(target);
            } else {
                grid.editRow(target);
            }
        }
    });

    var DeleteCommand = Command.extend({
        exec: function() {
            var that = this,
                grid = that.grid,
                target = that.options.target.closest("tr");

            grid.removeRow(target);
        }
    });

    var CopySelectionCommand = Command.extend({
        exec: function() {
            var that = this,
                grid = that.grid,
                withHeaders = that.options.withHeaders;

            grid.copySelectionToClipboard(withHeaders);
        }
    });

    var SelectRowCommand = Command.extend({
        exec: function() {
            var that = this,
                grid = that.grid,
                selectMode = kendo.ui.Selectable.parseOptions(grid.options.selectable),
                target = that.options.target.closest("tr");

            grid.select(selectMode.cell ? target.find('td') : target);
        }
    });

    var SelectAllRowsCommand = Command.extend({
        exec: function() {
            var that = this,
                grid = that.grid,
                selectMode = kendo.ui.Selectable.parseOptions(grid.options.selectable),
                rows = grid.items();

            grid.select(selectMode.cell ? rows.find('td') : rows);
        }
    });

    var ClearSelectionCommand = Command.extend({
        exec: function() {
            var that = this,
                grid = that.grid;

            grid.clearSelection();
        }
    });

    var ReorderRowCommand = Command.extend({
        exec: function() {
            var that = this,
                grid = that.grid,
                dir = that.options.dir,
                target = that.options.target.closest("tr"),
                index = target.index(),
                newIndex;

            switch (dir) {
                case "up":
                    newIndex = index - 1;
                    break;
                case "down":
                    newIndex = index + 2;
                    break;
                case "top":
                    newIndex = 0;
                    break;
                case "bottom":
                    newIndex = grid.items().length;
                    break;
            }

            grid.reorderRowTo(target, newIndex);
        }
    });

    var ExportPDFCommand = Command.extend({
        exec: function() {
            var that = this,
                grid = that.grid;

            grid.saveAsPDF();
        }
    });

    var ExportExcelCommand = Command.extend({
        exec: function() {
            var that = this,
                selection = that.options.selection,
                withHeaders = that.options.withHeaders,
                grid = that.grid;

            if (selection) {
                grid.exportSelectedToExcel(withHeaders);
            } else {
                grid.saveAsExcel();
            }
        }
    });

    kendo.ui.grid = kendo.ui.grid || {};

    extend(kendo.ui.grid, {
        GridCommand: Command,
        commands: {
            SortCommand: SortCommand,
            AddCommand: AddCommand,
            EditCommand: EditCommand,
            DeleteCommand: DeleteCommand,
            CopySelectionCommand: CopySelectionCommand,
            SelectRowCommand: SelectRowCommand,
            SelectAllRowsCommand: SelectAllRowsCommand,
            ClearSelectionCommand: ClearSelectionCommand,
            ReorderRowCommand: ReorderRowCommand,
            ExportPDFCommand: ExportPDFCommand,
            ExportExcelCommand: ExportExcelCommand,
            MoveGroupCommand: MoveGroupCommand
        }
    });
})(window.kendo.jQuery);

const __meta__ = {
    id: "grid",
    name: "Grid",
    category: "web",
    description: "The Grid widget displays tabular data and offers rich support for interacting with data,including paging, sorting, grouping, and selection.",
    depends: ["data", "columnsorter", "sortable", "toolbar", "html.button", "icons", "menu", "loader", "html.loadercontainer", "badge", "aiprompt"],
    features: [{
        id: "grid-editing",
        name: "Editing",
        description: "Support for record editing",
        depends: ["editable", "window", "textbox", "form"]
    }, {
        id: "grid-filtering",
        name: "Filtering",
        description: "Support for record filtering",
        depends: ["filtermenu"]
    }, {
        id: "grid-columnmenu",
        name: "Column menu",
        description: "Support for header column menu",
        depends: ["columnmenu"]
    }, {
        id: "grid-grouping",
        name: "Grouping",
        description: "Support for grid grouping",
        depends: ["groupable"]
    }, {
        id: "grid-filtercell",
        name: "Row filter",
        description: "Support for grid header filtering",
        depends: ["filtercell"]
    }, {
        id: "grid-paging",
        name: "Paging",
        description: "Support for grid paging",
        depends: ["pager"]
    }, {
        id: "grid-selection",
        name: "Selection",
        description: "Support for row selection",
        depends: ["selectable"]
    }, {
        id: "grid-column-reorder",
        name: "Column reordering",
        description: "Support for column reordering",
        depends: ["reorderable"]
    }, {
        id: "grid-column-resize",
        name: "Column resizing",
        description: "Support for column resizing",
        depends: ["resizable"]
    }, {
        id: "grid-mobile",
        name: "Grid adaptive rendering",
        description: "Support for adaptive rendering",
        depends: ["dialog", "pane", "switch"]
    }, {
        id: "grid-excel-export",
        name: "Excel export",
        description: "Export grid data as Excel spreadsheet",
        depends: ["excel"]
    }, {
        id: "grid-pdf-export",
        name: "PDF export",
        description: "Export grid data as PDF",
        depends: ["pdf", "drawing"]
    }]
};

(function($, undefined$1) {
    let kendo = window.kendo,
        ui = kendo.ui,
        DataSource = kendo.data.DataSource,
        ObservableObject = kendo.data.ObservableObject,
        tbodySupportsInnerHtml = kendo.support.tbodyInnerHtml,
        activeElement = kendo._activeElement,
        Widget = ui.Widget,
        outerWidth = kendo._outerWidth,
        outerHeight = kendo._outerHeight,
        keys = kendo.keys,
        getType = kendo.type,

        isPlainObject = $.isPlainObject,
        extend = $.extend,
        map = $.map,
        grep = $.grep,
        isArray = Array.isArray,
        inArray = $.inArray,
        push = Array.prototype.push,
        isFunction = kendo.isFunction,
        encode = kendo.htmlEncode,
        isEmptyObject = $.isEmptyObject,
        contains = $.contains,
        math = Math,

        DOT = ".",
        PROGRESS = "progress",
        ERROR = "error",
        HIERARCHY_CELL_CLASS = "k-hierarchy-cell",
        DATA_CELL = ":not(.k-group-cell):not([" + kendo.attr("virtual") + "]):not(.k-hierarchy-cell:not(:has(.k-icon.k-i-caret-alt-down,.k-icon.k-i-caret-alt-right,.k-svg-icon.k-svg-i-caret-alt-down,.k-svg-icon.k-svg-i-caret-alt-right,.k-svg-icon.k-svg-i-caret-alt-left,.k-icon.k-i-caret-alt-left))):visible",
        DATA_CELL_HIDDENINCLUDED = ":not([" + kendo.attr("virtual") + "]):not(.k-hierarchy-cell:not(:has(.k-icon.k-i-caret-alt-down,.k-icon.k-i-caret-alt-right,.k-svg-icon.k-svg-i-caret-alt-down,.k-svg-icon.k-svg-i-caret-alt-right,.k-svg-icon.k-svg-i-caret-alt-left,.k-icon.k-i-caret-alt-left)))",
        SELECTION_CELL_SELECTOR = "tbody>tr:not(.k-grouping-row):not(.k-detail-row):not(.k-group-footer):not([data-skeleton-row]) > td:not(.k-group-cell):not(.k-hierarchy-cell)",
        STACKED_CELL_SELECTOR = "tbody>tr:not(.k-grouping-row):not(.k-detail-row):not(.k-group-footer):not([data-skeleton-row]) > td:not(.k-group-cell):not(.k-hierarchy-cell) div.k-grid-stack-cell",
        NAVROW = "tr:not(.k-footer-template):visible",
        NAVCELL = ":not(.k-group-cell):not(.k-detail-cell):not(.k-hierarchy-cell):visible",
        ITEMROW = "tr:not(.k-grouping-row):not(.k-detail-row):not(.k-footer-template):not(.k-group-footer):visible",
        COLGROUP = "col:not(.k-group-col, .k-hierarchy-col)",
        HEADERCELLS = "th.k-header:not(.k-group-cell):not(.k-hierarchy-cell)",
        CARET_ALT_DOWN = "a[class*='-i-caret-alt-down']",
        CARET_ALT_RIGHT = "a[class*='-i-caret-alt-right']",
        CARET_ALT_RIGHT_CACHE = CARET_ALT_RIGHT,
        CARET_ALT_LEFT = "a[class*='-i-caret-alt-left']",
        WRAPPER = ".k-grid",
        STACKED = "k-grid-stack",
        NS = ".kendoGrid",
        CONTENTRLOCKEDCONTAINER = "k-grid-content-locked",
        GROUPCELLCLASS = "k-group-cell",
        INPUT_SELECTORS = ":button,a,:input,a>.k-icon,a>.k-svg-icon,textarea,span.k-select,span.k-icon,span.k-svg-icon,span.k-svg-icon>svg,span.k-svg-icon>svg>path,span.k-link,label.k-checkbox-label,.k-input,.k-multiselect-wrap,.k-picker-wrap,.k-picker-wrap>.k-selected-color,.k-tool-icon,.k-dropdownlist,.k-switch-thumb,.k-switch-track,.k-switch-label-off,.k-switch-label-on",

        EDIT = "edit",
        BEFOREEDIT = "beforeEdit",
        SAVE = "save",
        REMOVE = "remove",
        DETAILINIT = "detailInit",
        FILTERMENUINIT = "filterMenuInit",
        COLUMNMENUINIT = "columnMenuInit",
        FILTERMENUOPEN = "filterMenuOpen",
        COLUMNMENUOPEN = "columnMenuOpen",
        CELLCLOSE = "cellClose",
        CHANGING = "changing",
        CHANGE = "change",
        COLUMNHIDE = "columnHide",
        COLUMNSHOW = "columnShow",
        SAVECHANGES = "saveChanges",
        DATABOUND = "dataBound",
        DETAILEXPAND = "detailExpand",
        DETAILCOLLAPSE = "detailCollapse",
        ITEM_CHANGE = "itemchange",
        PAGE = "page",
        PAGING = "paging",
        PASTE = "paste",
        SCROLL = "scroll",
        SYNC = "sync",
        LOAD_START = "loadStart",
        LOAD_END = "loadEnd",
        REQUESTEND = "requestEnd",

        FOCUSED = "k-focus",
        HIGHLIGHTED = "k-highlighted",
        HOVER = "k-hover",
        ACTIVE = "k-active",
        FOCUSABLE = ":kendoFocusable",
        FOCUSABLE_GRID_ELEMENT_SELECTORS = ".k-command-cell,.k-select-checkbox,.k-grid-stack-cell[tabindex]",
        SELECTED = "k-selected",
        CHECKBOX = "k-checkbox",
        CHECKBOXINPUT = "input[data-role='checkbox'].k-select-checkbox." + CHECKBOX,
        NORECORDSCLASS = "k-grid-norecords",
        LINK_CLASS = "k-link",
        ICON_CLASS = "k-icon",
        SVG_ICON_CLASS = "k-svg-icon",
        ORDER_CLASS = "k-sort-order",
        SORTED_CLASS = "k-sorted",
        HEADER_CLASS = "k-header",
        HEADER_COLUMN_MENU_CLASS = "k-grid-column-menu",
        FILTER_MENU_CLASS = "k-grid-filter-menu",
        STICKY_CELL_CLASS = "k-grid-content-sticky",
        STICKY_HEADER_CLASS = "k-grid-header-sticky",
        STICKY_FOOTER_CLASS = "k-grid-footer-sticky",
        STICKY_HEADER_NO_BORDER_CLASS = "k-grid-no-left-border",
        STACKED_TEMPLATE_WRAPPER_CLASS = "k-grid-column-template",
        ROW_RESIZER = "k-row-resizer",
        ROW_RESIZER_WRAP = "k-resizer-wrap",
        GROUPING_ROW = "k-grouping-row",
        RESIZE = "resize",
        ROWRESIZE = "rowResize",
        COLUMNRESIZE = "columnResize",
        COLUMNREORDER = "columnReorder",
        COLUMNLOCK = "columnLock",
        COLUMNUNLOCK = "columnUnlock",
        COLUMNSTICK = "columnStick",
        COLUMNUNSTICK = "columnUnstick",
        ROWREORDER = "rowReorder",
        NAVIGATE = "navigate",
        CLICK = "click",
        MOUSEDOWN = "mousedown",
        MOUSEUP = "mouseup",
        MOUSEENTER = "mouseenter",
        MOUSELEAVE = "mouseleave",
        MOUSEMOVE = "mousemove",
        DUBLECLICK = "dblclick",
        HEIGHT = "height",
        WIDTH = "width",
        AUTO = "auto",
        TABINDEX = "tabIndex",
        FUNCTION = "function",
        STRING = "string",
        BOTTOM = "bottom",
        CONTAINER_FOR = "container-for",
        FIELD = "field",
        INPUT = "input",
        INCELL = "incell",
        INLINE = "inline",
        UNIQUE_ID = "uid",
        MINCOLSPANVALUE = 1,
        COLSPAN = "colSpan",
        OVERFLOW = "overflow",
        HIDDEN = "hidden",
        SORT = "sort",
        GROUP_SORT = "group-sort",
        DELETECONFIRM = "Are you sure you want to delete this record?",
        NORECORDS = "No records available.",
        CONFIRMDELETE = "Delete",
        CANCELDELETE = "Cancel",
        COLLAPSE = "Collapse",
        EXPAND = "Expand",
        ID = "id",
        PX = "px",
        TR = "tr",
        TH = "th",
        TD = "td",
        DIV = "div",

        ARIA_LABEL = "aria-label",
        ARIA_OWNS = "aria-owns",
        ARIA_ROWCOUNT = "aria-rowcount",
        ARIA_COLCOUNT = "aria-colcount",
        ARIA_CONTROLS = "aria-controls",
        ARIA_COLINDEX = "aria-colindex",
        ARIA_ROWINDEX = "aria-rowindex",
        ARIA_EXPANDED = "aria-expanded",
        ARIA_CHECKED = "aria-checked",
        ARIA_ACTIVEDESCENDANT = "aria-activedescendant",
        ROLE = "role",
        NONE = "none",
        ROW = "row",
        ROWGROUP = "rowgroup",
        COLUMNHEADER = "columnheader",
        GRIDCELL = "gridcell",

        formatRegExp = /(\}|\#)/ig,
        whitespaceRegExp = "[\\x20\\t\\r\\n\\f]",
        nonDataCellsRegExp = new RegExp("(^|" + whitespaceRegExp + ")" + "(k-group-cell|k-hierarchy-cell)" + "(" + whitespaceRegExp + "|$)"),
        filterRowRegExp = new RegExp("(^|" + whitespaceRegExp + ")" + "(k-filter-row)" + "(" + whitespaceRegExp + "|$)"),
        COMMANDBUTTONTMPL = ({ className, attr, text }) => `<button type="button" class="${className}" ${attr}>${kendo.htmlEncode(text)}</button>`,
        DEFAULTSELECTCOLUMNTMPL = (size, ariaLabel, label) => `<span class="k-checkbox-wrap"><input tabindex="-1" class="k-select-checkbox ${CHECKBOX} ${size} k-rounded-md" data-role="checkbox" aria-label="${ariaLabel}" aria-checked="false" type="checkbox"></span>${label ? `<label class="k-checkbox-label">${label}</label>` : ""}`,
        SELECTCOLUMNTMPL = ({ size }) => DEFAULTSELECTCOLUMNTMPL(size, "Select row"),
        SELECTCOLUMNHEADERTMPL = ({ size, label }) => DEFAULTSELECTCOLUMNTMPL(size, "Select all rows", label),
        DRAGHANDLECOLUMNTMPL = () => kendo.ui.icon("reorder"),
        DEFAULTHEADERTEMPLATE = ({ text }) => `<span class="k-cell-inner"><span class="k-link"><span class="k-column-title">${text}</span></span></span>`,
        isRtl = false,
        browser = kendo.support.browser;

    var isIE11 = browser.msie && browser.version === 11;
    var isMac = /Mac OS/.test(navigator.userAgent);
    var classNames = {
        content: "k-content",
        scrollContainer: "k-scroll-container",
        headerCellInner: "k-cell-inner"
    };
    var GroupsPager;

    var defaultBodyContextMenu = [
        "copySelection",
        "copySelectionNoHeaders",
        "paste",
        "separator",
        "create",
        "edit",
        "destroy",
        "select",
        "separator",
        "reorderRow",
        "exportPDF",
        "exportExcel",
        "separator"
    ];

    var defaultHeadContextMenu = [
        "sortAsc",
        "sortDesc",
        "separator"
    ];

    var defaultGroupsContextMenu = [
        "moveGroupPrevious",
        "moveGroupNext",
        "separator"
    ];

    const editableToolbarItemsSelector = [
        ".k-grid-edit-command",
        ".k-grid-remove-command",
        ".k-grid-save-changes",
        ".k-grid-cancel-changes",
        ".k-grid-cancel-command",
        ".k-grid-save-command"
    ].join(", ");


    const defaultActionSheetFooterButtons = function(messages) {
        return {
            sort: [
                {
                    command: "clear-sort",
                    text: messages.clearButtons ? messages.clearButtons.clearSorting : "Clear Sorting",
                    size: "large",
                    fillMode: "solid",
                    themeColor: "base",
                    icon: "x"
                },
                {
                    command: "done",
                    text: messages.applyButtons ? messages.applyButtons.applySorting : "Done",
                    size: "large",
                    themeColor: "primary",
                    icon: "check"
                }
            ],
            group: [
                {
                    command: "clear-group",
                    text: messages.clearButtons ? messages.clearButtons.clearGrouping : "Clear Grouping",
                    size: "large",
                    fillMode: "solid",
                    themeColor: "base",
                    icon: "x"
                },
                {
                    command: "done",
                    text: messages.applyButtons ? messages.applyButtons.applyGrouping : "Done",
                    size: "large",
                    themeColor: "primary",
                    icon: "check"
                }
            ],
            filter: [
                {
                    command: "clear-filter",
                    text: messages.clearButtons ? messages.clearButtons.clearFiltering : "Clear All Filters",
                    size: "large",
                    fillMode: "solid",
                    themeColor: "base",
                    icon: "filter-clear"
                },
            ],
            "column-chooser": [
                {
                    text: messages.clearButtons ? messages.clearButtons.columnChooserReset : "Reset",
                    icon: "arrow-rotate-ccw",
                },
                {
                    text: messages.applyButtons ? messages.applyButtons.columnChooserApply : "Apply",
                    themeColor: "primary",
                    icon: "check",
                },
            ],
        };
    };

    if (ui.Pager) {
        GroupsPager = ui.Pager.extend({
            init: function(element, options) {
                ui.Pager.fn.init.call(this, element, extend(true, {}, options));
                this.dataSource.options.useRanges = true;
                this.dataSource._omitPrefetch = true;
            },
            options: {
                name: "GroupsPager"
            },

            totalPages: function() {
                var that = this;

                return Math.ceil((that._collapsedTotal() || 0) / (that.pageSize() || 1));
            },
            _collapsedTotal: function() {
                var dataSource = this.dataSource;
                return dataSource ? (dataSource.groupsTotal(true) || 0) : 0;
            }
        });
    }

    var VirtualScrollable = Widget.extend({
        init: function(element, options) {
            var that = this;

            Widget.fn.init.call(that, element, options);
            that._refreshHandler = that.refresh.bind(that);
            that.setDataSource(options.dataSource);
            that.wrap();
        },

        setDataSource: function(dataSource) {
            var that = this;
            if (that.dataSource) {
                that.dataSource.unbind(CHANGE, that._refreshHandler);
            }
            that.dataSource = dataSource;
            that.dataSource.bind(CHANGE, that._refreshHandler);
            that.dataSource.options.useRanges = true;
            that.dataSource.options.virtual = true;
        },

        options: {
            name: "VirtualScrollable",
            itemHeight: $.noop,
            prefetch: true,
            maxScrollHeight: 250000
        },

        events: [
            PAGING,
            PAGE,
            SCROLL,
            LOAD_START,
            LOAD_END
        ],

        destroy: function() {
            var that = this;

            Widget.fn.destroy.call(that);

            that.dataSource.unbind(CHANGE, that._refreshHandler);
            that.wrapper.add(that.verticalScrollbar).off(NS);

            clearTimeout(that._timeout);
            if (that._scrollingTimeout) {
                clearTimeout(that._scrollingTimeout);
            }

            if (that.drag) {
                that.drag.destroy();
                that.drag = null;
            }
            that.wrapper = that.element = that.verticalScrollbar = null;
            that._refreshHandler = null;
        },

        wrap: function() {
            var that = this,
                // workaround for IE issue where scroll is not raised if container is same width as the scrollbar
                scrollbar = kendo.support.scrollbar() + 1,
                element = that.element,
                wrapper;

            element.css({
                width: AUTO,
                overflow: "hidden"
            }).css((isRtl ? "padding-left" : "padding-right"), scrollbar);
            that.content = element.children().first();
            wrapper = that.wrapper = that.content.wrap('<div class="k-virtual-scrollable-wrap"/>')
                .parent()
                .on("DOMMouseScroll" + NS + " mousewheel" + NS, that._wheelScroll.bind(that));
            that._wrapper();

            if (kendo.support.kineticScrollNeeded || kendo.support.touch) {
                that.wrapper.css("touch-action", NONE);
                that.drag = new kendo.UserEvents(that.wrapper, {
                    global: true,
                    allowSelection: true,
                    start: function(e) {
                        e.sender.capture();
                    },
                    move: function(e) {
                        that.verticalScrollbar.scrollTop(that.verticalScrollbar.scrollTop() - e.y.delta);
                        kendo.scrollLeft(wrapper, kendo.scrollLeft(wrapper) - e.x.delta);
                        e.preventDefault();
                    }
                });
            }

            that.verticalScrollbar = $('<div class="k-scrollbar k-scrollbar-vertical" tabindex="-1"/>')
                .css({
                    width: scrollbar
                }).appendTo(element)
                .on("scroll" + NS, that._scroll.bind(that));
        },

        _wrapper: function() {
            var that = this;

            if (isIE11) {
                //scrolling the virtual scrollbar to the bottom and then
                //scrolling the horizontal content scrollbar does not fire the "scroll" event
                //seems like a problem in IE 11 only (after version 11.0.9600.18860)
                //https://github.com/telerik/kendo-ui-core/issues/3779
                that.wrapper.css({
                    "overflow-y": SCROLL
                });

                //hide the wrapper behind the virtual scrollbar
                that.element.css((isRtl ? "padding-left" : "padding-right"), 0);
            }
        },

        _wheelScroll: function(e) {
            if (e.ctrlKey) {
                return;
            }

            var scrollbar = this.verticalScrollbar,
                scrollTop = scrollbar.scrollTop(),
                delta = kendo.wheelDeltaY(e);

            if (delta && !(delta > 0 && scrollTop === 0) && !(delta < 0 && scrollTop + scrollbar[0].clientHeight == scrollbar[0].scrollHeight)) {
                e.preventDefault();
                this.verticalScrollbar.scrollTop(scrollTop + (-delta));
            }
        },

        _scroll: function(e) {
            var that = this,
                delayLoading = !that.options.prefetch,
                scrollTop = e.currentTarget.scrollTop,
                dataSource = that.dataSource,
                rowHeight = that.itemHeight,
                skip = dataSource.skip() || 0,
                start = that._rangeStart || skip,
                height = that.element.innerHeight(),
                isScrollingUp = !!(that._scrollbarTop && that._scrollbarTop > scrollTop),
                firstItemIndex = math.max(math.floor(scrollTop / rowHeight), 0),
                lastItemOffset = isScrollingUp ? math.ceil(height / rowHeight) : math.floor(height / rowHeight),
                lastItemIndex = math.max(firstItemIndex + lastItemOffset, 0);

            if (that._preventScroll) {
                that._preventScroll = false;
                return;
            }
            that._prevScrollTop = that._scrollTop;
            that._scrollTop = scrollTop - (start * rowHeight);
            that._scrollbarTop = scrollTop;

            that._scrolling = delayLoading;

            if (!that._fetch(firstItemIndex, lastItemIndex, isScrollingUp)) {
                that.wrapper[0].scrollTop = that._scrollTop;
            }
            that.trigger(SCROLL);

            if (delayLoading) {
                if (that._scrollingTimeout) {
                    clearTimeout(that._scrollingTimeout);
                }

                that._scrollingTimeout = setTimeout(function() {
                    that._scrolling = false;
                    that._page(that._rangeStart, that.dataSource.take());
                }, 100);
            }
        },

        scrollToTop: function() {
            this._scrollTo(0);
        },

        scrollToBottom: function() {
            var scrollbar = this.verticalScrollbar;
            this._scrollTo(scrollbar[0].scrollHeight - scrollbar.height());
        },

        _scrollWrapperToTop: function() {
            this.wrapper.scrollTop(0);
        },

        _scrollWrapperToBottom: function() {
            this.wrapper.scrollTop(this.wrapper[0].scrollHeight);
        },

        _scrollWrapperOnColumnResize: function() {
            var that = this;
            var wrapper = this.wrapper;
            var initialScrollTop = wrapper.scrollTop();

            if (wrapper[0].scrollWidth > wrapper[0].clientWidth) {
                if ((!that._wrapperScrolled && initialScrollTop) || that._isScrolledToBottom()) {
                    wrapper.scrollTop(initialScrollTop + kendo.support.scrollbar());
                    that._scrollTop = wrapper.scrollTop();
                    that._wrapperScrolled = true;
                }
            } else if (that._wrapperScrolled) {
                if (!that._isWrapperScrolledToBottom()) {
                    wrapper.scrollTop(initialScrollTop - kendo.support.scrollbar());
                    that._scrollTop = wrapper.scrollTop();
                }

                that._wrapperScrolled = false;
            }
        },

        _scrollTo: function(scrollTop, programmaticScrollPosition) {
            var that = this;
            var scrollbar = that.verticalScrollbar;

            if (scrollbar.scrollTop() !== scrollTop) {
                that._preventScroll = true;
            }

            that.wrapper.scrollTop(scrollTop);
            that._scrollTop = that.wrapper.scrollTop();

            scrollbar.scrollTop(programmaticScrollPosition ?? scrollTop);
            that._scrollbarTop = scrollbar.scrollTop();
        },

        _isScrolledToTop: function() {
            return this.verticalScrollbar.scrollTop() === 0;
        },

        _isScrolledToBottom: function() {
            var scrollbar = this.verticalScrollbar;
            var scrollTop = scrollbar.scrollTop();

            return (scrollTop > 0 && scrollTop >= parseInt(scrollbar[0].scrollHeight - scrollbar.height(), 10));
        },

        _isWrapperScrolledToBottom: function() {
            var wrapper = this.wrapper;

            return (wrapper.scrollTop() >= parseInt(wrapper[0].scrollHeight - wrapper.height(), 10));
        },

        itemIndex: function(rowIndex) {
            var rangeStart = this._rangeStart || this.dataSource.skip() || 0;

            return rangeStart + rowIndex;
        },

        position: function(index) {
            var rangeStart = this._rangeStart || this.dataSource.skip() || 0;
            var pageSize = this.dataSource.pageSize();
            var result;

            if (index > rangeStart) {
                result = index - rangeStart;
            } else {
                result = rangeStart - index - 1;
            }

            return result > pageSize ? pageSize : result;
        },

        scrollIntoView: function(row) {
            var container = this.wrapper[0];
            var containerHeight = container.clientHeight;
            var containerScroll = !this._isScrolledToBottom() ? (this._scrollTop || container.scrollTop) : container.scrollTop;
            var elementOffset = row[0].offsetTop;
            var elementHeight = row[0].offsetHeight;

            if (containerScroll > elementOffset) {
                this.verticalScrollbar[0].scrollTop -= containerHeight / 2;
            } else if (elementOffset + elementHeight >= containerScroll + containerHeight) {
                this.verticalScrollbar[0].scrollTop += containerHeight / 2;
            }
        },

        _fetch: function(firstItemIndex, lastItemIndex, scrollingUp) {
            var that = this,
                dataSource = that.dataSource,
                itemHeight = that.itemHeight,
                take = dataSource.take(),
                rangeStart = that._rangeStart || dataSource.skip() || 0,
                currentSkip = math.floor(firstItemIndex / take) * take,
                fetching = false,
                prefetchAt = 0.33;
            var scrollbar = that.verticalScrollbar;
            var webkitCorrection = browser.webkit ? 1 : 0;
            var total = dataSource._isGroupPaged() ? dataSource.groupsTotal(true) : dataSource.total();

            if (firstItemIndex < rangeStart) {

                fetching = true;
                if (that._alwaysScrollTop) {
                    rangeStart = math.min(firstItemIndex, total - take);
                    that._scrollTop = 0;
                } else {
                    rangeStart = math.max(0, lastItemIndex - take);
                    that._scrollTop = scrollbar.scrollTop() - (rangeStart * itemHeight);
                }
                that._page(rangeStart, take);

            } else if (lastItemIndex >= rangeStart + take && !scrollingUp) {

                fetching = true;
                rangeStart = math.min(firstItemIndex, total - take);

                //ensure the scrollbar can be scrolled to bottom with mouse drag
                if (scrollbar.scrollTop() >= scrollbar[0].scrollHeight - scrollbar[0].offsetHeight - webkitCorrection) {
                    that._scrollTop = that.wrapper[0].scrollHeight - that.wrapper[0].offsetHeight;
                } else if (that.dataSource._isGroupPaged() && firstItemIndex >= total - take) {
                    that._scrollTop = that.wrapper[0].scrollHeight - that.wrapper[0].offsetHeight - (that._scrollTop - that._prevScrollTop);
                } else if (that._alwaysScrollTop) {
                    that._scrollTop = 0;
                } else {
                    that._scrollTop = itemHeight;
                }


                that._page(rangeStart, take);

            } else if (!that._fetching && that.options.prefetch) {

                if (firstItemIndex < (currentSkip + take) - take * prefetchAt && firstItemIndex > take) {
                    dataSource.prefetch(currentSkip - take, take, $.noop);
                }
                if (lastItemIndex > currentSkip + take * prefetchAt) {
                    dataSource.prefetch(currentSkip + take, take, $.noop);
                }

            }
            return fetching;
        },

        fetching: function() {
            return this._fetching;
        },

        _page: function(skip, take, callback) {
            var that = this,
                delayLoading = !that.options.prefetch,
                dataSource = that.dataSource,
                isGroupPaged = dataSource._isGroupPaged();
            callback = isFunction(callback) ? callback : $.noop;

            if (that.trigger(PAGING, { skip: skip, take: take })) {
                return;
            }

            clearTimeout(that._timeout);
            that._fetching = true;
            that._rangeStart = skip;

            if ((isGroupPaged && dataSource._groupRangeExists(skip, skip + take)) || (!isGroupPaged && dataSource.inRange(skip, take))) {
                that.trigger(LOAD_START);

                dataSource.range(skip, take, function() {
                    that.trigger(LOAD_END);
                    callback();
                    that.trigger(PAGE);
                }, "page");
            } else {
                if (!delayLoading) {
                    that.trigger(LOAD_START);
                }

                that._timeout = setTimeout(function() {
                    if (!that._scrolling) {

                        if (delayLoading) {
                            that.trigger(LOAD_START);
                        }

                        dataSource.range(skip, take, function() {
                            that.trigger(LOAD_END);
                            callback();
                            that.trigger(PAGE);
                        });
                    }
                }, 100);
            }
        },

        repaintScrollbar: function(shouldScrollWrapper) {
            var that = this,
                maxHeight = that.options.maxScrollHeight,
                dataSource = that.dataSource,
                scrollbar = !kendo.support.kineticScrollNeeded ? kendo.support.scrollbar() : 0,
                wrapperElement = that.wrapper[0],
                totalHeight,
                itemHeight;
            var wasScrolledToBottom = that._isScrolledToBottom();

            itemHeight = that.itemHeight = that.options.itemHeight() || 0;

            var addScrollBarHeight = (wrapperElement.scrollWidth > wrapperElement.offsetWidth) ? scrollbar : 0;

            totalHeight = (dataSource._isGroupPaged() ? dataSource.groupsTotal(true) : dataSource.total()) * itemHeight + addScrollBarHeight;

            var divElements = $(new Array(math.floor(totalHeight / maxHeight) + 1).join('<div></div>'))
                .css({
                    width: "1px",
                    height: `${maxHeight}px`
                });

            if (totalHeight % maxHeight) {
                divElements = divElements.add($("<div></div>").css({
                    width: "1px",
                    height: `${(totalHeight % maxHeight)}px`
                }));
            }

            that.verticalScrollbar.empty().append(divElements);

            if (wasScrolledToBottom && !that._isScrolledToBottom() && !that.dataSource._isGroupPaged()) {
                that.scrollToBottom();
            }

            if (typeof (that._scrollTop) !== "undefined" && !!shouldScrollWrapper) {
                wrapperElement.scrollTop = that._scrollTop;
                that._scrollWrapperOnColumnResize();
            }
        },

        refresh: function(e) {
            var that = this,
                dataSource = that.dataSource,
                rangeStart = that._rangeStart;
            var action = (e || {}).action;
            var shouldScrollWrapper = that._isScrolledToBottom() || !action || (action !== ITEM_CHANGE && action !== REMOVE && action !== SYNC);

            that.trigger(LOAD_END);
            clearTimeout(that._timeout);

            that.repaintScrollbar(shouldScrollWrapper);

            if (that.drag) {
                that.drag.cancel();
            }

            if (typeof (rangeStart) !== "undefined" && !that._fetching) { // we are rebound from outside local range should be reset
                if (!action || (action !== SYNC && action !== ITEM_CHANGE && action !== "expandGroup")) {
                    that._rangeStart = dataSource.skip();
                }

                if (dataSource.page() === 1 && (!action || (action !== SYNC && action !== ITEM_CHANGE && action !== "expandGroup" && action !== "collapseGroup"))) {
                    // reset the scrollbar position if datasource is filtered
                    that.verticalScrollbar[0].scrollTop = 0;
                }
            }

            if (that._programmaticallyScrolling && that._programmaticallyScrolling.state() !== 'resolved') {
                that._programmaticallyScrolling.resolve();
            }

            if (that._alwaysScrollTop) {
                delete that._alwaysScrollTop;
            }
            that._fetching = false;
        }
    });

    function flattenFilterDescriptors(filters) {
        if (!filters || !Array.isArray(filters.filters)) {
            return [];
        }

        const flattened = [];

        function processFilter(filter) {
            if (filter.logic && filter.filters) {
                filter.filters.forEach(processFilter);
            } else if (filter.field && filter.operator) {
                flattened.push({
                    ...filter,
                });
            }
        }

        filters.filters.forEach(processFilter);
        return flattened;
    }

    function flattenGroupDescriptors(groups) {
        if (!groups || !Array.isArray(groups)) {
            return [];
        }

        const flattened = [];

        function processGroup(group) {
            flattened.push({
                ...group
            });

            if (group.items && Array.isArray(group.items)) {
                group.items.forEach(item => {
                    if (item.items) {
                        processGroup(item);
                    }
                });
            }
        }

        groups.forEach(processGroup);
        return flattened;
    }

    function flattenSortDescriptors(sorts) {
        if (!sorts || !Array.isArray(sorts)) {
            return [];
        }

        return sorts;
    }

    function hasInvalidDescriptor(descriptors, key) {
        let flatFunction = {
            sort: flattenSortDescriptors,
            filter: flattenFilterDescriptors,
            group: flattenGroupDescriptors
        }[key];


        if (!flatFunction) {
            return false;
        }

        const flattened = flatFunction(descriptors);

        return flattened.some(item => !item.field);
    }

    function attrEquals(attrName, attrValue) {
        return "[" + kendo.attr(attrName) + "=" + attrValue + "]";
    }

    function groupCells(count) {
        return new Array(count + 1).join('<td class="k-group-cell k-table-group-td k-table-td">&nbsp;</td>');
    }

    function cellsExcludingSpecialColumns(cells) {
        return cells.filter((i, cell) => {
            const $cell = $(cell);
            const hasCheckbox = $cell.children(".k-select-checkbox").length > 0;
            const hasWrappedCheckbox = $cell.find("> .k-checkbox-wrap > .k-select-checkbox").length > 0;
            return $cell.attr("[ref-grid-drag-cell]") === undefined$1 && !$cell.hasClass("k-command-cell") && !hasCheckbox && !hasWrappedCheckbox;
        });
    }

    function stringifyAttributes(attributes) {
        var attr,
            result = " ";

        if (attributes) {
            if (typeof attributes === STRING) {
                return attributes;
            }

            for (attr in attributes) {
                if (attributes[attr] !== '') {
                    result += attr + '="' + attributes[attr] + '"';
                }
            }
        }
        return result;
    }

    function parseDate(value, fields) {
        if (!fields) {
            return value;
        }

        return value.map((descriptor) =>
            ({
                ...descriptor,
                filters: descriptor?.filters?.map((filter) => {
                    const field = filter.field;
                    if (fields && fields[field]) {
                        if (fields[field].type.toLowerCase() === "date") {
                            return { ...filter, value: new Date(filter.value) };
                        }
                    }
                    return filter;
                })
            })
        ) || [];
    }


    var defaultCommands = {
        aiassistant: {
            text: "",
            icon: "sparkles",
            rounded: "full",
            className: "k-grid-ai-assistant-tool",
            fillMode: "solid",
            themeColor: "primary"
        },
        create: {
            text: "Add",
            className: "k-grid-add",
            iconClass: "k-i-plus"
        },
        cancel: {
            text: "Cancel changes",
            className: "k-grid-cancel-changes",
            iconClass: "k-i-cancel"
        },
        save: {
            text: "Save changes",
            className: "k-grid-save-changes",
            iconClass: "k-i-check"
        },
        selectall: {
            text: "Select all",
        },
        destroy: {
            text: "Delete",
            className: "k-grid-remove-command",
            iconClass: "k-i-trash"
        },
        edit: {
            text: "Edit",
            className: "k-grid-edit-command",
            iconClass: "k-i-pencil",
        },
        update: {
            text: "Save",
            className: "k-grid-save-command",
            iconClass: "k-i-save",
        },
        canceledit: {
            text: "Cancel",
            className: "k-grid-cancel-command",
            iconClass: "k-i-cancel"
        },
        excel: {
            text: "Export to Excel",
            className: "k-grid-excel",
            iconClass: "k-i-file-excel"
        },
        pdf: {
            text: "Export to PDF",
            className: "k-grid-pdf",
            iconClass: "k-i-file-pdf"
        },
        search: {
            text: "Search...",
            className: "k-grid-search"
        },
        columns: {
            text: "Columns",
            type: "button",
            icon: "columns",
            fillMode: "flat",
            overflow: "never",
            className: "k-grid-column-menu",
            attr: {
                "aria-haspopup": "menu"
            }
        },
        columnchooser: {
            text: "Columns",
            type: "button",
            icon: "columns",
            overflow: "never",
            className: "k-grid-column-chooser",
            attr: {
                "aria-haspopup": "menu"
            },
        },
        sort: {
            text: "Sort",
            type: "button",
            icon: "arrows-swap",
            overflow: "never",
            className: "k-grid-sort-tool",
            attr: {
                "aria-haspopup": "menu",
            },
            clearButton: true,
        },
        filter: {
            text: "Filter",
            type: "button",
            icon: "filter",
            overflow: "never",
            className: "k-grid-filter-tool",
            attr: {
                "aria-haspopup": "menu",
            },
            clearButton: true,
        },
        group: {
            text: "Group",
            type: "button",
            icon: "group",
            overflow: "never",
            className: "k-grid-group-tool",
            attr: {
                "aria-haspopup": "menu",
            },
            clearButton: true,
        },
    };

    const placeholderId = kendo.guid();

    function promptPlaceholderOptions(messages) {
        return {
            id: placeholderId,
            prompt: "",
            output: messages.outputPlaceholder,
            skipHeader: true,
            skipActions: true,
        };
    }

    function cursor(context, value) {
        $('th, th .k-grid-filter-menu, th .k-link', context)
            .add(document.body)
            .css('cursor', value);
    }

    function reorder(selector, source, dest, before, count) {
        var sourceIndex = source;
        source = $();
        count = count || 1;
        for (var idx = 0; idx < count; idx++) {
            source = source.add(selector.eq(sourceIndex + idx));
        }

        if (typeof dest == "number") {
            source[before ? "insertBefore" : "insertAfter"](selector.eq(dest));
        } else {
            source.appendTo(dest);
        }
    }

    function elements(lockedContent, content, filter) {
        return $(lockedContent).add(content).find(filter);
    }

    function attachCustomCommandEvent(context, container, commands) {
        var idx,
            length,
            command,
            commandName;

        commands = !isArray(commands) ? [commands] : commands;

        for (idx = 0, length = commands.length; idx < length; idx++) {
            command = commands[idx];

            if (isPlainObject(command) && command.click) {
                commandName = command.name || command.text;
                container.on(CLICK + NS, ".k-grid-" + (commandName || "").replace(/\s/g, ""), { commandName: commandName }, command.click.bind(context));
            }
        }
    }

    function normalizeColumns(columns, encoded, hide, locked, parentIds) {
        return map(columns, function(column) {
            column = typeof column === STRING ? { field: column } : column;

            var hidden;
            column.parentIds = parentIds;

            if (column.attributes instanceof Function) {
                column._attributesFunction = column.attributes;
            }

            if (!isVisible(column) || hide) {
                column.attributes = addHiddenStyle(column.attributes);
                column.footerAttributes = addHiddenStyle(column.footerAttributes);
                column.headerAttributes = addHiddenStyle(column.headerAttributes);
                hidden = true;
            } else if (isVisible(column) || !hide) {
                column.attributes = removeHiddenStyle(column.attributes);
                column.footerAttributes = removeHiddenStyle(column.footerAttributes);
                column.headerAttributes = removeHiddenStyle(column.headerAttributes);
                hidden = undefined$1;
            }

            var uid = kendo.guid();
            if (locked && !column.locked) {
                column.locked = locked;
            }

            column.headerAttributes = extend({ headers: parentIds }, column.headerAttributes);
            if (!column.headerAttributes.id) {
                column.headerAttributes = extend({ id: uid }, column.headerAttributes);
                column.uid = uid;
            } else {
                column.uid = uid = column.headerAttributes.id;
            }

            if (column.columns) {
                column.columns = normalizeColumns(column.columns, encoded, hidden, column.locked, parentIds ? (parentIds + " " + uid) : uid);
            }
            return extend({ encoded: encoded, hidden: hidden, locked: locked }, column);
        });
    }

    function columnParent(column, columns) {
        var parents = [];
        columnParents(column, columns, parents);
        return parents[parents.length - 1];
    }

    function columnParents(column, columns, parents) {
        parents = parents || [];

        for (var idx = 0; idx < columns.length; idx++) {
            if (column === columns[idx]) {
                return true;
            } else if (columns[idx].columns) {
                var inserted = parents.length;
                parents.push(columns[idx]);
                if (!columnParents(column, columns[idx].columns, parents)) {
                    parents.splice(inserted, parents.length - inserted);
                } else {
                    return true;
                }
            }
        }
        return false;
    }

    function setColumnVisibility(column, visible) {
        setVisibility(column, visible, visible);
    }

    function addElementsToTab(elements) {
        elements.attr(TABINDEX, 1);
    }

    function removeElementsFromTab(elements) {
        elements.removeAttr(TABINDEX);
    }

    function setVisibility(column, visible, show) {
        var method = show ? removeHiddenStyle : addHiddenStyle;
        column.hidden = !visible;
        column.attributes = method(column.attributes);
        column.footerAttributes = method(column.footerAttributes);
        column.headerAttributes = method(column.headerAttributes);
    }


    function setColumnMediaVisibility(column, visible) {
        setColumnMatchesMedia(column);
        var hideByMedia = column._hideByMedia;
        setVisibility(column, visible, hideByMedia ? column.matchesMedia : visible);
    }

    function setColumnMatchesMedia(column) {
        column.matchesMedia = columnMatchesMedia(column);
    }

    function columnMatchesMedia(column) {
        return column && (isUndefined(column.media) || (!isUndefined(column.media) && kendo.matchesMedia(column.media)));
    }

    function isCellVisible() {
        return this.style.display !== NONE && !this.classList.contains("k-hidden");
    }

    function isElementVisible(element) {
        return $(element)[0].style.display !== NONE && !$(element)[0].classList.contains("k-hidden");
    }

    function isVisible(column) {
        return visibleColumns([column]).length > 0;
    }

    function visibleColumns(columns) {
        return grep(columns, function(column) {
            var result = !column.hidden && column.matchesMedia !== false;

            if (result && column.columns) {
                result = visibleColumns(column.columns).length > 0;
            }
            return result;
        });
    }

    function columnsWithMedia(columns) {
        var result = [];
        var column;

        for (var i = 0; i < columns.length; i++) {
            column = columns[i];

            if (!isUndefined(column.media)) {
                if (!isUndefined(column.minScreenWidth)) {
                    throw new Error("Using 'media' and 'minScreenWidth' options at the same time is not supported.");
                }

                result.push(column);
            }

            if (column.columns) {
                result = result.concat(columnsWithMedia(column.columns));
            }
        }

        return result;
    }

    function isUndefined(value) {
        return typeof value === "undefined";
    }

    function toJQuery(elements) {
        return $(elements).map(function() { return this.toArray(); });
    }

    function updateCellRowSpan(cell, columns, sourceLockedColumnsCount) {
        var lockedColumnDepth = depth(lockedColumns(columns));
        var nonLockedColumnDepth = depth(nonLockedColumns(columns));

        var rowSpan = cell.rowSpan;
        if (sourceLockedColumnsCount) {
            if (lockedColumnDepth > nonLockedColumnDepth) {
                cell.rowSpan = (rowSpan - (lockedColumnDepth - nonLockedColumnDepth)) || 1;
            } else {
                cell.rowSpan = rowSpan + (nonLockedColumnDepth - lockedColumnDepth);
            }
        } else {
            if (lockedColumnDepth > nonLockedColumnDepth) {
                cell.rowSpan = rowSpan + (lockedColumnDepth - nonLockedColumnDepth);
            } else {
                cell.rowSpan = (rowSpan - (nonLockedColumnDepth - lockedColumnDepth)) || 1;
            }
        }
    }

    function findColumnByField(columns, field) {
        for (var i = 0; i < columns.length; i++) {
            if (columns[i].field == field) {
                return columns[i];
            }
        }
    }

    function getToolbarRegex({ mode, hasSelected, hasChanges, editContainerVisible, differentSelectionThanEditing, _editableIsClosing, _isEditableEnabled, options }) {
        const editableCommands = /\b(k-grid-edit-command|k-grid-remove-command|k-grid-save-changes|k-grid-cancel-changes|k-grid-cancel-command|k-grid-save-command)\b/;
        const commands = [];

        if (!_isEditableEnabled || !options.editable) {
            return editableCommands;
        }

        if (!hasSelected) {
            commands.push("k-grid-edit-command");
            commands.push("k-grid-remove-command");
        }

        if (hasSelected && (mode === "incell" || (mode === "inline" && !differentSelectionThanEditing))) {
            commands.push("k-grid-edit-command");
        }

        if (!hasChanges) {
            commands.push("k-grid-save-changes");
            commands.push("k-grid-cancel-changes");
        }

        if (mode !== "inline" || (!editContainerVisible || (editContainerVisible && _editableIsClosing))) {
            commands.push("k-grid-save-command");
            commands.push("k-grid-cancel-command");
        }

        let regex = "";

        if (commands.length) {
            regex = commands.join("|");
            regex = `\\b(${regex})\\b`;
            return new RegExp(regex);
        }

        return regex;
    }

    function moveCellsBetweenContainers(sources, target, leafs, columns, container, destination, groups, action) {
        var sourcesDepth = depth(sources);
        var targetDepth = depth([target]);

        if (sourcesDepth > targetDepth) {
            var groupCells = new Array(groups + 1).join('<th class="k-group-cell k-header k-table-th" scope="col">&nbsp;</th>');
            var rows = destination.children(":not(.k-filter-row)");
            $(new Array((sourcesDepth - targetDepth) + 1).join("<tr class='k-table-row'>" + groupCells + "</tr>")).insertAfter(rows.last());
        }

        addRowSpanValue(destination, sourcesDepth - targetDepth);

        moveCells(leafs, columns, container, destination, action);
    }

    function updateCellIndex(thead, columns, offset) {
        offset = offset || 0;

        var position;
        var cell;
        var allColumns = columns;
        columns = leafColumns(columns);

        var cells = {};
        var rows = thead.find(">tr:not(.k-filter-row)");

        var filter = function() {
            var el = $(this);
            return !el.hasClass("k-group-cell") && !el.hasClass("k-hierarchy-cell");
        };

        for (var idx = 0, length = columns.length; idx < length; idx++) {
            position = columnPosition(columns[idx], allColumns);

            if (!cells[position.row]) {
                cells[position.row] = rows.eq(position.row)
                    .find(DOT + HEADER_CLASS)
                    .filter(filter);
            }

            cell = cells[position.row].eq(position.cell);
            cell.attr(kendo.attr("index"), offset + idx);
        }


        return columns.length;
    }

    function depth(columns) {
        var result = 1;
        var max = 0;

        for (var idx = 0; idx < columns.length; idx++) {
            if (columns[idx].columns) {
                var temp = depth(columns[idx].columns);
                if (temp > max) {
                    max = temp;
                }
            }
        }
        return result + max;
    }

    function moveCells(leafs, columns, container, destination, action) {
        var sourcePosition = columnVisiblePosition(leafs[0], columns);

        var ths = container.find(">tr:not(.k-filter-row)").eq(sourcePosition.row).children("th.k-header:not(.k-group-cell)");

        var t = $();
        var sourceIndex = sourcePosition.cell;
        var idx;

        for (idx = 0; idx < leafs.length; idx++) {
            t = t.add(ths.eq(sourceIndex + idx));
        }

        destination.find(">tr:not(.k-filter-row)").eq(sourcePosition.row)[action](t);

        var children = [];
        for (idx = 0; idx < leafs.length; idx++) {
            if (leafs[idx].columns) {
                children = children.concat(leafs[idx].columns);
            }
        }

        if (children.length) {
            moveCells(children, columns, container, destination, action);
        }
    }

    function columnPosition(column, columns, row, cellCounts) {
        var result;
        var idx;

        row = row || 0;
        cellCounts = cellCounts || {};
        cellCounts[row] = cellCounts[row] || 0;

        for (idx = 0; idx < columns.length; idx++) {
            if (columns[idx] == column) {
                result = { cell: cellCounts[row], row: row };
                break;
            } else if (columns[idx].columns) {
                result = columnPosition(column, columns[idx].columns, row + 1, cellCounts);
                if (result) {
                    break;
                }
            }

            cellCounts[row]++;
        }
        return result;
    }
    function findParentColumnWithChildren(columns, index, source, rtl) {
        var target;
        var locked = !!source.locked;
        var targetLocked;

        do {
            target = columns[index];
            index += rtl ? 1 : -1;
            targetLocked = !!target.locked;
        } while (target && index > -1 && index < columns.length && target != source && !target.columns && targetLocked === locked);

        return target;
    }

    function decorateCellWithClass(html, skipTdClass) {
        let element = html;
        let classes = element.match(/class=["][^"]+/g);
        if (classes) {
            const cssClasses = classes[0].split('\"').pop();
            element = element.replace(cssClasses, cssClasses + (skipTdClass ? "" : " k-table-td "));
        } else {
            element = element.replace("<td", "<td class='k-table-td'");
        }

        return element;
    }

    function findReorderTarget(columns, target, source, before, masterColumns) {
        if (target.columns) {
            target = target.columns;
            return target[before ? 0 : target.length - 1];
        } else {
            var parent = columnParent(target, columns);
            var parentColumns;

            if (parent) {
                parentColumns = parent.columns;
            } else {
                parentColumns = columns;
            }

            var index = inArray(target, parentColumns);
            if (index === 0 && before) {
                index++;
            } else if ((index == parentColumns.length - 1 && !before) || (!source.locked && !target.columns && !before)) {
                index--;
            } else if (index > 0 || (index === 0 && !before)) {
                index++;
            }

            var sourceIndex = inArray(source, parentColumns);
            target = findParentColumnWithChildren(parentColumns, index, source, sourceIndex > index);
            var targetIndex = inArray(target, masterColumns);
            if (target.columns && (!targetIndex || targetIndex === parentColumns.length - 1)) {
                return null;
            }

            if (target && target != source && target.columns) {
                return findReorderTarget(columns, target, source, before, masterColumns);
            }
        }
        return null;
    }

    function columnVisiblePosition(column, columns, row, cellCounts) {
        var result;
        var idx;

        row = row || 0;
        cellCounts = cellCounts || {};
        cellCounts[row] = cellCounts[row] || 0;

        for (idx = 0; idx < columns.length; idx++) {
            if (columns[idx] == column) {
                result = { cell: cellCounts[row], row: row };
                break;
            } else if (columns[idx].columns) {
                result = columnVisiblePosition(column, columns[idx].columns, row + 1, cellCounts);
                if (result) {
                    break;
                }
            }

            if (!columns[idx].hidden) {
                cellCounts[row]++;
            }
        }
        return result;
    }

    function flatColumnsInDomOrder(columns) {
        var result = flatColumns(lockedColumns(columns));
        return result.concat(flatColumns(nonLockedColumns(columns)));
    }

    function targetParentContainerIndex(flatColumns, columns, sourceIndex, targetIndex) {
        var column = flatColumns[sourceIndex];
        var target = flatColumns[targetIndex];

        var parent = columnParent(column, columns);
        columns = parent ? parent.columns : columns;

        return inArray(target, columns);
    }

    function flatColumns(columns) {
        var result = [];
        var children = [];
        for (var idx = 0; idx < columns.length; idx++) {
            result.push(columns[idx]);
            if (columns[idx].columns) {
                children = children.concat(columns[idx].columns);
            }

        }
        if (children.length) {
            result = result.concat(flatColumns(children));
        }
        return result;
    }

    function hiddenLeafColumnsCount(columns) {
        var counter = 0;
        var column;

        for (var idx = 0; idx < columns.length; idx++) {
            column = columns[idx];

            if (column.columns) {
                counter += hiddenLeafColumnsCount(column.columns);
            } else if (column.hidden) {
                counter++;
            }
        }
        return counter;
    }

    function sumWidths(cols) {
        var width = 0;

        for (var idx = 0, length = cols.length; idx < length; idx++) {
            if (!cols[idx].hidden) {
                width += parseInt(cols[idx].width, 10);
            }
        }

        return width;
    }

    function columnsWidth(cols) {
        var colWidth, width = 0;

        for (var idx = 0, length = cols.length; idx < length; idx++) {
            colWidth = cols[idx].style.width;
            if (colWidth && colWidth.indexOf("%") == -1) {
                width += parseInt(colWidth, 10);
            }
        }

        return width;
    }

    function removeRowSpanValue(container, count) {
        var cells = container.find("tr:not(.k-filter-row) th:not(.k-group-cell,.k-hierarchy-cell)");

        var rowSpan;
        for (var idx = 0; idx < cells.length; idx++) {
            rowSpan = cells[idx].rowSpan;
            if (rowSpan > 1) {
                cells[idx].rowSpan = (rowSpan - count) || 1;
            }
        }
    }

    function addRowSpanValue(container, count) {
        var cells = container.find("tr:not(.k-filter-row) th:not(.k-group-cell,.k-hierarchy-cell)");

        for (var idx = 0; idx < cells.length; idx++) {
            cells[idx].rowSpan += count;
        }
    }

    function removeEmptyRows(container) {
        var rows = container.find("tr:not(.k-filter-row)");

        var emptyRowsCount = rows.filter(function() {
            return !$(this).children().length;
        }).remove().length;

        var cells = rows.find("th:not(.k-group-cell,.k-hierarchy-cell)");

        for (var idx = 0; idx < cells.length; idx++) {
            if (cells[idx].rowSpan > 1) {
                cells[idx].rowSpan -= emptyRowsCount;
            }
        }
        return rows.length - emptyRowsCount;
    }

    function mapColumnToCellRows(columns, cells, rows, rowIndex, offset) {
        var idx, row, length, children = [];

        for (idx = 0, length = columns.length; idx < length; idx++) {
            row = rows[rowIndex] || [];
            row.push(cells.eq(offset + idx));
            rows[rowIndex] = row;

            if (columns[idx].columns) {
                children = children.concat(columns[idx].columns);
            }
        }

        if (children.length) {
            mapColumnToCellRows(children, cells, rows, rowIndex + 1, offset + columns.length);
        }
    }

    function setLeftAndRightStyles(element, left, right) {
        element.css({
            "left": left,
            "right": right
        });
    }

    function createColumnAttribute(column, attribute, property) {
        column[attribute] = column[attribute] || {};
        column[attribute][property] = column[attribute][property] || "";
    }

    function addColumnAttribute(column, attribute, property, value) {
        createColumnAttribute(column, attribute, property);

        if (column[attribute][property] !== "") {
            column[attribute][property] += " " + value;
        } else {
            column[attribute][property] = value;
        }
    }

    function removeColumnAttribute(column, attribute, property, value, removeAttributeProperty) {
        createColumnAttribute(column, attribute, property);
        if (removeAttributeProperty) {
            delete column[attribute][property];
        } else {
            column[attribute][property] = column[attribute][property].replace(value, "");
        }
    }

    function lockedColumns(columns) {
        return grep(columns, function(column) {
            return column.locked;
        });
    }

    function nonLockedColumns(columns) {
        return grep(columns, function(column) {
            return !column.locked;
        });
    }

    function stickyColumns(columns) {
        return grep(columns, function(column) {
            return column.sticky && !column.locked;
        });
    }

    function visibleStickyColumns(columns) {
        return grep(columns, function(column) {
            return column.sticky && !column.locked && isVisible(column);
        });
    }

    function visibleNonLockedColumns(columns) {
        return grep(columns, function(column) {
            return !column.locked && isVisible(column);
        });
    }

    function visibleLockedColumns(columns) {
        return grep(columns, function(column) {
            return column.locked && isVisible(column);
        });
    }

    function visibleLeafColumns(columns) {
        var result = [];

        for (var idx = 0; idx < columns.length; idx++) {
            if (columns[idx].hidden) {
                continue;
            }

            if (columns[idx].columns) {
                result = result.concat(visibleLeafColumns(columns[idx].columns));
            } else {
                result.push(columns[idx]);
            }
        }

        return result;
    }

    function visibleLeafExportColumns(columns) {
        var result = [];

        for (var idx = 0; idx < columns.length; idx++) {
            if (columns[idx].hidden) {
                continue;
            }

            if (columns[idx].columns) {
                result = result.concat(visibleLeafColumns(columns[idx].columns));
            } else {
                result.push({
                    field: columns[idx].field,
                    width: columns[idx].width,
                    values: columns[idx].values,
                    title: columns[idx].title
                });
            }
        }

        return result;
    }

    function childColumns(columns) {
        var result = [];

        for (var idx = 0; idx < columns.length; idx++) {
            if (columns[idx].columns) {
                result = result.concat(columns[idx].columns);
            }
        }

        return result;
    }

    function visibleChildColumns(columns) {
        var result = childColumns(columns);

        result = result.filter(function(e) {
            return !e.hidden;
        });

        return result;
    }

    function leafColumns(columns) {
        var result = [];

        for (var idx = 0; idx < columns.length; idx++) {
            if (!columns[idx].columns) {
                result.push(columns[idx]);
                continue;
            }
            result = result.concat(leafColumns(columns[idx].columns));
        }

        return result;
    }

    function getColumnsFields(columns) {
        var result = [];
        columns = leafColumns(columns);

        for (var idx = 0; idx < columns.length; idx++) {
            if (typeof columns[idx] === "string") {
                result.push(columns[idx]);
            } else if (columns[idx].field) {
                result.push(columns[idx].field);
            }
        }
        return result;
    }

    function getAllColumns(columns) {
        var result = [];
        for (var idx = 0; idx < columns.length; idx++) {
            result.push(columns[idx]);
            if (columns[idx].columns) {
                result = result.concat(getAllColumns(columns[idx].columns));
            }
        }
        return result;
    }

    function createMultiHeaderTitle(gridInstance, col) {
            const separator = col.multiHeaderSeparator || " / ";
            const columns = getAllColumns(gridInstance.columns);

            const parentTitles = col.parentIds
                .split(" ")
                .map((id) => {
                    let parent = columns.find((c) => c.uid === id);
                    return parent ? parent.title || parent.field || "" : "";
                });

            parentTitles.push(col.title || col.field);
            return parentTitles.join(separator);
        }

    function editField(column, adaptive) {
        return {
            field: column.field,
            title: column.title,
            format: column.format,
            editor: column.editor,
            values: column.values,
            editorOptions: extend(true, { format: column.format, adaptiveMode: adaptive }, column.editorOptions),
            label: column.title || column.field || ""
        };
    }

    function leafDataCells(container) {
        var rows = container.find(">tr:not(.k-filter-row)");

        var filter = function() {
            var el = $(this);
            return !el.hasClass("k-group-cell") && !el.hasClass("k-hierarchy-cell");
        };

        var cells = $();
        if (rows.length > 1) {
            cells = rows.find("th")
                .filter(filter)
                .filter(function() { return this.rowSpan > 1; });
        }

        cells = cells.add(rows.last().find("th").filter(filter));

        var indexAttr = kendo.attr("index");
        return [].sort.call(cells, function(a, b) {
            a = $(a);
            b = $(b);

            var indexA = a.attr(indexAttr);
            var indexB = b.attr(indexAttr);

            if (indexA === undefined$1) {
                indexA = $(a).index();
            }
            if (indexB === undefined$1) {
                indexB = $(b).index();
            }

            indexA = parseInt(indexA, 10);
            indexB = parseInt(indexB, 10);
            return indexA > indexB ? 1 : (indexA < indexB ? -1 : 0);
        });
    }

    function parentColumnsCells(cell) {
        var container = cell.closest("table");
        var result = $().add(cell);

        var row = cell.closest(TR);
        var headerRows = container.find("tr:not(.k-filter-row)");
        var level = headerRows.index(row);
        if (level > 0) {
            var parent = headerRows.eq(level - 1);
            var parentCellsWithChildren = parent.find("th:not(.k-group-cell,.k-hierarchy-cell)").filter(function() {
                return !$(this).attr("rowspan");
            });

            var offset = 0;
            var index = row.find("th:not(.k-group-cell,.k-hierarchy-cell)").index(cell);

            var prevCells = cell.prevAll(":not(.k-group-cell,.k-hierarchy-cell)").filter(function() {
                return this.colSpan > 1;
            });

            for (var idx = 0; idx < prevCells.length; idx++) {
                offset += prevCells[idx].colSpan || 1;
            }

            index += Math.max(offset - 1, 0);

            offset = 0;
            for (idx = 0; idx < parentCellsWithChildren.length; idx++) {
                var parentCell = parentCellsWithChildren.eq(idx);
                if (parentCell.attr("data-colspan")) {
                    offset += parentCell[0].getAttribute("data-colspan");
                } else {
                    offset += 1;
                }
                if (index >= idx && index < offset) {
                    result = parentColumnsCells(parentCell).add(result);
                    break;
                }
            }
        }
        return result;
    }

    function childColumnsCells(cell) {
        var container = cell.closest("thead");
        var result = $().add(cell);

        var row = cell.closest(TR);
        var headerRows = container.find("tr:not(.k-filter-row)");
        var level = headerRows.index(row) + cell[0].rowSpan;
        var colSpanAttr = kendo.attr("colspan");

        if (level <= headerRows.length - 1) {
            var child = row.next();
            var prevCells = cell.prevAll(":not(.k-group-cell,.k-hierarchy-cell)");

            var idx;

            prevCells = prevCells.filter(function() {
                return !this.rowSpan || this.rowSpan === 1;
            });

            var offset = 0;

            for (idx = 0; idx < prevCells.length; idx++) {
                offset += parseInt(prevCells.eq(idx).attr(colSpanAttr), 10) || 1;
            }

            var cells = child.find("th:not(.k-group-cell,.k-hierarchy-cell)");
            var colSpan = parseInt(cell.attr(colSpanAttr), 10) || 1;

            idx = 0;

            while (idx < colSpan) {
                child = cells.eq(idx + offset);
                result = result.add(childColumnsCells(child));
                var value = parseInt(child.attr(colSpanAttr), 10);
                if (value > 1) {
                    colSpan -= value - 1;
                }
                idx++;
            }
        }

        return result;
    }

    function appendContent(tbody, table, html, size) {
        var placeholder,
            tmp = tbody;

        if (tbodySupportsInnerHtml) {
            let $html = $(html);
            kendo.applyStylesFromKendoAttributes($html, ["display", "left", "right"]);
            tbody.empty();
            $html.each((_, el) => tbody[0].appendChild(el));
        } else {
            placeholder = document.createElement(DIV);
            placeholder.innerHTML = "<table class='k-grid-table k-table'><tbody class='k-table-tbody'>" + html + "</tbody></table>";
            $(placeholder).find("table").addClass(kendo.getValidCssClass("k-table-", "size", size));
            tbody = placeholder.firstChild.firstChild;
            table[0].replaceChild(tbody, tmp[0]);
            tbody = $(tbody);
        }
        return tbody;
    }

    function addHiddenStyle(attr) {
        attr = attr || {};
        let kendoStyleAttrObject = {};
        kendoStyleAttrObject[kendo.attr("style-display")] = "none";

        return extend({}, attr, kendoStyleAttrObject);
    }

    function hasHiddenStyle(attr) {
        attr = attr || {};

        return !!attr[kendo.attr("style-display")];
    }

    function removeHiddenStyle(attr) {
        attr = attr || {};
        delete attr[kendo.attr("style-display")];

        return attr;
    }

    function normalizeCols(table, visibleColumns, hasDetails, groups, stacked) {
        var colgroup = table.find(">colgroup"),
            width,
            cols = stacked ? ["<col>"] : map(visibleColumns, function(column) {
                width = column.width;
                if (width && parseInt(width, 10) !== 0) {
                    return kendo.format(`<col ${kendo.attr('style-width')}="{0}" ${column.draggable ? 'class=k-drag-col' : ''} />`, typeof width === STRING ? width : width + PX);
                }

                if (column.draggable) {
                    return "<col class='k-drag-col' />";
                }
                return "<col />";
            });

        if (!stacked && (hasDetails || colgroup.find(".k-hierarchy-col").length)) {
            cols.splice(0, 0, '<col class="k-hierarchy-col" />');
        }

        if (colgroup.length) {
            colgroup.remove();
        }

        colgroup = $(new Array(groups + 1).join('<col class="k-group-col">') + cols.join(""));
        kendo.applyStylesFromKendoAttributes(colgroup, ["width"]);

        if (!colgroup.is("colgroup")) {
            colgroup = $("<colgroup/>").append(colgroup);
        }

        table.prepend(colgroup);
    }

    function normalizeHeaderCells(container, columns) {
        var lastIndex = 0;
        var idx, len;
        var th = container.find("th:not(.k-group-cell)");

        for (idx = 0, len = columns.length; idx < len; idx++) {
            if (columns[idx].locked) {
                th.eq(idx).insertBefore(th.eq(lastIndex));
                th = container.find("th:not(.k-group-cell)");
                lastIndex++;
            }
        }
    }

    function convertToObject(array) {
        var result = {},
            item,
            idx,
            length;

        for (idx = 0, length = array.length; idx < length; idx++) {
            item = array[idx];
            result[item.value] = item.text;
        }

        return result;
    }

    function formatGroupValue(value, format, columnValues, encoded) {
        let isForeignKey = columnValues && columnValues.length && isPlainObject(columnValues[0]) && "value" in columnValues[0],
            groupValue = isForeignKey ? convertToObject(columnValues)[value] : value;

        groupValue = groupValue != null ? groupValue : "";
        let usedValue = encoded === false ? groupValue : kendo.htmlEncode(groupValue);

        return format ? kendo.format(format, usedValue) : usedValue;
    }

    function setCellVisibility(cells, index, visible) {
        var pad = 0,
            state,
            cell = cells[pad];

        while (cell) {
            state = visible ? true : cell.style.display !== NONE;

            if (visible && cell.classList.contains("k-hidden")) {
                cell.classList.remove("k-hidden");
            }

            if (state && !nonDataCellsRegExp.test(cell.className) && --index < 0) {
                cell.style.display = visible ? "" : NONE;
                break;
            }

            cell = cells[++pad];
        }
    }

    function hideColumnCells(rows, columnIndex) {
        var idx = 0,
            length = rows.length,
            cell, row;

        for (; idx < length; idx += 1) {
            row = rows.eq(idx);
            if (row.is(".k-grouping-row,.k-detail-row")) {
                cell = row.children(":not(.k-group-cell):first,.k-detail-cell").last();
                cell.attr("colspan", parseInt(cell.attr("colspan"), 10) - 1);
            } else {
                if (row.hasClass("k-grid-edit-row") && (cell = row.children(".k-edit-container")[0])) {
                    cell = $(cell);
                    cell.attr("colspan", parseInt(cell.attr("colspan"), 10) - 1);
                    cell.find("col").eq(columnIndex).remove();
                    row = cell.find(TR).first();
                }

                setCellVisibility(row[0].cells, columnIndex, false);
            }
        }
    }

    function groupRows(data) {
        var result = [];
        var item;

        for (var idx = 0; idx < data.length; idx++) {
            item = data[idx];
            if (!("field" in item && "value" in item && "items" in item)) {
                break;
            }

            result.push(item);

            if (item.hasSubgroups) {
                result = result.concat(groupRows(item.items));
            }
        }

        return result;
    }

    function showColumnCells(rows, columnIndex) {
        var idx = 0,
            length = rows.length,
            cell, row, columns;

        for (; idx < length; idx += 1) {
            row = rows.eq(idx);
            if (row.is(".k-grouping-row,.k-detail-row")) {
                cell = row.children(":not(.k-group-cell):first,.k-detail-cell").last();
                cell.attr("colspan", parseInt(cell.attr("colspan"), 10) + 1);
            } else {
                if (row.hasClass("k-grid-edit-row") && (cell = row.children(".k-edit-container")[0])) {
                    cell = $(cell);
                    cell.attr("colspan", parseInt(cell.attr("colspan"), 10) + 1);
                    normalizeCols(cell.find(">form>table"), visibleColumns(columns), false, 0);
                    row = cell.find(TR).first();
                }

                setCellVisibility(row[0].cells, columnIndex, true);
            }
        }
    }

    function updateColspan(toAdd, toRemove, num) {
        num = num || 1;

        var item, idx, length;
        for (idx = 0, length = toAdd.length; idx < length; idx++) {
            item = toAdd.eq(idx).children(":not([hidden])").last();
            item.attr("colspan", parseInt(item.attr("colspan"), 10) + num);

            item = toRemove.eq(idx).children(":not([hidden])").last();
            item.attr("colspan", parseInt(item.attr("colspan"), 10) - num);
        }
    }

    function tableWidth(table) {
        var idx, length, width = 0;
        var cols = table.find(">colgroup>col");

        for (idx = 0, length = cols.length; idx < length; idx += 1) {
            width += parseInt(cols[idx].style.width, 10);
        }

        return width;
    }
    var Grid = kendo.ui.DataBoundWidget.extend({
        init: function(element, options, events) {
            var that = this;

            options = isArray(options) ? { dataSource: options } : options;

            Widget.fn.init.call(that, element, options);

            if (events) {
                that._events = events;
            }

            isRtl = kendo.support.isRtl(element);
            CARET_ALT_RIGHT = isRtl ? CARET_ALT_LEFT : CARET_ALT_RIGHT_CACHE;

            that._element();

            that._ariaId();

            that._columns($.extend(true, [], that.options.columns));
            that._bindMediaQueries();

            if (that._foreignKeyPromises) {
                $.when.apply(null, that._foreignKeyPromises)
                    .then(function() {
                        that._foreignKeyPromises = null;
                        that._continueInit();
                    });
            } else {
                that._continueInit();
            }
        },

        _continueInit: function() {
            var that = this;

            that._dataSource();

            that._stickyColumns();

            that._tbody();

            that._thead();

            that._rowResizing();

            that._groupable();

            that._toolbar();

            that._initToolbarItemsPopups();

            that._ai();

            that._pageable();

            that._setContentHeight();

            that._templates();

            that._navigatable();

            that._initSelectableAggregates();

            that._selectable();

            that._statusBar();

            that._clipboard();

            that._paste();

            that._details();

            that._editable();

            that._attachCustomCommandsEvent();

            that._adaptiveColumns();

            that._minScreenSupport();

            if (that.options.autoBind) {
                that.dataSource.fetch();
            } else {
                that._group = that._groups() > 0;
                that._footer();
            }

            that._setInitialRtlScrollPosition();

            if (that.options.contextMenu) {
                that._initContextMenu();
            }

            if (that.lockedContent) {
                that.wrapper.addClass("k-grid-lockedcolumns");
                that._resizeHandler = function() {
                    that.resize();
                };
                $(window).on("resize" + NS, that._resizeHandler);
            }

            that._initLoader();

            kendo.notify(that);

            if (that._showWatermarkOverlay) {
                that._showWatermarkOverlay(that.wrapper[0]);
            }
        },

        events: [
            CHANGE,
            CHANGING,
            "dataBinding",
            "cancel",
            DATABOUND,
            DETAILEXPAND,
            DETAILCOLLAPSE,
            DETAILINIT,
            FILTERMENUINIT,
            FILTERMENUOPEN,
            COLUMNMENUINIT,
            COLUMNMENUOPEN,
            EDIT,
            BEFOREEDIT,
            SAVE,
            REMOVE,
            SAVECHANGES,
            CELLCLOSE,
            ROWRESIZE,
            COLUMNRESIZE,
            COLUMNREORDER,
            COLUMNSHOW,
            COLUMNHIDE,
            COLUMNLOCK,
            COLUMNUNLOCK,
            COLUMNSTICK,
            COLUMNUNSTICK,
            ROWREORDER,
            NAVIGATE,
            PASTE,
            "page",
            "sort",
            "filter",
            "group",
            "groupExpand",
            "groupCollapse",
            "kendoKeydown"
        ],

        setDataSource: function(dataSource) {
            var that = this;
            var scrollable = that.options.scrollable;
            var scrollableContent;

            that.options.dataSource = dataSource;

            that._dataSource();

            that._pageable();

            that._thead();

            that._rowResizing();

            if (scrollable) {
                if (scrollable.virtual) {
                    scrollableContent = that.content.find(">.k-virtual-scrollable-wrap");
                    kendo.scrollLeft(scrollableContent, leftMostPosition(scrollableContent, isRtl));
                } else {
                    scrollableContent = that.tbody;
                    kendo.scrollLeft(that.content, leftMostPosition(scrollableContent, isRtl));
                }
            }

            if (that.options.groupable) {
                that._groupable();
            }

            if (that.virtualScrollable) {
                that.virtualScrollable.setDataSource(that.options.dataSource);
            }

            if (that.options.navigatable) {
                that._navigatable();
            }

            if (that.options.selectable) {
                that._selectable();
            }

            if (that.options.autoBind) {
                that.dataSource.fetch();
            } else {
                that._footer();
            }
        },

        options: {
            name: "Grid",
            adaptiveMode: "none",
            ai: null,
            columns: [],
            toolbar: null,
            autoBind: true,
            filterable: false,
            scrollable: true,
            sortable: false,
            selectable: false,
            allowCopy: false,
            allowPaste: false,
            navigatable: false,
            pageable: false,
            persistSelection: false,
            editable: false,
            encodeTitles: false,
            groupable: false,
            rowTemplate: "",
            altRowTemplate: "",
            statusBarTemplate: null,
            search: false,
            noRecords: false,
            dataSource: {},
            height: null,
            resizable: false,
            reorderable: false,
            columnMenu: false,
            detailTemplate: null,
            contextMenu: false,
            columnResizeHandleWidth: 3,
            size: "medium",
            mobile: "",
            loaderType: "loadingPanel",
            dataLayoutMode: 'columns',
            stackedLayoutSettings: {},
            messages: {
                loader: {
                    loading: "Loading...",
                    exporting: "Exporting...",
                },

                editable: {
                    cancelDelete: CANCELDELETE,
                    confirmation: DELETECONFIRM,
                    confirmDelete: CONFIRMDELETE
                },
                commands: {
                    create: defaultCommands.create.text,
                    cancel: defaultCommands.cancel.text,
                    save: defaultCommands.save.text,
                    destroy: defaultCommands.destroy.text,
                    edit: defaultCommands.edit.text,
                    update: defaultCommands.update.text,
                    canceledit: defaultCommands.canceledit.text,
                    excel: defaultCommands.excel.text,
                    pdf: defaultCommands.pdf.text,
                    search: defaultCommands.search.text,
                    columns: defaultCommands.columns.text,
                    select: "Select",
                    selectall: defaultCommands.selectall.text,
                    sort: defaultCommands.sort.text,
                    filter: defaultCommands.filter.text,
                    group: defaultCommands.group.text,
                    columnchooser: defaultCommands.columnchooser.text,
                    selectRow: "Select Row",
                    selectAllRows: "All rows",
                    clearSelection: "Clear selection",
                    copySelection: "Copy selection",
                    copySelectionNoHeaders: "Copy selection (No Headers)",
                    paste: "Paste (use CTRL/⌘ + V)",
                    reorderRow: "Reorder row",
                    reorderRowUp: "Up",
                    reorderRowDown: "Down",
                    reorderRowTop: "Top",
                    reorderRowBottom: "Bottom",
                    exportPdf: "Export to PDF",
                    exportExcel: "Export to Excel",
                    exportToExcelAll: "All",
                    exportToExcelSelection: "Selection",
                    exportToExcelSelectionNoHeaders: "Selection (No Headers)",
                    sortAsc: "Sort Ascending",
                    sortDesc: "Sort Descending",
                    moveGroupPrevious: "Move previous",
                    moveGroupNext: "Move next",
                },
                details: {
                    expand: "Expand Details",
                    collapse: "Collapse Details",
                },
                ai: {
                    outputPlaceholder: "No AI output available",
                    success: "Operation is successful. Data is:",
                    error: "Operation is not successful. Error:",
                },
                noRecords: NORECORDS,
                expandCollapseColumnHeader: "",
                groupHeader: "Press ctrl + space to group",
                ungroupHeader: "Press ctrl + space to ungroup",
                itemsSelected: "items selected",
                dragHandleLabel: "Drag row",
                toolbarLabel: "grid toolbar",
                groupingHeaderLabel: "grid grouping header",
                filterCellTitle: "filter cell",
                clearButtons: {
                    clearFiltering: "Clear All Filters",
                    clearSorting: "Clear Sorting",
                    clearGrouping: "Clear Grouping",
                    columnChooserReset: "Reset",
                },
                applyButtons: {
                    applySorting: "Done",
                    applyGrouping: "Done",
                    columnChooserApply: "Apply",
                }
            },
            width: null
        },

        destroy: function() {
            var that = this,
                element,
                reorderableInstance;

            that._destroyColumnAttachments();
            that._unbindToolbarTools();

            Widget.fn.destroy.call(that);

            if (this._navigatableTables) {
                this._navigatableTables.off(NS);
                this._navigatableTables = null;
                this._headertables = null;
            }

            if (that._resizeHandler) {
                $(window).off("resize" + NS, that._resizeHandler);
            }

            if (that._aiAssistant) {
                that._aiAssistant?.destroy();
                that._aiAssistant = null;
            }

            if (that._aiAssistantWindow) {
                that._aiAssistantWindow?.destroy();
                that._aiAssistantWindow = null;
            }

            if (that.pager && that.pager.element) {
                that.pager.destroy();
            }

            if (that.timer) {
                clearTimeout(that.timer);
            }

            if (that._progressTimeOut) {
                clearTimeout(that._progressTimeOut);
            }

            if (that._collapseGroupsTimeOut) {
                clearTimeout(that._collapseGroupsTimeOut);
            }

            if (that._endlessFetchTimeOut) {
                clearTimeout(that._endlessFetchTimeOut);
            }

            that.pager = null;

            that._destroyGroupable();

            reorderableInstance = that.wrapper.data("kendoReorderable");
            if (reorderableInstance) {
                reorderableInstance.destroy();
            }

            reorderableInstance = that.tbody ? that.tbody.data("kendoReorderable") : null;
            if (reorderableInstance) {
                reorderableInstance.destroy();
            }

            if (that.allowPaste) {
                const container = that.content || that.table;
                container.off(PASTE + NS, that.pasteHandler);
                that.unbind(that.pasteHandler);
            }

            if (that.pasteActionsDropDownList) {
                that.pasteActionsDropDownList.destroy();
                that.pasteActionsDropDownList = null;
            }

            if (that.selectable && that.selectable.element) {
                that.selectable.destroy();

                that.clearArea();
                that._selectedIds = null;

                if (that.copyHandler) {
                    that.wrapper.off("keydown", that.copyHandler);
                    that.unbind(that.copyHandler);
                }
                if (that.updateClipBoardState) {
                    that.unbind(that.updateClipBoardState);
                    that.updateClipBoardState = null;
                }
                if (that.clearAreaHandler) {
                    that.wrapper.off("keyup", that.clearAreaHandler);
                }
            }

            that.selectable = null;
            that._selectableAggregatesOptions = null;

            if (that.resizable) {
                that.resizable.destroy();

                if (that._resizeUserEvents) {
                    if (that._resizeHandleDocumentClickHandler) {
                        $(document).off("click", that._resizeHandleDocumentClickHandler);
                    }
                    that._resizeUserEvents.destroy();
                    that._resizeUserEvents = null;
                }
                that.resizable = null;
            }

            that._destroyRowResizing();

            that._destroyVirtualScrollable();

            if (that.editableUserEvents) {
                that.editableUserEvents.destroy();
                that.editableUserEvents = null;
            }

            if (that._lockedContentUserEvents) {
                that._lockedContentUserEvents.destroy();
                that._lockedContentUserEvents = null;
            }

            that._destroyEditable();

            if (that.dataSource) {
                that.dataSource.unbind(CHANGE, that._refreshHandler)
                    .unbind(PROGRESS, that._progressHandler)
                    .unbind(ERROR, that._errorHandler)
                    .unbind(SORT, that._clearSortClasses);

                that._refreshHandler = that._progressHandler = that._errorHandler = that._sortHandler = null;
            }

            element = that.element
                .add(that.wrapper)
                .add(that.table)
                .add(that.thead)
                .add(that.wrapper.find(">.k-grid-toolbar"));

            if (that.content) {
                element = element
                    .add(that.content)
                    .add(that.content.find(">.k-virtual-scrollable-wrap"));
            }

            if (that.scrollables && that.scrollables.first()) {
                element = element.add(that.scrollables.first());
            }

            if (that.lockedHeader) {
                that._removeLockedContainers();
            }

            if (that.pane) {
                that.pane.destroy();
            }

            if (that._isMobile) {
                that.wrapper.off("transitionend" + NS);
                that.wrapper.off("contextmenu" + NS);
            }

            if (that.minScreenResizeHandler) {
                $(window).off("resize", that.minScreenResizeHandler);
            }

            that._detachColumnMediaResizeHandler();

            if (that._draggableInstance && that._draggableInstance.element) {
                that._draggableInstance.destroy();
            }

            that._draggableInstance = null;

            if (that._draggableRowsInstance && that._draggableRowsInstance.element) {
                that._draggableRowsInstance.destroy();
            }

            if (that.tbodyContextMenu) {
                that.tbodyContextMenu.destroy();
            }

            if (that.theadContextMenu) {
                that.theadContextMenu.destroy();
            }

            if (that.loader) {
                that.loader.destroy();
            }

            that._draggableRowsInstance = null;

            element.off(NS);
            element[0].kendoBindingTarget = null;

            kendo.destroy(that.wrapper);

            that.rowTemplate =
                that.altRowTemplate =
                that.lockedRowTemplate =
                that.lockedAltRowTemplate =
                that.detailTemplate =
                that.footerTemplate =
                that.groupFooterTemplate =
                that.lockedGroupFooterTemplate =
                that.noRecordsTemplate = null;

            that.scrollables =
                that.thead =
                that.tbody =
                that.element =
                that.table =
                that.content =
                that.statusBar =
                that.footer =
                that.wrapper =
                that.lockedTable =
                that.lockedContent =
                that.lockedHeader =
                that.lockedFooter =
                that._groupableClickHandler =
                that._groupRows =
                that._setContentWidthHandler =
                that.loaderOverlay =
                that.wrapperClone = null;
        },

        getOptions: function() {
            var options = this.options;
            options.dataSource = null;

            var result = extend(true, {}, this.options);
            result.columns = kendo.deepExtend([], this.columns);

            var dataSource = this.dataSource;

            var initialData = dataSource.options.data && dataSource._data;
            dataSource.options.data = null;

            result.dataSource = $.extend(true, {}, dataSource.options);

            dataSource.options.data = initialData;

            result.dataSource.data = initialData;
            result.dataSource.page = dataSource.page();
            result.dataSource.filter = $.extend(true, {}, dataSource.filter());
            result.dataSource.pageSize = dataSource.pageSize();
            result.dataSource.sort = dataSource.sort();
            result.dataSource.group = dataSource.group();
            result.dataSource.aggregate = dataSource.aggregate();

            if (result.dataSource.transport) {
                result.dataSource.transport.dataSource = null;
            }

            if (result.pageable && result.pageable.pageSize) {
                result.pageable.pageSize = dataSource.pageSize();
            }

            return result;
        },

        setOptions: function(options) {
            var currentOptions = this.getOptions(),
                element = this.element;


            if (currentOptions.size) {
                const size = kendo.getValidCssClass("k-grid-", "size", currentOptions.size);
                element.removeClass(size);
            }

            kendo.deepExtend(currentOptions, options);
            if (!options.dataSource) {
                currentOptions.dataSource = this.dataSource;
            } else {
                if (options.dataSource.filter) {
                    currentOptions.dataSource.filter = options.dataSource.filter;
                }
            }
            var wrapper = this.wrapper;
            var events = this._events;

            this.destroy();
            this.options = null;
            if (this._isMobile) {
                var mobileWrapper = wrapper.closest(kendo.roleSelector("pane")).parent();
                mobileWrapper.after(wrapper);
                mobileWrapper.remove();
                wrapper.removeClass("k-grid-mobile");
            }
            if (wrapper[0] !== element[0]) {
                wrapper.before(element);
                wrapper.remove();
            }
            element.empty();

            this.init(element, currentOptions, events);
            this._setEvents(currentOptions);
        },

        items: function() {
            if (this.lockedContent) {
                return this._items(this.tbody).add(this._items(this.lockedTable.children("tbody")));
            } else {
                return this._items(this.tbody);
            }
        },

        _items: function(container, includeGroupRows) {
            return container.children().filter(function() {
                var tr = $(this);
                return (includeGroupRows ? !tr.hasClass("k-detail-row") : !tr.hasClass(GROUPING_ROW)) && !tr.hasClass("k-detail-row") && !tr.hasClass("k-group-footer");
            });
        },

        dataItems: function() {
            var dataItems = kendo.ui.DataBoundWidget.fn.dataItems.call(this);
            if (this.lockedContent) {
                var n = dataItems.length, tmp = new Array(2 * n);
                for (var i = n; --i >= 0;) {
                    tmp[i] = tmp[i + n] = dataItems[i];
                }
                dataItems = tmp;
            }

            return dataItems;
        },

        _destroyColumnAttachments: function() {
            var that = this;

            that.resizeHandle = null;

            if (!that.thead) {
                return;
            }

            that.thead.add(that.lockedHeader).find("th").each(function() {
                var th = $(this),
                    filterMenu = th.data("kendoFilterMenu"),
                    sortable = th.data("kendoColumnSorter"),
                    columnMenu = th.data("kendoColumnMenu");

                if (filterMenu) {
                    filterMenu.destroy();
                }

                if (sortable) {
                    sortable.destroy();
                }

                if (columnMenu) {
                    columnMenu.destroy();
                }
            });
        },

        _setInitialRtlScrollPosition: function() {
            const that = this;

            if (isRtl && that.scrollables) {
                kendo.scrollLeft(that.scrollables, 0);
            }
        },

        _attachCustomCommandsEvent: function() {
            var that = this,
                columns = leafColumns(that.columns || []),
                command,
                idx,
                length;

            for (idx = 0, length = columns.length; idx < length; idx++) {
                command = columns[idx].command;

                if (command) {
                    attachCustomCommandEvent(that, that.wrapper, command);
                }
            }
        },

        _bindMediaQueries: function() {
            const that = this;
            const isAdaptive = that.options.adaptiveMode === "auto";

            if (isAdaptive) {
                that.largeMQL = kendo.mediaQuery("large");
                that.mediumMQL = kendo.mediaQuery("medium");
                that.smallMQL = kendo.mediaQuery("small");

                const handler = (fullscreen, handler) => {
                    if (that._editMode() !== "popup") {
                        return;
                    }
                    const checkActionSheet = fullscreen === true || fullscreen === false;

                    let popup;

                    if (that._editContainer) {
                        popup = that._editContainer && that._editContainer.data(handler);
                    }

                    if (!popup) {
                        const reverseHandler = handler === "kendoActionSheet" ? "kendoWindow" : "kendoActionSheet";
                        popup = that._editContainer && that._editContainer.data(reverseHandler);
                    }

                    if (checkActionSheet) {
                        if (popup && popup.fullscreen && popup.visible()) {
                            that._showAdaptiveView = true;
                            popup.fullscreen(fullscreen);
                        } else if (popup) {
                            that._showAdaptiveView = false;
                            that._destroyEditable(true);
                        }
                    } else {
                        if (popup && popup.fullscreen) {
                            popup.close();
                        }
                    }
                };

                that.smallMQL
                    .onEnter(() => {
                        handler(true, "kendoActionSheet");
                    });

                that.mediumMQL
                    .onEnter(() => {
                        handler(false, "kendoActionSheet");
                    });

                that.largeMQL
                    .onEnter(() => {
                        handler(null, "kendoWindow");
                    });
            } else {
                that.smallMQL && that.smallMQL.destroy();
                that.mediumMQL && that.mediumMQL.destroy();
                that.largeMQL && that.largeMQL.destroy();

                that._showAdaptiveView = false;
            }
        },

        _aria: function() {
            var wrapper = this.wrapper,
                gridRole = this._hasDetails() ? "treegrid" : this.options.navigatable ? "grid" : null,
                table = this.table,
                toolbar = wrapper.find(".k-grid-toolbar"),
                groupingHeader = wrapper.find(".k-grouping-header"),
                gridId = this._ariaGridId(),
                tableTabindex = table.attr(TABINDEX),
                tbodyId, headerGroupId, footerGroupId, tableOwned,
                stacked = this._isStackedMode(),
                numberOfFixedRows = !stacked && this.thead.find(TR).length + this.wrapper.find(".k-grid-footer-wrap table tr").length,
                trailingColumns = this._trailingColumns(),
                virtual = this.virtualScroll,
                pageable = this.options.pageable,
                rowsCount;

            table.attr(TABINDEX, tableTabindex >= 0 ? tableTabindex : 0);

            if (gridRole) {
                table.attr(ROLE, gridRole);
            }

            const tbody = table.find("tbody");
            const thead = table.find("thead");
            const tfoot = table.find("tfoot");
            const tr = table.find(TR);

            if (tbody.find(TR).length > 0) {
                tbody.attr(ROLE, ROWGROUP);
            }

            if (thead.find(`${TR} ${TH}`).length > 0) {
                thead.attr(ROLE, ROWGROUP);
            }

            if (tfoot.find(TR).length > 0) {
                tfoot.attr(ROLE, ROWGROUP);
            }

            if (tr.children().length > 0) {
                tr.attr(ROLE, ROW);
            }

            table.find("th").attr(ROLE, COLUMNHEADER);
            table.find("td").attr(ROLE, GRIDCELL);

            if ((pageable && this.dataSource.totalPages() > 1) || (virtual && virtual.rows)) {
                if (this._groups() > 0) {
                    rowsCount = -1;
                } else if (this._hasDetails()) {
                    rowsCount = numberOfFixedRows + (this.dataSource.total() * 2);
                } else {
                    rowsCount = numberOfFixedRows + this.dataSource.total();
                }

                table.attr(ARIA_ROWCOUNT, rowsCount);
            } else if (this._hasDetails()) {
                if (this._groups() > 0) {
                    rowsCount = -1;
                } else {
                    rowsCount = numberOfFixedRows + (this.dataSource.total() * 2);
                }

                table.attr(ARIA_ROWCOUNT, rowsCount);
            }

            if (rowsCount && rowsCount > 0) {
                this._ariaRowIndex();
            }

            if (!stacked && (virtual && virtual.columns) ||
                (!table.attr(ARIA_COLCOUNT) &&
                    (table.find("td:not([group-header-spanned-hidden]):hidden").length > 0 ||
                        wrapper.find(".k-grid-content-locked td:not([group-header-spanned-hidden]):hidden").length > 0))) {
                table.attr(ARIA_COLCOUNT, trailingColumns + leafColumns(this.columns).length);
                this._ariaColumnIndex();
            }

            if (this.pager) {
                this.pager.element.attr(ARIA_CONTROLS, gridId);
            }

            toolbar.attr({
                role: "toolbar",
                "aria-label": this.options.messages.toolbarLabel,
                "aria-controls": gridId
            });

            groupingHeader.attr({
                role: "toolbar",
                "aria-label": this.options.messages.groupingHeaderLabel,
                "aria-controls": gridId
            });

            headerGroupId = !stacked ? this._ariaHeaderFooter("header", "thead", "th, td", COLUMNHEADER) : "";
            footerGroupId = this._ariaHeaderFooter("footer", "tfoot", "td", GRIDCELL);

            if (!stacked && wrapper.find(".k-grid-content-locked").length > 0) {
                this._ariaLockedContent();
            }

            if (!!headerGroupId || !!footerGroupId) {
                tbodyId = this.tbody.attr(ID) || kendo.guid();
                tableOwned = [headerGroupId, tbodyId, footerGroupId].join(" ");

                this.tbody.attr(ID, tbodyId);
                table.attr(ARIA_OWNS, tableOwned);
            }

            if (this.options.groupable) {
                this._ariaGroupTitles();
            }
        },

        _ariaColumnIndex: function() {
            var trailingColumns = this._trailingColumns(),
                dataVirtual = this.tbody.find(">tr").last().find("> td[data-virtual]"),
                headerRows = this.thead.find(">tr").not(".k-filter-row"),
                lockedHeaderRows = this.wrapper.find(".k-grid-header-locked thead > tr").not(".k-filter-row"),
                firstIndex = Number.MAX_VALUE,
                lastIndex = 0,
                lockedLastIndex = 0,
                previousVirtual = 0,
                nextVirtual = 0,
                previousIndex, i, cells, dataIndex, cellsIndex,
                eachHeaderCell = function(j, cell) {
                    var current = cell.getAttribute("data-index"),
                        currentIndex = Number(current),
                        lockedParent = $(cell).closest(".k-grid-header-locked");

                    if (lockedParent.length === 0 && currentIndex < firstIndex) {
                        firstIndex = currentIndex;
                    }

                    if (lockedParent.length > 0 && lockedLastIndex < currentIndex) {
                        lockedLastIndex = currentIndex;
                    }

                    if (lockedParent.length === 0 && lastIndex < currentIndex) {
                        lastIndex = currentIndex;
                    }

                    if (current !== null) {
                        cell.setAttribute(ARIA_COLINDEX, Number(currentIndex) + 1);
                        previousIndex = Number(currentIndex) + 1 + cell.getAttribute("colspan");
                    } else {
                        cell.setAttribute(ARIA_COLINDEX, previousIndex + 1);
                        previousIndex = previousIndex + cell.getAttribute("colspan");
                    }
                };

            if (dataVirtual.length === 2) {
                previousVirtual = Number(dataVirtual[0].getAttribute("colspan"));
                nextVirtual = Number(dataVirtual[1].getAttribute("colspan"));
            } else if (dataVirtual.length === 1 && dataVirtual.prev().length === 0) {
                previousVirtual = Number(dataVirtual[0].getAttribute("colspan"));
            } else if (dataVirtual.length === 1 && dataVirtual.prev().length === 1) {
                nextVirtual = Number(dataVirtual[0].getAttribute("colspan"));
            }

            for (i = 0; i < lockedHeaderRows.length; i++) {
                previousIndex = 0;
                lockedHeaderRows.eq(i).find("th").each(eachHeaderCell);
            }

            for (i = 0; i < headerRows.length; i++) {
                previousIndex = 0;
                headerRows.eq(i).find("th").each(eachHeaderCell);
            }

            for (i = 0; i <= lockedLastIndex; i++) {
                dataIndex = i + trailingColumns;
                cells = this.wrapper.find(".k-grid-content-locked tbody > tr > td:nth-child(" + (i + 1) + ")");
                cells.attr(ARIA_COLINDEX, dataIndex + 1);
            }

            for (i = previousVirtual; i <= lastIndex - firstIndex - nextVirtual; i++) {
                if (previousVirtual === 0) {
                    cellsIndex = i + 1;
                } else {
                    cellsIndex = i - previousVirtual + 2;
                }

                dataIndex = firstIndex + i + trailingColumns;

                cells = this.tbody.find("> tr > td:nth-child(" + cellsIndex + ")");
                cells.attr(ARIA_COLINDEX, dataIndex + 1);
            }
        },

        _ariaGroupTitles: function() {
            var that = this,
                groups = that.dataSource.group(),
                ths = that.wrapper.find(".k-grid-header th");

            ths.each(function(i, el) {
                if (el.getAttribute("title") === that.options.messages.ungroupHeader) {
                    el.setAttribute("title", that.options.messages.groupHeader);
                }
            });

            if (groups && groups.length > 0) {
                groups.forEach(function(group) {
                    var field = group.field,
                        el = ths.filter("[" + kendo.attr("field") + "='" + field + "']");

                    if (el.attr("title") === that.options.messages.groupHeader) {
                        el.attr("title", that.options.messages.ungroupHeader);
                    }
                });
            }
        },

        _ariaHeaderFooter: function(type, group, el, role) {
            var that = this,
                wrapper = that.wrapper,
                table = wrapper.find(".k-grid-" + type + " .k-grid-" + type + "-wrap table"),
                lockedTable = wrapper.find(".k-grid-" + type + " .k-grid-" + type + "-locked table"),
                groupId = "",
                rowGroup;

            if (table.length > 0) {
                rowGroup = table.find(group + ", tbody");
                groupId = rowGroup.attr(ID) || kendo.guid();

                table.attr(ROLE, NONE);

                const tr = table.find(TR);

                if (tr.children().length > 0) {
                    tr.attr(ROLE, ROW);
                    rowGroup.attr(ROLE, ROWGROUP);
                }

                table.find(el).attr(ROLE, role);
                rowGroup.attr({
                    id: groupId
                });
            }

            if (lockedTable.length > 0) {
                that._ariaLocked(type, group, el, role);
            }

            lockedTable.find("td").attr(ROLE, GRIDCELL);
            table.find("td").attr(ROLE, GRIDCELL);

            return groupId;
        },

        _ariaId: function() {
            var id = this.element.attr(ID) || "aria";

            {
                this._cellId = id + "_active_cell";
            }
        },

        _ariaGridId: function() {
            var table = this.table,
                gridId = table.attr(ID);

            if (!gridId) {
                gridId = kendo.guid();
                table.attr(ID, gridId);
            }

            return gridId;
        },

        _ariaLocked: function(type, group, el, role) {
            var that = this,
                wrapper = that.wrapper,
                table = wrapper.find(".k-grid-" + type + " .k-grid-" + type + "-wrap table"),
                lockedTable = wrapper.find(".k-grid-" + type + " .k-grid-" + type + "-locked table"),
                rows = table.find(TR),
                lockedRows = lockedTable.find(TR);

            lockedTable.attr(ROLE, NONE);
            lockedTable.find(group + ", tbody").attr(ROLE, NONE);
            lockedRows.attr(ROLE, NONE);

            lockedTable.find(el).attr(ROLE, role);

            rows.each(function(i, row) {
                var ownedCells = [];

                ownedCells = that._cellsIds(lockedRows.eq(i).find(el), "locked_" + type, i);
                ownedCells = ownedCells.concat(that._cellsIds($(row).find(el), type, i));

                row.setAttribute(ARIA_OWNS, ownedCells.join(" "));
            });
        },

        _ariaLockedContent: function() {
            var that = this,
                table = that.table,
                tableRows = table.find(TR),
                lockedTable = that.wrapper.find(".k-grid-content-locked table"),
                lockedRows = lockedTable.find(TR);

            lockedTable.attr(ROLE, NONE);
            lockedTable.find("tbody").attr(ROLE, NONE);
            lockedRows.attr(ROLE, NONE);
            lockedTable.find("td").attr(ROLE, GRIDCELL);

            tableRows.each(function(i, row) {
                var ownedCells = [];

                ownedCells = that._cellsIds(lockedRows.eq(i).find("td"), "locked_datacell", i);
                ownedCells = ownedCells.concat(that._cellsIds($(row).find("td"), "datacell", i));

                row.setAttribute(ARIA_OWNS, ownedCells.join(" "));
            });
        },

        _ariaAddHiddenColIndex: function() {
            var virtualScroll = this.virtualScroll || {},
                columns = this.columns,
                table = this.table,
                leafColsCount = leafColumns(columns).length;

            if (!virtualScroll.columns && !table.attr(ARIA_COLCOUNT)) {
                this._ariaColumnIndex();

                table.attr(ARIA_COLCOUNT, leafColsCount);
            }
        },

        _ariaRemoveHiddenColIndex: function() {
            var virtualScroll = this.virtualScroll || {},
                columns = this.columns,
                leafColsCount = leafColumns(columns).length;

            if (!virtualScroll.columns && (leafColsCount === visibleLeafColumns(this.columns).length)) {
                this.wrapper.find("td, th").removeAttr(ARIA_COLINDEX);

                this.table.removeAttr(ARIA_COLCOUNT);
            }
        },

        _ariaRowIndex: function() {
            var headerRows = !this._isStackedMode() && this.thead.find(">tr"),
                numberOfHeaderRows = headerRows ? headerRows.length : 0,
                bodyRows = this.tbody.find(">tr"),
                footerRows = this.wrapper.find(".k-grid-footer-wrap tfoot > tr"),
                totalNumberOfItems = this.dataSource.total(),
                previousItems = this.dataSource.skip() || 0,
                currentIndex = 1,
                previousMaster = false,
                i, currentRow;

            if (this._hasDetails()) {
                totalNumberOfItems = totalNumberOfItems * 2;
                previousItems = previousItems * 2;
            }

            for (i = 0; i < numberOfHeaderRows; i++) {
                headerRows.eq(i).attr(ARIA_ROWINDEX, currentIndex + i);
            }

            currentIndex = numberOfHeaderRows + previousItems;

            for (i = 0; i < bodyRows.length; i++) {
                currentRow = bodyRows.eq(i);

                if (this._hasDetails() && currentRow.hasClass("k-master-row")) {
                    if (previousMaster) {
                        currentIndex = currentIndex + 2;
                    } else {
                        currentIndex = currentIndex + 1;
                    }

                    previousMaster = true;
                } else {
                    currentIndex = currentIndex + 1;
                    previousMaster = false;
                }

                currentRow.attr(ARIA_ROWINDEX, currentIndex);
            }

            currentIndex = numberOfHeaderRows + totalNumberOfItems + 1;

            for (i = 0; i < footerRows.length; i++) {
                footerRows.eq(i).attr(ARIA_ROWINDEX, currentIndex + i);
            }
        },

        _cellsIds: function(elements, prefix, i) {
            var ownedCells = [],
                gridId = this._ariaGridId();

            elements.each(function(j, cell) {
                var id = cell.getAttribute(ID) || gridId + "_" + prefix + "_" + i + "_" + j;

                cell.setAttribute(ID, id);

                ownedCells.push(id);
            });

            return ownedCells;
        },

        _trailingColumns: function() {
            return this._groups() + (this._hasDetails() ? 1 : 0);
        },

        _element: function() {
            const that = this;
            let table = that.element;


            if (!table.is("table")) {
                if (that.options.scrollable) {
                    table = that.element.find("> .k-grid-content > table");
                } else {
                    table = that.element.children("table");
                }

                if (!table.length) {
                    table = $("<table />").appendTo(that.element);
                }
            }

            table.addClass("k-grid-table k-table");
            table.addClass(kendo.getValidCssClass("k-table-", "size", that.options.size));
            that.table = table;

            that._wrapper();
        },

        _createResizeHandle: function(container, th) {
            var that = this;
            var indicatorWidth = that.options.columnResizeHandleWidth;
            var scrollable = that.options.scrollable;
            var resizeHandle = that.resizeHandle;
            var halfResizeHandle = (indicatorWidth * 3) / 2;
            var rtlCorrection = 0;
            var headerWrap;
            var ieCorrection;
            var webkitCorrection;
            var firefoxCorrection;
            var leftMargin;
            var leftBorderWidth;
            var scrollLeft;
            var left;
            var top;

            if (resizeHandle && that.lockedContent && resizeHandle.data("th")[0] !== th[0]) {
                resizeHandle.off(NS).remove();
                resizeHandle = null;
            }

            if (!resizeHandle) {
                resizeHandle = that.resizeHandle = $('<div class="k-resize-handle"><div class="k-resize-handle-inner"></div></div>');
                container.append(resizeHandle);
            }

            scrollLeft = kendo.scrollLeft(container);

            if (isRtl && (browser.mozilla || (browser.webkit && browser.version >= 85))) {
                scrollLeft = scrollLeft * -1;
            }

            leftBorderWidth = parseFloat(container.css("borderLeftWidth"));

            left = th.offset().left + scrollLeft - parseFloat(th.css("marginLeft")) - (container.offset().left + leftBorderWidth);

            if (!isRtl) {
                left += th[0].offsetWidth;
            } else {
                if (scrollable) {
                    rtlCorrection = (left <= scrollLeft ? halfResizeHandle : 0);// when shown on first column headers are misaligned due to the width of the resize handler
                    headerWrap = th.closest(".k-grid-header-wrap, .k-grid-header-locked");
                    headerWrap[0].scrollWidth - headerWrap[0].offsetWidth; // the difference between the entire width and the visible area
                    leftMargin = parseFloat(headerWrap.css("marginLeft"));
                    ieCorrection = browser.msie ? 2 * kendo.scrollLeft(headerWrap) + leftBorderWidth - leftMargin - rtlCorrection : 0;
                    webkitCorrection = -rtlCorrection;
                    firefoxCorrection = browser.mozilla ? leftBorderWidth - leftMargin - rtlCorrection : 0;

                    left -= webkitCorrection + firefoxCorrection + ieCorrection;
                }
            }

            top = th.offset().top - parseFloat(th.css("marginTop")) - (container.offset().top + parseFloat(container.css("borderTopWidth")));

            resizeHandle.css({
                top: top, //scrollable ? 0 : heightAboveHeader(that.wrapper),
                left: left - halfResizeHandle,
                height: outerHeight(th),
                width: indicatorWidth * 3 - rtlCorrection
            })
                .data("th", th)
                .show();

            resizeHandle.off(DUBLECLICK + NS).on(DUBLECLICK + NS, function() {
                that._autoFitLeafColumn(parseInt(th.attr(kendo.attr("index")), 10));
            });
        },

        _positionColumnResizeHandle: function() {
            var that = this,
                lockedHead = that.lockedHeader ? that.lockedHeader.find("thead").first() : $();

            if (that.thead) {
                that.thead.add(lockedHead).on(MOUSEMOVE + NS, "tr:not(.k-filter-row) > th:not([data-resizable=false])", function(e) {
                    var button = typeof e.buttons !== "undefined" ? e.buttons : (e.which || e.button);

                    var th = $(this);
                    if (th.hasClass("k-group-cell") || th.hasClass("k-hierarchy-cell")) {
                        return;
                    }

                    if (typeof button !== "undefined" && button !== 0) {
                        //do not create a new resize handle if a mouse button is still pressed
                        //this happens during resizing or before UserEvents trigger "start"
                        return;
                    }

                    if (th[0].hasAttribute(kendo.attr(COLSPAN))) {
                        // resizing multi-column headers is not supported
                        return;
                    }

                    that._createResizeHandle(th.closest(DIV), th);
                });
            }
        },

        _resizeHandleDocumentClick: function(e) {
            if ($(e.target).closest(".k-column-active").length) {
                return;
            }

            $(document).off(e);

            this._resetResizeHandleHeader();
            this._hideResizeHandle();
        },

        _resetResizeHandleHeader: function() {
            var th;

            if (!this.resizeHandle) {
                return;
            }

            th = $(this.resizeHandle).data("th");

            if (th) {
                th.find(DOT + LINK_CLASS).find(DOT + ICON_CLASS + "," + DOT + SVG_ICON_CLASS).show();
                th.find(DOT + ORDER_CLASS).show();
                th.find(DOT + HEADER_COLUMN_MENU_CLASS).show();
                th.find(DOT + FILTER_MENU_CLASS).show();
            }
        },

        _hideResizeHandle: function() {
            if (this.resizeHandle) {
                this.resizeHandle.data("th")
                    .removeClass("k-column-active");

                if (this.lockedContent && !this._isMobile) {
                    this.resizeHandle.off(NS).remove();
                    this.resizeHandle = null;
                } else {
                    this.resizeHandle.hide();
                }
            }
        },

        _positionColumnResizeHandleTouch: function() {
            var that = this,
                lockedHead = that.lockedHeader ? that.lockedHeader.find("thead").first() : $();

            that._resizeUserEvents = new kendo.UserEvents(lockedHead.add(that.thead), {
                filter: "th:not(.k-group-cell):not(.k-hierarchy-cell)",
                threshold: 10,
                minHold: 500,
                hold: function(e) {
                    var th = $(e.target);

                    e.preventDefault();

                    if (that.resizeHandle) {
                        that.resizeHandle.data("th")
                            .removeClass("k-column-active");
                        that._resetResizeHandleHeader();
                    }

                    th.addClass("k-column-active");

                    th.find(DOT + LINK_CLASS).find(DOT + ICON_CLASS + "," + DOT + SVG_ICON_CLASS).hide();
                    th.find(DOT + ORDER_CLASS).hide();
                    th.find(DOT + HEADER_COLUMN_MENU_CLASS).hide();
                    th.find(DOT + FILTER_MENU_CLASS).hide();

                    that._createResizeHandle(th.closest(DIV), th);

                    if (!that._resizeHandleDocumentClickHandler) {
                        that._resizeHandleDocumentClickHandler = that._resizeHandleDocumentClick.bind(that);
                    }

                    $(document).on("click", that._resizeHandleDocumentClickHandler);
                }
            });
        },

        resizeColumn: function(column, columnWidth) {
            var that = this;
            var isLocked = !!column.locked;
            var isHidden = !!column.hidden;
            var options = this.options;
            var scrollbar = !kendo.support.mobileOS ? kendo.support.scrollbar() : 0;
            var index = isLocked ? inArray(column, visibleLockedColumns(visibleLeafColumns(that.columns))) : inArray(column, visibleNonLockedColumns(visibleLeafColumns(that.columns)));
            var contentTable = isLocked ? that.lockedTable : that.table;
            var footer = that.footer || $();
            var columnMinWidth = column.minResizableWidth || 10;
            var gridWidth = isLocked ? outerWidth(contentTable.find("tbody")) : outerWidth(that.tbody); // IE returns 0 if grid is empty and scrolling is enabled
            var col;

            if (this._isStackedMode()) {
                return;
            }
            var header = isLocked ? that.lockedHeader.find("table") : that.thead.closest("table");

            if (isHidden) {
                column.width = columnWidth > columnMinWidth ? columnWidth : columnMinWidth;
                return;
            }

            if (that.footer && that.lockedContent) {
                footer = isLocked ? that.footer.children(".k-grid-footer-locked") : that.footer.children(".k-grid-footer-wrap");
            }

            if (options.scrollable) {

                col = header.find("col:not(.k-group-col,.k-hierarchy-col)").eq(index)
                    .add(contentTable.children("colgroup").find("col:not(.k-group-col):not(.k-hierarchy-col)").eq(index))
                    .add(footer.find("colgroup").find("col:not(.k-group-col):not(.k-hierarchy-col)").eq(index));
            } else {
                col = contentTable.find("colgroup").find("col:not(.k-group-col):not(.k-hierarchy-col)").eq(index);
            }

            if (options.scrollable) {
                var constrain = false;
                var totalWidth = that.wrapper.width() - scrollbar;
                var width = columnWidth = columnWidth > columnMinWidth ? columnWidth : columnMinWidth;

                if (isLocked && gridWidth - columnWidth + width > totalWidth) {
                    width = columnWidth + (totalWidth - gridWidth - scrollbar * 2);
                    if (width < 0) {
                        width = columnWidth;
                    }
                    constrain = true;
                }

                if (width > 10 && width >= columnMinWidth) {
                    col.css('width', width);

                    if (gridWidth) {
                        if (constrain) {
                            width = totalWidth - scrollbar * 2;
                        } else {
                            width = gridWidth + (columnWidth - column.width);
                        }

                        contentTable
                            .add(header)
                            .add(footer)
                            .css('width', width);

                        if (!isLocked) {
                            that._footerWidth = width;
                        }
                    }
                }

                that._scrollVirtualWrapperOnColumnResize();
            } else if (columnWidth > 10 && columnWidth >= columnMinWidth) {
                col.css('width', columnWidth);
            }

            column.width = columnWidth;

            that._applyLockedContainersWidth();
            that._syncLockedContentHeight();
            that._syncLockedHeaderHeight();
            that._updateStickyColumns();
        },

        _adjustColWidths: function(contentTable, header, footer, gridWidth) {
            const colWidths = {};

            contentTable
                .add(header)
                .add(footer)
                .css('width', gridWidth);

            contentTable
                .add(header)
                .add(footer)
                .find("col")
                .each((i, col) => {
                    // Retrieve the actual widths of the elements.
                    colWidths[i] = $(col).css("width");
                });

            contentTable
                .add(header)
                .add(footer)
                .find("col")
                .each((i, col) => {
                    // Ensure that the style="width" attribute on the col elements matches the real width of the columns.
                    $(col).css("width", colWidths[i]);
                });
        },

        _resizable: function() {
            var that = this,
                options = that.options,
                container,
                columnStart,
                columnWidth,
                columnMinWidth,
                gridWidth,
                isMobile = this._isMobile,
                scrollbar = !kendo.support.mobileOS ? kendo.support.scrollbar() : 0,
                isLocked,
                col, th;

            if (!that._isStackedMode() && (options.resizable === true || (options.resizable && options.resizable.columns === true))) {
                container = options.scrollable ? that.wrapper.find(".k-grid-header-wrap").first() : that.wrapper;

                if (isMobile) {
                    that._positionColumnResizeHandleTouch(container);
                } else {
                    that._positionColumnResizeHandle(container);
                }

                if (that.resizable) {
                    that.resizable.destroy();
                }

                that.resizable = new ui.Resizable(container.add(that.lockedHeader), {
                    handle: (!!options.scrollable ? "" : ">") + ".k-resize-handle",
                    hint: function(handle) {
                        return $('<div class="k-grid-resize-indicator" />').css({
                            height: outerHeight(handle.data("th")) + that.tbody.attr("clientHeight")
                        });
                    },
                    start: function(e) {
                        th = $(e.currentTarget).data("th");

                        if (isMobile) {
                            that._hideResizeHandle();
                        }

                        let header = th.closest("table"),
                            index = $.inArray(th[0], leafDataCells(th.closest("thead")).filter(":visible"));

                        isLocked = header.parent().hasClass("k-grid-header-locked");

                        let contentTable = isLocked ? that.lockedTable : that.table,
                            footer = that.footer || $();

                        if (that.footer && that.lockedContent) {
                            footer = isLocked ? that.footer.children(".k-grid-footer-locked") : that.footer.children(".k-grid-footer-wrap");
                        }

                        let footerTable = footer.find("table");

                        cursor(that.wrapper, 'col-resize');

                        if (options.scrollable) {
                            col = header.find("col:not(.k-group-col):not(.k-hierarchy-col)").eq(index)
                                .add(contentTable.children("colgroup").find("col:not(.k-group-col):not(.k-hierarchy-col)").eq(index))
                                .add(footer.find("colgroup").find("col:not(.k-group-col):not(.k-hierarchy-col)").eq(index));
                        } else {
                            col = contentTable.children("colgroup").find("col:not(.k-group-col):not(.k-hierarchy-col)").eq(index);
                        }

                        let columns = $.map(that.columns, function(a) {
                            return !a.hidden && ((isLocked && a.locked) || ((!isLocked && !a.locked))) ? a : null;
                        });

                        columnStart = e.x.location;
                        columnWidth = outerWidth(th);
                        columnMinWidth = leafColumns(columns)[index].minResizableWidth || 10;
                        gridWidth = isLocked ? outerWidth(contentTable.children("tbody")) : outerWidth(that.tbody); // IE returns 0 if grid is empty and scrolling is enabled

                        // fix broken UI in Chrome38+
                        if (browser.webkit) {
                            that.wrapper.addClass("k-grid-column-resizing");
                        }

                        that._adjustColWidths(contentTable, header, footerTable, gridWidth);
                    },
                    resize: function(e) {
                        var rtlMultiplier = isRtl ? -1 : 1,
                            currentWidth = columnWidth + (e.x.location * rtlMultiplier) - (columnStart * rtlMultiplier);

                        if (options.scrollable) {
                            var footer;
                            if (isLocked && that.lockedFooter) {
                                footer = that.lockedFooter.children("table");
                            } else if (that.footer) {
                                footer = that.footer.find(">.k-grid-footer-wrap>table");
                            }
                            if (!footer || !footer[0]) {
                                footer = $();
                            }
                            var header = th.closest("table");
                            var contentTable = isLocked ? that.lockedTable : that.table;
                            var constrain = false;
                            var totalWidth = that.wrapper.width() - scrollbar;
                            var width = currentWidth;

                            if (isLocked && gridWidth - columnWidth + width > totalWidth) {
                                width = columnWidth + (totalWidth - gridWidth - scrollbar * 2);
                                if (width < 0) {
                                    width = currentWidth;
                                }
                                constrain = true;
                            }

                            if (width > 10 && width >= columnMinWidth) {
                                col.css('width', width);

                                if (gridWidth) {
                                    if (constrain) {
                                        width = totalWidth - scrollbar * 2;
                                    } else {
                                        width = gridWidth + (e.x.location * rtlMultiplier) - (columnStart * rtlMultiplier);
                                    }

                                    contentTable
                                        .add(header)
                                        .add(footer)
                                        .css('width', width);

                                    if (!isLocked) {
                                        that._footerWidth = width;
                                    }
                                }
                            }

                            that._scrollVirtualWrapperOnColumnResize();
                        } else if (currentWidth > 10 && currentWidth >= columnMinWidth) {
                            col.css('width', currentWidth);
                        }
                    },
                    resizeend: function() {
                        var newWidth = outerWidth(th),
                            column,
                            header;

                        cursor(that.wrapper, "");

                        if (browser.webkit) {
                            that.wrapper.removeClass("k-grid-column-resizing");
                        }

                        if (th && columnWidth != newWidth) {
                            header = that.lockedHeader ? that.lockedHeader.find("thead").first().find(TR).first().add(that.thead.find(TR).first()) : th.parent();

                            var index = th.attr(kendo.attr("index"));
                            if (!index) {
                                index = header.find("th:not(.k-group-cell):not(.k-hierarchy-cell)").index(th);
                            }
                            column = leafColumns(that.columns)[index];

                            column.width = newWidth;

                            that.trigger(COLUMNRESIZE, {
                                column: column,
                                oldWidth: columnWidth,
                                newWidth: newWidth
                            });

                            that._applyLockedContainersWidth(true);
                            that._syncLockedContentHeight();
                            that._syncLockedHeaderHeight();
                            that._updateStickyColumns();
                        }

                        that._resetResizeHandleHeader();
                        that._hideResizeHandle();
                        th = null;
                    }
                });

            }
        },

        // Row resizing functionality below
        _addLockedRowResizing: function(tr) {
            var index = tr.index();

            return this.lockedTable.find(TR).eq(index)
                .add(this.tbody.find(TR).eq(index));
        },

        _getMinRowHeight: function(row) {
            var minHeight = 0;

            row.each((i, el) => {
                var currentMinHeight;

                el.style.height = '';
                currentMinHeight = outerHeight(el);

                if (currentMinHeight > minHeight) {
                    minHeight = currentMinHeight;
                }
            });

            return minHeight;
        },

        _cacheRowHeight: function(rows, height) {
            var that = this;

            if (!that._cachedRowsHeight) {
                that._cachedRowsHeight = {};
            }

            rows.each((i, el) => {
                var uid = el.getAttribute("data-uid");

                that._cachedRowsHeight[uid] = height;
            });
        },

        _clearCachedRowsHeight: function(rows) {
            var that = this;

            if (rows && that._cachedRowsHeight) {
                rows.each((i, el) => {
                    var uid = el.getAttribute("data-uid");

                    delete that._cachedRowsHeight[uid];
                });
            } else {
                that._cachedRowsHeight = null;
            }
        },

        _mapCachedRowsHeight: function(method, target) {
            var input = this._cachedRowsHeight,
                ds = this.dataSource,
                output = {};

            Object.keys(input).forEach((key) => {
                var item = ds[method](key);

                if (item) {
                    output[item[target]] = input[key];
                }
            });

            this._cachedRowsHeight = output;
        },

        _rowResizerDblClick: function() {
            var that = this,
                resizer = that.rowResizer,
                row = resizer.data(TR),
                oldHeight = outerHeight(row),
                newHeight, rows;

            if (row.hasClass(SELECTED)) {
                rows = that.select();
            } else {
                rows = row;
            }

            if (that.lockedTable) {
                row = that._addLockedRowResizing(row);

                if (row.hasClass(SELECTED)) {
                    rows = that.lockedTable.find(DOT + SELECTED);
                } else {
                    rows = that.lockedTable.find(TR).eq(row.index());
                }

                rows.each((i, el) => {
                    var rowIndex = el.rowIndex,
                        rowPair = $(el).add(that.tbody.find(TR).eq(rowIndex)),
                        pairMinHeight = that._getMinRowHeight(rowPair);

                    rowPair.css(HEIGHT, pairMinHeight);
                });
            } else {
                rows.css(HEIGHT, AUTO);
            }

            that._clearCachedRowsHeight(rows);

            resizer.removeClass(HOVER);
            resizer.removeClass(ACTIVE);

            newHeight = outerHeight(row);

            if (oldHeight != newHeight) {
                that.trigger(ROWRESIZE, {
                    row,
                    rows,
                    oldHeight,
                    newHeight
                });
            }
        },

        _setupRowResizer(resizer, row, top) {
            resizer
                .data(TR, row)
                .css({
                    top: top
                });
        },

        _attachRowResizerEvents: function() {
            var rowResizer = this.rowResizer,
                delay = 200,
                isIn = false;

            rowResizer
                .on(MOUSEDOWN + NS, (e) => {
                    if (e.button === 0) {
                        rowResizer.removeClass(HOVER);
                        rowResizer.addClass(ACTIVE);
                    }
                })
                .on(MOUSEUP + NS, (e) => {
                    if (e.button === 0) {
                        rowResizer.removeClass(ACTIVE);
                        rowResizer.addClass(HOVER);
                    }
                })
                .on(MOUSEENTER + NS, () => {
                    isIn = true;

                    setTimeout(() => {
                        if (isIn) {
                            rowResizer.addClass(HOVER);
                        }
                    }, delay);
                })
                .on(MOUSELEAVE + NS, () => {
                    isIn = false;
                    rowResizer.removeClass(HOVER);
                });
        },

        _getResizerTop: function(tr, container) {
            var resizer = this.rowResizer,
                inner = resizer.find(DOT + ROW_RESIZER)[0],
                paddingTop = parseInt(getComputedStyle(resizer[0]).paddingTop);

            return tr.offset().top -
                parseFloat(tr.css("marginTop")) -
                (container.offset().top + parseFloat(container.css("borderTopWidth"))) -
                inner.clientHeight -
                paddingTop +
                container.scrollTop();
        },

        _getResizerContainer: function() {
            var container = this.tbody.closest(DIV);

            if (this.lockedTable) {
                container = container.closest(DOT + "k-grid-container");
            }

            return container;
        },

        _createRowResizer: function(e) {
            var that = this,
                tr = $(e.currentTarget),
                targetHeight = e.currentTarget.clientHeight,
                positionIntarget = e.offsetY,
                rowResizer = that.rowResizer,
                previousRow = tr.prev(TR + ":visible"),
                container = that._getResizerContainer(),
                top;

            if (!rowResizer) {
                rowResizer = that.rowResizer = $('<div class="k-resizer-wrap"><div class="k-row-resizer"></div></div>');
                container.append(rowResizer);
                that._attachRowResizerEvents();

                rowResizer.off(DUBLECLICK + NS).on(DUBLECLICK + NS, that._rowResizerDblClick.bind(that));
            }

            top = that._getResizerTop(tr, container);

            if (previousRow.length !== 0 && targetHeight / 2 > positionIntarget) {
                if (!previousRow.hasClass(GROUPING_ROW)) {
                    that._setupRowResizer(rowResizer, previousRow, top);
                }
            } else {
                if (!tr.hasClass(GROUPING_ROW)) {
                    that._setupRowResizer(rowResizer, tr, top + targetHeight);
                }
            }
        },

        _detachRowResizerEvents: function() {
            var rowResizer = this.rowResizer;

            rowResizer
                .off(MOUSEDOWN + NS)
                .off(MOUSEUP + NS)
                .off(MOUSEENTER + NS)
                .off(MOUSELEAVE + NS);
        },

        _mapResizedRows: function(rows, multiSelectionLocked, newHeight) {
            var that = this;

            rows.each((i, el) => {
                var minHeight;

                if (multiSelectionLocked) {
                    var rowIndex = el.rowIndex,
                        pairNew = newHeight,
                        pairMin = 0,
                        rowPair = $(el).add(that.tbody.find(TR).eq(rowIndex));

                    rowPair.each((i, r) => {
                        var currentMinHeight;

                        r.style.height = '';
                        currentMinHeight = outerHeight(r);

                        if (currentMinHeight > pairMin) {
                            pairMin = currentMinHeight;
                        }
                    });

                    if (pairNew < pairMin) {
                        pairNew = pairMin;

                        that._clearCachedRowsHeight(rowPair.eq(0));
                    } else {
                        that._cacheRowHeight(rowPair.eq(0), pairNew);
                    }

                    rowPair.css(HEIGHT, pairNew);
                } else {
                    el.style.height = '';
                    minHeight = outerHeight(el);

                    if (newHeight > minHeight) {
                        el.style.height = newHeight + PX;

                        that._cacheRowHeight($(el), newHeight);
                    } else {
                        that._clearCachedRowsHeight($(el));
                    }
                }
            });
        },

        _rowResizing: function() {
            var that = this,
                options = that.options,
                container, rowStart, rowHeight, tr;

            if (options.resizable && options.resizable.rows === true) {
                that.tbody
                    .parent()
                    .add(that.lockedTable)
                    .on(MOUSEMOVE + NS, ".k-grid-footer tr, .k-table-tbody tr", that._createRowResizer.bind(that));

                if (that.rowResizing) {
                    that.rowResizing.destroy();
                }

                container = that._getResizerContainer();

                that.rowResizing = new ui.Resizable(container, {
                    handle: DOT + ROW_RESIZER_WRAP,
                    start: function(e) {
                        tr = $(e.currentTarget).data(TR);

                        if (that.lockedTable) {
                            tr = that._addLockedRowResizing(tr);
                        }

                        tr.addClass(HOVER);

                        that._detachRowResizerEvents();

                        rowStart = e.y.location;
                        rowHeight = outerHeight(tr);
                    },
                    resize: function(e) {
                        var newHeight = rowHeight + e.y.location - rowStart,
                            minHeight = 0;

                        if (tr.length > 1) {
                            minHeight = that._getMinRowHeight(tr);
                        }

                        if (newHeight < minHeight) {
                            newHeight = minHeight;
                        }

                        tr.css('height', newHeight);

                        that._setupRowResizer(that.rowResizer, tr, that._getResizerTop(tr, container) + newHeight);
                    },
                    resizeend: function() {
                        var newHeight = outerHeight(tr),
                            multiSelectionLocked = false,
                            rows;

                        if (tr.hasClass(SELECTED)) {
                            rows = that.select();

                            if (tr.length > 1 && rows.length > tr.length) {
                                rows = that.lockedTable.find(DOT + SELECTED).not(tr);
                                multiSelectionLocked = true;
                            }
                        } else {
                            rows = tr;
                        }

                        that._mapResizedRows(rows, multiSelectionLocked, newHeight);

                        tr.removeClass(HOVER);

                        that.rowResizer.removeClass(ACTIVE);
                        that.rowResizer.addClass(HOVER);
                        that._attachRowResizerEvents();

                        if (multiSelectionLocked) {
                            rows = that.select();
                        }

                        if (rowHeight != newHeight) {
                            that.trigger(ROWRESIZE, {
                                row: tr,
                                rows,
                                oldHeight: rowHeight,
                                newHeight
                            });
                        }

                        tr = null;
                    }
                });
            }
        },

        _draggable: function() {
            var that = this,
                reorderable = that.options.reorderable;

            if (reorderable === true || (reorderable && reorderable.columns)) {

                if (that._draggableInstance) {
                    that._draggableInstance.destroy();
                }

                var header = that.wrapper.children(".k-grid-header");
                header.addClass("k-grid-draggable-header");

                that._draggableInstance = that.wrapper.kendoDraggable({
                    group: kendo.guid(),
                    autoScroll: true,
                    filter: that.content ? ".k-grid-header:first " + HEADERCELLS : "table:first>.k-grid-header " + HEADERCELLS,
                    dragstart: function() {
                        header.children(".k-grid-header-wrap").off("scroll" + NS + "scrolling").on("scroll" + NS + "scrolling", function(e) {
                            if (that.virtualScrollable) {
                                kendo.scrollLeft(that.content.find(">.k-virtual-scrollable-wrap"), this.scrollLeft);
                            } else {
                                kendo.scrollLeft(that.scrollables.not(e.currentTarget), this.scrollLeft);
                            }
                        });
                    },
                    dragend: function() {
                        that._resetResizeHandleHeader();
                        header.children(".k-grid-header-wrap").off("scroll" + NS + "scrolling");
                    },
                    drag: function() {
                        that._hideResizeHandle();
                    },
                    hint: function(target) {
                        var title = target.attr(kendo.attr("title"));
                        if (title) {
                            title = kendo.htmlEncode(title);
                        }
                        return $('<div class="k-reorder-clue k-drag-clue" />')
                            .html(title || target.attr(kendo.attr("field")) || target.text())
                            .prepend(kendo.ui.icon({ icon: "cancel", iconClass: "k-drag-status" }));
                    }
                }).data("kendoDraggable");
            }
        },

        _reorderable: function() {
            let that = this,
                reorderable = that.options.reorderable;

            if (reorderable === true || (reorderable && reorderable.columns)) {
                if (that.wrapper.data("kendoReorderable")) {
                    that.wrapper.data("kendoReorderable").destroy();
                }

                that.wrapper.kendoReorderable({
                    draggable: that._draggableInstance,
                    dropFilter: HEADERCELLS,
                    allowDropAfterLastItem: true,
                    dragOverContainers: function(sourceIndex, targetIndex) {
                        let columns = flatColumnsInDomOrder(that.columns);
                        return columns[sourceIndex].lockable !== false && targetParentContainerIndex(columns, that.columns, sourceIndex, targetIndex) > -1;
                    },
                    inSameContainer: function(e) {
                        let sourceParent = $(e.source).parent()[0],
                            targetParent = $(e.target).parent()[0],
                            sourceIndex = e.sourceIndex,
                            targetIndex = e.targetIndex,
                            flatColumns = flatColumnsInDomOrder(that.columns),
                            lockable = flatColumns && flatColumns[sourceIndex] && !!flatColumns[sourceIndex].lockable;

                        /* If there are locked columns, check if the grid header is the same instead.
                        Otherwise the locked/unlocked headers are treated as separate(in the case of column reordering they shouldn't be). */
                        if (that._isLocked() && lockable) {
                            sourceParent = $(e.source.closest(".k-grid-header"))[0];
                            targetParent = $(e.target.closest(".k-grid-header"))[0];
                        }

                        return sourceParent === targetParent && targetParentContainerIndex(flatColumns, that.columns, sourceIndex, targetIndex) > -1;
                    },
                    change: function(e) {
                        let columns = flatColumnsInDomOrder(that.columns);
                        let column = columns[e.oldIndex];
                        let newIndex = targetParentContainerIndex(columns, that.columns, e.oldIndex, e.newIndex);

                        that.trigger(COLUMNREORDER, {
                            newIndex: newIndex,
                            oldIndex: inArray(column, columns),
                            column: column
                        });

                        that.reorderColumn(newIndex, column, e.position === "before");
                    }
                });
            }
        },

        _reorderHeader: function(sources, target, before, container) {
            var that = this;
            var sourcePosition = columnPosition(sources[0], that.columns);
            var destPosition = columnPosition(target, that.columns);
            var action;
            var ths;

            var leafs = [];
            for (var idx = 0; idx < sources.length; idx++) {
                if (sources[idx].columns) {
                    leafs = leafs.concat(sources[idx].columns);
                }
            }
            if (container) {
                ths = elements(container, container, "tr:eq(" + sourcePosition.row + ")>th.k-header:not(.k-group-cell,.k-hierarchy-cell)");
            } else {
                ths = elements(that.lockedHeader, that.thead, "tr:eq(" + sourcePosition.row + ")>th.k-header:not(.k-group-cell,.k-hierarchy-cell)");
            }

            var sourceLockedColumns = lockedColumns(sources).length;
            var targetLockedColumns = lockedColumns([target]).length;

            if (leafs.length) {
                if (sourceLockedColumns > 0 && targetLockedColumns === 0) {
                    action = "prepend";
                    moveCellsBetweenContainers(sources, target, leafs, that.columns, that.lockedHeader.find("thead"), that.thead, this._groups(), action);
                } else if (sourceLockedColumns === 0 && targetLockedColumns > 0) {
                    action = destPosition.cell === 0 && sources[0].columns && !target.columns && !that._group ? "prepend" : "append";
                    moveCellsBetweenContainers(sources, target, leafs, nonLockedColumns(that.columns), that.thead, that.lockedHeader.find("thead"), this._groups(), action);
                }

                if (target.columns || sourcePosition.cell - destPosition.cell > 1 || destPosition.cell - sourcePosition.cell > 1) {
                    target = findReorderTarget(that.columns, target, sources[0], before, that.columns);
                    if (target) {
                        if (sourceLockedColumns > 0 && targetLockedColumns === 0) {
                            that._reorderHeader(leafs, target, before, that.thead);
                        } else if (sourceLockedColumns === 0 && targetLockedColumns > 0) {
                            that._reorderHeader(leafs, target, before, that.lockedHead);
                        } else {
                            that._reorderHeader(leafs, target, before);
                        }
                    }
                }
            } else if (sourceLockedColumns !== targetLockedColumns) { // move between containers
                updateCellRowSpan(ths[sourcePosition.cell], that.columns, sourceLockedColumns);
            }

            reorder(ths, sourcePosition.cell, destPosition.cell, before, sources.length);
        },

        _reorderContent: function(sources, destination, before) {
            var that = this;
            var lockedRows = $();
            var source = sources[0];
            var visibleSources = visibleColumns(sources);
            var sourceIndex = inArray(source, leafColumns(that.columns));
            var destIndex = inArray(destination, leafColumns(that.columns));

            var colSourceIndex = inArray(visibleSources[0], visibleLeafColumns(that.columns));
            var colDest = inArray(destination, visibleLeafColumns(that.columns));
            var lockedCount = lockedColumns(that.columns).length;
            var isLocked = !!destination.locked;
            var footer = that.footer || that.wrapper.find(".k-grid-footer");

            var headerCol, footerCol, beforeVisibleColumn;
            headerCol = footerCol = colDest;

            if (destination.hidden) {
                var columnsArray = isLocked ? lockedColumns(that.columns) : nonLockedColumns(that.columns);

                if (visibleColumns(columnsArray).length > 0) {
                    headerCol = footerCol = colDest = this._findClosestVisibleColumnIndex(columnsArray, destIndex);
                    beforeVisibleColumn = visibleColumns(columnsArray.slice(destIndex)).length > 0;
                }
                else {
                    if (isLocked) {
                        colDest = that.lockedTable.find("colgroup");
                        headerCol = that.lockedHeader.find("colgroup");
                        footerCol = $(that.lockedFooter).find(">table>colgroup");
                    } else {
                        colDest = that.tbody.prev();
                        headerCol = that.thead.prev();
                        footerCol = footer.find(".k-grid-footer-wrap").find(">table>colgroup");
                    }
                }
            }

            if (that._hasFilterRow()) {
                reorder(that.wrapper.find(".k-filter-row td:not(.k-group-cell,.k-hierarchy-cell)"), sourceIndex, destIndex, before, sources.length);
            }

            if (colSourceIndex >= 0) {
                reorder(elements(that.lockedHeader, that.thead.prev(), COLGROUP), colSourceIndex, headerCol, beforeVisibleColumn ? beforeVisibleColumn : before, visibleSources.length);
            }

            if (that.options.scrollable) {
                if (colSourceIndex >= 0 && !that._hasVirtualColumns()) {
                    reorder(elements(that.lockedTable, that.tbody.prev(), COLGROUP), colSourceIndex, colDest, beforeVisibleColumn ? beforeVisibleColumn : before, visibleSources.length);
                }
            }

            if (footer && footer.length) {
                if (colSourceIndex >= 0) {
                    reorder(elements(that.lockedFooter, footer.find(".k-grid-footer-wrap"), ">table>colgroup>col:not(.k-group-col,.k-hierarchy-col)"), colSourceIndex, footerCol, beforeVisibleColumn ? beforeVisibleColumn : before, visibleSources.length);
                }
                reorder(footer.find(".k-footer-template>td:not(.k-group-cell,.k-hierarchy-cell)"), sourceIndex, destIndex, before, sources.length);
            }

            var rows = that.tbody.children(":not(.k-grouping-row,.k-detail-row)");
            if (that.lockedTable) {
                if (lockedCount > destIndex) {
                    if (lockedCount <= sourceIndex) {
                        updateColspan(
                            that.lockedTable.find(">tbody>tr.k-grouping-row:not([hidden])"),
                            that.table.find(">tbody>tr.k-grouping-row:not([hidden])"),
                            sources.length
                        );
                    }
                } else if (lockedCount > sourceIndex) {
                    updateColspan(
                        that.table.find(">tbody>tr.k-grouping-row:not([hidden])"),
                        that.lockedTable.find(">tbody>tr.k-grouping-row:not([hidden])"),
                        sources.length
                    );
                }

                lockedRows = that.lockedTable.find(">tbody>tr:not(.k-grouping-row,.k-detail-row)");
            }

            for (var idx = 0, length = rows.length; idx < length; idx += 1) {
                reorder(elements(lockedRows[idx], rows[idx], ">td:not(.k-group-cell,.k-hierarchy-cell)"), sourceIndex, destIndex, before, sources.length);
            }
        },

        _findClosestVisibleColumnIndex: function(columns, columnIndex) {
            var columnsArray = visibleColumns(columns.slice(columnIndex)).length > 0 ? columns.slice(columnIndex) : columns.slice(0, columnIndex + 1).reverse(),
                closestVisibleColumn = visibleColumns(columnsArray)[0];

            return inArray(closestVisibleColumn, visibleColumns(this.columns));
        },

        _autoFitLeafColumn: function(leafIndex) {
            this.autoFitColumn(leafColumns(this.columns)[leafIndex]);
        },

        _hasReorderableRows: function() {
            return this.options.reorderable && this.options.reorderable.rows;
        },

        _draggableRows: function() {
            var that = this,
                selectable = that._checkBoxSelection ||
                    (that.options.selectable && !kendo.ui.Selectable.parseOptions(that.options.selectable).cell),
                clickMoveClick = false,
                isMobile = !!(that._isMobile || kendo.support.mobileOS);

            if (that._draggableRowsInstance) {
                that._draggableRowsInstance.destroy();
            }

            if (this.options.reorderable.rows.clickMoveClick !== false && this._hasDragHandleColumn) {
                clickMoveClick = true;
            }

            that._draggableRowsInstance = that.tbody.kendoDraggable({
                holdToDrag: isMobile,
                showHintOnHold: isMobile,
                preventOsHoldFeatures: isMobile,
                group: "row-draggable",
                autoScroll: true,
                filter: (selectable ? " > .k-selected" : " > " + ITEMROW) + (that._hasDragHandleColumn ? " > [ref-grid-drag-cell]" : ":not(:has([data-container-for]))"),
                hint: function(target) {
                    var hint = $('<div class="k-reorder-clue k-drag-clue">' + kendo.ui.icon({ icon: "cancel", iconClass: "k-drag-status" }) + '</div>');

                    if (selectable && that.select().length > 1 && that.lockedContent) {
                        hint.append("<span>" + that.select().length / 2 + " " + encode(that.options.messages.itemsSelected) + "</span>");
                    } else if (selectable && that.select().length > 1 && !that.lockedContent) {
                        hint.append("<span>" + that.select().length + " " + encode(that.options.messages.itemsSelected) + "</span>");
                    } else {
                        var clone = target.closest(ITEMROW).clone();
                        clone.find("td.k-command-cell").remove();
                        clone.find("td").each(function(index, elm) {
                            hint.append("<span>" + elm.innerText.replace(/<(\/?)script([^>]*)>/ig, "") + "&nbsp;</span>");
                        });
                    }

                    return hint;
                },
                clickMoveClick: clickMoveClick,
                cursorOffset: { top: 0, left: 0 }
            }).data("kendoDraggable");
        },

        _reorderableRows: function() {
            var that = this,
                selectable = that._checkBoxSelection ||
                    (that.options.selectable && !kendo.ui.Selectable.parseOptions(that.options.selectable).cell);

            if (that.tbody.data("kendoReorderable")) {
                that.tbody.data("kendoReorderable").destroy();
            }

            that.tbody.kendoReorderable({
                smartPosition: false,
                draggable: that._draggableRowsInstance,
                dragOverContainers: function(sourceIndex, targetIndex) {
                    var result = true,
                        target = $(ITEMROW, that.content).eq(targetIndex);

                    if (selectable) {
                        result = !target.is(".k-selected");
                    }

                    return result;
                },
                inSameContainer: function(e) {
                    if (selectable) {
                        return !$(e.target).is(".k-selected");
                    }

                    return true;
                },
                dropFilter: "> " + ITEMROW,
                allowIcon: "insert-middle",
                orientation: "vertical",
                reorderDropCue: $('<div class="k-drop-hint k-drop-hint-h"><div class="k-drop-hint-start"></div><div class="k-drop-hint-line"></div></div>'),
                positionDropCue: function(reorderDropCue, dropTarget) {
                    var firstCellLeft = kendo.getOffset(dropTarget.children(DATA_CELL).eq(0)).left;
                    reorderDropCue.css({
                        transform: "translate(0,-50%)",
                        left: firstCellLeft
                    });
                },
                externalDraggable: function(e) {
                    var draggable = e.draggable;

                    if (draggable) {
                        return draggable;
                    }
                },
                change: function(e) {
                    that._triggerRowRorder(e);
                }
            });
        },

        _triggerRowRorder: function(e) {
            var that = this,
                args = {
                    newIndex: e.position === "after" ? e.newIndex + 1 : e.newIndex,
                    oldIndex: e.oldIndex
                },
                row = e.element,
                selectable = that._checkBoxSelection ||
                    (that.options.selectable && !kendo.ui.Selectable.parseOptions(that.options.selectable).cell);

            if (selectable && that.select().length > 1) {
                args = extend(args, {
                    rows: that.select()
                });
            } else {
                args = extend(args, {
                    row: row
                });
            }

            if (!that.trigger(ROWREORDER, args)) {
                that.reorderRows(selectable ? that.select() : row, args.newIndex);
            }
        },

        reorderRowTo: function(row, index) {
            var that = this,
                item = that.dataItem(row),
                oldIndex = row.index();

            if (index < 0 || index === oldIndex) {
                return;
            }

            if (!that.trigger(ROWREORDER, {
                row: row,
                oldIndex: row.index(),
                newIndex: index
            })) {
                that.dataSource.pushMove(index, [item]);
            }
        },

        reorderRows: function(rows, index) {
            var that = this,
                dataSource = that.dataSource,
                rowsLength = that.tbody.children(ITEMROW).length,
                targetItem = that.dataItem(that.tbody.children(ITEMROW).eq(index)),
                items = rows.toArray().map(function(row) {
                    let dataItem = that.dataItem(row);
                    dataItem._isMoved = true;
                    return dataItem;
                });

            if (!targetItem) {
                // If index is after last row dataItem wouldn't exist
                targetItem = that.dataItem(that.tbody.children(ITEMROW).eq(rowsLength - 1));
                index = dataSource.indexOf(targetItem) + 1;
            } else {
                index = dataSource.indexOf(targetItem);
            }

            if (index >= 0) {
                that._rowDropping = true;
                dataSource.pushMove(index, items);
                that._rowDropping = false;
            }
        },

        autoFitColumns: function(columns) {
            var that = this;

            columns = columns || that.columns;

            for (var i = 0; i < columns.length; i++) {
                var column = columns[i];

                if (column.columns) {
                    that.autoFitColumns(column.columns);
                } else {
                    that.autoFitColumn(column);
                }
            }
        },

        autoFitColumn: function(column) {
            var that = this,
                options = that.options,
                columns = that.columns,
                index,
                th,
                headerTable,
                leafCols,
                isLocked,
                visibleLocked = that.lockedHeader ? leafDataCells(that.lockedHeader.find(">table>thead")).filter(isCellVisible).length : 0,
                col,
                minWidth,
                contentDiv, scrollLeft,
                notGroupOrHierarchyCol = "col:not(.k-group-col):not(.k-hierarchy-col)",
                notGroupOrHierarchyVisibleCell = "td:visible:not(.k-group-cell):not(.k-hierarchy-cell)",
                thWidth;

            //  retrieve the column object, depending on the method argument
            if (typeof column == "number") {
                column = columns[column];
            } else if (isPlainObject(column)) {
                column = grep(flatColumns(columns), function(item) {
                    return item === column;
                })[0];
            } else {
                column = grep(flatColumns(columns), function(item) {
                    return item.field === column;
                })[0];
            }

            if (!column || !isVisible(column)) {
                return;
            }

            leafCols = leafColumns(columns);
            minWidth = column.minResizableWidth;
            index = inArray(column, leafCols);
            isLocked = column.locked;

            if (isLocked) {
                headerTable = that.lockedHeader.children("table");
            } else {
                headerTable = that.thead.parent();
            }

            th = headerTable.find("[data-index='" + index + "']");
            th.find('a.k-grid-column-menu, a.k-grid-filter-menu');

            var contentTable = isLocked ? that.lockedTable : that.table,
                footer = that.footer || $();

            if (that.footer && that.lockedContent) {
                footer = isLocked ? that.footer.children(".k-grid-footer-locked") : that.footer.children(".k-grid-footer-wrap");
            }

            var footerTable = footer.find("table").first();

            if (that.lockedHeader && !isLocked) {
                index -= visibleLocked;
            }

            // adjust column index, depending on previous hidden columns
            for (var j = 0; j < leafCols.length; j++) {
                if (leafCols[j] === column) {
                    break;
                } else {
                    if (leafCols[j].hidden) {
                        index--;
                    }
                }
            }

            // get col elements
            if (options.scrollable) {
                col = headerTable.find(notGroupOrHierarchyCol).eq(index)
                    .add(contentTable.children("colgroup").find(notGroupOrHierarchyCol).eq(index))
                    .add(footerTable.find("colgroup").find(notGroupOrHierarchyCol).eq(index));

                if (!isLocked) {
                    contentDiv = contentTable.parent();
                    scrollLeft = kendo.scrollLeft(contentDiv);
                }

                if (that._hasVirtualColumns()) {
                    index = inArray(column, that.virtualCols);
                }
            } else {
                col = contentTable.children("colgroup").find(notGroupOrHierarchyCol).eq(index);
            }

            var tables = headerTable.add(contentTable).add(footerTable);

            if (browser.safari) {
                th.css("white-space", "initial");
            }

            var oldColumnWidth = outerWidth(th);

            // reset the table and autofitted column widths
            // if scrolling is disabled, we need some additional repainting of the table
            col.width("");
            tables.css("table-layout", "fixed");
            col.width(AUTO);
            tables.addClass("k-autofitting");
            tables.css("table-layout", "");

            thWidth = outerWidth(th);

            // +1 is required by IE, regardless of the border widths, otherwise unexpected wrapping may occur with hyphenated text
            var newColumnWidth = Math.ceil(Math.max(
                thWidth,
                outerWidth(contentTable.find("tr:not(.k-grouping-row)").eq(0).children(notGroupOrHierarchyVisibleCell).eq(index)),
                outerWidth(footerTable.find(TR).eq(0).children(notGroupOrHierarchyVisibleCell).eq(index))
            )) + 1;

            if (minWidth && minWidth > newColumnWidth) {
                newColumnWidth = minWidth;
            }

            col.width(newColumnWidth);
            column.width = newColumnWidth;

            if (browser.safari) {
                th.css("white-space", "");
            }

            // if all visible columns have widths, the table needs a pixel width as well
            if (options.scrollable) {
                var cols = headerTable.find("col"),
                    colWidth,
                    totalWidth = 0;
                for (var idx = 0, length = cols.length; idx < length; idx += 1) {
                    colWidth = cols[idx].style.width;
                    if (colWidth && colWidth.indexOf("%") == -1) {
                        totalWidth += parseInt(colWidth, 10);
                    } else if (cols.eq(idx).hasClass("k-group-col")) {
                        totalWidth += parseInt(cols.eq(idx).width(), 10);
                    } else {
                        totalWidth = 0;
                        break;
                    }
                }

                if (totalWidth) {
                    tables.each(function() {
                        this.style.width = totalWidth + PX;
                    });
                }
            }

            tables.removeClass("k-autofitting");

            if (scrollLeft) {
                kendo.scrollLeft(contentDiv, scrollLeft);
            }

            that.trigger(COLUMNRESIZE, {
                column: column,
                oldWidth: oldColumnWidth,
                newWidth: newColumnWidth
            });

            that._applyLockedContainersWidth();
            that._syncLockedContentHeight();
            that._syncLockedHeaderHeight();
            that._updateStickyColumns();
        },

        reorderColumn: function(destIndex, column, before) {
            var that = this,
                parent = columnParent(column, that.columns),
                columns = parent ? parent.columns : that.columns,
                sourceIndex = inArray(column, columns),
                destColumn = columns[destIndex],
                virtualScroll = that.virtualScroll || {},
                lockChanged,
                isLocked = !!destColumn.locked,
                lockedCount = lockedColumns(that.columns).length,
                groupHeaderColumnTemplateColumns = grep(leafColumns(that.columns), function(column) { return column.groupHeaderColumnTemplate; });

            if (that._isStackedMode()) {
                return;
            }

            if (sourceIndex === destIndex) {
                return;
            }

            if (!column.locked && isLocked && nonLockedColumns(that.columns).length == 1) {
                return;
            }

            if (column.locked && !isLocked && lockedCount == 1) {
                return;
            }

            that._hideResizeHandle();

            if (before === undefined$1) {
                before = destIndex < sourceIndex;
            }

            var sourceColumns = [column];

            that._reorderHeader(sourceColumns, destColumn, before);

            if (that.lockedHeader) {
                removeEmptyRows(that.thead);
                removeEmptyRows(that.lockedHeader);
            }

            if (destColumn.columns) {
                destColumn = leafColumns(destColumn.columns);
                destColumn = destColumn[before ? 0 : destColumn.length - 1];
            }

            if (column.columns) {
                sourceColumns = leafColumns(column.columns);
            }

            that._reorderContent(sourceColumns, destColumn, before);

            lockChanged = !!column.locked;
            lockChanged = lockChanged != isLocked;
            column.locked = isLocked;

            columns.splice(before ? destIndex : destIndex + 1, 0, column);
            columns.splice(sourceIndex < destIndex ? sourceIndex : sourceIndex + 1, 1);

            that._updateLockedCols();
            that._updateCols();
            that._templates();

            that._updateColumnCellIndex();
            that._updateColumnSorters();

            if (groupHeaderColumnTemplateColumns.length > 0) {
                that._renderGroupRows();
            }
            that._updateTablesWidth();
            that._applyLockedContainersWidth();
            that._syncLockedHeaderHeight();
            that._syncLockedContentHeight();
            that._updateFirstColumnClass();
            that._updateStickyColumns();

            if (virtualScroll.columns) {
                that.refresh();
            }

            if (!lockChanged) {
                return;
            }

            if (isLocked) {
                that.trigger(COLUMNLOCK, {
                    column: column
                });
            } else {
                that.trigger(COLUMNUNLOCK, {
                    column: column
                });
            }
        },

        _updateColumnCellIndex: function() {
            var header;
            var offset = 0;

            if (this.lockedHeader) {
                header = this.lockedHeader.find("thead");
                offset = updateCellIndex(header, lockedColumns(this.columns));
            }
            updateCellIndex(this.thead, nonLockedColumns(this.columns), offset);
        },

        lockColumn: function(column) {
            var columns = this.columns;

            if (typeof column == "number") {
                column = columns[column];
            } else {
                column = grep(columns, function(item) {
                    return item.field === column;
                })[0];
            }

            if (!column || column.locked || column.hidden) {
                return;
            }

            if (column.sticky) {
                this.unstickColumn(columns.indexOf(column));
            }

            var index = lockedColumns(columns).length - 1;
            this.reorderColumn(index, column, false);
        },

        unlockColumn: function(column) {
            var columns = this.columns;

            if (typeof column == "number") {
                column = columns[column];
            } else {
                column = grep(columns, function(item) {
                    return item.field === column;
                })[0];
            }

            if (!column || !column.locked || column.hidden) {
                return;
            }

            var index = lockedColumns(columns).length;
            this.reorderColumn(index, column, true);
        },

        stickColumn: function(column) {
            var columns = this.columns;

            if (typeof column == "number") {
                column = columns[column];
            } else {
                column = grep(columns, function(item) {
                    return item.field === column;
                })[0];
            }

            if (!column || column.sticky || column.hidden) {
                return;
            }

            if (column.locked) {
                this.unlockColumn(columns.indexOf(column));

                if (column.locked) {
                    return;
                }
            }

            column.sticky = true;
            this._updateStickyColumns();
        },

        unstickColumn: function(column) {
            var columns = this.columns;

            if (typeof column == "number") {
                column = columns[column];
            } else {
                column = grep(columns, function(item) {
                    return item.field === column;
                })[0];
            }

            if (!column || !column.sticky || column.locked || column.hidden) {
                return;
            }

            this._removeStickyAttributes([column]);
            this._removeStickyStyles(stickyColumns(columns));

            column.sticky = false;
            this._updateStickyColumns();

            if (this._anyStickyColumns() === 0) {
                this._templates();
                if (this._hasFilterRow()) {
                    this._updateStickyFilterCells();
                }
            }
        },

        cellIndex: function(td) {
            const that = this;
            var lockedColumnOffset = 0;

            const selector = that._isStackedMode() ? "div.k-grid-stack-cell" : "td";

            if (this.lockedTable && !$.contains(this.lockedTable[0], td[0])) {
                lockedColumnOffset = leafColumns(lockedColumns(this.columns)).length;
            }

            return $(td).parent().children(selector + ':not(.k-group-cell,.k-hierarchy-cell)').index(td) + lockedColumnOffset;
        },

        _modelForContainer: function(container) {
            container = $(container);

            if (!container.is(TR) && this._editMode() !== "popup") {
                container = container.closest(TR);
            }

            var id = container.attr(kendo.attr("uid")) || container.find("[ref='popup-edit-form']").attr(kendo.attr("uid"));

            return this.dataSource.getByUid(id);
        },

        _calculateColumnIndex: function(cell) {
            var cellIndex = this.cellIndex(cell);
            var virtualOffset = 0;

            if (this._hasVirtualColumns()) {
                virtualOffset = parseInt($(cell).closest(TR).find("td").first().attr("colspan"), 10);
                virtualOffset = (virtualOffset > 1 ? virtualOffset - 1 : 0);
            }

            return cellIndex + virtualOffset;
        },

        _editable: function() {
            let that = this,
                editable = that.options.editable,
                handler = function() {
                    let target = activeElement(),
                        cell = that._editContainer;

                    if (cell && cell[0] && !$.contains(cell[0], target) && cell[0] !== target && !$(target).closest(".k-animation-container").length) {
                        if (that.editable.end()) {
                            that.closeCell();
                            that._toggleToolbarEditingItemsVisibility();
                        } else {
                            that._scrollVirtualWrapper();
                        }
                    }
                },
                mobileOS = kendo.support.mobileOS,
                useDoubleTapEditing = !!(that._isMobile || mobileOS),
                /*
                    https://github.com/telerik/kendo-ui-core/issues/7817
                */
                userEventsPreventDefault = mobileOS && mobileOS.ios && (mobileOS.browser === "chrome" || mobileOS.browser === "edge");

            that._isEditableEnabled = that._isEditableEnabled !== undefined$1 ? that._isEditableEnabled : !editable.readonly;
            const stacked = that._isStackedMode();
            if (!that._isEditableEnabled) {
                that._removeEditableClickHandlers();
            }

            if (editable && that._isEditableEnabled) {

                let mode = that._editMode();
                if (mode === "incell") {
                    that.table.add(that.lockedTable)
                        .on(MOUSEDOWN + NS, NAVROW + ">" + NAVCELL, function(e) {
                            let target = $(e.target);
                            if (that._editMode() === "incell" && target.hasClass("k-checkbox") && target.prev().attr(kendo.attr("bind"))) {
                                e.preventDefault();
                            }
                        });

                    if (editable.update !== false) {
                        if (isMac) {
                            that.wrapper
                                .on(CLICK + NS, ".k-edit-cell > input[type='checkbox']", function(e) {
                                    // checking /unchecking a checkbox does not change the document.activeElement to be the checkbox
                                    // this is necessary for the "focusout" event to be fired
                                    $(e.target).trigger("focus");
                                })
                                .on(CLICK + NS, ".k-edit-cell", function(e) {
                                    if (!$(e.target).is("input")) {
                                        $(e.currentTarget).find("input[type='checkbox']").trigger("focus");
                                    }
                                })
                                .on(MOUSEDOWN + NS, "tr:not(.k-grouping-row) > td", function(e) {
                                    var editContainer = that._editContainer;

                                    if (editContainer && editContainer[0] && ($.contains(editContainer[0], e.target) || editContainer[0] === e.target)) {
                                        that._mousedownOnEditCell = true;
                                    } else {
                                        that._mousedownOnEditCell = false;
                                    }
                                });
                        }

                        that.editableUserEvents = new kendo.UserEvents(that.wrapper, {
                            filter: stacked ? ".k-grid-stack-row:not(.k-grouping-row) div.k-grid-stack-cell" : "tr:not(.k-grouping-row) > td",
                            allowSelection: true,
                            preventDefault: userEventsPreventDefault,
                            supportDoubleTap: useDoubleTapEditing,
                            fastTap: useDoubleTapEditing,
                            [useDoubleTapEditing ? 'doubleTap' : 'tap']: function(e) {
                                var td = $(e.target),
                                isLockedCell = that.lockedTable && td.closest("table")[0] === that.lockedTable[0];
                                that._mousedownOnEditCell = false;

                                if (td.hasClass("k-hierarchy-cell") ||
                                    td.hasClass("k-detail-cell") ||
                                    td.hasClass("k-group-cell") ||
                                    td.hasClass("k-edit-cell") ||
                                    td.hasClass("k-drag-cell") ||
                                    td.hasClass("k-grid-stack-edit-cell") ||
                                    td.has(".k-grid-remove-command").length ||
                                    (td.closest("tbody")[0] !== that.tbody[0] && !isLockedCell) ||
                                    $(e.target).is(":input")) {
                                    return;
                                }

                                let index;

                                if (stacked) {
                                    index = td.parent().children().index(td);
                                }

                                if (that.editable) {
                                    if (that.editable.end()) {
                                        $(activeElement()).trigger("blur");
                                        that.closeCell();

                                        if (!that._requestInProgress) {
                                            that.editCell(td, index);
                                        }
                                    } else {
                                        that._scrollVirtualWrapper();
                                    }
                                } else {
                                    that.editCell(td, index);
                                }
                            }
                        });

                        that.wrapper.on("focusin" + NS, function() {
                            // fix focus issue in IE
                            if (!$.contains(this, activeElement())) {
                                clearTimeout(that.timer);
                                that.timer = null;
                            }
                        })
                            .on("focusout" + NS, function(e) {
                                var shouldCloseCell = true;

                                if ((isMac && that._mousedownOnEditCell) || that._virtualColScroll) {
                                    shouldCloseCell = false;
                                }

                                that._mousedownOnEditCell = false;

                                if (shouldCloseCell) {
                                    that.timer = setTimeout(function() {
                                        handler();
                                    }, 1);
                                }
                            });
                    }
                } else {
                    if (editable.update !== false) {
                        that._editCommandClickHandler = that._editCommandClick.bind(that);
                        that.wrapper.on(CLICK + NS, "tbody>tr:not(.k-detail-row,.k-grouping-row):visible .k-grid-edit-command", that._editCommandClickHandler);

                        if (that._isVirtualInlineEditable()) {
                            that.wrapper.on("focusout" + NS, "tr:not(.k-grouping-row) > td", function() {
                                if (that.editable && !that.editable.end()) {
                                    that._scrollVirtualWrapper();
                                }
                            });
                        }
                    }
                }

                that._removeCommandClickHandler = that._removeCommandClick.bind(that);
                that.wrapper.on(CLICK + NS, "tbody>tr:not(.k-detail-row,.k-grouping-row):visible .k-grid-remove-command", that._removeCommandClickHandler);
            }
        },

        _getLastSelectedItemModel: function() {
            const that = this;
            const isSelectable = that.options.selectable;

            if (!isSelectable) {
                return;
            }

            const selectedData = that.getSelectedData();

            if (!selectedData || !selectedData.length) {
                return;
            }

            const selected = selectedData[selectedData.length - 1];
            const model = that.dataSource.getByUid(selected.uid);

            return model;
        },

        _removeToolbarClick: function(e) {
            if (e.event) {
                e.event.preventDefault();
                e.event.stopPropagation();
            } else {
                e.preventDefault();
            }

            const that = this;
            const model = this._getLastSelectedItemModel();

            if (!model) {
                return;
            }

            const row = that.tbody.children("[" + kendo.attr("uid") + "=" + model.uid + "]");

            that.removeRow(row);
            that.one(DATABOUND, () => {
                that._toggleToolbarEditingItemsVisibility();
            });
        },


        _editToolbarClick: function(e) {
            if (e.event) {
                e.event.preventDefault();
                e.event.stopPropagation();
            } else {
                e.preventDefault();
            }
            const that = this;
            const isIncellEditing = that._editMode() === "incell";

            if (isIncellEditing) {
                return;
            }

            const model = this._getLastSelectedItemModel();

            if (!model) {
                return;
            }

            that.editRow(model);
        },

        _editCommandClick: function(e) {
            let that = this,
                element = $(e.currentTarget);
            if (!that._belongsToGrid(element)) {
                return;
            }
            e.preventDefault();
            that.editRow(element.closest(TR));
        },

        _removeCommandClick: function(e) {
            let that = this,
                editable = that.options.editable,
                element = $(e.currentTarget);
            if (!that._belongsToGrid(element)) {
                return;
            }

            if (editable.destroy !== false) {
                e.preventDefault();
                e.stopPropagation();
                that.removeRow(element.closest(TR));
            } else {
                //Required for the MVC server wrapper delete button.
                e.stopPropagation();

                if (!that._confirmation()) {
                    e.preventDefault();
                }
            }
            that._toggleToolbarEditingItemsVisibility();
        },

        editCell: function(cell, index) {
            cell = $(cell);

            let that = this,
            colIndex = (index === 0 || index) ? index : that._calculateColumnIndex(cell),
            column = leafColumns(that.columns)[colIndex],
            model = that._modelForContainer(cell);
            const stacked = that._isStackedMode();
            const editClass = stacked ? "k-grid-stack-edit-cell" : "k-edit-cell";

            that.closeCell();
            const cellToEdit = stacked ? cell.find(".k-grid-stack-content") : cell;

            if (model && isColumnEditable(column, model) && !column.command) {
                if (that.trigger(BEFOREEDIT, { model: model })) {
                    return;
                }

                that._attachModelChange(model);

                that._editContainer = cellToEdit;

                if (that._shouldClearEditableState) {
                    that._clearEditableState();
                }

                cell.addClass(editClass);
                const skipFocus = (that._isVirtualIncellEditable() || that._hasVirtualColumns()) && that._editableState;

                that.editable = cellToEdit
                    .kendoEditable({
                        fields: editField(column, that._isAdaptive() ? "auto" : "none"),
                        model: model,
                        size: that.options.size,
                        target: that,
                        change: function(e) {
                            if (that.trigger(SAVE, { values: e.values, container: cell, model: model })) {
                                e.preventDefault();
                            }
                        },
                        skipFocus: skipFocus

                    }).data("kendoEditable");

                let tr = cell.closest(TR);

                if (!stacked) {
                    tr.addClass("k-grid-edit-row");
                }

                if (model.new === true && !stacked) {
                    tr.addClass("k-grid-add-row");
                    delete model.new;
                }

                if (that.lockedContent) {
                    adjustRowHeight(tr[0], that._relatedRow(tr).addClass("k-grid-edit-row")[0]);
                    if (tr.hasClass("k-grid-add-row")) {
                        that._relatedRow(tr).addClass("k-grid-add-row");
                    }
                    that._syncLockedScroll();
                }

                that.trigger(EDIT, { container: cell, model: model });
                that._toggleToolbarEditingItemsVisibility();
            }
        },

        enableEditing: function() {
            let that = this,
                toolbar = that.wrapper.find(".k-grid-toolbar");

            if (!that._isEditableEnabled) {
                that._isEditableEnabled = true;
                that._editable();
                let addButton = toolbar.find(".k-grid-add").getKendoButton();
                let editButton = toolbar.find(".k-grid-edit-command").getKendoButton();
                let removeButton = toolbar.find(".k-grid-remove-command").getKendoButton();
                let cancelChangesButton = toolbar.find(".k-grid-cancel-changes").getKendoButton();
                let saveChangesButton = toolbar.find(".k-grid-save-changes").getKendoButton();
                let cancelButton = toolbar.find(".k-grid-cancel-command").getKendoButton();
                let saveButton = toolbar.find(".k-grid-save-command").getKendoButton();

                if (addButton) {
                    addButton.bind("click", that._createClickHandler);
                }
                if (editButton) {
                    editButton.bind("click", that._editClickHandler);
                }
                if (removeButton) {
                    removeButton.bind("click", that._destroyClickHandler);
                }
                if (cancelChangesButton) {
                    cancelChangesButton.bind("click", that._cancelClickHandler);
                }
                if (saveChangesButton) {
                    saveChangesButton.bind("click", that._saveClickHandler);
                }
                if (cancelButton) {
                    cancelButton.bind("click", that._editCancelClickHandler);
                }
                if (saveButton) {
                    saveButton.bind("click", that._updateClickHandler);
                }
            }

            that._toggleToolbarEditingItemsVisibility();
        },

        disableEditing: function() {
            let that = this;

            if (that._isEditableEnabled) {
                if (that._editMode() === "incell") {
                    that.closeCell();
                } else {
                    that.cancelRow();
                }

                that._clearEditableState();
                that._destroyEditable();

                if (that.editableUserEvents) {
                    that.editableUserEvents.destroy();
                    that.editableUserEvents = null;
                }

                that._removeEditableClickHandlers();

                that._isEditableEnabled = false;
                that._toggleToolbarEditingItemsVisibility();
            }
        },

        _removeEditableClickHandlers: function() {
            let that = this,
                toolbar = that.wrapper.find(".k-grid-toolbar");

            that.wrapper.off(CLICK + NS, "tbody>tr:not(.k-detail-row,.k-grouping-row):visible .k-grid-edit-command", that._editCommandClickHandler);
            that.wrapper.off(CLICK + NS, "tbody>tr:not(.k-detail-row,.k-grouping-row):visible .k-grid-remove-command", that._removeCommandClickHandler);
            toolbar.off(CLICK + NS, ".k-grid-add", that._createClickHandler);
            toolbar.off(CLICK + NS, ".k-grid-edit-command", that._editClickHandler);
            toolbar.off(CLICK + NS, ".k-grid-remove-command", that._destroyClickHandler);

            let addButton = toolbar.find(".k-grid-add").getKendoButton();
            let editButton = toolbar.find(".k-grid-edit-command").getKendoButton();
            let removeButton = toolbar.find(".k-grid-remove-command").getKendoButton();
            let cancelChangesButton = toolbar.find(".k-grid-cancel-changes").getKendoButton();
            let saveChangesButton = toolbar.find(".k-grid-save-changes").getKendoButton();
            let cancelButton = toolbar.find(".k-grid-cancel-command").getKendoButton();
            let saveButton = toolbar.find(".k-grid-save-command").getKendoButton();

            if (addButton) {
                addButton.unbind("click");
            }
            if (editButton) {
                editButton.unbind("click");
            }
            if (removeButton) {
                removeButton.unbind("click");
            }
            if (cancelChangesButton) {
                cancelChangesButton.unbind("click");
            }
            if (saveChangesButton) {
                saveChangesButton.unbind("click");
            }
            if (cancelButton) {
                cancelButton.unbind("click");
            }
            if (saveButton) {
                saveButton.unbind("click");
            }

            that._editCommandClickHandler = null;
            that._removeCommandClickHandler = null;
        },

        _adjustLockedHorizontalScrollBar: function() {
            var table = this.table,
                content = table.parent();

            var scrollbar = table[0].offsetWidth > content[0].clientWidth ? kendo.support.scrollbar() : 0;
            this.lockedContent.height(content[0].offsetHeight - scrollbar);
        },

        _syncLockedScroll: function() {
            this.lockedContent[0].scrollTop = this.content[0].scrollTop;
            if (this.virtualScrollable) {
                this.lockedContent[0].scrollTop = this.wrapper.find(".k-virtual-scrollable-wrap")[0].scrollTop;
            }
        },

        _syncLockedContentHeight: function() {
            if (this.lockedTable) {
                if (!this.touchScroller) {
                    this._adjustLockedHorizontalScrollBar();
                }
                this._adjustRowsHeight(this.table, this.lockedTable);
            }
        },

        _syncLockedHeaderHeight: function() {
            if (this.lockedHeader) {
                var lockedTable = this.lockedHeader.children("table");
                var table = this.thead.parent();

                this._adjustRowsHeight(lockedTable, table);

                syncTableHeight(lockedTable, table);
            }
        },

        _syncLockedFooterHeight: function() {
            if (this.lockedFooter && this.footer && this.footer.length) {
                this._adjustRowsHeight(this.lockedFooter.children("table"), this.footer.find(".k-grid-footer-wrap > table"));
            }
        },

        _destroyEditable: function() {
            let that = this;
            const component = that._editContainer && that._editContainer.length && that._editContainer.closest(".k-window").length ? "kendoWindow" : "kendoActionSheet";

            let destroy = function() {
                if (that.editable) {

                    let container = that.editView ? that.editView.element : that._editContainer;
                    let window = that._editContainer.data(component);

                    if (container) {
                        if (window) {
                            container = window.wrapper;
                        }
                        container.off(CLICK + NS, ".k-grid-cancel-command, button[ref-cancel-button], [ref-actionsheet-action-button]:not(.k-button-solid-primary)", that._editCancelClickHandler);
                        container.off(CLICK + NS, ".k-grid-save-command, button[ref-update-button], [ref-actionsheet-action-button].k-button-solid-primary", that._editUpdateClickHandler);
                    }

                    that._detachModelChange();
                    that.editable.destroy();
                    that.editable = null;
                    if (window) {
                        window.destroy();
                    }
                    that._editContainer = null;
                    that._destroyEditView();
                    that._editableIsClosing = null;
                }
            };

            if (that.editable) {
                if (that._editMode() === "popup" && !that._isMobile) {
                    if (that._editableIsClosing) {
                        that._editContainer.data(component).bind("deactivate", destroy);
                    }
                    else {
                        that._editableIsClosing = true;
                        that._editContainer.data(component).bind("deactivate", destroy).close();
                    }
                } else {
                    destroy();
                }
            }
            if (that._confirmDialog) {
                that._confirmDialog.close();
                that._confirmDialog.destroy();
                that._confirmDialog = null;
            }
        },

        _destroyEditView: function() {
            if (this.editView) {
                this.editView.purge();
                this.editView = null;
                this.pane.navigate("");
            }
        },

        _attachModelChange: function(model) {
            var that = this;

            that._modelChangeHandler = function(e) {
                that._modelChange({ field: e.field, model: this });
            };

            model.bind("change", that._modelChangeHandler);
        },

        _detachModelChange: function() {
            var that = this,
                container = that._editContainer,
                model = that._modelForContainer(container);

            if (model) {
                model.unbind(CHANGE, that._modelChangeHandler);
            }
        },

        closeCell: function(isCancel) {
            let that = this,
                cell = that._editContainer,
                column,
                tr,
                model,
                errors;

            if (!cell) {
                return;
            }

            model = that._modelForContainer(cell);

            if (isCancel && that.trigger("cancel", { container: cell, model: model })) {
                return;
            }

            const stacked = that._isStackedMode();
            const editClass = stacked ? "k-grid-stack-edit-cell" : "k-edit-cell";
            const editCell = cell.closest(DOT + editClass);

            that.trigger(CELLCLOSE, { type: isCancel ? "cancel" : "save", model: model, container: cell });
            const index = stacked ? editCell.parent().children().index(editCell) : that._calculateColumnIndex(cell);

            if (stacked) {
                editCell.removeClass(editClass);
            } else {
                cell.removeClass(editClass);
            }

            column = leafColumns(that.columns)[index];
            errors = that.editable && that.editable.validatable && that.editable.validatable.errors();

            if (isCancel && model.dirtyFields && model.dirtyFields[column.field] && errors.length) {
                delete model.dirtyFields[column.field];
            }

            tr = cell.closest(TR).removeClass("k-grid-edit-row");

            if (tr.hasClass("k-grid-add-row")) {
                tr.removeClass("k-grid-add-row");
            }

            if (that.lockedContent) {
                const relatedTr = that._relatedRow(tr);
                relatedTr.removeClass("k-grid-edit-row");

                if (relatedTr.hasClass("k-grid-add-row")) {
                    relatedTr.removeClass("k-grid-add-row");
                }
            }

            that._destroyEditable(); // editable should be destroyed before content of the container is changed

            that._displayCell(cell, column, model);

            if (that._shouldClearEditableState) {
                that._clearEditableState();
            }

            that.trigger("itemChange", { item: tr, data: model, ns: ui });

            if (that._activeStackedCell) {
                that._setCurrentStackedCell(cell);
            }

            if (that.lockedContent) {
                const rowUID = tr && tr.data("uid");
                const heightValue = (that._cachedRowsHeight && that._cachedRowsHeight[rowUID]) ?? "";
                adjustRowHeight(tr.css(HEIGHT, heightValue)[0], that._relatedRow(tr).css(HEIGHT, heightValue)[0]);
            }
        },

        _displayCell: function(cell, column, dataItem) {
            var that = this,
                state = { storage: {}, count: 0 },
                settings = extend({}, kendo.Template, that.options.templateSettings),
                tmpl = kendo.template(that._cellTmpl(column, state), settings);

            if (state.count > 0) {
                tmpl = tmpl.bind(state.storage);
            }

            cell.empty().html(tmpl(dataItem));
        },

        removeRow: function(row) {
            if (!this._confirmation(row)) {
                return;
            }

            this._removeRow(row);
        },

        _removeRow: function(row) {
            var that = this,
                model,
                modelId,
                key,
                schema,
                mode = that._editMode();

            if (mode !== "incell") {
                that.cancelRow();
            }

            row = $(row);

            if (that.lockedContent) {
                row = row.add(that._relatedRow(row));
            }

            row = row.hide();
            if (that.dataSource._isGroupPaged()) {
                that._removeGroupIfEmpty(row);
            }

            model = that._modelForContainer(row);

            if (model != undefined$1 && model.hasOwnProperty("_isMoved")) {
                delete model._isMoved;
            }

            if (model && !that.trigger(REMOVE, { row: row, model: model })) {
                schema = that.dataSource.options.schema;
                if (that._selectedIds && schema && schema.model) {
                    modelId = that._getSchemaIdField();
                    key = model[modelId];
                    delete that._selectedIds[key];
                }

                that.dataSource.remove(model);

                if (mode === "inline" || mode === "popup") {
                    that.dataSource.sync();
                }
            } else if (mode === "incell") {
                that._destroyEditable();
            }
        },

        _editMode: function() {
            let mode = "incell",
                editable = this.options.editable;

            if (editable !== true) {
                if (typeof editable == "string") {
                    mode = editable;
                } else {
                    mode = editable.mode || mode;
                }
            }

            return mode;
        },

        editRow: function(row) {
            let model,
                that = this;

            if (row instanceof ObservableObject) {
                model = row;
            } else {
                row = $(row);
                model = that._modelForContainer(row);
            }

            let mode = that._editMode();
            let container;

            that.cancelRow();

            if (model) {
                row = that.tbody.children("[" + kendo.attr("uid") + "=" + model.uid + "]");
                that._attachModelChange(model);

                if (mode === "popup") {
                    that._createPopupEditor(model);
                } else if (mode === "inline") {
                    that._createInlineEditor(row, model);
                } else if (mode === "incell") {
                    const stacked = that._isStackedMode();
                    const cells = stacked ? row.find(".k-grid-stack-cell:not(.k-command-cell):not(.k-drag-cell)") : row.children(DATA_CELL);
                    cells.each(function() {
                        let cell = $(this);
                        const index = stacked ? cell.parent().children().index(cell) : that._calculateColumnIndex(cell);
                        let column = leafColumns(that.columns)[index];

                        model = that._modelForContainer(cell);

                        if (model && (!model.editable || model.editable(column.field)) && column.field && !column.selectable && !column.draggable) {
                            that.editCell(cell, index);
                            return false;
                        }
                    });
                }

                container = that.editView ? that.editView.element : mode === "popup" ? that._editContainer.parent() : that._editContainer;

                if (container) {
                    if (!this._editCancelClickHandler) {
                        this._editCancelClickHandler = this._editCancelClick.bind(this);
                    }

                    container.on(CLICK + NS, ".k-grid-cancel-command, button[ref-cancel-button], [ref-actionsheet-action-button]:not(.k-button-solid-primary)", this._editCancelClickHandler);

                    if (!this._editUpdateClickHandler) {
                        this._editUpdateClickHandler = this._editUpdateClick.bind(this);
                    }

                    container.on(CLICK + NS, ".k-grid-save-command, button[ref-update-button], [ref-actionsheet-action-button].k-button-solid-primary", this._editUpdateClickHandler);
                }

                that._toggleToolbarEditingItemsVisibility();
            }
        },

        _editUpdateClick: function(e) {
            e.preventDefault();
            if (e.stopPropagation) {
                e.stopPropagation();
            } else if (e.event && e.event.stopPropagation) {
                e.event.stopPropagation();
            }

            const target = $(e.currentTarget);
            const validator = this.editable?.validatable;

            validator?.one("validate", () => {
                const hasErrors = validator?.errors()?.length;

                if (target.is("[ref-update-button]") && !hasErrors) {
                    target.addClass("k-disabled");
                    target.attr("aria-disabled", true);
                }
            });

            this.saveRow();
            this._preventOnCloseEditableChanges = this._editMode() === "popup";
            this.one(DATABOUND, () => {
                this._toggleToolbarEditingItemsVisibility();
            });
        },

        _editCancelClick: function(e) {
            var that = this;
            var navigatable = that.options.navigatable;
            var model = that.editable.options.model;
            var container = that.editView ? that.editView.element : that._editContainer;

            e.preventDefault();

            if (e.stopPropagation) {
                e.stopPropagation();
            } else if (e.event && e.event.stopPropagation) {
                e.event.stopPropagation();
            }

            if (that.trigger("cancel", { container: container, model: model })) {
                return;
            }

            var currentIndex = that.items().index($(that.current()).parent());

            that.cancelRow();

            if (navigatable) {
                that._setCurrent(that.items().eq(currentIndex).children().filter(NAVCELL).first());
                focusTable(that.table, true);
            }

            this._toggleToolbarEditingItemsVisibility();
        },

        _editFields: function(columns, model) {
            var fields = [];
            var column;

            for (var idx = 0; idx < columns.length; idx++) {
                column = columns[idx];
                if (column.selectable || column.command) {
                    continue;
                }
                if (isColumnEditable(column, model)) {
                    fields.push(editField(column, this._isAdaptive() ? "auto" : "none"));
                }
            }
            return fields;
        },

        _createPopupEditor: function(model) {
            var that = this;
            var html = '<div ' + kendo.attr("uid") + '="' + model.uid + '" ref="popup-edit-form"><' + (that._isMobile ? 'ul class="k-edit-form-container k-listgroup k-listgroup-flush">' : 'div class="k-edit-form-container">');
            var column;
            var command;
            var idx;
            var length;
            var tmpl;
            var updateText;
            var cancelText;
            var updateIconClass;
            var cancelIconClass;
            var tempCommand;
            var columns = leafColumns(that.columns);
            var attr;
            var editMenuGuid = kendo.guid();
            var editable = that.options.editable;
            var template = editable.template;
            var options = isPlainObject(editable) ? editable.window : {};
            var settings = extend({}, kendo.Template, that.options.templateSettings);
            var state;
            var container;
            var buttonsHTML;

            const isAdaptive = that._isAdaptive();

            if (that.trigger(BEFOREEDIT, { model: model })) {
                return;
            }

            options = options || {};

            if (template) {
                if (typeof template === STRING) {
                    template = kendo.unescape(template);
                }

                html += (kendo.template(template, settings))(model);

                for (idx = 0, length = columns.length; idx < length; idx++) {
                    column = columns[idx];
                    if (column.command) {
                        tempCommand = getCommand(column.command, "edit");
                        if (tempCommand) {
                            command = tempCommand;
                        }
                    }
                }
            } else {
                for (idx = 0, length = columns.length; idx < length; idx++) {
                    column = columns[idx];
                    if (column.selectable) {
                        continue;
                    }
                    if (!column.command) {
                        if (that._isMobile) {
                            html += '<li class="k-item k-listgroup-item">';

                            if (isColumnEditable(column, model)) {
                                html += '<label class="k-label k-listgroup-form-row">';
                                html += '<span class="k-item-title k-listgroup-form-field-label">' + (column.title && (that.options.encodeTitles ? htmlEncode(column.title, true) : column.title) || column.field || "") + '</span>';
                                html += '<div class="k-listgroup-form-field-wrapper" id="' + column.field + '_' + editMenuGuid + '" ' + kendo.attr("container-for") + '="' + column.field + '"></div>';
                                html += '</label>';
                            } else {
                                state = { storage: {}, count: 0 };

                                tmpl = kendo.template(that._cellTmpl(column, state), settings);

                                if (state.count > 0) {
                                    tmpl = tmpl.bind(state.storage);
                                }

                                html += '<label class="k-label k-listgroup-form-row k-no-click">';
                                html += '<span class="k-item-title k-listgroup-form-field-label">' + (column.title && (that.options.encodeTitles ? htmlEncode(column.title, true) : column.title) || column.field || "") + '</span>';
                                html += '<span class="k-no-editor k-listgroup-form-field-wrapper">' + tmpl(model) + '</span>';
                                html += '</label>';
                            }

                            html += "</li>";
                        }
                    } else if (column.command) {
                        tempCommand = getCommand(column.command, "edit");
                        if (tempCommand) {
                            command = tempCommand;
                        }
                    }
                }
            }

            if (command) {
                if (isPlainObject(command)) {
                    if (isPlainObject(command.text)) {
                        updateText = command.text.update;
                        cancelText = command.text.cancel;
                    }
                    if (isPlainObject(command.iconClass)) {
                        updateIconClass = command.iconClass.update;
                        cancelIconClass = command.iconClass.cancel;
                    }

                    if (command.attr) {
                        attr = command.attr;
                    }
                }
            }

            if (!that._isMobile) {

                let updateButton = $(that._createButton({ name: "update", text: updateText, attr: attr, iconClass: updateIconClass, size: "medium", skipCommandClass: true },)).attr("ref-update-button", "");
                let cancelButton = $(that._createButton({ name: "canceledit", text: cancelText, attr: attr, iconClass: cancelIconClass, size: "medium", skipCommandClass: true })).attr("ref-cancel-button", "");

                html += '</div>';

                if (isAdaptive) {
                    container = that._editContainer = $(html)
                        .appendTo("body").eq(0).kendoActionSheet({
                            modal: true,
                            adaptive: true,
                            title: model.id ? "Edit record" : "Add new record",
                            fullscreen: that.smallMQL.mediaQueryList.matches,
                            closeButton: true,
                            actionButtons: [
                                {
                                    text: "Cancel",
                                    icon: "cancel",
                                },
                                {
                                    text: "Save",
                                    icon: "save",
                                    themeColor: "primary",
                                }
                            ],
                            open: function(e) {
                                e.sender.element.removeClass("k-popup");
                                that.editable.element.focus();
                            },
                            close: function(e) {
                                e.sender.element.trigger("focus");
                                if (!that._preventOnCloseEditableChanges) {
                                    if (that.trigger("cancel", { container: container, model: model })) {
                                        e.preventDefault();
                                        return;
                                    }
                                }

                                var currentIndex = that.items().index($(that.current()).parent());
                                if (!that._preventOnCloseEditableChanges) {
                                    that._editableIsClosing = true;
                                    that.cancelRow(false, true);
                                }
                                if (that.options.navigatable) {
                                    if (that._isStackedMode()) {
                                        that._setCurrentStackedCell();
                                    } else {
                                        that._setCurrent(that.items().eq(currentIndex).children().filter(NAVCELL).first());
                                        focusTable(that.table, true);
                                    }
                                }
                                that._toggleToolbarEditingItemsVisibility();
                            }
                        });
                } else {
                    container = that._editContainer = $(html)
                        .appendTo(that.wrapper).eq(0)
                        .kendoWindow(extend({
                            modal: true,
                            resizable: false,
                            draggable: true,
                            title: that.options.messages.commands.edit || "Edit",
                            _footerTemplate: () =>
                                `<div class="k-actions k-actions-start k-actions-horizontal k-window-actions">` +
                                updateButton[0].outerHTML +
                                cancelButton[0].outerHTML +
                                `</div>`,
                            visible: false,
                            close: function(e) {
                                if (e.userTriggered) {
                                    //The bellow line is required due to: draggable window in IE, change event will be triggered while the window is closing
                                    e.sender.element.trigger("focus");
                                    if (that.trigger("cancel", { container: container, model: model })) {
                                        e.preventDefault();
                                        return;
                                    }

                                    var currentIndex = that.items().index($(that.current()).parent());

                                    that._editableIsClosing = true;
                                    that.cancelRow();
                                    that._toggleToolbarEditingItemsVisibility();
                                      if (that._isStackedMode()) {
                                        that._setCurrentStackedCell();
                                    } else {
                                        that._setCurrent(that.items().eq(currentIndex).children().filter(NAVCELL).first());
                                        focusTable(that.table, true);
                                    }
                                }
                            }
                        }, options));
                }
            } else {
                html += "</ul></div>";
                let cancelText = encode(that.options.messages.commands.cancel);
                let updateText = encode(that.options.messages.commands.update);
                that.editView = that.pane.append(
                    '<div data-' + kendo.ns + 'role="view" class="k-grid-edit-form">' +
                    '<div data-' + kendo.ns + ' class="k-appbar k-appbar-primary">' +
                    kendo.html.renderButton(`<button class="k-header-cancel k-grid-cancel-command" title="${cancelText}" aria-label="${cancelText}"></button>`, {
                        fillMode: "flat",
                        icon: "chevron-left"
                    }) +
                    '<span class="k-spacer"></span>' +
                    `<span>${encode(that.options.messages.commands.edit || "Edit")}</span>` +
                    '<span class="k-spacer"></span>' +
                    kendo.html.renderButton(`<button class="k-header-done k-grid-save-command" title="${updateText}" aria-label="${updateText}"></button>`, {
                        fillMode: "flat",
                        icon: "check"
                    }) +
                    '</div>' +
                    '<div data-' + kendo.ns + 'role="content" class="' + classNames.content + '">' +
                    html +
                    '</div>' +
                    '</div>');
                container = that._editContainer = that.editView.element.find("[ref='popup-edit-form']");
            }

            if (!template && !that._isMobile) {
                that.editable = new ui.Form(that._editContainer.find(".k-edit-form-container"), {
                    items: that._editFields(columns, model),
                    buttonsTemplate: () => '',
                    formData: model,
                    size: that._isAdaptive() ? "large" : "medium"
                }).editable;
                that._editContainer.append(buttonsHTML);

                if (isAdaptive) {
                    that.editable.element.removeClass("k-edit-form-container");
                }
            } else {
                that.editable = that._editContainer
                    .kendoEditable({
                        fields: (that._isMobile && !template) ? that._editFields(columns, model) : null,
                        model: model,
                        clearContainer: false,
                        target: that,
                        skipFocus: true
                    }).data("kendoEditable");

                if (isAdaptive) {
                    that.editable.element.find(".k-edit-form-container").removeClass("k-edit-form-container");
                }
            }

            that._openPopUpEditor(isAdaptive);

            that.trigger(EDIT, { container: container, model: model });
        },

        _openPopUpEditor: function(isAdaptive) {
            var that = this;
            const component = isAdaptive ? "kendoActionSheet" : "kendoWindow";
            var editor = that._editContainer ? that._editContainer.data(component) : null;
            var windowOptions = (that.options.editable || {}).window || {};

            if (!this._isMobile) {
                if (editor) {
                    if (!isAdaptive && !windowOptions.position) {
                        editor.center();
                    } else if (isAdaptive) {
                        editor.fullscreen(that.smallMQL.mediaQueryList.matches);
                    }

                    editor.open();
                }
            } else {
                this.pane.navigate(this.editView, this._editAnimation);
            }
        },

        _createInlineEditor: function(row, model) {
            var that = this;
            var column;
            var cell;
            var command;
            var fields = [];

            const stacked = that._isStackedMode();

            if (that.trigger(BEFOREEDIT, { model: model })) {
                return;
            }

            if (that.lockedContent) {
                row = row.add(that._relatedRow(row));
            }

            let cells = stacked ? row.children(":not(.k-group-cell,.k-hierarchy-cell)").find(".k-grid-stack-cell:not(.k-drag-cell)") : row.children(":not(.k-group-cell,.k-hierarchy-cell,.k-drag-cell)");
            const columns = stacked ? leafColumns(visibleColumns(that.columns)) : leafColumns(that.columns);
            if (that.options.navigatable && stacked) {
                removeElementsFromTab(cells);
            }
            cells.each(function() {
                cell = $(this);
                column = columns[that._calculateColumnIndex(cell)];

                if (!column) {
                    return;
                }

                if (!column.command && isColumnEditable(column, model)) {
                    fields.push(editField(column, that._isAdaptive() ? "auto" : "none"));
                    let target = stacked ? cell.children(".k-grid-stack-content") : cell;
                    target.attr(kendo.attr("container-for"), column.field);
                    target.empty();
                } else if (column.command) {
                    command = getCommand(column.command, "edit");
                    if (command) {
                        cell.empty();

                        var updateText,
                            cancelText,
                            updateIconClass,
                            cancelIconClass,
                            attr;

                        if (isPlainObject(command)) {
                            if (isPlainObject(command.text)) {
                                updateText = command.text.update;
                                cancelText = command.text.cancel;
                            }
                            if (isPlainObject(command.iconClass)) {
                                updateIconClass = command.iconClass.update;
                                cancelIconClass = command.iconClass.cancel;
                            }

                            if (command.attr) {
                                attr = command.attr;
                            }
                        }

                        $(that._createButton({ name: "update", text: updateText, attr: attr, iconClass: updateIconClass, skipTabIndex: true }) +
                            that._createButton({ name: "canceledit", text: cancelText, attr: attr, iconClass: cancelIconClass, skipTabIndex: true })).appendTo(cell);
                    }
                }
            });

            that._editContainer = row;

            that._editContainer.addClass("k-grid-edit-row");

            if (model.new === true) {
                that._editContainer.addClass("k-grid-add-row");
                delete model.new;
            }

            if (that._shouldClearEditableState) {
                that._clearEditableState();
            }

            that.editable = new kendo.ui.Editable(that._editContainer, {
                target: that,
                fields: fields,
                size: that.options.size,
                model: model,
                skipFocus: (that._isVirtualInlineEditable() && that._editableState && (that._editableState.field ? true : false)) || that._hasVirtualColumns(),
                clearContainer: false
            });

            if (row.length > 1) {

                adjustRowHeight(row[0], row[1]);
                that._applyLockedContainersWidth(true);
            }

            if (stacked) {
                cells.addClass("k-grid-stack-edit-cell");
            }

            that.trigger(EDIT, { container: row, model: model });
        },

        cancelRow: function(notify) {
            var that = this,
                container = that._editContainer,
                model;

            if (container) {
                model = that._modelForContainer(container);

                if (!model || (notify && that.trigger("cancel", { container: container, model: model }))) {
                    return;
                }

                that._destroyEditable();

                that.dataSource.cancelChanges(model);

                that._clearEditableState();

                if (that._editMode() !== "popup") {
                    that._displayRow(container);
                } else {
                    that._displayRow(that.tbody.find("[" + kendo.attr("uid") + "=" + model.uid + "]"));
                }

                that._aria();
            }
        },

        saveRow: function() {
            var that = this;
            var container = this._editContainer;
            var model = this._modelForContainer(container);
            var deferred = $.Deferred();
            var valid;

            if (!container || !this.editable) {
                return deferred.resolve().promise();
            }

            valid = that.editable && that.editable.end();

            if (!valid || this.trigger(SAVE, { container: container, model: model })) {
                if (!valid) {
                    that._scrollVirtualWrapper();
                }

                return deferred.reject().promise();
            }

            that._clearEditableState();

            return this.dataSource.sync();
        },

        _displayRow: function(row) {
            var that = this,
                model = that._modelForContainer(row),
                related,
                newRow,
                nextRow,
                isSelected = row.hasClass(SELECTED),
                isAlt = row.hasClass("k-table-alt-row");

            if (model) {

                if (that.lockedContent) {
                    related = $((isAlt ? that.lockedAltRowTemplate : that.lockedRowTemplate)(model));
                    kendo.applyStylesFromKendoAttributes(related, ["display"]);
                    that._relatedRow(row.last()).replaceWith(related);
                }

                newRow = $((isAlt ? that.altRowTemplate : that.rowTemplate)(model));
                if (!row.is(":visible")) {
                    newRow.hide();
                }

                kendo.applyStylesFromKendoAttributes(newRow, ["display"]);

                if (that._anyStickyColumns()) {
                    kendo.applyStylesFromKendoAttributes(newRow, ["left", "right"]);
                }

                row.replaceWith(newRow);

                that.trigger("itemChange", { item: newRow, data: model, ns: ui });

                if (related && related.length) {
                    that.trigger("itemChange", { item: related, data: model, ns: ui });
                }

                if (isSelected && (that.options.selectable || that._checkBoxSelection)) {
                    that.select(newRow.add(related));
                }

                if (related) {
                    adjustRowHeight(newRow[0], related[0]);
                }

                nextRow = newRow.next();
                if (nextRow.hasClass("k-detail-row") && nextRow.is(":visible")) {
                    kendo.ui.icon(newRow.find(".k-hierarchy-cell .k-icon,.k-hierarchy-cell .k-svg-icon"), { icon: "caret-alt-down" });
                }
            }
        },

        _showMessage: function(messages, row) {
            var that = this;

            if (!that._isMobile) {
                // eslint-disable-next-line no-alert
                return window.confirm(messages.title);
            }

            var confirmDialog = that._confirmDialog = new kendo.ui.Confirm($("<div />").appendTo(document.body), {
                modal: {
                    preventScroll: true
                },
                closable: false,
                title: false,
                content: messages.title,
                messages: {
                    okText: messages.confirmDelete,
                    cancel: messages.cancelDelete
                },
                open: function() {
                    if (that.content) {
                        that.content.data(OVERFLOW, that.content.css(OVERFLOW));
                        that.content.css(OVERFLOW, HIDDEN);
                    }
                },
                close: function() {
                    if (that.content) {
                        that.content.css(OVERFLOW, that.content.data(OVERFLOW));
                    }
                }
            });

            confirmDialog.result
                .done(function() {
                    that._removeRow(row);
                })
                .fail(function() {
                    var confirmDialog = that._confirmDialog;

                    if (confirmDialog) {
                        confirmDialog.close();
                        confirmDialog.destroy();
                    }
                });

            return false;
        },

        _confirmation: function(row) {
            var that = this,
                editable = that.options.editable,
                confirmation = (editable === true || typeof editable === STRING) ? that.options.messages.editable.confirmation : editable.confirmation;

            if (isPlainObject(editable) && typeof editable.mode === STRING && typeof confirmation !== FUNCTION && typeof confirmation !== STRING && confirmation !== false) {
                confirmation = that.options.messages.editable.confirmation;
            }

            if (confirmation !== false && confirmation != null) {

                if (typeof confirmation === FUNCTION) {
                    confirmation = confirmation(that._modelForContainer(row));
                }

                return that._showMessage({
                    confirmDelete: editable.confirmDelete || that.options.messages.editable.confirmDelete,
                    cancelDelete: editable.cancelDelete || that.options.messages.editable.cancelDelete,
                    title: confirmation === true ? that.options.messages.editable.confirmation : confirmation
                }, row);
            }

            return true;
        },

        cancelChanges: function() {
            var that = this;

            if (that._cachedRowsHeight) {
                that._mapCachedRowsHeight("getByUid", "id");
                that._shouldMapHights = true;
            }

            that.dataSource.cancelChanges();

            if (that._isVirtualEditable()) {
                that._virtualPageToTop(function() {
                    that.virtualScrollable.scrollToTop();
                });
            }
        },

        saveChanges: function() {
            var that = this;
            var valid = that.editable && that.editable.end();

            if ((valid || !that.editable) && !that.trigger(SAVECHANGES)) {
                that.dataSource.sync();
            } else if (!valid) {
                that._scrollVirtualWrapper();
            }
        },

        addRow: function() {
            var that = this,
                index,
                dataSource = that.dataSource,
                mode = that._editMode(),
                createAt = that.options.editable.createAt || "",
                pageSize = dataSource.pageSize(),
                view = dataSource.view() || [];
            var createAtBottom = createAt.toLowerCase() === BOTTOM;
            var model;
            var virtualEditable = that._isVirtualEditable();

            if ((that.editable && that.editable.end()) || !that.editable) {
                if (mode != "incell") {
                    that.cancelRow();
                }

                index = dataSource.indexOf(view[0]);

                if (createAtBottom) {
                    index += view.length;

                    if (pageSize && !dataSource.options.serverPaging && pageSize <= view.length) {
                        index -= 1;
                    }
                }

                if (index < 0) {
                    if (dataSource.page() > dataSource.totalPages()) {
                        index = (dataSource.page() - 1) * pageSize;
                    } else {
                        index = 0;
                    }
                }

                if (that.options.navigatable && mode == "incell") {
                    that._removeCurrent();
                }

                if (virtualEditable) {
                    that._virtualAddRow();
                } else {
                    model = dataSource.insert(index, {});
                    model.new = true;
                    that._editModel(model);
                }
            } else {
                that._scrollVirtualWrapper();
            }
        },

        _editModel: function(model) {
            var that = this;
            var createAt = that.options.editable.createAt || "";
            var mode = that._editMode();

            if (model) {
                var id = model.uid,
                    table = that.lockedContent ? that.lockedTable : that.table,
                    row = table.find("tr[" + kendo.attr("uid") + "=" + id + "]");
                const cells = that._isStackedMode() ? row.find("td:not(.k-group-cell,.k-hierarchy-cell) .k-grid-stack-cell:not(.k-drag-cell):not(.k-command-cell)") : row.children("td:not(.k-group-cell,.k-hierarchy-cell,.k-drag-cell)");
                const index = that._firstEditableColumnIndex(row);
                const cell = cells.eq(index);

                if (mode === "inline" && row.length) {
                    that.editRow(row);
                } else if (mode === "popup") {
                    that.editRow(model);
                } else if (cell.length) {
                    that.editCell(cell, index);
                }

                if (createAt.toLowerCase() == "bottom" && that.lockedContent) {
                    //scroll the containers to the bottom
                    that.lockedContent[0].scrollTop = that.content[0].scrollTop = that.table[0].offsetHeight;
                }
            }
        },

        _virtualAddRow: function() {
            var that = this;
            var createAtBottom = (that.options.editable.createAt || "").toLowerCase() === BOTTOM;

            that._clearEditableState();

            if (createAtBottom) {
                that._virtualAddRowAtBottom();
            } else {
                that._virtualAddRowAtTop();
            }
        },

        _virtualAddRowAtTop: function() {
            var that = this;
            var dataSource = that.dataSource;
            var virtualScrollable = that.virtualScrollable;
            var model;

            if (dataSource.page() === 1) {
                model = dataSource.insert(0, {});
                model.new = true;
                that._editModel(model);
                virtualScrollable.scrollToTop();
            } else {
                that._virtualPageToTop(function() {
                    model = dataSource.insert(0, {});
                    model.new = true;
                    that._editModel(model);
                    virtualScrollable.scrollToTop();
                });
            }
        },

        _virtualAddRowAtBottom: function() {
            var that = this;
            var dataSource = that.dataSource;
            var virtualScrollable = that.virtualScrollable;
            var index = dataSource.total();
            var model;

            if (dataSource.at(index - 1) instanceof ObservableObject) {
                model = dataSource.insert(index, {});
                model.new = true;

                that._virtualPageToBottom(function() {
                    that._editModel(model);
                    virtualScrollable.scrollToBottom();
                });
            } else {
                that._virtualPageToBottom(function() {
                    model = dataSource.insert(index, {});
                    model.new = true;
                    that._editModel(model);
                    virtualScrollable.scrollToBottom();
                });
            }
        },

        _virtualPageToTop: function(callback) {
            var that = this;

            that._virtualPage(0, that.dataSource.take(), function() {
                callback();
            });
        },

        _virtualPageToBottom: function(callback) {
            var that = this;
            var dataSource = that.dataSource;
            var take = dataSource.take();
            var total = dataSource.total();
            var skip = total > take ? (total - take) : 0;

            that._virtualPage(skip, take, function() {
                callback();
            });
        },

        _virtualPage: function(skip, take, callback) {
            var that = this;

            if (that._isVirtualEditable()) {
                that.virtualScrollable._preventScroll = true;
                that.virtualScrollable._page(skip, take, callback);
            }
        },

        _firstEditableColumnIndex: function(container) {
            var that = this,
                column,
                columns = leafColumns(that.columns),
                idx,
                length,
                model = that._modelForContainer(container);

            for (idx = 0, length = columns.length; idx < length; idx++) {
                column = columns[idx];

                if (model && (!model.editable || model.editable(column.field)) && !column.command && column.field && column.hidden !== true) {
                    return idx;
                }
            }
            return -1;
        },

        _clickAdd: function(e) {
            if (e.preventDefault) {
                e.preventDefault();
            }

            this.addRow();
            this._toggleToolbarEditingItemsVisibility();
        },

        _clickCancel: function(e) {
            if (e.preventDefault) {
                e.preventDefault();
            }

            this.cancelChanges();
            this._toggleToolbarEditingItemsVisibility();
        },

        _clickExcel: function(e) {
            var that = this;
            var deferred = $.Deferred();

            if (e.preventDefault) {
                e.preventDefault();
            }
            that._isExport = true;

            that._progress(true);

            setTimeout(() => {
                that.saveAsExcel(deferred);
                deferred.always(() => {
                    that._progress(false);
                    that._isExport = false;
                });
            }, 1);
        },

        _clickPdf: function(e) {
            var that = this;

            if (e.preventDefault) {
                e.preventDefault();
            }
            that._isExport = true;
            that._pdfInitialized = true;

            that._progress(true);
            var promise = that.saveAsPDF();

            if (promise) {
                promise.done(function() {
                    that._progress(false);
                    that._isExport = false;
                    that._pdfInitialized = false;
                });
            } else {
                that._progress(false);
                that._isExport = false;
                that._pdfInitialized = false;
            }
        },

        _clickSave: function(e) {
            if (e.preventDefault) {
                e.preventDefault();
            }

            this.saveChanges();
            this.one(DATABOUND, () => {
                this._toggleToolbarEditingItemsVisibility();
            });
        },

        _searchInput: function(e) {
            var that = this,
                input = e.currentTarget;

            clearTimeout(that._searchTimeOut);

            that._searchTimeOut = setTimeout(function() {
                that._searchTimeOut = null;

                var options = that.options;
                var searchFields = options.search ? options.search.fields : null;
                var expression = { filters: [], logic: "or" };
                var value = input.value;

                if (!searchFields) {
                    searchFields = getColumnsFields(options.columns);
                }

                if (that.dataSource.options.endless) {
                    that.dataSource.options.endless = null;
                    that._endlessPageSize = that.dataSource.options.pageSize;
                }

                if (value) {
                    for (var i = 0; i < searchFields.length; i++) {
                        that._pushExpression(expression.filters, searchFields[i], value);
                    }
                } else {
                    expression = {};
                }

                that.dataSource.filter(expression);
            }, 300);
        },

        _pasteToolbarDropDown: function() {
            var that = this;

            if (that.wrapper.find(".k-grid-paste-action").length) {
                that.pasteActionsDropDownList = that.wrapper
                    .find(".k-grid-paste-action")
                    .kendoDropDownList({
                        dataSource: [{ value: "insert", text: "Paste (Insert)" }, { value: "replace", text: "Paste (Replace)" }],
                        dataTextField: "text",
                        dataValueField: "value",
                        _allowFilterPaste: false,
                    }).data("kendoDropDownList");
            }
        },

        _pushExpression: function(filters, field, value) {
            var that = this,
                isServerFiltering = that.dataSource.options.serverFiltering,
                defaultOperators = {
                    string: "contains",
                    number: "gte",
                    date: "gte",
                    enums: "eq",
                    boolean: "eq"
                },
                name = field.name || field,
                operator = field.operator,
                modelInfo = that.dataSource.reader.model && that.dataSource.reader.model.fields,
                fieldInfo = modelInfo && modelInfo[name],
                parseFn = fieldInfo && fieldInfo.parse,
                expression = {
                    field: name,
                    operator: operator || defaultOperators.string,
                    value: value
                };

            if ((operator || isServerFiltering) && fieldInfo && kendo.isFunction(parseFn) && parseFn(value) !== null) {
                extend(expression, {
                    operator: operator || defaultOperators[fieldInfo.type],
                    value: parseFn(value)
                });
            }

            if (isServerFiltering && fieldInfo && kendo.isFunction(parseFn) && parseFn(value) === null) {
                return;
            }

            filters.push(expression);
        },

        _hasTool: function(selector) {
            const that = this;
            const tool = that.wrapper.find(`.k-grid-toolbar ${selector}`);
            return {
                present: tool.length > 0,
                tool: tool
            };
        },

        _initToolbarItemsPopups: function() {
            const that = this;

            const columnsToolbarButton = that._hasTool(".k-toolbar-button.k-grid-column-menu[ref-toolbar-tool]");
            const sortToolbarButton = that._hasTool(".k-toolbar-button.k-grid-sort-tool[ref-toolbar-tool]");
            const filterToolbarTool = that._hasTool(".k-toolbar-button.k-grid-filter-tool[ref-toolbar-tool]");
            const columnChooserTool = that._hasTool(".k-toolbar-button.k-grid-column-chooser[ref-toolbar-tool]");
            const groupToolbarTool = that._hasTool(".k-toolbar-button.k-grid-group-tool[ref-toolbar-tool]");

            if (columnsToolbarButton.present) {
                that._globalColumnsMenu(columnsToolbarButton.tool);
            }

            if (columnChooserTool.present) {
                that._columnChooserTool(columnChooserTool.tool);
            }

            if (sortToolbarButton.present) {
                that._toggleBadge(sortToolbarButton.tool, that.dataSource.sort());
                that._sortToolbarTool(sortToolbarButton.tool);
            }

            if (filterToolbarTool.present) {
                that._toggleBadge(filterToolbarTool.tool, that.dataSource.filter());
                that._filterToolbarTool(filterToolbarTool.tool);
            }

            if (groupToolbarTool.present) {
                const groups = that.dataSource.group();

                that._toggleBadge(groupToolbarTool.tool, groups && groups.length);
                that._groupToolbarTool(groupToolbarTool.tool);
            }
        },

        _unbindToolbarTools: function() {
            const that = this;
            const currentToolsSelector = `
                .k-toolbar-button.k-grid-column-menu[ref-toolbar-tool],
                .k-toolbar-button.k-grid-sort-tool[ref-toolbar-tool],
                .k-toolbar-button.k-grid-filter-tool[ref-toolbar-tool],
                .k-toolbar-button.k-grid-column-chooser[ref-toolbar-tool],
                .k-toolbar-button.k-grid-group-tool[ref-toolbar-tool],
                .k-toolbar-button.k-grid-ai-assistant-tool[ref-toolbar-tool]
            `;

            that.wrapper.find(currentToolsSelector).each(function() {
                const button = $(this);
                button.off("click" + NS);
            });
        },

         _ai: function() {
            const that = this;
            const hasAiTool = that._hasTool(".k-toolbar-button.k-grid-ai-assistant-tool[ref-toolbar-tool]");

            if (hasAiTool.present) {
                that._initAiAssistantWindow(hasAiTool.tool);
            }
        },

        _toolbar: function() {
            var that = this,
                wrapper = that.wrapper,
                toolbar = that.options.toolbar,
                container, items;

            if (toolbar) {
                that._createClickHandler = that._addClickHandler = that._clickAdd.bind(that);
                that._editClickHandler = that._editToolbarClick.bind(that);
                that._destroyClickHandler = that._removeToolbarClick.bind(that);
                that._editCancelClickHandler = that._editCancelClick.bind(that);
                that._updateClickHandler = that._editUpdateClick.bind(that);
                that._cancelClickHandler = that._clickCancel.bind(that);
                that._saveClickHandler = that._clickSave.bind(that);
                that._excelClickHandler = that._clickExcel.bind(that);
                that._pdfClickHandler = that._clickPdf.bind(that);
                that._serachHandler = that._searchInput.bind(that);

                container = that.wrapper.find(".k-grid-toolbar");

                if (!container.length) {
                    container = $('<div class="k-grid-toolbar k-toolbar" />')
                        .prependTo(wrapper);

                    if (typeof toolbar === STRING || isFunction(toolbar)) {
                        if (typeof toolbar === STRING) {
                            toolbar = kendo.template(toolbar).bind(that);
                        }

                        container.html(toolbar({ grid: that }));
                        that._attachToolbarClicks();
                    } else if (isArray(toolbar)) {
                        items = that._processItems(toolbar);

                        container.kendoToolBar({
                            navigateOnTab: !that.options.navigatable,
                            size: that.options.size,
                            items: items
                        });
                    } else if (isPlainObject(toolbar)) {
                        container.kendoToolBar({
                            navigateOnTab: !that.options.navigatable,
                            size: that.options.size,
                            items: that._processItems(toolbar.items || []),
                            overflow: toolbar.overflow
                        });
                    }
                } else {
                    that._attachToolbarClicks();
                }

                if (that._checkBoxSelection) {
                    container.on(CLICK + NS, ".k-select-checkbox", that._headerCheckboxClick.bind(that));
                }

                container.on(INPUT + NS, ".k-grid-search input", this._serachHandler);

                if (toolbar.overflow && toolbar.overflow.mode === "section") {
                    const toolbarElement = container.data("kendoToolBar");
                    toolbarElement.bind("overflowOpen", function() {
                        const itemsToCheck = toolbarElement.overflowSection.element.find(".k-toolbar-items-list");
                        that._toggleToolbarEditingItemsVisibility(itemsToCheck?.children(editableToolbarItemsSelector));
                    });
                }
                that._toggleToolbarEditingItemsVisibility();
            }
        },

        _toggleToolbarEditingItemsVisibility: function(itemsToCheck) {
            const that = this;
            const dataSource = that.dataSource;
            const hasChanges = dataSource.hasChanges();

            const toolbar = that.wrapper.find(".k-grid-toolbar");
            if (!toolbar.length) {
                return;
            }

            let toolbarItems;

            if (that.options.toolbar && that.options.toolbar.overflow && that.options.toolbar.overflow.mode === "scroll") {
                toolbarItems = toolbar.find(".k-toolbar-items").children(editableToolbarItemsSelector);
            } else if (itemsToCheck) {
                toolbarItems = itemsToCheck;
            } else {
                toolbarItems = toolbar.children(editableToolbarItemsSelector);
            }

            const showInactive = (that.options.toolbar && that.options.toolbar.showInactiveTools) || false;
            const mode = that._editMode();
            const editContainerVisible = that._editContainer && that._editContainer.length > 0 && that._editContainer.is(":visible");

            const method = showInactive ? (element) => {
                element.attr("aria-disabled", true);
                element.addClass("k-disabled");
            } : (element) => element.hide();

            const selected = that.select();
            const hasSelected = selected.length > 0;
            const differentSelectionThanEditing =
                hasSelected
                && that._editContainer
                && that._editContainer.length > 0
                && that._editContainer.is(":visible")
                && (that._editContainer[0].getAttribute(kendo.attr("uid")) !== selected[selected.length - 1].getAttribute(kendo.attr("uid")));


            const regex = getToolbarRegex({
                mode,
                hasSelected,
                hasChanges,
                editContainerVisible,
                differentSelectionThanEditing: !differentSelectionThanEditing && differentSelectionThanEditing !== false ? true : differentSelectionThanEditing,
                _editableIsClosing: that._editableIsClosing || false,
                _isEditableEnabled: that._isEditableEnabled || false,
                options: that.options
            });

            toolbarItems.show().removeClass("k-disabled").attr("aria-disabled", "false");

            toolbarItems.each(function() {
                const element = $(this);
                const identifier = element.attr("class");
                if (element.hasClass(FOCUSED)) {
                    element.removeClass(FOCUSED);
                    focusTable(that.table, true);
                }
                if (identifier && regex && regex.test(identifier)) {
                    method(element);
                }
            });
        },

        _attachToolbarClicks: function() {
            var editable = this.options.editable,
                container = this.wrapper.find(".k-grid-toolbar");

            if (editable && editable.create !== false) {
                container.on(CLICK + NS, ".k-grid-add", this._createClickHandler)
                    .on(CLICK + NS, ".k-grid-cancel-changes", this._cancelClickHandler)
                    .on(CLICK + NS, ".k-grid-save-changes", this._saveClickHandler);
            }

            if (editable && editable.update !== false) {
                container.on(CLICK + NS, ".k-grid-edit-command", this._editClickHandler)
                    .on(CLICK + NS, ".k-grid-save-command", this._updateClickHandler)
                    .on(CLICK + NS, ".k-grid-cancel-command", this._editCancelClickHandler);
            }

            if (editable.destroy !== false) {
                container.on(CLICK + NS, ".k-grid-remove-command", this._destroyClickHandler);
            }

            container.on(CLICK + NS, ".k-grid-excel", this._excelClickHandler);
            container.on(CLICK + NS, ".k-grid-pdf", this._pdfClickHandler);
        },

        _processItems: function(tools) {
            var that = this,
                options = that.options,
                items = [],
                messages = this.options.messages.commands,
                itemsCollectionHasSpacer = false;

            tools.map(t => {
                var command, searchText, icon, className, inputSize, template = "";

                if (typeof t === 'string') {
                    command = t.toLowerCase();
                    t = {};
                    if (command !== "aiassistant") {
                        t.text = messages[command] || command;
                    }
                } else {
                    command = (t.name || t.text || "");

                    let isPredefinedTool = defaultCommands[command.toLowerCase()];

                    if (isPredefinedTool) {
                        command = command.toLowerCase();
                    }
                    if (command !== "aiassistant") {
                        t.text = t.text === "" ? "" : (t.text || messages[command] || command);
                    }
                }

                if (!itemsCollectionHasSpacer && (command === "search" || command === "columns")) {
                    itemsCollectionHasSpacer = true;
                    items.push({
                        type: "spacer"
                    });
                }

                if (command.toLowerCase() === "selectall") {
                    const label = t.text;
                    t.template = t.template || kendo.template(SELECTCOLUMNHEADERTMPL)({ size: kendo.getValidCssClass("k-checkbox-", "size", that.options.size), label: label });
                }


                if (command === "search") {
                    searchText = htmlEncode(t.text || messages.search, true);
                    icon = t.icon || t.iconClass || "search";

                    inputSize = kendo.getValidCssClass("k-input-", "size", that.options.size);
                    template += `<span class='k-searchbox k-input ${inputSize} k-rounded-md k-input-solid k-grid-search'>`;
                    template += kendo.ui.icon({ icon: icon, iconClass: "k-input-icon" });
                    template += "<input autocomplete='off' placeholder='" + searchText + "' title='" + searchText + "' aria-label='" + searchText + "' class='k-input-inner' />";
                    template += "</span>";

                    items.push({
                        name: "search",
                        overflow: "never",
                        template: template
                    });
                } else if (command === "paste" && options.allowPaste) {
                    items.push({
                        template: "<input class='k-grid-paste-action' />"
                    });
                } else {
                    if (!command && !(isPlainObject(t) && t.template)) {
                        throw new Error("Custom commands should have name specified");
                    }

                    t = extend({ type: "button" }, defaultCommands[command], t);
                    className = t.className || "k-grid-" + (command || "").replace(/\s/g, "");

                    t.attributes = that._processAttr(t.attr);
                    delete t.attr;

                    if (!!className) {
                        if (t.attributes["class"] === undefined$1) {
                            t.attributes["class"] = "";
                        }

                        t.attributes["class"] += (" " + className);
                    }

                    if (t.template) {
                        delete t.type;
                    }

                    if (!!that["_" + command + "ClickHandler"]) {
                        t.click = that["_" + command + "ClickHandler"];
                    }
                    if (command === "canceledit") {
                        t.click = that._editCancelClickHandler;
                    }

                    items.push(t);
                }
            });

            return items;
        },

        _processAttr: function(attr) {
            var attributes = {},
                attrArray;

            if (typeof attr === STRING && attr.length > 0) {
                attrArray = attr.split(" ");
                attrArray.map(a => {
                    var keyValue = a.split("=");

                    if (keyValue.length === 2) {
                        attributes[keyValue[0]] = keyValue[1].replaceAll('"', "").replaceAll("'", "");
                    }
                });
            } else if (isPlainObject(attr)) {
                attributes = attr;
            }

            return attributes;
        },

        _createButton: function(command) {
            var button,
                template = command.template || COMMANDBUTTONTMPL,
                commandName = typeof command === STRING ? command : command.name || command.text,
                className = defaultCommands[commandName] ? defaultCommands[commandName].className : "k-grid-" + (commandName || "").replace(/\s/g, ""),
                options = { className: command.skipCommandClass ? "" : className, text: commandName, attr: command.skipTabIndex ? "" : "tabindex=-1", iconClass: "", size: command.size || this.options.size },
                messages = this.options.messages.commands,
                attributeClassMatch;

            if (!commandName && !(isPlainObject(command) && command.template)) {
                throw new Error("Custom commands should have name specified");
            }

            if (isPlainObject(command)) {
                command = extend(true, {}, command);

                if (command.className && inArray(options.className, command.className.split(" ")) < 0) {
                    command.className += " " + options.className;
                } else if (command.className === undefined$1) {
                    command.className = options.className;
                }

                if (command.className.indexOf("k-primary") > -1) {
                    command.className = command.className.replace("k-primary", "");
                    command.themeColor = "primary";
                }

                if (commandName === "edit") {
                    command = extend(true, {}, command);
                    command.text = isPlainObject(command.text) ? command.text.edit : command.text;
                    command.iconClass = isPlainObject(command.iconClass) ? command.iconClass.edit : command.iconClass;
                }

                if (command.attr) {
                    if (isPlainObject(command.attr)) {
                        command.attr = stringifyAttributes(command.attr);
                    }

                    if (command.attr instanceof Function) {
                        let compiledAttributes = command.attr(command);
                        command.attr = stringifyAttributes(compiledAttributes);
                    }

                    if (typeof command.attr === STRING) {
                        attributeClassMatch = command.attr.match(/class="(.+?)"/);

                        if (attributeClassMatch && inArray(attributeClassMatch[1], command.className.split(" ")) < 0) {
                            command.className += " " + attributeClassMatch[1];
                        }
                    }
                }

                const additionalOptions = { text: messages[commandName] };

                if (commandName === "edit" || commandName === "update") {
                    additionalOptions.themeColor = "primary";
                }

                if (commandName === "destroy") {
                    additionalOptions.iconClass = "k-i-x";
                }

                options = extend(true, options, defaultCommands[commandName], additionalOptions, command);
            } else {
                const additionalOptions = { text: messages[commandName] };
                if (commandName === "edit" || commandName === "update") {
                    additionalOptions.themeColor = "primary";
                }

                if (commandName === "destroy") {
                    additionalOptions.iconClass = "k-i-x";
                }
                options = extend(true, options, defaultCommands[commandName], additionalOptions);
            }

            button = kendo.template(template)(options);

            if (!command.template) {
                return kendo.html.renderButton($(button), options);
            } else {
                return button;
            }
        },

        _hasFooters: function() {
            return !!this.footerTemplate ||
                !!this.groupFooterTemplate ||
                (this.footer && this.footer.length > 0) ||
                this.wrapper.find(".k-grid-footer").length > 0;
        },

        _groupable: function() {
            var that = this;

            if (that._groupableClickHandler) {
                that.table.add(that.lockedTable).off(CLICK + NS, that._groupableClickHandler);
            } else {
                that._groupableClickHandler = function(e) {
                    var element = $(this),
                        groupRow = element.closest(TR);

                    var group = that._groupRows ? that._groupRows[that.wrapper.find(DOT + GROUPING_ROW).index(groupRow)] : {};

                    if (element.is(CARET_ALT_DOWN)) {
                        if (!that.trigger("groupCollapse", { group: group, element: groupRow })) {
                            that.collapseGroup(groupRow);
                        }
                    } else {
                        if (!that.trigger("groupExpand", { group: group, element: groupRow })) {
                            that.expandGroup(groupRow);
                        }
                    }
                    e.preventDefault();
                    e.stopPropagation();
                };
            }

            if (that._isLocked()) {
                that.lockedTable.on(CLICK + NS, ".k-grouping-row " + CARET_ALT_RIGHT + ", .k-grouping-row " + CARET_ALT_DOWN, that._groupableClickHandler);
            } else {
                that.table.on(CLICK + NS, ".k-grouping-row " + CARET_ALT_RIGHT + ", .k-grouping-row " + CARET_ALT_DOWN, that._groupableClickHandler);
            }

            that._attachGroupable();
        },

        _toggleGroupableHeader: function(condition) {
            const that = this;
            const groupable = that.options.groupable;
            const header = that.wrapper.find("div.k-grouping-header");

            if (!(groupable && groupable.enabled !== false) || !header.length) {
                return;
            }

            if (condition) {
                header.removeClass("k-hidden");
            } else {
                header.addClass("k-hidden");
            }
        },

        _attachGroupable: function() {
            var that = this,
                wrapper = that.wrapper,
                groupable = that.options.groupable,
                draggables = HEADERCELLS + "[" + kendo.attr("field") + "]",
                filter = that.content ? ".k-grid-header:first " + draggables : "table:first>.k-grid-header " + draggables;

            const stacked = that._isStackedMode();

            if (stacked) {
                filter = ".k-grid-stack-cell[data-field]";
            }

            if (groupable && groupable.enabled !== false) {
                if (!wrapper.has("div.k-grouping-header")[0]) {
                    $("<div/>").addClass("k-grouping-header").prependTo(wrapper);
                }

                if (that.groupable) {
                    that._destroyGroupable();
                }

                if (browser.chrome) {
                    wrapper.find("div.k-grouping-header").css("touch-action", NONE);
                    wrapper.find(filter).css("touch-action", NONE);
                }

                let header = that.wrapper.children(".k-grid-header");

                header.addClass("k-grid-draggable-header");
                header.attr("draggable", true);

                that.groupable = new ui.Groupable(wrapper, extend({}, groupable, {
                    draggable: !stacked ? that._draggableInstance : false,
                    groupContainer: ">div.k-grouping-header",
                    dataSource: that.dataSource,
                    draggableElements: !stacked ? filter : false,
                    filter: filter,
                    size: that.options.size,
                    allowDrag: that.options.reorderable,
                    enableContextMenu: !!that.options.contextMenu,
                    removeGroup: function(e) {
                        that._showUngroupedColumn(e);
                    },
                    change: function(e) {
                        if (that.trigger("group", { groups: e.groups })) {
                            e.preventDefault();
                        } else {
                            that._clearEditableState();
                            that._hideGroupedColumns(e.groups);
                            if (that.dataSource.options.endless) {
                                that._resetEndless();
                            }
                        }
                    },
                    _groupableFieldsData: stacked && that.columns,
                }));

                if (stacked) {
                    that._toggleGroupableHeader(that.dataSource.group().length > 0);
                }

                that._addGroupableOptionsToHeader();
            }
        },

        _showUngroupedColumn: function(group) {
            var columns = leafColumns(this.columns);
            var i;

            for (i = 0; i < columns.length; i++) {
                if (columns[i].uid == group.colID && columns[i].hideOnGroup) {
                    this.showColumn(columns[i]);
                }
            }
        },

        _hideGroupedColumns: function(groups) {
            if (!groups) {
                return;
            }
            var columns = leafColumns(this.columns);
            var fields = [];
            var i;

            for (i = 0; i < groups.length; i++) {
                if (groups[i].colID) {
                    fields.push(groups[i].colID);
                }
            }

            for (i = 0; i < columns.length; i++) {
                if (fields.indexOf(columns[i].uid) >= 0 && columns[i].hideOnGroup) {
                    this.hideColumn(columns[i]);
                }
            }
        },

        _resetEndless: function() {
            var that = this;
            that.dataSource.options.endless = null;
            that._endlessPageSize = that.dataSource.options.pageSize;
            that.dataSource._skip = 0;
            that.dataSource._pageSize = that.dataSource._take = that._endlessPageSize;
            that.dataSource._page = 1;
        },

        _addGroupableOptionsToHeader: function() {
            var that = this;
            var columns = flatColumns(that.columns);
            var columnFieldMap = {};
            var headerCells = that._headerCells();
            var cellFieldAttr = "";
            var headerCell;
            var columnOptions;
            var i;

            for (i = 0; i < columns.length; i++) {
                columns[i].field;
                columnFieldMap[columns[i].field] = columns[i];
            }

            for (i = 0; i < headerCells.length; i++) {
                headerCell = headerCells.eq(i);
                cellFieldAttr = headerCell.attr(kendo.attr(FIELD));
                columnOptions = columnFieldMap[cellFieldAttr];

                if (columnOptions && columnOptions.groupable && columnOptions.groupable.sort) {
                    headerCell.data(GROUP_SORT, columnOptions.groupable.sort);
                }
            }
        },

        _destroyGroupable: function() {
            var that = this;

            if (that.groupable && that.groupable.element) {
                that.groupable.element.kendoGroupable("destroy");
            }

            that.groupable = null;

            that._removeGroupableOptionsFromHeader();
        },

        _removeGroupableOptionsFromHeader: function() {
            var that = this;
            var headerCells = that._headerCells();

            for (var i = 0; i < headerCells.length; i++) {
                headerCells.eq(i).removeData(GROUP_SORT);
            }
        },

        _continuousItems: function(filter, cell) {
            if (!this.lockedContent) {
                return;
            }

            var that = this;

            var elements = that.table.add(that.lockedTable);

            var lockedItems = $(filter, elements[0]);
            var nonLockedItems = $(filter, elements[1]);
            var columns = cell ? lockedColumns(leafColumns(that.columns)).length : 1;
            var nonLockedColumns = cell ? leafColumns(that.columns).length - columns : 1;
            var result = [];

            for (var idx = 0; idx < lockedItems.length; idx += columns) {
                push.apply(result, lockedItems.slice(idx, idx + columns));
                push.apply(result, [].splice.call(nonLockedItems, 0, nonLockedColumns));
            }

            return result;
        },

        _selectable: function() {
            var that = this,
                multi,
                cell,
                notString = [],
                isLocked = that._isLocked(),
                selectable = that.options.selectable,
                hasSkeletonLoader = that.options.loaderType === "skeleton";

            if (selectable && !selectable.checkboxSelection) {

                if (that.selectable) {
                    that.selectable.destroy();
                }

                that._selectedIds = {};

                selectable = kendo.ui.Selectable.parseOptions(selectable);

                multi = selectable.multiple;
                cell = selectable.cell;

                if (that._hasDetails()) {
                    notString[notString.length] = ".k-detail-row";
                }
                if (that.options.groupable || that._hasFooters() || that._groups()) {
                    notString[notString.length] = ".k-grouping-row,.k-group-footer";
                }

                if (hasSkeletonLoader) {
                    notString[notString.length] = "[data-skeleton-row]";
                }
                notString = notString.join(",");

                if (notString !== "") {
                    notString = ":not(" + notString + ")";
                }

                var elements = that.table;
                if (isLocked) {
                    elements = elements.add(that.lockedTable);
                }

                const cellSelector = that._isStackedMode() ? STACKED_CELL_SELECTOR : SELECTION_CELL_SELECTOR;

                var filter = ">" + (cell ? cellSelector : "tbody>tr" + notString);
                that.selectable = new kendo.ui.Selectable(elements, {
                    allowPaste: that.options.allowPaste,
                    filter: filter,
                    aria: true,
                    multiple: multi,
                    holdToDrag: !!(that._isMobile || kendo.support.mobileOS),
                    toggleable: !!(that._isMobile || kendo.support.mobileOS),
                    dragToSelect: that.options.selectable && that.options.selectable.dragToSelect,
                    changing: function(e) {
                        if (that.trigger(CHANGING, { target: e.target, originalEvent: e.originalEvent })) {
                            e.preventDefault();
                        }
                    },
                    change: function(e) {
                        var selectedValues;
                        if (!cell) {
                            that._persistSelectedRows();
                        }

                        if (that._checkBoxSelection) {
                            selectedValues = that.selectable.value();
                            that._uncheckCheckBoxes();
                            that._checkRows(selectedValues);
                            if (selectedValues.length && selectedValues.length === that.items().length) {
                                that._toggleHeaderCheckState(true);
                            } else {
                                that._toggleHeaderCheckState(false);
                            }
                        }

                        that._calculateAggregatesForSelected();

                        if (that._editMode() !== "incell") {
                            that._toggleToolbarEditingItemsVisibility();
                        }

                        if (e.event) {
                            that.trigger(CHANGE, { cellAggregates: that._cellAggregates });
                        }
                    },
                    useAllItems: isLocked && multi && cell,
                    relatedTarget: function(items) {
                        if (cell || !isLocked) {
                            return;
                        }

                        var related;
                        var result = $();
                        for (var idx = 0, length = items.length; idx < length; idx++) {
                            related = that._relatedRow(items[idx]);

                            if (inArray(related[0], items) < 0) {
                                result = result.add(related);
                            }
                        }

                        return result;
                    },
                    continuousItems: function() {
                        return that._continuousItems(filter, cell);
                    },
                    ignoreOverlapped: that.options.selectable && that.options.selectable.ignoreOverlapped,
                    addIdToRanges: true
                });

                if (that.options.navigatable) {
                    elements.on("keydown" + NS, function(e) {
                        var current = that.current();
                        var target = e.target;
                        var eventObject = { event: e };
                        var triggerChange;
                        var triggerChanging;
                        var lastSelection;
                        if (!current) {
                            return;
                        }
                        if (e.keyCode === keys.SPACEBAR && !e.shiftKey && $.inArray(target, elements) > -1 &&
                            !current.is(".k-grid-stack-edit-cell,.k-edit-cell,.k-header") &&
                            current.parent().is(":not(.k-grouping-row,.k-detail-row,.k-group-footer)")) {
                            e.preventDefault();
                            e.stopPropagation();
                            current = cell ? current : current.parent();
                            triggerChange = !current.hasClass(SELECTED) || that.selectable.value().length > 1;
                            triggerChanging = triggerChange || (multi && current.hasClass(SELECTED) && e.ctrlKey);

                            if (triggerChanging && that.trigger(CHANGING, { target: current, originalEvent: e })) {
                                return;
                            }

                            if (isLocked && !cell) {
                                current = current.add(that._relatedRow(current));
                            }

                            if (multi) {
                                if (!e.ctrlKey) {
                                    that.selectable.clear();
                                } else {
                                    if (current.hasClass(SELECTED)) {
                                        that._deselectCheckRows(current);
                                        that._calculateAggregatesForSelected();
                                        that.trigger(CHANGE, { cellAggregates: that._cellAggregates });
                                        return;
                                    }
                                }
                            } else {
                                that.selectable.clear();
                            }
                            if (!cell) {
                                that.selectable._lastActive = current;
                            }
                            that.selectable.value(current);
                            if (triggerChange) {
                                that._calculateAggregatesForSelected();
                                that.trigger(CHANGE, { cellAggregates: that._cellAggregates });
                            }
                        } else if (!cell &&
                            ($(target).is("td") || ($(target).is("table") && inArray(target, this._navigatableTables))) &&
                            ((e.shiftKey && e.keyCode == keys.LEFT) ||
                                (e.shiftKey && e.keyCode == keys.RIGHT) ||
                                (e.shiftKey && e.keyCode == keys.UP) ||
                                (e.shiftKey && e.keyCode == keys.DOWN) ||
                                (e.keyCode === keys.SPACEBAR && e.shiftKey))) {
                            e.preventDefault();
                            e.stopPropagation();
                            current = current.parent();

                            if (that.trigger(CHANGING, { target: current, originalEvent: e })) {
                                return;
                            }

                            lastSelection = that.selectable.value();

                            if (isLocked) {
                                current = current.add(that._relatedRow(current));
                            }

                            if (multi) {
                                if (!that.selectable._lastActive) {
                                    that.selectable._lastActive = current;
                                }
                                that.selectable.selectRange(that.selectable._firstSelectee(), current);

                                if (!compareElements(lastSelection, that.selectable.value())) {
                                    that.trigger(CHANGE, eventObject);
                                }
                            } else if (!current.hasClass(SELECTED)) {
                                that.selectable.clear();
                                that.selectable.value(current);
                                that._calculateAggregatesForSelected();
                                that.trigger(CHANGE, { cellAggregates: that._cellAggregates });
                            }
                        }
                    });
                }
            }
        },

        _pasteReplaceHandler: function(plain) {
            var that = this,
                rows,
                current,
                currentRow,
                currentRowUid,
                currentField,
                uids = [];

            current = that.select().first();

            if (that._isStackedMode() || !current.length) {
                return;
            }

            if (current.is(TR)) {
                current = current.children(TD).first();
            }

            rows = plain.split("\n").filter(f => f);
            currentRow = current.closest("tr");
            currentField = that.thead.find("th:eq(" + current.index() + ")").data("field");
            currentRowUid = currentRow.data("uid");

            uids.push(currentRowUid);

            currentRow.nextAll(ITEMROW).slice(0, rows.length - 1).each((i, item) => {
                uids.push($(item).data("uid"));
            });

            that._executePaste(rows, uids, null, currentField);
        },

        _pasteInsertHandler: function(plain) {
            var that = this,
                dataSource = that.dataSource,
                rows,
                current,
                currentRow,
                dataItemIndex,
                dataItem;

            current = that.select().first();

            if (!current.length) {
                return;
            }

            if (current.is(TR)) {
                current = current.children(TD).first();
            }

            rows = plain.split("\n").filter(f => f);
            currentRow = current.closest("tr");
            dataItem = that.dataItem(currentRow);
            dataItemIndex = dataSource.indexOf(dataItem) + 1;

            that._executePaste(rows, null, dataItemIndex, null);
        },

        _executePaste: function(rows, uids, index, currentField) {
            var that = this,
                dataSource = that.dataSource,
                update = uids || false,
                dataItem,
                row,
                cells,
                cell,
                column,
                field,
                selectedUids = that._getSelectedRowUids(),
                selectedColumnFields = that._getSelectedColumnFields(),
                changedItems = [],
                visibleColumns = visibleLeafColumns(that.columns).filter(col => !col.selectable && !col.draggable & !col.command),
                startingIndex = currentField && visibleColumns.map(c => c.field).indexOf(currentField);

            // If only one value is copied and multiple cells are selected, replace all values in all selected cells with the copied value.
            if (rows.length === 1 && rows[0].split("\t").length === 1 && update) {
                for (let j = 0; j < selectedUids.length; j++) {
                    const uid = selectedUids[j];
                    dataItem = dataSource.getByUid(uid);
                    cell = rows[0].split("\t")[0];

                    for (let j = 0; j < selectedColumnFields.length; j++) {
                        field = selectedColumnFields[j];
                        if (dataItem && cell) {
                            dataItem.set(field, cell);
                        }
                    }

                    if (dataItem && dataItem.dirty) {
                        changedItems.push(dataItem);
                    }
                }
            } else {
                // If more than one value is copied, proceed with the standard replace.
                for (let i = 0; i < rows.length; i++) {
                    row = rows[i];
                    cells = row.split("\t");
                    dataItem = update ? dataSource.getByUid(uids[i]) : dataSource.insert(index + i, {});

                    for (let j = 0; j < cells.length; j++) {
                        cell = cells[j].replace(/\r/, "");
                        column = visibleColumns[j + startingIndex || 0];

                        if (column && dataItem && cell) {
                            field = column.field;
                            dataItem.set(field, cell);
                        }
                    }

                    if (dataItem && dataItem.dirty) {
                        changedItems.push(dataItem);
                    }
                }
            }
            that.trigger(PASTE, { items: changedItems, type: update ? "replace" : "insert" });
        },

        _pasteKeyboardHandler: function(e) {
            var that = this,
                current = that.current(),
                clipBoardData = e.originalEvent.clipboardData,
                operation = (that.pasteActionsDropDownList && that.pasteActionsDropDownList.value()) || "insert",
                rowUid,
                cellIndex,
                plain;

            if ($(e.target).is(".k-grid-stack-edit-cell input:visible,.k-edit-cell input:visible")) {
                return;
            }

            if (clipBoardData) {
                e.preventDefault();
                plain = clipBoardData.getData("text").trimEnd();

                // If the copied value consists only of white spaces or new lines, reduce it to a single white space.
                if (isEmptyString(plain)) {
                    plain = " ";
                }

                if (current && current.length) {
                    cellIndex = current.index();
                    rowUid = current.closest(TR).data("uid");
                }

                if (operation === "replace") {
                    that._pasteReplaceHandler(plain);
                }

                if (operation === "insert") {
                    that._pasteInsertHandler(plain);
                }

                // Restore the focus to the last focused cell.
                if (cellIndex && rowUid) {
                    that._currentRowIndex = that.wrapper.find(TR + "[data-uid='" + rowUid + "']").index();
                    that._restoreCurrent(cellIndex);
                }
            }
        },

        _paste: function() {
            var that = this,
                options = that.options,
                selectable = options.selectable,
                allowPaste = options.allowPaste;

            if (allowPaste && selectable) {
                that.pasteHandler = that._pasteKeyboardHandler.bind(that);
                const container = that.content || that.table;
                container.on(PASTE + NS, that.pasteHandler);

                if (that.options.toolbar) {
                    that._pasteToolbarDropDown();
                }
            }
        },

        _clipboard: function() {
            var options = this.options;
            var selectable = options.selectable;

            if (selectable && options.allowCopy) {
                var grid = this;
                if (!options.navigatable) {
                    grid.table.attr(TABINDEX, 0);

                    grid.table.add(grid.lockedTable)
                        .on(MOUSEDOWN + NS + " keydown" + NS, ".k-detail-cell", function(e) {
                            if (e.target !== e.currentTarget) {
                                e.stopImmediatePropagation();
                            }
                        })
                        .on(MOUSEDOWN + NS, NAVROW + ">" + NAVCELL, tableClick.bind(grid));
                }
                grid.copyHandler = grid.copySelection.bind(grid);
                grid.updateClipBoardState = function() {
                    if (grid.areaClipBoard) {
                        grid.areaClipBoard.val(grid.getTSV()).trigger("focus").select();
                    }
                };
                const container = grid.content || grid.table;
                grid.bind("change", grid.updateClipBoardState);
                container.on("keydown", grid.copyHandler);
                grid.clearAreaHandler = grid.clearArea.bind(grid);
                container.on("keyup", grid.clearAreaHandler);
            }
        },

        copySelectionToClipboard: function(includeHeaders) {
            this._createAreaClipBoard();
            this.areaClipBoard.val(this.getTSV(includeHeaders)).trigger("focus").select();
            document.execCommand('copy');
        },

        copySelection: function(e) {
            if ((e instanceof jQuery.Event && !(e.ctrlKey || e.metaKey)) ||
                !(e.keyCode === 67 && (e.ctrlKey || e.metaKey)) ||
                $(e.target).is("input:visible,textarea:visible") ||
                (window.getSelection && window.getSelection().toString()) ||
                (document.selection && document.selection.createRange().text)) {
                return;
            }

            this._createAreaClipBoard();
            this.areaClipBoard.val(this.getTSV()).trigger("focus").select();
        },

        _createAreaClipBoard: function() {
            if (!this.areaClipBoard) {
                this.areaClipBoard =
                    $("<textarea />")
                        .css({
                            position: "fixed",
                            top: "50%",
                            left: "50%",
                            opacity: 0,
                            width: 0,
                            height: 0
                        })
                        .appendTo(this.wrapper);
            }
        },

        getTSV: function(includeHeaders) {
            var grid = this;
            var selected = grid.select();
            var delimeter = "\t";
            var allowCopy = grid.options.allowCopy;
            var hasLockedCols = grid._isLocked() && lockedColumns(grid.columns).length;

            if ($.isPlainObject(allowCopy) && allowCopy.delimeter) {
                delimeter = allowCopy.delimeter;
            }
            var text = "";
            if (selected.length) {
                if (selected.eq(0).is(TR)) {
                    selected = selected.find("td:not(.k-group-cell)");
                }
                {
                    selected.filter(":visible");
                }

                var result = [];
                var cellsOffset = this.columns.length;
                var lockedCols = grid._isLocked() && lockedColumns(grid.columns).length;
                var inLockedArea = true;
                var fields = [];
                var field;
                var columns = visibleLeafColumns(this.columns);

                $.each(selected, function(idx, cell) {
                    cell = $(cell);
                    field = grid._getCellField(cell, hasLockedCols);

                    if (columns.findIndex(c => c.field === field) === -1) {
                        return;
                    }

                    var tr = cell.closest(TR);
                    var rowIndex = tr.index();
                    var cellIndex = cell.index();
                    {
                        cellIndex -= cell.prevAll(":hidden").length;
                    }
                    if (lockedCols && inLockedArea) {
                        inLockedArea = $.contains(grid.lockedTable[0], cell[0]);
                    }
                    if (grid._groups() && inLockedArea) {
                        cellIndex -= grid._groups();
                    }
                    cellIndex = inLockedArea ? cellIndex : (cellIndex + lockedCols);
                    if (field) {
                        fields[cellIndex] = field;
                    }
                    if (cellsOffset > cellIndex) {
                        cellsOffset = cellIndex;
                    }
                    var cellText = cell.text();
                    if (!result[rowIndex]) {
                        result[rowIndex] = [];
                    }
                    result[rowIndex][cellIndex] = cellText;
                });

                var rowsOffset = result.length;
                result = $.each(result, function(idx, val) {
                    if (val) {
                        result[idx] = val.slice(cellsOffset);
                        if (rowsOffset > idx) {
                            rowsOffset = idx;
                        }
                    }
                });

                if (includeHeaders && fields.length) {
                    result.splice(rowsOffset, 0, fields.map(function(field) {
                        return getTitle(field, columns);
                    }));

                    var headerIndex = result.findIndex(function(el) {
                        return el !== undefined$1;
                    });

                    result[headerIndex] = result[headerIndex].slice(cellsOffset);
                }

                $.each(result.slice(rowsOffset), function(idx, val) {
                    if (val) {
                        text += val.join(delimeter) + "\r\n";
                    } else {
                        text += "\r\n";
                    }
                });
            }
            return text;
        },

        clearArea: function(e) {
            if (this.areaClipBoard && e && e.target === this.areaClipBoard[0]) {
                focusTable(this.table, true);
            }

            if (this.areaClipBoard) {
                this.areaClipBoard.remove();
                this.areaClipBoard = null;
            }
        },

        _adaptiveColumns: function() {
            var that = this;

            if (that._anyColumnHasMediaQuery()) {
                that._setColumnsMediaVisibility(that.columns);
                that._attachColumnMediaResizeHandler();
            }
        },

        _anyColumnHasMediaQuery: function() {
            return this._columnsWithMediaQuery().length;
        },

        _columnsWithMediaQuery: function() {
            return columnsWithMedia(this.columns);
        },

        _attachColumnMediaResizeHandler: function() {
            var that = this;

            that._detachColumnMediaResizeHandler();
            that._columnMediaResizeHandler = that._onColumnMediaResize.bind(that);
            $(window).on(RESIZE + NS, that._columnMediaResizeHandler);
        },

        _detachColumnMediaResizeHandler: function() {
            var that = this;

            if (that._columnMediaResizeHandler) {
                $(window).off(RESIZE + NS, that._columnMediaResizeHandler);
            }
        },

        _onColumnMediaResize: function() {
            var that = this;
            that._setColumnsMediaVisibility(that.columns);
            that._setContentMediaWidth();
        },

        _setColumnsMediaVisibility: function(columns) {
            var cols = columns || [];

            for (var i = 0; i < cols.length; i++) {
                this._setColumnMediaVisibility(cols[i]);
            }
        },

        _setColumnMediaVisibility: function(column) {
            var that = this;

            if (isUndefined(column.media)) {
                that._setColumnsMediaVisibility(column.columns);
            } else {
                if (columnMatchesMedia(column)) {
                    that._showColumnByMedia(column);

                    if (!column.hidden) {
                        that._setColumnsMediaVisibility(column.columns);
                    }
                } else {
                    that._hideColumnByMedia(column);
                }
            }
        },

        _showColumnByMedia: function(column) {
            if (!column.hidden) {
                // "hidden" has a priority over "matchesMedia"
                this.showColumn(column);
            }

            setColumnMatchesMedia(column);
        },

        _hideColumnByMedia: function(column) {
            var initiallyHidden = column.hidden;

            if (!initiallyHidden) {
                column._hideByMedia = true;
                this.hideColumn(column);
                column._hideByMedia = false;

                // hiding is tracked in "matchesMedia" instead of "hidden" flag
                column.hidden = initiallyHidden;
            }

            setColumnMatchesMedia(column);
        },

        _setContentMediaWidth: function() {
            var that = this;
            var options = that.options;
            var isLocked = that._isLocked();
            var footer;

            if (options.scrollable && (options.resizable === true || (options.resizable && options.resizable.columns === true))) {
                if (isLocked && that.lockedFooter) {
                    footer = that.lockedFooter.children("table");
                } else if (that.footer) {
                    footer = that.footer.find(">.k-grid-footer-wrap>table");
                }

                if (!footer || !footer[0]) {
                    footer = $();
                }

                var header = isLocked ? that.wrapper.find(".k-grid-header-locked").find("table") : that.wrapper.find(".k-grid-header").find("table");
                var contentTable = isLocked ? that.lockedTable : that.table;

                var headerColumns = header.find("th");
                var headerColgroup = header.find("colgroup");

                var headerColumnsCount = headerColumns.length;
                var visibleHeaderColumnsCount = headerColumns.filter(isCellVisible).length;
                var hiddenHeaderColumnsCount = headerColumns.length - visibleHeaderColumnsCount;

                var totalHeaderWidth = 0;

                if (header[0].style.width !== "" && parseFloat(header[0].style.width) !== totalHeaderWidth) {
                    var currentHeaderWidth = header.css(WIDTH);

                    for (var i = 0; i < headerColumnsCount; i++) {
                        if (isElementVisible(headerColumns[i])) {
                            var columnWidth;
                            var cellIndex = Math.max(i, (i - hiddenHeaderColumnsCount));
                            var colgroupChild = headerColgroup.children()[cellIndex];
                            var columnStyleWidth = colgroupChild ? colgroupChild.style.width : "";

                            if (columnStyleWidth !== "") {
                                columnWidth = parseFloat(columnStyleWidth);
                            } else {
                                // remove the header width to calculate the height of a column without fixed width
                                header.css(WIDTH, AUTO);
                                columnWidth = outerWidth(headerColumns.eq(i));
                                header.css(WIDTH, currentHeaderWidth);
                            }

                            totalHeaderWidth += columnWidth;
                        }
                    }

                    contentTable.css('width', totalHeaderWidth - 1); // subtract 1 to remove the horizontal scroll
                    header.css('width', totalHeaderWidth);
                    footer.css('width', totalHeaderWidth);
                    that._updateStickyColumns();
                }
            }
        },

        _minScreenSupport: function() {
            var any = this.hideMinScreenCols();

            if (any) {
                this.minScreenResizeHandler = this.hideMinScreenCols.bind(this);
                $(window).on("resize", this.minScreenResizeHandler);
            }
        },

        hideMinScreenCols: function() {
            var cols = this.columns,
                screenWidth = (window.innerWidth > 0) ? window.innerWidth : screen.width;

            return this._iterateMinScreenCols(cols, screenWidth);
        },

        _iterateMinScreenCols: function(cols, screenWidth) {
            var any = false;

            for (var i = 0; i < cols.length; i++) {
                var col = cols[i];
                var minWidth = col.minScreenWidth;
                if (minWidth !== undefined$1 && minWidth !== null) {
                    any = true;
                    if (minWidth > screenWidth) {
                        this.hideColumn(col);
                    } else {
                        this.showColumn(col);
                    }
                }
                if (!col.hidden && col.columns) {
                    any = this._iterateMinScreenCols(col.columns, screenWidth) || any;
                }
            }
            return any;
        },

        _stickyColumns: function() {
            var that = this;

            if (that._anyStickyColumns()) {
                that._setStickyColumns(false);
            }
        },

        _updateStickyColumns: function() {
            var that = this;
            var groupHeaderColumnTemplateColumns = grep(leafColumns(that.columns), function(column) { return column.groupHeaderColumnTemplate; });

            if (that._anyStickyColumns()) {
                that._setStickyColumns(true);
                that._templates();

                if (groupHeaderColumnTemplateColumns.length > 0) {
                    that._renderGroupRows();
                }

                if (that._hasFilterRow()) {
                    that._updateStickyFilterCells();
                }
            }
        },

        _updateStickyFilterCells: function() {
            var that = this;
            var filterCells = that.thead.find(".k-filter-row").find("td:not(.k-group-cell,.k-hierarchy-cell)");
            if (filterCells.length) {
                filterCells.each(function() {
                    var th = $(this);
                    var column = th.data("column");

                    if (column.sticky) {
                        if (isPlainObject(column.stickyStyle)) {
                            th.css({
                                left: column.stickyStyle.left || "",
                                right: column.stickyStyle.right || ""
                            });
                        }

                        th.addClass(STICKY_HEADER_CLASS);
                    } else {
                        th.css({
                            left: "",
                            right: ""
                        });

                        th.removeClass(STICKY_HEADER_CLASS);
                    }
                });
            }
        },

        _anyStickyColumns: function() {
            var that = this;

            return !that._isStackedMode() && stickyColumns(that.columns).length;
        },

        _setStickyColumns: function(updateStyles) {
            var that = this;
            var columns = stickyColumns(that.columns);
            var visibleColumns = visibleStickyColumns(that.columns);
            var stickyWidths = that._calculateStickyWidths(visibleColumns);

            that._removeStickyAttributes(columns);
            that._setStickyClassAttributes(columns);
            that._setStickyStyleAttributes(visibleColumns, stickyWidths, updateStyles);

            if (updateStyles) {
                that._setStickyStyles(visibleColumns, stickyWidths);
            }
        },

        _calculateStickyWidths: function(columns, initialLeftWidth, initialRightWidth) {
            var that = this;
            var i;
            var column;
            var columnWidth;
            var nextColumnLeft;
            var nextColumnRight;
            var left = isRtl ? "right" : "left";
            var right = isRtl ? "left" : "right";
            var stickyWidths = {
                left: new Array(columns.length).fill(initialLeftWidth ? initialLeftWidth : 0),
                right: new Array(columns.length).fill(initialRightWidth ? initialRightWidth : 0)
            };

            for (i = 0; i < columns.length - 1; i++) {
                column = columns[i];
                columnWidth = that._sumColumnWidth(column);
                nextColumnLeft = columnWidth + stickyWidths[left][i];

                stickyWidths[left][i + 1] = nextColumnLeft;
            }

            for (i = columns.length - 1; i > 0; i--) {
                column = columns[i];
                columnWidth = that._sumColumnWidth(column);
                nextColumnRight = columnWidth + stickyWidths[right][i];

                stickyWidths[right][i - 1] = nextColumnRight;
            }

            return stickyWidths;
        },

        _setStickyClassAttributes: function(columns, masterIndex) {
            var that = this;
            var i;
            var column;

            for (i = 0; i < columns.length; i++) {
                column = columns[i];

                if (column.columns) {
                    if (!masterIndex && i) {
                        masterIndex = i;
                    }

                    that._setStickyClassAttributes(childColumns([column]), masterIndex);
                }

                if (masterIndex) {
                    addColumnAttribute(column, "headerAttributes", "class", STICKY_HEADER_NO_BORDER_CLASS);
                }
                addColumnAttribute(column, "attributes", "class", STICKY_CELL_CLASS);
                addColumnAttribute(column, "headerAttributes", "class", STICKY_HEADER_CLASS);
                addColumnAttribute(column, "footerAttributes", "class", STICKY_FOOTER_CLASS);
            }
        },

        _setStickyStyleAttributes: function(columns, stickyWidths, updateStyles) {
            var that = this;
            var i;
            var column;
            var stickyLeft;
            var stickyRight;
            var stickyStyle;
            var childCols;
            var childStickyWidths;

            for (i = 0; i < columns.length; i++) {
                column = columns[i];
                stickyLeft = stickyWidths.left[i];
                stickyRight = stickyWidths.right[i];
                stickyStyle = { left: stickyLeft + "px", right: stickyRight + "px" };

                if (column.columns) {
                    childCols = visibleChildColumns([column]);
                    childStickyWidths = that._calculateStickyWidths(childCols, stickyLeft, stickyRight);

                    that._setStickyStyleAttributes(childCols, childStickyWidths, updateStyles);

                    if (updateStyles) {
                        that._setStickyStyles(childCols, childStickyWidths);
                    }
                }

                addColumnAttribute(column, "attributes", kendo.attr("style-left"), stickyStyle.left);
                addColumnAttribute(column, "attributes", kendo.attr("style-right"), stickyStyle.right);
                addColumnAttribute(column, "headerAttributes", kendo.attr("style-left"), stickyStyle.left);
                addColumnAttribute(column, "headerAttributes", kendo.attr("style-right"), stickyStyle.right);
                addColumnAttribute(column, "footerAttributes", kendo.attr("style-left"), stickyStyle.left);
                addColumnAttribute(column, "footerAttributes", kendo.attr("style-right"), stickyStyle.right);

                column.stickyStyle = stickyStyle;
            }
        },

        _removeStickyAttributes: function(columns) {
            var that = this;
            var i;
            var cellClassRegExp = new RegExp("(\\s*" + STICKY_CELL_CLASS + ")*", "ig");
            var headerClassRegExp = new RegExp("(\\s*" + STICKY_HEADER_CLASS + ")*", "ig");
            var footerClassRegExp = new RegExp("(\\s*" + STICKY_FOOTER_CLASS + ")*", "ig");
            var headerClassNoBorderRegExp = new RegExp("(\\s*" + STICKY_HEADER_NO_BORDER_CLASS + ")*", "ig");
            var column;

            for (i = 0; i < columns.length; i++) {
                column = columns[i];

                if (column.columns) {
                    that._removeStickyAttributes(childColumns([column]));
                }

                removeColumnAttribute(column, "attributes", "class", cellClassRegExp);
                removeColumnAttribute(column, "attributes", kendo.attr("style-left"), '', true);
                removeColumnAttribute(column, "attributes", kendo.attr("style-right"), '', true);

                removeColumnAttribute(column, "headerAttributes", "class", headerClassRegExp);
                removeColumnAttribute(column, "headerAttributes", "class", headerClassNoBorderRegExp);
                removeColumnAttribute(column, "headerAttributes", kendo.attr("style-left"), '', true);
                removeColumnAttribute(column, "headerAttributes", kendo.attr("style-right"), '', true);

                removeColumnAttribute(column, "footerAttributes", "class", footerClassRegExp);
                removeColumnAttribute(column, "footerAttributes", kendo.attr("style-left"), '', true);
                removeColumnAttribute(column, "footerAttributes", kendo.attr("style-right"), '', true);
            }
        },

        _setStickyStyles: function(columns, stickyWidths) {
            var that = this;
            var i;
            var j;
            var leafsCols = leafColumns(nonLockedColumns(that.columns));
            var rows = that.tbody.children(":not(.k-detail-row)");
            var row;
            var column;
            var columnIndex;
            var left;
            var right;
            var header;
            var footer;
            var groupHeader;
            var cell;

            for (i = 0; i < columns.length; i++) {
                column = columns[i];
                left = stickyWidths.left[i];
                right = stickyWidths.right[i];
                columnIndex = leafsCols.indexOf(column);
                header = that._getColumnHeader(column);

                header.addClass(STICKY_HEADER_CLASS);
                if (column.headerAttributes["class"] && column.headerAttributes["class"].indexOf(STICKY_HEADER_NO_BORDER_CLASS) !== -1) {
                    header.addClass(STICKY_HEADER_NO_BORDER_CLASS);
                }
                setLeftAndRightStyles(header, left, right);

                if (column.columns) {
                    continue;
                }

                if (that.footer) {
                    footer = that.footer.find(".k-grid-footer-wrap tr.k-footer-template").children().filter(":not(.k-group-cell,.k-hierarchy-cell)").eq(columnIndex);

                    footer.addClass(STICKY_FOOTER_CLASS);
                    setLeftAndRightStyles(footer, left, right);
                }

                for (j = 0; j < rows.length; j++) {
                    row = $(rows[j]);

                    if (row.hasClass(GROUPING_ROW)) {
                        groupHeader = row.find("." + column.groupHeaderColumnTemplateClass);

                        groupHeader.addClass(STICKY_CELL_CLASS);
                        setLeftAndRightStyles(groupHeader, left, right);
                    } else {
                        cell = row.children().filter(":not(.k-group-cell,.k-hierarchy-cell)").eq(columnIndex);

                        cell.addClass(STICKY_CELL_CLASS);
                        setLeftAndRightStyles(cell, left, right);
                    }
                }
            }
        },

        _removeStickyStyles: function(columns) {
            var that = this;
            var i;
            var j;
            var leafsCols = leafColumns(nonLockedColumns(that.columns));
            var rows = that.tbody.children(":not(.k-detail-row)");
            var row;
            var column;
            var columnIndex;
            var header;
            var footer;
            var groupHeader;
            var cell;

            for (i = 0; i < columns.length; i++) {
                column = columns[i];
                columnIndex = leafsCols.indexOf(column);
                header = that._getColumnHeader(column);

                header.removeClass(STICKY_HEADER_CLASS);
                header.removeClass(STICKY_HEADER_NO_BORDER_CLASS);
                setLeftAndRightStyles(header, "", "");

                if (column.columns) {
                    that._removeStickyStyles(column.columns);
                    continue;
                }

                if (column.footerTemplate && that.footer) {
                    footer = that.footer.find(".k-grid-footer-wrap tr.k-footer-template").children().filter(":not(.k-group-cell,.k-hierarchy-cell)").eq(columnIndex);

                    footer.removeClass(STICKY_FOOTER_CLASS);
                    setLeftAndRightStyles(footer, "", "");
                }

                for (j = 0; j < rows.length; j++) {
                    row = $(rows[j]);

                    if (row.hasClass(GROUPING_ROW)) {
                        groupHeader = row.find("." + column.groupHeaderColumnTemplateClass);

                        groupHeader.removeClass(STICKY_CELL_CLASS);
                        setLeftAndRightStyles(groupHeader, "", "");
                    } else {
                        cell = row.children().filter(":not(.k-group-cell,.k-hierarchy-cell)").eq(columnIndex);

                        cell.removeClass(STICKY_CELL_CLASS);
                        setLeftAndRightStyles(cell, "", "");
                    }
                }
            }
        },

        _getColumnHeader: function(column) {
            var that = this;
            var header = $("#" + column.headerAttributes.id).length ? $("#" + column.headerAttributes.id) : $("#" + that._cellId);

            return header;
        },

        _sumColumnWidth: function(column) {
            var that = this;
            var width = 0;

            if (column.columns) {
                width = that._sumCurrentWidths(leafColumns([column]));
            } else {
                width = that._sumCurrentWidths([column]);
            }

            return width;
        },

        _sumCurrentWidths: function(cols) {
            var that = this;
            var width = 0;
            var colWidth = 0;
            var col;
            var header;
            var i;
            var length = cols.length;

            for (i = 0; i < length; i++) {
                col = cols[i];
                header = that._getColumnHeader(col);

                if (!col.hidden && columnMatchesMedia(col)) {
                    colWidth = header.is(":visible") ? header.outerWidth() : col.width;

                    width += colWidth ? parseInt(colWidth, 10) : 0;
                }
            }

            return width;
        },

        _belongsToGrid: function(element) {
            return this.wrapper[0] === element.closest(WRAPPER)[0];
        },

        getSelectedData: function() {
            var that = this;
            var selectedRanges = that.selectable.selectedRanges();
            var selectedRangeNames = Object.keys(selectedRanges);
            var selectedSingleItems = that.selectable.selectedSingleItems();
            var result = [];
            var visibleColumns = visibleLeafColumns(that.columns);

            for (var idx = 0; idx < selectedRangeNames.length; idx++) {
                result = result.concat(that._mapSelectionToData(selectedRanges[selectedRangeNames[idx]], visibleColumns, null, true));
            }

            if (selectedSingleItems.length) {
                result = result.concat(that._mapSelectionToData(selectedSingleItems, visibleColumns, null, true));
            }

            return result;
        },

        getSelectedDataByKeys: function() {
            var that = this,
                dataSource = that.dataSource,
                keys = that.selectedKeyNames(),
                visibleColumns = visibleLeafColumns(that.columns),
                key,
                dataItem,
                result = {};

            var columnMapHandler = function(col) {
                var result = {};

                if (!col.field) {
                    return;
                }

                result[col.field] = dataItem[col.field];
                return result;
            };

            for (let i = 0; i < keys.length; i++) {
                key = keys[i];
                dataItem = dataSource.get(key);

                if (dataItem) {
                    result[dataItem.uid] = $.extend.apply({}, visibleColumns.map(columnMapHandler));
                }
            }

            return Object.keys(result).map(function(id) {
                return result[id];
            });
        },

        exportSelectedToExcel: function(includeHeaders) {
            if (!kendo.excel || !kendo.ooxml) {
                throw new Error("The excel export functionality depends on both kendo.excel.js and kendo.ooxml.js scripts, please make sure they are included.");
            }

            var that = this;
            var excel = this.options.excel || {};
            var visibleColumns = visibleLeafColumns(that.columns);
            var exporter = new kendo.excel.ExcelExporter({});
            var columnHandler = function() { return { autoWidth: true }; };
            var book = {
                sheets: [{
                    columns: Array.apply(0, Array(visibleColumns.length)).map(columnHandler),
                    rows: [],
                    freezePane: {},
                    filter: false
                }]
            };
            var selectedRanges = that.selectable.selectedRanges();
            var selectedRangeNames = Object.keys(selectedRanges);
            var selectedSingleItems = that.selectable.selectedSingleItems();
            var idx;
            var exportData = [];
            var hasLockedCols = that._isLocked() && lockedColumns(that.columns).length;
            var sortHandler = exportDataSort.bind(that);


            for (idx = 0; idx < selectedRangeNames.length; idx++) {
                exportData = exportData.concat(that._mapSelectionToData(selectedRanges[selectedRangeNames[idx]], visibleColumns, isExcelExportableColumn));
            }

            if (exportData.length) {
                that._addRangeSelectionRows(book, exporter, exportData, includeHeaders);

            }
            exportData = selectedSingleItems.length ? that._mapSelectionToData(selectedSingleItems, visibleColumns, isExcelExportableColumn) : [];

            if (exportData.length) {
                if (hasLockedCols) {
                    exportData = exportData.sort(sortHandler);
                }
                that._addSingleSelectionRows(book, exporter, exportData, includeHeaders);
            }

            if (book.sheets[0].rows.length) {
                var workbook = new kendo.ooxml.Workbook(book);

                if (!workbook.options) {
                    workbook.options = {};
                }
                workbook.options.skipCustomHeight = true;

                workbook.toDataURLAsync().then(function(dataURI) {
                    kendo.saveAs({
                        dataURI: dataURI,
                        fileName: book.fileName || excel.fileName,
                        proxyURL: excel.proxyURL,
                        forceProxy: excel.forceProxy
                    });
                });
            }
        },

        _addSingleSelectionRows: function(book, exporter, data, includeHeaders) {
            var idx = 0;
            var visibleColumns = visibleLeafExportColumns(this.columns);
            var item;
            const exporterInstance = exporter._instance ?? exporter;
            for (idx = 0; idx < data.length; idx++) {
                item = data[idx];
                exporter.data = [item];
                this._setExporterColumns(exporterInstance, visibleColumns, item);
                this._createExportRows(book, exporterInstance, includeHeaders);
            }
        },

        _addRangeSelectionRows: function(book, exporter, data, includeHeaders) {
            var visibleColumns = visibleLeafExportColumns(this.columns);
            const exporterInstance = exporter._instance ?? exporter;
            exporter.data = data;
            this._setExporterColumns(exporterInstance, visibleColumns, data[0]);
            this._createExportRows(book, exporterInstance, includeHeaders);
        },

        _createExportRows: function(book, exporter, includeHeaders) {
            const exporterInstance = exporter._instance ?? exporter;
            book.sheets[0].rows = book.sheets[0].rows.concat(includeHeaders ? exporterInstance._rows() : exporterInstance._dataRows(exporterInstance.data, 0));
        },

        _setExporterColumns: function(exporter, columns, item) {
            const exporterInstance = exporter._instance ?? exporter;
            exporterInstance.columns = exporterInstance.options.columns = $.map(columns.filter(function(col) {
                return Object.keys(item).indexOf(col.field) >= 0;
            }), exporterInstance._prepareColumn);
        },

        _mapSelectionToData: function(elements, visibleColumns, columnsFilter, ignoreOffset) {
            var that = this;
            var elementType = elements[0][0].nodeName;
            var isRowSelection = elementType === 'TR';
            var dataItem;
            var result = {};
            var element;
            var curr;
            var field;
            var columnMapHandler = function(col) {
                var result = {};

                if (!col.field || (columnsFilter && !columnsFilter(col))) {
                    return;
                }

                result[col.field] = dataItem[col.field];
                return result;
            };
            var hasLockedCols = that._isLocked() && lockedColumns(that.columns).length;
            var column;

            for (var i = 0; i < elements.length; i++) {
                element = elements[i];
                dataItem = that.dataItem(isRowSelection ? element : element.closest(TR));

                if (isRowSelection) {
                    result[dataItem.uid] = $.extend.apply({}, visibleColumns.map(columnMapHandler));
                } else {
                    field = that._getCellField(element, hasLockedCols, ignoreOffset);

                    if (!field) {
                        continue;
                    }

                    curr = result[dataItem.uid];

                    if (!curr) {
                        curr = result[dataItem.uid] = {};
                    }

                    column = findColumnByField(visibleColumns, field);

                    if (!column || (columnsFilter && !columnsFilter(column))) {
                        continue;
                    }

                    curr[field] = dataItem[field];
                }
            }

            return Object.keys(result).map(function(id) {
                result[id].uid = id;
                return result[id];
            });
        },

        _getCellField: function(cell, hasLockedCols, ignoreOffset) {
            const grid = this;
            const inLockedArea = hasLockedCols && $.contains(grid.lockedTable[0], cell[0]);
            const fieldAttr = kendo.attr('field');
            const index = kendo.attr('index');
            const lockedOffset = inLockedArea ? 0 : hasLockedCols;
            let indexOffset = 0;

            if (ignoreOffset) {
                indexOffset = grid._trailingColumns();
            }

            if (grid._isStackedMode()) {
                return grid.table.find("div.k-grid-stack-cell[" + index + "='" + (cell.index() - indexOffset) + "']").attr(fieldAttr);
            } else if (hasLockedCols) {
                return grid.element.find(".k-grid-header-" + (inLockedArea ? "locked" : "wrap") + " th[" + index + "='" + (cell.index() + lockedOffset) + "']").attr(fieldAttr);
            } else {
                return grid.thead && grid.thead.find("th[" + index + "='" + (cell.index() - indexOffset) + "']").attr(fieldAttr);
            }
        },

        _relatedRow: function(row) {
            var lockedTable = this.lockedTable;
            row = $(row);

            if (!lockedTable) {
                return row;
            }

            var table = row.closest(this.table.add(this.lockedTable));
            var index = table.find(">tbody>tr").index(row);

            table = table[0] === this.table[0] ? lockedTable : this.table;

            return table.find(">tbody>tr").eq(index);
        },

        _relatedCell: function(cell) {
            var lockedTable = this.lockedTable;

            cell = $(cell);

            if (!lockedTable) {
                return cell;
            }

            var table = cell.closest(this.table.add(this.lockedTable));
            var index = table.find(">tbody>tr>td").index(cell);

            table = table[0] === this.table[0] ? lockedTable : this.table;

            return table.find(">tbody>tr>td").index(index);
        },

        clearSelection: function() {
            var that = this;

            if (that.selectable && !that._checkBoxSelection) {
                that.selectable.clear();
            }

            if (that._checkBoxSelection) {
                that._deselectCheckRows(that.select());
                return;
            }

            if (that.options.persistSelection) {
                that._persistSelectedRows();
            } else {
                that._selectedIds = {};
            }
        },

        clearHighlight: function() {
            const that = this;
            if (that._highlightDescriptors) {
                delete that._highlightDescriptors;
            }

            if (that._highlightedItems && that._highlightedItems.length) {
                that._highlightedItems.removeClass(HIGHLIGHTED);
                delete that._highlightedItems;
            }

            if (that._hasAIHighlight) {
                delete that._hasAIHighlight;
            }
        },

        _getElementsToHightlight: function(data) {
            const that = this;
            const columns = that.columns;
            const lockedColumns = [];
            const nonLockedCols = [];
            const highlighted = [];
            let rowSelector = (uid) => `tr[data-uid='${uid}']`;
            const getColIndex = (cols, field) => cols.length && cols.findIndex((col) => col.field === field);


            grep(columns, (col) => {
                if (col.locked) {
                    lockedColumns.push(col);
                } else {
                    nonLockedCols.push(col);
                }
            });

            Object.entries(data).forEach(([key, value]) => {
                if (!key) {
                    return;
                }

                const item = that.dataSource.get(key);

                if (!item) {
                    return;
                }

                let row = that.tbody.find(rowSelector(item.uid));

                if (value === true) {
                    highlighted.push(row);
                } else if (typeof value === 'object') {
                    Object.keys(value).forEach((field) => {
                        if (!field && !value[field]) {
                            return;
                        }

                        let isLockedCell = false;
                        let columnIndex = getColIndex(nonLockedCols, field);

                        if (columnIndex === -1) {
                            columnIndex = getColIndex(lockedColumns, field);
                            isLockedCell = true;
                        }

                        if (isLockedCell) {
                            row = that._relatedRow(row);
                        }

                        const td = row.find(`td:eq(${columnIndex})`);

                        if (td.length) {
                            highlighted.push(td);
                            row = that.tbody.find(rowSelector(item.uid));
                        }
                    });
                }
            });

            return highlighted;
        },

        _restoreHighlight: function() {
            const that = this;
            const highlightDescriptors = that._highlightDescriptors;

            if (!highlightDescriptors || !Object.keys(highlightDescriptors).length) {
                return;
            }

            that.highlight(highlightDescriptors);
        },

        _persistHighlight: function(element) {
            const that = this;
            const highlightDescriptor = {};
            const isRow = element.is("tr");
            const idField = that.options.dataSource?.schema?.model?.id || "id";

            let row = isRow ? element : element.closest("tr");


            const uid = row.data("uid");

            const item = that.dataSource.getByUid(uid);

            if (!item) {
                return;
            }

            const key = item[idField];

            if (isRow) {
                highlightDescriptor[key] = true;
            } else {
                const field = that._getCellField(element, that._isLocked(), true);
                if (!field) {
                    return;
                }
                highlightDescriptor[key] = field;
            }

            if (that._highlightDescriptors) {
                that._highlightDescriptors = that._mergeHighlightDescriptor(that._highlightDescriptors, highlightDescriptor);
            } else {
                that._highlightDescriptors = highlightDescriptor;
            }
        },

        _mergeHighlightDescriptor: function(existingDescriptors, newDescriptor) {
            const merged = {};
            let key, existingValue, newValue;

            for (key in existingDescriptors) {
                merged[key] = existingDescriptors[key];
            }

            for (key in newDescriptor) {
                existingValue = merged[key];
                newValue = newDescriptor[key];

                if (existingValue === undefined$1) {
                    merged[key] = newValue;
                } else if (newValue === true) {
                    merged[key] = true;
                } else if (typeof newValue === "object" && newValue !== null && typeof existingValue === "object" && existingValue !== null) {
                    merged[key] = extend({}, existingValue, newValue);
                } else {
                    merged[key] = existingValue;
                }
            }

            return merged;
        },

        highlight: function(data) {
            const that = this;
            const lockedContainer = that.lockedTable;
            const isEmptyArray = Array.isArray(data) && !data.length;

            if (!data && !isEmptyArray) {
                return that._highlightedItems || $();
            }

            if (isEmptyArray) {
                that.clearHighlight();
                return;
            }

            const isObject = typeof data === "object" && !Array.isArray(data);

            const keys = isObject ? Object.keys(data) : [];
            const isHighlightDescriptor = keys.length && that.dataSource.get(keys[0]);

            let itemsToHighlight;

            if (isHighlightDescriptor) {
                that._highlightDescriptors = that._mergeHighlightDescriptor(that._highlightDescriptors || {}, data);
                itemsToHighlight = that._getElementsToHightlight(data);
            } else {
                itemsToHighlight = Array.isArray(data) ? data : [data];
            }

            const highlightRelatedRow = (item) => {
                const targetIsRow = item.is("tr");
                let relatedItem;

                if (!item) {
                    return;
                }

                if (targetIsRow && lockedContainer?.length) {
                    relatedItem = that._relatedRow(item);
                    item = item.add(relatedItem);
                }

                return item;
            };

            itemsToHighlight.forEach(function(item) {
                const target = highlightRelatedRow($(item));

                if (target && !isHighlightDescriptor) {
                    that._persistHighlight(target);
                }

                if (target?.length) {
                     if (that._highlightedItems && that._highlightedItems.index(target) !== -1) {
                        return;
                    }

                    target.addClass(HIGHLIGHTED);
                    if (that._highlightedItems) {
                        that._highlightedItems = that._highlightedItems.add(target);
                    } else {
                        that._highlightedItems = target;
                    }
                }
            });
        },

        select: function(items) {
            var that = this,
                selectable = that.selectable,
                selectableoptions = kendo.ui.Selectable.parseOptions(this.options.selectable),
                cell = selectableoptions.cell;

            items = that.table.add(that.lockedTable).find(items);
            if (items.length) {
                if (selectable && !selectable.options.multiple) {
                    selectable.clear();
                    items = items.first();
                }

                if (that._isLocked()) {
                    items = items.add(items.map(function() {
                        if (cell) {
                            return that._relatedCell(this);
                        }
                        else {
                            return that._relatedRow(this);
                        }
                    }));
                }

                if (selectable && !that._checkBoxSelection) {
                    selectable.value(items);
                } else {
                    that._checkRows(items);
                    if (that.select().length === that.items().length) {
                        that._toggleHeaderCheckState(true);
                    }
                }

                if (!cell) {
                    that._persistSelectedRows();
                }

                return;
            }

            return selectable ? selectable.value() : that.items().filter("." + SELECTED);
        },

        _initSelectableAggregates: function() {
            var that = this;

            if (!that.options.selectable) {
                return;
            }

            if (!that._selectableAggregatesOptions) {
                that._selectableAggregatesOptions = that._parseSelectableAggregatesOptions();
            }

            if (that._selectableAggregatesOptions.count) {
                that._cellAggregates = {
                    count: 0
                };
            }
        },

        _calculateAggregatesForSelected: function() {
            var that = this,
                options = that.options,
                selectedData = that.getSelectedDataByKeys(),
                selectable = that.options.selectable,
                cellAggregates = selectable.cellAggregates,
                cellsLength = visibleLeafColumns(that.columns).filter(col => !col.selectable && !col.draggable & !col.command).length,
                columnFields = getColumnsFields(options.columns),
                isCellSelection = kendo.ui.Selectable.parseOptions(selectable).cell,
                dataItem,
                type,
                value,
                numberAggregates = [],
                dateAggregates = [],
                booleanAggregates = [],
                count, min, max, sum, average, earliest, latest, isTrue, isFalse;

            if (!cellAggregates) {
                return;
            }

            // getSelectedDataByKeys won't work for cell selection.
            if (isCellSelection) {
                selectedData = that.getSelectedData();
            }

            cellAggregates = that._selectableAggregatesOptions;

            for (let i = 0; i < selectedData.length; i++) {
                dataItem = selectedData[i];

                for (let j = 0; j < columnFields.length; j++) {
                    value = dataItem[columnFields[j]];
                    type = getType(value);

                    switch (type) {
                        case "number":
                            numberAggregates.push(value);
                            break;
                        case "date":
                            dateAggregates.push(value);
                            break;
                        case "boolean":
                            booleanAggregates.push(value);
                            break;
                    }
                }
            }

            if (cellAggregates.count) {
                count = isCellSelection ? cellsExcludingSpecialColumns(that.select()).length : selectedData.length * cellsLength;
            }

            if (numberAggregates.length) {
                max = cellAggregates.max ? numberAggregates.reduce((acc, current) => Math.max(acc, current)) : null;
                min = cellAggregates.min ? numberAggregates.reduce((acc, current) => Math.min(acc, current)) : null;
                sum = cellAggregates.sum ? numberAggregates.reduce((acc, current) => acc + current) : null;
                average = cellAggregates.average ? numberAggregates.reduce((acc, current) => (acc + current)) / numberAggregates.length : null;
            }

            if (dateAggregates.length) {
                earliest = cellAggregates.earliest ? dateAggregates.reduce((acc, current) => new Date(Math.min(acc, current))) : null;
                latest = cellAggregates.latest ? dateAggregates.reduce((acc, current) => new Date(Math.max(acc, current))) : null;
            }

            if (booleanAggregates.length) {
                isTrue = cellAggregates.isTrue ? booleanAggregates.filter(b => b === true).length : null;
                isFalse = cellAggregates.isFalse ? booleanAggregates.filter(b => b === false).length : null;
            }

            that._cellAggregates = {
                count: count,
                max: max,
                min: min,
                sum: sum,
                average: average,
                earliest: earliest,
                latest: latest,
                isTrue: isTrue,
                isFalse: isFalse
            };

            if (that.statusBar) {
                that._statusBar();
            }
        },

        _parseSelectableAggregatesOptions: function() {
            var that = this,
                cellAggregates = that.options.selectable.cellAggregates,
                result = {};

            if (isArray(cellAggregates)) {
                for (let i = 0; i < cellAggregates.length; i++) {
                    result[cellAggregates[i]] = true;
                }
                return result;
            }

            // If the value of cellAggregates is 'true' -> all aggregates must be enabled.
            return {
                count: true,
                min: true,
                max: true,
                sum: true,
                average: true,
                earliest: true,
                latest: true,
                isTrue: true,
                isFalse: true
            };
        },

        _toggleHeaderCheckState: function(checked) {
            const that = this;
            const stacked = that._isStackedMode();
            const toolbar = that.wrapper.find(".k-toolbar");
            const selectAllTool = toolbar.find(CHECKBOXINPUT);

            let container = stacked ? toolbar : that.thead.add(that.lockedHeader);
            let checkboxSelector = stacked ? CHECKBOXINPUT : "tr " + CHECKBOXINPUT;


            const toggleState = (element, state) => {

                if (element.length) {
                    const ariaLabel = state ? "Deselect all rows" : "Select all rows";

                    element
                        .prop("checked", state).attr(ARIA_CHECKED, state)
                        .attr(ARIA_LABEL, ariaLabel);
                }
            };

            if (stacked) {
                toggleState(selectAllTool, checked);
            } else {
                const headerCheckbox = container.find(checkboxSelector);
                toggleState(headerCheckbox, checked);
                toggleState(selectAllTool, checked);
            }
        },

        _uncheckCheckBoxes: function() {
            var that = this;
            var tables = that.table.add(that.lockedTable);

            tables.find("tbody " + CHECKBOXINPUT).attr(ARIA_CHECKED, false)
                .prop("checked", false).attr(ARIA_LABEL, "Select row");

        },

        _deselectCheckRows: function(items) {
            var that = this,
                rangeSelectedAttr = kendo.attr("range-selected");
            items = that.table.add(that.lockedTable).find(items);

            if (that._isLocked()) {
                items = items.add(items.map(function() {
                    return that._relatedRow(this);
                }));
            }

            items.each(function() {
                $(this).removeClass(SELECTED).removeAttr(rangeSelectedAttr).find(CHECKBOXINPUT).attr(ARIA_CHECKED, false)
                    .prop("checked", false).attr(ARIA_LABEL, "Select row");
            });
            that._toggleHeaderCheckState(false);

            that._persistSelectedRows();

        },

        _checkRows: function(items) {
            items.each(function() {
                $(this).addClass(SELECTED).find(CHECKBOXINPUT)
                    .prop("checked", true)
                    .attr(ARIA_LABEL, "Deselect row")
                    .attr(ARIA_CHECKED, true);
            });
        },

        _persistSelectedRows: function() {
            var that = this,
                key,
                dataItem,
                allRows = that.items(),
                dataSourceOptions = that.dataSource.options,
                schema = dataSourceOptions.schema,
                modelId,
                selectedViewIds = {};

            if (!schema || !schema.model || !that._data) {
                return;
            }

            modelId = that._getSchemaIdField();

            if (!modelId) {
                return;
            }

            if (!kendo.ui.Selectable.parseOptions(that.options.selectable).multiple && !that._checkBoxSelection) {
                that._selectedIds = {};
            }

            that.select().each(function() {
                dataItem = that.dataItem(this);
                selectedViewIds[dataItem[modelId]] = true;
            });

            for (var i = 0; i < allRows.length; i++) {
                dataItem = that.dataItem(allRows[i]);
                key = dataItem[modelId];
                if (selectedViewIds[key]) {
                    that._selectedIds[key] = true;
                } else {
                    delete that._selectedIds[key];
                }
            }
        },

        selectedKeyNames: function() {
            var that = this,
                ids = [];
            for (var property in that._selectedIds) {
                ids.push(property);
            }
            ids.sort();
            return ids;
        },

        _updateCurrentAttr: function(current, next, skipFocus) {
            var headerId = $(current).data("headerId");
            var nextId;
            var descId;

            $(current).removeClass(FOCUSED);
            this.table.removeAttr(ARIA_ACTIVEDESCENDANT);

            if (headerId) {
                headerId = headerId.replace(this._cellId, "");
                $(current).attr(ID, headerId);
            } else {
                $(current).removeAttr(ID);
            }

            nextId = next.attr(ID);

            if (nextId != this._cellId) {
                next.data("headerId", nextId);
            }

            if (!!nextId) {
                descId = nextId;
            } else {
                next.attr(ID, this._cellId);
            }

            if (!skipFocus) {
                next.addClass(FOCUSED);
            }

            this.table.attr(ARIA_ACTIVEDESCENDANT, descId || this._cellId);

            this._current = next;
        },

        _scrollCurrent: function() {
            const current = this._current;
            const scrollable = this.options.scrollable;

            if (!current || !scrollable) {
                return;
            }

            var row = current.parent();
            var tableContainer = row.closest("table").parent();

            var isInLockedContainer = tableContainer.is(".k-grid-content-locked,.k-grid-header-locked");
            var isInContent = tableContainer.is(".k-grid-content-locked,.k-grid-content,.k-virtual-scrollable-wrap");

            var scrollableContainer = $(this.content).find(">.k-virtual-scrollable-wrap").addBack().last()[0];

            //adjust scroll vertically
            if (isInContent) {
                if (this.virtualScroll) {
                    var rowIndex = Math.max(inArray(row[0], this._items(row.parent())), 0);
                    if (this.virtualScroll.rows) {
                        this._rowVirtualIndex = this.virtualScrollable.itemIndex(rowIndex);
                        this.virtualScrollable.scrollIntoView(row);
                    } else {
                        this._rowVirtualIndex = rowIndex;
                        this._scrollTo(this._relatedRow(row)[0], scrollableContainer);
                    }
                } else {
                    this._scrollTo(this._relatedRow(row)[0], scrollableContainer);
                }
            }

            if (this.lockedContent) {
                //sync locked and non-locked content scrollTop
                this.lockedContent[0].scrollTop = scrollableContainer.scrollTop;
            }

            //adjust scroll horizontally, if not inside locked tables
            if (!isInLockedContainer) {
                this._scrollTo(current[0], scrollableContainer);
            }
        },


        _findGroupedItem: function(data, id, idField) {
            const that = this;
            let item;

            for (let i = 0; i < data.length; i++) {
                const group = data[i];
                if (group.field === idField) {
                    if (group.value === id) {
                        if (group.items[0].uid && group.items[0][idField]) {
                            item = group.items[0];
                        } else {
                            item = that._findGroupedItem(group.items, id, idField);
                        }
                    }
                } else if (group.items[0].uid && group.items[0][idField]) {
                    item = group.items.find((item) => item[idField] === id);
                } else {
                    item = that._findGroupedItem(group.items, id, idField);
                }

                if (item) {
                    return item;
                }

            }
        },

        _findClosestGroupingRow: function(htmlRow, rowsCount, hiddenGroupingRows) {
            const that = this;
            const hasGroupingRows = that.options.groupable && that.dataSource.group().length > 0;
            let i = rowsCount ? rowsCount : 0;
            let j = hiddenGroupingRows ? hiddenGroupingRows : 0;

            if (!hasGroupingRows || !htmlRow) {
                return { targetRow: htmlRow, rowsToTarget: i, hiddenGroupingRows: j };
            }

            const prevSibling = $(htmlRow.previousSibling);
            if (prevSibling && prevSibling.hasClass(GROUPING_ROW)) {
                let result = { targetRow: prevSibling, rowsToTarget: i, hiddenGroupingRows: j };
                if (prevSibling.css("display") === "none") {
                    result = that._findClosestGroupingRow(prevSibling[0], i, j + 1);
                }
                return result;
            } else {
                const result = that._findClosestGroupingRow(prevSibling[0], i + 1, j);
                if (result) {
                    return { targetRow: result.targetRow, rowsToTarget: result.rowsToTarget, hiddenGroupingRows: j };
                }
            }
        },

        _checkItemAlreadyLoaded: function(id, idField) {
            const that = this;
            const dataSource = that.dataSource;
            const ranges = dataSource._ranges;

            let item;
            for (let i = 0; i < ranges.length; i++) {
                const range = ranges[i].data;
                item = range.find((item) => item[idField] === id);

                if (item) {
                    return { loadedItem: item, page: i };
                }
            }

            return;
        },

        scrollToItem: function(id, callback) {
            const that = this,
                options = that.options,
                dataSource = that.dataSource,
                groups = dataSource.group(),
                pageSize = dataSource.pageSize(),
                idField = that._getSchemaIdField(),
                scrollable = options.scrollable,
                scrollableContainer = that.wrapper.find(".k-grid-content.k-auto-scrollable"),
                rowHeight = kendo._outerHeight(that.tbody.find(`tr:not(.${GROUPING_ROW})`)),
                isVirtual = scrollable && scrollable.virtual && (scrollable.virtual === 'rows' || scrollable.virtual === true);

            let rootGroupingRow = options.groupable && that.wrapper.find(`.${GROUPING_ROW}:first-child`);
            let previouslyScrolledItems = {};
            let targetRowIsHidden = false;
            let groupingRowHeight = 0;

            if (that._scrolledItems) {
                previouslyScrolledItems = that._scrolledItems;
            }

            if (isVirtual && groups.length === 0) {
                that.virtualScrollable._alwaysScrollTop = true;
            }

            if (!id || !idField) {
                return;
            }

            const currentView = dataSource.view();

            let item = currentView.find((item) => item[idField] == id);

            if (groups.length > 0) {
                item = that._findGroupedItem(currentView, id, idField);
                groupingRowHeight = kendo._outerHeight(rootGroupingRow[0]);
            }

            if (!item && isVirtual) {
                if (!that.virtualScrollable._programmaticallyScrolling || that.virtualScrollable._programmaticallyScrolling.state() === 'resolved') {
                    that.virtualScrollable._programmaticallyScrolling = $.Deferred();
                }

                callback && typeof callback === 'function' && callback({
                    success: (index) => {
                        let itemIndex = index;
                        itemIndex = typeof itemIndex !== 'number' ? Number(itemIndex) : itemIndex;

                        if (isNaN(itemIndex)) {
                            return;
                        }

                        const serverPaging = dataSource.options.serverPaging;
                        let page = math.floor(itemIndex / pageSize);

                        if (serverPaging) {
                            const itemLoaded = that._checkItemAlreadyLoaded(id, idField);
                            if (itemLoaded) {
                                page = itemLoaded.page;
                            }
                        }


                        const allRows = scrollableContainer.find(TR);
                        const lastRowOffsetTop = allRows[allRows.length - 1].offsetTop;
                        const pageEndOffset = (pageSize / allRows.length) * lastRowOffsetTop;

                        const itemsToTarget = (itemIndex - page * pageSize) - 1;

                        const scrollPosition = page * pageEndOffset + itemsToTarget * rowHeight;

                        that._scrollingUp = that.virtualScrollable.verticalScrollbar.scrollTop() > scrollPosition;
                        that._scrollOffset = scrollPosition;
                        that.virtualScrollable._scrollTo(scrollPosition);
                        that.virtualScrollable.verticalScrollbar.trigger(SCROLL);

                        return that.virtualScrollable._programmaticallyScrolling.done(() => {
                            that.scrollToItem(id);
                        });
                    }
                });
                return;
            }

            const uid = item && item.uid;

            if (!uid) {
                return;
            }

            const selector = `[data-uid=${uid}]`;
            let element = $(selector);


            let { targetRow, rowsToTarget, hiddenGroupingRows } = that._findClosestGroupingRow(element[0]);


            if (!element || !targetRow) {
                return;
            } else if (groups.length > 0 && element.css("display") === "none") {
                element = targetRow;
                targetRowIsHidden = true;
            }

            const hiddenGroupingRowsOffset = targetRowIsHidden ? (hiddenGroupingRows * groupingRowHeight) + rowHeight : 0;
            let wrapperPosition = element[0].offsetTop - (((rowsToTarget + groups.length) * groupingRowHeight) - hiddenGroupingRowsOffset);
            let scrollPosition = wrapperPosition;

            if (isVirtual) {
                if (previouslyScrolledItems && previouslyScrolledItems[id]) {
                    const scrollerPosition = Math.floor(that.virtualScrollable.verticalScrollbar.scrollTop());
                    const prevScrollDown = Math.floor(previouslyScrolledItems[id].scrollingDownOffset);
                    const prevScrollUp = Math.floor(previouslyScrolledItems[id].scrollingUpOffset);

                    if (scrollerPosition === prevScrollUp || scrollerPosition === prevScrollDown) {
                        return;
                    }

                    that._scrollingUp = scrollerPosition > scrollPosition;

                    if (that._scrollingUp) {
                        scrollPosition = prevScrollUp ?? scrollPosition;
                    } else {
                        scrollPosition = prevScrollDown ?? scrollPosition;
                    }
                }

                if (that._scrollOffset) {
                    if (!that._scrollingUp) {
                        scrollPosition += that._scrollOffset;
                    } else {
                        if (that._scrollOffset === wrapperPosition) {
                            that._scrollOffset += rowHeight;
                        }
                        scrollPosition = ((wrapperPosition - that.virtualScrollable._scrollTop) + that._scrollOffset);
                    }
                }
                that.virtualScrollable._scrollTo(wrapperPosition, scrollPosition);

                if (!previouslyScrolledItems[id]) {
                    previouslyScrolledItems[id] = {};
                }

                if (that._scrollingUp) {
                    if (previouslyScrolledItems[id] && !previouslyScrolledItems[id].scrollingUpOffset) {
                        previouslyScrolledItems[id].scrollingUpOffset = scrollPosition;
                    }
                } else {
                    if (previouslyScrolledItems[id] && !previouslyScrolledItems[id].scrollingDownOffset) {
                        previouslyScrolledItems[id].scrollingDownOffset = scrollPosition;
                    }
                }
            } else {
                scrollableContainer.scrollTop(scrollPosition);
            }

            if (that.virtualScrollable) {
                if (that._scrollOffset) {
                    delete that._scrollOffset;
                }
                if (that._scrollingUp) {
                    delete that._scrollingUp;
                }
            }

            that._scrolledItems = previouslyScrolledItems;
        },

        current: function(next) {
            return this._setCurrent(next, true);
        },

        _setCurrent: function(next, preventTrigger, preventScroll, skipFocus) {
            var current = this._current;

            next = $(next);

            if (current && next && current.length && next.length && current.closest(".k-filter-row").length > 0 && next.closest(".k-filter-row").length === 0) {
                this._filterFocusable().attr(TABINDEX, -1);
            }

            if (next.length) {
                if (!current || current[0] !== next[0]) {
                    var parent = next.parent();
                    var siblings = parent.children(DATA_CELL);
                    var colspan = parseInt(parent.children().first().attr("colspan"), 10);

                    if (this._hasVirtualColumns()) {
                        this._virtualCellIndex = (colspan > 1 ? colspan : 0) + siblings.index(next);
                    }
                    this._updateCurrentAttr(current, next, skipFocus);

                    if (!preventScroll) {
                        this._scrollCurrent();
                    }

                    if (!preventTrigger) {
                        this.trigger(NAVIGATE, {
                            element: next
                        });
                    }
                }
            }

            if (next && next.length) {
                this._lastCellIndex = next.parent().children(".k-group-cell, .k-grid-stack-content," + DATA_CELL_HIDDENINCLUDED).index(next);
            }

            this._updateSelctCheckbox(current, next);

            return this._current;
        },

        _removeCurrent: function() {
            if (this._current) {
                this._current.removeClass(FOCUSED);
                this._current = null;
            }
        },

        _updateSelctCheckbox: function(current, next) {
            var nextCheckbox;

            if (next && next.length) {
                nextCheckbox = next.find(".k-select-checkbox");

                if (nextCheckbox.length > 0) {
                    nextCheckbox.trigger("focus");
                } else if (current && current.find(".k-select-checkbox").length > 0) {
                    focusTable(this.table, true);
                }
            }
        },

        _scrollTo: function(element, container) {
            var elementToLowercase = element.tagName.toLowerCase();
            var isHorizontal = elementToLowercase === "td" || elementToLowercase === "th";
            var table = $(element).closest("table")[0];
            var elementOffsetDir = element[isHorizontal ? "offsetWidth" : "offsetHeight"];
            var containerScroll = container[isHorizontal ? "scrollLeft" : "scrollTop"];
            var containerOffsetDir = container[isHorizontal ? "clientWidth" : "clientHeight"];
            var elementOffset = $(element).css("position") === "relative" && isRtl && isHorizontal ? Math.abs(table.offsetLeft - element.offsetLeft) : element[isHorizontal ? "offsetLeft" : "offsetTop"];
            var bottomDistance = elementOffset + elementOffsetDir;
            var result = 0;
            var ieCorrection = 0;
            var firefoxCorrection = 0;

            if (isRtl && isHorizontal) {
                if (browser.msie || browser.edge) {
                    ieCorrection = table.offsetLeft;
                } else if (browser.mozilla || (browser.webkit && (browser.version > 85))) {
                    firefoxCorrection = table.offsetLeft - kendo.support.scrollbar();
                }
            }

            containerScroll = Math.abs(containerScroll + ieCorrection - firefoxCorrection);

            if (containerScroll > elementOffset) {
                result = elementOffset;
            } else if (bottomDistance > (containerScroll + containerOffsetDir)) {
                if (elementOffsetDir <= containerOffsetDir) {
                    result = (bottomDistance - containerOffsetDir);
                } else {
                    result = elementOffset;
                }
            } else {
                result = containerScroll;
            }

            result = Math.abs(result + ieCorrection) + firefoxCorrection;

            container[isHorizontal ? "scrollLeft" : "scrollTop"] = result;
        },

        _navigatable: function() {
            var that = this;

            if (!that.options.navigatable) {
                return;
            }

            const stacked = that._isStackedMode();

            //data tables - locked and non-locked
            var dataTables = that.table.add(that.lockedTable);
            //header tables - locked and non-locked
            var headerTables = !stacked && that.thead.parent().add($(">table", that.lockedHeader));

            //the over wich keys will be handled
            var tables = dataTables;

            if (that.options.scrollable) {
                //add the header table when the widget is scrollable
                tables = tables.add(headerTables);
            }

            this._navigatableTables = tables;

            if (headerTables) {
                this._headertables = headerTables;
            }

            //dettach all previous events
            tables.off(MOUSEDOWN + NS + " focus" + NS + " focusout" + NS + " keydown" + NS);

            if (headerTables) {
                headerTables
                    .find("a.k-link").attr("tabIndex", -1);
            }

            //prevent propagation when clicked inside detail grid
            dataTables
                .on("keydown" + NS, ".k-detail-cell", function(e) {
                    if (e.target !== e.currentTarget) {
                        e.stopImmediatePropagation();
                    }
                });

            tables
                //handle click on tables, will attempt to focus the table
                .on((kendo.support.touch ? "touchstart" + NS : MOUSEDOWN + NS), NAVROW + ">" + NAVCELL, tableClick.bind(that))
                .on("focus" + NS, that._tableFocus.bind(that))
                .on("focusout" + NS, that._tableBlur.bind(that))
                .on("keydown" + NS, that, that._tableKeyDown.bind(that));

            that._filterFocusable().on("focus", that._filterFocus.bind(that));
        },

        _filterFocus: function(e) {
            var header = e.target.closest("th");

            this._filterFocusable().attr(TABINDEX, 0);
            this._setCurrent(header);
            $(header).removeClass(FOCUSED);
        },

        _tableFocus: function() {
            var current = this.current();
            var table = this.lockedTable ? this.lockedTable : this.table;

            //if there is already current, highlighted it
            //otherwise highlight the first possible cell
            if (current && current.is(":visible")) {
                current.addClass(FOCUSED);
            } else {
                if (this._virtualColScroll) {
                    this._setCurrent(table.find(NAVROW).first().children(NAVCELL).first(), true, true);
                } else {
                    this._setCurrent(table.find(NAVROW).first().children(NAVCELL).first());
                }
            }

            this.table.attr(TABINDEX, 0);
        },

        _tableBlur: function() {
            var current = this.current();

            if (current) {
                current.removeClass(FOCUSED);
            }
        },

        _findCellIndex: function(columns, startIndex, reversed) {
            var cellIndex;
            var i;

            if (reversed) {
                for (i = startIndex; i >= 0; i--) {
                    cellIndex = i;
                    if (!columns[i].hidden) {
                        break;
                    }
                }
            } else {
                for (i = startIndex; i < columns.length; i++) {
                    cellIndex = i;
                    if (!columns[i].hidden) {
                        break;
                    }
                }
            }

            return cellIndex;
        },

        _scrollToColumn: function(key, e) {
            if (this._virtualCellIndex === undefined$1) {
                return false;
            }

            var that = this;
            var cellIndex = that._virtualCellIndex;
            var leafsCols = leafColumns(nonLockedColumns(that.columns));
            var scrollWidth = 0;

            if (key == (isRtl ? keys.LEFT : keys.RIGHT) && (cellIndex !== leafsCols.length - 1)) {
                cellIndex = that._findCellIndex(leafsCols, cellIndex + 1);
            } else if (key == (isRtl ? keys.RIGHT : keys.LEFT) && cellIndex) {
                cellIndex = that._findCellIndex(leafsCols, cellIndex - 1, true);
            } else if (key == keys.HOME) {
                cellIndex = that._findCellIndex(leafsCols, 0);
            } else if (key == keys.END) {
                cellIndex = that._findCellIndex(leafsCols, leafsCols.length - 1, true);
            }

            for (var i = 0; i < cellIndex; i++) {
                scrollWidth += leafsCols[i].width;
            }

            that._virtualCellIndex = cellIndex;
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }

            let scrollable = that.content;
            if (that._hasVirtualRows() && that._hasVirtualColumns()) {
                scrollable = that.virtualScrollable.wrapper;
            }
            kendo.scrollLeft(scrollable, scrollWidth);
            return true;
        },

        _tableKeyDown: function(e) {
            let current = this.current(),
                currentTable = current && current.closest(DOT + "k-grid-table")[0],
                virtualScroll = this.virtualScroll || {},
                requestInProgress = this.virtualScrollable && this.virtualScrollable.fetching(),
                target = $(e.target),
                canHandle = !e.isDefaultPrevented() && (!target.is(":button,a,:input:not(.k-select-checkbox),a>.k-icon,a>.k-svg-icon") || this._isFocusableGridElement(current));

            if (e.altKey && e.keyCode == keys.DOWN) {
                this.current().find(".k-grid-filter-menu, .k-grid-column-menu").click();
                e.stopImmediatePropagation();
                return;
            }

            // do not handle key down if request in progress
            // or there isn't current set
            if (requestInProgress) {
                // swallow key events while in progress
                e.preventDefault();
                return;
            }

            if (virtualScroll.columns && (!current || !document.body.contains(current[0])) && (this._scrollToColumn(e.keyCode, e))) {
                return;
            }

            if (!current) {
                current = $(this.lockedTable).add(this.options.scrollable ? this.table : this.tbody).find(NAVROW).first().children(NAVCELL).first();
            }

            if (!current.length) {
                return;
            }

            var handled = false;

            if (!e.isDefaultPrevented() && e.keyCode === keys.F10) {
                handled = this._focusToolbar();
            }

            if (canHandle && e.keyCode == keys.UP) {
                handled = this._moveUp(current, e.shiftKey, e.ctrlKey);
            }

            if (canHandle && e.keyCode == keys.DOWN) {
                handled = this._moveDown(current, e.shiftKey, e.ctrlKey);
            }

            if (canHandle && e.keyCode == (isRtl ? keys.LEFT : keys.RIGHT)) {
                handled = this._moveRight(current, e.altKey, e.shiftKey, e.ctrlKey, currentTable);
            }

            if (canHandle && e.keyCode == (isRtl ? keys.RIGHT : keys.LEFT)) {
                handled = this._moveLeft(current, e.altKey, e.shiftKey, e.ctrlKey, currentTable);
            }

            if (canHandle && e.keyCode == keys.PAGEDOWN) {
                handled = this._handlePageDown();
            }

            if (canHandle && e.keyCode == keys.PAGEUP) {
                handled = this._handlePageUp();
            }

            if (canHandle && e.keyCode == keys.HOME) {
                handled = this._handleHome(current, e.ctrlKey);
            }

            if (canHandle && e.keyCode == keys.END) {
                handled = this._handleEnd(current, e.ctrlKey);
            }

            if (canHandle && e.keyCode == keys.SPACEBAR) {
                handled = this._handleSpaceKey(current, e.ctrlKey);
            }

            if (e.keyCode == keys.ENTER || e.keyCode == keys.F2) {
                handled = this._handleEnterKey(current, currentTable, target, e.keyCode == keys.F2);
            }

            if (e.keyCode == keys.ESC) {
                handled = this._handleEscKey(current);
            }

            if (e.keyCode == keys.TAB) {
                handled = this._handleTabKey(current, currentTable, e.shiftKey, target);
            }

            if (e.keyCode === keys.DELETE || e.keyCode === keys.BACKSPACE) {
                handled = this._handleDeletion(e);
            }

            if (handled) {
                //prevent scrolling while pressing the keys
                e.preventDefault();
                //required in hierarchy
                e.stopPropagation();
            }
        },

        _focusToolbar: function() {
            var focusable = this.wrapper.find(".k-grid-toolbar [tabindex=0]");

            if (focusable.length > 0) {
                focusable.first().addClass(".k-focus").trigger("focus");

                return true;
            }

            return false;
        },

        _focusFocusable: function(current, next, preventTrigger, preventScroll, eventData) {
            let focusable = this._isFocusableGridElement(next) && next.find(FOCUSABLE);

            if (!focusable || !focusable.length) {
                if (next.is(FOCUSABLE)) {
                    focusable = next;
                }
            }

            // If we have focused a focusable element inside a cell with multiple focusable elements,
            // we should not be able to use the arrows to navigate to another cell.
            if ((this._containerHasActiveElement(current) && current.find(FOCUSABLE).length !== 1) || !next.length) {
                return;
            }

            focusTable(this.table, true);
            this._setCurrent(next, preventTrigger, preventScroll);
            if (focusable.length === 1 && !focusable.is("table")) {
                focusable.trigger("focus");
                eventData?.preventDefault();
            }
        },

        _containerHasActiveElement: function(container) {
            return container.find(activeElement()).length;
        },

        _isFocusableGridElement: function(element) {
            if (!element) {
                return false;
            }

            return element.is(FOCUSABLE_GRID_ELEMENT_SELECTORS) || element.has(FOCUSABLE_GRID_ELEMENT_SELECTORS).length;
        },

        _moveLeft: function(current, altKey, shiftKey, ctrlKey, currentTable) {
            var next, index;
            var row = current.parent();
            //thead or tbody
            var container = row.parent();

            if (altKey) {
                if (row.hasClass(GROUPING_ROW)) {
                    this.collapseGroup(row);
                } else {
                    this.collapseRow(row);
                }
            } else if (ctrlKey && current.is(DOT + HEADER_CLASS) && this.options.reorderable) {
                this._moveColumn(current, true);
            } else {
                index = container.find(NAVROW).index(row);
                next = this._prevHorizontalCell(container, current, index);

                if (!next[0] && !this._containerHasActiveElement(current)) {
                    if (shiftKey) {
                        if (this.lockedTable) {
                            next = this._relatedRow(row);
                            if ($.contains(this.lockedTable[0], row[0])) {
                                next = next.prevAll(ITEMROW).first();
                            }
                            next = next.children(DATA_CELL).last();
                        } else {
                            next = this._tabNext(current, currentTable, true);
                        }
                    } else {
                        container = this._horizontalContainer(container);

                        next = this._prevHorizontalCell(container, current, index);

                        if (next[0] !== current[0]) {
                            focusTable(this.table, true);
                        }
                    }
                }
                this._focusFocusable(current, next);
            }

            return true;
        },

        _moveRight: function(current, altKey, shiftKey, ctrlKey, currentTable) {
            var next, index;
            var row = current.parent();
            //thead or tbody
            var container = row.parent();

            if (altKey) {
                if (row.hasClass(GROUPING_ROW)) {
                    this.expandGroup(row);
                } else {
                    this.expandRow(row);
                }
            } else if (ctrlKey && current.is(DOT + HEADER_CLASS) && this.options.reorderable) {
                this._moveColumn(current, false);
            } else {
                index = container.find(NAVROW).index(row);
                next = this._nextHorizontalCell(container, current, index);

                if (!next[0] && !this._containerHasActiveElement(current)) {
                    if (shiftKey) {
                        if (this.lockedTable) {
                            next = this._relatedRow(row);
                            if ($.contains(this.table[0], row[0])) {
                                next = next.nextAll(ITEMROW).first();
                            }
                            next = next.children(DATA_CELL).first();
                        } else {
                            next = this._tabNext(current, currentTable, false);
                        }
                    } else {
                        container = this._horizontalContainer(container, true);

                        next = this._nextHorizontalCell(container, current, index);

                        if (next[0] !== current[0]) {
                            focusTable(this.table, true);
                        }
                    }
                }
                this._focusFocusable(current, next);
            }

            return true;
        },

        _moveUp: function(current, shiftKey, ctrlKey) {
            //thead or tbody
            var container = current.parent().parent();
            var next, cellIndex, index, oldIndex;

            if (shiftKey) {
                next = current.parent();
                next = next.prevAll(ITEMROW).first();
                next = current.parent().is(ITEMROW) ? next.children().eq(current.index()) : next.children(DATA_CELL).last();
            } else if (ctrlKey && current.parent().is(ITEMROW) && this._hasReorderableRows()) {
                cellIndex = current.index();
                next = current.parent();
                next = next.prevAll(ITEMROW).first();
                index = this.tbody.children(ITEMROW).index(next);
                oldIndex = this.tbody.children(ITEMROW).index(current.parent());

                if (index >= 0 && !this.trigger(ROWREORDER, { oldIndex: oldIndex, newIndex: index, row: current.parent() })) {
                    this.reorderRows(current.parent(), index);
                    next = this.tbody.children(ITEMROW).eq(index).children().eq(cellIndex);
                }
            } else {
                next = this._prevVerticalCell(container, current);
                if (!next[0]) {
                    this._lastCellIndex = 0;
                    container = this._verticalContainer(container, true);

                    next = this._prevVerticalCell(container, current);

                    if (next.is(":hidden")) {
                        next = next.nextAll().not(":hidden").first();
                    }

                    if (next[0]) {
                        focusTable(this.table, true);
                    }
                }
            }

            var tmp = this._lastCellIndex || 0;

            if (!this._isStackedMode()) {
                this._focusFocusable(current, next);
            } else {
                focusTable(this.table, true);
                this._setCurrent(next);
            }

            this._lastCellIndex = tmp;

            return true;
        },

        _moveDown: function(current, shiftKey, ctrlKey) {
            //thead or tbody
            var container = current.parent().parent();
            var next, cellIndex, index, oldIndex;

            if (shiftKey) {
                next = current.parent();
                next = next.nextAll(ITEMROW).first();
                next = current.parent().is(ITEMROW) ? next.children().eq(current.index()) : next.children(DATA_CELL).first();
            } else if (ctrlKey && current.parent().is(ITEMROW) && this._hasReorderableRows()) {
                cellIndex = current.index();
                next = current.parent();
                next = next.nextAll(ITEMROW).first();
                index = this.tbody.children(ITEMROW).index(next);
                oldIndex = this.tbody.children(ITEMROW).index(current.parent());

                if (index >= 0 && !this.trigger(ROWREORDER, { oldIndex: oldIndex, newIndex: index, row: current.parent() })) {
                    this.reorderRows(current.parent(), index + 1);
                    next = this.tbody.children(ITEMROW).eq(index).children().eq(cellIndex);
                }
            } else {
                next = this._nextVerticalCell(container, current);
                if (!next[0]) {
                    this._lastCellIndex = 0;
                    container = this._verticalContainer(container);

                    next = this._nextVerticalCell(container, current);
                    if (next[0]) {
                        focusTable(this.table, true);
                    }
                }
            }
            var tmp = this._lastCellIndex || 0;
            if (!this._isStackedMode()) {
                this._focusFocusable(current, this._findVisibleCell(next));
            } else {
                focusTable(this.table, true);
                this._setCurrent(this._findVisibleCell(next));
            }
            this._lastCellIndex = tmp;
            return true;
        },

        _moveColumn: function(current, isLeft) {
            var elements = this.wrapper.data().kendoReorderable.element.find(this._draggableInstance.options.filter + ":visible");

            var columns = visibleColumns(flatColumnsInDomOrder(this.columns));
            var oldIndex = elements.index($(current));
            var offset = isLeft ? -1 : 1;
            var column = columns[oldIndex];
            var newIndex = targetParentContainerIndex(columns, this.columns, oldIndex, oldIndex + offset);
            if (newIndex >= 0) {
                this.reorderColumn(newIndex, column, isLeft);
                this.trigger(COLUMNREORDER, {
                    newIndex: newIndex,
                    oldIndex: oldIndex,
                    column: column
                });
            }
        },

        _handleHome: function(current, ctrl) {
            const that = this;
            let row = current.parent();
            const rowContainer = row.parent();
            const isInLockedTable = that.lockedTable && that.lockedTable.children("tbody")[0] === rowContainer[0];
            const isInBody = rowContainer[0] === that.tbody[0];
            let prev;

            const hasVirtualColumns = that._hasVirtualColumns();
            const hasVirtualRows = that._hasVirtualRows();
            const scrollable = hasVirtualRows ? that.virtualScrollable.wrapper : that.content;
            const isScrolledToStart = scrollable.scrollLeft() === 0;


            if (hasVirtualColumns && hasVirtualRows && ctrl) {
                that._focusVirtualCell(true, hasVirtualColumns && !isScrolledToStart);

                return true;
            }

            if (hasVirtualColumns) {
                if (isScrolledToStart) {
                    that._setCurrent(that.table.find(ITEMROW).first().children(NAVCELL).first());
                } else {
                    that._forceScrollVirtualColumn(keys.HOME, ctrl);
                }

                return true;
            }

            if (hasVirtualRows && ctrl) {
                that._focusVirtualCell(true);

                return true;
            }

            if (ctrl) {
                if (that.lockedTable) {
                    prev = that.lockedTable.find(ITEMROW).first().children(NAVCELL).first();
                } else {
                    prev = that.table.find(ITEMROW).first().children(NAVCELL).first();
                }
            } else if (isInBody || isInLockedTable) {
                if (isInBody && this.lockedTable) {
                    row = that._relatedRow(row);
                }
                prev = row.children(DATA_CELL).first();
            }

            if (prev && prev.length) {
                that._setCurrent(prev);
                return true;
            }
        },


        _setCurrentVirtualCell: function(focusFirst) {
            const that = this;

            if (focusFirst) {
                this._setCurrent(that.table.find(ITEMROW).first().children(NAVCELL).first());
            } else {
                this._setCurrent(that.table.find(ITEMROW).last().children(NAVCELL).last());
            }
        },

        _forceScrollVirtualColumn: function(key, condition, setboth) {
            const that = this;

            if (setboth) {
                that._shouldFocusInLastRow = !condition;
                that._shouldFocusInFirstRow = condition;
            } else if (key === keys.HOME) {
                that._shouldFocusInFirstRow = condition;
            } else {
                that._shouldFocusInLastRow = condition;
            }

            that.one(DATABOUND, function() {
                if (setboth) {
                    that.one(DATABOUND, function() {
                        that._setCurrentVirtualCell(condition);
                    });
                }

                if (that._shouldFocusInLastRow) {
                    that.content.scrollTop(that.content[0].scrollHeight);
                    delete that._shouldFocusInLastRow;
                }
                if (that._shouldFocusInFirstRow) {
                    that.content.scrollTop(0);
                    delete that._shouldFocusInFirstRow;
                }
            });

            that._scrollToColumn(key);
        },


        _focusVirtualCell: function(first, scrollColumn) {
            const that = this;
            const scrollbar = this.virtualScrollable.verticalScrollbar;
            const isScrolledToBottom = Math.ceil(scrollbar.scrollTop() + scrollbar.innerHeight()) >= scrollbar[0].scrollHeight;
            const isScrollToTop = this.virtualScrollable.verticalScrollbar.scrollTop() === 0;
            const scrollbarCondition = first ? isScrollToTop : isScrolledToBottom;
            const key = first ? keys.HOME : keys.END;

            if (scrollbarCondition) {
                if (scrollColumn) {
                    that._forceScrollVirtualColumn(key, first, true);
                } else {
                    that._setCurrentVirtualCell(first);
                }
            } else {
                if (that.dataSource.group().length === 0) {
                    that.virtualScrollable._alwaysScrollTop = true;
                }

                const scrollPosition = first ? 0 : scrollbar[0].scrollHeight;

                that.one(DATABOUND, function() {
                    if (scrollColumn) {
                        that._forceScrollVirtualColumn(key, first, true);
                    } else {
                        that._setCurrentVirtualCell(first);

                        if (that._shouldFocusInLastRow) {
                            delete that._shouldFocusInLastRow;
                        }
                        if (that._shouldFocusInFirstRow) {
                            delete that._shouldFocusInFirstRow;
                        }
                    }
                });
                scrollbar.scrollTop(scrollPosition);
                scrollbar.trigger(SCROLL);
            }
        },

        _handleEnd: function(current, ctrl) {
            const that = this;
            let row = current.parent();
            const rowContainer = row.parent();
            const isInLockedTable = that.lockedTable && that.lockedTable.children("tbody")[0] === rowContainer[0];
            const isInBody = rowContainer[0] === that.tbody[0];
            let next;

            const hasVirtualColumns = that._hasVirtualColumns();
            const hasVirtualRows = that._hasVirtualRows();
            const scrollable = hasVirtualRows ? that.virtualScrollable.wrapper : that.content;
            const isScrolledToEnd = (scrollable.scrollLeft() + scrollable.innerWidth()) >= scrollable[0].scrollWidth;

            if (hasVirtualColumns && hasVirtualRows && ctrl) {
                that._focusVirtualCell(false, hasVirtualColumns && !isScrolledToEnd);

                return true;
            }

            if (hasVirtualColumns) {
                if (isScrolledToEnd) {
                    that._setCurrent(that.table.find(ITEMROW).last().children(NAVCELL).last());
                } else {
                    that._forceScrollVirtualColumn(keys.END, ctrl);
                }

                return true;
            }

            if (hasVirtualRows && ctrl) {
                that._focusVirtualCell(false);

                return true;
            }

            if (ctrl) {
                next = that.table.find(ITEMROW).last().children(NAVCELL).last();
            } else if (isInBody || isInLockedTable) {
                if (!isInBody && this.lockedTable) {
                    row = that._relatedRow(row);
                }
                next = row.children(DATA_CELL).last();
            }

            if (next && next.length) {
                that._setCurrent(next);
                return true;
            }
        },

        _handlePageDown: function() {
            if (!this.options.pageable) {
                return false;
            }

            this.dataSource.page(this.dataSource.page() + 1);

            return true;
        },

        _handlePageUp: function() {
            if (!this.options.pageable) {
                return false;
            }

            this.dataSource.page(this.dataSource.page() - 1);

            return true;
        },

        _handleTabKey: function(current, currentTable, shiftKey, target) {
            const isInCell = this.options.editable && this._editMode() == "incell";
            let cell = $(activeElement()).closest(".k-grid-stack-edit-cell,.k-edit-cell");
            let filterFocusable;

            const stacked = this._isStackedMode();
            const isTargetFocusable = target.is(FOCUSABLE);
            const isTargetNotTable = !target.is("table");
            const focusStackedCell = stacked && target.is(".k-grid-stack-cell");
            const stackedParent = !focusStackedCell && target.closest(".k-grid-stack-cell");
            const isCurrentFocusableGridElement = this._isFocusableGridElement(current);
            const isNotInEditMode = !isInEdit(current);
            const initialTarget = target;

            let hasMultipleFocusableElements;

            if (stacked) {
                if (focusStackedCell) {
                    hasMultipleFocusableElements = target.parent().find(".k-grid-stack-cell").length > 1;
                } else if (stackedParent && stackedParent.length) {
                    hasMultipleFocusableElements = stackedParent.find(FOCUSABLE).length > 1;
                }
            } else {
                hasMultipleFocusableElements = current.find(FOCUSABLE).length > 1;
            }

            if (!cell[0] && isTargetFocusable && isTargetNotTable && hasMultipleFocusableElements && isCurrentFocusableGridElement && isNotInEditMode) {
                if (!stacked && ((target.is(":last-child") && !shiftKey) || (target.is(":first-child") && shiftKey))) {
                    focusTable(this.table, true);
                    return true;
                }

                if (shiftKey) {
                    target = target.prev(FOCUSABLE);
                } else {
                    target = target.next(FOCUSABLE);
                }

                if (focusStackedCell && !target.length) {
                    const focusableSiblings = initialTarget.parent().find(".k-grid-stack-cell");

                    if (shiftKey && initialTarget.is(":first-child")) {
                        target = focusableSiblings.last();
                    }
                    if (!shiftKey && initialTarget.is(":last-child")) {
                        target = focusableSiblings.first();
                    }
                } else if (!target.length && !focusStackedCell) {
                    const closestStackedCell = initialTarget.closest(".k-grid-stack-cell");

                    if (shiftKey && initialTarget.is(":first-child")) {
                        target = closestStackedCell;
                    }
                    if (!shiftKey && initialTarget.is(":last-child")) {
                        target = closestStackedCell.find(FOCUSABLE).first();
                    }
                }

                if (stacked && target.is(".k-grid-stack-cell")) {
                    this._currentStackedCell(target, true);
                } else {
                    target.trigger("focus");
                }

                return true;
            }

            const stackedCondition = stacked && !focusStackedCell && !cell[0];
            if (stackedCondition || !isInCell ||
                current.is("th") ||
                (this.options.scrollable ? (this._headertables && this._headertables.filter(currentTable).length) : (this.thead && this.thead.filter(target).length))) {
                if (current.parent().hasClass("k-filter-row")) {
                    filterFocusable = this._filterFocusable();

                    if (!shiftKey && filterFocusable[filterFocusable.length - 1] === document.activeElement) {
                        filterFocusable.first().trigger("focus");

                        return true;
                    } else if (shiftKey && filterFocusable[0] === document.activeElement) {
                        filterFocusable.last().trigger("focus");

                        return true;
                    }
                }

                return false;
            }

            if (cell[0] && cell[0] !== current[0]) {
                current = cell;
            }

            cell = this._tabNext(current, currentTable, shiftKey);

            if (cell[0] === current[0]) {
                return false;
            }

            if (cell.length) {
                this._handleEditing(current, cell, cell.closest("table"));

                return true;
            }

            return false;
        },

        _handleDeletion: function(e) {
            const that = this;
            const current = that.current();
            const activeElementInstance = $(activeElement());
            const stackedCondition = !that._isStackedMode() ? !activeElementInstance.is("table") : !that._currentStackedCell();
            const editable = that._isEditableEnabled !== undefined$1 ? that._isEditableEnabled && that.options.editable : that.options.editable;

            if (!editable || isInEdit(current) || stackedCondition || !current.closest("tbody").length || !current.closest(".k-master-row").length) {
                return false;
            }

            that._removeCommandClick({ currentTarget: current, preventDefault: e.preventDefault, stopPropagation: e.stopPropagation });

            return true;
        },

        _handleEscKey: function(current) {
            const active = activeElement();
            const isInCell = this._editMode() == "incell";
            const stacked = this._isStackedMode();
            const activeElementInstance = $(active);
            const stackedParent = !activeElementInstance.is(".k-grid-stack-cell") ? activeElementInstance.closest(".k-grid-stack-cell") : $();
            const cell = stacked ? activeElementInstance : current;
            const targetIsInsideStackedCell = stackedParent && stackedParent.length > 0;
            const isStackedCell = stacked && cell.is(".k-grid-stack-cell");

            if (!isInEdit(stackedParent.length ? stackedParent : cell)) {
                if (isStackedCell || (!targetIsInsideStackedCell && current.has(active).length && !(this._isFocusableGridElement(current) && current.find(FOCUSABLE).length === 1))) {
                    // return focus back to the table
                    focusTable(this.table, true);
                    delete this._activeStackedCell;
                    return true;
                }

                if (targetIsInsideStackedCell) {
                    stackedParent.trigger("focus");
                    return true;
                }

                if (current.parent().hasClass("k-filter-row")) {
                    this._filterFocusable().attr(TABINDEX, -1);
                    focusTable(this.table, true);

                    return true;
                }

                return false;
            }

            if (isInCell) {
                this.closeCell(true);
                if (stacked && targetIsInsideStackedCell) {
                    addElementsToTab(stackedParent.parent().children(".k-grid-stack-cell"));
                    this._currentStackedCell(stackedParent, true);
                }
            } else {
                var currentIndex = $(current).closest(TR).index();
                if (active) {
                    active.blur();
                }
                this.cancelRow(true);
                if (currentIndex >= 0) {
                    const lastActiveStackedCell = this._currentStackedCell();

                    if (stacked && lastActiveStackedCell) {
                        const cell = this.tbody
                            .find(TR)
                            .eq(currentIndex)
                            .find(".k-grid-stack-cell")
                            .eq(lastActiveStackedCell.index);
                        this._setCurrentStackedCell(cell);
                    } else {
                        const target = this.items().eq(currentIndex).children(NAVCELL).first();
                        this._setCurrent(target);
                    }
                }
            }

            if (!stacked) {
                focusTable(this.table, true);
            }

            return !stacked;
        },

        _toggleCurrent: function(current, editable, hasDetails) {
            const that = this;
            const row = current.parent();

            if (current.is(".k-command-cell")) {
                return false;
            }

            if (row.is(".k-filter-row")) {
                return false;
            }

            if (row.is(DOT + GROUPING_ROW)) {
                row.find(".k-icon,.k-svg-icon").first().click();

                return true;
            }

            if (!editable && hasDetails) {
                const selector = that._isStackedMode() ? `[ref="expand-detail-button"], [ref="collapse-detail-button"]` : ".k-icon,.k-svg-icon";
                row.find(selector).first().click();

                return true;
            }

            return false;
        },

        _handleSpaceKey: function(current, ctrlKey) {
            var that = this;

            if (!ctrlKey || !that.groupable || !current.hasClass(HEADER_CLASS)) {
                return;
            }
            var descriptors = that.groupable.descriptors();
            var field = current.attr(kendo.attr("field"));
            var aggregates = that.groupable.aggregates();

            if (that.groupable._canDrag(current)) {
                descriptors.push({
                    field: field,
                    dir: "asc",
                    aggregates: aggregates || []
                });
            } else {
                descriptors = $.grep(descriptors, function(item) {
                    return item.field !== field;
                });
            }

            that.dataSource.group(descriptors);

            return true;
        },

        _hasStackedModeDetailsButton: function(cell) {
            return cell.find(`[ref="expand-detail-button"], [ref="collapse-detail-button"]`).length > 0;
        },

        _currentStackedCell: function(current, triggerFocus) {
            const that = this;

            if (!current || !current.length) {
                return that._activeStackedCell;
            }

            that._activeStackedCell = {
                cell: current,
                index: current.index(),
            };

            if (triggerFocus && current.length) {
                current.trigger("focus");
            }

        },

        _handleEnterKey: function(current, currentTable, target, isF2) {
            const that = this;

            var editable = this.options.editable && this.options.editable.update !== false;
            var container = target.closest("td");
            var hasDetails = this._hasDetails();
            var link, filterFocusable;

            const stacked = that._isStackedMode();
            const skipToEditing = stacked && isF2 && that._editMode() !== "incell";
            const editClass = stacked ? "k-grid-stack-edit-cell" : "k-edit-cell";
            const focusIsInStackedCell = stacked && (target.is(".k-grid-stack-cell") || target.parent().is(".k-grid-stack-cell") || target.closest(".k-grid-stack-cell").length > 0);


            if (!target.is("table") && !$.contains(current[0], target[0])) {
                current = container;
            }

            if (current.is("th")) {
                // sort the column, if possible
                link = current.find(".k-link");

                if (current.has($(activeElement())).length > 0) {
                    return false;
                } else if (link.length) {
                    link.click();
                } else if (current.parent().hasClass("k-filter-row")) {
                    filterFocusable = this._filterFocusable();
                    filterFocusable.attr(TABINDEX, 0);
                    current.find(":kendoFocusable").first().trigger("focus");
                } else {
                    current.find(CHECKBOXINPUT).trigger("focus");
                }

                return true;
            }

            if (!skipToEditing) {
                 if (!focusIsInStackedCell && this._toggleCurrent(current, editable, hasDetails)) {
                    return true;
                }

                if (focusIsInStackedCell && that._hasStackedModeDetailsButton(target)) {
                    this._toggleCurrent(current, false, true);
                    return true;
                }

                let focusableSelector = ":kendoFocusable";

                if (stacked && !focusIsInStackedCell) {
                    addElementsToTab(current.find(".k-grid-stack-cell"));
                }

                const focusableContainer = focusIsInStackedCell ? target : current;

                var focusable = focusableContainer.find(focusableSelector).first();
                if (focusable[0] && (focusIsInStackedCell || (!current.hasClass(editClass) && current.hasClass("k-focus")))) {
                    if (!focusIsInStackedCell) {
                        that._currentStackedCell(focusable, true);
                    } else {
                        focusable.trigger("focus");
                    }
                    return true;
                }
            }

            if (editable && !target.is(":button,.k-button,textarea")) {
                if (!container[0]) {
                    container = current;
                }

                if (stacked && target.is(".k-grid-stack-cell")) {
                    that._currentStackedCell(target);
                }

                if (focusIsInStackedCell) {
                    if (!target.is(".k-grid-stack-cell")) {
                        container = target.closest(".k-grid-stack-cell");
                    } else {
                        container = target;
                    }
                }

                this._handleEditing(container, false, currentTable);

                return true;
            }

            return false;
        },

        _nextHorizontalCell: function(table, current, originalIndex) {
            var cells = current.nextAll(DATA_CELL);

            if (!cells.length) {
                var rows = table.find(NAVROW);
                var rowIndex = rows.index(current.parent());

                //no sibling cells are found and we've changed the table
                if (rowIndex == -1) {
                    if (current.hasClass(HEADER_CLASS)) {
                        var headerRows = [];
                        mapColumnToCellRows([lockedColumns(this.columns)[0]], childColumnsCells(rows.eq(0).children(":visible").first()), headerRows, 0, 0);

                        if (headerRows[originalIndex]) {
                            return headerRows[originalIndex][0];
                        }

                        return current;
                    }

                    //current is in filter row
                    if (current.parent().hasClass("k-filter-row")) {
                        return rows.last().children(DATA_CELL).first();
                    }

                    //get the same row index in the new table
                    return this._findVisibleCell(rows.eq(originalIndex).children(DATA_CELL + ",[hidden]").first());
                }
            }

            return this._findVisibleCell(current.nextAll(DATA_CELL + ",[hidden]").eq(0));
        },

        _prevHorizontalCell: function(table, current, originalIndex) {
            var cells = current.prevAll(DATA_CELL);

            if (!cells.length) {
                var rows = table.find(NAVROW);
                var rowIndex = rows.index(current.parent());

                //no sibling cells are found and we've changed the table
                if (rowIndex == -1) {
                    if (current.hasClass(HEADER_CLASS)) {
                        var headerRows = [];
                        var columns = lockedColumns(this.columns);
                        mapColumnToCellRows([columns[columns.length - 1]], childColumnsCells(rows.eq(0).children().last()), headerRows, 0, 0);

                        if (headerRows[originalIndex]) {
                            return headerRows[originalIndex][0];
                        }

                        return current;
                    }

                    //current is in filter row
                    if (current.parent().hasClass("k-filter-row")) {
                        return rows.last().children(DATA_CELL).last();
                    }

                    //get the same row index in the new table
                    return rows.eq(originalIndex).children(DATA_CELL).last();
                }
            }

            cells = current.prevAll(DATA_CELL + ",[hidden]");
            let cellToFocus = this._findVisibleCell(cells.first());
            if (cellToFocus.is(".k-group-cell")) {
                return cellToFocus.next(DATA_CELL);
            }

            return cellToFocus;
        },

        _currentDataIndex: function(table, current) {
            var index = current.attr("data-index");

            if (!index) {
                return undefined$1;
            }

            var lockedColumnsCount = lockedColumns(this.columns).length;
            if (lockedColumnsCount && !table.closest(DIV).hasClass("k-grid-content-locked")[0]) {
                return index - lockedColumnsCount;
            }

            return index;
        },

        _findVisibleCell: function($cell) {
            var col = $cell.index();
            var row = $cell.closest('tr').index();
            var $newFocus;

            if ($cell.is('[hidden]')) {
                $newFocus = $cell.prevAll(':not([hidden])').first();
                var hiddenCount = $cell.prevUntil(':not([hidden])', '[hidden]').length;
                if (!$newFocus.attr('colspan') || ($newFocus.attr('colspan') > 1 && $newFocus.attr('colspan') <= hiddenCount + 1)) {
                    $newFocus = $cell.prevAll('[hidden]').last();
                    if ($newFocus.length === 0) {
                        return $cell.closest('tr').prevAll().find(`td:nth-of-type(${col + 1}):visible`).last();
                    }

                    while (!$newFocus.attr('rowspan') && !($newFocus.attr('rowspan') > 1 && $newFocus.attr('rowspan') != row - $newFocus.closest('tr').index()) && Math.abs($newFocus.index() - col) != $newFocus.attr('colspan')) {
                        $newFocus = $newFocus.closest('tr').prevAll().find('td, th').eq(col).first();
                        if ($newFocus.length === 0) {
                            $newFocus = $cell;
                            break;
                        }
                    }
                }
            } else {
                $newFocus = $cell;
            }

            return $newFocus;
        },

        _prevVerticalCell: function(container, current) {
            var cells;
            var row = current.parent();
            var rows = container.children(NAVROW);
            var rowIndex = rows.index(row);
            //get data-index in case of last level of multi-level columns
            var index = this._currentDataIndex(container, current);

            //current is in the header, but not at the last level of multi-level columns
            if (index || current.hasClass(HEADER_CLASS)) {
                cells = parentColumnsCells(current);
                return cells.eq(cells.length - 2);
            }

            //check this out
            index = Math.max(row.children(DATA_CELL_HIDDENINCLUDED).index(current), this._lastCellIndex || 0);

            //if current is inside filter row
            if (row.hasClass("k-filter-row")) {
                let offset = rows.last().children(".k-group-cell").length;

                return leafDataCells(container).filter(isCellVisible).eq(Math.max(0, index - offset));
            }

            //move up to header container
            if (rowIndex == -1) {
                if (this._hasVirtualColumns()) {
                    index = this._virtualCellIndex;
                }
                //is there filter row in the header container
                row = container.find("tr.k-filter-row:visible");
                if (!row[0]) {
                    // in hierarchical grid we need to correct the index
                    // since the k-hierarchy cell is navigatable
                    if ((this._hasDetails() || current.parent().find('.k-hierarchy-cell').length) && index) {
                        index--;
                    }

                    let offset = 0;
                    if (current.parent().is(".k-table-group-row")) {
                        offset = rows.last().children(".k-group-cell").length;
                    }

                    return leafDataCells(container).eq(Math.max(0, index - offset));
                } else {
                    if (this._hasDetails()) {
                        index--;
                    }
                }
            } else {
                row = rowIndex === 0 ? $() : rows.eq(rowIndex - 1);
            }

            cells = row.children(DATA_CELL_HIDDENINCLUDED);
            if (cells.length > index) {
                let nextCell = cells.eq(index);
                if (nextCell.is(".k-group-cell")) {
                    nextCell = nextCell.nextAll("td").not(".k-group-cell").not(":hidden").first();
                }

                return this._findVisibleCell(nextCell);
            }

            return cells.eq(0);
        },

        _nextVerticalCell: function(container, current) {
            var cells;
            var originalRow;
            var row = originalRow = current.closest(TR);
            var rows = container.children(NAVROW);
            var rowIndex = rows.index(row);
            //get data-index in case of last level of multi-level columns
            var index = this._currentDataIndex(container, current);
            var virtualScroll = this.virtualScroll || {};
            var colspan;
            //current is in the header, but not at the last level of multi-level columns
            //and we are not changing the table
            if (rowIndex != -1 && index === undefined$1 && current.hasClass(HEADER_CLASS)) {
                return childColumnsCells(current).eq(1);
            }

            index = index ? parseInt(index, 10) : row.children(DATA_CELL_HIDDENINCLUDED).index(current);
            index = Math.max(index, this._lastCellIndex || 0);

            //move down to data container
            if (rowIndex == -1) {
                row = rows.eq(0);
                if (virtualScroll.columns) {
                    colspan = parseInt(row.children().first().attr("colspan"), 10);
                    index = this._virtualCellIndex - (colspan > 1 ? colspan : 0);
                }
                // in hierarchical grid we need to correct the index
                // since the k-hierarchy cell is navigatable
                if (this._hasDetails() || row.find('.k-hierarchy-cell').length) {
                    index++;
                }

                if (row.hasClass("k-table-group-row")) {
                    index += originalRow.children(".k-group-cell").length;
                }
            } else {
                row = rows.eq(rowIndex + current[0].rowSpan);
            }

            cells = row.children(".k-group-cell," + DATA_CELL_HIDDENINCLUDED);

            let cellToFocus = cells.eq(0);
            if (cells.length > index) {
                cellToFocus = cells.eq(index);
            }

            if (cellToFocus.is(".k-group-cell")) {
                cellToFocus = cellToFocus.nextAll("td").not(".k-group-cell").not(":hidden").first();
            }

            return cellToFocus;
        },

        _verticalContainer: function(container, up) {
            var table = container.parent();
            var length = this._navigatableTables.length;
            var step = Math.floor(length / 2);
            var index = inArray(table[0], this._navigatableTables);

            if (up) {
                step *= -1;
            }
            index += step;

            if (index >= 0 || index < length) {
                table = this._navigatableTables.eq(index);
            }

            return table.find(up ? ">thead" : ">tbody");
        },

        _filterFocusable: function() {
            return this.wrapper.find(".k-filter-row").find(".k-dropdownlist, .k-input .k-input-inner:visible, input[type='radio']:visible, input[type='checkbox']:visible");
        },

        _horizontalContainer: function(container, right) {
            var length = this._navigatableTables.length;
            if (length <= 2) {
                return container;
            }

            var table = container.parent();
            var index = inArray(table[0], this._navigatableTables);

            index += right ? 1 : -1;

            if (right && (index == 2 || index == length)) {
                return container;
            }

            if (!right && (index == 1 || index < 0)) {
                return container;
            }

            return this._navigatableTables.eq(index).find("thead, tbody");
        },

        _tabNext: function(current, currentTable, back) {
            var switchRow = true;
            var next = back ? current.prevAll(DATA_CELL).first() : current.nextAll(":visible").first();

            if (!next.length) {
                next = current.parent();
                if (this.lockedTable) {
                    switchRow = (back && currentTable == this.lockedTable[0]) || (!back && currentTable == this.table[0]);
                    next = this._relatedRow(next);
                }

                if (switchRow) {
                    if (this._hasVirtualColumns()) {
                        return current;
                    }
                    next = next[back ? "prevAll" : "nextAll"]("tr:not(.k-grouping-row):not(.k-detail-row):visible").first();
                }
                if (back) {
                    next = next.children(DATA_CELL).last();
                } else {
                    next = next.children(DATA_CELL).first();
                }
            }

            return next;
        },

        _handleEditing: function(current, next, table) {
            var that = this,
                active = $(activeElement()),
                mode = that._editMode(),
                isIE = browser.msie,
                editContainer = that._editContainer,
                focusable,
                editable = that.options.editable && that.options.editable.update !== false,
                isEdited;

            const stacked = that._isStackedMode();
            const isStackedCell = current.is(".k-grid-stack-cell");

            table = $(table);
            if (mode == "incell") {
                const editClass = stacked ? "k-grid-stack-edit-cell" : "k-edit-cell";
                isEdited = current.hasClass(editClass);
            } else {
                isEdited = isStackedCell ? current.hasClass("k-grid-stack-edit-cell") : current.parent().hasClass("k-grid-edit-row");
            }

            if (that.editable) {
                if ($.contains(editContainer[0], active[0])) {
                    active.trigger("blur");
                    if (isIE) {
                        //IE10 with jQuery 1.9.x does not trigger blur handler
                        //numeric textbox does trigger change
                        active.trigger("blur");
                    }
                }

                if (!that.editable && !isStackedCell) {
                    focusTable(that.table);
                    return;
                }

                if (that.editable.end()) {
                    if (mode == "incell") {
                        that.closeCell();
                    } else {
                        that.saveRow();
                        isEdited = true;
                    }
                } else {
                    if (stacked && isStackedCell) {
                        return that._setCurrentStackedCell(current);
                    }

                    if (mode == "incell") {
                        that._setCurrent(editContainer);
                    } else {
                        that._setCurrent(editContainer.children().filter(DATA_CELL).first());
                    }
                    focusable = editContainer.find(":kendoFocusable").first()[0];
                    if (focusable) {
                        focusable.focus();
                    }
                    return;
                }
            }

            if (next) {
                that._setCurrent(next);
            }

            if (!isStackedCell) {
                focusTable(that.table, true);
            }

            if (!editable) {
                return;
            }

            if ((!isEdited && !next) || next) {
                if (mode === INCELL) {
                    const incellCondition = stacked ? current.find("[ref='expand-detail-button'], [ref='collapse-detail-button']").length : $(that.current()).hasClass(HIERARCHY_CELL_CLASS);
                    if (!incellCondition) {
                        const stacked = that._isStackedMode();
                        const cell = stacked ? current : that.current();

                        if (stacked && cell.is(".k-command-cell")) {
                            return;
                        }

                        that.editCell(cell, stacked && cell.parent().children().index(cell));
                    }
                } else {
                    that.editRow(that.current().parent());
                }
            }

            that._toggleToolbarEditingItemsVisibility();
        },

        _wrapper: function() {
            var that = this,
                table = that.table,
                height = that.options.height,
                width = that.options.width,
                wrapper = that.element;

            if (!wrapper.is(DIV)) {
                wrapper = wrapper.wrap("<div/>").parent();
            }

            that.wrapper = wrapper.addClass("k-grid " + kendo.getValidCssClass("k-grid-", "size", that.options.size));

            if (that._isStackedMode()) {
                that.wrapper.addClass(STACKED);
            } else {
                that.wrapper.removeClass(STACKED);
            }

            if (height) {
                that.wrapper.css(HEIGHT, height);
                table.css(HEIGHT, AUTO);
            }

            if (width) {
                that.wrapper.css(WIDTH, width);
            }

            that._initMobile();
        },

        _initContextMenu: function() {
            var that = this,
                options = that.options,
                groupsContextMenu = isPlainObject(options.contextMenu) && isArray(options.contextMenu.groups) ? { items: options.contextMenu.groups } : { items: defaultGroupsContextMenu },
                tbodyContextMenu = isPlainObject(options.contextMenu) && isArray(options.contextMenu.body) ? { items: options.contextMenu.body } : { items: defaultBodyContextMenu },
                theadContextMenu = isPlainObject(options.contextMenu) && isArray(options.contextMenu.head) ? { items: options.contextMenu.head } : { items: defaultHeadContextMenu };

            var mainOptions = isPlainObject(options.contextMenu) ? options.contextMenu : {};

            tbodyContextMenu = extend({}, {
                messages: options.messages,
                target: that.tbody,
                filter: ".k-table-td",
                action: that._action.bind(that),
                states: that._buildStates()
            }, mainOptions, tbodyContextMenu);

            theadContextMenu = extend({}, {
                messages: options.messages,
                target: that.thead,
                filter: ".k-table-th",
                action: that._action.bind(that),
                states: that._buildStates()
            }, mainOptions, theadContextMenu);

            if (that.groupable) {
                groupsContextMenu = extend({}, {
                    showOn: "click",
                    target: that.groupable.groupContainer,
                    filter: ".k-groupable-context-menu",
                    messages: options.messages,
                    action: that._action.bind(that),
                    states: that._buildStates()
                }, mainOptions, groupsContextMenu);
            }


            that.tbodyContextMenu = new ui.grid.ContextMenu("<ul></ul>", tbodyContextMenu);
            that.theadContextMenu = new ui.grid.ContextMenu("<ul></ul>", theadContextMenu);
            that.groupsContextMenu = !!that.groupable && new ui.grid.ContextMenu("<ul></ul>", groupsContextMenu);
        },

        _buildStates: function() {
            var that = this;

            return {
                isEditable: that.options.editable,
                isSelectable: that.options.selectable,
                isSortable: that.options.sortable,
                isRowReorderable: isPlainObject(that.options.reorderable) ? that.options.reorderable.rows : that.options.reorderable,
                isGroupable: that.options.groupable,
                allowPaste: that.options.allowPaste,
                alwaysDisabled: false,
                hasSelection: () => (this.select() ? this.select().length > 0 : false),
                isSorted: () => !(this.dataSource.sort() ? this.dataSource.sort().length > 0 : false),
                canMoveGroupPrev: (target) => {
                    var group = $(target).closest(".k-chip");

                    return group.index() > 0;
                },
                canMoveGroupNext: (target) => {
                    var length = $(target).closest(".k-chip-list").children().length - 1;
                    var group = $(target).closest(".k-chip");

                    return group.index() < length;
                }
            };
        },

        _action: function(args) {
            var commandName = args.command,
                commandOptions = extend({ grid: this }, args.options),
                command = new ui.grid.commands[commandName](commandOptions);

            return command.exec();
        },

        _initMobile: function() {
            var options = this.options;
            var that = this;

            this._isMobile = that.options.adaptiveMode !== 'auto' && (options.mobile === true && kendo.support.mobileOS) ||
                options.mobile === "phone" ||
                options.mobile === "tablet";

            if (this._isMobile) {
                var html = this.wrapper.addClass("k-grid-mobile").wrap(
                    '<div data-' + kendo.ns + 'stretch="true" data-' + kendo.ns + 'role="view" ' +
                    'data-' + kendo.ns + 'init-widgets="false"></div>'
                )
                    .parent();

                this.pane = this._createPane(html);
                this.view = this.pane.view();

                if (options.height) {
                    this.pane.element.parent().css(HEIGHT, options.height);
                } else {
                    this.pane.element.parent().css(HEIGHT, this.wrapper[0].style.height);
                }

                this._editAnimation = "slide";

                // Grid transitions should not propagate to the view
                that.wrapper.on("transitionend" + NS, function(e) {
                    e.stopPropagation();
                });

                that.wrapper.on("contextmenu" + NS, "th a", function(e) {
                    e.preventDefault();
                    return false;
                });

                this.view.bind("showStart", function() {
                    if (that._isLocked()) {
                        that._updateTablesWidth();
                        that._applyLockedContainersWidth();
                        that._syncLockedContentHeight();
                        that._syncLockedHeaderHeight();
                        that._syncLockedFooterHeight();
                    }
                });
            }
        },

        _createPane: function(html) {
            var pane = kendo.Pane.wrap(html, {
                viewEngine: {
                    viewOptions: {
                        renderOnInit: true,
                        wrap: false,
                        wrapInSections: true,
                        detachOnHide: false,
                        detachOnDestroy: false
                    }
                }
            });

            return pane;
        },

        _initLoader: function(options) {
            var that = this,
                defaultOptions = {
                    size: 'medium',
                    messages: { exporting: 'Exporting...' }
                };
            defaultOptions = $.extend({}, defaultOptions, options);

            const loader = $("<div></div>").kendoLoader(defaultOptions).data("kendoLoader");

            that.loader = loader;
            that._loaderContainer = useLoaderContainer.bind(that);
        },

        _tbody: function() {
            var that = this,
                table = that.table,
                tbody;

            tbody = table.find(">tbody");

            if (!tbody.length) {
                tbody = $("<tbody/>").appendTo(table);
            }

            tbody.addClass('k-table-tbody');
            that.tbody = tbody;
        },

        _scrollable: function() {
            var that = this,
                header,
                table,
                options = that.options,
                scrollable = options.scrollable,
                hasVirtualScroll = scrollable !== true && scrollable.virtual,
                virtualScroll = hasVirtualScroll ? parseVirtualSettings(scrollable.virtual) : null,
                scrollbar = !kendo.support.kineticScrollNeeded || (virtualScroll && virtualScroll.rows) ? kendo.support.scrollbar() : 0,
                headerWrap;

            const stacked = that._isStackedMode();

            if (scrollable) {
                if (!stacked) {
                    header = that.wrapper.children(".k-grid-header");

                    if (!header[0]) {
                        header = $('<div class="k-grid-header" />').insertBefore(that.table);
                    }

                    // workaround for IE issue where scroll is not raised if container is same width as the scrollbar
                    header.css((isRtl ? "padding-left" : "padding-right"), scrollable.virtual ? scrollbar + 1 : scrollbar);
                    table = $('<table role="none" class="k-grid-header-table k-table"/>');
                    table.addClass(kendo.getValidCssClass("k-table-", "size", options.size));
                    table.width(that.table[0].style.width);
                }

                if (!stacked) {
                    table.append(that.thead);
                    header.empty().append($('<div class="k-grid-header-wrap k-auto-scrollable" />').append(table));
                }


                that.content = that.table.parent();
                that.virtualScroll = virtualScroll;

                if (that.content.is(".k-virtual-scrollable-wrap, " + DOT + classNames.scrollContainer)) {
                    that.content = that.content.parent();
                }

                if (!that.content.is(".k-grid-content, .k-virtual-scrollable-wrap")) {
                    that.content = that.table.wrap('<div class="k-grid-content k-auto-scrollable" />').parent();
                }

                if (!that.content.parent().hasClass("k-grid-container")) {
                    that.content.wrap("<div class='k-grid-container' />").parent();
                }

                if (virtualScroll && virtualScroll.rows && !that.virtualScrollable) {
                    that._createVirtualScrollable();
                }

                if (virtualScroll && virtualScroll.columns) {

                    that.table.add(that.thead.parent()).css({
                        width: sumWidths(visibleLeafColumns(visibleNonLockedColumns(that.columns)))
                    });
                }

                if (!stacked) {
                    headerWrap = header.children(".k-grid-header-wrap");
                    that.scrollables = headerWrap.add(that.content);
                } else {
                    that.scrollables = that.content;
                }


                // the footer may exists if rendered from the server
                var footer = that.wrapper.find(".k-grid-footer");

                if (footer.length) {
                    that.scrollables = that.scrollables.add(footer.children(".k-grid-footer-wrap"));
                }

                if (!stacked) {
                    headerWrap.off("scroll" + NS).on("scroll" + NS, function(e) {
                        if (that._scrollLeft !== this.scrollLeft) {
                            kendo.scrollLeft(that.scrollables.not(e.currentTarget), this.scrollLeft);
                        }
                    });
                }

                if (virtualScroll && virtualScroll.rows) {
                    that.content.find(">.k-virtual-scrollable-wrap").off("scroll" + NS).on("scroll" + NS, function() {
                        var isScrollingLeft = this.scrollLeft != that._scrollLeft;
                        that._scrollLeft = this.scrollLeft;
                        kendo.scrollLeft(that.scrollables, this.scrollLeft);
                        if (that.lockedContent) {
                            that.lockedContent[0].scrollTop = this.scrollTop;
                        }
                        if (virtualScroll.columns && isScrollingLeft) {
                            that.refresh();
                        }
                    });
                } else {
                    var endless = scrollable.endless;
                    var originalPageSize = that.dataSource.options.pageSize;
                    if (endless) {
                        that._endlessPageSize = originalPageSize;
                    }
                    that.content.off("scroll" + NS).on("scroll" + NS, function(e) {
                        var isScrollingLeft = this.scrollLeft != that._scrollLeft;
                        that._scrollLeft = this.scrollLeft;
                        kendo.scrollLeft(that.scrollables.not(e.currentTarget), that._scrollLeft);
                        if (that.lockedContent && e.currentTarget == that.content[0]) {
                            that.lockedContent[0].scrollTop = this.scrollTop;
                        }
                        if (endless) {
                            if ((this.scrollTop + this.clientHeight - this.scrollHeight >= -10) &&
                                !that._endlessFetchInProgress &&
                                that._endlessPageSize < that.dataSource.total()) {
                                that._skipRerenderItemsCount = that._endlessPageSize;
                                that._endlessPageSize = that._endlessPageSize + originalPageSize;
                                that.dataSource.options.endless = true;
                                that._endlessFetchInProgress = true;
                                that.dataSource.pageSize(that._endlessPageSize);
                            }
                        }

                        if (virtualScroll && virtualScroll.columns && isScrollingLeft) {
                            that._virtualColScroll = true;
                            that._cacheEditableState();
                            that.refresh();
                            that._restoreEditableState();
                            that._virtualColScroll = false;
                        }

                        if (that.rowResizer) {
                            that.rowResizer.css("left", e.currentTarget.scrollLeft + "px");
                        }
                    });

                    var touchScroller = that.content.data("kendoTouchScroller");
                    if (touchScroller) {
                        touchScroller.destroy();
                    }

                    touchScroller = kendo.touchScroller(that.content);
                    if (touchScroller && touchScroller.movable) {
                        that.touchScroller = touchScroller;
                        touchScroller.movable.bind("change", function(e) {
                            kendo.scrollLeft(that.scrollables, -e.sender.x);
                            if (that.lockedContent) {
                                that.lockedContent.scrollTop(-e.sender.y);
                            }
                        });

                        that.one(DATABOUND, function(e) {
                            e.sender.wrapper.addClass("k-grid-backface");
                        });
                    }
                }
            }
        },

        _createVirtualScrollable: function() {
            var that = this;

            if (that.virtualScrollable) {
                that.virtualScrollable.destroy();
            }

            that.virtualScrollable = new VirtualScrollable(that.content, {
                dataSource: that.dataSource,
                itemHeight: function() { return that._averageRowHeight(); },
                page: function() {
                    that._restoreEditableState();
                },
                scroll: function() {
                    that._focusEditable();
                },
                loadStart: function() {
                    that._progress(true);
                },
                loadEnd: function() {
                    that._progress(false);
                }
            });

            that.virtualScrollable.bind(PAGING, that._onVirtualPaging.bind(that));
        },

        _onVirtualPaging: function() {
            var that = this;

            that._cacheEditableState();

            if (that._isVirtualIncellEditable()) {
                that._shouldClearEditableState = false;
                that.closeCell();
                that._shouldClearEditableState = true;
            }
        },

        _isVirtualEditable: function() {
            return this._isVirtualIncellEditable() || this._isVirtualInlineEditable() || this._isVirtualPopupEditable();
        },

        _isVirtualInlineEditable: function() {
            return (this.virtualScrollable) && this._editMode() === INLINE;
        },

        _isVirtualIncellEditable: function() {
            return (this.virtualScrollable) && this._editMode() === INCELL;
        },

        _isVirtualPopupEditable: function() {
            return this.virtualScrollable && this._editMode() === "popup";
        },

        _hasVirtualColumns: function() {
            return (this.virtualScroll || {}).columns ? true : false;
        },

        _hasVirtualRows: function() {
            return (this.virtualScroll || {}).rows ? true : false;
        },

        _scrollVirtualWrapper: function() {
            var that = this;
            var scrollable = that.virtualScrollable;

            if (that._isVirtualInlineEditable() || that._isVirtualIncellEditable()) {
                if (scrollable._isScrolledToBottom()) {
                    scrollable._scrollWrapperToBottom();
                } else if (scrollable._isScrolledToTop()) {
                    scrollable._scrollWrapperToTop();
                }
            }
        },

        _scrollVirtualWrapperOnColumnResize: function() {
            var virtualScrollable = this.virtualScrollable;

            if (virtualScrollable) {
                virtualScrollable._scrollWrapperOnColumnResize();
            }
        },

        _restoreEditableState: function() {
            var that = this;
            var editableState = that._editableState || {};
            var editedModel = editableState.model;
            var dataSource = that.dataSource;
            var inlineMode = that._isVirtualInlineEditable();
            var incellMode = that._isVirtualIncellEditable();
            var virtualColumns = that._hasVirtualColumns();
            var row;
            var cell;

            if ((inlineMode || incellMode || virtualColumns) && editedModel && dataSource._getByUid(editedModel.uid, dataSource.view())) {
                if (that._editMode() === INLINE) {
                    that._shouldClearEditableState = false;
                    that.editRow(editedModel);
                    if (!virtualColumns) {
                        that._focusEditable();
                    }
                } else if (that._editMode() === INCELL) {
                    const stacked = that._isStackedMode();
                    row = that.tbody.children(attrEquals(UNIQUE_ID, editedModel.uid));
                    cell = stacked ? $(row).find(".k-grid-stack-cell:not(.k-drag-cell):not(.k-command-cell)" + attrEquals(FIELD, editableState.field)) : $(row).children(attrEquals(FIELD, editableState.field));

                    if (cell[0]) {
                        that._shouldClearEditableState = false;
                        that.editCell(cell, stacked && cell.parent().children().index(cell));
                        if (!virtualColumns) {
                            that._focusEditable();
                        }
                    }
                }
            }

            that._shouldClearEditableState = true;
        },

        _focusEditable: function() {
            var that = this;
            var editedField = (that._editableState || {}).field;
            var editContainer = that._editContainer;

            if (editContainer && editContainer.length && !contains(editContainer[0], activeElement()) && that._canFocusEditable()) {
                if (that._isVirtualInlineEditable() || that._hasVirtualColumns()) {
                    editContainer.find(attrEquals(CONTAINER_FOR, editedField)).find(FOCUSABLE).eq(0).trigger("focus");
                } else if (that._isVirtualIncellEditable() || that._hasVirtualColumns()) {
                    editContainer.find(FOCUSABLE).eq(0).trigger("focus");
                }
            }
        },

        _canFocusEditable: function() {
            var that = this;
            var result = ((that._isVirtualIncellEditable() || that._isVirtualInlineEditable() || that._hasVirtualColumns()) &&
                (isElementVisibleInWrapper((that.virtualScrollable || {}).wrapper, that._editContainer) || isElementVisibleInWrapper(that.content, that._editContainer)));

            return result;
        },

        _cacheEditableState: function() {
            var that = this;
            var editContainer = that._editContainer;
            var editedModel = editContainer ? that._modelForContainer(editContainer) : null;
            var inlineMode = that._isVirtualInlineEditable();
            var incellMode = that._isVirtualIncellEditable();
            var virtualColumns = that._hasVirtualColumns();
            var active;
            var widget;
            var value;

            if ((inlineMode || incellMode || virtualColumns) && editedModel) {
                that._clearEditableState();
                active = $(activeElement());

                if (editContainer && active[0] && contains(editContainer[0], active[0])) {
                    //change event is not fired if the editable container is scrolled
                    //out of the virtual view with the mousewheel right after editing
                    active.change();

                    widget = kendo.widgetInstance(active, kendo.ui);

                    if (widget && isFunction(widget.value) && active.is(INPUT)) {
                        value = active.val();

                        if (active.is("[type='checkbox'")) {
                            value = active.is(":checked");
                        }

                        widget.value(value);
                        widget.trigger(CHANGE);
                    }
                }

                if (that._editMode() === INLINE) {
                    that._editableState = {
                        model: editedModel,
                        field: active.closest("[" + kendo.attr(CONTAINER_FOR) + "]").attr(kendo.attr(CONTAINER_FOR))
                    };
                } else if (that._editMode() === INCELL) {
                    that._editableState = {
                        model: editedModel,
                        field: editContainer.attr(kendo.attr(FIELD))
                    };
                }
            }
        },

        _clearSortClasses: function() {
            var that = this,
                content = that.content || that.table,
                lockedContent = that.lockedContent;

            if (content) {
                content.find(COLGROUP).removeClass(SORTED_CLASS);
            }

            if (lockedContent) {
                lockedContent.find(COLGROUP).removeClass(SORTED_CLASS);
            }
        },

        _clearEditableState: function() {
            var that = this;

            if (that.virtualScrollable || (that.virtualScroll && that._hasVirtualColumns())) {
                that._editableState = null;
            }
        },

        _destroyVirtualScrollable: function() {
            var that = this;

            that._clearEditableState();

            if (that.virtualScrollable && that.virtualScrollable.element) {
                that.virtualScrollable.destroy();
            }

            that.virtualScrollable = null;
        },

        _destroyRowResizing: function() {
            if (this.rowResizing) {
                this.rowResizing.destroy();

                this.rowResizing = null;
            }

            if (this.rowResizer) {
                this._detachRowResizerEvents();
                this.rowResizer.off(DUBLECLICK + NS);
                this.rowResizer = null;
                this._clearCachedRowsHeight();
            }
        },

        _renderNoRecordsContent: function() {
            var that = this;

            if (that.options.noRecords) {
                var noRecordsElement = that.table.parent().children('.' + NORECORDSCLASS);

                if (noRecordsElement.length) {
                    noRecordsElement.remove();
                }

                if (!that.dataSource || !that.dataSource.view().length) {
                    noRecordsElement = $(that.noRecordsTemplate({ grid: that }));
                    kendo.applyStylesFromKendoAttributes(noRecordsElement, ["margin", "position"]);
                    noRecordsElement.insertAfter(that.table);
                }
            }
        },

        _setContentWidth: function(scrollLeft) {
            var that = this,
                hiddenDivClass = 'k-grid-content-expander',
                hiddenDiv = '<div class="' + hiddenDivClass + '"></div>',
                resizable = that.resizable,
                expander;

            if (that.options.scrollable && that.wrapper.is(":visible")) {
                expander = that.table.parent().children('.' + hiddenDivClass);
                that._setContentWidthHandler = that._setContentWidth.bind(that);
                if (!that.dataSource || !that.dataSource.view().length) {
                    if (!expander[0]) {
                        expander = $(hiddenDiv).appendTo(that.table.parent());
                        if (resizable) {
                            resizable.bind("resize", that._setContentWidthHandler);
                        }
                    }
                    if (that.thead) {
                        expander.width(that.thead.width());
                        if (!isNaN(parseFloat(scrollLeft, 10))) {
                            kendo.scrollLeft(that.content, scrollLeft);
                        }
                    }
                } else if (expander[0]) {
                    expander.remove();
                    if (resizable) {
                        resizable.unbind("resize", that._setContentWidthHandler);
                    }
                }

                that._applyLockedContainersWidth(true);
                that._syncLockedContentHeight();

                // workaround IE does not show vertical scrollbar for elements without width
                if (that.lockedHeader && that.table[0].clientWidth === 0) {
                    that.table[0].style.width = "1px";
                }
            }
        },

        _applyLockedContainersWidth: function(calculateGroupWidth) {
            if (this.options.scrollable && this.lockedHeader) {
                let headerTable = this.thead.parent(),
                    headerWrap = headerTable.parent(),
                    contentWidth = this.wrapper[0].clientWidth,
                    groups = this._groups(),
                    scrollbar = kendo.support.scrollbar(),
                    cols = this.lockedHeader.find(">table>colgroup>col:not(.k-group-col, .k-hierarchy-col)"),
                    nonLockedCols = headerTable.find(">colgroup>col:not(.k-group-col, .k-hierarchy-col)"),
                    width = columnsWidth(cols),
                    nonLockedColsWidth = columnsWidth(nonLockedCols),
                    footerWrap;

                if (groups > 0 && calculateGroupWidth) {
                    width += outerWidth(this.lockedHeader.find(".k-group-cell").first()) * groups;
                }

                if (width >= contentWidth) {
                    width = contentWidth - 3 * scrollbar;
                }

                this.lockedHeader
                    .add(this.lockedContent)
                    .width(width);

                headerWrap[0].style.width = headerWrap.parent().width() - width - 2 + PX;

                headerTable.add(this.table).width(nonLockedColsWidth);

                //https://github.com/telerik/kendo-ui-core/issues/377
                if (this.virtualScrollable && !isIE11) {
                    contentWidth -= scrollbar;
                }

                this.content[0].style.width = contentWidth - width - 1 + PX;

                if (this.lockedFooter && this.lockedFooter.length) {
                    this.lockedFooter.width(width);
                    footerWrap = this.footer.find(".k-grid-footer-wrap");
                    footerWrap[0].style.width = headerWrap[0].clientWidth + PX;
                    footerWrap.children().first().width(nonLockedColsWidth);
                }
            }
        },

        _setContentHeight: function() {
            var that = this,
                options = that.options,
                height,
                header = that.wrapper.children(".k-grid-header"),
                scrollbar = kendo.support.scrollbar();
            var scrollableHeight = (options.scrollable || {}).height;

            if (options.scrollable && that.wrapper.is(":visible")) {
                if (scrollableHeight && that.content[0].style.height === "") {
                    // fallback to client-side setting as ASP.NET MVC Core wrapper does not provide server rendering of the content
                    that.content[0].style.height = scrollableHeight;
                }

                height = that.wrapper.innerHeight();

                height -= outerHeight(header);

                if (that.pager && that.pager.element.is(":visible")) {
                    height -= outerHeight(that.pager.element);
                }

                if (options.groupable) {
                    height -= outerHeight(that.wrapper.children(".k-grouping-header:not(.k-hidden)"));
                }

                if (options.toolbar) {
                    height -= outerHeight(that.wrapper.children(".k-grid-toolbar"));
                }

                if (that.footerTemplate) {
                    height -= outerHeight(that.wrapper.children(".k-grid-footer"));
                }

                if (that.statusBar) {
                    height -= outerHeight(that.wrapper.children(".k-selection-aggregates"));
                }

                var isGridHeightSet = function(el) {
                    var initialHeight, newHeight;
                    if (el[0].style.height) {
                        return true;
                    } else {
                        initialHeight = el.height();
                    }

                    el.height(AUTO);
                    newHeight = el.height();

                    if (initialHeight != newHeight) {
                        el.height("");
                        return true;
                    }
                    el.height("");
                    return false;
                };

                if (isGridHeightSet(that.wrapper)) { // set content height only if needed
                    if (height > scrollbar * 2) { // do not set height if proper scrollbar cannot be displayed
                        if (that.lockedContent) {
                            scrollbar = that.table[0].offsetWidth > that.table.parent()[0].clientWidth ? scrollbar : 0;
                            that.lockedContent.height(height - scrollbar);
                        }

                        that.content.height(height);
                    } else {
                        that.content.height(scrollbar * 2 + 1);
                    }
                }
            }
        },

        _averageRowHeight: function() {
            var that = this,
                itemsCount = that._items(that.tbody, true).length,
                rowHeight = that._rowHeight;

            if (itemsCount === 0) {
                return rowHeight;
            }

            if (!that._rowHeight) {
                that._rowHeight = rowHeight = outerHeight(that.table) / itemsCount;
                that._sum = rowHeight;
                that._measures = 1;
            }

            var currentRowHeight = outerHeight(that.table) / itemsCount;

            if (rowHeight !== currentRowHeight) {
                that._measures++;
                that._sum += currentRowHeight;
                that._rowHeight = that._sum / that._measures;
            }
            return rowHeight;
        },

        _dataSource: function() {
            var that = this,
                options = that.options,
                pageable,
                dataSource = options.dataSource;

            dataSource = isArray(dataSource) ? { data: dataSource } : dataSource;

            if (isPlainObject(dataSource)) {
                extend(dataSource, { table: that.table, fields: that.columns });

                pageable = options.pageable;

                if (isPlainObject(pageable) && pageable.pageSize !== undefined$1) {
                    dataSource.pageSize = pageable.pageSize;
                }
            }

            if (that.dataSource && that._refreshHandler) {
                that.dataSource.unbind(CHANGE, that._refreshHandler)
                    .unbind(PROGRESS, that._progressHandler)
                    .unbind(REQUESTEND, that._requestEndHandler)
                    .unbind(ERROR, that._errorHandler)
                    .unbind(SORT, that._sortHandler);
            } else {
                that._refreshHandler = that.refresh.bind(that);
                that._progressHandler = that._requestStart.bind(that);
                that._requestEndHandler = that._requestEnd.bind(that);
                that._errorHandler = that._error.bind(that);
                that._sortHandler = that._clearSortClasses.bind(that);
            }

            that.dataSource = DataSource.create(dataSource)
                .bind(CHANGE, that._refreshHandler)
                .bind(PROGRESS, that._progressHandler)
                .bind(REQUESTEND, that._requestEndHandler)
                .bind(ERROR, that._errorHandler)
                .bind(SORT, that._sortHandler);
        },

        _error: function() {
            this._progress(false);
            this._requestInProgress = false;
        },

        _requestStart: function() {
            this._progress(true);
            this._requestInProgress = true;
        },

        _requestEnd: function() {
            this._requestInProgress = false;
        },

        _modelChange: function(e) {
            var that = this,
                tbody = that.tbody,
                model = e.model,
                row = that.tbody.find("tr[" + kendo.attr("uid") + "=" + model.uid + "]"),
                relatedRow,
                cell,
                column,
                isAlt = row.hasClass("k-table-alt-row"),
                tmp,
                idx = that._items(tbody).index(row),
                isLocked = that.lockedContent,
                selectable,
                selectableRow,
                childCells,
                originalCells,
                length;

            const stacked = that._isStackedMode();

            if (isLocked) {
                relatedRow = that._relatedRow(row);
            }

            const editCells = stacked ? row.add(relatedRow).find(".k-grid-stack-cell:not(.k-drag-cell):not(.k-command-cell)") : row.add(relatedRow).children(".k-edit-cell");

            if (editCells.length && !that.options.rowTemplate) {
                const iterateCells = stacked ? row.add(relatedRow).children(":not(.k-group-cell,.k-hierarchy-cell)").find(".k-grid-stack-cell:not(.k-drag-cell):not(.k-command-cell)") : row.add(relatedRow).children(":not(.k-group-cell,.k-hierarchy-cell)");
                iterateCells.each(function() {
                    cell = $(this);

                    if (stacked && cell.hasClass(".k-command-cell")) {
                        return;
                    }

                    column = leafColumns(that.columns)[that._calculateColumnIndex(cell)];

                    if (column.field === e.field) {
                        const editClass = stacked ? "k-grid-stack-edit-cell" : "k-edit-cell";
                        if (!cell.hasClass(editClass)) {
                            const target = stacked ? cell.find(".k-grid-stack-content") : cell;
                            that._displayCell(target, column, model);
                        } else {
                            cell.addClass("k-dirty-cell");
                        }
                    }
                });

            } else if (!row.hasClass("k-grid-edit-row")) {

                selectableRow = $().add(row);

                if (isLocked) {
                    tmp = (isAlt ? that.lockedAltRowTemplate : that.lockedRowTemplate)(model);

                    selectableRow = selectableRow.add(relatedRow);

                    relatedRow.replaceWith(tmp);
                }

                tmp = (isAlt ? that.altRowTemplate : that.rowTemplate)(model);

                let tmpResult = $(tmp);
                kendo.applyStylesFromKendoAttributes(tmpResult, ["display"]);
                row.replaceWith(tmpResult);

                tmp = that._items(tbody).eq(idx);

                if (isLocked) {
                    row = row.add(relatedRow);

                    relatedRow = that._relatedRow(tmp)[0];
                    adjustRowHeight(tmp[0], relatedRow);

                    tmp = tmp.add(relatedRow);
                }

                selectable = that.options.selectable;
                if ((selectable || that._checkBoxSelection) && row.hasClass(SELECTED)) {
                    that.select(tmp);
                }

                originalCells = selectableRow.children(":not(.k-group-cell,.k-hierarchy-cell)");
                childCells = tmp.children(":not(.k-group-cell,.k-hierarchy-cell)");

                for (idx = 0, length = that.columns.length; idx < length; idx++) {
                    column = that.columns[idx];

                    cell = stacked ? childCells.find().eq(idx) : childCells.eq(idx);
                    if (selectable && originalCells.eq(idx).hasClass(SELECTED)) {
                        cell.addClass(SELECTED);
                    }
                }

                that.trigger("itemChange", { item: tmp, data: model, ns: ui });
            }
        },

        _pageable: function() {
            var that = this,
                pagerWrap,
                pageable = that.options.pageable,
                size = that.options.size,
                navigatable = that.options.navigatable;

            if (pageable) {
                pagerWrap = that.wrapper.children("div.k-grid-pager");

                if (!pagerWrap.length) {
                    pagerWrap = $('<div class="k-pager k-grid-pager"/>');
                }

                if (pageable.position === "top") {
                    pagerWrap.prependTo(that.wrapper).addClass("k-grid-pager-top");
                } else {
                    pagerWrap.appendTo(that.wrapper);
                }

                if (that.pager) {
                    that.pager.destroy();
                }

                let adaptive = that.options.adaptiveMode;
                if (that.options.adaptiveMode === "auto") {
                    if (pageable && typeof pageable === "object" && pageable.adaptiveMode) {
                        adaptive = pageable.adaptiveMode;
                    }
                }

                if (typeof pageable === "object" && pageable instanceof kendo.ui.Pager) {
                    that.pager = pageable;
                } else {
                    if (that.dataSource._groupPaging) {
                        that.pager = new GroupsPager(pagerWrap, extend({}, pageable, { dataSource: that.dataSource, navigatable: navigatable, size: size, adaptiveMode: adaptive }));
                    } else {
                        that.pager = new kendo.ui.Pager(pagerWrap, extend({}, pageable, { dataSource: that.dataSource, navigatable: navigatable, size: size, adaptiveMode: adaptive }));
                    }
                }

                that.pager.bind("pageChange", function(e) {
                    if (that.trigger("page", { page: e.index })) {
                        e.preventDefault();
                    }
                });

                that._togglePagerVisibility();
            }
        },

        _statusBar: function() {
            var that = this,
                options = that.options,
                wrapper = that.wrapper,
                statusBarTemplate = options.statusBarTemplate,
                content = "";

            if (statusBarTemplate) {
                if (!that.statusBar) {
                    content += '<div class="k-selection-aggregates k-grid-selection-aggregates">';

                    content += statusBarTemplate({ aggregates: that._cellAggregates });

                    content += '</div>';

                    if (options.scrollable) {
                        that.statusBar = $(content).insertAfter(wrapper.find(DOT + "k-grid-container"));
                    } else {
                        that.statusBar = $(content).insertAfter(wrapper.find(DOT + "k-grid-table"));
                    }
                } else {
                    that.statusBar.html(statusBarTemplate({ aggregates: that._cellAggregates }));
                }
            }
        },

        _footer: function() {
            var that = this,
                aggregates = that.dataSource.aggregates(),
                html = "",
                footerTemplate = that.footerTemplate,
                options = that.options,
                footerWrap,
                footer = that.footer || that.wrapper.find(".k-grid-footer");

            if (footerTemplate) {
                html = $(that._wrapFooter(footerTemplate(aggregates)));
                kendo.applyStylesFromKendoAttributes(html, ["display", "left", "right"]);

                if (footer.length) {
                    var tmp = html;

                    footer.replaceWith(tmp);
                    footer = that.footer = tmp;
                } else {
                    if (options.scrollable) {
                        if (that.statusBar) {
                            that.footer = html.insertBefore(that.statusBar);
                        } else if (options.pageable && options.pageable.position !== "top") {
                            that.footer = html.insertBefore(that.wrapper.children("div.k-grid-pager"));
                        } else {
                            that.footer = html.appendTo(that.wrapper);
                        }
                        footer = that.footer;
                    } else {
                        footer = that.footer = html.insertAfter(that.tbody);
                    }
                }
            } else if (footer && !that.footer) {
                that.footer = footer;
            }

            if (footer.length) {
                if (options.scrollable) {
                    footerWrap = footer.attr(TABINDEX, -1).children(".k-grid-footer-wrap");

                    that.scrollables = $(
                        that.scrollables
                            .filter(function() { return !$(this).is(".k-grid-footer-wrap"); })
                            .toArray()
                    ).add(footerWrap);
                }

                if (that._footerWidth) {
                    footer.find("table").css('width', that._footerWidth);
                }

                if (footerWrap) {
                    var offset = kendo.scrollLeft(that.content);

                    if (options.scrollable !== true && that.virtualScroll && that.virtualScroll.rows) {
                        offset = kendo.scrollLeft(that.wrapper.find('.k-virtual-scrollable-wrap'));
                    }
                    kendo.scrollLeft(footerWrap, offset);
                }
            }

            if (that.lockedContent) {
                that._appendLockedColumnFooter();
                that._applyLockedContainersWidth();
                that._syncLockedFooterHeight();
            }
        },

        _wrapFooter: function(footerRow) {
            var that = this,
                html = "",
                table,
                scrollbar = !kendo.support.mobileOS ? kendo.support.scrollbar() : 0;

            if (that.options.scrollable) {
                html = $('<div class="k-grid-footer"><div class="k-grid-footer-wrap"><table class="k-table k-grid-footer-table"><tfoot class="k-table-tfoot">' + footerRow + '</tfoot></table></div></div>');
                table = html.find("table");
                table.addClass(kendo.getValidCssClass("k-table-", "size", that.options.size));
                that._appendCols(table);
                html.css((isRtl ? "padding-left" : "padding-right"), scrollbar); // Update inner fix.

                return html;
            }

            return '<tfoot class="k-grid-footer k-table-tfoot">' + footerRow + '</tfoot>';
        },

        _actionsheetFooterActionsTemplate: function(buttonsConfig) {
            let buttonsHtml = "";

            buttonsConfig.forEach(buttonOptions => {
                const command = buttonOptions.command;
                const text = buttonOptions.text;

                buttonsHtml += kendo.html.renderButton(`<button data-command=${command}>${text}</button>`, buttonOptions);
            });

            return buttonsHtml;
        },
        _isAdaptive: function() {
            const that = this;
            return that.options.adaptiveMode === "auto" && (that.smallMQL.mediaQueryList.matches || that.mediumMQL.mediaQueryList.matches);
        },

        _isStackedMode: function() {
            const that = this;
            return that.options.dataLayoutMode === "stacked";
        },

        _toolPopup: function(cell) {
            return cell.popup && cell.popup.wrapper;
        },

        _filterToolbarTool: function(cell) {
            const that = this;
            const columns = leafColumns(that.columns);
            const options = that.options;
            const clearFilterButton = (cell) => {
                const clearFilterSelector = that._isAdaptive() ? "[ref-actionsheet-action-button]" : "[ref='clear-filter']";
                return that._toolPopup(cell)?.find(clearFilterSelector);
            };

            const toolbarFilterOptions = that._toolbarOptionsForTool("filter");

            function content({ isAdaptive }) {
                let content = "";


                for (let i = 0; i < columns.length; i++) {
                    const column = columns[i];
                    const filterable = options.filterable && column.filterable !== false;

                    if (!filterable || column.command || column.draggable || column.selectable) {
                        continue;
                    }

                    content += `<div class="k-columnmenu-item-wrapper">`;
                    content += `<div class="k-columnmenu-item-content k-columns-item" ref="filter" tabindex="0" data-field="${column.field}" data-index=${column.index || i || 0}></div>`;

                    content += `</div>`;

                }

                if ((!toolbarFilterOptions || toolbarFilterOptions.clearButton) && !isAdaptive) {
                    content += `<div class="k-actions k-actions-stretched k-actions-horizontal k-column-menu-footer">`;

                    content += kendo.html.renderButton(`<button ref="clear-filter">${defaultActionSheetFooterButtons(that.options.messages).filter[0].text}</button>`, { icon: "filter-clear" });

                    content += "</div>";
                }

                return content;
            }

            const menu = cell.data("kendoColumnMenu");
            if (menu) {
                menu.wrapper.off("click" + NS);
                menu.element.off("click" + NS);
                menu.destroy();
            }

            const filterable = options.filterable && that.options.columnMenu.filterable !== false ? extend(true, { pane: that.pane }, options.filterable) : false;

            if (!filterable) {
                return;
            }

            const menuOptions = {
                dataSource: that.dataSource,
                columns: false,
                sortable: false,
                filterable: filterable,
                hideAutoSizeColumn: true,
                owner: that,
                adaptiveMode: that.options.adaptiveMode,
                encodeTitles: that.options.encodeTitles,
                componentType: "modern",
                _actionsheet: {
                    actionButtons: defaultActionSheetFooterButtons(that.options.messages).filter,
                    title: "Filter by",
                    closeButton: true,
                    ref: "filter-view",
                },
                closeCallback: function(e) {
                    e.removeClass(SELECTED);
                    const popupElement = that._toolPopup(cell);

                    if (popupElement.length) {
                        popupElement.find(".k-focus").removeClass("k-focus");
                    }

                    cell.element.focus();
                },
                init: function(e) {
                    cell.wrapper.attr("ref", "filter-tool");
                    if (!that._showAdaptiveView) {
                        for (var idx = 0, length = columns.length; idx < length; idx++) {
                            const column = columns[idx];
                            const field = column.field;
                            const filterable = options.filterable && column.filterable !== false && !column.draggable && !column.selectable && !column.command;
                            if (!filterable) {
                                continue;
                            }

                            const element = cell.wrapper.find(`.k-columns-item[data-field="${field}"]`);
                            that._initFilterMenuForColumn(column, element);
                        }
                    }
                },
                contentTemplate: content,
                filtering: function(e) {
                    if (that.trigger("filter", { filter: e.filter, field: e.field })) {
                        e.preventDefault();
                    } else {
                        that._clearEditableState();
                        if (that.dataSource.options.endless) {
                            that._resetEndless();
                        }
                    }
                }
            };

            cell = cell.kendoColumnMenu(menuOptions).data("kendoColumnMenu");

            cell.element.bind("click" + NS, function(e) {
                if (cell.popup && cell.popup._closing) {
                    return;
                }
                $(e.currentTarget).addClass(SELECTED);
                clearFilterButton(cell)?.toggleClass("k-disabled", !cell.dataSource._filter);
            });

            const filterToolHandler = function(e) {
                const cell = e.sender.wrapper && e.sender.wrapper.find(".k-grid-filter-tool")?.data("kendoColumnMenu");
                const filters = cell.dataSource._filter;
                const field = e.field;
                let isRemoveFilter = !e.filter;
                let condition;
                const filteredFields = filters && filters.filters;

                if (
                    isRemoveFilter
                    && filteredFields
                    && filteredFields.length
                    && !filteredFields.find((descriptor) => (descriptor.filters && descriptor.filters.length ? descriptor.filters[0].field === field : descriptor.field === field))
                ) {
                    return;
                }

                const expansionPanel = cell.wrapper
                    .find(`.k-columns-item[data-field='${field}']`);

                const headerElement = expansionPanel
                    ?.closest(".k-expander")
                    ?.find(".k-columnmenu-item");

                if (filters && filters.filters.length) {
                    if (isRemoveFilter) {
                        condition = filteredFields.filter((descriptor) => descriptor.field !== field).length > 0;
                    } else {
                        condition = !isRemoveFilter;
                    }
                } else if (!isRemoveFilter) {
                    condition = true;
                }

                if (expansionPanel.length) {
                    expansionPanel.data("kendoExpansionPanel").toggle(false);
                }

                clearFilterButton(cell)?.toggleClass("k-disabled", !condition);
                that._toggleColumnMenuFilterIndicator(headerElement, !isRemoveFilter);
                that._toggleBadge(cell.element, condition);
            };

            that.unbind("filter", filterToolHandler);
            that.bind("filter", filterToolHandler);

            cell.bind("open", function() {
                const popupElement = that._toolPopup(cell);

                if (popupElement.length) {
                    popupElement.focus();
                    const clearFilterBtn = clearFilterButton(cell);
                    const filters = cell.dataSource._filter && cell.dataSource._filter.filters;

                    if (filters && filters.length) {
                        filters.forEach((descriptor) => {
                            const field = descriptor.field || descriptor.filters[0].field;
                            const expansionPanel = cell.wrapper
                                .find(`.k-columns-item[data-field='${field}']`);

                            const headerElement = expansionPanel
                                ?.closest(".k-expander")
                                ?.find(".k-columnmenu-item");

                            that._toggleColumnMenuFilterIndicator(headerElement, true);
                        });
                    }

                    if (clearFilterBtn.length) {
                        clearFilterBtn.off("mousedown" + NS);

                        clearFilterBtn.on("mousedown" + NS, function() {
                            that.dataSource.filter([]);
                            that._toggleBadge(cell.element, false);
                            cell.wrapper.find(".k-columnmenu-indicators").remove();
                            clearFilterBtn.toggleClass("k-disabled", true);
                            cell.popup.close();
                        });
                    }
                }
            });
        },

        _initFilterMenuForColumn: function(column, element) {
            const that = this;
            let filterable = that._hasFilterMenu();

            let filterMenu;
            if (element.length) {
                filterMenu = element.data("kendoFilterMenu");

                if (filterMenu) {
                    filterMenu.destroy();
                }

                filterMenu = element.data("kendoFilterMultiCheck");

                if (filterMenu) {
                    filterMenu.destroy();
                }

                var columnFilterable = column.filterable;

                var options = extend({},
                    filterable,
                    columnFilterable,
                    {
                        appendToElement: true,
                        componentType: "modern",
                        dataSource: that.dataSource,
                        values: column.values,
                        format: column.format,
                        title: column.title || column.field,
                        pane: that.pane,
                        adaptiveMode: that.options.adaptiveMode,
                        change: function(e) {
                            if (that.trigger("filter", { filter: e.filter, field: e.field })) {
                                e.preventDefault();
                            } else {
                                that._clearEditableState();
                                if (that.dataSource.options.endless) {
                                    that._resetEndless();
                                }
                            }
                        },
                    }
                );

                if (columnFilterable && columnFilterable.messages) {
                    options.messages = extend(true, {}, filterable.messages, columnFilterable.messages);
                }

                if (columnFilterable && columnFilterable.dataSource) {
                    options.forceUnique = false;
                    options.checkSource = columnFilterable.dataSource;
                }

                if (columnFilterable && columnFilterable.multi) {
                    return element.kendoFilterMultiCheck(options).data("kendoFilterMultiCheck");
                } else {
                    return element.kendoFilterMenu(options).data("kendoFilterMenu");
                }
            }
        },

        _initAiPrompt: function() {
            const that = this;
            const aiOptions = that.options.ai;
            const promptConfig = aiOptions?.aiAssistant || {};
            const messages = that.options.messages?.ai;

            let aiService = aiOptions?.service;

            const getDefaultData = (prompt) => ({
                        "role": "user",
                        "contents": [{
                            "$type": "text",
                            "text": prompt
                        }],
                        "columns": that.columns,
                    });

            const defaults = {
                data: (prompt) => getDefaultData(prompt),
                outputGetter: function(response) {
                    const isError = response?.status;
                    const isIterable = response?.messages && typeof response.messages === "object";

                    let output = [];
                    if (isError) {
                        output.push(messages.error + " " + `${response.status} ${response.statusText}`);
                    } else {
                        output.push(messages.success);

                        if (isIterable) {
                            output.push(...response.messages);
                        } else {
                            output.push(messages);
                        }
                    }

                    return output.join("/n");
                },
            };

            const handleResponse = (output, ai) => {
                    if (!ai._requestInProgress || !ai.options.service) {
                        return;
                    }

                    const outputObjects = ai.outputObjects;

                    ai.updatePromptOutputContent(output.output, skeletonID);
                    ai.element.find("[data-id='" + skeletonID + "']").attr("data-id", output.outputId);

                    const value = outputObjects.get(skeletonID);
                    outputObjects.delete(skeletonID);

                    if (value) {
                        value.id = output?.outputId;
                        value.data.id = output?.outputId;
                        outputObjects.set(output?.outputId, value);
                    }

                    ai.promptOutputs = ai.promptOutputs.map((item) => {
                        if (item.id === skeletonID) {
                            item.id === output?.outputId;
                        }
                        return item;
                    });

                    ai.stopStreaming();
                    ai._requestInProgress = false;
            };

            if (aiOptions?.service) {
                const serviceIsString = typeof aiOptions.service === "string";
                const url = serviceIsString ? aiOptions.service : aiOptions.service.url;

                if (url) {
                    aiService = {
                        ...defaults,
                        ...(!serviceIsString ? aiOptions.service : {}),
                        url: url,
                    };
            }
            }

            const skeletonID = "skeleton" + kendo.guid();
            const aiAssistant = that._aiAssistant = $("<div></div>").kendoAIPrompt($.extend(true, {
                service: aiService,
                speechToText: true,
                outputTemplate: (data) => {
                    const outputObject = data.output;
                    const template = (message) => {
                        if (message.includes(messages.error)) {
                            return `<p class="k-text-error">${kendo.htmlEncode(message)}</p>`;
                        } else {
                            return `<div class="k-card-text">${kendo.htmlEncode(message)}</div>`;
                        }
                    };

                    return outputObject.output?.split("/n").map((line) => template(line)).join("");
                },
                views: [
                    {
                        type: 'prompt',
                        buttonIcon: "sparkles",
                        themeColor: "primary",
                        footerTemplate: () => `<div class="k-actions k-actions-start k-actions-horizontal k-prompt-actions">${kendo.html.renderButton(`<button ref-ai-apply-button>Apply</button>`, {
                            themeColor: "primary",
                            icon: "table-wizard",
                            fillMode: "solid",
                            rounded: "full",
                        })}</div>`,
                    },
                    {
                        type: 'output',
                        themeColor: "primary",
                        isStreaming: true,
                        isLoading: true,
                    }
                ],
                promptRequest: (e) => {
                    if (!aiAssistant.options.service) {
                        return;
                    }

                    aiAssistant.activeView("output");
                    aiAssistant.removePromptOutput(placeholderId);

                    aiAssistant.addPromptOutput({
                        id: skeletonID,
                        prompt: e.prompt,
                        output: "",
                        isLoading: true,
                        isStreaming: true
                    });
                    aiAssistant._requestInProgress = true;
                    aiAssistant.transport.options.requestStart = null;
                },
                promptResponse: (e) => {
                    e.preventDefault();
                    const output = e;

                    handleResponse(output, aiAssistant);

                    if (output && output.response) {
                        that._handleAIResponse(output.response);
                    }

                    if (aiOptions.autoClose === false) {
                        return;
                    }

                    that._aiAssistantWindow?.close();
                },
                promptRequestCancel: () => {
                    aiAssistant.removePromptOutput(skeletonID);
                    if (!aiAssistant.outputObjects.size) {
                        aiAssistant.addPromptOutput(promptPlaceholderOptions(messages));
                    }

                    aiAssistant._requestInProgress = false;
                }
            }, promptConfig)).data('kendoAIPrompt');

            if (aiAssistant?.transport) {
                aiAssistant.transport.options.error = function(res) {
                    res.response.abort();
                    handleResponse({ output: res.output, outputId: res.id }, aiAssistant);
                };
            }

            that._aiAssistantWindow.element.append(that._aiAssistant.element);

            that._aiAssistantWindow.wrapper.addClass("k-grid-assistant-window");
        },

        _handleAIResponse: function(response) {
            const that = this;
            const sortable = that.options.columnMenu.sortable !== false && that.options.sortable !== false ? extend({}, that.options.sortable, { allowUnsort: false }) : false;
            const filterable = that.options.filterable && that.options.columnMenu.filterable !== false ? extend(true, { pane: that.pane }, that.options.filterable) : false;
            const groupable = (that.options.groupable && that.options.groupable.enabled !== false) || that.dataSource._groupPaging;
            const schema = that.dataSource.options.schema;
            const fields = schema?.model?.fields;

            if (response) {
                Object.keys(response).forEach((key) => {
                    if (key === "messages") {
                        return;
                    }

                    let value = response[key];
                    const valueIsArray = Array.isArray(value);
                    const isClearValue = (valueIsArray && !value.length) || (!valueIsArray && typeof value === "object" && !Object.keys(value).length);

                    const isValidOperation = isClearValue || (!isClearValue && !hasInvalidDescriptor(value, key));

                    if (!isValidOperation) {
                        return;
                    }

                    if (!isClearValue) {
                        value = valueIsArray ? value : [value];
                    }

                    if (key === "sort" && sortable) {
                        if (isClearValue && !that.dataSource._sort) {
                            return;
                        }

                        that.dataSource.sort(value);
                    }

                    if (key === "filter" && filterable) {
                        if (!isClearValue) {
                            value = parseDate(value, fields);
                        } else if (isClearValue && !that.dataSource._filter) {
                            return;
                        }
                        that.dataSource.filter(value);
                    }

                    if (key === "group" && groupable) {
                        if (isClearValue && !that.dataSource._group) {
                            return;
                        }
                        that.dataSource.group(value);
                    }

                    if (key === "highlight") {
                        that.clearHighlight();

                        if (!isClearValue) {
                            that._hasAIHighlight = value;
                            that._applyAIHighlight(value);
                        }
                    }
                });
            }
        },

        _bindAIPrompt: function() {
            const that = this;
            const aiOptions = that.options.ai;
            const aiAssistant = that._aiAssistant;
            const getGenerateOutputButton = (element) => element.find("[ref-ai-apply-button]");

            aiAssistant.element.on("input" + NS, "[ref-prompt-input]", (e) => {
                const button = getGenerateOutputButton(aiAssistant.element);
                const value = $(e.currentTarget).val();

                button.toggleClass("k-disabled", !value || value.trim() === "");
            });

            if (aiOptions?.aiAssistant?.promptSuggestions) {
                aiAssistant.element.on("click" + NS, ".k-suggestion", (e) => {
                    getGenerateOutputButton(aiAssistant.element).toggleClass("k-disabled", false);
                });
            }

            aiAssistant.element.on("click" + NS, "[ref-ai-apply-button]", () => {
                const prompt = aiAssistant.element.find("[ref-prompt-input]").getKendoTextArea().value();
                const promptView = aiAssistant._selectedView;
                const eventArgs = { prompt, isRetry: false, history: [] };

                if (promptView?.service) {
                    eventArgs.service = promptView.service;
                }

                aiAssistant.trigger("promptRequest", eventArgs);

                if (aiAssistant.transport) {
                    aiAssistant.transport.read({ prompt: eventArgs.prompt, history: eventArgs.history, isRetry: false, service: promptView.service });
                }
            });

            if (aiAssistant?.speechToTextButton) {
                aiAssistant.speechToTextButton.bind("result", function() {
                    getGenerateOutputButton(aiAssistant.element).toggleClass("k-disabled", false);
                });
            }
        },

        _unbindAIPrompt: function() {
            const that = this;
            const aiAssistant = that._aiAssistant;

            aiAssistant?.element?.off("input" + NS);
            aiAssistant?.element?.off("click" + NS);

        },

        _applyAIHighlight: function(value) {
            const that = this;
            const schema = that.dataSource.options.schema;
            const idField = schema?.model?.id || "id";
            const fields = schema?.model?.fields;
            value = parseDate(value, fields);

            const data = that.dataSource.parseHighlightDescriptors(value, idField);
            that.highlight(data);
        },

        _initAiAssistantWindow: function(cell) {
            const that = this;
            const aiOptions = that.options.ai;
            const skipInitialization = (aiOptions && aiOptions === true) || aiOptions === false;
            const userConfig = aiOptions?.aiAssistantWindow || {};
            const customContent = userConfig?.content;
            const windowOptions = {
                modal: false,
                resizable: false,
                title: "AI Assistant",
                visible: false,
                actions: [ "Minimize", "Maximize", "Close" ],
                position: {
                    top: outerHeight(cell) + cell.offset().top,
                    left: cell.offset().left + (cell.outerWidth() / 2)
                },
                width: 437,
                ...userConfig,
                open: function(e) {
                    if (userConfig.open) {
                        userConfig.open(e);
                    }

                    if (e._defaultPrevented) {
                        return;
                    }

                    const ai = that._aiAssistant;
                    if (ai && ai.element) {
                        const messages = that.options.messages?.ai;

                        if (!ai.outputObjects.size) {
                            ai.addPromptOutput(promptPlaceholderOptions(messages));
                        }

                        ai.activeView("prompt");
                        const button = ai.element.find("[ref-ai-apply-button]");
                        const value = ai.element.find("[ref-prompt-input]").val();

                        if (that._aiAssistant) {
                            that._bindAIPrompt();
                        }

                        button.toggleClass("k-disabled", !value || value.trim() === "");
                    }
                },
                close: function(e) {
                    if (userConfig.close) {
                        userConfig.close(e);
                    }

                    if (e._defaultPrevented) {
                        return;
                    }

                    if (e.userTriggered) {
                        e.sender.element.trigger("focus");
                        var currentIndex = that.items().index($(that.current()).parent());

                        that._toggleToolbarEditingItemsVisibility();
                        if (that.options.navigatable && that.current()) {
                            that._setCurrent(that.items().eq(currentIndex).children().filter(NAVCELL).first());
                                focusTable(that.table, true);
                        }
                    }
                    if (that._aiAssistant) {
                        if (!aiOptions?.keepOutputHistory) {
                            that._aiAssistant?.clearOutput();
                        }
                        that._unbindAIPrompt();
                    }
                },
                };

            if (!skipInitialization) {
                that._aiAssistantWindow = $("<div></div>").kendoWindow(windowOptions).data("kendoWindow");

                if (!customContent) {
                    that._initAiPrompt();
                }
            }

            cell.bind("click" + NS, function(e) {
                if (!that._aiAssistantWindow) {
                    return;
                }

                if (that._aiAssistantWindow.element.is(":visible")) {
                    that._aiAssistantWindow.close();
                } else {
                    that._aiAssistantWindow.open();
                }
            });
        },

        _toolbarOptionsForTool: function(toolName) {
            const that = this;
            const options = that.options;
            let toolbarItems = [];


            if (Array.isArray(options.toolbar)) {
                toolbarItems = options.toolbar;
            } else if (options.toolbar && options.toolbar.items) {
                toolbarItems = options.toolbar.items;
            }

            return extend({}, defaultCommands[toolName], toolbarItems.find((item) => item.name === toolName));
        },

        _groupToolbarTool: function(cell) {
            const that = this;
            const options = that.options;
            const clearGroupButton = (cell) => {
                const clearGroupSelector = that._isAdaptive() ? "[ref-actionsheet-action-button]:not('.k-button-solid-primary')" : "[ref='clear-group']";
                return that._toolPopup(cell)?.find(clearGroupSelector);
            };

            let menu;
            let menuOptions;

            const groupable = (options.groupable && options.groupable.enabled !== false) || that.dataSource._groupPaging;

            if (!groupable) {
                return;
            }

            menu = cell.data("kendoColumnMenu");
            if (menu) {
                menu.wrapper.off("click" + NS);
                menu.element.off("click" + NS);
                menu.destroy();
            }

            const toolbarGroupOptions = that._toolbarOptionsForTool("group");

            // Currently we want to distribute reordering throught the buttons as a default and only behaviour
            // the user wont be able to set it throught the options by himself
            toolbarGroupOptions.reorderButtons = true;

            const indicator = ({ isAdaptive, isFirstItem, isLastItem }) => (
                `<span class="k-group-menu-item-actions">
                ${toolbarGroupOptions.reorderButtons ?
                    `<span class="k-group-menu-item-action k-group-menu-item-up-action ${isFirstItem ? "k-disabled" : ""}" ${isFirstItem ? "aria-disabled=true" : "aria-disabled=false"}>
                    ${kendo.ui.icon($('<span></span>'), { icon: "chevron-up", size: isAdaptive ? "large" : "medium" })}
                </span>
                <span class="k-group-menu-item-action k-group-menu-item-down-action ${isLastItem ? "k-disabled" : ""}" ${isLastItem ? "aria-disabled=true" : "aria-disabled=false"}>
                    ${kendo.ui.icon($('<span></span>'), { icon: "chevron-down", size: isAdaptive ? "large" : "medium" })}
                </span>`
                    :
                    `<span class="k-group-menu-item-action k-group-menu-item-drag-action">
                    ${kendo.ui.icon($('<span></span>'), { icon: "handle-drag-dots", size: isAdaptive ? "large" : "medium" })}
                    </span>`}
                </span>`);

            const itemTemplate = (column, action, options) => {
                const isAdaptive = that._isAdaptive();
                const title = (column.title || column.field || "");
                return `<div class="k-group-menu-item" data-field="${column.field}" data-index="${(options && options.index) || column.index || "0"}" tabindex="0">
                ${(options && options.renderIndicator) ? indicator({ isAdaptive: isAdaptive, isFirstItem: options.isFirstItem, isLastItem: options.isLastItem }) : ""}
                        <span class="k-group-item-text">${title}</span>
                        <span class="k-spacer"></span>
                        <span class="k-group-menu-item-actions">
                            <span class="k-group-menu-item-action ${action.actionClass}">
                                ${kendo.ui.icon($('<span></span>'), { ...action, size: isAdaptive ? "large" : "medium" })}
                            </span>
                        </span>
                    </div>`;
            };

            const content = ({ columns }) => {
                const isAdaptive = that._isAdaptive();
                let content = `<div class="k-group-menu k-group-menu-md"><div class='k-group-menu-item-wrap'>`;

                columns.forEach((column) => {
                    if (!isColumnGroupable(that, column) || column.command || column._originalObject.selectable) {
                        return;
                    }
                    content += itemTemplate(column, { icon: "plus-circle", actionClass: "k-group-menu-item-add-action" });
                });
                content += `</div>`;

                if ((!toolbarGroupOptions || toolbarGroupOptions.clearButton) && !isAdaptive) {
                    content += `<div class="k-actions k-actions-stretched k-actions-horizontal k-column-menu-footer">
                                     ${kendo.html.renderButton(`<button ref="clear-group">${defaultActionSheetFooterButtons(that.options.messages).group[0].text}</button>`, { icon: "x" })}
                                </div>`;
                }

                content += `</div>`;

                return content;
            };

            menuOptions = {
                dataSource: that.dataSource,
                columns: false,
                sortable: false,
                filterable: false,
                hideAutoSizeColumn: false,
                owner: that,
                adaptiveMode: that.options.adaptiveMode,
                encodeTitles: that.options.encodeTitles,
                componentType: "modern",
                _actionsheet: {
                    actionButtons: defaultActionSheetFooterButtons(that.options.messages).group,
                    title: "Group by",
                    ref: "group-view",
                    closeButton: {
                        icon: "check",
                        themeColor: "primary",
                    },
                },
                init: function(e) {
                    const element = cell.wrapper.find(".k-group-menu");
                    element.attr("ref", "group-tool");

                    if (cell._showAdaptiveView) {
                        element.unwrap();
                        element.removeClass("k-group-menu-md").addClass("k-group-menu-lg");
                    } else {
                        cell.wrapper.removeClass("k-column-menu");
                    }

                    element.find(".k-group-menu-item").on("click" + NS, `.k-group-menu-item-remove-action, .k-group-menu-item-add-action`, function(e) {
                        that._groupItemClickHandler(e, cell, { itemTemplate, indicator });
                    });

                    that._syncGroupingTool(e, cell, that.dataSource.group(), { itemTemplate, indicator });
                },
                closeCallback: function(e) {
                    e.removeClass(SELECTED);
                    const popupElement = that._toolPopup(cell);
                    if (popupElement.length) {
                        popupElement.find(".k-focus").removeClass("k-focus");
                    }
                    cell.element.focus();
                },
                contentTemplate: content,
            };

            let oldGroups = that.dataSource.group() || [];
            cell = cell.kendoColumnMenu(menuOptions).data("kendoColumnMenu");

            const groupToolHandler = function(e) {
                const that = this;
                const cell = e.sender.wrapper && e.sender.wrapper.find(".k-grid-group-tool")?.data("kendoColumnMenu");
                const groups = e.groups || that.dataSource.group() || [];
                const clearButton = clearGroupButton(cell);

                const groupedData = oldGroups.length > groups.length ? oldGroups : groups;
                that._syncGroupingTool(e, cell, groupedData, { itemTemplate, indicator });
                that._toggleBadge(cell.element, groups.length > 0);
                clearButton?.toggleClass("k-disabled", !groups.length);
                oldGroups = groups;
            };

            that.unbind("group", groupToolHandler);
            that.bind("group", groupToolHandler);

            cell.element.on("click" + NS, function(e) {
                if (cell.popup && cell.popup._closing) {
                    return;
                }
                $(e.currentTarget).addClass(SELECTED);
            });

            cell.bind("open", function() {
                const clearButton = clearGroupButton(cell);

                if (clearButton.length) {
                    clearButton.off("mousedown" + NS);

                    clearButton.on("mousedown" + NS, function() {
                        that.dataSource.group([]);
                        that.groupable.trigger(CHANGE, { groups: [] });
                        that._toggleBadge(cell.element, false);
                        clearButton?.toggleClass("k-disabled", true);
                        cell.popup.close();
                    });
                }

                clearButton?.toggleClass("k-disabled", !that.dataSource.group().length);
            });
        },

        _toggleReorderButtonsDisabledState: function(item, isFirstItem, isLastItem) {
            const disabled = "k-disabled";

            if (!item.length) {
                return;
            }

            const firstReorderButton = item.find(".k-group-menu-item-actions .k-group-menu-item-up-action");

            if (firstReorderButton.length) {
                if (isFirstItem && !firstReorderButton.hasClass(disabled)) {
                    firstReorderButton.addClass(disabled);
                    firstReorderButton.attr("aria-disabled", true);
                } else if (!isFirstItem && firstReorderButton.hasClass(disabled)) {
                    firstReorderButton.removeClass(disabled);
                    firstReorderButton.attr("aria-disabled", false);
                }

                const prevItem = firstReorderButton.next();

                if (prevItem.length) {
                    if (isLastItem && !prevItem.hasClass(disabled)) {
                        prevItem.addClass(disabled);
                        prevItem.attr("aria-disabled", true);
                    } else if (!isLastItem && prevItem.hasClass(disabled)) {
                        prevItem.removeClass(disabled);
                        prevItem.attr("aria-disabled", false);
                    }
                }
            }
        },

        _syncGroupingTool: function(ev, cell, groupedData, templates) {
            const that = this;
            const groups = ev.groups || that.dataSource.group() || [];
            const getWrapper = () => (cell._showAdaptiveView ? that._toolPopup(cell) : cell.wrapper);
            const containerClass = "k-group-menu-item-wrap";
            const findContainers = () => getWrapper()?.find(`.${containerClass}`);
            const itemSelector = ".k-group-menu-item";
            const wrapper = getWrapper();
            let containers = findContainers();

            if (cell._draggableInstance && cell._triggeredReordering) {
                delete cell._triggeredReordering;
                return;
            }

            if (containers && containers.length) {

                groupedData.forEach((group, i) => {
                    const item = wrapper.find(itemSelector + `[data-field='${group.field}']`);
                    const index = item.data("index");
                    const action = item.find(".k-icon")?.attr("class").includes("plus-circle") ? "remove" : "add";
                    const shouldAdd = action === "remove";
                    const actionClass = `k-group-menu-item-${action}-action`;
                    const parentContainer = item.parent();
                    containers = findContainers();

                    let isFirstItem = groups && groups.length ? groups[0]?.field === group.field : false;
                    let isLastItem = groups && groups.length ? groups[groups.length - 1].field === group.field : false;

                    that._toggleReorderButtonsDisabledState(item, isFirstItem, isLastItem);

                    const isRemoveAction = !(groups.find((descriptor) => descriptor.field === group.field));

                    if (!isRemoveAction && parentContainer.is("[ref='group-container']")) {
                        return;
                    }

                    let container;

                    if (containers && containers.length === 2) {
                        container = shouldAdd ? containers.first() : containers.last();
                    } else {
                        container = $(`<div class="${containerClass}" ${shouldAdd ? 'ref="group-container' : ""}"></div>`);
                        const method = shouldAdd ? "prepend" : "append";
                        const containersWrapper = containers.first().parent();
                        const clearBtn = containersWrapper.find("[ref='clear-group']");

                        if (clearBtn.length && !shouldAdd) {
                            clearBtn.parent().before(container);
                        } else if (containersWrapper.length) {
                            containersWrapper[method](container);
                        }
                    }

                    const column = leafColumns(that.columns)[index];
                    const shouldAddDragIndicator = !isRemoveAction && groups.length > 1;
                    const templateOptions = {
                        renderIndicator: shouldAddDragIndicator,
                        index,
                        isFirstItem,
                        isLastItem,
                    };
                    const groupedItem = $(templates.itemTemplate(column, { icon: shouldAdd ? "x-circle" : "plus-circle", actionClass: actionClass }, templateOptions));

                    item.remove();

                    const shouldRemoveContainer = containers.length === 2 && !parentContainer.children().length;

                    if (shouldRemoveContainer) {
                        if (parentContainer.data("kendoReorderable")) {
                            parentContainer.data("kendoReorderable")?.destroy();
                        }
                        parentContainer.remove();
                    }

                    if (shouldAdd) {
                        if (shouldAddDragIndicator) {
                            const firstItem = container.children().first();
                            if (firstItem.find(".k-group-menu-item-actions")?.length === 1) {
                                firstItem.prepend(templates.indicator({
                                    isAdaptive: that._isAdaptive(),
                                    isFirstItem: true,
                                    isLastItem: false,
                                }));
                            }
                        }
                        container.append(groupedItem);
                    } else {
                        const nextItem = container.find(itemSelector + `[data-index="${index + 1}"]`);
                        if (groups.length === 1) {
                            const firstItem = parentContainer.children().first();

                            firstItem.find(".k-group-menu-item-actions:first-of-type").remove();
                        }

                        if (nextItem.length) {
                            nextItem.before(groupedItem);
                        } else {
                            container.append(groupedItem);
                        }
                    }

                    container.find(groupedItem).on("click" + NS, `.k-group-menu-item-remove-action, .k-group-menu-item-add-action`, function(e) {
                        that._groupItemClickHandler(e, cell);
                    });
                });

                containers = findContainers();

                if (containers && containers.length) {
                    const dragIndicators = containers.first().find(".k-group-menu-item-drag-action");
                    const reorderButtons = containers.first().find(".k-group-menu-item-up-action, .k-group-menu-item-down-action");
                    const container = containers.first();
                    const hasContainer = container.is("[ref='group-container']") && container?.length;
                    const initDragInstance = dragIndicators.length;
                    const initButtonsReordering = reorderButtons.length;

                    if (hasContainer && initButtonsReordering) {
                        reorderButtons.each(function() {
                            const button = $(this);
                            button.unbind("click" + NS);
                            button.bind("click" + NS, (e) => that._buttonClickReorderHandler(e, cell));
                        });
                    } else if (hasContainer && initDragInstance) {
                        that._groupToolDraggableInstance(cell, container);
                        that._groupToolReorderableInstance(cell, container);
                    }
                }
            }
        },

        _buttonClickReorderHandler: function(e, cell) {
            e.preventDefault();
            e.stopPropagation();

            const that = this;
            const itemSelector = ".k-group-menu-item";
            const clicked = $(e.currentTarget);
            const element = clicked.closest(itemSelector);

            const position = clicked.hasClass("k-group-menu-item-up-action") ? "before" : "after";
            const target = position === "before" ? element.prev(itemSelector) : element.next(itemSelector);

            const evData = {
                element,
                target,
                position,
            };

            that._handleGroupReordering(evData, cell);
        },

        _groupToolDraggableInstance: function(cell, container) {
            const that = this;
            const isMobile = that._isMobile;

            cell._draggableInstance = container.kendoDraggable({
                holdToDrag: isMobile,
                showHintOnHold: isMobile,
                preventOsHoldFeatures: isMobile,
                group: "group-item-draggable",
                autoScroll: true,
                filter: ".k-group-menu-item-drag-action",
                hint: function(target) {
                    var hint = $('<div class="k-reorder-clue k-drag-clue">' + kendo.ui.icon({ icon: "cancel", iconClass: "k-drag-status" }) + '</div>');
                    return hint;
                },
                clickMoveClick: false,
                cursorOffset: { top: 0, left: 0 }
            }).data("kendoDraggable");
        },

        _groupToolReorderableInstance: function(cell, container) {
            const that = this;
            const itemSelector = ".k-group-menu-item";

            if (container && container.data("kendoReorderable")) {
                container.data("kendoReorderable").destroy();
            }

            container.kendoReorderable({
                smartPosition: false,
                draggable: cell._draggableInstance,
                dragOverContainers: function(sourceIndex, targetIndex) {
                    var result = true;
                        $(itemSelector).eq(targetIndex);

                    return result;
                },
                dropFilter: "> " + itemSelector,
                allowIcon: "insert-middle",
                orientation: "vertical",
                reorderDropCue: $('<div class="k-drop-hint k-drop-hint-h"><div class="k-drop-hint-start"></div><div class="k-drop-hint-line"></div></div>'),
                positionDropCue: function(reorderDropCue) {
                    reorderDropCue.css({
                        transform: "translate(0,-50%)",
                    });
                },
                externalDraggable: function(e) {
                    var draggable = e.draggable;

                    if (draggable) {
                        return draggable;
                    }
                },
                change: function(e) {
                    that._handleGroupReordering(e, cell);
                }
            });
        },

        _handleGroupReordering: function(e, cell) {
            const element = e.element;
            const newSibling = e.target;
            const method = e.position === "before" ? "insertBefore" : "insertAfter";

            const descriptors = this.groupable.descriptors();

            element[method](newSibling);

            const items = element.parent().children();
            const newDescriptors = [];

            for (let i = 0; i < items.length; i++) {
                const field = $(items[i]).data("field");
                const descriptor = descriptors.find((d) => d.field === field);

                if (descriptor) {
                    newDescriptors.push(descriptor);
                }
            }
            cell._triggeredReordering = true;
            this.dataSource.group(newDescriptors);
            this.groupable.trigger(CHANGE, { groups: newDescriptors });
        },

        _groupItemClickHandler: function(e, cell) {
            const that = this;
            const itemSelector = ".k-group-menu-item";
            const item = $(e.currentTarget).closest(itemSelector);
            const action = $(e.currentTarget).find(".k-icon")?.attr("class").includes("plus-circle") ? "remove" : "add";
            const shouldAdd = action === "remove";
            const index = item.data("index");


            let descriptors = that.groupable.descriptors();

            if (!descriptors.length) {
                descriptors = that.dataSource.group();
            }

            const column = leafColumns(that.columns)[index];

            if (shouldAdd) {
                descriptors.push({ field: column.field, dir: "asc", aggregates: that.groupable.aggregates() || [], colID: column.uid, compare: (column.sortable && column.sortable.compare) || (that.groupable.sort && that.groupable.sort.compare) });
            } else {
                descriptors = descriptors.filter((descriptor) => descriptor.field !== column.field);
            }
            that.dataSource.group(descriptors);
            that.groupable.trigger(CHANGE, { groups: descriptors });
        },

        _sortToolbarTool: function(cell) {
            const that = this;
            const options = that.options;
            const selectorClass = "k-columnmenu-indicators";
            const isAdaptive = that._isAdaptive();
            const clearSortButton = (cell) => {
                const clearSortSelector = that._isAdaptive() ? "[ref-actionsheet-action-button]:not('.k-button-solid-primary')" : "[ref='clear-sort']";
                return that._toolPopup(cell)?.find(clearSortSelector);
            };

            let menu;
            let menuOptions;

            const toolbarSortOptions = that._toolbarOptionsForTool("sort");

            menu = cell.data("kendoColumnMenu");
            if (menu) {
                menu.wrapper.off("click" + NS);
                menu.element.off("click" + NS);
                menu.destroy();
            }

            function content({ columns, isAdaptive }) {
                let content = `<div class="k-columnmenu-item-wrapper">`;
                columns.forEach((column) => {
                    if (column.sortable === false || column.command || column._originalObject.draggable || column._originalObject.selectable) {
                        return;
                    }
                    content += `<div class="k-columnmenu-item" tabindex="0" data-field="${column.field}">${column.title || column.field || ""}</div>`;
                });

                content += "</div>";
                if ((!toolbarSortOptions || toolbarSortOptions.clearButton) && !isAdaptive) {
                    content += `<div class="k-actions k-actions-stretched k-actions-horizontal k-column-menu-footer">`;

                    content += kendo.html.renderButton(`<button ref="clear-sort">${defaultActionSheetFooterButtons(that.options.messages).sort[0].text}</button>`, { icon: "x" });

                    content += "</div>";
                }

                return content;
            }
            const sortable = options.columnMenu.sortable !== false && options.sortable !== false ? extend({}, options.sortable, { allowUnsort: false }) : false;

            if (!sortable) {
                return;
            }

            menuOptions = {
                dataSource: that.dataSource,
                columns: false,
                sortable: sortable,
                filterable: false,
                hideAutoSizeColumn: true,
                owner: that,
                adaptiveMode: that.options.adaptiveMode,
                encodeTitles: that.options.encodeTitles,
                componentType: "modern",
                _actionsheet: {
                    actionButtons: defaultActionSheetFooterButtons(that.options.messages).sort,
                    title: "Sort by",
                    ref: "sort-view",
                    closeButton: {
                        icon: "check",
                        themeColor: "primary",
                    },
                },
                init: function(e) {
                    cell.wrapper.attr("ref", "sort-tool");
                },
                closeCallback: function(e) {
                    e.removeClass(SELECTED);
                    const popupElement = that._toolPopup(cell);
                    if (popupElement.length) {
                        popupElement.find(".k-focus").removeClass("k-focus");
                    }
                    cell.element.focus();
                },
                sort: function(e) {
                    const preventClose = e.preventClose;

                    cell._preventClose = that.options.sortable.mode === "multiple" || preventClose;

                    if (that.trigger("sort", { sort: e.sort })) {
                        e.preventDefault();
                    } else {
                        that._clearEditableState();
                        if (that.dataSource.options.endless) {
                            that._resetEndless();
                        }
                    }
                },
                contentTemplate: content,
            };

            cell = cell.kendoColumnMenu(menuOptions).data("kendoColumnMenu");

            const sortToolHandler = function(e) {
                const cell = e.sender.wrapper && e.sender.wrapper.find(".k-grid-sort-tool")?.data("kendoColumnMenu");
                const dataSource = e.sender.dataSource;
                const sortFields = dataSource._sortFields;
                const isArray = Array.isArray(e.sort);
                const field = e.sort.field;
                const isMultiSortingEnabled = e.sender.options.sortable && (e.sender.options.sortable.mode === "multiple" || e.sender.options.sortable.mode === "mixed");
                let condition;
                let isUnsortEvent = e.sort.dir === undefined$1;

                if (isArray) {
                    condition = e.sort.length;
                } else if (sortFields && Object.keys(sortFields).length) {
                    condition = !isUnsortEvent || isUnsortEvent && Object.keys(sortFields).length - 1 > 0;
                } else {
                    condition = !isUnsortEvent;
                }


                that._toggleBadge(cell.element, condition);


                const element = cell.wrapper.find(`.k-columnmenu-item[data-field='${field}']`);
                let indicatorsWrapper = element.find("." + selectorClass);

                if (isUnsortEvent) {
                    indicatorsWrapper.remove();
                } else {
                    if (!isMultiSortingEnabled) {
                        indicatorsWrapper = cell.wrapper.find("." + selectorClass);
                    }

                    if (indicatorsWrapper.length) {
                        indicatorsWrapper.remove();
                    }

                    element.append(that._renderIndicator(`sort-${e.sort.dir}-small`));
                }

                clearSortButton(cell)?.toggleClass("k-disabled", !condition);
            };

            that.unbind("sort", sortToolHandler);
            that.bind("sort", sortToolHandler);

            cell.bind("open", function() {
                const popupElement = that._toolPopup(cell);

                if (popupElement.length) {
                    popupElement.focus();
                    const clearSortBtn = clearSortButton(cell);
                    const items = popupElement.find(".k-columnmenu-item");

                    if (clearSortBtn.length) {
                        clearSortBtn.off("mousedown" + NS);

                        clearSortBtn.on("mousedown" + NS, function() {
                            that.dataSource.sort([]);
                            that._toggleBadge(cell.element, false);
                            clearSortButton(cell)?.toggleClass("k-disabled", true);
                            cell.wrapper.find(".k-columnmenu-indicators").remove();
                            cell.close();
                        });
                    }

                    if (items.length) {
                        popupElement.off("click" + NS);

                        popupElement.on("click" + NS, ".k-columnmenu-item", function(e) {
                            const currentTarget = $(e.currentTarget);
                            const field = currentTarget.data("field");
                            const unsort = that._toggleColumnMenuSortIndicator(currentTarget);
                            const isMixed = that.options.sortable && that.options.sortable.mode === "mixed";
                            const hasCtrlKey = e.originalEvent.ctrlKey;

                            cell.field = field;
                            cell._sortHandler({ item: currentTarget, allowUnsort: unsort, allowSelectedState: false, isMixed, hasCtrlKey });
                            that._toggleSortIndexes(that.dataSource._sortFields && Object.keys(that.dataSource._sortFields).length > 1, cell, selectorClass);
                        });
                    }
                }
            });

            cell.element.on("click" + NS, function(e) {
                if (cell.popup && cell.popup._closing) {
                    return;
                }
                $(e.currentTarget).addClass(SELECTED);
                const sortFields = cell.dataSource._sortFields;
                const condition = sortFields && Object.keys(sortFields).length;
                const shouldRenderIndexes = Object.keys(sortFields).length > 1;

                if (condition) {
                    Object.keys(sortFields).forEach((sortField) => {
                        const element = cell.wrapper.find(`.k-columnmenu-item[data-field='${sortField}']`);
                        const indicator = element.find("." + selectorClass);

                        if (indicator.length) {
                            indicator.remove();
                        }

                        element.append(that._renderIndicator(`sort-${sortFields[sortField].dir}-small`));
                    });
                }
                that._toggleSortIndexes(shouldRenderIndexes, cell, selectorClass, isAdaptive);

                clearSortButton(cell)?.toggleClass("k-disabled", !condition);
            });
        },

        _toggleSortIndexes: function(condition, cell, selector) {
            const that = this;
            const showIndexes = that.options.sortable && that.options.sortable.showIndexes;

            if (!showIndexes) {
                return;
            }
            const indicators = cell.wrapper.find(`.${selector}`);
            let sortFields = cell.dataSource && cell.dataSource._sortFields;

            if (!indicators.length) {
                return;
            }

            if (condition) {
                indicators.each((index, indicator) => {
                    const field = $(indicator).closest(".k-columnmenu-item").data("field");
                    const sortField = sortFields[field];
                    const sortIndex = $(indicator).parent().find(".k-sort-index");

                    if (!sortIndex.length) {
                        if (sortField.index) {
                            $(indicator).append(`<span class='k-sort-index'>${sortField.index}</span>`);
                        } else {
                            $(indicator).append(`<span class='k-sort-index'>${index + 1}</span>`);
                        }
                    } else {
                        sortIndex.text(sortField.index);
                    }
                });
            } else {
                cell.wrapper.find(".k-sort-index").remove();
            }
        },

        _columnChooserTool: function(cell) {
            const that = this;
            const templateRef = "column-chooser";

            function content(config) {
                const template = config._defaultContents()[templateRef];

                return template(config);
            }

            const menu = cell.data("kendoColumnMenu");
            if (menu) {
                menu.wrapper.off("click" + NS);
                menu.element.off("click" + NS);
                menu.destroy();
            }

            const menuOptions = {
                dataSource: that.dataSource,
                columns: that.columns,
                sortable: false,
                filterable: false,
                hideAutoSizeColumn: true,
                owner: that,
                adaptiveMode: that.options.adaptiveMode,
                encodeTitles: that.options.encodeTitles,
                messages: {
                    reset: that.options.messages.clearButtons ? that.options.messages.clearButtons.columnChooserReset : "Reset",
                    apply: that.options.messages.applyButtons ? that.options.messages.applyButtons.columnChooserApply : "Apply",
                },
                componentType: "modern",
                contentTemplate: content,
                _actionsheet: {
                    actionButtons: defaultActionSheetFooterButtons(that.options.messages)[templateRef],
                    title: "Column visibility",
                    subtitle: "Selected fields are visible",
                    closeButton: true,
                    ref: `${templateRef}-view`,
                },
                init: function(e) {
                    cell.wrapper.attr("ref", templateRef + "-tool");
                    if (cell._showAdaptiveView) {
                        cell.popup._content.find(`[ref='${templateRef}']`).unwrap();
                    } else {
                        cell.wrapper.removeClass("k-column-menu");
                    }
                },
                closeCallback: function(e) {
                    e.removeClass(SELECTED);
                    const popupElement = that._toolPopup(cell);
                    if (popupElement.length) {
                        popupElement.find(".k-focus").removeClass("k-focus");
                    }
                    if (cell && cell._showAdaptiveView) {
                        cell._applyColumnVisibility();
                    }
                    cell.element.focus();
                },
            };

            cell = cell.kendoColumnMenu(menuOptions).data("kendoColumnMenu");

            cell.element.bind("click", function(e) {
                if (cell.popup && cell.popup._closing) {
                    return;
                }
                $(e.currentTarget).addClass(SELECTED);
            });

            cell.bind("open", function() {
                const popupElement = that._toolPopup(cell);

                if (popupElement.length) {
                    popupElement.find(".k-checkbox")?.first()?.focus();
                }
            });
        },

        _toggleBadge: function(cell, condition) {
            const badgeSelector = "k-badge-container";
            const badgeContainer = cell.closest(`.${badgeSelector}`);
            const badge = badgeContainer.length && badgeContainer.find(".k-badge");
            const overflowProp = cell.data("overflow");

            if (!badge.length && condition) {
                const badgeContainer = cell.wrap(`<div class='k-badge-container' ${overflowProp ? "data-overflow=" + overflowProp : ""}></div>`).parent();
                badgeContainer.append($('<span></span>').kendoBadge({
                    round: 'full',
                    position: 'edge',
                    align: 'top end',
                    themeColor: 'primary',
                    cutoutBorder: true,
                }));
            } else if (!condition && badge.length) {
                badge.remove();
                cell.unwrap(".k-badge-container");
            }
        },

        _toggleColumnMenuFilterIndicator: function(element, condition) {
            const that = this;
            const classSelector = ".k-columnmenu-indicators";
            const indicatorWrapper = element.find(classSelector);
            const spacer = element.find(".k-spacer");

            if (condition && spacer.length) {
                if (indicatorWrapper && indicatorWrapper.length) {
                    return;
                }

                spacer.before(that._renderIndicator("filter"));
            } else {
                if (indicatorWrapper && indicatorWrapper.length) {
                    indicatorWrapper.remove();
                }
            }
        },

        _toggleColumnMenuSortIndicator: function(element) {
            const that = this;
            const classSelector = ".k-columnmenu-indicators";
            const indicatorWrapper = element.find(classSelector);
            const sortIndex = element.find(".k-sort-index");

            let unsort;

            let action = !sortIndex.length ? "append" : "before";

            if (indicatorWrapper && indicatorWrapper.length) {
                const indicator = indicatorWrapper.find(".k-icon");

                if (indicator.length && indicator.hasClass("k-svg-i-sort-desc-small")) {
                    indicatorWrapper.remove();
                    unsort = true;
                } else {
                    indicator.remove();
                    indicatorWrapper[action](that._renderIndicator("sort-desc-small"));
                    unsort = false;
                }
            } else {
                element[action](that._renderIndicator("sort-asc-small"));
                unsort = false;
            }

            return unsort;
        },

        _renderIndicator: function(icon) {
            return $("<span class='k-columnmenu-indicators'></span>").append(
                kendo.ui.icon($('<span></span>'), { icon: icon })
            );
        },

        _globalColumnsMenu: function(cell) {
            var that = this,
                menu,
                columns = leafColumns(that.columns),
                options = that.options,
                columnMenu = options.columnMenu,
                menuOptions,
                initCallback = function(e) {
                    if (that._isAdaptive()) {
                        e.sender.popup.wrapper.find(".k-expanded [ref=columns-visibility]").data("handler").toggle(false);
                    }
                    that.trigger(COLUMNMENUINIT, { field: e.field, container: e.container });
                },
                openCallback = function(e) {
                    that.trigger(COLUMNMENUOPEN, { field: e.field, container: e.container });
                },
                closeCallback = function() {
                    cell.trigger("focus");
                };

            if (columnMenu) {
                if (typeof columnMenu == "boolean") {
                    columnMenu = {};
                }

                that._setColumnsMediaVisibility(columns);

                let toggleable = !!(columnMenu.autoSize || columnMenu.clearAllFilters);

                menu = cell.data("kendoColumnMenu");
                if (menu) {
                    menu.destroy();
                }

                let columnsExpanderOptions = {
                    toggleable: toggleable,
                    expanded: columnMenu.expanded || true,
                    animation: false,
                    hideExpanderIndicator: !toggleable
                };

                menuOptions = {
                    dataSource: that.dataSource,
                    columns: columnMenu.columns,
                    sortable: false,
                    filterable: false,
                    clearAllFilters: columnMenu.clearAllFilters,
                    messages: columnMenu.messages,
                    hideAutoSizeColumn: true,
                    owner: that,
                    closeCallback: closeCallback,
                    init: initCallback,
                    open: openCallback,
                    pane: that.options.adaptiveMode !== 'auto' && that.pane,
                    autoSize: columnMenu.autoSize,
                    encodeTitles: that.options.encodeTitles,
                    componentType: "modern",
                    adaptiveMode: "auto",
                    columnsExpanderOptions: columnsExpanderOptions
                };

                cell.kendoColumnMenu(menuOptions);
            }
        },

        _columnMenu: function() {
            var that = this,
                menu,
                columns = leafColumns(that.columns),
                column,
                options = that.options,
                columnMenu = options.columnMenu,
                menuOptions,
                sortable,
                filterable,
                cells,
                hasMultiColumnHeaders = grep(that.columns, function(item) {
                    return item.columns !== undefined$1;
                }).length > 0,
                hasLockableColumns = grep(that.columns, function(item) {
                    return item.lockable !== false;
                }).length > 0,
                hasStickableColumns = grep(that.columns, function(item) {
                    return item.stickable === true;
                }).length > 0,
                isMobile = this._isMobile,
                initCallback = function(e) {
                    that.trigger(COLUMNMENUINIT, { field: e.field, container: e.container });
                },
                openCallback = function(e) {
                    that.trigger(COLUMNMENUOPEN, { field: e.field, container: e.container });
                },
                closeCallback = function() {
                    focusTable(that.table, true);
                },
                stickCallback = function(e) {
                    that.trigger(COLUMNSTICK, { column: e.column });
                },
                unstickCallback = function(e) {
                    that.trigger(COLUMNUNSTICK, { column: e.column });
                },
                sortHandler = function(e) {
                    if (that.trigger("sort", { sort: e.sort })) {
                        e.preventDefault();
                    } else {
                        that._clearEditableState();
                        if (that.dataSource.options.endless) {
                            that._resetEndless();
                        }
                    }
                },
                filterHandler = function(e) {
                    if (that.trigger("filter", { filter: e.filter, field: e.field })) {
                        e.preventDefault();
                    } else {
                        that._clearEditableState();
                        if (that.dataSource.options.endless) {
                            that._resetEndless();
                        }
                    }
                };

            if (columnMenu && !that._isStackedMode()) {
                if (typeof columnMenu == "boolean") {
                    columnMenu = {};
                }

                that._setColumnsMediaVisibility(columns);

                cells = leafDataCells(that.thead);

                for (var idx = 0, length = cells.length; idx < length; idx++) {
                    column = columns[idx];
                    var cell = cells.eq(idx);

                    if (column.columnMenu !== false && !column.command && (column.field || cell.attr("data-" + kendo.ns + "field"))) {
                        menu = cell.data("kendoColumnMenu");
                        if (menu) {
                            menu.destroy();
                        }

                        sortable = column.sortable !== false && columnMenu.sortable !== false && options.sortable !== false ? extend({}, options.sortable, {
                            compare: (column.sortable || {}).compare
                        }) : false;

                        filterable = options.filterable && column.filterable !== false && columnMenu.filterable !== false ? extend(true, { pane: that.pane }, options.filterable, column.filterable) : false;

                        if (column.filterable && column.filterable.dataSource) {
                            filterable.forceUnique = false;
                            filterable.checkSource = column.filterable.dataSource;
                        }

                        if (filterable) {
                            filterable.format = column.format;
                        }

                        const isAdaptive = that.options.adaptiveMode !== "auto" ? (columnMenu.adaptiveMode || that.options.adaptiveMode) : that.options.adaptiveMode;

                        menuOptions = {
                            dataSource: that.dataSource,
                            values: column.values,
                            columns: columnMenu.columns,
                            sortable: sortable,
                            filterable: filterable,
                            messages: columnMenu.messages,
                            owner: that,
                            adaptiveMode: isAdaptive,
                            adaptiveTitle: column.title || column.field,
                            closeCallback: closeCallback,
                            init: initCallback,
                            open: openCallback,
                            stick: stickCallback,
                            unstick: unstickCallback,
                            pane: that.options.adaptiveMode !== 'auto' && that.pane,
                            sort: sortHandler,
                            filtering: filterHandler,
                            filter: isMobile ? ":not(.k-column-active)" : "",
                            autoSize: columnMenu.autoSize,
                            hasLockableColumns: lockedColumns(columns).length > 0 && hasLockableColumns && !hasMultiColumnHeaders,
                            hasStickableColumns: hasStickableColumns && !hasMultiColumnHeaders,
                            encodeTitles: that.options.encodeTitles,
                            componentType: columnMenu.componentType,
                            appendTo: DOT + classNames.headerCellInner,
                            reorderable: options.reorderable === true || (options.reorderable && options.reorderable.columns),
                            groupable: that.options.groupable && that.options.groupable.enabled !== false && column.groupable !== false
                        };

                        cell.kendoColumnMenu(menuOptions);
                    }
                }
            }
        },

        _headerCells: function() {
            return $(this.thead).find("th").filter(function() {
                var th = $(this);
                return !th.hasClass("k-group-cell") && !th.hasClass("k-hierarchy-cell");
            });
        },

        _hasFilterMenu: function() {
            var filterable = this.options.filterable;
            if (filterable && typeof filterable.mode == STRING && filterable.mode.indexOf("menu") == -1) {
                return false;
            }

            return filterable;
        },

        _filterable: function() {
            var that = this,
                columns = leafColumns(that.columns),
                filterMenu,
                cells,
                cell,
                filterInit = function(e) {
                    that.trigger(FILTERMENUINIT, { field: e.field, container: e.container });
                },
                closeCallback = function() {
                    focusTable(that.table, true);
                },
                filterHandler = function(e) {
                    if (that.trigger("filter", { filter: e.filter, field: e.field })) {
                        e.preventDefault();
                    } else {
                        that._clearEditableState();
                        if (that.dataSource.options.endless) {
                            that._resetEndless();
                        }
                    }
                },
                filterOpen = function(e) {
                    that.trigger(FILTERMENUOPEN, { field: e.field, container: e.container });
                },
                filterable = that._hasFilterMenu();

            if (filterable && !that.options.columnMenu && !that._isStackedMode()) {
                cells = leafDataCells(that.thead);//that._headerCells();

                for (var idx = 0, length = cells.length; idx < length; idx++) {
                    cell = cells.eq(idx);

                    if (columns[idx].filterable !== false && !columns[idx].command && (columns[idx].field || cell.attr("data-" + kendo.ns + "field"))) {
                        filterMenu = cell.data("kendoFilterMenu");

                        if (filterMenu) {
                            filterMenu.destroy();
                        }

                        filterMenu = cell.data("kendoFilterMultiCheck");
                        if (filterMenu) {
                            filterMenu.destroy();
                        }

                        var columnFilterable = columns[idx].filterable;

                        var options = extend({},
                            filterable,
                            columnFilterable,
                            {
                                dataSource: that.dataSource,
                                values: columns[idx].values,
                                format: columns[idx].format,
                                closeCallback: closeCallback,
                                title: columns[idx].title || columns[idx].field,
                                init: filterInit,
                                open: filterOpen,
                                pane: that.pane,
                                change: filterHandler,
                                appendTo: DOT + classNames.headerCellInner,
                                adaptiveMode: that.options.adaptiveMode
                            }
                        );

                        if (columnFilterable && columnFilterable.messages) {
                            options.messages = extend(true, {}, filterable.messages, columnFilterable.messages);
                        }
                        if (columnFilterable && columnFilterable.dataSource) {
                            options.forceUnique = false;
                            options.checkSource = columnFilterable.dataSource;
                        }

                        if (columnFilterable && columnFilterable.multi) {
                            cell.kendoFilterMultiCheck(options);
                        } else {
                            cell.kendoFilterMenu(options);
                        }
                    }
                }
            }
        },

        _filterRow: function() {
            var that = this;
            if (!that._hasFilterRow()) {
                return;
            }

            var settings;
            var columns = leafColumns(that.columns),
                filterable = that.options.filterable,
                rowheader = that.thead.find(".k-filter-row"),
                filterHandler = function(e) {
                    if (that.trigger("filter", { filter: e.filter, field: e.field })) {
                        e.preventDefault();
                    } else {
                        that._clearEditableState();
                        if (that.dataSource.options.endless) {
                            that._resetEndless();
                        }
                    }
                };


            this._updateHeader(that._groups());

            for (var i = 0; i < columns.length; i++) {
                var suggestDataSource,
                    col = columns[i],
                    operators = that.options.filterable.operators,
                    customDataSource = false,
                    td = $("<td class='k-table-td' title='" + that.options.messages.filterCellTitle + "'/>"),
                    field = col.field;

                if (col.hidden) {
                    td.hide();
                }
                rowheader.append(td);
                if (field && col.filterable !== false) {
                    var cellOptions = col.filterable && col.filterable.cell || {};

                    suggestDataSource = that.options.dataSource;
                    if (suggestDataSource instanceof DataSource) {
                        suggestDataSource = that.options.dataSource.options;
                    }

                    var messages = extend(true, {}, filterable.messages);
                    if (col.filterable) {
                        extend(true, messages, col.filterable.messages);
                    }

                    if (cellOptions.enabled === false) {
                        td.html("&nbsp;");
                        continue;
                    }
                    if (cellOptions.dataSource) {
                        suggestDataSource = cellOptions.dataSource;
                        customDataSource = true;
                    }
                    if (col.filterable && col.filterable.operators) {
                        operators = col.filterable.operators;
                    }

                    settings = {
                        column: col,
                        dataSource: that.dataSource,
                        suggestDataSource: suggestDataSource,
                        customDataSource: customDataSource,
                        field: field,
                        messages: messages,
                        size: that.options.size,
                        values: col.values,
                        template: cellOptions.template,
                        delay: cellOptions.delay,
                        inputWidth: cellOptions.inputWidth,
                        suggestionOperator: cellOptions.suggestionOperator,
                        minLength: cellOptions.minLength,
                        dataTextField: cellOptions.dataTextField,
                        operator: cellOptions.operator,
                        operators: operators,
                        showOperators: cellOptions.showOperators,
                        change: filterHandler,
                        adaptiveMode: that.options.adaptiveMode,
                    };

                    $("<span/>").attr(kendo.attr("field"), field)
                        .appendTo(td)
                        .kendoFilterCell(settings);
                } else {
                    td.html("&nbsp;");
                }
                td.data("column", col);
            }

            this._filterFocusable().attr(TABINDEX, -1);
        },

        _sortable: function() {
            var that = this,
                columns = leafColumns(that.columns),
                column,
                sorterInstance,
                cell,
                sortable = that.options.sortable,
                sortHandler = function(e) {
                    if (that.trigger("sort", { sort: e.sort })) {
                        e.preventDefault();
                    } else {
                        that._clearEditableState();
                    }
                };


            if (sortable && !that._isStackedMode()) {
                var cells = leafDataCells(that.thead);

                for (var idx = 0, length = cells.length; idx < length; idx++) {
                    column = columns[idx];

                    if (column.sortable !== false && !column.command && column.field) {
                        cell = cells.eq(idx);

                        sorterInstance = cell.data("kendoColumnSorter");

                        if (sorterInstance) {
                            sorterInstance.destroy();
                        }

                        cell.attr("data-" + kendo.ns + "field", column.field)
                            .kendoColumnSorter(
                                extend({}, sortable, column.sortable, {
                                    dataSource: that.dataSource,
                                    aria: true,
                                    filter: ":not(.k-column-active)",
                                    change: sortHandler
                                })
                            );
                    }
                }
                cells = null;
            }
        },

        _columns: function(columns) {
            var that = this,
                table = that.table,
                encoded,
                cols = table.find("col"),
                lockedCols,
                headerRows = that.element.find('thead tr'),
                dataSource = that.options.dataSource,
                draggableColumns;

            // using HTML5 data attributes as a configuration option e.g. <th data-field="foo">Foo</foo>
            columns = columns.length ? columns : map(table.find("th:not(.k-group-cell):not(.k-hierarchy-cell)"), function(th, idx) {
                th = $(th);
                var sortable = th.attr(kendo.attr("sortable")),
                    filterable = th.attr(kendo.attr("filterable")),
                    type = th.attr(kendo.attr("type")),
                    groupable = th.attr(kendo.attr("groupable")),
                    field = th.attr(kendo.attr("field")),
                    title = th.attr(kendo.attr("title")),
                    columnMenu = th.attr(kendo.attr("column-menu")),
                    menu = th.attr(kendo.attr("menu"));

                if (!field) {
                    field = th.text().replace(/\s|[^A-z0-9]/g, "");
                }

                return {
                    field: field,
                    type: type,
                    title: title,
                    sortable: sortable !== "false",
                    filterable: filterable !== "false",
                    groupable: groupable !== "false",
                    menu: menu !== "false",
                    columnMenu: columnMenu !== "false",
                    template: th.attr(kendo.attr("template")),
                    width: cols.eq(idx).css(WIDTH)
                };
            });

            encoded = !(that.table.find("tbody tr").length > 0 && (!dataSource || !dataSource.transport));

            if (that.options.scrollable && !that._isStackedMode()) {
                var initialColumns = columns;
                lockedCols = lockedColumns(columns);
                columns = nonLockedColumns(columns);

                if (lockedCols.length > 0 && columns.length === 0) {
                    throw new Error("There should be at least one non locked column");
                }

                normalizeHeaderCells(that.element.find("tr:has(th)").first(), initialColumns);
                columns = lockedCols.concat(columns);
            }

            if (headerRows.length && columns.length) {
                that._updateColumnIDs(columns, headerRows.first());
            }

            that.columns = normalizeColumns(columns, encoded);

            if ($.grep(leafColumns(that.columns), function(col) { return col.selectable; }).length) {
                that._selectedIds = {};
                that._checkBoxSelection = true;
                that.wrapper.on(CLICK + NS, "tbody > tr " + CHECKBOXINPUT, that._checkboxClick.bind(that));
                that.wrapper.on(CLICK + NS, "thead > tr " + CHECKBOXINPUT, that._headerCheckboxClick.bind(that));
            }

            draggableColumns = $.grep(leafColumns(that.columns), function(col) { return col.draggable; });

            if (draggableColumns.length) {
                that._hasDragHandleColumn = true;

                for (var i = 0; i < draggableColumns.length; i++) {
                    draggableColumns[i].headerAttributes = $.extend({
                        "aria-label": that.options.messages.dragHandleLabel
                    }, draggableColumns[i].headerAttributes);
                }
            }

            that._foreignKeyBindings(flatColumns(that.columns));
        },

        _foreignKeyBindings: function(columns) {
            var that = this;
            var length = columns.length;
            var column;

            for (var i = 0; i < length; i++) {
                column = columns[i];

                if (column.dataSource) {
                    that._fetchForeignKeyValues(column);
                }
            }
        },

        _fetchForeignKeyValues: function(column) {
            var that = this;
            var promise = $.Deferred();

            that._hasBoundForeignKey = true;
            column.dataSource = DataSource.create(column.dataSource);

            if (!that._foreignKeyPromises) {
                that._foreignKeyPromises = [];
            }

            that._foreignKeyPromises.push(promise);
            column.dataSource.fetch().then(function() {
                var data = column.dataSource.data();
                column.values = data.map(function(item) {
                    return {
                        value: item[column.dataValueField],
                        text: item[column.dataTextField]
                    };
                });
                promise.resolve();
            });

        },

        _updateColumnIDs: function(columns, tr) {

            if (!columns.length) {
                return;
            }

            var ths = tr.find("th:not(.k-group-cell):not(.k-hierarchy-cell)");
            var id;
            for (var i = 0; i < columns.length; i++) {
                id = ths.eq(i).attr(ID);
                if (id) {
                    columns[i].headerAttributes = extend(columns[i].headerAttributes, { id: id });
                }
            }

            this._updateColumnIDs(childColumns(columns), tr.next());
        },

        _headerCheckboxClick: function(e) {
            var that = this,
                checkBox = $(e.target),
                checked = checkBox.prop("checked");

            if (!that._belongsToGrid(checkBox)) {
                return;
            }

            if (that.trigger(CHANGING, { target: checkBox, originalEvent: e })) {
                e.preventDefault();
                return;
            }

            if (checked) {
                that.select(that.items());
            } else {
                that.clearSelection();
            }

            that._calculateAggregatesForSelected();
            that.trigger(CHANGE, { cellAggregates: that._cellAggregates });
        },

        _checkboxClick: function(e) {
            var that = this,
                row = $(e.target).closest(TR),
                isSelecting = !row.hasClass(SELECTED);

            if (!that._belongsToGrid(row)) {
                return;
            }

            if (that.trigger(CHANGING, { target: row, originalEvent: e })) {
                e.preventDefault();
                return;
            }

            if (isSelecting) {
                that.select(row);
            } else {
                that._deselectCheckRows(row);
            }
            that._calculateAggregatesForSelected();
            that.trigger(CHANGE, { cellAggregates: that._cellAggregates });
        },

        _groups: function() {
            var group = this.dataSource.group();

            return group ? group.length : 0;
        },

        _getStackedLayoutSettings: function() {
            const that = this;
            const layoutSetting = that.options.stackedLayoutSettings;
            const stackedColsConfig = layoutSetting && layoutSetting.cols;

            let config = [];
            let colClass = "";
            if (stackedColsConfig) {
                if (Array.isArray(stackedColsConfig)) {
                    for (let i = 0; i < stackedColsConfig.length; i++) {
                        if (typeof stackedColsConfig[i] === "object") {
                            const width = stackedColsConfig[i].width;
                            if (!width && width !== 0) {
                                continue;
                            }

                            if (typeof width === "number") {
                                config.push(`${width}px`);
                            }

                            if (typeof width === "string") {
                                config.push(width);
                            }
                        } else if (typeof stackedColsConfig[i] === "number") {
                            config.push(`${stackedColsConfig[i]}px`);
                        } else if (typeof stackedColsConfig[i] === "string") {
                            config.push(stackedColsConfig[i]);
                        }
                    }
                } else if (typeof stackedColsConfig === "number") {
                    colClass = `k-grid-cols-${stackedColsConfig}`;
                }
            }

            return {
                colClass: colClass,
                colsConfig: config.join(" ")
            };
        },

        _tmpl: function(rowTemplate, columns, alt, skipGroupCells) {
            var that = this,
                settings = extend({}, kendo.Template, that.options.templateSettings),
                idx,
                length = columns.length,
                state = { storage: {}, count: 0 },
                column,
                hasDetails = that._hasDetails(),
                groups = that._groups();

            var fieldAttr = kendo.attr("field");
            var field;
            var classAttribute;
            var compiledAttributes;
            let rowTemplateFunc;

            if (!rowTemplate) {
                rowTemplateFunc = (data) => {
                    var uid = length ? ` ${kendo.attr("uid")}="${kendo.getter("uid")(data)}"` : '';
                    var rowTemplateResult = `<tr class="${alt ? 'k-table-row k-table-alt-row ' : 'k-table-row '}k-master-row"${uid}>`;

                    if (groups > 0 && !skipGroupCells) {
                        rowTemplateResult += groupCells(groups);
                    }

                    if (hasDetails) {
                        rowTemplateResult += '<td class="k-hierarchy-cell k-table-td" aria-expanded="false">' + kendo.ui.icon($(`<a href="#" ${ARIA_LABEL}="${EXPAND}" tabindex="-1"></a>`), { icon: `caret-alt-${isRtl ? "left" : "right"}` }) + '</td>';
                    }

                    for (idx = 0; idx < length; idx++) {
                        column = columns[idx];
                        column.template;
                        field = column.field;
                        compiledAttributes = {};

                        let dirtyCellTemplate;

                        if (that._editMode() && field) {
                            column.attributes = column.attributes || {};

                            if (that.virtualScroll) {
                                column.attributes[fieldAttr] = field;
                            }

                            dirtyCellTemplate = that._dirtyCellTemplate(field)(data);
                        }

                        if (column.colSpan && column.colSpan > 0 && hasHiddenStyle(column.attributes)) { //virtual cell should be visible at all times
                            column.attributes = removeHiddenStyle(column.attributes);
                        } else if (!column.colSpan && column.hidden) {
                            column.attributes = addHiddenStyle(column.attributes);
                        }

                        if (column.command) {
                            column.attributes = column.attributes || {};
                            classAttribute = column.attributes["class"];

                            if (typeof classAttribute !== "undefined") {
                                if (classAttribute.indexOf("k-command-cell") < 0) {
                                    column.attributes["class"] += " k-command-cell ";
                                }
                            } else {
                                column.attributes["class"] = " k-command-cell ";
                            }
                        }

                        if (column.draggable) {
                            column.attributes = column.attributes || {};
                            if (typeof column.attributes["class"] !== "undefined") {
                                if (column.attributes["class"].indexOf("k-drag-cell") < 0) {
                                    column.attributes["class"] += " k-drag-cell ";
                                }
                            } else {
                                column.attributes["class"] = " k-drag-cell ";
                            }

                            if (!column.attributes["ref-grid-drag-cell"]) {
                                column.attributes["ref-grid-drag-cell"] = true;
                            }

                            if (typeof column.attributes[ARIA_LABEL] === "undefined") {
                                column.attributes[ARIA_LABEL] = that.options.messages.dragHandleLabel;
                            }

                            if (typeof column.attributes.style !== "undefined") {
                                if (column.attributes.style.indexOf("cursor: move;") < 0) {
                                    column.attributes.style += " cursor: move;";
                                }
                            } else {
                                column.attributes.style = "cursor: move;";
                            }
                        }

                        if (column._attributesFunction) {
                            compiledAttributes = column._attributesFunction(data);
                        }

                        let attributes = extend({}, column.attributes, compiledAttributes);
                        if (dirtyCellTemplate) {
                            attributes["class"] = (attributes["class"] || "");
                            attributes["class"] += dirtyCellTemplate;
                        }
                        let columnAttributes = stringifyAttributes(attributes);
                        let colSpanAttributes = '';

                        if (column.colSpan) {
                            if (column.colSpan > 1) {
                                colSpanAttributes += " " + kendo.attr("virtual");
                            }
                            colSpanAttributes += ` colSpan="${column.colSpan}"`;
                        }
                        rowTemplateResult += decorateCellWithClass(`<td${columnAttributes}${colSpanAttributes}>`);
                        rowTemplateResult += column.selectable ? kendo.template(SELECTCOLUMNTMPL)({ size: kendo.getValidCssClass("k-checkbox-", "size", that.options.size) }) : that._cellTmpl(column, state)(data);
                        rowTemplateResult += "</td>";
                    }

                    rowTemplateResult += "</tr>";
                    return rowTemplateResult;
                };


                if (that._isStackedMode()) {
                    rowTemplateFunc = (data) => {
                    columns = leafColumns(visibleColumns(columns));
                    length = columns.length;
                    var uid = length ? ` ${kendo.attr("uid")}="${kendo.getter("uid")(data)}"` : '';
                    var rowTemplateResult = `<tr class="${alt ? 'k-table-row k-table-alt-row ' : 'k-table-row '}k-master-row"${uid}>`;
                        if (groups > 0 && !skipGroupCells) {
                            rowTemplateResult += groupCells(groups);
                        }

                        rowTemplateResult += `<td class="k-table-td">
                            <div class="k-grid-stack-row">
                        `;

                        for (idx = 0; idx < length; idx++) {
                            column = columns[idx];
                            column.template;
                            field = column.field;
                            compiledAttributes = {};

                            const showHideColumnOnGroup = groups > 0 && that.dataSource.group().find((g) => g.field === field) && column.hideOnGroup;

                            let dirtyCellTemplate;

                            if (showHideColumnOnGroup) {
                                continue;
                            }

                            if (that._editMode() && field) {
                                column.attributes = column.attributes || {};

                                if (that.virtualScroll) {
                                    column.attributes[fieldAttr] = field;
                                }

                                dirtyCellTemplate = that._dirtyCellTemplate(field)(data);
                            }

                            if (column.colSpan && column.colSpan > 0 && hasHiddenStyle(column.attributes)) { //virtual cell should be visible at all times
                                column.attributes = removeHiddenStyle(column.attributes);
                            } else if (!column.colSpan && column.hidden) {
                                column.attributes = addHiddenStyle(column.attributes);
                            }

                            column.attributes["class"] = "k-grid-stack-cell";

                            if (column.title) {
                                column.attributes[kendo.attr("title")] = column.title;
                            }

                            if (column.aggregates) {
                                column.attributes[kendo.attr("aggregates")] = column.aggregates;
                            }

                            let shouldRenderStackedContent = !column.selectable;
                            let shouldRenderStackedHeader = !column.selectable;

                            if (column.command) {
                                column.attributes = column.attributes || {};
                                classAttribute = column.attributes["class"];

                                if (typeof classAttribute !== "undefined") {
                                    if (classAttribute.indexOf("k-command-cell") < 0) {
                                        column.attributes["class"] += " k-command-cell";
                                    }
                                } else {
                                    column.attributes["class"] = "k-command-cell";
                                }

                                shouldRenderStackedHeader = column.title && column.title !== "&nbsp;";
                                shouldRenderStackedContent = true;
                            }

                            if (column.draggable) {
                                shouldRenderStackedHeader = false;
                                shouldRenderStackedContent = true;
                                column.attributes = column.attributes || {};
                                if (typeof column.attributes["class"] !== "undefined") {
                                    if (column.attributes["class"].indexOf("k-drag-cell") < 0) {
                                        column.attributes["class"] += " k-drag-cell";
                                    }
                                } else {
                                    column.attributes["class"] = "k-drag-cell";
                                }

                                if (!column.attributes["ref-grid-drag-cell"]) {
                                    column.attributes["ref-grid-drag-cell"] = true;
                                }

                                if (typeof column.attributes[ARIA_LABEL] === "undefined") {
                                    column.attributes[ARIA_LABEL] = that.options.messages.dragHandleLabel;
                                }

                                if (typeof column.attributes.style !== "undefined") {
                                    if (column.attributes.style.indexOf("cursor: move;") < 0) {
                                        column.attributes.style += " cursor: move;";
                                    }
                                } else {
                                    column.attributes.style = "cursor: move;";
                                }
                            }

                            if (column._attributesFunction) {
                                compiledAttributes = column._attributesFunction(data);
                            }

                            let attributes = extend({}, column.attributes, compiledAttributes);
                            if (dirtyCellTemplate) {
                                attributes["class"] = (attributes["class"] || "");
                                attributes["class"] += dirtyCellTemplate;
                            }
                            let columnAttributes = stringifyAttributes(attributes);
                            let colSpanAttributes = '';

                            if (column.colSpan) {
                                if (column.colSpan > 1) {
                                    colSpanAttributes += " " + kendo.attr("virtual");
                                }
                                colSpanAttributes += ` colSpan="${column.colSpan}"`;
                            }

                            const title = column.parentIds ? createMultiHeaderTitle(that, column) : (column.title || column.field || "");
                            rowTemplateResult += decorateCellWithClass(`<div${columnAttributes}${colSpanAttributes} ${column.field ? `data-field=${ column.field }` : ''} data-index=${ idx }>`, true);
                            if (shouldRenderStackedHeader) {
                                rowTemplateResult += `<div class="k-grid-stack-header">${title}</div>`;
                            }
                            if (shouldRenderStackedContent) {
                                rowTemplateResult += `<div class="k-grid-stack-content">`;
                            }

                            rowTemplateResult += column.selectable ? kendo.template(SELECTCOLUMNTMPL)({ size: kendo.getValidCssClass("k-checkbox-", "size", that.options.size) }) : that._cellTmpl(column, state)(data);

                            if (shouldRenderStackedContent) {
                                rowTemplateResult += `</div>`;
                            }

                            rowTemplateResult += "</div>";
                        }

                        if (hasDetails) {
                            rowTemplateResult += `<div class="k-grid-stack-cell">
                                <div class="k-grid-stack-content">
                                    ${kendo.html.renderButton(`<button tabindex='-1' ref="expand-detail-button">${that.options.messages.details.expand}</button>`, { icon: "plus", fillMode: "flat", themeColor: "primary" })}
                                </div>
                            </div>`;
                        }

                        rowTemplateResult += "</div></td></tr>";
                        return rowTemplateResult;
                };
                }
            }

            rowTemplate = kendo.template(rowTemplate || rowTemplateFunc, settings);

            if (state.count > 0) {
                return rowTemplate.bind(state.storage);
            }

            return rowTemplate;
        },

        _dirtyCellTemplate: function(field) {
            return (data) => {
                if (field && data && data.dirty && data.dirtyFields) {
                    let dirtyField = field.charAt(0) === "[" ? kendo.getter(field)(data.dirtyFields) : data.dirtyFields[field];
                    return dirtyField ? ' k-dirty-cell' : '';
                }

                return "";
            };
        },

        _headerCellText: function(column) {
            var that = this,
                settings = extend({}, kendo.Template, that.options.templateSettings),
                template = column.headerTemplate,
                type = typeof (template),
                text = column.title && (that.options.encodeTitles ? htmlEncode(column.title) : column.title) || htmlEncode(column.field || "");

            if (type === FUNCTION) {
                text = kendo.template(template, settings)({});
            } else if (type === STRING) {
                text = template;
            }
            return text;
        },

        _cellTmpl: function(column, state) {
            var that = this,
                settings = extend({}, kendo.Template, that.options.templateSettings),
                template = column.template,
                field = column.field,
                // html = "",
                idx,
                length,
                format = column.format,
                type = typeof template,
                columnValues = column.values;

            if (column.command) {
                if (isArray(column.command)) {
                    return (data) => {
                        let html = "";
                        for (idx = 0, length = column.command.length; idx < length; idx++) {
                            if (column.command[idx].visible) {
                                html += column.command[idx].visible(data) ? that._createButton(column.command[idx]) : '';
                            } else {
                                html += that._createButton(column.command[idx]);
                            }
                        }
                        return html;
                    };
                }
                return () => that._createButton(column.command);
            }

            if (column.selectable) {
                return SELECTCOLUMNTMPL;
            }

            if (column.draggable) {
                return DRAGHANDLECOLUMNTMPL;
            }

            return (data) => {
                let html = that._dirtyIndicatorTemplate(field)(data);

                if (type === FUNCTION) {
                    state.storage["tmpl" + state.count] = template;
                    html += template(data);
                    state.count++;
                } else if (type === STRING) {
                    html += kendo.template(template, settings)(data);
                } else if (columnValues && columnValues.length && isPlainObject(columnValues[0]) && "value" in columnValues[0] && field) {
                    var v = convertToObject(columnValues);
                    var f = v[settings.useWithBlock ? kendo.getter(field)(data) : field];
                    html += encode(f != null ? f : '');
                } else {
                    let fieldValue = '';
                    if (field) {
                        field = kendo.getter(field)(data);
                        fieldValue = field == null ? '' : field;
                    }

                    if (format) {
                        fieldValue = kendo.format(format.replace(formatRegExp, "$1"), fieldValue);
                    }

                    html += column.encoded ? encode(fieldValue) : fieldValue;
                }

                return html;
            };
        },

        _dirtyIndicatorTemplate: function(field) {
            return (data) => {
                if (field && data && data.dirty && data.dirtyFields) {
                    let dirtyField = field.charAt(0) === "[" ? kendo.getter(field)(data.dirtyFields) : data.dirtyFields[field];
                    return dirtyField ? '<span class=\"k-dirty\"></span>' : '';
                }

                return "";
            };
        },

        _virtualCols: function(columns) {
            var that = this;
            var widths = $.map(columns, function(c) { return c.hidden ? 0 : parseInt(c.width, 10); });
            var scrollLeft = that.virtualScrollable ? kendo.scrollLeft(that.content.find(">.k-virtual-scrollable-wrap")) : kendo.scrollLeft(that.content);
            var tableWidth = outerWidth(that.content);
            var sumOfWidths = sumWidths(columns);
            var colsToRender = [];
            var firstColspan = 0;
            var lastColspan = 0;
            var hiddenColumns = 0;
            var idx = 0;
            var widthOfHiddenColumns = 0;
            var considerNext;

            for (idx = 0; idx < columns.length; idx++) {
                considerNext = (idx < widths.length - 1) ? widths[idx + 1] : 0;
                if (widthOfHiddenColumns + widths[idx] + 2 * considerNext < scrollLeft) {
                    if (widths[idx]) {
                        hiddenColumns++;
                    }
                    widthOfHiddenColumns += widths[idx];
                } else {
                    firstColspan = 1 + hiddenColumns;
                    break;
                }
            }

            hiddenColumns = 0;
            widthOfHiddenColumns = 0;

            for (var i = columns.length - 1; i >= 0; i--) {
                if (widthOfHiddenColumns + 3 * widths[i] < sumOfWidths - tableWidth - scrollLeft) {
                    if (widths[i]) {
                        hiddenColumns++;
                    }
                    widthOfHiddenColumns += widths[i];
                } else {
                    lastColspan = 1 + hiddenColumns;
                    for (var j = idx; j <= i; j++) {
                        if (columns[j].locked) {
                            continue;
                        }
                        colsToRender.push(columns[j]);
                        if (columns[j].colSpan) {
                            delete columns[j].colSpan;
                        }
                    }
                    colsToRender[0].colSpan = firstColspan;
                    colsToRender[colsToRender.length - 1].colSpan = lastColspan;
                    break;
                }
            }

            if (colsToRender[0].hidden) {
                colsToRender[0].colSpan--;
            }

            that.virtualCols = colsToRender;

            return colsToRender;
        },

        _templates: function() {
            var that = this,
                options = that.options,
                dataSource = that.dataSource,
                groups = dataSource.group(),
                footer = that.footer || that.wrapper.find(".k-grid-footer"),
                aggregates = dataSource.aggregate(),
                stacked = that._isStackedMode(),
                columnLeafs = leafColumns(that.columns),
                columnsLocked = leafColumns(lockedColumns(that.columns)),
                leafsCols = options.scrollable ? leafColumns(nonLockedColumns(that.columns)) : columnLeafs,
                columns = (that.virtualScroll || {}).columns ? that._virtualCols(leafsCols) : leafsCols,
                groupHeaderColumnTemplateLockedColumns = grep(visibleColumns(columnsLocked), function(column, index) { return column.groupHeaderColumnTemplate && index !== 0; }),
                groupHeaderColumnTemplateNonLockedColumns = grep(visibleColumns(columns), function(column) { return column.groupHeaderColumnTemplate; });

            if (options.scrollable && columnsLocked.length && !stacked) {
                if (options.rowTemplate || options.altRowTemplate) {
                    throw new Error("Having both row template and locked columns is not supported");
                }

                that.rowTemplate = that._tmpl(options.rowTemplate, columns, false, true);
                that.altRowTemplate = that._tmpl(options.altRowTemplate || options.rowTemplate, columns, true, true);

                that.lockedRowTemplate = that._tmpl(options.rowTemplate, columnsLocked);
                that.lockedAltRowTemplate = that._tmpl(options.altRowTemplate || options.rowTemplate, columnsLocked, true);
            } else {
                that.rowTemplate = that._tmpl(options.rowTemplate, stacked ? that.columns : columns);
                that.altRowTemplate = that._tmpl(options.altRowTemplate || options.rowTemplate, stacked ? that.columns : columns, true);
            }

            if (that._hasDetails()) {
                that.detailTemplate = that._detailTmpl(options.detailTemplate || (() => ""));
            }

            if ((that._group && !isEmptyObject(aggregates)) || (!isEmptyObject(aggregates) && !footer.length) ||
                grep(columnLeafs, function(column) { return column.footerTemplate; }).length) {

                that.footerTemplate = that._footerTmpl(columnLeafs, aggregates, "footerTemplate", "k-footer-template k-table-row");
            }

            if (groups && grep(columnLeafs, function(column) { return column.groupFooterTemplate; }).length) {
                aggregates = $.map(groups, function(g) { return g.aggregates; });

                that.groupFooterTemplate = that._footerTmpl(columns, aggregates, "groupFooterTemplate", "k-group-footer k-table-row", columnsLocked.length);

                if (options.scrollable && columnsLocked.length) {
                    that.lockedGroupFooterTemplate = that._footerTmpl(columnsLocked, aggregates, "groupFooterTemplate", "k-group-footer k-table-row");
                }
            }

            if (groups && (groupHeaderColumnTemplateLockedColumns.length || groupHeaderColumnTemplateNonLockedColumns.length)) {
                aggregates = $.map(groups, function(g) { return g.aggregates; });

                that.groupHeaderColumnTemplate = that._groupHeaderTmpl(visibleColumns(columns), aggregates, "groupHeaderColumnTemplate", "k-table-group-row k-grouping-row k-table-row", columnsLocked.length, groupHeaderColumnTemplateNonLockedColumns);

                if (options.scrollable && columnsLocked.length) {
                    that.lockedGroupHeaderColumnTemplate = that._groupHeaderTmpl(visibleColumns(columnsLocked), aggregates, "groupHeaderColumnTemplate", "k-table-group-row k-grouping-row k-table-row", 0, groupHeaderColumnTemplateLockedColumns);
                }
            } else {
                that.groupHeaderColumnTemplate = null;
                that.lockedGroupHeaderColumnTemplate = null;
            }

            if (that.options.noRecords) {
                that.noRecordsTemplate = that._noRecordsTmpl();
            }
        },

        _noRecordsTmpl: function() {
            var wrapper = '<div class="{0}">{1}</div>';
            var defaultTemplate = '<div class="k-grid-norecords-template"{1}>{0}</div>';
            var scrollableNoGridHeightStyles = (this.options.scrollable && !this.wrapper[0].style.height) ? ` ${kendo.attr("style-margin")}="0 auto" ${kendo.attr("style-position")}="static"` : '';
            var state = { storage: {}, count: 0 };
            var settings = $.extend({}, kendo.Template, this.options.templateSettings);
            settings.paramName;
            var template;
            // var html = "";
            var type;
            var tmpl;
            let resultTemplate;

            if (this.options.noRecords.template) {
                template = this.options.noRecords.template;
            } else {
                template = kendo.format(defaultTemplate, this.options.messages.noRecords, scrollableNoGridHeightStyles);
            }

            type = typeof template;
            if (type === "function") {
                let currentCustomTemplate = state.storage["tmpl" + state.count] = template;
                state.count++;
                resultTemplate = (data) => kendo.format(wrapper, NORECORDSCLASS, currentCustomTemplate(data));

            } else if (type === "string") {
                resultTemplate = this.options.noRecords.template ?
                    kendo.format(wrapper, NORECORDSCLASS, template)
                    : () => kendo.format(wrapper, NORECORDSCLASS, template);
            }

            tmpl = kendo.template(resultTemplate, settings);

            if (state.count > 0) {
                tmpl = tmpl.bind(state.storage);
            }

            return tmpl;
        },

        _footerTmpl: function(columns, aggregates, templateName, rowClass, skipGroupCells) {
            var that = this,
                settings = extend({}, kendo.Template, that.options.templateSettings),
                paramName = settings.paramName,
                idx,
                length,
                template,
                type,
                storage = {},
                count = 0,
                scope = {},
                groups = that._groups(),
                fieldsMap = that.dataSource._emptyAggregates(aggregates),
                column;

            const stacked = that._isStackedMode();

            let footerTemplateFunction = (data) => {
                let html = '<tr class="' + rowClass + '">';

                if (groups > 0 && !skipGroupCells) {
                    html += groupCells(groups);
                }

                if (that._hasDetails() && !stacked) {
                    html += '<td class="k-hierarchy-cell k-table-td">&nbsp;</td>';
                }

                const columnsToCheck = columns;

                if (stacked) {
                    html += decorateCellWithClass("<td>");
                    html += `<div class="${STACKED_TEMPLATE_WRAPPER_CLASS}">`;

                    for (idx = 0, length = columnsToCheck.length; idx < length; idx++) {
                        column = columnsToCheck[idx];
                        template = column[templateName];
                        type = typeof template;

                        if (template) {

                            if (type !== FUNCTION) {
                                scope = fieldsMap[column.field] ? extend({}, settings, { paramName: paramName + "['" + column.field + "']" }) : {};
                                template = kendo.template(template, scope);
                            }

                            storage["tmpl" + count] = template;

                            html += template(data);

                            count++;
                        }
                    }
                    html += "</div></td>";
                } else {
                    for (idx = 0, length = columnsToCheck.length; idx < length; idx++) {
                        column = columnsToCheck[idx];
                        template = column[templateName];
                        type = typeof template;

                        html += decorateCellWithClass("<td" + stringifyAttributes(column.footerAttributes) + ">");

                        if (template) {
                            if (type !== FUNCTION) {
                                scope = fieldsMap[column.field] ? extend({}, settings, { paramName: paramName + "['" + column.field + "']" }) : {};
                                template = kendo.template(template, scope);
                            }

                            storage["tmpl" + count] = template;

                            html += template(data);
                            count++;
                        } else {
                            html += "&nbsp;";
                        }

                        html += "</td>";
                    }
                }


                html += '</tr>';
                return html;
            };

            let resultTemplate = kendo.template(footerTemplateFunction, settings);

            if (count > 0) {
                return resultTemplate.bind(storage);
            }

            return resultTemplate;
        },

        _groupHeaderTmpl: function(columns, aggregates, templateName, rowClass, skipGroupCells, groupHeaderColumnTemplateColumns) {
            var that = this,
                settings = extend({}, kendo.Template, that.options.templateSettings),
                paramName = settings.paramName,
                html = "",
                idx,
                length,
                template,
                type,
                storage = {},
                count = 0,
                scope = {},
                fieldsMap = that.dataSource._emptyAggregates(aggregates),
                column,
                headerTemplateIndex = groupHeaderColumnTemplateColumns.length ? inArray(groupHeaderColumnTemplateColumns[0], columns) : -1,
                groupHeaderColumnTemplateClass;

            if (headerTemplateIndex < 0) {
                return;
            }

            const stacked = that._isStackedMode();
            var groupHeaderTemplFunc = (data) => {
                let aggregatesHTML = "";
                var resultHtml = '<tr data-group-uid="' + data.uid + '" class="' + rowClass + '">';

                if (!skipGroupCells) {
                    for (var i = 0; i < data.groupCells; i++) {
                        resultHtml += '<td class="k-table-td k-group-cell">&nbsp;</td>';
                    }
                }

                const columnsToCheck = columns;

                if (stacked) {
                    aggregatesHTML += `<div class="${STACKED_TEMPLATE_WRAPPER_CLASS}">`;

                    for (idx = headerTemplateIndex, length = columnsToCheck.length; idx < length; idx++) {
                        column = columnsToCheck[idx];
                        template = column[templateName];
                        type = typeof template;

                        if (template) {
                            if (type !== FUNCTION) {
                                scope = fieldsMap[column.field] ? extend({}, settings, { paramName: paramName + "['" + column.field + "']" }) : {};
                                template = kendo.template(template, scope);
                            }

                            storage["tmpl" + count] = template;

                            aggregatesHTML += storage["tmpl" + count](data);
                            count++;

                        }
                    }
                    aggregatesHTML += "</div>";
                }

                if (that._hasDetails() && !stacked) {
                    resultHtml += '<td class="k-table-td k-hierarchy-cell">&nbsp;</td>';
                }
                if (headerTemplateIndex < MINCOLSPANVALUE && groupHeaderColumnTemplateColumns.length <= 1 && !skipGroupCells) {
                    resultHtml += !skipGroupCells ? groupCellBuilder(columnsToCheck.length, stacked, aggregatesHTML)(data) : '';
                    return resultHtml;
                    // return kendo.template(resultHtml, settings);
                }

                if (headerTemplateIndex < MINCOLSPANVALUE) {
                    headerTemplateIndex = !skipGroupCells ? 1 : 0;
                    resultHtml += !skipGroupCells ? groupCellBuilder(headerTemplateIndex, stacked, aggregatesHTML)(data) : '';
                }
                else {
                    resultHtml += !skipGroupCells ? groupCellBuilder(headerTemplateIndex, stacked, aggregatesHTML)(data) : groupCellLockedContentBuilder(headerTemplateIndex);
                }

                if (!stacked) {
                    for (idx = headerTemplateIndex, length = columnsToCheck.length; idx < length; idx++) {
                        column = columnsToCheck[idx];
                        template = column[templateName];
                        type = typeof template;

                        if (column.sticky) {
                            let stickyAttributes = '';
                            groupHeaderColumnTemplateClass = (column.groupHeaderColumnTemplateClass || '');

                            if (!groupHeaderColumnTemplateClass) {
                                groupHeaderColumnTemplateClass = column.groupHeaderColumnTemplateClass = "group-header-column-template-" + kendo.guid();
                            }

                            if (isPlainObject(column.stickyStyle)) {
                                let stickyLeft = column.stickyStyle.left ? `${kendo.attr("style-left")}="${column.stickyStyle.left}"` : '';
                                let stickyRight = column.stickyStyle.right ? `${kendo.attr("style-right")}="${column.stickyStyle.right}"` : '';
                                stickyAttributes = `${stickyLeft} ${stickyRight}`;
                            }

                            resultHtml += `<td class="k-table-td ${STICKY_CELL_CLASS} ${groupHeaderColumnTemplateClass}" ${stickyAttributes}>`;
                        } else {
                            resultHtml += "<td class='k-table-td'>";
                        }

                        if (template) {
                            if (type !== FUNCTION) {
                                scope = fieldsMap[column.field] ? extend({}, settings, { paramName: paramName + "['" + column.field + "']" }) : {};
                                template = kendo.template(template, scope);
                            }

                            storage["tmpl" + count] = template;
                            resultHtml += storage["tmpl" + count](data);
                            count++;
                        } else {
                            resultHtml += "&nbsp;";
                        }

                        resultHtml += "</td>";
                    }
                }

                resultHtml += '</tr>';

                return resultHtml;
            };

            html = kendo.template(groupHeaderTemplFunc, settings);

            if (count > 0) {
                return html.bind(storage);
            }

            return html;
        },

        _detailTmpl: function(template) {
            var that = this,
                settings = extend({}, kendo.Template, that.options.templateSettings);
                settings.paramName;
                var templateFunctionStorage = {},
                templateFunctionCount = 0,
                groups = that._groups(),
                stacked = that._isStackedMode(),
                colspan = stacked ? that.table.find("col").length : visibleColumns(leafColumns(that.columns)).length,
                type = typeof template;

            let detailTemplateFunction = (data) => {
                let html = '<tr role="row" class="k-detail-row k-table-row">';
                if (groups > 0) {
                    html += groupCells(groups);
                }

                if (!stacked) {
                    html += `<td role="gridcell" class="k-hierarchy-cell k-table-td"></td>`;
                }

                html += `<td role="gridcell" class="k-detail-cell k-table-td" ${colspan ? ` colspan="${colspan}"` : ''}>`;
                if (type === FUNCTION) {
                    templateFunctionStorage["tmpl" + templateFunctionCount] = template;
                    html += template(data);
                    templateFunctionCount++;
                } else {
                    html += kendo.template(template, settings)(data);
                }

                html += "</td></tr>";
                return html;
            };

            let resultTemplate = kendo.template(detailTemplateFunction, settings);

            if (templateFunctionCount > 0) {
                return resultTemplate.bind(templateFunctionStorage);
            }

            return resultTemplate;
        },

        _hasDetails: function() {
            var that = this;

            return that.options.detailTemplate !== null || (that._events[DETAILINIT] || []).length;
        },
        _hasFilterRow: function() {
            var filterable = this.options.filterable;
            var hasFiltering = filterable &&
                typeof filterable.mode == STRING &&
                filterable.mode.indexOf(ROW) != -1;
            var columns = this.columns;
            var columnsWithoutFiltering = $.grep(columns, function(col) {
                return col.filterable === false;
            });

            if (this._isStackedMode() || (columns.length && columnsWithoutFiltering.length == columns.length)) {
                hasFiltering = false;
            }

            return hasFiltering;
        },

        _details: function() {
            var that = this;

            if (that.options.scrollable && that._hasDetails() && lockedColumns(that.columns).length) {
                throw new Error("Having both detail template and locked columns is not supported");
            }

            const stacked = that._isStackedMode();

            const selector = stacked ?
                `[ref="expand-detail-button"], [ref="collapse-detail-button"]` : ".k-hierarchy-cell " + CARET_ALT_RIGHT + ", .k-hierarchy-cell " + CARET_ALT_DOWN;

            that.table.on(CLICK + NS, selector, function(e) {
                var button = $(this);

                if (stacked) {
                    that._toggleStackedDetails(button);
                } else {
                    that._toggleDetails(button);
                }
                e.preventDefault();
                return false;
            });
        },

        _setCurrentStackedCell: function(cell) {
            const that = this;
            const currentIndex = cell ? $(cell).closest(TR).index() : that._currentRowIndex;
            const currentStackedCell = that._currentStackedCell();

            if (!currentStackedCell || !that.options.navigatable) {
                return;
            }

            if (currentIndex >= 0) {
                let target;
                let stackedCellIndex = currentStackedCell && currentStackedCell.index;
                const stackedCells = that.table.find(`${TR}:eq(${currentIndex}) .k-grid-stack-cell`);
                target = stackedCells.eq(stackedCellIndex);

                if (target.length) {
                    if (target.attr("tabindex") === "-1" || !target.attr("tabindex")) {
                        addElementsToTab(target.parent().children());
                    }
                    that._currentStackedCell(target, true);
                }
            }
        },

        _toggleStackedDetails: function(button, omitAnimation) {
            const that = this;
            const cell = button.closest(".k-grid-stack-cell");
            const content = cell.find(".k-grid-stack-content");
            const expanding = button.is(`[ref="expand-detail-button"]`);
            const masterRow = button.closest("tr.k-master-row");
            const ariaLabelText = expanding ? COLLAPSE : EXPAND;

            button.remove();
            let buttonInstance;
            if (!expanding) {
                buttonInstance = kendo.html.renderButton(`<button tabindex='-1' ref="expand-detail-button" aria-label=${ariaLabelText}>${kendo.htmlEncode(that.options.messages.details.expand)}</button>`, { icon: "plus", fillMode: "flat", themeColor: "primary" });
            } else {
                buttonInstance = kendo.html.renderButton(`<button tabindex='-1' ref="collapse-detail-button" aria-label=${ariaLabelText}>${kendo.htmlEncode(that.options.messages.details.collapse)}</button>`, { icon: `minus`, fillMode: "flat", themeColor: "primary" });
            }

            content.append(buttonInstance);

            that._addDetailRow(masterRow, expanding, omitAnimation);
            that._setCurrentStackedCell(cell);
        },

        _addDetailRow: function(masterRow, expanding, omitAnimation) {
            const that = this;
            const detailTemplate = that.detailTemplate;
            const masterRowIndex = masterRow.attr(ARIA_ROWINDEX);
            const hasDetails = that._hasDetails();
            let detailRow = masterRow.next();
            let data;

            if (detailRow.hasClass("k-hidden")) {
                detailRow.removeClass("k-hidden");
            }

            if (hasDetails && !detailRow.hasClass("k-detail-row")) {
                data = that.dataItem(masterRow);

                detailRow = $(detailTemplate(data))
                    .addClass(masterRow.hasClass("k-table-alt-row") ? "k-table-alt-row" : "")
                    .insertAfter(masterRow);

                if (masterRowIndex || masterRowIndex === 0) {
                    detailRow.attr(ARIA_ROWINDEX, Number(masterRowIndex) + 1);
                }

                that.trigger(DETAILINIT, { masterRow: masterRow, detailRow: detailRow, data: data, detailCell: detailRow.find(".k-detail-cell") });
            }

            that.trigger(expanding ? DETAILEXPAND : DETAILCOLLAPSE, { masterRow: masterRow, detailRow: detailRow });

            if (omitAnimation) {
                toggleRow(detailRow, expanding);
            } else {
                detailRow.toggle(expanding);
            }
        },

        _toggleDetails: function(button, omitAnimation) {
            var that = this,
                cell = button.closest("td.k-hierarchy-cell"),
                expanding = button.is(CARET_ALT_RIGHT),
                masterRow = button.closest("tr.k-master-row"),
                ariaLabelText = expanding ? COLLAPSE : EXPAND,
                ariaExpandText = expanding ? "true" : "false";

            if (!expanding) {
                kendo.ui.icon(button, { icon: `caret-alt-${isRtl ? 'left' : 'right'}` });
            } else {
                kendo.ui.icon(button, { icon: "caret-alt-down" });
            }

            button.attr(ARIA_LABEL, ariaLabelText);

            cell.attr(ARIA_EXPANDED, ariaExpandText);

            that._addDetailRow(masterRow, expanding, omitAnimation);
        },

        dataItem: function(tr) {
            tr = $(tr)[0];
            if (!tr) {
                return null;
            }

            var rows = this.tbody.children(),
                classesRegEx = /k-grouping-row|k-detail-row|k-group-footer/,
                idx = tr.sectionRowIndex,
                j, correctIdx;

            correctIdx = idx;

            for (j = 0; j < idx; j++) {
                if (classesRegEx.test(rows[j].className)) {
                    correctIdx--;
                }
            }

            return this._data[correctIdx];
        },

        expandRow: function(tr, omitAnimation) {
            var button = $(tr).find('> td ' + CARET_ALT_RIGHT);

            if (button.length) {
                this._toggleDetails(button, omitAnimation);
            }
        },

        collapseRow: function(tr, omitAnimation) {
            var button = $(tr).find('> td ' + CARET_ALT_DOWN);

            if (button.length) {
                this._toggleDetails(button, omitAnimation);
            }
        },

        _createHeaderCells: function(columns, rowSpan) {
            var that = this,
                idx,
                th,
                text,
                html = "",
                length,
                title,
                columnMenu = that.options.columnMenu;
                that.options.sortable;
                var filterable = that._hasFilterMenu(),
                messages = that.options.messages,
                leafs = leafColumns(that.columns),
                groups = that.dataSource.group(),
                field;

            for (idx = 0, length = columns.length; idx < length; idx++) {
                th = columns[idx].column || columns[idx];
                text = that._headerCellText(th);
                title = th.title;
                field = "";

                let index = inArray(th, leafs);
                let currentTh = "";

                if (th.selectable) {
                    currentTh += "<th scope='col'" + stringifyAttributes(th.headerAttributes);

                    if (rowSpan && !columns[idx].colSpan) {
                        currentTh += " rowspan='" + rowSpan + "'";
                    }

                    if (index > -1) {
                        currentTh += kendo.attr("index") + "='" + index + "'";
                    }
                    text = th.headerTemplate ? text : kendo.template(SELECTCOLUMNHEADERTMPL)({ size: kendo.getValidCssClass("k-checkbox-", "size", that.options.size) });
                    currentTh += ">" + text + "</th>";
                } else if (th.draggable) {
                    currentTh += "<th class='k-header' ref-grid-drag-cell scope='col'" + stringifyAttributes(th.headerAttributes);

                    if (rowSpan && !columns[idx].colSpan) {
                        currentTh += " rowspan='" + rowSpan + "'";
                    }

                    if (index > -1) {
                        currentTh += kendo.attr("index") + "='" + index + "'";
                    }
                    text = th.headerTemplate ? text : "";
                    currentTh += ">" + text + "</th>";
                } else if (th.command) {
                    currentTh += "<th scope='col'" + stringifyAttributes(th.headerAttributes);

                    if (rowSpan && !columns[idx].colSpan) {
                        currentTh += " rowspan='" + rowSpan + "'";
                    }

                    if (index > -1) {
                        currentTh += kendo.attr("index") + "='" + index + "'";
                    }

                    currentTh += ">" + ((!text || text === "&nbsp;") ? text : kendo.template(DEFAULTHEADERTEMPLATE)({ text: text })) + "</th>";
                } else {
                    if (th.field) {
                        field = kendo.attr("field") + "='" + th.field + "' ";
                    }

                    currentTh += "<th scope='col' " + field;
                    if ((columnMenu && th.field && th.menu !== false)) {
                        currentTh += " aria-haspopup='menu'";
                    } else if (filterable && th.filterable !== false && !th.command) {
                        currentTh += " aria-haspopup='dialog'";
                    }

                    if (rowSpan && !columns[idx].colSpan) {
                        currentTh += " rowspan='" + rowSpan + "'";
                    }

                    if (columns[idx].colSpan > 1) {
                        currentTh += 'colspan="' + (columns[idx].colSpan - hiddenLeafColumnsCount(th.columns)) + '" ';
                        currentTh += kendo.attr("colspan") + "='" + columns[idx].colSpan + "'";
                    } else if (columns[idx].colSpan === 1) {
                        currentTh += kendo.attr("colspan") + "='" + columns[idx].colSpan + "'";
                    }

                    if (title) {
                        title = title && (that.options.encodeTitles ? htmlEncode(title, true) : title);
                        currentTh += kendo.attr("title") + '="' + title + '" ';
                    }

                    if (th.groupable !== undefined$1) {
                        currentTh += kendo.attr("groupable") + "='" + th.groupable + "' ";
                    }

                    if (isColumnGroupable(that, th) && (!th.headerAttributes || !th.headerAttributes.title)) {
                        currentTh += "title='";
                        currentTh += isGroupedBy(groups, th.field) ? messages.ungroupHeader : messages.groupHeader;
                        currentTh += "' ";
                    }

                    if (th.aggregates && th.aggregates.length) {
                        currentTh += kendo.attr("aggregates") + "='" + th.aggregates + "'";
                    }

                    if (index > -1) {
                        currentTh += kendo.attr("index") + "='" + index + "'";
                    }

                    currentTh += stringifyAttributes(th.headerAttributes);

                    text = kendo.template(DEFAULTHEADERTEMPLATE)({ text: text });

                    currentTh += ">" + text + "</th>";
                }
                if (that.options.resizable) {
                    html += $(currentTh).attr("data-resizable", (th.resizable !== false).toString()).addClass("k-table-th")[0].outerHTML;
                } else {
                    html += $(currentTh).addClass("k-table-th")[0].outerHTML;
                }
            }
            return html;
        },

        _appendLockedColumnContent: function() {
            var columns = this.columns,
                idx,
                colgroup = this.table.find("colgroup"),
                cols = colgroup.find(COLGROUP),
                length,
                lockedCols = $(),
                skipHiddenCount = 0,
                container,
                colSpan,
                spanIdx,
                colOffset = 0;

            for (idx = 0, length = columns.length; idx < length; idx++) {
                if (columns[idx].locked) {

                    if (isVisible(columns[idx])) {
                        colSpan = 1;

                        if (columns[idx].columns) {
                            colSpan = leafColumns(columns[idx].columns).length - hiddenLeafColumnsCount(columns[idx].columns);
                        }

                        colSpan = colSpan || 1;
                        for (spanIdx = 0; spanIdx < colSpan; spanIdx++) {
                            lockedCols = lockedCols.add(cols.eq(idx + colOffset + spanIdx - skipHiddenCount));
                        }
                        colOffset += colSpan - 1;
                    } else {
                        skipHiddenCount++;
                    }
                }
            }

            container = $('<div class="k-grid-content-locked"><table class="k-grid-table k-table"><colgroup></colgroup><tbody class="k-table-tbody"></tbody></table></div>');
            // detach is required for IE8, otherwise it switches to compatibility mode
            colgroup.detach();
            container.find("colgroup").append(lockedCols);
            colgroup.insertBefore(this.table.find("tbody"));

            this.lockedContent = container.insertBefore(this.content);
            this.lockedTable = container.children("table");
            this.lockedTable.addClass(kendo.getValidCssClass("k-table-", "size", this.options.size));
        },

        _appendLockedColumnFooter: function() {
            var that = this;
            var footer = that.footer;
            var cells = footer.find(".k-footer-template>td");
            var cols = footer.find(".k-grid-footer-wrap>table>colgroup>col");
            var html = $('<div class="k-grid-footer-locked"><table class="k-grid-footer-table k-table"><colgroup></colgroup><tfoot class="k-table-tfoot"><tr class="k-footer-template k-table-row"></tr></tfoot></table></div>');
            var idx, length;
            var groups = that._groups();
            var lockedCells = $(), lockedCols = $();

            html.find("table").addClass(kendo.getValidCssClass("k-table-", "size", this.options.size));

            lockedCells = lockedCells.add(cells.filter(".k-group-cell"));
            for (idx = 0, length = leafColumns(lockedColumns(that.columns)).length; idx < length; idx++) {
                lockedCells = lockedCells.add(cells.eq(idx + groups));
            }

            lockedCols = lockedCols.add(cols.filter(".k-group-col"));
            for (idx = 0, length = visibleColumns(leafColumns(visibleLockedColumns(that.columns))).length; idx < length; idx++) {
                lockedCols = lockedCols.add(cols.eq(idx + groups));
            }

            lockedCells.appendTo(html.find(TR));
            lockedCols.appendTo(html.find("colgroup"));
            that.lockedFooter = html.prependTo(footer);
        },

        _appendLockedColumnHeader: function(container) {
            var that = this,
                columns = this.columns,
                idx,
                html,
                length,
                colgroup,
                tr,
                trFilter,
                table,
                header,
                filtercellCells,
                rows = [],
                skipHiddenCount = 0,
                cols = $(),
                hasFilterRow = that._hasFilterRow(),
                filterCellOffset = 0,
                filterCells = $(),
                cell,
                leafColumnsCount = 0,
                cells = $();

            colgroup = that.thead.prev().find(COLGROUP);
            header = that.thead.find(TR).first().find(".k-header:not(.k-group-cell,.k-hierarchy-cell)");
            filtercellCells = that.thead.find(".k-filter-row").find("td:not(.k-group-cell,.k-hierarchy-cell)");

            var colOffset = 0;
            for (idx = 0, length = columns.length; idx < length; idx++) {
                if (columns[idx].locked) {
                    cell = header.eq(idx);
                    leafColumnsCount = leafColumns(columns[idx].columns || []).length;

                    if (isVisible(columns[idx])) {
                        var colSpan = null;

                        if (columns[idx].columns) {
                            colSpan = leafColumnsCount - hiddenLeafColumnsCount(columns[idx].columns);
                        }

                        colSpan = colSpan || 1;
                        for (var spanIdx = 0; spanIdx < colSpan; spanIdx++) {
                            cols = cols.add(colgroup.eq(idx + colOffset + spanIdx - skipHiddenCount));
                        }
                        colOffset += colSpan - 1;
                    }

                    mapColumnToCellRows([columns[idx]], childColumnsCells(cell), rows, 0, 0);

                    leafColumnsCount = leafColumnsCount || 1;
                    for (var j = 0; j < leafColumnsCount; j++) {
                        filterCells = filterCells.add(filtercellCells.eq(filterCellOffset + j));
                    }
                    filterCellOffset += leafColumnsCount;
                }

                if (columns[idx].columns) {
                    skipHiddenCount += hiddenLeafColumnsCount(columns[idx].columns);
                }

                if (!isVisible(columns[idx])) {
                    skipHiddenCount++;
                }
            }

            if (rows.length) {
                html = '<div class="k-grid-header-locked"><table class="k-grid-header-table k-table"><colgroup></colgroup><thead class="k-table-thead">';
                html += new Array(rows.length + 1).join("<tr class='k-table-row'></tr>");
                html += (hasFilterRow ? '<tr class="k-filter-row k-table-row"></tr>' : '') + '</thead></table></div>';

                table = $(html);

                table.find('.k-grid-header-locked').css('width', '1px');

                table.find("table").addClass(kendo.getValidCssClass("k-table-", "size", that.options.size));
                colgroup = table.find("colgroup");
                colgroup.append(that.thead.prev().find("col.k-group-col").add(cols));

                tr = table.find("thead tr:not(.k-filter-row)");
                for (idx = 0, length = rows.length; idx < length; idx++) {
                    cells = toJQuery(rows[idx]);
                    tr.eq(idx).append(that.thead.find(TR).eq(idx).find(".k-group-cell").add(cells));
                }

                var count = removeEmptyRows(this.thead);
                if (rows.length < count) {
                    removeRowSpanValue(table, count - rows.length);
                }

                trFilter = table.find(".k-filter-row");
                trFilter.append(that.thead.find(".k-filter-row .k-group-cell").add(filterCells));

                this.lockedHeader = table.prependTo(container);
                this.thead.find(".k-group-cell").remove();

                return true;
            }
            return false;
        },

        _removeLockedContainers: function() {
            var elements = this.lockedHeader
                .add(this.lockedContent)
                .add(this.lockedFooter);

            kendo.destroy(elements);
            elements.off(NS).remove();

            this.lockedHeader = this.lockedContent = this.lockedFooter = null;
            this.selectable = null;
        },

        _thead: function() {
            var that = this,
                columns = that.columns,
                hasDetails = that._hasDetails() && columns.length,
                hasFilterRow = that._hasFilterRow(),
                idx,
                html = "",
                thead = that.table.find(">thead"),
                hasTHead = that.element.find("thead").first().length > 0,
                headerContent = that.options.messages.expandCollapseColumnHeader,
                tr;

            const isStacked = that._isStackedMode();

            if (!isStacked) {
                if (!thead.length) {
                    thead = $("<thead/>").insertBefore(that.tbody);
                }

                thead.addClass("k-table-thead");

                if (that.lockedHeader && that.thead) {
                    tr = that.thead.find("tr:has(th):not(.k-filter-row)").html("");
                    tr.remove();
                    tr = $();

                    that._removeLockedContainers();
                } else if (hasTHead) {
                    tr = that.element.find("thead").first().find("tr:has(th):not(.k-filter-row)");
                } else {
                    tr = that.element.find("tr:has(th)").first();
                }

                if (!tr.length) {
                    tr = thead.children().first();
                    if (!tr.length) {
                        var rows = [{ rowSpan: 1, cells: [], index: 0 }];
                        that._prepareColumns(rows, columns);

                        for (idx = 0; idx < rows.length; idx++) {
                            html += "<tr class='k-table-row'>";
                            if (hasDetails) {
                                html += '<th class="k-hierarchy-cell k-table-th" scope="col">' + headerContent + '</th>';
                            }
                            html += that._createHeaderCells(rows[idx].cells, rows[idx].rowSpan);
                            html += "</tr>";
                        }

                        tr = $(html);
                        kendo.applyStylesFromKendoAttributes(tr, ["display", "left", "right"]);
                    }
                } else {
                    for (idx = 0; idx < columns.length; idx++) {
                        let columnIndex = inArray(columns[idx], leafColumns(columns));
                        let cell = leafDataCells(tr.parent()).filter("th:not(.k-group-cell):not(.k-hierarchy-cell)").eq(columnIndex);
                        cell.addClass("k-table-th");

                        const cellElement = cell[0];
                        const cellChildNodes = cellElement?.childNodes || [];

                        // Apply the default template only if the cell contains a single text node.
                        // In all other cases the structure must remain unchanged. It is up to the developer to provide a custom template.
                        if (cellChildNodes.length === 1 && cellChildNodes[0].nodeType === 3) {
                            cell.html(DEFAULTHEADERTEMPLATE({ text: htmlEncode(cell.text()) }));
                        }

                        if (columns[idx].hidden && columnIndex >= 0) {
                            cellElement.style.display = NONE;
                        }
                    }

                    that._updateHeadersAttr(childColumns(columns));
                }

                if (hasFilterRow) {
                    var filterRow = $("<tr/>");
                    filterRow.addClass("k-filter-row k-table-row");
                    if (hasDetails || tr.find(".k-hierarchy-cell").length) { // handles server side detail template
                        filterRow.prepend('<td class="k-table-td k-hierarchy-cell">&nbsp;</td>');
                    }

                    var existingFilterRow = (that.thead || thead).find(".k-filter-row");
                    if (existingFilterRow.length) {
                        kendo.destroy(existingFilterRow);
                        existingFilterRow.remove();
                    }

                    thead.append(filterRow);
                }

                if (!tr.children().length) {
                    html = "";
                    if (hasDetails) {
                        html += '<th class="k-hierarchy-cell k-table-th" scope="col">&nbsp;</th>';
                    }

                    html += that._createHeaderCells(columns);

                    tr.html(html);
                } else if (hasDetails && !tr.find(".k-hierarchy-cell")[0]) {
                    tr.prepend('<th class="k-hierarchy-cell k-table-th" scope="col">' + (headerContent ? headerContent : '&nbsp;') + '</th>');
                }

                const th = tr.find(TH);

                th.addClass(HEADER_CLASS);

                if (th.length > 0) {
                    thead.attr(ROLE, ROWGROUP);
                }

                if (!that.options.scrollable) {
                    thead.addClass("k-grid-header");
                }

                tr.find("script").remove().end().prependTo(thead);

                if (that.thead) {
                    that._destroyColumnAttachments();
                }

                that.thead = thead;
            }

            that._sortable();

            that._filterable();

            that._filterRow();

            that._scrollable();

            that._columnMenu();

            var syncHeight;
            var hasLockedColumns = this.options.scrollable && lockedColumns(this.columns).length;

            if (hasLockedColumns && !isStacked) {

                syncHeight = that._appendLockedColumnHeader(that.thead.closest(".k-grid-header"));

                that._appendLockedColumnContent();

                that.lockedContent.on("DOMMouseScroll" + NS + " mousewheel" + NS, that._wheelScroll.bind(that));

                if (kendo.support.touch) {
                    that._lockedContentUserEvents = new kendo.UserEvents(that.lockedContent, {
                        move: function(e) {
                            that.content.scrollTop(that.content.scrollTop() + (-e.y.delta));
                            e.preventDefault();
                        }
                    });
                }

                that._updateLockedCols();
            }

            that._updateCols();
            if (!isStacked) {

                that._updateColumnCellIndex();

                that._updateFirstColumnClass();
            }

            that._resizable();

            that._draggable();

            that._reorderable();

            if (!isStacked) {
                that._updateHeader(that._groups());

                that._updateStickyColumns();
            }

            if (hasLockedColumns && !isStacked) {
                if (syncHeight) {
                    that._syncLockedHeaderHeight();
                }

                that._applyLockedContainersWidth();
            }
        },

        _retrieveFirstColumn: function(columns, rows) {
            var result = $();

            if (rows.length && columns[0]) {
                var column = columns[0];

                while (column.columns && column.columns.length) {
                    column = column.columns[0];
                    rows = rows.filter(":not(:first)");
                }

                result = result.add(rows);
            }

            return result;
        },

        _updateFirstColumnClass: function() {
            var that = this,
                columns = that.columns || [],
                hasDetails = that._hasDetails() && columns.length;

            if (!hasDetails && !that._groups()) {
                var tr = that.thead.find(">tr:not(.k-filter-row):not(:first)");
                columns = nonLockedColumns(columns);

                var rows = that._retrieveFirstColumn(columns, tr);

                if (that._isLocked()) {
                    tr = that.lockedHeader.find("thead>tr:not(.k-filter-row):not(:first)");
                    columns = lockedColumns(that.columns);

                    rows = rows.add(that._retrieveFirstColumn(columns, tr));
                }

                rows.each(function() {
                    var ths = $(this).find("th");
                    ths.removeClass("k-first");
                    ths.eq(0).addClass("k-first");
                });
            }
        },

        _prepareColumns: function(rows, columns, parentCell, parentRow) {
            var row = parentRow || rows[rows.length - 1];

            var childRow = rows[row.index + 1];
            var totalColSpan = 0;

            for (var idx = 0; idx < columns.length; idx++) {
                var cell = { column: columns[idx], colSpan: 0 };
                row.cells.push(cell);

                if (columns[idx].columns && columns[idx].columns.length) {
                    if (!childRow) {
                        childRow = { rowSpan: 0, cells: [], index: rows.length };
                        rows.push(childRow);
                    }
                    cell.colSpan = columns[idx].columns.length;
                    this._prepareColumns(rows, columns[idx].columns, cell, childRow);
                    totalColSpan += cell.colSpan - 1;
                    row.rowSpan = rows.length - row.index;
                }
            }
            if (parentCell) {
                parentCell.colSpan += totalColSpan;
            }
        },

        _wheelScroll: function(e) {
            if (e.ctrlKey) {
                return;
            }

            var content = this.content;

            if (this.virtualScroll && this.virtualScroll.rows) {
                content = this.virtualScrollable.verticalScrollbar;
            }

            var scrollTop = content.scrollTop(),
                delta = kendo.wheelDeltaY(e);

            if (delta) {
                if (content[0].scrollHeight > content[0].clientHeight &&
                    (content[0].scrollTop < content[0].scrollHeight - content[0].clientHeight && delta < 0 ||
                        content[0].scrollTop > 0 && delta > 0)) {
                    e.preventDefault();
                }

                content.scrollTop(scrollTop + (-delta));
            }
        },

        _isLocked: function() {
            return this.lockedHeader != null;
        },

        _updateHeaderCols: function() {
            var table = this.thead.parent().add(this.table);

            if (this._isLocked()) {
                normalizeCols(table, visibleLeafColumns(visibleNonLockedColumns(this.columns)), this._hasDetails(), 0);
            } else {
                normalizeCols(table, visibleLeafColumns(visibleColumns(this.columns)), this._hasDetails(), 0);
            }
        },

        _updateColumnSorters: function() {
            var that = this;
            var cells = leafDataCells(that.thead);
            var columns = leafColumns(that.columns);
            var column;
            var cell;
            var sorterInstance;

            if (!that.options.sortable) {
                return;
            }

            for (var idx = 0, length = cells.length; idx < length; idx++) {
                column = columns[idx];

                if (column.sortable !== false && !column.command && column.field) {
                    cell = cells.eq(idx);

                    sorterInstance = cell.data("kendoColumnSorter");

                    if (sorterInstance) {
                        sorterInstance.refresh();
                    }
                }
            }
        },

        _updateHeadersAttr: function(columns) {
            if (!columns.length) {
                return;
            }

            var that = this;

            for (var i = 0; i < columns.length; i++) {
                if (columns[i].headerAttributes) {
                    var th = that.element.find("[id='" + columns[i].headerAttributes.id + "']");
                    th.attr("headers", columns[i].headerAttributes.headers);
                }
            }

            that._updateHeadersAttr(childColumns(columns));
        },

        _updateCols: function(table) {
            const that = this;
            const defaultTable = that._isStackedMode() ? that.table : that.thead.parent().add(that.table);
            table = table || defaultTable;

            this._appendCols(table, this._isLocked());
        },

        _updateLockedCols: function(table) {
            if (this._isLocked()) {
                table = table || this.lockedHeader.find("table").add(this.lockedTable);

                normalizeCols(table, visibleLeafColumns(visibleLockedColumns(this.columns)), this._hasDetails(), this._groups());
            }
        },

        _appendCols: function(table, locked) {
            if (locked) {
                normalizeCols(table, visibleLeafColumns(visibleNonLockedColumns(this.columns)), this._hasDetails(), 0);
            } else {
                normalizeCols(table, visibleLeafColumns(visibleColumns(this.columns)), this._hasDetails(), this._groups(), this._isStackedMode());
            }
        },

        _autoColumns: function(schema) {
            if (schema && schema.toJSON) {
                var that = this,
                    field,
                    encoded;

                schema = schema.toJSON();

                encoded = !(that.table.find("tbody tr").length > 0 && (!that.dataSource || !that.dataSource.transport));

                for (field in schema) {
                    that.columns.push({ field: field, encoded: encoded, headerAttributes: { id: kendo.guid() } });
                }

                that._thead();

                that._templates();
            }
        },

        _setRowCachedHeight: function(row, uid) {
            var cachedHeights = this._cachedRowsHeight,
                cachedHeight = cachedHeights[uid],
                $row;

            if (cachedHeight) {
                $row = $(row);
                $row[0].style.height = cachedHeight + "px";
                row = $row.prop("outerHTML");
            }

            return row;
        },

        _rowsHtml: function(data, templates) {
            var that = this,
                html = "",
                idx,
                rowTemplate = templates.rowTemplate,
                altRowTemplate = templates.altRowTemplate,
                cachedHeights = that._cachedRowsHeight,
                length, row;

            for (idx = 0, length = data.length; idx < length; idx++) {
                if (that._skipRerenderItemsCount > 0) {
                    that._skipRerenderItemsCount--;
                } else {
                    if (idx % 2) {
                        row = altRowTemplate(data[idx]);
                    } else {
                        row = rowTemplate(data[idx]);
                    }

                    if (cachedHeights) {
                        row = that._setRowCachedHeight(row, data[idx].uid);
                    }

                    html += row;
                }
                that._data.push(data[idx]);
            }

            return html;
        },

        _groupData: function(group, skipFooter, firstColumn) {
            var that = this,
                footerDefaults = that._groupAggregatesDefaultObject || {},
                groupItems = group.items,
                aggregates = extend({}, footerDefaults, group.aggregates),
                headerData = extend({}, {
                    field: group.field,
                    value: group.value,
                    items: groupItems,
                    aggregates: aggregates
                }, group.aggregates[firstColumn ? firstColumn.field : group.field]),
                footerData = {};

            if (!skipFooter) {
                for (var aggregate in aggregates) {
                    footerData[aggregate] = extend({}, aggregates[aggregate],
                        { group: { field: group.field, value: group.value, items: groupItems } }
                    );
                }
            }
            return extend({}, footerData, headerData);
        },

        _removeGroupIfEmpty: function(row) {
            var that = this,
                itemsCount,
                subgroupsCount,
                length = that.dataSource._group.length;

            for (var i = 0; i < length; i++) {
                row = row.prev();
                itemsCount = +row.attr('data-group-item-count');
                subgroupsCount = +row.attr('data-sub-group-count');

                if (itemsCount == 1 || subgroupsCount == 1) {
                    row.hide();
                }

            }
        },

        _groupRowHtml: function(group, colspan, level, groupHeaderBuilder, templates, skipColspan, skipLastGroup, isLockedTable) {
            var that = this,
                html = "",
                idx,
                length,
                isLocked = that.lockedContent != null,
                field = group.field,
                column = grep(leafColumns(that.columns), function(column) { return column.field == field; })[0] || {},
                firstColumn = visibleColumns(that.columns)[0],
                firstVisibleColumnGroupHeaderTemplate = firstColumn ? firstColumn.groupHeaderColumnTemplate : null,
                template = column.groupHeaderTemplate ? column.groupHeaderTemplate : firstVisibleColumnGroupHeaderTemplate,
                text = (column.title && (that.options.encodeTitles ? htmlEncode(column.title, true) : column.title) || htmlEncode(field, true)) + ': ' + formatGroupValue(group.value, column.format, column.values, column.encoded),
                groupItems = group.currentItems || group.items,
                groups = that._groups(),
                groupFooterTemplate = templates.groupFooterTemplate,
                groupHeaderColumnTemplate = templates.groupHeaderColumnTemplate,
                groupData,
                isGroupPaged = that.dataSource._isGroupPaged(),
                expanded = isGroupPaged ? that.dataSource._groupsState[group.uid] : true;

            if (that.options.editable && group.items && group.items[0] && group.items[0].isNew && group.items[0].isNew()) {
                expanded = true;
            }

            if (templates.groupFooterTemplate || templates.groupHeaderColumnTemplate || column.groupHeaderTemplate || that._isStackedMode()) {
                groupData = that._groupData(group, false, !column.groupHeaderTemplate && visibleColumns(that.columns)[0].groupHeaderColumnTemplate ? visibleColumns(that.columns)[0] : false);
            }
            if (template && !skipColspan) {
                text = typeof template === FUNCTION ? template(groupData) : kendo.template(template)(groupData);
            }

            if (!that._skipRerenderItemsCount) {
                if (!group.excludeHeader) {
                    html += groupHtmlBuilder({ groupHeaderColumnTemplate, groupHeaderBuilder, colspan, templateColspan: groups - level, groupData, level, text, expanded, group, isGroupPaged, stacked: that._isStackedMode() });
                } else if (isLocked) {
                    group.excludeHeader = isLockedTable ? false : true;
                } else {
                    group.excludeHeader = false;
                }
            } else {
                groupHeaderBuilder(colspan, level, text, expanded, group.uid, isGroupPaged, that._isStackedMode());
            }

            if (expanded) {
                if (group.hasSubgroups) {
                    for (idx = 0, length = groupItems.length; idx < length; idx++) {
                        html += that._groupRowHtml(groupItems[idx], skipColspan ? colspan : colspan - 1, level + 1, groupHeaderBuilder, templates, skipColspan, skipLastGroup && idx === groupItems.length - 1, isLockedTable);
                    }
                } else {
                    html += that._rowsHtml(groupItems, templates);
                }
            }

            if (groupFooterTemplate) {

                if (skipLastGroup) {
                    if (!inArray(group.value, that._skippedGroups)) {
                        that._skippedGroups.push(group.value);
                    }
                } else {
                    if (that._skippedGroups.length && that._skippedGroups[0] === group.value) {
                        that._skippedGroups.shift();
                    }
                    if (!that._skipRerenderItemsCount) {
                        html += groupFooterTemplate(groupData);
                    }
                }
            }
            return html;
        },

        collapseGroup: function(group) {
            var level,
                that = this,
                groupToCollapse = group,
                groupable = this.options.groupable,
                showFooter = groupable.showFooter,
                footerCount = showFooter ? 0 : 1,
                offset,
                relatedGroup = $(),
                idx,
                length,
                tr;

            group = $(group);
            level = group.find(".k-group-cell").length;

            if (this.dataSource._isGroupPaged()) {
                var groupUid = group.attr("data-group-uid");
                var groupObject = that.dataSource._getGroupByUid(groupUid);
                var currentGroupCount = that.dataSource._calculateGroupsTotal([groupObject], true);
                var groupCountAfterCollapse;

                that.dataSource._groupsState[groupUid] = false;
                groupCountAfterCollapse = that.dataSource._calculateGroupsTotal([groupObject], true);
                that.dataSource._serverGroupsTotal -= currentGroupCount - groupCountAfterCollapse;
                that._progress(true);
                that.dataSource.range(that.dataSource._currentRangeStart, that.dataSource.take(), function() {
                    that._progress(false);
                }, "collapseGroup");
                return;
            }

            if (this._isLocked()) {
                if (!group.closest(DIV).hasClass("k-grid-content-locked")) {
                    relatedGroup = group.nextAll(TR);
                    group = this.lockedTable.find(">tbody>tr").eq(group.index());
                } else {
                    relatedGroup = this.tbody.children(TR).eq(group.index()).nextAll(TR);
                }
            }

            if (group.find(CARET_ALT_DOWN).length) {
                kendo.ui.icon(group.find(CARET_ALT_DOWN), { icon: `caret-alt-${isRtl ? 'left' : 'right'}` });
            }

            group.find("td[aria-expanded='true']").first().attr(ARIA_EXPANDED, false)
                .find("a").attr(ARIA_LABEL, EXPAND);

            group = group.nextAll(TR);

            var toHide = [];

            for (idx = 0, length = group.length; idx < length; idx++) {
                tr = group.eq(idx);
                offset = tr.find(".k-group-cell").length;

                if (tr.hasClass(GROUPING_ROW)) {
                    footerCount++;
                } else if (tr.hasClass("k-group-footer")) {
                    footerCount--;
                }

                if (offset <= level || (tr.hasClass("k-group-footer") && footerCount < 0)) {
                    break;
                }

                if (relatedGroup.length) {
                    toHide.push(relatedGroup[idx]);
                }
                toHide.push(tr[0]);
            }

            $(toHide).hide();

            if (this.options.scrollable.endless && this.content) {
                clearTimeout(that._collapseGroupsTimeOut);
                that._collapseGroupsTimeOut = setTimeout(function() {
                    that.content.scroll();
                    that._groupToCollapse = groupToCollapse;
                });
            }
        },

        expandGroup: function(group) {
            group = $(group);

            var that = this,
                showFooter = that.options.groupable.showFooter,
                level,
                tr,
                offset,
                relatedGroup = $(),
                idx,
                length,
                footersVisibility = [],
                groupsCount = 1;

            level = group.find(".k-group-cell").length;

            if (this.dataSource._isGroupPaged()) {
                var groupUid = group.attr("data-group-uid");
                var groupObject = that.dataSource._getGroupByUid(groupUid);
                var groupCount = that.dataSource._calculateGroupsTotal([groupObject], true);
                var groupCountAfterExpand;

                that.dataSource._groupsState[groupUid] = true;
                if (groupObject.items && groupObject.items.length) {
                    groupCountAfterExpand = that.dataSource._calculateGroupsTotal([groupObject], true);
                    that.dataSource._serverGroupsTotal += groupCountAfterExpand - groupCount;
                }

                that._progress(true);
                that.dataSource.range(that.dataSource._currentRangeStart, that.dataSource.take(), function() {
                    that._progress(false);
                }, "expandGroup");
                return;
            }

            if (this._isLocked()) {
                if (!group.closest(DIV).hasClass("k-grid-content-locked")) {
                    relatedGroup = group.nextAll(TR);
                    group = this.lockedTable.find(">tbody>tr").eq(group.index());
                } else {
                    relatedGroup = this.tbody.children(TR).eq(group.index()).nextAll(TR);
                }
            }

            if (group.find(CARET_ALT_RIGHT).length) {
                kendo.ui.icon(group.find(CARET_ALT_RIGHT), { icon: "caret-alt-down" });
            }

            group.find("td[aria-expanded='false']").first().attr(ARIA_EXPANDED, true)
                .find("a").attr(ARIA_LABEL, COLLAPSE);
            group = group.nextAll(TR);

            for (idx = 0, length = group.length; idx < length; idx++) {
                tr = group.eq(idx);
                offset = tr.find(".k-group-cell").length;
                if (offset <= level) {
                    break;
                }

                if (offset == level + 1 && !tr.hasClass("k-detail-row")) {
                    tr.show();
                    relatedGroup.eq(idx).show();

                    if (tr.hasClass(GROUPING_ROW) && tr.find(".k-icon,.k-svg-icon").is(CARET_ALT_DOWN)) {
                        that.expandGroup(tr);
                    }

                    if (tr.hasClass("k-master-row") && tr.find(".k-icon,.k-svg-icon").is(CARET_ALT_DOWN)) {
                        tr.next().show();
                        relatedGroup.eq(idx + 1).show();
                    }
                }

                if (tr.hasClass(GROUPING_ROW)) {
                    if (showFooter) {
                        footersVisibility.push(tr.is(":visible"));
                    }
                    groupsCount++;
                }

                if (tr.hasClass("k-group-footer")) {
                    if (showFooter) {
                        var toggleVisibility = footersVisibility.pop();
                        tr.toggle(toggleVisibility);
                        relatedGroup.eq(idx).toggle(toggleVisibility);
                    }
                    if (groupsCount == 1) {
                        tr.show();
                        relatedGroup.eq(idx).show();
                    } else {
                        groupsCount--;
                    }
                }
            }

            if ((level === 0 && that.options.scrollable.endless && this._isLocked()) ||
                (!that.options.scrollable.endless && this._isLocked())) {
                that._syncLockedContentHeight();
            }
        },

        _updateHeader: function(groups) {
            var that = this,
                container = that._isLocked() ? that.lockedHeader.find("thead") : that.thead,
                filterCells = container.find("tr.k-filter-row").find("td.k-group-cell").length,
                length = container.find(TR).first().find("th.k-group-cell").length,
                rows = container.children("tr:not(:first)").filter(function() {
                    return !$(this).children(":visible").length;
                });

            if (groups > length) {
                $(new Array(groups - length + 1).join('<th class="k-group-cell k-header k-table-th" scope="col">' + encode(that.options.messages.expandCollapseColumnHeader) + '</th>')).prependTo(container.children("tr:not(.k-filter-row)"));
                if (that.element.is(":visible")) {
                    rows.find("th.k-group-cell").hide();
                }
            } else if (groups < length) {
                container.find(TR).each(function() {
                    $(this).find(".k-group-cell").eq(groups).remove();
                    $(this).find(".k-group-cell").slice(groups).remove();
                });
            }
            if (groups > filterCells) {
                $(new Array(groups - filterCells + 1).join('<td class="k-group-cell k-table-group-td k-table-td">&nbsp;</td>')).prependTo(container.find(".k-filter-row"));
            }
        },

        _firstDataItem: function(data, grouped) {
            if (data && grouped) {
                if (data.hasSubgroups) {
                    data = this._firstDataItem(data.items[0], grouped);
                } else {
                    data = data.items[0];
                }
            }
            return data;
        },

        _updateTablesWidth: function() {
            var that = this,
                tables;

            if (!that._isLocked()) {
                return;
            }

            tables =
                $(">.k-grid-footer>.k-grid-footer-wrap>table", that.wrapper)
                    .add(that.thead.parent())
                    .add(that.table);

            that._footerWidth = tableWidth(tables.eq(0));
            tables.width(that._footerWidth);

            tables =
                $(">.k-grid-footer>.k-grid-footer-locked>table", that.wrapper)
                    .add(that.lockedHeader.find(">table"))
                    .add(that.lockedTable);

            tables.width(tableWidth(tables.eq(0)));
        },

        hideColumn: function(column) {
            var that = this,
                cell,
                tables,
                idx,
                cols,
                colWidth,
                position,
                width = 0,
                headerCellIndex,
                length,
                footer = that.footer || that.wrapper.find(".k-grid-footer"),
                virtualScroll = that.virtualScroll || {},
                columns = that.columns,
                visibleLocked = that.lockedHeader ? leafDataCells(that.lockedHeader.find(">table>thead")).filter(isCellVisible).length : 0,
                columnIndex,
                groupHeaderColumnTemplateColumns,
                columnsToHide;

            if (!Array.isArray(column)) {
                columnsToHide = [column];
            } else {
                columnsToHide = column;
            }

            columnsToHide.forEach((column) => {
                groupHeaderColumnTemplateColumns = grep(leafColumns(that.columns), function(column) { return column.groupHeaderColumnTemplate; });

                if (typeof column == "number") {
                    column = columns[column];
                } else if (isPlainObject(column)) {
                    column = grep(flatColumns(columns), function(item) {
                        return item === column;
                    })[0];
                } else {
                    column = grep(flatColumns(columns), function(item) {
                        return item.field === column;
                    })[0];
                }

                if (!column || !isVisible(column)) {
                    return;
                }

                if (that._isStackedMode()) {
                    that._stackedColumnVisibility(column, "hide");
                    that.trigger(COLUMNHIDE, { column: column });
                    return;
                }

                var setColumnVisibility = that._columnVisibilitySetter(column);

                if (column.columns && column.columns.length) {
                    position = columnVisiblePosition(column, columns);

                    setColumnVisibility(column, false);

                    setCellVisibility(elements($(">table>thead", that.lockedHeader), that.thead, ">tr:eq(" + position.row + ")>th"), position.cell, false);

                    for (idx = 0; idx < column.columns.length; idx++) {
                        this.hideColumn(column.columns[idx]);
                    }

                    that._ariaAddHiddenColIndex();
                    that.trigger(COLUMNHIDE, { column: column });

                    return;
                }

                columnIndex = inArray(column, visibleColumns(leafColumns(columns)));

                setColumnVisibility(column, false);

                that._setParentsVisibility(column, false);

                that._templates();

                that._updateCols();
                that._updateLockedCols();

                var container = that.thead;

                headerCellIndex = columnIndex;
                if (that.lockedHeader && visibleLocked > columnIndex) {
                    container = that.lockedHeader.find(">table>thead");
                } else {
                    headerCellIndex -= visibleLocked;
                }
                cell = leafDataCells(container).filter(isCellVisible).eq(headerCellIndex);
                cell[0].style.display = NONE;
                setCellVisibility(elements($(">table>thead", that.lockedHeader), that.thead, ">tr.k-filter-row>td"), columnIndex, false);
                if (footer[0]) {
                    that._updateCols(footer.find(">.k-grid-footer-wrap>table"));
                    that._updateLockedCols(footer.find(">.k-grid-footer-locked>table"));
                    setCellVisibility(footer.find(".k-footer-template>td"), columnIndex, false);
                }

                if (virtualScroll.columns && !column.locked) {
                    that._updateContentWidth();
                    that.trigger(COLUMNHIDE, { column: column });
                    return;
                }

                if (that.lockedTable && visibleLocked > columnIndex) {
                    hideColumnCells(that.lockedTable.find(">tbody>tr"), columnIndex);
                } else {
                    hideColumnCells(that.tbody.children(), columnIndex - visibleLocked);
                }

                if (that.lockedTable) {
                    that._updateTablesWidth();
                    that._applyLockedContainersWidth();
                    that._syncLockedContentHeight();
                    that._syncLockedHeaderHeight();
                    that._syncLockedFooterHeight();
                } else {
                    cols = that.thead ? that.thead.prev().find("col") : [];
                    for (idx = 0, length = cols.length; idx < length; idx += 1) {
                        colWidth = cols[idx].style.width;

                        if (cols[idx].className.indexOf("k-hierarchy-col") > -1) {
                            width += outerWidth(cols[idx]);
                            continue;
                        }

                        if (cols[idx].className.indexOf("k-group-col") > -1) {
                            width += outerWidth(cols[idx]);
                            continue;
                        }

                        if (colWidth && colWidth.indexOf("%") == -1) {
                            width += parseInt(colWidth, 10);
                        } else {
                            width = 0;
                            break;
                        }
                    }

                    tables = that.wrapper.find(">.k-grid-header table").first().add(that.wrapper.find(">.k-grid-footer table").first()).add(that.table);
                    that._footerWidth = null;

                    if (width) {
                        tables.each(function() {
                            this.style.width = width + PX;
                        });

                        that._footerWidth = width;
                        that._setContentWidth();
                    }
                }

                that._updateFirstColumnClass();
                that._updateStickyColumns();
                that._ariaAddHiddenColIndex();

                if (groupHeaderColumnTemplateColumns.length > 0) {
                    that._renderGroupRows();
                }
                that.trigger(COLUMNHIDE, { column: column });
            });
        },

        _stackedColumnVisibility: function(column, method) {
            const that = this;
            const field = column.field;
            let index;

            if (that.columns.length) {
               for (let i = 0; i < that.columns.length; i++) {
                    if (that.columns[i].field === field) {
                        index = i;
                        break;
                    }
               }

               if (index || index === 0) {
                   const cells = that.table.find(".k-grid-stack-cell[data-index='" + index + "']");
                   cells.each(function() {
                        const cell = $(this);
                        if (!cell.closest(".k-detail-row").length) {
                            cell[method]();
                        }
                   });
                   setColumnVisibility(column, method === "show");
               }
            }
        },

        _setParentsVisibility: function(column, visible) {
            var that = this;
            var columns = that.columns;
            var idx;
            var parents = [];
            var parent;
            var position;
            var cell;
            var colSpan;
            var setColumnVisibility = that._columnVisibilitySetter(column);

            var predicate = visible ?
                function(p) { return visibleColumns(p.columns).length && p.hidden; } :
                function(p) { return !visibleColumns(p.columns).length && !p.hidden; };


            if (columnParents(column, columns, parents) && parents.length) {
                for (idx = parents.length - 1; idx >= 0; idx--) {
                    parent = parents[idx];
                    position = columnPosition(parent, columns);
                    cell = elements($(">table>thead", this.lockedHeader), this.thead, ">tr:eq(" + position.row + ")>th:not(.k-group-cell):not(.k-hierarchy-cell)").eq(position.cell);

                    if (predicate(parent)) {
                        setColumnVisibility(parent, visible);
                        cell[0].style.display = visible ? "" : NONE;
                    }

                    if (cell.filter("[" + kendo.attr("colspan") + "]").length) {
                        colSpan = parseInt(cell.attr(kendo.attr("colspan")), 10);
                        cell[0].colSpan = (colSpan - hiddenLeafColumnsCount(parent.columns)) || 1;
                    }
                }
            }
        },

        _updateContentWidth: function() {
            const that = this;
            const tables = that.table.add(that.thead ? that.thead.parent() : $());

            tables.css({
                width: sumWidths(visibleLeafColumns(visibleNonLockedColumns(that.columns)))
            });
            that.refresh();
        },

        showColumn: function(column) {
            var that = this,
                idx,
                length,
                cell,
                tables,
                width,
                headerCellIndex,
                position,
                colWidth,
                cols,
                columns = that.columns,
                virtualScroll = that.virtualScroll || {},
                footer = that.footer || that.wrapper.find(".k-grid-footer"),
                lockedColumnsCount = that.lockedHeader ? leafDataCells(that.lockedHeader.find(">table>thead")).length : 0,
                columnIndex,
                originalColumn,
                columnLeafIndex,
                groupHeaderColumnTemplateColumns,
                columnsToShow;

            if (!Array.isArray(column)) {
                columnsToShow = [column];
            } else {
                columnsToShow = column;
            }

            columnsToShow.forEach((column) => {
                groupHeaderColumnTemplateColumns = grep(leafColumns(that.columns), function(column) { return column.groupHeaderColumnTemplate; });

                if (typeof column == "number") {
                    columnIndex = column;
                    column = columns[column];
                } else if (isPlainObject(column)) {
                    $.each(flatColumns(columns), function(index, item) {
                        if (item === column) {
                            column = item;
                            columnIndex = index;
                            return false;
                        }
                    });
                } else {
                    $.each(flatColumns(columns), function(index, item) {
                        if (item.field === column) {
                            column = item;
                            columnIndex = index;
                            return false;
                        }
                    });
                }

                if (!column || isVisible(column)) {
                    return;
                }

                if (that._isStackedMode()) {
                    that._stackedColumnVisibility(column, "show");
                    that.trigger(COLUMNSHOW, { column: column });
                    return;
                }

                var setColumnVisibility = that._columnVisibilitySetter(column);

                if (column.columns && column.columns.length) {
                    position = columnPosition(column, columns);
                    originalColumn = flatColumns(that.options.columns)[columnIndex];

                    setColumnVisibility(column, true);

                    setCellVisibility(elements($(">table>thead", that.lockedHeader), that.thead, ">tr:eq(" + position.row + ")>th"), position.cell, true);

                    for (idx = 0; idx < column.columns.length; idx++) {
                        if (!originalColumn.columns[idx].hidden) {
                            this.showColumn(column.columns[idx]);
                        }
                    }

                    that._ariaRemoveHiddenColIndex();
                    that.trigger(COLUMNSHOW, { column: column });

                    return;
                }

                columnLeafIndex = inArray(column, leafColumns(columns));

                setColumnVisibility(column, true);

                that._setParentsVisibility(column, true);

                that._templates();
                that._updateCols();
                that._updateLockedCols();

                var container = that.thead;

                headerCellIndex = columnLeafIndex;
                if (that.lockedHeader && lockedColumnsCount > columnLeafIndex) {
                    container = that.lockedHeader.find(">table>thead");
                } else {
                    headerCellIndex -= lockedColumnsCount;
                }

                cell = leafDataCells(container).eq(headerCellIndex);
                cell[0].style.display = "";
                cell[0].classList.remove("k-hidden");

                setCellVisibility(elements($(">table>thead", that.lockedHeader), that.thead, ">tr.k-filter-row>td"), columnLeafIndex, true);
                if (footer[0]) {
                    that._updateCols(footer.find(">.k-grid-footer-wrap>table"));
                    that._updateLockedCols(footer.find(">.k-grid-footer-locked>table"));
                    setCellVisibility(footer.find(".k-footer-template>td"), columnLeafIndex, true);
                }

                if (virtualScroll.columns && !column.locked) {
                    that._updateContentWidth();
                    that.trigger(COLUMNSHOW, { column: column });
                    return;
                }

                if (that.lockedTable && lockedColumnsCount > columnLeafIndex) {
                    showColumnCells(that.lockedTable.find(">tbody>tr"), columnLeafIndex);
                } else {
                    showColumnCells(that.tbody.children(), columnLeafIndex - lockedColumnsCount);
                }

                if (that.lockedTable) {
                    that._updateTablesWidth();
                    that._applyLockedContainersWidth();
                    that._syncLockedContentHeight();
                    that._syncLockedHeaderHeight();
                } else {
                    tables = that.wrapper.find(">.k-grid-header table").first().add(that.wrapper.find(">.k-grid-footer table").first()).add(that.table);
                    if (!column.width) {
                        tables.width("");
                    } else {
                        width = 0;
                        cols = that.thead.prev().find("col");
                        for (idx = 0, length = cols.length; idx < length; idx += 1) {
                            colWidth = cols[idx].style.width;

                            if (cols[idx].className.indexOf("k-hierarchy-col") > -1) {
                                width += outerWidth(cols[idx]);
                                continue;
                            }

                            if (cols[idx].className.indexOf("k-group-col") > -1) {
                                width += outerWidth(cols[idx]);
                                continue;
                            }

                            if (colWidth.indexOf("%") > -1) {
                                width = 0;
                                break;
                            }
                            width += parseInt(colWidth, 10);
                        }

                        that._footerWidth = null;
                        if (width) {
                            tables.each(function() {
                                this.style.width = width + PX;
                            });
                            that._footerWidth = width;
                            that._setContentWidth();
                        }
                    }
                }

                that._updateFirstColumnClass();
                that._updateStickyColumns();
                if (groupHeaderColumnTemplateColumns.length > 0) {
                    that._renderGroupRows();
                }
                that._ariaRemoveHiddenColIndex();
                that.trigger(COLUMNSHOW, { column: column });
            });
        },

        _columnVisibilitySetter: function(column) {
            var col = column || {};

            if (isUndefined(col.media)) {
                return setColumnVisibility;
            } else {
                return setColumnMediaVisibility;
            }
        },


        _buildSkeleton: function() {
            const visibleColumns = this.virtualCols ? this.virtualCols : visibleLeafColumns(this.columns);
            const pageSize = this.dataSource.pageSize() || this.dataSource.total();
            const groups = this._groups();
            const stacked = this._isStackedMode();
            let loaderHTML = "";
            let colspan;
            let columnsCount = stacked ? 1 : visibleColumns.length + groups;

            if (this._hasDetails() && !stacked) {
                columnsCount++;
            }

            if (this._hasVirtualColumns()) {
                colspan = parseInt(this.content.find(TR).first().find("td").first().attr("colspan"), 10);
            }

            for (var i = 0; i < pageSize; i++) {
                loaderHTML += "<tr class='k-table-row' data-skeleton-row>";
                for (var j = 0; j < columnsCount; j++) {
                    if (colspan && !j) {
                        loaderHTML += "<td colspan='" + colspan + "'><span class='k-skeleton k-skeleton-text k-skeleton-pulse k-table-td'></span></td>";
                    } else {
                        loaderHTML += "<td><span class='k-skeleton k-skeleton-text k-skeleton-pulse k-table-td'></span></td>";
                    }
                }
                loaderHTML += "</tr>";
            }
            return loaderHTML;
        },

        _progress: function(toggle) {
            var element = this.element;
            var endless = this.options.scrollable && this.options.scrollable.endless;
            var loaderType = this.options.loaderType;
            var isVirtualization = this.options.scrollable && this.options.scrollable.virtual;
            var skeleton;

            if (isVirtualization) {
                element = this.content;
            } else if (this._editContainer && this._editMode() === "popup") {
                element = this._editContainer;
            } else if (this.lockedContent || endless) {
                element = this.wrapper;
            } else if (this.element.is("table")) {
                element = this.element.parent();
            } else if (this.content && this.content.length) {
                element = this.content;
            }

            if (loaderType == "skeleton" && !this._isExport) {
                const tbody = element.find("tbody");
                if (toggle) {
                    skeleton = this._buildSkeleton();
                    if (endless) {
                        this._currentEndlessRows = tbody.children(":not([data-skeleton-row])");
                    }
                    tbody.empty().append(skeleton);
                } else {
                    if (endless) {
                        element.find("[data-skeleton-row]").remove();
                        tbody.prepend(this._currentEndlessRows);
                    } else {
                        element.find(".k-skeleton").closest("tbody").empty();
                    }
                }
            } else {
                if (this._isExport) {
                    this._loaderContainer(toggle, { message: this.options.messages.loader.exporting });
                } else if (endless && toggle) {
                    kendo.ui.progress(element, toggle, { height: this.content.height(), top: this.content.parent()[0].offsetTop, opacity: true });
                } else {
                    kendo.ui.progress(element, toggle);
                }
            }
        },

        _resize: function(size, force) {

            this._syncLockedContentHeight();
            this._syncLockedHeaderHeight();

            if (this.content) {
                this._setContentWidth();
                this._setContentHeight();
            }

            if (this.lockedTable) {
                this._syncLockedScroll();
            }

            if (this.virtualScrollable && (force || this._rowHeight)) {
                if (force) {
                    this._rowHeight = null;
                }
                this.virtualScrollable.repaintScrollbar();
            }

            if (this.pager && this.pager.element) {
                this.pager.resize(force);
            }

            if (this._anyStickyColumns()) {
                this._updateStickyColumns(false);
            }
        },

        _isActiveInTable: function() {
            var active = activeElement();

            if (!active) { return false; }

            return this.table[0] === active ||
                $.contains(this.table[0], active) ||
                (this._isLocked() &&
                    (this.lockedTable[0] === active || $.contains(this.lockedTable[0], active))
                );
        },

        refresh: function(e) {
            var that = this,
                data = that.dataSource.view(),
                navigatable = that.options.navigatable,
                virtualScroll = that.virtualScroll || {},
                currentIndex,
                current = $(that.current()),
                isCurrentInHeader = false,
                groups = that._groups(),
                colspan = groups + visibleLeafColumns(visibleColumns(that.columns)).length,
                hasMultiColumnHeaders = grep(that.columns, function(item) {
                    return item.columns !== undefined$1;
                }).length > 0,
                contentScrollLeft,
                cachedItemsToSkip,
                multiColumnHeaderIndex = 0,
                hasGroups = that.dataSource.group() && that.dataSource.group().length > 0;

            const stacked = that._isStackedMode();

            if (e && e.action === "itemchange" && (that.editable || that.options.scrollable.endless)) { // skip rebinding if editing is in progress
                if (this._editMode() != "popup" || this._editMode() === "popup" && !that._editableIsClosing) { // popup editing animation has not finished yet and the editable is not destoyed
                    return;
                }
            }

            if (that._shouldMapHights) {
                that._mapCachedRowsHeight("get", "uid");
                that._shouldMapHights = false;
            }

            if (virtualScroll.columns) {
                that._templates();
            }

            //someone remove the edited item
            if (e && e.action === "remove" && that.editable &&
                that.editable.options.model && inArray(that.editable.options.model, e.items) > -1) {
                that.editable.options.model.unbind(CHANGE, that._modelChangeHandler);
            }

            e = e || {};

            if (that.trigger("dataBinding", { action: e.action || "rebind", index: e.index, items: e.items })) {
                return;
            }

            if (e.action === SYNC && that._isVirtualEditable()) {
                that._destroyEditable();
                that._clearEditableState();
            }

            if (!that._endlessFetchInProgress) {
                const component = that._isAdaptive() ? "kendoActionSheet" : "kendoWindow";

                if (navigatable && (that._isActiveInTable() || (that._editContainer && that._editContainer.data(component)))) {
                    isCurrentInHeader = current.is("th");
                    currentIndex = isCurrentInHeader ? current.parent().children(":not(.k-group-cell)").index(current[0]) : Math.max(that.cellIndex(current), 0);

                    if (isCurrentInHeader && hasMultiColumnHeaders) {
                        multiColumnHeaderIndex = current.parent().index();
                    }
                }
                that._destroyEditable();
            }

            if (that.options.scrollable && that.options.scrollable.endless && !that._pdfInitialized) {
                clearTimeout(that._progressTimeOut);
                that._progressTimeOut = setTimeout(function() {
                    if (!that._endlessFetchInProgress) {
                        that._progress(false);
                        if (stacked) {
                            that._toggleGroupableHeader(hasGroups);
                        }
                    }
                }, 250);
            } else {
                if (!that._isExport) {
                    that._progress(false);
                    if (stacked) {
                        that._toggleGroupableHeader(hasGroups);
                    }
                }
            }

            if (current.length) {
                that._currentRowIndex = current.parent().index();
            }

            that._hideResizeHandle();

            that._data = [];

            if (!that.columns.length) {
                that._autoColumns(that._firstDataItem(data[0], groups));
                colspan = groups + that.columns.length;
            }

            that._group = groups > 0 || that._group;

            if (that._group) {
                that._templates();
                that._updateCols();
                that._updateLockedCols();
                if (!that._virtualColScroll && !stacked) {
                    that._updateHeader(groups);
                }
                that._group = groups > 0;
                that._groupRows = groupRows(data);
            }

            if (that.content) {
                contentScrollLeft = kendo.scrollLeft(that.content);
            }

            const hasGroupAggregateTemplate = that.dataSource.group()?.some(g => g.aggregates) && that.columns?.some(c => c.groupFooterTemplate || c.groupHeaderTemplate);

            if (that.options.loaderType !== "skeleton" && e && e.action === "sync" && e.partialUpdate && e.changedItems && e.changedItems.length && !hasGroupAggregateTemplate) {
                that._data = that.dataSource.flatView();
                e.changedItems.forEach((changedItem) => {
                    const row = that.tbody.find("[" + kendo.attr("uid") + "=" + changedItem.uid + "]");
                    if (that._editMode() === INCELL && that.dataSource.options.autoSync && that.dataSource.isLocalTransport()) {
                        that.trigger(CELLCLOSE, { type: "save", model: e.changedItems[0], container: row.find(".k-edit-cell") });
                    }
                    that._displayRow(row);
                });
                that._progress(false);

                if (stacked) {
                    that._toggleGroupableHeader(hasGroups);
                }

                that._destroyEditable();
            } else {
                cachedItemsToSkip = that._skipRerenderItemsCount;
                that._renderContent(data, colspan, groups);
                if (that.options.scrollable && that.options.scrollable.endless && this.lockedContent) {
                    that._skipRerenderItemsCount = cachedItemsToSkip;
                }
                that._renderLockedContent(data, colspan, groups);
            }

            if (!that._virtualColScroll) {
                that._footer();

                that._renderNoRecordsContent();

                that._togglePagerVisibility();

                that._setContentHeight();

                that._setContentWidth(that.content && contentScrollLeft);
            }

            if (that.lockedTable) {
                //requires manual trigger of scroll to sync both tables
                if (virtualScroll.rows) {
                    that.content.find(">.k-virtual-scrollable-wrap").trigger("scroll");
                } else if (that.touchScroller) {
                    that.touchScroller.movable.trigger("change");
                } else {
                    that.wrapper.one("scroll", function(e) { e.stopPropagation(); });
                    that.content.trigger("scroll");
                }
            }

            if (!that._endlessFetchInProgress && !that._rowDropping) {
                if (stacked && that.options.navigatable) {
                    that._setCurrentStackedCell();
                } else {
                    const currentIsLockedHeader = that._isLocked() && current.closest(".k-grid-header-locked").length && isCurrentInHeader;
                    that._restoreCurrent(currentIndex, isCurrentInHeader, multiColumnHeaderIndex, currentIsLockedHeader);
                }
            }

            if (that.touchScroller) {
                that.touchScroller.contentResized();
            }

            if (that.selectable) {
                that.selectable.resetTouchEvents();
            }

            if (that._checkBoxSelection) {
                that._toggleHeaderCheckState(false);
            }

            if (that.options.persistSelection &&
                ((that.selectable && !kendo.ui.Selectable.parseOptions(that.options.selectable).cell) || that._checkBoxSelection) &&
                (that.items().length || that.dataSource._isGroupPaged())) {
                that._restoreSelection();
            }

            that._restoreHighlight();

            if (that._hasAIHighlight) {
                that._applyAIHighlight(that._hasAIHighlight);
            }

            if (!that.options.persistSelection) {
                that._selectedIds = {};
            }

            if (that._hasReorderableRows()) {
                that._draggableRows();
                that._reorderableRows();
            }

            if (that.options.selectable && that.options.selectable.cellAggregates) {
                that._calculateAggregatesForSelected();
            }
            if (stacked) {
                const layoutSettings = that._getStackedLayoutSettings();
                const stackedRows = that.tbody.find(".k-grid-stack-row");

                if (layoutSettings.colClass) {
                    stackedRows.addClass(layoutSettings.colClass);
                } else if (layoutSettings.colsConfig) {
                    stackedRows.css("grid-template-columns", layoutSettings.colsConfig);
                }
            }


            that._aria();

            that.trigger(DATABOUND);
        },

        _getSchemaIdField: function() {
            const that = this;
            const model = that.dataSource.options.schema.model;
            return isFunction(model) ? model.fn.idField : model && model.id;
        },

        _restoreCurrent: function(currentIndex, isCurrentInHeader, multiColumnHeaderIndex, isLocked) {
            if (currentIndex === undefined$1 || currentIndex < 0) {
                return;
            }

            this._removeCurrent();

            if (isCurrentInHeader) {
                const container = isLocked ? this.lockedHeader : this.thead;
                this._setCurrent(container.find(`tr:eq(${multiColumnHeaderIndex}) th:not(.k-group-cell)`).eq(currentIndex), false, this._hasVirtualColumns());
            } else {
                var rowIndex = 0;
                var virtualScroll = this.virtualScroll || {};

                if (this._rowVirtualIndex) {
                    if (virtualScroll.rows) {
                        rowIndex = this.virtualScrollable.position(this._rowVirtualIndex);
                    } else {
                        rowIndex = this._rowVirtualIndex;
                    }
                } else if (this._currentRowIndex) {
                    rowIndex = this._currentRowIndex;
                } else {
                    currentIndex = 0;
                }

                var row = $();
                var colspan;

                if (this.lockedTable) {
                    if (this._shouldFocusInLastRow) {
                        row = this.lockedTable.find(">tbody>tr").last();
                    } else if (this._shouldFocusInFirstRow) {
                        row = this.lockedTable.find(">tbody>tr").first();
                    } else {
                        row = this.lockedTable.find(">tbody>tr").eq(rowIndex);
                    }
                }

                let nonLockedRow;
                if (this._shouldFocusInLastRow) {
                    nonLockedRow = this.tbody.children().last();
                } else if (this._shouldFocusInFirstRow) {
                    nonLockedRow = this.tbody.children().first();
                } else {
                    nonLockedRow = this.tbody.children().eq(rowIndex);
                }

                row = row.add(nonLockedRow);

                if (this._hasVirtualColumns()) {
                    colspan = parseInt(row.find("td").first().attr("colspan"), 10);
                    currentIndex = this._virtualCellIndex - (colspan > 1 ? colspan - 1 : 0);
                }


                var td = row.find(">td:not(.k-group-cell):not(.k-hierarchy-cell)")
                    .eq(currentIndex);

                if (!td.length || currentIndex < 0) {
                    return;
                }

                if (this._hasVirtualColumns()) {
                    this._setCurrent(td, true, true);
                } else {
                    this._setCurrent(td);
                }

            }

            if (this._current) {
                focusTable(this.table, true);
            }
        },

        _restoreSelection: function() {
            var that = this,
                allRows = that.items(),
                selectedRows,
                id = that._getSchemaIdField();

            selectedRows = grep(allRows, function(row) {
                var dataItemKey = that.dataItem(row)[id];
                if (that._selectedIds[dataItemKey]) {
                    return row;
                }
            });

            that.select(selectedRows);
        },

        _getSelectedRowUids: function() {
            var that = this,
                selected = that.select(),
                row,
                uid,
                result = [];

            for (let i = 0; i < selected.length; i++) {
                row = $(selected[i]);

                if (kendo.ui.Selectable.parseOptions(that.options.selectable).cell) {
                    row = row.closest(TR);
                }

                uid = row.data("uid");

                if (result.indexOf(uid) === -1) {
                    result.push(uid);
                }
            }

            return result;
        },

        _getSelectedColumnFields: function() {
            var that = this,
                selected = that.select(),
                field,
                index,
                visibleColumns = visibleLeafColumns(that.columns).filter(col => !col.selectable && !col.draggable & !col.command),
                result = [];

            // If the mode is in row selection, then return all of the visible columns.
            if (!kendo.ui.Selectable.parseOptions(that.options.selectable).cell) {
                return visibleColumns.map(vc => vc.field);
            }

            for (let i = 0; i < selected.length; i++) {
                index = $(selected[i]).index();

                field = that.thead.find("th:eq(" + index + ")").data("field");

                if (result.indexOf(field) === -1) {
                    result.push(field);
                }
            }

            return result;
        },

        _cleanupDetailItems: function() {
            var that = this;

            if (that._hasDetails()) {
                that.tbody.find(".k-detail-cell").empty();
            }
        },

        _renderContent: function(data, colspan, groups) {
            var that = this,
                idx,
                length,
                html = "",
                isLocked = that.lockedContent != null,
                endlessAppend = null,
                skipLastGroup,
                flatViewLength,
                scrollable = that.options.scrollable,
                templates = {
                    rowTemplate: that.rowTemplate,
                    altRowTemplate: that.altRowTemplate,
                    groupFooterTemplate: that.groupFooterTemplate,
                    groupHeaderColumnTemplate: that.groupHeaderColumnTemplate
                };

            const stacked = that._isStackedMode();

            if (scrollable && scrollable.endless && !that.dataSource.options.endless) {
                that._skipRerenderItemsCount = 0;
                if (that.content) {
                    that.content[0].scrollTop = 0;
                }
            }
            endlessAppend = that._skipRerenderItemsCount > 0;
            colspan = isLocked ? colspan - visibleLeafColumns(visibleLockedColumns(that.columns)).length : colspan;

            if (stacked) {
                colspan = that.table.find("col").length;
            }

            if (groups > 0) {

                colspan = isLocked ? colspan - groups : colspan;

                if (that.detailTemplate && !stacked) {
                    colspan++;
                }

                if (that.groupFooterTemplate) {
                    that._groupAggregatesDefaultObject = that.dataSource.aggregates();
                }
                if (that.options.scrollable.endless) {
                    flatViewLength = that.dataSource.flatView().length;
                }
                for (idx = 0, length = data.length; idx < length; idx++) {
                    if (!that._skippedGroups) {
                        that._skippedGroups = [];
                    }
                    skipLastGroup = flatViewLength && idx === data.length - 1 && flatViewLength !== that.dataSource.total();
                    html += that._groupRowHtml(data[idx], colspan, 0, isLocked ? groupRowLockedContentBuilder : groupRowBuilder, templates, isLocked, skipLastGroup, false);
                }
            } else {
                html += that._rowsHtml(data, templates);
            }

            if (endlessAppend) {
                that.tbody.append(html);
                kendo.applyStylesFromKendoAttributes(that.tbody, ["display", "left", "right"]);
                clearTimeout(that._endlessFetchTimeOut);
                that._endlessFetchTimeOut = setTimeout(function() {
                    if (that._groupToCollapse) {
                        that.collapseGroup(that._groupToCollapse);
                        that._groupToCollapse = null;
                    }
                });
                that._endlessFetchInProgress = null;
            } else {
                that.tbody = appendContent(that.tbody, that.table, html, this.options.size);
            }
        },

        _renderGroupRows: function() {
            var that = this,
                data = that._groupRows,
                groupRows = that.wrapper.find(DOT + GROUPING_ROW),
                groups = that._groups(),
                groupRowBuilderFunc,
                isLocked = that.lockedContent != null,
                columns,
                colspan,
                group,
                field,
                column,
                template,
                text,
                groupHeaderData,
                tableContainer,
                isInLockedContainer,
                prevElement,
                newGroupRowElement,
                currentRow,
                level,
                groupHeaderColumnTemplate,
                firstColumnGroupData;

            groupRows.each(function(index, row) {
                currentRow = $(row);
                tableContainer = currentRow.closest("table").parent();
                isInLockedContainer = tableContainer.is("." + CONTENTRLOCKEDCONTAINER);
                columns = isInLockedContainer ? visibleLeafColumns(visibleColumns(lockedColumns(that.columns))) : visibleLeafColumns(visibleColumns(nonLockedColumns(that.columns)));
                level = currentRow.find("." + GROUPCELLCLASS).length;
                if (isLocked) {
                    groupRowBuilderFunc = isInLockedContainer ? groupRowBuilder : groupRowLockedContentBuilder;
                    colspan = isInLockedContainer ? columns.length + groups - level : columns.length;
                }
                else {
                    groupRowBuilderFunc = groupRowBuilder;
                    colspan = columns.length + groups - level;
                }

                group = index >= data.length ? data[index - data.length] : data[index];
                field = group.field;
                column = grep(leafColumns(that.columns), function(column) { return column.field == field; })[0] || {};
                firstColumnGroupData = !column.groupHeaderTemplate && visibleColumns(that.columns)[0].groupHeaderColumnTemplate ? visibleColumns(that.columns)[0] : false;
                template = column.groupHeaderTemplate ? column.groupHeaderTemplate : visibleColumns(that.columns)[0].groupHeaderColumnTemplate;
                text = (column.title && (that.options.encodeTitles ? htmlEncode(column.title, true) : column.title) || htmlEncode(field, true)) + ': ' + formatGroupValue(group.value, column.format, column.values, column.encoded);
                groups = groups;
                groupHeaderData = that._groupData(group, false, firstColumnGroupData);
                groupHeaderColumnTemplate = isInLockedContainer ? that.lockedGroupHeaderColumnTemplate : that.groupHeaderColumnTemplate;

                if (template) {
                    text = typeof template === FUNCTION ? template(groupHeaderData) : kendo.template(template)(groupHeaderData);
                }

                prevElement = currentRow.prev().length ? currentRow.prev() : currentRow.parent();

                newGroupRowElement = $(groupHeaderColumnTemplate ?
                    groupHeaderColumnTemplate(extend({}, groupHeaderData, { groupCells: level, colspan: groups - level, text: text })) :
                    groupRowBuilderFunc(colspan, level, text, null, null, null, isRtl, that._isStackedMode())
                );

                kendo.applyStylesFromKendoAttributes(newGroupRowElement, ["display", "left", "right"]);

                if (prevElement.is("tbody")) {
                    prevElement.prepend(newGroupRowElement);
                }
                else {
                    prevElement.after(newGroupRowElement);
                }
                currentRow.remove();
            });
        },

        _renderLockedContent: function(data, colspan, groups) {
            var html = "",
                idx,
                length,
                skipLastGroup,
                endlessAppend = null,
                flatViewLength,
                templates = {
                    rowTemplate: this.lockedRowTemplate,
                    altRowTemplate: this.lockedAltRowTemplate,
                    groupFooterTemplate: this.lockedGroupFooterTemplate,
                    groupHeaderColumnTemplate: this.lockedGroupHeaderColumnTemplate
                };

            if (this.lockedContent) {

                var table = this.lockedTable;
                endlessAppend = this._skipRerenderItemsCount > 0;

                if (groups > 0) {
                    colspan = colspan - visibleColumns(leafColumns(nonLockedColumns(this.columns))).length;
                    if (this.options.scrollable.endless) {
                        flatViewLength = this.dataSource.flatView().length;
                    }
                    for (idx = 0, length = data.length; idx < length; idx++) {
                        skipLastGroup = flatViewLength && idx === data.length - 1 && flatViewLength !== this.dataSource.total();
                        html += this._groupRowHtml(data[idx], colspan, 0, groupRowBuilder, templates, false, skipLastGroup, true);
                    }
                } else {
                    html = this._rowsHtml(data, templates);
                }

                if (endlessAppend) {
                    table.children("tbody").append(html);
                } else {
                    appendContent(table.children("tbody"), table, html, this.options.size);
                }

                this._syncLockedContentHeight();
            }
        },

        _togglePagerVisibility: function() {
            if (this.options.pageable.alwaysVisible === false) {
                this.wrapper.find(".k-grid-pager").toggle(this.dataSource.total() >= this.dataSource.pageSize());
            }
        },

        _adjustRowsHeight: function(table1, table2) {
            var rows = table1[0].rows,
                length = rows.length,
                idx,
                rows2 = table2[0].rows,
                containers = table1.add(table2),
                containersLength = containers.length,
                heights = [];

            for (idx = 0; idx < length; idx++) {
                if (!rows2[idx]) {
                    break;
                }

                if (rows[idx].style.height) {
                    rows[idx].style.height = rows2[idx].style.height = "";
                }
            }

            for (idx = 0; idx < length; idx++) {
                if (!rows2[idx]) {
                    break;
                }

                var offsetHeight1 = rows[idx].getBoundingClientRect().height;
                var offsetHeight2 = rows2[idx].getBoundingClientRect().height;
                var height = 0;

                if (offsetHeight1 > offsetHeight2) {
                    height = offsetHeight1;
                } else if (offsetHeight1 < offsetHeight2) {
                    height = offsetHeight2;
                }

                heights.push(height);
            }

            for (idx = 0; idx < containersLength; idx++) {
                containers[idx].style.display = NONE;
            }

            for (idx = 0; idx < length; idx++) {
                if (heights[idx]) {
                    rows[idx].style.height = rows2[idx].style.height = heights[idx] + PX;
                }
            }

            for (idx = 0; idx < containersLength; idx++) {
                containers[idx].style.display = "";
            }
        }
    });

    if (kendo.ExcelMixin) {
        kendo.ExcelMixin.extend(Grid.prototype);
    }

    if (kendo.PDFMixin) {
        kendo.PDFMixin.extend(Grid.prototype);

        Grid.prototype._drawPDF_autoPageBreak = function(progress) {
            var grid = this;
            var result = new $.Deferred();
            var dataSource = grid.dataSource;
            var allPages = grid.options.pdf.allPages;
            var origBody = grid.wrapper.find('> table > tbody, .k-grid-content > table > tbody').first();
            var cont = $("<div>")
                .css({ position: "absolute", left: -1e4, top: -1e4 });
            var clone;

            grid.toggleUnexportableColumns(grid.columns);
            clone = grid.wrapper.clone().css({
                height: AUTO, width: AUTO
            }).appendTo(cont);
            clone.find(".k-grid-content").css({ height: AUTO, width: AUTO, overflow: "visible" });
            clone.find('> table, .k-grid-header table, .k-grid-content > table, .k-grid-footer table').css({ height: AUTO, width: "100%", overflow: "visible" });
            clone.find(".k-grid-pager, .k-grid-toolbar, .k-grouping-header").remove();
            clone.find(".k-grid-header, .k-grid-footer, .k-auto-scrollable").css({ paddingRight: 0 });

            var body = clone.find('> table > tbody, .k-grid-content > table > tbody').first().empty();
            var startingPage = dataSource.page();

            function resolve() {
                if (allPages && startingPage !== undefined$1) {
                    dataSource.one("change", draw);
                    dataSource.page(startingPage);
                } else {
                    grid.refresh();
                    draw();
                }
            }

            function draw() {
                cont.appendTo(document.body);
                var options = $.extend({}, grid.options.pdf, {
                    _destructive: true,
                    progress: function(p) {
                        progress.notify({
                            page: p.page,
                            pageNumber: p.pageNum,
                            progress: 0.5 + p.pageNum / p.totalPages / 2,
                            totalPages: p.totalPages
                        });
                    }
                });
                kendo.drawing.drawDOM(clone, options)
                    .always(function() {
                        cont.remove();
                    })
                    .then(function(group) {
                        result.resolve(group);
                        grid.toggleUnexportableColumns(grid.columns, true);
                    })
                    .fail(function(err) {
                        result.reject(err);
                    });
            }

            function renderPage() {
                var pageNum = dataSource.page();
                var totalPages = allPages ? dataSource.totalPages() : 1;
                body.append(origBody.children("tr:not(.k-detail-row)"));
                if (pageNum < totalPages) {
                    dataSource.page(pageNum + 1);
                } else {
                    dataSource.unbind("change", renderPage);
                    resolve();
                }
            }

            if (allPages) {
                dataSource.bind("change", renderPage);
                dataSource.page(1);
            } else {
                renderPage();
            }

            return result.promise();
        };

        Grid.prototype.toggleUnexportableColumns = function(columns, restore) {
            var length = columns.length;
            var column;
            var exportable;
            var visibleInExport;
            var visibleInExportOnly;

            for (var i = 0; i < length; i++) {
                column = columns[i];
                exportable = column.exportable;
                if (!restore) {
                    if (typeof column.exportable === "object") {
                        exportable = column.exportable.pdf;
                    }

                    visibleInExport = !column.hidden && exportable !== false;
                    visibleInExportOnly = column.hidden && exportable === true;
                    exportable = visibleInExport || visibleInExportOnly;

                    if (!exportable && !column.hidden) {
                        column._toggledDuringExport = true;
                        this.hideColumn(column);
                    } else if (exportable && column.hidden) {
                        column._toggledDuringExport = true;
                        this.showColumn(column);
                    } else if (exportable && column.columns) {
                        this.toggleUnexportableColumns(column.columns);
                    }
                } else {
                    if (column._toggledDuringExport) {
                        column._toggledDuringExport = false;

                        if (column.hidden) {
                            this.showColumn(column);
                        } else {
                            this.hideColumn(column);
                        }
                    } else if (column.columns) {
                        this.toggleUnexportableColumns(column.columns, restore);
                    }
                }
            }
        };

        Grid.prototype._drawPDF = function(progress) {
            var grid = this;

            if (grid.options.pdf.paperSize && grid.options.pdf.paperSize != AUTO) {
                return grid._drawPDF_autoPageBreak(progress);
            }

            var result = new $.Deferred();
            var dataSource = grid.dataSource;
            var allPages = grid.options.pdf.allPages;

            // This group will be our document containing all pages
            var doc = new kendo.drawing.Group();
            var startingPage = dataSource.page();

            function resolve() {
                if (allPages && startingPage !== undefined$1) {
                    dataSource.unbind("change", exportPage);
                    dataSource.one("change", function() {
                        result.resolve(doc);
                    });

                    dataSource.page(startingPage);
                } else {
                    result.resolve(doc);
                }
            }

            function exportPage() {
                grid.toggleUnexportableColumns(grid.columns);
                grid._drawPDFShadow({
                    width: grid.wrapper.width()
                }, {
                    avoidLinks: grid.options.pdf.avoidLinks
                })
                    .done(function(group) {
                        var pageNum = dataSource.page();
                        var totalPages = allPages ? dataSource.totalPages() : 1;

                        var args = {
                            page: group,
                            pageNumber: pageNum,
                            progress: pageNum / totalPages,
                            totalPages: totalPages
                        };

                        grid.toggleUnexportableColumns(grid.columns, true);
                        progress.notify(args);
                        doc.append(args.page);

                        if (pageNum < totalPages) {
                            dataSource.page(pageNum + 1);
                        } else {
                            resolve();
                        }
                    })
                    .fail(function(err) {
                        result.reject(err);
                    });
            }

            if (allPages) {
                dataSource.bind("change", exportPage);
                dataSource.page(1);
            } else {
                exportPage();
            }

            return result.promise();
        };
    }

    function syncTableHeight(table1, table2) {
        table1 = table1[0];
        table2 = table2[0];

        if (table1.rows.length !== table2.rows.length) {
            var lockedHeigth = table1.offsetHeight;
            var tableHeigth = table2.offsetHeight;

            var row;
            var diff;
            if (lockedHeigth > tableHeigth) {
                row = table2.rows[table2.rows.length - 1];

                if (filterRowRegExp.test(row.className)) {
                    row = table2.rows[table2.rows.length - 2];
                }

                diff = lockedHeigth - tableHeigth;
            } else {
                row = table1.rows[table1.rows.length - 1];

                if (filterRowRegExp.test(row.className)) {
                    row = table1.rows[table1.rows.length - 2];
                }

                diff = tableHeigth - lockedHeigth;
            }
            row.style.height = row.offsetHeight + diff + PX;
        }
    }

    function adjustRowHeight(row1, row2) {
        var height;
        var offsetHeight1 = row1.offsetHeight;
        var offsetHeight2 = row2.offsetHeight;

        if (offsetHeight1 > offsetHeight2) {
            height = offsetHeight1 + PX;
        } else if (offsetHeight1 < offsetHeight2) {
            height = offsetHeight2 + PX;
        }

        if (height) {
            row1.style.height = row2.style.height = height;
        }
    }

    function getCommand(commands, name) {
        var idx, length, command;

        if (typeof commands === STRING && commands === name) {
            return commands;
        }

        if (isPlainObject(commands) && commands.name === name) {
            return commands;
        }

        if (isArray(commands)) {
            for (idx = 0, length = commands.length; idx < length; idx++) {
                command = commands[idx];

                if ((typeof command === STRING && command === name) || (command.name === name)) {
                    return command;
                }
            }
        }
        return null;
    }

    function compareElements(element, toCompare) {
        if (element.length !== toCompare.length) {
            return false;
        }

        for (var i = 0; i < element.length; i++) {
            if (element[i] !== toCompare[i]) {
                return false;
            }
        }

        return true;
    }

    function focusTable(table, direct) {
        if (!table || table.length === 0) {
            return;
        }

        if (direct === true) {
            table = $(table);
            var scrollLeft = kendo.scrollLeft(table.parent());

            kendo.focusElement(table);
            kendo.scrollLeft(table.parent(), scrollLeft);
        } else {
            $(table).one("focusin", function(e) { e.preventDefault(); }).trigger("focus");
        }
    }

    function isColumnGroupable(grid, column) {
        return grid.options.groupable && (column.groupable || column.groupable === undefined$1);
    }

    function isGroupedBy(groups, field) {
        return !!$.grep(groups, function(item) {
            return item.field === field;
        }).length;
    }

    function isColumnEditable(column, model) {
        if (!column.field || column.selectable) {
            return false;
        }
        if (model.editable && !model.editable(column.field)) {
            return false;
        }
        if (column.editable && !column.editable(model)) {
            return false;
        }
        return true;
    }

    function isInputElement(element) {
        return $(element).is(INPUT_SELECTORS);
    }

    function tableClick(e) {
        var that = this,
            currentTarget = $(e.currentTarget),
            isHeader = currentTarget.is("th"),
            table = this.table.add(this.lockedTable),
            headerTable = this.thead && this.thead.parent().add($(">table", this.lockedHeader)),
            isInput = isInputElement(e.target),
            preventScroll = $(e.target).is('.k-checkbox'),
            target = $(e.target),
            currentTable = currentTarget.closest("table")[0],
            stacked = that._isStackedMode();

        if (!stacked && isInput && currentTarget.find(kendo.roleSelector("filtercell")).length) {
            this._setCurrent(currentTarget, null, null, true);
            return;
        }

        if (currentTable !== table[0] && currentTable !== table[1] && currentTable !== headerTable[0] && currentTable !== headerTable[1]) {
            return;
        }

        if (target.is(CARET_ALT_RIGHT + "," + CARET_ALT_DOWN + "," + "[ref='expand-detail-button'], [ref='collapse-detail-button']")) {
            return;
        }

        if (this.options.navigatable) {
            this._setCurrent(currentTarget, false, preventScroll);
        }

        if (isHeader || !isInput) {
            setTimeout(function() {
                var activeEl = $(kendo._activeElement());
                if ((activeEl.hasClass("k-widget") || activeEl.hasClass("k-dropdownlist") || activeEl.is(".k-upload .k-upload-button")) && !activeEl.hasClass("k-grid-pager") || activeEl.hasClass("k-select-checkbox")) {
                    return;
                }

                //Only if input element is not selected yet and it is not descendant of the grid's table
                if (that.table && (activeEl.is(CHECKBOXINPUT) || !isInputElement(kendo._activeElement()) || !$.contains(currentTable, kendo._activeElement()))) {
                    //DOMElement.focus() only for header, because IE doesn't really focus the table
                    focusTable(that.table[0], true);
                }
            });
        }

        if (isHeader && !kendo.support.touch) {
            e.preventDefault(); //if any problem occurs, call preventDefault only for the clicked header links
        }
    }

    function leftMostPosition(element, rtl) {
        if (!rtl) {
            return 0;
        }

        var result = 0;

        if (kendo.support.browser.webkit) {
            result = element.width();
        }

        return result;
    }

    function parseVirtualSettings(options) {
        var asLowerString;

        if (typeof options === "string") {
            asLowerString = options.toLowerCase();
            if (asLowerString === "true") {
                return {
                    rows: true
                };
            } else {
                return {
                    rows: asLowerString.indexOf("rows") > -1,
                    columns: asLowerString.indexOf("columns") > -1
                };
            }

        } else if (options === true) {
            return {
                rows: true
            };
        }
    }

    function isElementVisibleInWrapper(wrapper, element) {
        var offsetTop;
        var halfHeight;

        if (!wrapper) {
            return false;
        }

        element = $(element);

        if (element[0] && contains(wrapper[0], element[0])) {
            offsetTop = element.offset().top - wrapper.offset().top;
            halfHeight = element.outerHeight() / 2;

            if ((offsetTop >= 0 || math.abs(offsetTop) <= halfHeight) && (math.floor(offsetTop + halfHeight) <= wrapper.height())) {
                return true;
            }
        }

        return false;
    }

    function isInEdit(cell) {
        return cell &&
            (cell.hasClass("k-edit-cell") ||
                cell.parent().hasClass("k-grid-edit-row") || cell.hasClass("k-grid-stack-edit-cell"));
    }

    function groupHtmlBuilder({ groupHeaderColumnTemplate, groupHeaderBuilder, colspan, templateColspan, groupData, level, text, expanded, group, isGroupPaged, stacked }) {
        var html;

        if (groupHeaderColumnTemplate) {
            html = groupHeaderColumnTemplate(extend({}, groupData, {
                groupCells: level,
                colspan: templateColspan,
                text: text,
                expanded: expanded,
                isRtl: isRtl,
                uid: group.uid
            }));
        } else {
            html = groupHeaderBuilder(colspan, level, text, expanded, group.uid, isGroupPaged, isRtl, stacked);
        }

        return html;
    }

    function groupCellBuilder(headerTemplateIndex, stacked, aggregates) {
        return ({ colspan, text, expanded, isRtl }) => {
            let length = (colspan + headerTemplateIndex) > 0 ? colspan + headerTemplateIndex : 0;
            let collapsedClass = `caret-alt-${isRtl ? 'left' : 'right'}`;
            return `<td class="k-table-td" colspan="${colspan + headerTemplateIndex}">` +
                '<p class="k-reset">' +
                kendo.ui.icon($(`<a href="\\#" tabindex="-1" ${ARIA_LABEL}="${(expanded ? COLLAPSE : EXPAND)}"></a>`), { icon: (expanded ? 'caret-alt-down' : collapsedClass) }) + text +
                `</p>${aggregates || ""}</td>${!stacked ? new Array(length).join("<td hidden group-header-spanned-hidden></td>") : ""}`;
        };
    }

    function groupCellLockedContentBuilder(headerTemplateIndex) {
        return '<td class="k-table-td" colspan="' + headerTemplateIndex + '">' +
            `<p class="k-reset">&nbsp;</p></td>${new Array(headerTemplateIndex).join("<td hidden group-header-spanned-hidden></td>")}`;
    }

    function groupRowBuilder(colspan, level, text, expanded, uid, includeAdditionalData, isRtl, stacked, aggregates) {
        return '<tr ' + (includeAdditionalData ? 'data-group-uid="' + uid + '"' : '') + 'class="k-table-group-row k-grouping-row k-table-row">' + groupCells(level) +
            '<td class="k-table-td" colspan="' + colspan + '" aria-expanded="' + !!expanded + '">' +
            '<p class="k-reset">' +
            kendo.ui.icon($('<a href="#" tabindex="-1" ' + ARIA_LABEL + '="' + (expanded ? COLLAPSE : EXPAND) + '"></a>'), { icon: (expanded ? 'caret-alt-down' : `caret-alt-${isRtl ? 'left' : 'right'}`) }) + text +
            `</p>${aggregates || ""}</td>${!stacked ? new Array(colspan).join("<td hidden group-header-spanned-hidden></td>") : ""}</tr>`;
    }

    function groupRowLockedContentBuilder(colspan) {
        return '<tr class="k-table-group-row k-grouping-row k-table-row">' +
            '<td class="k-table-td" colspan="' + colspan + '" aria-expanded="true">' +
            `<p class="k-reset">&nbsp;</p></td>${new Array(colspan).join("<td hidden group-header-spanned-hidden></td>")}</tr>`;
    }

    function toggleRow(row, visible) {
        row = $(row)[0];
        if (visible) {
            row.style.display = "";
        } else {
            row.style.display = NONE;
        }
    }

    function htmlEncode(value, backslashEscapeQuotes) {
        var ampRegExp = /&/g,
            ltRegExp = /</g,
            quoteRegExp = /"/g,
            aposRegExp = /'/g,
            gtRegExp = />/g;

        return ("" + value)
            .replace(ampRegExp, "&amp;")
            .replace(ltRegExp, "&lt;")
            .replace(gtRegExp, "&gt;")
            .replace(quoteRegExp, function(match) {
                if (backslashEscapeQuotes) {
                    return "\\" + match;
                }
                return "&quot;";
            })
            .replace(aposRegExp, "&#39;");
    }

    function isEmptyString(value) {
        return !/\S/.test(value);
    }

    function getTitle(field, columns) {
        return columns.filter(function(col) {
            return col.field === field;
        })[0].title || field;
    }

    function exportDataSort(a, b) {
        return this.dataSource.indexOf(this.dataSource.getByUid(a.uid)) - this.dataSource.indexOf(this.dataSource.getByUid(b.uid));
    }

    function isExcelExportableColumn(column) {
        return !(column.exportable === false || (column.exportable && column.exportable.excel === false));
    }

    ui.plugin(Grid);
    ui.plugin(VirtualScrollable);

    extend(kendo.ui.grid, {
        defaultBodyContextMenu: defaultBodyContextMenu,
        defaultHeadContextMenu: defaultHeadContextMenu,
        defaultGroupsContextMenu: defaultGroupsContextMenu
    });

})(window.kendo.jQuery);
var kendo$1 = kendo;

export { __meta__, kendo$1 as default };
