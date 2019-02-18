DrawCore.register('sysSurface', function (sandbox) {
    var svg = null;
    var self = this;
    return {
        init: function() {
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

            svg = sandbox.createSysSurface(startDiv, endDiv);
            svg.setAttribute('width', '100%');
            svg.setAttribute('height', '100%');
            svg.style.position = 'absolute';
            //Register Event Listeners

            window.addEventListener("resize", winResize);

            function winResize() {
                sandbox.refreshShapes();
            }

        },
        clearShapes: function() {
            sandbox.clearShapes();
        }
    }
});
