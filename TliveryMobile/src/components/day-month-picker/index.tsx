import {useCallback, useEffect, useMemo, useState, FC} from 'react';
import {Pressable, View, useWindowDimensions} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ChevronLeft, ChevronRight, X} from 'lucide-react-native';
import {useTranslation} from 'react-i18next';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import {isRTL} from '@app/utils/directionalStyles';
import BottomSheetModal from '@app/components/bottom-sheet-modal';
import AppText from '@app/components/app-text';
import {
  addMonths,
  buildMonthGrid,
  getCalendarGridCellSize,
  monthYearTitle,
  shortWeekdayLabels,
  toLocalIsoDate,
} from '@app/utils/calendarDateUtils';
import {dayMonthPickerStyles} from './styles';

export type DayMonthPickerProps = {
  visible: boolean;
  onClose: () => void;
  selectedIso?: string | null;
  anchorMonth?: Date;
  onSelectDay: (dateIso: string) => void;
  sheetTitle?: string;
  sheetSubtitle?: string;
};

const monthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

const DayMonthPicker: FC<DayMonthPickerProps> = ({
  visible,
  onClose,
  selectedIso,
  anchorMonth,
  onSelectDay,
  sheetTitle,
  sheetSubtitle,
}) => {
  const {t, i18n} = useTranslation();
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const insets = useSafeAreaInsets();
  const {width: windowWidth} = useWindowDimensions();
  const rtl = isRTL(direction);
  const isDark = themeType === 'dark';
  const styles = useMemo(
    () => dayMonthPickerStyles(theme, isDark),
    [theme, isDark],
  );

  const localeTag = i18n.language?.startsWith('ar') ? 'ar' : 'en';
  const PrevIcon = rtl ? ChevronRight : ChevronLeft;
  const NextIcon = rtl ? ChevronLeft : ChevronRight;
  const rowDir = rtl ? 'row-reverse' : 'row';

  const resolveAnchor = useCallback(() => {
    if (anchorMonth instanceof Date && Number.isFinite(anchorMonth.getTime())) {
      return anchorMonth;
    }
    if (selectedIso) {
      const [y, m, d] = selectedIso.split('-').map(Number);
      return new Date(y, (m ?? 1) - 1, d ?? 1);
    }
    return new Date();
  }, [anchorMonth, selectedIso]);

  const [viewMonth, setViewMonth] = useState(() => monthStart(resolveAnchor()));

  useEffect(() => {
    if (visible) {
      setViewMonth(monthStart(resolveAnchor()));
    }
  }, [visible, resolveAnchor]);

  const year = viewMonth.getFullYear();
  const monthIndex = viewMonth.getMonth();
  const grid = useMemo(
    () => buildMonthGrid(year, monthIndex),
    [year, monthIndex],
  );
  const gridRows = useMemo(() => {
    const rows: (number | null)[][] = [];
    for (let i = 0; i < grid.length; i += 7) {
      rows.push(grid.slice(i, i + 7));
    }
    return rows;
  }, [grid]);

  const dowLabels = useMemo(
    () => shortWeekdayLabels(localeTag),
    [localeTag],
  );
  const gridCellSize = useMemo(
    () => getCalendarGridCellSize(windowWidth, insets.left, insets.right),
    [insets.left, insets.right, windowWidth],
  );

  const todayIso = toLocalIsoDate(new Date());
  const contextIso = selectedIso ?? todayIso;

  const onDayPress = useCallback(
    (day: number) => {
      onSelectDay(toLocalIsoDate(new Date(year, monthIndex, day)));
      onClose();
    },
    [year, monthIndex, onSelectDay, onClose],
  );

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={sheetTitle ?? t('dayMonthPickerTitle')}
      subtitle={sheetSubtitle ?? t('dayMonthPickerSubtitle')}
      minHeight={520}>
      <View style={styles.body}>
        <View style={[styles.monthNav, {flexDirection: rowDir}]}>
          <Pressable
            onPress={() => setViewMonth(m => addMonths(m, -1))}
            hitSlop={8}
            style={styles.monthNavHit}
            accessibilityRole="button"
            accessibilityLabel={t('dayMonthPickerPrevMonth')}>
            <PrevIcon color={theme.brand.gold} size={22} strokeWidth={2.4} />
          </Pressable>
          <View style={styles.monthTitleWrap}>
            <View style={styles.monthTitlePill}>
              <AppText style={styles.monthTitleText}>
                {monthYearTitle(viewMonth, localeTag)}
              </AppText>
            </View>
          </View>
          <Pressable
            onPress={() => setViewMonth(m => addMonths(m, 1))}
            hitSlop={8}
            style={styles.monthNavHit}
            accessibilityRole="button"
            accessibilityLabel={t('dayMonthPickerNextMonth')}>
            <NextIcon color={theme.brand.gold} size={22} strokeWidth={2.4} />
          </Pressable>
        </View>

        <View style={[styles.dowRow, {flexDirection: rowDir}]}>
          {dowLabels.map(label => (
            <View key={label} style={styles.dowCell}>
              <AppText style={styles.dowLabel}>{label}</AppText>
            </View>
          ))}
        </View>

        {gridRows.map((row, ri) => (
          <View
            key={`row-${ri}`}
            style={[
              styles.gridRow,
              {flexDirection: rowDir, height: gridCellSize},
            ]}>
            {row.map((cell, ci) => {
              if (cell == null) {
                return <View key={`e-${ri}-${ci}`} style={styles.emptyCell} />;
              }
              const iso = toLocalIsoDate(new Date(year, monthIndex, cell));
              const weekday = new Date(year, monthIndex, cell).getDay();
              const isToday = iso === todayIso;
              const isSelected = iso === contextIso;
              const isWeekend = weekday === 0 || weekday === 6;

              return (
                <View key={iso} style={styles.dayOuter}>
                  <Pressable
                    onPress={() => onDayPress(cell)}
                    style={styles.dayPress}
                    accessibilityRole="button"
                    accessibilityLabel={iso}>
                    <View
                      style={[
                        styles.dayCard,
                        isSelected && styles.dayCardSelected,
                        !isSelected && isToday && styles.dayCardToday,
                      ]}>
                      <AppText
                        style={[
                          styles.dayNumber,
                          isSelected && styles.dayNumberSelected,
                        ]}>
                        {String(cell).padStart(2, '0')}
                      </AppText>
                      {isWeekend && !isSelected ? (
                        <View style={styles.weekendBar} />
                      ) : null}
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.closeWrap}>
        <Pressable
          accessibilityRole="button"
          onPress={onClose}
          style={styles.closeButton}
          accessibilityLabel={t('close')}>
          <X color={theme.base.white} size={22} />
        </Pressable>
      </View>
    </BottomSheetModal>
  );
};

export default DayMonthPicker;
