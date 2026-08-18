import {useEffect, useRef, useState, type FormEvent} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../auth/AuthContext';
import {
  useCompanyDriver,
  useUpdateCompanyDriver,
} from '../hooks/useWorkflow';
import type {DriverStatus, VehicleType} from '../models/workflow';
import {showToast} from '../utils/showToast';
import {ToastType} from '../enums/ToastType';
import {compressDriverImageFile, type DriverImageKind} from '../utils/compressDriverImage';
import {uploadDriverImage} from '../services/driverMediaService';

const VEHICLES: VehicleType[] = ['motorcycle', 'car', 'van'];
const STATUSES: Exclude<DriverStatus, 'removed'>[] = [
  'active',
  'busy',
  'offline',
  'suspended',
];

export function DriverDetailsPage() {
  const {t} = useTranslation();
  const navigate = useNavigate();
  const {driverId = ''} = useParams<{driverId: string}>();
  const {user} = useAuth();
  const companyId = user?.companyId ?? '';
  const driverQuery = useCompanyDriver(driverId);
  const updateDriver = useUpdateCompanyDriver(companyId);
  const driver = driverQuery.data;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingKind, setPendingKind] = useState<DriverImageKind | null>(null);
  const [uploadingKind, setUploadingKind] = useState<DriverImageKind | null>(
    null,
  );

  const [fullName, setFullName] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('car');
  const [plateNumber, setPlateNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [status, setStatus] =
    useState<Exclude<DriverStatus, 'removed'>>('active');

  useEffect(() => {
    if (!driver) {
      return;
    }
    setFullName(driver.fullName);
    setVehicleType(driver.vehicleType ?? 'car');
    setPlateNumber(driver.plateNumber ?? '');
    setLicenseNumber(driver.licenseNumber ?? '');
    const nextStatus = driver.status;
    if (
      nextStatus === 'active' ||
      nextStatus === 'busy' ||
      nextStatus === 'offline' ||
      nextStatus === 'suspended'
    ) {
      setStatus(nextStatus);
    }
  }, [driver]);

  const urlFieldForKind = (
    kind: DriverImageKind,
  ):
    | 'photoUrl'
    | 'licenseImageUrl'
    | 'registrationImageUrl'
    | 'insuranceImageUrl' => {
    switch (kind) {
      case 'avatar':
        return 'photoUrl';
      case 'license':
        return 'licenseImageUrl';
      case 'registration':
        return 'registrationImageUrl';
      case 'insurance':
        return 'insuranceImageUrl';
    }
  };

  const onPickImage = (kind: DriverImageKind) => {
    setPendingKind(kind);
    fileInputRef.current?.click();
  };

  const onFileSelected = async (file: File | undefined) => {
    const kind = pendingKind;
    setPendingKind(null);
    if (!file || !kind || !driverId || !companyId) {
      return;
    }
    try {
      setUploadingKind(kind);
      const blob = await compressDriverImageFile(file, kind);
      const url = await uploadDriverImage({
        companyId,
        driverId,
        kind,
        blob,
      });
      await updateDriver.mutateAsync({
        driverId,
        [urlFieldForKind(kind)]: url,
      });
      showToast(
        ToastType.success,
        kind === 'avatar' ? t('photoUpdated') : t('documentImageUpdated'),
      );
    } catch {
      showToast(ToastType.error, t('photoUploadFailed'));
    } finally {
      setUploadingKind(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onSave = (event: FormEvent) => {
    event.preventDefault();
    if (!driverId) {
      return;
    }
    const name = fullName.trim();
    const plate = plateNumber.trim();
    const license = licenseNumber.trim();
    if (!name || !plate || !license) {
      showToast(ToastType.error, t('driverFormRequired'));
      return;
    }
    updateDriver.mutate(
      {
        driverId,
        fullName: name,
        vehicleType,
        plateNumber: plate,
        licenseNumber: license,
        status,
      },
      {
        onSuccess: () => {
          showToast(ToastType.success, t('driverUpdated'));
          navigate('/drivers');
        },
        onError: () => showToast(ToastType.error, t('workflowActionError')),
      },
    );
  };

  if (driverQuery.isLoading) {
    return (
      <div className="page">
        <div className="card">{t('loading')}</div>
      </div>
    );
  }

  if (driverQuery.isError || !driver) {
    return (
      <div className="page">
        <div className="toolbar">
          <Link to="/drivers" className="btn btn-secondary">
            {t('backToDrivers')}
          </Link>
        </div>
        <div className="card login-error">{t('driverNotFound')}</div>
      </div>
    );
  }

  const phone = driver.phoneNumber ?? driver.phone;
  const docs: Array<{
    kind: Exclude<DriverImageKind, 'avatar'>;
    title: string;
    sub: string;
    url: string | null | undefined;
  }> = [
    {
      kind: 'license',
      title: t('driverLicenseDoc'),
      sub: driver.licenseNumber || t('notSet'),
      url: driver.licenseImageUrl,
    },
    {
      kind: 'registration',
      title: t('vehicleRegistration'),
      sub: driver.plateNumber || t('notSet'),
      url: driver.registrationImageUrl,
    },
    {
      kind: 'insurance',
      title: t('vehicleInsuranceDoc'),
      sub: t('notSet'),
      url: driver.insuranceImageUrl,
    },
  ];

  return (
    <div className="page">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={e => {
          void onFileSelected(e.target.files?.[0]);
        }}
      />

      <div className="toolbar">
        <div>
          <h2 style={{margin: 0}}>{t('driverDetails')}</h2>
          <p className="page-lead" style={{margin: '4px 0 0'}}>
            {phone}
          </p>
        </div>
        <Link to="/drivers" className="btn btn-secondary">
          {t('backToDrivers')}
        </Link>
      </div>

      <div className="card company-form">
        <strong>{t('driverPhoto')}</strong>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginTop: 12,
            marginBottom: 8,
          }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              overflow: 'hidden',
              background: 'var(--surface-muted)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}>
            {driver.photoUrl ? (
              <img
                src={driver.photoUrl}
                alt=""
                style={{width: '100%', height: '100%', objectFit: 'cover'}}
              />
            ) : (
              <span className="muted">{t('noPhoto')}</span>
            )}
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={uploadingKind === 'avatar'}
            onClick={() => onPickImage('avatar')}>
            {uploadingKind === 'avatar'
              ? t('uploading')
              : driver.photoUrl
                ? t('changePhoto')
                : t('uploadPhoto')}
          </button>
        </div>
      </div>

      <div className="card company-form">
        <strong>{t('driverDocuments')}</strong>
        <div style={{display: 'grid', gap: 12, marginTop: 12}}>
          {docs.map(doc => (
            <div
              key={doc.kind}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
              }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 10,
                  overflow: 'hidden',
                  background: 'var(--surface-muted)',
                  flexShrink: 0,
                }}>
                {doc.url ? (
                  <img
                    src={doc.url}
                    alt=""
                    style={{width: '100%', height: '100%', objectFit: 'cover'}}
                  />
                ) : null}
              </div>
              <div style={{flex: 1, minWidth: 140}}>
                <div>{doc.title}</div>
                <p className="muted" style={{margin: '2px 0 0', fontSize: 12}}>
                  {doc.sub}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={uploadingKind === doc.kind}
                onClick={() => onPickImage(doc.kind)}>
                {uploadingKind === doc.kind
                  ? t('uploading')
                  : doc.url
                    ? t('changeDocumentImage')
                    : t('uploadDocumentImage')}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="card company-form">
        <strong>{t('driverReputation')}</strong>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: 12,
            marginBottom: 12,
          }}>
          <div className="field">
            <label>{t('driverRating')}</label>
            <p style={{margin: 0}}>{(driver.rating ?? 0).toFixed(1)}</p>
          </div>
          <div className="field">
            <label>{t('driverCompletedOrders')}</label>
            <p style={{margin: 0}}>{driver.completedOrders ?? 0}</p>
          </div>
          <div className="field">
            <label>{t('driverCancelledOrders')}</label>
            <p style={{margin: 0}}>{driver.cancelledOrders ?? 0}</p>
          </div>
          <div className="field">
            <label>{t('driverSuccessRate')}</label>
            <p style={{margin: 0}}>
              {`${Math.round(driver.successRate ?? 0)}%`}
            </p>
          </div>
        </div>
        {driver.badges && driver.badges.length > 0 ? (
          <div className="field">
            <label>{t('driverBadges')}</label>
            <p style={{margin: 0}}>
              {driver.badges
                .map(badge => t(`driverBadge_${badge}`, {defaultValue: badge}))
                .join(' · ')}
            </p>
          </div>
        ) : null}
        {driver.experienceStartedAt ? (
          <div className="field">
            <label>{t('driverExperienceSince')}</label>
            <p style={{margin: 0}}>
              {new Date(driver.experienceStartedAt).toLocaleDateString()}
            </p>
          </div>
        ) : null}
      </div>

      <form className="card company-form" onSubmit={onSave}>
        <strong>{t('driverProfile')}</strong>
        <div className="field">
          <label htmlFor="driverFullName">{t('driverFullName')}</label>
          <input
            id="driverFullName"
            required
            value={fullName}
            onChange={e => setFullName(e.target.value)}
          />
        </div>
        <div className="field">
          <label>{t('driverPhone')}</label>
          <input value={phone} disabled readOnly dir="ltr" />
          <p className="muted" style={{margin: '6px 0 0', fontSize: 12}}>
            {t('driverPhoneReadOnlyHint')}
          </p>
        </div>
        <div className="field">
          <label htmlFor="driverVehicle">{t('signupVehicleType')}</label>
          <select
            id="driverVehicle"
            value={vehicleType}
            onChange={e => setVehicleType(e.target.value as VehicleType)}>
            {VEHICLES.map(value => (
              <option key={value} value={value}>
                {value === 'motorcycle'
                  ? t('vehicleMotorcycle')
                  : value === 'car'
                    ? t('vehicleCar')
                    : t('vehicleVan')}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="driverPlate">{t('driverPlate')}</label>
          <input
            id="driverPlate"
            required
            value={plateNumber}
            onChange={e => setPlateNumber(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="driverLicense">{t('driverLicense')}</label>
          <input
            id="driverLicense"
            required
            value={licenseNumber}
            onChange={e => setLicenseNumber(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="driverStatus">{t('driverStatus')}</label>
          <select
            id="driverStatus"
            value={status}
            onChange={e =>
              setStatus(e.target.value as Exclude<DriverStatus, 'removed'>)
            }>
            {STATUSES.map(value => (
              <option key={value} value={value}>
                {t(`driverStatus_${value}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => navigate('/drivers')}>
            {t('cancel')}
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={updateDriver.isPending}>
            {updateDriver.isPending ? t('saving') : t('saveDriver')}
          </button>
        </div>
      </form>
    </div>
  );
}
