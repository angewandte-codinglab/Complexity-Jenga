//import * as d3 from 'd3';

export function loadData() {
    return Promise.all([
        d3.csv('./data/results_semicon.csv', parse),
        d3.csv('./data/semicon_source_target_country.csv', parseNetwork)
    ]).then(([results, links]) => {

        const nodes_lookup = {};
        
        links.forEach(d => {
            if (!nodes_lookup[d.source]) nodes_lookup[d.source] = { allNeighbors: new Set(), edges: [] };
            if (!nodes_lookup[d.target]) nodes_lookup[d.target] = { allNeighbors: new Set(), edges: [] };

            d.strength = 150;

            nodes_lookup[d.source].allNeighbors.add(d.target)
            nodes_lookup[d.source].edges.push(Object.assign({}, d))
            nodes_lookup[d.target].allNeighbors.add(d.source)
            nodes_lookup[d.target].edges.push(Object.assign({}, d))
        })
        results.forEach(d => {
            nodes_lookup[d.country_iso_code] = Object.assign(d, nodes_lookup[d.country_iso_code])
        })

        return { results, links,nodes_lookup };
    });
}

function parse(d) {
    d.id = d.country_iso_code;
    d.number_of_companies = +d.number_of_companies;
    d.mean_betweeness_centrality = +d.mean_betweeness_centrality;
    d.mean_page_rank = +d.mean_page_rank;
    return d;
}

function parseNetwork(d) {
    d._id = `${d.source}-${d.target}`;
    d.value = +d.value;
    return d;
}