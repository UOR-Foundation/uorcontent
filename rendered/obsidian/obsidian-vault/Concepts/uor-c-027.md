---
id: "urn:uor:concept:prime-coordinate-functor"
title: "Prime Coordinate Functor"
type: "concept"
tags:
  - "concept"
code: "UOR-C-027"
relatedConcepts:
  - "urn:uor:concept:canonical-representation"
  - "urn:uor:concept:prime-decomposition"
---

# Prime Coordinate Functor

A fundamental functor φ between the category of objects and the category of graded modules, transforming multiplicative structures into additive ones.

## Definition

The prime-coordinate map can be understood as a fundamental functor between categories:
- Base Categories: Define Obj as the category of objects with composition and Mod as the category of graded modules.
- The Prime Functor: The map φ: Obj → Mod is a functor satisfying: φ(X ⊗ Y) = φ(X) ⊕ φ(Y) and φ(1_Obj) = 0_Mod, where ⊗ is composition in Obj and ⊕ is addition in Mod.
- Natural Transformation: The homomorphism property of φ manifests as a natural transformation η: ⊗ ⟹ φ^*⊕ between the composition functor and the pulled-back addition functor.
- Contravariant Properties: For inverse operations, φ exhibits contravariance: φ(X^{-1}) = -φ(X), ensuring compatibility with the group structure in both domains.

## Mathematical Formulation

$
\phi: Obj \to Mod \text{ is a functor such that:}
$

$
\phi(X \otimes Y) = \phi(X) \oplus \phi(Y)
$

$
\phi(1_{Obj}) = 0_{Mod}
$

$
\text{For inverse operations: } \phi(X^{-1}) = -\phi(X)
$

## Related Concepts

- [[uor-c-004|canonical representation]]
- [[uor-c-002|prime decomposition]]

## Metadata

- **ID:** urn:uor:concept:prime-coordinate-functor
- **Code:** UOR-C-027
