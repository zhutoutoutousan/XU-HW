<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	function handleCreateAgent() {
		dispatch('createAgent');
	}

	function handleShowMetrics() {
		dispatch('showMetrics');
	}

	function handleNetworkUpdate() {
		dispatch('networkUpdate');
	}
</script>

<div class="control-panel">
	<h3 class="panel-title">Network Controls</h3>
	
	<div class="control-section">
		<h4 class="section-title">Agent Management</h4>
		<div class="control-buttons">
			<button class="btn btn-primary" on:click={handleCreateAgent}>
				Create Agent
			</button>
		</div>
	</div>

	<div class="control-section">
		<h4 class="section-title">Analytics</h4>
		<div class="control-buttons">
			<button class="btn btn-outline" on:click={handleShowMetrics}>
				View Metrics
			</button>
		</div>
	</div>

	<div class="control-section">
		<h4 class="section-title">Network</h4>
		<div class="control-buttons">
			<button class="btn btn-outline" on:click={handleNetworkUpdate}>
				Refresh Network
			</button>
		</div>
	</div>

	<div class="info-section">
		<h4 class="section-title">About</h4>
		<p class="info-text">
			This is a neuroplasticity-inspired agent network where agents can create, destroy, and negotiate with each other based on business optimization goals.
		</p>
		<p class="info-text">
			The system automatically evaluates agent performance and triggers creation/destruction events based on business metrics.
		</p>
	</div>
</div>

<style>
	.control-panel {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.panel-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-color);
		margin-bottom: 1rem;
	}

	.control-section {
		background: var(--background-color);
		padding: 1rem;
		border-radius: 8px;
		border: 1px solid var(--border-color);
	}

	.section-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-color);
		margin-bottom: 0.75rem;
	}

	.control-buttons {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.info-section {
		background: var(--background-color);
		padding: 1rem;
		border-radius: 8px;
		border: 1px solid var(--border-color);
	}

	.info-text {
		font-size: 0.875rem;
		color: var(--text-muted);
		line-height: 1.5;
		margin-bottom: 0.75rem;
	}

	.info-text:last-child {
		margin-bottom: 0;
	}
</style> 