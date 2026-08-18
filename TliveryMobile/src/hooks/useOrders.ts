import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {queryKeys} from '@app/constants/queryKeys';
import {services} from '@app/services/dependencies';
import {
  selectCanManageOrders,
  selectIsCompanyStaff,
  selectProfileReady,
  selectUserCompanyId,
  selectUserRole,
  useUserStore,
} from '@app/features/user';
import type {CreateOrderInput, WaselOrder} from '@app/features/orders/types';
import {isOrderInDeliveryTracking} from '@app/models/tracking.model';

const ACTIVE_ORDER_POLL_MS = 4_000;

const shouldPollOrderStatus = (status?: string): boolean => {
  if (!status) {
    return false;
  }
  return (
    isOrderInDeliveryTracking(status) ||
    status === 'driverAssigned' ||
    status === 'companyAccepted'
  );
};

const patchOrderStatusInLists = (
  client: ReturnType<typeof useQueryClient>,
  orderId: string,
  status: string,
) => {
  client.setQueriesData<{
    orders: Array<{id: string; status: string}>;
    total: number;
  }>({queryKey: queryKeys.orders.lists}, previous => {
    if (!previous) {
      return previous;
    }
    return {
      ...previous,
      orders: previous.orders.map(order =>
        order.id === orderId ? {...order, status} : order,
      ),
    };
  });
  client.setQueriesData<{
    orders: Array<{id: string; status: string}>;
    total?: number;
  }>({queryKey: ['orders', 'byAccount']}, previous => {
    if (!previous?.orders) {
      return previous;
    }
    return {
      ...previous,
      orders: previous.orders.map(order =>
        order.id === orderId ? {...order, status} : order,
      ),
    };
  });
};
export const useOrders = (
  status: string = 'all',
  q: string = '',
  enabled = true,
) => {
  const profileReady = useUserStore(selectProfileReady);
  const role = useUserStore(selectUserRole);
  const canList =
    profileReady &&
    (role === 'client' ||
      role === 'merchant' ||
      role === 'driver' ||
      role === 'company_admin' ||
      role === 'company_employee');
  const statusKey = status && status !== 'all' ? status : 'all';
  const searchKey = q.trim();

  return useQuery({
    queryKey: queryKeys.orders.list(statusKey, searchKey),
    queryFn: () =>
      services.workflow.listOrders(
        50,
        undefined,
        statusKey === 'all' ? undefined : statusKey,
        searchKey || undefined,
      ),
    enabled: enabled && canList,
    retry: 1,
    placeholderData: keepPreviousData,
  });
};

export const useAccountOrders = (accountId: string | null) => {
  const profileReady = useUserStore(selectProfileReady);
  const isCompanyStaff = useUserStore(selectIsCompanyStaff);
  return useQuery({
    queryKey: queryKeys.orders.byAccount(accountId ?? ''),
    queryFn: () => services.workflow.listOrders(100, accountId!),
    enabled: profileReady && isCompanyStaff && Boolean(accountId),
    retry: 1,
  });
};

export const useOrder = (orderId: string | null) => {
  const profileReady = useUserStore(selectProfileReady);
  return useQuery({
    queryKey: queryKeys.orders.detail(orderId ?? ''),
    queryFn: () => services.workflow.getOrder(orderId!),
    enabled: profileReady && Boolean(orderId),
    retry: 1,
    refetchInterval: query => {
      const order = query.state.data as WaselOrder | undefined;
      return shouldPollOrderStatus(order?.status) ? ACTIVE_ORDER_POLL_MS : false;
    },
  });
};

export const useCreateOrder = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrderInput) => services.workflow.createOrder(input),
    onSuccess: () => {
      client.invalidateQueries({queryKey: queryKeys.orders.lists});
    },
  });
};

export const useAcceptOrder = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => services.workflow.acceptOrder(orderId),
    onSuccess: result => {
      client.invalidateQueries({queryKey: queryKeys.orders.lists});
      client.invalidateQueries({
        queryKey: queryKeys.orders.detail(result.orderId),
      });
    },
  });
};

export const useCancelOrder = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => services.workflow.cancelOrder(orderId),
    onSuccess: result => {
      client.invalidateQueries({queryKey: queryKeys.orders.lists});
      client.invalidateQueries({
        queryKey: queryKeys.orders.detail(result.orderId),
      });
    },
  });
};

export const useAssignDriverToOrder = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: {orderId: string; driverId: string}) =>
      services.workflow.assignDriverToOrder(input.orderId, input.driverId),
    onSuccess: result => {
      client.invalidateQueries({queryKey: queryKeys.orders.lists});
      client.invalidateQueries({
        queryKey: queryKeys.orders.detail(result.orderId),
      });
      client.invalidateQueries({queryKey: ['orders', 'byAccount']});
      client.invalidateQueries({queryKey: ['companyDrivers']});
    },
  });
};

