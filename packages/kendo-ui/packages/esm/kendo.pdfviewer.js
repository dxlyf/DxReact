import './kendo.mobile.scroller.js';
import './kendo.toolbar.js';
import './kendo.pager.js';
import './kendo.combobox.js';
import './kendo.textbox.js';
import './kendo.core.js';
import './html-DIrOxn6k.js';
import './kendo.upload.js';
import { PdfViewerInteractionMode, DEFAULT_ZOOM_LEVEL, scrollToPage, PdfViewer, Scroller, currentPage } from '@progress/kendo-pdfviewer-common';
import './kendo.dialog.js';
import './kendo.window.js';
import './kendo.binder.js';
import './kendo.numerictextbox.js';
import './kendo.dropdownlist.js';
import './kendo.icons.js';
import './kendo.draganddrop.js';
import 'pdfjs-dist/build/pdf.worker.mjs';
import './kendo.form.js';
import './kendo.colorpicker.js';
import './kendo.fx.js';
import './kendo.licensing.js';
import '@progress/kendo-licensing';
import './kendo.userevents.js';
import './kendo.splitbutton.js';
import './kendo.html.button.js';
import './kendo.html.base.js';
import './kendo.html.icon.js';
import '@progress/kendo-svg-icons';
import './kendo.button.menu.js';
import './kendo.popup.js';
import './kendo.dropdownbutton.js';
import './kendo.buttongroup.js';
import './kendo.togglebutton.js';
import './kendo.button.js';
import './kendo.badge.js';
import './kendo.menu.js';
import './kendo.data.js';
import './kendo.data.odata.js';
import './kendo.data.xml.js';
import './kendo.list.js';
import './kendo.label.js';
import './kendo.floatinglabel.js';
import './kendo.actionsheet.js';
import './kendo.actionsheet.view.js';
import './dropdowns-loader-00xUvouJ.js';
import './kendo.virtuallist.js';
import './valueMapper-CXgI6HWc.js';
import './prefix-suffix-containers-Cid0cOEy.js';
import '@progress/kendo-drawing';
import './kendo.color.js';
import './kendo.progressbar.js';
import './kendo.editable.js';
import './kendo.checkbox.js';
import './kendo.toggleinputbase.js';
import './kendo.html.input.js';
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
import './kendo.slider.js';

(function($, undefined$1) {
    var kendo = window.kendo,
        extend = $.extend,
        Class = kendo.Class;

    var DPLProcessor = Class.extend({
        init: function(options, viewer) {
            var that = this;

            that.options = options;
            that.read = options.read;
            that.upload = options.upload;
            that.download = options.download;

            that.viewer = viewer;
        },
        fetchDocument: function() {
            var that = this,
                deferred = $.Deferred(),
                errorMessages = that.viewer.options.messages.errorMessages;

            if (!that.read) {
                return deferred.resolve();
            }

            $.ajax({
                type: that.read.type,
                url: that.read.url,
                dataType: that.read.dataType,
                success: function(data) {
                    if (typeof data != "string") {
                        data = kendo.stringify(data);
                    }
                    deferred.resolve(JSON.parse(data));
                },
                error: function(xhr) {
                    that.viewer._triggerError({
                        error: xhr.responseText,
                        message: errorMessages.parseError
                    });
                }
            });

            return deferred;
        },
        fetchPageData: function(number) {
            var that = this;
            var deferred = $.Deferred();
            var page = that.viewer.document.pages[number - 1];
            var data = {};
            data[that.read.pageField] = number;

            if (!page.geometries.length) {
                $.ajax({
                    type: that.read.type,
                    url: that.read.url,
                    data: data,
                    success: function(data) {
                        deferred.resolve(JSON.parse(data));
                    },
                    error: function(xhr) {
                        that.viewer._triggerError({
                            error: xhr.responseText,
                            message: that.viewer.options.messages.errorMessages.parseError
                        });
                    }
                });
            } else {
                deferred.resolve(page);
            }

            return deferred;
        },
        downloadFile: function(fileName) {
            window.location = this.download.url + "?file=" + fileName;
        },

        fromJSON: function(json)
        {
            var viewer = this.viewer;
            viewer._clearPages();

            viewer.document = json;
            viewer.document.total = viewer.document.pages.length;

            viewer._renderPages();
            viewer.resize(true);

            viewer.activatePage(1);
        }
    });

    extend(kendo, {
        pdfviewer: {
            dpl: {
                processor: DPLProcessor
            }
        }
    });
})(window.kendo.jQuery);

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */

function isLoaded() {
    if (!window.pdfjsLib) {
        console?.error(`PDF.JS library is required. Make sure that it is properly loaded <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.6.82/pdf.mjs" type="module"></script>`);
        return false;
    }

    if (!window.pdfjsLib?.GlobalWorkerOptions?.workerSrc && !window.pdfjsWorker) {
        console?.error(`The pdf.worker.mjs script is not loaded. The PDF.JS library will not work correctly.
    Either load the script:
    
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.6.82/pdf.worker.mjs" type="module"></script>
    
    Or set it to the GlobalWorkerOptions.workerSrc property:
    
    <script type="module">
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.6.82/pdf.worker.mjs';
    </script>`);
    return false;
    }

    return true;
}

kendo.pdfviewer.pdfjs = { lib: window.pdfjsLib };

(function($, undefined$1) {
    var Class = kendo.Class,
        extend = $.extend,
        parseJSON = JSON.parse,
        progress = kendo.ui.progress,
        Class = kendo.Class,
        OPEN = "open";

    var UploadHelper = Class.extend({
        init: function(viewer) {
            this.viewer = viewer;
            this.errorMessages = this.viewer.options.messages.errorMessages;
            this.upload = this.viewer.processor && this.viewer.processor.upload;
        },
        _initUpload: function(uploadElement, extendUploadOptions) {
            var uploadOptions = extend({
                select: this._onSelect.bind(this),
                success: this._onSuccess.bind(this),
                error: this._onError.bind(this),
                complete: this._onComplete.bind(this),
                showFileList: false,
                multiple: false,
                validation: {
                    allowedExtensions: [".pdf"]
                }
            }, extendUploadOptions || {});

            if (this.upload) {
                extend(uploadOptions, {
                    async: {
                        saveUrl: this.upload.url,
                        autoUpload: true,
                        saveField: this.upload.saveField
                    }
                });
            }

            var upload = (uploadElement || $('<input name="files" accept=".pdf" type="file" />')).kendoUpload(uploadOptions).getKendoUpload();

            return upload;
        },
        _onComplete: function() {
            progress(this.viewer.pageContainer, false);
        },
        _onSuccess: function(e) {
            var json = parseJSON(e.response);

            if ($.isPlainObject(json)) {
                this.viewer.processor.fromJSON(json);
            }
            else {
                this.viewer._triggerError({
                    error: json,
                    message: this.errorMessages.parseError
                });
            }
        },
        _onError: function(e) {
            this.viewer._triggerError({
                error: e.XMLHttpRequest.responseText,
                message: this.errorMessages.notSupported
            });
        },
        _onSelect: function(e) {
            var that = this;
            var fileToUpload = e.files[0];

            progress(that.viewer.pageContainer, true);

            if (that.viewer.trigger(OPEN, { file: fileToUpload }) || that.upload) {
                return;
            } else if (fileToUpload.extension.toLowerCase() !== ".pdf") {
                that.viewer._triggerError({
                    error: fileToUpload,
                    message: that.errorMessages.notSupported
                });
                return;
            }

            var reader = new FileReader();
            reader.onload = function(e) {
                var document = e.target.result;
                const loadParams = that.viewer._isDPLProcessor() ? document : { data: document };
                that.viewer.fromFile(loadParams);
            };
            reader.onerror = function() {
                that.viewer._triggerError({
                    error: fileToUpload,
                    message: that.errorMessages.parseError
                });
            };

            reader.readAsArrayBuffer(fileToUpload.rawFile);
        }
    });

    extend(kendo.pdfviewer, {
        UploadHelper: UploadHelper
    });
})(window.kendo.jQuery);

