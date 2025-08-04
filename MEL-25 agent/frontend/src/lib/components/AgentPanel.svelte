<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { agents, selectedAgent, createAgent, removeAgent, selectAgent } from '$lib/stores';
	import { toast } from 'svelte-french-toast';

	export let onAgentSelect: (agent: any) => void = () => {};

	const dispatch = createEventDispatcher();

	let isCreating = false;
	let formData = {
		name: '',
		type: 'analyst',
		capabilities: ['data analysis'],
		goals: ['analyze data'],
		constraints: ['accuracy']
	};

	// Form text variables
	let capabilitiesText = formData.capabilities.join(', ');
	let goalsText = formData.goals.join(', ');
	let constraintsText = formData.constraints.join(', ');

	// Update form data when text changes
	function updateCapabilities() {
		formData.capabilities = capabilitiesText.split(',').map(s => s.trim()).filter(s => s);
	}
	function updateGoals() {
		formData.goals = goalsText.split(',').map(s => s.trim()).filter(s => s);
	}
	function updateConstraints() {
		formData.constraints = constraintsText.split(',').map(s => s.trim()).filter(s => s);
	}

	const agentTypes = [
		{ value: 'analyst', label: 'Analyst' },
		{ value: 'planner', label: 'Planner' },
		{ value: 'executor', label: 'Executor' },
		{ value: 'negotiator', label: 'Negotiator' },
		{ value: 'monitor', label: 'Monitor' }
	];

	async function handleCreateAgent() {
		try {
			// Update form data from text inputs
			updateCapabilities();
			updateGoals();
			updateConstraints();
			
			await createAgent(formData);
			toast.success('Agent created successfully');
			isCreating = false;
			formData = {
				name: '',
				type: 'analyst',
				capabilities: ['data analysis'],
				goals: ['analyze data'],
				constraints: ['accuracy']
			};
			capabilitiesText = formData.capabilities.join(', ');
			goalsText = formData.goals.join(', ');
			constraintsText = formData.constraints.join(', ');
		} catch (error) {
			toast.error('Failed to create agent');
		}
	}

	async function handleRemoveAgent(agentId: string) {
		if (confirm('Are you sure you want to remove this agent?')) {
			try {
				await removeAgent(agentId);
				toast.success('Agent removed successfully');
			} catch (error) {
				toast.error('Failed to remove agent');
			}
		}
	}

	function handleAgentClick(agent: any) {
		selectAgent(agent);
		onAgentSelect(agent);
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'active': return 'text-green-500';
			case 'thinking': return 'text-yellow-500';
			case 'communicating': return 'text-blue-500';
			case 'inactive': return 'text-red-500';
			default: return 'text-gray-500';
		}
	}
</script>

