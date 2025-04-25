---
id: "urn:uor:concept:temporal-correlation-function"
title: "Temporal Correlation Function"
type: "concept"
tags:
  - "concept"
code: "UOR-C-082"
relatedConcepts:
  - "urn:uor:concept:temporal-correlation-types"
  - "urn:uor:concept:temporal-correlation-structures"
  - "urn:uor:concept:coherence-norm"
---

# Temporal Correlation Function

A mathematical function that quantifies relationships between events at different times, allowing identification of correlations that exceed what conventional causal mechanisms can explain.

## Definition

For any two events E_1 at time t_1 and E_2 at time t_2, the [[uor-c-082|temporal correlation function]] is defined as:

C_T(E_1, E_2) = f(φ(E_1), φ(E_2))

Where φ(E_i) is the prime coordinate representation of event E_i, and f is a function measuring coherence between these representations.

This correlation function quantifies the degree of relationship between events regardless of their temporal ordering.

A temporal correlation is considered non-local if:

C_T(E_1, E_2) > C_max^local(Δt)

Where C_max^local(Δt) is the maximum possible correlation achievable through local causal mechanisms given the temporal separation Δt = |t_2 - t_1|.

This condition identifies correlations that exceed what conventional causal mechanisms can explain.

The degree of temporal entanglement between two events is quantified as:

E_T(E_1, E_2) = C_T(E_1, E_2)/C_max^local(Δt) - 1

This measure is positive for temporally entangled events and zero for conventionally correlated ones.

The apparent direction of causal influence between events is given by the asymmetry function:

D(E_1, E_2) = ∂C_T(E_1, E_2)/∂φ(E_1) - ∂C_T(E_1, E_2)/∂φ(E_2)

When D > 0, the influence appears to flow from E_1 to E_2; when D < 0, from E_2 to E_1; and when D ≈ 0, the relationship appears acausal or symmetric.

## Mathematical Formulation

$
\text{For any two events } E_1 \text{ at time } t_1 \text{ and } E_2 \text{ at time } t_2\text{,}
$

$
\text{the temporal correlation function is defined as:}
$

$
C_T(E_1, E_2) = f(\phi(E_1), \phi(E_2))
$

$
\text{Where } \phi(E_i) \text{ is the prime coordinate representation of event } E_i\text{,}
$

$
\text{and } f \text{ is a function measuring coherence between these representations.}
$

$
\text{A temporal correlation is considered non-local if:}
$

$
C_T(E_1, E_2) > C_{max}^{local}(\Delta t)
$

$
\text{Where } C_{max}^{local}(\Delta t) \text{ is the maximum possible correlation}
$

$
\text{achievable through local causal mechanisms given }
$

$
\text{the temporal separation } \Delta t = |t_2 - t_1|\text{.}
$

$
\text{The degree of temporal entanglement between events is quantified as:}
$

$
E_T(E_1, E_2) = \frac{C_T(E_1, E_2)}{C_{max}^{local}(\Delta t)} - 1
$

$
\text{The apparent direction of causal influence is given by the asymmetry function:}
$

$
D(E_1, E_2) = \frac{\partial C_T(E_1, E_2)}{\partial \phi(E_1)} - \frac{\partial C_T(E_1, E_2)}{\partial \phi(E_2)}
$

## Related Concepts

- [[uor-c-083|temporal correlation types]]
- [[uor-c-084|temporal correlation structures]]
- [[uor-c-005|coherence norm]]

## Metadata

- **ID:** urn:uor:concept:temporal-correlation-function
- **Code:** UOR-C-082
