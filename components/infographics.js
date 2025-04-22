
import { state } from './state.js';
import { loadData } from './data.js';
import { removeAllBlocks, createObjects } from './physics.js';

export function loadGlobalNetworkGraph(containerId) {
  const container = d3.select(`#${containerId}`);
  container.selectAll('*').remove();
	loadData().then(({ links }) => {
	// Aggregate bidirectional links into link value
	  const linkMap = new Map();
	  links.forEach(d => {
		const key = d.source < d.target
		  ? `${d.source}|${d.target}`
		  : `${d.target}|${d.source}`;

		if (!linkMap.has(key)) {
		  linkMap.set(key, {
			source: d.source < d.target ? d.source : d.target,
			target: d.source < d.target ? d.target : d.source,
			value: 0,
			source_macro_region: d.source_macro_region,
			target_macro_region: d.target_macro_region,
		  });
		}
		linkMap.get(key).value += d.value;
	  });
	links = Array.from(linkMap.values());


    const containerNode = container.node();
    const width = containerNode.getBoundingClientRect().width;
    const height = 500;

    const svg = container.append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('width', `${width}px`)
      .style('height', `${height}px`);

    // Create nodes from links
    const nodesMap = new Map();
    links.forEach(link => {
      if (!nodesMap.has(link.source)) {
        nodesMap.set(link.source, {
          id: link.source,
          region: link.source_macro_region || 'Other'
        });
      }
      if (!nodesMap.has(link.target)) {
        nodesMap.set(link.target, {
          id: link.target,
          region: link.target_macro_region || 'Other'
        });
      }
    });
    let nodes = Array.from(nodesMap.values());

    // Scales
    const valueExtent = d3.extent(links, d => d.value);
    const thicknessScale = d3.scaleLinear().domain(valueExtent).range([0.5, 8]);
    const opacityScale = d3.scaleLinear().domain(valueExtent).range([0.2, 1]);

    // First simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-180))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(24));

    const link = svg.append('g')
      .attr('stroke-linecap', 'round')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', d => thicknessScale(d.value))
      .attr('stroke-opacity', d => opacityScale(d.value))
      .attr('stroke', d =>
        d.source === 'US' || d.source.id === 'US' || d.target === 'US' || d.target.id === 'US'
          ? 'red'
          : 'black'
      );

    const node = svg.append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', d => d.id === 'US' ? 12 : 8)
      .attr('stroke', 'black')
      .attr('stroke-width', 1.2)
      .attr('fill', d => state.colorScale(d.region || 'Other'))
      .call(drag(simulation));

    const label = svg.append('g')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .text(d => d.id)
      .attr('font-size', 9)
      .attr('fill', '#000')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.3em')
      .attr('pointer-events', 'none');

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);

      label
        .attr('x', d => d.x)
        .attr('y', d => d.y);
    });

    // After 4s, remove US + its links and redraw
    setTimeout(() => {
      const remainingNodes = nodes.filter(n => n.id !== 'US');

      // Filter out links connected to US
      const remainingLinks = links.filter(
        d =>
          (typeof d.source === 'string' ? d.source !== 'US' : d.source.id !== 'US') &&
          (typeof d.target === 'string' ? d.target !== 'US' : d.target.id !== 'US')
      );

      simulation.stop();
      svg.selectAll('*').remove();

      const sim2 = d3.forceSimulation(remainingNodes)
        .force('link', d3.forceLink(remainingLinks).id(d => d.id).distance(100))
        .force('charge', d3.forceManyBody().strength(-180))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(24));

      const link2 = svg.append('g')
        .attr('stroke', 'black')
        .selectAll('line')
        .data(remainingLinks)
        .join('line')
        .attr('stroke-width', d => thicknessScale(d.value))
        .attr('stroke-opacity', d => opacityScale(d.value));

      const node2 = svg.append('g')
        .selectAll('circle')
        .data(remainingNodes)
        .join('circle')
        .attr('r', 8)
        .attr('stroke', 'black')
        .attr('stroke-width', 1.2)
        .attr('fill', d => state.colorScale(d.region || 'Other'))
        .call(drag(sim2));

      const label2 = svg.append('g')
        .selectAll('text')
        .data(remainingNodes)
        .join('text')
        .text(d => d.id)
        .attr('font-size', 9)
        .attr('fill', '#000')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.3em')
        .attr('pointer-events', 'none');

      sim2.on('tick', () => {
        link2
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y);

        node2
          .attr('cx', d => d.x)
          .attr('cy', d => d.y);

        label2
          .attr('x', d => d.x)
          .attr('y', d => d.y);
      });
    }, 4000);
  });
}

function drag(simulation) {
  return d3.drag()
    .on('start', (event, d) => {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    })
    .on('drag', (event, d) => {
      d.fx = event.x;
      d.fy = event.y;
    })
    .on('end', (event, d) => {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    });
}
	