---
id: "urn:uor:concept:coherence-as-value"
title: "Coherence as Value"
type: "concept"
tags:
  - "concept"
code: "UOR-C-225"
---

# Coherence as Value

## Description

The principle that ethical and aesthetic values find grounding in coherence principles, where beauty corresponds to optimal information compression and moral goods align with actions that preserve coherence across multiple frames.

## Mathematical Formulation

$
\text{Beauty}(x) \propto \frac{I(x)}{\|\phi(x)\|} \text{ where } I(x) \text{ is information content}
$

$
\text{Moral Value}(A) = \min_{F,G \in \mathcal{F}} \text{Coherence}(\phi_F(A), \phi_G(A))
$

$
\text{Ethical Optimization: } A^* = \operatorname{argmax}_A \sum_{F \in \mathcal{F}} \text{Coherence}(F, A)
$

$
\text{Justice Measure: } J(S) = \min_{i,j} \text{Coherence}(\phi_i(S), \phi_j(S))
$

$
\text{Value Gradient: } \nabla V(x) = \nabla\left(\sum_i \omega_i \cdot \text{Coherence}_i(x)\right)
$

## Metadata

- **ID:** urn:uor:concept:coherence-as-value
- **Code:** UOR-C-225
