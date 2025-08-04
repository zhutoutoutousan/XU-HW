import { Server, Socket } from 'socket.io';
import { agentEngine } from '../services/agentEngine';
import { logger } from '../config/logger';

export function setupSocketHandlers(io: Server): void {
  // Handle agent engine events
  agentEngine.on('heartbeat', (data) => {
    io.emit('agent:heartbeat', data);
  });

  agentEngine.on('agent:activity', (activity) => {
    io.emit('agent:activity', activity);
  });

  agentEngine.on('agent:conversation', (conversation) => {
    io.emit('agent:conversation', conversation);
  });

  agentEngine.on('agent:levelup', (evolutionData) => {
    io.emit('agent:levelup', evolutionData);
  });

  agentEngine.on('agent:tool:started', (toolData) => {
    io.emit('agent:tool:started', toolData);
  });

  agentEngine.on('agent:tool:completed', (toolData) => {
    io.emit('agent:tool:completed', toolData);
  });

  agentEngine.on('agent:created', (agent) => {
    io.emit('agent:created', agent);
  });

  agentEngine.on('agent:removed', (data) => {
    io.emit('agent:removed', data);
  });

  agentEngine.on('agent:updated', (agent) => {
    io.emit('agent:updated', agent);
  });

  agentEngine.on('agent:connection:created', (data) => {
    io.emit('agent:connection:created', data);
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Send initial network state
    socket.emit('network:state', agentEngine.getNetworkState());

    // Handle agent creation requests
    socket.on('agent:create', async (agentData) => {
      try {
        const agent = await agentEngine.createAgent(agentData);
        socket.emit('agent:created', agent);
        io.emit('agent:created', agent);
      } catch (error) {
        logger.error('Failed to create agent:', error);
        socket.emit('error', { message: 'Failed to create agent' });
      }
    });

    // Handle agent removal requests
    socket.on('agent:remove', async (agentId) => {
      try {
        await agentEngine.removeAgent(agentId);
        socket.emit('agent:removed', { agentId });
        io.emit('agent:removed', { agentId });
      } catch (error) {
        logger.error('Failed to remove agent:', error);
        socket.emit('error', { message: 'Failed to remove agent' });
      }
    });

    // Handle agent update requests
    socket.on('agent:update', async (data) => {
      try {
        const { agentId, updateData } = data;
        const agent = agentEngine.getAgent(agentId);
        
        if (!agent) {
          socket.emit('error', { message: 'Agent not found' });
          return;
        }

        Object.assign(agent, updateData);
        agent.lastHeartbeat = new Date();
        
        socket.emit('agent:updated', agent);
        io.emit('agent:updated', agent);
      } catch (error) {
        logger.error('Failed to update agent:', error);
        socket.emit('error', { message: 'Failed to update agent' });
      }
    });

    // Handle connection creation requests
    socket.on('agent:connect', (data) => {
      try {
        const { agentId1, agentId2 } = data;
        agentEngine.createConnection(agentId1, agentId2);
        
        const connectionData = {
          agentId1,
          agentId2,
          timestamp: new Date()
        };
        
        socket.emit('agent:connection:created', connectionData);
        io.emit('agent:connection:created', connectionData);
      } catch (error) {
        logger.error('Failed to create connection:', error);
        socket.emit('error', { message: 'Failed to create connection' });
      }
    });

    // Handle memory addition requests
    socket.on('agent:memory:add', (data) => {
      try {
        const { agentId, type, content, metadata } = data;
        const agent = agentEngine.getAgent(agentId);
        
        if (!agent) {
          socket.emit('error', { message: 'Agent not found' });
          return;
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
        
        socket.emit('agent:memory:added', memoryEntry);
        io.emit('agent:memory:added', memoryEntry);
      } catch (error) {
        logger.error('Failed to add memory:', error);
        socket.emit('error', { message: 'Failed to add memory' });
      }
    });

    // Handle conversation addition requests
    socket.on('agent:conversation:add', (data) => {
      try {
        const { agentId, participantId, message, direction } = data;
        const agent = agentEngine.getAgent(agentId);
        
        if (!agent) {
          socket.emit('error', { message: 'Agent not found' });
          return;
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
        
        socket.emit('agent:conversation:added', conversation);
        io.emit('agent:conversation:added', conversation);
      } catch (error) {
        logger.error('Failed to add conversation:', error);
        socket.emit('error', { message: 'Failed to add conversation' });
      }
    });

    // Handle content update requests
    socket.on('agent:content:update', (data) => {
      try {
        const { agentId, type, content } = data;
        const agent = agentEngine.getAgent(agentId);
        
        if (!agent) {
          socket.emit('error', { message: 'Agent not found' });
          return;
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
        
        socket.emit('agent:content:updated', contentEntry);
        io.emit('agent:content:updated', contentEntry);
      } catch (error) {
        logger.error('Failed to update content:', error);
        socket.emit('error', { message: 'Failed to update content' });
      }
    });

    // Handle engine control requests
    socket.on('engine:start', async () => {
      try {
        await agentEngine.start();
        socket.emit('engine:started');
        io.emit('engine:started');
      } catch (error) {
        logger.error('Failed to start engine:', error);
        socket.emit('error', { message: 'Failed to start engine' });
      }
    });

    socket.on('engine:stop', async () => {
      try {
        await agentEngine.stop();
        socket.emit('engine:stopped');
        io.emit('engine:stopped');
      } catch (error) {
        logger.error('Failed to stop engine:', error);
        socket.emit('error', { message: 'Failed to stop engine' });
      }
    });

    // Handle subscription to specific agent updates
    socket.on('agent:subscribe', (agentId) => {
      socket.join(`agent:${agentId}`);
      logger.info(`Client ${socket.id} subscribed to agent ${agentId}`);
    });

    socket.on('agent:unsubscribe', (agentId) => {
      socket.leave(`agent:${agentId}`);
      logger.info(`Client ${socket.id} unsubscribed from agent ${agentId}`);
    });

    // Handle network state requests
    socket.on('network:state:request', () => {
      const networkState = agentEngine.getNetworkState();
      socket.emit('network:state', networkState);
    });

    // Handle agent details requests
    socket.on('agent:details:request', (agentId) => {
      const agent = agentEngine.getAgent(agentId);
      if (agent) {
        socket.emit('agent:details', agent);
      } else {
        socket.emit('error', { message: 'Agent not found' });
      }
    });

    // Handle memory requests
    socket.on('agent:memory:request', (agentId) => {
      const memory = agentEngine.getAgentMemory(agentId);
      socket.emit('agent:memory', { agentId, memory });
    });

    // Handle conversation requests
    socket.on('agent:conversations:request', (agentId) => {
      const conversations = agentEngine.getAgentConversations(agentId);
      socket.emit('agent:conversations', { agentId, conversations });
    });

    // Handle content requests
    socket.on('agent:content:request', (agentId) => {
      const content = agentEngine.getAgentContent(agentId);
      socket.emit('agent:content', { agentId, content });
    });

    // Handle network connections requests
    socket.on('agent:network:request', (agentId) => {
      const connections = agentEngine.getAgentNetwork(agentId);
      socket.emit('agent:network', { agentId, connections });
    });

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  // Broadcast network updates periodically
  setInterval(() => {
    if (agentEngine.isRunning()) {
      const networkState = agentEngine.getNetworkState();
      io.emit('network:update', networkState);
    }
  }, 5000); // Every 5 seconds
}
