# PM Role: Phase 4 Implementation Specifications

This document contains detailed Gherkin specifications for Phase 4 components of the UOR Content Management Client, focusing on Content Repository API, Advanced Query and Search, Content Validation and Integrity, Content Import/Export, and CLI Interface.

## Content Repository API (Issue #12)

```gherkin
Feature: Content Repository API
  As a content developer
  I want to use a unified interface for all content types in the UOR Content Management Client
  So that I can manage content with transaction support and event notifications

  Background:
    Given the UOR Content Management Client is initialized
    And the Schema.org validation is available
    And the file system utilities are available
    And the ConceptManager, ResourceManager, TopicManager, PredicateManager, and RelationshipManager are available

  Scenario: Create content through the repository
    Given I have a valid content object of type "<contentType>"
    When I call the create method on the ContentRepository with the content type and object
    Then a new content item should be created in the file system
    And the content should have a unique ID following the appropriate pattern
    And the content should be validated against the appropriate Schema.org type
    And the response should include the created content with its ID
    And an event should be emitted for the content creation

    Examples:
      | contentType |
      | concept     |
      | resource    |
      | topic       |
      | predicate   |

  Scenario: Create content with invalid data
    Given I have an invalid content object of type "<contentType>" missing required fields
    When I call the create method on the ContentRepository with the content type and object
    Then an error should be thrown indicating validation failure
    And no content should be created in the file system
    And the error should include details about the validation failures
    And no event should be emitted

    Examples:
      | contentType |
      | concept     |
      | resource    |
      | topic       |
      | predicate   |

  Scenario: Read content through the repository
    Given a content item of type "<contentType>" exists in the system with ID "<contentId>"
    When I call the read method on the ContentRepository with the content type and ID
    Then the response should include the content item with the specified ID
    And all content properties should be correctly loaded

    Examples:
      | contentType | contentId           |
      | concept     | UOR-C-001-example   |
      | resource    | UOR-R-001-example   |
      | topic       | UOR-T-001-example   |
      | predicate   | UOR-P-001-example   |

  Scenario: Read non-existent content
    Given no content exists with ID "<contentId>" of type "<contentType>"
    When I call the read method on the ContentRepository with the content type and ID
    Then an error should be thrown indicating the content was not found
    And the error should include the ID and type that was not found

    Examples:
      | contentType | contentId                |
      | concept     | UOR-C-999-nonexistent    |
      | resource    | UOR-R-999-nonexistent    |
      | topic       | UOR-T-999-nonexistent    |
      | predicate   | UOR-P-999-nonexistent    |

  Scenario: Update content through the repository
    Given a content item of type "<contentType>" exists in the system with ID "<contentId>"
    And I have valid update data for the content
    When I call the update method on the ContentRepository with the content type, ID, and update data
    Then the content should be updated in the file system
    And the response should include the updated content
    And the content's dateModified field should be updated
    And an event should be emitted for the content update

    Examples:
      | contentType | contentId           |
      | concept     | UOR-C-001-example   |
      | resource    | UOR-R-001-example   |
      | topic       | UOR-T-001-example   |
      | predicate   | UOR-P-001-example   |

  Scenario: Update content with optimistic concurrency
    Given a content item of type "<contentType>" exists in the system with ID "<contentId>" and version "v1"
    And I have valid update data for the content
    When I call the update method on the ContentRepository with the content type, ID, update data, and version "v1"
    Then the content should be updated in the file system
    And the content's version should be incremented
    And the response should include the updated content with the new version
    And an event should be emitted for the content update

    Examples:
      | contentType | contentId           |
      | concept     | UOR-C-001-example   |
      | resource    | UOR-R-001-example   |
      | topic       | UOR-T-001-example   |
      | predicate   | UOR-P-001-example   |

  Scenario: Update content with concurrent modification
    Given a content item of type "<contentType>" exists in the system with ID "<contentId>" and version "v1"
    And the content has been modified by another process to version "v2"
    And I have valid update data for the content
    When I call the update method on the ContentRepository with the content type, ID, update data, and version "v1"
    Then an error should be thrown indicating concurrent modification
    And the content should not be updated in the file system
    And the error should include details about the version mismatch
    And no event should be emitted

    Examples:
      | contentType | contentId           |
      | concept     | UOR-C-001-example   |
      | resource    | UOR-R-001-example   |
      | topic       | UOR-T-001-example   |
      | predicate   | UOR-P-001-example   |

  Scenario: Delete content through the repository
    Given a content item of type "<contentType>" exists in the system with ID "<contentId>"
    And the content has no references from other content items
    When I call the delete method on the ContentRepository with the content type and ID
    Then the content should be removed from the file system
    And the response should indicate successful deletion
    And an event should be emitted for the content deletion

    Examples:
      | contentType | contentId           |
      | concept     | UOR-C-001-example   |
      | resource    | UOR-R-001-example   |
      | topic       | UOR-T-001-example   |
      | predicate   | UOR-P-001-example   |

  Scenario: Delete content with references
    Given a content item of type "<contentType>" exists in the system with ID "<contentId>"
    And the content is referenced by other content items
    When I call the delete method on the ContentRepository with the content type and ID
    Then an error should be thrown indicating reference integrity violation
    And the content should not be removed from the file system
    And the error should include details about the references
    And no event should be emitted

    Examples:
      | contentType | contentId           |
      | concept     | UOR-C-001-example   |
      | resource    | UOR-R-001-example   |
      | topic       | UOR-T-001-example   |
      | predicate   | UOR-P-001-example   |

  Scenario: List content through the repository
    Given multiple content items of type "<contentType>" exist in the system
    When I call the list method on the ContentRepository with the content type and filter criteria
    Then the response should include only content items matching the filter criteria
    And the content items should be sorted by name by default

    Examples:
      | contentType |
      | concept     |
      | resource    |
      | topic       |
      | predicate   |

  Scenario: Begin a transaction
    Given the ContentRepository is initialized
    When I call the beginTransaction method on the ContentRepository
    Then a new transaction should be created
    And the transaction should have a unique ID
    And the response should include the transaction object

  Scenario: Commit a transaction with multiple operations
    Given a transaction has been created
    And multiple content operations have been performed within the transaction
    When I call the commitTransaction method on the ContentRepository with the transaction
    Then all operations should be committed to the file system
    And the response should indicate successful commit
    And events should be emitted for all operations in the transaction

  Scenario: Rollback a transaction
    Given a transaction has been created
    And multiple content operations have been performed within the transaction
    When I call the rollbackTransaction method on the ContentRepository with the transaction
    Then all operations should be rolled back
    And no changes should be made to the file system
    And the response should indicate successful rollback
    And no events should be emitted

  Scenario: Get repository statistics
    Given multiple content items of various types exist in the system
    When I call the getStatistics method on the ContentRepository
    Then the response should include statistics for all content types
    And the statistics should include counts, sizes, and last modified dates

  Scenario: Check repository health
    Given the ContentRepository is initialized
    When I call the checkHealth method on the ContentRepository
    Then the response should include health status for all components
    And the health status should include availability, performance, and integrity checks

  Scenario: Integration with MCP server
    Given the MCP server is running
    When a client sends a request to the content repository endpoints
    Then the request should be validated against the MCP schema
    And the appropriate ContentRepository method should be called
    And the response should follow the JSON-RPC format
```

