import { state } from './state.js';
// import { loadData } from './data.js';
import { removeAllBlocks, createObjects } from './physics.js';

export function loadGlobalNetworkGraph(containerId, countryCode) {
    const container = d3.select(`#${containerId}`);
    // console.log(countryCode, state.datasets, container.node());

    networkGraph(container, { nodes: state.datasets.results, links: state.datasets.links })(countryCode)
}

function networkGraph(_, data) {
    const node = _;
    let _width = null;
    let _height = null;

    const update = {};

    const fakeNodes = [],
        nodeXY = {};
    const count = data.nodes.length;
    const maxR = 6;
    const [h, w] = [maxR * 35, count * maxR]
    const xy = { x: -w / 2, y: -h / 2 }
    const _count = h * w / maxR / maxR;
    for (let i = 0; i < (_count); i++) {
        const d = { x: xy.x, y: xy.y, used: false };
        nodeXY[i] = d;
        fakeNodes.push(d)

        xy.x += maxR;
        if (xy.x >= (w / 2 - maxR)) {
            xy.x = -w / 2;
            xy.y += maxR;
        }
    }

    const edgeThres = 1000;

    const distanceStrength = d3.scaleLinear()
        .range([70, 10])

    const lWidth = d3.scaleQuantize()
        .range([1, 4, 7, 10])
        .domain(d3.extent(data.links, d => d.value))

    data.links.forEach(d => {
        d.width = lWidth(d.value)
    })

    const rSize = d3.scaleQuantize()
        .range([4, 6, 8, 10])
        .domain(d3.extent(data.nodes, d => d.mean_betweeness_centrality));


    const svg = node.selectAll('.canvas').data([0])
        .join('svg').attr('class', 'canvas')
        .attr('xmlns', "http://www.w3.org/2000/svg")
        .attr('width', '100%').attr('height', '100%')
    const landscape = svg.selectAll('.landscape').data([0]).join('g')
        .attr('class', 'landscape')

    // landscape.selectAll('.bg').data([0]).join('rect')
    //     .attr('class', 'bg')
    //     .attr('x', -w / 2).attr('y', -h / 2)
    //     .attr('width', w).attr('height', h)
    //     // .attr('fill', '#e6e6e6')
    //     .attr('fill', '#000')

    const alllinks = landscape.selectAll('.alllinks').data([0]).join('g')
        .attr('class', 'alllinks')

    const allnodes = landscape.selectAll('.allnodes').data([0]).join('g')
        .attr('class', 'allnodes')

    function updateViz(iso_hl) {

        const [view_w, view_h] = [_width || node.node().clientWidth, _height || node.node().clientHeight];


        data.links_layout = data.links.filter(d => d.value > edgeThres)

        const kept = new Set(data.links_layout.map(d => d._id));

        data.nodes.forEach(d => {
            // d.color = state.colorScale(d.sub_region)
            d.rScale = d3.scaleQuantize().range([4, 6, 8, 10]).domain(d3.extent(d.edges, e => e.value));

            d.r = rSize(d.mean_betweeness_centrality);
            d._r = d.r;

            // d.x = box.x + box.width/2;
            // d.y = box.y + box.height/2;
            const hasLink = data.links_layout.some(l => l.source === d.id || l.target === d.id);
            if (!hasLink) {
                let best = null;
                d.edges.forEach(link => {
                    if (!best || link.value > best.value) {
                        best = link;
                    }
                });

                if (best && !kept.has(best._id)) {
                    data.links_layout.push(best);
                    kept.add(best._id);
                }
            }
            nodeXY[d.id] = d;
        })

        distanceStrength.domain(d3.extent(data.links_layout, d => d.value))

        data.links_layout.forEach(d => {

            d.strength = distanceStrength(d.value)
        })

        const links = alllinks.selectAll('.link').data(data.links)
            .join('g').attr('class', d => `links`)

        const link = links.selectAll('.link').data(d => [d])
            .join('path').attr('class', 'link')
            .attr('fill', 'none')
            .attr('stroke-linejoin', 'round')
            .attr('stroke', '#ebeced')
            .attr('stroke-width', 0.2)
            .attr('stroke-opacity', 0.1)


        const items = alllinks.selectAll('.items').data(data.nodes)
            .join('g').attr('class', d => `items`)

        const item = items.selectAll('.item').data(d => [d])
            .join('path').attr('class', 'item')
            .attr('fill', d => d.color)
            .attr('d', d => `M${-d.r} ${-d.r} h${d.r*2} v${d.r*2} h${-d.r*2} z`)
            .attr('stroke', '#000')
            .attr('stroke-width', 1)
            .attr('stroke-opacity', 0.5)

        const label = items.selectAll('.item-text').data(d => [d])
            .join('text').attr('class', 'item-text')
            .text(d => d.country_iso_code)
            .attr('text-anchor', 'middle')
            .attr('font-size', d => d.r * 0.8)
            .attr('y', d => d.r * 0.8 * 0.4)
            .attr('font-weight', 'bold')


        // console.log(nodeXY)
        const forceNode = d3.forceCollide()
            .radius(d => d.r * 2)

        const forceLink = d3.forceLink(data.links_layout).id(d => d.id)
            // .iterations(1)
            // .strength(0.2)
            .distance(d => d.strength)
        const forceBody = d3.forceManyBody()
            .distanceMax(Math.min(w, h))

        const forceY = d3.forceY(h / 2)
            .strength(0.2)

        const simulation = d3.forceSimulation(data.nodes)
            .alphaTarget(0.4)
            .alphaDecay(0.1)
            .alphaMin(0.5)
            .force("link", forceLink)
            .force("charge", forceNode)
            .force('body', forceBody)
            .force('y', forceY)
            .force("center", d3.forceCenter())
            .on('tick', function() {
                items.attr("transform", d => {
                    nodeXY[d.id] = d;
                    return `translate(${d.x},${d.y})`;
                })
                link
                    .attr('d', d => {
                        if (d.source.x === undefined) {
                            d.source = nodeXY[d.source];
                            d.target = nodeXY[d.target];
                        }

                        return `M${d.source.x} ${d.source.y} L${(d.source.x + d.target.x)/2} ${d.source.y} L${(d.source.x + d.target.x)/2} ${d.target.y} L${d.target.x} ${d.target.y}`
                    })
                const box = landscape.node().getBBox();
                svg.attr('viewBox', `${box.x - 10} ${box.y - 10} ${box.width + 20} ${box.height + 20}`)
            })
            .on('end', function() {

                data.nodes.forEach((d, i) => {

                    let closest = null;
                    let minDist = Infinity;
                    for (const e in nodeXY) {
                        const pos = nodeXY[e]
                        if (pos.used) continue;
                        const dx = d.x - pos.x;
                        const dy = d.y - pos.y;
                        const dist = dx * dx + dy * dy; // square distance
                        if (dist < minDist) {
                            minDist = dist;
                            closest = pos;
                        }
                    }

                    if (closest) {
                        // Assign position
                        d.x = closest.x;
                        d.y = closest.y;
                        closest.used = true;
                    }
                    nodeXY[d.id] = d;
                })
                // console.log(nodeXY)
                items.transition().duration(200)
                    .attr("transform", d => `translate(${d.x},${d.y})`)
                link.transition().duration(200)
                    .attr('d', d => {
                        if (d.source.x === undefined) {
                            d.source = nodeXY[d.source];
                            d.target = nodeXY[d.target];
                        }

                        return `M${d.source.x} ${d.source.y} L${(d.source.x + d.target.x)/2} ${d.source.y} L${(d.source.x + d.target.x)/2} ${d.target.y} L${d.target.x} ${d.target.y}`
                    })
                    .attr('stroke-dasharray', function(d) {
                        d._length = this.getTotalLength();
                        return d._length; // total path length
                    })
                    .attr('stroke-dashoffset', 0)

                if (iso_hl) update.highlight(iso_hl)

            })


        update.highlight = (iso) => {
            const nodeData = nodeXY[iso]
            const color = nodeData.color;
            const rScale = nodeData.rScale;
            const edgeValue_lookup = {};
            nodeData.edges.forEach(d => {
                if (d.source === iso) {
                    edgeValue_lookup[d.target] = d.value;
                } else {
                    edgeValue_lookup[d.source] = d.value;
                }
            })

            items.attr('opacity', d => {
                d._r = rScale(edgeValue_lookup[d.id]) || d._r;
                return (d.id === iso) || (d.allNeighbors.has(iso) ? 1 : 0);
            })

            let toggle = true;
            animate()
            d3.interval(() => {
                animate()

            }, 3000); // runs every 1800ms
            function animate() {
                item.transition()
                    .duration(400).delay(toggle ? 0 : 1000)
                    .ease(d3.easeCubic)
                    .attr('d', d => {

                        return toggle ? `M${-d._r} ${-d._r} h${d._r * 2} v${d._r * 2} h${-d._r * 2} z` : `M${-d.r} ${-d.r} h${d.r * 2} v${d.r * 2} h${-d.r * 2} z`;
                    })
                    .attr('transform', d => toggle && d.id === iso ? 'rotate(45) scale(2)' : 'rotate(0) scale(1)')


                label.transition()
                    .duration(400).delay(toggle ? 0 : 1000)
                    .ease(d3.easeCubic)
                    .attr('font-size', d => (toggle ? d._r : d.r) * 0.8)
                    .attr('y', d => (toggle ? d._r : d.r) * 0.8 * 0.4)
                    .attr('transform', d => toggle && d.id === iso ? 'scale(2)' : 'scale(1)');

                const link_hl = link.filter(d => [d.source.id, d.target.id].includes(iso))
                link_hl.transition()
                    .duration(0).delay(toggle ? 0 : 1000)
                    .attr('stroke-width', d => toggle ? d.width : 0.2)
                    .attr('stroke-opacity', d => toggle ? 0.2 : 0.1)
                    .attr('stroke', d => toggle ? color : '#ebeced');
                link_hl.transition()
                    .duration(1000).delay(toggle ? 0 : 1000)
                    .ease(d3.easeLinear)
                    .attr('stroke-dashoffset', d => toggle ? 0 : d._length);


                toggle = !toggle;
            }

        }
        return update;
    }
    return updateViz;

}