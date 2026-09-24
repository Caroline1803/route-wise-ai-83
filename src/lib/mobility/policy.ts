import type { MobilityOption, Wallet } from "./types";
import { round2 } from "./geo";

/**
 * Política corporativa + carteira. Todas as decisões financeiras e de
 * elegibilidade são determinísticas e ficam no backend — nunca na IA.
 */

export const DEFAULT_WALLET: Wallet = {
  balance: 240,
  currency: "BRL",
  policy: {
    allowedModals: ["BUS", "METRO", "TRAIN", "BIKE", "SCOOTER", "MULTIMODAL", "RIDE_HAILING"],
    rideHailingAllowedAfterHour: 20,
    monthlyLimit: 600,
    monthlyUsed: 372,
    maxPerTripRideHailing: 60,
  },
};

/** Campanha corporativa ativa de incentivo. */
export const ACTIVE_CAMPAIGN = {
  name: "Semana da Mobilidade Sustentável",
  description: "Transporte público e bicicleta com cashback adicional de 2%.",
  bonusModals: ["BUS", "METRO", "TRAIN", "BIKE", "MULTIMODAL"] as const,
  bonusRate: 0.02,
};

const BASE_CASHBACK_RATE: Record<string, number> = {
  BUS: 0.03,
  METRO: 0.03,
  TRAIN: 0.03,
  MULTIMODAL: 0.03,
  BIKE: 0.05,
  SCOOTER: 0.02,
  RIDE_HAILING: 0.01,
};

export function applyCashback(option: MobilityOption): MobilityOption {
  const base = BASE_CASHBACK_RATE[option.modal] ?? 0;
  const bonus = (ACTIVE_CAMPAIGN.bonusModals as readonly string[]).includes(option.modal)
    ? ACTIVE_CAMPAIGN.bonusRate
    : 0;
  return { ...option, cashback: round2(option.estimatedPrice * (base + bonus)) };
}

export function applyCorporatePolicy(
  option: MobilityOption,
  wallet: Wallet,
  hourOfDay: number,
): MobilityOption {
  const p = wallet.policy;
  const remaining = p.monthlyLimit - p.monthlyUsed;
  let eligible = true;
  let reason: string | undefined;

  if (!p.allowedModals.includes(option.modal)) {
    eligible = false;
    reason = "Modal não permitido pela política da empresa.";
  } else if (
    option.modal === "RIDE_HAILING" &&
    p.rideHailingAllowedAfterHour !== null &&
    hourOfDay < p.rideHailingAllowedAfterHour
  ) {
    eligible = false;
    reason = `Carro por app permitido pela empresa somente após ${p.rideHailingAllowedAfterHour}h.`;
  } else if (
    option.modal === "RIDE_HAILING" &&
    option.estimatedPrice > p.maxPerTripRideHailing
  ) {
    eligible = false;
    reason = `Valor acima do teto de R$ ${p.maxPerTripRideHailing} por viagem.`;
  } else if (option.estimatedPrice > wallet.balance) {
    eligible = false;
    reason = "Saldo corporativo insuficiente.";
  } else if (option.estimatedPrice > remaining) {
    eligible = false;
    reason = "Limite mensal da empresa atingido.";
  }

  return {
    ...option,
    corporateEligible: eligible,
    ...(reason ? { corporateRestrictionReason: reason } : {}),
  };
}

/** Economia estimada em relação a uma viagem individual de carro. */
export function estimateSavings(option: MobilityOption, carBaseline: number): number {
  return round2(Math.max(0, carBaseline - option.estimatedPrice));
}
