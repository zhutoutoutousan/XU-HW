<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-french-toast';
	import axios from 'axios';

	const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

	let businessObjective = '';
	let targetMarket = '';
	let industry = '';
	let region = '';
	let competitorUrls = '';
	let isAnalyzing = false;
	let analysisResults: any = null;
	let activeTab = 'intelligence';

	async function runBusinessIntelligence() {
		if (!businessObjective || !targetMarket || !industry || !region) {
			toast.error('Please fill in all required fields');
			return;
		}

		isAnalyzing = true;
		try {
			const competitorUrlsArray = competitorUrls
				.split('\n')
				.map(url => url.trim())
				.filter(url => url.length > 0);

			const response = await axios.post(`${API_BASE}/api/intelligence/business-intelligence`, {
				businessObjective,
				targetMarket,
				industry,
				region,
				competitorUrls: competitorUrlsArray
			});

			analysisResults = response.data.data;
			toast.success('Business intelligence analysis completed!');
		} catch (error) {
			console.error('Intelligence analysis failed:', error);
			toast.error('Failed to run business intelligence analysis');
		} finally {
			isAnalyzing = false;
		}
	}

	async function scrapeWebsite() {
		const url = prompt('Enter website URL to scrape:');
		if (!url) return;

		try {
			const response = await axios.post(`${API_BASE}/api/intelligence/scrape`, {
				url,
				selectors: {
					pricing: '.price, .pricing, [class*="price"]',
					features: '.feature, .benefit, [class*="feature"]',
					content: 'h1, h2, h3, p'
				}
			});

			console.log('Scraping results:', response.data.data);
			toast.success('Website scraped successfully!');
		} catch (error) {
			console.error('Scraping failed:', error);
			toast.error('Failed to scrape website');
		}
	}

	function exportReport() {
		if (!analysisResults) return;

		const report = {
			timestamp: new Date().toISOString(),
			business_objective: businessObjective,
			target_market: targetMarket,
			industry,
			region,
			analysis: analysisResults
		};

		const blob = new Blob([JSON.stringify(report, null, 2)], {
			type: 'application/json'
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `business-intelligence-report-${Date.now()}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<div class="intelligence-dashboard">
	<div class="dashboard-header">
		<h1>Business Intelligence Arsenal</h1>
		<p>Autonomous competitive analysis, market research, and strategic planning</p>
	</div>

	<div class="tab-navigation">
		<button 
			class="tab-button {activeTab === 'intelligence' ? 'active' : ''}"
			on:click={() => activeTab = 'intelligence'}
		>
			🎯 Business Intelligence
		</button>
		<button 
			class="tab-button {activeTab === 'competitors' ? 'active' : ''}"
			on:click={() => activeTab = 'competitors'}
		>
			🏢 Competitor Tracking
		</button>
		<button 
			class="tab-button {activeTab === 'strategy' ? 'active' : ''}"
			on:click={() => activeTab = 'strategy'}
		>
			📊 Strategy & Planning
		</button>
		<button 
			class="tab-button {activeTab === 'tools' ? 'active' : ''}"
			on:click={() => activeTab = 'tools'}
		>
			🛠️ Intelligence Tools
		</button>
	</div>

	{#if activeTab === 'intelligence'}
		<div class="intelligence-form">
			<h2>Comprehensive Business Intelligence</h2>
			<p>Generate complete market analysis, competitor profiles, and strategic recommendations</p>

			<div class="form-grid">
				<div class="form-group">
					<label for="objective">Business Objective *</label>
					<textarea
						id="objective"
						bind:value={businessObjective}
						placeholder="e.g., Launch a new SaaS product in the project management space"
						rows="3"
					></textarea>
				</div>

				<div class="form-group">
					<label for="targetMarket">Target Market *</label>
					<input
						id="targetMarket"
						bind:value={targetMarket}
						placeholder="e.g., Small to medium businesses in North America"
					/>
				</div>

				<div class="form-group">
					<label for="industry">Industry *</label>
					<input
						id="industry"
						bind:value={industry}
						placeholder="e.g., Software as a Service"
					/>
				</div>

				<div class="form-group">
					<label for="region">Region *</label>
					<input
						id="region"
						bind:value={region}
						placeholder="e.g., North America"
					/>
				</div>

				<div class="form-group full-width">
					<label for="competitors">Competitor URLs (one per line)</label>
					<textarea
						id="competitors"
						bind:value={competitorUrls}
						placeholder="https://competitor1.com&#10;https://competitor2.com&#10;https://competitor3.com"
						rows="4"
					></textarea>
				</div>
			</div>

			<div class="form-actions">
				<button 
					class="btn btn-primary"
					on:click={runBusinessIntelligence}
					disabled={isAnalyzing}
				>
					{isAnalyzing ? '🔍 Analyzing...' : '🚀 Run Intelligence Analysis'}
				</button>
			</div>
		</div>
	{/if}

	{#if activeTab === 'competitors'}
		<div class="competitor-tracking">
			<h2>Competitor Intelligence</h2>
			<p>Track and analyze competitor strategies, pricing, and market positioning</p>

			<div class="tracking-tools">
				<div class="tool-card">
					<h3>🔍 Web Scraping</h3>
					<p>Extract pricing, features, and content from competitor websites</p>
					<button class="btn btn-outline" on:click={scrapeWebsite}>
						Scrape Website
					</button>
				</div>

				<div class="tool-card">
					<h3>📊 Market Analysis</h3>
					<p>Generate comprehensive market size and growth analysis</p>
					<button class="btn btn-outline">
						Analyze Market
					</button>
				</div>

				<div class="tool-card">
					<h3>🎯 Competitive Positioning</h3>
					<p>Identify competitive advantages and market gaps</p>
					<button class="btn btn-outline">
						Position Analysis
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if activeTab === 'strategy'}
		<div class="strategy-planning">
			<h2>Strategic Planning</h2>
			<p>Formulate comprehensive business strategies and implementation plans</p>

			<div class="strategy-components">
				<div class="component-card">
					<h3>💰 Pricing Strategy</h3>
					<p>Value-based pricing with premium positioning</p>
					<span class="status">Ready</span>
				</div>

				<div class="component-card">
					<h3>📈 Marketing Strategy</h3>
					<p>Multi-channel digital marketing with content-driven approach</p>
					<span class="status">Ready</span>
				</div>

				<div class="component-card">
					<h3>⚡ Implementation Plan</h3>
					<p>12-week detailed execution timeline with milestones</p>
					<span class="status">Ready</span>
				</div>

				<div class="component-card">
					<h3>🎯 Success Metrics</h3>
					<p>Revenue growth, CAC reduction, CLV increase, market share</p>
					<span class="status">Ready</span>
				</div>
			</div>
		</div>
	{/if}

	{#if activeTab === 'tools'}
		<div class="intelligence-tools">
			<h2>Intelligence Tools</h2>
			<p>Specialized tools for business intelligence and competitive analysis</p>

			<div class="tools-grid">
				<div class="tool-item">
					<h3>🌐 Web Scraping Engine</h3>
					<ul>
						<li>Automated data extraction</li>
						<li>Pricing intelligence</li>
						<li>Feature analysis</li>
						<li>Content monitoring</li>
					</ul>
				</div>

				<div class="tool-item">
					<h3>📊 Market Research</h3>
					<ul>
						<li>Market size estimation</li>
						<li>Growth rate analysis</li>
						<li>Trend identification</li>
						<li>Opportunity mapping</li>
					</ul>
				</div>

				<div class="tool-item">
					<h3>🏢 Competitor Tracking</h3>
					<ul>
						<li>SWOT analysis</li>
						<li>Pricing strategy analysis</li>
						<li>Feature comparison</li>
						<li>Market positioning</li>
					</ul>
				</div>

				<div class="tool-item">
					<h3>📋 Strategic Planning</h3>
					<ul>
						<li>Business strategy formulation</li>
						<li>Implementation planning</li>
						<li>Resource allocation</li>
						<li>Risk mitigation</li>
					</ul>
				</div>
			</div>
		</div>
	{/if}

	{#if analysisResults}
		<div class="analysis-results">
			<div class="results-header">
				<h2>Intelligence Analysis Results</h2>
				<button class="btn btn-outline" on:click={exportReport}>
					📄 Export Report
				</button>
			</div>

			<div class="results-grid">
				<div class="result-card">
					<h3>📊 Market Analysis</h3>
					<div class="metric">
						<strong>Market Size:</strong> ${analysisResults.market_analysis.market_size.toLocaleString()}
					</div>
					<div class="metric">
						<strong>Growth Rate:</strong> {(analysisResults.market_analysis.growth_rate * 100).toFixed(1)}%
					</div>
					<div class="metric">
						<strong>Key Players:</strong> {analysisResults.market_analysis.key_players.length}
					</div>
				</div>

				<div class="result-card">
					<h3>🏢 Competitor Analysis</h3>
					<div class="metric">
						<strong>Competitors Analyzed:</strong> {analysisResults.competitor_analysis.length}
					</div>
					<div class="metric">
						<strong>Market Position:</strong> {analysisResults.strategic_plan.competitive_advantage}
					</div>
				</div>

				<div class="result-card">
					<h3>📈 Strategic Plan</h3>
					<div class="metric">
						<strong>Pricing Strategy:</strong> {analysisResults.strategic_plan.pricing_strategy}
					</div>
					<div class="metric">
						<strong>Marketing Strategy:</strong> {analysisResults.strategic_plan.marketing_strategy}
					</div>
				</div>

				<div class="result-card">
					<h3>⚡ Implementation</h3>
					<div class="metric">
						<strong>Duration:</strong> {analysisResults.implementation_plan.timeline.duration}
					</div>
					<div class="metric">
						<strong>Budget:</strong> {analysisResults.implementation_plan.resource_requirements.budget}
					</div>
					<div class="metric">
						<strong>Team Size:</strong> {analysisResults.implementation_plan.resource_requirements.team_size}
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.intelligence-dashboard {
		padding: 2rem;
		max-width: 1400px;
		margin: 0 auto;
	}

	.dashboard-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.dashboard-header h1 {
		font-size: 2.5rem;
		color: var(--primary-color);
		margin-bottom: 0.5rem;
	}

	.dashboard-header p {
		color: var(--text-muted);
		font-size: 1.1rem;
	}

	.tab-navigation {
		display: flex;
		gap: 1rem;
		margin-bottom: 2rem;
		overflow-x: auto;
		padding-bottom: 0.5rem;
	}

	.tab-button {
		padding: 0.75rem 1.5rem;
		border: 1px solid var(--border-color);
		background: var(--surface-color);
		color: var(--text-color);
		border-radius: 8px;
		cursor: pointer;
		white-space: nowrap;
		transition: all 0.2s ease;
	}

	.tab-button:hover {
		background: var(--primary-color);
		color: white;
	}

	.tab-button.active {
		background: var(--primary-color);
		color: white;
		border-color: var(--primary-color);
	}

	.intelligence-form {
		background: var(--surface-color);
		border-radius: 12px;
		padding: 2rem;
		border: 1px solid var(--border-color);
	}

	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
	}

	.form-group.full-width {
		grid-column: 1 / -1;
	}

	.form-group label {
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: var(--text-color);
	}

	.form-group input,
	.form-group textarea {
		padding: 0.75rem;
		border: 1px solid var(--border-color);
		border-radius: 6px;
		background: var(--background-color);
		color: var(--text-color);
		font-size: 1rem;
	}

	.form-group input:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: var(--primary-color);
	}

	.form-actions {
		text-align: center;
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;
		font-size: 1rem;
	}

	.btn-primary {
		background: var(--primary-color);
		color: white;
	}

	.btn-primary:hover {
		background: var(--secondary-color);
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-outline {
		background: transparent;
		color: var(--text-color);
		border: 1px solid var(--border-color);
	}

	.btn-outline:hover {
		background: var(--primary-color);
		color: white;
		border-color: var(--primary-color);
	}

	.tracking-tools,
	.strategy-components {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.tool-card,
	.component-card {
		background: var(--surface-color);
		border: 1px solid var(--border-color);
		border-radius: 12px;
		padding: 1.5rem;
		position: relative;
	}

	.tool-card h3,
	.component-card h3 {
		margin-bottom: 0.5rem;
		color: var(--primary-color);
	}

	.tool-card p,
	.component-card p {
		color: var(--text-muted);
		margin-bottom: 1rem;
	}

	.status {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: var(--success-color);
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.tools-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
	}

	.tool-item {
		background: var(--surface-color);
		border: 1px solid var(--border-color);
		border-radius: 12px;
		padding: 1.5rem;
	}

	.tool-item h3 {
		color: var(--primary-color);
		margin-bottom: 1rem;
	}

	.tool-item ul {
		list-style: none;
		padding: 0;
	}

	.tool-item li {
		padding: 0.25rem 0;
		color: var(--text-muted);
	}

	.tool-item li:before {
		content: "✓";
		color: var(--success-color);
		margin-right: 0.5rem;
		font-weight: bold;
	}

	.analysis-results {
		margin-top: 2rem;
		background: var(--surface-color);
		border-radius: 12px;
		padding: 2rem;
		border: 1px solid var(--border-color);
	}

	.results-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.results-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.result-card {
		background: var(--background-color);
		border: 1px solid var(--border-color);
		border-radius: 8px;
		padding: 1.5rem;
	}

	.result-card h3 {
		color: var(--primary-color);
		margin-bottom: 1rem;
	}

	.metric {
		margin-bottom: 0.5rem;
		color: var(--text-color);
	}

	.metric strong {
		color: var(--text-color);
	}

	@media (max-width: 768px) {
		.form-grid {
			grid-template-columns: 1fr;
		}

		.tab-navigation {
			flex-direction: column;
		}

		.results-header {
			flex-direction: column;
			gap: 1rem;
		}
	}
</style> 