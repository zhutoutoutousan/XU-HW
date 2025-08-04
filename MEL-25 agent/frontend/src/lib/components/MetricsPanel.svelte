<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Agent } from '$lib/stores';

	export let agents: Agent[] = [];

	const dispatch = createEventDispatcher();

	function closePanel() {
		dispatch('close');
	}

	// Calculate metrics
	$: totalAgents = agents.length;
	$: activeAgents = agents.filter(a => a.status === 'active').length;
	$: avgPerformance = agents.length > 0 ? agents.reduce((sum, a) => sum + a.performance_score, 0) / agents.length : 0;
	$: totalCashFlow = agents.reduce((sum, a) => sum + a.cash_flow, 0);
	$: typeDistribution = agents.reduce((acc, agent) => {
		acc[agent.type] = (acc[agent.type] || 0) + 1;
		return acc;
	}, {} as Record<string, number>);

	$: topPerformers = agents
		.filter(a => a.status === 'active')
		.sort((a, b) => b.performance_score - a.performance_score)
		.slice(0, 5);

	$: bottomPerformers = agents
		.filter(a => a.status === 'active')
		.sort((a, b) => a.performance_score - b.performance_score)
		.slice(0, 5);
</script>

<div class="metrics-panel">
	<div class="panel-header">
		<h2 class="text-xl font-semibold">Network Metrics</h2>
		<button class="close-btn" on:click={closePanel}>×</button>
	</div>

	<div class="panel-content">
		<!-- Summary Cards -->
		<div class="metrics-grid">
			<div class="metric-card">
				<div class="metric-value">{totalAgents}</div>
				<div class="metric-label">Total Agents</div>
			</div>
			<div class="metric-card">
				<div class="metric-value">{activeAgents}</div>
				<div class="metric-label">Active Agents</div>
			</div>
			<div class="metric-card">
				<div class="metric-value">{avgPerformance.toFixed(1)}%</div>
				<div class="metric-label">Avg Performance</div>
			</div>
			<div class="metric-card">
				<div class="metric-value ${totalCashFlow >= 0 ? 'text-success' : 'text-error'}">
					${totalCashFlow.toLocaleString()}
				</div>
				<div class="metric-label">Total Cash Flow</div>
			</div>
		</div>

		<!-- Agent Type Distribution -->
		<div class="section">
			<h3 class="section-title">Agent Type Distribution</h3>
			<div class="type-distribution">
				{#each Object.entries(typeDistribution) as [type, count]}
					<div class="type-item">
						<div class="type-name">{type.replace('_', ' ')}</div>
						<div class="type-count">{count}</div>
						<div class="type-bar">
							<div class="type-fill" style="width: {(count / totalAgents) * 100}%"></div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Top Performers -->
		<div class="section">
			<h3 class="section-title">Top Performers</h3>
			<div class="performer-list">
				{#each topPerformers as agent, index}
					<div class="performer-item">
						<div class="performer-rank">#{index + 1}</div>
						<div class="performer-info">
							<div class="performer-name">{agent.name}</div>
							<div class="performer-type">{agent.type.replace('_', ' ')}</div>
						</div>
						<div class="performer-score">{agent.performance_score.toFixed(1)}%</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Bottom Performers -->
		<div class="section">
			<h3 class="section-title">Bottom Performers</h3>
			<div class="performer-list">
				{#each bottomPerformers as agent, index}
					<div class="performer-item">
						<div class="performer-rank">#{index + 1}</div>
						<div class="performer-info">
							<div class="performer-name">{agent.name}</div>
							<div class="performer-type">{agent.type.replace('_', ' ')}</div>
						</div>
						<div class="performer-score">{agent.performance_score.toFixed(1)}%</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.metrics-panel {
		padding: 1.5rem;
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--border-color);
	}

	.close-btn {
		background: none;
		border: none;
		color: var(--text-muted);
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 4px;
		transition: color 0.2s;
	}

	.close-btn:hover {
		color: var(--text-color);
	}

	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.metric-card {
		background: var(--background-color);
		padding: 1rem;
		border-radius: 8px;
		border: 1px solid var(--border-color);
		text-align: center;
	}

	.metric-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--primary-color);
		margin-bottom: 0.25rem;
	}

	.metric-label {
		font-size: 0.875rem;
		color: var(--text-muted);
	}

	.section {
		margin-bottom: 2rem;
	}

	.section-title {
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 1rem;
		color: var(--text-color);
	}

	.type-distribution {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.type-item {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.type-name {
		flex: 1;
		font-size: 0.875rem;
		color: var(--text-color);
	}

	.type-count {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--primary-color);
		min-width: 2rem;
		text-align: right;
	}

	.type-bar {
		flex: 2;
		height: 8px;
		background: var(--border-color);
		border-radius: 4px;
		overflow: hidden;
	}

	.type-fill {
		height: 100%;
		background: var(--primary-color);
		transition: width 0.3s ease;
	}

	.performer-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.performer-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem;
		background: var(--background-color);
		border-radius: 6px;
		border: 1px solid var(--border-color);
	}

	.performer-rank {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--text-muted);
		min-width: 1.5rem;
	}

	.performer-info {
		flex: 1;
	}

	.performer-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-color);
	}

	.performer-type {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.performer-score {
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--primary-color);
	}
</style> 