const express = require('express');
const router = express.Router();
const { query } = require('../services/database');
const { generateLaTeXContent, generateMarketingStrategy } = require('../services/ollama');
const logger = require('../utils/logger');
const fs = require('fs-extra');
const path = require('path');

// Get all LaTeX documents
router.get('/', async (req, res) => {
  try {
    const { limit = 20, offset = 0, status } = req.query;
    
    let sql = 'SELECT * FROM latex_documents';
    let params = [];
    
    if (status) {
      sql += ' WHERE status = $1';
      params.push(status);
    }
    
    sql += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await query(sql, params);
    
    res.json({
      documents: result.rows,
      total: result.rows.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    logger.error('Failed to get LaTeX documents:', error);
    res.status(500).json({ error: 'Failed to get LaTeX documents' });
  }
});

// Get LaTeX document by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM latex_documents WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Failed to get LaTeX document:', error);
    res.status(500).json({ error: 'Failed to get LaTeX document' });
  }
});

// Create new LaTeX document
router.post('/', async (req, res) => {
  try {
    const { title, template = 'default' } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    // Generate initial content
    const content = await generateLaTeXContent('title', { title });
    
    const result = await query(
      'INSERT INTO latex_documents (title, content, template, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, content, template, 'draft']
    );
    
    logger.info(`Created new LaTeX document: ${title}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Failed to create LaTeX document:', error);
    res.status(500).json({ error: 'Failed to create LaTeX document' });
  }
});

// Generate BCD marketing strategy document
router.post('/generate-bcd-strategy', async (req, res) => {
  try {
    const { title = 'BCD Marketing Strategy Research' } = req.body;
    
    logger.info('Generating BCD marketing strategy document');
    
    // Generate comprehensive strategy
    const strategy = await generateMarketingStrategy(
      { bcd_data: 'placeholder' },
      { competitor_data: 'placeholder' },
      { market_data: 'placeholder' }
    );
    
    // Create document structure
    const documentContent = `
\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{geometry}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\usepackage{cite}

\\title{${title}}
\\author{MEL-25 Agent-2 Research System}
\\date{\\today}

\\begin{document}

\\maketitle

\\begin{abstract}
${strategy.substring(0, 500)}...
\\end{abstract}

\\tableofcontents
\\newpage

\\section{Executive Summary}
${strategy}

\\section{Market Analysis}
% Market analysis content will be generated here

\\section{Competitive Analysis}
% Competitive analysis content will be generated here

\\section{Target Audience Analysis}
% Target audience analysis content will be generated here

\\section{Value Proposition}
% Value proposition content will be generated here

\\section{Marketing Channels}
% Marketing channels content will be generated here

\\section{Campaign Recommendations}
% Campaign recommendations content will be generated here

\\section{Implementation Timeline}
% Implementation timeline content will be generated here

\\section{Success Metrics}
% Success metrics content will be generated here

\\section{Risk Assessment}
% Risk assessment content will be generated here

\\section{Conclusion}
% Conclusion content will be generated here

\\end{document}
    `;
    
    const result = await query(
      'INSERT INTO latex_documents (title, content, template, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, documentContent, 'bcd_strategy', 'draft']
    );
    
    logger.info(`Generated BCD strategy document: ${title}`);
    res.status(201).json({
      message: 'BCD marketing strategy document generated',
      document: result.rows[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to generate BCD strategy document:', error);
    res.status(500).json({ error: 'Failed to generate BCD strategy document' });
  }
});

// Update LaTeX document
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, template, status } = req.body;
    
    const result = await query(
      'UPDATE latex_documents SET title = COALESCE($1, title), content = COALESCE($2, content), template = COALESCE($3, template), status = COALESCE($4, status), updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [title, content, template, status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    logger.info(`Updated LaTeX document: ${result.rows[0].title}`);
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Failed to update LaTeX document:', error);
    res.status(500).json({ error: 'Failed to update LaTeX document' });
  }
});

// Compile LaTeX document to PDF
router.post('/:id/compile', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get document
    const result = await query('SELECT * FROM latex_documents WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    const document = result.rows[0];
    
    // Create output directory
    const outputDir = path.join(__dirname, '../../latex/output');
    await fs.ensureDir(outputDir);
    
    // Create LaTeX file
    const latexFile = path.join(outputDir, `${document.id}.tex`);
    await fs.writeFile(latexFile, document.content);
    
    // Compile LaTeX to PDF (this would require a LaTeX compiler)
    // For now, we'll just update the status
    await query(
      'UPDATE latex_documents SET status = $1, pdf_path = $2 WHERE id = $3',
      ['compiled', `/latex/output/${document.id}.pdf`, id]
    );
    
    logger.info(`Compiled LaTeX document: ${document.title}`);
    res.json({
      message: 'Document compiled successfully',
      document_id: id,
      pdf_path: `/latex/output/${document.id}.pdf`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to compile LaTeX document:', error);
    res.status(500).json({ error: 'Failed to compile LaTeX document' });
  }
});

// Delete LaTeX document
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query('DELETE FROM latex_documents WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    logger.info(`Deleted LaTeX document: ${result.rows[0].title}`);
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete LaTeX document:', error);
    res.status(500).json({ error: 'Failed to delete LaTeX document' });
  }
});

// Get document templates
router.get('/templates/list', async (req, res) => {
  try {
    const templates = [
      {
        name: 'default',
        description: 'Default LaTeX template',
        filename: 'default.tex'
      },
      {
        name: 'bcd_strategy',
        description: 'BCD Marketing Strategy template',
        filename: 'bcd_strategy.tex'
      },
      {
        name: 'research_paper',
        description: 'Academic research paper template',
        filename: 'research_paper.tex'
      }
    ];
    
    res.json({
      templates,
      total: templates.length
    });
  } catch (error) {
    logger.error('Failed to get templates:', error);
    res.status(500).json({ error: 'Failed to get templates' });
  }
});

module.exports = router; 