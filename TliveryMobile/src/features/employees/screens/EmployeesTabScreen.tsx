import {useCallback, useEffect, useMemo, useRef, useState, type FC} from 'react';
import {FlatList, Platform, Pressable, StyleSheet, View} from 'react-native';
import {useIsFocused, useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Plus, Users} from 'lucide-react-native';
import {useTheme} from '@app/providers/ThemeContext';
import type {RootStackParamList} from '@app/types/navigation';
import {useCompanyEmployees} from '@app/hooks/useWorkflow';
import type {CompanyEmployee} from '@app/models/workflow.model';
import ScreenContainer from '@app/components/screen-container';
import AppText from '@app/components/app-text';
import EmptyState from '@app/components/empty-state';
import WaselMark from '@app/components/wasel-mark';
import ListLoadingFooter from '@app/components/list-loading-footer';
import EmployeeCard from '@app/components/employee-card';
import ListScreenHeader from '@app/components/list-screen-header';
import {AppRefreshControl} from '@app/components/app-refresh-control';
import {usePullToRefresh} from '@app/hooks/usePullToRefresh';
import {useListQueryState} from '@app/hooks/useListQueryState';
import {useDebouncedValue} from '@app/hooks/useDebouncedValue';
import {useScreenListInsets} from '@app/hooks/useScreenListInsets';
import {useSafeListEndReached} from '@app/hooks/useSafeListEndReached';
import {TAB_BAR_HEIGHT} from '@app/navigation/components/main-tab-bar/styles';
import {cairoFont} from '@app/theme/fonts';
import {fontSize, space} from '@app/theme/tokens';
import {getHeight, getWidth} from '@app/utils/responsive-design';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SEARCH_DEBOUNCE_MS = 400;

