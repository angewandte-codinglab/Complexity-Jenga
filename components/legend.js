// import * as d3 from 'd3';

export function loadCentralityGraph(container) {
    // Simple Network Data
    const normalSize = 6;
    let nodes = [
        { id: 'A', size: normalSize,fill:'white' },
        { id: 'B', size: normalSize,fill:'white'  },
        { id: 'C', size: normalSize,fill:'white'  },
        { id: 'D', size: normalSize,fill:'Tomato'  },
        { id: 'E', size: normalSize,fill:'white'  },
    ];

    let links = [
        { source: 'A', target: 'B' },
        { source: 'A', target: 'C' },
        { source: 'B', target: 'D' },
        { source: 'C', target: 'D' },
        { source: 'D', target: 'E' }
    ];


    // Visualization and Animation
    const svg = d3.select(container).select('.legend-graph')
        .selectAll('svg').data([0])
        .join("svg")
        .attr('viewBox', '-150 -100 300 200')
        .attr('width', '100%').attr('height', '100%')

    const graphView = svg.selectAll('.view').data([0])
        .join("g").attr('class', 'view')

    const linkGroup = graphView.selectAll('.linkGroup').data([0])
        .join("g").attr('class', 'linkGroup')


    // Add step text
    const stepText = d3.select(container).select('.legend-text')



    let link = linkGroup.selectAll(".link")
        .data(links)
        .join("line")
        .attr("class", "link")
        .style("stroke", "black")
        .style("stroke-width", 1);


    let nodeGroup = graphView.selectAll(".nodeGroup")
        .data(nodes).join('g').attr('class', 'nodeGroup')
        .attr("node-id", d => d.id)

    let node = nodeGroup.selectAll(".node")
        .data(d => [d])
        .join("circle")
        .attr("class", "node")
        .attr("r", d => d.size)
        .style('fill', d => d.fill)
        .style("stroke", "none");

    // Add node labels inside the circles
    nodeGroup.selectAll(".label")
        .data(d => [d])
        .join("text")
        .attr("class", "label fw-bold")
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "middle")
        .attr("font-size", d => `${d.size * 0.8}`)
        .text(d => d.id);

    let simulation = d3.forceSimulation(nodes)
        .force("center", d3.forceCenter(0, 0))
        .force("link", d3.forceLink(links).id(d => d.id).strength(2))
        .force("body", d3.forceManyBody().strength(-50))
        .force("charge", d3.forceCollide().radius(d => d.r*2))
        .on("tick", () => {
            link.attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            nodeGroup.attr('transform', d => `translate(${d.x}, ${d.y})`)

            const box = graphView.node().getBBox();
            svg.attr('viewBox', `${box.x - 10} ${box.y - 10} ${box.width + 20} ${box.height + 20}`)
        });

    async function removeNode(targetNode) {
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Remove the node and its links
        const _nodes = nodes.filter(n => n.id !== targetNode);
        const _links = links.filter(l => l.source.id !== targetNode && l.target.id !== targetNode);

        // Rebind and redraw the nodes and links
        link = linkGroup.selectAll(".link")
            .data(_links)
            .join("line")
            .attr("class", "link")
            .style("stroke", "black")
            .style("stroke-width", 2);

        nodeGroup = graphView.selectAll(".nodeGroup")
            .data(_nodes).join('g').attr('class', 'nodeGroup')
            .attr("node-id", d => d.id)

        node = nodeGroup.selectAll(".node")
            .data(d => [d])
            .join("circle")
            .attr("class", "node")
            .attr("r", d => d.size)
            .attr("node-id", d => d.id)
            .style('fill', d => d.fill)
            .style("stroke", "none");

        // Redraw labels
        nodeGroup.selectAll(".label")
            .data(d => [d])
            .join("text")
            .attr("class", "label")
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "middle")
            .attr("font-size", d => `${d.size * 0.8}`)
            .text(d => d.id);

        // Restart the simulation
        simulation.nodes(_nodes);
        simulation.force("link").links(_links);
        simulation.alpha(1).restart();
    }

    async function highlightPaths(targetNode) {
        const paths = [
            ['A', 'B', 'D', 'E'],
            ['A', 'C', 'D', 'E'],
            ['B', 'D', 'E'],
            ['C', 'D', 'E']
        ];

        let sizeIncrement = normalSize;

        for (const path of paths) {
            await new Promise(resolve => setTimeout(resolve, 2000));

            const passesThrough = path.includes(targetNode);
            link.style("stroke", d => path.includes(d.source.id) && path.includes(d.target.id) ? "Tomato" : "black")
                .style("stroke-width", d => path.includes(d.source.id) && path.includes(d.target.id) ? 2 : 1);

            stepText.html(`Path: ${path.join(" → ")} ${passesThrough ? " | Passes through central node D" : " | Does not pass through node D"}`)
            if (passesThrough) {
                sizeIncrement += 2;
                node.filter(d => d.id === targetNode)
                    .transition()
                    .duration(2000)
                    .attr("r", sizeIncrement)

            }
        }

        // Final Summary
        stepText.text("Country D has high betweenness centrality");

        // Remove the critical node D
        await removeNode('D');
        stepText.html("If country D is removed, the network is destabilized.");

    }

    // Start the highlighting for node D
    highlightPaths('D');
}

