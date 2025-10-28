import './kendo.combobox.js';
import './kendo.dropdownlist.js';
import './kendo.resizable.js';
import './kendo.window.js';
import './kendo.colorpicker.js';
import './kendo.imagebrowser.js';
import './kendo.numerictextbox.js';
import './kendo.textarea.js';
import './kendo.core.js';
import './kendo.aiprompt.js';
import './kendo.buttongroup.js';
import './kendo.toolbar.js';
import './kendo.icons.js';
import './kendo.splitter.js';
import './kendo.html.input.js';
import './kendo.html.icon.js';
import './kendo.inlineaiprompt.js';
import './kendo.form.js';
import './kendo.filebrowser.js';
import './kendo.draganddrop.js';
import './kendo.html.button.js';
import './kendo.tabstrip.js';
import './kendo.list.js';
import './kendo.data.js';
import './kendo.data.odata.js';
import './kendo.licensing.js';
import '@progress/kendo-licensing';
import './kendo.data.xml.js';
import './kendo.popup.js';
import './kendo.label.js';
import './kendo.floatinglabel.js';
import './kendo.actionsheet.js';
import './kendo.actionsheet.view.js';
import './kendo.button.js';
import './kendo.badge.js';
import './kendo.html.base.js';
import '@progress/kendo-svg-icons';
import './dropdowns-loader-00xUvouJ.js';
import './kendo.mobile.scroller.js';
import './kendo.fx.js';
import './kendo.userevents.js';
import './kendo.virtuallist.js';
import './valueMapper-CXgI6HWc.js';
import './prefix-suffix-containers-Cid0cOEy.js';
import './kendo.color.js';
import '@progress/kendo-drawing';
import './kendo.slider.js';
import './kendo.binder.js';
import './kendo.textbox.js';
import './kendo.listview.js';
import './kendo.editable.js';
import './kendo.checkbox.js';
import './kendo.toggleinputbase.js';
import './kendo.datepicker.js';
import './kendo.calendar.js';
import './kendo.selectable.js';
import './kendo.dateinput.js';
import '@progress/kendo-dateinputs-common';
import './kendo.multiselect.js';
import './kendo.html.chip.js';
import './kendo.html.chiplist.js';
import './kendo.validator.js';
import './kendo.otpinput.js';
import './kendo.upload.js';
import './kendo.progressbar.js';
import './kendo.pager.js';
import './kendo.breadcrumb.js';
import './kendo.skeletoncontainer.js';
import './kendo.speechtotextbutton.js';
import '@progress/kendo-webspeech-common';
import './kendo.panelbar.js';
import './kendo.floatingactionbutton.js';
import './kendo.splitbutton.js';
import './kendo.button.menu.js';
import './kendo.dropdownbutton.js';
import './kendo.togglebutton.js';
import './kendo.menu.js';
import './kendo.sortable.js';

(function(kendo) {
    var UndoRedoStack = kendo.Observable.extend({
        init: function(options) {
            kendo.Observable.fn.init.call(this, options);
            this.clear();
        },
        events: [ "undo", "redo" ],
        push: function (command) {
            this.stack = this.stack.slice(0, this.currentCommandIndex + 1);
            this.currentCommandIndex = this.stack.push(command) - 1;
        },
        undo: function () {
            if (this.canUndo()) {
                var command = this.stack[this.currentCommandIndex--];
                command.undo();
                this.trigger("undo", { command: command });
            }
        },
        redo: function () {
            if (this.canRedo()) {
                var command = this.stack[++this.currentCommandIndex];
                command.redo();
                this.trigger("redo", { command: command });
            }
        },
        clear: function() {
            this.stack = [];
            this.currentCommandIndex = -1;
        },
        canUndo: function () {
            return this.currentCommandIndex >= 0;
        },
        canRedo: function () {
            return this.currentCommandIndex != this.stack.length - 1;
        }
    });

    kendo.deepExtend(kendo, {
        util: {
            UndoRedoStack: UndoRedoStack
        }
    });
})(kendo);

(function($, undefined$1) {

    // Imports ================================================================
    var kendo = window.kendo,
        Class = kendo.Class,
        Widget = kendo.ui.Widget,
        os = kendo.support.mobileOS,
        browser = kendo.support.browser,
        extend = $.extend,
        deepExtend = kendo.deepExtend,
        keys = kendo.keys,
        outerWidth = kendo._outerWidth,
        outerHeight = kendo._outerHeight,
        NS = ".kendoEditor";

    const FORMATTING_MARKS_STYLE_ID = "formatting-marks-style",
        FORMATTING_MARKS_OVERLAY_ID = "formatting-marks-overlay",
        FORMATTING_MARKS_OVERLAY_WRAPPER_ID = "formatting-marks-overlay-wrapper";

    var SELECT = "select";
    var SELECT_OVERLAY_SELECTOR = "select.k-select-overlay";
    var PLACEHOLDER_CLASS = "k-placeholder";
    var PLACEHOLDER_TAG_ID = "placeholder";
    var REFRESH_INTERVAL = 200;
    var DEFAULT_LANGUAGE = "en";

    var NATIVE_TOOLS = [
        "insertLineBreak",
        "insertParagraph",
        "redo",
        "undo",
        "autoLink"
    ];

    const TOOLBAR_ALLOWED_CLOSE_SELECTORS = ".k-icon,.k-svg-icon,svg,path,.k-editor-window,.k-editor-toolbar,.k-editortoolbar-dragHandle,[ref-toolbar-tool],[ref-toolbar-tool] *";

    var EditorUtils = {
        editorWrapperTemplate: () =>
            '<div class="k-editor">' +
            '<div class="k-editor-toolbar" role="toolbar"></div>' +
            '<div class="k-editable-area k-editor-content"></div>' +
            '</div>',

        formatByName: function(name, format) {
            for (var i = 0; i < format.length; i++) {
                if ($.inArray(name, format[i].tags) >= 0) {
                    return format[i];
                }
            }
        },

        getToolCssClass: function(name, icon) {
            var toolCssClassNames = {
                superscript: "supscript",
                subscript: "subscript",
                justifyLeft: "align-left",
                justifyCenter: "align-center",
                justifyRight: "align-right",
                justifyFull: "align-justify",
                insertUnorderedList: "list-unordered",
                insertOrderedList: "list-ordered",
                insertUpperRomanList: "list-roman-upper",
                insertLowerRomanList: "list-roman-lower",
                "import": "import",
                indent: "indent",
                outdent: "outdent",
                createLink: "link",
                unlink: "unlink",
                insertImage: "image",
                insertFile: "file-add",
                viewHtml: "code",
                foreColor: "foreground-color",
                backColor: "droplet",
                createTable: "table-add",
                addColumnLeft: "table-column-insert-left",
                addColumnRight: "table-column-insert-right",
                addRowAbove: "table-row-insert-above",
                addRowBelow: "table-row-insert-below",
                deleteRow: "table-row-delete",
                deleteColumn: "table-column-delete",
                mergeCellsHorizontally: "cells-merge-horizontally",
                mergeCellsVertically: "cells-merge-vertically",
                splitCellHorizontally: "cell-split-horizontally",
                splitCellVertically: "cell-split-vertically",
                tableProperties: "table-properties",
                tableCellProperties: "table-cell-properties",
                tableWizardInsert: "table-wizard",
                tableAlignLeft: "table-position-start",
                tableAlignCenter: "table-position-center",
                tableAlignRight: "table-position-end",
                cleanFormatting: "clear-css",
                copyFormat: "copy-format",
                applyFormat: "apply-format",
                pdf: "file-pdf"
            };

            var cssClass = toolCssClassNames[name];

            if (cssClass) {
                return cssClass;
            }

            if (icon) {
                return icon;
            }

            return EditorUtils.nameToKebab(name);
        },

        nameToKebab: function(name) {
            return name.replace(/([a-z])([A-Z])/g, "$1-$2")
                .replace(/[\s_]+/g, '-')
                .toLowerCase();
        },

        registerTool: function(toolName, tool) {
            if (!tool.name) {
                tool.options.name = toolName;
                tool.name = toolName.toLowerCase();
            }

            if (!tool.options.ui) {
                tool.options.ui = {};
            }

            tool.options.ui.command = toolName;

            Editor.defaultTools[toolName] = tool;
        },

        registerFormat: function(formatName, format) {
            Editor.fn.options.formats[formatName] = format;
        },

        cacheComments: function(content, comments) {
            for (var index in comments) {
                content = content.replace(comments[index], "{" + index + "}");
            }
            return content;
        },

        retrieveComments: function(content, comments) {
            for (var index in comments) {
                content = content.replace("{" + index + "}", comments[index]);
            }
            return content;
        }
    };

    var messages = {
        auto: "Auto",
        bold: "Bold",
        italic: "Italic",
        underline: "Underline",
        strikethrough: "Strikethrough",
        superscript: "Superscript",
        subscript: "Subscript",
        fitToCell: "Fit to cell",
        justifyCenter: "Center text",
        justifyLeft: "Align text left",
        justifyRight: "Align text right",
        justifyFull: "Justify",
        insertUnorderedList: "Insert unordered list",
        insertOrderedList: "Insert ordered list",
        lineHeight: "Set line height",
        formattingMarks: "Toggle formatting marks",
        indent: "Indent",
        outdent: "Outdent",
        createLink: "Insert hyperlink",
        unlink: "Remove hyperlink",
        insertImage: "Insert image",
        insertFile: "Insert file",
        insertHtml: "Insert HTML",
        viewHtml: "View HTML",
        fontName: "Select font family",
        fontNameInherit: "(inherited font)",
        fontSize: "Select font size",
        fontSizeInherit: "(inherited size)",
        formatBlock: "Format",
        formatting: "Format",
        foreColor: "Color",
        backColor: "Background color",
        style: "Styles",
        emptyFolder: "Empty Folder",
        editAreaTitle: "Editable area. Press F10 for toolbar.",
        uploadFile: "Upload",
        overflowAnchor: "More tools",
        orderBy: "Arrange by:",
        orderBySize: "Size",
        orderByName: "Name",
        invalidFileType: "The selected file {0} is not valid. Supported file types are {1}.",
        deleteFile: 'Are you sure you want to delete {0}?',
        overwriteFile: 'A file with name {0} already exists in the current directory. Do you want to overwrite it?',
        directoryNotFound: "A directory with this name was not found.",
        imageWebAddress: "Web address",
        imageAltText: "Alternate text",
        imageWidth: "Width (px)",
        imageHeight: "Height (px)",
        fileWebAddress: "Web address",
        fileTitle: "Title",
        fileText: "Text",
        linkWebAddress: "Web address",
        linkText: "Text",
        linkToolTip: "ToolTip",
        linkOpenInNewWindow: "Open link in new window",
        dialogUpdate: "Update",
        dialogInsert: "Insert",
        dialogOk: "Confirm",
        dialogCancel: "Cancel",
        cleanFormatting: "Clean formatting",
        createTable: "Create a table",
        createTableHint: "Create a {0} x {1} table",
        addColumnLeft: "Add column on the left",
        addColumnRight: "Add column on the right",
        addRowAbove: "Add row above",
        addRowBelow: "Add row below",
        deleteRow: "Delete row",
        deleteColumn: "Delete column",
        mergeCellsHorizontally: "Merge cells horizontally",
        mergeCellsVertically: "Merge cells vertically",
        splitCellHorizontally: "Split cells horizontally",
        splitCellVertically: "Split cells vertically",
        tableAlignLeft: "Table Align Left",
        tableAlignCenter: "Table Align Center",
        tableAlignRight: "Table Align Right",
        tableWizard: "Table Wizard",
        tableProperties: "Table Properties",
        tableCellProperties: "Cell Properties",
        tableTab: "General",
        cellTab: "Cell",
        accessibilityTab: "Advanced",
        caption: "Caption",
        summary: "Summary",
        width: "Width",
        height: "Height",
        units: "Units",
        cellSpacing: "Cell Spacing",
        cellPadding: "Cell Padding",
        topPadding: "Top",
        leftPadding: "Left",
        bottomPadding: "Bottom",
        rightPadding: "Right",
        independentCellPaddings: "Independent Cell Paddings",
        cellMargin: "Cell Margin",
        alignment: "Alignment",
        captionAlignment: "Caption alignment",
        position: "Position",
        background: "Background",
        tableBackground: "Table background",
        cssClass: "CSS Class",
        id: "ID",
        border: "Border",
        borderStyle: "Border Style",
        borderWidth: "Border Width",
        borderColor: "Border Color",
        collapseBorders: "Collapse borders",
        wrapText: "Wrap text",
        associateCellsWithHeaders: "Associate headers",
        alignLeft: "Align Left",
        alignCenter: "Align Center",
        alignRight: "Align Right",
        alignLeftTop: "Align Left Top",
        alignCenterTop: "Align Center Top",
        alignRightTop: "Align Right Top",
        alignLeftMiddle: "Align Left Middle",
        alignCenterMiddle: "Align Center Middle",
        alignRightMiddle: "Align Right Middle",
        alignLeftBottom: "Align Left Bottom",
        alignCenterBottom: "Align Center Bottom",
        alignRightBottom: "Align Right Bottom",
        alignRemove: "Remove Alignment",
        columns: "Columns",
        rows: "Rows",
        selectAllCells: "Apply to all cells",
        applyToColumn: "apply to column",
        applyToRow: "apply to row",
        exportAs: "Export As",
        "import": "Import",
        print: "Print",
        headerRows: "Header Rows",
        headerColumns: "Header Cols",
        tableSummaryPlaceholder: "Summary attribute is not HTML5 compatible.",
        associateNone: "None",
        associateScope: "Associate using 'scope' attribute",
        associateIds: "Associate using Ids",
        copyFormat: "Copy format",
        applyFormat: "Apply format",
        borderNone: "None",
        undo: "Undo",
        redo: "Redo"
    };

    var supportedContentEditable = typeof (document.documentElement.contentEditable) != 'undefined';

    var toolGroups = {
        basic: ["bold", "italic", "underline", "strikethrough"],
        undo: ["undo", "redo"],
        scripts: ["subscript", "superscript"],
        alignment: ["justifyLeft", "justifyCenter", "justifyRight", "justifyFull"],
        lines: ["lineHeight"],
        symbols: ["formattingMarks"],
        links: ["insertImage", "insertFile", "createLink", "unlink"],
        lists: ["insertUnorderedList", "insertOrderedList", "insertUpperRomanList", "insertLowerRomanList",],
        dent: ["indent", "outdent"],
        tablesWizard: ["tableProperties", "tableCellProperties"],
        tablesInsert: ["createTable"],
        tablesAddDelete: ["addColumnLeft", "addColumnRight", "addRowAbove", "addRowBelow", "deleteRow", "deleteColumn"],
        tablesMerge: ["mergeCellsHorizontally", "mergeCellsVertically", "splitCellHorizontally", "splitCellVertically"],
        tablesPosition: ["tableAlignLeft", "tableAlignCenter", "tableAlignRight"],
        formatPainter: ["copyFormat", "applyFormat"]
    };

    var Editor = Widget.extend({
        __suppressEditableCheck: false,
        init: function(element, options) {
            var that = this,
                editorNS = kendo.ui.editor,
                dom = editorNS.Dom,
                toolbarContainer,
                type, domElement;


            /* suppress initialization in devices w/o proper contenteditable support */
            if (!supportedContentEditable && !that.__suppressEditableCheck) {
                return;
            }

            Widget.fn.init.call(that, element, options);

            that.options = deepExtend({}, that.options, options);

            element = that.element;
            domElement = element[0];
            type = dom.name(domElement);

            this._registerHandler(
                element.closest("form"), "submit", that.update.bind(that, undefined$1)
            );

            if (that._isAiPromptEnabled()) {
                that._addAIPromptElements();
            }

            toolbarContainer = that._setupType(element);

            that._initToolbar(toolbarContainer);
            that._setupHeight(type);
            that._resizable();
            that._initializeContentElement(that);
            that._setupKeyboard();

            that.clipboard = new editorNS.Clipboard(this);
            that.undoRedoStack = new kendo.util.UndoRedoStack();

            that._populateValue(options, domElement);

            that._registerHandler(document, {
                "mousedown": function() { that._endTyping(); },
                "mouseup": function(e) { that._mouseup(e); }
            });

            that._registerHandler(window, "resize", that._handleSpaceAndNewLines.bind(that));

            that._initializeImmutables();

            if (type == "textarea") {
                that._ariaLabel(that.wrapper.find("iframe"));
            }

            that.toolbar.resize();

            that._initInlineOverflowWrapper();

            kendo.notify(that);

            if (that._showWatermarkOverlay) {
                that._showWatermarkOverlay((that.wrapper && that.wrapper[0]) || that.element[0]);
            }

            if (that._isAiPromptEnabled()) {
                that._initAIPrompt();
            }

            if (that._isInlineAIPromptEnabled()) {
                that._initInlineAIPrompt();
            }
        },

        events: [
            "select",
            "change",
            "execute",
            "error",
            "paste",
            "keydown",
            "keyup"
        ],

        options: {
            name: "Editor",
            messages: messages,
            placeholder: "",
            nonce: "",
            unsafeInline: true,
            formats: {},
            encoded: true,
            formattingMarksRefreshDelay: 250,
            domain: null,
            resizable: false,
            deserialization: {
                custom: null
            },
            serialization: {
                entities: true,
                semantic: true,
                scripts: false,
                optimizeTags: false,
                keepEOL: false
            },
            pasteCleanup: {
                all: false,
                css: false,
                custom: null,
                keepNewLines: false,
                msAllFormatting: false,
                msConvertLists: true,
                msTags: true,
                none: false,
                span: false
            },
            stylesheets: [],
            dialogOptions: {
                modal: true, resizable: false, draggable: true,
                animation: false
            },
            imageBrowser: null,
            fileBrowser: null,
            navigateOnTab: false,
            fontName: [
                { text: "Arial", value: "Arial, Helvetica, sans-serif" },
                { text: "Courier New", value: "\"Courier New\", Courier, monospace" },
                { text: "Georgia", value: "Georgia, serif" },
                { text: "Impact", value: "Impact, Charcoal, sans-serif" },
                { text: "Lucida Console", value: "\"Lucida Console\", Monaco, monospace" },
                { text: "Tahoma", value: "Tahoma, Geneva, sans-serif" },
                { text: "Times New Roman", value: "\"Times New Roman\", Times, serif" },
                { text: "Trebuchet MS", value: "\"Trebuchet MS\", Helvetica, sans-serif" },
                { text: "Verdana", value: "Verdana, Geneva, sans-serif" }
            ],
            fontSize: [
                { text: "1 (8pt)", value: "xx-small" },
                { text: "2 (10pt)", value: "x-small" },
                { text: "3 (12pt)", value: "small" },
                { text: "4 (14pt)", value: "medium" },
                { text: "5 (18pt)", value: "large" },
                { text: "6 (24pt)", value: "x-large" },
                { text: "7 (36pt)", value: "xx-large" }
            ],
            formatBlock: [
                { text: "Paragraph", value: "p" },
                { text: "Quotation", value: "blockquote" },
                { text: "Heading 1", value: "h1" },
                { text: "Heading 2", value: "h2" },
                { text: "Heading 3", value: "h3" },
                { text: "Heading 4", value: "h4" },
                { text: "Heading 5", value: "h5" },
                { text: "Heading 6", value: "h6" }
            ],
            tools: [
                "formatting",
                "bold",
                "italic",
                "underline",
                "undo",
                "redo",
                "justifyLeft",
                "justifyCenter",
                "justifyRight",
                "copyFormat",
                "applyFormat",
                "insertUnorderedList",
                "insertOrderedList",
                "indent",
                "outdent",
                "createLink",
                "unlink",
                "insertImage",
                "tableProperties",
                "tableCellProperties",
                "createTable",
                "addRowAbove",
                "addRowBelow",
                "addColumnLeft",
                "addColumnRight",
                "deleteRow",
                "deleteColumn",
                "mergeCellsHorizontally",
                "mergeCellsVertically",
                "splitCellHorizontally",
                "splitCellVertically",
                "tableAlignLeft",
                "tableAlignCenter",
                "tableAlignRight"
            ],
            ai: false
        },

        destroy: function() {
            var editor = this;

            Widget.fn.destroy.call(this);

            this._endTyping(true);

            this._deregisterHandlers();

            clearTimeout(this._spellCorrectTimeout);

            this._focusOutside();

            this.toolbar.destroy();

            if (this.windowInstance) {
                this.windowInstance.destroy();
            }
            if (this.tablePopup) {
                this.tablePopup.destroy();
            }

            editor._destroyUploadWidget();

            if (this.interSectionObserver) {
                this.interSectionObserver.disconnect();
                this.interSectionObserver = null;
            }

            if (this.resizeObserver) {
                this.resizeObserver.disconnect();
                this.resizeObserver = null;
                this.wrapper.css("min-height", "");
                this.wrapper.css("max-height", "");
            }

            editor._destroyResizings();

            editor._destroyFormattingMarksOverlay();

            kendo.destroy(this.wrapper);
        },

        setOptions: function(options) {
            var editor = this;

            Widget.fn.setOptions.call(editor, options);

            if (options.tools) {
                this._setOptionsTools(options.tools);
            }

            this._initializePlaceholder();
        },

        createRange: function(document) {
            return kendo.ui.editor.RangeUtils.createRange(document || this.document);
        },

        encodedValue: function() {
            return kendo.ui.editor.Dom.encode(this.value());
        },

        exec: function(name, params) {
            var that = this;
            var command = null;
            var defaultTools = kendo.ui.Editor.defaultTools;
            var range, tool, prevented;

            if (!name) {
                throw new Error("kendoEditor.exec(): `name` parameter cannot be empty");
            }

            if (that.body.getAttribute("contenteditable") !== "true" &&
                name !== "print" &&
                name !== "pdf" &&
                name !== "exportAs") {
                return false;
            }

            if (!that.keyboard.isTypingInProgress()) {
                that._focusBody();
                that.selectRange(that._range || that.getRange());
            }

            tool = that.tools[name] || defaultTools[name];

            if (!tool) {
                Object.keys(defaultTools).map(key => {
                    if (key.toLowerCase() === name) {
                        tool = defaultTools[key];
                    }
                });
            }

            if (tool) {
                range = that.getRange();

                if (tool.command) {
                    command = tool.command(extend({ range: range, body: that.body, immutables: !!that.immutables }, params));
                }

                prevented = that.trigger("execute", { name: name, command: command });

                if (prevented) {
                    return;
                }

                if (/^(undo|redo)$/i.test(name)) {
                    that.undoRedoStack[name]();
                } else if (command) {
                    that.execCommand(command);

                    if (command.async) {
                        command.change = that._commandChange.bind(that);
                        return;
                    }
                }

                // Prevent double execution when the formatting marks tool is used.
                if (name !== "formattingMarks") {
                    that._handleSpaceAndNewLines();
                }
                that._selectionChange();
            }
        },

        _commandChange: function() {
            const that = this;
            that._selectionChange();
            that._handleSpaceAndNewLines();
        },

        execCommand: function(command) {
            if (!command.managesUndoRedo) {
                this.undoRedoStack.push(command);
            }

            command.editor = this;
            command.exec();
        },

        focus: function() {
            this.restoreSelection();
        },

        getRange: function() {
            var selection = this.getSelection(),
                range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : this.createRange(),
                doc = this.document;

            if (range.startContainer == doc && range.endContainer == doc && !range.startOffset && !range.endOffset) {
                range.setStart(this.body, 0);
                range.collapse(true);
            }

            return range;
        },

        getSelection: function() {
            return kendo.ui.editor.SelectionUtils.selectionFromDocument(this.document);
        },

        paste: function(html, options) {
            this.focus();

            var command = new kendo.ui.editor.InsertHtmlCommand($.extend({
                range: this.getRange(),
                html: html
            }, options));

            command.editor = this;

            command.exec();
        },

        insertAfterSelection: function(html, options) {
            this.focus();
            // Insert content after the current selection
            const range = this.getRange();
            range.collapse(false); // Move caret to the end of the selection
            var command = new kendo.ui.editor.InsertHtmlCommand($.extend({
                range: range,
                html: html
            }, options));

            command.editor = this;

            command.exec();
        },

        refresh: function() {
            var that = this;

            if (that.textarea) {
                that._destroyResizings();
                // preserve updated value before re-initializing
                // don't use update() to prevent the editor from encoding the content too early
                var value = that.value();
                that.textarea.val(value);
                that.wrapper.find("iframe").remove();
                that._initializeContentElement(that);
                that.value(value);
            }
        },

        restoreSelection: function() {
            this._focusBody();

            if (this.selectionRestorePoint) {
                this.selectRange(this.selectionRestorePoint.toRange());
            }
        },

        saveSelection: function(range) {
            range = range || this.getRange();
            var container = range.commonAncestorContainer,
                body = this.body;

            if (container == body || $.contains(body, container)) {
                this.selectionRestorePoint = new kendo.ui.editor.RestorePoint(range, body);
            }
        },

        selectedHtml: function() {
            return kendo.ui.editor.Serializer.domToXhtml(this.getRange().cloneContents());
        },

        selectRange: function(range) {
            this._focusBody();
            var selection = this.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            this.saveSelection(range);
        },

        state: function(toolName) {
            var tool = kendo.ui.Editor.defaultTools[toolName];
            var finder = tool && (tool.options.finder || tool.finder);
            var RangeUtils = kendo.ui.editor.RangeUtils;
            var range, textNodes;

            if (finder) {
                range = this.getRange();

                textNodes = RangeUtils.textNodes(range);

                if (!textNodes.length && range.collapsed) {
                    textNodes = [range.startContainer];
                }

                return finder.getFormat ? finder.getFormat(textNodes) : finder.isFormatted(textNodes);
            }

            return false;
        },

        update: function(value) {
            value = value || this.options.encoded ? this.encodedValue() : this.value();

            if (this.textarea) {
                this.textarea.val(value);
                this._togglePlaceholder(!value.trim());
            } else {
                this._oldValue = value;
            }
        },

        value: function(html) {
            var body = this.body,
                editorNS = kendo.ui.editor,
                options = this.options,
                currentHtml = editorNS.Serializer.domToXhtml(body, options.serialization);

            if (html === undefined$1) {
                return currentHtml;
            }

            if (html == currentHtml) {
                return;
            }

            editorNS.Serializer.htmlToDom(html, body, options.deserialization);

            this.selectionRestorePoint = null;
            this.update();
            this._refreshTools();
        },

        _bindTools: function() {
            var that = this,
                defaultTools = this.tools;

            that.unbind("select", that.toolbar.resize.bind(that.toolbar));

            that.toolbar.element.find("[data-command]")
                .filter((i, el) => $(el).find("[data-command]").length === 0)
                .each((i, el) => {
                    var toolName = el.getAttribute("data-command"),
                        tool = defaultTools[toolName];

                    if (tool && tool.initialize) {
                        tool.initialize($(el), that);
                    }
                });

            that.bind("select", that.toolbar.resize.bind(that.toolbar));
        },

        _blur: function() {
            var textarea = this.textarea;
            var old = textarea ? textarea.val() : this._oldValue;
            var value = this.options.encoded ? this.encodedValue() : this.value();

            this.update();

            if (textarea) {
                textarea.trigger("blur");
            }

            if (value != old) {
                this.trigger("change");
                if (textarea) {
                    textarea.trigger("change");
                }
            }
        },

        _containsRange: function(range) {
            var dom = kendo.ui.editor.Dom;
            var body = this.body;
            return range && dom.isAncestorOrSelf(body, range.startContainer) &&
                dom.isAncestorOrSelf(body, range.endContainer);
        },

        _createContentElement: function(stylesheets) {
            var editor = this;
            var iframe, wnd, doc;
            var textarea = editor.textarea;
            var specifiedDomain = editor.options.domain;
            var domain = specifiedDomain || document.domain;
            var domainScript = "";
            var src = 'javascript:""';
            var lang = "";

            textarea.hide();

            iframe = $("<iframe />", { title: editor.options.messages.editAreaTitle, frameBorder: "0" })[0];

            $(iframe)
                .css("display", "")
                .addClass("k-content k-iframe")
                .attr("tabindex", textarea[0].tabIndex)
                .insertBefore(textarea);

            // automatically relax same-origin policy if document.domain != location.hostname,
            // or forcefully relax if options.domain is specified (for document.domain = document.domain scenario)
            if (specifiedDomain || domain != location.hostname) {
                // relax same-origin policy
                domainScript = `<script ${editor.options.nonce ? `nonce="${editor.options.nonce}"` : ""}>document.domain="${domain}"</script>`;
                src = "javascript:document.write('" + domainScript + "')";
                iframe.src = src;
            }

            if (!iframe.src) {
                iframe.src = "";
            }

            wnd = iframe.contentWindow || iframe;
            doc = wnd.document || iframe.contentDocument;

            // https://github.com/telerik/kendo-ui-core/issues/7561
            const observer = editor.interSectionObserver = new IntersectionObserver(entries => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        editor._decorateFormatting(doc.body);
                        observer.unobserve(iframe);
                    }
                }
            });
            observer.observe(iframe);

            lang = document.getElementsByTagName("html")[0].getAttribute("lang") || DEFAULT_LANGUAGE;

            doc.open();
            doc.write(
                "<!DOCTYPE html><html lang='" + lang + "'><head>" +
                "<meta charset='utf-8' />" +
                "<title>Kendo UI Editor content</title>" +
                `<style ${editor.options.nonce ? `nonce="${editor.options.nonce}"` : ""}>` +
                "html{padding:0;margin:0;height:100%;min-height:100%;cursor:text;}" +
                "body{padding:0;margin:0;}" +
                "body{box-sizing:border-box;font-size:12px;font-family:Verdana,Geneva,sans-serif;margin-top:-1px;padding:5px .4em 0;" +
                "word-wrap: break-word;-webkit-nbsp-mode: space;-webkit-line-break: after-white-space;" +
                (kendo.support.isRtl(textarea) ? "direction:rtl;" : "") +
                (os.ios ? "word-break:keep-all;" : "") +
                (browser.edge || browser.chrome ? "height:100%;" : "") +
                "}" +
                "h1{font-size:2em;margin:.67em 0}h2{font-size:1.5em}h3{font-size:1.16em}h4{font-size:1em}h5{font-size:.83em}h6{font-size:.7em}" +
                "p{margin:0 0 1em;}.k-marker{display:none;}.k-paste-container,.Apple-style-span{position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden}" +
                "ul,ol{padding-left:2.5em}" +
                "span{-ms-high-contrast-adjust:none;}" +
                "a{color:#00a}" +
                "code{font-size:1.23em}" +
                "telerik\\3Ascript{display: none;}" +
                ".k-table{width:100%;border-spacing:0;margin: 0 0 1em;}" +
                ".k-table td{min-width:1px;padding:.2em .3em;}" +
                ".k-table,.k-table td{outline:0;border: 1px dotted #ccc;}" +
                ".k-table th{outline:0;border: 1px dotted #999;}" +
                ".k-table p{margin:0;padding:0;}" +
                ".k-column-resize-handle-wrapper {position: absolute; height: 10px; width:10px; cursor: col-resize; z-index: 2;}" +
                ".k-column-resize-handle {width: 100%; height: 100%;}" +
                ".k-column-resize-handle > .k-column-resize-marker {width:2px; height:100%; margin:0 auto; background-color:#00b0ff; display:none; opacity:0.8;}" +
                ".k-row-resize-handle-wrapper {position: absolute; cursor: row-resize; z-index:2; width: 10px; height: 10px;}" +
                ".k-row-resize-handle {display: table; width: 100%; height: 100%;}" +
                ".k-row-resize-marker-wrapper{display: table-cell; height:100%; width:100%; margin:0; padding:0; vertical-align: middle;}" +
                ".k-row-resize-marker{margin: 0; padding:0; width:100%; height:2px; background-color: #00b0ff; opacity:0.8; display:none;}" +
                ".k-element-resize-handle-wrapper {position: absolute; background-color: #fff; border: 1px solid #000; z-index: 100; width: 5px; height: 5px;}" +
                ".k-element-resize-handle {width: 100%; height: 100%;}" +
                ".k-element-resize-handle.k-resize-east{cursor:e-resize;}" +
                ".k-element-resize-handle.k-resize-north{cursor:n-resize;}" +
                ".k-element-resize-handle.k-resize-northeast{cursor:ne-resize;}" +
                ".k-element-resize-handle.k-resize-northwest{cursor:nw-resize;}" +
                ".k-element-resize-handle.k-resize-south{cursor:s-resize;}" +
                ".k-element-resize-handle.k-resize-southeast{cursor:se-resize;}" +
                ".k-element-resize-handle.k-resize-southwest{cursor:sw-resize;}" +
                ".k-element-resize-handle.k-resize-west{cursor:w-resize;}" +
                ".k-table.k-element-resizing{opacity:0.6;}" +
                ".k-placeholder{color:grey}" +
                "k\\:script{display:none;}" +
                "</style>" +
                domainScript +
                $.map(stylesheets, function(href) {
                    return `<link rel='stylesheet' href='${href}' ${editor.options.nonce ? `nonce="${editor.options.nonce}"` : ""}>`;
                }).join("") +
                `</head><body id='${editor.element.attr("id")}' autocorrect='off' contenteditable='true'></body></html>`
            );
            doc.close();

            return wnd;
        },

        _deleteSavedRange: function() {
            if ("_range" in this) {
                delete this._range;
            }
        },

        _decorateFormatting: function(body) {
            var formattingElement = this.toolbar.element.find("input[data-command=formatting]"),
                dom = kendo.ui.editor.Dom,
                component, dataSource, items, i, tag, className, style;

            if (formattingElement.length) {
                component = formattingElement.getKendoDropDownList();
                if (!component) {
                    return;
                }
                dataSource = component.dataSource;
                items = dataSource.data();

                if (body) {
                    component.list.css("background-color", dom.getEffectiveBackground($(body)));
                }

                if (this.options.unsafeInline !== false) {

                    for (i = 0; i < items.length; i++) {
                        tag = items[i].tag || "span";
                        className = items[i].className;

                        style = dom.inlineStyle(body, tag, { className: className });
                        style = style.replace(/"/g, "'");

                        items[i].style = style + ";display:inline-block";
                    }
                }

                dataSource.trigger("change");
            }
        },

        _appendFormattingMarksStyles: function() {
            const that = this,
                elementId = that.element.attr("id");

            let style, $head;

            style = `<style id='${FORMATTING_MARKS_STYLE_ID + "-" + elementId}' ${that.options.nonce ? `nonce="${that.options.nonce}"` : ""} >
                #${elementId} p::after,
                #${elementId} li::after,
                #${elementId} h1::after,
                #${elementId} h2::after,
                #${elementId} h3::after,
                #${elementId} h4::after,
                #${elementId} h5::after,
                #${elementId} h6::after {content: '\\00B6'; color: #6098f2;}
                #${FORMATTING_MARKS_OVERLAY_WRAPPER_ID + "-" + elementId} {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    z-index: 9999;
                    pointer-events: none;
                }
                #${FORMATTING_MARKS_OVERLAY_ID + "-" + elementId} {
                    width: 100%;
                    height: 100%;
                  }
            </style>`;

            $head = $(that.document.head);
            $head.find("#" + FORMATTING_MARKS_STYLE_ID + "-" + elementId).remove();
            $head.append(style);
        },

        _appendFormattingMarksOverlay: function() {
            const that = this,
                elementId = that.element.attr("id");

            that._formattingMarksOverlayWrapper = $(`<div id='${FORMATTING_MARKS_OVERLAY_WRAPPER_ID + "-" + elementId}'></div>`);
            that._formattingMarksOverlay = $(`<svg id='${FORMATTING_MARKS_OVERLAY_ID + "-" + elementId}'></svg>`).appendTo(that._formattingMarksOverlayWrapper);
            that._bodyTopBottomPaddings = parseFloat($(that.body).css("padding-top")) + parseFloat($(that.body).css("padding-bottom"));

            if (that._isInlineEditor()) {
                that._formattingMarksOverlayWrapper.insertAfter(that.element);
            } else {
                that._formattingMarksOverlayWrapper.appendTo($(that.document).find("html"));
            }
        },

        _destroyFormattingMarksOverlay: function() {
            const that = this,
                elementId = that.element.attr("id");

            $(that.document).find("#" + FORMATTING_MARKS_OVERLAY_WRAPPER_ID + "-" + elementId).remove();
            $(that.document.head).find("#" + FORMATTING_MARKS_STYLE_ID + "-" + elementId).remove();
        },

        _updateFormattingMarksOverlayHeight: function() {
            const that = this;

            if (that._isInlineEditor()) {
                that._formattingMarksOverlayWrapper.height($(that.body).outerHeight());
            } else {
                that._formattingMarksOverlayWrapper.height(that.body.scrollHeight - that._bodyTopBottomPaddings);
            }
        },

        _initInlineOverflowWrapper: function() {
            const that = this,
                inlineHeight = that.options.inlineHeight;

            if (that._isInlineEditor() && inlineHeight > -1) {
                that._inlineOverflowWrapper = that.element.wrap(`<div class='k-inline-editor-overflow-wrapper k-pos-relative k-overflow-auto'></div>`).parent();
                that._inlineOverflowWrapper.height(inlineHeight);
            }
        },

        _addAIPromptElements: function() {
            const that = this;
            const splitterElement = $('<div/>');
            const aiPromptElement = $('<div/>');


            that.splitterElement = splitterElement;
            that.aiPromptElement = aiPromptElement;
            splitterElement.insertBefore(that.element);
            aiPromptElement.appendTo(splitterElement);
            that.element.appendTo(splitterElement);
        },

        _initInlineAIPrompt: function() {
            const that = this;
            const element = $("<div/>").insertAfter(that.element);
            const defaultCommands = that._mapCommands(that.options.ai?.inlineAIPrompt?.commands || that.options.ai?.commands || kendo.ui.InlineAIPrompt.fn.options.commands);

            that.inlineAIPrompt = element.kendoInlineAIPrompt({
                popup: {
                    width: "768px"
                },
                service: that.options.ai?.service,
                commands: defaultCommands,
                _isEditor: true,
                systemPrompt: that.options.ai?.inlineAIPrompt?.systemPrompt,
                commandExecute: (e) => {
                    e.context = that.getRange().toString();
                },
                outputAction: (e) => {
                    if (e.action === 'insert') {
                        that.insertAfterSelection(e.content);
                    }

                    if (e.action === 'replace') {
                        that.paste(e.content);
                    }
                }
            }).data('kendoInlineAIPrompt');
        },

        _mapCommands: function(commands, parentId = null) {
            const that = this;

            return commands.map((command, i) => {
                const id = parentId ? `${parentId}-${i}` : `${i}`;
                const item = {
                    id: id,
                    text: command.text,
                    icon: command.icon
                };

                if (command.prompt) {
                    item.prompt = command.prompt;
                }

                if (command.items) {
                    item.items = that._mapCommands(command.items, id);
                }

                return item;
            });
        },

        _isAiPromptEnabled() {
            const that = this;

            return that.options.ai && that.options.ai.aiPrompt != false;
        },

        _isInlineAIPromptEnabled() {
            const that = this;

            return that.options.ai && that.options.ai.inlineAIPrompt != false;
        },

        _initAIPrompt: function() {
            const that = this;
            const defaultCommands = that.options.ai?.aiPrompt?.commands || that.options.ai?.commands || that._mapCommands(kendo.ui.InlineAIPrompt.fn.options.commands);

            that.aiPrompt = that.aiPromptElement.kendoAIPrompt($.extend({
                service: that.options.ai?.service,
                speechToText: false,
                promptTextArea: {
                    rows: 5,
                    suffixOptions: {
                        template: () => `<div ref-select-context-buttongroup></div>`
                    }
                },
                views: [
                    {
                        type: 'prompt',
                        buttonIcon: "",
                        themeColor: "base",
                        initializeComponents: (e) => {
                            let view = e.view;
                            view.contentElement.find('[ref-select-context-buttongroup]').kendoButtonGroup({
                                index: that._contextSelection,
                                items: [
                                    { text: "Use with selection", icon: "box-sizing" },
                                    { text: "Use full content", icon: "form-element" }
                                ],
                                selection: "multiple",
                                fillMode: "flat",
                                select: (e) => {
                                    let selectionToggleButton = e.sender._buttons[0];
                                    let fullContentToggleButton = e.sender._buttons[1];

                                    if (e.indices.length > 1) {
                                        if (e.target[0] == selectionToggleButton.element[0]) {
                                            fullContentToggleButton.toggle(false);
                                            e.sender._toggleIndex(1);
                                        } else {
                                            selectionToggleButton.toggle(false);
                                            e.sender._toggleIndex(0);
                                        }
                                    }

                                    that._contextSelection = e.indices[0];
                                }
                            });
                        },
                    },
                    {
                        type: 'output',
                        themeColor: "base",
                    },
                    {
                        type: 'commands',
                        themeColor: "base",
                        promptCommands: defaultCommands
                    }
                ],
                promptRequest: (e) => {
                    const contextSelection = that._contextSelection;
                    let prompt = e.prompt;

                    if (contextSelection === 0) {
                        prompt = that._contextTemplate(prompt, that.getRange().toString());
                    } else if (contextSelection === 1) {
                        prompt = that._contextTemplate(prompt, that.value());
                    } else {
                        prompt = that._contextTemplate(prompt, "");
                    }

                    if (e.prompt != prompt) {
                        e.prompt = prompt;
                    }
                },
                commandExecute: (e) => {
                    const prompt = e.item.prompt;

                    if (prompt) {
                        that.aiPrompt.transport.read({
                            prompt: prompt(that.value()),
                            history: [],
                            isRetry: false
                        });
                    }
                }
            }, that.options.ai?.aiPrompt)).data('kendoAIPrompt');
            that.aiPromptSplitter = that.splitterElement.kendoSplitter({
                panes: [$.extend({
                    size: '50%',
                    collapsible: true,
                    collapsed: true,
                    min: "360px"
                }, that.options.ai?.pane), {}]
            }).data('kendoSplitter');

            if (that._isInlineAIPromptEnabled()) {
                that.bind("select", that._selectionChangeHandler.bind(that));
            }
        },

        _contextTemplate: function(query, context) {
            const that = this;
            const defaultTemplate = `You are an advanced AI language assistant.
            A user has selected a portion of their text and provided a query regarding how they want it modified.
            Your task is to accurately respond to their request while preserving the original intent of the text.
            Follow the instructions strictly and provide only the requested output unless explicitly asked to explain your changes.

            ${context ? "Selected Text:" : ""}
            ${context}

            User's Request:
            ${query}

            Response:`;

            if (!that.options.ai?.aiPrompt?.systemPrompt) {
                return defaultTemplate;
            }

            return that.options.ai?.aiPrompt?.systemPrompt(query, context);
        },

        _selectionChangeHandler: function() {
            const that = this,
                range = that.getRange(),
                selectionRect = range.getBoundingClientRect(),
                elementRect = that.wrapper[0].getBoundingClientRect(),
                editorNS = kendo.ui.editor,
                rangeUtils = editorNS.RangeUtils,
                nodes = rangeUtils.textNodes(range);

            if (nodes.length === 0) {
                that.inlineAIPrompt._popup.close();
                return;
            }

            that.inlineAIPrompt._popup.open();
            const popupHeight = that.inlineAIPrompt._popup.element.outerHeight();
            const popupWidth = that.inlineAIPrompt._popup.element.outerWidth();
            let y = window.scrollY + elementRect.top + selectionRect.top + selectionRect.height;
            let x = window.scrollX + elementRect.left + selectionRect.left + selectionRect.width / 2 - popupWidth / 2;
            that.inlineAIPrompt._popup.close(true);

            if (window.innerHeight - selectionRect.bottom < popupHeight) {
                y -= popupHeight;
            } else {
                y += popupHeight;
            }

            if (x + popupWidth > window.innerWidth + window.scrollX) {
                x = window.innerWidth + window.scrollX - popupWidth;
            }

            that.inlineAIPrompt._popup.open(x, y);
        },

        _getSelectionPosition: function() {
            const that = this;
            const range = that.getRange();
            range.getBoundingClientRect();
        },

        _initContextMenu: function() {
            const that = this;
            const html = $(`<ul>
                            <li>${kendo.html.renderIcon({ icon: 'arrow-rotate-cw' })} Rewrite</li>
                            <li>${kendo.html.renderIcon({ icon: 'spell-checker' })} Fix mistakes</li>
                            <li>${kendo.html.renderIcon({ icon: 'tell-a-friend' })} Change tone
                                <ul>
                                    <li>Neutral</li>
                                    <li>Friendly</li>
                                    <li>Casual</li>
                                    <li>Formal</li>
                                </ul>
                            </li>
                            <li>${kendo.html.renderIcon({ icon: 'apply-format' })} Polish formatting
                            <li>${kendo.html.renderIcon({ icon: 'col-resize' })} Adjust length
                            <li>${kendo.html.renderIcon({ icon: 'edit-tools' })} Translate
                        </ul>`);

            $('body').append(html);

            that._aiContextMenu = html.kendoContextMenu({ targe: "imposibru" }).data('kendoContextMenu');
        },

        _insertAIResult: function() {
            const that = this,
                aiResult = "Test ai result";

            that.paste(aiResult);
        },

        _deregisterHandlers: function() {
            var handlers = this._handlers;

            for (var i = 0; i < handlers.length; i++) {
                var h = handlers[i];
                h.element.off(h.type, h.handler);
            }

            this._handlers = [];
        },

        _destroyUploadWidget: function() {
            var editor = this;
            if (editor._uploadWidget) {
                editor._uploadWidget.destroy();
                editor._uploadWidget = null;
            }
        },

        _endTyping: function() {
            var keyboard = this.keyboard;

            try {
                if (keyboard.isTypingInProgress()) {
                    keyboard.endTyping(true);
                    this.saveSelection();
                }
            } catch (e) { }
        },

        _focusBody: function() {
            var body = this.body;
            var iframe = this.wrapper && this.wrapper.find("iframe")[0];
            var documentElement = this.document.documentElement;
            var activeElement = kendo._activeElement();
            var scrollTop;


            if (!iframe && body.scrollHeight > body.clientHeight) {
                scrollTop = body.scrollTop;
                body.focus();
                body.scrollTop = scrollTop;

            } else if (activeElement != body && activeElement != iframe) {
                scrollTop = documentElement.scrollTop;
                body.focus();
                documentElement.scrollTop = scrollTop;
            }
        },

        _focusOutside: function() {
            // move focus outside the Editor, see https://github.com/telerik/kendo/issues/3673
            if (kendo.support.browser.msie && this.textarea) {
                var tempInput = $("<input />")
                    .css({
                        position: "fixed",
                        left: "1px",
                        top: "1px",
                        width: "1px",
                        height: "1px",
                        "font-size": "0",
                        border: "0",
                        opacity: "0"
                    })
                    .appendTo(document.body).trigger("focus");
                tempInput.trigger("blur").remove();
            }
        },

        _handleToolbarClick: function(e) {
            var toolName = e.target.data("command");

            if (toolName && toolName !== "createTable") {
                this.exec(toolName);
            }
        },

        _immutablesContext: function(range) {
            var editorNS = kendo.ui.editor;

            if (this.options.immutables) {
                if (range.collapsed) {
                    return editorNS.Immutables.immutablesContext(range);
                } else {
                    return editorNS.RangeUtils.editableTextNodes(range).length === 0;
                }
            }
        },

        _initializeContentElement: function() {
            var editor = this;
            var doc;
            var blurTrigger;
            var mousedownTrigger;

            if (editor.textarea) {
                editor.window = editor._createContentElement(editor.options.stylesheets);
                doc = editor.document = editor.window.contentDocument || editor.window.document;

                // Ensure that body exists as various Firefox plugins can cause a delay of the body creation
                // https://github.com/telerik/kendo-ui-core/issues/3515
                if (!doc.body) {
                    var body = doc.createElement("body");
                    body.setAttribute("contenteditable", "true");
                    body.setAttribute("autocorrect", "off");
                    doc.getElementsByTagName("html")[0].appendChild(body);

                    var interval = setInterval(function() {
                        if ($(editor.document).find("body").length > 1) {
                            $(editor.document).find("body").last().remove();
                            window.clearInterval(interval);
                        }
                    }, 10);
                }

                editor.body = doc.body;

                blurTrigger = editor.window;
                mousedownTrigger = doc;

                this._registerHandler(doc, "mouseup", this._mouseup.bind(this));
            } else {
                editor.window = window;
                doc = editor.document = document;
                editor.body = editor.element[0];

                blurTrigger = editor.body;
                mousedownTrigger = editor.body;

                editor._wrapSingleTextNodeInParagraph();

                setTimeout(() => {
                    editor._decorateFormatting(editor.body);
                });
            }

            this._registerHandler(blurTrigger, "blur", this._blur.bind(this));
            editor._registerHandler(mousedownTrigger, "down", editor._mousedown.bind(editor));

            try {
                doc.execCommand("enableInlineTableEditing", null, false);
            } catch (e) { }

            if (kendo.support.touch) {
                this._registerHandler(doc, {
                    "keydown": function() {
                        // necessary in iOS when touch events are bound to the page
                        if (kendo._activeElement() != doc.body) {
                            editor.window.focus();
                        }
                    }
                });
            }

            this._initializePlaceholder();

            this._spellCorrect(editor);

            this._registerHandler(editor.document, {
                "mouseover dragenter": function(e) {
                    var height = $(editor.body).height();
                    var htmlHeight = $(editor.body.parentElement).height();

                    if (htmlHeight > height && e.target.nodeName.toLowerCase() === "html") {
                        editor._cachedHeight = "" + editor.body.style.height;
                        editor.body.style.height = "100%";
                    }
                },
                "mouseout dragleave drop contextmenu": function(e) {
                    var restoreHeight = function() {
                        if (editor._cachedHeight !== undefined$1 && e.target === editor.body) {
                            editor.body.style.height = editor._cachedHeight;
                            delete editor._cachedHeight;
                        }
                    };

                    if (e.type === "contextmenu") {
                        setTimeout(function() {
                            restoreHeight();
                        }, 10);
                    } else {
                        restoreHeight();
                    }

                }
            });

            this._registerHandler(editor.body, {
                "keydown": function(e) {
                    var range;

                    if ((e.keyCode === keys.BACKSPACE || e.keyCode === keys.DELETE) && editor.body.getAttribute("contenteditable") !== "true") {
                        return false;
                    }

                    if (e.keyCode === keys.F10) {
                        editor.toolbar.element.find("[tabindex=0]").first().trigger("focus");
                        editor.toolbar.preventPopupHide = true;
                        e.preventDefault();
                        return;
                    } else if (e.keyCode == keys.LEFT || e.keyCode == keys.RIGHT) {
                        // skip bom nodes when navigating with arrows
                        range = editor.getRange();
                        var left = e.keyCode == keys.LEFT;
                        var container = range[left ? "startContainer" : "endContainer"];
                        var offset = range[left ? "startOffset" : "endOffset"];
                        var direction = left ? -1 : 1;

                        var next = offset + direction;
                        var nextChar = left ? next : offset;

                        if (container.nodeType == 3 && container.nodeValue[nextChar] == "\ufeff") {
                            range.setStart(container, next);
                            range.collapse(true);
                            editor.selectRange(range);
                        }
                    }

                    var tools = editor.tools;
                    var toolName = editor.keyboard.toolFromShortcut(tools, e);
                    var toolOptions = toolName ? tools[toolName].options : {};

                    if (toolName && !toolOptions.keyPressCommand) {
                        e.preventDefault();

                        if (!/^(undo|redo)$/.test(toolName)) {
                            editor.keyboard.endTyping(true);
                        }

                        editor.trigger("keydown", e);
                        editor.exec(toolName);
                        editor._runPostContentKeyCommands(e);

                        return false;
                    }

                    editor.keyboard.clearTimeout();

                    editor.keyboard.keydown(e);
                },
                "keypress": function(e) {
                    setTimeout(function() {
                        editor._runPostContentKeyCommands(e);
                        editor._showElementResizeHandles();
                    }, 0);
                },
                "keyup": function(e) {
                    var selectionCodes = [
                        keys.BACKSPACE,
                        keys.TAB,
                        keys.PAGEUP,
                        keys.PAGEDOWN,
                        keys.END,
                        keys.HOME,
                        keys.LEFT,
                        keys.UP,
                        keys.RIGHT,
                        keys.DOWN,
                        keys.INSERT,
                        keys.DELETE
                    ];

                    if ($.inArray(e.keyCode, selectionCodes) > -1 || (e.keyCode == 65 && e.ctrlKey && !e.altKey && !e.shiftKey)) {
                        window.clearTimeout(this._refreshInterval);
                        this._refreshInterval = window.setTimeout(function() {
                            editor._selectionChange();
                        }, REFRESH_INTERVAL);
                    }

                    if (e.keyCode === keys.BACKSPACE || e.keyCode === keys.DELETE) {
                        editor._handleSpaceAndNewLines();
                    }

                    editor.keyboard.keyup(e);
                },
                "click": function(e) {
                    var dom = kendo.ui.editor.Dom, range;

                    if (dom.name(e.target) === "img") {
                        range = editor.createRange();
                        range.selectNode(e.target);
                        editor.selectRange(range);
                    }
                },
                "cut copy paste drop dragover": function(e) {
                    editor.clipboard["on" + e.type](e);
                    editor._handleSpaceAndNewLines();
                },
                "focusin": function() {
                    if (editor.body.hasAttribute("contenteditable")) {
                        $(this).addClass("k-active");
                        // To be moved to the Editor
                        editor._showWindow();
                        editor._togglePlaceholder(false);
                    }
                },
                "focusout": function() {
                    setTimeout(function() {
                        var active = kendo._activeElement();
                        var body = editor.body;
                        // All below to be moved to the Editor
                        var toolbar = editor.toolbar;

                        if (toolbar.options.popup) {
                            var toolbarContainerElement = editor.windowInstance.element.get(0);
                            if (toolbarContainerElement && !($.contains(toolbarContainerElement, active) || toolbarContainerElement == active)) {
                                toolbar.preventPopupHide = false;
                            }
                        }

                        if (active != body && !$.contains(body, active) && !editor._toolbarFocused() && !toolbar.preventPopupHide && !$(active).hasClass("k-context-menu") && !$(active).hasClass("k-colorpalette")) {
                            $(body).removeClass("k-active");
                            editor._hideWindow();
                        }

                        editor._togglePlaceholder(!editor.value().trim());
                    }, 10);
                }
            });

            editor._initializeColumnResizing();
            editor._initializeRowResizing();
            editor._initializeElementResizing();
        },

        _initializeImmutables: function() {
            var that = this,
                editorNS = kendo.ui.editor;

            if (that.options.immutables) {
                that.immutables = new editorNS.Immutables(that);
            }
        },

        _initializePlaceholder: function() {
            var that = this,
                placeholder = that.options.placeholder,
                style, $head;

            if (!that.textarea || !placeholder) {
                return;
            }

            style = `<style id='${PLACEHOLDER_TAG_ID}' ${that.options.nonce ? `nonce="${that.options.nonce}"` : ""} >.` +
                PLACEHOLDER_CLASS + ":before { content: '" + placeholder + "'; }" +
                "</style>";

            $head = $(that.document.head);
            $head.find("#" + PLACEHOLDER_TAG_ID).remove();
            $head.append(style);

            that._togglePlaceholder(!that.value().trim());
        },

        _initToolbar: function(toolbarContainer) {
            var that = this,
                tools, defaults, toolbarOptions;

            that.tools = [];
            [tools, defaults] = that._processToolbarItems(that.options.tools);
            that._setNativeTools();

            toolbarOptions = {
                tools: tools,
                defaultTools: defaults,
                parentMessages: that.options.messages,
                resizable: that.options.resizable === true || Boolean(that.options.resizable && that.options.resizable.toolbar && that.options.resizable.toolbar?.mode !== "none"),
                toggle: that._handleToolbarClick.bind(this),
                click: that._handleToolbarClick.bind(this),
                navigateOnTab: that.options.navigateOnTab,
                evaluateTemplates: true,
                overflow: $.isPlainObject(that.options.resizable?.toolbar) ? that.options.resizable.toolbar : undefined$1,
            };

            that.toolbar = new kendo.ui.ToolBar(toolbarContainer, toolbarOptions);

            that._bindTools();
            that.bind("select", that._refreshTools.bind(that));

            toolbarContainer.on("mousedown" + NS, function(e) {
                const target = $(e.target);
                const tool = target.closest('[ref-toolbar-tool]');

                if (!tool.length || !tool.data("command")) {
                    return;
                }

                if (tool.length) {
                    if (!target.is("input")) {
                        e.preventDefault();
                    }
                } else {
                    e.preventDefault();
                }
            });

            if (!that.textarea) {
                const toolbarWidth = toolbarContainer.width();
                if (toolbarWidth && toolbarWidth > 0) {
                    toolbarContainer.width(toolbarWidth);
                }

                that._initToolbarWindow(toolbarContainer);
            }
        },

        _initToolbarWindow: function(toolbarEl) {
            var that = this;

            this.windowInstance = toolbarEl
                .wrap("<div class='editorToolbarWindow k-editor-window' />")
                .parent()
                .prepend("<span class='k-editortoolbar-dragHandle'>" + kendo.ui.icon("handle-drag") + "</span>")
                .kendoWindow({
                    title: false,
                    resizable: false,
                    draggable: {
                        dragHandle: ".k-editortoolbar-dragHandle"
                    },
                    animation: {
                        open: { effects: "fade:in" },
                        close: { effects: "fade:out" }
                    },
                    minHeight: 42,
                    visible: false,
                    autoFocus: false,
                    actions: [],
                    dragend: function() {
                        this._moved = true;
                    }
                })
                .on("mousedown", function(e) {
                    if (!$(e.target).is(TOOLBAR_ALLOWED_CLOSE_SELECTORS)) {
                        that.toolbar.preventPopupHide = true;
                    }
                })
                .on("focusout", function() {
                    that.element.focusout();
                })
                .data("kendoWindow");
        },

        _mousedown: function(e) {
            var editor = this;
            editor._selectionStarted = true;

            if ($(editor.body).parents('.k-window').length) {
                e.stopPropagation();
            }

            // handle middle-click and ctrl-click on links
            if (browser.gecko) {
                return;
            }

            var target = $(e.target).closest("a[href]");

            if ((e.which == 2 || (e.which == 1 && e.ctrlKey)) && target && target.is("a[href]")) {
                window.open(target.attr("href"), "_new");
            }

            if (e.target.tagName && e.target.tagName.toLowerCase() === "html") {
                setTimeout(function() {
                    editor.body.focus();
                }, 0);
            }
        },

        _mouseup: function(e) {
            var that = this;

            if (kendo.support.mobileOS.ios && e && $(e.target).is(SELECT_OVERLAY_SELECTOR)) {
                return;
            }

            if (that._selectionStarted) {
                setTimeout(function() {
                    that._selectionChange();
                }, 1);
            }
        },

        _populateValue: function(options, domElement) {
            var that = this,
                editorNS = kendo.ui.editor,
                dom = editorNS.Dom,
                value, comments;

            if (options && options.value) {
                value = options.value;
            } else if (that.textarea) {
                // indented HTML introduces problematic ranges in IE
                value = domElement.value;

                if (!value.replace(/\s/g, '').length) {
                    value = value.replace(/\s/g, '');
                }

                // revert encoding of value when content is fetched from cache
                if (that.options.encoded && domElement.defaultValue && domElement.defaultValue.trim().length) {
                    value = domElement.defaultValue;
                }

                var deserializedRoot = editorNS.Serializer.htmlToDom(value, $("<div></div>")[0], that.options.deserialization);
                comments = dom.getAllComments(deserializedRoot);
                value = EditorUtils.cacheComments(value, comments);
                value = value.replace(/[\r\n\v\f\t ]+/ig, " ");
                value = EditorUtils.retrieveComments(value, comments);
            } else {
                value = domElement.innerHTML;
            }

            that.value(value || '\ufeff');
        },

        _resetGroups: function(current) {
            var result = {};

            Object.keys(current).map(key => {
                result[key + "_"] = current[key];
            });

            return result;
        },

        _processToolbarItems: function(optionsTools) {
            var flatDefaultTools = {},
                processedObject = {},
                tools = [],
                currentGroups = $.extend(true, {}, toolGroups),
                i, j, t, name, guidGroupName;

            for (i = 0; i < optionsTools.length; i++) {
                t = optionsTools[i];

                if (Array.isArray(t)) {
                    guidGroupName = kendo.guid();

                    for (j = 0; j < t.length; j++) {
                        [flatDefaultTools, name] = this._processToolOptions(t[j], flatDefaultTools);

                        if (!name) {
                            continue;
                        }

                        flatDefaultTools[name].gr = guidGroupName;
                    }
                } else {
                    [flatDefaultTools, name] = this._processToolOptions(t, flatDefaultTools);

                    if (!name) {
                        continue;
                    } else if (name === "separator") {
                        currentGroups = this._resetGroups(currentGroups);
                    }

                    Object.keys(currentGroups).map(key => {
                        var group = currentGroups[key];

                        if (group.includes(name)) {
                            flatDefaultTools[name].gr = key;
                        }
                    });
                }
            }

            Object.values(flatDefaultTools).map((tool) => {
                var group = tool.gr;

                delete tool.gr;

                if (group === undefined$1) {
                    processedObject[tool.name] = tool;
                } else {
                    if (!processedObject[group]) {
                        processedObject[group] = [];
                    }

                    processedObject[group].push(tool);
                }
            });

            tools = Object.values(processedObject).map((g) => {
                var result;

                if (g.length) {
                    result = g.map((to) => to.name);
                } else {
                    result = g.name;
                }

                if (result.length === 1) {
                    result = result[0];
                }

                return result;
            });

            return [tools, flatDefaultTools];
        },

        _processDefaultTool: function(tool, defaultTools) {
            var name = tool.name,
                result = {},
                options;

            if ($.isPlainObject(tool)) {
                if (name && defaultTools[name]) {
                    // configured tool
                    result = extend({}, defaultTools[name]);
                    extend(result.options, tool);
                } else {
                    // custom tool
                    options = extend({ icon: "gear", type: "button" }, tool);

                    if (!options.name) {
                        options.name = "custom";
                    }

                    options.cssClass = "k-" + options.name;

                    result = {
                        options: options
                    };

                    name = options.name;
                }
            } else if (defaultTools[tool]) {
                name = tool;
                result = defaultTools[name];
            } else {
                return null;
            }

            this.tools[name] = result;

            return result;
        },

        _processToolOptions: function(t, flatDefaultTools) {
            var that = this,
                defaultTools = kendo.deepExtend({}, kendo.ui.Editor.defaultTools),
                tool, name, view, shortcuts, options, uiOptions, icon, toolOptions, originalOptions, palette;

            tool = this._processDefaultTool(t, defaultTools);

            if (!tool) {
                return [flatDefaultTools, null];
            }

            options = tool.options;
            name = options.name;
            uiOptions = options.ui || {};
            icon = EditorUtils.getToolCssClass(options.name, options.icon);

            // We want to preserve any custom properties from the original tool object.
            originalOptions = $.isPlainObject(t) ? $.extend({}, t) : {};
            delete originalOptions.items;

            toolOptions = $.extend({
                name: options.name,
                command: options.command,
                template: options.template,
                attributes: { class: options.cssClass },
                type: "button",
                icon: icon,
                showText: "overflow",
                showIcon: "both"
            }, uiOptions, originalOptions);

            if (options.tooltip) {
                if (!toolOptions.attributes) {
                    toolOptions.attributes = {};
                }

                toolOptions.attributes.title = options.tooltip;
            }
            if (options.exec) {
                toolOptions.click = options.exec.bind(that);
                delete toolOptions.exec;
            }

            if (toolOptions.component === "ColorPicker") {
                if (options.palette !== undefined$1 || uiOptions.palette !== kendo.ui.editor.ColorTool.fn.options.palette) {
                    palette = options.palette || kendo.ui.editor.ColorTool.fn.options.palette;
                    view = options.palette !== undefined$1 && !options.palette ? "gradient" : "palette";
                    toolOptions.componentOptions.palette = view === "palette" ? palette : undefined$1;
                    toolOptions.componentOptions.views = [view];
                    toolOptions.componentOptions.preview = view === "gradient";
                    toolOptions.componentOptions.input = view === "gradient";
                    toolOptions.componentOptions.buttons = view === "gradient";

                    if (view === "gradient") {
                        delete toolOptions.componentOptions.columns;
                    }
                }
                if (view === "palette" && options.columns) {
                    toolOptions.componentOptions.columns = options.columns;
                }
            }

            if (toolOptions.component === "DropDownList" || toolOptions.component === "ComboBox") {
                if (!toolOptions.componentOptions) {
                    toolOptions.componentOptions = {};
                }

                if (!toolOptions.componentOptions.dataSource) {
                    if (that.options[name] && Array.isArray(that.options[name])) {
                        toolOptions.componentOptions.dataSource = that.options[name];
                    } else {
                        toolOptions.componentOptions.dataSource = options.items;
                    }
                }
            }
            if (toolOptions.template) {
                delete toolOptions.type;
            }

            shortcuts = this._shortcutSequence(name);

            if (shortcuts !== "") {
                if (!toolOptions.attributes) {
                    toolOptions.attributes = {};
                }

                toolOptions.attributes["aria-keyshortcuts"] = shortcuts;
            }

            flatDefaultTools[name] = toolOptions;

            return [flatDefaultTools, name];
        },

        _refreshTools: function() {
            var that = this,
                range = that.getRange(),
                editorNS = kendo.ui.editor,
                rangeUtils = editorNS.RangeUtils,
                nodes = rangeUtils.textNodes(range),
                immutables = that.options.immutables,
                immutablesContext = that._immutablesContext(range),
                defaultTools = that.tools;

            nodes = editorNS.Dom.filterBy(nodes, editorNS.Dom.htmlIndentSpace, true);

            if (!nodes.length) {
                nodes = [range.startContainer];
            }

            that.toolbar.element.find("[data-command]")
                .filter((i, el) => $(el).find("[data-command]").length === 0)
                .each(function() {
                    var toolName = this.getAttribute("data-command"),
                        tool = defaultTools[toolName],
                        ui;

                    if (tool) {
                        ui = $(this);

                        if (tool.update) {
                            tool.update(ui, nodes, that.undoRedoStack);
                        }

                        if (immutables) {
                            that._updateImmutablesState(tool, ui, immutablesContext);
                        }
                    }
                });
        },

        _registerHandler: function(element, type, handler) {
            var editor = this;
            var NS = ".kendoEditor";
            var eventNames;
            var i;

            element = $(element);

            if (!this._handlers) {
                this._handlers = [];
            }

            if (element.length) {
                if ($.isPlainObject(type)) {
                    for (var t in type) {
                        if (type.hasOwnProperty(t)) {
                            this._registerHandler(element, t, type[t]);
                        }
                    }
                } else {
                    //map the original event to handle interaction on mobile platforms
                    eventNames = kendo.applyEventMap(type).split(" ");

                    for (i = 0; i < eventNames.length; i++) {
                        editor._handlers.push({
                            element: element,
                            type: eventNames[i] + NS,
                            handler: handler
                        });

                        element.on(eventNames[i] + NS, handler);
                    }
                }
            }
        },

        _runPostContentKeyCommands: function(e) {
            const range = this.getRange();
            const tools = this.keyboard.toolsFromShortcut(this.tools, e);

            for (var i = 0; i < tools.length; i++) {
                var tool = tools[i];
                var o = tool.options;
                if (!o.keyPressCommand) {
                    continue;
                }

                var cmd = new o.command({ range: range });
                if (cmd.changesContent()) {
                    this.keyboard.endTyping(true);
                    this.exec(tool.name);
                }
            }

            this._wrapSingleTextNodeInParagraph();

            this._handleSpaceAndNewLines();
        },

        _wrapSingleTextNodeInParagraph: function() {
            const childNodes = this.body.childNodes;
            const dom = kendo.ui.editor.Dom;

            if (this.textarea) {
                return;
            }

            if (childNodes.length === 1 && childNodes[0].nodeType === dom.nodeTypes.TEXT_NODE) {
                dom.wrap(childNodes[0], this.document.createElement("p"));
            }
        },

        _handleSpaceAndNewLines: function() {
            const that = this,
                refreshDelay = that.options.formattingMarksRefreshDelay,
                editorNS = kendo.ui.editor,
                applyFormattingMarks = editorNS.applyFormattingMarks,
                clearFormattingMarksOverlay = editorNS.clearFormattingMarksOverlay;

            if (that._toggledFormattingMarks) {
                if (that._formattingMarksOverlay.children().length) {
                    clearFormattingMarksOverlay(that);
                }

                if (refreshDelay) {
                    clearTimeout(that._formattingMarksTimeout);
                    that._formattingMarksTimeout = setTimeout(() => applyFormattingMarks(that), refreshDelay);
                } else {
                    applyFormattingMarks(that);
                }

            }
        },

        _selectionChange: function() {
            this._selectionStarted = false;
            this.saveSelection();
            this.trigger("select", {});
        },

        _setOptionsTools: function(optionsTools) {
            var that = this,
                toolbar = that.toolbar,
                toolbarContainer = toolbar.element,
                tools, defaults, toolbarOptions;

            toolbar.destroy();
            toolbarContainer.empty();

            that.tools = [];
            [tools, defaults] = that._processToolbarItems(optionsTools);
            that._setNativeTools();

            toolbarOptions = {
                tools: tools,
                defaultTools: defaults,
                parentMessages: that.options.messages,
                resizable: that.options.resizable === true || Boolean(that.options.resizable && that.options.resizable.toolbar && that.options.resizable.toolbar?.mode !== "none"),
                toggle: that._handleToolbarClick.bind(this),
                click: that._handleToolbarClick.bind(this),
                overflow: $.isPlainObject(that.options.resizable?.toolbar) ? that.options.resizable.toolbar : undefined$1,
            };

            that.toolbar = new kendo.ui.ToolBar(toolbarContainer, toolbarOptions);

            that._bindTools();
        },

        _setNativeTools: function() {
            var defaultTools = kendo.deepExtend({}, kendo.ui.Editor.defaultTools),
                i;

            for (i = 0; i < NATIVE_TOOLS.length; i++) {
                if (!this.tools[NATIVE_TOOLS[i]]) {
                    this.tools[NATIVE_TOOLS[i]] = defaultTools[NATIVE_TOOLS[i]];
                }
            }
        },

        _setupHeight: function(type) {
            var that = this;

            if (type == "textarea") {
                setTimeout(function() {
                    var heightStyle = that.wrapper[0].style.height;
                    var expectedHeight = parseInt(heightStyle, 10);
                    var actualHeight = that.wrapper.height();
                    if (heightStyle.indexOf("px") > 0 && !isNaN(expectedHeight) && actualHeight > expectedHeight) {
                        that.wrapper.height(expectedHeight - (actualHeight - expectedHeight));
                    }
                });
            }
        },

        _setupKeyboard: function() {
            var that = this,
                editorNS = kendo.ui.editor;

            that.keyboard = new editorNS.Keyboard([
                new editorNS.BackspaceHandler(that),
                new editorNS.TypingHandler(that),
                new editorNS.SystemHandler(that),
                new editorNS.SelectAllHandler(that)
            ]);
        },

        _setupType: function(element) {
            var domElement = element[0],
                type = kendo.ui.editor.Dom.name(domElement),
                id = domElement.id,
                toolbarContainer;

            if (!id) {
                id = kendo.guid();
                domElement.setAttribute("id", id);
            }

            if (type == "textarea") {
                this._wrapTextarea();

                toolbarContainer = this.wrapper.find(".k-editor-toolbar");
                toolbarContainer.attr("aria-controls", id);
            } else {
                $(domElement).attr("contenteditable", true).addClass("k-editor k-editor-inline");
                toolbarContainer = $('<div class="k-editor-toolbar"/>').insertBefore(element);
            }

            return toolbarContainer;
        },

        _isInlineEditor: function() {
            return this.element.hasClass("k-editor-inline");
        },

        _shortcutSequence: function(name) {
            var tool = kendo.ui.Editor.defaultTools[name],
                res = "",
                options;

            if (!tool || !tool.options) {
                return res;
            }

            options = tool.options;

            if (options.ctrl) {
                res += "Ctrl+";
            }

            if (options.shift) {
                res += "Shift+";
            }

            if (options.alt) {
                res += "Alt+";
            }

            if (options.key) {
                res += options.key;
            }

            return res;
        },

        _spellCorrect: function(editor) {
            var beforeCorrection;
            var falseTrigger = false;

            this._registerHandler(editor.body, {
                "contextmenu": function() {
                    editor.one("select", function() {
                        beforeCorrection = null;
                    });

                    editor._spellCorrectTimeout = setTimeout(function() {
                        beforeCorrection = new kendo.ui.editor.RestorePoint(editor.getRange(), editor.body);
                        falseTrigger = false;
                    }, 10);
                },
                "input": function() {
                    if (!beforeCorrection) {
                        return;
                    }

                    if (kendo.support.browser.mozilla && !falseTrigger) {
                        falseTrigger = true;
                        return;
                    }

                    kendo.ui.editor._finishUpdate(editor, beforeCorrection);
                }
            });
        },

        _togglePlaceholder: function(show) {
            var that = this,
                body = that.body,
                $body = $(body),
                placeholder = that.options.placeholder;

            if (!that.textarea || !placeholder) {
                return;
            }

            $body.attr('aria-label', function() {
                return show ? placeholder : "";
            });

            $body.toggleClass(PLACEHOLDER_CLASS, show);
        },

        _toolbarFocused: function() {
            var active = kendo._activeElement(),
                popup = this.windowInstance,
                overflowPopup = this.overflowPopup;

            return (popup && $(active).closest(popup.wrapper).length) ||
                (overflowPopup && overflowPopup.visible());
        },

        _updateImmutablesState: function(tool, ui, immutablesContext) {
            let toolbar = this.toolbar,
                name = tool.name,
                overflowAnchor = toolbar.overflowAnchor,
                uiElement = ui.closest("[ref-toolbar-tool]"),
                trackImmutables = tool.options.trackImmutables,
                toolInOverflowMenuIsHidden = true,
                editorNS = kendo.ui.editor;

            if (trackImmutables === undefined$1) {
                trackImmutables = $.inArray(name, editorNS.Immutables.toolsToBeUpdated) > -1;
            }

            if (overflowAnchor && !overflowAnchor.hasClass("k-hidden")) {
                const overflowMenu = toolbar.overflowMenu,
                    toolInOverflowMenu = overflowMenu?.element.find(`[data-command="${tool.options.name}"]`);

                toolInOverflowMenuIsHidden = toolInOverflowMenu?.hasClass("k-hidden");
            }

            if (trackImmutables) {
                if (immutablesContext) {
                    toolbar.hide(uiElement);
                } else if (toolInOverflowMenuIsHidden) {
                    toolbar.show(uiElement);
                }
            }
        },

        _wrapTextarea: function() {
            var that = this,
                textarea = that.element,
                w = textarea[0].style.width,
                h = textarea[0].style.height,
                template = EditorUtils.editorWrapperTemplate(),
                editorWrap = $(template).insertBefore(textarea),
                editArea = editorWrap.find(".k-editable-area");

            editorWrap.css({
                "width": w,
                "height": h
            });

            textarea.attr("autocomplete", "off")
                .appendTo(editArea).addClass("k-content k-raw-content").css("display", "none");

            that.textarea = textarea;
            that.wrapper = editorWrap;
        },

        // Resizing methods
        _resizable: function() {
            let that = this;
            let resizable = this.options.resizable;
            let isResizable = $.isPlainObject(resizable) ? (resizable.content === undefined$1 || resizable.content === true) : resizable;
            let resizableMin = $.isPlainObject(resizable.min) ? resizable.min : { minHeight: resizable.min };
            let resizableMax = $.isPlainObject(resizable.max) ? resizable.max : { maxHeight: resizable.max };

            if (isResizable && this.textarea) {
                that.wrapper.addClass('k-editor-resizable');

                if (resizableMin.minHeight) {
                    that.wrapper.css("min-height", resizableMin.minHeight);
                }

                if (resizableMax.maxHeight) {
                    that.wrapper.css("max-height", resizableMax.maxHeight);
                }

                if (resizableMin.minWidth) {
                    that.wrapper.css("min-width", resizableMin.minWidth);
                }

                if (resizableMax.maxWidth) {
                    that.wrapper.css("max-width", resizableMax.maxWidth);
                }

                that.resizeObserver = new ResizeObserver(() => {
                    clearTimeout(that._resizeTimeOut);

                    that._resizeTimeOut = setTimeout(function() {
                        that.toolbar.resize();
                        that._handleSpaceAndNewLines();
                    }, 50);

                });
                that.resizeObserver.observe(that.wrapper[0]);
            }
        },

        _destroyResizings: function() {
            var editor = this;

            editor._destroyElementResizing();
            kendo.ui.editor.ElementResizingFactory.current.dispose(editor);
            editor._destroyRowResizing();
            kendo.ui.editor.RowResizing.dispose(editor);
            editor._destroyColumnResizing();
            kendo.ui.editor.ColumnResizing.dispose(editor);
        },

        _initializeElementResizing: function() {
            var editor = this;

            kendo.ui.editor.ElementResizingFactory.current.create(editor);

            editor._showElementResizeHandlesProxy = editor._showElementResizeHandles.bind(editor);
            editor.bind(SELECT, editor._showElementResizeHandlesProxy);
        },

        _destroyElementResizing: function() {
            var editor = this;
            var elementResizing = editor.elementResizing;

            if (elementResizing) {
                elementResizing.destroy();
                editor.elementResizing = null;
            }

            if (editor._showElementResizeHandlesProxy) {
                editor.unbind(SELECT, editor._showElementResizeHandlesProxy);
            }
        },

        _showElementResizeHandles: function() {
            var editor = this;
            var elementResizing = editor.elementResizing;

            if (elementResizing && elementResizing.element && elementResizing.element.parentNode) {
                elementResizing.showResizeHandles();
            } else if (elementResizing && (!elementResizing.element || !elementResizing.element.parentNode)) {
                editor._destroyElementResizing();
            }
        },

        _initializeColumnResizing: function() {
            kendo.ui.editor.ColumnResizing.create(this);
        },

        _destroyColumnResizing: function() {
            var editor = this;

            if (editor.columnResizing) {
                editor.columnResizing.destroy();
                editor.columnResizing = null;
            }
        },

        _initializeRowResizing: function() {
            kendo.ui.editor.RowResizing.create(this);
        },

        _destroyRowResizing: function() {
            var editor = this;

            if (editor.rowResizing) {
                editor.rowResizing.destroy();
                editor.rowResizing = null;
            }
        },

        // ToolBar Window methods
        _getWindowWidth: function() {
            var that = this,
                wrapper = that.windowInstance.wrapper,
                editorElement = that.element;

            return outerWidth(editorElement) - parseInt(wrapper.css("border-left-width"), 10) - parseInt(wrapper.css("border-right-width"), 10);
        },

        _hideWindow: function() {
            if (this.windowInstance) {
                this.windowInstance.close();
            }
        },

        _overlapsWindow: function(box) {
            var toolbarWrapper = this.windowInstance.wrapper,
                toolbarWrapperOffset = toolbarWrapper.offset(),
                toolbarWrapperLeft = toolbarWrapperOffset.left,
                toolbarWrapperTop = toolbarWrapperOffset.top,
                boxOffset = box.offset(),
                boxOffsetLeft = boxOffset.left,
                boxOffsetTop = boxOffset.top;

            return !(boxOffsetLeft + box.width() < toolbarWrapperLeft ||
                boxOffsetLeft > toolbarWrapperLeft + toolbarWrapper.width() ||
                boxOffsetTop + box.height() < toolbarWrapperTop ||
                boxOffsetTop > toolbarWrapperTop + toolbarWrapper.height());
        },

        _showWindow: function() {
            var that = this,
                windowInstance = that.windowInstance,
                wrapper, editorElement, editorOffset,
                browser = kendo.support.browser;

            if (windowInstance) {
                wrapper = windowInstance.wrapper;
                editorElement = that.element;

                if (!wrapper.is(":visible") || !that.windowInstance.options.visible) {

                    if (!wrapper[0].style.width) {
                        wrapper.width(this._getWindowWidth());
                    }

                    // track content position when other parts of page change
                    if (!windowInstance._moved) {
                        editorOffset = editorElement.offset();
                        wrapper.css({
                            top: Math.max(0, parseInt(editorOffset.top, 10) - outerHeight(wrapper) - parseInt(that.windowInstance.element.css("padding-bottom"), 10)),
                            left: Math.max(0, parseInt(editorOffset.left, 10))
                        });
                    }

                    if ((browser.msie || browser.edge) && that._overlapsWindow(editorElement)) {
                        setTimeout(function() {
                            windowInstance.open();
                        }, 0);
                    } else {
                        windowInstance.open();
                    }
                }
            }
        }
    });

    Editor.defaultTools = {};

    kendo.ui.plugin(Editor);

    var Tool = Class.extend({
        init: function(options) {
            this.options = options;
        },

        command: function(commandArguments) {
            return new this.options.command(commandArguments);
        },

        update: $.noop
    });

    Tool.exec = function(editor, name, value) {
        editor.exec(name, { value: value });
    };

    var UndoTool = Tool.extend({
        command: $.noop,
        update: function(ui, nodes, undoRedoStack) {
            var that = this,
                name = that.options.name,
                toolbar = ui.closest(".k-toolbar").data("kendoToolBar");

            switch (name) {
                case "undo":
                    toolbar.enable(ui, undoRedoStack.canUndo());
                    break;
                case "redo":
                    toolbar.enable(ui, undoRedoStack.canRedo());
                    break;
            }

            ui.removeAttr("disabled");
        }
    });

    EditorUtils.registerTool("separator", new Tool({ ui: { type: "separator" } }));
    EditorUtils.registerTool("undo", new UndoTool({ key: "Z", ctrl: true }));
    EditorUtils.registerTool("redo", new UndoTool({ key: "Y", ctrl: true }));

    // Exports ================================================================

    var emptyElementContent = '\ufeff';
    var emptyTableCellContent = emptyElementContent;

    if (browser.msie || browser.edge) {
        emptyTableCellContent = emptyElementContent = "&nbsp;";
    }

    extend(kendo.ui, {
        editor: {
            EditorUtils: EditorUtils,
            Tool: Tool,
            emptyElementContent: emptyElementContent,
            emptyTableCellContent: emptyTableCellContent
        }
    });

    if (kendo.PDFMixin) {
        kendo.PDFMixin.extend(Editor.prototype);
        Editor.prototype._drawPDF = function() {
            return kendo.drawing.drawDOM(this.body, this.options.pdf);
        };
        Editor.prototype.saveAsPDF = function() {
            var progress = new $.Deferred();
            var promise = progress.promise();
            var args = { promise: promise };

            if (this.trigger("pdfExport", args)) {
                return;
            }

            var options = this.options.pdf;

            this._drawPDF(progress)
                .then(function(root) {
                    return kendo.drawing.exportPDF(root, options);
                })
                .done(function(dataURI) {
                    kendo.saveAs({
                        dataURI: dataURI,
                        fileName: options.fileName,
                        proxyURL: options.proxyURL,
                        proxyTarget: options.proxyTarget,
                        forceProxy: options.forceProxy
                    });
                    progress.resolve();
                })
                .fail(function(err) {
                    progress.reject(err);
                });

            return promise;
        };
    }

})(window.kendo.jQuery);

(function($) {

var kendo = window.kendo,
    map = $.map,
    extend = $.extend,
    browser = kendo.support.browser,
    STYLE = "style",
    FLOAT = "float",
    CSSFLOAT = "cssFloat",
    STYLEFLOAT = "styleFloat",
    CLASS = "class",
    KMARKER = "k-marker";

function makeMap(items) {
    var obj = {},
        i, len;

    for (i = 0, len = items.length; i < len; i++) {
        obj[items[i]] = true;
    }
    return obj;
}

var empty = makeMap("area,base,basefont,br,col,frame,hr,img,input,isindex,link,meta,param,embed".split(",")),
    nonListBlockElements = "p,div,h1,h2,h3,h4,h5,h6,address,applet,blockquote,button,center,dd,dir,dl,dt,fieldset,form,frameset,hr,iframe,isindex,map,menu,noframes,noscript,object,pre,script,table,tbody,td,tfoot,th,thead,tr,header,article,nav,footer,section,aside,main,figure,figcaption".split(","),
    blockElements = nonListBlockElements.concat(["ul","ol","li"]),
    block = makeMap(blockElements),
    selfClosing = makeMap("area,base,br,col,command,embed,hr,img,input,keygen,link,menuitem,meta,param,source,track,wbr".split(",")),
    inlineElements = "span,em,a,abbr,acronym,applet,b,basefont,bdo,big,br,button,cite,code,del,dfn,font,i,iframe,img,input,ins,kbd,label,map,object,q,s,samp,script,select,small,strike,strong,sub,sup,textarea,tt,u,var,data,time,mark,ruby".split(","),
    inline = makeMap(inlineElements),
    fillAttrs = makeMap("checked,compact,declare,defer,disabled,ismap,multiple,nohref,noresize,noshade,nowrap,readonly,selected".split(",")),
    nonEmptyNonTextContentElements = ["hgroup","ol","ul","dl","object","video","audio","table","colgroup","tbody","thead","tfoot","tr","select","optgroup"];

var normalize = function(node) {
    if (node.nodeType == 1) {
        node.normalize();
    }
};

if (browser.msie && browser.version >= 8) {
    normalize = function(parent) {
        if (parent.nodeType == 1 && parent.firstChild) {
            var prev = parent.firstChild,
                node = prev;

            normalize(node);

            while (true) {
                node = node.nextSibling;

                if (!node) {
                    break;
                }

                normalize(node);

                if (node.nodeType == 3 && prev.nodeType == 3) {
                    node.nodeValue = prev.nodeValue + node.nodeValue;
                    Dom.remove(prev);
                }

                prev = node;
            }
        }
    };
}

var whitespace = /^\s+$/,
    emptyspace = /^[\n\r\t]+$/,
    rgb = /rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i,
    bom = /\ufeff/g,
    whitespaceOrBom = /^(\s+|\ufeff)$/,
    persistedScrollTop,
    cssAttributes =
           ("color,padding-left,padding-right,padding-top,padding-bottom," +
            "background-color,background-attachment,background-image,background-position,background-repeat," +
            "border-top-style,border-top-width,border-top-color," +
            "border-bottom-style,border-bottom-width,border-bottom-color," +
            "border-left-style,border-left-width,border-left-color," +
            "border-right-style,border-right-width,border-right-color," +
            "font-family,font-size,font-style,font-variant,font-weight,line-height"
           ).split(","),
    htmlRe = /[<>&]/g,
    entityRe = /[\u00A0-\u2666<>&]/g,
    entityTable = {
            34: 'quot', 38: 'amp', 39: 'apos', 60: 'lt', 62: 'gt',
            160: 'nbsp', 161: 'iexcl', 162: 'cent', 163: 'pound', 164: 'curren',
            165: 'yen', 166: 'brvbar', 167: 'sect', 168: 'uml', 169: 'copy',
            170: 'ordf', 171: 'laquo', 172: 'not', 173: 'shy', 174: 'reg',
            175: 'macr', 176: 'deg', 177: 'plusmn', 178: 'sup2', 179: 'sup3',
            180: 'acute', 181: 'micro', 182: 'para', 183: 'middot', 184: 'cedil',
            185: 'sup1', 186: 'ordm', 187: 'raquo', 188: 'frac14', 189: 'frac12',
            190: 'frac34', 191: 'iquest', 192: 'Agrave', 193: 'Aacute', 194: 'Acirc',
            195: 'Atilde', 196: 'Auml', 197: 'Aring', 198: 'AElig', 199: 'Ccedil',
            200: 'Egrave', 201: 'Eacute', 202: 'Ecirc', 203: 'Euml', 204: 'Igrave',
            205: 'Iacute', 206: 'Icirc', 207: 'Iuml', 208: 'ETH', 209: 'Ntilde',
            210: 'Ograve', 211: 'Oacute', 212: 'Ocirc', 213: 'Otilde', 214: 'Ouml',
            215: 'times', 216: 'Oslash', 217: 'Ugrave', 218: 'Uacute', 219: 'Ucirc',
            220: 'Uuml', 221: 'Yacute', 222: 'THORN', 223: 'szlig', 224: 'agrave',
            225: 'aacute', 226: 'acirc', 227: 'atilde', 228: 'auml', 229: 'aring',
            230: 'aelig', 231: 'ccedil', 232: 'egrave', 233: 'eacute', 234: 'ecirc',
            235: 'euml', 236: 'igrave', 237: 'iacute', 238: 'icirc', 239: 'iuml',
            240: 'eth', 241: 'ntilde', 242: 'ograve', 243: 'oacute', 244: 'ocirc',
            245: 'otilde', 246: 'ouml', 247: 'divide', 248: 'oslash', 249: 'ugrave',
            250: 'uacute', 251: 'ucirc', 252: 'uuml', 253: 'yacute', 254: 'thorn',
            255: 'yuml', 402: 'fnof', 913: 'Alpha', 914: 'Beta', 915: 'Gamma',
            916: 'Delta', 917: 'Epsilon', 918: 'Zeta', 919: 'Eta', 920: 'Theta',
            921: 'Iota', 922: 'Kappa', 923: 'Lambda', 924: 'Mu', 925: 'Nu',
            926: 'Xi', 927: 'Omicron', 928: 'Pi', 929: 'Rho', 931: 'Sigma',
            932: 'Tau', 933: 'Upsilon', 934: 'Phi', 935: 'Chi', 936: 'Psi',
            937: 'Omega', 945: 'alpha', 946: 'beta', 947: 'gamma', 948: 'delta',
            949: 'epsilon', 950: 'zeta', 951: 'eta', 952: 'theta', 953: 'iota',
            954: 'kappa', 955: 'lambda', 956: 'mu', 957: 'nu', 958: 'xi',
            959: 'omicron', 960: 'pi', 961: 'rho', 962: 'sigmaf', 963: 'sigma',
            964: 'tau', 965: 'upsilon', 966: 'phi', 967: 'chi', 968: 'psi',
            969: 'omega', 977: 'thetasym', 978: 'upsih', 982: 'piv', 8226: 'bull',
            8230: 'hellip', 8242: 'prime', 8243: 'Prime', 8254: 'oline', 8260: 'frasl',
            8472: 'weierp', 8465: 'image', 8476: 'real', 8482: 'trade', 8501: 'alefsym',
            8592: 'larr', 8593: 'uarr', 8594: 'rarr', 8595: 'darr', 8596: 'harr',
            8629: 'crarr', 8656: 'lArr', 8657: 'uArr', 8658: 'rArr', 8659: 'dArr',
            8660: 'hArr', 8704: 'forall', 8706: 'part', 8707: 'exist', 8709: 'empty',
            8711: 'nabla', 8712: 'isin', 8713: 'notin', 8715: 'ni', 8719: 'prod',
            8721: 'sum', 8722: 'minus', 8727: 'lowast', 8730: 'radic', 8733: 'prop',
            8734: 'infin', 8736: 'ang', 8743: 'and', 8744: 'or', 8745: 'cap',
            8746: 'cup', 8747: 'int', 8756: 'there4', 8764: 'sim', 8773: 'cong',
            8776: 'asymp', 8800: 'ne', 8801: 'equiv', 8804: 'le', 8805: 'ge',
            8834: 'sub', 8835: 'sup', 8836: 'nsub', 8838: 'sube', 8839: 'supe',
            8853: 'oplus', 8855: 'otimes', 8869: 'perp', 8901: 'sdot', 8968: 'lceil',
            8969: 'rceil', 8970: 'lfloor', 8971: 'rfloor', 9001: 'lang', 9002: 'rang',
            9674: 'loz', 9824: 'spades', 9827: 'clubs', 9829: 'hearts', 9830: 'diams',
            338: 'OElig', 339: 'oelig', 352: 'Scaron', 353: 'scaron', 376: 'Yuml',
            710: 'circ', 732: 'tilde', 8194: 'ensp', 8195: 'emsp', 8201: 'thinsp',
            8204: 'zwnj', 8205: 'zwj', 8206: 'lrm', 8207: 'rlm', 8211: 'ndash',
            8212: 'mdash', 8216: 'lsquo', 8217: 'rsquo', 8218: 'sbquo', 8220: 'ldquo',
            8221: 'rdquo', 8222: 'bdquo', 8224: 'dagger', 8225: 'Dagger', 8240: 'permil',
            8249: 'lsaquo', 8250: 'rsaquo', 8364: 'euro'
        };

var Dom = {
    block: block,
    inline: inline,

    findNodeIndex: function(node, skipText) {
        var i = 0;

        if (!node) {
            return -1;
        }

        while (true) {
            node = node.previousSibling;

            if (!node) {
                break;
            }

            if (!(skipText && node.nodeType == 3)) {
                i++;
            }
        }

        return i;
    },

    isDataNode: function(node) {
        return node && node.nodeValue !== null && node.data !== null;
    },

    isAncestorOf: function(parent, node) {
        try {
            return !Dom.isDataNode(parent) && ($.contains(parent, Dom.isDataNode(node) ? node.parentNode : node) || node.parentNode == parent);
        } catch (e) {
            return false;
        }
    },

    isAncestorOrSelf: function(root, node) {
        return Dom.isAncestorOf(root, node) || root == node;
    },

    findClosestAncestor: function(root, node) {
        if (Dom.isAncestorOf(root, node)) {
            while (node && node.parentNode != root) {
                node = node.parentNode;
            }
        }

        return node;
    },

    getAllComments: function(rootElem) {
        var comments = [];
        // Fourth argument, which is actually obsolete according to the DOM4 standard, is required in IE 11
        var iterator = document.createNodeIterator(rootElem,
            NodeFilter.SHOW_COMMENT,
            function() {
                return NodeFilter.FILTER_ACCEPT;
            }, false);

        var curNode = iterator.nextNode();
        while (curNode) {
            comments.push(curNode.nodeValue);
            curNode = iterator.nextNode();
        }
        return comments;
    },

    getNodeLength: function(node) {
        return Dom.isDataNode(node) ? node.length : node.childNodes.length;
    },

    splitDataNode: function(node, offset) {
        var newNode = node.cloneNode(false);
        var denormalizedText = "";
        var iterator = node.nextSibling;
        var temp;

        while (iterator && iterator.nodeType == 3 && iterator.nodeValue) {
            denormalizedText += iterator.nodeValue;
            temp = iterator;
            iterator = iterator.nextSibling;
            Dom.remove(temp);
        }

        node.deleteData(offset, node.length);
        newNode.deleteData(0, offset);
        newNode.nodeValue += denormalizedText;
        Dom.insertAfter(newNode, node);
    },

    attrEquals: function(node, attributes) {
        for (var key in attributes) {
            var value = node[key];

            if (key == FLOAT) {
                value = node[kendo.support.cssFloat ? CSSFLOAT : STYLEFLOAT];
            }

            if (typeof value == "object") {
                if (!Dom.attrEquals(value, attributes[key])) {
                    return false;
                }
            } else if (value != attributes[key]) {
                return false;
            }
        }

        return true;
    },

    blockParentOrBody: function(node) {
        return Dom.parentOfType(node, blockElements) || node.ownerDocument.body;
    },

    blockParents: function(nodes) {
        var blocks = [],
            i, len;

        for (i = 0, len = nodes.length; i < len; i++) {
            var block = Dom.parentOfType(nodes[i], Dom.blockElements);
            if (block && $.inArray(block, blocks) < 0) {
                blocks.push(block);
            }
        }

        return blocks;
    },

    windowFromDocument: function(document) {
        return document.defaultView || document.parentWindow;
    },

    normalize: normalize,
    blockElements: blockElements,
    nonListBlockElements: nonListBlockElements,
    inlineElements: inlineElements,
    empty: empty,
    fillAttrs: fillAttrs,
    nodeTypes: {
        ELEMENT_NODE: 1,
        ATTRIBUTE_NODE: 2,
        TEXT_NODE: 3,
        CDATA_SECTION_NODE: 4,
        ENTITY_REFERENCE_NODE: 5,
        ENTITY_NODE: 6,
        PROCESSING_INSTRUCTION_NODE: 7,
        COMMENT_NODE: 8,
        DOCUMENT_NODE: 9,
        DOCUMENT_TYPE_NODE: 10,
        DOCUMENT_FRAGMENT_NODE: 11,
        NOTATION_NODE: 12
    },

    toHex: function(color) {
        var matches = rgb.exec(color);

        if (!matches) {
            return color;
        }

        return "#" + map(matches.slice(1), function(x) {
            x = parseInt(x, 10).toString(16);
            return x.length > 1 ? x : "0" + x;
        }).join("");
    },

    encode: function(value, options) {
        var encodableChars = (!options || options.entities) ? entityRe : htmlRe;
        return value.replace(encodableChars, function(c) {
            var charCode = c.charCodeAt(0);
            var entity = entityTable[charCode];
            return entity ? '&' + entity + ';' : c;
        });
    },
    isBom: function(node) {
        return node && node.nodeType === 3 && /^[\ufeff]+$/.test(node.nodeValue);
    },
    stripBom: function(text) {
        return (text || "").replace(bom, "");
    },

    stripBomNode: function(node) {
        if (Dom.isBom(node)) {
            node.parentNode.removeChild(node);
        }
    },

    insignificant: function(node) {
        var attr = node.attributes;

        return node.className == "k-marker" || (Dom.is(node, 'br') && (node.className == "k-br" || attr._moz_dirty || attr._moz_editor_bogus_node)) || (Dom.is(node, 'span') && (node.className == "k-br"));
    },
    tableCell: function(node) {
        return Dom.is(node, "td") || Dom.is(node, "th");
    },
    significantNodes: function(nodes) {
        return $.grep(nodes, function(child) {
            var name = Dom.name(child);

            if (name == 'br' || Dom.insignificant(child) || Dom.emptyTextNode(child) || (child.nodeType == 1 && !empty[name] && Dom.emptyNode(child))) {
                return false;
            }
            return true;
        });
    },

    emptyTextNode: function(node) {
        return node && node.nodeType == 3 && whitespaceOrBom.test(node.nodeValue);
    },

    emptyNode: function(node) {
        return node.nodeType == 1 && !Dom.significantNodes(node.childNodes).length;
    },

    name: function(node) {
        return node.nodeName.toLowerCase();
    },

    significantChildNodes: function(node) {
        return $.grep(node.childNodes, function(child) {
            return child.nodeType != 3 || !Dom.isWhitespace(child);
        });
    },

    getTextNodes: function(body, nodes) {
        const childNodes = body.childNodes;
        nodes = nodes || [];

        for (const node of childNodes) {
            if (node.nodeType === this.nodeTypes.TEXT_NODE &&
                (blockElements.includes(Dom.name(node.parentNode)) ||
                inlineElements.includes(Dom.name(node.parentNode)) ||
                node.parentNode === body)) {
                nodes.push(node);
            } else if (node.nodeType === this.nodeTypes.ELEMENT_NODE) {
                this.getTextNodes(node, nodes);
            }
        }

        return nodes;
    },

    lastTextNode: function(node) {
        var result = null;

        if (node.nodeType == 3) {
            return node;
        }

        for (var child = node.lastChild; child; child = child.previousSibling) {
            result = Dom.lastTextNode(child);

            if (result) {
                return result;
            }
        }

        return result;
    },

    is: function(node, nodeName) {
        return node && Dom.name(node) == nodeName;
    },

    isMarker: function(node) {
        return node.className == KMARKER;
    },

    isWhitespace: function(node) {
        return whitespace.test(node.nodeValue);
    },

    allowsTextContent: function(node) {
        var result = true;

        nonEmptyNonTextContentElements.every(function(name) {
            if (Dom.is(node, name)) {
                result = false;
                return false;
            } else {
                return true;
            }
        });

        return result;
    },

    allWhitespaceContent: function(node) {
        var child = node.firstChild;
        while (child && Dom.isWhitespace(child)) {
            child = child.nextSibling;
        }

        return !child;
    },

    isEmptyspace: function(node) {
        return emptyspace.test(node.nodeValue);
    },

    htmlIndentSpace: function(node) {
        if (!(Dom.isDataNode(node) && Dom.isWhitespace(node))) {
            return false;
        }

        if (emptyspace.test(node.nodeValue)) {
            return true;
        }

        var sibling = function(el, direction) {
            while (el[direction]) {
                el = el[direction];
                if (Dom.significantNodes([el]).length > 0) {
                    return el;
                }
            }
        };

        var parent = node.parentNode;
        var prev = sibling(node, "previousSibling");
        var next = sibling(node, "nextSibling");

        if (bom.test(node.nodeValue)) {
            return !!(prev || next);
        }

        if ($(parent).is("tr,tbody,thead,tfoot,table,ol,ul")) {
            return true;
        }

        if (Dom.isBlock(parent) || Dom.is(parent, "body")) {
            var isPrevBlock = prev && Dom.isBlock(prev);
            var isNextBlock = next && Dom.isBlock(next);
            if ((!next && isPrevBlock) || (!prev && isNextBlock) || (isPrevBlock && isNextBlock)) {
                return true;
            }
        }

        return false;
    },

    isBlock: function(node) {
        return block[Dom.name(node)];
    },

    isSelfClosing: function(node) {
        return selfClosing[Dom.name(node)];
    },

    isEmpty: function(node) {
        return empty[Dom.name(node)];
    },

    isInline: function(node) {
        return inline[Dom.name(node)];
    },

    isImg: function(node) {
        return Dom.name(node) == "img";
    },

    isBr: function(node) {
        return Dom.name(node) == "br";
    },

    list: function(node) {
        var name = node ? Dom.name(node) : "";
        return name == "ul" || name == "ol" || name == "dl";
    },

    scrollContainer: function(doc) {
        var wnd = Dom.windowFromDocument(doc),
            scrollContainer = (wnd.contentWindow || wnd).document || wnd.ownerDocument || wnd;

        if (scrollContainer.compatMode == 'BackCompat') {
            scrollContainer = scrollContainer.body;
        } else {
            scrollContainer = scrollContainer.scrollingElement || scrollContainer.documentElement;
        }

        return scrollContainer;
    },

    scrollTo: function(node, toStart) {
        var doc = node.ownerDocument;
        var wnd = Dom.windowFromDocument(doc);
        var windowHeight = wnd.innerHeight;
        var scrollContainer = Dom.scrollContainer(doc);
        var element, elementTop, elementHeight, marker;

        if (Dom.isDataNode(node)) {
            if (toStart) {
                marker = Dom.create(doc, "span", { "innerHTML": "&#xfeff;" });
                Dom.insertBefore(marker, node);
                element = $(marker);
            } else {
                element = $(node.parentNode);
            }
        } else {
            element = $(node);
        }

        elementTop = element.offset().top;
        elementHeight = element[0].offsetHeight;

        if (toStart || !elementHeight) {
            elementHeight = parseInt(element.css("line-height"), 10) ||
                            Math.ceil(1.2 * parseInt(element.css("font-size"), 10)) ||
                            15;
        }

        if (marker) {
            Dom.remove(marker);
        }

        if (elementHeight + elementTop > scrollContainer.scrollTop + windowHeight) {
            scrollContainer.scrollTop = elementHeight + elementTop - windowHeight;
        }
    },

    persistScrollTop: function(doc) {
        persistedScrollTop = Dom.scrollContainer(doc).scrollTop;
    },

    offset: function(target, offsetParent) {
        var result = { top: target.offsetTop, left: target.offsetLeft };
        var parent = target.offsetParent;

        while (parent && (!offsetParent || Dom.isAncestorOf(offsetParent, parent))) {
            result.top += parent.offsetTop;
            result.left += parent.offsetLeft;
            parent = parent.offsetParent;
        }

        return result;
    },

    restoreScrollTop: function(doc) {
        if (typeof persistedScrollTop == "number") {
            Dom.scrollContainer(doc).scrollTop = persistedScrollTop;
            persistedScrollTop = undefined;
        }
    },

    insertAt: function(parent, newElement, position) {
        parent.insertBefore(newElement, parent.childNodes[position] || null);
    },

    insertBefore: function(newElement, referenceElement) {
        if (referenceElement.parentNode) {
            return referenceElement.parentNode.insertBefore(newElement, referenceElement);
        } else {
            return referenceElement;
        }
    },

    insertAfter: function(newElement, referenceElement) {
        return referenceElement.parentNode.insertBefore(newElement, referenceElement.nextSibling);
    },

    remove: function(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    },

    removeChildren: function(node) {
        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }
    },

    removeTextSiblings: function(node) {
        var parentNode = node.parentNode;

        while (node.nextSibling && node.nextSibling.nodeType == 3) {
            parentNode.removeChild(node.nextSibling);
        }

        while (node.previousSibling && node.previousSibling.nodeType == 3) {
            parentNode.removeChild(node.previousSibling);
        }
    },

    trim: function(parent) {
        for (var i = parent.childNodes.length - 1; i >= 0; i--) {
            var node = parent.childNodes[i];
            if (Dom.isDataNode(node)) {
                if (!Dom.stripBom(node.nodeValue).length) {
                    Dom.remove(node);
                }
            } else if (node.className != KMARKER) {
                Dom.trim(node);

                if ((!Dom.isEmpty(node) && node.childNodes.length === 0) ||
                    (Dom.isBlock(node) && Dom.allWhitespaceContent(node))) {
                    Dom.remove(node);
                }
            }
        }

        return parent;
    },

    closest: function(node, tags) {
        if (typeof tags === "string") {
            tags = [tags];
        }

        while (node && tags.indexOf(Dom.name(node)) < 0) {
            node = node.parentNode;
        }

        return node;
    },

    closestBy: function(node, condition, rootCondition) {
        while (node && !condition(node)) {
            if (rootCondition && rootCondition(node)) {
                return null;
            }
            node = node.parentNode;
        }
        return node;
    },

    sibling: function(node, direction) {
        do {
            node = node[direction];
        } while (node && node.nodeType != 1);

        return node;
    },

    next: function(node) {
        return Dom.sibling(node, "nextSibling");
    },

    prev: function(node) {
        return Dom.sibling(node, "previousSibling");
    },

    parentOfType: function(node, tags) {
        do {
            node = node.parentNode;
        } while (node && !(Dom.ofType(node, tags)));

        return node;
    },

    ofType: function(node, tags) {
        return $.inArray(Dom.name(node), tags) >= 0;
    },

    changeTag: function(referenceElement, tagName, skipAttributes) {
        var newElement = Dom.create(referenceElement.ownerDocument, tagName),
            attributes = referenceElement.attributes,
            i, len, name, value, attribute;

        if (!skipAttributes) {
            for (i = 0, len = attributes.length; i < len; i++) {
                attribute = attributes[i];
                if (attribute.specified) {
                    // IE < 8 cannot set class or style via setAttribute
                    name = attribute.nodeName;
                    value = attribute.nodeValue;
                    if (name == CLASS) {
                        newElement.className = value;
                    } else if (name == STYLE) {
                        newElement.style.cssText = referenceElement.style.cssText;
                    } else {
                        newElement.setAttribute(name, value);
                    }
                }
            }
        }

        while (referenceElement.firstChild) {
            newElement.appendChild(referenceElement.firstChild);
        }

        Dom.insertBefore(newElement, referenceElement);
        Dom.remove(referenceElement);
        return newElement;
    },

    editableParent: function(node) {
        while (node && (node.nodeType == 3 || node.contentEditable !== 'true')) {
            node = node.parentNode;
        }

        return node;
    },

    wrap: function(node, wrapper) {
        Dom.insertBefore(wrapper, node);
        wrapper.appendChild(node);
        return wrapper;
    },

    unwrap: function(node) {
        var parent = node.parentNode;
        while (node.firstChild) {
            parent.insertBefore(node.firstChild, node);
        }

        parent.removeChild(node);
    },

    wrapper: function(node) {
        var wrapper = Dom.closestBy(node, function(el) {
            return el.parentNode && Dom.significantNodes(el.parentNode.childNodes).length > 1;
        });

        return $(wrapper).is("body,.k-editor") ? undefined : wrapper;
    },

    isChildOfBaseContainer: function(node) {
        return $(node).parent().is("body,.k-editor");
    },

    create: function(document, tagName, attributes) {
        return Dom.attr(document.createElement(tagName), attributes);
    },

    createEmptyNode: function(document, tagName, attributes) {
        var node = Dom.attr(document.createElement(tagName), attributes);
        node.innerHTML = "\ufeff";
        return node;
    },

    attr: function(element, attributes) {
        attributes = extend({}, attributes);

        if (attributes && STYLE in attributes) {
            Dom.style(element, attributes.style);
            delete attributes.style;
        }

        for (var attr in attributes) {
            if (attributes[attr] === null) {
                element.removeAttribute(attr);
                delete attributes[attr];
            } else if (attr == "className") {
                element[attr] = attributes[attr];
            }
        }

        return extend(element, attributes);
    },

    mergeAttributes: function(origin, target, traverseCss) {
        if (!origin.attributes.length) {
            return;
        }

        $.each(origin.attributes, function() {
            if (this.name !== "contenteditable" && (!traverseCss || this.name !== STYLE)) {
                $(target).attr(this.name, this.value);
            }

            if (traverseCss && this.name === STYLE) {
                $.each(origin.style, function() {
                    target.style[this] = origin.style[this];
                });
            }
        });
    },

    style: function(node, value) {
        $(node).css(value || {});
    },

    unstyle: function(node, value) {
        for (var key in value) {
            if (key == FLOAT) {
                node.style[kendo.support.cssFloat ? CSSFLOAT : STYLEFLOAT] = "";
            } else {
                node.style[key] = "";
            }
        }

        if (node.style.cssText === "") {
            node.removeAttribute(STYLE);
        }
    },

    inlineStyle: function(body, name, attributes) {
        var span = $(Dom.create(body.ownerDocument, name, attributes)),
            style;

        body.appendChild(span[0]);

        style = map(cssAttributes, function(value) {
            if (browser.msie && value == "line-height" && span.css(value) == "1px") {
                return "line-height:1.5";
            } else {
                return value + ":" + span.css(value);
            }
        }).join(";");

        span.remove();

        return style;
    },

    getEffectiveBackground: function(element) {
        var backgroundStyle = element.css("background-color") || "";

        if (backgroundStyle.indexOf("rgba(0, 0, 0, 0") < 0 && backgroundStyle !== "transparent") {
            return backgroundStyle;
        } else if (element[0].tagName.toLowerCase() === "html") {
            return "Window";
        } else {
            return Dom.getEffectiveBackground(element.parent());
        }
    },

    innerText: function(node) {
        var text = node.innerHTML;
        text = text.replace(/<!--(.|\s)*?-->/gi, "");
        text = text.replace(/<\/?[^>]+?\/?>/gm, "");

        return text;
    },

    removeClass: function(node, classNames) {
        var className = " " + node.className + " ",
            classes = classNames.split(" "),
            i, len;

        for (i = 0, len = classes.length; i < len; i++) {
            className = className.replace(" " + classes[i] + " ", " ");
        }

        className = kendo.trim(className);

        if (className.length) {
            node.className = className;
        } else {
            node.removeAttribute(CLASS);
        }
    },

    commonAncestor: function() {
        var count = arguments.length,
            paths = [],
            minPathLength = Infinity,
            output = null,
            i, ancestors, node, first, j;

        if (!count) {
            return null;
        }

        if (count == 1) {
            return arguments[0];
        }

        for (i = 0; i < count; i++) {
            ancestors = [];
            node = arguments[i];
            while (node) {
                ancestors.push(node);
                node = node.parentNode;
            }
            paths.push(ancestors.reverse());
            minPathLength = Math.min(minPathLength, ancestors.length);
        }

        if (count == 1) {
            return paths[0][0];
        }

        for (i = 0; i < minPathLength; i++) {
            first = paths[0][i];

            for (j = 1; j < count; j++) {
                if (first != paths[j][i]) {
                    return output;
                }
            }

            output = first;
        }
        return output;
    },

    closestSplittableParent: function(nodes) {
        var result;

        if (nodes.length == 1) {
            result = Dom.parentOfType(nodes[0], ["ul","ol"]);
        } else {
            result = Dom.commonAncestor.apply(null, nodes);
        }

        if (!result) {
            result = Dom.parentOfType(nodes[0], ["p", "td"]) || nodes[0].ownerDocument.body;
        }

        if (Dom.isInline(result)) {
            result = Dom.blockParentOrBody(result);
        }

        var editableParents = map(nodes, Dom.editableParent);
        var editableAncestor = Dom.commonAncestor(editableParents)[0];

        if ($.contains(result, editableAncestor)) {
            result = editableAncestor;
        }

        return result;
    },

    closestEditable: function(node, types) {
        var closest;
        var editable = Dom.editableParent(node);

        if (Dom.ofType(node, types)) {
            closest = node;
        } else {
            closest = Dom.parentOfType(node, types);
        }

        if ((closest && editable && $.contains(closest, editable)) || (!closest && editable)) {
            closest = editable;
        }

        return closest;
    },

    closestEditableOfType: function(node, types) {
        var editable = Dom.closestEditable(node, types);

        if (editable && Dom.ofType(editable, types) && !$(editable).is(".k-editor")) {
            return editable;
        }
    },

    filter: function(tagName, nodes, invert) {
        var filterFn = function(node) {
            return Dom.name(node) == tagName;
        };

        return Dom.filterBy(nodes, filterFn, invert);
    },

    filterBy: function(nodes, condition, invert) {
        var i = 0;
        var len = nodes.length;
        var result = [];
        var match;

        for (; i < len; i++) {
            match = condition(nodes[i]);
            if ((match && !invert) || (!match && invert)) {
                result.push(nodes[i]);
            }
        }

        return result;
    },

    ensureTrailingBreaks: function(node) {
        var elements = $(node).find("p,td,th");
        var length = elements.length;
        var i = 0;

        if (length) {
            for (; i < length; i++) {
                Dom.ensureTrailingBreak(elements[i]);
            }
        } else {
            Dom.ensureTrailingBreak(node);
        }
    },

    removeTrailingBreak: function(node) {
        $(node).find("br[type=_moz],.k-br").remove();
    },

    ensureTrailingBreak: function(node) {
        Dom.removeTrailingBreak(node);

        var lastChild = node.lastChild;
        var name = lastChild && Dom.name(lastChild);
        var br;

        if (!name ||
            (name != "br" && name != "img") ||
            (name == "br" && lastChild.className != "k-br")) {
            br = node.ownerDocument.createElement("br");
            br.className = "k-br";
            node.appendChild(br);
        }
    },

    // Start: Table Utilities

    reMapTableColumns: function(table, colAttr) {
        Dom._mapColIndices(table, colAttr);
    },

    clearTableMappings: function(table, colAttr) {
        $(table).find("[" + colAttr + "]").removeAttr(colAttr);
    },

    _mapColIndices: function(table, colAttr) {
        var registeredColumns = {};

        for (var rowIndex = 0; rowIndex < table.rows.length; rowIndex++) {
            var cells = table.rows[rowIndex].cells;
            var colIndex = 0;
            for (var cellIndex = 0; cellIndex < cells.length; cellIndex++) {
                var cell = cells[cellIndex];

                if (cell.rowSpan > 1) {
                    this._mapColspan(cell, rowIndex, colIndex, registeredColumns);
                }

                if (registeredColumns[rowIndex]) {
                    while (registeredColumns[rowIndex][colIndex]) {
                        colIndex++;
                    }
                }

                cell.setAttribute(colAttr, colIndex);

                if (cell.colSpan > 1) {
                    colIndex = colIndex + cell.colSpan - 1;
                }
                colIndex++;
            }
        }
    },

    _mapColspan: function(cell, rowIndex, colIndex, registeredColumns) {
        var rowSpan = cell.rowSpan,
            colSpan = cell.colSpan,
            index;

        for (var ci = 0; ci < colSpan; ci++) {
            index = colIndex + ci;

            for (var ri = rowIndex + 1; ri < rowIndex + rowSpan; ri++) {

                if (!registeredColumns[ri]) {
                    registeredColumns[ri] = {};
                    registeredColumns[ri].length = 0;
                }

                if (registeredColumns[rowIndex]) {
                    while (registeredColumns[rowIndex][index]) {
                        index++;
                    }
                }

                registeredColumns[ri][index] = true;
                registeredColumns[ri].length++;
            }
        }

    },

    associateWithIds: function(table) {
        var that = this;
        var numberOfTheadRows = 0;
        var tableRows = table.rows;
        var numberOfTableRows = tableRows.length;
        var theadMatrix = [];
        var tbodyMatrix = [];
        var theadRows, i;

        if (table.tHead) {
            theadRows = table.tHead.rows;
            numberOfTheadRows = theadRows.length;
        } else {
            numberOfTheadRows = that._getNumberOfHeaderRows(table);
            theadRows = [];
            for (i = 0; i < numberOfTheadRows; i++) {
                theadRows.push(tableRows[i]);
            }
        }
        for (i = 0; i < numberOfTheadRows; i++) {
            theadMatrix.push([]);
        }
        for (i = 0; i < numberOfTableRows; i++) {
            tbodyMatrix.push([]);
        }

        that._generateIdsForColumns(theadMatrix, theadRows);
        that._generateIdsForRows(theadMatrix, tbodyMatrix, numberOfTheadRows, tableRows);
        that._assignIds(theadMatrix, tbodyMatrix, numberOfTheadRows, tableRows);
    },

    _generateIdsForColumns: function(theadMatrix, theadRows) {
        var timestamp = new Date().getTime();
        var numberOfTheadRows = theadRows ? theadRows.length : 0;
        var row, cells, cell, col, id, colspan, rowspan, i, j, k, l;

        for (i = 0; i < numberOfTheadRows; i++) {
            row = theadRows[i];
            cells = row.cells;
            col = 0;

            for (j = 0; j < cells.length; j++) {
                cell = cells[j];
                id = "table" + i + j + (++timestamp);
                cell.setAttribute("id", id);
                colspan = cell.getAttribute("colspan") || 1;
                rowspan = cell.getAttribute("rowspan") || 1;

                while (theadMatrix[i][j + col]) {
                    col += 1;
                }

                for (k = 0; k < rowspan; k++) {
                    for (l = 0; l < colspan; l++) {
                        theadMatrix[i + k][j + col + l] = id;
                    }
                }
            }
        }
    },

    _generateIdsForRows: function(theadMatrix, tbodyMatrix, numberOfTheadRows, tableRows) {
        var that = this;
        var timestamp = new Date().getTime();
        var numberOfTableRows = tableRows.length;
        var row, cells, cell, col, id, colspan, rowspan, i, j, k, l, colIndex, headers;

        var pushHeaderId = function(row) {
            headers.push(row[colIndex]);
        };

        for (i = numberOfTheadRows; i < numberOfTableRows; i++) {
            row = tableRows[i];
            cells = $(row.cells).filter("th");
            col = 0;

            for (j = 0; j < cells.length; j++) {
                cell = cells[j];
                id = "table" + i + j + (++timestamp);
                cell.setAttribute("id", id);
                colspan = cell.getAttribute("colspan") || 1;
                rowspan = cell.getAttribute("rowspan") || 1;

                while (tbodyMatrix[i][j + col]) {
                    col += 1;
                }

                for (k = 0; k < rowspan; k++) {
                    for (l = 0; l < colspan; l++) {
                        tbodyMatrix[i + k][j + col + l] = id;
                    }
                }

                colIndex = cell.getAttribute("col-index");
                headers = [];
                theadMatrix.forEach(pushHeaderId);
                headers = headers.filter(that._onlyUnique);
                cell.setAttribute("headers", headers.join(" ").trim());
            }
        }
    },

    _assignIds: function(theadMatrix, tbodyMatrix, numberOfTheadRows, tableRows) {
        var that = this;
        var numberOfTableRows = tableRows.length;
        var row, cells, cell, i, j, colIndex, headers;

        var pushHeaderId = function(row) {
            headers.push(row[colIndex]);
        };

        for (i = numberOfTheadRows; i < numberOfTableRows; i++) {
            row = tableRows[i];
            cells = $(row.cells).filter("td");

            for (j = 0; j < cells.length; j++) {
                cell = cells[j];
                colIndex = cell.getAttribute("col-index");
                headers = tbodyMatrix[i].slice();

                theadMatrix.forEach(pushHeaderId);
                headers = headers.filter(that._onlyUnique);
                cell.setAttribute("headers", headers.join(" ").trim());
            }
        }
    },

    _getNumberOfColumns: function(table) {
        var cells = $(table).find("th, td");
        var numberOfCols = 0;
        var cell, i, currentIndex;

        for (i = 0; i < cells.length; i++) {
            cell = cells[i];
            currentIndex = Number(cell.getAttribute("col-index")) + 1;
            if (currentIndex > numberOfCols) {
                numberOfCols = currentIndex;
            }
        }

        return numberOfCols;
    },

    _getNumberOfHeaderColumns: function(table, numberOfHeaderRows) {
        var rows = table.rows;
        var numberOfCols = 0;
        var currentIndex, row, i, j, cell;

        for (i = numberOfHeaderRows; i < rows.length; i++) {
            row = rows[i];

            for (j = 0; j < row.cells.length; j++) {
                cell = row.cells[j];

                if (this.is(cell, "th")) {
                    currentIndex = Number(cell.getAttribute("col-index")) + 1;
                    if (currentIndex > numberOfCols) {
                        numberOfCols = currentIndex;
                    }
                }
            }
        }

        return numberOfCols;
    },

    _getNumberOfHeaderRows: function(table) {
        var rows = table.rows;
        var thead = table.tHead;
        var number = thead && table.tHead.rows ? table.tHead.rows.length : 0;
        var j, row, cell, length;

        if (number === 0) {
            row = rows[0];
            length = row.cells && row.cells.length;

            while (row && length && this.is(row.cells[0], "th")) {
                for (j = 0; j < length; j++) {
                    cell = row ? row.cells[j] : null;

                    if (!this.is(cell, "th")) {
                        row = null;
                    }
                }

                if (row) {
                    number += 1;
                    row = this.next(row);
                    length = row && row.cells && row.cells.length;
                }
            }
        }

        return number;
    },

    // End: Table Utilities

    _onlyUnique: function(value, index, self) {
        return self.indexOf(value) === index;
    }
};

kendo.ui.editor.Dom = Dom;

})(window.kendo.jQuery);

(function($, undefined$1) {

// Imports ================================================================
var kendo = window.kendo;
var Editor = kendo.ui.editor;
var dom = Editor.Dom;
var extend = $.extend;

var fontSizeMappings = 'xx-small,x-small,small,medium,large,x-large,xx-large'.split(',');
var quoteRe = /"/g; //"
var brRe = /<br[^>]*>/i;
var pixelRe = /^\d+(\.\d*)?(px)?$/i;
var emptyPRe = /<p>(?:&nbsp;)?<\/p>/i;
var cssDeclaration = /(\*?[-#\/\*\\\w]+(?:\[[0-9a-z_-]+\])?)\s*:\s*((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^\)]*?\)|[^};])+)/g;
var sizzleAttr = /^sizzle-\d+/i;
var scriptAttr = /^k-script-/i;
var onerrorRe = /\s*onerror\s*=\s*(?:'|")?([^'">\s]*)(?:'|")?/i;
var br = '<br class="k-br">';
var bomSpan = "<span class='k-br'>\ufeff</span>";

var div = document.createElement("div");
div.innerHTML = " <hr>";
var supportsLeadingWhitespace = div.firstChild.nodeType === 3;
div = null;
var isFunction = kendo.isFunction;

var TD = "td";

var Serializer = {
    toEditableHtml: function(html) {
        return (html || "")
            .replace(/<!\[CDATA\[(.*)?\]\]>/g, "<!--[CDATA[$1]]-->")
            .replace(/<(\/?)script([^>]*)>/ig, "<$1k:script$2>")
            .replace(/<img([^>]*)>/ig, function(match) {
                return match.replace(onerrorRe, "");
            })
            .replace(/(<\/?img[^>]*>)[\r\n\v\f\t ]+/ig, "$1")
            .replace(/^<(table|blockquote)/i, br + '<$1')
            .replace(/^[\s]*(&nbsp;|\u00a0)/i, '$1')
            .replace(/<\/(table|blockquote)>$/i, '</$1>' + br);
    },

    _toEditableImmutables: function(body) {
        var immutable = Editor.Immutables.immutable,
            emptyTextNode = dom.emptyTextNode,
            first = body.firstChild,
            last = body.lastChild;

        while (emptyTextNode(first)) {
            first = first.nextSibling;
        }

        while (emptyTextNode(last)) {
            last = last.previousSibling;
        }

        if (first && immutable(first)) {
            $(bomSpan).prependTo(body);
        }

        if (last && immutable(last)) {
            $(bomSpan).appendTo(body);
        }
    },

    _fillEmptyElements: function(body) {
        // fills empty elements to allow them to be focused
        $(body).find("p,td").each(function() {
            var p = $(this);
            if (/^\s*$/g.test(p.text()) && !p.find("img,input").length) {
                var node = this;
                while (node.children[0] && node.children[0].nodeType != 3) {
                    node = node.children[0];
                }

                if (node.nodeType == 1 && !dom.empty[dom.name(node)]) {
                    if (dom.is(node, "td")) {
                        node.innerHTML = kendo.ui.editor.emptyTableCellContent;
                    }
                    else {
                        node.innerHTML = kendo.ui.editor.emptyElementContent;
                    }
                }
            }
        });
    },

    _removeSystemElements: function(body) {
        // removes persisted system elements
        $(".k-paste-container", body).remove();
    },

    _resetOrderedLists: function(root) {
        // fix for IE9 OL bug -- https://connect.microsoft.com/IE/feedback/details/657695/ordered-list-numbering-changes-from-correct-to-0-0
        var ols = root.getElementsByTagName("ol"), i, ol, originalStart;

        for (i = 0; i < ols.length; i++) {
            ol = ols[i];
            originalStart = ol.getAttribute("start");

            ol.setAttribute("start", 1);

            if (originalStart) {
                ol.setAttribute("start", originalStart);
            } else {
                ol.removeAttribute(originalStart);
            }
        }
    },

    _preventScriptExecution: function(root) {
        $(root).find("*").each(function() {
            var attributes = this.attributes;
            var attribute, i, l, name;
            var attributesToRemove = [];

            for (i = 0, l = attributes.length; i < l; i++) {
                attribute = attributes[i];
                name = attribute.nodeName;

                if (attribute.specified && /^on/i.test(name)) {
                    this.setAttribute("k-script-" + name, attribute.value);
                    attributesToRemove.push(name);
                }
            }

            for (i = 0, l = attributesToRemove.length; i < l; i++) {
                this.removeAttribute(attributesToRemove[i]);
            }
        });
    },

    htmlToDom: function(html, root, options) {
        var browser = kendo.support.browser;
        var msie = browser.msie;
        var o = options || {};
        var immutables = o.immutables;

        html = Serializer.toEditableHtml(html);

        if (isFunction(o.custom)) {
            html = o.custom(html) || html;
        }
        root.innerHTML = html;

        if (immutables) {
            immutables.deserialize(root);
        }

        if (msie) {
            // unicode characters denormalize the DOM tree in IE9
            dom.normalize(root);

            Serializer._resetOrderedLists(root);
        }

        Serializer._preventScriptExecution(root);

        Serializer._fillEmptyElements(root);

        Serializer._removeSystemElements(root);

        Serializer._toEditableImmutables(root);

        // add k-table class to all tables
        $("table", root).addClass("k-table");

        return root;
    },

    domToXhtml: function(root, options) {
        var result = [];
        var immutables = options && options.immutables;

        function semanticFilter(attributes) {
            return $.grep(attributes, function(attr) {
                return attr.name != "style";
            });
        }

        function mapStart(node, tag) {
            result.push('<' + tag);
            attr(node);
            result.push('>');
        }

        var tagMap = {
            iframe: {
                start: function(node) { mapStart(node, "iframe"); },
                end: function() { result.push('</iframe>'); }
            },
            'k:script': {
                start: function(node) { mapStart(node, "script"); },
                end: function() { result.push('</script>'); },
                skipEncoding: true
            },
            span: {
                canOptimize: true,
                semantic: true,
                start: function(node) {
                    var style = node.style;

                    var attributes = specifiedAttributes(node);
                    var semanticAttributes = semanticFilter(attributes);

                    if (semanticAttributes.length) {
                        result.push("<span"); attr(node, semanticAttributes); result.push(">");
                    }

                    if (style.textDecoration == "underline") {
                        result.push("<u>");
                    }

                    var font = [];
                    if (style.color) {
                        font.push('color="' + dom.toHex(style.color) + '"');
                    }

                    if (style.fontFamily) {
                        font.push('face="' + style.fontFamily + '"');
                    }

                    if (style.fontSize) {
                        var size = $.inArray(style.fontSize, fontSizeMappings);
                        font.push('size="' + size + '"');
                    }

                    // Apply the rest of the inline styles back
                    var inlineStyles = [];
                    var ignoredStylePrefixes = ["text-decoration", "color", "font"];

                    for (let i = 0; i < style.length; i++) {
                        var inlineStyle = style[i];

                        if (ignoredStylePrefixes.filter(prop => inlineStyle.startsWith(prop)).length <= 0) {
                            inlineStyles.push(`${inlineStyle}: ${style[inlineStyle]}`);
                        }
                    }

                    if (inlineStyles.length) {
                        font.push('style="' + inlineStyles.join(";") + '"');
                    }

                    if (font.length) {
                        result.push("<font " + font.join(" ") + ">");
                    }
                },
                end: function(node) {
                    var style = node.style;

                    if (style.color || style.fontFamily || style.fontSize) {
                        result.push("</font>");
                    }

                    if (style.textDecoration == "underline") {
                        result.push("</u>");
                    }

                    if (semanticFilter(specifiedAttributes(node)).length) {
                        result.push("</span>");
                    }
                }
            },
            strong: {
                semantic: true,
                start: function(node) { mapStart(node, "b"); },
                end: function() { result.push('</b>'); }
            },
            em: {
                semantic: true,
                start: function(node) { mapStart(node, "i"); },
                end: function() { result.push('</i>'); }
            },
            b: {
                semantic: false,
                start: function(node) { mapStart(node, "strong"); },
                end: function() { result.push('</strong>'); }
            },
            i: {
                semantic: false,
                start: function(node) { mapStart(node, "em"); },
                end: function() { result.push('</em>'); }
            },
            u: {
                semantic: false,
                start: function(node) {
                    result.push('<span');

                    var attributes = specifiedAttributes(node);
                    var style = $(attributes).filter(function(i, item) { return item.name == "style"; })[0];
                    var styleObj = { nodeName: "style", value: "text-decoration:underline;" };

                    if (style) {
                        styleObj.value = style.value;
                        if (!/text-decoration/i.test(styleObj.value)) {
                            styleObj.value = "text-decoration:underline;" + styleObj.value;
                        }
                        attributes.splice($.inArray(style, attributes), 1);
                    }
                    attributes.push(styleObj);

                    attr(node, attributes);
                    result.push('>');
                },
                end: function() { result.push('</span>'); }
            },
            font: {
                canOptimize: true,
                semantic: false,
                start: function(node) {
                    result.push('<span style="');

                    var color = node.getAttribute('color');
                    var size = fontSizeMappings[node.getAttribute('size')];
                    var face = node.getAttribute('face');

                    if (color) {
                        result.push('color:');
                        result.push(dom.toHex(color));
                        result.push(';');
                    }

                    if (face) {
                        result.push('font-family:');
                        result.push(face);
                        result.push(';');
                    }

                    if (size) {
                        result.push('font-size:');
                        result.push(size);
                        result.push(';');
                    }

                    result.push('">');
                },
                end: function() {
                    result.push('</span>');
                }
            }
        };

        tagMap.script = tagMap["k:script"];

        options = options || {};

        if (typeof options.semantic == "undefined") {
            options.semantic = true;
        }

        function cssProperties(cssText) {
            var trim = kendo.trim;
            var css = trim(cssText);
            var match;
            var property, value;
            var properties = [];

            cssDeclaration.lastIndex = 0;

            while (true) {
                match = cssDeclaration.exec(css);

                if (!match) {
                    break;
                }

                property = trim(match[1].toLowerCase());
                value = trim(match[2]);

                if (property == "font-size-adjust" || property == "font-stretch") {
                    continue;
                }

                if (property.indexOf('color') >= 0) {
                    value = dom.toHex(value);
                } else if (property.indexOf('font') >= 0) {
                    value = value.replace(quoteRe, "'");
                } else if (/\burl\(/g.test(value)) {
                    value = value.replace(quoteRe, "");
                }

                properties.push({ property: property, value: value });
            }

            return properties;
        }

        function styleAttr(cssText) {
            var properties = cssProperties(cssText);
            var i;

            for (i = 0; i < properties.length; i++) {
                result.push(properties[i].property);
                result.push(':');
                result.push(properties[i].value);
                result.push(';');
            }
        }

        function specifiedAttributes(node) {
            var result = [];
            var attributes = node.attributes;
            var attribute, i, l;
            var name, value, specified;

            for (i = 0, l = attributes.length; i < l; i++) {
                attribute = attributes[i];

                name = attribute.nodeName;
                value = attribute.value;
                specified = attribute.specified;

                // In IE < 8 the 'value' attribute is not returned as 'specified'. The same goes for type="text"
                if (name == 'value' && 'value' in node && node.value) {
                    specified = true;
                } else if (name == 'type' && value == 'text') {
                    specified = true;
                } else if (name == "class" && !value) {
                    specified = false;
                } else if (sizzleAttr.test(name)) {
                    specified = false;
                } else if (name == 'complete') {
                    specified = false;
                } else if (name == 'altHtml') {
                    specified = false;
                } else if (name == 'start' && dom.is(node, "ul")) {
                    specified = false;
                } else if (name == 'start' && dom.is(node, "ol") && value == "1") {
                    specified = false;
                } else if (name.indexOf('_moz') >= 0) {
                    specified = false;
                } else if (scriptAttr.test(name)) {
                    specified = !!options.scripts;
                } else if (name == 'data-role' && value == 'resizable' && (dom.is(node, "tr") || dom.is(node, "td"))) {
                    specified = false;
                }

                if (specified) {
                    result.push(attribute);
                }
            }

            return result;
        }

        function attr(node, attributes) {
            var i, l, attribute, name, value;

            attributes = attributes || specifiedAttributes(node);

            if (dom.is(node, 'img')) {
                var width = node.style.width,
                    height = node.style.height,
                    $node = $(node);

                if (width && pixelRe.test(width)) {
                    $node.attr('width', parseInt(width, 10));
                    dom.unstyle(node, { width: undefined$1 });
                }

                if (height && pixelRe.test(height)) {
                    $node.attr('height', parseInt(height, 10));
                    dom.unstyle(node, { height: undefined$1 });
                }
            }

            if (!attributes.length) {
                return;
            }

            // Remove the following if everything seems to be in order.
            // https://github.com/telerik/kendo-ui-core/issues/3639
            // attributes.sort(function (a, b) {
            //     return a.nodeName > b.nodeName ? 1 : a.nodeName < b.nodeName ? -1 : 0;
            // });

            for (i = 0, l = attributes.length; i < l; i++) {
                attribute = attributes[i];
                name = attribute.nodeName;
                value = attribute.value;

                if (name == "class" && value == "k-table") {
                    continue;
                }

                name = name.replace(scriptAttr, "");

                result.push(' ');
                result.push(name);
                result.push('="');

                if (name == 'style') {
                    styleAttr(value || node.style.cssText);
                } else if (name == 'src' || name == 'href') {
                    result.push(kendo.htmlEncode(node.getAttribute(name, 2)));
                } else {
                    result.push(dom.fillAttrs[name] ? name : value);
                }

                result.push('"');
            }
        }

        function children(node, skip, skipEncoding) {
            for (var childNode = node.firstChild; childNode; childNode = childNode.nextSibling) {
                child(childNode, skip, skipEncoding);
            }
        }

        function text(node) {
            return node.nodeValue.replace(/\ufeff/g, "");
        }

        function isEmptyBomNode(node) {
            if (dom.isBom(node)) {
                do {
                    node = node.parentNode;

                    if (dom.is(node, TD) && node.childNodes.length === 1) {
                        return true;
                    }

                    if (node.childNodes.length !== 1) {
                        return false;
                    }
                } while (!dom.isBlock(node));

                return true;
            }

            return false;
        }

        function child(node, skip, skipEncoding) {
            var nodeType = node.nodeType,
                tagName, mapper,
                parent, value, previous, jqNode;

            if (immutables && Editor.Immutables.immutable(node)) {
                result.push(immutables.serialize(node));
            } else if (nodeType == 1) {
                tagName = dom.name(node);
                jqNode = $(node);

                if (jqNode.hasClass("k-element-resize-handle-wrapper") || jqNode.hasClass("k-column-resize-handle-wrapper") || jqNode.hasClass("k-row-resize-handle-wrapper")) {
                    return;
                }

                if (!tagName || dom.insignificant(node)) {
                    return;
                }

                if (!options.scripts && (tagName == "script" || tagName == "k:script")) {
                    return;
                }

                mapper = tagMap[tagName];

                if (mapper) {
                    if (mapper.canOptimize &&
                        options.optimizeTags &&
                        shouldOptimize(node)) {
                            children(node, false, mapper.skipEncoding);
                        return;
                    }

                    if (typeof mapper.semantic == "undefined" ||
                        (options.semantic ^ mapper.semantic)) {
                        mapper.start(node);
                        children(node, false, mapper.skipEncoding);
                        mapper.end(node);
                        return;
                    }
                }

                result.push('<');
                result.push(tagName);

                attr(node);

                if (dom.empty[tagName]) {
                    result.push(' />');
                } else {
                    result.push('>');
                    children(node, skip || dom.is(node, 'pre'));
                    result.push('</');
                    result.push(tagName);
                    result.push('>');
                }
            } else if (nodeType == 3) {
                if (isEmptyBomNode(node)) {
                    result.push('&nbsp;');
                    return;
                }

                value = text(node);

                if (!skip && supportsLeadingWhitespace) {
                    parent = node.parentNode;
                    previous = node.previousSibling;

                    if (!previous) {
                         previous = (dom.isInline(parent) ? parent : node).previousSibling;
                    }

                    if (!previous || previous.innerHTML === "" || dom.isBlock(previous)) {
                        if (options.keepEOL) {
                            value = value.replace(/[\r\n\v\f\t ]+/, ' ');
                        } else {
                            value = value.replace(/^[\r\n\v\f\t ]+/, '');
                        }
                    }

                    value = value.replace(/ +/, ' ');
                }

                result.push(skipEncoding ? value : dom.encode(value, options));

            } else if (nodeType == 4) {
                result.push('<![CDATA[');
                result.push(node.data);
                result.push(']]>');
            } else if (nodeType == 8) {
                if (node.data.indexOf('[CDATA[') < 0) {
                    result.push('<!--');
                    result.push(node.data);
                    result.push('-->');
                } else {
                    result.push('<!');
                    result.push(node.data);
                    result.push('>');
                }
            }
        }

        function shouldOptimize(node) {
            return node.attributes.length === 0;
        }

        function textOnly(root) {
            var childrenCount = root.childNodes.length;
            var textChild = childrenCount && root.firstChild.nodeType == 3;

            return textChild && (childrenCount == 1 || (childrenCount == 2 && dom.insignificant(root.lastChild)));
        }

        function runCustom() {
            if (kendo.isFunction(options.custom)) {
                result = options.custom(result) || result;
            }
        }

        if (textOnly(root)) {
            result = dom.encode(text(root.firstChild).replace(/[\r\n\v\f\t ]+/, ' '), options);
            runCustom();

            return result;
        }

        children(root);
        result = result.join('');
        runCustom();

        // if serialized dom contains only whitespace elements, consider it empty (required field validation)
        if (result.replace(brRe, "").replace(emptyPRe, "") === "") {
            return "";
        }

        return result;
    }

};

extend(Editor, {
    Serializer: Serializer
});

})(window.kendo.jQuery);

(function($) {

    // Imports ================================================================
    var kendo = window.kendo,
        Class = kendo.Class,
        extend = $.extend,
        Editor = kendo.ui.editor,
        browser = kendo.support.browser,
        dom = Editor.Dom,
        findNodeIndex = dom.findNodeIndex,
        isDataNode = dom.isDataNode,
        findClosestAncestor = dom.findClosestAncestor,
        getNodeLength = dom.getNodeLength,
        normalize = dom.normalize;

var SelectionUtils = {
    selectionFromWindow: function(window) {
        if (!window) {
            return;
        }

        if (!("getSelection" in window)) {
            return new W3CSelection(window.document);
        }

        return window.getSelection();
    },

    selectionFromRange: function(range) {
        var rangeDocument = RangeUtils.documentFromRange(range);
        return SelectionUtils.selectionFromDocument(rangeDocument);
    },

    selectionFromDocument: function(document) {
        return SelectionUtils.selectionFromWindow(dom.windowFromDocument(document));
    }
};

var W3CRange = Class.extend({
    init: function(doc) {
        $.extend(this, {
            ownerDocument: doc, /* not part of the spec; used when cloning ranges, traversing the dom and creating fragments */
            startContainer: doc,
            endContainer: doc,
            commonAncestorContainer: doc,
            startOffset: 0,
            endOffset: 0,
            collapsed: true
        });
    },

    // Positioning Methods
    setStart: function(node, offset) {
        this.startContainer = node;
        this.startOffset = offset;
        updateRangeProperties(this);
        fixIvalidRange(this, true);
    },

    setEnd: function(node, offset) {
        this.endContainer = node;
        this.endOffset = offset;
        updateRangeProperties(this);
        fixIvalidRange(this, false);
    },

    setStartBefore: function(node) {
        this.setStart(node.parentNode, findNodeIndex(node));
    },

    setStartAfter: function(node) {
        this.setStart(node.parentNode, findNodeIndex(node) + 1);
    },

    setEndBefore: function(node) {
        this.setEnd(node.parentNode, findNodeIndex(node));
    },

    setEndAfter: function(node) {
        this.setEnd(node.parentNode, findNodeIndex(node) + 1);
    },

    selectNode: function(node) {
        this.setStartBefore(node);
        this.setEndAfter(node);
    },

    selectNodeContents: function(node) {
        this.setStart(node, 0);
        this.setEnd(node, node[node.nodeType === 1 ? 'childNodes' : 'nodeValue'].length);
    },

    collapse: function(toStart) {
        var that = this;

        if (toStart) {
            that.setEnd(that.startContainer, that.startOffset);
        } else {
            that.setStart(that.endContainer, that.endOffset);
        }
    },

    // Editing Methods

    deleteContents: function() {
        var that = this,
            range = that.cloneRange();

        if (that.startContainer != that.commonAncestorContainer) {
            that.setStartAfter(findClosestAncestor(that.commonAncestorContainer, that.startContainer));
        }

        that.collapse(true);

        (function deleteSubtree(iterator) {
            while (iterator.next()) {
                if (iterator.hasPartialSubtree()) {
                    deleteSubtree(iterator.getSubtreeIterator());
                } else {
                    iterator.remove();
                }
            }
        })(new RangeIterator(range));
    },

    cloneContents: function() {
        // clone subtree
        var document = RangeUtils.documentFromRange(this);
        return (function cloneSubtree(iterator) {
                var node, frag = document.createDocumentFragment();

                while (node = iterator.next()) {
                    node = node.cloneNode(!iterator.hasPartialSubtree());

                    if (iterator.hasPartialSubtree()) {
                        node.appendChild(cloneSubtree(iterator.getSubtreeIterator()));
                    }

                    frag.appendChild(node);
                }

                return frag;
        })(new RangeIterator(this));
    },

    extractContents: function() {
        var that = this,
            range = that.cloneRange();

        if (that.startContainer != that.commonAncestorContainer) {
            that.setStartAfter(findClosestAncestor(that.commonAncestorContainer, that.startContainer));
        }

        that.collapse(true);

        var document = RangeUtils.documentFromRange(that);

        return (function extractSubtree(iterator) {
            var node, frag = document.createDocumentFragment();

            while (node = iterator.next()) {
                if (iterator.hasPartialSubtree()) {
                    node = node.cloneNode(false);
                    node.appendChild(extractSubtree(iterator.getSubtreeIterator()));
                } else {
                    iterator.remove(that.originalRange);
                }

                frag.appendChild(node);
            }

            return frag;
        })(new RangeIterator(range));
    },

    insertNode: function(node) {
        var that = this;

        if (isDataNode(that.startContainer)) {
            if (that.startOffset != that.startContainer.nodeValue.length) {
                dom.splitDataNode(that.startContainer, that.startOffset);
            }

            dom.insertAfter(node, that.startContainer);
        } else {
            dom.insertAt(that.startContainer, node, that.startOffset);
        }

        that.setStart(that.startContainer, that.startOffset);
    },

    cloneRange: function() {
        // fast copy
        return $.extend(new W3CRange(this.ownerDocument), {
            startContainer: this.startContainer,
            endContainer: this.endContainer,
            commonAncestorContainer: this.commonAncestorContainer,
            startOffset: this.startOffset,
            endOffset: this.endOffset,
            collapsed: this.collapsed,

            originalRange: this /* not part of the spec; used to update the original range when calling extractContents() on clones */
        });
    },

    // used for debug purposes
    toString: function() {
        var startNodeName = this.startContainer.nodeName,
            endNodeName = this.endContainer.nodeName;

        return [startNodeName == "#text" ? this.startContainer.nodeValue : startNodeName, '(', this.startOffset, ') : ',
                endNodeName == "#text" ? this.endContainer.nodeValue : endNodeName, '(', this.endOffset, ')'].join('');
    }
});

W3CRange.fromNode = function(node) {
    return new W3CRange(node.ownerDocument);
};

/* can be used in Range.compareBoundaryPoints if we need it one day */
function compareBoundaries(start, end, startOffset, endOffset) {
    if (start == end) {
        return endOffset - startOffset;
    }

    // end is child of start
    var container = end;
    while (container && container.parentNode != start) {
        container = container.parentNode;
    }

    if (container) {
        return findNodeIndex(container) - startOffset;
    }

    // start is child of end
    container = start;
    while (container && container.parentNode != end) {
        container = container.parentNode;
    }

    if (container) {
        return endOffset - findNodeIndex(container) - 1;
    }

    // deep traversal
    var root = dom.commonAncestor(start, end);
    var startAncestor = start;

    while (startAncestor && startAncestor.parentNode != root) {
        startAncestor = startAncestor.parentNode;
    }

    if (!startAncestor) {
        startAncestor = root;
    }

    var endAncestor = end;
    while (endAncestor && endAncestor.parentNode != root) {
        endAncestor = endAncestor.parentNode;
    }

    if (!endAncestor) {
        endAncestor = root;
    }

    if (startAncestor == endAncestor) {
        return 0;
    }

    return findNodeIndex(endAncestor) - findNodeIndex(startAncestor);
}

function fixIvalidRange(range, toStart) {
    function isInvalidRange(range) {
        try {
            return compareBoundaries(range.startContainer, range.endContainer, range.startOffset, range.endOffset) < 0;
        } catch (ex) {
            // range was initially invalid (e.g. when cloned from invalid range) - it must be fixed
            return true;
        }
    }

    if (isInvalidRange(range)) {
        if (toStart) {
            range.commonAncestorContainer = range.endContainer = range.startContainer;
            range.endOffset = range.startOffset;
        } else {
            range.commonAncestorContainer = range.startContainer = range.endContainer;
            range.startOffset = range.endOffset;
        }

        range.collapsed = true;
    }
}

function updateRangeProperties(range) {
    range.collapsed = range.startContainer == range.endContainer && range.startOffset == range.endOffset;

    var node = range.startContainer;
    while (node && node != range.endContainer && !dom.isAncestorOf(node, range.endContainer)) {
        node = node.parentNode;
    }

    range.commonAncestorContainer = node;
}

var RangeIterator = Class.extend({
    init: function(range) {
        $.extend(this, {
            range: range,
            _current: null,
            _next: null,
            _end: null
        });

        if (range.collapsed) {
            return;
        }

        var root = range.commonAncestorContainer;

        this._next = range.startContainer == root && !isDataNode(range.startContainer) ?
        range.startContainer.childNodes[range.startOffset] :
        findClosestAncestor(root, range.startContainer);

        this._end = range.endContainer == root && !isDataNode(range.endContainer) ?
        range.endContainer.childNodes[range.endOffset] :
        findClosestAncestor(root, range.endContainer).nextSibling;
    },

    hasNext: function() {
        return !!this._next;
    },

    next: function() {
        var that = this,
            current = that._current = that._next;
        that._next = that._current && that._current.nextSibling != that._end ?
        that._current.nextSibling : null;

        if (isDataNode(that._current)) {
            if (that.range.endContainer == that._current) {
                current = current.cloneNode(true);
                current.deleteData(that.range.endOffset, current.length - that.range.endOffset);
            }

            if (that.range.startContainer == that._current) {
                current = current.cloneNode(true);
                current.deleteData(0, that.range.startOffset);
            }
        }

        return current;
    },

    traverse: function(callback) {
        var that = this,
            current;

        function next() {
            that._current = that._next;
            that._next = that._current && that._current.nextSibling != that._end ? that._current.nextSibling : null;
            return that._current;
        }

        while (current = next()) {
            if (that.hasPartialSubtree()) {
                that.getSubtreeIterator().traverse(callback);
            } else {
                callback(current);
            }
        }

        return current;
    },

    remove: function(originalRange) {
        var that = this,
            inStartContainer = that.range.startContainer == that._current,
            inEndContainer = that.range.endContainer == that._current,
            start, end, delta;

        if (isDataNode(that._current) && (inStartContainer || inEndContainer)) {
            start = inStartContainer ? that.range.startOffset : 0;
            end = inEndContainer ? that.range.endOffset : that._current.length;
            delta = end - start;

            if (originalRange && (inStartContainer || inEndContainer)) {
                if (that._current == originalRange.startContainer && start <= originalRange.startOffset) {
                    originalRange.startOffset -= delta;
                }

                if (that._current == originalRange.endContainer && end <= originalRange.endOffset) {
                    originalRange.endOffset -= delta;
                }
            }

            that._current.deleteData(start, delta);
        } else {
            var parent = that._current.parentNode;

            if (originalRange && (that.range.startContainer == parent || that.range.endContainer == parent)) {
                var nodeIndex = findNodeIndex(that._current);

                if (parent == originalRange.startContainer && nodeIndex <= originalRange.startOffset) {
                    originalRange.startOffset -= 1;
                }

                if (parent == originalRange.endContainer && nodeIndex < originalRange.endOffset) {
                    originalRange.endOffset -= 1;
                }
            }

            dom.remove(that._current);
        }
    },

    hasPartialSubtree: function() {
        return !isDataNode(this._current) &&
        (dom.isAncestorOrSelf(this._current, this.range.startContainer) ||
            dom.isAncestorOrSelf(this._current, this.range.endContainer));
    },

    getSubtreeIterator: function() {
        return new RangeIterator(this.getSubRange());
    },

    getSubRange: function() {
        var that = this,
            subRange = that.range.cloneRange();
        subRange.selectNodeContents(that._current);
        if (dom.isAncestorOrSelf(that._current, that.range.startContainer)) {
            subRange.setStart(that.range.startContainer, that.range.startOffset);
        }
        if (dom.isAncestorOrSelf(that._current, that.range.endContainer)) {
            subRange.setEnd(that.range.endContainer, that.range.endOffset);
        }

        return subRange;
    }
});

var W3CSelection = Class.extend({
    init: function(doc) {
        this.ownerDocument = doc;
        this.rangeCount = 1;
    },

    addRange: function(range) {
        var textRange = this.ownerDocument.body.createTextRange();

        // end container should be adopted first in order to prevent selection with negative length
        adoptContainer(textRange, range, false);
        adoptContainer(textRange, range, true);

        textRange.select();
    },

    removeAllRanges: function() {
        var selection = this.ownerDocument.selection;

        if (selection.type != "None") {
            selection.empty();
        }
    },

    getRangeAt: function() {
        var textRange,
            range = new W3CRange(this.ownerDocument),
            selection = this.ownerDocument.selection,
            element, commonAncestor;

        try {
            textRange = selection.createRange();
            element = textRange.item ? textRange.item(0) : textRange.parentElement();
            if (element.ownerDocument != this.ownerDocument) {
                return range;
            }
        } catch (ex) {
            return range;
        }

        if (selection.type == "Control") {
            range.selectNode(textRange.item(0));
        } else {
            commonAncestor = textRangeContainer(textRange);
            adoptEndPoint(textRange, range, commonAncestor, true);
            adoptEndPoint(textRange, range, commonAncestor, false);

            if (range.startContainer.nodeType == 9) {
                range.setStart(range.endContainer, range.startOffset);
            }

            if (range.endContainer.nodeType == 9) {
                range.setEnd(range.startContainer, range.endOffset);
            }

            if (textRange.compareEndPoints("StartToEnd", textRange) === 0) {
                range.collapse(false);
            }

            var startContainer = range.startContainer,
                endContainer = range.endContainer,
                body = this.ownerDocument.body;

            if (!range.collapsed && range.startOffset === 0 && range.endOffset == getNodeLength(range.endContainer) && // check for full body selection
                !(startContainer == endContainer && isDataNode(startContainer) && startContainer.parentNode == body)) { // but not when single textnode is selected
                var movedStart = false,
                    movedEnd = false;

                while (findNodeIndex(startContainer) === 0 && startContainer == startContainer.parentNode.firstChild && startContainer != body) {
                    startContainer = startContainer.parentNode;
                    movedStart = true;
                }

                while (findNodeIndex(endContainer) == getNodeLength(endContainer.parentNode) - 1 && endContainer == endContainer.parentNode.lastChild && endContainer != body) {
                    endContainer = endContainer.parentNode;
                    movedEnd = true;
                }

                if (startContainer == body && endContainer == body && movedStart && movedEnd) {
                    range.setStart(startContainer, 0);
                    range.setEnd(endContainer, getNodeLength(body));
                }
            }
        }

        return range;
    }
});

function textRangeContainer(textRange) {
    var left = textRange.duplicate(),
        right = textRange.duplicate();

    left.collapse(true);
    right.collapse(false);

    return dom.commonAncestor(textRange.parentElement(), left.parentElement(), right.parentElement());
}

function adoptContainer(textRange, range, start) {
    // find anchor node and offset
    var container = range[start ? "startContainer" : "endContainer"],
        offset = range[start ? "startOffset" : "endOffset"],
        textOffset = 0,
        isData = isDataNode(container),
        anchorNode = isData ? container : container.childNodes[offset] || null,
        anchorParent = isData ? container.parentNode : container,
        doc = range.ownerDocument,
        cursor = doc.body.createTextRange(),
        cursorNode;

    // visible data nodes need a text offset
    if (container.nodeType == 3 || container.nodeType == 4) {
        textOffset = offset;
    }

    if (!anchorParent) {
        anchorParent = doc.body;
    }

    if (anchorParent.nodeName.toLowerCase() == "img") {
        cursor.moveToElementText(anchorParent);
        cursor.collapse(false);
        textRange.setEndPoint(start ? "StartToStart" : "EndToStart", cursor);
    } else {
        // create a cursor element node to position range (since we can't select text nodes)
        cursorNode = anchorParent.insertBefore(dom.create(doc, "a"), anchorNode);

        cursor.moveToElementText(cursorNode);
        dom.remove(cursorNode);
        cursor[start ? "moveStart" : "moveEnd"]("character", textOffset);
        cursor.collapse(false);
        textRange.setEndPoint(start ? "StartToStart" : "EndToStart", cursor);
    }
}

function adoptEndPoint(textRange, range, commonAncestor, start) {
    var cursorNode = dom.create(range.ownerDocument, "a"),
        cursor = textRange.duplicate(),
        comparison = start ? "StartToStart" : "StartToEnd",
        result, parent, target,
        previous, next,
        args, index,
        appended = false;

    cursorNode.innerHTML = "\ufeff";
    cursor.collapse(start);

    parent = cursor.parentElement();

    if (!dom.isAncestorOrSelf(commonAncestor, parent)) {
        parent = commonAncestor;
    }

    // detect range end points
    // insert cursorNode within the textRange parent and move the cursor until it gets outside of the textRange
    do {
        if (appended) {
            parent.insertBefore(cursorNode, cursorNode.previousSibling);
        } else {
            parent.appendChild(cursorNode);
            appended = true;
        }
        cursor.moveToElementText(cursorNode);
    } while ((result = cursor.compareEndPoints(comparison, textRange)) > 0 && cursorNode.previousSibling);

    target = cursorNode.nextSibling;

    if (result == -1 && isDataNode(target)) {
        cursor.setEndPoint(start ? "EndToStart" : "EndToEnd", textRange);

        dom.remove(cursorNode);

        args = [target, cursor.text.length];
    } else {
        previous = !start && cursorNode.previousSibling;
        next = start && cursorNode.nextSibling;

        if (isDataNode(next)) {
            args = [next, 0];
        } else if (isDataNode(previous)) {
            args = [previous, previous.length];
        } else {
            index = findNodeIndex(cursorNode);

            if (parent.nextSibling && index == parent.childNodes.length - 1) {
                args = [parent.nextSibling, 0];
            } else {
                args = [parent, index];
            }
        }

        dom.remove(cursorNode);
    }

    range[start ? "setStart" : "setEnd"](...args);
}

var RangeEnumerator = Class.extend({
    init: function(range) {
        this.enumerate = function() {
            var nodes = [];

            function visit(node) {
                if (dom.is(node, "img") || (node.nodeType == 3 && (!dom.isEmptyspace(node) || node.nodeValue == "\ufeff"))) {
                    nodes.push(node);
                } else {
                    node = node.firstChild;
                    while (node) {
                        visit(node);
                        node = node.nextSibling;
                    }
                }
            }

            new RangeIterator(range).traverse(visit);

            return nodes;
        };
    }
});

var ImmutablesRangeIterator = RangeIterator.extend({
    hasPartialSubtree: function() {
        var immutable = Editor.Immutables && Editor.Immutables.immutable;
        return immutable && !immutable(this._current) && RangeIterator.fn.hasPartialSubtree.call(this);
    },

    getSubtreeIterator: function() {
        return new ImmutablesRangeIterator(this.getSubRange());
    }
});

var ImmutablesRangeEnumerator = Class.extend({
    init: function(range) {
        this.enumerate = function() {
            var nodes = [];
            var immutable = Editor.Immutables && Editor.Immutables.immutable;
            function visit(node) {
                if (immutable && !immutable(node)) {
                    if (dom.is(node, "img") || (node.nodeType == 3 && (!dom.isEmptyspace(node) || node.nodeValue == "\ufeff"))) {
                        nodes.push(node);
                    } else {
                        node = node.firstChild;
                        while (node) {
                            visit(node);
                            node = node.nextSibling;
                        }
                    }
                }
            }

            new ImmutablesRangeIterator(range).traverse(visit);

            return nodes;
        };
    }
});

var RestorePoint = Class.extend({
    init: function(range, body, options) {
        var that = this;
        that.range = range;
        that.rootNode = RangeUtils.documentFromRange(range);
        that.body = body || that.getEditable(range);
        if (dom.name(that.body) != "body") {
            that.rootNode = that.body;
        }

        that.startContainer = that.nodeToPath(range.startContainer);
        that.endContainer = that.nodeToPath(range.endContainer);
        that.startOffset = that.offset(range.startContainer, range.startOffset);
        that.endOffset = that.offset(range.endContainer, range.endOffset);

        that.immutables = options && options.immutables;

        if (that.immutables) {
            that.serializedImmutables = Editor.Immutables.removeImmutables(that.body);
        }

        that.html = that.body.innerHTML;

        if (that.immutables && !that.serializedImmutables.empty) {
            Editor.Immutables.restoreImmutables(that.body, that.serializedImmutables);
        }
    },

    index: function(node) {
        var result = 0,
            lastType = node.nodeType;

        while (node = node.previousSibling) {
            var nodeType = node.nodeType;

            if (nodeType != 3 || lastType != nodeType) {
                result ++;
            }

            lastType = nodeType;
        }

        return result;
    },

    getEditable: function(range) {
        var root = range.commonAncestorContainer;

        while (root && (root.nodeType == 3 || root.attributes && (!root.attributes.contentEditable || root.attributes.contentEditable.nodeValue.toLowerCase() == "false"))) {
            root = root.parentNode;
        }

        return root;
    },

    restoreHtml: function() {
        var that = this;

        dom.removeChildren(that.body);
        that.body.innerHTML = that.html;
        if (that.immutables && !that.serializedImmutables.empty) {
            Editor.Immutables.restoreImmutables(that.body, that.serializedImmutables);
        }
    },

    offset: function(node, value) {
        if (node.nodeType == 3) {
            while ((node = node.previousSibling) && node.nodeType == 3) {
                value += node.nodeValue.length;
            }
        }

        return value;
    },

    nodeToPath: function(node) {
        var path = [];

        while (node != this.rootNode) {
            path.push(this.index(node));
            node = node.parentNode;
        }

        return path;
    },

    toRangePoint: function(range, start, path, denormalizedOffset) {
        var node = this.rootNode,
            length = path.length,
            offset = denormalizedOffset;

        while (length-- && node) {
            node = node.childNodes[path[length]];
        }

        while (node && node.nodeType == 3 && node.nodeValue.length < offset) {
            offset -= node.nodeValue.length;
            node = node.nextSibling;
        }

        if (node && offset >= 0) {
            range[start ? 'setStart' : 'setEnd'](node, offset);
        }
    },

    toRange: function() {
        var that = this,
            result = that.range.cloneRange();

        that.toRangePoint(result, true, that.startContainer, that.startOffset);
        that.toRangePoint(result, false, that.endContainer, that.endOffset);

        return result;
    }

});

var Marker = Class.extend({
    init: function() {
        this.caret = null;
    },

    addCaret: function(range) {
        var that = this;
        var caret = that.caret = dom.create(RangeUtils.documentFromRange(range), 'span', { className: 'k-marker' });
        range.insertNode(caret);

        dom.stripBomNode(caret.previousSibling);
        dom.stripBomNode(caret.nextSibling);

        range.selectNode(caret);
        return caret;
    },

    removeCaret: function(range) {
        var that = this,
            previous = that.caret.previousSibling,
            startOffset = 0;

        if (previous) {
            startOffset = isDataNode(previous) ? previous.nodeValue.length : findNodeIndex(previous);
        }

        var container = that.caret.parentNode;
        var containerIndex = previous ? findNodeIndex(previous) : 0;

        dom.remove(that.caret);
        normalize(container);

        var node = container.childNodes[containerIndex];

        if (isDataNode(node)) {
            range.setStart(node, startOffset);
        } else if (node) {
            var textNode = dom.lastTextNode(node);
            if (textNode) {
                range.setStart(textNode, textNode.nodeValue.length);
            } else {
                range[previous ? 'setStartAfter' : 'setStartBefore'](node);
            }
        } else {
            if (!browser.msie && !container.innerHTML) {
                container.innerHTML = '<br _moz_dirty="" />';
            }

            range.selectNodeContents(container);
        }
        range.collapse(true);
    },

    add: function(range, expand) {
        var that = this;

        var collapsed = range.collapsed && !RangeUtils.isExpandable(range);
        var doc = RangeUtils.documentFromRange(range);

        if (expand && range.collapsed) {
            that.addCaret(range);
            range = RangeUtils.expand(range);
        }

        var rangeBoundary = range.cloneRange();

        rangeBoundary.collapse(false);
        that.end = dom.create(doc, 'span', { className: 'k-marker' });
        rangeBoundary.insertNode(that.end);

        rangeBoundary = range.cloneRange();
        rangeBoundary.collapse(true);
        that.start = that.end.cloneNode(true);
        rangeBoundary.insertNode(that.start);

        that._removeDeadMarkers(that.start, that.end);

        if (collapsed) {
            var bom = doc.createTextNode("\ufeff");
            dom.insertAfter(bom.cloneNode(), that.start);
            dom.insertBefore(bom, that.end);
        }

        normalize(range.commonAncestorContainer);

        range.setStartBefore(that.start);
        range.setEndAfter(that.end);

        return range;
    },

    _removeDeadMarkers: function(start, end) {
        if (start.previousSibling && start.previousSibling.nodeValue == "\ufeff") {
            dom.remove(start.previousSibling);
        }

        if (end.nextSibling && end.nextSibling.nodeValue == "\ufeff") {
            dom.remove(end.nextSibling);
        }
    },

    _normalizedIndex: function(node) {
        var index = findNodeIndex(node);
        var pointer = node;

        while (pointer.previousSibling) {
            if (pointer.nodeType == 3 && pointer.previousSibling.nodeType == 3) {
                index--;
            }

            pointer = pointer.previousSibling;
        }

        return index;
    },

    remove: function(range) {
        var that = this,
            start = that.start,
            end = that.end;

        normalize(range.commonAncestorContainer);

        while (!start.nextSibling && start.parentNode) {
            start = start.parentNode;
        }

        while (!end.previousSibling && end.parentNode) {
            end = end.parentNode;
        }

        // merely accessing the siblings will solve range issues in IE
        (start.previousSibling && start.previousSibling.nodeType == 3) &&
                               (start.nextSibling && start.nextSibling.nodeType == 3);

        (end.previousSibling && end.previousSibling.nodeType == 3) &&
                             (end.nextSibling && end.nextSibling.nodeType == 3);

        start = start.nextSibling;
        end = end.previousSibling;

        var isBomSelected = start === end && dom.isBom(start);
        if (isBomSelected && start.length > 1) {
            start.nodeValue = start.nodeValue.charAt(0);
        }

        var collapsed = isBomSelected;
        var collapsedToStart = false;
        // collapsed range
        if (start == that.end) {
            collapsedToStart = !!that.start.previousSibling;
            start = end = that.start.previousSibling || that.end.nextSibling;
            collapsed = true;
        }

        dom.remove(that.start);
        dom.remove(that.end);

        if (!start || !end) {
            range.selectNodeContents(range.commonAncestorContainer);
            range.collapse(true);
            return;
        }

        var startOffset = collapsed ? isDataNode(start) ? start.nodeValue.length : start.childNodes.length : 0;
        var endOffset = isDataNode(end) ? end.nodeValue.length : end.childNodes.length;

        if (start.nodeType == 3) {
            while (start.previousSibling && start.previousSibling.nodeType == 3) {
                start = start.previousSibling;
                startOffset += start.nodeValue.length;
            }
        }

        if (end.nodeType == 3) {
            while (end.previousSibling && end.previousSibling.nodeType == 3) {
                end = end.previousSibling;
                endOffset += end.nodeValue.length;
            }
        }

        var startParent = start.parentNode;
        var endParent = end.parentNode;
        var startIndex = this._normalizedIndex(start);
        var endIndex = this._normalizedIndex(end);

        normalize(startParent);
        if (start.nodeType == 3) {
            start = startParent.childNodes[startIndex];
        }

        normalize(endParent);
        if (end.nodeType == 3) {
            end = endParent.childNodes[endIndex];
        }

        if (collapsed) {
            if (start.nodeType == 3) {
                range.setStart(start, startOffset);
            } else {
                range[collapsedToStart ? 'setStartAfter' : 'setStartBefore'](start);
            }

            range.collapse(true);

        } else {
            if (start.nodeType == 3) {
                range.setStart(start, startOffset);
            } else {
                range.setStartBefore(start);
            }

            if (end.nodeType == 3) {
                range.setEnd(end, endOffset);
            } else {
                range.setEndAfter(end);
            }
        }

        if (that.caret) {
            that.removeCaret(range);
        }
    }
});

var boundary = /[\u0009-\u000d]|\u0020|\u00a0|\ufeff|\.|,|;|:|!|\(|\)|\?/;

var RangeUtils = {
    nodes: function(range) {
        var nodes = RangeUtils.textNodes(range);
        if (!nodes.length) {
            range.selectNodeContents(range.commonAncestorContainer);
            nodes = RangeUtils.textNodes(range);
            if (!nodes.length) {
                nodes = dom.significantChildNodes(range.commonAncestorContainer);
            }
        }
        return nodes;
    },

    textNodes: function(range) {
        var allNodes = new RangeEnumerator(range).enumerate(),
            result = allNodes.filter(function(node) {
                return dom.allowsTextContent(node.parentElement);
            });

        return result;
    },

    editableTextNodes: function(range) {
        var nodes = [],
            immutableParent = Editor.Immutables && Editor.Immutables.immutableParent,
            result = [];

        if (immutableParent && !immutableParent(range.commonAncestorContainer)) {
            nodes = new ImmutablesRangeEnumerator(range).enumerate();
            result = nodes.filter(function(node) {
                return dom.allowsTextContent(node.parentElement);
            });
        }

        return result;
    },

    documentFromRange: function(range) {
        var startContainer = range.startContainer;
        return startContainer.nodeType == 9 ? startContainer : startContainer.ownerDocument;
    },

    createRange: function(document) {
        return document.createRange();
    },

    selectRange: function(range) {
        var image = RangeUtils.image(range);
        if (image) {
            range.setStartAfter(image);
            range.setEndAfter(image);
        }
        var selection = SelectionUtils.selectionFromRange(range);
        selection.removeAllRanges();
        selection.addRange(range);
    },

    stringify: function(range) {
        return kendo.format(
            "{0}:{1} - {2}:{3}",
            dom.name(range.startContainer), range.startOffset,
            dom.name(range.endContainer), range.endOffset
        );
    },

    split: function(range, node, trim) {
        function partition(start) {
            var partitionRange = range.cloneRange();
            partitionRange.collapse(start);
            partitionRange[start ? 'setStartBefore' : 'setEndAfter'](node);
            var contents = partitionRange.extractContents();
            if (trim) {
                contents = dom.trim(contents);
            }
            dom[start ? 'insertBefore' : 'insertAfter'](contents, node);
        }
        partition(true);
        partition(false);
    },

    mapAll: function(range, map) {
        var nodes = [];

        new RangeIterator(range).traverse(function(node) {
            var mapped = map(node);

            if (mapped && $.inArray(mapped, nodes) < 0) {
                nodes.push(mapped);
            }
        });

        return nodes;
    },

    getAll: function(range, predicate) {
        var selector = predicate;

        if (typeof predicate == "string") {
            predicate = function(node) {
                return dom.is(node, selector);
            };
        }

        return RangeUtils.mapAll(range, function(node) {
            if (predicate(node)) {
                return node;
            }
        });
    },

    getMarkers: function(range) {
        return RangeUtils.getAll(range, function(node) {
            return node.className == 'k-marker';
        });
    },

    image: function(range) {
        var nodes = RangeUtils.getAll(range, "img");

        if (nodes.length == 1) {
            return nodes[0];
        }
    },

    isStartOf: function(originalRange, node) {
        if (originalRange.startOffset !== 0) {
            return false;
        }

        var range = originalRange.cloneRange();

        while (range.startOffset === 0 && range.startContainer != node) {
            var index = dom.findNodeIndex(range.startContainer);
            var parent = range.startContainer.parentNode;

            while (index > 0 && parent[index - 1] && dom.insignificant(parent[index - 1])) {
                index--;
            }

            range.setStart(parent, index);
        }

        return range.startOffset === 0 && range.startContainer == node;
    },

    isEndOf: function(originalRange, node) {
        var range = originalRange.cloneRange();

        range.collapse(false);

        var start = range.startContainer;

        if (dom.isDataNode(start) && range.startOffset == dom.getNodeLength(start)) {
            range.setStart(start.parentNode, dom.findNodeIndex(start) + 1);
            range.collapse(true);
        }

        range.setEnd(node, dom.getNodeLength(node));

        var nodes = [];

        function visit(node) {
            if (!dom.insignificant(node) && !(dom.isDataNode(node) && /^[\ufeff]*$/.test(node.nodeValue))) {
                nodes.push(node);
            }
        }

        new RangeIterator(range).traverse(visit);

        return !nodes.length;
    },

    wrapSelectedElements: function(range) {
        var startEditable = dom.editableParent(range.startContainer);
        var endEditable = dom.editableParent(range.endContainer);

        while (range.startOffset === 0 && range.startContainer != startEditable) {
            range.setStart(range.startContainer.parentNode, dom.findNodeIndex(range.startContainer));
        }

        function isEnd(offset, container) {
            var length = dom.getNodeLength(container);

            if (offset == length) {
                return true;
            }

            for (var i = offset; i < length; i++) {
                if (!dom.insignificant(container.childNodes[i])) {
                    return false;
                }
            }

            return true;
        }

        while (isEnd(range.endOffset, range.endContainer) && range.endContainer != endEditable) {
            range.setEnd(range.endContainer.parentNode, dom.findNodeIndex(range.endContainer) + 1);
        }

        return range;
    },

    expand: function(range) {
        var result = range.cloneRange();

        var startContainer = result.startContainer.childNodes[result.startOffset === 0 ? 0 : result.startOffset - 1];
        var endContainer = result.endContainer.childNodes[result.endOffset];

        if (!isDataNode(startContainer) || !isDataNode(endContainer)) {
            return result;
        }

        var beforeCaret = startContainer.nodeValue;
        var afterCaret = endContainer.nodeValue;

        if (!beforeCaret || !afterCaret) {
            return result;
        }

        var startOffset = beforeCaret.split('').reverse().join('').search(boundary);
        var endOffset = afterCaret.search(boundary);

        if (!startOffset || !endOffset) {
            return result;
        }

        endOffset = endOffset == -1 ? afterCaret.length : endOffset;
        startOffset = startOffset == -1 ? 0 : beforeCaret.length - startOffset;

        result.setStart(startContainer, startOffset);
        result.setEnd(endContainer, endOffset);

        return result;
    },

    isExpandable: function(range) {
        var node = range.startContainer;
        var rangeDocument = RangeUtils.documentFromRange(range);

        if (node == rangeDocument || node == rangeDocument.body) {
            return false;
        }

        var result = range.cloneRange();

        var value = node.nodeValue;
        if (!value) {
            return false;
        }

        var beforeCaret = value.substring(0, result.startOffset);
        var afterCaret = value.substring(result.startOffset);

        var startOffset = 0, endOffset = 0;

        if (beforeCaret) {
            startOffset = beforeCaret.split('').reverse().join('').search(boundary);
        }

        if (afterCaret) {
            endOffset = afterCaret.search(boundary);
        }

        return startOffset && endOffset;
    }
};

extend(Editor, {
    SelectionUtils: SelectionUtils,
    W3CRange: W3CRange,
    RangeIterator: RangeIterator,
    W3CSelection: W3CSelection,
    RangeEnumerator: RangeEnumerator,
    RestorePoint: RestorePoint,
    Marker: Marker,
    RangeUtils: RangeUtils
});

})(window.kendo.jQuery);

(function($, undefined$1) {
    var kendo = window.kendo,
        Class = kendo.Class,
        Editor = kendo.ui.editor,
        dom = Editor.Dom,
        template = kendo.template,
        RangeUtils = Editor.RangeUtils,
        complexBlocks = ["ul", "ol", "tbody", "thead", "table"],
        toolsToBeUpdated = [
            "bold",
            "italic",
            "underline",
            "strikethrough",
            "superscript",
            "subscript",
            "forecolor",
            "backcolor",
            "fontname",
            "fontsize",
            "createlink",
            "unlink",
            "autolink",
            "addcolumnleft",
            "addcolumnright",
            "addrowabove",
            "addrowbelow",
            "deleterow",
            "deletecolumn",
            "mergecells",
            "formatting",
            "cleanformatting" ],
        IMMUTABALE = "k-immutable",
        IMMUTABALE_MARKER_SELECTOR = "[" + IMMUTABALE + "]",
        IMMUTABLE_SELECTOR = "[contenteditable='false']";

    var rootCondition = function(node) {
        return $(node).is("body,.k-editor");
    };

    var immutable = function(node) {
        return node.getAttribute && node.getAttribute("contenteditable") == "false";
    };

    var immutableParent = function(node) {
        return dom.closestBy(node, immutable, rootCondition);
    };

    var expandImmutablesIn = function(range) {
        var startImmutableParent = immutableParent(range.startContainer);
        var endImmutableParent = immutableParent(range.endContainer);

        if (startImmutableParent || endImmutableParent) {
            if (startImmutableParent) {
                range.setStartBefore(startImmutableParent);
            }
            if (endImmutableParent) {
                range.setEndAfter(endImmutableParent);
            }
        }
    };

    var immutablesContext = function(range) {
        if (immutableParent(range.commonAncestorContainer)) {
            return true;
        } else if (immutableParent(range.startContainer) || immutableParent(range.endContainer)) {
            var editableNodes = RangeUtils.editableTextNodes(range);
            if (editableNodes.length === 0) {
                return true;
            }
        }
        return false;
    };

    var randomId = function(length) {
        var result = '';
        var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (var i = length || 10; i > 0; --i) {
            result += chars.charAt(Math.round(Math.random() * (chars.length - 1)));
        }
        return result;
    };

    var removeImmutables = function(root) {
        var serializedImmutables = { empty: true }, nodeName, id, serialized;
         $(root).find(IMMUTABLE_SELECTOR).each(function(i, node) {
            nodeName = dom.name(node);
            id = randomId();
            serialized = "<" + nodeName + " " + IMMUTABALE + "='" + id + "'></" + nodeName + ">";
            serializedImmutables[id] = { node: node, style: $(node).attr("style") };
            serializedImmutables.empty = false;
            $(node).replaceWith(serialized);
        });

        return serializedImmutables;
    };

    var restoreImmutables = function(root, serializedImmutables) {
        var id, immutable;
        $(root).find(IMMUTABALE_MARKER_SELECTOR).each(function(i, node) {
            id = node.getAttribute(IMMUTABALE);
            immutable = serializedImmutables[id];
            $(node).replaceWith(immutable.node);
            if (immutable.style != $(immutable.node).attr("style")) {
                $(immutable.node).removeAttr("style").attr("style", immutable.style);
            }
        });
    };

    var deletingKey = function(keyCode) {
        var keys = kendo.keys;
        return keyCode === keys.BACKSPACE || keyCode == keys.DELETE;
    };
    var updateToolOptions = function(tool) {
        var options = tool ? tool.options : undefined$1;
        if (options && options.finder) {
            options.finder._initOptions({ immutables: true });
        }
    };

    var Immutables = Class.extend({
        init: function(editor) {
            this.editor = editor;
            this.serializedImmutables = {};
            this.options = $.extend({}, editor && editor.options && editor.options.immutables);

            var tools = kendo.ui.Editor.defaultTools;
            updateToolOptions(tools.justifyLeft);
            updateToolOptions(tools.justifyCenter);
            updateToolOptions(tools.justifyRight);
            updateToolOptions(tools.justifyFull);
        },

        serialize: function(node) {
            var result = this._toHtml(node),
                id;

            if (result.indexOf(IMMUTABALE) === -1) {
                id = this.randomId();
                result = result.replace(/>/, ' ' + IMMUTABALE + '="' + id + '">');
            } else {
                id = result.match(/k-immutable\s*=\s*['"](.*)['"]/)[1];
            }

            this.serializedImmutables[id] = node;
            return result;
        },

        _toHtml: function(node) {
            var serialization = this.options.serialization;
            var serializationType = typeof serialization;
            var nodeName;

            switch (serializationType) {
                case "string":
                    return template(serialization)(node);
                case "function":
                    return serialization(node);
                default:
                    nodeName = dom.name(node);
                    return "<" + nodeName + "></" + nodeName + ">";
            }
        },

        deserialize: function(node) {
            var that = this;
            var deserialization = this.options.deserialization;

            $(IMMUTABALE_MARKER_SELECTOR, node).each(function() {
                var id = this.getAttribute(IMMUTABALE);
                var immutable = that.serializedImmutables[id];
                if (kendo.isFunction(deserialization)) {
                    deserialization(this, immutable);
                }
                $(this).replaceWith(immutable);
            });

            that.serializedImmutables = {};
        },

        randomId: function(length) {
            return randomId(length);
        },

        keydown: function(e, range) {
            var isDeleting = deletingKey(e.keyCode);
            var shouldCancelEvent = (isDeleting && this._cancelDeleting(e, range)) ||
                (!isDeleting && this._cancelTyping(e, range));

            if (shouldCancelEvent) {
                e.preventDefault();
                return true;
            }
        },

        _cancelTyping: function(e, range) {
            var editor = this.editor;
            var keyboard = editor.keyboard;

            return range.collapsed && !keyboard.typingInProgress &&
                keyboard.isTypingKey(e) && immutablesContext(range);
        },

        _cancelDeleting: function(e, range) {
            var keys = kendo.keys;
            var backspace = e.keyCode === keys.BACKSPACE;
            var del = e.keyCode == keys.DELETE;

            if (!backspace && !del) {
                return false;
            }
            var cancelDeleting = false;
            if (range.collapsed) {
                if (immutablesContext(range)) {
                    return true;
                }
                var immutable = this.nextImmutable(range, del);
                if (immutable && backspace) {
                    var closestSelectionLi = dom.closest(range.commonAncestorContainer, "li");
                    if (closestSelectionLi) {
                        var closestImmutableLi = dom.closest(immutable, "li");
                        if (closestImmutableLi && closestImmutableLi !== closestSelectionLi) {
                            return cancelDeleting;
                        }
                    }
                }
                if (immutable && !dom.tableCell(immutable)) {
                    if (dom.parentOfType(immutable, complexBlocks) === dom.parentOfType(range.commonAncestorContainer, complexBlocks)) {
                        while (immutable && immutable.parentNode.childNodes.length == 1) {
                            immutable = immutable.parentNode;
                        }
                        if (dom.tableCell(immutable)) {
                            return cancelDeleting;
                        }
                        this._removeImmutable(immutable, range);
                    }
                    cancelDeleting = true;
                }
            }
            return cancelDeleting;
        },

        nextImmutable: function(range, forwards) {
            var commonContainer = range.commonAncestorContainer;
            if (dom.isBom(commonContainer) || ((forwards && RangeUtils.isEndOf(range, commonContainer)) || (!forwards && RangeUtils.isStartOf(range, commonContainer)))) {
                var next = this._nextNode(commonContainer, forwards);
                if (next && dom.isBlock(next) && !immutableParent(next)) {
                    while (next && next.children && next.children[forwards ? 0 : next.children.length - 1]) {
                        next = next.children[forwards ? 0 : next.children.length - 1];
                    }
                }
                return immutableParent(next);
            }
        },

        _removeImmutable: function(immutable, range) {
            var editor = this.editor;
            var startRestorePoint = new Editor.RestorePoint(range, editor.body);
            dom.remove(immutable);
            Editor._finishUpdate(editor, startRestorePoint);
        },

        _nextNode: function(node, forwards) {
            var sibling = forwards ? "nextSibling" : "previousSibling";
            var current = node, next;
            while (current && !next && !dom.isChildOfBaseContainer(current)) {
                next = current[sibling];
                if (next && dom.isDataNode(next) && /^\s|[\ufeff]$/.test(next.nodeValue)) {
                    current = next;
                    next = current[sibling];
                }
                if (!next) {
                    current = current.parentNode;
                }
            }
            return next;
        }
    });

    Immutables.immutable = immutable;
    Immutables.immutableParent = immutableParent;
    Immutables.expandImmutablesIn = expandImmutablesIn;
    Immutables.immutablesContext = immutablesContext;
    Immutables.toolsToBeUpdated = toolsToBeUpdated;
    Immutables.removeImmutables = removeImmutables;
    Immutables.restoreImmutables = restoreImmutables;

    Editor.Immutables = Immutables;
})(window.kendo.jQuery);

(function($) {

    // Imports ================================================================
    var kendo = window.kendo,
        Class = kendo.Class,
        editorNS = kendo.ui.editor,
        dom = editorNS.Dom,
        RestorePoint = editorNS.RestorePoint,
        Marker = editorNS.Marker,
        extend = $.extend;

function finishUpdate(editor, startRestorePoint) {
    var endRestorePoint = editor.selectionRestorePoint = new RestorePoint(editor.getRange(), editor.body);
    var command = new GenericCommand(startRestorePoint, endRestorePoint);
    command.editor = editor;

    editor.undoRedoStack.push(command);
    editor._refreshTools();

    return endRestorePoint;
}

var Command = Class.extend({
    init: function(options) {
        this.options = options;
        this.restorePoint = new RestorePoint(options.range, options.body, { immutables: options.immutables });
        this.marker = new Marker();
        this.formatter = options.formatter;
    },

    getRange: function() {
        return this.restorePoint.toRange();
    },

    lockRange: function(expand) {
        return this.marker.add(this.getRange(), expand);
    },

    releaseRange: function(range) {
        this.marker.remove(range);
        this.editor.selectRange(range);
    },

    undo: function() {
        var point = this.restorePoint;
        point.restoreHtml();
        this.editor.selectRange(point.toRange());
    },

    redo: function() {
        this.exec();
    },

    createDialog: function(content, options) {
        var editor = this.editor;

        return $(content).appendTo(document.body)
            .kendoWindow(extend({}, editor.options.dialogOptions, options))
            .closest(".k-window")
            .addClass("k-editor-window")
            .toggleClass("k-rtl", kendo.support.isRtl(editor.wrapper)).end();
    },

    exec: function() {
        var range = this.lockRange(true);
        this.formatter.editor = this.editor;
        this.formatter.toggle(range);
        this.releaseRange(range);
    },

    postExec: function() {
        this.editor._handleSpaceAndNewLines();
    },

    immutables: function() {
        return this.editor && this.editor.options.immutables;
    },

    expandImmutablesIn: function(range) {
        if (this.immutables()) {
            kendo.ui.editor.Immutables.expandImmutablesIn(range);
            this.restorePoint = new RestorePoint(range, this.editor.body);
        }
    },

    _actionButtonsTemplate: function({ messages, insertButtonIcon, cancelButtonIcon }) {
        return '<div class="k-actions k-actions-start k-actions-horizontal k-window-buttons">' +
        kendo.html.renderButton(`<button class="k-dialog-insert">${messages.dialogInsert}</button>`, { themeColor: "primary", icon: insertButtonIcon }) +
        kendo.html.renderButton(`<button class="k-dialog-close">${messages.dialogCancel}</button>`, { icon: cancelButtonIcon }) +
    '</div>';
    }
});

var GenericCommand = Class.extend({
    init: function(startRestorePoint, endRestorePoint) {
        this.body = startRestorePoint.body;
        this.startRestorePoint = startRestorePoint;
        this.endRestorePoint = endRestorePoint;
    },

    redo: function() {
        dom.removeChildren(this.body);

        this.body.innerHTML = this.endRestorePoint.html;
        this.editor.selectRange(this.endRestorePoint.toRange());
    },

    undo: function() {
        dom.removeChildren(this.body);

        this.body.innerHTML = this.startRestorePoint.html;
        this.editor.selectRange(this.startRestorePoint.toRange());
    }
});

extend(editorNS, {
    _finishUpdate: finishUpdate,
    Command: Command,
    GenericCommand: GenericCommand
});

})(window.kendo.jQuery);

(function($, undefined$1) {

var kendo = window.kendo,
    extend = $.extend,
    Editor = kendo.ui.editor,
    EditorUtils = Editor.EditorUtils,
    Command = Editor.Command,
    Tool = Editor.Tool,
    dom = Editor.Dom;

var ViewHtmlCommand = Command.extend({
    init: function(options) {
        var cmd = this;
        cmd.options = options;
        Command.fn.init.call(cmd, options);
        cmd.attributes = null;
        cmd.async = true;
    },

    exec: function() {
        var that = this,
            editor = that.editor,
            options = editor.options,
            messages = editor.options.messages,
            dialog = $(kendo.template(ViewHtmlCommand.template)(messages)).appendTo(document.body),
            textarea = ".k-editor-textarea > textarea",
            content, comments;

        options.serialization.immutables = editor.immutables;

        comments = dom.getAllComments(editor.body);

        content = EditorUtils.cacheComments(editor.value(), comments);
        content = ViewHtmlCommand.indent(content);
        content = EditorUtils.retrieveComments(content, comments);

        options.serialization.immutables = undefined$1;

        function apply(e) {
            options.deserialization.immutables = editor.immutables;
            editor.value(dialog.find(textarea).val());
            options.deserialization.immutables = undefined$1;

            close(e);

            if (that.change) {
                that.change();
            }

            editor.trigger("change");
        }

        function close(e) {
            e.preventDefault();

            dialog.data("kendoWindow").destroy();

            if (editor.immutables) {
                editor.immutables.serializedImmutables = {};
            }

            editor.focus();
        }

        let window = this.createDialog(dialog, {
            title: messages.viewHtml,
            _footerTemplate: ViewHtmlCommand._footerTemplate,
            _footerMessages: messages,
            width: 600,
            height: 400,
            resizable: true,
            close: close,
            visible: false
        })
            .find(textarea).val(content).end()
            .data("kendoWindow");

            window.center().open();

            window.wrapper.find(".k-dialog-update").on("click", apply).end();
            window.wrapper.find(".k-dialog-close").on("click", close).end();
        dialog.find(textarea).trigger("focus");
    }
});

extend(ViewHtmlCommand, {
    template: () =>
    '<div class="k-editor-dialog k-popup-edit-form k-viewhtml-dialog">' +
        '<span class="k-input k-textarea k-input-solid k-input-md k-rounded-md k-editor-textarea"><textarea class="k-input-inner !k-overflow-auto !k-resize-none"></textarea></span>' +
    '</div>',
    _footerTemplate: ({ dialogUpdate, dialogCancel }) =>
    `<div class="k-actions k-actions-start k-actions-horizontal k-window-actions">` +
        kendo.html.renderButton(`<button class="k-dialog-update">${kendo.htmlEncode(dialogUpdate)}</button>`, { themeColor: "primary", icon: "check" }) +
        kendo.html.renderButton(`<button class="k-dialog-close">${kendo.htmlEncode(dialogCancel)}</button>`, { icon: "cancel-outline" }) +
    `</div>`,
    indent: function(content) {
        return content.replace(/<\/(p|li|ul|ol|h[1-6]|table|tr|td|th)>/ig, "</$1>\n")
                      .replace(/<(ul|ol)([^>]*)><li/ig, "<$1$2>\n<li")
                      .replace(/<br \/>/ig, "<br />\n")
                      .replace(/\n$/, "");
    }
});

kendo.ui.editor.ViewHtmlCommand = ViewHtmlCommand;

Editor.EditorUtils.registerTool("viewHtml", new Tool({ command: ViewHtmlCommand }));

})(window.kendo.jQuery);

(function($) {

var kendo = window.kendo,
    extend = $.extend,
    Editor = kendo.ui.editor,
    Tool = Editor.Tool,
    Command = Editor.Command,
    EditorUtils = Editor.EditorUtils;

var FormatCommand = Command.extend({
    init: function(options) {
        options.formatter = options.formatter();
        var finder = options.formatter.finder;
        if (finder && EditorUtils.formatByName("immutable", finder.format)) {
            finder._initOptions({ immutables: options.immutables });
            options.finder && options.finder._initOptions({ immutables: options.immutables });
        }
        Command.fn.init.call(this, options);
    }
});

var FormatTool = Tool.extend({
    init: function(options) {
        Tool.fn.init.call(this, options);
    },

    command: function(commandArguments) {
        var that = this;

        return new FormatCommand(extend(commandArguments, {
            formatter: that.options.formatter,
            finder: that.options.finder
        }));
    },

    update: function(ui, nodes) {
        var isFormatted = this.options.finder.isFormatted(nodes),
            toolbar = ui.closest(".k-toolbar").getKendoToolBar();

        if (toolbar && ui.getKendoToggleButton()) {
            toolbar.toggle(ui, isFormatted);
        }
    }
});

$.extend(Editor, {
    FormatCommand: FormatCommand,
    FormatTool: FormatTool
});

})(window.kendo.jQuery);

(function($) {

var kendo = window.kendo,
    Class = kendo.Class,
    Editor = kendo.ui.editor,
    formats = kendo.ui.Editor.fn.options.formats,
    Tool = Editor.Tool,
    FormatTool = Editor.FormatTool,
    dom = Editor.Dom,
    RangeUtils = Editor.RangeUtils,
    extend = $.extend,
    registerTool = Editor.EditorUtils.registerTool,
    registerFormat = Editor.EditorUtils.registerFormat,
    MOUSEDOWN_NS = "mousedown.kendoEditor",
    KEYDOWN_NS = "keydown.kendoEditor",
    KMARKER = "k-marker";

var InlineFormatFinder = Class.extend({
    init: function(format) {
        this.format = format;
    },

    numberOfSiblings: function(referenceNode) {
        var textNodesCount = 0,
            elementNodesCount = 0,
            markerCount = 0,
            parentNode = referenceNode.parentNode,
            node;

        for (node = parentNode.firstChild; node; node = node.nextSibling) {
            if (node != referenceNode) {
                if (node.className == KMARKER) {
                    markerCount++;
                } else if (node.nodeType == 3) {
                    textNodesCount++;
                } else {
                    elementNodesCount++;
                }
            }
        }

        if (markerCount > 1 && parentNode.firstChild.className == KMARKER && parentNode.lastChild.className == KMARKER) {
            // full node selection
            return 0;
        } else {
            return elementNodesCount + textNodesCount;
        }
    },

    findSuitable: function(sourceNode, skip) {
        if (!skip && this.numberOfSiblings(sourceNode) > 0) {
            return null;
        }

        var node = sourceNode.parentNode;
        var tags = this.format[0].tags;

        while (!dom.ofType(node, tags)) {
            if (this.numberOfSiblings(node) > 0) {
                return null;
            }

            node = node.parentNode;
        }

        return node;
    },

    findFormat: function(sourceNode) {
        var format = this.format,
            attrEquals = dom.attrEquals,
            i, len, node, tags, attributes;

        for (i = 0, len = format.length; i < len; i++) {
            node = sourceNode;
            tags = format[i].tags;
            attributes = format[i].attr;

            if (node && dom.ofType(node, tags) && attrEquals(node, attributes)) {
                return node;
            }

            while (node) {
                node = dom.parentOfType(node, tags);
                if (node && attrEquals(node, attributes)) {
                    return node;
                }
            }
        }

        return null;
    },

    isFormatted: function(nodes) {
        var i, len;

        for (i = 0, len = nodes.length; i < len; i++) {
            if (this.findFormat(nodes[i])) {
                return true;
            }
        }
        return false;
    }
});

var InlineFormatter = Class.extend({
    init: function(format, values) {
        this.finder = new InlineFormatFinder(format);
        this.attributes = extend({}, format[0].attr, values);
        this.tag = format[0].tags[0];
    },

    wrap: function(node) {
        return dom.wrap(node, dom.create(node.ownerDocument, this.tag, this.attributes));
    },

    activate: function(range, nodes) {
        if (this.finder.isFormatted(nodes)) {
            this.split(range);
            this.remove(nodes);
        } else {
            this.apply(nodes);
        }
    },

    toggle: function(range) {
        var textNodes = this.immutables() ? RangeUtils.editableTextNodes : RangeUtils.textNodes;
        var nodes = textNodes(range);

        if (nodes.length > 0) {
            this.activate(range, nodes);
        }
    },

    immutables: function() {
        return this.editor && this.editor.options.immutables;
    },

    apply: function(nodes) {
        var formatNodes = [];
        var i, l, node, formatNode;

        if (nodes.length > 1) {
            for (i = 0, l = nodes.length; i < l; i++) {
                node = nodes[i];
                formatNode = this.format(node, true);
                formatNodes.push(formatNode);

            }
        } else {
            node = nodes[0];
            this.format(node, false);
        }

        this.consolidate(formatNodes);
    },

    format: function(node, outerMostInline) {
        var formatNode = this.finder.findSuitable(node);
        var attributes = this.attributes;
        var styleAttr = attributes ? attributes.style || {} : {};

        if (formatNode) {
            if (dom.is(formatNode, "font")) {
                if (styleAttr.color) {
                    formatNode.removeAttribute("color");
                }
                if (styleAttr.fontName) {
                    formatNode.removeAttribute("face");
                }
                if (styleAttr.fontSize) {
                    formatNode.removeAttribute("size");
                }
            }
            dom.attr(formatNode, attributes);
        } else {
            if (outerMostInline) {
                while (!dom.isBlock(node.parentNode) && node.parentNode.childNodes.length == 1 && node.parentNode.contentEditable !== 'true') {
                    node = node.parentNode;
                }
            }

            formatNode = this.wrap(node);
        }

        return formatNode;
    },

    remove: function(nodes) {
        var i, l, formatNode;

        for (i = 0, l = nodes.length; i < l; i++) {
            formatNode = this.finder.findFormat(nodes[i]);
            if (formatNode) {
                if (this.attributes && this.attributes.style) {
                    dom.unstyle(formatNode, this.attributes.style);
                    if (!formatNode.style.cssText && !formatNode.attributes["class"]) {
                        dom.unwrap(formatNode);
                    }
                } else {
                    dom.unwrap(formatNode);
                }
            }
        }
    },

    split: function(range) {
        var nodes = RangeUtils.textNodes(range);
        var l = nodes.length;
        var i, formatNode;

        if (l > 0) {
            for (i = 0; i < l; i++) {
                formatNode = this.finder.findFormat(nodes[i]);
                if (formatNode) {
                    RangeUtils.split(range, formatNode, true);
                }
            }
        }
    },

    consolidate: function(nodes) {
        var node, last;

        while (nodes.length > 1) {
            node = nodes.pop();
            last = nodes[nodes.length - 1];

            if (node.previousSibling && node.previousSibling.className == KMARKER) {
                last.appendChild(node.previousSibling);
            }

            if (node.tagName == last.tagName &&
                node.previousSibling == last &&
                node.style.cssText == last.style.cssText &&
                node.className === last.className) {

                while (node.firstChild) {
                    last.appendChild(node.firstChild);
                }

                dom.remove(node);
            }
        }
    }
});

var GreedyInlineFormatFinder = InlineFormatFinder.extend({
    init: function(format, greedyProperty, fontAttr, defaultValue) {
        this.format = format;
        this.greedyProperty = greedyProperty;
        this.fontAttr = fontAttr;
        this.defaultValue = defaultValue;
        InlineFormatFinder.fn.init.call(this, format);
    },

    getInlineCssValue: function(node) {
        var attributes = node.attributes;
        var trim = kendo.trim;
        var i, l, attribute, name, attributeValue, css, pair, cssIndex, len;
        var propertyAndValue, property, value;

        if (!attributes) {
            return;
        }

        for (i = 0, l = attributes.length; i < l; i++) {
            attribute = attributes[i];
            name = attribute.nodeName;
            attributeValue = attribute.nodeValue;

            if (attribute.specified && name == "style") {

                css = trim(attributeValue || node.style.cssText).split(";");

                for (cssIndex = 0, len = css.length; cssIndex < len; cssIndex++) {
                    pair = css[cssIndex];
                    if (pair.length) {
                        propertyAndValue = pair.split(":");
                        property = trim(propertyAndValue[0].toLowerCase());
                        value = trim(propertyAndValue[1]);

                        if (property != this.greedyProperty) {
                            continue;
                        }

                        return property.indexOf("color") >= 0 ? dom.toHex(value) : value;
                    }
                }
            }

            if (this.fontAttr && attribute.specified && name == this.fontAttr) {
                property = attribute.nodeValue;
                value = attribute.nodeValue;

                return property.indexOf("color") >= 0 ? dom.toHex(value) : value;
            }
        }
    },

    getFormatInner: function(node) {
        var $node = $(dom.isDataNode(node) ? node.parentNode : node);
        var parents = $node.parentsUntil("[contentEditable]").addBack().toArray().reverse();
        var i, len, value;

        for (i = 0, len = parents.length; i < len; i++) {
            value = this.greedyProperty == "className" ? parents[i].className : this.getInlineCssValue(parents[i]);

            if (value) {
                return value;
            }
        }

        return this.defaultValue || "inherit";
    },

    getFormat: function(nodes) {
        var result = this.getFormatInner(nodes[0]), i, len;

        for (i = 1, len = nodes.length; i < len; i++) {
            if (result != this.getFormatInner(nodes[i])) {
                return "";
            }
        }

        return result;
    },

    isFormatted: function(nodes) {
        return this.getFormat(nodes) !== "";
    }
});

var GreedyInlineFormatter = InlineFormatter.extend({
    init: function(format, values, greedyProperty) {
        InlineFormatter.fn.init.call(this, format, values);

        this.values = values;
        this.finder = new GreedyInlineFormatFinder(format, greedyProperty);

        if (greedyProperty) {
            this.greedyProperty = kendo.toCamelCase(greedyProperty);
        }

    },

    activate: function(range, nodes) {
        var greedyProperty = this.greedyProperty;
        var action = "apply";

        this.split(range);

        if (greedyProperty && this.values.style[greedyProperty] == "inherit") {
            action = "remove";
        }

        this[action](nodes);
    }
});

var InlineFormatTool = FormatTool.extend({
    init: function(options) {
        FormatTool.fn.init.call(this, extend(options, {
            finder: new InlineFormatFinder(options.format),
            formatter: function() { return new InlineFormatter(options.format); }
        }));
    }
});

var DelayedExecutionTool = Tool.extend({
    update: function(ui, nodes) {
        var list = ui.data(this.type);

        list.close();
        list.value(this.finder.getFormat(nodes));
    }
});

var FontTool = DelayedExecutionTool.extend({
    init: function(options) {
        Tool.fn.init.call(this, options);

        // IE has single selection hence we are using select box instead of combobox
        this.type = "kendoComboBox";
        this.format = [{ tags: ["span", "font"] }];
        this.finder = new GreedyInlineFormatFinder(this.format, options.cssAttr, options.fontAttr);
    },

    command: function(commandArguments) {
        var options = this.options,
            format = this.format,
            style = {};

        return new Editor.FormatCommand(extend(commandArguments, {
            formatter: function() {
                style[options.domAttr] = commandArguments.value;

                return new GreedyInlineFormatter(format, { style: style }, options.cssAttr);
            }
        }));
    },

    initialize: function(ui, editor) {
        var options = this.options,
            toolName = options.name,
            dataSource,
            range,
            widget = ui.data("kendoComboBox"),
            defaultValue = [];

        if (!widget) {
            return;
        }

        if (options.defaultValue) {
           defaultValue = [{
                text: editor.options.messages[options.defaultValue[0].text],
                value: options.defaultValue[0].value
           }];
        }

        dataSource = defaultValue.concat(options.items ? options.items : (editor.options[toolName] || [] ));
        widget.setDataSource(dataSource);

        widget.bind("change", (e) => {
            editor._range = range;
            if (e.sender.value() !== "") {
                Tool.exec(editor, toolName, e.sender.value());
            }
        });

        widget.bind("close", () => {
            setTimeout(function() {
                editor._deleteSavedRange();
            },0);
        });

        widget.value("inherit");

        widget.wrapper.on(MOUSEDOWN_NS, ".k-select,.k-input-button,.k-input", function() {
            var newRange = editor.getRange();
            range = editor._containsRange(newRange) ? newRange : range;
        })
        .on(KEYDOWN_NS, function(e) {
            if (e.keyCode === kendo.keys.ENTER) {
                editor._deleteSavedRange();
                e.preventDefault();
            }
        });
    }

});

var ColorTool = Tool.extend({
    init: function(options) {
        Tool.fn.init.call(this, options);

        this.format = [{ tags: ["span","font"] }];
        this.finder = new GreedyInlineFormatFinder(this.format, options.cssAttr);
    },

    options: {
        palette: "websafe",
        columns: 18
    },

    update: function() {
        this._widget.close();
    },

    command: function(commandArguments) {
        var options = this.options,
            format = this.format,
            style = {};

        return new Editor.FormatCommand(extend(commandArguments, {
            formatter: function() {
                style[options.domAttr] = commandArguments.value;

                return new GreedyInlineFormatter(format, { style: style }, options.cssAttr);
            }
        }));
    },

    initialize: function(ui, editor) {
        var that = this,
            toolName = that.options.name,
            component = this._widget = ui.getKendoColorPicker();

        if (!component) {
            return;
        }

        component.bind("change", () => {
            var color = component.value();

            if (color) {
                Tool.exec(editor, toolName, color);
            }

            delete that.storedRange;
            delete that._inputFocused;

            editor.focus();
        });

        component.bind("open", () => {
            that.storedRange = editor.getRange();

            component._popup.element.on(MOUSEDOWN_NS, function(e) {
                if (!$(e.target).is("input.k-color-value")) {
                    e.preventDefault();
                }
            });

            if (!component._popup.element.is("[unselectable='on']")) {
                component._popup.element
                    .attr({ unselectable: "on" })
                    .find("*:not(input)").attr("unselectable", "on")
                    .end().find("input").on("focus", function() {
                        that._inputFocused = true;
                    });
            }

            component._popup.one("activate", () => {
                component._popup.element.find(".k-colorpalette").trigger("focus");
            });
        });

        component.bind("close", (e) => {
            component._popup.element.off(MOUSEDOWN_NS);
        });

        component.unbind("activate").bind("activate", (e) => {
            if (!component._value || component._value.toCssRgba() === "rgba(255, 255, 255, 0)") {
                return;
            }

            component.trigger("change");
        });

        component.wrapper
            .attr({ unselectable: "on" })
            .find("*:not(input)").attr("unselectable", "on");

        component.value("transparent");
    }
});

extend(Editor, {
    InlineFormatFinder: InlineFormatFinder,
    InlineFormatter: InlineFormatter,
    DelayedExecutionTool: DelayedExecutionTool,
    GreedyInlineFormatFinder: GreedyInlineFormatFinder,
    GreedyInlineFormatter: GreedyInlineFormatter,
    InlineFormatTool: InlineFormatTool,
    FontTool: FontTool,
    ColorTool: ColorTool
});

registerFormat("bold", [ { tags: ["strong", "b"] }, { tags: ["span"], attr: { style: { fontWeight: "bold" } } } ]);
registerTool("bold", new InlineFormatTool({
    key: "B",
    ctrl: true,
    format: formats.bold,
    ui: {
        togglable: true
    }
}));

registerFormat("italic", [ { tags: ["em", "i"] }, { tags: ["span"], attr: { style: { fontStyle: "italic" } } } ]);
registerTool("italic", new InlineFormatTool({
    key: "I",
    ctrl: true,
    format: formats.italic,
    ui: {
        togglable: true
    }
}));

registerFormat("underline", [ { tags: ["span"], attr: { style: { textDecoration: "underline" } } }, { tags: ["u"] } ]);
registerTool("underline", new InlineFormatTool({
    key: "U",
    ctrl: true,
    format: formats.underline,
    ui: {
        togglable: true
    }
}));

registerFormat("strikethrough", [ { tags: ["del", "strike"] }, { tags: ["span"], attr: { style: { textDecoration: "line-through" } } } ]);
registerTool("strikethrough", new InlineFormatTool({
    format: formats.strikethrough,
    ui: {
        togglable: true
    }
}));

registerFormat("superscript", [ { tags: ["sup"] } ]);
registerTool("superscript", new InlineFormatTool({
    format: formats.superscript,
    ui: {
        togglable: true
    }
}));

registerFormat("subscript", [ { tags: ["sub"] } ]);
registerTool("subscript", new InlineFormatTool({
    format: formats.subscript,
    ui: {
        togglable: true
    }
}));

registerTool("foreColor", new ColorTool({
    cssAttr: "color",
    fontAttr: "color",
    domAttr: "color",
    name: "foreColor",
    ui: {
        type: "component",
        overflow: "never",
        component: "ColorPicker",
        componentOptions: {
            views: ["palette"],
            toolIcon: "foreground-color",
            palette: "websafe",
            columns: 18,
            preview: false,
            input: false,
            buttons: false,
            commandOn: "change",
            closeOnSelect: true
        }
    }
}));

registerTool("backColor", new ColorTool({
    cssAttr: "background-color",
    domAttr: "backgroundColor",
    name: "backColor",
    ui: {
        type: "component",
        overflow: "never",
        component: "ColorPicker",
        componentOptions: {
            views: ["palette"],
            toolIcon: "droplet",
            palette: "websafe",
            columns: 18,
            preview: false,
            input: false,
            buttons: false,
            commandOn: "change",
            closeOnSelect: true
        }
    }
}));

registerTool("fontName", new FontTool({
    cssAttr: "font-family",
    fontAttr: "face",
    domAttr: "fontFamily",
    name: "fontName",
    defaultValue: [{ text: "fontNameInherit", value: "inherit" }],
    ui: {
        type: "component",
        component: "ComboBox",
        componentOptions: {
            dataValueField: "value",
            dataTextField: "text",
            valuePrimitive: true
        },
        overflow: "never"
    }
}));

registerTool("fontSize", new FontTool({
    cssAttr: "font-size",
    fontAttr: "size",
    domAttr: "fontSize",
    name: "fontSize",
    defaultValue: [{ text: "fontSizeInherit", value: "inherit" }],
    ui: {
        type: "component",
        component: "ComboBox",
        componentOptions: {
            dataValueField: "value",
            dataTextField: "text",
            valuePrimitive: true
        },
        overflow: "never"
    }
}));

})(window.kendo.jQuery);

(function($, undefined$1) {

var kendo = window.kendo,
    encode = kendo.htmlEncode,
    Class = kendo.Class,
    extend = $.extend,
    Editor = kendo.ui.editor,
    dom = Editor.Dom,
    RangeUtils = Editor.RangeUtils,
    Command = Editor.Command,
    Tool = Editor.Tool,
    InlineFormatter = Editor.InlineFormatter,
    InlineFormatFinder = Editor.InlineFormatFinder,
    textNodes = RangeUtils.textNodes,
    editableTextNodes = RangeUtils.editableTextNodes,
    registerTool = Editor.EditorUtils.registerTool,
    keys = kendo.keys;

var HTTP_PROTOCOL = "http://";
var protocolRegExp = /^\w*:\/\//;
var endLinkCharsRegExp = /[\w\/\$\-_\*\?]/i;

var LinkFormatFinder = Class.extend({
    findSuitable: function(sourceNode) {
        return dom.parentOfType(sourceNode, ["a"]);
    }
});

var LinkFormatter = Class.extend({
    init: function() {
        this.finder = new LinkFormatFinder();
    },

    apply: function(range, attributes) {
        var nodes = this.immutables ? editableTextNodes(range) : textNodes(range);
        var markers, doc, formatter, a, parent;

        if (attributes.innerText) {
            doc = RangeUtils.documentFromRange(range);
            markers = RangeUtils.getMarkers(range);

            range.deleteContents();
            a = dom.create(doc, "a", attributes);
            range.insertNode(a);

            parent = a.parentNode;
            if (dom.name(parent) == "a") {
                dom.insertAfter(a, parent);
            }

            if (dom.emptyNode(parent)) {
                dom.remove(parent);
            }

            // move range and markers after inserted link
            var ref = a;
            for (var i = 0; i < markers.length; i++) {
                dom.insertAfter(markers[i], ref);
                ref = markers[i];
            }

            if (markers.length) {
                dom.insertBefore(doc.createTextNode("\ufeff"), markers[1] || markers[0]);
                dom.insertAfter(doc.createTextNode("\ufeff"), markers[1] || markers[0]);
                range.setStartBefore(markers[0]);
                range.setEndAfter(markers[markers.length - 1]);
            }
        } else {
            formatter = new InlineFormatter([{ tags: ["a"] }], attributes);
            formatter.finder = this.finder;
            formatter.apply(nodes);
        }
    }
});

var UnlinkCommand = Command.extend({
    init: function(options) {
        var that = this;
        options.formatter = /** @ignore */ {
            toggle: function(range) {
                var nodes = that.immutables() ? editableTextNodes(range) : textNodes(range);
                new InlineFormatter([{ tags: ["a"] }]).remove(nodes);
            }
        };
        this.options = options;
        Command.fn.init.call(this, options);
    }
});

var LinkCommand = Command.extend({
    init: function(options) {
        var that;
        this.options = options;
        Command.fn.init.call(this, options);
        this.formatter = new LinkFormatter();

        if (!options.url) {
            this.attributes = null;
            this.async = true;
        } else {
            this.exec = function() {
                this.formatter.immutables = that;
                this.formatter.apply(options.range, {
                    href: options.url,
                    innerText: options.text || options.url,
                    target: options.target
                });
            };
        }
    },

    exec: function() {
        var messages = this.editor.options.messages;
        this._initialText = "";
        this._range = this.lockRange(true);
        this.formatter.immutables = this.immutables();

        var nodes = textNodes(this._range);
        var a = nodes.length ? this.formatter.finder.findSuitable(nodes[0]) : null;
        var img = nodes.length && dom.name(nodes[0]) == "img";

        var dialog = this.createDialog("<div/>", {
            title: messages.createLink,
            minWidth: 340,
            close: this._close.bind(this),
            visible: false
        }).data("kendoWindow");

        this._form = this._createForm(dialog);

        if (a) {
            this._range.selectNodeContents(a);
            nodes = textNodes(this._range);
        }

        this._initialText = this.linkText(nodes);

        dialog.wrapper
            .find(".k-dialog-insert").on("click", this._apply.bind(this)).end()
            .find(".k-dialog-close").on("click", this._close.bind(this)).end()
            .find(".k-form-field input").on("keydown", this._keydown.bind(this)).end()
            .find("#k-editor-link-url").val(this.linkUrl(a)).end()
            .find("#k-editor-link-text").val(this._initialText).end()
            .find("#k-editor-link-title").val(a ? a.title : "").end()
            .find("#k-editor-link-target").prop("checked", a ? a.target == "_blank" : false).end()
            .find(".k-editor-link-text-row").toggle(!img);

        this._dialog = dialog.center().open();

        $("#k-editor-link-url", dialog.element).trigger("focus").select();
    },

    _createForm: function(dialog) {
        var that = this;
        var formElement = $("<div/>").appendTo(dialog.element);
        var messages = that.editor.options.messages;
        var form = formElement.kendoForm({
            renderButtons: false,
            items: [
                {
                    field: "k-editor-link-url",
                    label: encode(messages.linkWebAddress),
                    title: encode(messages.linkWebAddress),
                    editor: "TextBox"
                },
                {
                    field: "k-editor-link-text",
                    label: encode(messages.linkText),
                    title: encode(messages.linkText),
                    editor: "TextBox"
                },
                {
                    field: "k-editor-link-title",
                    label: encode(messages.linkToolTip),
                    title: encode(messages.linkToolTip),
                    editor: "TextBox"
                },
                {
                    field: "k-editor-link-target",
                    editorOptions: {
                        label: encode(messages.linkOpenInNewWindow)
                    },
                    label: "",
                    title: encode(messages.linkOpenInNewWindow),
                    editor: "CheckBox"
                }
            ]
        }).data("kendoForm");

        formElement.find("#k-editor-link-text").parents(".k-form-field").addClass("k-editor-link-text-row");

        dialog.element.after($(that._actionButtonsTemplate({ messages, insertButtonIcon: "link", cancelButtonIcon: "cancel-outline" })));

        return form;
    },

    _keydown: function(e) {
        var keys = kendo.keys;

        if (e.keyCode == keys.ENTER) {
            this._apply(e);
        } else if (e.keyCode == keys.ESC) {
            this._close(e);
        }
    },

    _apply: function(e) {
        var element = this._dialog.element;
        var href = $("#k-editor-link-url", element).val();
        var title, text, target;
        var textInput = $("#k-editor-link-text", element);

        if (href && href != HTTP_PROTOCOL) {

            if (href.indexOf("@") > 0 && !/^(\w+:)|(\/\/)/i.test(href)) {
                href = "mailto:" + href;
            }

            this.attributes = { href: href };

            title = $("#k-editor-link-title", element).val();
            if (title) {
                this.attributes.title = title;
            }

            if (textInput.is(":visible")) {
                text = kendo.trim(textInput.val());
                if (!text && !this._initialText) {
                    this.attributes.innerText = href;
                } else if (text && (text !== this._initialText)) {
                    this.attributes.innerText = dom.stripBom(text);
                }
            }

            target = $("#k-editor-link-target", element).is(":checked");
            this.attributes.target = target ? "_blank" : null;

            this.formatter.apply(this._range, this.attributes);
        }

        this._close(e);

        if (this.change) {
            this.change();
        }
    },

    _close: function(e) {
        e.preventDefault();
        this._form.destroy();
        this._dialog.destroy();

        dom.windowFromDocument(RangeUtils.documentFromRange(this._range)).focus();

        this.releaseRange(this._range);
    },

    linkUrl: function(anchor) {
        if (anchor) {
            // IE < 8 returns absolute url if getAttribute is not used
            return anchor.getAttribute("href", 2);
        }

        return HTTP_PROTOCOL;
    },

    linkText: function(nodes) {
        var text = "";
        var i;

        for (i = 0; i < nodes.length; i++) {
            text += nodes[i].nodeValue;
        }

        return dom.stripBom(text || "");
    },

    redo: function() {
        var range = this.lockRange(true);

        this.formatter.apply(range, this.attributes);
        this.releaseRange(range);
    }

});

var AutoLinkCommand = Command.extend({
    init: function(options) {
        Command.fn.init.call(this, options);

        this.formatter = new LinkFormatter();
    },

    exec: function() {
        var detectedLink = this.detectLink();
        if (!detectedLink) {
            return;
        }

        var range = this.getRange();
        var linkMarker = new kendo.ui.editor.Marker();
        var linkRange = range.cloneRange();

        linkRange.setStart(detectedLink.start.node, detectedLink.start.offset);
        linkRange.setEnd(detectedLink.end.node, detectedLink.end.offset);

        range = this.lockRange();
        linkMarker.add(linkRange);

        this.formatter.apply(linkRange, {
            href: this._ensureWebProtocol(detectedLink.text)
        });

        linkMarker.remove(linkRange);
        this.releaseRange(range);
    },

    detectLink: function() {
        var range = this.getRange();
        var startNode = range.startContainer;
        var startOffset = range.startOffset;
        var prev = startNode.previousSibling;
        if (!prev && ((dom.isBom(startNode) && !startNode.nextSibling) || (!startOffset && dom.isDataNode(startNode)))) {
            startNode = startNode.parentNode;
            startOffset = 0;
        }
        var traverser = new LeftDomTextTraverser({
            node: startNode,
            offset: startOffset,
            cancelAtNode: function(node) { return node && dom.name(node) === "a"; }
        });

        var detection = new DomTextLinkDetection(traverser);
        return detection.detectLink();
    },

    changesContent: function() {
        return !!this.detectLink();
    },

    _ensureWebProtocol: function(linkText) {
        var hasProtocol = this._hasProtocolPrefix(linkText);
        return hasProtocol ? linkText : this._prefixWithWebProtocol(linkText);
    },

    _hasProtocolPrefix: function(linkText) {
        return protocolRegExp.test(linkText);
    },

    _prefixWithWebProtocol: function(linkText) {
        return HTTP_PROTOCOL + linkText;
    }
});

var UnlinkTool = Tool.extend({
    init: function(options) {
        this.options = options;
        this.finder = new InlineFormatFinder([{ tags: ["a"] }]);

        Tool.fn.init.call(this, $.extend(options, { command: UnlinkCommand }));
    },

    update: function(ui, nodes) {
        var isLink = this.finder.isFormatted(nodes),
            toolbar = ui.closest(".k-toolbar").data("kendoToolBar");

        if (isLink) {
            toolbar.enable(ui, true);
        } else {
            toolbar.enable(ui, false);
        }
    }
});

var DomTextLinkDetection = Class.extend({
    init: function(traverser) {
        this.traverser = traverser;
        this.start = DomPos();
        this.end = DomPos();
        this.text = "";
    },

    detectLink: function() {
        var node = this.traverser.node;
        var offset = this.traverser.offset;
        if (dom.isDataNode(node)) {
            var text = node.data.substring(0, offset);
            if (/\s{2}$/.test(dom.stripBom(text))) {
                return;
            }
        } else if (offset === 0) {//heuristic for new line
            var p = dom.closestEditableOfType(node, dom.blockElements);
            if (p && p.previousSibling) {
                this.traverser.init({
                    node: p.previousSibling
                });
            }
        }

        this.traverser.traverse(this._detectEnd.bind(this));
        if (!this.end.blank()) {
            this.traverser = this.traverser.clone(this.end);
            this.traverser.traverse(this._detectStart.bind(this));

            if (!this._isLinkDetected()) {
                var puntuationOptions = this.traverser.extendOptions(this.start);
                var puntuationTraverser = new RightDomTextTraverser(puntuationOptions);
                puntuationTraverser.traverse(this._skipStartPuntuation.bind(this));
                if (!this._isLinkDetected()) {
                    this.start = DomPos();
                }
            }
        }

        if (this.start.blank()) {
            return null;
        } else {
            return {
                start: this.start,
                end: this.end,
                text: this.text
            };
        }
    },

    _isLinkDetected: function() {
        return protocolRegExp.test(this.text) || /^w{3}\./i.test(this.text);
    },

    _detectEnd: function(text, node) {
        var i = lastIndexOfRegExp(text, endLinkCharsRegExp);
        if (i > -1) {
            this.end.node = node;
            this.end.offset = i + 1;

            return false;
        }
    },

    _detectStart: function(text, node) {
        var i = lastIndexOfRegExp(text, /\s/);
        var ii = i + 1;
        this.text = text.substring(ii) + this.text;

        this.start.node = node;
        this.start.offset = ii;

        if (i > -1) {
            return false;
        }
    },

    _skipStartPuntuation: function(text, node, offset) {
        var i = indexOfRegExp(text, /\w/);
        var ii = i;
        if (i === -1) {
            ii = text.length;
        }

        this.text = this.text.substring(ii);
        this.start.node = node;
        this.start.offset = ii + (offset | 0);

        if (i > -1) {
            return false;
        }
    }
});

function lastIndexOfRegExp(str, search) {
    var i = str.length;
    while (i-- && !search.test(str[i])) {}

    return i;
}
function indexOfRegExp(str, search) {
    var r = search.exec(str);

    return r ? r.index : -1;
}

var DomPos = function() {
    return {
        node: null,
        offset: null,
        blank: function() {
            return this.node === null && this.offset === null;
        }
    };
};

var DomTextTraverser = Class.extend({
    init: function(options) {
        this.node = options.node;
        this.offset = options.offset === undefined$1 ? (dom.isDataNode(this.node) && this.node.length) || 0 : options.offset;
        this.cancelAtNode = options.cancelAtNode || this.cancelAtNode || $.noop;
    },

    traverse: function(callback) {
        if (!callback) {
            return;
        }
        this.cancel = false;
        this._traverse(callback, this.node, this.offset);
    },

    _traverse: function(callback, node, offset) {
        if (!node || this.cancel) {
            return;
        }
        if (node.nodeType === 3) {
            var text = node.data;
            if (offset !== undefined$1) {
                text = this.subText(text, offset);
            }
            this.cancel = (callback(text, node, offset) === false);
        }
        else {
            var edgeNode = this.edgeNode(node);
            this.cancel = this.cancel || this.cancelAtNode(edgeNode);
            return this._traverse(callback, edgeNode);
        }

        var next = this.next(node);
        if (!next) {
            var parent = node.parentNode;
            while (!next && dom.isInline(parent)) {
                next = this.next(parent);
                parent = parent.parentNode;
            }
        }
        this.cancel = this.cancel || this.cancelAtNode(next);
        this._traverse(callback, next);
    },

    extendOptions: function(o) {
        return $.extend({
            node: this.node,
            offset: this.offset,
            cancelAtNode: this.cancelAtNode
        }, o || {});
    },

    edgeNode: function(node) {},
    next: function(node) {},
    subText: function(text, offset) {}

});

var LeftDomTextTraverser = DomTextTraverser.extend({
    subText: function(text, splitIndex) {
        return text.substring(0, splitIndex);
    },

    next: function(node) {
        return node.previousSibling;
    },

    edgeNode: function(node) {
        return node.lastChild;
    },

    clone: function(options) {
        var o = this.extendOptions(options);
        return new LeftDomTextTraverser(o);
    }
});

var RightDomTextTraverser = DomTextTraverser.extend({
    subText: function(text, splitIndex) {
        return text.substring(splitIndex);
    },

    next: function(node) {
        return node.nextSibling;
    },

    edgeNode: function(node) {
        return node.firstChild;
    },

    clone: function(options) {
        var o = this.extendOptions(options);
        return new RightDomTextTraverser(o);
    }
});

extend(kendo.ui.editor, {
    LinkFormatFinder: LinkFormatFinder,
    LinkFormatter: LinkFormatter,
    UnlinkCommand: UnlinkCommand,
    LinkCommand: LinkCommand,
    AutoLinkCommand: AutoLinkCommand,
    UnlinkTool: UnlinkTool,
    DomTextLinkDetection: DomTextLinkDetection,
    LeftDomTextTraverser: LeftDomTextTraverser,
    RightDomTextTraverser: RightDomTextTraverser
});

registerTool("createLink", new Tool({ key: "K", ctrl: true, command: LinkCommand }));
registerTool("unlink", new UnlinkTool({ key: "K", ctrl: true, shift: true, ui: { enable: false } }));
registerTool("autoLink", new Tool({ key: [keys.ENTER, keys.SPACEBAR], keyPressCommand: true, command: AutoLinkCommand }));

})(window.kendo.jQuery);

(function($) {

var kendo = window.kendo,
    Class = kendo.Class,
    extend = $.extend,
    Editor = kendo.ui.editor,
    formats = kendo.ui.Editor.fn.options.formats,
    dom = Editor.Dom,
    FormatTool = Editor.FormatTool,
    EditorUtils = Editor.EditorUtils,
    registerTool = EditorUtils.registerTool,
    registerFormat = EditorUtils.registerFormat,
    RangeUtils = Editor.RangeUtils;

var BlockFormatFinder = Class.extend({
    init: function(format) {
        this.format = format;
    },

    contains: function(node, children) {
        var i, len, child;

        for (i = 0, len = children.length; i < len; i++) {
            child = children[i];
            if (!child || !dom.isAncestorOrSelf(node, child)) {
                return false;
            }
        }

        return true;
    },

    findSuitable: function(nodes) {
        var format = this.format,
            suitable = [],
            i, len, candidate;

        for (i = 0, len = nodes.length; i < len; i++) {
            for (var f = format.length - 1; f >= 0; f--) {
                candidate = dom.ofType(nodes[i], format[f].tags) ? nodes[i] : dom.closestEditableOfType(nodes[i], format[f].tags);
                if (candidate) {
                    break;
                }
            }

            if (!candidate || candidate.contentEditable === 'true') {
                return [];
            }

            if ($.inArray(candidate, suitable) < 0) {
                suitable.push(candidate);
            }
        }

        this._resolveListsItems(suitable);

        for (i = 0, len = suitable.length; i < len; i++) {
            if (this.contains(suitable[i], suitable)) {
                return [suitable[i]];
            }
        }

        return suitable;
    },
    _resolveListsItems: function(nodes) {
        var i, node, wrapper;
        for (i = 0; i < nodes.length; i++) {
            node = nodes[i];
            wrapper = dom.is(node, "li") ? node : dom.wrapper(node);
            wrapper = wrapper && dom.list(wrapper) ? wrapper.children[0] : wrapper;
            if (dom.is(wrapper, "li")) {
                nodes[i] = wrapper;
            }
        }
    },

    findFormat: function(sourceNode, until) {
        var format = this.format,
            i, len, node, tags, attributes;
        var editableParent = dom.editableParent(sourceNode);
        var immutables = this.options && this.options.immutables;
        var ImmutablesNS = Editor.Immutables;

        for (i = 0, len = format.length; i < len; i++) {
            node = sourceNode;
            tags = format[i].tags;
            attributes = format[i].attr;

            if (immutables && tags && tags[0] == "immutable") {
                var immutable = ImmutablesNS.immutableParent(node);
                if (immutable && dom.attrEquals(immutable, attributes)) {
                    return node;
                }
            }

            while (node && dom.isAncestorOf(editableParent, node)) {
                if (dom.ofType(node, tags) && dom.attrEquals(node, attributes)) {
                    return node;
                }

                if (until && until(node)) {
                    break;
                }

                node = node.parentNode;
            }
        }
        return null;
    },

    getFormat: function(nodes) {
        var that = this,
            findFormat = function(node) {
                    return that.findFormat(dom.isDataNode(node) ? node.parentNode : node);
                },
            result = findFormat(nodes[0]),
            i, len;

        if (!result) {
            return "";
        }

        for (i = 1, len = nodes.length; i < len; i++) {
            if (result != findFormat(nodes[i])) {
                return "";
            }
        }

        return result.nodeName.toLowerCase();
    },

    isFormatted: function(nodes, until) {
        for (var i = 0, len = nodes.length; i < len; i++) {
            if (!this.findFormat(nodes[i], until)) {
                return false;
            }
        }

        return true;
    }
});

var BlockFormatter = Class.extend({
    init: function(format, values) {
        this.format = format;
        this.values = values;
        this.finder = new BlockFormatFinder(format);
    },

    wrap: function(tag, attributes, nodes) {

        var commonAncestor = nodes.length == 1 ? dom.blockParentOrBody(nodes[0]) : dom.commonAncestor.apply(null, nodes);

        if (dom.isInline(commonAncestor)) {
            commonAncestor = dom.blockParentOrBody(commonAncestor);
        }

        var ancestors = dom.significantChildNodes(commonAncestor),
            position = dom.findNodeIndex(ancestors[0]),
            wrapper = dom.create(commonAncestor.ownerDocument, tag, attributes),
            i, ancestor;

        for (i = 0; i < ancestors.length; i++) {
            ancestor = ancestors[i];
            if (dom.isBlock(ancestor)) {
                dom.attr(ancestor, attributes);

                if (wrapper.childNodes.length) {
                    dom.insertBefore(wrapper, ancestor);
                    wrapper = wrapper.cloneNode(false);
                }

                position = dom.findNodeIndex(ancestor) + 1;

                continue;
            }

            wrapper.appendChild(ancestor);
        }

        if (wrapper.firstChild) {
            dom.insertAt(commonAncestor, wrapper, position);
        }
    },

    apply: function(nodes) {
        var format, values = this.values;

        function attributes(format) {
            return extend({}, format && format.attr, values);
        }

        this._handleImmutables(nodes, true);

        var images = dom.filter("img", nodes);
        var imageFormat = EditorUtils.formatByName("img", this.format);
        var imageAttributes = attributes(imageFormat);
        $.each(images, function() {
            dom.attr(this, imageAttributes);
        });

        // only images were selected, no need to wrap
        if (images.length == nodes.length) {
            return;
        }

        var nonImages = dom.filter("img", nodes, true);
        var formatNodes = this.finder.findSuitable(nonImages);

        if (formatNodes.length) {
            for (var i = 0, len = formatNodes.length; i < len; i++) {
                format = EditorUtils.formatByName(dom.name(formatNodes[i]), this.format);
                dom.attr(formatNodes[i], attributes(format));
            }
        } else {
            format = this.format[0];
            this.wrap(format.tags[0], attributes(format), nonImages);
        }
    },

    _handleImmutables: function(nodes, applyFormatting) {
        if (!this.immutables()) {
            return;
        }
        var immutableFormat = EditorUtils.formatByName("immutable", this.format);
        if (!immutableFormat) {
            return;
        }
        var ImmutablesNS = Editor.Immutables;
        var l = nodes.length - 1;
        for (var i = l; i >= 0; i--) {
            var immutableParent = ImmutablesNS.immutableParent(nodes[i]);
            if (!immutableParent) {
                continue;
            }
            if (immutableParent !== nodes[i + 1]) {
                if (applyFormatting) {
                    dom.attr(immutableParent, immutableFormat.attr);
                } else {
                    dom.unstyle(immutableParent, immutableFormat.attr.style);
                }
            }
            nodes.splice(i, 1);
        }
    },

    immutables: function() {
        return this.editor && this.editor.options.immutables;
    },

    remove: function(nodes) {
        var i, l, formatNode, namedFormat, name;

        this._handleImmutables(nodes, false);

        for (i = 0, l = nodes.length; i < l; i++) {
            formatNode = this.finder.findFormat(nodes[i]);
            if (formatNode) {
                name = dom.name(formatNode);
                namedFormat = EditorUtils.formatByName(name, this.format);
                if (namedFormat.attr.style) {
                    dom.unstyle(formatNode, namedFormat.attr.style);
                }
                if (namedFormat.attr.className) {
                    dom.removeClass(formatNode, namedFormat.attr.className);
                }
            }
        }
    },

    toggle: function(range) {
        var that = this,
            nodes = dom.filterBy(RangeUtils.nodes(range), dom.htmlIndentSpace, true);

        if (that.finder.isFormatted(nodes)) {
            that.remove(nodes);
        } else {
            that.apply(nodes);
        }
    }
});

var GreedyBlockFormatter = Class.extend({
    init: function(format, values) {
        var that = this;
        that.format = format;
        that.values = values;
        that.finder = new BlockFormatFinder(format);
    },

    apply: function(nodes) {
        var format = this.format;
        var blocks = dom.blockParents(nodes);
        var formatTag = format[0].tags[0];
        var i, len, list, formatter, range;
        var element;
        var tagName;
        var block;
        var immutalbeParent;

        if (blocks.length) {
            for (i = 0, len = blocks.length; i < len; i++) {
                block = blocks[i];
                immutalbeParent = this.immutables() && Editor.Immutables.immutableParent(block);

                if (!immutalbeParent) {
                    tagName = dom.name(block);

                    if (tagName == "li") {
                        list = block.parentNode;
                        formatter = new Editor.ListFormatter(list.nodeName.toLowerCase(), formatTag);
                        range = this.editor.createRange();
                        range.selectNode(blocks[i]);
                        formatter.toggle(range);
                    } else if (formatTag && (tagName == "td" || block.attributes.contentEditable)) {
                        new BlockFormatter(format, this.values).apply(block.childNodes);
                    } else {
                        element = dom.changeTag(block, formatTag);
                        dom.attr(element, format[0].attr);
                    }
                }
            }
        } else {
            var blockFormatter = new BlockFormatter(format, this.values);
            blockFormatter.editor = this.editor;
            blockFormatter.apply(nodes);
        }
    },

    toggle: function(range) {
        var nodes = RangeUtils.textNodes(range);
        if (!nodes.length) {
            range.selectNodeContents(range.commonAncestorContainer);
            nodes = RangeUtils.textNodes(range);
            if (!nodes.length) {
                nodes = dom.significantChildNodes(range.commonAncestorContainer);
            }
        }

        this.apply(nodes);
    },

    immutables: function() {
        return this.editor && this.editor.options.immutables;
    }
});

var BlockFormatTool = FormatTool.extend({ init: function(options) {
        FormatTool.fn.init.call(this, extend(options, {
            finder: new BlockFormatFinder(options.format),
            formatter: function() {
                return new BlockFormatter(options.format);
            }
        }));
    }
});

extend(Editor, {
    BlockFormatFinder: BlockFormatFinder,
    BlockFormatter: BlockFormatter,
    GreedyBlockFormatter: GreedyBlockFormatter,
    BlockFormatTool: BlockFormatTool
});

var listElements = ["ul","ol","li"];

registerFormat("justifyLeft", [
    { tags: dom.nonListBlockElements, attr: { style: { textAlign: "left" } } },
    { tags: ["img"], attr: { style: { "float": "left", display: "", marginLeft: "", marginRight: "" } } },
    { tags: ["immutable"], attr: { style: { "float": "left", display: "", marginLeft: "", marginRight: "" } } },
    { tags: listElements, attr: { style: { textAlign: "left", listStylePosition: "" } } }
]);
registerTool("justifyLeft", new BlockFormatTool({
    format: formats.justifyLeft,
    ui: {
        togglable: true,
        group: "align"
    }
}));

registerFormat("justifyCenter", [
    { tags: dom.nonListBlockElements, attr: { style: { textAlign: "center" } } },
    { tags: ["img"], attr: { style: { display: "block", marginLeft: "auto", marginRight: "auto", "float": "" } } },
    { tags: ["immutable"], attr: { style: { display: "block", marginLeft: "auto", marginRight: "auto", "float": "" } } },
    { tags: listElements, attr: { style: { textAlign: "center", listStylePosition: "inside" } } }
]);
registerTool("justifyCenter", new BlockFormatTool({
    format: formats.justifyCenter,
    ui: {
        togglable: true,
        group: "align"
    }
}));

registerFormat("justifyRight", [
    { tags: dom.nonListBlockElements, attr: { style: { textAlign: "right" } } },
    { tags: ["img"], attr: { style: { "float": "right", display: "", marginLeft: "", marginRight: "" } } },
    { tags: ["immutable"], attr: { style: { "float": "right", display: "", marginLeft: "", marginRight: "" } } },
    { tags: listElements, attr: { style: { textAlign: "right", listStylePosition: "inside" } } }
]);
registerTool("justifyRight", new BlockFormatTool({
    format: formats.justifyRight,
    ui: {
        togglable: true,
        group: "align"
    }
}));

registerFormat("justifyFull", [
    { tags: dom.nonListBlockElements, attr: { style: { textAlign: "justify" } } },
    { tags: ["img"], attr: { style: { display: "block", marginLeft: "auto", marginRight: "auto", "float": "" } } },
    { tags: ["immutable"], attr: { style: { display: "block", marginLeft: "auto", marginRight: "auto", "float": "" } } },
    { tags: listElements, attr: { style: { textAlign: "justify", listStylePosition: "" } } }
]);
registerTool("justifyFull", new BlockFormatTool({
    format: formats.justifyFull,
    ui: {
        togglable: true,
        group: "align"
    }
}));

})(window.kendo.jQuery);

(function($) {

// Imports ================================================================
var kendo = window.kendo,
    Class = kendo.Class,
    extend = $.extend,
    Editor = kendo.ui.editor,
    dom = Editor.Dom,
    RangeUtils = Editor.RangeUtils,
    Command = Editor.Command,
    FormatTool = Editor.FormatTool,
    BlockFormatFinder = Editor.BlockFormatFinder,
    textNodes = RangeUtils.textNodes,
    registerTool = Editor.EditorUtils.registerTool;

var ListFormatFinder = BlockFormatFinder.extend({
    init: function(options) {
        this.tag = options.tag;
        this.attr = options.attr;
        this.altAttr = options.altAttr;

        var tags = this.tags = [this.tag == 'ul' ? 'ol' : 'ul', this.tag];
        var format = [{ tags: tags, attr: this.attr }];

        if (this.altAttr) {
            format.push({
                tags: tags,
                attr: this.altAttr
            });
        }

        BlockFormatFinder.fn.init.call(this, format);
    },

    matchesType: function(node) {
        return dom.attrEquals(node, this.attr) || (this.altAttr && dom.attrEquals(node, this.altAttr));
    },

    isList: function(node) {
        return dom.list(node);
    },

    isFormatted: function(nodes) {
        var formatNodes = [];
        var formatNode, i;

        for (i = 0; i < nodes.length; i++) {
            formatNode = this.findFormat(nodes[i], this.isList);

            if (formatNode && dom.name(formatNode) == this.tag && this.matchesType(formatNode)) {
                formatNodes.push(formatNode);
            }
        }

        if (formatNodes.length < 1) {
            return false;
        }

        if (formatNodes.length != nodes.length) {
            return false;
        }

        // check if sequential lists are selected
        for (i = 0; i < formatNodes.length; i++) {
            if (formatNodes[i].parentNode != formatNode.parentNode) {
                break;
            }

            if (formatNodes[i] != formatNode) {
                return false;
            }
        }

        return true;
    },

    findSuitable: function(nodes) {
        var candidate = this.findFormat(nodes[0], this.isList);

        if (candidate && dom.name(candidate) == this.tag) {
            return candidate;
        }

        return null;
    }

});

var ListFormatter = Class.extend({
    init: function(options, unwrapTag) {
        var that = this;
        options = $.isPlainObject(options) ? options : { tag: options, attr: null };
        that.tag = options.tag;
        that.attr = options.attr;
        that.finder = new ListFormatFinder(options);
        that.unwrapTag = unwrapTag;
    },

    isList: function(node) {
        return dom.list(node);
    },

    immutables: function() {
        return this.editor && !!this.editor.options.immutables;
    },

    wrap: function(list, nodes) {
        var li = dom.create(list.ownerDocument, "li"),
            i, node,
            isImmutable = this.immutables() ? Editor.Immutables.immutable : $.noop;

        for (i = 0; i < nodes.length; i++) {
            node = nodes[i];

            if (dom.is(node, 'li')) {
                list.appendChild(node);
                continue;
            }

            if (this.isList(node)) {
                while (node.firstChild) {
                    list.appendChild(node.firstChild);
                }
                continue;
            }

            if (dom.is(node, "td")) {
                while (node.firstChild) {
                    li.appendChild(node.firstChild);
                }
                list.appendChild(li);
                node.appendChild(list);
                list = list.cloneNode(false);
                li = li.cloneNode(false);
                continue;
            }

            li.appendChild(node);

            if (dom.isBlock(node)) {
                list.appendChild(li);
                if (!isImmutable(node)) {
                    dom.unwrap(node);
                }
                li = li.cloneNode(false);
            }
        }

        if (li.firstChild) {
            list.appendChild(li);
        }
    },

    containsAny: function(parent, nodes) {
        for (var i = 0; i < nodes.length; i++) {
            if (dom.isAncestorOrSelf(parent, nodes[i])) {
                return true;
            }
        }

        return false;
    },

    suitable: function(candidate, nodes) {
        if (candidate.className == "k-marker") {
            var sibling = candidate.nextSibling;

            if (sibling && dom.isBlock(sibling)) {
                return false;
            }

            sibling = candidate.previousSibling;

            if (sibling && dom.isBlock(sibling)) {
                return false;
            }
        }

        return this.containsAny(candidate, nodes) || dom.isInline(candidate) || candidate.nodeType == 3;
    },

    _parentLists: function(node) {
        var editable = dom.closestEditable(node);

        return $(node).parentsUntil(editable, "ul,ol");
    },

    split: function(range) {
        var nodes = textNodes(range);
        var start, end, parents;

        if (nodes.length) {
            start = dom.parentOfType(nodes[0], ['li']);
            end = dom.parentOfType(nodes[nodes.length - 1], ['li']);
            range.setStartBefore(start);
            range.setEndAfter(end);

            for (var i = 0, l = nodes.length; i < l; i++) {
                var formatNode = this.finder.findFormat(nodes[i]);
                if (formatNode) {
                    parents = this._parentLists(formatNode);
                    if (parents.length) {
                        RangeUtils.split(range, parents.last()[0], true);
                    } else {
                        RangeUtils.split(range, formatNode, true);
                    }
                }
            }
        }
    },

    merge: function(tag, formatNode) {
        var prev = formatNode.previousSibling, next;

        while (prev && (prev.className == "k-marker" || (prev.nodeType == 3 && dom.isWhitespace(prev)))) {
            prev = prev.previousSibling;
        }

        // merge with previous list
        if (prev && dom.name(prev) == tag && this.finder.matchesType(prev)) {
            while (formatNode.firstChild) {
                prev.appendChild(formatNode.firstChild);
            }
            dom.remove(formatNode);
            formatNode = prev;
        }

        next = formatNode.nextSibling;
        while (next && (next.className == "k-marker" || (next.nodeType == 3 && dom.isWhitespace(next)))) {
            next = next.nextSibling;
        }

        // merge with next list
        if (next && dom.name(next) == tag && this.finder.matchesType(next)) {
            while (formatNode.lastChild) {
                next.insertBefore(formatNode.lastChild, next.firstChild);
            }
            dom.remove(formatNode);
        }
    },

    breakable: function(node) {
        return (
            node != node.ownerDocument.body &&
            !/table|tbody|thead|tr|td/.test(dom.name(node)) &&
            !node.attributes.contentEditable
        );
    },

    findSuitableNode: function(nodes) {
        var that = this,
            finder = that.finder,
            tag = that.tag,
            formatNode;

        formatNode = finder.findSuitable(nodes);

        if (!formatNode) {
            // Find the opposite tag
            finder = new ListFormatFinder({ tag: tag == "ul" ? "ol" : "ul" });
            formatNode = finder.findSuitable(nodes);
        }

        if (!formatNode) {
            // Find the same tag
            finder = new ListFormatFinder({ tag: tag });
            formatNode = finder.findSuitable(nodes);
            formatNode = formatNode && that.finder.matchesType(formatNode) ? null : formatNode;
        }


        return formatNode;
    },

    applyOnSection: function(section, nodes) {
        var tag = this.tag;
        var attr = this.attr;
        var commonAncestor = dom.closestSplittableParent(nodes);

        var ancestors = [];
        var formatNode = this.findSuitableNode(nodes);

        var childNodes;

        if (/table|tbody|thead/.test(dom.name(commonAncestor))) {
            childNodes = $.map(nodes, function(node) {
                return dom.parentOfType(node, ["td"]);
            });
        } else {
            childNodes = dom.significantChildNodes(commonAncestor);

            if ($.grep(childNodes, dom.isBlock).length) {
                childNodes = $.grep(childNodes, (function(node) {
                    return this.containsAny(node, nodes);
                }).bind(this));
            }

            if (!childNodes.length) {
                childNodes = nodes;
            }
        }

        function pushAncestor() {
            ancestors.push(this);
        }

        for (var i = 0; i < childNodes.length; i++) {
            var child = childNodes[i];
            var suitable = (!formatNode || !dom.isAncestorOrSelf(formatNode, child)) && this.suitable(child, nodes);

            if (!suitable) {
                continue;
            }

            if (formatNode && this.isList(child)) {
                // merging lists
                $.each(child.children, pushAncestor);
                dom.remove(child);
            } else {
                ancestors.push(child);
            }
        }

        if (ancestors.length == childNodes.length && this.breakable(commonAncestor)) {
            ancestors = [commonAncestor];
        }

        if (!formatNode) {
            formatNode = dom.create(commonAncestor.ownerDocument, tag, attr);
            if (dom.isBlock(ancestors[0])) {
                dom.mergeAttributes(ancestors[0], formatNode);
            }
            dom.insertBefore(formatNode, ancestors[0]);
        }

        this.wrap(formatNode, ancestors);

        while (dom.isBom(formatNode.nextSibling)) {
            dom.remove(formatNode.nextSibling);
        }

        if (!this.finder.matchesType(formatNode)) {
            formatNode.removeAttribute("type");
            formatNode.style.listStyleType = "";
            dom.mergeAttributes(dom.create(commonAncestor.ownerDocument, tag, attr), formatNode, true);
        }

        if (formatNode && formatNode.getAttribute("type") === "") {
            formatNode.removeAttribute("type");
        }

        if (!dom.is(formatNode, tag)) {
            dom.changeTag(formatNode, tag);
        }

        this.merge(tag, formatNode);
    },

    apply: function(nodes) {
        var i = 0,
            sections = [],
            lastSection,
            lastNodes,
            section,
            node,
            l = nodes.length,
            immutableParent = this.immutables() ? Editor.Immutables.immutableParent : $.noop;

        function addLastSection() {
            if (lastSection) {
                sections.push({
                    section: lastSection,
                    nodes: lastNodes
                });
            }
        }

        // split nodes into sections that need to be different lists
        for (i = 0; i < l; i++) {
            node = immutableParent(nodes[i]) || nodes[i];
            section = dom.closestEditable(node, ["td","th","body"]);
            if (!lastSection || section != lastSection) {
                addLastSection();
                lastNodes = [node];
                lastSection = section;
            } else {
                lastNodes.push(node);
            }
        }

        addLastSection();

        for (i = 0; i < sections.length; i++) {
            this.applyOnSection(sections[i].section, sections[i].nodes);
        }
    },

    unwrap: function(ul) {
        var fragment = ul.ownerDocument.createDocumentFragment(),
            unwrapTag = this.unwrapTag,
            parents,
            li,
            p,
            child;

        for (li = ul.firstChild; li; li = li.nextSibling) {
            p = dom.create(ul.ownerDocument, unwrapTag || 'p');

            while (li.firstChild) {
                child = li.firstChild;

                if (dom.isBlock(child)) {

                    if (p.firstChild) {
                        fragment.appendChild(p);
                        p = dom.create(ul.ownerDocument, unwrapTag || 'p');
                    }

                    fragment.appendChild(child);
                } else {
                    p.appendChild(child);
                }
            }

            if (p.firstChild) {
                fragment.appendChild(p);
            }
        }

        parents = this._parentLists(ul);

        if (parents[0]) {
            dom.insertAfter(fragment, parents.last()[0]);
            parents.last().remove();
        } else {
            dom.insertAfter(fragment, ul);
        }

        dom.remove(ul);
    },

    remove: function(nodes) {
        var formatNode;
        for (var i = 0, l = nodes.length; i < l; i++) {
            formatNode = this.finder.findFormat(nodes[i]);

            if (formatNode) {
                this.unwrap(formatNode);
            }
        }
    },

    toggle: function(range) {
        var that = this,
            nodes = textNodes(range),
            ancestor = range.commonAncestorContainer;

        if (!nodes.length) {
            range.selectNodeContents(ancestor);
            nodes = textNodes(range);
            if (!nodes.length) {
                var text = ancestor.ownerDocument.createTextNode("");
                range.startContainer.appendChild(text);
                nodes = [text];
                range.selectNode(text.parentNode);
            }
        }
        nodes = dom.filterBy(nodes, dom.htmlIndentSpace, true);
        if (that.finder.isFormatted(nodes)) {
            that.split(range);
            that.remove(nodes);
        } else {
            that.apply(nodes);
        }
    }

});

var ListCommand = Command.extend({
    init: function(options) {
        options.formatter = new ListFormatter({ tag: options.tag, attr: options.attr });
        Command.fn.init.call(this, options);
    }
});

var ListTool = FormatTool.extend({
    init: function(options) {
        this.options = options;

        FormatTool.fn.init.call(this, extend(options, {
            finder: new ListFormatFinder(options)
        }));
    },

    command: function(commandArguments) {
        return new ListCommand(extend(commandArguments, { tag: this.options.tag, attr: this.options.attr }));
    }
});

extend(Editor, {
    ListFormatFinder: ListFormatFinder,
    ListFormatter: ListFormatter,
    ListCommand: ListCommand,
    ListTool: ListTool
});

registerTool("insertUnorderedList", new ListTool({ tag: 'ul', attr: { style: { listStyleType: "" }, type: "" }, ui: { togglable: true, group: "lists" } }));
registerTool("insertOrderedList", new ListTool({ tag: 'ol', attr: { style: { listStyleType: "" }, type: "" }, ui: { togglable: true, group: "lists" } }));
registerTool("insertUpperRomanList", new ListTool({ tag: 'ol', attr: { style: { listStyleType: "upper-roman" } }, altAttr: { type: "I" }, ui: { togglable: true, group: "lists" } }));
registerTool("insertLowerRomanList", new ListTool({ tag: 'ol', attr: { style: { listStyleType: "lower-roman" } }, altAttr: { type: "i" }, ui: { togglable: true, group: "lists" } }));

})(window.kendo.jQuery);

(function($) {

var kendo = window.kendo,
    Editor = kendo.ui.editor,
    Tool = Editor.Tool,
    DelayedExecutionTool = Editor.DelayedExecutionTool,
    Command = Editor.Command,
    dom = Editor.Dom,
    EditorUtils = Editor.EditorUtils,
    RangeUtils = Editor.RangeUtils,
    registerTool = EditorUtils.registerTool;


var FormattingTool = DelayedExecutionTool.extend({
    init: function(options) {
        var that = this;
        Tool.fn.init.call(that, kendo.deepExtend({}, that.options, options));

        that.type = "kendoDropDownList";

        that.finder = {
            getFormat: function() { return ""; }
        };
    },

    options: {
        items: [
            { text: "Paragraph", value: "p" },
            { text: "Quotation", value: "blockquote" },
            { text: "Heading 1", value: "h1" },
            { text: "Heading 2", value: "h2" },
            { text: "Heading 3", value: "h3" },
            { text: "Heading 4", value: "h4" },
            { text: "Heading 5", value: "h5" },
            { text: "Heading 6", value: "h6" }
        ],
        width: 110
    },

    toFormattingItem: function(item) {
        var value = item.value;

        if (!value) {
            return item;
        }

        if (item.tag || item.className) {
            return item;
        }

        var dot = value.indexOf(".");

        if (dot === 0) {
            item.className = value.substring(1);
        } else if (dot == -1) {
            item.tag = value;
        } else {
            item.tag = value.substring(0, dot);
            item.className = value.substring(dot + 1);
        }

        return item;
    },

    command: function(args) {
        var that = this;
        var item = args.value;

        item = this.toFormattingItem(item);

        return new Editor.FormatCommand({
            range: args.range,
            formatter: function() {
                var formatter,
                    tags = (item.tag || item.context || "span").split(","),
                    format = [{
                        tags: tags,
                        attr: { className: item.className || "" }
                    }];

                if ($.inArray(tags[0], dom.inlineElements) >= 0) {
                    formatter = new Editor.GreedyInlineFormatter(format);
                } else {
                    formatter = new Editor.GreedyBlockFormatter(format);
                }

                formatter.editor = that.editor;
                return formatter;
            }
        });
    },

    decorate: function(body) {
        var component = this.component,
            dataSource = component.dataSource,
            items = dataSource.data(),
            i, tag, className, style;

        if (body) {
            component.list.css("background-color", dom.getEffectiveBackground($(body)));
        }

        if (this.component && this.component.options && this.component.options.unsafeInline !== false) {
            for (i = 0; i < items.length; i++) {
                tag = items[i].tag || "span";
                className = items[i].className;

                style = dom.inlineStyle(body, tag, { className: className });

                style = style.replace(/"/g, "'");

                items[i].style = style + ";display:inline-block";
            }
        }

        dataSource.trigger("change");
    },

    initialize: function(ui, editor) {
        var options = this.options;
        var toolName = options.name;
        var that = this;
        var component = ui.getKendoDropDownList();

        if (!component) {
            return;
        }

        that.editor = editor;
        that.component = component;

        // must be moved to themes
        ui.closest(".k-dropdownlist").width(options.width);

        component.setOptions({
            optionLabel: editor.options.messages.formatting,
            change: () => {
                var dataItem = component.dataItem();

                if (dataItem) {
                    Tool.exec(editor, toolName, dataItem.toJSON());
                }
            },
            dataBound: function() {
                var i, items = component.dataSource.data(),
                    optionLabel = component.list.parent().find(".k-list-optionlabel");

                for (i = 0; i < items.length; i++) {
                    items[i] = that.toFormattingItem(items[i]);
                }

                if (optionLabel.length) {
                    optionLabel.remove();
                }
            }
        });
    },

    getFormattingValue: function(items, nodes) {
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var tag = item.tag || item.context || "";
            var className = item.className ? "." + item.className : "";
            var selector = tag + className;

            var element = $(nodes[0]).closest(selector)[0];

            if (!element) {
                continue;
            }

            if (nodes.length == 1) {
                return item.value;
            }

            for (var n = 1; n < nodes.length; n++) {
                if (!$(nodes[n]).closest(selector)[0]) {
                    break;
                } else if (n == nodes.length - 1) {
                    return item.value;
                }
            }
        }

        return "";
    },

    update: function(ui, nodes) {
        var selectBox = $(ui).data(this.type);
        // necessary until formatBlock is deleted
        if (!selectBox) {
            return;
        }

        var dataSource = selectBox.dataSource,
            items = dataSource.data(),
            i, context,
            ancestor = dom.commonAncestor.apply(null, nodes);

        if (ancestor != dom.closestEditable(ancestor) && this._ancestor == ancestor) {
            return;
        } else {
            this._ancestor = ancestor;
        }

        for (i = 0; i < items.length; i++) {
            context = items[i].context;

            items[i].visible = !context || !!$(ancestor).closest(context).length;
        }

        dataSource.filter([{ field: "visible", operator: "eq", value: true }]);

        DelayedExecutionTool.fn.update.call(this, ui, nodes);

        selectBox.value(this.getFormattingValue(dataSource.view(), nodes));

        selectBox.wrapper.toggleClass("k-disabled", !dataSource.view().length);
    },

    destroy: function() {
        this._ancestor = null;
    }
});

var CleanFormatCommand = Command.extend({
    exec: function() {
        var range = this.lockRange(true);
        this.tagsToClean = this.options.remove || "strong,em,span,sup,sub,del,b,i,u,font".split(",");

        RangeUtils.wrapSelectedElements(range);

        var nodes = RangeUtils.mapAll(range, function(node) {
            return node;
        });


        for (var c = nodes.length - 1; c >= 0; c--) {
            var node = nodes[c];
            if (!this.immutableParent(node)) {
                this.clean(node);
            }
        }

        this.releaseRange(range);
    },

    clean: function(node) {
        if (!node || dom.isMarker(node)) {
            return;
        }

        var name = dom.name(node);

        if (name == "ul" || name == "ol") {
            var listFormatter = new Editor.ListFormatter(name);
            var prev = node.previousSibling;
            var next = node.nextSibling;

            listFormatter.unwrap(node);

            // clean contents
            for (; prev && prev != next; prev = prev.nextSibling) {
                this.clean(prev);
            }
        } else if (name == "blockquote") {
            dom.changeTag(node, "p");
        } else if (node.nodeType == 1 && !dom.insignificant(node)) {
            for (var i = node.childNodes.length - 1; i >= 0; i--) {
                this.clean(node.childNodes[i]);
            }

            node.removeAttribute("style");
            node.removeAttribute("class");
        } else {
            unwrapListItem(node);
        }

        if ($.inArray(name, this.tagsToClean) > -1) {
            dom.unwrap(node);
        }
    },

    immutableParent: function(node) {
        return this.immutables() && Editor.Immutables.immutableParent(node);
    }
});


function unwrapListItem(node) {
    var li = dom.closestEditableOfType(node, ["li"]);
    if (li) {
        var listFormatter = new Editor.ListFormatter(dom.name(li.parentNode));
        var range = kendo.ui.editor.W3CRange.fromNode(node);
        range.selectNode(li);
        listFormatter.toggle(range);
    }
}

$.extend(Editor, {
    FormattingTool: FormattingTool,
    CleanFormatCommand: CleanFormatCommand
});

registerTool("formatting", new FormattingTool({
    ui: {
        type: "component",
        component: "DropDownList",
        componentOptions: {
            dataTextField: "text",
            dataValueField: "value",
            highlightFirst: false,
            autoWidth: true,
            template: kendo.template(
                (data) => `<span unselectable="on" ${data.style ? `class="k-d-block" style="display:block;${data.style || ""}` : ""}">${kendo.htmlEncode(data.text)}</span>`
            )
        },
        overflow: "never"
    }
}));

registerTool("cleanFormatting", new Tool({ command: CleanFormatCommand }));

})(window.kendo.jQuery);

(function($, undefined$1) {

var kendo = window.kendo,
    extend = $.extend,
    encode = kendo.htmlEncode,
    Editor = kendo.ui.editor,
    EditorUtils = Editor.EditorUtils,
    dom = Editor.Dom,
    registerTool = EditorUtils.registerTool,
    RangeUtils = Editor.RangeUtils,
    Command = Editor.Command,
    keys = kendo.keys,
    KEDITORIMAGEURL = "#k-editor-image-url",
    KEDITORIMAGETITLE = "#k-editor-image-title",
    KEDITORIMAGEWIDTH = "#k-editor-image-width",
    KEDITORIMAGEHEIGHT = "#k-editor-image-height";

var ImageCommand = Command.extend({
    init: function(options) {
        var that = this;
        Command.fn.init.call(that, options);

        that.async = true;
        that.attributes = {};
    },

    insertImage: function(img, range) {
        var attributes = this.attributes;
        var doc = RangeUtils.documentFromRange(range);

        if (attributes.src && attributes.src != "http://") {

            var removeIEAttributes = function() {
                setTimeout(function() {
                    if (!attributes.width) {
                        img.removeAttribute("width");
                    }

                    if (!attributes.height) {
                        img.removeAttribute("height");
                    }

                    img.removeAttribute("complete");
                });
            };

            if (!img) {
                img = dom.create(doc, "img", attributes);
                img.onload = img.onerror = removeIEAttributes;

                range.deleteContents();
                range.insertNode(img);

                if (!img.nextSibling) {
                    dom.insertAfter(doc.createTextNode("\ufeff"), img);
                }

                removeIEAttributes();

                range.setStartAfter(img);
                range.setEndAfter(img);
                RangeUtils.selectRange(range);
                return true;
            } else {
                img.onload = img.onerror = removeIEAttributes;
                dom.attr(img, attributes);
                removeIEAttributes();
            }
        }

        return false;
    },

    redo: function() {
        var that = this,
            range = that.lockRange();

        if (!that.insertImage(RangeUtils.image(range), range)) {
            that.releaseRange(range);
        }
    },

    exec: function() {
        var that = this,
            range = that.lockRange(),
            applied = false,
            img = RangeUtils.image(range),
            imageWidth = img && img.getAttribute("width") || "",
            imageHeight = img && img.getAttribute("height") || "",
            dialog,
            form,
            isIE = kendo.support.browser.msie,
            options = that.editor.options,
            messages = options.messages,
            imageBrowser = options.imageBrowser,
            showBrowser = !!(kendo.ui.ImageBrowser && imageBrowser && imageBrowser.transport && imageBrowser.transport.read !== undefined$1),
            dialogOptions = {
                title: messages.insertImage,
                visible: false,
                resizable: showBrowser
            };

        this.expandImmutablesIn(range);

        function apply(e) {
            var element = dialog.element,
                w = parseInt(element.find(KEDITORIMAGEWIDTH).val(), 10),
                h = parseInt(element.find(KEDITORIMAGEHEIGHT).val(), 10);

            that.attributes = {
                src: element.find(KEDITORIMAGEURL).val().replace(/ /g, "%20"),
                alt: element.find(KEDITORIMAGETITLE).val()
            };

            that.attributes.width = null;
            that.attributes.height = null;

            if (!isNaN(w) && w > 0) {
                that.attributes.width = w;
            }

            if (!isNaN(h) && h > 0) {
                that.attributes.height = h;
            }

            applied = that.insertImage(img, range);

            close(e);

            if (that.change) {
                that.change();
            }

            that.editor._handleSpaceAndNewLines();
        }

        function close(e) {
            e.preventDefault();
            form.destroy();
            dialog.destroy();

            dom.windowFromDocument(RangeUtils.documentFromRange(range)).focus();
            if (!applied) {
                that.releaseRange(range);
            }
        }

        function keyDown(e) {
            if (e.keyCode == keys.ENTER) {
                apply(e);
            } else if (e.keyCode == keys.ESC) {
                close(e);
            }
        }

        dialogOptions.close = close;

        if (showBrowser) {
            dialogOptions.width = 750;
        }
        dialogOptions.minWidth = 350;

        dialog = this.createDialog("<div/>", dialogOptions).data("kendoWindow");

        form = that._createForm(dialog, showBrowser);

        dialog.element.toggleClass("k-filebrowser-dialog", showBrowser);
        dialog.wrapper
        .find(".k-dialog-insert").on("click", apply).end()
        .find(".k-dialog-close").on("click", close).end()
        .find(".k-form-field input").on("keydown", keyDown).end()
        // IE < 8 returns absolute url if getAttribute is not used
        .find(KEDITORIMAGEURL).val(img ? img.getAttribute("src", 2) : "http://").end()
        .find(KEDITORIMAGETITLE).val(img ? img.alt : "").end()
        .find(KEDITORIMAGEWIDTH).val(imageWidth).end()
        .find(KEDITORIMAGEHEIGHT).val(imageHeight).end();

        var element = dialog.element;
        if (showBrowser) {
            this._imageBrowser = new kendo.ui.ImageBrowser(
                element.find(".k-imagebrowser"),
                extend({}, imageBrowser)
            );

            this._imageBrowser.bind("change", function(ev) {
                if (ev.selected.get("type") === "f") {
                    element.find(KEDITORIMAGEURL).val(this.value());
                }
            });

            this._imageBrowser.bind("apply", apply);
        }

        if (isIE) {
            var dialogHeight = element.closest(".k-window").height();
            element.css("max-height", dialogHeight);
        }
        dialog.center().open();
        element.find(KEDITORIMAGEURL).trigger("focus").select();
    },

    _createForm: function(dialog, showBrowser) {
        var that = this;
        var formElement = $("<div/>").appendTo(dialog.element);
        var messages = that.editor.options.messages;
        var form = formElement.kendoForm({
            renderButtons: false,
            items: [
                {
                    field: "k-editor-image-url",
                    label: encode(messages.imageWebAddress),
                    editor: "TextBox"
                },
                {
                    field: "k-editor-image-title",
                    label: encode(messages.imageAltText),
                    editor: "TextBox"
                },
                {
                    field: "k-editor-image-width",
                    label: encode(messages.imageWidth),
                    editor: "TextBox"
                },
                {
                    field: "k-editor-image-height",
                    label: encode(messages.imageHeight),
                    editor: "TextBox"
                }
            ]
        }).data("kendoForm");

        if (showBrowser) {
            formElement.prepend($('<div class="k-filebrowser k-imagebrowser"></div>'));
        }

        dialog.element.after($(that._actionButtonsTemplate({ messages, insertButtonIcon: "image-add", cancelButtonIcon: "cancel-outline" })));

        return form;
    }

});

kendo.ui.editor.ImageCommand = ImageCommand;

registerTool("insertImage", new Editor.Tool({ command: ImageCommand }));

})(window.kendo.jQuery);

(function($, undefined$1) {

var kendo = window.kendo,
    extend = $.extend,
    Editor = kendo.ui.editor,
    EditorUtils = Editor.EditorUtils,
    Command = Editor.Command,
    Tool = Editor.Tool,
    registerTool = EditorUtils.registerTool,
    loadingOverlay = '<div contenteditable="false" class="k-loading-mask" style="width: 100%; height: 100%; position: absolute; top: 0px; left: 0px;"><div class="k-loading-image"></div><div class="k-loading-color"></div></div>';

var ImportCommand = Command.extend({
    exec: function() {
        (this.editor._uploadWidget || this._initializeUploadWidget()).element.click();
    },

    _initializeUploadWidget: function() {
        var cmd = this;
        var editor = cmd.editor;
        var importOptions = editor.options["import"];
        var upload = $('<input id="editorImport" name="files" type="file" />').kendoUpload({
            success: cmd._onUploadSuccess.bind(cmd),
            progress: cmd._onUploadProgress.bind(cmd),
            select: cmd._onUploadSelect.bind(cmd),
            error: cmd._onUploadError.bind(cmd),
            complete: cmd._onUploadComplete.bind(cmd),
            showFileList: false,
            multiple: false,
            async: {
                saveUrl: importOptions.proxyURL,
                autoUpload: true,
                saveField: "file"
            },
            validation: {
                allowedExtensions: importOptions.allowedExtensions,
                maxFileSize: importOptions.maxFileSize
            }
        }).getKendoUpload();

        editor._uploadWidget = upload;

        return upload;
    },
    _onUploadComplete: function(ev) {
        this._trigger("complete", ev);
        ev.sender.clearAllFiles();

        this._removeLoadingOverlay();
    },
    _onUploadSuccess: function(ev) {
        this.editor.value(ev.response.html.replace(/<\/?body>/ig, ""));
        this._trigger("success", ev);
    },
    _onUploadProgress: function(ev) {
        this._trigger("progress", ev);
    },
    _onUploadSelect: function(ev) {
        this._trigger("select", ev);
        if (!ev.files[0].validationErrors) {
            this._initLoadingOverlay();
        }
    },
    _onUploadError: function(ev) {
        this._trigger("error", ev);
    },

    _trigger: function(eventType, uploadEvent) {
        var editor = this.editor;
        var importOptions = editor.options["import"];
        if (typeof importOptions[eventType] === "function") {
            importOptions[eventType].call(editor, uploadEvent);
        }
    },

    _initLoadingOverlay: function() {
        var editable = this.editor.body;
        if (Editor.Dom.is(editable, "body")) {
            this._iframeWrapper = this._container =
                this.editor.wrapper.find("iframe").parent()
                .css({ position: "relative" }).append(loadingOverlay);
        } else {
            this._container = $(editable).append(loadingOverlay);
        }

        kendo.ui.progress(this._container, true);
    },

    _removeLoadingOverlay: function() {
        kendo.ui.progress(this._container, false);
        $(this._iframeWrapper).css({
            position: ""
        });

        delete this._container;
        delete this._iframeWrapper;
    }
});

extend(Editor, {
    ImportCommand: ImportCommand
});

registerTool("import", new Tool({
    command: ImportCommand,
    ui: {
        showText: "both"
    }
}));

}(window.kendo.jQuery));

(function($) {

    // Imports ================================================================
    var kendo = window.kendo,
        editorNS = kendo.ui.editor,
        Command = editorNS.Command,
        GenericCommand = editorNS.GenericCommand,
        EditorUtils = editorNS.EditorUtils,
        registerTool = EditorUtils.registerTool,
        Tool = editorNS.Tool,
        RestorePoint = editorNS.RestorePoint,
        extend = $.extend;

var InsertHtmlCommand = Command.extend({
    init: function(options) {
        Command.fn.init.call(this, options);

        this.managesUndoRedo = true;
    },

    exec: function() {
        var editor = this.editor;
        var options = this.options;
        var range = options.range;
        var body = editor.body;
        var startRestorePoint = new RestorePoint(range, body);
        var html = options.html || options.value || '';

        editor.selectRange(range);

        editor.clipboard.paste(html, options);

        if (options.postProcess) {
            options.postProcess(editor, editor.getRange());
        }

        var genericCommand = new GenericCommand(startRestorePoint, new RestorePoint(editor.getRange(), body));
        genericCommand.editor = editor;
        editor.undoRedoStack.push(genericCommand);

        editor.focus();
    }
});

var InsertHtmlTool = Tool.extend({
    initialize: function(ui, editor) {
        var options = this.options,
            dataSource = options.items ? options.items : editor.options.insertHtml,
            component = ui.getKendoDropDownList();

        if (!component) {
            return;
        }

        component.one("open", () => {
            var optionLabel = component.list.parent().find(".k-list-optionlabel");

            if (optionLabel.length) {
                optionLabel.remove();
            }
        });

        component.setOptions({
            dataSource: dataSource,
            optionLabel: editor.options.messages.insertHtml
        });
        component.bind("change", () => {
            Tool.exec(editor, 'insertHtml', component.value());
        });
    },

    command: function(commandArguments) {
        return new InsertHtmlCommand(commandArguments);
    },

    update: function(ui) {
        var component = ui.data("kendoDropDownList");
        component.close();
        component.value(null);
    }
});

extend(editorNS, {
    InsertHtmlCommand: InsertHtmlCommand,
    InsertHtmlTool: InsertHtmlTool
});

registerTool("insertHtml", new InsertHtmlTool({
    ui: {
        initialValue: "Insert HTML",
        type: "component",
        component: "DropDownList",
        componentOptions: {
            dataTextField: "text",
            dataValueField: "value",
            autoSize: true,
            highlightFirst: false
        },
        overflow: "never"
    }
}));

})(window.kendo.jQuery);

(function($, undefined$1) {

var kendo = window.kendo,
    extend = $.extend,
    Editor = kendo.ui.editor,
    EditorUtils = Editor.EditorUtils,
    Command = Editor.Command,
    Tool = Editor.Tool,
    registerTool = EditorUtils.registerTool,
    defaultExportAsItems = [
        { text: 'Docx', value: 'docx' },
        { text: 'Rtf', value: 'rtf' },
        { text: 'Pdf', value: 'pdf' },
        { text: 'Html', value: 'html' },
        { text: 'Plain Text', value: 'txt' }
    ];

var ExportAsCommand = Command.extend({
    init: function(options) {
        var cmd = this;
        cmd.options = options;
        Command.fn.init.call(cmd, options);
        cmd.attributes = null;
        cmd.exportType = options.exportType;
    },

    exec: function() {
        var cmd = this;
        var range = this.lockRange(true);
        cmd.postToProxy();
        cmd.releaseRange(range);
    },

    postToProxy: function() {
        this.generateForm().appendTo('body').submit().remove();
    },

    generateForm: function() {
        var cmd = this;
        var exportAsOptions = cmd.editor.options.exportAs;
        var form = $('<form>').attr({
            action: exportAsOptions && exportAsOptions.proxyURL || "",
            method: 'POST'
        });

        form.append([
            cmd.valueInput(),
            cmd.exportTypeInput(),
            cmd.fileNameInput(),
            cmd.antiForgeryInput()
        ]);

        return form;
    },

    valueInput: function() {
        var editor = this.editor;
        return $('<input>').attr({
            value: editor.encodedValue(),
            name: 'value',
            type: 'hidden'
        });
    },

    exportTypeInput: function() {
        var cmd = this;
        return $('<input>').attr({
            value: cmd.exportType,
            name: 'exportType',
            type: 'hidden'
        });

    },

    fileNameInput: function() {
        var editor = this.editor;
        var exportAsOptions = editor.options.exportAs;
        var fileName = exportAsOptions && exportAsOptions.fileName || editor.element.attr("id") || "editor";
        return $('<input>').attr({
            value: fileName,
            name: 'fileName',
            type: 'hidden'
        });
    },

    antiForgeryInput: function() {
        var csrf_param = $("meta[name=csrf-param],meta[name=_csrf_header]").attr("content");

        return $("input[name^='__RequestVerificationToken']").clone()
                    .add($("input[name^='" + csrf_param + "']").clone());
    }
});

var ExportAsTool = Tool.extend({
    init: function(options) {
        var tool = this;
        Tool.fn.init.call(tool, kendo.deepExtend({}, tool.options, options));
        tool.type = 'kendoDropDownList';
    },

    options: {
        items: defaultExportAsItems
    },

    command: function(args) {
        var value = args.value;
        return new Editor.ExportAsCommand({
            range: args.range,
            exportType: value.exportType
        });
    },

    initialize: function(ui, editor) {
        var tool = this,
            component = ui.getKendoDropDownList();

        tool.editor = editor;

        component.bind("change", this.changeHandler.bind(this));
    },

    changeHandler: function(e) {
        this._exec(e.sender.value());
        e.sender.value(null);
        e.sender.wrapper.find(".k-export-tool-text").text(kendo.htmlEncode(this.editor.options.messages.exportAs));
    },

    update: function(ui, editor) {
        var component = ui.data("kendoDropDownList");

        component.close();
        component.value(null);
        ui.closest(".k-dropdownlist").find(".k-export-tool-text").text(kendo.htmlEncode(this.editor.options.messages.exportAs));
    },

    _exec: function(value) {
        if (value) {
            Tool.exec(this.editor, this.options.name, { exportType: value } );
        }
    },

    destroy: function() {
        this._ancestor = null;
    }
});

extend(Editor, {
    ExportAsTool: ExportAsTool,
    ExportAsCommand: ExportAsCommand
});

registerTool('exportAs', new ExportAsTool({
    ui: {
        type: "component",
        overflow: "never",
        component: "DropDownList",
        componentOptions: {
            dataTextField: "text",
            dataValueField: "value",
            valuePrimitive: true,
            value: null,
            width: "140px",
            highlightFirst: false,
            autoWidth: true,
            itemTemplate: (data) => `<span class="k-link k-menu-link" data-value="${data.value}">${data.text}</strong></span>`,
            icon: "export",
            valueTemplate: () => `<span class="k-editor-export">${kendo.ui.icon({ icon: "export", iconClass: "k-button-icon" })}<span class="k-export-tool-text"></span></span>`
        }
    }
}));

}(window.kendo.jQuery));

(function($, undefined$1) {

// Imports ================================================================
var kendo = window.kendo,
    Class = kendo.Class,
    extend = $.extend,
    Editor = kendo.ui.editor,
    dom = Editor.Dom,
    EditorUtils = Editor.EditorUtils,
    registerTool = EditorUtils.registerTool,
    Command = Editor.Command,
    Tool = Editor.Tool,
    RangeUtils = Editor.RangeUtils,
    blockElements = dom.blockElements,
    BlockFormatFinder = Editor.BlockFormatFinder,
    BlockFormatter = Editor.BlockFormatter;

function indent(node, value) {
    var isRtl = $(node).css("direction") == "rtl",
        indentDirection = isRtl ? "Right" : "Left",
        property = dom.name(node) != "td" ? "margin" + indentDirection : "padding" + indentDirection;
    if (value === undefined$1) {
        return node.style[property] || 0;
    } else if (value > 0) {
        node.style[property] = value + "px";
    } else {
        node.style[property] = "";

        if (!node.style.cssText) {
            node.removeAttribute("style");
        }
    }
}

var IndentFormatter = Class.extend({
    init: function() {
        this.finder = new BlockFormatFinder([{ tags: dom.blockElements }]);
    },

    apply: function(nodes) {
        nodes = dom.filterBy(nodes, dom.htmlIndentSpace, true);
        var formatNodes = this.finder.findSuitable(nodes),
            targets = [],
            i, len, formatNode, parentList, sibling;

        formatNodes = this.mapImmutables(formatNodes);

        if (formatNodes.length) {
            for (i = 0, len = formatNodes.length; i < len; i++) {
                if (dom.is(formatNodes[i], "li")) {
                    if (!$(formatNodes[i]).index()) {
                        targets.push(formatNodes[i].parentNode);
                    } else if ($.inArray(formatNodes[i].parentNode, targets) < 0) {
                        targets.push(formatNodes[i]);
                    }
                } else {
                    targets.push(formatNodes[i]);
                }
            }

            while (targets.length) {
                formatNode = targets.shift();
                if (dom.is(formatNode, "li")) {
                    parentList = formatNode.parentNode;
                    sibling = $(formatNode).prev("li");
                    var siblingList = sibling.find("ul,ol").last();

                    var nestedList = $(formatNode).children("ul,ol")[0];

                    if (nestedList && sibling[0]) {
                        if (siblingList[0]) {
                           siblingList.append(formatNode);
                           siblingList.append($(nestedList).children());
                           dom.remove(nestedList);
                        } else {
                            sibling.append(nestedList);
                            nestedList.insertBefore(formatNode, nestedList.firstChild);
                        }
                    } else {
                        nestedList = sibling.children("ul,ol")[0];
                        if (!nestedList) {
                            nestedList = dom.create(formatNode.ownerDocument, dom.name(parentList), this.getListTypeAttr(parentList));
                            sibling.append(nestedList);
                        }

                        while (formatNode && formatNode.parentNode == parentList) {
                            nestedList.appendChild(formatNode);
                            formatNode = targets.shift();
                        }
                    }
                } else {
                    var marginLeft = parseInt(indent(formatNode), 10) + 30;
                    indent(formatNode, marginLeft);

                    for (var targetIndex = 0; targetIndex < targets.length; targetIndex++) {
                        if ($.contains(formatNode, targets[targetIndex])) {
                            targets.splice(targetIndex, 1);
                        }
                    }
                }
            }
        } else {
            var formatter = new BlockFormatter([{ tags: ["p"] }], { style: { marginLeft: 30 } });

            formatter.apply(nodes);
        }
    },

    getListTypeAttr: function(list) {
        var type = list.getAttribute("type");
        var styleType = list.style.listStyleType;

        return type ? { type: type } : { style: { listStyleType: styleType } };
    },

    mapImmutables: function(nodes) {
        if (!this.immutables) {
            return nodes;
        } else {
            var immutables = [];
            return $.map(nodes, function(node) {
                var immutable = Editor.Immutables.immutableParent(node);
                if (immutable) {
                    if ($.inArray(immutable, immutables) === -1) {
                        immutables.push(immutable);
                    } else {
                        return null;
                    }
                }
                return immutable || node;
            });
        }
    },

    remove: function(nodes) {
        nodes = dom.filterBy(nodes, dom.htmlIndentSpace, true);
        var formatNodes = this.finder.findSuitable(nodes),
            targetNode, i, len, list, listParent, siblings,
            formatNode, marginLeft;

        formatNodes = this.mapImmutables(formatNodes);

        for (i = 0, len = formatNodes.length; i < len; i++) {
            formatNode = $(formatNodes[i]);

            if (formatNode.is("li")) {
                list = formatNode.parent();
                listParent = list.parent();
                // listParent will be ul or ol in case of invalid dom - <ul><li></li><ul><li></li></ul></ul>
                if (listParent.is("li,ul,ol") && !indent(list[0])) {
                    // skip already processed nodes
                    if (targetNode && $.contains(targetNode, listParent[0])) {
                        continue;
                    }

                    siblings = formatNode.nextAll("li");
                    if (siblings.length) {
                        $(list[0].cloneNode(false)).appendTo(formatNode).append(siblings);
                    }

                    if (listParent.is("li")) {
                        formatNode.insertAfter(listParent);
                    } else {
                        formatNode.appendTo(listParent);
                    }

                    if (!list.children("li").length) {
                        list.remove();
                    }

                    continue;
                } else {
                    if (targetNode == list[0]) {
                        // removing format on sibling LI elements
                        continue;
                    }
                    targetNode = list[0];
                }
            } else {
                targetNode = formatNodes[i];
            }

            marginLeft = parseInt(indent(targetNode), 10) - 30;
            indent(targetNode, marginLeft);
        }
    }

});

var IndentCommand = Command.extend({
    init: function(options) {
        var that = this;
        options.formatter = /** @ignore */ {
            toggle: (function(range) {
                var indentFormatter = new IndentFormatter();
                indentFormatter.immutables = this.editor && this.editor.options.immutables;
                indentFormatter.apply(RangeUtils.nodes(range));
            }).bind(that)
        };
        Command.fn.init.call(this, options);
    }
});

var OutdentCommand = Command.extend({
    init: function(options) {
        var that = this;
        options.formatter = {
            toggle: (function(range) {
                var indentFormatter = new IndentFormatter();
                indentFormatter.immutables = this.editor && this.editor.options.immutables;
                indentFormatter.remove(RangeUtils.nodes(range));
            }).bind(that)
        };
        Command.fn.init.call(this, options);
    }
});

var OutdentTool = Tool.extend({
    init: function(options) {
        Tool.fn.init.call(this, options);

        this.finder = new BlockFormatFinder([{ tags: blockElements }]);
    },

    initialize: function(ui, editor) {
        $.extend(this.options, {
            immutables: editor && editor.options.immutables
        });
    },

    update: function(ui, nodes) {
        var suitableNodes = this.finder.findSuitable(nodes),
            toolbar = ui.closest(".k-toolbar").data("kendoToolBar"),
            isOutdentable, listParentsCount, i, len, suitable, immutableParent;

        for (i = 0, len = suitableNodes.length; i < len; i++) {
            suitable = suitableNodes[i];

            if (this.options.immutables) {
                immutableParent = Editor.Immutables.immutableParent(suitable);

                if (immutableParent) {
                    suitable = immutableParent;
                }
            }

            isOutdentable = indent(suitable);

            if (!isOutdentable) {
                listParentsCount = $(suitable).parents("ul,ol").length;
                isOutdentable = (dom.is(suitable, "li") && (listParentsCount > 1 || indent(suitable.parentNode))) ||
                                (dom.ofType(suitable, ["ul","ol"]) && listParentsCount > 0);
            }

            if (isOutdentable) {
                toolbar.enable(ui, true);
                return;
            }
        }

        toolbar.enable(ui, false);
    }
});

extend(Editor, {
    IndentFormatter: IndentFormatter,
    IndentCommand: IndentCommand,
    OutdentCommand: OutdentCommand,
    OutdentTool: OutdentTool
});

registerTool("indent", new Tool({ command: IndentCommand }));
registerTool("outdent", new OutdentTool({ command: OutdentCommand, ui: { enable: false } }));

})(window.kendo.jQuery);

(function($) {

// Imports ================================================================
var kendo = window.kendo,
    extend = $.extend,
    editorNS = kendo.ui.editor,
    dom = editorNS.Dom,
    Command = editorNS.Command,
    Tool = editorNS.Tool,
    BlockFormatter = editorNS.BlockFormatter,
    normalize = dom.normalize,
    RangeUtils = editorNS.RangeUtils,
    registerTool = editorNS.EditorUtils.registerTool;

var ParagraphCommand = Command.extend({
    init: function(options) {
        this.options = options;
        Command.fn.init.call(this, options);
    },

    _insertMarker: function(doc, range) {
        var marker = dom.create(doc, 'a'), container;
        marker.className = "k-marker";

        range.insertNode(marker);

        if (!marker.parentNode) {
            // inserting paragraph in Firefox full body range
            container = range.commonAncestorContainer;
            container.innerHTML = "";
            container.appendChild(marker);
        }

        normalize(marker.parentNode);

        return marker;
    },

    _moveFocus: function(range, candidate) {
        if (dom.isEmpty(candidate)) {
            range.setStartBefore(candidate);
        } else {
            range.selectNodeContents(candidate);

            var focusNode = RangeUtils.textNodes(range)[0];

            if (!focusNode) {
                while (candidate.childNodes.length && !dom.is(candidate.firstChild, "br")) {
                    candidate = candidate.firstChild;
                }

                focusNode = candidate;
            }

            if (dom.isEmpty(focusNode)) {
                range.setStartBefore(focusNode);
            } else {
                if (dom.emptyNode(focusNode)) {
                    focusNode.innerHTML = "\ufeff";
                }
                var startNode = focusNode.firstChild || focusNode;
                if (dom.isDataNode(startNode)) {
                    range.setStart(startNode, 0);
                } else {
                    range.setStartBefore(startNode);
                }
            }
        }
    },

    shouldTrim: function(range) {
        var blocks = 'p,h1,h2,h3,h4,h5,h6'.split(','),
            startInBlock = dom.parentOfType(range.startContainer, blocks),
            endInBlock = dom.parentOfType(range.endContainer, blocks);
        return (startInBlock && !endInBlock) || (!startInBlock && endInBlock);
    },

    _blankAfter: function(node) {
        while (node && (dom.isMarker(node) || dom.stripBom(node.nodeValue) === "")) {
            node = node.nextSibling;
        }

        return !node;
    },

    exec: function() {
        const range = this.getRange();
        const doc = RangeUtils.documentFromRange(range);
        let parent, previous, next, paragraph, marker, li, heading, tableNode, rng,
        shouldTrim;
        const emptyParagraphContent = editorNS.emptyElementContent;

        this.expandImmutablesIn(range);

        shouldTrim = this.shouldTrim(range);

        range.deleteContents();
        marker = this._insertMarker(doc, range);

        dom.stripBomNode(marker.previousSibling);
        dom.stripBomNode(marker.nextSibling);

        li = dom.closestEditableOfType(marker, ['li']);
        heading = dom.closestEditableOfType(marker, 'h1,h2,h3,h4,h5,h6'.split(','));
        tableNode = dom.is(marker.parentNode, 'table') && marker.parentNode;

        if (li) {
            // hitting 'enter' in empty li
            if (dom.emptyNode(li)) {
                paragraph = dom.create(doc, 'p');

                if (dom.next(li)) {
                    rng = range.cloneRange();
                    rng.selectNode(li);

                    RangeUtils.split(rng, li.parentNode);
                }

                const br = $("br", li);
                if (br.length == 1) {
                    br.remove();
                }

                const parentNode = li.parentNode;
                const parentChildrenLength = li.parentNode.children.length;
                const firstChild = parentChildrenLength >= 1 && li.childNodes.length == 1 && li.children[0];

                dom.insertAfter(paragraph, parentNode);
                dom.remove(parentChildrenLength == 1 ? li.parentNode : li);

                if (firstChild && firstChild !== marker) {
                    paragraph.appendChild(firstChild);
                    paragraph.appendChild(marker);
                } else {
                    paragraph.innerHTML = emptyParagraphContent;
                }
                next = paragraph;
            }
        } else if (heading && this._blankAfter(marker)) {
            paragraph = this._insertParagraphAfter(heading);
            dom.remove(marker);
            next = paragraph;
        } else if (tableNode) {
            paragraph = this._insertParagraphAfter(tableNode);
            dom.remove(marker);
            next = paragraph;
        }

        if (!next) {
            if (!(li || heading)) {
                new BlockFormatter([{ tags: ['p'] }]).apply([marker]);
            }

            range.selectNode(marker);

            const headingDomName = heading ? dom.name(heading) : 'p';
            parent = dom.parentOfType(marker, [li ? 'li' : headingDomName]);

            RangeUtils.split(range, parent, shouldTrim);

            previous = parent.previousSibling;

            if (dom.is(previous, 'li') && previous.firstChild && !dom.is(previous.firstChild, 'br')) {
                previous = previous.firstChild;
            }

            next = parent.nextSibling;

            this.clean(previous, { links: true });
            this.clean(next, { links: true });

            if (dom.is(next, 'li') && next.firstChild && !dom.is(next.firstChild, 'br')) {
                next = next.firstChild;
            }

            dom.remove(parent);

            // normalize updates the caret display in Gecko
            normalize(previous);
        }

        normalize(next);

        this._moveFocus(range, next);

        range.collapse(true);

        dom.scrollTo(next, true);

        RangeUtils.selectRange(range);
    },

    _insertParagraphAfter: function(node) {
        var range = this.getRange();
        var doc = RangeUtils.documentFromRange(range);
        var emptyElementContent = editorNS.emptyElementContent;
        var paragraph = dom.create(doc, 'p');

        dom.insertAfter(paragraph, node);
        paragraph.innerHTML = emptyElementContent;

        return paragraph;
    },

    clean: function(node, options) {
        var root = node;

        if (node.firstChild && dom.is(node.firstChild, 'br')) {
            dom.remove(node.firstChild);
        }

        if (dom.isDataNode(node) && !node.nodeValue) {
            node = node.parentNode;
        }

        if (node) {
            var siblings = false;
            while (node.firstChild && node.firstChild.nodeType == 1) {
                siblings = siblings || (dom.significantNodes(node.childNodes).length > 1);
                node = node.firstChild;
            }

            if (!dom.isEmpty(node) && node.className != "k-br" && /^\s*$/.test(node.innerHTML) && !siblings) {
                $(root).find(".k-br").remove();
                node.innerHTML = editorNS.emptyElementContent;
            }

            if (options && options.links) {
                while (node != root) {
                    if (dom.is(node, "a") && dom.emptyNode(node)) {
                        dom.unwrap(node);
                        break;
                    }
                    node = node.parentNode;
                }
            }
        }
    }
});

var NewLineCommand = Command.extend({
    init: function(options) {
        this.options = options;
        Command.fn.init.call(this, options);
    },

    exec: function() {
        var range = this.getRange();
        this.expandImmutablesIn(range);

        var br = dom.create(RangeUtils.documentFromRange(range), 'br');
        var node = range.startContainer;
        var filler;
        var browser = kendo.support.browser;
        var oldIE = browser.msie && browser.version < 11;
        var tableNode = dom.is(node, 'table') && node;
        var kbrParent;

        range.deleteContents();
        if (tableNode) {
            dom.insertAfter(br, tableNode);
        } else {
            kbrParent = $(node).closest('.k-br');
            range.insertNode(br);

            if (kbrParent.length) {
                // pressing enter in an k-br node
                dom.unwrap(kbrParent[0]);
            }
        }

        normalize(br.parentNode);

        if (!oldIE && (!br.nextSibling || dom.isWhitespace(br.nextSibling))) {
            // Gecko and WebKit cannot put the caret after only one br.
            if (!!br.nextSibling && dom.isWhitespace(br.nextSibling)) {
                $(br.nextSibling).remove();
            }
            filler = br.cloneNode(true);
            filler.className = 'k-br';
            dom.insertAfter(filler, br);
        }

        range.setStartAfter(br);
        range.collapse(true);

        dom.scrollTo(br.nextSibling || br, true);

        RangeUtils.selectRange(range);
    }
});

extend(editorNS, {
    ParagraphCommand: ParagraphCommand,
    NewLineCommand: NewLineCommand
});

registerTool("insertLineBreak", new Tool({ key: 13, shift: true, command: NewLineCommand }));
registerTool("insertParagraph", new Tool({ key: 13, command: ParagraphCommand }));

})(window.kendo.jQuery);

(function($, undefined$1) {

var kendo = window.kendo,
    extend = $.extend,
    encode = kendo.htmlEncode,
    Editor = kendo.ui.editor,
    EditorUtils = Editor.EditorUtils,
    dom = Editor.Dom,
    registerTool = EditorUtils.registerTool,
    RangeUtils = Editor.RangeUtils,
    Command = Editor.Command,
    LinkFormatter = Editor.LinkFormatter,
    textNodes = RangeUtils.textNodes,
    keys = kendo.keys,
    KEDITORFILEURL = "#k-editor-file-url",
    KEDITORFILETEXT = "#k-editor-file-text",
    KEDITORFILETITLE = "#k-editor-file-title";

var FileCommand = Command.extend({
    init: function(options) {
        var that = this;
        Command.fn.init.call(that, options);

        that.formatter = new LinkFormatter();

        that.async = true;
        that.attributes = {};
    },

    insertFile: function(file, range) {
        var attributes = this.attributes;
        var doc = RangeUtils.documentFromRange(range);

        if (attributes.href && attributes.href != "http://") {

            if (!file) {
                file = dom.create(doc, "a", { href: attributes.href });
                file.innerHTML = attributes.innerHTML;
                file.title = attributes.title;

                range.deleteContents();
                range.insertNode(file);

                if (!file.nextSibling) {
                    dom.insertAfter(doc.createTextNode("\ufeff"), file);
                }

                range.setStartAfter(file);
                range.setEndAfter(file);
                RangeUtils.selectRange(range);
                return true;
            } else {
                dom.attr(file, attributes);
            }
        }

        return false;
    },

    redo: function() {
        var that = this,
            range = that.lockRange();

        this.formatter.apply(range, this.attributes);
        that.releaseRange(range);
    },

    exec: function() {
        var that = this,
            range = that.lockRange(),
            nodes = textNodes(range),
            applied = false,
            file = nodes.length ? this.formatter.finder.findSuitable(nodes[0]) : null,
            dialog,
            form,
            isIE = kendo.support.browser.msie,
            options = that.editor.options,
            messages = options.messages,
            fileBrowser = options.fileBrowser,
            showBrowser = !!(kendo.ui.FileBrowser && fileBrowser && fileBrowser.transport && fileBrowser.transport.read !== undefined$1),
            dialogOptions = {
                title: messages.insertFile,
                visible: false,
                resizable: showBrowser
            };

        this.expandImmutablesIn(range);

        function apply(e) {
            var element = dialog.element,
                href = element.find(KEDITORFILEURL).val().replace(/ /g, "%20"),
                innerHTML = element.find(KEDITORFILETEXT).val(),
                title = element.find(KEDITORFILETITLE).val();

            that.attributes = {
                href: href,
                innerHTML: innerHTML !== "" ? innerHTML : href,
                title: title
            };

            applied = that.insertFile(file, range);

            close(e);

            if (that.change) {
                that.change();
            }
        }

        function close(e) {
            e.preventDefault();
            form.destroy();
            dialog.destroy();

            dom.windowFromDocument(RangeUtils.documentFromRange(range)).focus();
            if (!applied) {
                that.releaseRange(range);
            }
        }

        function keyDown(e) {
            if (e.keyCode == keys.ENTER) {
                apply(e);
            } else if (e.keyCode == keys.ESC) {
                close(e);
            }
        }

        dialogOptions.close = close;

        if (showBrowser) {
            dialogOptions.width = 750;
        }
        dialogOptions.minWidth = 350;

        dialog = this.createDialog("<div/>", dialogOptions).data("kendoWindow");
        form = that._createForm(dialog, showBrowser);

        dialog.element.toggleClass("k-filebrowser-dialog", showBrowser);
        dialog.wrapper
        .find(".k-dialog-insert").on("click", apply).end()
        .find(".k-dialog-close").on("click", close).end()
        .find(".k-form-field input").on("keydown", keyDown).end()
        // IE < 8 returns absolute url if getAttribute is not used
        .find(KEDITORFILEURL).val(file ? file.getAttribute("href", 2) : "http://").end()
        .find(KEDITORFILETEXT).val(file ? file.innerText : "").end()
        .find(KEDITORFILETITLE).val(file ? file.title : "").end();

        var element = dialog.element;
        if (showBrowser) {
            that._fileBrowser = new kendo.ui.FileBrowser(
                element.find(".k-filebrowser"),
                extend({}, fileBrowser)
            );

            that._fileBrowser.bind("change", function(ev) {
                if (ev.selected.get("type") === "f") {
                    element.find(KEDITORFILEURL).val(this.value());
                }
            } );

            that._fileBrowser.bind("apply", apply);
        }

        if (isIE) {
            var dialogHeight = element.closest(".k-window").height();
            element.css("max-height", dialogHeight);
        }
        dialog.center().open();
        element.find(KEDITORFILEURL).trigger("focus").select();
    },

    _createForm: function(dialog, showBrowser) {
        var that = this;
        var formElement = $("<div/>").appendTo(dialog.element);
        var messages = that.editor.options.messages;

        var form = formElement.kendoForm({
            renderButtons: false,
            items: [
                {
                    field: "k-editor-file-url",
                    label: encode(messages.fileWebAddress),
                    editor: "TextBox"
                },
                {
                    field: "k-editor-file-text",
                    label: encode(messages.fileText),
                    editor: "TextBox"
                },
                {
                    field: "k-editor-file-title",
                    label: encode(messages.fileTitle),
                    editor: "TextBox"
                }
            ]
        }).data("kendoForm");

        if (showBrowser) {
            formElement.prepend($('<div class="k-filebrowser"></div>'));
        }

        dialog.element.after($(that._actionButtonsTemplate({ messages, insertButtonIcon: "file-add", cancelButtonIcon: "cancel-outline" })));

        return form;
    }

});

kendo.ui.editor.FileCommand = FileCommand;

registerTool("insertFile", new Editor.Tool({ command: FileCommand }));

})(window.kendo.jQuery);

(function($, undefined$1) {

var kendo = window.kendo,
    extend = $.extend,
    Editor = kendo.ui.editor,
    dom = Editor.Dom,
    RangeUtils = Editor.RangeUtils,
    Command = Editor.Command,

    NS = "kendoEditor",
    ACTIVESTATE = "k-active",
    SELECTEDSTATE = "k-selected",
    SCOPE = "scope",
    ROW = "row",
    COL = "col",
    ROWGROUP = "rowgroup",
    COLGROUP = "colgroup",
    COLSPAN = "colspan",
    ROWSPAN = "rowspan",
    TABLE = "table",
    THEAD = "thead",
    TBODY = "tbody",
    TR = "tr",
    TD = "td",
    TH = "th",

    Tool = Editor.Tool,
    InsertHtmlCommand = Editor.InsertHtmlCommand,
    BlockFormatFinder = Editor.BlockFormatFinder,
    BlockFormatTool = Editor.BlockFormatTool,
    FormatCommand = Editor.FormatCommand,
    registerTool = Editor.EditorUtils.registerTool,
    registerFormat = Editor.EditorUtils.registerFormat,
    formats = kendo.ui.Editor.fn.options.formats,
    getTouches = kendo.getTouches;
var template = kendo.template;

var columnTemplate = ({ width, content }) => `<td style="width:${width}%;">${content}</td>`;

var tableFormatFinder = new BlockFormatFinder([{ tags: [TABLE] }]);

var TableCommand = InsertHtmlCommand.extend({
    init: function(options) {
        var o = $.extend({
            postProcess: this.postProcess,
            skipCleaners: true
        }, options || {});

        InsertHtmlCommand.fn.init.call(this, o);
    },
    _tableHtml: function(rows, columns) {
        rows = rows || 1;
        columns = columns || 1;
        var columnHtml = template(columnTemplate)({ width: 100 / columns, content: Editor.emptyTableCellContent });
        var rowHeight = 100 / rows;

        return "<table class='k-table' data-last>" +
                    new Array(rows + 1).join(
                    "<tr style='height:" + rowHeight + "%;'>" +
                        new Array(columns + 1).join(columnHtml) +
                    "</tr>") +
               "</table>";
    },

    postProcess: function(editor, range) {
        var insertedTable = $("table[data-last]", editor.document).removeAttr("data-last");

        range.setStart(insertedTable.find(TD)[0], 0);
        range.collapse(true);

        editor.selectRange(range);
    },

    exec: function() {
        var options = this.options;
        options.html = this._tableHtml(options.rows, options.columns);

        InsertHtmlCommand.fn.exec.call(this);
    }
});

var PopupTool = Tool.extend({
    initialize: function(ui, editor) {
        var that = this;
        var btn = $("<button>" + editor.options.messages.tableWizard + "</button>");
        var popup = $(this.options.popupTemplate).appendTo("body").kendoPopup({
            anchor: ui,
            copyAnchorStyles: false,
            open: this._open.bind(this),
            activate: this._activate.bind(this),
            close: this._close.bind(this)
        }).data("kendoPopup");

        ui.on("click", this._toggle.bind(this))
          .on("keydown", this._keydown.bind(this));

        this._editor = editor;
        this._popup = popup;

        editor.tablePopup = this._popup;

        var tableWizard = new Editor.TableWizardTool({
            command: Editor.TableWizardCommand,
            insertNewTable: true
        });

        registerTool("tableWizardInsert", tableWizard);

        btn.appendTo(popup.element);
        btn.kendoButton({
            icon: "table-wizard"
        });

        btn.on("click", () => {
            that._editor.exec("tableWizardInsert");
        });
    },

    popup: function() {
        return this._popup;
    },

    _activate: $.noop,

    _open: function() {
        this._popup.options.anchor.addClass(ACTIVESTATE);
    },

    _close: function() {
        this._popup.options.anchor.removeClass(ACTIVESTATE);
    },

    _keydown: function(e) {
        var that = this,
            keys = kendo.keys,
            key = e.keyCode;

        if (key == keys.ESC) {
            that._popup.close();
        } else if (key == keys.DOWN && e.altKey) {
            that._popup.open();
            that._setTableSize({ row: 1, col: 1 });
        } else if (key === keys.ENTER) {
            setTimeout(() => {
                that._setTableSize({ row: 1, col: 1 });
            });
        }
    },

    _toggle: function(e) {
        var button = $(e.target).closest(".k-tool");

        if (!button.hasClass("k-disabled")) {
            this.popup().toggle();
        }
    },

    update: function(ui) {
        var popup = this.popup();

        if (popup.wrapper && popup.wrapper.css("display") == "block") {
            popup.close();
        }

        ui.removeClass("k-hover");
    },

    destroy: function() {
        if (this._popup) {
            this._popup.destroy();
        }
    }
});

var InsertTableTool = PopupTool.extend({
    init: function(options) {
        this.cols = 8;
        this.rows = 6;

        PopupTool.fn.init.call(this, $.extend(options, {
            command: TableCommand,
            popupTemplate:
                "<div class='k-ct-popup'>" +
                    "<div>" +
                        new Array(this.cols * this.rows + 1).join("<span class='k-ct-cell k-disabled'></span>") +
                    "</div>" +
                    "<div class='k-status'></div>" +
                "</div>"
        }));
    },

    _activate: function() {
        var that = this,
            element = that._popup.element,
            cells = element.find(".k-ct-cell"),
            firstCell = cells.eq(0),
            lastCell = cells.eq(cells.length - 1),
            start = kendo.getOffset(firstCell),
            end = kendo.getOffset(lastCell),
            cols = that.cols,
            rows = that.rows,
            cellWidth, cellHeight;

        element.find("*").addBack().attr("unselectable", "on");

        end.left += lastCell[0].offsetWidth;
        end.top += lastCell[0].offsetHeight;

        cellWidth = (end.left - start.left) / cols;
        cellHeight = (end.top - start.top) / rows;

        function tableFromLocation(e) {
            var w = $(window);
            return {
                row: Math.floor((e.clientY + w.scrollTop() - start.top) / cellHeight) + 1,
                col: Math.floor((e.clientX + w.scrollLeft() - start.left) / cellWidth) + 1
            };
        }

        element.autoApplyNS(NS)
            .on("mousemove", ".k-ct-cell", function(e) {
                that._setTableSize(tableFromLocation(e));
            })
            .on("mouseleave", ".k-ct-cell", function() {
                that._setTableSize();
            })
            .on("down", ".k-ct-cell", function(e) {
                e.preventDefault();
                var touch = getTouches(e)[0];
                that._exec(tableFromLocation(touch.location));
            });
    },

    _valid: function(size) {
        return size && size.row > 0 && size.col > 0 && size.row <= this.rows && size.col <= this.cols;
    },

    _exec: function(size) {
        if (this._valid(size)) {
            this._editor.exec("createTable", {
                rows: size.row,
                columns: size.col
            });
            this._popup.close();
        }
    },

    _setTableSize: function(size) {
        var element = this._popup.element;
        var status = element.find(".k-status");
        var cells = element.find(".k-ct-cell");
        var cols = this.cols;
        var messages = this._editor.options.messages;

        if (this._valid(size)) {
            status.text(kendo.format(messages.createTableHint, size.row, size.col));

            cells.each(function(i) {
                $(this).toggleClass(
                    SELECTEDSTATE,
                    i % cols < size.col && i / cols < size.row
                );
            });
        } else {
            status.text(messages.createTable);
            cells.removeClass(SELECTEDSTATE);
        }
    },

    _keydown: function(e) {
        var initiallyVisible = this._popup.visible();

        PopupTool.fn._keydown.call(this, e);

        if (!this._popup.visible()) {
            return;
        }

        var keys = kendo.keys;
        var key = e.keyCode;
        var cells = this._popup.element.find(".k-ct-cell");
        var focus = Math.max(cells.filter(".k-selected").last().index(), 0);
        var selectedRows = Math.floor(focus / this.cols);
        var selectedColumns = focus % this.cols;

        var changed = false,
            button;

        if (key == keys.DOWN && !e.altKey) {
            changed = true;
            selectedRows++;
        } else if (key == keys.UP) {
            changed = true;
            selectedRows--;
        } else if (key == keys.RIGHT) {
            changed = true;
            selectedColumns++;
        } else if (key == keys.LEFT) {
            changed = true;
            selectedColumns--;
        } else if (key == keys.TAB) {
            button = this._popup.element.find(".k-button");

            if (button.length > 0) {
                changed = true;
                button.trigger("focus");
            }
        }

        var tableSize = {
            row: Math.max(1, Math.min(this.rows, selectedRows + 1)),
            col: Math.max(1, Math.min(this.cols, selectedColumns + 1))
        };

        if (key == keys.ENTER && initiallyVisible) {
            this._exec(tableSize);
        } else {
            this._setTableSize(tableSize);
        }

        if (changed) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    },

    _open: function() {
        var messages = this._editor.options.messages;

        PopupTool.fn._open.call(this);

        this.popup().element
            .find(".k-status").text(messages.createTable).end()
            .find(".k-ct-cell").removeClass(SELECTEDSTATE);
    },

    _close: function() {
        PopupTool.fn._close.call(this);
        this.popup().element.off("." + NS);
    }
});

var TableModificationCommand = Command.extend({
    undo: function() {
        var point = this.restorePoint;
        point.restoreHtml();

        $(this.editor.body).find(".k-element-resize-handle-wrapper")
            .each(function(index,el) {
                el.remove();
            });

        this.editor.selectRange(point.toRange());
    },
    _clearColIndexAttr: function(table) {
        dom.clearTableMappings(table, "col-index");
    },
    _mapColIndices: function(table) {
        dom.reMapTableColumns(table, "col-index");
    },
    _findRowSpanCell: function(parent, rowIndex, colIndex) {
        var row, cell;

        for (var i = rowIndex; i >= 0; i--) {
            row = parent.rows[i];
            cell = $(row).find("[col-index=" + colIndex + "]");

            if (cell.length) {
                return cell;
            }
        }
    },
    _resetElementResizing: function(editor) {
        editor._destroyResizings();
        editor._initializeColumnResizing();
        editor._initializeRowResizing();
        editor._initializeElementResizing();
    },
    _findNextTdInRow: function(row, colIndex) {
        var lastTd = row.find("td:last-child"),
            lastIndex = parseInt(lastTd.attr("col-index"), 10) + lastTd.prop("colSpan") - 1,
            td;

        for (var i = colIndex; i <= lastIndex; i++) {
            td = row.find("[col-index=" + i + "]");
            if (td.length) {
                return td;
            }
        }
    },
    _adjustColgroups: function(row, table) {
        var colElements = table.getElementsByTagName(COL),
            colgroupElements = table.getElementsByTagName(COLGROUP),
            cells = row.cells,
            numberOfCells = cells.length,
            i, colgroup, cell;

        while (colElements.length > 0) {
            colElements[0].remove();
        }
        while (colgroupElements.length > 0) {
            colgroupElements[0].remove();
        }

        for (i = numberOfCells - 1; i >= 0; i--) {
            cell = cells[i];
            if (cell.getAttribute(SCOPE) === COLGROUP) {
                colgroup = dom.createEmptyNode(this.editor.document, COLGROUP);
                colgroup.setAttribute("span", cell.getAttribute(COLSPAN));
                table.prepend(colgroup);
            } else {
                table.prepend(dom.createEmptyNode(this.editor.document, COL));
            }
        }
    },
    _associateHeaderIds: function(table) {
        dom.clearTableMappings(table, "col-index");
        dom.reMapTableColumns(table, "col-index");
        $(table).find("th, td").removeAttr("id headers");
        dom.associateWithIds(table);
    },
    _getNumberOfColumns: function(table) {
        return dom._getNumberOfColumns(table, "td, th");
    }
});

var InsertRowCommand = TableModificationCommand.extend({
    exec: function() {
        var range = this.lockRange(true),
            td = dom.closest(range.endContainer, [TD, TH]),
            table = dom.closest(td, TABLE),
            position = this.options.position || "after",
            cellCount, row, cell,
            newRow, rowIndex, rowSpanIndex, createdCell;

        if (!table || (this.immutables() && Editor.Immutables.immutableParent(td))) {
            this.releaseRange(range);
            return;
        }

        this._mapColIndices(table);

        row = td.parentNode;
        rowIndex = dom.findNodeIndex(row, true);

        if (td.rowSpan > 1 && position === "after") {
            row = table.rows[rowIndex + td.rowSpan - 1];
        }

        cellCount = this._getNumberOfColumns(table);
        newRow = row.cloneNode(true);
        $(newRow).empty();

        for (var i = 0; i < cellCount; i = i + cell.prop("colSpan")) {
            cell = $(row).find("[col-index=" + i + "]");

            if (cell.length) {
                if (cell.prop("rowSpan") > 1 && position === "after" && cell) {
                    cell.attr(ROWSPAN, cell.prop("rowSpan") + 1);
                } else {
                    this._appendCell(newRow, cell);
                }
            } else {
                rowIndex = dom.findNodeIndex(row, true);
                cell = this._findRowSpanCell(row.parentElement, rowIndex, i);
                rowSpanIndex = cell.closest(TR).index();

                if (rowSpanIndex + cell.prop("rowSpan") - 1 === rowIndex && position === "after") {
                    this._appendCell(newRow, cell);
                } else {
                    cell.attr(ROWSPAN, cell.prop("rowSpan") + 1);
                }
            }

            createdCell = $(newRow).find("[col-index=" + i + "]");
            if (createdCell.attr(SCOPE) === ROWGROUP && !createdCell.attr(ROWSPAN)) {
                createdCell.attr(SCOPE, ROW);
            }
        }

        if (position == "before") {
            dom.insertBefore(newRow, row);
        } else {
            dom.insertAfter(newRow, row);
        }

        if ($(table).find("[headers]").length > 0) {
            this._associateHeaderIds(table);
        }

        this._clearColIndexAttr(table);
        this.releaseRange(range);

        this._resetElementResizing(this.editor);
    },
    _appendCell: function(row, cell) {
        var newCell;

        newCell = cell.clone();
        newCell.html(Editor.emptyTableCellContent);
        newCell.removeAttr(ROWSPAN);
        newCell.appendTo(row);
    }
});

var InsertColumnCommand = TableModificationCommand.extend({
    exec: function() {
        var range = this.lockRange(true),
            td = dom.closest(range.endContainer, [TD, TH]),
            table = dom.closest(td, TABLE),
            colElements = table.getElementsByTagName(COL),
            colgroupElements = table.getElementsByTagName(COLGROUP),
            columnIndex,
            i,
            rows = table && table.rows,
            cell,
            newCell,
            position = this.options.position || "after";


        if (!td || (this.immutables() && Editor.Immutables.immutableParent(td))) {
            this.releaseRange(range);
            return;
        }

        this._mapColIndices(table);

        columnIndex = parseInt(td.getAttribute("col-index"),10);

        if (td.colSpan > 1 && position === "after") {
            td.setAttribute("col-index", columnIndex + td.colSpan - 1);
            columnIndex = columnIndex + td.colSpan - 1;
        }

        for (i = 0; i < rows.length; i++) {
            cell = this._processForColSpan(rows[i], columnIndex, position, td);

            if (!cell) {
                continue;
            }

            newCell = cell.cloneNode();
            newCell.innerHTML = Editor.emptyTableCellContent;
            newCell.removeAttribute(COLSPAN);

            if (newCell.getAttribute(SCOPE) && newCell.getAttribute(SCOPE) === COLGROUP) {
                newCell.setAttribute(SCOPE, COL);
            }

            if (position == "before") {
                dom.insertBefore(newCell, cell);
            } else {
                dom.insertAfter(newCell, cell);
            }

            this._resizeCells(newCell, cell);
        }

        if (colElements.length > 0 || colgroupElements.length > 0) {
            this._adjustColgroups(rows[0], table);
        }

        if ($(table).find("[headers]").length > 0) {
            this._associateHeaderIds(table);
        }

        this._clearColIndexAttr(table);
        this.releaseRange(range);

        this._resetElementResizing(this.editor);
    },
    _processForColSpan: function(row, columnIndex, position, selectedCell) {
        var cell,
            colSpanEffect,
            index = columnIndex - 1;

        cell = $(row).find("[col-index=" + columnIndex + "]")[0];

        if (cell && cell.colSpan > 1 && position === "after" && cell !== selectedCell) {
            cell.colSpan += 1;
            return;
        }

        if (cell) {
            return cell;
        }

        for (index; index >= 0; index--) {
            cell = $(row).find("[col-index=" + index + "]")[0];

            if (cell && cell.colSpan > 1) {
                break;
            }
        }

        if (!cell) {
            return;
        }

        colSpanEffect = parseInt(cell.getAttribute("col-index"),10) + cell.colSpan - 1;

        if (colSpanEffect === columnIndex && position === "after") {
            return cell;
        } else if (columnIndex <= colSpanEffect) {
            cell.setAttribute(COLSPAN, cell.colSpan + 1);
        }
    },
    _resizeCells: function(newCell, cell) {
        var width = newCell.style.width,
        parsedWidth, unit, calculatedWidth;

        if (!width) {
            return;
        }

        parsedWidth = parseFloat(width);
        unit = width.slice(parsedWidth.toString().length);
        calculatedWidth = (parsedWidth / 2) + unit;

        newCell.style.width = calculatedWidth;
        cell.style.width = calculatedWidth;
    }
});

var DeleteRowCommand = TableModificationCommand.extend({
    exec: function() {
        var range = this.lockRange();
        var rows = RangeUtils.mapAll(range, function(node) {
            return $(node).closest(TR)[0];
        });
        var td = dom.closest(range.endContainer, [TD, TH]);
        var row = rows[0];
        var rowSpan = td ? td.rowSpan : 1;
        var rowIndex = $(rows[0]).index();
        var table = dom.closest(row, TABLE);
        var rowParent = row.parentElement;
        var focusElement;

        if (!table || (this.immutables() && Editor.Immutables.immutableParent(row))) {
            this.releaseRange(range);
            return;
        }

        for (var x = 0; x < rowSpan; x++) {
            if (rows.indexOf(rowParent.rows[rowIndex + x]) < 0) {
                rows.push(rowParent.rows[rowIndex + x]);
            }
        }

        if (table.rows.length <= rows.length) {
            focusElement = dom.next(table);
            if (!focusElement || dom.insignificant(focusElement)) {
                focusElement = dom.prev(table);
            }

            if (focusElement && focusElement.rows) {
                focusElement = focusElement.rows[0].cells[0];
            }

            dom.remove(table);
            this._resetElementResizing(this.editor);
        } else if (rowParent.rows.length <= rows.length) {
            focusElement = rowParent.nextSibling;

            if (!focusElement) {
                focusElement = rowParent.previousSibling;
            }

            dom.remove(rowParent);
        } else {
            this._mapColIndices(table);

            for (var i = 0; i < rows.length; i++) {
                row = rows[i];
                dom.removeTextSiblings(row);
                focusElement = dom.next(row) || dom.prev(row);
                focusElement = focusElement.cells[0];

                // IE needs to focus the new row before removing the old one
                this._focusElement(range, focusElement);
                focusElement = null;

                this._handleRowSpanCells(table, row);

                dom.remove(row);
            }

            this._clearColIndexAttr(table);
        }

        if ($(table).find("[headers]").length > 0) {
            this._associateHeaderIds(table);
        } else if (dom.is(rowParent, THEAD) && $(table).find("[scope]").length > 0) {
            this._adjustColgroups(rowParent.rows[0], table);
        }

        if (focusElement) {
            this._focusElement(range, focusElement);
        }

        this._resetElementResizing(this.editor);
    },
    _focusElement: function(range, node) {
        range.setStart(node, 0);
        range.collapse(true);
        this.editor.selectRange(range);
    },
    _handleRowSpanCells: function(table, row) {
        var index, cell, adjacentCell, nextRow, rowIndex = dom.findNodeIndex(row, true),
            firstRow = table.rows[0],
            lastCell = firstRow.cells[firstRow.cells.length - 1],
            lastIndex = parseInt(lastCell.getAttribute("col-index"),10) + lastCell.colSpan - 1;

        for (index = 0; index <= lastIndex; index = index + cell.prop("colSpan")) {
            cell = $(row).find("[col-index=" + index + "]");

            if (cell.length && cell.prop("rowSpan") > 1) {
                nextRow = table.rows[rowIndex + 1];
                adjacentCell = $(nextRow).find("[col-index=" + (index + 1) + "]");

                if (adjacentCell.length) {
                    adjacentCell.before(cell);
                } else {
                    $(nextRow).append(cell);
                }
                this._reduceRowSpan(cell);
            }

            if (!cell.length) {
                cell = this._findRowSpanCell(row.parentElement, rowIndex, index);
                this._reduceRowSpan(cell);
            }
        }
    },
    _reduceRowSpan: function(td) {
        var rowSpanValue = td.prop("rowSpan") - 1;

        if (rowSpanValue <= 1) {
            td.removeAttr(ROWSPAN);
            if (td.attr(SCOPE) === ROWGROUP) {
                td.attr(SCOPE, ROW);
            }
        } else {
            td.attr(ROWSPAN, rowSpanValue);
        }
    }
});

var DeleteColumnCommand = TableModificationCommand.extend({
    exec: function() {
        var range = this.lockRange(),
            td = dom.closest(range.endContainer, [TD, TH]),
            table = dom.closest(td, TABLE),
            rows = table && table.rows,
            columnCount = rows && rows[0].cells.length,
            colElements = table.getElementsByTagName(COL),
            colgroupElements = table.getElementsByTagName(COLGROUP),
            focusElement, columnIndex, i, cell, x;

        if (!td || (this.immutables() && Editor.Immutables.immutableParent(td))) {
            this.releaseRange(range);
            return;
        }

        if (columnCount == 1 || td.colSpan == columnCount) {
            focusElement = dom.next(table);
            if (!focusElement || dom.insignificant(focusElement)) {
                focusElement = dom.prev(table);
            }

            if (focusElement && focusElement.rows) {
                focusElement = focusElement.rows[0].cells[0];
            }

            dom.remove(table);
            this._resetElementResizing(this.editor);
        } else {
            dom.removeTextSiblings(td);

            focusElement = dom.next(td) || dom.prev(td);

            this._mapColIndices(table);

            columnIndex = parseInt(td.getAttribute("col-index"), 10);

            for (x = 0; x < td.colSpan; x++) {
                for (i = 0; i < rows.length; i = i + (cell.prop("rowSpan") || 1)) {
                    cell = $(rows[i]).find("[col-index=" + (columnIndex + x) + "]");

                    if (cell.length && cell.prop("colSpan") <= 1) {
                        cell.remove();
                    } else {
                        this._handleColSpanCells(rows[i], columnIndex + x);
                    }
                }
            }

            this._clearColIndexAttr(table);
        }

        if (colElements.length > 0 || colgroupElements.length > 0) {
            this._adjustColgroups(rows[0], table);
        }

        if ($(table).find("[headers]").length > 0) {
            this._associateHeaderIds(table);
        }

        if (focusElement) {
            range.setStart(focusElement, 0);
            range.collapse(true);
            this.editor.selectRange(range);
        }

        this._resetElementResizing(this.editor);
    },
    _handleColSpanCells: function(row, colIndex) {
        var cell = $(row).find("[col-index=" + colIndex + "]");

        if (cell.length && cell.prop("colSpan") > 1) {
            var clone = cell.clone(true);
            cell.after(clone);
            this._reduceColSpan(clone);
            clone.attr("col-index", parseInt(cell.attr("col-index"),10) + 1);
            cell.remove();
            return;
        }

        for (var i = colIndex; i >= 0; i--) {
            cell = $(row).find("[col-index=" + i + "]");

            if (cell.length) {
                this._reduceColSpan(cell);
                cell.attr("col-index", parseInt(cell.attr("col-index"),10) + 1);
                return;
            }
        }
    },
    _reduceColSpan: function(td) {
        var colSpanValue = td.prop("colSpan") - 1;

        if (colSpanValue <= 1) {
            td.removeAttr(COLSPAN);
            if (td.attr(SCOPE) === COLGROUP) {
                td.attr(SCOPE, COL);
            }
        } else {
            td.attr(COLSPAN, colSpanValue);
        }
    }
});

var MergeCellsHorizontallyCommand = TableModificationCommand.extend({
    exec: function() {
        var range = this.lockRange(),
            td = dom.closest(range.endContainer, [TD, TH]),
            table, row, columnIndex, nextTd, colspan;

            if (!td) {
                this.releaseRange(range);
                return;
            }

            table = dom.closest(td, TABLE);
            row = td.parentNode;
            columnIndex = dom.findNodeIndex(td, true);
            nextTd = row.children[columnIndex + 1];

            if (this.immutables() && Editor.Immutables.immutableParent(td)) {
                this.releaseRange(range);
                return;
            }

            this._mapColIndices(table);

            columnIndex = parseInt($(td).attr("col-index"), 10);
            nextTd = $(row).find("[col-index=" + (columnIndex + 1 + this._getColspan(td) - 1) + "]").get(0);

            if (!nextTd || nextTd.rowSpan !== td.rowSpan || td.tagName !== nextTd.tagName) {
                this._clearColIndexAttr(table);
                this.releaseRange(range);
                return;
            }

            colspan = this._getColspan(td) + this._getColspan(nextTd);

            $(td).prop(COLSPAN, colspan)
                 .append(dom.emptyNode(nextTd) ? "" : "<br/>" + nextTd.innerHTML);

            $(td).width(td.offsetWidth);
            $(nextTd).remove();

            if (td.getAttribute(SCOPE) === COL) {
                td.setAttribute(SCOPE, COLGROUP);
            }
            if (td.getAttribute(SCOPE) === COLGROUP) {
                this._adjustColgroups(row, table);
            }

            if ($(table).find("[headers]").length > 0) {
                this._associateHeaderIds(table);
            }

            this._clearColIndexAttr(table);
            this.releaseRange(range);
            this._resetElementResizing(this.editor);
    },
    _getColspan: function(td) {
        return parseInt(td.getAttribute(COLSPAN), 10) || 1;
    }
});

var MergeCellsVerticallyCommand = TableModificationCommand.extend({
    exec: function() {
        var range = this.lockRange(),
            td = dom.closest(range.endContainer, [TD, TH]),
            tr, parent, table, columnIndex, rowIndex, targetRow, bottomTd;

            if (!td) {
                this.releaseRange(range);
                return;
            }

            tr = dom.closest(td, TR);
            parent = dom.closest(td, [THEAD, TBODY]);
            table = dom.closest(td, TABLE);
            columnIndex = dom.findNodeIndex(td, true);
            rowIndex = dom.findNodeIndex(tr, true);

            if (rowIndex + 1 === parent.rows.length) {
                this.releaseRange(range);
                return;
            }

            targetRow = parent.rows[rowIndex + this._getRowspan(td)];
            bottomTd = targetRow && targetRow.children[columnIndex];

            if (this.immutables() && Editor.Immutables.immutableParent(td)) {
                this.releaseRange(range);
                return;
            }

            this._mapColIndices(table);

            columnIndex = $(td).attr("col-index");
            bottomTd = $(targetRow).find("[col-index=" + columnIndex + "]").get(0);

            if (!bottomTd || bottomTd.colSpan !== td.colSpan || td.tagName !== bottomTd.tagName) {
                this._clearColIndexAttr(table);
                this.releaseRange(range);
                return;
            }

            $(td).prop(ROWSPAN, this._getRowspan(td) + this._getRowspan(bottomTd))
                 .append(dom.emptyNode(bottomTd) ? "" : "<br/>" + bottomTd.innerHTML);

            if (td.getAttribute(SCOPE) === ROW) {
                td.setAttribute(SCOPE, ROWGROUP);
            }

            $(bottomTd).remove();

            if ($(table).find("[headers]").length > 0) {
                this._associateHeaderIds(table);
            }

            this._clearColIndexAttr(table);
            this.releaseRange(range);
    },
    _getRowspan: function(td) {
        return parseInt(td.getAttribute(ROWSPAN), 10) || 1;
    }
});

var SplitCellCommand = TableModificationCommand.extend({
    exec: function() {
        var range = this.lockRange(),
            type = this.options.type,
            attr = type === "row" ? COLSPAN : ROWSPAN,
            td = dom.closest(range.endContainer, [TD, TH]),
            parent = dom.closest(td, [THEAD, TBODY]),
            table = dom.closest(td, TABLE),
            emptyTd = dom.createEmptyNode(this.editor.document, td.nodeName.toLowerCase());

        if (!td || (this.immutables() && Editor.Immutables.immutableParent(td))) {
            this.releaseRange(range);
            return;
        }

        this._mapColIndices(table);

        if (type === "row" && $(td).is("[" + attr + "]")) {
            this._splitCellHorizontally(td, parent, attr, emptyTd);
        } else if (type === "column" && $(td).is("[" + attr + "]")) {
            this._splitCellVertically(td, parent, attr, emptyTd);
        }

        if ($(td).prop(attr.toLowerCase()) <= 1) {
            $(td).removeAttr(attr);
        }

        if ($(table).find("[headers]").length > 0) {
            this._associateHeaderIds(table);
        }

        this._clearColIndexAttr(table);
        this.releaseRange(range);
    },
    _getRowspanValue: function(td) {
        return parseInt(td.getAttribute(ROWSPAN), 10);
    },
    _getColspanValue: function(td) {
        return parseInt(td.getAttribute(COLSPAN), 10);
    },
    _splitCellHorizontally: function(td, parent, attr, emptyTd) {
        var rowSpan = td.rowSpan,
            colSpan = td.colSpan,
            tdToAdd = $(emptyTd),
            colSpanResult = Math.floor(colSpan / 2);

            if (colSpanResult > 1) {
                tdToAdd.attr(COLSPAN, colSpanResult);
            }

            if (rowSpan > 1) {
                tdToAdd.attr(ROWSPAN, rowSpan);
            }

            $(td).prop(attr, colSpan - colSpanResult)
                .after(tdToAdd);

            $(td).width(td.offsetWidth);
            tdToAdd.width(tdToAdd[0].offsetWidth);

            if (td.hasAttribute(SCOPE)) {
                if (td.getAttribute(SCOPE) === COLGROUP) {
                    tdToAdd.attr(SCOPE, COL);
                    if (!td.getAttribute(COLSPAN) || td.getAttribute(COLSPAN) === "1") {
                        td.setAttribute(SCOPE, COL);
                    }

                    this._adjustColgroups(td.parentNode, parent.parentNode);
                } else {
                    tdToAdd.attr(SCOPE, td.getAttribute(SCOPE));
                }
            }
    },
    _splitCellVertically: function(td, parent, attr, emptyTd) {
        var tr = dom.closest(td,TR),
            columnIndex = parseInt($(td).attr("col-index"), 10),
            rowIndex = dom.findNodeIndex(tr, true),
            rowSpan = td.rowSpan,
            colSpan = td.colSpan,
            rowSpanResult = Math.floor(rowSpan / 2),
            targetRow = $(parent).find(TR).eq(rowIndex + rowSpan - rowSpanResult),
            nextTd = this._findNextTdInRow(targetRow, columnIndex + colSpan),
            tdToAdd = $(emptyTd);

            if (rowSpanResult > 1) {
                tdToAdd.attr(ROWSPAN, rowSpanResult);
            }
            if (colSpan > 1) {
                tdToAdd.attr(COLSPAN, colSpan);
            }

            if (nextTd && nextTd.length) {
                nextTd.before(tdToAdd);
            } else {
                targetRow.append(tdToAdd);
            }

            $(td).prop(attr, rowSpan - rowSpanResult);

            if (td.hasAttribute(SCOPE)) {
                if (td.getAttribute(SCOPE) === ROWGROUP) {
                    tdToAdd.attr(SCOPE, ROW);
                    if (!td.getAttribute(ROWSPAN) || td.getAttribute(ROWSPAN) === "1") {
                        td.setAttribute(SCOPE, ROW);
                    }
                } else {
                    tdToAdd.attr(SCOPE, td.getAttribute(SCOPE));
                }
            }
    }
});

var TableModificationTool = Tool.extend({
    command: function(options) {
        var commandsMap = {
            row: {
                insert: InsertRowCommand,
                "delete": DeleteRowCommand,
                merge: MergeCellsHorizontallyCommand,
                split: SplitCellCommand
            },
            column: {
                insert: InsertColumnCommand,
                "delete": DeleteColumnCommand,
                merge: MergeCellsVerticallyCommand,
                split: SplitCellCommand
            }
        };

        options = extend(options, this.options);
        options.action = options.action || "insert";

        return new commandsMap[options.type][options.action](options);
    },

    update: function(ui, nodes) {
        var isFormatted = !tableFormatFinder.isFormatted(nodes),
            toolbar = ui.closest(".k-toolbar").getKendoToolBar();

        if (isFormatted === true) {
            toolbar.hide(ui);
        } else {
            toolbar.show(ui);
        }
    }
});

var TableFormatCommand = FormatCommand.extend({
    exec: function() {
        var that = this;
        var editor = that.editor;

        FormatCommand.fn.exec.call(this);

        if (editor.elementResizing) {
            editor.elementResizing._showResizeHandles();
        }
    }
});

// var tableAlignFormatFinder = BlockFormatFinder.extend({

// });

var TableFormatTool = BlockFormatTool.extend({
    update: function(ui, nodes) {
        var isTable = !tableFormatFinder.isFormatted(nodes),
            isFormatted = this.options.finder.isFormatted(nodes, this.isTable),
            toolbar = ui.closest(".k-toolbar").getKendoToolBar();

        if (toolbar) {
            toolbar.toggle(ui, isFormatted);
        }

        if (isTable === true) {
            toolbar.hide(ui);
        } else {
            toolbar.show(ui);
        }
    },
    command: function(commandArguments) {
        var that = this;

        return new TableFormatCommand(extend(commandArguments, {
            formatter: that.options.formatter
        }));
    },
    isTable: function(node) {
        return dom.is(node, "table");
    }
});

extend(kendo.ui.editor, {
    PopupTool: PopupTool,
    TableCommand: TableCommand,
    InsertTableTool: InsertTableTool,
    TableFormatTool: TableFormatTool,
    TableFormatCommand: TableFormatCommand,
    TableModificationTool: TableModificationTool,
    InsertRowCommand: InsertRowCommand,
    InsertColumnCommand: InsertColumnCommand,
    DeleteRowCommand: DeleteRowCommand,
    DeleteColumnCommand: DeleteColumnCommand,
    MergeCellsHorizontallyCommand: MergeCellsHorizontallyCommand,
    MergeCellsVerticallyCommand: MergeCellsVerticallyCommand,
    SplitCellCommand: SplitCellCommand
});


registerTool("createTable", new InsertTableTool({ ui: { popup: true, overflow: "never" } }));

registerTool("addColumnLeft", new TableModificationTool({ type: "column", position: "before" }));
registerTool("addColumnRight", new TableModificationTool({ type: "column" }));
registerTool("addRowAbove", new TableModificationTool({ type: "row", position: "before" }));
registerTool("addRowBelow", new TableModificationTool({ type: "row" }));
registerTool("deleteRow", new TableModificationTool({ type: "row", action: "delete" }));
registerTool("deleteColumn", new TableModificationTool({ type: "column", action: "delete" }));
registerTool("mergeCellsHorizontally", new TableModificationTool({ type: "row", action: "merge" }));
registerTool("mergeCellsVertically", new TableModificationTool({ type: "column", action: "merge" }));
registerTool("splitCellHorizontally", new TableModificationTool({ type: "row", action: "split" }));
registerTool("splitCellVertically", new TableModificationTool({ type: "column", action: "split" }));

registerFormat("tableAlignLeft", [
    { tags: ["table"], attr: { style: { marginLeft: "", marginRight: "auto" } } },
    { tags: ["table"], attr: { align: "left" } }
]);
registerTool("tableAlignLeft", new TableFormatTool({
    format: formats.tableAlignLeft,
    ui: {
        togglable: true,
        group: "tableAlign"
    }
}));

registerFormat("tableAlignCenter", [
    { tags: ["table"], attr: { style: { marginLeft: "auto", marginRight: "auto" } } },
    { tags: ["table"], attr: { align: "center" } }
]);
registerTool("tableAlignCenter", new TableFormatTool({
    format: formats.tableAlignCenter,
    ui: {
        togglable: true,
        group: "tableAlign"
    }
}));

registerFormat("tableAlignRight", [
    { tags: ["table"], attr: { style: { marginLeft: "auto", marginRight: "" } } },
    { tags: ["table"], attr: { align: "right" } }
]);
registerTool("tableAlignRight", new TableFormatTool({
    format: formats.tableAlignRight,
    ui: {
        togglable: true,
        group: "tableAlign"
    }
}));

})(window.kendo.jQuery);

(function($) {

    // Imports ================================================================
    var kendo = window.kendo,
        Class = kendo.Class,
        editorNS = kendo.ui.editor,
        RangeUtils = editorNS.RangeUtils,
        dom = editorNS.Dom,
        RestorePoint = editorNS.RestorePoint,
        Marker = editorNS.Marker,
        browser = kendo.support.browser,
        extend = $.extend;

var Clipboard = Class.extend({
    init: function(editor) {
        this.editor = editor;
        var pasteCleanup = editor.options.pasteCleanup;
        this.nonSplittableTagsOnPaste = editor.options.nonSplittableTagsOnPaste || [];
        this.cleaners = [
            new ScriptCleaner(pasteCleanup),
            new TabCleaner(pasteCleanup),
            new MSWordFormatCleaner(pasteCleanup),
            new WebkitFormatCleaner(pasteCleanup),
            new HtmlTagsCleaner(pasteCleanup),
            new HtmlAttrCleaner(pasteCleanup),
            new HtmlContentCleaner(pasteCleanup),
            new CustomCleaner(pasteCleanup) //always keep at end
        ];
    },

    htmlToFragment: function(html) {
        var editor = this.editor,
            doc = editor.document,
            container = dom.create(doc, 'div'),
            fragment = doc.createDocumentFragment();

        container.innerHTML = html;

        while (container.firstChild) {
            fragment.appendChild(container.firstChild);
        }

        return fragment;
    },

    isBlock: function(html) {
        return (/<(div|p|ul|ol|table|h[1-6])/i).test(html);
    },

    _startModification: function() {
        var range;
        var restorePoint;
        var editor = this.editor;

        if (this._inProgress) {
            return;
        }

        this._inProgress = true;

        range = editor.getRange();
        restorePoint = new RestorePoint(range, editor.body);

        dom.persistScrollTop(editor.document);

        return { range: range, restorePoint: restorePoint };
    },

    _endModification: function(modificationInfo) {
        editorNS._finishUpdate(this.editor, modificationInfo.restorePoint);

        this.editor._selectionChange();

        this._inProgress = false;
    },

    _contentModification: function(before, after) {
        var that = this;
        var editor = that.editor;
        var modificationInfo = that._startModification();

        if (!modificationInfo) {
            return;
        }

        before.call(that, editor, modificationInfo.range);

        setTimeout(function() {
            after.call(that, editor, modificationInfo.range);

            that._endModification(modificationInfo);
        });
    },

    _removeBomNodes: function(range) {
        var nodes = RangeUtils.textNodes(range);

        for (var i = 0; i < nodes.length; i++) {
            nodes[i].nodeValue = dom.stripBom(nodes[i].nodeValue) || nodes[i].nodeValue;
        }
    },

    _onBeforeCopy: function(range) {
        var marker = new Marker();
        marker.add(range);

        this._removeBomNodes(range);

        marker.remove(range);

        this.editor.selectRange(range);
    },

    oncopy: function() {
        this._onBeforeCopy(this.editor.getRange());
    },

    oncut: function() {
        this._onBeforeCopy(this.editor.getRange());
        this._contentModification($.noop, $.noop);
    },

    _fileToDataURL: function(blob) {
        var deferred = $.Deferred();

        var reader = new FileReader();

        if (!(blob instanceof window.File) && blob.getAsFile) {
            blob = blob.getAsFile();

            if (!blob) {
                return;
            }
        }

        reader.onload = deferred.resolve.bind(deferred);

        reader.readAsDataURL(blob);

        return deferred.promise();
    },

    _triggerPaste: function(html, options) {
        var args = { html: html || "" };

        args.html = args.html.replace(/\ufeff/g, "");

        this.editor.trigger("paste", args);

        this.paste(args.html, options || {});
    },

    _handleImagePaste: function(e) {
        if (!('FileReader' in window) || (browser.msie && browser.version > 10)) {
            return;
        }

        var clipboardData = e.clipboardData || e.originalEvent.clipboardData ||
                    window.clipboardData || {};

        var items = clipboardData.items || clipboardData.files;

        return this._insertImages(items);
    },

    _insertImages: function(items) {
        if (!items) {
            return;
        }

        var images = $.grep(items, function(item) { return (/^image\//i).test(item.type); });
        var html = $.grep(items, function(item) { return (/^text\/html/i).test(item.type); });

        if (html.length || !images.length) {
            return;
        }

        var modificationInfo = this._startModification();

        if (!modificationInfo) {
            return;
        }

        $.when.apply($, $.map(images, this._fileToDataURL))
            .done((function() {
                var results = Array.prototype.slice.call(arguments);
                var html = $.map(results, function(e) {
                    return '<img src="' + e.target.result + '" />';
                }).join("");

                this._triggerPaste(html);

                this._endModification(modificationInfo);
            }).bind(this));

        return true;
    },

    onpaste: function(e) {
        if (this.editor.body.contentEditable === "false") {
            return;
        }

        if (this._handleImagePaste(e)) {
            e.preventDefault();
            return;
        }

        this.expandImmutablesIn();

        this._contentModification(
            function beforePaste(editor, range) {
                var clipboardNode = dom.create(editor.document, 'div', {
                        className: 'k-paste-container',
                        innerHTML: "\ufeff"
                    });
                var browser = kendo.support.browser;
                var body = editor.body;

                this._decoreateClipboardNode(clipboardNode, body);

                body.appendChild(clipboardNode);

                //Browser scrolls to clipboardNode
                if (browser.webkit) {
                    this._moveToCaretPosition(clipboardNode, range);
                }

                // text ranges are slow in IE10-, DOM ranges are buggy in IE9-10
                if (browser.msie && browser.version < 11) {
                    e.preventDefault();
                    var r = editor.createRange();
                    r.selectNodeContents(clipboardNode);
                    editor.selectRange(r);
                    var textRange = editor.document.body.createTextRange();
                    textRange.moveToElementText(clipboardNode);
                    $(body).off('paste');
                    textRange.execCommand('Paste');
                    $(body).on('paste', this.onpaste.bind(this));
                } else {
                    var clipboardRange = editor.createRange();
                    clipboardRange.selectNodeContents(clipboardNode);
                    editor.selectRange(clipboardRange);
                }

                range.deleteContents();
            },
            function afterPaste(editor, range) {
                var html = "", containers;

                editor.selectRange(range);

                containers = $(editor.body).children(".k-paste-container");

                containers.each(function() {
                    var lastChild = this.lastChild;

                    if (lastChild && dom.is(lastChild, 'br')) {
                        dom.remove(lastChild);
                    }

                    html += this.innerHTML;
                });

                containers.remove();

                this._triggerPaste(html, { clean: true });
            }
        );
    },
    ondragover: function(e) {
        if (browser.msie || browser.edge) {
            e.stopPropagation();
            e.preventDefault();
        }
    },
    ondrop: function(e) {
        if (!('FileReader' in window)) {
            return;
        }

        var dataTransfer = (e.originalEvent || e).dataTransfer || {};
        var items = dataTransfer.items || dataTransfer.files;

        if (this._insertImages(items)) {
            e.preventDefault();
        }
    },
    _decoreateClipboardNode: function(node, body) {
        if (!browser.msie && !browser.webkit) {
            return;
        }

        node = $(node);
        node.css({
            borderWidth: "0px",
            width: "0px",
            height: "0px",
            overflow: "hidden",
            margin: "0",
            padding: "0"
        });

        if (browser.msie) {
            //node inherits BODY styles and this causes the browser to add additional
            var documentElement = $(body.ownerDocument.documentElement);

            node.css({
                fontVariant: "normal",
                fontWeight: "normal",
                lineSpacing: "normal",
                lineHeight: "normal",
                textDecoration: "none"
            });
            var color = documentElement.css("color");
            if (color) {
                node.css("color", color);
            }
            var fontFamily = documentElement.css("fontFamily");
            if (fontFamily) {
                node.css("fontFamily", fontFamily);
            }
            var fontSize = documentElement.css("fontSize");
            if (fontSize) {
                node.css("fontSize", fontSize);
            }
        }
    },
    _moveToCaretPosition: function(node, range) {
        var that = this;
        var body = that.editor.body;
        var nodeOffset = dom.offset(node, body);
        var caretOffset = that._caretOffset(range, body);
        var translateX = caretOffset.left - nodeOffset.left;
        var translateY = caretOffset.top - nodeOffset.top;
        var translate = "translate(" + translateX + "px," + translateY + "px)";

        $(node).css({
            "-webkit-transform": translate,
            "transform": translate
        });
    },
    _caretOffset: function(range, body) {
        var editor = this.editor;
        var caret = dom.create(editor.document, 'span', { innerHTML: "\ufeff" });
        var startContainer = range.startContainer;
        var rangeChanged;

        if (range.collapsed) {
            var isStartTextNode = dom.isDataNode(startContainer);
            if (isStartTextNode && (dom.isBom(startContainer) || range.startOffset === 0)) {
                dom.insertBefore(caret, startContainer);
            } else if (isStartTextNode && range.startOffset === startContainer.length) {
                dom.insertAfter(caret, startContainer);
            } else {
                range.insertNode(caret);
                rangeChanged = true;
            }
        } else {
            startContainer = startContainer === body ?
                startContainer.childNodes[range.startOffset] : startContainer;
            dom.insertBefore(caret, startContainer);
        }

        var offset = dom.offset(caret, body);
        var prev = caret.previousSibling;
        var next = caret.nextSibling;

        dom.remove(caret);

        if (rangeChanged && dom.isDataNode(prev) && dom.isDataNode(next) && !dom.isBom(prev) && !dom.isBom(next)) {
            var prevLength = prev.length;
            next.data = prev.data + next.data;
            range.setStart(next, prevLength);
            dom.remove(prev);

            range.collapse(true);
            editor.selectRange(range);
        }

        return offset;
    },

    expandImmutablesIn: function(range) {
        var editor = this.editor;
        if (editor && editor.options.immutables) {
            var body = editor.body;
            range = range || editor.getRange();
            kendo.ui.editor.Immutables.expandImmutablesIn(range);
            if (range.startContainer === body && range.startOffset === 0) {
                var doc = body.ownerDocument;
                var bomNode = doc.createTextNode("\ufeff");
                body.insertBefore(bomNode, body.childNodes[0]);
                range.setStartBefore(bomNode);
            }
            editor.selectRange(range);
        }
    },

    splittableParent: function(block, node) {
        var parentNode, body;

        if (block) {
            return dom.closestEditableOfType(node, ['p', 'ul', 'ol']) || node.parentNode;
        }

        parentNode = node.parentNode;
        body = node.ownerDocument.body;

        if (dom.isInline(parentNode)) {
            while (parentNode.parentNode != body && !dom.isBlock(parentNode.parentNode)) {
                parentNode = parentNode.parentNode;
            }
        }

        return parentNode;
    },

    paste: function(html, options) {
        var editor = this.editor,
            nonSplittableTagsOnPaste = this.nonSplittableTagsOnPaste,
            preventSplit = false,
            unwrapPasted = false,
            i, l, childNodes, isList;

        this.expandImmutablesIn();

        options = extend({ clean: false, split: true }, options);

        if (!options.skipCleaners) {
            for (i = 0, l = this.cleaners.length; i < l; i++) {
                if (this.cleaners[i].applicable(html)) {
                    html = this.cleaners[i].clean(html);
                }
            }
        }

        if (options.clean) {
            // remove br elements which immediately precede block elements
            html = html.replace(/(<br>(\s|&nbsp;)*)+(<\/?(div|p|li|col|t))/ig, "$3");
            // remove empty inline elements
            html = html.replace(/<(a|span)[^>]*><\/\1>/ig, "");
        }

        html = html.replace(/<(a|span|font)([^>]*)> <\/\1>/ig, "<$1$2>&nbsp;</$1>");

        // It is possible in IE to copy just <li> tags
        html = html.replace(/^<li/i, '<ul><li').replace(/li>$/g, 'li></ul>');

        var block = this.isBlock(html);

        editor.focus();
        var range = editor.getRange();
        range.deleteContents();

        if (range.startContainer == editor.document) {
            range.selectNodeContents(editor.body);
        }

        var marker = new Marker();
        var caret = marker.addCaret(range);

        var parent = this.splittableParent(block, caret);
        var unwrap = false;

        for (i = 0; i < nonSplittableTagsOnPaste.length; i++) {
            const splitter = nonSplittableTagsOnPaste[i],
                tag = splitter.tag || splitter;

            if (dom.is(parent, tag)) {
                preventSplit = true;
                unwrapPasted = splitter.unwrap !== false;
                break;
            }
        }

        var splittable = parent != editor.body && !dom.is(parent, "td") && !preventSplit;

        if (options.split && splittable && (block || dom.isInline(parent))) {
            range.selectNode(caret);
            RangeUtils.split(range, parent, true);
            unwrap = true;
        }

        var fragment = this.htmlToFragment(html);

        if (fragment.firstChild && fragment.firstChild.className === "k-paste-container") {
            var fragmentsHtml = [];
            for (i = 0, l = fragment.childNodes.length; i < l; i++) {
                fragmentsHtml.push(fragment.childNodes[i].innerHTML);
            }

            fragment = this.htmlToFragment(fragmentsHtml.join('<br />'));
        }

        childNodes = fragment.childNodes;

        if (unwrapPasted) {
            isList = dom.list(childNodes[0]);
            dom.unwrap(childNodes[0]);

            if (isList) {
                range.selectNode(caret.parentNode);
            }
        }

        $(childNodes)
            .filter("table").addClass("k-table").end()
            .find("table").addClass("k-table");

        $(childNodes).each(function(index, elm) {
           if (dom.isBlock(elm) && !dom.isSelfClosing(elm) && elm.innerHTML === "") {
                elm.appendChild(editor.document.createTextNode("\ufeff"));
           }
        });

        range.insertNode(fragment);

        parent = this.splittableParent(block, caret);
        if (unwrap) {
            while (caret.parentNode != parent) {
                dom.unwrap(caret.parentNode);
            }

            dom.unwrap(caret.parentNode);
        }

        dom.normalize(range.commonAncestorContainer);
        caret.style.display = 'inline';
        dom.restoreScrollTop(editor.document);
        dom.scrollTo(caret);
        marker.removeCaret(range);

        var rangeEnd = range.commonAncestorContainer.parentNode;
        if (range.collapsed && dom.name(rangeEnd) == "tbody" || range.collapsed && dom.name(rangeEnd) == "thead") {
            range.setStartAfter($(rangeEnd).closest("table")[0]);
            range.collapse(true);
        }

        var focusedTable = $(range.commonAncestorContainer.parentNode).closest("table");

        if (focusedTable.get(0)) {
            var siblingNodes = focusedTable.parent().contents();
            var lastSiblingIndex = siblingNodes.length - 1;
            var lastSibling = siblingNodes.get(lastSiblingIndex);

            while (lastSibling.nodeValue !== null && (lastSibling.nodeValue === " " || lastSibling.nodeValue === "")) {
                lastSiblingIndex -= 1;
                lastSibling = siblingNodes.get(lastSiblingIndex);
            }

            if (lastSibling === focusedTable.get(0) && !focusedTable.parents("table").length) {
                dom.insertAfter(dom.createEmptyNode(editor.document, "p"), focusedTable[0]);
            }
        }

        editor._handleSpaceAndNewLines();
        editor.selectRange(range);
    }
});

var Cleaner = Class.extend({
    init: function(options) {
        this.options = options || {};
        this.replacements = [];
    },

    clean: function(html, customReplacements) {
        var that = this,
            replacements = customReplacements || that.replacements,
            i, l;

        for (i = 0, l = replacements.length; i < l; i += 2) {
            html = html.replace(replacements[i], replacements[i + 1]);
        }

        return html;
    }
});

var ScriptCleaner = Cleaner.extend({
    init: function(options) {
        Cleaner.fn.init.call(this, options);

        this.replacements = [
            /<(\/?)script([^>]*)>/i, "<$1telerik:script$2>"
        ];
    },

    applicable: function(html) {
        return !this.options.none && (/<script[^>]*>/i).test(html);
    }
});

var TabCleaner = Cleaner.extend({
    init: function(options) {
        Cleaner.fn.init.call(this, options);

        var replacement = ' ';
        this.replacements = [
            /<span\s+class="Apple-tab-span"[^>]*>\s*<\/span>/gi, replacement,
            /\t/gi, replacement,
            /&nbsp;&nbsp; &nbsp;/gi, replacement
        ];
    },

    applicable: function(html) {
        return (/&nbsp;&nbsp; &nbsp;|class="?Apple-tab-span/i).test(html);
    }
});

var MSWordFormatCleaner = Cleaner.extend({
    init: function(options) {
        Cleaner.fn.init.call(this, options);

        this.junkReplacements = [
            /<\?xml[^>]*>/gi, '',
            /<!--(.|\n)*?-->/g, '', /* comments */
            /&quot;/g, "'", /* encoded quotes (in attributes) */
            /<o:p>&nbsp;<\/o:p>/ig, '&nbsp;',
            /<\/?(meta|link|style|o:|v:|x:)[^>]*>((?:.|\n)*?<\/(meta|link|style|o:|v:|x:)[^>]*>)?/ig, '', /* external references and namespaced tags */
            /<\/o>/g, ''
        ];
        this.replacements = this.junkReplacements.concat([
            /(?:<br>&nbsp;[\s\r\n]+|<br>)*(<\/?(h[1-6]|hr|p|div|table|tbody|thead|tfoot|th|tr|td|li|ol|ul|caption|address|pre|form|blockquote|dl|dt|dd|dir|fieldset)[^>]*>)(?:<br>&nbsp;[\s\r\n]+|<br>)*/g, '$1',
            /<br><br>/g, '<BR><BR>',
            /<br>\n/g, '<br/>',
            /<br>(?!\n)/g, ' ',
            /<table([^>]*)>(\s|&nbsp;)+<t/gi, '<table$1><t',
            /<tr[^>]*>(\s|&nbsp;)*<\/tr>/gi, '',
            /<tbody[^>]*>(\s|&nbsp;)*<\/tbody>/gi, '',
            /<table[^>]*>(\s|&nbsp;)*<\/table>/gi, '',
            /<BR><BR>/g, '<br>',
            /^\s*(&nbsp;)+/gi, '',
            /(&nbsp;|<br[^>]*>)+\s*$/gi, '',
            /mso-[^;"]*;?/ig, '', /* office-related CSS attributes */
            /<(\/?)b(\s[^>]*)?>/ig, '<$1strong$2>',
            /<(\/?)font(\s[^>]*)?>/ig, this.convertFontMatch,
            /<(\/?)i(\s[^>]*)?>/ig, '<$1em$2>',
            /style=(["|'])\s*\1/g, '', /* empty style attributes */
            /(<br[^>]*>)?\n/g, function($0, $1) { return $1 ? $0 : ' '; } /* phantom extra line feeds */
        ]);
    },

    convertFontMatch: function(match, closing, args) {
        var faceRe = /face=['"]([^'"]+)['"]/i;
        var face = faceRe.exec(args);
        var family = args && face && face[1];

        if (closing) {
            return '</span>';
        } else if (family) {
            return '<span style="font-family:' + family + '">';
        } else {
            return '<span>';
        }
    },

    applicable: function(html) {
        return (/class="?Mso/i).test(html) ||
               (/style="[^"]*mso-/i).test(html) ||
               (/urn:schemas-microsoft-com:office/).test(html);
    },

    stripEmptyAnchors: function(html) {
        return html.replace(/<a([^>]*)>\s*<\/a>/ig, function(a, attributes) {
            if (!attributes || attributes.indexOf("href") < 0) {
                return "";
            }

            return a;
        });
    },

    listType: function(p, listData) {
        var html = p.innerHTML;
        var text = dom.innerText(p);

        var startingSymbol;
        var matchSymbol = html.match(/^(?:<span [^>]*texhtml[^>]*>)?<span [^>]*(?:Symbol|Wingdings)[^>]*>([^<]+)/i);
        var symbol = matchSymbol && matchSymbol[1];
        var isNumber = /^[a-z\d]/i.test(symbol);//including alpha-numeric and roman numerals

        var trimStartText = function(text) {
            return text.replace(/^(?:&nbsp;|[\u00a0\n\r\s])+/, '');
        };

        if (matchSymbol) {
            startingSymbol = true;
        }

        html = html.replace(/<\/?\w+[^>]*>/g, '').replace(/&nbsp;/g, '\u00a0');

        if ((!startingSymbol && /^[\u2022\u00b7\u00a7\u00d8o]\u00a0+/.test(html)) ||
            (startingSymbol && /^.\u00a0+/.test(html)) ||
            (symbol && !isNumber && listData)) {
            return {
                tag: 'ul',
                style: this._guessUnorderedListStyle(trimStartText(text))
            };
        }

        if (/^\s*\w+[\.\)][\u00a0 ]{2,}/.test(html)) {
            return {
                tag: 'ol',
                style: this._guessOrderedListStyle(trimStartText(text))
            };
        }
    },

    _convertToLi: function(p) {
        var content;

        if (p.childNodes.length == 1) {
            content = p.firstChild.nodeType === dom.nodeTypes.TEXT_NODE ? dom.innerText(p) : p.firstChild.innerHTML.replace(/^\w+[\.\)](&nbsp;)+ /, "");
            content = this._checkForBullet(content);
        } else {
            content = this._getHtmlNoBullet(p);
        }

        dom.remove(p);

        return dom.create(document, 'li', { innerHTML: content });
    },

    _checkForBullet: function(html) {
        var p = dom.create(document, 'p', { innerHTML: html });
        var bulletRgx = /^\s*\w+[\.\)]\s+/;

        if (bulletRgx.test(p.innerText)) {
            return this._getHtmlNoBullet(p);
        }

        return html;
    },

    _getHtmlNoBullet: function(element) {
        var content,
            name = dom.name(element);

        dom.remove(element.firstChild);

        // check for roman numerals
        if (element.firstChild.nodeType == 3) {
            if (/^[ivxlcdm]+\.$/i.test(element.firstChild.nodeValue)) {
                dom.remove(element.firstChild);
            }
        }

        if (/^(&nbsp;|\s)+$/i.test(element.firstChild.innerHTML)) {
            dom.remove(element.firstChild);
        }

        if (name != "p") {
            content = "<" + name + ">" + element.innerHTML + "</" + name + ">";
        } else {
            content = element.innerHTML;
        }

        return content;
    },

    _guessUnorderedListStyle: function(symbol) {
        if (/^[\u2022\u00b7\u00FC\u00D8\u002dv-]/.test(symbol)) {
            return null;//return "disc"; //default CSS value
        } else if (/^o/.test(symbol)) {
            return "circle";
        } else {
            return "square";
        }
    },
    _guessOrderedListStyle: function(symbol) {
        var listType = null;
        if (!/^\d/.test(symbol)) {
            listType = (/^[a-z]/.test(symbol) ? 'lower-' : 'upper-') +
                       (/^[ivxlcdm]/i.test(symbol) ? 'roman' : 'alpha');
        }

        return listType;
    },

    extractListLevels: function(html) {
        var msoListRegExp = /style=['"]?[^'"]*?mso-list:\s?[a-zA-Z]+(\d+)\s[a-zA-Z]+(\d+)\s(\w+)/gi;

        html = html.replace(msoListRegExp, function(match, list, level) {
            return kendo.format('data-list="{0}" data-level="{1}" {2}', list, level, match);
        });

        return html;
    },

    _createList: function(type, styleType) {
        return dom.create(document, type, {
            style: { listStyleType: styleType }
        });
    },

    lists: function(placeholder) {
        var blockChildren = $(placeholder).find(dom.blockElements.join(',')),
            lastMargin = -1,
            name,
            levels = {},
            li,
            rootMargin,
            rootIndex,
            lastRootLi,
            isLastRootLi,
            rootList,
            i, p, type, margin, list, listData,
            acceptedNameTags = ["p", "h1", "h2", "h3", "h4", "h5", "h6"],
            isParentTable = false;

        for (i = 0; i < blockChildren.length; i++) {
            p = blockChildren[i];
            listData = $(p).data();
            var listIndex = listData.list;
            name = dom.name(p);
            isParentTable = !!$(p).parents("table").length;

            if (isParentTable) {
                continue;
            }

            var listType = this.listType(p, listData);
            type = listType && listType.tag;

            if (!type || acceptedNameTags.indexOf(name) < 0) {
                if (!p.innerHTML) {
                    dom.remove(p);
                } else if (li && !isLastRootLi) {
                    li.appendChild(p);
                }
                continue;
            }

            // not supported list levels in ie
            if (browser.msie) {
                continue;
            }

            margin = listData.level || parseFloat(p.style.marginLeft || 0);

            var levelType = type + listIndex;
            if (!levels[margin]) {
                levels[margin] = {};
            }

            if (!rootMargin || rootMargin < 0) {
                rootMargin = margin;
                rootIndex = listIndex;
                lastRootLi = $(placeholder).find("[data-list='" + rootIndex + "']").last()[0];
                rootList = this._createList(type, listType.style);
                dom.insertBefore(rootList, p);
                lastMargin = margin;
                levels[margin][levelType] = rootList;
            }

            isLastRootLi = lastRootLi === p;

            list = levels[margin][levelType];

            if (margin > lastMargin || !list) {
                list = this._createList(type, listType.style);
                levels[margin][levelType] = list;
                li.appendChild(list);
            }

            li = this._convertToLi(p);
            list.appendChild(li);

            if (isLastRootLi) {
                rootMargin = lastMargin = -1;
            } else {
                lastMargin = margin;
            }
        }
    },

    removeAttributes: function(element) {
        var attributes = element.attributes,
            i = attributes.length,
            significantStyles = [],
            isSignificantCss = function(val) {
                var significantCss = ["border", "background", "padding"];

                return significantCss.filter(function(cssAttr) {
                    return val.trim().indexOf(cssAttr) === 0;
                }).length > 0;
            },
            addSignificantStyles = function(val) {
                if (isSignificantCss(val)) {
                    significantStyles.push(val.trim());
                }
            },
            attr, attributeName, attributeValues;

        while (i--) {
            if (dom.name(attributes[i]) != "colspan") {
                attr = attributes[i];
                attributeName = attr.name;

                if (attributeName === "style" && (element.nodeName === "TD" || element.nodeName === "TH")) {
                    attributeValues = attr.value.split(";");
                    attributeValues.forEach(addSignificantStyles);
                }

                element.removeAttributeNode(attributes[i]);
            }
        }

        if (significantStyles.length > 0) {
            element.setAttribute("style", significantStyles.join(";"));
        }
    },

    createColGroup: function(row) {
        var cells = row.cells;
        var table = $(row).closest("table");
        var colgroup = table.children("colgroup");

        if (cells.length < 2) {
            return;
        } else if (colgroup.length) {
            cells = colgroup.children();
            colgroup[0].parentNode.removeChild(colgroup[0]);
        }

        colgroup = $($.map(cells, function(cell) {
                var width = cell.width;
                if (width && parseInt(width, 10) !== 0) {
                    return kendo.format('<col style="width:{0}px;"/>', width);
                }

                return "<col />";
            }).join(""));

        // jquery 1.9/2.0 discrepancy
        if (!colgroup.is("colgroup")) {
            colgroup = $("<colgroup/>").append(colgroup);
        }

        colgroup.prependTo(table);
    },

    convertHeaders: function(row) {
        var cells = row.cells,
            i,
            boldedCells = $.map(cells, function(cell) {
                var child = $(cell).children("p").children("strong")[0];

                if (child && dom.name(child) == "strong") {
                    return child;
                }
            });

        if (boldedCells.length == cells.length) {
            for (i = 0; i < boldedCells.length; i++) {
                dom.unwrap(boldedCells[i]);
            }

            $(row).closest("table")
                .find("colgroup").after("<thead></thead>").end()
                .find("thead").append(row);

            for (i = 0; i < cells.length; i++) {
                dom.changeTag(cells[i], "th");
            }
        }
    },

    removeParagraphs: function(cells) {
        var i, j, len, cell, paragraphs;

        for (i = 0; i < cells.length; i++) {
            this.removeAttributes(cells[i]);

            // remove paragraphs and insert line breaks between them
            cell = $(cells[i]);
            paragraphs = cell.children("p");

            for (j = 0, len = paragraphs.length; j < len; j++) {
                if (j < len - 1) {
                    dom.insertAfter(dom.create(document, "br"), paragraphs[j]);
                }

                dom.unwrap(paragraphs[j]);
            }
        }
    },

    removeTextNodes: function(trs) {
        var i, j, childNodes, currentNode, row;

        for (i = 0; i < trs.length; i++) {
            row = trs[i];
            childNodes = row.childNodes;

            for (j = 0; j < childNodes.length; j++) {
                currentNode = childNodes[j];

                if (currentNode.nodeType === dom.nodeTypes.TEXT_NODE) {
                    row.removeChild(currentNode);
                }
            }
        }
    },

    tables: function(placeholder) {
        var tables = $(placeholder).find("table"),
            that = this,
            rows,
            firstRow, longestRow, i, j;

        for (i = 0; i < tables.length; i++) {
            rows = tables[i].rows;
            longestRow = firstRow = rows[0];

            for (j = 1; j < rows.length; j++) {
                if (rows[j].cells.length > longestRow.cells.length) {
                    longestRow = rows[j];
                }
            }

            that.createColGroup(longestRow);
            that.convertHeaders(firstRow);

            that.removeAttributes(tables[i]);

            that.removeParagraphs(tables.eq(i).find("td,th"));

            that.removeTextNodes(tables.eq(i).find("tr"));
        }
    },

    headers: function(placeholder) {
        var titles = $(placeholder).find("p.MsoTitle");

        for (var i = 0; i < titles.length; i++) {
            dom.changeTag(titles[i], "h1");
        }
    },

    removeFormatting: function(placeholder) {
        $(placeholder).find("*").each(function() {
            $(this).css({
                fontSize: "",
                fontFamily: ""
            });

            if (!this.getAttribute("style") && !this.style.cssText) {
                this.removeAttribute("style");
            }
        });
    },

    clean: function(html) {
        var that = this, placeholder;
        var filters = this.options;

        if (filters.none) {
            html = Cleaner.fn.clean.call(that, html, this.junkReplacements);
            html = that.stripEmptyAnchors(html);
        } else {

            html = filters.msConvertLists ? this.extractListLevels(html) : html;
            html = Cleaner.fn.clean.call(that, html);
            html = that.stripEmptyAnchors(html);

            placeholder = dom.create(document, 'div', { innerHTML: html });
            that.headers(placeholder);

            if (filters.msConvertLists) {
                that.lists(placeholder);
            }
            that.tables(placeholder);

            if (filters.msAllFormatting) {
                that.removeFormatting(placeholder);
            }

            html = placeholder.innerHTML.replace(/(<[^>]*)\s+class="?[^"\s>]*"?/ig, '$1');
        }

        return html;
    }
});

var WebkitFormatCleaner = Cleaner.extend({
    init: function(options) {
        Cleaner.fn.init.call(this, options);

        this.replacements = [
            /\s+class="Apple-style-span[^"]*"/gi, '',
            /<(div|p|h[1-6])\s+style="[^"]*"/gi, '<$1',
            /^<div>(.*)<\/div>$/, '$1'
        ];
    },

    applicable: function(html) {
        return (/class="?Apple-style-span|style="[^"]*-webkit-nbsp-mode/i).test(html);
    }
});

var DomCleaner = Cleaner.extend({
    clean: function(html) {
        var container = dom.create(document, 'div', { innerHTML: html });
        container = this.cleanDom(container);
        return container.innerHTML;
    },

    cleanDom: function(container) {
        return container;
    }
});

var HtmlTagsCleaner = DomCleaner.extend({
    cleanDom: function(container) {
        var tags = this.collectTags();

        $(container).find(tags).each(function() {
            dom.unwrap(this);
        });

        return container;
    },

    collectTags: function() {
        if (this.options.span) {
            return "span";
        }
    },

    applicable: function() {
        return this.options.span;
    }
});

var HtmlAttrCleaner = DomCleaner.extend({
    cleanDom: function(container) {
        var attributes = this.collectAttr();
        var nodes = $(container).find("[" + attributes.join("],[") + "]");
        nodes.removeAttr(attributes.join(" "));

        return container;
    },

    collectAttr: function() {
        if (this.options.css) {
            return ["class", "style"];
        }

        return [];
    },

    applicable: function() {
        return this.options.css;
    }
});

var TextContainer = function() {
    this.text = "";
    this.add = function(text) {
        this.text += text;
    };
};

var HtmlTextLines = Class.extend({
    init: function(separators) {
        this.separators = separators || {
                text: " ",
                line: "<br/>"
            };
        this.lines = [];
        this.inlineBlockText = [];
        this.resetLine();
    },

    appendText: function(text) {
        if (text.nodeType === 3) {
            text = text.nodeValue;
        }

        this.textContainer.add(text);
    },

    appendInlineBlockText: function(text) {
        this.inlineBlockText.push(text);
    },

    flashInlineBlockText: function() {
        if (this.inlineBlockText.length) {
            this.appendText(this.inlineBlockText.join(" "));
            this.inlineBlockText = [];
        }
    },

    endLine: function() {
        this.flashInlineBlockText();
        this.resetLine();
    },

    html: function() {
        var separators = this.separators;
        var result = "";
        var lines = this.lines;

        this.flashInlineBlockText();

        for (var i = 0, il = lines.length, il1 = il - 1; i < il; i++) {
            var line = lines[i];
            for (var j = 0, jl = line.length, jl1 = jl - 1; j < jl; j++) {
                var text = line[j].text;
                result += text;
                if (j !== jl1) {
                    result += separators.text;
                }
            }
            if (i !== il1) {
                result += separators.line;
            }
        }

        return result;
    },

    resetLine: function() {
        this.textContainer = new TextContainer();
        this.line = [];
        this.line.push(this.textContainer);
        this.lines.push(this.line);
    }
});

var DomEnumerator = Class.extend({
    init: function(callback) {
        this.callback = callback;
    },
    enumerate: function(node) {
        if (!node) {
            return;
        }

        var preventDown = this.callback(node);

        var child = node.firstChild;
        if (!preventDown && child) {
            this.enumerate(child);
        }

        this.enumerate(node.nextSibling);
    }
});

var HtmlContentCleaner = Cleaner.extend({
    init: function(options) {
        Cleaner.fn.init.call(this, options);
        this.hasText = false; //unpleasant flag to prevent an empty line at the beginning of the generated content.
        this.enumerator = new DomEnumerator(this.buildText.bind(this));
    },

    clean: function(html) {
        var container = dom.create(document, 'div', { innerHTML: html });

        return this.cleanDom(container);
    },

    cleanDom: function(container) {
        this.separators = this.getDefaultSeparators();
        this.htmlLines = new HtmlTextLines(this.separators);
        this.enumerator.enumerate(container.firstChild);
        this.hasText = false;

        return this.htmlLines.html();
    },

    buildText: function(node) {
        if (dom.isDataNode(node)) {
            if (dom.isEmptyspace(node)) {
                return;
            }
            this.htmlLines.appendText(node.nodeValue.replace('\n', this.separators.line));
            this.hasText = true;
        } else if (dom.isBlock(node) && this.hasText) {
            var action = this.actions[dom.name(node)] || this.actions.block;
            return action(this, node);
        } else if (dom.isBr(node)) {
            this.htmlLines.appendText(this.separators.line);
        }
    },

    applicable: function() {
        var o = this.options;
        return o.all || o.keepNewLines;
    },

    getDefaultSeparators: function() {
        if (this.options.all) {
            return { text: " ", line: " " };
        } else {
            return { text: " ", line: "<br/>" };
        }
    },

    actions: {
        ul: $.noop,
        ol: $.noop,
        table: $.noop,
        thead: $.noop,
        tbody: $.noop,
        td: function(cleaner, node) {
            var tdCleaner = new HtmlContentCleaner({ all: true });

            var cellText = tdCleaner.cleanDom(node);
            cleaner.htmlLines.appendInlineBlockText(cellText);

            return true;
        },

        block: function(cleaner) {
            cleaner.htmlLines.endLine();
        }
    }
});

var CustomCleaner = Cleaner.extend({
    clean: function(html) {
        return this.options.custom(html);
    },

    applicable: function() {
        return typeof(this.options.custom) === "function";
    }
});

extend(editorNS, {
    Clipboard: Clipboard,
    Cleaner: Cleaner,
    ScriptCleaner: ScriptCleaner,
    TabCleaner: TabCleaner,
    MSWordFormatCleaner: MSWordFormatCleaner,
    WebkitFormatCleaner: WebkitFormatCleaner,
    HtmlTagsCleaner: HtmlTagsCleaner,
    HtmlAttrCleaner: HtmlAttrCleaner,
    HtmlContentCleaner: HtmlContentCleaner,
    HtmlTextLines: HtmlTextLines,
    CustomCleaner: CustomCleaner
});

})(window.kendo.jQuery);

(function($) {

// Imports ================================================================
var kendo = window.kendo,
    Class = kendo.Class,
    editorNS = kendo.ui.editor,
    RangeUtils = editorNS.RangeUtils,
    dom = editorNS.Dom,
    RestorePoint = editorNS.RestorePoint,
    Marker = editorNS.Marker,
    browser = kendo.support.browser,
    bomSpan = "<span  class='k-br'>\ufeff</span>",
    extend = $.extend;
var nodeTypes = dom.nodeTypes;
var PREVIOUS_SIBLING = "previousSibling";

function selected(node, range) {
    return range.startContainer === node && range.endContainer === node &&
        range.startOffset === 0 && range.endOffset == node.childNodes.length;
}

function getSibling(node, direction, condition) {
    var sibling = node ? node[direction] : null;

    while (sibling && !condition(sibling)) {
        sibling = sibling[direction];
    }

    return sibling;
}

var tableCells = "td,th,caption";
var tableCellsWrappers = "table,tbody,thead,tfoot,tr";
var tableElements = tableCellsWrappers + "," + tableCells;
var inTable = function(range) { return !range.collapsed && $(range.commonAncestorContainer).is(tableCellsWrappers); };

var RemoveTableContent = Class.extend({
    remove: function(range) {
        var that = this;
        var marker = new Marker();
        marker.add(range, false);

        var nodes = RangeUtils.getAll(range, function(node) { return $(node).is(tableElements); });
        var doc = RangeUtils.documentFromRange(range);
        var start = marker.start;
        var end = marker.end;
        var cellsTypes = tableCells.split(",");
        var startCell = dom.parentOfType(start, cellsTypes);
        var endCell = dom.parentOfType(end, cellsTypes);
        that._removeContent(start, startCell, true);
        that._removeContent(end, endCell, false);
        $(nodes).each(function(i, node) {
            node = $(node);
            (node.is(tableCells) ? node : node.find(tableCells)).each(function(j, cell) {
                cell.innerHTML = "&#65279;";
            });
        });
        if (startCell && !start.previousSibling) {
            dom.insertBefore(doc.createTextNode("\ufeff"), start);
        }
        if (endCell && !end.nextSibling) {
            dom.insertAfter(doc.createTextNode("\ufeff"), end);
        }
        if (startCell) {
            range.setStartBefore(start);
        } else if (nodes[0]) {
            startCell = $(nodes[0]);
            startCell = startCell.is(tableCells) ? startCell : startCell.find(tableCells).first();
            if (startCell.length) {
                range.setStart(startCell.get(0), 0);
            }
        }

        range.collapse(true);

        dom.remove(start);
        dom.remove(end);
    },
    _removeContent: function(start, top, forwards) {
        if (top) {
            var sibling = forwards ? "nextSibling" : "previousSibling",
                next,
                getNext = function(node) {
                    while (node && !node[sibling]) {
                        node = node.parentNode;
                    }
                    return node && $.contains(top, node) ? node[sibling] : null;
                };
            start = getNext(start);
            while (start) {
                next = getNext(start);
                dom.remove(start);
                start = next;
            }
        }
    }
});

var TypingHandler = Class.extend({
    init: function(editor) {
        this.editor = editor;
    },

    keydown: function(e) {
        var that = this,
            editor = that.editor,
            keyboard = editor.keyboard,
            isTypingKey = keyboard.isTypingKey(e),
            evt = extend($.Event(), e);

        that.editor.trigger("keydown", evt);

        if (evt.isDefaultPrevented() || (e && e.isDefaultPrevented())) {
            e.preventDefault();
            return true;
        }

        if (!evt.isDefaultPrevented() && isTypingKey && !keyboard.isTypingInProgress()) {
            var range = editor.getRange();
            var body = editor.body;
            that.startRestorePoint = new RestorePoint(range, body);

            if (inTable(range)) {
                var removeTableContent = new RemoveTableContent(editor);
                removeTableContent.remove(range);
                editor.selectRange(range);
            }

            if (browser.webkit && !range.collapsed && selected(body, range)) {
                body.innerHTML = "";
            }

            if (editor.immutables && editorNS.Immutables.immutablesContext(range)) {
                var backspaceHandler = new editorNS.BackspaceHandler(editor);
                backspaceHandler.deleteSelection(range);
            }

            keyboard.startTyping(function() {
                that._removeBomSpan();
                that.endRestorePoint = editorNS._finishUpdate(editor, that.startRestorePoint);
            });

            return true;
        }

        return false;
    },

    keyup: function(e) {
        var keyboard = this.editor.keyboard;

        this.editor.trigger("keyup", e);

        if (keyboard.isTypingInProgress()) {
            keyboard.endTyping();
            return true;
        }

        return false;
    },

    _removeBomSpan: function() {
        var node = this.editor.getRange().commonAncestorContainer;

        if (!dom.emptyNode(node)) {
            if (node.nodeType === 3) {
                node = node.parentNode;
            }

            if (dom.insignificant(node)) {
                // typing in an insignificant node
                // make it significant
                node.textContent = dom.stripBom(node.textContent);
                dom.unwrap(node);
            }
        }
    }
});

var BackspaceHandler = Class.extend({
    init: function(editor) {
        this.editor = editor;
    },
    _addCaret: function(container) {
        var caret = dom.create(this.editor.document, "a");

        // Only if not Chrome: Make sure to include cared in the formatted inline node
        if (!kendo.support.browser.chrome && container.firstChild &&
            container.firstChild.nodeType === nodeTypes.ELEMENT_NODE) {

            container = container.firstChild;
        }

        dom.insertAt(container, caret, 0);
        dom.stripBomNode(caret.previousSibling);
        dom.stripBomNode(caret.nextSibling);
        return caret;
    },
    _restoreCaret: function(caret) {
        var range = this.editor.createRange();

        if (!caret.nextSibling && dom.isDataNode(caret.previousSibling)) {
            range.setStart(caret.previousSibling, caret.previousSibling.length);
        } else {
            range.setStartAfter(caret);
        }

        range.collapse(true);
        this.editor.selectRange(range);
        dom.remove(caret);
    },
    _handleDelete: function(range) {
        var node = range.endContainer;
        var block = dom.closestEditableOfType(node, dom.blockElements);

        if (block && editorNS.RangeUtils.isEndOf(range, block)) {
            // join with next sibling
            var next = dom.next(block);
            if (!next || dom.name(next) != "p") {
                return false;
            }

            var caretPlaceholder = dom.significantChildNodes(next)[0];
            caretPlaceholder = (caretPlaceholder && dom.isInline(caretPlaceholder)) ? caretPlaceholder : next;
            var caret = this._addCaret(caretPlaceholder);

            this._merge(block, next);

            this._restoreCaret(caret);

            return true;
        }

        return false;
    },
    _cleanBomBefore: function(range) {
        var offset = range.startOffset;
        var node = range.startContainer;
        var text = node.nodeValue;
        var count = 0;
        while (offset - count >= 0 && text[offset - count - 1] == "\ufeff") {
            count++;
        }

        if (count > 0) {
            node.deleteData(offset - count, count);

            range.setStart(node, Math.max(0, offset - count));
            range.collapse(true);

            this.editor.selectRange(range);
        }
    },
    _handleBackspace: function(range) {
        var node = range.startContainer;
        var li = dom.closestEditableOfType(node, ['li']);
        var block = dom.closestEditableOfType(node, 'p,h1,h2,h3,h4,h5,h6'.split(','));
        var editor = this.editor;
        var previousSibling;

        if (dom.isDataNode(node)) {
            if (range.collapsed && /^\s[\ufeff]+$/.test(node.nodeValue)) {
                range.setStart(node, 0);
                range.setEnd(node, node.length);
                editor.selectRange(range);
                return false;
            }
            this._cleanBomBefore(range);
        }

        previousSibling = getSibling(block, PREVIOUS_SIBLING, function(sibling) {
            return !dom.htmlIndentSpace(sibling);
        });

        //deleting the first list item with empty content in IE results in invalid range
        if (range.collapsed && range.startOffset !== range.endOffset && range.startOffset < 0) {
            range.startOffset = 0;
            range.endOffset = 0;
            editor.selectRange(range);
        }

        var startAtLi = li && editorNS.RangeUtils.isStartOf(range, li);
        var liIndex = li && $(li).index();
        var startAtNonFirstLi = startAtLi && liIndex > 0;
        if (startAtNonFirstLi) {
            block = li;
            previousSibling = dom.prev(li);
        }

        if (block && previousSibling && dom.is(previousSibling, 'table') && editorNS.RangeUtils.isStartOf(range, block)) {
            if (block.innerText === '') {
                block.innerHTML = '\ufeff';
            }
            return true;
        }

        // outdent
        if (editorNS.RangeUtils.isStartOf(range, block) && parseInt(block.style.marginLeft,10) > 0) {
            editor.exec("outdent");
            return true;
        }

        // unwrap block
        if ((block && previousSibling && editorNS.RangeUtils.isStartOf(range, block)) || startAtNonFirstLi) {
            var caretPlaceholder = dom.significantChildNodes(block)[0];
            caretPlaceholder = (caretPlaceholder && dom.isInline(caretPlaceholder) && !dom.isImg(caretPlaceholder)) ? caretPlaceholder : block;

            var caret = this._addCaret(caretPlaceholder);
            this._merge(previousSibling, block);
            this._restoreCaret(caret);

            return true;
        }

        // unwrap li element
        if (startAtLi && liIndex === 0) {
            var child = li.firstChild;
            if (!child) {
                li.innerHTML = editorNS.emptyElementContent;
                child = li.firstChild;
            }

            var formatter = new editorNS.ListFormatter(dom.name(li.parentNode), "p");
            range.selectNodeContents(li);
            formatter.toggle(range);

            if (dom.insignificant(child)) {
                range.setStartBefore(child);
            } else {
                range.setStart(child, 0);
            }

            editor.selectRange(range);

            return true;
        }

        var rangeStartNode = node.childNodes[range.startOffset - 1];
        var linkRange = range;
        var anchor = rangeStartNode && dom.closestEditableOfType(rangeStartNode, ['a']);
        var previousNode = getSibling(rangeStartNode || node, PREVIOUS_SIBLING, function(sibling) {
            return !dom.isDataNode(sibling) || (!dom.isBom(sibling) && sibling.length > 0);
        });
        if (anchor || ((range.startOffset === 0 || rangeStartNode) && dom.is(previousNode, "a"))) {
            anchor = anchor || previousNode;
            linkRange = editor.createRange();
            linkRange.setStart(anchor, anchor.childNodes.length);
            linkRange.collapse(true);
        }

        anchor = anchor || dom.closestEditableOfType(rangeStartNode || linkRange.startContainer, ['a']);
        var isEndOfLink = anchor && editorNS.RangeUtils.isEndOf(linkRange, anchor);
        if (isEndOfLink) {
            var command = new editorNS.UnlinkCommand({ range: linkRange, body: editor.body, immutables: !!editor.immutables });
            editor.execCommand(command);
            editor._selectionChange();
        }
        return false;
    },
    _handleSelection: function(range) {
        var ancestor = range.commonAncestorContainer;
        var table = dom.closest(ancestor, "table");
        var emptyParagraphContent = editorNS.emptyElementContent;
        var editor = this.editor;
        var parentElementOrNode;

        if (inTable(range)) {
            var removeTableContent = new RemoveTableContent(editor);
            removeTableContent.remove(range);
            editor.selectRange(range);
            return true;
        }

        var marker = new Marker();
        marker.add(range, false);

        if (range.commonAncestorContainer === editor.body) {
            this._surroundFullyContent(marker, range);
        }

        if (editor.immutables) {
            this._handleImmutables(marker);
        }

        this._surroundFullySelectedAnchor(marker, range);

        range.setStartAfter(marker.start);
        range.setEndBefore(marker.end);

        var start = range.startContainer;
        var end = range.endContainer;

        range.deleteContents();

        if (end.tagName.toLocaleLowerCase() === "li" && dom.emptyNode(end)) {
            range.selectNode(end);
            range.deleteContents();
        }

        if (table && $(table).text() === "") {
            range.selectNode(table);
            range.deleteContents();
        }

        ancestor = range.commonAncestorContainer;

        if (dom.name(ancestor) === "p" && ancestor.innerHTML === "") {
            ancestor.innerHTML = emptyParagraphContent;
            range.setStart(ancestor, 0);
        }

        this._join(start, end);

        dom.insertAfter(editor.document.createTextNode("\ufeff"), marker.start);
        marker.remove(range);

        start = range.startContainer;
        if (dom.name(start) == "tr") {
            start = start.childNodes[Math.max(0, range.startOffset - 1)];
            range.setStart(start, dom.getNodeLength(start));
        }

        range.collapse(true);

        editor.selectRange(range);

        parentElementOrNode = start.parentElement || start.parentNode;

        if (dom.isDataNode(start) && !dom.emptyNode(parentElementOrNode)) {
            this._cleanBomBefore(range);
        }

        return true;
    },
    _handleImmutables: function(marker) {
        var immutableParent = editorNS.Immutables.immutableParent;
        var startImmutable = immutableParent(marker.start);
        var endImmutable = immutableParent(marker.start);
        if (startImmutable) {
            dom.insertBefore(marker.start, startImmutable);
        }
        if (endImmutable) {
            dom.insertAfter(marker.end, endImmutable);
        }
        if (startImmutable) {
            dom.remove(startImmutable);
        }
        if (endImmutable && endImmutable.parentNode) {
            dom.remove(endImmutable);
        }
    },
    _surroundFullyContent: function(marker, range) {
        var children = range.commonAncestorContainer.children,
            startParent = children[0],
            endParent = children[children.length - 1];

        this._moveMarker(marker, range, startParent, endParent);
    },
    _surroundFullySelectedAnchor: function(marker, range) {
        var start = marker.start,
            startParent = $(start).closest("a").get(0),
            end = marker.end,
            endParent = $(end).closest("a").get(0);

        this._moveMarker(marker, range, startParent, endParent);
    },
    _moveMarker: function(marker, range, startParent, endParent) {
        var start = marker.start,
            end = marker.end;

        if (startParent && RangeUtils.isStartOf(range, startParent)) {
            dom.insertBefore(start, startParent);
        }

        if (endParent && RangeUtils.isEndOf(range, endParent)) {
            dom.insertAfter(end, endParent);
        }
    },
    _root: function(node) {
        while (node && dom.name(node) != "body" && node.parentNode && dom.name(node.parentNode) != "body") {
            node = node.parentNode;
        }

        return node;
    },
    _join: function(start, end) {
        start = this._root(start);
        end = this._root(end);

        if (start != end && dom.is(end, "p")) {
            this._merge(start, end);
        }
    },
    _merge: function(dest, src) {
        dom.removeTrailingBreak(dest);

        while (dest && src.firstChild) {
            if (dest.nodeType == 1) {
                dest = dom.list(dest) ? dest.children[dest.children.length - 1] : dest;

                if (dest) {
                    dest.appendChild(src.firstChild);
                }
            } else if (dest.nodeType === nodeTypes.TEXT_NODE) {
                this._mergeWithTextNode(dest, src.firstChild);
            } else {
                dest.parentNode.appendChild(src.firstChild);
            }
        }

        dom.remove(src);
    },

    _mergeWithTextNode: function(textNode, appendedNode) {
        if (textNode && textNode.nodeType === nodeTypes.TEXT_NODE) {
            if (textNode.nextSibling && this._isCaret(textNode.nextSibling)) {
                dom.insertAfter(appendedNode, textNode.nextSibling);
            }
            else {
                dom.insertAfter(appendedNode, textNode);
            }
        }
    },

    _isCaret: function(element) {
        return $(element).is("a");
    },

    keydown: function(e) {
        var method, startRestorePoint;
        var editor = this.editor;
        var range = editor.getRange();
        var keyCode = e.keyCode;
        var keys = kendo.keys;
        var backspace = keyCode === keys.BACKSPACE;
        var del = keyCode == keys.DELETE;

        if (editor.immutables && editor.immutables.keydown(e, range)) {
            return;
        }

        if ((backspace || del) && !range.collapsed) {
            method = "_handleSelection";
        } else if (backspace) {
            method = "_handleBackspace";
        } else if (del) {
            method = "_handleDelete";
        }

        if (!method) {
            return;
        }

        startRestorePoint = new RestorePoint(range, editor.body);

        if (this[method](range)) {
            e.preventDefault();

            editorNS._finishUpdate(editor, startRestorePoint);
        }
    },
    deleteSelection: function(range) {
        this._handleSelection(range);
    },
    keyup: $.noop
});

var SystemHandler = Class.extend({
    init: function(editor) {
        this.editor = editor;
        this.systemCommandIsInProgress = false;
    },

    createUndoCommand: function() {
        this.startRestorePoint = this.endRestorePoint = editorNS._finishUpdate(this.editor, this.startRestorePoint);
    },

    changed: function() {
        if (this.startRestorePoint) {
            return this.startRestorePoint.html != this.editor.body.innerHTML;
        }

        return false;
    },

    keydown: function(e) {
        var that = this,
            editor = that.editor,
            keyboard = editor.keyboard;

        if (keyboard.isModifierKey(e)) {

            if (keyboard.isTypingInProgress()) {
                keyboard.endTyping(true);
            }

            that.startRestorePoint = new RestorePoint(editor.getRange(), editor.body);
            return true;
        }

        if (keyboard.isSystem(e)) {
            that.systemCommandIsInProgress = true;

            if (that.changed()) {
                that.systemCommandIsInProgress = false;
                that.createUndoCommand();
            }

            return true;
        }

        return false;
    },

    keyup: function() {
        var that = this;

        if (that.systemCommandIsInProgress && that.changed()) {
            that.systemCommandIsInProgress = false;
            that.createUndoCommand();
            return true;
        }

        return false;
    }
});

var SelectAllHandler = Class.extend({
    init: function(editor) {
        this.editor = editor;
    },

    keydown: function(e) {
        if (!browser.webkit || e.isDefaultPrevented() ||
            !(e.ctrlKey && e.keyCode == 65 && !e.altKey && !e.shiftKey)) {
            return;
        }
        if (this.editor.options.immutables) {
            this._toSelectableImmutables();
        }
        this._selectEditorBody();
    },

    _selectEditorBody: function() {
        var editor = this.editor;
        var range = editor.getRange();
        range.selectNodeContents(editor.body);

        setTimeout(function() {
            editor.selectRange(range);
        });
    },

    _toSelectableImmutables: function() {
        var editor = this.editor,
            body = editor.body,
            immutable = editorNS.Immutables.immutable,
            emptyTextNode = dom.emptyTextNode,
            first = body.firstChild,
            last = body.lastChild;

        while (emptyTextNode(first)) {
            first = first.nextSibling;
        }

        while (emptyTextNode(last)) {
            last = last.previousSibling;
        }

        if (first && immutable(first)) {
            $(bomSpan).prependTo(body);
        }

        if (last && immutable(last)) {
            $(bomSpan).appendTo(body);
        }
    },

    keyup: $.noop
});

var Keyboard = Class.extend({
    init: function(handlers) {
        this.handlers = handlers;
        this.typingInProgress = false;
    },

    isCharacter: function(keyCode) {
        return (keyCode >= 48 && keyCode <= 90) || (keyCode >= 96 && keyCode <= 111) ||
               (keyCode >= 186 && keyCode <= 192) || (keyCode >= 219 && keyCode <= 222) ||
               keyCode == 229;
    },

    toolFromShortcut: function(tools, e) {
        var key = String.fromCharCode(e.keyCode),
            toolName,
            toolOptions,
            modifier = this._getShortcutModifier(e, navigator.platform);

        for (toolName in tools) {
            toolOptions = $.extend({ ctrl: false, alt: false, shift: false }, tools[toolName].options);

            if ((toolOptions.key == key || toolOptions.key == e.keyCode) &&
                toolOptions.ctrl == modifier &&
                toolOptions.alt == e.altKey &&
                toolOptions.shift == e.shiftKey) {
                return toolName;
            }
        }
    },

    _getShortcutModifier: function(e, platform) {
        var mac = platform.toUpperCase().indexOf('MAC') >= 0;
        return mac ? e.metaKey : e.ctrlKey;
    },

    toolsFromShortcut: function(tools, e) {
        var key = String.fromCharCode(e.keyCode),
            toolName,
            o,
            matchesKey,
            found = [];
        var matchKey = function(toolKey) { return toolKey == key || toolKey == e.keyCode || toolKey == e.charCode; };

        for (toolName in tools) {
            o = $.extend({ ctrl: false, alt: false, shift: false }, tools[toolName].options);

            matchesKey = Array.isArray(o.key) ? $.grep(o.key, matchKey).length > 0 : matchKey(o.key);
            if (matchesKey &&
                o.ctrl == e.ctrlKey &&
                o.alt == e.altKey &&
                o.shift == e.shiftKey) {
                found.push(tools[toolName]);
            }
        }

        return found;
    },

    isTypingKey: function(e) {
        var keyCode = e.keyCode;
        return (this.isCharacter(keyCode) && !e.ctrlKey && !e.altKey) ||
               keyCode == 32 || keyCode == 13 || keyCode == 8 ||
               (keyCode == 46 && !e.shiftKey && !e.ctrlKey && !e.altKey);
    },

    isModifierKey: function(e) {
        var keyCode = e.keyCode;
        return (keyCode == 17 && !e.shiftKey && !e.altKey) ||
               (keyCode == 16 && !e.ctrlKey && !e.altKey) ||
               (keyCode == 18 && !e.ctrlKey && !e.shiftKey);
    },

    isSystem: function(e) {
        return e.keyCode == 46 && e.ctrlKey && !e.altKey && !e.shiftKey;
    },

    startTyping: function(callback) {
        this.onEndTyping = callback;
        this.typingInProgress = true;
    },

    stopTyping: function() {
        if (this.typingInProgress && this.onEndTyping) {
            this.onEndTyping();
        }
        this.typingInProgress = false;
    },

    endTyping: function(force) {
        var that = this;
        that.clearTimeout();
        if (force) {
            that.stopTyping();
        } else {
            that.timeout = window.setTimeout(that.stopTyping.bind(that), 1000);
        }
    },

    isTypingInProgress: function() {
        return this.typingInProgress;
    },

    clearTimeout: function() {
        window.clearTimeout(this.timeout);
    },

    notify: function(e, what) {
        var i, handlers = this.handlers;

        for (i = 0; i < handlers.length; i++) {
            if (handlers[i][what](e)) {
                break;
            }
        }
    },

    keydown: function(e) {
        this.notify(e, 'keydown');
    },

    keyup: function(e) {
        this.notify(e, 'keyup');
    }
});

extend(editorNS, {
    TypingHandler: TypingHandler,
    SystemHandler: SystemHandler,
    BackspaceHandler: BackspaceHandler,
    SelectAllHandler: SelectAllHandler,
    Keyboard: Keyboard
});

})(window.kendo.jQuery);

(function($) {

    // Imports ================================================================
    var kendo = window.kendo,
        editorNS = kendo.ui.editor,
        Command = editorNS.Command,
        EditorUtils = editorNS.EditorUtils,
        registerTool = EditorUtils.registerTool,
        Tool = editorNS.Tool,
        extend = $.extend;

var ExportPdfCommand = Command.extend({
    init: function(options) {
        this.async = true;
        Command.fn.init.call(this, options);
    },

    exec: function() {
        var that = this;
        var range = that.lockRange(true);
        var editor = that.editor;

        editor._destroyResizings();

        editor.saveAsPDF().then(function() {
            that.releaseRange(range);
            editor._initializeColumnResizing();
            editor._initializeRowResizing();
            editor._initializeElementResizing();
        });
    }
});

extend(editorNS, {
    ExportPdfCommand: ExportPdfCommand
});

registerTool("pdf", new Tool({ command: ExportPdfCommand }));

})(window.kendo.jQuery);

(function($) {

    // Imports ================================================================
    var kendo = window.kendo,
        editorNS = kendo.ui.editor,
        Command = editorNS.Command,
        EditorUtils = editorNS.EditorUtils,
        registerTool = EditorUtils.registerTool,
        Tool = editorNS.Tool,
        extend = $.extend;

var PrintCommand = Command.extend({
    init: function(options) {
        Command.fn.init.call(this, options);

        this.managesUndoRedo = true;
    },

    exec: function() {
        var editor = this.editor;

        if (kendo.support.browser.msie) {
            editor.document.execCommand("print", false, null);
        } else if (editor.window.print) {
            editor.window.print();
        }
    }
});

extend(editorNS, {
    PrintCommand: PrintCommand
});

registerTool("print", new Tool({ command: PrintCommand }));

})(window.kendo.jQuery);

(function($) {

var kendo = window.kendo,
    Editor = kendo.ui.editor,
    Tool = Editor.Tool,
    Command = Editor.Command,
    EditorUtils = Editor.EditorUtils,
    dom = Editor.Dom,
    RangeUtils = Editor.RangeUtils,
    registerTool = EditorUtils.registerTool;

var CopyFormatCommand = Command.extend({
    init: function(options) {
        Command.fn.init.call(this, options);
    },

    exec: function() {
        var range = this.lockRange(true);
        this.inlineStyles = [];
        this.blockStyles = [];
        this.collectStyles(range);
        this.editor.inlineStyles = this.inlineStyles;
        this.editor.blockStyles = this.blockStyles;
        this.releaseRange(range);
    },

    collectStyles: function(range) {
        var rangeNodes = RangeUtils.nodes(range);
        var node;

        if (rangeNodes.length === 1) {
            node = rangeNodes[0].parentNode;
        } else {
            node = range.startContainer;
        }

        while (node && !dom.is(node, "body") && node.getAttribute("data-role") !== "editor") {
            if (dom.isBlock(node)) {
                this.populateStyles(node, "blockStyles");
                if (dom.is(node, "li")) {
                    node = node.parentNode;
                } else {
                    node = null;
                }
            } else {
                this.populateStyles(node, "inlineStyles");
                node = node.parentNode;
            }
        }
    },

    populateStyles: function(node, destination) {
        var styles = node.style;
        var attributes = node.attributes;
        var nodeStyles = {
            tags: [ node.tagName ],
            attr: {
                style: {}
            }
        };
        var styleValue, styleKey, attributeKey, attributeValue, i;

        if (styles) {
            for (i = 0; i < styles.length; i++) {
                styleKey = styles[i];
                styleValue = styles[styleKey];
                nodeStyles.attr.style[styleKey] = styleValue;
            }
        }

        if (attributes) {
            for (i = 0; i < attributes.length; i++) {
                attributeKey = attributes[i].nodeName;
                attributeValue = attributes[i].nodeValue;
                if (attributeKey === "style") {
                    continue;
                } else if (attributeKey === "class") {
                    nodeStyles.attr.className = attributeValue;
                } else {
                    nodeStyles.attr[attributeKey] = attributeValue;
                }
            }
        }

        this[destination].push(nodeStyles);
    }
});

var ApplyFormatCommand = Command.extend({
    init: function(options) {
        Command.fn.init.call(this, options);
    },

    exec: function() {
        var range = this.lockRange(true);
        var markers = RangeUtils.getMarkers(range);
        var editor = this.editor;
        var inlineStyles = editor.inlineStyles;
        var blockStyles = editor.blockStyles;
        var nodes;

        if ((!inlineStyles || inlineStyles.length === 0) && (!blockStyles || blockStyles.length === 0)) {
            return;
        }

        if (markers.length === 3) {
            this.marker.removeCaret(range);
            this.marker.caret = null;
        }

        this.removeEmptyElementsFromRange(range);
        nodes = RangeUtils.nodes(range);
        this.cleanInlineParents(nodes);
        dom.normalize(range.commonAncestorContainer);

        if (markers.length === 2) {
            range.setStartAfter(markers[0]);
            range.setEndBefore(markers[1]);
        } else {
            range.setStartBefore(nodes[0]);
            range.setEndAfter(nodes[0]);
        }

        nodes = RangeUtils.nodes(range);

        if (nodes && blockStyles && blockStyles.length) {
            this.applyBlockStyles(nodes, blockStyles);
        }

        if (nodes && inlineStyles && inlineStyles.length) {
            this.applyInlineStyles(nodes, inlineStyles);
        }

        this.releaseRange(range);
    },

    removeEmptyElementsFromRange: function(range) {
        var isEmptyInline = function(node) {
            return dom.isInline(node) && !node.firstChild && !dom.isMarker(node);
        };
        var emptyElements, i;

        emptyElements = RangeUtils.getAll(range, isEmptyInline);

        if (emptyElements && emptyElements.length > 0) {
            for (i = 0; i < emptyElements.length; i++) {
                emptyElements[i].parentNode.removeChild(emptyElements[i]);
            }
        }
    },

    cleanInlineParents: function(nodes) {
        var i, node, parent, children, j, child, newNode;

        for (i = 0; i < nodes.length; i++) {
            node = nodes[i];
            parent = node.parentNode;

            if (this.immutableParent(node)) {
                continue;
            }

            while (parent && dom.isInline(parent)) {
                children = parent.childNodes;

                for (j = 0; j < children.length; j++) {
                    child = children[j];

                    if (!dom.isMarker(child) && child !== node) {
                        newNode = parent.cloneNode(true);
                        newNode.innerHTML = "";
                        dom.wrap(child, newNode);
                    }
                }

                dom.unwrap(parent);
                parent = node.parentNode;
            }
        }
    },

    applyBlockStyles: function(nodes, blockStyles) {
        var formatTag = blockStyles[0].tags[0];
        var attr = blockStyles[0].attr;
        var document = this.editor.document;
        var i, len, node, wrapper, blockParent, outerWrapper;
        var previousNodes, nextNodes, previous, next, prevWrapper, nextWrapper, child, j, listItems;

        for (i = 0, len = nodes.length; i < len; i++) {
            node = nodes[i];

            if (dom.isWhitespace(node) || this.immutableParent(node)) {
                continue;
            }

            blockParent = dom.blockParentOrBody(node);

            if (blockParent.tagName !== "BODY" && blockParent.tagName !== formatTag) {
                if (blockParent.tagName !== "LI" && blockParent.tagName !== "TD" && blockParent.tagName !== "TH") {
                    previousNodes = [];
                    nextNodes = [];
                    previous = node.previousSibling;
                    next = node.nextSibling;

                    while (previous) {
                        if (!dom.isMarker(previous)) {
                            previousNodes.push(previous);
                        }

                        previous = previous.previousSibling;
                    }

                    if (previousNodes.length) {
                        prevWrapper = blockParent.cloneNode(true);
                        prevWrapper.innerHTML = "";
                        dom.insertBefore(prevWrapper, previousNodes[0]);

                        for (j = 0; j < previousNodes.length; j++) {
                            child = previousNodes[j];
                            dom.insertAt(prevWrapper, child, 0);
                        }
                    }

                    while (next) {
                        if (!dom.isMarker(next)) {
                            nextNodes.push(next);
                        }

                        next = next.nextSibling;
                    }

                    if (nextNodes.length) {
                        nextWrapper = blockParent.cloneNode(true);
                        nextWrapper.innerHTML = "";
                        dom.insertBefore(nextWrapper, nextNodes[0]);

                        for (j = 0; j < nextNodes.length; j++) {
                            child = nextNodes[j];
                            nextWrapper.appendChild(child);
                        }
                    }

                    dom.unwrap(blockParent);
                }

                wrapper = dom.create(document, formatTag, attr);
                dom.wrap(node, wrapper);
            } else if (blockParent.tagName === formatTag) {
                dom.attr(blockParent, attr);
            }
        }

        if (blockParent && blockStyles.length === 2 && blockParent.tagName !== "LI" && formatTag === "LI") {
            listItems = [];

            while (dom.is(wrapper, "li")) {
                listItems.push(wrapper);
                wrapper = dom.prev(wrapper);
            }

            outerWrapper = dom.create(document, blockStyles[1].tags[0], blockStyles[1].attr);
            dom.insertBefore(outerWrapper, listItems[listItems.length - 1]);
            outerWrapper.appendChild(listItems[0]);

            for (i = 1, len = listItems.length; i < len; i++) {
                dom.insertBefore(listItems[i], outerWrapper.firstChild);
            }
        } else if (blockParent && blockStyles.length === 2 && blockParent.tagName !== "LI") {
            outerWrapper = dom.create(document, blockStyles[1].tags[0], blockStyles[1].attr);
            dom.wrap(wrapper, outerWrapper);
        }
    },

    applyInlineStyles: function(nodes, inlineStyles) {
        var document = this.editor.document;
        var currentStyle, createdNode, topNode, i, newNode, node;

        for (i = 0; i < inlineStyles.length; i++) {
            currentStyle = inlineStyles[i];
            createdNode = dom.create(document, currentStyle.tags[0], currentStyle.attr);

            if (topNode) {
                createdNode.appendChild(topNode);
            }

            topNode = createdNode;
        }

        if (topNode) {
            for (i = 0; i < nodes.length; i++) {
                node = nodes[i];
                if (dom.isWhitespace(node) || this.immutableParent(node)) {
                    continue;
                }
                newNode = topNode.cloneNode(true);
                dom.insertBefore(newNode, node);

                while (newNode.children && newNode.children.length) {
                    newNode = newNode.children[0];
                }

                newNode.appendChild(node);
            }
        }
    },

    immutables: function() {
        return this.editor && this.editor.options.immutables;
    },

    immutableParent: function(node) {
        return this.immutables() && Editor.Immutables.immutableParent(node);
    }
});

var CopyFormatTool = Tool.extend({
    init: function(options) {
        Tool.fn.init.call(this, options);
    },

    command: function(commandArguments) {
        return new CopyFormatCommand(commandArguments);
    }
});

var ApplyFormatTool = Tool.extend({
    init: function(options) {
        Tool.fn.init.call(this, options);
    },

    command: function(commandArguments) {
        return new ApplyFormatCommand(commandArguments);
    }
});

$.extend(Editor, {
    CopyFormatCommand: CopyFormatCommand,
    ApplyFormatCommand: ApplyFormatCommand,
    CopyFormatTool: CopyFormatTool,
    ApplyFormatTool: ApplyFormatTool
});

registerTool("copyFormat", new CopyFormatTool({ }));
registerTool("applyFormat", new ApplyFormatTool({ }));

})(window.kendo.jQuery);

(function($) {

    const kendo = window.kendo,
        extend = $.extend,
        Editor = kendo.ui.editor,
        formats = kendo.ui.Editor.fn.options.formats,
        dom = Editor.Dom,
        Tool = Editor.Tool,
        DelayedExecutionTool = Editor.DelayedExecutionTool,
        BlockFormatter = Editor.BlockFormatter,
        FormatCommand = Editor.FormatCommand,
        GreedyInlineFormatFinder = Editor.GreedyInlineFormatFinder,
        EditorUtils = Editor.EditorUtils,
        registerTool = EditorUtils.registerTool,
        registerFormat = EditorUtils.registerFormat,
        RangeUtils = Editor.RangeUtils,
        MOUSEDOWN_NS = "mousedown.kendoEditor",
        KEYDOWN_NS = "keydown.kendoEditor";

    const LineHeightCommand = FormatCommand.extend({
        exec: function() {
            const cmd = this,
                range = cmd.lockRange(true),
                nodes = dom.filterBy(RangeUtils.nodes(range), dom.htmlIndentSpace, true);

            cmd.formatter.format[0].attr.style.lineHeight = cmd.options.value.lineHeight;
            cmd.formatter.apply(nodes);
            cmd.releaseRange(range);
        }
    });

    const LineHeightFormatTool = DelayedExecutionTool.extend({
        init: function(options) {
            Tool.fn.init.call(this, options);

            this.type = "kendoComboBox";
            this.format = [{ tags: ["p", "lineHeight"] }];
            this.finder = new GreedyInlineFormatFinder(this.format, options.cssAttr, options.fontAttr, options.defaultValue);
        },

        command: function(commandArguments) {
            var that = this;

            return new LineHeightCommand(extend(commandArguments, {
                formatter: function() {
                    return new BlockFormatter(that.options.format);
                }
            }));
        },

        initialize: function(ui, editor) {
            let tool = this,
                component = ui.getKendoComboBox();

            tool.editor = editor;

            component.bind("change", this.changeHandler.bind(this));
            component.bind("close", this.closeHandler.bind(this));

            component.wrapper.on(MOUSEDOWN_NS, ".k-input-button,.k-input-inner", this.mouseDownHandler.bind(this))
                .on(KEYDOWN_NS, this.keyDownHandler.bind(this));
        },

        changeHandler: function(e) {
            this._exec(e.sender.value());
        },

        closeHandler: function() {
            let that = this,
                editor = that.editor;

            setTimeout(function() {
                editor._deleteSavedRange();
                that.currentRange = null;
            },0);
        },

        mouseDownHandler: function() {
            let newRange = this.editor.getRange();

            this.currentRange = this.editor._containsRange(newRange) ? newRange : this.currentRange;
        },

        keyDownHandler: function(e) {
            if (e.keyCode === kendo.keys.ENTER) {
                this.editor._deleteSavedRange();
                this.currentRange = null;
                e.preventDefault();
            }
        },

        _exec: function(value) {
            let editor = this.editor;
            editor._range = this.currentRange;
            if (value) {
                Tool.exec(this.editor, this.options.name, { lineHeight: value });
            }
        },
    });

    $.extend(Editor, {
        LineHeightCommand: LineHeightCommand,
        LineHeightFormatTool: LineHeightFormatTool
    });

    registerFormat("lineHeight", [
        { tags: dom.blockElements, attr: { style: { lineHeight: "normal" } } }
    ]);

    registerTool("lineHeight", new LineHeightFormatTool({
        cssAttr: "line-height",
        format: formats.lineHeight,
        defaultValue: 1.15,
        ui: {
            type: "component",
            component: "ComboBox",
            componentOptions: {
                value: 1.15,
                dataTextField: "text",
                dataValueField: "value",
                prefixOptions: {
                    icon: "paragraphHeight"
                },
                autoSize: true,
                dataSource: [
                    { text: "1", value: "1" },
                    { text: "1.15", value: "1.15" },
                    { text: "1.5", value: "1.5" },
                    { text: "2", value: "2" },
                    { text: "2.5", value: "2.5" },
                ]
            }
        }
    }));
})(window.kendo.jQuery);

(function($) {

    const kendo = window.kendo,
        Editor = kendo.ui.editor,
        Tool = Editor.Tool,
        Command = Editor.Command,
        EditorUtils = Editor.EditorUtils,
        registerTool = EditorUtils.registerTool,
        DOM = Editor.Dom,
        SPACE_UNICODE = "\u00B7",
        NEW_LINE_UNICODE = "\u21B5";

    const createMark = function(range, document, character, scrollTop, index, scrollableWrapper) {
        const clonedRange = range.cloneRange(),
              container = clonedRange.startContainer;

        let domRect, x, y, textNode, parentRect;

        if (index !== undefined && index !== null) {
            clonedRange.setStart(container, index);
            clonedRange.setEnd(container, index + 1);
        }

        domRect = clonedRange.getBoundingClientRect();

        if (scrollableWrapper) {
            parentRect = scrollableWrapper.getBoundingClientRect();
            x = domRect.left - parentRect.left - domRect.width / 2;
            y = domRect.top - parentRect.top + domRect.height + scrollTop;
        } else {
            if (character === SPACE_UNICODE) {
                x = domRect.x - domRect.width / 4;
                y = domRect.y + domRect.height + scrollTop;
            } else if (character === NEW_LINE_UNICODE) {
                x = domRect.x;
                y = domRect.y + domRect.height + scrollTop;
            }
        }

        textNode = document.createElementNS("http://www.w3.org/2000/svg", "text");
        textNode.setAttributeNS(null, "x", x);
        textNode.setAttributeNS(null, "y", y);
        textNode.setAttributeNS(null, "fill", "#6098f2");
        textNode.setAttributeNS(null, "font-size", `${Math.ceil(domRect.height + domRect.width)}px`);
        textNode.textContent = character;

        return textNode;
    };

    const appendSvgMarks = function() {
        const that = this,
            range = that.getRange().cloneRange(),
            overlay = that._formattingMarksOverlay[0],
            fragment = that.document.createDocumentFragment(),
            document = that.document,
            isInlineEditor = that._isInlineEditor(),
            scrollableWrapper = isInlineEditor ? that.body.parentElement : null,
            scrollTop = isInlineEditor ? scrollableWrapper.scrollTop : document.documentElement.scrollTop;

        if (!that.body.firstChild && !that.body.lastChild) {
            return;
        }

        range.setStart(that.body.firstChild, 0);
        range.setEnd(that.body.lastChild, 0);

        const nodes = DOM.getTextNodes(that.body).concat($(that.body).find("br").toArray());

        nodes.forEach((node) => {
            if (node.nodeType === DOM.nodeTypes.TEXT_NODE) {
                range.selectNodeContents(node);

                for (let i = range.startOffset; i < range.endOffset; i++) {
                    if ((range.startContainer.textContent.charCodeAt(i) === 32 || range.startContainer.textContent.charCodeAt(i) === 160)) {
                        fragment.appendChild(createMark(range, document, SPACE_UNICODE, scrollTop, i, scrollableWrapper));
                    }
                }
            } else {
                range.selectNode(node);
                fragment.appendChild(createMark(range, document, NEW_LINE_UNICODE, scrollTop, null, scrollableWrapper));
            }
        });

        overlay.appendChild(fragment);
    };

    const clearFormattingMarksOverlay = function(editor) {
        editor._formattingMarksOverlay.empty();
    };

    const applyFormattingMarks = function(editor) {
        editor._updateFormattingMarksOverlayHeight();
        appendSvgMarks.call(editor);
    };

    const FormattingMarksCommand = Command.extend({
        exec: function() {
            const cmd = this,
                range = cmd.lockRange(true),
                editor = cmd.editor;

            if (!editor._toggledFormattingMarks) {
                editor._toggledFormattingMarks = true;
                editor._appendFormattingMarksOverlay();
                editor._appendFormattingMarksStyles();
                clearFormattingMarksOverlay(editor);
                applyFormattingMarks(editor);
            } else {
                editor._toggledFormattingMarks = false;
                editor._destroyFormattingMarksOverlay();
            }

            cmd.releaseRange(range);
        }
    });

    $.extend(Editor, {
        FormattingMarksCommand: FormattingMarksCommand,
        applyFormattingMarks: applyFormattingMarks,
        clearFormattingMarksOverlay: clearFormattingMarksOverlay
    });

    registerTool("formattingMarks", new Tool({ command: FormattingMarksCommand, icon: "paragraphMark", ui: { togglable: true } }));
})(window.kendo.jQuery);

(function(kendo, undefined$1) {
    var global = window;
    var math = global.Math;
    var min = math.min;
    var max = math.max;
    var parseFloat = global.parseFloat;

    var $ = kendo.jQuery;
    var extend = $.extend;

    var Editor = kendo.ui.editor;

    var PERCENTAGE = "%";
    var PIXEL = "px";
    var REGEX_NUMBER_IN_PERCENTAGES = /(\d+)(\.?)(\d*)%/;
    var REGEX_NUMBER_IN_PIXELS = /(\d+)(\.?)(\d*)px/;
    var STRING = "string";

    function constrain(options) {
        var value = options.value;
        var lowerBound = options.min;
        var upperBound = options.max;

        return max(min(parseFloat(value), parseFloat(upperBound)), parseFloat(lowerBound));
    }

    function getScrollBarWidth(element) {
        if (element && !$(element).is("body") && element.scrollHeight > element.clientHeight) {
            return kendo.support.scrollbar();
        }

        return 0;
    }

    function calculatePercentageRatio(value, total) {
        if (inPercentages(value)) {
            return parseFloat(value);
        }
        else {
            return ((parseFloat(value) / total) * 100);
        }
    }

    function inPercentages(value) {
        return (typeof(value) === STRING && REGEX_NUMBER_IN_PERCENTAGES.test(value));
    }

    function inPixels(value) {
        return (typeof(value) === STRING && REGEX_NUMBER_IN_PIXELS.test(value));
    }

    function toPercentages(value) {
        return (parseFloat(value) + PERCENTAGE);
    }

    function toPixels(value) {
        return (parseFloat(value) + PIXEL);
    }

    var ResizingUtils = {
        constrain: constrain,
        getScrollBarWidth: getScrollBarWidth,
        calculatePercentageRatio: calculatePercentageRatio,
        inPercentages: inPercentages,
        inPixels: inPixels,
        toPercentages: toPercentages,
        toPixels: toPixels
    };

    extend(Editor, {
        ResizingUtils: ResizingUtils
    });
})(window.kendo);

(function(kendo, undefined$1) {
    var $ = kendo.jQuery;
    var extend = $.extend;
    var noop = $.noop;

    var Editor = kendo.ui.editor;
    var Class = kendo.Class;

    var KEY_DOWN = "keydown";
    var MOUSE_DOWN = "mousedown";
    var MOUSE_ENTER = "mouseenter";
    var MOUSE_LEAVE = "mouseleave";
    var MOUSE_MOVE = "mousemove";
    var MOUSE_UP = "mouseup";

    var COMMA = ",";
    var DOT = ".";
    var LAST_CHILD = ":last-child";

    var TABLE = "table";

    var TableElementResizing = Class.extend({
        init: function(element, options) {
            var that = this;

            that.options = extend({}, that.options, options);

            that.options.tags = Array.isArray(that.options.tags) ? that.options.tags : [that.options.tags];

            if ($(element).is(TABLE)) {
                that.element = element;
                that._attachEventHandlers();
            }
        },

        destroy: function() {
            var that = this;
            var eventNamespace = that.options.eventNamespace;

            if (that.element) {
                $(that.element).off(eventNamespace);
                that.element = null;
            }

            $(that.options.rootElement).off(KEY_DOWN + eventNamespace);

            that._destroyResizeHandle();
        },

        options: {
            tags: [],
            min: 0,
            rootElement: null,
            eventNamespace: "",
            rtl: false,
            handle: {
                dataAttribute: "",
                height: 0,
                width: 0,
                classNames: {},
                template: ""
            }
        },

        _attachEventHandlers: function() {
            var that = this;
            var options = that.options;

            $(that.element).on(MOUSE_MOVE + options.eventNamespace, options.tags.join(COMMA), that.detectElementBorderHovering.bind(that));
        },

        resizingInProgress: function() {
            var that = this;
            var resizable = that._resizable;

            if (resizable) {
                return !!resizable.resizing;
            }

            return false;
        },

        resize: noop,

        detectElementBorderHovering: function(e) {
            var that = this;
            var options = that.options;
            var handleOptions = options.handle;
            var tableElement = $(e.currentTarget);
            var resizeHandle = that.resizeHandle;
            var dataAttribute = handleOptions.dataAttribute;

            if (!that.resizingInProgress()) {
                if (!tableElement.is(LAST_CHILD) && that.elementBorderHovered(tableElement, e)) {
                    if (resizeHandle) {
                        if (resizeHandle.data(dataAttribute) && resizeHandle.data(dataAttribute) !== tableElement[0]) {
                            that.showResizeHandle(tableElement, e);
                        }
                    }
                    else {
                        that.showResizeHandle(tableElement, e);
                    }
                }
                else {
                    if (resizeHandle) {
                        that._destroyResizeHandle();
                    }
                }
            }
        },

        elementBorderHovered: noop,

        showResizeHandle: function(tableElement, e) {
            var that = this;

            if (e.buttons !== 0) {
                //prevent showing when a mouse button is still being pressed
                return;
            }

            that._initResizeHandle();
            that.setResizeHandlePosition(tableElement);
            that.setResizeHandleDimensions();
            that.setResizeHandleDataAttributes(tableElement[0]);
            that._attachResizeHandleEventHandlers();

            that._initResizable(tableElement);

            that._hideResizeMarker();
            that.resizeHandle.show();
        },

        _initResizeHandle: function() {
            var that = this;
            var options = that.options;

            that._destroyResizeHandle();

            that.resizeHandle = $(options.handle.template).appendTo(options.rootElement);
        },

        setResizeHandlePosition: noop,

        setResizeHandleDimensions: noop,

        setResizeHandleDataAttributes: function(tableElement) {
            var that = this;

            that.resizeHandle.data(that.options.handle.dataAttribute, tableElement);
        },

        _attachResizeHandleEventHandlers: function() {
            var that = this;
            var options = that.options;
            var eventNamespace = options.eventNamespace;
            var markerClass = options.handle.classNames.marker;
            var resizeHandle = that.resizeHandle;

            that.resizeHandle
                .on(MOUSE_DOWN + eventNamespace, function() {
                    resizeHandle.find(DOT + markerClass).show();
                })
                .on(MOUSE_UP + eventNamespace, function() {
                    resizeHandle.find(DOT + markerClass).hide();
                });
        },

        _hideResizeMarker: function() {
            var that = this;

            that.resizeHandle.find(DOT + that.options.handle.classNames.marker).hide();
        },

        _destroyResizeHandle: function() {
            var that = this;

            if (that.resizeHandle) {
                that._destroyResizable();
                that.resizeHandle.off(that.options.eventNamespace).remove();
                that.resizeHandle = null;
            }
        },

        _initResizable: function(tableElement) {
            var that = this;

            if (!that.resizeHandle) {
                return;
            }

            that._destroyResizable();

            that._resizable = new kendo.ui.Resizable(tableElement, {
                draggableElement: that.resizeHandle[0],
                start: that.onResizeStart.bind(that),
                resize: that.onResize.bind(that),
                resizeend: that.onResizeEnd.bind(that)
            });
        },

        _destroyResizable: function() {
            var that = this;

            if (that._resizable) {
                that._resizable.destroy();
                that._resizable = null;
            }
        },

        onResizeStart: function() {
            this._disableKeyboard();
        },

        onResize: function(e) {
            this.setResizeHandleDragPosition(e);
        },

        setResizeHandleDragPosition: noop,

        onResizeEnd: function(e) {
            var that = this;

            that.resize(e);
            that._destroyResizeHandle();
            that._enableKeyboard();

            if (this.options.editor) {
                this.options.editor._handleSpaceAndNewLines();
            }
        },

        _enableKeyboard: function() {
            var options = this.options;

            $(options.rootElement).off(KEY_DOWN + options.eventNamespace);
        },

        _disableKeyboard: function() {
            var options = this.options;

            $(options.rootElement).on(KEY_DOWN + options.eventNamespace, function(e) {
                e.preventDefault();
            });
        },

        _forceResizing: function(e) {
            var resizable = this._resizable;

            if (resizable && resizable.userEvents) {
                resizable.userEvents._end(e);
            }
        }
    });

    var ResizingFactory = Class.extend({
        create: function(editor, options) {
            var that = this;
            var resizingName = options.name;
            var NS = options.eventNamespace;

            $(editor.body)
                .on(MOUSE_ENTER + NS, TABLE, function(e) {
                    var table = e.currentTarget;
                    var resizing = editor[resizingName];

                    e.stopPropagation();

                    if (resizing) {
                        if (resizing.element !== table && !resizing.resizingInProgress()) {
                            that._destroyResizing(editor, options);
                            that._initResizing(editor, table, options);
                        }
                    }
                    else {
                        that._initResizing(editor, table, options);
                    }
                })
                .on(MOUSE_LEAVE + NS, TABLE, function(e) {
                    var parentTable;
                    var resizing = editor[resizingName];

                    e.stopPropagation();

                    if (resizing && !resizing.resizingInProgress() && !resizing.resizeHandle) {
                        parentTable = $(resizing.element).parents(TABLE)[0];

                        if (parentTable) {
                            that._destroyResizing(editor, options);
                            that._initResizing(editor, parentTable, options);
                        }
                    }
                })
                .on(MOUSE_LEAVE + NS, function() {
                    var resizing = editor[resizingName];

                    if (resizing && !resizing.resizingInProgress()) {
                        that._destroyResizing(editor, options);
                    }
                })
                .on(MOUSE_UP + NS, function(e) {
                    var resizing = editor[resizingName];
                    var parentTable;

                    if (resizing && resizing.resizingInProgress()) {
                        parentTable = $(e.target).parents(TABLE)[0];

                        if (parentTable) {
                            resizing._forceResizing(e);
                            that._destroyResizing(editor, options);
                            that._initResizing(editor, parentTable, options);
                        }
                    }
                });
        },

        dispose: function(editor, options) {
            $(editor.body).off(options.eventNamespace);
        },

        _initResizing: function(editor, tableElement, options) {
            var resizingName = options.name;
            var resizingType = options.type;

            editor[resizingName] = new resizingType(tableElement, {
                rtl: kendo.support.isRtl(editor.element),
                rootElement: editor.body,
                editor: editor
            });
        },

        _destroyResizing: function(editor, options) {
            var resizingName = options.name;

            if (editor[resizingName]) {
                editor[resizingName].destroy();
                editor[resizingName] = null;
            }
        }
    });
    ResizingFactory.current = new ResizingFactory();

    TableElementResizing.create = function(editor, options) {
        ResizingFactory.current.create(editor, options);
    };

    TableElementResizing.dispose = function(editor, options) {
        ResizingFactory.current.dispose(editor, options);
    };

    extend(Editor, {
        TableElementResizing: TableElementResizing
    });

})(window.kendo);

(function(kendo, undefined$1) {
    var global = window;
    var math = global.Math;
    var abs = math.abs;

    var $ = kendo.jQuery;
    var extend = $.extend;

    var Editor = kendo.ui.editor;
    var dom = Editor.Dom;
    var TableElementResizing = Editor.TableElementResizing;
    var ResizingUtils = Editor.ResizingUtils;
    var constrain = ResizingUtils.constrain;
    var calculatePercentageRatio = ResizingUtils.calculatePercentageRatio;
    var getScrollBarWidth = ResizingUtils.getScrollBarWidth;
    var inPercentages = ResizingUtils.inPercentages;
    var toPercentages = ResizingUtils.toPercentages;
    var toPixels = ResizingUtils.toPixels;
    var outerWidth = kendo._outerWidth;

    var NS = ".kendoEditorColumnResizing";
    var RESIZE_HANDLE_CLASS = "k-column-resize-handle";
    var RESIZE_MARKER_CLASS = "k-column-resize-marker";

    var BODY = "body";
    var TBODY = "tbody";
    var THEAD = "thead";
    var TD = "td";
    var TH = "th";
    var TR = "tr";

    var COLATTR = "col-index";

    var COMMA = ",";
    var WIDTH = "width";

    var ColumnResizing = TableElementResizing.extend({
        options: {
            tags: [TD, TH],
            min: 20,
            rootElement: null,
            eventNamespace: NS,
            rtl: false,
            handle: {
                dataAttribute: "column",
                width: 10,
                height: 0,
                classNames: {
                    handle: RESIZE_HANDLE_CLASS,
                    marker: RESIZE_MARKER_CLASS
                },
                template:
                    '<div class="k-column-resize-handle-wrapper" unselectable="on" contenteditable="false">' +
                        '<div class="' + RESIZE_HANDLE_CLASS + '">' +
                            '<div class="' + RESIZE_MARKER_CLASS + '"></div>' +
                        '</div>' +
                    '</div>'
            }
        },

        elementBorderHovered: function(column, e) {
            var that = this;
            var options = that.options;
            var handleWidth = options.handle.width;
            var borderOffset = column.offset().left + (options.rtl ? 0 : outerWidth(column));


            var mousePosition = e.clientX + $(column[0].ownerDocument).scrollLeft();

            if ((mousePosition > (borderOffset - handleWidth)) && (mousePosition < (borderOffset + handleWidth))) {
                return true;
            }
            else {
                return false;
            }
        },

        setResizeHandlePosition: function(column) {
            var that = this;
            var tableInnerElement = $(that.element.tHead || that.element.tBodies[0]);
            var options = that.options;
            var rtl = options.rtl;
            var handleWidth = options.handle.width;
            var rootElement = $(options.rootElement);
            var scrollTopOffset = rootElement.is(BODY) ? 0 : rootElement.scrollTop();
            var scrollLeftOffset = rootElement.is(BODY) ? 0 : kendo.scrollLeft(rootElement);
            var columnWidthOffset = rtl ? 0 : outerWidth(column);
            var scrollBarWidth = rtl ? getScrollBarWidth(rootElement[0]) : 0;
            var columnOffsetLeft = column.offset().left -
                                    (rootElement.offset().left + parseFloat(rootElement.css("borderLeftWidth"))) -
                                    parseFloat(column.css("marginLeft"));
            var innerElementOffsetTop = tableInnerElement.offset().top -
                                    (rootElement.offset().top + parseFloat(rootElement.css("borderTopWidth"))) -
                                    parseFloat(tableInnerElement.css("marginTop"));
            var browser = kendo.support.browser;

            if (rtl && (browser.mozilla || (browser.webkit && browser.version >= 85))) {
                scrollLeftOffset = scrollLeftOffset * -1;
            }

            that.resizeHandle.css({
                top: innerElementOffsetTop + scrollTopOffset,
                left: columnOffsetLeft + columnWidthOffset + (scrollLeftOffset - scrollBarWidth) - (handleWidth / 2),
                position: "absolute"
            });
        },

        setResizeHandleDimensions: function() {
            var that = this;
            var tableHead = $(that.element).children(THEAD);
            var tableBody = $(that.element).children(TBODY);
            var fullHeight = tableHead.length > 0 ? tableHead.height() + tableBody.height() : tableBody.height();

            that.resizeHandle.css({
                width: that.options.handle.width,
                height: fullHeight
            });
        },

        setResizeHandleDragPosition: function(e) {
            var that = this;
            var column = $($(e.currentTarget).data(that.options.handle.dataAttribute));
            var options = that.options;
            var rootElement = $(options.rootElement);
            var handleWidth = options.handle ? options.handle.width : 0;
            var min = options.min;
            var rtl = options.rtl;
            var columnWidth = outerWidth(column);
            var columnLeftOffset = column.offset().left -
                                    (rootElement.offset().left + parseFloat(rootElement.css("borderLeftWidth"))) -
                                    parseFloat(column.css("marginLeft"));
            var adjacentColumnWidth = outerWidth(column.next());
            var resizeHandle = $(that.resizeHandle);
            var scrollLeftOffset = rootElement.is(BODY) ? 0 : kendo.scrollLeft(rootElement);
            var scrollBarWidth = rtl ? getScrollBarWidth(rootElement[0]) : 0;
            var resizeHandleOffsetLeft = resizeHandle.offset().left -
                                            (rootElement.offset().left + parseFloat(rootElement.css("borderLeftWidth"))) -
                                            parseFloat(resizeHandle.css("marginLeft"));
            var browser = kendo.support.browser;

            if (rtl && (browser.mozilla || (browser.webkit && browser.version >= 85))) {
                scrollLeftOffset = scrollLeftOffset * -1;
            }

            var handleOffset = constrain({
                value: resizeHandleOffsetLeft + (scrollLeftOffset - scrollBarWidth) + e.x.delta,
                min: columnLeftOffset + (scrollLeftOffset - scrollBarWidth) - (rtl ? adjacentColumnWidth : 0) + min,
                max: columnLeftOffset + columnWidth + (scrollLeftOffset - scrollBarWidth) + (rtl ? 0 : adjacentColumnWidth) - handleWidth - min
            });

            resizeHandle.css({ left: handleOffset });
        },

        resize: function(e) {
            var that = this;
            var column = $($(e.currentTarget).data(that.options.handle.dataAttribute));
            var options = that.options;
            var rtlModifier = options.rtl ? (-1) : 1;
            var min = options.min;
            var initialDeltaX = rtlModifier * e.x.initialDelta;
            var newWidth;
            var initialAdjacentColumnWidth;
            var initialColumnWidth;
            var colIndex;
            var nextColumn;

            dom.reMapTableColumns(that.element, COLATTR);

            colIndex = parseInt(column.attr(COLATTR), 10);

            if (column.prop("colSpan") > 1) {
                column = $(that.element).find("[" + COLATTR + "=" + (colIndex + column.prop("colSpan") - 1) + "]").eq(0);
                colIndex = parseInt(column.attr(COLATTR), 10);
            }

            nextColumn = $(that.element).find("[" + COLATTR + "=" + (colIndex + 1) + "]:not([colspan])");

            that._setTableComputedWidth();
            that._setColumnsComputedWidth();

            initialColumnWidth = outerWidth(column);
            initialAdjacentColumnWidth = outerWidth(nextColumn);

            newWidth = constrain({
                value: initialColumnWidth + initialDeltaX,
                min: min,
                max: initialColumnWidth + initialAdjacentColumnWidth - min
            });

            that._resizeColumn(column[0], newWidth);
            that._resizeTopAndBottomColumns(column[0], newWidth);
            that._resizeAdjacentColumns(parseInt(column.attr(COLATTR),10), initialAdjacentColumnWidth, initialColumnWidth, (initialColumnWidth - newWidth));

            dom.clearTableMappings(that.element, COLATTR);
        },

        _setTableComputedWidth: function() {
            var element = this.element;

            if (element.style[WIDTH] === "") {
                element.style[WIDTH] = toPixels(outerWidth($(element)));
            }
        },

        _setColumnsComputedWidth: function() {
            var that = this;
            var tableInnerElement = $(that.element.tHead || that.element.tBodies[0]);
            var innerElementWidth = outerWidth(tableInnerElement);
            var columns = tableInnerElement.children(TR).children(TD);
            var length = columns.length;
            var currentColumnsWidths = columns.map(function() {
                return outerWidth($(this));
            });
            var i;

            for (i = 0; i < length; i++) {
                if (inPercentages(columns[i].style[WIDTH])) {
                    columns[i].style[WIDTH] = toPercentages(calculatePercentageRatio(currentColumnsWidths[i], innerElementWidth));
                }
                else {
                    columns[i].style[WIDTH] = toPixels(currentColumnsWidths[i]);
                }
            }
        },

        _resizeTopAndBottomColumns: function(column, newWidth) {
            var that = this;
            var columnIndex = $(column).attr(COLATTR);
            var topAndBottomColumns = $(that.element).children(TBODY + COMMA + THEAD).children(TR).children(that.options.tags.join(COMMA))
                .filter(function() {
                    var cell = this;
                    return ($(cell).attr(COLATTR) === columnIndex && cell !== column);
                });
            var length = topAndBottomColumns.length;
            var i;

            for (i = 0; i < length; i++) {
                that._resizeColumn(topAndBottomColumns[i], newWidth);
            }
        },

        _resizeColumn: function(column, newWidth) {
            var innerTableElement = $(this.element.tHead || this.element.tBodies[0]);
            if (inPercentages(column.style[WIDTH])) {
                column.style[WIDTH] = toPercentages(calculatePercentageRatio(newWidth, outerWidth(innerTableElement)));
            }
            else {
                column.style[WIDTH] = toPixels(newWidth);
            }
        },

        _resizeAdjacentColumns: function(columnIndex, initialAdjacentColumnWidth, initialColumnWidth, deltaWidth) {
            var that = this;
            var adjacentColumns = $(that.element).children(TBODY + COMMA + THEAD).children(TR).children(that.options.tags.join(COMMA))
                .filter(function() {
                    return (parseInt($(this).attr(COLATTR),10) === (columnIndex + 1));
                });
            var length = adjacentColumns.length;
            var i;

            for (i = 0; i < length; i++) {
                that._resizeAdjacentColumn(adjacentColumns[i], initialAdjacentColumnWidth, initialColumnWidth, deltaWidth);
            }
        },

        _resizeAdjacentColumn: function(adjacentColumn, initialAdjacentColumnWidth, initialColumnWidth, deltaWidth) {
            var that = this;
            var min = that.options.min;
            var newWidth;

            newWidth = constrain({
                value: initialAdjacentColumnWidth + deltaWidth,
                min: min,
                max: abs(initialColumnWidth + initialAdjacentColumnWidth - min)
            });

            that._resizeColumn(adjacentColumn, newWidth);
        }
    });

    ColumnResizing.create = function(editor) {
        TableElementResizing.create(editor, {
            name: "columnResizing",
            type: ColumnResizing,
            eventNamespace: NS
        });
    };

    ColumnResizing.dispose = function(editor) {
        TableElementResizing.dispose(editor, {
            eventNamespace: NS
        });
    };

    extend(Editor, {
        ColumnResizing: ColumnResizing
    });

})(window.kendo);

(function(kendo, undefined$1) {
    var math = window.Math;
    var abs = math.abs;

    var $ = kendo.jQuery;
    var extend = $.extend;

    var Editor = kendo.ui.editor;
    var TableElementResizing = Editor.TableElementResizing;
    var ResizingUtils = Editor.ResizingUtils;
    var getScrollBarWidth = ResizingUtils.getScrollBarWidth;
    var constrain = ResizingUtils.constrain;
    var calculatePercentageRatio = ResizingUtils.calculatePercentageRatio;
    var inPercentages = ResizingUtils.inPercentages;
    var toPercentages = ResizingUtils.toPercentages;
    var toPixels = ResizingUtils.toPixels;
    var outerHeight = kendo._outerHeight;

    var NS = ".kendoEditorRowResizing";
    var RESIZE_HANDLE_CLASS = "k-row-resize-handle";
    var RESIZE_HANDLE_MARKER_WRAPPER_CLASS = "k-row-resize-marker-wrapper";
    var RESIZE_MARKER_CLASS = "k-row-resize-marker";

    var BODY = "body";
    var TR = "tr";
    var TBODY = "tbody";
    var THEAD = "thead";

    var COMMA = ",";
    var HEIGHT = "height";

    var RowResizing = TableElementResizing.extend({
        options: {
            tags: [TR],
            min: 20,
            rootElement: null,
            eventNamespace: NS,
            rtl: false,
            handle: {
                dataAttribute: "row",
                width: 0,
                height: 10,
                classNames: {
                    handle: RESIZE_HANDLE_CLASS,
                    marker: RESIZE_MARKER_CLASS
                },
                template:
                    '<div class="k-row-resize-handle-wrapper" unselectable="on" contenteditable="false">' +
                        '<div class="' + RESIZE_HANDLE_CLASS + '">' +
                            '<div class="' + RESIZE_HANDLE_MARKER_WRAPPER_CLASS + '">' +
                                '<div class="' + RESIZE_MARKER_CLASS + '"></div>' +
                            '</div>' +
                        '</div>' +
                    '</div>'
            }
        },

        elementBorderHovered: function(tableElement, e) {
            var that = this;
            var handleHeight = that.options.handle[HEIGHT];
            var borderOffset = tableElement.offset().top + outerHeight(tableElement);
            var mousePosition = e.clientY + $(tableElement[0].ownerDocument).scrollTop();

            if ((mousePosition > (borderOffset - handleHeight)) && (mousePosition < (borderOffset + handleHeight))) {
                return true;
            }
            else {
                return false;
            }
        },

        setResizeHandlePosition: function(row) {
            var that = this;
            var options = that.options;
            var handleHeight = options.handle[HEIGHT];
            var rootElement = $(options.rootElement);
            var scrollTopOffset = rootElement.is(BODY) ? 0 : rootElement.scrollTop();
            var scrollLeftOffset = rootElement.is(BODY) ? 0 : kendo.scrollLeft(rootElement);
            var scrollBarWidth = options.rtl ? getScrollBarWidth(rootElement[0]) : 0;

            var rowOffsetLeft = row.offset().left -
                                    (rootElement.offset().left + parseFloat(rootElement.css("borderLeftWidth"))) -
                                    parseFloat(row.css("marginLeft"));
            var rowOffsetTop = row.offset().top -
                                    (rootElement.offset().top + parseFloat(rootElement.css("borderTopWidth"))) -
                                    parseFloat(row.css("marginTop"));
            var browser = kendo.support.browser;

            if (options.rtl && (browser.mozilla || (browser.webkit && browser.version >= 85))) {
                scrollLeftOffset = scrollLeftOffset * -1;
            }

            that.resizeHandle.css({
                top: rowOffsetTop + outerHeight(row) + scrollTopOffset - (handleHeight / 2),
                left: rowOffsetLeft + (scrollLeftOffset - scrollBarWidth),
                position: "absolute"
            });
        },

        setResizeHandleDimensions: function() {
            var that = this;
            var innerTableElement = $(that.element.tHead || that.element.tBodies[0]);

            that.resizeHandle.css({
                width: innerTableElement.width(),
                height: that.options.handle[HEIGHT]
            });
        },

        setResizeHandleDragPosition: function(e) {
            var that = this;
            var options = that.options;
            var min = options.min;
            var tableHead = $(that.element).children(THEAD);
            var tableBody = $(that.element).children(TBODY);
            var topInnerTableElement = tableHead.length > 0 ? tableHead : tableBody;
            var resizeHandle = $(that.resizeHandle);
            var row = $(e.currentTarget).data(options.handle.dataAttribute);
            var $row = $(row);
            var rootElement = $(options.rootElement);
            var scrollTopOffset = rootElement.is(BODY) ? 0 : rootElement.scrollTop();
            var tableTopOffset = topInnerTableElement.offset().top -
                                    (rootElement.offset().top + parseFloat(rootElement.css("borderTopWidth"))) -
                                    parseFloat(topInnerTableElement.css("marginTop"));

            var rowOffsetTop = $row.offset().top -
                                (rootElement.offset().top + parseFloat(rootElement.css("borderTopWidth"))) -
                                parseFloat($row.css("marginTop"));

            var resizeHandleOffsetTop = resizeHandle.offset().top -
                                (Math.max(0 , rootElement.offset().top) + parseFloat(rootElement.css("borderTopWidth"))) -
                                parseFloat(resizeHandle.css("marginTop"));

            var handleOffset = constrain({
                value: resizeHandleOffsetTop + scrollTopOffset + e.y.delta,
                min: rowOffsetTop + scrollTopOffset + min,
                max: tableTopOffset + outerHeight(tableHead) + outerHeight(tableBody) + scrollTopOffset - options.handle[HEIGHT] - min
            });

            resizeHandle.css({ top: handleOffset });
        },

        resize: function(e) {
            var that = this;
            var options = that.options;
            var row = $(e.currentTarget).data(options.handle.dataAttribute);
            var currentRowHeight = outerHeight($(row));
            var element = $(that.element);
            var initialTableHeight = outerHeight(element);
            var tableHead = element.children(THEAD);
            var tableHeadHeight = tableHead.length > 0 ? tableHead.height() : 0;
            var tableBody = element.children(TBODY);
            var tableBodyHeight = tableBody.height();
            var initialStyleHeight = row.style[HEIGHT];
            var newRowHeight = constrain({
                value: currentRowHeight + e.y.initialDelta,
                min: options.min,
                max: abs(tableHeadHeight + tableBodyHeight - options.min)
            });

            that._setRowsHeightInPixels();
            row.style[HEIGHT] = toPixels(newRowHeight);
            that._setTableHeight(initialTableHeight + (newRowHeight - currentRowHeight));

            if (inPercentages(initialStyleHeight)) {
                //resize rows in percentages as late as possible to prevent incorrect precision calculations
                that._setRowsHeightInPercentages();
            }
        },

        _setRowsHeightInPixels: function() {
            var that = this;
            var rows = $(that.element).children(TBODY + COMMA + THEAD).children(TR);
            var length = rows.length;
            var currentRowsHeights = rows.map(function() {
                return outerHeight($(this));
            });
            var i;

            for (i = 0; i < length; i++) {
                rows[i].style[HEIGHT] = toPixels(currentRowsHeights[i]);
            }
        },

        _setRowsHeightInPercentages: function() {
            var that = this;
            var tableHead = $(that.element).children(THEAD);
            var tableHeadHeight = tableHead.length > 0 ? tableHead.height() : 0;
            var tableBody = $(that.element).children(TBODY);
            var tableBodyHeight = tableBody.height();
            var rows = $(that.element).children(THEAD + COMMA + TBODY).children(TR);
            var length = rows.length;
            var currentRowsHeights = rows.map(function() {
                return outerHeight($(this));
            });
            var i;

            for (i = 0; i < length; i++) {
                rows[i].style[HEIGHT] = toPercentages(calculatePercentageRatio(currentRowsHeights[i], tableHeadHeight + tableBodyHeight));
            }
        },

        _setTableHeight: function(newHeight) {
            var element = this.element;

            if (inPercentages(element.style[HEIGHT])) {
                element.style[HEIGHT] = toPercentages(calculatePercentageRatio(newHeight, $(element).parent().height()));
            }
            else {
                element.style[HEIGHT] = toPixels(newHeight);
            }
        }
    });

    RowResizing.create = function(editor) {
        TableElementResizing.create(editor, {
            name: "rowResizing",
            type: RowResizing,
            eventNamespace: NS
        });
    };

    RowResizing.dispose = function(editor) {
        TableElementResizing.dispose(editor, {
            eventNamespace: NS
        });
    };

    extend(Editor, {
        RowResizing: RowResizing
    });

})(window.kendo);

(function(kendo, undefined$1) {
    var $ = kendo.jQuery;
    var extend = $.extend;
    var noop = $.noop;

    var Editor = kendo.ui.editor;
    var Class = kendo.Class;
    var Draggable = kendo.ui.Draggable;
    var Observable = kendo.Observable;
    var getScrollBarWidth = Editor.ResizingUtils.getScrollBarWidth;
    var outerWidth = kendo._outerWidth;
    var outerHeight = kendo._outerHeight;

    var NS = ".kendoEditorElementResizeHandle";
    var RESIZE_HANDLE_CLASS = "k-element-resize-handle";

    var DRAG_START = "dragStart";
    var DRAG = "drag";
    var DRAG_END = "dragEnd";
    var HALF_INSIDE = "halfInside";
    var MOUSE_OVER = "mouseover";
    var MOUSE_OUT = "mouseout";

    var BODY = "body";
    var TABLE = "table";

    var EAST = "east";
    var NORTH = "north";
    var NORTHEAST = "northeast";
    var NORTHWEST = "northwest";
    var SOUTH = "south";
    var SOUTHEAST = "southeast";
    var SOUTHWEST = "southwest";
    var WEST = "west";

    var DOT = ".";

    var ElementResizeHandle = Observable.extend({
        init: function(options) {
            var that = this;

            Observable.fn.init.call(that);

            that.options = extend({}, that.options, options);
            that.element = $(that.options.template).appendTo(that.options.appendTo)[0];

            that._attachEventHandlers();
            that._addStyles();
            that._initDraggable();
            that._initPositioningStrategy();
            that._initDraggingStrategy();

            $(that.element).data(TABLE, that.options.resizableElement);
        },

        destroy: function() {
            var that = this;

            $(that.element).off(NS).remove();
            that.element = null;

            that._destroyDraggable();

            that.unbind();
        },

        options: {
            appendTo: null,
            direction: SOUTHEAST,
            resizableElement: null,
            rtl: false,
            template:
                "<div class='k-element-resize-handle-wrapper' unselectable='on' contenteditable='false'>" +
                    "<div class='" + RESIZE_HANDLE_CLASS + "'></div>" +
                "</div>"
        },

        events: [
            DRAG_START,
            DRAG,
            DRAG_END,
            MOUSE_OVER,
            MOUSE_OUT
        ],

        show: function() {
            this._setPosition();
        },

        _setPosition: function() {
            var that = this;
            var position = that._positioningStrategy.getPosition();

            $(that.element).css({
                top: position.top,
                left: position.left,
                position: "absolute"
            });
        },

        _attachEventHandlers: function() {
            var that = this;

            $(that.element)
                .on(MOUSE_OVER + NS, that._onMouseOver.bind(that))
                .on(MOUSE_OUT + NS, that._onMouseOut.bind(that));
        },

        _onMouseOver: function() {
            this.trigger(MOUSE_OVER);
        },

        _onMouseOut: function() {
            this.trigger(MOUSE_OUT);
        },

        _addStyles: function() {
            var that = this;
            $(that.element).children(DOT + RESIZE_HANDLE_CLASS).addClass("k-resize-" + that.options.direction);
        },

        _initPositioningStrategy: function() {
            var that = this;
            var options = that.options;

            that._positioningStrategy = HandlePositioningStrategy.create({
                name: options.direction,
                handle: that.element,
                resizableElement: options.resizableElement,
                rootElement: options.rootElement,
                rtl: options.rtl
            });
        },

        _initDraggable: function() {
            var that = this;
            var element = that.element;

            if (that._draggable || !element) {
                return;
            }

            that._draggable = new Draggable(element, {
                dragstart: that._onDragStart.bind(that),
                drag: that._onDrag.bind(that),
                dragend: that._onDragEnd.bind(that)
            });
        },

        _onDragStart: function() {
            this.trigger(DRAG_START);
        },

        _onDrag: function(e) {
            var that = this;

            that.trigger(DRAG, that._draggingStrategy.adjustDragDelta({
                deltaX: e.x.delta,
                deltaY: e.y.delta,
                initialDeltaX: e.x.initialDelta,
                initialDeltaY: e.y.initialDelta
            }));

            if (that.options.editor) {
                that.options.editor._handleSpaceAndNewLines();
            }
        },

        _onDragEnd: function() {
            this.trigger(DRAG_END);
        },

        _destroyDraggable: function() {
            var that = this;

            if (that._draggable) {
                that._draggable.destroy();
                that._draggable = null;
            }
        },

        _initDraggingStrategy: function() {
            var that = this;

            that._draggingStrategy = HandleDraggingStrategy.create({
                name: that.options.direction
            });
        }
    });

    var StrategyFactory = Class.extend({
        init: function() {
            this._items = [];
        },

        register: function(name, type) {
            this._items.push({
                name: name,
                type: type
            });
        },

        create: function(options) {
            var items = this._items;
            var itemsLength = items.length;
            var name = options.name ? options.name.toLowerCase() : "";
            var match;
            var item;
            var i;

            for (i = 0; i < itemsLength; i++) {
                item = items[i];

                if (item.name.toLowerCase() === name) {
                    match = item;
                    break;
                }
            }

            if (match) {
                return new match.type(options);
            }
        }
    });

    var PositioningStrategyFactory = StrategyFactory.extend({});
    PositioningStrategyFactory.current = new PositioningStrategyFactory();

    var HandlePositioningStrategy = Class.extend({
        init: function(options) {
            var that = this;
            that.options = extend({}, that.options, options);
        },

        options: {
            handle: null,
            offset: HALF_INSIDE,
            resizableElement: null,
            rootElement: null,
            rtl: false
        },

        getPosition: function() {
            var that = this;

            var position = that.calculatePosition();
            var handleOffsetPosition = that.applyHandleOffset(position);
            var scrollOffsetPosition = that.applyScrollOffset(handleOffsetPosition);

            return scrollOffsetPosition;
        },

        calculatePosition: noop,

        applyHandleOffset: function(position) {
            var options = this.options;
            var handle = $(options.handle);

            if (options.offset === HALF_INSIDE) {
                return {
                    top: position.top - (outerHeight(handle) / 2),
                    left: position.left - (outerWidth(handle) / 2)
                };
            }

            return position;
        },

        applyScrollOffset: function(position) {
            var options = this.options;
            var rootElement = $(options.rootElement);
            var scrollBarWidth = options.rtl ? getScrollBarWidth(rootElement[0]) : 0;
            var browser = kendo.support.browser;
            var rootLeft;

            if (!rootElement.is(BODY)) {
                rootLeft = kendo.scrollLeft(rootElement) || 0;

                if (options.rtl && (browser.mozilla || (browser.webkit && browser.version >= 85))) {
                    rootLeft = rootLeft * -1;
                }

                return {
                    top: position.top + (rootElement.scrollTop() || 0),
                    left: position.left + rootLeft - scrollBarWidth
                };
            }

            return position;
        }
    });

    HandlePositioningStrategy.create = function(options) {
        return PositioningStrategyFactory.current.create(options);
    };

    var EastPositioningStrategy = HandlePositioningStrategy.extend({
        calculatePosition: function() {
            var resizableElement = $(this.options.resizableElement);
            var offset = resizableElement.position();
            var marginLeft = parseInt(resizableElement.css("marginLeft"), 10);

            return {
                top: offset.top + (outerHeight(resizableElement) / 2),
                left: offset.left + outerWidth(resizableElement) + marginLeft
            };
        }
    });
    PositioningStrategyFactory.current.register(EAST, EastPositioningStrategy);

    var NorthPositioningStrategy = HandlePositioningStrategy.extend({
        calculatePosition: function() {
            var resizableElement = $(this.options.resizableElement);
            var offset = resizableElement.position();
            var marginLeft = parseInt(resizableElement.css("marginLeft"), 10);

            return {
                top: offset.top,
                left: offset.left + (outerWidth(resizableElement) / 2) + marginLeft
            };
        }
    });
    PositioningStrategyFactory.current.register(NORTH, NorthPositioningStrategy);

    var NortheastPositioningStrategy = HandlePositioningStrategy.extend({
        calculatePosition: function() {
            var resizableElement = $(this.options.resizableElement);
            var offset = resizableElement.position();
            var marginLeft = parseInt(resizableElement.css("marginLeft"), 10);

            return {
                top: offset.top,
                left: offset.left + outerWidth(resizableElement) + marginLeft
            };
        }
    });
    PositioningStrategyFactory.current.register(NORTHEAST, NortheastPositioningStrategy);

    var NorthwestPositioningStrategy = HandlePositioningStrategy.extend({
        calculatePosition: function() {
            var resizableElement = $(this.options.resizableElement);
            var offset = resizableElement.position();
            var marginLeft = parseInt(resizableElement.css("marginLeft"), 10);

            return {
                top: offset.top,
                left: offset.left + marginLeft
            };
        }
    });
    PositioningStrategyFactory.current.register(NORTHWEST, NorthwestPositioningStrategy);

    var SouthPositioningStrategy = HandlePositioningStrategy.extend({
        calculatePosition: function() {
            var resizableElement = $(this.options.resizableElement);
            var offset = resizableElement.position();
            var marginLeft = parseInt(resizableElement.css("marginLeft"), 10);

            return {
                top: offset.top + outerHeight(resizableElement),
                left: offset.left + (outerWidth(resizableElement) / 2) + marginLeft
            };
        }
    });
    PositioningStrategyFactory.current.register(SOUTH, SouthPositioningStrategy);

    var SoutheastPositioningStrategy = HandlePositioningStrategy.extend({
        calculatePosition: function() {
            var resizableElement = $(this.options.resizableElement);
            var offset = resizableElement.position();
            var marginLeft = parseInt(resizableElement.css("marginLeft"), 10);

            return {
                top: offset.top + outerHeight(resizableElement),
                left: offset.left + outerWidth(resizableElement) + marginLeft
            };
        }
    });
    PositioningStrategyFactory.current.register(SOUTHEAST, SoutheastPositioningStrategy);

    var SouthwestPositioningStrategy = HandlePositioningStrategy.extend({
        calculatePosition: function() {
            var resizableElement = $(this.options.resizableElement);
            var offset = resizableElement.position();
            var marginLeft = parseInt(resizableElement.css("marginLeft"), 10);

            return {
                top: offset.top + outerHeight(resizableElement),
                left: offset.left + marginLeft
            };
        }
    });
    PositioningStrategyFactory.current.register(SOUTHWEST, SouthwestPositioningStrategy);

    var WestPositioningStrategy = HandlePositioningStrategy.extend({
        calculatePosition: function() {
            var resizableElement = $(this.options.resizableElement);
            var offset = resizableElement.position();
            var marginLeft = parseInt(resizableElement.css("marginLeft"), 10);

            return {
                top: offset.top + (outerHeight(resizableElement) / 2),
                left: offset.left + marginLeft
            };
        }
    });
    PositioningStrategyFactory.current.register(WEST, WestPositioningStrategy);

    var DraggingStrategyFactory = StrategyFactory.extend({});
    DraggingStrategyFactory.current = new DraggingStrategyFactory();

    var HandleDraggingStrategy = Class.extend({
        init: function(options) {
            var that = this;
            that.options = extend({}, that.options, options);
        },

        options: {
            deltaX: {
                adjustment: null,
                modifier: null
            },
            deltaY: {
                adjustment: null,
                modifier: null
            }
        },

        adjustDragDelta: function(deltas) {
            var options = this.options;
            var xAxisAdjustment = options.deltaX.adjustment * options.deltaX.modifier;
            var yAxisAdjustment = options.deltaY.adjustment * options.deltaY.modifier;

            return {
                deltaX: deltas.deltaX * xAxisAdjustment,
                deltaY: deltas.deltaY * yAxisAdjustment,
                initialDeltaX: deltas.initialDeltaX * xAxisAdjustment,
                initialDeltaY: deltas.initialDeltaY * yAxisAdjustment
            };
        }
    });

    HandleDraggingStrategy.create = function(options) {
        return DraggingStrategyFactory.current.create(options);
    };

    var HorizontalDraggingStrategy = HandleDraggingStrategy.extend({
        options: {
            deltaX: {
                adjustment: 1,
                modifier: 1
            },
            deltaY: {
                adjustment: 0,
                modifier: 0
            }
        }
    });

    var EastDraggingStrategy = HorizontalDraggingStrategy.extend({
        options: {
            deltaX: {
                modifier: 1
            }
        }
    });
    DraggingStrategyFactory.current.register(EAST, EastDraggingStrategy);

    var WestDraggingStrategy = HorizontalDraggingStrategy.extend({
        options: {
            deltaX: {
                modifier: (-1)
            }
        }
    });
    DraggingStrategyFactory.current.register(WEST, WestDraggingStrategy);

    var VerticalDraggingStrategy = HandleDraggingStrategy.extend({
        options: {
            deltaX: {
                adjustment: 0,
                modifier: 0
            },
            deltaY: {
                adjustment: 1,
                modifier: 1
            }
        }
    });

    var NorthDraggingStrategy = VerticalDraggingStrategy.extend({
        options: {
            deltaY: {
                modifier: (-1)
            }
        }
    });
    DraggingStrategyFactory.current.register(NORTH, NorthDraggingStrategy);

    var SouthDraggingStrategy = VerticalDraggingStrategy.extend({
        options: {
            deltaY: {
                modifier: 1
            }
        }
    });
    DraggingStrategyFactory.current.register(SOUTH, SouthDraggingStrategy);

    var HorizontalAndVerticalDraggingStrategy = HandleDraggingStrategy.extend({
        options: {
            deltaX: {
                adjustment: 1,
                modifier: 1
            },
            deltaY: {
                adjustment: 1,
                modifier: 1
            }
        }
    });

    var NorthEastDraggingStrategy = HorizontalAndVerticalDraggingStrategy.extend({
        options: {
            deltaX: {
                modifier: 1
            },
            deltaY: {
                modifier: (-1)
            }
        }
    });
    DraggingStrategyFactory.current.register(NORTHEAST, NorthEastDraggingStrategy);

    var NorthWestDraggingStrategy = HorizontalAndVerticalDraggingStrategy.extend({
        options: {
            deltaX: {
                modifier: (-1)
            },
            deltaY: {
                modifier: (-1)
            }
        }
    });
    DraggingStrategyFactory.current.register(NORTHWEST, NorthWestDraggingStrategy);

    var SouthEastDraggingStrategy = HorizontalAndVerticalDraggingStrategy.extend({
        options: {
            deltaX: {
                modifier: 1
            },
            deltaY: {
                modifier: 1
            }
        }
    });
    DraggingStrategyFactory.current.register(SOUTHEAST, SouthEastDraggingStrategy);

    var SouthWestDraggingStrategy = HorizontalAndVerticalDraggingStrategy.extend({
        options: {
            deltaX: {
                modifier: (-1)
            },
            deltaY: {
                modifier: 1
            }
        }
    });
    DraggingStrategyFactory.current.register(SOUTHWEST, SouthWestDraggingStrategy);

    extend(Editor, {
        ElementResizeHandle: ElementResizeHandle
    });
})(window.kendo);

(function(kendo, undefined$1) {
    var global = window;
    var math = global.Math;
    var min = math.min;
    var max = math.max;

    var $ = kendo.jQuery;
    var contains = $.contains;
    var extend = $.extend;

    var browser = kendo.support.browser;
    var Editor = kendo.ui.editor;
    var Class = kendo.Class;
    var ElementResizeHandle = Editor.ElementResizeHandle;
    var ResizingUtils = Editor.ResizingUtils;
    var calculatePercentageRatio = ResizingUtils.calculatePercentageRatio;
    var constrain = ResizingUtils.constrain;
    var inPercentages = ResizingUtils.inPercentages;
    var inPixels = ResizingUtils.inPixels;
    var toPercentages = ResizingUtils.toPercentages;
    var toPixels = ResizingUtils.toPixels;
    var outerWidth = kendo._outerWidth;
    var outerHeight = kendo._outerHeight;
    var RangeUtils = Editor.RangeUtils;

    var NS = ".kendoEditorElementResizing";
    var RESIZE_HANDLE_WRAPPER_CLASS = "k-element-resize-handle-wrapper";
    var TABLE_CLASS = "k-table";
    var ELEMENT_RESIZING_CLASS = "k-element-resizing";

    var DRAG_START = "dragStart";
    var DRAG = "drag";
    var DRAG_END = "dragEnd";
    var KEY_DOWN = "keydown";
    var MOUSE_DOWN = "mousedown";
    var SELECT = "select";
    var DROP = "drop";

    var COLUMN = "td";
    var ROW = "tr";
    var TBODY = "tbody";
    var THEAD = "thead";
    var TABLE = "table";
    var IMG = "img";
    var ELEMENT_TYPES = ["TABLE", "IMG"];

    var COMMA = ",";
    var WIDTH = "width";
    var HEIGHT = "height";

    var EAST = "east";
    var NORTH = "north";
    var NORTHEAST = "northeast";
    var NORTHWEST = "northwest";
    var SOUTH = "south";
    var SOUTHEAST = "southeast";
    var SOUTHWEST = "southwest";
    var WEST = "west";

    var DOT = ".";

    function isUndefined(value) {
        return typeof(value) === "undefined";
    }

    var ElementResizing = Class.extend({
        init: function(element, options) {
            var that = this;

            that.options = extend({}, that.options, options);
            that.handles = [];

            // Check whether the element is TABLE or IMG
            if (ELEMENT_TYPES.indexOf(element.nodeName) >= 0) {
                that.element = element;
            }
        },

        destroy: function() {
            var that = this;

            $(that.element).off(NS);
            that.element = null;

            $(that.options.rootElement).off(KEY_DOWN + NS);

            that._destroyResizeHandles();
        },

        options: {
            appendHandlesTo: null,
            rtl: false,
            rootElement: null,
            minWidth: 10,
            minHeight: 10,
            handles: [{
                direction: NORTHWEST
            }, {
                direction: NORTH
            }, {
                direction: NORTHEAST
            }, {
                direction: EAST
            }, {
                direction: SOUTHEAST
            }, {
                direction: SOUTH
            }, {
                direction: SOUTHWEST
            }, {
                direction: WEST
            }]
        },

        resize: function(args) {
            var that = this;
            var deltas = extend({}, {
                deltaX: 0,
                deltaY: 0,
                initialDeltaX: 0,
                initialDeltaY: 0
            }, args);

            that._resizeWidth(deltas.deltaX, deltas.initialDeltaX);
            that._resizeHeight(deltas.deltaY, deltas.initialDeltaY);

            that.showResizeHandles();
        },

        _resizeWidth: function() {
            return false;
        },

        _resizeHeight: function() {
            return false;
        },

        _getMaxDimensionValue: function(dimension) {
            var that = this;
            var element = $(that.element);
            var dimensionLowercase = dimension.toLowerCase();
            var rtlModifier = that.options.rtl ? (-1) : 1;
            var parent = $(that.element).parent();
            var parentElement = parent[0];
            var parentDimension = parent[dimensionLowercase]();
            var parentScrollOffset = rtlModifier * (dimension === WIDTH ? kendo.scrollLeft(parent) : parent.scrollTop());

            if (parentElement && parentElement === element.closest(COLUMN)[0]) {
                if (parentElement.style[dimensionLowercase] === "" && !inPercentages(that.element.style[dimensionLowercase])) {
                    return Infinity;
                }
                else {
                    return (parentDimension + parentScrollOffset);
                }
            }
            else {
                return (parentDimension + parentScrollOffset);
            }
        },

        showResizeHandles: function() {
            var that = this;

            that._initResizeHandles();
            that._showResizeHandles();
        },

        _initResizeHandles: function() {
            var that = this;
            var handles = that.handles;
            var options = that.options;
            var handleOptions = that.options.handles;
            var length = handleOptions.length;
            var i;

            if (handles && handles.length > 0) {
                return;
            }

            for (i = 0; i < length; i++) {
                that.handles.push(new ElementResizeHandle(extend({
                    appendTo: options.appendHandlesTo,
                    resizableElement: that.element,
                    rootElement: options.rootElement,
                    rtl: options.rtl,
                    editor: that.options.editor
                }, handleOptions[i])));
            }

            that._bindToResizeHandlesEvents();
        },

        _destroyResizeHandles: function() {
            var that = this;
            var length = that.handles ? that.handles.length : 0;

            for (var i = 0; i < length; i++) {
                that.handles[i].destroy();
            }

            that.handles = [];
        },

        _showResizeHandles: function() {
            var that = this;
            var handles = that.handles || [];
            var length = handles.length;
            var i;

            for (i = 0; i < length; i++) {
                that.handles[i].show();
            }
        },

        _bindToResizeHandlesEvents: function() {
            return false;
        },

        _onResizeHandleDragStart: function() {
            var that = this;
            var element = $(that.element);

            element.addClass(ELEMENT_RESIZING_CLASS);

            that._initialElementHeight = outerHeight(element);
            that._initialElementWidth = outerWidth(element);
            that._disableKeyboard();
        },

        _onResizeHandleDrag: function(e) {
            this.resize(e);
        },

        _onResizeHandleDragEnd: function() {
            var that = this;
            $(that.element).removeClass(ELEMENT_RESIZING_CLASS);
            that._enableKeyboard();
        },

        _enableKeyboard: function() {
            $(this.options.rootElement).off(KEY_DOWN + NS);
        },

        _disableKeyboard: function() {
            $(this.options.rootElement).on(KEY_DOWN + NS, function(e) {
                e.preventDefault();
            });
        }
    });

    var TableResizing = ElementResizing.extend({
        _bindToResizeHandlesEvents: function() {
            var that = this;
            var handles = that.handles || [];
            var length = handles.length;
            var i;
            var handle;

            for (i = 0; i < length; i++) {
                handle = handles[i];
                handle.bind(DRAG_START, that._onResizeHandleDragStart.bind(that));
                handle.bind(DRAG, that._onResizeHandleDrag.bind(that));
                handle.bind(DRAG_END, that._onResizeHandleDragEnd.bind(that));
            }
        },

        _hasRowsInPixels: function() {
            var that = this;
            var rows = $(that.element).children(THEAD + COMMA + TBODY).children(ROW);

            for (var i = 0; i < rows.length; i++) {
                if (rows[i].style.height === "" || inPixels(rows[i].style.height)) {
                    return true;
                }
            }

            return false;
        },

        _resizeWidth: function(delta, initialDelta) {
            var that = this;
            var element = $(that.element);
            var styleWidth = element[0].style[WIDTH];
            var currentWidth = outerWidth(element);
            var parentWidth = element.parent().width();
            var maxWidth = that._getMaxDimensionValue(WIDTH);
            var newWidth;
            var ratioValue;
            var ratioTotalValue;
            var constrainedWidth;

            if (delta === 0) {
                return;
            }

            if (isUndefined(that._initialElementWidth)) {
                that._initialElementWidth = currentWidth;
            }

            //use initial delta instead of delta as changing the width with a small value (e.g. 1px)
            //on each drag does not work due to browser calculation of computed styles
            constrainedWidth = constrain({
                value: that._initialElementWidth + initialDelta,
                min: that.options.minWidth,
                max: maxWidth
            });

            if (inPercentages(styleWidth)) {
                //detect resizing greater than 100%
                if (currentWidth + delta > parentWidth) {
                    ratioValue = max(constrainedWidth, parentWidth);
                    ratioTotalValue = min(constrainedWidth, parentWidth);
                }
                else {
                    ratioValue = min(constrainedWidth, parentWidth);
                    ratioTotalValue = max(constrainedWidth, parentWidth);
                }

                newWidth = toPercentages(calculatePercentageRatio(ratioValue, ratioTotalValue));
            }
            else {
                newWidth = toPixels(constrainedWidth);
            }

            that._setColumnsWidth();

            element[0].style[WIDTH] = newWidth;
        },

        _resizeHeight: function(delta, initialDelta) {
            var that = this;
            var element = $(that.element);
            var styleHeight = element[0].style[HEIGHT];
            var currentHeight = outerHeight(element);
            var parent = element.parent();
            var parentHeight = parent.height();
            var maxHeight = that._getMaxDimensionValue(HEIGHT);
            var newHeight;
            var ratioValue;
            var ratioTotalValue;
            var constrainedHeight;
            var minHeight = that.options.minHeight;
            var hasRowsInPixels = that._hasRowsInPixels();

            if (delta === 0) {
                return;
            }

            if (isUndefined(that._initialElementHeight)) {
                that._initialElementHeight = currentHeight;
            }

            //use initial delta instead of delta as changing the height with a small value (e.g. 1px)
            //on each drag does not work due to browser calculation of computed styles
            constrainedHeight = constrain({
                value: that._initialElementHeight + initialDelta,
                min: minHeight,
                max: maxHeight
            });

            if (hasRowsInPixels && delta < 0) {
                //decreasing table height when rows are sized in pixels is not possible
                that._setRowsHeightInPercentages();
            }

            if (inPercentages(styleHeight)) {
                //detect resizing greater than 100%
                if (currentHeight + delta > parentHeight) {
                    ratioValue = max(constrainedHeight, parentHeight);
                    ratioTotalValue = min(constrainedHeight, parentHeight);
                }
                else {
                    ratioValue = min(constrainedHeight, parentHeight);
                    ratioTotalValue = max(constrainedHeight, parentHeight);
                }

                newHeight = toPercentages(calculatePercentageRatio(ratioValue, ratioTotalValue));
            }
            else {
                newHeight = toPixels(constrainedHeight);
            }

            element[0].style[HEIGHT] = newHeight;

            if (hasRowsInPixels && delta < 0) {
                //restore original rows height unit
                that._setRowsHeightInPixels();
            }
        },

        _setColumnsWidth: function() {
            var that = this;
            var element = $(that.element);
            var parentElement = element.parent()[0];
            var parentColumn = element.closest(COLUMN);
            var columns = parentColumn.closest(ROW).children();
            var columnsLength = columns.length;
            var i;

            function isWidthInPercentages(element) {
                var styleWidth = element.style.width;

                if (styleWidth !== "") {
                    return inPercentages(styleWidth) ? true : false;
                }
                else {
                    return $(element).hasClass(TABLE_CLASS) ? true : false;
                }
            }

            if (isWidthInPercentages(element[0]) && parentElement === parentColumn[0] && parentElement.style[WIDTH] === "") {
                for (i = 0; i < columnsLength; i++) {
                    columns[i].style[WIDTH] = toPixels($(columns[i]).width());
                }
            }
        },

        _setRowsHeightInPercentages: function() {
            var that = this;
            var tableHead = $(that.element).children(THEAD);
            var tableHeadHeight = tableHead.length > 0 ? tableHead.height() : 0;
            var tableBody = $(that.element).children(TBODY);
            var tableBodyHeight = tableBody.height();
            var rows = $(that.element).children(THEAD + COMMA + TBODY).children(ROW);
            var length = rows.length;
            var currentRowsHeights = rows.map(function() {
                return outerHeight($(this));
            });
            var i;

            for (i = 0; i < length; i++) {
                rows[i].style[HEIGHT] = toPercentages(calculatePercentageRatio(currentRowsHeights[i], tableHeadHeight + tableBodyHeight));
            }
        },

        _setRowsHeightInPixels: function() {
            var that = this;
            var rows = $(that.element).children(THEAD + COMMA + TBODY).children(ROW);
            var length = rows.length;
            var currentRowsHeights = rows.map(function() {
                return outerHeight($(this));
            });
            var i;

            for (i = 0; i < length; i++) {
                rows[i].style[HEIGHT] = toPixels(currentRowsHeights[i]);
            }
        }
    });

    var ImageResizing = ElementResizing.extend({
        _bindToResizeHandlesEvents: function() {
            var that = this;
            var handles = that.handles || [];
            var length = handles.length;
            var i;
            var handle;

            for (i = 0; i < length; i++) {
                handle = handles[i];
                handle.bind(DRAG_START, that._onResizeHandleDragStart.bind(that));

                if (handle.options.direction === "north" || handle.options.direction === "south") {
                    handle.bind(DRAG, that._onResizeHandleDragVertical.bind(that));
                } else if (handle.options.direction === "east" || handle.options.direction === "west") {
                    handle.bind(DRAG, that._onResizeHandleDragHorizontal.bind(that));
                } else {
                    handle.bind(DRAG, that._onResizeHandleDragLocked.bind(that));
                }

                handle.bind(DRAG_END, that._onResizeHandleDragEnd.bind(that));
            }
        },

        _getDeltas: function(args) {
            return extend({}, {
                deltaX: 0,
                deltaY: 0,
                initialDeltaX: 0,
                initialDeltaY: 0
            }, args);
        },

        _onResizeHandleDragVertical: function(args) {
            var deltas = this._getDeltas(args);

            this._resizeHeight(deltas.deltaY, deltas.initialDeltaY);
            this.showResizeHandles();
        },

        _onResizeHandleDragHorizontal: function(args) {
            var deltas = this._getDeltas(args);

            this._resizeWidth(deltas.deltaX, deltas.initialDeltaX);
            this.showResizeHandles();
        },

        _onResizeHandleDragLocked: function(args) {
            var min = Math.min(Math.abs(args.initialDeltaX), Math.abs(args.initialDeltaY)),
                initialWidth = this._initialElementWidth,
                initialHeight = this._initialElementHeight,
                deltas;

            if (min === args.initialDeltaX || min === args.initialDeltaX * -1) {
                args.initialDeltaY = args.initialDeltaX * initialHeight / initialWidth;
                args.deltaY = args.deltaX;
            } else if (min === args.initialDeltaY || min === args.initialDeltaY * -1) {
                args.initialDeltaX = args.initialDeltaY * initialWidth / initialHeight;
                args.deltaX = args.deltaY;
            }

            deltas = this._getDeltas(args);

            this._resizeWidth(deltas.deltaX, deltas.initialDeltaX);
            this._resizeHeight(deltas.deltaY, deltas.initialDeltaY);

            this.showResizeHandles();
        },

        _resizeWidth: function(delta, initialDelta) {
            var that = this;
            var element = $(that.element);
            var currentWidth = outerWidth(element);
            var newWidth;
            var constrainedWidth;

            if (delta === 0) {
                return;
            }

            if (isUndefined(that._initialElementWidth)) {
                that._initialElementWidth = currentWidth;
            }

            //use initial delta instead of delta as changing the width with a small value (e.g. 1px)
            //on each drag does not work due to browser calculation of computed styles
            constrainedWidth = constrain({
                value: that._initialElementWidth + initialDelta,
                min: that.options.minWidth,
                max: that._getMaxDimensionValue(WIDTH)
            });

            newWidth = toPixels(constrainedWidth);
            element[0].style[WIDTH] = newWidth;
            element.attr(WIDTH, Math.floor(constrainedWidth));
        },

        _resizeHeight: function(delta, initialDelta) {
            var that = this;
            var element = $(that.element);
            var currentHeight = outerHeight(element);
            var newHeight;
            var constrainedHeight;

            if (delta === 0) {
                return;
            }

            if (isUndefined(that._initialElementHeight)) {
                that._initialElementHeight = currentHeight;
            }

            //use initial delta instead of delta as changing the height with a small value (e.g. 1px)
            //on each drag does not work due to browser calculation of computed styles
            constrainedHeight = constrain({
                value: that._initialElementHeight + initialDelta,
                min: that.options.minHeight,
                max: Number.MAX_SAFE_INTEGER
            });

            newHeight = toPixels(constrainedHeight);
            element[0].style[HEIGHT] = newHeight;
            element.attr(HEIGHT, Math.floor(constrainedHeight));
        }
    });

    const ElementResizingFactory = Class.extend({
        create: function(editor) {
            let factory = this;

            $(editor.body)
                .on("dragstart" + NS, function() {
                    var nodes = RangeUtils.nodes(editor.getRange()),
                        hasImg = false;

                    nodes.forEach(function(node) {
                        if (node.nodeName === "IMG") {
                            hasImg = true;
                        }
                    });

                    if (hasImg && nodes.length > 1) {
                        editor.elementResizing._destroyResizeHandles();
                    }
                })
                .on(DROP + NS, function() {
                    setTimeout(function() {
                        var image = RangeUtils.image(editor.getRange());

                        if (image) {
                            editor.elementResizing._destroyResizeHandles();
                            editor.elementResizing.element = image;
                            editor.elementResizing.showResizeHandles();
                        }
                    });
                })
                .on(MOUSE_DOWN + NS, TABLE + COMMA + IMG, function(e) {
                    var eventTarget = e.target;
                    var eventCurrentTarget = e.currentTarget;
                    var elementResizing = editor.elementResizing;
                    var element = elementResizing ? elementResizing.element : null;

                    if (elementResizing) {
                        if (element && eventCurrentTarget !== element) {
                            if (contains(eventCurrentTarget, element) && element !== eventTarget && contains(element, eventTarget)) {
                                //prevent a parent table resizing init when clicking on a nested table when the event bubbles
                                //instead of stopping event propagation
                                return;
                            }
                            else {
                                if (element !== eventTarget) {
                                    editor._destroyElementResizing();
                                    factory._initResizing(editor, eventCurrentTarget);
                                }
                            }
                        }
                    }
                    else {
                        factory._initResizing(editor, eventCurrentTarget);
                    }

                    editor._showElementResizeHandles();
                })
                .on(MOUSE_DOWN + NS, function(e) {
                    var elementResizing = editor.elementResizing;
                    var element = elementResizing ? elementResizing.element : null;
                    var target = e.target;
                    var isResizeHandleOrChild = $(target).hasClass(RESIZE_HANDLE_WRAPPER_CLASS) || $(target).parents(DOT + RESIZE_HANDLE_WRAPPER_CLASS).length > 0;

                    if (elementResizing && element !== target && !contains(element, target) && !isResizeHandleOrChild) {
                        editor._destroyElementResizing();
                    }
                });
        },

        dispose: function(editor) {
            $(editor.body).off(NS);
        },

        _initResizing: function(editor, element) {
            // table and image resizing is natively supported in IE
            // https://stackoverflow.com/questions/53831846/resizing-images-in-contenteditable-div-stopped-working-in-firefox
            // Enable custom resize handlers for FF too
            if (!browser.msie) {
                if ($(element).is(TABLE)) {
                    editor.elementResizing = editor.tableResizing = new TableResizing(element, {
                        appendHandlesTo: editor.body,
                        rtl: kendo.support.isRtl(editor.element),
                        rootElement: editor.body,
                        editor: editor
                    });
                } else if ($(element).is(IMG)) {
                    editor.elementResizing = new ImageResizing(element, {
                        appendHandlesTo: editor.body,
                        rtl: kendo.support.isRtl(editor.element),
                        rootElement: editor.body,
                        editor: editor
                    });
                }

                if (editor._showElementResizeHandlesProxy) {
                    editor.unbind(SELECT, editor._showElementResizeHandlesProxy);
                    editor.bind(SELECT, editor._showElementResizeHandlesProxy);
                }
            }
        }
    });

    ElementResizingFactory.current = new ElementResizingFactory();

    extend(Editor, {
        TableResizing: TableResizing,
        ImageResizing: ImageResizing,
        ElementResizing: ElementResizing,
        ElementResizingFactory: ElementResizingFactory
    });

})(window.kendo);

(function($, undefined$1) {

var kendo = window.kendo,
    Editor = kendo.ui.editor,
    EditorUtils = Editor.EditorUtils,
    RangeUtils = Editor.RangeUtils,
    dom = Editor.Dom,
    registerTool = EditorUtils.registerTool,
    Command = Editor.Command;

var tableFormatFinder = new Editor.BlockFormatFinder([{ tags: ["table"] }]);
var cellsFormatFinder = new Editor.BlockFormatFinder([{ tags: ["td","th"] }]);
var reUnit = /([a-z]+|%)$/i;

var COL = "col";
var ROW = "row";
var COLGROUP = "colgroup";
var SCOPE = "scope";
var COL_INDEX = "col-index";
var TH = "th";
var TD = "td";
var THEAD = "thead";
var HEADERS = "headers";
var TABLE = "table";

var TableWizardCommand = Command.extend({
    exec: function() {
        var cmd = this;
        var editor = cmd.editor;
        var range = cmd.range = cmd.lockRange();
        var isTableCellWizard = cmd.options.tableCellWizard;
        var selectedTable = cmd._sourceTable = !cmd.options.insertNewTable ? cmd._selectedTable(range) : undefined$1;
        var selectedCells = cmd._selectedTableCells = selectedTable ? cmd._selectedCells(range) : undefined$1;
        var options = {
            visible: false,
            messages: editor.options.messages,
            closeCallback: cmd.onDialogClose.bind(cmd),
            table: cmd.parseTable(selectedTable, selectedCells),
            dialogOptions: editor.options.dialogOptions,
            isRtl: kendo.support.isRtl(editor.wrapper)
        };

        var dialog = new Editor.TableWizardDialog(options);
        dialog.open(isTableCellWizard);
    },

    onDialogClose: function(data) {
        var cmd = this;
        cmd.releaseRange(cmd.range);

        if (data) { //Ok button pressed
            if (cmd.options.insertNewTable) {
                cmd.insertTable(cmd.createNewTable(data));
            } else {
                cmd.updateTable(data, cmd._sourceTable, cmd._selectedTableCells);
            }
        }
    },
    releaseRange: function(range) {
        var cmd = this;
        var doc = cmd.editor.document;
        dom.windowFromDocument(doc).focus();
        Command.fn.releaseRange.call(cmd, range);
    },
    insertTable: function(table) {
        var range = this.range;

        range.insertNode(table);
        range.collapse(true);
        this.editor.selectRange(range);

        this._ensureFocusableAfterTable(table);
    },
    _ensureFocusableAfterTable: function(table) {
        var siblingNodes = $(table).parent().contents();
        var lastSiblingIndex = siblingNodes.length - 1;
        var lastSibling = siblingNodes.get(lastSiblingIndex);

        while (lastSibling.nodeValue !== null && (lastSibling.nodeValue === " " || lastSibling.nodeValue === "")) {
            lastSiblingIndex -= 1;
            lastSibling = siblingNodes.get(lastSiblingIndex);
        }

        if (lastSibling === table) {
            dom.insertAfter(dom.createEmptyNode(this.editor.document, "p"), table);
        }
    },
    updateTable: function(data, table, selectedCells) {
        var cmd = this;
        var tableRows = $(table.rows).toArray();
        var tableProp = data.tableProperties;
        var rows = tableProp.rows;
        var tHead = table.tHead;
        var last = cmd._lastInCollection;
        var lastSelectedRow, cellProp;

        //Leave only first selected cell
        while (selectedCells.length > 1) {
            selectedCells.pop();
        }

        lastSelectedRow = selectedCells.length ? last(selectedCells).parentNode : last(tableRows);

        cmd._deleteTableRows(tableRows, tableRows.length - rows);

        if (tableRows.length < rows) {
            cmd._addRows(lastSelectedRow, rows, tableRows);
        }

        dom.reMapTableColumns(table, COL_INDEX);
        cmd._updateColumns(tableRows, tableProp.columns, selectedCells, lastSelectedRow);
        cmd._updateTableProperties(table, tableProp);

        cellProp = data.cellProperties;
        if (selectedCells[0]) {
            dom.attr(selectedCells[0], { id: (cellProp || {}).id || null });
        }
        if (cellProp) {
            (cellProp.selectAllCells ? $(tableRows).children() : $(selectedCells)).each(function(i, cell) {
                cmd._updateCellProperties(cell, cellProp, tableProp);
            });
        }

        cmd._updateCaption(table, tableProp);

        if (tHead) {
            cmd._updateHeadersWithThead(table, data);
        } else {
            cmd._updateHeadersNoThead(table, data);
        }

        cmd._updateHeaderAssociates(table, tableProp);
        dom.clearTableMappings(table, COL_INDEX);
    },
    _isHeadingRow: function(row) {
        return dom.is(row.cells[0], TH) && dom.is(row.parentNode, THEAD);
    },
    _isHeadingCell: function(cell) {
        return dom.is(cell, TH);
    },
    cellsWithHeadersAssociated: function(table) {
        var cells = $(table.rows).children();
        var headingIds = [];
        var checkHeader = function(header) {
            return headingIds.indexOf(header) > -1;
        };

        cells.each(function(c, cell) {
            if (cell.id && dom.is(cell, TH)) {
                headingIds.push(cell.id);
            }
        });

        var associatedCells = cells.filter(function(c, cell) {
            var headersAttr = cell.getAttribute(HEADERS);
            var headersArray;

            if (headersAttr && !dom.is(cell, TH)) {
                headersArray = headersAttr.split(" ");

                if (headersArray && headersArray.length > 0) {
                    return headersArray.some(checkHeader);
                }
            }

            return false;
        });

        return !!associatedCells.length;
    },
    _insertCells: function(count, row, index) {
        index = isNaN(index) ? -1 : index;
        for (var i = 0, cell; i < count; i++) {
            cell = row.insertCell(index);
            cell.innerHTML = "&nbsp;";
        }
    },
    _deleteTableRows: function(rows, count) {
        for (var i = 0, row, rowParent; i < count; i++) {
            row = rows.pop();
            rowParent = row.parentNode;
            rowParent.removeChild(row);
            if (!rowParent.rows.length) {
                dom.remove(rowParent);
            }
        }
    },
    createNewTable: function(data) {
        var cmd = this;
        var doc = cmd.editor.document;
        var tableProp = data.tableProperties;
        var table = dom.create(doc, TABLE);
        var rowIndex = 0;
        var thead;

        cmd._updateTableProperties(table, tableProp);
        cmd._updateCaption(table, tableProp);

        if (tableProp.headerRows && tableProp.headerRows > 0) {
            thead = table.createTHead();
            cmd._createTableRows(data, thead, rowIndex, true);
            rowIndex += tableProp.headerRows;
        }

        var tbody = table.createTBody();
        cmd._createTableRows(data, tbody, rowIndex, false);

        dom.reMapTableColumns(table, COL_INDEX);

        if (tableProp.cellsWithHeaders === "ids") {
            dom.associateWithIds(table);
        } else if (tableProp.cellsWithHeaders === "scope") {
            cmd._addScopes(table, tableProp.headerRows, tableProp.headerColumns);
        }

        dom.clearTableMappings(table, COL_INDEX);

        return table;
    },
    _createTableRows: function(data, container, initialIndex, headerRows) {
        var cmd = this;
        var tableProp = data.tableProperties;
        var cellProp = data.cellProperties;
        var columns = tableProp.columns;
        var rows = headerRows ? tableProp.headerRows : tableProp.rows;
        var headerColumns = tableProp.headerColumns;

        for (var r = initialIndex, row; r < rows; r++) {
            row = container.insertRow();

            for (var c = 0, cell; c < columns; c++) {
                if (headerRows || headerColumns > c) {
                    cell = document.createElement(TH);
                } else {
                    cell = document.createElement(TD);
                }

                row.appendChild(cell);
                cell.innerHTML = "&nbsp;";
                if (cellProp && r === 0 && c === 0 && cellProp.id) {
                    cell.id = cellProp.id;
                }

                cmd._updateCellProperties(cell, cellProp && (cellProp.selectAllCells || (r === 0 && c === 0)) ? cellProp : {}, tableProp);
            }
        }
    },
    _addRows: function(lastSelectedRow, rows, tableRows) {
        var cmd = this;
        var rowIndex = $(lastSelectedRow).index();
        var cellsLength = lastSelectedRow.cells.length;
        var newRowsCount = rows - tableRows.length;
        var parent = lastSelectedRow.parentNode;
        var row;

        while (newRowsCount) {
            row = parent.insertRow(rowIndex + 1);
            cmd._insertCells(cellsLength - row.cells.length, row);
            newRowsCount--;
        }
    },
    _updateColumns: function(tableRows, columns, selectedCells, lastSelectedRow) {
        var cmd = this;
        var last = cmd._lastInCollection;
        var firstRowLastCell = last(tableRows[0].cells);
        var numberOfColumns = Number(firstRowLastCell.getAttribute(COL_INDEX)) + firstRowLastCell.colSpan;

        if (numberOfColumns > columns) {
            $(tableRows).each(function(i, row) {
                var lastCurrentCell = last(row.cells);
                var rowColumns = Number(lastCurrentCell.getAttribute(COL_INDEX)) + lastCurrentCell.colSpan;

                while (rowColumns > columns) {
                    if (lastCurrentCell.colSpan && lastCurrentCell.colSpan > 1) {
                        lastCurrentCell.colSpan -= 1;
                    } else {
                        row.deleteCell(-1);
                    }

                    lastCurrentCell = last(row.cells);
                    rowColumns = Number(lastCurrentCell.getAttribute(COL_INDEX)) + lastCurrentCell.colSpan;
                }
            });
        }

        if (numberOfColumns < columns) {
            var cellIndex = $(last(selectedCells) || last(lastSelectedRow.cells)).index();
            $(tableRows).each(function(i, row) {
                var lastCurrentCell = last(row.cells);
                cmd._insertCells(columns - Number(lastCurrentCell.getAttribute(COL_INDEX)) - lastCurrentCell.colSpan, row, cellIndex + 1);
            });
        }
    },
    _updateTableProperties: function(table, data) {
        var style = this._getStylesData(data);
        dom.attr(table, {
            cellSpacing: data.cellSpacing || null,
            topCellPadding: this._getNumericValue(data.topCellPadding) ?? '',
            leftCellPadding: this._getNumericValue(data.leftCellPadding) ?? '',
            bottomCellPadding: this._getNumericValue(data.bottomCellPadding) ?? '',
            rightCellPadding: this._getNumericValue(data.rightCellPadding) ?? '',
            className: data.className || null,
            id: data.id || null,
            summary: data.summary || null,
            style: style || null
        });
        $(table).addClass("k-table");
    },
    _updateCellProperties: function(cell, data, tableData) {
        var style = this._getStylesData(data);
        style.paddingTop = this._getNumericValue(data.topCellPadding) ?? this._getNumericValue(tableData?.topCellPadding) ?? '';
        style.paddingLeft = this._getNumericValue(data.leftCellPadding) ?? this._getNumericValue(tableData?.leftCellPadding) ?? '';
        style.paddingBottom = this._getNumericValue(data.bottomCellPadding) ?? this._getNumericValue(tableData?.bottomCellPadding) ?? '';
        style.paddingRight = this._getNumericValue(data.rightCellPadding) ?? this._getNumericValue(tableData?.rightCellPadding) ?? '';
        style.margin = data.cellMargin || null;
        dom.attr(cell, {
            style: style || null,
            className: data.className || null
        });
    },
    _updateCaption: function(table, data) {
        if (table.caption && !data.captionContent) {
            table.deleteCaption();
        } else if (data.captionContent) {
            var caption = table.createCaption();
            caption.innerHTML = data.captionContent;
            var alignment = this._getAlignmentData(data.captionAlignment);
            dom.attr(caption, {
                style: {
                    textAlign: alignment.textAlign,
                    verticalAlign: alignment.verticalAlign
                }
            });
        }
    },
    _updateHeadersNoThead: function(table, data) {
        var cmd = this;
        var tableProp = data.tableProperties;
        var rows = table.rows;
        var row, cells, cell, i, j;

        for (i = 0; i < rows.length; i++) {
            row = rows[i];
            cells = row.cells;

            for (j = 0; j < cells.length; j++) {
                cell = cells[j];
                if (!cmd._isHeadingCell(cell) && (i < tableProp.headerRows || tableProp.headerColumns > cell.getAttribute(COL_INDEX))) {
                    dom.changeTag(cell, TH, false);
                } else if (cmd._isHeadingCell(cell) && i >= tableProp.headerRows && tableProp.headerColumns <= cell.getAttribute(COL_INDEX)) {
                    dom.changeTag(cell, TD, false);
                }
            }
        }
    },
    _updateHeadersWithThead: function(table, data) {
        var cmd = this;
        var tableProp = data.tableProperties;
        var thead = table.tHead;
        var rowIndex = 0;
        var tbody = table.tBodies[0];
        var row, cell, i;

        if (!tbody) {
            tbody = table.createTBody();
        }

        if (tableProp.headerRows && tableProp.headerRows > 0) {
            if (!thead) {
                thead = table.createTHead();
            }

            while (thead.rows.length < tableProp.headerRows) {
                thead.appendChild(tbody.rows[0]);
            }

            while (thead.rows.length > tableProp.headerRows) {
                tbody.appendChild(thead.rows[0]);
            }

            cmd._swapToHeaderCells(thead);
        } else if (thead) {
            while (thead.rows.length > 0) {
                tbody.appendChild(thead.rows[thead.rows.length - 1]);
            }

            table.deleteTHead();
        }

        while (tbody.rows.length > rowIndex) {
            row = tbody.rows[rowIndex];
            for (i = 0; i < row.cells.length; i++) {
                cell = row.cells[i];
                if (cmd._isHeadingCell(cell) && tableProp.headerColumns <= cell.getAttribute(COL_INDEX)) {
                    dom.changeTag(cell, TD, false);
                } else if (!cmd._isHeadingCell(cell) && tableProp.headerColumns > cell.getAttribute(COL_INDEX)) {
                    dom.changeTag(cell, TH, false);
                }
            }
            rowIndex += 1;
        }
    },
    _updateHeaderAssociates: function(table, tableProp) {
        var cmd = this;

        if (tableProp.cellsWithHeaders === "ids") {
            if (!cmd.cellsWithHeadersAssociated(table)) {
                cmd._removeScopes(table);
            }
            dom.associateWithIds(table);
        } else if (tableProp.cellsWithHeaders === "scope") {
            if (cmd.cellsWithHeadersAssociated(table)) {
                cmd._removeAssociates(table);
            }
            cmd._addScopes(table, tableProp.headerRows, tableProp.headerColumns);
        } else {
            if (cmd.cellsWithHeadersAssociated(table)) {
                cmd._removeAssociates(table);
            } else {
                cmd._removeScopes(table);
            }
        }
    },
    _addScopes: function(table, headerRows, headerCols) {
        var rows = table.rows;
        var i, j, row, cell;

        for (i = 0; i < rows.length; i++) {
            row = rows[i];

            for (j = 0; j < row.cells.length; j++) {
                cell = row.cells[j];

                if (i < headerRows) {
                    cell.setAttribute(SCOPE, COL);
                } else if (cell.getAttribute(COL_INDEX) < headerCols) {
                    cell.setAttribute(SCOPE, ROW);
                }
            }
        }
    },
    _removeScopes: function(table) {
        $(table).find(TH).removeAttr(SCOPE);
        $(table).find(COL).remove();
        $(table).find(COLGROUP).remove();
    },
    _removeAssociates: function(table) {
        $(table).find("th, td").removeAttr("id headers");
    },
    _swapToHeaderCells: function(thead) {
        var tds = $(thead).find("td");
        var swapCell = function(index, cell) {
            dom.changeTag(cell, TH, false);
        };
        tds.each(swapCell);
    },
    _getStylesData: function(data) {
        var that = this;
        var alignment = this._getAlignmentData(data.alignment);
        var whiteSpace = "wrapText" in data ? (data.wrapText ? "" : "nowrap") : null;

        return $.extend({
            width: data.width ? data.width + data.widthUnit : null,
            height: data.height ? data.height + data.heightUnit : null,
            textAlign: alignment.textAlign,
            verticalAlign: alignment.verticalAlign,
            backgroundColor: data.bgColor || "",
            borderWidth: data.borderWidth,
            borderStyle: data.borderStyle,
            borderColor: data.borderColor || "",
            borderCollapse: data.collapseBorders ? "collapse" : null,
            whiteSpace: whiteSpace
        }, that._getTablePositionData(data.position));
    },
    _getAlignmentData: function(alignment) {
        var textAlign = "";
        var verticalAlign = textAlign;

        if (alignment) {
            if (alignment.indexOf(" ") != -1) {
                var align = alignment.split(" ");
                textAlign = align[0];
                verticalAlign = align[1];
            } else {
                textAlign = alignment;
            }
        }
        return { textAlign: textAlign, verticalAlign: verticalAlign };
    },
    _getTablePositionData: function(position) {
        if (!position) {
            return {};
        }

        return { marginLeft: position != "left" ? "auto" : "", marginRight: position != "right" ? "auto" : "" };
    },
    parseTable: function(table, selectedCells) {
        if (!table) {
            return { tableProperties: {}, selectedCells: [] };
        }

        var cmd = this;
        var tStyle = table.style;
        var rows = table.rows;
        var caption = table.caption;
        var captionClone = $(caption ? caption.cloneNode(true) : undefined$1);
        captionClone.find(".k-marker").remove();

        var cssClass = table.className;
        cssClass = cssClass.replace(/^k-table\s|\sk-table$/, "");
        cssClass = cssClass.replace(/\sk-table\s/, " ");
        cssClass = cssClass.replace(/^k-table$/, "");

        var tableAlignment = cmd._getAlignment(table, true);
        var tablePosition = cmd._getTablePosition(table);
        var captionAlignment = caption ? cmd._getAlignment(caption) : undefined$1;
        var numberOfHeaderRows = dom._getNumberOfHeaderRows(table);

        var cellsWithHeaders;
        if (cmd.cellsWithHeadersAssociated(table)) {
            cellsWithHeaders = "ids";
        } else if ($(table).find("th[scope]").length > 0) {
            cellsWithHeaders = "scope";
        } else {
            cellsWithHeaders = "none";
        }

        dom.reMapTableColumns(table, COL_INDEX);
        var numberOfColumns = dom._getNumberOfColumns(table);
        var numberOfHeaderColumns = dom._getNumberOfHeaderColumns(table, numberOfHeaderRows);
        dom.clearTableMappings(table, COL_INDEX);

        var tableJson = {
            tableProperties: {
                width: tStyle.width || table.width ? parseFloat(tStyle.width || table.width) : null,
                height: tStyle.height || table.height ? parseFloat(tStyle.height || table.height) : null,
                columns: numberOfColumns,
                rows: rows.length,
                widthUnit: cmd._getUnit(tStyle.width),
                heightUnit: cmd._getUnit(tStyle.height),
                cellSpacing: table.cellSpacing,
                topCellPadding: table.topCellPadding,
                leftCellPadding: table.leftCellPadding,
                bottomCellPadding: table.bottomCellPadding,
                rightCellPadding: table.rightCellPadding,
                alignment: tableAlignment.textAlign,
                position: tablePosition,
                bgColor: tStyle.backgroundColor || table.bgColor,
                className: cssClass,
                id: table.id,
                borderWidth: tStyle.borderWidth || table.border,
                borderColor: tStyle.borderColor,
                borderStyle: tStyle.borderStyle || "",
                collapseBorders: !!tStyle.borderCollapse,
                summary: table.summary,
                captionContent: caption ? captionClone.html() : "",
                captionAlignment: caption && captionAlignment.textAlign ? captionAlignment.textAlign + " " + captionAlignment.verticalAlign : "",
                headerRows: numberOfHeaderRows,
                headerColumns: numberOfHeaderColumns,
                cellsWithHeaders: cellsWithHeaders
            },
            selectedCells: []
        };

        tableJson.rows = cmd.parseTableRows(rows, selectedCells, tableJson);

        return tableJson;
    },
    parseTableRows: function(rows, selectedCells, tableJson) {
        var cmd = this;
        var data = [], row, rowData, cells, cell, cellData;
        for (var i = 0; i < rows.length; i++) {
            row = rows[i];
            rowData = { cells: [] };
            cells = row.cells;
            data.push(rowData);
            for (var j = 0; j < cells.length; j++) {
                cell = cells[j];
                cellData = cmd.parseCell(cell);
                if ($.inArray(cell, selectedCells) != -1) {
                    tableJson.selectedCells.push(cellData);
                }
                rowData.cells.push(cellData);
            }
        }
        return data;
    },
    parseCell: function(cell) {
        var cmd = this;
        var cStyle = cell.style;
        var alignment = cmd._getAlignment(cell);
        alignment = alignment.textAlign ? alignment.textAlign + " " + alignment.verticalAlign : "";

        var data = {
            width: cStyle.width || cell.width ? parseFloat(cStyle.width || cell.width) : null,
            height: cStyle.height || cell.height ? parseFloat(cStyle.height || cell.height) : null,
            widthUnit: cmd._getUnit(cStyle.width),
            heightUnit: cmd._getUnit(cStyle.height),
            cellMargin: cStyle.margin,
            topCellPadding: cStyle.paddingTop,
            leftCellPadding: cStyle.paddingLeft,
            bottomCellPadding: cStyle.paddingBottom,
            rightCellPadding: cStyle.paddingRight,
            alignment: alignment,
            bgColor: cStyle.backgroundColor || cell.bgColor,
            className: cell.className,
            id: cell.id,
            borderWidth: cStyle.borderWidth || cell.border,
            borderColor: cStyle.borderColor,
            borderStyle: cStyle.borderStyle,
            wrapText: cStyle.whiteSpace != "nowrap"
        };

        return data;
    },
    _getTablePosition: function(element) {
        var style = element.style;
        if (style.marginLeft == "auto" && style.marginRight == "auto") {
            return "center";
        }

        if (style.marginLeft == "auto") {
            return "right";
        }

        return "left";
    },
    _getAlignment: function(element, horizontalOnly) {
        var style = element.style;
        var hAlign = style.textAlign || element.align || "";
        if (horizontalOnly) {
            return { textAlign: hAlign };
        }
        var vAlign = style.verticalAlign || element.vAlign || "";
        if (hAlign && vAlign) {
            return { textAlign: hAlign, verticalAlign: vAlign };
        }
        if (!hAlign && vAlign) {
            return { textAlign: "left", verticalAlign: vAlign };
        }
        if (hAlign && !vAlign) {
            return { textAlign: hAlign, verticalAlign: "top" };
        }
        return { textAlign: "", verticalAlign: "" };
    },
    _getUnit: function(value) {
        var unit = (value || "").match(reUnit);
        return unit ? unit[0] : "px";
    },
    _selectedTable: function(range) {
        var nodes = dom.filterBy(RangeUtils.nodes(range), dom.htmlIndentSpace, true);
        return tableFormatFinder.findSuitable(nodes)[0];
    },
    _selectedCells: function(range) {
        var nodes = dom.filterBy(RangeUtils.nodes(range), dom.htmlIndentSpace, true);
        return cellsFormatFinder.findSuitable(nodes);
    },
    _lastInCollection: function(collection) {
        return collection[collection.length - 1];
    },
    _getNumericValue: function(value) {
        return !isNaN(value) || typeof value === "string" ? value : null;
    }
});

var TableWizardTool = Editor.Tool.extend({
    command: function(options) {
        options.insertNewTable = this.options.insertNewTable;
        options.tableCellWizard = !!this.options.tableCellWizard;
        return new TableWizardCommand(options);
    }
});

var TableWizardEditTool = TableWizardTool.extend({
    update: function(ui, nodes) {
        var isFormatted = !tableFormatFinder.isFormatted(nodes),
            toolbar = ui.closest(".k-toolbar").getKendoToolBar();

        if (isFormatted === true) {
            toolbar.hide(ui);
        } else {
            toolbar.show(ui);
        }
    }
});

var TableCellWizardEditTool = TableWizardTool.extend({
    update: function(ui, nodes) {
        var isFormatted = !tableFormatFinder.isFormatted(nodes),
            toolbar = ui.closest(".k-toolbar").getKendoToolBar();

        if (isFormatted === true) {
            toolbar.hide(ui);
        } else {
            toolbar.show(ui);
        }
    }
});

kendo.ui.editor.TableWizardTool = TableWizardTool;
kendo.ui.editor.TableWizardCommand = TableWizardCommand;

registerTool("tableProperties", new TableWizardEditTool({ command: TableWizardCommand, insertNewTable: false, property: "tableProperties" }));
registerTool("tableCellProperties", new TableCellWizardEditTool({ command: TableWizardCommand, tableCellWizard: true, insertNewTable: false, property: "tableCellProperties" }));

})(window.kendo.jQuery);

(function($, undefined$1) {

const FORM_FIELD_CLASS = "k-form-field",
      INVISIBLE_CLASS = "k-visibility-invisible",
      DOT = ".";

var kendo = window.kendo,
    encode = kendo.htmlEncode,
    numericTextBoxSettings = { format: "0", min: 0 },
    units = ["px", "em"],
    borderStyles = ["solid", "dotted", "dashed", "double", "groove", "ridge", "inset", "outset", "initial", "inherit", "none", "hidden"];

var DEFAULT_NUMBER_OF_COLS_AND_ROWS = 4;

var textWrapDropDownSettings = {
    dataSource: [{
        className: "text-wrap",
        value: "wrap"
    }, {
        className: "parameter-string",
        value: "nowrap"
    }],
    dataTextField: "className",
    dataValueField: "value",
    template: ({ className, tooltip }) => kendo.ui.icon($(`<span title="${encode(tooltip)}"></span>`), { icon: encode(className) }) + encode(tooltip),
    valueTemplate: ({ className, tooltip }) => kendo.ui.icon($(`<span title="${encode(tooltip)}"></span>`), { icon: encode(className), iconClass: "k-text-wrap" }) + encode(tooltip)
};

var tablePositionDropDownSettings = {
    dataSource: [{
        className: "table-position-start",
        value: "left"
    }, {
        className: "table-position-center",
        value: "center"
    }, {
        className: "table-position-end",
        value: "right"
    }],
    dataTextField: "className",
    dataValueField: "value",
    template: ({ className, tooltip }) => kendo.ui.icon($(`<span title="${encode(tooltip)}"></span>`), { icon: encode(className) }) + encode(tooltip),
    valueTemplate: ({ className, tooltip }) => kendo.ui.icon($(`<span title="${encode(tooltip)}"></span>`), { icon: encode(className), iconClass: "k-align-group" }) + encode(tooltip)
};

var tableAlignmentDropDownSettings = {
    dataSource: [{
        className: "table-align-middle-left",
        value: "left"
    }, {
        className: "table-align-middle-center",
        value: "center"
    }, {
        className: "table-align-middle-right",
        value: "right"
    }, {
        className: "align-remove",
        value: ""
    }],
    dataTextField: "className",
    dataValueField: "value",
    template: ({ className, tooltip }) => kendo.ui.icon($(`<span title="${encode(tooltip)}"></span>`), { icon: encode(className) }) + encode(tooltip),
    valueTemplate: ({ className, tooltip }) => kendo.ui.icon($(`<span title="${encode(tooltip)}"></span>`), { icon: encode(className), iconClass: "k-align-group" }) + encode(tooltip)
};

var cellAlignmentDropDownSettings = {
    dataSource: [{
        className: "table-align-top-left",
        value: "left top"
    }, {
        className: "table-align-top-center",
        value: "center top"
    }, {
        className: "table-align-top-right",
        value: "right top"
    }, {
        className: "table-align-middle-left",
        value: "left middle"
    }, {
        className: "table-align-middle-center",
        value: "center middle"
    }, {
        className: "table-align-middle-right",
        value: "right middle"
    }, {
        className: "table-align-bottom-left",
        value: "left bottom"
    }, {
        className: "table-align-bottom-center",
        value: "center bottom"
    }, {
        className: "table-align-bottom-right",
        value: "right bottom"
    }, {
        className: "align-remove",
        value: ""
    }],
    dataTextField: "className",
    dataValueField: "value",
    template: ({ className, tooltip }) => kendo.ui.icon($(`<span title="${encode(tooltip)}"></span>`), { icon: encode(className) }) + encode(tooltip),
    valueTemplate: ({ className, tooltip }) => kendo.ui.icon($(`<span title="${encode(tooltip)}"></span>`), { icon: encode(className), iconClass: "k-align-group" }) + encode(tooltip)
};

var accessibilityAlignmentDropDownSettings = {
    dataSource: [{
        className: "table-align-top-left",
        value: "left top"
    }, {
        className: "table-align-top-center",
        value: "center top"
    }, {
        className: "table-align-top-right",
        value: "right top"
    }, {
        className: "table-align-bottom-left",
        value: "left bottom"
    }, {
        className: "table-align-bottom-center",
        value: "center bottom"
    }, {
        className: "table-align-bottom-right",
        value: "right bottom"
    }, {
        className: "align-remove",
        value: ""
    }],
    dataTextField: "className",
    dataValueField: "value",
    template: ({ className, tooltip }) => kendo.ui.icon($(`<span title="${encode(tooltip)}"></span>`), { icon: encode(className) }),
    valueTemplate: ({ className, tooltip }) => kendo.ui.icon($(`<span title="${encode(tooltip)}"></span>`), { icon: encode(className), iconClass: "k-align-group" })
};

var tablePropertiesDialogTemplate = ({ messages }) =>
    '<div class="k-editor-dialog k-editor-table-wizard-window k-action-window k-popup-edit-form">' +
        '<div id="k-table-wizard-tabs" class="k-root-tabs">' +
            '<ul>' +
                `<li class="k-active">${ messages.tableTab }</li>` +
                `<li>${ messages.accessibilityTab }</li>` +
            '</ul>' +
            '<div id="k-table-properties"></div>' +
            '<div id="k-accessibility-properties"></div>' +
        '</div>' +
        '<div class="k-actions k-actions-start k-actions-horizontal k-window-buttons">' +
                kendo.html.renderButton(`<button class="k-dialog-ok"><span class="k-button-text">${ messages.dialogOk }</span></button>`, {
                    icon: 'check',
                        themeColor: "primary"
                    }) +
                    kendo.html.renderButton(`<button class="k-dialog-close"><span class="k-button-text">${ messages.dialogCancel }</span></button>`, {
                        icon: 'cancel-outline'
                    }) +
        '</div>' +
    '</div>';
    var cellPropertiesDialogTemplate = ({ messages }) =>
    '<div class="k-editor-dialog k-editor-table-wizard-window k-action-window k-popup-edit-form">' +
        '<div id="k-cell-properties"></div>' +
        '<div class="k-actions k-actions-start k-actions-horizontal k-window-buttons">' +
                kendo.html.renderButton(`<button class="k-dialog-ok"><span class="k-button-text">${ messages.dialogOk }</span></button>`, {
                    icon: 'check',
                        themeColor: "primary"
                    }) +
                    kendo.html.renderButton(`<button class="k-dialog-close"><span class="k-button-text">${ messages.dialogCancel }</span></button>`, {
                        icon: 'cancel-outline'
                    }) +
        '</div>' +
    '</div>';

var TableWizardDialog = kendo.Class.extend({
    init: function(options) {
        this.options = options;
    },
    _openTablePropertiesDialog: function() {
        var that = this,
            options = that.options,
            dialogOptions = options.dialogOptions,
            tableData = options.table,
            dialog,
            messages = options.messages,
            isIE = kendo.support.browser.msie;

        function close(e) {
            e.preventDefault();
            that.destroy();
            dialog.destroy();
        }

        function okHandler(e) {
            that.collectTableDialogValues(tableData);

            close(e);

            if (that.change) {
                that.change();
            }

            options.closeCallback(tableData);
        }

        function closeHandler(e) {
            close(e);
            options.closeCallback();
        }

        dialogOptions.close = closeHandler;
        dialogOptions.minWidth = 700;
        dialogOptions.width = 700;
        dialogOptions.title = messages.tableProperties;
        dialogOptions.visible = options.visible;

        dialog = $(that._dialogTemplate(messages)).appendTo(document.body)
            .kendoWindow(dialogOptions)
            .addClass("k-editor-window")
            .closest(".k-window").toggleClass("k-rtl", options.isRtl).end()
            .find(".k-dialog-ok").on("click", okHandler).end()
            .find(".k-dialog-close").on("click", closeHandler).end()
            .data("kendoWindow");

        var element = dialog.element;
        this.components = {};
        that._initTabStripComponent(element);
        that._tablePropertiesForm = that._createTablePropertiesForm(dialog, messages);
        that._accessibilityPropertiesForm = that._createAccessibilityPropertiesForm(dialog, messages);

        dialog.center();
        dialog.open();

        if (isIE) {
            var dialogHeight = element.closest(".k-window").height();
            element.css("max-height", dialogHeight);
        }
    },
    _openCellPropertiesDialog: function() {
        var that = this,
            options = that.options,
            dialogOptions = options.dialogOptions,
            tableData = options.table,
            dialog,
            messages = options.messages,
            isIE = kendo.support.browser.msie;

        function close(e) {
            e.preventDefault();
            that.destroy();
            dialog.destroy();
        }

        function okHandler(e) {
            that.collectCellDialogValues(tableData);

            close(e);

            if (that.change) {
                that.change();
            }

            options.closeCallback(tableData);
        }

        function closeHandler(e) {
            close(e);
            options.closeCallback();
        }

        dialogOptions.close = closeHandler;
        dialogOptions.minWidth = 400;
        dialogOptions.title = messages.tableCellProperties;
        dialogOptions.visible = options.visible;

        dialog = $(that._dialogTemplate(messages, cellPropertiesDialogTemplate)).appendTo(document.body)
            .kendoWindow(dialogOptions)
            .addClass("k-editor-window")
            .closest(".k-window").toggleClass("k-rtl", options.isRtl).end()
            .find(".k-dialog-ok").on("click", okHandler).end()
            .find(".k-dialog-close").on("click", closeHandler).end()
            .data("kendoWindow");

        var element = dialog.element;
        that._cellPropertiesForm = that._createCellPropertiesForm(dialog, messages);

        dialog.center();
        dialog.open();

        if (isIE) {
            var dialogHeight = element.closest(".k-window").height();
            element.css("max-height", dialogHeight);
        }
    },
    open: function(isCellProperties) {
        if (!isCellProperties) {
            this._openTablePropertiesDialog();
        } else {
            this._openCellPropertiesDialog();
        }
    },

    _initTabStripComponent: function(element) {
        var components = this.components = {};
        components.tabStrip = element.find("#k-table-wizard-tabs").kendoTabStrip({
            animation: false
        }).data("kendoTabStrip");
    },

    collectTableDialogValues: function() {
        var that = this;
        var data = that.options.table;
        that._collectTableViewValues(data);
        that._collectAccessibilityViewValues(data);
    },

    collectCellDialogValues: function() {
        var that = this;
        var data = that.options.table;
        that._collectCellViewValues(data);
    },

    _collectTableViewValues: function(tableData) {
        var tableView = this.components.tableView;
        var tableProperties = tableData.tableProperties;
        var cellData = tableData.cellProperties = tableData.cellProperties || {};
        tableProperties.width = tableView.width.value();
        tableProperties.widthUnit = tableView.widthUnit.value();
        tableProperties.height = tableView.height.value();
        tableProperties.columns = tableView.columns.value();
        tableProperties.rows = tableView.rows.value();
        tableProperties.heightUnit = tableView.heightUnit.value();
        tableProperties.cellSpacing = tableView.cellSpacing.value();
        tableProperties.topCellPadding = tableView.topCellPadding.value();
        tableProperties.leftCellPadding = tableView.leftCellPadding.value();
        tableProperties.bottomCellPadding = tableView.bottomCellPadding.value();
        tableProperties.rightCellPadding = tableView.rightCellPadding.value();
        tableProperties.alignment = tableView.alignment.value();
        tableProperties.position = tableView.position.value();
        tableProperties.bgColor = tableView.bgColor.value();
        tableProperties.borderWidth = tableView.borderWidth.value();
        tableProperties.borderColor = tableView.borderColor.value();
        tableProperties.borderStyle = tableView.borderStyle.value();
        tableProperties.collapseBorders = tableView.collapseBorders.check();

        if (!cellData.width) {
            cellData.selectAllCells = true;
            cellData.width = 100 / tableData.tableProperties.columns;
            cellData.widthUnit = "%";
        }
    },

    _collectCellViewValues: function(table) {
        var cellData = table.cellProperties = table.cellProperties || {};
        var cellView = this.components.cellView;

        cellData.selectAllCells = cellView.selectAllCells.check();
        cellData.width = cellView.width.value();
        cellData.widthUnit = cellView.widthUnit.value();
        cellData.height = cellView.height.value();
        cellData.heightUnit = cellView.heightUnit.value();
        cellData.independentCellPaddings = cellView.independentCellPaddings.check();
        cellData.topCellPadding = cellView.topCellPadding.value();
        cellData.leftCellPadding = cellView.leftCellPadding.value();
        cellData.bottomCellPadding = cellView.bottomCellPadding.value();
        cellData.rightCellPadding = cellView.rightCellPadding.value();
        cellData.cellMargin = cellView.cellMargin.value();
        cellData.alignment = cellView.alignment.value();
        cellData.bgColor = cellView.bgColor.value();
        cellData.className = cellView.className.value();
        cellData.id = cellView.id.value();
        cellData.borderWidth = cellView.borderWidth.value();
        cellData.borderColor = cellView.borderColor.value();
        cellData.borderStyle = cellView.borderStyle.value();
        cellData.wrapText = cellView.wrapTextValue.value() == "wrap";

        if (!cellData.width) {
            cellData.selectAllCells = true;
            cellData.width = 100 / table.tableProperties.columns;
            cellData.widthUnit = "%";
        }
    },

   _collectAccessibilityViewValues: function(table) {
        var tableProperties = table.tableProperties;
        var accessibilityView = this.components.accessibilityView;
        tableProperties.captionContent = accessibilityView.captionContent.value();
        tableProperties.captionAlignment = accessibilityView.captionAlignment.value();
        tableProperties.summary = accessibilityView.summary.value();
        tableProperties.cellsWithHeaders = accessibilityView.cellsWithHeaders.value();
        tableProperties.className = accessibilityView.className.value();
        tableProperties.id = accessibilityView.id.value();
        tableProperties.headerRows = accessibilityView.headerRows.value();
        tableProperties.headerColumns = accessibilityView.headerColumns.value();
    },
    _addUnit: function(units, value) {
        if (value && $.inArray(value, units) == -1) {
            units.push(value);
        }
    },

    _initNumericTextbox: function(element, property, data, storage, settings) {
        var component = storage[property] = element.kendoNumericTextBox(
                settings ? $.extend({}, numericTextBoxSettings, settings) : numericTextBoxSettings
            ).data("kendoNumericTextBox");
        if (property in data) {
            component.value(parseInt(data[property], 10));
        }
    },

    _initDropDownList: function(element, property, data, storage, dataSource) {
        var component = storage[property] = element.kendoDropDownList({
            dataSource: dataSource
        }).data("kendoDropDownList");
        this._setComponentValue(component, data, property);
    },

    _initBorderStyleDropDown: function(element, property, data, storage, dataSource) {
        var component = storage[property] = element.kendoDropDownList({
            dataSource: dataSource,
            optionLabel: this.options.messages.borderNone
        }).data("kendoDropDownList");
        this._setComponentValue(component, data, property);
    },

    _initTablePositionDropDown: function(element, data) {
        var messages = this.options.messages;
        var tableView = this.components.tableView;
        var dataSource = tablePositionDropDownSettings.dataSource;
        dataSource[0].tooltip = messages.tableAlignLeft;
        dataSource[1].tooltip = messages.tableAlignCenter;
        dataSource[2].tooltip = messages.tableAlignRight;

        this._initPositionDropDown(element, tablePositionDropDownSettings, "position", data, tableView);
    },

    _initTableAlignmentDropDown: function(element, data) {
        var messages = this.options.messages;
        var tableView = this.components.tableView;
        var dataSource = tableAlignmentDropDownSettings.dataSource;
        dataSource[0].tooltip = messages.alignLeft;
        dataSource[1].tooltip = messages.alignCenter;
        dataSource[2].tooltip = messages.alignRight;
        dataSource[3].tooltip = messages.alignRemove;

        this._initAlignmentDropDown(element, tableAlignmentDropDownSettings, "alignment", data, tableView);
    },

    _initCellAlignmentDropDown: function(element, data) {
        var messages = this.options.messages;
        var cellView = this.components.cellView;
        var dataSource = cellAlignmentDropDownSettings.dataSource;
        dataSource[0].tooltip = messages.alignLeftTop;
        dataSource[1].tooltip = messages.alignCenterTop;
        dataSource[2].tooltip = messages.alignRightTop;
        dataSource[3].tooltip = messages.alignLeftMiddle;
        dataSource[4].tooltip = messages.alignCenterMiddle;
        dataSource[5].tooltip = messages.alignRightMiddle;
        dataSource[6].tooltip = messages.alignLeftBottom;
        dataSource[7].tooltip = messages.alignCenterBottom;
        dataSource[8].tooltip = messages.alignRightBottom;
        dataSource[9].tooltip = messages.alignRemove;

        this._initAlignmentDropDown(element, cellAlignmentDropDownSettings, "alignment", data, cellView);
    },

    _initAccessibilityAlignmentDropDown: function(element, data) {
        var messages = this.options.messages;
        var accessibilityView = this.components.accessibilityView;
        var dataSource = accessibilityAlignmentDropDownSettings.dataSource;
        dataSource[0].tooltip = messages.alignLeftTop;
        dataSource[1].tooltip = messages.alignCenterTop;
        dataSource[2].tooltip = messages.alignRightTop;
        dataSource[3].tooltip = messages.alignLeftBottom;
        dataSource[4].tooltip = messages.alignCenterBottom;
        dataSource[5].tooltip = messages.alignRightBottom;
        dataSource[6].tooltip = messages.alignRemove;

        this._initAlignmentDropDown(element, accessibilityAlignmentDropDownSettings, "captionAlignment", data, accessibilityView);
    },
    _initTextWrapDropDown: function(element, data) {
        var messages = this.options.messages;
        var name = "wrapTextValue";
        data.wrapTextValue = data.wrapText ? "wrap" : "nowrap";

        var cellView = this.components.cellView;
        var dataSource = textWrapDropDownSettings.dataSource;
        dataSource[0].tooltip = messages.wrapText;
        dataSource[1].tooltip = messages.fitToCell;
        var component = cellView[name] =
            element.kendoDropDownList(textWrapDropDownSettings).data("kendoDropDownList");

        component.list.addClass('k-text-wrap');
        this._setComponentValue(component, data, name);
    },
    _initPositionDropDown: function(element, settings, name, data, storage) {
        var component = storage[name] =
            element.kendoDropDownList(settings).data("kendoDropDownList");

        component.list.addClass('k-position');
        this._setComponentValue(component, data, name);
    },
    _initAlignmentDropDown: function(element, settings, name, data, storage) {
        var component = storage[name] =
            element.kendoDropDownList(settings).data("kendoDropDownList");

        component.list.addClass('k-align');
        this._setComponentValue(component, data, name);
    },
    _initAssociationDropDown: function(element, name, settings, data, storage) {
        var component = storage[name] =
            element.kendoDropDownList(settings).data("kendoDropDownList");

        this._setComponentValue(component, data, name);
    },
    _setComponentValue: function(component, data, property) {
        if (property in data) {
            component.value(data[property]);
        }
    },

    _initColorPicker: function(element, property, data, storage) {
        var component = storage[property] =
            element.kendoColorPicker({ buttons: false, clearButton: true }).data("kendoColorPicker");

        if (data[property]) {
            component.value(data[property]);
        }
    },
    _initInput: function(element, property, data, storage, settings) {
        var component = storage[property] = element.kendoTextBox(settings || {}).data("kendoTextBox");
        if (property in data) {
            component.value(data[property]);
        }
    },

    _initCheckbox: function(element, property, data, storage, settings) {
        var component = storage[property] = element.kendoCheckBox(settings || {}).data("kendoCheckBox");
        if (property in data) {
            component.check(data[property]);
        }
    },

    _initTextArea: function(element, property, data, storage, settings) {
        var component = storage[property] = element.kendoTextArea(settings || {}).data("kendoTextArea");
        if (property in data) {
            component.value(data[property]);
        }
    },

    destroy: function() {
        var that = this;
        that._destroyComponents(this.components);

        delete that.components;
    },
    _destroyComponents: function(components) {
        for (var widget in components) {
            if (components[widget].destroy) {
                components[widget].destroy();
            }
            delete components[widget];
        }
    },

    _dialogTemplate: function(messages, dialogTemplate) {
        return kendo.template(dialogTemplate || tablePropertiesDialogTemplate)({ messages: messages });
    },

    _onPaddingTopChange: function(e) {
        let viewType = this.components.tableView ? "tableView" : "cellView",
            view = this.components[viewType],
            independentCellPaddings = !view.independentCellPaddings.check(),
            topCellPaddingNumeric = view.topCellPadding,
            topCellPaddingValue = topCellPaddingNumeric.value(),
            leftCellPaddingNumeric = view.leftCellPadding,
            bottomCellPaddingNumeric = view.bottomCellPadding,
            rightCellPaddingNumeric = view.rightCellPadding;

        if (independentCellPaddings) {
            leftCellPaddingNumeric.value(topCellPaddingValue);
            bottomCellPaddingNumeric.value(topCellPaddingValue);
            rightCellPaddingNumeric.value(topCellPaddingValue);
        }

        topCellPaddingNumeric._cachedPadding = topCellPaddingValue;
    },

    _onPaddingCheckChange: function(e) {
        let viewType = this.components.tableView ? "tableView" : "cellView",
            messages = this.options.messages,
            checked = e.sender.check(),
            view = this.components[viewType],
            topCellPaddingNumeric = view.topCellPadding,
            leftCellPaddingNumeric = view.leftCellPadding,
            bottomCellPaddingNumeric = view.bottomCellPadding,
            rightCellPaddingNumeric = view.rightCellPadding,
            topCellPaddingValue = topCellPaddingNumeric.value(),
            bottomCellPaddingValue = bottomCellPaddingNumeric.value(),
            leftCellPaddingValue = leftCellPaddingNumeric.value(),
            rightCellPaddingValue = rightCellPaddingNumeric.value();

        if (!checked) {
            if (topCellPaddingValue === bottomCellPaddingValue &&
                    topCellPaddingValue === leftCellPaddingValue &&
                    topCellPaddingValue === rightCellPaddingValue) {
                leftCellPaddingNumeric.value(topCellPaddingValue);
                bottomCellPaddingNumeric.value(topCellPaddingValue);
                rightCellPaddingNumeric.value(topCellPaddingValue);
            } else {
                topCellPaddingNumeric.value(null);
            }

            leftCellPaddingNumeric.wrapper.closest(DOT + FORM_FIELD_CLASS).addClass(INVISIBLE_CLASS);
            bottomCellPaddingNumeric.wrapper.closest(DOT + FORM_FIELD_CLASS).addClass(INVISIBLE_CLASS);
            rightCellPaddingNumeric.wrapper.closest(DOT + FORM_FIELD_CLASS).addClass(INVISIBLE_CLASS);

            topCellPaddingNumeric.wrapper.closest(DOT + FORM_FIELD_CLASS).find(".k-form-label").text(messages.cellPadding);
        } else {
            if (!isNaN(topCellPaddingNumeric._cachedPadding)) {
                topCellPaddingNumeric.value(topCellPaddingNumeric._cachedPadding);
            }

            leftCellPaddingNumeric.wrapper.closest(DOT + FORM_FIELD_CLASS).removeClass(INVISIBLE_CLASS);
            bottomCellPaddingNumeric.wrapper.closest(DOT + FORM_FIELD_CLASS).removeClass(INVISIBLE_CLASS);
            rightCellPaddingNumeric.wrapper.closest(DOT + FORM_FIELD_CLASS).removeClass(INVISIBLE_CLASS);

            topCellPaddingNumeric.wrapper.closest(DOT + FORM_FIELD_CLASS).find(".k-form-label").text(messages.topPadding);
        }
    },

    _onColumnsNumberChange: function(args) {
        var that = this;
        var accessibilityView = that.components.accessibilityView;
        var headerColumnsNumeric = accessibilityView.headerColumns;
        var currentNumberOfColumnsHeaders = headerColumnsNumeric.value();
        var numberOfColumns = args.sender.value();

        if (numberOfColumns < currentNumberOfColumnsHeaders) {
            headerColumnsNumeric.value(numberOfColumns);
        }

        headerColumnsNumeric.max(numberOfColumns);
    },

    _onRowsNumberChange: function(args) {
        var that = this;
        var accessibilityView = that.components.accessibilityView;
        var headerRowsNumeric = accessibilityView.headerRows;
        var currentNumberOfRowHeaders = headerRowsNumeric.value();
        var numberOfRows = args.sender.value();

        if (numberOfRows < currentNumberOfRowHeaders) {
            headerRowsNumeric.value(numberOfRows);
        }

        headerRowsNumeric.max(numberOfRows);
    },

    _createTablePropertiesForm: function(dialog, messages) {
        var that = this;
        var table = that.options.table;
        var formElement = dialog.element.find("#k-table-properties");
        var components = that.components;
        var tableView = components.tableView = {};
        var tableProperties = table.tableProperties = table.tableProperties || {};
        var form;

        that._addUnit(units, tableProperties.widthUnit);
        that._addUnit(units, tableProperties.heightUnit);
        tableProperties.borderStyle = tableProperties.borderStyle || "";
        form = formElement.kendoForm({
            renderButtons: false,
            layout: "grid",
            grid: {
                cols: 4
            },
            items: [
                {
                    colSpan: 2,
                    field: "k-editor-table-columns",
                    label: encode(messages.columns),
                    editor: function(container, options) {
                        that._initNumericTextbox($('<input type="numeric" id="k-editor-table-columns" />').appendTo(container),
                            "columns",
                            tableProperties,
                            tableView,
                            {
                                min: 1,
                                value: DEFAULT_NUMBER_OF_COLS_AND_ROWS,
                                change: that._onColumnsNumberChange.bind(that)
                            });
                    }
                },{
                    colSpan: 2,
                    field: "k-editor-table-rows",
                    label: encode(messages.rows),
                    editor: function(container, options) {
                        that._initNumericTextbox($('<input type="numeric" id="k-editor-table-rows" />').appendTo(container),
                            "rows",
                            tableProperties,
                            tableView,
                            {
                                min: 1,
                                value: DEFAULT_NUMBER_OF_COLS_AND_ROWS,
                                change: that._onRowsNumberChange.bind(that)
                            });
                    }
                },{
                    colSpan: 1,
                    field: "k-editor-table-width",
                    label: encode(messages.width),
                    editor: function(container, options) {
                        that._initNumericTextbox($('<input id="k-editor-table-width" />').appendTo(container), "width", tableProperties, tableView, { placeholder: encode(messages.auto) });
                    }
                },{
                    colSpan: 1,
                    field: "k-editor-table-width-type",
                    label: {
                        encoded: false,
                        text: '&nbsp;'
                    },
                    editor: function(container, options) {
                        that._initDropDownList($(`<input id="k-editor-table-width-type" aria-label="${ messages.units }" />`).appendTo(container),
                            "widthUnit",
                            tableProperties,
                            tableView,
                            units);
                    }
                },{
                    colSpan: 1,
                    field: "k-editor-table-height",
                    label: encode(messages.height),
                    editor: function(container, options) {
                        that._initNumericTextbox($('<input id="k-editor-table-height" />').appendTo(container), "height", tableProperties, tableView, { placeholder: encode(messages.auto) });
                    }
                },{
                    colSpan: 1,
                    field: "k-editor-table-height-type",
                    label: {
                        encoded: false,
                        text: '&nbsp;'
                    },
                    editor: function(container, options) {
                        that._initDropDownList($(`<input id="k-editor-table-height-type" aria-label="${ messages.units }" />`).appendTo(container),
                            "heightUnit",
                            tableProperties,
                            tableView,
                            units);
                    }
                },{
                    colSpan: 2,
                    field: "k-editor-table-position",
                    label: encode(messages.position),
                    editor: function(container, options) {
                        that._initTablePositionDropDown($('<input id="k-editor-table-position" class="k-position" />').appendTo(container), tableProperties);
                    }
                },
                {
                    colSpan: 2,
                    field: "k-editor-table-alignment",
                    label: encode(messages.alignment),
                    editor: function(container, options) {
                        that._initTableAlignmentDropDown($('<input id="k-editor-table-alignment" class="k-align" />').appendTo(container), tableProperties);
                    }
                },{
                    colSpan: 2,
                    field: "k-editor-table-cell-spacing",
                    label: encode(messages.cellSpacing),
                    editor: function(container, options) {
                        that._initNumericTextbox($('<input id="k-editor-table-cell-spacing" />').appendTo(container), "cellSpacing", tableProperties, tableView, { placeholder: encode(messages.auto) });
                    }
                },{
                    type: "group",
                    label: "Cell Paddings",
                    layout: "grid",
                    colSpan: 4,
                    grid: {
                        cols: 4,
                        gutter: 20
                    },
                    items: [
                        {
                            colSpan: "full",
                            field: "k-editor-padding-all-sides",
                            label: "",
                            editor: function(container, options) {
                                that._initCheckbox($('<input id="k-editor-padding-all-sides" />').appendTo(container), "independentCellPaddings", tableProperties, tableView,
                                {
                                    checked: true,
                                    label: encode(messages.independentCellPaddings),
                                    change: that._onPaddingCheckChange.bind(that)
                                });
                            }
                        },{
                            colSpan: 1,
                            field: "k-editor-table-cell-padding-top",
                            label: encode(messages.topPadding),
                            editor: function(container, options) {
                                that._initNumericTextbox($('<input id="k-editor-table-cell-padding-top" />').appendTo(container), "topCellPadding", tableProperties, tableView,
                                {
                                    placeholder: encode(messages.auto),
                                    change: that._onPaddingTopChange.bind(that)
                                });
                            }
                        },{
                            colSpan: 1,
                            field: "k-editor-table-cell-padding-right",
                            label: encode(messages.rightPadding),
                            editor: function(container, options) {
                                that._initNumericTextbox($('<input id="k-editor-table-cell-padding-right" />').appendTo(container), "rightCellPadding", tableProperties, tableView, { placeholder: encode(messages.auto) });
                            }
                        },{
                            colSpan: 1,
                            field: "k-editor-table-cells-padding-bottom",
                            label: encode(messages.bottomPadding),
                            editor: function(container, options) {
                                that._initNumericTextbox($('<input id="k-editor-table-cell-padding-bottom" />').appendTo(container), "bottomCellPadding", tableProperties, tableView, { placeholder: encode(messages.auto) });
                            }
                        },{
                            colSpan: 1,
                            field: "k-editor-table-cell-padding-left",
                            label: encode(messages.leftPadding),
                            editor: function(container, options) {
                                that._initNumericTextbox($('<input id="k-editor-table-cell-padding-left" />').appendTo(container), "leftCellPadding", tableProperties, tableView, { placeholder: encode(messages.auto) });
                            }
                        }
                    ]
                }, {
                    type: "group",
                    label: "Borders",
                    layout: "grid",
                    colSpan: 4,
                    grid: {
                        cols: 4,
                        gutter: 10
                    },
                    items: [{
                        colSpan: "full",
                        field: "k-editor-table-bg",
                        label: encode(messages.tableBackground),
                        editor: function(container, options) {
                            that._initColorPicker($('<input id="k-editor-table-bg" />').appendTo(container), "bgColor", tableProperties, tableView);
                        }
                    },{
                        colSpan: 1,
                        field: "k-editor-border-width",
                        label: encode(messages.borderWidth),
                        editor: function(container, options) {
                            that._initNumericTextbox($('<input id="k-editor-border-width" />').appendTo(container), "borderWidth", tableProperties, tableView);
                        }
                    },{
                        colSpan: 1,
                        field: "k-editor-border-color",
                        label: encode(messages.borderColor),
                        editor: function(container, options) {
                            that._initColorPicker($('<input id="k-editor-border-color" />').appendTo(container), "borderColor", tableProperties, tableView);
                        }
                    },{
                        colSpan: 2,
                        field: "k-editor-border-style",
                        label: encode(messages.borderStyle),
                        editor: function(container, options) {
                            that._initBorderStyleDropDown($('<input id="k-editor-border-style" />').appendTo(container),
                                "borderStyle",
                                tableProperties,
                                tableView,
                                borderStyles);
                        }
                    },{
                        colSpan: "full",
                        field: "k-editor-collapse-borders",
                        label: "",
                        editor: function(container, options) {
                            that._initCheckbox($('<input id="k-editor-collapse-borders"/>').appendTo(container), "collapseBorders", tableProperties, tableView, { label: encode(messages.collapseBorders) });
                        }
                    }]
                }
            ]
        }).data("kendoForm");
        form.layoutWrapper.addClass("k-gap-x-4");

        return form;
    },

    _createCellPropertiesForm: function(dialog, messages) {
        var that = this;
        var table = that.options.table;
        var formElement = dialog.element.find("#k-cell-properties");
        var components = that.components = that.components || {};
        var cellView = components.cellView = {};
        var cellProperties = (table.selectedCells && table.selectedCells[0]) || { borderStyle: "", wrapText: true };
        var form;

        that._addUnit(units, cellProperties.widthUnit);
        that._addUnit(units, cellProperties.heightUnit);
        form = formElement.kendoForm({
            renderButtons: false,
            layout: "grid",
            grid: {
                cols: 4
            },
            items: [
                {
                    colSpan: "full",
                    field: "k-editor-selectAllCells",
                    label: "",
                    editor: function(container, options) {
                        that._initCheckbox($('<input id="k-editor-selectAllCells" />').appendTo(container), "selectAllCells", table.tableProperties, cellView, { label: encode(messages.selectAllCells) });
                    }
                },{
                    colSpan: 1,
                    field: "k-editor-cell-width",
                    label: encode(messages.width),
                    hint: encode(messages.applyToColumn),
                    editor: function(container, options) {
                        that._initNumericTextbox($('<input id="k-editor-cell-width" />').appendTo(container), "width", cellProperties, cellView, { placeholder: encode(messages.auto) });
                    }
                },{
                    colSpan: 1,
                    field: "k-editor-cell-width-type",
                    label: {
                        encoded: false,
                        text: '&nbsp;'
                    },
                    editor: function(container, options) {
                        that._initDropDownList($(`<input id="k-editor-cell-width-type" aria-label="${ messages.units }" />`).appendTo(container),
                            "widthUnit",
                            cellProperties,
                            cellView,
                            units);
                    }
                },{
                    colSpan: 1,
                    field: "k-editor-cell-height",
                    label: encode(messages.height),
                    hint: encode(messages.applyToRow),
                    editor: function(container, options) {
                        that._initNumericTextbox($('<input id="k-editor-cell-height" />').appendTo(container), "height", cellProperties, cellView, { placeholder: encode(messages.auto) });
                    }
                },{
                    colSpan: 1,
                    field: "k-editor-cell-height-type",
                    label: {
                        encoded: false,
                        text: '&nbsp;'
                    },
                    editor: function(container, options) {
                        that._initDropDownList($(`<input id="k-editor-cell-height-type" aria-label="${ messages.units }" />`).appendTo(container),
                            "heightUnit",
                            cellProperties,
                            cellView,
                            units);
                    }
                },{
                    colSpan: 2,
                    field: "k-editor-cell-alignment",
                    label: encode(messages.alignment),
                    editor: function(container, options) {
                        that._initCellAlignmentDropDown($('<input id="k-editor-cell-alignment" class="k-align" />').appendTo(container), cellProperties);
                    }
                },{
                    colSpan: 2,
                    field: "k-editor-wrap-text",
                    label: "Text control",
                    editor: function(container, options) {
                        that._initTextWrapDropDown($('<input id="k-editor-wrap-text" />').appendTo(container),
                        cellProperties);
                    }
                },{
                    colSpan: "full",
                    field: "k-editor-cell-bg",
                    label: encode(messages.background),
                    editor: function(container, options) {
                        that._initColorPicker($('<input id="k-editor-cell-bg" />').appendTo(container), "bgColor", cellProperties, cellView);
                    }
                },{
                    colSpan: 2,
                    field: "k-editor-table-cell-margin",
                    label: encode(messages.cellMargin),
                    editor: function(container, options) {
                        that._initNumericTextbox($('<input id="k-editor-table-cell-margin" />').appendTo(container), "cellMargin", cellProperties, cellView, { placeholder: encode(messages.auto) });
                    }
                },{
                    type: "group",
                    label: "Cell Paddings",
                    layout: "grid",
                    colSpan: 4,
                    grid: {
                        cols: 4,
                        gutter: 20
                    },
                    items: [
                        {
                            colSpan: "full",
                            field: "k-editor-padding-all-sides",
                            label: "",
                            editor: function(container, options) {
                                that._initCheckbox($('<input id="k-editor-padding-all-sides" />').appendTo(container), "independentCellPaddings", table.tableProperties, cellView,
                                {
                                    checked: true,
                                    label: encode(messages.independentCellPaddings),
                                    change: that._onPaddingCheckChange.bind(that)
                                });
                            }
                        },{
                            colSpan: 1,
                            field: "k-editor-table-cells-padding-top",
                            label: encode(messages.topPadding),
                            editor: function(container, options) {
                                that._initNumericTextbox($('<input id="k-editor-table-cells-padding-top" />').appendTo(container), "topCellPadding", cellProperties, cellView,
                                {
                                    placeholder: encode(messages.auto),
                                    change: that._onPaddingTopChange.bind(that)
                                });
                            }
                        },{
                            colSpan: 1,
                            field: "k-editor-table-cells-padding-right",
                            label: encode(messages.rightPadding),
                            editor: function(container, options) {
                                that._initNumericTextbox($('<input id="k-editor-table-cells-padding-right" />').appendTo(container), "rightCellPadding", cellProperties, cellView, { placeholder: encode(messages.auto) });
                            }
                        },{
                            colSpan: 1,
                            field: "k-editor-table-cells-padding-bottom",
                            label: encode(messages.bottomPadding),
                            editor: function(container, options) {
                                that._initNumericTextbox($('<input id="k-editor-table-cells-padding-bottom" />').appendTo(container), "bottomCellPadding", cellProperties, cellView, { placeholder: encode(messages.auto) });
                            }
                        },{
                            colSpan: 1,
                            field: "k-editor-table-cells-padding-left",
                            label: encode(messages.leftPadding),
                            editor: function(container, options) {
                                that._initNumericTextbox($('<input id="k-editor-table-cells-padding-left" />').appendTo(container), "leftCellPadding", cellProperties, cellView, { placeholder: encode(messages.auto) });
                            }
                        }
                    ]
                },{
                    type: "group",
                    label: "Borders",
                    layout: "grid",
                    colSpan: 4,
                    grid: {
                        cols: 4,
                        gutter: 10
                    },
                    items: [{
                        colSpan: 1,
                        field: "k-editor-cell-border-width",
                        label: encode(messages.borderWidth),
                        editor: function(container, options) {
                            that._initNumericTextbox($('<input id="k-editor-cell-border-width" />').appendTo(container), "borderWidth", cellProperties, cellView, { placeholder: encode(messages.auto) });
                        }
                    },{
                        colSpan: 1,
                        field: "k-editor-cell-border-color",
                        label: encode(messages.borderColor),
                        editor: function(container, options) {
                            that._initColorPicker($('<input id="k-editor-cell-border-color" />').appendTo(container), "borderColor", cellProperties, cellView, { placeholder: encode(messages.auto) });
                        }
                    },{
                        colSpan: 2,
                        field: "k-editor-cell-border-style",
                        label: encode(messages.borderStyle),
                        editor: function(container, options) {
                            that._initBorderStyleDropDown($('<input id="k-editor-cell-border-style" />').appendTo(container),
                                "borderStyle",
                                cellProperties,
                                cellView,
                                borderStyles);
                        }
                    }]
                },{
                    colSpan: "full",
                    field: "k-editor-cell-id",
                    label: {
                        text: encode(messages.id),
                        optional: true
                    },
                    editor: function(container, options) {
                        that._initInput($('<input id="k-editor-cell-id" />').appendTo(container), "id", cellProperties, cellView);
                    }
                },{
                    colSpan: "full",
                    field: "k-editor-cell-css-class",
                    label: {
                        text: encode(messages.cssClass),
                        optional: true
                    },
                    editor: function(container, options) {
                        that._initInput($('<input id="k-editor-cell-css-class" />').appendTo(container), "className", cellProperties, cellView);
                    }
                }
            ]
        }).data("kendoForm");
        form.layoutWrapper.addClass("k-gap-x-4");

        return form;
    },

    _createAccessibilityPropertiesForm: function(dialog, messages) {
        var that = this;
        var table = that.options.table;
        var formElement = dialog.element.find("#k-accessibility-properties");
        var components = that.components;
        var accessibilityView = components.accessibilityView = {};
        var tableProperties = table.tableProperties;
        var form;

        form = formElement.kendoForm({
            renderButtons: false,
            layout: "grid",
            grid: {
                cols: 4
            },
            items: [
                {
                    colSpan: "full",
                    field: "k-editor-id",
                    label: {
                        text: encode(messages.id),
                        optional: true
                    },
                    editor: function(container, options) {
                        that._initInput($('<input id="k-editor-id" />').appendTo(container), "id", tableProperties, accessibilityView);
                    }
                },{
                    colSpan: "full",
                    field: "k-editor-css-class",
                    label: {
                        text: encode(messages.cssClass),
                        optional: true
                    },
                    editor: function(container, options) {
                        that._initInput($('<input id="k-editor-css-class" />').appendTo(container), "className", tableProperties, accessibilityView);
                    }
                },
                {
                    layout: "grid",
                    grid: {
                        cols: 4,
                        gutter: 16
                    },
                    colSpan: "full",
                    type: "group",
                    label: "Accessibility",
                    items: [
                        {
                            colSpan: 2,
                            field: "k-editor-table-caption",
                            label: {
                                text: encode(messages.caption),
                                optional: true
                            },
                            editor: function(container, options) {
                                that._initInput($('<input id="k-editor-table-caption" />').appendTo(container), "captionContent", tableProperties, accessibilityView);
                            }
                        },{
                            colSpan: 2,
                            field: "k-editor-accessibility-alignment",
                            label: encode(messages.captionAlignment),
                            editor: function(container, options) {
                                that._initAccessibilityAlignmentDropDown($('<input id="k-editor-accessibility-alignment" />').appendTo(container), tableProperties);
                            }
                        },{
                            colSpan: 1,
                            field: "k-editor-table-header-rows",
                            label: encode(messages.headerRows),
                            editor: function(container, options) {
                                that._initNumericTextbox($('<input id="k-editor-table-header-rows" />').appendTo(container),
                                "headerRows",
                                tableProperties,
                                accessibilityView,
                                {
                                    max: tableProperties.rows || DEFAULT_NUMBER_OF_COLS_AND_ROWS
                                });
                            }
                        },{
                            colSpan: 1,
                            field: "k-editor-table-header-columns",
                            label: encode(messages.headerColumns),
                            editor: function(container, options) {
                                that._initNumericTextbox($('<input id="k-editor-table-header-columns" />').appendTo(container),
                                "headerColumns",
                                tableProperties,
                                accessibilityView,
                                {
                                    max: tableProperties.columns || DEFAULT_NUMBER_OF_COLS_AND_ROWS
                                });
                            }
                        },{
                            colSpan: 2,
                            field: "k-editor-cells-headers",
                            label: encode(messages.associateCellsWithHeaders),
                            editor: function(container, options) {
                                var element = $(`<select id="k-editor-cells-headers">
                                    <option value="none">${ messages.associateNone }</option>
                                    <option value="scope">${ messages.associateScope }</option>
                                    <option value="ids">${ messages.associateIds }</option>
                                </select>`).appendTo(container);

                                that._initAssociationDropDown(element, "cellsWithHeaders", { valuePrimitive: true }, tableProperties, accessibilityView);
                            }
                        },{
                            colSpan: "full",
                            field: "k-editor-accessibility-summary",
                            label: {
                                text: encode(messages.summary),
                                optional: true
                            },
                            editor: function(container, options) {
                                that._initTextArea($('<textarea id="k-editor-accessibility-summary"></textarea>').appendTo(container), "summary", tableProperties, accessibilityView, {
                                    rows: 5,
                                    placeholder: messages.tableSummaryPlaceholder
                                });
                            }
                        }
                    ]
                }
            ]
        }).data("kendoForm");

        form.layoutWrapper.addClass("k-gap-x-4");

        return form;
    }
});

kendo.ui.editor.TableWizardDialog = TableWizardDialog;

})(window.kendo.jQuery);

const __meta__ = {
        id: "editor",
        name: "Editor",
        category: "web",
        description: "Rich text editor component",
        depends: [ "combobox", "dropdownlist", "window", "colorpicker", "toolbar", "icons" ],
        features: [ {
            id: "editor-imagebrowser",
            name: "Image Browser",
            description: "Support for uploading and inserting images",
            depends: [ "imagebrowser" ]
        }, {
            id: "editor-resizable",
            name: "Resize handle",
            description: "Support for resizing the content area via a resize handle",
            depends: [ "resizable" ]
        }, {
            id: "editor-tablewizard",
            name: "Table wizard dialog",
            description: "Support for table properties configuration",
            depends: [ "tabstrip", "button", "numerictextbox", "textarea" ]
        }, {
            id: "editor-pdf-export",
            name: "PDF export",
            description: "Export Editor content as PDF",
            depends: [ "pdf", "drawing" ]
        },{
            id: "editor-ai",
            name: "AI Prompt",
            description: "The AIPrompt component simplifies the incorporation of external AI services into apps.",
            depends: [ "aiprompt", "inlineaiprompt", "buttongroup", "splitter", "icons", "html.input"]
        }]
    };
var kendo$1 = kendo;

export { __meta__, kendo$1 as default };
