import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { autocompletePlaces, getPlaceDetails } from "@/lib/maps/maps.functions";
import type { PlaceSuggestion, SelectedPlace } from "@/lib/maps/types";

function newSessionToken() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

/** Autocomplete de endereços servido pelo backend (Places API New via gateway). */
export function AddressAutocomplete({
  label,
  value,
  onSelect,
  onError,
}: {
  label: string;
  value: SelectedPlace | null;
  onSelect: (place: SelectedPlace) => void;
  onError: (message: string) => void;
}) {
  const suggest = useServerFn(autocompletePlaces);
  const details = useServerFn(getPlaceDetails);

  const [text, setText] = useState(value?.formattedAddress ?? "");
  const [items, setItems] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const sessionRef = useRef(newSessionToken());
  const requestRef = useRef(0);
  const skipRef = useRef(false);

  useEffect(() => {
    if (value && value.formattedAddress !== text) {
      skipRef.current = true;
      setText(value.formattedAddress);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.placeId, value?.formattedAddress]);

  useEffect(() => {
    if (skipRef.current) {
      skipRef.current = false;
      return;
    }
    const query = text.trim();
    if (query.length < 3) {
      setItems([]);
      return;
    }
    const id = ++requestRef.current;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const result = await suggest({
          data: { query, sessionToken: sessionRef.current },
        });
        if (id !== requestRef.current) return;
        setItems(result);
        setOpen(true);
      } catch (e) {
        if (id === requestRef.current) {
          setItems([]);
          onError(
            (e as Error).message ||
              "Não foi possível buscar endereços agora. Tente novamente.",
          );
        }
      } finally {
        if (id === requestRef.current) setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const choose = async (suggestion: PlaceSuggestion) => {
    skipRef.current = true;
    setText(suggestion.description);
    setOpen(false);
    setItems([]);
    try {
      const place = await details({
        data: { placeId: suggestion.placeId, sessionToken: sessionRef.current },
      });
      sessionRef.current = newSessionToken();
      onSelect(place);
    } catch (e) {
      onError((e as Error).message || "Endereço não encontrado. Tente outro.");
    }
  };

  return (
    <div className="relative block text-sm">
      <span className="font-medium text-foreground">{label}</span>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={() => items.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Ex.: Av. Paulista, 1000"
        autoComplete="off"
        className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-foreground outline-none focus:ring-2 focus:ring-ring"
      />
      {loading && (
        <span className="absolute right-3 top-10 text-xs text-muted-foreground">…</span>
      )}
      {open && items.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-border bg-card shadow-soft">
          {items.map((item) => (
            <li key={item.placeId}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => void choose(item)}
                className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-secondary"
              >
                {item.description}
              </button>
            </li>
          ))}
        </ul>
      )}
      {value && (
        <p className="mt-1 text-xs text-muted-foreground">
          ✓ {value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}
        </p>
      )}
    </div>
  );
}
