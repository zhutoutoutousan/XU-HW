import { Router } from 'express';
import { agentEngine } from '../services/agentEngine';
import { logger } from '../config/logger';

const router = Router();

// Get all agents with real-time data
router.get('/', async (_req, res) => {
  try {
    const agents = agentEngine.getAllAgents();
    return res.json({
      success: true,
      data: agents,
      count: agents.length,
      networkState: agentEngine.getNetworkState()
    });
  } catch (error) {
    logger.error('Failed to get agents:', error);
    return res.status(500).json({ error: 'Failed to get agents' });
  }
});

// Get specific agent with full details
router.get('/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const agent = agentEngine.getAgent(agentId);
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    return res.json({
      success: true,
      data: agent
    });
  } catch (error) {
    logger.error('Failed to get agent:', error);
    return res.status(500).json({ error: 'Failed to get agent' });
  }
});

// Create new agent
router.post('/', async (req, res) => {
  try {
    const agentData = req.body;
    const agent = await agentEngine.createAgent(agentData);
    
    return res.json({
      success: true,
      data: agent
    });
  } catch (error) {
    logger.error('Failed to create agent:', error);
    return res.status(500).json({ error: 'Failed to create agent' });
  }
});

// Update agent
router.put('/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const updateData = req.body;
    
    const agent = agentEngine.getAgent(agentId);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    // Update agent properties
    Object.assign(agent, updateData);
    agent.lastHeartbeat = new Date();
    
    return res.json({
      success: true,
      data: agent
    });
  } catch (error) {
    logger.error('Failed to update agent:', error);
    return res.status(500).json({ error: 'Failed to update agent' });
  }
});

// Remove agent
router.delete('/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    await agentEngine.removeAgent(agentId);
    
    return res.json({
      success: true,
      message: 'Agent removed successfully'
    });
  } catch (error) {
    logger.error('Failed to remove agent:', error);
    return res.status(500).json({ error: 'Failed to remove agent' });
  }
});

// Get agent memory
router.get('/:agentId/memory', async (req, res) => {
  try {
    const { agentId } = req.params;
    const memory = agentEngine.getAgentMemory(agentId);
    
    return res.json({
      success: true,
      data: memory,
      count: memory.length
    });
  } catch (error) {
    logger.error('Failed to get agent memory:', error);
    return res.status(500).json({ error: 'Failed to get agent memory' });
  }
});

// Add memory entry to agent
router.post('/:agentId/memory', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { type, content, metadata } = req.body;
    
    const agent = agentEngine.getAgent(agentId);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    const memoryEntry = {
      id: `memory-${Date.now()}`,
      agentId,
      type: type || 'observation',
      content,
      timestamp: new Date(),
      metadata,
      importance: Math.floor(Math.random() * 10) + 1
    };
    
    agent.memory.push(memoryEntry);
    
    return res.json({
      success: true,
      data: memoryEntry
    });
  } catch (error) {
    logger.error('Failed to add memory entry:', error);
    return res.status(500).json({ error: 'Failed to add memory entry' });
  }
});

// Get agent content
router.get('/:agentId/content', async (req, res) => {
  try {
    const { agentId } = req.params;
    const content = agentEngine.getAgentContent(agentId);
    
    return res.json({
      success: true,
      data: content,
      count: content.length
    });
  } catch (error) {
    logger.error('Failed to get agent content:', error);
    return res.status(500).json({ error: 'Failed to get agent content' });
  }
});

// Update agent content
router.post('/:agentId/content', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { type, content } = req.body;
    
    const agent = agentEngine.getAgent(agentId);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    const contentEntry = {
      id: `content-${Date.now()}`,
      agentId,
      type: type || 'profile',
      content,
      lastUpdated: new Date(),
      confidence: Math.floor(Math.random() * 100) + 1
    };
    
    agent.content.push(contentEntry);
    
    return res.json({
      success: true,
      data: contentEntry
    });
  } catch (error) {
    logger.error('Failed to update agent content:', error);
    return res.status(500).json({ error: 'Failed to update agent content' });
  }
});

// Get agent conversations
router.get('/:agentId/conversations', async (req, res) => {
  try {
    const { agentId } = req.params;
    const conversations = agentEngine.getAgentConversations(agentId);
    
    return res.json({
      success: true,
      data: conversations,
      count: conversations.length
    });
  } catch (error) {
    logger.error('Failed to get agent conversations:', error);
    return res.status(500).json({ error: 'Failed to get agent conversations' });
  }
});

