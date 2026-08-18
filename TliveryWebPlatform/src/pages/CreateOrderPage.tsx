import {useEffect, useState, type FormEvent, type ReactNode} from 'react';
import {Link, Navigate, useNavigate} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {MapPin} from 'lucide-react';
import {useAuth} from '../auth/AuthContext';
import {useCreateOrder} from '../hooks/useOrders';
import {canCreateOrder} from '../utils/orderPermissions';
import {showToast} from '../utils/showToast';
import {ToastType} from '../enums/ToastType';
import {getWorkflowErrorTranslationKey} from '../utils/workflowError';
import {
  formatPublicLocation,
  isPublicLocationFilled,
  type PublicOrderLocation,
} from '../constants/jordanLocations';
import {Modal} from '../components/Modal';
import {DeliveryLocationPicker} from '../components/DeliveryLocationPicker';
import {CountryPhoneField} from '../components/CountryPhoneField';
import {useCountry} from '../providers/CountryContext';
import {
  isValidNationalNumber,
  normalizeNationalDigits,
  toE164,
} from '../config/countries';

type SectionKey = 'pickup' | 'recipient' | 'shipment';

function emptyLocation(): PublicOrderLocation {
  return {
    countryCode: 'JO',
    governorateId: '',
    areaId: '',
    note: null,
  };
}

