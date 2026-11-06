// Muestra uno o varios mensajes de error y los anuncia a los lectores de pantalla.
export default function ErrorMessage({ id, messages }) {
  const list = [].concat(messages ?? []).filter(Boolean);
  if (list.length === 0) return null;

  return (
    <div id={id} className="error-message" role="alert">
      {list.length === 1 ? (
        <p>{list[0]}</p>
      ) : (
        <ul>
          {list.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
