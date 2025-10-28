import './kendo.view.js';
import './kendo.core.js';
import './kendo.licensing.js';
import '@progress/kendo-licensing';
import './kendo.binder.js';
import './kendo.data.js';
import './kendo.data.odata.js';
import './kendo.data.xml.js';
import './kendo.fx.js';

const __meta__ = {
    id: "pane",
    name: "Pane",
    category: "web",
    description: "Pane",
    depends: [ "view" ],
    hidden: true
};

(function($, undefined$1) {
    var kendo = window.kendo,
        roleSelector = kendo.roleSelector,
        ui = kendo.ui,
        Widget = ui.Widget,
        ViewEngine = kendo.ViewEngine,
        View = kendo.View,

        extend = $.extend,

        NAVIGATE = "navigate",
        VIEW_SHOW = "viewShow",
        SAME_VIEW_REQUESTED = "sameViewRequested",
        OS = kendo.support.mobileOS,
        SKIP_TRANSITION_ON_BACK_BUTTON = OS.ios && !OS.appMode && OS.flatVersion >= 700,
        BACK = "#:back";

    var classNames = {
        pane: "k-pane",
        paneWrapper: "k-pane-wrapper",
        collapsiblePane: "k-collapsible-pane"};

    var Pane = Widget.extend({
        init: function(element, options) {
            var that = this;

            Widget.fn.init.call(that, element, options);

            options = that.options;
            element = that.element;

            element.addClass(classNames.pane);

            if (that.options.collapsible) {
                element.addClass(classNames.collapsiblePane);
            }

            this.history = [];

            this.historyCallback = function(url, params, backButtonPressed) {
                var transition = that.transition;
                that.transition = null;

                // swiping back in iOS leaves the app in a very broken state if we perform a transition
                if (SKIP_TRANSITION_ON_BACK_BUTTON && backButtonPressed) {
                    transition = "none";
                }

                return that.viewEngine.showView(url, transition, params);
            };

            this._historyNavigate = function(url) {
                if (url === BACK) {
                    if (that.history.length === 1) {
                        return;
                    }

                    that.history.pop();
                    url = that.history[that.history.length - 1];
                } else {
                    if (url instanceof View) {
                        url = "";
                    }
                    that.history.push(url);
                }

                that.historyCallback(url, kendo.parseQueryStringParams(url));
            };

            this._historyReplace = function(url) {
                var params = kendo.parseQueryStringParams(url);
                that.history[that.history.length - 1] = url;
                that.historyCallback(url, params);
            };

            that.viewEngine = new ViewEngine(extend({}, {
                container: element,
                transition: options.transition,
                modelScope: options.modelScope,
                rootNeeded: !options.initial,
                serverNavigation: options.serverNavigation,
                remoteViewURLPrefix: options.root || "",
                layout: options.layout,

                showStart: function() {
                    that.closeActiveDialogs();
                },

                after: function() {
                },

                viewShow: function(e) {
                    that.trigger(VIEW_SHOW, e);
                },

                loadStart: function() {
                },

                loadComplete: function() {
                },

                sameViewRequested: function() {
                    that.trigger(SAME_VIEW_REQUESTED);
                },

                viewTypeDetermined: function(e) {
                    if (!e.remote || !that.options.serverNavigation) {
                        that.trigger(NAVIGATE, { url: e.url });
                    }
                }
            }, this.options.viewEngine));


            this._setPortraitWidth();

            kendo.onResize(function() {
                that._setPortraitWidth();
            });
        },

        closeActiveDialogs: function() {
            var dialogs = this.element.find(roleSelector("actionsheet popover modalview")).filter(":visible");
            dialogs.each(function() {
                kendo.widgetInstance($(this), ui).close();
            });
        },

        navigateToInitial: function() {
            var initial = this.options.initial;

            if (initial) {
                this.navigate(initial);
            }

            return initial;
        },

        options: {
            name: "Pane",
            portraitWidth: "",
            transition: "",
            layout: "",
            collapsible: false,
            initial: null,
            modelScope: window
        },

        events: [
            NAVIGATE,
            VIEW_SHOW,
            SAME_VIEW_REQUESTED
        ],

        append: function(html) {
            return this.viewEngine.append(html);
        },

        destroy: function() {
            var that = this;

            Widget.fn.destroy.call(that);

            if (that.viewEngine) {
                that.viewEngine.destroy();
            }
        },

        navigate: function(url, transition) {
            if (url instanceof View) {
                url = url.id;
            }

            this.transition = transition;

            this._historyNavigate(url);
        },

        replace: function(url, transition) {
            if (url instanceof View) {
                url = url.id;
            }

            this.transition = transition;

            this._historyReplace(url);
        },

        view: function() {
            return this.viewEngine.view();
        },

        _setPortraitWidth: function() {
            var width,
                portraitWidth = this.options.portraitWidth;

            if (portraitWidth) {
                this.element.css("width", width);
            }
        }
    });

    Pane.wrap = function(element, options) {
        if (!element.is(roleSelector("view"))) {
            element = element.wrap('<div data-' + kendo.ns + 'role="view" data-stretch="true"></div>').parent();
        }

        var paneContainer = element.wrap('<div class="' + classNames.paneWrapper + ' k-widget"><div></div></div>').parent();
        var pane = new Pane(paneContainer, options);

        pane.navigate("");

        return pane;
    };

    // kendo.ui.Pane is already taken in kendo.draganddrop.js
    kendo.Pane = Pane;
})(window.kendo.jQuery);
var kendo$1 = kendo;

export { __meta__, kendo$1 as default };
