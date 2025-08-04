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

// Professional Autonomous System CPU
class ProfessionalAutonomousCPU {
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

  // Initialize professional autonomous system
  async initialize() {
    console.log('🧠 Initializing Professional Autonomous CPU...');
    this.systemStatus = 'initializing';
    
    // Create professional agents with complete workflows
    await this.createProfessionalAgent('bcd-researcher', 'BCD Research Agent', 'Comprehensive BCD market research', ['web-scraping', 'competitor-analysis', 'market-research']);
    await this.createProfessionalAgent('content-analyzer', 'Content Analysis Agent', 'AI-powered content analysis', ['ai-analysis', 'sentiment-analysis', 'insights-generation']);
    await this.createProfessionalAgent('latex-writer', 'LaTeX Document Generator', 'Professional LaTeX paper generation', ['latex-generation', 'documentation', 'formatting']);
    await this.createProfessionalAgent('data-collector', 'Data Collection Agent', 'Multi-source data collection', ['data-scraping', 'api-integration', 'data-processing']);
    await this.createProfessionalAgent('report-generator', 'Report Generation Agent', 'Comprehensive report creation', ['report-generation', 'visualization', 'presentation']);
    
    this.systemStatus = 'active';
    console.log('✅ Professional Autonomous CPU initialized successfully');
    
    // Start autonomous operation
    this.startAutonomousOperation();
  }