<div class="agent-panel">
	<div class="panel-header">
		<h2 class="text-xl font-semibold">Agent Network</h2>
		<button 
			class="create-btn" 
			on:click={() => isCreating = !isCreating}
		>
			{isCreating ? 'Cancel' : '+ New Agent'}
		</button>
	</div>

	<div class="panel-content">
		{#if isCreating}
			<!-- Create Agent Form -->
			<div class="create-form">
				<h3 class="text-lg font-medium mb-4">Create New Agent</h3>
				
				<div class="form-group">
					<label for="name" class="form-label">Name</label>
					<input
						id="name"
						type="text"
						bind:value={formData.name}
						class="form-input"
						placeholder="Agent name"
					/>
				</div>

				<div class="form-group">
					<label for="type" class="form-label">Type</label>
					<select id="type" bind:value={formData.type} class="form-input">
						{#each agentTypes as type}
							<option value={type.value}>{type.label}</option>
						{/each}
					</select>
				</div>

				<div class="form-group">
					<label for="capabilities" class="form-label">Capabilities</label>
					<input
						id="capabilities"
						type="text"
						bind:value={capabilitiesText}
						class="form-input"
						placeholder="capability1, capability2, ..."
					/>
				</div>

				<div class="form-group">
					<label for="goals" class="form-label">Goals</label>
					<input
						id="goals"
						type="text"
						bind:value={goalsText}
						class="form-input"
						placeholder="goal1, goal2, ..."
					/>
				</div>

				<div class="form-group">
					<label for="constraints" class="form-label">Constraints</label>
					<input
						id="constraints"
						type="text"
						bind:value={constraintsText}
						class="form-input"
						placeholder="constraint1, constraint2, ..."
					/>
				</div>

				<div class="form-actions">
					<button 
						class="btn btn-primary" 
						on:click={handleCreateAgent}
						disabled={!formData.name}
					>
						Create Agent
					</button>
				</div>
			</div>
		{:else}
			<!-- Agent List -->
			<div class="agent-list">
				{#if $agents.length === 0}
					<div class="empty-state">
						<p class="text-muted">No agents found</p>
						<p class="text-sm text-muted">Create your first agent to get started</p>
					</div>
				{:else}
					{#each $agents as agent (agent.id)}
						<div 
							class="agent-item {$selectedAgent?.id === agent.id ? 'selected' : ''}"
							on:click={() => handleAgentClick(agent)}
						>
							<div class="agent-header">
								<div class="agent-info">
									<h4 class="agent-name">{agent.name}</h4>
									<p class="agent-type">{agent.type}</p>
								</div>
								<div class="agent-status">
									<span class="status-dot {getStatusColor(agent.status)}"></span>
									<span class="status-text">{agent.status}</span>
								</div>
							</div>
							
							<div class="agent-metrics">
								<div class="metric">
									<span class="metric-label">Performance</span>
									<span class="metric-value">{agent.performance_score.toFixed(1)}%</span>
								</div>
								<div class="metric">
									<span class="metric-label">Cash Flow</span>
									<span class="metric-value {agent.cash_flow >= 0 ? 'positive' : 'negative'}">
										${agent.cash_flow.toLocaleString()}
									</span>
								</div>
							</div>

							<div class="agent-actions">
								<button 
									class="action-btn remove-btn"
									on:click|stopPropagation={() => handleRemoveAgent(agent.id)}
								>
									Remove
								</button>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.agent-panel {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 1rem;
		backdrop-filter: blur(10px);
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.panel-header h2 {
		margin: 0;
		color: white;
	}

	.create-btn {
		background: #10b981;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.create-btn:hover {
		background: #059669;
	}

	.panel-content {
		flex: 1;
		padding: 1rem;
		overflow-y: auto;
	}

	.create-form {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 0.5rem;
		padding: 1rem;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.form-label {
		display: block;
		margin-bottom: 0.5rem;
		color: white;
		font-weight: 600;
	}

	.form-input {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 0.25rem;
		background: rgba(255, 255, 255, 0.1);
		color: white;
	}

	.form-input::placeholder {
		color: rgba(255, 255, 255, 0.5);
	}

	.form-actions {
		margin-top: 1rem;
	}

	.btn {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 0.25rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.btn-primary {
		background: #3b82f6;
		color: white;
	}

	.btn-primary:hover {
		background: #2563eb;
	}

	.btn-primary:disabled {
		background: #6b7280;
		cursor: not-allowed;
	}

	.agent-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.agent-item {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 0.5rem;
		padding: 1rem;
		cursor: pointer;
		transition: all 0.3s ease;
		border: 1px solid transparent;
	}

	.agent-item:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.2);
	}

	.agent-item.selected {
		background: rgba(59, 130, 246, 0.2);
		border-color: #3b82f6;
	}

	.agent-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.agent-name {
		margin: 0;
		color: white;
		font-weight: 600;
	}

	.agent-type {
		margin: 0;
		color: rgba(255, 255, 255, 0.7);
		font-size: 0.875rem;
	}

	.agent-status {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}

	.status-text {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.7);
	}

	.agent-metrics {
		display: flex;
		gap: 1rem;
		margin-bottom: 0.5rem;
	}

	.metric {
		display: flex;
		flex-direction: column;
	}

	.metric-label {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.7);
	}

	.metric-value {
		font-size: 0.875rem;
		font-weight: 600;
		color: white;
	}

	.metric-value.positive {
		color: #10b981;
	}

	.metric-value.negative {
		color: #ef4444;
	}

	.agent-actions {
		display: flex;
		justify-content: flex-end;
	}

	.action-btn {
		padding: 0.25rem 0.5rem;
		border: none;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.remove-btn {
		background: rgba(239, 68, 68, 0.2);
		color: #ef4444;
	}

	.remove-btn:hover {
		background: rgba(239, 68, 68, 0.3);
	}

	.empty-state {
		text-align: center;
		padding: 2rem;
		color: rgba(255, 255, 255, 0.7);
	}

	.text-green-500 { color: #10b981; }
	.text-yellow-500 { color: #f59e0b; }
	.text-blue-500 { color: #3b82f6; }
	.text-red-500 { color: #ef4444; }
	.text-gray-500 { color: #6b7280; }
</style> 