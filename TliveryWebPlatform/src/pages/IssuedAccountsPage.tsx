import {useMemo, useState, type FormEvent} from 'react';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../auth/AuthContext';
import {ListToolbar, useListFilters} from '../components/ListToolbar';
import {Modal} from '../components/Modal';
import {PasswordField} from '../components/PasswordField';
import {useDebouncedValue} from '../hooks/useDebouncedValue';
import {
  useCompanyClients,
  useCompanyMerchants,
  useCreateCompanyClient,
  useCreateCompanyMerchant,
  useDeleteCompanyClient,
  useDeleteCompanyMerchant,
} from '../hooks/useWorkflow';
import type {
  CompanyIssuedAccount,
  ListCompanyIssuedAccountsResult,
} from '../models/workflow';
import type {ListPageResult} from '../lib/listQuery';
import {showToast} from '../utils/showToast';
import {ToastType} from '../enums/ToastType';
import {getWorkflowErrorTranslationKey} from '../utils/workflowError';
import {
  buildIssuedCredentialsMessage,
  copyText,
  employeeHasAnyPermission,
  openWhatsAppText,
} from '../utils/shareCredentials';

type AccountKind = 'merchant' | 'client';

type IssuedAccountsPageProps = {
  kind: AccountKind;
  hideLead?: boolean;
};

const SEARCH_DEBOUNCE_MS = 400;

const EMPTY_FORM = {
  username: '',
  password: '',
  displayName: '',
};

type SharePayload = {
  username: string;
  password: string;
  roleLabel: string;
};

