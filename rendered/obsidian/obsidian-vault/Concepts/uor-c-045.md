---
id: "urn:uor:concept:universal-valuations"
title: "Universal Valuations"
type: "concept"
tags:
  - "concept"
code: "UOR-C-045"
relatedConcepts:
  - "urn:uor:concept:universal-number"
  - "urn:uor:concept:universal-prime-representation"
---

# Universal Valuations

The coherent system of valuations on universal numbers derived from their prime-coordinate structure, including prime-indexed valuations and the Archimedean meta-valuation.

## Definition

Universal numbers support a coherent system of valuations derived from their prime-coordinate structure:

Prime-Indexed Valuations
For each prime `p`, there exists a valuation `v_p` on `𝕌` defined by:
`v_p(α) = Re(e_p)`
where `e_p` is the p-th coordinate in the prime-coordinate representation of α.

Archimedean Meta-Valuation
The complex embedding induces an Archimedean valuation:
`v_∞(α) = log|z|`
where `z` is the complex value of α.

Product Formula
These valuations satisfy a generalized product formula that extends the classical formula of algebraic number theory:

Theorem 4 (Universal Product Formula): For any non-zero [[uor-c-034|universal number]] `α ∈ 𝕌*`:
`v_∞(α) + ∑_{p prime} v_p(α)·log(p) = 0`

This formula establishes a fundamental conservation principle across all valuations, unifying the perspectives of complex and p-adic analysis.

## Mathematical Formulation

$
\text{For each prime } p, \text{ there exists a valuation } v_p \text{ on } \mathbb{U} \text{ defined by:}
$

$
v_p(\alpha) = \text{Re}(e_p)
$

$
\text{where } e_p \text{ is the p-th coordinate in the prime-coordinate representation of } \alpha.
$

$
\text{The complex embedding induces an Archimedean valuation:}
$

$
v_\infty(\alpha) = \log|z|
$

$
\text{where } z \text{ is the complex value of } \alpha.
$

$
\text{Theorem 4 (Universal Product Formula): For any non-zero universal number } \alpha \in \mathbb{U}^*:
$

$
v_\infty(\alpha) + \sum_{p \text{ prime}} v_p(\alpha) \cdot \log(p) = 0
$

## Related Concepts

- [[uor-c-034|universal number]]
- [[uor-c-035|universal prime representation]]

## Metadata

- **ID:** urn:uor:concept:universal-valuations
- **Code:** UOR-C-045
