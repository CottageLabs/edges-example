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
    this.namespace = "example"

    this.draw = function() {
        if (!this.component.count) {
            this.component.context.html("");
            return;
        }

        let containerClass = edges.css_classes(this.namespace, "container", this);
        let labelClass = edges.css_classes(this.namespace, "label", this);
        let numberClass = edges.css_classes(this.namespace, "number", this);

        let frag = `<div class="row ` + containerClass + `">
            <div class="col-xs-12">
                <span class="` + labelClass + `">Count</span> <span class="` + numberClass + `">` + this.component.count + `</span><br>
                <span class="` + labelClass + `">Min</span> <span class="` + numberClass + `">` + this.component.min + `</span><br>
                <span class="` + labelClass + `">Max</span> <span class="` + numberClass + `">` + this.component.max + `</span><br>
                <span class="` + labelClass + `">Avg</span> <span class="` + numberClass + `">` + this.component.avg + `</span><br>
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
