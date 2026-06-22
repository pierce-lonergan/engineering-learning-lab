/* ============================================================================
   DECK & TOPIC SKELETON
   DECKS_DATA: the 12 top-level decks, each owning a set of topic codes.
   SECTIONS_DATA: topic code -> display name. Cards/glossary tag by topic code.
   Content waves add topic codes here and tag their cards with them.
   ============================================================================ */
DECKS_DATA.push(
  { id:"foundations", name:"Foundations — CS & System Design",      color:"#7c98c8", topics:["FND-BIGO","FND-DS","FND-ALGO","FND-SYS","FND-CAP","FND-NET","FND-CONC","FND-HASH","FND-CACHE","FND-LB","FND-RL","FND-API"] },
  { id:"streaming",   name:"Distributed Systems & Streaming",        color:"#5fb0a8", topics:["MSG","DELIV","DSS-KAFKA","DSS-PART","DSS-CONSUMER","DSS-PROC","DSS-TIME","DSS-EOS","DSS-CONSENSUS","DSS-COORD","DSS-CLOCK","DSS-TXN","DSS-SCALE"] },
  { id:"architecture",name:"Software Architecture & Design",          color:"#8b7cff", topics:["EDA"] },
  { id:"databases",   name:"Databases, Transactions & NoSQL",         color:"#d56f7a", topics:["DB-ACID","DB-ISO","DB-MVCC","DB-STORAGE","DB-INDEX","DB-QUERY","DB-REPL","DB-SHARD","DB-NOSQL","DB-WIDECOL","DB-NEWSQL","DB-MODELING"] },
  { id:"jvm",         name:"Java & the JVM",                          color:"#e07a5c", topics:["JVM-MEM","JVM-GC","JVM-JMM","JVM-CONC","JVM-COLLECT","JVM-LOOM","JVM-JIT","JVM-CLASS","JVM-LANG","JVM-MODERN","JVM-PERF","JVM-IO"] },
  { id:"spark",       name:"Big Data Processing — Apache Spark",      color:"#f0a866", topics:["SPARK-ARCH","SPARK-RDD","SPARK-DF","SPARK-CATALYST","SPARK-SHUFFLE","SPARK-PART","SPARK-SKEW","SPARK-JOINS","SPARK-MEMORY","SPARK-AQE","SPARK-STREAM","SPARK-TUNE"] },
  { id:"obs",         name:"Observability, Security & Reliability",   color:"#fbbf24", topics:[] },
  { id:"ml",          name:"Applied ML & Information Retrieval",      color:"#46d39a", topics:["ML-EMBED","ML-ANN","ML-RAG","ML-RERANK","ML-SEARCH","ML-EVALIR","ML-TRAIN","ML-EVAL","ML-FEATURE","ML-XFMR","ML-MLOPS","ML-PROMPT"] },
  { id:"lakehouse",   name:"Lakehouse & Data Warehousing",           color:"#c98a5c", topics:["MEDALLION"] },
  { id:"cloud",       name:"Cloud & Infrastructure (AWS)",           color:"#9a7d74", topics:[] },
  { id:"languages",   name:"Languages — Python & Scala",             color:"#b07e9e", topics:[] },
  { id:"governance",  name:"Data Governance & Quality",              color:"#5b9dff", topics:[] }
);

/* topic codes -> display names */
Object.assign(SECTIONS_DATA, {
  // demo slice (Streaming / Architecture / Lakehouse)
  "EDA":          "Event-Driven Architecture",
  "MSG":          "Reliable Messaging",
  "DELIV":        "Delivery Semantics",
  "MEDALLION":    "Medallion Architecture",
  // Distributed Systems & Streaming
  "DSS-KAFKA":    "Kafka Architecture & Internals",
  "DSS-PART":     "Partitioning & Ordering",
  "DSS-CONSUMER": "Consumer Groups & Offsets",
  "DSS-PROC":     "Stream Processing & State",
  "DSS-TIME":     "Event Time, Watermarks & Windowing",
  "DSS-EOS":      "Exactly-Once Streaming",
  "DSS-CONSENSUS":"Consensus & Replicated Logs",
  "DSS-COORD":    "Coordination & Leader Election",
  "DSS-CLOCK":    "Time & Causality",
  "DSS-TXN":      "Distributed Transactions & Sagas",
  "DSS-SCALE":    "Streaming at Scale & Failure",
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
  "FND-API":   "API Design & Protocols",
  // Databases, Transactions & NoSQL
  "DB-ACID":      "ACID & Transactions",
  "DB-ISO":       "Isolation Levels & Anomalies",
  "DB-MVCC":      "Concurrency Control & MVCC",
  "DB-STORAGE":   "Storage Engines: B-Tree vs LSM",
  "DB-INDEX":     "Indexing",
  "DB-QUERY":     "Query Execution & Optimization",
  "DB-REPL":      "Replication",
  "DB-SHARD":     "Partitioning & Sharding",
  "DB-NOSQL":     "NoSQL Data Models",
  "DB-WIDECOL":   "Wide-Column Stores (Cassandra/DynamoDB)",
  "DB-NEWSQL":    "Distributed SQL / NewSQL",
  "DB-MODELING":  "Schema Design & Normalization",
  // Big Data Processing — Apache Spark
  "SPARK-ARCH":     "Architecture & Execution Model",
  "SPARK-RDD":      "RDDs & the Core Model",
  "SPARK-DF":       "DataFrames, Datasets & APIs",
  "SPARK-CATALYST": "Catalyst Optimizer & Tungsten",
  "SPARK-SHUFFLE":  "The Shuffle",
  "SPARK-PART":     "Partitioning & Parallelism",
  "SPARK-SKEW":     "Data Skew",
  "SPARK-JOINS":    "Join Strategies",
  "SPARK-MEMORY":   "Memory Management & Caching",
  "SPARK-AQE":      "Adaptive Query Execution",
  "SPARK-STREAM":   "Structured Streaming",
  "SPARK-TUNE":     "Tuning & Pitfalls",
  // Java & the JVM
  "JVM-MEM":      "JVM Memory Layout",
  "JVM-GC":       "Garbage Collection",
  "JVM-JMM":      "Java Memory Model & happens-before",
  "JVM-CONC":     "Concurrency Toolkit (java.util.concurrent)",
  "JVM-COLLECT":  "Concurrent Collections",
  "JVM-LOOM":     "Virtual Threads & Structured Concurrency",
  "JVM-JIT":      "JIT Compilation & Execution",
  "JVM-CLASS":    "Class Loading & Linking",
  "JVM-LANG":     "Core Language Semantics",
  "JVM-MODERN":   "Modern Java (8–21)",
  "JVM-PERF":     "Performance & Profiling",
  "JVM-IO":       "I/O & Serialization",
  // Applied ML & Information Retrieval
  "ML-EMBED":     "Embeddings & Vector Representations",
  "ML-ANN":       "Vector Search & ANN Indexes",
  "ML-RAG":       "Retrieval-Augmented Generation",
  "ML-RERANK":    "Rerankers & Late Interaction",
  "ML-SEARCH":    "Information Retrieval Fundamentals",
  "ML-EVALIR":    "Retrieval & RAG Evaluation",
  "ML-TRAIN":     "ML Training Fundamentals",
  "ML-EVAL":      "Model Evaluation & Metrics",
  "ML-FEATURE":   "Feature Engineering & Data",
  "ML-XFMR":      "Transformers & LLMs",
  "ML-MLOPS":     "MLOps & Serving",
  "ML-PROMPT":    "LLM Application Patterns"
});
