(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.d3sheet = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
!function() {
    checkRequirements();

    var d3sheet = {
        ver: "1.0.0",
        svgContainerId: "",
        infoContainerId: "",
        svg: {},
        spreadsheet: {},
        model: {}
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

        var svgContainer = $("#" + svgContainerId),
            width = svgContainer.width(),
            height = svgContainer.height();

        // Create SVG element
        d3sheet.svg = d3.select("#" + svgContainerId)
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
            d3sheet.spreadsheet = spreadsheetData;

            // Create model from spreadsheet
            var model = require("./model");
            d3sheet.model = model(d3sheet.spreadsheet);

            // Create graph from model
            var graph = require("./graph");
            d3sheet.graph = graph(model);

            // Create D3 force layout from graph
            var force = require("./force");
            force(d3sheet.graph, d3sheet.svgContainerId, d3sheet.svg);
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
module.exports = function(graph, svgContainerId, svg) {
    var node = [],
        link = [],
        linkLabel = [];

    var svgContainer = $("#" + svgContainerId),
        width = svgContainer.width(),
        height = svgContainer.height();

    selectAll();

    var force = d3.layout.force()
        .size([width, height])
        .linkDistance(30) // TODO: Move to settings
        .charge(-5000) // TODO: Move to settings
        .gravity(0.5) // TODO: Move to settings
        .nodes(graph.nodes)
        .links(graph.links)
        .on("tick", onTick);

    restart();

    function restart() {
        svg.selectAll(".link")
            .data(graph.links)
            .enter()
            .append("line")
            .attr("class", "link");

//        svg.selectAll(".link-label").data(graph.links)
//            .enter()
//            .append("text")
//            .text(linkText)
//            .attr("class", "link-label")
//            .attr("text-anchor", "middle");

        node = svg.selectAll(".node").data(graph.nodes)
            .enter().append("g")
            .attr("class", "node")
            .attr("x", 0)
            .attr("y", 0)
//            .attr("id", nodeId)
            .call(force.drag);
//            .on("click", function(node) {
//                modelController.showInfo(node, model);
//                view.selectNode(node);
//            });

        var circle = node.append("circle")
            .attr("r", 50); // TODO: Settings

//        node.append("text")
//            .attr("dy", ".35em")
//            .attr("text-anchor", "middle")
//            .text(nodeText);

        selectAll();
        force.start();
    }

    function selectAll() {
        node = svg.selectAll(".node");
        link = svg.selectAll(".link");
        linkLabel = svg.selectAll(".link-label");
    }

    function onTick() {
        link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        linkLabel
            .attr("x", function(d) {
                return (d.source.x + d.target.x)/2; })
            .attr("y", function(d) {
                return (d.source.y + d.target.y)/2; });

        node.attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        });
    }
}
},{}],3:[function(require,module,exports){
module.exports = function(model) {
    var graph = {
        nodes: [],
        links: []
    }

    graph.nodes.push({});

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

        // Create link names
        $.each(nodeSheetNames, function(i, nodeSheetName) {
            createLinkNames(graph, spreadsheet[nodeSheetName], nodeSheetName);
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

        function createLinkNames(graph, nodeSheet, nodeSheetName) {
            var source = graph[nodeSheetName];

            // Get link names
            $.each(nodeSheet.header, function(i, propertyName) {
                var linkTarget = parseColumnLinkName(propertyName, graph);
                if (linkTarget != null)
                    source.linkNames.push(linkTarget.sheetName);
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

            // Get property names
            $.each(nodeSheet.header, function(i, colName) {
                var linkTarget = colName.split(".");
                if (linkTarget.length == 1)
                    result.propertyNames.push(colName);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZDNzaGVldC5qcyIsInNyYy9mb3JjZS5qcyIsInNyYy9ncmFwaC5qcyIsInNyYy9tb2RlbC5qcyIsInNyYy9zcHJlYWRzaGVldC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIhZnVuY3Rpb24oKSB7XHJcbiAgICBjaGVja1JlcXVpcmVtZW50cygpO1xyXG5cclxuICAgIHZhciBkM3NoZWV0ID0ge1xyXG4gICAgICAgIHZlcjogXCIxLjAuMFwiLFxyXG4gICAgICAgIHN2Z0NvbnRhaW5lcklkOiBcIlwiLFxyXG4gICAgICAgIGluZm9Db250YWluZXJJZDogXCJcIixcclxuICAgICAgICBzdmc6IHt9LFxyXG4gICAgICAgIHNwcmVhZHNoZWV0OiB7fSxcclxuICAgICAgICBtb2RlbDoge31cclxuICAgIH07XHJcblxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBkM3NoZWV0O1xyXG5cclxuICAgIC8qKlxyXG4gICAgKiBJbml0aWFsaXplIEQzIHNoZWV0LlxyXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gY29udGFpbmVySWQgLSBpZGVudGlmaWVyIG9mIHRoZSBtYWluIERJVi5cclxuICAgICoqL1xyXG4gICAgZDNzaGVldC5pbml0ID0gZnVuY3Rpb24oc3ZnQ29udGFpbmVySWQsIGluZm9Db250YWluZXJJZCkge1xyXG4gICAgICAgIGlmIChzdmdDb250YWluZXJJZCA9PSBudWxsKVxyXG4gICAgICAgICAgICBzdmdDb250YWluZXJJZCA9IFwiZDNzaGVldC1zdmdcIjtcclxuICAgICAgICBkM3NoZWV0LnN2Z0NvbnRhaW5lcklkID0gc3ZnQ29udGFpbmVySWQ7XHJcblxyXG4gICAgICAgIGlmIChpbmZvQ29udGFpbmVySWQgPT0gbnVsbClcclxuICAgICAgICAgICAgaW5mb0NvbnRhaW5lcklkID0gXCJkM3NoZWV0LWluZm9cIjtcclxuICAgICAgICBkM3NoZWV0LmluZm9Db250YWluZXJJZCA9IGluZm9Db250YWluZXJJZDtcclxuXHJcbiAgICAgICAgdmFyIHN2Z0NvbnRhaW5lciA9ICQoXCIjXCIgKyBzdmdDb250YWluZXJJZCksXHJcbiAgICAgICAgICAgIHdpZHRoID0gc3ZnQ29udGFpbmVyLndpZHRoKCksXHJcbiAgICAgICAgICAgIGhlaWdodCA9IHN2Z0NvbnRhaW5lci5oZWlnaHQoKTtcclxuXHJcbiAgICAgICAgLy8gQ3JlYXRlIFNWRyBlbGVtZW50XHJcbiAgICAgICAgZDNzaGVldC5zdmcgPSBkMy5zZWxlY3QoXCIjXCIgKyBzdmdDb250YWluZXJJZClcclxuICAgICAgICAgICAgLmFwcGVuZChcInN2Z1wiKVxyXG4gICAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIFwiMTAwJVwiKVxyXG4gICAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCBcIjEwMCVcIilcclxuICAgICAgICAgICAgLmF0dHIoJ3ZpZXdCb3gnLCBcIjAgMCBcIiArIHdpZHRoICsgXCIgXCIgKyBoZWlnaHQpO1xyXG5cclxuICAgICAgICAvLyBDcmVhdGUgaW5mbyBwYW5lbFxyXG4gICAgICAgIGQzLnNlbGVjdChcIiNcIiArIGluZm9Db250YWluZXJJZClcclxuICAgICAgICAgICAgLmFwcGVuZChcImRpdlwiKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGQzc2hlZXQ7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAqIExvYWQgZGF0YSBmcm9tIHNwcmVhZHNoZWV0LlxyXG4gICAgKiovXHJcbiAgICBkM3NoZWV0LmxvYWQgPSBmdW5jdGlvbihzcHJlYWRzaGVldEtleSkge1xyXG4gICAgICAgIC8vIExvYWQgc3ByZWFkc2hlZXRcclxuICAgICAgICB2YXIgc3ByZWFkc2hlZXQgPSByZXF1aXJlKFwiLi9zcHJlYWRzaGVldFwiKTtcclxuICAgICAgICBzcHJlYWRzaGVldChzcHJlYWRzaGVldEtleSwgZnVuY3Rpb24oc3ByZWFkc2hlZXREYXRhKSB7XHJcbiAgICAgICAgICAgIGQzc2hlZXQuc3ByZWFkc2hlZXQgPSBzcHJlYWRzaGVldERhdGE7XHJcblxyXG4gICAgICAgICAgICAvLyBDcmVhdGUgbW9kZWwgZnJvbSBzcHJlYWRzaGVldFxyXG4gICAgICAgICAgICB2YXIgbW9kZWwgPSByZXF1aXJlKFwiLi9tb2RlbFwiKTtcclxuICAgICAgICAgICAgZDNzaGVldC5tb2RlbCA9IG1vZGVsKGQzc2hlZXQuc3ByZWFkc2hlZXQpO1xyXG5cclxuICAgICAgICAgICAgLy8gQ3JlYXRlIGdyYXBoIGZyb20gbW9kZWxcclxuICAgICAgICAgICAgdmFyIGdyYXBoID0gcmVxdWlyZShcIi4vZ3JhcGhcIik7XHJcbiAgICAgICAgICAgIGQzc2hlZXQuZ3JhcGggPSBncmFwaChtb2RlbCk7XHJcblxyXG4gICAgICAgICAgICAvLyBDcmVhdGUgRDMgZm9yY2UgbGF5b3V0IGZyb20gZ3JhcGhcclxuICAgICAgICAgICAgdmFyIGZvcmNlID0gcmVxdWlyZShcIi4vZm9yY2VcIik7XHJcbiAgICAgICAgICAgIGZvcmNlKGQzc2hlZXQuZ3JhcGgsIGQzc2hlZXQuc3ZnQ29udGFpbmVySWQsIGQzc2hlZXQuc3ZnKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBjaGVja1JlcXVpcmVtZW50cygpIHtcclxuICAgICAgICBpZiAodHlwZW9mIGQzID09PSBcInVuZGVmaW5lZFwiKVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJEMyBsaWJyYXJ5IG5vdCBmb3VuZCFcIik7XHJcbiAgICAgICAgaWYgKHR5cGVvZiAkID09PSBcInVuZGVmaW5lZFwiKVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJqUXVlcnkgbm90IGZvdW5kIVwiKTtcclxuICAgIH1cclxufSgpOyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZ3JhcGgsIHN2Z0NvbnRhaW5lcklkLCBzdmcpIHtcclxuICAgIHZhciBub2RlID0gW10sXHJcbiAgICAgICAgbGluayA9IFtdLFxyXG4gICAgICAgIGxpbmtMYWJlbCA9IFtdO1xyXG5cclxuICAgIHZhciBzdmdDb250YWluZXIgPSAkKFwiI1wiICsgc3ZnQ29udGFpbmVySWQpLFxyXG4gICAgICAgIHdpZHRoID0gc3ZnQ29udGFpbmVyLndpZHRoKCksXHJcbiAgICAgICAgaGVpZ2h0ID0gc3ZnQ29udGFpbmVyLmhlaWdodCgpO1xyXG5cclxuICAgIHNlbGVjdEFsbCgpO1xyXG5cclxuICAgIHZhciBmb3JjZSA9IGQzLmxheW91dC5mb3JjZSgpXHJcbiAgICAgICAgLnNpemUoW3dpZHRoLCBoZWlnaHRdKVxyXG4gICAgICAgIC5saW5rRGlzdGFuY2UoMzApIC8vIFRPRE86IE1vdmUgdG8gc2V0dGluZ3NcclxuICAgICAgICAuY2hhcmdlKC01MDAwKSAvLyBUT0RPOiBNb3ZlIHRvIHNldHRpbmdzXHJcbiAgICAgICAgLmdyYXZpdHkoMC41KSAvLyBUT0RPOiBNb3ZlIHRvIHNldHRpbmdzXHJcbiAgICAgICAgLm5vZGVzKGdyYXBoLm5vZGVzKVxyXG4gICAgICAgIC5saW5rcyhncmFwaC5saW5rcylcclxuICAgICAgICAub24oXCJ0aWNrXCIsIG9uVGljayk7XHJcblxyXG4gICAgcmVzdGFydCgpO1xyXG5cclxuICAgIGZ1bmN0aW9uIHJlc3RhcnQoKSB7XHJcbiAgICAgICAgc3ZnLnNlbGVjdEFsbChcIi5saW5rXCIpXHJcbiAgICAgICAgICAgIC5kYXRhKGdyYXBoLmxpbmtzKVxyXG4gICAgICAgICAgICAuZW50ZXIoKVxyXG4gICAgICAgICAgICAuYXBwZW5kKFwibGluZVwiKVxyXG4gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibGlua1wiKTtcclxuXHJcbi8vICAgICAgICBzdmcuc2VsZWN0QWxsKFwiLmxpbmstbGFiZWxcIikuZGF0YShncmFwaC5saW5rcylcclxuLy8gICAgICAgICAgICAuZW50ZXIoKVxyXG4vLyAgICAgICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXHJcbi8vICAgICAgICAgICAgLnRleHQobGlua1RleHQpXHJcbi8vICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImxpbmstbGFiZWxcIilcclxuLy8gICAgICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpO1xyXG5cclxuICAgICAgICBub2RlID0gc3ZnLnNlbGVjdEFsbChcIi5ub2RlXCIpLmRhdGEoZ3JhcGgubm9kZXMpXHJcbiAgICAgICAgICAgIC5lbnRlcigpLmFwcGVuZChcImdcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcIm5vZGVcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIDApXHJcbiAgICAgICAgICAgIC5hdHRyKFwieVwiLCAwKVxyXG4vLyAgICAgICAgICAgIC5hdHRyKFwiaWRcIiwgbm9kZUlkKVxyXG4gICAgICAgICAgICAuY2FsbChmb3JjZS5kcmFnKTtcclxuLy8gICAgICAgICAgICAub24oXCJjbGlja1wiLCBmdW5jdGlvbihub2RlKSB7XHJcbi8vICAgICAgICAgICAgICAgIG1vZGVsQ29udHJvbGxlci5zaG93SW5mbyhub2RlLCBtb2RlbCk7XHJcbi8vICAgICAgICAgICAgICAgIHZpZXcuc2VsZWN0Tm9kZShub2RlKTtcclxuLy8gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdmFyIGNpcmNsZSA9IG5vZGUuYXBwZW5kKFwiY2lyY2xlXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwiclwiLCA1MCk7IC8vIFRPRE86IFNldHRpbmdzXHJcblxyXG4vLyAgICAgICAgbm9kZS5hcHBlbmQoXCJ0ZXh0XCIpXHJcbi8vICAgICAgICAgICAgLmF0dHIoXCJkeVwiLCBcIi4zNWVtXCIpXHJcbi8vICAgICAgICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxyXG4vLyAgICAgICAgICAgIC50ZXh0KG5vZGVUZXh0KTtcclxuXHJcbiAgICAgICAgc2VsZWN0QWxsKCk7XHJcbiAgICAgICAgZm9yY2Uuc3RhcnQoKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBzZWxlY3RBbGwoKSB7XHJcbiAgICAgICAgbm9kZSA9IHN2Zy5zZWxlY3RBbGwoXCIubm9kZVwiKTtcclxuICAgICAgICBsaW5rID0gc3ZnLnNlbGVjdEFsbChcIi5saW5rXCIpO1xyXG4gICAgICAgIGxpbmtMYWJlbCA9IHN2Zy5zZWxlY3RBbGwoXCIubGluay1sYWJlbFwiKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBvblRpY2soKSB7XHJcbiAgICAgICAgbGluay5hdHRyKFwieDFcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5zb3VyY2UueDsgfSlcclxuICAgICAgICAgICAgLmF0dHIoXCJ5MVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnNvdXJjZS55OyB9KVxyXG4gICAgICAgICAgICAuYXR0cihcIngyXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGFyZ2V0Lng7IH0pXHJcbiAgICAgICAgICAgIC5hdHRyKFwieTJcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50YXJnZXQueTsgfSk7XHJcblxyXG4gICAgICAgIGxpbmtMYWJlbFxyXG4gICAgICAgICAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIChkLnNvdXJjZS54ICsgZC50YXJnZXQueCkvMjsgfSlcclxuICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAoZC5zb3VyY2UueSArIGQudGFyZ2V0LnkpLzI7IH0pO1xyXG5cclxuICAgICAgICBub2RlLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gXCJ0cmFuc2xhdGUoXCIgKyBkLnggKyBcIixcIiArIGQueSArIFwiKVwiO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihtb2RlbCkge1xyXG4gICAgdmFyIGdyYXBoID0ge1xyXG4gICAgICAgIG5vZGVzOiBbXSxcclxuICAgICAgICBsaW5rczogW11cclxuICAgIH1cclxuXHJcbiAgICBncmFwaC5ub2Rlcy5wdXNoKHt9KTtcclxuXHJcbiAgICByZXR1cm4gZ3JhcGg7XHJcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNwcmVhZHNoZWV0KSB7XHJcbiAgICB2YXIgbW9kZWwgPSB7XHJcbiAgICAgICAgZ3JhcGg6IHt9LFxyXG4gICAgICAgIHNldHRpbmdzOiB7fVxyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgc2hlZXRUeXBlcyA9IGdldFNoZWV0VHlwZXMoc3ByZWFkc2hlZXQpO1xyXG4gICAgbW9kZWwuZ3JhcGggPSBnZXRHcmFwaChzcHJlYWRzaGVldCwgc2hlZXRUeXBlcy5ub2Rlc1NoZWV0TmFtZXMpO1xyXG4gICAgaWYgKHNoZWV0VHlwZXMuc2V0dGluZ3NTaGVldE5hbWUgIT0gbnVsbClcclxuICAgICAgICBtb2RlbC5zZXR0aW5ncyA9IHNwcmVhZHNoZWV0W3NoZWV0VHlwZXMuc2V0dGluZ3NTaGVldE5hbWVdO1xyXG5cclxuICAgIGNvbnNvbGUubG9nKG1vZGVsKTtcclxuXHJcbiAgICBmdW5jdGlvbiBnZXRHcmFwaChzcHJlYWRzaGVldCwgbm9kZVNoZWV0TmFtZXMpIHtcclxuICAgICAgICAvLyBDcmVhdGUgbm9kZXMgd2l0aCBwcm9wZXJ0aWVzXHJcbiAgICAgICAgdmFyIGdyYXBoID0ge307XHJcbiAgICAgICAgJC5lYWNoKG5vZGVTaGVldE5hbWVzLCBmdW5jdGlvbihpLCBub2RlU2hlZXROYW1lKSB7XHJcbiAgICAgICAgICAgIGdyYXBoW25vZGVTaGVldE5hbWVdID0gZ2V0Tm9kZXMoc3ByZWFkc2hlZXRbbm9kZVNoZWV0TmFtZV0pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBDcmVhdGUgbGluayBuYW1lc1xyXG4gICAgICAgICQuZWFjaChub2RlU2hlZXROYW1lcywgZnVuY3Rpb24oaSwgbm9kZVNoZWV0TmFtZSkge1xyXG4gICAgICAgICAgICBjcmVhdGVMaW5rTmFtZXMoZ3JhcGgsIHNwcmVhZHNoZWV0W25vZGVTaGVldE5hbWVdLCBub2RlU2hlZXROYW1lKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gQ3JlYXRlIGxpbmtzIGZyb20gbm9kZSBzaGVldHNcclxuICAgICAgICAkLmVhY2gobm9kZVNoZWV0TmFtZXMsIGZ1bmN0aW9uKGksIG5vZGVTaGVldE5hbWUpIHtcclxuICAgICAgICAgICAgY3JlYXRlTGlua3MoZ3JhcGgsIHNwcmVhZHNoZWV0W25vZGVTaGVldE5hbWVdLCBub2RlU2hlZXROYW1lKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gVE9ETzogQ3JlYXRlIGxpbmtzIGZyb20gbGluayBzaGVldHNcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlTGlua3MoZ3JhcGgsIG5vZGVTaGVldCwgbm9kZVNoZWV0TmFtZSkge1xyXG4gICAgICAgICAgICB2YXIgc291cmNlID0gZ3JhcGhbbm9kZVNoZWV0TmFtZV07XHJcblxyXG4gICAgICAgICAgICAvLyBGb3IgYWxsIHNoZWV0IHJvd3NcclxuICAgICAgICAgICAgJC5lYWNoKG5vZGVTaGVldC5yb3dzLCBmdW5jdGlvbihpLCByb3cpIHtcclxuICAgICAgICAgICAgICAgIC8vIEZvciBhbGwgc2hlZXQgY29sdW1uc1xyXG4gICAgICAgICAgICAgICAgdmFyIGNvbE5hbWVzID0gT2JqZWN0LmtleXMocm93KTtcclxuICAgICAgICAgICAgICAgICQuZWFjaChjb2xOYW1lcywgZnVuY3Rpb24oaiwgY29sTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHRoaXMgaXMgYSBsaW5rIGNvbHVtblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBsaW5rVGFyZ2V0ID0gcGFyc2VDb2x1bW5MaW5rTmFtZShjb2xOYW1lLCBncmFwaCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxpbmtUYXJnZXQgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGaW5kIGluZGV4IG9mIHRoZSB0YXJnZXQgbm9kZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAkLmVhY2goZ3JhcGhbbGlua1RhcmdldC5zaGVldE5hbWVdLm5vZGVzLCBmdW5jdGlvbihrLCB0YXJnZXROb2RlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB0YXJnZXQgbm9kZSBwcm9wZXJ0eSB2YWx1ZSBtYXRjaGVzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocm93W2NvbE5hbWVdLmluZGV4T2YodGFyZ2V0Tm9kZVtsaW5rVGFyZ2V0LnByb3BlcnR5TmFtZV0pID4gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc291cmNlLm5vZGVzW2ldW2xpbmtUYXJnZXQuc2hlZXROYW1lXSA9PSBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2Uubm9kZXNbaV1bbGlua1RhcmdldC5zaGVldE5hbWVdID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFkZCBpbmRleCBvZiB0aGUgdGFyZ2V0IG5vZGUgdG8gdGhlIHNvdXJjZSBub2RlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlLm5vZGVzW2ldW2xpbmtUYXJnZXQuc2hlZXROYW1lXS5wdXNoKGspO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBjcmVhdGVMaW5rTmFtZXMoZ3JhcGgsIG5vZGVTaGVldCwgbm9kZVNoZWV0TmFtZSkge1xyXG4gICAgICAgICAgICB2YXIgc291cmNlID0gZ3JhcGhbbm9kZVNoZWV0TmFtZV07XHJcblxyXG4gICAgICAgICAgICAvLyBHZXQgbGluayBuYW1lc1xyXG4gICAgICAgICAgICAkLmVhY2gobm9kZVNoZWV0LmhlYWRlciwgZnVuY3Rpb24oaSwgcHJvcGVydHlOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbGlua1RhcmdldCA9IHBhcnNlQ29sdW1uTGlua05hbWUocHJvcGVydHlOYW1lLCBncmFwaCk7XHJcbiAgICAgICAgICAgICAgICBpZiAobGlua1RhcmdldCAhPSBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgIHNvdXJjZS5saW5rTmFtZXMucHVzaChsaW5rVGFyZ2V0LnNoZWV0TmFtZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0Tm9kZXMobm9kZVNoZWV0KSB7XHJcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSB7XHJcbiAgICAgICAgICAgICAgICBsYWJlbDogbm9kZVNoZWV0LmhlYWRlclswXSxcclxuICAgICAgICAgICAgICAgIHByb3BlcnR5TmFtZXM6IFtdLFxyXG4gICAgICAgICAgICAgICAgbGlua05hbWVzOiBbXSxcclxuICAgICAgICAgICAgICAgIG5vZGVzOiBbXVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgLy8gR2V0IG5vZGVzIGFuZCBwcm9wZXJ0aWVzXHJcbiAgICAgICAgICAgICQuZWFjaChub2RlU2hlZXQucm93cywgZnVuY3Rpb24oaSwgcm93KSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQubm9kZXMucHVzaChnZXROb2RlUHJvcGVydGllcyhyb3cpKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBHZXQgcHJvcGVydHkgbmFtZXNcclxuICAgICAgICAgICAgJC5lYWNoKG5vZGVTaGVldC5oZWFkZXIsIGZ1bmN0aW9uKGksIGNvbE5hbWUpIHtcclxuICAgICAgICAgICAgICAgIHZhciBsaW5rVGFyZ2V0ID0gY29sTmFtZS5zcGxpdChcIi5cIik7XHJcbiAgICAgICAgICAgICAgICBpZiAobGlua1RhcmdldC5sZW5ndGggPT0gMSlcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHJvcGVydHlOYW1lcy5wdXNoKGNvbE5hbWUpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBnZXROb2RlUHJvcGVydGllcyhyb3cpIHtcclxuICAgICAgICAgICAgdmFyIG5vZGVQcm9wZXJ0aWVzID0ge307XHJcbiAgICAgICAgICAgIHZhciBjb2xOYW1lcyA9IE9iamVjdC5rZXlzKHJvdyk7XHJcbiAgICAgICAgICAgICQuZWFjaChjb2xOYW1lcywgZnVuY3Rpb24oaSwgY29sTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGNvbE5hbWUuaW5kZXhPZihcIi5cIikgPT0gLTEpXHJcbiAgICAgICAgICAgICAgICAgICAgbm9kZVByb3BlcnRpZXNbY29sTmFtZV0gPSByb3dbY29sTmFtZV07XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gbm9kZVByb3BlcnRpZXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZ3JhcGg7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0U2hlZXRUeXBlcyhzcHJlYWRzaGVldCkge1xyXG4gICAgICAgIHZhciBzaGVldFR5cGVzID0ge1xyXG4gICAgICAgICAgICBub2Rlc1NoZWV0TmFtZXM6IFtdLFxyXG4gICAgICAgICAgICBsaW5rU2hlZXROYW1lczogW10sXHJcbiAgICAgICAgICAgIHNldHRpbmdzU2hlZXROYW1lOiBudWxsXHJcbiAgICAgICAgfTtcclxuICAgICAgICB2YXIgc2hlZXROYW1lcyA9IE9iamVjdC5rZXlzKHNwcmVhZHNoZWV0KTtcclxuICAgICAgICAkLmVhY2goc2hlZXROYW1lcywgZnVuY3Rpb24oaSwgc2hlZXROYW1lKSB7XHJcbiAgICAgICAgICAgIGlmIChzaGVldE5hbWUgPT0gXCJzZXR0aW5nc1wiKSB7XHJcbiAgICAgICAgICAgICAgICBzaGVldFR5cGVzLnNldHRpbmdzU2hlZXROYW1lID0gc2hlZXROYW1lO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoc2hlZXROYW1lLnNsaWNlKDAsIDEpID09IFwiI1wiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgdmFyIGxpbmtTaGVldCA9IHBhcnNlTGlua1NoZWV0TmFtZShzaGVldE5hbWUpXHJcbiAgICAgICAgICAgIGlmICgobGlua1NoZWV0ICE9IG51bGwpICYmXHJcbiAgICAgICAgICAgICAgICAoc2hlZXROYW1lcy5pbmRleE9mKGxpbmtTaGVldC5zb3VyY2UpID4gLTEpICYmXHJcbiAgICAgICAgICAgICAgICAoc2hlZXROYW1lcy5pbmRleE9mKGxpbmtTaGVldC50YXJnZXQpID4gLTEpKSB7XHJcbiAgICAgICAgICAgICAgICBzaGVldFR5cGVzLmxpbmtTaGVldE5hbWVzLnB1c2goc2hlZXROYW1lKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBzaGVldFR5cGVzLm5vZGVzU2hlZXROYW1lcy5wdXNoKHNoZWV0TmFtZSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBzaGVldFR5cGVzO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHBhcnNlQ29sdW1uTGlua05hbWUoY29sTmFtZSwgZ3JhcGgpIHtcclxuICAgICAgICB2YXIgbGlua05hbWVzID0gY29sTmFtZS5zcGxpdChcIi5cIik7XHJcbiAgICAgICAgaWYgKChsaW5rTmFtZXMubGVuZ3RoID09IDIpICYmXHJcbiAgICAgICAgICAgIChncmFwaFtsaW5rTmFtZXNbMF1dICE9IG51bGwpICYmXHJcbiAgICAgICAgICAgIChncmFwaFtsaW5rTmFtZXNbMF1dLnByb3BlcnR5TmFtZXMuaW5kZXhPZihsaW5rTmFtZXNbMV0pID4gLTEpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBzaGVldE5hbWU6IGxpbmtOYW1lc1swXSxcclxuICAgICAgICAgICAgICAgIHByb3BlcnR5TmFtZTogbGlua05hbWVzWzFdXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHBhcnNlTGlua1NoZWV0TmFtZShzaGVldE5hbWUpIHtcclxuICAgICAgICB2YXIgbm9kZU5hbWVzID0gc2hlZXROYW1lLnNwbGl0KFwiLVwiKTtcclxuICAgICAgICBpZiAobm9kZU5hbWVzLmxlbmd0aCA9PSAyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBzb3VyY2U6IG5vZGVOYW1lc1swXSxcclxuICAgICAgICAgICAgICAgIHRhcmdldDogbm9kZU5hbWVzWzFdXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbW9kZWw7XHJcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNwcmVhZHNoZWV0S2V5LCBvbkxvYWRlZCkge1xyXG4gICAgLy8gR2V0IHNoZWV0IGNvdW50XHJcbiAgICBnZXRTaGVldENvdW50KHNwcmVhZHNoZWV0S2V5LCBmdW5jdGlvbiBvblN1Y2Nlc3Moc2hlZXRDb3VudCkge1xyXG4gICAgICAgIC8vIExvYWQgYWxsIHNoZWV0c1xyXG4gICAgICAgIGxvYWRTaGVldHMoc3ByZWFkc2hlZXRLZXksIHNoZWV0Q291bnQpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgZnVuY3Rpb24gbG9hZFNoZWV0cyhzcHJlYWRzaGVldEtleSwgc2hlZXRDb3VudCkge1xyXG4gICAgICAgIHZhciBzcHJlYWRzaGVldCA9IHt9O1xyXG4gICAgICAgIHZhciBsb2FkZWRTaGVldENvdW50ID0gMDtcclxuICAgICAgICBmb3IgKGkgPSAxOyBpIDw9IHNoZWV0Q291bnQ7IGkrKykge1xyXG4gICAgICAgICAgICBsb2FkU2hlZXQoc3ByZWFkc2hlZXQsIHNwcmVhZHNoZWV0S2V5LCBpKS50aGVuKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgbG9hZGVkU2hlZXRDb3VudCArPSAxO1xyXG4gICAgICAgICAgICAgICAgaWYgKGxvYWRlZFNoZWV0Q291bnQgPT0gc2hlZXRDb3VudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG9uTG9hZGVkKHNwcmVhZHNoZWV0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbG9hZFNoZWV0KHNwcmVhZHNoZWV0LCBzcHJlYWRzaGVldEtleSwgc2hlZXRJbmRleCkge1xyXG4gICAgICAgIHJldHVybiBnZXRTaGVldChzcHJlYWRzaGVldEtleSwgc2hlZXRJbmRleCwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcclxuICAgICAgICAgICAgdmFyIHNoZWV0ID0gc3ByZWFkc2hlZXRbcmVzcG9uc2UuZmVlZC50aXRsZS4kdF0gPSB7XHJcbiAgICAgICAgICAgICAgICBoZWFkZXI6IFtdLFxyXG4gICAgICAgICAgICAgICAgcm93czogW10sXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAkLmVhY2gocmVzcG9uc2UuZmVlZC5lbnRyeSwgZnVuY3Rpb24oaSwgZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGUuZ3MkY2VsbC5yb3cgPT0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNoZWV0LmhlYWRlcltlLmdzJGNlbGwuY29sIC0gMV0gPSBlLmNvbnRlbnQuJHQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSBlLmdzJGNlbGwucm93IC0gMjtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2hlZXQucm93c1tpbmRleF0gPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzaGVldC5yb3dzW2luZGV4XSA9IHt9O1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBzaGVldC5yb3dzW2luZGV4XVtzaGVldC5oZWFkZXJbZS5ncyRjZWxsLmNvbCAtIDFdXSA9IGUuY29udGVudC4kdDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0U2hlZXQoc3ByZWFkc2hlZXRLZXksIHNoZWV0SW5kZXgsIG9uU3VjY2Vzcykge1xyXG4gICAgICAgIHJldHVybiAkLmFqYXgoe1xyXG4gICAgICAgICAgICB1cmw6IFwiaHR0cHM6Ly9zcHJlYWRzaGVldHMuZ29vZ2xlLmNvbS9mZWVkcy9jZWxscy9cIiArIHNwcmVhZHNoZWV0S2V5ICsgXCIvXCIgKyBzaGVldEluZGV4ICsgXCIvcHVibGljL3ZhbHVlcz9hbHQ9anNvbi1pbi1zY3JpcHRcIixcclxuICAgICAgICAgICAganNvbnA6IFwiY2FsbGJhY2tcIixcclxuICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvbnBcIixcclxuICAgICAgICAgICAgc3VjY2Vzczogb25TdWNjZXNzXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0U2hlZXRDb3VudChzcHJlYWRzaGVldEtleSwgb25TdWNjZXNzKSB7XHJcbiAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgICAgdXJsOiBcImh0dHBzOi8vc3ByZWFkc2hlZXRzLmdvb2dsZS5jb20vZmVlZHMvd29ya3NoZWV0cy9cIiArIHNwcmVhZHNoZWV0S2V5ICsgXCIvcHVibGljL2Z1bGw/YWx0PWpzb24taW4tc2NyaXB0XCIsXHJcbiAgICAgICAgICAgIGpzb25wOiBcImNhbGxiYWNrXCIsXHJcbiAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25wXCIsXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgICAgICAgICBvblN1Y2Nlc3MocmVzcG9uc2UuZmVlZC5lbnRyeS5sZW5ndGgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn0iXX0=
