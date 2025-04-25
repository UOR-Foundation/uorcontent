---
id: "urn:uor:resource:prime-formula"
title: "Prime Formula"
type: "resource"
tags:
  - "resource"
  - "prime formula"
  - "canonical factorization"
  - "prime valuation"
  - "prime-coordinate map"
  - "unique factorization domain"
partOf: "urn:uor:topic:prime-foundations"
---

# Prime Formula

## Description

A formal mathematical definition of the [[uor-c-002|prime decomposition]] and valuation process in a [[uor-c-301|Unique Factorization]] Domain, establishing the foundational formulas for representing objects in terms of their prime components.

The Prime Formula provides a formal mathematical definition of the [[uor-c-002|prime decomposition]] and valuation process in a [[uor-c-301|Unique Factorization]] Domain.

For any non-zero non-unit element x in a [[uor-c-301|Unique Factorization]] Domain D, the canonical prime factorization is given by: x = u · p₁^e₁ · p₂^e₂ · ... · pₙ^eₙ, where: u is a unit in D; Each pᵢ is a distinct prime in D; eᵢ is the exponent (valuation) of prime pᵢ; and the product is finite (only finitely many primes have non-zero exponents).

The [[uor-c-148|prime valuation]] function v_p(x) returns the highest power of prime p that divides x. For example, v_2(12) = 2 because 2² divides 12, but 2³ does not. This function has several important properties: v_p(xy) = v_p(x) + v_p(y) for all x, y; v_p(x+y) ≥ min(v_p(x), v_p(y)) with equality when v_p(x) ≠ v_p(y); v_p(1) = 0 for all primes p; and v_p(p) = 1 for prime p.

The valuation function extends to define the prime-coordinate map φ: φ(x) = (v_p(x))_p. This maps each element to its vector of prime exponents, forming the mathematical basis for the [[uor-c-001|UOR framework]]'s representation system.

## References

- [[uor-c-146|Prime Formula Foundation]]
- [[uor-c-147|Canonical Factorization]]
- [[uor-c-148|Prime Valuation]]
- [[uor-c-149|Valuation Properties]]

## Metadata

- **ID:** urn:uor:resource:prime-formula
- **Author:** UOR Framework
- **Created:** 2025-04-22T00:00:00Z
- **Modified:** 2025-04-22T00:00:00Z
