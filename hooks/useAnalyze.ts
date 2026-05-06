import { useMutation } from "@tanstack/react-query";
import { analyzeUrl } from "@/services/api";
import { normalizeUrl } from "@/utils/url";

export function useAnalyze() {
  return useMutation({
    mutationFn: (input: string) => analyzeUrl(normalizeUrl(input))
  });
}
