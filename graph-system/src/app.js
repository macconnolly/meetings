require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const winston = require('winston');

// Import database connection
const neo4jConnection = require('./utils/database');

// Import routes
const meetingRoutes = require('./controllers/meetingController');
const decisionRoutes = require('./controllers/decisionController');
const actionItemRoutes = require('./controllers/actionItemController');
const riskRoutes = require('./controllers/riskController');
const deliverableRoutes = require('./controllers/deliverableController');
const stakeholderRoutes = require('./controllers/stakeholderController');
const analyticsRoutes = require('./controllers/analyticsController');
const temporalRoutes = require('./controllers/temporalController');
const searchRoutes = require('./controllers/searchController');
const healthRoutes = require('./controllers/healthController');

// ===================================================================
// APPLICATION SETUP
// ===================================================================

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'meeting-intelligence-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// ===================================================================
// MIDDLEWARE CONFIGURATION
// ===================================================================

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:3001').split(',');
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    const msg = `CORS policy: Origin ${origin} is not allowed.`;
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/v1/health';
  }
});

app.use(limiter);

// Compression and parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// Request ID middleware for tracing
app.use((req, res, next) => {
  req.id = require('uuid').v4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  logger.info('Request received', {
    requestId: req.id,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  next();
});

// ===================================================================
// API ROUTES
// ===================================================================

// Health check routes (no API prefix for load balancers)
app.use('/health', healthRoutes);
app.use('/status', healthRoutes);

// API v1 routes
const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/meetings`, meetingRoutes);
app.use(`${API_PREFIX}/decisions`, decisionRoutes);
app.use(`${API_PREFIX}/action-items`, actionItemRoutes);
app.use(`${API_PREFIX}/risks`, riskRoutes);
app.use(`${API_PREFIX}/deliverables`, deliverableRoutes);
app.use(`${API_PREFIX}/stakeholders`, stakeholderRoutes);
app.use(`${API_PREFIX}/analytics`, analyticsRoutes);
app.use(`${API_PREFIX}/temporal`, temporalRoutes);
app.use(`${API_PREFIX}/search`, searchRoutes);
app.use(`${API_PREFIX}/health`, healthRoutes);

// API documentation route
app.get(`${API_PREFIX}`, (req, res) => {
  res.json({
    name: 'Enhanced Meeting Intelligence API',
    version: '1.0.0',
    description: 'Graph-based meeting intelligence system with temporal querying and advanced analytics',
    endpoints: {
      meetings: `${API_PREFIX}/meetings`,
      decisions: `${API_PREFIX}/decisions`,
      actionItems: `${API_PREFIX}/action-items`,
      risks: `${API_PREFIX}/risks`,
      deliverables: `${API_PREFIX}/deliverables`,
      stakeholders: `${API_PREFIX}/stakeholders`,
      analytics: `${API_PREFIX}/analytics`,
      temporal: `${API_PREFIX}/temporal`,
      search: `${API_PREFIX}/search`,
      health: `${API_PREFIX}/health`
    },
    documentation: '/docs',
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Enhanced Meeting Intelligence API',
    version: '1.0.0',
    status: 'operational',
    api: `${API_PREFIX}`,
    health: '/health',
    timestamp: new Date().toISOString()
  });
});

// ===================================================================
// ERROR HANDLING MIDDLEWARE
// ===================================================================

// 404 handler
app.use('*', (req, res) => {
  logger.warn('Route not found', {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl
  });
  
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    suggestion: `Try ${API_PREFIX} for available endpoints`,
    timestamp: new Date().toISOString(),
    requestId: req.id
  });
});

// Global error handler
app.use((error, req, res, next) => {
  logger.error('Unhandled error', {
    requestId: req.id,
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url
  });

  // Default error response
  let statusCode = 500;
  let message = 'Internal server error';
  
  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = error.message;
  } else if (error.name === 'Neo4jError') {
    statusCode = 500;
    message = 'Database operation failed';
  } else if (error.message.includes('not found')) {
    statusCode = 404;
    message = error.message;
  } else if (error.message.includes('unauthorized') || error.message.includes('forbidden')) {
    statusCode = 403;
    message = 'Access denied';
  }

  res.status(statusCode).json({
    error: message,
    ...(NODE_ENV === 'development' && { details: error.message, stack: error.stack }),
    timestamp: new Date().toISOString(),
    requestId: req.id
  });
});

// ===================================================================
// GRACEFUL SHUTDOWN HANDLING
// ===================================================================

const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  // Close database connections
  try {
    await neo4jConnection.disconnect();
    logger.info('Database connections closed');
  } catch (error) {
    logger.error('Error closing database connections:', error);
  }
  
  // Close HTTP server
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
  
  // Force close after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ===================================================================
// APPLICATION STARTUP
// ===================================================================

const server = app.listen(PORT, async () => {
  try {
    // Connect to Neo4j database
    await neo4jConnection.connect();
    
    logger.info('Enhanced Meeting Intelligence API started', {
      port: PORT,
      environment: NODE_ENV,
      nodeVersion: process.version,
      timestamp: new Date().toISOString()
    });
    
    // Log available endpoints
    logger.info('Available endpoints', {
      api: `http://localhost:${PORT}${API_PREFIX}`,
      health: `http://localhost:${PORT}/health`,
      docs: `http://localhost:${PORT}/docs`
    });
    
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
});

module.exports = app;
