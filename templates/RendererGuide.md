# Content Rendering Guide

This document explains how content in the Schema.org JSON format can be rendered to users.

## Rendering Architecture

The modular JSON format enables flexible rendering through:

1. **Dynamic Content Assembly**: Content is assembled based on predicates and relationships
2. **Component-Based Rendering**: Each content type has specialized rendering components
3. **Context-Aware Presentation**: Display adapts based on user context and related content

## Renderer Components

### 1. JSON Loader

Responsible for loading and parsing the JSON content:

```javascript
class ContentLoader {
  constructor(contentBasePath) {
    this.basePath = contentBasePath;
    this.cache = new Map();
    this.indices = null;
  }

  async loadIndices() {
    if (!this.indices) {
      const [concepts, topics, predicates] = await Promise.all([
        fetch(`${this.basePath}/index/concepts.json`).then(r => r.json()),
        fetch(`${this.basePath}/index/topics.json`).then(r => r.json()),
        fetch(`${this.basePath}/index/predicates.json`).then(r => r.json())
      ]);
      this.indices = { concepts, topics, predicates };
    }
    return this.indices;
  }

  async loadContent(contentId) {
    if (this.cache.has(contentId)) {
      return this.cache.get(contentId);
    }
    
    const { contentType, path } = this.resolveContentPath(contentId);
    const response = await fetch(path);
    const content = await response.json();
    
    this.cache.set(contentId, content);
    return content;
  }
  
  async resolveContentPath(contentId) {
    // Resolve path based on content ID prefixes (UOR-C, UOR-R, UOR-T, UOR-P)
    // ...
  }
  
  async loadRelatedContent(contentId) {
    const indices = await this.loadIndices();
    const relatedPredicates = indices.predicates.itemListElement
      .filter(p => p.item.subjectOf?.["@id"] === contentId || 
                  p.item.targetCollection?.includes(contentId));
                  
    // Load all related content based on predicates
    // ...
  }
}
```

### 2. Content Renderers

Each content type has a specialized renderer:

```javascript
// Concept Renderer
function renderConcept(concept, options = {}) {
  return `
    <article class="concept" id="${concept["@id"]}">
      <header>
        <h1>${concept.name}</h1>
        <div class="concept-code">${concept.termCode}</div>
      </header>
      
      <div class="concept-description">${concept.description}</div>
      
      ${concept.mathExpression.map(expr => 
        `<div class="math-expression">${renderMathExpression(expr)}</div>`
      ).join('')}
      
      <div class="source-text">${renderMarkdown(concept.sourceText)}</div>
      
      ${options.showRelated ? renderRelatedConcepts(concept) : ''}
    </article>
  `;
}

// Information Resource Renderer
function renderInformationResource(resource, options = {}) {
  return `
    <article class="resource" id="${resource["@id"]}">
      <header>
        <h1>${resource.name}</h1>
      </header>
      
      <div class="resource-description">${resource.description}</div>
      
      <div class="resource-content">${renderMarkdown(resource.text)}</div>
      
      ${resource.hasPart.map(part => 
        `<section class="resource-part">${renderContent(part)}</section>`
      ).join('')}
      
      ${options.showRelated ? renderRelatedResources(resource) : ''}
    </article>
  `;
}

// Topic Renderer
function renderTopic(topic, options = {}) {
  return `
    <div class="topic" id="${topic["@id"]}">
      <header>
        <h1>${topic.name}</h1>
      </header>
      
      <div class="topic-description">${topic.description}</div>
      
      <div class="topic-contents">
        ${options.expandContents ? 
          topic.hasPart.map(part => renderContent(part)).join('') :
          renderContentList(topic.hasPart)
        }
      </div>
    </div>
  `;
}
```

### 3. Predicate-Based Assembly

Predicates define how content is related and assembled:

