export interface CuratedRepoSeed {
  owner: string;
  repo: string;
  tier: "tier_1_template" | "tier_2_official" | "tier_3_verified_oss";
  architecturePattern: string;
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
];

export const CURATED_REFERENCE_REPOSITORIES: CuratedRepoSeed[] = [
  // Tier 2: Official Framework Docs & Examples
  { owner: "nestjs", repo: "docs.nestjs.com", tier: "tier_2_official", architecturePattern: "Modular Layered Architecture" },
  { owner: "nestjs", repo: "nest", tier: "tier_2_official", architecturePattern: "Modular Architecture" },
  { owner: "tiangolo", repo: "fastapi", tier: "tier_2_official", architecturePattern: "FastAPI Async Web Service" },
  { owner: "dotnet-architecture", repo: "eShopOnContainers", tier: "tier_2_official", architecturePattern: "Microservices & DDD" },
  { owner: "spring-projects", repo: "spring-petclinic", tier: "tier_2_official", architecturePattern: "Spring Boot Layered" },

  // Tier 3: Verified High-Star Architecture References
  { owner: "kgrzybek", repo: "modular-monolith-with-ddd", tier: "tier_3_verified_oss", architecturePattern: "Modular Monolith & DDD" },
  { owner: "goldbergyoni", repo: "nodebestpractices", tier: "tier_3_verified_oss", architecturePattern: "Clean Node Architecture" },
  { owner: "iluwatar", repo: "java-design-patterns", tier: "tier_3_verified_oss", architecturePattern: "Design Patterns Catalog" },
];
