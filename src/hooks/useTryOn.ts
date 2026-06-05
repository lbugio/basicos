import { useCallback, useState } from "react";
import { Product } from "@/types/woocommerce";

type TryOnStatus = "idle" | "generating" | "done" | "error";

export function useTryOn() {
  const [status, setStatus] = useState<TryOnStatus>("idle");
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setResultImage(null);
    setError(null);
  }, []);

  const generate = useCallback(
    async (
      userImageFile: File,
      product: Product,
      options?: { size?: string; color?: string }
    ) => {
      setStatus("generating");
      setResultImage(null);
      setError(null);

      const body = new FormData();
      body.append("userImage", userImageFile);
      body.append("garmentImageUrl", product.image);
      body.append("productName", product.name);
      if (options?.size) body.append("size", options.size);
      if (options?.color) body.append("color", options.color);

      try {
        const response = await fetch("/api/try-on", {
          method: "POST",
          body,
        });
        const payload = (await response.json()) as {
          image?: string;
          error?: string;
        };

        if (!response.ok || !payload.image) {
          throw new Error(payload.error || "No pudimos generar el probador");
        }

        setResultImage(payload.image);
        setStatus("done");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "No pudimos generar el probador";
        setError(message);
        setStatus("error");
      }
    },
    []
  );

  return {
    status,
    resultImage,
    error,
    generate,
    reset,
  };
}
