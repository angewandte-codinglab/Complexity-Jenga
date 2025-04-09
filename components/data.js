// import * as d3 from 'd3';

export function loadData() {
    return d3.csv('./data/results_semicon.csv', parse);
}

function parse(d) {
    // Parse numeric values
    d.number_of_companies = +d.number_of_companies;
    d.mean_betweeness_centrality = +d.mean_betweeness_centrality;
    d.mean_page_rank = +d.mean_page_rank;
    return d;
}
