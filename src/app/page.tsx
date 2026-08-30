import { Dashboard } from "@/components/Dashboard";
import { IPOS } from "@/lib/dataset";

/**
 * The dataset is normalised at build time and shipped with the page, so the
 * table is populated on first paint -- no fetch, no spinner, no empty state
 * while a request is in flight.
 */
export default function Home() {
  return <Dashboard records={IPOS} />;
}
