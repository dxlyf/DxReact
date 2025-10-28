import './kendo.core.js';
import * as commonEngine from '@progress/kendo-spreadsheet-common';
import './kendo.licensing.js';
import '@progress/kendo-licensing';

(function(kendo) {
    let $ = kendo.jQuery;
    $.extend(kendo.spreadsheet, commonEngine);
    kendo.spreadsheet.commonEngine = commonEngine;
})(kendo);
