import { EvidenceValidator } from "../src/collectors/adaptive/evidence-validator";
import { Repository } from "../src/models/repository.models";

function createMockRepo(overrides: Partial<Repository> = {}): Repository {
  return {
    id: 12345,
    name: "test-repo",
    fullName: "test-org/test-repo",
    description: "A test repository",
    url: "https://github.com/test-org/test-repo",
    stars: 150,
    forks: 20,
    language: "Rust",
    defaultBranch: "main",
    owner: {
      login: "test-org",
      avatarUrl: "",
      profileUrl: "",
    },
    source: "github",
    sourceTier: "tier_3_verified_oss",
    topics: ["cqrs", "rust"],
    createdAt: "2024-01-01",
    updatedAt: "2024-01-02",
    ...overrides,
  };
}

function runTests() {
  console.log("🧪 Running Architecture Evidence Safety Gate Tests...\n");

  // Test 1: Reject stub repository (< 4 files)
  const stubRepo = createMockRepo({
    fingerprint: {
      repositoryId: 12345,
      repositoryFullName: "test-org/stub",
      defaultBranch: "main",
      entryPoints: [],
      manifests: [],
      detectedLayers: [],
      totalFiles: 2,
      totalDirectories: 1,
      collectedAt: new Date(),
    },
    readme: { content: "Just a small hello world project." },
  });

  const resStub = EvidenceValidator.validateRepository(stubRepo);
  console.log(`Test 1 - Stub Repo: Valid = ${resStub.isValid} (Score: ${resStub.evidenceScore})`);
  if (resStub.isValid) throw new Error("Stub repo should be rejected!");
  console.log("  [PASS] Successfully rejected stub repository.");

  // Test 2: Accept legitimate architecture repository
  const archRepo = createMockRepo({
    fingerprint: {
      repositoryId: 12345,
      repositoryFullName: "test-org/full-cqrs",
      defaultBranch: "main",
      entryPoints: ["src/main.rs"],
      manifests: [
        {
          filename: "Cargo.toml",
          frameworkDetected: ["Axum", "Tokio"],
          dependencies: {},
          devDependencies: {},
        },
      ],
      detectedLayers: [
        { layerName: "domain", matchPaths: ["src/domain"] },
        { layerName: "controllers", matchPaths: ["src/controllers"] },
        { layerName: "infrastructure", matchPaths: ["src/infrastructure"] },
      ],
      totalFiles: 35,
      totalDirectories: 8,
      collectedAt: new Date(),
    },
    readme: {
      content:
        "# Full CQRS Microservice\nImplements domain-driven design with clean architecture and event-driven commands.",
    },
  });

  const resArch = EvidenceValidator.validateRepository(archRepo);
  console.log(`\nTest 2 - Architecture Repo: Valid = ${resArch.isValid} (Score: ${resArch.evidenceScore})`);
  console.log(`  Signals: ${resArch.signals.join(" • ")}`);
  if (!resArch.isValid || resArch.evidenceScore < 0.60) {
    throw new Error("Legitimate architecture repo should pass with high score!");
  }
  console.log("  [PASS] Successfully verified high-signal architecture repository.");

  console.log("\n🎉 All Evidence Safety Gate tests passed successfully!");
}

runTests();
