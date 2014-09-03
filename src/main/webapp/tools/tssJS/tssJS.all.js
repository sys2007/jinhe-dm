(function(window, undefined) {

    var _tssJS = (function() {

        // 构建tssJS对象
        var tssJS = function(selector, parent) {
            return new tssJS.fn.init(selector, parent, rootTssJS);
        },

        version = "1.0.0",

        // Map over the $ in case of overwrite
        _$ = window.$,

        rootTssJS,

        // The deferred used on DOM ready
        readyList = [],

        // Check if a string has a non-whitespace character in it
        rnotwhite = /\S/,

        // Used for trimming whitespace
        trimLeft = /^\s+/,
        trimRight = /\s+$/,

        // JSON RegExp
        rvalidchars = /^[\],:{}\s]*$/,

        toString = Object.prototype.toString,
        trim = String.prototype.trim,
        push    = Array.prototype.push,
        slice   = Array.prototype.slice,     
        indexOf = Array.prototype.indexOf,

        ua = navigator.userAgent.toLowerCase(),
        mc = function(e) {
            return e.test(ua)
        },

        // [[Class]] -> type pairs
        class2type = {};

        // tssJS对象原型
        tssJS.fn = tssJS.prototype = {

            tssjs: version,

            constructor: tssJS,

            init: function(selector, parent, rootTssJS) {
                // Handle $(""), $(null), or $(undefined)
                if (!selector) {
                    return this;
                }

                // Handle $(DOMElement)
                if (selector.nodeType || selector === document) {
                    this[0] = selector;
                    this.length = 1;
                    return this;
                }

                if (typeof selector === "string") {
                    return this.find(selector, parent);
                }

                if (tssJS.isFunction(selector)) {
                    return rootTssJS.ready(selector);
                }
            },

            size: function() {
                return this.length;
            },

            each: function(callback, args) {
                return tssJS.each(this, callback, args);
            },

            ready: function(fn, args) {
                // Attach the listeners
                tssJS.bindReady.call(this, fn, args);

                return this;
            },
        };

        // Give the init function the tssJS prototype for later instantiation
        tssJS.fn.init.prototype = tssJS.fn;

        // 通过tssJS.fn.extend扩展的函数，大部分都会调用通过tssJS.extend扩展的同名函数
        tssJS.extend = tssJS.fn.extend = function(fnMap) {
            fnMap = fnMap || {};
            for (var name in fnMap) {
                this[name] = fnMap[name];
            }

            // Return the modified object
            return this;
        };

        // 在tssJS上扩展静态方法
        tssJS.extend({

            // 释放$的 tssJS 控制权
            // 许多 JavaScript 库使用 $ 作为函数或变量名，tssJS 也一样。
            // 在 tssJS 中，$ 仅仅是 tssJS 的别名，因此即使不使用 $ 也能保证所有功能性。
            // 假如我们需要使用 tssJS 之外的另一 JavaScript 库，我们可以通过调用 $.noConflict() 向该库返回控制权。
            noConflict: function(deep) {
                // 交出$的控制权
                if (window.$ === tssJS) {
                    window.$ = _$;
                }

                return tssJS;
            },

            // Is the DOM ready to be used? Set to true once it occurs.
            isReady: false,

            // Handle when the DOM is ready
            ready: function(fn, args) {
                if (!tssJS.isReady) {
                    // 确保document.body存在
                    if (!document.body) {
                        setTimeout(function() {
                            tssJS.ready(fn, args);
                        },
                        10);
                        return;
                    }

                    // Remember that the DOM is ready
                    tssJS.isReady = true;

                    // If there are functions bound, to execute
                    if (fn) {
                        fn(args);
                    } else {
                        tssJS.each(readyList,
                        function(i, name) {
                            var _ = readyList[i];
                            _.fn.call(_._this, _.args);
                        });

                        readyList = [];
                    }
                }
            },

            bindReady: function(fn, args) {
                readyList.push({
                    "_this": this,
                    "fn": fn,
                    "args": args
                });

                if (document.readyState === "complete") {
                    return setTimeout(tssJS.ready, 1);
                }

                document.addEventListener("DOMContentLoaded", DOMContentLoaded, false);
                window.addEventListener("load", tssJS.ready, false);
            },

            // 是否函数
            isFunction: function(obj) {
                return tssJS.type(obj) === "function";
            },

            // 是否数组
            isArray: Array.isArray ||
                function(obj) {
                    return tssJS.type(obj) === "array";
                },

            // 简单的判断（判断setInterval属性）是否window对象
            isWindow: function(obj) {
                return obj && typeof obj === "object" && "setInterval" in obj;
            },

            // 获取对象的类型
            type: function(obj) {
                // class2type[ "[object " + name + "]" ] = name.toLowerCase();
                return obj == null ? String(obj) : class2type[toString.call(obj)] || "object";
            },

            // 是否空对象
            isEmptyObject: function(obj) {
                for (var name in obj) {
                    return false;
                }
                return true;
            },

            isNullOrEmpty: function(value) {
                return (value == null || (typeof(value) == 'string' && value.trim() == ""));
            },

            // 抛出一个异常
            error: function(msg) {
                throw msg;
            },

            // parseJSON把一个字符串变成JSON对象。
            parseJSON: function(data) {
                if (typeof data !== "string" || !data) {
                    return null;
                }

                // Make sure leading/trailing whitespace is removed 
                data = tssJS.trim(data);

                // 原生JSON API。反序列化是JSON.stringify(object)
                if (window.JSON && window.JSON.parse) {
                    return window.JSON.parse(data);
                }

                // ... 大致地检查一下字符串合法性
                if (rvalidchars.test(data.replace(rvalidescape, "@").replace(rvalidtokens, "]").replace(rvalidbraces, ""))) {
                    return (new Function("return " + data))();
                }
                tssJS.error("Invalid JSON: " + data);
            },

            // 解析XML 
            parseXML: function(data) {
                var parser = new DOMParser();
                var xml = parser.parseFromString(data, "text/xml");

                var tmp = xml.documentElement;

                if (!tmp || !tmp.nodeName || tmp.nodeName === "parsererror") {
                    console.log("Invalid XML: " + data);
                }

                return xml;
            },

            // globalEval函数把一段脚本加载到全局context（window）中。
            // IE中可以使用window.execScript, 其他浏览器 需要使用eval。
            // 因为整个tssJS代码都是一整个匿名函数，所以当前context是tssJS，如果要将上下文设置为window则需使用globalEval。
            globalEval: function(data) {
                if (data && /\S/.test(data)) { // data非空
                    ( window.execScript || function(data) { window["eval"].call(window, data); } ) (data);
                }
            },

            "execCommand": function(callback, param) {
                var returnVal;
                try {
                    if(tssJS.isFunction(callback)) {
                        returnVal = callback(param);
                    }
                    else if(callback) {
                        var rightKH = callback.indexOf(")");
                        if(rightKH < 0 && param) {
                            callback = callback + "('" + param + "')";
                        }
                        returnVal = eval(callback);
                    }
                } catch (e) {
                    alert(e.message);
                    console.log(e.stack);
                    returnVal = false;
                }
                return returnVal;
            },

            // 遍历对象或数组
            each: function(object, callback, args) {
                var name, i = 0,
                length = object.length,
                isObj = length === undefined || tssJS.isFunction(object);

                // 如果有参数args，调用apply，上下文设置为当前遍历到的对象，参数使用args
                if (args) {
                    if (isObj) {
                        for (name in object) {
                            if (callback.apply(object[name], args) === false) {
                                break;
                            }
                        }
                    } else {
                        for (; i < length;) {
                            if (callback.apply(object[i++], args) === false) {
                                break;
                            }
                        }
                    }
                }
                // 没有参数args则调用，则调用call，上下文设置为当前遍历到的对象，参数设置为key/index和value
                else {
                    if (isObj) {
                        for (name in object) {
                            if (callback.call(object[name], name, object[name]) === false) {
                                break;
                            }
                        }
                    } else {
                        for (; i < length; i++) {
                            if (callback.call(object[i], i, object[i]) === false) {
                                break;
                            }
                        }
                    }
                }

                return object;
            },

            // 尽可能的使用本地String.trim方法，否则先过滤开头的空格，再过滤结尾的空格
            trim: trim ? function(text) { return trim.call(text); } :
                function(text) { return text.toString().replace(trimLeft, "").replace(trimRight, ""); },

            // 过滤数组，返回新数组；callback返回true时保留
            grep: function(elems, callback) {
                var ret = [],
                retVal;

                for (var i = 0, length = elems.length; i < length; i++) {
                    retVal = !!callback(elems[i], i);
                    if (retVal) {
                        ret.push(elems[i]);
                    }
                }

                return ret;
            },

            /* 缓存页面数据（xml、变量等） */
            "cache": {
                "Variables": {},
                "XmlDatas":  {}
            },

            /* 负责生成对象唯一编号（为了兼容FF） */
            "uid": 0,
            "getUniqueID": function(prefix) {
                return (prefix || "_") + String($.uid ++ );
            },

            // 获取当前时间的便捷函数
            now: function() {
                return (new Date()).getTime();
            },

            isIE: mc(/.net/),
            isChrome: mc(/\bchrome\b/),
            isWebKit: mc(/webkit/),
            supportCanvas: !!document.createElement('canvas').getContext,
            isMobile: mc(/ipod|ipad|iphone|android/gi),
        });

        // Populate the class2type map
        tssJS.each("Boolean Number String Function Array Date RegExp Object".split(" "),
        function(i, name) {
            class2type["[object " + name + "]"] = name.toLowerCase();
        });

        var DOMContentLoaded = (function() {
            return function() {
                document.removeEventListener("DOMContentLoaded", DOMContentLoaded, false);
                tssJS.ready();
            };
        })();

 
        rootTssJS = tssJS(document);

        // 到这里，tssJS对象构造完成，后边的代码都是对tssJS或tssJS对象的扩展
        return tssJS;

    })();

    /** -------------------------------- Add useful method --------------------------------------- */

    Array.prototype.each = function(fn, args) {
        $.each(this, fn, args);
        return this;
    };

    Array.prototype.contains = function(obj) {
        var i = this.length;
        while (i--) {
            if (this[i] === obj) {
                return true;
            }
        }
        return false;
    };

    Array.prototype.remove = function(item) {
        for(var i=0, n=0; i < this.length; i++) {
            if(this[i] != item) {
                this[n++] = this[i];
            }
        }
        this.length -= 1;
    };

    Date.prototype.format = function(format) {
        var o = {
            "M+": this.getMonth() + 1,
            "d+": this.getDate(),
            "h+": this.getHours(),
            "m+": this.getMinutes(),
            "s+": this.getSeconds(),
            "q+": Math.floor((this.getMonth() + 3) / 3),  // quarter
            "S": this.getMilliseconds()
        }

        if (/(y+)/.test(format)) {
            format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
        }

        for (var k in o) {
            if (new RegExp("(" + k + ")").test(format)) {
                format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
            }
        }
        return format;
    };

    window.tssJS = window.$ = _tssJS;

    window.$1 = window.$$ = function(id) {
        return $("#" + id.replace(/\./gi, "\\."))[0];
    }

})(window);


// 扩展tssJS原型方法
; (function($) {
    $.fn.extend({

        find: function(selector, parent) {
            parent = parent || document;
            var elements = parent.querySelectorAll(selector);

            this.length = elements.length;
            for (var i = 0; i < this.length; i++) {
                this[i] = elements[i];
            }

            return this;
        },

        //设置CSS
        css: function(attr, value) {
            for (var i = 0; i < this.length; i++) {
                var el = this[i];
                if (arguments.length == 1) {
                    return $.getStyle(el, attr);
                }
                el.style[attr] = value;
            }
            return this;
        },

        hasClass: function(className) {
            if(this.length == 0) {
                return false;
            }
            return $.hasClass(this[0], className);
        },

        // 添加Class
        addClass: function(className) {
            for (var i = 0; i < this.length; i++) {
                var element = this[i];
                if (!$.hasClass(element, className)) {
                    element.className += ' ' + className;
                }
            }
            return this;
        },

        // 移除Class
        removeClass: function(className) {
            var reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
            for (var i = 0; i < this.length; i++) {
                var element = this[i];
                if ($.hasClass(element, className)) {
                    element.className = element.className.replace(reg, ' ').trim();
                }
            }
            return this;
        },

        removeClasses: function(classNames) {
            var tjObj = this;
            classNames.split(",").each(function(i, className){
                tjObj.removeClass(className);
            });

            return this;
        },

        // 设置innerHTML
        html: function(str) {
            for (var i = 0; i < this.length; i++) {
                var element = this[i];
                if (arguments.length == 0) {
                    return element.innerHTML;
                }
                element.innerHTML = str;
            }
            return this;
        },

        // 设置鼠标移入移出方法
        hover: function(over, out) {
            for (var i = 0; i < this.length; i++) {
                $.Event.addEvent(this[i], 'mouseover', over);
                $.Event.addEvent(this[i], 'mouseout', out);
            }
            return this;
        },

        // 设置点击切换方法
        toggle: function() {
            for (var i = 0; i < this.length; i++) { 
                (function(element, args) {
                    var count = 0;
                    $.Event.addEvent(element, 'click', function() {
                        args[count++%args.length].call(this);
                    });
                })(this[i], arguments);
            }
            return this;
        },

        //设置显示
        show: function() {
            for (var i = 0; i < this.length; i++) {
                this[i].style.display = '';
            }
            return this;
        },

        //设置隐藏
        hide: function() {
            for (var i = 0; i < this.length; i++) {
                this[i].style.display = 'none';
            }
            return this;
        },

        // 设置物体居中
        center: function(width, height) {
            var top  = ($.getInner().height - (height || 100) ) / 2;
            var left = ($.getInner().width - (width || 100) ) / 2;
            for (var i = 0; i < this.length; i++) {
                this[i].style.position = "absolute";
                this[i].style.top  = top + 'px';
                this[i].style.left = left + 'px';
            }
            return this;
        },

        // 触发点击事件
        click: function(fn) {
            for (var i = 0; i < this.length; i++) {
                this[i].onclick = fn;
            }
            return this;
        },

        focus: function() {
            if(this.length > 0) {
                this[0].focus();
            }
        }
    });
})(tssJS);

// 扩展tssJS操作HTML DOMElement的静态方法
; (function($) {
    $.extend({

        hasClass: function(el, cn) {
            var reg = new RegExp('(\\s|^)' + cn + '(\\s|$)');
            return (' ' + el.className + ' ').match(reg);
        },

        // 获取视口大小
        getInner: function() {
            if (typeof window.innerWidth != 'undefined') {
                return {
                    width: window.innerWidth,
                    height: window.innerHeight
                }
            } else {
                return {
                    width: document.documentElement.clientWidth,
                    height: document.documentElement.clientHeight
                }
            }
        },

        // 获取Style。注：computedStyle: style 和 runtimeStyle 的结合
        getStyle: function(element, attr) {
            if (window.getComputedStyle) { // W3C
                return window.getComputedStyle(element, null)[attr];
            } 
            else if (element.currentStyle) { //IE
                return element.currentStyle[attr];
            }
            return null;
        },

        //  获取绝对位置
        absPosition: function(node) {
            var left, top, pEl = node;

            if (typeof node.getBoundingClientRect === 'function') {
                var clientRect = node.getBoundingClientRect();
                left = clientRect.left + window.pageXOffset;
                top = clientRect.bottom + window.pageYOffset;
            } else {
                left = pEl.offsetLeft;
                top = pEl.offsetTop + pEl.offsetHeight;
                while ((pEl = pEl.offsetParent)) {
                    left += pEl.offsetLeft;
                    top += pEl.offsetTop;
                }
            }
            return {
                "left": left,
                "top": top
            };
        },

        createElement: function(tagName, className) {
            var element = document.createElement(tagName);
            if (className) {
                $(element).addClass(className)
            }
            return element;
        },

        // 创建带命名空间的对象
        createNSElement: function(tagName, ns) {
            var tempDiv = document.createElement("DIV");
            tempDiv.innerHTML = "<" + ns + ":" + tagName + "/>";
            var element = tempDiv.firstChild.cloneNode(false);
            element.uniqueID = $.getUniqueID();

            $.removeNode(tempDiv);

            return element;
        },

        getNSElements: function(element, tagName, ns) {
            return element.getElementsByTagName(ns + ":" + tagName);
        },

        removeNode: function(node) {
            if (node == null) return;

            var parentNode = node.parentNode;
            if (parentNode) {
                parentNode.removeChild(node);
            }
        },

        /*
         * where：插入位置。包括afterBegin,afterEnd。
         * el：用于参照插入位置的html元素对象
         * html：要插入的html代码
         */
        insertHtml: function(where, el, html) {
            where = where.toLowerCase();
            if(el.insertAdjacentHTML) {
                el.insertAdjacentHTML(where, html);
                return;
            }

            var range = el.ownerDocument.createRange();
            var frag;
            switch(where){
                 case "afterbegin":
                    if(el.firstChild){
                        range.setStartBefore(el.firstChild);
                        frag = range.createContextualFragment(html);
                        el.insertBefore(frag, el.firstChild); 
                     } else {
                        el.innerHTML = html;
                     }
                    break;
                case "afterend":
                    range.setStartAfter(el);
                    frag = range.createContextualFragment(html);
                    el.parentNode.insertBefore(frag, el.nextSibling);
                    break;
            }
        },

        /* 动态创建脚本 */
        createScript: function(script) {
            var head = document.head || document.getElementsByTagName('head')[0];
            if( head ) {
                var scriptNode = $.createElement("script");
                $.XML.setText(scriptNode, script);
                head.appendChild(scriptNode);
            }
        },

        /* 设置透明度 */
        setOpacity: function(obj, opacity) {
            if(opacity == null || opacity == "") {
                opacity = 100;
            }

            if(window.DOMParser) {
                if(obj.style) {
                    obj.style.opacity = opacity / 100;
                }
            }
            else {
                obj.style.filter = "alpha(opacity=" + opacity + ")";
            }
        },

        waitingLayerCount: 0,

        showWaitingLayer: function () {
            var waitingObj = $("#_waiting");
            if(waitingObj.length == 0) {
                var waitingDiv = document.createElement("div");    
                waitingDiv.id = "_waiting";
                document.body.appendChild(waitingDiv);

                $(waitingDiv).css("width", "100%").css("height", "100%")
                             .css("position", "absolute").css("left", "0px").css("top", "0px")
                             .css("cursor", "wait").css("zIndex", "10000").css("background", "black");
                $.setOpacity(waitingDiv, 33);
            }
            else {
                waitingObj.css("display", "block");
            }

            $.waitingLayerCount ++;
        },

        hideWaitingLayer: function() {
            $.waitingLayerCount --;

            var waitingObj = $("#_waiting");
            if( waitingObj.length > 0 && $.waitingLayerCount <= 0 ) {
                waitingObj.css("display", "none");
            }
        }

    });
})(tssJS);

