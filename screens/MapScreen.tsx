import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, Image, StyleSheet } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Developer, RootStackParamList } from '../types';
import { API_URL } from '../src/config';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Map'>;
};

export default function MapScreen({ navigation }: Props) {
  const [devs, setDevs] = useState<Developer[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/users`)
      .then((r) => r.json())
      .then((data: Developer[]) => setDevs(data))
      .catch(() => {
        // Backend not running — map stays empty; no crash
      });
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('@username');
    navigation.replace('SignUp');
  };

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: 37.79,
          longitude: -122.40,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {devs.map((dev) => (
          <Marker
            key={String(dev.id)}
            coordinate={{ latitude: dev.latitude, longitude: dev.longitude }}
          >
            <Image source={{ uri: dev.avatarUrl }} style={styles.avatar} />
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#fff',
  },
  callout: {
    width: 200,
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
    top: 48,
    right: 16,
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
