import {useMemo, FC} from 'react';
import {ScrollView, Text, View} from 'react-native';
import {
  ArrowUpRight,
  ClipboardList,
  PackageCheck,
  Truck,
  UsersRound,
  Wallet,
} from 'lucide-react-native';
import {useTranslation} from 'react-i18next';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import {
  HOME_KPIS,
  type CompanyDashboardKpi,
  type CompanyKpiId,
  type HomeKpiId,
} from '../../data/homeDashboard';
import {homeStyles} from '../../screens/Home.styles';

const iconFor = (id: HomeKpiId, color: string) => {
  const props = {size: 16, color, strokeWidth: 2} as const;
  switch (id) {
    case 'revenue':
      return <Wallet {...props} />;
    case 'todayOrders':
      return <ClipboardList {...props} />;
    case 'inDelivery':
      return <Truck {...props} />;
    case 'delivered':
      return <PackageCheck {...props} />;
  }
};

const companyIconFor = (id: CompanyKpiId, color: string) => {
  const props = {size: 16, color, strokeWidth: 2} as const;
  switch (id) {
    case 'activeDrivers':
      return <Truck {...props} />;
    case 'pendingDriverApplications':
      return <ClipboardList {...props} />;
    case 'driverCapacity':
      return <UsersRound {...props} />;
    case 'sampleOrders':
      return <PackageCheck {...props} />;
  }
};

interface Props {
  companyKpis?: CompanyDashboardKpi[];
}

const HomeKpiCards: FC<Props> = ({companyKpis}) => {
  const {theme} = useTheme();
  const {direction} = useLanguage();
  const {t} = useTranslation();
  const styles = useMemo(
    () => homeStyles(theme, direction),
    [theme, direction],
  );

  const valueColor = (id: HomeKpiId) => {
    switch (id) {
      case 'revenue':
      case 'inDelivery':
        return theme.brand.gold;
      case 'delivered':
        return theme.status.success;
      default:
        return theme.typography.primary;
    }
  };

  const iconBg = (id: HomeKpiId) => {
    switch (id) {
      case 'revenue':
        return `${theme.brand.gold}22`;
      case 'todayOrders':
        return `${theme.status.info}22`;
      case 'inDelivery':
        return `${theme.brand.gold}22`;
      case 'delivered':
        return `${theme.status.success}22`;
    }
  };

  const iconColor = (id: HomeKpiId) => {
    switch (id) {
      case 'revenue':
      case 'inDelivery':
        return theme.brand.gold;
      case 'todayOrders':
        return theme.status.info;
      case 'delivered':
        return theme.status.success;
    }
  };

  if (companyKpis) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.kpiScroll}>
        {companyKpis.map(kpi => {
          const isSample = kpi.id === 'sampleOrders';
          const color = isSample ? theme.brand.gold : theme.status.info;
          return (
            <View key={kpi.id} style={styles.kpiCard}>
              <View style={styles.kpiTop}>
                <Text style={styles.kpiLabel}>
                  {t(`companyKpi_${kpi.id}`)}
                </Text>
                <View
                  style={[
                    styles.kpiIconWrap,
                    {backgroundColor: `${color}22`},
                  ]}>
                  {companyIconFor(kpi.id, color)}
                </View>
              </View>
              <Text style={[styles.kpiValue, {color}]}>{kpi.value}</Text>
              <Text style={styles.kpiMeta}>
                {t(isSample ? 'dashboardSampleData' : 'dashboardLiveData')}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.kpiScroll}
    >
      {HOME_KPIS.map(kpi => (
        <View key={kpi.id} style={styles.kpiCard}>
          <View style={styles.kpiTop}>
            <Text style={styles.kpiLabel}>{t(`kpi_${kpi.id}`)}</Text>
            <View
              style={[styles.kpiIconWrap, {backgroundColor: iconBg(kpi.id)}]}
            >
              {iconFor(kpi.id, iconColor(kpi.id))}
            </View>
          </View>
          <Text style={[styles.kpiValue, {color: valueColor(kpi.id)}]}>
            {kpi.id === 'revenue'
              ? `${kpi.value} ${t('jod')}`
              : kpi.value}
          </Text>
          <View style={styles.kpiTrend}>
            <ArrowUpRight size={12} color={theme.status.success} strokeWidth={2.5} />
            <Text style={styles.kpiTrendText}>
              +{kpi.trendPct}% {t('vsYesterday')}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

export default HomeKpiCards;
