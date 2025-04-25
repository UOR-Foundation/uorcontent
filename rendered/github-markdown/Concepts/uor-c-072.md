# Temporal Prime Categories

The fundamental classifications of temporal prime elements that span the space of possible dynamical behaviors in the Universal Object Reference framework.

## Definition

Temporal primes fall into several fundamental categories that span the space of possible dynamical behaviors:

1. Oscillatory Primes: These primes represent fundamentally periodic patterns with characteristic frequencies. Unlike simple sinusoids, they can have complex waveforms that are irreducible to simpler components.
   Examples: Limit cycles in dynamical systems, biological rhythms (circadian, ultradian), seasonal and astronomical cycles
   Formal representation: p_osc(t) = F(t/τ_p) where F(t + 1) = F(t)

2. Growth/Decay Primes: These primes capture fundamental patterns of growth and decay, beyond simple exponential behavior.
   Examples: Biological growth patterns (logistic, Gompertz), resource depletion curves, learning and forgetting curves
   Formal representation: p_growth(t) = G(t/τ_p) where lim_(t→∞)G(t) = K

3. Transition Primes: These primes represent irreducible patterns of transition between states, capturing how systems change from one regime to another.
   Examples: Phase transitions in physical systems, developmental transitions in biological systems, paradigm shifts in social systems
   Formal representation: p_trans(t) = T((t-t_0)/τ_p) where lim_(t→-∞)T(t) = A, lim_(t→∞)T(t) = B

4. Fluctuation Primes: These primes capture patterns of stochastic variation that can't be reduced to simpler components.
   Examples: Quantum fluctuations, turbulence patterns, social behavior fluctuations
   Formal representation: p_fluct(t) = S(t/τ_p) where S has characteristic statistical properties

5. Attractor Primes: These primes represent irreducible attractor structures in phase space.
   Examples: Strange attractors in chaotic systems, Nash equilibria in game-theoretic systems, homeostatic attractors in biological systems
   Formal representation: p_attr(x⃗) = A(x⃗) where A defines an irreducible attractor structure

## Mathematical Formulation

$$
\text{Temporal primes fall into several fundamental categories:}
$$

$$
\text{1. Oscillatory Primes: } p_{osc}(t) = F(t/\tau_p) \text{ where } F(t + 1) = F(t)
$$

$$
\text{   (fundamentally periodic patterns with complex irreducible waveforms)}
$$

$$
\text{2. Growth/Decay Primes: } p_{growth}(t) = G(t/\tau_p) \text{ where } \lim_{t\to\infty}G(t) = K
$$

$$
\text{   (fundamental patterns of growth and decay beyond simple exponential behavior)}
$$

$$
\text{3. Transition Primes: } p_{trans}(t) = T((t-t_0)/\tau_p) \text{ where}
$$

$$
\text{   } \lim_{t\to-\infty}T(t) = A, \lim_{t\to\infty}T(t) = B
$$

$$
\text{   (irreducible patterns of transition between states)}
$$

$$
\text{4. Fluctuation Primes: } p_{fluct}(t) = S(t/\tau_p) \text{ where}
$$

$$
\text{   S has characteristic statistical properties}
$$

$$
\text{   (patterns of stochastic variation that can't be reduced to simpler components)}
$$

$$
\text{5. Attractor Primes: } p_{attr}(\vec{x}) = A(\vec{x}) \text{ where}
$$

$$
\text{   A defines an irreducible attractor structure}
$$

$$
\text{   (irreducible attractor structures in phase space)}
$$

## Related Concepts

- [temporal-prime-element](./temporal-prime-element.md)
- [temporal-prime-factorization](./temporal-prime-factorization.md)
- [temporal-decomposition-methods](./temporal-decomposition-methods.md)

## Metadata

- **ID:** urn:uor:concept:temporal-prime-categories
- **Type:** concept
- **Code:** UOR-C-072
- **Related Concepts:**
  - [temporal-prime-element](./temporal-prime-element.md)
  - [temporal-prime-factorization](./temporal-prime-factorization.md)
  - [temporal-decomposition-methods](./temporal-decomposition-methods.md)
