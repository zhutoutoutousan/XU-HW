<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { initializeSocket, cleanup } from '../lib/stores';
	import { toast } from 'svelte-french-toast';

	onMount(() => {
		// Initialize socket connection
		const socket = initializeSocket();
		
		socket.on('connect', () => {
			console.log('Connected to server');
			toast.success('Connected to agent network');
		});

		socket.on('disconnect', () => {
			console.log('Disconnected from server');
			toast.error('Disconnected from agent network');
		});

		socket.on('agent:created', (agent) => {
			console.log('Agent created:', agent);
			toast.success(`New agent created: ${agent.name}`);
		});

		socket.on('agent:removed', (data) => {
			console.log('Agent removed:', data);
			toast.error(`Agent removed`);
		});

		socket.on('agent:updated', (agent) => {
			console.log('Agent updated:', agent);
			toast(`Agent updated: ${agent.name}`);
		});

		socket.on('engine:started', () => {
			console.log('Engine started');
			toast.success('Agent engine started');
		});

		socket.on('engine:stopped', () => {
			console.log('Engine stopped');
			toast('Agent engine stopped');
		});

		return () => {
			cleanup();
		};
	});
</script>

<main>
	<slot />
</main>

<style>
	main {
		min-height: 100vh;
		background: linear-gradient(135deg, var(--background-color) 0%, #1e1b4b 100%);
	}
</style> 