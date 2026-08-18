import {useMemo, type FC} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {ChevronLeft, ChevronRight} from 'lucide-react-native';
import ScreenContainer from '@app/components/screen-container';
import AppText from '@app/components/app-text';
import Column from '@app/components/column';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import {
  selectIsCompanyStaff,
  selectUserRole,
  useUserStore,
} from '@app/features/user';
import {useFinanceHub} from '@app/hooks/useFinance';
import type {RootStackParamList} from '@app/types/navigation';
import {cairoFont} from '@app/theme/fonts';
import {fontSize, radius, space} from '@app/theme/tokens';
import {
  getFlexDirection,
  getTextAlign,
  isRTL,
} from '@app/utils/directionalStyles';
import {getHeight, getWidth} from '@app/utils/responsive-design';
import {formatFinanceMoney} from '../financeModel';
import {financeColors, financeSheet} from '../financeUi';
import FinanceLedgerScreen from './FinanceLedgerScreen';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const AccountsHubScreen: FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation<Nav>();
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const isCompanyStaff = useUserStore(selectIsCompanyStaff);
  const role = useUserStore(selectUserRole);
  const rtl = isRTL(direction);
  const Chevron = rtl ? ChevronLeft : ChevronRight;
  const isDark = themeType === 'dark';
  const jod = t('jod');
  const ink = financeColors(isDark);

  const hubQuery = useFinanceHub(isCompanyStaff);
  const ownLedger =
    role === 'driver' || role === 'client' || role === 'merchant';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        tb: {
          ...financeSheet(theme, isDark),
          borderRadius: radius.md,
          borderTopWidth: 3,
          borderTopColor: ink.gold,
        },
        tbRow: {
          flexDirection: getFlexDirection(direction),
        },
        tbCol: {
          flex: 1,
          minWidth: 0,
          paddingVertical: getHeight(14),
          paddingHorizontal: getWidth(10),
          gap: getHeight(4),
        },
        tbSplit: {
          width: StyleSheet.hairlineWidth,
          backgroundColor: ink.hairline,
        },
        tbLabel: {
          fontSize: 10,
          lineHeight: 14,
          color: theme.typography.secondary,
          letterSpacing: 0.4,
          textTransform: 'uppercase',
          textAlign: getTextAlign(direction),
          ...cairoFont('bold'),
        },
        tbValue: {
          fontSize: 16,
          lineHeight: 22,
          textAlign: getTextAlign(direction),
          ...cairoFont('bold'),
        },
        legend: {
          flexDirection: getFlexDirection(direction),
          flexWrap: 'wrap',
          gap: getWidth(12),
          paddingHorizontal: getWidth(4),
        },
        legendItem: {
          flexDirection: getFlexDirection(direction),
          alignItems: 'center',
          gap: getWidth(6),
        },
        swatch: {
          width: getWidth(8),
          height: getWidth(8),
          borderRadius: 2,
        },
        legendText: {
          color: theme.typography.secondary,
          fontSize: fontSize.caption,
          ...cairoFont('medium'),
        },
        hint: {
          color: theme.typography.secondary,
          fontSize: fontSize.caption,
          textAlign: getTextAlign(direction),
          ...cairoFont('regular'),
        },
        folio: {
          ...financeSheet(theme, isDark),
          borderRadius: radius.md,
          flexDirection: getFlexDirection(direction),
          overflow: 'hidden',
        },
        spine: {
          width: getWidth(6),
        },
        folioBody: {
          flex: 1,
          minWidth: 0,
          paddingVertical: getHeight(14),
          paddingHorizontal: getWidth(space.md),
          gap: getHeight(6),
        },
        folioTop: {
          flexDirection: getFlexDirection(direction),
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: getWidth(8),
        },
        folioTitle: {
          color: theme.typography.primary,
          fontSize: fontSize.section,
          ...cairoFont('bold'),
          textAlign: getTextAlign(direction),
        },
        folioMeta: {
          color: theme.typography.secondary,
          fontSize: fontSize.caption,
          textAlign: getTextAlign(direction),
          ...cairoFont('regular'),
        },
        folioAmount: {
          fontSize: 22,
          lineHeight: 28,
          textAlign: getTextAlign(direction),
          ...cairoFont('bold'),
        },
      }),
    [direction, ink.gold, ink.hairline, isDark, theme],
  );

  if (ownLedger) {
    return <FinanceLedgerScreen />;
  }

  const driversTotal = hubQuery.data?.drivers.totalJod ?? 0;
  const clientsTotal = hubQuery.data?.clients.totalJod ?? 0;
  const net = driversTotal - clientsTotal;
  const netColor = net >= 0 ? ink.debit : ink.netNeg;

  return (
    <ScreenContainer
      navTitle={t('navAccounts')}
      loading={hubQuery.isLoading}
      pullToRefresh={{
        onRefresh: async () => {
          await hubQuery.refetch();
        },
      }}>
      <Column gap={space.md}>
        <AppText variant="body" tone="secondary">
          {t('financeHubSubtitle')}
        </AppText>

        <View style={styles.tb}>
          <View style={styles.tbRow}>
            <View style={styles.tbCol}>
              <AppText style={styles.tbLabel}>{t('financeArShort')}</AppText>
              <AppText style={[styles.tbValue, {color: ink.debit}]}>
                {formatFinanceMoney(driversTotal, jod)}
              </AppText>
            </View>
            <View style={styles.tbSplit} />
            <View style={styles.tbCol}>
              <AppText style={styles.tbLabel}>{t('financeApShort')}</AppText>
              <AppText style={[styles.tbValue, {color: ink.credit}]}>
                {formatFinanceMoney(clientsTotal, jod)}
              </AppText>
            </View>
            <View style={styles.tbSplit} />
            <View style={styles.tbCol}>
              <AppText style={styles.tbLabel}>{t('financeKpiNet')}</AppText>
              <AppText style={[styles.tbValue, {color: netColor}]}>
                {formatFinanceMoney(net, jod)}
              </AppText>
            </View>
          </View>
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.swatch, {backgroundColor: ink.debit}]} />
            <AppText style={styles.legendText}>{t('financeLegendDebit')}</AppText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.swatch, {backgroundColor: ink.credit}]} />
            <AppText style={styles.legendText}>
              {t('financeLegendCredit')}
            </AppText>
          </View>
        </View>

        <AppText style={styles.hint}>{t('financeBooksHint')}</AppText>

        <Pressable
          accessibilityRole="button"
          onPress={() =>
            navigation.navigate('FinancePartyList', {kind: 'driver'})
          }
          style={styles.folio}>
          <View style={[styles.spine, {backgroundColor: ink.debit}]} />
          <View style={styles.folioBody}>
            <View style={styles.folioTop}>
              <View style={{flex: 1, minWidth: 0}}>
                <AppText style={styles.folioTitle}>
                  {t('financeDriversCard')}
                </AppText>
                <AppText style={styles.folioMeta}>
                  {t('financePartiesCount', {
                    count: hubQuery.data?.drivers.count ?? 0,
                  })}
                </AppText>
              </View>
              <Chevron color={theme.typography.secondary} size={18} />
            </View>
            <AppText style={[styles.folioAmount, {color: ink.debit}]}>
              {formatFinanceMoney(driversTotal, jod)}
            </AppText>
            <AppText style={styles.folioMeta}>
              {t('financeDriversTotalHint')}
            </AppText>
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() =>
            navigation.navigate('FinancePartyList', {kind: 'client'})
          }
          style={styles.folio}>
          <View style={[styles.spine, {backgroundColor: ink.credit}]} />
          <View style={styles.folioBody}>
            <View style={styles.folioTop}>
              <View style={{flex: 1, minWidth: 0}}>
                <AppText style={styles.folioTitle}>
                  {t('financeClientsCard')}
                </AppText>
                <AppText style={styles.folioMeta}>
                  {t('financePartiesCount', {
                    count: hubQuery.data?.clients.count ?? 0,
                  })}
                </AppText>
              </View>
              <Chevron color={theme.typography.secondary} size={18} />
            </View>
            <AppText style={[styles.folioAmount, {color: ink.credit}]}>
              {formatFinanceMoney(clientsTotal, jod)}
            </AppText>
            <AppText style={styles.folioMeta}>
              {t('financeClientsTotalHint')}
            </AppText>
          </View>
        </Pressable>
      </Column>
    </ScreenContainer>
  );
};

export default AccountsHubScreen;
