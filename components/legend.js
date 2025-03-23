// import * as d3 from 'd3';

export function loadCentralityGraph(container) {
    // Simple Network Data
    let nodes = [
        { id: 'A' },
        { id: 'B' },
        { id: 'C' },
        { id: 'D', size: 10 },
        { id: 'E' }
    ];

    let links = [
        { source: 'A', target: 'B' },
        { source: 'A', target: 'C' },
        { source: 'B', target: 'D' },
        { source: 'C', target: 'D' },
        { source: 'D', target: 'E' }
    ];

    // Visualization and Animation
    const svg = d3.select(container)
        .append("svg")
        .attr("width", 466)
        .attr("height", 500);

    // Add explanation text
    const titleText = svg.append("text")
        .attr("x", 5)
        .attr("y", 25)
        .attr("font-size", "16px")
        .style("font-weight", "bold")
        .style("fill", "black")
        .text("Betweenness Centrality - Connectivity of Countries");

    const explanationText = svg.append("foreignObject")
        .attr("x", 5)
        .attr("y", 40)
        .attr("width", 450)
        .attr("height", 200)
        .append("xhtml:div")
        .style("font-size", "12px")
        .style("color", "black")
        .style("text-align", "justify")
        .style("word-wrap", "break-word")
        .text("Betweenness Centrality helps identify those crucial intermediary countries. Think of it as measuring how often a country acts as a bridge between others. A country with high betweenness centrality is one where many supply routes must pass through to connect different parts of the network. If such a country becomes unstable or is disrupted, it can break multiple supply chains simultaneously. Imagine Country D acting as a bridge between major suppliers and manufacturers — its failure would leave entire regions disconnected from critical components. Most network paths go through node D, which makes it increase in size and thus importance.");

    // Add step text
    const stepText = svg.append("foreignObject")
		.attr("x", 5)
		.attr("y", 450)
		.attr("width", 420)
		.attr("height", 60)
		.append("xhtml:div")
		.style("font-size", "12px")
		.style("color", "black")
		.style("text-align", "justify")
		.style("word-wrap", "break-word")
		.text("");


    let link = svg.selectAll(".link")
        .data(links)
        .enter().append("line")
        .attr("class", "link")
        .style("stroke", "black")
        .style("stroke-width", 2);

    let node = svg.selectAll(".node")
        .data(nodes)
        .enter().append("circle")
        .attr("class", "node")
        .attr("r", d => d.size || 15)
        .attr("node-id", d => d.id)
        .style("fill", d => d.id === 'D' ? "red" : "white")
        .style("stroke", "black");

    // Add node labels inside the circles
    svg.selectAll(".label")
        .data(nodes)
        .enter().append("text")
        .attr("class", "label")
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "middle")
        .attr("font-size", "14px")
        .text(d => d.id);

    let simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(80))
        .force("charge", d3.forceManyBody().strength(-200))
        .force("center", d3.forceCenter(310, 300))
        .on("tick", () => {
            link.attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node.attr("cx", d => d.x)
                .attr("cy", d => d.y);

            svg.selectAll(".label")
                .attr("x", d => d.x)
                .attr("y", d => d.y);
        });

    async function removeNode(targetNode) {
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Remove the node and its links
        nodes = nodes.filter(n => n.id !== targetNode);
        links = links.filter(l => l.source.id !== targetNode && l.target.id !== targetNode);

        // Clear existing elements
        svg.selectAll(".node").remove();
        svg.selectAll(".link").remove();
        svg.selectAll(".label").remove();

        // Rebind and redraw the nodes and links
        link = svg.selectAll(".link")
            .data(links)
            .enter().append("line")
            .attr("class", "link")
            .style("stroke", "black")
            .style("stroke-width", 2);

        node = svg.selectAll(".node")
            .data(nodes)
            .enter().append("circle")
            .attr("class", "node")
            .attr("r", d => d.size || 15)
            .attr("node-id", d => d.id)
            .style("fill", d => d.id === 'D' ? "red" : "white")
            .style("stroke", "black");

        // Redraw labels
        svg.selectAll(".label")
            .data(nodes)
            .enter().append("text")
            .attr("class", "label")
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "middle")
            .attr("font-size", "14px")
            .text(d => d.id);

        // Restart the simulation
        simulation.nodes(nodes);
        simulation.force("link").links(links);
        simulation.alpha(1).restart();
    }

    async function highlightPaths(targetNode) {
        const paths = [
            ['A', 'B', 'D', 'E'],
            ['A', 'C', 'D', 'E'],
            ['B', 'D', 'E'],
            ['C', 'D', 'E']
        ];

        let sizeIncrement = 20;

        for (const path of paths) {
            await new Promise(resolve => setTimeout(resolve, 2000));

            const passesThrough = path.includes(targetNode);
            link.style("stroke", d => path.includes(d.source.id) && path.includes(d.target.id) ? "red" : "black")
                .style("stroke-width", d => path.includes(d.source.id) && path.includes(d.target.id) ? 4 : 2);

            stepText.text("Path: " + path.join(" → ") + (passesThrough ? " | Passes through central node D" : " | Does not pass through node D"));

            if (passesThrough) {
                sizeIncrement += 5;
                svg.select("circle[node-id='" + targetNode + "']")
                    .transition()
                    .duration(2000)
                    .attr("r", sizeIncrement)
                    .style("fill", "red")
                    .style("stroke", "black");
            }
        }

        // Final Summary
        stepText.text("Node D has high betweenness centrality");
        
        // Remove the critical node D
        await removeNode('D');
        stepText.text("If Node D is removed, the network is destabilized.");
    }

    // Start the highlighting for node D
    highlightPaths('D');
}

