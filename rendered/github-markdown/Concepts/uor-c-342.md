# Harmonic Progression Coherence

A mathematical framework quantifying the coherence dynamics in chord progressions through prime decomposition, revealing the universal principles governing harmonic tension, resolution, and directional flow in music across diverse traditions.

## Definition

Harmonic Progression Coherence extends the UOR framework to sequences of chords, quantifying the dynamic coherence relationships that govern harmonic movement in music. This concept provides a mathematical foundation for understanding the universal principles of tension, resolution, and directional flow that underlie diverse harmonic traditions while accommodating their cultural specificity.

In this formalization, a harmonic progression is analyzed as a trajectory through prime coordinate space, with each chord representing a configuration of points in this space. The coherence relationships between successive chords, and the overall coherence gradient of the progression, reveal fundamental properties that explain how and why certain chord sequences create compelling musical narratives:

1. **Coherence Gradient Principle**: Effective harmonic progressions typically exhibit strategic coherence gradients—alternating increases and decreases in coherence that create patterns of tension and resolution. The analysis of these gradients in prime space explains why certain chord progressions (like ii-V-I or IV-V-I) recur across diverse musical traditions: they optimize this pattern of coherence change.

2. **Voice Leading Efficiency**: The prime decomposition quantifies the minimal distance between successive chord configurations in prime space, corresponding to the principle of voice leading efficiency. This explains why efficient voice leading is preferred in many traditions: it minimizes the transformation distance in prime coordinate space.

3. **Cadential Resolution Patterns**: The mathematical structure reveals why certain progressions function effectively as cadences: they represent maximal coherence increases following periods of coherence decrease, creating a strong sense of resolution and closure.

4. **Harmonic Rhythm Coherence**: The rate of coherence change correlates with perceived harmonic rhythm, explaining why certain chord changes feel more significant than others even when occupying the same temporal duration.

5. **Modulation Pathways**: The prime coordinate representation reveals optimal modulation routes between tonal centers as geodesic paths in prime space, explaining why certain modulations (to closely related keys) feel more natural than others.

For example, the common chord progression C-F-G-C in the key of C major can be analyzed through its coherence gradient:

- C major (I): Base coherence level in the tonic
- F major (IV): Slight coherence decrease with introduction of the subdominant
- G major (V): Further coherence decrease with the dominant seventh tension
- C major (I): Maximal coherence increase with return to tonic

This creates the characteristic tension-resolution pattern that drives Western functional harmony, but similar patterns can be identified in non-Western traditions through the same mathematical framework.

By applying this analysis to chord progressions from different musical traditions—from Western classical to jazz to Indian ragas to Japanese gagaku—we can:

- Identify the universal coherence principles underlying diverse harmonic practices
- Explain why certain progression types recur independently across cultures
- Generate novel progression types with specified emotional trajectories
- Predict the resolution tendencies of unfamiliar chord sequences
- Analyze non-functional harmony using the same mathematical framework

The Harmonic Progression Coherence concept provides a foundational explanation for why certain chord sequences 'work' across diverse musical traditions, revealing the deep mathematical patterns of coherence change that have shaped harmonic language throughout human musical history.

## Mathematical Formulation

$$
P = (C_1, C_2, ..., C_n) \text{ where } C_i \text{ are chords}
$$

$$
\text{ProgressionCoherence}(P) = \frac{1}{n-1} \sum_{i=1}^{n-1} \text{ChordCoherence}(C_i, C_{i+1})
$$

$$
\text{CoherenceGradient}(C_i, C_{i+1}) = \text{ChordCoherence}(C_{i+1}) - \text{ChordCoherence}(C_i)
$$

$$
\text{VoiceLeadingDistance}(C_i, C_{i+1}) = \sum_{j=1}^{|C_i|} \min_{k \in \{1,2,...,|C_{i+1}|\}} |\vec{\alpha_{ij}} - \vec{\alpha_{(i+1)k}}|^2
$$

$$
\text{DirectionalFlow}(P) = \sum_{i=1}^{n-1} \text{CoherenceGradient}(C_i, C_{i+1})
$$

## Related Concepts

- [chord-prime-topology](./chord-prime-topology.md)
- [musical-coherence-field](./musical-coherence-field.md)
- [coherence-preserving-dynamics](./coherence-preserving-dynamics.md)
- [coherence-preservation-condition](./coherence-preservation-condition.md)

## Metadata

- **ID:** urn:uor:concept:harmonic-progression-coherence
- **Type:** concept
- **Code:** UOR-C-342
- **Related Concepts:**
  - [chord-prime-topology](./chord-prime-topology.md)
  - [musical-coherence-field](./musical-coherence-field.md)
  - [coherence-preserving-dynamics](./coherence-preserving-dynamics.md)
  - [coherence-preservation-condition](./coherence-preservation-condition.md)
