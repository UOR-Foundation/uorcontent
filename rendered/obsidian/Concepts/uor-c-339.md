---
id: "urn:uor:concept:interval-prime-structure"
title: "Interval Prime Structure"
type: "concept"
tags:
  - "concept"
code: "UOR-C-339"
relatedConcepts:
  - "urn:uor:concept:pitch-prime-representation"
  - "urn:uor:concept:harmonic-prime-decomposition"
  - "urn:uor:concept:musical-coherence-field"
  - "urn:uor:concept:observer-coherence"
---

# Interval Prime Structure

## Description

A mathematical formalization of musical intervals as prime ratio relationships, revealing the intrinsic coherence properties that govern consonance, dissonance, and interval function across different musical contexts.

## Definition

[[uor-c-339|Interval Prime Structure]] extends the [[uor-c-001|UOR framework]]'s principle of [[uor-c-002|prime decomposition]] to musical intervals, formalizing the inherent mathematical relationships between tones that underlie diverse musical traditions. This concept provides a unified mathematical foundation for understanding consonance, dissonance, and interval function that transcends cultural boundaries while accommodating cultural variations in perception.

In this framework, any musical interval is represented as a frequency ratio decomposed into its prime factors, where each prime represents a fundamental dimension of harmonic space. For example:

- Perfect fifth (3:2): $I = 3^1 \cdot 2^{-1}$
- Major third (5:4): $I = 5^1 \cdot 2^{-2}$
- Minor seventh (16:9): $I = 2^4 \cdot 3^{-2}$

This prime structure reveals several profound insights:

1. **Hierarchical Consonance Principle**: Intervals with simpler prime structures (lower prime numbers, smaller exponents) generally exhibit higher coherence values, correlating with perceived consonance across cultures. The perfect fifth (3:2) and perfect fourth (4:3) have the simplest structures after the octave (2:1), explaining their universal prevalence.

2. **Cultural Weighting Function**: Different musical traditions can be modeled by applying distinct weighting factors to prime components, explaining why certain intervals (like thirds) may be treated as consonant in some traditions but dissonant in others.

3. **Interval Vector Space**: The prime structure creates a multi-dimensional vector space where intervals can be mapped, measured, and transformed. The distance between intervals in this space correlates with perceived harmonic relatedness.

4. **Functional Equivalence Classes**: Intervals with related prime structures (differing only by octave displacement) form equivalence classes, explaining why they often serve similar harmonic functions despite different acoustic properties.

5. **Just vs. Tempered Approximation**: The prime structure quantifies the deviation between just intervals (exact prime ratios) and their equal-tempered approximations, predicting perceptual 'beating' phenomena.

The [[uor-c-339|Interval Prime Structure]] concept provides a rigorous foundation for analyzing interval relationships in any tuning system, from Pythagorean tuning to just intonation to equal temperament, revealing the fundamental mathematical structures that underlie the diversity of human musical expression. It explains why certain interval combinations create stable consonances while others generate tension requiring resolution, forming the basis for harmonic progression analysis in the [[uor-c-001|UOR framework]].

By applying the [[uor-c-005|coherence norm]] to interval prime structures, we can precisely quantify the inherent stability of different intervals and predict their behavior in various musical contexts, from traditional Western harmony to microtonal systems and non-Western traditions.

## Mathematical Formulation

$
I(f_1, f_2) = \frac{f_2}{f_1} = \prod_{i=1}^{n} p_i^{\alpha_i} \text{ where } p_i \text{ are prime numbers}
$

$
\text{SimpleCoherence}(I) = \frac{1}{1 + \sum_{i=1}^{n} |\alpha_i|}
$

$
\text{WeightedCoherence}(I) = \frac{1}{1 + \sum_{i=1}^{n} w_i|\alpha_i|} \text{ where } w_i \text{ are cultural weighting factors}
$

$
\text{IntervalDistance}(I_1, I_2) = \sqrt{\sum_{i=1}^{n} (\alpha_i^{(1)} - \alpha_i^{(2)})^2}
$

## Related Concepts

- [[uor-c-338|Pitch Prime Representation]]
- [[uor-c-333|Harmonic Prime Decomposition]]
- [[uor-c-334|Musical Coherence Field]]
- [[uor-c-016|Observer Coherence]]

## Metadata

- **ID:** urn:uor:concept:interval-prime-structure
- **Code:** UOR-C-339
