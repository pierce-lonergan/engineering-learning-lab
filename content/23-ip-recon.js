/* Reconciliation & Breaks Management (IP-RECON) — fact-checked content wave (auto-assembled) */
CARDS_DATA.push(
  {"sec":"IP-RECON","front":"What is reconciliation in trade operations, and what is the core primitive?","back":"Reconciliation = comparing internal records against an external truth source and resolving differences. Compare (SOD/settlement/on-chain) → match on stable ids → tolerate expected discrepancies → unmatched = breaks. Same primitive as payments/ledger recon."},
  {"sec":"IP-RECON","front":"What does post-trade mean and where does reconciliation sit?","back":"Post-trade = after execution, before full settlement: capture, allocation, confirmation/affirmation, matching (ITP), clearing (NSCC), settlement (DTC). Recon runs across, most critically at capture and settlement."},
  {"sec":"IP-RECON","front":"Three main break types.","back":"Trade break (execution mismatch), position break (vs custodian SOD), cash/balance break (vs bank/exchange/on-chain). Position and cash breaks usually trace to a trade break."},
  {"sec":"IP-RECON","front":"Exception-management workflow.","back":"Detect → Classify → Investigate → Resolve → Audit. Under T+1 only ~2-5 hours, so automate each step."},
  {"sec":"IP-RECON","front":"What changed with T+1 (May 28, 2024)?","back":"US T+2→T+1 (equities, corp/muni bonds, UITs, ADRs, ETFs); EU/UK Oct 11 2027. Window compresses to 2-5 hrs, same-day affirmation gates NSCC/DTC, unresolved = settlement fail. Automation/STP mandatory."},
  {"sec":"IP-RECON","front":"Reconcile fills vs orders in pandas?","back":"merge(on=exec_id, how='outer', indicator=True); left_only/right_only = one-sided breaks; both with tolerance for amount breaks. Prefer stable id; tolerances not == on floats."},
  {"sec":"IP-RECON","front":"Nostro vs vostro and cash recon?","back":"Nostro = our money at their bank; vostro = their money at our bank. Nostro recon matches internal ledger vs external statement. Crypto analog = wallet/exchange-balance recon."},
  {"sec":"IP-RECON","front":"Bulk vs manual corrections.","back":"Manual = one-offs; bulk = systemic patterns. Guardrails: dry-run, idempotent apply, full audit trail, four-eyes on large runs."},
  {"sec":"IP-RECON","front":"What is FIX drop-copy?","back":"FIX session pushing a copy of every 35=8 ExecutionReport to ops, independent of order entry. ExecType 150: F=Trade, G=Correction, H=Cancel. Seq gaps recovered via ResendRequest (35=2). NewOrderSingle=35=D."},
  {"sec":"IP-RECON","front":"Crypto vs equities recon.","back":"No central depository; truth is the chain across multiple chains; probabilistic finality (reorgs); gas accrual; hot/cold custody; 24/7. 2026: stablecoins as cash leg, OCC GENIUS proposal redemption <=2 business days."},
  {"sec":"IP-RECON","front":"Prediction-market settlement.","back":"Binary event contracts $0-$1 = implied probability, settle $1/$0 to event resolution → oracle/resolution risk. Kalshi (DCM 2020) vs Polymarket (CFTC exchange Nov 25 2025). CFTC advisory Feb 25 2026."},
  {"sec":"IP-RECON","front":"Why idempotency for order entry / settlement?","back":"Safe retries. Store (caller, key)->hash+response+status: same key+payload returns original response; same key+different payload = 409. Exchange key = ClOrdID. Pair with backoff + rate-limit handling."},
  {"sec":"IP-RECON","front":"Composite-key matching pitfalls.","back":"Duplicate ambiguity, timestamp skew, partial-fill aggregation, float equality. Mitigate: prefer venue exec_id, aggregate to common grain, tolerances, optimal one-to-one assignment."},
  {"sec":"IP-RECON","front":"SQL for position breaks vs SOD.","back":"FULL OUTER JOIN internal vs custodian_sod on symbol/account/as_of; COALESCE qty to 0; CASE on a join-key column for one-sided; WHERE qty <> qty."},
  {"sec":"IP-RECON","front":"Automate reconciliation end-to-end.","back":"Ingest (drop-copy/REST/WS/files/on-chain) → Normalize → Match w/ tolerances → Classify+store → Auto-resolve known classes (idempotent) / route rest to UI → Audit → Alert/monitor on T+1 SLA."},
  {"sec":"IP-RECON","front":"Payments/ledger background → trade ops?","back":"~1:1: external-truth recon, idempotency keys (ClOrdID), exception handling (disputes≈breaks), tolerated discrepancies. Python/SQL + Kafka/Spark/Snowflake/AWS carry over."}
);

Object.assign(GLOSSARY_DATA, {
  "break": {"term":"Break","group":"IP-RECON","eli5":"A booked figure that disagrees with outside truth.","full":"Trade/position/cash breaks; position and cash usually trace to a trade break."},
  "exception-management": {"term":"Exception management","group":"IP-RECON","eli5":"The workflow to clear breaks with an audit trail.","full":"Detect, classify, investigate, resolve, audit."},
  "nostro-vostro": {"term":"Nostro/Vostro","group":"IP-RECON","eli5":"Same account, two views: ours with you vs yours with us.","full":"Nostro = our funds elsewhere; vostro = their funds with us; nostro recon is a cash-break source."},
  "drop-copy": {"term":"FIX drop-copy","group":"IP-RECON","eli5":"Side feed of every fill, to check your bookings.","full":"35=8 copied to ops; ExecType 150 F/G/H; seq gaps via ResendRequest (35=2)."}
});
