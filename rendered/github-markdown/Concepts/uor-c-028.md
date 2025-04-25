# Universal Mapping Property

A fundamental property of the prime-coordinate functor that characterizes it uniquely as the universal linearization of multiplicative structures.

## Definition

The prime-coordinate functor possesses a universal property that characterizes it uniquely:
- Universal Linearization: For any functor F: Obj → A from objects to an abelian category A satisfying F(X ⊗ Y) = F(X) ⊕ F(Y), there exists a unique natural transformation α: φ → F.
- Universal Factorization: Formally, for any additive functor H: Mod → A, we have F = H ∘ φ, making φ the universal factorization of any additive representation of Obj.
- Terminal Property: In the category of homomorphisms from (Obj, ⊗) to abelian groups, φ is terminal.
- Universal Logarithm: The prime-coordinate functor serves as the universal logarithm, transforming multiplicative structures into additive ones through the formula: log(X ⊗ Y) = log(X) + log(Y), where log = φ in the UOR context.

## Mathematical Formulation

$$
\text{For any functor } F: Obj \to A \text{ satisfying } F(X \otimes Y) = F(X) \oplus F(Y)
$$

$$
\text{there exists a unique natural transformation } \alpha: \phi \to F
$$

$$
\text{Formally: } F = H \circ \phi \text{ for some additive functor } H: Mod \to A
$$

$$
\text{Universal logarithm property: } log(X \otimes Y) = log(X) + log(Y) \text{ where } log = \phi
$$

## Related Concepts

- [prime-coordinate-functor](./prime-coordinate-functor.md)
- [canonical-representation](./canonical-representation.md)

## Metadata

- **ID:** urn:uor:concept:universal-mapping-property
- **Type:** concept
- **Code:** UOR-C-028
- **Related Concepts:**
  - [prime-coordinate-functor](./prime-coordinate-functor.md)
  - [canonical-representation](./canonical-representation.md)
