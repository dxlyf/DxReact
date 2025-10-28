import './kendo.filebrowser.js';
import './kendo.icons.js';
import './kendo.listview.js';
import './kendo.data.js';
import './kendo.core.js';
import './kendo.licensing.js';
import '@progress/kendo-licensing';
import './kendo.data.odata.js';
import './kendo.data.xml.js';
import './kendo.editable.js';
import './kendo.checkbox.js';
import './kendo.toggleinputbase.js';
import './kendo.html.input.js';
import './kendo.html.base.js';
import './kendo.dropdownlist.js';
import './kendo.list.js';
import './kendo.popup.js';
import './kendo.label.js';
import './kendo.floatinglabel.js';
import './kendo.actionsheet.js';
import './kendo.html.button.js';
import './kendo.html.icon.js';
import '@progress/kendo-svg-icons';
import './kendo.actionsheet.view.js';
import './kendo.button.js';
import './kendo.badge.js';
import './dropdowns-loader-00xUvouJ.js';
import './kendo.mobile.scroller.js';
import './kendo.fx.js';
import './kendo.draganddrop.js';
import './kendo.userevents.js';
import './kendo.virtuallist.js';
import './valueMapper-CXgI6HWc.js';
import './kendo.datepicker.js';
import './kendo.calendar.js';
import './kendo.selectable.js';
import './kendo.dateinput.js';
import '@progress/kendo-dateinputs-common';
import './kendo.numerictextbox.js';
import './prefix-suffix-containers-Cid0cOEy.js';
import './kendo.textbox.js';
import './kendo.combobox.js';
import './kendo.multiselect.js';
import './kendo.html.chip.js';
import './kendo.html.chiplist.js';
import './kendo.validator.js';
import './kendo.binder.js';
import './kendo.otpinput.js';
import './kendo.upload.js';
import './kendo.progressbar.js';
import './kendo.pager.js';
import './kendo.breadcrumb.js';

const __meta__ = {
    id: "imagebrowser",
    name: "ImageBrowser",
    category: "web",
    description: "",
    hidden: true,
    depends: [ "filebrowser", "icons" ]
};

