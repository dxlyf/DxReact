import './kendo.core.js';
import './kendo.data.js';
import { ExcelExporter, TemplateService } from '@progress/kendo-ooxml';

(function($, kendo) {

    var extend = $.extend;
    let convertedExporter = kendo.ConvertClass(ExcelExporter);

    TemplateService.register({
        compile: kendo.template
    });

    kendo.ExcelExporter = kendo.Class.extend({
        init: function(options) {
            this.options = options;
            var dataSource = options.dataSource;

            if (dataSource instanceof kendo.data.DataSource) {

                if (!dataSource.filter()) {
                    dataSource.options.filter = undefined;
                }

                this.dataSource = new dataSource.constructor(extend(
                    {},
                    dataSource.options,
                    {
                        page: options.allPages ? 0 : dataSource.page(),
                        filter: dataSource.filter(),
                        pageSize: (options.allPages || options.groupPaging) ? dataSource.total() : dataSource.pageSize() || dataSource.total(),
                        sort: dataSource.sort(),
                        group: dataSource.group(),
                        aggregate: dataSource.aggregate(),
                        isExcelExportRequest: true
                    }));

                var data = dataSource.data();

                if (data.length > 0) {
                    if (options.hierarchy) {
                        for (var i = 0; i < data.length; i++) {
                            if (data[i].expanded === false || data[i].expanded === undefined) {
                                data[i].expanded = true;
                                data[i].shouldRestoreExpandedState = true;
                            }
                        }
                    }
                    // Avoid toJSON() for perf and avoid data() to prevent reparenting.
                    this.dataSource._data = data;

                    var transport = this.dataSource.transport;
                    if (dataSource._isServerGrouped() && transport.options && transport.options.data) { // clear the transport data when using aspnet-mvc transport
                        transport.options.data = null;
                    }
                }

            } else {
                this.dataSource = kendo.data.DataSource.create(dataSource);
            }
        },

        _hierarchy: function() {
            var hierarchy = this.options.hierarchy;
            var dataSource = this.dataSource;

            if (hierarchy && dataSource.level) {
                hierarchy = {
                    itemLevel: function(item) {
                        return dataSource.level(item);
                    }
                };

                var view = dataSource.view();
                var depth = 0;
                var level;

                for (var idx = 0; idx < view.length; idx++) {
                    level = dataSource.level(view[idx]);

                    if (level > depth) {
                        depth = level;
                    }
                }

                hierarchy.depth = depth + 1;
            } else {
                hierarchy = false;
            }

            return {
                hierarchy: hierarchy
            };
        },

        _restoreExpandedState: function() {
            var options = this.options,
                dataSource = options.dataSource,
                data = dataSource.data(),
                hierarchy = options.hierarchy;

            if (data.length > 0) {
                if (hierarchy) {
                    for (var i = 0; i < data.length; i++) {
                        if (data[i].shouldRestoreExpandedState) {
                            data[i].expanded = false;
                            delete data[i].shouldRestoreExpandedState;
                        }
                    }
                }
            }
        },

        workbook: function() {
            return $.Deferred((function(d) {
                this.dataSource.fetch()
                    .then((function() {

                        var workbook = new convertedExporter(extend({}, this.options, this._hierarchy(), {
                            data: this.dataSource.view(),
                            groups: this.dataSource.group(),
                            aggregates: this.dataSource.aggregates()
                        })).workbook();

                        d.resolve(workbook, this.dataSource.view());
                    }).bind(this));
            }).bind(this)).promise();
        }
    });

    window.kendo.excel = window.kendo.excel || {};
    window.kendo.excel.ExcelExporter = convertedExporter;
    window.kendo.excel.TemplateService = TemplateService;

})(kendo.jQuery, kendo);

(function($, kendo) {


kendo.ExcelMixin = {
    extend: function(proto) {
       proto.events.push("excelExport");
       proto.options.excel = $.extend(proto.options.excel, this.options);
       proto.saveAsExcel = this.saveAsExcel;
    },
    options: {
        proxyURL: "",
        allPages: false,
        filterable: false,
        fileName: "Export.xlsx",
        collapsible: false
    },
    saveAsExcel: function(deferred) {
        var excel = this.options.excel || {};

        var exporter = new kendo.ExcelExporter({
            columns: this.columns,
            dataSource: this.dataSource,
            allPages: excel.allPages,
            filterable: excel.filterable,
            hierarchy: excel.hierarchy,
            collapsible: excel.collapsible
        });

        exporter.workbook().then((function(book, data) {
            if (!this.trigger("excelExport", { workbook: book, data: data })) {
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

                    if (exporter._restoreExpandedState) {
                        exporter._restoreExpandedState();
                    }

                    if (deferred) {
                        deferred.resolve();
                    }
                });
            } else if (deferred) {
                deferred.resolve();
            }
        }).bind(this));
    }
};

})(kendo.jQuery, kendo);
