DrawCore.register('builder', function (sandbox) {

    var rsClientToWorld = function (priceValue) {

        priceValue /= sandbox.descriptor.chartModel.rsView.options.divisor;
        return priceValue;
    };
    var worldToClientRS = function (priceValue) {

        priceValue *= sandbox.descriptor.chartModel.rsView.options.divisor;
        return priceValue;
    };

    function cutHex(h) {
        return (h.charAt(0) == "#") ? h.substring(1, 7) : h
    }

    function hexToR(h) {
        return parseInt((cutHex(h)).substring(0, 2), 16)
    }

    function hexToG(h) {
        return parseInt((cutHex(h)).substring(2, 4), 16)
    }

    function hexToB(h) {
        return parseInt((cutHex(h)).substring(4, 6), 16)
    }

    var toColorARGB = function (value) {
        var part = value.indexOf("[");
        var part2 = value.indexOf("]");
        var sub = value.substring(part + 1, part2);
        var split = sub.split(', ');

        var alfa = split[0].substring(split[0].indexOf('=') + 1, split[0].length);


        var red = split[1].substring(split[1].indexOf('=') + 1, split[1].length);
        var green = split[2].substring(split[2].indexOf('=') + 1, split[2].length);
        var blue = split[3].substring(split[3].indexOf('=') + 1, split[3].length);
        var rgb = 'rgb(' + red + ',' + green + ',' + blue + ')';
        return {alfa: (parseInt(alfa) / 255).toFixed(1), rgb: rgb};
    };
    var toColorRGB = function (color, opacity) {
        var alfa = Math.floor(opacity * 255);
        if (color.charAt(0) == "#") {

            return alfa + ',' + hexToR(color) + ',' + hexToG(color) + ',' + hexToB(color);
        } else {
            var part = color.indexOf("(");
            var part2 = color.indexOf(")");
            var sub = color.substring(part + 1, part2);
            var split = sub.split(',');
            var red = split[0];
            var green = split[1];
            var blue = split[2];
            return alfa + ',' + red + ',' + green + ',' + blue;
        }
    };

    var addAnnotationEventHandlers = {};
    var deleteAnnotationEventHandlers = {};

    return {
        init: function () {

        },
        addAnnotation: function (annotation, animate) {
            var points = JSON.parse(annotation.PointsJson);
            var config = JSON.parse(annotation.ConfigJson);

            if (annotation.Layer == "RS") {
                //annotation.EndPrice = rsClientToWorld(annotation.EndPrice);
                for (var i = 0; i < points.length; i++) {
                    points[i].y = rsClientToWorld(points[i].y);
                }
            }
            //var pos = sandbox.getShapePositions(annotation.BeginDate, annotation.EndDate, annotation.BeginPrice, annotation.EndPrice, annotation.BeginVolume, annotation.EndVolume);

            points = sandbox.getPoints(points, annotation.Layer);
            sandbox.selectShape(annotation.NoteType, annotation.IsSystem);
            if (sandbox.canDraw()) {
                sandbox.startDraw();
                sandbox.setConfig(config);
                sandbox.setPoints(points);
                sandbox.descriptor.selectedShape.annotationDTO.annotationID = annotation.AnnotationID;
                sandbox.descriptor.selectedShape.annotationDTO.status = annotation.Status;
                sandbox.descriptor.selectedShape.annotationDTO.layer = annotation.Layer;
                sandbox.descriptor.selectedShape.annotationDTO.datePriceValidFor = annotation.DatePriceValidFor;
                sandbox.descriptor.selectedShape.annotationDTO.recordDate = annotation.RecordDate;
                if (annotation.NoteText && sandbox.descriptor.selectedShape.text) {
                    sandbox.descriptor.selectedShape.text(annotation.NoteText, false);
                    sandbox.descriptor.selectedShape.annotationDTO.NoteText = annotation.NoteText;
                }

                if (annotation.NoteType == 26 || annotation.NoteType == 27) {
                    sandbox.descriptor.selectedShape.editText = true;
                }

                sandbox.saveShapeFromServer();

                if (annotation.NoteType == 26 || annotation.NoteType == 27) {
                    sandbox.descriptor.selectedShape.editText = false;
                }

                //do not show annotation that is deleted after published

                if (annotation.Status == sandbox.eAnnotationState.PEND_DELETE_UNREV_PUB ||
                    annotation.Status == sandbox.eAnnotationState.PEND_DELETE_REV_PUB ||
                    annotation.Status == sandbox.eAnnotationState.PEND_DELETE_READY_PUB) {
                    sandbox.descriptor.selectedShape.hide();
                }

                if (sandbox.descriptor.selectedShape.annotationDTO.status != sandbox.eAnnotationState.PUBLISHED)
                    sandbox.enableRestoreProd(true);
            }

            sandbox.deselectShape();
            sandbox.descriptor.styles = undefined;
        },
        getAnnotations: function (data, animate) {
            var annotations = data.Annotations;
            sandbox.clearShapes();
            for (var i = 0; i < annotations.length; i++) {
                this.addAnnotation(annotations[i], animate);
            }

            console.log("Annotations render finished.");
        },

        saveAnnotation: function (shape, callback) {
            var annotation = {};
            annotation.AnnotationID = 0;
            if (shape.annotationDTO.Status !== sandbox.eAnnotationState.PUBLISHED)
                annotation.Status = sandbox.eAnnotationState.EDITING_UNREV_UNPUB;
            else {
                annotation.Status = shape.annotationDTO.Status;
            }
            annotation.Symbol = sandbox.descriptor.options.symbol;
            annotation.GraphType = sandbox.descriptor.options.graphType;
            annotation.Layer = shape.annotationDTO.layer;
            annotation.NoteText = (function () {
                var s = "";
                if (shape.NoteText) {
                    s = shape.NoteText;
                }
                if (shape.noteText) {
                    s = shape.noteText;
                }

                if (s) {
                    while (s.indexOf("<br>") != -1) {
                        s = s.replace("<br>", '');
                    }
                    while (s.indexOf("</div>") != -1) {
                        s = s.replace("</div>", '');
                    }
                    while (s.indexOf("<div>") != -1) {
                        s = s.replace("<div>", '\r');
                    }
                    while (s.indexOf("&nbsp;") != -1) {
                        s = s.replace("&nbsp;", ' ');
                    }
                    return s;
                } else return '';
            })();
            annotation.NoteType = shape.annotationDTO.noteType;
            annotation.DatePriceValidFor = (new Date());
            annotation.RecordDate = (new Date());
            annotation.PointsJson = shape.annotationDTO.pointsJson;
            annotation.ConfigJson = shape.annotationDTO.configJson;

            sandbox.descriptor.postAnnotation(annotation, function (data) {
                for (var i = 0; i < data.Annotations.length; i++) {
                    shape.annotationDTO.annotationID = data.Annotations[i].AnnotationID;
                    shape.annotationDTO.status = data.Annotations[i].Status;
                    shape.annotationDTO.datePriceValidFor = data.Annotations[i].DatePriceValidFor;
                    shape.annotationDTO.recordDate = data.Annotations[i].RecordDate;

                    if (shape.annotationDTO.status != sandbox.eAnnotationState.PUBLISHED)
                        sandbox.enableRestoreProd(true);
                }

                for (var key in addAnnotationEventHandlers) {
                    addAnnotationEventHandlers[key](shape.annotationDTO);
                }
                if (callback)
                    callback();
            });
        },
        deleteAnnotation: function (shape) {
            if (shape.annotationDTO.annotationID === -1) return;
            sandbox.descriptor.deleteAnnotation(shape.annotationDTO.annotationID, function (data) {
                if (data.Status == 0) {
                    shape.delete();
                    sandbox.descriptor.hideLayers();
                    sandbox.enableRestoreProd(true);
                    for (var key in deleteAnnotationEventHandlers) {
                        deleteAnnotationEventHandlers[key](shape.annotationDTO);
                    }
                }
            });
        },
        updateAnnotation: function (shape, callback) {
            if (shape.annotationDTO.annotationID === -1) return;

            var annotation = {};
            annotation.AnnotationID = shape.annotationDTO.annotationID;
            annotation.UserID = 0;
            annotation.Status = shape.annotationDTO.status;
            annotation.Symbol = sandbox.descriptor.options.symbol;
            annotation.GraphType = sandbox.descriptor.options.graphType;
            annotation.Layer = shape.annotationDTO.layer;
            annotation.NoteText = (function () {
                if (typeof (shape.text) != "function") {
                    return "";
                }
                var s = shape.text();
                if (s) {
                    while (s.indexOf("<br>") != -1) {
                        s = s.replace("<br>", '\r');
                    }
                    while (s.indexOf("</div>") != -1) {
                        s = s.replace("</div>", '');
                    }
                    while (s.indexOf("<div>") != -1) {
                        s = s.replace("<div>", '\r');
                    }
                    while (s.indexOf("&nbsp;") != -1) {
                        s = s.replace("&nbsp;", ' ');
                    }
                    return s;
                } else return '';
            })(),
                ////////////////
                annotation.NoteType = shape.annotationDTO.noteType;
            annotation.DatePriceValidFor = shape.annotationDTO.datePriceValidFor;
            annotation.RecordDate = shape.annotationDTO.recordDate;
            annotation.PointsJson = shape.annotationDTO.pointsJson;
            annotation.ConfigJson = shape.annotationDTO.configJson;

            sandbox.descriptor.updateAnnotation(annotation, function (data) {
                if (callback) callback(data);
            });

        },
        registerAddAnnotationEvent: function (key, handler) {
            if (typeof (handler) === "function") {
                addAnnotationEventHandlers[key] = handler;
            }
        },
        registerDeleteAnnotationEvent: function (key, handler) {
            if (typeof (handler) === "function") {
                deleteAnnotationEventHandlers[key] = handler;
            }
        },
        getBasicLinePointOfChart: function (x, layer) {
            var coordinateSystem = sandbox.descriptor.chartModel.priceCoordinateSystem;
            if (layer == 'P') {
                coordinateSystem = sandbox.descriptor.chartModel.priceCoordinateSystem;
            }
            else if (layer == 'RS') {
                coordinateSystem = sandbox.descriptor.chartModel.priceCoordinateSystem;
            }
            else if (layer == 'V') {
                coordinateSystem = sandbox.descriptor.chartModel.volumeCoordinateSystem;
            }

            var points = sandbox.descriptor.chartModel.getLogical(x, 0);
            var beginDate = coordinateSystem.reverseTransformX(x);
            //var datasource = sandbox.descriptor.chartModel.priceView.options.datasource;
            var endDate = new Date(beginDate.getTime() + 24 * 3600 * 1000 * 6);

            var endX = coordinateSystem.transformArgument(endDate);

            var y = sandbox.descriptor.chartModel.chartGeometry.mainContainer.height - coordinateSystem.transformValue(points.high + 0.1);
            return {
                endX: endX,
                y: y
            };
        },
        getAnnotationPosition: function (beginX, beginY, endX, endY, layer) {
            var coordinateSystem = sandbox.descriptor.chartModel.priceCoordinateSystem;
            var beginPrice = 0;
            var beginVolume = 0;

            var endPrice = 0;
            var endVolume = 0;

            if (layer == 'P') {
                coordinateSystem = sandbox.descriptor.chartModel.priceCoordinateSystem;
                beginPrice = coordinateSystem.transformValue(beginY);
                endPrice = coordinateSystem.transformValue(endY);
            }
            else if (layer == 'RS') {
                coordinateSystem = sandbox.descriptor.chartModel.priceCoordinateSystem;
            }
            else if (layer == 'V') {
                coordinateSystem = sandbox.descriptor.chartModel.volumeCoordinateSystem;
                beginVolume = coordinateSystem.transformValue(beginY);
                endVolume = coordinateSystem.transformValue(endY);
            }

            var beginDate = coordinateSystem.reverseTransformX(beginX);
            var endDate = coordinateSystem.reverseTransformX(endX);

            return {
                beginDate: beginDate, endDate: endDate,
                beginPrice: beginPrice, beginVolume: beginVolume,
                endPrice: endPrice, endVolume: endVolume
            }
        },
        getClosePositionOfChart: function (date, layer) {
            var coordinateSystem = sandbox.descriptor.chartModel.priceCoordinateSystem;
            if (layer == 'P') {
                coordinateSystem = sandbox.descriptor.chartModel.priceCoordinateSystem;
            }
            else if (layer == 'RS') {
                coordinateSystem = sandbox.descriptor.chartModel.priceCoordinateSystem;
            }
            else if (layer == 'V') {
                coordinateSystem = sandbox.descriptor.chartModel.volumeCoordinateSystem;
            }
            var x = coordinateSystem.transformArgument(date);
            var points = sandbox.descriptor.chartModel.getLogical(x, 0);

            var y = sandbox.descriptor.chartModel.chartGeometry.mainContainer.height - coordinateSystem.transformValue(points.last);

            return new Point(x, y);
        },
        excuteDeleteAnnotationEvent: function (shape) {
            for (var key in deleteAnnotationEventHandlers) {
                deleteAnnotationEventHandlers[key](shape.annotationDTO);
            }
        },
        excuteAddAnnotationEvent: function (shape) {
            for (var key in addAnnotationEventHandlers) {
                addAnnotationEventHandlers[key](shape.annotationDTO);
            }
        }
    };
});