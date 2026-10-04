import { Suspense } from "react";
import { PageSpinner } from "../components/ui/Spinner";
import ProductsContent from "./ProductsContent";

export default function ProductsPage() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <ProductsContent />
    </Suspense>
  );
}
