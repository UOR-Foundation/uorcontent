---
id: "urn:uor:concept:formal-ufd-axiom"
title: "UOR Unique Factorization Domain Axiom"
type: "concept"
tags:
  - "concept"
code: "UOR-C-202"
---

# UOR Unique Factorization Domain Axiom

The formal axiomatization of [[uor-c-301|unique factorization]] in the [[uor-c-001|UOR framework]], requiring that every non-unit object admits a unique finite decomposition into irreducible objects.

## Mathematical Formulation

$
\text{Axiom (UFD): Let } \mathcal{U} \text{ be a category with finite products and a set of irreducibles } P.
$

$
1. \forall X \in \mathcal{U}, X \not\cong 1 \Rightarrow X \cong p_1 \circ \ldots \circ p_k \text{ with } p_i \in P
$

$
2. \text{If } X \cong q_1 \circ \ldots \circ q_m \text{ is another decomposition, then } m=k \text{ and } \exists \sigma \text{ s.t. } q_i \cong p_{\sigma(i)}
$

$
\phi: \mathcal{U} \to \mathbb{Z}^{(P)} \text{ maps } X \mapsto \text{(exponents of primes in factorization of X)}
$

## Metadata

- **ID:** urn:uor:concept:formal-ufd-axiom
- **Code:** UOR-C-202
