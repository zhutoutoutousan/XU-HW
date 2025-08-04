const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// n8n configuration
const N8N_BASE_URL = 'http://n8n:5678';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmODkwOWQyYy1kOGEyLTQ5ZTktOGQ3Ni01OGI4NTZjNzA5Y2IiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU0MjEwMjU0LCJleHAiOjE3NTY3NjQwMDB9.dcyWOrsU2-Zces0RDKbZetk8Tu37LYFB2UAweIzp1NU';

// Autonomous System CPU
class AutonomousCPU {
  constructor() {
    this.agents = new Map();
    this.workflows = new Map();
    this.tasks = new Map();
    this.feedback = new Map();
    this.researchQueue = [];
    this.latexQueue = [];
    this.systemStatus = 'idle';
    this.metrics = {
      agentsCreated: 0,
      workflowsExecuted: 0,
      papersGenerated: 0,
      feedbackReceived: 0
    };
  }

  // Initialize autonomous system
  async initialize() {
    console.log('🧠 Initializing Autonomous CPU...');
    this.systemStatus = 'initializing';
    
    // Create core agents
    await this.createAgent('orchestrator', 'System Orchestrator', 'Manages all agents and workflows', ['orchestration', 'decision-making']);
    await this.createAgent('researcher', 'Research Agent', 'Conducts BCD research', ['web-scraping', 'analysis']);
    await this.createAgent('analyzer', 'Analysis Agent', 'Analyzes research data', ['data-analysis', 'insights']);
    await this.createAgent('writer', 'LaTeX Writer', 'Generates LaTeX papers', ['latex-generation', 'documentation']);
    await this.createAgent('feedback', 'Feedback Agent', 'Processes feedback and improves', ['feedback-processing', 'optimization']);
    
    this.systemStatus = 'active';
    console.log('✅ Autonomous CPU initialized successfully');
    
    // Start autonomous operation
    this.startAutonomousOperation();
  }

  // Create agent with workflow
  async createAgent(id, name, description, capabilities) {
    try {
      const agent = {
        id,
        name,
        description,
        capabilities,
        status: 'available',
        created: new Date().toISOString(),
        workflowId: null,
        performance: 0,
        feedback: []
      };

      // Create corresponding n8n workflow
      const workflowData = this.generateWorkflowForAgent(id, capabilities);
      const n8nResponse = await axios.post(`${N8N_BASE_URL}/api/v1/workflows`, workflowData, {
        headers: { 'X-N8N-API-KEY': N8N_API_KEY }
      });

      agent.workflowId = n8nResponse.data.id;
      this.agents.set(id, agent);
      this.workflows.set(n8nResponse.data.id, workflowData);
      this.metrics.agentsCreated++;

      console.log(`🤖 Agent created: ${name} (${id}) with workflow ${n8nResponse.data.id}`);
      return agent;
    } catch (error) {
      console.error(`❌ Failed to create agent ${id}:`, error.message);
      return null;
    }
  }

  // Generate workflow based on agent capabilities
  generateWorkflowForAgent(agentId, capabilities) {
    const baseWorkflow = {
      name: `${agentId}-workflow`,
      settings: {},
      nodes: [
        {
          id: 'trigger',
          type: 'n8n-nodes-base.webhook',
          position: [240, 300],
          parameters: {
            httpMethod: 'POST',
            path: agentId,
            responseMode: 'responseNode'
          }
        },
        {
          id: 'respond',
          type: 'n8n-nodes-base.respondToWebhook',
          position: [900, 300],
          parameters: {
            respondWith: 'json',
            responseBody: '={{ $json }}'
          }
        }
      ],
      connections: {
        'trigger': {
          main: [
            [
              {
                node: 'respond',
                type: 'main',
                index: 0
              }
            ]
          ]
        }
      }
    };

    // Add capability-specific nodes
    if (capabilities.includes('web-scraping')) {
      baseWorkflow.nodes.push({
        id: 'scraper',
        type: 'n8n-nodes-base.httpRequest',
        position: [460, 300],
        parameters: {
          url: 'https://bettercalldominik.com',
          method: 'GET'
        }
      });
      baseWorkflow.connections.trigger = {
        main: [[{ node: 'scraper', type: 'main', index: 0 }]]
      };
      baseWorkflow.connections.scraper = {
        main: [[{ node: 'respond', type: 'main', index: 0 }]]
      };
    }

    if (capabilities.includes('data-analysis')) {
      baseWorkflow.nodes.push({
        id: 'analyzer',
        type: 'n8n-nodes-base.httpRequest',
        position: [680, 300],
        parameters: {
          url: 'http://ollama:11434/api/generate',
          method: 'POST',
          sendBody: true,
          bodyParameters: {
            parameters: [
              { name: 'model', value: 'llama2' },
              { name: 'prompt', value: 'Analyze this data for insights: {{$json.body}}' }
            ]
          }
        }
      });
      baseWorkflow.connections.trigger = {
        main: [[{ node: 'analyzer', type: 'main', index: 0 }]]
      };
      baseWorkflow.connections.analyzer = {
        main: [[{ node: 'respond', type: 'main', index: 0 }]]
      };
    }

    if (capabilities.includes('latex-generation')) {
      baseWorkflow.nodes.push({
        id: 'latex-generator',
        type: 'n8n-nodes-base.set',
        position: [680, 300],
        parameters: {
          values: {
            string: [
              { name: 'latex_content', value: '\\documentclass{article}\\begin{document}\\title{Research Paper}\\maketitle\\section{Introduction}{{content}}\\end{document}' }
            ]
          }
        }
      });
      baseWorkflow.connections.trigger = {
        main: [[{ node: 'latex-generator', type: 'main', index: 0 }]]
      };
      baseWorkflow.connections['latex-generator'] = {
        main: [[{ node: 'respond', type: 'main', index: 0 }]]
      };
    }

    return baseWorkflow;
  }