// 扩展tssJS 单元测试的静态方法
; (function($) {
    $.extend({
        /* 前台单元测试断言 */
        assertEquals: function(expect, actual, msg) {
            if (expect != actual) {
                $.error(msg + ": " + "[expect: " + expect + ", actual: " + actual + "]");
            }
        },

        assertTrue: function(result, msg) {
            if (!result && msg) {
                $.error(msg);
            }
        },

        assertNotNull: function(result, msg) {
            if (result == null && msg) {
                $.error(msg);
            }
        }
    });
})(tssJS);


/* 负责获取当前页面地址参数 */
; (function($) {

    $.extend({        
        Query: {
            items: {},

            get: function(name, decode) {
                var str = items[name];
                return decode ? unescape(str) : str; // decode=true，对参数值（可能为中文等）进行编码
            },

            init: function(queryString) {
                items = {}; // 先清空
                queryString = queryString || window.location.search.substring(1);

                var params = queryString.split("&");
                for (var i = 0; i < params.length; i++) {
                    var param = params[i].split("=");
                    items[param[0]] = param[1];
                }
            }
        }
    });

    $.Query.init();

})(tssJS);

/* 
 * 负责管理页面上cookie数据.
 * Chrome只支持在线网站的cookie的读写操作，对本地html的cookie操作是禁止的。
 */
; (function($) {

    $.extend({
        Cookie: {
            setValue: function(name, value, expires, path) {
                if (expires == null) {
                    var exp = new Date();
                    exp.setTime(exp.getTime() + 365 * 24 * 60 * 60 * 1000);
                    expires = exp.toGMTString();
                }

                path = path || "/";
                window.document.cookie = name + "=" + escape(value) + ";expires=" + expires + ";path=" + path;
            },

            getValue: function(name) {
                var value = null;
                var cookies = window.document.cookie.split(";");
                for (var i = 0; i < cookies.length; i++) {
                    var cookie = cookies[i];
                    var index = cookie.indexOf("=");
                    var curName = cookie.substring(0, index).replace(/^ /gi, "");
                    var curValue = cookie.substring(index + 1);

                    if (name == curName) {
                        value = unescape(curValue);
                    }
                }
                return value;
            },

            del: function(name, path) {
                var expires = new Date(0).toGMTString();
                this.setValue(name, "", expires, path);
            },

            delAll: function(path) {
                var cookies = window.document.cookie.split(";");
                for (var i = 0; i < cookies.length; i++) {
                    var cookie = cookies[i];
                    var index = cookie.indexOf("=");
                    var curName = cookie.substring(0, index).replace(/^ /gi, "");
                    $.Cookie.del(curName, path);
                }
            }

        }
    });
})(tssJS);

/*********************************** 事件（Event）函数  start **********************************/
;(function($){

    $.extend({
        Event: {
            MOUSEDOWN: 1,
            MOUSEUP: 2,
            MOUSEOVER: 4,
            MOUSEOUT: 8,
            MOUSEMOVE:16,
            MOUSEDRAG: 32,

            timeout: {},

            addEvent: function(element, eventName, fn, capture) {
                element.addEventListener(eventName, fn, !!capture);
            },

            removeEvent: function(element, eventName, fn, capture) {
                element.removeEventListener(eventName, fn, !!capture);
            },

            /* 取消事件 */
            cancel: function(event) { 
                if (event.preventDefault) {
                    event.preventDefault();
                } else {
                    event.returnValue = false;
                }
            },

            // 获得事件触发对象
            getSrcElement: function(eventObj) {
                return eventObj.target || eventObj.srcElement;
            },

            /* 使事件始终捕捉对象。设置事件捕获范围。 */
            setCapture: function(srcElement, eventType) {
                if (srcElement.setCapture) {             
                    srcElement.setCapture();         
                } 
                else if (window.captureEvents) {           
                    window.captureEvents(eventType);         
                }
            },

            /* 使事件放弃始终捕捉对象。 */
            releaseCapture: function(srcElement, eventType) {
                if(srcElement.releaseCapture){
                    srcElement.releaseCapture();
                }
                else if(window.captureEvents) {
                    window.captureEvents(eventType);
                }
            },

            /* 阻止事件向上冒泡 */
            cancelBubble: function(eventObj) {
                if( eventObj.stopPropagation ) {
                    eventObj.stopPropagation();
                }
                else {
                    eventObj.cancelBubble = true;
                }
            },

            /** 模拟事件 */
            createEventObject: function() { return new Object(); }
        }
    });

    $.extend({

        EventFirer: function(obj, eventName) {
            this.fire = function (event) {
                var func = obj[eventName];
                if( func ) {
                    var funcType = typeof(func);
                    if("string" == funcType) {
                        return eval(func);
                    }
                    else if ("function" == funcType) {
                        if(event) event._source = obj;
                        return func(event);
                    }
                }
            }
        }

    });

})(tssJS);

/*********************************** 事件（Event）函数  end **********************************/

/*********************************** XML相关操作函数  start **********************************/

