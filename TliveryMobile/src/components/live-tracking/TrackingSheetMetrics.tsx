import {useMemo, type FC} from 'react';
import {StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import AppText from '@app/components/app-text';
import {useLanguage} from '@app/providers/LangContext';
import {useTheme} from '@app/providers/ThemeContext';
import {isRTL} from '@app/utils/directionalStyles';
import {cairoFont} from '@app/theme/fonts';
import {fontSize, radius} from '@app/theme/tokens';
import {getHeight, getWidth} from '@app/utils/responsive-design';

type Props = {
  etaLabel: string;
  distanceLabel: string;
  arrivalLabel: string;
};

/** Full-width trip metrics row for tracking bottom sheets. */
const TrackingSheetMetrics: FC<Props> = ({
  etaLabel,
  distanceLabel,
  arrivalLabel,
}) => {
  const {t} = useTranslation();
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const rtl = isRTL(direction);
  const isDark = themeType === 'dark';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          width: '100%',
          flexDirection: rtl ? 'row-reverse' : 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: getWidth(4),
          paddingVertical: getHeight(6),
          paddingHorizontal: getWidth(4),
          borderRadius: radius.sm,
          backgroundColor: isDark
            ? 'rgba(148, 163, 184, 0.10)'
            : 'rgba(15, 23, 42, 0.04)',
        },
        cell: {
          flex: 1,
          minWidth: 0,
          alignItems: 'center',
          gap: getHeight(2),
        },
        divider: {
          width: StyleSheet.hairlineWidth,
          alignSelf: 'stretch',
          backgroundColor: theme.ui.border,
        },
        label: {
          fontSize: fontSize.label,
          color: theme.typography.caption,
          ...cairoFont('regular'),
          textAlign: 'center',
        },
        value: {
          fontSize: fontSize.caption,
          color: theme.typography.primary,
          ...cairoFont('bold'),
          textAlign: 'center',
        },
      }),
    [theme, isDark, rtl],
  );

  return (
    <View style={styles.row}>
      <View style={styles.cell}>
        <AppText style={styles.label} numberOfLines={1}>
          {t('trackingEta')}
        </AppText>
        <AppText style={styles.value} numberOfLines={1}>
          {etaLabel}
        </AppText>
      </View>
      <View style={styles.divider} />
      <View style={styles.cell}>
        <AppText style={styles.label} numberOfLines={1}>
          {t('trackingDistance')}
        </AppText>
        <AppText style={styles.value} numberOfLines={1}>
          {distanceLabel}
        </AppText>
      </View>
      <View style={styles.divider} />
      <View style={styles.cell}>
        <AppText style={styles.label} numberOfLines={1}>
          {t('trackingArrival')}
        </AppText>
        <AppText style={styles.value} numberOfLines={1}>
          {arrivalLabel}
        </AppText>
      </View>
    </View>
  );
};

export default TrackingSheetMetrics;
