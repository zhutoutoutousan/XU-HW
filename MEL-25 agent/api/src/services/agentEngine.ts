import { EventEmitter } from 'events';
import { logger } from '../config/logger';
import axios from 'axios';

export interface AgentTool {
  id: string;
  name: string;
  type: 'web_scraper' | 'data_analyzer' | 'market_researcher' | 'content_generator' | 'network_analyzer';
  status: 'idle' | 'running' | 'completed' | 'failed';
  lastUsed: Date;
  successCount: number;
  totalUses: number;
  currentTask?: string;
  results?: any;
}

export interface AgentActivity {
  id: string;
  agentId: string;
  type: 'thinking' | 'communicating' | 'tool_usage' | 'decision_making' | 'learning' | 'creating_agent';
  description: string;
  timestamp: Date;
  duration?: number;
  metadata?: any;
}

export interface AgentEvolution {
  level: number; // 1-10, higher = more influential
  experience: number;
  influence: number; // 0-100, determines KOL status
  followers: string[]; // Other agent IDs that follow this agent
  specializations: string[];
  achievements: string[];
  lastLevelUp: Date;
}

export interface AgentMemory {
  id: string;
  agentId: string;
  type: 'conversation' | 'task' | 'observation' | 'decision' | 'learning' | 'tool_result';
  content: string;
  timestamp: Date;
  metadata?: any;
  importance: number; // 1-10, determines memory retention
}

export interface AgentContent {
  id: string;
  agentId: string;
  type: 'profile' | 'capabilities' | 'goals' | 'constraints' | 'knowledge' | 'expertise';
  content: string;
  lastUpdated: Date;
  confidence: number; // 0-100, how confident the agent is in this content
}

export interface AgentConversation {
  id: string;
  agentId: string;
  participantId: string;
  message: string;
  timestamp: Date;
  direction: 'incoming' | 'outgoing';
  sentiment?: 'positive' | 'negative' | 'neutral';
  topic?: string | undefined;
  influence_gained?: number;
}

export interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'thinking' | 'communicating' | 'learning' | 'creating';
  performance_score: number;
  cash_flow: number;
  strategy: any;
  resources: any;
  memory: AgentMemory[];
  content: AgentContent[];
  conversations: AgentConversation[];
  activities: AgentActivity[];
  tools: AgentTool[];
  evolution: AgentEvolution;
  lastHeartbeat: Date;
  capabilities: string[];
  goals: string[];
  constraints: string[];
  networkConnections: string[]; // Other agent IDs
  currentThought?: string;
  currentTask?: string;
  mood?: 'excited' | 'focused' | 'curious' | 'concerned' | 'confident';
}

export interface AgentNetwork {
  agents: Map<string, Agent>;
  connections: Map<string, string[]>; // agentId -> connected agent IDs
  globalMemory: Map<string, any>;
  heartbeatInterval: number;
  isRunning: boolean;
  kolAgents: string[]; // Key Opinion Leaders
  trendingTopics: string[];
  marketTrends: any[];
}

class AgentEngine extends EventEmitter {
  private network: AgentNetwork;
  private ollamaUrl: string;
  private heartbeatTimer?: NodeJS.Timeout;
  private activityTimer?: NodeJS.Timeout;

  constructor() {
    super();
    this.network = {
      agents: new Map(),
      connections: new Map(),
      globalMemory: new Map(),
      heartbeatInterval: 5000, // 5 seconds for better performance
      isRunning: false,
      kolAgents: [],
      trendingTopics: [],
      marketTrends: []
    };
    this.ollamaUrl = process.env['OLLAMA_URL'] || 'http://ollama:11434';
  }

  async start(): Promise<void> {
    logger.info('Starting Enhanced Agent Engine with real-time capabilities');
    this.network.isRunning = true;
    
    // Initialize with some default agents
    await this.initializeDefaultAgents();
    
    // Start heartbeat system
    this.startHeartbeat();
    
    // Start activity system
    this.startActivitySystem();
    
    // Start agent polling system
    this.startAgentPolling();
    
    logger.info('Enhanced Agent Engine started successfully');
  }

