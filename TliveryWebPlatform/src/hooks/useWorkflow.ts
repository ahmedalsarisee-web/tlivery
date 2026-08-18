import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {queryKeys} from '../constants/queryKeys';
import {workflowRepository} from '../repositories/WorkflowRepository';
import {workflowService} from '../services/workflowService';

export const useCompanyApplications = () =>
  useQuery({
    queryKey: queryKeys.companyApplications,
    queryFn: workflowRepository.listCompanyApplications,
  });

export const useCompanies = () =>
  useQuery({
    queryKey: queryKeys.companies,
    queryFn: workflowRepository.listCompanies,
  });

export const useMyCompanyApplication = (uid: string) =>
  useQuery({
    queryKey: queryKeys.myCompanyApplication(uid),
    queryFn: () => workflowRepository.getMyCompanyApplication(uid),
    enabled: Boolean(uid),
  });

export function useSubmitCompanyApplication(uid: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: workflowService.submitCompanyApplication,
    onSuccess: () =>
      client.invalidateQueries({queryKey: queryKeys.myCompanyApplication(uid)}),
  });
}

export function useReviewCompanyApplication() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      decision,
      note,
    }: {
      id: string;
      decision: 'approved' | 'rejected';
      note?: string;
    }) => workflowService.reviewCompanyApplication(id, decision, note),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({queryKey: queryKeys.companyApplications}),
        client.invalidateQueries({queryKey: queryKeys.companies}),
      ]);
    },
  });
}

export const useDrivers = (
  companyId: string,
  params?: {q?: string; status?: string; page?: number; pageSize?: number; cursor?: string | null},
) => {
  const searchQ = params?.q?.trim() ?? '';
  const status =
    params?.status && params.status !== 'all' ? params.status : 'all';
  return useQuery({
    queryKey: [
      ...queryKeys.drivers(companyId, searchQ, status),
      params?.page ?? 1,
      params?.pageSize ?? 20,
      params?.cursor ?? null,
    ],
    queryFn: async () => {
      const result = await workflowService.listCompanyDrivers({
        q: searchQ || undefined,
        status: status !== 'all' ? status : undefined,
        page: params?.page,
        pageSize: params?.pageSize,
        cursor: params?.cursor ?? undefined,
      });
      return {
        drivers: result.drivers,
        total: result.total ?? result.drivers.length,
        page: result.page ?? params?.page ?? 1,
        pageSize: result.pageSize ?? params?.pageSize ?? result.drivers.length,
        hasMore: Boolean(result.hasMore),
        nextCursor: result.nextCursor ?? null,
      };
    },
    enabled: Boolean(companyId),
    placeholderData: keepPreviousData,
  });
};
export const useDriverInvites = (companyId: string) =>
  useQuery({
    queryKey: queryKeys.driverInvites(companyId),
    queryFn: async () => {
      const result = await workflowService.listCompanyDriverInvites();
      return result.invites;
    },
    enabled: Boolean(companyId),
  });

export const useDriverApplications = (companyId: string) =>
  useQuery({
    queryKey: queryKeys.driverApplications(companyId),
    queryFn: () => workflowRepository.listDriverApplications(companyId),
    enabled: Boolean(companyId),
  });

export function useCreateDriverInvite(companyId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: workflowService.createDriverInvite,
    onSuccess: () =>
      client.invalidateQueries({queryKey: queryKeys.driverInvites(companyId)}),
  });
}

export function useClientInvites(companyId: string) {
  return useQuery({
    queryKey: queryKeys.clientInvites(companyId),
    queryFn: async () => {
      const result = await workflowService.listCompanyClientInvites();
      return result.invites;
    },
    enabled: Boolean(companyId),
  });
}

export function useCreateClientInvite(companyId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: workflowService.createClientInvite,
    onSuccess: () =>
      client.invalidateQueries({queryKey: queryKeys.clientInvites(companyId)}),
  });
}

export function useRevokeClientInvite(companyId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (inviteCode: string) =>
      workflowService.revokeClientInvite(inviteCode),
    onSuccess: () =>
      client.invalidateQueries({queryKey: queryKeys.clientInvites(companyId)}),
  });
}

