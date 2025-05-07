# QA Role: Phase 4 Test Specifications

This document contains detailed test specifications for Phase 4 components of the UOR Content Management Client, focusing on Content Repository API, Advanced Query and Search, Content Validation and Integrity, Content Import/Export, and CLI Interface.

## Content Repository API Tests (Issue #12)

### Unit Tests

#### ContentRepository Class Tests

```typescript
describe('ContentRepository', () => {
  let contentRepository: ContentRepository;
  let conceptManager: ConceptManager;
  let resourceManager: ResourceManager;
  let topicManager: TopicManager;
  let predicateManager: PredicateManager;
  let relationshipManager: RelationshipManager;
  let eventEmitter: EventEmitter;
  let fileSystem: FileSystemService;

  beforeEach(() => {
    // Mock dependencies
    conceptManager = mock<ConceptManager>();
    resourceManager = mock<ResourceManager>();
    topicManager = mock<TopicManager>();
    predicateManager = mock<PredicateManager>();
    relationshipManager = mock<RelationshipManager>();
    eventEmitter = mock<EventEmitter>();
    fileSystem = mock<FileSystemService>();

    // Create instance with mocked dependencies
    contentRepository = new ContentRepository(
      conceptManager,
      resourceManager,
      topicManager,
      predicateManager,
      relationshipManager,
      eventEmitter
    );
  });

  describe('create', () => {
    it('should create a concept through the concept manager', async () => {
      // Arrange
      const conceptData = { name: 'Test Concept', description: 'Test Description' };
      const createdConcept = { 
        id: 'UOR-C-001-test-concept', 
        name: 'Test Concept', 
        description: 'Test Description',
        dateCreated: new Date().toISOString(),
        dateModified: new Date().toISOString(),
        version: 'v1'
      };
      when(conceptManager.create).calledWith(conceptData).mockResolvedValue(createdConcept);
      when(eventEmitter.emit).calledWith(any(), any()).mockReturnValue(true);

      // Act
      const result = await contentRepository.create(ContentTypeEnum.CONCEPT, conceptData);

      // Assert
      expect(result).toEqual(createdConcept);
      expect(conceptManager.create).toHaveBeenCalledWith(conceptData);
      expect(eventEmitter.emit).toHaveBeenCalledWith('content.created', {
        type: ContentTypeEnum.CONCEPT,
        id: createdConcept.id,
        content: createdConcept
      });
    });

    it('should throw an error for invalid content type', async () => {
      // Arrange
      const contentData = { name: 'Test Content', description: 'Test Description' };
      const invalidType = 'invalid' as ContentTypeEnum;

      // Act & Assert
      await expect(contentRepository.create(invalidType, contentData))
        .rejects.toThrow('Invalid content type: invalid');
    });
  });

  describe('read', () => {
    it('should read a concept through the concept manager', async () => {
      // Arrange
      const conceptId = 'UOR-C-001-test-concept';
      const concept = { 
        id: conceptId, 
        name: 'Test Concept', 
        description: 'Test Description',
        dateCreated: new Date().toISOString(),
        dateModified: new Date().toISOString(),
        version: 'v1'
      };
      when(conceptManager.read).calledWith(conceptId).mockResolvedValue(concept);

      // Act
      const result = await contentRepository.read(ContentTypeEnum.CONCEPT, conceptId);

      // Assert
      expect(result).toEqual(concept);
      expect(conceptManager.read).toHaveBeenCalledWith(conceptId);
    });

    it('should throw an error for invalid content type', async () => {
      // Arrange
      const contentId = 'UOR-X-001-test-content';
      const invalidType = 'invalid' as ContentTypeEnum;

      // Act & Assert
      await expect(contentRepository.read(invalidType, contentId))
        .rejects.toThrow('Invalid content type: invalid');
    });
  });

  describe('update', () => {
    it('should update a concept through the concept manager', async () => {
      // Arrange
      const conceptId = 'UOR-C-001-test-concept';
      const updateData = { description: 'Updated Description' };
      const version = 'v1';
      const updatedConcept = { 
        id: conceptId, 
        name: 'Test Concept', 
        description: 'Updated Description',
        dateCreated: new Date().toISOString(),
        dateModified: new Date().toISOString(),
        version: 'v2'
      };
      when(conceptManager.update).calledWith(conceptId, updateData, version).mockResolvedValue(updatedConcept);
      when(eventEmitter.emit).calledWith(any(), any()).mockReturnValue(true);

      // Act
      const result = await contentRepository.update(ContentTypeEnum.CONCEPT, conceptId, updateData, version);

      // Assert
      expect(result).toEqual(updatedConcept);
      expect(conceptManager.update).toHaveBeenCalledWith(conceptId, updateData, version);
      expect(eventEmitter.emit).toHaveBeenCalledWith('content.updated', {
        type: ContentTypeEnum.CONCEPT,
        id: conceptId,
        content: updatedConcept,
        updates: updateData
      });
    });

    it('should throw an error for invalid content type', async () => {
      // Arrange
      const contentId = 'UOR-X-001-test-content';
      const updateData = { description: 'Updated Description' };
      const invalidType = 'invalid' as ContentTypeEnum;

      // Act & Assert
      await expect(contentRepository.update(invalidType, contentId, updateData))
        .rejects.toThrow('Invalid content type: invalid');
    });
  });

  describe('delete', () => {
    it('should delete a concept through the concept manager', async () => {
      // Arrange
      const conceptId = 'UOR-C-001-test-concept';
      when(conceptManager.delete).calledWith(conceptId).mockResolvedValue(true);
      when(eventEmitter.emit).calledWith(any(), any()).mockReturnValue(true);

      // Act
      const result = await contentRepository.delete(ContentTypeEnum.CONCEPT, conceptId);

      // Assert
      expect(result).toBe(true);
      expect(conceptManager.delete).toHaveBeenCalledWith(conceptId);
      expect(eventEmitter.emit).toHaveBeenCalledWith('content.deleted', {
        type: ContentTypeEnum.CONCEPT,
        id: conceptId
      });
    });

    it('should throw an error for invalid content type', async () => {
      // Arrange
      const contentId = 'UOR-X-001-test-content';
      const invalidType = 'invalid' as ContentTypeEnum;

      // Act & Assert
      await expect(contentRepository.delete(invalidType, contentId))
        .rejects.toThrow('Invalid content type: invalid');
    });
  });

  describe('list', () => {
    it('should list concepts through the concept manager', async () => {
      // Arrange
      const filter = { name: 'Test' };
      const concepts = [
        { 
          id: 'UOR-C-001-test-concept-1', 
          name: 'Test Concept 1', 
          description: 'Test Description 1',
          dateCreated: new Date().toISOString(),
          dateModified: new Date().toISOString(),
          version: 'v1'
        },
        { 
          id: 'UOR-C-002-test-concept-2', 
          name: 'Test Concept 2', 
          description: 'Test Description 2',
          dateCreated: new Date().toISOString(),
          dateModified: new Date().toISOString(),
          version: 'v1'
        }
      ];
      when(conceptManager.list).calledWith(filter).mockResolvedValue(concepts);

      // Act
      const result = await contentRepository.list(ContentTypeEnum.CONCEPT, filter);

      // Assert
      expect(result).toEqual(concepts);
      expect(conceptManager.list).toHaveBeenCalledWith(filter);
    });

    it('should throw an error for invalid content type', async () => {
      // Arrange
      const filter = { name: 'Test' };
      const invalidType = 'invalid' as ContentTypeEnum;

      // Act & Assert
      await expect(contentRepository.list(invalidType, filter))
        .rejects.toThrow('Invalid content type: invalid');
    });
  });

  describe('Transaction Management', () => {
    it('should begin a transaction', async () => {
      // Act
      const transaction = await contentRepository.beginTransaction();

      // Assert
      expect(transaction).toBeDefined();
      expect(transaction.id).toBeDefined();
      expect(transaction.operations).toEqual([]);
      expect(transaction.status).toBe('pending');
    });

    it('should commit a transaction', async () => {
      // Arrange
      const transaction = await contentRepository.beginTransaction();
      const conceptData = { name: 'Test Concept', description: 'Test Description' };
      const createdConcept = { 
        id: 'UOR-C-001-test-concept', 
        name: 'Test Concept', 
        description: 'Test Description',
        dateCreated: new Date().toISOString(),
        dateModified: new Date().toISOString(),
        version: 'v1'
      };
      
      // Mock the create operation to add to transaction
      when(conceptManager.create).calledWith(conceptData).mockResolvedValue(createdConcept);
      
      // Add operation to transaction
      transaction.operations.push({
        type: 'create',
        contentType: ContentTypeEnum.CONCEPT,
        data: conceptData,
        result: createdConcept
      });

      // Act
      await contentRepository.commitTransaction(transaction);

      // Assert
      expect(transaction.status).toBe('committed');
      expect(eventEmitter.emit).toHaveBeenCalledWith('transaction.committed', {
        transactionId: transaction.id,
        operations: transaction.operations
      });
    });

    it('should rollback a transaction', async () => {
      // Arrange
      const transaction = await contentRepository.beginTransaction();
      const conceptData = { name: 'Test Concept', description: 'Test Description' };
      
      // Add operation to transaction
      transaction.operations.push({
        type: 'create',
        contentType: ContentTypeEnum.CONCEPT,
        data: conceptData
      });

      // Act
      await contentRepository.rollbackTransaction(transaction);

      // Assert
      expect(transaction.status).toBe('rolled_back');
      expect(eventEmitter.emit).toHaveBeenCalledWith('transaction.rolledBack', {
        transactionId: transaction.id
      });
    });
  });

  describe('Repository Statistics', () => {
    it('should get repository statistics', async () => {
      // Arrange
      const conceptCount = 10;
      const resourceCount = 20;
      const topicCount = 15;
      const predicateCount = 30;
      
      when(conceptManager.list).calledWith().mockResolvedValue(Array(conceptCount).fill({}));
      when(resourceManager.list).calledWith().mockResolvedValue(Array(resourceCount).fill({}));
      when(topicManager.list).calledWith().mockResolvedValue(Array(topicCount).fill({}));
      when(predicateManager.list).calledWith().mockResolvedValue(Array(predicateCount).fill({}));

      // Act
      const stats = await contentRepository.getStatistics();

      // Assert
      expect(stats).toEqual({
        counts: {
          concept: conceptCount,
          resource: resourceCount,
          topic: topicCount,
          predicate: predicateCount,
          total: conceptCount + resourceCount + topicCount + predicateCount
        },
        lastModified: expect.any(String),
        size: expect.any(Number)
      });
    });
  });

  describe('Repository Health', () => {
    it('should check repository health', async () => {
      // Arrange
      when(fileSystem.checkAccess).calledWith(any()).mockResolvedValue(true);
      
      // Act
      const health = await contentRepository.checkHealth();

      // Assert
      expect(health).toEqual({
        status: 'healthy',
        components: {
          fileSystem: { status: 'healthy' },
          conceptManager: { status: 'healthy' },
          resourceManager: { status: 'healthy' },
          topicManager: { status: 'healthy' },
          predicateManager: { status: 'healthy' },
          relationshipManager: { status: 'healthy' }
        },
        timestamp: expect.any(String)
      });
    });

    it('should report unhealthy status when a component fails', async () => {
      // Arrange
      when(fileSystem.checkAccess).calledWith(any()).mockRejectedValue(new Error('File system error'));
      
      // Act
      const health = await contentRepository.checkHealth();

      // Assert
      expect(health).toEqual({
        status: 'unhealthy',
        components: {
          fileSystem: { 
            status: 'unhealthy',
            error: 'File system error'
          },
          conceptManager: { status: 'healthy' },
          resourceManager: { status: 'healthy' },
          topicManager: { status: 'healthy' },
          predicateManager: { status: 'healthy' },
          relationshipManager: { status: 'healthy' }
        },
        timestamp: expect.any(String)
      });
    });
  });
});
```

