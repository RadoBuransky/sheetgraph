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

        var zoom = d3.behavior.zoom()
            .on("zoom", rescale);

        var svg = d3.select("#" + svgContainerId)
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%");

        var defs = svg.append("defs")

        defs.append("marker")
            .attr("class", "link")
            .attr("id", "markerEnd")
            .attr("viewBox", "0 0 30 20")
            .attr("refX", 58)
            .attr("refY", 10)
            .attr("markerWidth", 20)
            .attr("markerHeight", 30)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M 0 0 L 30 10 L 0 20");

        defs.append("marker")
            .attr("class", "link")
            .attr("id", "markerStart")
            .attr("viewBox", "0 0 30 20")
            .attr("refX", -30)
            .attr("refY", 10)
            .attr("markerWidth", 20)
            .attr("markerHeight", 30)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M 30 0 L 0 10 L 30 20");

        svg = svg.append("g")
            .call(zoom);

        var rect = svg.append("rect")
                    .attr("width", width)
                    .attr("height", height)
                    .style("fill", "none")
                    .style("pointer-events", "all");

        d3sheet.svg = svg.append("g");

        d3.select("#" + infoContainerId)
            .append("div");

        return d3sheet;
    }

    function rescale() {
      var trans = d3.event.translate;
      var scale = d3.event.scale;

      d3sheet.svg.attr("transform",
          "translate(" + trans + ")"
          + " scale(" + scale + ")");
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
            var force = forceModule(d3sheet.graph, d3sheet.svgContainerId, d3sheet.svg, info, d3sheet.model.settings);

            // Initialize view options
//            var viewModule = require("./view");
//            viewModule(d3sheet.model, updateGraph);
//
//            function updateGraph(viewOptions) {
//                // TODO: update d3sheet.graph and force.restart()
//            }

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
module.exports = function(graph, svgContainerId, svg, info, settings) {
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

    var drag = force.drag()
        .origin(function(d) { return d; })
        .on("dragstart", dragstarted)
        .on("drag", dragged)
        .on("dragend", dragended);

    this.restart = restart
    restart();

    function dragstarted(d) {
       d3.event.sourceEvent.stopPropagation();
       d3.select(this).classed("dragging", true);
    }

    function dragged(d) {
       d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
    }

    function dragended(d) {
       d3.select(this).classed("dragging", false);
    }

    function restart() {

        svg.selectAll(".link")
            .data(graph.links)
            .enter()
            .append("path")
            .attr("class", "link")
            .attr("marker-end", linkMarkerEnd)
            .attr("marker-start", linkMarkerStart);

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
            .attr("class", nodeClass)
            .attr("r", 20) // TODO: Settings
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; })
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

    function linkMarkerEnd(graphLink) {
        if (graphLink.toTarget)
            return "url(#markerEnd)";

        return "none";
    }

    function linkMarkerStart(graphLink) {
        if (graphLink.toSource)
            return "url(#markerStart)";

        return "none";
    }

    function nodeClass(graphNode) {
        return "node " + graphNode.node.nodeGroup.name;
    }

    function nodeClick(graphNode) {
        info.showNode(graphNode.node, nodeFillColor(graphNode));
    }

    function nodeFillColor(graphNode) {
        return settings.css.get(graphNode.node.nodeGroup.name + ".fill", colors(graphNode.node.nodeGroup.name));
    }

    function selectAll() {
        node = svg.selectAll(".node");
        nodeLabel = svg.selectAll(".node-label");
        link = svg.selectAll(".link");
        linkLabel = svg.selectAll(".link-label");
    }

    function onTick() {
//        link.attr("x1", function(d) { return d.source.x; })
//            .attr("y1", function(d) { return d.source.y; })
//            .attr("x2", function(d) { return d.target.x; })
//            .attr("y2", function(d) { return d.target.y; });
        link.attr("d", linkArc);

        linkLabel
            .attr("x", function(d) {
                return (d.source.x + d.target.x)/2; })
            .attr("y", function(d) {
                return (d.source.y + d.target.y)/2; });

        node
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });

        nodeLabel
            .attr("x", function(d) { return d.x; })
            .attr("y", function(d) { return d.y; });
    }

    function linkArc(d) {
        var dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y;
        return "M" + d.source.x + " " + d.source.y + "L " + d.target.x + "," + d.target.y;
    }

    return this;
}
},{}],3:[function(require,module,exports){
module.exports = function(model) {
    var graph = new Graph();

    // For all sheets
    $.each(model.nodeGroups.items, function(i, nodeGroup) {
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
            graph.links.push(new GraphLink(graphNode, getGraphNode(ref.targetNode), ref.label, ref.toTarget, ref.toSource));
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

function GraphLink(source, target, label, toTarget, toSource) {
    this.source = source;
    this.target = target;
    this.label = label;
    this.toSource = toSource;
    this.toTarget = toTarget;
    return this;
}
},{}],4:[function(require,module,exports){
module.exports = function(infoContainerId, title) {
    // Set heading
    $("#" + infoContainerId + " h1").text(title);

    this.showNode = function(node, fillColor) {
        $("#d3sheet-node-info h2").text(node.heading());
        $("#d3sheet-node-info header").css("background-color", fillColor);
        $("#d3sheet-node-sheet-name").text(node.nodeGroup.name);

        var ul = $("#d3sheet-node-properties");
        ul.empty();

        // Show node properties
        $.each(node.properties, function(i, nodeProperty) {
            if (!nodeProperty.isHidden)
                addProperty(nodeProperty.name, nodeProperty.value);
        });

        // Group node links
        var groupedLinks = {};
        $.each(node.refs, function(i, ref) {
            var linkName = ref.targetNode.nodeGroup.name;

            if (groupedLinks[linkName] == null)
                groupedLinks[linkName] = [];

            groupedLinks[linkName].push(ref.targetNode.heading());
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
    model.nodeGroups = getNodeGroups(spreadsheet, nodeGroupTypes.nodeGroupNames, nodeGroupTypes.refSheetNames);
    if (nodeGroupTypes.settingsGroupName != null)
        model.settings = getSettings(spreadsheet.sheets[nodeGroupTypes.settingsGroupName]);

    function getSettings(settingsSheet) {
        var settings = new Settings();

        $.each(settingsSheet.rows, function(i, row) {
            var key = row.rowCells[0].value,
                value = row.rowCells[1].value;

            if ((key == null) || (value == null))
                return;

            var path = key.split(".");
            var current = settings;
            $.each(path, function(j, k) {
                if (current[k] == null) {
                    if (j == path.length - 1)
                        current[k] = value;
                    else
                        current[k] = new Settings();
                }
                current = current[k];
            });
        });

        return settings;
    }

    function getNodeGroups(spreadsheet, nodeGroupNames, refSheetNames) {
        // Create nodes with properties
        var nodeGroups = new NodeGroups();
        $.each(nodeGroupNames, function(i, nodeGroupName) {
            nodeGroups.items.push(getNodes(spreadsheet.sheets[nodeGroupName], nodeGroupName));
        });

        // Create references from node sheets
        $.each(nodeGroups.items, function(i, nodeGroup) {
            createRefs(nodeGroups, spreadsheet.sheets[nodeGroup.name], nodeGroup);
        });

        // Create references from reference sheets
        $.each(refSheetNames, function(i, refSheetName) {
            createSheetRefs(nodeGroups, spreadsheet.sheets[refSheetName.name], refSheetName);
        });

        function createSheetRefs(nodeGroups, refSheet, refSheetName) {
            var colNames = refSheet.header();

            // For all sheet rows
            $.each(refSheet.rows, function(i, row) {
                if (i == 0)
                    return;

                var source = getRefToNodeGroup(nodeGroups, refSheet, row, refSheetName.source);
                var target = getRefToNodeGroup(nodeGroups, refSheet, row, refSheetName.target);
                if ((source != null) &&
                    (target != null)) {
                    var label = target.label;
                    if (((target.label == null) ||
                        (target.label == "")) &&
                        (row.rowCells[0].colIndex == 0)) {
                            label = row.rowCells[0].value;
                        }

                    $.each(source.nodes, function(j, sourceRef) {
                        $.each(target.nodes, function(k, targetRef) {
                            sourceRef.targetNode.refs.push(new Ref(targetRef.targetNode, label));
                        });
                    });
                }
            });
        }

        function getRefToNodeGroup(nodeGroups, sheet, row, nodeGroupName) {
            var result = null;
            var colNames = sheet.header();
            $.each(colNames, function(j, colName) {
                var value = sheet.value(row, colName);
                if (value == null)
                    return;

                var refTarget = parseColumnRefName(colName, nodeGroups);
                if ((refTarget != null) &&
                    (refTarget.nodeGroup.name == nodeGroupName)) {
                    result = refTarget;
                    result.nodes = [];

                    // Find index of the target node
                    $.each(refTarget.nodeGroup.nodes, function(k, targetNode) {
                        // If target node property value matches
                        if (value.indexOf(targetNode.value(refTarget.propertyName)) > -1) {
                            result.nodes.push(new Ref(targetNode, refTarget.label, refTarget.toTarget,refTarget.toSource));
                        }
                    });

                    return false;
                }
            });
            return result;
        }

        function createRefs(nodeGroups, nodeSheet, nodeGroup) {
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
                        $.each(refTarget.nodeGroup.nodes, function(k, targetNode) {
                            // If target node property value matches
                            // TODO: We should properly split values using comma
                            if (value.indexOf(targetNode.value(refTarget.propertyName)) > -1) {
                                nodeGroup.nodes[i - 1].refs.push(new Ref(targetNode, refTarget.label, refTarget.toTarget, refTarget.toSource));
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
                nodeGroupTypes.refSheetNames.push(refSheet);
                return;
            }

            nodeGroupTypes.nodeGroupNames.push(sheetName);
        });

        return nodeGroupTypes;
    }

    function parseColumnRefName(colName, nodeGroups) {
        var toTarget = (colName.slice(0, 2) == "->");
        var toSource = (colName.slice(0, 2) == "<-");
        var refNames = colName.replace("->", "").replace("<-", "").split(".");
        var nodeGroup = null;
        if (refNames.length > 0)
            nodeGroup = nodeGroups.getByName(refNames[0]);
        if ((refNames.length >= 2) &&
            (nodeGroup != null)) {
            var result = {
                nodeGroup: nodeGroup,
                propertyName: refNames[1],
                toTarget: toTarget,
                toSource: toSource
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
                name: sheetName,
                source: nodeNames[0],
                target: nodeNames[1]
            };
        }

        return null;
    }

    return model;
}

function Model() {
    this.nodeGroups = new NodeGroups();
    this.settings = {};
    return this;
}

function NodeGroups() {
    this.items = [];
    return this;
}

NodeGroups.prototype.getByName = function(nodeGroupName) {
    var result = null;
    $.each(this.items, function(i, nodeGroup) {
        if (nodeGroup.name == nodeGroupName) {
            result = nodeGroup;
            return false;
        }
    });
    return result;
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

Node.prototype.heading = function() {
    var result = "";
    $.each(this.properties, function(i, property) {
        if (property.isHeading) {
            result = property.value;
            return false;
        }
    });

    if (result != "")
        return result;

    return this.label();
}

function NodeProperty(name, value) {
    this.name = name.replace("*", "").replace("#", "");
    this.value = value;
    this.isHeading = (name.slice(0, 1) == "*");
    this.isHidden = (name.slice(0, 1) == "#");
    return this;
}

function Ref(targetNode, label, toTarget, toSource) {
    this.targetNode = targetNode;
    this.label = label;
    this.toTarget = toTarget;
    this.toSource = toSource;
    return this;
}

function Settings() {
    return this;
}

Settings.prototype.get = function(key, defaultValue) {
    var parts = key.split(".");
    if (parts.length > 1) {
        if (this[parts[0]] == null)
            return defaultValue;

        return this[parts[0]].get(parts.splice(1, parts.length - 1).join("."), defaultValue);
    }

    if (this[key] == null)
        return defaultValue;

    return this[key];
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2Jpbi9ub2RlLXY1LjAuMC1saW51eC14NjQvbGliL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZDNzaGVldC5qcyIsInNyYy9mb3JjZS5qcyIsInNyYy9ncmFwaC5qcyIsInNyYy9pbmZvLmpzIiwic3JjL21vZGVsLmpzIiwic3JjL3NwcmVhZHNoZWV0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIiFmdW5jdGlvbigpIHtcbiAgICBjaGVja1JlcXVpcmVtZW50cygpO1xuXG4gICAgdmFyIGQzc2hlZXQgPSB7XG4gICAgICAgIHZlcjogXCIxLjAuMFwiLFxuICAgICAgICBzdmdDb250YWluZXJJZDogXCJcIixcbiAgICAgICAgaW5mb0NvbnRhaW5lcklkOiBcIlwiLFxuICAgICAgICBzdmc6IHt9LFxuICAgICAgICBzcHJlYWRzaGVldDoge30sXG4gICAgICAgIG1vZGVsOiB7fVxuICAgIH07XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IGQzc2hlZXQ7XG5cbiAgICAvKipcbiAgICAqIEluaXRpYWxpemUgRDMgc2hlZXQuXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gY29udGFpbmVySWQgLSBpZGVudGlmaWVyIG9mIHRoZSBtYWluIERJVi5cbiAgICAqKi9cbiAgICBkM3NoZWV0LmluaXQgPSBmdW5jdGlvbihzdmdDb250YWluZXJJZCwgaW5mb0NvbnRhaW5lcklkKSB7XG4gICAgICAgIGlmIChzdmdDb250YWluZXJJZCA9PSBudWxsKVxuICAgICAgICAgICAgc3ZnQ29udGFpbmVySWQgPSBcImQzc2hlZXQtc3ZnXCI7XG4gICAgICAgIGQzc2hlZXQuc3ZnQ29udGFpbmVySWQgPSBzdmdDb250YWluZXJJZDtcblxuICAgICAgICBpZiAoaW5mb0NvbnRhaW5lcklkID09IG51bGwpXG4gICAgICAgICAgICBpbmZvQ29udGFpbmVySWQgPSBcImQzc2hlZXQtaW5mb1wiO1xuICAgICAgICBkM3NoZWV0LmluZm9Db250YWluZXJJZCA9IGluZm9Db250YWluZXJJZDtcblxuICAgICAgICB2YXIgc3ZnQ29udGFpbmVyID0gJChcIiNcIiArIHN2Z0NvbnRhaW5lcklkKSxcbiAgICAgICAgICAgIHdpZHRoID0gc3ZnQ29udGFpbmVyLndpZHRoKCksXG4gICAgICAgICAgICBoZWlnaHQgPSBzdmdDb250YWluZXIuaGVpZ2h0KCk7XG5cbiAgICAgICAgdmFyIHpvb20gPSBkMy5iZWhhdmlvci56b29tKClcbiAgICAgICAgICAgIC5vbihcInpvb21cIiwgcmVzY2FsZSk7XG5cbiAgICAgICAgdmFyIHN2ZyA9IGQzLnNlbGVjdChcIiNcIiArIHN2Z0NvbnRhaW5lcklkKVxuICAgICAgICAgICAgLmFwcGVuZChcInN2Z1wiKVxuICAgICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCBcIjEwMCVcIilcbiAgICAgICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIFwiMTAwJVwiKTtcblxuICAgICAgICB2YXIgZGVmcyA9IHN2Zy5hcHBlbmQoXCJkZWZzXCIpXG5cbiAgICAgICAgZGVmcy5hcHBlbmQoXCJtYXJrZXJcIilcbiAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJsaW5rXCIpXG4gICAgICAgICAgICAuYXR0cihcImlkXCIsIFwibWFya2VyRW5kXCIpXG4gICAgICAgICAgICAuYXR0cihcInZpZXdCb3hcIiwgXCIwIDAgMzAgMjBcIilcbiAgICAgICAgICAgIC5hdHRyKFwicmVmWFwiLCA1OClcbiAgICAgICAgICAgIC5hdHRyKFwicmVmWVwiLCAxMClcbiAgICAgICAgICAgIC5hdHRyKFwibWFya2VyV2lkdGhcIiwgMjApXG4gICAgICAgICAgICAuYXR0cihcIm1hcmtlckhlaWdodFwiLCAzMClcbiAgICAgICAgICAgIC5hdHRyKFwib3JpZW50XCIsIFwiYXV0b1wiKVxuICAgICAgICAgICAgLmFwcGVuZChcInBhdGhcIilcbiAgICAgICAgICAgIC5hdHRyKFwiZFwiLCBcIk0gMCAwIEwgMzAgMTAgTCAwIDIwXCIpO1xuXG4gICAgICAgIGRlZnMuYXBwZW5kKFwibWFya2VyXCIpXG4gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibGlua1wiKVxuICAgICAgICAgICAgLmF0dHIoXCJpZFwiLCBcIm1hcmtlclN0YXJ0XCIpXG4gICAgICAgICAgICAuYXR0cihcInZpZXdCb3hcIiwgXCIwIDAgMzAgMjBcIilcbiAgICAgICAgICAgIC5hdHRyKFwicmVmWFwiLCAtMzApXG4gICAgICAgICAgICAuYXR0cihcInJlZllcIiwgMTApXG4gICAgICAgICAgICAuYXR0cihcIm1hcmtlcldpZHRoXCIsIDIwKVxuICAgICAgICAgICAgLmF0dHIoXCJtYXJrZXJIZWlnaHRcIiwgMzApXG4gICAgICAgICAgICAuYXR0cihcIm9yaWVudFwiLCBcImF1dG9cIilcbiAgICAgICAgICAgIC5hcHBlbmQoXCJwYXRoXCIpXG4gICAgICAgICAgICAuYXR0cihcImRcIiwgXCJNIDMwIDAgTCAwIDEwIEwgMzAgMjBcIik7XG5cbiAgICAgICAgc3ZnID0gc3ZnLmFwcGVuZChcImdcIilcbiAgICAgICAgICAgIC5jYWxsKHpvb20pO1xuXG4gICAgICAgIHZhciByZWN0ID0gc3ZnLmFwcGVuZChcInJlY3RcIilcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aClcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0KVxuICAgICAgICAgICAgICAgICAgICAuc3R5bGUoXCJmaWxsXCIsIFwibm9uZVwiKVxuICAgICAgICAgICAgICAgICAgICAuc3R5bGUoXCJwb2ludGVyLWV2ZW50c1wiLCBcImFsbFwiKTtcblxuICAgICAgICBkM3NoZWV0LnN2ZyA9IHN2Zy5hcHBlbmQoXCJnXCIpO1xuXG4gICAgICAgIGQzLnNlbGVjdChcIiNcIiArIGluZm9Db250YWluZXJJZClcbiAgICAgICAgICAgIC5hcHBlbmQoXCJkaXZcIik7XG5cbiAgICAgICAgcmV0dXJuIGQzc2hlZXQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVzY2FsZSgpIHtcbiAgICAgIHZhciB0cmFucyA9IGQzLmV2ZW50LnRyYW5zbGF0ZTtcbiAgICAgIHZhciBzY2FsZSA9IGQzLmV2ZW50LnNjYWxlO1xuXG4gICAgICBkM3NoZWV0LnN2Zy5hdHRyKFwidHJhbnNmb3JtXCIsXG4gICAgICAgICAgXCJ0cmFuc2xhdGUoXCIgKyB0cmFucyArIFwiKVwiXG4gICAgICAgICAgKyBcIiBzY2FsZShcIiArIHNjYWxlICsgXCIpXCIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICogTG9hZCBkYXRhIGZyb20gc3ByZWFkc2hlZXQuXG4gICAgKiovXG4gICAgZDNzaGVldC5sb2FkID0gZnVuY3Rpb24oc3ByZWFkc2hlZXRLZXkpIHtcbiAgICAgICAgLy8gTG9hZCBzcHJlYWRzaGVldFxuICAgICAgICB2YXIgc3ByZWFkc2hlZXQgPSByZXF1aXJlKFwiLi9zcHJlYWRzaGVldFwiKTtcbiAgICAgICAgc3ByZWFkc2hlZXQoc3ByZWFkc2hlZXRLZXksIGZ1bmN0aW9uKHNwcmVhZHNoZWV0KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhzcHJlYWRzaGVldCk7XG5cbiAgICAgICAgICAgIGQzc2hlZXQuc3ByZWFkc2hlZXQgPSBzcHJlYWRzaGVldDtcblxuICAgICAgICAgICAgLy8gSW5pdGlhbGl6ZSBkb2N1bWVudFxuICAgICAgICAgICAgZG9jdW1lbnQudGl0bGUgPSBzcHJlYWRzaGVldC50aXRsZTtcblxuICAgICAgICAgICAgLy8gSW5pdGlhbGl6ZSBpbmZvIHNlY3Rpb25cbiAgICAgICAgICAgIHZhciBpbmZvTW9kdWxlID0gcmVxdWlyZShcIi4vaW5mb1wiKTtcbiAgICAgICAgICAgIHZhciBpbmZvID0gaW5mb01vZHVsZShkM3NoZWV0LmluZm9Db250YWluZXJJZCwgc3ByZWFkc2hlZXQudGl0bGUpO1xuXG4gICAgICAgICAgICAvLyBDcmVhdGUgbW9kZWwgZnJvbSBzcHJlYWRzaGVldFxuICAgICAgICAgICAgdmFyIG1vZGVsTW9kdWxlID0gcmVxdWlyZShcIi4vbW9kZWxcIik7XG4gICAgICAgICAgICBkM3NoZWV0Lm1vZGVsID0gbW9kZWxNb2R1bGUoZDNzaGVldC5zcHJlYWRzaGVldCk7XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGQzc2hlZXQubW9kZWwpO1xuXG4gICAgICAgICAgICAvLyBDcmVhdGUgZ3JhcGggZnJvbSBtb2RlbFxuICAgICAgICAgICAgdmFyIGdyYXBoTW9kdWxlID0gcmVxdWlyZShcIi4vZ3JhcGhcIik7XG4gICAgICAgICAgICBkM3NoZWV0LmdyYXBoID0gZ3JhcGhNb2R1bGUoZDNzaGVldC5tb2RlbCk7XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGQzc2hlZXQuZ3JhcGgpO1xuXG4gICAgICAgICAgICAvLyBDcmVhdGUgRDMgZm9yY2UgbGF5b3V0IGZyb20gZ3JhcGhcbiAgICAgICAgICAgIHZhciBmb3JjZU1vZHVsZSA9IHJlcXVpcmUoXCIuL2ZvcmNlXCIpO1xuICAgICAgICAgICAgdmFyIGZvcmNlID0gZm9yY2VNb2R1bGUoZDNzaGVldC5ncmFwaCwgZDNzaGVldC5zdmdDb250YWluZXJJZCwgZDNzaGVldC5zdmcsIGluZm8sIGQzc2hlZXQubW9kZWwuc2V0dGluZ3MpO1xuXG4gICAgICAgICAgICAvLyBJbml0aWFsaXplIHZpZXcgb3B0aW9uc1xuLy8gICAgICAgICAgICB2YXIgdmlld01vZHVsZSA9IHJlcXVpcmUoXCIuL3ZpZXdcIik7XG4vLyAgICAgICAgICAgIHZpZXdNb2R1bGUoZDNzaGVldC5tb2RlbCwgdXBkYXRlR3JhcGgpO1xuLy9cbi8vICAgICAgICAgICAgZnVuY3Rpb24gdXBkYXRlR3JhcGgodmlld09wdGlvbnMpIHtcbi8vICAgICAgICAgICAgICAgIC8vIFRPRE86IHVwZGF0ZSBkM3NoZWV0LmdyYXBoIGFuZCBmb3JjZS5yZXN0YXJ0KClcbi8vICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBBcHBseSBDU1Mgc3R5bGVcbiAgICAgICAgICAgIGFwcGx5Q3NzKGQzc2hlZXQubW9kZWwuc2V0dGluZ3MuY3NzKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYXBwbHlDc3MoY3NzKSB7XG4gICAgICAgIGlmIChjc3MgPT0gbnVsbClcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAvLyBHZXQgYWxsIGVsZW1lbnQgc2VsZWN0b3JzXG4gICAgICAgIHZhciBzZWxlY3RvcnMgPSBPYmplY3Qua2V5cyhjc3MpO1xuICAgICAgICAkLmVhY2goc2VsZWN0b3JzLCBmdW5jdGlvbihpLCBzZWxlY3Rvcikge1xuICAgICAgICAgICAgdmFyIGVsZW1lbnRzID0ge307XG4gICAgICAgICAgICBpZiAoc2VsZWN0b3Iuc2xpY2UoMCwgMSkgPT0gXCIjXCIpXG4gICAgICAgICAgICAgICAgLy8gSXQgaXMgYW4gaWRlbnRpZmllclxuICAgICAgICAgICAgICAgIGVsZW1lbnRzID0gJChzZWxlY3Rvcik7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgLy8gSXMgaXMgYSBjbGFzc1xuICAgICAgICAgICAgICAgIGVsZW1lbnRzID0gJChcIi5cIiArIHNlbGVjdG9yKTtcblxuICAgICAgICAgICAgLy8gR2V0IGFsbCBzdHlsZSBwcm9wZXJ0aWVzXG4gICAgICAgICAgICB2YXIgcHJvcGVydGllcyA9IE9iamVjdC5rZXlzKGNzc1tzZWxlY3Rvcl0pO1xuICAgICAgICAgICAgJC5lYWNoKHByb3BlcnRpZXMsIGZ1bmN0aW9uKGosIHByb3BlcnR5KSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudHMuY3NzKHByb3BlcnR5LCBjc3Nbc2VsZWN0b3JdW3Byb3BlcnR5XSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2hlY2tSZXF1aXJlbWVudHMoKSB7XG4gICAgICAgIGlmICh0eXBlb2YgZDMgPT09IFwidW5kZWZpbmVkXCIpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJEMyBsaWJyYXJ5IG5vdCBmb3VuZCFcIik7XG4gICAgICAgIGlmICh0eXBlb2YgJCA9PT0gXCJ1bmRlZmluZWRcIilcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImpRdWVyeSBub3QgZm91bmQhXCIpO1xuICAgIH1cbn0oKTsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGdyYXBoLCBzdmdDb250YWluZXJJZCwgc3ZnLCBpbmZvLCBzZXR0aW5ncykge1xuICAgIHZhciBub2RlID0gW10sXG4gICAgICAgIG5vZGVMYWJlbCA9IFtdLFxuICAgICAgICBsaW5rID0gW10sXG4gICAgICAgIGxpbmtMYWJlbCA9IFtdLFxuICAgICAgICBjb2xvcnMgPSBkMy5zY2FsZS5jYXRlZ29yeTIwKCk7XG5cbiAgICB2YXIgc3ZnQ29udGFpbmVyID0gJChcIiNcIiArIHN2Z0NvbnRhaW5lcklkKSxcbiAgICAgICAgd2lkdGggPSBzdmdDb250YWluZXIud2lkdGgoKSxcbiAgICAgICAgaGVpZ2h0ID0gc3ZnQ29udGFpbmVyLmhlaWdodCgpO1xuXG4gICAgc2VsZWN0QWxsKCk7XG5cbiAgICB2YXIgZm9yY2UgPSBkMy5sYXlvdXQuZm9yY2UoKVxuICAgICAgICAuc2l6ZShbd2lkdGgsIGhlaWdodF0pXG4gICAgICAgIC5saW5rRGlzdGFuY2UoMTcwKSAvLyBUT0RPOiBNb3ZlIHRvIHNldHRpbmdzXG4gICAgICAgIC5jaGFyZ2UoLTUwMDApIC8vIFRPRE86IE1vdmUgdG8gc2V0dGluZ3NcbiAgICAgICAgLmdyYXZpdHkoMC4zKSAvLyBUT0RPOiBNb3ZlIHRvIHNldHRpbmdzXG4gICAgICAgIC5ub2RlcyhncmFwaC5ub2RlcylcbiAgICAgICAgLmxpbmtzKGdyYXBoLmxpbmtzKVxuICAgICAgICAub24oXCJ0aWNrXCIsIG9uVGljayk7XG5cbiAgICB2YXIgZHJhZyA9IGZvcmNlLmRyYWcoKVxuICAgICAgICAub3JpZ2luKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQ7IH0pXG4gICAgICAgIC5vbihcImRyYWdzdGFydFwiLCBkcmFnc3RhcnRlZClcbiAgICAgICAgLm9uKFwiZHJhZ1wiLCBkcmFnZ2VkKVxuICAgICAgICAub24oXCJkcmFnZW5kXCIsIGRyYWdlbmRlZCk7XG5cbiAgICB0aGlzLnJlc3RhcnQgPSByZXN0YXJ0XG4gICAgcmVzdGFydCgpO1xuXG4gICAgZnVuY3Rpb24gZHJhZ3N0YXJ0ZWQoZCkge1xuICAgICAgIGQzLmV2ZW50LnNvdXJjZUV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgIGQzLnNlbGVjdCh0aGlzKS5jbGFzc2VkKFwiZHJhZ2dpbmdcIiwgdHJ1ZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZHJhZ2dlZChkKSB7XG4gICAgICAgZDMuc2VsZWN0KHRoaXMpLmF0dHIoXCJjeFwiLCBkLnggPSBkMy5ldmVudC54KS5hdHRyKFwiY3lcIiwgZC55ID0gZDMuZXZlbnQueSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZHJhZ2VuZGVkKGQpIHtcbiAgICAgICBkMy5zZWxlY3QodGhpcykuY2xhc3NlZChcImRyYWdnaW5nXCIsIGZhbHNlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZXN0YXJ0KCkge1xuXG4gICAgICAgIHN2Zy5zZWxlY3RBbGwoXCIubGlua1wiKVxuICAgICAgICAgICAgLmRhdGEoZ3JhcGgubGlua3MpXG4gICAgICAgICAgICAuZW50ZXIoKVxuICAgICAgICAgICAgLmFwcGVuZChcInBhdGhcIilcbiAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJsaW5rXCIpXG4gICAgICAgICAgICAuYXR0cihcIm1hcmtlci1lbmRcIiwgbGlua01hcmtlckVuZClcbiAgICAgICAgICAgIC5hdHRyKFwibWFya2VyLXN0YXJ0XCIsIGxpbmtNYXJrZXJTdGFydCk7XG5cbiAgICAgICAgc3ZnLnNlbGVjdEFsbChcIi5saW5rLWxhYmVsXCIpXG4gICAgICAgICAgICAuZGF0YShncmFwaC5saW5rcylcbiAgICAgICAgICAgIC5lbnRlcigpXG4gICAgICAgICAgICAuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAgICAgLnRleHQoZnVuY3Rpb24oZ3JhcGhMaW5rKSB7IHJldHVybiBncmFwaExpbmsubGFiZWw7IH0pXG4gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibGluay1sYWJlbFwiKVxuICAgICAgICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKTtcblxuICAgICAgICBzdmcuc2VsZWN0QWxsKFwiLm5vZGVcIilcbiAgICAgICAgICAgIC5kYXRhKGdyYXBoLm5vZGVzKVxuICAgICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAgIC5hcHBlbmQoXCJjaXJjbGVcIilcbiAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgbm9kZUNsYXNzKVxuICAgICAgICAgICAgLmF0dHIoXCJyXCIsIDIwKSAvLyBUT0RPOiBTZXR0aW5nc1xuICAgICAgICAgICAgLmF0dHIoXCJjeFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLng7IH0pXG4gICAgICAgICAgICAuYXR0cihcImN5XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueTsgfSlcbiAgICAgICAgICAgIC5hdHRyKFwiZmlsbFwiLCBub2RlRmlsbENvbG9yKVxuICAgICAgICAgICAgLmNhbGwoZm9yY2UuZHJhZylcbiAgICAgICAgICAgIC5vbihcImNsaWNrXCIsIG5vZGVDbGljayk7XG5cbiAgICAgICAgc3ZnLnNlbGVjdEFsbChcIi5ub2RlLWxhYmVsXCIpXG4gICAgICAgICAgICAuZGF0YShncmFwaC5ub2RlcylcbiAgICAgICAgICAgIC5lbnRlcigpXG4gICAgICAgICAgICAuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcIm5vZGUtbGFiZWxcIilcbiAgICAgICAgICAgIC5hdHRyKFwiZHlcIiwgXCIuMzVlbVwiKVxuICAgICAgICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxuICAgICAgICAgICAgLnRleHQoZnVuY3Rpb24oZ3JhcGhOb2RlKSB7IHJldHVybiBncmFwaE5vZGUubm9kZS5sYWJlbCgpOyB9KVxuICAgICAgICAgICAgLmNhbGwoZm9yY2UuZHJhZylcbiAgICAgICAgICAgIC5vbihcImNsaWNrXCIsIG5vZGVDbGljayk7XG5cbiAgICAgICAgc2VsZWN0QWxsKCk7XG4gICAgICAgIGZvcmNlLnN0YXJ0KCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGlua01hcmtlckVuZChncmFwaExpbmspIHtcbiAgICAgICAgaWYgKGdyYXBoTGluay50b1RhcmdldClcbiAgICAgICAgICAgIHJldHVybiBcInVybCgjbWFya2VyRW5kKVwiO1xuXG4gICAgICAgIHJldHVybiBcIm5vbmVcIjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaW5rTWFya2VyU3RhcnQoZ3JhcGhMaW5rKSB7XG4gICAgICAgIGlmIChncmFwaExpbmsudG9Tb3VyY2UpXG4gICAgICAgICAgICByZXR1cm4gXCJ1cmwoI21hcmtlclN0YXJ0KVwiO1xuXG4gICAgICAgIHJldHVybiBcIm5vbmVcIjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBub2RlQ2xhc3MoZ3JhcGhOb2RlKSB7XG4gICAgICAgIHJldHVybiBcIm5vZGUgXCIgKyBncmFwaE5vZGUubm9kZS5ub2RlR3JvdXAubmFtZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBub2RlQ2xpY2soZ3JhcGhOb2RlKSB7XG4gICAgICAgIGluZm8uc2hvd05vZGUoZ3JhcGhOb2RlLm5vZGUsIG5vZGVGaWxsQ29sb3IoZ3JhcGhOb2RlKSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbm9kZUZpbGxDb2xvcihncmFwaE5vZGUpIHtcbiAgICAgICAgcmV0dXJuIHNldHRpbmdzLmNzcy5nZXQoZ3JhcGhOb2RlLm5vZGUubm9kZUdyb3VwLm5hbWUgKyBcIi5maWxsXCIsIGNvbG9ycyhncmFwaE5vZGUubm9kZS5ub2RlR3JvdXAubmFtZSkpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNlbGVjdEFsbCgpIHtcbiAgICAgICAgbm9kZSA9IHN2Zy5zZWxlY3RBbGwoXCIubm9kZVwiKTtcbiAgICAgICAgbm9kZUxhYmVsID0gc3ZnLnNlbGVjdEFsbChcIi5ub2RlLWxhYmVsXCIpO1xuICAgICAgICBsaW5rID0gc3ZnLnNlbGVjdEFsbChcIi5saW5rXCIpO1xuICAgICAgICBsaW5rTGFiZWwgPSBzdmcuc2VsZWN0QWxsKFwiLmxpbmstbGFiZWxcIik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gb25UaWNrKCkge1xuLy8gICAgICAgIGxpbmsuYXR0cihcIngxXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuc291cmNlLng7IH0pXG4vLyAgICAgICAgICAgIC5hdHRyKFwieTFcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5zb3VyY2UueTsgfSlcbi8vICAgICAgICAgICAgLmF0dHIoXCJ4MlwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnRhcmdldC54OyB9KVxuLy8gICAgICAgICAgICAuYXR0cihcInkyXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGFyZ2V0Lnk7IH0pO1xuICAgICAgICBsaW5rLmF0dHIoXCJkXCIsIGxpbmtBcmMpO1xuXG4gICAgICAgIGxpbmtMYWJlbFxuICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKGQuc291cmNlLnggKyBkLnRhcmdldC54KS8yOyB9KVxuICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKGQuc291cmNlLnkgKyBkLnRhcmdldC55KS8yOyB9KTtcblxuICAgICAgICBub2RlXG4gICAgICAgICAgICAuYXR0cihcImN4XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueDsgfSlcbiAgICAgICAgICAgIC5hdHRyKFwiY3lcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC55OyB9KTtcblxuICAgICAgICBub2RlTGFiZWxcbiAgICAgICAgICAgIC5hdHRyKFwieFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLng7IH0pXG4gICAgICAgICAgICAuYXR0cihcInlcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC55OyB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaW5rQXJjKGQpIHtcbiAgICAgICAgdmFyIGR4ID0gZC50YXJnZXQueCAtIGQuc291cmNlLngsXG4gICAgICAgICAgICBkeSA9IGQudGFyZ2V0LnkgLSBkLnNvdXJjZS55O1xuICAgICAgICByZXR1cm4gXCJNXCIgKyBkLnNvdXJjZS54ICsgXCIgXCIgKyBkLnNvdXJjZS55ICsgXCJMIFwiICsgZC50YXJnZXQueCArIFwiLFwiICsgZC50YXJnZXQueTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgdmFyIGdyYXBoID0gbmV3IEdyYXBoKCk7XG5cbiAgICAvLyBGb3IgYWxsIHNoZWV0c1xuICAgICQuZWFjaChtb2RlbC5ub2RlR3JvdXBzLml0ZW1zLCBmdW5jdGlvbihpLCBub2RlR3JvdXApIHtcbiAgICAgICAgLy8gRm9yIGFsbCBub2Rlc1xuICAgICAgICAkLmVhY2gobm9kZUdyb3VwLm5vZGVzLCBmdW5jdGlvbihqLCBub2RlKSB7XG4gICAgICAgICAgICAvLyBBZGQgbm9kZSB0byBncmFwaFxuICAgICAgICAgICAgdmFyIGdyYXBoTm9kZSA9IG5ldyBHcmFwaE5vZGUobm9kZSk7XG4gICAgICAgICAgICBncmFwaC5ub2Rlcy5wdXNoKGdyYXBoTm9kZSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIGxpbmtzXG4gICAgJC5lYWNoKGdyYXBoLm5vZGVzLCBmdW5jdGlvbihpLCBncmFwaE5vZGUpIHtcbiAgICAgICAgJC5lYWNoKGdyYXBoTm9kZS5ub2RlLnJlZnMsIGZ1bmN0aW9uKGosIHJlZikge1xuICAgICAgICAgICAgZ3JhcGgubGlua3MucHVzaChuZXcgR3JhcGhMaW5rKGdyYXBoTm9kZSwgZ2V0R3JhcGhOb2RlKHJlZi50YXJnZXROb2RlKSwgcmVmLmxhYmVsLCByZWYudG9UYXJnZXQsIHJlZi50b1NvdXJjZSkpO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIGdldEdyYXBoTm9kZShub2RlKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSBudWxsO1xuICAgICAgICAkLmVhY2goZ3JhcGgubm9kZXMsIGZ1bmN0aW9uKGksIGdyYXBoTm9kZSkge1xuICAgICAgICAgICAgaWYgKGdyYXBoTm9kZS5ub2RlID09IG5vZGUpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBncmFwaE5vZGU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICByZXR1cm4gZ3JhcGg7XG59XG5cbmZ1bmN0aW9uIEdyYXBoKCkge1xuICAgIHRoaXMubm9kZXMgPSBbXTtcbiAgICB0aGlzLmxpbmtzID0gW107XG4gICAgcmV0dXJuIHRoaXM7XG59XG5cbmZ1bmN0aW9uIEdyYXBoTm9kZShub2RlKSB7XG4gICAgdGhpcy5ub2RlID0gbm9kZTtcbiAgICByZXR1cm4gdGhpcztcbn1cblxuZnVuY3Rpb24gR3JhcGhMaW5rKHNvdXJjZSwgdGFyZ2V0LCBsYWJlbCwgdG9UYXJnZXQsIHRvU291cmNlKSB7XG4gICAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG4gICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XG4gICAgdGhpcy5sYWJlbCA9IGxhYmVsO1xuICAgIHRoaXMudG9Tb3VyY2UgPSB0b1NvdXJjZTtcbiAgICB0aGlzLnRvVGFyZ2V0ID0gdG9UYXJnZXQ7XG4gICAgcmV0dXJuIHRoaXM7XG59IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbmZvQ29udGFpbmVySWQsIHRpdGxlKSB7XG4gICAgLy8gU2V0IGhlYWRpbmdcbiAgICAkKFwiI1wiICsgaW5mb0NvbnRhaW5lcklkICsgXCIgaDFcIikudGV4dCh0aXRsZSk7XG5cbiAgICB0aGlzLnNob3dOb2RlID0gZnVuY3Rpb24obm9kZSwgZmlsbENvbG9yKSB7XG4gICAgICAgICQoXCIjZDNzaGVldC1ub2RlLWluZm8gaDJcIikudGV4dChub2RlLmhlYWRpbmcoKSk7XG4gICAgICAgICQoXCIjZDNzaGVldC1ub2RlLWluZm8gaGVhZGVyXCIpLmNzcyhcImJhY2tncm91bmQtY29sb3JcIiwgZmlsbENvbG9yKTtcbiAgICAgICAgJChcIiNkM3NoZWV0LW5vZGUtc2hlZXQtbmFtZVwiKS50ZXh0KG5vZGUubm9kZUdyb3VwLm5hbWUpO1xuXG4gICAgICAgIHZhciB1bCA9ICQoXCIjZDNzaGVldC1ub2RlLXByb3BlcnRpZXNcIik7XG4gICAgICAgIHVsLmVtcHR5KCk7XG5cbiAgICAgICAgLy8gU2hvdyBub2RlIHByb3BlcnRpZXNcbiAgICAgICAgJC5lYWNoKG5vZGUucHJvcGVydGllcywgZnVuY3Rpb24oaSwgbm9kZVByb3BlcnR5KSB7XG4gICAgICAgICAgICBpZiAoIW5vZGVQcm9wZXJ0eS5pc0hpZGRlbilcbiAgICAgICAgICAgICAgICBhZGRQcm9wZXJ0eShub2RlUHJvcGVydHkubmFtZSwgbm9kZVByb3BlcnR5LnZhbHVlKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gR3JvdXAgbm9kZSBsaW5rc1xuICAgICAgICB2YXIgZ3JvdXBlZExpbmtzID0ge307XG4gICAgICAgICQuZWFjaChub2RlLnJlZnMsIGZ1bmN0aW9uKGksIHJlZikge1xuICAgICAgICAgICAgdmFyIGxpbmtOYW1lID0gcmVmLnRhcmdldE5vZGUubm9kZUdyb3VwLm5hbWU7XG5cbiAgICAgICAgICAgIGlmIChncm91cGVkTGlua3NbbGlua05hbWVdID09IG51bGwpXG4gICAgICAgICAgICAgICAgZ3JvdXBlZExpbmtzW2xpbmtOYW1lXSA9IFtdO1xuXG4gICAgICAgICAgICBncm91cGVkTGlua3NbbGlua05hbWVdLnB1c2gocmVmLnRhcmdldE5vZGUuaGVhZGluZygpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gU2hvdyBub2RlIGxpbmtzXG4gICAgICAgIHZhciBsaW5rTmFtZXMgPSBPYmplY3Qua2V5cyhncm91cGVkTGlua3MpO1xuICAgICAgICAkLmVhY2gobGlua05hbWVzLCBmdW5jdGlvbihpLCBsaW5rTmFtZSkge1xuICAgICAgICAgICAgYWRkUHJvcGVydHkobGlua05hbWUsIGdyb3VwZWRMaW5rc1tsaW5rTmFtZV0uam9pbihcIiwgXCIpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZnVuY3Rpb24gYWRkUHJvcGVydHkobmFtZSwgdmFsdWUpIHtcbiAgICAgICAgICAgIHVsLmFwcGVuZChcIjxsaT48c3BhbiBjbGFzcz1cXFwiZDNzaGVldC1ub2RlLXByb3BlcnR5LW5hbWVcXFwiPlwiICsgbmFtZSArXG4gICAgICAgICAgICAgICAgXCI6PC9zcGFuPiA8c3BhbiBjbGFzcz1cXFwiZDNzaGVldC1ub2RlLXByb3BlcnR5LXZhbHVlXFxcIj5cIiArIGZvcm1hdFZhbHVlKHZhbHVlKSArIFwiPC9zcGFuPjwvbGk+XCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZm9ybWF0VmFsdWUodmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZS5zbGljZSgwLCBcIjRcIikudG9Mb3dlckNhc2UoKSA9PSBcImh0dHBcIilcbiAgICAgICAgICAgICAgICByZXR1cm4gXCI8YSBocmVmPVxcXCJcIiArIHZhbHVlICsgXCJcXFwiPlwiICsgdmFsdWUgKyBcIjwvYT5cIlxuXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNwcmVhZHNoZWV0KSB7XG4gICAgdmFyIG1vZGVsID0gbmV3IE1vZGVsKCk7XG5cbiAgICB2YXIgbm9kZUdyb3VwVHlwZXMgPSBnZXROb2RlR3JvdXBUeXBlcyhzcHJlYWRzaGVldCk7XG4gICAgbW9kZWwubm9kZUdyb3VwcyA9IGdldE5vZGVHcm91cHMoc3ByZWFkc2hlZXQsIG5vZGVHcm91cFR5cGVzLm5vZGVHcm91cE5hbWVzLCBub2RlR3JvdXBUeXBlcy5yZWZTaGVldE5hbWVzKTtcbiAgICBpZiAobm9kZUdyb3VwVHlwZXMuc2V0dGluZ3NHcm91cE5hbWUgIT0gbnVsbClcbiAgICAgICAgbW9kZWwuc2V0dGluZ3MgPSBnZXRTZXR0aW5ncyhzcHJlYWRzaGVldC5zaGVldHNbbm9kZUdyb3VwVHlwZXMuc2V0dGluZ3NHcm91cE5hbWVdKTtcblxuICAgIGZ1bmN0aW9uIGdldFNldHRpbmdzKHNldHRpbmdzU2hlZXQpIHtcbiAgICAgICAgdmFyIHNldHRpbmdzID0gbmV3IFNldHRpbmdzKCk7XG5cbiAgICAgICAgJC5lYWNoKHNldHRpbmdzU2hlZXQucm93cywgZnVuY3Rpb24oaSwgcm93KSB7XG4gICAgICAgICAgICB2YXIga2V5ID0gcm93LnJvd0NlbGxzWzBdLnZhbHVlLFxuICAgICAgICAgICAgICAgIHZhbHVlID0gcm93LnJvd0NlbGxzWzFdLnZhbHVlO1xuXG4gICAgICAgICAgICBpZiAoKGtleSA9PSBudWxsKSB8fCAodmFsdWUgPT0gbnVsbCkpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgICAgICB2YXIgcGF0aCA9IGtleS5zcGxpdChcIi5cIik7XG4gICAgICAgICAgICB2YXIgY3VycmVudCA9IHNldHRpbmdzO1xuICAgICAgICAgICAgJC5lYWNoKHBhdGgsIGZ1bmN0aW9uKGosIGspIHtcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudFtrXSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChqID09IHBhdGgubGVuZ3RoIC0gMSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRba10gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudFtrXSA9IG5ldyBTZXR0aW5ncygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjdXJyZW50ID0gY3VycmVudFtrXTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gc2V0dGluZ3M7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0Tm9kZUdyb3VwcyhzcHJlYWRzaGVldCwgbm9kZUdyb3VwTmFtZXMsIHJlZlNoZWV0TmFtZXMpIHtcbiAgICAgICAgLy8gQ3JlYXRlIG5vZGVzIHdpdGggcHJvcGVydGllc1xuICAgICAgICB2YXIgbm9kZUdyb3VwcyA9IG5ldyBOb2RlR3JvdXBzKCk7XG4gICAgICAgICQuZWFjaChub2RlR3JvdXBOYW1lcywgZnVuY3Rpb24oaSwgbm9kZUdyb3VwTmFtZSkge1xuICAgICAgICAgICAgbm9kZUdyb3Vwcy5pdGVtcy5wdXNoKGdldE5vZGVzKHNwcmVhZHNoZWV0LnNoZWV0c1tub2RlR3JvdXBOYW1lXSwgbm9kZUdyb3VwTmFtZSkpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBDcmVhdGUgcmVmZXJlbmNlcyBmcm9tIG5vZGUgc2hlZXRzXG4gICAgICAgICQuZWFjaChub2RlR3JvdXBzLml0ZW1zLCBmdW5jdGlvbihpLCBub2RlR3JvdXApIHtcbiAgICAgICAgICAgIGNyZWF0ZVJlZnMobm9kZUdyb3Vwcywgc3ByZWFkc2hlZXQuc2hlZXRzW25vZGVHcm91cC5uYW1lXSwgbm9kZUdyb3VwKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIHJlZmVyZW5jZXMgZnJvbSByZWZlcmVuY2Ugc2hlZXRzXG4gICAgICAgICQuZWFjaChyZWZTaGVldE5hbWVzLCBmdW5jdGlvbihpLCByZWZTaGVldE5hbWUpIHtcbiAgICAgICAgICAgIGNyZWF0ZVNoZWV0UmVmcyhub2RlR3JvdXBzLCBzcHJlYWRzaGVldC5zaGVldHNbcmVmU2hlZXROYW1lLm5hbWVdLCByZWZTaGVldE5hbWUpO1xuICAgICAgICB9KTtcblxuICAgICAgICBmdW5jdGlvbiBjcmVhdGVTaGVldFJlZnMobm9kZUdyb3VwcywgcmVmU2hlZXQsIHJlZlNoZWV0TmFtZSkge1xuICAgICAgICAgICAgdmFyIGNvbE5hbWVzID0gcmVmU2hlZXQuaGVhZGVyKCk7XG5cbiAgICAgICAgICAgIC8vIEZvciBhbGwgc2hlZXQgcm93c1xuICAgICAgICAgICAgJC5lYWNoKHJlZlNoZWV0LnJvd3MsIGZ1bmN0aW9uKGksIHJvdykge1xuICAgICAgICAgICAgICAgIGlmIChpID09IDApXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAgICAgICAgIHZhciBzb3VyY2UgPSBnZXRSZWZUb05vZGVHcm91cChub2RlR3JvdXBzLCByZWZTaGVldCwgcm93LCByZWZTaGVldE5hbWUuc291cmNlKTtcbiAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0ID0gZ2V0UmVmVG9Ob2RlR3JvdXAobm9kZUdyb3VwcywgcmVmU2hlZXQsIHJvdywgcmVmU2hlZXROYW1lLnRhcmdldCk7XG4gICAgICAgICAgICAgICAgaWYgKChzb3VyY2UgIT0gbnVsbCkgJiZcbiAgICAgICAgICAgICAgICAgICAgKHRhcmdldCAhPSBudWxsKSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbGFiZWwgPSB0YXJnZXQubGFiZWw7XG4gICAgICAgICAgICAgICAgICAgIGlmICgoKHRhcmdldC5sYWJlbCA9PSBudWxsKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgKHRhcmdldC5sYWJlbCA9PSBcIlwiKSkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIChyb3cucm93Q2VsbHNbMF0uY29sSW5kZXggPT0gMCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbCA9IHJvdy5yb3dDZWxsc1swXS52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAkLmVhY2goc291cmNlLm5vZGVzLCBmdW5jdGlvbihqLCBzb3VyY2VSZWYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaCh0YXJnZXQubm9kZXMsIGZ1bmN0aW9uKGssIHRhcmdldFJlZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZVJlZi50YXJnZXROb2RlLnJlZnMucHVzaChuZXcgUmVmKHRhcmdldFJlZi50YXJnZXROb2RlLCBsYWJlbCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZ2V0UmVmVG9Ob2RlR3JvdXAobm9kZUdyb3Vwcywgc2hlZXQsIHJvdywgbm9kZUdyb3VwTmFtZSkge1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IG51bGw7XG4gICAgICAgICAgICB2YXIgY29sTmFtZXMgPSBzaGVldC5oZWFkZXIoKTtcbiAgICAgICAgICAgICQuZWFjaChjb2xOYW1lcywgZnVuY3Rpb24oaiwgY29sTmFtZSkge1xuICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IHNoZWV0LnZhbHVlKHJvdywgY29sTmFtZSk7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IG51bGwpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAgICAgICAgIHZhciByZWZUYXJnZXQgPSBwYXJzZUNvbHVtblJlZk5hbWUoY29sTmFtZSwgbm9kZUdyb3Vwcyk7XG4gICAgICAgICAgICAgICAgaWYgKChyZWZUYXJnZXQgIT0gbnVsbCkgJiZcbiAgICAgICAgICAgICAgICAgICAgKHJlZlRhcmdldC5ub2RlR3JvdXAubmFtZSA9PSBub2RlR3JvdXBOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSByZWZUYXJnZXQ7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5ub2RlcyA9IFtdO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIEZpbmQgaW5kZXggb2YgdGhlIHRhcmdldCBub2RlXG4gICAgICAgICAgICAgICAgICAgICQuZWFjaChyZWZUYXJnZXQubm9kZUdyb3VwLm5vZGVzLCBmdW5jdGlvbihrLCB0YXJnZXROb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB0YXJnZXQgbm9kZSBwcm9wZXJ0eSB2YWx1ZSBtYXRjaGVzXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUuaW5kZXhPZih0YXJnZXROb2RlLnZhbHVlKHJlZlRhcmdldC5wcm9wZXJ0eU5hbWUpKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0Lm5vZGVzLnB1c2gobmV3IFJlZih0YXJnZXROb2RlLCByZWZUYXJnZXQubGFiZWwsIHJlZlRhcmdldC50b1RhcmdldCxyZWZUYXJnZXQudG9Tb3VyY2UpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZVJlZnMobm9kZUdyb3Vwcywgbm9kZVNoZWV0LCBub2RlR3JvdXApIHtcbiAgICAgICAgICAgIHZhciBjb2xOYW1lcyA9IG5vZGVTaGVldC5oZWFkZXIoKTtcblxuICAgICAgICAgICAgLy8gRm9yIGFsbCBzaGVldCByb3dzXG4gICAgICAgICAgICAkLmVhY2gobm9kZVNoZWV0LnJvd3MsIGZ1bmN0aW9uKGksIHJvdykge1xuICAgICAgICAgICAgICAgIGlmIChpID09IDApXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAgICAgICAgIC8vIEZvciBhbGwgc2hlZXQgY29sdW1uc1xuICAgICAgICAgICAgICAgICQuZWFjaChjb2xOYW1lcywgZnVuY3Rpb24oaiwgY29sTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBub2RlU2hlZXQudmFsdWUocm93LCBjb2xOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhpcyBpcyBhIHJlZmVyZW5jZSBjb2x1bW5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlZlRhcmdldCA9IHBhcnNlQ29sdW1uUmVmTmFtZShjb2xOYW1lLCBub2RlR3JvdXBzKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlZlRhcmdldCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGaW5kIGluZGV4IG9mIHRoZSB0YXJnZXQgbm9kZVxuICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKHJlZlRhcmdldC5ub2RlR3JvdXAubm9kZXMsIGZ1bmN0aW9uKGssIHRhcmdldE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB0YXJnZXQgbm9kZSBwcm9wZXJ0eSB2YWx1ZSBtYXRjaGVzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogV2Ugc2hvdWxkIHByb3Blcmx5IHNwbGl0IHZhbHVlcyB1c2luZyBjb21tYVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZS5pbmRleE9mKHRhcmdldE5vZGUudmFsdWUocmVmVGFyZ2V0LnByb3BlcnR5TmFtZSkpID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUdyb3VwLm5vZGVzW2kgLSAxXS5yZWZzLnB1c2gobmV3IFJlZih0YXJnZXROb2RlLCByZWZUYXJnZXQubGFiZWwsIHJlZlRhcmdldC50b1RhcmdldCwgcmVmVGFyZ2V0LnRvU291cmNlKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZ2V0Tm9kZXMobm9kZVNoZWV0LCBub2RlR3JvdXBOYW1lKSB7XG4gICAgICAgICAgICB2YXIgaGVhZGVyID0gbm9kZVNoZWV0LmhlYWRlcigpO1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IG5ldyBOb2RlR3JvdXAobm9kZUdyb3VwTmFtZSwgaGVhZGVyWzBdKTtcblxuICAgICAgICAgICAgLy8gR2V0IG5vZGVzIGFuZCBwcm9wZXJ0aWVzXG4gICAgICAgICAgICAkLmVhY2gobm9kZVNoZWV0LnJvd3MsIGZ1bmN0aW9uKGksIHJvdykge1xuICAgICAgICAgICAgICAgIGlmIChpID09IDApXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICByZXN1bHQubm9kZXMucHVzaChuZXcgTm9kZShnZXROb2RlUHJvcGVydGllcyhyb3csIGhlYWRlciksIHJlc3VsdCkpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBnZXROb2RlUHJvcGVydGllcyhyb3csIGhlYWRlcikge1xuICAgICAgICAgICAgdmFyIG5vZGVQcm9wZXJ0aWVzID0gW107XG4gICAgICAgICAgICAkLmVhY2gocm93LnJvd0NlbGxzLCBmdW5jdGlvbihpLCByb3dDZWxsKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbE5hbWUgPSBoZWFkZXJbcm93Q2VsbC5jb2xJbmRleF07XG4gICAgICAgICAgICAgICAgaWYgKGNvbE5hbWUuaW5kZXhPZihcIi5cIikgPT0gLTEpXG4gICAgICAgICAgICAgICAgICAgIG5vZGVQcm9wZXJ0aWVzLnB1c2gobmV3IE5vZGVQcm9wZXJ0eShjb2xOYW1lLCByb3dDZWxsLnZhbHVlKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBub2RlUHJvcGVydGllcztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBub2RlR3JvdXBzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldE5vZGVHcm91cFR5cGVzKHNwcmVhZHNoZWV0KSB7XG4gICAgICAgIHZhciBub2RlR3JvdXBUeXBlcyA9IHtcbiAgICAgICAgICAgIG5vZGVHcm91cE5hbWVzOiBbXSxcbiAgICAgICAgICAgIHJlZlNoZWV0TmFtZXM6IFtdLFxuICAgICAgICAgICAgc2V0dGluZ3NHcm91cE5hbWU6IG51bGxcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHNoZWV0TmFtZXMgPSBPYmplY3Qua2V5cyhzcHJlYWRzaGVldC5zaGVldHMpO1xuICAgICAgICAkLmVhY2goc2hlZXROYW1lcywgZnVuY3Rpb24oaSwgc2hlZXROYW1lKSB7XG4gICAgICAgICAgICBpZiAoc2hlZXROYW1lID09IFwic2V0dGluZ3NcIikge1xuICAgICAgICAgICAgICAgIG5vZGVHcm91cFR5cGVzLnNldHRpbmdzR3JvdXBOYW1lID0gc2hlZXROYW1lO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHNoZWV0TmFtZS5zbGljZSgwLCAxKSA9PSBcIiNcIilcbiAgICAgICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgICAgIHZhciByZWZTaGVldCA9IHBhcnNlUmVmU2hlZXROYW1lKHNoZWV0TmFtZSlcbiAgICAgICAgICAgIGlmICgocmVmU2hlZXQgIT0gbnVsbCkgJiZcbiAgICAgICAgICAgICAgICAoc2hlZXROYW1lcy5pbmRleE9mKHJlZlNoZWV0LnNvdXJjZSkgPiAtMSkgJiZcbiAgICAgICAgICAgICAgICAoc2hlZXROYW1lcy5pbmRleE9mKHJlZlNoZWV0LnRhcmdldCkgPiAtMSkpIHtcbiAgICAgICAgICAgICAgICBub2RlR3JvdXBUeXBlcy5yZWZTaGVldE5hbWVzLnB1c2gocmVmU2hlZXQpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbm9kZUdyb3VwVHlwZXMubm9kZUdyb3VwTmFtZXMucHVzaChzaGVldE5hbWUpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gbm9kZUdyb3VwVHlwZXM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VDb2x1bW5SZWZOYW1lKGNvbE5hbWUsIG5vZGVHcm91cHMpIHtcbiAgICAgICAgdmFyIHRvVGFyZ2V0ID0gKGNvbE5hbWUuc2xpY2UoMCwgMikgPT0gXCItPlwiKTtcbiAgICAgICAgdmFyIHRvU291cmNlID0gKGNvbE5hbWUuc2xpY2UoMCwgMikgPT0gXCI8LVwiKTtcbiAgICAgICAgdmFyIHJlZk5hbWVzID0gY29sTmFtZS5yZXBsYWNlKFwiLT5cIiwgXCJcIikucmVwbGFjZShcIjwtXCIsIFwiXCIpLnNwbGl0KFwiLlwiKTtcbiAgICAgICAgdmFyIG5vZGVHcm91cCA9IG51bGw7XG4gICAgICAgIGlmIChyZWZOYW1lcy5sZW5ndGggPiAwKVxuICAgICAgICAgICAgbm9kZUdyb3VwID0gbm9kZUdyb3Vwcy5nZXRCeU5hbWUocmVmTmFtZXNbMF0pO1xuICAgICAgICBpZiAoKHJlZk5hbWVzLmxlbmd0aCA+PSAyKSAmJlxuICAgICAgICAgICAgKG5vZGVHcm91cCAhPSBudWxsKSkge1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHtcbiAgICAgICAgICAgICAgICBub2RlR3JvdXA6IG5vZGVHcm91cCxcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eU5hbWU6IHJlZk5hbWVzWzFdLFxuICAgICAgICAgICAgICAgIHRvVGFyZ2V0OiB0b1RhcmdldCxcbiAgICAgICAgICAgICAgICB0b1NvdXJjZTogdG9Tb3VyY2VcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHJlZk5hbWVzLmxlbmd0aCA9PSAzKVxuICAgICAgICAgICAgICAgIHJlc3VsdC5sYWJlbCA9IHJlZk5hbWVzWzJdO1xuXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VSZWZTaGVldE5hbWUoc2hlZXROYW1lKSB7XG4gICAgICAgIHZhciBub2RlTmFtZXMgPSBzaGVldE5hbWUuc3BsaXQoXCItXCIpO1xuICAgICAgICBpZiAobm9kZU5hbWVzLmxlbmd0aCA9PSAyKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG5hbWU6IHNoZWV0TmFtZSxcbiAgICAgICAgICAgICAgICBzb3VyY2U6IG5vZGVOYW1lc1swXSxcbiAgICAgICAgICAgICAgICB0YXJnZXQ6IG5vZGVOYW1lc1sxXVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiBtb2RlbDtcbn1cblxuZnVuY3Rpb24gTW9kZWwoKSB7XG4gICAgdGhpcy5ub2RlR3JvdXBzID0gbmV3IE5vZGVHcm91cHMoKTtcbiAgICB0aGlzLnNldHRpbmdzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG59XG5cbmZ1bmN0aW9uIE5vZGVHcm91cHMoKSB7XG4gICAgdGhpcy5pdGVtcyA9IFtdO1xuICAgIHJldHVybiB0aGlzO1xufVxuXG5Ob2RlR3JvdXBzLnByb3RvdHlwZS5nZXRCeU5hbWUgPSBmdW5jdGlvbihub2RlR3JvdXBOYW1lKSB7XG4gICAgdmFyIHJlc3VsdCA9IG51bGw7XG4gICAgJC5lYWNoKHRoaXMuaXRlbXMsIGZ1bmN0aW9uKGksIG5vZGVHcm91cCkge1xuICAgICAgICBpZiAobm9kZUdyb3VwLm5hbWUgPT0gbm9kZUdyb3VwTmFtZSkge1xuICAgICAgICAgICAgcmVzdWx0ID0gbm9kZUdyb3VwO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gTm9kZUdyb3VwKG5hbWUsIGxhYmVsUHJvcGVydHlOYW1lKSB7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLmxhYmVsUHJvcGVydHlOYW1lID0gbGFiZWxQcm9wZXJ0eU5hbWU7XG4gICAgdGhpcy5ub2RlcyA9IFtdO1xuICAgIHJldHVybiB0aGlzO1xufVxuXG5mdW5jdGlvbiBOb2RlKHByb3BlcnRpZXMsIG5vZGVHcm91cCkge1xuICAgIHRoaXMucHJvcGVydGllcyA9IHByb3BlcnRpZXM7XG4gICAgdGhpcy5yZWZzID0gW107XG4gICAgdGhpcy5ub2RlR3JvdXAgPSBub2RlR3JvdXA7XG4gICAgcmV0dXJuIHRoaXM7XG59XG5cbk5vZGUucHJvdG90eXBlLnZhbHVlID0gZnVuY3Rpb24ocHJvcGVydHlOYW1lKSB7XG4gICAgdmFyIHJlc3VsdCA9IG51bGw7XG4gICAgJC5lYWNoKHRoaXMucHJvcGVydGllcywgZnVuY3Rpb24oaSwgcHJvcGVydHkpIHtcbiAgICAgICAgaWYgKHByb3BlcnR5Lm5hbWUgPT0gcHJvcGVydHlOYW1lKSB7XG4gICAgICAgICAgICByZXN1bHQgPSBwcm9wZXJ0eS52YWx1ZTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbk5vZGUucHJvdG90eXBlLmxhYmVsID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMudmFsdWUodGhpcy5ub2RlR3JvdXAubGFiZWxQcm9wZXJ0eU5hbWUpO1xufVxuXG5Ob2RlLnByb3RvdHlwZS5oZWFkaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJlc3VsdCA9IFwiXCI7XG4gICAgJC5lYWNoKHRoaXMucHJvcGVydGllcywgZnVuY3Rpb24oaSwgcHJvcGVydHkpIHtcbiAgICAgICAgaWYgKHByb3BlcnR5LmlzSGVhZGluZykge1xuICAgICAgICAgICAgcmVzdWx0ID0gcHJvcGVydHkudmFsdWU7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmIChyZXN1bHQgIT0gXCJcIilcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcblxuICAgIHJldHVybiB0aGlzLmxhYmVsKCk7XG59XG5cbmZ1bmN0aW9uIE5vZGVQcm9wZXJ0eShuYW1lLCB2YWx1ZSkge1xuICAgIHRoaXMubmFtZSA9IG5hbWUucmVwbGFjZShcIipcIiwgXCJcIikucmVwbGFjZShcIiNcIiwgXCJcIik7XG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgIHRoaXMuaXNIZWFkaW5nID0gKG5hbWUuc2xpY2UoMCwgMSkgPT0gXCIqXCIpO1xuICAgIHRoaXMuaXNIaWRkZW4gPSAobmFtZS5zbGljZSgwLCAxKSA9PSBcIiNcIik7XG4gICAgcmV0dXJuIHRoaXM7XG59XG5cbmZ1bmN0aW9uIFJlZih0YXJnZXROb2RlLCBsYWJlbCwgdG9UYXJnZXQsIHRvU291cmNlKSB7XG4gICAgdGhpcy50YXJnZXROb2RlID0gdGFyZ2V0Tm9kZTtcbiAgICB0aGlzLmxhYmVsID0gbGFiZWw7XG4gICAgdGhpcy50b1RhcmdldCA9IHRvVGFyZ2V0O1xuICAgIHRoaXMudG9Tb3VyY2UgPSB0b1NvdXJjZTtcbiAgICByZXR1cm4gdGhpcztcbn1cblxuZnVuY3Rpb24gU2V0dGluZ3MoKSB7XG4gICAgcmV0dXJuIHRoaXM7XG59XG5cblNldHRpbmdzLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihrZXksIGRlZmF1bHRWYWx1ZSkge1xuICAgIHZhciBwYXJ0cyA9IGtleS5zcGxpdChcIi5cIik7XG4gICAgaWYgKHBhcnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgaWYgKHRoaXNbcGFydHNbMF1dID09IG51bGwpXG4gICAgICAgICAgICByZXR1cm4gZGVmYXVsdFZhbHVlO1xuXG4gICAgICAgIHJldHVybiB0aGlzW3BhcnRzWzBdXS5nZXQocGFydHMuc3BsaWNlKDEsIHBhcnRzLmxlbmd0aCAtIDEpLmpvaW4oXCIuXCIpLCBkZWZhdWx0VmFsdWUpO1xuICAgIH1cblxuICAgIGlmICh0aGlzW2tleV0gPT0gbnVsbClcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcblxuICAgIHJldHVybiB0aGlzW2tleV07XG59IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzcHJlYWRzaGVldEtleSwgb25Mb2FkZWQpIHtcbiAgICAvLyBHZXQgc2hlZXQgY291bnRcbiAgICBnZXRTcHJlYWRzaGVldEluZm8oc3ByZWFkc2hlZXRLZXksIGZ1bmN0aW9uIG9uU3VjY2VzcyhpbmZvKSB7XG4gICAgICAgIC8vIExvYWQgYWxsIHNoZWV0c1xuICAgICAgICBsb2FkU2hlZXRzKHNwcmVhZHNoZWV0S2V5LCBpbmZvKTtcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIGxvYWRTaGVldHMoc3ByZWFkc2hlZXRLZXksIGluZm8pIHtcbiAgICAgICAgdmFyIHNwcmVhZHNoZWV0ID0gbmV3IFNwcmVhZHNoZWV0KHNwcmVhZHNoZWV0S2V5LCBpbmZvLnRpdGxlKTtcbiAgICAgICAgdmFyIGxvYWRlZFNoZWV0Q291bnQgPSAwO1xuICAgICAgICBmb3IgKGkgPSAxOyBpIDw9IGluZm8uc2hlZXRDb3VudDsgaSsrKSB7XG4gICAgICAgICAgICBsb2FkU2hlZXQoc3ByZWFkc2hlZXQsIHNwcmVhZHNoZWV0S2V5LCBpKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGxvYWRlZFNoZWV0Q291bnQgKz0gMTtcbiAgICAgICAgICAgICAgICBpZiAobG9hZGVkU2hlZXRDb3VudCA9PSBpbmZvLnNoZWV0Q291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgb25Mb2FkZWQoc3ByZWFkc2hlZXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsb2FkU2hlZXQoc3ByZWFkc2hlZXQsIHNwcmVhZHNoZWV0S2V5LCBzaGVldEluZGV4KSB7XG4gICAgICAgIHJldHVybiBnZXRTaGVldChzcHJlYWRzaGVldEtleSwgc2hlZXRJbmRleCwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHZhciBzaGVldCA9IHNwcmVhZHNoZWV0LnNoZWV0c1tyZXNwb25zZS5mZWVkLnRpdGxlLiR0XSA9IG5ldyBTaGVldCgpO1xuXG4gICAgICAgICAgICAkLmVhY2gocmVzcG9uc2UuZmVlZC5lbnRyeSwgZnVuY3Rpb24oaSwgZSkge1xuICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IGUuZ3MkY2VsbC5yb3cgLSAxO1xuICAgICAgICAgICAgICAgIGlmIChzaGVldC5yb3dzW2luZGV4XSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHNoZWV0LnJvd3NbaW5kZXhdID0gbmV3IFJvdyhpbmRleCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNoZWV0LnJvd3NbaW5kZXhdLnJvd0NlbGxzLnB1c2gobmV3IFJvd0NlbGwoZS5ncyRjZWxsLmNvbCAtIDEsIGUuY29udGVudC4kdCkpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIFNvcnQgcm93IGNlbGxzIGJ5IGNvbCBpbmRleFxuICAgICAgICAgICAgJC5lYWNoKHNoZWV0LnJvd3MsIGZ1bmN0aW9uKGksIHJvdykge1xuICAgICAgICAgICAgICAgIHJvdy5yb3dDZWxscy5zb3J0KGZ1bmN0aW9uKGMxLCBjMikgeyByZXR1cm4gYzEuY29sSW5kZXggLSBjMi5jb2xJbmRleDsgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0U2hlZXQoc3ByZWFkc2hlZXRLZXksIHNoZWV0SW5kZXgsIG9uU3VjY2Vzcykge1xuICAgICAgICByZXR1cm4gJC5hamF4KHtcbiAgICAgICAgICAgIHVybDogXCJodHRwczovL3NwcmVhZHNoZWV0cy5nb29nbGUuY29tL2ZlZWRzL2NlbGxzL1wiICsgc3ByZWFkc2hlZXRLZXkgKyBcIi9cIiArIHNoZWV0SW5kZXggKyBcIi9wdWJsaWMvdmFsdWVzP2FsdD1qc29uLWluLXNjcmlwdFwiLFxuICAgICAgICAgICAganNvbnA6IFwiY2FsbGJhY2tcIixcbiAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25wXCIsXG4gICAgICAgICAgICBzdWNjZXNzOiBvblN1Y2Nlc3NcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0U3ByZWFkc2hlZXRJbmZvKHNwcmVhZHNoZWV0S2V5LCBvblN1Y2Nlc3MpIHtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybDogXCJodHRwczovL3NwcmVhZHNoZWV0cy5nb29nbGUuY29tL2ZlZWRzL3dvcmtzaGVldHMvXCIgKyBzcHJlYWRzaGVldEtleSArIFwiL3B1YmxpYy9mdWxsP2FsdD1qc29uLWluLXNjcmlwdFwiLFxuICAgICAgICAgICAganNvbnA6IFwiY2FsbGJhY2tcIixcbiAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25wXCIsXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIHZhciBpbmZvID0ge1xuICAgICAgICAgICAgICAgICAgICBzaGVldENvdW50OiByZXNwb25zZS5mZWVkLmVudHJ5Lmxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IHJlc3BvbnNlLmZlZWQudGl0bGUuJHRcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIG9uU3VjY2VzcyhpbmZvKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBTcHJlYWRzaGVldChzcHJlYWRzaGVldEtleSwgdGl0bGUpIHtcbiAgICB0aGlzLmtleSA9IHNwcmVhZHNoZWV0S2V5O1xuICAgIHRoaXMudGl0bGUgPSB0aXRsZTtcbiAgICB0aGlzLnNoZWV0cyA9IG5ldyBTaGVldHMoKTtcblxuICAgIHJldHVybiB0aGlzO1xufVxuXG5mdW5jdGlvbiBTaGVldHMoKSB7XG4gICAgcmV0dXJuIHRoaXM7XG59XG5cbmZ1bmN0aW9uIFNoZWV0KCkge1xuICAgIHRoaXMucm93cyA9IFtdO1xuICAgIHJldHVybiB0aGlzO1xufVxuXG5TaGVldC5wcm90b3R5cGUuaGVhZGVyID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMucm93c1swXS52YWx1ZXMoKTtcbn1cblxuU2hlZXQucHJvdG90eXBlLnZhbHVlID0gZnVuY3Rpb24ocm93LCBjb2xOYW1lKSB7XG4gICAgdmFyIGNvbEluZGV4ID0gdGhpcy5oZWFkZXIoKS5pbmRleE9mKGNvbE5hbWUpO1xuICAgIGlmIChjb2xJbmRleCA9PSAtMSlcbiAgICAgICAgcmV0dXJuIG51bGw7XG5cbiAgICB2YXIgcmVzdWx0ID0gbnVsbDtcbiAgICAkLmVhY2gocm93LnJvd0NlbGxzLCBmdW5jdGlvbihpLCByb3dDZWxsKSB7XG4gICAgICAgIGlmIChyb3dDZWxsLmNvbEluZGV4ID09IGNvbEluZGV4KSB7XG4gICAgICAgICAgICByZXN1bHQgPSByb3dDZWxsLnZhbHVlO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBSb3cocm93SW5kZXgpIHtcbiAgICB0aGlzLnJvd0luZGV4ID0gcm93SW5kZXg7XG4gICAgdGhpcy5yb3dDZWxscyA9IFtdO1xuXG4gICAgcmV0dXJuIHRoaXM7XG59XG5cblJvdy5wcm90b3R5cGUudmFsdWVzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICQubWFwKHRoaXMucm93Q2VsbHMsIGZ1bmN0aW9uKHJvd0NlbGwsIGkpIHtcbiAgICAgICAgcmV0dXJuIHJvd0NlbGwudmFsdWU7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIFJvd0NlbGwoY29sSW5kZXgsIHZhbHVlKSB7XG4gICAgdGhpcy5jb2xJbmRleCA9IGNvbEluZGV4O1xuICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICByZXR1cm4gdGhpcztcbn0iXX0=