(function($, undefined$1) {
    var kendo = window.kendo,
        FileBrowser = kendo.ui.FileBrowser,
        isPlainObject = $.isPlainObject,
        extend = $.extend,
        isFunction = kendo.isFunction,
        trimSlashesRegExp = /(^\/|\/$)/g,
        ERROR = "error",
        NS = ".kendoImageBrowser",
        NAMEFIELD = "name",
        SIZEFIELD = "size",
        TYPEFIELD = "type",
        DEFAULTSORTORDER = { field: TYPEFIELD, dir: "asc" },
        EMPTYTILE = kendo.template(({ text }) => `<div class="k-listview-item k-listview-item-empty"><span class="k-file-preview">${kendo.ui.icon({ icon: "none", iconClass: "k-file-icon" })}</span><span class="k-file-name">${kendo.htmlEncode(text)}</span></div>`);

    extend(true, kendo.data, {
        schemas: {
            "imagebrowser": {
                data: function(data) {
                    return data.items || data || [];
                },
                model: {
                    id: "name",
                    fields: {
                        name: "name",
                        size: "size",
                        type: "type"
                    }
                }
            }
        }
    });

    extend(true, kendo.data, {
        transports: {
            "imagebrowser": kendo.data.RemoteTransport.extend({
                init: function(options) {
                    kendo.data.RemoteTransport.fn.init.call(this, $.extend(true, {}, this.options, options));
                },
                _call: function(type, options) {
                    options.data = $.extend({}, options.data, { path: this.options.path() });

                    if (isFunction(this.options[type])) {
                        this.options[type].call(this, options);
                    } else {
                        kendo.data.RemoteTransport.fn[type].call(this, options);
                    }
                },
                read: function(options) {
                    this._call("read", options);
                },
                create: function(options) {
                    this._call("create", options);
                },
                destroy: function(options) {
                    this._call("destroy", options);
                },
                update: function() {
                    //updates are handled by the upload
                },
                options: {
                    read: {
                        type: "POST"
                    },
                    update: {
                        type: "POST"
                    },
                    create: {
                        type: "POST"
                    },
                    destroy: {
                        type: "POST"
                    }
                }
            })
        }
    });

    function offsetTop(element) {
        return element.offsetTop - $(element).height();
    }

    function concatPaths(path, name) {
        if (path === undefined$1 || !path.match(/\/$/)) {
            path = (path || "") + "/";
        }
        return path + name;
    }

    function sizeFormatter(value) {
        if (!value) {
            return "";
        }

        var suffix = " bytes";

        if (value >= 1073741824) {
            suffix = " GB";
            value /= 1073741824;
        } else if (value >= 1048576) {
            suffix = " MB";
            value /= 1048576;
        } else if (value >= 1024) {
            suffix = " KB";
            value /= 1024;
        }

        return Math.round(value * 100) / 100 + suffix;
    }

    var ImageBrowser = FileBrowser.extend({
        init: function(element, options) {
            var that = this;

            options = options || {};

            FileBrowser.fn.init.call(that, element, options);

            that.element.addClass("k-imagebrowser");
        },

        options: {
            name: "ImageBrowser",
            fileTypes: "*.png,*.gif,*.jpg,*.jpeg"
        },

        value: function() {
            var that = this,
                selected = that._selectedItem(),
                path,
                imageUrl = that.options.transport.imageUrl;

            if (selected && selected.get(TYPEFIELD) === "f") {
                path = concatPaths(that.path(), selected.get(NAMEFIELD)).replace(trimSlashesRegExp, "");
                if (imageUrl) {
                    path = isFunction(imageUrl) ? imageUrl(path) : kendo.format(imageUrl, encodeURIComponent(path));
                }
                return path;
            }
        },

        _fileUpload: function(e) {
            var that = this,
                options = that.options,
                fileTypes = options.fileTypes,
                filterRegExp = new RegExp(("(" + fileTypes.split(",").join(")|(") + ")").replace(/\*\./g , ".*."), "i"),
                fileName = e.files[0].name,
                fileSize = e.files[0].size,
                fileNameField = NAMEFIELD,
                sizeField = SIZEFIELD,
                file;

            if (filterRegExp.test(fileName)) {
                e.data = { path: that.path() };

                file = that._createFile(fileName, fileSize);

                if (!file) {
                    e.preventDefault();
                } else {
                    file._uploading = true;

                    that.upload.one("error", function() {
                        file = undefined$1;
                    });

                    that.upload.one("success", function(e) {
                        if (file) {
                            delete file._uploading;

                            var model = that._insertFileToList(file);

                            model.set(fileNameField, e.response[that._getFieldName(fileNameField)]);
                            model.set(sizeField, e.response[that._getFieldName(sizeField)]);

                            that._tiles = that.listView.items().filter("[" + kendo.attr("type") + "=f]");
                            that._scroll();
                        }
                    });
                }
            } else {
                e.preventDefault();
                that._showMessage(kendo.htmlEncode(kendo.format(options.messages.invalidFileType, fileName, fileTypes)));
            }
        },

        _content: function() {
            var that = this;

            that.list = $('<div class="k-filemanager-listview" />')
                .appendTo(that.element)
                .on("dblclick" + NS, ".k-listview-item", that._dblClick.bind(that));

            that.listView = new kendo.ui.ListView(that.list, {
                layout: "flex",
                flex: {
                    direction: "row",
                    wrap: "wrap"
                },
                dataSource: that.dataSource,
                template: that._itemTmpl(),
                editTemplate: that._editTmpl(),
                selectable: true,
                autoBind: false,
                dataBinding: function(e) {

                    that.toolbar.find(".k-i-x,.k-svg-i-x").parent().addClass("k-disabled");

                    if (e.action === "remove" || e.action === "sync") {
                        e.preventDefault();
                        kendo.ui.progress(that.listView.content, false);
                        /* If there are no files left the loader is displayed over the wrapper instead of the content. */
                        kendo.ui.progress(that.listView.wrapper, false);
                    }
                },
                dataBound: function() {
                    if (that.dataSource.view().length) {
                        that._tiles = this.items().filter("[" + kendo.attr("type") + "=f]");
                        that._scroll();
                    } else {
                        this.content.append(EMPTYTILE({ text: that.options.messages.emptyFolder }));
                    }
                },
                change: that._listViewChange.bind(that)
            });

            that.listView.content.on("scroll" + NS, that._scroll.bind(that));
        },

        _dataSource: function() {
            var that = this,
                options = that.options,
                transport = options.transport,
                typeSortOrder = extend({}, DEFAULTSORTORDER),
                nameSortOrder = { field: NAMEFIELD, dir: "asc" },
                dataSource = {
                    type: transport.type || "imagebrowser",
                    sort: [typeSortOrder, nameSortOrder]
                };

            if (isPlainObject(transport)) {
                transport.path = that.path.bind(that);
                dataSource.transport = transport;
            }

            if (isPlainObject(options.schema)) {
                dataSource.schema = options.schema;
            } else if (transport.type && isPlainObject(kendo.data.schemas[transport.type])) {
                kendo.data.schemas[transport.type];
            }

            if (that.dataSource && that._errorHandler) {
                that.dataSource.unbind(ERROR, that._errorHandler);
            } else {
                that._errorHandler = that._error.bind(that);
            }

            that.dataSource = kendo.data.DataSource.create(dataSource)
                .bind(ERROR, that._errorHandler);
        },

        _loadImage: function(li) {
            var that = this,
                element = $(li),
                dataItem = that.dataSource.getByUid(element.attr(kendo.attr("uid"))),
                name = dataItem.get(NAMEFIELD),
                thumbnailUrl = that.options.transport.thumbnailUrl,
                img = $("<img />", { alt: name }),
                urlJoin = "?";

            if (dataItem._uploading) {
                return;
            }

            img.hide()
               .on("load" + NS, function() {
                   $(this).prev().remove().end().addClass("k-image k-file-image").fadeIn();
               });

            element.find(".k-i-loading").after(img);

            if (isFunction(thumbnailUrl)) {
                thumbnailUrl = thumbnailUrl(that.path(), encodeURIComponent(name));
            } else {
                if (thumbnailUrl.indexOf("?") >= 0) {
                    urlJoin = "&";
                }

                thumbnailUrl = thumbnailUrl + urlJoin + "path=" + encodeURIComponent(that.path() + name);
                if (dataItem._override) {
                    thumbnailUrl += "&_=" + new Date().getTime();
                    delete dataItem._override;
                }
            }

            // IE8 will trigger the load event immediately when the src is assigned
            // if the image is loaded from the cache
            img.attr("src", thumbnailUrl);

            li.loaded = true;
        },

        _scroll: function() {
            var that = this;
            if (that.options.transport && that.options.transport.thumbnailUrl) {
                clearTimeout(that._timeout);

                that._timeout = setTimeout(function() {

                    var height = kendo._outerHeight(that.listView.content),
                        viewTop = that.listView.content.scrollTop(),
                        viewBottom = viewTop + height;

                    that._tiles.each(function() {
                        var top = offsetTop(this),
                            bottom = top + this.offsetHeight;

                        if ((top >= viewTop && top < viewBottom) || (bottom >= viewTop && bottom < viewBottom)) {
                            that._loadImage(this);
                        }

                        if (top > viewBottom) {
                            return false;
                        }
                    });

                    that._tiles = that._tiles.filter(function() {
                        return !this.loaded;
                    });

                }, 250);
            }
        },

        _itemTmpl: function() {
            var that = this;

            const result = (data) => {
                const showLoading = that.options.transport && that.options.transport.thumbnailUrl;

                return `<div class="k-listview-item" ${kendo.attr("uid")}="${data.uid}" ${kendo.attr("type")}="${data[TYPEFIELD]}">` +
                    `${data[TYPEFIELD] === 'd' ?
                        `<div class="k-file-preview">${kendo.ui.icon({ icon: "folder", iconClass: "k-file-icon" })}</div>` :
                        `<div class="k-file-preview">${showLoading ? '<span class="k-file-icon k-icon k-i-loading"></span>' : kendo.ui.icon({ icon: "file", iconClass: "k-file-icon" }) }</div>`}` +
                    `<span class="k-file-name">${data[NAMEFIELD]}</span>` +
                    `${data[TYPEFIELD] === 'f' ? `<span class="k-file-size">${sizeFormatter(data[SIZEFIELD])}</span>` : '' }` +
                `</div>`;
            };

            return kendo.template(result);
        }
    });

    kendo.ui.plugin(ImageBrowser);
})(window.kendo.jQuery);
var kendo$1 = kendo;

export { __meta__, kendo$1 as default };
