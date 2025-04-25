---
id: "urn:uor:concept:universal-analytic-functions"
title: "Universal Analytic Functions"
type: "concept"
tags:
  - "concept"
code: "UOR-C-052"
relatedConcepts:
  - "urn:uor:concept:universal-derivative"
  - "urn:uor:concept:universal-integration"
---

# Universal Analytic Functions

Functions in the [[uor-c-034|universal number]] domain that can be represented locally by power series converging in both Archimedean and all non-Archimedean metrics.

## Definition

[[uor-c-052|Universal analytic functions]] extend complex and p-adic analytic functions:

Definition 3 (Universal Analyticity): A function f: 𝕌 → 𝕌 is universally analytic if it can be represented locally by a power series:

`f(η) = ∑ a_n (η - α)^n`

that converges in both the Archimedean and all non-Archimedean metrics.

Theorem 4 (Characterization of Universal Analytics): A function is universally analytic if and only if:

1. It is complex analytic with respect to the complex embedding
2. It is p-adically analytic with respect to every p-adic embedding
3. The coefficients of the power series representations in different domains are compatible

This characterization establishes universal analyticity as a strong unifying concept across different analytical traditions.

Theorem 5 (Universal Taylor Expansion): Every universally analytic function f admits a Taylor expansion around any point α ∈ 𝕌:

`f(η) = ∑ f^(n)(α)/n! · (η - α)^n`

where the convergence is uniform in the universal metric within the domain of analyticity.

Theorem 6 (Universal Radius of Convergence): For a power series centered at α ∈ 𝕌, there exists a universal radius of convergence R_𝕌 such that:

1. The series converges absolutely for all η with d_𝕌(η, α) < R_𝕌
2. The series diverges for all η with d_𝕌(η, α) > R_𝕌
3. The radius R_𝕌 can be computed from the coefficients using the formula:
   `R_𝕌 = 1/limsup |a_n|^(1/n)`
   where the limsup is taken with respect to the universal norm

## Mathematical Formulation

$
\text{Definition 3 (Universal Analyticity): A function } f: \mathbb{U} \to \mathbb{U}
$

$
\text{is universally analytic if it can be represented locally by a power series:}
$

$
f(\eta) = \sum_{n=0}^{\infty} a_n (\eta - \alpha)^n
$

$
\text{that converges in both the Archimedean and all non-Archimedean metrics.}
$

$
\text{Theorem 4 (Characterization of Universal Analytics): A function is universally}
$

$
\text{analytic if and only if:}
$

$
\text{1. It is complex analytic with respect to the complex embedding}
$

$
\text{2. It is p-adically analytic with respect to every p-adic embedding}
$

$
\text{3. The coefficients of the power series representations in different domains are compatible}
$

## Related Concepts

- [[uor-c-050|universal derivative]]
- [[uor-c-051|universal integration]]

## Metadata

- **ID:** urn:uor:concept:universal-analytic-functions
- **Code:** UOR-C-052
