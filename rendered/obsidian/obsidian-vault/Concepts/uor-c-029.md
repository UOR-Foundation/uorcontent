---
id: "urn:uor:concept:adjunction-representation"
title: "Adjunction and Representation Theory"
type: "concept"
tags:
  - "concept"
code: "UOR-C-029"
relatedConcepts:
  - "urn:uor:concept:prime-coordinate-functor"
  - "urn:uor:concept:universal-mapping-property"
---

# Adjunction and Representation Theory

The fundamental adjunction between the prime-coordinate functor and its right adjoint, along with representation theory aspects of the [[uor-c-001|UOR framework]].

## Definition

The prime-coordinate functor participates in a fundamental adjunction:
- Adjoint Pair: There exists a right adjoint Ψ: Mod → Obj to the functor φ such that: Hom_Mod(φ(X), M) ≅ Hom_Obj(X, Ψ(M)) for all objects X ∈ Obj and modules M ∈ Mod.
- Representability: The functor φ is representable in the sense that: φ(X) ≅ Hom_Obj(G, X) where G is the generating object or "universal probe".
- Yoneda Embedding: The prime-coordinate map can be viewed as a special case of the Yoneda embedding, with: φ(X) = Hom_Obj(P, X) where P is the collection of prime objects acting as "test objects".

## Mathematical Formulation

$
\text{Adjoint pair: } \phi \dashv \Psi \text{ where } \phi: Obj \to Mod \text{ and } \Psi: Mod \to Obj
$

$
Hom_{Mod}(\phi(X), M) \cong Hom_{Obj}(X, \Psi(M))
$

$
\text{Representability: } \phi(X) \cong Hom_{Obj}(G, X) \text{ for a generating object } G
$

$
\text{Yoneda embedding: } \phi(X) = Hom_{Obj}(P, X) \text{ where } P \text{ is the collection of prime objects}
$

## Related Concepts

- [[uor-c-027|prime coordinate functor]]
- [[uor-c-028|universal mapping property]]

## Metadata

- **ID:** urn:uor:concept:adjunction-representation
- **Code:** UOR-C-029
