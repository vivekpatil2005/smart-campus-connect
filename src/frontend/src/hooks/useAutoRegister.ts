import { useEffect, useRef } from "react";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

/**
 * Silently registers the authenticated user in the backend access control system
 * as soon as the actor is ready. Runs in the background without blocking the UI.
 */
export function useAutoRegister(): void {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const hasAttempted = useRef(false);

  useEffect(() => {
    // Reset if identity changes (e.g. logout/login)
    if (!identity) {
      hasAttempted.current = false;
      return;
    }

    if (!actor || isFetching) return;
    if (hasAttempted.current) return;

    hasAttempted.current = true;

    // Fire and forget — registration is idempotent and non-blocking
    actor.registerUser().catch(() => {
      // Silently ignore — user may already be registered or backend handles it gracefully
    });
  }, [actor, isFetching, identity]);
}
