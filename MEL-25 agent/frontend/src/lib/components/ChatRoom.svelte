<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { agents, heartbeat, networkState, chatMessages, addChatMessage } from '$lib/stores';

  export let isVisible = false;
  export let onClose: () => void;

  let autoScroll = true;
  let messageInput = '';
  let filteredTypes: Set<string> = new Set(['heartbeat', 'activity', 'conversation', 'agent_created', 'agent_removed', 'tool_usage', 'evolution', 'system']);

  const messageTypes = [
    { id: 'heartbeat', label: '💓 Heartbeat', color: '#10b981' },
    { id: 'activity', label: '🔄 Activity', color: '#3b82f6' },
    { id: 'conversation', label: '💬 Conversation', color: '#8b5cf6' },
    { id: 'agent_created', label: '➕ Agent Created', color: '#059669' },
    { id: 'agent_removed', label: '➖ Agent Removed', color: '#dc2626' },
    { id: 'tool_usage', label: '🛠️ Tool Usage', color: '#f59e0b' },
    { id: 'evolution', label: '📈 Evolution', color: '#ec4899' },
    { id: 'system', label: '⚙️ System', color: '#6b7280' }
  ];

  onMount(() => {
    // Initialize with some system messages
    addChatMessage('system', 'Chat room initialized. Monitoring agent network...');
  });



  function toggleMessageType(type: string) {
    if (filteredTypes.has(type)) {
      filteredTypes.delete(type);
    } else {
      filteredTypes.add(type);
    }
    filteredTypes = filteredTypes; // Trigger reactivity
  }

  function clearMessages() {
    chatMessages.set([]);
  }

  function sendSystemMessage() {
    if (messageInput.trim()) {
      addChatMessage('system', messageInput.trim());
      messageInput = '';
    }
  }

  function getMessageTypeColor(type: string): string {
    const messageType = messageTypes.find(t => t.id === type);
    return messageType?.color || '#6b7280';
  }

  function getMessageTypeLabel(type: string): string {
    const messageType = messageTypes.find(t => t.id === type);
    return messageType?.label || 'Unknown';
  }

  function formatTime(date: Date): string {
    return date.toLocaleTimeString();
  }

  function formatDate(date: Date): string {
    return date.toLocaleDateString();
  }

  // Performance optimization: limit messages and throttle updates
  let lastUpdateTime = 0;
  const UPDATE_THROTTLE = 100; // ms
  
  $: {
    const now = Date.now();
    if (now - lastUpdateTime > UPDATE_THROTTLE) {
      lastUpdateTime = now;
      // Only keep last 50 messages for performance
      filteredMessages = $chatMessages
        .filter(msg => filteredTypes.has(msg.type))
        .slice(-50);
    }
  }
  
  let filteredMessages: typeof $chatMessages = [];
</script>

