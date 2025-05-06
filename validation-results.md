# UOR Content Validation Results

## Summary
- **Date**: May 06, 2025
- **Repository**: UOR-Foundation/uorcontent
- **Validation Tool**: OpenAPI Validator (`utils/validate-openapi.js`)

## Validation Statistics
- **Total Items**: 1255
- **Valid Items**: 1255
- **Invalid Items**: 0
- **Warnings**: 0

## Content Breakdown
- **Concepts**: 272 items
- **Resources**: 65 items
- **Topics**: 12 items
- **Predicates**: 276 items
- **Other Index Items**: 630 items

## Validation Process
The validation was performed using the OpenAPI validator tool against the OpenAPI specification in `/converted/openapi-spec.json`. All content items in the `/converted` directory were validated against their corresponding schema templates defined in the `/templates` directory.

## Schema Compliance
All content items strictly adhere to their respective schema templates:

1. **Concepts** follow the `Concept.json` schema template
   - Example: `/converted/concepts/UOR-C-001-uor-framework.json`

2. **Resources** follow the `InformationResource.json` schema template
   - Example: `/converted/resources/UOR-R-001-overview.json`

3. **Topics** follow the `Topic.json` schema template
   - Example: `/converted/topics/UOR-T-001-universal-object-reference.json`

4. **Predicates** follow the `FactPredicate.json` schema template
   - Example: `/converted/predicates/UOR-P-001-introduces-concept.json`

## Conclusion
The validation confirms that all content in the `/converted` directory strictly adheres to the schemas defined in the `/templates` directory. No schema violations were detected, and all content items are properly structured according to their respective templates.

## Validation Command
The validation was performed using the following command:
```
cd /home/ubuntu/repos/uorcontent/utils
node validate-openapi.js --verbose
```

This validation ensures that the UOR content repository maintains high-quality, consistent, and schema-compliant content that can be reliably used by applications that consume the UOR Framework API.
