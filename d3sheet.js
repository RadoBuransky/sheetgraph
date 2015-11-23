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
            .attr("height", "100%")
            .append("g")
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
            var force = forceModule(d3sheet.graph, d3sheet.svgContainerId, d3sheet.svg, info, spreadsheet.settings);

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

        node
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });

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
            nodeGroups.items.push(getNodes(spreadsheet.sheets[nodeGroupName], nodeGroupName));
        });

        // Create references from node sheets
        $.each(nodeGroups.items, function(i, nodeGroup) {
            createRefs(nodeGroups, spreadsheet.sheets[nodeGroup.name], nodeGroup);
        });

        // TODO: Create references from reference sheets

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

    function parseColumnRefName(colName, nodeGroups) {
        var refNames = colName.split(".");
        var nodeGroup = null;
        if (refNames.length > 0)
            nodeGroup = nodeGroups.getByName(refNames[0]);
        if ((refNames.length >= 2) &&
            (nodeGroup != null)) {
            var result = {
                nodeGroup: nodeGroup,
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

function Ref(targetNode, label) {
    this.targetNode = targetNode;
    this.label = label;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZDNzaGVldC5qcyIsInNyYy9mb3JjZS5qcyIsInNyYy9ncmFwaC5qcyIsInNyYy9pbmZvLmpzIiwic3JjL21vZGVsLmpzIiwic3JjL3NwcmVhZHNoZWV0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIiFmdW5jdGlvbigpIHtcclxuICAgIGNoZWNrUmVxdWlyZW1lbnRzKCk7XHJcblxyXG4gICAgdmFyIGQzc2hlZXQgPSB7XHJcbiAgICAgICAgdmVyOiBcIjEuMC4wXCIsXHJcbiAgICAgICAgc3ZnQ29udGFpbmVySWQ6IFwiXCIsXHJcbiAgICAgICAgaW5mb0NvbnRhaW5lcklkOiBcIlwiLFxyXG4gICAgICAgIHN2Zzoge30sXHJcbiAgICAgICAgc3ByZWFkc2hlZXQ6IHt9LFxyXG4gICAgICAgIG1vZGVsOiB7fVxyXG4gICAgfTtcclxuXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGQzc2hlZXQ7XHJcblxyXG4gICAgLyoqXHJcbiAgICAqIEluaXRpYWxpemUgRDMgc2hlZXQuXHJcbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb250YWluZXJJZCAtIGlkZW50aWZpZXIgb2YgdGhlIG1haW4gRElWLlxyXG4gICAgKiovXHJcbiAgICBkM3NoZWV0LmluaXQgPSBmdW5jdGlvbihzdmdDb250YWluZXJJZCwgaW5mb0NvbnRhaW5lcklkKSB7XHJcbiAgICAgICAgaWYgKHN2Z0NvbnRhaW5lcklkID09IG51bGwpXHJcbiAgICAgICAgICAgIHN2Z0NvbnRhaW5lcklkID0gXCJkM3NoZWV0LXN2Z1wiO1xyXG4gICAgICAgIGQzc2hlZXQuc3ZnQ29udGFpbmVySWQgPSBzdmdDb250YWluZXJJZDtcclxuXHJcbiAgICAgICAgaWYgKGluZm9Db250YWluZXJJZCA9PSBudWxsKVxyXG4gICAgICAgICAgICBpbmZvQ29udGFpbmVySWQgPSBcImQzc2hlZXQtaW5mb1wiO1xyXG4gICAgICAgIGQzc2hlZXQuaW5mb0NvbnRhaW5lcklkID0gaW5mb0NvbnRhaW5lcklkO1xyXG5cclxuICAgICAgICB2YXIgc3ZnQ29udGFpbmVyID0gJChcIiNcIiArIHN2Z0NvbnRhaW5lcklkKSxcclxuICAgICAgICAgICAgd2lkdGggPSBzdmdDb250YWluZXIud2lkdGgoKSxcclxuICAgICAgICAgICAgaGVpZ2h0ID0gc3ZnQ29udGFpbmVyLmhlaWdodCgpO1xyXG5cclxuICAgICAgICB2YXIgem9vbSA9IGQzLmJlaGF2aW9yLnpvb20oKVxyXG4gICAgICAgICAgICAub24oXCJ6b29tXCIsIHJlc2NhbGUpO1xyXG5cclxuICAgICAgICB2YXIgc3ZnID0gZDMuc2VsZWN0KFwiI1wiICsgc3ZnQ29udGFpbmVySWQpXHJcbiAgICAgICAgICAgIC5hcHBlbmQoXCJzdmdcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCBcIjEwMCVcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgXCIxMDAlXCIpXHJcbiAgICAgICAgICAgIC5hcHBlbmQoXCJnXCIpXHJcbiAgICAgICAgICAgIC5jYWxsKHpvb20pO1xyXG5cclxuICAgICAgICB2YXIgcmVjdCA9IHN2Zy5hcHBlbmQoXCJyZWN0XCIpXHJcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aClcclxuICAgICAgICAgICAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQpXHJcbiAgICAgICAgICAgICAgICAgICAgLnN0eWxlKFwiZmlsbFwiLCBcIm5vbmVcIilcclxuICAgICAgICAgICAgICAgICAgICAuc3R5bGUoXCJwb2ludGVyLWV2ZW50c1wiLCBcImFsbFwiKTtcclxuXHJcbiAgICAgICAgZDNzaGVldC5zdmcgPSBzdmcuYXBwZW5kKFwiZ1wiKTtcclxuXHJcbiAgICAgICAgZDMuc2VsZWN0KFwiI1wiICsgaW5mb0NvbnRhaW5lcklkKVxyXG4gICAgICAgICAgICAuYXBwZW5kKFwiZGl2XCIpO1xyXG5cclxuICAgICAgICByZXR1cm4gZDNzaGVldDtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiByZXNjYWxlKCkge1xyXG4gICAgICB2YXIgdHJhbnMgPSBkMy5ldmVudC50cmFuc2xhdGU7XHJcbiAgICAgIHZhciBzY2FsZSA9IGQzLmV2ZW50LnNjYWxlO1xyXG5cclxuICAgICAgZDNzaGVldC5zdmcuYXR0cihcInRyYW5zZm9ybVwiLFxyXG4gICAgICAgICAgXCJ0cmFuc2xhdGUoXCIgKyB0cmFucyArIFwiKVwiXHJcbiAgICAgICAgICArIFwiIHNjYWxlKFwiICsgc2NhbGUgKyBcIilcIik7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAqIExvYWQgZGF0YSBmcm9tIHNwcmVhZHNoZWV0LlxyXG4gICAgKiovXHJcbiAgICBkM3NoZWV0LmxvYWQgPSBmdW5jdGlvbihzcHJlYWRzaGVldEtleSkge1xyXG4gICAgICAgIC8vIExvYWQgc3ByZWFkc2hlZXRcclxuICAgICAgICB2YXIgc3ByZWFkc2hlZXQgPSByZXF1aXJlKFwiLi9zcHJlYWRzaGVldFwiKTtcclxuICAgICAgICBzcHJlYWRzaGVldChzcHJlYWRzaGVldEtleSwgZnVuY3Rpb24oc3ByZWFkc2hlZXQpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coc3ByZWFkc2hlZXQpO1xyXG5cclxuICAgICAgICAgICAgZDNzaGVldC5zcHJlYWRzaGVldCA9IHNwcmVhZHNoZWV0O1xyXG5cclxuICAgICAgICAgICAgLy8gSW5pdGlhbGl6ZSBkb2N1bWVudFxyXG4gICAgICAgICAgICBkb2N1bWVudC50aXRsZSA9IHNwcmVhZHNoZWV0LnRpdGxlO1xyXG5cclxuICAgICAgICAgICAgLy8gSW5pdGlhbGl6ZSBpbmZvIHNlY3Rpb25cclxuICAgICAgICAgICAgdmFyIGluZm9Nb2R1bGUgPSByZXF1aXJlKFwiLi9pbmZvXCIpO1xyXG4gICAgICAgICAgICB2YXIgaW5mbyA9IGluZm9Nb2R1bGUoZDNzaGVldC5pbmZvQ29udGFpbmVySWQsIHNwcmVhZHNoZWV0LnRpdGxlKTtcclxuXHJcbiAgICAgICAgICAgIC8vIENyZWF0ZSBtb2RlbCBmcm9tIHNwcmVhZHNoZWV0XHJcbiAgICAgICAgICAgIHZhciBtb2RlbE1vZHVsZSA9IHJlcXVpcmUoXCIuL21vZGVsXCIpO1xyXG4gICAgICAgICAgICBkM3NoZWV0Lm1vZGVsID0gbW9kZWxNb2R1bGUoZDNzaGVldC5zcHJlYWRzaGVldCk7XHJcblxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhkM3NoZWV0Lm1vZGVsKTtcclxuXHJcbiAgICAgICAgICAgIC8vIENyZWF0ZSBncmFwaCBmcm9tIG1vZGVsXHJcbiAgICAgICAgICAgIHZhciBncmFwaE1vZHVsZSA9IHJlcXVpcmUoXCIuL2dyYXBoXCIpO1xyXG4gICAgICAgICAgICBkM3NoZWV0LmdyYXBoID0gZ3JhcGhNb2R1bGUoZDNzaGVldC5tb2RlbCk7XHJcblxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhkM3NoZWV0LmdyYXBoKTtcclxuXHJcbiAgICAgICAgICAgIC8vIENyZWF0ZSBEMyBmb3JjZSBsYXlvdXQgZnJvbSBncmFwaFxyXG4gICAgICAgICAgICB2YXIgZm9yY2VNb2R1bGUgPSByZXF1aXJlKFwiLi9mb3JjZVwiKTtcclxuICAgICAgICAgICAgdmFyIGZvcmNlID0gZm9yY2VNb2R1bGUoZDNzaGVldC5ncmFwaCwgZDNzaGVldC5zdmdDb250YWluZXJJZCwgZDNzaGVldC5zdmcsIGluZm8sIHNwcmVhZHNoZWV0LnNldHRpbmdzKTtcclxuXHJcbiAgICAgICAgICAgIC8vIEluaXRpYWxpemUgdmlldyBvcHRpb25zXHJcbi8vICAgICAgICAgICAgdmFyIHZpZXdNb2R1bGUgPSByZXF1aXJlKFwiLi92aWV3XCIpO1xyXG4vLyAgICAgICAgICAgIHZpZXdNb2R1bGUoZDNzaGVldC5tb2RlbCwgdXBkYXRlR3JhcGgpO1xyXG4vL1xyXG4vLyAgICAgICAgICAgIGZ1bmN0aW9uIHVwZGF0ZUdyYXBoKHZpZXdPcHRpb25zKSB7XHJcbi8vICAgICAgICAgICAgICAgIC8vIFRPRE86IHVwZGF0ZSBkM3NoZWV0LmdyYXBoIGFuZCBmb3JjZS5yZXN0YXJ0KClcclxuLy8gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBBcHBseSBDU1Mgc3R5bGVcclxuICAgICAgICAgICAgYXBwbHlDc3MoZDNzaGVldC5tb2RlbC5zZXR0aW5ncy5jc3MpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGFwcGx5Q3NzKGNzcykge1xyXG4gICAgICAgIGlmIChjc3MgPT0gbnVsbClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICAvLyBHZXQgYWxsIGVsZW1lbnQgc2VsZWN0b3JzXHJcbiAgICAgICAgdmFyIHNlbGVjdG9ycyA9IE9iamVjdC5rZXlzKGNzcyk7XHJcbiAgICAgICAgJC5lYWNoKHNlbGVjdG9ycywgZnVuY3Rpb24oaSwgc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgdmFyIGVsZW1lbnRzID0ge307XHJcbiAgICAgICAgICAgIGlmIChzZWxlY3Rvci5zbGljZSgwLCAxKSA9PSBcIiNcIilcclxuICAgICAgICAgICAgICAgIC8vIEl0IGlzIGFuIGlkZW50aWZpZXJcclxuICAgICAgICAgICAgICAgIGVsZW1lbnRzID0gJChzZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIC8vIElzIGlzIGEgY2xhc3NcclxuICAgICAgICAgICAgICAgIGVsZW1lbnRzID0gJChcIi5cIiArIHNlbGVjdG9yKTtcclxuXHJcbiAgICAgICAgICAgIC8vIEdldCBhbGwgc3R5bGUgcHJvcGVydGllc1xyXG4gICAgICAgICAgICB2YXIgcHJvcGVydGllcyA9IE9iamVjdC5rZXlzKGNzc1tzZWxlY3Rvcl0pO1xyXG4gICAgICAgICAgICAkLmVhY2gocHJvcGVydGllcywgZnVuY3Rpb24oaiwgcHJvcGVydHkpIHtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnRzLmNzcyhwcm9wZXJ0eSwgY3NzW3NlbGVjdG9yXVtwcm9wZXJ0eV0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBjaGVja1JlcXVpcmVtZW50cygpIHtcclxuICAgICAgICBpZiAodHlwZW9mIGQzID09PSBcInVuZGVmaW5lZFwiKVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJEMyBsaWJyYXJ5IG5vdCBmb3VuZCFcIik7XHJcbiAgICAgICAgaWYgKHR5cGVvZiAkID09PSBcInVuZGVmaW5lZFwiKVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJqUXVlcnkgbm90IGZvdW5kIVwiKTtcclxuICAgIH1cclxufSgpOyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZ3JhcGgsIHN2Z0NvbnRhaW5lcklkLCBzdmcsIGluZm8pIHtcclxuICAgIHZhciBub2RlID0gW10sXHJcbiAgICAgICAgbm9kZUxhYmVsID0gW10sXHJcbiAgICAgICAgbGluayA9IFtdLFxyXG4gICAgICAgIGxpbmtMYWJlbCA9IFtdLFxyXG4gICAgICAgIGNvbG9ycyA9IGQzLnNjYWxlLmNhdGVnb3J5MjAoKTtcclxuXHJcbiAgICB2YXIgc3ZnQ29udGFpbmVyID0gJChcIiNcIiArIHN2Z0NvbnRhaW5lcklkKSxcclxuICAgICAgICB3aWR0aCA9IHN2Z0NvbnRhaW5lci53aWR0aCgpLFxyXG4gICAgICAgIGhlaWdodCA9IHN2Z0NvbnRhaW5lci5oZWlnaHQoKTtcclxuXHJcbiAgICBzZWxlY3RBbGwoKTtcclxuXHJcbiAgICB2YXIgZm9yY2UgPSBkMy5sYXlvdXQuZm9yY2UoKVxyXG4gICAgICAgIC5zaXplKFt3aWR0aCwgaGVpZ2h0XSlcclxuICAgICAgICAubGlua0Rpc3RhbmNlKDE3MCkgLy8gVE9ETzogTW92ZSB0byBzZXR0aW5nc1xyXG4gICAgICAgIC5jaGFyZ2UoLTUwMDApIC8vIFRPRE86IE1vdmUgdG8gc2V0dGluZ3NcclxuICAgICAgICAuZ3Jhdml0eSgwLjMpIC8vIFRPRE86IE1vdmUgdG8gc2V0dGluZ3NcclxuICAgICAgICAubm9kZXMoZ3JhcGgubm9kZXMpXHJcbiAgICAgICAgLmxpbmtzKGdyYXBoLmxpbmtzKVxyXG4gICAgICAgIC5vbihcInRpY2tcIiwgb25UaWNrKTtcclxuXHJcbiAgICB2YXIgZHJhZyA9IGZvcmNlLmRyYWcoKVxyXG4gICAgICAgIC5vcmlnaW4oZnVuY3Rpb24oZCkgeyByZXR1cm4gZDsgfSlcclxuICAgICAgICAub24oXCJkcmFnc3RhcnRcIiwgZHJhZ3N0YXJ0ZWQpXHJcbiAgICAgICAgLm9uKFwiZHJhZ1wiLCBkcmFnZ2VkKVxyXG4gICAgICAgIC5vbihcImRyYWdlbmRcIiwgZHJhZ2VuZGVkKTtcclxuXHJcbiAgICB0aGlzLnJlc3RhcnQgPSByZXN0YXJ0XHJcbiAgICByZXN0YXJ0KCk7XHJcblxyXG4gICAgZnVuY3Rpb24gZHJhZ3N0YXJ0ZWQoZCkge1xyXG4gICAgICAgZDMuZXZlbnQuc291cmNlRXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICBkMy5zZWxlY3QodGhpcykuY2xhc3NlZChcImRyYWdnaW5nXCIsIHRydWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGRyYWdnZWQoZCkge1xyXG4gICAgICAgZDMuc2VsZWN0KHRoaXMpLmF0dHIoXCJjeFwiLCBkLnggPSBkMy5ldmVudC54KS5hdHRyKFwiY3lcIiwgZC55ID0gZDMuZXZlbnQueSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZHJhZ2VuZGVkKGQpIHtcclxuICAgICAgIGQzLnNlbGVjdCh0aGlzKS5jbGFzc2VkKFwiZHJhZ2dpbmdcIiwgZmFsc2UpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHJlc3RhcnQoKSB7XHJcbiAgICAgICAgc3ZnLnNlbGVjdEFsbChcIi5saW5rXCIpXHJcbiAgICAgICAgICAgIC5kYXRhKGdyYXBoLmxpbmtzKVxyXG4gICAgICAgICAgICAuZW50ZXIoKVxyXG4gICAgICAgICAgICAuYXBwZW5kKFwibGluZVwiKVxyXG4gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibGlua1wiKTtcclxuXHJcbiAgICAgICAgc3ZnLnNlbGVjdEFsbChcIi5saW5rLWxhYmVsXCIpXHJcbiAgICAgICAgICAgIC5kYXRhKGdyYXBoLmxpbmtzKVxyXG4gICAgICAgICAgICAuZW50ZXIoKVxyXG4gICAgICAgICAgICAuYXBwZW5kKFwidGV4dFwiKVxyXG4gICAgICAgICAgICAudGV4dChmdW5jdGlvbihncmFwaExpbmspIHsgcmV0dXJuIGdyYXBoTGluay5sYWJlbDsgfSlcclxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImxpbmstbGFiZWxcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKTtcclxuXHJcbiAgICAgICAgc3ZnLnNlbGVjdEFsbChcIi5ub2RlXCIpXHJcbiAgICAgICAgICAgIC5kYXRhKGdyYXBoLm5vZGVzKVxyXG4gICAgICAgICAgICAuZW50ZXIoKVxyXG4gICAgICAgICAgICAuYXBwZW5kKFwiY2lyY2xlXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJub2RlXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwiclwiLCAzMCkgLy8gVE9ETzogU2V0dGluZ3NcclxuICAgICAgICAgICAgLmF0dHIoXCJjeFwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLng7IH0pXHJcbiAgICAgICAgICAgIC5hdHRyKFwiY3lcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC55OyB9KVxyXG4gICAgICAgICAgICAuYXR0cihcImZpbGxcIiwgbm9kZUZpbGxDb2xvcilcclxuICAgICAgICAgICAgLmNhbGwoZm9yY2UuZHJhZylcclxuICAgICAgICAgICAgLm9uKFwiY2xpY2tcIiwgbm9kZUNsaWNrKTtcclxuXHJcbiAgICAgICAgc3ZnLnNlbGVjdEFsbChcIi5ub2RlLWxhYmVsXCIpXHJcbiAgICAgICAgICAgIC5kYXRhKGdyYXBoLm5vZGVzKVxyXG4gICAgICAgICAgICAuZW50ZXIoKVxyXG4gICAgICAgICAgICAuYXBwZW5kKFwidGV4dFwiKVxyXG4gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibm9kZS1sYWJlbFwiKVxyXG4gICAgICAgICAgICAuYXR0cihcImR5XCIsIFwiLjM1ZW1cIilcclxuICAgICAgICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxyXG4gICAgICAgICAgICAudGV4dChmdW5jdGlvbihncmFwaE5vZGUpIHsgcmV0dXJuIGdyYXBoTm9kZS5ub2RlLmxhYmVsKCk7IH0pXHJcbiAgICAgICAgICAgIC5jYWxsKGZvcmNlLmRyYWcpXHJcbiAgICAgICAgICAgIC5vbihcImNsaWNrXCIsIG5vZGVDbGljayk7XHJcblxyXG4gICAgICAgIHNlbGVjdEFsbCgpO1xyXG4gICAgICAgIGZvcmNlLnN0YXJ0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbm9kZUNsaWNrKGdyYXBoTm9kZSkge1xyXG4gICAgICAgIGluZm8uc2hvd05vZGUoZ3JhcGhOb2RlLm5vZGUsIG5vZGVGaWxsQ29sb3IoZ3JhcGhOb2RlKSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbm9kZUZpbGxDb2xvcihncmFwaE5vZGUpIHtcclxuICAgICAgICByZXR1cm4gY29sb3JzKGdyYXBoTm9kZS5ub2RlLm5vZGVHcm91cC5uYW1lKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBzZWxlY3RBbGwoKSB7XHJcbiAgICAgICAgbm9kZSA9IHN2Zy5zZWxlY3RBbGwoXCIubm9kZVwiKTtcclxuICAgICAgICBub2RlTGFiZWwgPSBzdmcuc2VsZWN0QWxsKFwiLm5vZGUtbGFiZWxcIik7XHJcbiAgICAgICAgbGluayA9IHN2Zy5zZWxlY3RBbGwoXCIubGlua1wiKTtcclxuICAgICAgICBsaW5rTGFiZWwgPSBzdmcuc2VsZWN0QWxsKFwiLmxpbmstbGFiZWxcIik7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gb25UaWNrKCkge1xyXG4gICAgICAgIGxpbmsuYXR0cihcIngxXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuc291cmNlLng7IH0pXHJcbiAgICAgICAgICAgIC5hdHRyKFwieTFcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5zb3VyY2UueTsgfSlcclxuICAgICAgICAgICAgLmF0dHIoXCJ4MlwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnRhcmdldC54OyB9KVxyXG4gICAgICAgICAgICAuYXR0cihcInkyXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGFyZ2V0Lnk7IH0pO1xyXG5cclxuICAgICAgICBsaW5rTGFiZWxcclxuICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uKGQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAoZC5zb3VyY2UueCArIGQudGFyZ2V0LngpLzI7IH0pXHJcbiAgICAgICAgICAgIC5hdHRyKFwieVwiLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gKGQuc291cmNlLnkgKyBkLnRhcmdldC55KS8yOyB9KTtcclxuXHJcbiAgICAgICAgbm9kZVxyXG4gICAgICAgICAgICAuYXR0cihcImN4XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueDsgfSlcclxuICAgICAgICAgICAgLmF0dHIoXCJjeVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnk7IH0pO1xyXG5cclxuICAgICAgICBub2RlTGFiZWxcclxuICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueDsgfSlcclxuICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueTsgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG1vZGVsKSB7XHJcbiAgICB2YXIgZ3JhcGggPSBuZXcgR3JhcGgoKTtcclxuXHJcbiAgICAvLyBGb3IgYWxsIHNoZWV0c1xyXG4gICAgJC5lYWNoKG1vZGVsLm5vZGVHcm91cHMuaXRlbXMsIGZ1bmN0aW9uKGksIG5vZGVHcm91cCkge1xyXG4gICAgICAgIC8vIEZvciBhbGwgbm9kZXNcclxuICAgICAgICAkLmVhY2gobm9kZUdyb3VwLm5vZGVzLCBmdW5jdGlvbihqLCBub2RlKSB7XHJcbiAgICAgICAgICAgIC8vIEFkZCBub2RlIHRvIGdyYXBoXHJcbiAgICAgICAgICAgIHZhciBncmFwaE5vZGUgPSBuZXcgR3JhcGhOb2RlKG5vZGUpO1xyXG4gICAgICAgICAgICBncmFwaC5ub2Rlcy5wdXNoKGdyYXBoTm9kZSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBDcmVhdGUgbGlua3NcclxuICAgICQuZWFjaChncmFwaC5ub2RlcywgZnVuY3Rpb24oaSwgZ3JhcGhOb2RlKSB7XHJcbiAgICAgICAgJC5lYWNoKGdyYXBoTm9kZS5ub2RlLnJlZnMsIGZ1bmN0aW9uKGosIHJlZikge1xyXG4gICAgICAgICAgICBncmFwaC5saW5rcy5wdXNoKG5ldyBHcmFwaExpbmsoZ3JhcGhOb2RlLCBnZXRHcmFwaE5vZGUocmVmLnRhcmdldE5vZGUpLCByZWYubGFiZWwpKTtcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIGZ1bmN0aW9uIGdldEdyYXBoTm9kZShub2RlKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IG51bGw7XHJcbiAgICAgICAgJC5lYWNoKGdyYXBoLm5vZGVzLCBmdW5jdGlvbihpLCBncmFwaE5vZGUpIHtcclxuICAgICAgICAgICAgaWYgKGdyYXBoTm9kZS5ub2RlID09IG5vZGUpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGdyYXBoTm9kZTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGdyYXBoO1xyXG59XHJcblxyXG5mdW5jdGlvbiBHcmFwaCgpIHtcclxuICAgIHRoaXMubm9kZXMgPSBbXTtcclxuICAgIHRoaXMubGlua3MgPSBbXTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59XHJcblxyXG5mdW5jdGlvbiBHcmFwaE5vZGUobm9kZSkge1xyXG4gICAgdGhpcy5ub2RlID0gbm9kZTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59XHJcblxyXG5mdW5jdGlvbiBHcmFwaExpbmsoc291cmNlLCB0YXJnZXQsIGxhYmVsKSB7XHJcbiAgICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcclxuICAgIHRoaXMudGFyZ2V0ID0gdGFyZ2V0O1xyXG4gICAgdGhpcy5sYWJlbCA9IGxhYmVsO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGluZm9Db250YWluZXJJZCwgdGl0bGUpIHtcclxuICAgIC8vIFNldCBoZWFkaW5nXHJcbiAgICAkKFwiI1wiICsgaW5mb0NvbnRhaW5lcklkICsgXCIgaDFcIikudGV4dCh0aXRsZSk7XHJcblxyXG4gICAgdGhpcy5zaG93Tm9kZSA9IGZ1bmN0aW9uKG5vZGUsIGZpbGxDb2xvcikge1xyXG4gICAgICAgICQoXCIjZDNzaGVldC1ub2RlLWluZm8gaDJcIikudGV4dChub2RlLmhlYWRpbmcoKSk7XHJcbiAgICAgICAgJChcIiNkM3NoZWV0LW5vZGUtaW5mbyBoZWFkZXJcIikuY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiLCBmaWxsQ29sb3IpO1xyXG4gICAgICAgICQoXCIjZDNzaGVldC1ub2RlLXNoZWV0LW5hbWVcIikudGV4dChub2RlLm5vZGVHcm91cC5uYW1lKTtcclxuXHJcbiAgICAgICAgdmFyIHVsID0gJChcIiNkM3NoZWV0LW5vZGUtcHJvcGVydGllc1wiKTtcclxuICAgICAgICB1bC5lbXB0eSgpO1xyXG5cclxuICAgICAgICAvLyBTaG93IG5vZGUgcHJvcGVydGllc1xyXG4gICAgICAgICQuZWFjaChub2RlLnByb3BlcnRpZXMsIGZ1bmN0aW9uKGksIG5vZGVQcm9wZXJ0eSkge1xyXG4gICAgICAgICAgICBpZiAoIW5vZGVQcm9wZXJ0eS5pc0hpZGRlbilcclxuICAgICAgICAgICAgICAgIGFkZFByb3BlcnR5KG5vZGVQcm9wZXJ0eS5uYW1lLCBub2RlUHJvcGVydHkudmFsdWUpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBHcm91cCBub2RlIGxpbmtzXHJcbiAgICAgICAgdmFyIGdyb3VwZWRMaW5rcyA9IHt9O1xyXG4gICAgICAgICQuZWFjaChub2RlLnJlZnMsIGZ1bmN0aW9uKGksIHJlZikge1xyXG4gICAgICAgICAgICB2YXIgbGlua05hbWUgPSByZWYubGFiZWw7XHJcbiAgICAgICAgICAgIGlmIChsaW5rTmFtZSA9PSBudWxsKVxyXG4gICAgICAgICAgICAgICAgbGlua05hbWUgPSByZWYudGFyZ2V0Tm9kZS5ub2RlR3JvdXAubmFtZTtcclxuXHJcbiAgICAgICAgICAgIGlmIChncm91cGVkTGlua3NbbGlua05hbWVdID09IG51bGwpXHJcbiAgICAgICAgICAgICAgICBncm91cGVkTGlua3NbbGlua05hbWVdID0gW107XHJcblxyXG4gICAgICAgICAgICBncm91cGVkTGlua3NbbGlua05hbWVdLnB1c2gocmVmLnRhcmdldE5vZGUubGFiZWwoKSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIFNob3cgbm9kZSBsaW5rc1xyXG4gICAgICAgIHZhciBsaW5rTmFtZXMgPSBPYmplY3Qua2V5cyhncm91cGVkTGlua3MpO1xyXG4gICAgICAgICQuZWFjaChsaW5rTmFtZXMsIGZ1bmN0aW9uKGksIGxpbmtOYW1lKSB7XHJcbiAgICAgICAgICAgIGFkZFByb3BlcnR5KGxpbmtOYW1lLCBncm91cGVkTGlua3NbbGlua05hbWVdLmpvaW4oXCIsIFwiKSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGFkZFByb3BlcnR5KG5hbWUsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHVsLmFwcGVuZChcIjxsaT48c3BhbiBjbGFzcz1cXFwiZDNzaGVldC1ub2RlLXByb3BlcnR5LW5hbWVcXFwiPlwiICsgbmFtZSArXHJcbiAgICAgICAgICAgICAgICBcIjo8L3NwYW4+IDxzcGFuIGNsYXNzPVxcXCJkM3NoZWV0LW5vZGUtcHJvcGVydHktdmFsdWVcXFwiPlwiICsgZm9ybWF0VmFsdWUodmFsdWUpICsgXCI8L3NwYW4+PC9saT5cIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBmb3JtYXRWYWx1ZSh2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodmFsdWUuc2xpY2UoMCwgXCI0XCIpLnRvTG93ZXJDYXNlKCkgPT0gXCJodHRwXCIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXCI8YSBocmVmPVxcXCJcIiArIHZhbHVlICsgXCJcXFwiPlwiICsgdmFsdWUgKyBcIjwvYT5cIlxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxufSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc3ByZWFkc2hlZXQpIHtcclxuICAgIHZhciBtb2RlbCA9IG5ldyBNb2RlbCgpO1xyXG5cclxuICAgIHZhciBub2RlR3JvdXBUeXBlcyA9IGdldE5vZGVHcm91cFR5cGVzKHNwcmVhZHNoZWV0KTtcclxuICAgIG1vZGVsLm5vZGVHcm91cHMgPSBnZXROb2RlR3JvdXBzKHNwcmVhZHNoZWV0LCBub2RlR3JvdXBUeXBlcy5ub2RlR3JvdXBOYW1lcyk7XHJcbiAgICBpZiAobm9kZUdyb3VwVHlwZXMuc2V0dGluZ3NHcm91cE5hbWUgIT0gbnVsbClcclxuICAgICAgICBtb2RlbC5zZXR0aW5ncyA9IHNwcmVhZHNoZWV0LnNoZWV0c1tub2RlR3JvdXBUeXBlcy5zZXR0aW5nc0dyb3VwTmFtZV07XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0Tm9kZUdyb3VwcyhzcHJlYWRzaGVldCwgbm9kZUdyb3VwTmFtZXMpIHtcclxuICAgICAgICAvLyBDcmVhdGUgbm9kZXMgd2l0aCBwcm9wZXJ0aWVzXHJcbiAgICAgICAgdmFyIG5vZGVHcm91cHMgPSBuZXcgTm9kZUdyb3VwcygpO1xyXG4gICAgICAgICQuZWFjaChub2RlR3JvdXBOYW1lcywgZnVuY3Rpb24oaSwgbm9kZUdyb3VwTmFtZSkge1xyXG4gICAgICAgICAgICBub2RlR3JvdXBzLml0ZW1zLnB1c2goZ2V0Tm9kZXMoc3ByZWFkc2hlZXQuc2hlZXRzW25vZGVHcm91cE5hbWVdLCBub2RlR3JvdXBOYW1lKSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIENyZWF0ZSByZWZlcmVuY2VzIGZyb20gbm9kZSBzaGVldHNcclxuICAgICAgICAkLmVhY2gobm9kZUdyb3Vwcy5pdGVtcywgZnVuY3Rpb24oaSwgbm9kZUdyb3VwKSB7XHJcbiAgICAgICAgICAgIGNyZWF0ZVJlZnMobm9kZUdyb3Vwcywgc3ByZWFkc2hlZXQuc2hlZXRzW25vZGVHcm91cC5uYW1lXSwgbm9kZUdyb3VwKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gVE9ETzogQ3JlYXRlIHJlZmVyZW5jZXMgZnJvbSByZWZlcmVuY2Ugc2hlZXRzXHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZVJlZnMobm9kZUdyb3Vwcywgbm9kZVNoZWV0LCBub2RlR3JvdXApIHtcclxuICAgICAgICAgICAgdmFyIGNvbE5hbWVzID0gbm9kZVNoZWV0LmhlYWRlcigpO1xyXG5cclxuICAgICAgICAgICAgLy8gRm9yIGFsbCBzaGVldCByb3dzXHJcbiAgICAgICAgICAgICQuZWFjaChub2RlU2hlZXQucm93cywgZnVuY3Rpb24oaSwgcm93KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaSA9PSAwKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBGb3IgYWxsIHNoZWV0IGNvbHVtbnNcclxuICAgICAgICAgICAgICAgICQuZWFjaChjb2xOYW1lcywgZnVuY3Rpb24oaiwgY29sTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IG5vZGVTaGVldC52YWx1ZShyb3csIGNvbE5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHRoaXMgaXMgYSByZWZlcmVuY2UgY29sdW1uXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlZlRhcmdldCA9IHBhcnNlQ29sdW1uUmVmTmFtZShjb2xOYW1lLCBub2RlR3JvdXBzKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocmVmVGFyZ2V0ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRmluZCBpbmRleCBvZiB0aGUgdGFyZ2V0IG5vZGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKHJlZlRhcmdldC5ub2RlR3JvdXAubm9kZXMsIGZ1bmN0aW9uKGssIHRhcmdldE5vZGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHRhcmdldCBub2RlIHByb3BlcnR5IHZhbHVlIG1hdGNoZXNcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IFdlIHNob3VsZCBwcm9wZXJseSBzcGxpdCB2YWx1ZXMgdXNpbmcgY29tbWFcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZS5pbmRleE9mKHRhcmdldE5vZGUudmFsdWUocmVmVGFyZ2V0LnByb3BlcnR5TmFtZSkpID4gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlR3JvdXAubm9kZXNbaSAtIDFdLnJlZnMucHVzaChuZXcgUmVmKHRhcmdldE5vZGUsIHJlZlRhcmdldC5sYWJlbCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBnZXROb2Rlcyhub2RlU2hlZXQsIG5vZGVHcm91cE5hbWUpIHtcclxuICAgICAgICAgICAgdmFyIGhlYWRlciA9IG5vZGVTaGVldC5oZWFkZXIoKTtcclxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IG5ldyBOb2RlR3JvdXAobm9kZUdyb3VwTmFtZSwgaGVhZGVyWzBdKTtcclxuXHJcbiAgICAgICAgICAgIC8vIEdldCBub2RlcyBhbmQgcHJvcGVydGllc1xyXG4gICAgICAgICAgICAkLmVhY2gobm9kZVNoZWV0LnJvd3MsIGZ1bmN0aW9uKGksIHJvdykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGkgPT0gMClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICByZXN1bHQubm9kZXMucHVzaChuZXcgTm9kZShnZXROb2RlUHJvcGVydGllcyhyb3csIGhlYWRlciksIHJlc3VsdCkpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBnZXROb2RlUHJvcGVydGllcyhyb3csIGhlYWRlcikge1xyXG4gICAgICAgICAgICB2YXIgbm9kZVByb3BlcnRpZXMgPSBbXTtcclxuICAgICAgICAgICAgJC5lYWNoKHJvdy5yb3dDZWxscywgZnVuY3Rpb24oaSwgcm93Q2VsbCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNvbE5hbWUgPSBoZWFkZXJbcm93Q2VsbC5jb2xJbmRleF07XHJcbiAgICAgICAgICAgICAgICBpZiAoY29sTmFtZS5pbmRleE9mKFwiLlwiKSA9PSAtMSlcclxuICAgICAgICAgICAgICAgICAgICBub2RlUHJvcGVydGllcy5wdXNoKG5ldyBOb2RlUHJvcGVydHkoY29sTmFtZSwgcm93Q2VsbC52YWx1ZSkpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIG5vZGVQcm9wZXJ0aWVzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG5vZGVHcm91cHM7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0Tm9kZUdyb3VwVHlwZXMoc3ByZWFkc2hlZXQpIHtcclxuICAgICAgICB2YXIgbm9kZUdyb3VwVHlwZXMgPSB7XHJcbiAgICAgICAgICAgIG5vZGVHcm91cE5hbWVzOiBbXSxcclxuICAgICAgICAgICAgcmVmU2hlZXROYW1lczogW10sXHJcbiAgICAgICAgICAgIHNldHRpbmdzR3JvdXBOYW1lOiBudWxsXHJcbiAgICAgICAgfTtcclxuICAgICAgICB2YXIgc2hlZXROYW1lcyA9IE9iamVjdC5rZXlzKHNwcmVhZHNoZWV0LnNoZWV0cyk7XHJcbiAgICAgICAgJC5lYWNoKHNoZWV0TmFtZXMsIGZ1bmN0aW9uKGksIHNoZWV0TmFtZSkge1xyXG4gICAgICAgICAgICBpZiAoc2hlZXROYW1lID09IFwic2V0dGluZ3NcIikge1xyXG4gICAgICAgICAgICAgICAgbm9kZUdyb3VwVHlwZXMuc2V0dGluZ3NHcm91cE5hbWUgPSBzaGVldE5hbWU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChzaGVldE5hbWUuc2xpY2UoMCwgMSkgPT0gXCIjXCIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgICAgICB2YXIgcmVmU2hlZXQgPSBwYXJzZVJlZlNoZWV0TmFtZShzaGVldE5hbWUpXHJcbiAgICAgICAgICAgIGlmICgocmVmU2hlZXQgIT0gbnVsbCkgJiZcclxuICAgICAgICAgICAgICAgIChzaGVldE5hbWVzLmluZGV4T2YocmVmU2hlZXQuc291cmNlKSA+IC0xKSAmJlxyXG4gICAgICAgICAgICAgICAgKHNoZWV0TmFtZXMuaW5kZXhPZihyZWZTaGVldC50YXJnZXQpID4gLTEpKSB7XHJcbiAgICAgICAgICAgICAgICBub2RlR3JvdXBUeXBlcy5yZWZTaGVldE5hbWVzLnB1c2goc2hlZXROYW1lKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBub2RlR3JvdXBUeXBlcy5ub2RlR3JvdXBOYW1lcy5wdXNoKHNoZWV0TmFtZSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBub2RlR3JvdXBUeXBlcztcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBwYXJzZUNvbHVtblJlZk5hbWUoY29sTmFtZSwgbm9kZUdyb3Vwcykge1xyXG4gICAgICAgIHZhciByZWZOYW1lcyA9IGNvbE5hbWUuc3BsaXQoXCIuXCIpO1xyXG4gICAgICAgIHZhciBub2RlR3JvdXAgPSBudWxsO1xyXG4gICAgICAgIGlmIChyZWZOYW1lcy5sZW5ndGggPiAwKVxyXG4gICAgICAgICAgICBub2RlR3JvdXAgPSBub2RlR3JvdXBzLmdldEJ5TmFtZShyZWZOYW1lc1swXSk7XHJcbiAgICAgICAgaWYgKChyZWZOYW1lcy5sZW5ndGggPj0gMikgJiZcclxuICAgICAgICAgICAgKG5vZGVHcm91cCAhPSBudWxsKSkge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0ge1xyXG4gICAgICAgICAgICAgICAgbm9kZUdyb3VwOiBub2RlR3JvdXAsXHJcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eU5hbWU6IHJlZk5hbWVzWzFdXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChyZWZOYW1lcy5sZW5ndGggPT0gMylcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5sYWJlbCA9IHJlZk5hbWVzWzJdO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHBhcnNlUmVmU2hlZXROYW1lKHNoZWV0TmFtZSkge1xyXG4gICAgICAgIHZhciBub2RlTmFtZXMgPSBzaGVldE5hbWUuc3BsaXQoXCItXCIpO1xyXG4gICAgICAgIGlmIChub2RlTmFtZXMubGVuZ3RoID09IDIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHNvdXJjZTogbm9kZU5hbWVzWzBdLFxyXG4gICAgICAgICAgICAgICAgdGFyZ2V0OiBub2RlTmFtZXNbMV1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBtb2RlbDtcclxufVxyXG5cclxuZnVuY3Rpb24gTW9kZWwoKSB7XHJcbiAgICB0aGlzLm5vZGVHcm91cHMgPSBuZXcgTm9kZUdyb3VwcygpO1xyXG4gICAgdGhpcy5zZXR0aW5ncyA9IHt9O1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIE5vZGVHcm91cHMoKSB7XHJcbiAgICB0aGlzLml0ZW1zID0gW107XHJcbiAgICByZXR1cm4gdGhpcztcclxufVxyXG5cclxuTm9kZUdyb3Vwcy5wcm90b3R5cGUuZ2V0QnlOYW1lID0gZnVuY3Rpb24obm9kZUdyb3VwTmFtZSkge1xyXG4gICAgdmFyIHJlc3VsdCA9IG51bGw7XHJcbiAgICAkLmVhY2godGhpcy5pdGVtcywgZnVuY3Rpb24oaSwgbm9kZUdyb3VwKSB7XHJcbiAgICAgICAgaWYgKG5vZGVHcm91cC5uYW1lID09IG5vZGVHcm91cE5hbWUpIHtcclxuICAgICAgICAgICAgcmVzdWx0ID0gbm9kZUdyb3VwO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG5mdW5jdGlvbiBOb2RlR3JvdXAobmFtZSwgbGFiZWxQcm9wZXJ0eU5hbWUpIHtcclxuICAgIHRoaXMubmFtZSA9IG5hbWU7XHJcbiAgICB0aGlzLmxhYmVsUHJvcGVydHlOYW1lID0gbGFiZWxQcm9wZXJ0eU5hbWU7XHJcbiAgICB0aGlzLm5vZGVzID0gW107XHJcbiAgICByZXR1cm4gdGhpcztcclxufVxyXG5cclxuZnVuY3Rpb24gTm9kZShwcm9wZXJ0aWVzLCBub2RlR3JvdXApIHtcclxuICAgIHRoaXMucHJvcGVydGllcyA9IHByb3BlcnRpZXM7XHJcbiAgICB0aGlzLnJlZnMgPSBbXTtcclxuICAgIHRoaXMubm9kZUdyb3VwID0gbm9kZUdyb3VwO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn1cclxuXHJcbk5vZGUucHJvdG90eXBlLnZhbHVlID0gZnVuY3Rpb24ocHJvcGVydHlOYW1lKSB7XHJcbiAgICB2YXIgcmVzdWx0ID0gbnVsbDtcclxuICAgICQuZWFjaCh0aGlzLnByb3BlcnRpZXMsIGZ1bmN0aW9uKGksIHByb3BlcnR5KSB7XHJcbiAgICAgICAgaWYgKHByb3BlcnR5Lm5hbWUgPT0gcHJvcGVydHlOYW1lKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdCA9IHByb3BlcnR5LnZhbHVlO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG5Ob2RlLnByb3RvdHlwZS5sYWJlbCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMudmFsdWUodGhpcy5ub2RlR3JvdXAubGFiZWxQcm9wZXJ0eU5hbWUpO1xyXG59XHJcblxyXG5Ob2RlLnByb3RvdHlwZS5oZWFkaW5nID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgcmVzdWx0ID0gXCJcIjtcclxuICAgICQuZWFjaCh0aGlzLnByb3BlcnRpZXMsIGZ1bmN0aW9uKGksIHByb3BlcnR5KSB7XHJcbiAgICAgICAgaWYgKHByb3BlcnR5LmlzSGVhZGluZykge1xyXG4gICAgICAgICAgICByZXN1bHQgPSBwcm9wZXJ0eS52YWx1ZTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGlmIChyZXN1bHQgIT0gXCJcIilcclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG5cclxuICAgIHJldHVybiB0aGlzLmxhYmVsKCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIE5vZGVQcm9wZXJ0eShuYW1lLCB2YWx1ZSkge1xyXG4gICAgdGhpcy5uYW1lID0gbmFtZS5yZXBsYWNlKFwiKlwiLCBcIlwiKS5yZXBsYWNlKFwiI1wiLCBcIlwiKTtcclxuICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcclxuICAgIHRoaXMuaXNIZWFkaW5nID0gKG5hbWUuc2xpY2UoMCwgMSkgPT0gXCIqXCIpO1xyXG4gICAgdGhpcy5pc0hpZGRlbiA9IChuYW1lLnNsaWNlKDAsIDEpID09IFwiI1wiKTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59XHJcblxyXG5mdW5jdGlvbiBSZWYodGFyZ2V0Tm9kZSwgbGFiZWwpIHtcclxuICAgIHRoaXMudGFyZ2V0Tm9kZSA9IHRhcmdldE5vZGU7XHJcbiAgICB0aGlzLmxhYmVsID0gbGFiZWw7XHJcbiAgICByZXR1cm4gdGhpcztcclxufSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc3ByZWFkc2hlZXRLZXksIG9uTG9hZGVkKSB7XHJcbiAgICAvLyBHZXQgc2hlZXQgY291bnRcclxuICAgIGdldFNwcmVhZHNoZWV0SW5mbyhzcHJlYWRzaGVldEtleSwgZnVuY3Rpb24gb25TdWNjZXNzKGluZm8pIHtcclxuICAgICAgICAvLyBMb2FkIGFsbCBzaGVldHNcclxuICAgICAgICBsb2FkU2hlZXRzKHNwcmVhZHNoZWV0S2V5LCBpbmZvKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGZ1bmN0aW9uIGxvYWRTaGVldHMoc3ByZWFkc2hlZXRLZXksIGluZm8pIHtcclxuICAgICAgICB2YXIgc3ByZWFkc2hlZXQgPSBuZXcgU3ByZWFkc2hlZXQoc3ByZWFkc2hlZXRLZXksIGluZm8udGl0bGUpO1xyXG4gICAgICAgIHZhciBsb2FkZWRTaGVldENvdW50ID0gMDtcclxuICAgICAgICBmb3IgKGkgPSAxOyBpIDw9IGluZm8uc2hlZXRDb3VudDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxvYWRTaGVldChzcHJlYWRzaGVldCwgc3ByZWFkc2hlZXRLZXksIGkpLnRoZW4oZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICBsb2FkZWRTaGVldENvdW50ICs9IDE7XHJcbiAgICAgICAgICAgICAgICBpZiAobG9hZGVkU2hlZXRDb3VudCA9PSBpbmZvLnNoZWV0Q291bnQpIHtcclxuICAgICAgICAgICAgICAgICAgICBvbkxvYWRlZChzcHJlYWRzaGVldCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGxvYWRTaGVldChzcHJlYWRzaGVldCwgc3ByZWFkc2hlZXRLZXksIHNoZWV0SW5kZXgpIHtcclxuICAgICAgICByZXR1cm4gZ2V0U2hlZXQoc3ByZWFkc2hlZXRLZXksIHNoZWV0SW5kZXgsIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgICAgIHZhciBzaGVldCA9IHNwcmVhZHNoZWV0LnNoZWV0c1tyZXNwb25zZS5mZWVkLnRpdGxlLiR0XSA9IG5ldyBTaGVldCgpO1xyXG5cclxuICAgICAgICAgICAgJC5lYWNoKHJlc3BvbnNlLmZlZWQuZW50cnksIGZ1bmN0aW9uKGksIGUpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IGUuZ3MkY2VsbC5yb3cgLSAxO1xyXG4gICAgICAgICAgICAgICAgaWYgKHNoZWV0LnJvd3NbaW5kZXhdID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBzaGVldC5yb3dzW2luZGV4XSA9IG5ldyBSb3coaW5kZXgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgc2hlZXQucm93c1tpbmRleF0ucm93Q2VsbHMucHVzaChuZXcgUm93Q2VsbChlLmdzJGNlbGwuY29sIC0gMSwgZS5jb250ZW50LiR0KSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gU29ydCByb3cgY2VsbHMgYnkgY29sIGluZGV4XHJcbiAgICAgICAgICAgICQuZWFjaChzaGVldC5yb3dzLCBmdW5jdGlvbihpLCByb3cpIHtcclxuICAgICAgICAgICAgICAgIHJvdy5yb3dDZWxscy5zb3J0KGZ1bmN0aW9uKGMxLCBjMikgeyByZXR1cm4gYzEuY29sSW5kZXggLSBjMi5jb2xJbmRleDsgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuLy8gICAgZnVuY3Rpb24gbG9hZFNldHRpbmdzU2hlZXQoc2V0dGluZ3NTaGVldCwgc3ByZWFkc2hlZXQpIHtcclxuLy8gICAgICAgIC8vIE1hcCBjZWxscyB0byBsaXN0XHJcbi8vICAgICAgICB2YXIgc2V0dGluZ3NMaXN0ID0ge307XHJcbi8vICAgICAgICAkLmVhY2goc2V0dGluZ3NTaGVldC5mZWVkLmVudHJ5LCBmdW5jdGlvbihpLCBlKSB7XHJcbi8vICAgICAgICAgICAgaWYgKHNldHRpbmdzTGlzdFtlLmdzJGNlbGwucm93XSA9PSBudWxsKVxyXG4vLyAgICAgICAgICAgICAgICBzZXR0aW5nc0xpc3RbZS5ncyRjZWxsLnJvd10gPSB7fTtcclxuLy9cclxuLy8gICAgICAgICAgICBpZiAoZS5ncyRjZWxsLmNvbCA9PSAxKVxyXG4vLyAgICAgICAgICAgICAgICBzZXR0aW5nc0xpc3RbZS5ncyRjZWxsLnJvd10ua2V5ID0gZS5jb250ZW50LiR0O1xyXG4vLyAgICAgICAgICAgIGVsc2VcclxuLy8gICAgICAgICAgICAgICAgaWYgKGUuZ3MkY2VsbC5jb2wgPT0gMilcclxuLy8gICAgICAgICAgICAgICAgICAgIHNldHRpbmdzTGlzdFtlLmdzJGNlbGwucm93XS52YWx1ZSA9IGUuY29udGVudC4kdDtcclxuLy8gICAgICAgIH0pO1xyXG4vL1xyXG4vLyAgICAgICAgLy8gTWFwIGxpc3QgdG8gb2JqZWN0XHJcbi8vICAgICAgICAkLmVhY2goc2V0dGluZ3NMaXN0LCBmdW5jdGlvbihpLCBzKSB7XHJcbi8vICAgICAgICAgICAgaWYgKChzLmtleSA9PSBudWxsKSB8fCAocy52YWx1ZSA9PSBudWxsKSlcclxuLy8gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4vL1xyXG4vLyAgICAgICAgICAgIC8vIENyZWF0ZSBpbm5lciBvYmplY3RzXHJcbi8vICAgICAgICAgICAgdmFyIHBhdGggPSBzLmtleS5zcGxpdChcIi5cIik7XHJcbi8vICAgICAgICAgICAgdmFyIGN1cnJlbnQgPSBzcHJlYWRzaGVldC5zZXR0aW5ncztcclxuLy8gICAgICAgICAgICAkLmVhY2gocGF0aCwgZnVuY3Rpb24oaiwgaykge1xyXG4vLyAgICAgICAgICAgICAgICBpZiAoY3VycmVudFtrXSA9PSBudWxsKSB7XHJcbi8vICAgICAgICAgICAgICAgICAgICBpZiAoaiA9PSBwYXRoLmxlbmd0aCAtIDEpXHJcbi8vICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudFtrXSA9IHMudmFsdWU7XHJcbi8vICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbi8vICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudFtrXSA9IHt9O1xyXG4vLyAgICAgICAgICAgICAgICB9XHJcbi8vICAgICAgICAgICAgICAgIGN1cnJlbnQgPSBjdXJyZW50W2tdO1xyXG4vLyAgICAgICAgICAgIH0pO1xyXG4vLyAgICAgICAgfSk7XHJcbi8vICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZXRTaGVldChzcHJlYWRzaGVldEtleSwgc2hlZXRJbmRleCwgb25TdWNjZXNzKSB7XHJcbiAgICAgICAgcmV0dXJuICQuYWpheCh7XHJcbiAgICAgICAgICAgIHVybDogXCJodHRwczovL3NwcmVhZHNoZWV0cy5nb29nbGUuY29tL2ZlZWRzL2NlbGxzL1wiICsgc3ByZWFkc2hlZXRLZXkgKyBcIi9cIiArIHNoZWV0SW5kZXggKyBcIi9wdWJsaWMvdmFsdWVzP2FsdD1qc29uLWluLXNjcmlwdFwiLFxyXG4gICAgICAgICAgICBqc29ucDogXCJjYWxsYmFja1wiLFxyXG4gICAgICAgICAgICBkYXRhVHlwZTogXCJqc29ucFwiLFxyXG4gICAgICAgICAgICBzdWNjZXNzOiBvblN1Y2Nlc3NcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZXRTcHJlYWRzaGVldEluZm8oc3ByZWFkc2hlZXRLZXksIG9uU3VjY2Vzcykge1xyXG4gICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgIHVybDogXCJodHRwczovL3NwcmVhZHNoZWV0cy5nb29nbGUuY29tL2ZlZWRzL3dvcmtzaGVldHMvXCIgKyBzcHJlYWRzaGVldEtleSArIFwiL3B1YmxpYy9mdWxsP2FsdD1qc29uLWluLXNjcmlwdFwiLFxyXG4gICAgICAgICAgICBqc29ucDogXCJjYWxsYmFja1wiLFxyXG4gICAgICAgICAgICBkYXRhVHlwZTogXCJqc29ucFwiLFxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihyZXNwb25zZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGluZm8gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2hlZXRDb3VudDogcmVzcG9uc2UuZmVlZC5lbnRyeS5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IHJlc3BvbnNlLmZlZWQudGl0bGUuJHRcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICBvblN1Y2Nlc3MoaW5mbyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gU3ByZWFkc2hlZXQoc3ByZWFkc2hlZXRLZXksIHRpdGxlKSB7XHJcbiAgICB0aGlzLmtleSA9IHNwcmVhZHNoZWV0S2V5O1xyXG4gICAgdGhpcy50aXRsZSA9IHRpdGxlO1xyXG4gICAgdGhpcy5zaGVldHMgPSBuZXcgU2hlZXRzKCk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIFNoZWV0cygpIHtcclxuICAgIHJldHVybiB0aGlzO1xyXG59XHJcblxyXG5mdW5jdGlvbiBTaGVldCgpIHtcclxuICAgIHRoaXMucm93cyA9IFtdO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn1cclxuXHJcblNoZWV0LnByb3RvdHlwZS5oZWFkZXIgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLnJvd3NbMF0udmFsdWVzKCk7XHJcbn1cclxuXHJcblNoZWV0LnByb3RvdHlwZS52YWx1ZSA9IGZ1bmN0aW9uKHJvdywgY29sTmFtZSkge1xyXG4gICAgdmFyIGNvbEluZGV4ID0gdGhpcy5oZWFkZXIoKS5pbmRleE9mKGNvbE5hbWUpO1xyXG4gICAgaWYgKGNvbEluZGV4ID09IC0xKVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG5cclxuICAgIHZhciByZXN1bHQgPSBudWxsO1xyXG4gICAgJC5lYWNoKHJvdy5yb3dDZWxscywgZnVuY3Rpb24oaSwgcm93Q2VsbCkge1xyXG4gICAgICAgIGlmIChyb3dDZWxsLmNvbEluZGV4ID09IGNvbEluZGV4KSB7XHJcbiAgICAgICAgICAgIHJlc3VsdCA9IHJvd0NlbGwudmFsdWU7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG5mdW5jdGlvbiBSb3cocm93SW5kZXgpIHtcclxuICAgIHRoaXMucm93SW5kZXggPSByb3dJbmRleDtcclxuICAgIHRoaXMucm93Q2VsbHMgPSBbXTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxufVxyXG5cclxuUm93LnByb3RvdHlwZS52YWx1ZXMgPSBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiAkLm1hcCh0aGlzLnJvd0NlbGxzLCBmdW5jdGlvbihyb3dDZWxsLCBpKSB7XHJcbiAgICAgICAgcmV0dXJuIHJvd0NlbGwudmFsdWU7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gUm93Q2VsbChjb2xJbmRleCwgdmFsdWUpIHtcclxuICAgIHRoaXMuY29sSW5kZXggPSBjb2xJbmRleDtcclxuICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59Il19