### Integration Tests

```typescript
describe('ContentRepository Integration', () => {
  let contentRepository: ContentRepository;
  let conceptManager: ConceptManager;
  let resourceManager: ResourceManager;
  let topicManager: TopicManager;
  let predicateManager: PredicateManager;
  let relationshipManager: RelationshipManager;
  let eventEmitter: EventEmitter;
  let fileSystem: FileSystemService;
  
  beforeAll(async () => {
    // Set up real dependencies
    fileSystem = new FileSystemService(config.contentDir);
    
    // Clear test data directory
    await fileSystem.ensureDir(path.join(config.contentDir, 'test'));
    await fileSystem.emptyDir(path.join(config.contentDir, 'test'));
    
    // Create real managers
    conceptManager = new ConceptManager(fileSystem);
    resourceManager = new ResourceManager(fileSystem);
    topicManager = new TopicManager(fileSystem);
    predicateManager = new PredicateManager(fileSystem, conceptManager, resourceManager, topicManager);
    relationshipManager = new RelationshipManager(fileSystem, conceptManager, resourceManager, topicManager, predicateManager);
    
    // Create real event emitter
    eventEmitter = new EventEmitter();
    
    // Create content repository with real dependencies
    contentRepository = new ContentRepository(
      conceptManager,
      resourceManager,
      topicManager,
      predicateManager,
      relationshipManager,
      eventEmitter
    );
  });
  
  afterAll(async () => {
    // Clean up test data
    await fileSystem.emptyDir(path.join(config.contentDir, 'test'));
  });
  
  describe('End-to-end CRUD operations', () => {
    it('should perform CRUD operations on concepts', async () => {
      // Create
      const conceptData = { 
        name: 'Integration Test Concept', 
        description: 'Created through ContentRepository' 
      };
      
      const createdConcept = await contentRepository.create(ContentTypeEnum.CONCEPT, conceptData);
      expect(createdConcept).toBeDefined();
      expect(createdConcept.id).toMatch(/^UOR-C-\d{3}-integration-test-concept$/);
      expect(createdConcept.name).toBe(conceptData.name);
      expect(createdConcept.description).toBe(conceptData.description);
      
      // Read
      const readConcept = await contentRepository.read(ContentTypeEnum.CONCEPT, createdConcept.id);
      expect(readConcept).toEqual(createdConcept);
      
      // Update
      const updateData = { description: 'Updated through ContentRepository' };
      const updatedConcept = await contentRepository.update(
        ContentTypeEnum.CONCEPT, 
        createdConcept.id, 
        updateData,
        createdConcept.version
      );
      
      expect(updatedConcept).toBeDefined();
      expect(updatedConcept.id).toBe(createdConcept.id);
      expect(updatedConcept.description).toBe(updateData.description);
      expect(updatedConcept.version).not.toBe(createdConcept.version);
      
      // List
      const concepts = await contentRepository.list(ContentTypeEnum.CONCEPT, { name: 'Integration Test' });
      expect(concepts).toContainEqual(expect.objectContaining({
        id: createdConcept.id,
        name: createdConcept.name
      }));
      
      // Delete
      const deleteResult = await contentRepository.delete(ContentTypeEnum.CONCEPT, createdConcept.id);
      expect(deleteResult).toBe(true);
      
      // Verify deletion
      await expect(contentRepository.read(ContentTypeEnum.CONCEPT, createdConcept.id))
        .rejects.toThrow(/not found/);
    });
  });
  
  describe('Transaction support', () => {
    it('should commit a transaction with multiple operations', async () => {
      // Begin transaction
      const transaction = await contentRepository.beginTransaction();
      expect(transaction).toBeDefined();
      expect(transaction.id).toBeDefined();
      
      // Create concept within transaction
      const conceptData = { 
        name: 'Transaction Test Concept', 
        description: 'Created in transaction' 
      };
      
      const createdConcept = await conceptManager.create(conceptData);
      transaction.operations.push({
        type: 'create',
        contentType: ContentTypeEnum.CONCEPT,
        data: conceptData,
        result: createdConcept
      });
      
      // Create resource within transaction
      const resourceData = { 
        name: 'Transaction Test Resource', 
        description: 'Created in transaction' 
      };
      
      const createdResource = await resourceManager.create(resourceData);
      transaction.operations.push({
        type: 'create',
        contentType: ContentTypeEnum.RESOURCE,
        data: resourceData,
        result: createdResource
      });
      
      // Commit transaction
      await contentRepository.commitTransaction(transaction);
      expect(transaction.status).toBe('committed');
      
      // Verify both items were created
      const readConcept = await contentRepository.read(ContentTypeEnum.CONCEPT, createdConcept.id);
      expect(readConcept).toEqual(createdConcept);
      
      const readResource = await contentRepository.read(ContentTypeEnum.RESOURCE, createdResource.id);
      expect(readResource).toEqual(createdResource);
      
      // Clean up
      await contentRepository.delete(ContentTypeEnum.CONCEPT, createdConcept.id);
      await contentRepository.delete(ContentTypeEnum.RESOURCE, createdResource.id);
    });
    
    it('should rollback a transaction', async () => {
      // Begin transaction
      const transaction = await contentRepository.beginTransaction();
      
      // Create concept within transaction
      const conceptData = { 
        name: 'Rollback Test Concept', 
        description: 'Should be rolled back' 
      };
      
      const createdConcept = await conceptManager.create(conceptData);
      transaction.operations.push({
        type: 'create',
        contentType: ContentTypeEnum.CONCEPT,
        data: conceptData,
        result: createdConcept
      });
      
      // Rollback transaction
      await contentRepository.rollbackTransaction(transaction);
      expect(transaction.status).toBe('rolled_back');
      
      // Verify concept was not created (or was deleted during rollback)
      await expect(contentRepository.read(ContentTypeEnum.CONCEPT, createdConcept.id))
        .rejects.toThrow(/not found/);
    });
  });
  
  describe('Event system', () => {
    it('should emit events for content operations', async () => {
      // Set up event listeners
      const events: any[] = [];
      eventEmitter.on('content.created', (event) => events.push(event));
      eventEmitter.on('content.updated', (event) => events.push(event));
      eventEmitter.on('content.deleted', (event) => events.push(event));
      
      // Create
      const conceptData = { 
        name: 'Event Test Concept', 
        description: 'Testing events' 
      };
      
      const createdConcept = await contentRepository.create(ContentTypeEnum.CONCEPT, conceptData);
      
      // Update
      const updateData = { description: 'Updated for event testing' };
      const updatedConcept = await contentRepository.update(
        ContentTypeEnum.CONCEPT, 
        createdConcept.id, 
        updateData,
        createdConcept.version
      );
      
      // Delete
      await contentRepository.delete(ContentTypeEnum.CONCEPT, createdConcept.id);
      
      // Verify events
      expect(events.length).toBe(3);
      
      expect(events[0].type).toBe(ContentTypeEnum.CONCEPT);
      expect(events[0].id).toBe(createdConcept.id);
      
      expect(events[1].type).toBe(ContentTypeEnum.CONCEPT);
      expect(events[1].id).toBe(createdConcept.id);
      expect(events[1].updates).toEqual(updateData);
      
      expect(events[2].type).toBe(ContentTypeEnum.CONCEPT);
      expect(events[2].id).toBe(createdConcept.id);
      
      // Clean up event listeners
      eventEmitter.removeAllListeners('content.created');
      eventEmitter.removeAllListeners('content.updated');
      eventEmitter.removeAllListeners('content.deleted');
    });
  });
  
  describe('MCP server integration', () => {
    let mcpServer: MCPServer;
    let client: any;
    
    beforeAll(async () => {
      // Set up MCP server
      mcpServer = new MCPServer({
        port: 9000,
        contentRepository
      });
      
      await mcpServer.start();
      
      // Set up JSON-RPC client
      client = new JSONRPCClient({
        url: 'http://localhost:9000/api'
      });
    });
    
    afterAll(async () => {
      // Shut down MCP server
      await mcpServer.stop();
    });
    
    it('should create content through MCP server', async () => {
      // Create concept through JSON-RPC
      const conceptData = { 
        name: 'MCP Test Concept', 
        description: 'Created through MCP server' 
      };
      
      const result = await client.request('content.create', {
        type: ContentTypeEnum.CONCEPT,
        content: conceptData
      });
      
      expect(result).toBeDefined();
      expect(result.id).toMatch(/^UOR-C-\d{3}-mcp-test-concept$/);
      
      // Clean up
      await contentRepository.delete(ContentTypeEnum.CONCEPT, result.id);
    });
    
    it('should read content through MCP server', async () => {
      // Create concept directly
      const concept = await contentRepository.create(ContentTypeEnum.CONCEPT, {
        name: 'MCP Read Test',
        description: 'Testing MCP read'
      });
      
      // Read through JSON-RPC
      const result = await client.request('content.read', {
        type: ContentTypeEnum.CONCEPT,
        id: concept.id
      });
      
      expect(result).toBeDefined();
      expect(result.id).toBe(concept.id);
      expect(result.name).toBe(concept.name);
      
      // Clean up
      await contentRepository.delete(ContentTypeEnum.CONCEPT, concept.id);
    });
  });
});
```
