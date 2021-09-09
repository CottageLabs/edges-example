var example = {};
example.active = {}
example.init = function(params) {
    let selector = params.selector;
    let index = params.index;

    example.active[selector] = edges.newEdge({
        selector: selector,
        template: edges.bs3.newFacetview(),
        search_url: index + "doaj-journal/doc/_search",
        components : [
            edges.newRefiningANDTermSelector({
                id: "journal_license",
                category: "facet",
                field: "index.license.exact",
                display: "Journal License",
                renderer: edges.bs3.newRefiningANDTermSelectorRenderer({
                    controls: true,
                    open: true,
                    togglable: true
                })
            }),
            edges.newResultsDisplay({
                id: "results",
                category: "results",
                renderer: edges.bs3.newResultsFieldsByRowRenderer({
                    rowDisplay : [
                        [{ field: "bibjson.title" }],
                        [{
                            "pre" : "<strong>Editor Group</strong>: ",
                            "field" : "admin.editor_group"
                        }]
                    ]
                })
            })
        ],
    });
}