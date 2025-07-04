import { Suspense } from "react";
import FindUploadContent from "./FindUploadContent";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FindUploadContent />
    </Suspense>
  );
}