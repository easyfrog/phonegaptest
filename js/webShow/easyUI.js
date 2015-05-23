
/**
 * ztc's easy Web UI
 */
var EasyUI = function(parent) {
    var s = this;

    // parent
    parent = parent || document.body;
    s.parent = parent;

    // main dom div and style
    s.dom = document.createElement("div");
    s.dom.style.position = "absolute";
    s.dom.style.top = s.dom.style.left = "0px";
    s.dom.style.font = "16px 微软雅黑";
    s.dom.style.width = s.dom.style.height = "100%";
    s.dom.style.pointerEvents = "none";
    s.dom.style.color = "#EEEEEE";
    s.x = s.y = 0;
    s.parent.appendChild(s.dom);
    s.widgets = [];

    // fix all elements position
    window.addEventListener( 'resize', function() { s.fixElementsPostion();} );
};

EasyUI.prototype.getWidth = function() {
    return this.parent.clientWidth;
};
EasyUI.prototype.getHeight = function() {
    return this.parent.clientHeight;
};

EasyUI.TOP_LEFT      = "top_left";
EasyUI.TOP_MIDDLE    = "top_middle";
EasyUI.TOP_RIGHT     = "top_right";
EasyUI.MIDDLE_LEFT   = "middle_left";
EasyUI.MIDDLE        = "middle";
EasyUI.MIDDLE_RIGHT  = "middle_right";
EasyUI.BOTTOM_LEFT   = "bottom_left";
EasyUI.BOTTOM_MIDDLE = "bottom_middle";
EasyUI.BOTTOM_RIGHT  = "bottom_right";

EasyUI.prototype.append = function(element) {
    this.dom.appendChild(element.dom);
    element.parent = this;
    this.widgets.push(element);

    // fix postion
    EasyUI.fixPos(element);
};

EasyUI.prototype.fixElementsPostion = function() {
    for (var i in this.widgets) {
        this.widgets[i].fixPostion();
    }
};

EasyUI.fixPos  = function (widget,x_offset,y_offset,anchor) {
    var ww = widget.parent.getWidth();
    var hh = widget.parent.getHeight();
    var l,t;
    x_offset = x_offset || widget.x;
    y_offset = y_offset || widget.y;
    anchor = anchor || widget.anchor;
    switch (anchor) {
        case EasyUI.TOP_LEFT:
            l = x_offset;
            t = y_offset;
            break;
        case EasyUI.TOP_MIDDLE:
            l = (ww - widget.width) / 2 + x_offset;
            t = y_offset;
            break;
        case EasyUI.TOP_RIGHT:
            l = ww - widget.width + x_offset;
            t = y_offset;
            break;
        case EasyUI.MIDDLE_LEFT:
            l = x_offset;
            t = (hh - widget.height) / 2 + y_offset;
            break;
        case EasyUI.MIDDLE:
            l = (ww - widget.width) / 2 + x_offset;
            t = (hh - widget.height) / 2 + y_offset;
            break;
        case EasyUI.MIDDLE_RIGHT:
            l = ww - widget.width + x_offset;
            t = (hh - widget.height) / 2 + y_offset;
            break;
        case EasyUI.BOTTOM_LEFT:
            l = x_offset;
            t = hh - widget.height + y_offset;
            break;
        case EasyUI.BOTTOM_MIDDLE:
            l = (ww - widget.width) / 2 + x_offset;
            t = hh - widget.height + y_offset;
            break;
        case EasyUI.BOTTOM_RIGHT:
            l = ww - widget.width + x_offset;
            t = hh - widget.height + y_offset;
            break;
    }

    widget.dom.style.left = l + 'px';
    widget.dom.style.top = t + 'px';
};

EasyUI.setBaseSytle = function(widget) {
    widget.dom.style.width = widget.width + "px";
    widget.dom.style.height = widget.height + "px";
    widget.dom.style.lineHeight = widget.dom.style.height;
    widget.dom.style.textAlign = "center";
    widget.dom.style.position = "absolute";
    widget.dom.style.pointerEvents = "auto";
    widget.dom.style.overflow = "hidden";
};

/**
 * widget 控件的基类. p = params
 */
var Widget = function(p) {
    var s = this;
    s.width = p.width || 100;
    s.height = p.height || 100;
    s.x = p.x || 0;
    s.y = p.y || 0;
    s.anchor = p.anchor || EasyUI.TOP_LEFT;
    s.normalColor = p.normalColor || "#222222";
    s.overColor = p.overColor || "#333333";
    s.pressColor = p.pressColor || "#111111";
    s.parent = undefined;
    s.type = "widget";
    s.dom = document.createElement("div");
    EasyUI.setBaseSytle(s, s.width, s.height, s.x, s.y);
};

