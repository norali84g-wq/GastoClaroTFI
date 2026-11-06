import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import SessionProvider from '../hooks/SessionProvider';
import App from '../App';

// Monta la app completa en `path`, con la sesión real. `extra` se monta dentro del router, al
// lado de la app (por ejemplo, para navegar hacia atrás desde una prueba).
export function renderApp(path, { extra } = {}) {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={[path]}>
      <SessionProvider>
        <App />
        {extra}
      </SessionProvider>
    </MemoryRouter>,
  );
  return { user };
}
