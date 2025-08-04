const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const axios = require('axios');

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

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'MEL-25 Agent-2 API is running with Node.js 20',
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
    message: 'MEL-25 Agent-2 API',
    version: '1.0.0',
    nodeVersion: process.version,
    endpoints: {
      health: '/health',
      api: '/api',
      agents: '/api/agents',
      bcdResearch: '/api/agents/bcd-research',
      workflows: '/api/workflows',
      createWorkflow: '/api/workflows/create',
      createAgent: '/api/agents/create'
    }
  });
});

// Agents endpoint
app.get('/api/agents', (req, res) => {
  res.json({
    agents: [
      {
        id: 'bcd-research-agent',
        name: 'BCD Research Agent',
        status: 'available',
        description: 'Analyzes BCD website and marketing strategy',
        capabilities: ['web-scraping', 'competitor-analysis', 'market-research'],
        created: new Date().toISOString()
      },
      {
        id: 'ollama-agent',
        name: 'Ollama LLM Agent',
        status: 'available',
        description: 'Generates content using Ollama LLM',
        capabilities: ['text-generation', 'content-analysis', 'strategy-generation'],
        created: new Date().toISOString()
      },
      {
        id: 'n8n-workflow-agent',
        name: 'n8n Workflow Agent',
        status: 'available',
        description: 'Manages and executes n8n workflows',
        capabilities: ['workflow-management', 'automation', 'orchestration'],
        created: new Date().toISOString()
      }
    ]
  });
});

// Create agent endpoint
app.post('/api/agents/create', (req, res) => {
  try {
    const { name, description, capabilities } = req.body;
    const newAgent = {
      id: `agent-${Date.now()}`,
      name: name || 'Custom Agent',
      status: 'available',
      description: description || 'Custom agent for specific tasks',
      capabilities: capabilities || ['custom-task'],
      created: new Date().toISOString()
    };
    
    res.json({
      message: 'Agent created successfully',
      agent: newAgent,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create agent',
      message: error.message
    });
  }
});

// Enhanced BCD Research endpoint with real n8n integration
app.post('/api/agents/bcd-research', async (req, res) => {
  try {
    const taskId = 'bcd-research-' + Date.now();
    
    // Create real n8n workflow for BCD research
    const workflowData = {
      name: `BCD Research - ${taskId}`,
      settings: {},
      nodes: [
        {
          id: 'webhook-trigger',
          type: 'n8n-nodes-base.webhook',
          position: [240, 300],
          parameters: {
            httpMethod: 'POST',
            path: `bcd-research-${taskId}`,
            responseMode: 'responseNode',
            options: {}
          }
        },
        {
          id: 'api-call',
          type: 'n8n-nodes-base.httpRequest',
          position: [460, 300],
          parameters: {
            url: 'https://bettercalldominik.com',
            method: 'GET',
            options: {}
          }
        },
        {
          id: 'ollama-analysis',
          type: 'n8n-nodes-base.httpRequest',
          position: [680, 300],
          parameters: {
            url: 'http://ollama:11434/api/generate',
            method: 'POST',
            sendBody: true,
            bodyParameters: {
              parameters: [
                {
                  name: 'model',
                  value: 'llama2'
                },
                {
                  name: 'prompt',
                  value: 'Analyze this website content for marketing strategy insights: {{$json.body}}'
                }
              ]
            }
          }
        },
        {
          id: 'save-results',
          type: 'n8n-nodes-base.set',
          position: [900, 300],
          parameters: {
            values: {
              string: [
                {
                  name: 'taskId',
                  value: taskId
                },
                {
                  name: 'timestamp',
                  value: '={{$now}}'
                },
                {
                  name: 'analysis',
                  value: '={{$json.response}}'
                }
              ]
            }
          }
        }
      ],
      connections: {
        'webhook-trigger': {
          main: [
            [
              {
                node: 'api-call',
                type: 'main',
                index: 0
              }
            ]
          ]
        },
        'api-call': {
          main: [
            [
              {
                node: 'ollama-analysis',
                type: 'main',
                index: 0
              }
            ]
          ]
        },
        'ollama-analysis': {
          main: [
            [
              {
                node: 'save-results',
                type: 'main',
                index: 0
              }
            ]
          ]
        }
      }
    };

    // Create workflow in n8n with API key
    let workflowCreated = false;
    let workflowId = null;
    try {
      const n8nResponse = await axios.post(`${N8N_BASE_URL}/api/v1/workflows`, workflowData, {
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY
        }
      });
      workflowCreated = true;
      workflowId = n8nResponse.data.id;
      console.log('n8n workflow created successfully:', n8nResponse.data);
    } catch (n8nError) {
      console.log('Failed to create n8n workflow:', n8nError.message);
      if (n8nError.response) {
        console.log('n8n error response:', n8nError.response.data);
      }
    }

    res.json({
      message: 'BCD Research initiated',
      taskId: taskId,
      status: 'started',
      timestamp: new Date().toISOString(),
      workflowCreated: workflowCreated,
      workflowId: workflowId,
      nextSteps: [
        'Website analysis',
        'Competitor research', 
        'Market analysis',
        'Strategy generation'
      ],
      endpoints: {
        webhook: `${N8N_BASE_URL}/webhook/bcd-research-${taskId}`,
        n8n: `${N8N_BASE_URL}`,
        api: `http://localhost:${PORT}/api/agents/bcd-research`
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to initiate BCD research',
      message: error.message
    });
  }
});

// Create workflow endpoint
app.post('/api/workflows/create', async (req, res) => {
  try {
    const { name, nodes, connections } = req.body;
    
    const workflowData = {
      name: name || `Workflow-${Date.now()}`,
      settings: {},
      nodes: nodes || [],
      connections: connections || {}
    };

    const n8nResponse = await axios.post(`${N8N_BASE_URL}/api/v1/workflows`, workflowData, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });

    res.json({
      message: 'Workflow created successfully',
      workflowId: n8nResponse.data.id,
      workflowName: n8nResponse.data.name,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create workflow',
      message: error.message
    });
  }
});

// Get workflows endpoint
app.get('/api/workflows', async (req, res) => {
  try {
    const n8nResponse = await axios.get(`${N8N_BASE_URL}/api/v1/workflows`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });

    res.json({
      workflows: n8nResponse.data,
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

// Execute workflow endpoint
app.post('/api/workflows/:id/execute', async (req, res) => {
  try {
    const { id } = req.params;
    const n8nResponse = await axios.post(`${N8N_BASE_URL}/api/v1/workflows/${id}/execute`, {}, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });

    res.json({
      message: 'Workflow executed successfully',
      workflowId: id,
      executionId: n8nResponse.data.executionId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to execute workflow',
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MEL-25 Agent-2 API server running on port ${PORT} with Node.js 20`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API docs: http://localhost:${PORT}/api`);
  console.log(`📊 n8n interface: ${N8N_BASE_URL}`);
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