/* Demo: code blocks, comparison tables, console output — exercises the new engine. */
CARDS_DATA.push(
  { sec:"EDA", front:"Transactional outbox — the atomic write (Java)",
    back:"The business row and the event row are saved in the <strong>same</strong> <code>@Transactional</code> method, so they commit together:" +
      CODE("java", `
@Transactional
public Payment create(CreatePaymentCommand cmd) {
    Payment p = paymentRepository.save(Payment.from(cmd)); // business row
    var evt = OutboxEvent.of("payment.created", p.id(), toJson(p));
    outboxRepository.save(evt);                            // event row — SAME txn
    return p; // both commit atomically, or neither does
}`) +
      "<p>A relay then publishes the unsent rows. Note: <em>outbox</em> appears in the code above but isn't linked — the auto-linker skips code.</p>" },

  { sec:"MSG", front:"Outbox relay query (SQL) — claim unsent events",
    back:"A poll-based relay locks a batch without blocking other workers. The <code>$1</code> bind parameter must survive untouched (no MathJax/$ mangling):" +
      CODE("sql", `
SELECT id, aggregate_id, payload
FROM outbox_event
WHERE published = false
ORDER BY created_at
LIMIT $1
FOR UPDATE SKIP LOCKED;`) },

  { sec:"DELIV", front:"Delivery semantics, compared",
    back:"The three guarantees — and why 'exactly-once effects' wins for money:" +
      TABLE({
        headers:["Guarantee","Duplicates?","Loss?","Mechanism","Use it for"],
        rows:[
          ["At-most-once","No","<b>Possible</b>","fire-and-forget, no retry","metrics, logs where loss is fine"],
          ["At-least-once","<b>Possible</b>","No","retry until acked","the sane default"],
          ["Exactly-once (effects)","No","No","at-least-once + idempotent consumer","ledgers, payments"]
        ],
        highlight:[2]
      }) },

  { sec:"MSG", front:"Reading consumer lag",
    back:"Lag = how far a consumer group trails the log end. Watch it to detect a stalled or poison-pilled consumer:" +
      CONSOLE({ prompt:"$", cmd:"kafka-consumer-groups --describe --group payments",
        out:"TOPIC      PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG\npayments   0          18432           18432            0\npayments   1          9981            14002         4021   <-- stalled" }) }
);
