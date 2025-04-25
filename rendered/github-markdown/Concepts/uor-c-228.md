# First Incompleteness Theorem

Gödel's revolutionary theorem proving that any consistent formal system capable of expressing basic arithmetic contains statements that cannot be proven or disproven within the system, establishing fundamental limitations of formal mathematics.

## Mathematical Formulation

$$
T \nvdash G \text{ and } T \nvdash \neg G
$$

$$
T \vdash G \leftrightarrow \neg\text{Prov}_T(\ulcorner G \urcorner)
$$

$$
\text{Prov}_T(f) \leftrightarrow \exists p: \text{Prf}(p, f)
$$

$$
\text{Prf}(p, f) \leftrightarrow \text{Proof}(p) \wedge \text{LastLine}(p) = f
$$

$$
\text{Consistent}(T) \rightarrow \neg\text{Complete}(T)
$$

$$
\text{Complete}(T) \leftrightarrow \forall\phi (T \vdash \phi \vee T \vdash \neg\phi)
$$

## Metadata

- **ID:** urn:uor:concept:first-incompleteness-theorem
- **Type:** concept
- **Code:** UOR-C-228
