import {type FC, type ReactNode, useMemo} from 'react';
import {Pressable, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useTheme} from '@app/providers/ThemeContext';
import {useLanguage} from '@app/providers/LangContext';
import AppText from '@app/components/app-text';
import SearchBar from '@app/components/search-bar';
import FilterChips, {
  type FilterChipItem,
} from '@app/components/filter-chips';
import {getFlexDirection} from '@app/utils/directionalStyles';
import {space} from '@app/theme/tokens';
import {getHeight} from '@app/utils/responsive-design';
import {listScreenHeaderStyles} from './styles';

export type ListScreenHeaderSearch = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
};

export type ListScreenHeaderFilters = {
  options: FilterChipItem[];
  value: string;
  onChange: (value: string) => void;
};

type ListScreenHeaderProps = {
  topSlot?: ReactNode;
  search?: ListScreenHeaderSearch;
  filters?: ListScreenHeaderFilters;
  countLabel?: string;
  trailingAction?: ReactNode;
  showClear?: boolean;
  onClearFilters?: () => void;
  error?: string | null;
};

const ListScreenHeader: FC<ListScreenHeaderProps> = ({
  topSlot,
  search,
  filters,
  countLabel,
  trailingAction,
  showClear = false,
  onClearFilters,
  error,
}) => {
  const {t} = useTranslation();
  const {theme, themeType} = useTheme();
  const {direction} = useLanguage();
  const styles = useMemo(
    () => listScreenHeaderStyles(theme, direction, themeType),
    [theme, direction, themeType],
  );

  const showTools = search != null;
  const showMeta =
    showTools &&
    (Boolean(countLabel) || trailingAction != null || showClear);

  return (
    <View style={styles.wrap}>
      {topSlot}

      {search ? (
        <SearchBar
          value={search.value}
          onChangeText={search.onChangeText}
          placeholder={search.placeholder}
        />
      ) : null}

      {search && filters ? (
        <FilterChips
          options={filters.options}
          value={filters.value}
          onChange={filters.onChange}
        />
      ) : null}

      {showMeta ? (
        <View
          style={[
            styles.metaRow,
            {flexDirection: getFlexDirection(direction)},
          ]}>
          {countLabel ? (
            <AppText style={styles.metaCount} numberOfLines={1}>
              {countLabel}
            </AppText>
          ) : (
            <View style={styles.metaSpacer} />
          )}
          <View
            style={[
              styles.metaActions,
              {flexDirection: getFlexDirection(direction)},
            ]}>
            {trailingAction}
            {showClear && onClearFilters ? (
              <Pressable
                accessibilityRole="button"
                onPress={onClearFilters}
                hitSlop={8}
                style={styles.clearBtn}>
                <AppText style={styles.clearLabel}>{t('clearFilters')}</AppText>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      {error ? (
        <AppText variant="body" style={styles.error}>
          {error}
        </AppText>
      ) : null}

      <View style={{height: getHeight(space.xs)}} />
    </View>
  );
};

export default ListScreenHeader;
