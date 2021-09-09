var doajreport = {};
doajreport.active = {}

doajreport.init = function(params) {
    let selector = params.selector;
    let index = params.index;

    $(selector).html(`
        <h1>NGLP Demo Dashboard</h1>
        <h2>Overview</h2>
        <div id="highlight"></div>
        <div id="journal_histogram"></div>
        <h2>Workflow</h2>
        <div id="workflow-overview"></div>
        <div id="workflow-details"></div>
        <h2>Notifications</h2>
        <div id="oldest-applications"></div>
        <h2>Geography</h2>
        <div id="geography"></div>
    `);

    doajreport.active["#highlight"] = edges.newEdge({
        selector: "#highlight",
        template: doajreport.templates.newComponentList(),
        search_url: index + "doaj-journal/doc/_search",
        baseQuery : es.newQuery({
            must: [
                es.newTermFilter({
                    field: "admin.in_doaj",
                    value: true
                })
            ],
            size: 0,
            aggs : [
                es.newCardinalityAggregation({
                    name : "languages",
                    field: "bibjson.language.exact"
                }),
                es.newCardinalityAggregation({
                    name: "countries",
                    field: "bibjson.publisher.country.exact"
                }),
                es.newTermsAggregation({
                    name: "apc",
                    field: "index.has_apc.exact"
                })
            ]
        }),
        components : [
            edges.numbers.newImportantNumbers({
                id: "language_count",
                calculate : function(component) {
                    let values = {main: false, second: false};
                    if (component.edge.result) {
                        let agg = component.edge.result.aggregation("languages");
                        values.main = agg.value;
                    }
                    return values;
                },
                renderer: edges.bs3.newImportantNumbersRenderer({
                    title: "Languages"
                })
            }),
            edges.numbers.newImportantNumbers({
                id: "country_count",
                calculate : function(component) {
                    let values = {main: false, second: false};
                    if (component.edge.result) {
                        let agg = component.edge.result.aggregation("countries");
                        values.main = agg.value;
                    }
                    return values;
                },
                renderer: edges.bs3.newImportantNumbersRenderer({
                    title: "Countries"
                })
            })
        ],
    });

    doajreport.active["#journal_histogram"] = edges.newEdge({
        selector: "#journal_histogram",
        template: doajreport.templates.newSingleComponent(),
        search_url: index + "doaj-journal/doc/_search",
        baseQuery : es.newQuery({
            must: [
                es.newRangeFilter({
                    "field" : "last_updated",
                    "gte" : "2019-01-01"
                })
            ],
            size: 0,
            aggs : [
                es.newDateHistogramAggregation({
                    name: "created_date",
                    field: "created_date",
                    interval: "month"
                }),
                es.newDateHistogramAggregation({
                    name: "last_updated",
                    field: "last_updated",
                    interval: "month"
                }),
            ]
        }),
        components : [
            edges.newMultibar({
                id: "dates_histogram",
                display: "<h3>Created vs Last Updated Dates</h3>",
                dataFunction : doajreport.datafunctions.dateHistogram({
                    from: "2019-01-01",
                    until: "2021-01-01",
                    aggs: ["created_date", "last_updated"]
                }),
                renderer : edges.nvd3.newMultibarRenderer({
                    showLegend: true,
                    xTickFormat: function(tick) {
                        let d = new Date(tick)
                        return d.getUTCFullYear() + "-" + (d.getUTCMonth() + 1)
                    },
                    xAxisLabel: "Month",
                    yAxisLabel: "Count"
                })
            }),
        ],
    });


    doajreport.active["#workflow-overview"] = edges.newEdge({
        selector: "#workflow-overview",
        template: doajreport.templates.newSingleComponent(),
        search_url: index + "doaj-application/doc/_search",
        baseQuery : es.newQuery({
            must: [
                es.newTermsFilter({
                    field : "admin.application_status.exact",
                    values : ["update_request", "revisions_required", "pending", "in progress", "completed", "on hold", "ready"]
                })
            ],
            size: 0,
            aggs : [
                es.newTermsAggregation({
                    name: "application_status",
                    field: "admin.application_status.exact",
                    aggs : [
                        es.newDateHistogramAggregation({
                            name: "created_date",
                            field: "created_date",
                            interval: "month"
                        })
                    ]
                })
            ]
        }),
        components : [
            edges.newMultibar({
                id: "workflow_histogram",
                display: "<h3>Workflow Progress</h3>",
                dataFunction : doajreport.datafunctions.workflow(),
                renderer : edges.nvd3.newMultibarRenderer({
                    showLegend: true,
                    xTickFormat: false,
                    xAxisLabel: "Status",
                    yAxisLabel: "Age"
                })
            }),
        ],
    });

    doajreport.active["#workflow-details"] = edges.newEdge({
        selector: "#workflow-details",
        template: doajreport.templates.newComponentList(),
        search_url: index + "doaj-application/doc/_search",
        baseQuery : es.newQuery({
            must: [
                es.newTermsFilter({
                    field : "admin.application_status.exact",
                    values : ["update_request", "revisions_required", "pending", "in progress", "completed", "on hold", "ready"]
                })
            ],
            size: 0,
            aggs : [
                es.newTermsAggregation({
                    name: "application_status",
                    field: "admin.application_status.exact",
                    aggs : [
                        es.newDateHistogramAggregation({
                            name: "created_date",
                            field: "created_date",
                            interval: "month"
                        })
                    ]
                })
            ]
        }),
        components : [
            edges.newMultibar({
                id: "age_of_applications",
                display: "<h3>Age of Applications by Status</h3>",
                dataFunction: doajreport.datafunctions.workflowDetails({
                    status: "update_request"
                }),
                renderer: edges.nvd3.newMultibarRenderer({
                    showLegend: true,
                    xTickFormat: false,
                    xAxisLabel: "Age",
                    yAxisLabel: "Count"
                })
            })
        ],
    });

    doajreport.active["#oldest-applications"] = edges.newEdge({
        selector: "#oldest-applications",
        template: doajreport.templates.newComponentList({
            title: "<h3>Oldest unfinished applications</h3>"
        }),
        search_url: index + "doaj-application/doc/_search",
        baseQuery : es.newQuery({
            must: [
                es.newTermsFilter({
                    field : "admin.application_status.exact",
                    values : ["update_request", "revisions_required", "pending", "in progress", "completed", "on hold", "ready"]
                })
            ],
            size: 10,
            sort: [
                es.newSort({
                    field: "created_date",
                    order: "asc"
                })
            ]
        }),
        components : [
            edges.newResultsDisplay({
                id: "oldest-list",
                renderer: edges.bs3.newResultsFieldsByRowRenderer({
                    rowDisplay: [
                        [{
                            field: "bibjson.title"
                        }],
                        [{
                            field: "index.issn"
                        }],
                        [
                            { field: "created_date", post: " "},
                            { field: "admin.editor", pre: "Editor:", post: " " },
                            { field: "admin.editor_group", pre: "Group:", post: " "}
                        ]
                    ]
                })
            })
        ],
    });

    doajreport.active["#geography"] = edges.newEdge({
        selector: "#geography",
        staticFiles : [
            {
                "id" : "country_geo",
                "url" : "/edges/src/data/countries.csv",
                "processor" : edges.csv.newObjectByRow,
                "datatype" : "text"
            }
        ],
        template: doajreport.templates.newComponentList({
            title: "<h1>Where are journals published</h1>"
        }),
        search_url: index + "doaj-journal/doc/_search",
        baseQuery : es.newQuery({
            size: 0,
            aggs: [
                es.newTermsAggregation({
                    name: "countries",
                    field: "bibjson.publisher.country",
                    size: 500
                })
            ]
        }),
        components : [
            doajreport.components.newCountryListMap({
                id: "country-list-map",
                agg: "countries",
                renderer: edges.google.newMapViewRenderer()
            })
        ],
    });

}

