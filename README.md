# d3sheet

**Visualize Google Spreadsheet as a D3 force graph.**

Create Google Spreadsheet with two worksheets like this:

**Movie**

| Label                    | Actor                                 |
|--------------------------|---------------------------------------|
| The Terminator           | Arnold Schwarzenegger, Linda Hamilton |
| Dante's Peak             | Linda Hamilton                        |

**Actor**

| Label                 |
|-----------------------|
| Arnold Schwarzenegger |
| Linda Hamilton        |
| Pierce Brosnan        |

... and get visual graph representation like this:

**TODO**

## Sheet rows are nodes

Single row in a sheet is a node in the graph. The only exception is the first row which contains column names.
Column names with special meaning are `id` and `label`.   

## Sheets are node groups

If you'd like to have different types of nodes, then put them into separate sheets. 

## Linking nodes

There are more ways how to link nodes. Choose whichever you like:

1. **Link by label** - Set label of linked node as a value of column named as linked node group. To link to more nodes
use comma-separated list of labels.
2. **Link by ids** - Set id of linked node as a value of column named as linked node group + **Id**. To link to more
nodes use comma-separated list of ids.
3. **Link by sheet** - Create new sheet named as **<source sheet>-<target sheet>** with two columns where in the
first row the first column contains name of column in source sheet and the second column contains name of column in
the target sheet. They both are used to identify nodes to be connected. They can be `id`, `label` or whatever you like.

