var Sandbox = function(descriptor) {

    this.descriptor = descriptor || {};
    
   
    Object.defineProperty(this, 'DRAW_NOT_END', {
        set: function (value) {
           descriptor.selectedShape.DRAW_NOT_END = value;
        },
        get: function () {
           return  descriptor.selectedShape.DRAW_NOT_END;
        },
        configurable: false
    });
    Object.defineProperty(this, 'shapes', {
        set: function (value) {
            descriptor.shapes = value;
        },
        get: function () {
            return descriptor.shapes;
        },
        configurable: false
    });
    Object.defineProperty(this, 'readyForDelete', {
        set: function (value) {
            descriptor.readyForDelete = value;
        },
        get: function () {
            return descriptor.readyForDelete;
        },
        configurable: false
    });

    Object.defineProperty(this, 'isEditMode', {
        set: function (value) {
            descriptor.isEditMode = value;
        },
        get: function () {
            return descriptor.isEditMode;
        },
        configurable: false
    });

    this.eAnnotationState = {
        EDITING_UNREV_UNPUB: 0,
        REVIEW_UNPUB: 1,
        PEND_DELETE_REV_UNPUB: 2,
        READY: 3,
        PEND_DELETE_READY: 4,
        PUBLISHED: 5,
        PEND_DELETE_UNREV_PUB: 6,
        PEND_DELETE_REV_PUB: 7,
        PEND_DELETE_READY_PUB: 8,
        DELETED: 9,
        PEND_CHANGED_UNREV_PUB: 10,
        PEND_CHANGED_REV_PUB: 11,
        PEND_CHANGED_READY_PUB: 12
    };
    
    
};


Sandbox.prototype.appendShape = function(shape, isSys) {
    var svg;
    if (isSys) {
        svg = this.syssvg;
    } else {
        svg = this.svg;
    }

    if (shape instanceof HTMLElement) {
        svg.parentNode.appendChild(shape);
    } else {
        svg.appendChild(shape);
    }
   
};

Sandbox.prototype.startDraw = function () {
    if (this.descriptor.selectedShape.startDraw) {
        this.descriptor.selectedShape.startDraw();
    }
}

Sandbox.prototype.redraw = function () {
    if (this.descriptor.selectedShape.redraw) {
        this.descriptor.selectedShape.redraw();
    }
}

Sandbox.prototype.createSurface = function (startDiv, endDiv, shapeOverlay) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('version', '1.1');
    Sandbox.prototype.svg = svg;
    if (shapeOverlay) {
        Sandbox.prototype.shapeOverlay = shapeOverlay;
    }
    this.descriptor.container.appendChild(svg);
    this.descriptor.container.appendChild(startDiv);
    this.descriptor.container.appendChild(endDiv);
    if (shapeOverlay) {
        this.descriptor.container.appendChild(shapeOverlay.overlay);
    }
   
    return svg;
    
};

var drawingMode = true;
Sandbox.prototype.selectShape = function (shape, isSys) {
    shape = parseInt(shape);
    this.descriptor.selectedShape = this.descriptor.createInstance(shape, isSys);
    drawingMode = true;
    if (this.descriptor.selectedShape) {
        this.descriptor.selectedShape.annotationDTO = {};
        this.descriptor.selectedShape.annotationDTO.noteType = shape;

        this.descriptor.selectedShape.init();
    }
};
Sandbox.prototype.deselectShape = function() {
    this.descriptor.selectedShape = null;
    drawingMode = false;
    this.descriptor.isDrawing(false);
    this.descriptor.deselectShape();
    if (this.shapeOverlay) {
        this.shapeOverlay.hide();
    }

};
Sandbox.prototype.canDraw = function () {
    return drawingMode === true && this.descriptor.selectedShape;
};

Sandbox.prototype.moveTo = function(x, y) {



    this.descriptor.selectedShape.moveTo(x, y);

   
};
Sandbox.prototype.getClientDimmensions = function() {
    return {
        left: this.descriptor.container.parentNode.offsetLeft + 25,
        top: this.descriptor.container.parentNode.offsetTop + 15,
        width: this.descriptor.container.parentNode.offsetLeft + this.descriptor.container.offsetWidth,
        height: this.descriptor.container.parentNode.offsetTop + this.descriptor.container.offsetHeight
    };
};
Sandbox.prototype.lineTo = function(x, y) {
    this.descriptor.selectedShape.lineTo(x, y);
};

