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
        spreadsheet(spreadsheetKey, function(spreadsheet) {
            d3sheet.spreadsheet = spreadsheet;

            // Initialize document
            document.title = spreadsheet.title;

            // Initialize info section
            var infoModule = require("./info");
            var info = infoModule(d3sheet.infoContainerId, spreadsheet.title);

            // Create model from spreadsheet
            var modelModule = require("./model");
            d3sheet.model = modelModule(d3sheet.spreadsheet);

            // Create graph from model
            var graphModule = require("./graph");
            d3sheet.graph = graphModule(d3sheet.model);

            // Create D3 force layout from graph
            var forceModule = require("./force");
            forceModule(d3sheet.graph, d3sheet.svgContainerId, d3sheet.svg, info);
        });
    }

    function checkRequirements() {
        if (typeof d3 === "undefined")
            throw new Error("D3 library not found!");
        if (typeof $ === "undefined")
            throw new Error("jQuery not found!");
    }
}();
},{"./force":2,"./graph":3,"./info":4,"./model":5,"./spreadsheet":6}],2:[function(require,module,exports){
module.exports = function(graph, svgContainerId, svg, info) {
    var node = [],
        nodeLabel = [],
        link = [],
        linkLabel = [],
        colors = d3.scale.category20();

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
            .attr("fill", nodeFillColor)
            .call(force.drag)
            .on("click", nodeClick);

        svg.selectAll(".node-label")
            .data(graph.nodes)
            .enter()
            .append("text")
            .attr("class", "node-label")
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .text(function(n) { return n.label; })
            .call(force.drag)
            .on("click", nodeClick);

        selectAll();
        force.start();
    }

    function nodeClick(node) {
        info.showNode(node, graph.nodes, nodeFillColor(node));
    }

    function nodeFillColor(node) {
        return colors(node.sheetName);
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
            node.label = node.properties[sheet.label];
            node.sheetName = sheet.name;
        });
    });

    // Create links
    $.each(model.sheets, function(i, sheet) {
        // For all nodes
        $.each(sheet.nodes, function(j, node) {
            // For all link names
            $.each(sheet.linkNames, function(k, linkName) {
                // For all target nodes
                var graphTargetIndexes = [];
                $.each(node.links[linkName], function(l, targetIndex) {
                    var link = {
                        source: node.graphIndex,
                        target: model.sheets[linkName].nodes[targetIndex].graphIndex
                    };
                    graphTargetIndexes.push(link.target);
                    graph.links.push(link);
                });

                // Replace model indexes with graph indexes
                node.links[linkName] = graphTargetIndexes;
            });
        });
    });

    return graph;
}
},{}],4:[function(require,module,exports){
module.exports = function(infoContainerId, title) {
    // Set heading
    $("#" + infoContainerId + " h1").text(title);

    this.showNode = function(node, nodes, fillColor) {
        $("#d3sheet-node-info h2").text(node.label);
        $("#d3sheet-node-info header").css("background-color", fillColor);
        $("#d3sheet-node-sheet-name").text(node.sheetName);

        var ul = $("#d3sheet-node-properties");
        ul.empty();

        // Show node properties
        var propertyNames = Object.keys(node.properties);
        $.each(propertyNames, function(i, propertyName) {
            addProperty(propertyName, node.properties[propertyName]);
        });

        // Show node links
        var linkNames = Object.keys(node.links)
        $.each(linkNames, function(i, linkName) {
            var targetNames = "";
            $.each(node.links[linkName], function(i, targetIndex) {
                if (targetNames != "")
                    targetNames = targetNames + ", ";
                targetNames = targetNames + nodes[targetIndex].label;
            });
            addProperty(linkName, targetNames);
        });

        function addProperty(name, value) {
            ul.append("<li><span class=\"d3sheet-node-property-name\">" + name +
                ":</span> <span class=\"d3sheet-node-property-value\">" + value + "</span></li>");
        }
    }

    return this;
}
},{}],5:[function(require,module,exports){
module.exports = function(spreadsheet) {
    var model = {
        sheets: {},
        settings: {}
    };

    var sheetTypes = getSheetTypes(spreadsheet);
    model.sheets = getGraph(spreadsheet, sheetTypes.nodesSheetNames);
    if (sheetTypes.settingsSheetName != null)
        model.settings = spreadsheet.sheets[sheetTypes.settingsSheetName];

    function getGraph(spreadsheet, nodeSheetNames) {
        // Create nodes with properties
        var sheets = {};
        $.each(nodeSheetNames, function(i, nodeSheetName) {
            sheets[nodeSheetName] = getNodes(spreadsheet.sheets[nodeSheetName], nodeSheetName);
        });

        // Create link names
        $.each(nodeSheetNames, function(i, nodeSheetName) {
            createLinkNames(sheets, spreadsheet.sheets[nodeSheetName], nodeSheetName);
        });

        // Create links from node sheets
        $.each(nodeSheetNames, function(i, nodeSheetName) {
            createLinks(sheets, spreadsheet.sheets[nodeSheetName], nodeSheetName);
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
                            if (row[colName].indexOf(targetNode.properties[linkTarget.propertyName]) > -1) {
                                if (source.nodes[i].links[linkTarget.sheetName] == null)
                                    source.nodes[i].links[linkTarget.sheetName] = [];

                                // Add index of the target node to the source node
                                source.nodes[i].links[linkTarget.sheetName].push(k);
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

        function getNodes(nodeSheet, nodeSheetName) {
            var result = {
                name: nodeSheetName,
                label: nodeSheet.header[0],
                propertyNames: [],
                linkNames: [],
                nodes: []
            };

            // Get nodes and properties
            $.each(nodeSheet.rows, function(i, row) {
                result.nodes.push({
                    properties: getNodeProperties(row),
                    links: {}
                });
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
        var sheetNames = Object.keys(spreadsheet.sheets);
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
},{}],6:[function(require,module,exports){
module.exports = function(spreadsheetKey, onLoaded) {
    // Get sheet count
    getSpreadsheetInfo(spreadsheetKey, function onSuccess(info) {
        // Load all sheets
        loadSheets(spreadsheetKey, info);
    });

    function loadSheets(spreadsheetKey, info) {
        var spreadsheet = {
            title: info.title,
            sheets: {}
        };
        var loadedSheetCount = 0;
        for (i = 1; i <= info.sheetCount; i++) {
            loadSheet(spreadsheet, spreadsheetKey, i).then(function() {
                loadedSheetCount += 1;
                if (loadedSheetCount == info.sheetCount) {
                    onLoaded(spreadsheet);
                }
            })
        }
    }

    function loadSheet(spreadsheet, spreadsheetKey, sheetIndex) {
        return getSheet(spreadsheetKey, sheetIndex, function(response) {
            var sheet = spreadsheet.sheets[response.feed.title.$t] = {
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

    function getSpreadsheetInfo(spreadsheetKey, onSuccess) {
        $.ajax({
            url: "https://spreadsheets.google.com/feeds/worksheets/" + spreadsheetKey + "/public/full?alt=json-in-script",
            jsonp: "callback",
            dataType: "jsonp",
            success: function(response) {
                var info = {
                    sheetCount: response.feed.entry.length,
                    title: response.feed.title.$t
                };
                onSuccess(info);
            }
        });
    }
}
},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2Jpbi9ub2RlLXY1LjAuMC1saW51eC14NjQvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwic3JjL2Qzc2hlZXQuanMiLCJzcmMvZm9yY2UuanMiLCJzcmMvZ3JhcGguanMiLCJzcmMvaW5mby5qcyIsInNyYy9tb2RlbC5qcyIsInNyYy9zcHJlYWRzaGVldC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiIWZ1bmN0aW9uKCkge1xuICAgIGNoZWNrUmVxdWlyZW1lbnRzKCk7XG5cbiAgICB2YXIgZDNzaGVldCA9IHtcbiAgICAgICAgdmVyOiBcIjEuMC4wXCIsXG4gICAgICAgIHN2Z0NvbnRhaW5lcklkOiBcIlwiLFxuICAgICAgICBpbmZvQ29udGFpbmVySWQ6IFwiXCIsXG4gICAgICAgIHN2Zzoge30sXG4gICAgICAgIHNwcmVhZHNoZWV0OiB7fSxcbiAgICAgICAgbW9kZWw6IHt9XG4gICAgfTtcblxuICAgIG1vZHVsZS5leHBvcnRzID0gZDNzaGVldDtcblxuICAgIC8qKlxuICAgICogSW5pdGlhbGl6ZSBEMyBzaGVldC5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb250YWluZXJJZCAtIGlkZW50aWZpZXIgb2YgdGhlIG1haW4gRElWLlxuICAgICoqL1xuICAgIGQzc2hlZXQuaW5pdCA9IGZ1bmN0aW9uKHN2Z0NvbnRhaW5lcklkLCBpbmZvQ29udGFpbmVySWQpIHtcbiAgICAgICAgaWYgKHN2Z0NvbnRhaW5lcklkID09IG51bGwpXG4gICAgICAgICAgICBzdmdDb250YWluZXJJZCA9IFwiZDNzaGVldC1zdmdcIjtcbiAgICAgICAgZDNzaGVldC5zdmdDb250YWluZXJJZCA9IHN2Z0NvbnRhaW5lcklkO1xuXG4gICAgICAgIGlmIChpbmZvQ29udGFpbmVySWQgPT0gbnVsbClcbiAgICAgICAgICAgIGluZm9Db250YWluZXJJZCA9IFwiZDNzaGVldC1pbmZvXCI7XG4gICAgICAgIGQzc2hlZXQuaW5mb0NvbnRhaW5lcklkID0gaW5mb0NvbnRhaW5lcklkO1xuXG4gICAgICAgIHZhciBzdmdDb250YWluZXIgPSAkKFwiI1wiICsgc3ZnQ29udGFpbmVySWQpLFxuICAgICAgICAgICAgd2lkdGggPSBzdmdDb250YWluZXIud2lkdGgoKSxcbiAgICAgICAgICAgIGhlaWdodCA9IHN2Z0NvbnRhaW5lci5oZWlnaHQoKTtcblxuICAgICAgICAvLyBDcmVhdGUgU1ZHIGVsZW1lbnRcbiAgICAgICAgZDNzaGVldC5zdmcgPSBkMy5zZWxlY3QoXCIjXCIgKyBzdmdDb250YWluZXJJZClcbiAgICAgICAgICAgIC5hcHBlbmQoXCJzdmdcIilcbiAgICAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgXCIxMDAlXCIpXG4gICAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCBcIjEwMCVcIilcbiAgICAgICAgICAgIC5hdHRyKCd2aWV3Qm94JywgXCIwIDAgXCIgKyB3aWR0aCArIFwiIFwiICsgaGVpZ2h0KTtcblxuICAgICAgICAvLyBDcmVhdGUgaW5mbyBwYW5lbFxuICAgICAgICBkMy5zZWxlY3QoXCIjXCIgKyBpbmZvQ29udGFpbmVySWQpXG4gICAgICAgICAgICAuYXBwZW5kKFwiZGl2XCIpO1xuXG4gICAgICAgIHJldHVybiBkM3NoZWV0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICogTG9hZCBkYXRhIGZyb20gc3ByZWFkc2hlZXQuXG4gICAgKiovXG4gICAgZDNzaGVldC5sb2FkID0gZnVuY3Rpb24oc3ByZWFkc2hlZXRLZXkpIHtcbiAgICAgICAgLy8gTG9hZCBzcHJlYWRzaGVldFxuICAgICAgICB2YXIgc3ByZWFkc2hlZXQgPSByZXF1aXJlKFwiLi9zcHJlYWRzaGVldFwiKTtcbiAgICAgICAgc3ByZWFkc2hlZXQoc3ByZWFkc2hlZXRLZXksIGZ1bmN0aW9uKHNwcmVhZHNoZWV0KSB7XG4gICAgICAgICAgICBkM3NoZWV0LnNwcmVhZHNoZWV0ID0gc3ByZWFkc2hlZXQ7XG5cbiAgICAgICAgICAgIC8vIEluaXRpYWxpemUgZG9jdW1lbnRcbiAgICAgICAgICAgIGRvY3VtZW50LnRpdGxlID0gc3ByZWFkc2hlZXQudGl0bGU7XG5cbiAgICAgICAgICAgIC8vIEluaXRpYWxpemUgaW5mbyBzZWN0aW9uXG4gICAgICAgICAgICB2YXIgaW5mb01vZHVsZSA9IHJlcXVpcmUoXCIuL2luZm9cIik7XG4gICAgICAgICAgICB2YXIgaW5mbyA9IGluZm9Nb2R1bGUoZDNzaGVldC5pbmZvQ29udGFpbmVySWQsIHNwcmVhZHNoZWV0LnRpdGxlKTtcblxuICAgICAgICAgICAgLy8gQ3JlYXRlIG1vZGVsIGZyb20gc3ByZWFkc2hlZXRcbiAgICAgICAgICAgIHZhciBtb2RlbE1vZHVsZSA9IHJlcXVpcmUoXCIuL21vZGVsXCIpO1xuICAgICAgICAgICAgZDNzaGVldC5tb2RlbCA9IG1vZGVsTW9kdWxlKGQzc2hlZXQuc3ByZWFkc2hlZXQpO1xuXG4gICAgICAgICAgICAvLyBDcmVhdGUgZ3JhcGggZnJvbSBtb2RlbFxuICAgICAgICAgICAgdmFyIGdyYXBoTW9kdWxlID0gcmVxdWlyZShcIi4vZ3JhcGhcIik7XG4gICAgICAgICAgICBkM3NoZWV0LmdyYXBoID0gZ3JhcGhNb2R1bGUoZDNzaGVldC5tb2RlbCk7XG5cbiAgICAgICAgICAgIC8vIENyZWF0ZSBEMyBmb3JjZSBsYXlvdXQgZnJvbSBncmFwaFxuICAgICAgICAgICAgdmFyIGZvcmNlTW9kdWxlID0gcmVxdWlyZShcIi4vZm9yY2VcIik7XG4gICAgICAgICAgICBmb3JjZU1vZHVsZShkM3NoZWV0LmdyYXBoLCBkM3NoZWV0LnN2Z0NvbnRhaW5lcklkLCBkM3NoZWV0LnN2ZywgaW5mbyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNoZWNrUmVxdWlyZW1lbnRzKCkge1xuICAgICAgICBpZiAodHlwZW9mIGQzID09PSBcInVuZGVmaW5lZFwiKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRDMgbGlicmFyeSBub3QgZm91bmQhXCIpO1xuICAgICAgICBpZiAodHlwZW9mICQgPT09IFwidW5kZWZpbmVkXCIpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJqUXVlcnkgbm90IGZvdW5kIVwiKTtcbiAgICB9XG59KCk7IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihncmFwaCwgc3ZnQ29udGFpbmVySWQsIHN2ZywgaW5mbykge1xuICAgIHZhciBub2RlID0gW10sXG4gICAgICAgIG5vZGVMYWJlbCA9IFtdLFxuICAgICAgICBsaW5rID0gW10sXG4gICAgICAgIGxpbmtMYWJlbCA9IFtdLFxuICAgICAgICBjb2xvcnMgPSBkMy5zY2FsZS5jYXRlZ29yeTIwKCk7XG5cbiAgICB2YXIgc3ZnQ29udGFpbmVyID0gJChcIiNcIiArIHN2Z0NvbnRhaW5lcklkKSxcbiAgICAgICAgd2lkdGggPSBzdmdDb250YWluZXIud2lkdGgoKSxcbiAgICAgICAgaGVpZ2h0ID0gc3ZnQ29udGFpbmVyLmhlaWdodCgpO1xuXG4gICAgc2VsZWN0QWxsKCk7XG5cbiAgICB2YXIgZm9yY2UgPSBkMy5sYXlvdXQuZm9yY2UoKVxuICAgICAgICAuc2l6ZShbd2lkdGgsIGhlaWdodF0pXG4gICAgICAgIC5saW5rRGlzdGFuY2UoMzApIC8vIFRPRE86IE1vdmUgdG8gc2V0dGluZ3NcbiAgICAgICAgLmNoYXJnZSgtNTAwMCkgLy8gVE9ETzogTW92ZSB0byBzZXR0aW5nc1xuICAgICAgICAuZ3Jhdml0eSgwLjUpIC8vIFRPRE86IE1vdmUgdG8gc2V0dGluZ3NcbiAgICAgICAgLm5vZGVzKGdyYXBoLm5vZGVzKVxuICAgICAgICAubGlua3MoZ3JhcGgubGlua3MpXG4gICAgICAgIC5vbihcInRpY2tcIiwgb25UaWNrKTtcblxuICAgIHJlc3RhcnQoKTtcblxuICAgIGZ1bmN0aW9uIHJlc3RhcnQoKSB7XG4gICAgICAgIHN2Zy5zZWxlY3RBbGwoXCIubGlua1wiKVxuICAgICAgICAgICAgLmRhdGEoZ3JhcGgubGlua3MpXG4gICAgICAgICAgICAuZW50ZXIoKVxuICAgICAgICAgICAgLmFwcGVuZChcImxpbmVcIilcbiAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJsaW5rXCIpO1xuXG4vLyAgICAgICAgc3ZnLnNlbGVjdEFsbChcIi5saW5rLWxhYmVsXCIpLmRhdGEoZ3JhcGgubGlua3MpXG4vLyAgICAgICAgICAgIC5lbnRlcigpXG4vLyAgICAgICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4vLyAgICAgICAgICAgIC50ZXh0KGxpbmtUZXh0KVxuLy8gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibGluay1sYWJlbFwiKVxuLy8gICAgICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpO1xuXG4gICAgICAgIHN2Zy5zZWxlY3RBbGwoXCIubm9kZVwiKVxuICAgICAgICAgICAgLmRhdGEoZ3JhcGgubm9kZXMpXG4gICAgICAgICAgICAuZW50ZXIoKVxuICAgICAgICAgICAgLmFwcGVuZChcImNpcmNsZVwiKVxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcIm5vZGVcIilcbiAgICAgICAgICAgIC5hdHRyKFwiclwiLCAzMCkgLy8gVE9ETzogU2V0dGluZ3NcbiAgICAgICAgICAgIC5hdHRyKFwieFwiLCAwKVxuICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIDApXG4gICAgICAgICAgICAuYXR0cihcImZpbGxcIiwgbm9kZUZpbGxDb2xvcilcbiAgICAgICAgICAgIC5jYWxsKGZvcmNlLmRyYWcpXG4gICAgICAgICAgICAub24oXCJjbGlja1wiLCBub2RlQ2xpY2spO1xuXG4gICAgICAgIHN2Zy5zZWxlY3RBbGwoXCIubm9kZS1sYWJlbFwiKVxuICAgICAgICAgICAgLmRhdGEoZ3JhcGgubm9kZXMpXG4gICAgICAgICAgICAuZW50ZXIoKVxuICAgICAgICAgICAgLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJub2RlLWxhYmVsXCIpXG4gICAgICAgICAgICAuYXR0cihcImR5XCIsIFwiLjM1ZW1cIilcbiAgICAgICAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIilcbiAgICAgICAgICAgIC50ZXh0KGZ1bmN0aW9uKG4pIHsgcmV0dXJuIG4ubGFiZWw7IH0pXG4gICAgICAgICAgICAuY2FsbChmb3JjZS5kcmFnKVxuICAgICAgICAgICAgLm9uKFwiY2xpY2tcIiwgbm9kZUNsaWNrKTtcblxuICAgICAgICBzZWxlY3RBbGwoKTtcbiAgICAgICAgZm9yY2Uuc3RhcnQoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBub2RlQ2xpY2sobm9kZSkge1xuICAgICAgICBpbmZvLnNob3dOb2RlKG5vZGUsIGdyYXBoLm5vZGVzLCBub2RlRmlsbENvbG9yKG5vZGUpKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBub2RlRmlsbENvbG9yKG5vZGUpIHtcbiAgICAgICAgcmV0dXJuIGNvbG9ycyhub2RlLnNoZWV0TmFtZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2VsZWN0QWxsKCkge1xuICAgICAgICBub2RlID0gc3ZnLnNlbGVjdEFsbChcIi5ub2RlXCIpO1xuICAgICAgICBub2RlTGFiZWwgPSBzdmcuc2VsZWN0QWxsKFwiLm5vZGUtbGFiZWxcIik7XG4gICAgICAgIGxpbmsgPSBzdmcuc2VsZWN0QWxsKFwiLmxpbmtcIik7XG4gICAgICAgIGxpbmtMYWJlbCA9IHN2Zy5zZWxlY3RBbGwoXCIubGluay1sYWJlbFwiKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBvblRpY2soKSB7XG4gICAgICAgIGxpbmsuYXR0cihcIngxXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuc291cmNlLng7IH0pXG4gICAgICAgICAgICAuYXR0cihcInkxXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuc291cmNlLnk7IH0pXG4gICAgICAgICAgICAuYXR0cihcIngyXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGFyZ2V0Lng7IH0pXG4gICAgICAgICAgICAuYXR0cihcInkyXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGFyZ2V0Lnk7IH0pO1xuXG4gICAgICAgIGxpbmtMYWJlbFxuICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKGQuc291cmNlLnggKyBkLnRhcmdldC54KS8yOyB9KVxuICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKGQuc291cmNlLnkgKyBkLnRhcmdldC55KS8yOyB9KTtcblxuICAgICAgICBub2RlLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgcmV0dXJuIFwidHJhbnNsYXRlKFwiICsgZC54ICsgXCIsXCIgKyBkLnkgKyBcIilcIjtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbm9kZUxhYmVsXG4gICAgICAgICAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54OyB9KVxuICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueTsgfSk7XG4gICAgfVxufSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24obW9kZWwpIHtcbiAgICB2YXIgZ3JhcGggPSB7XG4gICAgICAgIG5vZGVzOiBbXSxcbiAgICAgICAgbGlua3M6IFtdXG4gICAgfTtcblxuICAgIC8vIEZvciBhbGwgc2hlZXRzXG4gICAgJC5lYWNoKG1vZGVsLnNoZWV0cywgZnVuY3Rpb24oaSwgc2hlZXQpIHtcbiAgICAgICAgLy8gRm9yIGFsbCBub2Rlc1xuICAgICAgICAkLmVhY2goc2hlZXQubm9kZXMsIGZ1bmN0aW9uKGosIG5vZGUpIHtcbiAgICAgICAgICAgIC8vIEFkZCBub2RlIHRvIGdyYXBoXG4gICAgICAgICAgICBub2RlLmdyYXBoSW5kZXggPSBncmFwaC5ub2Rlcy5wdXNoKG5vZGUpIC0gMTtcbiAgICAgICAgICAgIG5vZGUubGFiZWwgPSBub2RlLnByb3BlcnRpZXNbc2hlZXQubGFiZWxdO1xuICAgICAgICAgICAgbm9kZS5zaGVldE5hbWUgPSBzaGVldC5uYW1lO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSBsaW5rc1xuICAgICQuZWFjaChtb2RlbC5zaGVldHMsIGZ1bmN0aW9uKGksIHNoZWV0KSB7XG4gICAgICAgIC8vIEZvciBhbGwgbm9kZXNcbiAgICAgICAgJC5lYWNoKHNoZWV0Lm5vZGVzLCBmdW5jdGlvbihqLCBub2RlKSB7XG4gICAgICAgICAgICAvLyBGb3IgYWxsIGxpbmsgbmFtZXNcbiAgICAgICAgICAgICQuZWFjaChzaGVldC5saW5rTmFtZXMsIGZ1bmN0aW9uKGssIGxpbmtOYW1lKSB7XG4gICAgICAgICAgICAgICAgLy8gRm9yIGFsbCB0YXJnZXQgbm9kZXNcbiAgICAgICAgICAgICAgICB2YXIgZ3JhcGhUYXJnZXRJbmRleGVzID0gW107XG4gICAgICAgICAgICAgICAgJC5lYWNoKG5vZGUubGlua3NbbGlua05hbWVdLCBmdW5jdGlvbihsLCB0YXJnZXRJbmRleCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbGluayA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZTogbm9kZS5ncmFwaEluZGV4LFxuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0OiBtb2RlbC5zaGVldHNbbGlua05hbWVdLm5vZGVzW3RhcmdldEluZGV4XS5ncmFwaEluZGV4XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGdyYXBoVGFyZ2V0SW5kZXhlcy5wdXNoKGxpbmsudGFyZ2V0KTtcbiAgICAgICAgICAgICAgICAgICAgZ3JhcGgubGlua3MucHVzaChsaW5rKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIFJlcGxhY2UgbW9kZWwgaW5kZXhlcyB3aXRoIGdyYXBoIGluZGV4ZXNcbiAgICAgICAgICAgICAgICBub2RlLmxpbmtzW2xpbmtOYW1lXSA9IGdyYXBoVGFyZ2V0SW5kZXhlcztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBncmFwaDtcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGluZm9Db250YWluZXJJZCwgdGl0bGUpIHtcbiAgICAvLyBTZXQgaGVhZGluZ1xuICAgICQoXCIjXCIgKyBpbmZvQ29udGFpbmVySWQgKyBcIiBoMVwiKS50ZXh0KHRpdGxlKTtcblxuICAgIHRoaXMuc2hvd05vZGUgPSBmdW5jdGlvbihub2RlLCBub2RlcywgZmlsbENvbG9yKSB7XG4gICAgICAgICQoXCIjZDNzaGVldC1ub2RlLWluZm8gaDJcIikudGV4dChub2RlLmxhYmVsKTtcbiAgICAgICAgJChcIiNkM3NoZWV0LW5vZGUtaW5mbyBoZWFkZXJcIikuY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiLCBmaWxsQ29sb3IpO1xuICAgICAgICAkKFwiI2Qzc2hlZXQtbm9kZS1zaGVldC1uYW1lXCIpLnRleHQobm9kZS5zaGVldE5hbWUpO1xuXG4gICAgICAgIHZhciB1bCA9ICQoXCIjZDNzaGVldC1ub2RlLXByb3BlcnRpZXNcIik7XG4gICAgICAgIHVsLmVtcHR5KCk7XG5cbiAgICAgICAgLy8gU2hvdyBub2RlIHByb3BlcnRpZXNcbiAgICAgICAgdmFyIHByb3BlcnR5TmFtZXMgPSBPYmplY3Qua2V5cyhub2RlLnByb3BlcnRpZXMpO1xuICAgICAgICAkLmVhY2gocHJvcGVydHlOYW1lcywgZnVuY3Rpb24oaSwgcHJvcGVydHlOYW1lKSB7XG4gICAgICAgICAgICBhZGRQcm9wZXJ0eShwcm9wZXJ0eU5hbWUsIG5vZGUucHJvcGVydGllc1twcm9wZXJ0eU5hbWVdKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gU2hvdyBub2RlIGxpbmtzXG4gICAgICAgIHZhciBsaW5rTmFtZXMgPSBPYmplY3Qua2V5cyhub2RlLmxpbmtzKVxuICAgICAgICAkLmVhY2gobGlua05hbWVzLCBmdW5jdGlvbihpLCBsaW5rTmFtZSkge1xuICAgICAgICAgICAgdmFyIHRhcmdldE5hbWVzID0gXCJcIjtcbiAgICAgICAgICAgICQuZWFjaChub2RlLmxpbmtzW2xpbmtOYW1lXSwgZnVuY3Rpb24oaSwgdGFyZ2V0SW5kZXgpIHtcbiAgICAgICAgICAgICAgICBpZiAodGFyZ2V0TmFtZXMgIT0gXCJcIilcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0TmFtZXMgPSB0YXJnZXROYW1lcyArIFwiLCBcIjtcbiAgICAgICAgICAgICAgICB0YXJnZXROYW1lcyA9IHRhcmdldE5hbWVzICsgbm9kZXNbdGFyZ2V0SW5kZXhdLmxhYmVsO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBhZGRQcm9wZXJ0eShsaW5rTmFtZSwgdGFyZ2V0TmFtZXMpO1xuICAgICAgICB9KTtcblxuICAgICAgICBmdW5jdGlvbiBhZGRQcm9wZXJ0eShuYW1lLCB2YWx1ZSkge1xuICAgICAgICAgICAgdWwuYXBwZW5kKFwiPGxpPjxzcGFuIGNsYXNzPVxcXCJkM3NoZWV0LW5vZGUtcHJvcGVydHktbmFtZVxcXCI+XCIgKyBuYW1lICtcbiAgICAgICAgICAgICAgICBcIjo8L3NwYW4+IDxzcGFuIGNsYXNzPVxcXCJkM3NoZWV0LW5vZGUtcHJvcGVydHktdmFsdWVcXFwiPlwiICsgdmFsdWUgKyBcIjwvc3Bhbj48L2xpPlwiKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xufSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc3ByZWFkc2hlZXQpIHtcbiAgICB2YXIgbW9kZWwgPSB7XG4gICAgICAgIHNoZWV0czoge30sXG4gICAgICAgIHNldHRpbmdzOiB7fVxuICAgIH07XG5cbiAgICB2YXIgc2hlZXRUeXBlcyA9IGdldFNoZWV0VHlwZXMoc3ByZWFkc2hlZXQpO1xuICAgIG1vZGVsLnNoZWV0cyA9IGdldEdyYXBoKHNwcmVhZHNoZWV0LCBzaGVldFR5cGVzLm5vZGVzU2hlZXROYW1lcyk7XG4gICAgaWYgKHNoZWV0VHlwZXMuc2V0dGluZ3NTaGVldE5hbWUgIT0gbnVsbClcbiAgICAgICAgbW9kZWwuc2V0dGluZ3MgPSBzcHJlYWRzaGVldC5zaGVldHNbc2hlZXRUeXBlcy5zZXR0aW5nc1NoZWV0TmFtZV07XG5cbiAgICBmdW5jdGlvbiBnZXRHcmFwaChzcHJlYWRzaGVldCwgbm9kZVNoZWV0TmFtZXMpIHtcbiAgICAgICAgLy8gQ3JlYXRlIG5vZGVzIHdpdGggcHJvcGVydGllc1xuICAgICAgICB2YXIgc2hlZXRzID0ge307XG4gICAgICAgICQuZWFjaChub2RlU2hlZXROYW1lcywgZnVuY3Rpb24oaSwgbm9kZVNoZWV0TmFtZSkge1xuICAgICAgICAgICAgc2hlZXRzW25vZGVTaGVldE5hbWVdID0gZ2V0Tm9kZXMoc3ByZWFkc2hlZXQuc2hlZXRzW25vZGVTaGVldE5hbWVdLCBub2RlU2hlZXROYW1lKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIGxpbmsgbmFtZXNcbiAgICAgICAgJC5lYWNoKG5vZGVTaGVldE5hbWVzLCBmdW5jdGlvbihpLCBub2RlU2hlZXROYW1lKSB7XG4gICAgICAgICAgICBjcmVhdGVMaW5rTmFtZXMoc2hlZXRzLCBzcHJlYWRzaGVldC5zaGVldHNbbm9kZVNoZWV0TmFtZV0sIG5vZGVTaGVldE5hbWUpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBDcmVhdGUgbGlua3MgZnJvbSBub2RlIHNoZWV0c1xuICAgICAgICAkLmVhY2gobm9kZVNoZWV0TmFtZXMsIGZ1bmN0aW9uKGksIG5vZGVTaGVldE5hbWUpIHtcbiAgICAgICAgICAgIGNyZWF0ZUxpbmtzKHNoZWV0cywgc3ByZWFkc2hlZXQuc2hlZXRzW25vZGVTaGVldE5hbWVdLCBub2RlU2hlZXROYW1lKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gVE9ETzogQ3JlYXRlIGxpbmtzIGZyb20gbGluayBzaGVldHNcblxuICAgICAgICBmdW5jdGlvbiBjcmVhdGVMaW5rcyhzaGVldHMsIG5vZGVTaGVldCwgbm9kZVNoZWV0TmFtZSkge1xuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IHNoZWV0c1tub2RlU2hlZXROYW1lXTtcblxuICAgICAgICAgICAgLy8gRm9yIGFsbCBzaGVldCByb3dzXG4gICAgICAgICAgICAkLmVhY2gobm9kZVNoZWV0LnJvd3MsIGZ1bmN0aW9uKGksIHJvdykge1xuICAgICAgICAgICAgICAgIC8vIEZvciBhbGwgc2hlZXQgY29sdW1uc1xuICAgICAgICAgICAgICAgIHZhciBjb2xOYW1lcyA9IE9iamVjdC5rZXlzKHJvdyk7XG4gICAgICAgICAgICAgICAgJC5lYWNoKGNvbE5hbWVzLCBmdW5jdGlvbihqLCBjb2xOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHRoaXMgaXMgYSBsaW5rIGNvbHVtblxuICAgICAgICAgICAgICAgICAgICB2YXIgbGlua1RhcmdldCA9IHBhcnNlQ29sdW1uTGlua05hbWUoY29sTmFtZSwgc2hlZXRzKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxpbmtUYXJnZXQgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRmluZCBpbmRleCBvZiB0aGUgdGFyZ2V0IG5vZGVcbiAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaChzaGVldHNbbGlua1RhcmdldC5zaGVldE5hbWVdLm5vZGVzLCBmdW5jdGlvbihrLCB0YXJnZXROb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGFyZ2V0IG5vZGUgcHJvcGVydHkgdmFsdWUgbWF0Y2hlc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyb3dbY29sTmFtZV0uaW5kZXhPZih0YXJnZXROb2RlLnByb3BlcnRpZXNbbGlua1RhcmdldC5wcm9wZXJ0eU5hbWVdKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzb3VyY2Uubm9kZXNbaV0ubGlua3NbbGlua1RhcmdldC5zaGVldE5hbWVdID09IG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2Uubm9kZXNbaV0ubGlua3NbbGlua1RhcmdldC5zaGVldE5hbWVdID0gW107XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWRkIGluZGV4IG9mIHRoZSB0YXJnZXQgbm9kZSB0byB0aGUgc291cmNlIG5vZGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlLm5vZGVzW2ldLmxpbmtzW2xpbmtUYXJnZXQuc2hlZXROYW1lXS5wdXNoKGspO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZUxpbmtOYW1lcyhzaGVldHMsIG5vZGVTaGVldCwgbm9kZVNoZWV0TmFtZSkge1xuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IHNoZWV0c1tub2RlU2hlZXROYW1lXTtcblxuICAgICAgICAgICAgLy8gR2V0IGxpbmsgbmFtZXNcbiAgICAgICAgICAgICQuZWFjaChub2RlU2hlZXQuaGVhZGVyLCBmdW5jdGlvbihpLCBwcm9wZXJ0eU5hbWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgbGlua1RhcmdldCA9IHBhcnNlQ29sdW1uTGlua05hbWUocHJvcGVydHlOYW1lLCBzaGVldHMpO1xuICAgICAgICAgICAgICAgIGlmIChsaW5rVGFyZ2V0ICE9IG51bGwpXG4gICAgICAgICAgICAgICAgICAgIHNvdXJjZS5saW5rTmFtZXMucHVzaChsaW5rVGFyZ2V0LnNoZWV0TmFtZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGdldE5vZGVzKG5vZGVTaGVldCwgbm9kZVNoZWV0TmFtZSkge1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHtcbiAgICAgICAgICAgICAgICBuYW1lOiBub2RlU2hlZXROYW1lLFxuICAgICAgICAgICAgICAgIGxhYmVsOiBub2RlU2hlZXQuaGVhZGVyWzBdLFxuICAgICAgICAgICAgICAgIHByb3BlcnR5TmFtZXM6IFtdLFxuICAgICAgICAgICAgICAgIGxpbmtOYW1lczogW10sXG4gICAgICAgICAgICAgICAgbm9kZXM6IFtdXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvLyBHZXQgbm9kZXMgYW5kIHByb3BlcnRpZXNcbiAgICAgICAgICAgICQuZWFjaChub2RlU2hlZXQucm93cywgZnVuY3Rpb24oaSwgcm93KSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0Lm5vZGVzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiBnZXROb2RlUHJvcGVydGllcyhyb3cpLFxuICAgICAgICAgICAgICAgICAgICBsaW5rczoge31cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBHZXQgcHJvcGVydHkgbmFtZXNcbiAgICAgICAgICAgICQuZWFjaChub2RlU2hlZXQuaGVhZGVyLCBmdW5jdGlvbihpLCBjb2xOYW1lKSB7XG4gICAgICAgICAgICAgICAgdmFyIGxpbmtUYXJnZXQgPSBjb2xOYW1lLnNwbGl0KFwiLlwiKTtcbiAgICAgICAgICAgICAgICBpZiAobGlua1RhcmdldC5sZW5ndGggPT0gMSlcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnByb3BlcnR5TmFtZXMucHVzaChjb2xOYW1lKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZ2V0Tm9kZVByb3BlcnRpZXMocm93KSB7XG4gICAgICAgICAgICB2YXIgbm9kZVByb3BlcnRpZXMgPSB7fTtcbiAgICAgICAgICAgIHZhciBjb2xOYW1lcyA9IE9iamVjdC5rZXlzKHJvdyk7XG4gICAgICAgICAgICAkLmVhY2goY29sTmFtZXMsIGZ1bmN0aW9uKGksIGNvbE5hbWUpIHtcbiAgICAgICAgICAgICAgICBpZiAoY29sTmFtZS5pbmRleE9mKFwiLlwiKSA9PSAtMSlcbiAgICAgICAgICAgICAgICAgICAgbm9kZVByb3BlcnRpZXNbY29sTmFtZV0gPSByb3dbY29sTmFtZV07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBub2RlUHJvcGVydGllcztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzaGVldHM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0U2hlZXRUeXBlcyhzcHJlYWRzaGVldCkge1xuICAgICAgICB2YXIgc2hlZXRUeXBlcyA9IHtcbiAgICAgICAgICAgIG5vZGVzU2hlZXROYW1lczogW10sXG4gICAgICAgICAgICBsaW5rU2hlZXROYW1lczogW10sXG4gICAgICAgICAgICBzZXR0aW5nc1NoZWV0TmFtZTogbnVsbFxuICAgICAgICB9O1xuICAgICAgICB2YXIgc2hlZXROYW1lcyA9IE9iamVjdC5rZXlzKHNwcmVhZHNoZWV0LnNoZWV0cyk7XG4gICAgICAgICQuZWFjaChzaGVldE5hbWVzLCBmdW5jdGlvbihpLCBzaGVldE5hbWUpIHtcbiAgICAgICAgICAgIGlmIChzaGVldE5hbWUgPT0gXCJzZXR0aW5nc1wiKSB7XG4gICAgICAgICAgICAgICAgc2hlZXRUeXBlcy5zZXR0aW5nc1NoZWV0TmFtZSA9IHNoZWV0TmFtZTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzaGVldE5hbWUuc2xpY2UoMCwgMSkgPT0gXCIjXCIpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgICAgICB2YXIgbGlua1NoZWV0ID0gcGFyc2VMaW5rU2hlZXROYW1lKHNoZWV0TmFtZSlcbiAgICAgICAgICAgIGlmICgobGlua1NoZWV0ICE9IG51bGwpICYmXG4gICAgICAgICAgICAgICAgKHNoZWV0TmFtZXMuaW5kZXhPZihsaW5rU2hlZXQuc291cmNlKSA+IC0xKSAmJlxuICAgICAgICAgICAgICAgIChzaGVldE5hbWVzLmluZGV4T2YobGlua1NoZWV0LnRhcmdldCkgPiAtMSkpIHtcbiAgICAgICAgICAgICAgICBzaGVldFR5cGVzLmxpbmtTaGVldE5hbWVzLnB1c2goc2hlZXROYW1lKVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2hlZXRUeXBlcy5ub2Rlc1NoZWV0TmFtZXMucHVzaChzaGVldE5hbWUpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gc2hlZXRUeXBlcztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZUNvbHVtbkxpbmtOYW1lKGNvbE5hbWUsIHNoZWV0cykge1xuICAgICAgICB2YXIgbGlua05hbWVzID0gY29sTmFtZS5zcGxpdChcIi5cIik7XG4gICAgICAgIGlmICgobGlua05hbWVzLmxlbmd0aCA9PSAyKSAmJlxuICAgICAgICAgICAgKHNoZWV0c1tsaW5rTmFtZXNbMF1dICE9IG51bGwpICYmXG4gICAgICAgICAgICAoc2hlZXRzW2xpbmtOYW1lc1swXV0ucHJvcGVydHlOYW1lcy5pbmRleE9mKGxpbmtOYW1lc1sxXSkgPiAtMSkpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc2hlZXROYW1lOiBsaW5rTmFtZXNbMF0sXG4gICAgICAgICAgICAgICAgcHJvcGVydHlOYW1lOiBsaW5rTmFtZXNbMV1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlTGlua1NoZWV0TmFtZShzaGVldE5hbWUpIHtcbiAgICAgICAgdmFyIG5vZGVOYW1lcyA9IHNoZWV0TmFtZS5zcGxpdChcIi1cIik7XG4gICAgICAgIGlmIChub2RlTmFtZXMubGVuZ3RoID09IDIpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc291cmNlOiBub2RlTmFtZXNbMF0sXG4gICAgICAgICAgICAgICAgdGFyZ2V0OiBub2RlTmFtZXNbMV1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gbW9kZWw7XG59IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzcHJlYWRzaGVldEtleSwgb25Mb2FkZWQpIHtcbiAgICAvLyBHZXQgc2hlZXQgY291bnRcbiAgICBnZXRTcHJlYWRzaGVldEluZm8oc3ByZWFkc2hlZXRLZXksIGZ1bmN0aW9uIG9uU3VjY2VzcyhpbmZvKSB7XG4gICAgICAgIC8vIExvYWQgYWxsIHNoZWV0c1xuICAgICAgICBsb2FkU2hlZXRzKHNwcmVhZHNoZWV0S2V5LCBpbmZvKTtcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIGxvYWRTaGVldHMoc3ByZWFkc2hlZXRLZXksIGluZm8pIHtcbiAgICAgICAgdmFyIHNwcmVhZHNoZWV0ID0ge1xuICAgICAgICAgICAgdGl0bGU6IGluZm8udGl0bGUsXG4gICAgICAgICAgICBzaGVldHM6IHt9XG4gICAgICAgIH07XG4gICAgICAgIHZhciBsb2FkZWRTaGVldENvdW50ID0gMDtcbiAgICAgICAgZm9yIChpID0gMTsgaSA8PSBpbmZvLnNoZWV0Q291bnQ7IGkrKykge1xuICAgICAgICAgICAgbG9hZFNoZWV0KHNwcmVhZHNoZWV0LCBzcHJlYWRzaGVldEtleSwgaSkudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBsb2FkZWRTaGVldENvdW50ICs9IDE7XG4gICAgICAgICAgICAgICAgaWYgKGxvYWRlZFNoZWV0Q291bnQgPT0gaW5mby5zaGVldENvdW50KSB7XG4gICAgICAgICAgICAgICAgICAgIG9uTG9hZGVkKHNwcmVhZHNoZWV0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbG9hZFNoZWV0KHNwcmVhZHNoZWV0LCBzcHJlYWRzaGVldEtleSwgc2hlZXRJbmRleCkge1xuICAgICAgICByZXR1cm4gZ2V0U2hlZXQoc3ByZWFkc2hlZXRLZXksIHNoZWV0SW5kZXgsIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICB2YXIgc2hlZXQgPSBzcHJlYWRzaGVldC5zaGVldHNbcmVzcG9uc2UuZmVlZC50aXRsZS4kdF0gPSB7XG4gICAgICAgICAgICAgICAgaGVhZGVyOiBbXSxcbiAgICAgICAgICAgICAgICByb3dzOiBbXSxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICQuZWFjaChyZXNwb25zZS5mZWVkLmVudHJ5LCBmdW5jdGlvbihpLCBlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGUuZ3MkY2VsbC5yb3cgPT0gMSkge1xuICAgICAgICAgICAgICAgICAgICBzaGVldC5oZWFkZXJbZS5ncyRjZWxsLmNvbCAtIDFdID0gZS5jb250ZW50LiR0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gZS5ncyRjZWxsLnJvdyAtIDI7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzaGVldC5yb3dzW2luZGV4XSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzaGVldC5yb3dzW2luZGV4XSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHNoZWV0LnJvd3NbaW5kZXhdW3NoZWV0LmhlYWRlcltlLmdzJGNlbGwuY29sIC0gMV1dID0gZS5jb250ZW50LiR0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRTaGVldChzcHJlYWRzaGVldEtleSwgc2hlZXRJbmRleCwgb25TdWNjZXNzKSB7XG4gICAgICAgIHJldHVybiAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiBcImh0dHBzOi8vc3ByZWFkc2hlZXRzLmdvb2dsZS5jb20vZmVlZHMvY2VsbHMvXCIgKyBzcHJlYWRzaGVldEtleSArIFwiL1wiICsgc2hlZXRJbmRleCArIFwiL3B1YmxpYy92YWx1ZXM/YWx0PWpzb24taW4tc2NyaXB0XCIsXG4gICAgICAgICAgICBqc29ucDogXCJjYWxsYmFja1wiLFxuICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvbnBcIixcbiAgICAgICAgICAgIHN1Y2Nlc3M6IG9uU3VjY2Vzc1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRTcHJlYWRzaGVldEluZm8oc3ByZWFkc2hlZXRLZXksIG9uU3VjY2Vzcykge1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiBcImh0dHBzOi8vc3ByZWFkc2hlZXRzLmdvb2dsZS5jb20vZmVlZHMvd29ya3NoZWV0cy9cIiArIHNwcmVhZHNoZWV0S2V5ICsgXCIvcHVibGljL2Z1bGw/YWx0PWpzb24taW4tc2NyaXB0XCIsXG4gICAgICAgICAgICBqc29ucDogXCJjYWxsYmFja1wiLFxuICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvbnBcIixcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGluZm8gPSB7XG4gICAgICAgICAgICAgICAgICAgIHNoZWV0Q291bnQ6IHJlc3BvbnNlLmZlZWQuZW50cnkubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogcmVzcG9uc2UuZmVlZC50aXRsZS4kdFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgb25TdWNjZXNzKGluZm8pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59Il19
