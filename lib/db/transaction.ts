// The node-postgres pool supports transactions directly, so transactional writes
// share the main pool. Kept as its own export so callers don't change.
export { db as transactionDb } from "./index";