export const useUnassignDriverFromOrder = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) =>
      services.workflow.unassignDriverFromOrder(orderId),
    onSuccess: result => {
      client.invalidateQueries({queryKey: queryKeys.orders.lists});
      client.invalidateQueries({
        queryKey: queryKeys.orders.detail(result.orderId),
      });
      client.invalidateQueries({queryKey: ['companyDrivers']});
    },
  });
};

export const useDeleteOrder = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => services.workflow.deleteOrder(orderId),
    onSuccess: result => {
      client.invalidateQueries({queryKey: queryKeys.orders.lists});
      client.removeQueries({
        queryKey: queryKeys.orders.detail(result.orderId),
      });
      client.invalidateQueries({queryKey: ['companyDrivers']});
    },
  });
};

export const useDriverReceiveOrder = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) =>
      services.workflow.driverReceiveOrder(orderId),
    onMutate: async orderId => {
      await client.cancelQueries({queryKey: queryKeys.orders.lists});
      await client.cancelQueries({
        queryKey: queryKeys.orders.detail(orderId),
      });
      const previousDetail = client.getQueryData(queryKeys.orders.detail(orderId));

      patchOrderStatusInLists(client, orderId, 'driverAssigned');
      if (previousDetail && typeof previousDetail === 'object') {
        client.setQueryData(queryKeys.orders.detail(orderId), {
          ...previousDetail,
          status: 'driverAssigned',
        });
      }
      return {previousDetail, orderId};
    },
    onError: (_error, orderId, context) => {
      if (context?.previousDetail) {
        client.setQueryData(
          queryKeys.orders.detail(orderId),
          context.previousDetail,
        );
      }
      client.invalidateQueries({queryKey: queryKeys.orders.lists});
    },
    onSettled: result => {
      const orderId = result?.orderId;
      client.invalidateQueries({queryKey: queryKeys.orders.lists});
      client.invalidateQueries({queryKey: ['orders', 'byAccount']});
      if (orderId) {
        client.invalidateQueries({
          queryKey: queryKeys.orders.detail(orderId),
        });
      }
    },
  });
};

export const useDriverDeliverOrder = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) =>
      services.workflow.driverDeliverOrder(orderId),
    onMutate: async orderId => {
      await client.cancelQueries({queryKey: queryKeys.orders.lists});
      await client.cancelQueries({
        queryKey: queryKeys.orders.detail(orderId),
      });
      const previousDetail = client.getQueryData(
        queryKeys.orders.detail(orderId),
      );

      patchOrderStatusInLists(client, orderId, 'delivered');
      if (previousDetail && typeof previousDetail === 'object') {
        client.setQueryData(queryKeys.orders.detail(orderId), {
          ...previousDetail,
          status: 'delivered',
        });
      }
      return {previousDetail, orderId};
    },
    onError: (_error, orderId, context) => {
      if (context?.previousDetail) {
        client.setQueryData(
          queryKeys.orders.detail(orderId),
          context.previousDetail,
        );
      }
      client.invalidateQueries({queryKey: queryKeys.orders.lists});
      client.invalidateQueries({queryKey: ['orders', 'byAccount']});
    },
    onSuccess: result => {
      if (result.order) {
        client.setQueryData(
          queryKeys.orders.detail(result.orderId),
          result.order,
        );
      } else {
        client.setQueryData(
          queryKeys.orders.detail(result.orderId),
          (previous: WaselOrder | undefined) =>
            previous
              ? {...previous, status: (result.status as WaselOrder['status']) || 'delivered'}
              : previous,
        );
      }
      patchOrderStatusInLists(
        client,
        result.orderId,
        result.status || 'delivered',
      );
      client.invalidateQueries({queryKey: queryKeys.orders.lists});
      client.invalidateQueries({
        queryKey: queryKeys.orders.detail(result.orderId),
      });
      client.invalidateQueries({queryKey: ['orders', 'byAccount']});
      client.invalidateQueries({queryKey: ['finance']});
      client.invalidateQueries({queryKey: ['companyDrivers']});
    },
  });
};

export const useCanCreateOrder = () => {
  const profileReady = useUserStore(selectProfileReady);
  const role = useUserStore(selectUserRole);
  const companyId = useUserStore(selectUserCompanyId);
  const canManageOrders = useUserStore(selectCanManageOrders);
  const isCompanyStaff = useUserStore(selectIsCompanyStaff);
  if (!profileReady) {
    return false;
  }
  if (role === 'client' || role === 'merchant') {
    return Boolean(companyId);
  }
  return isCompanyStaff && canManageOrders;
};
