import { useNavigate } from 'react-router';

export const BACK = 'atrás';

// Simula el botón "atrás" del navegador.
export function BackButton() {
  const navigate = useNavigate();
  return <button onClick={() => navigate(-1)}>{BACK}</button>;
}
