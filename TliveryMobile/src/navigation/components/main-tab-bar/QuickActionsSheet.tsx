import {useMemo, type FC} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import type {LucideIcon} from 'lucide-react-native';
import {Plus, UserPlus} from 'lucide-react-native';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import AppText from '@app/components/app-text';
import BottomSheetModal from '@app/components/bottom-sheet-modal';
import {getFlexDirection, isRTL} from '@app/utils/directionalStyles';
import {cairoFont} from '@app/theme/fonts';
import {fontSize, space} from '@app/theme/tokens';
import {getHeight, getWidth} from '@app/utils/responsive-design';

export type QuickActionKey = 'createOrder' | 'addDriver' | 'addEmployee';

export type QuickActionItem = {
  key: QuickActionKey;
  titleKey: string;
  Icon: LucideIcon;
};

type QuickActionsSheetProps = {
  visible: boolean;
  onClose: () => void;
  actions: QuickActionItem[];
  onSelect: (key: QuickActionKey) => void;
};

const QuickActionsSheet: FC<QuickActionsSheetProps> = ({
  visible,
  onClose,
  actions,
  onSelect,
}) => {
  const {t} = useTranslation();
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const isDark = themeType === 'dark';
  const rtl = isRTL(direction);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        grid: {
          flexDirection: getFlexDirection(direction),
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: getWidth(space.sm),
          paddingBottom: getHeight(space.sm),
        },
        item: {
          width: '47%',
          minHeight: getHeight(88),
          padding: getWidth(space.sm),
          gap: getHeight(8),
          alignItems: 'center',
          justifyContent: 'center',
        },
        iconBox: {
          width: getWidth(36),
          height: getWidth(36),
          borderRadius: getWidth(10),
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDark ? theme.brand.gold : theme.brand.navy,
        },
        label: {
          fontSize: fontSize.caption,
          color: theme.typography.primary,
          textAlign: 'center',
          writingDirection: rtl ? 'rtl' : 'ltr',
          width: '100%',
          ...cairoFont('bold'),
        },
      }),
    [direction, isDark, rtl, theme],
  );

  const iconColor = isDark ? theme.brand.navy : theme.typography.inverse;

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={t('quickActionsTitle')}
      subtitle={t('quickActionsSubtitle')}
      minHeight={220}>
      <View style={styles.grid}>
        {actions.map(action => (
          <Pressable
            key={action.key}
            accessibilityRole="button"
            onPress={() => onSelect(action.key)}
            style={({pressed}) => [
              styles.item,
              pressed && {opacity: 0.88},
            ]}>
            <View style={styles.iconBox}>
              <action.Icon color={iconColor} size={18} strokeWidth={2.3} />
            </View>
            <AppText style={styles.label}>{t(action.titleKey)}</AppText>
          </Pressable>
        ))}
      </View>
    </BottomSheetModal>
  );
};

export const buildQuickActions = (flags: {
  canManageDrivers: boolean;
  canManageEmployees: boolean;
  canCreateOrder: boolean;
}): QuickActionItem[] => {
  const actions: QuickActionItem[] = [];

  if (flags.canCreateOrder) {
    actions.push({
      key: 'createOrder',
      titleKey: 'createOrder',
      Icon: Plus,
    });
  }
  if (flags.canManageDrivers) {
    actions.push({
      key: 'addDriver',
      titleKey: 'addDriver',
      Icon: UserPlus,
    });
  }
  if (flags.canManageEmployees) {
    actions.push({
      key: 'addEmployee',
      titleKey: 'addEmployee',
      Icon: UserPlus,
    });
  }

  return actions;
};

export default QuickActionsSheet;
