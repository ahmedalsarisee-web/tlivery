import {useMemo, useState, type FormEvent} from 'react';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../auth/AuthContext';
import {
  COMPANY_PERMISSIONS,
  DEFAULT_EMPLOYEE_PERMISSIONS,
  type CompanyPermission,
} from '../constants/permissions';
import {
  useCompanyEmployees,
  useCreateCompanyEmployee,
  useDeleteCompanyEmployee,
  useUpdateCompanyEmployee,
} from '../hooks/useWorkflow';
import {useDebouncedValue} from '../hooks/useDebouncedValue';
import {ListToolbar, useListFilters} from '../components/ListToolbar';
import {Modal} from '../components/Modal';
import {PasswordField} from '../components/PasswordField';
import type {CompanyEmployee} from '../models/workflow';
import type {ListPageResult} from '../lib/listQuery';
import {showToast} from '../utils/showToast';
import {ToastType} from '../enums/ToastType';

const SEARCH_DEBOUNCE_MS = 400;

const EMPTY_FORM = {
  username: '',
  password: '',
  displayName: '',
  permissions: [...DEFAULT_EMPLOYEE_PERMISSIONS] as CompanyPermission[],
};

export function EmployeesPage() {
  const {t} = useTranslation();
  const {user} = useAuth();
  const companyId = user?.companyId ?? '';
  const filters = useListFilters(10);
  const debouncedQ = useDebouncedValue(filters.query, SEARCH_DEBOUNCE_MS);
  const listParams = useMemo(
    () => ({
      q: debouncedQ.trim() || undefined,
      status: filters.status !== 'all' ? filters.status : undefined,
      page: filters.page,
      pageSize: 10,
    }),
    [debouncedQ, filters.page, filters.status],
  );
  const employees = useCompanyEmployees(companyId, listParams);
  const createEmployee = useCreateCompanyEmployee(companyId);
  const updateEmployee = useUpdateCompanyEmployee(companyId);
  const deleteEmployee = useDeleteCompanyEmployee(companyId);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState<CompanyEmployee | null>(null);

  const permissionLabels = useMemo(
    () =>
      Object.fromEntries(
        COMPANY_PERMISSIONS.map(key => [
          key,
          t(`perm_${key.replace(':', '_')}`),
        ]),
      ) as Record<CompanyPermission, string>,
    [t],
  );

  const statusOptions = useMemo(
    () => [
      {value: 'all', label: t('filterAll')},
      {value: 'active', label: t('statusApproved')},
      {value: 'suspended', label: 'suspended'},
      {value: 'disabled', label: 'disabled'},
    ],
    [t],
  );

  const page: ListPageResult<CompanyEmployee> = useMemo(() => {
    const data = employees.data;
    return {
      items: data?.employees ?? [],
      total: data?.total ?? 0,
      page: data?.page ?? filters.page,
      pageSize: data?.pageSize ?? 10,
      hasMore: data?.hasMore ?? false,
    };
  }, [employees.data, filters.page]);

  const togglePermission = (
    current: CompanyPermission[],
    key: CompanyPermission,
  ) =>
    current.includes(key)
      ? current.filter(item => item !== key)
      : [...current, key];

  const onCreate = (event: FormEvent) => {
    event.preventDefault();
    createEmployee.mutate(
      {
        username: form.username.trim().toLowerCase(),
        password: form.password,
        displayName: form.displayName.trim() || undefined,
        permissions: form.permissions,
      },
      {
        onSuccess: () => {
          setForm(EMPTY_FORM);
          showToast(ToastType.success, t('employeeCreated'));
        },
        onError: () => showToast(ToastType.error, t('workflowActionError')),
      },
    );
  };

  const onSaveEdit = (event: FormEvent) => {
    event.preventDefault();
    if (!editing) {
      return;
    }
    updateEmployee.mutate(
      {
        employeeId: editing.id,
        displayName: editing.displayName,
        permissions: editing.permissions as CompanyPermission[],
      },
      {
        onSuccess: () => {
          setEditing(null);
          showToast(ToastType.success, t('employeeUpdated'));
        },
        onError: () => showToast(ToastType.error, t('workflowActionError')),
      },
    );
  };

  return (
    <div className="page">
      <p className="page-lead">{t('employeesLead')}</p>

      <div className="form-grid">
        <form className="card company-form" onSubmit={onCreate}>
          <strong>{t('createEmployee')}</strong>
          <div className="field">
            <label>{t('employeeUsername')}</label>
            <input
              required
              value={form.username}
              onChange={e => setForm({...form, username: e.target.value})}
            />
          </div>
          <PasswordField
            id="employeePassword"
            label={t('employeePassword')}
            required
            value={form.password}
            onChange={e => setForm({...form, password: e.target.value})}
            autoComplete="new-password"
            minLength={8}
          />
          <div className="field">
            <label>{t('employeeFullName')}</label>
            <input
              value={form.displayName}
              onChange={e => setForm({...form, displayName: e.target.value})}
            />
          </div>
          <div className="perm-grid">
            {COMPANY_PERMISSIONS.map(key => (
              <label key={key} className="perm-item">
                <input
                  type="checkbox"
                  checked={form.permissions.includes(key)}
                  onChange={() =>
                    setForm({
                      ...form,
                      permissions: togglePermission(form.permissions, key),
                    })
                  }
                />
                <span>{permissionLabels[key]}</span>
              </label>
            ))}
          </div>
          <button className="btn btn-primary" disabled={createEmployee.isPending}>
            {t('createEmployee')}
          </button>
        </form>
      </div>

      <h2 className="section-title">{t('employeesList')}</h2>
      <ListToolbar
        query={filters.query}
        onQueryChange={filters.setQuery}
        searchPlaceholder={t('searchEmployeesPlaceholder')}
        status={filters.status}
        onStatusChange={filters.setStatus}
        statusOptions={statusOptions}
        onClear={filters.reset}
        page={page}
        onPageChange={filters.setPage}
      />
      {employees.isLoading ? (
        <div className="card">{t('loading')}</div>
      ) : employees.isError ? (
        <div className="card login-error">{t('workflowLoadError')}</div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>{t('employeeUsername')}</th>
                <th>{t('employeeFullName')}</th>
                <th>{t('colStatus')}</th>
                <th>{t('employeePermissions')}</th>
                <th>{t('colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {page.items.map(employee => (
                <tr key={employee.id}>
                  <td>{employee.username}</td>
                  <td>{employee.displayName}</td>
                  <td>{employee.status}</td>
                  <td>
                    {employee.permissions.length
                      ? employee.permissions
                          .map(
                            key =>
                              permissionLabels[key as CompanyPermission] ?? key,
                          )
                          .join(', ')
                      : '—'}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setEditing(employee)}>
                        {t('editPermissions')}
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        disabled={deleteEmployee.isPending}
                        onClick={() => {
                          if (window.confirm(t('deleteEmployeeConfirm'))) {
                            deleteEmployee.mutate(employee.id, {
                              onSuccess: () =>
                                showToast(
                                  ToastType.success,
                                  t('employeeDeleted'),
                                ),
                              onError: () =>
                                showToast(
                                  ToastType.error,
                                  t('workflowActionError'),
                                ),
                            });
                          }
                        }}>
                        {t('deleteEmployee')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {page.total === 0 ? (
                <tr>
                  <td colSpan={5} className="muted">
                    {t('emptyEmployees')}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={editing != null}
        title={
          editing
            ? `${t('editPermissions')} · ${editing.username}`
            : t('editPermissions')
        }
        onClose={() => setEditing(null)}>
        {editing ? (
          <form className="company-form" onSubmit={onSaveEdit}>
            <div className="field">
              <label>{t('employeeFullName')}</label>
              <input
                value={editing.displayName}
                onChange={e =>
                  setEditing({...editing, displayName: e.target.value})
                }
              />
            </div>
            <div className="perm-grid">
              {COMPANY_PERMISSIONS.map(key => (
                <label key={key} className="perm-item">
                  <input
                    type="checkbox"
                    checked={editing.permissions.includes(key)}
                    onChange={() =>
                      setEditing({
                        ...editing,
                        permissions: togglePermission(
                          editing.permissions as CompanyPermission[],
                          key,
                        ),
                      })
                    }
                  />
                  <span>{permissionLabels[key]}</span>
                </label>
              ))}
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setEditing(null)}>
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={updateEmployee.isPending}>
                {t('save')}
              </button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}
