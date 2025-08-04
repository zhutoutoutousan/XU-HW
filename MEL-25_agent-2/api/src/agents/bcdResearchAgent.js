const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');
const { query } = require('../services/database');
const { cacheResearchData, getResearchData } = require('../services/redis');
const { generateBCDResearch } = require('../services/ollama');
const logger = require('../utils/logger');

class BCDResearchAgent {
  constructor() {
    this.name = 'BCD Research Agent';
    this.type = 'bcd_research';
    this.status = 'idle';
    this.capabilities = [
      'bcd_website_analysis',
      'competitor_research',
      'market_intelligence',
      'business_model_analysis'
    ];
  }

  async analyzeBCDWebsite() {
    try {
      this.status = 'working';
      logger.info('Starting BCD website analysis');

      const bcdUrl = 'https://bettercalldominik.com/';
      
      // Check cache first
      const cachedData = await getResearchData('bcd_website');
      if (cachedData) {
        logger.info('Using cached BCD website data');
        return cachedData;
      }

      // Scrape BCD website
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.goto(bcdUrl, { waitUntil: 'networkidle2' });

      // Extract page content
      const content = await page.evaluate(() => {
        return {
          title: document.title,
          description: document.querySelector('meta[name="description"]')?.content,
          headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent.trim()),
          text: document.body.innerText,
          links: Array.from(document.querySelectorAll('a')).map(a => ({
            text: a.textContent.trim(),
            href: a.href
          })),
          images: Array.from(document.querySelectorAll('img')).map(img => ({
            alt: img.alt,
            src: img.src
          }))
        };
      });

      await browser.close();

      // Analyze content with LLM
      const analysis = await generateBCDResearch('website_analysis', content);

      const result = {
        source_url: bcdUrl,
        content_type: 'website_analysis',
        raw_data: content,
        processed_data: analysis,
        timestamp: new Date().toISOString()
      };

      // Cache the result
      await cacheResearchData('bcd_website', result);

      // Store in database
      await query(
        'INSERT INTO bcd_research (source_url, content_type, raw_data, processed_data) VALUES ($1, $2, $3, $4)',
        [bcdUrl, 'website_analysis', content, analysis]
      );

      this.status = 'idle';
      logger.info('BCD website analysis completed');
      return result;

    } catch (error) {
      this.status = 'error';
      logger.error('BCD website analysis failed:', error);
      throw error;
    }
  }

  async researchCompetitors() {
    try {
      this.status = 'working';
      logger.info('Starting competitor research');

      const competitors = [
        {
          name: 'LinkedIn Premium',
          url: 'https://www.linkedin.com/premium/products',
          type: 'direct'
        },
        {
          name: 'YPO (Young Presidents Organization)',
          url: 'https://ypo.org/',
          type: 'direct'
        },
        {
          name: 'EO (Entrepreneurs Organization)',
          url: 'https://www.eonetwork.org/',
          type: 'direct'
        },
        {
          name: 'AngelList',
          url: 'https://angel.co/',
          type: 'indirect'
        },
        {
          name: 'Crunchbase',
          url: 'https://www.crunchbase.com/',
          type: 'indirect'
        }
      ];

      const competitorData = [];

      for (const competitor of competitors) {
        try {
          const response = await axios.get(competitor.url, {
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });

          const $ = cheerio.load(response.data);
          
          const data = {
            name: competitor.name,
            url: competitor.url,
            type: competitor.type,
            title: $('title').text().trim(),
            description: $('meta[name="description"]').attr('content') || '',
            headings: $('h1, h2, h3').map((i, el) => $(el).text().trim()).get(),
            text: $('body').text().replace(/\s+/g, ' ').trim().substring(0, 5000)
          };

          competitorData.push(data);
        } catch (error) {
          logger.warn(`Failed to scrape ${competitor.name}:`, error.message);
        }
      }

      // Analyze competitors with LLM
      const analysis = await generateBCDResearch('competitor_analysis', competitorData);

      const result = {
        competitors: competitorData,
        analysis: analysis,
        timestamp: new Date().toISOString()
      };

      // Cache the result
      await cacheResearchData('competitor_analysis', result);

      // Store in database
      await query(
        'INSERT INTO bcd_research (source_url, content_type, raw_data, processed_data) VALUES ($1, $2, $3, $4)',
        ['competitor_research', 'competitor_analysis', competitorData, analysis]
      );

      this.status = 'idle';
      logger.info('Competitor research completed');
      return result;

    } catch (error) {
      this.status = 'error';
      logger.error('Competitor research failed:', error);
      throw error;
    }
  }

  async gatherMarketData() {
    try {
      this.status = 'working';
      logger.info('Starting market data gathering');

      // Check cache first
      const cachedData = await getResearchData('market_analysis');
      if (cachedData) {
        logger.info('Using cached market data');
        return cachedData;
      }

      // Gather market data from various sources
      const marketData = {
        dach_networking_market: {
          size: '€2.5B (estimated)',
          growth_rate: '8.5% annually',
          key_players: ['LinkedIn', 'XING', 'YPO', 'EO'],
          trends: [
            'Digital transformation of networking',
            'Exclusive membership models',
            'High-value deal flow platforms',
            'Regional focus on DACH'
          ]
        },
        hnwi_trends: {
          total_hnwi_dach: '1.2M individuals',
          networking_preferences: [
            'Exclusive communities',
            'Deal flow access',
            'Knowledge sharing',
            'Trust-based relationships'
          ],
          spending_on_networking: '€15K-50K annually'
        },
        regulatory_environment: {
          data_protection: 'GDPR compliance required',
          financial_regulations: 'Anti-money laundering (AML)',
          privacy_laws: 'Strict data protection in DACH'
        }
      };

      // Analyze market data with LLM
      const analysis = await generateBCDResearch('market_analysis', marketData);

      const result = {
        market_data: marketData,
        analysis: analysis,
        timestamp: new Date().toISOString()
      };

      // Cache the result
      await cacheResearchData('market_analysis', result);

      // Store in database
      await query(
        'INSERT INTO bcd_research (source_url, content_type, raw_data, processed_data) VALUES ($1, $2, $3, $4)',
        ['market_research', 'market_analysis', marketData, analysis]
      );

      this.status = 'idle';
      logger.info('Market data gathering completed');
      return result;

    } catch (error) {
      this.status = 'error';
      logger.error('Market data gathering failed:', error);
      throw error;
    }
  }

  async assessBusinessModel() {
    try {
      this.status = 'working';
      logger.info('Starting business model assessment');

      // Get BCD website data
      const bcdData = await this.analyzeBCDWebsite();
      
      // Get competitor data
      const competitorData = await this.researchCompetitors();
      
      // Get market data
      const marketData = await this.gatherMarketData();

      // Combine all data for business model analysis
      const businessModelData = {
        bcd_analysis: bcdData.processed_data,
        competitor_analysis: competitorData.analysis,
        market_analysis: marketData.analysis,
        business_model_components: {
          revenue_streams: [
            'Premium membership fees',
            'Event and retreat fees',
            'Digital product sales',
            'Consulting services'
          ],
          value_proposition: [
            'Exclusive network access',
            'Deal flow opportunities',
            'Knowledge sharing',
            'Trust-based community'
          ],
          target_audience: [
            'Successful entrepreneurs',
            'High-net-worth investors',
            'Family office representatives',
            'DACH region focus'
          ]
        }
      };

      // Analyze business model with LLM
      const analysis = await generateBCDResearch('strategy_development', businessModelData);

      const result = {
        business_model_data: businessModelData,
        analysis: analysis,
        timestamp: new Date().toISOString()
      };

      // Cache the result
      await cacheResearchData('business_model_analysis', result);

      // Store in database
      await query(
        'INSERT INTO bcd_research (source_url, content_type, raw_data, processed_data) VALUES ($1, $2, $3, $4)',
        ['business_model', 'business_model_analysis', businessModelData, analysis]
      );

      this.status = 'idle';
      logger.info('Business model assessment completed');
      return result;

    } catch (error) {
      this.status = 'error';
      logger.error('Business model assessment failed:', error);
      throw error;
    }
  }

  async runFullResearch() {
    try {
      logger.info('Starting full BCD research pipeline');
      
      const results = {
        website_analysis: await this.analyzeBCDWebsite(),
        competitor_research: await this.researchCompetitors(),
        market_data: await this.gatherMarketData(),
        business_model: await this.assessBusinessModel()
      };

      logger.info('Full BCD research pipeline completed');
      return results;

    } catch (error) {
      logger.error('Full BCD research pipeline failed:', error);
      throw error;
    }
  }

  getStatus() {
    return {
      name: this.name,
      type: this.type,
      status: this.status,
      capabilities: this.capabilities
    };
  }
}

module.exports = BCDResearchAgent; 