import {useMemo, useState, type FormEvent} from 'react';
import {useNavigate} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {UsersRound} from 'lucide-react';
import {useAuth} from '../auth/AuthContext';
import {ListToolbar, useListFilters} from '../components/ListToolbar';
import {Modal} from '../components/Modal';
import {PasswordField} from '../components/PasswordField';
import {useDebouncedValue} from '../hooks/useDebouncedValue';
import {
  useCompanyClients,
  useCompanyMerchants,
  useCreateClientInvite,
  useCreateCompanyMerchant,
  useClientInvites,
  useDeleteCompanyClient,
  useDeleteCompanyMerchant,
  useRevokeClientInvite,
} from '../hooks/useWorkflow';
import type {CompanyIssuedAccount} from '../models/workflow';
import {
  matchesSearch,
  paginateItems,
  type ListPageResult,
} from '../lib/listQuery';
import {showToast} from '../utils/showToast';
import {ToastType} from '../enums/ToastType';
import {getWorkflowErrorTranslationKey} from '../utils/workflowError';
import {
  buildIssuedCredentialsMessage,
  copyText,
  employeeHasAnyPermission,
  openWhatsAppText,
} from '../utils/shareCredentials';
import {
  buildClientInviteWebLink,
} from '../utils/clientInvite';

type AccountKind = 'merchant' | 'client';
type AccountsSegment = 'accounts' | 'invites';

type IssuedAccountRow = CompanyIssuedAccount & {accountKind: AccountKind};

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

