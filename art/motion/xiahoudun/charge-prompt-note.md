# Charge request 2/12 — prompt/reference reconciliation

The successful image call used body, portrait, then walk (three refs).
The saved prompt originally said FOURTH and refs 2/3; those labels were
corrected to THIRD and identity references during the audit to match the
actual successful call. The attachment-validation failure before that call
used the wrong walk width (1536 instead of the read_image metadata's 1535)
and produced no image. The corrected call produced candidate `0afda71c…`.
The successful call's final sentence says "spearhead tip and pommel butt";
the saved brief says "spearhead tip and butt cap" (same endpoint intent).
No new request/reservation was made during the continuation audit.
