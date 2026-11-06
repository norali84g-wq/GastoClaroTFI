// `headingLevel` permite ubicar el título en la jerarquía de la página (por defecto, h2).
export default function EmptyState({ title, description, action, headingLevel = 2 }) {
  const Heading = `h${headingLevel}`;

  return (
    <section className="empty-state">
      <Heading>{title}</Heading>
      {description && <p>{description}</p>}
      {action}
    </section>
  );
}