Sandbox.prototype.move = function (x, y) {
    x = x - this.descriptor.container.parentNode.offsetLeft;
    y = y - this.descriptor.container.parentNode.offsetTop;
    if (this.descriptor.selectedShape.move) {
        this.descriptor.selectedShape.move(x, y);
    }
};
Sandbox.prototype.getStyles = function() {
    return this.descriptor.getStyles();
};
Sandbox.prototype.clearSurface = function() {
    svg.innerHTML = "";
};
Sandbox.prototype.saveShape = function(fromServer,isUpdate) {

    //Transform physical points to relative
    var pointsJson = this.descriptor.selectedShape.getPoints();
    var configJson = JSON.stringify(this.descriptor.selectedShape.config());

    this.descriptor.selectedShape.annotationDTO.pointsJson = pointsJson;
    this.descriptor.selectedShape.annotationDTO.configJson = configJson;

    if (!fromServer) {

        var args = this.getShapeArguments(this.descriptor.selectedShape.beginX, this.descriptor.selectedShape.endX, this.descriptor.selectedShape.beginY, this.descriptor.selectedShape.endY);

        ////referse date and price if need
        switch (this.descriptor.selectedShape.annotationDTO.noteType) {
            case 6:
            case 3:
            case 5:

                if (args.beginDate > args.endDate) {
                    var temp = args.beginDate;
                    args.beginDate = args.endDate;
                    args.endDate = temp;

                }
                if (args.beginPrice < args.endPrice && args.endVolume == 0 && args.beginVolume == 0) {
                    temp = args.beginPrice;
                    args.beginPrice = args.endPrice;
                    args.endPrice = temp;

                }
                if (args.beginVolume < args.endVolume && args.endPrice == 0 && args.beginPrice == 0) {
                    temp = args.beginVolume;
                    args.beginVolume = args.endVolume;
                    args.endVolume = temp;

                }
                if (args.endVolume == 0 && args.endPrice != 0 && args.beginPrice == 0 && args.beginVolume != 0) {
                    temp = args.beginPrice;
                    args.beginPrice = args.endPrice;
                    args.endPrice = temp;

                    temp = args.beginVolume;
                    args.beginVolume = args.endVolume;
                    args.endVolume = temp;
                }
                break;
        }
        this.descriptor.selectedShape.annotationDTO.beginDate = args.beginDate;
        this.descriptor.selectedShape.annotationDTO.endDate = args.endDate;
        this.descriptor.selectedShape.annotationDTO.beginPrice = args.beginPrice;
        this.descriptor.selectedShape.annotationDTO.endPrice = args.endPrice;
        this.descriptor.selectedShape.annotationDTO.beginVolume = args.beginVolume;
        this.descriptor.selectedShape.annotationDTO.endVolume = args.endVolume
    }

    //apply positions
    if (fromServer) {
        this.descriptor.selectedShape.redraw();
    } else {
        var pos = this.getShapePositions(this.descriptor.selectedShape.annotationDTO.beginDate, this.descriptor.selectedShape.annotationDTO.endDate, this.descriptor.selectedShape.annotationDTO.beginPrice, this.descriptor.selectedShape.annotationDTO.endPrice, this.descriptor.selectedShape.annotationDTO.beginVolume, this.descriptor.selectedShape.annotationDTO.endVolume);
        if (!this.descriptor.selectedShape.translate(pos.beginX, pos.beginY, pos.endX, pos.endY)) {
            return;
        }
    }

    if (isUpdate) {
        var shape = this.descriptor.selectedShape;
        var self = this;
        //this.descriptor.getModule('builder').instance.updateAnnotation(shape, function (data) {
        //    if (data.Status === 0) {
        //        if (shape.annotationDTO.status === 5) {
        //            shape.annotationDTO.status = self.eAnnotationState.PEND_CHANGED_UNREV_PUB;
        //        }
        //    }
        //});
    } else {
        if (fromServer) {
            this.setAnnotation(this.descriptor.selectedShape);
            this.updateLocalShapes(this.descriptor.selectedShape);
        } else {
            var savingShape = this.descriptor.selectedShape;
            var self = this;
            this.saveAnnotation(savingShape, function () {
                self.updateLocalShapes(savingShape);
            });
        }
    }
};