## Advanced Query and Search (Issue #13)

```gherkin
Feature: Advanced Query and Search
  As a content developer
  I want to use advanced query and search capabilities in the UOR Content Management Client
  So that I can find and analyze content with complex criteria

  Background:
    Given the UOR Content Management Client is initialized
    And the ContentRepository is available
    And the IndexManager is available
    And multiple content items of various types exist in the system

  Scenario: Full-text search across all content types
    Given I have a search query "example"
    When I call the search method on the QueryEngine
    Then the response should include content items containing "example"
    And the results should be sorted by relevance score
    And the results should include content from all types
    And each result should include a relevance score
    And each result should include highlighted matches

  Scenario: Full-text search with type filtering
    Given I have a search query "example"
    And I have search options with contentTypes set to ["concept", "resource"]
    When I call the search method on the QueryEngine with the query and options
    Then the response should include content items containing "example"
    And the results should only include content of types "concept" and "resource"
    And the results should be sorted by relevance score

  Scenario: Full-text search with field filtering
    Given I have a search query "example"
    And I have search options with fields set to ["name", "description"]
    When I call the search method on the QueryEngine with the query and options
    Then the response should include content items containing "example" in name or description
    And the results should not include matches in other fields
    And the results should be sorted by relevance score

  Scenario: Semantic search
    Given I have a semantic search query "What is the relationship between prime decomposition and observer invariance?"
    When I call the semanticSearch method on the QueryEngine
    Then the response should include content items semantically related to the query
    And the results should be sorted by semantic relevance
    And each result should include a relevance score
    And each result should include an explanation of the semantic match

  Scenario: Semantic search with context
    Given I have a semantic search query "What is the relationship between prime decomposition and observer invariance?"
    And I have semantic search options with context set to "mathematical theory"
    When I call the semanticSearch method on the QueryEngine with the query and options
    Then the response should include content items semantically related to the query in the context of mathematical theory
    And the results should be sorted by semantic relevance

  Scenario: Execute query with query language
    Given I have a query string "type:concept AND (name:prime OR description:prime) AND NOT id:UOR-C-001"
    When I call the executeQuery method on the QueryEngine with the query string
    Then the response should include content items matching the query criteria
    And the results should only include concepts
    And the results should include items with "prime" in name or description
    And the results should not include the item with ID "UOR-C-001"

  Scenario: Execute query with sorting
    Given I have a query string "type:concept AND name:prime"
    And I have query options with sort set to "dateCreated:desc"
    When I call the executeQuery method on the QueryEngine with the query string and options
    Then the response should include content items matching the query criteria
    And the results should be sorted by dateCreated in descending order

  Scenario: Execute query with pagination
    Given I have a query string "type:resource"
    And I have query options with limit set to 10 and offset set to 20
    When I call the executeQuery method on the QueryEngine with the query string and options
    Then the response should include content items matching the query criteria
    And the results should include at most 10 items
    And the results should start from the 21st matching item
    And the response should include total count and pagination metadata

  Scenario: Faceted search
    Given I have a search query "example"
    And I have facets defined for "type", "dateCreated", and "tags"
    When I call the facetedSearch method on the QueryEngine with the query and facets
    Then the response should include content items matching the query
    And the response should include facet counts for each facet
    And the facet counts should be accurate for the search results

  Scenario: Faceted search with selection
    Given I have a search query "example"
    And I have facets defined for "type", "dateCreated", and "tags"
    And I have selected facet values "type:concept" and "tags:math"
    When I call the facetedSearch method on the QueryEngine with the query, facets, and selections
    Then the response should include content items matching the query and selected facets
    And the response should include updated facet counts for each facet
    And the facet counts should be accurate for the filtered search results

  Scenario: Optimize query
    Given I have a complex query string "type:concept AND (name:prime OR name:decomposition) AND (description:prime OR description:decomposition)"
    When I call the optimizeQuery method on the QueryEngine with the query string
    Then the response should include an optimized query string
    And the optimized query should be semantically equivalent to the original
    And the optimized query should be more efficient to execute

  Scenario: Visualize query results
    Given I have executed a query and have query results
    When I call the visualizeResults method on the QueryEngine with the results
    Then the response should include a visualization representation of the results
    And the visualization should include appropriate charts or graphs
    And the visualization should be in a format suitable for rendering

  Scenario: Integration with MCP server
    Given the MCP server is running
    When a client sends a request to the query and search endpoints
    Then the request should be validated against the MCP schema
    And the appropriate QueryEngine method should be called
    And the response should follow the JSON-RPC format
```

