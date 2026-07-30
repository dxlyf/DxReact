# Sortable &nbsp; [![Financial Contributors on Open Collective](https://opencollective.com/Sortable/all/badge.svg?label=financial+contributors)](https://opencollective.com/Sortable) [![CircleCI](https://circleci.com/gh/SortableJS/Sortable.svg?style=svg)](https://circleci.com/gh/SortableJS/Sortable) [![DeepScan grade](https://deepscan.io/api/teams/3901/projects/5666/branches/43977/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=3901&pid=5666&bid=43977) [![](https://data.jsdelivr.com/v1/package/npm/sortablejs/badge)](https://www.jsdelivr.com/package/npm/sortablejs) [![npm](https://img.shields.io/npm/v/sortablejs.svg)](https://www.npmjs.com/package/sortablejs)

Sortable is a JavaScript library for reorderable drag-and-drop lists.

Demo: http://sortablejs.github.io/Sortable/

[<img width="250px" src="https://raw.githubusercontent.com/SortableJS/Sortable/HEAD/st/saucelabs.svg?sanitize=true">](https://saucelabs.com/)

## Features

 * Supports touch devices and [modern](http://caniuse.com/#search=drag) browsers (including IE9)
 * Can drag from one list to another or within the same list
 * CSS animation when moving items
 * Supports drag handles *and selectable text* (better than voidberg's html5sortable)
 * Smart auto-scrolling
 * Advanced swap detection
 * Smooth animations
 * [Multi-drag](https://github.com/SortableJS/Sortable/tree/master/plugins/MultiDrag) support
 * Support for CSS transforms
 * Built using native HTML5 drag and drop API
 * Supports
   * [Meteor](https://github.com/SortableJS/meteor-sortablejs)
   * Angular
     * [2.0+](https://github.com/SortableJS/angular-sortablejs)
     * [1.&ast;](https://github.com/SortableJS/angular-legacy-sortablejs)
   * React
     * [ES2015+](https://github.com/SortableJS/react-sortablejs)
     * [Mixin](https://github.com/SortableJS/react-mixin-sortablejs)
   * [Knockout](https://github.com/SortableJS/knockout-sortablejs)
   * [Polymer](https://github.com/SortableJS/polymer-sortablejs)
   * [Vue](https://github.com/SortableJS/Vue.Draggable)
   * [Ember](https://github.com/SortableJS/ember-sortablejs)
 * Supports any CSS library, e.g. [Bootstrap](#bs)
 * Simple API
 * Support for [plugins](#plugins)
 * [CDN](#cdn)
 * No jQuery required (but there is [support](https://github.com/SortableJS/jquery-sortablejs))
 * Typescript definitions at `@types/sortablejs`


<br/>


### Articles

 * [Dragging Multiple Items in Sortable](https://github.com/SortableJS/Sortable/wiki/Dragging-Multiple-Items-in-Sortable) (April 26, 2019)
 * [Swap Thresholds and Direction](https://github.com/SortableJS/Sortable/wiki/Swap-Thresholds-and-Direction) (December 2, 2018)
 * [Sortable v1.0 — New capabilities](https://github.com/SortableJS/Sortable/wiki/Sortable-v1.0-—-New-capabilities/) (December 22, 2014)
 * [Sorting with the help of HTML5 Drag'n'Drop API](https://github.com/SortableJS/Sortable/wiki/Sorting-with-the-help-of-HTML5-Drag'n'Drop-API/) (December 23, 2013)

<br/>

### Getting Started

Install with NPM:
```bash
npm install sortablejs --save
```

Install with Bower:
```bash
bower install --save sortablejs
```

Import into your project:
```js
// Default SortableJS
import Sortable from 'sortablejs';

// Core SortableJS (without default plugins)
import Sortable from 'sortablejs/modular/sortable.core.esm.js';

// Complete SortableJS (with all plugins)
import Sortable from 'sortablejs/modular/sortable.complete.esm.js';
```

Cherrypick plugins:
```js
// Cherrypick extra plugins
import Sortable, { MultiDrag, Swap } from 'sortablejs';

Sortable.mount(new MultiDrag(), new Swap());


// Cherrypick default plugins
import Sortable, { AutoScroll } from 'sortablejs/modular/sortable.core.esm.js';

Sortable.mount(new AutoScroll());
```


---


### Usage
```html
<ul id="items">
	<li>item 1</li>
	<li>item 2</li>
	<li>item 3</li>
</ul>
```

```js
var el = document.getElementById('items');
var sortable = Sortable.create(el);
```

You can use any element for the list and its elements, not just `ul`/`li`. Here is an [example with `div`s](https://jsbin.com/visimub/edit?html,js,output).


---


### Options
```js
var sortable = new Sortable(el, {
	// 分组配置：用于控制不同列表之间的拖拽行为
	// 可以是字符串，也可以是对象 { name: "...", pull: [true, false, 'clone', array], put: [true, false, array] }
	group: "name",
	
	// 是否允许在列表内部排序
	sort: true,
	
	// 延迟时间（毫秒），定义拖拽开始前需要等待的时间
	delay: 0,
	
	// 是否仅在触摸设备上启用延迟
	delayOnTouchOnly: false,
	
	// 触发延迟拖拽前，指针需要移动的最小像素数，超过此值将取消延迟拖拽
	touchStartThreshold: 0,
	
	// 是否禁用排序功能（设为 true 时禁用）
	disabled: false,
	
	// 数据存储配置，用于保存排序状态（参见 Store 文档）
	store: null,
	
	// 动画持续时间（毫秒），排序时移动项目的动画速度，设为 0 则无动画
	animation: 150,
	
	// 缓动函数，用于动画效果。默认为 null，可参考 https://easings.net/
	easing: "cubic-bezier(1, 0, 0, 1)",
	
	// 拖拽手柄选择器，只有匹配此选择器的元素才能触发拖拽
	handle: ".my-handle",
	
	// 过滤器，匹配此选择器的元素不会触发拖拽（可以是字符串或函数）
	filter: ".ignore-elements",
	
	// 是否在触发 filter 时调用 event.preventDefault()
	preventOnFilter: true,
	
	// 指定元素内部哪些子项是可拖拽的
	draggable: ".item",
	
	// HTML 属性名，用于 toArray() 方法获取数据 ID
	dataIdAttr: 'data-id',
	
	// 占位元素的 CSS 类名（拖拽时显示在目标位置）
	ghostClass: "sortable-ghost",
	
	// 被选中元素的 CSS 类名
	chosenClass: "sortable-chosen",
	
	// 正在拖拽元素的 CSS 类名
	dragClass: "sortable-drag",
	
	// 交换区域阈值（0-1），决定拖拽元素与目标元素重叠多少时触发交换
	swapThreshold: 1,
	
	// 是否始终使用反转的交换区域
	invertSwap: false,
	
	// 反转交换区域阈值（默认与 swapThreshold 相同）
	invertedSwapThreshold: 1,
	
	// 拖拽方向：'horizontal'（水平）或 'vertical'（垂直），不指定则自动检测
	direction: 'horizontal',
	
	// 是否强制使用降级方案（忽略 HTML5 DnD 行为）
	forceFallback: false,
	
	// 使用 forceFallback 时，克隆 DOM 元素的 CSS 类名
	fallbackClass: "sortable-fallback",
	
	// 是否将克隆的 DOM 元素追加到文档的 body 中
	fallbackOnBody: false,
	
	// 鼠标需要移动多少像素才被视为拖拽开始（用于降级方案）
	fallbackTolerance: 0,
	
	// 是否允许拖拽事件在目标元素上冒泡
	dragoverBubble: false,
	
	// 当克隆元素隐藏时是否移除它（而不是仅仅隐藏）
	removeCloneOnHide: true,
	
	// 鼠标距离空排序列表多近（像素）时，可以将拖拽元素插入其中
	emptyInsertThreshold: 5,

	// 设置拖拽数据，用于 HTML5 DragEvent 的 dataTransfer 对象
	setData: function (/** DataTransfer */dataTransfer, /** HTMLElement*/dragEl) {
		dataTransfer.setData('Text', dragEl.textContent);
	},

	// 元素被选中时触发
	onChoose: function (/**Event*/evt) {
		evt.oldIndex;  // 元素在父容器中的索引
	},

	// 元素取消选中时触发
	onUnchoose: function(/**Event*/evt) {
		// 属性与 onEnd 相同
	},

	// 拖拽开始时触发
	onStart: function (/**Event*/evt) {
		evt.oldIndex;  // 元素在父容器中的索引
	},

	// 拖拽结束时触发
	onEnd: function (/**Event*/evt) {
		var itemEl = evt.item;  // 被拖拽的 HTMLElement
		evt.to;    // 目标列表
		evt.from;  // 来源列表
		evt.oldIndex;  // 元素在旧父容器中的索引
		evt.newIndex;  // 元素在新父容器中的索引
		evt.oldDraggableIndex; // 元素在旧父容器中的索引（仅计算可拖拽元素）
		evt.newDraggableIndex; // 元素在新父容器中的索引（仅计算可拖拽元素）
		evt.clone // 克隆元素
		evt.pullMode;  // 当元素位于其他 sortable 中时："clone" 表示克隆，true 表示移动
	},

	// 元素从其他列表拖入当前列表时触发
	onAdd: function (/**Event*/evt) {
		// 属性与 onEnd 相同
	},

	// 在同一列表内排序发生变化时触发
	onUpdate: function (/**Event*/evt) {
		// 属性与 onEnd 相同
	},

	// 列表发生任何变化（添加/更新/移除）时触发
	onSort: function (/**Event*/evt) {
		// 属性与 onEnd 相同
	},

	// 元素从当前列表移除到其他列表时触发
	onRemove: function (/**Event*/evt) {
		// 属性与 onEnd 相同
	},

	// 尝试拖拽被过滤的元素时触发
	onFilter: function (/**Event*/evt) {
		var itemEl = evt.item;  // 接收到 mousedown|tapstart 事件的 HTMLElement
	},

	// 在列表中或列表间移动元素时触发（用于控制插入位置）
	onMove: function (/**Event*/evt, /**Event*/originalEvent) {
		// 示例: https://jsbin.com/nawahef/edit?js,output
		evt.dragged; // 被拖拽的 HTMLElement
		evt.draggedRect; // DOMRect {left, top, right, bottom}
		evt.related; // 引导拖拽的目标 HTMLElement
		evt.relatedRect; // DOMRect
		evt.willInsertAfter; // 布尔值，表示 Sortable 是否默认将拖拽元素插入到目标之后
		originalEvent.clientY; // 鼠标位置
		// 返回值说明:
		// return false; — 取消操作
		// return -1; — 插入到目标之前
		// return 1; — 插入到目标之后
		// return true; — 保持基于方向的默认插入点
		// return void; — 保持基于方向的默认插入点
	},

	// 创建元素克隆时触发
	onClone: function (/**Event*/evt) {
		var origEl = evt.item;  // 原始元素
		var cloneEl = evt.clone; // 克隆元素
	},

	// 拖拽元素位置发生变化时触发
	onChange: function(/**Event*/evt) {
		evt.newIndex // 拖拽元素当前的索引（这是使用此事件的主要原因）
		// 其他属性与 onEnd 相同
	}
});
```


---


#### `group` option
To drag elements from one list into another, both lists must have the same `group` value.
You can also define whether lists can give away, give and keep a copy (`clone`), and receive elements.

 * name: `String` — group name
 * pull: `true|false|["foo", "bar"]|'clone'|function` — ability to move from the list. `clone` — copy the item, rather than move. Or an array of group names which the elements may be put in. Defaults to `true`.
 * put: `true|false|["baz", "qux"]|function` — whether elements can be added from other lists, or an array of group names from which elements can be added.
 * revertClone: `boolean` — revert cloned element to initial position after moving to a another list.


Demo:
 - https://jsbin.com/hijetos/edit?js,output
 - https://jsbin.com/nacoyah/edit?js,output — use of complex logic in the `pull` and` put`
 - https://jsbin.com/bifuyab/edit?js,output — use `revertClone: true`


---


#### `sort` option
Allow sorting inside list.

Demo: https://jsbin.com/jayedig/edit?js,output


---


#### `delay` option
Time in milliseconds to define when the sorting should start.
Unfortunately, due to browser restrictions, delaying is not possible on IE or Edge with native drag & drop.

Demo: https://jsbin.com/zosiwah/edit?js,output


---


#### `delayOnTouchOnly` option
Whether or not the delay should be applied only if the user is using touch (eg. on a mobile device). No delay will be applied in any other case. Defaults to `false`.


---


#### `swapThreshold` option
Percentage of the target that the swap zone will take up, as a float between `0` and `1`.

[Read more](https://github.com/SortableJS/Sortable/wiki/Swap-Thresholds-and-Direction#swap-threshold)

Demo: http://sortablejs.github.io/Sortable#thresholds


---


#### `invertSwap` option
Set to `true` to set the swap zone to the sides of the target, for the effect of sorting "in between" items.

[Read more](https://github.com/SortableJS/Sortable/wiki/Swap-Thresholds-and-Direction#forcing-inverted-swap-zone)

Demo: http://sortablejs.github.io/Sortable#thresholds


---


#### `invertedSwapThreshold` option
Percentage of the target that the inverted swap zone will take up, as a float between `0` and `1`. If not given, will default to `swapThreshold`.

[Read more](https://github.com/SortableJS/Sortable/wiki/Swap-Thresholds-and-Direction#dealing-with-swap-glitching)


---


#### `direction` option
Direction that the Sortable should sort in. Can be set to `'vertical'`, `'horizontal'`, or a function, which will be called whenever a target is dragged over. Must return `'vertical'` or `'horizontal'`.

[Read more](https://github.com/SortableJS/Sortable/wiki/Swap-Thresholds-and-Direction#direction)


Example of direction detection for vertical list that includes full column and half column elements:

```js
Sortable.create(el, {
	direction: function(evt, target, dragEl) {
		if (target !== null && target.className.includes('half-column') && dragEl.className.includes('half-column')) {
			return 'horizontal';
		}
		return 'vertical';
	}
});
```


---


#### `touchStartThreshold` option
This option is similar to `fallbackTolerance` option.

When the `delay` option is set, some phones with very sensitive touch displays like the Samsung Galaxy S8 will fire
unwanted touchmove events even when your finger is not moving, resulting in the sort not triggering.

This option sets the minimum pointer movement that must occur before the delayed sorting is cancelled.

Values between 3 to 5 are good.


---


#### `disabled` options
Disables the sortable if set to `true`.

Demo: https://jsbin.com/sewokud/edit?js,output

```js
var sortable = Sortable.create(list);

document.getElementById("switcher").onclick = function () {
	var state = sortable.option("disabled"); // get

	sortable.option("disabled", !state); // set
};
```


---


#### `handle` option
To make list items draggable, Sortable disables text selection by the user.
That's not always desirable. To allow text selection, define a drag handler,
which is an area of every list element that allows it to be dragged around.

Demo: https://jsbin.com/numakuh/edit?html,js,output

```js
Sortable.create(el, {
	handle: ".my-handle"
});
```

```html
<ul>
	<li><span class="my-handle">::</span> list item text one
	<li><span class="my-handle">::</span> list item text two
</ul>
```

```css
.my-handle {
	cursor: move;
	cursor: -webkit-grabbing;
}
```


---


#### `filter` option


```js
Sortable.create(list, {
	filter: ".js-remove, .js-edit",
	onFilter: function (evt) {
		var item = evt.item,
			ctrl = evt.target;

		if (Sortable.utils.is(ctrl, ".js-remove")) {  // Click on remove button
			item.parentNode.removeChild(item); // remove sortable item
		}
		else if (Sortable.utils.is(ctrl, ".js-edit")) {  // Click on edit link
			// ...
		}
	}
})
```


---


#### `ghostClass` option
Class name for the drop placeholder (default `sortable-ghost`).

Demo: https://jsbin.com/henuyiw/edit?css,js,output

```css
.ghost {
  opacity: 0.4;
}
```

```js
Sortable.create(list, {
  ghostClass: "ghost"
});
```


---


#### `chosenClass` option
Class name for the chosen item  (default `sortable-chosen`).

Demo: https://jsbin.com/hoqufox/edit?css,js,output

```css
.chosen {
  color: #fff;
  background-color: #c00;
}
```

```js
Sortable.create(list, {
  delay: 500,
  chosenClass: "chosen"
});
```


---


#### `forceFallback` option
If set to `true`, the Fallback for non HTML5 Browser will be used, even if we are using an HTML5 Browser.
This gives us the possibility to test the behaviour for older Browsers even in newer Browser, or make the Drag 'n Drop feel more consistent between Desktop , Mobile and old Browsers.

On top of that, the Fallback always generates a copy of that DOM Element and appends the class `fallbackClass` defined in the options. This behaviour controls the look of this 'dragged' Element.

Demo: https://jsbin.com/sibiput/edit?html,css,js,output


---


#### `fallbackTolerance` option
Emulates the native drag threshold. Specify in pixels how far the mouse should move before it's considered as a drag.
Useful if the items are also clickable like in a list of links.

When the user clicks inside a sortable element, it's not uncommon for your hand to move a little between the time you press and the time you release.
Dragging only starts if you move the pointer past a certain tolerance, so that you don't accidentally start dragging every time you click.

3 to 5 are probably good values.


---


#### `dragoverBubble` option
If set to `true`, the dragover event will bubble to parent sortables. Works on both fallback and native dragover event.
By default, it is false, but Sortable will only stop bubbling the event once the element has been inserted into a parent Sortable, or *can* be inserted into a parent Sortable, but isn't at that specific time (due to animation, etc).

Since 1.8.0, you will probably want to leave this option as false. Before 1.8.0, it may need to be `true` for nested sortables to work.


---


#### `removeCloneOnHide` option
If set to `false`, the clone is hidden by having it's CSS `display` property set to `none`.
By default, this option is `true`, meaning Sortable will remove the cloned element from the DOM when it is supposed to be hidden.


---


#### `emptyInsertThreshold` option
The distance (in pixels) the mouse must be from an empty sortable while dragging for the drag element to be inserted into that sortable. Defaults to `5`. Set to `0` to disable this feature.

Demo: https://jsbin.com/becavoj/edit?js,output

An alternative to this option would be to set a padding on your list when it is empty.

For example:
```css
ul:empty {
  padding-bottom: 20px;
}
```

Warning: For `:empty` to work, it must have no node inside (even text one).

Demo:
https://jsbin.com/yunakeg/edit?html,css,js,output

---
### Event object ([demo](https://jsbin.com/fogujiv/edit?js,output))

 - to:`HTMLElement` — list, in which moved element
 - from:`HTMLElement` — previous list
 - item:`HTMLElement` — dragged element
 - clone:`HTMLElement`
 - oldIndex:`Number|undefined` — old index within parent
 - newIndex:`Number|undefined` — new index within parent
 - oldDraggableIndex: `Number|undefined` — old index within parent, only counting draggable elements
 - newDraggableIndex: `Number|undefined` — new index within parent, only counting draggable elements
 - pullMode:`String|Boolean|undefined` — Pull mode if dragging into another sortable (`"clone"`, `true`, or `false`), otherwise undefined


#### `move` event object
 - to:`HTMLElement`
 - from:`HTMLElement`
 - dragged:`HTMLElement`
 - draggedRect:`DOMRect`
 - related:`HTMLElement` — element on which have guided
 - relatedRect:`DOMRect`
 - willInsertAfter:`Boolean` — `true` if will element be inserted after target (or `false` if before)


---


### Methods


##### option(name:`String`[, value:`*`]):`*`
Get or set the option.



##### closest(el:`HTMLElement`[, selector:`String`]):`HTMLElement|null`
For each element in the set, get the first element that matches the selector by testing the element itself and traversing up through its ancestors in the DOM tree.


##### toArray():`String[]`
Serializes the sortable's item `data-id`'s (`dataIdAttr` option) into an array of string.


##### sort(order:`String[]`, useAnimation:`Boolean`)
Sorts the elements according to the array.

```js
var order = sortable.toArray();
sortable.sort(order.reverse(), true); // apply
```


##### save()
Save the current sorting (see [store](#store))


##### destroy()
Removes the sortable functionality completely.


---


<a name="store"></a>
### Store
Saving and restoring of the sort.

```html
<ul>
	<li data-id="1">order</li>
	<li data-id="2">save</li>
	<li data-id="3">restore</li>
</ul>
```

```js
Sortable.create(el, {
	group: "localStorage-example",
	store: {
		/**
		 * Get the order of elements. Called once during initialization.
		 * @param   {Sortable}  sortable
		 * @returns {Array}
		 */
		get: function (sortable) {
			var order = localStorage.getItem(sortable.options.group.name);
			return order ? order.split('|') : [];
		},

		/**
		 * Save the order of elements. Called onEnd (when the item is dropped).
		 * @param {Sortable}  sortable
		 */
		set: function (sortable) {
			var order = sortable.toArray();
			localStorage.setItem(sortable.options.group.name, order.join('|'));
		}
	}
})
```


---


<a name="bs"></a>
### Bootstrap
Demo: https://jsbin.com/visimub/edit?html,js,output

```html
<!-- Latest compiled and minified CSS -->
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.1/css/bootstrap.min.css"/>


<!-- Latest Sortable -->
<script src="http://SortableJS.github.io/Sortable/Sortable.js"></script>


<!-- Simple List -->
<ul id="simpleList" class="list-group">
	<li class="list-group-item">This is <a href="http://SortableJS.github.io/Sortable/">Sortable</a></li>
	<li class="list-group-item">It works with Bootstrap...</li>
	<li class="list-group-item">...out of the box.</li>
	<li class="list-group-item">It has support for touch devices.</li>
	<li class="list-group-item">Just drag some elements around.</li>
</ul>

<script>
    // Simple list
    Sortable.create(simpleList, { /* options */ });
</script>
```


---


### Static methods & properties



##### Sortable.create(el:`HTMLElement`[, options:`Object`]):`Sortable`
Create new instance.


---


##### Sortable.active:`Sortable`
The active Sortable instance.


---


##### Sortable.dragged:`HTMLElement`
The element being dragged.


---


##### Sortable.ghost:`HTMLElement`
The ghost element.


---


##### Sortable.clone:`HTMLElement`
The clone element.


---


##### Sortable.get(element:`HTMLElement`):`Sortable`
Get the Sortable instance on an element.


---


##### Sortable.mount(plugin:`...SortablePlugin|SortablePlugin[]`)
Mounts a plugin to Sortable.


---


##### Sortable.utils
* on(el`:HTMLElement`, event`:String`, fn`:Function`) — attach an event handler function
* off(el`:HTMLElement`, event`:String`, fn`:Function`) — remove an event handler
* css(el`:HTMLElement`)`:Object` — get the values of all the CSS properties
* css(el`:HTMLElement`, prop`:String`)`:Mixed` — get the value of style properties
* css(el`:HTMLElement`, prop`:String`, value`:String`) — set one CSS properties
* css(el`:HTMLElement`, props`:Object`) — set more CSS properties
* find(ctx`:HTMLElement`, tagName`:String`[, iterator`:Function`])`:Array` — get elements by tag name
* bind(ctx`:Mixed`, fn`:Function`)`:Function` — Takes a function and returns a new one that will always have a particular context
* is(el`:HTMLElement`, selector`:String`)`:Boolean` — check the current matched set of elements against a selector
* closest(el`:HTMLElement`, selector`:String`[, ctx`:HTMLElement`])`:HTMLElement|Null` — for each element in the set, get the first element that matches the selector by testing the element itself and traversing up through its ancestors in the DOM tree
* clone(el`:HTMLElement`)`:HTMLElement` — create a deep copy of the set of matched elements
* toggleClass(el`:HTMLElement`, name`:String`, state`:Boolean`) — add or remove one classes from each element
* detectDirection(el`:HTMLElement`)`:String` — automatically detect the [direction](https://github.com/SortableJS/Sortable/wiki/Swap-Thresholds-and-Direction#direction) of the element as either `'vertical'` or `'horizontal'`
* index(el`:HTMLElement`, selector`:String`)`:Number` — index of the element within its parent for a selected set of elements
* getChild(el`:HTMLElement`, childNum`:Number`, options`:Object`, includeDragEl`:Boolean`):`HTMLElement` — get the draggable element at a given index of draggable elements within a Sortable instance
* expando`:String` — expando property name for internal use, sortableListElement[expando] returns the Sortable instance of that elemenet
---


### Plugins
#### Extra Plugins (included in complete versions)
 - [MultiDrag](https://github.com/SortableJS/Sortable/tree/master/plugins/MultiDrag)
 - [Swap](https://github.com/SortableJS/Sortable/tree/master/plugins/Swap)

#### Default Plugins (included in default versions)
 - [AutoScroll](https://github.com/SortableJS/Sortable/tree/master/plugins/AutoScroll)
 - [OnSpill](https://github.com/SortableJS/Sortable/tree/master/plugins/OnSpill)


---


<a name="cdn"></a>
### CDN

```html
<!-- jsDelivr :: Sortable :: Latest (https://www.jsdelivr.com/package/npm/sortablejs) -->
<script src="https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js"></script>
```


---


### Contributing (Issue/PR)

Please, [read this](CONTRIBUTING.md).


---


## Contributors

### Code Contributors

This project exists thanks to all the people who contribute. [[Contribute](CONTRIBUTING.md)].
<a href="https://github.com/SortableJS/Sortable/graphs/contributors"><img src="https://opencollective.com/Sortable/contributors.svg?width=890&button=false" /></a>

### Financial Contributors

Become a financial contributor and help us sustain our community. [[Contribute](https://opencollective.com/Sortable/contribute)]

#### Individuals

<a href="https://opencollective.com/Sortable"><img src="https://opencollective.com/Sortable/individuals.svg?width=890"></a>

#### Organizations

Support this project with your organization. Your logo will show up here with a link to your website. [[Contribute](https://opencollective.com/Sortable/contribute)]

<a href="https://opencollective.com/Sortable/organization/0/website"><img src="https://opencollective.com/Sortable/organization/0/avatar.svg"></a>
<a href="https://opencollective.com/Sortable/organization/1/website"><img src="https://opencollective.com/Sortable/organization/1/avatar.svg"></a>
<a href="https://opencollective.com/Sortable/organization/2/website"><img src="https://opencollective.com/Sortable/organization/2/avatar.svg"></a>
<a href="https://opencollective.com/Sortable/organization/3/website"><img src="https://opencollective.com/Sortable/organization/3/avatar.svg"></a>
<a href="https://opencollective.com/Sortable/organization/4/website"><img src="https://opencollective.com/Sortable/organization/4/avatar.svg"></a>
<a href="https://opencollective.com/Sortable/organization/5/website"><img src="https://opencollective.com/Sortable/organization/5/avatar.svg"></a>
<a href="https://opencollective.com/Sortable/organization/6/website"><img src="https://opencollective.com/Sortable/organization/6/avatar.svg"></a>
<a href="https://opencollective.com/Sortable/organization/7/website"><img src="https://opencollective.com/Sortable/organization/7/avatar.svg"></a>
<a href="https://opencollective.com/Sortable/organization/8/website"><img src="https://opencollective.com/Sortable/organization/8/avatar.svg"></a>
<a href="https://opencollective.com/Sortable/organization/9/website"><img src="https://opencollective.com/Sortable/organization/9/avatar.svg"></a>

## MIT LICENSE
Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
