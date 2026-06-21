/* Demo: diagram factories — SEQUENCE (UML) + BOXES (architecture). */
CARDS_DATA.push(
  { sec:"EDA", front:"Transactional outbox — end-to-end flow",
    back:"How a crash anywhere stays safe: the write is atomic, and CDC replays the outbox if the relay hasn't run yet." +
      SEQUENCE({
        title:"Outbox + CDC delivery",
        actors:[
          {id:"svc",label:"Service"},
          {id:"db",label:"Postgres"},
          {id:"relay",label:"Debezium"},
          {id:"kafka",label:"Kafka"},
          {id:"cons",label:"Consumer"}
        ],
        messages:[
          {from:"svc",to:"db",label:"write business + outbox row",note:"one transaction"},
          {from:"db",to:"svc",label:"commit (atomic)",kind:"return"},
          {from:"relay",to:"db",label:"tail WAL (CDC)",kind:"async"},
          {from:"db",to:"relay",label:"committed outbox row",kind:"return"},
          {from:"relay",to:"kafka",label:"publish event"},
          {from:"kafka",to:"cons",label:"deliver (at-least-once)"},
          {from:"cons",to:"cons",label:"dedupe by event id",note:"idempotent"}
        ]
      }) },

  { sec:"MEDALLION", front:"The streaming lakehouse (medallion)",
    back:"Data flows source &rarr; Kafka &rarr; Spark into the Bronze/Silver/Gold medallion layers, out to the warehouse; malformed records peel off to a DLQ." +
      BOXES({
        nodes:[
          {id:"src",label:"Sources",col:0,row:0,color:"#f0a866"},
          {id:"kafka",label:"Kafka",col:1,row:0,color:"#5fb0a8"},
          {id:"spark",label:"Spark",col:2,row:0,color:"#e07a5c"},
          {id:"bronze",label:"Bronze",col:3,row:0,color:"#c98a5c"},
          {id:"silver",label:"Silver",col:4,row:0,color:"#c98a5c"},
          {id:"gold",label:"Gold",col:5,row:0,color:"#c98a5c"},
          {id:"snow",label:"Snowflake / ML",col:5,row:1,color:"#d56f7a"},
          {id:"dlq",label:"DLQ",col:2,row:1,color:"#9a7d74"}
        ],
        edges:[
          {from:"src",to:"kafka"},
          {from:"kafka",to:"spark"},
          {from:"spark",to:"bronze"},
          {from:"bronze",to:"silver"},
          {from:"silver",to:"gold"},
          {from:"gold",to:"snow"},
          {from:"spark",to:"dlq",label:"malformed",dashed:true}
        ]
      }) }
);