## Content Validation and Integrity (Issue #14)

```gherkin
Feature: Content Validation and Integrity
  As a content developer
  I want to use comprehensive validation and integrity checking in the UOR Content Management Client
  So that I can ensure content correctness and consistency

  Background:
    Given the UOR Content Management Client is initialized
    And the ContentRepository is available
    And the RelationshipManager is available
    And the SchemaValidator is available

  Scenario: Validate content against schema
    Given I have a content item of type "<contentType>"
    When I call the validateContent method on the ValidationEngine with the content and type
    Then the response should include a validation result
    And the validation result should indicate if the content is valid
    And the validation result should include any validation errors
    And the validation should check against the appropriate Schema.org type

    Examples:
      | contentType |
      | concept     |
      | resource    |
      | topic       |
      | predicate   |

  Scenario: Validate content with custom rules
    Given I have a content item of type "<contentType>"
    And custom validation rules are defined for the content type
    When I call the validateContent method on the ValidationEngine with the content, type, and custom rules
    Then the response should include a validation result
    And the validation result should check against both schema and custom rules
    And the validation result should include any custom rule violations

    Examples:
      | contentType |
      | concept     |
      | resource    |
      | topic       |
      | predicate   |

  Scenario: Validate relationships for a content item
    Given a content item exists in the system with ID "<contentId>"
    And the content item has relationships with other content items
    When I call the validateRelationships method on the ValidationEngine with the content ID
    Then the response should include a validation result
    And the validation result should indicate if all relationships are valid
    And the validation result should include any relationship validation errors
    And the validation should check reference integrity for all relationships

    Examples:
      | contentId           |
      | UOR-C-001-example   |
      | UOR-R-001-example   |
      | UOR-T-001-example   |
      | UOR-P-001-example   |

  Scenario: Validate the entire repository
    Given multiple content items of various types exist in the system
    When I call the validateRepository method on the ValidationEngine
    Then the response should include a validation report
    And the report should include validation results for all content items
    And the report should include validation results for all relationships
    And the report should include overall repository health metrics
    And the report should identify any orphaned or inconsistent content

  Scenario: Generate validation report
    Given I have performed multiple validation operations
    And I have collected validation results
    When I call the generateReport method on the ValidationEngine with the validation results
    Then the response should include a comprehensive validation report
    And the report should be organized by content type and severity
    And the report should include statistics and summaries
    And the report should be in a format suitable for rendering

  Scenario: Repair content with validation issues
    Given a content item of type "<contentType>" has validation issues
    And the issues are automatically repairable
    When I call the repairContent method on the ValidationEngine with the content, type, and issues
    Then the response should include the repaired content
    And the repaired content should pass validation
    And the response should include details about the repairs made

    Examples:
      | contentType |
      | concept     |
      | resource    |
      | topic       |
      | predicate   |

  Scenario: Visualize validation results
    Given I have a validation report
    When I call the visualizeValidation method on the ValidationEngine with the report
    Then the response should include a visualization representation of the validation results
    And the visualization should highlight issues by severity
    And the visualization should show relationships between issues
    And the visualization should be in a format suitable for rendering

  Scenario: Register custom validator
    Given I have created a custom validator function
    When I call the registerValidator method on the ValidationEngine with the validator
    Then the validator should be registered with the ValidationEngine
    And the validator should be called during subsequent validation operations
    And the validator results should be included in validation reports

  Scenario: Integration with MCP server
    Given the MCP server is running
    When a client sends a request to the validation endpoints
    Then the request should be validated against the MCP schema
    And the appropriate ValidationEngine method should be called
    And the response should follow the JSON-RPC format
```

