import { useCallback, useEffect, useState } from "react";

// Runs an async function and tracks { data, loading, error }.
// Pass `null` as the fetcher to skip the request (e.g. nothing selected yet).
// Re-runs whenever anything in `deps` changes. Call `refetch()` to force a reload.
export function useApi(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, loading: Boolean(fetcher), error: null });
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    if (!fetcher) {
      setState({ data: null, loading: false, error: null });
      return undefined;
    }

    let ignore = false; // prevents an old, slow response overwriting a newer one
    setState((previous) => ({ ...previous, loading: true, error: null }));

    fetcher()
      .then((data) => {
        if (!ignore) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (!ignore) setState({ data: null, loading: false, error: error.message });
      });

    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadCount]);

  const refetch = useCallback(() => setReloadCount((count) => count + 1), []);

  return { ...state, refetch };
}
