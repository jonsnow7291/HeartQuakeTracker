import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator, type NativeStackScreenProps } from '@react-navigation/native-stack';
import type { QuizLevel } from '../../contracts/content';
import { useServices } from '../hooks/useServices';
import { useEmergency } from '../hooks/useEmergency';
import { ScreenPlaceholder } from '../components/ScreenPlaceholder';
import { MainTabs } from './MainTabs';
import type { RootStackParamList } from './types';
import { SplashScreen } from '../screens/SplashScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { PanicModal } from '../screens/PanicModal';
import { EmergencyActiveScreen } from '../screens/EmergencyActiveScreen';
import { DuringScreen } from '../screens/DuringScreen';
import { AfterScreen } from '../screens/AfterScreen';
import { PreventionScreen } from '../screens/PreventionScreen';
import { GuidesListScreen } from '../screens/GuidesListScreen';
import { GuideReaderScreen } from '../screens/GuideReaderScreen';
import { QuizLevelsScreen } from '../screens/QuizLevelsScreen';
import { QuizScreen } from '../screens/QuizScreen';
import { AchievementsScreen } from '../screens/AchievementsScreen';
import { FamilyPlanScreen } from '../screens/FamilyPlanScreen';
import { KitScreen } from '../screens/KitScreen';
import { MedicalScreen } from '../screens/MedicalScreen';
import { UnlockScreen } from '../screens/UnlockScreen';
import { MapRegionsScreen } from '../screens/MapRegionsScreen';
import { ReportScreen } from '../screens/ReportScreen';
import { AidRequestScreen } from '../screens/AidRequestScreen';
import { AidScreen } from '../screens/AidScreen';
import { SyncScreen } from '../screens/SyncScreen';
import { RescuerScreen } from '../screens/RescuerScreen';
import { PermissionsScreen } from '../screens/PermissionsScreen';
import { DevScenariosScreen } from '../screens/DevScenariosScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
type P<K extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, K>;

function PanicRoute({ navigation }: P<'Panic'>) {
  const { selectSeverity, cancel } = useEmergency();
  return (
    <PanicModal
      visible
      onClose={() => navigation.goBack()}
      onSeveritySelected={async (s) => {
        await selectSeverity(s);
      }}
      onCancelCountdown={async () => {
        await cancel();
      }}
      onActivated={() => navigation.replace('Emergency')}
    />
  );
}

function EmergencyRoute({ navigation }: P<'Emergency'>) {
  return (
    <EmergencyActiveScreen
      onStopFinished={() => navigation.replace('After')}
      onNavigateToDuring={() => navigation.navigate('During')}
    />
  );
}

function GuidesRoute({ navigation }: P<'Guides'>) {
  return <GuidesListScreen onSelectGuide={(guideId) => navigation.navigate('GuideReader', { guideId })} onBack={() => navigation.goBack()} />;
}

function GuideReaderRoute({ navigation, route }: P<'GuideReader'>) {
  return <GuideReaderScreen guideId={route.params.guideId} onBack={() => navigation.goBack()} />;
}

function QuizRoute({ navigation, route }: P<'Quiz'>) {
  const { content } = useServices();
  const [level, setLevel] = useState<QuizLevel | undefined>();
  useEffect(() => {
    content.getQuizBank().then((bank) => setLevel(bank.levels.find((l) => l.id === route.params.levelId)));
  }, [content, route.params.levelId]);
  if (!level) return <ScreenPlaceholder title="Cargando quiz…" rf="RF-02" />;
  return (
    <QuizScreen
      level={level}
      onFinish={() => navigation.goBack()}
      onNavigateToGuide={(guideId) => navigation.navigate('GuideReader', { guideId })}
    />
  );
}

function DevRoute({ navigation }: P<'Dev'>) {
  return <DevScenariosScreen onBack={() => navigation.goBack()} />;
}

export function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="Panic" component={PanicRoute} options={{ presentation: 'transparentModal', animation: 'fade' }} />
      <Stack.Screen name="Emergency" component={EmergencyRoute} options={{ gestureEnabled: false }} />
      <Stack.Screen name="During" component={DuringScreen} />
      <Stack.Screen name="After" component={AfterScreen} />
      <Stack.Screen name="Prevention" component={PreventionScreen} />
      <Stack.Screen name="Guides" component={GuidesRoute} />
      <Stack.Screen name="GuideReader" component={GuideReaderRoute} />
      <Stack.Screen name="QuizLevels" component={QuizLevelsScreen} />
      <Stack.Screen name="Quiz" component={QuizRoute} />
      <Stack.Screen name="Achievements" component={AchievementsScreen} />
      <Stack.Screen name="FamilyPlan" component={FamilyPlanScreen} />
      <Stack.Screen name="Kit" component={KitScreen} />
      <Stack.Screen name="Medical" component={MedicalScreen} />
      <Stack.Screen name="Unlock" component={UnlockScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="MapRegions" component={MapRegionsScreen} />
      <Stack.Screen name="Report" component={ReportScreen} />
      <Stack.Screen name="AidRequest" component={AidRequestScreen} />
      <Stack.Screen name="Aid" component={AidScreen} />
      <Stack.Screen name="Sync" component={SyncScreen} />
      <Stack.Screen name="Rescuer" component={RescuerScreen} />
      <Stack.Screen name="Permissions" component={PermissionsScreen} />
      {__DEV__ ? <Stack.Screen name="Dev" component={DevRoute} /> : null}
    </Stack.Navigator>
  );
}
