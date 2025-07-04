import { Suspense } from "react";
import FindAnimeContent from "./FindAnimeContent";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FindAnimeContent />
    </Suspense>
  );
}