  async stop(): Promise<void> {
    logger.info('Stopping Enhanced Agent Engine');
    this.network.isRunning = false;
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
    }
    
    logger.info('Enhanced Agent Engine stopped');
  }

  isRunning(): boolean {
    return this.network.isRunning;
  }

  private async initializeDefaultAgents(): Promise<void> {
    const defaultAgents: Partial<Agent>[] = [
      {
        id: 'competitive-analyst-001',
        name: 'Competitive Intelligence Agent',
        type: 'competitive_analyst',
        status: 'active',
        performance_score: 85,
        cash_flow: 25000,
        capabilities: ['competitive analysis', 'market positioning', 'pricing analysis', 'network comparison'],
        goals: ['analyze BCD positioning', 'identify competitive advantages', 'benchmark pricing strategies', 'map network ecosystems'],
        constraints: ['data accuracy', 'real-time updates', 'confidentiality'],
        evolution: {
          level: 4,
          experience: 200,
          influence: 40,
          followers: [],
          specializations: ['competitive intelligence', 'market research'],
          achievements: ['BCD market analysis', 'Competitor mapping'],
          lastLevelUp: new Date()
        },
        tools: [
          {
            id: 'web-scraper-001',
            name: 'Competitor Data Scraper',
            type: 'web_scraper',
            status: 'idle',
            lastUsed: new Date(),
            successCount: 15,
            totalUses: 18
          },
          {
            id: 'pricing-analyzer-001',
            name: 'Pricing Strategy Analyzer',
            type: 'data_analyzer',
            status: 'idle',
            lastUsed: new Date(),
            successCount: 12,
            totalUses: 15
          }
        ],
        currentThought: 'Analyzing BCD market positioning vs competitors...',
        mood: 'focused'
      },
      {
        id: 'network-strategist-001',
        name: 'Network Strategy Agent',
        type: 'network_strategist',
        status: 'thinking',
        performance_score: 90,
        cash_flow: 35000,
        capabilities: ['network analysis', 'member profiling', 'community building', 'value proposition'],
        goals: ['optimize BCD network', 'enhance member value', 'identify growth opportunities', 'strengthen positioning'],
        constraints: ['member privacy', 'quality standards', 'scalability'],
        evolution: {
          level: 5,
          experience: 300,
          influence: 50,
          followers: ['competitive-analyst-001'],
          specializations: ['network strategy', 'community building'],
          achievements: ['BCD network optimization', 'Member value enhancement'],
          lastLevelUp: new Date()
        },
        tools: [
          {
            id: 'network-analyzer-001',
            name: 'Network Topology Analyzer',
            type: 'network_analyzer',
            status: 'running',
            lastUsed: new Date(),
            successCount: 25,
            totalUses: 30,
            currentTask: 'Analyzing BCD network structure and member connections'
          }
        ],
        currentThought: 'Optimizing BCD network positioning and member value...',
        mood: 'excited'
      },
      {
        id: 'marketing-strategist-001',
        name: 'Marketing Strategy Agent',
        type: 'marketing_strategist',
        status: 'communicating',
        performance_score: 88,
        cash_flow: 30000,
        capabilities: ['marketing strategy', 'brand positioning', 'content optimization', 'conversion analysis'],
        goals: ['enhance BCD brand', 'optimize conversion funnel', 'improve member acquisition', 'maximize value proposition'],
        constraints: ['brand consistency', 'member experience', 'growth targets'],
        evolution: {
          level: 4,
          experience: 250,
          influence: 45,
          followers: ['competitive-analyst-001'],
          specializations: ['marketing strategy', 'brand optimization'],
          achievements: ['BCD brand enhancement', 'Conversion optimization'],
          lastLevelUp: new Date()
        },
        tools: [
          {
            id: 'content-generator-001',
            name: 'Marketing Content Generator',
            type: 'content_generator',
            status: 'idle',
            lastUsed: new Date(),
            successCount: 20,
            totalUses: 25
          }
        ],
        currentThought: 'Developing BCD marketing strategy and brand positioning...',
        mood: 'confident'
      }
    ];

    for (const agentData of defaultAgents) {
      const agent: Agent = {
        ...agentData,
        memory: [],
        content: [],
        conversations: [],
        activities: [],
        lastHeartbeat: new Date(),
        networkConnections: []
      } as Agent;
      
      this.network.agents.set(agent.id, agent);
    }

    // Create initial connections
    this.createConnection('competitive-analyst-001', 'network-strategist-001');
    this.createConnection('network-strategist-001', 'marketing-strategist-001');
    this.createConnection('competitive-analyst-001', 'marketing-strategist-001');
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(async () => {
      if (this.network.isRunning) {
        await this.performHeartbeat();
      }
    }, this.network.heartbeatInterval);
  }

  private startActivitySystem(): void {
    this.activityTimer = setInterval(async () => {
      if (this.network.isRunning) {
        await this.performAgentActivities();
      }
    }, 4000); // Every 4 seconds for better performance
  }

  private async performHeartbeat(): Promise<void> {
    const agents = Array.from(this.network.agents.values());
    
    for (const agent of agents) {
      await this.updateAgentStatus(agent);
      await this.processAgentMemory(agent);
      await this.updateAgentContent(agent);
      await this.updateAgentEvolution(agent);
      await this.triggerAgentCommunication(agent);
      await this.runAgentTools(agent);
      
      agent.lastHeartbeat = new Date();
    }

    // Update KOL status
    this.updateKOLStatus();
    
    // Emit heartbeat event
    this.emit('heartbeat', {
      timestamp: new Date(),
      agentsCount: agents.length,
      kolCount: this.network.kolAgents.length,
      activeTools: agents.reduce((count, agent) => 
        count + agent.tools.filter(tool => tool.status === 'running').length, 0
      )
    });
  }

  private async performAgentActivities(): Promise<void> {
    const agents = Array.from(this.network.agents.values());
    
    for (const agent of agents) {
      // Generate random activities
      const activityTypes = ['thinking', 'communicating', 'tool_usage', 'decision_making', 'learning'];
      const randomActivity = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      
      const activity: AgentActivity = {
        id: `activity-${Date.now()}-${Math.random()}`,
        agentId: agent.id,
        type: randomActivity as any,
        description: await this.generateActivityDescription(agent, randomActivity!),
        timestamp: new Date(),
        duration: Math.floor(Math.random() * 30) + 5,
        metadata: {
          mood: agent.mood,
          influence: agent.evolution.influence,
          level: agent.evolution.level
        }
      };
      
      agent.activities.push(activity);
      
      // Keep only last 50 activities
      if (agent.activities.length > 50) {
        agent.activities = agent.activities.slice(-50);
      }
      
      // Emit activity event
      this.emit('agent:activity', activity);
    }
  }

  private async generateActivityDescription(agent: Agent, activityType: string): Promise<string> {
    const descriptions: Record<string, string[]> = {
      thinking: [
        `Analyzing BCD competitive positioning for ${agent.name}`,
        `Processing market intelligence insights for ${agent.name}`,
        `Evaluating network strategy opportunities for ${agent.name}`,
        `Contemplating BCD growth strategies for ${agent.name}`
      ],
      communicating: [
        `Sharing competitive analysis with network for ${agent.name}`,
        `Coordinating marketing strategy for ${agent.name}`,
        `Broadcasting BCD insights for ${agent.name}`,
        `Engaging in strategic BCD discussion for ${agent.name}`
      ],
      tool_usage: [
        `Running competitor data scraper for ${agent.name}`,
        `Analyzing pricing strategies for ${agent.name}`,
        `Generating BCD marketing content for ${agent.name}`,
        `Processing network analysis for ${agent.name}`
      ],
      decision_making: [
        `Making BCD strategic decisions for ${agent.name}`,
        `Evaluating competitive positioning for ${agent.name}`,
        `Choosing marketing strategies for ${agent.name}`,
        `Determining BCD resource allocation for ${agent.name}`
      ],
      learning: [
        `Learning from BCD market analysis for ${agent.name}`,
        `Adapting competitive strategies for ${agent.name}`,
        `Improving network positioning for ${agent.name}`,
        `Gaining BCD market intelligence for ${agent.name}`
      ]
    };
    
    const typeDescriptions = descriptions[activityType] || [];
    return typeDescriptions[Math.floor(Math.random() * typeDescriptions.length)] || 
           `${activityType} activity for ${agent.name}`;
  }

  private async updateAgentStatus(agent: Agent): Promise<void> {
    const statuses = ['active', 'thinking', 'communicating', 'learning'];
    const weights = [0.4, 0.3, 0.2, 0.1]; // More likely to be active
    
    let random = Math.random();
    let selectedStatus = 'active';
    
    for (let i = 0; i < statuses.length; i++) {
    if (random < weights[i]!) {
        selectedStatus = statuses[i]!;
        break;
      }
      random -= weights[i]!;
    }
    
    agent.status = selectedStatus as any;
    
    // Update current thought based on status
    agent.currentThought = await this.generateCurrentThought(agent);
    
    // Update mood
    const moods = ['excited', 'focused', 'curious', 'concerned', 'confident'];
    agent.mood = moods[Math.floor(Math.random() * moods.length)] as any;
  }

  private async generateCurrentThought(agent: Agent): Promise<string> {
    const thoughts = [
      `Analyzing BCD competitive landscape for ${agent.name}...`,
      `Planning BCD market positioning for ${agent.name}...`,
      `Coordinating network strategy for ${agent.name}...`,
      `Learning from BCD market analysis for ${agent.name}...`,
      `Evaluating BCD growth opportunities for ${agent.name}...`,
      `Processing competitive intelligence for ${agent.name}...`,
      `Making BCD strategic decisions for ${agent.name}...`,
      `Creating BCD market value for ${agent.name}...`
    ];
    
    return thoughts[Math.floor(Math.random() * thoughts.length)] || `Processing BCD market intelligence for ${agent.name}...`;
  }

  private async processAgentMemory(agent: Agent): Promise<void> {
    // Simulate memory processing
    const memoryTypes = ['conversation', 'task', 'observation', 'decision', 'learning', 'tool_result'];
    const randomType = memoryTypes[Math.floor(Math.random() * memoryTypes.length)];
    
    const memory: AgentMemory = {
      id: `memory-${Date.now()}-${Math.random()}`,
      agentId: agent.id,
      type: randomType as any,
      content: `Memory entry: ${randomType} activity for ${agent.name}`,
      timestamp: new Date(),
      importance: Math.floor(Math.random() * 10) + 1
    };
    
    agent.memory.push(memory);
    
    // Keep only last 100 memories
    if (agent.memory.length > 100) {
      agent.memory = agent.memory.slice(-100);
    }
  }

  private async updateAgentContent(agent: Agent): Promise<void> {
    // Simulate content updates
    const contentTypes = ['profile', 'capabilities', 'goals', 'constraints', 'knowledge', 'expertise'];
    const randomType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
    
    const content: AgentContent = {
      id: `content-${Date.now()}-${Math.random()}`,
      agentId: agent.id,
      type: randomType as any,
      content: `Updated ${randomType} for ${agent.name}`,
      lastUpdated: new Date(),
      confidence: Math.floor(Math.random() * 100) + 1
    };
    
    agent.content.push(content);
    
    // Keep only last 50 content entries
    if (agent.content.length > 50) {
      agent.content = agent.content.slice(-50);
    }
  }

  private async updateAgentEvolution(agent: Agent): Promise<void> {
    // Simulate evolution
    agent.evolution.experience += Math.floor(Math.random() * 5) + 1;
    
    // Level up logic
    const experienceForNextLevel = agent.evolution.level * 100;
    if (agent.evolution.experience >= experienceForNextLevel) {
      agent.evolution.level++;
      agent.evolution.experience = 0;
      agent.evolution.lastLevelUp = new Date();
      agent.evolution.achievements.push(`Reached level ${agent.evolution.level}`);
      
      // Emit level up event
      this.emit('agent:levelup', {
        agentId: agent.id,
        newLevel: agent.evolution.level,
        achievements: agent.evolution.achievements
      });
    }
    
    // Influence calculation
    agent.evolution.influence = Math.min(100, 
      agent.evolution.level * 10 + 
      agent.evolution.followers.length * 5 + 
      agent.performance_score / 10
    );
  }

  private async triggerAgentCommunication(agent: Agent): Promise<void> {
    const otherAgents = Array.from(this.network.agents.values())
      .filter(a => a.id !== agent.id);
    
    if (otherAgents.length === 0) return;
    
    const targetAgent = otherAgents[Math.floor(Math.random() * otherAgents.length)];
    
    // 70% chance to communicate (increased for more conversations)
    if (Math.random() < 0.7 && targetAgent) {
      await this.initiateAgentConversation(agent, targetAgent);
    }
  }

  private async initiateAgentConversation(agent1: Agent, agent2: Agent): Promise<void> {
    const conversationId = `conv-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Generate conversation using Ollama
    let message = await this.generateConversationWithOllama(agent1, agent2);
    
    // Fallback messages if Ollama fails
    if (!message || message.includes('Analyzing BCD competitive positioning together')) {
      const fallbackMessages = [
        `${agent1.name}: "Hey ${agent2.name}, what's your take on BCD's market positioning?"`,
        `${agent1.name}: "I've been analyzing BCD's competitive landscape. Any insights to share?"`,
        `${agent1.name}: "What do you think about BCD's network strategy compared to competitors?"`,
        `${agent1.name}: "I'm seeing some interesting patterns in BCD's market approach. Thoughts?"`,
        `${agent1.name}: "How do you think BCD can improve their competitive advantage?"`
      ];
      message = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
    }
    
    const topics = ['strategy', 'market', 'tools', 'learning', 'opportunity'];
    const selectedTopic = topics[Math.floor(Math.random() * topics.length)];
    
    const conversation: AgentConversation = {
      id: conversationId,
      agentId: agent1.id,
      participantId: agent2.id,
      message,
      timestamp: new Date(),
      direction: 'outgoing',
      sentiment: ['positive', 'negative', 'neutral'][Math.floor(Math.random() * 3)] as any,
      topic: selectedTopic,
      influence_gained: Math.floor(Math.random() * 5) + 1
    };
    
    agent1.conversations.push(conversation);
    
    // Add to agent2's conversations as incoming
    const incomingConversation: AgentConversation = {
      ...conversation,
      agentId: agent2.id,
      participantId: agent1.id,
      direction: 'incoming'
    };
    
    agent2.conversations.push(incomingConversation);
    
    // Emit conversation event
    this.emit('agent:conversation', conversation);
  }

  private async runAgentTools(agent: Agent): Promise<void> {
    for (const tool of agent.tools) {
      // 10% chance to use a tool (reduced for better performance)
      if (Math.random() < 0.1) {
        tool.status = 'running';
        tool.currentTask = `Running ${tool.name} for ${agent.name}`;
        tool.lastUsed = new Date();
        
        // Simulate tool execution
        setTimeout(() => {
          tool.status = Math.random() > 0.1 ? 'completed' : 'failed';
          tool.totalUses++;
          if (tool.status === 'completed') {
            tool.successCount++;
            tool.results = `Results from ${tool.name}: ${Math.random() > 0.5 ? 'Success' : 'Partial success'}`;
          }
          tool.currentTask = "idle";
          
                  // Emit tool completion event
        this.emit('agent:tool:completed', {
          agentId: agent.id,
          toolId: tool.id,
          name: tool.name,
          status: tool.status,
          results: tool.results
        });
        }, Math.floor(Math.random() * 5000) + 2000); // 2-7 seconds
        
        // Emit tool start event
        const toolStartEvent = {
          agentId: agent.id,
          toolId: tool.id,
          name: tool.name,
          task: tool.currentTask
        };
        console.log('Emitting tool start event:', toolStartEvent);
        this.emit('agent:tool:started', toolStartEvent);
      }
    }
  }

  private updateKOLStatus(): void {
    const agents = Array.from(this.network.agents.values());
    const kolThreshold = 50; // Influence threshold for KOL status
    
    this.network.kolAgents = agents
      .filter(agent => agent.evolution.influence >= kolThreshold)
      .map(agent => agent.id);
  }

  private startAgentPolling(): void {
    setInterval(async () => {
      if (this.network.isRunning) {
        await this.pollAgents();
      }
    }, 30000); // Every 30 seconds
  }

  private async pollAgents(): Promise<void> {
    const agents = Array.from(this.network.agents.values());
    
    for (const agent of agents) {
      // Check if agent should create a new agent
      if (await this.shouldCreateNewAgent(agent)) {
        logger.info(`Agent ${agent.name} (${agent.id}) is considering creating a new agent...`);
        await this.createNewAgent(agent);
      }
      
      // Check if agent should be removed
      if (await this.shouldRemoveAgent(agent)) {
        logger.info(`Agent ${agent.name} (${agent.id}) is being considered for removal due to low performance...`);
        await this.removeAgent(agent.id);
      }
    }
  }

  private async shouldCreateNewAgent(agent: Agent): Promise<boolean> {
    // Agents with high influence and level can create new agents
    return agent.evolution.influence > 40 && 
           agent.evolution.level > 3 && 
           Math.random() < 0.1; // 10% chance
  }

  private async createNewAgent(parentAgent: Agent): Promise<void> {
    const agentTypes = ['researcher', 'specialist', 'coordinator', 'innovator'];
    const newType = agentTypes[Math.floor(Math.random() * agentTypes.length)] || 'researcher';
    
    const newAgent: Agent = {
      id: `agent-${Date.now()}-${Math.random()}`,
      name: `${newType.charAt(0).toUpperCase() + newType.slice(1)} Agent`,
      type: newType,
      status: 'active',
      performance_score: Math.floor(Math.random() * 50) + 30,
      cash_flow: Math.floor(Math.random() * 10000) + 5000,
      strategy: {},
      resources: {},
      capabilities: [`${newType} capabilities`, 'data processing', 'communication'],
      goals: [`Become expert ${newType}`, 'Learn from network', 'Contribute value'],
      constraints: ['Learning curve', 'Resource limits', 'Experience needed'],
      evolution: {
        level: 1,
        experience: 0,
        influence: 5,
        followers: [parentAgent.id],
        specializations: [newType],
        achievements: ['Created by network'],
        lastLevelUp: new Date()
      },
      tools: [
        {
          id: `tool-${Date.now()}-${Math.random()}`,
          name: `${newType} Tool`,
          type: 'data_analyzer',
          status: 'idle',
          lastUsed: new Date(),
          successCount: 0,
          totalUses: 0
        }
      ],
      memory: [],
      content: [],
      conversations: [],
      activities: [],
      lastHeartbeat: new Date(),
      networkConnections: [parentAgent.id],
      currentThought: `Learning and adapting as new ${newType} agent...`,
      mood: 'curious'
    };
    
    this.network.agents.set(newAgent.id, newAgent);
    this.createConnection(parentAgent.id, newAgent.id);
    
    // Emit agent creation event
    this.emit('agent:created', newAgent);
    
    logger.info(`New agent created by ${parentAgent.name}: ${newAgent.name}`);
  }

  private async shouldRemoveAgent(agent: Agent): Promise<boolean> {
    // Remove agents with very low performance and no influence
    return agent.performance_score < 20 && 
           agent.evolution.influence < 10 && 
           agent.evolution.level === 1 &&
           Math.random() < 0.05; // 5% chance
  }

  private async shouldUpdateAgent(_agent: Agent): Promise<boolean> {
    return Math.random() < 0.3; // 30% chance
  }

  async createAgent(agentData: Partial<Agent>): Promise<Agent> {
    const agent: Agent = {
      id: agentData.id || `agent-${Date.now()}-${Math.random()}`,
      name: agentData.name || 'New Agent',
      type: agentData.type || 'general',
      status: 'active',
      performance_score: agentData.performance_score || 50,
      cash_flow: agentData.cash_flow || 10000,
      strategy: agentData.strategy || {},
      resources: agentData.resources || {},
      capabilities: agentData.capabilities || ['general capabilities'],
      goals: agentData.goals || ['learn', 'contribute', 'grow'],
      constraints: agentData.constraints || ['learning curve', 'experience needed'],
      evolution: {
        level: 1,
        experience: 0,
        influence: 5,
        followers: [],
        specializations: [],
        achievements: ['New agent'],
        lastLevelUp: new Date()
      },
      tools: [
        {
          id: `tool-${Date.now()}-${Math.random()}`,
          name: 'Basic Tool',
          type: 'data_analyzer',
          status: 'idle',
          lastUsed: new Date(),
          successCount: 0,
          totalUses: 0
        }
      ],
      memory: [],
      content: [],
      conversations: [],
      activities: [],
      lastHeartbeat: new Date(),
      networkConnections: [],
      currentThought: 'Starting my journey as a new agent...',
      mood: 'curious'
    };
    
    this.network.agents.set(agent.id, agent);
    this.emit('agent:created', agent);
    
    return agent;
  }

  async removeAgent(agentId: string): Promise<void> {
    const agent = this.network.agents.get(agentId);
    if (agent) {
      this.network.agents.delete(agentId);
      this.network.connections.delete(agentId);
      
      // Remove from other agents' connections
      for (const [id, connections] of this.network.connections.entries()) {
        const filteredConnections = connections.filter(conn => conn !== agentId);
        this.network.connections.set(id, filteredConnections);
      }
      
      this.emit('agent:removed', { agentId, agent });
    }
  }

  async updateAgent(agentId: string): Promise<void> {
    const agent = this.network.agents.get(agentId);
    if (agent && await this.shouldUpdateAgent(agent)) {
      agent.performance_score = Math.min(100, agent.performance_score + Math.floor(Math.random() * 5));
      agent.cash_flow += Math.floor(Math.random() * 1000) - 500;
      
      this.emit('agent:updated', agent);
    }
  }

  createConnection(agentId1: string, agentId2: string): void {
    const agent1 = this.network.agents.get(agentId1);
    const agent2 = this.network.agents.get(agentId2);
    
    if (agent1 && agent2) {
      // Add to agent1's connections
      if (!agent1.networkConnections.includes(agentId2)) {
        agent1.networkConnections.push(agentId2);
      }
      
      // Add to agent2's connections
      if (!agent2.networkConnections.includes(agentId1)) {
        agent2.networkConnections.push(agentId1);
      }
      
      // Update network connections map
      const connections1 = this.network.connections.get(agentId1) || [];
      if (!connections1.includes(agentId2)) {
        connections1.push(agentId2);
        this.network.connections.set(agentId1, connections1);
      }
      
      const connections2 = this.network.connections.get(agentId2) || [];
      if (!connections2.includes(agentId1)) {
        connections2.push(agentId1);
        this.network.connections.set(agentId2, connections2);
      }
      
      this.emit('agent:connection:created', { agentId1, agentId2 });
    }
  }

  async generateInsightWithOllama(agent: Agent, context: string): Promise<string> {
    try {
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: 'llama2',
        prompt: `As ${agent.name}, a ${agent.type} agent with capabilities: ${agent.capabilities.join(', ')}. 
                Current context: ${context}. 
                Generate a brief insight or thought (max 100 words):`,
        stream: false
      });
      
      return response.data.response || 'Processing information...';
    } catch (error) {
      logger.error('Ollama insight generation failed:', error);
      return 'Analyzing current situation...';
    }
  }

  async generateProfileUpdateWithOllama(agent: Agent, activity: string): Promise<string> {
    try {
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: 'llama2',
        prompt: `Agent ${agent.name} (${agent.type}) just completed: ${activity}. 
                Update the agent's profile or capabilities based on this activity (max 50 words):`,
        stream: false
      });
      
      return response.data.response || 'Learning from experience...';
    } catch (error) {
      logger.error('Ollama profile update failed:', error);
      return 'Adapting based on recent activity...';
    }
  }

  async generateConversationWithOllama(agent1: Agent, agent2: Agent): Promise<string> {
    try {
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: 'llama2',
        prompt: `Agent ${agent1.name} (${agent1.type}) is talking to ${agent2.name} (${agent2.type}) about BCD (Better Call Dominik) competitive analysis and marketing strategy. 
                Generate a brief, professional conversation message from ${agent1.name} to ${agent2.name} about BCD market positioning, competitive advantages, or network strategy (max 50 words):`,
        stream: false
      });
      
      return response.data.response || 'Analyzing BCD competitive positioning together...';
    } catch (error) {
      logger.error('Ollama conversation generation failed:', error);
      return 'Analyzing BCD competitive positioning together...';
    }
  }

  getNetworkState(): any {
    const agents = Array.from(this.network.agents.values());
    const connections: any = {};
    
    for (const [agentId, connectedAgents] of this.network.connections.entries()) {
      connections[agentId] = connectedAgents;
    }
    
    return {
      agents,
      connections,
      globalMemory: Object.fromEntries(this.network.globalMemory),
      isRunning: this.network.isRunning,
      lastHeartbeat: new Date(),
      kolAgents: this.network.kolAgents,
      trendingTopics: this.network.trendingTopics,
      marketTrends: this.network.marketTrends
    };
  }

  getAgent(agentId: string): Agent | undefined {
    return this.network.agents.get(agentId);
  }

  getAllAgents(): Agent[] {
    return Array.from(this.network.agents.values());
  }

  getAgentMemory(agentId: string): AgentMemory[] {
    const agent = this.network.agents.get(agentId);
    return agent?.memory || [];
  }

  getAgentContent(agentId: string): AgentContent[] {
    const agent = this.network.agents.get(agentId);
    return agent?.content || [];
  }

  getAgentConversations(agentId: string): AgentConversation[] {
    const agent = this.network.agents.get(agentId);
    return agent?.conversations || [];
  }

  getAgentNetwork(agentId: string): string[] {
    const agent = this.network.agents.get(agentId);
    return agent?.networkConnections || [];
  }

  getAgentActivities(agentId: string): AgentActivity[] {
    const agent = this.network.agents.get(agentId);
    return agent?.activities || [];
  }

  getAgentTools(agentId: string): AgentTool[] {
    const agent = this.network.agents.get(agentId);
    return agent?.tools || [];
  }

  getAgentEvolution(agentId: string): AgentEvolution | undefined {
    const agent = this.network.agents.get(agentId);
    return agent?.evolution;
  }
}

export const agentEngine = new AgentEngine(); 