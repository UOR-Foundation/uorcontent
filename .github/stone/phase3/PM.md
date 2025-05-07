# PM Role: Phase 3 Implementation Specifications

This document contains detailed Gherkin specifications for Phase 3 components of the UOR Content Management Client, focusing on Resource, Topic, and Predicate Managers along with Relationship Management with graph validation.

## Resource Manager Implementation (Issue #8)

```gherkin
Feature: Resource Manager
  As a content developer
  I want to manage resources in the UOR Content Management Client
  So that I can create, read, update, and delete resources with proper validation and reference integrity

  Background:
    Given the UOR Content Management Client is initialized
    And the Schema.org validation is available
    And the file system utilities are available

  Scenario: Create a new resource with valid data
    Given I have a valid resource object with required fields
    When I call the create method on the ResourceManager
    Then a new resource should be created in the file system
    And the resource should have a unique ID following the pattern "UOR-R-XXX-name"
    And the resource should be validated against the Schema.org CreativeWork type
    And the response should include the created resource with its ID

  Scenario: Create a new resource with invalid data
    Given I have an invalid resource object missing required fields
    When I call the create method on the ResourceManager
    Then an error should be thrown indicating validation failure
    And no resource should be created in the file system
    And the error should include details about the validation failures

  Scenario: Read an existing resource by ID
    Given a resource exists in the system with ID "UOR-R-001-example"
    When I call the read method on the ResourceManager with the ID "UOR-R-001-example"
    Then the response should include the resource with ID "UOR-R-001-example"
    And all resource properties should be correctly loaded

  Scenario: Read a non-existent resource
    Given no resource exists with ID "UOR-R-999-nonexistent"
    When I call the read method on the ResourceManager with the ID "UOR-R-999-nonexistent"
    Then an error should be thrown indicating the resource was not found
    And the error should include the ID that was not found

  Scenario: Update an existing resource with valid data
    Given a resource exists in the system with ID "UOR-R-001-example"
    And I have valid update data for the resource
    When I call the update method on the ResourceManager with the ID and update data
    Then the resource should be updated in the file system
    And the response should include the updated resource
    And the resource's dateModified field should be updated

  Scenario: Update an existing resource with optimistic concurrency
    Given a resource exists in the system with ID "UOR-R-001-example" and version "v1"
    And I have valid update data for the resource
    When I call the update method on the ResourceManager with the ID, update data, and version "v1"
    Then the resource should be updated in the file system
    And the resource's version should be incremented
    And the response should include the updated resource with the new version

  Scenario: Update a resource with concurrent modification
    Given a resource exists in the system with ID "UOR-R-001-example" and version "v1"
    And the resource has been modified by another process to version "v2"
    And I have valid update data for the resource
    When I call the update method on the ResourceManager with the ID, update data, and version "v1"
    Then an error should be thrown indicating concurrent modification
    And the resource should not be updated in the file system
    And the error should include details about the version mismatch

  Scenario: Delete an existing resource
    Given a resource exists in the system with ID "UOR-R-001-example"
    And the resource has no references from other content items
    When I call the delete method on the ResourceManager with the ID
    Then the resource should be removed from the file system
    And the response should indicate successful deletion

  Scenario: Delete a resource with references
    Given a resource exists in the system with ID "UOR-R-001-example"
    And the resource is referenced by other content items
    When I call the delete method on the ResourceManager with the ID
    Then an error should be thrown indicating reference integrity violation
    And the resource should not be removed from the file system
    And the error should include details about the references

  Scenario: List resources with filtering
    Given multiple resources exist in the system
    When I call the list method on the ResourceManager with filter criteria
    Then the response should include only resources matching the filter criteria
    And the resources should be sorted by name by default

  Scenario: Batch create multiple resources
    Given I have an array of valid resource objects
    When I call the batchCreate method on the ResourceManager
    Then all resources should be created in the file system
    And each resource should have a unique ID following the pattern "UOR-R-XXX-name"
    And the response should include all created resources with their IDs
    And the operation should be performed atomically

  Scenario: Integration with MCP server
    Given the MCP server is running
    When a client sends a request to the resource endpoints
    Then the request should be validated against the MCP schema
    And the appropriate ResourceManager method should be called
    And the response should follow the JSON-RPC format
```

