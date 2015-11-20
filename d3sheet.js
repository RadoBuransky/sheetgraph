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
            console.log(spreadsheet);

            d3sheet.spreadsheet = spreadsheet;

            // Initialize document
            document.title = spreadsheet.title;

            // Initialize info section
            var infoModule = require("./info");
            var info = infoModule(d3sheet.infoContainerId, spreadsheet.title);

            // Create model from spreadsheet
            var modelModule = require("./model");
            d3sheet.model = modelModule(d3sheet.spreadsheet);

            console.log(d3sheet.model);

            // Create graph from model
            var graphModule = require("./graph");
            d3sheet.graph = graphModule(d3sheet.model);

            console.log(d3sheet.graph);

            // Create D3 force layout from graph
            var forceModule = require("./force");
            var force = forceModule(d3sheet.graph, d3sheet.svgContainerId, d3sheet.svg, info, spreadsheet.settings);

            // Initialize view options
//            var viewModule = require("./view");
//            viewModule(d3sheet.model, force.updateGraph);

            // Apply CSS style
            applyCss(d3sheet.model.settings.css);
        });
    }

    function applyCss(css) {
        if (css == null)
            return;

        // Get all element selectors
        var selectors = Object.keys(css);
        $.each(selectors, function(i, selector) {
            var elements = {};
            if (selector.slice(0, 1) == "#")
                // It is an identifier
                elements = $(selector);
            else
                // Is is a class
                elements = $("." + selector);

            // Get all style properties
            var properties = Object.keys(css[selector]);
            $.each(properties, function(j, property) {
                elements.css(property, css[selector][property]);
            });
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
        .linkDistance(170) // TODO: Move to settings
        .charge(-5000) // TODO: Move to settings
        .gravity(0.3) // TODO: Move to settings
        .nodes(graph.nodes)
        .links(graph.links)
        .on("tick", onTick);

    restart();

    function restart(viewOptions) {
        svg.selectAll(".link")
            .data(graph.links)
            .enter()
            .append("line")
            .attr("class", "link");

        svg.selectAll(".link-label")
            .data(graph.links)
            .enter()
            .append("text")
            .text(function(graphLink) { return graphLink.label; })
            .attr("class", "link-label")
            .attr("text-anchor", "middle");

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
            .text(function(graphNode) { return graphNode.node.label(); })
            .call(force.drag)
            .on("click", nodeClick);

        selectAll();
        force.start();
    }

    function nodeClick(graphNode) {
        info.showNode(graphNode.node, nodeFillColor(graphNode));
    }

    function nodeFillColor(graphNode) {
        return colors(graphNode.node.nodeGroup.name);
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

    return this;
}
},{}],3:[function(require,module,exports){
module.exports = function(model) {
    var graph = new Graph();

    // For all sheets
    $.each(model.nodeGroups, function(i, nodeGroup) {
        // For all nodes
        $.each(nodeGroup.nodes, function(j, node) {
            // Add node to graph
            var graphNode = new GraphNode(node);
            graph.nodes.push(graphNode);
        });
    });

    // Create links
    $.each(graph.nodes, function(i, graphNode) {
        $.each(graphNode.node.refs, function(j, ref) {
            graph.links.push(new GraphLink(graphNode, getGraphNode(ref.targetNode), ref.label));
        });
    });

    function getGraphNode(node) {
        var result = null;
        $.each(graph.nodes, function(i, graphNode) {
            if (graphNode.node == node) {
                result = graphNode;
                return false;
            }
        });
        return result;
    }

    return graph;
}

function Graph() {
    this.nodes = [];
    this.links = [];
    return this;
}

function GraphNode(node) {
    this.node = node;
    return this;
}

function GraphLink(source, target, label) {
    this.source = source;
    this.target = target;
    this.label = label;
    return this;
}
},{}],4:[function(require,module,exports){
module.exports = function(infoContainerId, title) {
    // Set heading
    $("#" + infoContainerId + " h1").text(title);

    this.showNode = function(node, fillColor) {
        $("#d3sheet-node-info h2").text(node.label());
        $("#d3sheet-node-info header").css("background-color", fillColor);
        $("#d3sheet-node-sheet-name").text(node.nodeGroup.name);

        var ul = $("#d3sheet-node-properties");
        ul.empty();

        // Show node properties
        $.each(node.properties, function(i, nodeProperty) {
            if (nodeProperty.name != node.labelPropertyName)
                addProperty(nodeProperty.name, nodeProperty.value);
        });

        // Group node links
        var groupedLinks = {};
        $.each(node.refs, function(i, ref) {
            var linkName = ref.label;
            if (linkName == null)
                linkName = ref.targetNode.nodeGroup.name;

            if (groupedLinks[linkName] == null)
                groupedLinks[linkName] = [];

            groupedLinks[linkName].push(ref.targetNode.label());
        });

        // Show node links
        var linkNames = Object.keys(groupedLinks);
        $.each(linkNames, function(i, linkName) {
            addProperty(linkName, groupedLinks[linkName].join(", "));
        });

        function addProperty(name, value) {
            ul.append("<li><span class=\"d3sheet-node-property-name\">" + name +
                ":</span> <span class=\"d3sheet-node-property-value\">" + formatValue(value) + "</span></li>");
        }

        function formatValue(value) {
            if (value.slice(0, "4").toLowerCase() == "http")
                return "<a href=\"" + value + "\">" + value + "</a>"

            return value;
        }
    }

    return this;
}
},{}],5:[function(require,module,exports){
module.exports = function(spreadsheet) {
    var model = new Model();

    var nodeGroupTypes = getNodeGroupTypes(spreadsheet);
    model.nodeGroups = getNodeGroups(spreadsheet, nodeGroupTypes.nodeGroupNames);
    if (nodeGroupTypes.settingsGroupName != null)
        model.settings = spreadsheet.sheets[nodeGroupTypes.settingsGroupName];

    function getNodeGroups(spreadsheet, nodeGroupNames) {
        // Create nodes with properties
        var nodeGroups = new NodeGroups();
        $.each(nodeGroupNames, function(i, nodeGroupName) {
            nodeGroups[nodeGroupName] = getNodes(spreadsheet.sheets[nodeGroupName], nodeGroupName);
        });

        // Create references from node sheets
        $.each(nodeGroupNames, function(i, nodeGroupName) {
            createRefs(nodeGroups, spreadsheet.sheets[nodeGroupName], nodeGroupName);
        });

        // TODO: Create references from reference sheets

        function createRefs(nodeGroups, nodeSheet, nodeGroupName) {
            var nodeGroup = nodeGroups[nodeGroupName];
            var colNames = nodeSheet.header();

            // For all sheet rows
            $.each(nodeSheet.rows, function(i, row) {
                if (i == 0)
                    return;

                // For all sheet columns
                $.each(colNames, function(j, colName) {
                    var value = nodeSheet.value(row, colName);
                    if (value == null)
                        return;

                    // If this is a reference column
                    var refTarget = parseColumnRefName(colName, nodeGroups);
                    if (refTarget != null) {
                        // Find index of the target node
                        $.each(nodeGroups[refTarget.sheetName].nodes, function(k, targetNode) {
                            // If target node property value matches
                            // TODO: We should properly split values using comma
                            if (value.indexOf(targetNode.value(refTarget.propertyName)) > -1) {
                                nodeGroup.nodes[i - 1].refs.push(new Ref(targetNode, refTarget.label));
                            }
                        });
                    }
                });
            });
        }

        function getNodes(nodeSheet, nodeGroupName) {
            var header = nodeSheet.header();
            var result = new NodeGroup(nodeGroupName, header[0]);

            // Get nodes and properties
            $.each(nodeSheet.rows, function(i, row) {
                if (i == 0)
                    return;
                result.nodes.push(new Node(getNodeProperties(row, header), result));
            });

            return result;
        }

        function getNodeProperties(row, header) {
            var nodeProperties = [];
            $.each(row.rowCells, function(i, rowCell) {
                var colName = header[rowCell.colIndex];
                if (colName.indexOf(".") == -1)
                    nodeProperties.push(new NodeProperty(colName, rowCell.value));
            });
            return nodeProperties;
        }

        return nodeGroups;
    }

    function getNodeGroupTypes(spreadsheet) {
        var nodeGroupTypes = {
            nodeGroupNames: [],
            refSheetNames: [],
            settingsGroupName: null
        };
        var sheetNames = Object.keys(spreadsheet.sheets);
        $.each(sheetNames, function(i, sheetName) {
            if (sheetName == "settings") {
                nodeGroupTypes.settingsGroupName = sheetName;
                return;
            }

            if (sheetName.slice(0, 1) == "#")
                return;

            var refSheet = parseRefSheetName(sheetName)
            if ((refSheet != null) &&
                (sheetNames.indexOf(refSheet.source) > -1) &&
                (sheetNames.indexOf(refSheet.target) > -1)) {
                nodeGroupTypes.refSheetNames.push(sheetName)
                return;
            }

            nodeGroupTypes.nodeGroupNames.push(sheetName);
        });

        return nodeGroupTypes;
    }

    function parseColumnRefName(colName, sheets) {
        var refNames = colName.split(".");
        if ((refNames.length >= 2) &&
            (sheets[refNames[0]] != null)) {
            var result = {
                sheetName: refNames[0],
                propertyName: refNames[1]
            }

            if (refNames.length == 3)
                result.label = refNames[2];

            return result;
        }

        return null;
    }

    function parseRefSheetName(sheetName) {
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

function Model() {
    this.nodeGroups = {};
    this.settings = {};
    return this;
}

function NodeGroups() {
    return this;
}

function NodeGroup(name, labelPropertyName) {
    this.name = name;
    this.labelPropertyName = labelPropertyName;
    this.nodes = [];
    return this;
}

function Node(properties, nodeGroup) {
    this.properties = properties;
    this.refs = [];
    this.nodeGroup = nodeGroup;
    return this;
}

function Ref(targetNode, label) {
    this.targetNode = targetNode;
    this.label = label;
    return this;
}

Node.prototype.value = function(propertyName) {
    var result = null;
    $.each(this.properties, function(i, property) {
        if (property.name == propertyName) {
            result = property.value;
            return false;
        }
    });
    return result;
}

Node.prototype.label = function() {
    return this.value(this.nodeGroup.labelPropertyName);
}

function NodeProperty(name, value) {
    this.name = name;
    this.value = value;
    return this;
}
},{}],6:[function(require,module,exports){
module.exports = function(spreadsheetKey, onLoaded) {
    // Get sheet count
    getSpreadsheetInfo(spreadsheetKey, function onSuccess(info) {
        // Load all sheets
        loadSheets(spreadsheetKey, info);
    });

    function loadSheets(spreadsheetKey, info) {
        var spreadsheet = new Spreadsheet(spreadsheetKey, info.title);
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
            var sheet = spreadsheet.sheets[response.feed.title.$t] = new Sheet();

            $.each(response.feed.entry, function(i, e) {
                var index = e.gs$cell.row - 1;
                if (sheet.rows[index] == null) {
                    sheet.rows[index] = new Row(index);
                }
                sheet.rows[index].rowCells.push(new RowCell(e.gs$cell.col - 1, e.content.$t));
            });

            // Sort row cells by col index
            $.each(sheet.rows, function(i, row) {
                row.rowCells.sort(function(c1, c2) { return c1.colIndex - c2.colIndex; });
            });
        });
    }

//    function loadSettingsSheet(settingsSheet, spreadsheet) {
//        // Map cells to list
//        var settingsList = {};
//        $.each(settingsSheet.feed.entry, function(i, e) {
//            if (settingsList[e.gs$cell.row] == null)
//                settingsList[e.gs$cell.row] = {};
//
//            if (e.gs$cell.col == 1)
//                settingsList[e.gs$cell.row].key = e.content.$t;
//            else
//                if (e.gs$cell.col == 2)
//                    settingsList[e.gs$cell.row].value = e.content.$t;
//        });
//
//        // Map list to object
//        $.each(settingsList, function(i, s) {
//            if ((s.key == null) || (s.value == null))
//                return;
//
//            // Create inner objects
//            var path = s.key.split(".");
//            var current = spreadsheet.settings;
//            $.each(path, function(j, k) {
//                if (current[k] == null) {
//                    if (j == path.length - 1)
//                        current[k] = s.value;
//                    else
//                        current[k] = {};
//                }
//                current = current[k];
//            });
//        });
//    }

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

function Spreadsheet(spreadsheetKey, title) {
    this.key = spreadsheetKey;
    this.title = title;
    this.sheets = new Sheets();

    return this;
}

function Sheets() {
    return this;
}

function Sheet() {
    this.rows = [];
    return this;
}

Sheet.prototype.header = function() {
    return this.rows[0].values();
}

Sheet.prototype.value = function(row, colName) {
    var colIndex = this.header().indexOf(colName);
    if (colIndex == -1)
        return null;

    var result = null;
    $.each(row.rowCells, function(i, rowCell) {
        if (rowCell.colIndex == colIndex) {
            result = rowCell.value;
            return false;
        }
    });

    return result;
}

function Row(rowIndex) {
    this.rowIndex = rowIndex;
    this.rowCells = [];

    return this;
}

Row.prototype.values = function() {
    return $.map(this.rowCells, function(rowCell, i) {
        return rowCell.value;
    });
}

function RowCell(colIndex, value) {
    this.colIndex = colIndex;
    this.value = value;
    return this;
}
},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2Jpbi9ub2RlLXY1LjAuMC1saW51eC14NjQvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwic3JjL2Qzc2hlZXQuanMiLCJzcmMvZm9yY2UuanMiLCJzcmMvZ3JhcGguanMiLCJzcmMvaW5mby5qcyIsInNyYy9tb2RlbC5qcyIsInNyYy9zcHJlYWRzaGVldC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIiFmdW5jdGlvbigpIHtcbiAgICBjaGVja1JlcXVpcmVtZW50cygpO1xuXG4gICAgdmFyIGQzc2hlZXQgPSB7XG4gICAgICAgIHZlcjogXCIxLjAuMFwiLFxuICAgICAgICBzdmdDb250YWluZXJJZDogXCJcIixcbiAgICAgICAgaW5mb0NvbnRhaW5lcklkOiBcIlwiLFxuICAgICAgICBzdmc6IHt9LFxuICAgICAgICBzcHJlYWRzaGVldDoge30sXG4gICAgICAgIG1vZGVsOiB7fVxuICAgIH07XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IGQzc2hlZXQ7XG5cbiAgICAvKipcbiAgICAqIEluaXRpYWxpemUgRDMgc2hlZXQuXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gY29udGFpbmVySWQgLSBpZGVudGlmaWVyIG9mIHRoZSBtYWluIERJVi5cbiAgICAqKi9cbiAgICBkM3NoZWV0LmluaXQgPSBmdW5jdGlvbihzdmdDb250YWluZXJJZCwgaW5mb0NvbnRhaW5lcklkKSB7XG4gICAgICAgIGlmIChzdmdDb250YWluZXJJZCA9PSBudWxsKVxuICAgICAgICAgICAgc3ZnQ29udGFpbmVySWQgPSBcImQzc2hlZXQtc3ZnXCI7XG4gICAgICAgIGQzc2hlZXQuc3ZnQ29udGFpbmVySWQgPSBzdmdDb250YWluZXJJZDtcblxuICAgICAgICBpZiAoaW5mb0NvbnRhaW5lcklkID09IG51bGwpXG4gICAgICAgICAgICBpbmZvQ29udGFpbmVySWQgPSBcImQzc2hlZXQtaW5mb1wiO1xuICAgICAgICBkM3NoZWV0LmluZm9Db250YWluZXJJZCA9IGluZm9Db250YWluZXJJZDtcblxuICAgICAgICB2YXIgc3ZnQ29udGFpbmVyID0gJChcIiNcIiArIHN2Z0NvbnRhaW5lcklkKSxcbiAgICAgICAgICAgIHdpZHRoID0gc3ZnQ29udGFpbmVyLndpZHRoKCksXG4gICAgICAgICAgICBoZWlnaHQgPSBzdmdDb250YWluZXIuaGVpZ2h0KCk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIFNWRyBlbGVtZW50XG4gICAgICAgIGQzc2hlZXQuc3ZnID0gZDMuc2VsZWN0KFwiI1wiICsgc3ZnQ29udGFpbmVySWQpXG4gICAgICAgICAgICAuYXBwZW5kKFwic3ZnXCIpXG4gICAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIFwiMTAwJVwiKVxuICAgICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgXCIxMDAlXCIpXG4gICAgICAgICAgICAuYXR0cigndmlld0JveCcsIFwiMCAwIFwiICsgd2lkdGggKyBcIiBcIiArIGhlaWdodCk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIGluZm8gcGFuZWxcbiAgICAgICAgZDMuc2VsZWN0KFwiI1wiICsgaW5mb0NvbnRhaW5lcklkKVxuICAgICAgICAgICAgLmFwcGVuZChcImRpdlwiKTtcblxuICAgICAgICByZXR1cm4gZDNzaGVldDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAqIExvYWQgZGF0YSBmcm9tIHNwcmVhZHNoZWV0LlxuICAgICoqL1xuICAgIGQzc2hlZXQubG9hZCA9IGZ1bmN0aW9uKHNwcmVhZHNoZWV0S2V5KSB7XG4gICAgICAgIC8vIExvYWQgc3ByZWFkc2hlZXRcbiAgICAgICAgdmFyIHNwcmVhZHNoZWV0ID0gcmVxdWlyZShcIi4vc3ByZWFkc2hlZXRcIik7XG4gICAgICAgIHNwcmVhZHNoZWV0KHNwcmVhZHNoZWV0S2V5LCBmdW5jdGlvbihzcHJlYWRzaGVldCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coc3ByZWFkc2hlZXQpO1xuXG4gICAgICAgICAgICBkM3NoZWV0LnNwcmVhZHNoZWV0ID0gc3ByZWFkc2hlZXQ7XG5cbiAgICAgICAgICAgIC8vIEluaXRpYWxpemUgZG9jdW1lbnRcbiAgICAgICAgICAgIGRvY3VtZW50LnRpdGxlID0gc3ByZWFkc2hlZXQudGl0bGU7XG5cbiAgICAgICAgICAgIC8vIEluaXRpYWxpemUgaW5mbyBzZWN0aW9uXG4gICAgICAgICAgICB2YXIgaW5mb01vZHVsZSA9IHJlcXVpcmUoXCIuL2luZm9cIik7XG4gICAgICAgICAgICB2YXIgaW5mbyA9IGluZm9Nb2R1bGUoZDNzaGVldC5pbmZvQ29udGFpbmVySWQsIHNwcmVhZHNoZWV0LnRpdGxlKTtcblxuICAgICAgICAgICAgLy8gQ3JlYXRlIG1vZGVsIGZyb20gc3ByZWFkc2hlZXRcbiAgICAgICAgICAgIHZhciBtb2RlbE1vZHVsZSA9IHJlcXVpcmUoXCIuL21vZGVsXCIpO1xuICAgICAgICAgICAgZDNzaGVldC5tb2RlbCA9IG1vZGVsTW9kdWxlKGQzc2hlZXQuc3ByZWFkc2hlZXQpO1xuXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhkM3NoZWV0Lm1vZGVsKTtcblxuICAgICAgICAgICAgLy8gQ3JlYXRlIGdyYXBoIGZyb20gbW9kZWxcbiAgICAgICAgICAgIHZhciBncmFwaE1vZHVsZSA9IHJlcXVpcmUoXCIuL2dyYXBoXCIpO1xuICAgICAgICAgICAgZDNzaGVldC5ncmFwaCA9IGdyYXBoTW9kdWxlKGQzc2hlZXQubW9kZWwpO1xuXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhkM3NoZWV0LmdyYXBoKTtcblxuICAgICAgICAgICAgLy8gQ3JlYXRlIEQzIGZvcmNlIGxheW91dCBmcm9tIGdyYXBoXG4gICAgICAgICAgICB2YXIgZm9yY2VNb2R1bGUgPSByZXF1aXJlKFwiLi9mb3JjZVwiKTtcbiAgICAgICAgICAgIHZhciBmb3JjZSA9IGZvcmNlTW9kdWxlKGQzc2hlZXQuZ3JhcGgsIGQzc2hlZXQuc3ZnQ29udGFpbmVySWQsIGQzc2hlZXQuc3ZnLCBpbmZvLCBzcHJlYWRzaGVldC5zZXR0aW5ncyk7XG5cbiAgICAgICAgICAgIC8vIEluaXRpYWxpemUgdmlldyBvcHRpb25zXG4vLyAgICAgICAgICAgIHZhciB2aWV3TW9kdWxlID0gcmVxdWlyZShcIi4vdmlld1wiKTtcbi8vICAgICAgICAgICAgdmlld01vZHVsZShkM3NoZWV0Lm1vZGVsLCBmb3JjZS51cGRhdGVHcmFwaCk7XG5cbiAgICAgICAgICAgIC8vIEFwcGx5IENTUyBzdHlsZVxuICAgICAgICAgICAgYXBwbHlDc3MoZDNzaGVldC5tb2RlbC5zZXR0aW5ncy5jc3MpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhcHBseUNzcyhjc3MpIHtcbiAgICAgICAgaWYgKGNzcyA9PSBudWxsKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIC8vIEdldCBhbGwgZWxlbWVudCBzZWxlY3RvcnNcbiAgICAgICAgdmFyIHNlbGVjdG9ycyA9IE9iamVjdC5rZXlzKGNzcyk7XG4gICAgICAgICQuZWFjaChzZWxlY3RvcnMsIGZ1bmN0aW9uKGksIHNlbGVjdG9yKSB7XG4gICAgICAgICAgICB2YXIgZWxlbWVudHMgPSB7fTtcbiAgICAgICAgICAgIGlmIChzZWxlY3Rvci5zbGljZSgwLCAxKSA9PSBcIiNcIilcbiAgICAgICAgICAgICAgICAvLyBJdCBpcyBhbiBpZGVudGlmaWVyXG4gICAgICAgICAgICAgICAgZWxlbWVudHMgPSAkKHNlbGVjdG9yKTtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAvLyBJcyBpcyBhIGNsYXNzXG4gICAgICAgICAgICAgICAgZWxlbWVudHMgPSAkKFwiLlwiICsgc2VsZWN0b3IpO1xuXG4gICAgICAgICAgICAvLyBHZXQgYWxsIHN0eWxlIHByb3BlcnRpZXNcbiAgICAgICAgICAgIHZhciBwcm9wZXJ0aWVzID0gT2JqZWN0LmtleXMoY3NzW3NlbGVjdG9yXSk7XG4gICAgICAgICAgICAkLmVhY2gocHJvcGVydGllcywgZnVuY3Rpb24oaiwgcHJvcGVydHkpIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50cy5jc3MocHJvcGVydHksIGNzc1tzZWxlY3Rvcl1bcHJvcGVydHldKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjaGVja1JlcXVpcmVtZW50cygpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBkMyA9PT0gXCJ1bmRlZmluZWRcIilcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkQzIGxpYnJhcnkgbm90IGZvdW5kIVwiKTtcbiAgICAgICAgaWYgKHR5cGVvZiAkID09PSBcInVuZGVmaW5lZFwiKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwialF1ZXJ5IG5vdCBmb3VuZCFcIik7XG4gICAgfVxufSgpOyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZ3JhcGgsIHN2Z0NvbnRhaW5lcklkLCBzdmcsIGluZm8pIHtcbiAgICB2YXIgbm9kZSA9IFtdLFxuICAgICAgICBub2RlTGFiZWwgPSBbXSxcbiAgICAgICAgbGluayA9IFtdLFxuICAgICAgICBsaW5rTGFiZWwgPSBbXSxcbiAgICAgICAgY29sb3JzID0gZDMuc2NhbGUuY2F0ZWdvcnkyMCgpO1xuXG4gICAgdmFyIHN2Z0NvbnRhaW5lciA9ICQoXCIjXCIgKyBzdmdDb250YWluZXJJZCksXG4gICAgICAgIHdpZHRoID0gc3ZnQ29udGFpbmVyLndpZHRoKCksXG4gICAgICAgIGhlaWdodCA9IHN2Z0NvbnRhaW5lci5oZWlnaHQoKTtcblxuICAgIHNlbGVjdEFsbCgpO1xuXG4gICAgdmFyIGZvcmNlID0gZDMubGF5b3V0LmZvcmNlKClcbiAgICAgICAgLnNpemUoW3dpZHRoLCBoZWlnaHRdKVxuICAgICAgICAubGlua0Rpc3RhbmNlKDE3MCkgLy8gVE9ETzogTW92ZSB0byBzZXR0aW5nc1xuICAgICAgICAuY2hhcmdlKC01MDAwKSAvLyBUT0RPOiBNb3ZlIHRvIHNldHRpbmdzXG4gICAgICAgIC5ncmF2aXR5KDAuMykgLy8gVE9ETzogTW92ZSB0byBzZXR0aW5nc1xuICAgICAgICAubm9kZXMoZ3JhcGgubm9kZXMpXG4gICAgICAgIC5saW5rcyhncmFwaC5saW5rcylcbiAgICAgICAgLm9uKFwidGlja1wiLCBvblRpY2spO1xuXG4gICAgcmVzdGFydCgpO1xuXG4gICAgZnVuY3Rpb24gcmVzdGFydCh2aWV3T3B0aW9ucykge1xuICAgICAgICBzdmcuc2VsZWN0QWxsKFwiLmxpbmtcIilcbiAgICAgICAgICAgIC5kYXRhKGdyYXBoLmxpbmtzKVxuICAgICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAgIC5hcHBlbmQoXCJsaW5lXCIpXG4gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibGlua1wiKTtcblxuICAgICAgICBzdmcuc2VsZWN0QWxsKFwiLmxpbmstbGFiZWxcIilcbiAgICAgICAgICAgIC5kYXRhKGdyYXBoLmxpbmtzKVxuICAgICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgICAgICAudGV4dChmdW5jdGlvbihncmFwaExpbmspIHsgcmV0dXJuIGdyYXBoTGluay5sYWJlbDsgfSlcbiAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJsaW5rLWxhYmVsXCIpXG4gICAgICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpO1xuXG4gICAgICAgIHN2Zy5zZWxlY3RBbGwoXCIubm9kZVwiKVxuICAgICAgICAgICAgLmRhdGEoZ3JhcGgubm9kZXMpXG4gICAgICAgICAgICAuZW50ZXIoKVxuICAgICAgICAgICAgLmFwcGVuZChcImNpcmNsZVwiKVxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcIm5vZGVcIilcbiAgICAgICAgICAgIC5hdHRyKFwiclwiLCAzMCkgLy8gVE9ETzogU2V0dGluZ3NcbiAgICAgICAgICAgIC5hdHRyKFwieFwiLCAwKVxuICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIDApXG4gICAgICAgICAgICAuYXR0cihcImZpbGxcIiwgbm9kZUZpbGxDb2xvcilcbiAgICAgICAgICAgIC5jYWxsKGZvcmNlLmRyYWcpXG4gICAgICAgICAgICAub24oXCJjbGlja1wiLCBub2RlQ2xpY2spO1xuXG4gICAgICAgIHN2Zy5zZWxlY3RBbGwoXCIubm9kZS1sYWJlbFwiKVxuICAgICAgICAgICAgLmRhdGEoZ3JhcGgubm9kZXMpXG4gICAgICAgICAgICAuZW50ZXIoKVxuICAgICAgICAgICAgLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJub2RlLWxhYmVsXCIpXG4gICAgICAgICAgICAuYXR0cihcImR5XCIsIFwiLjM1ZW1cIilcbiAgICAgICAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIilcbiAgICAgICAgICAgIC50ZXh0KGZ1bmN0aW9uKGdyYXBoTm9kZSkgeyByZXR1cm4gZ3JhcGhOb2RlLm5vZGUubGFiZWwoKTsgfSlcbiAgICAgICAgICAgIC5jYWxsKGZvcmNlLmRyYWcpXG4gICAgICAgICAgICAub24oXCJjbGlja1wiLCBub2RlQ2xpY2spO1xuXG4gICAgICAgIHNlbGVjdEFsbCgpO1xuICAgICAgICBmb3JjZS5zdGFydCgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG5vZGVDbGljayhncmFwaE5vZGUpIHtcbiAgICAgICAgaW5mby5zaG93Tm9kZShncmFwaE5vZGUubm9kZSwgbm9kZUZpbGxDb2xvcihncmFwaE5vZGUpKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBub2RlRmlsbENvbG9yKGdyYXBoTm9kZSkge1xuICAgICAgICByZXR1cm4gY29sb3JzKGdyYXBoTm9kZS5ub2RlLm5vZGVHcm91cC5uYW1lKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZWxlY3RBbGwoKSB7XG4gICAgICAgIG5vZGUgPSBzdmcuc2VsZWN0QWxsKFwiLm5vZGVcIik7XG4gICAgICAgIG5vZGVMYWJlbCA9IHN2Zy5zZWxlY3RBbGwoXCIubm9kZS1sYWJlbFwiKTtcbiAgICAgICAgbGluayA9IHN2Zy5zZWxlY3RBbGwoXCIubGlua1wiKTtcbiAgICAgICAgbGlua0xhYmVsID0gc3ZnLnNlbGVjdEFsbChcIi5saW5rLWxhYmVsXCIpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG9uVGljaygpIHtcbiAgICAgICAgbGluay5hdHRyKFwieDFcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5zb3VyY2UueDsgfSlcbiAgICAgICAgICAgIC5hdHRyKFwieTFcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5zb3VyY2UueTsgfSlcbiAgICAgICAgICAgIC5hdHRyKFwieDJcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50YXJnZXQueDsgfSlcbiAgICAgICAgICAgIC5hdHRyKFwieTJcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50YXJnZXQueTsgfSk7XG5cbiAgICAgICAgbGlua0xhYmVsXG4gICAgICAgICAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAoZC5zb3VyY2UueCArIGQudGFyZ2V0LngpLzI7IH0pXG4gICAgICAgICAgICAuYXR0cihcInlcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAoZC5zb3VyY2UueSArIGQudGFyZ2V0LnkpLzI7IH0pO1xuXG4gICAgICAgIG5vZGUuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJ0cmFuc2xhdGUoXCIgKyBkLnggKyBcIixcIiArIGQueSArIFwiKVwiO1xuICAgICAgICB9KTtcblxuICAgICAgICBub2RlTGFiZWxcbiAgICAgICAgICAgIC5hdHRyKFwieFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLng7IH0pXG4gICAgICAgICAgICAuYXR0cihcInlcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC55OyB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgdmFyIGdyYXBoID0gbmV3IEdyYXBoKCk7XG5cbiAgICAvLyBGb3IgYWxsIHNoZWV0c1xuICAgICQuZWFjaChtb2RlbC5ub2RlR3JvdXBzLCBmdW5jdGlvbihpLCBub2RlR3JvdXApIHtcbiAgICAgICAgLy8gRm9yIGFsbCBub2Rlc1xuICAgICAgICAkLmVhY2gobm9kZUdyb3VwLm5vZGVzLCBmdW5jdGlvbihqLCBub2RlKSB7XG4gICAgICAgICAgICAvLyBBZGQgbm9kZSB0byBncmFwaFxuICAgICAgICAgICAgdmFyIGdyYXBoTm9kZSA9IG5ldyBHcmFwaE5vZGUobm9kZSk7XG4gICAgICAgICAgICBncmFwaC5ub2Rlcy5wdXNoKGdyYXBoTm9kZSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIGxpbmtzXG4gICAgJC5lYWNoKGdyYXBoLm5vZGVzLCBmdW5jdGlvbihpLCBncmFwaE5vZGUpIHtcbiAgICAgICAgJC5lYWNoKGdyYXBoTm9kZS5ub2RlLnJlZnMsIGZ1bmN0aW9uKGosIHJlZikge1xuICAgICAgICAgICAgZ3JhcGgubGlua3MucHVzaChuZXcgR3JhcGhMaW5rKGdyYXBoTm9kZSwgZ2V0R3JhcGhOb2RlKHJlZi50YXJnZXROb2RlKSwgcmVmLmxhYmVsKSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZnVuY3Rpb24gZ2V0R3JhcGhOb2RlKG5vZGUpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IG51bGw7XG4gICAgICAgICQuZWFjaChncmFwaC5ub2RlcywgZnVuY3Rpb24oaSwgZ3JhcGhOb2RlKSB7XG4gICAgICAgICAgICBpZiAoZ3JhcGhOb2RlLm5vZGUgPT0gbm9kZSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGdyYXBoTm9kZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHJldHVybiBncmFwaDtcbn1cblxuZnVuY3Rpb24gR3JhcGgoKSB7XG4gICAgdGhpcy5ub2RlcyA9IFtdO1xuICAgIHRoaXMubGlua3MgPSBbXTtcbiAgICByZXR1cm4gdGhpcztcbn1cblxuZnVuY3Rpb24gR3JhcGhOb2RlKG5vZGUpIHtcbiAgICB0aGlzLm5vZGUgPSBub2RlO1xuICAgIHJldHVybiB0aGlzO1xufVxuXG5mdW5jdGlvbiBHcmFwaExpbmsoc291cmNlLCB0YXJnZXQsIGxhYmVsKSB7XG4gICAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG4gICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XG4gICAgdGhpcy5sYWJlbCA9IGxhYmVsO1xuICAgIHJldHVybiB0aGlzO1xufSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5mb0NvbnRhaW5lcklkLCB0aXRsZSkge1xuICAgIC8vIFNldCBoZWFkaW5nXG4gICAgJChcIiNcIiArIGluZm9Db250YWluZXJJZCArIFwiIGgxXCIpLnRleHQodGl0bGUpO1xuXG4gICAgdGhpcy5zaG93Tm9kZSA9IGZ1bmN0aW9uKG5vZGUsIGZpbGxDb2xvcikge1xuICAgICAgICAkKFwiI2Qzc2hlZXQtbm9kZS1pbmZvIGgyXCIpLnRleHQobm9kZS5sYWJlbCgpKTtcbiAgICAgICAgJChcIiNkM3NoZWV0LW5vZGUtaW5mbyBoZWFkZXJcIikuY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiLCBmaWxsQ29sb3IpO1xuICAgICAgICAkKFwiI2Qzc2hlZXQtbm9kZS1zaGVldC1uYW1lXCIpLnRleHQobm9kZS5ub2RlR3JvdXAubmFtZSk7XG5cbiAgICAgICAgdmFyIHVsID0gJChcIiNkM3NoZWV0LW5vZGUtcHJvcGVydGllc1wiKTtcbiAgICAgICAgdWwuZW1wdHkoKTtcblxuICAgICAgICAvLyBTaG93IG5vZGUgcHJvcGVydGllc1xuICAgICAgICAkLmVhY2gobm9kZS5wcm9wZXJ0aWVzLCBmdW5jdGlvbihpLCBub2RlUHJvcGVydHkpIHtcbiAgICAgICAgICAgIGlmIChub2RlUHJvcGVydHkubmFtZSAhPSBub2RlLmxhYmVsUHJvcGVydHlOYW1lKVxuICAgICAgICAgICAgICAgIGFkZFByb3BlcnR5KG5vZGVQcm9wZXJ0eS5uYW1lLCBub2RlUHJvcGVydHkudmFsdWUpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBHcm91cCBub2RlIGxpbmtzXG4gICAgICAgIHZhciBncm91cGVkTGlua3MgPSB7fTtcbiAgICAgICAgJC5lYWNoKG5vZGUucmVmcywgZnVuY3Rpb24oaSwgcmVmKSB7XG4gICAgICAgICAgICB2YXIgbGlua05hbWUgPSByZWYubGFiZWw7XG4gICAgICAgICAgICBpZiAobGlua05hbWUgPT0gbnVsbClcbiAgICAgICAgICAgICAgICBsaW5rTmFtZSA9IHJlZi50YXJnZXROb2RlLm5vZGVHcm91cC5uYW1lO1xuXG4gICAgICAgICAgICBpZiAoZ3JvdXBlZExpbmtzW2xpbmtOYW1lXSA9PSBudWxsKVxuICAgICAgICAgICAgICAgIGdyb3VwZWRMaW5rc1tsaW5rTmFtZV0gPSBbXTtcblxuICAgICAgICAgICAgZ3JvdXBlZExpbmtzW2xpbmtOYW1lXS5wdXNoKHJlZi50YXJnZXROb2RlLmxhYmVsKCkpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBTaG93IG5vZGUgbGlua3NcbiAgICAgICAgdmFyIGxpbmtOYW1lcyA9IE9iamVjdC5rZXlzKGdyb3VwZWRMaW5rcyk7XG4gICAgICAgICQuZWFjaChsaW5rTmFtZXMsIGZ1bmN0aW9uKGksIGxpbmtOYW1lKSB7XG4gICAgICAgICAgICBhZGRQcm9wZXJ0eShsaW5rTmFtZSwgZ3JvdXBlZExpbmtzW2xpbmtOYW1lXS5qb2luKFwiLCBcIikpO1xuICAgICAgICB9KTtcblxuICAgICAgICBmdW5jdGlvbiBhZGRQcm9wZXJ0eShuYW1lLCB2YWx1ZSkge1xuICAgICAgICAgICAgdWwuYXBwZW5kKFwiPGxpPjxzcGFuIGNsYXNzPVxcXCJkM3NoZWV0LW5vZGUtcHJvcGVydHktbmFtZVxcXCI+XCIgKyBuYW1lICtcbiAgICAgICAgICAgICAgICBcIjo8L3NwYW4+IDxzcGFuIGNsYXNzPVxcXCJkM3NoZWV0LW5vZGUtcHJvcGVydHktdmFsdWVcXFwiPlwiICsgZm9ybWF0VmFsdWUodmFsdWUpICsgXCI8L3NwYW4+PC9saT5cIik7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBmb3JtYXRWYWx1ZSh2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlLnNsaWNlKDAsIFwiNFwiKS50b0xvd2VyQ2FzZSgpID09IFwiaHR0cFwiKVxuICAgICAgICAgICAgICAgIHJldHVybiBcIjxhIGhyZWY9XFxcIlwiICsgdmFsdWUgKyBcIlxcXCI+XCIgKyB2YWx1ZSArIFwiPC9hPlwiXG5cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xufSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc3ByZWFkc2hlZXQpIHtcbiAgICB2YXIgbW9kZWwgPSBuZXcgTW9kZWwoKTtcblxuICAgIHZhciBub2RlR3JvdXBUeXBlcyA9IGdldE5vZGVHcm91cFR5cGVzKHNwcmVhZHNoZWV0KTtcbiAgICBtb2RlbC5ub2RlR3JvdXBzID0gZ2V0Tm9kZUdyb3VwcyhzcHJlYWRzaGVldCwgbm9kZUdyb3VwVHlwZXMubm9kZUdyb3VwTmFtZXMpO1xuICAgIGlmIChub2RlR3JvdXBUeXBlcy5zZXR0aW5nc0dyb3VwTmFtZSAhPSBudWxsKVxuICAgICAgICBtb2RlbC5zZXR0aW5ncyA9IHNwcmVhZHNoZWV0LnNoZWV0c1tub2RlR3JvdXBUeXBlcy5zZXR0aW5nc0dyb3VwTmFtZV07XG5cbiAgICBmdW5jdGlvbiBnZXROb2RlR3JvdXBzKHNwcmVhZHNoZWV0LCBub2RlR3JvdXBOYW1lcykge1xuICAgICAgICAvLyBDcmVhdGUgbm9kZXMgd2l0aCBwcm9wZXJ0aWVzXG4gICAgICAgIHZhciBub2RlR3JvdXBzID0gbmV3IE5vZGVHcm91cHMoKTtcbiAgICAgICAgJC5lYWNoKG5vZGVHcm91cE5hbWVzLCBmdW5jdGlvbihpLCBub2RlR3JvdXBOYW1lKSB7XG4gICAgICAgICAgICBub2RlR3JvdXBzW25vZGVHcm91cE5hbWVdID0gZ2V0Tm9kZXMoc3ByZWFkc2hlZXQuc2hlZXRzW25vZGVHcm91cE5hbWVdLCBub2RlR3JvdXBOYW1lKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIHJlZmVyZW5jZXMgZnJvbSBub2RlIHNoZWV0c1xuICAgICAgICAkLmVhY2gobm9kZUdyb3VwTmFtZXMsIGZ1bmN0aW9uKGksIG5vZGVHcm91cE5hbWUpIHtcbiAgICAgICAgICAgIGNyZWF0ZVJlZnMobm9kZUdyb3Vwcywgc3ByZWFkc2hlZXQuc2hlZXRzW25vZGVHcm91cE5hbWVdLCBub2RlR3JvdXBOYW1lKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gVE9ETzogQ3JlYXRlIHJlZmVyZW5jZXMgZnJvbSByZWZlcmVuY2Ugc2hlZXRzXG5cbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlUmVmcyhub2RlR3JvdXBzLCBub2RlU2hlZXQsIG5vZGVHcm91cE5hbWUpIHtcbiAgICAgICAgICAgIHZhciBub2RlR3JvdXAgPSBub2RlR3JvdXBzW25vZGVHcm91cE5hbWVdO1xuICAgICAgICAgICAgdmFyIGNvbE5hbWVzID0gbm9kZVNoZWV0LmhlYWRlcigpO1xuXG4gICAgICAgICAgICAvLyBGb3IgYWxsIHNoZWV0IHJvd3NcbiAgICAgICAgICAgICQuZWFjaChub2RlU2hlZXQucm93cywgZnVuY3Rpb24oaSwgcm93KSB7XG4gICAgICAgICAgICAgICAgaWYgKGkgPT0gMClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgLy8gRm9yIGFsbCBzaGVldCBjb2x1bW5zXG4gICAgICAgICAgICAgICAgJC5lYWNoKGNvbE5hbWVzLCBmdW5jdGlvbihqLCBjb2xOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IG5vZGVTaGVldC52YWx1ZShyb3csIGNvbE5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gbnVsbClcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGlzIGlzIGEgcmVmZXJlbmNlIGNvbHVtblxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVmVGFyZ2V0ID0gcGFyc2VDb2x1bW5SZWZOYW1lKGNvbE5hbWUsIG5vZGVHcm91cHMpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVmVGFyZ2V0ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZpbmQgaW5kZXggb2YgdGhlIHRhcmdldCBub2RlXG4gICAgICAgICAgICAgICAgICAgICAgICAkLmVhY2gobm9kZUdyb3Vwc1tyZWZUYXJnZXQuc2hlZXROYW1lXS5ub2RlcywgZnVuY3Rpb24oaywgdGFyZ2V0Tm9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHRhcmdldCBub2RlIHByb3BlcnR5IHZhbHVlIG1hdGNoZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBXZSBzaG91bGQgcHJvcGVybHkgc3BsaXQgdmFsdWVzIHVzaW5nIGNvbW1hXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlLmluZGV4T2YodGFyZ2V0Tm9kZS52YWx1ZShyZWZUYXJnZXQucHJvcGVydHlOYW1lKSkgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlR3JvdXAubm9kZXNbaSAtIDFdLnJlZnMucHVzaChuZXcgUmVmKHRhcmdldE5vZGUsIHJlZlRhcmdldC5sYWJlbCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGdldE5vZGVzKG5vZGVTaGVldCwgbm9kZUdyb3VwTmFtZSkge1xuICAgICAgICAgICAgdmFyIGhlYWRlciA9IG5vZGVTaGVldC5oZWFkZXIoKTtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBuZXcgTm9kZUdyb3VwKG5vZGVHcm91cE5hbWUsIGhlYWRlclswXSk7XG5cbiAgICAgICAgICAgIC8vIEdldCBub2RlcyBhbmQgcHJvcGVydGllc1xuICAgICAgICAgICAgJC5lYWNoKG5vZGVTaGVldC5yb3dzLCBmdW5jdGlvbihpLCByb3cpIHtcbiAgICAgICAgICAgICAgICBpZiAoaSA9PSAwKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgcmVzdWx0Lm5vZGVzLnB1c2gobmV3IE5vZGUoZ2V0Tm9kZVByb3BlcnRpZXMocm93LCBoZWFkZXIpLCByZXN1bHQpKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZ2V0Tm9kZVByb3BlcnRpZXMocm93LCBoZWFkZXIpIHtcbiAgICAgICAgICAgIHZhciBub2RlUHJvcGVydGllcyA9IFtdO1xuICAgICAgICAgICAgJC5lYWNoKHJvdy5yb3dDZWxscywgZnVuY3Rpb24oaSwgcm93Q2VsbCkge1xuICAgICAgICAgICAgICAgIHZhciBjb2xOYW1lID0gaGVhZGVyW3Jvd0NlbGwuY29sSW5kZXhdO1xuICAgICAgICAgICAgICAgIGlmIChjb2xOYW1lLmluZGV4T2YoXCIuXCIpID09IC0xKVxuICAgICAgICAgICAgICAgICAgICBub2RlUHJvcGVydGllcy5wdXNoKG5ldyBOb2RlUHJvcGVydHkoY29sTmFtZSwgcm93Q2VsbC52YWx1ZSkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gbm9kZVByb3BlcnRpZXM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbm9kZUdyb3VwcztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXROb2RlR3JvdXBUeXBlcyhzcHJlYWRzaGVldCkge1xuICAgICAgICB2YXIgbm9kZUdyb3VwVHlwZXMgPSB7XG4gICAgICAgICAgICBub2RlR3JvdXBOYW1lczogW10sXG4gICAgICAgICAgICByZWZTaGVldE5hbWVzOiBbXSxcbiAgICAgICAgICAgIHNldHRpbmdzR3JvdXBOYW1lOiBudWxsXG4gICAgICAgIH07XG4gICAgICAgIHZhciBzaGVldE5hbWVzID0gT2JqZWN0LmtleXMoc3ByZWFkc2hlZXQuc2hlZXRzKTtcbiAgICAgICAgJC5lYWNoKHNoZWV0TmFtZXMsIGZ1bmN0aW9uKGksIHNoZWV0TmFtZSkge1xuICAgICAgICAgICAgaWYgKHNoZWV0TmFtZSA9PSBcInNldHRpbmdzXCIpIHtcbiAgICAgICAgICAgICAgICBub2RlR3JvdXBUeXBlcy5zZXR0aW5nc0dyb3VwTmFtZSA9IHNoZWV0TmFtZTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzaGVldE5hbWUuc2xpY2UoMCwgMSkgPT0gXCIjXCIpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgICAgICB2YXIgcmVmU2hlZXQgPSBwYXJzZVJlZlNoZWV0TmFtZShzaGVldE5hbWUpXG4gICAgICAgICAgICBpZiAoKHJlZlNoZWV0ICE9IG51bGwpICYmXG4gICAgICAgICAgICAgICAgKHNoZWV0TmFtZXMuaW5kZXhPZihyZWZTaGVldC5zb3VyY2UpID4gLTEpICYmXG4gICAgICAgICAgICAgICAgKHNoZWV0TmFtZXMuaW5kZXhPZihyZWZTaGVldC50YXJnZXQpID4gLTEpKSB7XG4gICAgICAgICAgICAgICAgbm9kZUdyb3VwVHlwZXMucmVmU2hlZXROYW1lcy5wdXNoKHNoZWV0TmFtZSlcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG5vZGVHcm91cFR5cGVzLm5vZGVHcm91cE5hbWVzLnB1c2goc2hlZXROYW1lKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIG5vZGVHcm91cFR5cGVzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlQ29sdW1uUmVmTmFtZShjb2xOYW1lLCBzaGVldHMpIHtcbiAgICAgICAgdmFyIHJlZk5hbWVzID0gY29sTmFtZS5zcGxpdChcIi5cIik7XG4gICAgICAgIGlmICgocmVmTmFtZXMubGVuZ3RoID49IDIpICYmXG4gICAgICAgICAgICAoc2hlZXRzW3JlZk5hbWVzWzBdXSAhPSBudWxsKSkge1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHtcbiAgICAgICAgICAgICAgICBzaGVldE5hbWU6IHJlZk5hbWVzWzBdLFxuICAgICAgICAgICAgICAgIHByb3BlcnR5TmFtZTogcmVmTmFtZXNbMV1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHJlZk5hbWVzLmxlbmd0aCA9PSAzKVxuICAgICAgICAgICAgICAgIHJlc3VsdC5sYWJlbCA9IHJlZk5hbWVzWzJdO1xuXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VSZWZTaGVldE5hbWUoc2hlZXROYW1lKSB7XG4gICAgICAgIHZhciBub2RlTmFtZXMgPSBzaGVldE5hbWUuc3BsaXQoXCItXCIpO1xuICAgICAgICBpZiAobm9kZU5hbWVzLmxlbmd0aCA9PSAyKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHNvdXJjZTogbm9kZU5hbWVzWzBdLFxuICAgICAgICAgICAgICAgIHRhcmdldDogbm9kZU5hbWVzWzFdXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIG1vZGVsO1xufVxuXG5mdW5jdGlvbiBNb2RlbCgpIHtcbiAgICB0aGlzLm5vZGVHcm91cHMgPSB7fTtcbiAgICB0aGlzLnNldHRpbmdzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG59XG5cbmZ1bmN0aW9uIE5vZGVHcm91cHMoKSB7XG4gICAgcmV0dXJuIHRoaXM7XG59XG5cbmZ1bmN0aW9uIE5vZGVHcm91cChuYW1lLCBsYWJlbFByb3BlcnR5TmFtZSkge1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy5sYWJlbFByb3BlcnR5TmFtZSA9IGxhYmVsUHJvcGVydHlOYW1lO1xuICAgIHRoaXMubm9kZXMgPSBbXTtcbiAgICByZXR1cm4gdGhpcztcbn1cblxuZnVuY3Rpb24gTm9kZShwcm9wZXJ0aWVzLCBub2RlR3JvdXApIHtcbiAgICB0aGlzLnByb3BlcnRpZXMgPSBwcm9wZXJ0aWVzO1xuICAgIHRoaXMucmVmcyA9IFtdO1xuICAgIHRoaXMubm9kZUdyb3VwID0gbm9kZUdyb3VwO1xuICAgIHJldHVybiB0aGlzO1xufVxuXG5mdW5jdGlvbiBSZWYodGFyZ2V0Tm9kZSwgbGFiZWwpIHtcbiAgICB0aGlzLnRhcmdldE5vZGUgPSB0YXJnZXROb2RlO1xuICAgIHRoaXMubGFiZWwgPSBsYWJlbDtcbiAgICByZXR1cm4gdGhpcztcbn1cblxuTm9kZS5wcm90b3R5cGUudmFsdWUgPSBmdW5jdGlvbihwcm9wZXJ0eU5hbWUpIHtcbiAgICB2YXIgcmVzdWx0ID0gbnVsbDtcbiAgICAkLmVhY2godGhpcy5wcm9wZXJ0aWVzLCBmdW5jdGlvbihpLCBwcm9wZXJ0eSkge1xuICAgICAgICBpZiAocHJvcGVydHkubmFtZSA9PSBwcm9wZXJ0eU5hbWUpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IHByb3BlcnR5LnZhbHVlO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuTm9kZS5wcm90b3R5cGUubGFiZWwgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy52YWx1ZSh0aGlzLm5vZGVHcm91cC5sYWJlbFByb3BlcnR5TmFtZSk7XG59XG5cbmZ1bmN0aW9uIE5vZGVQcm9wZXJ0eShuYW1lLCB2YWx1ZSkge1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgIHJldHVybiB0aGlzO1xufSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc3ByZWFkc2hlZXRLZXksIG9uTG9hZGVkKSB7XG4gICAgLy8gR2V0IHNoZWV0IGNvdW50XG4gICAgZ2V0U3ByZWFkc2hlZXRJbmZvKHNwcmVhZHNoZWV0S2V5LCBmdW5jdGlvbiBvblN1Y2Nlc3MoaW5mbykge1xuICAgICAgICAvLyBMb2FkIGFsbCBzaGVldHNcbiAgICAgICAgbG9hZFNoZWV0cyhzcHJlYWRzaGVldEtleSwgaW5mbyk7XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBsb2FkU2hlZXRzKHNwcmVhZHNoZWV0S2V5LCBpbmZvKSB7XG4gICAgICAgIHZhciBzcHJlYWRzaGVldCA9IG5ldyBTcHJlYWRzaGVldChzcHJlYWRzaGVldEtleSwgaW5mby50aXRsZSk7XG4gICAgICAgIHZhciBsb2FkZWRTaGVldENvdW50ID0gMDtcbiAgICAgICAgZm9yIChpID0gMTsgaSA8PSBpbmZvLnNoZWV0Q291bnQ7IGkrKykge1xuICAgICAgICAgICAgbG9hZFNoZWV0KHNwcmVhZHNoZWV0LCBzcHJlYWRzaGVldEtleSwgaSkudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBsb2FkZWRTaGVldENvdW50ICs9IDE7XG4gICAgICAgICAgICAgICAgaWYgKGxvYWRlZFNoZWV0Q291bnQgPT0gaW5mby5zaGVldENvdW50KSB7XG4gICAgICAgICAgICAgICAgICAgIG9uTG9hZGVkKHNwcmVhZHNoZWV0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbG9hZFNoZWV0KHNwcmVhZHNoZWV0LCBzcHJlYWRzaGVldEtleSwgc2hlZXRJbmRleCkge1xuICAgICAgICByZXR1cm4gZ2V0U2hlZXQoc3ByZWFkc2hlZXRLZXksIHNoZWV0SW5kZXgsIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICB2YXIgc2hlZXQgPSBzcHJlYWRzaGVldC5zaGVldHNbcmVzcG9uc2UuZmVlZC50aXRsZS4kdF0gPSBuZXcgU2hlZXQoKTtcblxuICAgICAgICAgICAgJC5lYWNoKHJlc3BvbnNlLmZlZWQuZW50cnksIGZ1bmN0aW9uKGksIGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSBlLmdzJGNlbGwucm93IC0gMTtcbiAgICAgICAgICAgICAgICBpZiAoc2hlZXQucm93c1tpbmRleF0gPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBzaGVldC5yb3dzW2luZGV4XSA9IG5ldyBSb3coaW5kZXgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzaGVldC5yb3dzW2luZGV4XS5yb3dDZWxscy5wdXNoKG5ldyBSb3dDZWxsKGUuZ3MkY2VsbC5jb2wgLSAxLCBlLmNvbnRlbnQuJHQpKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBTb3J0IHJvdyBjZWxscyBieSBjb2wgaW5kZXhcbiAgICAgICAgICAgICQuZWFjaChzaGVldC5yb3dzLCBmdW5jdGlvbihpLCByb3cpIHtcbiAgICAgICAgICAgICAgICByb3cucm93Q2VsbHMuc29ydChmdW5jdGlvbihjMSwgYzIpIHsgcmV0dXJuIGMxLmNvbEluZGV4IC0gYzIuY29sSW5kZXg7IH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuLy8gICAgZnVuY3Rpb24gbG9hZFNldHRpbmdzU2hlZXQoc2V0dGluZ3NTaGVldCwgc3ByZWFkc2hlZXQpIHtcbi8vICAgICAgICAvLyBNYXAgY2VsbHMgdG8gbGlzdFxuLy8gICAgICAgIHZhciBzZXR0aW5nc0xpc3QgPSB7fTtcbi8vICAgICAgICAkLmVhY2goc2V0dGluZ3NTaGVldC5mZWVkLmVudHJ5LCBmdW5jdGlvbihpLCBlKSB7XG4vLyAgICAgICAgICAgIGlmIChzZXR0aW5nc0xpc3RbZS5ncyRjZWxsLnJvd10gPT0gbnVsbClcbi8vICAgICAgICAgICAgICAgIHNldHRpbmdzTGlzdFtlLmdzJGNlbGwucm93XSA9IHt9O1xuLy9cbi8vICAgICAgICAgICAgaWYgKGUuZ3MkY2VsbC5jb2wgPT0gMSlcbi8vICAgICAgICAgICAgICAgIHNldHRpbmdzTGlzdFtlLmdzJGNlbGwucm93XS5rZXkgPSBlLmNvbnRlbnQuJHQ7XG4vLyAgICAgICAgICAgIGVsc2Vcbi8vICAgICAgICAgICAgICAgIGlmIChlLmdzJGNlbGwuY29sID09IDIpXG4vLyAgICAgICAgICAgICAgICAgICAgc2V0dGluZ3NMaXN0W2UuZ3MkY2VsbC5yb3ddLnZhbHVlID0gZS5jb250ZW50LiR0O1xuLy8gICAgICAgIH0pO1xuLy9cbi8vICAgICAgICAvLyBNYXAgbGlzdCB0byBvYmplY3Rcbi8vICAgICAgICAkLmVhY2goc2V0dGluZ3NMaXN0LCBmdW5jdGlvbihpLCBzKSB7XG4vLyAgICAgICAgICAgIGlmICgocy5rZXkgPT0gbnVsbCkgfHwgKHMudmFsdWUgPT0gbnVsbCkpXG4vLyAgICAgICAgICAgICAgICByZXR1cm47XG4vL1xuLy8gICAgICAgICAgICAvLyBDcmVhdGUgaW5uZXIgb2JqZWN0c1xuLy8gICAgICAgICAgICB2YXIgcGF0aCA9IHMua2V5LnNwbGl0KFwiLlwiKTtcbi8vICAgICAgICAgICAgdmFyIGN1cnJlbnQgPSBzcHJlYWRzaGVldC5zZXR0aW5ncztcbi8vICAgICAgICAgICAgJC5lYWNoKHBhdGgsIGZ1bmN0aW9uKGosIGspIHtcbi8vICAgICAgICAgICAgICAgIGlmIChjdXJyZW50W2tdID09IG51bGwpIHtcbi8vICAgICAgICAgICAgICAgICAgICBpZiAoaiA9PSBwYXRoLmxlbmd0aCAtIDEpXG4vLyAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRba10gPSBzLnZhbHVlO1xuLy8gICAgICAgICAgICAgICAgICAgIGVsc2Vcbi8vICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudFtrXSA9IHt9O1xuLy8gICAgICAgICAgICAgICAgfVxuLy8gICAgICAgICAgICAgICAgY3VycmVudCA9IGN1cnJlbnRba107XG4vLyAgICAgICAgICAgIH0pO1xuLy8gICAgICAgIH0pO1xuLy8gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0U2hlZXQoc3ByZWFkc2hlZXRLZXksIHNoZWV0SW5kZXgsIG9uU3VjY2Vzcykge1xuICAgICAgICByZXR1cm4gJC5hamF4KHtcbiAgICAgICAgICAgIHVybDogXCJodHRwczovL3NwcmVhZHNoZWV0cy5nb29nbGUuY29tL2ZlZWRzL2NlbGxzL1wiICsgc3ByZWFkc2hlZXRLZXkgKyBcIi9cIiArIHNoZWV0SW5kZXggKyBcIi9wdWJsaWMvdmFsdWVzP2FsdD1qc29uLWluLXNjcmlwdFwiLFxuICAgICAgICAgICAganNvbnA6IFwiY2FsbGJhY2tcIixcbiAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25wXCIsXG4gICAgICAgICAgICBzdWNjZXNzOiBvblN1Y2Nlc3NcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0U3ByZWFkc2hlZXRJbmZvKHNwcmVhZHNoZWV0S2V5LCBvblN1Y2Nlc3MpIHtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybDogXCJodHRwczovL3NwcmVhZHNoZWV0cy5nb29nbGUuY29tL2ZlZWRzL3dvcmtzaGVldHMvXCIgKyBzcHJlYWRzaGVldEtleSArIFwiL3B1YmxpYy9mdWxsP2FsdD1qc29uLWluLXNjcmlwdFwiLFxuICAgICAgICAgICAganNvbnA6IFwiY2FsbGJhY2tcIixcbiAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25wXCIsXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIHZhciBpbmZvID0ge1xuICAgICAgICAgICAgICAgICAgICBzaGVldENvdW50OiByZXNwb25zZS5mZWVkLmVudHJ5Lmxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IHJlc3BvbnNlLmZlZWQudGl0bGUuJHRcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIG9uU3VjY2VzcyhpbmZvKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBTcHJlYWRzaGVldChzcHJlYWRzaGVldEtleSwgdGl0bGUpIHtcbiAgICB0aGlzLmtleSA9IHNwcmVhZHNoZWV0S2V5O1xuICAgIHRoaXMudGl0bGUgPSB0aXRsZTtcbiAgICB0aGlzLnNoZWV0cyA9IG5ldyBTaGVldHMoKTtcblxuICAgIHJldHVybiB0aGlzO1xufVxuXG5mdW5jdGlvbiBTaGVldHMoKSB7XG4gICAgcmV0dXJuIHRoaXM7XG59XG5cbmZ1bmN0aW9uIFNoZWV0KCkge1xuICAgIHRoaXMucm93cyA9IFtdO1xuICAgIHJldHVybiB0aGlzO1xufVxuXG5TaGVldC5wcm90b3R5cGUuaGVhZGVyID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMucm93c1swXS52YWx1ZXMoKTtcbn1cblxuU2hlZXQucHJvdG90eXBlLnZhbHVlID0gZnVuY3Rpb24ocm93LCBjb2xOYW1lKSB7XG4gICAgdmFyIGNvbEluZGV4ID0gdGhpcy5oZWFkZXIoKS5pbmRleE9mKGNvbE5hbWUpO1xuICAgIGlmIChjb2xJbmRleCA9PSAtMSlcbiAgICAgICAgcmV0dXJuIG51bGw7XG5cbiAgICB2YXIgcmVzdWx0ID0gbnVsbDtcbiAgICAkLmVhY2gocm93LnJvd0NlbGxzLCBmdW5jdGlvbihpLCByb3dDZWxsKSB7XG4gICAgICAgIGlmIChyb3dDZWxsLmNvbEluZGV4ID09IGNvbEluZGV4KSB7XG4gICAgICAgICAgICByZXN1bHQgPSByb3dDZWxsLnZhbHVlO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBSb3cocm93SW5kZXgpIHtcbiAgICB0aGlzLnJvd0luZGV4ID0gcm93SW5kZXg7XG4gICAgdGhpcy5yb3dDZWxscyA9IFtdO1xuXG4gICAgcmV0dXJuIHRoaXM7XG59XG5cblJvdy5wcm90b3R5cGUudmFsdWVzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICQubWFwKHRoaXMucm93Q2VsbHMsIGZ1bmN0aW9uKHJvd0NlbGwsIGkpIHtcbiAgICAgICAgcmV0dXJuIHJvd0NlbGwudmFsdWU7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIFJvd0NlbGwoY29sSW5kZXgsIHZhbHVlKSB7XG4gICAgdGhpcy5jb2xJbmRleCA9IGNvbEluZGV4O1xuICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICByZXR1cm4gdGhpcztcbn0iXX0=
