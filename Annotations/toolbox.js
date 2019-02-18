DrawCore.register('toolbox', function (sandbox) {
    var options = {
        isSys: false
    }

    var fillColor = '#FFFFFF';
    var strokeColor = '#404040';
    var fillOpacity = '1';
    var strokeOpacity = '1';
    var lineWidth = 1;
    var layer = 'P';
    var shapeBtns;
    var selectedBtn = null;
    var restoreBtn = null;
    var dd = null;
    var tooldd = null;
    var tooldditems = null;
    var prs = null;
    var initY = null;
    var initX = null;
    var selector = null;
    var thead = null;
    var toolsMin = null;
    var toolbox = null;
    var miniMore = null;
    var miniTools = null;
    var expandCollapse = null;

    function toggleMiniTools() {
        if (miniTools.style.display == 'none') {
            miniTools.style.display = 'block';
        } else {
            miniTools.style.display = 'none';
        }
    }

    function selectShape() {
        if (selectedBtn != null) {
            selectedBtn.classList.remove('btnActive');
        }

        this.classList.add('btnActive');
        selectedBtn = this;
        if (this.getAttribute('id') == 'deleteShape') {
            sandbox.descriptor.selectedShape = null;
            sandbox.readyForDelete = true;
            return false;
        }
        sandbox.descriptor.isDrawing(true);
        sandbox.selectShape(this.getAttribute('note-type'));
    }

    function changeOpacity() {
        if (this.value > 100) {
            this.value = 100;
        }
        if (this.value < 0) {
            this.value = 0;
        }

        if (!this.value.match(/^\d+$/)) {
            this.value = this.value.replace(/\D/g, '');
        }

        var opacity = this.value;
    }

    function toggleDD(e) {
        if (tooldd.style.display == 'none') {
            tooldd.style.display = 'block';
        } else {
            tooldd.style.display = 'none';
        }
    }

    function changeLayer() {
        if (this.innerHTML == 'Price') {
            layer = 'P';
        }
        else if (this.innerHTML == 'RS') {
            layer = 'RS';
        }
        else if (this.innerHTML == 'Volume') {
            layer = 'V';
        }

        prs.innerHTML = this.innerHTML;

    }

    function restoreProd() {
        sandbox.restoreProd();
    }

    function hMouseDown(e) {
        e.cancelBubble = true;
        var pageX = e.pageX - selector.parentNode.offsetLeft;
        var pageY = e.pageY - selector.parentNode.offsetTop;

        var left = parseInt(selector.style.left.replace('px', ''));
        if (left == NaN || left === undefined) {
            left = 0;
        }
        initX = pageX - left;

        var top = parseInt(selector.style.top.replace('px', ''));
        if (top === NaN || top === undefined) {
            top = 0;
        }
        initY = pageY - top;

        thead.addEventListener('mousemove', hMouseMove, false);
        selector.parentNode.addEventListener('mousemove', hMouseMove, false);
        thead.addEventListener('mouseup', hMouseUp, false);
        document.body.addEventListener('mouseup', hMouseUp, false);
    }

    function hMouseMove(e) {
        e.cancelBubble = true;

        var x = e.pageX - selector.parentNode.offsetLeft;
        var y = e.pageY - selector.parentNode.offsetTop;
        var client = sandbox.getClientDimmensions();

        if (y <= client.top) {
            y = client.top;
        }

        if (x <= client.left) {
            x = client.left;
        }
        if (x >= client.width - selector.offsetWidth - 20) {
            x = client.width - selector.offsetWidth - 20;
        }
        selector.style.left = (x - initX) + 'px';
        selector.style.top = (y - initY) + 'px';

    }

    function hMouseUp(e) {
        e.cancelBubble = true;
        thead.removeEventListener('mousemove', hMouseMove, false);
        selector.parentNode.removeEventListener('mousemove', hMouseMove, false);
    }

    return {
        init: function () {
            //Shape selection
            shapeBtns = document.getElementsByClassName('btn1');

            for (var i = 0; i < shapeBtns.length; i++) {
                shapeBtns[i].addEventListener('click', selectShape, false);
            }
        },
        destroy: function () {
            for (var i = 0; i < shapeBtns.length; i++) {
                shapeBtns[i].removeEventListener('click', selectShape, false);
            }

            dd.removeEventListener('click', toggleDD, false);

            for (i = 0; i < tooldditems.length; i++) {

                tooldditems[i].removeEventListener('click', changeLayer, false);

            }
            restoreBtn.removeEventListener('click', restoreProd, false);
            thead.removeEventListener('mousedown', hMouseDown, false);
            toolsMin.removeEventListener('click', toggleMin, false);

        },
        getStyles: function () {
            return {
                fillColor: fillColor,
                strokeColor: strokeColor,
                fillOpacity: fillOpacity,
                strokeOpacity: strokeOpacity,
                lineWidth: lineWidth
            };
        },
        getLayer: function () {
            return layer;
        },
        deselectShape: function () {
            if (selectedBtn != null)
                selectedBtn.classList.remove('btnActive');

        },
        enableRestoreProd: function (enabled) {
            if (enabled) {
                restoreBtn.classList.remove('disabled');
                restoreBtn.addEventListener('click', restoreProd, false);
            }
            else {
                restoreBtn.classList.add('disabled');
                restoreBtn.removeEventListener('click', restoreProd, false);
            }
        },
        hide: function () {
            $('#toolbox_cnt').attr('style', 'display:none !important');
            this.hideAnnotationList();
        },
        show: function () {
            $('#toolbox_cnt').attr('style', 'display:block !important');
        },
        hideAnnotationList: function () {
            if ($("#annotationListDialog").hasClass('ui-dialog-content')) {
                $("#annotationListDialog").dialog('close');
            }
        },
        removeAnnotationList: function () {
            if ($("#annotationListDialog").hasClass('ui-dialog-content')) {
                $("#annotationListDialog").dialog('destroy').remove();
            }
        },
        disableMouseDown: function () {
            thead.removeEventListener('mousedown', hMouseDown, false);
        }
    };
});