;(function($) {

    String.prototype.convertEntry = function() {
        return this.replace(/\&/g, "&amp;").replace(/\"/g, "&quot;").replace(/\</g, "&lt;").replace(/\>/g, "&gt;");
    }

    String.prototype.revertEntity = function() {
        return this.replace(/&quot;/g, "\"").replace(/&lt;/g, "\<").replace(/&gt;/g, "\>").replace(/&amp;/g, "\&");
    }

    String.prototype.convertCDATA = function() {
        return this.replace(/\<\!\[CDATA\[/g, "&lt;![CDATA[").replace(/\]\]>/g, "]]&gt;");
    }

    String.prototype.revertCDATA = function() {
        return this.replace(/&lt;\!\[CDATA\[/g, "<![CDATA[").replace(/\]\]&gt;/g, "]]>");
    }

    $.extend({

        XML : {
            _NODE_TYPE_ELEMENT    : 1,
            _NODE_TYPE_ATTRIBUTE  : 2,
            _NODE_TYPE_TEXT       : 3,
            _NODE_TYPE_CDATA      : 4,
            _NODE_TYPE_COMMENT    : 8,
            _NODE_TYPE_DOCUMENT   : 9,

            /* 将字符串转化成xml节点对象 */
            toNode: function(xml) {
                xml = xml.revertEntity();
                return $.parseXML(xml).documentElement;
            },

            toString: function(element) {
                return $.XML.toXml(element);
            },

            getText: function(node) {
                return node.text || node.textContent || ""; // chrome 用 textContent
            },

            setText: function(node, textValue) {
                node.text = textValue;
                if (node.textContent || node.textContent == "") {
                    node.textContent = textValue; // chrome
                }
            },

            EMPTY_XML_DOM: (function() {
                var parser = new DOMParser();
                var xmlDom = parser.parseFromString("<null/>", "text/xml");
                xmlDom.parser = parser;
 
                return xmlDom;
            })(),

            createNode: function(name) {
                return $.XML.EMPTY_XML_DOM.createElement(name);
            },

            createCDATA: function(data) {
                if(window.DOMParser) {
                    return $.XML.toNode("<root><![CDATA[" + data + "]]></root>").firstChild;
                }
                else {
                    return $.XML.EMPTY_XML_DOM.createCDATASection(data);
                }
            },

            appendCDATA: function(name, data) {
                var xmlNode   = $.XML.createNode(name);
                var cdataNode = $.XML.createCDATA(data);
                xmlNode.appendChild(cdataNode);
                return xmlNode;
            },

            getCDATA: function(pnode, name) {
                var node = pnode.getElementsByTagName(name)[0];
                node = node || pnode;

                var cdataValue = $.XML.getText(node);
                return cdataValue.revertCDATA();
            },

            setCDATA: function(pnode, name, value) {               
                var cdateNode = $.XML.appendCDATA(name, value);

                var oldNode = pnode.getElementsByTagName(name)[0];
                if(oldNode == null) {
                    pnode.appendChild(cdateNode);
                }
                else {
                    $.removeNode(oldNode.firstChild);
                    oldNode.appendChild(cdateNode);
                }
            },

            removeCDATA: function(pnode, name) {
                var node = pnode.getElementsByTagName(name)[0];
                if( node ) {
                    pnode.removeChild(node);
                }
            },

            /* 获取解析错误 */
            getParseError: function(xmlDom) {
                if(xmlDom == null) return "";

                var errorNodes = xmlDom.getElementsByTagName("parsererror");
                if(errorNodes.length > 0) {
                    return errorNodes[0].innerHTML;
                }
                return "";
            },

            toXml: function(xml) {
                var xmlSerializer = new XMLSerializer();
                return xmlSerializer.serializeToString(xml.documentElement || xml);
            }
        }
    });

})(tssJS);


/*
    $.ajax({
        url : url,
        method : "GET",
        headers : {},
        params  : {}, 
        formNode : formNode,
        ondata : function() { },
        onresult : function() { },
        onexception : function() { },
        onsuccess : function() { }
    });
*/
;(function ($, factory) {

    $.HttpRequest = factory($);

    $.ajax = function(arg) {
        var request = new $.HttpRequest();
        request.url = arg.url;
        request.type = arg.type;
        request.method = arg.method || "POST";
        request.waiting = arg.waiting || false;
        request.async = arg.async || true;

        request.params  = arg.params  || {};
        request.headers = arg.headers || {};

        if(arg.formNode) {
            request.setFormContent(arg.formNode);
        }

        request.ondata = arg.ondata || request.ondata;
        request.onresult = arg.onresult || request.onresult;
        request.onsuccess = arg.onsuccess || request.onsuccess;
        request.onexception = arg.onexception || function(errorMsg) {
                // alert(errorMsg.description); // 遇到异常却看不到任何信息，可尝试放开这里的注释
            };

        request.send();
    };

    $.Ajax = $.AJAX = $.ajax;

})(tssJS, function ($) {

    'use strict';

    var 
    /* 通讯用XML节点名 */
    _XML_NODE_RESPONSE_ROOT    = "Response",
    _XML_NODE_REQUEST_ROOT     = "Request",
    _XML_NODE_RESPONSE_ERROR   = "Error",
    _XML_NODE_RESPONSE_SUCCESS = "Success",
    _XML_NODE_REQUEST_NAME     = "Name",
    _XML_NODE_REQUEST_VALUE    = "Value",
    _XML_NODE_REQUEST_PARAM    = "Param",

    /* HTTP响应解析结果类型 */
    _HTTP_RESPONSE_DATA_TYPE_EXCEPTION = "exception",
    _HTTP_RESPONSE_DATA_TYPE_SUCCESS = "success",
    _HTTP_RESPONSE_DATA_TYPE_DATA = "data",

    /* HTTP响应状态 */
    _HTTP_RESPONSE_STATUS_LOCAL_OK  = 0,    // 本地OK
    _HTTP_RESPONSE_STATUS_REMOTE_OK = 200,  // 远程OK

    /* HTTP超时(1分钟) */
    _HTTP_TIMEOUT = 1*60*1000,

 
    /*
     *  XMLHTTP请求对象，负责发起XMLHTTP请求并接收响应数据。例:
            var request = new HttpRequest();
            request.url = URL_GET_USER_NAME;
            request.addParam("loginName", loginName);
            request.setHeader("appCode", APP_CODE);

            request.onresult = function(){
                // 处理响应结果
            }
            request.send();
     */
    HttpRequest = function() {
        this.url;
        this.method = "POST";
        this.type   = "xml"; // "xml or json"
        this.async  = true;
        this.params = {};
        this.header = {};
        this.waiting = false;

        this.responseText;
        this.responseXML;

        if( window.XMLHttpRequest ) {
            this.xmlhttp = new XMLHttpRequest();
        } 
        else {
            alert("您的浏览器版本过旧，不支持XMLHttpRequest，请先升级浏览器。");
        }
    };

    HttpRequest.prototype = {

        /* 设置请求头信息  */
        setHeader: function(name, value) {
            this.header[name] = value;
        },

        addParam: function(name, value) {
            this.params[name] = value;
        },

        /* 设置xform专用格式发送数据 */
        setFormContent: function(dataNode) {
            if(dataNode == null || dataNode.nodeName != "data") return;

            var nodes = dataNode.querySelectorAll("row *");
            for(var i = 0; i < nodes.length; i++) {
                var node = nodes[i];
                this.addParam(node.nodeName, $.XML.getText(node));
            }
        },

        /* 获取响应数据源代码 */
        getResponseText: function() {
            return this.responseText;
        },

        /* 获取响应数据XML文档 */
        getResponseXML: function() {
            return this.responseXML;
        },

        getResponseJSON: function() {
            return $.parseJSON(this.responseText);
        },

        /*
         *  获取响应数据XML文档指定节点对象值
         *  参数： string:name             指定节点名
         *  返回值：any:value               根据节点内容类型不同而定
         */
        getNodeValue: function(name) {
            if(this.responseXML == null) return;

            var node = this.responseXML.querySelector(_XML_NODE_RESPONSE_ROOT + ">" + name);
            if(node == null) return;

            var data;
            var childNodes = node.childNodes; 
            for(var i = 0; i < childNodes.length; i++) {
                var childNode = childNodes[i];
                switch (childNode.nodeType) {
                    case $.XML._NODE_TYPE_TEXT:
                        if(childNode.nodeValue.replace(/\s*/g, "") != "") {
                            data = childNode;
                        }
                        break;
                    case $.XML._NODE_TYPE_ELEMENT:
                    case $.XML._NODE_TYPE_CDATA:
                        data = childNode;
                        break;
                }
                
                if( data ) break;
            }

            if( data ) {
                switch(data.nodeType) {
                    case $.XML._NODE_TYPE_ELEMENT:
                        return data;
                    case $.XML._NODE_TYPE_TEXT:
                    case $.XML._NODE_TYPE_CDATA:
                        return data.nodeValue;
                }
            }
        },

        /* 发起XMLHTTP请求 */
        send: function(wait) {
            var oThis = this;

            try {
                if(this.waiting) {
                    $.showWaitingLayer();
                }

                this.xmlhttp.onreadystatechange = function() {
                    if(oThis.xmlhttp.readyState == 4) {
                        oThis.clearTimeout();

                        var response = {};
                        response.responseText = oThis.xmlhttp.responseText;
                        response.responseXML  = oThis.xmlhttp.responseXML;
                        response.status       = oThis.xmlhttp.status;
                        response.statusText   = oThis.xmlhttp.statusText;

                        if(oThis.isAbort) {
                            $.hideWaitingLayer();
                        }
                        else {
                            setTimeout( function() {
                                oThis.abort();

                                $.hideWaitingLayer();
                                oThis.onload(response);

                            }, 100);
                        }
                    }
                }

                this.xmlhttp.open(this.method, this.url, this.async);
                 
                this.setTimeout(); // 增加超时判定
                this.packageRequestParams();
                this.customizeRequestHeader();

                this.xmlhttp.send(this.requestBody);
            } 
            catch (e) {
                $.hideWaitingLayer();

                var result = {
                    dataType: _HTTP_RESPONSE_DATA_TYPE_EXCEPTION,
                    type: 1,
                    msg: e.description || e.message
                };

                this.onexception(result);
            }
        },

        /* 超时中断请求 */
        setTimeout: function(noConfirm) {
            var oThis = this;

            this.timeout = setTimeout(function() {
                if(noConfirm != true && confirm("服务器响应较慢，需要中断请求吗？") == true) {
                    oThis.isAbort = true;
                    oThis.abort();
                    oThis.isAbort = false;
                }
                else {
                    oThis.clearTimeout();
                    oThis.setTimeout(true);
                }
            }, _HTTP_TIMEOUT);
        },

        /* 清除超时 */
        clearTimeout: function() {
            clearTimeout(this.timeout);
        },

        /* 对发送数据进行封装，以XML格式发送 */
        packageRequestParams: function() {
            var contentXml = $.parseXML("<" + _XML_NODE_REQUEST_ROOT+"/>");
            var contentXmlRoot = contentXml.documentElement;
         
            for(var name in this.params) {
                var value = this.params[name];
                if(value) {
                    var paramNode = $.XML.createNode(_XML_NODE_REQUEST_PARAM);
                    paramNode.appendChild($.XML.appendCDATA(_XML_NODE_REQUEST_NAME, name));
                    paramNode.appendChild($.XML.appendCDATA(_XML_NODE_REQUEST_VALUE, value));

                    contentXmlRoot.appendChild(paramNode);
                }
            }

            this.requestBody = $.XML.toXml(contentXml);
        },

        /* 自定义请求头信息 */
        customizeRequestHeader: function() {
            this.xmlhttp.setRequestHeader("REQUEST-TYPE", "xmlhttp");
            this.xmlhttp.setRequestHeader("CONTENT-TYPE", "text/xml");
            this.xmlhttp.setRequestHeader("CONTENT-TYPE", "application/octet-stream");

            // 设置header里存放的参数到requestHeader中
            $.each(this.header, function(item, itemValue) {
                try {
                    this.xmlhttp.setRequestHeader( item, String(itemValue) );
                } catch (e) { // chrome往header里设置中文会报错
                }
            });

            // 当页面url具有参数token则加入Cookie（可用于跨应用转发，见redirect.html）
            var token = $.Query.get("token");
            if( token ) {
                var exp = new Date();  
                exp.setTime(exp.getTime() + (30*1000));
                var expires = exp.toGMTString();  // 过期时间设定为30s
                $.Cookie.setValue("token", token, expires, "/" + CONTEXTPATH);
            }
        },

        /*
         *  加载数据完成，对结果进行处理
         *  参数： Object:response     该对象各属性值继承自xmlhttp对象
         */
        onload: function(response) {
            this.responseText = response.responseText;

            //远程(200) 或 本地(0)才允许
            var httpStatus = response.status; 
            if(httpStatus != _HTTP_RESPONSE_STATUS_LOCAL_OK && httpStatus != _HTTP_RESPONSE_STATUS_REMOTE_OK) {
                var param = {
                    dataType: _HTTP_RESPONSE_DATA_TYPE_EXCEPTION,
                    type: 1,
                    source: this.responseText,
                    msg: "HTTP " + httpStatus + " 错误\r\n" + response.statusText,
                    description: "请求远程地址\"" + this.url + "\"出错"
                };

                new Message_Exception(param, this);
                return;
            }

            // JSON数据：因json的请求返回数据非XML格式，但出异常时异常信息是XML格式，所以如果没有异常，则直接执行ondata
            if(this.type == "json" && this.responseText.indexOf("<Error>") < 0) {
                this.ondata();
                return;
            }

            // XML数据：解析返回结果，判断是success、error or 普通XML数据
            var rp = new HTTP_Response_Parser(this.responseText);
            this.responseXML = rp.xmlValueDom;

            if(rp.result.dataType == _HTTP_RESPONSE_DATA_TYPE_EXCEPTION) {
                new Message_Exception(rp.result, this);
            }
            else if(rp.result.dataType == _HTTP_RESPONSE_DATA_TYPE_SUCCESS) {
                new Message_Success(rp.result, this);
            }
            else {
                this.ondata();
                this.onresult();

                // 当返回数据中含脚本内容则自动执行
                var script = this.getNodeValue("script");
                if( script ) {
                    $.createScript(script); // 创建script元素并添加到head中.
                }
            }
        },

        // 定义空方法做为默认的回调方法
        ondata: function() { },
        onresult: function() { },
        onsuccess: function() { },
        onexception: function() { },

        /* 终止XMLHTTP请求 */
        abort: function() {
            if( this.xmlhttp ) {
                this.xmlhttp.abort();
            }
        }
    };

    var 

    /*
     *  对象名称：HTTP_Response_Parser对象
     *  职责：负责分析处理后台响应数据
     *
     *  成功信息格式：
     *  <Response>
     *      <Success>
     *          <type>1</type>
     *          <msg><![CDATA[ ]]></msg>
     *          <description><![CDATA[ ]]></description>
     *      </Success>
     *  </Response>
     *
     *  错误信息格式：
     *  <Response>
     *      <Error>
     *          <type>1</type>
     *          <relogin>1</relogin>
     *          <msg><![CDATA[ ]]></msg>
     *          <description><![CDATA[ ]]></description>
     *      </Error>
     *  </Response>
     */
    HTTP_Response_Parser = function(responseText) {
        this.source = responseText;
        this.result = {};

        try {
            this.xmlValueDom = $.parseXML(responseText);
        } catch (e) {
            console.log(e);
            this.result.dataType = _HTTP_RESPONSE_DATA_TYPE_EXCEPTION;
            this.result.source = this.source;
            this.result.msg = "服务器异常";
            this.result.description = $.XML.getParseError(this.xmlValueDom);
            return;
        }
 
        var responseNode = this.xmlValueDom.querySelector(_XML_NODE_RESPONSE_ROOT);
        var isSuccessOrError = false;

        if(responseNode) {
            if( responseNode.querySelector(_XML_NODE_RESPONSE_ERROR) ) { // Error
                this.result.dataType = _HTTP_RESPONSE_DATA_TYPE_EXCEPTION;
                this.result.source = this.source;
                isSuccessOrError = true;
            }
            else if( responseNode.querySelector(_XML_NODE_RESPONSE_SUCCESS) ) { // Success
                this.result.dataType = _HTTP_RESPONSE_DATA_TYPE_SUCCESS;
                isSuccessOrError = true;
            } 
        }
 
        if(isSuccessOrError) {
            var detailNodes = responseNode.querySelectorAll("* * *");
            var oThis = this;
            $.each(detailNodes, function(index, node) {
                oThis.result[node.nodeName] = $.XML.getText(node);
            });
        } 
        else {
            this.result.dataType = _HTTP_RESPONSE_DATA_TYPE_DATA; //  1:普通XML数据节点（非Success、Erroe）; 2:非XML（text、json）
        }
    },

    /*
     *  对象名称：Message_Success对象
     *  职责：负责处理成功信息
     */
    Message_Success = function(info, request) {
        request.ondata();

        var str = [];
        str[str.length] = "Success";
        str[str.length] = "msg=\""  + info.msg  + "\"";

        if( info.type != "0" ) {
            
            alert(info.msg, str.join("\r\n"));

            // 3秒后自动自动隐藏成功提示信息
            setTimeout(function() {
                $("#X-messageBox").css("display", "none");
            }, 3000);
        }

        request.onsuccess(info);
    },

    /*
     *  对象名称：Message_Exception对象
     *  职责：负责处理异常信息
     *
     *  注意：本对象除了展示异常信息（通过alert方法，window.alert=Alert，Alert在framework.js里做了重新定义）外，
     *  还可以根据是否需要重新登录来再一次发送request请求，注意此处参数Message_Exception(param, request)，该
     *  request依然还是上一次发送返回异常信息的request，将登陆信息加入后（loginName/pwd等，通过_relogin.htm页面获得），
     *  再一次发送该request请求，从而通过AutoLoginFilter的验证，取回业务数据。  
     *  这样做的好处是，当session过期需要重新登陆时，无需离开当前页面回到登陆页登陆，保证了用户操作的连贯性。
     * 
     * info.type：(参考 ErrorMessageEncoder)
     * <li>1－普通业务逻辑错误信息，没有异常发生的
     * <li>2－有异常发生，同时被系统捕获后添加友好错误消息的
     * <li>3－其他系统没有预见的异常信息
     */
    Message_Exception = function(info, request) {
        var str = [];
        str[str.length] = "Error";
        str[str.length] = "type=\"" + info.type + "\"";
        str[str.length] = "msg=\"" + info.msg + "\"";
        str[str.length] = "description=\"" + info.description + "\"";
        str[str.length] = "source=\"" + (info.source || "") + "\"";

        if( info.msg && info.type != "0" && info.relogin != "1") {
            alert(info.msg, str.join("\r\n"));
        }

        request.onexception(info);

        // 是否需要重新登录
        if(info.relogin == "1") {
            /* 重新登录前，先清除token cookie，防止在门户iframe登录平台应用（如DMS），而'/tss'目录下的token依旧是过期的，
             * 这样再次点击菜单（需redirect.html跳转的菜单）时还是会要求重新登录。 */
            Cookie.del("token", "");
            Cookie.del("token", "/");
            Cookie.del("token", "/" + FROMEWORK_CODE.toLowerCase());
            Cookie.del("token", "/" + CONTEXTPATH);
            
            popupMessage(info.msg);
            relogin(request);
        }

        function popupMessage(msg) {
            if(window._alert) {
                _alert(msg);
            }
            else {
                alert(msg);
            }
        }

        function relogin(request) {
            var reloginBox = $("#relogin_box")[0];
            if(reloginBox == null) {
                var boxHtml = [];
                boxHtml[boxHtml.length] = "<h1>重新登录</h1>";
                boxHtml[boxHtml.length] = "<span> 用户名：<input type='text' id='loginName' placeholder='请输入您的账号'/> </span>";
                boxHtml[boxHtml.length] = "<span> 密&nbsp; 码：<input type='password' id='password' placeholder='请输入您的密码' /> </span>";
                boxHtml[boxHtml.length] = "<span class='bottonBox'>";
                boxHtml[boxHtml.length] = "  <input type='button' class='btLogin' id='bt_login' value='确 定'/>&nbsp;&nbsp;";
                boxHtml[boxHtml.length] = "  <input type='button' id='bt_cancel' value='取 消'/>";
                boxHtml[boxHtml.length] = "</span>";

                reloginBox = $.createElement("div", "popupBox");    
                reloginBox.id = "relogin_box";    
                reloginBox.innerHTML = boxHtml.join("");

                document.body.appendChild(reloginBox);
            }

            // 显示登录框
            reloginBox.style.display = "block";
            var loginNameObj = $("#loginName")[0];
            var passwordObj  = $("#password")[0];
            loginNameObj.focus();
            passwordObj.value = ""; // 清空上次输入的密码，以防泄密
            
            loginNameObj.onblur = function() { 
                var value = this.value;
                if(value == null || value == "") return;
                
                if(loginNameObj.identifier) {
                    delete loginNameObj.identifier;
                }
                
                Ajax({
                    url: "/" + CONTEXTPATH + "getLoginInfo.in",
                    headers:  {"appCode": FROMEWORK_CODE || 'TSS'},
                    contents: {"loginName": value},
                    onexcption: function() {
                        loginNameObj.focus();
                    },
                    onresult: function(){
                        loginNameObj.identifier = this.getNodeValue("ClassName");
                        passwordObj.focus();
                    }
                });
            }

            $("#bt_cancel").click(function() {
                reloginBox.style.display = "none";
            });

            $("#bt_login").click(doLogin);

            $.Event.addEvent(document, "keydown", function(eventObj) {
                if(13 == eventObj.keyCode) { // enter
                    $.Event.cancel(event);
                    $("#bt_login").focus();

                    setTimeout(doLogin, 10);
                }
            });
            
            var doLogin = function() {
                var loginName = loginNameObj.value;
                var password  = passwordObj.value;
                var identifier = loginNameObj.identifier;
                
                if( "" == loginName ) {
                    popupMessage("请输入账号");
                    loginNameObj.focus();
                    return;
                } 
                else if( "" == password ) {
                    popupMessage("请输入密码");
                    passwordObj.focus();
                    return;
                } 
                else if( identifier == null ) {
                    popupMessage("无法登录，用户配置可能有误，请联系管理员。");
                    return;
                } 

                request.setHeader("loginName", loginName);
                request.setHeader("password",  password);
                request.setHeader("identifier", identifier);
                request.send();

                reloginBox.style.display = "none";
            }
        }
    }   

    return HttpRequest;
});



;(function ($, factory) {

    $.Balloon = factory();

})(tssJS, function () {

    'use strict';

    var
        /* 样式名称 */
        _STYLE_BALLOON = "balloon",
     
        /* 尺寸 */
        _SIZE_BALLOON_ARROW_HEIGHT = 15,
        _SIZE_BALLOON_CONTENT_WIDTH = 210,
        _SIZE_BALLOON_CONTENT_HEIGHT = 44,

        NEXT_ZINDEX = 1000,

        timeout, 

        /* 释放气球实例 */
        dispose = function() {
            var balloons = $("." + _STYLE_BALLOON);
            balloons.each(function() {
                $.removeNode(this);
            });
            
            $.Event.removeEvent(document, "mousedown", dispose);
        },
 
        /* 生成气球型提示界面 */
        Balloon = function (content) {
            this.object = $.createElement("div", _STYLE_BALLOON);

            var html = "<table>";
            html += "   <tr><td></td></tr>";
            html += "   <tr><td class='content'><div>" + content + "</div></td></tr>";        
            html += "   <tr><td></td></tr>";
            html += "</table>";
            this.object.innerHTML = html;

            // 绑定事件，鼠标按下后气球消失
            $.Event.addEvent(document, "mousedown", dispose);
        };
     
        /*
         *  定位气球
         *  参数：  number:x       坐标x
                    number:y        坐标y
                    number:delay    延时
                    ------------------------------------
                    object:x        作为参考点的目标对象
                    number:y        延时
         */
        Balloon.prototype.dockTo = function(x, y, delay) {
            if(typeof(x) == "object" && x.nodeType) {
                var position = $.absPosition(x);
                this.dockTo(position.left + x.offsetWidth/2, position.top - x.offsetHeight + 8, y);
            }
            else if(typeof(x) == "number") {
                var type = 1;
                if( (x + _SIZE_BALLOON_CONTENT_WIDTH) > (document.body.clientWidth + document.body.scrollLeft) ) {
                    x -= _SIZE_BALLOON_CONTENT_WIDTH;
                    type += 1;
                }
                if( (y - _SIZE_BALLOON_CONTENT_HEIGHT - _SIZE_BALLOON_ARROW_HEIGHT) < document.body.scrollTop) {
                    type += 2;
                }
                else {
                    y -= _SIZE_BALLOON_CONTENT_HEIGHT + _SIZE_BALLOON_ARROW_HEIGHT;            
                }

                $(this.object).css("zIndex", NEXT_ZINDEX++).css("left", x + "px").css("top", y + "px");

                /* 添加气球箭头  */
                var arrow = $.createElement("div", "arrow_" + type);
                $(arrow).css("width", "30px").css("height", "15px") ;

                var td = $("tr", this.object)[ (type <= 2) ? 2 : 0].childNodes[0];
                td.appendChild(arrow);
                if(type == 1 || type == 3) {
                    td.insertBefore(arrow, td.firstChild);
                } else {
                    td.align = "right";
                }

                // 设置气球持续时间
                clearTimeout(timeout);
                timeout = setTimeout( dispose, delay || 3000);

                document.body.appendChild(this.object);
            }
        };
    
    return Balloon;
});


/* 右键菜单 */

;(function ($, factory) {

    $.Menu = factory();

})(tssJS, function () {

    'use strict';

    var
    /* 样式名称 */
    CSS_CLASS_MENU = "menu",
    CSS_CLASS_MENU_ITEM_ACITVE = "active",
    CSS_CLASS_MENU_SEPARATOR = "separator",

    /* 菜单唯一编号名前缀 */
    _UNIQUE_ID_MENU_PREFIX = "_menu_id",
    _UNIQUE_ID_ITEM_PREFIX = "_item_id",

    Menus = {
        menuZIndex: 1001,
        collection: {},
        add: function(menu) {
            Menus.collection[menu.id] = menu;
        },
        del: function(menu) {
            delete Menus.collection[menu.id];
        },
        inactiveAllMenus: function() {
            for(var menuId in this.collection) {
                Menus.collection[menuId].inactive();
            }
        },
        hideAllMenus: function() {
            for(var menuId in this.collection) {
                Menus.collection[menuId].hide();
            }
        },

        // 根据菜单项ID获取所属Menu实例
        getMenuByItemID: function(id) {
            for(var menuId in this.collection) {
                var curMenu = this.collection[menuId];
                var menuItem = curMenu.items[id];
                if(menuItem) {
                    return curMenu;
                }
            }
        }
    },

    Menu = function() {
        this.items = {};
        this.parentMenuItem; //submenu所属的菜单项

        this.id = $.getUniqueID(_UNIQUE_ID_MENU_PREFIX);
        this.object = $.createElement("div", CSS_CLASS_MENU);
        this.object.id = this.id;

        this.isActive = false;
        this.setVisible(false);
        
        // 绑定事件
        this.object.onselectstart = _Menu_onSelectStart;
        $.Event.addEvent(document, "mousedown", _Menu_Document_onMouseDown);
        $.Event.addEvent(window, "resize", _Menu_Window_onResize);
        
        Menus.add(this);
    };
        
    Menu.prototype = {
            
        /*
         *  将实例绑定到指定对象
         *  参数：  object:srcElement       HTML对象
                    string:eventName        事件名称
         */
        attachTo: function(srcElement, eventName) {
            this.srcElement = srcElement;
            
            var thisObj = this;
            $.Event.addEvent(srcElement, eventName, function(eventObj) {
                $.Event.cancel(eventObj);

                var x = eventObj.clientX + document.body.scrollLeft;
                var y = eventObj.clientY + document.body.scrollTop;
                thisObj.show(x, y);
            });
        },

        /*
         *  显示菜单
         *  参数：  number:x            菜单参考点位置
                    number:y            菜单参考点位置
         */
        show: function(x, y) {
            Menus.inactiveAllMenus();
            
            var visibleItemsCount = this.refreshItems();
            if(0 == visibleItemsCount) {
                return;
            }

            this.active();

            if( $("#" + this.id).length == 0 ) {
                document.body.appendChild(this.object);
            }

            this.object.style.zIndex = Menus.menuZIndex++;

            this.moveTo(x, y);
            this.setVisible(true);
        },

        hide: function() {
            this.setVisible(false);
            this.moveTo(0, 0);
            this.inactive();
        },

        moveTo: function(x, y) {
            this.object.style.left = x + "px";
            this.object.style.top  = y + "px";
        },

        /* 激活当前菜单 */
        active: function() {
            this.isActive = true;
        },

        inactive: function() {
            this.isActive = false;
        },

        /* 不激活当前菜单的所有菜单项 */
        inactiveAllItems: function() {
            for(var key in this.items) {
                this.items[key].inactive();
            }
        },

        /*
         *  刷新菜单项状态 
         *  返回值：number:visibleItemsCount   可见菜单项的数量
         */
        refreshItems: function() {
            var visibleItemsCount = 0;
            for(var item in this.items) {
                var curMenuItem = this.items[item];
                curMenuItem.refresh();
                if(curMenuItem.isVisible) {
                    visibleItemsCount ++;
                }
            }
            return visibleItemsCount;
        },

        /*
         *  设置菜单是否可见
         *  参数：  boolean:visible     菜单是否可见
         */
        setVisible: function(visible) {
            this.object.style.visibility = visible ? "visible" : "hidden";
        },

        /*
         *  添加菜单项
         *  参数：      object:menuItem     菜单项定义
         *  返回值：    string:id     菜单项唯一ID
         */
        addItem: function(menuItem) {
            var menuItem = new MenuItem(menuItem);
            menuItem.dockTo(this.object);

            this.items[menuItem.id] = menuItem;
            return menuItem.id;
        },

        /* 删除菜单项 */
        delItem: function(id) {
            var menuItem = this.items[id];
            if(menuItem) {
                menuItem.dispose();
                delete this.items[id];
            }
        },

        /* 添加分隔线 */
        addSeparator: function() {
            var separator = document.createElement("div");
            separator.className = CSS_CLASS_MENU_SEPARATOR;

            this.object.appendChild(separator);
        },

        /* 释放实例 */
        dispose: function() {
            for(var item in this.items) {
                this.delItem(item);
            }
            $.removeNode(this.object);

            for(var item in this) {
                delete this[item];
            }
        }
    };

    /* 控制右键菜单项 */
    var MenuItem = function(itemProperties) {
        for(var name in itemProperties) {
            this[name] = itemProperties[name];
        }

        this.isEnable = true;

        this.id = $.getUniqueID(_UNIQUE_ID_ITEM_PREFIX);

        this.object = document.createElement("div");
        this.object.id = this.id;
        this.object.noWrap = true;
        this.object.title = this.label;
        this.object.innerHTML = this.bold ? ("<b>" + this.label + "</b>") : this.label;

        if(this.icon && "" != this.icon) {
            var img = $.createElement("img");
            img.src = this.icon;
            this.object.appendChild(img);
        }
        if(this.submenu) {
            var img = $.createElement("div", "hasChild");
            this.object.appendChild(img);
            
            this.submenu.parentMenuItem = this;
        }
        
        this.object.onmouseover   = _Menu_Item_onMouseOver;
        this.object.onmouseout    = _Menu_Item_onMouseOut;
        this.object.onmousedown   = _Menu_Item_onMouseDown;
        this.object.onclick       = _Menu_Item_onClick;
        this.object.oncontextmenu = _Menu_Item_onContextMenu;
    };

    MenuItem.prototype = {

        /* 将菜单项插入指定容器  */
        dockTo: function(container) {
            container.appendChild(this.object);
        },

        /* 高亮菜单项 */
        active: function() {
            if( !!this.isEnable ) {
                this.object.className = CSS_CLASS_MENU_ITEM_ACITVE;
            }
        },

        /* 低亮菜单项 */
        inactive: function() {
            if( !!this.isEnable ) {
                this.object.className = "";
            }
            if( this.submenu ) {
                this.submenu.inactiveAllItems();
                this.submenu.hide();
            }
        },

        setVisible: function(visible) {
            this.isVisible = !!visible;
            this.object.style.display = this.isVisible ? "block" : "none";
        },

        /* 设置菜单项是否可用 */
        setEnable: function(enable) {
            this.isEnable = !!enable;
            this.object.className = this.isEnable ? "" : "disable";
        },

        /* 刷新菜单项状态 */
        refresh: function() {
            var isVisible = true;
            if(this.visible) {
                isVisible = $.execCommand(this.visible);
            }

            var isEnable = true;
            if(this.enable) {
                isEnable = $.execCommand(this.enable);
            }

            this.setVisible(isVisible);
            this.setEnable(isEnable);
        },

        /* 执行菜单项回调方法 */
        execCallBack: function(event) {
            if(this.isEnable) {
                $.execCommand(this.callback, event);
            }
        },

        /* 显示子菜单 */
        showSubMenu: function() {
            if( this.submenu ) {
                var position = $.absPosition(this.object);
                var x = position.left + this.object.offsetWidth;
                var y = position.top;
                this.submenu.show(x, y);
            }
        },

        dispose: function() {
            $.removeNode(this.object);

            for(var propertyName in this) {
                delete this[propertyName];
            }
        }
    };

    var _Menu_Document_onMouseDown = function(eventObj) {
        Menus.hideAllMenus();
    }, 

    _Menu_Window_onResize = function(eventObj) {
        Menus.hideAllMenus();
    },

    _Menu_Item_onMouseDown = function(eventObj) {
        eventObj = eventObj || window.event;
        $.Event.cancelBubble(eventObj);
    },

    // 高亮菜单项
    _Menu_Item_onMouseOver = function(eventObj) {
        eventObj = eventObj || window.event;

        var id = this.id;
        var menu = Menus.getMenuByItemID(id);
        if(menu) {
            menu.inactiveAllItems();
            var menuItem = menu.items[id];
            menuItem.active();
            menuItem.showSubMenu();
        }
    },

    // 低亮菜单项
    _Menu_Item_onMouseOut = function(eventObj) {
        var id = this.id;
        var menu = Menus.getMenuByItemID(id);
        if(menu) {
            var menuItem = menu.items[id];
            if(null == menuItem.submenu || false == menuItem.submenu.isActive) {
                menuItem.inactive();            
            }
        }
    },

    // 执行菜单项回调方法
    _Menu_Item_onClick = function(eventObj) {
        eventObj = eventObj || window.event;

        var id = this.id;
        var menu = Menus.getMenuByItemID(id);
        if(menu) {
            var menuItem = menu.items[id];
            if(menuItem.isEnable) {
                if(menuItem.callback) {
                    Menus.hideAllMenus();
                }
                menuItem.execCallBack(eventObj);

                if(null == menuItem.submenu) {
                    Menus.inactiveAllMenus();
                    Menus.hideAllMenus();
                }
            }
        }
    },

    /* 鼠标右键点击 */
    _Menu_Item_onContextMenu = function(eventObj) {
        eventObj = eventObj || window.event;
        $.Event.cancel(eventObj);
    },

    /* 鼠标拖动选择文本 */
    _Menu_onSelectStart = function(eventObj) {
        eventObj = eventObj || window.event;
        $.Event.cancel(eventObj);
    };

    return Menu;
});



;(function ($, factory) {

    $.Calendar = factory($.moment);

})(tssJS, function (moment) {
    
    'use strict';

    var  document = window.document,

    fireEvent = function(el, eventName, data) {
        var ev;

        if (document.createEvent) {
            ev = document.createEvent('HTMLEvents');
            ev.initEvent(eventName, true, false);
            ev = extend(ev, data);
            el.dispatchEvent(ev);
        } else if (document.createEventObject) {
            ev = document.createEventObject();
            ev = extend(ev, data);
            el.fireEvent('on' + eventName, ev);
        }
    },
 
    isDate = function(obj) {
        return (/Date/).test(Object.prototype.toString.call(obj)) && !isNaN(obj.getTime());
    },

    isLeapYear = function(year) {
        return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
    },

    getDaysInMonth = function(year, month) {
        return [31, (isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
    },

    setToStartOfDay = function(date) {
        if ( isDate(date) )  date.setHours(0, 0, 0, 0);
    },

    compareDates = function(a, b) {
        return a.getTime() === b.getTime();
    },

    extend = function(to, from, overwrite) {
        var prop, hasProp;
        for (prop in from) {
            hasProp = to[prop] !== undefined;
            if (hasProp && typeof from[prop] === 'object' && from[prop].nodeName === undefined) {
                if (isDate(from[prop])) {
                    if (overwrite) {
                        to[prop] = new Date(from[prop].getTime());
                    }
                }
                else if ($.isArray(from[prop])) {
                    if (overwrite) {
                        to[prop] = from[prop].slice(0);
                    }
                } else {
                    to[prop] = extend({}, from[prop], overwrite);
                }
            } else if (overwrite || !hasProp) {
                to[prop] = from[prop];
            }
        }
        return to;
    },

    /** defaults and localisation */
    defaults = {

        // bind the picker to a form field
        field: null,
 
        // position of the datepicker, relative to the field (default to bottom & left)
        position: 'bottom left',

        // the default output format for `.toString()` and `field` value
        format: 'YYYY-MM-DD',

        // the initial date to view when first opened
        defaultDate: null,

        // make the `defaultDate` the initial selected value
        setDefaultDate: false,

        // first day of week (0: Sunday, 1: Monday etc)
        firstDay: 0,

        // the minimum/maximum date that can be selected
        minDate: null,
        maxDate: null,

        // number of years either side, or array of upper/lower range
        yearRange: 10,

        // used internally (don't config outside)
        minYear: 0,
        maxYear: 9999,
        minMonth: undefined,
        maxMonth: undefined,

        // Additional text to append to the year in the calendar title
        yearSuffix: '',

        // Render the month after year in the calendar title
        showMonthAfterYear: false,

        // internationalization
        i18n: {
            previousMonth : 'Previous Month',
            nextMonth     : 'Next Month',
            months        : ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'],
            weekdays      : ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
            weekdaysShort : ['周日','周一','周二','周三','周四','周五','周六']
        },

        // callback function
        onSelect: null,
        onOpen: null,
        onClose: null,
        onDraw: null
    },


    /**
     * templating functions to abstract HTML rendering
     */
    renderDayName = function(opts, day, abbr) {
        day += opts.firstDay;
        while (day >= 7) {
            day -= 7;
        }
        return abbr ? opts.i18n.weekdaysShort[day] : opts.i18n.weekdays[day];
    },

    renderDay = function(i, isSelected, isToday, isDisabled, isEmpty) {
        if (isEmpty) {
            return '<td class="is-empty"></td>';
        }
        var arr = [];
        if (isDisabled) {
            arr.push('is-disabled');
        }
        if (isToday) {
            arr.push('is-today');
        }
        if (isSelected) {
            arr.push('is-selected');
        }
        return '<td data-day="' + i + '" class="' + arr.join(' ') + '"><button class="pika-button" type="button">' + i + '</button>' + '</td>';
    },

    renderRow = function(days) {
        return '<tr>' + days.join('') + '</tr>';
    },

    renderBody = function(rows) {
        return '<tbody>' + rows.join('') + '</tbody>';
    },

    renderHead = function(opts) {
        var i, arr = [];
        for (i = 0; i < 7; i++) {
            arr.push('<th scope="col"><abbr title="' + renderDayName(opts, i) + '">' + renderDayName(opts, i, true) + '</abbr></th>');
        }
        return '<thead>' + arr.join('') + '</thead>';
    },

    renderTitle = function(instance) {
        var i, j, arr,
            opts  = instance._o,
            month = instance._m,
            year  = instance._y,
            isMinYear = year === opts.minYear,
            isMaxYear = year === opts.maxYear,
            html = '<div class="pika-title">',
            monthHtml,
            yearHtml,
            prev = true,
            next = true;

        for (arr = [], i = 0; i < 12; i++) {
            arr.push('<option value="' + i + '"' + (i === month ? ' selected': '') +
                ((isMinYear && i < opts.minMonth) || (isMaxYear && i > opts.maxMonth) ? 'disabled' : '') + '>' +
                opts.i18n.months[i] + '</option>');
        }
        monthHtml = '<div class="pika-label">' + opts.i18n.months[month] + '<select class="pika-select pika-select-month">' + arr.join('') + '</select></div>';

        if ($.isArray(opts.yearRange)) {
            i = opts.yearRange[0];
            j = opts.yearRange[1] + 1;
        } else {
            i = year - opts.yearRange;
            j = 1 + year + opts.yearRange;
        }

        for (arr = []; i < j && i <= opts.maxYear; i++) {
            if (i >= opts.minYear) {
                arr.push('<option value="' + i + '"' + (i === year ? ' selected': '') + '>' + (i) + '</option>');
            }
        }
        yearHtml = '<div class="pika-label">' + year + opts.yearSuffix + '<select class="pika-select pika-select-year">' + arr.join('') + '</select></div>';

        if (opts.showMonthAfterYear) {
            html += yearHtml + monthHtml;
        } else {
            html += monthHtml + yearHtml;
        }

        if (isMinYear && (month === 0 || opts.minMonth >= month)) {
            prev = false;
        }

        if (isMaxYear && (month === 11 || opts.maxMonth <= month)) {
            next = false;
        }

        html += '<button class="pika-prev' + (prev ? '' : ' is-disabled') + '" type="button">' + opts.i18n.previousMonth + '</button>';
        html += '<button class="pika-next' + (next ? '' : ' is-disabled') + '" type="button">' + opts.i18n.nextMonth + '</button>';

        return html += '</div>';
    },

    renderTable = function(opts, data) {
        return '<table class="pika-table">' + renderHead(opts) + renderBody(data) + '</table>';
    },


    /**  JCalendar constructor */
    JCalendar = function(options) {
        var self = this,
            opts = self.config(options);

        self._onMouseDown = function(e) {
            if (!self._v)  return;

            e = e || window.event;
            var target = e.target || e.srcElement;
            if (!target) return;

            if (!$.hasClass(target, 'is-disabled')) {
                if ($.hasClass(target, 'pika-button') && !$.hasClass(target, 'is-empty')) {
                    self.setDate(new Date(self._y, self._m, parseInt(target.innerHTML, 10)));
                        window.setTimeout(function() {
                            self.hide();
                        }, 100);
                    return;
                }
                else if ($.hasClass(target, 'pika-prev')) {
                    self.prevMonth();
                }
                else if ($.hasClass(target, 'pika-next')) {
                    self.nextMonth();
                }
            }
            if (!$.hasClass(target, 'pika-select')) {
                if (e.preventDefault) {
                    e.preventDefault();
                } else {
                    e.returnValue = false;
                    return false;
                }
            } else {
                self._c = true;
            }
        };

        self._onChange = function(e) {
            e = e || window.event;
            var target = e.target || e.srcElement;
            if (!target) return;
            
            if ($.hasClass(target, 'pika-select-month')) {
                self.gotoMonth(target.value);
            }
            else if ($.hasClass(target, 'pika-select-year')) {
                self.gotoYear(target.value);
            }
        };

        self._onInputChange = function(e) {
            if (e.firedBy === self) return;
 
            var date = new Date(Date.parse(opts.field.value));
            self.setDate(isDate(date) ? date : null);
            if (!self._v) {
                self.show();
            }
        };

        self._onInputFocus = function() {
            self.show();
        };

        self._onInputClick = function() {
            self.show();
        };

        self._onInputBlur = function() {
            if (!self._c) {
                self._b = window.setTimeout(function() {
                    self.hide();
                }, 50);
            }
            self._c = false;
        };

        self._onClick = function(e) {
            e = e || window.event;
            var target = e.target || e.srcElement,
                pEl = target;
            if (!target) return;

            if ( $.hasClass(target, 'pika-select') ) {
                if (!target.onchange) {
                    target.setAttribute('onchange', 'return;');
                    $.Event.addEvent(target, 'change', self._onChange);
                }
            }

            do {
                if ($.hasClass(pEl, 'pika-single')) {
                    return;
                }
            }
            while ((pEl = pEl.parentNode));

            if (self._v && target !== opts.trigger) {
                self.hide();
            }
        };

        self.el = document.createElement('div');
        self.el.className = 'pika-single';

        $.Event.addEvent(self.el, 'mousedown', self._onMouseDown, true);
        $.Event.addEvent(self.el, 'change', self._onChange);

        if (opts.field) {
            document.body.appendChild(self.el);
            $.Event.addEvent(opts.field, 'change', self._onInputChange);

            if (!opts.defaultDate) {
                opts.defaultDate = new Date(Date.parse(opts.field.value));
                opts.setDefaultDate = true;
            }
        }

        var defDate = opts.defaultDate;

        if (isDate(defDate)) {
            if (opts.setDefaultDate) {
                self.setDate(defDate, true);
            } else {
                self.gotoDate(defDate);
            }
        } else {
            self.gotoDate(new Date());
        }

        this.hide();
        self.el.className += ' is-bound';
        $.Event.addEvent(opts.trigger, 'click', self._onInputClick);
        $.Event.addEvent(opts.trigger, 'focus', self._onInputFocus);
        $.Event.addEvent(opts.trigger, 'blur', self._onInputBlur);
    };


    /** public JCalendar API */
    JCalendar.prototype = {

        config: function(options) {
            if (!this._o) {
                this._o = extend({}, defaults, true);
            }

            var opts = extend(this._o, options, true);

            opts.field = (opts.field && opts.field.nodeName) ? opts.field : null;

            opts.trigger = (opts.trigger && opts.trigger.nodeName) ? opts.trigger : opts.field;

            if (!isDate(opts.minDate)) {
                opts.minDate = false;
            }
            if (!isDate(opts.maxDate)) {
                opts.maxDate = false;
            }
            if ((opts.minDate && opts.maxDate) && opts.maxDate < opts.minDate) {
                opts.maxDate = opts.minDate = false;
            }
            if (opts.minDate) {
                setToStartOfDay(opts.minDate);
                opts.minYear  = opts.minDate.getFullYear();
                opts.minMonth = opts.minDate.getMonth();
            }
            if (opts.maxDate) {
                setToStartOfDay(opts.maxDate);
                opts.maxYear  = opts.maxDate.getFullYear();
                opts.maxMonth = opts.maxDate.getMonth();
            }

            if ($.isArray(opts.yearRange)) {
                var fallback = new Date().getFullYear() - 10;
                opts.yearRange[0] = parseInt(opts.yearRange[0], 10) || fallback;
                opts.yearRange[1] = parseInt(opts.yearRange[1], 10) || fallback;
            } else {
                opts.yearRange = Math.abs(parseInt(opts.yearRange, 10)) || defaults.yearRange;
                opts.yearRange = Math.min(opts.yearRange, 50);
            }

            return opts;
        },

        toString: function(format) {
            format = format || this._o.format;
            return !isDate(this._d) ? '' : this._d.format(format);
        },

        getDate: function() {
            return isDate(this._d) ? new Date(this._d.getTime()) : null;
        },
 
        setDate: function(date, preventOnSelect) {
            if (!date) {
                this._d = null;
                return this.draw();
            }
            if (typeof date === 'string') {
                date = new Date(Date.parse(date));
            }
            if (!isDate(date)) {
                return;
            }

            var min = this._o.minDate,
                max = this._o.maxDate;

            if (isDate(min) && date < min) {
                date = min;
            } else if (isDate(max) && date > max) {
                date = max;
            }

            this._d = new Date(date.getTime());
            setToStartOfDay(this._d);
            this.gotoDate(this._d);

            if (this._o.field) {
                this._o.field.value = this.toString();
                fireEvent(this._o.field, 'change', { firedBy: this });
            }
            if (!preventOnSelect && typeof this._o.onSelect === 'function') {
                this._o.onSelect.call(this, this.getDate());
            }
        },

        gotoDate: function(date) {
            if (!isDate(date))  return;

            this._y = date.getFullYear();
            this._m = date.getMonth();
            this.draw();
        },

        gotoToday: function() {
            this.gotoDate(new Date());
        },
 
        gotoMonth: function(month) {
            if (!isNaN( (month = parseInt(month, 10)) )) {
                this._m = month < 0 ? 0 : month > 11 ? 11 : month;
                this.draw();
            }
        },

        nextMonth: function() {
            if (++this._m > 11) {
                this._m = 0;
                this._y++;
            }
            this.draw();
        },

        prevMonth: function() {
            if (--this._m < 0) {
                this._m = 11;
                this._y--;
            }
            this.draw();
        },

        gotoYear: function(year) {
            if (!isNaN(year)) {
                this._y = parseInt(year, 10);
                this.draw();
            }
        },

        /** refresh the HTML */
        draw: function(force) {
            if (!this._v && !force)  return;

            var opts = this._o,
                minYear = opts.minYear,
                maxYear = opts.maxYear,
                minMonth = opts.minMonth,
                maxMonth = opts.maxMonth;

            if (this._y <= minYear) {
                this._y = minYear;
                if (!isNaN(minMonth) && this._m < minMonth) {
                    this._m = minMonth;
                }
            }
            if (this._y >= maxYear) {
                this._y = maxYear;
                if (!isNaN(maxMonth) && this._m > maxMonth) {
                    this._m = maxMonth;
                }
            }

            this.el.innerHTML = renderTitle(this) + this.render(this._y, this._m);

            this.adjustPosition();
            if(opts.field.type !== 'hidden') {
                window.setTimeout(function() {
                    opts.trigger.focus();
                }, 1);
            }

            if (typeof this._o.onDraw === 'function') {
                var self = this;
                window.setTimeout(function() {
                    self._o.onDraw.call(self);
                }, 0);
            }
        },

        adjustPosition: function() {
            var field = this._o.trigger, pEl = field,
                width = this.el.offsetWidth, 
                height = this.el.offsetHeight,
                viewportWidth  = window.innerWidth || document.documentElement.clientWidth,
                viewportHeight = window.innerHeight || document.documentElement.clientHeight,
                scrollTop = window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop,
                left, top, clientRect;

            if (typeof field.getBoundingClientRect === 'function') {
                clientRect = field.getBoundingClientRect();
                left = clientRect.left + window.pageXOffset;
                top = clientRect.bottom + window.pageYOffset;
            } else {
                left = pEl.offsetLeft;
                top  = pEl.offsetTop + pEl.offsetHeight;
                while((pEl = pEl.offsetParent)) {
                    left += pEl.offsetLeft;
                    top  += pEl.offsetTop;
                }
            }

            // default position is bottom & left
            if (left + width > viewportWidth ||
                ( this._o.position.indexOf('right') > -1 &&  left - width + field.offsetWidth > 0) ) {

                left = left - width + field.offsetWidth;
            }
            if (top + height > viewportHeight + scrollTop ||
                ( this._o.position.indexOf('top') > -1 && top - height - field.offsetHeight > 0  ) ) {

                top = top - height - field.offsetHeight;
            }

            this.el.style.cssText = [
                'position: absolute',
                'left: ' + left + 'px',
                'top: ' + top + 'px'
            ].join(';');
        },

        /** render HTML for a particular month */
        render: function(year, month)  {
            var opts   = this._o,
                now    = new Date(),
                days   = getDaysInMonth(year, month),
                before = new Date(year, month, 1).getDay(),
                data   = [],
                row    = [];

            setToStartOfDay(now);
            if (opts.firstDay > 0) {
                before -= opts.firstDay;
                if (before < 0) {
                    before += 7;
                }
            }

            var cells = days + before,
                after = cells;
            while(after > 7) {
                after -= 7;
            }
            cells += 7 - after;
            for (var i = 0, r = 0; i < cells; i++) {
                var day = new Date(year, month, 1 + (i - before)),
                    isDisabled = (opts.minDate && day < opts.minDate) || (opts.maxDate && day > opts.maxDate),
                    isSelected = isDate(this._d) ? compareDates(day, this._d) : false,
                    isToday = compareDates(day, now),
                    isEmpty = i < before || i >= (days + before);

                row.push(renderDay(1 + (i - before), isSelected, isToday, isDisabled, isEmpty));

                if (++r === 7) {
                    data.push(renderRow(row));
                    row = [];
                    r = 0;
                }
            }
            return renderTable(opts, data);
        },

        isVisible: function() {
            return this._v;
        },

        show: function() {
            if (!this._v) {
                $.Event.addEvent(document, 'click', this._onClick);
                $(this.el).removeClass('is-hidden');
                this._v = true;
                this.draw();
                if (typeof this._o.onOpen === 'function') {
                    this._o.onOpen.call(this);
                }
            }
        },

        hide: function() {
            var v = this._v;
            if (v !== false) {
                $.Event.removeEvent(document, 'click', this._onClick);
                this.el.style.cssText = '';
                $(this.el).addClass('is-hidden');
                this._v = false;
                if (v !== undefined && typeof this._o.onClose === 'function') {
                    this._o.onClose.call(this);
                }
            }
        },

        /** GAME OVER */
        destroy: function() {
            this.hide();
            $.Event.removeEvent(this.el, 'mousedown', this._onMouseDown, true);
            $.Event.removeEvent(this.el, 'change', this._onChange);
            if (this._o.field) {
                $.Event.removeEvent(this._o.field, 'change', this._onInputChange);
                $.Event.removeEvent(this._o.trigger, 'click', this._onInputClick);
                $.Event.removeEvent(this._o.trigger, 'focus', this._onInputFocus);
                $.Event.removeEvent(this._o.trigger, 'blur', this._onInputBlur);
            }
            if (this.el.parentNode) {
                this.el.parentNode.removeChild(this.el);
            }
        }

    };

    return JCalendar;
});


;(function ($, factory) {

    $.Form = factory($);

    var FormCache = {};

    $.F = function(id, data) {
        var form = FormCache[id];
        if( form == null && data == null ) {
            return null;
        }

        if( form == null || data ) {
            form = new $.Form($1(id));
            FormCache[form.id] = form;  

            form.load(data)
        }
        
        return form;
    }

})(tssJS, function ($) {

    'use strict';

    var showErrorInfo = function(errorInfo, obj) {
        setTimeout(function() {
            // 页面全局Balllon对象
            if( $.Balloon ) {
                var balloon = new $.Balloon(errorInfo);
                balloon.dockTo(obj);
            }
        }, 100);
    },

    setFocus = function(){
        try { this.el.focus(); } catch(e) { }
    },

    validate = function() {
        var empty     = this.el.getAttribute("empty");
        var errorInfo = this.el.getAttribute("errorInfo");
        var caption   = this.el.getAttribute("caption").replace(/\s/g, "");
        var inputReg  = this.el.getAttribute("inputReg");
        
        var value = this.el.value;
        if(value == "" && empty == "false") {
            errorInfo = "[" + caption.replace(/\s/g, "") + "] 不允许为空。";
        }
        if(inputReg && !eval(inputReg).test(value)) {
            errorInfo = errorInfo || "[" + caption + "] 格式不正确，请更正.";
        }

        if( errorInfo ) {
            showErrorInfo(errorInfo, this.el);

            if( !!this.isInstance ) {
                this.setFocus();
            }
            if( event ) {
                $.Event.cancel(event);
            }
            return false;
        }
        return true;
    },

    restore = function(el, value) {    
        var tempEvent = el.onpropertychange;
        if( tempEvent == null ) {
            clearTimeout(el.timeout);
            tempEvent = el._onpropertychange;
        }
        else {
            el._onpropertychange = tempEvent;
        }

        el.onpropertychange = null;
        el.timeout = setTimeout(function() {
            el.value = value;
            el.onpropertychange = tempEvent;
        }, 10);
    },

    fireOnChangeEvent = function(el, newValue) {
        var onchangeFunc = el.getAttribute("onchange");
        if(onchangeFunc) {
            onchangeFunc = onchangeFunc.replace(/\^/g, "'"); // 有些地方的配置無法直接使用引號（如JSON），用^代替，這裡替換回來
            var rightKH = onchangeFunc.indexOf(")");
            if(rightKH > 0) {
                onchangeFunc = onchangeFunc.substring(0, rightKH) + ", '" + newValue + "')"; 
            }
            else {
                onchangeFunc = onchangeFunc + "('" + newValue + "')";
            }

            eval(onchangeFunc);
        }
    },

    XMLTemplate = function(dataXML) {
        this.sourceXML = dataXML;
             
        this.declare = $("declare", dataXML)[0];
        this.layout  = $("layout", dataXML)[0]; 
        this.script  = $("script", dataXML)[0];
    
        this.dataNode =  $("data", dataXML)[0];
        if(this.dataNode == null) {             
            this.dataNode = $.XML.createNode("data");
            this.sourceXML.appendChild(this.dataNode);
        }
        
        this.rowNode = $("row", this.dataNode)[0];;
        if(this.rowNode == null) {
            this.rowNode = $.XML.createNode("row");
            this.dataNode.appendChild(this.rowNode);    
        }
        
        var oThis = this;
        this.fieldsMap = {};
        $("column", this.declare).each( function(i, column) {
            oThis.fieldsMap[column.getAttribute("name")] = column;
        } );
    };

    XMLTemplate.prototype = {

        /* 获取row节点上与column对应的值 */
        getFieldValue: function(name) {
            var node = this.rowNode.querySelector(name.replace(/\./gi, "\\."));
            if( node ) {
                return $.XML.getText(node).convertEntry();
            }
            return null;
        },

        toHTML: function() {
            var htmls = [], oThis = this;
            htmls.push("<form class='tssForm' method='post'>");
            htmls.push('<table>');

            // 添加隐藏字段           
            $("column[mode='hidden']", this.declare).each( function(i, column){
                var name = column.getAttribute("name");
                var value = oThis.getFieldValue(name);
                value = value ? "value=\"" + value + "\"" : "";
                htmls.push('<input type="hidden" ' + value + ' id="' + name + '"/>');
            } );
            htmls.push('<input type="hidden" name="xml" id="xml"/>');

            var trList = this.layout.querySelectorAll("TR");
            for(var i=0; i < trList.length; i++) {
                var trNode = trList[i];
                htmls.push("<tr>");

                var tdList = trNode.querySelectorAll("TD");
                for(var j=0; j < tdList.length; j++) {
                    var tdNode = tdList[j];
                    htmls.push("<td "+ copyNodeAttribute(tdNode) +">");

                    var childNodes = tdNode.childNodes;
                    for(var n=0; n < childNodes.length; n++) {
                        var childNode = childNodes[n];
                        if(childNode.nodeType != $.XML._NODE_TYPE_ELEMENT) {
                            htmls.push(childNode.value);
                            continue;
                        }

                        var binding = childNode.getAttribute("binding");
                        var column = this.fieldsMap[binding];
                        if(column == null) {
                            htmls.push($.XML.toXml(childNode));
                            continue;
                        }

                        var mode    = column.getAttribute("mode");
                        var editor  = column.getAttribute("editor");
                        var caption = column.getAttribute("caption");
                        var value   = this.getFieldValue(binding);
                        var _value  = (value ? " value=\"" + value + "\"" : " ");
                        
                        var nodeName = childNode.nodeName.toLowerCase(); // label、input、textarea等 
                        if(nodeName == "label" && binding && binding != "") {
                            htmls.push("<label id='label_" + binding + "'>" + caption + "</label>");
                        }
                        else if(mode == "string" && editor == 'comboedit') {
                            htmls.push("<select " + copyNodeAttribute(childNode) + copyColumnAttribute(column) + _value + "></select>");
                        }
                        else if(mode == "string" && nodeName == 'textarea') {
                            htmls.push("<textarea " + copyNodeAttribute(childNode) + copyColumnAttribute(column) + ">" + (value ? value : "") + "</textarea>");
                        }
                        else if(mode == "string" || mode == "number" || mode == "function" || mode == "date") {
                            htmls.push("<input " + copyNodeAttribute(childNode) + copyColumnAttribute(column) + _value + "></input>");
                        }
                    }
                    htmls.push("</td>");
                }   
                htmls.push("</tr>");
             }

             htmls.push("</table>");
             htmls.push("</form>");
             return htmls.join("");

             // some private function define
             function copyColumnAttribute(column) {
                var returnVal = " ";
                $.each(column.attributes, function(i, attr){
                    var name  = attr.nodeName;
                    var value = attr.value;
                    if(value && value != "null") {
                        if(name == "name") {
                            name = "id";
                        }
                        returnVal += name + " = \"" + value + "\" ";
                    }
                } );
 
                return returnVal;
             }

             function copyNodeAttribute(node) {
                var returnVal = "";
                var hasBinding = node.getAttribute("binding") != null;
                $.each(node.attributes, function(i, attr){
                    if(attr.nodeName != "style" || !hasBinding) {
                        returnVal += attr.nodeName + "=\"" + attr.value + "\" ";
                    }
                    if(attr.nodeName == "style" && hasBinding) {
                        returnVal += "style=\"" + attr.value + "\" ";
                    }
                } );
                return returnVal;
             }
        }
    };
 
    var Form = function(element) {
        this.id   = element.id;
        this.box  = element;

        this.editable  = element.getAttribute("editable") || "true";
        this.fieldObjMap = {};
    };

    Form.prototype = {

        load: function(dataXML) {
            if("object" != typeof(dataXML) || dataXML.nodeType != $.XML._NODE_TYPE_ELEMENT) {
                return alert("传入的Form数据有问题，请检查。");
            }
            
            this.template = new XMLTemplate(dataXML);   
            this.box.innerHTML = this.template.toHTML(); 

            // 绑定各个字段输入框对应的编辑方式
            this.attachEditor();
        
            // 绑定事件
            this.box.onselectstart = function() {
                event.cancelBubble = true; // 拖动选择事件取消冒泡
            }

            var form = this.box.querySelector("form");
            if(form) {
                $.Event.addEvent(form, "submit", this.checkForm);
            }   
        },
 
        attachEditor: function() {
            var fieldsMap = this.template.fieldsMap;
            for(var fieldName in fieldsMap) {
                var field = fieldsMap[fieldName];

                // 取layout中绑定该field column的element，如无，则字段无需展示。
                var fieldEl = $1(fieldName);
                if( fieldEl == null) {
                    continue;
                }

                var fieldObj;
                var fieldType = field.getAttribute("mode");
                switch(fieldType) {
                    case "string":
                        var colEditor = field.getAttribute("editor");
                        if(colEditor == "comboedit") {
                            fieldObj = new ComboField(fieldName, this);
                        }
                        else {
                            fieldObj = new StringField(fieldName, this);
                        }
                        break;
                    case "number":
                        fieldObj = new StringField(fieldName, this);
                        break;
                    case "date":
                    case "function":
                        fieldObj = new FunctionField(fieldName, this);
                        break;
                    case "hidden":
                        fieldObj = new HiddenFiled(fieldName, this);
                        break;
                }

                fieldObj.saveAsDefaultValue();
                this.fieldObjMap[fieldName] = fieldObj;

                if(field.getAttribute('empty') == "false") {
                    var notnullTag = $.createElement("span", "notnull");
                    notnullTag.innerText = "*";
                    fieldEl.parentNode.appendChild(notnullTag);
                }
            }

            this.setEditable();
        },
 
        checkForm: function() {
            for(var fieldName in this.fieldObjMap) {
                var fieldObj = this.fieldObjMap[fieldName];
                if( !fieldObj.validate() ) {
                    return false;
                }
            }

            $$("xml").value = $.XML.toXml(this.template.dataNode);
            return true;
        },

        setEditable: function(status) {
            status = status || this.editable;

            $(".buttonBox", this.box.parentNode).css("display", status == "true" ? "block": "none");

            var oThis = this, firstEditableField;
            $.each(this.fieldObjMap, function(name, fieldObj) {
                var _status = status;

                // 如果field column上默认定义为不可编辑，则永远不可编辑
                var mode = oThis.getFieldConfig(name, "mode");
                var editable = oThis.getFieldConfig(name, "editable");
                if ( editable == "false" ) {
                    _status = "false";
                } 

                if(firstEditableField == null && _status == "true" && mode != "hidden") {
                    firstEditableField = fieldObj;
                }

                fieldObj.setEditable(_status);
            });

            if(firstEditableField) {
                firstEditableField.setFocus();
            }
        },

        setFieldEditable: function(name, value) {
            var fieldObj = this.fieldObjMap[name];
            if( fieldObj ) {
                fieldObj.setEditable(value);
            }
        },

        /* 设置row节点上与field column对应的值 */
        setFieldValue: function(name, value) {
            var rowNode = this.template.rowNode;
            var node = rowNode.querySelector(name.replace(/\./gi, "\\."));
            if( node == null ) { 
                rowNode.appendChild(node = $.XML.createNode(name)); // 创建单值节点
            }

            var CDATANode = node.firstChild;
            if( CDATANode == null ) {
                node.appendChild(CDATANode = $.XML.createCDATA(value));
            } else {
                $.XML.setText(CDATANode, value);
            }

            var eventOndatachange = new $.EventFirer(this, "ondatachange");
            var eventObj = $.Event.createEventObject();
            eventObj.id = this.id + "_" + name;
            eventOndatachange.fire(eventObj);  // 触发事件
        },

        // 将界面数据更新到Form模板的data/row/里
        updateData: function(el) {
            var newValue;
            if(event.propertyName == "checked") {
                newValue = el.checked == true ? 1 : 0;
            }
            else if(el.tagName.toLowerCase() == "select") {
                newValue = el._value;            
            }
            else {
                newValue = el.value;
            }

            var oldValue = this.getData(el.id);
            if( $.isNullOrEmpty(newValue) && $.isNullOrEmpty(oldValue) ) {
                return;
            }
            if(newValue != oldValue) {
                this.setFieldValue(el.id, newValue);
            }
        },

        // 将数据设置到界面输入框上显示，同时更新到data/row/里
        updateDataExternal: function(name, value) {
            this.setFieldValue(name, value);
            
            // 更改页面显示数据
            var fieldObj = this.fieldObjMap[name];
            if(fieldObj) {
                fieldObj.setValue(value);
            }
        },

        getData: function(name) {
            return this.template.getFieldValue(name);
        },

        showCustomErrorInfo: function(name, str) {
            var fieldObj = this.fieldObjMap[name];
            if( fieldObj ) {
                showErrorInfo(str, fieldObj.el);
            }
        },

        getFieldConfig: function(name, attrName) {
            var field = this.template.fieldsMap[name];
            if( field == null ) {
                return alert("指定的字段[" + name + "]不存在");
            }
            return field.getAttribute(attrName);
        },

        getXmlDocument: function() {
            return this.template.sourceXML;
        }
    };

    // 普通文本输入框
    var StringField = function(fieldName, form) {
        this.el = $1(fieldName);
        this.el._value = this.el.value; // 备份原值

        var oThis = this;
        this.el.onblur = function() {
            if("text" == this.type) { // 判断input的类型
                this.value = this.value.trim(); // 去掉前后的空格
            }

            form.updateData(this);
        };

        this.el.onpropertychange = function() {
            if(window.event.propertyName == "value") {
                var maxLength = parseInt(this.getAttribute('maxLength'));

                // 超出长度则截掉
                if(this.value.length > maxLength) {
                    restore(this, this.value.substring(0, maxLength));
                }
                else{
                    this._value = this.value;
                }
            }
        };
    };

    StringField.prototype = {
        setValue : function(value) {
            this.el._value = this.el.value = value;
        },

        validate: validate,
        
        setEditable : function(status) {
            this.el.editable = status || this.el.getAttribute("editable");

            var disabled = (this.el.editable == "false");
            this.el.className = disabled ? "field_disabled" : "string";

            if(this.el.tagName == "textarea") {
                this.el.readOnly = disabled;  // textarea 禁止状态无法滚动显示所有内容，所以改为只读
            } else {
                this.el.disabled = disabled;        
            }
        },

        saveAsDefaultValue : function() {
            this.el.defaultValue = this.el.value;
        },

        setFocus : setFocus
    };

    // 自定义方法输入值类型
    var FunctionField = function(fieldName, form) {
        this.el = $$(fieldName);
        this.el._value = this.el.value; // 备份原值
        this.isdate = (this.el.getAttribute("mode").toLowerCase() == "date");
     
        if( !this.el.disabled ) {
            if(this.isdate) {
                if(this.picker == null) {
                    this.picker = new $.Calendar( {
                        field: $1(this.el.id),
                        firstDay: 1,
                        minDate: new Date('2000-01-01'),
                        maxDate: new Date('2020-12-31'),
                        yearRange: [2000,2020],
                        format: 'yyyy-MM-dd'
                    });
                }
            }
            else { 
                var funcIcon = $.createElement("span", "functionBt"); // 添加点击按钮
                if(this.el.nextSibling) {
                    this.el.parentNode.insertBefore(funcIcon, this.el.nextSibling);
                } else {
                    this.el.parentNode.appendChild(funcIcon);
                }               
 
                var cmd = this.el.getAttribute("cmd");
                funcIcon.onclick = function() {
                    $.execCommand(cmd);
                };
            }
        }   

        this.el.onblur = function() {
            form.updateData(this);
        };
    };
 
    FunctionField.prototype = {
        setValue : function(value) {
            this.el._value = this.el.value = value;
        },

        validate: validate,
        
        setEditable : function(status) {
            this.el.disabled  = (status == "false");
            this.el.className = (this.el.disabled ? "field_disabled" : "function");

            // function图标
            if(!this.isdate) {
                this.el.nextSibling.className = (this.el.disabled ? "hidden" : "functionBt");
                this.el.readOnly = true;
            }
            
            this.el.editable = status;
        },

        saveAsDefaultValue : function() {
            this.el.defaultValue = this.el.value;
        },

        setFocus : setFocus
    };

    // 下拉选择框，单选或多选
    var ComboField = function(fieldName, form) {
        this.el = $1(fieldName);
        this.multiple = this.el.getAttribute("multiple") == "multiple";
        
        var valueNode = this.el.attributes["value"];
        this.el._value = valueNode ? valueNode.value : "";

        var selectedValues = this.value2List(this.el._value);
        var selectedIndex = [];

        var valueList = this.el.getAttribute("editorvalue").split('|');
        var textList  = this.el.getAttribute("editortext").split('|');
        for(var i=0; i < valueList.length; i++) {
            var value = valueList[i];
            this.el.options[i] = new Option(textList[i], value);
     
            if( selectedValues[value] ) {
                this.el.options[i].selected = true;
                selectedIndex[selectedIndex.length] = i;
            }
        }
        if( selectedIndex.length > 0 ){
            this.el.defaultSelectedIndex = selectedIndex.join(",");
        } 
        else {
            this.el.defaultSelectedIndex = this.el.selectedIndex = -1;
        }

        if(this.multiple && this.el.getAttribute("height") == null) {
            this.el.style.height = Math.min(Math.max(valueList.length, 4), 4) * 18 + "px";
        }   

        // 当empty = false(表示不允许为空)时，下拉列表的默认值自动取第一项值
        if( this.el._value == "" &&  this.el.getAttribute('empty') == "false") {
            this.setValue(valueList[0]);
            form.setFieldValue(this.el.id, valueList[0]);
        }
        
        this.el.onchange = function() {
            var x = [];
            for(var i=0; i < this.options.length; i++) {
                var option = this.options[i];
                if(option.selected) {
                    x[x.length] = option.value;
                }
            }
            this._value = x.join(",");
            form.updateData(this);
            
            fireOnChangeEvent(this, this._value);
        }
    };

    ComboField.prototype = {
        value2List: function(value) {
            var valueList = {};
            if( !$.isNullOrEmpty(value) ) {
                value.split(",").each(function(i, item){
                    valueList[item] = true;
                })
            }           

            return valueList;
        },

        setValue: function(value) {
            var valueList = this.value2List(value);

            var noSelected = true;
            $.each(this.el.options, function(i, option){
                if(valueList[option.value]) {
                    option.selected = true;
                    noSelected = false;
                }
            });
 
            if(noSelected){
                this.el.selectedIndex = -1; 
            }

            this.el._value = value;
            fireOnChangeEvent(this.el, value);
        },

        setEditable: function(status) {
            this.el.disabled  = (status == "true" ? false : true);
            this.el.className = (status == "true" ? "comboedit" : "field_disabled");
            this.el.editable  = status;
        },

        validate: validate,

        saveAsDefaultValue: function() {
            var selectedIndex = [];
            for(var i=0; i < this.el.options.length; i++){
                var opt = this.el.options[i];
                if(opt.selected) {
                    selectedIndex[selectedIndex.length] = i;
                }
            }
            this.el.defaultSelectedIndex = selectedIndex.join(",");
        },

        setFocus: setFocus
    };
 
    // 隐藏hidden字段
    var HiddenFiled = function(fieldName, form) {
        this.el = $1(fieldName);
    };

    HiddenFiled.prototype = {
        setValue: function(s) {},
        setEditable: function(s) {},
        validate: function() { return true; },
        saveAsDefaultValue: function() {},
        setFocus: function() {}
    };

    return Form;
});


;(function ($, factory) {

    $.Grid = factory($);

    var GridCache = {};

    $.G = function(id, data) {
        var grid = GridCache[id];
        if( grid == null || data ) {
            grid = new $.Grid($1(id), data);
            GridCache[grid.id] = grid;  
        }
        
        return grid;
    }

})(tssJS, function ($) {

    'use strict';

    var cellHeight = 22,  // 数据行高

    getAlign = function(column) {
        var align = column.getAttribute("align");
        if(align) {
            return align;
        }

        switch(column.getAttribute("mode")) {
            case "number":
                return "right";
            case "boolean":
            case "date":
            default:
                return "center";
        }
    },

    getCellValue = function(tr, colName) {
        var cells = curRow.cells;
        for(var j=0; j < cells.length; j++) {
            var cell = cells[j];
            if( cell.getAttribute("name") == colName ) {
                return cell.getAttribute("value");
            }
        }
    },

    bindAdjustTHHandler = function(table) {

        $("thead tr td", table).each(function(i, th) {
            // 双击隐藏列
            th.ondblclick = function() {
                $(th).css("display", "none");
                $("tbody tr", table).each( function(j, row) {
                    $(row.cells[i]).css("display", "none");
                });
            };

            th.onmousedown = function() {
                if(event.offsetX > this.offsetWidth - 5) {
                    this.mouseDown = true;
                    this.oldX = event.x;
                    this.oldWidth = this.offsetWidth;
                }
            };

            // 结束宽度调整 
            th.onmouseup = function() {
                this.mouseDown = false;
                $(this).css("cursor", "default");
            };

            th.onmousemove = function(ev) {
                var colseToEdge = ev.offsetX > this.offsetWidth - 7;
                $(this).css("cursor", colseToEdge ? "col-resize" : "default");
                
                if( !!this.mouseDown ) {
                    $(this).css("cursor", "col-resize");

                    var distance = (event.x - this.oldX);
                    $(this).css("width", (this.oldWidth + distance) + "px");
                }
            }
        });
    },

    bindSortHandler = function(table) {
        var rows = [];
        var tbody = $("tbody", table)[0];
        $("tr", tbody).each( function(i, row) {
            rows[i] = row;
        });

        var thList = $("thead tr td", table);
        var direction = 1;
     
        thList.each( function(i, th) {
            var sortable = th.getAttribute("sortable");
            if( sortable == "true") {
                th._colIndex = i;

                $(th).click(function() {
                    // 先清除已有的排序
                    thList.each(function(i, _th) {
                        $(_th).removeClass("desc").removeClass("asc");
                    });
                    $(this).addClass(direction == 1 ? "desc" : "asc");

                    var columnIndex = this._colIndex;
                    rows.sort(function(row1, row2) {
                        var x = row1.cells[columnIndex].innerText;
                        var y = row2.cells[columnIndex].innerText;
                        var compareValue;
                        if( isNaN(x) ) {
                            compareValue = x.localeCompare(y);
                        }
                        else {
                            compareValue = Number(x) - Number(y);
                        }
                        return compareValue * direction;
                    });

                    // 按排序结果对table进行更新，并设置排序列的样式                    
                    rows.each(function(i, row) {
                        $.each(row.cells, function(j, cell){
                            if(j == columnIndex) {
                                $(cell).addClass("sorting");
                            } else {
                                $(cell).removeClass("sorting");
                            }
                        });
                        
                        tbody.appendChild(row);
                        row.setAttribute("_index", i + 1);
                    });

                    direction = direction * -1;
                });
            }   
        });
    },

    XMLTempalte = function(dataXML) {
        this.declare = $("declare", dataXML)[0];
        this.script  = $("script", dataXML)[0];
        this.columns = this.declare.querySelectorAll("column");
        this.dataRows = dataXML.querySelectorAll("data row");

        var columnsMap = {};
        $.each(this.columns, function(index, column) {
            columnsMap[column.getAttribute("name")] = column;
        });
        this.columnsMap = columnsMap;

        this.hasHeader    = this.declare.getAttribute("header") == "checkbox";
        this.needSequence = this.declare.getAttribute("sequence") != "false";
    },

    JsonTemplate = function(dataJson) {
        // TODO 支持json格式的数据源
    };

    XMLTempalte.prototype = {
        toHTML: function(startNum) {
            var htmls = [], thead = [], tbody = [];

            thead.push('<thead><tr>');
            if(this.hasHeader) {
                thead.push('<td name="cellheader" style="width:30px"><input type="checkbox" id="checkAll"/></td>');
            }
            if(this.needSequence) {
                thead.push('<td name="sequence" style="width:30px">序号</td>');
            }
            $.each(this.columnsMap, function(name, column) {
                var caption = column.getAttribute("caption");
                var width   = column.getAttribute("width");
                var style = (width ? ' style="width:' + width + '"': '');
                var _class   = column.getAttribute("display")  == "none" ? ' class="hidden"' : '';
                var sortable = column.getAttribute("sortable") == "true" ? ' sortable="true"' : '';
                thead.push('<td name="' + name + '" ' + _class + style + sortable + '>' + caption + '</td>');
            });
            thead.push("</tr></thead>");
 
            var oThis = this;
            tbody.push('<tbody>');
            $.each(this.dataRows, function(i, row) {
                var index = startNum + i + 1;
                tbody.push('<tr _index="' + index + '">');

                if(oThis.hasHeader) {
                    tbody.push('<td></td>');
                }
                if(oThis.needSequence) {
                    tbody.push('<td></td>');
                }

                var columnsMap = oThis.columnsMap;
                for(var name in columnsMap) {
                    var value  = row.getAttribute(name) || "";
                    tbody.push('<td name="' + name + '" value="' + value + '">' + value + '</td>');
                }

                tbody.push("</tr>");
            });
            tbody.push("</tbody>");

            htmls.push("<table>");
            htmls.push(thead.join(""));
            htmls.push(tbody.join(""));
            htmls.push("</table>");
            return htmls.join("");
        }
    }; 

    var Grid = function(element, data) {
        this.id = element.id;
        this.gridBox = this.element = this.el = element;
        this.gridBox.innerHTML = "";

        // Grid控件上禁用默认右键
        (element.parentNode || document).oncontextmenu = function(_event) {
            $.Event.cancel(_event || window.event);
        }   

        this.gridBox.style.width = element.getAttribute("width")  || "100%";

        var pointHeight = element.getAttribute("height");
        if( pointHeight == null ) {
            pointHeight = element.clientHeight; // hack 固定住grid高度，以免在IE部分版本及FF里被撑开
        }
        // $(this.gridBox).css("height", pointHeight + "px");
        
        this.windowHeight = pointHeight;
        this.pageSize = Math.floor(this.windowHeight / cellHeight);
        
        this.load(data);    

        // 添加Grid事件处理
        this.addGridEvent();    
    };

    Grid.prototype = {
        load: function(data, append) {
            if("object" != typeof(data) || data.nodeType != $.XML._NODE_TYPE_ELEMENT) {
                alert("传入的Grid数据有问题。")  
            } 

            // 初始化变量
            var startNum = append ? this.totalRowsNum : 0;  

            this.template = new XMLTempalte(data);  
            var gridTableHtml = this.template.toHTML(startNum); // 解析成Html
            
            if(append) {
                var tempParent = $.createElement("div");
                $(tempParent).html(gridTableHtml);
                var newRows = tempParent.childNodes[0].tBodies[0].rows;
                for(var i=0; i < newRows.length; i++) {
                    var cloneRow = newRows[i].cloneNode(true);
                    this.tbody.appendChild(cloneRow);
                }
            }
            else {
                $(this.gridBox).html(gridTableHtml);
                this.tbody = $("tbody", this.gridBox)[0];
            }
            
            var table  = $("table", this.gridBox)[0];
            this.totalRowsNum = this.tbody.rows.length;
            for(var i = startNum; i < this.totalRowsNum; i++) {
                this.processDataRow(this.tbody.rows[i]); // 表格行TR
            }
            
            bindAdjustTHHandler(table);
            bindSortHandler(table);
        }, 

        /* 处理数据行,将值解析成下拉列表值、图片、选择框等 */
        processDataRow: function(curRow) {
            $(curRow).hover(
                function() { 
                    $(curRow).addClass("rolloverRow"); 
                }, 
                function() { 
                    $(curRow).removeClass("rolloverRow");
                } 
            );
            
            var cells = curRow.cells;
            for(var j=0; j < cells.length; j++) {
                var cell = cells[j];

                var hasHeader = this.template.hasHeader;
                if(hasHeader && j == 0) {
                    cell.setAttribute("name", "cellheader");
                    cell.innerHTML = '<input name="' + this.id + '_cb" type="checkbox" >';
                    continue;
                } 
                else if(this.template.needSequence && ((!hasHeader && j == 0) || (hasHeader && j == 1)) ) {
                    cell.setAttribute("name", "sequence");
                    cell.innerText = curRow.getAttribute("_index");
                    continue;
                }

                this.processDataCell(cell);                     
            }   
        },

        processDataCell: function(cell) {
            var colName = cell.getAttribute("name");
            var column = this.template.columnsMap[colName]; 
            if( colName == null || column == null) {
                return;
            } 

            if(column.getAttribute("display") == "none") {
                $(cell).addClass("hidden");
            } 
            else if(column.getAttribute("highlight") == "true") {
                $(cell).addClass("highlightCol");
            }
            $(cell).css("text-align", getAlign(column));

            var value = cell.getAttribute("value") || cell.innerText;
            var mode  = column.getAttribute("mode") || "string";
            switch( mode ) {
                case "string":
                    var editor = column.getAttribute("editor");
                    var editortext = column.getAttribute("editortext");
                    var editorvalue = column.getAttribute("editorvalue");
                    if(editor == "comboedit" && editorvalue && editortext) {
                        var listNames  = editortext.split("|");
                        var listValues = editorvalue.split("|");
                        listValues.each(function(n, optionValue) {
                            if(value == optionValue) {
                                value = listNames[n];
                            }
                        });
                    }
                    
                    cell.innerText = cell.title = value;                            
                    break;
                case "number":  
                case "date":
                    cell.title = value;
                    break;         
                case "function":                          
                    break;    
                case "image":          
                    cell.innerHTML = "<img src='" + value + "'/>";
                    break;    
                case "boolean":      
                    var checked = (value =="true") ? "checked" : "";
                    cell.innerHTML = "<form><input class='selectHandle' type='radio' " + checked + "/></form>";
                    cell.querySelector("input").disabled = true;
                    break;
            }                           
        },

        /*
         * 根据页面上的行数，获取相应的Row对象
         * 参数：  index   行序号
         * 返回值： Row对象
         */
        getRowByIndex: function(index) {
            for(var i = 0; i < this.tbody.rows.length; i++) {
                var row = this.tbody.rows[i];
                if(row.getAttribute("_index") == index) {
                    return row;
                }
            }
        },

        // 获取选中行中指定列的值
        getColumnValue: function(columnName) {
            var value;
            var rowIndex = this.gridBox.selectRowIndex; 
            if(rowIndex) {
                var row = this.getRowByIndex(rowIndex);
                $.each(row.cells, function(i, cell) {
                    if(cell.getAttribute("name") == columnName) {
                        value = cell.getAttribute("value");
                    }
                });
            }
            return value;
        },

        // 获取某一列的值
        getColumnValues: function(columnName) {
            var values = [];
            var cells = $("tr>td[name='" + columnName + "']", this.tbody);
            cells.each(function(i, cell){
                values[i] = cell.getAttribute("value");
            });

            return values;
        },

        // 新增一行
        insertRow: function(map) {
            var trList = this.gridBox.querySelectorAll("table tbody tr");
            var lastRow = trList[trList.length - 1];

            var newRow = this.tbody.insertRow(this.totalRowsNum ++);
            newRow.setAttribute("_index", parseInt(lastRow.getAttribute("_index")) + 1);

            var thList = $("table thead td", this.gridBox);
            thList.each( function(i, th) {
                var colName = th.getAttribute("name");
                
                var cell = newRow.insertCell(i);
                cell.setAttribute( "name", colName );

                if(map[colName]) {
                    cell.innerText = map[colName];
                }
            });
 
            this.processDataRow(newRow);

            bindSortHandler(this.tbody.parentNode);
        },

        // 删除单行
        deleteRow: function(row) {
            this.tbody.removeChild(row);
            this.totalRowsNum --;
        },

        deleteRowByIndex: function(rowIndex) {
            var row = this.getRowByIndex(rowIndex);
            this.deleteRow(row);

            bindSortHandler(this.tbody.parentNode);
        },

        deleteSelectedRow: function() {
            var rowIndex = this.gridBox.selectRowIndex;
            this.deleteRowByIndex(rowIndex);
        },
            
        // 更新单行记录的某个属性值
        modifyRow: function(row, attrName, value) {
            var oThis = this;
            $.each(row.cells, function(i, cell) {
                if(cell.getAttribute("name") == attrName) {
                    cell.setAttribute("value", value);
                    oThis.processDataCell(cell);
                }
            });
        },

        modifyRowByIndex: function(rowIndex, attrName, value) {
            var row = this.getRowByIndex(rowIndex);
            this.modifyRow(row, attrName, value);
        },

        modifySelectedRow: function(attrName, value) {
            var rowIndex = this.gridBox.selectRowIndex;
            this.modifyRowByIndex(rowIndex, attrName, value);
        },

        getHighlightRow: function() {
            return $(".rolloverRow", this.tbody)[0];
        },

        // 添加Grid事件处理
        addGridEvent: function() {          
            var oThis = this;

            this.gridBox.onscroll = function() {
                 // 判断是否到达底部 
                 if(this.scrollHeight - this.scrollTop <= this.clientHeight) {
                    var eventFirer = new $.EventFirer(oThis.el, "onScrollToBottom");
                    eventFirer.fire();
                 }
            };

            this.gridBox.onmousewheel = function() {
                this.scrollTop += -Math.round(window.event.wheelDelta / 120) * cellHeight;
            };
            
            this.gridBox.onkeydown = function() {
                switch (event.keyCode) {
                    case 33:    //PageUp
                        oThis.gridBox.scrollTop -= oThis.pageSize * cellHeight;
                        return false;
                    case 34:    //PageDown
                        oThis.gridBox.scrollTop += oThis.pageSize * cellHeight;
                        return false;
                    case 35:    //End
                        oThis.gridBox.scrollTop = oThis.gridBox.offsetHeight - oThis.windowHeight;
                        return false;
                    case 36:    //Home
                        oThis.gridBox.scrollTop = 0;
                        return false;
                    case 37:    //Left
                        oThis.gridBox.scrollLeft -= 10;
                        return false;
                    case 38:    //Up
                        oThis.gridBox.scrollTop -= cellHeight;
                        return false;
                    case 39:    //Right
                        oThis.gridBox.scrollLeft += 10;
                        return false;
                    case 40:    //Down
                        oThis.gridBox.scrollTop += cellHeight;
                        return false;
                }
            };
         
            this.gridBox.onclick = function() { // 单击行
                fireClickRowEvent(this, event, "onClickRow");
            };

            this.gridBox.ondblclick = function() { // 双击行
                fireClickRowEvent(this, event, "onDblClickRow");
            };

            this.gridBox.oncontextmenu = function() {
                fireClickRowEvent(this, event, "onRightClickRow"); // 触发右键事件
            };

            // 触发自定义事件
            function fireClickRowEvent(gridBox, event, firerName) {
                var _srcElement = event.srcElement;
                if( notOnGridHead(_srcElement) ) { // 确保点击处不在表头
                    var trObj = _srcElement;
                    while( trObj.tagName.toLowerCase() != "tr" ) {
                        trObj = trObj.parentElement;
                    }

                    if(trObj && trObj.getAttribute("_index") ) {
                        var rowIndex = parseInt( trObj.getAttribute("_index") );
                        var oEvent = $.Event.createEventObject();
                        oEvent.result = {
                            rowIndex: rowIndex
                        };

                        gridBox.selectRowIndex = rowIndex;
                        var eventFirer = new $.EventFirer(gridBox, firerName);
                        eventFirer.fire(oEvent);  // 触发右键事件
                    }   
                }       
            }
            
            // 确保点击处不在表头
            function notOnGridHead(srcElement) { 
                return !isContainTag(srcElement, "THEAD");
            }
            
            function isContainTag(obj, tag) {
                while( obj ) {
                    if (obj.tagName == tag) {
                        return true;
                    }
                    obj = obj.parentElement;
                }
                return false;
            }
        }
    };

    return Grid;
});


;(function($){

    /*
     *  翻页工具条
     *  参数： object:pageBar      工具条对象
                XmlNode:pageInfo        XmlNode实例
                function:callback       回调函数
     */
    $.initGridToolBar = function(pageBar, pageInfo, callback) {
        pageBar.init = function() {
            this.innerHTML = ""; // 清空内容

            var totalpages = pageBar.getTotalPages();
            var curPage = pageBar.getCurrentPage();

            var str = [];
            str[str.length] = '<span class="button refresh" id="GridBtRefresh" title="刷新"></span>';
            str[str.length] = '<span class="button first"   id="GridBtFirst"   title="第一页"></span>';
            str[str.length] = '<span class="button prev"    id="GridBtPrev"    title="上一页"></span>';
            str[str.length] = '<span class="button next"    id="GridBtNext"    title="下一页"></span>';
            str[str.length] = '<span class="button last"    id="GridBtLast"    title="最后一页"></span>';
            
            str[str.length] = '<select id="GridPageList">';
            for(var i=1; i <= totalpages; i++) {
                str[str.length] = '  <option value="' + i + '"' + (curPage == i ? ' selected' : '') + '>' + i + '</option>';
            }
            str[str.length] = "</select>";

            this.innerHTML = str.join("");
 
            $("#GridBtRefresh").click(function() {
                var curPage = pageBar.getCurrentPage();
                pageBar.gotoPage(curPage);
            });
            $("#GridBtFirst").click(function() {
                pageBar.gotoPage("1");
            });
            $("#GridBtLast").click(function() {
                var lastpage = pageBar.getLastPage();
                pageBar.gotoPage(lastpage);
            });
            $("#GridBtNext").click(function() {
                var curPage  = pageBar.getCurrentPage();
                var lastpage = pageBar.getLastPage();
                if(curPage < lastpage) {
                    pageBar.gotoPage(curPage + 1);
                }
            });
            $("#GridBtPrev").click(function() {
                var curPage = pageBar.getCurrentPage();
                if(curPage > 1) {
                    pageBar.gotoPage(curPage - 1);
                }
            });
            $.Event.addEvent($1("GridPageList"), "change", function() {
                pageBar.gotoPage(this.value);
            });
        }
        
        pageBar.getCurrentPage = function() {
            var currentpage = pageInfo.getAttribute("currentpage");
            return currentpage ? parseInt(currentpage) : 1;
        }
        
        pageBar.getLastPage = function() {
            var lastpage = this.getTotalPages();
            return lastpage ? parseInt(lastpage) : 1;
        }
        
        pageBar.getTotalPages = function() {
            var totalpages = pageInfo.getAttribute("totalpages");
            return totalpages ? parseInt(totalpages) : 1;
        }
        
        pageBar.gotoPage = function(page) {
            callback(page); // 转到指定页
        }
        
        pageBar.init();
    };

    $.showGrid = function(serviceUrl, dataNodeName, editRowFuction, gridName, page, requestParam, pageBar) {
        pageBar  = pageBar  || $1("gridToolBar");
        gridName = gridName || "grid";
        page     = page || "1";

        var request = new $.HttpRequest();
        request.url = serviceUrl + "/" + page;
        request.params = requestParam || [];

        request.onresult = function() {
            var gridBox = $1(gridName);
            if(gridBox.getAttribute("height") == null) {
                gridBox.setAttribute("height", gridBox.clientHeight); // hack for IE11
            }
            
            var grid = $.G(gridName, this.getNodeValue(dataNodeName)); 
     
            var gotoPage = function(page) {
                request.url = serviceUrl + "/" + page;
                request.onresult = function() {
                    $.G(gridName, this.getNodeValue(dataNodeName)); 
                    $.initGridToolBar(pageBar, this.getNodeValue("PageInfo"), gotoPage);
                }               
                request.send();
            }

            var pageInfoNode = this.getNodeValue("PageInfo");            
            $.initGridToolBar(pageBar, pageInfoNode, gotoPage);
            
            gridBox.onDblClickRow = function(eventObj) {
                editRowFuction();
            }
            gridBox.onRightClickRow = function() {
                gridBox.contextmenu.show(event.clientX, event.clientY);
            }   
            gridBox.onScrollToBottom = function () {           
                var currentPage = pageBar.getCurrentPage();
                if(pageBar.getTotalPages() <= currentPage) return;

                var nextPage = parseInt(currentPage) + 1; 
                request.url = serviceUrl + "/" + nextPage;
                request.onresult = function() {
                    $.G(gridName).load(this.getNodeValue(dataNodeName), true);

                    var pageInfoNode = this.getNodeValue("PageInfo");
                    $.initGridToolBar(pageBar, pageInfoNode, gotoPage);
                }               
                request.send();
            }
        }
        request.send();
    };

    // 删除选中Grid行
    $.delGridRow = function(url, gridName) {
        if( !confirm("您确定要删除该行记录吗？") ) return;
        
        var grid = $.G(gridName || "grid");
        var objectID = grid.getColumnValue("id");
        if( objectID ) {
            $.ajax({
                url : url + objectID,
                method : "DELETE",
                onsuccess : function() { 
                    grid.deleteSelectedRow();
                }
            }); 
        }
    }

})(tssJS);


;(function($, factory) {

    $.Tree = factory($);

    var TreeCache = {};

    $.T = function(id, data) {
        var tree = TreeCache[id];
        if( tree == null || data ) {
            tree = new $.Tree($1(id), data);
            TreeCache[id] = tree;   
        }
        
        return tree;
    }

})(tssJS, function($) {

    'use strict';

    var
        _TREE_TYPE = "treeType",
        _TREE_TYPE_SINGLE = "single",
        _TREE_TYPE_MULTI  = "multi",

        _TREE_NODE_MOVEABLE = "moveable",    // 是否可以移动树节点，默认false
        _TREE_NODE_CHECK_SELF = "justSelf",  // 选中节点时只改变自己的选择状态，与父、子节点无关

    Tree = function(el, data) {
        /*  自定义事件 */
        var eventTreeReady       = new $.EventFirer(this, "onLoad"),
            eventTreeChange      = new $.EventFirer(this, "onChange"),
            eventNodeActived     = new $.EventFirer(this, "onTreeNodeActived"), 
            eventNodeDoubleClick = new $.EventFirer(this, "onTreeNodeDoubleClick"),
            eventNodeRightClick  = new $.EventFirer(this, "onTreeNodeRightClick"),
            eventNodeMoved       = new $.EventFirer(this, "onTreeNodeMoved");

        this.el = el;
        this.treeType  = el.getAttribute(_TREE_TYPE) || _TREE_TYPE_SINGLE;
        this.moveable  = el.getAttribute(_TREE_NODE_MOVEABLE) == "true";
        this.checkSelf = el.getAttribute(_TREE_NODE_CHECK_SELF) == "true";

        this.rootList = [];

        this.init = function() {
            if(data.nodeType) {
                loadXML(data);
            } else {
                loadJson(data);
            }

            $(this.el).html("");

            var ul = $.createElement("ul");
            this.rootList.each(function(i, root){
                var li = root.toHTMLTree();
                ul.appendChild(li);
            });
            this.el.appendChild(ul);

            eventTreeReady.fire(); // 触发载入完成事件
        }

        // 定义Tree私有方法
        var tThis = this;
        var loadXML = function(node, parent) {
            var xmlNodes = node.querySelectorAll("treeNode");
            var parents = {};
            $.each(xmlNodes, function(i, xmlNode) {
                var nodeAttrs = {};
                $.each(xmlNode.attributes, function(j, attr) {
                    nodeAttrs[attr.nodeName] = attr.value;
                });

                var parentId = xmlNode.parentNode.getAttribute(_TREE_NODE_ID);
                var parent = parents[parentId];
                var treeNode = new TreeNode(nodeAttrs, parent);

                if(parent == null) {
                    tThis.rootList.push(treeNode); // 可能存在多个根节点
                }   
                parents[treeNode.id] = treeNode;
            });
        };

        var loadJson = function(data) {

        };

        // 树控件上禁用默认右键和选中文本（默认双击会选中节点文本）
        this.el.oncontextmenu = this.el.onselectstart = function(_event) {
            $.Event.cancel(_event || window.event);
        }       

        /********************************************* 定义树节点TreeNode start *********************************************/
        var 
            _TREE_NODE = "treeNode",
            _TREE_NODE_ID = "id",
            _TREE_NODE_NAME = "name",
            _TREE_ROOT_NODE_ID = "_root",  /* “全部”节点的ID值  */
            _TREE_NODE_STATE = "disabled",       // 停用、启用
            
            /* 
             * 树节点的选择状态：没选(UN_CHECKED)、半选(HALF_CHECKED)、全选(CHECKED)  0/1/2/ 
             * 禁选(CHECKED_DISABLED)状态下，也分没选、半选、全选
             */
            _TREE_NODE_CHECK_STATE = "checkState",  

        clickSwich = function(node) {
            node.opened = !node.opened;

            var styles = ["node_close", "node_open"],
                index = node.opened ? 0 : 1;

            $(node.li.switchIcon).removeClass(styles[index]).addClass(styles[++index % 2]);

            if(node.li.ul) {
                if(node.opened) {
                    $(node.li.ul).removeClass("hidden");
                    var parent = node;
                    while(parent = parent.parent) {
                        $(parent.li.ul).removeClass("hidden");
                        $(parent.li.switchIcon).removeClass(styles[0]).addClass(styles[1]);
                    }
                } 
                else {
                    $(node.li.ul).addClass("hidden");
                }
            }
        },

        /* 根据现有状态改成下一个选择状态，0-->2,  1|2-->0, 同时改变子节点及父节点的check状态 */
        checkNode = function(node, excludeDisabledNode) {
            if( !node.isEnable() && (excludeDisabledNode || true) ) {
                return;
            }

            var oldState = node.checkState;
            switch(oldState) {
                case 0:
                    node.checkState = 2;

                    var parent = node;
                    while(parent = parent.parent) {
                        var oldState = parent.checkState;
                        parent.refreshCheckState(Math.max(oldState, 1));
                    }

                    if(!tThis.checkSelf && node.li.ul) {
                        $("li", node.li.ul).each(function(i, childLi){
                            childLi.node.refreshCheckState(2);
                        });
                    }
                    break;
                case 1:
                case 2:
                    node.checkState = 0;

                    if(!tThis.checkSelf) {
                        $("li", node.li).each(function(i, childLi){
                            childLi.node.refreshCheckState(0);
                        });
 
                        var parent = node;
                        while(parent = parent.parent) {
                            calculateParentState(parent);
                        }
                    }

                    break;
            }

            node.refreshCheckState();
        },

        // 计算父亲节点的checkSate。判断兄弟节点还有没有选中状态的，有则所有父节点一律为半选，无则一律不选
        calculateParentState = function(parent) {
            if(parent == null) return;

            var hasCheckedChilds = false;
            parent.children.each(function(i, child){
                if(child.checkState > 0) {
                    hasCheckedChilds = true;
                }
            });

            parent.refreshCheckState( hasCheckedChilds ? 1 : 0 );
        },

        TreeNode = function(attrs, parent) {            
            this.id   = attrs[_TREE_NODE_ID];
            this.name = attrs[_TREE_NODE_NAME];

            this.opened = (attrs._open == "true");
            this.disabled = attrs[_TREE_NODE_STATE] || "0";  // 状态： 停用/启用  1/0
            this.checkState = parseInt(attrs[_TREE_NODE_CHECK_STATE] || "0"); /* 节点的选择状态 */

            this.attrs = attrs;

            // 维护成可双向树查找
            this.children = [];

            this.parent = parent;
            if(this.parent) {
                this.level = this.parent.level + 1;
                this.parent.children.push(this);
            } else {
                this.level = 1;
            }               

            this.toHTMLTree = function() {
                var stack = [];
                stack.push(this);

                var current, currentEl, rootEl, ul;
                while(stack.length > 0) {
                    current = stack.pop();
                    var currentEl = current.toHTMLEl();
                    if(rootEl == null) {
                        rootEl = currentEl;
                    }
                    else {
                        ul = rootEl.querySelector("ul[pID ='" + current.parent.id + "']");
                        ul.pNode = current;
                        ul.insertBefore(currentEl, ul.firstChild);
                    }

                    current.children.each(function(i, child) {
                        stack.push(child);
                    });
                }

                return rootEl;
            };
        };

        TreeNode.prototype = {
            toHTMLEl: function() {
                var li = $.createElement("li");
                li.setAttribute("nodeID", this.id);
                li.draggable = tThis.moveable;
                li.node = this;
                this.li = li;

                // 节点打开、关闭开关
                li.switchIcon = $.createElement("span", "switch");
                li.appendChild(li.switchIcon);

                // checkbox
                li.checkbox = $.createElement("span", "checkbox");
                li.appendChild(li.checkbox);

                // 自定义图标
                var selfIcon = $.createElement("div", "selfIcon");
                li.appendChild(selfIcon);
                li.selfIcon = $(selfIcon);

                if(this.attrs["icon"]) {
                    li.selfIcon.css("backgroundImage", "url(" + this.attrs["icon"] + ")");
                    li.selfIcon.addClass = function(cn) {
                        return this; // 如果已经自定义了图标，则忽略后面的folder、leaf等图标设置
                    }
                }

                // 节点名称
                li.a = $.createElement("a");
                li.a.innerText = li.a.title = this.name;
                li.appendChild(li.a);
                if( !this.isEnable() ) {
                    this.disable();
                }

                // 每个节点都可能成为父节点
                li.ul = $.createElement("ul");
                li.ul.setAttribute("pID", this.id);
                li.appendChild(li.ul);

                if(tThis.treeType == _TREE_TYPE_SINGLE) {
                    $(li.checkbox).addClass("hidden");
                }

                if(this.children.length > 0) {                  
                    this.opened = !this.opened;
                    clickSwich(this);

                    li.selfIcon.addClass("folder");
                }
                else { // is leaf
                    $(li.switchIcon).addClass("node_leaf").css("cursor", "default");
                    li.selfIcon.addClass("leaf");
                }

                // 添加事件
                var nThis = this;
                li.a.onclick = function(event) {
                    nThis.active();

                    event.node = nThis;
                    eventNodeActived.fire(event);
                };
                li.a.ondblclick = function(event) {
                    nThis.active();

                    event.node = nThis;
                    eventNodeDoubleClick.fire(event);
                };
                li.a.oncontextmenu = function(event) {
                    nThis.active();

                    // 触发右键激活节点事件
                    var _event = $.Event.createEventObject();
                    _event.treeNode = nThis;
                    _event.clientX = event.clientX;
                    _event.clientY = event.clientY;
                    eventNodeRightClick.fire(_event);
                };

                $(li.switchIcon).click( function() { clickSwich(nThis); } );
                $(li.checkbox).click( function() { checkNode(nThis); } );

                // 添加拖到事件处理
                $.Event.addEvent(li, "dragstart", function(ev){
                    var dt = ev.dataTransfer;
                    dt.effectAllowed = 'move';
                    dt.setData("text", li.node.id);
                }, true);        

                $.Event.addEvent(li, "dragend", function(ev) {
                    ev.dataTransfer.clearData("text");
                    ev.preventDefault(); // 不执行默认处理，拒绝被拖放
                }, true);


                $.Event.addEvent(li, "drop", function(ev){
                    var dt = ev.dataTransfer;
                    var nodeId = dt.getData("text");
                    var dragEL = $("li[nodeId='" + nodeId + "']")[0];

                    // 平级拖动，用以排序.暂不支持跨级拖动
                    if( this.node.parent == dragEL.node.parent ) {
                        // 触发自定义事件
                        var eObj = $.Event.createEventObject();
                        eObj.dragNode = dragEL.node;
                        eObj.destNode = this.node;
                        eObj.ownTree  = tThis;
                        eventNodeMoved.fire(eObj); 
                    }                   

                    ev.preventDefault();
                }, true);

                $.Event.addEvent(li, "dragover", function(ev) {
                    ev.preventDefault();
                }, true);

                return li;
            },
            
            disable: function() {
                this.disabled = "1";
                $(this.li.a).addClass("disable");
                this.li.node.refreshCheckState();
            },

            isEnable: function() {
                return this.disabled != "1";
            },

            active: function() {
                $.each(tThis.el.querySelectorAll("li"), function(i, li) {
                    $(li.a).removeClass("active");
                });

                $(this.li.a).addClass("active");
            },

            openNode: function() {
                clickSwich(this);
            },

            refreshCheckState: function(newState) {
                this.checkState = newState != null ? newState : this.checkState;
                $(this.li.checkbox).removeClass("checkstate_0_" + this.disabled)
                    .removeClass("checkstate_1_" + this.disabled)
                    .removeClass("checkstate_2_" + this.disabled)
                    .addClass("checkstate_" + this.checkState + "_" + this.disabled);
            },

            getAttribute: function(name) {
                return this.attrs[name];
            },

            setAttribute: function(name, value) {
                if(value) {
                    this.attrs[name] = value;
                } else {
                    delete this.attrs[name];
                }
            }
        };
        /********************************************* 定义树节点TreeNode end *********************************************/

        tThis.init();
        tThis.searcher = new Searcher(tThis);

        tThis.checkNode = checkNode;
        tThis.TreeNode = TreeNode;
    };

    Tree.prototype = {

        getTreeNodeById: function(id) {
            var li = this.el.querySelector("li[nodeId='" + id + "']");
            return li ? li.node : null;
        },

        /* 获取当前高亮（激活）的节点（被激活的节点一次只有一个）。如没有，则返回null。*/
        getActiveTreeNode: function() {
            var lis = this.el.querySelectorAll("li[nodeId]");
            var activeNode;
            $.each(lis, function(i, li) {
                if( $(li.a).hasClass("active") ) {
                    activeNode = li.node;
                }
            });

            return activeNode
        },

        getActiveTreeNodeAttr: function(key) {
            return this.getActiveTreeNode().attrs[key];
        }, 

        setActiveTreeNode: function(id) {
            var treeNode = this.getTreeNodeById(id);
            if(treeNode) {
                treeNode.active();
                this.scrollTo(treeNode);
            }
        },

        // 让新增节点出现在可视区域内。
        addTreeNode: function(newNode, parent) {
            parent = parent || this.getActiveTreeNode();

            if(newNode.nodeType) { // xml
                var nodeAttrs = {};
                $.each(newNode.attributes, function(j, attr) {
                    nodeAttrs[attr.nodeName] = attr.value;
                });

                newNode = nodeAttrs;
            }

            var treeNode = new this.TreeNode(newNode, parent);
            if( $("li", parent.li.ul).length == 0 ) {
                $(parent.li.switchIcon).removeClasses("node_leaf,node_close").addClass("node_open");
                parent.li.selfIcon.removeClass("leaf").addClass("folder");
            }

            parent.li.ul.appendChild(treeNode.toHTMLEl());

            this.scrollTo(treeNode);
        },

        // 删除li, 并从其parent.children中去除
        removeTreeNode: function(treeNode, retainEl) {
            retainEl = retainEl || false;
            if( !retainEl ) {
                $.removeNode(treeNode.li);
            }

            var parent = treeNode.parent;
            parent.children.remove(treeNode);
            if(parent.children.length == 0) {
                $(parent.li.switchIcon).removeClasses("node_open,node_close").addClass("node_leaf");
                parent.li.selfIcon.removeClass("folder").addClass("leaf");
            }
        },

        /*
         * 移动节点位置。
         * 参数：  from    移动节点TreeNode对象
         *          to      目标节点TreeNode对象
         */
        moveTreeNode: function(from, to) {
            var temp = to;
            while(temp == to.parent) {
                if(temp == from) {
                    return alert("不能向自己的内部节点移动。"); // 不能移动到子节点里
                }
            }

            this.removeTreeNode(from); // 将from从其原parent.children里剔除

            from.parent = to;
            to.children.push(from);

            to.li.ul.appendChild(from.li);
        },

        sortTreeNode: function(dragNode, destNode) {
            destNode.li.parentNode.insertBefore(dragNode.li, destNode.li);
        },

        searchNode: function(searchStr) {
            this.searcher.search(searchStr)
        },

        /* 将节点滚动到可视范围之内 */
        scrollTo: function(treeNode) {
            var temp = treeNode;
            while(temp = temp.parent) {
                if(!temp.opened) {
                    temp.openNode();
                }
            }

            this.el.scrollTop = treeNode.li.offsetTop - this.el.clientHeight / 2;
        },

        getCheckedIds: function(includeHalfChecked) {
            var checkedNodes = this.getCheckedNodes(includeHalfChecked);
            var checkedNodeIds = [];
            checkedNodes.each(function(i, node){
                checkedNodeIds.push(node.id);
            });

            return checkedNodeIds;
        },

        getCheckedNodes: function(includeHalfChecked) {
            var lis = this.el.querySelectorAll("li[nodeId]");
            var checkedNodes = [];
            $.each(lis, function(i, li) {
                if( $(li.checkbox).hasClass("checkstate_2_0") || $(li.checkbox).hasClass("checkstate_2_1") ) {
                    checkedNodes.push(li.node);
                }

                if(includeHalfChecked) {
                    if( $(li.checkbox).hasClass("checkstate_1_0") || $(li.checkbox).hasClass("checkstate_1_1") ) {
                        checkedNodes.push(li.node);
                    }
                }
            });

            return checkedNodes;
        },

        setCheckValues: function(checkedIds, clearOld) {
            var checkedNodes = this.getCheckedNodes(true);
            checkedNodes.each(function(i, node){
                node.refreshCheckState(0);
            });

            checkedIds = (checkedIds || "").split(',');
            for(var i = 0; i < checkedIds.length; i++) {
                var li = this.el.querySelector("li[nodeId='" + checkedIds[i] + "']");
                if(li) {
                    this.checkNode(li.node, false);
                }
            } 
        },

        getAllNodes: function() {
            var lis = this.el.querySelectorAll("li[nodeId]");
            var nodes = [];
            $.each(lis, function(i, li) {
                if(li.node.id != "_root") {
                     nodes.push(li.node);
                }
            });
            return nodes;
        },

        getAllNodeIds: function() {
            var nodes = this.getAllNodes();
            var nodeIds = [];
            nodes.each(function(i, node){
                nodeIds.push(node.id);
            });
            return nodeIds;
        }
    };

    /********************************************* 定义树查找对象 start *********************************************/
    var Searcher = function(tree) {
        var findedNodes, currentIndex, lastSearchStr;

        this.search = function(searchStr) {
            if($.isNullOrEmpty(searchStr)) {
                return alert("查询条件不能为空！");
            }

            if(lastSearchStr == searchStr) {
                this.next();
                return; 
            }

            findedNodes = [];
            currentIndex = -1;
            lastSearchStr = searchStr;

            var aNodeList = tree.el.querySelectorAll("li>a[title*='" + searchStr + "']");
            $.each(aNodeList, function(i, aNode) {
                findedNodes.push(aNode.parentNode.node);
            });

            this.next();
        }

        this.next = function() {
            if(findedNodes.length == 0) {
                return;
            }

            var node = findedNodes[++ currentIndex % findedNodes.length];
            
            node.active();
            tree.scrollTo(node);
        }
    }

    return Tree;
});


;(function ($, factory) {

    $.WorkSpace = factory();

})(tssJS, function () {

    'use strict';

    var 
    /* 样式名 */
    CSS_CLASS_TAB_BOX_HAS_TAB = "hasTab",
    CSS_CLASS_TAB_ACTIVE      = "active",
    CSS_CLASS_PHASE_ACTIVE    = "active",

    /* 点击Phase到展现内容的时间差(ms) */
    _TIMEOUT_PHASE_CLICK = 100,
    phaseClickTimeout,

    /* 自定义标签名（不含命名空间） */
    WS_NAMESPACE     = "WorkSpace",
    WS_TAG_PAGE      = "Page",
    WS_TAG_TAB       = "Tab",
    WS_TAG_TAB_BOX   = "TabBox",
    WS_TAG_PHASE     = "Phase",
    WS_TAG_PHASE_BOX = "PhaseBox",
    WS_TAG_ICON      = "Icon",
 
    /*******  Page: 管理单个子页面的显示、隐藏等控制 *********/
    Page = function (obj) { 
        this.object = obj;
        this.id = obj.id;       
        this.hide(); 
    };

    Page.prototype = {
        /* Page隐藏  */
        hide: function() {
            this.object.style.display = "none"; 
            this.isActive = false;
        },

        /* Page显示 */
        show: function() {
            this.object.style.display = "block";
            this.object.scrollTop  = 0;
            this.object.scrollLeft = 0;
            this.isActive = true;
        }
    };
 
    /*******  Tab: 负责生成水平标签页 *********/
    var Tab = function(label, phasesParams, callback, workspace) {
        this.ws = workspace;

        this.isActive = false;
        this.callback = callback;
        this.link;
        
        this.phases = {};
        this.phasesParams = phasesParams;  
        
        this.object = $.createNSElement(WS_TAG_TAB, WS_NAMESPACE);
        this.id = this.object.uniqueID;
         
        var closeIcon = $.createNSElement(WS_TAG_ICON, WS_NAMESPACE);
        closeIcon.title = "关闭";     
        this.object.appendChild(closeIcon);
        
        var div = $.createElement("div");
        div.title = div.innerText = label;
        div.noWrap = true; // 不换行
        this.object.appendChild(div);
        
        var oThis = this;
        closeIcon.onclick = this.object.ondblclick = function() {
            oThis.close();
        };  
        this.object.onclick = function() {
            if (!oThis.isActive && oThis.object) {
                oThis.click();
            }       
        };  
    };

    Tab.prototype = {

        close: function() {

            // 如果关闭的是当前激活的Tab，则需要在关闭完成后切换到第一个Tab
            var isCloseActiveTab = (this == this.ws.getActiveTab()); 
            if( isCloseActiveTab ) {
                this.clearPhases();
                if( this.link ) {
                    this.hideLink();
                }
            }

            delete this.ws.tabs[this.id];

            $.removeNode(this.object);

            this.object = this.id = this.link = null;
            this.phases = {};
            this.phasesParams = null;

            // 执行Tab页上定义的回调方法
            this.execCallBack("onTabClose");

            if( this.ws.noTabOpend() ) {
                this.ws.element.style.display = "none";
            } 
            else if( isCloseActiveTab ) {
                this.ws.switchToTab(this.ws.getFirstTab());
            }
        },

        /* 点击标签 */
        click: function() {
            this.ws.inactiveAllTabs();
            this.active();

            // 执行Tab页上定义的回调方法
            this.execCallBack("onTabChange");

            if( this.link ) {
                this.showLink();
                this.refreshPhases();
            }
        },

        /* 显示关联子页面  */
        showLink: function() {
            this.ws.showPage(this.link);
        },

        /* 关闭（隐藏）关联子页面 */
        hideLink: function() {
            this.link.hide();
        },

        /* 高亮标签 */
        active: function() {
            $(this.object).addClass(CSS_CLASS_TAB_ACTIVE);
            this.isActive = true;
        },

        /* 低亮标签  */
        inactive: function() {
            $(this.object).removeClass(CSS_CLASS_TAB_ACTIVE);
            this.isActive = false;
        },

        /* 将标签与Page对象关联 */
        linkTo: function(page) {
            this.link = page;
        },

        /* 将标签插入指定容器 */
        dockTo: function(container) {
            container.appendChild(this.object);
        },
 
        /* 切换到指定Tab页 */
        switchToPhase: function(phase) {
            if( phase ) {
                phase.click();
            }       
        },

        /* 刷新纵向标签  */
        refreshPhases: function() {
            this.clearPhases();
            
            if( this.phasesParams == null ) return;

            // 重新创建纵向标签
            for(var i=0; i < this.phasesParams.length; i++) {
                var param  = this.phasesParams[i];
                var pageId = param.page;
                var page   = this.ws.pages[pageId];

                var phase  = new Phase(param.label, this.ws);
                phase.linkTo(page);
                phase.dockTo(this.ws.phaseBox);
                if(pageId == this.link.id) {
                    phase.active();
                }

                this.phases[phase.id] = phase;
            }

            this.ws.phaseBox.style.display = "inline";  /* 显示右侧容器 */
        },

        /* 清除纵向标签  */
        clearPhases: function() {
            for(var item in this.phases) {
                var phase = this.phases[item];
                phase.dispose();
            }
            this.ws.phaseBox.innerHTML = "";
        },

        /* 低亮所有Phase标签 */
        inactiveAllPhases: function() {
            $.each(this.phases, function(name, phase) {
                phase.inactive();
            });
        },

        /* 获取激活的纵向标签 */
        getActivePhase: function() {
            for(var item in this.phases) {
                var curPhase = this.phases[item];
                if( curPhase.isActive ) {
                    return curPhase;
                }
            }
        },

        /* 激活上一个纵向标签  */
        prevPhase: function() {       
            var phaseArray = [], activePhaseIndex;

            $.each(this.phases, function(name, phase) {
                if( phase.isActive ) {
                    activePhaseIndex = phaseArray.length;
                }
                phaseArray[phaseArray.length] = phase;
            });
            
            // activePhaseIndex == 0 表示当前激活的是第一个Phase，即到顶了，则不再往上
            if( activePhaseIndex === 0) { 
                return;
            }
            this.switchToPhase(phaseArray[--activePhaseIndex]);
        },

        /* 激活下一个纵向标签 */
        nextPhase: function() {
            var phaseArray = [], activePhaseIndex = 0;
            $.each(this.phases, function(name, phase) {
                if( phase.isActive ) {
                    activePhaseIndex = phaseArray.length;
                }
                phaseArray[phaseArray.length] = phase;
            });

            // activePhaseIndex == phaseArray.length - 1 表示当前激活的是最后一个Phase，即到末尾了
            if(activePhaseIndex === phaseArray.length - 1) { 
                return;
            }
            this.switchToPhase(phaseArray[++activePhaseIndex]);
        },

        /*
         *  执行回调函数
         *  参数：  string:eventName        事件名称
                    object:params           回调函数可用参数
         */
        execCallBack: function(eventName, params) {
            if( this.callback ) {
                $.execCommand(this.callback[eventName], params);
            }
        }
    };

    /* **************** Phase ：负责生成右侧纵向标签页 ***********************/
    var Phase = function(label, workspace) {
        this.ws = workspace;

        this.link;
        this.isActive = false;
        
        this.object = $.createNSElement(WS_TAG_PHASE, WS_NAMESPACE);
        this.id = this.object.uniqueID;
        
        var div = $.createElement("div");
        div.title = div.innerText = label;
        div.noWrap = true;
        
        this.object.appendChild(div);       
        
        var oThis = this;
        this.object.onclick = function() {
            if (!oThis.isActive) {
                oThis.click();
            }       
        };  
    }

    Phase.prototype = {
        /* 将标签与Page对象关联  */
        linkTo: function(pageInstance) {
            this.link = pageInstance;
        },

        /* 将标签插入指定容器 */
        dockTo: function(container) {
            container.appendChild(this.object);
        },

        /* 释放纵向标签实例 */
        dispose: function() {
            var curActiveTab = this.ws.getActiveTab();
            delete curActiveTab.phases[this.id];
            $.removeNode(this.object);
            this.object = this.id = this.link = null;
        },

        /* 点击标签  */
        click: function() {
            var activeTab = this.ws.getActiveTab();
            activeTab.inactiveAllPhases();

            this.active();
            this.scrollToView();

            var thisPhase = this;

            // 避免切换太快时显示内容跟不上响应
            clearTimeout( phaseClickTimeout );
            
            phaseClickTimeout = setTimeout( function() {
                /* 显示关联子页面 */
                if( thisPhase.link ) {
                    this.ws.showPage(thisPhase.link);
                    activeTab.linkTo(thisPhase.link);
                }
            }, _TIMEOUT_PHASE_CLICK );
        },

        /* 将控制标签显示在可见区域内 */
        scrollToView: function() {
            var tempTop = this.object.offsetTop;
            var tempBottom = this.object.offsetTop + this.object.offsetHeight;
            var areaTop = this.ws.phaseBox.scrollTop;
            var areaBottom = areaTop + this.ws.phaseBox.offsetHeight;
            if(tempTop < areaTop) {
                this.ws.phaseBox.scrollTop = tempTop;
            }
            else if(tempBottom > areaBottom) {
                this.ws.phaseBox.scrollTop = tempBottom - this.ws.phaseBox.offsetHeight;
            }
        },

        /* 高亮纵向标签 */
        active: function() {
            $(this.object).addClass(CSS_CLASS_PHASE_ACTIVE);
            this.isActive = true;
        },

        /* 低亮纵向标签 */
        inactive: function() {
            $(this.object).removeClass(CSS_CLASS_PHASE_ACTIVE);
            this.isActive = false;
        }
    }

    /* ***********************************************************************************************
       控件名称：标签式工作区
       功能说明：1、动态创建Tab标签
                 2、动态创建纵向Tab标签
                 3、Tab标签控制子页面显示
                 4、双击Tab标签可关闭 
    * ***********************************************************************************************/
    var WorkSpace = function(ws) {
        this.element = ws.nodeType ? ws : $("#" + ws)[0];
 
        this.tabs  = {};
        this.pages = {};

        /* 初始子页面 */
        var childs = $.getNSElements(this.element, WS_TAG_PAGE, WS_NAMESPACE);
        for(var i=0; i < childs.length; i++) {
            var curNode = childs[i]; 
            this.pages[curNode.id] = new Page(curNode);
        }

        this.createUI();
    };

    WorkSpace.prototype = {

        /* 创建界面展示 */
        createUI: function() {
            /* 创建Tab标签的容器 */
            this.tabBox = $.createNSElement(WS_TAG_TAB_BOX, WS_NAMESPACE);
            this.element.appendChild(this.tabBox);
            
            var refChild = this.element.firstChild;
            if(refChild != this.tabBox) {
                this.element.insertBefore(this.tabBox, refChild); // 插入到第一个
            }

            /* 创建纵向Tab标签的容器 */
            this.phaseBox = $.createNSElement(WS_TAG_PHASE_BOX, WS_NAMESPACE);
            this.element.appendChild(this.phaseBox);

            var refChild = this.element.childNodes[1];
            if(this.phaseBox != refChild && refChild) {
                this.element.insertBefore(this.phaseBox, refChild);
            }

            // 隐藏右侧容器
            this.phaseBox.style.display = "none"; 
        },
         
        /* 打开子页面  */
        open: function(inf) {
            this.element.style.display = "";

            var tab;
            for(var item in this.tabs) {
                if(inf.SID == this.tabs[item].SID) {
                    tab = this.tabs[item];
                }
            }
            
            // 不存在同一数据源tab则新建
            if(null == tab) {             
                tab = new Tab(inf.label, inf.phases, inf.callback, this);
                tab.SID = inf.SID; // 标记
                this.tabs[tab.id] = tab;

                var page = this.pages[inf.defaultPage];
                tab.linkTo(page);
                tab.dockTo(this.tabBox);

                $(this.tabBox).addClass(CSS_CLASS_TAB_BOX_HAS_TAB);
            }
            
            tab.click();
            return tab;
        },

        showPage: function(page) {
            /* 先隐藏所有子页面  */
            for(var item in this.pages) {
                var curPage = this.pages[item];
                if(curPage.isActive) {
                    curPage.hide();
                }
            }

            page.show();
        },

        /* 获得第一个Tab */
        getFirstTab: function() {
            for(var item in this.tabs) {
                return this.tabs[item];
            }
        },

        /* 切换到指定Tab页 */
        switchToTab: function(tab) {
            if( tab ) {
                tab.click();
            } 
            else {
                $(this.tabBox).removeClass(CSS_CLASS_TAB_BOX_HAS_TAB);
            }
        },

        /* 获取当前激活标签 */
        getActiveTab: function() {
            for(var item in this.tabs) {
                var tab = this.tabs[item];
                if( tab.isActive ) {
                    return tab;
                }
            }
        },

        /* 关闭当前激活标签 */
        closeActiveTab: function() {
            var tab = this.getActiveTab();
            if( tab ) {
                tab.close();
            }
        },

        /* 低亮所有标签 */
        inactiveAllTabs: function() {
            for(var item in this.tabs) {
                var curTab = this.tabs[item];
                curTab.inactive();
            }
        },
         
        /* 激活上一个Phase标签 */
        prevPhase: function() {
            var tab = this.getActiveTab();
            if( tab ) {
                return tab.prevPhase();
            }
        },

        /* 激活下一个Phase标签 */
        nextPhase: function() {
            var tab = this.getActiveTab();
            if( tab ) {
                return tab.nextPhase();
            }
        },

        switchToPhase: function(pageId) {
            var page = this.pages[pageId];
            this.showPage(page);
        },

        noTabOpend: function() {
            var length = 0; 
            for(var item in this.tabs) {
                length ++;
            }
            return length == 0;
        }
    };

    return WorkSpace;
}); 