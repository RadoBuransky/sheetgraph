module.exports = function(db) {
    var model = {};

    var linkSheets = separateNodeAndLinkSheets(db, model);
    linkSheetsToModel(linkSheets, model);

    console.log(linkSheets);
    console.log(model);

    function linkSheetsToModel(linkSheets, model) {
        $.each(linkSheets, function(i, linkSheet) {
            var references = {};
            $.each(linkSheet.data, function(j, ref) {
                references[ref[linkSheet.source + "Id"]] = ref[linkSheet.target + "Id"];
            });

            model[linkSheet.source].references[linkSheet.target] = references;
        });
    }

    function separateNodeAndLinkSheets(db, model) {
        var linkSheets = {};
        var sheetNames = Object.keys(db);
        $.each(sheetNames, function(i, sheetName) {
            // Link sheets have dash-separated name in form <SOURCE_NAME>-<TARGET_NAME>
            var nodeNames = sheetName.split("-");
            if ((nodeNames.length == 2) &&
                (sheetNames.indexOf(nodeNames[0]) > -1) &&
                (sheetNames.indexOf(nodeNames[1]) > -1)) {
                // This is a link sheet
                linkSheets[sheetName] = {
                    source: nodeNames[0],
                    target: nodeNames[1],
                    data: db[sheetName]
                }
            }
            else {
                // This is a node sheet
                model[sheetName] = {
                    records: db[sheetName],
                    references: {}
                }
            }
        });

        return linkSheets;
    }

    return model;
}