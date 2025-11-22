import { Suspense } from "react";
import ClientApp from "./ClientApp";

export default function Page() {
  return (
    <Suspense fallback={<p>Loading app…</p>}>
      <ClientApp />
    </Suspense>
  );
}