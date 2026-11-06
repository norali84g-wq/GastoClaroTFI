import { render, screen } from '@testing-library/react';
import { TOAST_TONE } from '../../config/constants';
import es from '../../locales/es.json';
import Toast from './Toast';

function toastSpace() {
  return document.documentElement.style.getPropertyValue('--toast-space');
}

describe('Toast', () => {
  it('mientras está a la vista, reserva su lugar para no tapar el final de la página', () => {
    const { rerender, unmount } = render(<Toast toast={null} />);
    expect(toastSpace()).toBe('');

    rerender(<Toast toast={{ message: ['No se pudo guardar'], tone: TOAST_TONE.ERROR }} />);
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo guardar');
    expect(screen.getByRole('button', { name: es.common.close })).toBeInTheDocument();
    expect(toastSpace()).toMatch(/^\d+(\.\d+)?px$/);

    rerender(<Toast toast={null} />);
    expect(toastSpace()).toBe('');

    // Si la pantalla se desmonta con el aviso abierto, tampoco queda el lugar reservado.
    rerender(<Toast toast={{ message: 'Gasto guardado.', tone: TOAST_TONE.SUCCESS }} />);
    unmount();
    expect(toastSpace()).toBe('');
  });
});
