import { DeleteRecord, useDeleteRecord } from '../components/delete-record.jsx';
import { ProductIcon } from '../components/icono.jsx';
import { Status } from '../components/chanchito.jsx';
import { Link, useNavigate } from '@tanstack/react-router';
import { useCallback, useState } from 'react';
import { CategoryOptions } from '../components/category-options.jsx';
import { CategoriaIcono } from '../components/categoria-icono.jsx';
import {
  currentDate,
  currentPeriod,
  DataState,
  Field,
  formatMoney,
} from '../components/common.jsx';
import { filterExpenses } from '../domain/expenses.js';
import { useData } from '../hooks/data.js';
import { api } from '../hooks/session.js';
import { text } from '../texts.js';
import { ExpenseForm } from './expense-form.jsx';

function ExpensePaymentMethod({ id }) {
  const result = useData(api.paymentMethods);
  return (
    <DataState result={result}>
      {(items) => items.find((item) => item.id === id)?.name ?? text.assignedPaymentMethod}
    </DataState>
  );
}

function ExpenseDetail({ expense, categories, listSearch, onSaved, askDelete }) {
  const [editing, setEditing] = useState(false);
  const label = expense.description || expense.category.name;

  if (editing) {
    return (
      <>
        <h1>{text.editExpense}</h1>
        <DataState result={categories}>
          {(items) => (
            <ExpenseForm
              categories={items}
              expense={expense}
              onSaved={onSaved}
              onCancel={() => setEditing(false)}
            />
          )}
        </DataState>
      </>
    );
  }

  return (
    <>
      <Link to="/consumos" search={listSearch}>
        {text.backToExpenses}
      </Link>
      <h1>{text.expenseDetail}</h1>
      <section className="panel movement-detail">
        <div className="movement-actions">
          <div className="gc-category-heading">
            <CategoriaIcono nombre={expense.category.name} id={expense.category.id} size={56} />
            <h2>{label}</h2>
          </div>
          <strong className="movement-amount">{formatMoney(expense.amount)}</strong>
        </div>
        <dl className="movement-facts">
          <div>
            <dt>{text.date}</dt>
            <dd>
              <time dateTime={expense.date}>{expense.date}</time>
            </dd>
          </div>
          <div>
            <dt>{text.category}</dt>
            <dd>{expense.category.name}</dd>
          </div>
          <div>
            <dt>{text.purchaseChannel}</dt>
            <dd>{text.purchaseChannels[expense.purchase_channel]}</dd>
          </div>
          <div>
            <dt>{text.fixedExpense}</dt>
            <dd>{expense.is_fixed ? text.yes : text.no}</dd>
          </div>
          <div>
            <dt>{text.paymentMethod}</dt>
            <dd>
              {expense.payment_method_id ? (
                <ExpensePaymentMethod id={expense.payment_method_id} />
              ) : (
                text.noPaymentMethod
              )}
            </dd>
          </div>
        </dl>
        {expense.expense_items.length > 0 && (
          <>
            <h2>{text.expenseItems}</h2>
            <ul className="records movement-list">
              {expense.expense_items.map((item) => (
                <li className="record" key={item.id}>
                  <div className="gc-category-heading">
                    <ProductIcon name={item.name} />
                    <div>
                      <strong>{item.name}</strong>
                      <p>
                        {item.quantity} {text.itemUnits[item.unit]} × {formatMoney(item.unit_price)}
                      </p>
                    </div>
                  </div>
                  <strong>{formatMoney(item.subtotal)}</strong>
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="actions">
          <button type="button" className="secondary" onClick={() => setEditing(true)}>
            {text.edit}
          </button>
          <button
            type="button"
            className="movement-danger"
            onClick={() => askDelete(expense, label)}
          >
            {text.remove}
          </button>
        </div>
      </section>
    </>
  );
}

function ExpenseList({
  result,
  categories,
  period,
  listSearch,
  query,
  setQuery,
  categoryId,
  setCategoryId,
  changePeriod,
}) {
  return (
    <>
      <h1>{text.expenses}</h1>
      <div className="movement-actions">
        <Link className="button" to="/consumos" search={{ ...listSearch, new: true }}>
          {text.newExpense}
        </Link>
        <Link className="button secondary" to="/categorias">
          {text.categories}
        </Link>
      </div>
      <div className="panel movement-filters gc-consumption-filters">
        <Field
          label={text.period}
          type="month"
          value={period}
          onChange={(event) => changePeriod(event.target.value)}
        />
        <Field
          label={text.searchExpenses}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <DataState result={categories}>
          {(items) => (
            <Field
              label={text.category}
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              <option value="">{text.allCategories}</option>
              <CategoryOptions categories={items} allowParents />
            </Field>
          )}
        </DataState>
      </div>
      <DataState result={result}>
        {(items) => {
          const filtered = filterExpenses(items, query, categoryId, categories.data);
          return (
            <>
              {items.length >= 100 && <p className="muted">{text.expensesLimit}</p>}
              {filtered.length ? (
                <ul className="records movement-records">
                  {filtered.map((expense) => (
                    <li key={expense.id}>
                      <Link
                        className="panel movement-link"
                        to="/consumos"
                        search={{ ...listSearch, expense: expense.id }}
                      >
                        <CategoriaIcono
                          nombre={expense.category.name}
                          id={expense.category.id}
                          size={56}
                        />
                        <span>
                          <strong>{expense.description || expense.category.name}</strong>
                          <small>
                            <time dateTime={expense.date}>{expense.date}</time> ·{' '}
                            {expense.category.name}
                          </small>
                        </span>
                        <strong>{formatMoney(expense.amount)}</strong>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <Status message={items.length ? text.noMatchingExpenses : text.noMonthlyExpenses} />
              )}
            </>
          );
        }}
      </DataState>
    </>
  );
}

export function Expenses({ search }) {
  const period = search.period ?? currentPeriod();
  const listSearch = search.period ? { period } : {};
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const navigate = useNavigate({ from: '/consumos' });
  const load = useCallback((signal) => api.expenses(period, signal), [period]);
  const expenses = useData(load);
  const categories = useData(api.categories);

  function toList(nextPeriod = period) {
    navigate({
      search: nextPeriod === currentPeriod() ? {} : { period: nextPeriod },
      replace: true,
    });
  }

  function afterWrite(saved) {
    expenses.reload();
    if (!saved) {
      toList();
      return;
    }
    const savedPeriod = saved.date.slice(0, 7);
    if (search.new || savedPeriod !== period) {
      setQuery('');
      setCategoryId('');
      toList(savedPeriod);
    }
  }

  const deletion = useDeleteRecord(api.removeExpense, () => afterWrite());

  if (search.new) {
    return (
      <>
        <h1>{text.newExpense}</h1>
        <DataState result={categories}>
          {(items) => (
            <>
              {!items.length && <Status message={text.noCategories} />}
              <ExpenseForm
                categories={items}
                defaultDate={period === currentPeriod() ? currentDate() : `${period}-01`}
                onSaved={afterWrite}
                onCancel={() => toList()}
              />
            </>
          )}
        </DataState>
      </>
    );
  }

  if (search.expense) {
    return (
      <>
        <DeleteRecord action={deletion} />
        <DataState result={expenses}>
          {(items) => {
            const expense = items.find(({ id }) => id === search.expense);
            return expense ? (
              <ExpenseDetail
                key={expense.id}
                expense={expense}
                categories={categories}
                listSearch={listSearch}
                onSaved={afterWrite}
                askDelete={deletion.ask}
              />
            ) : (
              <>
                <h1>{text.expenseDetail}</h1>
                <Status message={text.expenseNotInList} />
                <Link to="/consumos" search={listSearch}>
                  {text.backToExpenses}
                </Link>
              </>
            );
          }}
        </DataState>
      </>
    );
  }

  return (
    <>
      <DeleteRecord action={deletion} />
      <ExpenseList
        result={expenses}
        categories={categories}
        period={period}
        listSearch={listSearch}
        query={query}
        setQuery={setQuery}
        categoryId={categoryId}
        setCategoryId={setCategoryId}
        changePeriod={(value) => toList(value || currentPeriod())}
      />
    </>
  );
}
