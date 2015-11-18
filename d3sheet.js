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
            node.labelProperty = sheet.label;
            node.label = node.properties[node.labelProperty];
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
        console.log(node);

        $("#d3sheet-node-info h2").text(node.label);
        $("#d3sheet-node-info header").css("background-color", fillColor);
        $("#d3sheet-node-sheet-name").text(node.sheetName);

        var ul = $("#d3sheet-node-properties");
        ul.empty();

        // Show node properties
        var propertyNames = Object.keys(node.properties);
        $.each(propertyNames, function(i, propertyName) {
            if (propertyName != node.labelProperty)
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2Jpbi9ub2RlLXY1LjAuMC1saW51eC14NjQvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwic3JjL2Qzc2hlZXQuanMiLCJzcmMvZm9yY2UuanMiLCJzcmMvZ3JhcGguanMiLCJzcmMvaW5mby5qcyIsInNyYy9tb2RlbC5qcyIsInNyYy9zcHJlYWRzaGVldC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIhZnVuY3Rpb24oKSB7XG4gICAgY2hlY2tSZXF1aXJlbWVudHMoKTtcblxuICAgIHZhciBkM3NoZWV0ID0ge1xuICAgICAgICB2ZXI6IFwiMS4wLjBcIixcbiAgICAgICAgc3ZnQ29udGFpbmVySWQ6IFwiXCIsXG4gICAgICAgIGluZm9Db250YWluZXJJZDogXCJcIixcbiAgICAgICAgc3ZnOiB7fSxcbiAgICAgICAgc3ByZWFkc2hlZXQ6IHt9LFxuICAgICAgICBtb2RlbDoge31cbiAgICB9O1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBkM3NoZWV0O1xuXG4gICAgLyoqXG4gICAgKiBJbml0aWFsaXplIEQzIHNoZWV0LlxuICAgICogQHBhcmFtIHtzdHJpbmd9IGNvbnRhaW5lcklkIC0gaWRlbnRpZmllciBvZiB0aGUgbWFpbiBESVYuXG4gICAgKiovXG4gICAgZDNzaGVldC5pbml0ID0gZnVuY3Rpb24oc3ZnQ29udGFpbmVySWQsIGluZm9Db250YWluZXJJZCkge1xuICAgICAgICBpZiAoc3ZnQ29udGFpbmVySWQgPT0gbnVsbClcbiAgICAgICAgICAgIHN2Z0NvbnRhaW5lcklkID0gXCJkM3NoZWV0LXN2Z1wiO1xuICAgICAgICBkM3NoZWV0LnN2Z0NvbnRhaW5lcklkID0gc3ZnQ29udGFpbmVySWQ7XG5cbiAgICAgICAgaWYgKGluZm9Db250YWluZXJJZCA9PSBudWxsKVxuICAgICAgICAgICAgaW5mb0NvbnRhaW5lcklkID0gXCJkM3NoZWV0LWluZm9cIjtcbiAgICAgICAgZDNzaGVldC5pbmZvQ29udGFpbmVySWQgPSBpbmZvQ29udGFpbmVySWQ7XG5cbiAgICAgICAgdmFyIHN2Z0NvbnRhaW5lciA9ICQoXCIjXCIgKyBzdmdDb250YWluZXJJZCksXG4gICAgICAgICAgICB3aWR0aCA9IHN2Z0NvbnRhaW5lci53aWR0aCgpLFxuICAgICAgICAgICAgaGVpZ2h0ID0gc3ZnQ29udGFpbmVyLmhlaWdodCgpO1xuXG4gICAgICAgIC8vIENyZWF0ZSBTVkcgZWxlbWVudFxuICAgICAgICBkM3NoZWV0LnN2ZyA9IGQzLnNlbGVjdChcIiNcIiArIHN2Z0NvbnRhaW5lcklkKVxuICAgICAgICAgICAgLmFwcGVuZChcInN2Z1wiKVxuICAgICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCBcIjEwMCVcIilcbiAgICAgICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIFwiMTAwJVwiKVxuICAgICAgICAgICAgLmF0dHIoJ3ZpZXdCb3gnLCBcIjAgMCBcIiArIHdpZHRoICsgXCIgXCIgKyBoZWlnaHQpO1xuXG4gICAgICAgIC8vIENyZWF0ZSBpbmZvIHBhbmVsXG4gICAgICAgIGQzLnNlbGVjdChcIiNcIiArIGluZm9Db250YWluZXJJZClcbiAgICAgICAgICAgIC5hcHBlbmQoXCJkaXZcIik7XG5cbiAgICAgICAgcmV0dXJuIGQzc2hlZXQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBMb2FkIGRhdGEgZnJvbSBzcHJlYWRzaGVldC5cbiAgICAqKi9cbiAgICBkM3NoZWV0LmxvYWQgPSBmdW5jdGlvbihzcHJlYWRzaGVldEtleSkge1xuICAgICAgICAvLyBMb2FkIHNwcmVhZHNoZWV0XG4gICAgICAgIHZhciBzcHJlYWRzaGVldCA9IHJlcXVpcmUoXCIuL3NwcmVhZHNoZWV0XCIpO1xuICAgICAgICBzcHJlYWRzaGVldChzcHJlYWRzaGVldEtleSwgZnVuY3Rpb24oc3ByZWFkc2hlZXQpIHtcbiAgICAgICAgICAgIGQzc2hlZXQuc3ByZWFkc2hlZXQgPSBzcHJlYWRzaGVldDtcblxuICAgICAgICAgICAgLy8gSW5pdGlhbGl6ZSBkb2N1bWVudFxuICAgICAgICAgICAgZG9jdW1lbnQudGl0bGUgPSBzcHJlYWRzaGVldC50aXRsZTtcblxuICAgICAgICAgICAgLy8gSW5pdGlhbGl6ZSBpbmZvIHNlY3Rpb25cbiAgICAgICAgICAgIHZhciBpbmZvTW9kdWxlID0gcmVxdWlyZShcIi4vaW5mb1wiKTtcbiAgICAgICAgICAgIHZhciBpbmZvID0gaW5mb01vZHVsZShkM3NoZWV0LmluZm9Db250YWluZXJJZCwgc3ByZWFkc2hlZXQudGl0bGUpO1xuXG4gICAgICAgICAgICAvLyBDcmVhdGUgbW9kZWwgZnJvbSBzcHJlYWRzaGVldFxuICAgICAgICAgICAgdmFyIG1vZGVsTW9kdWxlID0gcmVxdWlyZShcIi4vbW9kZWxcIik7XG4gICAgICAgICAgICBkM3NoZWV0Lm1vZGVsID0gbW9kZWxNb2R1bGUoZDNzaGVldC5zcHJlYWRzaGVldCk7XG5cbiAgICAgICAgICAgIC8vIENyZWF0ZSBncmFwaCBmcm9tIG1vZGVsXG4gICAgICAgICAgICB2YXIgZ3JhcGhNb2R1bGUgPSByZXF1aXJlKFwiLi9ncmFwaFwiKTtcbiAgICAgICAgICAgIGQzc2hlZXQuZ3JhcGggPSBncmFwaE1vZHVsZShkM3NoZWV0Lm1vZGVsKTtcblxuICAgICAgICAgICAgLy8gQ3JlYXRlIEQzIGZvcmNlIGxheW91dCBmcm9tIGdyYXBoXG4gICAgICAgICAgICB2YXIgZm9yY2VNb2R1bGUgPSByZXF1aXJlKFwiLi9mb3JjZVwiKTtcbiAgICAgICAgICAgIGZvcmNlTW9kdWxlKGQzc2hlZXQuZ3JhcGgsIGQzc2hlZXQuc3ZnQ29udGFpbmVySWQsIGQzc2hlZXQuc3ZnLCBpbmZvKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2hlY2tSZXF1aXJlbWVudHMoKSB7XG4gICAgICAgIGlmICh0eXBlb2YgZDMgPT09IFwidW5kZWZpbmVkXCIpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJEMyBsaWJyYXJ5IG5vdCBmb3VuZCFcIik7XG4gICAgICAgIGlmICh0eXBlb2YgJCA9PT0gXCJ1bmRlZmluZWRcIilcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImpRdWVyeSBub3QgZm91bmQhXCIpO1xuICAgIH1cbn0oKTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGdyYXBoLCBzdmdDb250YWluZXJJZCwgc3ZnLCBpbmZvKSB7XG4gICAgdmFyIG5vZGUgPSBbXSxcbiAgICAgICAgbm9kZUxhYmVsID0gW10sXG4gICAgICAgIGxpbmsgPSBbXSxcbiAgICAgICAgbGlua0xhYmVsID0gW10sXG4gICAgICAgIGNvbG9ycyA9IGQzLnNjYWxlLmNhdGVnb3J5MjAoKTtcblxuICAgIHZhciBzdmdDb250YWluZXIgPSAkKFwiI1wiICsgc3ZnQ29udGFpbmVySWQpLFxuICAgICAgICB3aWR0aCA9IHN2Z0NvbnRhaW5lci53aWR0aCgpLFxuICAgICAgICBoZWlnaHQgPSBzdmdDb250YWluZXIuaGVpZ2h0KCk7XG5cbiAgICBzZWxlY3RBbGwoKTtcblxuICAgIHZhciBmb3JjZSA9IGQzLmxheW91dC5mb3JjZSgpXG4gICAgICAgIC5zaXplKFt3aWR0aCwgaGVpZ2h0XSlcbiAgICAgICAgLmxpbmtEaXN0YW5jZSgzMCkgLy8gVE9ETzogTW92ZSB0byBzZXR0aW5nc1xuICAgICAgICAuY2hhcmdlKC01MDAwKSAvLyBUT0RPOiBNb3ZlIHRvIHNldHRpbmdzXG4gICAgICAgIC5ncmF2aXR5KDAuNSkgLy8gVE9ETzogTW92ZSB0byBzZXR0aW5nc1xuICAgICAgICAubm9kZXMoZ3JhcGgubm9kZXMpXG4gICAgICAgIC5saW5rcyhncmFwaC5saW5rcylcbiAgICAgICAgLm9uKFwidGlja1wiLCBvblRpY2spO1xuXG4gICAgcmVzdGFydCgpO1xuXG4gICAgZnVuY3Rpb24gcmVzdGFydCgpIHtcbiAgICAgICAgc3ZnLnNlbGVjdEFsbChcIi5saW5rXCIpXG4gICAgICAgICAgICAuZGF0YShncmFwaC5saW5rcylcbiAgICAgICAgICAgIC5lbnRlcigpXG4gICAgICAgICAgICAuYXBwZW5kKFwibGluZVwiKVxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImxpbmtcIik7XG5cbi8vICAgICAgICBzdmcuc2VsZWN0QWxsKFwiLmxpbmstbGFiZWxcIikuZGF0YShncmFwaC5saW5rcylcbi8vICAgICAgICAgICAgLmVudGVyKClcbi8vICAgICAgICAgICAgLmFwcGVuZChcInRleHRcIilcbi8vICAgICAgICAgICAgLnRleHQobGlua1RleHQpXG4vLyAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJsaW5rLWxhYmVsXCIpXG4vLyAgICAgICAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIik7XG5cbiAgICAgICAgc3ZnLnNlbGVjdEFsbChcIi5ub2RlXCIpXG4gICAgICAgICAgICAuZGF0YShncmFwaC5ub2RlcylcbiAgICAgICAgICAgIC5lbnRlcigpXG4gICAgICAgICAgICAuYXBwZW5kKFwiY2lyY2xlXCIpXG4gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibm9kZVwiKVxuICAgICAgICAgICAgLmF0dHIoXCJyXCIsIDMwKSAvLyBUT0RPOiBTZXR0aW5nc1xuICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIDApXG4gICAgICAgICAgICAuYXR0cihcInlcIiwgMClcbiAgICAgICAgICAgIC5hdHRyKFwiZmlsbFwiLCBub2RlRmlsbENvbG9yKVxuICAgICAgICAgICAgLmNhbGwoZm9yY2UuZHJhZylcbiAgICAgICAgICAgIC5vbihcImNsaWNrXCIsIG5vZGVDbGljayk7XG5cbiAgICAgICAgc3ZnLnNlbGVjdEFsbChcIi5ub2RlLWxhYmVsXCIpXG4gICAgICAgICAgICAuZGF0YShncmFwaC5ub2RlcylcbiAgICAgICAgICAgIC5lbnRlcigpXG4gICAgICAgICAgICAuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcIm5vZGUtbGFiZWxcIilcbiAgICAgICAgICAgIC5hdHRyKFwiZHlcIiwgXCIuMzVlbVwiKVxuICAgICAgICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxuICAgICAgICAgICAgLnRleHQoZnVuY3Rpb24obikgeyByZXR1cm4gbi5sYWJlbDsgfSlcbiAgICAgICAgICAgIC5jYWxsKGZvcmNlLmRyYWcpXG4gICAgICAgICAgICAub24oXCJjbGlja1wiLCBub2RlQ2xpY2spO1xuXG4gICAgICAgIHNlbGVjdEFsbCgpO1xuICAgICAgICBmb3JjZS5zdGFydCgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG5vZGVDbGljayhub2RlKSB7XG4gICAgICAgIGluZm8uc2hvd05vZGUobm9kZSwgZ3JhcGgubm9kZXMsIG5vZGVGaWxsQ29sb3Iobm9kZSkpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG5vZGVGaWxsQ29sb3Iobm9kZSkge1xuICAgICAgICByZXR1cm4gY29sb3JzKG5vZGUuc2hlZXROYW1lKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZWxlY3RBbGwoKSB7XG4gICAgICAgIG5vZGUgPSBzdmcuc2VsZWN0QWxsKFwiLm5vZGVcIik7XG4gICAgICAgIG5vZGVMYWJlbCA9IHN2Zy5zZWxlY3RBbGwoXCIubm9kZS1sYWJlbFwiKTtcbiAgICAgICAgbGluayA9IHN2Zy5zZWxlY3RBbGwoXCIubGlua1wiKTtcbiAgICAgICAgbGlua0xhYmVsID0gc3ZnLnNlbGVjdEFsbChcIi5saW5rLWxhYmVsXCIpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG9uVGljaygpIHtcbiAgICAgICAgbGluay5hdHRyKFwieDFcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5zb3VyY2UueDsgfSlcbiAgICAgICAgICAgIC5hdHRyKFwieTFcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5zb3VyY2UueTsgfSlcbiAgICAgICAgICAgIC5hdHRyKFwieDJcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50YXJnZXQueDsgfSlcbiAgICAgICAgICAgIC5hdHRyKFwieTJcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50YXJnZXQueTsgfSk7XG5cbiAgICAgICAgbGlua0xhYmVsXG4gICAgICAgICAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAoZC5zb3VyY2UueCArIGQudGFyZ2V0LngpLzI7IH0pXG4gICAgICAgICAgICAuYXR0cihcInlcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAoZC5zb3VyY2UueSArIGQudGFyZ2V0LnkpLzI7IH0pO1xuXG4gICAgICAgIG5vZGUuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJ0cmFuc2xhdGUoXCIgKyBkLnggKyBcIixcIiArIGQueSArIFwiKVwiO1xuICAgICAgICB9KTtcblxuICAgICAgICBub2RlTGFiZWxcbiAgICAgICAgICAgIC5hdHRyKFwieFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLng7IH0pXG4gICAgICAgICAgICAuYXR0cihcInlcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC55OyB9KTtcbiAgICB9XG59IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihtb2RlbCkge1xuICAgIHZhciBncmFwaCA9IHtcbiAgICAgICAgbm9kZXM6IFtdLFxuICAgICAgICBsaW5rczogW11cbiAgICB9O1xuXG4gICAgLy8gRm9yIGFsbCBzaGVldHNcbiAgICAkLmVhY2gobW9kZWwuc2hlZXRzLCBmdW5jdGlvbihpLCBzaGVldCkge1xuICAgICAgICAvLyBGb3IgYWxsIG5vZGVzXG4gICAgICAgICQuZWFjaChzaGVldC5ub2RlcywgZnVuY3Rpb24oaiwgbm9kZSkge1xuICAgICAgICAgICAgLy8gQWRkIG5vZGUgdG8gZ3JhcGhcbiAgICAgICAgICAgIG5vZGUuZ3JhcGhJbmRleCA9IGdyYXBoLm5vZGVzLnB1c2gobm9kZSkgLSAxO1xuICAgICAgICAgICAgbm9kZS5sYWJlbFByb3BlcnR5ID0gc2hlZXQubGFiZWw7XG4gICAgICAgICAgICBub2RlLmxhYmVsID0gbm9kZS5wcm9wZXJ0aWVzW25vZGUubGFiZWxQcm9wZXJ0eV07XG4gICAgICAgICAgICBub2RlLnNoZWV0TmFtZSA9IHNoZWV0Lm5hbWU7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIGxpbmtzXG4gICAgJC5lYWNoKG1vZGVsLnNoZWV0cywgZnVuY3Rpb24oaSwgc2hlZXQpIHtcbiAgICAgICAgLy8gRm9yIGFsbCBub2Rlc1xuICAgICAgICAkLmVhY2goc2hlZXQubm9kZXMsIGZ1bmN0aW9uKGosIG5vZGUpIHtcbiAgICAgICAgICAgIC8vIEZvciBhbGwgbGluayBuYW1lc1xuICAgICAgICAgICAgJC5lYWNoKHNoZWV0LmxpbmtOYW1lcywgZnVuY3Rpb24oaywgbGlua05hbWUpIHtcbiAgICAgICAgICAgICAgICAvLyBGb3IgYWxsIHRhcmdldCBub2Rlc1xuICAgICAgICAgICAgICAgIHZhciBncmFwaFRhcmdldEluZGV4ZXMgPSBbXTtcbiAgICAgICAgICAgICAgICAkLmVhY2gobm9kZS5saW5rc1tsaW5rTmFtZV0sIGZ1bmN0aW9uKGwsIHRhcmdldEluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBsaW5rID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlOiBub2RlLmdyYXBoSW5kZXgsXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQ6IG1vZGVsLnNoZWV0c1tsaW5rTmFtZV0ubm9kZXNbdGFyZ2V0SW5kZXhdLmdyYXBoSW5kZXhcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgZ3JhcGhUYXJnZXRJbmRleGVzLnB1c2gobGluay50YXJnZXQpO1xuICAgICAgICAgICAgICAgICAgICBncmFwaC5saW5rcy5wdXNoKGxpbmspO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgLy8gUmVwbGFjZSBtb2RlbCBpbmRleGVzIHdpdGggZ3JhcGggaW5kZXhlc1xuICAgICAgICAgICAgICAgIG5vZGUubGlua3NbbGlua05hbWVdID0gZ3JhcGhUYXJnZXRJbmRleGVzO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGdyYXBoO1xufSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5mb0NvbnRhaW5lcklkLCB0aXRsZSkge1xuICAgIC8vIFNldCBoZWFkaW5nXG4gICAgJChcIiNcIiArIGluZm9Db250YWluZXJJZCArIFwiIGgxXCIpLnRleHQodGl0bGUpO1xuXG4gICAgdGhpcy5zaG93Tm9kZSA9IGZ1bmN0aW9uKG5vZGUsIG5vZGVzLCBmaWxsQ29sb3IpIHtcbiAgICAgICAgY29uc29sZS5sb2cobm9kZSk7XG5cbiAgICAgICAgJChcIiNkM3NoZWV0LW5vZGUtaW5mbyBoMlwiKS50ZXh0KG5vZGUubGFiZWwpO1xuICAgICAgICAkKFwiI2Qzc2hlZXQtbm9kZS1pbmZvIGhlYWRlclwiKS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIsIGZpbGxDb2xvcik7XG4gICAgICAgICQoXCIjZDNzaGVldC1ub2RlLXNoZWV0LW5hbWVcIikudGV4dChub2RlLnNoZWV0TmFtZSk7XG5cbiAgICAgICAgdmFyIHVsID0gJChcIiNkM3NoZWV0LW5vZGUtcHJvcGVydGllc1wiKTtcbiAgICAgICAgdWwuZW1wdHkoKTtcblxuICAgICAgICAvLyBTaG93IG5vZGUgcHJvcGVydGllc1xuICAgICAgICB2YXIgcHJvcGVydHlOYW1lcyA9IE9iamVjdC5rZXlzKG5vZGUucHJvcGVydGllcyk7XG4gICAgICAgICQuZWFjaChwcm9wZXJ0eU5hbWVzLCBmdW5jdGlvbihpLCBwcm9wZXJ0eU5hbWUpIHtcbiAgICAgICAgICAgIGlmIChwcm9wZXJ0eU5hbWUgIT0gbm9kZS5sYWJlbFByb3BlcnR5KVxuICAgICAgICAgICAgICAgIGFkZFByb3BlcnR5KHByb3BlcnR5TmFtZSwgbm9kZS5wcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0pO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBTaG93IG5vZGUgbGlua3NcbiAgICAgICAgdmFyIGxpbmtOYW1lcyA9IE9iamVjdC5rZXlzKG5vZGUubGlua3MpXG4gICAgICAgICQuZWFjaChsaW5rTmFtZXMsIGZ1bmN0aW9uKGksIGxpbmtOYW1lKSB7XG4gICAgICAgICAgICB2YXIgdGFyZ2V0TmFtZXMgPSBcIlwiO1xuICAgICAgICAgICAgJC5lYWNoKG5vZGUubGlua3NbbGlua05hbWVdLCBmdW5jdGlvbihpLCB0YXJnZXRJbmRleCkge1xuICAgICAgICAgICAgICAgIGlmICh0YXJnZXROYW1lcyAhPSBcIlwiKVxuICAgICAgICAgICAgICAgICAgICB0YXJnZXROYW1lcyA9IHRhcmdldE5hbWVzICsgXCIsIFwiO1xuICAgICAgICAgICAgICAgIHRhcmdldE5hbWVzID0gdGFyZ2V0TmFtZXMgKyBub2Rlc1t0YXJnZXRJbmRleF0ubGFiZWw7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGFkZFByb3BlcnR5KGxpbmtOYW1lLCB0YXJnZXROYW1lcyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGZ1bmN0aW9uIGFkZFByb3BlcnR5KG5hbWUsIHZhbHVlKSB7XG4gICAgICAgICAgICB1bC5hcHBlbmQoXCI8bGk+PHNwYW4gY2xhc3M9XFxcImQzc2hlZXQtbm9kZS1wcm9wZXJ0eS1uYW1lXFxcIj5cIiArIG5hbWUgK1xuICAgICAgICAgICAgICAgIFwiOjwvc3Bhbj4gPHNwYW4gY2xhc3M9XFxcImQzc2hlZXQtbm9kZS1wcm9wZXJ0eS12YWx1ZVxcXCI+XCIgKyB2YWx1ZSArIFwiPC9zcGFuPjwvbGk+XCIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG59IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzcHJlYWRzaGVldCkge1xuICAgIHZhciBtb2RlbCA9IHtcbiAgICAgICAgc2hlZXRzOiB7fSxcbiAgICAgICAgc2V0dGluZ3M6IHt9XG4gICAgfTtcblxuICAgIHZhciBzaGVldFR5cGVzID0gZ2V0U2hlZXRUeXBlcyhzcHJlYWRzaGVldCk7XG4gICAgbW9kZWwuc2hlZXRzID0gZ2V0R3JhcGgoc3ByZWFkc2hlZXQsIHNoZWV0VHlwZXMubm9kZXNTaGVldE5hbWVzKTtcbiAgICBpZiAoc2hlZXRUeXBlcy5zZXR0aW5nc1NoZWV0TmFtZSAhPSBudWxsKVxuICAgICAgICBtb2RlbC5zZXR0aW5ncyA9IHNwcmVhZHNoZWV0LnNoZWV0c1tzaGVldFR5cGVzLnNldHRpbmdzU2hlZXROYW1lXTtcblxuICAgIGZ1bmN0aW9uIGdldEdyYXBoKHNwcmVhZHNoZWV0LCBub2RlU2hlZXROYW1lcykge1xuICAgICAgICAvLyBDcmVhdGUgbm9kZXMgd2l0aCBwcm9wZXJ0aWVzXG4gICAgICAgIHZhciBzaGVldHMgPSB7fTtcbiAgICAgICAgJC5lYWNoKG5vZGVTaGVldE5hbWVzLCBmdW5jdGlvbihpLCBub2RlU2hlZXROYW1lKSB7XG4gICAgICAgICAgICBzaGVldHNbbm9kZVNoZWV0TmFtZV0gPSBnZXROb2RlcyhzcHJlYWRzaGVldC5zaGVldHNbbm9kZVNoZWV0TmFtZV0sIG5vZGVTaGVldE5hbWUpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBDcmVhdGUgbGluayBuYW1lc1xuICAgICAgICAkLmVhY2gobm9kZVNoZWV0TmFtZXMsIGZ1bmN0aW9uKGksIG5vZGVTaGVldE5hbWUpIHtcbiAgICAgICAgICAgIGNyZWF0ZUxpbmtOYW1lcyhzaGVldHMsIHNwcmVhZHNoZWV0LnNoZWV0c1tub2RlU2hlZXROYW1lXSwgbm9kZVNoZWV0TmFtZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIENyZWF0ZSBsaW5rcyBmcm9tIG5vZGUgc2hlZXRzXG4gICAgICAgICQuZWFjaChub2RlU2hlZXROYW1lcywgZnVuY3Rpb24oaSwgbm9kZVNoZWV0TmFtZSkge1xuICAgICAgICAgICAgY3JlYXRlTGlua3Moc2hlZXRzLCBzcHJlYWRzaGVldC5zaGVldHNbbm9kZVNoZWV0TmFtZV0sIG5vZGVTaGVldE5hbWUpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBUT0RPOiBDcmVhdGUgbGlua3MgZnJvbSBsaW5rIHNoZWV0c1xuXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZUxpbmtzKHNoZWV0cywgbm9kZVNoZWV0LCBub2RlU2hlZXROYW1lKSB7XG4gICAgICAgICAgICB2YXIgc291cmNlID0gc2hlZXRzW25vZGVTaGVldE5hbWVdO1xuXG4gICAgICAgICAgICAvLyBGb3IgYWxsIHNoZWV0IHJvd3NcbiAgICAgICAgICAgICQuZWFjaChub2RlU2hlZXQucm93cywgZnVuY3Rpb24oaSwgcm93KSB7XG4gICAgICAgICAgICAgICAgLy8gRm9yIGFsbCBzaGVldCBjb2x1bW5zXG4gICAgICAgICAgICAgICAgdmFyIGNvbE5hbWVzID0gT2JqZWN0LmtleXMocm93KTtcbiAgICAgICAgICAgICAgICAkLmVhY2goY29sTmFtZXMsIGZ1bmN0aW9uKGosIGNvbE5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhpcyBpcyBhIGxpbmsgY29sdW1uXG4gICAgICAgICAgICAgICAgICAgIHZhciBsaW5rVGFyZ2V0ID0gcGFyc2VDb2x1bW5MaW5rTmFtZShjb2xOYW1lLCBzaGVldHMpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobGlua1RhcmdldCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGaW5kIGluZGV4IG9mIHRoZSB0YXJnZXQgbm9kZVxuICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKHNoZWV0c1tsaW5rVGFyZ2V0LnNoZWV0TmFtZV0ubm9kZXMsIGZ1bmN0aW9uKGssIHRhcmdldE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB0YXJnZXQgbm9kZSBwcm9wZXJ0eSB2YWx1ZSBtYXRjaGVzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJvd1tjb2xOYW1lXS5pbmRleE9mKHRhcmdldE5vZGUucHJvcGVydGllc1tsaW5rVGFyZ2V0LnByb3BlcnR5TmFtZV0pID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNvdXJjZS5ub2Rlc1tpXS5saW5rc1tsaW5rVGFyZ2V0LnNoZWV0TmFtZV0gPT0gbnVsbClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZS5ub2Rlc1tpXS5saW5rc1tsaW5rVGFyZ2V0LnNoZWV0TmFtZV0gPSBbXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBZGQgaW5kZXggb2YgdGhlIHRhcmdldCBub2RlIHRvIHRoZSBzb3VyY2Ugbm9kZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2Uubm9kZXNbaV0ubGlua3NbbGlua1RhcmdldC5zaGVldE5hbWVdLnB1c2goayk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlTGlua05hbWVzKHNoZWV0cywgbm9kZVNoZWV0LCBub2RlU2hlZXROYW1lKSB7XG4gICAgICAgICAgICB2YXIgc291cmNlID0gc2hlZXRzW25vZGVTaGVldE5hbWVdO1xuXG4gICAgICAgICAgICAvLyBHZXQgbGluayBuYW1lc1xuICAgICAgICAgICAgJC5lYWNoKG5vZGVTaGVldC5oZWFkZXIsIGZ1bmN0aW9uKGksIHByb3BlcnR5TmFtZSkge1xuICAgICAgICAgICAgICAgIHZhciBsaW5rVGFyZ2V0ID0gcGFyc2VDb2x1bW5MaW5rTmFtZShwcm9wZXJ0eU5hbWUsIHNoZWV0cyk7XG4gICAgICAgICAgICAgICAgaWYgKGxpbmtUYXJnZXQgIT0gbnVsbClcbiAgICAgICAgICAgICAgICAgICAgc291cmNlLmxpbmtOYW1lcy5wdXNoKGxpbmtUYXJnZXQuc2hlZXROYW1lKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZ2V0Tm9kZXMobm9kZVNoZWV0LCBub2RlU2hlZXROYW1lKSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0ge1xuICAgICAgICAgICAgICAgIG5hbWU6IG5vZGVTaGVldE5hbWUsXG4gICAgICAgICAgICAgICAgbGFiZWw6IG5vZGVTaGVldC5oZWFkZXJbMF0sXG4gICAgICAgICAgICAgICAgcHJvcGVydHlOYW1lczogW10sXG4gICAgICAgICAgICAgICAgbGlua05hbWVzOiBbXSxcbiAgICAgICAgICAgICAgICBub2RlczogW11cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vIEdldCBub2RlcyBhbmQgcHJvcGVydGllc1xuICAgICAgICAgICAgJC5lYWNoKG5vZGVTaGVldC5yb3dzLCBmdW5jdGlvbihpLCByb3cpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQubm9kZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IGdldE5vZGVQcm9wZXJ0aWVzKHJvdyksXG4gICAgICAgICAgICAgICAgICAgIGxpbmtzOiB7fVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIEdldCBwcm9wZXJ0eSBuYW1lc1xuICAgICAgICAgICAgJC5lYWNoKG5vZGVTaGVldC5oZWFkZXIsIGZ1bmN0aW9uKGksIGNvbE5hbWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgbGlua1RhcmdldCA9IGNvbE5hbWUuc3BsaXQoXCIuXCIpO1xuICAgICAgICAgICAgICAgIGlmIChsaW5rVGFyZ2V0Lmxlbmd0aCA9PSAxKVxuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHJvcGVydHlOYW1lcy5wdXNoKGNvbE5hbWUpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBnZXROb2RlUHJvcGVydGllcyhyb3cpIHtcbiAgICAgICAgICAgIHZhciBub2RlUHJvcGVydGllcyA9IHt9O1xuICAgICAgICAgICAgdmFyIGNvbE5hbWVzID0gT2JqZWN0LmtleXMocm93KTtcbiAgICAgICAgICAgICQuZWFjaChjb2xOYW1lcywgZnVuY3Rpb24oaSwgY29sTmFtZSkge1xuICAgICAgICAgICAgICAgIGlmIChjb2xOYW1lLmluZGV4T2YoXCIuXCIpID09IC0xKVxuICAgICAgICAgICAgICAgICAgICBub2RlUHJvcGVydGllc1tjb2xOYW1lXSA9IHJvd1tjb2xOYW1lXTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIG5vZGVQcm9wZXJ0aWVzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHNoZWV0cztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRTaGVldFR5cGVzKHNwcmVhZHNoZWV0KSB7XG4gICAgICAgIHZhciBzaGVldFR5cGVzID0ge1xuICAgICAgICAgICAgbm9kZXNTaGVldE5hbWVzOiBbXSxcbiAgICAgICAgICAgIGxpbmtTaGVldE5hbWVzOiBbXSxcbiAgICAgICAgICAgIHNldHRpbmdzU2hlZXROYW1lOiBudWxsXG4gICAgICAgIH07XG4gICAgICAgIHZhciBzaGVldE5hbWVzID0gT2JqZWN0LmtleXMoc3ByZWFkc2hlZXQuc2hlZXRzKTtcbiAgICAgICAgJC5lYWNoKHNoZWV0TmFtZXMsIGZ1bmN0aW9uKGksIHNoZWV0TmFtZSkge1xuICAgICAgICAgICAgaWYgKHNoZWV0TmFtZSA9PSBcInNldHRpbmdzXCIpIHtcbiAgICAgICAgICAgICAgICBzaGVldFR5cGVzLnNldHRpbmdzU2hlZXROYW1lID0gc2hlZXROYW1lO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHNoZWV0TmFtZS5zbGljZSgwLCAxKSA9PSBcIiNcIilcbiAgICAgICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgICAgIHZhciBsaW5rU2hlZXQgPSBwYXJzZUxpbmtTaGVldE5hbWUoc2hlZXROYW1lKVxuICAgICAgICAgICAgaWYgKChsaW5rU2hlZXQgIT0gbnVsbCkgJiZcbiAgICAgICAgICAgICAgICAoc2hlZXROYW1lcy5pbmRleE9mKGxpbmtTaGVldC5zb3VyY2UpID4gLTEpICYmXG4gICAgICAgICAgICAgICAgKHNoZWV0TmFtZXMuaW5kZXhPZihsaW5rU2hlZXQudGFyZ2V0KSA+IC0xKSkge1xuICAgICAgICAgICAgICAgIHNoZWV0VHlwZXMubGlua1NoZWV0TmFtZXMucHVzaChzaGVldE5hbWUpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzaGVldFR5cGVzLm5vZGVzU2hlZXROYW1lcy5wdXNoKHNoZWV0TmFtZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBzaGVldFR5cGVzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlQ29sdW1uTGlua05hbWUoY29sTmFtZSwgc2hlZXRzKSB7XG4gICAgICAgIHZhciBsaW5rTmFtZXMgPSBjb2xOYW1lLnNwbGl0KFwiLlwiKTtcbiAgICAgICAgaWYgKChsaW5rTmFtZXMubGVuZ3RoID09IDIpICYmXG4gICAgICAgICAgICAoc2hlZXRzW2xpbmtOYW1lc1swXV0gIT0gbnVsbCkgJiZcbiAgICAgICAgICAgIChzaGVldHNbbGlua05hbWVzWzBdXS5wcm9wZXJ0eU5hbWVzLmluZGV4T2YobGlua05hbWVzWzFdKSA+IC0xKSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzaGVldE5hbWU6IGxpbmtOYW1lc1swXSxcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eU5hbWU6IGxpbmtOYW1lc1sxXVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VMaW5rU2hlZXROYW1lKHNoZWV0TmFtZSkge1xuICAgICAgICB2YXIgbm9kZU5hbWVzID0gc2hlZXROYW1lLnNwbGl0KFwiLVwiKTtcbiAgICAgICAgaWYgKG5vZGVOYW1lcy5sZW5ndGggPT0gMikge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzb3VyY2U6IG5vZGVOYW1lc1swXSxcbiAgICAgICAgICAgICAgICB0YXJnZXQ6IG5vZGVOYW1lc1sxXVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiBtb2RlbDtcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNwcmVhZHNoZWV0S2V5LCBvbkxvYWRlZCkge1xuICAgIC8vIEdldCBzaGVldCBjb3VudFxuICAgIGdldFNwcmVhZHNoZWV0SW5mbyhzcHJlYWRzaGVldEtleSwgZnVuY3Rpb24gb25TdWNjZXNzKGluZm8pIHtcbiAgICAgICAgLy8gTG9hZCBhbGwgc2hlZXRzXG4gICAgICAgIGxvYWRTaGVldHMoc3ByZWFkc2hlZXRLZXksIGluZm8pO1xuICAgIH0pO1xuXG4gICAgZnVuY3Rpb24gbG9hZFNoZWV0cyhzcHJlYWRzaGVldEtleSwgaW5mbykge1xuICAgICAgICB2YXIgc3ByZWFkc2hlZXQgPSB7XG4gICAgICAgICAgICB0aXRsZTogaW5mby50aXRsZSxcbiAgICAgICAgICAgIHNoZWV0czoge31cbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGxvYWRlZFNoZWV0Q291bnQgPSAwO1xuICAgICAgICBmb3IgKGkgPSAxOyBpIDw9IGluZm8uc2hlZXRDb3VudDsgaSsrKSB7XG4gICAgICAgICAgICBsb2FkU2hlZXQoc3ByZWFkc2hlZXQsIHNwcmVhZHNoZWV0S2V5LCBpKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGxvYWRlZFNoZWV0Q291bnQgKz0gMTtcbiAgICAgICAgICAgICAgICBpZiAobG9hZGVkU2hlZXRDb3VudCA9PSBpbmZvLnNoZWV0Q291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgb25Mb2FkZWQoc3ByZWFkc2hlZXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsb2FkU2hlZXQoc3ByZWFkc2hlZXQsIHNwcmVhZHNoZWV0S2V5LCBzaGVldEluZGV4KSB7XG4gICAgICAgIHJldHVybiBnZXRTaGVldChzcHJlYWRzaGVldEtleSwgc2hlZXRJbmRleCwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHZhciBzaGVldCA9IHNwcmVhZHNoZWV0LnNoZWV0c1tyZXNwb25zZS5mZWVkLnRpdGxlLiR0XSA9IHtcbiAgICAgICAgICAgICAgICBoZWFkZXI6IFtdLFxuICAgICAgICAgICAgICAgIHJvd3M6IFtdLFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgJC5lYWNoKHJlc3BvbnNlLmZlZWQuZW50cnksIGZ1bmN0aW9uKGksIGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZS5ncyRjZWxsLnJvdyA9PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHNoZWV0LmhlYWRlcltlLmdzJGNlbGwuY29sIC0gMV0gPSBlLmNvbnRlbnQuJHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSBlLmdzJGNlbGwucm93IC0gMjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNoZWV0LnJvd3NbaW5kZXhdID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNoZWV0LnJvd3NbaW5kZXhdID0ge307XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc2hlZXQucm93c1tpbmRleF1bc2hlZXQuaGVhZGVyW2UuZ3MkY2VsbC5jb2wgLSAxXV0gPSBlLmNvbnRlbnQuJHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFNoZWV0KHNwcmVhZHNoZWV0S2V5LCBzaGVldEluZGV4LCBvblN1Y2Nlc3MpIHtcbiAgICAgICAgcmV0dXJuICQuYWpheCh7XG4gICAgICAgICAgICB1cmw6IFwiaHR0cHM6Ly9zcHJlYWRzaGVldHMuZ29vZ2xlLmNvbS9mZWVkcy9jZWxscy9cIiArIHNwcmVhZHNoZWV0S2V5ICsgXCIvXCIgKyBzaGVldEluZGV4ICsgXCIvcHVibGljL3ZhbHVlcz9hbHQ9anNvbi1pbi1zY3JpcHRcIixcbiAgICAgICAgICAgIGpzb25wOiBcImNhbGxiYWNrXCIsXG4gICAgICAgICAgICBkYXRhVHlwZTogXCJqc29ucFwiLFxuICAgICAgICAgICAgc3VjY2Vzczogb25TdWNjZXNzXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFNwcmVhZHNoZWV0SW5mbyhzcHJlYWRzaGVldEtleSwgb25TdWNjZXNzKSB7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmw6IFwiaHR0cHM6Ly9zcHJlYWRzaGVldHMuZ29vZ2xlLmNvbS9mZWVkcy93b3Jrc2hlZXRzL1wiICsgc3ByZWFkc2hlZXRLZXkgKyBcIi9wdWJsaWMvZnVsbD9hbHQ9anNvbi1pbi1zY3JpcHRcIixcbiAgICAgICAgICAgIGpzb25wOiBcImNhbGxiYWNrXCIsXG4gICAgICAgICAgICBkYXRhVHlwZTogXCJqc29ucFwiLFxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICB2YXIgaW5mbyA9IHtcbiAgICAgICAgICAgICAgICAgICAgc2hlZXRDb3VudDogcmVzcG9uc2UuZmVlZC5lbnRyeS5sZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiByZXNwb25zZS5mZWVkLnRpdGxlLiR0XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBvblN1Y2Nlc3MoaW5mbyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbn0iXX0=
