const neo4jConnection = require('../utils/database');
const { validateEntity } = require('../utils/validation');
const { v4: uuidv4 } = require('uuid');

class BaseModel {
  constructor(label) {
    this.label = label;
    this.db = neo4jConnection;
  }

  // ===================================================================
  // UTILITY METHODS
  // ===================================================================

  generateId(prefix) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 5);
    return `${prefix}${timestamp}${random}`.toUpperCase();
  }

  addTemporalProperties(data) {
    const now = new Date().toISOString();
    return {
      ...data,
      created_at: data.created_at || now,
      updated_at: now,
      valid_from: data.valid_from || now,
      valid_to: data.valid_to || null,
      is_current: data.is_current !== undefined ? data.is_current : true
    };
  }

  buildWhereClause(filters = {}) {
    const conditions = [];
    const parameters = {};

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          conditions.push(`n.${key} IN $${key}`);
          parameters[key] = value;
        } else if (typeof value === 'string' && value.includes('*')) {
          conditions.push(`n.${key} =~ $${key}`);
          parameters[key] = value.replace(/\*/g, '.*');
        } else {
          conditions.push(`n.${key} = $${key}`);
          parameters[key] = value;
        }
      }
    });

    return {
      whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      parameters
    };
  }

  buildOrderClause(sortBy = 'created_at', sortOrder = 'desc') {
    const allowedSortFields = [
      'created_at', 'updated_at', 'date', 'timestamp', 'due_date',
      'title', 'description', 'status', 'priority', 'severity'
    ];
    
    const field = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const order = ['asc', 'desc'].includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';
    
    return `ORDER BY n.${field} ${order}`;
  }

  buildPaginationClause(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    return `SKIP ${skip} LIMIT ${limit}`;
  }

  // ===================================================================
  // CRUD OPERATIONS
  // ===================================================================

  async create(data, entityType) {
    try {
      // Validate data
      const validatedData = validateEntity(entityType, data);
      
      // Add temporal properties
      const entityData = this.addTemporalProperties(validatedData);

      // Generate ID if not provided
      if (!entityData[`${entityType}_id`]) {
        const idPrefix = entityType.toUpperCase().substring(0, 3);
        entityData[`${entityType}_id`] = this.generateId(idPrefix);
      }

      const cypher = `
        CREATE (n:${this.label} $properties)
        RETURN n
      `;

      const result = await this.db.executeWriteQuery(cypher, { properties: entityData });
      
      if (result.records.length === 0) {
        throw new Error(`Failed to create ${entityType}`);
      }

      return result.records[0].get('n').properties;
    } catch (error) {
      throw new Error(`Create ${entityType} failed: ${error.message}`);
    }
  }

  async findById(id, idField) {
    try {
      const cypher = `
        MATCH (n:${this.label} {${idField}: $id})
        WHERE n.is_current = true
        RETURN n
      `;

      const result = await this.db.executeReadQuery(cypher, { id });
      
      if (result.records.length === 0) {
        return null;
      }

      return result.records[0].get('n').properties;
    } catch (error) {
      throw new Error(`Find by ID failed: ${error.message}`);
    }
  }

  async findAll(filters = {}, options = {}) {
    try {
      const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc' } = options;
      
      // Add is_current filter by default
      const allFilters = { is_current: true, ...filters };
      
      const { whereClause, parameters } = this.buildWhereClause(allFilters);
      const orderClause = this.buildOrderClause(sortBy, sortOrder);
      const paginationClause = this.buildPaginationClause(page, limit);

      const cypher = `
        MATCH (n:${this.label})
        ${whereClause}
        RETURN n
        ${orderClause}
        ${paginationClause}
      `;

      const countCypher = `
        MATCH (n:${this.label})
        ${whereClause}
        RETURN count(n) as total
      `;

      const [result, countResult] = await Promise.all([
        this.db.executeReadQuery(cypher, parameters),
        this.db.executeReadQuery(countCypher, parameters)
      ]);

      const entities = result.records.map(record => record.get('n').properties);
      const total = countResult.records[0].get('total').toNumber();

      return {
        data: entities,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Find all failed: ${error.message}`);
    }
  }

  async update(id, data, idField, entityType) {
    try {
      // Validate update data
      const validatedData = validateEntity(entityType, { ...data, [idField]: id });
      
      // Remove ID from update data and add updated timestamp
      const { [idField]: removedId, ...updateData } = validatedData;
      updateData.updated_at = new Date().toISOString();

      const setClause = Object.keys(updateData)
        .map(key => `n.${key} = $${key}`)
        .join(', ');

      const cypher = `
        MATCH (n:${this.label} {${idField}: $id})
        WHERE n.is_current = true
        SET ${setClause}
        RETURN n
      `;

      const parameters = { id, ...updateData };
      const result = await this.db.executeWriteQuery(cypher, parameters);

      if (result.records.length === 0) {
        throw new Error(`${entityType} not found or not current`);
      }

      return result.records[0].get('n').properties;
    } catch (error) {
      throw new Error(`Update ${entityType} failed: ${error.message}`);
    }
  }

  async delete(id, idField, softDelete = true) {
    try {
      if (softDelete) {
        // Soft delete - mark as not current
        const cypher = `
          MATCH (n:${this.label} {${idField}: $id})
          WHERE n.is_current = true
          SET n.is_current = false, n.valid_to = $timestamp, n.updated_at = $timestamp
          RETURN n
        `;

        const timestamp = new Date().toISOString();
        const result = await this.db.executeWriteQuery(cypher, { id, timestamp });

        if (result.records.length === 0) {
          throw new Error('Entity not found or already deleted');
        }

        return { deleted: true, softDelete: true };
      } else {
        // Hard delete - remove from database
        const cypher = `
          MATCH (n:${this.label} {${idField}: $id})
          DETACH DELETE n
          RETURN count(n) as deletedCount
        `;

        const result = await this.db.executeWriteQuery(cypher, { id });
        const deletedCount = result.records[0].get('deletedCount').toNumber();

        if (deletedCount === 0) {
          throw new Error('Entity not found');
        }

        return { deleted: true, softDelete: false };
      }
    } catch (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  // ===================================================================
  // RELATIONSHIP OPERATIONS  
  // ===================================================================

  async createRelationship(fromId, toId, relationshipType, properties = {}, fromIdField, toIdField, fromLabel, toLabel) {
    try {
      const cypher = `
        MATCH (from:${fromLabel} {${fromIdField}: $fromId})
        MATCH (to:${toLabel} {${toIdField}: $toId})
        WHERE from.is_current = true AND to.is_current = true
        CREATE (from)-[r:${relationshipType} $properties]->(to)
        RETURN r, from, to
      `;

      const relationshipData = {
        created_at: new Date().toISOString(),
        ...properties
      };

      const result = await this.db.executeWriteQuery(cypher, {
        fromId,
        toId,
        properties: relationshipData
      });

      if (result.records.length === 0) {
        throw new Error('Failed to create relationship - entities not found or not current');
      }

      return {
        relationship: result.records[0].get('r').properties,
        from: result.records[0].get('from').properties,
        to: result.records[0].get('to').properties
      };
    } catch (error) {
      throw new Error(`Create relationship failed: ${error.message}`);
    }
  }

  async getRelationships(id, idField, direction = 'both', relationshipTypes = []) {
    try {
      let directionClause = '';
      if (direction === 'outgoing') {
        directionClause = '-[r]->';
      } else if (direction === 'incoming') {
        directionClause = '<-[r]-';
      } else {
        directionClause = '-[r]-';
      }

      let relationshipFilter = '';
      if (relationshipTypes.length > 0) {
        relationshipFilter = ':' + relationshipTypes.join('|');
      }

      const cypher = `
        MATCH (n:${this.label} {${idField}: $id})${directionClause}(related)
        WHERE n.is_current = true AND related.is_current = true
        RETURN type(r) as relationshipType, properties(r) as relationshipProperties, 
               labels(related) as relatedLabels, properties(related) as relatedProperties
      `;

      const result = await this.db.executeReadQuery(cypher, { id });

      return result.records.map(record => ({
        relationshipType: record.get('relationshipType'),
        relationshipProperties: record.get('relationshipProperties'),
        relatedEntity: {
          labels: record.get('relatedLabels'),
          properties: record.get('relatedProperties')
        }
      }));
    } catch (error) {
      throw new Error(`Get relationships failed: ${error.message}`);
    }
  }

  // ===================================================================
  // TEMPORAL OPERATIONS
  // ===================================================================

  async getHistory(id, idField) {
    try {
      const cypher = `
        MATCH (n:${this.label} {${idField}: $id})
        RETURN n
        ORDER BY n.valid_from DESC
      `;

      const result = await this.db.executeReadQuery(cypher, { id });

      return result.records.map(record => record.get('n').properties);
    } catch (error) {
      throw new Error(`Get history failed: ${error.message}`);
    }
  }

  async getVersionAtTime(id, idField, timestamp) {
    try {
      const cypher = `
        MATCH (n:${this.label} {${idField}: $id})
        WHERE n.valid_from <= $timestamp 
        AND (n.valid_to IS NULL OR n.valid_to > $timestamp)
        RETURN n
        ORDER BY n.valid_from DESC
        LIMIT 1
      `;

      const result = await this.db.executeReadQuery(cypher, { id, timestamp });

      if (result.records.length === 0) {
        return null;
      }

      return result.records[0].get('n').properties;
    } catch (error) {
      throw new Error(`Get version at time failed: ${error.message}`);
    }
  }

  // ===================================================================
  // SEARCH OPERATIONS
  // ===================================================================

  async search(query, fields = [], fuzzy = false) {
    try {
      if (!query || query.trim().length === 0) {
        return { data: [], pagination: { total: 0 } };
      }

      let searchConditions = [];
      
      if (fields.length === 0) {
        // Search all text fields
        fields = ['title', 'description', 'name'];
      }

      fields.forEach(field => {
        if (fuzzy) {
          searchConditions.push(`toLower(n.${field}) CONTAINS toLower($query)`);
        } else {
          searchConditions.push(`n.${field} =~ $pattern`);
        }
      });

      const whereClause = `WHERE n.is_current = true AND (${searchConditions.join(' OR ')})`;
      
      const cypher = `
        MATCH (n:${this.label})
        ${whereClause}
        RETURN n
        ORDER BY n.updated_at DESC
        LIMIT 50
      `;

      const parameters = fuzzy 
        ? { query } 
        : { pattern: `(?i).*${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*` };

      const result = await this.db.executeReadQuery(cypher, parameters);

      return {
        data: result.records.map(record => record.get('n').properties),
        query,
        searchFields: fields,
        fuzzy
      };
    } catch (error) {
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  // ===================================================================
  // ANALYTICS OPERATIONS
  // ===================================================================

  async getEntityStats() {
    try {
      const cypher = `
        MATCH (n:${this.label})
        WHERE n.is_current = true
        RETURN 
          count(n) as total,
          collect(DISTINCT n.status) as statuses,
          min(n.created_at) as earliest,
          max(n.created_at) as latest
      `;

      const result = await this.db.executeReadQuery(cypher);
      
      if (result.records.length === 0) {
        return { total: 0, statuses: [], earliest: null, latest: null };
      }

      const record = result.records[0];
      return {
        total: record.get('total').toNumber(),
        statuses: record.get('statuses'),
        earliest: record.get('earliest'),
        latest: record.get('latest')
      };
    } catch (error) {
      throw new Error(`Get entity stats failed: ${error.message}`);
    }
  }
}

module.exports = BaseModel;
