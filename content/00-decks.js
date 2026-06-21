/* ============================================================================
   DECK & TOPIC SKELETON
   DECKS_DATA: the 12 top-level decks, each owning a set of topic codes.
   SECTIONS_DATA: topic code -> display name. Cards/glossary tag by topic code.
   Content waves add topic codes here and tag their cards with them.
   ============================================================================ */
DECKS_DATA.push(
  { id:"foundations", name:"Foundations — CS & System Design",      color:"#7c98c8", topics:["FND-BIGO","FND-DS","FND-ALGO","FND-SYS","FND-CAP","FND-NET","FND-CONC","FND-HASH","FND-CACHE","FND-LB","FND-RL","FND-API"] },
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

/* topic codes -> display names */
Object.assign(SECTIONS_DATA, {
  // demo slice (Distributed Systems & Streaming / Architecture / Lakehouse)
  "EDA":       "Event-Driven Architecture",
  "MSG":       "Reliable Messaging",
  "DELIV":     "Delivery Semantics",
  "MEDALLION": "Medallion Architecture",
  // Foundations — CS & System Design
  "FND-BIGO":  "Complexity & Big-O",
  "FND-DS":    "Core Data Structures",
  "FND-ALGO":  "Algorithms & Problem-Solving",
  "FND-SYS":   "System Design Building Blocks",
  "FND-CAP":   "Consistency, CAP & PACELC",
  "FND-NET":   "Networking",
  "FND-CONC":  "Concurrency & Parallelism",
  "FND-HASH":  "Hashing & Consistent Hashing",
  "FND-CACHE": "Caching & Eviction",
  "FND-LB":    "Load Balancing & Proxies",
  "FND-RL":    "Rate Limiting & Backpressure",
  "FND-API":   "API Design & Protocols"
});
