import { writable } from 'svelte/store';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';

const API_BASE = 'http://localhost:8000';

// Socket connection
let socket: Socket;

// Agent stores
export const agents = writable<any[]>([]);
export const selectedAgent = writable<any>(null);
export const agentMemory = writable<any[]>([]);
export const agentContent = writable<any[]>([]);
export const agentConversations = writable<any[]>([]);
export const agentNetwork = writable<any[]>([]);
export const agentActivities = writable<any[]>([]);
export const agentTools = writable<any[]>([]);
export const agentEvolution = writable<any>(null);

// Network state
export const networkState = writable<any>(null);
export const networkConnections = writable<any[]>([]);
export const kolAgents = writable<string[]>([]);
export const trendingTopics = writable<string[]>([]);
export const marketTrends = writable<any[]>([]);

// Engine state
export const engineStatus = writable<boolean>(false);
export const heartbeat = writable<any>(null);

// Loading states
export const loading = writable<boolean>(false);
export const connecting = writable<boolean>(false);

// Error state
export const error = writable<string | null>(null);

// Chat room message store
export const chatMessages = writable<Array<{
  id: string;
  type: 'heartbeat' | 'activity' | 'conversation' | 'agent_created' | 'agent_removed' | 'tool_usage' | 'evolution' | 'system';
  timestamp: Date;
  content: string;
  agentId?: string;
  agentName?: string;
  metadata?: any;
}>>([]);

// Throttle chat message updates for better performance
let lastChatUpdate = 0;
const CHAT_UPDATE_THROTTLE = 200; // ms

export function addChatMessage(type: string, content: string, agentId?: string, agentName?: string, metadata?: any) {
  const now = Date.now();
  if (now - lastChatUpdate < CHAT_UPDATE_THROTTLE) {
    return; // Skip if too frequent
  }
  lastChatUpdate = now;
  
  const message = {
    id: `msg-${Date.now()}-${Math.random()}`,
    type: type as any,
    timestamp: new Date(),
    content,
    agentId,
    agentName,
    metadata
  };
  
  chatMessages.update(messages => {
    const newMessages = [...messages, message];
    // Keep only last 50 messages for better performance
    return newMessages.slice(-50);
  });
}

