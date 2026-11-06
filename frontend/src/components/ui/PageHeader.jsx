// Encabezado de pantalla: una línea chica en versales (`eyebrow`, opcional) y debajo el título.
export default function PageHeader({ eyebrow, title }) {
  return (
    <div className="page-header">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
    </div>
  );
}