(function($, undefined$1) {
    var extend = $.extend,
        noop = $.noop,
        drawing = kendo.drawing,
        Group = drawing.Group,
        Surface = drawing.Surface,
        RENDER = "render",
        Class = kendo.Class,
        UploadHelper = kendo.pdfviewer.UploadHelper;

    var geometryTypes = {
        Path: "path",
        MultiPath: "multipath",
        Rect: "rect",
        Image: "image",
        Text: "text"
    };

    var BLANK_PAGE_TEMPLATE = (dropzoneId) => `<div class="k-page k-blank-page">
        <div id="${dropzoneId}" class="k-external-dropzone">
            <div class="k-dropzone-inner">
                <span class="k-dropzone-icon k-icon k-svg-icon k-icon-xxxl k-svg-i-upload">
                    <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                        <path d="M32 384v96h448v-96H32zm192-64h64V192h96L256 32 128 192h96v128z"></path>
                    </svg>
                </span>
                <span class="k-dropzone-hint">Drag and drop files here to upload</span>
            </div>
        </div>
        <input name="files" accept=".pdf" type="file" ref-pdfviewer-blank-page-upload>
    </div>`;

    var Page = Class.extend({
        init: function(options, viewer) {
            this.viewer = viewer;
            this.processor = options.processor;
            this.options = options;
            this.pageNumber = options.number;

            this.element = $("<div class='k-page' />");
            this.element.attr(kendo.attr("number"), this.pageNumber);

            this._updatePageSize(options);
            this.width = options.width;
            this.height = options.height;
        },
        resize: function(ratio) {
            var pageElement = this.element;

            this._updatePageSize({
                width: Math.min(pageElement.width() * ratio, this.width),
                height: Math.min(pageElement.height() * ratio, this.height)
            });
        },
        _updatePageSize: function(size) {
            this.element
                    .width(size.width)
                    .height(size.height);
        },
        destroy: function() {
            kendo.destroy(this.element);
        },
        render: noop
    });

    var BlankPage = Page.extend({
        init: function(options, viewer) {
            this.viewer = viewer;
            this.options = options;
            this._externalDropZoneId = `${viewer.element.attr("id")}-external-dropzone`;
            this.element = $(BLANK_PAGE_TEMPLATE(this._externalDropZoneId));
            this._uploadHelper = new UploadHelper(viewer);
        },
        _initUpload: function() {
            this._upload = this._uploadHelper._initUpload(this.element.find("input[ref-pdfviewer-blank-page-upload]"), {
                dropZone: `#${this._externalDropZoneId}`,
                showFileList: false,
                async: {
                    autoUpload: false,
                    saveUrl: "save"
                }
            });
        },
        resize: noop,
        _updatePageSize: noop,
        destroy: function() {
            if (this._upload) {
                this._upload.destroy();
            }

            kendo.destroy(this.element);
        },
        render: noop
    });

    var DPLPage = Page.extend({
        draw: function() {
            var that = this,
                geometries = that.options.geometries;

            that.group = new Group();
            that.surface.draw(that.group);

            that._drawGeometries(geometries);

            that.viewer.trigger(RENDER, { page: this });
            kendo.ui.progress(that.element, false);
        },
        load: function() {
            var that = this;

            if (that.loaded || !that.processor)
            {
                return;
            }

            that.processor.fetchPageData(that.pageNumber).then(function(data) {
                that.options = data;
                that._initSurface();
                that.draw();
            });

            that.loaded = true;
        },
        _initSurface: function() {
            var size = {
                width: this.element.width(),
                height: this.element.height()
            };
            var surfaceOptions = extend({ width: this.width, height: this.height }, this.viewer.options.view);
            this.surface = new Surface(this.element, surfaceOptions);
            this._updatePageSize(size);
        },
        _drawGeometries: function(geometries) {
            var that = this,
                kGeometry;

            if (!geometries) {
                return;
            }

            for (var i = 0; i <= geometries.length; i++) {
                var geometry = geometries[i];

                if (!geometry) {
                    continue;
                }

                switch (geometry.type) {
                    case geometryTypes.Path:
                    case geometryTypes.MultiPath:
                        kGeometry = that._drawPath(geometry);
                        break;
                    case geometryTypes.Rect:
                        kGeometry = that._drawRect(geometry);
                        break;
                    case geometryTypes.Image:
                        kGeometry = that._drawImage(geometry);
                        break;
                    case geometryTypes.Text:
                        kGeometry = that._drawText(geometry);
                        break;
                    default:
                        kGeometry = null;
                        break;
                }

                if (kGeometry)
                {
                    that.group.append(kGeometry);
                }
            }
        },
        _drawRect: function(geometry)
        {
            var rectGeo = new kendo.geometry.Rect(geometry.point, geometry.size);

            return new drawing.Rect(rectGeo, {
                transform: this._getMatrix(geometry.transform),
                fill: geometry.fillOptions,
                stroke: geometry.strokeOptions
            });
        },

        _drawImage: function(geometry)
        {
            var imageRect = new kendo.geometry.Rect(geometry.point, geometry.size);
            return new drawing.Image(geometry.src, imageRect, {
                transform: this._getMatrix(geometry.transform)
            });
        },

        _drawText: function(geometry)
        {
            var options = {
                transform: this._getMatrix(geometry.transform),
                stroke: geometry.strokeOptions,
                fill: geometry.fillOptions,
                font: geometry.font
            };
            return new kendo.drawing.Text(geometry.content, geometry.point, options);
        },

        _drawPath: function(geometry)
        {
            var options = {
                transform: this._getMatrix(geometry.transform),
                stroke: geometry.strokeOptions,
                fill: geometry.fillOptions
            };
            var path = new drawing.MultiPath(options);

            for (var i = 0; i < geometry.paths.length; i++) {
                var subPath = geometry.paths[i];

                if (!subPath.segments)
                {
                    return;
                }

                path.moveTo.apply(path, subPath.point);

                for (var j = 0; j < subPath.segments.length; j++) {
                    var segment = subPath.segments[j];
                    var drawAction = segment.points.length === 1 ? path.lineTo : path.curveTo;
                    drawAction.apply(path, segment.points);
                }

                if (subPath.closed) {
                    path.close();
                }
            }

            return path;
        },

        _getMatrix: function(transform) {
            var matrix = Object.create(kendo.geometry.Matrix.prototype);
            kendo.geometry.Matrix.apply(matrix, transform);
            return matrix;
        }
    });

    extend(kendo.pdfviewer.dpl, {
        geometryTypes: geometryTypes,
        Page: DPLPage
    });
    extend(kendo.pdfviewer, {
        BlankPage: BlankPage
    });
})(window.kendo.jQuery);

const deleteAnnotation = (widget) => {
    widget.deleteAnnotation();
};

const setHighlightTextColor = (widget, color) => {
    widget.setHighlightColor(color);
};

const setFreeTextFontColor = (widget, color) => {
    widget.setFreeTextColor(color);
};

const setFreeTextFontSize = (widget, fontSize) => {
    widget.setFreeTextFontSize(fontSize);
};

const setAnnotationEditorMode = (widget, args) => {
    if (widget.interactionMode !== args.mode) {
        widget.setInteractionMode({
            mode: args.mode
        });
    }

    widget.setAnnotationEditorMode(args);
};

const resetAnnotationEditorMode = (widget) => {
    widget.resetAnnotationEditorMode();
};

const setInteractionMode = (widget, mode) => {
    widget.setInteractionMode({ mode: mode });
};

const $$1 = jQuery;
const AnnotationEditorType = {
    FREETEXT: 3,
    HIGHLIGHT: 9
};

class AnnotationToolbar {
    constructor(viewer) {
        this.viewer = viewer;
        this.widget = viewer.pdfViewerCommon;
        this.init();
    }

    init() {
        const annotationsToolbar = this.element = $$1("<div></div>");

        annotationsToolbar.insertAfter(this.viewer.toolbar.element);
        const toolbar = this.toolbar = new kendo.ui.ToolBar(annotationsToolbar, {
            fillMode: 'flat',
            tools: [
                { name: "highlight", command: "highlight", icon: "highlight", type: "button", togglable: true, showText: "overflow", group: "annotations", fillMode: "flat" },
                { type: "separator" },
                { name: "freeText", command: "freeText", icon: "free-text", type: "button", togglable: true, showText: "overflow", group: "annotations", fillMode: "flat" },
                { type: "spacer" },
                { name: "close", command: "close", icon: "x", type: "button", showText: "overflow", fillMode: "flat" }
            ],
            parentMessages: {
                highlight: "Highlight",
                freeText: "Free text",
                close: "Close"
            }
        });

        toolbar.bind("click", this.onToolbarClick.bind(this));
        toolbar.bind("toggle", this.onToolbarClick.bind(this));
    }

    onToolbarClick(e) {
        const widget = this.widget;
        const target = $$1(e.target);
        const command = target.data("command");
        const viewerToolbar = this.viewer.toolbar;

        switch (command) {
            case "close":
                this.destroy();
                viewerToolbar.element.find("[tabindex=0]").trigger("focus");
                break;
            case "highlight":
                setAnnotationEditorMode(widget, { interactionMode: PdfViewerInteractionMode.TextSelection, mode: AnnotationEditorType.HIGHLIGHT });
                break;
            case "freeText":
                setAnnotationEditorMode(widget, { interactionMode: PdfViewerInteractionMode.TextSelection, mode: AnnotationEditorType.FREETEXT });
                break;
        }
    }

    destroy() {
        if (this.toolbar) {
            this.viewer.toolbar.toggle("[title='Annotations']", false);
            this.toolbar.unbind("click");
            this.toolbar.unbind("toggle");
            this.toolbar.destroy();
            this.toolbar = null;
            this.element.remove();
            this.element = null;
            this.viewer.annotationsToolbar = null;
            resetAnnotationEditorMode(this.widget);
        }
    }
}

