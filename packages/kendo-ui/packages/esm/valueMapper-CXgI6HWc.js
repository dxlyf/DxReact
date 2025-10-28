import './kendo.core.js';

kendo.jQuery;

function valueMapperOptions(options, value, callback) {
    return {
        value: (options.selectable === "multiple" || options.checkboxes) ? value : value[0],
        success: function(response) {
            callback(response);
        }
    };
}

export { valueMapperOptions as v };
