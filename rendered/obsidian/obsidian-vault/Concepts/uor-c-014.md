---
id: "urn:uor:concept:observer-frame-bundle"
title: "Observer Frame Bundle"
type: "concept"
tags:
  - "concept"
code: "UOR-C-014"
relatedConcepts:
  - "urn:uor:concept:fiber-bundle"
  - "urn:uor:concept:observer-reference-frames"
  - "urn:uor:concept:observer-invariance"
---

# Observer Frame Bundle

The second level of the UOR bundle hierarchy that encapsulates observer perspectives, with objects as the base space and reference frames as fibers.

## Definition

The second level of the UOR bundle hierarchy encapsulates observer perspectives. Its base space is the set of all objects 𝒰 with a natural topology induced by the prime-coordinate metric. The fiber is the set R of all admissible reference frames, each encoding a choice of coordinate conventions, normalization, or grouping rules. The total space E₂ = 𝒰 × R contains pairs (X,r) of an object with a [[uor-c-313|reference frame]]. The projection π₂: E₂ → 𝒰 is defined by π₂(X,r) = X, forgetting the frame. The structure group G₂ = Aut(R) is the group of [[uor-c-018|frame transformations]] preserving frame structure. The intrinsic prime frame provides a global section σ₀: 𝒰 → E₂ given by σ₀(X) = (X, r₀) where r₀ is the canonical prime-coordinate frame.

## Mathematical Formulation

$
E_2 = \mathcal{U} \times R
$

$
\pi_2: E_2 \to \mathcal{U}
$

$
\sigma_0(X) = (X, r_0)
$

## Related Concepts

- [[uor-c-012|fiber bundle]]
- [[uor-c-006|observer reference frames]]
- [[uor-c-003|observer invariance]]

## Metadata

- **ID:** urn:uor:concept:observer-frame-bundle
- **Code:** UOR-C-014