export function loadPageRankGraph(container) {
    // Complex Network Data
    let nodes = [
        { id: 'A', rank: 0.5 },
        { id: 'B', rank: 0.15 },
        { id: 'C', rank: 0.3 },
        { id: 'D', rank: 0.03 },
        { id: 'E', rank: 0.02 }
    ];

    let links = [
        { source: 'A', target: 'B' },
        { source: 'A', target: 'C' },
        { source: 'B', target: 'D' },
        { source: 'C', target: 'D' },
        { source: 'D', target: 'E' }
    ];

    const svg = d3.select(container)
        .append("svg")
        .attr("width", 466)
        .attr("height", 500);

    const titleText = svg.append("text")
        .attr("x", 5)
        .attr("y", 25)
        .attr("font-size", "16px")
        .style("font-weight", "bold")
        .style("fill", "black")
        .text("PageRank - Importance of Countries");
	
	const stepText = svg.append("foreignObject")
    .attr("x", 5)
    .attr("y", 450)
    .attr("width", 420)
    .attr("height", 60)
    .append("xhtml:div")
    .style("font-size", "12px")
    .style("color", "black")
    .style("text-align", "justify")
    .style("word-wrap", "break-word")
    .text("");

    const explanationText = svg.append("foreignObject")
        .attr("x", 5)
        .attr("y", 40)
        .attr("width", 450)
        .attr("height", 100)
        .append("xhtml:div")
        .style("font-size", "12px")
        .style("color", "black")
        .style("text-align", "justify")
        .style("word-wrap", "break-word")
        .text("PageRank measures a country's importance based on incoming links from other important countries. A node is crucial if it is linked by other significant nodes. High PageRank indicates a hub of production or a key supplier. If disrupted, it affects not just direct connections but also downstream dependencies.");

    let link = svg.selectAll(".link")
        .data(links)
        .enter().append("line")
        .attr("class", "link")
        .style("stroke", "black")
        .style("stroke-width", 2);

    let node = svg.selectAll(".node")
        .data(nodes)
        .enter().append("circle")
        .attr("class", "node")
        .attr("r", d => 10 + d.rank * 50)
        .attr("node-id", d => d.id)
        .style("fill", d => d.id === 'D' ? "#1f77b4" : "white")
        .style("stroke", "black");

    svg.selectAll(".label")
        .data(nodes)
        .enter().append("text")
        .attr("class", "label")
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "middle")
        .attr("font-size", "14px")
        .text(d => d.id);

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(80))
        .force("charge", d3.forceManyBody().strength(-200))
        .force("center", d3.forceCenter(310, 300))
        .on("tick", () => {
            link.attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node.attr("cx", d => d.x)
                .attr("cy", d => d.y);

            svg.selectAll(".label")
                .attr("x", d => d.x)
                .attr("y", d => d.y);
        });

    async function removeNode(targetNode) {
        await new Promise(resolve => setTimeout(resolve, 1000));

        nodes = nodes.filter(n => n.id !== targetNode);
        links = links.filter(l => l.source.id !== targetNode && l.target.id !== targetNode);

        svg.selectAll(".node").remove();
        svg.selectAll(".link").remove();
        svg.selectAll(".label").remove();

        link = svg.selectAll(".link")
            .data(links)
            .enter().append("line")
            .attr("class", "link")
            .style("stroke", "black")
            .style("stroke-width", 2);

        node = svg.selectAll(".node")
            .data(nodes)
            .enter().append("circle")
            .attr("class", "node")
            .attr("r", d => 10 + d.rank * 50)
            .attr("node-id", d => d.id)
            .style("fill", "white")
            .style("stroke", "black");

        svg.selectAll(".label")
            .data(nodes)
            .enter().append("text")
            .attr("class", "label")
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "middle")
            .attr("font-size", "14px")
            .text(d => d.id);

        simulation.nodes(nodes);
        simulation.force("link").links(links);
        simulation.alpha(1).restart();
    }

    async function animatePageRank() {
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Step 1: Highlight A, B, and C as important nodes
        node.style("fill", d => d.rank >= 0.3 ? "#1f77b4" : "white");
        stepText.text("In this network, Nodes A, B, and C are the most important to preserve the integrity of the network.");
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 2: Highlight node D as less important but key for connectivity
        node.style("fill", d => d.id === 'D' ? "#1f77b4" : "white");
        stepText.text("Although node D is key for network connectivity, it is way less important than A, B, and C.");
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 3: Remove node D and redraw the network
        await removeNode('D');
        stepText.text("While removing node D disrupts the network, the most important part of it remains interconnected.");
    }

    animatePageRank();
}



