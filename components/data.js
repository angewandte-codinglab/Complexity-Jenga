//import * as d3 from 'd3';

export function loadData() {
  return Promise.all([
    d3.csv('./data/results_semicon.csv', parse),
    d3.csv('./data/semicon_source_target_country.csv', parseNetwork)
  ]).then(([results, links]) => {
    // Create a lookup map from country_iso_code to region info
    const regionMap = new Map(
      results.map(d => [
        d.country_iso_code,
        {
          macro_region: d.macro_region,
          sub_region: d.sub_region
        }
      ])
    );

    // Enrich links with region metadata
    links.forEach(d => {
      const src = regionMap.get(d.source) || {};
      const tgt = regionMap.get(d.target) || {};

      d.source_macro_region = src.macro_region || null;
      d.source_sub_region = src.sub_region || null;

      d.target_macro_region = tgt.macro_region || null;
      d.target_sub_region = tgt.sub_region || null;
    });

    return { results, links };
  });
}

function parse(d) {
  d.number_of_companies = +d.number_of_companies;
  d.mean_betweeness_centrality = +d.mean_betweeness_centrality;
  d.mean_page_rank = +d.mean_page_rank;
  return d;
}

function parseNetwork(d) {
  d.value = +d.value;
  return d;
}
