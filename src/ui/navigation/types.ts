import type { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  Home: undefined;
  Map: undefined;
  Alerts: undefined;
  Profile: undefined;
};

/** Rutas según design/navigation.md. Cada ruta nueva se registra aquí y en RootNavigator. */
export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  Panic: undefined;
  Emergency: undefined;
  During: undefined;
  After: undefined;
  Prevention: undefined;
  Guides: undefined;
  GuideReader: { guideId: string };
  QuizLevels: undefined;
  Quiz: { levelId: string };
  Achievements: undefined;
  FamilyPlan: undefined;
  Kit: undefined;
  Medical: undefined;
  Unlock: undefined;
  MapRegions: undefined;
  Report: undefined;
  AidRequest: undefined;
  Aid: undefined;
  Sync: undefined;
  Rescuer: undefined;
  Permissions: undefined;
  Dev: undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
