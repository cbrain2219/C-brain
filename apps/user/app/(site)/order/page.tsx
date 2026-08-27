import { JsonLdScript } from "../../_components/JsonLdScript";
import {
  createOrderBreadcrumbStructuredData,
  createOrderOfferCatalogStructuredData,
  createOrderPageStructuredData,
} from "../../_content/structured-data";
import { createServiceItems } from "../../_content/services";
import { getPublishedOrderProducts } from "../../../lib/publicContent";
import { OrderPageClient } from "./OrderPageClient";

export default async function OrderPage() {
  const products = await getPublishedOrderProducts();

  return (
    <>
      <JsonLdScript data={createOrderPageStructuredData()} />
      <JsonLdScript data={createOrderOfferCatalogStructuredData(products)} />
      <JsonLdScript data={createOrderBreadcrumbStructuredData()} />
      <OrderPageClient
        products={products}
        services={createServiceItems(products)}
      />
    </>
  );
}
