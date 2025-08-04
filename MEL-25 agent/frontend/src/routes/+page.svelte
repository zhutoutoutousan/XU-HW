<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import NetworkGraph from '$lib/components/NetworkGraph.svelte';
	import AgentPanel from '$lib/components/AgentPanel.svelte';
	import ControlPanel from '$lib/components/ControlPanel.svelte';
	import MetricsPanel from '$lib/components/MetricsPanel.svelte';
	import IntelligenceDashboard from '$lib/components/IntelligenceDashboard.svelte';
	import AgentDetails from '$lib/components/AgentDetails.svelte';
	import ChatRoom from '$lib/components/ChatRoom.svelte';
	import {
		agents,
		selectedAgent,
		agentMemory,
		agentContent,
		agentConversations,
		agentNetwork,
		networkState,
		engineStatus,
		heartbeat,
		loading,
		connecting,
		error,
		initializeSocket,
		startEngine,
		stopEngine,
		selectAgent,
		cleanup
	} from '$lib/stores';

	let showIntelligencePanel = false;
	let showAgentDetails = false;
	let showChatRoom = false;
	let socket: any;

	onMount(async () => {
		console.log('Initializing real-time agent network...');
		socket = initializeSocket();
		
		// Start the engine automatically
		await startEngine();
	});

	onDestroy(() => {
		cleanup();
	});

	function handleShowIntelligence() {
		showIntelligencePanel = !showIntelligencePanel;
	}

	function handleShowChatRoom() {
		showChatRoom = !showChatRoom;
	}

	function handleAgentSelect(agent: any) {
		console.log('Agent selected:', agent);
		selectAgent(agent);
		showAgentDetails = true;
		console.log('showAgentDetails set to:', showAgentDetails);
		console.log('selectedAgent:', $selectedAgent);
	}

	function handleCloseAgentDetails() {
		showAgentDetails = false;
		selectedAgent.set(null);
	}

	function handleEngineToggle() {
		if ($engineStatus) {
			stopEngine();
		} else {
			startEngine();
		}
	}
</script>

<svelte:head>
	<title>Autonomous Agent Network</title>
</svelte:head>

