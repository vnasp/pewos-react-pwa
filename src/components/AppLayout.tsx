import { useState, useEffect } from "react";
import Header from "./Header";
import TabBar from "./TabBar";
import InstallBanner from "./InstallBanner";
import { useNotificationScheduler } from "../hooks/useNotificationScheduler";
import { usePushSubscription } from "../hooks/usePushSubscription";
import { requestNotificationPermission } from "../utils/notifications";

// Screens
import HomeScreen from "../screens/HomeScreen";
import DogsListScreen from "../screens/DogsListScreen";
import AddEditDogScreen from "../screens/AddEditDogScreen";
import CalendarListScreen from "../screens/CalendarListScreen";
import AddEditAppointmentScreen from "../screens/AddEditAppointmentScreen";
import MedicationsListScreen from "../screens/MedicationsListScreen";
import AddEditMedicationScreen from "../screens/AddEditMedicationScreen";
import ExercisesListScreen from "../screens/ExercisesListScreen";
import AddEditExerciseScreen from "../screens/AddEditExerciseScreen";
import CaresListScreen from "../screens/CaresListScreen";
import AddEditCareScreen from "../screens/AddEditCareScreen";
import MealTimesSettingsScreen from "../screens/MealTimesSettingsScreen";
import SharedAccessScreen from "../screens/SharedAccessScreen";
import SettingsScreen from "../screens/SettingsScreen";
import VeterinariansListScreen from "../screens/VeterinariansListScreen";
import AddEditVeterinarianScreen from "../screens/AddEditVeterinarianScreen";

type Tab = "home" | "pets" | "appointments" | "settings";

type SubScreen =
  | { kind: "none" }
  | { kind: "addEditDog"; dogId?: string }
  | { kind: "addEditAppointment"; appointmentId?: string }
  | { kind: "addEditMedication"; medicationId?: string }
  | { kind: "addEditExercise"; exerciseId?: string }
  | { kind: "addEditCare"; careId?: string }
  | { kind: "mealTimes" }
  | { kind: "sharedAccess" }
  | { kind: "medications" }
  | { kind: "exercises" }
  | { kind: "cares" }
  | { kind: "veterinarians" }
  | { kind: "addEditVeterinarian"; veterinarianId?: string };

const screenTitles: Record<Tab, { title1: string; title2: string }> = {
  home: { title1: "Recordatorios", title2: "de Hoy" },
  pets: { title1: "Mis", title2: "Mascotas" },
  appointments: { title1: "Agenda", title2: "Mascotas" },
  settings: { title1: "Mis", title2: "Ajustes" },
};

const subScreenTitles: Partial<
  Record<SubScreen["kind"], { title1: string; title2: string }>
> = {
  addEditDog: { title1: "Mascota", title2: "" },
  addEditAppointment: { title1: "Nueva", title2: "Cita" },
  addEditMedication: { title1: "Medica-", title2: "mento" },
  addEditExercise: { title1: "Rutina de", title2: "Ejercicio" },
  addEditCare: { title1: "Cuidado", title2: "Operatorios" },
  mealTimes: { title1: "Horarios de", title2: "Comida" },
  sharedAccess: { title1: "Acceso", title2: "Compartido" },
  medications: { title1: "Medica-", title2: "mentos" },
  exercises: { title1: "Rutinas de", title2: "Ejercicio" },
  cares: { title1: "Cuidados", title2: "Operatorios" },
  veterinarians: { title1: "Veteri-", title2: "narios" },
  addEditVeterinarian: { title1: "Veteri-", title2: "nario" },
};

