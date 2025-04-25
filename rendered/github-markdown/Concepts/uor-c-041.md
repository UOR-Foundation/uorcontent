# Computational Complexity Classes of Universal Numbers

The hierarchy of universal numbers based on the computational resources required for their approximation, from polynomial-time to exponential-time and beyond.

## Definition

Universal numbers form a natural computational hierarchy based on resource requirements:

Polynomial-Time Computable Universal Numbers
The class 𝕌_P consists of universal numbers computable in polynomial time:
```
𝕌_P = {η ∈ 𝕌 | η is approximable to n bits of precision in time O(n^c) for some c}
```
This class includes:
- All rational numbers
- Algebraic numbers of bounded degree
- Specific transcendental constants with rapidly converging series (e, π, etc.)
- Numbers with regular prime-coordinate patterns

Exponential-Time Computable Universal Numbers
The class 𝕌_EXP includes numbers requiring exponential computational resources:
```
𝕌_EXP = {η ∈ 𝕌 | η is approximable to n bits of precision in time O(2^(n^c)) for some c}
```
This encompasses many higher-degree algebraic numbers and transcendental numbers with more complex coordinate patterns.

Theorem 5 (Effective Enumeration): The set of computable universal numbers 𝕌_c is countable and admits an effective enumeration:
```
𝕌_c = {η₀, η₁, η₂, ...}
```
where each η_i is computable by a Type-2 Turing machine M_i, and the mapping i ↦ M_i is effectively computable.

## Mathematical Formulation

$$
\text{Polynomial-Time Computable Universal Numbers:}
$$

$$
\mathbb{U}_P = \{\eta \in \mathbb{U} \mid \eta \text{ is approximable to } n \text{ bits of precision in time } O(n^c) \text{ for some } c\}
$$

$$
\text{Exponential-Time Computable Universal Numbers:}
$$

$$
\mathbb{U}_{EXP} = \{\eta \in \mathbb{U} \mid \eta \text{ is approximable to } n \text{ bits of precision in time } O(2^{n^c}) \text{ for some } c\}
$$

$$
\text{The set of all computable universal numbers } \mathbb{U}_c \text{ is countable and admits an effective enumeration}
$$

$$
\mathbb{U}_c = \{\eta_0, \eta_1, \eta_2, \ldots\}
$$

## Related Concepts

- [computable-universal-number](./computable-universal-number.md)
- [universal-number-algorithms](./universal-number-algorithms.md)

## Metadata

- **ID:** urn:uor:concept:computational-complexity-classes
- **Type:** concept
- **Code:** UOR-C-041
- **Related Concepts:**
  - [computable-universal-number](./computable-universal-number.md)
  - [universal-number-algorithms](./universal-number-algorithms.md)