export function useRevokeDriverInvite(companyId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (inviteCode: string) =>
      workflowService.revokeDriverInvite(inviteCode),
    onSuccess: () =>
      client.invalidateQueries({queryKey: queryKeys.driverInvites(companyId)}),
  });
}

export function useRemoveCompanyDriver(companyId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (driverId: string) =>
      workflowService.removeCompanyDriver(driverId),
    onSuccess: () =>
      client.invalidateQueries({queryKey: queryKeys.drivers(companyId)}),
  });
}

export const useCompanyDriver = (driverId: string) =>
  useQuery({
    queryKey: queryKeys.driverDetail(driverId),
    queryFn: async () => {
      const result = await workflowService.getCompanyDriver(driverId);
      return result.driver;
    },
    enabled: Boolean(driverId),
  });

export function useUpdateCompanyDriver(companyId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: workflowService.updateCompanyDriver,
    onSuccess: (_data, input) => {
      void client.invalidateQueries({queryKey: queryKeys.drivers(companyId)});
      void client.invalidateQueries({
        queryKey: queryKeys.driverDetail(input.driverId),
      });
    },
  });
}

export function useReviewDriverApplication(companyId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      decision,
      note,
    }: {
      id: string;
      decision: 'approved' | 'rejected';
      note?: string;
    }) => workflowService.reviewDriverApplication(id, decision, note),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({
          queryKey: queryKeys.driverApplications(companyId),
        }),
        client.invalidateQueries({queryKey: queryKeys.drivers(companyId)}),
      ]);
    },
  });
}

export const useCompanyEmployees = (
  companyId: string,
  params?: {q?: string; status?: string; page?: number; pageSize?: number},
) =>
  useQuery({
    queryKey: [...queryKeys.employees(companyId), params ?? {}],
    queryFn: () => workflowService.listCompanyEmployees(params ?? {}),
    enabled: Boolean(companyId),
  });

export function useCreateCompanyEmployee(companyId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: workflowService.createCompanyEmployee,
    onSuccess: () =>
      client.invalidateQueries({queryKey: queryKeys.employees(companyId)}),
  });
}

export function useUpdateCompanyEmployee(companyId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: workflowService.updateCompanyEmployee,
    onSuccess: () =>
      client.invalidateQueries({queryKey: queryKeys.employees(companyId)}),
  });
}

export function useDeleteCompanyEmployee(companyId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: workflowService.deleteCompanyEmployee,
    onSuccess: () =>
      client.invalidateQueries({queryKey: queryKeys.employees(companyId)}),
  });
}

export const useCompanyMerchants = (
  companyId: string,
  params?: {q?: string; status?: string; page?: number; pageSize?: number},
  enabled = true,
) =>
  useQuery({
    queryKey: [...queryKeys.merchants(companyId), params ?? {}],
    queryFn: () => workflowService.listCompanyMerchants(params ?? {}),
    enabled: Boolean(companyId) && enabled,
  });

export const useCompanyClients = (
  companyId: string,
  params?: {q?: string; status?: string; page?: number; pageSize?: number},
  enabled = true,
) =>
  useQuery({
    queryKey: [...queryKeys.clients(companyId), params ?? {}],
    queryFn: () => workflowService.listCompanyClients(params ?? {}),
    enabled: Boolean(companyId) && enabled,
  });

export function useCreateCompanyMerchant(companyId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: workflowService.createCompanyMerchant,
    onSuccess: () =>
      client.invalidateQueries({queryKey: queryKeys.merchants(companyId)}),
  });
}

export function useCreateCompanyClient(companyId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: workflowService.createCompanyClient,
    onSuccess: () =>
      client.invalidateQueries({queryKey: queryKeys.clients(companyId)}),
  });
}

export function useDeleteCompanyMerchant(companyId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: workflowService.deleteCompanyMerchant,
    onSuccess: () =>
      client.invalidateQueries({queryKey: queryKeys.merchants(companyId)}),
  });
}

export function useDeleteCompanyClient(companyId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: workflowService.deleteCompanyClient,
    onSuccess: () =>
      client.invalidateQueries({queryKey: queryKeys.clients(companyId)}),
  });
}