export function IssuedAccountsPage({kind, hideLead = false}: IssuedAccountsPageProps) {
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
  const isMerchant = kind === 'merchant';
  const permissions =
    (user?.profile as {permissions?: string[]} | null)?.permissions ?? [];
  const isAdmin = user?.role === 'company_admin';
  const canManage = isMerchant
    ? isAdmin || employeeHasAnyPermission(permissions, 'merchants:manage')
    : isAdmin || employeeHasAnyPermission(permissions, 'customers:manage');

  const merchants = useCompanyMerchants(
    companyId,
    listParams,
    isMerchant,
  );
  const clients = useCompanyClients(companyId, listParams, !isMerchant);
  const createMerchant = useCreateCompanyMerchant(companyId);
  const createClient = useCreateCompanyClient(companyId);
  const deleteMerchant = useDeleteCompanyMerchant(companyId);
  const deleteClient = useDeleteCompanyClient(companyId);

  const accountsQuery = isMerchant ? merchants : clients;
  const createMutation = isMerchant ? createMerchant : createClient;
  const deleteMutation = isMerchant ? deleteMerchant : deleteClient;

  const [form, setForm] = useState(EMPTY_FORM);
  const [sharePayload, setSharePayload] = useState<SharePayload | null>(null);

  const copy = useMemo(() => {
    if (isMerchant) {
      return {
        lead: t('merchantsLead'),
        create: t('createMerchant'),
        list: t('merchantsList'),
        empty: t('emptyMerchants'),
        created: t('merchantCreated'),
        deleted: t('merchantDeleted'),
        deleteConfirm: t('deleteMerchantConfirm'),
        deleteLabel: t('deleteMerchant'),
        roleLabel: t('roleMerchant'),
        search: t('searchMerchantsPlaceholder'),
      };
    }
    return {
      lead: t('clientsLead'),
      create: t('createClient'),
      list: t('clientsList'),
      empty: t('emptyClients'),
      created: t('clientCreated'),
      deleted: t('clientDeleted'),
      deleteConfirm: t('deleteClientConfirm'),
      deleteLabel: t('deleteClient'),
      roleLabel: t('roleClient'),
      search: t('searchClientsPlaceholder'),
    };
  }, [isMerchant, t]);

  const statusOptions = useMemo(
    () => [
      {value: 'all', label: t('filterAll')},
      {value: 'active', label: t('statusApproved')},
      {value: 'suspended', label: 'suspended'},
      {value: 'disabled', label: 'disabled'},
    ],
    [t],
  );

  const page: ListPageResult<CompanyIssuedAccount> = useMemo(() => {
    const data = accountsQuery.data as
      | ListCompanyIssuedAccountsResult
      | undefined;
    return {
      items: data?.items ?? [],
      total: data?.total ?? 0,
      page: data?.page ?? filters.page,
      pageSize: data?.pageSize ?? 10,
      hasMore: data?.hasMore ?? false,
    };
  }, [accountsQuery.data, filters.page]);

  const onCreate = (event: FormEvent) => {
    event.preventDefault();
    const username = form.username.trim().toLowerCase();
    const password = form.password;
    if (username.length < 3 || password.length < 8) {
      showToast(ToastType.error, t('employeeFormRequired'));
      return;
    }
    createMutation.mutate(
      {
        username,
        password,
        displayName: form.displayName.trim() || undefined,
      },
      {
        onSuccess: result => {
          setForm(EMPTY_FORM);
          showToast(ToastType.success, copy.created);
          setSharePayload({
            username: result.username || username,
            password,
            roleLabel: copy.roleLabel,
          });
        },
        onError: error =>
          showToast(ToastType.error, t(getWorkflowErrorTranslationKey(error))),
      },
    );
  };

  const shareMessage = sharePayload
    ? buildIssuedCredentialsMessage({
        roleLabel: sharePayload.roleLabel,
        username: sharePayload.username,
        password: sharePayload.password,
      })
    : '';

  return (
    <div className={hideLead ? undefined : 'page'}>
      {hideLead ? null : <p className="page-lead">{copy.lead}</p>}

      {canManage ? (
        <div className="form-grid">
          <form className="card company-form" onSubmit={onCreate}>
            <strong>{copy.create}</strong>
            <div className="field">
              <label>{t('employeeUsername')}</label>
              <input
                required
                minLength={3}
                value={form.username}
                onChange={e => setForm({...form, username: e.target.value})}
                placeholder={t('employeeUsernamePlaceholder')}
                autoComplete="off"
              />
            </div>
            <PasswordField
              id={`${kind}Password`}
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
                placeholder={t('employeeFullNamePlaceholder')}
              />
            </div>
            <button
              className="btn btn-primary"
              disabled={createMutation.isPending}>
              {copy.create}
            </button>
          </form>
        </div>
      ) : null}

      <h2 className="section-title">{copy.list}</h2>
      <ListToolbar
        query={filters.query}
        onQueryChange={filters.setQuery}
        searchPlaceholder={copy.search}
        status={filters.status}
        onStatusChange={filters.setStatus}
        statusOptions={statusOptions}
        onClear={filters.reset}
        page={page}
        onPageChange={filters.setPage}
      />
      {accountsQuery.isLoading ? (
        <div className="card">{t('loading')}</div>
      ) : accountsQuery.isError ? (
        <div className="card login-error">{t('workflowLoadError')}</div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>{t('employeeUsername')}</th>
                <th>{t('employeeFullName')}</th>
                <th>{t('colStatus')}</th>
                <th>{t('colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {page.items.map(account => (
                <tr key={account.id}>
                  <td>{account.username}</td>
                  <td>{account.displayName || '—'}</td>
                  <td>{account.status}</td>
                  <td>
                    {canManage ? (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (window.confirm(copy.deleteConfirm)) {
                            deleteMutation.mutate(account.id, {
                              onSuccess: () =>
                                showToast(ToastType.success, copy.deleted),
                              onError: () =>
                                showToast(
                                  ToastType.error,
                                  t('workflowActionError'),
                                ),
                            });
                          }
                        }}>
                        {copy.deleteLabel}
                      </button>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
              {page.total === 0 ? (
                <tr>
                  <td colSpan={4} className="muted">
                    {copy.empty}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={sharePayload != null}
        title={t('shareCredentialsTitle')}
        onClose={() => setSharePayload(null)}>
        {sharePayload ? (
          <div className="company-form">
            <p className="muted">{t('shareCredentialsOnceHint')}</p>
            <div className="field">
              <label>{t('employeeUsername')}</label>
              <input value={sharePayload.username} readOnly />
            </div>
            <div className="field">
              <label>{t('employeePassword')}</label>
              <input value={sharePayload.password} readOnly />
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  void copyText(shareMessage).then(() =>
                    showToast(ToastType.success, t('credentialsCopied')),
                  );
                }}>
                {t('copyCredentials')}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => openWhatsAppText(shareMessage)}>
                {t('whatsapp')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setSharePayload(null)}>
                {t('done')}
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export function MerchantAccountsPage() {
  return <IssuedAccountsPage kind="merchant" />;
}

export function CustomerAccountsPage() {
  return <IssuedAccountsPage kind="client" />;
}
