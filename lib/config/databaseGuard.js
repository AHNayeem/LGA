// Guards for operations that must never touch a real learner database: test-fixture
// approvals, dropping databases, Atlas test runs. A database qualifies only if its name
// says so (e.g. lga_dev, lga_itest_1a2b, e2e, test_ab12) and NODE_ENV is not production.
const NON_PRODUCTION_NAME = /(^|[_-])(dev|test|tests|e2e|itest|staging|sandbox)([_-]|\d|$)/i;

export function isNonProductionDatabaseName(name) {
  return typeof name === "string" && NON_PRODUCTION_NAME.test(name);
}

export function assertNonProductionDatabase(name, purpose) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(`Refusing to ${purpose}: NODE_ENV is "production".`);
  }
  if (!isNonProductionDatabaseName(name)) {
    throw new Error(
      `Refusing to ${purpose} on database "${name}". Use a dedicated development/test database whose name contains dev, test, e2e, itest, staging or sandbox (e.g. MONGODB_DB=lga_dev).`,
    );
  }
}
