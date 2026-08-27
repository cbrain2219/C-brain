import { JsonLdScript } from "../../_components/JsonLdScript";
import type { OrderCategoryId } from "../../_content/order";
import {
  createOrderBreadcrumbStructuredData,
  createOrderOfferCatalogStructuredData,
  createOrderPageStructuredData,
} from "../../_content/structured-data";
import { createServiceItems } from "../../_content/services";
import { getPublishedOrderProducts } from "../../../lib/publicContent";
import { OrderPageClient } from "./OrderPageClient";

type OrderPageContentProps = {
  initialCategoryId?: OrderCategoryId;
};

export async function OrderPageContent({
  initialCategoryId,
}: OrderPageContentProps) {
  const products = await getPublishedOrderProducts();

  return (
    <>
      <JsonLdScript data={createOrderPageStructuredData()} />
      <JsonLdScript data={createOrderOfferCatalogStructuredData(products)} />
      <JsonLdScript data={createOrderBreadcrumbStructuredData()} />
      <OrderPageClient
        initialCategoryId={initialCategoryId}
        products={products}
        services={createServiceItems(products)}
      />
    </>
  );
}
