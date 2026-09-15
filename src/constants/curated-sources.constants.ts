export interface CuratedRepoSeed {
  owner: string;
  repo: string;
  tier: "tier_1_template" | "tier_2_official" | "tier_3_verified_oss";
  architecturePattern: string;
  language?: string;
}

export const TIER_1_CANONICAL_TEMPLATES = [
  {
    pattern: "Layered Backend Architecture",
    spec: `graph TD
    Client[HTTP Client] --> Controller[API Controllers]
    Controller --> Service[Service Layer / Business Logic]
    Service --> Repo[Repository / Data Access]
    Repo --> DB[(Database)]`,
  },
  {
    pattern: "Clean Architecture / Hexagonal",
    spec: `graph TD
    Web[Web / REST Adapter] --> InputPort[Input Port]
    InputPort --> UseCase[Application Use Case]
    UseCase --> Domain[Domain Entities & Core Logic]
    UseCase --> OutputPort[Output Port]
    OutputPort --> Persistence[Persistence Adapter]
    Persistence --> DB[(Database)]`,
  },
  {
    pattern: "Event-Driven Architecture",
    spec: `graph LR
    Producer[Event Producer] --> Broker[Message Broker / Kafka / RabbitMQ]
    Broker --> ConsumerA[Order Consumer]
    Broker --> ConsumerB[Notification Consumer]`,
  },
  {
    pattern: "Microservices Architecture",
    spec: `graph TD
    Gateway[API Gateway] --> ServiceA[User Service]
    Gateway --> ServiceB[Order Service]
    Gateway --> ServiceC[Payment Service]
    ServiceA --> DBA[(Users DB)]
    ServiceB --> DBB[(Orders DB)]
    ServiceC --> DBC[(Payments DB)]`,
  },
  {
    pattern: "CQRS Pattern",
    spec: `graph LR
    Client --> CommandBus[Command Bus]
    CommandBus --> CommandHandler[Command Handler]
    CommandHandler --> WriteDB[(Write DB)]
    Client --> QueryBus[Query Bus]
    QueryBus --> QueryHandler[Query Handler]
    QueryHandler --> ReadDB[(Read DB / Projection)]`,
  },
  {
    pattern: "Serverless Architecture",
    spec: `graph LR
    Trigger[HTTP / Event Trigger] --> Lambda[Function Handler]
    Lambda --> DB[(NoSQL / S3)]
    Lambda --> Queue[SQS / Event Bridge]`,
  },
];

