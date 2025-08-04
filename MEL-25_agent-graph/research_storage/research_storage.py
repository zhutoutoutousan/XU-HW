#!/usr/bin/env python3
"""
Research Storage Service for Marketing Analysis Strategy Department
Stores and manages research results, findings, and data for paper generation.
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from pathlib import Path

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
import uvicorn

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Research Storage Service", version="1.0.0")

# Create directories
DATA_DIR = Path("/app/data")
REPORTS_DIR = Path("/app/reports")
DATA_DIR.mkdir(exist_ok=True)
REPORTS_DIR.mkdir(exist_ok=True)

# Mount static files
# app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Pydantic models
class ResearchData(BaseModel):
    agent_id: str
    task_id: str
    data_type: str  # 'scraped_data', 'analysis_results', 'strategy_insights', 'report_sections'
    content: Dict[str, Any]
    timestamp: str
    metadata: Optional[Dict[str, Any]] = None

class ResearchQuery(BaseModel):
    data_type: Optional[str] = None
    agent_id: Optional[str] = None
    task_id: Optional[str] = None
    limit: int = 100

@app.get("/", response_class=HTMLResponse)
async def home():
    """Research storage dashboard."""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Research Storage Dashboard</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .container { max-width: 1200px; margin: 0 auto; }
            .section { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
            .btn { padding: 10px 20px; margin: 5px; text-decoration: none; color: white; border-radius: 5px; }
            .btn-primary { background: #007bff; }
            .btn-secondary { background: #6c757d; }
            .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
            .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>📚 Research Storage Dashboard</h1>
            
            <div class="section">
                <h2>📊 Quick Stats</h2>
                <div class="stats">
                    <div class="stat-card">
                        <h3>Total Research Items</h3>
                        <p id="total-items">Loading...</p>
                    </div>
                    <div class="stat-card">
                        <h3>Scraped Data</h3>
                        <p id="scraped-data">Loading...</p>
                    </div>
                    <div class="stat-card">
                        <h3>Analysis Results</h3>
                        <p id="analysis-results">Loading...</p>
                    </div>
                    <div class="stat-card">
                        <h3>Reports Generated</h3>
                        <p id="reports">Loading...</p>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>🔍 Research Data</h2>
                <a href="/api/data" class="btn btn-primary">View All Data</a>
                <a href="/api/data?data_type=scraped_data" class="btn btn-secondary">Scraped Data</a>
                <a href="/api/data?data_type=analysis_results" class="btn btn-secondary">Analysis Results</a>
                <a href="/api/data?data_type=strategy_insights" class="btn btn-secondary">Strategy Insights</a>
                <a href="/api/data?data_type=report_sections" class="btn btn-secondary">Report Sections</a>
            </div>
            
            <div class="section">
                <h2>📄 Reports</h2>
                <a href="/reports" class="btn btn-primary">View Reports</a>
                <a href="/api/export/latex" class="btn btn-secondary">Export LaTeX</a>
                <a href="/api/export/json" class="btn btn-secondary">Export JSON</a>
            </div>
            
            <div class="section">
                <h2>🔧 API Endpoints</h2>
                <ul>
                    <li><strong>GET /api/data</strong> - Get all research data</li>
                    <li><strong>POST /api/data</strong> - Store new research data</li>
                    <li><strong>GET /api/data/{data_type}</strong> - Get data by type</li>
                    <li><strong>GET /api/export/latex</strong> - Export LaTeX report</li>
                    <li><strong>GET /api/export/json</strong> - Export JSON data</li>
                </ul>
            </div>
        </div>
        
        <script>
            // Load stats
            fetch('/api/stats')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('total-items').textContent = data.total_items;
                    document.getElementById('scraped-data').textContent = data.scraped_data;
                    document.getElementById('analysis-results').textContent = data.analysis_results;
                    document.getElementById('reports').textContent = data.reports;
                });
        </script>
    </body>
    </html>
    """

