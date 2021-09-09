var example = {};
example.active = {}
example.init = function(params) {
    let selector = params.selector;
    let index = params.index;

    example.active[selector] = edges.newEdge({
        selector: selector,
        template: example.newExampleTemplate(),
        search_url: index + "doaj-journal/doc/_search",
        components : [
            edges.newRefiningANDTermSelector({
                id: "journal_license",
                category: "side",
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
                category: "main",
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

example.newExampleTemplate = function(params) {
    return edges.instantiate(example.ExampleTemplate, params, edges.newTemplate)
}

example.ExampleTemplate = function(params) {
    this.draw = function(edge) {
        this.edge = edge;
        let main = "";
        let mainComponents = edge.category("main");
        for (let i = 0; i < mainComponents.length; i++) {
            main += `<div id="` + mainComponents[i].id + `"></div>`;
        }

        let side = "";
        let sideComponents = edge.category("side");
        for (let i = 0; i < sideComponents.length; i++) {
            side += `<div id="` + sideComponents[i].id + `"></div>`;
        }

        let frag = `<div class="row">
            <div class="col-md-9">` + main + `</div>
            <div class="col-md-3">` + side + `</div>
        </div>`

        this.edge.context.html(frag);
    }
}
