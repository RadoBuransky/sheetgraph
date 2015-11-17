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

    function getGraph(spreadsheet, nodeSheetNames) {
        // Create nodes with properties
        var graph = {};
        $.each(nodeSheetNames, function(i, nodeSheetName) {
            graph[nodeSheetName] = getNodes(spreadsheet[nodeSheetName]);
        });

        // Create links from node sheets
        $.each(nodeSheetNames, function(i, nodeSheetName) {
            createLinks(graph, spreadsheet[nodeSheetName], nodeSheetName);
        });

        // TODO: Create links from link sheets

        function createLinks(graph, nodeSheet, nodeSheetName) {
            var source = graph[nodeSheetName];

            // For all sheet rows
            $.each(nodeSheet.rows, function(i, row) {
                // For all sheet columns
                var colNames = Object.keys(row);
                $.each(colNames, function(j, colName) {
                    // If this is a link column
                    var linkTarget = parseColumnLinkName(colName, graph);
                    if (linkTarget != null) {
                        // Find index of the target node
                        $.each(graph[linkTarget.sheetName].nodes, function(k, targetNode) {
                            // If target node property value matches
                            if (row[colName].indexOf(targetNode[linkTarget.propertyName]) > -1) {
                                if (source.nodes[i][linkTarget.sheetName] == null)
                                    source.nodes[i][linkTarget.sheetName] = [];

                                // Add index of the target node to the source node
                                source.nodes[i][linkTarget.sheetName].push(k);
                            }
                        });
                    }
                });
            });
        }

        function getNodes(nodeSheet) {
            var result = {
                label: nodeSheet.header[0],
                propertyNames: [],
                linkNames: [],
                nodes: []
            };

            // Get nodes and properties
            $.each(nodeSheet.rows, function(i, row) {
                result.nodes.push(getNodeProperties(row));
            });

            // Get property names and link names
            $.each(nodeSheet.header, function(i, propertyName) {
                var linkTarget = parseColumnLinkName(propertyName, graph);
                if (linkTarget == null)
                    result.propertyNames.push(propertyName);
                else
                    result.linkNames.push(linkTarget.sheetName);
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

    function parseColumnLinkName(colName, graph) {
        var linkNames = colName.split(".");
        if ((linkNames.length == 2) &&
            (graph[linkNames[0]] != null) &&
            (graph[linkNames[0]].propertyNames.indexOf(linkNames[1]) > -1)) {
            return {
                sheetName: linkNames[0],
                propertyName: linkNames[1]
            }
        }

        return null;
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
                    sheet.header[e.gs$cell.col - 1] = e.content.$t;
                }
                else {
                    var index = e.gs$cell.row - 2;
                    if (sheet.rows[index] == null) {
                        sheet.rows[index] = {};
                    }
                    sheet.rows[index][sheet.header[e.gs$cell.col - 1]] = e.content.$t;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2Jpbi9ub2RlLXY1LjAuMC1saW51eC14NjQvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwic3JjL2Qzc2hlZXQuanMiLCJzcmMvZm9yY2UuanMiLCJzcmMvZ3JhcGguanMiLCJzcmMvbW9kZWwuanMiLCJzcmMvc3ByZWFkc2hlZXQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RUE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIhZnVuY3Rpb24oKSB7XG4gICAgY2hlY2tSZXF1aXJlbWVudHMoKTtcblxuICAgIHZhciBkM3NoZWV0ID0ge1xuICAgICAgICB2ZXI6IFwiMS4wLjBcIixcbiAgICAgICAgZGI6IHt9LFxuICAgICAgICBtb2RlbDoge30sXG4gICAgICAgIG5vZGVzOiBbXVxuICAgIH07XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IGQzc2hlZXQ7XG5cbiAgICAvKipcbiAgICAqIEluaXRpYWxpemUgRDMgc2hlZXQuXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gY29udGFpbmVySWQgLSBpZGVudGlmaWVyIG9mIHRoZSBtYWluIERJVi5cbiAgICAqKi9cbiAgICBkM3NoZWV0LmluaXQgPSBmdW5jdGlvbihzdmdDb250YWluZXJJZCwgaW5mb0NvbnRhaW5lcklkKSB7XG4gICAgICAgIGlmIChzdmdDb250YWluZXJJZCA9PSBudWxsKVxuICAgICAgICAgICAgc3ZnQ29udGFpbmVySWQgPSBcImQzc2hlZXQtc3ZnXCI7XG4gICAgICAgIGQzc2hlZXQuc3ZnQ29udGFpbmVySWQgPSBzdmdDb250YWluZXJJZDtcblxuICAgICAgICBpZiAoaW5mb0NvbnRhaW5lcklkID09IG51bGwpXG4gICAgICAgICAgICBpbmZvQ29udGFpbmVySWQgPSBcImQzc2hlZXQtaW5mb1wiO1xuICAgICAgICBkM3NoZWV0LmluZm9Db250YWluZXJJZCA9IGluZm9Db250YWluZXJJZDtcblxuICAgICAgICB2YXIgJHN2Z0NvbnRhaW5lcklkID0gJChcIiNcIiArIHN2Z0NvbnRhaW5lcklkKSxcbiAgICAgICAgICAgIHdpZHRoID0gJHN2Z0NvbnRhaW5lcklkLndpZHRoKCksXG4gICAgICAgICAgICBoZWlnaHQgPSAkc3ZnQ29udGFpbmVySWQuaGVpZ2h0KCk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIFNWRyBlbGVtZW50XG4gICAgICAgIGQzLnNlbGVjdChcIiNcIiArIHN2Z0NvbnRhaW5lcklkKVxuICAgICAgICAgICAgLmFwcGVuZChcInN2Z1wiKVxuICAgICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCBcIjEwMCVcIilcbiAgICAgICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIFwiMTAwJVwiKVxuICAgICAgICAgICAgLmF0dHIoJ3ZpZXdCb3gnLCBcIjAgMCBcIiArIHdpZHRoICsgXCIgXCIgKyBoZWlnaHQpO1xuXG4gICAgICAgIC8vIENyZWF0ZSBpbmZvIHBhbmVsXG4gICAgICAgIGQzLnNlbGVjdChcIiNcIiArIGluZm9Db250YWluZXJJZClcbiAgICAgICAgICAgIC5hcHBlbmQoXCJkaXZcIik7XG5cbiAgICAgICAgcmV0dXJuIGQzc2hlZXQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBMb2FkIGRhdGEgZnJvbSBzcHJlYWRzaGVldC5cbiAgICAqKi9cbiAgICBkM3NoZWV0LmxvYWQgPSBmdW5jdGlvbihzcHJlYWRzaGVldEtleSkge1xuICAgICAgICAvLyBMb2FkIHNwcmVhZHNoZWV0XG4gICAgICAgIHZhciBzcHJlYWRzaGVldCA9IHJlcXVpcmUoXCIuL3NwcmVhZHNoZWV0XCIpO1xuICAgICAgICBzcHJlYWRzaGVldChzcHJlYWRzaGVldEtleSwgZnVuY3Rpb24oc3ByZWFkc2hlZXREYXRhKSB7XG4gICAgICAgICAgICBkM3NoZWV0LmRiID0gc3ByZWFkc2hlZXREYXRhO1xuXG4gICAgICAgICAgICAvLyBDcmVhdGUgbW9kZWwgZnJvbSBEQlxuICAgICAgICAgICAgdmFyIG1vZGVsID0gcmVxdWlyZShcIi4vbW9kZWxcIik7XG4gICAgICAgICAgICBkM3NoZWV0Lm1vZGVsID0gbW9kZWwoZDNzaGVldC5kYik7XG5cbiAgICAgICAgICAgIC8vIENyZWF0ZSBncmFwaCBmcm9tIG1vZGVsXG4gICAgICAgICAgICB2YXIgZ3JhcGggPSByZXF1aXJlKFwiLi9ncmFwaFwiKTtcbiAgICAgICAgICAgIGQzc2hlZXQuZ3JhcGggPSBncmFwaChtb2RlbCk7XG5cbiAgICAgICAgICAgIC8vIENyZWF0ZSBEMyBmb3JjZSBsYXlvdXQgZnJvbSBncmFwaFxuICAgICAgICAgICAgdmFyIGZvcmNlID0gcmVxdWlyZShcIi4vZm9yY2VcIik7XG4gICAgICAgICAgICBmb3JjZShncmFwaCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNoZWNrUmVxdWlyZW1lbnRzKCkge1xuICAgICAgICBpZiAodHlwZW9mIGQzID09PSBcInVuZGVmaW5lZFwiKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRDMgbGlicmFyeSBub3QgZm91bmQhXCIpO1xuICAgICAgICBpZiAodHlwZW9mICQgPT09IFwidW5kZWZpbmVkXCIpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJqUXVlcnkgbm90IGZvdW5kIVwiKTtcbiAgICB9XG59KCk7IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihncmFwaCkge1xufSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24obW9kZWwpIHtcbiAgICB2YXIgZ3JhcGggPSB7XG4gICAgICAgIG5vZGVzOiBbXSxcbiAgICAgICAgbGlua3M6IFtdXG4gICAgfVxuXG4gICAgcmV0dXJuIGdyYXBoO1xufSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc3ByZWFkc2hlZXQpIHtcbiAgICB2YXIgbW9kZWwgPSB7XG4gICAgICAgIGdyYXBoOiB7fSxcbiAgICAgICAgc2V0dGluZ3M6IHt9XG4gICAgfTtcblxuICAgIHZhciBzaGVldFR5cGVzID0gZ2V0U2hlZXRUeXBlcyhzcHJlYWRzaGVldCk7XG4gICAgbW9kZWwuZ3JhcGggPSBnZXRHcmFwaChzcHJlYWRzaGVldCwgc2hlZXRUeXBlcy5ub2Rlc1NoZWV0TmFtZXMpO1xuICAgIGlmIChzaGVldFR5cGVzLnNldHRpbmdzU2hlZXROYW1lICE9IG51bGwpXG4gICAgICAgIG1vZGVsLnNldHRpbmdzID0gc3ByZWFkc2hlZXRbc2hlZXRUeXBlcy5zZXR0aW5nc1NoZWV0TmFtZV07XG5cbiAgICBjb25zb2xlLmxvZyhtb2RlbCk7XG5cbiAgICBmdW5jdGlvbiBnZXRHcmFwaChzcHJlYWRzaGVldCwgbm9kZVNoZWV0TmFtZXMpIHtcbiAgICAgICAgLy8gQ3JlYXRlIG5vZGVzIHdpdGggcHJvcGVydGllc1xuICAgICAgICB2YXIgZ3JhcGggPSB7fTtcbiAgICAgICAgJC5lYWNoKG5vZGVTaGVldE5hbWVzLCBmdW5jdGlvbihpLCBub2RlU2hlZXROYW1lKSB7XG4gICAgICAgICAgICBncmFwaFtub2RlU2hlZXROYW1lXSA9IGdldE5vZGVzKHNwcmVhZHNoZWV0W25vZGVTaGVldE5hbWVdKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIGxpbmtzIGZyb20gbm9kZSBzaGVldHNcbiAgICAgICAgJC5lYWNoKG5vZGVTaGVldE5hbWVzLCBmdW5jdGlvbihpLCBub2RlU2hlZXROYW1lKSB7XG4gICAgICAgICAgICBjcmVhdGVMaW5rcyhncmFwaCwgc3ByZWFkc2hlZXRbbm9kZVNoZWV0TmFtZV0sIG5vZGVTaGVldE5hbWUpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBUT0RPOiBDcmVhdGUgbGlua3MgZnJvbSBsaW5rIHNoZWV0c1xuXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZUxpbmtzKGdyYXBoLCBub2RlU2hlZXQsIG5vZGVTaGVldE5hbWUpIHtcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBncmFwaFtub2RlU2hlZXROYW1lXTtcblxuICAgICAgICAgICAgLy8gRm9yIGFsbCBzaGVldCByb3dzXG4gICAgICAgICAgICAkLmVhY2gobm9kZVNoZWV0LnJvd3MsIGZ1bmN0aW9uKGksIHJvdykge1xuICAgICAgICAgICAgICAgIC8vIEZvciBhbGwgc2hlZXQgY29sdW1uc1xuICAgICAgICAgICAgICAgIHZhciBjb2xOYW1lcyA9IE9iamVjdC5rZXlzKHJvdyk7XG4gICAgICAgICAgICAgICAgJC5lYWNoKGNvbE5hbWVzLCBmdW5jdGlvbihqLCBjb2xOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHRoaXMgaXMgYSBsaW5rIGNvbHVtblxuICAgICAgICAgICAgICAgICAgICB2YXIgbGlua1RhcmdldCA9IHBhcnNlQ29sdW1uTGlua05hbWUoY29sTmFtZSwgZ3JhcGgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobGlua1RhcmdldCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGaW5kIGluZGV4IG9mIHRoZSB0YXJnZXQgbm9kZVxuICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKGdyYXBoW2xpbmtUYXJnZXQuc2hlZXROYW1lXS5ub2RlcywgZnVuY3Rpb24oaywgdGFyZ2V0Tm9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHRhcmdldCBub2RlIHByb3BlcnR5IHZhbHVlIG1hdGNoZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocm93W2NvbE5hbWVdLmluZGV4T2YodGFyZ2V0Tm9kZVtsaW5rVGFyZ2V0LnByb3BlcnR5TmFtZV0pID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNvdXJjZS5ub2Rlc1tpXVtsaW5rVGFyZ2V0LnNoZWV0TmFtZV0gPT0gbnVsbClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZS5ub2Rlc1tpXVtsaW5rVGFyZ2V0LnNoZWV0TmFtZV0gPSBbXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBZGQgaW5kZXggb2YgdGhlIHRhcmdldCBub2RlIHRvIHRoZSBzb3VyY2Ugbm9kZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2Uubm9kZXNbaV1bbGlua1RhcmdldC5zaGVldE5hbWVdLnB1c2goayk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZ2V0Tm9kZXMobm9kZVNoZWV0KSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0ge1xuICAgICAgICAgICAgICAgIGxhYmVsOiBub2RlU2hlZXQuaGVhZGVyWzBdLFxuICAgICAgICAgICAgICAgIHByb3BlcnR5TmFtZXM6IFtdLFxuICAgICAgICAgICAgICAgIGxpbmtOYW1lczogW10sXG4gICAgICAgICAgICAgICAgbm9kZXM6IFtdXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvLyBHZXQgbm9kZXMgYW5kIHByb3BlcnRpZXNcbiAgICAgICAgICAgICQuZWFjaChub2RlU2hlZXQucm93cywgZnVuY3Rpb24oaSwgcm93KSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0Lm5vZGVzLnB1c2goZ2V0Tm9kZVByb3BlcnRpZXMocm93KSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gR2V0IHByb3BlcnR5IG5hbWVzIGFuZCBsaW5rIG5hbWVzXG4gICAgICAgICAgICAkLmVhY2gobm9kZVNoZWV0LmhlYWRlciwgZnVuY3Rpb24oaSwgcHJvcGVydHlOYW1lKSB7XG4gICAgICAgICAgICAgICAgdmFyIGxpbmtUYXJnZXQgPSBwYXJzZUNvbHVtbkxpbmtOYW1lKHByb3BlcnR5TmFtZSwgZ3JhcGgpO1xuICAgICAgICAgICAgICAgIGlmIChsaW5rVGFyZ2V0ID09IG51bGwpXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wcm9wZXJ0eU5hbWVzLnB1c2gocHJvcGVydHlOYW1lKTtcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5saW5rTmFtZXMucHVzaChsaW5rVGFyZ2V0LnNoZWV0TmFtZSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGdldE5vZGVQcm9wZXJ0aWVzKHJvdykge1xuICAgICAgICAgICAgdmFyIG5vZGVQcm9wZXJ0aWVzID0ge307XG4gICAgICAgICAgICB2YXIgY29sTmFtZXMgPSBPYmplY3Qua2V5cyhyb3cpO1xuICAgICAgICAgICAgJC5lYWNoKGNvbE5hbWVzLCBmdW5jdGlvbihpLCBjb2xOYW1lKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNvbE5hbWUuaW5kZXhPZihcIi5cIikgPT0gLTEpXG4gICAgICAgICAgICAgICAgICAgIG5vZGVQcm9wZXJ0aWVzW2NvbE5hbWVdID0gcm93W2NvbE5hbWVdO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gbm9kZVByb3BlcnRpZXM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZ3JhcGg7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0U2hlZXRUeXBlcyhzcHJlYWRzaGVldCkge1xuICAgICAgICB2YXIgc2hlZXRUeXBlcyA9IHtcbiAgICAgICAgICAgIG5vZGVzU2hlZXROYW1lczogW10sXG4gICAgICAgICAgICBsaW5rU2hlZXROYW1lczogW10sXG4gICAgICAgICAgICBzZXR0aW5nc1NoZWV0TmFtZTogbnVsbFxuICAgICAgICB9O1xuICAgICAgICB2YXIgc2hlZXROYW1lcyA9IE9iamVjdC5rZXlzKHNwcmVhZHNoZWV0KTtcbiAgICAgICAgJC5lYWNoKHNoZWV0TmFtZXMsIGZ1bmN0aW9uKGksIHNoZWV0TmFtZSkge1xuICAgICAgICAgICAgaWYgKHNoZWV0TmFtZSA9PSBcInNldHRpbmdzXCIpIHtcbiAgICAgICAgICAgICAgICBzaGVldFR5cGVzLnNldHRpbmdzU2hlZXROYW1lID0gc2hlZXROYW1lO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHNoZWV0TmFtZS5zbGljZSgwLCAxKSA9PSBcIiNcIilcbiAgICAgICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgICAgIHZhciBsaW5rU2hlZXQgPSBwYXJzZUxpbmtTaGVldE5hbWUoc2hlZXROYW1lKVxuICAgICAgICAgICAgaWYgKChsaW5rU2hlZXQgIT0gbnVsbCkgJiZcbiAgICAgICAgICAgICAgICAoc2hlZXROYW1lcy5pbmRleE9mKGxpbmtTaGVldC5zb3VyY2UpID4gLTEpICYmXG4gICAgICAgICAgICAgICAgKHNoZWV0TmFtZXMuaW5kZXhPZihsaW5rU2hlZXQudGFyZ2V0KSA+IC0xKSkge1xuICAgICAgICAgICAgICAgIHNoZWV0VHlwZXMubGlua1NoZWV0TmFtZXMucHVzaChzaGVldE5hbWUpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzaGVldFR5cGVzLm5vZGVzU2hlZXROYW1lcy5wdXNoKHNoZWV0TmFtZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBzaGVldFR5cGVzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlQ29sdW1uTGlua05hbWUoY29sTmFtZSwgZ3JhcGgpIHtcbiAgICAgICAgdmFyIGxpbmtOYW1lcyA9IGNvbE5hbWUuc3BsaXQoXCIuXCIpO1xuICAgICAgICBpZiAoKGxpbmtOYW1lcy5sZW5ndGggPT0gMikgJiZcbiAgICAgICAgICAgIChncmFwaFtsaW5rTmFtZXNbMF1dICE9IG51bGwpICYmXG4gICAgICAgICAgICAoZ3JhcGhbbGlua05hbWVzWzBdXS5wcm9wZXJ0eU5hbWVzLmluZGV4T2YobGlua05hbWVzWzFdKSA+IC0xKSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzaGVldE5hbWU6IGxpbmtOYW1lc1swXSxcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eU5hbWU6IGxpbmtOYW1lc1sxXVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VMaW5rU2hlZXROYW1lKHNoZWV0TmFtZSkge1xuICAgICAgICB2YXIgbm9kZU5hbWVzID0gc2hlZXROYW1lLnNwbGl0KFwiLVwiKTtcbiAgICAgICAgaWYgKG5vZGVOYW1lcy5sZW5ndGggPT0gMikge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzb3VyY2U6IG5vZGVOYW1lc1swXSxcbiAgICAgICAgICAgICAgICB0YXJnZXQ6IG5vZGVOYW1lc1sxXVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiBtb2RlbDtcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNwcmVhZHNoZWV0S2V5LCBvbkxvYWRlZCkge1xuICAgIC8vIEdldCBzaGVldCBjb3VudFxuICAgIGdldFNoZWV0Q291bnQoc3ByZWFkc2hlZXRLZXksIGZ1bmN0aW9uIG9uU3VjY2VzcyhzaGVldENvdW50KSB7XG4gICAgICAgIC8vIExvYWQgYWxsIHNoZWV0c1xuICAgICAgICBsb2FkU2hlZXRzKHNwcmVhZHNoZWV0S2V5LCBzaGVldENvdW50KTtcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIGxvYWRTaGVldHMoc3ByZWFkc2hlZXRLZXksIHNoZWV0Q291bnQpIHtcbiAgICAgICAgdmFyIHNwcmVhZHNoZWV0ID0ge307XG4gICAgICAgIHZhciBsb2FkZWRTaGVldENvdW50ID0gMDtcbiAgICAgICAgZm9yIChpID0gMTsgaSA8PSBzaGVldENvdW50OyBpKyspIHtcbiAgICAgICAgICAgIGxvYWRTaGVldChzcHJlYWRzaGVldCwgc3ByZWFkc2hlZXRLZXksIGkpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgbG9hZGVkU2hlZXRDb3VudCArPSAxO1xuICAgICAgICAgICAgICAgIGlmIChsb2FkZWRTaGVldENvdW50ID09IHNoZWV0Q291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgb25Mb2FkZWQoc3ByZWFkc2hlZXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsb2FkU2hlZXQoc3ByZWFkc2hlZXQsIHNwcmVhZHNoZWV0S2V5LCBzaGVldEluZGV4KSB7XG4gICAgICAgIHJldHVybiBnZXRTaGVldChzcHJlYWRzaGVldEtleSwgc2hlZXRJbmRleCwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHZhciBzaGVldCA9IHNwcmVhZHNoZWV0W3Jlc3BvbnNlLmZlZWQudGl0bGUuJHRdID0ge1xuICAgICAgICAgICAgICAgIGhlYWRlcjogW10sXG4gICAgICAgICAgICAgICAgcm93czogW10sXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAkLmVhY2gocmVzcG9uc2UuZmVlZC5lbnRyeSwgZnVuY3Rpb24oaSwgZSkge1xuICAgICAgICAgICAgICAgIGlmIChlLmdzJGNlbGwucm93ID09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgc2hlZXQuaGVhZGVyW2UuZ3MkY2VsbC5jb2wgLSAxXSA9IGUuY29udGVudC4kdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IGUuZ3MkY2VsbC5yb3cgLSAyO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2hlZXQucm93c1tpbmRleF0gPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2hlZXQucm93c1tpbmRleF0gPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzaGVldC5yb3dzW2luZGV4XVtzaGVldC5oZWFkZXJbZS5ncyRjZWxsLmNvbCAtIDFdXSA9IGUuY29udGVudC4kdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0U2hlZXQoc3ByZWFkc2hlZXRLZXksIHNoZWV0SW5kZXgsIG9uU3VjY2Vzcykge1xuICAgICAgICByZXR1cm4gJC5hamF4KHtcbiAgICAgICAgICAgIHVybDogXCJodHRwczovL3NwcmVhZHNoZWV0cy5nb29nbGUuY29tL2ZlZWRzL2NlbGxzL1wiICsgc3ByZWFkc2hlZXRLZXkgKyBcIi9cIiArIHNoZWV0SW5kZXggKyBcIi9wdWJsaWMvdmFsdWVzP2FsdD1qc29uLWluLXNjcmlwdFwiLFxuICAgICAgICAgICAganNvbnA6IFwiY2FsbGJhY2tcIixcbiAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25wXCIsXG4gICAgICAgICAgICBzdWNjZXNzOiBvblN1Y2Nlc3NcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0U2hlZXRDb3VudChzcHJlYWRzaGVldEtleSwgb25TdWNjZXNzKSB7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmw6IFwiaHR0cHM6Ly9zcHJlYWRzaGVldHMuZ29vZ2xlLmNvbS9mZWVkcy93b3Jrc2hlZXRzL1wiICsgc3ByZWFkc2hlZXRLZXkgKyBcIi9wdWJsaWMvZnVsbD9hbHQ9anNvbi1pbi1zY3JpcHRcIixcbiAgICAgICAgICAgIGpzb25wOiBcImNhbGxiYWNrXCIsXG4gICAgICAgICAgICBkYXRhVHlwZTogXCJqc29ucFwiLFxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBvblN1Y2Nlc3MocmVzcG9uc2UuZmVlZC5lbnRyeS5sZW5ndGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59Il19
