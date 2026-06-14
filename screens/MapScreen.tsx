import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, Image, StyleSheet } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Developer, RootStackParamList } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Map'>;
};

// Seeded from db.json — coordinates are in San Francisco
const SEED_DEVS: Developer[] = [
  {
    id: 1,
    username: 'torvalds',
    name: 'Linus Torvalds',
    bio: null,
    latitude: 37.78796109088732,
    longitude: -122.41171214729549,
  },
  {
    id: 2,
    username: 'timbl',
    name: 'Tim Berners-Lee',
    bio: null,
    latitude: 37.79282406698407,
    longitude: -122.39881340414287,
  },
  {
    id: 3,
    username: 'gvanrossum',
    name: 'Guido van Rossum',
    bio: null,
    latitude: 37.790605642105255,
    longitude: -122.39324949681759,
  },
];

const INITIAL_REGION = {
  latitude: 37.79,
  longitude: -122.40,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function MapScreen({ navigation }: Props) {
  const [devs, setDevs] = useState<Developer[]>(SEED_DEVS);

  // Enrich seeded devs with live bio from GitHub API
  useEffect(() => {
    Promise.all(
      SEED_DEVS.map((dev) =>
        fetch(`https://api.github.com/users/${dev.username}`)
          .then((r) => r.json())
          .then((data) => ({
            ...dev,
            name: (data.name as string | null) ?? dev.name,
            bio: (data.bio as string | null) ?? null,
          }))
          .catch(() => dev),
      ),
    ).then(setDevs);
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('@username');
    navigation.replace('SignUp');
  };

  return (
    <View style={styles.container}>
      <MapView style={StyleSheet.absoluteFillObject} initialRegion={INITIAL_REGION}>
        {devs.map((dev) => (
          <Marker
            key={dev.id}
            coordinate={{ latitude: dev.latitude, longitude: dev.longitude }}
          >
            <Image
              source={{ uri: `https://github.com/${dev.username}.png` }}
              style={styles.avatar}
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
