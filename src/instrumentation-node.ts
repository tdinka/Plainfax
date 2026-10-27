// Keeps the "unpaid documents are deleted within 24 hours" promise by
// cleaning up at startup and then every hour.
import { purgeAbandonedDrafts } from "./lib/lifecycle";

const run = () =>
  void purgeAbandonedDrafts()
    .then((count) => count && console.log(`deleted ${count} unpaid document(s)`))
    .catch((err) => console.error("unpaid document cleanup failed", err));

run();
setInterval(run, 60 * 60 * 1000).unref();
