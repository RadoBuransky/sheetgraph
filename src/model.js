module.exports = function(db) {
    var model = {
        graph: {},
        settings: {}
    };

    var sheetTypes = getSheetTypes(db);
    model.graph = getNodeSheets(db, sheetTypes.nodesSheetNames);
    if (sheetTypes.settingsSheetName != null)
        model.settings = db[sheetTypes.settingsSheetName];

    console.log(model);

    function getNodeSheets(db, nodesSheetNames) {
        var nodes = {};
        $.each(nodesSheetNames, function(i, nodesSheetName) {
            nodes[nodesSheetName] = db[nodesSheetName];
        });
        return nodes;
    }

    function getSheetTypes(db) {
        var sheetTypes = {
            nodesSheetNames: [],
            linkSheetNames: [],
            settingsSheetName: null
        };
        var sheetNames = Object.keys(db);
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