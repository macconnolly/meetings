const express = require('express');
const router = express.Router();
const Meeting = require('../models/Meeting');
const { validateQuery } = require('../utils/validation');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

const meeting = new Meeting();

// ===================================================================
// MEETING CRUD OPERATIONS
// ===================================================================

/**
 * @route   GET /api/v1/meetings
 * @desc    Get all meetings with optional filtering and pagination
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { page, limit, sort_by, sort_order, type, status, start_date, end_date } = req.query;
    
    // Validate query parameters
    const pagination = validateQuery('pagination', { page, limit, sort_by, sort_order });
    
    let filters = {};
    if (type) filters.type = type;
    if (status) filters.status = status;
    
    let result;
    if (start_date && end_date) {
      // Date range query
      result = await meeting.getMeetingsByDateRange(start_date, end_date, {
        ...pagination,
        type,
        status
      });
    } else {
      // Standard query with filters
      result = await meeting.findAll(filters, pagination);
    }

    logger.info('Meetings retrieved', {
      requestId: req.id,
      count: result.data?.length || result.length,
      filters,
      pagination
    });

    res.json({
      success: true,
      data: result.data || result,
      pagination: result.pagination,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get meetings failed', { requestId: req.id, error: error.message });
    res.status(400).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route   GET /api/v1/meetings/:id
 * @desc    Get meeting by ID with full details
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { include_details = 'true' } = req.query;

    let result;
    if (include_details === 'true') {
      result = await meeting.getMeetingDetails(id);
    } else {
      result = await meeting.findById(id);
    }

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Meeting not found',
        timestamp: new Date().toISOString()
      });
    }

    logger.info('Meeting retrieved', { requestId: req.id, meetingId: id });

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get meeting failed', { requestId: req.id, error: error.message });
    res.status(400).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route   POST /api/v1/meetings
 * @desc    Create a new meeting
 * @access  Public
 */