  // Autonomous operation loop
  startAutonomousOperation() {
    setInterval(async () => {
      if (this.systemStatus === 'active') {
        await this.autonomousCycle();
      }
    }, 30000); // Run every 30 seconds
  }

  // Main autonomous cycle
  async autonomousCycle() {
    console.log('🔄 Autonomous cycle running...');
    
    // Process research queue
    if (this.researchQueue.length > 0) {
      const task = this.researchQueue.shift();
      await this.executeResearchTask(task);
    }

    // Process LaTeX generation queue
    if (this.latexQueue.length > 0) {
      const paper = this.latexQueue.shift();
      await this.generateLaTeXPaper(paper);
    }

    // Analyze feedback and optimize
    await this.processFeedback();

    // Create new tasks based on insights
    await this.generateNewTasks();
  }

  // Execute research task
  async executeResearchTask(task) {
    try {
      const researcher = this.agents.get('researcher');
      if (researcher && researcher.workflowId) {
        console.log(`🔍 Executing research task: ${task.id}`);
        
        // Execute workflow
        await axios.post(`${N8N_BASE_URL}/api/v1/workflows/${researcher.workflowId}/execute`, {}, {
          headers: { 'X-N8N-API-KEY': N8N_API_KEY }
        });

        // Add to analysis queue
        this.latexQueue.push({
          id: `paper-${Date.now()}`,
          researchData: task.data,
          type: 'bcd-analysis'
        });

        this.metrics.workflowsExecuted++;
      }
    } catch (error) {
      console.error('❌ Research task execution failed:', error.message);
    }
  }

  // Generate LaTeX paper
  async generateLaTeXPaper(paper) {
    try {
      console.log(`📄 Generating LaTeX paper: ${paper.id}`);
      
      const latexContent = this.generateLaTeXContent(paper);
      const filename = `paper_${paper.id}.tex`;
      const filepath = path.join(__dirname, '../latex', filename);
      
      await fs.ensureDir(path.dirname(filepath));
      await fs.writeFile(filepath, latexContent);
      
      this.metrics.papersGenerated++;
      console.log(`✅ LaTeX paper generated: ${filename}`);
      
      // Add to feedback system
      this.feedback.set(paper.id, {
        type: 'paper-generated',
        timestamp: new Date().toISOString(),
        content: latexContent
      });
      
    } catch (error) {
      console.error('❌ LaTeX generation failed:', error.message);
    }
  }

  // Generate LaTeX content
  generateLaTeXContent(paper) {
    return `\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{geometry}
\\usepackage{graphicx}
\\usepackage{hyperref}

\\title{BCD Marketing Strategy Analysis}
\\author{Autonomous Research System}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Executive Summary}
This report presents an autonomous analysis of Better Call Dominik's marketing strategy, 
conducted by an AI-powered research system.

\\section{Research Methodology}
The analysis was performed using:
\\begin{itemize}
\\item Web scraping and data collection
\\item AI-powered content analysis
\\item Automated insights generation
\\end{itemize}

\\section{Key Findings}
\\begin{itemize}
\\item Marketing strategy analysis
\\item Competitive positioning
\\item Market opportunity assessment
\\end{itemize}

\\section{Recommendations}
Based on the autonomous analysis, the following recommendations are proposed:
\\begin{enumerate}
\\item Strategic positioning optimization
\\item Market expansion opportunities
\\item Digital marketing enhancement
\\end{enumerate}

\\section{Conclusion}
This autonomous research demonstrates the potential of AI-driven market analysis 
for strategic decision-making.

\\end{document}`;
  }

