/* ============================================================================
   VERTICAL SLICE — Reliable messaging cluster (sourced from NexusPay)
   Proves the forked engine renders SWE content: cards, drill-down glossary,
   memory hooks, Gotchas, worked examples, cross-links.
   ============================================================================ */
/* topics + decks are defined in 00-decks.js */
CARDS_DATA.push(
  { sec:"EDA", front:"The dual-write problem",
    back:"A service that must <strong>update its database AND publish an event</strong> as two separate writes can crash in between — committing one without the other. The result: a lost event or a ghost event, and permanent divergence between your data and your stream. The transactional outbox solves it." },
  { sec:"EDA", front:"Transactional outbox pattern",
    back:"Write the event row into an <strong>outbox table in the SAME database transaction</strong> as the business change. Either both commit or neither does. A separate relay (often change data capture) then publishes the outbox rows to Kafka. One atomic write — no dual-write inconsistency." },
  { sec:"DELIV", front:"Why 'exactly-once' is usually 'effectively-once'",
    back:"True exactly-once <em>delivery</em> over a network is impossible (you can't distinguish a lost ack from a lost message). What systems actually deliver is <strong>at-least-once delivery + idempotent processing</strong>, which yields exactly-once <em>effects</em>. Kafka's 'exactly-once' is transactions + idempotent producer, still leaning on dedup downstream." },
  { sec:"MSG", front:"Idempotent consumer",
    back:"A consumer you can safely feed the <strong>same message twice</strong> with no extra effect — e.g., dedup by an idempotency key in a fast store (Valkey/Redis), or an upsert keyed by event id. Mandatory under at-least-once delivery, because duplicates <em>will</em> happen." },
  { sec:"MSG", front:"Dead-letter queue (DLQ)",
    back:"A side channel where messages that <strong>repeatedly fail</strong> processing are parked after N retries, so one poison-pill message can't block the partition for everyone behind it. You alert on DLQ depth and replay after a fix." },
  { sec:"MSG", front:"Change data capture (CDC)",
    back:"Stream every row change by <strong>tailing the database's commit log</strong> (e.g., Debezium reading the Postgres WAL) instead of polling. It's how the outbox relay publishes events durably and in commit order, without the service doing a second write." }
);

