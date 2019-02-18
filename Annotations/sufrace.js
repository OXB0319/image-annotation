DrawCore.register('surface', function (sandbox) {
    function Surface() {
        var svg = null;
        var self = this;
        this.overlay = {
            mouseDown: false
        }

        this.init = function () {
            //Draw area borders
            var startDiv = document.createElement('div');
            startDiv.className = 'dtLine vLine';
            startDiv.style.display = 'none';
            startDiv.style.width = '2px';
            startDiv.style.opacity = '0.6';
            startDiv.className += " noteDiv";
            var endDiv = document.createElement('div');
            endDiv.className = 'dtLine vLine';
            endDiv.style.display = 'none';
            endDiv.style.width = '2px';
            endDiv.style.opacity = '0.6';
            endDiv.className += " noteDiv";

            if (typeof (ShapeOverlay) === 'function') {
                console.log('ShapeOverlayShapeOverlayShapeOverlayShapeOverlay');
                self.overlay.shapeOverlay = new ShapeOverlay(sandbox);
                self.overlay.shapeOverlay.registerMouseDownEventHandler(onOverlayMouseDown);
            }
            svg = sandbox.createSurface(startDiv, endDiv, self.overlay.shapeOverlay);
            svg.setAttribute('width', '800px');
            svg.setAttribute('height', '600px');
            svg.style.position = 'absolute';
            svg.style.zIndex = '6';

            //Register Event Listeners
            if (self.overlay.shapeOverlay && sandbox.descriptor.isEditMode) {
                svg.addEventListener('mousedown', onMouseDown, true);
            }

            window.addEventListener("resize", winResize);

            self.startDiv = startDiv;
            self.endDiv = endDiv;
        };

        this.destory = function () {
            if (self.overlay.shapeOverlay) {
                self.overlay.shapeOverlay.hide();
                self.overlay.shapeOverlay.removeMouseDownEventHandler();
                svg.removeEventListener('mousedown', onMouseDown, true);
                if (svg.parentElement == undefined)
                    svg.parentNode.removeEventListener('mouseup', onMouseUp, false);
                else
                    svg.parentElement.removeEventListener('mouseup', onMouseUp, false);
            }
        }

        this.restore = function () {
            if (self.overlay.shapeOverlay) {
                self.overlay.shapeOverlay.registerMouseDownEventHandler(onOverlayMouseDown);
                svg.addEventListener('mousedown', onMouseDown, true);
            }
        }

        this.enable = function () {
            if (self.overlay.shapeOverlay) {
                self.overlay.shapeOverlay.hide();
                self.overlay.shapeOverlay.registerMouseDownEventHandler(onOverlayMouseDown);
                svg.addEventListener('mousedown', onMouseDown, true);
                if (svg.parentElement == undefined)
                    svg.parentNode.addEventListener('mouseup', onMouseUp, false);
                else
                    svg.parentElement.addEventListener('mouseup', onMouseUp, false);
            }
        }

        this.disable = function () {
            if (self.overlay.shapeOverlay) {
                self.overlay.shapeOverlay.hide();
                self.overlay.shapeOverlay.removeMouseDownEventHandler();
                svg.removeEventListener('mousedown', onMouseDown, true);
                if (svg.parentElement == undefined)
                    svg.parentNode.removeEventListener('mouseup', onMouseUp, false);
                else
                    svg.parentElement.removeEventListener('mouseup', onMouseUp, false);
            }
        }

        this.clearShapes = function () {
            sandbox.clearShapes();
        };

        this.deleteShapeById = function (id) {
            sandbox.deleteShapeById(id);
        }

        this.selectShapeById = function (id) {
            sandbox.selectShapeById(id);
            svg.parentNode.removeEventListener('mousemove', onMouseMove, false);
            document.removeEventListener('mousemove', onMouseMove, false);
            self.overlay.mouseDown = false;
        }

        function onOverlayMouseDown(e) {
            console.log("surface.onOverlayMouseDown started.");
            if (sandbox.descriptor.isEditMode) {
                svg.parentNode.addEventListener('mousemove', onMouseMove, false);
                document.addEventListener('mousemove', onMouseMove, false);
                if (svg.parentElement == undefined)
                    svg.parentNode.addEventListener('mouseup', onMouseUp, false);
                else
                    svg.parentElement.addEventListener('mouseup', onMouseUp, false);
                self.overlay.mouseDown = true;
            }
        }

        function onMouseDown(e) {
            console.log("surface.onMouseDown started.");
            if (svg.parentElement == undefined)
                svg.parentNode.addEventListener('mouseup', onMouseUp, false);
            else
                svg.parentElement.addEventListener('mouseup', onMouseUp, false);

            if (sandbox.canDraw()) {
                e.cancelBubble = true;
                svg.parentNode.addEventListener('mousemove', onMouseMove, false);
                document.addEventListener('mousemove', onMouseMove, false);

                sandbox.descriptor.isDrawing(true);
                if (sandbox.DRAW_NOT_END) {

                    sandbox.BEGIN_DRAW = true;
                    return false;

                }
                var x = e.pageX - sandbox.descriptor.container.parentNode.getBoundingClientRect().left;
                var y = e.pageY - sandbox.descriptor.container.parentNode.getBoundingClientRect().top;
                //if (sandbox.descriptor.chartModel.getLogical)
                //    x = sandbox.descriptor.chartModel.getLogical(x, y, true, true).x;

                sandbox.startDraw();
                sandbox.moveTo(x, y);

                self.startDiv.style.left = (x - 1) + 'px';
                self.startDiv.style.display = '';

                self.endDiv.style.display = '';
                self.endDiv.style.left = (x - 1) + 'px';
            }

        }

        function onMouseMove(e) {
            e.cancelBubble = true;
            e.preventDefault();
            console.log("surface.onMouseMove started overlayMouseDown: " + self.overlay.mouseDown + ', isDrawing:' + sandbox.descriptor.isDrawing());
            if (self.overlay.mouseDown) {
                self.overlay.shapeOverlay.handleMouseMove(e);
            } else if (sandbox.descriptor.isDrawing()) {
                var x = e.pageX;
                var y = e.pageY;
                if (sandbox.BEGIN_DRAW) {
                    sandbox.move(x, y);
                    sandbox.DRAW_NOT_END = false;
                    return false;
                }
                x = e.pageX - sandbox.descriptor.container.parentNode.getBoundingClientRect().left;
                y = e.pageY - sandbox.descriptor.container.parentNode.getBoundingClientRect().top;;
                //if (sandbox.descriptor.chartModel.getLogical)
                //    x = sandbox.descriptor.chartModel.getLogical(x, y, true, true).x;

                sandbox.lineTo(x, y);
                self.endDiv.style.left = (x - 1) + 'px';
            }
        }

        function onMouseUp(e) {
            e.cancelBubble = true;
            e.preventDefault();
            console.log("surface.onMouseUp started overlayMouseDown: " + self.overlay.mouseDown);
            if (self.overlay.mouseDown) {
                self.overlay.shapeOverlay.handleMouseUp(e);
                self.overlay.mouseDown = false;
                svg.parentNode.removeEventListener('mousemove', onMouseMove, false);
                document.removeEventListener('mousemove', onMouseMove, false);
            } else {
                if (sandbox.canDraw() && sandbox.descriptor.isDrawing()) {
                    e.cancelBubble = true;

                    svg.parentNode.removeEventListener('mousemove', onMouseMove, false);
                    document.removeEventListener('mousemove', onMouseMove, false);

                    if (svg.parentElement == undefined)
                        svg.parentNode.removeEventListener('mouseup', onMouseUp, false);
                    else
                        svg.parentElement.removeEventListener('mouseup', onMouseUp, false);

                    if (sandbox.BEGIN_DRAW) {
                        sandbox.move(e.pageX, e.pageY);
                        sandbox.BEGIN_DRAW = false;
                        sandbox.DRAW_NOT_END = false;
                    }
                    if (sandbox.DRAW_NOT_END) {
                        return false;
                    }
                    self.startDiv.style.display = 'none';
                    self.endDiv.style.display = 'none';

                    sandbox.saveLocalShape();
                    sandbox.descriptor.isDrawing(false);
                }
                sandbox.deselectShape();
            }

            sandbox.readyForDelete = false;
        }

        function winResize() {
            location.reload();
        }
    }

    return new Surface();
});