(function($, undefined$1) {
    var kendo = window.kendo,
        extend = $.extend,
        progress = kendo.ui.progress,
        Class = kendo.Class,
        UploadHelper = kendo.pdfviewer.UploadHelper,
        ZOOMSTART = "zoomStart",
        ZOOMEND = "zoomEnd";

    var Command = Class.extend({
        init: function(options) {
            this.options = options;
            this.viewer = options.viewer;
            this.errorMessages = this.viewer.options.messages.errorMessages;
        }
    });

    var OpenCommand = Command.extend({
        init: function(options) {
            Command.fn.init.call(this, options);
            this._uploadHelper = new UploadHelper(this.viewer);
        },
        exec: function() {
            this.viewer._upload = this.viewer._upload || this._uploadHelper._initUpload();
            this.viewer._upload.element.click();
        },
    });

    var PageChangeCommand = Command.extend({
        exec: function() {
            var targetPage = this.options.value,
                viewer = this.viewer,
                current, total;

            if (isNaN(targetPage)) {
                current = viewer._pageNum;
                total = viewer.document.total || viewer.document.numPages;

                switch (targetPage) {
                    case "first": targetPage = 1;
                        break;
                    case "prev": targetPage = current > 1 ? current - 1 : 1;
                        break;
                    case "next": targetPage = current < total ? current + 1 : total;
                        break;
                    case "last": targetPage = total;
                        break;
                }
            } else {
                targetPage = Number(targetPage);
            }

            viewer.activatePage(targetPage, false);
        }
    });

    var DownloadCommand = Command.extend({
        exec: function() {
            const that = this;
            if (!that.viewer.document) {
                that.viewer._triggerError({
                    message: that.errorMessages.notFound
                });
                return;
            }

            const fileName = (that.viewer.document.info && that.viewer.document.info.title) ||
            that.viewer.options.messages.defaultFileName;

            if (that.viewer._isDPLProcessor()) {
                that.viewer.processor.downloadFile(fileName);
            } else {
                that.viewer.pdfViewerCommon.downloadFile({ fileName });
            }
        }
    });

    var ExportCommand = Command.extend({
        init: function(options) {
            options = $.extend(options, this.options);
            Command.fn.init.call(this, options);
        },
        exec: function() {
            var dialog = (this.viewer._saveDialog || this._initDialog());

            dialog._updateModel({
                pagesCount: (this.viewer.document && this.viewer.document.total) || 1,
                page: this.viewer.options.page
            });

            dialog.open();
        },
        apply: function(viewModel) {
            var extension = viewModel.extension;

            if (extension === ".png") {
                this.viewer.exportImage(viewModel);
            } else if (extension === ".svg") {
                this.viewer.exportSVG(viewModel);
            }
        },
        _initDialog: function() {
            this.viewer._saveDialog = new kendo.pdfviewer.dialogs.ExportAsDialog({
                apply: this.apply.bind(this),
                pagesCount: (this.viewer.document && this.viewer.document.total) || 1,
                messages: this.viewer.options.messages
            });
            return this.viewer._saveDialog;
        }
    });

    var EnableSelectionCommand = Command.extend({
        exec: function() {
            const that = this,
                viewer = that.viewer;

            viewer.toolbar.enable(viewer.toolbar.element.find("[data-command=AnnotationsCommand]"), true);
            setInteractionMode(viewer.pdfViewerCommon, PdfViewerInteractionMode.TextSelection);
        }
    });

    var EnablePanCommand = Command.extend({
        exec: function() {
            const that = this,
                viewer = that.viewer;

            viewer.toolbar.enable(viewer.toolbar.element.find("[data-command=AnnotationsCommand]"), false);
            if (viewer.annotationsToolbar) {
                viewer.annotationsToolbar.destroy();
            }
            resetAnnotationEditorMode(viewer.pdfViewerCommon);
            setInteractionMode(viewer.pdfViewerCommon, PdfViewerInteractionMode.Pan);
        }
    });

    const OpenSearchCommand = Command.extend({
        init: function(options) {
            const that = this;

            that.viewer = options.viewer;

            if (!that.viewer.searchDialog) {
                that.viewer.searchDialog = new kendo.pdfviewer.dialogs.SearchDialog({
                    pageContainer: that.viewer.pageContainerWrapper,
                    position: {
                        top: that.viewer.pageContainer.offset().top,
                        left: that.viewer.pageContainer.offset().left
                    },
                    messages: that.viewer.options.messages.dialogs.search,
                    open: that._open.bind(that),
                    next: that._next.bind(that),
                    prev: that._prev.bind(that),
                    close: that._close.bind(that)
                });
            }

            Command.fn.init.call(that, options);
        },
        exec: function() {
            const that = this;

            that.viewer.searchDialog.open();
        },
        _open: function() {
            const that = this;

            that.changeHandler = that._change.bind(that);
            that.viewer.searchDialog.searchModel.bind("change", that.changeHandler);
        },
        _close: function() {
            const that = this;
            that.viewer.pdfViewerCommon.clearSearch();
            that.viewer.toolbar.element.find("[tabindex=0]").trigger("focus");
            that.viewer.searchDialog.searchModel.unbind("change", that.changeHandler);
            that.matches = [];
            that.matchIndex = null;
            that._updateSearchModel();
        },
        _change: function(ev) {
            const that = this,
                text = that.viewer.searchDialog.searchModel["searchText"],
                matchCase = that.viewer.searchDialog.searchModel["matchCase"];

            if (ev.field === "searchText" || ev.field === "matchCase") {
                that.matches = that.viewer.pdfViewerCommon.searchText({ text: text, matchCase: matchCase });
                that.matchIndex = that.matches.length ? 1 : 0;
                that._updateSearchModel();
            }
        },
        _next: function() {
            const that = this;

            that.viewer.pdfViewerCommon.goToNextSearchMatch();
            that.matchIndex = that.matchIndex + 1 > that.matches.length ? 1 : that.matchIndex + 1;
            that._updateSearchModel();
        },
        _prev: function() {
            const that = this;

            that.viewer.pdfViewerCommon.goToPreviousSearchMatch();
            that.matchIndex = that.matchIndex - 1 < 1 ? that.matches.length : that.matchIndex - 1;
            that._updateSearchModel();
        },
        _updateSearchModel: function() {
            const that = this,
                model = that.viewer.searchDialog.searchModel;

            if (that.matches && that.matches.length) {
                model.set("matches", that.matches.length);
                model.set("matchIndex", that.matchIndex);
            } else {
                model.set("searchText", "");
                model.set("matches", 0);
                model.set("matchIndex", 0);
            }
        },
        _closeDialog: function() {
            const that = this;
            that.viewer.searchDialog.close();
        }
    });

    var ZoomCommand = Command.extend({
        exec: function() {
            const that = this;
            const scale = that._calculateZoom();

            if (scale === undefined$1) {
                return;
            }

            let zoomLevel = scale.zoomLevel;

            if (that.viewer.zoomScale !== scale.zoomLevel) {
                that.viewer._preventRenderEvent = true;
                that.viewer._currentPage = that.viewer.pdfViewerCommon.getCurrentPageIndex() + 1;
                that.viewer.pdfViewerCommon.zoom({ zoomLevel: scale.zoomLevel, zoomLevelType: scale.zoomLevelType });
                zoomLevel = that.viewer.pdfViewerCommon.options.zoomLevel;
                that._triggerZoomEnd(zoomLevel);
            }

            that.viewer.zoomScale = zoomLevel;
        },

        _calculateZoom: function() {
            var options = this.options,
                viewer = this.viewer,
                viewerOptions = viewer.options,
                scale = options.value || options.scale,
                scaleValue = scale,
                zoomLevelType = "",
                preventZoom;

            viewer._allowResize = false;
            viewer._autoFit = false;

            if (options.zoomIn) {
                scaleValue = scale = viewer.zoomScale + viewerOptions.zoomRate;
            } else if (options.zoomOut) {
                scaleValue = scale = viewer.zoomScale - viewerOptions.zoomRate;
            } else if (scale === "auto") {
                viewer._allowResize = true;
                scaleValue = viewer._autoZoomScale;
            } else if (typeof scale === "string" && !kendo.parseFloat(scale)) {
                zoomLevelType = scale;
            } else if (scale && scale.toString().match(/^[0-9]+%?$/)) {
                scale = parseInt(scale.replace('%', ''), 10) / 100;
                scaleValue = scale;
            } else {
                preventZoom = isNaN(scale);
            }

            if (!preventZoom) {
                preventZoom = scale < viewerOptions.zoomMin || scale > viewerOptions.zoomMax;
            }

            if (preventZoom || viewer.trigger(ZOOMSTART, { scale: scale })) {
                return;
            }

            if (options.updateComboBox && viewer.toolbar)
            {
                viewer._updateZoomComboBox(scale);
            }

            return { zoomLevel: scaleValue, zoomLevelType: zoomLevelType };
        },

        _triggerZoomEnd: function(scale) {
            var that = this,
                viewer = that.viewer;

            viewer.trigger(ZOOMEND, { scale: scale });
        }
    });

    var PrintCommand = Command.extend({
        init: function(options) {
            Command.fn.init.call(this, options);
        },
        exec: function() {
            const that = this;

             if (!that.viewer.document) {
                that.viewer._triggerError({
                    message: this.errorMessages.notFound
                });
                return;
            }

            progress(that.viewer.pageContainerWrapper, true);
            // Used to ensure that loading indicator appears before the browser hangs.
            setTimeout(() => {
               that.viewer.pdfViewerCommon.printFile();
            }, 100);
        }
    });

    const AnnotationsCommand = Command.extend({
        init: function(options) {
            Command.fn.init.call(this, options);
        },
        exec: function() {
            const viewer = this.viewer;
            if (viewer.annotationsToolbar) {
                viewer.annotationsToolbar.destroy();
            } else {
                viewer.annotationsToolbar = new AnnotationToolbar(viewer);
            }
        }
    });

    extend(kendo.pdfviewer, {
        OpenCommand: OpenCommand,
        PageChangeCommand: PageChangeCommand,
        DownloadCommand: DownloadCommand,
        EnableSelectionCommand: EnableSelectionCommand,
        EnablePanCommand: EnablePanCommand,
        ExportCommand: ExportCommand,
        PrintCommand: PrintCommand,
        OpenSearchCommand: OpenSearchCommand,
        ZoomCommand: ZoomCommand,
        AnnotationsCommand: AnnotationsCommand
    });

})(window.kendo.jQuery);

