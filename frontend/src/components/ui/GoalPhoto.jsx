import { useState } from 'react';
import GoalArt from './GoalArt';

// Foto de una escena (montaña, mar o casa). Si el archivo no está o no carga, se muestra la
// ilustración en su lugar.
export default function GoalPhoto({
  scene,
  src,
  className = 'goal-photo',
  artClassName = 'goal-art',
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) return <GoalArt scene={scene} className={artClassName} />;
  return (
    <img className={className} src={src} alt="" loading="lazy" onError={() => setFailed(true)} />
  );
}
