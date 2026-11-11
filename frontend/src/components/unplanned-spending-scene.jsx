import { useEffect, useRef, useState } from 'react';
import { text } from '../texts.js';
import './unplanned-spending-scene.css';

const firstDeparture = 400;
const departureGap = 900;
const walkTimes = [3600, 3510, 3690, 3564, 3636, 3600];
const stepHeights = [0, -3, 2, -1, 3, -2];
const coinDropTime = 460;
const finalFrameTime = 4000;
const pile = [
  [702, 190],
  [722, 190],
  [742, 190],
  [712, 173],
  [732, 173],
  [722, 156],
];

function Coin({ x, y, size }) {
  return (
    <image
      href="/hormiga/moneda.webp"
      x={x - size / 2}
      y={y - size / 2}
      width={size}
      height={size}
    />
  );
}

function Jar({ journeys }) {
  const frames = [
    { name: 'lleno', departure: 0 },
    { name: 'medio', departure: journeys[2]?.departure },
    { name: 'vacio', departure: journeys[5]?.departure },
  ].filter(({ departure }) => departure !== undefined);

  return (
    <g className="gc-ant-jar">
      {frames.map(({ name, departure }, index) => {
        const next = frames[index + 1];
        return (
          <image
            key={name}
            className="gc-ant-jar-frame"
            data-initial={index === 0 || undefined}
            data-final={!next || undefined}
            style={{ '--jar-in': `${departure}ms`, '--jar-out': `${next?.departure ?? 0}ms` }}
            href={`/hormiga/frasco-${name}.webp`}
            x="149"
            y="70"
            width="132"
            height="132"
          />
        );
      })}
    </g>
  );
}

function Ant({ departure, duration, height }) {
  return (
    <g transform={`translate(280 ${132 + height})`}>
      <g
        className="gc-ant-walker"
        style={{
          '--ant-delay': `${departure}ms`,
          '--walk-time': `${duration}ms`,
          '--step-time': `${duration / 9}ms`,
          '--trot-time': `${duration / 18}ms`,
        }}
      >
        <g className="gc-ant-trot">
          <image
            className="gc-ant-pose-a"
            href="/hormiga/hormiga-a.webp"
            width="112.6"
            height="70.4"
          />
          <image
            className="gc-ant-pose-b"
            href="/hormiga/hormiga-b.webp"
            width="112.6"
            height="70.4"
          />
          <Coin x={46} y={13} size={31} />
        </g>
      </g>
    </g>
  );
}

export function UnplannedSpendingScene({ productCount, total }) {
  return productCount > 0 ? <Scene productCount={productCount} total={total} /> : null;
}

function Scene({ productCount, total }) {
  const scene = useRef(null);
  const [started, setStarted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  const [cycle, setCycle] = useState(0);
  const journeys = walkTimes.slice(0, productCount).map((duration, index) => {
    const departure = firstDeparture + index * departureGap;
    return { departure, duration, arrival: departure + duration, height: stepHeights[index] };
  });

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      setStarted(true);
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const inView = entry.intersectionRatio >= 0.5;
        setVisible(inView);
        if (inView) setStarted(true);
      },
      { threshold: 0.5 },
    );
    observer.observe(scene.current);
    return () => observer.disconnect();
  }, []);

  const running = visible && !paused;
  useEffect(() => {
    if (!running || !finished) return;
    const timer = setTimeout(() => {
      setFinished(false);
      setCycle((previous) => previous + 1);
    }, finalFrameTime);
    return () => clearTimeout(timer);
  }, [finished, running]);

  return (
    <div className="gc-ant-scene" ref={scene}>
      <figure
        key={cycle}
        className={started ? 'gc-ant-playing' : undefined}
        data-paused={!running || undefined}
        style={{
          '--first-departure': `${firstDeparture}ms`,
          '--coin-drop-time': `${coinDropTime}ms`,
          '--caption-delay': `${journeys.at(-1).arrival + coinDropTime}ms`,
        }}
      >
        <svg
          className="gc-ant-art"
          viewBox="0 0 860 250"
          role="img"
          aria-label={text.unplannedSceneLabel}
        >
          <image href="/hormiga/piso.webp" x="0" y="170" width="860" height="134.4" />
          <g className="gc-ant-pig">
            <image
              className="gc-ant-pig-watching"
              href="/chanchito/pensativo.webp"
              x="-14"
              y="58"
              width="170"
              height="170"
            />
            <image
              className="gc-ant-pig-worried"
              href="/chanchito/preocupado.webp"
              x="-14"
              y="58"
              width="170"
              height="170"
            />
          </g>
          <Jar journeys={journeys} />
          <image
            className="gc-ant-mound"
            href="/hormiga/hormiguero.webp"
            x="528"
            y="35"
            width="281.6"
            height="193.6"
          />
          {journeys.map(({ departure, duration, height }) => (
            <Ant key={departure} departure={departure} duration={duration} height={height} />
          ))}
          {journeys.map(({ arrival }, index) => {
            const [x, y] = pile[index];
            return (
              <g key={arrival} className="gc-ant-stack" style={{ '--coin-delay': `${arrival}ms` }}>
                <Coin x={x} y={y} size={25} />
              </g>
            );
          })}
        </svg>
        <figcaption className="gc-ant-caption" onAnimationEnd={() => setFinished(true)}>
          {text.unplannedSceneCaption(productCount, total)}
        </figcaption>
      </figure>
      <button
        className="secondary gc-ant-pause"
        type="button"
        aria-label="Pausar animación"
        aria-pressed={paused}
        onClick={() => setPaused((previous) => !previous)}
      >
        <span aria-hidden="true">{paused ? '▶' : 'Ⅱ'}</span>
      </button>
    </div>
  );
}
