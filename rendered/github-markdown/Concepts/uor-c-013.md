# Prime Structure Bundle

The first level of the UOR bundle hierarchy that focuses on the intrinsic prime structure, with primes as the base space and exponent groups as fibers.

## Definition

The first level of the UOR bundle hierarchy focuses on the intrinsic prime structure. Its base space is the set of intrinsic primes P with the discrete topology. The fiber is the valuation group ℤ given by prime exponents, or ℤ₊ in purely integral contexts. The total space E₁ = ⊔_{p∈P} {p} × ℤ contains pairs (p,a) where p is a prime and a is its exponent. The projection π₁: E₁ → P is defined by π₁(p,a) = p, forgetting the exponent. For an object X, its section s_X: P → E₁ is given by s_X(p) = (p, φ(X)(p)), mapping each prime to its exponent in X.

## Mathematical Formulation

$$
E_1 = \bigsqcup_{p\in P} \{p\} \times \mathbb{Z}
$$

$$
\pi_1: E_1 \to P
$$

$$
s_X(p) = (p, \phi(X)(p))
$$

## Related Concepts

- [fiber-bundle](./fiber-bundle.md)
- [prime-decomposition](./prime-decomposition.md)
- [intrinsic-primes](./intrinsic-primes.md)

## Metadata

- **ID:** urn:uor:concept:prime-structure-bundle
- **Type:** concept
- **Code:** UOR-C-013
- **Related Concepts:**
  - [fiber-bundle](./fiber-bundle.md)
  - [prime-decomposition](./prime-decomposition.md)
  - [intrinsic-primes](./intrinsic-primes.md)
