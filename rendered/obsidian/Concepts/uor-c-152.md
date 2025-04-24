---
id: "urn:uor:concept:coherence-metric-induced"
title: "Coherence Metric"
type: "concept"
tags:
  - "concept"
code: "UOR-C-152"
---

# Coherence Metric

The metric induced by the coherence norm on the space of objects, defined as the norm of the quotient, which satisfies the standard axioms of a metric space and establishes a Euclidean structure.

## Mathematical Formulation

$$
d_c(x,y) = \|x/y\|_c = \|\phi(x) - \phi(y)\|_2
$$

$$
\text{Identity: } d_c(x,y) = 0 \iff x = y \text{ (modulo units)}
$$

$$
\text{Symmetry: } d_c(x,y) = d_c(y,x)
$$

$$
\text{Triangle Inequality: } d_c(x,z) \leq d_c(x,y) + d_c(y,z)
$$

$$
\langle x,y \rangle_c = \phi(x) \cdot \phi(y) = \sum_i e_i(x) \cdot e_i(y)
$$

$$
\cos\theta_{xy} = \frac{\langle x,y \rangle_c}{\|x\|_c \cdot \|y\|_c}
$$

## Metadata

- **ID:** urn:uor:concept:coherence-metric-induced
- **Code:** UOR-C-152
