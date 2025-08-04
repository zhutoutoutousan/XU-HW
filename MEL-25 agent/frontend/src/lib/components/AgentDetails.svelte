<script lang="ts">
  import { onMount } from 'svelte';
  import {
    agentMemory,
    agentContent,
    agentConversations,
    agentNetwork,
    agentActivities,
    agentTools,
    agentEvolution
  } from '$lib/stores';

  export let agent: any;
  export let onClose: () => void;

  let activeTab = 'overview';
  let realTimeUpdates = true;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'activities', label: 'Activities', icon: '🔄' },
    { id: 'tools', label: 'Tools', icon: '🛠️' },
    { id: 'memory', label: 'Memory', icon: '🧠' },
    { id: 'conversations', label: 'Conversations', icon: '💬' },
    { id: 'evolution', label: 'Evolution', icon: '📈' },
    { id: 'network', label: 'Network', icon: '🌐' }
  ];

  function getStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'text-green-500';
      case 'thinking': return 'text-yellow-500';
      case 'communicating': return 'text-blue-500';
      case 'learning': return 'text-purple-500';
      case 'creating': return 'text-orange-500';
      case 'inactive': return 'text-red-500';
      default: return 'text-gray-500';
    }
  }

  function getMoodColor(mood: string): string {
    switch (mood) {
      case 'excited': return 'text-red-500';
      case 'focused': return 'text-blue-500';
      case 'curious': return 'text-green-500';
      case 'concerned': return 'text-yellow-500';
      case 'confident': return 'text-purple-500';
      default: return 'text-gray-500';
    }
  }

  function getToolStatusColor(status: string): string {
    switch (status) {
      case 'running': return 'text-blue-500';
      case 'completed': return 'text-green-500';
      case 'failed': return 'text-red-500';
      case 'idle': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  }

  function formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString();
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
</script>

<div class="agent-details-modal" style="border: 5px solid red;">
  <div class="modal-content">
    <div class="modal-header">
      <div class="agent-header">
        <h2>{agent?.name || 'Agent Details'}</h2>
        <div class="agent-status">
          <span class="status-badge {getStatusColor(agent?.status)}">
            {agent?.status || 'unknown'}
          </span>
          {#if agent?.mood}
            <span class="mood-badge {getMoodColor(agent.mood)}">
              {agent.mood}
            </span>
          {/if}
        </div>
      </div>
      <button class="close-btn" on:click={onClose}>×</button>
    </div>

    <div class="modal-body">
      <!-- Agent Thinking Process -->
      <div class="thinking-section">
        <h3>🧠 Current Thinking Process</h3>
        <div class="thinking-content">
          <p class="current-thought">{agent?.currentThought || 'Processing information...'}</p>
          <div class="thought-meta">
            <span class="mood">Mood: {agent?.mood || 'neutral'}</span>
            <span class="task">Task: {agent?.currentTask || 'idle'}</span>
          </div>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="tab-navigation">
        {#each tabs as tab}
          <button 
            class="tab-btn {activeTab === tab.id ? 'active' : ''}"
            on:click={() => activeTab = tab.id}
          >
            {tab.icon} {tab.label}
          </button>
        {/each}
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        {#if activeTab === 'overview'}
          <div class="overview-tab">
            <div class="agent-info-grid">
              <div class="info-card">
                <h3>Basic Information</h3>
                <p><strong>ID:</strong> {agent?.id}</p>
                <p><strong>Type:</strong> {agent?.type}</p>
                <p><strong>Performance:</strong> {agent?.performance_score}%</p>
                <p><strong>Cash Flow:</strong> ${agent?.cash_flow?.toLocaleString()}</p>
                <p><strong>Last Heartbeat:</strong> {formatTime(agent?.lastHeartbeat)}</p>
              </div>

              <div class="info-card">
                <h3>Current State</h3>
                <p><strong>Status:</strong> <span class="{getStatusColor(agent?.status)}">{agent?.status}</span></p>
                <p><strong>Mood:</strong> <span class="{getMoodColor(agent?.mood)}">{agent?.mood}</span></p>
                <p><strong>Current Thought:</strong> {agent?.currentThought || 'No current thought'}</p>
                <p><strong>Current Task:</strong> {agent?.currentTask || 'No current task'}</p>
              </div>

              <div class="info-card">
                <h3>Evolution</h3>
                {#if $agentEvolution}
                  <p><strong>Level:</strong> {$agentEvolution.level}</p>
                  <p><strong>Experience:</strong> {$agentEvolution.experience}</p>
                  <p><strong>Influence:</strong> {$agentEvolution.influence}%</p>
                  <p><strong>Followers:</strong> {$agentEvolution.followers?.length || 0}</p>
                  <p><strong>Specializations:</strong> {$agentEvolution.specializations?.join(', ') || 'None'}</p>
                {:else}
                  <p>Loading evolution data...</p>
                {/if}
              </div>

              <div class="info-card">
                <h3>Capabilities & Goals</h3>
                <p><strong>Capabilities:</strong></p>
                <ul>
                  {#each agent?.capabilities || [] as capability}
                    <li>{capability}</li>
                  {/each}
                </ul>
                <p><strong>Goals:</strong></p>
                <ul>
                  {#each agent?.goals || [] as goal}
                    <li>{goal}</li>
                  {/each}
                </ul>
              </div>
            </div>
          </div>
        {:else if activeTab === 'activities'}
          <div class="activities-tab">
            <div class="activities-header">
              <h3>🔄 Action History ({$agentActivities?.length || 0})</h3>
              <label class="real-time-toggle">
                <input type="checkbox" bind:checked={realTimeUpdates}>
                Real-time updates
              </label>
            </div>
            
            {#if $agentActivities && $agentActivities.length > 0}
              <div class="activities-list">
                {#each $agentActivities?.slice(-25) as activity}
                  <div class="activity-item activity-{activity.type}">
                    <div class="activity-header">
                      <span class="activity-type">
                        {#if activity.type === 'thinking'}🧠
                        {:else if activity.type === 'communicating'}💬
                        {:else if activity.type === 'tool_usage'}🛠️
                        {:else if activity.type === 'decision_making'}⚖️
                        {:else if activity.type === 'learning'}📚
                        {:else if activity.type === 'creating_agent'}➕
                        {:else}🔄
                        {/if}
                        {activity.type.replace('_', ' ')}
                      </span>
                      <span class="activity-time">{formatTime(activity.timestamp)}</span>
                    </div>
                    <div class="activity-description">
                      <strong>Action:</strong> {activity.description}
                    </div>
                    {#if activity.duration}
                      <div class="activity-duration">⏱️ Duration: {activity.duration}s</div>
                    {/if}
                    {#if activity.metadata}
                      <div class="activity-metadata">
                        <span class="mood">😊 Mood: {activity.metadata.mood}</span>
                        <span class="level">📊 Level: {activity.metadata.level}</span>
                        <span class="influence">💪 Influence: {activity.metadata.influence}%</span>
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            {:else}
              <div class="empty-state">
                <p>🤔 No activities recorded yet. This agent hasn't performed any actions.</p>
                <p>Activities will appear here as the agent thinks, communicates, and uses tools.</p>
              </div>
            {/if}
          </div>
        {:else if activeTab === 'tools'}
          <div class="tools-tab">
            <h3>Agent Tools ({$agentTools?.length || 0})</h3>
            
            <div class="tools-grid">
              {#each $agentTools || [] as tool}
                <div class="tool-card">
                  <div class="tool-header">
                    <h4>{tool.name}</h4>
                    <span class="tool-status {getToolStatusColor(tool.status)}">
                      {tool.status}
                    </span>
                  </div>
                  <div class="tool-info">
                    <p><strong>Type:</strong> {tool.type}</p>
                    <p><strong>Success Rate:</strong> {tool.totalUses > 0 ? Math.round((tool.successCount / tool.totalUses) * 100) : 0}%</p>
                    <p><strong>Total Uses:</strong> {tool.totalUses}</p>
                    <p><strong>Last Used:</strong> {formatTime(tool.lastUsed)}</p>
                  </div>
                  {#if tool.currentTask}
                    <div class="tool-task">
                      <strong>Current Task:</strong> {tool.currentTask}
                    </div>
                  {/if}
                  {#if tool.results}
                    <div class="tool-results">
                      <strong>Results:</strong> {tool.results}
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {:else if activeTab === 'memory'}
          <div class="memory-tab">
            <h3>Agent Memory ({$agentMemory?.length || 0} entries)</h3>
            
            <div class="memory-list">
              {#each $agentMemory?.slice(-15) as memory}
                <div class="memory-item">
                  <div class="memory-header">
                    <span class="memory-type">{memory.type}</span>
                    <span class="memory-importance">Importance: {memory.importance}/10</span>
                    <span class="memory-time">{formatTime(memory.timestamp)}</span>
                  </div>
                  <div class="memory-content">{memory.content}</div>
                </div>
              {/each}
            </div>
          </div>
        {:else if activeTab === 'conversations'}
          <div class="conversations-tab">
            <h3>🤖 Agent Conversations ({$agentConversations?.length || 0})</h3>
            
            {#if $agentConversations && $agentConversations.length > 0}
              <div class="conversations-list">
                {#each $agentConversations?.slice(-20) as conversation}
                  <div class="conversation-item {conversation.direction}">
                    <div class="conversation-header">
                      <span class="conversation-direction">
                        {conversation.direction === 'outgoing' ? '💬 Sent' : '📥 Received'}
                      </span>
                      <span class="conversation-participant">
                        {conversation.direction === 'outgoing' ? `to ${conversation.participantId}` : `from ${conversation.participantId}`}
                      </span>
                      <span class="conversation-time">{formatTime(conversation.timestamp)}</span>
                    </div>
                    <div class="conversation-message">
                      <strong>Message:</strong> {conversation.message}
                    </div>
                    <div class="conversation-meta">
                      {#if conversation.sentiment}
                        <span class="conversation-sentiment sentiment-{conversation.sentiment}">
                          Sentiment: {conversation.sentiment}
                        </span>
                      {/if}
                      {#if conversation.topic}
                        <span class="conversation-topic">Topic: {conversation.topic}</span>
                      {/if}
                      {#if conversation.influence_gained}
                        <span class="conversation-influence">Influence: +{conversation.influence_gained}</span>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            {:else}
              <div class="empty-state">
                <p>🤔 No conversations yet. This agent hasn't communicated with others.</p>
                <p>Check back later as agents interact more!</p>
              </div>
            {/if}
          </div>
        {:else if activeTab === 'evolution'}
          <div class="evolution-tab">
            <h3>Agent Evolution</h3>
            
            {#if $agentEvolution}
              <div class="evolution-grid">
                <div class="evolution-card">
                  <h4>Level & Experience</h4>
                  <div class="level-display">
                    <span class="level-number">{$agentEvolution.level}</span>
                    <div class="experience-bar">
                      <div class="experience-fill" style="width: {($agentEvolution.experience / ($agentEvolution.level * 100)) * 100}%"></div>
                    </div>
                    <span class="experience-text">{$agentEvolution.experience} / {$agentEvolution.level * 100} XP</span>
                  </div>
                </div>

                <div class="evolution-card">
                  <h4>Influence & Followers</h4>
                  <div class="influence-display">
                    <span class="influence-number">{$agentEvolution.influence}%</span>
                    <div class="influence-bar">
                      <div class="influence-fill" style="width: {$agentEvolution.influence}%"></div>
                    </div>
                    <span class="followers-text">{$agentEvolution.followers?.length || 0} followers</span>
                  </div>
                </div>

                <div class="evolution-card">
                  <h4>Specializations</h4>
                  <div class="specializations-list">
                    {#each $agentEvolution.specializations || [] as spec}
                      <span class="specialization-tag">{spec}</span>
                    {/each}
                  </div>
                </div>

                <div class="evolution-card">
                  <h4>Achievements</h4>
                  <div class="achievements-list">
                    {#each $agentEvolution.achievements || [] as achievement}
                      <div class="achievement-item">🏆 {achievement}</div>
                    {/each}
                  </div>
                </div>
              </div>
            {:else}
              <p>Loading evolution data...</p>
            {/if}
          </div>
        {:else if activeTab === 'network'}
          <div class="network-tab">
            <h3>Network Connections ({$agentNetwork?.length || 0})</h3>
            
            <div class="network-list">
              {#each $agentNetwork || [] as connection}
                <div class="network-connection">
                  <span class="connection-id">{connection}</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
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
    max-width: 1200px;
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

  .agent-header {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .agent-header h2 {
    margin: 0;
    color: #1f2937;
  }

  .agent-status {
    display: flex;
    gap: 0.5rem;
  }

  .status-badge, .mood-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    font-weight: 600;
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

  .tab-navigation {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    overflow-x: auto;
  }

  .tab-btn {
    padding: 0.75rem 1rem;
    border: none;
    background: none;
    cursor: pointer;
    border-radius: 0.5rem 0.5rem 0 0;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .tab-btn.active {
    background: #3b82f6;
    color: white;
  }

  .tab-btn:hover:not(.active) {
    background: #f3f4f6;
  }

  .tab-content {
    min-height: 400px;
  }

  .agent-info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .info-card {
    background: #f9fafb;
    padding: 1.5rem;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
  }

  .info-card h3 {
    margin: 0 0 1rem 0;
    color: #1f2937;
    border-bottom: 2px solid #e5e7eb;
    padding-bottom: 0.5rem;
  }

  .activities-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .real-time-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
  }

  .activities-list {
    max-height: 400px;
    overflow-y: auto;
  }

  .activity-item {
    padding: 1rem;
    margin-bottom: 0.5rem;
    background: #f9fafb;
    border-radius: 0.5rem;
    border-left: 4px solid #3b82f6;
  }

  .activity-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }

  .activity-type {
    font-weight: 600;
    color: #374151;
  }

  .activity-time {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .activity-description {
    color: #1f2937;
    margin-bottom: 0.5rem;
  }

  .activity-duration {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .activity-metadata {
    font-size: 0.75rem;
    color: #9ca3af;
  }

  .tools-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
  }

  .tool-card {
    background: #f9fafb;
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
  }

  .tool-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .tool-header h4 {
    margin: 0;
    color: #1f2937;
  }

  .tool-status {
    font-size: 0.875rem;
    font-weight: 600;
  }

  .tool-info p {
    margin: 0.25rem 0;
    font-size: 0.875rem;
  }

  .tool-task, .tool-results {
    margin-top: 0.5rem;
    padding: 0.5rem;
    background: #f3f4f6;
    border-radius: 0.25rem;
    font-size: 0.875rem;
  }

  .memory-list, .conversations-list {
    max-height: 400px;
    overflow-y: auto;
  }

  .memory-item, .conversation-item {
    padding: 1rem;
    margin-bottom: 0.5rem;
    background: #f9fafb;
    border-radius: 0.5rem;
  }

  .memory-header, .conversation-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
  }

  .memory-type, .conversation-direction {
    font-weight: 600;
    color: #374151;
  }

  .memory-importance {
    color: #f59e0b;
  }

  .conversation-participant {
    color: #6b7280;
  }

  .memory-time, .conversation-time {
    color: #9ca3af;
  }

  .memory-content, .conversation-message {
    color: #1f2937;
    margin-bottom: 0.5rem;
  }

  .conversation-item.incoming {
    border-left: 4px solid #3b82f6;
  }

  .conversation-item.outgoing {
    border-left: 4px solid #10b981;
  }

  .conversation-sentiment, .conversation-topic, .conversation-influence {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .evolution-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }

  .evolution-card {
    background: #f9fafb;
    padding: 1.5rem;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
  }

  .evolution-card h4 {
    margin: 0 0 1rem 0;
    color: #1f2937;
  }

  .level-display, .influence-display {
    text-align: center;
  }

  .level-number, .influence-number {
    font-size: 2rem;
    font-weight: 700;
    color: #3b82f6;
  }

  .experience-bar, .influence-bar {
    width: 100%;
    height: 8px;
    background: #e5e7eb;
    border-radius: 4px;
    margin: 0.5rem 0;
    overflow: hidden;
  }

  .experience-fill, .influence-fill {
    height: 100%;
    background: #3b82f6;
    transition: width 0.3s ease;
  }

  .experience-text, .followers-text {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .specializations-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .specialization-tag {
    padding: 0.25rem 0.5rem;
    background: #dbeafe;
    color: #1e40af;
    border-radius: 0.25rem;
    font-size: 0.875rem;
  }

  .achievements-list {
    max-height: 200px;
    overflow-y: auto;
  }

  .achievement-item {
    padding: 0.5rem;
    margin-bottom: 0.25rem;
    background: #fef3c7;
    border-radius: 0.25rem;
    font-size: 0.875rem;
  }

  .network-list {
    max-height: 400px;
    overflow-y: auto;
  }

  .network-connection {
    padding: 0.75rem;
    background: #f3f4f6;
    border-radius: 0.25rem;
    margin-bottom: 0.5rem;
    font-family: monospace;
    font-size: 0.875rem;
  }

  /* Thinking Section Styles */
  .thinking-section {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1.5rem;
    border-radius: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .thinking-section h3 {
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
  }

  .thinking-content {
    background: rgba(255, 255, 255, 0.1);
    padding: 1rem;
    border-radius: 0.5rem;
    backdrop-filter: blur(10px);
  }

  .current-thought {
    font-size: 1.1rem;
    line-height: 1.6;
    margin: 0 0 1rem 0;
    font-style: italic;
  }

  .thought-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.875rem;
    opacity: 0.9;
  }

  .mood, .task {
    background: rgba(255, 255, 255, 0.2);
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
  }

  /* Enhanced Activity Styles */
  .activity-item {
    border-left: 4px solid #3b82f6;
    transition: all 0.2s ease;
  }

  .activity-item.activity-thinking {
    border-left-color: #8b5cf6;
  }

  .activity-item.activity-communicating {
    border-left-color: #10b981;
  }

  .activity-item.activity-tool_usage {
    border-left-color: #f59e0b;
  }

  .activity-item.activity-decision_making {
    border-left-color: #ef4444;
  }

  .activity-item.activity-learning {
    border-left-color: #06b6d4;
  }

  .activity-item.activity-creating_agent {
    border-left-color: #84cc16;
  }

  .activity-metadata {
    display: flex;
    gap: 1rem;
    margin-top: 0.5rem;
  }

  .activity-metadata span {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    background: #f3f4f6;
  }

  /* Enhanced Conversation Styles */
  .conversation-item {
    border-left: 4px solid #3b82f6;
    transition: all 0.2s ease;
  }

  .conversation-item.outgoing {
    border-left-color: #10b981;
  }

  .conversation-item.incoming {
    border-left-color: #3b82f6;
  }

  .conversation-meta {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
    flex-wrap: wrap;
  }

  .conversation-sentiment, .conversation-topic, .conversation-influence {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    background: #f3f4f6;
  }

  .sentiment-positive {
    background: #dcfce7 !important;
    color: #166534;
  }

  .sentiment-negative {
    background: #fef2f2 !important;
    color: #dc2626;
  }

  .sentiment-neutral {
    background: #f3f4f6 !important;
    color: #374151;
  }

  /* Empty State Styles */
  .empty-state {
    text-align: center;
    padding: 2rem;
    color: #6b7280;
  }

  .empty-state p {
    margin: 0.5rem 0;
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
</style> 