# QA Role: Phase 3 Testing Specifications

This document contains testing specifications for Phase 3 components of the UOR Content Management Client, focusing on Resource, Topic, and Predicate Managers along with Relationship Management with graph validation.

## Testing Strategy Overview

The testing strategy for Phase 3 components follows a comprehensive approach:

1. **Unit Tests**: Test individual methods and classes in isolation
2. **Integration Tests**: Test interactions between components
3. **Validation Tests**: Test schema validation and reference integrity
4. **Performance Tests**: Test performance under load
5. **Edge Case Tests**: Test boundary conditions and error handling

All tests will be implemented using Jest with TypeScript support. Test coverage should exceed 90% for all components.

## Resource Manager Tests (Issue #8)

### Unit Test Cases

1. **Create Operations**
   - Create a resource with valid data
   - Throw error when creating a resource with invalid data
   - Generate correct ID format (UOR-R-XXX-name)
   - Validate resource against Schema.org CreativeWork type
   - Update index when creating a resource

2. **Read Operations**
   - Read an existing resource by ID
   - Throw error when reading a non-existent resource
   - Handle malformed resource files

3. **Update Operations**
   - Update an existing resource with valid data
   - Throw error when updating with invalid data
   - Handle optimistic concurrency with version checking
   - Throw error on concurrent modification
   - Update index when updating a resource

4. **Delete Operations**
   - Delete an existing resource with no references
   - Throw error when deleting a resource with references
   - Update index when deleting a resource

5. **List Operations**
   - List resources with filtering
   - Sort resources by specified criteria
   - Paginate resource lists

6. **Batch Operations**
   - Create multiple resources in a batch
   - Throw error when batch creating with invalid resources
   - Ensure atomic batch operations

7. **Integration with Phase 1 and 2**
   - Use file system utilities from Phase 1
   - Use schema validation from Phase 1
   - Integrate with index management from Phase 2

### Integration Test Cases

1. **Full CRUD Lifecycle**
   - Perform complete create-read-update-delete cycle
   - Verify all operations work together correctly

2. **Batch Operations**
   - Create multiple resources and verify they exist
   - List and filter the created resources

3. **Index Integration**
   - Create a resource and verify it's indexed
   - Update a resource and verify index is updated
   - Delete a resource and verify it's removed from index

4. **Phase 1 and 2 Integration**
   - Verify atomic file operations from Phase 1
   - Verify schema validation from Phase 1
   - Verify index management from Phase 2

### Validation Test Cases

1. **Schema Validation**
   - Validate required fields
   - Validate @type field
   - Validate date fields
   - Validate ID format
   - Validate nested objects

2. **Reference Integrity**
   - Verify references to other content items
   - Prevent deletion of referenced resources

3. **Performance Tests**
   - Test with large number of resources
   - Measure response times for operations
   - Test concurrent operations

## Topic Manager Tests (Issue #9)

### Unit Test Cases

1. **Create Operations**
   - Create a topic with valid data
   - Throw error when creating a topic with invalid data
   - Generate correct ID format (UOR-T-XXX-name)
   - Validate topic against Schema.org CreativeWork type
   - Update index when creating a topic

2. **Read Operations**
   - Read an existing topic by ID
   - Throw error when reading a non-existent topic
   - Handle malformed topic files

3. **Update Operations**
   - Update an existing topic with valid data
   - Throw error when updating with invalid data
   - Handle optimistic concurrency with version checking
   - Throw error on concurrent modification
   - Update index when updating a topic

4. **Delete Operations**
   - Delete an existing topic with no references
   - Throw error when deleting a topic with references
   - Update index when deleting a topic

5. **List Operations**
   - List topics with filtering
   - Sort topics by specified criteria
   - Paginate topic lists

6. **Batch Operations**
   - Create multiple topics in a batch
   - Throw error when batch creating with invalid topics
   - Ensure atomic batch operations

7. **Hierarchy Operations**
   - Get topic hierarchy
   - Add a topic to a hierarchy
   - Remove a topic from a hierarchy
   - Handle circular references in hierarchies

8. **Integration with Phase 1 and 2**
   - Use file system utilities from Phase 1
   - Use schema validation from Phase 1
   - Integrate with index management from Phase 2

### Integration Test Cases

1. **Full CRUD Lifecycle**
   - Perform complete create-read-update-delete cycle
   - Verify all operations work together correctly

2. **Hierarchy Operations**
   - Create parent and child topics
   - Add child to parent hierarchy
   - Get topic hierarchy and verify structure
   - Remove child from hierarchy

3. **Index Integration**
   - Create a topic and verify it's indexed
   - Update a topic and verify index is updated
   - Delete a topic and verify it's removed from index

4. **Phase 1 and 2 Integration**
   - Verify atomic file operations from Phase 1
   - Verify schema validation from Phase 1
   - Verify index management from Phase 2

### Validation Test Cases

1. **Schema Validation**
   - Validate required fields
   - Validate @type field
   - Validate date fields
   - Validate ID format
   - Validate nested objects

2. **Hierarchy Validation**
   - Validate parent-child relationships
   - Prevent circular references
   - Validate depth levels

3. **Reference Integrity**
   - Verify references to other content items
   - Prevent deletion of referenced topics

