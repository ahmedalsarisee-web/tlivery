import {useCallback, useMemo, useState, FC} from 'react';
import {Pressable, Text, TextInput, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {Calendar, Plus, Search} from 'lucide-react-native';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import {
  selectIsCompanyAdmin,
  selectProfileReady,
  selectUserName,
  useUserStore,
} from '@app/features/user';
import {useFleetStore} from '@app/features/company';
import {
  useCompany,
  useCompanyDrivers,
  usePendingDriverApplications,
} from '@app/hooks/useWorkflow';
import {RootStackParamList} from '@app/types/navigation';
import ScreenContainer from '@app/components/screen-container';
import DayMonthPicker from '@app/components/day-month-picker';
import {
  formatChipDate,
  toLocalIsoDate,
} from '@app/utils/calendarDateUtils';
import HomeKpiCards from '../components/home-kpi-cards';
import HomeOverviewCharts from '../components/home-overview-charts';
import HomeRecentOrders from '../components/home-recent-orders';
import {
  deriveCompanyKpis,
  deriveDriverStatusSlices,
  deriveSampleOrderSlices,
  filterSampleOrders,
} from '../data/homeDashboard';
import {homeStyles} from './Home.styles';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HomeScreen: FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const {theme} = useTheme();
  const {direction} = useLanguage();
  const {t, i18n} = useTranslation();
  const userName = useUserStore(selectUserName);
  const isCompanyAdmin = useUserStore(selectIsCompanyAdmin);
  const profileReady = useUserStore(selectProfileReady);
  const companyId = useUserStore(state => state.companyId);
  const canLoadCompanyData = profileReady && isCompanyAdmin;
  const companyQuery = useCompany(canLoadCompanyData ? companyId : null);
  const driversQuery = useCompanyDrivers(canLoadCompanyData ? companyId : null);
  const applicationsQuery = usePendingDriverApplications(
    canLoadCompanyData ? companyId : null,
  );
  const sampleOrders = useFleetStore(state => state.orders);
  const company = companyQuery.data;
  const drivers = useMemo(() => driversQuery.data?.drivers ?? [], [driversQuery.data]);
  const driverTotal = driversQuery.data?.total ?? drivers.length;
  const applications = useMemo(
    () => applicationsQuery.data ?? [],
    [applicationsQuery.data],
  );
  const [query, setQuery] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDayIso, setSelectedDayIso] = useState(() =>
    isCompanyAdmin && sampleOrders[0]
      ? sampleOrders[0].createdAt.slice(0, 10)
      : toLocalIsoDate(new Date()),
  );
  const styles = useMemo(
    () => homeStyles(theme, direction),
    [theme, direction],
  );

  const localeTag = i18n.language?.startsWith('ar') ? 'ar' : 'en';
  const todayIso = toLocalIsoDate(new Date());
  const filterLabel =
    selectedDayIso === todayIso
      ? t('filterToday')
      : formatChipDate(selectedDayIso, localeTag);

  const goCreate = () =>
    navigation.navigate(isCompanyAdmin ? 'Orders' : 'CreateOrder');
  const goOrders = () => navigation.navigate('Orders');
  const companyKpis = useMemo(
    () =>
      deriveCompanyKpis(
        drivers,
        applications,
        company?.maxDrivers ?? driverTotal,
        sampleOrders,
      ),
    [applications, company?.maxDrivers, drivers, sampleOrders],
  );
  const driverSlices = useMemo(
    () => deriveDriverStatusSlices(drivers),
    [drivers],
  );
  const sampleOrderSlices = useMemo(
    () => deriveSampleOrderSlices(sampleOrders),
    [sampleOrders],
  );
  const filteredSampleOrders = useMemo(
    () => filterSampleOrders(sampleOrders, query, selectedDayIso),
    [query, sampleOrders, selectedDayIso],
  );
  const companyDataLoading =
    companyQuery.isLoading ||
    driversQuery.isLoading ||
    applicationsQuery.isLoading;
  const companyDataError =
    companyQuery.isError ||
    driversQuery.isError ||
    applicationsQuery.isError;

  const onSelectDay = useCallback((iso: string) => {
    setSelectedDayIso(iso);
  }, []);

  const onRefresh = useCallback(async () => {
    if (!canLoadCompanyData) {
      return;
    }
    await Promise.all([
      companyQuery.refetch(),
      driversQuery.refetch(),
      applicationsQuery.refetch(),
    ]);
  }, [applicationsQuery, canLoadCompanyData, companyQuery, driversQuery]);

  return (
    <ScreenContainer
      padded={false}
      navVariant="brand"
      contentContainerStyle={styles.homeScroll}
      loading={isCompanyAdmin && companyDataLoading}
      pullToRefresh={canLoadCompanyData ? {onRefresh} : undefined}>
      <View style={styles.body}>
        <View>
          <Text style={styles.greeting}>
            {isCompanyAdmin
              ? t('homeGreetingCompany', {name: userName ?? ''})
              : t('homeGreeting')}
          </Text>
          <Text style={styles.greetingSub}>
            {isCompanyAdmin
              ? t('homeGreetingSubCompany', {
                  company: company?.name ?? '',
                })
              : t('homeGreetingSub')}
          </Text>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Search
              size={18}
              color={theme.typography.caption}
              strokeWidth={2}
            />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t(
                isCompanyAdmin
                  ? 'dashboardSearchSampleOrders'
                  : 'homeSearchPlaceholder',
              )}
              placeholderTextColor={theme.typography.caption}
              style={styles.searchInput}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={goCreate}
            style={styles.newOrderBtn}>
            <Plus size={16} color={theme.base.white} strokeWidth={2.5} />
            <Text style={styles.newOrderText}>
              {t(isCompanyAdmin ? 'dashboardManageOrders' : 'newOrder')}
            </Text>
          </Pressable>
        </View>

        {isCompanyAdmin && companyDataLoading ? (
          <Text style={styles.dashboardStateText}>{t('loading')}</Text>
        ) : null}
        {isCompanyAdmin && companyDataError ? (
          <Text style={styles.dashboardErrorText}>
            {t('dashboardLiveDataError')}
          </Text>
        ) : null}

        <HomeKpiCards
          companyKpis={isCompanyAdmin ? companyKpis : undefined}
        />

        <View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('overview')}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('dayMonthPickerTitle')}
              onPress={() => setCalendarOpen(true)}
              style={styles.filterChip}>
              <Calendar
                size={14}
                color={theme.typography.secondary}
                strokeWidth={2}
              />
              <Text style={styles.filterText}>{filterLabel}</Text>
            </Pressable>
          </View>
          <HomeOverviewCharts
            driverSlices={isCompanyAdmin ? driverSlices : undefined}
            sampleOrderSlices={
              isCompanyAdmin ? sampleOrderSlices : undefined
            }
            driverTotal={driverTotal}
            sampleOrderTotal={sampleOrders.length}
          />
        </View>

        <HomeRecentOrders
          onViewAll={goOrders}
          onOrderPress={orderId => {
            if (isCompanyAdmin) {
              navigation.navigate('OrderDetails', {orderId});
              return;
            }
            navigation.navigate('Orders');
          }}
          orders={isCompanyAdmin ? filteredSampleOrders : undefined}
          isSample={isCompanyAdmin}
        />
      </View>

      <DayMonthPicker
        visible={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        selectedIso={selectedDayIso}
        onSelectDay={onSelectDay}
      />
    </ScreenContainer>
  );
};

export default HomeScreen;
