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
            d3sheet.graph = graph(d3sheet.model);

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
            .attr("r", 30); // TODO: Settings

        node.append("text")
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .text(function(n) { return n.label; });

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
    };

    // For all sheets
    $.each(model.sheets, function(i, sheet) {
        // For all nodes
        $.each(sheet.nodes, function(j, node) {
            // Add node to graph
            node.graphIndex = graph.nodes.push(node) - 1;
            node.label = node[sheet.label];
        });
    });

    // Create links
    $.each(model.sheets, function(i, sheet) {
        // For all nodes
        $.each(sheet.nodes, function(j, node) {
            // For all link names
            $.each(sheet.linkNames, function(k, linkName) {
                // For all target nodes
                $.each(node[linkName], function(l, targetIndex) {
                    var link = {
                        source: node.graphIndex,
                        target: model.sheets[linkName].nodes[targetIndex].graphIndex
                    };
                    graph.links.push(link);
                });
            });
        });
    });

    return graph;
}
},{}],4:[function(require,module,exports){
module.exports = function(spreadsheet) {
    var model = {
        sheets: {},
        settings: {}
    };

    var sheetTypes = getSheetTypes(spreadsheet);
    model.sheets = getGraph(spreadsheet, sheetTypes.nodesSheetNames);
    if (sheetTypes.settingsSheetName != null)
        model.settings = spreadsheet[sheetTypes.settingsSheetName];

    function getGraph(spreadsheet, nodeSheetNames) {
        // Create nodes with properties
        var sheets = {};
        $.each(nodeSheetNames, function(i, nodeSheetName) {
            sheets[nodeSheetName] = getNodes(spreadsheet[nodeSheetName]);
        });

        // Create link names
        $.each(nodeSheetNames, function(i, nodeSheetName) {
            createLinkNames(sheets, spreadsheet[nodeSheetName], nodeSheetName);
        });

        // Create links from node sheets
        $.each(nodeSheetNames, function(i, nodeSheetName) {
            createLinks(sheets, spreadsheet[nodeSheetName], nodeSheetName);
        });

        // TODO: Create links from link sheets

        function createLinks(sheets, nodeSheet, nodeSheetName) {
            var source = sheets[nodeSheetName];

            // For all sheet rows
            $.each(nodeSheet.rows, function(i, row) {
                // For all sheet columns
                var colNames = Object.keys(row);
                $.each(colNames, function(j, colName) {
                    // If this is a link column
                    var linkTarget = parseColumnLinkName(colName, sheets);
                    if (linkTarget != null) {
                        // Find index of the target node
                        $.each(sheets[linkTarget.sheetName].nodes, function(k, targetNode) {
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

        function createLinkNames(sheets, nodeSheet, nodeSheetName) {
            var source = sheets[nodeSheetName];

            // Get link names
            $.each(nodeSheet.header, function(i, propertyName) {
                var linkTarget = parseColumnLinkName(propertyName, sheets);
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

        return sheets;
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

    function parseColumnLinkName(colName, sheets) {
        var linkNames = colName.split(".");
        if ((linkNames.length == 2) &&
            (sheets[linkNames[0]] != null) &&
            (sheets[linkNames[0]].propertyNames.indexOf(linkNames[1]) > -1)) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZDNzaGVldC5qcyIsInNyYy9mb3JjZS5qcyIsInNyYy9ncmFwaC5qcyIsInNyYy9tb2RlbC5qcyIsInNyYy9zcHJlYWRzaGVldC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiIWZ1bmN0aW9uKCkge1xyXG4gICAgY2hlY2tSZXF1aXJlbWVudHMoKTtcclxuXHJcbiAgICB2YXIgZDNzaGVldCA9IHtcclxuICAgICAgICB2ZXI6IFwiMS4wLjBcIixcclxuICAgICAgICBzdmdDb250YWluZXJJZDogXCJcIixcclxuICAgICAgICBpbmZvQ29udGFpbmVySWQ6IFwiXCIsXHJcbiAgICAgICAgc3ZnOiB7fSxcclxuICAgICAgICBzcHJlYWRzaGVldDoge30sXHJcbiAgICAgICAgbW9kZWw6IHt9XHJcbiAgICB9O1xyXG5cclxuICAgIG1vZHVsZS5leHBvcnRzID0gZDNzaGVldDtcclxuXHJcbiAgICAvKipcclxuICAgICogSW5pdGlhbGl6ZSBEMyBzaGVldC5cclxuICAgICogQHBhcmFtIHtzdHJpbmd9IGNvbnRhaW5lcklkIC0gaWRlbnRpZmllciBvZiB0aGUgbWFpbiBESVYuXHJcbiAgICAqKi9cclxuICAgIGQzc2hlZXQuaW5pdCA9IGZ1bmN0aW9uKHN2Z0NvbnRhaW5lcklkLCBpbmZvQ29udGFpbmVySWQpIHtcclxuICAgICAgICBpZiAoc3ZnQ29udGFpbmVySWQgPT0gbnVsbClcclxuICAgICAgICAgICAgc3ZnQ29udGFpbmVySWQgPSBcImQzc2hlZXQtc3ZnXCI7XHJcbiAgICAgICAgZDNzaGVldC5zdmdDb250YWluZXJJZCA9IHN2Z0NvbnRhaW5lcklkO1xyXG5cclxuICAgICAgICBpZiAoaW5mb0NvbnRhaW5lcklkID09IG51bGwpXHJcbiAgICAgICAgICAgIGluZm9Db250YWluZXJJZCA9IFwiZDNzaGVldC1pbmZvXCI7XHJcbiAgICAgICAgZDNzaGVldC5pbmZvQ29udGFpbmVySWQgPSBpbmZvQ29udGFpbmVySWQ7XHJcblxyXG4gICAgICAgIHZhciBzdmdDb250YWluZXIgPSAkKFwiI1wiICsgc3ZnQ29udGFpbmVySWQpLFxyXG4gICAgICAgICAgICB3aWR0aCA9IHN2Z0NvbnRhaW5lci53aWR0aCgpLFxyXG4gICAgICAgICAgICBoZWlnaHQgPSBzdmdDb250YWluZXIuaGVpZ2h0KCk7XHJcblxyXG4gICAgICAgIC8vIENyZWF0ZSBTVkcgZWxlbWVudFxyXG4gICAgICAgIGQzc2hlZXQuc3ZnID0gZDMuc2VsZWN0KFwiI1wiICsgc3ZnQ29udGFpbmVySWQpXHJcbiAgICAgICAgICAgIC5hcHBlbmQoXCJzdmdcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCBcIjEwMCVcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgXCIxMDAlXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKCd2aWV3Qm94JywgXCIwIDAgXCIgKyB3aWR0aCArIFwiIFwiICsgaGVpZ2h0KTtcclxuXHJcbiAgICAgICAgLy8gQ3JlYXRlIGluZm8gcGFuZWxcclxuICAgICAgICBkMy5zZWxlY3QoXCIjXCIgKyBpbmZvQ29udGFpbmVySWQpXHJcbiAgICAgICAgICAgIC5hcHBlbmQoXCJkaXZcIik7XHJcblxyXG4gICAgICAgIHJldHVybiBkM3NoZWV0O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgKiBMb2FkIGRhdGEgZnJvbSBzcHJlYWRzaGVldC5cclxuICAgICoqL1xyXG4gICAgZDNzaGVldC5sb2FkID0gZnVuY3Rpb24oc3ByZWFkc2hlZXRLZXkpIHtcclxuICAgICAgICAvLyBMb2FkIHNwcmVhZHNoZWV0XHJcbiAgICAgICAgdmFyIHNwcmVhZHNoZWV0ID0gcmVxdWlyZShcIi4vc3ByZWFkc2hlZXRcIik7XHJcbiAgICAgICAgc3ByZWFkc2hlZXQoc3ByZWFkc2hlZXRLZXksIGZ1bmN0aW9uKHNwcmVhZHNoZWV0RGF0YSkge1xyXG4gICAgICAgICAgICBkM3NoZWV0LnNwcmVhZHNoZWV0ID0gc3ByZWFkc2hlZXREYXRhO1xyXG5cclxuICAgICAgICAgICAgLy8gQ3JlYXRlIG1vZGVsIGZyb20gc3ByZWFkc2hlZXRcclxuICAgICAgICAgICAgdmFyIG1vZGVsID0gcmVxdWlyZShcIi4vbW9kZWxcIik7XHJcbiAgICAgICAgICAgIGQzc2hlZXQubW9kZWwgPSBtb2RlbChkM3NoZWV0LnNwcmVhZHNoZWV0KTtcclxuXHJcbiAgICAgICAgICAgIC8vIENyZWF0ZSBncmFwaCBmcm9tIG1vZGVsXHJcbiAgICAgICAgICAgIHZhciBncmFwaCA9IHJlcXVpcmUoXCIuL2dyYXBoXCIpO1xyXG4gICAgICAgICAgICBkM3NoZWV0LmdyYXBoID0gZ3JhcGgoZDNzaGVldC5tb2RlbCk7XHJcblxyXG4gICAgICAgICAgICAvLyBDcmVhdGUgRDMgZm9yY2UgbGF5b3V0IGZyb20gZ3JhcGhcclxuICAgICAgICAgICAgdmFyIGZvcmNlID0gcmVxdWlyZShcIi4vZm9yY2VcIik7XHJcbiAgICAgICAgICAgIGZvcmNlKGQzc2hlZXQuZ3JhcGgsIGQzc2hlZXQuc3ZnQ29udGFpbmVySWQsIGQzc2hlZXQuc3ZnKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBjaGVja1JlcXVpcmVtZW50cygpIHtcclxuICAgICAgICBpZiAodHlwZW9mIGQzID09PSBcInVuZGVmaW5lZFwiKVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJEMyBsaWJyYXJ5IG5vdCBmb3VuZCFcIik7XHJcbiAgICAgICAgaWYgKHR5cGVvZiAkID09PSBcInVuZGVmaW5lZFwiKVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJqUXVlcnkgbm90IGZvdW5kIVwiKTtcclxuICAgIH1cclxufSgpOyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZ3JhcGgsIHN2Z0NvbnRhaW5lcklkLCBzdmcpIHtcclxuICAgIHZhciBub2RlID0gW10sXHJcbiAgICAgICAgbGluayA9IFtdLFxyXG4gICAgICAgIGxpbmtMYWJlbCA9IFtdO1xyXG5cclxuICAgIHZhciBzdmdDb250YWluZXIgPSAkKFwiI1wiICsgc3ZnQ29udGFpbmVySWQpLFxyXG4gICAgICAgIHdpZHRoID0gc3ZnQ29udGFpbmVyLndpZHRoKCksXHJcbiAgICAgICAgaGVpZ2h0ID0gc3ZnQ29udGFpbmVyLmhlaWdodCgpO1xyXG5cclxuICAgIHNlbGVjdEFsbCgpO1xyXG5cclxuICAgIHZhciBmb3JjZSA9IGQzLmxheW91dC5mb3JjZSgpXHJcbiAgICAgICAgLnNpemUoW3dpZHRoLCBoZWlnaHRdKVxyXG4gICAgICAgIC5saW5rRGlzdGFuY2UoMzApIC8vIFRPRE86IE1vdmUgdG8gc2V0dGluZ3NcclxuICAgICAgICAuY2hhcmdlKC01MDAwKSAvLyBUT0RPOiBNb3ZlIHRvIHNldHRpbmdzXHJcbiAgICAgICAgLmdyYXZpdHkoMC41KSAvLyBUT0RPOiBNb3ZlIHRvIHNldHRpbmdzXHJcbiAgICAgICAgLm5vZGVzKGdyYXBoLm5vZGVzKVxyXG4gICAgICAgIC5saW5rcyhncmFwaC5saW5rcylcclxuICAgICAgICAub24oXCJ0aWNrXCIsIG9uVGljayk7XHJcblxyXG4gICAgcmVzdGFydCgpO1xyXG5cclxuICAgIGZ1bmN0aW9uIHJlc3RhcnQoKSB7XHJcbiAgICAgICAgc3ZnLnNlbGVjdEFsbChcIi5saW5rXCIpXHJcbiAgICAgICAgICAgIC5kYXRhKGdyYXBoLmxpbmtzKVxyXG4gICAgICAgICAgICAuZW50ZXIoKVxyXG4gICAgICAgICAgICAuYXBwZW5kKFwibGluZVwiKVxyXG4gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibGlua1wiKTtcclxuXHJcbi8vICAgICAgICBzdmcuc2VsZWN0QWxsKFwiLmxpbmstbGFiZWxcIikuZGF0YShncmFwaC5saW5rcylcclxuLy8gICAgICAgICAgICAuZW50ZXIoKVxyXG4vLyAgICAgICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXHJcbi8vICAgICAgICAgICAgLnRleHQobGlua1RleHQpXHJcbi8vICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImxpbmstbGFiZWxcIilcclxuLy8gICAgICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpO1xyXG5cclxuICAgICAgICBub2RlID0gc3ZnLnNlbGVjdEFsbChcIi5ub2RlXCIpLmRhdGEoZ3JhcGgubm9kZXMpXHJcbiAgICAgICAgICAgIC5lbnRlcigpLmFwcGVuZChcImdcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcIm5vZGVcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIDApXHJcbiAgICAgICAgICAgIC5hdHRyKFwieVwiLCAwKVxyXG4vLyAgICAgICAgICAgIC5hdHRyKFwiaWRcIiwgbm9kZUlkKVxyXG4gICAgICAgICAgICAuY2FsbChmb3JjZS5kcmFnKTtcclxuLy8gICAgICAgICAgICAub24oXCJjbGlja1wiLCBmdW5jdGlvbihub2RlKSB7XHJcbi8vICAgICAgICAgICAgICAgIG1vZGVsQ29udHJvbGxlci5zaG93SW5mbyhub2RlLCBtb2RlbCk7XHJcbi8vICAgICAgICAgICAgICAgIHZpZXcuc2VsZWN0Tm9kZShub2RlKTtcclxuLy8gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdmFyIGNpcmNsZSA9IG5vZGUuYXBwZW5kKFwiY2lyY2xlXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwiclwiLCAzMCk7IC8vIFRPRE86IFNldHRpbmdzXHJcblxyXG4gICAgICAgIG5vZGUuYXBwZW5kKFwidGV4dFwiKVxyXG4gICAgICAgICAgICAuYXR0cihcImR5XCIsIFwiLjM1ZW1cIilcclxuICAgICAgICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxyXG4gICAgICAgICAgICAudGV4dChmdW5jdGlvbihuKSB7IHJldHVybiBuLmxhYmVsOyB9KTtcclxuXHJcbiAgICAgICAgc2VsZWN0QWxsKCk7XHJcbiAgICAgICAgZm9yY2Uuc3RhcnQoKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBzZWxlY3RBbGwoKSB7XHJcbiAgICAgICAgbm9kZSA9IHN2Zy5zZWxlY3RBbGwoXCIubm9kZVwiKTtcclxuICAgICAgICBsaW5rID0gc3ZnLnNlbGVjdEFsbChcIi5saW5rXCIpO1xyXG4gICAgICAgIGxpbmtMYWJlbCA9IHN2Zy5zZWxlY3RBbGwoXCIubGluay1sYWJlbFwiKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBvblRpY2soKSB7XHJcbiAgICAgICAgbGluay5hdHRyKFwieDFcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5zb3VyY2UueDsgfSlcclxuICAgICAgICAgICAgLmF0dHIoXCJ5MVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnNvdXJjZS55OyB9KVxyXG4gICAgICAgICAgICAuYXR0cihcIngyXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGFyZ2V0Lng7IH0pXHJcbiAgICAgICAgICAgIC5hdHRyKFwieTJcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50YXJnZXQueTsgfSk7XHJcblxyXG4gICAgICAgIGxpbmtMYWJlbFxyXG4gICAgICAgICAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIChkLnNvdXJjZS54ICsgZC50YXJnZXQueCkvMjsgfSlcclxuICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAoZC5zb3VyY2UueSArIGQudGFyZ2V0LnkpLzI7IH0pO1xyXG5cclxuICAgICAgICBub2RlLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gXCJ0cmFuc2xhdGUoXCIgKyBkLnggKyBcIixcIiArIGQueSArIFwiKVwiO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihtb2RlbCkge1xyXG4gICAgdmFyIGdyYXBoID0ge1xyXG4gICAgICAgIG5vZGVzOiBbXSxcclxuICAgICAgICBsaW5rczogW11cclxuICAgIH07XHJcblxyXG4gICAgLy8gRm9yIGFsbCBzaGVldHNcclxuICAgICQuZWFjaChtb2RlbC5zaGVldHMsIGZ1bmN0aW9uKGksIHNoZWV0KSB7XHJcbiAgICAgICAgLy8gRm9yIGFsbCBub2Rlc1xyXG4gICAgICAgICQuZWFjaChzaGVldC5ub2RlcywgZnVuY3Rpb24oaiwgbm9kZSkge1xyXG4gICAgICAgICAgICAvLyBBZGQgbm9kZSB0byBncmFwaFxyXG4gICAgICAgICAgICBub2RlLmdyYXBoSW5kZXggPSBncmFwaC5ub2Rlcy5wdXNoKG5vZGUpIC0gMTtcclxuICAgICAgICAgICAgbm9kZS5sYWJlbCA9IG5vZGVbc2hlZXQubGFiZWxdO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQ3JlYXRlIGxpbmtzXHJcbiAgICAkLmVhY2gobW9kZWwuc2hlZXRzLCBmdW5jdGlvbihpLCBzaGVldCkge1xyXG4gICAgICAgIC8vIEZvciBhbGwgbm9kZXNcclxuICAgICAgICAkLmVhY2goc2hlZXQubm9kZXMsIGZ1bmN0aW9uKGosIG5vZGUpIHtcclxuICAgICAgICAgICAgLy8gRm9yIGFsbCBsaW5rIG5hbWVzXHJcbiAgICAgICAgICAgICQuZWFjaChzaGVldC5saW5rTmFtZXMsIGZ1bmN0aW9uKGssIGxpbmtOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBGb3IgYWxsIHRhcmdldCBub2Rlc1xyXG4gICAgICAgICAgICAgICAgJC5lYWNoKG5vZGVbbGlua05hbWVdLCBmdW5jdGlvbihsLCB0YXJnZXRJbmRleCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBsaW5rID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2U6IG5vZGUuZ3JhcGhJbmRleCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0OiBtb2RlbC5zaGVldHNbbGlua05hbWVdLm5vZGVzW3RhcmdldEluZGV4XS5ncmFwaEluZGV4XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICBncmFwaC5saW5rcy5wdXNoKGxpbmspO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIGdyYXBoO1xyXG59IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzcHJlYWRzaGVldCkge1xyXG4gICAgdmFyIG1vZGVsID0ge1xyXG4gICAgICAgIHNoZWV0czoge30sXHJcbiAgICAgICAgc2V0dGluZ3M6IHt9XHJcbiAgICB9O1xyXG5cclxuICAgIHZhciBzaGVldFR5cGVzID0gZ2V0U2hlZXRUeXBlcyhzcHJlYWRzaGVldCk7XHJcbiAgICBtb2RlbC5zaGVldHMgPSBnZXRHcmFwaChzcHJlYWRzaGVldCwgc2hlZXRUeXBlcy5ub2Rlc1NoZWV0TmFtZXMpO1xyXG4gICAgaWYgKHNoZWV0VHlwZXMuc2V0dGluZ3NTaGVldE5hbWUgIT0gbnVsbClcclxuICAgICAgICBtb2RlbC5zZXR0aW5ncyA9IHNwcmVhZHNoZWV0W3NoZWV0VHlwZXMuc2V0dGluZ3NTaGVldE5hbWVdO1xyXG5cclxuICAgIGZ1bmN0aW9uIGdldEdyYXBoKHNwcmVhZHNoZWV0LCBub2RlU2hlZXROYW1lcykge1xyXG4gICAgICAgIC8vIENyZWF0ZSBub2RlcyB3aXRoIHByb3BlcnRpZXNcclxuICAgICAgICB2YXIgc2hlZXRzID0ge307XHJcbiAgICAgICAgJC5lYWNoKG5vZGVTaGVldE5hbWVzLCBmdW5jdGlvbihpLCBub2RlU2hlZXROYW1lKSB7XHJcbiAgICAgICAgICAgIHNoZWV0c1tub2RlU2hlZXROYW1lXSA9IGdldE5vZGVzKHNwcmVhZHNoZWV0W25vZGVTaGVldE5hbWVdKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gQ3JlYXRlIGxpbmsgbmFtZXNcclxuICAgICAgICAkLmVhY2gobm9kZVNoZWV0TmFtZXMsIGZ1bmN0aW9uKGksIG5vZGVTaGVldE5hbWUpIHtcclxuICAgICAgICAgICAgY3JlYXRlTGlua05hbWVzKHNoZWV0cywgc3ByZWFkc2hlZXRbbm9kZVNoZWV0TmFtZV0sIG5vZGVTaGVldE5hbWUpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBDcmVhdGUgbGlua3MgZnJvbSBub2RlIHNoZWV0c1xyXG4gICAgICAgICQuZWFjaChub2RlU2hlZXROYW1lcywgZnVuY3Rpb24oaSwgbm9kZVNoZWV0TmFtZSkge1xyXG4gICAgICAgICAgICBjcmVhdGVMaW5rcyhzaGVldHMsIHNwcmVhZHNoZWV0W25vZGVTaGVldE5hbWVdLCBub2RlU2hlZXROYW1lKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gVE9ETzogQ3JlYXRlIGxpbmtzIGZyb20gbGluayBzaGVldHNcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlTGlua3Moc2hlZXRzLCBub2RlU2hlZXQsIG5vZGVTaGVldE5hbWUpIHtcclxuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IHNoZWV0c1tub2RlU2hlZXROYW1lXTtcclxuXHJcbiAgICAgICAgICAgIC8vIEZvciBhbGwgc2hlZXQgcm93c1xyXG4gICAgICAgICAgICAkLmVhY2gobm9kZVNoZWV0LnJvd3MsIGZ1bmN0aW9uKGksIHJvdykge1xyXG4gICAgICAgICAgICAgICAgLy8gRm9yIGFsbCBzaGVldCBjb2x1bW5zXHJcbiAgICAgICAgICAgICAgICB2YXIgY29sTmFtZXMgPSBPYmplY3Qua2V5cyhyb3cpO1xyXG4gICAgICAgICAgICAgICAgJC5lYWNoKGNvbE5hbWVzLCBmdW5jdGlvbihqLCBjb2xOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhpcyBpcyBhIGxpbmsgY29sdW1uXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxpbmtUYXJnZXQgPSBwYXJzZUNvbHVtbkxpbmtOYW1lKGNvbE5hbWUsIHNoZWV0cyk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxpbmtUYXJnZXQgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGaW5kIGluZGV4IG9mIHRoZSB0YXJnZXQgbm9kZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAkLmVhY2goc2hlZXRzW2xpbmtUYXJnZXQuc2hlZXROYW1lXS5ub2RlcywgZnVuY3Rpb24oaywgdGFyZ2V0Tm9kZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGFyZ2V0IG5vZGUgcHJvcGVydHkgdmFsdWUgbWF0Y2hlc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJvd1tjb2xOYW1lXS5pbmRleE9mKHRhcmdldE5vZGVbbGlua1RhcmdldC5wcm9wZXJ0eU5hbWVdKSA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNvdXJjZS5ub2Rlc1tpXVtsaW5rVGFyZ2V0LnNoZWV0TmFtZV0gPT0gbnVsbClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlLm5vZGVzW2ldW2xpbmtUYXJnZXQuc2hlZXROYW1lXSA9IFtdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBZGQgaW5kZXggb2YgdGhlIHRhcmdldCBub2RlIHRvIHRoZSBzb3VyY2Ugbm9kZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZS5ub2Rlc1tpXVtsaW5rVGFyZ2V0LnNoZWV0TmFtZV0ucHVzaChrKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlTGlua05hbWVzKHNoZWV0cywgbm9kZVNoZWV0LCBub2RlU2hlZXROYW1lKSB7XHJcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBzaGVldHNbbm9kZVNoZWV0TmFtZV07XHJcblxyXG4gICAgICAgICAgICAvLyBHZXQgbGluayBuYW1lc1xyXG4gICAgICAgICAgICAkLmVhY2gobm9kZVNoZWV0LmhlYWRlciwgZnVuY3Rpb24oaSwgcHJvcGVydHlOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbGlua1RhcmdldCA9IHBhcnNlQ29sdW1uTGlua05hbWUocHJvcGVydHlOYW1lLCBzaGVldHMpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGxpbmtUYXJnZXQgIT0gbnVsbClcclxuICAgICAgICAgICAgICAgICAgICBzb3VyY2UubGlua05hbWVzLnB1c2gobGlua1RhcmdldC5zaGVldE5hbWUpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGdldE5vZGVzKG5vZGVTaGVldCkge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0ge1xyXG4gICAgICAgICAgICAgICAgbGFiZWw6IG5vZGVTaGVldC5oZWFkZXJbMF0sXHJcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eU5hbWVzOiBbXSxcclxuICAgICAgICAgICAgICAgIGxpbmtOYW1lczogW10sXHJcbiAgICAgICAgICAgICAgICBub2RlczogW11cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIC8vIEdldCBub2RlcyBhbmQgcHJvcGVydGllc1xyXG4gICAgICAgICAgICAkLmVhY2gobm9kZVNoZWV0LnJvd3MsIGZ1bmN0aW9uKGksIHJvdykge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0Lm5vZGVzLnB1c2goZ2V0Tm9kZVByb3BlcnRpZXMocm93KSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gR2V0IHByb3BlcnR5IG5hbWVzXHJcbiAgICAgICAgICAgICQuZWFjaChub2RlU2hlZXQuaGVhZGVyLCBmdW5jdGlvbihpLCBjb2xOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbGlua1RhcmdldCA9IGNvbE5hbWUuc3BsaXQoXCIuXCIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGxpbmtUYXJnZXQubGVuZ3RoID09IDEpXHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnByb3BlcnR5TmFtZXMucHVzaChjb2xOYW1lKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0Tm9kZVByb3BlcnRpZXMocm93KSB7XHJcbiAgICAgICAgICAgIHZhciBub2RlUHJvcGVydGllcyA9IHt9O1xyXG4gICAgICAgICAgICB2YXIgY29sTmFtZXMgPSBPYmplY3Qua2V5cyhyb3cpO1xyXG4gICAgICAgICAgICAkLmVhY2goY29sTmFtZXMsIGZ1bmN0aW9uKGksIGNvbE5hbWUpIHtcclxuICAgICAgICAgICAgICAgIGlmIChjb2xOYW1lLmluZGV4T2YoXCIuXCIpID09IC0xKVxyXG4gICAgICAgICAgICAgICAgICAgIG5vZGVQcm9wZXJ0aWVzW2NvbE5hbWVdID0gcm93W2NvbE5hbWVdO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIG5vZGVQcm9wZXJ0aWVzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHNoZWV0cztcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZXRTaGVldFR5cGVzKHNwcmVhZHNoZWV0KSB7XHJcbiAgICAgICAgdmFyIHNoZWV0VHlwZXMgPSB7XHJcbiAgICAgICAgICAgIG5vZGVzU2hlZXROYW1lczogW10sXHJcbiAgICAgICAgICAgIGxpbmtTaGVldE5hbWVzOiBbXSxcclxuICAgICAgICAgICAgc2V0dGluZ3NTaGVldE5hbWU6IG51bGxcclxuICAgICAgICB9O1xyXG4gICAgICAgIHZhciBzaGVldE5hbWVzID0gT2JqZWN0LmtleXMoc3ByZWFkc2hlZXQpO1xyXG4gICAgICAgICQuZWFjaChzaGVldE5hbWVzLCBmdW5jdGlvbihpLCBzaGVldE5hbWUpIHtcclxuICAgICAgICAgICAgaWYgKHNoZWV0TmFtZSA9PSBcInNldHRpbmdzXCIpIHtcclxuICAgICAgICAgICAgICAgIHNoZWV0VHlwZXMuc2V0dGluZ3NTaGVldE5hbWUgPSBzaGVldE5hbWU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChzaGVldE5hbWUuc2xpY2UoMCwgMSkgPT0gXCIjXCIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgICAgICB2YXIgbGlua1NoZWV0ID0gcGFyc2VMaW5rU2hlZXROYW1lKHNoZWV0TmFtZSlcclxuICAgICAgICAgICAgaWYgKChsaW5rU2hlZXQgIT0gbnVsbCkgJiZcclxuICAgICAgICAgICAgICAgIChzaGVldE5hbWVzLmluZGV4T2YobGlua1NoZWV0LnNvdXJjZSkgPiAtMSkgJiZcclxuICAgICAgICAgICAgICAgIChzaGVldE5hbWVzLmluZGV4T2YobGlua1NoZWV0LnRhcmdldCkgPiAtMSkpIHtcclxuICAgICAgICAgICAgICAgIHNoZWV0VHlwZXMubGlua1NoZWV0TmFtZXMucHVzaChzaGVldE5hbWUpXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHNoZWV0VHlwZXMubm9kZXNTaGVldE5hbWVzLnB1c2goc2hlZXROYW1lKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHNoZWV0VHlwZXM7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcGFyc2VDb2x1bW5MaW5rTmFtZShjb2xOYW1lLCBzaGVldHMpIHtcclxuICAgICAgICB2YXIgbGlua05hbWVzID0gY29sTmFtZS5zcGxpdChcIi5cIik7XHJcbiAgICAgICAgaWYgKChsaW5rTmFtZXMubGVuZ3RoID09IDIpICYmXHJcbiAgICAgICAgICAgIChzaGVldHNbbGlua05hbWVzWzBdXSAhPSBudWxsKSAmJlxyXG4gICAgICAgICAgICAoc2hlZXRzW2xpbmtOYW1lc1swXV0ucHJvcGVydHlOYW1lcy5pbmRleE9mKGxpbmtOYW1lc1sxXSkgPiAtMSkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHNoZWV0TmFtZTogbGlua05hbWVzWzBdLFxyXG4gICAgICAgICAgICAgICAgcHJvcGVydHlOYW1lOiBsaW5rTmFtZXNbMV1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcGFyc2VMaW5rU2hlZXROYW1lKHNoZWV0TmFtZSkge1xyXG4gICAgICAgIHZhciBub2RlTmFtZXMgPSBzaGVldE5hbWUuc3BsaXQoXCItXCIpO1xyXG4gICAgICAgIGlmIChub2RlTmFtZXMubGVuZ3RoID09IDIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHNvdXJjZTogbm9kZU5hbWVzWzBdLFxyXG4gICAgICAgICAgICAgICAgdGFyZ2V0OiBub2RlTmFtZXNbMV1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBtb2RlbDtcclxufSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc3ByZWFkc2hlZXRLZXksIG9uTG9hZGVkKSB7XHJcbiAgICAvLyBHZXQgc2hlZXQgY291bnRcclxuICAgIGdldFNoZWV0Q291bnQoc3ByZWFkc2hlZXRLZXksIGZ1bmN0aW9uIG9uU3VjY2VzcyhzaGVldENvdW50KSB7XHJcbiAgICAgICAgLy8gTG9hZCBhbGwgc2hlZXRzXHJcbiAgICAgICAgbG9hZFNoZWV0cyhzcHJlYWRzaGVldEtleSwgc2hlZXRDb3VudCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBmdW5jdGlvbiBsb2FkU2hlZXRzKHNwcmVhZHNoZWV0S2V5LCBzaGVldENvdW50KSB7XHJcbiAgICAgICAgdmFyIHNwcmVhZHNoZWV0ID0ge307XHJcbiAgICAgICAgdmFyIGxvYWRlZFNoZWV0Q291bnQgPSAwO1xyXG4gICAgICAgIGZvciAoaSA9IDE7IGkgPD0gc2hlZXRDb3VudDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxvYWRTaGVldChzcHJlYWRzaGVldCwgc3ByZWFkc2hlZXRLZXksIGkpLnRoZW4oZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICBsb2FkZWRTaGVldENvdW50ICs9IDE7XHJcbiAgICAgICAgICAgICAgICBpZiAobG9hZGVkU2hlZXRDb3VudCA9PSBzaGVldENvdW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb25Mb2FkZWQoc3ByZWFkc2hlZXQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBsb2FkU2hlZXQoc3ByZWFkc2hlZXQsIHNwcmVhZHNoZWV0S2V5LCBzaGVldEluZGV4KSB7XHJcbiAgICAgICAgcmV0dXJuIGdldFNoZWV0KHNwcmVhZHNoZWV0S2V5LCBzaGVldEluZGV4LCBmdW5jdGlvbihyZXNwb25zZSkge1xyXG4gICAgICAgICAgICB2YXIgc2hlZXQgPSBzcHJlYWRzaGVldFtyZXNwb25zZS5mZWVkLnRpdGxlLiR0XSA9IHtcclxuICAgICAgICAgICAgICAgIGhlYWRlcjogW10sXHJcbiAgICAgICAgICAgICAgICByb3dzOiBbXSxcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICQuZWFjaChyZXNwb25zZS5mZWVkLmVudHJ5LCBmdW5jdGlvbihpLCBlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZS5ncyRjZWxsLnJvdyA9PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2hlZXQuaGVhZGVyW2UuZ3MkY2VsbC5jb2wgLSAxXSA9IGUuY29udGVudC4kdDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IGUuZ3MkY2VsbC5yb3cgLSAyO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzaGVldC5yb3dzW2luZGV4XSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNoZWV0LnJvd3NbaW5kZXhdID0ge307XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHNoZWV0LnJvd3NbaW5kZXhdW3NoZWV0LmhlYWRlcltlLmdzJGNlbGwuY29sIC0gMV1dID0gZS5jb250ZW50LiR0O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZXRTaGVldChzcHJlYWRzaGVldEtleSwgc2hlZXRJbmRleCwgb25TdWNjZXNzKSB7XHJcbiAgICAgICAgcmV0dXJuICQuYWpheCh7XHJcbiAgICAgICAgICAgIHVybDogXCJodHRwczovL3NwcmVhZHNoZWV0cy5nb29nbGUuY29tL2ZlZWRzL2NlbGxzL1wiICsgc3ByZWFkc2hlZXRLZXkgKyBcIi9cIiArIHNoZWV0SW5kZXggKyBcIi9wdWJsaWMvdmFsdWVzP2FsdD1qc29uLWluLXNjcmlwdFwiLFxyXG4gICAgICAgICAgICBqc29ucDogXCJjYWxsYmFja1wiLFxyXG4gICAgICAgICAgICBkYXRhVHlwZTogXCJqc29ucFwiLFxyXG4gICAgICAgICAgICBzdWNjZXNzOiBvblN1Y2Nlc3NcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZXRTaGVldENvdW50KHNwcmVhZHNoZWV0S2V5LCBvblN1Y2Nlc3MpIHtcclxuICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICB1cmw6IFwiaHR0cHM6Ly9zcHJlYWRzaGVldHMuZ29vZ2xlLmNvbS9mZWVkcy93b3Jrc2hlZXRzL1wiICsgc3ByZWFkc2hlZXRLZXkgKyBcIi9wdWJsaWMvZnVsbD9hbHQ9anNvbi1pbi1zY3JpcHRcIixcclxuICAgICAgICAgICAganNvbnA6IFwiY2FsbGJhY2tcIixcclxuICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvbnBcIixcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24ocmVzcG9uc2UpIHtcclxuICAgICAgICAgICAgICAgIG9uU3VjY2VzcyhyZXNwb25zZS5mZWVkLmVudHJ5Lmxlbmd0aCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxufSJdfQ==
