import { createContext, useContext, useEffect, useState } from 'react';
import { esClaveIcono, iconoPorNombre } from '../domain/icons.js';
import { useData } from './data.js';
import { AccountContext, api } from './session.js';

const IconContext = createContext(null);

function useLocalIcons(scope) {
  const key = `gastoclaro.icons.${import.meta.env.VITE_API_URL ?? ''}.${scope}`;
  const [icons, setIcons] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(icons));
    } catch {
      // The current session can still display the selected icon.
    }
  }, [icons, key]);

  function remember(record, selection) {
    const local = !Object.hasOwn(record, 'icon');
    setIcons((previous) => {
      const next = { ...previous };
      if (local && selection) next[record.id] = selection;
      else delete next[record.id];
      return next;
    });
    return local;
  }

  function selected(record) {
    const value = Object.hasOwn(record, 'icon') ? record.icon : icons[record.id];
    if (!esClaveIcono(value)) return '';
    // When the server persists the suggested key, it has no separate automatic flag.
    return Object.hasOwn(record, 'icon') && value === iconoPorNombre(record.name) ? '' : value;
  }

  return {
    remember,
    selected,
    resolve: (record) => selected(record) || iconoPorNombre(record.name),
  };
}

export function IconPreferences({ children }) {
  const account = useContext(AccountContext);
  const categories = useData(api.categories);
  const categoryIcons = useLocalIcons('categories');
  const paymentIcons = useLocalIcons(`payments.${account.id ?? account.user}`);

  return (
    <IconContext.Provider value={{ categories, categoryIcons, paymentIcons }}>
      {children}
    </IconContext.Provider>
  );
}

export function useIconPreferences() {
  return useContext(IconContext);
}
