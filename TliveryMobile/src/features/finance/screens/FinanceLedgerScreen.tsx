import {useEffect, useMemo, useState, type FC} from 'react';
import {FlatList, StyleSheet, TextInput, View} from 'react-native';
import {useRoute, type RouteProp} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import ScreenContainer from '@app/components/screen-container';
import AppText from '@app/components/app-text';
import AppButton from '@app/components/app-button';
import CenterModal from '@app/components/center-modal';
import Column from '@app/components/column';
import Row from '@app/components/row';
import FilterChips from '@app/components/filter-chips';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import {
  selectHasPermission,
  selectIsCompanyStaff,
  useUserStore,
} from '@app/features/user';
import {useAddFinanceEntry, useFinanceLedger} from '@app/hooks/useFinance';
import type {RootStackParamList} from '@app/types/navigation';
import {showToast} from '@app/utils/showToast';
import {ToastType} from '@app/enums/ToastType';
import {cairoFont} from '@app/theme/fonts';
import {fontSize, radius, space} from '@app/theme/tokens';
import {getFlexDirection, getTextAlign} from '@app/utils/directionalStyles';
import {getHeight, getWidth} from '@app/utils/responsive-design';
import ListLoadingFooter from '@app/components/list-loading-footer';
import {
  companyPositionI18nKey,
  debitCreditOf,
  financeTxLabelKey,
  formatFinanceDate,
  formatFinanceFigure,
  formatFinanceFigureOrDash,
  formatFinanceMoney,
  partyDeltaForAction,
  partyPositionI18nKey,
  recommendedCashAction,
  suggestedCollectAmount,
  suggestedPayoutAmount,
  withRunningBalances,
  type FinanceCashAction,
  type FinanceTxType,
} from '../financeModel';
import {financeColors, financeSheet} from '../financeUi';

type LedgerRow = {
  id: string;
  displayAmountJod: number;
  type: FinanceTxType;
  note: string;
  orderReference: string | null;
  createdAt: string | null;
};

