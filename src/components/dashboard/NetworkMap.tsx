import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// Define types for our graph data
interface Node extends d3.SimulationNodeDatum {
    id: string;
    group: string;
    x?: number;
    y?: number;
    fx?: number | null;
    fy?: number | null;
}

interface Link extends d3.SimulationLinkDatum<Node> {
    source: string | Node;
    target: string | Node;
}

interface GraphData {
    nodes: Node[];
    links: Link[];
}

// Mock data to simulate a network topology
const mockGraphData: GraphData = {
    nodes: [
      { id: '192.168.1.1', group: 'Router' },
      { id: '192.168.1.101', group: 'Server' },
      { id: '192.168.1.102', group: 'Client' },
      { id: '192.168.1.103', group: 'Client' },
      { id: '10.0.0.53', group: 'External' },
      { id: '192.168.1.104', group: 'Client' },
      { id: '192.168.1.200', group: 'IoT' },
    ],
    links: [
      { source: '192.168.1.1', target: '192.168.1.101' },
      { source: '192.168.1.1', target: '192.168.1.102' },
      { source: '192.168.1.1', target: '192.168.1.103' },
      { source: '192.168.1.1', target: '192.168.1.104' },
      { source: '192.168.1.101', target: '10.0.0.53' },
      { source: '192.168.1.1', target: '192.168.1.200' },
      { source: '192.168.1.102', target: '192.168.1.103' }, // some client-client traffic
    ]
};

const getNodeColor = (group: string) => {
    switch(group) {
        case 'Router': return 'var(--cyan)';
        case 'Server': return 'var(--mag)';
        case 'Client': return 'var(--lime)';
        case 'IoT': return 'var(--amber)';
        case 'External': return 'var(--muted)';
        default: return 'var(--muted)';
    }
};

const NetworkMap: React.FC = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const graphData = useRef<GraphData>(JSON.parse(JSON.stringify(mockGraphData)));

    useEffect(() => {
        const svgElement = svgRef.current;
        const containerElement = containerRef.current;
        if (!svgElement || !containerElement) return;

        const nodes = graphData.current.nodes;
        const links = graphData.current.links;

        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id((d: any) => d.id).distance(90))
            .force('charge', d3.forceManyBody().strength(-150));
        
        const svg = d3.select(svgElement);
        svg.selectAll("*").remove(); // Clear previous render
        
        // Tooltip setup
        const tooltip = d3.select(containerElement)
            .append("div")
            .attr("class", "d3-tooltip")
            .style("opacity", 0);

        const linkGroup = svg.append("g")
            .selectAll(".link-group")
            .data(links)
            .join("g")
            .attr("class", "link-group");

        linkGroup.append("line")
            .attr("stroke", "rgba(0, 255, 249, 0.1)")
            .attr("stroke-width", 1);
            
        linkGroup.append("line")
            .attr("class", "network-beam")
            .attr("stroke", "var(--cyan)")
            .attr("stroke-width", 1.5);
            
        const nodeGroup = svg.append("g")
            .selectAll(".node")
            .data(nodes)
            .join("g")
            .attr("class", "node network-node")
            .call(drag(simulation) as any)
            .on('mouseover', function(event, d: Node) {
                d3.select(this).select('circle').transition().duration(200).attr('r', 12);
                tooltip.transition().duration(200).style('opacity', .95);
                tooltip.html(`<strong>IP:</strong> ${d.id}<br/><strong>Group:</strong> ${d.group}`)
                    .style('left', (event.pageX + 15) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this).select('circle').transition().duration(200).attr('r', 10);
                tooltip.transition().duration(500).style('opacity', 0);
            });


        nodeGroup.append("circle")
            .attr("r", 10)
            .attr("fill", d => getNodeColor(d.group))
            .attr("stroke", "#05070b")
            .attr("stroke-width", 2);
            
        nodeGroup.append("text")
            .text(d => d.id)
            .attr("x", 15)
            .attr("y", 5)
            .attr("fill", "rgba(207, 231, 255, 0.7)")
            .attr("font-size", "10px")
            .attr("font-family", "monospace")
            .style("pointer-events", "none");

        simulation.on('tick', () => {
            linkGroup.selectAll("line")
                .attr('x1', (d) => ((d as Link).source as Node).x!)
                .attr('y1', (d) => ((d as Link).source as Node).y!)
                .attr('x2', (d) => ((d as Link).target as Node).x!)
                .attr('y2', (d) => ((d as Link).target as Node).y!);

            nodeGroup
                .attr('transform', (d) => `translate(${(d as Node).x!}, ${(d as Node).y!})`);
        });
        
        const resizeObserver = new ResizeObserver(entries => {
            if (entries[0]) {
                const { width, height } = entries[0].contentRect;
                simulation.force('center', d3.forceCenter(width / 2, height / 2));
                simulation.alpha(0.3).restart();
            }
        });
        resizeObserver.observe(containerElement);

        function drag(simulation: d3.Simulation<Node, undefined>) {
            function dragstarted(event: any, d: Node) {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            }
            function dragged(event: any, d: Node) {
                d.fx = event.x;
                d.fy = event.y;
            }
            function dragended(event: any, d: Node) {
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            }
            return d3.drag<any, Node>()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended);
        }
        
        const threatInterval = setInterval(() => {
            const threatIndex = Math.random() > 0.8 ? Math.floor(Math.random() * nodes.length) : -1;
            nodeGroup
               .classed("network-threat", (d, i) => i === threatIndex)
               .select('circle')
               .transition().duration(500)
               .attr("fill", (d, i) => i === threatIndex ? 'var(--danger)' : getNodeColor(d.group));
        }, 3000);

        return () => {
            simulation.stop();
            clearInterval(threatInterval);
            resizeObserver.disconnect();
            d3.select(containerElement).select('.d3-tooltip').remove();
        };
    }, []);

    return (
        <div ref={containerRef} className="w-full h-full relative" role="img" aria-label="Interactive network map visualization">
            <svg ref={svgRef} className="w-full h-full"></svg>
        </div>
    );
};

export default NetworkMap;