import './kendo.popup.js';
import './kendo.icons.js';
import { drawing, pdf, geometry, drawText, Color, drawDOM, getFontFaces } from '@progress/kendo-drawing';
import './kendo.color.js';
import './kendo.core.js';

(function($) {

window.kendo.util = window.kendo.util || {};
kendo.deepExtend(kendo.util, {
    LRUCache: drawing.util.LRUCache,
    TextMetrics: drawing.util.TextMetrics,
    measureText: drawing.util.measureText,
    objectKey: drawing.util.objectKey,
    hashKey: drawing.util.hashKey,
    normalizeText: drawing.util.normalizeText,
    encodeBase64: drawing.util.encodeBase64
});

})(window.kendo.jQuery);

(function($) {

window.kendo = window.kendo || {};
let pdfExtended = kendo.deepExtend({}, pdf);
kendo.deepExtend(kendo, {
    drawing: $.extend(true, {}, drawing, { Segment: geometry.Segment, pdf: pdfExtended }),
    pdf: pdfExtended,
    geometry: geometry
});

kendo.drawing.exportPDF = function(group, options) {
    let promise = pdf.exportPDF(group, options);
    return kendo.convertPromiseToDeferred(promise);
};

kendo.drawing.exportImage = function(group, options) {
    let promise = drawing.exportImage(group, options);
    return kendo.convertPromiseToDeferred(promise);
};

kendo.drawing.exportSVG = function(group, options) {
    let promise = drawing.exportSVG(group, options);
    return kendo.convertPromiseToDeferred(promise);
};

kendo.drawing.drawText = drawText;
kendo.drawing.Color = Color;
kendo.dataviz.drawing = kendo.drawing;
kendo.dataviz.geometry = geometry;

})(window.kendo.jQuery);