const FinanceLedgerScreen: FC = () => {
  const {t} = useTranslation();
  const route = useRoute<
    RouteProp<RootStackParamList, 'FinanceLedger' | 'AccountsHub'>
  >();
  const params =
    route.name === 'FinanceLedger' ? route.params : undefined;
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const isDark = themeType === 'dark';
  const jod = t('jod');
  const ink = financeColors(isDark);
  const isCompanyStaff = useUserStore(selectIsCompanyStaff);
  const canWrite = useUserStore(selectHasPermission('accounts:write'));
  const [pageNumber, setPageNumber] = useState(1);
  const [typeFilter, setTypeFilter] = useState('all');
  const ledgerQuery = useFinanceLedger(
    params
      ? {
          partyUserId: params.partyUserId,
          partyType: params.partyType,
          page: pageNumber,
          pageSize: 25,
        }
      : {page: pageNumber, pageSize: 25},
    true,
  );
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const addEntry = useAddFinanceEntry();
  const [action, setAction] = useState<FinanceCashAction | null>(null);
  const [amountText, setAmountText] = useState('');
  const [note, setNote] = useState('');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        statement: {
          ...financeSheet(theme, isDark),
          borderRadius: radius.md,
          borderTopWidth: 3,
          borderTopColor: ink.gold,
          padding: getWidth(space.md),
          marginBottom: getHeight(space.sm),
          gap: getHeight(6),
        },
        kicker: {
          color: theme.typography.secondary,
          fontSize: 10,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          ...cairoFont('bold'),
          textAlign: getTextAlign(direction),
        },
        balanceValue: {
          fontSize: 28,
          lineHeight: 34,
          ...cairoFont('bold'),
          textAlign: getTextAlign(direction),
        },
        pill: {
          alignSelf: 'flex-start',
          borderRadius: 4,
          paddingHorizontal: 8,
          paddingVertical: 3,
        },
        pillText: {
          fontSize: 11,
          ...cairoFont('bold'),
        },
        hint: {
          color: theme.typography.secondary,
          fontSize: fontSize.caption,
          ...cairoFont('regular'),
          textAlign: getTextAlign(direction),
        },
        recommend: {
          borderRadius: radius.sm,
          padding: getWidth(space.sm),
          marginBottom: getHeight(space.sm),
          borderWidth: 1,
        },
        actions: {
          marginBottom: getHeight(space.sm),
          gap: getHeight(8),
        },
        filters: {
          marginBottom: getHeight(8),
        },
        journal: {
          ...financeSheet(theme, isDark),
          borderRadius: radius.md,
          flex: 1,
          minHeight: 0,
        },
        colHead: {
          flexDirection: getFlexDirection(direction),
          paddingVertical: getHeight(8),
          paddingHorizontal: getWidth(space.sm),
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: ink.hairline,
          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
        },
        colHeadText: {
          fontSize: 10,
          color: theme.typography.secondary,
          ...cairoFont('bold'),
        },
        colMemo: {flex: 1.4, minWidth: 0},
        colAmt: {width: getWidth(58), alignItems: 'flex-end'},
        entry: {
          paddingVertical: getHeight(10),
          paddingHorizontal: getWidth(space.sm),
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: ink.hairline,
          gap: getHeight(4),
        },
        entryTop: {
          flexDirection: getFlexDirection(direction),
          alignItems: 'flex-start',
          gap: getWidth(8),
        },
        memo: {
          color: theme.typography.primary,
          fontSize: fontSize.caption,
          ...cairoFont('medium'),
          textAlign: getTextAlign(direction),
        },
        meta: {
          color: theme.typography.secondary,
          fontSize: 10,
          ...cairoFont('regular'),
          textAlign: getTextAlign(direction),
        },
        typeTick: {
          marginTop: 4,
          width: getWidth(6),
          height: getWidth(6),
          borderRadius: 2,
        },
        amt: {
          fontSize: 11,
          ...cairoFont('bold'),
        },
        empty: {
          color: theme.typography.secondary,
          textAlign: 'center',
          marginTop: getHeight(24),
          ...cairoFont('regular'),
        },
        field: {
          borderWidth: 1,
          borderColor: theme.ui.border,
          borderRadius: radius.md,
          paddingHorizontal: getWidth(space.sm),
          paddingVertical: getHeight(8),
          color: theme.typography.primary,
          fontSize: fontSize.body,
          textAlign: getTextAlign(direction),
          ...cairoFont('medium'),
        },
      }),
    [direction, ink.gold, ink.hairline, isDark, theme],
  );

  const account = ledgerQuery.data?.account;
  const invert = ledgerQuery.data?.invertForViewer ?? false;
  const balance = account?.displayBalanceJod ?? 0;
  const title =
    params?.partyName || account?.partyName || t('financeLedgerTitle');
  const positionKey = invert
    ? companyPositionI18nKey(balance)
    : partyPositionI18nKey(balance);
  const recommended = invert ? recommendedCashAction(balance) : null;
  const settled = Math.abs(balance) < 0.0005;
  const collectTone = invert ? balance > 0 : balance < 0;
  const tone = settled ? ink.settled : collectTone ? ink.debit : ink.credit;
  const soft = settled
    ? ink.settledSoft
    : collectTone
      ? ink.debitSoft
      : ink.creditSoft;

  useEffect(() => {
    if (!ledgerQuery.data) {
      return;
    }
    const pageRows = ledgerQuery.data.transactions;
    if (pageNumber <= 1) {
      setRows(pageRows);
      return;
    }
    setRows(prev => {
      const seen = new Set(prev.map(item => item.id));
      const next = pageRows.filter(item => !seen.has(item.id));
      return next.length ? [...prev, ...next] : prev;
    });
  }, [ledgerQuery.data, pageNumber]);

  const filteredRows =
    typeFilter === 'all'
      ? rows
      : rows.filter(item => item.type === typeFilter);
  const showRunning = typeFilter === 'all';
  const statementRows = showRunning
    ? withRunningBalances(filteredRows, balance)
    : filteredRows.map(row => ({...row, runningBalanceJod: 0}));

  const openAction = (next: FinanceCashAction) => {
    const suggested =
      next === 'collect'
        ? suggestedCollectAmount(balance)
        : next === 'payout'
          ? suggestedPayoutAmount(balance)
          : 0;
    setAmountText(suggested > 0 ? suggested.toFixed(2) : '');
    setNote('');
    setAction(next);
  };

  const onSave = () => {
    if (!params || !action) {
      return;
    }
    const entered = Number.parseFloat(amountText.replace(',', '.'));
    if (!Number.isFinite(entered) || entered === 0) {
      showToast(ToastType.error, t('financeAmountRequired'));
      return;
    }
    if (action !== 'adjustment' && entered < 0) {
      showToast(ToastType.error, t('financeAmountRequired'));
      return;
    }
    const amountJod =
      action === 'adjustment'
        ? entered
        : partyDeltaForAction(action, entered);
    addEntry.mutate(
      {
        partyUserId: params.partyUserId,
        partyType: params.partyType,
        amountJod,
        note: note.trim() || undefined,
        type: action === 'adjustment' ? 'adjustment' : 'settlement',
      },
      {
        onSuccess: () => {
          setAction(null);
          setAmountText('');
          setNote('');
          setPageNumber(1);
          setRows([]);
          const toastKey =
            action === 'collect'
              ? 'financeCollectedToast'
              : action === 'payout'
                ? 'financePaidToast'
                : 'financeEntryAddedToast';
          showToast(ToastType.success, t(toastKey));
        },
        onError: () =>
          showToast(ToastType.error, t('workflowRequestFailed')),
      },
    );
  };

  const modalTitle =
    action === 'collect'
      ? t('financeCollectTitle')
      : action === 'payout'
        ? t('financePayoutTitle')
        : t('financeAdjustTitle');
  const modalHint =
    action === 'collect'
      ? t('financeCollectHint')
      : action === 'payout'
        ? t('financePayoutHint')
        : t('financeAdjustHint');

  return (
    <ScreenContainer
      navTitle={title}
      loading={ledgerQuery.isLoading}
      scrollable={false}
      pullToRefresh={{
        onRefresh: async () => {
          setPageNumber(1);
          setRows([]);
          await ledgerQuery.refetch();
        },
      }}>
      <View style={styles.statement}>
        <AppText style={styles.kicker}>
          {invert
            ? t('financeCompanyBalanceLabel')
            : t('financeYourBalanceLabel')}
        </AppText>
        <AppText style={[styles.balanceValue, {color: tone}]}>
          {formatFinanceMoney(Math.abs(balance), jod)}
        </AppText>
        <View style={[styles.pill, {backgroundColor: soft}]}>
          <AppText style={[styles.pillText, {color: tone}]}>
            {t(positionKey)}
          </AppText>
        </View>
      </View>

      {isCompanyStaff && canWrite && params ? (
        <>
          <View
            style={[
              styles.recommend,
              {backgroundColor: soft, borderColor: tone},
            ]}>
            <AppText style={[styles.hint, {color: tone}]}>
              {recommended === 'collect'
                ? t('financeRecommendCollect', {
                    amount: formatFinanceMoney(
                      suggestedCollectAmount(balance),
                      jod,
                    ),
                  })
                : recommended === 'payout'
                  ? t('financeRecommendPayout', {
                      amount: formatFinanceMoney(
                        suggestedPayoutAmount(balance),
                        jod,
                      ),
                    })
                  : t('financeSettledBanner')}
            </AppText>
          </View>
          <View style={styles.actions}>
            <Row gap={space.sm}>
              <View style={{flex: 1}}>
                <AppButton
                  title={t('financeCollect')}
                  variant="primary"
                  onPress={() => openAction('collect')}
                />
              </View>
              <View style={{flex: 1}}>
                <AppButton
                  title={t('financePayout')}
                  variant="gold"
                  onPress={() => openAction('payout')}
                />
              </View>
            </Row>
            <AppButton
              title={t('financeAdjust')}
              variant="ghost"
              onPress={() => openAction('adjustment')}
            />
          </View>
        </>
      ) : null}

      <View style={styles.filters}>
        <FilterChips
          options={[
            {value: 'all', label: t('financeFilterAll')},
            {value: 'order_delivery', label: t('financeTxDelivery')},
            {value: 'settlement', label: t('financeTxSettlement')},
            {value: 'adjustment', label: t('financeTxAdjustment')},
          ]}
          value={typeFilter}
          onChange={setTypeFilter}
        />
      </View>

      <View style={styles.journal}>
        <View style={styles.colHead}>
          <View style={styles.colMemo}>
            <AppText style={styles.colHeadText}>{t('financeColMemo')}</AppText>
          </View>
          <View style={styles.colAmt}>
            <AppText style={[styles.colHeadText, {color: ink.debit}]}>
              {t('financeColDebit')}
            </AppText>
          </View>
          <View style={styles.colAmt}>
            <AppText style={[styles.colHeadText, {color: ink.credit}]}>
              {t('financeColCredit')}
            </AppText>
          </View>
          {showRunning ? (
            <View style={styles.colAmt}>
              <AppText style={styles.colHeadText}>
                {t('financeColBalance')}
              </AppText>
            </View>
          ) : null}
        </View>
        <FlatList
          data={statementRows}
          keyExtractor={item => item.id}
          style={{flex: 1}}
          contentContainerStyle={{paddingBottom: getHeight(16)}}
          ListEmptyComponent={
            ledgerQuery.isLoading ? null : (
              <AppText style={styles.empty}>{t('financeNoTransactions')}</AppText>
            )
          }
          ListFooterComponent={
            <ListLoadingFooter
              visible={Boolean(
                ledgerQuery.data?.hasMore &&
                  ledgerQuery.isFetching &&
                  pageNumber > 1,
              )}
            />
          }
          onEndReached={() => {
            if (!ledgerQuery.isFetching && ledgerQuery.data?.hasMore) {
              setPageNumber(prev => prev + 1);
            }
          }}
          onEndReachedThreshold={0.2}
          renderItem={({item}) => {
            const {debit, credit} = debitCreditOf(
              item.displayAmountJod,
              invert,
            );
            const tick = debit > 0 ? ink.debit : credit > 0 ? ink.credit : ink.gold;
            return (
              <View style={styles.entry}>
                <View style={styles.entryTop}>
                  <View style={styles.colMemo}>
                    <View
                      style={{
                        flexDirection: getFlexDirection(direction),
                        gap: getWidth(8),
                        alignItems: 'flex-start',
                      }}>
                      <View style={[styles.typeTick, {backgroundColor: tick}]} />
                      <View style={{flex: 1, minWidth: 0}}>
                        <AppText style={styles.memo} numberOfLines={2}>
                          {item.note ||
                            t(
                              financeTxLabelKey(
                                item.type,
                                item.displayAmountJod,
                                invert,
                              ),
                            )}
                        </AppText>
                        <AppText style={styles.meta}>
                          {t(
                            financeTxLabelKey(
                              item.type,
                              item.displayAmountJod,
                              invert,
                            ),
                          )}
                          {item.orderReference ? ` · ${item.orderReference}` : ''}
                          {` · ${formatFinanceDate(item.createdAt)}`}
                        </AppText>
                      </View>
                    </View>
                  </View>
                  <View style={styles.colAmt}>
                    <AppText style={[styles.amt, {color: ink.debit}]}>
                      {formatFinanceFigureOrDash(debit)}
                    </AppText>
                  </View>
                  <View style={styles.colAmt}>
                    <AppText style={[styles.amt, {color: ink.credit}]}>
                      {formatFinanceFigureOrDash(credit)}
                    </AppText>
                  </View>
                  {showRunning ? (
                    <View style={styles.colAmt}>
                      <AppText
                        style={[styles.amt, {color: theme.typography.primary}]}>
                        {formatFinanceFigure(item.runningBalanceJod)}
                      </AppText>
                    </View>
                  ) : null}
                </View>
              </View>
            );
          }}
        />
      </View>

      <CenterModal
        visible={action != null}
        onClose={() => setAction(null)}
        title={modalTitle}>
        <Column gap={space.sm}>
          <AppText variant="caption" tone="secondary">
            {modalHint}
          </AppText>
          <TextInput
            value={amountText}
            onChangeText={setAmountText}
            placeholder={t('financeAmountPlaceholder')}
            placeholderTextColor={theme.typography.secondary}
            keyboardType="decimal-pad"
            style={styles.field}
          />
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={t('financeNotePlaceholder')}
            placeholderTextColor={theme.typography.secondary}
            style={styles.field}
          />
          <AppButton
            title={t('save')}
            loading={addEntry.isPending}
            onPress={onSave}
          />
        </Column>
      </CenterModal>
    </ScreenContainer>
  );
};

export default FinanceLedgerScreen;
