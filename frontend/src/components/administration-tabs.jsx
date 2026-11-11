import { Link } from '@tanstack/react-router';
import { text } from '../texts.js';

export function AdministrationTabs({ current = 'resumen' }) {
  const sections = [
    ['resumen', text.adminSummary],
    ['usuarios', text.adminUsers],
    ['categorias', text.categories],
    ['soporte', text.support],
  ];

  return (
    <nav className="actions administration-tabs" aria-label={text.administration}>
      {sections.map(([id, label]) => (
        <Link
          key={id}
          to={id === 'categorias' ? '/categorias' : '/administracion'}
          search={id === 'usuarios' || id === 'soporte' ? { tab: id } : {}}
          className={id === current ? 'button' : 'button secondary'}
          aria-current={id === current ? 'page' : undefined}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