// Initialize socket connection
export function initializeSocket() {
  connecting.set(true);
  
  socket = io('http://localhost:8000');
  
  socket.on('connect', () => {
    console.log('Connected to server');
    connecting.set(false);
    error.set(null);
  });
  
  socket.on('disconnect', () => {
    console.log('Disconnected from server');
    connecting.set(false);
  });
  
  socket.on('connect_error', (err) => {
    console.error('Connection error:', err);
    connecting.set(false);
    error.set('Failed to connect to server');
  });
  
  // Network state updates
  socket.on('network:state', (state) => {
    networkState.set(state);
    agents.set(state.agents || []);
    kolAgents.set(state.kolAgents || []);
    trendingTopics.set(state.trendingTopics || []);
    marketTrends.set(state.marketTrends || []);
  });
  
  socket.on('network:update', (state) => {
    networkState.set(state);
    agents.set(state.agents || []);
    kolAgents.set(state.kolAgents || []);
    trendingTopics.set(state.trendingTopics || []);
    marketTrends.set(state.marketTrends || []);
  });
  
  // Agent events
  socket.on('agent:created', (agent) => {
    agents.update(current => {
      const currentArray = Array.isArray(current) ? current : [];
      return [...currentArray, agent];
    });
    addChatMessage('agent_created', `New agent created: ${agent.name} (${agent.type})`, agent.id, agent.name);
  });
  
  socket.on('agent:removed', (data) => {
    agents.update(current => current.filter(agent => agent.id !== data.agentId));
    addChatMessage('agent_removed', `Agent removed: ${data.agentId}`, data.agentId);
  });
  
  socket.on('agent:updated', (agent) => {
    agents.update(current => 
      current.map(a => a.id === agent.id ? agent : a)
    );
    addChatMessage('activity', `${agent.name} updated: ${agent.status}`, agent.id, agent.name);
  });
  
  socket.on('agent:connection:created', (data) => {
    networkConnections.update(current => [...current, data]);
  });
  
  // Memory events
  socket.on('agent:memory:added', (memory) => {
    agentMemory.update(current => {
      const currentArray = Array.isArray(current) ? current : [];
      return [...currentArray, memory];
    });
    addChatMessage('activity', `Memory added: ${memory.type}`, memory.agentId);
  });
  
  // Content events
  socket.on('agent:content:updated', (content) => {
    agentContent.update(current => {
      const currentArray = Array.isArray(current) ? current : [];
      return [...currentArray, content];
    });
  });
  
  // Conversation events
  socket.on('agent:conversation:added', (conversation) => {
    agentConversations.update(current => {
      const currentArray = Array.isArray(current) ? current : [];
      return [...currentArray, conversation];
    });
    addChatMessage('conversation', `Conversation: ${conversation.message.substring(0, 50)}...`, conversation.agentId);
  });
  
  // Activity events
  socket.on('agent:activity', (activity) => {
    agentActivities.update(current => {
      const currentArray = Array.isArray(current) ? current : [];
      return [...currentArray, activity];
    });
  });
  
  // Tool events
  socket.on('agent:tool:started', (toolData) => {
    const toolName = toolData?.name || 'Unknown Tool';
    addChatMessage('tool_usage', `Tool started: ${toolName}`, toolData?.agentId);
  });
  
  socket.on('agent:tool:completed', (toolData) => {
    const toolName = toolData?.name || 'Unknown Tool';
    addChatMessage('tool_usage', `Tool completed: ${toolName}`, toolData?.agentId);
  });
  
  // Evolution events
  socket.on('agent:levelup', (evolutionData) => {
    console.log('Agent leveled up:', evolutionData);
    addChatMessage('evolution', `Agent leveled up: ${evolutionData.agentName} reached level ${evolutionData.newLevel}`, evolutionData.agentId, evolutionData.agentName);
  });
  
  // Engine events
  socket.on('engine:started', () => {
    engineStatus.set(true);
  });
  
  socket.on('engine:stopped', () => {
    engineStatus.set(false);
  });
  
  // Heartbeat events
  socket.on('agent:heartbeat', (heartbeatData) => {
    heartbeat.set(heartbeatData);
    addChatMessage('heartbeat', `Network heartbeat: ${heartbeatData.agentsCount} agents active, last update: ${new Date(heartbeatData.timestamp).toLocaleTimeString()}`);
  });
  
  // Error events
  socket.on('error', (errorData) => {
    error.set(errorData.message || 'An error occurred');
  });
  
  return socket;
}

// Agent management functions
export async function createAgent(agentData: any) {
  try {
    loading.set(true);
    const response = await axios.post(`${API_BASE}/api/agents`, agentData);
    return response.data;
  } catch (error) {
    console.error('Failed to create agent:', error);
    throw error;
  } finally {
    loading.set(false);
  }
}

export async function removeAgent(agentId: string) {
  try {
    loading.set(true);
    await axios.delete(`${API_BASE}/api/agents/${agentId}`);
  } catch (error) {
    console.error('Failed to remove agent:', error);
    throw error;
  } finally {
    loading.set(false);
  }
}

export async function updateAgent(agentId: string, updateData: any) {
  try {
    loading.set(true);
    const response = await axios.put(`${API_BASE}/api/agents/${agentId}`, updateData);
    return response.data;
  } catch (error) {
    console.error('Failed to update agent:', error);
    throw error;
  } finally {
    loading.set(false);
  }
}

export async function createConnection(agentId1: string, agentId2: string) {
  try {
    loading.set(true);
    await axios.post(`${API_BASE}/api/agents/${agentId1}/connections`, {
      targetAgentId: agentId2
    });
  } catch (error) {
    console.error('Failed to create connection:', error);
    throw error;
  } finally {
    loading.set(false);
  }
}

export async function addMemory(agentId: string, type: string, content: string, metadata?: any) {
  try {
    loading.set(true);
    await axios.post(`${API_BASE}/api/agents/${agentId}/memory`, {
      type,
      content,
      metadata
    });
  } catch (error) {
    console.error('Failed to add memory:', error);
    throw error;
  } finally {
    loading.set(false);
  }
}

export async function loadAgentMemory(agentId: string) {
  try {
    loading.set(true);
    const response = await axios.get(`${API_BASE}/api/agents/${agentId}/memory`);
    agentMemory.set(response.data);
  } catch (error) {
    console.error('Failed to load agent memory:', error);
    throw error;
  } finally {
    loading.set(false);
  }
}

