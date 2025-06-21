# Graph-Based Enhanced Meeting Intelligence System

## Overview
A sophisticated graph-based system built on Neo4j for comprehensive meeting intelligence, featuring temporal querying, advanced analytics, and enterprise-grade security.

## Architecture

### Core Components
- **Neo4j Graph Database**: Stores entities and relationships with temporal support
- **Express.js API Server**: RESTful APIs with comprehensive validation
- **Authentication Layer**: JWT-based with role-based access control  
- **Analytics Engine**: Graph algorithms and business intelligence
- **ETL Pipeline**: Data ingestion and transformation
- **Monitoring**: Performance metrics and health checks

### Key Features
- **Temporal Querying**: Historical state tracking and time-travel queries
- **Advanced Analytics**: Graph algorithms, impact analysis, risk metrics
- **RBAC Security**: Role-based access with audit logging
- **Performance Optimization**: Comprehensive indexing and caching
- **Real-time Updates**: Live data synchronization
- **Comprehensive Testing**: Unit, integration, and performance tests

## Entity Schema

### Core Entities
- **Meeting**: meeting_id, title, date, type, duration, location, status
- **Decision**: decision_id, description, status, timestamp, rationale, impact_level
- **ActionItem**: action_id, description, status, due_date, priority, estimated_hours
- **Risk**: risk_id, description, severity, probability, mitigation_strategy
- **Deliverable**: deliverable_id, description, type, status, due_date, completion_percentage
- **Stakeholder**: stakeholder_id, name, role, email, department

### Relationships
- Meeting -[HAS_DECISION]-> Decision
- Meeting -[HAS_ACTION_ITEM]-> ActionItem  
- Meeting -[HAS_RISK]-> Risk
- Meeting -[HAS_DELIVERABLE]-> Deliverable
- Decision -[IMPACTS]-> Deliverable
- Decision -[ASSOCIATED_WITH]-> Stakeholder
- ActionItem -[ASSIGNED_TO]-> Stakeholder
- Risk -[MITIGATED_BY]-> ActionItem
- Deliverable -[OWNED_BY]-> Stakeholder

## Quick Start

### Prerequisites
- Node.js 18+
- Neo4j 5.x
- Docker (optional)

### Installation
```bash
# Clone and install dependencies
cd graph-system
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Neo4j credentials

# Initialize database schema
npm run db:setup

# Seed with sample data
npm run db:seed

# Start development server
npm run dev
```

### API Endpoints

#### Core CRUD Operations
- `GET/POST /api/v1/meetings` - Meeting management
- `GET/POST/PUT/DELETE /api/v1/decisions` - Decision management
- `GET/POST/PUT/DELETE /api/v1/action-items` - Action item management
- `GET/POST/PUT/DELETE /api/v1/risks` - Risk management
- `GET/POST/PUT/DELETE /api/v1/deliverables` - Deliverable management
- `GET/POST/PUT/DELETE /api/v1/stakeholders` - Stakeholder management

#### Advanced Analytics
- `GET /api/v1/analytics/impact-analysis` - Decision impact analysis
- `GET /api/v1/analytics/risk-metrics` - Risk assessment metrics
- `GET /api/v1/analytics/stakeholder-influence` - Network analysis
- `GET /api/v1/analytics/deliverable-dependencies` - Dependency mapping

#### Temporal Queries
- `GET /api/v1/temporal/history/{entity}/{id}` - Entity history
- `GET /api/v1/temporal/snapshot/{timestamp}` - Graph state at time
- `GET /api/v1/temporal/changes/{timeframe}` - Change tracking

#### Search and Discovery
- `GET /api/v1/search/graph/{query}` - Complex graph queries
- `GET /api/v1/search/entities` - Entity search with filters
- `GET /api/v1/insights/recommendations` - AI-powered insights

## Configuration

### Environment Variables
```env
# Database Configuration
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_password
NEO4J_DATABASE=neo4j

# Application Configuration  
PORT=3000
NODE_ENV=development
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

## Testing

### Run Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npm test -- tests/unit/meeting.test.js
```

### Test Categories
- **Unit Tests**: Individual component testing
- **Integration Tests**: End-to-end workflow testing  
- **Performance Tests**: Load and response time testing
- **Security Tests**: Authentication and authorization testing

## Development

### Code Quality
```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code (Prettier)
npx prettier --write src/
```

### Database Management
```bash
# Reset and recreate schema
npm run db:setup

# Seed with test data
npm run db:seed

# Run migrations
npm run db:migrate
```

## Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
npm run docker:build
npm run docker:run
```

### Production Deployment
1. Set environment variables for production
2. Ensure Neo4j cluster is configured
3. Configure load balancing and monitoring
4. Set up backup and recovery procedures

## Performance Considerations

### Indexing Strategy
- Primary ID indexes for all entities
- Composite indexes for common query patterns
- Text search indexes for content queries
- Temporal indexes for historical queries

### Query Optimization
- Use parameterized queries to prevent injection
- Implement result caching for complex analytics
- Use LIMIT clauses for large result sets
- Profile queries and optimize based on EXPLAIN plans

### Scaling Recommendations
- Configure Neo4j clustering for high availability
- Implement connection pooling
- Use read replicas for analytics queries
- Monitor memory usage and optimize garbage collection

## Security

### Authentication
- JWT-based token authentication
- Refresh token rotation
- Password hashing with bcrypt
- Account lockout protection

### Authorization
- Role-based access control (RBAC)
- Resource-level permissions
- API endpoint protection
- Row-level security implementation

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection with Helmet.js
- Rate limiting and DDoS protection

## Monitoring and Logging

### Application Metrics
- Response time monitoring
- Error rate tracking
- Memory and CPU usage
- Database connection health

### Business Metrics
- Meeting processing throughput
- Query performance benchmarks
- User activity analytics
- System availability metrics

### Logging Strategy
- Structured logging with Winston
- Error tracking and alerting
- Audit trail for all operations
- Performance profiling logs

## Contributing

### Development Workflow
1. Create feature branch from main
2. Implement changes with tests
3. Run full test suite
4. Update documentation
5. Submit pull request with detailed description

### Code Standards
- Follow ESLint configuration
- Maintain test coverage above 80%
- Document all public APIs
- Use meaningful commit messages

## Support

### Documentation
- API documentation: `/docs/api`
- Architecture guide: `/docs/architecture`
- Deployment guide: `/docs/deployment`
- Troubleshooting: `/docs/troubleshooting`

### Monitoring Dashboards
- Application health: `http://localhost:3000/health`
- Metrics endpoint: `http://localhost:3000/metrics`
- Database status: `http://localhost:3000/db-status`

## License
MIT License - see LICENSE file for details
