import './kendo.core.js';
import { IntlService, Workbook, Worksheet } from '@progress/kendo-ooxml';
import './kendo.licensing.js';
import '@progress/kendo-licensing';

const __meta__ = {
    id: "ooxml",
    name: "XLSX generation",
    category: "framework",
    advanced: true,
    mixin: true,
    depends: [ "core" ]
};

(function($) {

    IntlService.register({
        toString: kendo.toString
    });


    let convertedWorkbook = kendo.ConvertClass(Workbook);
    var toDataURL = convertedWorkbook.prototype.toDataURL;

    Object.assign(convertedWorkbook.prototype, {
        toDataURL: function() {
            var result = toDataURL.call(this);
            if (typeof result !== 'string') {
                throw new Error('The toDataURL method can be used only with jsZip 2. Either include jsZip 2 or use the toDataURLAsync method.');
            }

            return result;
        },

        toDataURLAsync: function() {
            var deferred = $.Deferred();
            var result = toDataURL.call(this);
            if (typeof result === 'string') {
                result = deferred.resolve(result);
            } else if (result && result.then) {
                result.then(function(dataURI) {
                    deferred.resolve(dataURI);
                }, function() {
                    deferred.reject();
                });
            }

            return deferred.promise();
        }
    });

    window.kendo.ooxml = window.kendo.ooxml || {};
    window.kendo.ooxml.IntlService = IntlService;
    window.kendo.ooxml.Workbook = convertedWorkbook;
    window.kendo.ooxml.Worksheet = kendo.ConvertClass(Worksheet);
    window.kendo.ooxml.createZip = function() {
        /* global JSZip */
        if (typeof JSZip === "undefined") {
            throw new Error("JSZip not found. Check http://docs.telerik.com/kendo-ui/framework/excel/introduction#requirements for more details.");
        }

        return new JSZip();
    };

})(window.kendo.jQuery);

export { __meta__ };