const EmployeesTabScreen: FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation<Nav>();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const {theme, themeType} = useTheme();
  const listInsets = useScreenListInsets();
  const isDark = themeType === 'dark';
  const accent = isDark ? theme.brand.gold : theme.brand.navy;
  const onAccent = isDark ? theme.brand.navy : theme.base.white;
  const fabBottom =
    TAB_BAR_HEIGHT +
    (Platform.OS === 'android' ? 8 : Math.max(insets.bottom, 8)) +
    getHeight(10);
  const fabStyles = useMemo(
    () =>
      StyleSheet.create({
        fab: {
          position: 'absolute',
          alignItems: 'center',
          gap: getHeight(4),
          zIndex: 30,
        },
        fabCircle: {
          width: getWidth(56),
          height: getWidth(56),
          borderRadius: getWidth(28),
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: accent,
          shadowColor: '#000',
          shadowOpacity: isDark ? 0.4 : 0.18,
          shadowRadius: 10,
          shadowOffset: {width: 0, height: 4},
          elevation: 8,
        },
        fabLabel: {
          fontSize: fontSize.caption,
          color: theme.typography.primary,
          ...cairoFont('bold'),
          textAlign: 'center',
          textShadowColor: isDark
            ? 'rgba(0,0,0,0.55)'
            : 'rgba(255,255,255,0.9)',
          textShadowOffset: {width: 0, height: 1},
          textShadowRadius: 3,
        },
      }),
    [accent, isDark, theme.typography.primary],
  );

  const filters = useListQueryState(10);
  const debouncedQ = useDebouncedValue(filters.state.q, SEARCH_DEBOUNCE_MS);
  const employeeParams = useMemo(
    () => ({
      q: debouncedQ.trim() || undefined,
      status:
        filters.state.status !== 'all' ? filters.state.status : undefined,
      page: filters.state.page,
      pageSize: filters.state.pageSize,
    }),
    [
      debouncedQ,
      filters.state.page,
      filters.state.pageSize,
      filters.state.status,
    ],
  );
  const employees = useCompanyEmployees(employeeParams, isFocused);
  const [rows, setRows] = useState<CompanyEmployee[]>([]);
  const filterKeyRef = useRef(
    `${debouncedQ}|${filters.state.status}|${filters.state.pageSize}`,
  );

  const page = employees.data;
  const hasMore = page?.hasMore ?? false;

  useEffect(() => {
    const key = `${debouncedQ}|${filters.state.status}|${filters.state.pageSize}`;
    if (key !== filterKeyRef.current) {
      filterKeyRef.current = key;
      setRows([]);
    }
  }, [debouncedQ, filters.state.pageSize, filters.state.status]);

  useEffect(() => {
    if (!page) {
      return;
    }
    if ((page.page ?? 1) <= 1) {
      setRows(page.employees);
      return;
    }
    setRows(prev => {
      const seen = new Set(prev.map(item => item.id));
      const next = page.employees.filter(item => !seen.has(item.id));
      return next.length ? [...prev, ...next] : prev;
    });
  }, [page]);

  const onRefreshData = useCallback(async () => {
    filters.setPage(1);
    await employees.refetch();
  }, [employees, filters]);

  const {refreshing, onRefresh} = usePullToRefresh({
    onRefresh: onRefreshData,
  });

  const statusOptions = useMemo(
    () => [
      {value: 'all', label: t('filterAll')},
      {value: 'active', label: t('employeeStatus_active')},
      {value: 'suspended', label: t('employeeStatus_suspended')},
      {value: 'disabled', label: t('employeeStatus_disabled')},
    ],
    [t],
  );

  const onEndReachedLoad = useCallback(() => {
    if (employees.isFetching) {
      return;
    }
    filters.loadMore(hasMore);
  }, [employees.isFetching, filters, hasMore]);

  const {
    onEndReached,
    onScrollBeginDrag,
    onEndReachedThreshold,
  } = useSafeListEndReached(onEndReachedLoad, hasMore);

  const listHeader = (
    <ListScreenHeader
      search={{
        value: filters.state.q,
        onChangeText: filters.setQuery,
        placeholder: t('searchEmployeesPlaceholder'),
      }}
      filters={{
        options: statusOptions,
        value: filters.state.status,
        onChange: filters.setStatus,
      }}
      countLabel={t('employeesCount', {
        count: page?.total ?? rows.length,
      })}
      showClear={Boolean(filters.state.q || filters.state.status !== 'all')}
      onClearFilters={filters.reset}
      error={employees.isError ? t('workflowRequestFailed') : null}
    />
  );

  const renderItem = useCallback(
    ({item}: {item: CompanyEmployee}) => (
      <EmployeeCard
        employee={item}
        onPress={() =>
          navigation.navigate('EmployeeDetails', {employeeId: item.id})
        }
      />
    ),
    [navigation],
  );

  return (
    <ScreenContainer
      navTitle={t('navEmployees')}
      scrollable={false}
      padded={false}
      bottomInset={false}
      refreshing={refreshing}
      loading={employees.isLoading && rows.length === 0}>
      <FlatList
        data={rows}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          employees.isError ? null : (
            <EmptyState
              illustration={
                filters.state.q || filters.state.status !== 'all' ? (
                  <Users size={56} color={theme.brand.gold} strokeWidth={1.4} />
                ) : (
                  <WaselMark size={72} />
                )
              }
              title={t('emptyEmployeesTitle')}
              description={
                filters.state.q || filters.state.status !== 'all'
                  ? t('emptyEmployeesFiltered')
                  : t('emptyEmployeesDesc')
              }
              actionTitle={
                filters.state.q || filters.state.status !== 'all'
                  ? t('clearFilters')
                  : t('addEmployee')
              }
              onAction={
                filters.state.q || filters.state.status !== 'all'
                  ? filters.reset
                  : () => navigation.navigate('AddEmployee')
              }
              actionVariant="gold"
            />
          )
        }
        ListFooterComponent={
          <ListLoadingFooter
            visible={Boolean(
              hasMore && employees.isFetching && page && (page.page ?? 1) > 1,
            )}
          />
        }
        ItemSeparatorComponent={() => (
          <View style={{height: getHeight(space.md)}} />
        )}
        onEndReached={onEndReached}
        onEndReachedThreshold={onEndReachedThreshold}
        onScrollBeginDrag={onScrollBeginDrag}
        refreshControl={
          <AppRefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            progressViewOffset={listInsets.progressViewOffset}
          />
        }
        showsVerticalScrollIndicator={false}
        style={styles.flex}
        contentContainerStyle={{
          paddingTop: listInsets.paddingTop,
          paddingBottom: listInsets.paddingBottom + getHeight(88),
          paddingHorizontal: listInsets.paddingHorizontal,
          ...(rows.length === 0 ? {flexGrow: 1} : null),
        }}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('addEmployee')}
        onPress={() => navigation.navigate('AddEmployee')}
        style={[
          fabStyles.fab,
          {
            end: getWidth(16),
            bottom: fabBottom,
          },
        ]}>
        <View style={fabStyles.fabCircle}>
          <Plus size={26} color={onAccent} strokeWidth={2.6} />
        </View>
        <AppText style={fabStyles.fabLabel} numberOfLines={1}>
          {t('addEmployee')}
        </AppText>
      </Pressable>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  flex: {flex: 1},
});

export default EmployeesTabScreen;
