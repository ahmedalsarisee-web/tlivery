import {useMemo, useState, type FormEvent} from 'react';
import {Link} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {
  useCompanies,
  useCreateDriverInvite,
  useDriverInvites,
  useDrivers,
  useRemoveCompanyDriver,
  useRevokeDriverInvite,
} from '../hooks/useWorkflow';
import {useDebouncedValue} from '../hooks/useDebouncedValue';
import {useAuth} from '../auth/AuthContext';
import {useCountry} from '../providers/CountryContext';
import {CountryPhoneField} from '../components/CountryPhoneField';
import {ListToolbar, useListFilters} from '../components/ListToolbar';
import {Modal} from '../components/Modal';
import {toE164} from '../config/countries';
import {showToast} from '../utils/showToast';
import {ToastType} from '../enums/ToastType';

type DriversSegment = 'drivers' | 'invites';

function StatusBadge({status}: {status: string}) {
  const {t} = useTranslation();
  const label =
    status === 'pending'
      ? t('statusPending')
      : status === 'approved' || status === 'active'
        ? t('statusApproved')
        : status === 'rejected' || status === 'suspended' || status === 'removed'
          ? t('statusRejected')
          : status;
  return <span className={`badge badge-${status}`}>{label}</span>;
}

function phoneDigits(phoneE164: string): string {
  return phoneE164.replace(/\D/g, '');
}

function buildDriverInviteDeepLink(code: string): string {
  return `tlivery://driver-invite?inviteCode=${encodeURIComponent(code)}`;
}