Sandbox.prototype.saveShapeFromServer = function () {
    var pointsJson = this.getPointsJson(this.descriptor.selectedShape.getPoints());
    var configJson = JSON.stringify(this.descriptor.selectedShape.config());

    this.descriptor.selectedShape.annotationDTO.pointsJson = pointsJson;
    this.descriptor.selectedShape.annotationDTO.configJson = configJson;
    this.descriptor.selectedShape.redraw(true);
    this.setAnnotation(this.descriptor.selectedShape);
    this.updateLocalShapes(this.descriptor.selectedShape);
}

Sandbox.prototype.saveUpdatedShape = function (event) {
    this.descriptor.selectedShape.redraw(false, event);
    var pointsJson = this.descriptor.selectedShape.getPoints();
    var configJson = JSON.stringify(this.descriptor.selectedShape.config());
    var shape = this.descriptor.selectedShape;
    var self = this;

    this.descriptor.selectedShape.annotationDTO.pointsJson = pointsJson;
    this.descriptor.selectedShape.annotationDTO.configJson = configJson;
    //this.descriptor.getModule('builder').instance.updateAnnotation(this.descriptor.selectedShape, function (data) { 
    //    if (data.Status === 0) {
    //        if (shape.annotationDTO.status === 5) {
    //            shape.annotationDTO.status = self.eAnnotationState.PEND_CHANGED_UNREV_PUB;
    //        }
    //        self.enableRestoreProd(true);
    //    }
    //});
}

Sandbox.prototype.saveLocalShape = function () {
    var pointsJson = this.descriptor.selectedShape.getPoints();
    var configJson = JSON.stringify(this.descriptor.selectedShape.config());

    this.descriptor.selectedShape.annotationDTO.pointsJson = pointsJson;
    this.descriptor.selectedShape.annotationDTO.configJson = configJson;
    //var args = this.getShapeArguments(this.descriptor.selectedShape.beginX, this.descriptor.selectedShape.endX, this.descriptor.selectedShape.beginY, this.descriptor.selectedShape.endY);

    //var pos = this.getShapePositions(this.descriptor.selectedShape.annotationDTO.beginDate, this.descriptor.selectedShape.annotationDTO.endDate, this.descriptor.selectedShape.annotationDTO.beginPrice, this.descriptor.selectedShape.annotationDTO.endPrice, this.descriptor.selectedShape.annotationDTO.beginVolume, this.descriptor.selectedShape.annotationDTO.endVolume);
    if (!this.descriptor.selectedShape.translate(this.descriptor.selectedShape.beginX,
                                                 this.descriptor.selectedShape.beginY,
                                                 this.descriptor.selectedShape.endX,
                                                 this.descriptor.selectedShape.endY)) {
        return;
    }

    var savingShape = this.descriptor.selectedShape;
    var self = this;
    this.saveAnnotation(savingShape, function () {
        self.updateLocalShapes(savingShape);
    });
}

Sandbox.prototype.updateLocalShapes = function (shape) {
    if (!this.shapes[shape.annotationDTO.annotationID]) {
        this.shapes[shape.annotationDTO.annotationID] = shape;
    }
}
Sandbox.prototype.setAnnotation = function(shape) {
    //register evetns
    var self = this;
    shape.addEventListener('mousedown', function (e) {
        if (e.e) {
            e.e.cancelBubble = true;
            e.e.preventDefault();
        }
        if (self.readyForDelete) {
            e.e.cancelBubble = true;
            self.deleteShape(e.target);
        } else {
            if (self.shapeOverlay && self.descriptor.isEditMode) {
                self.shapeOverlay.show(e.target);
                self.descriptor.selectedShape = shape;
            }
        }
        self.readyForDelete = false;
    });
    //Correcting layer types  RS / P / V
    //shape.addEventListener('mouseover', showLayers);
    //shape.addEventListener('mouseout', hideLayers);

    function showLayers(e) {
        var points = shape.getLayerPoints();
        self.descriptor.showLayers(points.beginX, points.endX, points.beginY, points.endY, shape.annotationDTO.layer);
    };
    function hideLayers() {
        self.descriptor.hideLayers();
    };
    //this.shapes.push(shape);
   
};
Sandbox.prototype.saveAnnotation = function (shape, callback) {
    console.log('Sandbox.prototype.saveAnnotation');
    //register evetns
    var self = this;
    shape.addEventListener('mousedown', function (e) {
        if (e.e) {
            e.e.cancelBubble = true;
            e.e.preventDefault();
        }
        if (self.readyForDelete) {
            self.deleteShape(e.target);
        } else {
            if (self.shapeOverlay && self.descriptor.isEditMode) {
            self.shapeOverlay.show(e.target);
            self.descriptor.selectedShape = shape;
            }
        }
        self.readyForDelete = false;
    });
    //Correcting layer types  RS / P / V
    shape.annotationDTO.layer = this.descriptor.getLayer();

    //Register events for layers
    //shape.addEventListener('mouseover', showLayers);
    //shape.addEventListener('mouseout', hideLayers);
    
    function showLayers(e) {
        var points = shape.getLayerPoints();
        self.descriptor.showLayers(points.beginX, points.endX, points.beginY, points.endY, shape.annotationDTO.layer);
    };
    function hideLayers() {
        self.descriptor.hideLayers();
    };
    //store current shape in shapes array
    this.shapes.push(shape);

    //create annotation object

    //this.descriptor.getModule('builder').instance.saveAnnotation(shape, callback);
};
Sandbox.prototype.getAnnotations = function (callback) {
    this.descriptor.getAnnotations(callback);
};

