import {useMemo, FC} from 'react';
import {Text, View} from 'react-native';
import Svg, {Circle, Defs, LinearGradient, Path, Stop, G} from 'react-native-svg';
import {useTranslation} from 'react-i18next';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import {getWidth} from '@app/utils/responsive-design';
import {
  type DashboardSlice,
  HOME_CARRIER_SLICES,
  HOME_ORDERS_SERIES,
} from '../../data/homeDashboard';
import {homeStyles} from '../../screens/Home.styles';

const LINE_W = 140;
const LINE_H = 90;

function buildLinePath(values: number[], w: number, h: number): string {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / span) * (h - 8) - 4;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

const OrdersLineChart: FC = () => {
  const {theme} = useTheme();
  const path = useMemo(
    () => buildLinePath(HOME_ORDERS_SERIES, LINE_W, LINE_H),
    [],
  );
  const peakIndex = HOME_ORDERS_SERIES.indexOf(Math.max(...HOME_ORDERS_SERIES));
  const peakX = (peakIndex / (HOME_ORDERS_SERIES.length - 1)) * LINE_W;
  const max = Math.max(...HOME_ORDERS_SERIES);
  const min = Math.min(...HOME_ORDERS_SERIES);
  const peakY = LINE_H - ((max - min) / (max - min || 1)) * (LINE_H - 8) - 4;

  return (
    <Svg width={LINE_W} height={LINE_H}>
      <Defs>
        <LinearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={theme.status.info} stopOpacity={0.35} />
          <Stop offset="1" stopColor={theme.status.info} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path
        d={`${path} L${LINE_W},${LINE_H} L0,${LINE_H} Z`}
        fill="url(#lineGrad)"
      />
      <Path
        d={path}
        stroke={theme.status.info}
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={peakX} cy={peakY} r={4} fill={theme.status.info} />
    </Svg>
  );
};

const CarrierDonut: FC = () => {
  const {theme} = useTheme();
  const {direction} = useLanguage();
  const {t} = useTranslation();
  const styles = useMemo(
    () => homeStyles(theme, direction),
    [theme, direction],
  );
  const size = getWidth(88);
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  const colorMap = {
    info: theme.status.info,
    gold: theme.brand.gold,
    success: theme.status.success,
    caption: theme.typography.caption,
  } as const;

  let offset = 0;

  return (
    <View style={styles.donutWrap}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={theme.ui.borderLight}
            strokeWidth={stroke}
            fill="none"
          />
          {HOME_CARRIER_SLICES.map(slice => {
            const len = (slice.pct / 100) * c;
            const el = (
              <Circle
                key={slice.id}
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={colorMap[slice.colorToken]}
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return el;
          })}
        </G>
      </Svg>
      <View style={styles.donutCenter}>
        <Text style={styles.donutValue}>120</Text>
        <Text style={styles.donutLabel}>{t('totalOrders')}</Text>
      </View>
    </View>
  );
};

interface SliceDonutProps {
  slices: DashboardSlice[];
  total: number;
  totalLabel: string;
}

const SliceDonut: FC<SliceDonutProps> = ({slices, total, totalLabel}) => {
  const {theme} = useTheme();
  const {direction} = useLanguage();
  const styles = useMemo(
    () => homeStyles(theme, direction),
    [theme, direction],
  );
  const size = getWidth(88);
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const colorMap = {
    info: theme.status.info,
    gold: theme.brand.gold,
    success: theme.status.success,
    caption: theme.typography.caption,
  } as const;
  let offset = 0;

  return (
    <View style={styles.donutWrap}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.ui.borderLight}
            strokeWidth={stroke}
            fill="none"
          />
          {slices.map(slice => {
            const length = (slice.pct / 100) * circumference;
            const circle = (
              <Circle
                key={slice.id}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={colorMap[slice.colorToken]}
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
              />
            );
            offset += length;
            return circle;
          })}
        </G>
      </Svg>
      <View style={styles.donutCenter}>
        <Text style={styles.donutValue}>{total}</Text>
        <Text style={styles.donutLabel}>{totalLabel}</Text>
      </View>
    </View>
  );
};

interface Props {
  driverSlices?: DashboardSlice[];
  sampleOrderSlices?: DashboardSlice[];
  driverTotal?: number;
  sampleOrderTotal?: number;
}

const HomeOverviewCharts: FC<Props> = ({
  driverSlices,
  sampleOrderSlices,
  driverTotal = 0,
  sampleOrderTotal = 0,
}) => {
  const {theme} = useTheme();
  const {direction} = useLanguage();
  const {t} = useTranslation();
  const styles = useMemo(
    () => homeStyles(theme, direction),
    [theme, direction],
  );

  const colorMap = {
    info: theme.status.info,
    gold: theme.brand.gold,
    success: theme.status.success,
    caption: theme.typography.caption,
  } as const;

  if (driverSlices && sampleOrderSlices) {
    const renderLegend = (slices: DashboardSlice[]) => (
      <View style={styles.legendRow}>
        {slices.map(slice => (
          <View key={slice.id} style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                {backgroundColor: colorMap[slice.colorToken]},
              ]}
            />
            <Text style={styles.legendText}>
              {t(slice.nameKey)} {slice.count} ({slice.pct}%)
            </Text>
          </View>
        ))}
      </View>
    );
    return (
      <View style={styles.chartsRow}>
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>{t('dashboardDriverStatus')}</Text>
          <SliceDonut
            slices={driverSlices}
            total={driverTotal}
            totalLabel={t('driversTotal')}
          />
          {driverSlices.length > 0 ? (
            renderLegend(driverSlices)
          ) : (
            <Text style={styles.emptyChartText}>
              {t('dashboardNoDrivers')}
            </Text>
          )}
        </View>
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>
            {t('dashboardSampleOrderStatus')}
          </Text>
          <SliceDonut
            slices={sampleOrderSlices}
            total={sampleOrderTotal}
            totalLabel={t('orderUnit')}
          />
          {sampleOrderSlices.length > 0 ? (
            renderLegend(sampleOrderSlices)
          ) : (
            <Text style={styles.emptyChartText}>
              {t('dashboardNoSampleOrders')}
            </Text>
          )}
          <Text style={styles.sampleDataLabel}>{t('dashboardSampleData')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.chartsRow}>
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>{t('chartOrders')}</Text>
        <OrdersLineChart />
        <Text style={styles.legendText}>
          00:00 — 24:00 · 98 {t('orderUnit')}
        </Text>
      </View>
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>{t('chartCarriers')}</Text>
        <CarrierDonut />
        <View style={styles.legendRow}>
          {HOME_CARRIER_SLICES.map(s => (
            <View key={s.id} style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  {backgroundColor: colorMap[s.colorToken]},
                ]}
              />
              <Text style={styles.legendText}>
                {t(s.nameKey)} {s.pct}%
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default HomeOverviewCharts;