## Topic Manager Implementation (Issue #9)

```gherkin
Feature: Topic Manager
  As a content developer
  I want to manage topics in the UOR Content Management Client
  So that I can create, read, update, and delete topics with proper validation and reference integrity

  Background:
    Given the UOR Content Management Client is initialized
    And the Schema.org validation is available
    And the file system utilities are available

  Scenario: Create a new topic with valid data
    Given I have a valid topic object with required fields
    When I call the create method on the TopicManager
    Then a new topic should be created in the file system
    And the topic should have a unique ID following the pattern "UOR-T-XXX-name"
    And the topic should be validated against the Schema.org CreativeWork type
    And the response should include the created topic with its ID

  Scenario: Create a new topic with invalid data
    Given I have an invalid topic object missing required fields
    When I call the create method on the TopicManager
    Then an error should be thrown indicating validation failure
    And no topic should be created in the file system
    And the error should include details about the validation failures

  Scenario: Read an existing topic by ID
    Given a topic exists in the system with ID "UOR-T-001-example"
    When I call the read method on the TopicManager with the ID "UOR-T-001-example"
    Then the response should include the topic with ID "UOR-T-001-example"
    And all topic properties should be correctly loaded

  Scenario: Read a non-existent topic
    Given no topic exists with ID "UOR-T-999-nonexistent"
    When I call the read method on the TopicManager with the ID "UOR-T-999-nonexistent"
    Then an error should be thrown indicating the topic was not found
    And the error should include the ID that was not found

  Scenario: Update an existing topic with valid data
    Given a topic exists in the system with ID "UOR-T-001-example"
    And I have valid update data for the topic
    When I call the update method on the TopicManager with the ID and update data
    Then the topic should be updated in the file system
    And the response should include the updated topic
    And the topic's dateModified field should be updated

  Scenario: Update an existing topic with optimistic concurrency
    Given a topic exists in the system with ID "UOR-T-001-example" and version "v1"
    And I have valid update data for the topic
    When I call the update method on the TopicManager with the ID, update data, and version "v1"
    Then the topic should be updated in the file system
    And the topic's version should be incremented
    And the response should include the updated topic with the new version

  Scenario: Update a topic with concurrent modification
    Given a topic exists in the system with ID "UOR-T-001-example" and version "v1"
    And the topic has been modified by another process to version "v2"
    And I have valid update data for the topic
    When I call the update method on the TopicManager with the ID, update data, and version "v1"
    Then an error should be thrown indicating concurrent modification
    And the topic should not be updated in the file system
    And the error should include details about the version mismatch

  Scenario: Delete an existing topic
    Given a topic exists in the system with ID "UOR-T-001-example"
    And the topic has no references from other content items
    When I call the delete method on the TopicManager with the ID
    Then the topic should be removed from the file system
    And the response should indicate successful deletion

  Scenario: Delete a topic with references
    Given a topic exists in the system with ID "UOR-T-001-example"
    And the topic is referenced by other content items
    When I call the delete method on the TopicManager with the ID
    Then an error should be thrown indicating reference integrity violation
    And the topic should not be removed from the file system
    And the error should include details about the references

  Scenario: List topics with filtering
    Given multiple topics exist in the system
    When I call the list method on the TopicManager with filter criteria
    Then the response should include only topics matching the filter criteria
    And the topics should be sorted by name by default

  Scenario: Batch create multiple topics
    Given I have an array of valid topic objects
    When I call the batchCreate method on the TopicManager
    Then all topics should be created in the file system
    And each topic should have a unique ID following the pattern "UOR-T-XXX-name"
    And the response should include all created topics with their IDs
    And the operation should be performed atomically

  Scenario: Get topic hierarchy
    Given a topic exists in the system with ID "UOR-T-001-parent"
    And multiple child topics exist with isPartOf references to "UOR-T-001-parent"
    When I call the getTopicHierarchy method on the TopicManager with ID "UOR-T-001-parent"
    Then the response should include the parent topic and all its child topics
    And the hierarchy should be correctly structured with parent-child relationships
    And the response should include the depth level for each topic

  Scenario: Add a topic to a hierarchy
    Given a parent topic exists in the system with ID "UOR-T-001-parent"
    And a child topic exists in the system with ID "UOR-T-002-child"
    When I call the addToHierarchy method on the TopicManager with parent ID and child ID
    Then the child topic should be updated with isPartOf reference to the parent
    And the parent topic should be updated with hasPart reference to the child
    And the response should include the updated parent and child topics

  Scenario: Remove a topic from a hierarchy
    Given a parent topic exists in the system with ID "UOR-T-001-parent"
    And a child topic exists in the system with ID "UOR-T-002-child"
    And the child topic has isPartOf reference to the parent
    And the parent topic has hasPart reference to the child
    When I call the removeFromHierarchy method on the TopicManager with parent ID and child ID
    Then the child topic should be updated to remove isPartOf reference to the parent
    And the parent topic should be updated to remove hasPart reference to the child
    And the response should include the updated parent and child topics

  Scenario: Integration with MCP server
    Given the MCP server is running
    When a client sends a request to the topic endpoints
    Then the request should be validated against the MCP schema
    And the appropriate TopicManager method should be called
    And the response should follow the JSON-RPC format
```

