import {useEffect, useMemo} from 'react';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {queryKeys} from '@app/constants/queryKeys';
import {services} from '@app/services/dependencies';
import {
  selectCanManageCustomers,
  selectCanManageDrivers,
  selectCanManageOrders,
  selectIsCompanyStaff,
  selectProfileReady,
  selectUserId,
  useUserStore,
} from '@app/features/user';
import type {
  AcceptDriverInviteInput,
  CompanyApplication,
  CreateCompanyEmployeeInput,
  CreateCompanyIssuedAccountInput,
  CreateDriverInput,
  DriverApplication,
  SubmitCompanyApplicationInput,
  SubmitDriverApplicationInput,
  UpdateCompanyDriverInput,
  UpdateCompanyEmployeeInput,
  UpdateMyVehicleInput,
} from '@app/models/workflow.model';

export const useUserProfile = (userId: string | null) =>
  useQuery({
    queryKey: queryKeys.users.profile(userId ?? ''),
    queryFn: () => services.workflow.repository.getUserProfile(userId!),
    enabled: Boolean(userId),
  });

export const useCompany = (companyId: string | null) =>
  useQuery({
    queryKey: queryKeys.companies.detail(companyId ?? ''),
    queryFn: () => services.workflow.repository.getCompany(companyId!),
    enabled: Boolean(companyId),
  });

export const useCompanyApplication = (userId: string | null) => {
  const client = useQueryClient();
  const key = useMemo(
    () => queryKeys.companyApplications.byUser(userId ?? ''),
    [userId],
  );
  const result = useQuery({
    queryKey: key,
    queryFn: () => services.workflow.repository.getCompanyApplication(userId!),
    enabled: Boolean(userId),
  });

  useEffect(() => {
    if (!userId) {
      return;
    }
    return services.workflow.repository.observeCompanyApplication(
      userId,
      value => client.setQueryData<CompanyApplication | null>(key, value),
    );
  }, [client, key, userId]);
  return result;
};

export const useDriverApplication = (userId: string | null) => {
  const client = useQueryClient();
  const key = useMemo(
    () => queryKeys.driverApplications.byUser(userId ?? ''),
    [userId],
  );
  const result = useQuery({
    queryKey: key,
    queryFn: () => services.workflow.repository.getDriverApplication(userId!),
    enabled: Boolean(userId),
  });

  useEffect(() => {
    if (!userId) {
      return;
    }
    return services.workflow.repository.observeDriverApplication(
      userId,
      value => client.setQueryData<DriverApplication | null>(key, value),
    );
  }, [client, key, userId]);
  return result;
};

export const useCompanyDrivers = (
  companyId: string | null,
  options?: {
    forOrderAssign?: boolean;
    q?: string;
    status?: string;
    page?: number;
    pageSize?: number;
    cursor?: string | null;
  },
) => {
  const profileReady = useUserStore(selectProfileReady);
  const isCompanyStaff = useUserStore(selectIsCompanyStaff);
  const canManageDrivers = useUserStore(selectCanManageDrivers);
  const canManageOrders = useUserStore(selectCanManageOrders);
  const allowed =
    profileReady &&
    Boolean(companyId) &&
    isCompanyStaff &&
    (canManageDrivers ||
      (Boolean(options?.forOrderAssign) && canManageOrders));
  const searchQ = options?.q?.trim() ?? '';
  const status =
    options?.status && options.status !== 'all' ? options.status : 'all';
  const key = useMemo(
    () => [
      ...queryKeys.drivers.byCompany(companyId ?? '', searchQ, status),
      options?.page ?? 1,
      options?.pageSize ?? 20,
      options?.cursor ?? null,
    ],
    [companyId, options?.cursor, options?.page, options?.pageSize, searchQ, status],
  );
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const state = useUserStore.getState();
      if (!selectIsCompanyStaff(state)) {
        return {
          drivers: [],
          total: 0,
          page: options?.page ?? 1,
          pageSize: options?.pageSize ?? 20,
          hasMore: false,
          nextCursor: null,
        };
      }
      if (
        !selectCanManageDrivers(state) &&
        !(options?.forOrderAssign && selectCanManageOrders(state))
      ) {
        return {
          drivers: [],
          total: 0,
          page: options?.page ?? 1,
          pageSize: options?.pageSize ?? 20,
          hasMore: false,
          nextCursor: null,
        };
      }
      return services.workflow.listCompanyDrivers({
        q: searchQ || undefined,
        status: status !== 'all' ? status : undefined,
        page: options?.page,
        pageSize: options?.pageSize,
        cursor: options?.cursor ?? undefined,
      });
    },
    enabled: allowed,
    retry: false,
    placeholderData: keepPreviousData,
  });
};