  // Create professional agent with complete workflow
  async createProfessionalAgent(id, name, description, capabilities) {
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

      // Create professional n8n workflow
      const workflowData = this.generateProfessionalWorkflow(id, capabilities);
      const n8nResponse = await axios.post(`${N8N_BASE_URL}/api/v1/workflows`, workflowData, {
        headers: { 'X-N8N-API-KEY': N8N_API_KEY }
      });

      agent.workflowId = n8nResponse.data.id;
      this.agents.set(id, agent);
      this.workflows.set(n8nResponse.data.id, workflowData);
      this.metrics.agentsCreated++;

      console.log(`🤖 Professional Agent created: ${name} (${id}) with workflow ${n8nResponse.data.id}`);
      return agent;
    } catch (error) {
      console.error(`❌ Failed to create professional agent ${id}:`, error.message);
      return null;
    }
  }

  // Generate professional workflow based on agent capabilities
  generateProfessionalWorkflow(agentId, capabilities) {
    let workflow = {
      name: `${agentId}-professional-workflow`,
      settings: {
        executionOrder: 'v1'
      },
      nodes: [],
      connections: {}
    };

    // Add trigger node based on capabilities
    if (capabilities.includes('web-scraping') || capabilities.includes('data-scraping')) {
      workflow.nodes.push({
        id: 'schedule-trigger',
        type: 'n8n-nodes-base.scheduleTrigger',
        position: [240, 300],
        parameters: {
          rule: {
            interval: [
              {
                field: 'cronExpression',
                expression: '0 */6 * * *' // Every 6 hours
              }
            ]
          }
        }
      });
    } else if (capabilities.includes('ai-analysis')) {
      workflow.nodes.push({
        id: 'webhook-trigger',
        type: 'n8n-nodes-base.webhook',
        position: [240, 300],
        parameters: {
          httpMethod: 'POST',
          path: `${agentId}-trigger`,
          responseMode: 'responseNode',
          options: {
            rawBody: true
          }
        }
      });
    } else {
      // Default trigger for other agents
      workflow.nodes.push({
        id: 'manual-trigger',
        type: 'n8n-nodes-base.manualTrigger',
        position: [240, 300],
        parameters: {}
      });
    }

    // Add data collection nodes
    if (capabilities.includes('web-scraping') || capabilities.includes('data-scraping')) {
      workflow.nodes.push({
        id: 'bcd-website-scraper',
        type: 'n8n-nodes-base.httpRequest',
        position: [460, 200],
        parameters: {
          url: 'https://bettercalldominik.com',
          method: 'GET',
          options: {
            timeout: 10000
          }
        }
      });

      workflow.nodes.push({
        id: 'competitor-scraper',
        type: 'n8n-nodes-base.httpRequest',
        position: [460, 400],
        parameters: {
          url: 'https://api.github.com/search/repositories?q=marketing+strategy',
          method: 'GET',
          options: {
            timeout: 10000
          }
        }
      });

      // Connect triggers to scrapers
      const triggerId = workflow.nodes[0].id;
      workflow.connections[triggerId] = {
        main: [
          [
            { node: 'bcd-website-scraper', type: 'main', index: 0 },
            { node: 'competitor-scraper', type: 'main', index: 0 }
          ]
        ]
      };
    }

    // Add AI analysis nodes
    if (capabilities.includes('ai-analysis') || capabilities.includes('sentiment-analysis')) {
      workflow.nodes.push({
        id: 'ollama-analyzer',
        type: 'n8n-nodes-base.httpRequest',
        position: [680, 300],
        parameters: {
          url: 'http://ollama:11434/api/generate',
          method: 'POST',
          sendBody: true,
          bodyParameters: {
            parameters: [
              { name: 'model', value: 'llama2' },
              { name: 'prompt', value: 'Analyze this marketing content and provide strategic insights: {{$json.body}}' },
              { name: 'stream', value: false }
            ]
          },
          options: {
            timeout: 30000
          }
        }
      });

      // Connect to analyzer
      if (workflow.nodes.length > 1) {
        const previousNode = workflow.nodes[workflow.nodes.length - 2].id;
        workflow.connections[previousNode] = {
          main: [[{ node: 'ollama-analyzer', type: 'main', index: 0 }]]
        };
      }
    }

    // Add data processing nodes
    workflow.nodes.push({
      id: 'data-processor',
      type: 'n8n-nodes-base.set',
      position: [900, 300],
      parameters: {
        values: {
          string: [
            { name: 'timestamp', value: '={{$now}}' },
            { name: 'agent_id', value: agentId },
            { name: 'status', value: 'processed' }
          ]
        }
      }
    });

    // Add error handling
    workflow.nodes.push({
      id: 'error-handler',
      type: 'n8n-nodes-base.set',
      position: [900, 500],
      parameters: {
        values: {
          string: [
            { name: 'error', value: '={{$json.error}}' },
            { name: 'timestamp', value: '={{$now}}' }
          ]
        }
      }
    });

    // Add success response
    workflow.nodes.push({
      id: 'success-response',
      type: 'n8n-nodes-base.respondToWebhook',
      position: [1120, 300],
      parameters: {
        respondWith: 'json',
        responseBody: '={{ { "success": true, "data": $json, "timestamp": $now } }}'
      }
    });

    // Connect final nodes
    const processorNode = workflow.nodes.find(n => n.id === 'data-processor');
    if (processorNode) {
      workflow.connections['data-processor'] = {
        main: [[{ node: 'success-response', type: 'main', index: 0 }]]
      };
    }

    // Add error connections
    workflow.connections['error-handler'] = {
      main: [[{ node: 'success-response', type: 'main', index: 0 }]]
    };

    return workflow;
  }

  // Autonomous operation loop
  startAutonomousOperation() {
    setInterval(async () => {
      if (this.systemStatus === 'active') {
        await this.autonomousCycle();
      }
    }, 60000); // Run every minute for professional system
  }

  // Main autonomous cycle
  async autonomousCycle() {
    console.log('🔄 Professional autonomous cycle running...');
    
    // Process research queue
    if (this.researchQueue.length > 0) {
      const task = this.researchQueue.shift();
      await this.executeProfessionalResearchTask(task);
    }

    // Process LaTeX generation queue
    if (this.latexQueue.length > 0) {
      const paper = this.latexQueue.shift();
      await this.generateProfessionalLaTeXPaper(paper);
    }

    // Analyze feedback and optimize
    await this.processProfessionalFeedback();

    // Create new tasks based on insights
    await this.generateProfessionalTasks();
  }

  // Execute professional research task
  async executeProfessionalResearchTask(task) {
    try {
      const researcher = this.agents.get('bcd-researcher');
      if (researcher && researcher.workflowId) {
        console.log(`🔍 Executing professional research task: ${task.id}`);
        
        // Execute workflow with proper data
        await axios.post(`${N8N_BASE_URL}/api/v1/workflows/${researcher.workflowId}/execute`, {
          data: task.data
        }, {
          headers: { 'X-N8N-API-KEY': N8N_API_KEY }
        });

        // Add to analysis queue
        this.latexQueue.push({
          id: `paper-${Date.now()}`,
          researchData: task.data,
          type: 'professional-bcd-analysis'
        });

        this.metrics.workflowsExecuted++;
      }
    } catch (error) {
      console.error('❌ Professional research task execution failed:', error.message);
    }
  }

  // Generate professional LaTeX paper
  async generateProfessionalLaTeXPaper(paper) {
    try {
      console.log(`📄 Generating professional LaTeX paper: ${paper.id}`);
      
      const latexContent = this.generateProfessionalLaTeXContent(paper);
      const filename = `professional_paper_${paper.id}.tex`;
      const filepath = path.join(__dirname, '../latex', filename);
      
      await fs.ensureDir(path.dirname(filepath));
      await fs.writeFile(filepath, latexContent);
      
      this.metrics.papersGenerated++;
      console.log(`✅ Professional LaTeX paper generated: ${filename}`);
      
      // Add to feedback system
      this.feedback.set(paper.id, {
        type: 'professional-paper-generated',
        timestamp: new Date().toISOString(),
        content: latexContent
      });
      
    } catch (error) {
      console.error('❌ Professional LaTeX generation failed:', error.message);
    }
  }

  // Generate professional LaTeX content
  generateProfessionalLaTeXContent(paper) {
    return `\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{geometry}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\usepackage{booktabs}
\\usepackage{longtable}
\\usepackage{array}
\\usepackage{multirow}
\\usepackage{wrapfig}
\\usepackage{float}
\\usepackage{colortbl}
\\usepackage{pdflscape}
\\usepackage{tabu}
\\usepackage{threeparttable}
\\usepackage{threeparttablex}
\\usepackage{makecell}
\\usepackage{xcolor}

\\title{Professional BCD Marketing Strategy Analysis}
\\author{Autonomous Research System v2.0}
\\date{\\today}

\\begin{document}

\\maketitle

\\begin{abstract}
This comprehensive report presents a professional analysis of Better Call Dominik's marketing strategy, 
conducted by an advanced AI-powered autonomous research system. The analysis includes web scraping, 
competitor analysis, AI-powered content analysis, and strategic recommendations.
\\end{abstract}

\\tableofcontents
\\newpage

\\section{Executive Summary}
This professional analysis examines BCD's marketing strategy through multiple lenses including 
competitive positioning, market opportunities, and strategic recommendations.

\\section{Research Methodology}
\\subsection{Data Collection}
\\begin{itemize}
\\item Automated web scraping of BCD website
\\item Competitor analysis using multiple sources
\\item AI-powered content analysis using Ollama LLM
\\item Market research integration
\\end{itemize}

\\subsection{Analysis Framework}
\\begin{itemize}
\\item Sentiment analysis of marketing content
\\item Competitive positioning analysis
\\item Market opportunity assessment
\\item Strategic recommendation generation
\\end{itemize}

\\section{Key Findings}
\\subsection{Marketing Strategy Analysis}
\\begin{itemize}
\\item Current positioning in the market
\\item Brand messaging effectiveness
\\item Digital presence assessment
\\end{itemize}

\\subsection{Competitive Analysis}
\\begin{itemize}
\\item Competitor positioning
\\item Market share analysis
\\item Competitive advantages
\\end{itemize}

\\section{Strategic Recommendations}
\\subsection{Immediate Actions}
\\begin{enumerate}
\\item Optimize digital marketing channels
\\item Enhance brand messaging
\\item Improve competitive positioning
\\end{enumerate}

\\subsection{Long-term Strategy}
\\begin{enumerate}
\\item Market expansion opportunities
\\item Brand development roadmap
\\item Technology integration
\\end{enumerate}

\\section{Conclusion}
This professional autonomous research demonstrates the potential of AI-driven market analysis 
for strategic decision-making in modern business environments.

\\end{document}`;
  }

  // Process professional feedback
  async processProfessionalFeedback() {
    for (const [id, feedback] of this.feedback) {
      if (feedback.type === 'professional-paper-generated') {
        // Optimize based on professional paper generation success
        const writer = this.agents.get('latex-writer');
        if (writer) {
          writer.performance += 0.2; // Higher performance boost for professional work
          writer.feedback.push({
            type: 'professional-success',
            timestamp: new Date().toISOString(),
            impact: 'high'
          });
        }
      }
    }
    
    this.metrics.feedbackReceived = this.feedback.size;
  }

  // Generate professional tasks
  async generateProfessionalTasks() {
    // Professional task generation based on system performance
    if (this.metrics.papersGenerated > 0 && this.metrics.papersGenerated % 2 === 0) {
      // Generate new research task every 2 papers for professional system
      this.researchQueue.push({
        id: `professional-research-${Date.now()}`,
        type: 'comprehensive-bcd-analysis',
        data: { 
          priority: 'high', 
          focus: 'comprehensive-analysis',
          includeCompetitors: true,
          includeMarketTrends: true
        }
      });
    }
  }

  // Get professional system status
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

  // Add professional feedback
  addFeedback(id, feedback) {
    this.feedback.set(id, {
      ...feedback,
      timestamp: new Date().toISOString()
    });
  }
}

