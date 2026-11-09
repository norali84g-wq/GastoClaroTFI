import { useEffect, useState } from 'react';
import { text } from '../texts.js';

export function useData(load) {
  const [result, setResult] = useState({});
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ load, revision, data });
      },
      (error) => {
        if (!controller.signal.aborted) setResult({ load, revision, error });
      },
    );
    return () => controller.abort();
  }, [load, revision]);

  const current = result.load === load && result.revision === revision;
  return {
    data: current ? result.data : undefined,
    error: current ? result.error : undefined,
    loading: !current,
    reload: () => setRevision((previous) => previous + 1),
  };
}

export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function run(action) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }

  return { busy, error, run };
}

export const displayError = (error) =>
  error instanceof TypeError ? text.error : error?.message || text.error;