Sandbox.prototype.refreshShapes = function () {
  console.log('refresh shape');
    
  for (var i in this.descriptor.shapes) {
    

        var pos = this.getShapePositions(this.shapes[i].annotationDTO.beginDate, this.shapes[i].annotationDTO.endDate, this.shapes[i].annotationDTO.beginPrice, this.shapes[i].annotationDTO.endPrice, this.shapes[i].annotationDTO.beginVolume, this.shapes[i].annotationDTO.endVolume);
        if (this.shapes[i].annotationDTO.noteType == 5) 
            pos.endY = '';
          
       
        this.shapes[i].translate(pos.beginX, pos.beginY, pos.endX, pos.endY);
        
    }
};
Sandbox.prototype.clearShapes = function() {
    for (var i in this.descriptor.shapes) {
        this.shapes[i].delete();
    }
    this.descriptor.shapes = [];
};

Sandbox.prototype.selectShapeById = function (shapeId) {
    var shape;
    for (var id in this.shapes) {
        if (this.shapes[id].annotationDTO.annotationID === shapeId) {
            shape = this.shapes[id];
            break;
        }
    }
    if (shape) {
        shape.select();
    }
}
Sandbox.prototype.deleteShapeById = function (shapeId) {
    var shape;
    for (var id in this.shapes) {
        if (this.shapes[id].annotationDTO.annotationID === shapeId) {
            shape = this.shapes[id];
            break;
        }
    }
    if (shape) {
        this.deleteShape(shape);
    }
}

