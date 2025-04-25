---
id: "urn:uor:concept:computable-universal-number"
title: "Computable Universal Number"
type: "concept"
tags:
  - "concept"
code: "UOR-C-038"
relatedConcepts:
  - "urn:uor:concept:universal-number"
  - "urn:uor:concept:coordinate-computability"
---

# Computable Universal Number

A [[uor-c-034|universal number]] that can be effectively approximated to arbitrary precision through algorithmic means in both Archimedean and non-Archimedean metrics.

## Definition

Definition 1 ([[uor-c-038|Computable [[uor-c-034|Universal Number]]]]): A [[uor-c-034|universal number]] η ∈ 𝕌 is computable if:

1. There exists a Type-2 Turing machine M_η that, given precision parameter n, outputs an approximation q such that:
   - |η - q| < 2^(-n) in the complex metric
   - For any prime p, the p-adic distance |η - q|_p < p^(-n)
2. The prime-coordinate representation φ(η) is computable component-wise to arbitrary precision
3. The computation satisfies polynomial resource bounds in the precision parameter

## Mathematical Formulation

$
\text{Definition: A universal number } \eta \in \mathbb{U} \text{ is computable if:}
$

$
\text{1. There exists a Type-2 Turing machine } M_{\eta} \text{ that, given precision parameter } n,
$

$
\text{outputs an approximation } q \text{ such that:}
$

$
|\eta - q| < 2^{-n} \text{ in the complex metric}
$

$
\text{For any prime } p, \text{ the p-adic distance } |\eta - q|_p < p^{-n}
$

$
\text{2. The prime-coordinate representation } \phi(\eta) \text{ is computable component-wise}
$

$
\text{3. The computation satisfies polynomial resource bounds in the precision parameter}
$

## Related Concepts

- [[uor-c-034|universal number]]
- [[uor-c-039|coordinate computability]]

## Metadata

- **ID:** urn:uor:concept:computable-universal-number
- **Code:** UOR-C-038