(function($, undefined$1) {
    var kendo = window.kendo,
        encode = kendo.htmlEncode,
        extend = $.extend,
        Class = kendo.Class,
        Draggable = kendo.ui.Draggable,
        outerWidth = kendo._outerWidth,
        EXTENSIONS = {
            svg: ".svg",
            png: ".png"
        },
        keys = kendo.keys;

    var ErrorDialog = Class.extend({
        init: function(options) {
            this.options = extend(options, {
                actions: [{
                    text: options.messages.dialogs.okText
                }]
            });
            this._dialog = $("<div />")
                    .kendoDialog(this.options)
                    .getKendoDialog();
        },
        open: function() {
            this._dialog.center().open();
        }
    });

    var ExportAsDialog = Class.extend({
        init: function(options) {
            this.options = extend(options, this.options, {
                fileFormats: [{
                    description: options.messages.dialogs.exportAsDialog.png,
                    extension: EXTENSIONS.png
                }, {
                    description: options.messages.dialogs.exportAsDialog.svg,
                    extension: EXTENSIONS.svg
                }],
                title: options.messages.dialogs.exportAsDialog.title,
                open: function() {
                    this.center();
                }
            });
            this._initializeDialog();
            return this;
        },
        options: {
            extension: EXTENSIONS.png,
            autoFocus: true,
            resizable: false,
            modal: {
                preventScroll: true
            },
            width: "90%",
            maxWidth: 520,
            template: ({ messages, total }) =>
                `<div class='k-edit-label'><label>${encode(messages.exportAsDialog.labels.fileName)}:</label></div>` +
                "<div class='k-edit-field'>" +
                    "<span class='k-textbox k-input k-input-md k-rounded-md k-input-solid'><input class='k-input-inner' data-bind='value: name' /></span>" +
                "</div>" +
                "<div>" +
                    `<div class='k-edit-label'><label>${encode(messages.exportAsDialog.labels.saveAsType)}:</label></div>` +
                    "<div class='k-edit-field'>" +
                    "<select data-role='dropdownlist' class='k-file-format' " +
                        "data-text-field='description' " +
                        "data-value-field='extension' " +
                        "data-bind='value: extension, source: fileFormats'></select>" +
                    "</div>" +
                "</div>" +
                `<div class='k-edit-label'><label>${encode(messages.exportAsDialog.labels.page)}:</label></div>` +
                "<div class='k-edit-field'>" +
                    `<input data-role='numerictextbox' data-format='n0' data-min='1' data-max='${encode(total)}' data-bind='value: page' />` +
                "</div>" +
                "<div class='k-actions'>" +
                    `<button class='k-button k-button-md k-rounded-md k-button-solid k-button-solid-primary' data-bind='click: apply'><span class='k-button-text'>${encode(messages.save)}</span></button>` +
                    `<button class='k-button k-button-md k-rounded-md k-button-solid k-button-solid-base' data-bind='click: close'><span class='k-button-text'>${encode(messages.cancel)}</span></button>` +
                "</div>"
        },
        _updateModel: function(options) {
            if (options.pagesCount) {
                this.viewModel.set("pagesCount", options.pagesCount);
            }
            if (options.page) {
                this.viewModel.set("page", options.page);
            }
        },
        _initializeDialog: function() {
            var that = this;
            var options = that.options;
            var dialogMessages = options.messages.dialogs;
            var dialog = $("<div class='k-pdf-viewer-window k-action-window k-popup-edit-form' />")
                    .append(kendo.template(options.template)({
                        total: options.pagesCount,
                        messages: dialogMessages
                    }))
                    .kendoWindow(options)
                    .getKendoWindow();

            that.viewModel = kendo.observable({
                title: dialogMessages.exportAsDialog.title,
                name: dialogMessages.exportAsDialog.defaultFileName,
                extension: options.extension,
                fileFormats: options.fileFormats,
                pagesCount: options.pagesCount,
                page: 1,
                apply: that.apply.bind(this),
                close: function() {
                    dialog.close();
                }
            });

            that._dialog = dialog;

            kendo.bind(dialog.element, that.viewModel);
            return dialog;
        },
        open: function() {
            this._dialog.center().open();
        },
        apply: function() {
            this._dialog.close();
            this.options.apply({
                fileName: this.viewModel.name + this.viewModel.extension,
                extension: this.viewModel.extension,
                page: this.viewModel.page
            });
        }
    });

    var SearchDialog = Class.extend({
        init: function(options) {
            var that = this;
            that.options = extend({}, options, that.options);
        },
        options: {
            resizable: false,
            template: ({ messages }) => '<div class="k-search-panel k-pos-sticky k-top-center">' +
                          `<button aria-label='${encode(messages.dragHandle)}' class='k-button k-button-md k-rounded-md k-button-flat k-button-flat-base k-icon-button k-search-dialog-draghandle'>${kendo.ui.icon({ icon: "handle-drag", iconClass: "k-button-icon" })}</button>` +
                          "<span class='k-textbox k-input k-input-md k-rounded-md k-input-solid'>" +
                              `<input class='k-search-dialog-input k-input-inner' data-bind='value: boundValue, events: { keyup: onKeyup, input: onInput }' aria-label='${encode( messages.inputLabel)}' title='${encode(messages.inputLabel)}' />` +
                              `<span class='k-input-suffix'><button class='k-button k-button-md k-rounded-md k-button-flat k-button-flat-base k-icon-button k-match-case-button k-match-case-button' data-bind='css: {k-selected: matchCase}, click: matchCaseClick' aria-label='${encode(messages.matchCase)}' title='${encode(messages.matchCase)}'>${kendo.ui.icon({ icon: "convert-lowercase", iconClass: "k-button-icon" })}</button></span>` +
                          "</span>" +
                          `<span class='k-search-matches'><span data-bind='text: matchIndex'></span> ${encode(messages.of)} <span data-bind='text: matches'></span></span>` +
                          `<button class='k-button k-button-md k-rounded-md k-button-flat k-button-flat-base k-icon-button' data-bind='click: prev' aria-label='${encode(messages.previous)}' title='${encode(messages.previous)}'>${kendo.ui.icon({ icon: "arrow-up", iconClass: "k-button-icon" })}</button>` +
                          `<button class='k-button k-button-md k-rounded-md k-button-flat k-button-flat-base k-icon-button' data-bind='click: next' aria-label='${encode(messages.next)}' title='${encode(messages.next)}'>${kendo.ui.icon({ icon: "arrow-down", iconClass: "k-button-icon" })}</button>` +
                          `<button class='k-button k-button-md k-rounded-md k-button-flat k-button-flat-base k-icon-button' data-bind='click: close' aria-label='${encode(messages.close)}' title='${encode(messages.close)}'>${kendo.ui.icon({ icon: "x", iconClass: "k-button-icon" })}</button>` +
                      "</div>"
        },
        open: function() {
            var that = this;

            if (!that.dialog) {
                that._initializeDialog();
            }

            that.options.open();
            that._showSearchDialog();
        },
        close: function() {
            var that = this;
            that.options.close();
            that._hideSearchDialog();
        },
        _showSearchDialog: function() {
            var that = this;

            that.dialog.css("left",`${(that.options.pageContainer.innerWidth() / 2) - (outerWidth(that.dialog, true) / 2)}px`);

            that.dialog.kendoStop().kendoAnimate({
                effects: { zoom: { direction: "in" }, fade: { direction: "in" } },
                duration: 350,
                complete: function(ev) {
                    that.dialog.find(".k-search-dialog-input").trigger("focus");
                }
            });
        },
        _hideSearchDialog: function() {
            var that = this;

            that.dialog.kendoStop().kendoAnimate({
                effects: { zoom: { direction: "out", properties: { scale: 0.7 } }, fade: { direction: "out" } },
                duration: 350,
                hide: true
            });
        },
        _initializeDialog: function() {
            var that = this;
            var template = kendo.template(that.options.template);
            var dialogElm = $(template({
                messages: that.options.messages
            }));

            that.options.pageContainer.prepend(dialogElm);
            that.dialog = dialogElm;

            that._draggable = new Draggable(dialogElm, {
                filter: ".k-search-dialog-draghandle",
                axis: "x",
                dragstart: function(e) {
                    var wnd = that.dialog;
                    var containment = that.options.pageContainer;

                    wnd.startPosition = {
                        left: e.x.client - kendo.getOffset(wnd, "position").left,
                    };

                    if (!containment) {
                        return null;
                    }

                    containment._innerWidth = containment.innerWidth();

                    if (parseInt(containment._innerWidth, 10) > containment[0].clientWidth) {
                        containment._innerWidth -= kendo.support.scrollbar();
                    }

                    wnd.maxLeft = containment._innerWidth - outerWidth(wnd, true);
                },
                drag: function(e) {
                    var wnd = that.dialog;
                    var position = {};
                    var left;

                    left = e.x.client - wnd.startPosition.left;

                    if (left && isNaN(left) && left.toString().indexOf("px") < 0) {
                        position.left = left;
                    } else {
                        position.left = Math.max(
                            Math.min(parseInt(left, 10), parseInt(wnd.maxLeft, 10)),
                            0
                        );
                    }

                    wnd.css(position);
                },
            });

            that._draggable.userEvents.stopPropagation = false;

            that.searchModel = kendo.observable({
                boundValue: "",
                searchText: "",
                matchCase: false,
                matchIndex: 0,
                matches: 0,
                matchCaseClick: function() {
                    this.set("matchCase", !this.matchCase);
                },
                next: that.options.next,
                prev: that.options.prev,
                close: function() {
                    this.set("boundValue", "");
                    that.close();
                },
                onKeyup: function(ev) {
                    var key = ev.keyCode;
                    var navigationFn = ev.shiftKey ? this.prev : this.next;

                    if (key === keys.ENTER) {
                        navigationFn();
                        ev.preventDefault();
                    } else if (key == keys.ESC) {
                        this.close();
                    }
                },
                onInput: function(ev) {
                    this.set("searchText", ev.target.value);
                }
            });

            kendo.bind(dialogElm, that.searchModel);
        }
    });

    extend(kendo.pdfviewer, {
        dialogs: {
            ErrorDialog: ErrorDialog,
            ExportAsDialog: ExportAsDialog,
            SearchDialog: SearchDialog
        }
    });
})(window.kendo.jQuery);

const $ = jQuery;

class AnnotationPopup {
    constructor(viewer, anchor, editor) {
        this.viewer = viewer;
        this.widget = viewer.pdfViewerCommon;
        this.anchor = anchor;
        this.editor = editor;
        this.popupOpenHandler = this.onPopupOpen.bind(this);
        this.init();
    }

    init() {
        const anchor = this.anchor;
        const annotationPopupToolbarElement = $(`<div data-uid="${kendo.guid()}"></div>`);

        this.popup = new kendo.ui.Popup($(`<div class="k-pdf-viewer-annotation-editor-toolbar"></div>`), {
            anchor: anchor
        });

        this.popup.element.html(annotationPopupToolbarElement);
        const popupToolbar =
            this.popupToolbar =
            new kendo.ui.ToolBar(annotationPopupToolbarElement, {
                fillMode: "flat",
                tools: [
                    { name: "palette", command: "palette", icon: "palette", type: "button", showText: "overflow", fillMode: "flat" },
                    { name: "remove", command: "remove", icon: "trash", type: "button", showText: "overflow", fillMode: "flat" },
                ],
                parentMessages: {
                    palette: "Palette",
                    remove: "Remove"
                }
            });

        popupToolbar.bind("click", this.onAnnotationPopupToolbarClick.bind(this));

        this.popup.open();
    }

    initEditor() {
    }

    onAnnotationPopupToolbarClick(e) {
        const widget = this.widget;
        const target = $(e.target);
        const command = target.data("command");

        switch (command) {
            case "palette":
                this.initEditor();
                break;
            case "remove":
                deleteAnnotation(widget);
                this.destroyPopup();
                break;
        }
    }

    onPopupOpen() {
        this.flatColorPicker._view._hueSlider.resize();
        this.flatColorPicker._view._opacitySlider.resize();
    }

    anchorExists() {
        return document.getElementById(this.anchor.id);
    }

    destroyPopup() {
        if (this.popup) {
            this.popup.destroy();
            this.popup = null;
        }
    }

    destroyEditor() {
        if (this.editorPopup) {
            this.editorPopup.destroy();
            this.editorPopup = null;
        }
    }

    destroy() {
        if (this.popupToolbar) {
            this.popupToolbar.unbind("click");
            this.popupToolbar.unbind("toggle");
            this.popupToolbar.destroy();
            this.popupToolbar = null;
        }

        this.destroyPopup();
    }
}

class HighlightAnnotationPopup extends AnnotationPopup {
    constructor(viewer, anchor, editor) {
        super(viewer, anchor, editor);
    }

    initEditor() {
        const anchor = this.anchor;

        if (!this.anchorExists()) {
            this.destroy();
            return;
        }

        this.destroyEditor();

        this.editorPopup = new kendo.ui.Popup($(`
            <div class="k-pdf-viewer-annotation-editor">
                <span class="k-column-menu-group-header">
                    <span class="k-column-menu-group-header-text">Color</span>
                </span>
                <div ref-annotation-editor-flat-color-picker></div>
            </div>
`), {
            anchor: anchor,
            activate: this.popupOpenHandler
        });

        this.initFlatColorPicker();

        this.editorPopup.open();

        this.destroy();
    }

    initFlatColorPicker() {
        this.flatColorPicker = new kendo.ui.FlatColorPicker(this.editorPopup.element.find("[ref-annotation-editor-flat-color-picker]"), {
            format: "rgb",
            opacity: true,
            change: (e) => setHighlightTextColor(this.widget, e.value)
        });
    }

    onPopupOpen() {
        const currentColor = this.editor.color;

        super.onPopupOpen();
        this.flatColorPicker.value(currentColor);
    }
}

class FreeTextAnnotationPopup extends AnnotationPopup {
    constructor(viewer, anchor, editor) {
        super(viewer, anchor, editor);
    }

