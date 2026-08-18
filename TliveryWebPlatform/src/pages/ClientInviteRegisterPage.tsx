import {Navigate, useParams} from 'react-router-dom';

/** Shared invite URLs land here, then open the customer registration form. */
export function ClientInviteRegisterPage() {
  const {code: rawCode} = useParams<{code: string}>();
  const code = (rawCode || '').trim().toUpperCase();
  const target = code
    ? `/register-customer?inviteCode=${encodeURIComponent(code)}`
    : '/register-customer';
  return <Navigate to={target} replace />;
}