## Content Import/Export (Issue #15)

```gherkin
Feature: Content Import/Export
  As a content developer
  I want to import and export content in the UOR Content Management Client
  So that I can exchange data with other systems and perform batch operations

  Background:
    Given the UOR Content Management Client is initialized
    And the ContentRepository is available
    And the ValidationEngine is available
    And the FileSystemService is available

  Scenario: Export all content to JSON
    Given multiple content items of various types exist in the system
    When I call the exportToJSON method on the ImportExportManager
    Then the response should include a JSON representation of all content
    And the JSON should include all content types
    And the JSON should maintain relationships between content items
    And the JSON should be valid according to the schema

  Scenario: Export content to JSON with options
    Given multiple content items of various types exist in the system
    And I have export options with contentTypes set to ["concept", "resource"]
    When I call the exportToJSON method on the ImportExportManager with the options
    Then the response should include a JSON representation of selected content
    And the JSON should only include content of types "concept" and "resource"
    And the JSON should maintain relationships between included content items

  Scenario: Import content from JSON
    Given I have a valid JSON representation of content
    When I call the importFromJSON method on the ImportExportManager with the JSON
    Then the content should be imported into the system
    And each content item should be validated before import
    And the response should include details about the imported content
    And the response should include any validation warnings or errors

  Scenario: Import content from JSON with validation errors
    Given I have a JSON representation of content with validation errors
    When I call the importFromJSON method on the ImportExportManager with the JSON
    Then an error should be thrown indicating validation failure
    And no content should be imported into the system
    And the error should include details about the validation failures

  Scenario: Import content from JSON with options
    Given I have a valid JSON representation of content
    And I have import options with updateExisting set to true
    When I call the importFromJSON method on the ImportExportManager with the JSON and options
    Then the content should be imported into the system
    And existing content should be updated rather than creating duplicates
    And the response should include details about updated and created content

  Scenario: Batch export content
    Given multiple content items exist in the system with IDs ["UOR-C-001", "UOR-R-001", "UOR-T-001"]
    When I call the batchExport method on the ImportExportManager with the content IDs
    Then the response should include a JSON representation of the specified content
    And the JSON should include only the specified content items
    And the JSON should maintain relationships between the content items

  Scenario: Batch import content
    Given I have an array of JSON data representing multiple content items
    When I call the batchImport method on the ImportExportManager with the JSON array
    Then all content should be imported into the system
    And each content item should be validated before import
    And the response should include details about all imported content
    And the operation should be performed atomically

  Scenario: Export content to Markdown
    Given multiple content items of various types exist in the system
    When I call the exportToFormat method on the ImportExportManager with format "markdown"
    Then the response should include a Markdown representation of all content
    And the Markdown should be well-formatted and readable
    And the Markdown should include links between related content

  Scenario: Export content to HTML
    Given multiple content items of various types exist in the system
    When I call the exportToFormat method on the ImportExportManager with format "html"
    Then the response should include an HTML representation of all content
    And the HTML should be well-formatted and valid
    And the HTML should include links between related content
    And the HTML should include appropriate styling

  Scenario: Selective export with filtering
    Given multiple content items of various types exist in the system
    And I have a content filter with criteria for specific content
    When I call the selectiveExport method on the ImportExportManager with the filter
    Then the response should include a JSON representation of filtered content
    And the JSON should include only content matching the filter criteria
    And the JSON should maintain relationships between included content items

  Scenario: Track export progress
    Given I have started a large export operation with ID "export-123"
    When I call the trackProgress method on the ImportExportManager with the operation ID
    Then the response should include the progress status of the export
    And the status should include percentage complete
    And the status should include estimated time remaining
    And the status should include any errors or warnings

  Scenario: Track import progress
    Given I have started a large import operation with ID "import-123"
    When I call the trackProgress method on the ImportExportManager with the operation ID
    Then the response should include the progress status of the import
    And the status should include percentage complete
    And the status should include estimated time remaining
    And the status should include any errors or warnings

  Scenario: Integration with MCP server
    Given the MCP server is running
    When a client sends a request to the import/export endpoints
    Then the request should be validated against the MCP schema
    And the appropriate ImportExportManager method should be called
    And the response should follow the JSON-RPC format
```

