export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { runDatabaseMigrations } = await import("./lib/db/migration-runner");
  const summary = await runDatabaseMigrations();

  console.log("[db.migrations] ready", {
    currentVersion: summary.currentVersion,
    appliedVersions: summary.appliedVersions,
    pendingVersions: summary.pendingVersions,
  });
}