export default function AppLayout() {
  const [currentTab, setCurrentTab] = useState<Tab>("home");
  const [subScreen, setSubScreen] = useState<SubScreen>({ kind: "none" });

  // Pedir permiso de notificación al montar y programar notificaciones de hoy
  useEffect(() => {
    requestNotificationPermission();
  }, []);
  useNotificationScheduler();
  usePushSubscription(); // Web Push (iOS Safari + Android background)

  const isSubScreen = subScreen.kind !== "none";

  const handleTabNavigate = (tab: string) => {
    setSubScreen({ kind: "none" });
    setCurrentTab(tab as Tab);
  };

  const handleBack = () => setSubScreen({ kind: "none" });

  let title1 = screenTitles[currentTab].title1;
  let title2 = screenTitles[currentTab].title2;
  if (isSubScreen && subScreenTitles[subScreen.kind]) {
    title1 = subScreenTitles[subScreen.kind]!.title1;
    title2 = subScreenTitles[subScreen.kind]!.title2;
  }

  const showAddForTab =
    !isSubScreen && (currentTab === "pets" || currentTab === "appointments");
  const showAddForSub =
    subScreen.kind === "medications" ||
    subScreen.kind === "exercises" ||
    subScreen.kind === "cares" ||
    subScreen.kind === "veterinarians";

  const handleAdd = () => {
    if (currentTab === "pets") setSubScreen({ kind: "addEditDog" });
    else if (currentTab === "appointments")
      setSubScreen({ kind: "addEditAppointment" });
  };
  const handleAddSub = () => {
    if (subScreen.kind === "medications")
      setSubScreen({ kind: "addEditMedication" });
    else if (subScreen.kind === "exercises")
      setSubScreen({ kind: "addEditExercise" });
    else if (subScreen.kind === "cares") setSubScreen({ kind: "addEditCare" });
    else if (subScreen.kind === "veterinarians")
      setSubScreen({ kind: "addEditVeterinarian" });
  };

  const renderContent = () => {
    switch (subScreen.kind) {
      case "addEditDog":
        return (
          <AddEditDogScreen
            dogId={subScreen.dogId}
            onNavigateBack={handleBack}
          />
        );
      case "addEditAppointment":
        return (
          <AddEditAppointmentScreen
            appointmentId={subScreen.appointmentId}
            onNavigateBack={handleBack}
          />
        );
      case "addEditMedication":
        return (
          <AddEditMedicationScreen
            medicationId={subScreen.medicationId}
            onNavigateBack={handleBack}
          />
        );
      case "addEditExercise":
        return (
          <AddEditExerciseScreen
            exerciseId={subScreen.exerciseId}
            onNavigateBack={handleBack}
          />
        );
      case "addEditCare":
        return (
          <AddEditCareScreen
            careId={subScreen.careId}
            onNavigateBack={handleBack}
          />
        );
      case "mealTimes":
        return <MealTimesSettingsScreen />;
      case "sharedAccess":
        return <SharedAccessScreen />;
      case "medications":
        return (
          <MedicationsListScreen
            onNavigateToAddEdit={(id) =>
              setSubScreen({ kind: "addEditMedication", medicationId: id })
            }
          />
        );
      case "exercises":
        return (
          <ExercisesListScreen
            onNavigateToAddEdit={(id) =>
              setSubScreen({ kind: "addEditExercise", exerciseId: id })
            }
          />
        );
      case "cares":
        return (
          <CaresListScreen
            onNavigateToAddEdit={(id) =>
              setSubScreen({ kind: "addEditCare", careId: id })
            }
          />
        );
      case "veterinarians":
        return (
          <VeterinariansListScreen
            onNavigateToAddEdit={(id) =>
              setSubScreen({ kind: "addEditVeterinarian", veterinarianId: id })
            }
          />
        );
      case "addEditVeterinarian":
        return (
          <AddEditVeterinarianScreen
            veterinarianId={subScreen.veterinarianId}
            onNavigateBack={handleBack}
          />
        );
    }

    switch (currentTab) {
      case "home":
        return (
          <HomeScreen
            onNavigateToMedications={() =>
              setSubScreen({ kind: "medications" })
            }
            onNavigateToCalendar={() => {
              setSubScreen({ kind: "none" });
              setCurrentTab("appointments");
            }}
            onNavigateToExercises={() => setSubScreen({ kind: "exercises" })}
            onNavigateToCares={() => setSubScreen({ kind: "cares" })}
          />
        );
      case "pets":
        return (
          <DogsListScreen
            onNavigateToAddEdit={(id) =>
              setSubScreen({ kind: "addEditDog", dogId: id })
            }
            onNavigateToMealTimes={() => setSubScreen({ kind: "mealTimes" })}
          />
        );
      case "appointments":
        return (
          <CalendarListScreen
            onNavigateToAddEdit={(id) =>
              setSubScreen({ kind: "addEditAppointment", appointmentId: id })
            }
          />
        );
      case "settings":
        return (
          <SettingsScreen
            onNavigateToMealTimes={() => setSubScreen({ kind: "mealTimes" })}
            onNavigateToSharedAccess={() =>
              setSubScreen({ kind: "sharedAccess" })
            }
            onNavigateToMedications={() =>
              setSubScreen({ kind: "medications" })
            }
            onNavigateToExercises={() => setSubScreen({ kind: "exercises" })}
            onNavigateToCares={() => setSubScreen({ kind: "cares" })}
          />
        );
    }
  };

  return (
    <div className="flex flex-col h-svh w-full overflow-hidden">
      <InstallBanner />

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Sidebar para desktop */}
        <TabBar currentScreen={currentTab} onNavigate={handleTabNavigate} />

        {/* Contenido principal */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header
            title1={title1}
            title2={title2}
            showAddButton={showAddForTab || showAddForSub}
            onAddPress={showAddForSub ? handleAddSub : handleAdd}
            onVetPress={() => setSubScreen({ kind: "veterinarians" })}
          />
          <main className="flex-1 bg-white rounded-t-[30px] lg:rounded-t-[40px] -mt-7.5 overflow-y-auto relative z-10 lg:max-w-6xl lg:mx-auto lg:w-full">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
}
