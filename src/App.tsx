import { useState } from "react";
import "./App.css";
import OnboardingScreen from "./screens/OnboardingScreen";
import LoginScreen from "./screens/LoginScreen";
import AppLayout from "./components/AppLayout";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DogsProvider } from "./context/DogsContext";
import { CalendarProvider } from "./context/CalendarContext";
import { MedicationProvider } from "./context/MedicationContext";
import { ExerciseProvider } from "./context/ExerciseContext";
import { MealTimesProvider } from "./context/MealTimesContext";
import { SharedAccessProvider } from "./context/SharedAccessContext";

function AppContent() {
  const { user, loading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(
    !localStorage.getItem("onboarding_done"),
  );

  const handleOnboardingContinue = () => {
    localStorage.setItem("onboarding_done", "1");
    setShowOnboarding(false);
  };

  if (showOnboarding) {
    return <OnboardingScreen onContinue={handleOnboardingContinue} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-indigo-600">
        <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <DogsProvider>
      <CalendarProvider>
        <MedicationProvider>
          <ExerciseProvider>
            <MealTimesProvider>
              <SharedAccessProvider>
                <AppLayout />
              </SharedAccessProvider>
            </MealTimesProvider>
          </ExerciseProvider>
        </MedicationProvider>
      </CalendarProvider>
    </DogsProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
