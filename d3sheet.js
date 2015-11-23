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
            .attr("viewBox", "0 0 " + width + " " + height)
            .call(d3.behavior.zoom().on("zoom", rescale))
            .on("dblclick.zoom", null)
            .attr("pointer-events", "all")
            .append("g")
            .attr("width", "100%")
            .attr("height", "100%");

        // Create info panel
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

    this.restart = restart
    restart();

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

function NodeProperty(name, value) {
    this.name = name;
    this.value = value;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZDNzaGVldC5qcyIsInNyYy9mb3JjZS5qcyIsInNyYy9ncmFwaC5qcyIsInNyYy9pbmZvLmpzIiwic3JjL21vZGVsLmpzIiwic3JjL3NwcmVhZHNoZWV0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOU1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIhZnVuY3Rpb24oKSB7XHJcbiAgICBjaGVja1JlcXVpcmVtZW50cygpO1xyXG5cclxuICAgIHZhciBkM3NoZWV0ID0ge1xyXG4gICAgICAgIHZlcjogXCIxLjAuMFwiLFxyXG4gICAgICAgIHN2Z0NvbnRhaW5lcklkOiBcIlwiLFxyXG4gICAgICAgIGluZm9Db250YWluZXJJZDogXCJcIixcclxuICAgICAgICBzdmc6IHt9LFxyXG4gICAgICAgIHNwcmVhZHNoZWV0OiB7fSxcclxuICAgICAgICBtb2RlbDoge31cclxuICAgIH07XHJcblxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBkM3NoZWV0O1xyXG5cclxuICAgIC8qKlxyXG4gICAgKiBJbml0aWFsaXplIEQzIHNoZWV0LlxyXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gY29udGFpbmVySWQgLSBpZGVudGlmaWVyIG9mIHRoZSBtYWluIERJVi5cclxuICAgICoqL1xyXG4gICAgZDNzaGVldC5pbml0ID0gZnVuY3Rpb24oc3ZnQ29udGFpbmVySWQsIGluZm9Db250YWluZXJJZCkge1xyXG4gICAgICAgIGlmIChzdmdDb250YWluZXJJZCA9PSBudWxsKVxyXG4gICAgICAgICAgICBzdmdDb250YWluZXJJZCA9IFwiZDNzaGVldC1zdmdcIjtcclxuICAgICAgICBkM3NoZWV0LnN2Z0NvbnRhaW5lcklkID0gc3ZnQ29udGFpbmVySWQ7XHJcblxyXG4gICAgICAgIGlmIChpbmZvQ29udGFpbmVySWQgPT0gbnVsbClcclxuICAgICAgICAgICAgaW5mb0NvbnRhaW5lcklkID0gXCJkM3NoZWV0LWluZm9cIjtcclxuICAgICAgICBkM3NoZWV0LmluZm9Db250YWluZXJJZCA9IGluZm9Db250YWluZXJJZDtcclxuXHJcbiAgICAgICAgdmFyIHN2Z0NvbnRhaW5lciA9ICQoXCIjXCIgKyBzdmdDb250YWluZXJJZCksXHJcbiAgICAgICAgICAgIHdpZHRoID0gc3ZnQ29udGFpbmVyLndpZHRoKCksXHJcbiAgICAgICAgICAgIGhlaWdodCA9IHN2Z0NvbnRhaW5lci5oZWlnaHQoKTtcclxuXHJcbiAgICAgICAgLy8gQ3JlYXRlIFNWRyBlbGVtZW50XHJcbiAgICAgICAgZDNzaGVldC5zdmcgPSBkMy5zZWxlY3QoXCIjXCIgKyBzdmdDb250YWluZXJJZClcclxuICAgICAgICAgICAgLmFwcGVuZChcInN2Z1wiKVxyXG4gICAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIFwiMTAwJVwiKVxyXG4gICAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCBcIjEwMCVcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJ2aWV3Qm94XCIsIFwiMCAwIFwiICsgd2lkdGggKyBcIiBcIiArIGhlaWdodClcclxuICAgICAgICAgICAgLmNhbGwoZDMuYmVoYXZpb3Iuem9vbSgpLm9uKFwiem9vbVwiLCByZXNjYWxlKSlcclxuICAgICAgICAgICAgLm9uKFwiZGJsY2xpY2suem9vbVwiLCBudWxsKVxyXG4gICAgICAgICAgICAuYXR0cihcInBvaW50ZXItZXZlbnRzXCIsIFwiYWxsXCIpXHJcbiAgICAgICAgICAgIC5hcHBlbmQoXCJnXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgXCIxMDAlXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIFwiMTAwJVwiKTtcclxuXHJcbiAgICAgICAgLy8gQ3JlYXRlIGluZm8gcGFuZWxcclxuICAgICAgICBkMy5zZWxlY3QoXCIjXCIgKyBpbmZvQ29udGFpbmVySWQpXHJcbiAgICAgICAgICAgIC5hcHBlbmQoXCJkaXZcIik7XHJcblxyXG4gICAgICAgIHJldHVybiBkM3NoZWV0O1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHJlc2NhbGUoKSB7XHJcbiAgICAgIHZhciB0cmFucyA9IGQzLmV2ZW50LnRyYW5zbGF0ZTtcclxuICAgICAgdmFyIHNjYWxlID0gZDMuZXZlbnQuc2NhbGU7XHJcblxyXG4gICAgICBkM3NoZWV0LnN2Zy5hdHRyKFwidHJhbnNmb3JtXCIsXHJcbiAgICAgICAgICBcInRyYW5zbGF0ZShcIiArIHRyYW5zICsgXCIpXCJcclxuICAgICAgICAgICsgXCIgc2NhbGUoXCIgKyBzY2FsZSArIFwiKVwiKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICogTG9hZCBkYXRhIGZyb20gc3ByZWFkc2hlZXQuXHJcbiAgICAqKi9cclxuICAgIGQzc2hlZXQubG9hZCA9IGZ1bmN0aW9uKHNwcmVhZHNoZWV0S2V5KSB7XHJcbiAgICAgICAgLy8gTG9hZCBzcHJlYWRzaGVldFxyXG4gICAgICAgIHZhciBzcHJlYWRzaGVldCA9IHJlcXVpcmUoXCIuL3NwcmVhZHNoZWV0XCIpO1xyXG4gICAgICAgIHNwcmVhZHNoZWV0KHNwcmVhZHNoZWV0S2V5LCBmdW5jdGlvbihzcHJlYWRzaGVldCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhzcHJlYWRzaGVldCk7XHJcblxyXG4gICAgICAgICAgICBkM3NoZWV0LnNwcmVhZHNoZWV0ID0gc3ByZWFkc2hlZXQ7XHJcblxyXG4gICAgICAgICAgICAvLyBJbml0aWFsaXplIGRvY3VtZW50XHJcbiAgICAgICAgICAgIGRvY3VtZW50LnRpdGxlID0gc3ByZWFkc2hlZXQudGl0bGU7XHJcblxyXG4gICAgICAgICAgICAvLyBJbml0aWFsaXplIGluZm8gc2VjdGlvblxyXG4gICAgICAgICAgICB2YXIgaW5mb01vZHVsZSA9IHJlcXVpcmUoXCIuL2luZm9cIik7XHJcbiAgICAgICAgICAgIHZhciBpbmZvID0gaW5mb01vZHVsZShkM3NoZWV0LmluZm9Db250YWluZXJJZCwgc3ByZWFkc2hlZXQudGl0bGUpO1xyXG5cclxuICAgICAgICAgICAgLy8gQ3JlYXRlIG1vZGVsIGZyb20gc3ByZWFkc2hlZXRcclxuICAgICAgICAgICAgdmFyIG1vZGVsTW9kdWxlID0gcmVxdWlyZShcIi4vbW9kZWxcIik7XHJcbiAgICAgICAgICAgIGQzc2hlZXQubW9kZWwgPSBtb2RlbE1vZHVsZShkM3NoZWV0LnNwcmVhZHNoZWV0KTtcclxuXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGQzc2hlZXQubW9kZWwpO1xyXG5cclxuICAgICAgICAgICAgLy8gQ3JlYXRlIGdyYXBoIGZyb20gbW9kZWxcclxuICAgICAgICAgICAgdmFyIGdyYXBoTW9kdWxlID0gcmVxdWlyZShcIi4vZ3JhcGhcIik7XHJcbiAgICAgICAgICAgIGQzc2hlZXQuZ3JhcGggPSBncmFwaE1vZHVsZShkM3NoZWV0Lm1vZGVsKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGQzc2hlZXQuZ3JhcGgpO1xyXG5cclxuICAgICAgICAgICAgLy8gQ3JlYXRlIEQzIGZvcmNlIGxheW91dCBmcm9tIGdyYXBoXHJcbiAgICAgICAgICAgIHZhciBmb3JjZU1vZHVsZSA9IHJlcXVpcmUoXCIuL2ZvcmNlXCIpO1xyXG4gICAgICAgICAgICB2YXIgZm9yY2UgPSBmb3JjZU1vZHVsZShkM3NoZWV0LmdyYXBoLCBkM3NoZWV0LnN2Z0NvbnRhaW5lcklkLCBkM3NoZWV0LnN2ZywgaW5mbywgc3ByZWFkc2hlZXQuc2V0dGluZ3MpO1xyXG5cclxuICAgICAgICAgICAgLy8gSW5pdGlhbGl6ZSB2aWV3IG9wdGlvbnNcclxuLy8gICAgICAgICAgICB2YXIgdmlld01vZHVsZSA9IHJlcXVpcmUoXCIuL3ZpZXdcIik7XHJcbi8vICAgICAgICAgICAgdmlld01vZHVsZShkM3NoZWV0Lm1vZGVsLCB1cGRhdGVHcmFwaCk7XHJcbi8vXHJcbi8vICAgICAgICAgICAgZnVuY3Rpb24gdXBkYXRlR3JhcGgodmlld09wdGlvbnMpIHtcclxuLy8gICAgICAgICAgICAgICAgLy8gVE9ETzogdXBkYXRlIGQzc2hlZXQuZ3JhcGggYW5kIGZvcmNlLnJlc3RhcnQoKVxyXG4vLyAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIEFwcGx5IENTUyBzdHlsZVxyXG4gICAgICAgICAgICBhcHBseUNzcyhkM3NoZWV0Lm1vZGVsLnNldHRpbmdzLmNzcyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gYXBwbHlDc3MoY3NzKSB7XHJcbiAgICAgICAgaWYgKGNzcyA9PSBudWxsKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIC8vIEdldCBhbGwgZWxlbWVudCBzZWxlY3RvcnNcclxuICAgICAgICB2YXIgc2VsZWN0b3JzID0gT2JqZWN0LmtleXMoY3NzKTtcclxuICAgICAgICAkLmVhY2goc2VsZWN0b3JzLCBmdW5jdGlvbihpLCBzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICB2YXIgZWxlbWVudHMgPSB7fTtcclxuICAgICAgICAgICAgaWYgKHNlbGVjdG9yLnNsaWNlKDAsIDEpID09IFwiI1wiKVxyXG4gICAgICAgICAgICAgICAgLy8gSXQgaXMgYW4gaWRlbnRpZmllclxyXG4gICAgICAgICAgICAgICAgZWxlbWVudHMgPSAkKHNlbGVjdG9yKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgLy8gSXMgaXMgYSBjbGFzc1xyXG4gICAgICAgICAgICAgICAgZWxlbWVudHMgPSAkKFwiLlwiICsgc2VsZWN0b3IpO1xyXG5cclxuICAgICAgICAgICAgLy8gR2V0IGFsbCBzdHlsZSBwcm9wZXJ0aWVzXHJcbiAgICAgICAgICAgIHZhciBwcm9wZXJ0aWVzID0gT2JqZWN0LmtleXMoY3NzW3NlbGVjdG9yXSk7XHJcbiAgICAgICAgICAgICQuZWFjaChwcm9wZXJ0aWVzLCBmdW5jdGlvbihqLCBwcm9wZXJ0eSkge1xyXG4gICAgICAgICAgICAgICAgZWxlbWVudHMuY3NzKHByb3BlcnR5LCBjc3Nbc2VsZWN0b3JdW3Byb3BlcnR5XSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGNoZWNrUmVxdWlyZW1lbnRzKCkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgZDMgPT09IFwidW5kZWZpbmVkXCIpXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkQzIGxpYnJhcnkgbm90IGZvdW5kIVwiKTtcclxuICAgICAgICBpZiAodHlwZW9mICQgPT09IFwidW5kZWZpbmVkXCIpXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImpRdWVyeSBub3QgZm91bmQhXCIpO1xyXG4gICAgfVxyXG59KCk7IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihncmFwaCwgc3ZnQ29udGFpbmVySWQsIHN2ZywgaW5mbykge1xyXG4gICAgdmFyIG5vZGUgPSBbXSxcclxuICAgICAgICBub2RlTGFiZWwgPSBbXSxcclxuICAgICAgICBsaW5rID0gW10sXHJcbiAgICAgICAgbGlua0xhYmVsID0gW10sXHJcbiAgICAgICAgY29sb3JzID0gZDMuc2NhbGUuY2F0ZWdvcnkyMCgpO1xyXG5cclxuICAgIHZhciBzdmdDb250YWluZXIgPSAkKFwiI1wiICsgc3ZnQ29udGFpbmVySWQpLFxyXG4gICAgICAgIHdpZHRoID0gc3ZnQ29udGFpbmVyLndpZHRoKCksXHJcbiAgICAgICAgaGVpZ2h0ID0gc3ZnQ29udGFpbmVyLmhlaWdodCgpO1xyXG5cclxuICAgIHNlbGVjdEFsbCgpO1xyXG5cclxuICAgIHZhciBmb3JjZSA9IGQzLmxheW91dC5mb3JjZSgpXHJcbiAgICAgICAgLnNpemUoW3dpZHRoLCBoZWlnaHRdKVxyXG4gICAgICAgIC5saW5rRGlzdGFuY2UoMTcwKSAvLyBUT0RPOiBNb3ZlIHRvIHNldHRpbmdzXHJcbiAgICAgICAgLmNoYXJnZSgtNTAwMCkgLy8gVE9ETzogTW92ZSB0byBzZXR0aW5nc1xyXG4gICAgICAgIC5ncmF2aXR5KDAuMykgLy8gVE9ETzogTW92ZSB0byBzZXR0aW5nc1xyXG4gICAgICAgIC5ub2RlcyhncmFwaC5ub2RlcylcclxuICAgICAgICAubGlua3MoZ3JhcGgubGlua3MpXHJcbiAgICAgICAgLm9uKFwidGlja1wiLCBvblRpY2spO1xyXG5cclxuICAgIHRoaXMucmVzdGFydCA9IHJlc3RhcnRcclxuICAgIHJlc3RhcnQoKTtcclxuXHJcbiAgICBmdW5jdGlvbiByZXN0YXJ0KCkge1xyXG4gICAgICAgIHN2Zy5zZWxlY3RBbGwoXCIubGlua1wiKVxyXG4gICAgICAgICAgICAuZGF0YShncmFwaC5saW5rcylcclxuICAgICAgICAgICAgLmVudGVyKClcclxuICAgICAgICAgICAgLmFwcGVuZChcImxpbmVcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImxpbmtcIik7XHJcblxyXG4gICAgICAgIHN2Zy5zZWxlY3RBbGwoXCIubGluay1sYWJlbFwiKVxyXG4gICAgICAgICAgICAuZGF0YShncmFwaC5saW5rcylcclxuICAgICAgICAgICAgLmVudGVyKClcclxuICAgICAgICAgICAgLmFwcGVuZChcInRleHRcIilcclxuICAgICAgICAgICAgLnRleHQoZnVuY3Rpb24oZ3JhcGhMaW5rKSB7IHJldHVybiBncmFwaExpbmsubGFiZWw7IH0pXHJcbiAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJsaW5rLWxhYmVsXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIik7XHJcblxyXG4gICAgICAgIHN2Zy5zZWxlY3RBbGwoXCIubm9kZVwiKVxyXG4gICAgICAgICAgICAuZGF0YShncmFwaC5ub2RlcylcclxuICAgICAgICAgICAgLmVudGVyKClcclxuICAgICAgICAgICAgLmFwcGVuZChcImNpcmNsZVwiKVxyXG4gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibm9kZVwiKVxyXG4gICAgICAgICAgICAuYXR0cihcInJcIiwgMzApIC8vIFRPRE86IFNldHRpbmdzXHJcbiAgICAgICAgICAgIC5hdHRyKFwieFwiLCAwKVxyXG4gICAgICAgICAgICAuYXR0cihcInlcIiwgMClcclxuICAgICAgICAgICAgLmF0dHIoXCJmaWxsXCIsIG5vZGVGaWxsQ29sb3IpXHJcbiAgICAgICAgICAgIC5jYWxsKGZvcmNlLmRyYWcpXHJcbiAgICAgICAgICAgIC5vbihcImNsaWNrXCIsIG5vZGVDbGljayk7XHJcblxyXG4gICAgICAgIHN2Zy5zZWxlY3RBbGwoXCIubm9kZS1sYWJlbFwiKVxyXG4gICAgICAgICAgICAuZGF0YShncmFwaC5ub2RlcylcclxuICAgICAgICAgICAgLmVudGVyKClcclxuICAgICAgICAgICAgLmFwcGVuZChcInRleHRcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcIm5vZGUtbGFiZWxcIilcclxuICAgICAgICAgICAgLmF0dHIoXCJkeVwiLCBcIi4zNWVtXCIpXHJcbiAgICAgICAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIilcclxuICAgICAgICAgICAgLnRleHQoZnVuY3Rpb24oZ3JhcGhOb2RlKSB7IHJldHVybiBncmFwaE5vZGUubm9kZS5sYWJlbCgpOyB9KVxyXG4gICAgICAgICAgICAuY2FsbChmb3JjZS5kcmFnKVxyXG4gICAgICAgICAgICAub24oXCJjbGlja1wiLCBub2RlQ2xpY2spO1xyXG5cclxuICAgICAgICBzZWxlY3RBbGwoKTtcclxuICAgICAgICBmb3JjZS5zdGFydCgpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIG5vZGVDbGljayhncmFwaE5vZGUpIHtcclxuICAgICAgICBpbmZvLnNob3dOb2RlKGdyYXBoTm9kZS5ub2RlLCBub2RlRmlsbENvbG9yKGdyYXBoTm9kZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIG5vZGVGaWxsQ29sb3IoZ3JhcGhOb2RlKSB7XHJcbiAgICAgICAgcmV0dXJuIGNvbG9ycyhncmFwaE5vZGUubm9kZS5ub2RlR3JvdXAubmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gc2VsZWN0QWxsKCkge1xyXG4gICAgICAgIG5vZGUgPSBzdmcuc2VsZWN0QWxsKFwiLm5vZGVcIik7XHJcbiAgICAgICAgbm9kZUxhYmVsID0gc3ZnLnNlbGVjdEFsbChcIi5ub2RlLWxhYmVsXCIpO1xyXG4gICAgICAgIGxpbmsgPSBzdmcuc2VsZWN0QWxsKFwiLmxpbmtcIik7XHJcbiAgICAgICAgbGlua0xhYmVsID0gc3ZnLnNlbGVjdEFsbChcIi5saW5rLWxhYmVsXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIG9uVGljaygpIHtcclxuICAgICAgICBsaW5rLmF0dHIoXCJ4MVwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnNvdXJjZS54OyB9KVxyXG4gICAgICAgICAgICAuYXR0cihcInkxXCIsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQuc291cmNlLnk7IH0pXHJcbiAgICAgICAgICAgIC5hdHRyKFwieDJcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC50YXJnZXQueDsgfSlcclxuICAgICAgICAgICAgLmF0dHIoXCJ5MlwiLCBmdW5jdGlvbihkKSB7IHJldHVybiBkLnRhcmdldC55OyB9KTtcclxuXHJcbiAgICAgICAgbGlua0xhYmVsXHJcbiAgICAgICAgICAgIC5hdHRyKFwieFwiLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gKGQuc291cmNlLnggKyBkLnRhcmdldC54KS8yOyB9KVxyXG4gICAgICAgICAgICAuYXR0cihcInlcIiwgZnVuY3Rpb24oZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIChkLnNvdXJjZS55ICsgZC50YXJnZXQueSkvMjsgfSk7XHJcblxyXG4gICAgICAgIG5vZGUuYXR0cihcInRyYW5zZm9ybVwiLCBmdW5jdGlvbihkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBcInRyYW5zbGF0ZShcIiArIGQueCArIFwiLFwiICsgZC55ICsgXCIpXCI7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIG5vZGVMYWJlbFxyXG4gICAgICAgICAgICAuYXR0cihcInhcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54OyB9KVxyXG4gICAgICAgICAgICAuYXR0cihcInlcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC55OyB9KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxufSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24obW9kZWwpIHtcclxuICAgIHZhciBncmFwaCA9IG5ldyBHcmFwaCgpO1xyXG5cclxuICAgIC8vIEZvciBhbGwgc2hlZXRzXHJcbiAgICAkLmVhY2gobW9kZWwubm9kZUdyb3Vwcy5pdGVtcywgZnVuY3Rpb24oaSwgbm9kZUdyb3VwKSB7XHJcbiAgICAgICAgLy8gRm9yIGFsbCBub2Rlc1xyXG4gICAgICAgICQuZWFjaChub2RlR3JvdXAubm9kZXMsIGZ1bmN0aW9uKGosIG5vZGUpIHtcclxuICAgICAgICAgICAgLy8gQWRkIG5vZGUgdG8gZ3JhcGhcclxuICAgICAgICAgICAgdmFyIGdyYXBoTm9kZSA9IG5ldyBHcmFwaE5vZGUobm9kZSk7XHJcbiAgICAgICAgICAgIGdyYXBoLm5vZGVzLnB1c2goZ3JhcGhOb2RlKTtcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIENyZWF0ZSBsaW5rc1xyXG4gICAgJC5lYWNoKGdyYXBoLm5vZGVzLCBmdW5jdGlvbihpLCBncmFwaE5vZGUpIHtcclxuICAgICAgICAkLmVhY2goZ3JhcGhOb2RlLm5vZGUucmVmcywgZnVuY3Rpb24oaiwgcmVmKSB7XHJcbiAgICAgICAgICAgIGdyYXBoLmxpbmtzLnB1c2gobmV3IEdyYXBoTGluayhncmFwaE5vZGUsIGdldEdyYXBoTm9kZShyZWYudGFyZ2V0Tm9kZSksIHJlZi5sYWJlbCkpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0R3JhcGhOb2RlKG5vZGUpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gbnVsbDtcclxuICAgICAgICAkLmVhY2goZ3JhcGgubm9kZXMsIGZ1bmN0aW9uKGksIGdyYXBoTm9kZSkge1xyXG4gICAgICAgICAgICBpZiAoZ3JhcGhOb2RlLm5vZGUgPT0gbm9kZSkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gZ3JhcGhOb2RlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZ3JhcGg7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIEdyYXBoKCkge1xyXG4gICAgdGhpcy5ub2RlcyA9IFtdO1xyXG4gICAgdGhpcy5saW5rcyA9IFtdO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIEdyYXBoTm9kZShub2RlKSB7XHJcbiAgICB0aGlzLm5vZGUgPSBub2RlO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIEdyYXBoTGluayhzb3VyY2UsIHRhcmdldCwgbGFiZWwpIHtcclxuICAgIHRoaXMuc291cmNlID0gc291cmNlO1xyXG4gICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XHJcbiAgICB0aGlzLmxhYmVsID0gbGFiZWw7XHJcbiAgICByZXR1cm4gdGhpcztcclxufSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5mb0NvbnRhaW5lcklkLCB0aXRsZSkge1xyXG4gICAgLy8gU2V0IGhlYWRpbmdcclxuICAgICQoXCIjXCIgKyBpbmZvQ29udGFpbmVySWQgKyBcIiBoMVwiKS50ZXh0KHRpdGxlKTtcclxuXHJcbiAgICB0aGlzLnNob3dOb2RlID0gZnVuY3Rpb24obm9kZSwgZmlsbENvbG9yKSB7XHJcbiAgICAgICAgJChcIiNkM3NoZWV0LW5vZGUtaW5mbyBoMlwiKS50ZXh0KG5vZGUubGFiZWwoKSk7XHJcbiAgICAgICAgJChcIiNkM3NoZWV0LW5vZGUtaW5mbyBoZWFkZXJcIikuY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiLCBmaWxsQ29sb3IpO1xyXG4gICAgICAgICQoXCIjZDNzaGVldC1ub2RlLXNoZWV0LW5hbWVcIikudGV4dChub2RlLm5vZGVHcm91cC5uYW1lKTtcclxuXHJcbiAgICAgICAgdmFyIHVsID0gJChcIiNkM3NoZWV0LW5vZGUtcHJvcGVydGllc1wiKTtcclxuICAgICAgICB1bC5lbXB0eSgpO1xyXG5cclxuICAgICAgICAvLyBTaG93IG5vZGUgcHJvcGVydGllc1xyXG4gICAgICAgICQuZWFjaChub2RlLnByb3BlcnRpZXMsIGZ1bmN0aW9uKGksIG5vZGVQcm9wZXJ0eSkge1xyXG4gICAgICAgICAgICBpZiAobm9kZVByb3BlcnR5Lm5hbWUgIT0gbm9kZS5sYWJlbFByb3BlcnR5TmFtZSlcclxuICAgICAgICAgICAgICAgIGFkZFByb3BlcnR5KG5vZGVQcm9wZXJ0eS5uYW1lLCBub2RlUHJvcGVydHkudmFsdWUpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBHcm91cCBub2RlIGxpbmtzXHJcbiAgICAgICAgdmFyIGdyb3VwZWRMaW5rcyA9IHt9O1xyXG4gICAgICAgICQuZWFjaChub2RlLnJlZnMsIGZ1bmN0aW9uKGksIHJlZikge1xyXG4gICAgICAgICAgICB2YXIgbGlua05hbWUgPSByZWYubGFiZWw7XHJcbiAgICAgICAgICAgIGlmIChsaW5rTmFtZSA9PSBudWxsKVxyXG4gICAgICAgICAgICAgICAgbGlua05hbWUgPSByZWYudGFyZ2V0Tm9kZS5ub2RlR3JvdXAubmFtZTtcclxuXHJcbiAgICAgICAgICAgIGlmIChncm91cGVkTGlua3NbbGlua05hbWVdID09IG51bGwpXHJcbiAgICAgICAgICAgICAgICBncm91cGVkTGlua3NbbGlua05hbWVdID0gW107XHJcblxyXG4gICAgICAgICAgICBncm91cGVkTGlua3NbbGlua05hbWVdLnB1c2gocmVmLnRhcmdldE5vZGUubGFiZWwoKSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIFNob3cgbm9kZSBsaW5rc1xyXG4gICAgICAgIHZhciBsaW5rTmFtZXMgPSBPYmplY3Qua2V5cyhncm91cGVkTGlua3MpO1xyXG4gICAgICAgICQuZWFjaChsaW5rTmFtZXMsIGZ1bmN0aW9uKGksIGxpbmtOYW1lKSB7XHJcbiAgICAgICAgICAgIGFkZFByb3BlcnR5KGxpbmtOYW1lLCBncm91cGVkTGlua3NbbGlua05hbWVdLmpvaW4oXCIsIFwiKSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGFkZFByb3BlcnR5KG5hbWUsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHVsLmFwcGVuZChcIjxsaT48c3BhbiBjbGFzcz1cXFwiZDNzaGVldC1ub2RlLXByb3BlcnR5LW5hbWVcXFwiPlwiICsgbmFtZSArXHJcbiAgICAgICAgICAgICAgICBcIjo8L3NwYW4+IDxzcGFuIGNsYXNzPVxcXCJkM3NoZWV0LW5vZGUtcHJvcGVydHktdmFsdWVcXFwiPlwiICsgZm9ybWF0VmFsdWUodmFsdWUpICsgXCI8L3NwYW4+PC9saT5cIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBmb3JtYXRWYWx1ZSh2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodmFsdWUuc2xpY2UoMCwgXCI0XCIpLnRvTG93ZXJDYXNlKCkgPT0gXCJodHRwXCIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXCI8YSBocmVmPVxcXCJcIiArIHZhbHVlICsgXCJcXFwiPlwiICsgdmFsdWUgKyBcIjwvYT5cIlxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxufSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc3ByZWFkc2hlZXQpIHtcclxuICAgIHZhciBtb2RlbCA9IG5ldyBNb2RlbCgpO1xyXG5cclxuICAgIHZhciBub2RlR3JvdXBUeXBlcyA9IGdldE5vZGVHcm91cFR5cGVzKHNwcmVhZHNoZWV0KTtcclxuICAgIG1vZGVsLm5vZGVHcm91cHMgPSBnZXROb2RlR3JvdXBzKHNwcmVhZHNoZWV0LCBub2RlR3JvdXBUeXBlcy5ub2RlR3JvdXBOYW1lcyk7XHJcbiAgICBpZiAobm9kZUdyb3VwVHlwZXMuc2V0dGluZ3NHcm91cE5hbWUgIT0gbnVsbClcclxuICAgICAgICBtb2RlbC5zZXR0aW5ncyA9IHNwcmVhZHNoZWV0LnNoZWV0c1tub2RlR3JvdXBUeXBlcy5zZXR0aW5nc0dyb3VwTmFtZV07XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0Tm9kZUdyb3VwcyhzcHJlYWRzaGVldCwgbm9kZUdyb3VwTmFtZXMpIHtcclxuICAgICAgICAvLyBDcmVhdGUgbm9kZXMgd2l0aCBwcm9wZXJ0aWVzXHJcbiAgICAgICAgdmFyIG5vZGVHcm91cHMgPSBuZXcgTm9kZUdyb3VwcygpO1xyXG4gICAgICAgICQuZWFjaChub2RlR3JvdXBOYW1lcywgZnVuY3Rpb24oaSwgbm9kZUdyb3VwTmFtZSkge1xyXG4gICAgICAgICAgICBub2RlR3JvdXBzLml0ZW1zLnB1c2goZ2V0Tm9kZXMoc3ByZWFkc2hlZXQuc2hlZXRzW25vZGVHcm91cE5hbWVdLCBub2RlR3JvdXBOYW1lKSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIENyZWF0ZSByZWZlcmVuY2VzIGZyb20gbm9kZSBzaGVldHNcclxuICAgICAgICAkLmVhY2gobm9kZUdyb3Vwcy5pdGVtcywgZnVuY3Rpb24oaSwgbm9kZUdyb3VwKSB7XHJcbiAgICAgICAgICAgIGNyZWF0ZVJlZnMobm9kZUdyb3Vwcywgc3ByZWFkc2hlZXQuc2hlZXRzW25vZGVHcm91cC5uYW1lXSwgbm9kZUdyb3VwKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gVE9ETzogQ3JlYXRlIHJlZmVyZW5jZXMgZnJvbSByZWZlcmVuY2Ugc2hlZXRzXHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZVJlZnMobm9kZUdyb3Vwcywgbm9kZVNoZWV0LCBub2RlR3JvdXApIHtcclxuICAgICAgICAgICAgdmFyIGNvbE5hbWVzID0gbm9kZVNoZWV0LmhlYWRlcigpO1xyXG5cclxuICAgICAgICAgICAgLy8gRm9yIGFsbCBzaGVldCByb3dzXHJcbiAgICAgICAgICAgICQuZWFjaChub2RlU2hlZXQucm93cywgZnVuY3Rpb24oaSwgcm93KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaSA9PSAwKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBGb3IgYWxsIHNoZWV0IGNvbHVtbnNcclxuICAgICAgICAgICAgICAgICQuZWFjaChjb2xOYW1lcywgZnVuY3Rpb24oaiwgY29sTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IG5vZGVTaGVldC52YWx1ZShyb3csIGNvbE5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHRoaXMgaXMgYSByZWZlcmVuY2UgY29sdW1uXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlZlRhcmdldCA9IHBhcnNlQ29sdW1uUmVmTmFtZShjb2xOYW1lLCBub2RlR3JvdXBzKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocmVmVGFyZ2V0ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRmluZCBpbmRleCBvZiB0aGUgdGFyZ2V0IG5vZGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKHJlZlRhcmdldC5ub2RlR3JvdXAubm9kZXMsIGZ1bmN0aW9uKGssIHRhcmdldE5vZGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHRhcmdldCBub2RlIHByb3BlcnR5IHZhbHVlIG1hdGNoZXNcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IFdlIHNob3VsZCBwcm9wZXJseSBzcGxpdCB2YWx1ZXMgdXNpbmcgY29tbWFcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZS5pbmRleE9mKHRhcmdldE5vZGUudmFsdWUocmVmVGFyZ2V0LnByb3BlcnR5TmFtZSkpID4gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlR3JvdXAubm9kZXNbaSAtIDFdLnJlZnMucHVzaChuZXcgUmVmKHRhcmdldE5vZGUsIHJlZlRhcmdldC5sYWJlbCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBnZXROb2Rlcyhub2RlU2hlZXQsIG5vZGVHcm91cE5hbWUpIHtcclxuICAgICAgICAgICAgdmFyIGhlYWRlciA9IG5vZGVTaGVldC5oZWFkZXIoKTtcclxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IG5ldyBOb2RlR3JvdXAobm9kZUdyb3VwTmFtZSwgaGVhZGVyWzBdKTtcclxuXHJcbiAgICAgICAgICAgIC8vIEdldCBub2RlcyBhbmQgcHJvcGVydGllc1xyXG4gICAgICAgICAgICAkLmVhY2gobm9kZVNoZWV0LnJvd3MsIGZ1bmN0aW9uKGksIHJvdykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGkgPT0gMClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICByZXN1bHQubm9kZXMucHVzaChuZXcgTm9kZShnZXROb2RlUHJvcGVydGllcyhyb3csIGhlYWRlciksIHJlc3VsdCkpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBnZXROb2RlUHJvcGVydGllcyhyb3csIGhlYWRlcikge1xyXG4gICAgICAgICAgICB2YXIgbm9kZVByb3BlcnRpZXMgPSBbXTtcclxuICAgICAgICAgICAgJC5lYWNoKHJvdy5yb3dDZWxscywgZnVuY3Rpb24oaSwgcm93Q2VsbCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNvbE5hbWUgPSBoZWFkZXJbcm93Q2VsbC5jb2xJbmRleF07XHJcbiAgICAgICAgICAgICAgICBpZiAoY29sTmFtZS5pbmRleE9mKFwiLlwiKSA9PSAtMSlcclxuICAgICAgICAgICAgICAgICAgICBub2RlUHJvcGVydGllcy5wdXNoKG5ldyBOb2RlUHJvcGVydHkoY29sTmFtZSwgcm93Q2VsbC52YWx1ZSkpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIG5vZGVQcm9wZXJ0aWVzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG5vZGVHcm91cHM7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0Tm9kZUdyb3VwVHlwZXMoc3ByZWFkc2hlZXQpIHtcclxuICAgICAgICB2YXIgbm9kZUdyb3VwVHlwZXMgPSB7XHJcbiAgICAgICAgICAgIG5vZGVHcm91cE5hbWVzOiBbXSxcclxuICAgICAgICAgICAgcmVmU2hlZXROYW1lczogW10sXHJcbiAgICAgICAgICAgIHNldHRpbmdzR3JvdXBOYW1lOiBudWxsXHJcbiAgICAgICAgfTtcclxuICAgICAgICB2YXIgc2hlZXROYW1lcyA9IE9iamVjdC5rZXlzKHNwcmVhZHNoZWV0LnNoZWV0cyk7XHJcbiAgICAgICAgJC5lYWNoKHNoZWV0TmFtZXMsIGZ1bmN0aW9uKGksIHNoZWV0TmFtZSkge1xyXG4gICAgICAgICAgICBpZiAoc2hlZXROYW1lID09IFwic2V0dGluZ3NcIikge1xyXG4gICAgICAgICAgICAgICAgbm9kZUdyb3VwVHlwZXMuc2V0dGluZ3NHcm91cE5hbWUgPSBzaGVldE5hbWU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChzaGVldE5hbWUuc2xpY2UoMCwgMSkgPT0gXCIjXCIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgICAgICB2YXIgcmVmU2hlZXQgPSBwYXJzZVJlZlNoZWV0TmFtZShzaGVldE5hbWUpXHJcbiAgICAgICAgICAgIGlmICgocmVmU2hlZXQgIT0gbnVsbCkgJiZcclxuICAgICAgICAgICAgICAgIChzaGVldE5hbWVzLmluZGV4T2YocmVmU2hlZXQuc291cmNlKSA+IC0xKSAmJlxyXG4gICAgICAgICAgICAgICAgKHNoZWV0TmFtZXMuaW5kZXhPZihyZWZTaGVldC50YXJnZXQpID4gLTEpKSB7XHJcbiAgICAgICAgICAgICAgICBub2RlR3JvdXBUeXBlcy5yZWZTaGVldE5hbWVzLnB1c2goc2hlZXROYW1lKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBub2RlR3JvdXBUeXBlcy5ub2RlR3JvdXBOYW1lcy5wdXNoKHNoZWV0TmFtZSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBub2RlR3JvdXBUeXBlcztcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBwYXJzZUNvbHVtblJlZk5hbWUoY29sTmFtZSwgbm9kZUdyb3Vwcykge1xyXG4gICAgICAgIHZhciByZWZOYW1lcyA9IGNvbE5hbWUuc3BsaXQoXCIuXCIpO1xyXG4gICAgICAgIHZhciBub2RlR3JvdXAgPSBudWxsO1xyXG4gICAgICAgIGlmIChyZWZOYW1lcy5sZW5ndGggPiAwKVxyXG4gICAgICAgICAgICBub2RlR3JvdXAgPSBub2RlR3JvdXBzLmdldEJ5TmFtZShyZWZOYW1lc1swXSk7XHJcbiAgICAgICAgaWYgKChyZWZOYW1lcy5sZW5ndGggPj0gMikgJiZcclxuICAgICAgICAgICAgKG5vZGVHcm91cCAhPSBudWxsKSkge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0ge1xyXG4gICAgICAgICAgICAgICAgbm9kZUdyb3VwOiBub2RlR3JvdXAsXHJcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eU5hbWU6IHJlZk5hbWVzWzFdXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChyZWZOYW1lcy5sZW5ndGggPT0gMylcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5sYWJlbCA9IHJlZk5hbWVzWzJdO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHBhcnNlUmVmU2hlZXROYW1lKHNoZWV0TmFtZSkge1xyXG4gICAgICAgIHZhciBub2RlTmFtZXMgPSBzaGVldE5hbWUuc3BsaXQoXCItXCIpO1xyXG4gICAgICAgIGlmIChub2RlTmFtZXMubGVuZ3RoID09IDIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHNvdXJjZTogbm9kZU5hbWVzWzBdLFxyXG4gICAgICAgICAgICAgICAgdGFyZ2V0OiBub2RlTmFtZXNbMV1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBtb2RlbDtcclxufVxyXG5cclxuZnVuY3Rpb24gTW9kZWwoKSB7XHJcbiAgICB0aGlzLm5vZGVHcm91cHMgPSBuZXcgTm9kZUdyb3VwcygpO1xyXG4gICAgdGhpcy5zZXR0aW5ncyA9IHt9O1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIE5vZGVHcm91cHMoKSB7XHJcbiAgICB0aGlzLml0ZW1zID0gW107XHJcbiAgICByZXR1cm4gdGhpcztcclxufVxyXG5cclxuTm9kZUdyb3Vwcy5wcm90b3R5cGUuZ2V0QnlOYW1lID0gZnVuY3Rpb24obm9kZUdyb3VwTmFtZSkge1xyXG4gICAgdmFyIHJlc3VsdCA9IG51bGw7XHJcbiAgICAkLmVhY2godGhpcy5pdGVtcywgZnVuY3Rpb24oaSwgbm9kZUdyb3VwKSB7XHJcbiAgICAgICAgaWYgKG5vZGVHcm91cC5uYW1lID09IG5vZGVHcm91cE5hbWUpIHtcclxuICAgICAgICAgICAgcmVzdWx0ID0gbm9kZUdyb3VwO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG5mdW5jdGlvbiBOb2RlR3JvdXAobmFtZSwgbGFiZWxQcm9wZXJ0eU5hbWUpIHtcclxuICAgIHRoaXMubmFtZSA9IG5hbWU7XHJcbiAgICB0aGlzLmxhYmVsUHJvcGVydHlOYW1lID0gbGFiZWxQcm9wZXJ0eU5hbWU7XHJcbiAgICB0aGlzLm5vZGVzID0gW107XHJcbiAgICByZXR1cm4gdGhpcztcclxufVxyXG5cclxuZnVuY3Rpb24gTm9kZShwcm9wZXJ0aWVzLCBub2RlR3JvdXApIHtcclxuICAgIHRoaXMucHJvcGVydGllcyA9IHByb3BlcnRpZXM7XHJcbiAgICB0aGlzLnJlZnMgPSBbXTtcclxuICAgIHRoaXMubm9kZUdyb3VwID0gbm9kZUdyb3VwO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn1cclxuXHJcbk5vZGUucHJvdG90eXBlLnZhbHVlID0gZnVuY3Rpb24ocHJvcGVydHlOYW1lKSB7XHJcbiAgICB2YXIgcmVzdWx0ID0gbnVsbDtcclxuICAgICQuZWFjaCh0aGlzLnByb3BlcnRpZXMsIGZ1bmN0aW9uKGksIHByb3BlcnR5KSB7XHJcbiAgICAgICAgaWYgKHByb3BlcnR5Lm5hbWUgPT0gcHJvcGVydHlOYW1lKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdCA9IHByb3BlcnR5LnZhbHVlO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG5Ob2RlLnByb3RvdHlwZS5sYWJlbCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMudmFsdWUodGhpcy5ub2RlR3JvdXAubGFiZWxQcm9wZXJ0eU5hbWUpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBOb2RlUHJvcGVydHkobmFtZSwgdmFsdWUpIHtcclxuICAgIHRoaXMubmFtZSA9IG5hbWU7XHJcbiAgICB0aGlzLnZhbHVlID0gdmFsdWU7XHJcbiAgICByZXR1cm4gdGhpcztcclxufVxyXG5cclxuZnVuY3Rpb24gUmVmKHRhcmdldE5vZGUsIGxhYmVsKSB7XHJcbiAgICB0aGlzLnRhcmdldE5vZGUgPSB0YXJnZXROb2RlO1xyXG4gICAgdGhpcy5sYWJlbCA9IGxhYmVsO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNwcmVhZHNoZWV0S2V5LCBvbkxvYWRlZCkge1xyXG4gICAgLy8gR2V0IHNoZWV0IGNvdW50XHJcbiAgICBnZXRTcHJlYWRzaGVldEluZm8oc3ByZWFkc2hlZXRLZXksIGZ1bmN0aW9uIG9uU3VjY2VzcyhpbmZvKSB7XHJcbiAgICAgICAgLy8gTG9hZCBhbGwgc2hlZXRzXHJcbiAgICAgICAgbG9hZFNoZWV0cyhzcHJlYWRzaGVldEtleSwgaW5mbyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBmdW5jdGlvbiBsb2FkU2hlZXRzKHNwcmVhZHNoZWV0S2V5LCBpbmZvKSB7XHJcbiAgICAgICAgdmFyIHNwcmVhZHNoZWV0ID0gbmV3IFNwcmVhZHNoZWV0KHNwcmVhZHNoZWV0S2V5LCBpbmZvLnRpdGxlKTtcclxuICAgICAgICB2YXIgbG9hZGVkU2hlZXRDb3VudCA9IDA7XHJcbiAgICAgICAgZm9yIChpID0gMTsgaSA8PSBpbmZvLnNoZWV0Q291bnQ7IGkrKykge1xyXG4gICAgICAgICAgICBsb2FkU2hlZXQoc3ByZWFkc2hlZXQsIHNwcmVhZHNoZWV0S2V5LCBpKS50aGVuKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgbG9hZGVkU2hlZXRDb3VudCArPSAxO1xyXG4gICAgICAgICAgICAgICAgaWYgKGxvYWRlZFNoZWV0Q291bnQgPT0gaW5mby5zaGVldENvdW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgb25Mb2FkZWQoc3ByZWFkc2hlZXQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBsb2FkU2hlZXQoc3ByZWFkc2hlZXQsIHNwcmVhZHNoZWV0S2V5LCBzaGVldEluZGV4KSB7XHJcbiAgICAgICAgcmV0dXJuIGdldFNoZWV0KHNwcmVhZHNoZWV0S2V5LCBzaGVldEluZGV4LCBmdW5jdGlvbihyZXNwb25zZSkge1xyXG4gICAgICAgICAgICB2YXIgc2hlZXQgPSBzcHJlYWRzaGVldC5zaGVldHNbcmVzcG9uc2UuZmVlZC50aXRsZS4kdF0gPSBuZXcgU2hlZXQoKTtcclxuXHJcbiAgICAgICAgICAgICQuZWFjaChyZXNwb25zZS5mZWVkLmVudHJ5LCBmdW5jdGlvbihpLCBlKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSBlLmdzJGNlbGwucm93IC0gMTtcclxuICAgICAgICAgICAgICAgIGlmIChzaGVldC5yb3dzW2luZGV4XSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2hlZXQucm93c1tpbmRleF0gPSBuZXcgUm93KGluZGV4KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHNoZWV0LnJvd3NbaW5kZXhdLnJvd0NlbGxzLnB1c2gobmV3IFJvd0NlbGwoZS5ncyRjZWxsLmNvbCAtIDEsIGUuY29udGVudC4kdCkpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIFNvcnQgcm93IGNlbGxzIGJ5IGNvbCBpbmRleFxyXG4gICAgICAgICAgICAkLmVhY2goc2hlZXQucm93cywgZnVuY3Rpb24oaSwgcm93KSB7XHJcbiAgICAgICAgICAgICAgICByb3cucm93Q2VsbHMuc29ydChmdW5jdGlvbihjMSwgYzIpIHsgcmV0dXJuIGMxLmNvbEluZGV4IC0gYzIuY29sSW5kZXg7IH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbi8vICAgIGZ1bmN0aW9uIGxvYWRTZXR0aW5nc1NoZWV0KHNldHRpbmdzU2hlZXQsIHNwcmVhZHNoZWV0KSB7XHJcbi8vICAgICAgICAvLyBNYXAgY2VsbHMgdG8gbGlzdFxyXG4vLyAgICAgICAgdmFyIHNldHRpbmdzTGlzdCA9IHt9O1xyXG4vLyAgICAgICAgJC5lYWNoKHNldHRpbmdzU2hlZXQuZmVlZC5lbnRyeSwgZnVuY3Rpb24oaSwgZSkge1xyXG4vLyAgICAgICAgICAgIGlmIChzZXR0aW5nc0xpc3RbZS5ncyRjZWxsLnJvd10gPT0gbnVsbClcclxuLy8gICAgICAgICAgICAgICAgc2V0dGluZ3NMaXN0W2UuZ3MkY2VsbC5yb3ddID0ge307XHJcbi8vXHJcbi8vICAgICAgICAgICAgaWYgKGUuZ3MkY2VsbC5jb2wgPT0gMSlcclxuLy8gICAgICAgICAgICAgICAgc2V0dGluZ3NMaXN0W2UuZ3MkY2VsbC5yb3ddLmtleSA9IGUuY29udGVudC4kdDtcclxuLy8gICAgICAgICAgICBlbHNlXHJcbi8vICAgICAgICAgICAgICAgIGlmIChlLmdzJGNlbGwuY29sID09IDIpXHJcbi8vICAgICAgICAgICAgICAgICAgICBzZXR0aW5nc0xpc3RbZS5ncyRjZWxsLnJvd10udmFsdWUgPSBlLmNvbnRlbnQuJHQ7XHJcbi8vICAgICAgICB9KTtcclxuLy9cclxuLy8gICAgICAgIC8vIE1hcCBsaXN0IHRvIG9iamVjdFxyXG4vLyAgICAgICAgJC5lYWNoKHNldHRpbmdzTGlzdCwgZnVuY3Rpb24oaSwgcykge1xyXG4vLyAgICAgICAgICAgIGlmICgocy5rZXkgPT0gbnVsbCkgfHwgKHMudmFsdWUgPT0gbnVsbCkpXHJcbi8vICAgICAgICAgICAgICAgIHJldHVybjtcclxuLy9cclxuLy8gICAgICAgICAgICAvLyBDcmVhdGUgaW5uZXIgb2JqZWN0c1xyXG4vLyAgICAgICAgICAgIHZhciBwYXRoID0gcy5rZXkuc3BsaXQoXCIuXCIpO1xyXG4vLyAgICAgICAgICAgIHZhciBjdXJyZW50ID0gc3ByZWFkc2hlZXQuc2V0dGluZ3M7XHJcbi8vICAgICAgICAgICAgJC5lYWNoKHBhdGgsIGZ1bmN0aW9uKGosIGspIHtcclxuLy8gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRba10gPT0gbnVsbCkge1xyXG4vLyAgICAgICAgICAgICAgICAgICAgaWYgKGogPT0gcGF0aC5sZW5ndGggLSAxKVxyXG4vLyAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRba10gPSBzLnZhbHVlO1xyXG4vLyAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4vLyAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRba10gPSB7fTtcclxuLy8gICAgICAgICAgICAgICAgfVxyXG4vLyAgICAgICAgICAgICAgICBjdXJyZW50ID0gY3VycmVudFtrXTtcclxuLy8gICAgICAgICAgICB9KTtcclxuLy8gICAgICAgIH0pO1xyXG4vLyAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0U2hlZXQoc3ByZWFkc2hlZXRLZXksIHNoZWV0SW5kZXgsIG9uU3VjY2Vzcykge1xyXG4gICAgICAgIHJldHVybiAkLmFqYXgoe1xyXG4gICAgICAgICAgICB1cmw6IFwiaHR0cHM6Ly9zcHJlYWRzaGVldHMuZ29vZ2xlLmNvbS9mZWVkcy9jZWxscy9cIiArIHNwcmVhZHNoZWV0S2V5ICsgXCIvXCIgKyBzaGVldEluZGV4ICsgXCIvcHVibGljL3ZhbHVlcz9hbHQ9anNvbi1pbi1zY3JpcHRcIixcclxuICAgICAgICAgICAganNvbnA6IFwiY2FsbGJhY2tcIixcclxuICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvbnBcIixcclxuICAgICAgICAgICAgc3VjY2Vzczogb25TdWNjZXNzXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0U3ByZWFkc2hlZXRJbmZvKHNwcmVhZHNoZWV0S2V5LCBvblN1Y2Nlc3MpIHtcclxuICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICB1cmw6IFwiaHR0cHM6Ly9zcHJlYWRzaGVldHMuZ29vZ2xlLmNvbS9mZWVkcy93b3Jrc2hlZXRzL1wiICsgc3ByZWFkc2hlZXRLZXkgKyBcIi9wdWJsaWMvZnVsbD9hbHQ9anNvbi1pbi1zY3JpcHRcIixcclxuICAgICAgICAgICAganNvbnA6IFwiY2FsbGJhY2tcIixcclxuICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvbnBcIixcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24ocmVzcG9uc2UpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpbmZvID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHNoZWV0Q291bnQ6IHJlc3BvbnNlLmZlZWQuZW50cnkubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiByZXNwb25zZS5mZWVkLnRpdGxlLiR0XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgb25TdWNjZXNzKGluZm8pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIFNwcmVhZHNoZWV0KHNwcmVhZHNoZWV0S2V5LCB0aXRsZSkge1xyXG4gICAgdGhpcy5rZXkgPSBzcHJlYWRzaGVldEtleTtcclxuICAgIHRoaXMudGl0bGUgPSB0aXRsZTtcclxuICAgIHRoaXMuc2hlZXRzID0gbmV3IFNoZWV0cygpO1xyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG59XHJcblxyXG5mdW5jdGlvbiBTaGVldHMoKSB7XHJcbiAgICByZXR1cm4gdGhpcztcclxufVxyXG5cclxuZnVuY3Rpb24gU2hlZXQoKSB7XHJcbiAgICB0aGlzLnJvd3MgPSBbXTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59XHJcblxyXG5TaGVldC5wcm90b3R5cGUuaGVhZGVyID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5yb3dzWzBdLnZhbHVlcygpO1xyXG59XHJcblxyXG5TaGVldC5wcm90b3R5cGUudmFsdWUgPSBmdW5jdGlvbihyb3csIGNvbE5hbWUpIHtcclxuICAgIHZhciBjb2xJbmRleCA9IHRoaXMuaGVhZGVyKCkuaW5kZXhPZihjb2xOYW1lKTtcclxuICAgIGlmIChjb2xJbmRleCA9PSAtMSlcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuXHJcbiAgICB2YXIgcmVzdWx0ID0gbnVsbDtcclxuICAgICQuZWFjaChyb3cucm93Q2VsbHMsIGZ1bmN0aW9uKGksIHJvd0NlbGwpIHtcclxuICAgICAgICBpZiAocm93Q2VsbC5jb2xJbmRleCA9PSBjb2xJbmRleCkge1xyXG4gICAgICAgICAgICByZXN1bHQgPSByb3dDZWxsLnZhbHVlO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuZnVuY3Rpb24gUm93KHJvd0luZGV4KSB7XHJcbiAgICB0aGlzLnJvd0luZGV4ID0gcm93SW5kZXg7XHJcbiAgICB0aGlzLnJvd0NlbGxzID0gW107XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn1cclxuXHJcblJvdy5wcm90b3R5cGUudmFsdWVzID0gZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gJC5tYXAodGhpcy5yb3dDZWxscywgZnVuY3Rpb24ocm93Q2VsbCwgaSkge1xyXG4gICAgICAgIHJldHVybiByb3dDZWxsLnZhbHVlO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIFJvd0NlbGwoY29sSW5kZXgsIHZhbHVlKSB7XHJcbiAgICB0aGlzLmNvbEluZGV4ID0gY29sSW5kZXg7XHJcbiAgICB0aGlzLnZhbHVlID0gdmFsdWU7XHJcbiAgICByZXR1cm4gdGhpcztcclxufSJdfQ==
