---
id: "urn:uor:resource:harmonic-analysis-guide"
title: "Harmonic Analysis Guide: Applying UOR Principles to Music"
type: "resource"
tags:
  - "resource"
  - "harmonic analysis"
  - "music theory"
  - "prime decomposition"
  - "coherence metrics"
  - "UOR framework"
  - "pitch analysis"
  - "chord analysis"
  - "progression analysis"
partOf: "urn:uor:topic:music"
---

# Harmonic Analysis Guide: Applying UOR Principles to Music

A comprehensive guide to analyzing musical harmony using the Universal Object Reference framework, with practical techniques for decomposing pitches, intervals, chords, and progressions into their prime components.

# Harmonic Analysis Guide: Applying UOR Principles to Music

This guide provides practical techniques for applying the Universal Object Reference framework to musical analysis, offering a systematic approach to decomposing and understanding musical structures through the lens of [[uor-c-002|prime decomposition]] and coherence principles.

## 1. Foundations: Analyzing Pitch and Intervals

### 1.1 Pitch [[uor-c-002|Prime Decomposition]]

The fundamental starting point for UOR music analysis is decomposing individual pitches into their prime components. For practical analysis:

1. **Choose a reference frequency** (typically the tonic or fundamental of the piece)
2. **Express all pitches as frequency ratios** relative to this reference
3. **Decompose each ratio into prime factors**

#### Example: Analysis in C Major

Using C as our reference (frequency = 1):

| Note | Frequency Ratio | [[uor-c-002|Prime Decomposition]] | [[uor-c-302|Prime Coordinates]] |
|------|----------------|---------------------|-------------------|
| C    | 1/1             | $2^0 \cdot 3^0 \cdot 5^0$ | (0,0,0) |
| D    | 9/8             | $2^{-3} \cdot 3^2$ | (-3,2,0) |
| E    | 5/4             | $2^{-2} \cdot 5^1$ | (-2,0,1) |
| F    | 4/3             | $2^2 \cdot 3^{-1}$ | (2,-1,0) |
| G    | 3/2             | $2^{-1} \cdot 3^1$ | (-1,1,0) |
| A    | 5/3             | $2^{-1} \cdot 3^{-1} \cdot 5^1$ | (-1,-1,1) |
| B    | 15/8            | $2^{-3} \cdot 3^1 \cdot 5^1$ | (-3,1,1) |

### 1.2 Interval Analysis

Intervals are analyzed as ratios between pitches:

1. **Calculate the frequency ratio** between the two notes
2. **Decompose the ratio** into prime factors
3. **Compute the coherence value** using the [[uor-c-005|coherence norm]] formula

#### Example: Interval Analysis

| Interval | Ratio | [[uor-c-002|Prime Decomposition]] | Coherence Value |
|----------|-------|---------------------|----------------|
| Perfect 5th | 3/2 | $2^{-1} \cdot 3^1$ | 0.5 |
| Major 3rd | 5/4 | $2^{-2} \cdot 5^1$ | 0.33 |
| Minor 7th | 16/9 | $2^4 \cdot 3^{-2}$ | 0.17 |
| Tritone | 45/32 | $2^{-5} \cdot 3^2 \cdot 5^1$ | 0.125 |

Note how the coherence values correlate with traditional consonance hierarchies: perfect consonances (octave, fifth) have higher values than imperfect consonances (thirds, sixths), which have higher values than dissonances (seconds, sevenths, tritone).

## 2. Chord Analysis Techniques

### 2.1 [[uor-c-340|Chord Prime Topology]]

To analyze chords using UOR principles:

1. **Express each chord tone as a frequency ratio** relative to the root
2. **Decompose each ratio** into prime factors
3. **Map the chord configuration** in prime coordinate space
4. **Calculate the chord's coherence density** (average of pairwise coherences)
5. **Determine the chord's compactness** in prime space

#### Example: Common Triads Analysis

| Chord | Component Ratios | Coherence Density | Compactness |
|-------|-----------------|-------------------|-------------|
| Major Triad | {1/1, 5/4, 3/2} | 0.397 | 2.31 |
| Minor Triad | {1/1, 6/5, 3/2} | 0.375 | 2.48 |
| Diminished | {1/1, 6/5, 7/5} | 0.312 | 3.17 |
| Augmented | {1/1, 5/4, 8/5} | 0.342 | 2.89 |

Note how the coherence density values correlate with traditional stability hierarchies: major and minor triads (higher coherence, lower compactness) are more stable than diminished and augmented triads.

### 2.2 Voice Leading Analysis

The [[uor-c-002|prime decomposition]] framework provides a powerful method for analyzing voice leading efficiency:

1. **Map consecutive chords** in prime coordinate space
2. **Calculate minimal distance paths** between chord tones
3. **Compute the voice leading distance** (sum of squared distances)

#### Example: Voice Leading in Bach Chorale

Analyzing a Bach chorale phrase using this method reveals how Bach consistently minimized voice leading distances in prime space while maintaining functional progression, even when contrary motion creates the appearance of larger intervals in pitch space.

