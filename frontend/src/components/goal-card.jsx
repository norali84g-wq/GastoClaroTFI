import { Chanchito } from './chanchito.jsx';
import { currentDate, formatMoney } from './common.jsx';
import { Progress } from './planning.jsx';
import { defaultGoalImage, goalImageUrl, monthlyGoalAmount } from '../domain/goal-images.js';
import { text } from '../texts.js';

export function GoalImage({ src, size = 100 }) {
  return (
    <img
      className="gc-goal-image"
      src={src || defaultGoalImage}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      alt=""
      onError={(event) => {
        if (!event.currentTarget.src.endsWith(defaultGoalImage))
          event.currentTarget.src = defaultGoalImage;
      }}
    />
  );
}

export function GoalCard({ goal, children }) {
  const monthlyAmount = monthlyGoalAmount(goal, currentDate());
  const reached = Number(goal.progress_percentage) >= 100;
  return (
    <div className="gc-goal-card">
      <GoalImage src={goalImageUrl(goal.image_url)} />
      <div>
        <h3>{goal.name}</h3>
        <p>
          <strong>
            {formatMoney(goal.saved_amount)} / {formatMoney(goal.target_amount)}
          </strong>
        </p>
        <Progress label={text.goalProgress(goal.name)} percentage={goal.progress_percentage} />
        {goal.deadline && (
          <p>
            {text.deadline} · <time dateTime={goal.deadline}>{goal.deadline}</time>
          </p>
        )}
        {monthlyAmount !== null && <p>{text.savePerMonth(formatMoney(monthlyAmount))}</p>}
        {reached && (
          <p className="gc-goal-reached">
            <Chanchito pose="celebrando" size={62} /> <strong>{text.goalReached}</strong>
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