export const useDriverInvites = (companyId: string | null) => {
  const profileReady = useUserStore(selectProfileReady);
  const isCompanyStaff = useUserStore(selectIsCompanyStaff);
  const canManageDrivers = useUserStore(selectCanManageDrivers);
  const key = useMemo(
    () => queryKeys.driverInvites.byCompany(companyId ?? ''),
    [companyId],
  );
  return useQuery({
    queryKey: key,
    queryFn: () => services.workflow.listCompanyDriverInvites(),
    enabled:
      profileReady &&
      Boolean(companyId) &&
      isCompanyStaff &&
      canManageDrivers,
    retry: false,
  });
};

export const useClientInvites = (companyId: string | null) => {
  const profileReady = useUserStore(selectProfileReady);
  const isCompanyStaff = useUserStore(selectIsCompanyStaff);
  const canManageCustomers = useUserStore(selectCanManageCustomers);
  const key = useMemo(
    () => queryKeys.clientInvites.byCompany(companyId ?? ''),
    [companyId],
  );
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const result = await services.workflow.listCompanyClientInvites();
      return result.invites;
    },
    enabled:
      profileReady &&
      Boolean(companyId) &&
      isCompanyStaff &&
      canManageCustomers,
    retry: false,
  });
};

export const usePendingDriverApplications = (companyId: string | null) => {
  const client = useQueryClient();
  const profileReady = useUserStore(selectProfileReady);
  const isCompanyStaff = useUserStore(selectIsCompanyStaff);
  const canManageDrivers = useUserStore(selectCanManageDrivers);
  const enabled =
    profileReady &&
    Boolean(companyId) &&
    isCompanyStaff &&
    canManageDrivers;
  const key = useMemo(
    () => queryKeys.driverApplications.pendingByCompany(companyId ?? ''),
    [companyId],
  );
  const result = useQuery({
    queryKey: key,
    queryFn: () =>
      services.workflow.repository.getPendingDriverApplications(companyId!),
    enabled,
    retry: false,
  });

  useEffect(() => {
    if (!enabled || !companyId) {
      return;
    }
    return services.workflow.repository.observePendingDriverApplications(
      companyId,
      value => client.setQueryData<DriverApplication[]>(key, value),
    );
  }, [client, companyId, enabled, key]);
  return result;
};

export const useSubmitCompanyApplication = () =>
  useMutation({
    mutationFn: (input: SubmitCompanyApplicationInput) =>
      services.workflow.submitCompanyApplication(input),
  });

export const useSubmitDriverApplication = () =>
  useMutation({
    mutationFn: (input: SubmitDriverApplicationInput) =>
      services.workflow.submitDriverApplication(input),
  });

export const useAcceptDriverInvite = () =>
  useMutation({
    mutationFn: (input: AcceptDriverInviteInput) =>
      services.workflow.acceptDriverInvite(input),
  });

export const useCreateDriverDirect = () =>
  useMutation({
    mutationFn: (input: CreateDriverInput) =>
      services.workflow.createDriverDirect(input),
  });

export const useCreateDriverInvite = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (phoneNumber?: string) =>
      services.workflow.createDriverInvite(phoneNumber),
    onSuccess: () =>
      client.invalidateQueries({queryKey: ['driverInvites']}),
  });
};

export const useCreateClientInvite = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input?: {
      phoneNumber?: string;
      role?: 'client' | 'merchant';
    }) =>
      services.workflow.createClientInvite(
        input?.phoneNumber,
        input?.role,
      ),
    onSuccess: () =>
      client.invalidateQueries({queryKey: ['clientInvites']}),
  });
};

export const useRevokeClientInvite = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (inviteCode: string) =>
      services.workflow.revokeClientInvite(inviteCode),
    onSuccess: () =>
      client.invalidateQueries({queryKey: ['clientInvites']}),
  });
};

export const useRevokeDriverInvite = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (inviteCode: string) =>
      services.workflow.revokeDriverInvite(inviteCode),
    onSuccess: () =>
      client.invalidateQueries({queryKey: ['driverInvites']}),
  });
};

export const useRemoveCompanyDriver = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (driverId: string) =>
      services.workflow.removeCompanyDriver(driverId),
    onSuccess: () =>
      client.invalidateQueries({queryKey: ['drivers']}),
  });
};

