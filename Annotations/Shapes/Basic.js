function Point(x, y) {
    this.x = x;
    this.y = y;
}

function PointChange(name, offsetx, offsety) {
    this.name = name;
    this.offsetx = offsetx;
    this.offsety = offsety;
}

var ConfigTypeEnum = {
    COLOR: "COLOR",
    OPACITY: "OPACITY",
    LINESTYLE: "LINESTYLE",
    LINEWIDTH: "LINEWIDTH",
    BOOLEAN: "BOOLEAN"
}

var LineStyleEnum = {
    NONE: "NONE",
    DOT: "DOT",
    SOLID: "SOLID"
}

var namespaceEnum ={
    SVG: 'http://www.w3.org/2000/svg',
    XHTML: 'http://www.w3.org/1999/xhtml'
}

function Rect(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.endX = x + width;
    this.endY = y + height;
}

ShapeConfig = function(name, value, type) {
    this.name = name;
    this.value = value;
    this.type = type;
}

function Basic() {
    this.moveTo = function (x, y) {
        this.beginX = x;
        this.beginY = y;
    };

    this.getDistance = function (a, b) {
        return Math.sqrt((b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y));
    };
    this.getRect = function (beginX, beginY, endX, endY) {
        var width = Math.abs(endX - beginX);
        var height = Math.abs(endY - beginY);
        beginX = Math.min(beginX, endX);
        beginY = Math.min(beginY, endY);
        return new Rect(beginX, beginY, width, height);
    };

    this.getLayerPoints = function () {
        return {beginX: this.beginX, beginY: this.beginY, endX: this.endX, endY:this.endY};
    }

    function Rect(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.endX = x + width;
        this.endY = y + height;
    }
}