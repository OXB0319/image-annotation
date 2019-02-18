var DrawCore = function () {
    var moduleData = {};
    var layers = {
        beginLayer: document.createElement('div'),
        endLayer: document.createElement('div')
    };

    var isDrawing = false;
    this.isEditMode = false;

    return {
        shapes: [],
        isDrawing: function (value) {
            if (typeof (value) === "undefined") {
                return isDrawing;
            }
            isDrawing = value;
        },
        register: function (moduleID, creator) {
            moduleData[moduleID] = {
                creator: creator,
                instance: null
            };
        },
        start: function (moduleID) {
            moduleData[moduleID].instance = moduleData[moduleID].creator(new Sandbox(this));
            moduleData[moduleID].instance.init();
        },
        stop: function (moduleID) {
            var data = moduleData[moduleID];
            if (data.instance) {
                if (data.instance.destroy)
                    data.instance.destroy();
                data.instance = null;
            }
        },
        stopAll: function () {
            try {
                for (var i in moduleData) {
                    this.stop(i);
                }

            } catch (e) {
                console.log(e);
            }
        },
        startAll: function (cnt, params) {
            // try {
            this.container = cnt;

            //Init layers

            layers.beginLayer.classList.add('layer-label');
            layers.endLayer.classList.add('layer-label');

            this.params = params;
            this.container.appendChild(layers.beginLayer);
            this.container.appendChild(layers.endLayer);

            this.postURL = '/services/ChartService.svc/';
            for (var i in moduleData) {
                if ((params.IsAnnotationsAdmin == "0" && i == "toolbox")) {
                    continue;
                }
                this.start(i);
            }
            var core = this;
            if (params.IsAnnotationsAdmin == "1") {
                this.isEditMode = true;
            }
            return {
                showAnnotations: function (options) {
                    if (options) {
                        options.userID = options.params.UserID;
                        options.symbol = options.params.symbol;
                        core.options = options;
                    }
                    core.getAnnotations(true);
                },
                isDrawing: function () {
                    return isDrawing;
                },
                getAnnotations: function () {
                    return core.annotations;
                },
                clearAnnotations: function () {
                    core.getModule('surface').instance.clearShapes();
                    core.getModule('sysSurface').instance.clearShapes();
                },
                addAnnotation: function (annotation, animate, options) {
                    moduleData['builder'].instance.addAnnotation(annotation, animate, options);
                }
            }
        },
        getModule: function (moduleID) {
            return moduleData[moduleID];
        },
        createInstance: function (name, isSys) {
            switch (name) {
                case 6:
                    return new Rectangle(new Sandbox(this), isSys);
                case 3:
                    return new Ellipse(new Sandbox(this));
                case 23:
                    return new HLine(new Sandbox(this));
                case 14:
                    return new VLine(new Sandbox(this));
                case 24:
                    return new Line(new Sandbox(this));
                case 7:
                    return new Arrow(new Sandbox(this));
                case 2:
                    return new MarkerLine(new Sandbox(this));
                case 8:
                    return new Cup(new Sandbox(this), false);
                case 9:
                    return new Trapezoid(new Sandbox(this));
                case 5:
                    return new Note(new Sandbox(this));
                case 25:
                    return new Cup(new Sandbox(this), true);
                case 26:
                    return new TextBoxWithLine(new Sandbox(this), true);
                case 27:
                    return new TextBoxWithLine(new Sandbox(this), false);
            }
        },
        getStyles: function () {
            if (this.styles)
                return this.styles;
            return moduleData['toolbox'].instance.getStyles();
        },
        getLayer: function () {
            return moduleData['toolbox'].instance.getLayer();
        },
        deselectShape: function () {
            if (moduleData['toolbox'] && moduleData['toolbox'].instance)
                this.isDrawing(false);
            try {
                moduleData['toolbox'].instance.deselectShape();
            } catch (e) {

            }
        },

        postAnnotation: function (annotation, callback) {
            if (this.options.userID)
                annotation.UserID = this.options.userID;
            else {
                annotation.UserID = '-1';
            }

            moduleData['network'].instance.createRequest('POST', annotation, 'CreateAnnotation', callback);
        },
        getAnnotations: function (animate) {

            if (this.options.userID)
                var userId = this.options.userID;
            else {
                userId = '-1';
            }
            var req = {
                BeginDate: this.options.beginDate,
                EndDate: this.options.endDate,
                GraphType: this.options.graphType,
                Symbol: this.options.symbol,
                UserID: userId,
                ShowEditOnly: this.options.showEditOnly
            };

            moduleData['network'].instance.createRequest('POST', req, 'GetAnnotations', function (data) {

                // asynx/await emulation - wainting for chart initialization
                var intervalId = setInterval(function () {
                    console.log('async working');

                    if (this.chartModel.chartGeometry != null) {
                        clearInterval(intervalId);
                        console.log('async stopped');
                        this.annotations = data.Annotations;
                        console.log(data);
                        moduleData['builder'].instance.getAnnotations(data, animate);
                        if (this.options.onUpdated) {
                            this.options.onUpdated();
                        }

                    }
                }.bind(this), 10);

            }.bind(this));
        },
        showLayers: function (beginX, endX, beginY, endY, layer) {
            layers.beginLayer.innerHTML = layer;
            layers.endLayer.innerHTML = layer;

            layers.beginLayer.style.top = beginY + 3 + 'px';
            layers.beginLayer.style.left = beginX + 3 + 'px';

            layers.endLayer.style.top = endY + 3 + 'px';
            layers.endLayer.style.left = endX + 3 + 'px';

            layers.beginLayer.style.display = 'block';
            layers.endLayer.style.display = 'block';
        },
        hideLayers: function () {
            layers.beginLayer.style.display = 'none';
            layers.endLayer.style.display = 'none';
        },

        deleteAnnotation: function (annotationID, callback) {
            if (this.options.userID)
                var userID = this.options.userID;
            else {
                userID = '-1';
            }
            var annotationDTO = {
                AnnotationID: annotationID,
                UserID: userID
            };
            moduleData['network'].instance.createRequest('POST', annotationDTO, 'DeleteAnnotation', callback);
        },
        updateAnnotation: function (annotation, callback) {
            if (this.options.userID)
                annotation.UserID = this.options.userID;
            else {
                annotation.UserID = '-1';
            }
            annotation.DatePriceValidFor = new Date();
            annotation.RecordDate = new Date();
            moduleData['network'].instance.createRequest('POST', annotation, 'UpdateAnnotation', callback);
        },
        getShapeByID: function (id) {
            for (var shape in this.shapes) {
                if (this.shapes[shape].annotationDTO.annotationID === id) {
                    return this.shapes[shape];
                }
            }
        },

        setIsEditMode: function (isEditMode) {
            this.isEditMode = isEditMode;
        },
        isEditMode: this.isEditMode
    };
}();