export const useCompanyDriver = (driverId: string | null) =>
  useQuery({
    queryKey: queryKeys.drivers.detail(driverId ?? ''),
    queryFn: () => services.workflow.getCompanyDriver(driverId!),
    enabled: Boolean(driverId),
  });

export const useUpdateCompanyDriver = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCompanyDriverInput) =>
      services.workflow.updateCompanyDriver(input),
    onSuccess: (_data, input) => {
      client.invalidateQueries({queryKey: ['drivers']});
      client.invalidateQueries({
        queryKey: queryKeys.drivers.detail(input.driverId),
      });
    },
  });
};

export const useMyDriverProfile = (userId: string | null) =>
  useQuery({
    queryKey: ['drivers', 'me', userId ?? ''],
    queryFn: () => services.workflow.repository.getDriver(userId!),
    enabled: Boolean(userId),
  });

export const useUpdateMyVehicle = () => {
  const client = useQueryClient();
  const userId = useUserStore(selectUserId);
  return useMutation({
    mutationFn: (input: UpdateMyVehicleInput) =>
      services.workflow.updateMyVehicle(input),
    onSuccess: () => {
      client.invalidateQueries({queryKey: ['drivers']});
      if (userId) {
        client.invalidateQueries({queryKey: ['drivers', 'me', userId]});
      }
    },
  });
};

export const useReviewDriverApplication = () =>
  useMutation({
    mutationFn: (input: {
      applicationId: string;
      decision: 'approve' | 'reject';
      rejectionReason?: string;
    }) =>
      services.workflow.reviewDriverApplication(
        input.applicationId,
        input.decision,
        input.rejectionReason,
      ),
  });

export const useCompanyEmployees = (
  params?: {
    q?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  },
  enabled = true,
) =>
  useQuery({
    queryKey: ['companyEmployees', params ?? {}],
    queryFn: () => services.workflow.listCompanyEmployees(params ?? {}),
    enabled,
  });

export const useCreateCompanyEmployee = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCompanyEmployeeInput) =>
      services.workflow.createCompanyEmployee(input),
    onSuccess: () =>
      client.invalidateQueries({queryKey: ['companyEmployees']}),
  });
};

export const useUpdateCompanyEmployee = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCompanyEmployeeInput) =>
      services.workflow.updateCompanyEmployee(input),
    onSuccess: () =>
      client.invalidateQueries({queryKey: ['companyEmployees']}),
  });
};

export const useDeleteCompanyEmployee = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (employeeId: string) =>
      services.workflow.deleteCompanyEmployee(employeeId),
    onSuccess: () =>
      client.invalidateQueries({queryKey: ['companyEmployees']}),
  });
};

export const useCompanyClients = (
  params?: {
    q?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  },
  enabled = true,
) =>
  useQuery({
    queryKey: ['companyClients', params ?? {}],
    queryFn: () => services.workflow.listCompanyClients(params ?? {}),
    enabled,
    placeholderData: keepPreviousData,
  });

export const useCompanyMerchants = (
  params?: {
    q?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  },
  enabled = true,
) =>
  useQuery({
    queryKey: ['companyMerchants', params ?? {}],
    queryFn: () => services.workflow.listCompanyMerchants(params ?? {}),
    enabled,
    placeholderData: keepPreviousData,
  });

export const useCreateCompanyClient = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCompanyIssuedAccountInput) =>
      services.workflow.createCompanyClient(input),
    onSuccess: () => client.invalidateQueries({queryKey: ['companyClients']}),
  });
};

export const useCreateCompanyMerchant = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCompanyIssuedAccountInput) =>
      services.workflow.createCompanyMerchant(input),
    onSuccess: () =>
      client.invalidateQueries({queryKey: ['companyMerchants']}),
  });
};

export const useDeleteCompanyClient = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (clientId: string) =>
      services.workflow.deleteCompanyClient(clientId),
    onSuccess: () => client.invalidateQueries({queryKey: ['companyClients']}),
  });
};

export const useDeleteCompanyMerchant = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (merchantId: string) =>
      services.workflow.deleteCompanyMerchant(merchantId),
    onSuccess: () =>
      client.invalidateQueries({queryKey: ['companyMerchants']}),
  });
};

export const useRecordDriverOrderOutcome = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      driverId: string;
      outcome: 'delivered' | 'cancelled';
    }) => services.workflow.recordDriverOrderOutcome(input.driverId, input.outcome),
    onSuccess: () => {
      client.invalidateQueries({queryKey: ['companyDrivers']});
    },
  });
};