@app.post("/api/data")
async def store_research_data(data: ResearchData):
    """Store research data from agents."""
    try:
        # Create filename based on data type and timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{data.data_type}_{data.agent_id}_{timestamp}.json"
        filepath = DATA_DIR / filename
        
        # Prepare data for storage
        storage_data = {
            "agent_id": data.agent_id,
            "task_id": data.task_id,
            "data_type": data.data_type,
            "content": data.content,
            "timestamp": data.timestamp,
            "metadata": data.metadata or {},
            "stored_at": datetime.now().isoformat()
        }
        
        # Save to file
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(storage_data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Stored research data: {filename}")
        return {"status": "success", "filename": filename, "message": "Research data stored successfully"}
    
    except Exception as e:
        logger.error(f"Error storing research data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to store research data: {str(e)}")

@app.get("/api/data")
async def get_research_data(
    data_type: Optional[str] = None,
    agent_id: Optional[str] = None,
    task_id: Optional[str] = None,
    limit: int = 100
):
    """Retrieve research data with optional filtering."""
    try:
        data_files = list(DATA_DIR.glob("*.json"))
        results = []
        
        for filepath in data_files[:limit]:
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # Apply filters
                if data_type and data.get('data_type') != data_type:
                    continue
                if agent_id and data.get('agent_id') != agent_id:
                    continue
                if task_id and data.get('task_id') != task_id:
                    continue
                
                results.append(data)
            except Exception as e:
                logger.warning(f"Error reading file {filepath}: {e}")
                continue
        
        return {
            "status": "success",
            "count": len(results),
            "data": results
        }
    
    except Exception as e:
        logger.error(f"Error retrieving research data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve research data: {str(e)}")

@app.get("/api/stats")
async def get_stats():
    """Get research storage statistics."""
    try:
        data_files = list(DATA_DIR.glob("*.json"))
        
        stats = {
            "total_items": len(data_files),
            "scraped_data": 0,
            "analysis_results": 0,
            "strategy_insights": 0,
            "report_sections": 0
        }
        
        for filepath in data_files:
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    data_type = data.get('data_type', 'unknown')
                    if data_type in stats:
                        stats[data_type] += 1
            except:
                continue
        
        return stats
    
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")

@app.get("/api/export/latex")
async def export_latex():
    """Export research data as LaTeX report."""
    try:
        data_files = list(DATA_DIR.glob("*.json"))
        
        latex_content = []
        latex_content.append("\\documentclass{article}")
        latex_content.append("\\usepackage[utf8]{inputenc}")
        latex_content.append("\\usepackage{graphicx}")
        latex_content.append("\\usepackage{hyperref}")
        latex_content.append("\\title{Marketing Analysis Research Report}")
        latex_content.append("\\author{Marketing Analysis Strategy Department}")
        latex_content.append("\\date{\\today}")
        latex_content.append("\\begin{document}")
        latex_content.append("\\maketitle")
        
        # Group data by type
        data_by_type = {}
        for filepath in data_files:
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    data_type = data.get('data_type', 'unknown')
                    if data_type not in data_by_type:
                        data_by_type[data_type] = []
                    data_by_type[data_type].append(data)
            except:
                continue
        
        # Generate sections for each data type
        for data_type, items in data_by_type.items():
            latex_content.append(f"\\section{{{data_type.replace('_', ' ').title()}}}")
            
            for item in items:
                latex_content.append(f"\\subsection{{{item.get('agent_id', 'Unknown Agent')}}}")
                latex_content.append(f"\\textbf{{Task ID:}} {item.get('task_id', 'Unknown')}")
                latex_content.append(f"\\textbf{{Timestamp:}} {item.get('timestamp', 'Unknown')}")
                
                content = item.get('content', {})
                if isinstance(content, dict):
                    for key, value in content.items():
                        latex_content.append(f"\\textbf{{{key}}}: {value}")
                else:
                    latex_content.append(f"\\textbf{{Content}}: {content}")
                
                latex_content.append("")
        
        latex_content.append("\\end{document}")
        
        # Save LaTeX file
        latex_file = REPORTS_DIR / f"research_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.tex"
        with open(latex_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(latex_content))
        
        return FileResponse(
            latex_file,
            media_type='application/x-tex',
            filename=latex_file.name
        )
    
    except Exception as e:
        logger.error(f"Error exporting LaTeX: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to export LaTeX: {str(e)}")

@app.get("/api/export/json")
async def export_json():
    """Export all research data as JSON."""
    try:
        data_files = list(DATA_DIR.glob("*.json"))
        all_data = []
        
        for filepath in data_files:
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    all_data.append(data)
            except:
                continue
        
        # Save JSON export
        json_file = REPORTS_DIR / f"research_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(all_data, f, indent=2, ensure_ascii=False)
        
        return FileResponse(
            json_file,
            media_type='application/json',
            filename=json_file.name
        )
    
    except Exception as e:
        logger.error(f"Error exporting JSON: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to export JSON: {str(e)}")

@app.get("/reports")
async def list_reports():
    """List available reports."""
    try:
        report_files = list(REPORTS_DIR.glob("*"))
        reports = []
        
        for filepath in report_files:
            if filepath.is_file():
                reports.append({
                    "name": filepath.name,
                    "size": filepath.stat().st_size,
                    "modified": datetime.fromtimestamp(filepath.stat().st_mtime).isoformat(),
                    "url": f"/reports/{filepath.name}"
                })
        
        return {"reports": reports}
    
    except Exception as e:
        logger.error(f"Error listing reports: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list reports: {str(e)}")

@app.get("/reports/{filename}")
async def download_report(filename: str):
    """Download a specific report."""
    try:
        filepath = REPORTS_DIR / filename
        if not filepath.exists():
            raise HTTPException(status_code=404, detail="Report not found")
        
        return FileResponse(filepath)
    
    except Exception as e:
        logger.error(f"Error downloading report: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to download report: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "research_storage"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001) 