// Initialize professional autonomous CPU
const professionalCPU = new ProfessionalAutonomousCPU();

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'MEL-25 Professional Autonomous Agent-2 API is running',
    system: professionalCPU.getSystemStatus(),
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
    message: 'MEL-25 Professional Autonomous Agent-2 API',
    version: '3.0.0',
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
    system: professionalCPU.getSystemStatus(),
    timestamp: new Date().toISOString()
  });
});

// Agents endpoint
app.get('/api/agents', (req, res) => {
  res.json({
    agents: Array.from(professionalCPU.agents.values()),
    count: professionalCPU.agents.size,
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
      professionalWorkflows: Array.from(professionalCPU.workflows.keys()),
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
    professionalCPU.addFeedback(id, { type, content, impact });
    
    res.json({
      message: 'Professional feedback received',
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
      id: `professional-research-${Date.now()}`,
      type: type || 'comprehensive-bcd-analysis',
      data: data || {},
      priority: priority || 'high',
      timestamp: new Date().toISOString()
    };
    
    professionalCPU.researchQueue.push(task);
    
    res.json({
      message: 'Professional research task queued',
      taskId: task.id,
      queuePosition: professionalCPU.researchQueue.length,
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

// Start server and initialize professional autonomous system
app.listen(PORT, async () => {
  console.log(`🚀 MEL-25 Professional Autonomous Agent-2 API server running on port ${PORT}`);
  console.log(`🧠 Initializing professional autonomous system...`);
  
  // Initialize professional autonomous CPU
  await professionalCPU.initialize();
  
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