## CLI Interface (Issue #16)

```gherkin
Feature: CLI Interface
  As a content developer
  I want to use a command-line interface for the UOR Content Management Client
  So that I can manage content through scripts and terminal

  Background:
    Given the UOR Content Management Client is initialized
    And the ContentRepository is available
    And the QueryEngine is available
    And the ValidationEngine is available
    And the ImportExportManager is available

  Scenario: Parse and execute a valid command
    Given I have a command string "create concept --name 'Example Concept' --description 'This is an example'"
    When I call the parseCommand method on the CLI with the command string
    Then the command should be parsed into a Command object
    And the command type should be "create"
    And the command target should be "concept"
    And the command parameters should include name and description
    When I call the executeCommand method on the CLI with the parsed command
    Then the appropriate ContentRepository method should be called
    And the response should include the result of the operation

  Scenario: Parse an invalid command
    Given I have an invalid command string "invalid command"
    When I call the parseCommand method on the CLI with the command string
    Then an error should be thrown indicating invalid command syntax
    And the error should include details about the syntax error
    And the error should include suggestions for valid commands

  Scenario: Create content through CLI
    Given I have a command to create content of type "<contentType>"
    When I call the createContent method on the CLI with the content type and data
    Then the appropriate ContentRepository method should be called
    And a new content item should be created in the file system
    And the response should include the created content with its ID
    And the response should be formatted according to the CLI output format

    Examples:
      | contentType |
      | concept     |
      | resource    |
      | topic       |
      | predicate   |

  Scenario: Read content through CLI
    Given a content item of type "<contentType>" exists in the system with ID "<contentId>"
    When I call the readContent method on the CLI with the content type and ID
    Then the appropriate ContentRepository method should be called
    And the response should include the content item with the specified ID
    And the response should be formatted according to the CLI output format

    Examples:
      | contentType | contentId           |
      | concept     | UOR-C-001-example   |
      | resource    | UOR-R-001-example   |
      | topic       | UOR-T-001-example   |
      | predicate   | UOR-P-001-example   |

  Scenario: Update content through CLI
    Given a content item of type "<contentType>" exists in the system with ID "<contentId>"
    And I have update data for the content
    When I call the updateContent method on the CLI with the content type, ID, and update data
    Then the appropriate ContentRepository method should be called
    And the content should be updated in the file system
    And the response should include the updated content
    And the response should be formatted according to the CLI output format

    Examples:
      | contentType | contentId           |
      | concept     | UOR-C-001-example   |
      | resource    | UOR-R-001-example   |
      | topic       | UOR-T-001-example   |
      | predicate   | UOR-P-001-example   |

  Scenario: Delete content through CLI
    Given a content item of type "<contentType>" exists in the system with ID "<contentId>"
    When I call the deleteContent method on the CLI with the content type and ID
    Then the appropriate ContentRepository method should be called
    And the content should be removed from the file system
    And the response should indicate successful deletion
    And the response should be formatted according to the CLI output format

    Examples:
      | contentType | contentId           |
      | concept     | UOR-C-001-example   |
      | resource    | UOR-R-001-example   |
      | topic       | UOR-T-001-example   |
      | predicate   | UOR-P-001-example   |

  Scenario: List content through CLI
    Given multiple content items of type "<contentType>" exist in the system
    And I have filter criteria for the content
    When I call the listContent method on the CLI with the content type and filter
    Then the appropriate ContentRepository method should be called
    And the response should include content items matching the filter criteria
    And the response should be formatted according to the CLI output format
    And the response should include pagination information if applicable

    Examples:
      | contentType |
      | concept     |
      | resource    |
      | topic       |
      | predicate   |

  Scenario: Search content through CLI
    Given multiple content items of various types exist in the system
    And I have a search query "example"
    And I have search options as a string
    When I call the searchContent method on the CLI with the query and options
    Then the appropriate QueryEngine method should be called
    And the response should include content items matching the search criteria
    And the response should be formatted according to the CLI output format
    And the response should include relevance scores if applicable

  Scenario: Validate content through CLI
    Given a content item of type "<contentType>" exists in the system with ID "<contentId>"
    When I call the validateContent method on the CLI with the content type and ID
    Then the appropriate ValidationEngine method should be called
    And the response should include a validation result
    And the response should be formatted according to the CLI output format
    And the response should highlight any validation errors

    Examples:
      | contentType | contentId           |
      | concept     | UOR-C-001-example   |
      | resource    | UOR-R-001-example   |
      | topic       | UOR-T-001-example   |
      | predicate   | UOR-P-001-example   |

  Scenario: Export content through CLI
    Given multiple content items of various types exist in the system
    And I have a format string "json"
    And I have export options as a string
    When I call the exportContent method on the CLI with the format and options
    Then the appropriate ImportExportManager method should be called
    And the response should include the exported content
    And the response should be formatted according to the CLI output format
    And the response should include export statistics

  Scenario: Import content through CLI
    Given I have a file path to content data
    And I have import options as a string
    When I call the importContent method on the CLI with the file path and options
    Then the appropriate ImportExportManager method should be called
    And the content should be imported into the system
    And the response should include details about the imported content
    And the response should be formatted according to the CLI output format
    And the response should include import statistics

  Scenario: Start interactive mode
    Given the CLI is initialized
    When I call the startInteractiveMode method on the CLI
    Then the CLI should enter an interactive shell
    And the shell should display a welcome message and prompt
    And the shell should accept and execute commands
    And the shell should provide command history and completion
    And the shell should display results in a formatted way

  Scenario: Complete command in interactive mode
    Given the CLI is in interactive mode
    And I have a partial command "cre"
    When I call the completeCommand method on the CLI with the partial command
    Then the response should include possible completions
    And the completions should include "create"
    And the completions should be relevant to the current context

  Scenario: Format output in different formats
    Given I have a result object from a CLI operation
    And I have format options for "json", "table", and "text"
    When I call the formatOutput method on the CLI with the result and each format
    Then the response should include the formatted output
    And each format should correctly represent the result data
    And each format should be appropriate for the result type
```

