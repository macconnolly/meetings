const logger = console; // Use proper logger in production

class ContextAssembler {
  constructor(supermemoryClient) {
    this.client = supermemoryClient;
    this.logger = logger;
  }

  /**
   * Assembles context for deliverable preparation
   * @param {Object} deliverableRequest - Request details
   * @param {string} deliverableRequest.name - Deliverable name
   * @param {string} deliverableRequest.type - Type (report, presentation, etc.)
   * @param {string} deliverableRequest.audience - Target audience
   * @param {string} deliverableRequest.topic - Main topic/subject
   * @returns {Promise<Object>} Enhanced context package
   */
  async assembleDeliverableContext(deliverableRequest) {
    const startTime = Date.now();

    // Step 1: Find the meeting container ID
    const meetingId = await this.findMeetingContainerId(deliverableRequest);
    if (!meetingId) {
      this.logger.error('No meeting container found for deliverable prompt. Returning empty context.');
      return {
        rawContext: {},
        summary: { overview: 'No context found for this deliverable.' },
        stakeholderInsights: {},
        formatGuidance: {},
        requirements: {},
        successPatterns: {},
        risks: {},
        dependencies: {},
        timeline: {},
        confidence: { score: 0, level: 'Very Low', breakdown: {}, missingCritical: ['No meeting found'], recommendation: 'No context available.' },
        metadata: { processingTime: Date.now() - startTime, deliverableRequest }
      };
    }

    // Build search queries for different context types, scoped to meetingId
    const searchQueries = this.buildSearchQueries(deliverableRequest, meetingId);

    // Execute searches in parallel
    const searchResults = await this.executeSearchQueries(searchQueries);

    // Enhance context with analysis
    const enhancedContext = await this.enhanceContextPackage(
      searchResults,
      deliverableRequest
    );

    // Add metadata
    enhancedContext.metadata = {
      processingTime: Date.now() - startTime,
      totalResults: this.countTotalResults(searchResults),
      categoriesFound: Object.keys(searchResults).filter(k => searchResults[k].length > 0).length,
      deliverableRequest
    };

    this.logger.info('Context assembly complete', {
      processingTime: enhancedContext.metadata.processingTime,
      confidence: enhancedContext.confidence.score,
      totalResults: enhancedContext.metadata.totalResults
    });

    return enhancedContext;
  }

  /**
   * Finds the meeting container (memory object) matching the deliverableRequest name
   * @param {Object} deliverableRequest
   * @returns {Promise<string>} meeting_id
   */
  async findMeetingContainer(deliverableRequest) {
    // Try to find a memory object whose title or metadata matches the meeting name
    const query = {
      q: deliverableRequest.name,
      limit: 5
    };
    const response = await this.client.searchMemories(query);
    if (!response.results || response.results.length === 0) {
      throw new Error(`No meeting container found matching: ${deliverableRequest.name}`);
    }
    // Try to find the best match (exact or fuzzy)
    let best = response.results[0];
    for (const result of response.results) {
      if (
        (result.title && result.title.toLowerCase().includes(deliverableRequest.name.toLowerCase())) ||
        (result.metadata && result.metadata.meeting_title && result.metadata.meeting_title.toLowerCase().includes(deliverableRequest.name.toLowerCase()))
      ) {
        best = result;
        break;
      }
    }
    // meeting_id is in metadata or as a tag
    const meeting_id = best.metadata?.meeting_id || (best.tags && best.tags.find(t => t.startsWith('meeting-')));
    if (!meeting_id) {
      throw new Error('Meeting container found but no meeting_id in metadata or tags.');
    }
    return meeting_id;
  }

