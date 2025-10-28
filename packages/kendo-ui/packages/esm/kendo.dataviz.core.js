import * as coreExport from '@progress/kendo-charts/dist/es/core-export.js';
import './html-DIrOxn6k.js';
import './kendo.popup.js';
import './kendo.core.js';
import './kendo.licensing.js';
import '@progress/kendo-licensing';
import './kendo.icons.js';
import './kendo.html.icon.js';
import './kendo.html.base.js';
import '@progress/kendo-svg-icons';
import '@progress/kendo-drawing';
import './kendo.color.js';

const __meta__ = {
    id: "dataviz.core",
    name: "Core",
    description: "The DataViz core functions",
    category: "dataviz",
    depends: ["core", "drawing"],
    hidden: true
};


window.kendo.dataviz = window.kendo.dataviz || {};

kendo.deepExtend(kendo.dataviz, kendo.deepExtend({}, coreExport));
kendo.dataviz.Gradients = coreExport.Gradients;

const $ = kendo.jQuery;
let dataviz = kendo.dataviz;
let draw = kendo.drawing;
let services = coreExport.services;

for (let member in coreExport) {
    if (coreExport.hasOwnProperty(member)) {
        dataviz[member] = coreExport[member];
    }
}

dataviz.SASS_THEMES = ["sass", "default-v2", "bootstrap-v4", "material-v2"];

dataviz.ExportMixin = {
    extend: function(proto, skipLegacy) {
        if (!proto.exportVisual) {
            throw new Error("Mixin target has no exportVisual method defined.");
        }

        proto.exportSVG = this.exportSVG;
        proto.exportImage = this.exportImage;
        proto.exportPDF = this.exportPDF;

        if (!skipLegacy) {
            proto.svg = this.svg;
            proto.imageDataURL = this.imageDataURL;
        }
    },

    exportSVG: function(options) {
        return draw.exportSVG(this.exportVisual(), options);
    },

    exportImage: function(options) {
        return draw.exportImage(this.exportVisual(options), options);
    },

    exportPDF: function(options) {
        return draw.exportPDF(this.exportVisual(), options);
    },

    svg: function() {
        if (draw.svg.Surface) {
            return draw.svg.exportGroup(this.exportVisual());
        } else {
            throw new Error("SVG Export failed. Unable to export instantiate kendo.drawing.svg.Surface");
        }
    },

    imageDataURL: function() {
        if (!kendo.support.canvas) {
            return null;
        }

        if (draw.canvas.Surface) {
            var container = $("<div />").css({
                display: "none",
                width: this.element.width(),
                height: this.element.height()
            }).appendTo(document.body);

            var surface = new draw.canvas.Surface(container[0]);
            surface.draw(this.exportVisual());
            var image = surface._rootElement.toDataURL();

            surface.destroy();
            container.remove();

            return image;
        } else {
            throw new Error("Image Export failed. Unable to export instantiate kendo.drawing.canvas.Surface");
        }
    }
};

services.IntlService.register({
    format: function(format) {
        return kendo.format.apply(null, [format].concat(Array.prototype.slice.call(arguments, 1)));
    },
    toString: kendo.toString,
    parseDate: kendo.parseDate,
    firstDay: function() {
        return kendo.culture().calendars.standard.firstDay;
    }
});

services.TemplateService.register({
    compile: kendo.template
});
dataviz.inArray = function(value, array) {
    if (array) {
        return array.indexOf(value) !== -1;
    }
};
dataviz.Point2D = coreExport.Point;
dataviz.Box2D = coreExport.Box;
dataviz.mwDelta = function(e) {
    return coreExport.mousewheelDelta(e.originalEvent);
};


var kendo$1 = kendo;

export { __meta__, kendo$1 as default };
