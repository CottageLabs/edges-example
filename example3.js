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
            example.newExampleComponent({
                id: "stats",
                category: "side",
                renderer: example.newExampleRenderer()
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

example.newExampleComponent = function(params) {
    return edges.instantiate(example.ExampleComponent, params, edges.newComponent)
}
example.ExampleComponent = function (params) {

    this.count = false;
    this.min = false;
    this.max = false;
    this.avg = false;

    this.contrib = function(query) {
        query.addAggregation(es.newStatsAggregation({"name" : "stats", "field" : "bibjson.apc.max.price"}))
    }

    this.synchronise = function() {
        this.count = false;
        this.min = false;
        this.max = false;
        this.avg = false;

        if (!this.edge.result) {
            return
        }

        let agg = this.edge.result.aggregation("stats");

        this.count = agg.count;
        this.min = agg.min;
        this.max = agg.max;
        this.avg = agg.avg;
    }
}

example.newExampleRenderer = function(params) {
    return edges.instantiate(example.ExampleRenderer, params, edges.newRenderer)
}
example.ExampleRenderer = function(params) {
    this.draw = function() {
        if (!this.component.count) {
            this.component.context.html("");
        }

        let frag = `<div class="row">
            <div class="col-xs-12">
                Count: ` + this.component.count + `<br>
                Min: ` + this.component.min + `<br>
                Max: ` + this.component.max + `<br>
                Avg: ` + this.component.avg + `<br>
            </div>
        </div>`
        this.component.context.html(frag);
    }
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