export const CURATED_REFERENCE_REPOSITORIES: CuratedRepoSeed[] = [
  // -------------------------------------------------------
  // Tier 2: Official Framework Repositories
  // -------------------------------------------------------

  // NestJS
  { owner: "nestjs", repo: "docs.nestjs.com", tier: "tier_2_official", architecturePattern: "Modular Layered Architecture", language: "TypeScript" },
  { owner: "nestjs", repo: "nest", tier: "tier_2_official", architecturePattern: "Modular Architecture", language: "TypeScript" },
  { owner: "nestjs", repo: "nest-cli", tier: "tier_2_official", architecturePattern: "CLI Tool Architecture", language: "TypeScript" },

  // Python
  { owner: "tiangolo", repo: "fastapi", tier: "tier_2_official", architecturePattern: "FastAPI Async Web Service", language: "Python" },
  { owner: "pallets", repo: "flask", tier: "tier_2_official", architecturePattern: "Micro Web Framework", language: "Python" },
  { owner: "django", repo: "django", tier: "tier_2_official", architecturePattern: "MTV Layered Architecture", language: "Python" },
  { owner: "encode", repo: "starlette", tier: "tier_2_official", architecturePattern: "ASGI Middleware Stack", language: "Python" },

  // Java / Spring
  { owner: "spring-projects", repo: "spring-petclinic", tier: "tier_2_official", architecturePattern: "Spring Boot Layered", language: "Java" },
  { owner: "spring-projects", repo: "spring-framework", tier: "tier_2_official", architecturePattern: "Spring Core IoC Container", language: "Java" },
  { owner: "springdoc", repo: "springdoc-openapi", tier: "tier_2_official", architecturePattern: "Spring Boot REST API", language: "Java" },

  // .NET / Microsoft
  { owner: "dotnet-architecture", repo: "eShopOnContainers", tier: "tier_2_official", architecturePattern: "Microservices & DDD", language: "C#" },
  { owner: "dotnet-architecture", repo: "eShopOnWeb", tier: "tier_2_official", architecturePattern: "Clean Architecture", language: "C#" },
  { owner: "dotnet-architecture", repo: "eShopOnDapr", tier: "tier_2_official", architecturePattern: "Dapr Microservices", language: "C#" },

  // Go
  { owner: "gin-gonic", repo: "gin", tier: "tier_2_official", architecturePattern: "Go HTTP Middleware Router", language: "Go" },
  { owner: "gorilla", repo: "mux", tier: "tier_2_official", architecturePattern: "Go REST Router", language: "Go" },
  { owner: "labstack", repo: "echo", tier: "tier_2_official", architecturePattern: "Go High-Performance Web Framework", language: "Go" },

  // Rust
  { owner: "actix", repo: "actix-web", tier: "tier_2_official", architecturePattern: "Actor Model Web Framework", language: "Rust" },
  { owner: "tokio-rs", repo: "axum", tier: "tier_2_official", architecturePattern: "Tokio Async Web Framework", language: "Rust" },

  // Node.js / Express
  { owner: "expressjs", repo: "express", tier: "tier_2_official", architecturePattern: "Minimal Node.js Web Framework", language: "JavaScript" },
  { owner: "fastify", repo: "fastify", tier: "tier_2_official", architecturePattern: "High Performance Node.js Server", language: "JavaScript" },

  // -------------------------------------------------------
  // Tier 3: Verified High-Star Architecture References
  // -------------------------------------------------------

  // Clean Architecture & DDD
  { owner: "kgrzybek", repo: "modular-monolith-with-ddd", tier: "tier_3_verified_oss", architecturePattern: "Modular Monolith & DDD", language: "C#" },
  { owner: "kgrzybek", repo: "sample-dotnet-core-cqrs-api", tier: "tier_3_verified_oss", architecturePattern: "CQRS Pattern", language: "C#" },
  { owner: "jasontaylordev", repo: "CleanArchitecture", tier: "tier_3_verified_oss", architecturePattern: "Clean Architecture", language: "C#" },
  { owner: "ardalis", repo: "CleanArchitecture", tier: "tier_3_verified_oss", architecturePattern: "Clean Architecture", language: "C#" },
  { owner: "pereiren", repo: "dotnet-template-onion", tier: "tier_3_verified_oss", architecturePattern: "Onion Architecture", language: "C#" },

  // Node.js Clean Architecture
  { owner: "goldbergyoni", repo: "nodebestpractices", tier: "tier_3_verified_oss", architecturePattern: "Clean Node Architecture", language: "JavaScript" },
  { owner: "alan-agius4", repo: "typeorm-sample", tier: "tier_3_verified_oss", architecturePattern: "TypeORM Repository Pattern", language: "TypeScript" },
  { owner: "alexkondratowicz", repo: "typescript-clean-architecture", tier: "tier_3_verified_oss", architecturePattern: "TypeScript Clean Architecture", language: "TypeScript" },
  { owner: "rmanguinho", repo: "clean-ts-api", tier: "tier_3_verified_oss", architecturePattern: "Clean Architecture", language: "TypeScript" },
  { owner: "stemmlerjs", repo: "ddd-forum", tier: "tier_3_verified_oss", architecturePattern: "Domain-Driven Design", language: "TypeScript" },

  // Design Patterns
  { owner: "iluwatar", repo: "java-design-patterns", tier: "tier_3_verified_oss", architecturePattern: "Design Patterns Catalog", language: "Java" },
  { owner: "kamranahmedse", repo: "design-patterns-for-humans", tier: "tier_3_verified_oss", architecturePattern: "Design Patterns Catalog", language: "PHP" },

  // Microservices
  { owner: "GoogleCloudPlatform", repo: "microservices-demo", tier: "tier_3_verified_oss", architecturePattern: "Microservices Architecture", language: "Go" },
  { owner: "ewolff", repo: "microservice", tier: "tier_3_verified_oss", architecturePattern: "Microservices Architecture", language: "Java" },
  { owner: "micro", repo: "go-micro", tier: "tier_3_verified_oss", architecturePattern: "Go Microservices Framework", language: "Go" },
  { owner: "dapr", repo: "dapr", tier: "tier_3_verified_oss", architecturePattern: "Distributed Application Runtime", language: "Go" },

  // Event-Driven / Kafka
  { owner: "confluentinc", repo: "kafka-streams-examples", tier: "tier_3_verified_oss", architecturePattern: "Event-Driven Architecture", language: "Java" },
  { owner: "nicholasjackson", repo: "event-driven-microservices", tier: "tier_3_verified_oss", architecturePattern: "Event-Driven Microservices", language: "Go" },

  // CQRS / Event Sourcing
  { owner: "gregoryyoung", repo: "m-r", tier: "tier_3_verified_oss", architecturePattern: "CQRS Pattern", language: "C#" },
  { owner: "AxonFramework", repo: "AxonFramework", tier: "tier_3_verified_oss", architecturePattern: "CQRS & Event Sourcing", language: "Java" },

  // Hexagonal / Ports & Adapters
  { owner: "jmgarridopaz", repo: "bluezone", tier: "tier_3_verified_oss", architecturePattern: "Hexagonal Architecture", language: "Java" },
  { owner: "ivan-tomassi", repo: "py-hexagonal", tier: "tier_3_verified_oss", architecturePattern: "Hexagonal Architecture", language: "Python" },

  // GraphQL API
  { owner: "apollographql", repo: "apollo-server", tier: "tier_3_verified_oss", architecturePattern: "GraphQL Server Architecture", language: "TypeScript" },
  { owner: "graphql", repo: "graphql-js", tier: "tier_3_verified_oss", architecturePattern: "GraphQL Core", language: "TypeScript" },

  // REST API Starters
  { owner: "hagopj13", repo: "node-express-boilerplate", tier: "tier_3_verified_oss", architecturePattern: "REST API Layered Architecture", language: "JavaScript" },
  { owner: "ljbc1994", repo: "express-typescript-boilerplate", tier: "tier_3_verified_oss", architecturePattern: "TypeScript REST API", language: "TypeScript" },
  { owner: "gothinkster", repo: "realworld", tier: "tier_3_verified_oss", architecturePattern: "Full-Stack MVC", language: "JavaScript" },

  // Python Architecture
  { owner: "cosmicpython", repo: "code", tier: "tier_3_verified_oss", architecturePattern: "Architecture Patterns with Python", language: "Python" },
  { owner: "faif", repo: "python-patterns", tier: "tier_3_verified_oss", architecturePattern: "Design Patterns Catalog", language: "Python" },
  { owner: "tiangolo", repo: "full-stack-fastapi-template", tier: "tier_3_verified_oss", architecturePattern: "Full-Stack FastAPI Architecture", language: "Python" },

  // Serverless
  { owner: "serverless", repo: "examples", tier: "tier_3_verified_oss", architecturePattern: "Serverless Architecture", language: "JavaScript" },
  { owner: "aws-samples", repo: "serverless-patterns", tier: "tier_3_verified_oss", architecturePattern: "Serverless Architecture", language: "TypeScript" },

  // Go Clean Architecture
  { owner: "bxcodec", repo: "go-clean-arch", tier: "tier_3_verified_oss", architecturePattern: "Clean Architecture", language: "Go" },
  { owner: "evrone", repo: "go-clean-template", tier: "tier_3_verified_oss", architecturePattern: "Layered Backend Architecture", language: "Go" },
  { owner: "golang-standards", repo: "project-layout", tier: "tier_3_verified_oss", architecturePattern: "Go Standard Project Layout", language: "Go" },

  // Rust Architecture
  { owner: "actix", repo: "examples", tier: "tier_3_verified_oss", architecturePattern: "Rust Web API", language: "Rust" },

  // Mobile / Flutter / React Native
  { owner: "brianegan", repo: "flutter_architecture_samples", tier: "tier_3_verified_oss", architecturePattern: "Flutter Architecture Samples", language: "Dart" },
  { owner: "infinitered", repo: "ignite", tier: "tier_3_verified_oss", architecturePattern: "React Native Boilerplate", language: "TypeScript" },

  // Frontend Architecture
  { owner: "alan2207", repo: "bulletproof-react", tier: "tier_3_verified_oss", architecturePattern: "Scalable React Architecture", language: "TypeScript" },
  { owner: "nickvdyck", repo: "nvd.codes", tier: "tier_3_verified_oss", architecturePattern: "Next.js JAMStack", language: "TypeScript" },
];
