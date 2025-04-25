---
id: "urn:uor:concept:axiom-universal-mapping-property-formalization"
title: "Axiom Universal Mapping Property Formalization"
type: "concept"
tags:
  - "concept"
code: "UOR-C-184"
---

# Axiom Universal Mapping Property Formalization

The mathematical formalization of the [[uor-c-028|Universal Mapping Property]] Axiom, including the Universal [[uor-c-138|Factorization Theorem]], its proof, and category-theoretic interpretations.

## Mathematical Formulation

$
\exists! h: \mathbb{Z}^P \to A \text{ such that } \psi = h \circ \phi
$

$
h(e_p) = \psi(p) \text{ for each prime } p
$

$
h(\phi(x)) = \psi(x) \text{ for all } x \in \mathcal{U}
$

$
\text{Hom}_{\text{Ab}}(\mathbb{Z}^P, A) \cong \text{Hom}_{\text{Mon}}(\mathcal{U}, A) \text{ via } h \mapsto h \circ \phi
$

$
\text{Hom}_{\text{Ab}}(L(\mathcal{U}), A) \cong \text{Hom}_{\text{Mon}}(\mathcal{U}, U(A)) \text{ where } L(\mathcal{U}) = \mathbb{Z}^P
$

## Metadata

- **ID:** urn:uor:concept:axiom-universal-mapping-property-formalization
- **Code:** UOR-C-184
