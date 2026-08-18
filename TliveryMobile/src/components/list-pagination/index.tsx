import {useMemo, type FC} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {ChevronLeft, ChevronRight} from 'lucide-react-native';
import {useTranslation} from 'react-i18next';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import {LangDirection} from '@app/enums/LangDirection';
import AppText from '@app/components/app-text';
import {getFlexDirection} from '@app/utils/directionalStyles';
import {fontSize, radius, space} from '@app/theme/tokens';
import {cairoFont} from '@app/theme/fonts';
import {getHeight, getWidth} from '@app/utils/responsive-design';

type ListPaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  onPageChange: (page: number) => void;
};

const ListPagination: FC<ListPaginationProps> = ({
  page,
  pageSize,
  total,
  hasMore,
  onPageChange,
}) => {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const {direction} = useLanguage();
  const isRtl = direction === LangDirection.RTL;
  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const canPrev = page > 1;
  const canNext = hasMore;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          flexDirection: getFlexDirection(direction),
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: getWidth(space.sm),
          paddingVertical: getHeight(space.xs),
        },
        meta: {
          flex: 1,
          fontSize: fontSize.caption,
          color: theme.typography.secondary,
          ...cairoFont('regular'),
        },
        actions: {
          flexDirection: getFlexDirection(direction),
          gap: getWidth(space.xs),
        },
        btn: {
          minWidth: getWidth(44),
          minHeight: getHeight(44),
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: theme.ui.border,
          backgroundColor: theme.backgrounds.surface,
          alignItems: 'center',
          justifyContent: 'center',
        },
        btnDisabled: {
          opacity: 0.4,
        },
      }),
    [direction, theme],
  );

  if (total === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <AppText style={styles.meta}>
        {t('paginationRange', {from, to, total})}
      </AppText>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('previousPage')}
          disabled={!canPrev}
          onPress={() => onPageChange(page - 1)}
          style={[styles.btn, !canPrev && styles.btnDisabled]}>
          <PrevIcon
            size={18}
            color={theme.typography.primary}
            strokeWidth={2.2}
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('nextPage')}
          disabled={!canNext}
          onPress={() => onPageChange(page + 1)}
          style={[styles.btn, !canNext && styles.btnDisabled]}>
          <NextIcon
            size={18}
            color={theme.typography.primary}
            strokeWidth={2.2}
          />
        </Pressable>
      </View>
    </View>
  );
};

export default ListPagination;
