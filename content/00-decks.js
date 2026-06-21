/* ============================================================================
   DECK & TOPIC SKELETON
   DECKS_DATA: the 12 top-level decks, each owning a set of topic codes.
   SECTIONS_DATA: topic code -> display name. Cards/glossary tag by topic code.
   Content waves add topic codes here and tag their cards with them.
   ============================================================================ */
DECKS_DATA.push(
  { id:"foundations", name:"Foundations — CS & System Design",      color:"#7c98c8", topics:[] },
  { id:"streaming",   name:"Distributed Systems & Streaming",        color:"#5fb0a8", topics:["MSG","DELIV"] },
  { id:"architecture",name:"Software Architecture & Design",          color:"#8b7cff", topics:["EDA"] },
  { id:"databases",   name:"Databases, Transactions & NoSQL",         color:"#d56f7a", topics:[] },
  { id:"jvm",         name:"Java & the JVM",                          color:"#e07a5c", topics:[] },
  { id:"spark",       name:"Big Data Processing — Apache Spark",      color:"#f0a866", topics:[] },
  { id:"obs",         name:"Observability, Security & Reliability",   color:"#fbbf24", topics:[] },
  { id:"ml",          name:"Applied ML & Information Retrieval",      color:"#46d39a", topics:[] },
  { id:"lakehouse",   name:"Lakehouse & Data Warehousing",           color:"#c98a5c", topics:["MEDALLION"] },
  { id:"cloud",       name:"Cloud & Infrastructure (AWS)",           color:"#9a7d74", topics:[] },
  { id:"languages",   name:"Languages — Python & Scala",             color:"#b07e9e", topics:[] },
  { id:"governance",  name:"Data Governance & Quality",              color:"#5b9dff", topics:[] }
);

/* topic codes -> display names (demo slice) */
Object.assign(SECTIONS_DATA, {
  "EDA":       "Event-Driven Architecture",
  "MSG":       "Reliable Messaging",
  "DELIV":     "Delivery Semantics",
  "MEDALLION": "Medallion Architecture"
});