(function($) {

    var NS = ".kendo";
    var kendo = window.kendo;
    var deepExtend = kendo.deepExtend;
    var utils = kendo.drawing.util;
    var defined = utils.defined;
    var limitValue = utils.limitValue;
    var eventCoordinates = utils.eventCoordinates;
    var outerWidth = kendo._outerWidth;
    var outerHeight = kendo._outerHeight;

    var TOOLTIP_TEMPLATE = '<div class="k-tooltip">' +
            '<div class="k-tooltip-content"></div>' +
        '</div>';
    var TOOLTIP_CLOSE_TEMPLATE = `<div class="k-tooltip-button">${kendo.ui.icon($('<a href="#" title="Close"></a>'), { icon: "x" })}</div>`;

    var SurfaceTooltip = kendo.Class.extend({
        init: function(surface, options) {
            this.element = $(TOOLTIP_TEMPLATE);
            this.content = this.element.children(".k-tooltip-content");

            options = options || {};

            this.options = deepExtend({}, this.options, this._tooltipOptions(options));
            this.popupOptions = {
                appendTo: options.appendTo,
                animation: options.animation,
                copyAnchorStyles: false,
                collision: "fit fit"
            };

            this._openPopupHandler = this._openPopup.bind(this);

            this.surface = surface;
            this._bindEvents();
        },

        options: {
            position: "top",
            showOn: "mouseenter",
            offset: 7,
            autoHide: true,
            hideDelay: 0,
            showAfter: 100
        },

        _bindEvents: function() {
            this._showHandler = this._showEvent.bind(this);
            this._surfaceLeaveHandler = this._surfaceLeave.bind(this);
            this._mouseleaveHandler = this._mouseleave.bind(this);
            this._mousemoveHandler = this._mousemove.bind(this);

            this.surface.bind("click", this._showHandler);
            this.surface.bind("mouseenter", this._showHandler);
            this.surface.bind("mouseleave", this._mouseleaveHandler);
            this.surface.bind("mousemove", this._mousemoveHandler);

            this.surface.element.on("mouseleave" + NS, this._surfaceLeaveHandler);

            this.element.on("click" + NS, ".k-tooltip-button", this._hideClick.bind(this));
            this.element.on("mouseleave" + NS, this._tooltipLeave.bind(this));
        },

        getPopup: function() {
            if (!this.popup) {
                this.popup = new kendo.ui.Popup(this.element, this.popupOptions);
            }

            return this.popup;
        },

        destroy: function() {
            var popup = this.popup;

            this.surface.unbind("click", this._showHandler);
            this.surface.unbind("mouseenter", this._showHandler);
            this.surface.unbind("mouseleave", this._mouseleaveHandler);
            this.surface.unbind("mousemove", this._mousemoveHandler);

            this.surface.element.off("mouseleave" + NS, this._surfaceLeaveHandler);
            this.element.off("click" + NS);
            this.element.off("mouseleave" + NS);

            if (popup) {
                popup.destroy();
                delete this.popup;
            }
            delete this.popupOptions;

            clearTimeout(this._timeout);

            delete this.element;
            delete this.content;
            delete this.surface;
        },

        _tooltipOptions: function(options) {
            options = options || {};
            return {
                position: options.position,
                showOn: options.showOn,
                offset: options.offset,
                autoHide: options.autoHide,
                width: options.width,
                height: options.height,
                content: options.content,
                shared: options.shared,
                hideDelay: options.hideDelay,
                showAfter: options.showAfter
            };
        },

        _tooltipShape: function(shape) {
            while (shape && !shape.options.tooltip) {
                shape = shape.parent;
            }
            return shape;
        },

        _updateContent: function(target, shape, options) {
            var content = options.content;
            if (kendo.isFunction(content)) {
                content = content({
                    element: shape,
                    target: target
                });
            }

            if (content) {
                this.content.html(content);
                return true;
            }
        },

        _position: function(shape, options, elementSize, event) {
            var position = options.position;
            var tooltipOffset = options.offset || 0;
            var surface = this.surface;
            var offset = surface._instance._elementOffset();
            var size = surface.getSize();
            var surfaceOffset = surface._instance._offset;
            var bbox = shape.bbox();
            var width = elementSize.width;
            var height = elementSize.height;
            var left = 0, top = 0;

            bbox.origin.translate(offset.left, offset.top);
            if (surfaceOffset) {
                bbox.origin.translate(-surfaceOffset.x, -surfaceOffset.y);
            }

            if (position == "cursor" && event) {
                var coord = eventCoordinates(event);
                left = coord.x - width / 2;
                top = coord.y - height - tooltipOffset;
            } else if (position == "left") {
                left = bbox.origin.x - width - tooltipOffset;
                top = bbox.center().y - height / 2;
            } else if (position == "right") {
                left = bbox.bottomRight().x + tooltipOffset;
                top = bbox.center().y - height / 2;
            } else if (position == "bottom") {
                left = bbox.center().x - width / 2;
                top = bbox.bottomRight().y + tooltipOffset;
            } else {
                left = bbox.center().x - width / 2;
                top = bbox.origin.y - height - tooltipOffset;
            }

            return {
                left: limitValue(left, offset.left, offset.left + size.width),
                top: limitValue(top, offset.top, offset.top + size.height)
            };
        },

        show: function(shape, options) {
            this._show(shape, shape, deepExtend({}, this.options, this._tooltipOptions(shape.options.tooltip), options));
        },

        hide: function() {
            var popup = this.popup;
            var current = this._current;

            delete this._current;
            clearTimeout(this._showTimeout);
            if (popup && popup.visible() && current &&
                !this.surface.trigger("tooltipClose", { element: current.shape, target: current.target, popup: popup })) {
                popup.close();
            }
        },

        _hideClick: function(e) {
            e.preventDefault();
            this.hide();
        },

        _show: function(target, shape, options, event, delay) {
            var current = this._current;

            clearTimeout(this._timeout);

            if (current && ((current.shape === shape && options.shared) || current.target === target)) {
                return;
            }

            clearTimeout(this._showTimeout);

            var popup = this.getPopup();

            if (!this.surface.trigger("tooltipOpen", { element: shape, target: target, popup: popup }) &&
                this._updateContent(target, shape, options)) {

                this._autoHide(options);
                var elementSize = this._measure(options);

                if (popup.visible()) {
                    popup.close(true);
                }

                this._current = {
                    options: options,
                    elementSize: elementSize,
                    shape: shape,
                    target: target,
                    position: this._position(options.shared ? shape : target, options, elementSize, event)
                };

                if (delay) {
                    this._showTimeout = setTimeout(this._openPopupHandler, options.showAfter || 0);
                } else {
                    this._openPopup();
                }
            }
        },

        _openPopup: function() {
            var current = this._current;
            var position = current.position;

            this.getPopup().open(position.left, position.top);
        },

        _autoHide: function(options) {
            if (options.autoHide && this._closeButton) {
                this.element.removeClass("k-tooltip-closable");
                this._closeButton.remove();
                delete this._closeButton;
            }

            if (!options.autoHide && !this._closeButton) {
                this.element.addClass("k-tooltip-closable");
                this._closeButton = $(TOOLTIP_CLOSE_TEMPLATE).appendTo(this.element);
            }
        },

        _showEvent: function(e) {
            var shape = this._tooltipShape(e.element);

            if (shape) {
                var options = deepExtend({}, this.options, this._tooltipOptions(shape.options.tooltip));

                if (options && options.showOn == e.type) {
                    this._show(e.element, shape, options, e.originalEvent, true);
                }
            }
        },

        _measure: function(options) {
            this.element.css({
                width: defined(options.width) ? options.width : 'auto',
                height: defined(options.height) ? options.height : 'auto'
            });

            const clone = this.element.clone().appendTo(document.body).css({ visibility: 'hidden' });
            const width = outerWidth(clone);
            const height = outerHeight(clone);
            clone.remove();

            this.element.css({
                width: width,
                height: height
            });

            return {
                width: width,
                height: height
            };
        },

        _mouseleave: function(e) {
            if (this.popup && !this._popupRelatedTarget(e.originalEvent)) {
                var tooltip = this;
                var current = tooltip._current;

                if (current && current.options.autoHide) {
                    tooltip._timeout = setTimeout(function() {
                        clearTimeout(tooltip._showTimeout);
                        tooltip.hide();
                    }, current.options.hideDelay || 0);
                }
            }
        },

        _mousemove: function(e) {
            var current = this._current;
            if (current && e.element) {
                var options = current.options;
                if (options.position == "cursor") {
                    var position = this._position(e.element, options, current.elementSize, e.originalEvent);
                    current.position = position;
                    this.getPopup().wrapper.css({ left: position.left, top: position.top });
                }
            }
        },

        _surfaceLeave: function(e) {
            if (this.popup && !this._popupRelatedTarget(e)) {
                clearTimeout(this._showTimeout);
                this.hide();
            }
        },

        _popupRelatedTarget: function(e) {
            return e.relatedTarget && $(e.relatedTarget).closest(this.popup.wrapper).length;
        },

        _tooltipLeave: function() {
            var tooltip = this;
            var current = tooltip._current;
            if (current && current.options.autoHide) {
                tooltip._timeout = setTimeout(function() {
                    tooltip.hide();
                }, current.options.hideDelay || 0);
            }
        }
    });

    kendo.drawing.SurfaceTooltip = SurfaceTooltip;
    kendo.dataviz.drawing.SurfaceTooltip = SurfaceTooltip;

})(window.kendo.jQuery);