    initEditor() {
        const anchor = this.anchor;

        if (!this.anchorExists()) {
            this.destroy();
            return;
        }

        this.destroyEditor();

        this.editorPopup = new kendo.ui.Popup($(`
            <div class="k-pdf-viewer-annotation-editor">
                <span class="k-column-menu-group-header">
                        <span class="k-column-menu-group-header-text">Text style</span>
                    </span>
                    <form ref-annotation-text-editor-popup-form></form>
                <span class="k-column-menu-group-header">
                    <span class="k-column-menu-group-header-text">Color</span>
                </span>
                <div ref-annotation-editor-flat-color-picker></div>
            </div>
`), {
            anchor: anchor,
            activate: this.popupOpenHandler
        });

        this.initFontSizeForm();
        this.initFlatColorPicker();

        this.editorPopup.open();

        this.destroy();
    }

    initFontSizeForm() {
        const currentFontSize = this.editor.propertiesToUpdate[0][1];
        const fontSizeList = [8, 9, 10, 11, 12, 13, 14, 16, 20, 22, 24, 26, 28, 36, 48, 72];

        this.fontSizeForm = new kendo.ui.Form($("[ref-annotation-text-editor-popup-form]"), {
            buttonsTemplate: () => "",
            formData: {
                fontSize: currentFontSize
            },
            layout: "grid",
            grid: {
                cols: 3
            },
            items: [
                {
                    field: "fontSize",
                    label: "Font size",
                    editor: "DropDownList",
                    colSpan: 1,
                    editorOptions: {
                        fillMode: "flat",
                        dataSource: fontSizeList,
                        change: (e) => {
                            const value = e.sender.value();
                            setFreeTextFontSize(this.widget, value);
                        }
                    }
                }
            ]
        });

        this.fontSizeForm.element.find(".k-form-buttons").remove();
    }

    initFlatColorPicker() {
        this.flatColorPicker = new kendo.ui.FlatColorPicker(this.editorPopup.element.find("[ref-annotation-editor-flat-color-picker]"), {
            format: "rgb",
            opacity: true,
            change: (e) => setFreeTextFontColor(this.widget, e.value)
        });
    }

    onPopupOpen() {
        const currentColor = this.editor.propertiesToUpdate[1][1];

        super.onPopupOpen();
        this.flatColorPicker.value(currentColor);
    }
}

const __meta__ = {
    id: "pdfviewer",
    name: "PDFViewer",
    category: "web",
    description: "PDFViewer to display pdfs in the browser",
    depends: ["core", "window", "dialog", "toolbar", "draganddrop", "upload", "combobox", "drawing", "binder", "dropdownlist", "numerictextbox", "textbox", "pager", "form", "colorpicker"]
};