doajreport.components = {
    newCountryListMap : function(params) {
        return edges.instantiate(doajreport.components.CountryListMap, params, edges.newComponent);
    },
    CountryListMap : function(params) {
        this.agg = params.agg;

        this.locations = [];
        this.centre = {lat: 17, lon: 0};

        this.synchronise = function() {
            this.locations = [];
            this.centre = {lat: 17, lon: 0};

            // read the locations out of the results
            if (this.edge.result) {
                let buckets = this.edge.result.aggregation(this.agg).buckets;
                for (let i = 0; i < buckets.length; i++) {
                    let bucket = buckets[i];
                    let lookup = this.edge.resources.country_geo.iterator()
                    let next = lookup.next();
                    while (next) {
                        if (next.code.toLowerCase() === bucket.key.toLowerCase()) {
                            let ll = {};
                            ll["lat"] = parseFloat(next.lat);
                            ll["lon"] = parseFloat(next.lon);
                            this.locations.push(ll);
                            break;
                        }
                        next = lookup.next();
                    }
                }
            }
        }
    }
}

doajreport.templates = {
    newSingleComponent : function(params) {
        return edges.instantiate(doajreport.templates.SingleComponent, params, edges.newTemplate);
    },
    SingleComponent : function(params) {
        this.draw = function(edge) {
            this.edge = edge;
            let frag = `<div id="` + edge.components[0].id + `"></div>`;
            this.edge.context.html(frag);
        }
    },

    newComponentList : function(params) {
        return edges.instantiate(doajreport.templates.ComponentList, params, edges.newTemplate);
    },
    ComponentList : function(params) {
        this.title = params.title || "";

        this.draw = function(edge) {
            this.edge = edge;
            let frag = this.title;
            for (let i = 0; i < edge.components.length; i++) {
                frag += `<div id="` + edge.components[i].id + `"></div>`;
            }
            this.edge.context.html(frag);
        }
    }
};

