# Diagonal Lemma and Self-Reference

A fundamental theorem in mathematical logic establishing that formal systems with sufficient expressive power can construct self-referential statements, enabling formulas to refer to their own Gödel numbers.

## Mathematical Formulation

$$
T \vdash G \leftrightarrow \psi(\ulcorner G \urcorner)
$$

$$
\text{sub}(f, n) = \text{Gödel number of the result of substituting numeral for } n \text{ in formula with Gödel number } f
$$

$$
D(y) = \psi(\text{sub}(y, y))
$$

$$
g = \ulcorner D(x) \urcorner
$$

$$
G = D(g) = \psi(\text{sub}(g, g)) = \psi(\ulcorner D(g) \urcorner) = \psi(\ulcorner G \urcorner)
$$

$$
\phi(\ulcorner G \urcorner) = \phi_\psi + \phi(\text{sub}(g, g))
$$

## Metadata

- **ID:** urn:uor:concept:diagonal-lemma
- **Type:** concept
- **Code:** UOR-C-227
