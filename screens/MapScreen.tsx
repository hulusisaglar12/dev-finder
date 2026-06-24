import React, { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, Text, Image, StyleSheet } from 'react-native';
import MapView, { Marker, Callout, LatLng } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Developer, RootStackParamList } from '../types';
import { API_URL } from '../src/config';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Map'>;
};

const DEFAULT_REGION = {
  latitude: 37.79,
  longitude: -122.40,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

export default function MapScreen({ navigation }: Props) {
  const mapRef = useRef<MapView>(null);
  const [devs, setDevs] = useState<Developer[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [initialRegion, setInitialRegion] = useState(DEFAULT_REGION);

  // Set initial region from device GPS
  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status === 'granted') {
        Location.getCurrentPositionAsync().then(({ coords }) => {
          setInitialRegion({
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          });
        });
      }
    });
  }, []);

  // Fetch devs from backend
  useEffect(() => {
    fetch(`${API_URL}/users`)
      .then((r) => r.json())
      .then((data: Developer[]) => setDevs(data))
      .catch(() => {});
  }, []);

  // Fit map to all pins once both map and data are ready
  useEffect(() => {
    if (!mapReady || devs.length === 0) return;
    const coords: LatLng[] = devs.map((d) => ({
      latitude: d.latitude,
      longitude: d.longitude,
    }));
    mapRef.current?.fitToCoordinates(coords, {
      edgePadding: { top: 128, right: 64, bottom: 64, left: 64 },
      animated: true,
    });
  }, [mapReady, devs]);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('@username');
    navigation.replace('SignUp');
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        onMapReady={() => setMapReady(true)}
        showsUserLocation
        moveOnMarkerPress={false}
        toolbarEnabled={false}
      >
        {devs.map((dev) => (
          <Marker
            key={String(dev.id)}
            coordinate={{ latitude: dev.latitude, longitude: dev.longitude }}
          >
            <Image
              source={{ uri: dev.avatarUrl }}
              style={styles.avatar}
              resizeMode="contain"
            />
            <Callout
              onPress={() =>
                navigation.navigate('Profile', { username: dev.username })
              }
            >
              <View style={styles.callout}>
                <Text style={styles.calloutName}>{dev.name}</Text>
                {dev.bio ? (
                  <Text style={styles.calloutBio}>{dev.bio}</Text>
                ) : null}
                <Text style={styles.calloutLink}>View Profile →</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // KEY FIX: flex:1 instead of absoluteFillObject so Android computes height correctly
  map: {
    flex: 1,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: '#E8EAED',
  },
  callout: {
    width: 220,
    padding: 8,
  },
  calloutName: {
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 4,
  },
  calloutBio: {
    fontSize: 12,
    color: '#555',
    marginBottom: 6,
  },
  calloutLink: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600',
  },
  logoutButton: {
    position: 'absolute',
    top: 64,
    right: 24,
    backgroundColor: '#031A62',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    elevation: 3,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
