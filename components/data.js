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

// export function createDropdown(container, id, options, selected, callback) {
//     // Clear any existing dropdown
//     container.selectAll(`#${id}`).remove();
    
//     // Create dropdown container
//     const dropdown = container
//         .append('div')
//         .attr('id', id)
//         .attr('class', 'dropdown');
    
//     // Create selected display
//     const selectedDisplay = dropdown
//         .append('div')
//         .attr('class', 'selected-option')
//         .text(selected.name);
    
//     // Create dropdown options
//     const dropdownOptions = dropdown
//         .append('div')
//         .attr('class', 'dropdown-options')
//         .style('display', 'none');
    
//     // Add options
//     options.forEach(option => {
//         dropdownOptions
//             .append('div')
//             .attr('class', 'dropdown-option')
//             .text(option.name)
//             .on('click', function() {
//                 selectedDisplay.text(option.name);
//                 dropdownOptions.style('display', 'none');
//                 callback(option);
//             });
//     });
    
//     // Toggle dropdown on click
//     selectedDisplay.on('click', function() {
//         const isVisible = dropdownOptions.style('display') !== 'none';
//         dropdownOptions.style('display', isVisible ? 'none' : 'block');
//     });
    
//     // Close dropdown when clicking elsewhere
//     document.addEventListener('click', function(event) {
//         if (!dropdown.node().contains(event.target)) {
//             dropdownOptions.style('display', 'none');
//         }
//     });
    
//     return dropdown;
// }