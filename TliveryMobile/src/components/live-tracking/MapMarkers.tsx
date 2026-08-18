import {type FC, useEffect, useState} from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import {Marker} from 'react-native-maps';
import {Flag, MapPin, Package} from 'lucide-react-native';
import {mapAccent} from './mapTheme';

const FLEET_CAPTAIN = require('@app/assets/images/wasel/tracking/fleet-captain-marker.png');

export type MapCoord = {latitude: number; longitude: number};

type DriverProps = {
  coordinate: MapCoord;
  title?: string;
  selected?: boolean;
  onTrip?: boolean;
  onPress?: () => void;
  /** e.g. "14 min" — shown in a dark floating badge above the captain. */
  etaLabel?: string | null;
};

type PinProps = {
  coordinate: MapCoord;
  title?: string;
};

/** Avoid permanent tracksViewChanges cost after the custom view paints once. */
function useTracksOnce(extraKey?: string | boolean | number | null): boolean {
  const [tracks, setTracks] = useState(true);
  useEffect(() => {
    setTracks(true);
    const id = setTimeout(() => {
      setTracks(false);
    }, 600);
    return () => clearTimeout(id);
  }, [extraKey]);
  return tracks;
}

/** Captain avatar in a circle — used on fleet + order live maps. */
export const DriverCarMarker: FC<DriverProps> = ({
  coordinate,
  title,
  selected = false,
  onTrip = false,
  onPress,
  etaLabel,
}) => {
  const tracks = useTracksOnce(`${selected}:${onTrip}:${etaLabel ?? ''}`);
  const ringColor = selected
    ? mapAccent.captainRingSelected
    : onTrip
      ? mapAccent.captainRingOnTrip
      : mapAccent.captainRing;

  return (
    <Marker
      coordinate={coordinate}
      title={title}
      anchor={{x: 0.5, y: etaLabel ? 0.72 : 0.5}}
      tracksViewChanges={tracks}
      onPress={event => {
        event.stopPropagation?.();
        onPress?.();
      }}>
      <View style={styles.driverStack}>
        {etaLabel ? (
          <View style={styles.etaBadge}>
            <Text style={styles.etaBadgeText}>{etaLabel}</Text>
          </View>
        ) : null}
        <View
          style={[
            styles.captainWrap,
            {borderColor: ringColor},
            selected ? styles.captainSelected : null,
            onTrip && !selected ? styles.captainOnTrip : null,
          ]}>
          <Image
            source={FLEET_CAPTAIN}
            style={styles.captainImage}
            resizeMode="cover"
          />
        </View>
      </View>
    </Marker>
  );
};

/** Gold destination pin matching Track Order design. */
export const CustomerPinMarker: FC<PinProps> = ({coordinate, title}) => {
  const tracks = useTracksOnce();
  return (
    <Marker
      coordinate={coordinate}
      title={title}
      anchor={{x: 0.5, y: 1}}
      tracksViewChanges={tracks}>
      <View style={styles.customerPin}>
        <View style={styles.customerPinHead}>
          <MapPin size={18} color="#fff" strokeWidth={2.4} />
        </View>
        <View style={styles.customerPinPoint} />
      </View>
    </Marker>
  );
};

export const PickupPinMarker: FC<PinProps> = ({coordinate, title}) => {
  const tracks = useTracksOnce();
  return (
    <Marker
      coordinate={coordinate}
      title={title}
      anchor={{x: 0.5, y: 0.5}}
      tracksViewChanges={tracks}>
      <View style={styles.pinWrap}>
        <View style={[styles.pinSquare, {backgroundColor: mapAccent.pickup}]}>
          <Package size={16} color="#fff" strokeWidth={2.4} />
        </View>
        <View style={[styles.pinStem, {backgroundColor: mapAccent.pickup}]} />
      </View>
    </Marker>
  );
};

export const DropoffFlagMarker: FC<PinProps> = ({coordinate, title}) => {
  const tracks = useTracksOnce();
  return (
    <Marker
      coordinate={coordinate}
      title={title}
      anchor={{x: 0.5, y: 0.92}}
      tracksViewChanges={tracks}>
      <View style={styles.pinWrap}>
        <View style={[styles.pinSquare, {backgroundColor: mapAccent.dropoff}]}>
          <Flag size={16} color="#fff" strokeWidth={2.4} />
        </View>
        <View style={[styles.pinStem, {backgroundColor: mapAccent.dropoff}]} />
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  driverStack: {
    alignItems: 'center',
    gap: 4,
  },
  etaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
    elevation: 4,
  },
  etaBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  captainWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 3,
    overflow: 'hidden',
    backgroundColor: '#C5D4CE',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
    elevation: 5,
  },
  captainSelected: {
    borderWidth: 3,
    transform: [{scale: 1.08}],
  },
  captainOnTrip: {
    borderWidth: 3,
  },
  captainImage: {
    width: 46,
    height: 46,
  },
  customerPin: {
    alignItems: 'center',
  },
  customerPinHead: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
    elevation: 5,
  },
  customerPinPoint: {
    width: 0,
    height: 0,
    marginTop: -2,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#D4AF37',
  },
  pinWrap: {
    alignItems: 'center',
  },
  pinSquare: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
    elevation: 4,
  },
  pinStem: {
    width: 3,
    height: 10,
    marginTop: -1,
    borderBottomStartRadius: 2,
    borderBottomEndRadius: 2,
  },
});