export function UnifiedIssuedAccountsPage() {
  const {t} = useTranslation();
  const navigate = useNavigate();
  const {user} = useAuth();
  const companyId = user?.companyId ?? '';
  const permissions =
    (user?.profile as {permissions?: string[]} | null)?.permissions ?? [];
  const isAdmin = user?.role === 'company_admin';
  const canViewMerchants =
    isAdmin ||
    employeeHasAnyPermission(permissions, [
      'merchants:read',
      'merchants:manage',
    ]);
  const canManageMerchants =
    isAdmin || employeeHasAnyPermission(permissions, 'merchants:manage');
  const canManageCustomers =
    isAdmin || employeeHasAnyPermission(permissions, 'customers:manage');

  const defaultCreateKind: AccountKind = canManageMerchants
    ? 'merchant'
    : 'client';
  const [createKind, setCreateKind] = useState<AccountKind>(defaultCreateKind);
  const [segment, setSegment] = useState<AccountsSegment>('accounts');
  const showCreateTypePicker = canManageMerchants && canManageCustomers;

  const filters = useListFilters(10);
  const debouncedQ = useDebouncedValue(filters.query, SEARCH_DEBOUNCE_MS);
  const listParams = useMemo(
    () => ({
      q: debouncedQ.trim() || undefined,
      status: filters.status !== 'all' ? filters.status : undefined,
      page: 1,
      pageSize: 50,
    }),
    [debouncedQ, filters.status],
  );

  const merchantsQuery = useCompanyMerchants(
    companyId,
    listParams,
    canViewMerchants,
  );
  const clientsQuery = useCompanyClients(
    companyId,
    listParams,
    canManageCustomers,
  );
  const clientInvites = useClientInvites(companyId);

  const createMerchant = useCreateCompanyMerchant(companyId);
  const createClientInvite = useCreateClientInvite(companyId);
  const revokeClientInvite = useRevokeClientInvite(companyId);
  const deleteMerchant = useDeleteCompanyMerchant(companyId);
  const deleteClient = useDeleteCompanyClient(companyId);

  const [form, setForm] = useState(EMPTY_FORM);
  const [sharePayload, setSharePayload] = useState<SharePayload | null>(null);
  const [inviteShare, setInviteShare] = useState<{
    code: string;
    message: string;
    link?: string;
  } | null>(null);

  const canManageAny = canManageMerchants || canManageCustomers;
  const activeCreateKind: AccountKind =
    createKind === 'merchant' && canManageMerchants
      ? 'merchant'
      : createKind === 'client' && canManageCustomers
        ? 'client'
        : defaultCreateKind;

  const mergedAccounts = useMemo(() => {
    const rows: IssuedAccountRow[] = [];
    if (canViewMerchants) {
      for (const item of merchantsQuery.data?.items ?? []) {
        rows.push({...item, accountKind: 'merchant'});
      }
    }
    if (canManageCustomers) {
      for (const item of clientsQuery.data?.items ?? []) {
        rows.push({...item, accountKind: 'client'});
      }
    }
    return rows.sort((a, b) =>
      (a.displayName || a.username).localeCompare(
        b.displayName || b.username,
        undefined,
        {sensitivity: 'base'},
      ),
    );
  }, [
    canManageCustomers,
    canViewMerchants,
    clientsQuery.data?.items,
    merchantsQuery.data?.items,
  ]);

  const filteredAccounts = useMemo(
    () =>
      mergedAccounts.filter(row => {
        const matchesStatus =
          !filters.params.status || row.status === filters.params.status;
        const matchesQ = matchesSearch(filters.params.q, [
          row.username,
          row.displayName,
          row.email,
        ]);
        return matchesStatus && matchesQ;
      }),
    [filters.params.q, filters.params.status, mergedAccounts],
  );

  const page: ListPageResult<IssuedAccountRow> = useMemo(
    () =>
      paginateItems(filteredAccounts, {
        page: filters.page,
        pageSize: filters.params.pageSize,
      }),
    [filteredAccounts, filters.page, filters.params.pageSize],
  );

  const isLoading =
    (canViewMerchants && merchantsQuery.isLoading) ||
    (canManageCustomers && clientsQuery.isLoading);
  const isError =
    (canViewMerchants && merchantsQuery.isError) ||
    (canManageCustomers && clientsQuery.isError);

  const statusOptions = useMemo(
    () => [
      {value: 'all', label: t('filterAll')},
      {value: 'active', label: t('statusApproved')},
      {value: 'suspended', label: 'suspended'},
      {value: 'disabled', label: 'disabled'},
    ],
    [t],
  );

  const roleLabel = (kind: AccountKind) =>
    kind === 'merchant' ? t('roleMerchant') : t('roleClient');

  const canDelete = (kind: AccountKind) =>
    kind === 'merchant' ? canManageMerchants : canManageCustomers;

  const onCreate = (event: FormEvent) => {
    event.preventDefault();
    createClientInvite.mutate(
      {
        role: activeCreateKind === 'merchant' ? 'merchant' : 'client',
      },
      {
        onSuccess: result => {
          const code = result.code || result.inviteCode;
          const webLink =
            result.inviteUrl?.trim() || buildClientInviteWebLink(code);
          const message = t('whatsappClientInviteMessage', {
            companyName: user?.profile?.displayName || t('appName'),
            link: webLink,
            code,
          });
          setInviteShare({code, message, link: webLink});
          setSegment('invites');
          showToast(ToastType.success, t('clientInviteCreatedToast'));
        },
        onError: error =>
          showToast(
            ToastType.error,
            t(getWorkflowErrorTranslationKey(error)),
          ),
      },
    );
  };

  const onDelete = (account: IssuedAccountRow) => {
    const confirmMessage =
      account.accountKind === 'merchant'
        ? t('deleteMerchantConfirm')
        : t('deleteClientConfirm');
    const deletedMessage =
      account.accountKind === 'merchant'
        ? t('merchantDeleted')
        : t('clientDeleted');
    const mutation =
      account.accountKind === 'merchant' ? deleteMerchant : deleteClient;

    if (window.confirm(confirmMessage)) {
      mutation.mutate(account.id, {
        onSuccess: () => showToast(ToastType.success, deletedMessage),
        onError: error =>
        showToast(ToastType.error, t(getWorkflowErrorTranslationKey(error))),
      });
    }
  };

  const shareMessage = sharePayload
    ? buildIssuedCredentialsMessage({
        roleLabel: sharePayload.roleLabel,
        username: sharePayload.username,
        password: sharePayload.password,
      })
    : '';

  const createPending = createClientInvite.isPending;

  const pendingInvites = useMemo(
    () =>
      (clientInvites.data ?? []).filter(
        row => row.status === 'pending' || row.status === 'open',
      ),
    [clientInvites.data],
  );

  if (!canViewMerchants && !canManageCustomers) {
    return (
      <div className="page">
        <div className="card muted">{t('sectionComingSoon')}</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="card">
        <div className="toolbar" style={{marginBottom: 0}}>
          <UsersRound size={22} />
          <strong>{t('navIssuedAccounts')}</strong>
        </div>
        <p className="muted" style={{margin: '8px 0 0'}}>
          {t('issuedAccountsUnifiedLead')}
        </p>
      </div>

      {canManageAny ? (
        <div className="form-grid">
          <form className="card company-form" onSubmit={onCreate}>
            <strong>{t('inviteClientTitle')}</strong>
            {showCreateTypePicker ? (
              <div className="field">
                <label>{t('accountTypeLabel')}</label>
                <div
                  className="segmented-tab-bar"
                  role="tablist"
                  aria-label={t('accountTypeLabel')}
                  style={{marginBottom: 0}}>
                  {canManageMerchants ? (
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeCreateKind === 'merchant'}
                      className={`segmented-tab${activeCreateKind === 'merchant' ? ' is-active' : ''}`}
                      onClick={() => setCreateKind('merchant')}>
                      {t('accountTypeMerchant')}
                    </button>
                  ) : null}
                  {canManageCustomers ? (
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeCreateKind === 'client'}
                      className={`segmented-tab${activeCreateKind === 'client' ? ' is-active' : ''}`}
                      onClick={() => setCreateKind('client')}>
                      {t('accountTypeCustomer')}
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}

            <p className="muted" style={{margin: 0}}>
              {t('inviteClientLead')}
            </p>
            <button className="btn btn-primary" disabled={createPending}>
              {t('createClientInvite')}
            </button>
          </form>
        </div>
      ) : null}

      {canManageCustomers ? (
        <div
          className="segmented-tab-bar"
          role="tablist"
          style={{marginTop: 8}}>
          <button
            type="button"
            role="tab"
            aria-selected={segment === 'accounts'}
            className={`segmented-tab${segment === 'accounts' ? ' is-active' : ''}`}
            onClick={() => setSegment('accounts')}>
            {t('issuedAccountsList')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={segment === 'invites'}
            className={`segmented-tab${segment === 'invites' ? ' is-active' : ''}`}
            onClick={() => setSegment('invites')}>
            {t('clientInvites')}
          </button>
        </div>
      ) : null}

      {segment === 'invites' && canManageCustomers ? (
        <>
          <h2 className="section-title">{t('clientInvites')}</h2>
          {clientInvites.isLoading ? (
            <div className="card">{t('loading')}</div>
          ) : pendingInvites.length === 0 ? (
            <div className="card muted">{t('noPendingClientInvites')}</div>
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>{t('inviteCode')}</th>
                    <th>{t('phone')}</th>
                    <th>{t('status')}</th>
                    <th>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingInvites.map(invite => {
                    const code = invite.code || invite.id;
                    const phone =
                      invite.phoneNumber || invite.phone || t('inviteNoPhone');
                    return (
                      <tr key={invite.id}>
                        <td>
                          <code>{code}</code>
                        </td>
                        <td>{phone}</td>
                        <td>{t('statusPending')}</td>
                        <td className="actions">
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={async () => {
                              const webLink = buildClientInviteWebLink(code);
                              await copyText(webLink);
                              showToast(
                                ToastType.success,
                                t('inviteLinkCopied'),
                              );
                            }}>
                            {t('copyInviteLink')}
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => {
                              revokeClientInvite.mutate(code, {
                                onSuccess: () =>
                                  showToast(
                                    ToastType.success,
                                    t('inviteRevoked'),
                                  ),
                                onError: error =>
                                  showToast(
                                    ToastType.error,
                                    t(getWorkflowErrorTranslationKey(error)),
                                  ),
                              });
                            }}>
                            {t('revokeInvite')}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <>
      <h2 className="section-title">{t('issuedAccountsList')}</h2>
      <ListToolbar
        query={filters.query}
        onQueryChange={filters.setQuery}
        searchPlaceholder={t('searchIssuedAccountsPlaceholder')}
        status={filters.status}
        onStatusChange={filters.setStatus}
        statusOptions={statusOptions}
        onClear={filters.reset}
        page={page}
        onPageChange={filters.setPage}
      />
      {isLoading ? (
        <div className="card">{t('loading')}</div>
      ) : isError ? (
        <div className="card login-error">{t('workflowLoadError')}</div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>{t('colAccountType')}</th>
                <th>{t('employeeUsername')}</th>
                <th>{t('employeeFullName')}</th>
                <th>{t('colStatus')}</th>
                <th>{t('colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {page.items.map(account => (
                <tr
                  key={`${account.accountKind}-${account.id}`}
                  style={{cursor: 'pointer'}}
                  onClick={() =>
                    navigate(
                      `/merchants/${account.accountKind}/${account.id}`,
                    )
                  }>
                  <td>
                    {account.accountKind === 'merchant'
                      ? t('accountTypeMerchant')
                      : t('accountTypeCustomer')}
                  </td>
                  <td>{account.username}</td>
                  <td>{account.displayName || '—'}</td>
                  <td>{account.status}</td>
                  <td>
                    {canDelete(account.accountKind) ? (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        disabled={
                          deleteMerchant.isPending || deleteClient.isPending
                        }
                        onClick={event => {
                          event.stopPropagation();
                          onDelete(account);
                        }}>
                        {account.accountKind === 'merchant'
                          ? t('deleteMerchant')
                          : t('deleteClient')}
                      </button>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
              {page.total === 0 ? (
                <tr>
                  <td colSpan={5} className="muted">
                    {t('emptyIssuedAccounts')}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
        </>
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

      <Modal
        open={inviteShare != null}
        title={t('clientInviteReadyTitle')}
        onClose={() => setInviteShare(null)}>
        {inviteShare ? (
          <div className="company-form">
            <p className="muted">{t('clientInviteReadyHint')}</p>
            <div className="field">
              <label>{t('inviteCode')}</label>
              <input readOnly value={inviteShare.code} />
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                void copyText(inviteShare.code).then(() =>
                  showToast(ToastType.success, t('inviteCodeCopied')),
                );
              }}>
              {t('copyInviteCode')}
            </button>
            <div className="field">
              <label>{t('inviteLink')}</label>
              <input
                readOnly
                value={
                  inviteShare.link ||
                  buildClientInviteWebLink(inviteShare.code)
                }
              />
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                void copyText(
                  inviteShare.link ||
                    buildClientInviteWebLink(inviteShare.code),
                ).then(() =>
                  showToast(ToastType.success, t('inviteLinkCopied')),
                );
              }}>
              {t('copyInviteLink')}
            </button>
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => openWhatsAppText(inviteShare.message)}>
                {t('whatsapp')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setInviteShare(null)}>
                {t('done')}
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