// Add conversation to agent
router.post('/:agentId/conversations', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { participantId, message, direction } = req.body;
    
    const agent = agentEngine.getAgent(agentId);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    const conversation = {
      id: `conv-${Date.now()}`,
      agentId,
      participantId,
      message,
      timestamp: new Date(),
      direction: direction || 'outgoing'
    };
    
    agent.conversations.push(conversation);
    
    return res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    logger.error('Failed to add conversation:', error);
    return res.status(500).json({ error: 'Failed to add conversation' });
  }
});

// Get agent activities
router.get('/:agentId/activities', async (req, res) => {
  try {
    const { agentId } = req.params;
    const activities = agentEngine.getAgentActivities(agentId);
    
    return res.json({
      success: true,
      data: activities,
      count: activities.length
    });
  } catch (error) {
    logger.error('Failed to get agent activities:', error);
    return res.status(500).json({ error: 'Failed to get agent activities' });
  }
});

// Get agent tools
router.get('/:agentId/tools', async (req, res) => {
  try {
    const { agentId } = req.params;
    const tools = agentEngine.getAgentTools(agentId);
    
    return res.json({
      success: true,
      data: tools,
      count: tools.length
    });
  } catch (error) {
    logger.error('Failed to get agent tools:', error);
    return res.status(500).json({ error: 'Failed to get agent tools' });
  }
});

// Get agent evolution
router.get('/:agentId/evolution', async (req, res) => {
  try {
    const { agentId } = req.params;
    const evolution = agentEngine.getAgentEvolution(agentId);
    
    if (!evolution) {
      return res.status(404).json({ error: 'Agent evolution not found' });
    }
    
    return res.json({
      success: true,
      data: evolution
    });
  } catch (error) {
    logger.error('Failed to get agent evolution:', error);
    return res.status(500).json({ error: 'Failed to get agent evolution' });
  }
});

// Get agent network connections
router.get('/:agentId/network', async (req, res) => {
  try {
    const { agentId } = req.params;
    const connections = agentEngine.getAgentNetwork(agentId);
    
    // Get connected agents details
    const connectedAgents = connections.map(connId => {
      const agent = agentEngine.getAgent(connId);
      return agent ? {
        id: agent.id,
        name: agent.name,
        type: agent.type,
        status: agent.status
      } : null;
    }).filter(Boolean);
    
    return res.json({
      success: true,
      data: {
        connections: connections,
        connectedAgents: connectedAgents
      }
    });
  } catch (error) {
    logger.error('Failed to get agent network:', error);
    return res.status(500).json({ error: 'Failed to get agent network' });
  }
});

// Create connection between agents
router.post('/:agentId/connections', async (_req, res) => {
  try {
    const { agentId } = _req.params;
    const { targetAgentId } = _req.body;
    
    agentEngine.createConnection(agentId, targetAgentId);
    
    return res.json({
      success: true,
      message: 'Connection created successfully'
    });
  } catch (error) {
    logger.error('Failed to create connection:', error);
    return res.status(500).json({ error: 'Failed to create connection' });
  }
});

// Get network state
router.get('/network/state', async (_req, res) => {
  try {
    const networkState = agentEngine.getNetworkState();
    
    return res.json({
      success: true,
      data: networkState
    });
  } catch (error) {
    logger.error('Failed to get network state:', error);
    return res.status(500).json({ error: 'Failed to get network state' });
  }
});

// Start agent engine
router.post('/engine/start', async (_req, res) => {
  try {
    await agentEngine.start();
    
    return res.json({
      success: true,
      message: 'Agent engine started successfully'
    });
  } catch (error) {
    logger.error('Failed to start agent engine:', error);
    return res.status(500).json({ error: 'Failed to start agent engine' });
  }
});

// Stop agent engine
router.post('/engine/stop', async (_req, res) => {
  try {
    await agentEngine.stop();
    
    return res.json({
      success: true,
      message: 'Agent engine stopped successfully'
    });
  } catch (error) {
    logger.error('Failed to stop agent engine:', error);
    return res.status(500).json({ error: 'Failed to stop agent engine' });
  }
});

// Get engine status
router.get('/engine/status', async (_req, res) => {
  try {
    const isRunning = agentEngine.isRunning();
    const networkState = agentEngine.getNetworkState();
    
    return res.json({
      success: true,
      data: {
        isRunning,
        agentsCount: networkState.agents.length,
        lastHeartbeat: networkState.lastHeartbeat
      }
    });
  } catch (error) {
    logger.error('Failed to get engine status:', error);
    return res.status(500).json({ error: 'Failed to get engine status' });
  }
});

export { router as agentRoutes }; 