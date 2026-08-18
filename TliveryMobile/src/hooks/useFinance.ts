import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {services} from '@app/services/dependencies';
import {queryKeys} from '@app/constants/queryKeys';

export const useFinanceHub = (enabled = true) =>
  useQuery({
    queryKey: queryKeys.finance.hub,
    queryFn: () => services.workflow.listFinanceHub(),
    enabled,
  });

export const useFinanceParties = (
  params: {
    kind: 'driver' | 'client';
    q?: string;
    page?: number;
    pageSize?: number;
    cursor?: string | null;
  },
  enabled = true,
) =>
  useQuery({
    queryKey: [...queryKeys.finance.parties(params.kind), params],
    queryFn: () => services.workflow.listFinanceParties(params),
    enabled,
  });

export const useFinanceLedger = (
  params?: {
    partyUserId?: string;
    partyType?: 'driver' | 'client';
    page?: number;
    pageSize?: number;
    cursor?: string | null;
  },
  enabled = true,
) =>
  useQuery({
    queryKey:
      params?.partyUserId && params?.partyType
        ? [...queryKeys.finance.ledger(params.partyType, params.partyUserId), params]
        : [...queryKeys.finance.myLedger, params],
    queryFn: () => services.workflow.listFinanceTransactions(params),
    enabled,
  });

export const useAddFinanceEntry = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      partyUserId: string;
      partyType: 'driver' | 'client';
      amountJod: number;
      note?: string;
      type?: 'settlement' | 'adjustment';
    }) => services.workflow.addFinanceEntry(input),
    onSuccess: (_result, variables) => {
      client.invalidateQueries({queryKey: queryKeys.finance.hub});
      client.invalidateQueries({
        queryKey: queryKeys.finance.parties(variables.partyType),
      });
      client.invalidateQueries({
        queryKey: queryKeys.finance.ledger(
          variables.partyType,
          variables.partyUserId,
        ),
      });
    },
  });
};