## Predicate Manager Implementation (Issue #10)

```gherkin
Feature: Predicate Manager
  As a content developer
  I want to manage predicates in the UOR Content Management Client
  So that I can create, read, update, and delete predicates with proper validation and reference integrity

  Background:
    Given the UOR Content Management Client is initialized
    And the Schema.org validation is available
    And the file system utilities are available
    And the ConceptManager, ResourceManager, and TopicManager are available

  Scenario: Create a new predicate with valid data
    Given I have a valid predicate object with required fields
    And the subject reference exists in the system
    And all target references exist in the system
    When I call the create method on the PredicateManager
    Then a new predicate should be created in the file system
    And the predicate should have a unique ID following the pattern "UOR-P-XXX-name"
    And the predicate should be validated against the Schema.org PropertyValue type
    And the response should include the created predicate with its ID

  Scenario: Create a new predicate with invalid data
    Given I have an invalid predicate object missing required fields
    When I call the create method on the PredicateManager
    Then an error should be thrown indicating validation failure
    And no predicate should be created in the file system
    And the error should include details about the validation failures

  Scenario: Create a predicate with non-existent subject
    Given I have a valid predicate object with required fields
    But the subject reference does not exist in the system
    When I call the create method on the PredicateManager
    Then an error should be thrown indicating reference integrity violation
    And no predicate should be created in the file system
    And the error should include details about the missing subject reference

  Scenario: Create a predicate with non-existent target
    Given I have a valid predicate object with required fields
    And the subject reference exists in the system
    But one of the target references does not exist in the system
    When I call the create method on the PredicateManager
    Then an error should be thrown indicating reference integrity violation
    And no predicate should be created in the file system
    And the error should include details about the missing target reference

  Scenario: Read an existing predicate by ID
    Given a predicate exists in the system with ID "UOR-P-001-example"
    When I call the read method on the PredicateManager with the ID "UOR-P-001-example"
    Then the response should include the predicate with ID "UOR-P-001-example"
    And all predicate properties should be correctly loaded

  Scenario: Read a non-existent predicate
    Given no predicate exists with ID "UOR-P-999-nonexistent"
    When I call the read method on the PredicateManager with the ID "UOR-P-999-nonexistent"
    Then an error should be thrown indicating the predicate was not found
    And the error should include the ID that was not found

  Scenario: Update an existing predicate with valid data
    Given a predicate exists in the system with ID "UOR-P-001-example"
    And I have valid update data for the predicate
    And all references in the update data exist in the system
    When I call the update method on the PredicateManager with the ID and update data
    Then the predicate should be updated in the file system
    And the response should include the updated predicate
    And the predicate's dateModified field should be updated

  Scenario: Update a predicate with non-existent references
    Given a predicate exists in the system with ID "UOR-P-001-example"
    And I have update data with references that do not exist in the system
    When I call the update method on the PredicateManager with the ID and update data
    Then an error should be thrown indicating reference integrity violation
    And the predicate should not be updated in the file system
    And the error should include details about the missing references

  Scenario: Delete an existing predicate
    Given a predicate exists in the system with ID "UOR-P-001-example"
    When I call the delete method on the PredicateManager with the ID
    Then the predicate should be removed from the file system
    And the response should indicate successful deletion

  Scenario: List predicates with filtering
    Given multiple predicates exist in the system
    When I call the list method on the PredicateManager with filter criteria
    Then the response should include only predicates matching the filter criteria
    And the predicates should be sorted by name by default

  Scenario: Batch create multiple predicates
    Given I have an array of valid predicate objects
    And all references in the predicates exist in the system
    When I call the batchCreate method on the PredicateManager
    Then all predicates should be created in the file system
    And each predicate should have a unique ID following the pattern "UOR-P-XXX-name"
    And the response should include all created predicates with their IDs
    And the operation should be performed atomically

  Scenario: Get predicates for a content item
    Given multiple predicates exist in the system
    And some predicates have subject references to content item "UOR-C-001-example"
    When I call the getPredicatesForContent method on the PredicateManager with ID "UOR-C-001-example"
    Then the response should include all predicates with subject reference to "UOR-C-001-example"
    And the predicates should be sorted by name by default

  Scenario: Get predicates targeting a content item
    Given multiple predicates exist in the system
    And some predicates have target references to content item "UOR-R-001-example"
    When I call the getPredicatesTargetingContent method on the PredicateManager with ID "UOR-R-001-example"
    Then the response should include all predicates with target reference to "UOR-R-001-example"
    And the predicates should be sorted by name by default

  Scenario: Integration with MCP server
    Given the MCP server is running
    When a client sends a request to the predicate endpoints
    Then the request should be validated against the MCP schema
    And the appropriate PredicateManager method should be called
    And the response should follow the JSON-RPC format
```