{#if isVisible}
  <div class="chat-room-modal">
    <div class="chat-content">
      <div class="chat-header">
        <div class="chat-title">
          <h2>🤖 Agent Network Chat Room</h2>
          <span class="message-count">{filteredMessages.length} messages</span>
        </div>
        <div class="chat-controls">
          <button class="clear-btn" on:click={clearMessages}>Clear</button>
          <button class="close-btn" on:click={onClose}>×</button>
        </div>
      </div>

      <div class="filter-bar">
        <span class="filter-label">Show:</span>
        {#each messageTypes as type}
          <button 
            class="filter-btn {filteredTypes.has(type.id) ? 'active' : ''}"
            style="--type-color: {type.color}"
            on:click={() => toggleMessageType(type.id)}
          >
            {type.label}
          </button>
        {/each}
      </div>

      <div class="chat-messages">
        {#each filteredMessages as message (message.id)}
          <div class="message {message.type}" style="--message-color: {getMessageTypeColor(message.type)}">
            <div class="message-header">
              <span class="message-type" style="color: {getMessageTypeColor(message.type)}">
                {getMessageTypeLabel(message.type)}
              </span>
              <span class="message-time">{formatTime(message.timestamp)}</span>
            </div>
            {#if message.agentName}
              <div class="message-agent">
                <span class="agent-name">{message.agentName}</span>
                {#if message.agentId}
                  <span class="agent-id">({message.agentId})</span>
                {/if}
              </div>
            {/if}
            <div class="message-content">{message.content}</div>
            {#if message.metadata}
              <div class="message-metadata">
                <small>{JSON.stringify(message.metadata)}</small>
              </div>
            {/if}
          </div>
        {/each}
      </div>

      <div class="chat-input">
        <input 
          type="text" 
          bind:value={messageInput}
          placeholder="Type a system message..."
          on:keydown={(e) => e.key === 'Enter' && sendSystemMessage()}
        />
        <button class="send-btn" on:click={sendSystemMessage}>Send</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .chat-room-modal {
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

  .chat-content {
    background: white;
    color: #333;
    border-radius: 1rem;
    max-width: 1000px;
    max-height: 90vh;
    width: 100%;
    display: flex;
    flex-direction: column;
  }

  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .chat-title {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .chat-title h2 {
    margin: 0;
    color: #1f2937;
  }

  .message-count {
    background: #f3f4f6;
    color: #6b7280;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
  }

  .chat-controls {
    display: flex;
    gap: 0.5rem;
  }

  .clear-btn {
    padding: 0.5rem 1rem;
    background: #f3f4f6;
    color: #374151;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 0.875rem;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #6b7280;
  }

  .filter-bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    overflow-x: auto;
  }

  .filter-label {
    font-weight: 600;
    color: #374151;
    white-space: nowrap;
  }

  .filter-btn {
    padding: 0.25rem 0.5rem;
    border: 1px solid #d1d5db;
    background: white;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 0.75rem;
    white-space: nowrap;
    transition: all 0.2s ease;
  }

  .filter-btn.active {
    background: var(--type-color);
    color: white;
    border-color: var(--type-color);
  }

  .filter-btn:hover:not(.active) {
    background: #f3f4f6;
  }

  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 1.5rem;
    max-height: 60vh;
  }

  .message {
    margin-bottom: 1rem;
    padding: 1rem;
    border-radius: 0.5rem;
    border-left: 4px solid var(--message-color);
    background: #f9fafb;
  }

  .message-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .message-type {
    font-weight: 600;
    font-size: 0.875rem;
  }

  .message-time {
    font-size: 0.75rem;
    color: #6b7280;
  }

  .message-agent {
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
  }

  .agent-name {
    font-weight: 600;
    color: #1f2937;
  }

  .agent-id {
    color: #6b7280;
    margin-left: 0.5rem;
  }

  .message-content {
    color: #1f2937;
    line-height: 1.5;
  }

  .message-metadata {
    margin-top: 0.5rem;
    padding: 0.5rem;
    background: #f3f4f6;
    border-radius: 0.25rem;
    font-family: monospace;
    font-size: 0.75rem;
    color: #6b7280;
  }

  .chat-input {
    display: flex;
    gap: 0.5rem;
    padding: 1rem 1.5rem;
    border-top: 1px solid #e5e7eb;
  }

  .chat-input input {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.25rem;
    font-size: 0.875rem;
  }

  .send-btn {
    padding: 0.75rem 1rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    font-weight: 600;
  }

  .send-btn:hover {
    background: #2563eb;
  }

  /* Message type specific styles */
  .message.heartbeat {
    background: #f0fdf4;
  }

  .message.activity {
    background: #eff6ff;
  }

  .message.conversation {
    background: #faf5ff;
  }

  .message.agent_created {
    background: #f0fdf4;
  }

  .message.agent_removed {
    background: #fef2f2;
  }

  .message.tool_usage {
    background: #fffbeb;
  }

  .message.evolution {
    background: #fdf2f8;
  }

  .message.system {
    background: #f9fafb;
  }
</style> 