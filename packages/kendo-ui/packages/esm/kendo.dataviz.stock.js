import './kendo.core.js';
import './kendo.dataviz.chart.js';
import { constants, inArray, defined, StockChart, InstanceObserver, NavigatorHint, Navigator } from '@progress/kendo-charts';
import './kendo.licensing.js';
import '@progress/kendo-licensing';
import './kendo.breadcrumb.js';
import './kendo.icons.js';
import './kendo.html.icon.js';
import './kendo.html.base.js';
import '@progress/kendo-svg-icons';
import './kendo.data.js';
import './kendo.data.odata.js';
import './kendo.data.xml.js';
import './kendo.dataviz.core.js';
import '@progress/kendo-charts/dist/es/core-export.js';
import './html-DIrOxn6k.js';
import './kendo.popup.js';
import '@progress/kendo-drawing';
import './kendo.color.js';
import './kendo.dataviz.themes.js';
import './kendo.userevents.js';
import '@progress/kendo-charts/dist/es/chart-export.js';

const __meta__ = {
    id: "dataviz.stockchart",
    name: "StockChart",
    category: "dataviz",
    description: "StockChart widget and associated financial series.",
    depends: [ "dataviz.chart" ]
};

(function($) {
    window.kendo.dataviz = window.kendo.dataviz || {};

    var kendo = window.kendo;
    var dataviz = kendo.dataviz;
    var Chart = dataviz.ui.Chart;
    var deepExtend = kendo.deepExtend;
    var NAVIGATOR_AXIS = constants.NAVIGATOR_AXIS;
    var NAVIGATOR_PANE = constants.NAVIGATOR_PANE;
    var CHANGE = "change";

    var StockChart$1 = Chart.extend({

        options: {
            name: "StockChart",
            dateField: "date",
            axisDefaults: {
                categoryAxis: {
                    type: "date",
                    baseUnit: "fit",
                    justified: true
                },
                valueAxis: {
                    narrowRange: true,
                    labels: {
                        format: "C"
                    }
                }
            },
            navigator: {
                select: {},
                seriesDefaults: {
                    markers: {
                        visible: false
                    },
                    tooltip: {
                        visible: true,
                        template: ({ category }) => kendo.toString(category, 'd')
                    },
                    line: {
                        width: 2
                    }
                },
                hint: {},
                visible: true
            },
            tooltip: {
                visible: true
            },
            legend: {
                visible: false
            },
            persistSeriesVisibility: true
        },

        _createChart: function(options, themeOptions) {
            this._initNavigatorOptions(options);
            this._instance = new StockChart(this.element[0], options, themeOptions, {
                observer: new InstanceObserver(this, {
                    showTooltip: '_showTooltip',
                    hideTooltip: '_hideTooltip',
                    legendItemClick: '_onLegendItemClick',
                    render: '_onRender',
                    init: '_onInit',
                    drilldown: '_onDrilldown',
                    navigatorFilter: '_onNavigatorFilter',
                    navigatorCreated: '_onNavigatorCreated'
                }),
                sender: this,
                rtl: this._isRtl(),
                createSurface: kendo.drawing.Surface.create
            });
        },

        _initNavigatorOptions: function(options) {
            var navigatorOptions = options.navigator || {};
            var support = kendo.support;
            var isTouch = support.touch;
            var isFirefox = support.browser.mozilla;

            deepExtend(navigatorOptions, {
                autoBindElements: !navigatorOptions.dataSource,
                partialRedraw: navigatorOptions.dataSource,
                liveDrag: !isTouch && !isFirefox
            });
        },

        _initDataSource: function(userOptions) {
            var options = userOptions || {},
                dataSource = options.dataSource,
                hasServerFiltering = dataSource && dataSource.serverFiltering,
                mainAxis = [].concat(options.categoryAxis)[0],
                naviOptions = options.navigator || {},
                select = naviOptions.select,
                hasSelect = select && select.from && select.to;

            if (hasServerFiltering && hasSelect) {
                var filter = [].concat(dataSource.filter || []);

                var from = kendo.parseDate(select.from);
                var to = kendo.parseDate(select.to);
                var dummyAxis = new dataviz.DateCategoryAxis(deepExtend({
                    baseUnit: "fit"
                }, mainAxis, {
                    categories: [from, to]
                }), kendo);

                dataSource.filter = buildFilter(dummyAxis.range().min, to).concat(filter);
            }

            Chart.fn._initDataSource.call(this, userOptions);
        },

        _onNavigatorCreated: function(e) {
            this._instance = e.sender;
            this.options = e.sender.options;
            this._navigator = this.navigator = e.navigator;
            this._initNavigatorDataSource();
        },

        _initNavigatorDataSource: function() {
            var navigatorOptions = this.options.navigator;
            var autoBind = navigatorOptions.autoBind;
            var dsOptions = navigatorOptions.dataSource;

            if (dsOptions) {
                this._navigatorDataChangedHandler = this._navigatorDataChangedHandler || this._onNavigatorDataChanged.bind(this);
                this._navigatorDataSource = kendo.data.DataSource
                    .create(dsOptions)
                    .bind(CHANGE, this._navigatorDataChangedHandler);

                if (!defined(autoBind)) {
                   autoBind = this.options.autoBind;
                }

                if (autoBind) {
                    this._navigatorDataSource.fetch();
                }
            }
        },

        _bindNavigatorSeries: function(series, data) {
            var seriesIx, currentSeries,
                seriesLength = series.length;

            for (seriesIx = 0; seriesIx < seriesLength; seriesIx++) {
                currentSeries = series[seriesIx];

                if (currentSeries.axis == NAVIGATOR_AXIS && this._isBindable(currentSeries)) {
                    currentSeries.data = data;
                }
            }
        },

        _onNavigatorDataChanged: function() {
            var chart = this,
                instance = chart._instance,
                categoryAxes = chart.options.categoryAxis,
                axisIx,
                axesLength = categoryAxes.length,
                data = chart._navigatorDataSource.view(),
                currentAxis,
                naviCategories;

            this._bindNavigatorSeries(chart.options.series, data);
            if (chart._sourceSeries) {
                this._bindNavigatorSeries(chart._sourceSeries, data);
            }

            for (axisIx = 0; axisIx < axesLength; axisIx++) {
                currentAxis = categoryAxes[axisIx];

                if (currentAxis.pane == NAVIGATOR_PANE) {
                    if (currentAxis.name == NAVIGATOR_AXIS) {
                        chart._bindCategoryAxis(currentAxis, data, axisIx);
                        naviCategories = currentAxis.categories;
                    } else {
                        currentAxis.categories = naviCategories;
                    }
                }
            }

            if (instance._model) {
                var navigator = this.navigator;
                navigator.redraw();
                navigator.setRange();

                if (!chart.options.dataSource || (chart.options.dataSource && chart._dataBound)) {
                    navigator.redrawSlaves();
                }
            }
        },

        _bindCategories: function() {
            Chart.fn._bindCategories.call(this);
            if (this._instance) {
                this._instance.copyNavigatorCategories();
            }
        },

        _onDataChanged: function() {
            Chart.fn._onDataChanged.call(this);

            this._dataBound = true;
        },

        setOptions: function(options) {
            this._removeNavigatorDataSource();
            this._initNavigatorOptions(options);
            this._instance.destroyNavigator();
            Chart.fn.setOptions.call(this, options);
        },

        _onNavigatorFilter: function(e) {
            this.dataSource.filter(buildFilter(e.from, e.to));
        },

        requiresHandlers: function(names) {
            if (inArray('navigatorFilter', names)) {
                var dataSource = this.dataSource;
                var hasServerFiltering = dataSource && dataSource.options.serverFiltering;
                return hasServerFiltering && this.options.navigator.dataSource;
            }

            return Chart.fn.requiresHandlers.call(this, names);
        },

        _removeNavigatorDataSource: function() {
            var navigatorDataSource = this._navigatorDataSource;
            if (navigatorDataSource) {
                navigatorDataSource.unbind(CHANGE, this._navigatorDataChangedHandler);
                delete this._navigatorDataSource;
            }
        },

        destroy: function() {
            Chart.fn.destroy.call(this);
            this._removeNavigatorDataSource();
        }
    });

    kendo.deepExtend(kendo.dataviz, {
        constants: constants,
        Navigator: Navigator,
        NavigatorHint: NavigatorHint,
        StockChart: StockChart$1
    });

    dataviz.ui.plugin(StockChart$1);

    function buildFilter(from, to) {
        return [{
            field: "Date", operator: "gte", value: from
        }, {
            field: "Date", operator: "lt", value: to
        }];
    }

})(window.kendo.jQuery);
var kendo$1 = kendo;

export { __meta__, kendo$1 as default };
