//import * as d3 from 'd3';
import { showUserError } from './main.js';

export function loadData() {
    return Promise.all([
        d3.csv('./data/results_semicon.csv', parse).catch(error => {
            console.error('Failed to load results_semicon.csv:', error);
            showUserError('Failed to load semiconductor data. Please check your connection and try again.');
            throw error;
        }),
        d3.csv('./data/semicon_source_target_country.csv', parseNetwork).catch(error => {
            console.error('Failed to load semicon_source_target_country.csv:', error);
            showUserError('Failed to load network data. Please check your connection and try again.');
            throw error;
        })
    ]).then(([results, links]) => {
        // Validate loaded data
        if (!results || results.length === 0) {
            throw new Error('No country data loaded');
        }
        if (!links || links.length === 0) {
            throw new Error('No network connection data loaded');
        }

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

        // Final validation
        validateProcessedData({ results, links, nodes_lookup });
        
        return { results, links,nodes_lookup };
    });
}

function validateProcessedData(data) {
    const { results, links } = data;
    
    // Check for required data structure
    if (!results.some(d => d.country_iso_code && d.country)) {
        throw new Error('Invalid data structure: missing country information');
    }
    
    // Validate numeric ranges
    const invalidCentrality = results.filter(d => 
        isNaN(d.mean_betweeness_centrality) || 
        d.mean_betweeness_centrality < 0 || 
        d.mean_betweeness_centrality > 1
    );
    
    if (invalidCentrality.length > 0) {
        console.warn(`Found ${invalidCentrality.length} countries with invalid centrality values`);
    }
    
    const invalidPageRank = results.filter(d => 
        isNaN(d.mean_page_rank) || d.mean_page_rank < 0
    );
    
    if (invalidPageRank.length > 0) {
        console.warn(`Found ${invalidPageRank.length} countries with invalid PageRank values`);
    }
    
    console.log(`✅ Data validation complete: ${results.length} countries, ${links.length} connections`);
}

function parse(d) {
    // Validate required fields
    if (!d.country_iso_code || !d.country) {
        console.warn('Missing required fields for country:', d);
        return null;
    }
    
    // Sanitize and validate data
    d.id = d.country_iso_code.trim().toUpperCase();
    d.country = d.country.trim();
    d.number_of_companies = Math.max(0, +d.number_of_companies || 0);
    d.mean_betweeness_centrality = Math.max(0, Math.min(1, +d.mean_betweeness_centrality || 0));
    d.mean_page_rank = Math.max(0, +d.mean_page_rank || 0);
    
    return d;
}

function parseNetwork(d) {
    // Validate required network fields
    if (!d.source || !d.target) {
        console.warn('Missing required network fields:', d);
        return null;
    }
    
    // Sanitize network data
    d._id = `${d.source.trim()}-${d.target.trim()}`;
    d.source = d.source.trim();
    d.target = d.target.trim();
    d.value = Math.max(0, +d.value || 1); // Default value of 1 for connections
    
    return d;
}