  /**
   * Find the meeting container (meeting_id) by searching for a memory matching the deliverable prompt
   * @param {Object} deliverableRequest
   * @returns {Promise<string|null>} meeting_id or null if not found
   */
  async findMeetingContainerId(deliverableRequest) {
    // Try searching by name, then topic if needed
    const queries = [deliverableRequest.name, deliverableRequest.topic];
    for (const q of queries) {
      const payload = {
        q,
        limit: 5,
        rewriteQuery: true
      };
      const response = await this.client.searchMemoriesV3(payload);
      if (response.results && response.results.length > 0) {
        // Try to extract meeting_id from metadata or tags
        for (const result of response.results) {
          const meta = result.metadata || {};
          if (meta.meeting_id) return meta.meeting_id;
          if (result.tags && Array.isArray(result.tags)) {
            // Look for a tag that matches the meeting id pattern
            const meetingTag = result.tags.find(t => t.startsWith('BRV') || t.match(/meeting[-_][A-Z0-9-]+/i));
            if (meetingTag) return meetingTag;
          }
        }
      }
    }
    this.logger.error('Could not find meeting container for deliverable prompt:', deliverableRequest);
    return null;
  }

  validateDeliverableRequest(request) {
    const required = ['name', 'type', 'audience', 'topic'];
    const missing = required.filter(field => !request[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
  }

  buildSearchQueries(deliverableRequest, meetingId, meetingMeta = {}) {
    const { name, type, audience, topic } = deliverableRequest;
    const projectCode = meetingMeta.project_code || meetingMeta.project || '';
    const baseTags = ['org_main', `meeting-${meetingId}`];
    if (projectCode) baseTags.push(`project-${projectCode}`);
    // Helper to attach filters as an object (not string)
    const withFilters = (query, filters) => {
      if (filters) {
        return { ...query, filters };
      }
      return query;
    };
    return [
      {
        name: 'stakeholder_intelligence',
        query: {
          q: `${audience} preferences communication format requirements style`,
          containerTags: [...baseTags, 'content-stakeholder_intel'],
          limit: 15
        }
      },
      {
        name: 'deliverable_specifications',
        query: withFilters({
          q: `${type} requirements specifications format examples template structure`,
          containerTags: [...baseTags, 'content-deliverable_intel'],
          limit: 20
        }, { deliverable_type: type })
      },
      {
        name: 'decision_context',
        query: withFilters({
          q: `${topic} decisions requirements changes evolution approved`,
          containerTags: [...baseTags, 'content-decision'],
          limit: 12
        }, { decision_status: 'approved' })
      },
      {
        name: 'implementation_insights',
        query: withFilters({
          q: `${topic} lessons learned success patterns best practices insights`,
          containerTags: [...baseTags, 'content-implementation_insight'],
          limit: 10
        }, { success_pattern: true })
      },
      {
        name: 'cross_project_context',
        query: withFilters({
          q: `${topic} cross project dependencies coordination shared resources`,
          containerTags: [...baseTags, 'content-cross_project_context'],
          limit: 8
        }, { cross_project_relevance: true })
      },
      {
        name: 'action_context',
        query: withFilters({
          q: `${topic} action items tasks deliverable related ${name}`,
          containerTags: [...baseTags, 'content-action_item'],
          limit: 10
        }, { deliverable_related: true })
      },
      {
        name: 'risk_context',
        query: {
          q: `${topic} risk mitigation challenges obstacles issues`,
          containerTags: [...baseTags, 'content-risk'],
          limit: 8
        }
      }
    ];
  }

  async executeSearchQueries(searchQueries) {
    const results = {};
    
    // Execute all searches in parallel for performance
    const searchPromises = searchQueries.map(async (searchConfig) => {
      try {
        const startTime = Date.now();
        // Use the new /v3/search endpoint
        const response = await this.client.searchMemoriesV3(searchConfig.query);
        const duration = Date.now() - startTime;
        
        this.logger.debug(`V3 Search '${searchConfig.name}' completed`, {
          duration,
          resultCount: response.results?.length || 0
        });
        
        return {
          name: searchConfig.name,
          results: response.results || [],
          metadata: {
            duration,
            resultCount: response.results?.length || 0
          }
        };
      } catch (error) {
        this.logger.error(`V3 Search failed for ${searchConfig.name}:`, error);
        return {
          name: searchConfig.name,
          results: [],
          error: error.message
        };
      }
    });
    
    const searchResults = await Promise.all(searchPromises);
    
    // Organize results by category
    searchResults.forEach(result => {
      results[result.name] = result.results;
    });
    
    return results;
  }

  async enhanceContextPackage(searchResults, deliverableRequest) {
    const enhanced = {
      rawContext: searchResults,
      summary: this.generateContextSummary(searchResults, deliverableRequest),
      stakeholderInsights: this.extractStakeholderInsights(
        searchResults.stakeholder_intelligence || []
      ),
      formatGuidance: this.compileFormatGuidance(searchResults),
      requirements: this.extractCurrentRequirements(searchResults),
      successPatterns: this.identifySuccessPatterns(searchResults),
      risks: this.analyzeRiskFactors(searchResults),
      dependencies: this.extractDependencies(searchResults),
      timeline: this.buildRequirementTimeline(searchResults),
      confidence: this.calculateContextConfidence(searchResults, deliverableRequest)
    };
    
    return enhanced;
  }

  generateContextSummary(searchResults, deliverableRequest) {
    const totalResults = this.countTotalResults(searchResults);
    
    let readinessLevel = 'Low';
    if (totalResults >= 10) readinessLevel = 'High';
    else if (totalResults >= 5) readinessLevel = 'Medium';
    
    return {
      overview: `Preparing ${deliverableRequest.name} (${deliverableRequest.type}) ` +
                `for ${deliverableRequest.audience} regarding ${deliverableRequest.topic}.`,
      readinessLevel,
      totalContextItems: totalResults,
      strongestAreas: this.identifyStrongestAreas(searchResults),
      gapsIdentified: this.identifyGaps(searchResults)
    };
  }

  extractStakeholderInsights(stakeholderResults) {
    if (!stakeholderResults || stakeholderResults.length === 0) {
      return {
        count: 0,
        profiles: [],
        preferences: {},
        communication: {
          summary: 'No stakeholder intelligence available',
          recommendations: []
        }
      };
    }
    
    // Extract profiles from search results
    const profiles = stakeholderResults.map(result => {
      const metadata = result.metadata || {};
      return {
        stakeholder: metadata.stakeholder,
        role: metadata.organizational_role,
        communicationStyle: metadata.communication_style,
        technicalSophistication: metadata.technical_sophistication,
        preferences: {
          prefers_visuals: metadata.prefers_visuals,
          prefers_data: metadata.prefers_data,
          prefers_narrative: metadata.prefers_narrative,
          prefers_bullet_points: metadata.prefers_bullet_points,
          prefers_executive_summary: metadata.prefers_executive_summary
        }
      };
    }).filter(p => p.stakeholder); // Filter out invalid profiles
    
    // Aggregate preferences
    const preferences = this.aggregateStakeholderPreferences(profiles);
    
    // Generate communication guidance
    const communication = this.generateCommunicationGuidance(profiles);
    
    return {
      count: profiles.length,
      profiles,
      preferences,
      communication
    };
  }

  aggregateStakeholderPreferences(profiles) {
    const aggregated = {
      prefers_visuals: 0,
      prefers_data: 0,
      prefers_narrative: 0,
      prefers_bullet_points: 0,
      prefers_executive_summary: 0
    };
    
    if (profiles.length === 0) return aggregated;
    
    profiles.forEach(profile => {
      if (profile.preferences) {
        Object.keys(aggregated).forEach(key => {
          if (profile.preferences[key]) aggregated[key]++;
        });
      }
    });
    
    // Convert to percentages
    Object.keys(aggregated).forEach(key => {
      aggregated[key] = Math.round((aggregated[key] / profiles.length) * 100);
    });
    
    return aggregated;
  }

  generateCommunicationGuidance(profiles) {
    const recommendations = [];
    
    if (profiles.length === 0) {
      return {
        summary: 'No stakeholder data available for communication guidance.',
        recommendations: ['Use standard format with executive summary']
      };
    }
    
    // Analyze preferences
    const prefs = this.aggregateStakeholderPreferences(profiles);
    
    if (prefs.prefers_visuals > 50) {
      recommendations.push('Include charts, diagrams, and visual representations to illustrate key points.');
    }
    
    if (prefs.prefers_data > 60) {
      recommendations.push('Provide detailed data, metrics, and quantitative analysis to support conclusions.');
    }
    
    if (prefs.prefers_executive_summary > 70) {
      recommendations.push('Lead with a comprehensive executive summary that is concise and impactful.');
    }
    
    // Analyze technical level
    const techLevels = profiles.map(p => p.technicalSophistication).filter(Boolean);
    const avgTechLevel = this.calculateAverageTechLevel(techLevels);
    
    let techGuidance = 'Balance technical detail with high-level clarity. The audience has a mixed technical background.';
    if (avgTechLevel >= 3) {
      techGuidance = 'Audience has high technical sophistication. Include detailed technical content, architecture diagrams, and code snippets where relevant.';
      recommendations.push('Incorporate in-depth technical details and advanced concepts.');
    } else if (avgTechLevel <= 1.5) {
      techGuidance = 'Audience has a non-technical background. Simplify complex concepts, use analogies, and focus on business impact.';
      recommendations.push('Avoid jargon. Simplify technical concepts and provide clear, concise explanations.');
    }
    
    return {
      summary: techGuidance,
      recommendations,
      dominantStyle: this.identifyDominantStyle(profiles),
      formatPreferences: this.extractFormatPreferences(prefs)
    };
  }

  calculateAverageTechLevel(techLevels) {
    if (techLevels.length === 0) return 2; // Default to intermediate
    
    const levelMap = {
      'basic': 1,
      'intermediate': 2,
      'advanced': 3,
      'expert': 4
    };
    
    const sum = techLevels.reduce((acc, level) => {
      return acc + (levelMap[level] || 2);
    }, 0);
    
    return sum / techLevels.length;
  }

  identifyDominantStyle(profiles) {
    const styles = profiles.map(p => p.communicationStyle).filter(Boolean);
    if (styles.length === 0) return 'collaborative'; // Default
    
    // Count occurrences
    const styleCounts = {};
    styles.forEach(style => {
      styleCounts[style] = (styleCounts[style] || 0) + 1;
    });
    
    // Find most common
    return Object.entries(styleCounts)
      .sort((a, b) => b[1] - a[1])[0][0];
  }

  extractFormatPreferences(prefs) {
    const preferences = [];
    
    if (prefs.prefers_visuals > 50) preferences.push('visual_heavy');
    if (prefs.prefers_data > 60) preferences.push('data_driven');
    if (prefs.prefers_bullet_points > 60) preferences.push('structured_bullets');
    if (prefs.prefers_executive_summary > 70) preferences.push('executive_summary_first');
    
    return preferences;
  }

  compileFormatGuidance(searchResults) {
    const guidance = {
      structuralRequirements: [],
      presentationTips: [],
      exampleFormats: []
    };
    
    // Extract from deliverable specifications
    const deliverableSpecs = searchResults.deliverable_specifications || [];
    deliverableSpecs.forEach(spec => {
      const metadata = spec.metadata || {};
      
      if (metadata.format_requirements) {
        guidance.structuralRequirements.push(metadata.format_requirements);
      }
      
      if (metadata.success_criteria) {
        guidance.presentationTips.push(...metadata.success_criteria);
      }
    });
    
    // Extract from stakeholder preferences
    const stakeholderInsights = this.extractStakeholderInsights(
      searchResults.stakeholder_intelligence || []
    );
    
    if (stakeholderInsights.communication.recommendations) {
      guidance.presentationTips.push(
        ...stakeholderInsights.communication.recommendations
      );
    }
    
    return guidance;
  }

  extractCurrentRequirements(searchResults) {
    const requirements = {
      functional: [],
      format: [],
      content: [],
      approval: []
    };
    
    // Extract from deliverable specifications
    const deliverableSpecs = searchResults.deliverable_specifications || [];
    deliverableSpecs.forEach(spec => {
      const metadata = spec.metadata || {};
      
      if (metadata.requirements_specified) {
        requirements.functional.push(...metadata.requirements_specified);
      }
      
      if (metadata.format_requirements) {
        requirements.format.push(metadata.format_requirements);
      }
      
      if (metadata.approval_process) {
        requirements.approval.push(metadata.approval_process);
      }
    });
    
    // Extract from decisions
    const decisions = searchResults.decision_context || [];
    decisions.forEach(decision => {
      const content = decision.content || '';
      // Extract requirements from decision content
      if (content.includes('must include') || content.includes('required')) {
        requirements.content.push(content);
      }
    });
    
    return requirements;
  }

  identifySuccessPatterns(searchResults) {
    const patterns = {
      approaches: [],
      avoidPitfalls: [],
      bestPractices: []
    };
    
    // Extract from implementation insights
    const insights = searchResults.implementation_insights || [];
    insights.forEach(insight => {
      const metadata = insight.metadata || {};
      const content = insight.content || '';
      
      if (metadata.success_pattern) {
        patterns.bestPractices.push({
          pattern: content,
          context: metadata.context || 'General'
        });
      }
      
      if (metadata.lesson_type === 'success') {
        patterns.approaches.push(content);
      }
      
      if (metadata.lesson_type === 'failure') {
        patterns.avoidPitfalls.push(content);
      }
    });
    
    return patterns;
  }

  analyzeRiskFactors(searchResults) {
    const risks = {
      identified: [],
      byCategory: {},
      mitigationStrategies: []
    };
    
    // Extract from risk context
    const riskResults = searchResults.risk_context || [];
    riskResults.forEach(risk => {
      const metadata = risk.metadata || {};
      
      const riskItem = {
        description: metadata.risk_description || risk.content,
        category: metadata.risk_category || 'general',
        severity: metadata.risk_severity || 'medium',
        probability: metadata.risk_probability || 'possible',
        mitigation: metadata.mitigation_strategy
      };
      
      risks.identified.push(riskItem);
      
      // Categorize
      if (!risks.byCategory[riskItem.category]) {
        risks.byCategory[riskItem.category] = [];
      }
      risks.byCategory[riskItem.category].push(riskItem);
      
      // Collect mitigation strategies
      if (riskItem.mitigation) {
        risks.mitigationStrategies.push({
          risk: riskItem.description,
          strategy: riskItem.mitigation
        });
      }
    });
    
    return risks;
  }

  extractDependencies(searchResults) {
    const dependencies = {
      internal: [],
      external: [],
      timeline: [],
      resource: []
    };
    
    // Extract from action items
    const actionItems = searchResults.action_context || [];
    actionItems.forEach(item => {
      const metadata = item.metadata || {};
      
      if (metadata.dependencies && metadata.dependencies.length > 0) {
        metadata.dependencies.forEach(dep => {
          dependencies.internal.push({
            item: metadata.description,
            dependsOn: dep,
            dueDate: metadata.due_date
          });
        });
      }
    });
    
    // Extract from cross-project context
    const crossProject = searchResults.cross_project_context || [];
    crossProject.forEach(item => {
      const metadata = item.metadata || {};
      
      if (metadata.dependencies) {
        dependencies.external.push(...metadata.dependencies);
      }
      
      if (metadata.shared_resources) {
        dependencies.resource.push(...metadata.shared_resources);
      }
    });
    
    return dependencies;
  }

  buildRequirementTimeline(searchResults) {
    const timeline = {
      milestones: [],
      criticalDates: [],
      dependencies: []
    };
    
    // Extract from action items
    const actionItems = searchResults.action_context || [];
    actionItems.forEach(item => {
      const metadata = item.metadata || {};
      
      if (metadata.due_date) {
        timeline.criticalDates.push({
          date: metadata.due_date,
          description: metadata.description,
          owner: metadata.owner,
          priority: metadata.priority
        });
      }
    });
    
    // Sort by date
    timeline.criticalDates.sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
    
    // Extract milestones from deliverables
    const deliverables = searchResults.deliverable_specifications || [];
    deliverables.forEach(deliverable => {
      const metadata = deliverable.metadata || {};
      
      if (metadata.deadline_mentioned) {
        timeline.milestones.push({
          date: metadata.deadline_mentioned,
          deliverable: metadata.deliverable_name,
          type: metadata.deliverable_type
        });
      }
    });
    
    return timeline;
  }

  calculateContextConfidence(searchResults, deliverableRequest) {
    // Weight different context types by importance
    const weights = {
      stakeholder_intelligence: 0.25,
      deliverable_specifications: 0.30,
      decision_context: 0.15,
      implementation_insights: 0.10,
      cross_project_context: 0.05,
      action_context: 0.05,
      risk_context: 0.05,
      strategic_context: 0.05
    };
    
    let totalScore = 0;
    let totalWeight = 0;
    
    Object.entries(weights).forEach(([category, weight]) => {
      const results = searchResults[category] || [];
      // Score based on having at least one result, with diminishing returns.
      // Max score for a category is achieved with 5+ results.
      const categoryScore = Math.min(results.length / 5, 1); 
      
      totalScore += categoryScore * weight;
      totalWeight += weight;
    });
    
    const confidenceScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
    
    // Determine confidence level
    let level = 'Very Low';
    if (confidenceScore >= 80) level = 'Very High';
    else if (confidenceScore >= 65) level = 'High';
    else if (confidenceScore >= 45) level = 'Medium';
    else if (confidenceScore >= 25) level = 'Low';
    
    // Identify missing critical context
    const missingCritical = [];
    if (!searchResults.stakeholder_intelligence?.length) {
      missingCritical.push('No stakeholder intelligence available. Audience preferences are unknown.');
    }
    if (!searchResults.deliverable_specifications?.length) {
      missingCritical.push('No deliverable specifications found. Format and content requirements are unclear.');
    }
     if (!searchResults.decision_context?.length) {
      missingCritical.push('No decision context found. Key decisions leading to this deliverable are missing.');
    }
    
    return {
      score: Math.round(confidenceScore),
      level,
      breakdown: this.calculateBreakdown(searchResults, weights),
      missingCritical,
      recommendation: this.generateConfidenceRecommendation(confidenceScore, missingCritical)
    };
  }

  calculateBreakdown(searchResults, weights) {
    const breakdown = {};
    
    Object.entries(weights).forEach(([category, weight]) => {
      const results = searchResults[category] || [];
      breakdown[category] = {
        weight: weight * 100,
        resultCount: results.length,
        coverage: Math.min((results.length / 5) * 100, 100)
      };
    });
    
    return breakdown;
  }

  generateConfidenceRecommendation(score, missingCritical) {
    if (score >= 80) {
      return 'Excellent context available. All critical areas are covered. Proceed with high confidence.';
    } else if (score >= 65) {
      return 'Good context foundation. Most areas are covered, but consider targeted searches to fill minor gaps.';
    } else if (score >= 45) {
      return `Moderate context. Key information is available, but critical gaps exist. ${missingCritical.join(' ')} Recommend stakeholder interviews to fill gaps.`;
    } else {
      return `Limited context available. Significant gaps in critical areas. ${missingCritical.join(' ')} Proceed with caution and prioritize discovery sessions.`;
    }
  }

  countTotalResults(searchResults) {
    return Object.values(searchResults).reduce((total, results) => {
      return total + (Array.isArray(results) ? results.length : 0);
    }, 0);
  }

  identifyStrongestAreas(searchResults) {
    const areas = [];
    
    Object.entries(searchResults).forEach(([category, results]) => {
      if (results.length >= 5) {
        areas.push({
          category,
          strength: results.length
        });
      }
    });
    
    return areas.sort((a, b) => b.strength - a.strength).slice(0, 3);
  }

  identifyGaps(searchResults) {
    const gaps = [];
    
    const expectedCategories = [
      'stakeholder_intelligence',
      'deliverable_specifications',
      'decision_context',
      'implementation_insights'
    ];
    
    expectedCategories.forEach(category => {
      const results = searchResults[category] || [];
      if (results.length < 3) {
        gaps.push({
          category,
          currentCount: results.length,
          recommendation: `Need more ${category.replace('_', ' ')} data`
        });
      }
    });
    
    return gaps;
  }
}

module.exports = ContextAssembler;
