// Runs once when the server starts. The Node-only part lives in its own file
// so the edge build doesn't try to bundle it.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation-node");
  }
}