## User Stories

### Content Repository API User Stories

1. As a content developer, I want to use a unified interface for all content types so that I can manage content consistently.
2. As a content developer, I want to perform operations with transaction support so that I can ensure data consistency.
3. As a content developer, I want to receive events for content changes so that I can react to updates in real-time.
4. As a content developer, I want to use optimistic concurrency for updates so that I can prevent data conflicts.
5. As a content developer, I want to get repository statistics so that I can monitor system health and usage.
6. As a system integrator, I want the Content Repository API to integrate with the MCP server so that I can access it through the API.

### Advanced Query and Search User Stories

1. As a content developer, I want to perform full-text search across all content types so that I can find relevant content quickly.
2. As a content developer, I want to use semantic search so that I can find content based on meaning rather than exact matches.
3. As a content developer, I want to use a query language for complex queries so that I can find content with precise criteria.
4. As a content developer, I want to use faceted search so that I can explore content by categories and attributes.
5. As a content developer, I want to visualize search results so that I can understand the content landscape.
6. As a system integrator, I want the Advanced Query and Search to integrate with the MCP server so that I can access it through the API.

### Content Validation and Integrity User Stories

1. As a content developer, I want to validate content against schema and custom rules so that I can ensure data correctness.
2. As a content developer, I want to validate relationships between content items so that I can ensure reference integrity.
3. As a content developer, I want to validate the entire repository so that I can ensure overall data consistency.
4. As a content developer, I want to generate validation reports so that I can understand and fix issues.
5. As a content developer, I want to automatically repair common validation issues so that I can maintain data quality efficiently.
6. As a system integrator, I want the Content Validation and Integrity to integrate with the MCP server so that I can access it through the API.

### Content Import/Export User Stories

1. As a content developer, I want to export content to JSON so that I can share it with other systems.
2. As a content developer, I want to import content from JSON so that I can load data from other sources.
3. As a content developer, I want to perform batch import and export operations so that I can efficiently manage large datasets.
4. As a content developer, I want to export content to different formats so that I can use it in various contexts.
5. As a content developer, I want to track progress of long-running import/export operations so that I can monitor their status.
6. As a system integrator, I want the Content Import/Export to integrate with the MCP server so that I can access it through the API.

### CLI Interface User Stories

1. As a content developer, I want to use a command-line interface for all content operations so that I can automate workflows.
2. As a content developer, I want to parse and execute commands so that I can perform operations from scripts.
3. As a content developer, I want to use an interactive shell so that I can perform operations more efficiently.
4. As a content developer, I want to get command completion so that I can work faster and with fewer errors.
5. As a content developer, I want to format output in different ways so that I can use it in various contexts.
6. As a system integrator, I want the CLI Interface to integrate with all other components so that I can access all functionality.