(function($, undefined$1) {
    var NS = ".kendoPDFViewer",
        kendo = window.kendo,
        ui = kendo.ui,
        extend = $.extend,
        drawing = kendo.drawing,
        keys = $.extend({ PLUS: 187, MINUS: 189, ZERO: 48, NUMPAD_ZERO: 96 }, kendo.keys),
        Page,
        BlankPage = kendo.pdfviewer.BlankPage,
        Widget = ui.Widget,
        progress = kendo.ui.progress,
        SCROLL = "scroll",
        RENDER = "render",
        OPEN = "open",
        ERROR = "error",
        KEYDOWN = "keydown" + NS,
        UPDATE = "update",
        PAGE_CHANGE = "pagechange",
        ZOOMSTART = "zoomStart",
        ZOOMEND = "zoomEnd",
        ZOOMCOMMAND = "ZoomCommand",
        WHITECOLOR = "#ffffff",
        TABINDEX = "tabindex",
        CLICK = "click",
        CHANGE = "change",
        TOGGLE = "toggle",
        DISABLED = 'k-disabled',
        PROCESSORS = {
            pdfjs: "pdfjs",
            dpl: "dpl"
        },
        styles = {
            viewer: "k-pdf-viewer",
            scroller: "k-canvas k-pdf-viewer-canvas k-pos-relative k-overflow-auto",
            enablePanning: "k-enable-panning"},
        PREDEFINED_ZOOM_VALUES = {
            auto: "auto",
            actual: "ActualWidth",
            fitToWidth: "FitToWidth",
            fitToPage: "FitToPage"
        };

    var PDFViewer = Widget.extend({
        init: function(element, options) {
            var that = this;

            Widget.fn.init.call(that, element, kendo.deepExtend({}, this.options, options));

            that._processMessages();

            that._wrapper();

            if (that.options.toolbar) {
                that._renderToolbar();
            }

            that._initProcessor(options || {});
            that._renderPageContainer();

            if (that._isDPLProcessor()) {
                that._loadDPLDocument();
            } else {
                that._loadPdfJSDocument();
            }

            kendo.notify(that, kendo.ui);

            if (that._showWatermarkOverlay) {
                that._showWatermarkOverlay(that.wrapper[0]);
            }
        },

        events: [
            RENDER,
            OPEN,
            ERROR,
            ZOOMSTART,
            ZOOMEND
        ],

        options: {
            name: "PDFViewer",
            view: {
                type: "canvas"
            },
            pdfjsProcessing: {
                file: null,
                renderForms: false,
                loadOnDemand: true
            },
            dplProcessing: {
                read: {
                    url: null,
                    type: "GET",
                    dataType: "json",
                    pageField: "pageNumber"
                },
                upload: {
                    url: null,
                    saveField: "file"
                },
                download: {
                    url: null
                },
                loadOnDemand: false
            },
            toolbar: {
                items: [],
                contextMenu: false
            },
            width: 1000,
            height: 1200,
            page: 1,
            defaultPageSize: {
                width: 794,
                height: 1123
            },
            scale: null,
            zoomMin: 0.5,
            zoomMax: 4,
            zoomRate: 0.25,
            messages: {
                defaultFileName: "Document",
                toolbar: {
                    zoom: {
                        zoomLevel: "zoom level",
                        zoomOut: "Zoom Out",
                        zoomIn: "Zoom In",
                        actualWidth: "Actual Width",
                        autoWidth: "Automatic Width",
                        fitToWidth: "Fit to Width",
                        fitToPage: "Fit to Page"
                    },
                    contextMenu: "Menu",
                    open: "Open",
                    exportAs: "Export",
                    download: "Download",
                    print: "Print",
                    toggleSelection: "Enable Selection",
                    togglePan: "Enable Panning",
                    search: "Search",
                    annotations: "Annotations"
                },
                errorMessages: {
                    notSupported: "Only pdf files allowed.",
                    parseError: "PDF file fails to process.",
                    notFound: "File is not found.",
                    popupBlocked: "Popup is blocked."
                },
                dialogs: {
                    exportAsDialog: {
                        title: "Export...",
                        defaultFileName: "Document",
                        pdf: "Portable Document Format (.pdf)",
                        png: "Portable Network Graphics (.png)",
                        svg: "Scalable Vector Graphics (.svg)",
                        labels: {
                            fileName: "File name",
                            saveAsType: "Save as",
                            page: "Page"
                        }
                    },
                    okText: "OK",
                    save: "Save",
                    cancel: "Cancel",
                    search: {
                        inputLabel: "Search Text",
                        matchCase: "Match Case",
                        next: "Next Match",
                        previous: "Previous Match",
                        close: "Close",
                        of: "of",
                        dragHandle: "Drag search"
                    }
                }
            }
        },

        defaultTools: {
            contextMenu: {
                type: "dropDownButton",
                name: "contextMenu",
                showText: "overflow",
                id: "pdfviewer-toolbar-context-menu",
                overflow: "never",
                icon: "menu",
                fillMode: "flat",
                menuButtons: [
                    { id: "open", text: "Open", icon: "folder-open", attributes: { "data-command": "OpenCommand" } },
                    { id: "download", text: "Download", icon: "download", attributes: { "data-command": "DownloadCommand" }, enable: false },
                    { id: "print", text: "Print", icon: "print", attributes: { "data-command": "PrintCommand" }, enable: false }
                ]
            },
            separator: { type: "separator" },
            pager: {
                type: "component",
                name: "pager",
                overflow: "never",
                component: "Pager",
                element: '<div></div>',
                componentOptions: {
                    navigatable: true,
                    _isToolbarItem: true,
                }
            },
            spacer: { type: "spacer" },
            zoomInOut: {
                type: "buttonGroup",
                fillMode: "flat",
                buttons: [
                    { type: "button", icon: "zoom-out", name: "zoomOut", command: "ZoomCommand", showText: "overflow", options: "{ \"zoomOut\": true, \"updateComboBox\": true }", fillMode: "flat" },
                    { type: "button", icon: "zoom-in", name: "zoomIn", command: "ZoomCommand", showText: "overflow", options: "{ \"zoomIn\": true, \"updateComboBox\": true }", fillMode: "flat" },
                ]
            },
            zoom: {
                type: "component",
                name: "zoom",
                command: "ZoomCommand",
                overflow: "never",
                component: "ComboBox",
                data: [50, 100, 150, 200, 300, 400],
                componentOptions: {
                    enable: false,
                    dataTextField: "text",
                    dataValueField: "percent",
                    valuePrimitive: true,
                    clearOnEscape: false,
                    commandOn: "change",
                    fillMode: 'flat',
                }
            },
            toggleSelection: {
                type: "buttonGroup",
                fillMode: "flat",
                buttons: [
                    {
                        togglable: true,
                        command: "EnableSelectionCommand",
                        icon: "pointer",
                        showText: "overflow",
                        name: "toggleSelection",
                        group: "toggle-pan",
                        fillMode: "flat"
                    }, {
                        togglable: true,
                        command: "EnablePanCommand",
                        icon: "hand",
                        showText: "overflow",
                        name: "togglePan",
                        group: "toggle-pan",
                        selected: true,
                        fillMode: "flat"
                    }
                ]
            },
            spacer2: { type: "spacer" },
            search: {
                type: "button",
                command: "OpenSearchCommand",
                icon: "search",
                name: "search",
                showText: "overflow",
                enable: false,
                fillMode: "flat"
            },
            open: {
                type: "button",
                showText: "overflow",
                name: "open",
                icon: "folder-open",
                command: "OpenCommand",
                fillMode: "flat"
            },
            download: {
                type: "button",
                showText: "overflow",
                name: "download",
                icon: "download",
                command: "DownloadCommand",
                enable: false,
                fillMode: "flat"
            },
            print: {
                type: "button",
                showText: "overflow",
                name: "print",
                icon: "print",
                command: "PrintCommand",
                enable: false,
                fillMode: "flat"
            },
            annotations: {
                togglable: true,
                type: "button",
                showText: "overflow",
                name: "annotations",
                icon: "edit-annotations",
                command: "AnnotationsCommand",
                enable: false,
                fillMode: "flat"
            }
        },

        exportAsTool: {
            exportAs: { type: "button", showText: "overflow", name: "exportAs", icon: "image-export", command: "ExportCommand", fillMode: "flat" }
        },


        _processMessages: function() {
            var messages = this.options.messages.toolbar,
                zoom = messages.zoom;

            if ($.isPlainObject(zoom)) {
                this.options.messages.toolbar = $.extend({}, this.options.messages.toolbar, zoom);
                this.options.messages.toolbar.zoom = zoom.zoomLevel || this.options.messages.toolbar.zoom;
            }
        },

        _wrapper: function() {
            var that = this,
                options = that.options;

            that.wrapper = that.element;

            that.wrapper
                    .width(options.width)
                    .height(options.height)
                    .addClass(styles.viewer)
                    .on(KEYDOWN, that._keydown.bind(that));

            that._allowResize = that.options.scale === null;
            that._autoZoomScale = DEFAULT_ZOOM_LEVEL;
            that.zoomScale = that.options.scale || that._autoZoomScale;

            that._resizeHandler = kendo.onResize(function() {
                that.resize();
            });

            that._pageNum = that.options.page;
        },

        _keydown: function(e) {
            var plusShortcuts = [keys.PLUS, keys.NUMPAD_PLUS],
                minusShortcuts = [keys.MINUS, keys.NUMPAD_MINUS],
                zeroShortcuts = [keys.ZERO, keys.NUMPAD_ZERO],
                shouldExecute = false,
                args = {
                    command: ZOOMCOMMAND,
                    options: { updateComboBox: true }
                };

            if (!e.ctrlKey || this._blankPage || this.processingLib === PROCESSORS.dpl) {
                return;
            }

            if (plusShortcuts.includes(e.keyCode)) {
                args.options.zoomIn = true;
                shouldExecute = true;
            } else if (minusShortcuts.includes(e.keyCode)) {
                args.options.zoomOut = true;
                shouldExecute = true;
            } else if (zeroShortcuts.includes(e.keyCode)) {
                args.options.value = DEFAULT_ZOOM_LEVEL;
                shouldExecute = true;
            }

            if (shouldExecute) {
                this.execute(args);
                e.preventDefault();
            }
        },

        _handlePageChangeEvent: function(event) {
            const that = this;

            if (!that._pageChangeFromScroll) {
                this.activatePage(event.index, false);
                that._showPagerInputLabels();
            }

            delete that._pageChangeFromScroll;
        },

        _showPagerInputLabels: function() {
            const that = this;
            const inputElements = that.pager.element.find(".k-pager-input").children();
            if (inputElements) {
                const labels = inputElements.eq(0).add(inputElements.eq(2));

                if (!$(labels).is(":visible")) {
                    labels.show();
                }
            }
        },

        _resizePager: function() {
            const that = this;

            if (!that.pager || !that.pager.options.responsive) {
                return;
            }

            const pagerWidth = kendo._outerWidth(that.pager.element);
            const visibleToolbarItems = Array.from(that.toolbar.element.children(':not(.k-hidden):not(:has(.k-pager))'));
            const containerWidth = kendo._outerWidth(that.element);

            let visibleToolsWidth = 0;

            const pattern = /(em|ex|%|px|cm|mm|in|pt|pc|ch|rem|vh|vw|vmin|vmax)$/;
            const gap = Number(that.toolbar.element.css("gap").replace(pattern,''));

            if (visibleToolbarItems.length > 0) {
                let temp = 0;
                for (let i = 0; i < visibleToolbarItems.length; i++) {
                    temp += kendo._outerWidth(visibleToolbarItems[i]) + gap;
                }
                if (temp) {
                    visibleToolsWidth = temp;
                }
            }

            const elementsToShrink = that.pager.element.find(".k-pager-nav");

            if ((pagerWidth + visibleToolsWidth + gap) > containerWidth) {

                for (var i = elementsToShrink.length - 1; i >= 0; i--) {
                    const element = elementsToShrink.eq(i);
                        element.addClass("k-hidden");
                }
            }

            if ((pagerWidth + visibleToolsWidth + gap) < containerWidth) {
                const hidden = that.pager.element.find(".k-hidden:not(.k-input-validation-icon)");

                for (var i = 0; i < hidden.length; i++) {
                    const hiddenElement = hidden.eq(i);

                    hiddenElement.removeClass('k-hidden');
                }
            }

            if (that.pager.options.input) {
                that._showPagerInputLabels();
            }
        },

        _initProcessor: function(options) {
            var that = this,
                processingOptions;

            processingOptions = options.dplProcessing ? that.options.dplProcessing : that.options.pdfjsProcessing;
            that.processingLib = options.dplProcessing ? PROCESSORS.dpl : PROCESSORS.pdfjs;

            if (that._isDPLProcessor()) {
                that.processor = new kendo.pdfviewer[that.processingLib].processor(processingOptions, that);
                Page = kendo.pdfviewer[that.processingLib].Page;
            } else {
                isLoaded();
            }
        },

        _isDPLProcessor: function() {
            return this.processingLib === PROCESSORS.dpl;
        },

        _hasPagerTool: function(tools) {
            let hasPager = false;
            let index;

            for (let i = 0; i < tools.length; i++) {
                const tool = tools[i];
                if (typeof tool === 'string') {
                    hasPager = tool.toLowerCase() === 'pager';
                    index = i;
                } else {
                    if (tool.type) {
                        hasPager = tool.type.toLowerCase() === 'pager';
                        index = i;
                    } else if (tool.name) {
                        hasPager = tool.name.toLowerCase() === 'pager';
                        if (hasPager) {
                            delete tool.name;
                        }
                        index = i;
                    }
                }

                if (hasPager) {
                    break;
                }
            }

            return {
                hasPager,
                index
            };
        },

        _renderToolbar: function() {
            var that = this,
                options = that.options,
                toolbarOptions = extend({}, options.toolbar),
                tools = toolbarOptions.items && toolbarOptions.items.length ? toolbarOptions.items : Object.keys(that.defaultTools);

            if (that.options.pdfjsProcessing.renderForms && !toolbarOptions.items.length) {
                const [enableSelection, enablePan] = [...that.defaultTools["toggleSelection"].buttons];

                enableSelection.selected = true;
                enablePan.selected = false;
            }

            const { hasPager, index } = that._hasPagerTool(tools);


            tools = that._processTools(tools);

            if (hasPager) {
                let pagerMessages = that.options.messages.toolbar.pager;

                if (pagerMessages) {
                    if (pagerMessages.of) {
                        pagerMessages.of = `${pagerMessages.of} {0}`;
                        if (pagerMessages.pages) {
                            pagerMessages.of = pagerMessages.of + ' ' + pagerMessages.pages;
                            delete pagerMessages.pages;
                        }
                    }
                }
                that.defaultTools.pager.componentOptions.messages = pagerMessages;
                options.messages.toolbar.pager = "Pager";

                const currentPagerOptions = that.defaultTools.pager.componentOptions;
                if (typeof tools[index] !== 'string') {
                    that.defaultTools.pager.componentOptions = $.extend(tools[index], currentPagerOptions);

                    tools[index] = that.defaultTools.pager;
                }
            }

            toolbarOptions = {
                defaultTools: $.extend({}, that.defaultTools, that.exportAsTool),
                parentMessages: options.messages.toolbar,
                tools: tools,
                resizable: true,
                fillMode: 'flat',
                overflow: toolbarOptions.overflow
            };

            var toolbarElement = $("<div />");

            toolbarElement.appendTo(that.element);
            that.toolbar = new kendo.ui.ToolBar(toolbarElement, toolbarOptions);
            that.options.toolbar = that.toolbar.options;

            that.toolbar.bind(TOGGLE, that._toolbarClick.bind(that));
            that.toolbar.bind(CLICK, that._toolbarClick.bind(that));
            that.toolbar.bind(CHANGE, that._toolbarClick.bind(that));

            // If the context menu is enabled, bind the click event to the items of the dropdown button as well.
            if (toolbarOptions.contextMenu) {
                that.toolbar.element.find('[data-role=dropdownbutton]').on(CLICK, that._toolbarClick.bind(that));
            }

            if (hasPager) {
                that.pager = that.toolbar.element.find('.k-pager');
                if (that.pager.length > 0) {
                    that.pager = that.pager.data('kendoPager');
                }
                that.pager.bind(CHANGE, that._handlePageChangeEvent.bind(that));
            }

            that.bind({
                update: that._updateToolbar.bind(that)
            });

            return that.toolbar;
        },

        _processTools: function(tools) {
            var that = this,
                toolbar = that.options.toolbar,
                messages = that.options.messages.toolbar;

            tools = tools.flatMap(t => {
                if (t === "zoom") {
                    t = that.defaultTools.zoom;
                }

                if (t.name === "zoom") {
                    t = $.extend({}, that.defaultTools.zoom, t);

                    var zoomLevels = [{
                        percent: PREDEFINED_ZOOM_VALUES.auto,
                        text: messages.autoWidth
                    }, {
                        percent: PREDEFINED_ZOOM_VALUES.actual,
                        text: messages.actualWidth
                    }, {
                        percent: PREDEFINED_ZOOM_VALUES.fitToWidth,
                        text: messages.fitToWidth
                    }, {
                        percent: PREDEFINED_ZOOM_VALUES.fitToPage,
                        text: messages.fitToPage
                    }];

                    // eslint-disable-next-line
                    var comboOptions = t.data.map(i => { return { percent: i, text: i + "%" } });
                    var value = that.options.scale ? that.options.scale * 100 + "%" : "auto";

                    zoomLevels = zoomLevels.concat(comboOptions);
                    t.componentOptions.dataSource = zoomLevels;
                    t.componentOptions.value = value;
                }

                return t;
            });

            if (!toolbar.contextMenu) {
                // If the option is not enabled we don't want to render the context menu button and the separator.
                const contextMenuIndex = tools.findIndex(t => t === "contextMenu");
                if (contextMenuIndex !== -1) {
                    tools.splice(contextMenuIndex, 1);
                }

                const separatorIndex = tools.findIndex(t => t === "separator");
                if (separatorIndex !== -1) {
                    tools.splice(separatorIndex, 1);
                }
            } else {
                // If it is enabled, we don't want the open, download and print buttons to be rendered.
                tools = tools.filter(t => t !== "open" && t !== "download" && t !== "print");
            }

            return tools;
        },

        _updateToolbar: function(e) {
            var pageOptions = {
                    page: e.page || 1,
                    total: e.total || 1
                },
                toolbar = this.toolbar,
                toolbarEl = toolbar.element,
                zoomCombo = toolbarEl.find("[data-command=ZoomCommand][data-role=combobox]").data("kendoComboBox"),
                toFocus = toolbarEl.find(".k-focus");

            if (toFocus.length === 0) {
                toFocus = toolbarEl.find("[tabindex=0]").first();

                if (toFocus.length === 0) {
                    toFocus = toolbar._getAllItems().first();
                }
            }

            if (zoomCombo) {
                zoomCombo.enable(!e.isBlank);
                if (e.action === "zoom") {
                    this._updateZoomComboBox(e.zoom);
                }
            }

            if (((e.action === "pagechange" && e.updatePager !== false) || e.isBlank) && this.pager) {
                if (e.updatePager) {
                    pageOptions.updatePager = true;
                }

                if (e.pageChangeFromScroll) {
                    pageOptions.pageChangeFromScroll = true;
                }

                this._updatePager(pageOptions);
            }

            this._updateOnBlank(e.isBlank);

            toolbar._resetTabIndex(toFocus);
        },

        _updateOnBlank: function(isBlank) {
            const toolbar = this.toolbar,
                toolbarEl = toolbar.element;

            const contextMenu = $("#pdfviewer-toolbar-context-menu_buttonmenu");
            let downloadButton = toolbarEl.find("[data-command='DownloadCommand']");
            let printButton = toolbarEl.find("[data-command='PrintCommand']");

            if (contextMenu.length) {
                downloadButton = contextMenu.find("[data-command='DownloadCommand']");
                printButton = contextMenu.find("[data-command='PrintCommand']");
            }

            toolbar.enable(toolbarEl.find("[data-command=EnableSelectionCommand]").parent(), !isBlank);
            toolbar.enable(toolbarEl.find("[data-command=ZoomCommand][role=button]").parent(), !isBlank);

            toolbar.enable(toolbarEl.find("[data-command='OpenSearchCommand']"), !isBlank);
            toolbar.enable(downloadButton, !isBlank);
            toolbar.enable(printButton, !isBlank);
        },

        _updatePager: function(options) {
            const that = this;
            if (options.updatePager) {
                const isDPLProcessed = that.processingLib === 'dpl';

                const data = isDPLProcessed ? (that.document && that.document.pages ? that.document.pages : []) : that.pages ?? [];

                const pagerDataSource = new kendo.data.DataSource({
                data: data ?? [],
                pageSize: 1,
                page: options.page
            });
                that.pager.setDataSource(pagerDataSource);
                that._resizePager();
            } else {
                const current = that.pager.page();

                if (current !== options.page) {
                    if (options.pageChangeFromScroll) {
                        that._pageChangeFromScroll = true;
                    }
                    that.pager.page(options.page);
                }
            }
            that._showPagerInputLabels();
            that._togglePagerDisabledClass();
        },

        _togglePagerDisabledClass: function() {
            const that = this;
            const pager = that.pager;

            if (pager.totalPages() <= 1 ) {
                pager.element.addClass(DISABLED);
            } else if (pager.element.hasClass(DISABLED)) {
                pager.element.removeClass(DISABLED);
            }
        },

        _updateZoomComboBox: function(value) {
            var isPredefined = value === PREDEFINED_ZOOM_VALUES.auto ||
                value === PREDEFINED_ZOOM_VALUES.actual ||
                value === PREDEFINED_ZOOM_VALUES.fitToPage ||
                value === PREDEFINED_ZOOM_VALUES.fitToWidth,
                zoomCombo = this.toolbar.element.find("[data-command=ZoomCommand][data-role=combobox]").data("kendoComboBox");

            if (!isPredefined) {
                value = Math.round(value * 100) + '%';
            }

            if (zoomCombo) {
                zoomCombo.value(value);
            }
        },

        _toolbarClick: function(ev) {
            let target = $(ev.target),
                command = target.data("command"),
                options = target.data("options");

            if (!command && !options) {
                target = $(ev.currentTarget);
                command = target.data("command");
                options = target.data("options");
            }

            options = extend({}, { value: target.val() }, options);

            if (!command) {
                return;
            }

            this.execute({
                command: command,
                options: options
            });
        },

        _initErrorDialog: function(options) {
            var that = this;

            if (!that._errorDialog) {
                options = extend(options, {
                    messages: that.options.messages
                });
                var dialogInstance = new kendo.pdfviewer.dialogs.ErrorDialog(options);
                that._errorDialog = dialogInstance._dialog;
            }
            return that._errorDialog;
        },

        _renderPageContainer: function() {
            var that = this;

            if (!that.pageContainer) {
                that.pageContainerWrapper = $("<div />");
                that.pageContainerWrapper.addClass(styles.scroller);

                that.pageContainer = $(`<div class="k-pdf-viewer-pages" />`);
                that.pageContainer.attr(TABINDEX, 0);

                that.pageContainerWrapper.append(that.pageContainer);
                that.wrapper.append(that.pageContainerWrapper);
            }
        },

        _triggerError: function(options) {
            var dialog = this._initErrorDialog();
            extend(options, {
                dialog: dialog
            });
            if (this.pageContainer) {
                progress(this.pageContainer, false);
            }

            if (this.trigger(ERROR, options))
            {
                return;
            }

            dialog.open().content(options.message);
        },

        _renderPages: function() {
            var that = this,
                document = that.document,
                pagesData;

            that.pages = [];

            if (!document || !document.total) {
                that._renderBlankPage();
                return;
            }

            pagesData = document.pages;

            for (var i = 1; i <= document.total; i++) {
                var viewerPage,
                    pageData = {
                        processor: that.processor,
                        number: i
                    };

                if (pagesData && pagesData.length) {
                    pageData = extend(pageData, pagesData[i - 1]);
                }

                viewerPage = new Page(pageData, that);
                that.pages.push(viewerPage);
                that.pageContainer.append(viewerPage.element);
            }

            if (that.pdfScroller) {
                that.pdfScroller.enablePanEventsTracking();
            }

            that._attachContainerEvents();
            that._getVisiblePagesCount();
            that._updatePager({ updatePager: true });
        },

        _renderBlankPage: function() {
            this._blankPage = new BlankPage(this.options.defaultPageSize, this);

            this.pageContainer.append(this._blankPage.element);

            this._blankPage._initUpload();
            this.trigger(UPDATE, { isBlank: true });
        },

        _removeBlankPage: function() {
            if (this._blankPage) {
                this._blankPage.destroy();
                this._blankPage.element.remove();
                this._blankPage = null;
            }
        },

        _resize: function() {
            var that = this,
                containerWidth,
                ratio;

            if (!that._allowResize) {
                return;
            }

            if (!that.pages || !that.pages.length) {
                if (that._blankPage) {
                    ratio = containerWidth / that._blankPage.element.width();
                    that._blankPage.resize(ratio);
                }
                return;
            }

            if (that.toolbar) {
                that.toolbar.resize(true);
            }


            if (that._resizeHandler) {
                clearTimeout(that._resizeHandler);
            }
            that._resizeHandler = setTimeout(that._resizePages.bind(that), 100);
        },

        _resizePages: function() {
            const that = this,
                containerWidth = that.pageContainer[0].clientWidth,
                pagesElements = that.pdfViewerCommon?.getPagesElements();
            let ratio = 0;

            that.pages.forEach(function(page) {
                const pageWidth = page.element ? page.element.width() : $(pagesElements[page._pageIndex]).width();
                const currentRatio = containerWidth / pageWidth;

                if (currentRatio > ratio) {
                    ratio = currentRatio;
                }
            });


            if (that._autoFit) {
                that.zoom(that._autoFit, true);
                return;
            }

            ratio = Math.min(Math.max(ratio, that.options.zoomMin), DEFAULT_ZOOM_LEVEL);
            if (ratio != that.zoomScale) {
                that.zoom(ratio, true);
                that.zoomScale = ratio;
                that._allowResize = true;
            }

            if (that.pager && that.pager.element) {
                that._resizePager();
            }
        },

        _attachContainerEvents: function() {
            const that = this;

            that.pageContainer.addClass(styles.enablePanning);
            that.pageContainerWrapper.bind(SCROLL, that._scroll.bind(that));
        },

        _scroll: function(e) {
            var that = this,
                containerHeight = that.pageContainerWrapper.height(),
                total = that.pages.length,
                pageNum = that._pageNum,
                pageIndex = pageNum - 1,
                pageToLoadNum = pageNum,
                pageToLoad;

                if (that._preventScroll || !total) {
                    that._preventScroll = false;
                    return;
                }

                that._scrollingStarted = true;
                const nextPageIndex = currentPage(that.element[0]);
                that.pages[pageIndex];
                pageToLoadNum = pageNum + nextPageIndex - pageIndex;

                if (pageNum !== pageToLoadNum && pageToLoadNum >= 1 && pageToLoadNum <= total) {
                    pageToLoad = that.pages[pageToLoadNum - 1].element;

                    if (pageToLoad.offset().top > containerHeight) {
                        return;
                    }

                    that._pageNum = pageToLoadNum;
                    that._loadVisiblePages();

                    that.trigger(UPDATE, { action: PAGE_CHANGE, page: pageToLoadNum, total: total, pageChangeFromScroll: true });
                }
        },

        zoom: function(scale, preventComboBoxChange) {
            var that = this;

            if (that._isDPLProcessor()) {
                return;
            }

            if (!scale) {
                return that.zoomScale;
            }

            return that.execute({
                command: ZOOMCOMMAND,
                options: {
                    value: scale,
                    updateComboBox: !preventComboBoxChange
                }
            });
        },

        execute: function(options) {
            var commandOptions = extend({ viewer: this }, options.options);
            var command = new kendo.pdfviewer[options.command](commandOptions);
            return command.exec();
        },

        _loadDPLDocument: function() {
            var that = this;
            var page = that.options.page;

            progress(that.pageContainer, true);
            that.processor.fetchDocument().done(function(document) {
                that._clearPages();
                that.document = document;

                that._renderPages();
                that.resize(true);
                if (document) {
                    page = page >= 1 && page <= document.total ? page : 1;
                    that.activatePage(page, true);
                }

                if (that.pdfScroller) {
                    that.pdfScroller.destroy();
                }

                that.pdfScroller = new Scroller(that.pageContainer[0].parentNode, {
                    filter: '.k-page',
                    events: {}
                });

                that.pdfScroller.enablePanEventsTracking();

                progress(that.pageContainer, false);
            });
        },

        _loadPdfJSDocument: function(data) {
            const that = this;
            const options = that.options;
            const page = options.page;
            let file;

            if (data) {
                file = data;
            } else {
                file = options.pdfjsProcessing.file;
            }

            if (!file) {
                that._renderBlankPage();
                return;
            }

            if (typeof file === "string") {
                file = {
                    url: file
                };
            } else if (file instanceof ArrayBuffer) {
                file = {
                    data: file
                };
            }

            that._removeBlankPage();

            progress(that.pageContainer, true);
            that.pdfViewerCommon = new PdfViewer(that.element[0], {
                loadOnDemand: that.options.pdfjsProcessing.loadOnDemand,
                loadOnDemandPageSize: 1,
                zoomLevel: that.zoomScale,
                renderForms: that.options.pdfjsProcessing.renderForms,
                fileDescriptor: file,
                events: {
                    pagesLoad: (e) => {
                        that.document = e.pdfDoc;
                        that.pages = e.pdfPages;

                        if (that.options.pdfjsProcessing.renderForms) {
                            // Enable text selection by default if form fields are to be rendered.
                            setInteractionMode(that.pdfViewerCommon, 0);
                        } else {
                            // Enable panning by default if form fields are not rendered.
                            setInteractionMode(that.pdfViewerCommon, 1);
                        }

                        that.activatePage(page, true);
                        that.trigger(UPDATE);

                        if (that._currentPage > -1) {
                            that.pdfViewerCommon.scrollToPage({ pageNumber: that._currentPage });
                            // Reset the internal current page property.
                            that._currentPage = null;
                        }

                        progress(that.pageContainer, false);
                    },
                    pageRendered: (e) => {
                        if (!that._preventRenderEvent) {
                            that.trigger(RENDER, { page: e.page.pdfPage });
                        }

                        that._setPageNumberAttributes();

                        that._preventRenderEvent = false;
                    },
                    zoomStart: (e) => {
                        that._currentPage = that.pdfViewerCommon.getCurrentPageIndex() + 1;
                    },
                    zoomEnd: (e) => {
                        that.zoomScale = e.zoomLevel;
                        that._updateZoomComboBox(e.zoomLevel);
                        that.trigger(ZOOMEND, { scale: e.zoomLevel });
                    },
                    printEnd: (e) => {
                        progress(that.pageContainerWrapper, false);
                    },
                    scroll: (e) => {
                        if (e.isPageChanged) {
                            that.trigger(UPDATE, { action: PAGE_CHANGE, page: e.pageNumber, total: that.pages.length, pageChangeFromScroll: true });
                        }
                    },
                    error: (e) => {
                        that._triggerError({
                            error: e.message,
                            message: that.options.messages.errorMessages.parseError
                        });
                    },
                    annotationEditorToolBarShow: that.onAnnotationEditorToolBarShow.bind(that),
                }
            });
        },

        _enablePanning: function() {
            const that = this;
            that.pdfViewerCommon.documentScroller.enablePanEventsTracking();
        },

        _disablePanning: function() {
            const that = this;
            that.pdfViewerCommon.documentScroller.disablePanEventsTracking();
        },

        _setPageNumberAttributes: function() {
            const that = this;

            that.pageContainer.find('.k-page').each((i, el) => {
                $(el).attr(kendo.attr("number"), i + 1);
            });
        },

        loadPage: function(number) {
            const that = this,
                page = that.pages && that.pages[number - 1];

            if (!page) {
                return;
            }

            if (that._isDPLProcessor()) {
                return page.load(that.zoomScale);
            }

            return Promise.resolve();
        },

        activatePage: function(number, updatePager) {
            const that = this,
                page = that.pages && that.pages[number - 1];

            if (!page) {
                return;
            }

            that._pageNum = number;

            if (that._isDPLProcessor()) {
                that._loadVisiblePages();
                that._scrollToActivatedPage(number, updatePager);
            } else {
                that.pdfViewerCommon.activatePageNumber(number);
                that.trigger(UPDATE, { action: PAGE_CHANGE, page: number, total: that.pages.length, updatePager: updatePager });
            }
        },

        _scrollToActivatedPage: function(number, updatePager) {
            const that = this,
                pageContainer = that.pageContainerWrapper;

            that._preventScroll = true;
            scrollToPage(pageContainer[0], number - 1);
            that.trigger(UPDATE, { action: PAGE_CHANGE, page: number, total: that.pages.length, updatePager: updatePager });
        },

        _getVisiblePagesCount: function() {
            var that = this,
                loadedPagesHeight = 0,
                updatedVisiblePagesCount = 0,
                containerHeight = that.pageContainer[0].clientHeight,
                index = 0;

            while (loadedPagesHeight <= containerHeight && index < that.pages.length)
            {
                loadedPagesHeight += that.pages[index].element.height();
                updatedVisiblePagesCount++;
                index++;
            }

            that._visiblePagesCount = updatedVisiblePagesCount;
        },

        _loadVisiblePages: function() {
            var pagesCount = this.pages && this.pages.length,
                minVisiblePageNum = Math.max(this._pageNum - this._visiblePagesCount, 1),
                maxVisiblePageNum = Math.min(this._pageNum + this._visiblePagesCount, pagesCount);

            this._visiblePages = this.pages.slice(minVisiblePageNum - 1, maxVisiblePageNum);

            for (var i = minVisiblePageNum; i <= maxVisiblePageNum; i++)
            {
                this.loadPage(i);
            }
        },

        _loadAllPages: function() {
            const pagesCount = this.pages && this.pages.length;
            const promises = [];

            for (var i = 0; i <= pagesCount; i++)
            {
                promises.push(this.loadPage(i));
            }

            return promises;
        },

        fromFile: function(file) {
            const that = this;
            if (that._isDPLProcessor()) {
                that.zoomScale = that.options.scale || DEFAULT_ZOOM_LEVEL;
                that.zoom(that.zoomScale, true);
                that.trigger(UPDATE, { action: "zoom", zoom: that.options.scale || "auto" });

                that.processor._updateDocument(file);
                that._loadDPLDocument();
            } else {
                if (that.pdfViewerCommon) {
                    that.annotationsToolbar?.destroy();
                    resetAnnotationEditorMode(that.pdfViewerCommon);
                    that.toolbar.toggle("[title='Annotations']", false);
                    that.toolbar.toggle("[title='Enable Selection']", false);
                    that.toolbar.toggle("[title='Enable Panning']", true);

                    const loadParams = $.isPlainObject(file) ? file : { url: file };

                    that.pdfViewerCommon.loadFile(loadParams);
                } else {
                    that._loadPdfJSDocument(file);
                }
            }
        },

        exportImage: function(options) {
            var that = this;
            var pageNumber = options.page;
            var page = that.pages[pageNumber - 1] || that._blankPage;
            var rootGroup = new drawing.Group();

            page.load();

            var background = kendo.drawing.Path.fromRect(new kendo.geometry.Rect([0, 0], [page.width, page.height]), {
                fill: {
                    color: WHITECOLOR
                },
                stroke: null
            });

            progress(that.pageContainer, true);
            rootGroup.append(background, page.group);

            drawing.exportImage(rootGroup).done(function(data) {
                progress(that.pageContainer, false);
                kendo.saveAs({
                    dataURI: data,
                    fileName: options.fileName,
                    proxyURL: options.proxyURL || "",
                    forceProxy: options.forceProxy,
                    proxyTarget: options.proxyTarget
                });
            });
        },

        exportSVG: function(options) {
            var that = this;
            var pageNumber = options.page;
            var page = that.pages[pageNumber - 1] || that._blankPage;

            progress(that.pageContainer, true);

            page.load();

            drawing.exportSVG(page.group).done(function(data) {
                progress(that.pageContainer, false);
                kendo.saveAs({
                    dataURI: data,
                    fileName: options.fileName,
                    proxyURL: options.proxyURL || "",
                    forceProxy: options.forceProxy,
                    proxyTarget: options.proxyTarget
                });
            });
        },

        setOptions: function(options)
        {
            var that = this;

            if (options.pdfjsProcessing || options.dplProcessing) {
                that._initProcessor(options || {});
            }

            options = $.extend(that.options, options);

            Widget.fn.setOptions.call(that, options);

            if (options.page) {
                that._pageNum = options.page;
                that.activatePage(options.page, false);
            }

            if (options.width) {
                that.element.width(options.width);
            }

            if (options.height) {
                that.element.height(options.height);
            }
        },

        destroy: function()
        {
            if (this._resizeHandler)
            {
                kendo.unbindResize(this._resizeHandler);
            }

            //destroy nested components
            if (this._errorDialog) {
                this._errorDialog.destroy();
            }

            if (this._saveDialog) {
                this._saveDialog.destroy();
            }

            if (this._upload) {
                this._upload.destroy();
            }

            if (this.pager) {
                this.pager.destroy();
            }

            if (this.toolbar) {
                this.toolbar.unbind();
                this.toolbar.destroy();
                this.toolbar = null;
            }

            if (this.pages && this.pages.length && this._isDPLProcessor()) {
                this.pages.forEach(function(page) {
                    page.destroy();
                });
                this.pages = [];
            }

            if (this.pdfScroller) {
                this.pdfScroller.destroy();
            }
            this.pageContainer.off(NS);
            this.pageContainerWrapper.off(NS);

            Widget.fn.destroy.call(this);
        },

        _clearPages: function() {
            this.pages = [];
            this.document = null;
            this._pageNum = 1;

            this.pageContainer.off(NS);
            this.pageContainer.empty();

            if (this.pdfScroller)
            {
                this.pdfScroller.destroy();
            }
        },

        onAnnotationEditorToolBarShow: function(e) {
            const that = this;
            const type = e.annotationEditorMode;
            const anchor = e.anchor;
            const popup = that.annotationPopup?.popup;
            const editor = e.source.firstSelectedEditor;

            // Do not continue if popup is already visible.
            if (popup && popup.visible() && !popup._closing && type === "freeText") {
                return;
            }

            if (that.annotationPopup) {
                that.annotationPopup.destroy();
                that.annotationPopup.destroyEditor();
                that.annotationPopup = null;
            }

            switch (type) {
                case "highlight":
                    that.annotationPopup = new HighlightAnnotationPopup(that, anchor, editor);
                    break;
                case "freeText":
                    that.annotationPopup = new FreeTextAnnotationPopup(that, anchor, editor);
                    break;
            }
        }
    });

    ui.plugin(PDFViewer);
})(window.kendo.jQuery);
var kendo$1 = kendo;

export { __meta__, kendo$1 as default };
