import {
  CategoryMiniBars,
  ComparisonEffects,
  ComparisonSummary,
  Trend,
  changeTone,
} from '../components/comparison-effects.jsx';
import { relativeChange } from '../domain/comparison.js';
import { CategoryOptions } from '../components/category-options.jsx';
import { groupStatisticsCategories } from '../domain/categories.js';
import { useIconPreferences } from '../hooks/icon-preferences.jsx';
import { ProductIcon } from '../components/icono.jsx';
import { CategoriaIcono } from '../components/categoria-icono.jsx';
import { useCallback, useEffect, useId, useState } from 'react';
import { ApiError } from '../api/client.js';
import { currentPeriod, DataState, Field, FormError, formatMoney } from '../components/common.jsx';
import { CategoryBreakdown, ComparisonBars, MonthlyHistory } from '../components/charts.jsx';
import { Chanchito, Status } from '../components/chanchito.jsx';
import { UnplannedSpendingScene } from '../components/unplanned-spending-scene.jsx';
import { shiftPeriod } from '../domain/periods.js';
import { useData } from '../hooks/data.js';
import { api } from '../hooks/session.js';
import { text } from '../texts.js';

const quantity = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 6 });
const monthName = new Intl.DateTimeFormat('es-AR', { month: 'long', timeZone: 'UTC' });

