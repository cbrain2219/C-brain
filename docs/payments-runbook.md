# Payments runbook

## Environment switch

- Set `NICEPAY_MODE=sandbox` with sandbox `NEXT_PUBLIC_NICEPAY_CLIENT_KEY` and `NICEPAY_SECRET_KEY` while testing. Switch all three together for production; never expose `NICEPAY_SECRET_KEY` to the browser.
- Set `NEXT_PUBLIC_SITE_URL` to the active HTTPS user-site origin and `ADMIN_APP_URL` to the exact HTTPS admin-app origin. `ADMIN_APP_URL` has no trailing slash and is the only browser Origin allowed for payment administration.
- Configure NICEPAY with one shared return URL: `https://<user-site>/api/payments/nicepay/return`, and one webhook URL: `https://<user-site>/api/payments/nicepay/webhook`.
- The webhook acknowledgement must be exactly HTTP 200 with body `OK` and `Content-Type: text/html; charset=utf-8`.

## Unknown payment or refund

1. Do not retry a new refund with a different request ID. An unknown refund is a reservation and deliberately blocks further refunds for that payment.
2. From the authenticated admin origin, call `POST /api/admin/payments/{paymentId}/reconcile`. The endpoint queries NICEPAY using the stored original TID and resolves only a signed, amount- and balance-matching payment or existing refund reservation.
3. If reconciliation remains unknown, compare the provider transaction with the ledger: original `payments.nicepay_tid`, payment amount and `balance_amount`, then the matching `refunds.nicepay_cancelled_tid`, request ID, amount, and status. Escalate any mismatch for manual investigation.
4. Do not create a local refund to represent an unexpected console cancellation. Keep the payment unknown until an operator has verified the provider evidence.
5. A repeated refund request ID may return pending while the original request is running. Do not retry it with a new ID: NICEPAY is called only by the invocation that created the reservation.
6. Approval-recovery net-cancel is recoverable by original order ID only when the ledger already contains `NET_CANCEL_REQUESTED` or `NET_CANCEL_PERSISTENCE_UNKNOWN`. An otherwise identical console cancellation stays unknown for manual review.

## Operational checks

- To stop a LinkPay, set its `disabled_at`. Its public page remains available, but new checkout must return a conflict; existing orders and payments must not change.
- A partial cancellation must have a unique refund order ID and a `cancelAmt` equal to the refund amount. NICEPAY cancellation webhooks carry this refund order ID, not the original payment order ID; reconciliation also verifies the original TID, cancellation TID, amount, balance change, and the matched cancellation receipt (`cancels[].receiptUrl`). A full cancellation omits `cancelAmt` and cancels the remaining balance.
- If `canPartCancel` is false, reject a partial refund before calling NICEPAY. A full remaining-balance cancellation may still be attempted.
- Never cancel payments directly in the NICEPAY console for this MVP. All expected cancellations start from the admin refund endpoint so that the ledger reservation can be matched. Treat any direct console cancellation as an unexpected cancellation and verify it manually.