(function($) {

    var kendo = window.kendo;
    var draw = kendo.drawing;
    var DrawingSurface = draw.Surface;
    var Widget = kendo.ui.Widget;
    var deepExtend = kendo.deepExtend;

    kendo.support.svg = DrawingSurface.support.svg;
    kendo.support.canvas = DrawingSurface.support.canvas;

    var Surface = Widget.extend({
        init: function(element, options) {
            Widget.fn.init.call(this, element, {});

            this.options = deepExtend({}, this.options, options);

            this._instance = DrawingSurface.create(this.element[0], options);
            if (this._instance.translate) {
                this.translate = translate;
            }

            this._triggerInstanceHandler = this._triggerInstanceEvent.bind(this);
            this._bindHandler("click");
            this._bindHandler("mouseenter");
            this._bindHandler("mouseleave");
            this._bindHandler("mousemove");

            this._enableTracking();
        },

        options: {
            name: "Surface",
            tooltip: {}
        },

        events: [
            "click",
            "mouseenter",
            "mouseleave",
            "mousemove",
            "resize",
            "tooltipOpen",
            "tooltipClose"
        ],

        _triggerInstanceEvent: function(e) {
            this.trigger(e.type, e);
        },

        _bindHandler: function(event) {
            this._instance.bind(event, this._triggerInstanceHandler);
        },

        draw: function(element) {
            this._instance.draw(element);
        },

        clear: function() {
            if (this._instance) {
                this._instance.clear();
            }
            this.hideTooltip();
        },

        destroy: function() {
            if (this._instance) {
                this._instance.destroy();
                delete this._instance;
            }

            if (this._tooltip) {
                this._tooltip.destroy();
                delete this._tooltip;
            }

            Widget.fn.destroy.call(this);
        },

        exportVisual: function() {
            return this._instance.exportVisual();
        },

        eventTarget: function(e) {
            return this._instance.eventTarget(e);
        },

        showTooltip: function(shape, options) {
            if (this._tooltip) {
                this._tooltip.show(shape, options);
            }
        },

        hideTooltip: function() {
            if (this._tooltip) {
                this._tooltip.hide();
            }
        },

        suspendTracking: function() {
            this._instance.suspendTracking();
            this.hideTooltip();
        },

        resumeTracking: function() {
            this._instance.resumeTracking();
        },

        getSize: function() {
            return {
                width: this.element.width(),
                height: this.element.height()
            };
        },

        setSize: function(size) {
            this.element.css({
                width: size.width,
                height: size.height
            });

            this._size = size;
            this._instance.currentSize(size);
            this._resize();
        },

        _resize: function() {
            this._instance.currentSize(this._size);
            this._instance._resize();
        },

        _enableTracking: function() {
            if (kendo.ui.Popup) {
                this._tooltip = new draw.SurfaceTooltip(this, this.options.tooltip || {});
            }
        }
    });

    kendo.ui.plugin(Surface);

    Surface.create = function(element, options) {
        return new Surface(element, options);
    };

    kendo.drawing.Surface = Surface;

    function translate(offset) {
        this._instance.translate(offset);
    }

})(window.kendo.jQuery);

window.kendo.drawing = window.kendo.drawing || {};

(function($) {

    var kendo = window.kendo;
    var drawing = kendo.drawing;

    drawing.drawDOM = function(element, options) {
        if (typeof options?.template === "string") {
            options.template = kendo.template(options.template);
        }

        let promise = drawDOM($(element)[0], options);
        return kendo.convertPromiseToDeferred(promise);
    };

    // Aliases used by spreadsheet/print.js
    drawing.drawDOM.drawText = drawText;
    drawing.drawDOM.getFontFaces = getFontFaces;

})(window.kendo.jQuery);
