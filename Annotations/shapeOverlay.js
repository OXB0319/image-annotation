var ShapeOverlay = function(sandbox) {
    this.currentShape = null;
    var self = this;
    var offset = 0;
    function createElement(tag, className, id) {
        var ele = document.createElement(tag);
        if (className) {
            ele.className = className;
        }
        if (id) {
            ele.id = id;
        }
        return ele;
    }
    function createDivElement(className, id) {
        return createElement("div", className, id);
    }
    function createButtonElement(className, id) {
        return createElement("button", className, id);
    }
    function showElement(element) {
        element.style.display = "block";
    }
    function hideElement(element) {
        element.style.display = "none";
    }
    function createOutlineDiv() {
        var outline = document.createElement("div");
        outline.className = "overlay-outline overlay-cursor-move";
        return outline;
    }
    function createButtonsDiv() {
        var overlayButtons = createDivElement("overlay-buttons");
        var buttonsTrigger = createDivElement("overlay-buttons-trigger");
        var textButton = createButtonElement("overlay-buttons-btn", "overlay-buttons-text");
        textButton.title = "Click to enter text in the shape.";
        textButton.style.display = "inline-block";
        textButton.addEventListener("click", onTextButtonClick);
        var styleButton = createButtonElement("overlay-buttons-btn", "overlay-buttons-style");
        styleButton.title = "Click to show style editor.";
        styleButton.style.display = "inline-block";
        styleButton.addEventListener("click", onStyleButtonClick);
        var deleteButton = createButtonElement("overlay-buttons-btn", "overlay-buttons-delete");
        deleteButton.title = "Click to delete this shape.";
        deleteButton.style.display = "inline-block";
        deleteButton.addEventListener("click", onDeleteButtonClick);

        buttonsTrigger.appendChild(textButton);
        buttonsTrigger.appendChild(styleButton);
        buttonsTrigger.appendChild(deleteButton);

        var dialogDiv = createDivElement("overlay-buttons-dialog-container");
        var textDialog = createDivElement("overlay-buttons-dialog", "overlayTextDialog");
        textDialog.setAttribute("title", "Input Text");
        $(
            '<textarea id="shapeText" name="shapeText" rows="5" style="width: 100%;resize:none;"/>'
        ).appendTo($(textDialog));
        dialogDiv.appendChild(textDialog);

        $('<div id="overlayStyleDialog" title="Style Settings" class="overlay-button-dialog"></div>')
            .appendTo($(dialogDiv)).hide();
        $('<div id="overlayDeleteDialog" title="Confirm Delete" class="overlay-button-dialog"><p>Are you sure to delete this annotation?</p></div>')
            .appendTo($(dialogDiv)).hide();
        $('<div id="annotationListDialog" title="Annotations" class="overlay-button-dialog" style="width: auto;"><div id="annotationsListContent" ></div></div>')
            .appendTo($(dialogDiv)).hide();
        $('<div id="noAnnotationDialog" title="Annotations" class="overlay-button-dialog" style="width: auto;">Annotation list is empty.</div>')
            .appendTo($(dialogDiv)).hide();
        $('<div id="textboxQuickDrawToolDialog" title="TextBox" class="overlay-button-dialog" style="width: auto;"><div id="textBoxConfig" style="height: 320px;width: 100%;"></div></div>')
           .appendTo($(dialogDiv)).hide();

        overlayButtons.appendChild(buttonsTrigger);
        overlayButtons.appendChild(dialogDiv);

        overlayButtons.addEventListener("mousedown", blockEvent);
        overlayButtons.addEventListener("mousemove", blockEvent);
        overlayButtons.addEventListener("mouseup", blockEvent);

        return overlayButtons;
    }
    function blockEvent(e) {
        e.cancelBubble = true;
        e.preventDefault();
    }
    function createControlElement(top, left, className) {
        var control = document.createElement("div");
        control.className = className;
        control.style.top = top;
        control.style.left = left;
        return control;
    }
    function onTextButtonClick(e) {
        if (!self.currentShape || !self.currentShape.text) {
            return;
        }

        // $("#shapeText").val("");
        // $("#shapeText").val(self.currentShape.text());

        $("#overlayTextDialog").dialog({
            resizable: false,
            height: 140,
            modal: true,
            buttons: {
                "OK": function () {
                    $(this).dialog("close");
                    self.currentShape.editText = true;
                    self.currentShape.text($("#shapeText").val(), true);
                    self.currentShape.editText = false;
                    self.hide();
                },
                Cancel: function () {
                    $(this).dialog("close");
                }
            }
        });
    }
    function onStyleButtonClick(e) {
        if (!self.currentShape) {
            return;
        }
        var $styleDialog = $("#overlayStyleDialog");
        var config = self.currentShape.config();
        if (!config) {
            alert("Cannot get config for current shape.");
            return;
        }

        $styleDialog.empty();
        for (var c in config) {
            $(renderShapeConfigDiv(config[c])).appendTo($styleDialog);
        }
        for (var c in config) {
            populateConfigValue(config[c], $styleDialog);
        }

        $styleDialog.dialog({
            resizable: false,
            height: 140,
            modal: true,
            buttons: {
                "OK": function () {
                    $(this).dialog("close");
                    var result = {};
                    var children = $styleDialog.children();
                    for (var i = 0; i < children.length; ++i) {
                        var item = parseShapeConfig(children[i]);
                        if (item) {
                            result[item.name] = item;
                        }
                    }
                    self.currentShape.config(result, true);
                    self.hide();
                },
                Cancel: function () {
                    $(this).dialog("close");
                }
            }
        });
    }
    function onDeleteButtonClick(e) {
        if (self.currentShape) {
            $("#overlayDeleteDialog").dialog({
                resizable: false,
                height: 140,
                modal: true,
                buttons: {
                    "OK": function () {
                        $(this).dialog("close");
                        sandbox.deleteShape(self.currentShape);
                        self.hide();
                    },
                    Cancel: function () {
                        $(this).dialog("close");
                    }
                }
            });
        }
    }

    function parseShapeConfig(configDiv) {
        var name = $(configDiv).attr("data-configname");
        var type = $(configDiv).attr("data-configtype");

        var config = new ShapeConfig(name, null, type);
        switch (type) {
            case ConfigTypeEnum.BOOLEAN:
                config.value = $("#" + name).prop("checked");
                return config;
            case ConfigTypeEnum.OPACITY:
                config.value = parseFloat($("#" + name).val());
                return config;
            case ConfigTypeEnum.COLOR:
                config.value = $("#" + name).spectrum('get').toHexString();
                return config;
            case ConfigTypeEnum.LINESTYLE:
                config.value = $("#" + name).val();
                return config;
            case ConfigTypeEnum.LINEWIDTH:
                config.value = parseInt($("#" + name).val());
                return config;
            default:
                return null;
        }
    }

    function renderBooleanShapeConfigDiv(shapeConfig) {
        var result =
         '<div data-configname="' + shapeConfig.name + '" data-configtype="' + shapeConfig.type + '">' + 
            '<label for="' + shapeConfig.name + '">' + shapeConfig.name + ':</label>' +
            '<input type="checkbox" id="' + shapeConfig.name + '" name="' + shapeConfig.name + '" value="true" ' + (shapeConfig.value === true ? 'checked' : '') + '/>' +
        '</div>'
        ;
        return result;
    }
    function renderOpacityShapeConfigDiv(shapeConfig) {
        var result =
         '<div data-configname="' + shapeConfig.name + '" data-configtype="' + shapeConfig.type + '">' + 
            '<label for="' + shapeConfig.name + '">' + shapeConfig.name + ':</label>' +
            '<input type="text" id="' + shapeConfig.name + '" name="' + shapeConfig.name + '" value="' + shapeConfig.value + '" />' +
        '</div>'
        ;
        return result;
    }
    function renderColorShapeConfigDiv(shapeConfig) {
        var result =
         '<div data-configname="' + shapeConfig.name + '" data-configtype="' + shapeConfig.type + '">' + 
            '<label for="' + shapeConfig.name + '">' + shapeConfig.name + ':</label>' +
            '<input type="text" id="' + shapeConfig.name + '" name="' + shapeConfig.name + '" />' +
        '</div>'
        ;
        return result;
    }
    function renderLineStyleShapeConfigDiv(shapeConfig) {
        var result =
         '<div data-configname="' + shapeConfig.name + '" data-configtype="' + shapeConfig.type + '">' + 
            '<label for="' + shapeConfig.name + '">' + shapeConfig.name + ':</label>' +
            '<select id="' + shapeConfig.name + '" name="' + shapeConfig.name + '">' +
                '<option value="NONE">None</option>' +
                '<option value="DOT">Dot Line</option>' +
                '<option value="SOLID">Solid Line</option>' +
            '</select>' +
        '</div>'
        ;
        return result;
    }
    function renderLineWidthShapeConfigDiv(shapeConfig) {
        var result =
         '<div data-configname="' + shapeConfig.name + '" data-configtype="' + shapeConfig.type + '">' + 
            '<label for="' + shapeConfig.name + '">' + shapeConfig.name + ':</label>' +
            '<input type="text" id="' + shapeConfig.name + '" name="' + shapeConfig.name + '" value="' + shapeConfig.value + '" />' +
        '</div>'
        ;
        return result;
    }
    function renderShapeConfigDiv(shapeConfig) {
        switch (shapeConfig.type) {
            case ConfigTypeEnum.BOOLEAN:
                return renderBooleanShapeConfigDiv(shapeConfig);
            case ConfigTypeEnum.OPACITY:
                return renderOpacityShapeConfigDiv(shapeConfig);
            case ConfigTypeEnum.COLOR:
                return renderColorShapeConfigDiv(shapeConfig);
            case ConfigTypeEnum.LINESTYLE:
                return renderLineStyleShapeConfigDiv(shapeConfig);
            case ConfigTypeEnum.LINEWIDTH:
                return renderLineWidthShapeConfigDiv(shapeConfig);
            default:
                return "<div></div>";
        }
    }
    function populateConfigValue(shapeConfig, styleConfigContainer) {
        var element = styleConfigContainer.find("#" + shapeConfig.name);
        switch (shapeConfig.type) {
            case ConfigTypeEnum.BOOLEAN:
                if (shapeConfig.value === true) {
                    element.prop('checked', true);
                } else {
                    element.prop('checked', false);
                }
                break;
            case ConfigTypeEnum.OPACITY:
                element.val(shapeConfig.value);
                break;
            case ConfigTypeEnum.COLOR:
                setupSpectrum(element, shapeConfig.value);
                break;
            case ConfigTypeEnum.LINESTYLE:
                element.find("option[value=" + shapeConfig.value + "]").attr('selected', 'selected');
                break;
            case ConfigTypeEnum.LINEWIDTH:
                element.val(shapeConfig.value);
                break;
            default:
                break;
        }
    }

    function setupSpectrum(element, color) {
        element.spectrum({
            color: color,
            showInput: true,
            className: "full-spectrum",
            showInitial: true,
            showPalette: true,
            showSelectionPalette: true,
            maxSelectionSize: 10,
            preferredFormat: "hex",
            localStorageKey: "spectrum.demo",
            move: function (color) {
        
            },
            show: function () {
    
            },
            beforeShow: function () {
    
            },
            hide: function () {
    
            },
            change: function(color) {
                console.log("Spectrum color change called: " + color.toHexString());
            },
            palette: [
                ["rgb(0, 0, 0)", "rgb(67, 67, 67)", "rgb(102, 102, 102)",
                "rgb(204, 204, 204)", "rgb(217, 217, 217)","rgb(255, 255, 255)"],
                ["rgb(152, 0, 0)", "rgb(255, 0, 0)", "rgb(255, 153, 0)", "rgb(255, 255, 0)", "rgb(0, 255, 0)",
                "rgb(0, 255, 255)", "rgb(74, 134, 232)", "rgb(0, 0, 255)", "rgb(153, 0, 255)", "rgb(255, 0, 255)"], 
                ["rgb(230, 184, 175)", "rgb(244, 204, 204)", "rgb(252, 229, 205)", "rgb(255, 242, 204)", "rgb(217, 234, 211)", 
                "rgb(208, 224, 227)", "rgb(201, 218, 248)", "rgb(207, 226, 243)", "rgb(217, 210, 233)", "rgb(234, 209, 220)", 
                "rgb(221, 126, 107)", "rgb(234, 153, 153)", "rgb(249, 203, 156)", "rgb(255, 229, 153)", "rgb(182, 215, 168)", 
                "rgb(162, 196, 201)", "rgb(164, 194, 244)", "rgb(159, 197, 232)", "rgb(180, 167, 214)", "rgb(213, 166, 189)", 
                "rgb(204, 65, 37)", "rgb(224, 102, 102)", "rgb(246, 178, 107)", "rgb(255, 217, 102)", "rgb(147, 196, 125)", 
                "rgb(118, 165, 175)", "rgb(109, 158, 235)", "rgb(111, 168, 220)", "rgb(142, 124, 195)", "rgb(194, 123, 160)",
                "rgb(166, 28, 0)", "rgb(204, 0, 0)", "rgb(230, 145, 56)", "rgb(241, 194, 50)", "rgb(106, 168, 79)",
                "rgb(69, 129, 142)", "rgb(60, 120, 216)", "rgb(61, 133, 198)", "rgb(103, 78, 167)", "rgb(166, 77, 121)",
                "rgb(91, 15, 0)", "rgb(102, 0, 0)", "rgb(120, 63, 4)", "rgb(127, 96, 0)", "rgb(39, 78, 19)", 
                "rgb(12, 52, 61)", "rgb(28, 69, 135)", "rgb(7, 55, 99)", "rgb(32, 18, 77)", "rgb(76, 17, 48)"]
            ]
        });
    }

    var overlay = createDivElement("shape-overlay", "shapeOverlay");
    hideElement(overlay);
    var outline = createOutlineDiv();
    outline.addEventListener("dblclick", onTextButtonClick);

    var infoDiv = createDivElement("shape-overlay-info", "shapeOverlayInfo");
    infoDiv.appendChild(createElement("span", "", ""));

    overlay.appendChild(outline);
    overlay.appendChild(createButtonsDiv());
    overlay.appendChild(infoDiv);
    sandbox.descriptor.container.appendChild(overlay);

    this.outline = outline;
    this.overlay = overlay;
    this.rect = null;
    this.points = null;

    this.show = function(shape) {
        if ((ibdEnviroment.Device.isMobile || ibdEnviroment.MobilePreview.isShortText)&& shape.autoFitText) {
            shape.autoFitText();
        }
        if (shape.getFitPoints) {
            self.points = shape.getFitPoints();
        } else {
            self.points = shape.getPoints();
        }
        
        self.rect = getContainerRect(self.points);
        self.currentShape = shape;
        self.rect.y = self.rect.y + offset;
        self.rect.x = self.rect.x + offset;

        overlay.style.top = self.rect.y + "px";
        overlay.style.left = self.rect.x + "px";
        overlay.style.height = self.rect.height + "px";
        overlay.style.width = self.rect.width + "px";
        overlay.style.position = "absolute";
        overlay.style.zIndex = "7";

        cleanOutline();
        if (!ibdEnviroment.Device.isMobile) {
            for (var name in self.points) {
                var point = self.points[name];
                if (typeof (point) != "undefined")
                {
                    var relativeX = point.x - self.rect.x;
                    var relativeY = point.y - self.rect.y;
                    var controlElement = createControlElement(relativeY + "px", relativeX + "px", "overlay-control overlay-cursor-nwse-resize");
                    controlElement.setAttribute("data-pointname", name);
                    self.outline.appendChild(controlElement);
                }                
            }
        }

        if (shape.showText) {
            $(overlay).find("#overlay-buttons-text").show();
        } else {
            $(overlay).find("#overlay-buttons-text").hide();
        }
        $(overlay).find("#shapeOverlayInfo>span").text(shape.annotationDTO.annotationID);

        showElement(overlay);
        setupOverlayControl();
        if (mouseDownEventHandler) {
            mouseDownEventHandler();
        }
    }

    this.hide = function() {
        if ((ibdEnviroment.Device.isMobile || ibdEnviroment.MobilePreview.isShortText) && self.currentShape && self.currentShape.cancelAutoFitText) {
            self.currentShape.cancelAutoFitText();
        }
        hideElement(overlay);
        cleanOutline();
        self.currentShape = null;
    }

    var mouseDownEventHandler;
    this.registerMouseDownEventHandler = function(handler) {
        mouseDownEventHandler = handler;
    }
    this.removeMouseDownEventHandler = function () {
        mouseDownEventHandler = null;
    }
    this.handleMouseMove = function(e) {
        console.log("handleMouseMove moving: " + moving + " resizing: " + resizing);
        if (moving === true) {
            onMouseMove(e);
        } else if (resizing === true) {
            onControlMouseMove(e);
        }
    }
    this.handleMouseUp = function(e) {
        if (moving === true) {
            onMouseUp(e);
        } else if (resizing === true) {
            onControlMouseUp(e);
        }
    }

    function cleanOutline() {
        console.log("shapeOverlay.cleanOutline started.");
        var controls = overlay.querySelectorAll(".overlay-control");
        if (controls && controls.length !== 0) {
            for (var i = 0; i < controls.length; ++i) {
                controls[0].removeEventListener("mousedown", onControlMouseDown);
            }
        }
        while (self.outline.hasChildNodes()) {
            console.log("shapeOverlay.cleanOutline remove " + self.outline.firstChild);
            self.outline.removeChild(self.outline.lastChild);
        }
        console.log("shapeOverlay.cleanOutline ended.");
    }

    function getContainerRect(points) {
        var maxx = 0, maxy = 0, minx = Number.MAX_VALUE, miny = Number.MAX_VALUE;
        for (var key in points) {
            var point = points[key];
            if (typeof (point) != "undefined")
            {
                if (point.x < minx) minx = point.x;
                if (point.x > maxx) maxx = point.x;
                if (point.y < miny) miny = point.y;
                if (point.y > maxy) maxy = point.y;
            }            
        }
        return new Rect(minx, miny, maxx - minx, maxy - miny);
    }

    var moving = false;
    var moveStartX;
    var moveStartY;
    var shapeBeginX;
    var shapeBeginY;
    var shapeEndX;
    var shapeEndY;
    var resizing = false;
    var resizingPointName;
    var resizingControl;
    var lastX, lastY;
    function onMouseDown(e) {
        console.log("shapeOverlay mousedown.");
        e.cancelBubble = true;
        e.preventDefault();
        if (ibdEnviroment.Device.isMobile) {
            return;
        }

        moving = true;
        lastX = e.screenX;
        lastY = e.screenY;
        shapeBeginX = self.currentShape.beginX;
        shapeBeginY = self.currentShape.beginY;
        shapeEndX = self.currentShape.endX;
        shapeEndY = self.currentShape.endY;
        if (mouseDownEventHandler) {
            mouseDownEventHandler();
        }
    }
    function onMouseMove(e) {
        e.cancelBubble = true;
        e.preventDefault();
        if (ibdEnviroment.Device.isMobile) {
            return;
        }

        console.log("shapeOverlay mousemove.");
        if (!moving || !lastX || !lastY) {
            moving = false;
            return;
        }

        var offsetX = e.screenX - lastX;
        var offsetY = e.screenY - lastY;
        lastX = e.screenX;
        lastY = e.screenY;
        console.log("shapeOverlay mousemove offset " + offsetX + ", " + offsetY);
        var pointChanges = [];
        for (var name in self.points) {
            pointChanges.push(new PointChange(name, offsetX, offsetY));
        }

        self.currentShape.updatePoints(pointChanges);
        self.points = self.currentShape.getPoints();
        self.rect = getContainerRect(self.points);

        overlay.style.top = self.rect.y + "px";
        overlay.style.left = self.rect.x + "px";
        overlay.style.height = self.rect.height + "px";
        overlay.style.width = self.rect.width + "px";
    }
    function onMouseUp(e) {
        console.log("shapeOverlay mouseup.");
        e.cancelBubble = true;
        e.preventDefault();
        if (ibdEnviroment.Device.isMobile) {
            return;
        }
        if (!moving || !lastX || !lastY) {
            moving = false;
            return;
        }

        self.currentShape.save();
        console.log("shapeOverlay.onMouseUp setting resizing to false.");
        resizing = false;
        moving = false;
    }

    function onControlMouseDown(e) {
        e.cancelBubble = true;
        e.preventDefault();
        if (ibdEnviroment.Device.isMobile) {
            return;
        }
        resizingPointName = e.target.getAttribute("data-pointname");
        resizingControl = e.target;
        console.log("overlay.onControlMouseDown: Start to resize. PointName: " + resizingPointName);
        resizing = true;

        lastX = e.screenX;
        lastY = e.screenY;
        shapeBeginX = self.currentShape.beginX;
        shapeBeginY = self.currentShape.beginY;
        shapeEndX = self.currentShape.endX;
        shapeEndY = self.currentShape.endY;
        if (mouseDownEventHandler) {
            mouseDownEventHandler();
        }
    }
    function onControlMouseMove(e) {
        e.cancelBubble = true;
        e.preventDefault();
        if (ibdEnviroment.Device.isMobile) {
            return;
        }
        console.log("overlay.onControlMouseMove: Start to resize");
        if (!resizing || !resizingPointName || !lastX || !lastY) {
            console.log("shapeOverlay.onControlMouseMove setting resizing to false.");
            resizing = false;
            return;
        }

        var offsetX = e.screenX - lastX;
        var offsetY = e.screenY - lastY;

        if (self.currentShape.getOffsetY) {
            offsetY = self.currentShape.getOffsetY();
        }

        if (self.currentShape.getOffsetX) {
            offsetX = self.currentShape.getOffsetX();
        }

        lastX = e.screenX;
        lastY = e.screenY;
        console.log("overlay.onControlMouseMove: offset " + offsetX + ", " + offsetY);

        self.currentShape.updatePoint(new PointChange(resizingPointName, offsetX, offsetY));
        self.points = self.currentShape.getPoints();
        self.rect = getContainerRect(self.points);

        overlay.style.top = self.rect.y + "px";
        overlay.style.left = self.rect.x + "px";
        overlay.style.height = self.rect.height + "px";
        overlay.style.width = self.rect.width + "px";

        var controls = overlay.querySelectorAll(".overlay-control");
        if (!controls || controls.length === 0) {
            console.error(".overlay-control elements not found.");
            return;
        }

        for (var name in self.points) {
            var point = self.points[name];
            var relativeX = point.x - self.rect.x;
            var relativeY = point.y - self.rect.y;

            var element;
            for (var i = 0; i < controls.length; ++i) {
                if (name === controls[i].getAttribute("data-pointname")) {
                    element = controls[i];
                    break;
                }
            }
            if (!element) {
                console.error("Cannot find control point for " + name);
                return;
            }
            element.style.top = relativeY + "px";
            element.style.left = relativeX + "px";
        }
    }
    function onControlMouseUp(e) {
        e.cancelBubble = true;
        e.preventDefault();
        if (ibdEnviroment.Device.isMobile) {
            return;
        }

        self.currentShape.save('mouseup');
        console.log("overlay.onControlMouseUp: Finish to resize.");
        resizing = false;
    }

    function setupOverlayOutlineMouseEvent() {
        //outline.addEventListener("mousedown", onMouseDown);
        overlay.addEventListener("mousedown", onMouseDown);
        outline.addEventListener("click", function () {
            if (ibdEnviroment.Device.isMobile && self.currentShape) {
                sandbox.deselectShape(self.currentShape);
            }
        });
    }

    function setupOverlayControl() {
        var controls = overlay.querySelectorAll(".overlay-control");
        if (controls && controls.length !== 0) {
            for (var i = 0; i < controls.length; ++i) {
                controls[i].addEventListener("mousedown", onControlMouseDown);
            }
        }
    }

    setupOverlayOutlineMouseEvent();
}