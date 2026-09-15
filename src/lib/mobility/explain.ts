import type { MobilityOption } from "./types";

/**
 * Camada de IA generativa — APENAS explica a recomendação já decidida pelo
 * backend. Nunca aprova pagamento, altera saldo, política, autoriza modal ou
 * calcula valores oficiais: todos os números vêm prontos do motor determinístico.
 */

export function templateExplanation(option: MobilityOption | null): string {
  if (!option) {
    return "Nenhuma opção elegível pela política corporativa foi encontrada para este trajeto.";
  }
  const parts = [
    `Recomendamos ${option.productName} porque oferece o melhor equilíbrio entre custo, tempo e sustentabilidade para este trajeto.`,
    `A viagem leva cerca de ${option.estimatedTimeMinutes} minutos por R$ ${option.estimatedPrice.toFixed(2).replace(".", ",")}.`,
  ];
  if (option.cashback) {
    parts.push(
      `Você recebe R$ ${option.cashback.toFixed(2).replace(".", ",")} de cashback após a confirmação da viagem.`,
    );
  }
  if (option.savingsVsCar) {
    parts.push(
      `A economia estimada frente a uma viagem individual de carro é de aproximadamente R$ ${option.savingsVsCar.toFixed(2).replace(".", ",")}.`,
    );
  }
  return parts.join(" ");
}

/** Se houver chave de IA configurada no backend, refina o texto. */
export async function generateExplanation(
  option: MobilityOption | null,
): Promise<string> {
  const fallback = templateExplanation(option);
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey || !option) return fallback;

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "Você é a MaaS AI. Explique em 2 frases, em português do Brasil, por que a opção de mobilidade abaixo foi recomendada. Não invente números: use apenas os fornecidos. Não fale sobre pagamento, saldo ou aprovação.",
          },
          { role: "user", content: JSON.stringify(option) },
        ],
      }),
    });
    if (!res.ok) return fallback;
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return json.choices?.[0]?.message?.content?.trim() || fallback;
  } catch {
    return fallback;
  }
}