Widget.prototype.fixPostion = function() {
    EasyUI.fixPos(this);
};

Widget.prototype.getWidth = function() {
    return this.dom.clientWidth;
};

Widget.prototype.getHeight = function() {
    return this.dom.clientHeight;
};

Widget.prototype.setWidth = function(val) {
    this.dom.style.width = val;
};

Widget.prototype.setHeight = function(val) {
    this.dom.style.height = val;
};

/**
 * panel class
 */
EasyUI.Panel = function(p) {
    var s = this;
    Widget.call(s,p);
    EasyUI.setBaseSytle(s);
    s.widgets = [];
    s.type = "panel";
};

EasyUI.Panel.prototype = Object.create(Widget.prototype);

EasyUI.Panel.prototype.append = function(element) {
    EasyUI.prototype.append.call(this,element);
};

/**
 * Button class
 */
EasyUI.Button = function(p) {
    var s = this;
    Widget.call(s,p);
    s.type = "Button";

    s.isAnimate = p.isAnimate || true;

    // events
    s.dom.onmousedown = function() {return false;};
    s.dom.addEventListener("click", p.click);
    s.dom.addEventListener("mousedown",function() {
        s.setBackgroundColor(s.pressColor);
        if (s.isAnimate) {
            s.dom.style.webkitTransform = "scale(1.1,1.1)";
            setTimeout(function() {
                s.dom.style.webkitTransform = "scale(1,1)";
            },200);
        };
    });
    s.dom.addEventListener("mouseup",function() {
        s.setBackgroundColor(s.normalColor);
    });
    s.dom.addEventListener("mouseenter",function() {
        s.setBackgroundColor(s.overColor);
        s.dom.style.cursor = "pointer";
    });
    s.dom.addEventListener("mouseout",function() {
        s.setBackgroundColor(s.normalColor);
    });

    // dom css transition
    // s.dom.style.transition = "all 0.2s ease-out";

    // background
    s.bg = document.createElement("div");
    s.bg.style.backgroundColor = s.normalColor;
    s.bg.style.position = "absolute";
    s.bg.style.opacity = 0.4;
    s.bg.style.width = s.bg.style.height = "100%";
    s.bg.style.borderRadius = "5px";
    s.dom.appendChild(s.bg);

    // text <a></a>
    s.text = document.createElement("div");
    s.text.innerHTML = p.text || "";
    s.text.style.position = "relative";
    s.text.style.opacity = 1;
    s.dom.appendChild(s.text);
};
EasyUI.Button.prototype = Object.create(Widget.prototype);

EasyUI.Button.prototype.setBackgroundColor = function(color) {
    this.bg.style.backgroundColor = color;
};

EasyUI.Button.prototype.setIsAnimate = function( isAnimate ) {
    this.isAnimate = isAnimate;
    if (isAnimate) {
        this.dom.style.transition = "all 0.2s ease-out";
    } else {
        this.dom.style.transition = "";
    }
};

EasyUI.Button.prototype.setText = function(text) {
    this.text.innerHTML = text;
};

EasyUI.Button.prototype.getText = function() {
    return this.text.innerHTML;
};

EasyUI.Button.prototype.addEventListener = function (type,func) {
    this.dom.addEventListener(type,func);
};

EasyUI.Button.prototype.visible = function(show) {
    if (show == undefined) show = true;
    this.dom.style.display = show ? "block" : "none";
};

/**
 * EasyUI Progress Bar
 * @param {dom} p parent dom
 */
EasyUI.ProgressBar = function(p) {
    var s = this;
    Widget.call(s,p);

    s.type = 'ProgressBar';

    s.value = 0;

    // background
    s.bg = document.createElement("div");
    s.bg.style.backgroundColor = s.normalColor;
    s.bg.style.position = "absolute";
    s.bg.style.opacity = 0.4;
    s.bg.style.width = s.bg.style.height = "100%";
    s.dom.appendChild(s.bg);

    // foreground
    s.fg = document.createElement('div');
    s.fg.style.backgroundColor = s.overColor;
    s.fg.style.position = 'absolute';
    s.fg.style.opacity = 0.8;
    s.fg.style.height = '100%';
    s.fg.style.width = 0;
    s.dom.appendChild(s.fg);

    // text
    s.text = document.createElement("div");
    s.text.innerHTML = p.text || '0%';
    s.text.style.position = "relative";
    s.text.style.opacity = 1;
    s.dom.appendChild(s.text);
}

EasyUI.ProgressBar.prototype = Object.create(Widget.prototype);

/**
 * val = 0 ~ 1
 */
EasyUI.ProgressBar.prototype.setValue = function(val) {
    var s = this;

    s.value = val;
    s.fg.style.width = s.width * val + 'px';
    s.text.innerHTML = (val * 100).toFixed(1) + '%';
};