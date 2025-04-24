---
id: "urn:uor:concept:media-type-foundation"
title: "Media Type Foundation"
type: "concept"
tags:
  - "concept"
code: "UOR-C-122"
---

# Media Type Foundation

The mathematical foundation that enables media types to express their intrinsic requirements through the universal number representation, creating a coherent framework for specifying optimal handling characteristics.

## Mathematical Formulation

$$
Def(M) = (\phi_t(M), \phi_s(M), \phi_r(M), R_M)
$$

$$
\phi_t(M) = \{d: digest\_size, c: conversion\_ratio, f: frame\_attributes, ...\}
$$

$$
\phi_t(video\_hd) = \{d: 32bit, c: 10:1, f: variable\_length, ...\}
$$

$$
C(T_a(M), T_b(M)) > \tau_M
$$

## Metadata

- **ID:** urn:uor:concept:media-type-foundation
- **Code:** UOR-C-122