Sandbox.prototype.deleteShape = function (shape) {
   this.deselectShape();
   if (shape.annotationDTO.status == this.eAnnotationState.EDITING_UNREV_UNPUB || shape.annotationDTO.status == this.eAnnotationState.REVIEW_UNPUB || shape.annotationDTO.status == this.eAnnotationState.READY) {
       console.log('delete shape.');
       var index = this.descriptor.shapes.indexOf(shape);
        if (index != -1) {
            this.descriptor.shapes.splice(index, 1);
        }
        this.descriptor.getModule('builder').instance.deleteAnnotation(shape);
        shape.delete();
        //this.enableRestoreProd(false);
   }
   else {
       console.log('revert shape status to publish.');
       this.changeStatus(shape.annotationDTO.annotationID, this.eAnnotationState.PEND_DELETE_REV_PUB);
       shape.annotationDTO.status = this.eAnnotationState.PEND_DELETE_REV_PUB;
       shape.hide();
       this.enableRestoreProd(true);
       this.descriptor.getModule('builder').instance.excuteDeleteAnnotationEvent(shape);
   }
 
    this.descriptor.hideLayers();
};
Sandbox.prototype.getShapePositions = function (beginDate, endDate, beginPrice, endPrice, beginVolume, endVolume) {
    var pos = {};
    pos.beginX = this.descriptor.chartModel.priceCoordinateSystem.transformArgument(beginDate);
    pos.endX = this.descriptor.chartModel.priceCoordinateSystem.transformArgument(endDate);
    if (beginPrice == 0) {
        pos.beginY = this.descriptor.chartModel.chartGeometry.mainContainer.height - this.descriptor.chartModel.volumeCoordinateSystem.transformValue(beginVolume).toFixed(9);
    } else {
        pos.beginY = this.descriptor.chartModel.chartGeometry.mainContainer.height - this.descriptor.chartModel.priceCoordinateSystem.transformValue(beginPrice).toFixed(9);
    }
    if (endPrice == 0) {
        pos.endY = this.descriptor.chartModel.chartGeometry.mainContainer.height - this.descriptor.chartModel.volumeCoordinateSystem.transformValue(endVolume).toFixed(9);
    } else {
        pos.endY = this.descriptor.chartModel.chartGeometry.mainContainer.height - this.descriptor.chartModel.priceCoordinateSystem.transformValue(endPrice).toFixed(9);
    }
    return pos;

};
Sandbox.prototype.getShapeArguments = function (beginX, endX, beginY, endY) {
    var priceHeight = this.descriptor.chartModel.priceView.clientRect.height;
    var beginVolume = 0, endVolume = 0, beginPrice = 0, endPrice = 0;

    if (beginY > priceHeight) {
        beginVolume = this.descriptor.chartModel.volumeCoordinateSystem.reverseTransformY(this.descriptor.chartModel.chartGeometry.mainContainer.height  -beginY);
    }
    else {
        beginPrice = this.descriptor.chartModel.priceCoordinateSystem.reverseTransformY(this.descriptor.chartModel.chartGeometry.mainContainer.height - beginY);
    }
    if (endY > priceHeight) {
        endVolume = this.descriptor.chartModel.volumeCoordinateSystem.reverseTransformY(this.descriptor.chartModel.chartGeometry.mainContainer.height - endY);
    } else {
        endPrice = this.descriptor.chartModel.priceCoordinateSystem.reverseTransformY(this.descriptor.chartModel.chartGeometry.mainContainer.height - endY);
    }
    
    return {
        beginDate: this.descriptor.chartModel.priceCoordinateSystem.reverseTransformX(beginX),
        endDate:this.descriptor.chartModel.priceCoordinateSystem.reverseTransformX(endX),
        beginPrice: beginPrice,
        endPrice: endPrice,
        beginVolume: beginVolume,
        endVolume:endVolume
        
    };
   

};
Sandbox.prototype.getPointsJson = function (points) {
    var layer = this.descriptor.selectedShape.annotationDTO.Layer || this.descriptor.selectedShape.annotationDTO.layer;
    var coordinateSystem = this.descriptor.chartModel.priceCoordinateSystem;
    if (typeof (layer) == 'undefined') {
        layer = this.descriptor.getLayer();
    }
    if (layer == 'P') {
        coordinateSystem = this.descriptor.chartModel.priceCoordinateSystem;
    }
    else if (layer == 'RS') {
        coordinateSystem = this.descriptor.chartModel.priceCoordinateSystem;
    }
    else if (layer == 'V') {
        coordinateSystem = this.descriptor.chartModel.volumeCoordinateSystem;
    }
    var result = {};
    for (var key in points) {
        var p = points[key];
        if (typeof (p) != 'undefined') {
            var x = coordinateSystem.reverseTransformX(p.x);
            var y = coordinateSystem.reverseTransformY(this.descriptor.chartModel.chartGeometry.mainContainer.height - p.y);
            result[key] = {
                x: x,
                y: y
            };
        }        
    }
    return JSON.stringify(result);
}
Sandbox.prototype.restoreProd = function () {
    var self = this;
    for (var i in this.descriptor.shapes) {
        var status = this.descriptor.shapes[i].annotationDTO.status;
        console.log('ID:' + this.descriptor.shapes[i].annotationDTO.annotationID + 'status' + status);
        switch (status) {
            case this.eAnnotationState.EDITING_UNREV_UNPUB:
            case this.eAnnotationState.REVIEW_UNPUB:
            case this.eAnnotationState.PEND_DELETE_REV_UNPUB:
            case this.eAnnotationState.READY:
            case this.eAnnotationState.PEND_DELETE_READY:
                this.restoreAnnotation(this.descriptor.shapes[i].annotationDTO.annotationID, status, function (data) {
                    if (data.Status === 0 && data.Annotations.length > 0) {
                        var shape = self.descriptor.getShapeByID(data.Annotations[0].AnnotationID);
                        self.deselectShape();
                        var index = self.descriptor.shapes.indexOf(shape);
                        if (index != -1) {
                            self.descriptor.shapes.splice(index, 1);
                        }
                        shape.delete();
                        self.descriptor.hideLayers();
                        self.descriptor.getModule('builder').instance.excuteDeleteAnnotationEvent(shape);
                    }
                });
                break;
            case this.eAnnotationState.PEND_DELETE_UNREV_PUB:
            case this.eAnnotationState.PEND_DELETE_REV_PUB:
            case this.eAnnotationState.PEND_DELETE_READY_PUB:
                this.restoreAnnotation(this.descriptor.shapes[i].annotationDTO.annotationID, status, function (data) {
                    if (data.Status === 0 && data.Annotations.length > 0) {
                        var shape = self.descriptor.getShapeByID(data.Annotations[0].AnnotationID);
                        shape.show();
                        shape.annotationDTO.status = self.eAnnotationState.PUBLISHED;
                        self.descriptor.getModule('builder').instance.excuteAddAnnotationEvent(shape);
                    }
                });
                break;
            case this.eAnnotationState.PEND_CHANGED_UNREV_PUB:
            case this.eAnnotationState.PEND_CHANGED_REV_PUB:
            case this.eAnnotationState.PEND_CHANGED_READY_PUB:
                this.restoreAnnotation(this.descriptor.shapes[i].annotationDTO.annotationID, status, function (data) {
                    if (data.Status === 0 && data.Annotations.length > 0) {
                        var points = JSON.parse(data.Annotations[0].PointsJson);
                        var config = JSON.parse(data.Annotations[0].ConfigJson);
                        points = self.getPoints(points, data.Annotations[0].Layer);
                        var shape = self.descriptor.getShapeByID(data.Annotations[0].AnnotationID);
                        shape.config(config);
                        shape.setPoints(points);
                        if (typeof (shape.text) !== 'undefined') {
                            shape.text(data.Annotations[0].NoteText);
                        }                        
                        shape.redraw();
                        if (self.shapeOverlay && self.descriptor.isEditMode) {
                            if (self.descriptor.selectedShape) {
                                self.shapeOverlay.show(self.descriptor.selectedShape);
                            }
                        }
                        shape.annotationDTO.status = self.eAnnotationState.PUBLISHED;
                    }
                });
                break;
        }
        this.enableRestoreProd(false);
    }
};
Sandbox.prototype.enableRestoreProd = function (enabled) {
  if(this.descriptor.getModule('toolbox') && this.descriptor.getModule('toolbox').instance)
    this.descriptor.getModule('toolbox').instance.enableRestoreProd(enabled);
};
Sandbox.prototype.changeStatus = function (annotationID, status) {
if (this.descriptor.options.userID)
         var userID= this.descriptor.options.userID;
        else {
            userID = '-1';
        }
    var annotation = { annotationID: annotationID, userID:  userID, status: status };
   this.descriptor.getModule('network').instance.createRequest('POST', annotation, 'ChangeAnnotationStatus');
};
Sandbox.prototype.restoreAnnotation = function (annotationID, status, callback) {
if (this.descriptor.options.userID)
         var userID= this.descriptor.options.userID;
        else {
            userID = '-1';
        }
    var annotation = { AnnotationID: annotationID, UserID:  userID, Status: status };
    this.descriptor.getModule('network').instance.createRequest('POST', annotation, 'RestoreAnnotation', callback);
};

Sandbox.prototype.getPoints = function (points, layer) {
    if (points != null) {
        for (var key in points) {
            points[key].x = this.descriptor.chartModel.priceCoordinateSystem.transformArgument(new Date(points[key].x));

            if (layer == 'V') {
                points[key].y = this.descriptor.chartModel.chartGeometry.mainContainer.height - this.descriptor.chartModel.volumeCoordinateSystem.transformValue(points[key].y).toFixed(9);
            }
            else {

                points[key].y = this.descriptor.chartModel.chartGeometry.mainContainer.height - this.descriptor.chartModel.priceCoordinateSystem.transformValue(points[key].y).toFixed(9);
            }
        }
    }
    return points;
}

Sandbox.prototype.setPoints = function (points) {
    if (this.descriptor.selectedShape.setPoints) {
        this.descriptor.selectedShape.setPoints(points);
    }
}
    
Sandbox.prototype.setConfig = function (config) {
    if (this.descriptor.selectedShape.config) {
        this.descriptor.selectedShape.config(config);
    }
}

Sandbox.prototype.select = function (shape) {
    this.descriptor.selectedShape = shape;
}

/*Progress +1*/
loadProgress.addValue(15);