Object.assign(GLOSSARY_DATA, {
"dual-write-problem":{ term:"The Dual-Write Problem", group:"EDA",
  aliases:["dual-write problem","dual write","dual-write"],
  eli5:"Updating your database AND publishing an event as two separate steps risks doing one but not the other if the process crashes in between — leaving data and stream out of sync.",
  full:"<p>Many services must do two things on one action: persist a state change and tell the rest of the system about it. If those are <b>two independent writes</b> (DB commit, then Kafka send), a crash or network blip between them corrupts the system of record:</p><ul><li>DB commits, publish fails &rarr; a <b>lost event</b> (downstream never learns).</li><li>Publish succeeds, DB rolls back &rarr; a <b>ghost event</b> (downstream acts on a change that never happened).</li></ul><p>There is no ordering of two separate writes that is safe. The fix is to make them <b>one</b> atomic write — the transactional outbox.</p>",
  related:["transactional-outbox","change-data-capture","idempotency","exactly-once"] },

"transactional-outbox":{ term:"Transactional Outbox", group:"EDA",
  aliases:["transactional outbox","outbox pattern","outbox"],
  eli5:"Write the event into an 'outbox' table inside the same transaction as your business change, so they commit together; a separate relay publishes it afterward. One atomic write, zero lost events.",
  full:"<p>The <b>transactional outbox</b> turns the dual-write problem into a single-write problem. In one local DB transaction you write both the business row and an <code>outbox</code> row describing the event. Because they share a transaction, they commit or roll back together — atomicity guarantees you never have one without the other.</p><p>A separate <b>relay</b> then moves outbox rows to the message broker. Two common relays: poll-and-publish (a worker selects unsent rows) or, better, <b>change data capture</b> tailing the commit log. The relay marks rows sent (or CDC tracks its offset), and consumers dedupe by event id for idempotency.</p>",
  related:["dual-write-problem","change-data-capture","idempotency","dead-letter-queue","exactly-once"] },

"idempotency":{ term:"Idempotency", group:"MSG",
  aliases:["idempotency","idempotent","idempotent consumer","idempotency key"],
  eli5:"An operation is idempotent if doing it twice has the same effect as doing it once. Essential because at-least-once delivery guarantees you'll sometimes get duplicates.",
  full:"<p><b>Idempotency</b> lets you safely retry. Formally, <code>f(f(x)) = f(x)</code> — applying the operation again changes nothing. In messaging this is the only sane defense against duplicates, which are inevitable under <b>at-least-once</b> delivery.</p><p>Practical techniques: dedupe on a unique <b>idempotency key</b> (request id / event id) recorded in a fast store; use database <b>upserts</b> keyed by a natural id; or design operations to be naturally idempotent (set balance to X, not add X).</p>",
  related:["exactly-once","dead-letter-queue","transactional-outbox"] },

"exactly-once":{ term:"Exactly-Once Semantics", group:"DELIV",
  aliases:["exactly-once","exactly once","effectively-once","delivery semantics"],
  eli5:"The appearance that each message is processed exactly once. In practice it's at-least-once delivery plus idempotent processing ('effectively-once') — true once-only delivery is impossible over a network.",
  full:"<p>The three delivery guarantees: <b>at-most-once</b> (fire and forget; may lose), <b>at-least-once</b> (retry until acked; may duplicate), and <b>exactly-once</b> (the holy grail). Because a sender can't tell a lost message from a lost acknowledgment, exactly-once <i>delivery</i> is unachievable — but exactly-once <i>effects</i> are, via at-least-once delivery + an idempotent consumer.</p><p>Kafka's 'exactly-once' combines the idempotent producer (dedupe by producer id + sequence) with transactions spanning consume-process-produce; downstream sinks still typically dedupe.</p>",
  related:["idempotency","transactional-outbox","dead-letter-queue"] },

"dead-letter-queue":{ term:"Dead-Letter Queue (DLQ)", group:"MSG",
  aliases:["dead-letter queue","dead letter queue","DLQ","poison pill"],
  eli5:"A side channel where messages that keep failing get parked after a few retries, so one bad ('poison') message doesn't block everything queued behind it.",
  full:"<p>A <b>dead-letter queue</b> is where messages go to be quarantined after exceeding a retry budget. Without it, a single un-processable <b>poison pill</b> (malformed payload, an unhandled schema change) stalls the partition and grows consumer lag for everyone behind it.</p><p>Operational pattern: retry with backoff a bounded number of times; on exhaustion, route to the DLQ with failure metadata; alert on DLQ depth; fix the bug or data; then replay. Entropy Engine specifically chaos-tests this with injected poison pills.</p>",
  related:["idempotency","transactional-outbox","exactly-once"] },

"change-data-capture":{ term:"Change Data Capture (CDC)", group:"MSG",
  aliases:["change data capture","CDC","Debezium","write-ahead log"],
  eli5:"Stream every change to a database by reading its commit log (the write-ahead log) instead of polling — capturing inserts, updates, and deletes in commit order as events.",
  full:"<p><b>CDC</b> reads the database's <b>write-ahead log</b> (WAL/binlog) and emits each committed change as an event. Tools like <b>Debezium</b> do this for Postgres/MySQL. Because it reads the log the DB already writes for durability, it adds no second write and preserves commit order.</p><p>It's the durable engine behind the transactional outbox relay: the service only writes the outbox row; Debezium tails the WAL and publishes it to Kafka — turning the database's own log into the source of truth for the stream.</p>",
  related:["transactional-outbox","dual-write-problem"] }
});

enh({
"dual-write-problem":{
  memory:"Two separate writes can't be made atomic &mdash; a crash between them corrupts your system of record.",
  trap:"There is NO safe ordering of DB-then-publish or publish-then-DB. Retries don't fix it (the crash happens before the retry). Only a single atomic write does." },
"transactional-outbox":{
  memory:"One DB transaction writes both the business row AND the event; a relay publishes the outbox later.",
  trap:"The outbox alone doesn't give exactly-once &mdash; the relay delivers at-least-once, so consumers STILL must dedupe by event id (idempotency).",
  examples:[{ title:"Why the crash is now harmless", scenario:"A payment service writes the payment row and an OutboxEvent row in one transaction, then crashes before the relay runs.",
    result:"On restart the relay finds the un-published outbox row and sends it &mdash; <b>nothing is lost</b>, because the event was committed atomically with the payment. Compare the dual-write version, where the event would be gone forever." }] },
"idempotency":{
  memory:"f(f(x)) = f(x): safe to repeat. Required because at-least-once delivery WILL duplicate.",
  trap:"&lsquo;Insert a row&rsquo; is NOT idempotent (second try violates a key or double-inserts). &lsquo;Upsert by event id&rsquo; or &lsquo;dedupe on an idempotency key&rsquo; is." },
"exactly-once":{
  memory:"Exactly-once = at-least-once delivery + idempotent processing (&lsquo;effectively-once&rsquo;).",
  trap:"True exactly-once DELIVERY is impossible &mdash; a sender can't distinguish a lost message from a lost ack. Anyone promising it is really doing at-least-once + dedup." },
"dead-letter-queue":{
  memory:"Park repeatedly-failing messages aside so one poison pill can't block the partition.",
  trap:"Don't retry a poison pill forever in place &mdash; it grows consumer lag for everyone behind it. Bound retries, then DLQ + alert + replay." },
"change-data-capture":{
  memory:"Tail the commit log (WAL) instead of polling &mdash; every change, in order, no second write.",
  trap:"CDC captures what COMMITTED, in commit order &mdash; not application intent. Schema changes to the source table flow straight through, so pair it with schema-drift handling." }
});
