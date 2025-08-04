import { Router } from 'express';
import { intelligenceEngine } from '../services/intelligenceEngine';
import { logger } from '../config/logger';

const router = Router();

// Web scraping endpoint
router.post('/scrape', async (req, res) => {
  try {
    const { url, selectors } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    logger.info(`Web scraping request for: ${url}`);
    const result = await intelligenceEngine.scrapeWebsite(url, selectors || {});
    
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Web scraping failed:', error);
    return res.status(500).json({ error: 'Failed to scrape website' });
  }
});

// Competitor analysis endpoint
router.post('/analyze-competitor', async (req, res) => {
  try {
    const { competitorUrl } = req.body;
    
    if (!competitorUrl) {
      return res.status(400).json({ error: 'Competitor URL is required' });
    }

    logger.info(`Competitor analysis request for: ${competitorUrl}`);
    const profile = await intelligenceEngine.analyzeCompetitor(competitorUrl);
    
    return res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    logger.error('Competitor analysis failed:', error);
    return res.status(500).json({ error: 'Failed to analyze competitor' });
  }
});

// Competitor tracking endpoint
router.post('/track-competitors', async (req, res) => {
  try {
    const { competitorUrls } = req.body;
    
    if (!competitorUrls || !Array.isArray(competitorUrls)) {
      return res.status(400).json({ error: 'Competitor URLs array is required' });
    }

    logger.info(`Competitor tracking request for ${competitorUrls.length} companies`);
    const profiles = await intelligenceEngine.trackCompetitors(competitorUrls);
    
    return res.json({
      success: true,
      data: profiles,
      count: profiles.length
    });
  } catch (error) {
    logger.error('Competitor tracking failed:', error);
    return res.status(500).json({ error: 'Failed to track competitors' });
  }
});

// Market analysis endpoint
router.post('/market-analysis', async (req, res) => {
  try {
    const { industry, region } = req.body;
    
    if (!industry || !region) {
      return res.status(400).json({ error: 'Industry and region are required' });
    }

    logger.info(`Market analysis request for ${industry} in ${region}`);
    const analysis = await intelligenceEngine.generateMarketAnalysis(industry, region);
    
    return res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    logger.error('Market analysis failed:', error);
    return res.status(500).json({ error: 'Failed to generate market analysis' });
  }
});

// Strategy formulation endpoint
router.post('/formulate-strategy', async (req, res) => {
  try {
    const { businessObjective, targetMarket, competitors } = req.body;
    
    if (!businessObjective || !targetMarket) {
      return res.status(400).json({ error: 'Business objective and target market are required' });
    }

    logger.info(`Strategy formulation request for: ${businessObjective}`);
    const strategy = await intelligenceEngine.formulateStrategy(
      businessObjective,
      targetMarket,
      competitors || []
    );
    
    return res.json({
      success: true,
      data: strategy
    });
  } catch (error) {
    logger.error('Strategy formulation failed:', error);
    return res.status(500).json({ error: 'Failed to formulate strategy' });
  }
});

// Implementation plan endpoint
router.post('/create-implementation-plan', async (req, res) => {
  try {
    const { strategy } = req.body;
    
    if (!strategy) {
      return res.status(400).json({ error: 'Strategy is required' });
    }

    logger.info('Implementation plan creation request');
    const plan = await intelligenceEngine.createImplementationPlan(strategy);
    
    return res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    logger.error('Implementation plan creation failed:', error);
    return res.status(500).json({ error: 'Failed to create implementation plan' });
  }
});

// Comprehensive business intelligence endpoint
router.post('/business-intelligence', async (req, res) => {
  try {
    const { 
      businessObjective, 
      targetMarket, 
      industry, 
      region, 
      competitorUrls 
    } = req.body;
    
    if (!businessObjective || !targetMarket || !industry || !region) {
      return res.status(400).json({ 
        error: 'Business objective, target market, industry, and region are required' 
      });
    }

    logger.info(`Comprehensive business intelligence request for: ${businessObjective}`);
    
    // Execute all intelligence tasks
    const [marketAnalysis, competitors, strategy] = await Promise.all([
      intelligenceEngine.generateMarketAnalysis(industry, region),
      competitorUrls ? intelligenceEngine.trackCompetitors(competitorUrls) : Promise.resolve([]),
      intelligenceEngine.formulateStrategy(businessObjective, targetMarket, []),
      Promise.resolve(null) // Will be created after strategy
    ]);

    // Create implementation plan with the formulated strategy
    const plan = await intelligenceEngine.createImplementationPlan(strategy);
    
    const comprehensiveReport = {
      business_objective: businessObjective,
      target_market: targetMarket,
      industry: industry,
      region: region,
      market_analysis: marketAnalysis,
      competitor_analysis: competitors,
      strategic_plan: strategy,
      implementation_plan: plan,
      summary: {
        market_size: marketAnalysis.market_size,
        growth_rate: marketAnalysis.growth_rate,
        key_players_count: marketAnalysis.key_players.length,
        competitors_analyzed: competitors.length,
        implementation_duration: plan.timeline.duration,
        total_budget: plan.resource_requirements.budget
      }
    };
    
    return res.json({
      success: true,
      data: comprehensiveReport
    });
  } catch (error) {
    logger.error('Business intelligence failed:', error);
    return res.status(500).json({ error: 'Failed to generate business intelligence' });
  }
});

// Get intelligence tasks status
router.get('/tasks', async (_req, res) => {
  try {
    // This would return tasks from the intelligence engine
    return res.json({
      success: true,
      data: {
        active_tasks: 0,
        completed_tasks: 0,
        failed_tasks: 0
      }
    });
  } catch (error) {
    logger.error('Failed to get tasks status:', error);
    return res.status(500).json({ error: 'Failed to get tasks status' });
  }
});

export { router as intelligenceRoutes }; 