doajreport.datafunctions = {
    workflowDetails : function(params) {
        let status = params.status;

        return function(component) {
            var data_series = [];
            if (!component.edge.result) {
                return data_series;
            }

            let today = new Date();
            let msd = 1000 * 60 * 60 * 24;

            let buckets = component.edge.result.aggregation("application_status").buckets;
            for (let i = 0; i < buckets.length; i++) {
                let bucket = buckets[i];
                let series = {key: bucket.key, values: []};
                data_series.push(series);

                let hist = bucket.created_date.buckets;
                for (let j = 0; j < hist.length; j++) {
                    let cd = hist[j];
                    let age = Math.ceil((today - (new Date(cd.key))) / msd);
                    series.values.push({label: age, value: cd.doc_count});
                }
            }
            return data_series;
        }
    },

    workflow : function(params) {
        return function(component) {
            var data_series = [];
            if (!component.edge.result) {
                return data_series;
            }

            let oldest = {
                key: "Oldest",
                values: []
            }
            let mean = {
                key: "Mean Age",
                values: []
            }
            data_series.push(oldest);
            data_series.push(mean);

            let today = new Date();
            let msd = 1000 * 60 * 60 * 24;

            let buckets = component.edge.result.aggregation("application_status").buckets;
            for (let i = 0; i < buckets.length; i++) {
                let bucket = buckets[i];
                let status = bucket.key;

                let o = false;
                let t = 0;
                let j = 0;
                for (j = 0; j < bucket.created_date.buckets.length; j++) {
                    let hist = bucket.created_date.buckets[j];
                    let age = Math.ceil((today - (new Date(hist.key))) / msd);
                    if (o === false) {
                        o = age;
                    }
                    t += age;
                }
                let avg = Math.ceil(t / j);

                oldest.values.push({label: status, value: o});
                mean.values.push({label: status, value: avg});
            }

            return data_series;
        }
    },

    dateHistogram : function(params) {
        let from = new Date(params.from);
        let until = new Date(params.until);
        let aggs = params.aggs;

        return function(component) {
            var data_series = [];
            if (!component.edge.result) {
                return data_series;
            }

            for (let i = 0; i < aggs.length; i++) {
                let agg = aggs[i];

                let series = {};
                series["key"] = agg;
                series["values"] = [];

                let buckets = component.edge.result.aggregation(agg).buckets
                for (let j = 0; j < buckets.length; j++) {
                    let bucket = buckets[j];
                    let date = new Date(bucket.key);
                    if (date >= from && date <= until) {
                        series.values.push({label: bucket.key_as_string, value: bucket.doc_count})
                    }
                }

                data_series.push(series);
            }

            return data_series;
        }
    }
};