export async function updateContent(agentId: string, type: string, content: string) {
  try {
    loading.set(true);
    await axios.post(`${API_BASE}/api/agents/${agentId}/content`, {
      type,
      content
    });
  } catch (error) {
    console.error('Failed to update content:', error);
    throw error;
  } finally {
    loading.set(false);
  }
}

export async function loadAgentContent(agentId: string) {
  try {
    loading.set(true);
    const response = await axios.get(`${API_BASE}/api/agents/${agentId}/content`);
    agentContent.set(response.data);
  } catch (error) {
    console.error('Failed to load agent content:', error);
    throw error;
  } finally {
    loading.set(false);
  }
}

export async function addConversation(agentId: string, participantId: string, message: string, direction: 'incoming' | 'outgoing' = 'outgoing') {
  try {
    loading.set(true);
    await axios.post(`${API_BASE}/api/agents/${agentId}/conversations`, {
      participantId,
      message,
      direction
    });
  } catch (error) {
    console.error('Failed to add conversation:', error);
    throw error;
  } finally {
    loading.set(false);
  }
}

export async function loadAgentConversations(agentId: string) {
  try {
    loading.set(true);
    const response = await axios.get(`${API_BASE}/api/agents/${agentId}/conversations`);
    agentConversations.set(response.data);
  } catch (error) {
    console.error('Failed to load agent conversations:', error);
    throw error;
  } finally {
    loading.set(false);
  }
}

export async function loadAgentNetwork(agentId: string) {
  try {
    loading.set(true);
    const response = await axios.get(`${API_BASE}/api/agents/${agentId}/network`);
    agentNetwork.set(response.data);
  } catch (error) {
    console.error('Failed to load agent network:', error);
    throw error;
  } finally {
    loading.set(false);
  }
}

export async function loadAgentActivities(agentId: string) {
  try {
    loading.set(true);
    const response = await axios.get(`${API_BASE}/api/agents/${agentId}/activities`);
    agentActivities.set(response.data);
  } catch (error) {
    console.error('Failed to load agent activities:', error);
    throw error;
  } finally {
    loading.set(false);
  }
}

export async function loadAgentTools(agentId: string) {
  try {
    loading.set(true);
    const response = await axios.get(`${API_BASE}/api/agents/${agentId}/tools`);
    agentTools.set(response.data);
  } catch (error) {
    console.error('Failed to load agent tools:', error);
    throw error;
  } finally {
    loading.set(false);
  }
}

export async function loadAgentEvolution(agentId: string) {
  try {
    loading.set(true);
    const response = await axios.get(`${API_BASE}/api/agents/${agentId}/evolution`);
    agentEvolution.set(response.data);
  } catch (error) {
    console.error('Failed to load agent evolution:', error);
    throw error;
  } finally {
    loading.set(false);
  }
}

export async function startEngine() {
  try {
    loading.set(true);
    await axios.post(`${API_BASE}/api/agents/engine/start`);
    engineStatus.set(true);
  } catch (error) {
    console.error('Failed to start engine:', error);
    throw error;
  } finally {
    loading.set(false);
  }
}

export async function stopEngine() {
  try {
    loading.set(true);
    await axios.post(`${API_BASE}/api/agents/engine/stop`);
    engineStatus.set(false);
  } catch (error) {
    console.error('Failed to stop engine:', error);
    throw error;
  } finally {
    loading.set(false);
  }
}

export function selectAgent(agent: any) {
  selectedAgent.set(agent);
  if (agent) {
    loadAgentMemory(agent.id);
    loadAgentContent(agent.id);
    loadAgentConversations(agent.id);
    loadAgentNetwork(agent.id);
    loadAgentActivities(agent.id);
    loadAgentTools(agent.id);
    loadAgentEvolution(agent.id);
  }
}

export function subscribeToAgent(agentId: string) {
  if (socket) {
    socket.emit('agent:subscribe', { agentId });
  }
}

export function unsubscribeFromAgent(agentId: string) {
  if (socket) {
    socket.emit('agent:unsubscribe', { agentId });
  }
}

export function requestNetworkState() {
  if (socket) {
    socket.emit('network:state:request');
  }
}

export function requestAgentDetails(agentId: string) {
  if (socket) {
    socket.emit('agent:details:request', { agentId });
  }
}

export function cleanup() {
  if (socket) {
    socket.disconnect();
  }
} 