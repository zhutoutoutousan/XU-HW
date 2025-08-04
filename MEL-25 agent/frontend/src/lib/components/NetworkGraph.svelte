<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as d3 from 'd3';

	export let agents: any[] = [];
	export let relationships: any[] = [];
	export let onAgentClick: (agent: any) => void = () => {};

	let container: HTMLDivElement;
	let svg: any;
	let simulation: any;
	let nodes: any[] = [];
	let links: any[] = [];

	// Color scheme for agent types
	const agentColors = {
		'analyst': '#6366f1',
		'planner': '#8b5cf6',
		'executor': '#06b6d4',
		'negotiator': '#10b981',
		'monitor': '#f59e0b',
		'default': '#6b7280'
	};

	onMount(() => {
		initializeGraph();
		updateGraph();
	});

	onDestroy(() => {
		if (simulation) {
			simulation.stop();
		}
	});

	function initializeGraph() {
		if (!container) return;

		// Clear existing content
		d3.select(container).selectAll('*').remove();

		// Create SVG
		svg = d3.select(container)
			.append('svg')
			.attr('width', '100%')
			.attr('height', '100%')
			.attr('viewBox', '0 0 800 600');

		// Add zoom behavior
		const zoom = d3.zoom()
			.on('zoom', (event) => {
				svg.select('g').attr('transform', event.transform);
			});

		svg.call(zoom);

		// Create main group for graph elements
		svg.append('g').attr('class', 'graph-container');
	}

	function updateGraph() {
		if (!svg || !agents.length) {
			return;
		}
		
		// Prepare data
		prepareData();

		// Clear existing elements
		svg.select('.graph-container').selectAll('*').remove();

		// Create simulation
		createSimulation();

		// Draw links
		drawLinks();

		// Draw nodes
		drawNodes();

		// Add labels
		drawLabels();
	}

	function prepareData() {
		// Create nodes from agents
		nodes = agents.map(agent => ({
			id: agent.id,
			name: agent.name,
			type: agent.type,
			performance: agent.performance_score || 0,
			cashFlow: agent.cash_flow || 0,
			status: agent.status || 'active',
			radius: Math.max(8, Math.min(20, (agent.performance_score || 0) / 5))
		}));

		// Create links from network connections
		links = [];
		agents.forEach(agent => {
			if (agent.networkConnections && Array.isArray(agent.networkConnections)) {
				agent.networkConnections.forEach(targetId => {
					// Avoid duplicate links
					const existingLink = links.find(link => 
						(link.source.id === agent.id && link.target.id === targetId) ||
						(link.source.id === targetId && link.target.id === agent.id)
					);
					
					if (!existingLink) {
						links.push({
							source: agent.id,
							target: targetId
						});
					}
				});
			}
		});


	}

	function createSimulation() {
		// Stop existing simulation
		if (simulation) {
			simulation.stop();
		}

		// Create new simulation
		simulation = d3.forceSimulation(nodes)
			.force('link', d3.forceLink(links).id((d: any) => d.id).distance(100))
			.force('charge', d3.forceManyBody().strength(-300))
			.force('center', d3.forceCenter(400, 300))
			.force('collision', d3.forceCollide().radius((d: any) => d.radius + 5));

		// Update positions on tick
		simulation.on('tick', () => {
			svg.selectAll('.link')
				.attr('x1', (d: any) => d.source.x)
				.attr('y1', (d: any) => d.source.y)
				.attr('x2', (d: any) => d.target.x)
				.attr('y2', (d: any) => d.target.y);

			svg.selectAll('.node')
				.attr('transform', (d: any) => `translate(${d.x},${d.y})`);

			svg.selectAll('.label')
				.attr('x', (d: any) => d.x)
				.attr('y', (d: any) => d.y + d.radius + 15);
		});
	}

	function drawLinks() {
		svg.select('.graph-container')
			.selectAll('.link')
			.data(links)
			.enter()
			.append('line')
			.attr('class', 'link')
			.attr('stroke', '#666')
			.attr('stroke-width', 2)
			.attr('opacity', 0.6);
	}

	function drawNodes() {
		const nodeGroup = svg.select('.graph-container')
			.selectAll('.node')
			.data(nodes)
			.enter()
			.append('g')
			.attr('class', 'node')
			.style('cursor', 'pointer');

		// Add circles
		nodeGroup.append('circle')
			.attr('r', (d: any) => d.radius)
			.attr('fill', (d: any) => agentColors[d.type] || agentColors.default)
			.attr('stroke', '#fff')
			.attr('stroke-width', 2)
			.style('opacity', (d: any) => d.status === 'active' ? 1 : 0.7)
			.on('click', (event: any, d: any) => {
				event.stopPropagation();
				console.log('NetworkGraph: Node clicked:', d);
				onAgentClick(d);
			});

		// Add status indicators
		nodeGroup.append('circle')
			.attr('r', 3)
			.attr('fill', (d: any) => {
				switch (d.status) {
					case 'active': return '#10b981';
					case 'thinking': return '#f59e0b';
					case 'communicating': return '#3b82f6';
					case 'inactive': return '#ef4444';
					default: return '#6b7280';
				}
			})
			.attr('transform', (d: any) => `translate(${d.radius - 5}, -${d.radius - 5})`);

		// Add performance indicator
		nodeGroup.append('circle')
			.attr('r', (d: any) => (d.performance / 100) * d.radius)
			.attr('fill', 'none')
			.attr('stroke', '#10b981')
			.attr('stroke-width', 2)
			.style('opacity', 0.8);
	}

	function drawLabels() {
		svg.select('.graph-container')
			.selectAll('.label')
			.data(nodes)
			.enter()
			.append('text')
			.attr('class', 'label')
			.attr('text-anchor', 'middle')
			.attr('fill', '#fff')
			.attr('font-size', '12px')
			.attr('font-weight', '600')
			.text((d: any) => d.name)
			.style('text-shadow', '0 1px 2px rgba(0,0,0,0.8)');
	}

	// Watch for changes in agents
	$: if (agents && agents.length > 0) {
		updateGraph();
	}
</script>

<div class="network-graph" bind:this={container}>
	{#if !agents || agents.length === 0}
		<div class="empty-state">
			<p>No agents available</p>
			<p class="text-sm">Create agents to see the network visualization</p>
		</div>
	{/if}
</div>

<style>
	.network-graph {
		width: 100%;
		height: 100%;
		position: relative;
		background: rgba(0, 0, 0, 0.1);
		border-radius: 0.5rem;
		overflow: hidden;
	}

	.empty-state {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		text-align: center;
		color: rgba(255, 255, 255, 0.7);
	}

	.empty-state p {
		margin: 0.5rem 0;
	}

	.text-sm {
		font-size: 0.875rem;
	}

	/* D3.js styles */
	:global(.network-graph svg) {
		width: 100%;
		height: 100%;
	}

	:global(.network-graph circle) {
		transition: all 0.2s ease;
	}

	:global(.network-graph circle:hover) {
		transform: scale(1.1);
	}

	:global(.network-graph line) {
		transition: opacity 0.2s ease;
	}

	:global(.network-graph text) {
		font-family: 'Inter', sans-serif;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
	}
</style> 