## Relationship Management Implementation (Issue #11)

```gherkin
Feature: Relationship Management
  As a content developer
  I want to manage relationships between content items in the UOR Content Management Client
  So that I can create, validate, and query relationships with proper graph validation

  Background:
    Given the UOR Content Management Client is initialized
    And the Schema.org validation is available
    And the file system utilities are available
    And the ConceptManager, ResourceManager, TopicManager, and PredicateManager are available

  Scenario: Create a new relationship
    Given I have a valid relationship object with subject, predicate, and target
    And the subject, predicate, and target all exist in the system
    When I call the createRelationship method on the RelationshipManager
    Then a new predicate should be created in the file system
    And the predicate should link the subject and target with the specified relationship
    And the response should include the created relationship

  Scenario: Create a relationship with non-existent subject
    Given I have a relationship object with non-existent subject
    When I call the createRelationship method on the RelationshipManager
    Then an error should be thrown indicating reference integrity violation
    And no relationship should be created in the file system
    And the error should include details about the missing subject

  Scenario: Create a relationship with non-existent target
    Given I have a relationship object with non-existent target
    When I call the createRelationship method on the RelationshipManager
    Then an error should be thrown indicating reference integrity violation
    And no relationship should be created in the file system
    And the error should include details about the missing target

  Scenario: Validate a valid relationship
    Given I have a valid relationship object with subject, predicate, and target
    And the subject, predicate, and target all exist in the system
    When I call the validateRelationship method on the RelationshipManager
    Then the response should indicate the relationship is valid
    And the validation result should include no errors

  Scenario: Validate an invalid relationship
    Given I have an invalid relationship object
    When I call the validateRelationship method on the RelationshipManager
    Then the response should indicate the relationship is invalid
    And the validation result should include details about the validation failures

  Scenario: Query relationships with filtering
    Given multiple relationships exist in the system
    When I call the queryRelationships method on the RelationshipManager with filter criteria
    Then the response should include only relationships matching the filter criteria
    And the relationships should be sorted by creation date by default

  Scenario: Build relationship graph
    Given multiple content items and relationships exist in the system
    When I call the buildGraph method on the RelationshipManager
    Then the response should include a graph representation of all relationships
    And the graph should include nodes for all content items
    And the graph should include edges for all relationships
    And the graph should be correctly structured with source and target nodes

  Scenario: Build filtered relationship graph
    Given multiple content items and relationships exist in the system
    When I call the buildGraph method on the RelationshipManager with filter options
    Then the response should include a graph representation of filtered relationships
    And the graph should include only nodes and edges matching the filter criteria

  Scenario: Validate relationship graph
    Given a relationship graph has been built
    When I call the validateGraph method on the RelationshipManager
    Then the response should indicate if the graph is valid
    And the validation result should include details about any validation failures
    And the validation should check for cycles, orphaned nodes, and invalid references

  Scenario: Visualize relationship graph
    Given a relationship graph has been built
    When I call the visualizeGraph method on the RelationshipManager
    Then the response should include a visualization representation of the graph
    And the visualization should include all nodes and edges in the graph
    And the visualization should be in a format suitable for rendering

  Scenario: Find path between content items
    Given multiple content items and relationships exist in the system
    When I call the findPath method on the RelationshipManager with source and target IDs
    Then the response should include the shortest path between the source and target
    And the path should include all intermediate nodes and edges
    And the path should be correctly ordered from source to target

  Scenario: Integration with MCP server
    Given the MCP server is running
    When a client sends a request to the relationship endpoints
    Then the request should be validated against the MCP schema
    And the appropriate RelationshipManager method should be called
    And the response should follow the JSON-RPC format
```

