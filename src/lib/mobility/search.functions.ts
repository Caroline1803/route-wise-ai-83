import { createServerFn } from "@tanstack/react-start";
import type { SearchRequest, SearchResponse } from "./types";

/** RPC tipado usado pelo frontend. Nenhuma credencial chega ao navegador. */
export const searchMobility = createServerFn({ method: "POST" })
  .inputValidator((input: SearchRequest) => input)
  .handler(async ({ data }): Promise<SearchResponse> => {
    const { runMobilitySearch, validateSearchInput } = await import("./search.server");
    return runMobilitySearch(validateSearchInput(data));
  });