router.post('/', async (req, res) => {
  try {
    const meetingData = req.body;
    const result = await meeting.create(meetingData);

    logger.info('Meeting created', { 
      requestId: req.id, 
      meetingId: result.meeting_id,
      title: result.title 
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Meeting created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Create meeting failed', { requestId: req.id, error: error.message });
    res.status(400).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route   PUT /api/v1/meetings/:id
 * @desc    Update meeting by ID
 * @access  Public
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const result = await meeting.update(id, updateData);

    logger.info('Meeting updated', { 
      requestId: req.id, 
      meetingId: id,
      changes: Object.keys(updateData)
    });

    res.json({
      success: true,
      data: result,
      message: 'Meeting updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Update meeting failed', { requestId: req.id, error: error.message });
    res.status(400).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route   DELETE /api/v1/meetings/:id
 * @desc    Delete meeting by ID (soft delete by default)
 * @access  Public
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { hard_delete = 'false' } = req.query;
    
    const result = await meeting.delete(id, hard_delete !== 'true');

    logger.info('Meeting deleted', { 
      requestId: req.id, 
      meetingId: id,
      softDelete: result.softDelete
    });

    res.json({
      success: true,
      data: result,
      message: `Meeting ${result.softDelete ? 'soft' : 'hard'} deleted successfully`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Delete meeting failed', { requestId: req.id, error: error.message });
    res.status(400).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ===================================================================
// MEETING RELATIONSHIP OPERATIONS
// ===================================================================

/**
 * @route   POST /api/v1/meetings/:id/decisions
 * @desc    Add decision to meeting
 * @access  Public
 */
router.post('/:id/decisions', async (req, res) => {
  try {
    const { id } = req.params;
    const { decision_id, ...relationshipProps } = req.body;
    
    const result = await meeting.addDecision(id, decision_id, relationshipProps);

    logger.info('Decision added to meeting', { 
      requestId: req.id, 
      meetingId: id,
      decisionId: decision_id
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Decision added to meeting successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Add decision to meeting failed', { requestId: req.id, error: error.message });
    res.status(400).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route   POST /api/v1/meetings/:id/action-items
 * @desc    Add action item to meeting
 * @access  Public
 */
router.post('/:id/action-items', async (req, res) => {
  try {
    const { id } = req.params;
    const { action_id, ...relationshipProps } = req.body;
    
    const result = await meeting.addActionItem(id, action_id, relationshipProps);

    logger.info('Action item added to meeting', { 
      requestId: req.id, 
      meetingId: id,
      actionId: action_id
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Action item added to meeting successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Add action item to meeting failed', { requestId: req.id, error: error.message });
    res.status(400).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route   POST /api/v1/meetings/:id/risks
 * @desc    Add risk to meeting
 * @access  Public
 */
router.post('/:id/risks', async (req, res) => {
  try {
    const { id } = req.params;
    const { risk_id, ...relationshipProps } = req.body;
    
    const result = await meeting.addRisk(id, risk_id, relationshipProps);

    logger.info('Risk added to meeting', { 
      requestId: req.id, 
      meetingId: id,
      riskId: risk_id
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Risk added to meeting successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Add risk to meeting failed', { requestId: req.id, error: error.message });
    res.status(400).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route   POST /api/v1/meetings/:id/deliverables
 * @desc    Add deliverable to meeting
 * @access  Public
 */
router.post('/:id/deliverables', async (req, res) => {
  try {
    const { id } = req.params;
    const { deliverable_id, ...relationshipProps } = req.body;
    
    const result = await meeting.addDeliverable(id, deliverable_id, relationshipProps);

    logger.info('Deliverable added to meeting', { 
      requestId: req.id, 
      meetingId: id,
      deliverableId: deliverable_id
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Deliverable added to meeting successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Add deliverable to meeting failed', { requestId: req.id, error: error.message });
    res.status(400).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ===================================================================
// MEETING ANALYTICS AND INSIGHTS
// ===================================================================

/**
 * @route   GET /api/v1/meetings/upcoming
 * @desc    Get upcoming meetings
 * @access  Public
 */
router.get('/upcoming/list', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const result = await meeting.getUpcomingMeetings(parseInt(days));

    logger.info('Upcoming meetings retrieved', { 
      requestId: req.id, 
      count: result.length,
      days: parseInt(days)
    });

    res.json({
      success: true,
      data: result,
      meta: { days: parseInt(days) },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get upcoming meetings failed', { requestId: req.id, error: error.message });
    res.status(400).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route   GET /api/v1/meetings/metrics
 * @desc    Get meeting metrics and analytics
 * @access  Public
 */
router.get('/analytics/metrics', async (req, res) => {
  try {
    const { timeframe = 'month' } = req.query;
    const result = await meeting.getMeetingMetrics(timeframe);

    logger.info('Meeting metrics retrieved', { 
      requestId: req.id, 
      timeframe,
      totalMeetings: result.totalMeetings
    });

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get meeting metrics failed', { requestId: req.id, error: error.message });
    res.status(400).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route   GET /api/v1/meetings/:id/effectiveness
 * @desc    Get meeting effectiveness score and recommendations
 * @access  Public
 */
router.get('/:id/effectiveness', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await meeting.getMeetingEffectivenessScore(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Meeting not found',
        timestamp: new Date().toISOString()
      });
    }

    logger.info('Meeting effectiveness score retrieved', { 
      requestId: req.id, 
      meetingId: id,
      score: result.effectivenessScore
    });

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get meeting effectiveness failed', { requestId: req.id, error: error.message });
    res.status(400).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route   GET /api/v1/meetings/stakeholder/:stakeholderId
 * @desc    Get meetings by stakeholder
 * @access  Public
 */
router.get('/stakeholder/:stakeholderId', async (req, res) => {
  try {
    const { stakeholderId } = req.params;
    const result = await meeting.getMeetingsByStakeholder(stakeholderId);

    logger.info('Meetings by stakeholder retrieved', { 
      requestId: req.id, 
      stakeholderId,
      count: result.length
    });

    res.json({
      success: true,
      data: result,
      meta: { stakeholderId },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Get meetings by stakeholder failed', { requestId: req.id, error: error.message });
    res.status(400).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