## User Stories

### Resource Manager User Stories

1. As a content developer, I want to create resources with proper validation so that I can ensure data integrity.
2. As a content developer, I want to read resources by ID so that I can retrieve specific content.
3. As a content developer, I want to update resources with optimistic concurrency so that I can prevent data conflicts.
4. As a content developer, I want to delete resources with reference integrity checking so that I don't break existing relationships.
5. As a content developer, I want to list resources with filtering so that I can find specific content.
6. As a content developer, I want to batch create resources so that I can efficiently import multiple items.
7. As a system integrator, I want the Resource Manager to integrate with the MCP server so that I can access it through the API.

### Topic Manager User Stories

1. As a content developer, I want to create topics with proper validation so that I can ensure data integrity.
2. As a content developer, I want to read topics by ID so that I can retrieve specific content.
3. As a content developer, I want to update topics with optimistic concurrency so that I can prevent data conflicts.
4. As a content developer, I want to delete topics with reference integrity checking so that I don't break existing relationships.
5. As a content developer, I want to list topics with filtering so that I can find specific content.
6. As a content developer, I want to batch create topics so that I can efficiently import multiple items.
7. As a content developer, I want to manage topic hierarchies so that I can organize content in a structured way.
8. As a system integrator, I want the Topic Manager to integrate with the MCP server so that I can access it through the API.

### Predicate Manager User Stories

1. As a content developer, I want to create predicates with proper validation so that I can ensure data integrity.
2. As a content developer, I want to read predicates by ID so that I can retrieve specific relationships.
3. As a content developer, I want to update predicates with reference integrity checking so that I don't create invalid relationships.
4. As a content developer, I want to delete predicates so that I can remove relationships between content items.
5. As a content developer, I want to list predicates with filtering so that I can find specific relationships.
6. As a content developer, I want to batch create predicates so that I can efficiently import multiple relationships.
7. As a content developer, I want to get predicates for a content item so that I can see all relationships originating from it.
8. As a content developer, I want to get predicates targeting a content item so that I can see all relationships pointing to it.
9. As a system integrator, I want the Predicate Manager to integrate with the MCP server so that I can access it through the API.

### Relationship Management User Stories

1. As a content developer, I want to create relationships between content items so that I can establish semantic connections.
2. As a content developer, I want to validate relationships so that I can ensure they follow the domain rules.
3. As a content developer, I want to query relationships with filtering so that I can find specific connections.
4. As a content developer, I want to build relationship graphs so that I can visualize the connections between content items.
5. As a content developer, I want to validate relationship graphs so that I can ensure they are consistent and valid.
6. As a content developer, I want to visualize relationship graphs so that I can understand the structure of the content.
7. As a content developer, I want to find paths between content items so that I can understand how they are connected.
8. As a system integrator, I want the Relationship Management to integrate with the MCP server so that I can access it through the API.