## Predicate Manager Tests (Issue #10)

### Unit Test Cases

1. **Create Operations**
   - Create a predicate with valid data
   - Throw error when creating a predicate with invalid data
   - Throw error when subject does not exist
   - Throw error when target does not exist
   - Generate correct ID format (UOR-P-XXX-name)
   - Validate predicate against Schema.org PropertyValue type
   - Update index when creating a predicate

2. **Read Operations**
   - Read an existing predicate by ID
   - Throw error when reading a non-existent predicate
   - Handle malformed predicate files

3. **Update Operations**
   - Update an existing predicate with valid data
   - Throw error when updating with invalid data
   - Throw error when updating with non-existent references
   - Handle optimistic concurrency with version checking
   - Update index when updating a predicate

4. **Delete Operations**
   - Delete an existing predicate
   - Update index when deleting a predicate

5. **List Operations**
   - List predicates with filtering
   - Sort predicates by specified criteria
   - Paginate predicate lists

6. **Relationship Operations**
   - Get predicates for a content item
   - Get predicates targeting a content item

7. **Integration with Phase 1 and 2**
   - Use file system utilities from Phase 1
   - Use schema validation from Phase 1
   - Integrate with content repository from Phase 2
   - Integrate with index management from Phase 2

### Integration Test Cases

1. **Full CRUD Lifecycle**
   - Perform complete create-read-update-delete cycle
   - Verify all operations work together correctly

2. **Relationship Operations**
   - Create content items and predicates between them
   - Get predicates for a content item
   - Get predicates targeting a content item

3. **Reference Integrity**
   - Create predicates with valid references
   - Attempt to create predicates with invalid references
   - Verify reference integrity is maintained

4. **Phase 1 and 2 Integration**
   - Verify atomic file operations from Phase 1
   - Verify schema validation from Phase 1
   - Verify content repository integration from Phase 2
   - Verify index management from Phase 2

### Validation Test Cases

1. **Schema Validation**
   - Validate required fields
   - Validate @type field
   - Validate date fields
   - Validate ID format

2. **Reference Validation**
   - Validate subject references
   - Validate target references
   - Validate predicate types

## Relationship Management Tests (Issue #11)

### Unit Test Cases

1. **Create Relationship**
   - Create a relationship with valid data
   - Throw error when subject does not exist
   - Throw error when target does not exist
   - Verify predicate is created correctly

2. **Validate Relationship**
   - Validate a valid relationship
   - Invalidate a relationship with non-existent subject
   - Invalidate a relationship with non-existent target
   - Invalidate a relationship with invalid predicate

3. **Query Relationships**
   - Query relationships with filtering
   - Sort relationships by specified criteria
   - Paginate relationship results

4. **Graph Operations**
   - Build relationship graph
   - Build filtered relationship graph
   - Validate relationship graph
   - Find path between content items
   - Visualize relationship graph

5. **Integration with Phase 1 and 2**
   - Use schema validation from Phase 1
   - Integrate with content repository from Phase 2
   - Integrate with predicate manager from Phase 3

### Integration Test Cases

1. **Relationship Creation and Validation**
   - Create content items and relationships between them
   - Validate relationships
   - Query relationships

2. **Graph Operations**
   - Create a network of content items and relationships
   - Build a relationship graph
   - Validate the graph
   - Find paths between content items

3. **Visualization**
   - Create a relationship graph
   - Generate visualization
   - Verify visualization format

4. **Phase 1, 2, and 3 Integration**
   - Verify schema validation from Phase 1
   - Verify content repository integration from Phase 2
   - Verify predicate manager integration from Phase 3

### Validation Test Cases

1. **Graph Validation**
   - Validate for cycles
   - Validate for orphaned nodes
   - Validate for invalid references
   - Validate graph integrity

2. **Path Finding**
   - Find direct paths
   - Find indirect paths
   - Handle non-existent paths

## Test File Structure

```
src/
├── __tests__/
│   ├── managers/
│   │   ├── resource-manager.test.ts
│   │   ├── topic-manager.test.ts
│   │   ├── predicate-manager.test.ts
│   │   └── relationship-manager.test.ts
│   ├── integration-tests/
│   │   ├── resource-manager.integration.test.ts
│   │   ├── topic-manager.integration.test.ts
│   │   ├── predicate-manager.integration.test.ts
│   │   └── relationship-manager.integration.test.ts
│   └── validation-tests/
│       ├── resource-validation.test.ts
│       ├── topic-validation.test.ts
│       ├── predicate-validation.test.ts
│       └── relationship-validation.test.ts
└── __mocks__/
    ├── resource-mocks.ts
    ├── topic-mocks.ts
    ├── predicate-mocks.ts
    └── relationship-mocks.ts
```

## Test Commands

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run validation tests only
npm run test:validation

# Run tests for a specific component
npm test -- --testPathPattern=resource-manager

# Run tests with coverage
npm test -- --coverage
```

## Coverage Requirements

- Overall test coverage: >90%
- Unit test coverage: >95%
- Integration test coverage: >85%
- Validation test coverage: >90%

## Integration with CI/CD

- Tests will be run automatically on pull requests
- Tests will fail if coverage requirements are not met
- Tests will fail if any test fails
