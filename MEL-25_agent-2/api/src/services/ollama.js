const axios = require('axios');
const logger = require('../utils/logger');

let ollamaUrl = null;
let ollamaModel = null;

const initializeOllama = async () => {
  try {
    ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    ollamaModel = process.env.OLLAMA_MODEL || 'llama2';
    
    // Test connection
    const response = await axios.get(`${ollamaUrl}/api/tags`);
    logger.info('Ollama connected successfully');
    logger.info(`Available models: ${response.data.models.map(m => m.name).join(', ')}`);
    
    // Check if our model is available
    const modelExists = response.data.models.some(model => model.name === ollamaModel);
    if (!modelExists) {
      logger.warn(`Model ${ollamaModel} not found, available models: ${response.data.models.map(m => m.name).join(', ')}`);
    }
    
  } catch (error) {
    logger.error('Ollama connection failed:', error.message);
    throw error;
  }
};

const generateText = async (prompt, options = {}) => {
  try {
    const requestData = {
      model: ollamaModel,
      prompt: prompt,
      stream: false,
      ...options
    };

    const response = await axios.post(`${ollamaUrl}/api/generate`, requestData, {
      timeout: 300000 // 5 minutes timeout
    });

    return response.data.response;
  } catch (error) {
    logger.error('Ollama text generation failed:', error.message);
    throw error;
  }
};

const generateBCDResearch = async (researchType, data) => {
  const prompts = {
    'website_analysis': `
      Analyze the BCD (Better Call Dominik) website data and provide insights on:
      1. Business model and value proposition
      2. Target audience and positioning
      3. Marketing strategies and messaging
      4. Competitive advantages
      
      Website data: ${JSON.stringify(data)}
      
      Provide a comprehensive analysis in JSON format with sections for business_model, target_audience, marketing_strategy, and competitive_advantages.
    `,
    
    'competitor_analysis': `
      Analyze the competitive landscape for BCD and provide insights on:
      1. Direct competitors (LinkedIn Premium, exclusive clubs)
      2. Indirect competitors (investment platforms, deal flow networks)
      3. Market positioning analysis
      4. Competitive advantages and disadvantages
      
      Competitor data: ${JSON.stringify(data)}
      
      Provide a comprehensive analysis in JSON format with sections for direct_competitors, indirect_competitors, positioning_analysis, and competitive_advantages.
    `,
    
    'market_analysis': `
      Analyze the DACH region networking market and provide insights on:
      1. Market size and growth trends
      2. High-net-worth individual (HNWI) networking trends
      3. Market opportunities and challenges
      4. Regulatory environment
      
      Market data: ${JSON.stringify(data)}
      
      Provide a comprehensive analysis in JSON format with sections for market_size, growth_trends, opportunities, and challenges.
    `,
    
    'strategy_development': `
      Based on the BCD research data, develop marketing strategies:
      1. Target audience segmentation
      2. Value proposition refinement
      3. Marketing channel recommendations
      4. Campaign ideas and messaging
      
      Research data: ${JSON.stringify(data)}
      
      Provide a comprehensive strategy in JSON format with sections for audience_segmentation, value_proposition, marketing_channels, and campaign_ideas.
    `
  };

  const prompt = prompts[researchType] || prompts['website_analysis'];
  const response = await generateText(prompt);
  
  try {
    return JSON.parse(response);
  } catch (error) {
    logger.warn('Failed to parse JSON response, returning raw text');
    return { analysis: response };
  }
};

const generateLaTeXContent = async (section, content) => {
  const prompts = {
    'title': `Generate a professional title for a BCD marketing strategy research paper.`,
    'abstract': `Generate an abstract for a BCD marketing strategy research paper based on: ${JSON.stringify(content)}`,
    'introduction': `Generate an introduction section for a BCD marketing strategy research paper based on: ${JSON.stringify(content)}`,
    'methodology': `Generate a methodology section for BCD research based on: ${JSON.stringify(content)}`,
    'analysis': `Generate an analysis section for BCD marketing strategy based on: ${JSON.stringify(content)}`,
    'conclusion': `Generate a conclusion section for BCD marketing strategy research based on: ${JSON.stringify(content)}`,
    'recommendations': `Generate strategic recommendations for BCD based on: ${JSON.stringify(content)}`
  };

  const prompt = prompts[section] || `Generate ${section} content for BCD research based on: ${JSON.stringify(content)}`;
  return await generateText(prompt);
};

const generateMarketingStrategy = async (bcdData, competitorData, marketData) => {
  const prompt = `
    Based on the following research data, generate a comprehensive marketing strategy for BCD (Better Call Dominik):
    
    BCD Data: ${JSON.stringify(bcdData)}
    Competitor Analysis: ${JSON.stringify(competitorData)}
    Market Analysis: ${JSON.stringify(marketData)}
    
    Generate a marketing strategy with the following sections:
    1. Executive Summary
    2. Market Analysis
    3. Competitive Analysis
    4. Target Audience Analysis
    5. Value Proposition
    6. Marketing Channels
    7. Campaign Recommendations
    8. Implementation Timeline
    9. Success Metrics
    10. Risk Assessment
    
    Provide the strategy in a structured format suitable for a LaTeX document.
  `;

  return await generateText(prompt);
};

const getModelInfo = async () => {
  try {
    const response = await axios.get(`${ollamaUrl}/api/tags`);
    return response.data;
  } catch (error) {
    logger.error('Failed to get model info:', error.message);
    throw error;
  }
};

const isModelAvailable = async (modelName) => {
  try {
    const modelInfo = await getModelInfo();
    return modelInfo.models.some(model => model.name === modelName);
  } catch (error) {
    logger.error('Failed to check model availability:', error.message);
    return false;
  }
};

module.exports = {
  initializeOllama,
  generateText,
  generateBCDResearch,
  generateLaTeXContent,
  generateMarketingStrategy,
  getModelInfo,
  isModelAvailable
}; 