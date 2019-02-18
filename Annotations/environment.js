var ibdCache = {
    add: function (key, value) {
        if (typeof(Storage) !== "undefined") {
            localStorage[key] = value;
        }
        else {
            console.log("LocalStorage is not supported");
        }
    },
    contains: function (key) {
        if (localStorage[key] != undefined)
            return true;
        else
            return false;
    },
    getValue: function (key) {
        return localStorage[key];
    }
};

var ibdEnviroment = {
    OS: {
        Name: (function () {

            var OSName = "unknown OS";
            if (navigator.appVersion.indexOf("Win") != -1) OSName = "Windows";
            if (navigator.appVersion.indexOf("Mac") != -1) OSName = "MacOS";
            if (navigator.appVersion.indexOf("X11") != -1) OSName = "UNIX";
            if (navigator.appVersion.indexOf("Linux") != -1 && navigator.appVersion.indexOf("Android") == -1) OSName = "Linux";
            if (navigator.appVersion.indexOf("Android") != -1) OSName = "Android";
            if (navigator.appVersion.indexOf("iOS") != -1) OSName = "iOS";

            return OSName;
        })(),
        Version: (function () {
            return undefined;
        })()
    },
    Browser: (function () {
        var nAgt = navigator.userAgent;
        var browserName = navigator.appName;
        var fullVersion = '' + parseFloat(navigator.appVersion);
        var majorVersion = parseInt(navigator.appVersion, 10);
        var nameOffset, verOffset, ix;

        if ((verOffset = nAgt.indexOf("Opera")) != -1) {
            browserName = "Opera";
            fullVersion = nAgt.substring(verOffset + 6);
            if ((verOffset = nAgt.indexOf("Version")) != -1)
                fullVersion = nAgt.substring(verOffset + 8);
        } else if ((verOffset = nAgt.indexOf("MSIE")) != -1) {
            browserName = "Microsoft Internet Explorer";
            fullVersion = nAgt.substring(verOffset + 5);
        } else if ((verOffset = nAgt.indexOf("Chrome")) != -1) {
            browserName = "Chrome";
            fullVersion = nAgt.substring(verOffset + 7);
        } else if ((verOffset = nAgt.indexOf("Safari")) != -1) {
            browserName = "Safari";
            fullVersion = nAgt.substring(verOffset + 7);
            if ((verOffset = nAgt.indexOf("Version")) != -1)
                fullVersion = nAgt.substring(verOffset + 8);
        } else if ((verOffset = nAgt.indexOf("Firefox")) != -1) {
            browserName = "Firefox";
            fullVersion = nAgt.substring(verOffset + 8);
        } else if ((nameOffset = nAgt.lastIndexOf(' ') + 1) <
            (verOffset = nAgt.lastIndexOf('/'))) {
            browserName = nAgt.substring(nameOffset, verOffset);
            fullVersion = nAgt.substring(verOffset + 1);
            if (browserName.toLowerCase() == browserName.toUpperCase()) {
                browserName = navigator.appName;
            }
        }

        if ((ix = fullVersion.indexOf(";")) != -1)
            fullVersion = fullVersion.substring(0, ix);
        if ((ix = fullVersion.indexOf(" ")) != -1)
            fullVersion = fullVersion.substring(0, ix);

        majorVersion = parseInt('' + fullVersion, 10);
        if (isNaN(majorVersion)) {
            fullVersion = '' + parseFloat(navigator.appVersion);
            majorVersion = parseInt(navigator.appVersion, 10);
        }
        var browserInfo = {Name: browserName, FullVersion: fullVersion, MajorVersion: majorVersion};


        return browserInfo;

    })(),
    Device: {
        isMobile: (function () {
            if (navigator.userAgent.match(/iPhone|iPad|iPod|Android|BlackBerry|Windows Phone/i))
                return true;
            return false;
        })(),
        Type: (function () {
            var device = "unknown device";
            if (navigator.userAgent.match(/Android/i)) device = "Android";
            if (navigator.userAgent.match(/iPhone/i)) device = "iPhone";
            if (navigator.userAgent.match(/iPad/i)) device = "iPad";
            return device;
        })()
    },
    // graphic context initialization
    GraphicContext: function (chartContainer) {
        var mode = -1;

        var test_canvas = document.createElement("canvas");
        // supports canvas

        /*if (options.chartType == Charts.MINILB) {
         if (test_canvas.getContext) {
         mode = mscg_graphicContextMode.canvas;
         }
         else if (document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1")) {

         mode = mscg_graphicContextMode.svg;
         }
         else if (ibdEnviroment.Browser.Name = "Microsoft Internet Explorer" && ibdEnviroment.Browser.MajorVersion < 9) {
         mode = mscg_graphicContextMode.vml;
         }

         }*/
        //  else {
        if (document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1")) {
            mode = mscg_graphicContextMode.svg;
        }
        else if (test_canvas.getContext) {
            mode = mscg_graphicContextMode.canvas;
        }
        // supports vml (IE < 9 only)
        else if (ibdEnviroment.Browser.Name = "Microsoft Internet Explorer" && ibdEnviroment.Browser.MajorVersion < 9) {
            mode = mscg_graphicContextMode.vml;
        }
        // }

        test_canvas = null;
        if (ClientDevices.is_android) {
            // Do something!
            // Redirect to Android-site?
            return new mscg_graphicContextSvg(chartContainer);
        }
        switch (mode) {

            case mscg_graphicContextMode.svg: {
                mc_logger.log("svg mode");
                return new mscg_graphicContextSvg(chartContainer);
            }
                break;
            case mscg_graphicContextMode.canvas: {
                mc_logger.log("canvas mode");
                return new mscg_graphicContextHtml5(chartContainer);

            }
                break;
        }

        mc_logger.log("unkown browser");
        return null;
    }
};

var ClientDevices = {
    is_iphone: (function () {
        return ibdEnviroment.Device.Type == "iPhone";
    })(),
    is_android: (function () {
        return ibdEnviroment.Device.Type == "Android";
    })(),
    is_ipad: (function () {
        return (ibdEnviroment.Device.Type == "iPad");
    })(),
};




