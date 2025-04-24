---
id: "urn:uor:concept:polynomial-extension"
title: "Polynomial Extension"
type: "concept"
tags:
  - "concept"
code: "UOR-C-188"
---

# Polynomial Extension

The extension of the UOR framework to polynomial rings, where irreducible polynomials serve as primes and exponents represent factor multiplicity in the prime coordinate representation.

## Mathematical Formulation

$$
p(x) = a \cdot q_1(x)^{e_1} \cdot q_2(x)^{e_2} \cdot \ldots \cdot q_n(x)^{e_n}
$$

$$
\phi(p(x)) = [(q_1, e_1), (q_2, e_2), \ldots, (q_n, e_n)]
$$

$$
\phi(p(x) \cdot r(x)) = \phi(p(x)) + \phi(r(x))
$$

$$
\phi(p(x)/q(x)) = \phi(p(x)) - \phi(q(x))
$$

## Metadata

- **ID:** urn:uor:concept:polynomial-extension
- **Code:** UOR-C-188