function openWhatsAppInvite(phoneE164: string, message: string) {
  const url = `https://wa.me/${phoneDigits(phoneE164)}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
}

export function DriversPage() {
  const {t} = useTranslation();
  const {user} = useAuth();
  const {country, countryIso} = useCountry();
  const companyId = user?.companyId ?? '';
  const filters = useListFilters(8);
  const debouncedQ = useDebouncedValue(filters.query, 400);
  const drivers = useDrivers(companyId, {
    q: debouncedQ,
    status: filters.status,
    page: filters.page,
    pageSize: filters.params.pageSize,
  });
  const invites = useDriverInvites(companyId);
  const companies = useCompanies();
  const createInvite = useCreateDriverInvite(companyId);
  const revokeInvite = useRevokeDriverInvite(companyId);
  const removeDriver = useRemoveCompanyDriver(companyId);
  const [invitePhone, setInvitePhone] = useState('');
  const [segment, setSegment] = useState<DriversSegment>('drivers');
  const [pendingRevokeCode, setPendingRevokeCode] = useState<string | null>(
    null,
  );
  const [pendingRemoveDriver, setPendingRemoveDriver] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const companyName =
    companies.data?.find(item => item.id === companyId)?.companyName ?? 'Wasel';

  const statusOptions = useMemo(
    () => [
      {value: 'all', label: t('filterAll')},
      {value: 'active', label: t('statusApproved')},
      {value: 'busy', label: 'busy'},
      {value: 'offline', label: 'offline'},
      {value: 'suspended', label: t('statusRejected')},
    ],
    [t],
  );

  const driversPage = useMemo(
    () => ({
      items: drivers.data?.drivers ?? [],
      total: drivers.data?.total ?? 0,
      page: filters.page,
      pageSize: drivers.data?.pageSize ?? filters.params.pageSize,
      hasMore: drivers.data?.hasMore ?? false,
    }),
    [drivers.data?.drivers, drivers.data?.hasMore, drivers.data?.pageSize, drivers.data?.total, filters.page, filters.params.pageSize],
  );
  const pendingInvites = useMemo(
    () => (invites.data ?? []).filter(row => row.status === 'pending'),
    [invites.data],
  );

  const inviteMessage = (code: string) =>
    t('whatsappDriverInviteMessage', {
      companyName,
      code,
      link: buildDriverInviteDeepLink(code),
    });

  const submitInvite = (event: FormEvent) => {
    event.preventDefault();
    const phone = toE164(countryIso, invitePhone);
    createInvite.mutate(
      {phone},
      {
        onSuccess: result => {
          setInvitePhone('');
          showToast(
            ToastType.success,
            t('driverInviteCreated', {code: result.code}),
          );
          openWhatsAppInvite(phone, inviteMessage(result.code));
        },
        onError: () => showToast(ToastType.error, t('workflowActionError')),
      },
    );
  };

  const onConfirmRevoke = () => {
    if (!pendingRevokeCode) {
      return;
    }
    revokeInvite.mutate(pendingRevokeCode, {
      onSuccess: () => {
        setPendingRevokeCode(null);
        showToast(ToastType.success, t('inviteRevoked'));
      },
      onError: () => showToast(ToastType.error, t('workflowActionError')),
    });
  };

  const onConfirmRemove = () => {
    if (!pendingRemoveDriver) {
      return;
    }
    removeDriver.mutate(pendingRemoveDriver.id, {
      onSuccess: () => {
        setPendingRemoveDriver(null);
        showToast(ToastType.success, t('driverRemoved'));
      },
      onError: () => showToast(ToastType.error, t('workflowActionError')),
    });
  };

  const driverCount = drivers.data?.total ?? drivers.data?.drivers.length ?? 0;

  return (
    <div className="page">
      <div className="toolbar">
        <p className="page-lead" style={{margin: 0}}>
          {t('driversLeadInviteOnly')}
        </p>
        <Link to="/drivers/map" className="btn btn-secondary">
          {t('driversMap')}
        </Link>
      </div>

      <div
        className="segmented-tab-bar"
        role="tablist"
        aria-label={t('navDrivers')}>
        <button
          type="button"
          role="tab"
          aria-selected={segment === 'drivers'}
          className={`segmented-tab${segment === 'drivers' ? ' is-active' : ''}`}
          onClick={() => setSegment('drivers')}>
          {t('activeDrivers')} ({driverCount})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={segment === 'invites'}
          className={`segmented-tab${segment === 'invites' ? ' is-active' : ''}`}
          onClick={() => setSegment('invites')}>
          {t('pendingDriverInvites')} ({pendingInvites.length})
        </button>
      </div>

      {segment === 'invites' ? (
        <>
          <div className="form-grid">
            <form className="card company-form" onSubmit={submitInvite}>
              <strong>{t('sendWhatsAppInvite')}</strong>
              <CountryPhoneField
                id="invitePhone"
                label={t('companyPhone')}
                value={invitePhone}
                country={country}
                onChange={setInvitePhone}
                required
              />
              <button
                className="btn btn-primary"
                disabled={createInvite.isPending}>
                {t('sendWhatsAppInvite')}
              </button>
            </form>
          </div>

          {invites.isLoading ? (
            <div className="card">{t('loading')}</div>
          ) : invites.isError ? (
            <div className="card login-error">{t('workflowLoadError')}</div>
          ) : pendingInvites.length === 0 ? (
            <div className="card empty">{t('emptyInvites')}</div>
          ) : (
            <div className="action-card-list">
              {pendingInvites.map(row => {
                const phone = row.phoneNumber ?? row.phone ?? '';
                const code = row.code ?? row.id;
                const revoking =
                  revokeInvite.isPending && revokeInvite.variables === code;
                return (
                  <article key={row.id} className="action-card">
                    <div className="action-card-accent action-card-accent-gold" />
                    <div className="action-card-body">
                      <div className="action-card-head">
                        <div>
                          <strong className="action-card-title" dir="ltr">
                            {code}
                          </strong>
                          <p className="muted action-card-meta">
                            {phone || t('inviteNoPhone')}
                          </p>
                          <p className="muted action-card-meta">
                            {t('invitePendingHint')}
                          </p>
                        </div>
                        <StatusBadge status={row.status} />
                      </div>
                      <div className="action-card-footer">
                        {phone ? (
                          <button
                            type="button"
                            className="btn btn-action btn-action-primary"
                            disabled={revoking}
                            onClick={() =>
                              openWhatsAppInvite(phone, inviteMessage(code))
                            }>
                            {t('resendWhatsApp')}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="btn btn-action btn-action-muted"
                          disabled={revoking}
                          onClick={() => {
                            void copyText(code).then(() =>
                              showToast(ToastType.success, t('inviteCodeCopied')),
                            );
                          }}>
                          {t('copyInviteCode')}
                        </button>
                        <button
                          type="button"
                          className="btn btn-action btn-action-danger"
                          disabled={revokeInvite.isPending}
                          onClick={() => setPendingRevokeCode(code)}>
                          {t('revokeInvite')}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
          <ListToolbar
            query={filters.query}
            onQueryChange={filters.setQuery}
            searchPlaceholder={t('searchDriversPlaceholder')}
            status={filters.status}
            onStatusChange={filters.setStatus}
            statusOptions={statusOptions}
            onClear={filters.reset}
            page={driversPage}
            onPageChange={filters.setPage}
          />
          {drivers.isLoading ? (
            <div className="card">{t('loading')}</div>
          ) : drivers.isError ? (
            <div className="card login-error">{t('workflowLoadError')}</div>
          ) : driversPage.total === 0 ? (
            <div className="card empty">{t('noResults')}</div>
          ) : (
            <div className="action-card-list">
              {driversPage.items.map(row => {
                const removing =
                  removeDriver.isPending && removeDriver.variables === row.id;
                return (
                  <article key={row.id} className="action-card">
                    <div className="action-card-accent action-card-accent-navy" />
                    <div className="action-card-body">
                      <div className="action-card-head">
                        <div>
                          <strong className="action-card-title">
                            {row.fullName}
                          </strong>
                          <p className="muted action-card-meta">{row.phone}</p>
                          {row.plateNumber ? (
                            <p className="muted action-card-meta">
                              {row.plateNumber}
                            </p>
                          ) : null}
                          <p className="muted action-card-meta">
                            {t('driverStatsShort', {
                              rating: (row.rating ?? 0).toFixed(1),
                              completed: row.completedOrders ?? 0,
                              rate: Math.round(row.successRate ?? 0),
                            })}
                          </p>
                          {row.badges && row.badges.length > 0 ? (
                            <p className="muted action-card-meta">
                              {row.badges
                                .slice(0, 3)
                                .map(badge =>
                                  t(`driverBadge_${badge}`, {
                                    defaultValue: badge,
                                  }),
                                )
                                .join(' · ')}
                            </p>
                          ) : null}
                        </div>
                        <StatusBadge status={row.status} />
                      </div>
                      <div className="action-card-footer">
                        <Link
                          to={`/drivers/${row.id}`}
                          className="btn btn-action btn-action-primary">
                          {t('driverDetails')}
                        </Link>
                        <button
                          type="button"
                          className="btn btn-action btn-action-danger"
                          disabled={removeDriver.isPending}
                          onClick={() =>
                            setPendingRemoveDriver({
                              id: row.id,
                              name: row.fullName,
                            })
                          }>
                          {removing ? t('loading') : t('removeDriver')}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      <Modal
        open={pendingRevokeCode != null}
        title={t('revokeInviteTitle')}
        onClose={() => setPendingRevokeCode(null)}>
        <p className="muted">
          {t('revokeInviteBody', {code: pendingRevokeCode ?? ''})}
        </p>
        <div className="row-actions" style={{marginTop: 16}}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setPendingRevokeCode(null)}>
            {t('cancel')}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={revokeInvite.isPending}
            onClick={onConfirmRevoke}>
            {revokeInvite.isPending ? t('loading') : t('revokeInvite')}
          </button>
        </div>
      </Modal>

      <Modal
        open={pendingRemoveDriver != null}
        title={t('deleteDriverTitle')}
        onClose={() => setPendingRemoveDriver(null)}>
        <p className="muted">
          {t('deleteDriverBody', {name: pendingRemoveDriver?.name ?? ''})}
        </p>
        <div className="row-actions" style={{marginTop: 16}}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setPendingRemoveDriver(null)}>
            {t('cancel')}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={removeDriver.isPending}
            onClick={onConfirmRemove}>
            {removeDriver.isPending ? t('loading') : t('removeDriver')}
          </button>
        </div>
      </Modal>
    </div>
  );
}