  // Process feedback and optimize
  async processFeedback() {
    for (const [id, feedback] of this.feedback) {
      if (feedback.type === 'paper-generated') {
        // Optimize based on paper generation success
        const writer = this.agents.get('writer');
        if (writer) {
          writer.performance += 0.1;
          writer.feedback.push({
            type: 'success',
            timestamp: new Date().toISOString(),
            impact: 'positive'
          });
        }
      }
    }
    
    this.metrics.feedbackReceived = this.feedback.size;
  }

  // Generate new tasks based on insights
  async generateNewTasks() {
    // Autonomous task generation based on system performance
    if (this.metrics.papersGenerated > 0 && this.metrics.papersGenerated % 3 === 0) {
      // Generate new research task every 3 papers
      this.researchQueue.push({
        id: `research-${Date.now()}`,
        type: 'bcd-update',
        data: { priority: 'high', focus: 'latest-updates' }
      });
    }
  }

  // Get system status
  getSystemStatus() {
    return {
      status: this.systemStatus,
      metrics: this.metrics,
      agents: Array.from(this.agents.values()),
      workflows: Array.from(this.workflows.keys()),
      queueLength: {
        research: this.researchQueue.length,
        latex: this.latexQueue.length
      }
    };
  }

  // Add feedback
  addFeedback(id, feedback) {
    this.feedback.set(id, {
      ...feedback,
      timestamp: new Date().toISOString()
    });
  }
}

// Initialize autonomous CPU
const autonomousCPU = new AutonomousCPU();

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'MEL-25 Autonomous Agent-2 API is running',
    system: autonomousCPU.getSystemStatus(),
    services: {
      database: 'postgresql://postgres:password@postgres:5432/research_db',
      redis: 'redis://redis:6379',
      ollama: 'http://ollama:11434',
      n8n: N8N_BASE_URL
    }
  });
});

// API info
app.get('/api', (req, res) => {
  res.json({
    message: 'MEL-25 Autonomous Agent-2 API',
    version: '2.0.0',
    nodeVersion: process.version,
    endpoints: {
      health: '/health',
      api: '/api',
      system: '/api/system',
      agents: '/api/agents',
      workflows: '/api/workflows',
      feedback: '/api/feedback',
      research: '/api/research',
      latex: '/api/latex'
    }
  });
});

// System status endpoint
app.get('/api/system', (req, res) => {
  res.json({
    system: autonomousCPU.getSystemStatus(),
    timestamp: new Date().toISOString()
  });
});

// Agents endpoint
app.get('/api/agents', (req, res) => {
  res.json({
    agents: Array.from(autonomousCPU.agents.values()),
    count: autonomousCPU.agents.size,
    timestamp: new Date().toISOString()
  });
});

// Workflows endpoint
app.get('/api/workflows', async (req, res) => {
  try {
    const n8nResponse = await axios.get(`${N8N_BASE_URL}/api/v1/workflows`, {
      headers: { 'X-N8N-API-KEY': N8N_API_KEY }
    });

    res.json({
      workflows: n8nResponse.data,
      autonomousWorkflows: Array.from(autonomousCPU.workflows.keys()),
      count: n8nResponse.data.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get workflows',
      message: error.message
    });
  }
});

// Feedback endpoint
app.post('/api/feedback', (req, res) => {
  try {
    const { id, type, content, impact } = req.body;
    autonomousCPU.addFeedback(id, { type, content, impact });
    
    res.json({
      message: 'Feedback received',
      feedbackId: id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to process feedback',
      message: error.message
    });
  }
});

// Research endpoint
app.post('/api/research', (req, res) => {
  try {
    const { type, data, priority } = req.body;
    const task = {
      id: `research-${Date.now()}`,
      type: type || 'bcd-analysis',
      data: data || {},
      priority: priority || 'medium',
      timestamp: new Date().toISOString()
    };
    
    autonomousCPU.researchQueue.push(task);
    
    res.json({
      message: 'Research task queued',
      taskId: task.id,
      queuePosition: autonomousCPU.researchQueue.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to queue research task',
      message: error.message
    });
  }
});

// LaTeX papers endpoint
app.get('/api/latex', async (req, res) => {
  try {
    const latexDir = path.join(__dirname, '../latex');
    const files = await fs.readdir(latexDir);
    const papers = files.filter(file => file.endsWith('.tex'));
    
    res.json({
      papers: papers.map(file => ({
        filename: file,
        path: `/latex/${file}`,
        generated: new Date().toISOString()
      })),
      count: papers.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get LaTeX papers',
      message: error.message
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Start server and initialize autonomous system
app.listen(PORT, async () => {
  console.log(`🚀 MEL-25 Autonomous Agent-2 API server running on port ${PORT}`);
  console.log(`🧠 Initializing autonomous system...`);
  
  // Initialize autonomous CPU
  await autonomousCPU.initialize();
  
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API docs: http://localhost:${PORT}/api`);
  console.log(`📊 n8n interface: ${N8N_BASE_URL}`);
  console.log(`📄 LaTeX papers: http://localhost:${PORT}/latex`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
}); 