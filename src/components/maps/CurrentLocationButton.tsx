import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { reverseGeocode } from "@/lib/maps/maps.functions";
import type { SelectedPlace } from "@/lib/maps/types";

/** Pede consentimento do navegador só quando o usuário clica. */
export function CurrentLocationButton({
  onLocated,
  onError,
}: {
  onLocated: (place: SelectedPlace) => void;
  onError: (message: string) => void;
}) {
  const geocode = useServerFn(reverseGeocode);
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      onError("Seu navegador não oferece suporte à localização.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const place = await geocode({
            data: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
          });
          onLocated(place);
        } catch {
          onLocated({
            placeId: "",
            formattedAddress: "Minha localização",
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          onError("Permissão de localização negada. Autorize no navegador ou digite o endereço.");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          onError("Localização indisponível no momento. Digite o endereço manualmente.");
        } else {
          onError("A busca da sua localização demorou demais. Tente novamente.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="mt-2 text-xs font-medium text-primary underline-offset-2 hover:underline disabled:opacity-60"
    >
      {loading ? "Localizando…" : "📍 Usar minha localização"}
    </button>
  );
}