export function CreateOrderPage() {
  const {t, i18n} = useTranslation();
  const navigate = useNavigate();
  const {user} = useAuth();
  const {country, countryIso} = useCountry();
  const createOrder = useCreateOrder();
  const locale = i18n.language?.startsWith('ar') ? 'ar' : 'en';

  const [openSection, setOpenSection] = useState<SectionKey>('pickup');
  const [pickupPersonName, setPickupPersonName] = useState('');
  const [pickupPersonPhone, setPickupPersonPhone] = useState('');
  const [useMyProfile, setUseMyProfile] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pickupLocation, setPickupLocation] =
    useState<PublicOrderLocation>(emptyLocation);
  const [dropoffLocation, setDropoffLocation] =
    useState<PublicOrderLocation>(emptyLocation);
  const [amount, setAmount] = useState('');
  const [isCod, setIsCod] = useState(true);
  const [packageDescription, setPackageDescription] = useState('');
  const [packageWeightDimensions, setPackageWeightDimensions] = useState('');
  const [fragile, setFragile] = useState(false);
  const [notes, setNotes] = useState('');
  const [editingKind, setEditingKind] = useState<'pickup' | 'dropoff' | null>(
    null,
  );

  useEffect(() => {
    if (!useMyProfile || !user) {
      return;
    }
    const nextName =
      user.profile?.fullName?.trim() || user.name?.trim() || '';
    const phoneRaw =
      user.profile?.phoneNumber || user.profile?.phone || '';
    if (nextName) {
      setPickupPersonName(nextName);
    }
    if (phoneRaw) {
      setPickupPersonPhone(normalizeNationalDigits(countryIso, phoneRaw));
    }
  }, [countryIso, useMyProfile, user]);

  if (!canCreateOrder(user)) {
    return <Navigate to="/orders" replace />;
  }

  const selectSection = (key: SectionKey) => {
    setOpenSection(key);
  };

  const applyProfile = () => {
    const nextName =
      user?.profile?.fullName?.trim() || user?.name?.trim() || '';
    const phoneRaw =
      user?.profile?.phoneNumber || user?.profile?.phone || '';
    if (!nextName && !phoneRaw) {
      showToast(ToastType.error, t('useMyProfileInfoEmpty'));
      return;
    }
    if (nextName) {
      setPickupPersonName(nextName);
    }
    if (phoneRaw) {
      setPickupPersonPhone(normalizeNationalDigits(countryIso, phoneRaw));
    }
    setUseMyProfile(true);
  };

  const buildOrderNotes = (): string => {
    const lines: string[] = [];
    if (pickupPersonName.trim() || pickupPersonPhone.trim()) {
      const phone = pickupPersonPhone.trim()
        ? toE164(countryIso, pickupPersonPhone)
        : '';
      lines.push(
        `${t('pickupInfoCard')}: ${[pickupPersonName.trim(), phone]
          .filter(Boolean)
          .join(' · ')}`,
      );
    }
    const hasShipmentDetail =
      Boolean(packageDescription.trim()) ||
      Boolean(packageWeightDimensions.trim()) ||
      fragile ||
      Boolean(amount.trim()) ||
      Boolean(notes.trim());
    if (hasShipmentDetail) {
      if (packageDescription.trim()) {
        lines.push(`${t('packageDescription')}: ${packageDescription.trim()}`);
      }
      if (packageWeightDimensions.trim()) {
        lines.push(
          `${t('packageWeightDimensions')}: ${packageWeightDimensions.trim()}`,
        );
      }
      if (fragile) {
        lines.push(t('packageFragile'));
      }
    }
    if (altPhone.trim()) {
      lines.push(`${t('recipientAltPhone')}: ${toE164(countryIso, altPhone)}`);
    }
    if (landmark.trim()) {
      lines.push(`${t('recipientLandmark')}: ${landmark.trim()}`);
    }
    if (notes.trim()) {
      lines.push(`${t('orderNotesOptional')}: ${notes.trim()}`);
    }
    return lines.join('\n');
  };

  const hasAnyOrderDetail =
    Boolean(pickupPersonName.trim()) ||
    Boolean(pickupPersonPhone.trim()) ||
    isPublicLocationFilled(pickupLocation) ||
    Boolean(customerName.trim()) ||
    Boolean(customerPhone.trim()) ||
    Boolean(altPhone.trim()) ||
    Boolean(landmark.trim()) ||
    isPublicLocationFilled(dropoffLocation) ||
    Boolean(packageDescription.trim()) ||
    Boolean(packageWeightDimensions.trim()) ||
    fragile ||
    Boolean(amount.trim()) ||
    Boolean(notes.trim());

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!hasAnyOrderDetail) {
      showToast(ToastType.error, t('orderFormAtLeastOne'));
      return;
    }
    if (
      pickupPersonPhone.trim() &&
      !isValidNationalNumber(countryIso, pickupPersonPhone)
    ) {
      showToast(ToastType.error, t('authErrorInvalidPhone'));
      return;
    }
    if (
      customerPhone.trim() &&
      !isValidNationalNumber(countryIso, customerPhone)
    ) {
      showToast(ToastType.error, t('authErrorInvalidPhone'));
      return;
    }
    if (altPhone.trim() && !isValidNationalNumber(countryIso, altPhone)) {
      showToast(ToastType.error, t('authErrorInvalidPhone'));
      return;
    }

    const amountJod = Number.parseFloat(amount);
    const pickupContact = [
      pickupPersonName.trim(),
      pickupPersonPhone.trim()
        ? toE164(countryIso, pickupPersonPhone)
        : '',
    ]
      .filter(Boolean)
      .join(' · ');
    const pickupFilled = isPublicLocationFilled(pickupLocation);
    const dropoffFilled = isPublicLocationFilled(dropoffLocation);
    const pickupWithNote = pickupFilled
      ? {
          ...pickupLocation,
          note: pickupContact || pickupLocation.note || null,
        }
      : null;
    const dropoffWithNote = dropoffFilled
      ? {
          ...dropoffLocation,
          note: landmark.trim() || dropoffLocation.note || null,
        }
      : null;
    const composedNotes = buildOrderNotes();

    createOrder.mutate(
      {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim()
          ? toE164(countryIso, customerPhone)
          : '',
        pickupLocation: pickupWithNote,
        dropoffLocation: dropoffWithNote,
        pickupAddress: pickupWithNote
          ? formatPublicLocation(pickupWithNote, locale)
          : '',
        dropoffAddress: dropoffWithNote
          ? formatPublicLocation(dropoffWithNote, locale)
          : landmark.trim(),
        amountJod: Number.isFinite(amountJod) ? amountJod : 0,
        isCod,
        notes: composedNotes || undefined,
      },
      {
        onSuccess: result => {
          showToast(ToastType.success, t('orderCreatedToast'));
          navigate(`/orders/${result.orderId}`, {replace: true});
        },
        onError: error =>
          showToast(
            ToastType.error,
            t(getWorkflowErrorTranslationKey(error)),
          ),
      },
    );
  };

  const locationLines = (location: PublicOrderLocation) => {
    const place = (
      (locale === 'ar' ? location.placeNameAr : location.placeNameEn) || ''
    ).trim();
    const area = (
      (locale === 'ar' ? location.areaAr : location.areaEn) || ''
    ).trim();
    const gov = (
      (locale === 'ar' ? location.governorateAr : location.governorateEn) || ''
    ).trim();
    const title = place || area || formatPublicLocation(location, locale);
    const subtitle = [
      area && area !== title ? area : null,
      gov && gov !== title && gov !== area ? gov : null,
    ]
      .filter(Boolean)
      .join(' · ');
    return {title, subtitle};
  };

  const renderLocationCard = (kind: 'pickup' | 'dropoff') => {
    const value = kind === 'pickup' ? pickupLocation : dropoffLocation;
    const filled = isPublicLocationFilled(value);
    const lines = filled ? locationLines(value) : null;
    return (
      <div className="location-summary-card location-summary-card--nested">
        <strong>{t('locationField')}</strong>
        {filled && lines ? (
          <div className="location-summary-details">
            <p className="location-summary-text">{lines.title}</p>
            {lines.subtitle ? (
              <p className="location-summary-sub">{lines.subtitle}</p>
            ) : null}
          </div>
        ) : (
          <p className="location-summary-empty">{t('tapToSetLocation')}</p>
        )}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setEditingKind(kind)}>
          <MapPin size={16} aria-hidden />
          {filled ? t('changeLocation') : t('setLocation')}
        </button>
      </div>
    );
  };

  const renderSectionPanel = (key: SectionKey, body: ReactNode) => {
    if (openSection !== key) {
      return null;
    }
    return <div className="create-order-panel">{body}</div>;
  };

  const tabs: Array<{
    key: SectionKey;
    short: string;
    title: string;
    lead: string;
  }> = [
    {
      key: 'pickup',
      short: t('createOrderTabPickup'),
      title: t('pickupInfoCard'),
      lead: t('createOrderPickupLead'),
    },
    {
      key: 'recipient',
      short: t('createOrderTabRecipient'),
      title: t('recipientInfoCard'),
      lead: t('createOrderRecipientLead'),
    },
    {
      key: 'shipment',
      short: t('createOrderTabShipment'),
      title: t('shipmentInfoCard'),
      lead: t('createOrderShipmentLead'),
    },
  ];
  const activeTab = tabs.find(tab => tab.key === openSection) ?? tabs[0];

  return (
    <div className="page">
      <div className="toolbar">
        <Link to="/orders" className="btn btn-secondary">
          {t('goBack')}
        </Link>
      </div>

      <form className="card company-form create-order-form" onSubmit={onSubmit}>
        <header className="create-order-hero">
          <strong>{t('createOrder')}</strong>
          <p className="muted">{t('createOrderSubtitle')}</p>
        </header>

        <div className="create-order-tabs" role="tablist">
          {tabs.map((tab, index) => {
            const active = openSection === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                className={`create-order-tab${active ? ' is-active' : ''}`}
                onClick={() => selectSection(tab.key)}>
                <span className="create-order-tab-step">{index + 1}</span>
                <span className="create-order-tab-label">{tab.short}</span>
              </button>
            );
          })}
        </div>

        <div className="create-order-panel-shell">
          <div className="create-order-panel-header">
            <div>
              <strong>{activeTab.title}</strong>
              <p className="muted">{activeTab.lead}</p>
            </div>
          </div>

          {renderSectionPanel(
            'pickup',
            <>
              <label className="field check-row profile-toggle-row">
                <input
                  type="checkbox"
                  checked={useMyProfile}
                  onChange={event => {
                    if (event.target.checked) {
                      applyProfile();
                    } else {
                      setUseMyProfile(false);
                    }
                  }}
                />
                {t('useMyProfileInfo')}
              </label>

              <label className="field">
                {t('pickupPersonName')}
                <input
                  value={pickupPersonName}
                  onChange={event => {
                    setPickupPersonName(event.target.value);
                    if (useMyProfile) {
                      setUseMyProfile(false);
                    }
                  }}
                  placeholder={t('pickupPersonNamePlaceholder')}
                />
              </label>

              <CountryPhoneField
                id="pickupPersonPhone"
                label={t('pickupPersonPhone')}
                value={pickupPersonPhone}
                country={country}
                onChange={value => {
                  setPickupPersonPhone(value);
                  if (useMyProfile) {
                    setUseMyProfile(false);
                  }
                }}
              />

              {renderLocationCard('pickup')}
            </>,
          )}

          {renderSectionPanel(
            'recipient',
            <>
              <label className="field">
                {t('customerName')}
                <input
                  value={customerName}
                  onChange={event => setCustomerName(event.target.value)}
                  placeholder={t('customerNamePlaceholder')}
                />
              </label>

              <CountryPhoneField
                id="customerPhone"
                label={t('customerPhone')}
                value={customerPhone}
                country={country}
                onChange={setCustomerPhone}
              />

              <CountryPhoneField
                id="recipientAltPhone"
                label={t('recipientAltPhone')}
                value={altPhone}
                country={country}
                onChange={setAltPhone}
              />

              {renderLocationCard('dropoff')}

              <label className="field">
                {t('recipientLandmark')}
                <input
                  value={landmark}
                  onChange={event => setLandmark(event.target.value)}
                  placeholder={t('recipientLandmarkPlaceholder')}
                />
              </label>
            </>,
          )}

          {renderSectionPanel(
            'shipment',
            <>
              <label className="field">
                {t('packageDescription')}
                <input
                  value={packageDescription}
                  onChange={event => setPackageDescription(event.target.value)}
                  placeholder={t('packageDescriptionPlaceholder')}
                />
              </label>

              <label className="field">
                {t('packageWeightDimensions')}
                <input
                  value={packageWeightDimensions}
                  onChange={event =>
                    setPackageWeightDimensions(event.target.value)
                  }
                  placeholder={t('packageWeightDimensionsPlaceholder')}
                />
              </label>

              <label className="field check-row">
                <input
                  type="checkbox"
                  checked={fragile}
                  onChange={event => setFragile(event.target.checked)}
                />
                {t('packageFragile')}
              </label>

              <label className="field">
                {t('orderAmount')}
                <input
                  value={amount}
                  onChange={event => setAmount(event.target.value)}
                  placeholder="0.00"
                  inputMode="decimal"
                />
              </label>

              <div className="field">
                <span>{t('paymentMethod')}</span>
                <div className="chip-row">
                  <button
                    type="button"
                    className={`chip${isCod ? ' is-active' : ''}`}
                    onClick={() => setIsCod(true)}>
                    {t('cod')}
                  </button>
                  <button
                    type="button"
                    className={`chip${!isCod ? ' is-active' : ''}`}
                    onClick={() => setIsCod(false)}>
                    {t('paymentPrepaid')}
                  </button>
                </div>
              </div>

              <label className="field">
                {t('orderNotesOptional')}
                <textarea
                  value={notes}
                  onChange={event => setNotes(event.target.value)}
                  placeholder={t('orderNotesPlaceholder')}
                  rows={3}
                />
              </label>
            </>,
          )}
        </div>

        <div className="form-actions create-order-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={createOrder.isPending || !hasAnyOrderDetail}>
            {t('submitDeliveryRequest')}
          </button>
        </div>
      </form>

      <Modal
        open={editingKind != null}
        wide
        title={
          editingKind === 'dropoff'
            ? t('editDropoffLocation')
            : t('editPickupLocation')
        }
        onClose={() => setEditingKind(null)}>
        {editingKind ? (
          <DeliveryLocationPicker
            key={editingKind}
            kind={editingKind}
            initial={
              editingKind === 'pickup' ? pickupLocation : dropoffLocation
            }
            onConfirm={location => {
              if (editingKind === 'pickup') {
                setPickupLocation(location);
              } else {
                setDropoffLocation(location);
              }
              setEditingKind(null);
            }}
          />
        ) : null}
      </Modal>
    </div>
  );
}
