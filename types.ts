export type RootStackParamList = {
  SignUp: undefined;
  Map: undefined;
  Profile: { username: string };
};

export interface Developer {
  id: number;
  username: string;
  name: string;
  bio: string | null;
  latitude: number;
  longitude: number;
}
