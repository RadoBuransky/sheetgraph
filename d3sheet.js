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
        nodeLabel = [],
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

        svg.selectAll(".node")
            .data(graph.nodes)
            .enter()
            .append("circle")
            .attr("class", "node")
            .attr("r", 30) // TODO: Settings
            .attr("x", 0)
            .attr("y", 0)
//            .attr("id", nodeId)
            .call(force.drag);
//            .on("click", function(node) {
//                modelController.showInfo(node, model);
//                view.selectNode(node);
//            });

        svg.selectAll(".node-label")
            .data(graph.nodes)
            .enter()
            .append("text")
            .attr("class", "node-label")
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .text(function(n) { return n.label; })
            .call(force.drag);;

        selectAll();
        force.start();
    }

    function selectAll() {
        node = svg.selectAll(".node");
        nodeLabel = svg.selectAll(".node-label");
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

        nodeLabel
            .attr("x", function(d) { return d.x; })
            .attr("y", function(d) { return d.y; });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZDNzaGVldC5qcyIsInNyYy9mb3JjZS5qcyIsInNyYy9ncmFwaC5qcyIsInNyYy9tb2RlbC5qcyIsInNyYy9zcHJlYWRzaGVldC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIiFmdW5jdGlvbigpIHtcclxuICAgIGNoZWNrUmVxdWlyZW1lbnRzKCk7XHJcblxyXG4gICAgdmFyIGQzc2hlZXQgPSB7XHJcbiAgICAgICAgdmVyOiBcIjEuMC4wXCIsXHJcbiAgICAgICAgc3ZnQ29udGFpbmVySWQ6IFwiXCIsXHJcbiAgICAgICAgaW5mb0NvbnRhaW5lcklkOiBcIlwiLFxyXG4gICAgICAgIHN2Zzoge30sXHJcbiAgICAgICAgc3ByZWFkc2hlZXQ6IHt9LFxyXG4gICAgICAgIG1vZGVsOiB7fVxyXG4gICAgfTtcclxuXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGQzc2hlZXQ7XHJcblxyXG4gICAgLyoqXHJcbiAgICAqIEluaXRpYWxpemUgRDMgc2hlZXQuXHJcbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb250YWluZXJJZCAtIGlkZW50aWZpZXIgb2YgdGhlIG1haW4gRElWLlxyXG4gICAgKiovXHJcbiAgICBkM3NoZWV0LmluaXQgPSBmdW5jdGlvbihzdmdDb250YWluZXJJZCwgaW5mb0NvbnRhaW5lcklkKSB7XHJcbiAgICAgICAgaWYgKHN2Z0NvbnRhaW5lcklkID09IG51bGwpXHJcbiAgICAgICAgICAgIHN2Z0NvbnRhaW5lcklkID0gXCJkM3NoZWV0LXN2Z1wiO1xyXG4gICAgICAgIGQzc2hlZXQuc3ZnQ29udGFpbmVySWQgPSBzdmdDb250YWluZXJJZDtcclxuXHJcbiAgICAgICAgaWYgKGluZm9Db250YWluZXJJZCA9PSBudWxsKVxyXG4gICAgICAgICAgICBpbmZvQ29udGFpbmVySWQgPSBcImQzc2hlZXQtaW5mb1wiO1xyXG4gICAgICAgIGQzc2hlZXQuaW5mb0NvbnRhaW5lcklkID0gaW5mb0NvbnRhaW5lcklkO1xyXG5cclxuICAgICAgICB2YXIgc3ZnQ29udGFpbmVyID0gJChcIiNcIiArIHN2Z0NvbnRhaW5lcklkKSxcclxuICAgICAgICAgICAgd2lkdGggPSBzdmdDb250YWluZXIud2lkdGgoKSxcclxuICAgICAgICAgICAgaGVpZ2h0ID0gc3ZnQ29udGFpbmVyLmhlaWdodCgpO1xyXG5cclxuICAgICAgICAvLyBDcmVhdGUgU1ZHIGVsZW1lbnRcclxuICAgICAgICBkM3NoZWV0LnN2ZyA9IGQzLnNlbGVjdChcIiNcIiArIHN2Z0NvbnRhaW5lcklkKVxyXG4gICAgICAgICAgICAuYXBwZW5kKFwic3ZnXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgXCIxMDAlXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIFwiMTAwJVwiKVxyXG4gICAgICAgICAgICAuYXR0cigndmlld0JveCcsIFwiMCAwIFwiICsgd2lkdGggKyBcIiBcIiArIGhlaWdodCk7XHJcblxyXG4gICAgICAgIC8vIENyZWF0ZSBpbmZvIHBhbmVsXHJcbiAgICAgICAgZDMuc2VsZWN0KFwiI1wiICsgaW5mb0NvbnRhaW5lcklkKVxyXG4gICAgICAgICAgICAuYXBwZW5kKFwiZGl2XCIpO1xyXG5cclxuICAgICAgICByZXR1cm4gZDNzaGVldDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICogTG9hZCBkYXRhIGZyb20gc3ByZWFkc2hlZXQuXHJcbiAgICAqKi9cclxuICAgIGQzc2hlZXQubG9hZCA9IGZ1bmN0aW9uKHNwcmVhZHNoZWV0S2V5KSB7XHJcbiAgICAgICAgLy8gTG9hZCBzcHJlYWRzaGVldFxyXG4gICAgICAgIHZhciBzcHJlYWRzaGVldCA9IHJlcXVpcmUoXCIuL3NwcmVhZHNoZWV0XCIpO1xyXG4gICAgICAgIHNwcmVhZHNoZWV0KHNwcmVhZHNoZWV0S2V5LCBmdW5jdGlvbihzcHJlYWRzaGVldERhdGEpIHtcclxuICAgICAgICAgICAgZDNzaGVldC5zcHJlYWRzaGVldCA9IHNwcmVhZHNoZWV0RGF0YTtcclxuXHJcbiAgICAgICAgICAgIC8vIENyZWF0ZSBtb2RlbCBmcm9tIHNwcmVhZHNoZWV0XHJcbiAgICAgICAgICAgIHZhciBtb2RlbCA9IHJlcXVpcmUoXCIuL21vZGVsXCIpO1xyXG4gICAgICAgICAgICBkM3NoZWV0Lm1vZGVsID0gbW9kZWwoZDNzaGVldC5zcHJlYWRzaGVldCk7XHJcblxyXG4gICAgICAgICAgICAvLyBDcmVhdGUgZ3JhcGggZnJvbSBtb2RlbFxyXG4gICAgICAgICAgICB2YXIgZ3JhcGggPSByZXF1aXJlKFwiLi9ncmFwaFwiKTtcclxuICAgICAgICAgICAgZDNzaGVldC5ncmFwaCA9IGdyYXBoKGQzc2hlZXQubW9kZWwpO1xyXG5cclxuICAgICAgICAgICAgLy8gQ3JlYXRlIEQzIGZvcmNlIGxheW91dCBmcm9tIGdyYXBoXHJcbiAgICAgICAgICAgIHZhciBmb3JjZSA9IHJlcXVpcmUoXCIuL2ZvcmNlXCIpO1xyXG4gICAgICAgICAgICBmb3JjZShkM3NoZWV0LmdyYXBoLCBkM3NoZWV0LnN2Z0NvbnRhaW5lcklkLCBkM3NoZWV0LnN2Zyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gY2hlY2tSZXF1aXJlbWVudHMoKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBkMyA9PT0gXCJ1bmRlZmluZWRcIilcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRDMgbGlicmFyeSBub3QgZm91bmQhXCIpO1xyXG4gICAgICAgIGlmICh0eXBlb2YgJCA9PT0gXCJ1bmRlZmluZWRcIilcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwialF1ZXJ5IG5vdCBmb3VuZCFcIik7XHJcbiAgICB9XHJcbn0oKTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGdyYXBoLCBzdmdDb250YWluZXJJZCwgc3ZnKSB7XHJcbiAgICB2YXIgbm9kZSA9IFtdLFxyXG4gICAgICAgIG5vZGVMYWJlbCA9IFtdLFxyXG4gICAgICAgIGxpbmsgPSBbXSxcclxuICAgICAgICBsaW5rTGFiZWwgPSBbXTtcclxuXHJcbiAgICB2YXIgc3ZnQ29udGFpbmVyID0gJChcIiNcIiArIHN2Z0NvbnRhaW5lcklkKSxcclxuICAgICAgICB3aWR0aCA9IHN2Z0NvbnRhaW5lci53aWR0aCgpLFxyXG4gICAgICAgIGhlaWdodCA9IHN2Z0NvbnRhaW5lci5oZWlnaHQoKTtcclxuXHJcbiAgICBzZWxlY3RBbGwoKTtcclxuXHJcbiAgICB2YXIgZm9yY2UgPSBkMy5sYXlvdXQuZm9yY2UoKVxyXG4gICAgICAgIC5zaXplKFt3aWR0aCwgaGVpZ2h0XSlcclxuICAgICAgICAubGlua0Rpc3RhbmNlKDMwKSAvLyBUT0RPOiBNb3ZlIHRvIHNldHRpbmdzXHJcbiAgICAgICAgLmNoYXJnZSgtNTAwMCkgLy8gVE9ETzogTW92ZSB0byBzZXR0aW5nc1xyXG4gICAgICAgIC5ncmF2aXR5KDAuNSkgLy8gVE9ETzogTW92ZSB0byBzZXR0aW5nc1xyXG4gICAgICAgIC5ub2RlcyhncmFwaC5ub2RlcylcclxuICAgICAgICAubGlua3MoZ3JhcGgubGlua3MpXHJcbiAgICAgICAgLm9uKFwidGlja1wiLCBvblRpY2spO1xyXG5cclxuICAgIHJlc3RhcnQoKTtcclxuXHJcbiAgICBmdW5jdGlvbiByZXN0YXJ0KCkge1xyXG4gICAgICAgIHN2Zy5zZWxlY3RBbGwoXCIubGlua1wiKVxyXG4gICAgICAgICAgICAuZGF0YShncmFwaC5saW5rcylcclxuICAgICAgICAgICAgLmVudGVyKClcclxuICAgICAgICAgICAgLmFwcGVuZChcImxpbmVcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImxpbmtcIik7XHJcblxyXG4vLyAgICAgICAgc3ZnLnNlbGVjdEFsbChcIi5saW5rLWxhYmVsXCIpLmRhdGEoZ3JhcGgubGlua3MpXHJcbi8vICAgICAgICAgICAgLmVudGVyKClcclxuLy8gICAgICAgICAgICAuYXBwZW5kKFwidGV4dFwiKVxyXG4vLyAgICAgICAgICAgIC50ZXh0KGxpbmtUZXh0KVxyXG4vLyAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJsaW5rLWxhYmVsXCIpXHJcbi8vICAgICAgICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKTtcclxuXHJcbiAgICAgICAgc3ZnLnNlbGVjdEFsbChcIi5ub2RlXCIpXHJcbiAgICAgICAgICAgIC5kYXRhKGdyYXBoLm5vZGVzKVxyXG4gICAgICAgICAgICAuZW50ZXIoKVxyXG4gICAgICAgICAgICAuYXBwZW5kKFwiY2lyY2xlXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJub2RlXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwiclwiLCAzMCkgLy8gVE9ETzogU2V0dGluZ3NcclxuICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIDApXHJcbiAgICAgICAgICAgIC5hdHRyKFwieVwiLCAwKVxyXG4vLyAgICAgICAgICAgIC5hdHRyKFwiaWRcIiwgbm9kZUlkKVxyXG4gICAgICAgICAgICAuY2FsbChmb3JjZS5kcmFnKTtcclxuLy8gICAgICAgICAgICAub24oXCJjbGlja1wiLCBmdW5jdGlvbihub2RlKSB7XHJcbi8vICAgICAgICAgICAgICAgIG1vZGVsQ29udHJvbGxlci5zaG93SW5mbyhub2RlLCBtb2RlbCk7XHJcbi8vICAgICAgICAgICAgICAgIHZpZXcuc2VsZWN0Tm9kZShub2RlKTtcclxuLy8gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgc3ZnLnNlbGVjdEFsbChcIi5ub2RlLWxhYmVsXCIpXHJcbiAgICAgICAgICAgIC5kYXRhKGdyYXBoLm5vZGVzKVxyXG4gICAgICAgICAgICAuZW50ZXIoKVxyXG4gICAgICAgICAgICAuYXBwZW5kKFwidGV4dFwiKVxyXG4gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibm9kZS1sYWJlbFwiKVxyXG4gICAgICAgICAgICAuYXR0cihcImR5XCIsIFwiLjM1ZW1cIilcclxuICAgICAgICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxyXG4gICAgICAgICAgICAudGV4dChmdW5jdGlvbihuKSB7IHJldHVybiBuLmxhYmVsOyB9KVxyXG4gICAgICAgICAgICAuY2FsbChmb3JjZS5kcmFnKTs7XHJcblxyXG4gICAgICAgIHNlbGVjdEFsbCgpO1xyXG4gICAgICAgIGZvcmNlLnN0YXJ0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gc2VsZWN0QWxsKCkge1xyXG4gICAgICAgIG5vZGUgPSBzdmcuc2VsZWN0QWxsKFwiLm5vZGVcIik7XHJcbiAgICAgICAgbm9kZUxhYmVsID0gc3ZnLnNlbGVjdEFsbChcIi5ub2RlLWxhYmVsXCIpO1xyXG4gICAgICAgIGxpbmsgPSBzdmcuc2VsZWN0QWxsKFwiLmxpbmtcIik7XHJcbiAgICAgICAgbGlua0xhYmVsID0gc3ZnLnNlbGVjdEFsbChcIi5saW5rLWxhYmVsXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIG9uVGljaygpIHtcclxuICAgICAgICBsaW5rLmF0dHIoXCJ4MVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnNvdXJjZS54OyB9KVxyXG4gICAgICAgICAgICAuYXR0cihcInkxXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuc291cmNlLnk7IH0pXHJcbiAgICAgICAgICAgIC5hdHRyKFwieDJcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50YXJnZXQueDsgfSlcclxuICAgICAgICAgICAgLmF0dHIoXCJ5MlwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnRhcmdldC55OyB9KTtcclxuXHJcbiAgICAgICAgbGlua0xhYmVsXHJcbiAgICAgICAgICAgIC5hdHRyKFwieFwiLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gKGQuc291cmNlLnggKyBkLnRhcmdldC54KS8yOyB9KVxyXG4gICAgICAgICAgICAuYXR0cihcInlcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIChkLnNvdXJjZS55ICsgZC50YXJnZXQueSkvMjsgfSk7XHJcblxyXG4gICAgICAgIG5vZGUuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBcInRyYW5zbGF0ZShcIiArIGQueCArIFwiLFwiICsgZC55ICsgXCIpXCI7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIG5vZGVMYWJlbFxyXG4gICAgICAgICAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54OyB9KVxyXG4gICAgICAgICAgICAuYXR0cihcInlcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC55OyB9KTtcclxuICAgIH1cclxufSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24obW9kZWwpIHtcclxuICAgIHZhciBncmFwaCA9IHtcclxuICAgICAgICBub2RlczogW10sXHJcbiAgICAgICAgbGlua3M6IFtdXHJcbiAgICB9O1xyXG5cclxuICAgIC8vIEZvciBhbGwgc2hlZXRzXHJcbiAgICAkLmVhY2gobW9kZWwuc2hlZXRzLCBmdW5jdGlvbihpLCBzaGVldCkge1xyXG4gICAgICAgIC8vIEZvciBhbGwgbm9kZXNcclxuICAgICAgICAkLmVhY2goc2hlZXQubm9kZXMsIGZ1bmN0aW9uKGosIG5vZGUpIHtcclxuICAgICAgICAgICAgLy8gQWRkIG5vZGUgdG8gZ3JhcGhcclxuICAgICAgICAgICAgbm9kZS5ncmFwaEluZGV4ID0gZ3JhcGgubm9kZXMucHVzaChub2RlKSAtIDE7XHJcbiAgICAgICAgICAgIG5vZGUubGFiZWwgPSBub2RlW3NoZWV0LmxhYmVsXTtcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIENyZWF0ZSBsaW5rc1xyXG4gICAgJC5lYWNoKG1vZGVsLnNoZWV0cywgZnVuY3Rpb24oaSwgc2hlZXQpIHtcclxuICAgICAgICAvLyBGb3IgYWxsIG5vZGVzXHJcbiAgICAgICAgJC5lYWNoKHNoZWV0Lm5vZGVzLCBmdW5jdGlvbihqLCBub2RlKSB7XHJcbiAgICAgICAgICAgIC8vIEZvciBhbGwgbGluayBuYW1lc1xyXG4gICAgICAgICAgICAkLmVhY2goc2hlZXQubGlua05hbWVzLCBmdW5jdGlvbihrLCBsaW5rTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gRm9yIGFsbCB0YXJnZXQgbm9kZXNcclxuICAgICAgICAgICAgICAgICQuZWFjaChub2RlW2xpbmtOYW1lXSwgZnVuY3Rpb24obCwgdGFyZ2V0SW5kZXgpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbGluayA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlOiBub2RlLmdyYXBoSW5kZXgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldDogbW9kZWwuc2hlZXRzW2xpbmtOYW1lXS5ub2Rlc1t0YXJnZXRJbmRleF0uZ3JhcGhJbmRleFxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgZ3JhcGgubGlua3MucHVzaChsaW5rKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBncmFwaDtcclxufSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc3ByZWFkc2hlZXQpIHtcclxuICAgIHZhciBtb2RlbCA9IHtcclxuICAgICAgICBzaGVldHM6IHt9LFxyXG4gICAgICAgIHNldHRpbmdzOiB7fVxyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgc2hlZXRUeXBlcyA9IGdldFNoZWV0VHlwZXMoc3ByZWFkc2hlZXQpO1xyXG4gICAgbW9kZWwuc2hlZXRzID0gZ2V0R3JhcGgoc3ByZWFkc2hlZXQsIHNoZWV0VHlwZXMubm9kZXNTaGVldE5hbWVzKTtcclxuICAgIGlmIChzaGVldFR5cGVzLnNldHRpbmdzU2hlZXROYW1lICE9IG51bGwpXHJcbiAgICAgICAgbW9kZWwuc2V0dGluZ3MgPSBzcHJlYWRzaGVldFtzaGVldFR5cGVzLnNldHRpbmdzU2hlZXROYW1lXTtcclxuXHJcbiAgICBmdW5jdGlvbiBnZXRHcmFwaChzcHJlYWRzaGVldCwgbm9kZVNoZWV0TmFtZXMpIHtcclxuICAgICAgICAvLyBDcmVhdGUgbm9kZXMgd2l0aCBwcm9wZXJ0aWVzXHJcbiAgICAgICAgdmFyIHNoZWV0cyA9IHt9O1xyXG4gICAgICAgICQuZWFjaChub2RlU2hlZXROYW1lcywgZnVuY3Rpb24oaSwgbm9kZVNoZWV0TmFtZSkge1xyXG4gICAgICAgICAgICBzaGVldHNbbm9kZVNoZWV0TmFtZV0gPSBnZXROb2RlcyhzcHJlYWRzaGVldFtub2RlU2hlZXROYW1lXSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIENyZWF0ZSBsaW5rIG5hbWVzXHJcbiAgICAgICAgJC5lYWNoKG5vZGVTaGVldE5hbWVzLCBmdW5jdGlvbihpLCBub2RlU2hlZXROYW1lKSB7XHJcbiAgICAgICAgICAgIGNyZWF0ZUxpbmtOYW1lcyhzaGVldHMsIHNwcmVhZHNoZWV0W25vZGVTaGVldE5hbWVdLCBub2RlU2hlZXROYW1lKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gQ3JlYXRlIGxpbmtzIGZyb20gbm9kZSBzaGVldHNcclxuICAgICAgICAkLmVhY2gobm9kZVNoZWV0TmFtZXMsIGZ1bmN0aW9uKGksIG5vZGVTaGVldE5hbWUpIHtcclxuICAgICAgICAgICAgY3JlYXRlTGlua3Moc2hlZXRzLCBzcHJlYWRzaGVldFtub2RlU2hlZXROYW1lXSwgbm9kZVNoZWV0TmFtZSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIFRPRE86IENyZWF0ZSBsaW5rcyBmcm9tIGxpbmsgc2hlZXRzXHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZUxpbmtzKHNoZWV0cywgbm9kZVNoZWV0LCBub2RlU2hlZXROYW1lKSB7XHJcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBzaGVldHNbbm9kZVNoZWV0TmFtZV07XHJcblxyXG4gICAgICAgICAgICAvLyBGb3IgYWxsIHNoZWV0IHJvd3NcclxuICAgICAgICAgICAgJC5lYWNoKG5vZGVTaGVldC5yb3dzLCBmdW5jdGlvbihpLCByb3cpIHtcclxuICAgICAgICAgICAgICAgIC8vIEZvciBhbGwgc2hlZXQgY29sdW1uc1xyXG4gICAgICAgICAgICAgICAgdmFyIGNvbE5hbWVzID0gT2JqZWN0LmtleXMocm93KTtcclxuICAgICAgICAgICAgICAgICQuZWFjaChjb2xOYW1lcywgZnVuY3Rpb24oaiwgY29sTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHRoaXMgaXMgYSBsaW5rIGNvbHVtblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBsaW5rVGFyZ2V0ID0gcGFyc2VDb2x1bW5MaW5rTmFtZShjb2xOYW1lLCBzaGVldHMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChsaW5rVGFyZ2V0ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRmluZCBpbmRleCBvZiB0aGUgdGFyZ2V0IG5vZGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKHNoZWV0c1tsaW5rVGFyZ2V0LnNoZWV0TmFtZV0ubm9kZXMsIGZ1bmN0aW9uKGssIHRhcmdldE5vZGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHRhcmdldCBub2RlIHByb3BlcnR5IHZhbHVlIG1hdGNoZXNcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyb3dbY29sTmFtZV0uaW5kZXhPZih0YXJnZXROb2RlW2xpbmtUYXJnZXQucHJvcGVydHlOYW1lXSkgPiAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzb3VyY2Uubm9kZXNbaV1bbGlua1RhcmdldC5zaGVldE5hbWVdID09IG51bGwpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZS5ub2Rlc1tpXVtsaW5rVGFyZ2V0LnNoZWV0TmFtZV0gPSBbXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWRkIGluZGV4IG9mIHRoZSB0YXJnZXQgbm9kZSB0byB0aGUgc291cmNlIG5vZGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2Uubm9kZXNbaV1bbGlua1RhcmdldC5zaGVldE5hbWVdLnB1c2goayk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZUxpbmtOYW1lcyhzaGVldHMsIG5vZGVTaGVldCwgbm9kZVNoZWV0TmFtZSkge1xyXG4gICAgICAgICAgICB2YXIgc291cmNlID0gc2hlZXRzW25vZGVTaGVldE5hbWVdO1xyXG5cclxuICAgICAgICAgICAgLy8gR2V0IGxpbmsgbmFtZXNcclxuICAgICAgICAgICAgJC5lYWNoKG5vZGVTaGVldC5oZWFkZXIsIGZ1bmN0aW9uKGksIHByb3BlcnR5TmFtZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGxpbmtUYXJnZXQgPSBwYXJzZUNvbHVtbkxpbmtOYW1lKHByb3BlcnR5TmFtZSwgc2hlZXRzKTtcclxuICAgICAgICAgICAgICAgIGlmIChsaW5rVGFyZ2V0ICE9IG51bGwpXHJcbiAgICAgICAgICAgICAgICAgICAgc291cmNlLmxpbmtOYW1lcy5wdXNoKGxpbmtUYXJnZXQuc2hlZXROYW1lKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBnZXROb2Rlcyhub2RlU2hlZXQpIHtcclxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHtcclxuICAgICAgICAgICAgICAgIGxhYmVsOiBub2RlU2hlZXQuaGVhZGVyWzBdLFxyXG4gICAgICAgICAgICAgICAgcHJvcGVydHlOYW1lczogW10sXHJcbiAgICAgICAgICAgICAgICBsaW5rTmFtZXM6IFtdLFxyXG4gICAgICAgICAgICAgICAgbm9kZXM6IFtdXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAvLyBHZXQgbm9kZXMgYW5kIHByb3BlcnRpZXNcclxuICAgICAgICAgICAgJC5lYWNoKG5vZGVTaGVldC5yb3dzLCBmdW5jdGlvbihpLCByb3cpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5ub2Rlcy5wdXNoKGdldE5vZGVQcm9wZXJ0aWVzKHJvdykpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIEdldCBwcm9wZXJ0eSBuYW1lc1xyXG4gICAgICAgICAgICAkLmVhY2gobm9kZVNoZWV0LmhlYWRlciwgZnVuY3Rpb24oaSwgY29sTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGxpbmtUYXJnZXQgPSBjb2xOYW1lLnNwbGl0KFwiLlwiKTtcclxuICAgICAgICAgICAgICAgIGlmIChsaW5rVGFyZ2V0Lmxlbmd0aCA9PSAxKVxyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wcm9wZXJ0eU5hbWVzLnB1c2goY29sTmFtZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGdldE5vZGVQcm9wZXJ0aWVzKHJvdykge1xyXG4gICAgICAgICAgICB2YXIgbm9kZVByb3BlcnRpZXMgPSB7fTtcclxuICAgICAgICAgICAgdmFyIGNvbE5hbWVzID0gT2JqZWN0LmtleXMocm93KTtcclxuICAgICAgICAgICAgJC5lYWNoKGNvbE5hbWVzLCBmdW5jdGlvbihpLCBjb2xOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoY29sTmFtZS5pbmRleE9mKFwiLlwiKSA9PSAtMSlcclxuICAgICAgICAgICAgICAgICAgICBub2RlUHJvcGVydGllc1tjb2xOYW1lXSA9IHJvd1tjb2xOYW1lXTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiBub2RlUHJvcGVydGllcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBzaGVldHM7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0U2hlZXRUeXBlcyhzcHJlYWRzaGVldCkge1xyXG4gICAgICAgIHZhciBzaGVldFR5cGVzID0ge1xyXG4gICAgICAgICAgICBub2Rlc1NoZWV0TmFtZXM6IFtdLFxyXG4gICAgICAgICAgICBsaW5rU2hlZXROYW1lczogW10sXHJcbiAgICAgICAgICAgIHNldHRpbmdzU2hlZXROYW1lOiBudWxsXHJcbiAgICAgICAgfTtcclxuICAgICAgICB2YXIgc2hlZXROYW1lcyA9IE9iamVjdC5rZXlzKHNwcmVhZHNoZWV0KTtcclxuICAgICAgICAkLmVhY2goc2hlZXROYW1lcywgZnVuY3Rpb24oaSwgc2hlZXROYW1lKSB7XHJcbiAgICAgICAgICAgIGlmIChzaGVldE5hbWUgPT0gXCJzZXR0aW5nc1wiKSB7XHJcbiAgICAgICAgICAgICAgICBzaGVldFR5cGVzLnNldHRpbmdzU2hlZXROYW1lID0gc2hlZXROYW1lO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoc2hlZXROYW1lLnNsaWNlKDAsIDEpID09IFwiI1wiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgdmFyIGxpbmtTaGVldCA9IHBhcnNlTGlua1NoZWV0TmFtZShzaGVldE5hbWUpXHJcbiAgICAgICAgICAgIGlmICgobGlua1NoZWV0ICE9IG51bGwpICYmXHJcbiAgICAgICAgICAgICAgICAoc2hlZXROYW1lcy5pbmRleE9mKGxpbmtTaGVldC5zb3VyY2UpID4gLTEpICYmXHJcbiAgICAgICAgICAgICAgICAoc2hlZXROYW1lcy5pbmRleE9mKGxpbmtTaGVldC50YXJnZXQpID4gLTEpKSB7XHJcbiAgICAgICAgICAgICAgICBzaGVldFR5cGVzLmxpbmtTaGVldE5hbWVzLnB1c2goc2hlZXROYW1lKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBzaGVldFR5cGVzLm5vZGVzU2hlZXROYW1lcy5wdXNoKHNoZWV0TmFtZSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBzaGVldFR5cGVzO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHBhcnNlQ29sdW1uTGlua05hbWUoY29sTmFtZSwgc2hlZXRzKSB7XHJcbiAgICAgICAgdmFyIGxpbmtOYW1lcyA9IGNvbE5hbWUuc3BsaXQoXCIuXCIpO1xyXG4gICAgICAgIGlmICgobGlua05hbWVzLmxlbmd0aCA9PSAyKSAmJlxyXG4gICAgICAgICAgICAoc2hlZXRzW2xpbmtOYW1lc1swXV0gIT0gbnVsbCkgJiZcclxuICAgICAgICAgICAgKHNoZWV0c1tsaW5rTmFtZXNbMF1dLnByb3BlcnR5TmFtZXMuaW5kZXhPZihsaW5rTmFtZXNbMV0pID4gLTEpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBzaGVldE5hbWU6IGxpbmtOYW1lc1swXSxcclxuICAgICAgICAgICAgICAgIHByb3BlcnR5TmFtZTogbGlua05hbWVzWzFdXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHBhcnNlTGlua1NoZWV0TmFtZShzaGVldE5hbWUpIHtcclxuICAgICAgICB2YXIgbm9kZU5hbWVzID0gc2hlZXROYW1lLnNwbGl0KFwiLVwiKTtcclxuICAgICAgICBpZiAobm9kZU5hbWVzLmxlbmd0aCA9PSAyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBzb3VyY2U6IG5vZGVOYW1lc1swXSxcclxuICAgICAgICAgICAgICAgIHRhcmdldDogbm9kZU5hbWVzWzFdXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbW9kZWw7XHJcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNwcmVhZHNoZWV0S2V5LCBvbkxvYWRlZCkge1xyXG4gICAgLy8gR2V0IHNoZWV0IGNvdW50XHJcbiAgICBnZXRTaGVldENvdW50KHNwcmVhZHNoZWV0S2V5LCBmdW5jdGlvbiBvblN1Y2Nlc3Moc2hlZXRDb3VudCkge1xyXG4gICAgICAgIC8vIExvYWQgYWxsIHNoZWV0c1xyXG4gICAgICAgIGxvYWRTaGVldHMoc3ByZWFkc2hlZXRLZXksIHNoZWV0Q291bnQpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgZnVuY3Rpb24gbG9hZFNoZWV0cyhzcHJlYWRzaGVldEtleSwgc2hlZXRDb3VudCkge1xyXG4gICAgICAgIHZhciBzcHJlYWRzaGVldCA9IHt9O1xyXG4gICAgICAgIHZhciBsb2FkZWRTaGVldENvdW50ID0gMDtcclxuICAgICAgICBmb3IgKGkgPSAxOyBpIDw9IHNoZWV0Q291bnQ7IGkrKykge1xyXG4gICAgICAgICAgICBsb2FkU2hlZXQoc3ByZWFkc2hlZXQsIHNwcmVhZHNoZWV0S2V5LCBpKS50aGVuKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgbG9hZGVkU2hlZXRDb3VudCArPSAxO1xyXG4gICAgICAgICAgICAgICAgaWYgKGxvYWRlZFNoZWV0Q291bnQgPT0gc2hlZXRDb3VudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG9uTG9hZGVkKHNwcmVhZHNoZWV0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbG9hZFNoZWV0KHNwcmVhZHNoZWV0LCBzcHJlYWRzaGVldEtleSwgc2hlZXRJbmRleCkge1xyXG4gICAgICAgIHJldHVybiBnZXRTaGVldChzcHJlYWRzaGVldEtleSwgc2hlZXRJbmRleCwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcclxuICAgICAgICAgICAgdmFyIHNoZWV0ID0gc3ByZWFkc2hlZXRbcmVzcG9uc2UuZmVlZC50aXRsZS4kdF0gPSB7XHJcbiAgICAgICAgICAgICAgICBoZWFkZXI6IFtdLFxyXG4gICAgICAgICAgICAgICAgcm93czogW10sXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAkLmVhY2gocmVzcG9uc2UuZmVlZC5lbnRyeSwgZnVuY3Rpb24oaSwgZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGUuZ3MkY2VsbC5yb3cgPT0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNoZWV0LmhlYWRlcltlLmdzJGNlbGwuY29sIC0gMV0gPSBlLmNvbnRlbnQuJHQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSBlLmdzJGNlbGwucm93IC0gMjtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2hlZXQucm93c1tpbmRleF0gPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzaGVldC5yb3dzW2luZGV4XSA9IHt9O1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBzaGVldC5yb3dzW2luZGV4XVtzaGVldC5oZWFkZXJbZS5ncyRjZWxsLmNvbCAtIDFdXSA9IGUuY29udGVudC4kdDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0U2hlZXQoc3ByZWFkc2hlZXRLZXksIHNoZWV0SW5kZXgsIG9uU3VjY2Vzcykge1xyXG4gICAgICAgIHJldHVybiAkLmFqYXgoe1xyXG4gICAgICAgICAgICB1cmw6IFwiaHR0cHM6Ly9zcHJlYWRzaGVldHMuZ29vZ2xlLmNvbS9mZWVkcy9jZWxscy9cIiArIHNwcmVhZHNoZWV0S2V5ICsgXCIvXCIgKyBzaGVldEluZGV4ICsgXCIvcHVibGljL3ZhbHVlcz9hbHQ9anNvbi1pbi1zY3JpcHRcIixcclxuICAgICAgICAgICAganNvbnA6IFwiY2FsbGJhY2tcIixcclxuICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvbnBcIixcclxuICAgICAgICAgICAgc3VjY2Vzczogb25TdWNjZXNzXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0U2hlZXRDb3VudChzcHJlYWRzaGVldEtleSwgb25TdWNjZXNzKSB7XHJcbiAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgICAgdXJsOiBcImh0dHBzOi8vc3ByZWFkc2hlZXRzLmdvb2dsZS5jb20vZmVlZHMvd29ya3NoZWV0cy9cIiArIHNwcmVhZHNoZWV0S2V5ICsgXCIvcHVibGljL2Z1bGw/YWx0PWpzb24taW4tc2NyaXB0XCIsXHJcbiAgICAgICAgICAgIGpzb25wOiBcImNhbGxiYWNrXCIsXHJcbiAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25wXCIsXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgICAgICAgICBvblN1Y2Nlc3MocmVzcG9uc2UuZmVlZC5lbnRyeS5sZW5ndGgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn0iXX0=
