# sheetgraph - visualize Google Spreadsheet as a D3 force graph

Without writing any code:
 
1. **Create a well-formed Google Spreadsheet**
2. **Publish it so that it can be publicly accessed**. From the main menu in Google Spreadsheet choose **File** >
   **Publish to the web...**
3. Use URL of the spreadsheet to **visualize it as a graph** with nodes and links

Format of the spreadsheet is described later. But it's so self-explanatory that If you're too lazy to read, go ahead and
check following examples to learn by them.

## Example 1: movies and actors

- [Google Spreadsheet](https://docs.google.com/spreadsheets/d/145TdEqd9nbnRFWWGUM-tdedulewUvZjRpHP7C09pIaQ/)
- [Graph](http://sheetgraph.com/?s=145TdEqd9nbnRFWWGUM-tdedulewUvZjRpHP7C09pIaQ)

## Example 2: vesmír OPIS (Slovak language)

- [Google Spreadsheet](https://docs.google.com/spreadsheets/d/1TAVF5meqnFLqwNlttUj1cLEP4WmLzpO_DWyYCWudctM/)
- [Graph](http://sheetgraph.com/?s=1TAVF5meqnFLqwNlttUj1cLEP4WmLzpO_DWyYCWudctM)

## Documentation

Start with a blank Google Spreadsheet and publish it (File > Publish it to the web...). In the next chapters you will
learn how to create sheets to create nodes in the graph and how to create links (edges) between them.
 
### Sheets

To make it clear, sheet is a table. It contains rows and columns. A single spreadsheet can have more sheets. So
spreadsheet is a document and sheet is a table within that document. Right?

Every sheet has a name and the name matters. There are four types of sheets determined by their name:

1. **Node sheet** - contains nodes
2. **Link sheet** - contains links
3. **Settings sheet** - a sheet named `settings`, contains various global properties and settings
4. **Ignored sheet** - a sheet is ignored by `d3sheet` if its name starts with a `#` sign

The logic is fairly simple. If the sheet name is in form `<SHEET_NAME>-<SHEET_NAME>` then it contains links, otherwise
it contains nodes. Links can be also created in a simpler way, you don't always have to create a separate sheet to
create links. This is explained later. 

### Node sheet

Single row in a node sheet represents a node in the graph. The only exception is the first row which contains names of columns.
**The first column** in a node sheet is used as a **node label** property. Node label is the text visible in front of the
node in the graph. All other columns have one of two following meanings:

1. **Node property** - use it for whatever you like
2. **Link to another node** - column name determines which node property to use to create a link

*Tip: It is generally a good idea to have an globally unique `id` node property in all node sheets, but it is not
mandatory. This `id` node property can be then used to unambiguously link nodes, but you can create links using any
properties.*

**To create a link to a node** first create a column named as `<TARGET_SHEET_NAME>.<TARGET_NODE_PROPERTY_NAME>`. Then to
create actual link, put the target node's property value into the row representing source node. **To create more links
you can use comma-separated list** of target property values. Note that you can also create links using link sheets.

For example let's assume we have two node sheets `movie` and `actor`. To create a link from a movie to an actor using
hers/his name, create a column named `actor.name` in the `movie` sheet.

**To assign a label to a link** just add the label to the column name so that the resulting format is
`<TARGET_SHEET_NAME>.<TARGET_NODE_PROPERTY_NAME>.<LINK_LABEL>`. If you want to give each link a different label you
have to create a link sheet instead of a link column.

**To hide column** from being displayed prefix it's name with a `#` symbol.

**To display oriented arrow link** pointing towards the link target, prefix the column name with `->`. For opposite direction
prefix the column name with `<-`.

### Link sheet

Link sheet has a name in form `<SOURCE_SHEET_NAME>-<TARGET_SHEET_NAME>` where the first sheet name determines link source and the second
sheet name is the target. For example a sheet named `movie-actor` contains links from nodes representing movies to nodes
representing actors.

It uses the same column rules as described for a node sheet. The first row contains column names. The first column is
used as **link label**. Link label is a text visible in the middle of the link. The other two columns are used to link
source nodes to target nodes.

### Settings sheet

This optional sheet must be named `settings` and contains two columns where the first column contains setting key and
the second column contains setting value.

Setting keys starting with `css` have special meaning and allow **styling using CSS**. These setting keys have format
`css.<SELECTOR>.<CSS_PROPERTY>`. Where if `SELECTOR` starts with a `#` sign, then it is an identifier of a HTML element
 otherwise it is a HTML class.