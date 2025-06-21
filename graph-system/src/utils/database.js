const neo4j = require('neo4j-driver');
const winston = require('winston');

class Neo4jConnection {
  constructor() {
    this.driver = null;
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/database.log' })
      ]
    });
  }

  async connect() {
    try {
      const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
      const username = process.env.NEO4J_USERNAME || 'neo4j';
      const password = process.env.NEO4J_PASSWORD || 'password';
      const database = process.env.NEO4J_DATABASE || 'neo4j';

      this.driver = neo4j.driver(uri, neo4j.auth.basic(username, password), {
        maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 2 * 60 * 1000, // 2 minutes
        disableLosslessIntegers: true
      });

      // Verify connectivity
      await this.driver.verifyConnectivity();
      this.logger.info(`Connected to Neo4j database: ${database}`);
      
      return this.driver;
    } catch (error) {
      this.logger.error('Failed to connect to Neo4j:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.driver) {
      await this.driver.close();
      this.logger.info('Disconnected from Neo4j database');
    }
  }

  getDriver() {
    if (!this.driver) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.driver;
  }

  async executeQuery(cypher, parameters = {}, options = {}) {
    const session = this.driver.session({
      database: options.database || process.env.NEO4J_DATABASE || 'neo4j',
      defaultAccessMode: options.accessMode || neo4j.session.READ
    });

    try {
      const startTime = Date.now();
      const result = await session.run(cypher, parameters);
      const duration = Date.now() - startTime;

      this.logger.debug('Query executed', {
        cypher: cypher.substring(0, 100) + (cypher.length > 100 ? '...' : ''),
        parameters: Object.keys(parameters),
        duration,
        recordCount: result.records.length
      });

      return result;
    } catch (error) {
      this.logger.error('Query execution failed', {
        cypher,
        parameters,
        error: error.message
      });
      throw error;
    } finally {
      await session.close();
    }
  }

  async executeWriteQuery(cypher, parameters = {}) {
    return this.executeQuery(cypher, parameters, { accessMode: neo4j.session.WRITE });
  }

  async executeReadQuery(cypher, parameters = {}) {
    return this.executeQuery(cypher, parameters, { accessMode: neo4j.session.READ });
  }

  async executeTransaction(operations) {
    const session = this.driver.session({
      database: process.env.NEO4J_DATABASE || 'neo4j',
      defaultAccessMode: neo4j.session.WRITE
    });

    const transaction = session.beginTransaction();

    try {
      const results = [];
      for (const operation of operations) {
        const result = await transaction.run(operation.cypher, operation.parameters || {});
        results.push(result);
      }

      await transaction.commit();
      this.logger.info(`Transaction completed successfully with ${operations.length} operations`);
      return results;
    } catch (error) {
      await transaction.rollback();
      this.logger.error('Transaction failed and rolled back', { error: error.message });
      throw error;
    } finally {
      await session.close();
    }
  }

  async healthCheck() {
    try {
      const result = await this.executeReadQuery('RETURN 1 as health');
      return result.records.length === 1;
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return false;
    }
  }

  async getDatabaseInfo() {
    try {
      const nodeCountResult = await this.executeReadQuery('MATCH (n) RETURN count(n) as nodeCount');
      const relationshipCountResult = await this.executeReadQuery('MATCH ()-[r]->() RETURN count(r) as relCount');
      
      return {
        nodeCount: nodeCountResult.records[0].get('nodeCount'),
        relationshipCount: relationshipCountResult.records[0].get('relCount'),
        connected: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to get database info:', error);
      return {
        nodeCount: 0,
        relationshipCount: 0,
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Singleton instance
const neo4jConnection = new Neo4jConnection();

module.exports = neo4jConnection;