<main class="app">
	<header class="header">
		<h1>🤖 Autonomous Agent Network</h1>
		<div class="header-controls">
			<button 
				class="engine-toggle {engineStatus ? 'running' : 'stopped'}" 
				on:click={handleEngineToggle}
				disabled={$loading}
			>
				{engineStatus ? '🟢 Engine Running' : '🔴 Engine Stopped'}
			</button>
			<button class="intelligence-btn" on:click={handleShowIntelligence}>
				🧠 Intelligence
			</button>
			<button class="chat-btn" on:click={handleShowChatRoom}>
				💬 Chat Room
			</button>
		</div>
	</header>

	{#if $connecting}
		<div class="connection-status">
			🔄 Connecting to agent network...
		</div>
	{/if}

	{#if $error}
		<div class="error-message">
			❌ {$error}
		</div>
	{/if}

	{#if $heartbeat}
		<div class="heartbeat-info">
			💓 Last heartbeat: {$heartbeat.timestamp}
			Agents: {$heartbeat.agentsCount}
		</div>
	{/if}

	<div class="main-content">
		<div class="left-panel">
			<ControlPanel />
			<MetricsPanel />
		</div>

		<div class="center-panel">
			<div class="network-container">
				<NetworkGraph agents={$agents} onAgentClick={handleAgentSelect} />
			</div>
		</div>

		<div class="right-panel">
			<AgentPanel on:agentSelect={handleAgentSelect} />
		</div>
	</div>

	{#if showIntelligencePanel}
		<div class="intelligence-panel">
			<IntelligenceDashboard />
		</div>
	{/if}

	{#if showChatRoom}
		<ChatRoom isVisible={showChatRoom} onClose={() => showChatRoom = false} />
	{/if}

	{#if showAgentDetails && $selectedAgent}
		<div style="border: 5px solid blue; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,255,0.3); z-index: 999;">
			DEBUG: Modal should be visible here
		</div>
		<AgentDetails agent={$selectedAgent} onClose={handleCloseAgentDetails} />
	{:else if showAgentDetails}
		<div class="debug-info">
			showAgentDetails: {showAgentDetails}, selectedAgent: {$selectedAgent ? 'exists' : 'null'}
		</div>
	{/if}
</main>

<style>
	.app {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 2rem;
		background: rgba(0, 0, 0, 0.2);
		backdrop-filter: blur(10px);
	}

	.header h1 {
		margin: 0;
		font-size: 1.8rem;
		font-weight: 700;
	}

	.header-controls {
		display: flex;
		gap: 1rem;
	}

	.engine-toggle {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 0.5rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.engine-toggle.running {
		background: #10b981;
		color: white;
	}

	.engine-toggle.stopped {
		background: #ef4444;
		color: white;
	}

	.intelligence-btn {
		padding: 0.5rem 1rem;
		background: #8b5cf6;
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.intelligence-btn:hover {
		background: #7c3aed;
	}

	.chat-btn {
		padding: 0.5rem 1rem;
		background: #f59e0b;
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.chat-btn:hover {
		background: #d97706;
	}

	.connection-status {
		padding: 0.5rem 2rem;
		background: rgba(59, 130, 246, 0.2);
		text-align: center;
		font-weight: 600;
	}

	.error-message {
		padding: 0.5rem 2rem;
		background: rgba(239, 68, 68, 0.2);
		text-align: center;
		font-weight: 600;
	}

	.heartbeat-info {
		padding: 0.5rem 2rem;
		background: rgba(34, 197, 94, 0.2);
		text-align: center;
		font-size: 0.9rem;
	}

	.main-content {
		display: flex;
		flex: 1;
		gap: 1rem;
		padding: 1rem;
	}

	.left-panel {
		width: 300px;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.center-panel {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.network-container {
		flex: 1;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 1rem;
		backdrop-filter: blur(10px);
		overflow: hidden;
	}

	.right-panel {
		width: 300px;
	}

	.intelligence-panel {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.8);
		backdrop-filter: blur(10px);
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
	}

	.agent-details-modal {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.8);
		backdrop-filter: blur(10px);
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
	}

	.modal-content {
		background: white;
		color: #333;
		border-radius: 1rem;
		max-width: 800px;
		max-height: 90vh;
		overflow-y: auto;
		width: 100%;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.modal-header h2 {
		margin: 0;
		color: #1f2937;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: #6b7280;
	}

	.modal-body {
		padding: 1.5rem;
	}

	.agent-info,
	.agent-capabilities,
	.agent-goals,
	.agent-constraints,
	.agent-memory,
	.agent-content,
	.agent-conversations,
	.agent-network {
		margin-bottom: 2rem;
	}

	.agent-info h3,
	.agent-capabilities h3,
	.agent-goals h3,
	.agent-constraints h3,
	.agent-memory h3,
	.agent-content h3,
	.agent-conversations h3,
	.agent-network h3 {
		color: #1f2937;
		margin-bottom: 1rem;
		border-bottom: 2px solid #e5e7eb;
		padding-bottom: 0.5rem;
	}

	.status {
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.status.active {
		background: #dcfce7;
		color: #166534;
	}

	.status.thinking {
		background: #fef3c7;
		color: #92400e;
	}

	.status.communicating {
		background: #dbeafe;
		color: #1e40af;
	}

	.status.inactive {
		background: #fee2e2;
		color: #991b1b;
	}

	.memory-list,
	.content-list,
	.conversation-list,
	.network-list {
		max-height: 200px;
		overflow-y: auto;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		padding: 0.5rem;
	}

	.memory-entry,
	.content-entry,
	.conversation-entry {
		padding: 0.75rem;
		margin-bottom: 0.5rem;
		border-radius: 0.25rem;
		background: #f9fafb;
	}

	.memory-header,
	.content-header,
	.conversation-header {
		display: flex;
		justify-content: space-between;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
		color: #6b7280;
	}

	.memory-type,
	.content-type,
	.conversation-direction {
		font-weight: 600;
		color: #374151;
	}

	.memory-content,
	.content-text,
	.conversation-message {
		color: #1f2937;
		line-height: 1.5;
	}

	.conversation-entry.incoming {
		background: #f0f9ff;
		border-left: 3px solid #3b82f6;
	}

	.conversation-entry.outgoing {
		background: #f0fdf4;
		border-left: 3px solid #22c55e;
	}

	.network-connection {
		padding: 0.5rem;
		background: #f3f4f6;
		border-radius: 0.25rem;
		margin-bottom: 0.25rem;
		font-family: monospace;
		font-size: 0.875rem;
	}

	ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	li {
		padding: 0.25rem 0;
		color: #374151;
	}

	p {
		margin: 0.5rem 0;
		color: #374151;
	}

	strong {
		color: #1f2937;
	}

	.debug-info {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: rgba(0, 0, 0, 0.9);
		color: white;
		padding: 2rem;
		border-radius: 1rem;
		z-index: 1001;
	}
</style> 