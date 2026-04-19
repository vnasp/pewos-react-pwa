# Pewos - Agenda para Mascotas

Aplicación web progresiva (PWA) para gestionar la agenda de tus mascotas. Permite registrar perros, medicaciones, ejercicios, cuidados, horarios de comida, citas veterinarias y más, con calendario integrado y notificaciones push.

> Nota: Proyecto personal en desarrollo. Requiere configurar Supabase para funcionar localmente.

## Funcionalidades

- Registro y gestión de perros con perfiles individuales
- Calendario de actividades y citas
- Control de medicaciones con recordatorios
- Registro de ejercicios y paseos
- Gestión de cuidados recurrentes (por día de la semana)
- Horarios de comida configurables
- Directorio de veterinarios con citas
- Acceso compartido entre usuarios
- Notificaciones push (Service Worker)
- Instalable como PWA (Progressive Web App)
- Onboarding y autenticación con Supabase Auth

## Tecnologías

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- Supabase (Auth, Database)
- Vite PWA Plugin + Workbox
- Lucide React (iconos)

## Configuración local

1. Clonar el repositorio
2. Copiar `.env.example` a `.env` y completar las variables de Supabase
3. Instalar dependencias e iniciar:

```bash
npm install
npm run dev
```

## Estructura del Proyecto

```
pewos-react-pwa/
├── migrations/              # Scripts SQL de migración
├── public/
│   └── assets/              # Iconos PWA y splash
├── src/
│   ├── components/
│   │   ├── AppLayout.tsx
│   │   ├── Header.tsx
│   │   ├── TabBar.tsx
│   │   ├── calendar/
│   │   └── home/
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   ├── DogsContext.tsx
│   │   ├── CalendarContext.tsx
│   │   ├── MedicationContext.tsx
│   │   ├── ExerciseContext.tsx
│   │   ├── CareContext.tsx
│   │   ├── MealTimesContext.tsx
│   │   ├── SharedAccessContext.tsx
│   │   └── VeterinariansContext.tsx
│   ├── hooks/
│   │   ├── useNotificationScheduler.ts
│   │   ├── usePushSubscription.ts
│   │   └── usePwaUpdate.ts
│   ├── screens/             # Pantallas de la app
│   ├── App.tsx
│   └── main.tsx
├── vite.config.ts
└── package.json
```
