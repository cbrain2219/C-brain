import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminSupabaseClient, getPublicPaymentLink } from "@repo/supabase";

import { createNoIndexMetadata } from "../../../_content/seo";
import { LinkPayPaymentForm } from "./LinkPayPaymentForm";

type LinkPayPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: LinkPayPageProps): Promise<Metadata> {
  const { id } = await params;
  const payment = await getPaymentLink(id);

  if (!payment) {
    return createNoIndexMetadata({
      title: "개인 결제창을 찾을 수 없습니다 | C-Brain",
    });
  }

  return createNoIndexMetadata({
    description: `${payment.client_name}의 ${payment.payment_name} 카드 결제 페이지입니다.`,
    path: `/linkpay/${payment.public_token}`,
    title: `${payment.client_name} 개인 결제 | C-Brain`,
  });
}

export default async function LinkPayPage({ params }: LinkPayPageProps) {
  const { id } = await params;
  const payment = await getPaymentLink(id);

  if (!payment) notFound();

  return (
    <LinkPayPaymentForm
      payment={{
        amount: payment.amount,
        category: payment.category,
        clientName: payment.client_name,
        isDisabled: payment.disabled_at !== null,
        pageQuantity: payment.page_quantity,
        paper: payment.paper,
        paymentName: payment.payment_name,
        publicToken: payment.public_token,
        service: payment.service,
      }}
    />
  );
}

async function getPaymentLink(publicToken: string) {
  return getPublicPaymentLink(createAdminSupabaseClient(), publicToken);
}