export function loagTilesGraph(container) {
    // Complex Network Data
    // Simple Network Data
    let nodes = [
        { id: 'A', rank: 0.5 },
        { id: 'B', rank: 0.15  },
        { id: 'C', rank: 0.3 },
        { id: 'D', rank: 0.03 },
        { id: 'E', rank: 0.02  }
    ];

    let links = [
        { source: 'A', target: 'B' },
        { source: 'A', target: 'C' },
        { source: 'B', target: 'D' },
        { source: 'C', target: 'D' },
        { source: 'D', target: 'E' }
    ];

    const svg = d3.select(container)
        .append("svg")
        .attr("width", 466)
        .attr("height", 500);

    // Add explanation text
    const titleText = svg.append("text")
        .attr("x", 5)
        .attr("y", 25)
        .attr("font-size", "16px")
        .style("font-weight", "bold")
        .style("fill", "black")
        .text("PageRank - Importance of Countries");

    const explanationText = svg.append("foreignObject")
        .attr("x", 5)
        .attr("y", 40)
        .attr("width", 450)
        .attr("height", 100)
        .append("xhtml:div")
        .style("font-size", "12px")
        .style("color", "black")
        .style("text-align", "left")
        .style("word-wrap", "break-word")
        .text("PageRank measures a country's importance based on incoming links from other important countries. A node is crucial if it is linked by other significant nodes. High PageRank indicates a hub of production or a key supplier. If disrupted, it affects not just direct connections but also downstream dependencies.");

    let link = svg.selectAll(".link")
        .data(links)
        .enter().append("line")
        .attr("class", "link")
        .style("stroke", "black")
        .style("stroke-width", 2);

    let node = svg.selectAll(".node")
        .data(nodes)
        .enter().append("circle")
        .attr("class", "node")
        .attr("r", d => 10 + d.rank * 50)
        .attr("node-id", d => d.id)
        .style("fill", d => d.rank >= 0.35 ? "#1f77b4" : "white")
        .style("stroke", "black");

    svg.selectAll(".label")
        .data(nodes)
        .enter().append("text")
        .attr("class", "label")
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "middle")
        .attr("font-size", "14px")
        .text(d => d.id);

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(80))
        .force("charge", d3.forceManyBody().strength(-200))
        .force("center", d3.forceCenter(310, 300))
        .on("tick", () => {
            link.attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node.attr("cx", d => d.x)
                .attr("cy", d => d.y);

            svg.selectAll(".label")
                .attr("x", d => d.x)
                .attr("y", d => d.y);
        });

    async function animatePageRank() {
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Gradually increase node sizes
        node.transition()
            .duration(1000)
            .attr("r", d => 10 + d.rank * 50);

        // Highlight important links
        link.transition()
            .duration(1000)
            .style("stroke", d => d.target.id === 'D' ? "orange" : "black");

        // Wait before removing the important node (D)
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Show final text about impact
        svg.append("text")
            .attr("x", 20)
            .attr("y", 450)
            .attr("font-size", "12px")
            .style("fill", "black")
            .text("Removing the small node D will not have a great impact on the network.");

         // Remove the critical node D
        await removeNode('D');
        stepText.text("If Node D is removed, the network is destabilized.");
    }

    animatePageRank();
}
