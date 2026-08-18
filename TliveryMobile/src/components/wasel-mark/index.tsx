import {type FC} from 'react';
import {Image, type ImageStyle, type StyleProp} from 'react-native';
import brand from '@app/config/brand';
import {getWidth} from '@app/utils/responsive-design';

type WaselMarkProps = {
  size?: number;
  style?: StyleProp<ImageStyle>;
};

/** General Wasel app mark (navy + gold) for loading, empty, and compact branding. */
const WaselMark: FC<WaselMarkProps> = ({size = 56, style}) => {
  const dim = getWidth(size);
  return (
    <Image
      source={brand.images.appIcon}
      accessibilityLabel={brand.name}
      style={[
        {
          width: dim,
          height: dim,
          borderRadius: getWidth(14),
        },
        style,
      ]}
      resizeMode="cover"
    />
  );
};

export default WaselMark;
