import { JsonLdScript } from "../../_components/JsonLdScript";
import { createStaticPageStructuredData } from "../../_content/structured-data";
import { createServiceItems } from "../../_content/services";
import { getPublishedOrderProducts } from "../../../lib/publicContent";
import { OrderPageClient } from "./OrderPageClient";

export default async function OrderPage() {
  const products = await getPublishedOrderProducts();

  return (
    <>
      <JsonLdScript data={createStaticPageStructuredData("order")} />
      <OrderPageClient
        products={products}
        services={createServiceItems(products)}
      />
    </>
  );
}
