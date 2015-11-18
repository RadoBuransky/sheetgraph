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
            .attr("fill", function(n) { return colors(n.sheetName); })
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
        info.showNode(node);
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
                $.each(node.links[linkName], function(l, targetIndex) {
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
module.exports = function(infoContainerId, title) {
    // Set heading
    $("#" + infoContainerId + " h1").text(title);

    this.showNode = function(node) {
        console.log(node);
        $("#d3sheet-node-info h2").text(node.label);
        $("#d3sheet-node-sheet-name").text(node.sheetName);
        var ul = $("#d3sheet-node-properties");
        var propertyNames = Object.keys(node.properties);
        ul.empty();
        $.each(propertyNames, function(i, propertyName) {
            ul.append("<li><span class=\"d3sheet-node-property-name\">" + propertyName +
            ":</span> <span class=\"d3sheet-node-property-value\">" + node.properties[propertyName] + "</span></li>");
        });
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
                    links: []
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2Jpbi9ub2RlLXY1LjAuMC1saW51eC14NjQvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwic3JjL2Qzc2hlZXQuanMiLCJzcmMvZm9yY2UuanMiLCJzcmMvZ3JhcGguanMiLCJzcmMvaW5mby5qcyIsInNyYy9tb2RlbC5qcyIsInNyYy9zcHJlYWRzaGVldC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIiFmdW5jdGlvbigpIHtcbiAgICBjaGVja1JlcXVpcmVtZW50cygpO1xuXG4gICAgdmFyIGQzc2hlZXQgPSB7XG4gICAgICAgIHZlcjogXCIxLjAuMFwiLFxuICAgICAgICBzdmdDb250YWluZXJJZDogXCJcIixcbiAgICAgICAgaW5mb0NvbnRhaW5lcklkOiBcIlwiLFxuICAgICAgICBzdmc6IHt9LFxuICAgICAgICBzcHJlYWRzaGVldDoge30sXG4gICAgICAgIG1vZGVsOiB7fVxuICAgIH07XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IGQzc2hlZXQ7XG5cbiAgICAvKipcbiAgICAqIEluaXRpYWxpemUgRDMgc2hlZXQuXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gY29udGFpbmVySWQgLSBpZGVudGlmaWVyIG9mIHRoZSBtYWluIERJVi5cbiAgICAqKi9cbiAgICBkM3NoZWV0LmluaXQgPSBmdW5jdGlvbihzdmdDb250YWluZXJJZCwgaW5mb0NvbnRhaW5lcklkKSB7XG4gICAgICAgIGlmIChzdmdDb250YWluZXJJZCA9PSBudWxsKVxuICAgICAgICAgICAgc3ZnQ29udGFpbmVySWQgPSBcImQzc2hlZXQtc3ZnXCI7XG4gICAgICAgIGQzc2hlZXQuc3ZnQ29udGFpbmVySWQgPSBzdmdDb250YWluZXJJZDtcblxuICAgICAgICBpZiAoaW5mb0NvbnRhaW5lcklkID09IG51bGwpXG4gICAgICAgICAgICBpbmZvQ29udGFpbmVySWQgPSBcImQzc2hlZXQtaW5mb1wiO1xuICAgICAgICBkM3NoZWV0LmluZm9Db250YWluZXJJZCA9IGluZm9Db250YWluZXJJZDtcblxuICAgICAgICB2YXIgc3ZnQ29udGFpbmVyID0gJChcIiNcIiArIHN2Z0NvbnRhaW5lcklkKSxcbiAgICAgICAgICAgIHdpZHRoID0gc3ZnQ29udGFpbmVyLndpZHRoKCksXG4gICAgICAgICAgICBoZWlnaHQgPSBzdmdDb250YWluZXIuaGVpZ2h0KCk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIFNWRyBlbGVtZW50XG4gICAgICAgIGQzc2hlZXQuc3ZnID0gZDMuc2VsZWN0KFwiI1wiICsgc3ZnQ29udGFpbmVySWQpXG4gICAgICAgICAgICAuYXBwZW5kKFwic3ZnXCIpXG4gICAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIFwiMTAwJVwiKVxuICAgICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgXCIxMDAlXCIpXG4gICAgICAgICAgICAuYXR0cigndmlld0JveCcsIFwiMCAwIFwiICsgd2lkdGggKyBcIiBcIiArIGhlaWdodCk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIGluZm8gcGFuZWxcbiAgICAgICAgZDMuc2VsZWN0KFwiI1wiICsgaW5mb0NvbnRhaW5lcklkKVxuICAgICAgICAgICAgLmFwcGVuZChcImRpdlwiKTtcblxuICAgICAgICByZXR1cm4gZDNzaGVldDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIExvYWQgZGF0YSBmcm9tIHNwcmVhZHNoZWV0LlxuICAgICoqL1xuICAgIGQzc2hlZXQubG9hZCA9IGZ1bmN0aW9uKHNwcmVhZHNoZWV0S2V5KSB7XG4gICAgICAgIC8vIExvYWQgc3ByZWFkc2hlZXRcbiAgICAgICAgdmFyIHNwcmVhZHNoZWV0ID0gcmVxdWlyZShcIi4vc3ByZWFkc2hlZXRcIik7XG4gICAgICAgIHNwcmVhZHNoZWV0KHNwcmVhZHNoZWV0S2V5LCBmdW5jdGlvbihzcHJlYWRzaGVldCkge1xuICAgICAgICAgICAgZDNzaGVldC5zcHJlYWRzaGVldCA9IHNwcmVhZHNoZWV0O1xuXG4gICAgICAgICAgICAvLyBJbml0aWFsaXplIGRvY3VtZW50XG4gICAgICAgICAgICBkb2N1bWVudC50aXRsZSA9IHNwcmVhZHNoZWV0LnRpdGxlO1xuXG4gICAgICAgICAgICAvLyBJbml0aWFsaXplIGluZm8gc2VjdGlvblxuICAgICAgICAgICAgdmFyIGluZm9Nb2R1bGUgPSByZXF1aXJlKFwiLi9pbmZvXCIpO1xuICAgICAgICAgICAgdmFyIGluZm8gPSBpbmZvTW9kdWxlKGQzc2hlZXQuaW5mb0NvbnRhaW5lcklkLCBzcHJlYWRzaGVldC50aXRsZSk7XG5cbiAgICAgICAgICAgIC8vIENyZWF0ZSBtb2RlbCBmcm9tIHNwcmVhZHNoZWV0XG4gICAgICAgICAgICB2YXIgbW9kZWxNb2R1bGUgPSByZXF1aXJlKFwiLi9tb2RlbFwiKTtcbiAgICAgICAgICAgIGQzc2hlZXQubW9kZWwgPSBtb2RlbE1vZHVsZShkM3NoZWV0LnNwcmVhZHNoZWV0KTtcblxuICAgICAgICAgICAgLy8gQ3JlYXRlIGdyYXBoIGZyb20gbW9kZWxcbiAgICAgICAgICAgIHZhciBncmFwaE1vZHVsZSA9IHJlcXVpcmUoXCIuL2dyYXBoXCIpO1xuICAgICAgICAgICAgZDNzaGVldC5ncmFwaCA9IGdyYXBoTW9kdWxlKGQzc2hlZXQubW9kZWwpO1xuXG4gICAgICAgICAgICAvLyBDcmVhdGUgRDMgZm9yY2UgbGF5b3V0IGZyb20gZ3JhcGhcbiAgICAgICAgICAgIHZhciBmb3JjZU1vZHVsZSA9IHJlcXVpcmUoXCIuL2ZvcmNlXCIpO1xuICAgICAgICAgICAgZm9yY2VNb2R1bGUoZDNzaGVldC5ncmFwaCwgZDNzaGVldC5zdmdDb250YWluZXJJZCwgZDNzaGVldC5zdmcsIGluZm8pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjaGVja1JlcXVpcmVtZW50cygpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBkMyA9PT0gXCJ1bmRlZmluZWRcIilcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkQzIGxpYnJhcnkgbm90IGZvdW5kIVwiKTtcbiAgICAgICAgaWYgKHR5cGVvZiAkID09PSBcInVuZGVmaW5lZFwiKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwialF1ZXJ5IG5vdCBmb3VuZCFcIik7XG4gICAgfVxufSgpOyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZ3JhcGgsIHN2Z0NvbnRhaW5lcklkLCBzdmcsIGluZm8pIHtcbiAgICB2YXIgbm9kZSA9IFtdLFxuICAgICAgICBub2RlTGFiZWwgPSBbXSxcbiAgICAgICAgbGluayA9IFtdLFxuICAgICAgICBsaW5rTGFiZWwgPSBbXSxcbiAgICAgICAgY29sb3JzID0gZDMuc2NhbGUuY2F0ZWdvcnkyMCgpO1xuXG4gICAgdmFyIHN2Z0NvbnRhaW5lciA9ICQoXCIjXCIgKyBzdmdDb250YWluZXJJZCksXG4gICAgICAgIHdpZHRoID0gc3ZnQ29udGFpbmVyLndpZHRoKCksXG4gICAgICAgIGhlaWdodCA9IHN2Z0NvbnRhaW5lci5oZWlnaHQoKTtcblxuICAgIHNlbGVjdEFsbCgpO1xuXG4gICAgdmFyIGZvcmNlID0gZDMubGF5b3V0LmZvcmNlKClcbiAgICAgICAgLnNpemUoW3dpZHRoLCBoZWlnaHRdKVxuICAgICAgICAubGlua0Rpc3RhbmNlKDMwKSAvLyBUT0RPOiBNb3ZlIHRvIHNldHRpbmdzXG4gICAgICAgIC5jaGFyZ2UoLTUwMDApIC8vIFRPRE86IE1vdmUgdG8gc2V0dGluZ3NcbiAgICAgICAgLmdyYXZpdHkoMC41KSAvLyBUT0RPOiBNb3ZlIHRvIHNldHRpbmdzXG4gICAgICAgIC5ub2RlcyhncmFwaC5ub2RlcylcbiAgICAgICAgLmxpbmtzKGdyYXBoLmxpbmtzKVxuICAgICAgICAub24oXCJ0aWNrXCIsIG9uVGljayk7XG5cbiAgICByZXN0YXJ0KCk7XG5cbiAgICBmdW5jdGlvbiByZXN0YXJ0KCkge1xuICAgICAgICBzdmcuc2VsZWN0QWxsKFwiLmxpbmtcIilcbiAgICAgICAgICAgIC5kYXRhKGdyYXBoLmxpbmtzKVxuICAgICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAgIC5hcHBlbmQoXCJsaW5lXCIpXG4gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibGlua1wiKTtcblxuLy8gICAgICAgIHN2Zy5zZWxlY3RBbGwoXCIubGluay1sYWJlbFwiKS5kYXRhKGdyYXBoLmxpbmtzKVxuLy8gICAgICAgICAgICAuZW50ZXIoKVxuLy8gICAgICAgICAgICAuYXBwZW5kKFwidGV4dFwiKVxuLy8gICAgICAgICAgICAudGV4dChsaW5rVGV4dClcbi8vICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImxpbmstbGFiZWxcIilcbi8vICAgICAgICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKTtcblxuICAgICAgICBzdmcuc2VsZWN0QWxsKFwiLm5vZGVcIilcbiAgICAgICAgICAgIC5kYXRhKGdyYXBoLm5vZGVzKVxuICAgICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAgIC5hcHBlbmQoXCJjaXJjbGVcIilcbiAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJub2RlXCIpXG4gICAgICAgICAgICAuYXR0cihcInJcIiwgMzApIC8vIFRPRE86IFNldHRpbmdzXG4gICAgICAgICAgICAuYXR0cihcInhcIiwgMClcbiAgICAgICAgICAgIC5hdHRyKFwieVwiLCAwKVxuICAgICAgICAgICAgLmF0dHIoXCJmaWxsXCIsIGZ1bmN0aW9uKG4pIHsgcmV0dXJuIGNvbG9ycyhuLnNoZWV0TmFtZSk7IH0pXG4gICAgICAgICAgICAuY2FsbChmb3JjZS5kcmFnKVxuICAgICAgICAgICAgLm9uKFwiY2xpY2tcIiwgbm9kZUNsaWNrKTtcblxuICAgICAgICBzdmcuc2VsZWN0QWxsKFwiLm5vZGUtbGFiZWxcIilcbiAgICAgICAgICAgIC5kYXRhKGdyYXBoLm5vZGVzKVxuICAgICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibm9kZS1sYWJlbFwiKVxuICAgICAgICAgICAgLmF0dHIoXCJkeVwiLCBcIi4zNWVtXCIpXG4gICAgICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXG4gICAgICAgICAgICAudGV4dChmdW5jdGlvbihuKSB7IHJldHVybiBuLmxhYmVsOyB9KVxuICAgICAgICAgICAgLmNhbGwoZm9yY2UuZHJhZylcbiAgICAgICAgICAgIC5vbihcImNsaWNrXCIsIG5vZGVDbGljayk7XG5cbiAgICAgICAgc2VsZWN0QWxsKCk7XG4gICAgICAgIGZvcmNlLnN0YXJ0KCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbm9kZUNsaWNrKG5vZGUpIHtcbiAgICAgICAgaW5mby5zaG93Tm9kZShub2RlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZWxlY3RBbGwoKSB7XG4gICAgICAgIG5vZGUgPSBzdmcuc2VsZWN0QWxsKFwiLm5vZGVcIik7XG4gICAgICAgIG5vZGVMYWJlbCA9IHN2Zy5zZWxlY3RBbGwoXCIubm9kZS1sYWJlbFwiKTtcbiAgICAgICAgbGluayA9IHN2Zy5zZWxlY3RBbGwoXCIubGlua1wiKTtcbiAgICAgICAgbGlua0xhYmVsID0gc3ZnLnNlbGVjdEFsbChcIi5saW5rLWxhYmVsXCIpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG9uVGljaygpIHtcbiAgICAgICAgbGluay5hdHRyKFwieDFcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5zb3VyY2UueDsgfSlcbiAgICAgICAgICAgIC5hdHRyKFwieTFcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5zb3VyY2UueTsgfSlcbiAgICAgICAgICAgIC5hdHRyKFwieDJcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50YXJnZXQueDsgfSlcbiAgICAgICAgICAgIC5hdHRyKFwieTJcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50YXJnZXQueTsgfSk7XG5cbiAgICAgICAgbGlua0xhYmVsXG4gICAgICAgICAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAoZC5zb3VyY2UueCArIGQudGFyZ2V0LngpLzI7IH0pXG4gICAgICAgICAgICAuYXR0cihcInlcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAoZC5zb3VyY2UueSArIGQudGFyZ2V0LnkpLzI7IH0pO1xuXG4gICAgICAgIG5vZGUuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJ0cmFuc2xhdGUoXCIgKyBkLnggKyBcIixcIiArIGQueSArIFwiKVwiO1xuICAgICAgICB9KTtcblxuICAgICAgICBub2RlTGFiZWxcbiAgICAgICAgICAgIC5hdHRyKFwieFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLng7IH0pXG4gICAgICAgICAgICAuYXR0cihcInlcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC55OyB9KTtcbiAgICB9XG59IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihtb2RlbCkge1xuICAgIHZhciBncmFwaCA9IHtcbiAgICAgICAgbm9kZXM6IFtdLFxuICAgICAgICBsaW5rczogW11cbiAgICB9O1xuXG4gICAgLy8gRm9yIGFsbCBzaGVldHNcbiAgICAkLmVhY2gobW9kZWwuc2hlZXRzLCBmdW5jdGlvbihpLCBzaGVldCkge1xuICAgICAgICAvLyBGb3IgYWxsIG5vZGVzXG4gICAgICAgICQuZWFjaChzaGVldC5ub2RlcywgZnVuY3Rpb24oaiwgbm9kZSkge1xuICAgICAgICAgICAgLy8gQWRkIG5vZGUgdG8gZ3JhcGhcbiAgICAgICAgICAgIG5vZGUuZ3JhcGhJbmRleCA9IGdyYXBoLm5vZGVzLnB1c2gobm9kZSkgLSAxO1xuICAgICAgICAgICAgbm9kZS5sYWJlbCA9IG5vZGUucHJvcGVydGllc1tzaGVldC5sYWJlbF07XG4gICAgICAgICAgICBub2RlLnNoZWV0TmFtZSA9IHNoZWV0Lm5hbWU7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIGxpbmtzXG4gICAgJC5lYWNoKG1vZGVsLnNoZWV0cywgZnVuY3Rpb24oaSwgc2hlZXQpIHtcbiAgICAgICAgLy8gRm9yIGFsbCBub2Rlc1xuICAgICAgICAkLmVhY2goc2hlZXQubm9kZXMsIGZ1bmN0aW9uKGosIG5vZGUpIHtcbiAgICAgICAgICAgIC8vIEZvciBhbGwgbGluayBuYW1lc1xuICAgICAgICAgICAgJC5lYWNoKHNoZWV0LmxpbmtOYW1lcywgZnVuY3Rpb24oaywgbGlua05hbWUpIHtcbiAgICAgICAgICAgICAgICAvLyBGb3IgYWxsIHRhcmdldCBub2Rlc1xuICAgICAgICAgICAgICAgICQuZWFjaChub2RlLmxpbmtzW2xpbmtOYW1lXSwgZnVuY3Rpb24obCwgdGFyZ2V0SW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxpbmsgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2U6IG5vZGUuZ3JhcGhJbmRleCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldDogbW9kZWwuc2hlZXRzW2xpbmtOYW1lXS5ub2Rlc1t0YXJnZXRJbmRleF0uZ3JhcGhJbmRleFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBncmFwaC5saW5rcy5wdXNoKGxpbmspO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGdyYXBoO1xufSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5mb0NvbnRhaW5lcklkLCB0aXRsZSkge1xuICAgIC8vIFNldCBoZWFkaW5nXG4gICAgJChcIiNcIiArIGluZm9Db250YWluZXJJZCArIFwiIGgxXCIpLnRleHQodGl0bGUpO1xuXG4gICAgdGhpcy5zaG93Tm9kZSA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgY29uc29sZS5sb2cobm9kZSk7XG4gICAgICAgICQoXCIjZDNzaGVldC1ub2RlLWluZm8gaDJcIikudGV4dChub2RlLmxhYmVsKTtcbiAgICAgICAgJChcIiNkM3NoZWV0LW5vZGUtc2hlZXQtbmFtZVwiKS50ZXh0KG5vZGUuc2hlZXROYW1lKTtcbiAgICAgICAgdmFyIHVsID0gJChcIiNkM3NoZWV0LW5vZGUtcHJvcGVydGllc1wiKTtcbiAgICAgICAgdmFyIHByb3BlcnR5TmFtZXMgPSBPYmplY3Qua2V5cyhub2RlLnByb3BlcnRpZXMpO1xuICAgICAgICB1bC5lbXB0eSgpO1xuICAgICAgICAkLmVhY2gocHJvcGVydHlOYW1lcywgZnVuY3Rpb24oaSwgcHJvcGVydHlOYW1lKSB7XG4gICAgICAgICAgICB1bC5hcHBlbmQoXCI8bGk+PHNwYW4gY2xhc3M9XFxcImQzc2hlZXQtbm9kZS1wcm9wZXJ0eS1uYW1lXFxcIj5cIiArIHByb3BlcnR5TmFtZSArXG4gICAgICAgICAgICBcIjo8L3NwYW4+IDxzcGFuIGNsYXNzPVxcXCJkM3NoZWV0LW5vZGUtcHJvcGVydHktdmFsdWVcXFwiPlwiICsgbm9kZS5wcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0gKyBcIjwvc3Bhbj48L2xpPlwiKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG59IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzcHJlYWRzaGVldCkge1xuICAgIHZhciBtb2RlbCA9IHtcbiAgICAgICAgc2hlZXRzOiB7fSxcbiAgICAgICAgc2V0dGluZ3M6IHt9XG4gICAgfTtcblxuICAgIHZhciBzaGVldFR5cGVzID0gZ2V0U2hlZXRUeXBlcyhzcHJlYWRzaGVldCk7XG4gICAgbW9kZWwuc2hlZXRzID0gZ2V0R3JhcGgoc3ByZWFkc2hlZXQsIHNoZWV0VHlwZXMubm9kZXNTaGVldE5hbWVzKTtcbiAgICBpZiAoc2hlZXRUeXBlcy5zZXR0aW5nc1NoZWV0TmFtZSAhPSBudWxsKVxuICAgICAgICBtb2RlbC5zZXR0aW5ncyA9IHNwcmVhZHNoZWV0LnNoZWV0c1tzaGVldFR5cGVzLnNldHRpbmdzU2hlZXROYW1lXTtcblxuICAgIGZ1bmN0aW9uIGdldEdyYXBoKHNwcmVhZHNoZWV0LCBub2RlU2hlZXROYW1lcykge1xuICAgICAgICAvLyBDcmVhdGUgbm9kZXMgd2l0aCBwcm9wZXJ0aWVzXG4gICAgICAgIHZhciBzaGVldHMgPSB7fTtcbiAgICAgICAgJC5lYWNoKG5vZGVTaGVldE5hbWVzLCBmdW5jdGlvbihpLCBub2RlU2hlZXROYW1lKSB7XG4gICAgICAgICAgICBzaGVldHNbbm9kZVNoZWV0TmFtZV0gPSBnZXROb2RlcyhzcHJlYWRzaGVldC5zaGVldHNbbm9kZVNoZWV0TmFtZV0sIG5vZGVTaGVldE5hbWUpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBDcmVhdGUgbGluayBuYW1lc1xuICAgICAgICAkLmVhY2gobm9kZVNoZWV0TmFtZXMsIGZ1bmN0aW9uKGksIG5vZGVTaGVldE5hbWUpIHtcbiAgICAgICAgICAgIGNyZWF0ZUxpbmtOYW1lcyhzaGVldHMsIHNwcmVhZHNoZWV0LnNoZWV0c1tub2RlU2hlZXROYW1lXSwgbm9kZVNoZWV0TmFtZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIENyZWF0ZSBsaW5rcyBmcm9tIG5vZGUgc2hlZXRzXG4gICAgICAgICQuZWFjaChub2RlU2hlZXROYW1lcywgZnVuY3Rpb24oaSwgbm9kZVNoZWV0TmFtZSkge1xuICAgICAgICAgICAgY3JlYXRlTGlua3Moc2hlZXRzLCBzcHJlYWRzaGVldC5zaGVldHNbbm9kZVNoZWV0TmFtZV0sIG5vZGVTaGVldE5hbWUpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBUT0RPOiBDcmVhdGUgbGlua3MgZnJvbSBsaW5rIHNoZWV0c1xuXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZUxpbmtzKHNoZWV0cywgbm9kZVNoZWV0LCBub2RlU2hlZXROYW1lKSB7XG4gICAgICAgICAgICB2YXIgc291cmNlID0gc2hlZXRzW25vZGVTaGVldE5hbWVdO1xuXG4gICAgICAgICAgICAvLyBGb3IgYWxsIHNoZWV0IHJvd3NcbiAgICAgICAgICAgICQuZWFjaChub2RlU2hlZXQucm93cywgZnVuY3Rpb24oaSwgcm93KSB7XG4gICAgICAgICAgICAgICAgLy8gRm9yIGFsbCBzaGVldCBjb2x1bW5zXG4gICAgICAgICAgICAgICAgdmFyIGNvbE5hbWVzID0gT2JqZWN0LmtleXMocm93KTtcbiAgICAgICAgICAgICAgICAkLmVhY2goY29sTmFtZXMsIGZ1bmN0aW9uKGosIGNvbE5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhpcyBpcyBhIGxpbmsgY29sdW1uXG4gICAgICAgICAgICAgICAgICAgIHZhciBsaW5rVGFyZ2V0ID0gcGFyc2VDb2x1bW5MaW5rTmFtZShjb2xOYW1lLCBzaGVldHMpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobGlua1RhcmdldCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGaW5kIGluZGV4IG9mIHRoZSB0YXJnZXQgbm9kZVxuICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKHNoZWV0c1tsaW5rVGFyZ2V0LnNoZWV0TmFtZV0ubm9kZXMsIGZ1bmN0aW9uKGssIHRhcmdldE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB0YXJnZXQgbm9kZSBwcm9wZXJ0eSB2YWx1ZSBtYXRjaGVzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJvd1tjb2xOYW1lXS5pbmRleE9mKHRhcmdldE5vZGUucHJvcGVydGllc1tsaW5rVGFyZ2V0LnByb3BlcnR5TmFtZV0pID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNvdXJjZS5ub2Rlc1tpXS5saW5rc1tsaW5rVGFyZ2V0LnNoZWV0TmFtZV0gPT0gbnVsbClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZS5ub2Rlc1tpXS5saW5rc1tsaW5rVGFyZ2V0LnNoZWV0TmFtZV0gPSBbXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBZGQgaW5kZXggb2YgdGhlIHRhcmdldCBub2RlIHRvIHRoZSBzb3VyY2Ugbm9kZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2Uubm9kZXNbaV0ubGlua3NbbGlua1RhcmdldC5zaGVldE5hbWVdLnB1c2goayk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlTGlua05hbWVzKHNoZWV0cywgbm9kZVNoZWV0LCBub2RlU2hlZXROYW1lKSB7XG4gICAgICAgICAgICB2YXIgc291cmNlID0gc2hlZXRzW25vZGVTaGVldE5hbWVdO1xuXG4gICAgICAgICAgICAvLyBHZXQgbGluayBuYW1lc1xuICAgICAgICAgICAgJC5lYWNoKG5vZGVTaGVldC5oZWFkZXIsIGZ1bmN0aW9uKGksIHByb3BlcnR5TmFtZSkge1xuICAgICAgICAgICAgICAgIHZhciBsaW5rVGFyZ2V0ID0gcGFyc2VDb2x1bW5MaW5rTmFtZShwcm9wZXJ0eU5hbWUsIHNoZWV0cyk7XG4gICAgICAgICAgICAgICAgaWYgKGxpbmtUYXJnZXQgIT0gbnVsbClcbiAgICAgICAgICAgICAgICAgICAgc291cmNlLmxpbmtOYW1lcy5wdXNoKGxpbmtUYXJnZXQuc2hlZXROYW1lKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZ2V0Tm9kZXMobm9kZVNoZWV0LCBub2RlU2hlZXROYW1lKSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0ge1xuICAgICAgICAgICAgICAgIG5hbWU6IG5vZGVTaGVldE5hbWUsXG4gICAgICAgICAgICAgICAgbGFiZWw6IG5vZGVTaGVldC5oZWFkZXJbMF0sXG4gICAgICAgICAgICAgICAgcHJvcGVydHlOYW1lczogW10sXG4gICAgICAgICAgICAgICAgbGlua05hbWVzOiBbXSxcbiAgICAgICAgICAgICAgICBub2RlczogW11cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vIEdldCBub2RlcyBhbmQgcHJvcGVydGllc1xuICAgICAgICAgICAgJC5lYWNoKG5vZGVTaGVldC5yb3dzLCBmdW5jdGlvbihpLCByb3cpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQubm9kZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IGdldE5vZGVQcm9wZXJ0aWVzKHJvdyksXG4gICAgICAgICAgICAgICAgICAgIGxpbmtzOiBbXVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIEdldCBwcm9wZXJ0eSBuYW1lc1xuICAgICAgICAgICAgJC5lYWNoKG5vZGVTaGVldC5oZWFkZXIsIGZ1bmN0aW9uKGksIGNvbE5hbWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgbGlua1RhcmdldCA9IGNvbE5hbWUuc3BsaXQoXCIuXCIpO1xuICAgICAgICAgICAgICAgIGlmIChsaW5rVGFyZ2V0Lmxlbmd0aCA9PSAxKVxuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHJvcGVydHlOYW1lcy5wdXNoKGNvbE5hbWUpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBnZXROb2RlUHJvcGVydGllcyhyb3cpIHtcbiAgICAgICAgICAgIHZhciBub2RlUHJvcGVydGllcyA9IHt9O1xuICAgICAgICAgICAgdmFyIGNvbE5hbWVzID0gT2JqZWN0LmtleXMocm93KTtcbiAgICAgICAgICAgICQuZWFjaChjb2xOYW1lcywgZnVuY3Rpb24oaSwgY29sTmFtZSkge1xuICAgICAgICAgICAgICAgIGlmIChjb2xOYW1lLmluZGV4T2YoXCIuXCIpID09IC0xKVxuICAgICAgICAgICAgICAgICAgICBub2RlUHJvcGVydGllc1tjb2xOYW1lXSA9IHJvd1tjb2xOYW1lXTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIG5vZGVQcm9wZXJ0aWVzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHNoZWV0cztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRTaGVldFR5cGVzKHNwcmVhZHNoZWV0KSB7XG4gICAgICAgIHZhciBzaGVldFR5cGVzID0ge1xuICAgICAgICAgICAgbm9kZXNTaGVldE5hbWVzOiBbXSxcbiAgICAgICAgICAgIGxpbmtTaGVldE5hbWVzOiBbXSxcbiAgICAgICAgICAgIHNldHRpbmdzU2hlZXROYW1lOiBudWxsXG4gICAgICAgIH07XG4gICAgICAgIHZhciBzaGVldE5hbWVzID0gT2JqZWN0LmtleXMoc3ByZWFkc2hlZXQuc2hlZXRzKTtcbiAgICAgICAgJC5lYWNoKHNoZWV0TmFtZXMsIGZ1bmN0aW9uKGksIHNoZWV0TmFtZSkge1xuICAgICAgICAgICAgaWYgKHNoZWV0TmFtZSA9PSBcInNldHRpbmdzXCIpIHtcbiAgICAgICAgICAgICAgICBzaGVldFR5cGVzLnNldHRpbmdzU2hlZXROYW1lID0gc2hlZXROYW1lO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHNoZWV0TmFtZS5zbGljZSgwLCAxKSA9PSBcIiNcIilcbiAgICAgICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgICAgIHZhciBsaW5rU2hlZXQgPSBwYXJzZUxpbmtTaGVldE5hbWUoc2hlZXROYW1lKVxuICAgICAgICAgICAgaWYgKChsaW5rU2hlZXQgIT0gbnVsbCkgJiZcbiAgICAgICAgICAgICAgICAoc2hlZXROYW1lcy5pbmRleE9mKGxpbmtTaGVldC5zb3VyY2UpID4gLTEpICYmXG4gICAgICAgICAgICAgICAgKHNoZWV0TmFtZXMuaW5kZXhPZihsaW5rU2hlZXQudGFyZ2V0KSA+IC0xKSkge1xuICAgICAgICAgICAgICAgIHNoZWV0VHlwZXMubGlua1NoZWV0TmFtZXMucHVzaChzaGVldE5hbWUpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzaGVldFR5cGVzLm5vZGVzU2hlZXROYW1lcy5wdXNoKHNoZWV0TmFtZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBzaGVldFR5cGVzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlQ29sdW1uTGlua05hbWUoY29sTmFtZSwgc2hlZXRzKSB7XG4gICAgICAgIHZhciBsaW5rTmFtZXMgPSBjb2xOYW1lLnNwbGl0KFwiLlwiKTtcbiAgICAgICAgaWYgKChsaW5rTmFtZXMubGVuZ3RoID09IDIpICYmXG4gICAgICAgICAgICAoc2hlZXRzW2xpbmtOYW1lc1swXV0gIT0gbnVsbCkgJiZcbiAgICAgICAgICAgIChzaGVldHNbbGlua05hbWVzWzBdXS5wcm9wZXJ0eU5hbWVzLmluZGV4T2YobGlua05hbWVzWzFdKSA+IC0xKSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzaGVldE5hbWU6IGxpbmtOYW1lc1swXSxcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eU5hbWU6IGxpbmtOYW1lc1sxXVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VMaW5rU2hlZXROYW1lKHNoZWV0TmFtZSkge1xuICAgICAgICB2YXIgbm9kZU5hbWVzID0gc2hlZXROYW1lLnNwbGl0KFwiLVwiKTtcbiAgICAgICAgaWYgKG5vZGVOYW1lcy5sZW5ndGggPT0gMikge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzb3VyY2U6IG5vZGVOYW1lc1swXSxcbiAgICAgICAgICAgICAgICB0YXJnZXQ6IG5vZGVOYW1lc1sxXVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiBtb2RlbDtcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNwcmVhZHNoZWV0S2V5LCBvbkxvYWRlZCkge1xuICAgIC8vIEdldCBzaGVldCBjb3VudFxuICAgIGdldFNwcmVhZHNoZWV0SW5mbyhzcHJlYWRzaGVldEtleSwgZnVuY3Rpb24gb25TdWNjZXNzKGluZm8pIHtcbiAgICAgICAgLy8gTG9hZCBhbGwgc2hlZXRzXG4gICAgICAgIGxvYWRTaGVldHMoc3ByZWFkc2hlZXRLZXksIGluZm8pO1xuICAgIH0pO1xuXG4gICAgZnVuY3Rpb24gbG9hZFNoZWV0cyhzcHJlYWRzaGVldEtleSwgaW5mbykge1xuICAgICAgICB2YXIgc3ByZWFkc2hlZXQgPSB7XG4gICAgICAgICAgICB0aXRsZTogaW5mby50aXRsZSxcbiAgICAgICAgICAgIHNoZWV0czoge31cbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGxvYWRlZFNoZWV0Q291bnQgPSAwO1xuICAgICAgICBmb3IgKGkgPSAxOyBpIDw9IGluZm8uc2hlZXRDb3VudDsgaSsrKSB7XG4gICAgICAgICAgICBsb2FkU2hlZXQoc3ByZWFkc2hlZXQsIHNwcmVhZHNoZWV0S2V5LCBpKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGxvYWRlZFNoZWV0Q291bnQgKz0gMTtcbiAgICAgICAgICAgICAgICBpZiAobG9hZGVkU2hlZXRDb3VudCA9PSBpbmZvLnNoZWV0Q291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgb25Mb2FkZWQoc3ByZWFkc2hlZXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsb2FkU2hlZXQoc3ByZWFkc2hlZXQsIHNwcmVhZHNoZWV0S2V5LCBzaGVldEluZGV4KSB7XG4gICAgICAgIHJldHVybiBnZXRTaGVldChzcHJlYWRzaGVldEtleSwgc2hlZXRJbmRleCwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHZhciBzaGVldCA9IHNwcmVhZHNoZWV0LnNoZWV0c1tyZXNwb25zZS5mZWVkLnRpdGxlLiR0XSA9IHtcbiAgICAgICAgICAgICAgICBoZWFkZXI6IFtdLFxuICAgICAgICAgICAgICAgIHJvd3M6IFtdLFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgJC5lYWNoKHJlc3BvbnNlLmZlZWQuZW50cnksIGZ1bmN0aW9uKGksIGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZS5ncyRjZWxsLnJvdyA9PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHNoZWV0LmhlYWRlcltlLmdzJGNlbGwuY29sIC0gMV0gPSBlLmNvbnRlbnQuJHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSBlLmdzJGNlbGwucm93IC0gMjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNoZWV0LnJvd3NbaW5kZXhdID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNoZWV0LnJvd3NbaW5kZXhdID0ge307XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc2hlZXQucm93c1tpbmRleF1bc2hlZXQuaGVhZGVyW2UuZ3MkY2VsbC5jb2wgLSAxXV0gPSBlLmNvbnRlbnQuJHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFNoZWV0KHNwcmVhZHNoZWV0S2V5LCBzaGVldEluZGV4LCBvblN1Y2Nlc3MpIHtcbiAgICAgICAgcmV0dXJuICQuYWpheCh7XG4gICAgICAgICAgICB1cmw6IFwiaHR0cHM6Ly9zcHJlYWRzaGVldHMuZ29vZ2xlLmNvbS9mZWVkcy9jZWxscy9cIiArIHNwcmVhZHNoZWV0S2V5ICsgXCIvXCIgKyBzaGVldEluZGV4ICsgXCIvcHVibGljL3ZhbHVlcz9hbHQ9anNvbi1pbi1zY3JpcHRcIixcbiAgICAgICAgICAgIGpzb25wOiBcImNhbGxiYWNrXCIsXG4gICAgICAgICAgICBkYXRhVHlwZTogXCJqc29ucFwiLFxuICAgICAgICAgICAgc3VjY2Vzczogb25TdWNjZXNzXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFNwcmVhZHNoZWV0SW5mbyhzcHJlYWRzaGVldEtleSwgb25TdWNjZXNzKSB7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmw6IFwiaHR0cHM6Ly9zcHJlYWRzaGVldHMuZ29vZ2xlLmNvbS9mZWVkcy93b3Jrc2hlZXRzL1wiICsgc3ByZWFkc2hlZXRLZXkgKyBcIi9wdWJsaWMvZnVsbD9hbHQ9anNvbi1pbi1zY3JpcHRcIixcbiAgICAgICAgICAgIGpzb25wOiBcImNhbGxiYWNrXCIsXG4gICAgICAgICAgICBkYXRhVHlwZTogXCJqc29ucFwiLFxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICB2YXIgaW5mbyA9IHtcbiAgICAgICAgICAgICAgICAgICAgc2hlZXRDb3VudDogcmVzcG9uc2UuZmVlZC5lbnRyeS5sZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiByZXNwb25zZS5mZWVkLnRpdGxlLiR0XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBvblN1Y2Nlc3MoaW5mbyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbn0iXX0=
