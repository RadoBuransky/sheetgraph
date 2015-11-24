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
                            result.nodes.push(new Ref(targetNode, refTarget.label));
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
                nodeGroupTypes.refSheetNames.push(refSheet);
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

function Ref(targetNode, label) {
    this.targetNode = targetNode;
    this.label = label;
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