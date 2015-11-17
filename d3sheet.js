(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.d3sheet = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
!function() {
    checkRequirements();

    var d3sheet = {
        ver: "1.0.0",
        db: {},
        model: {},
        nodes: []
    };

    module.exports = d3sheet;

    /**
    * Initialize D3 sheet.
    * @param {string} containerId - identifier of the main DIV.
    **/
    d3sheet.init = function(svgContainerId, infoContainerId) {
        if (svgContainerId == null)
            svgContainerId = "d3sheet-svg";
        d3sheet.svgContainerId = svgContainerId;

        if (infoContainerId == null)
            infoContainerId = "d3sheet-info";
        d3sheet.infoContainerId = infoContainerId;

        var $svgContainerId = $("#" + svgContainerId),
            width = $svgContainerId.width(),
            height = $svgContainerId.height();

        // Create SVG element
        d3.select("#" + svgContainerId)
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr('viewBox', "0 0 " + width + " " + height);

        // Create info panel
        d3.select("#" + infoContainerId)
            .append("div");

        return d3sheet;
    }

    /**
    * Load data from spreadsheet.
    **/
    d3sheet.load = function(spreadsheetKey) {
        // Load spreadsheet
        var spreadsheet = require("./spreadsheet");
        spreadsheet(spreadsheetKey, function(spreadsheetData) {
            d3sheet.db = spreadsheetData;

            // Create model from DB
            var model = require("./model");
            d3sheet.model = model(d3sheet.db);

            // Create graph from model
            var graph = require("./graph");
            d3sheet.graph = graph(model);

            // Create D3 force layout from graph
            var force = require("./force");
            force(graph);
        });
    }

    function checkRequirements() {
        if (typeof d3 === "undefined")
            throw new Error("D3 library not found!");
        if (typeof $ === "undefined")
            throw new Error("jQuery not found!");
    }
}();
},{"./force":2,"./graph":3,"./model":4,"./spreadsheet":5}],2:[function(require,module,exports){
module.exports = function(graph) {
}
},{}],3:[function(require,module,exports){
module.exports = function(model) {
    var graph = {
        nodes: [],
        links: []
    }

    return graph;
}
},{}],4:[function(require,module,exports){
module.exports = function(spreadsheet) {
    var model = {
        graph: {},
        settings: {}
    };

    var sheetTypes = getSheetTypes(spreadsheet);
    model.graph = getGraph(spreadsheet, sheetTypes.nodesSheetNames);
    if (sheetTypes.settingsSheetName != null)
        model.settings = spreadsheet[sheetTypes.settingsSheetName];

    console.log(model);

    function getGraph(spreadsheet, nodesSheetNames) {
        var graph = {};
        $.each(nodesSheetNames, function(i, nodesSheetName) {
            graph[nodesSheetName] = getNodes(spreadsheet[nodesSheetName]);
        });

        function getNodes(nodeSheet) {
            var result = {
                label: nodeSheet.header[0].text,
                nodes: []
            };
            $.each(nodeSheet.rows, function(i, row) {
                result.nodes.push(getNodeProperties(row));
            });
            return result;
        }

        function getNodeProperties(row) {
            var nodeProperties = {};
            var colNames = Object.keys(row);
            $.each(colNames, function(i, colName) {
                if (colName.indexOf(".") == -1)
                    nodeProperties[colName] = row[colName];
            });
            return nodeProperties;
        }

        return graph;
    }

    function getSheetTypes(spreadsheet) {
        var sheetTypes = {
            nodesSheetNames: [],
            linkSheetNames: [],
            settingsSheetName: null
        };
        var sheetNames = Object.keys(spreadsheet);
        $.each(sheetNames, function(i, sheetName) {
            if (sheetName == "settings") {
                sheetTypes.settingsSheetName = sheetName;
                return;
            }

            if (sheetName.slice(0, 1) == "#")
                return;

            var linkSheet = parseLinkSheetName(sheetName)
            if ((linkSheet != null) &&
                (sheetNames.indexOf(linkSheet.source) > -1) &&
                (sheetNames.indexOf(linkSheet.target) > -1)) {
                sheetTypes.linkSheetNames.push(sheetName)
                return;
            }

            sheetTypes.nodesSheetNames.push(sheetName);
        });

        return sheetTypes;
    }

    function parseLinkSheetName(sheetName) {
        var nodeNames = sheetName.split("-");
        if (nodeNames.length == 2) {
            return {
                source: nodeNames[0],
                target: nodeNames[1]
            };
        }

        return null;
    }

    return model;
}
},{}],5:[function(require,module,exports){
module.exports = function(spreadsheetKey, onLoaded) {
    // Get sheet count
    getSheetCount(spreadsheetKey, function onSuccess(sheetCount) {
        // Load all sheets
        loadSheets(spreadsheetKey, sheetCount);
    });

    function loadSheets(spreadsheetKey, sheetCount) {
        var spreadsheet = {};
        var loadedSheetCount = 0;
        for (i = 1; i <= sheetCount; i++) {
            loadSheet(spreadsheet, spreadsheetKey, i).then(function() {
                loadedSheetCount += 1;
                if (loadedSheetCount == sheetCount) {
                    onLoaded(spreadsheet);
                }
            })
        }
    }

    function loadSheet(spreadsheet, spreadsheetKey, sheetIndex) {
        return getSheet(spreadsheetKey, sheetIndex, function(response) {
            var sheet = spreadsheet[response.feed.title.$t] = {
                header: [],
                rows: [],
            };

            $.each(response.feed.entry, function(i, e) {
                if (e.gs$cell.row == 1) {
                    sheet.header[e.gs$cell.col - 1] = {
                        text: e.content.$t
                    };
                }
                else {
                    var index = e.gs$cell.row - 2;
                    if (sheet.rows[index] == null) {
                        sheet.rows[index] = {};
                    }
                    sheet.rows[index][sheet.header[e.gs$cell.col - 1].text] = e.content.$t;
                }
            });
        });
    }

    function getSheet(spreadsheetKey, sheetIndex, onSuccess) {
        return $.ajax({
            url: "https://spreadsheets.google.com/feeds/cells/" + spreadsheetKey + "/" + sheetIndex + "/public/values?alt=json-in-script",
            jsonp: "callback",
            dataType: "jsonp",
            success: onSuccess
        });
    }

    function getSheetCount(spreadsheetKey, onSuccess) {
        $.ajax({
            url: "https://spreadsheets.google.com/feeds/worksheets/" + spreadsheetKey + "/public/full?alt=json-in-script",
            jsonp: "callback",
            dataType: "jsonp",
            success: function(response) {
                onSuccess(response.feed.entry.length);
            }
        });
    }
}
},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2Jpbi9ub2RlLXY1LjAuMC1saW51eC14NjQvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwic3JjL2Qzc2hlZXQuanMiLCJzcmMvZm9yY2UuanMiLCJzcmMvZ3JhcGguanMiLCJzcmMvbW9kZWwuanMiLCJzcmMvc3ByZWFkc2hlZXQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RUE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiIWZ1bmN0aW9uKCkge1xuICAgIGNoZWNrUmVxdWlyZW1lbnRzKCk7XG5cbiAgICB2YXIgZDNzaGVldCA9IHtcbiAgICAgICAgdmVyOiBcIjEuMC4wXCIsXG4gICAgICAgIGRiOiB7fSxcbiAgICAgICAgbW9kZWw6IHt9LFxuICAgICAgICBub2RlczogW11cbiAgICB9O1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBkM3NoZWV0O1xuXG4gICAgLyoqXG4gICAgKiBJbml0aWFsaXplIEQzIHNoZWV0LlxuICAgICogQHBhcmFtIHtzdHJpbmd9IGNvbnRhaW5lcklkIC0gaWRlbnRpZmllciBvZiB0aGUgbWFpbiBESVYuXG4gICAgKiovXG4gICAgZDNzaGVldC5pbml0ID0gZnVuY3Rpb24oc3ZnQ29udGFpbmVySWQsIGluZm9Db250YWluZXJJZCkge1xuICAgICAgICBpZiAoc3ZnQ29udGFpbmVySWQgPT0gbnVsbClcbiAgICAgICAgICAgIHN2Z0NvbnRhaW5lcklkID0gXCJkM3NoZWV0LXN2Z1wiO1xuICAgICAgICBkM3NoZWV0LnN2Z0NvbnRhaW5lcklkID0gc3ZnQ29udGFpbmVySWQ7XG5cbiAgICAgICAgaWYgKGluZm9Db250YWluZXJJZCA9PSBudWxsKVxuICAgICAgICAgICAgaW5mb0NvbnRhaW5lcklkID0gXCJkM3NoZWV0LWluZm9cIjtcbiAgICAgICAgZDNzaGVldC5pbmZvQ29udGFpbmVySWQgPSBpbmZvQ29udGFpbmVySWQ7XG5cbiAgICAgICAgdmFyICRzdmdDb250YWluZXJJZCA9ICQoXCIjXCIgKyBzdmdDb250YWluZXJJZCksXG4gICAgICAgICAgICB3aWR0aCA9ICRzdmdDb250YWluZXJJZC53aWR0aCgpLFxuICAgICAgICAgICAgaGVpZ2h0ID0gJHN2Z0NvbnRhaW5lcklkLmhlaWdodCgpO1xuXG4gICAgICAgIC8vIENyZWF0ZSBTVkcgZWxlbWVudFxuICAgICAgICBkMy5zZWxlY3QoXCIjXCIgKyBzdmdDb250YWluZXJJZClcbiAgICAgICAgICAgIC5hcHBlbmQoXCJzdmdcIilcbiAgICAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgXCIxMDAlXCIpXG4gICAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCBcIjEwMCVcIilcbiAgICAgICAgICAgIC5hdHRyKCd2aWV3Qm94JywgXCIwIDAgXCIgKyB3aWR0aCArIFwiIFwiICsgaGVpZ2h0KTtcblxuICAgICAgICAvLyBDcmVhdGUgaW5mbyBwYW5lbFxuICAgICAgICBkMy5zZWxlY3QoXCIjXCIgKyBpbmZvQ29udGFpbmVySWQpXG4gICAgICAgICAgICAuYXBwZW5kKFwiZGl2XCIpO1xuXG4gICAgICAgIHJldHVybiBkM3NoZWV0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICogTG9hZCBkYXRhIGZyb20gc3ByZWFkc2hlZXQuXG4gICAgKiovXG4gICAgZDNzaGVldC5sb2FkID0gZnVuY3Rpb24oc3ByZWFkc2hlZXRLZXkpIHtcbiAgICAgICAgLy8gTG9hZCBzcHJlYWRzaGVldFxuICAgICAgICB2YXIgc3ByZWFkc2hlZXQgPSByZXF1aXJlKFwiLi9zcHJlYWRzaGVldFwiKTtcbiAgICAgICAgc3ByZWFkc2hlZXQoc3ByZWFkc2hlZXRLZXksIGZ1bmN0aW9uKHNwcmVhZHNoZWV0RGF0YSkge1xuICAgICAgICAgICAgZDNzaGVldC5kYiA9IHNwcmVhZHNoZWV0RGF0YTtcblxuICAgICAgICAgICAgLy8gQ3JlYXRlIG1vZGVsIGZyb20gREJcbiAgICAgICAgICAgIHZhciBtb2RlbCA9IHJlcXVpcmUoXCIuL21vZGVsXCIpO1xuICAgICAgICAgICAgZDNzaGVldC5tb2RlbCA9IG1vZGVsKGQzc2hlZXQuZGIpO1xuXG4gICAgICAgICAgICAvLyBDcmVhdGUgZ3JhcGggZnJvbSBtb2RlbFxuICAgICAgICAgICAgdmFyIGdyYXBoID0gcmVxdWlyZShcIi4vZ3JhcGhcIik7XG4gICAgICAgICAgICBkM3NoZWV0LmdyYXBoID0gZ3JhcGgobW9kZWwpO1xuXG4gICAgICAgICAgICAvLyBDcmVhdGUgRDMgZm9yY2UgbGF5b3V0IGZyb20gZ3JhcGhcbiAgICAgICAgICAgIHZhciBmb3JjZSA9IHJlcXVpcmUoXCIuL2ZvcmNlXCIpO1xuICAgICAgICAgICAgZm9yY2UoZ3JhcGgpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjaGVja1JlcXVpcmVtZW50cygpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBkMyA9PT0gXCJ1bmRlZmluZWRcIilcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkQzIGxpYnJhcnkgbm90IGZvdW5kIVwiKTtcbiAgICAgICAgaWYgKHR5cGVvZiAkID09PSBcInVuZGVmaW5lZFwiKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwialF1ZXJ5IG5vdCBmb3VuZCFcIik7XG4gICAgfVxufSgpOyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZ3JhcGgpIHtcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgdmFyIGdyYXBoID0ge1xuICAgICAgICBub2RlczogW10sXG4gICAgICAgIGxpbmtzOiBbXVxuICAgIH1cblxuICAgIHJldHVybiBncmFwaDtcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNwcmVhZHNoZWV0KSB7XG4gICAgdmFyIG1vZGVsID0ge1xuICAgICAgICBncmFwaDoge30sXG4gICAgICAgIHNldHRpbmdzOiB7fVxuICAgIH07XG5cbiAgICB2YXIgc2hlZXRUeXBlcyA9IGdldFNoZWV0VHlwZXMoc3ByZWFkc2hlZXQpO1xuICAgIG1vZGVsLmdyYXBoID0gZ2V0R3JhcGgoc3ByZWFkc2hlZXQsIHNoZWV0VHlwZXMubm9kZXNTaGVldE5hbWVzKTtcbiAgICBpZiAoc2hlZXRUeXBlcy5zZXR0aW5nc1NoZWV0TmFtZSAhPSBudWxsKVxuICAgICAgICBtb2RlbC5zZXR0aW5ncyA9IHNwcmVhZHNoZWV0W3NoZWV0VHlwZXMuc2V0dGluZ3NTaGVldE5hbWVdO1xuXG4gICAgY29uc29sZS5sb2cobW9kZWwpO1xuXG4gICAgZnVuY3Rpb24gZ2V0R3JhcGgoc3ByZWFkc2hlZXQsIG5vZGVzU2hlZXROYW1lcykge1xuICAgICAgICB2YXIgZ3JhcGggPSB7fTtcbiAgICAgICAgJC5lYWNoKG5vZGVzU2hlZXROYW1lcywgZnVuY3Rpb24oaSwgbm9kZXNTaGVldE5hbWUpIHtcbiAgICAgICAgICAgIGdyYXBoW25vZGVzU2hlZXROYW1lXSA9IGdldE5vZGVzKHNwcmVhZHNoZWV0W25vZGVzU2hlZXROYW1lXSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGZ1bmN0aW9uIGdldE5vZGVzKG5vZGVTaGVldCkge1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHtcbiAgICAgICAgICAgICAgICBsYWJlbDogbm9kZVNoZWV0LmhlYWRlclswXS50ZXh0LFxuICAgICAgICAgICAgICAgIG5vZGVzOiBbXVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICQuZWFjaChub2RlU2hlZXQucm93cywgZnVuY3Rpb24oaSwgcm93KSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0Lm5vZGVzLnB1c2goZ2V0Tm9kZVByb3BlcnRpZXMocm93KSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBnZXROb2RlUHJvcGVydGllcyhyb3cpIHtcbiAgICAgICAgICAgIHZhciBub2RlUHJvcGVydGllcyA9IHt9O1xuICAgICAgICAgICAgdmFyIGNvbE5hbWVzID0gT2JqZWN0LmtleXMocm93KTtcbiAgICAgICAgICAgICQuZWFjaChjb2xOYW1lcywgZnVuY3Rpb24oaSwgY29sTmFtZSkge1xuICAgICAgICAgICAgICAgIGlmIChjb2xOYW1lLmluZGV4T2YoXCIuXCIpID09IC0xKVxuICAgICAgICAgICAgICAgICAgICBub2RlUHJvcGVydGllc1tjb2xOYW1lXSA9IHJvd1tjb2xOYW1lXTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIG5vZGVQcm9wZXJ0aWVzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGdyYXBoO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFNoZWV0VHlwZXMoc3ByZWFkc2hlZXQpIHtcbiAgICAgICAgdmFyIHNoZWV0VHlwZXMgPSB7XG4gICAgICAgICAgICBub2Rlc1NoZWV0TmFtZXM6IFtdLFxuICAgICAgICAgICAgbGlua1NoZWV0TmFtZXM6IFtdLFxuICAgICAgICAgICAgc2V0dGluZ3NTaGVldE5hbWU6IG51bGxcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHNoZWV0TmFtZXMgPSBPYmplY3Qua2V5cyhzcHJlYWRzaGVldCk7XG4gICAgICAgICQuZWFjaChzaGVldE5hbWVzLCBmdW5jdGlvbihpLCBzaGVldE5hbWUpIHtcbiAgICAgICAgICAgIGlmIChzaGVldE5hbWUgPT0gXCJzZXR0aW5nc1wiKSB7XG4gICAgICAgICAgICAgICAgc2hlZXRUeXBlcy5zZXR0aW5nc1NoZWV0TmFtZSA9IHNoZWV0TmFtZTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzaGVldE5hbWUuc2xpY2UoMCwgMSkgPT0gXCIjXCIpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgICAgICB2YXIgbGlua1NoZWV0ID0gcGFyc2VMaW5rU2hlZXROYW1lKHNoZWV0TmFtZSlcbiAgICAgICAgICAgIGlmICgobGlua1NoZWV0ICE9IG51bGwpICYmXG4gICAgICAgICAgICAgICAgKHNoZWV0TmFtZXMuaW5kZXhPZihsaW5rU2hlZXQuc291cmNlKSA+IC0xKSAmJlxuICAgICAgICAgICAgICAgIChzaGVldE5hbWVzLmluZGV4T2YobGlua1NoZWV0LnRhcmdldCkgPiAtMSkpIHtcbiAgICAgICAgICAgICAgICBzaGVldFR5cGVzLmxpbmtTaGVldE5hbWVzLnB1c2goc2hlZXROYW1lKVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2hlZXRUeXBlcy5ub2Rlc1NoZWV0TmFtZXMucHVzaChzaGVldE5hbWUpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gc2hlZXRUeXBlcztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZUxpbmtTaGVldE5hbWUoc2hlZXROYW1lKSB7XG4gICAgICAgIHZhciBub2RlTmFtZXMgPSBzaGVldE5hbWUuc3BsaXQoXCItXCIpO1xuICAgICAgICBpZiAobm9kZU5hbWVzLmxlbmd0aCA9PSAyKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHNvdXJjZTogbm9kZU5hbWVzWzBdLFxuICAgICAgICAgICAgICAgIHRhcmdldDogbm9kZU5hbWVzWzFdXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIG1vZGVsO1xufSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc3ByZWFkc2hlZXRLZXksIG9uTG9hZGVkKSB7XG4gICAgLy8gR2V0IHNoZWV0IGNvdW50XG4gICAgZ2V0U2hlZXRDb3VudChzcHJlYWRzaGVldEtleSwgZnVuY3Rpb24gb25TdWNjZXNzKHNoZWV0Q291bnQpIHtcbiAgICAgICAgLy8gTG9hZCBhbGwgc2hlZXRzXG4gICAgICAgIGxvYWRTaGVldHMoc3ByZWFkc2hlZXRLZXksIHNoZWV0Q291bnQpO1xuICAgIH0pO1xuXG4gICAgZnVuY3Rpb24gbG9hZFNoZWV0cyhzcHJlYWRzaGVldEtleSwgc2hlZXRDb3VudCkge1xuICAgICAgICB2YXIgc3ByZWFkc2hlZXQgPSB7fTtcbiAgICAgICAgdmFyIGxvYWRlZFNoZWV0Q291bnQgPSAwO1xuICAgICAgICBmb3IgKGkgPSAxOyBpIDw9IHNoZWV0Q291bnQ7IGkrKykge1xuICAgICAgICAgICAgbG9hZFNoZWV0KHNwcmVhZHNoZWV0LCBzcHJlYWRzaGVldEtleSwgaSkudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBsb2FkZWRTaGVldENvdW50ICs9IDE7XG4gICAgICAgICAgICAgICAgaWYgKGxvYWRlZFNoZWV0Q291bnQgPT0gc2hlZXRDb3VudCkge1xuICAgICAgICAgICAgICAgICAgICBvbkxvYWRlZChzcHJlYWRzaGVldCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxvYWRTaGVldChzcHJlYWRzaGVldCwgc3ByZWFkc2hlZXRLZXksIHNoZWV0SW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIGdldFNoZWV0KHNwcmVhZHNoZWV0S2V5LCBzaGVldEluZGV4LCBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgdmFyIHNoZWV0ID0gc3ByZWFkc2hlZXRbcmVzcG9uc2UuZmVlZC50aXRsZS4kdF0gPSB7XG4gICAgICAgICAgICAgICAgaGVhZGVyOiBbXSxcbiAgICAgICAgICAgICAgICByb3dzOiBbXSxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICQuZWFjaChyZXNwb25zZS5mZWVkLmVudHJ5LCBmdW5jdGlvbihpLCBlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGUuZ3MkY2VsbC5yb3cgPT0gMSkge1xuICAgICAgICAgICAgICAgICAgICBzaGVldC5oZWFkZXJbZS5ncyRjZWxsLmNvbCAtIDFdID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogZS5jb250ZW50LiR0XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSBlLmdzJGNlbGwucm93IC0gMjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNoZWV0LnJvd3NbaW5kZXhdID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNoZWV0LnJvd3NbaW5kZXhdID0ge307XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc2hlZXQucm93c1tpbmRleF1bc2hlZXQuaGVhZGVyW2UuZ3MkY2VsbC5jb2wgLSAxXS50ZXh0XSA9IGUuY29udGVudC4kdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0U2hlZXQoc3ByZWFkc2hlZXRLZXksIHNoZWV0SW5kZXgsIG9uU3VjY2Vzcykge1xuICAgICAgICByZXR1cm4gJC5hamF4KHtcbiAgICAgICAgICAgIHVybDogXCJodHRwczovL3NwcmVhZHNoZWV0cy5nb29nbGUuY29tL2ZlZWRzL2NlbGxzL1wiICsgc3ByZWFkc2hlZXRLZXkgKyBcIi9cIiArIHNoZWV0SW5kZXggKyBcIi9wdWJsaWMvdmFsdWVzP2FsdD1qc29uLWluLXNjcmlwdFwiLFxuICAgICAgICAgICAganNvbnA6IFwiY2FsbGJhY2tcIixcbiAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25wXCIsXG4gICAgICAgICAgICBzdWNjZXNzOiBvblN1Y2Nlc3NcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0U2hlZXRDb3VudChzcHJlYWRzaGVldEtleSwgb25TdWNjZXNzKSB7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmw6IFwiaHR0cHM6Ly9zcHJlYWRzaGVldHMuZ29vZ2xlLmNvbS9mZWVkcy93b3Jrc2hlZXRzL1wiICsgc3ByZWFkc2hlZXRLZXkgKyBcIi9wdWJsaWMvZnVsbD9hbHQ9anNvbi1pbi1zY3JpcHRcIixcbiAgICAgICAgICAgIGpzb25wOiBcImNhbGxiYWNrXCIsXG4gICAgICAgICAgICBkYXRhVHlwZTogXCJqc29ucFwiLFxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBvblN1Y2Nlc3MocmVzcG9uc2UuZmVlZC5lbnRyeS5sZW5ndGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59Il19
