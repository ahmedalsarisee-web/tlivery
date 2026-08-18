import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {queryKeys} from '../constants/queryKeys';
import {workflowService} from '../services/workflowService';

export const useFinanceHub = (enabled = true) =>
  useQuery({
    queryKey: queryKeys.finance.hub,
    queryFn: () => workflowService.listFinanceHub(),
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
    queryFn: () => workflowService.listFinanceParties(params),
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
    queryFn: () => workflowService.listFinanceTransactions(params),
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
    }) => workflowService.addFinanceEntry(input),
    onSuccess: (_result, variables) => {
      void client.invalidateQueries({queryKey: queryKeys.finance.hub});
      void client.invalidateQueries({
        queryKey: queryKeys.finance.parties(variables.partyType),
      });
      void client.invalidateQueries({
        queryKey: queryKeys.finance.ledger(
          variables.partyType,
          variables.partyUserId,
        ),
      });
    },
  });
};
