function TextBoxWithLine(sandbox, withLine) {
    var group = null;
    var rect = null;
    var line = null;
    var marker = null;
    var path = null;
    var foreignObject = null;
    var textDiv, textP;

    var styles = null;
    var eventHandlers = {};

    var points = {};
    var fitPoints = {};
    var mobileOriginalPoints = {};
    var mobileMiniPoints = null;
    var mobileAutoFitPoints = null;
    var config = null;
    var isIE = true;

    var text = "";
    var mobileOriginalText = "";
    var mobileMiniText = "";
    this.showText = true;
    this.editText = false;

    if (typeof (withLine) === "undefined" || withLine === true) {
        this.withLine = true;
    } else {
        this.withLine = false;
    }

    function createSVGElement(strType) {
        return document.createElementNS(namespaceEnum.SVG, strType)
    }

    function createXHTMLElement(strType) {
        return document.createElementNS(namespaceEnum.XHTML, strType)
    }

    this.init = function () {
        group = createSVGElement('g');
        rect = createSVGElement('rect');
        line = createSVGElement('line');
        marker = createSVGElement('marker');
        path = createSVGElement('path');
        isIE = ibdEnviroment.Browser.Name === "Netscape" || ibdEnviroment.Browser.Name === "Microsoft Internet Explorer";
        if (!isIE) {
            foreignObject = createSVGElement('foreignObject');
        }
        else {
            foreignObject = createXHTMLElement('div');
        }
        textDiv = createXHTMLElement('div');
        textP = document.createElement("p");
        textP.className = "annotation-text";
        textP.classList.add("wrapword");
        textDiv.appendChild(textP);
        foreignObject.appendChild(textDiv);

        group.appendChild(rect);
        if (!isIE) {
            group.appendChild(foreignObject);
        }
        if (this.withLine) {
            group.appendChild(line);
            group.appendChild(marker);
        }

        marker.appendChild(path);

        config = {
            boxLineStyle: new ShapeConfig("boxLineStyle", LineStyleEnum.SOLID, ConfigTypeEnum.LINESTYLE),
            boxLineWidth: new ShapeConfig("boxLineWidth", 1, ConfigTypeEnum.LINEWIDTH),
            boxLineColor: new ShapeConfig("boxLineColor", "#000000", ConfigTypeEnum.COLOR),
            boxLineOpacity: new ShapeConfig("boxLineOpacity", 1, ConfigTypeEnum.OPACITY),
            boxFillColor: new ShapeConfig("boxFillColor", "red", ConfigTypeEnum.COLOR),
            boxFillOpacity: new ShapeConfig("boxFillOpacity", 0.5, ConfigTypeEnum.OPACITY),
            textColor: new ShapeConfig("textColor", "#000000", ConfigTypeEnum.COLOR),
        }
    };

    this.config = function (val, redraw) {
        if (typeof (val) === "undefined") {
            return JSON.parse(JSON.stringify(config))
        }
        config = val;
        if (redraw === true) {
            //self.redraw();
            sandbox.saveShape(true, true);
        }
    }

    this.text = function (val, redraw) {
        //if (typeof (val) === "undefined") {
        //    return text;
        //}
        //if (ibdEnviroment.Device.isMobile || ibdEnviroment.MobilePreview.isShortText) {
        //    mobileOriginalText = val;
        //    if (val.length > 20) {
        //        mobileMiniText = val.substr(0, 20) + "...";
        //    } else {
        //        mobileMiniText = val;
        //    }
        //    if (redraw)
        //    {
        //        text = val;
        //    }
        //    else {
        //        text = mobileMiniText;
        //    }
        //    //text = mobileMiniText;
        //} else {
        //    text = val;
        //}
        //if (redraw) {
        //    //self.redraw();
        //    sandbox.saveShape(true, true);
        //}
        return ibdEnviroment.MobilePreview.text;
    }

    this.getStartPointByDistance = function (startPoints) {
        var startPoint = null;
        var mindist = Number.MAX_VALUE;
        for (var i in startPoints) {
            var dist = this.getDistance(points.lineend, startPoints[i]);
            if (dist < mindist) {
                mindist = dist;
                startPoint = startPoints[i];
            }
        }
        return startPoint;
    }

    this.getLineStartPoint = function () {
        var startPoints = getStartPoints();
        if (points.lineend.x < points.topleft.x && points.bottomleft.y < points.lineend.y < points.topleft.y) {
            return startPoints.left;
        }
        if (points.lineend.x > points.topright.x && points.bottomleft.y < points.lineend.y < points.topleft.y) {
            return startPoints.right;
        }
        if (points.lineend.y < points.bottomright.y && points.topleft.x < points.lineend.x < points.topright.x) {
            return startPoints.top;
        }
        if (points.lineend.y > points.topright.y && points.topleft.x < points.lineend.x < points.topright.x) {
            return startPoints.bottom;
        }

        return this.getStartPointByDistance(startPoints);
    }

    this.lineTo = function (mouseX, mouseY) {
        var rect = this.getRect(this.beginX, this.beginY, mouseX, mouseY);
        this.beginX = rect.x,
            this.beginY = rect.y;
        this.endX = rect.endX;
        this.endY = rect.endY;

        if (Math.abs(this.beginX - this.endX) < 5 || Math.abs(this.beginY - this.endY) < 5) {
            return;
        }

        var rectRatio = this.withLine ? 0.8 : 1;
        var topleft = new Point(rect.x, rect.y);
        var topright = new Point(rect.x + rectRatio * rect.width, rect.y);
        var bottomleft = new Point(rect.x, rect.endY);
        var bottomright = new Point(rect.x + rectRatio * rect.width, rect.endY);
        var lineend = this.withLine ? new Point(rect.endX, rect.y + 0.5 * rect.height) : null;

        this.drawShape(topleft, topright, bottomleft, bottomright, lineend);
    };

    this.translate = function (beginX, beginY, endX, endY) {
        var rect = this.getRect(beginX, beginY, endX, endY);
        this.beginX = rect.x,
            this.beginY = rect.y;
        this.endX = rect.endX;
        this.endY = rect.endY;

        if (isNaN(endX) || isNaN(endY) || Math.abs(beginX - endX) < 5 || Math.abs(beginY - endY) < 5) {
            return false;
        }

        var rectRatio = this.withLine ? 0.8 : 1;
        var topleft = new Point(rect.x, rect.y);
        var topright = new Point(rect.x + rectRatio * rect.width, rect.y);
        var bottomleft = new Point(rect.x, rect.endY);
        var bottomright = new Point(rect.x + rectRatio * rect.width, rect.endY);
        var lineend = this.withLine ? new Point(rect.endX, rect.y + 0.5 * rect.height) : null;
        this.drawShape(topleft, topright, bottomleft, bottomright, lineend);
        return true;
    };

    this.drawShape = function (topleft, topright, bottomleft, bottomright, lineend, isFitText, event) {
        if ((bottomright.x - topleft.x < 0) || (bottomright.y - topleft.y < 0)) {
            return;
        }
        var boxLineWidth = config.boxLineStyle.value === LineStyleEnum.NONE ? 0 : config.boxLineWidth.value;
        var boxLineStyle = config.boxLineStyle.value === LineStyleEnum.DOT ? "9, 5" : "";
        rect.setAttribute('style', 'fill:' + config.boxFillColor.value + ';stroke:' + config.boxLineColor.value + ';fill-opacity:' + config.boxFillOpacity.value +
            ';stroke-opacity:' + config.boxLineOpacity.value + ';' + '; stroke-dasharray:' + boxLineStyle + '; stroke-width:' + boxLineWidth + ';shape-rendering:crispEdges');

        points.topleft = topleft;
        points.topright = topright;
        points.bottomleft = bottomleft;
        points.bottomright = bottomright;
        if (this.withLine) {
            points.lineend = lineend;
        }
        this.beginX = topleft.x;
        this.beginY = topleft.y;
        this.endX = this.withLine ? lineend.x : bottomright.x;
        this.endY = bottomright.y;

        var width = bottomright.x - topleft.x;
        var height = bottomright.y - topleft.y;
        var radius = Math.min(width, height) / 10.0;
        rect.setAttribute('x', topleft.x);
        rect.setAttribute('y', topleft.y);
        rect.setAttribute('width', width);
        rect.setAttribute('height', height);
        if (!isIE) {
            foreignObject.setAttribute('x', topleft.x + 5);
            foreignObject.setAttribute('y', topleft.y + 5);
        }
        else {
            $(foreignObject).css('position', 'absolute');
            $(foreignObject).css('cursor', 'default');
            $(foreignObject).css('left', (topleft.x + 5) + 'px');
            $(foreignObject).css('top', (topleft.y + 5) + 'px');
        }
        foreignObject.setAttribute('width', width > 10 ? width - 10 : 0);
        foreignObject.setAttribute('height', height > 10 ? height - 10 : 0);

        textP.style.color = config.textColor.value;
        textP.style.width = (width - 10) + 'px';
        textDiv.style.width = (width - 10) + 'px';
        textDiv.style.height = (height - 10) + 'px';

        var text = this.text();
        if (text && text.length !== 0) {
            textP.innerText = text;
        } else {
            textP.innerText = "";
        }
        fitPoints = points;
        //auto fit the height of text
        var fitHeight = $(textP).height();
        if ((ibdEnviroment.Device.isMobile || ibdEnviroment.MobilePreview.isShortText) && isFitText) {
            rect.setAttribute('height', fitHeight + 10);
            fitPoints.bottomleft.y = fitPoints.topleft.y + fitHeight + 10;
            fitPoints.bottomright.y = fitPoints.topright.y + fitHeight + 10;
        }
        if (fitHeight > height && !(ibdEnviroment.Device.isMobile || ibdEnviroment.MobilePreview.isShortText)) {
            textDiv.style.height = (fitHeight - 10) + 'px';
            rect.setAttribute('height', fitHeight + 10);
            foreignObject.setAttribute('height', fitHeight > 10 ? height - 10 : 0);
            this.endY += fitHeight - height;
            if (event === 'mouseup' || this.editText) {
                fitPoints.bottomleft.y += fitHeight - height + 10;
                fitPoints.bottomright.y += fitHeight - height + 10;
            }
        }
        if (isFitText && (ibdEnviroment.Device.isMobile || ibdEnviroment.MobilePreview.isShortText) && $(textP).text() != "") {
            textDiv.style.height = (fitHeight + 10) + 'px';
            rect.setAttribute('height', fitHeight + 10);
            foreignObject.setAttribute('height', fitHeight + 10);
        }
    };


    this.startDraw = function () {
        sandbox.appendShape(group);
        if (isIE) {
            sandbox.appendShape(foreignObject);
        }
    }

    this.hide = function () {
        $(group).hide();
        if (isIE) {
            $(foreignObject).hide();
        }
    }

    this.show = function () {
        $(group).show();
        if (isIE) {
            $(foreignObject).show();
        }
    }

    this.draw = function (points) {
        this.drawShape(points[0], points[1], points[2], points[3], points[4]);
    }

    this.redraw = function (isFitText, event) {
        this.drawShape(points.topleft, points.topright, points.bottomleft, points.bottomright, points.lineend, isFitText, event);
    }

    this.autoFitText = function () {
        if (mobileAutoFitPoints === null) {
            mobileAutoFitPoints = calculateAutoFitPointsForMobile(points);
        }
        points = mobileAutoFitPoints;
        text = mobileOriginalText;
        this.redraw(true);
    }

    this.cancelAutoFitText = function () {
        points = mobileAutoFitPoints;
        text = mobileMiniText;
        this.redraw(true);
    }

    this.getPoints = function () {
        return JSON.parse(JSON.stringify(points));
        ;
    }

    this.getFitPoints = function () {
        return fitPoints;
    }

    this.getLayerPoints = function () {
        return {beginX: this.beginX - 10, beginY: this.beginY - 10, endX: this.endX, endY: this.endY};
    }

    this.setPoints = function (val) {
        if (ibdEnviroment.Device.isMobile || ibdEnviroment.MobilePreview.isShortText) {
            mobileOriginalPoints = val;
            mobileMiniPoints = calculateDisplayPointsForMobile(val);
            points = mobileMiniPoints;
        } else {
            points = val;
        }
    }

    this.updatePoints = function (pointChanges) {
        if (!pointChanges || pointChanges.length === 0) {
            return;
        }
        for (var i = 0; i < pointChanges.length; ++i) {
            var pointChange = pointChanges[i];
            if (typeof (points[pointChange.name]) === "undefined") {
                console.warn("Cannot find point for " + pointChange.name);
                continue;
            }
            var point = points[pointChange.name];
            points[pointChange.name] = new Point(point.x + pointChange.offsetx, point.y + pointChange.offsety);
            //adjustPoints(pointChange.name);
        }

        this.drawShape(points.topleft, points.topright, points.bottomleft, points.bottomright, points.lineend);
    }

    this.updatePoint = function (pointChange) {
        if (typeof (points[pointChange.name]) === "undefined") {
            console.error("Cannot find point for " + pointChange.name);
            return;
        }

        var point = points[pointChange.name];
        points[pointChange.name] = new Point(point.x + pointChange.offsetx, point.y + pointChange.offsety);
        adjustPoints(pointChange.name);
        this.drawShape(points.topleft, points.topright, points.bottomleft, points.bottomright, points.lineend);
    }
    var ev = {target: this};
    this.addEventListener = function (event, handler, message) {
        console.log("Rect.addEventListener " + event);
        eventHandlers[event] = handler;

        group.addEventListener(event, function (e) {
            ev.e = e;
            handler(ev);
            console.log("Rect event: " + e.type);
        }, false);

        if (isIE) {
            foreignObject.addEventListener(event, function (e) {
                ev.e = e;
                handler(ev);
                console.log("foreignObject event: " + e.type);
            }, false);
        }
    };

    this.updateText = function (text) {
        this.text = text;
        var points = this.getPoints();
        this.drawShape(points.topleft, points.topright, points.bottomleft, points.bottomright, points.lineend);
    }

    this.select = function () {
        var mouseDownHandler = eventHandlers['mousedown'];
        if (mouseDownHandler) {
            mouseDownHandler({
                target: this
            });
        }
    }

    this.save = function (event) {
        //sandbox.saveShape(true, true);
        sandbox.saveUpdatedShape(event);
    }

    this.delete = function () {
        if (group.parentNode != null) {
            group.parentNode.removeChild(group);
            if (isIE && foreignObject.parentNode != null) {
                foreignObject.parentNode.removeChild(foreignObject);
            }
        }
    };

    function getStartPoints() {
        var res = {};
        res.left = new Point(points.topleft.x, (points.topleft.y + points.bottomleft.y) / 2);
        res.top = new Point((points.topleft.x + points.topright.x) / 2, points.topleft.y);
        res.right = new Point(points.topright.x, (points.topright.y + points.bottomright.y) / 2);
        res.bottom = new Point((points.bottomleft.x + points.bottomright.x) / 2, points.bottomleft.y);
        return res;
    }

    function adjustPoints(pointName) {
        if (pointName === "topleft") {
            points.bottomleft = new Point(points.topleft.x, points.bottomleft.y);
            points.topright = new Point(points.topright.x, points.topleft.y);
        } else if (pointName === "topright") {
            points.topleft = new Point(points.topleft.x, points.topright.y);
            points.bottomright = new Point(points.topright.x, points.bottomright.y);
        } else if (pointName === "bottomleft") {
            points.topleft = new Point(points.bottomleft.x, points.topleft.y);
            points.bottomright = new Point(points.bottomright.x, points.bottomleft.y);
        } else if (pointName === "bottomright") {
            points.bottomleft = new Point(points.bottomleft.x, points.bottomright.y);
            points.topright = new Point(points.bottomright.x, points.topright.y);
        } else if (pointName === "lineend") {
        }
    }

    function calculateAutoFitPointsForMobile(originPoints) {
        var textP = document.createElement("p");
        textP.className = "annotation-text";
        textP.style.display = "absolute";
        textP.style.top = "0";
        textP.style.left = "0";
        textP.style.width = (Math.abs(originPoints.topleft.x - originPoints.topright.x) - 10) + "px";
        textP.style.visibility = "hidden";
        textP.innerText = mobileOriginalText;
        document.body.appendChild(textP);
        var height = textP.clientHeight + 15;
        document.body.removeChild(textP);

        return {
            topleft: originPoints.topleft,
            topright: originPoints.topright,
            bottomleft: originPoints.bottomleft,
            bottomright: originPoints.bottomright,
            lineend: originPoints.lineend
        };
    };

    function calculateDisplayPointsForMobile(originPoints) {
        return {
            topleft: originPoints.topleft,
            topright: originPoints.topright,
            bottomleft: originPoints.bottomleft,
            bottomright: originPoints.bottomright,
            lineend: originPoints.lineend
        };
    };

    this.setText = function (newText) {
        text = newText;
    };

    this.quickDraw = function (shape) {
        sandbox.select(shape);
    }

    this.saveQuickDraw = function (shape) {
        var position = DrawCore.getModule('builder').instance.getAnnotationPosition(points.topleft.x, points.topleft.y, points.bottomright.x, points.bottomright.y, sandbox.descriptor.getLayer());
        for (var i in position) {
            shape.annotationDTO[i] = position[i];
        }
        shape.annotationDTO.pointsJson = sandbox.getPointsJson(points);
        shape.annotationDTO.configJson = JSON.stringify(config);
        shape.annotationDTO.noteText = text;
        shape.annotationDTO.NoteText = text;
        shape.NoteText = text;

        sandbox.saveAnnotation(shape);
    }

};

TextBoxWithLine.prototype = new Basic();