export function loadPageRankGraph(container) {
    // Complex Network Data
    const normalSize = 6;
    let nodes = [
        { id: 'A', rank: 0.5, fill:'white' },
        { id: 'B', rank: 0.15,fill:'white' },
        { id: 'C', rank: 0.3,fill:'white' },
        { id: 'D', rank: 0.03, fill:"DodgerBlue" },
        { id: 'E', rank: 0.02,fill:'white' },
    ];

    let links = [
        { source: 'A', target: 'B' },
        { source: 'A', target: 'C' },
        { source: 'B', target: 'D' },
        { source: 'C', target: 'D' },
        { source: 'D', target: 'E' }
    ];

    const svg = d3.select(container).select('.legend-graph')
        .selectAll('svg').data([0])
        .join("svg")
        .attr('viewBox', '-150 -100 300 200')
        .attr('width', '100%').attr('height', '100%')

    const graphView = svg.selectAll('.view').data([0])
        .join("g").attr('class', 'view')

    const linkGroup = graphView.selectAll('.linkGroup').data([0])
        .join("g").attr('class', 'linkGroup')


    // Add step text
    const stepText = d3.select(container).select('.legend-text')

    let link = linkGroup.selectAll(".link")
        .data(links)
        .join("line")
        .attr("class", "link")
        .style("stroke", "black")
        .style("stroke-width", 2);

    let nodeGroup = graphView.selectAll(".nodeGroup")
        .data(nodes).join('g').attr('class', 'nodeGroup')
        .attr("node-id", d => d.id)

    let node = nodeGroup.selectAll(".node")
        .data(d => [d])
        .join("circle")
        .attr("class", "node")
        .attr("r", d =>{
            d.size = normalSize * 0.8 + d.rank * normalSize*2;
            return d.size;
        })
        .style('fill', d => d.fill)
        .style("stroke", "none");

    nodeGroup.selectAll(".label")
        .data(d => [d])
        .join("text")
        .attr("class", "label fw-bold")
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "middle")
        .attr("font-size", d => `${d.size * 0.8}`)
        .text(d => d.id);

    const simulation = d3.forceSimulation(nodes)
        // .force("link", d3.forceLink(links).id(d => d.id).distance(80))
        // .force("charge", d3.forceManyBody().strength(-200))
        // .force("center", d3.forceCenter(310, 300))
        .force("center", d3.forceCenter(0, 0))
        .force("link", d3.forceLink(links).id(d => d.id).strength(2))
        .force("body", d3.forceManyBody().strength(-50))
        .force("charge", d3.forceCollide().radius(d => d.r*2))
        .on("tick", () => {
            link.attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            nodeGroup.attr('transform', d => `translate(${d.x}, ${d.y})`)

            const box = graphView.node().getBBox();
            svg.attr('viewBox', `${box.x - 10} ${box.y - 10} ${box.width + 20} ${box.height + 20}`)
        });

    async function removeNode(targetNode) {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const _nodes = nodes.filter(n => n.id !== targetNode);
        const _links = links.filter(l => l.source.id !== targetNode && l.target.id !== targetNode);


        link = linkGroup.selectAll(".link")
            .data(_links)
            .join("line")
            .attr("class", "link")
            .style("stroke", "black")
            .style("stroke-width", 2);

        nodeGroup = graphView.selectAll(".nodeGroup")
            .data(_nodes).join('g').attr('class', 'nodeGroup')
            .attr("node-id", d => d.id)

        node = nodeGroup.selectAll(".node")
            .data(d => [d])
            .join("circle")
            .attr("class", "node")
            .attr("r", d => d.size)
            .attr("node-id", d => d.id)
            .style('fill', d => d.fill)
            .style("stroke", "none");

        // Redraw labels
        nodeGroup.selectAll(".label")
            .data(d => [d])
            .join("text")
            .attr("class", "label")
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "middle")
            .attr("font-size", d => `${d.size * 0.8}`)
            .text(d => d.id);

        simulation.nodes(_nodes);
        simulation.force("link").links(_links);
        simulation.alpha(1).restart();
    }

    async function animatePageRank() {
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Step 1: Highlight A, B, and C as important nodes
        node.style("fill", d => d.rank >= 0.3 ? "DodgerBlue" : "white");
        stepText.html("In this network, countries A, B, and C are the most important to preserve the integrity of the network.");
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 2: Highlight node D as less important but key for connectivity
        node.style("fill", d => d.id === 'D' ? "DodgerBlue" : "white");
        stepText.html("Although country D is key for network connectivity, it is way less important than A, B, and C.");
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 3: Remove node D and redraw the network
        await removeNode('D');
        stepText.html("While removing country D disrupts the network, the most important part of it remains interconnected.");
    }

    animatePageRank();
}

