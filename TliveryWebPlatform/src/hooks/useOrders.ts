import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {queryKeys} from '../constants/queryKeys';
import type {CreateOrderInput, OrderDto} from '../models/workflow';
import {isOrderInDeliveryTracking} from '../models/tracking.model';
import {workflowService} from '../services/workflowService';

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
  client.setQueriesData<OrderDto[]>({queryKey: queryKeys.orders.lists}, previous => {
    if (!previous) {
      return previous;
    }
    return previous.map(order =>
      order.id === orderId
        ? {...order, status: status as OrderDto['status']}
        : order,
    );
  });
  client.setQueriesData<OrderDto[]>(
    {queryKey: ['orders', 'byAccount']},
    previous => {
      if (!previous) {
        return previous;
      }
      return previous.map(order =>
        order.id === orderId
          ? {...order, status: status as OrderDto['status']}
          : order,
      );
    },
  );
};
export const useOrders = (
  status: string = 'all',
  enabled = true,
  q: string = '',
) => {
  const statusKey = status && status !== 'all' ? status : 'all';
  const searchKey = q.trim();
  return useQuery({
    queryKey: queryKeys.orders.list(statusKey, searchKey),
    queryFn: async () => {
      const result = await workflowService.listOrders({
        pageSize: 100,
        ...(statusKey !== 'all' ? {status: statusKey} : {}),
        ...(searchKey ? {q: searchKey} : {}),
      });
      return result.orders;
    },
    enabled,
    placeholderData: keepPreviousData,
  });
};

export const useAccountOrders = (accountId: string) =>
  useQuery({
    queryKey: queryKeys.orders.byAccount(accountId),
    queryFn: async () => {
      const result = await workflowService.listOrders({
        pageSize: 100,
        accountId,
      });
      return result.orders;
    },
    enabled: Boolean(accountId),
  });

export const useOrder = (orderId: string) =>
  useQuery({
    queryKey: queryKeys.orders.detail(orderId),
    queryFn: async () => {
      const result = await workflowService.getOrder(orderId);
      return result.order;
    },
    enabled: Boolean(orderId),
    refetchInterval: query => {
      const order = query.state.data as OrderDto | undefined;
      return shouldPollOrderStatus(order?.status) ? ACTIVE_ORDER_POLL_MS : false;
    },
  });

export function useCreateOrder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrderInput) => workflowService.createOrder(input),
    onSuccess: () => {
      void client.invalidateQueries({queryKey: queryKeys.orders.lists});
    },
  });
}

export function useAcceptOrder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => workflowService.acceptOrder(orderId),
    onSuccess: result => {
      void client.invalidateQueries({queryKey: queryKeys.orders.lists});
      void client.invalidateQueries({
        queryKey: queryKeys.orders.detail(result.orderId),
      });
    },
  });
}

export function useCancelOrder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => workflowService.cancelOrder(orderId),
    onSuccess: result => {
      void client.invalidateQueries({queryKey: queryKeys.orders.lists});
      void client.invalidateQueries({
        queryKey: queryKeys.orders.detail(result.orderId),
      });
    },
  });
}

export function useAssignDriverToOrder(companyId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: {orderId: string; driverId: string}) =>
      workflowService.assignDriverToOrder(input.orderId, input.driverId),
    onSuccess: result => {
      void client.invalidateQueries({queryKey: queryKeys.orders.lists});
      void client.invalidateQueries({
        queryKey: queryKeys.orders.detail(result.orderId),
      });
      void client.invalidateQueries({queryKey: queryKeys.drivers(companyId)});
      void client.invalidateQueries({queryKey: ['orders', 'byAccount']});
    },
  });
}

export function useUnassignDriverFromOrder(companyId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) =>
      workflowService.unassignDriverFromOrder(orderId),
    onSuccess: result => {
      void client.invalidateQueries({queryKey: queryKeys.orders.lists});
      void client.invalidateQueries({
        queryKey: queryKeys.orders.detail(result.orderId),
      });
      void client.invalidateQueries({queryKey: queryKeys.drivers(companyId)});
    },
  });
}

export function useDeleteOrder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => workflowService.deleteOrder(orderId),
    onSuccess: result => {
      void client.invalidateQueries({queryKey: queryKeys.orders.lists});
      void client.removeQueries({
        queryKey: queryKeys.orders.detail(result.orderId),
      });
    },
  });
}

export function useDriverReceiveOrder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) =>
      workflowService.driverReceiveOrder(orderId),
    onSuccess: result => {
      void client.invalidateQueries({queryKey: queryKeys.orders.lists});
      void client.invalidateQueries({
        queryKey: queryKeys.orders.detail(result.orderId),
      });
      void client.invalidateQueries({queryKey: ['orders', 'byAccount']});
    },
  });
}

export function useDriverDeliverOrder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) =>
      workflowService.driverDeliverOrder(orderId),
    onMutate: async orderId => {
      await client.cancelQueries({queryKey: queryKeys.orders.lists});
      await client.cancelQueries({
        queryKey: queryKeys.orders.detail(orderId),
      });
      const previousDetail = client.getQueryData<OrderDto>(
        queryKeys.orders.detail(orderId),
      );
      patchOrderStatusInLists(client, orderId, 'delivered');
      if (previousDetail) {
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
      void client.invalidateQueries({queryKey: queryKeys.orders.lists});
    },
    onSuccess: result => {
      if (result.order) {
        client.setQueryData(
          queryKeys.orders.detail(result.orderId),
          result.order,
        );
      }
      patchOrderStatusInLists(
        client,
        result.orderId,
        result.status || 'delivered',
      );
      void client.invalidateQueries({queryKey: queryKeys.orders.lists});
      void client.invalidateQueries({
        queryKey: queryKeys.orders.detail(result.orderId),
      });
      void client.invalidateQueries({queryKey: queryKeys.finance.hub});
      void client.invalidateQueries({queryKey: ['finance']});
    },
  });
}