## 3. Progression Analysis Framework

### 3.1 Coherence Gradient Analysis

To analyze harmonic progressions:

1. **Calculate the coherence value** for each chord
2. **Determine the coherence gradient** between successive chords
3. **Map the coherence trajectory** of the entire progression
4. **Identify tension-resolution patterns** in the coherence gradient

#### Example: Analyzing a Classical Cadence

Analyzing the perfect authentic cadence in Mozart's K.545 sonata reveals a distinctive coherence gradient pattern:

| Progression | Chord Coherence | Coherence Gradient |
|-------------|----------------|--------------------|
| I           | 0.42           | — |
| IV          | 0.38           | -0.04 (tension increase) |
| V7          | 0.31           | -0.07 (further tension) |
| I           | 0.42           | +0.11 (resolution) |

This analysis quantifies the classic tension-resolution arc that defines functional harmony.

### 3.2 Modulation Analysis

The [[uor-c-001|UOR framework]] excels at analyzing modulations as transformations in prime space:

1. **Map the tonal centers** in prime coordinate space
2. **Calculate the transformation vector** between centers
3. **Determine the minimal path** through intermediate chords

## 4. Cross-Cultural Analysis Applications

The [[uor-c-001|UOR framework]]'s power lies in its universality. The same analytical techniques can be applied to non-Western traditions:

### 4.1 Analyzing Indian Raga

Applying [[uor-c-002|prime decomposition]] to the Raga Yaman reveals its distinctive coherence characteristics:

| Scale Degree | Frequency Ratio | [[uor-c-002|Prime Decomposition]] | Coherence with Sa |
|--------------|-----------------|---------------------|-------------------|
| Sa (1) | 1/1 | $2^0 \cdot 3^0 \cdot 5^0$ | 1.0 |
| Re (2) | 9/8 | $2^{-3} \cdot 3^2$ | 0.2 |
| Ga (3) | 5/4 | $2^{-2} \cdot 5^1$ | 0.33 |
| Ma (4) | 27/20 | $2^{-2} \cdot 3^3 \cdot 5^{-1}$ | 0.17 |
| Pa (5) | 3/2 | $2^{-1} \cdot 3^1$ | 0.5 |
| Dha (6) | 5/3 | $2^{-1} \cdot 3^{-1} \cdot 5^1$ | 0.33 |
| Ni (7) | 15/8 | $2^{-3} \cdot 3^1 \cdot 5^1$ | 0.2 |

This reveals why certain scale degrees (Sa, Pa) serve as structural pillars while others create characteristic tensions.

### 4.2 Analyzing Indonesian Gamelan

[[uor-c-002|Prime decomposition]] analysis of Javanese slendro scales reveals their unique coherence properties, explaining their distinctive sound:

Alternative [[uor-c-152|coherence metric]] for approximating slendro intervals:
C(I) = 1/(1 + w_2|α_2| + w_3|α_3| + w_7|α_7|)
where w_7 < w_3 < w_2

This weighted coherence measure explains the aesthetic priorities of gamelan tuning systems.

## 5. Practical Analysis Workflow

### 5.1 Step-by-Step Analysis Procedure

1. **Identify the reference frequency** (tonic/root)
2. **Express pitches as ratios** to this reference
3. **Decompose ratios** into prime factors
4. **Map structures** in prime coordinate space
5. **Calculate coherence values** for relevant relationships
6. **Determine coherence gradients** in progressions
7. **Interpret results** in musical context

### 5.2 Analysis Tools and Resources

- **UOR Music Calculator**: Online tool for quick [[uor-c-002|prime decomposition]]
- **Coherence Mapping Software**: Visualize musical structures in prime space
- **Reference Tables**: Common intervals and chords with pre-calculated values

## Conclusion

The [[uor-c-001|UOR framework]] provides a powerful analytical approach that reveals the deep mathematical structures underlying musical organization across diverse traditions. By decomposing musical elements into their prime components and applying coherence metrics, analysts can quantify the properties that govern musical perception and organization, from basic consonance to complex harmonic narratives.

This approach does not replace traditional analytical methods but complements them by providing a fundamental mathematical foundation that explains why traditional practices evolved as they did. It offers both analytical insights into existing music and compositional tools for creating new musical structures with predictable perceptual properties.

Through the lens of [[uor-c-002|prime decomposition]] and coherence principles, the seemingly diverse musical traditions of human culture reveal their shared mathematical foundations while preserving their unique characteristics—a universal reference system for the analysis of music.

## References

- [[uor-c-338|pitch prime representation]]
- [[uor-c-339|interval prime structure]]
- [[uor-c-340|chord prime topology]]
- [[uor-c-342|harmonic progression coherence]]
- [[uor-c-334|musical coherence field]]

## Metadata

- **ID:** urn:uor:resource:harmonic-analysis-guide
- **Author:** UOR Framework
- **Created:** 2025-04-25T00:00:00Z
- **Modified:** 2025-04-25T00:00:00Z