function ProductTable({ products, from, to }) {
  if (!products.length) return <Status message={text.noProductDetail} />;
  const price = (value) => (value == null ? '—' : formatMoney(value));
  return (
    <div className="gc-table-scroll" tabIndex={0} role="region" aria-label={text.comparedProducts}>
      <table className="gc-report-table">
        <thead>
          <tr>
            <th scope="col">{text.itemName}</th>
            <th scope="col">{from}</th>
            <th scope="col">{to}</th>
            <th scope="col">{text.comparisonPriceChange}</th>
            <th scope="col">{text.variation}</th>
          </tr>
        </thead>
        <tbody>
          {products.map((item) => (
            <tr key={JSON.stringify([item.name, item.unit])}>
              <th scope="row">
                <span className="gc-category-heading">
                  <ProductIcon name={item.name} />
                  {item.name} · {text.itemUnits[item.unit]}
                </span>
                <small className={`gc-product-status gc-product-${item.status}`}>
                  {text.productStatus[item.status]}
                </small>
              </th>
              <td>
                {text.itemQuantity} {quantity.format(item.from_quantity)}
                <small>
                  {text.unitPrice} {price(item.from_unit_price)}
                </small>
              </td>
              <td>
                {text.itemQuantity} {quantity.format(item.to_quantity)}
                <small>
                  {text.unitPrice} {price(item.to_unit_price)}
                </small>
              </td>
              <td>
                <Trend
                  value={
                    item.status === 'bought'
                      ? relativeChange(item.from_unit_price, item.to_unit_price)
                      : null
                  }
                  unavailable={text.comparisonNoPrice}
                />
              </td>
              <td>{formatMoney(item.difference)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CategoryComparison({ comparison, from, to }) {
  return (
    <li className="panel planning-report">
      <details>
        <summary className="gc-category-comparison">
          <span className="gc-category-heading">
            <CategoriaIcono nombre={comparison.category.name} id={comparison.category.id} />
            <strong>{comparison.category.name}</strong>
            <Trend
              value={
                comparison.percent_change == null ? null : Number(comparison.percent_change) / 100
              }
            />
          </span>
          <CategoryMiniBars
            before={comparison.from_total}
            after={comparison.to_total}
            from={from}
            to={to}
          />
        </summary>
        <ComparisonEffects comparison={comparison} fromPeriod={from} toPeriod={to} />
        <h3>{text.comparedProducts}</h3>
        <ProductTable products={comparison.products} from={from} to={to} />
      </details>
    </li>
  );
}

function ComparisonResult({ data }) {
  if (!data.categories.length) return <Status pose="pensativo" message={text.comparisonEmpty} />;
  const difference = Number(data.difference);
  const summary = { difference };
  for (const field of ['price_effect', 'quantity_effect', 'other_effect']) {
    summary[field] =
      data.categories.reduce((sum, row) => sum + Math.round(Number(row[field]) * 100), 0) / 100;
  }
  return (
    <>
      <ComparisonSummary
        before={data.from_total}
        after={data.to_total}
        fromPeriod={data.from_period}
        toPeriod={data.to_period}
        currentPeriod={currentPeriod()}
      />
      <div className="gc-comparison-metrics">
        <div className="panel">
          <small>
            {text.baseMonth} · {data.from_period}
          </small>
          <strong>{formatMoney(data.from_total)}</strong>
        </div>
        <div className="panel">
          <small>
            {text.comparisonMonth} · {data.to_period}
          </small>
          <strong>{formatMoney(data.to_total)}</strong>
        </div>
        <div className={`panel gc-effect-${changeTone(difference)}`}>
          <small>{text.percentVariation}</small>
          <strong>
            <Trend value={relativeChange(data.from_total, data.to_total)} />
          </strong>
        </div>
      </div>
      <ComparisonEffects
        comparison={summary}
        fromPeriod={data.from_period}
        toPeriod={data.to_period}
      />
      <ComparisonBars categories={data.categories} from={data.from_period} to={data.to_period} />
      <ul className="records">
        {data.categories.map((item) => (
          <CategoryComparison
            key={item.category.id}
            comparison={item}
            from={data.from_period}
            to={data.to_period}
          />
        ))}
      </ul>
    </>
  );
}

function SelectedCategoryComparison({ from, to }) {
  const difference = Number(to.real_total) - Number(from.real_total);
  return (
    <section className="panel">
      <h2 className="gc-category-heading">
        <CategoriaIcono nombre={from.category.name} id={from.category.id} />
        {from.category.name}
      </h2>
      <ComparisonSummary
        before={from.real_total}
        after={to.real_total}
        fromPeriod={from.period}
        toPeriod={to.period}
        currentPeriod={currentPeriod()}
      />
      <p>{text.categoryComparisonNote}</p>
      <CategoryMiniBars
        before={from.real_total}
        after={to.real_total}
        from={from.period}
        to={to.period}
      />
      <div className="gc-comparison-metrics">
        {[from, to].map((period) => (
          <div className="panel" key={period.period}>
            <strong>{period.period}</strong>
            <div>
              {text.actual} · {formatMoney(period.real_total)}
            </div>
            <div>
              {text.planned} · {formatMoney(period.planned_total)}
            </div>
          </div>
        ))}
        <div className="panel">
          <small>{text.variation}</small>
          <strong>{formatMoney(difference)}</strong>
          <Trend value={relativeChange(from.real_total, to.real_total)} />
        </div>
      </div>
    </section>
  );
}

export function MonthlyComparison() {
  const [periods, setPeriods] = useState(() => {
    const to = currentPeriod();
    return { from: shiftPeriod(to, -1), to, categoryId: '' };
  });
  const [draft, setDraft] = useState(periods);
  const [validation, setValidation] = useState(null);
  const { categories } = useIconPreferences();
  const { from, to, categoryId } = periods;
  const load = useCallback(
    async (signal) => {
      if (!categoryId) return api.monthlyComparison(from, to, signal);
      const [base, current] = await Promise.all([
        api.categoryComparison(categoryId, from, signal),
        api.categoryComparison(categoryId, to, signal),
      ]);
      return { base, current };
    },
    [from, to, categoryId],
  );
  const result = useData(load);
  const isSubmitted = draft.from === from && draft.to === to && draft.categoryId === categoryId;

  function submit(event) {
    event.preventDefault();
    if (draft.from === draft.to) {
      setValidation(new ApiError(422, [{ field: 'to', message: text.differentPeriods }]));
      return;
    }
    setValidation(null);
    if (isSubmitted) result.reload();
    else setPeriods(draft);
  }

  function update(field, value) {
    setValidation(null);
    setDraft((previous) => ({ ...previous, [field]: value }));
  }

  const fieldError = validation ?? (isSubmitted ? result.error : null);
  const hasFieldError = result.error?.issues?.some(
    ({ field }) => field === 'from' || field === 'to',
  );

  return (
    <>
      <header className="gc-page-heading">
        <Chanchito pose="pensativo" size={70} />
        <h1>{text.monthlyComparison}</h1>
      </header>
      <form className="panel planning-filter" onSubmit={submit}>
        <Field
          label={text.baseMonth}
          type="month"
          name="from"
          value={draft.from}
          onChange={(event) => update('from', event.target.value)}
          error={fieldError}
          required
        />
        <Field
          label={text.comparisonMonth}
          type="month"
          name="to"
          value={draft.to}
          onChange={(event) => update('to', event.target.value)}
          error={fieldError}
          required
        />
        <DataState result={categories}>
          {(items) => (
            <Field
              label={text.category}
              value={draft.categoryId}
              onChange={(event) => update('categoryId', event.target.value)}
            >
              <option value="">{text.allCategories}</option>
              <CategoryOptions categories={items} />
            </Field>
          )}
        </DataState>
        <button type="submit">{text.compare}</button>
      </form>
      {hasFieldError ? (
        <FormError error={isSubmitted ? result.error : null} fieldNames={['from', 'to']} />
      ) : (
        <DataState result={result}>
          {(data) =>
            categoryId ? (
              <SelectedCategoryComparison from={data.base} to={data.current} />
            ) : (
              <ComparisonResult data={data} />
            )
          }
        </DataState>
      )}
    </>
  );
}

function UnplannedProducts({ items }) {
  if (!items.length) return <Status message={text.noUnplanned} />;
  return (
    <ul className="records movement-list">
      {items.map((item, index) => (
        <li className="record" key={JSON.stringify([item.name, item.date, index])}>
          <div className="gc-category-heading">
            <ProductIcon name={item.name} />
            <div>
              <strong>{item.name}</strong>
              <p>
                <time dateTime={item.date}>{item.date}</time> · {quantity.format(item.quantity)} ×{' '}
                {formatMoney(item.unit_price)}
              </p>
            </div>
          </div>
          <strong>{formatMoney(item.subtotal)}</strong>
        </li>
      ))}
    </ul>
  );
}

const statisticsTabs = [text.byCategory, text.bySubcategory, text.byItem];

function StatisticsTabs({ data, categories }) {
  const [active, setActive] = useState(0);
  const id = useId();
  const subcategories = data.by_category.flatMap((item) => item.subcategories ?? []);

  function chooseWithKeyboard(event, index) {
    const size = statisticsTabs.length;
    const target = {
      ArrowLeft: (index + size - 1) % size,
      ArrowRight: (index + 1) % size,
      Home: 0,
      End: size - 1,
    }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    setActive(target);
    document.getElementById(`${id}-tab-${target}`)?.focus();
  }

  return (
    <section className="panel">
      <h2>{text.consumptionByCategory}</h2>
      <div className="gc-tabs" role="tablist" aria-label={text.statistics}>
        {statisticsTabs.map((label, index) => (
          <button
            key={label}
            type="button"
            id={`${id}-tab-${index}`}
            role="tab"
            aria-selected={active === index}
            aria-controls={`${id}-panel-${index}`}
            tabIndex={active === index ? 0 : -1}
            onClick={() => setActive(index)}
            onKeyDown={(event) => chooseWithKeyboard(event, index)}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`${id}-panel-0`}
        aria-labelledby={`${id}-tab-0`}
        hidden={active !== 0}
        tabIndex={0}
      >
        <CategoryBreakdown
          categories={categories}
          total={categories.reduce((sum, item) => sum + Number(item.total), 0)}
        />
      </div>
      <div
        role="tabpanel"
        id={`${id}-panel-1`}
        aria-labelledby={`${id}-tab-1`}
        hidden={active !== 1}
        tabIndex={0}
      >
        {subcategories.length ? (
          <ul className="records movement-list">
            {subcategories.map((item) => (
              <li key={item.category.id} className="record">
                <span className="gc-category-heading">
                  <CategoriaIcono nombre={item.category.name} id={item.category.id} />
                  <strong>{item.category.name}</strong>
                </span>
                <span>
                  {text.actual} {formatMoney(item.real)} · {text.planned}{' '}
                  {formatMoney(item.planned)}
                </span>
                {item.over_budget && <strong className="gc-over-budget">{text.overBudget}</strong>}
              </li>
            ))}
          </ul>
        ) : (
          <Status message={text.noSubcategories} />
        )}
      </div>
      <div
        role="tabpanel"
        id={`${id}-panel-2`}
        aria-labelledby={`${id}-tab-2`}
        hidden={active !== 2}
        tabIndex={0}
      >
        <UnplannedProducts items={data.unplanned.items} />
      </div>
    </section>
  );
}

function StatisticsResult({ data }) {
  const { categories: catalog } = useIconPreferences();
  const categories = groupStatisticsCategories(data.by_category, catalog.data ?? []);
  const top = categories[0];
  return (
    <>
      {Number(top?.total) > 0 && (
        <p className="gc-equation">
          {data.month ? text.topCategoryMonth(top.category) : text.topCategoryYear(top.category)}
        </p>
      )}
      <StatisticsTabs data={data} categories={categories} />
      <MonthlyHistory title={text.statisticsEvolution} months={data.months} />
      <section className="panel">
        <header className="gc-page-heading">
          <Chanchito pose="sorprendido" size={70} />
          <h2>{text.unplanned}</h2>
        </header>
        <p>{text.unplannedDefinition}</p>
        <strong className="movement-amount">{formatMoney(data.unplanned.total)}</strong>
        {Number(data.unplanned.total) > 0 && (
          <UnplannedSpendingScene
            productCount={data.unplanned.items.length}
            total={formatMoney(data.unplanned.total)}
          />
        )}
        <div className="gc-unplanned-note">
          <h3>{text.unplannedNoteTitle}</h3>
          <p>{text.unplannedNote}</p>
        </div>
        {data.unplanned.by_vendor.length > 0 && (
          <>
            <h3>{text.byVendor}</h3>
            <ul className="records movement-list">
              {data.unplanned.by_vendor.map((item) => (
                <li className="record" key={item.vendor ?? ''}>
                  <span>{item.vendor ?? text.noVendor}</span>
                  <strong>{formatMoney(item.total)}</strong>
                </li>
              ))}
            </ul>
          </>
        )}
        <UnplannedProducts items={data.unplanned.items} />
      </section>
    </>
  );
}

export function Statistics() {
  const currentYear = currentPeriod().slice(0, 4);
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState('');
  const [filters, setFilters] = useState({ year: currentYear, month: '' });
  const load = useCallback(
    (signal) => api.statistics(filters.year, filters.month, signal),
    [filters],
  );
  const result = useData(load);
  const isSubmitted = filters.year === year && filters.month === month;
  const hasFieldError = result.error?.issues?.some(
    ({ field }) => field === 'year' || field === 'month',
  );
  const fieldError = isSubmitted ? result.error : null;
  const [years, setYears] = useState(() => [currentYear]);
  useEffect(() => {
    if (result.data?.available_years?.length) setYears(result.data.available_years.map(String));
  }, [result.data]);

  return (
    <>
      <h1>{text.statistics}</h1>
      <form
        className="panel planning-filter"
        onSubmit={(event) => {
          event.preventDefault();
          if (isSubmitted) result.reload();
          else setFilters({ year, month });
        }}
      >
        <Field
          label={text.year}
          name="year"
          value={year}
          onChange={(event) => setYear(event.target.value)}
          error={fieldError}
        >
          {years.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Field>
        <Field
          label={text.period}
          name="month"
          value={month}
          onChange={(event) => setMonth(event.target.value)}
          error={fieldError}
        >
          <option value="">{text.fullYear}</option>
          {Array.from({ length: 12 }, (_, index) => (
            <option key={index} value={index + 1}>
              {monthName.format(new Date(Date.UTC(2000, index, 1)))}
            </option>
          ))}
        </Field>
        <button type="submit">{text.applyFilters}</button>
      </form>
      {hasFieldError ? (
        <FormError error={fieldError} fieldNames={['year', 'month']} />
      ) : (
        <DataState result={result}>{(data) => <StatisticsResult data={data} />}</DataState>
      )}
    </>
  );
}
