# Pitch Prime Representation

A mathematical framework decomposing musical pitch into prime frequency ratios, establishing a canonical coordinate system for tonal relationships independent of cultural tuning systems.

## Definition

The Pitch Prime Representation concept extends the Universal Object Reference framework to musical pitch, providing a canonical, observer-invariant representation system for musical tones. This approach decomposes any musical pitch into its prime frequency components, revealing the intrinsic mathematical relationships between tones independent of cultural tuning systems or notation conventions.

In this representation, each pitch is expressed as a product of prime numbers raised to rational exponents, where the primes function as basis vectors in a musical coordinate system. The frequency ratio between two pitches—the fundamental measure of musical interval—becomes a product of prime powers, with the exponents representing the coordinate differences in this prime space.

This representation reveals why certain intervals are perceived as consonant across cultures: intervals with simple prime factorizations (like the perfect fifth with ratio 3/2 or the major third with ratio 5/4) yield higher coherence values in the UOR framework, correlating with perceptual consonance. Complex intervals with larger prime factors or higher exponents yield lower coherence values, corresponding to perceived dissonance.

The Pitch Prime Representation provides several key insights:

1. **Invariance Across Tuning Systems**: While different cultures use diverse tuning systems, the prime decomposition reveals invariant structures underlying these systems.

2. **Canonical Harmonic Relationships**: Just intonation intervals have exact prime ratio representations (3/2 for perfect fifth, 5/4 for major third), while equal temperament approximates these ratios.

3. **Hierarchical Tonal Space**: The prime factorization naturally organizes pitch relationships in a multi-dimensional space where each prime represents an independent harmonic dimension.

4. **Mathematical Foundation for Consonance**: The coherence norm applied to pitch ratios provides a mathematical model for consonance that aligns with cross-cultural perceptual data.

This concept forms the foundation for more complex musical structures like chords, scales, and harmonic progressions in the UOR framework.

## Mathematical Formulation

$$
P(f) = \prod_{i=1}^{n} p_i^{\alpha_i} \text{ where } f \text{ is frequency, } p_i \text{ are prime numbers, and } \alpha_i \in \mathbb{Q}
$$

$$
R(f_1, f_2) = \frac{f_1}{f_2} = \prod_{i=1}^{n} p_i^{\beta_i} \text{ where } \beta_i = \alpha_i^{(1)} - \alpha_i^{(2)}
$$

$$
\text{Coherence}(f_1, f_2) = \frac{1}{1 + \sum_{i=1}^{n} |\beta_i|}
$$

## Related Concepts

- [harmonic-prime-decomposition](./harmonic-prime-decomposition.md)
- [prime-decomposition](./prime-decomposition.md)
- [canonical-representation](./canonical-representation.md)
- [spectral-musical-analysis](./spectral-musical-analysis.md)

## Metadata

- **ID:** urn:uor:concept:pitch-prime-representation
- **Type:** concept
- **Code:** UOR-C-338
- **Related Concepts:**
  - [harmonic-prime-decomposition](./harmonic-prime-decomposition.md)
  - [prime-decomposition](./prime-decomposition.md)
  - [canonical-representation](./canonical-representation.md)
  - [spectral-musical-analysis](./spectral-musical-analysis.md)
