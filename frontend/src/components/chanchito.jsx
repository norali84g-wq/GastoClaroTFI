import { text } from '../texts.js';

export function Chanchito({ pose, size = 80 }) {
  return (
    <img
      className="gc-pig"
      src={`/chanchito/${pose}.webp`}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
    />
  );
}

export function Status({ pose = 'vacio', message = text.empty, onRetry }) {
  return (
    <div className="gc-status">
      <Chanchito pose={pose} />
      <div>
        <p role={pose === 'error' ? 'alert' : 'status'}>{message}</p>
        {onRetry && (
          <button type="button" className="secondary" onClick={onRetry}>
            {text.retry}
          </button>
        )}
      </div>
    </div>
  );
}