```javascript
async function assemblePathway(startingPoint, predicateTypes = ['follows', 'expands']) {
  const loader = new ContentLoader('/content/converted');
  const startContent = await loader.loadContent(startingPoint);
  
  // Find all related content via specified predicates
  const indices = await loader.loadIndices();
  const pathway = [startContent];
  
  // Build a pathway by following predicate chains
  let currentId = startingPoint;
  while (true) {
    const nextPredicate = indices.predicates.itemListElement
      .find(p => 
        p.item.subjectOf?.["@id"] === currentId && 
        predicateTypes.includes(p.item.name)
      );
      
    if (!nextPredicate) break;
    
    const targetId = nextPredicate.item.targetCollection[0];
    const nextContent = await loader.loadContent(targetId);
    pathway.push(nextContent);
    currentId = targetId;
  }
  
  return pathway;
}
```

## Integration with Frontend Frameworks

The modular nature allows integration with various frontend frameworks:

### React Implementation

```jsx
// React Component for Concept Rendering
function ConceptView({ conceptId }) {
  const [concept, setConcept] = useState(null);
  const [related, setRelated] = useState([]);
  
  useEffect(() => {
    const loader = new ContentLoader('/content/converted');
    
    async function loadData() {
      const conceptData = await loader.loadContent(conceptId);
      setConcept(conceptData);
      
      const relatedContent = await loader.loadRelatedContent(conceptId);
      setRelated(relatedContent);
    }
    
    loadData();
  }, [conceptId]);
  
  if (!concept) return <div>Loading...</div>;
  
  return (
    <article className="concept">
      <h1>{concept.name}</h1>
      <div className="description">{concept.description}</div>
      
      {concept.mathExpression?.map((expr, i) => (
        <MathExpression key={i} expression={expr} />
      ))}
      
      <div className="source-text">
        <MarkdownRenderer content={concept.sourceText} />
      </div>
      
      {related.length > 0 && (
        <section className="related-concepts">
          <h2>Related Concepts</h2>
          <RelatedList items={related} />
        </section>
      )}
    </article>
  );
}
```

### Vue Implementation

```vue
<!-- Vue Component for Information Resource -->
<template>
  <article class="resource" v-if="resource">
    <header>
      <h1>{{ resource.name }}</h1>
    </header>
    
    <div class="resource-description">{{ resource.description }}</div>
    
    <div class="resource-content">
      <markdown-renderer :content="resource.text" />
    </div>
    
    <section v-for="(part, index) in resource.hasPart" :key="index" class="resource-part">
      <content-renderer :content="part" />
    </section>
    
    <section v-if="related.length" class="related-resources">
      <h2>Related Information</h2>
      <related-list :items="related" />
    </section>
  </article>
  <div v-else>Loading...</div>
</template>

<script>
import { ContentLoader } from '@/utils/content-loader';
import MarkdownRenderer from '@/components/MarkdownRenderer.vue';
import ContentRenderer from '@/components/ContentRenderer.vue';
import RelatedList from '@/components/RelatedList.vue';

export default {
  components: {
    MarkdownRenderer,
    ContentRenderer,
    RelatedList
  },
  props: {
    resourceId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      resource: null,
      related: []
    };
  },
  async created() {
    const loader = new ContentLoader('/content/converted');
    this.resource = await loader.loadContent(this.resourceId);
    this.related = await loader.loadRelatedContent(this.resourceId);
  }
};
</script>
```

## Dynamic Navigation Generation

Navigation can be dynamically generated based on predicate relationships:

