import type { X402PaymentChallenge, X402PaymentHeader, X402PaymentResult } from "../types/index.js";
import { PAYMENT_CONFIG } from "./pricing.js";

export function parseX402Header(headerValue: string | null): X402PaymentHeader | null {
  if (!headerValue) {
    return null;
  }

  try {
    const parts = headerValue.split(" ");
    if (parts[0] !== "x402" || !parts[1]) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
    const authorization = decoded.payload?.authorization ?? decoded.authorization ?? decoded;
    const signature = decoded.payload?.signature ?? decoded.signature;

    if (!signature || !authorization?.from || !authorization?.amount || !authorization?.token) {
      return null;
    }

    return {
      payload: parts[1],
      signature,
      payer: authorization.from,
      amount: authorization.amount,
      token: authorization.token,
      chainId: authorization.chainId,
    };
  } catch {
    return null;
  }
}

export function generatePaymentChallenge(
  toolName: string,
  requiredAmount: string,
  recipientAddress: string,
): X402PaymentChallenge {
  return {
    version: "x402/1.0",
    network: {
      chainId: PAYMENT_CONFIG.chainId,
      name: PAYMENT_CONFIG.network,
    },
    payment: {
      token: PAYMENT_CONFIG.token.address,
      symbol: PAYMENT_CONFIG.token.symbol,
      decimals: PAYMENT_CONFIG.token.decimals,
      amount: requiredAmount,
      recipient: recipientAddress,
    },
    facilitator: {
      url: PAYMENT_CONFIG.facilitatorUrl,
      type: "x402",
    },
    resource: {
      tool: toolName,
      description: `Access to ${toolName} MCP tool`,
    },
  };
}

export function encodePaymentRequired(challenge: X402PaymentChallenge): string {
  return Buffer.from(JSON.stringify(challenge)).toString("base64");
}

export async function verifyAndSettlePayment(
  paymentHeader: X402PaymentHeader,
  requiredAmount: string,
  recipientAddress: string,
): Promise<X402PaymentResult> {
  try {
    if (paymentHeader.chainId !== PAYMENT_CONFIG.chainId) {
      return {
        valid: false,
        error: `Invalid chain ID. Expected ${PAYMENT_CONFIG.chainId} (Base), got ${paymentHeader.chainId}`,
      };
    }

    if (paymentHeader.token.toLowerCase() !== PAYMENT_CONFIG.token.address.toLowerCase()) {
      return {
        valid: false,
        error: `Invalid token. Expected ${PAYMENT_CONFIG.token.symbol} (${PAYMENT_CONFIG.token.address})`,
      };
    }

    if (BigInt(paymentHeader.amount) < BigInt(requiredAmount)) {
      return {
        valid: false,
        error: `Insufficient payment. Required: ${requiredAmount}, received: ${paymentHeader.amount}`,
      };
    }

    const settlementResult = await settleViaFacilitator(paymentHeader, recipientAddress);
    return settlementResult;
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Payment verification failed",
    };
  }
}

async function settleViaFacilitator(
  paymentHeader: X402PaymentHeader,
  recipientAddress: string,
): Promise<X402PaymentResult> {
  const response = await fetch(`${PAYMENT_CONFIG.facilitatorUrl}/settle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      payment: paymentHeader.payload,
      recipient: recipientAddress,
      chainId: paymentHeader.chainId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      valid: false,
      error: `Facilitator settlement failed: ${errorText}`,
    };
  }

  const result = (await response.json()) as { txHash: string };

  return {
    valid: true,
    txHash: result.txHash,
    payer: paymentHeader.payer,
    amount: paymentHeader.amount,
  };
}

export function createPaymentMiddleware(recipientAddress: string) {
  return {
    async verifyPayment(
      toolName: string,
      requiredAmount: string,
      paymentHeaderValue: string | null,
    ): Promise<{ allowed: boolean; error?: string; challenge?: X402PaymentChallenge }> {
      const payment = parseX402Header(paymentHeaderValue);

      if (!payment) {
        return {
          allowed: false,
          challenge: generatePaymentChallenge(toolName, requiredAmount, recipientAddress),
        };
      }

      const result = await verifyAndSettlePayment(payment, requiredAmount, recipientAddress);

      if (!result.valid) {
        return {
          allowed: false,
          error: result.error,
          challenge: generatePaymentChallenge(toolName, requiredAmount, recipientAddress),
        };
      }

      return { allowed: true };
    },
  };
}
