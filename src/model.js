module.exports = function(spreadsheet) {
    var model = new Model();

    console.log(spreadsheet);

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

        // Create link names
        $.each(nodeGroupNames, function(i, nodeGroupName) {
            createLinkNames(nodeGroups, spreadsheet.sheets[nodeGroupName], nodeGroupName);
        });

        // Create links from node sheets
        $.each(nodeGroupNames, function(i, nodeGroupName) {
            createLinks(nodeGroups, spreadsheet.sheets[nodeGroupName], nodeGroupName);
        });

        // TODO: Create links from link sheets

        function createLinks(nodeGroups, nodeSheet, nodeGroupName) {
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

                    // If this is a link column
                    var linkTarget = parseColumnLinkName(colName, nodeGroups);
                    if (linkTarget != null) {
                        // Find index of the target node
                        $.each(nodeGroups[linkTarget.sheetName].nodes, function(k, targetNode) {
                            // If target node property value matches
                            // TODO: We should properly split values using comma
                            if (value.indexOf(targetNode.value(linkTarget.propertyName)) > -1) {
                                var links = nodeGroup.nodes[i - 1].links;
                                if (links[linkTarget.sheetName] == null)
                                    links[linkTarget.sheetName] = [];

                                // Add index of the target node to the nodeGroup node
                                links[linkTarget.sheetName].push(k);
                            }
                        });
                    }
                });
            });
        }

        function createLinkNames(sheets, nodeSheet, nodeGroupName) {
            var source = sheets[nodeGroupName];

            // Get link names
            $.each(nodeSheet.header(), function(i, propertyName) {
                var linkTarget = parseColumnLinkName(propertyName, sheets);
                if (linkTarget != null)
                    source.linkedNodeGroups.push(new LinkedNodeGroup(linkTarget.sheetName, linkTarget.label));
            });
        }

        function getNodes(nodeSheet, nodeGroupName) {
            var header = nodeSheet.header();
            var result = new NodeGroup(nodeGroupName, header[0]);

            // Get nodes and properties
            $.each(nodeSheet.rows, function(i, row) {
                if (i == 0)
                    return;
                result.nodes.push(new Node(getNodeProperties(row, header)));
            });

            // Get property names
            $.each(header, function(i, colName) {
                var linkTarget = colName.split(".");
                if (linkTarget.length == 1)
                    result.propertyNames.push(colName);
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
            linkSheetNames: [],
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

            var linkSheet = parseLinkSheetName(sheetName)
            if ((linkSheet != null) &&
                (sheetNames.indexOf(linkSheet.source) > -1) &&
                (sheetNames.indexOf(linkSheet.target) > -1)) {
                nodeGroupTypes.linkSheetNames.push(sheetName)
                return;
            }

            nodeGroupTypes.nodeGroupNames.push(sheetName);
        });

        return nodeGroupTypes;
    }

    function parseColumnLinkName(colName, sheets) {
        var linkNames = colName.split(".");
        if ((linkNames.length >= 2) &&
            (sheets[linkNames[0]] != null) &&
            (sheets[linkNames[0]].propertyNames.indexOf(linkNames[1]) > -1)) {
            var result = {
                sheetName: linkNames[0],
                propertyName: linkNames[1]
            }

            if (linkNames.length == 3)
                result.label = linkNames[2];

            return result;
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

    console.log(model);
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

function NodeGroup(name, label) {
    this.name = name;
    this.label = label;
    this.propertyNames = [];
    this.linkedNodeGroups = [];
    this.nodes = [];
    return this;
}

function LinkedNodeGroup(name, label) {
    this.name = name;
    this.label = label;
    return this;
}

function Node(properties) {
    this.properties = properties;
    this.links = {};
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

function NodeProperty(name, value) {
    this.name = name;
    this.value = value;
    return this;
}