```javascript
async function generateNavigation() {
  const loader = new ContentLoader('/content/converted');
  const indices = await loader.loadIndices();
  
  // Get all topics as top-level navigation items
  const topicItems = indices.topics.itemListElement.map(topic => ({
    id: topic.item["@id"],
    name: topic.item.name,
    children: []
  }));
  
  // For each topic, find concepts that are part of it using predicates
  for (const topicItem of topicItems) {
    const relatedPredicates = indices.predicates.itemListElement
      .filter(p => 
        p.item.targetCollection?.includes(topicItem.id) && 
        p.item.name === 'partOf'
      );
      
    // Add related concepts as children
    for (const predicate of relatedPredicates) {
      const conceptId = predicate.item.subjectOf["@id"];
      const concept = await loader.loadContent(conceptId);
      
      topicItem.children.push({
        id: conceptId,
        name: concept.name,
        type: 'concept'
      });
    }
  }
  
  return topicItems;
}
```

## Search and Discovery

The modular format enables powerful search capabilities:

```javascript
async function searchContent(query, filters = {}) {
  const loader = new ContentLoader('/content/converted');
  const indices = await loader.loadIndices();
  
  // Combine all index items for searching
  const allItems = [
    ...indices.concepts.itemListElement.map(i => ({...i.item, type: 'concept'})),
    ...indices.topics.itemListElement.map(i => ({...i.item, type: 'topic'})),
    // Add resources too
  ];
  
  // Simple text search across fields
  const results = allItems.filter(item => {
    const matchesQuery = 
      item.name?.toLowerCase().includes(query.toLowerCase()) ||
      item.description?.toLowerCase().includes(query.toLowerCase());
      
    const matchesFilters = 
      !filters.type || item.type === filters.type;
      
    return matchesQuery && matchesFilters;
  });
  
  return results;
}
```

## Math Expression Rendering

Mathematical expressions are rendered using LaTeX libraries:

```javascript
function renderMathExpression(expression, options = { display: true }) {
  // Using MathJax, KaTeX or similar library
  return `<div class="math ${options.display ? 'display-math' : 'inline-math'}">
    ${katex.renderToString(expression, {
      displayMode: options.display,
      throwOnError: false
    })}
  </div>`;
}
```

## Media Handling

Content can include various media types:

```javascript
function renderMediaContent(media) {
  switch (media.contentUrl.split('.').pop().toLowerCase()) {
    case 'jpg':
    case 'png':
    case 'gif':
    case 'webp':
      return `<figure>
        <img src="${media.contentUrl}" alt="${media.name || 'Image'}" />
        ${media.caption ? `<figcaption>${media.caption}</figcaption>` : ''}
      </figure>`;
      
    case 'mp4':
    case 'webm':
      return `<figure>
        <video controls>
          <source src="${media.contentUrl}" type="video/${media.contentUrl.split('.').pop()}">
          Your browser doesn't support this video.
        </video>
        ${media.caption ? `<figcaption>${media.caption}</figcaption>` : ''}
      </figure>`;
      
    // Other media types...
  }
}
```

## Responsive Rendering

Content adapts to different screen sizes:

```css
/* Responsive design for content components */
.concept, .resource, .topic {
  max-width: 100%;
  margin: 0 auto;
}

@media (min-width: 768px) {
  .concept, .resource, .topic {
    max-width: 750px;
  }
  
  .with-sidebar {
    display: grid;
    grid-template-columns: 250px 1fr;
    gap: 2rem;
  }
}

@media (min-width: 1200px) {
  .concept, .resource, .topic {
    max-width: 900px;
  }
  
  .with-sidebar {
    grid-template-columns: 300px 1fr;
  }
  
  .with-related {
    display: grid;
    grid-template-columns: 1fr 250px;
    gap: 2rem;
  }
}
```

## Summary

The Schema.org JSON format can be rendered through:

1. A content loader that resolves and fetches JSON content
2. Specialized renderers for different content types
3. Predicate-based content assembly for dynamic pathways
4. Framework-specific components (React, Vue, etc.)
5. Dynamic navigation generation based on content relationships
6. Search and discovery features using the structured data
7. Special handling for mathematical expressions and media
8. Responsive design for different devices

This approach creates a flexible, modular rendering system that can adapt to different user interfaces while maintaining the semantic relationships between content.