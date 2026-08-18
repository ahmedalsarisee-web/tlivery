import {useEffect, useMemo, useState, type FC} from 'react';
import {FlatList, Pressable, StyleSheet, View} from 'react-native';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {ChevronLeft, ChevronRight} from 'lucide-react-native';
import ScreenContainer from '@app/components/screen-container';
import AppText from '@app/components/app-text';
import SearchBar from '@app/components/search-bar';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import {useFinanceParties} from '@app/hooks/useFinance';
import {useDebouncedValue} from '@app/hooks/useDebouncedValue';
import type {RootStackParamList} from '@app/types/navigation';
import {cairoFont} from '@app/theme/fonts';
import {fontSize, radius, space} from '@app/theme/tokens';
import {
  getFlexDirection,
  getTextAlign,
  isRTL,
} from '@app/utils/directionalStyles';
import {getHeight, getWidth} from '@app/utils/responsive-design';
import ListLoadingFooter from '@app/components/list-loading-footer';
import {
  formatFinanceMoney,
  partyInitial,
  partyListIsCollectDue,
  partyListPositionI18nKey,
} from '../financeModel';
import {financeColors, financeSheet} from '../financeUi';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type ScreenRoute = RouteProp<RootStackParamList, 'FinancePartyList'>;

const FinancePartyListScreen: FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<ScreenRoute>();
  const {kind} = route.params;
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const rtl = isRTL(direction);
  const Chevron = rtl ? ChevronLeft : ChevronRight;
  const isDark = themeType === 'dark';
  const jod = t('jod');
  const ink = financeColors(isDark);
  const [query, setQuery] = useState('');
  const debouncedQ = useDebouncedValue(query, 300);
  const [pageNumber, setPageNumber] = useState(1);
  const [rows, setRows] = useState<
    Array<{
      id: string;
      partyUserId: string;
      partyName: string;
      displayBalanceJod: number;
    }>
  >([]);
  const partiesQuery = useFinanceParties({
    kind,
    q: debouncedQ,
    page: pageNumber,
    pageSize: 20,
  });

  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: {
          marginBottom: getHeight(space.sm),
          gap: getHeight(8),
        },
        hint: {
          color: theme.typography.secondary,
          fontSize: fontSize.caption,
          ...cairoFont('regular'),
          textAlign: getTextAlign(direction),
        },
        book: {
          ...financeSheet(theme, isDark),
          borderRadius: radius.md,
          flex: 1,
          minHeight: 0,
        },
        row: {
          flexDirection: getFlexDirection(direction),
          alignItems: 'center',
          gap: getWidth(10),
          paddingVertical: getHeight(12),
          paddingEnd: getWidth(space.sm),
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: ink.hairline,
        },
        spine: {
          width: getWidth(4),
          alignSelf: 'stretch',
        },
        avatar: {
          width: getWidth(32),
          height: getWidth(32),
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
        },
        avatarText: {
          fontSize: 13,
          ...cairoFont('bold'),
        },
        nameBlock: {
          flex: 1,
          minWidth: 0,
          gap: 3,
        },
        name: {
          color: theme.typography.primary,
          fontSize: fontSize.body,
          ...cairoFont('bold'),
          textAlign: getTextAlign(direction),
        },
        pill: {
          alignSelf: rtl ? 'flex-end' : 'flex-start',
          borderRadius: 4,
          paddingHorizontal: 6,
          paddingVertical: 1,
        },
        pillText: {
          fontSize: 10,
          ...cairoFont('bold'),
        },
        amount: {
          fontSize: fontSize.body,
          ...cairoFont('bold'),
        },
        empty: {
          color: theme.typography.secondary,
          fontSize: fontSize.body,
          textAlign: 'center',
          marginTop: getHeight(24),
          ...cairoFont('regular'),
        },
      }),
    [direction, ink.hairline, isDark, rtl, theme],
  );

  const title =
    kind === 'driver' ? t('financeDriversCard') : t('financeClientsCard');
  const page = partiesQuery.data;
  const pageRows = page?.parties ?? [];

  useEffect(() => {
    setPageNumber(1);
    setRows([]);
  }, [debouncedQ, kind]);

  useEffect(() => {
    if (!page) {
      return;
    }
    if (pageNumber <= 1) {
      setRows(pageRows);
      return;
    }
    setRows(prev => {
      const seen = new Set(prev.map(item => item.id));
      const next = pageRows.filter(item => !seen.has(item.id));
      return next.length ? [...prev, ...next] : prev;
    });
  }, [page, pageNumber, pageRows]);

  return (
    <ScreenContainer
      navTitle={title}
      loading={partiesQuery.isLoading}
      scrollable={false}
      pullToRefresh={{
        onRefresh: async () => {
          setPageNumber(1);
          setRows([]);
          await partiesQuery.refetch();
        },
      }}>
      <View style={styles.header}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder={t('financeSearchParties')}
        />
        <AppText style={styles.hint}>
          {kind === 'driver'
            ? t('financeListDriversHint')
            : t('financeListClientsHint')}
        </AppText>
      </View>
      <View style={styles.book}>
        <FlatList
          data={rows}
          keyExtractor={item => item.id}
          style={{flex: 1}}
          contentContainerStyle={{paddingBottom: getHeight(16)}}
          ListEmptyComponent={
            partiesQuery.isLoading ? null : (
              <AppText style={styles.empty}>{t('financeNoParties')}</AppText>
            )
          }
          ListFooterComponent={
            <ListLoadingFooter
              visible={Boolean(
                page?.hasMore && partiesQuery.isFetching && pageNumber > 1,
              )}
            />
          }
          onEndReached={() => {
            if (!partiesQuery.isFetching && page?.hasMore) {
              setPageNumber(prev => prev + 1);
            }
          }}
          onEndReachedThreshold={0.2}
          renderItem={({item}) => {
            const balance = item.displayBalanceJod;
            const settled = Math.abs(balance) < 0.0005;
            const collectDue = partyListIsCollectDue(kind, balance);
            const tone = settled
              ? ink.settled
              : collectDue
                ? ink.debit
                : ink.credit;
            const soft = settled
              ? ink.settledSoft
              : collectDue
                ? ink.debitSoft
                : ink.creditSoft;
            return (
              <Pressable
                accessibilityRole="button"
                style={styles.row}
                onPress={() =>
                  navigation.navigate('FinanceLedger', {
                    partyType: kind,
                    partyUserId: item.partyUserId,
                    partyName: item.partyName,
                  })
                }>
                <View style={[styles.spine, {backgroundColor: tone}]} />
                <View style={[styles.avatar, {backgroundColor: soft}]}>
                  <AppText style={[styles.avatarText, {color: tone}]}>
                    {partyInitial(item.partyName || item.partyUserId)}
                  </AppText>
                </View>
                <View style={styles.nameBlock}>
                  <AppText style={styles.name} numberOfLines={1}>
                    {item.partyName || item.partyUserId}
                  </AppText>
                  <View style={[styles.pill, {backgroundColor: soft}]}>
                    <AppText style={[styles.pillText, {color: tone}]}>
                      {t(partyListPositionI18nKey(kind, balance))}
                    </AppText>
                  </View>
                </View>
                <AppText style={[styles.amount, {color: tone}]}>
                  {formatFinanceMoney(Math.abs(balance), jod)}
                </AppText>
                <Chevron color={theme.typography.secondary} size={16} />
              </Pressable>
            );
          }}
        />
      </View>
    </ScreenContainer>
  );
};

export default FinancePartyListScreen;
