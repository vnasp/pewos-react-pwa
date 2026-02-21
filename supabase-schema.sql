-- =============================================================
-- PEWOS — Schema consolidado de Supabase
-- Generado a partir de supabase-schema.sql + todas las migraciones
-- de dogs-calendar-react-native
-- =============================================================

-- Habilitar UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- =============================================================
-- TABLAS
-- =============================================================

-- Mascotas (originalmente "dogs")
CREATE TABLE dogs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name       TEXT NOT NULL,
  breed      TEXT,
  birth_date TEXT,
  gender     TEXT CHECK (gender IN ('male', 'female')),
  neutered   BOOLEAN DEFAULT false,
  weight     NUMERIC,
  photo_uri  TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Citas / Calendario
-- Tipos válidos: control, examenes, operacion, fisioterapia, vacuna, desparasitacion, otro
-- (radiografia y prequirurgico fueron migrados a "examenes")
CREATE TABLE appointments (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                  UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  dog_id                   UUID REFERENCES dogs(id) ON DELETE CASCADE NOT NULL,
  type                     TEXT NOT NULL CHECK (type IN ('control', 'examenes', 'operacion', 'fisioterapia', 'vacuna', 'desparasitacion', 'otro')),
  title                    TEXT NOT NULL,
  date                     TEXT NOT NULL,
  time                     TEXT NOT NULL,
  location                 TEXT,
  notes                    TEXT,
  notification_time        TEXT,
  -- Migración: add_appointments_recurrence
  custom_type_description  TEXT,
  recurrence_pattern       TEXT CHECK (recurrence_pattern IN ('daily', 'weekly', 'biweekly', 'monthly', 'none')),
  recurrence_end_date      TEXT,
  recurrence_parent_id     UUID REFERENCES appointments(id) ON DELETE CASCADE,
  created_at               TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at               TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON COLUMN appointments.custom_type_description IS 'Descripción personalizada cuando el tipo es "otro"';
COMMENT ON COLUMN appointments.recurrence_pattern      IS 'Patrón de recurrencia: daily, weekly, biweekly, monthly, none';
COMMENT ON COLUMN appointments.recurrence_end_date     IS 'Fecha de fin para citas recurrentes (formato YYYY-MM-DD)';
COMMENT ON COLUMN appointments.recurrence_parent_id    IS 'ID de la cita padre para citas generadas por recurrencia';

-- Medicamentos
-- Soporta dos modos de programación:
--   'hours' → cada X horas (frequency_hours y start_time requeridos)
--   'meals' → con comidas (meal_ids requerido)
CREATE TABLE medications (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  dog_id            UUID REFERENCES dogs(id) ON DELETE CASCADE NOT NULL,
  name              TEXT NOT NULL,
  dosage            TEXT,
  -- Migración: alter_medications_add_schedule_type (frequency_hours y start_time ahora son opcionales)
  frequency_hours   INTEGER,
  start_date        TEXT NOT NULL,
  start_time        TEXT,
  duration_days     INTEGER NOT NULL,
  end_date          TEXT,
  times             JSONB NOT NULL DEFAULT '[]',
  notes             TEXT,
  notification_time TEXT,
  notification_ids  JSONB DEFAULT '[]',
  is_active         BOOLEAN DEFAULT true,
  -- Migración: alter_medications_add_schedule_type
  schedule_type     TEXT NOT NULL DEFAULT 'hours' CHECK (schedule_type IN ('hours', 'meals')),
  meal_ids          UUID[],
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT check_schedule_type_hours CHECK (
    (schedule_type = 'hours' AND frequency_hours IS NOT NULL AND start_time IS NOT NULL)
    OR
    (schedule_type = 'meals' AND meal_ids IS NOT NULL AND array_length(meal_ids, 1) > 0)
    OR schedule_type NOT IN ('hours', 'meals')
  )
);

COMMENT ON COLUMN medications.schedule_type IS 'Tipo de programación: "hours" (cada X horas) o "meals" (con comidas)';
COMMENT ON COLUMN medications.meal_ids      IS 'Array de IDs de meal_times cuando schedule_type="meals"';

-- Ejercicios
-- Migración: update_exercises_types → tipos en español
-- Migración: add_exercise_duration     → start_date, is_permanent, duration_weeks, end_date
-- Migración: alter_exercises_add_custom_type_description → custom_type_description
CREATE TABLE exercises (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  dog_id                  UUID REFERENCES dogs(id) ON DELETE CASCADE NOT NULL,
  type                    TEXT NOT NULL CHECK (type IN ('caminata', 'cavaletti', 'balanceo', 'slalom', 'entrenamiento', 'otro')),
  title                   TEXT NOT NULL,
  duration_minutes        INTEGER,
  times_per_day           INTEGER NOT NULL,
  start_time              TEXT NOT NULL,
  end_time                TEXT NOT NULL,
  scheduled_times         JSONB NOT NULL DEFAULT '[]',
  start_date              TEXT NOT NULL DEFAULT (CURRENT_DATE::TEXT),
  is_permanent            BOOLEAN DEFAULT true,
  duration_weeks          INTEGER,
  end_date                TEXT,
  custom_type_description TEXT,
  notes                   TEXT,
  notification_time       TEXT,
  notification_ids        JSONB DEFAULT '[]',
  is_active               BOOLEAN DEFAULT true,
  created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON COLUMN exercises.start_date              IS 'Fecha de inicio del tratamiento (formato YYYY-MM-DD)';
COMMENT ON COLUMN exercises.is_permanent            IS 'Si es verdadero, el ejercicio es permanente. Si es falso, tiene duración limitada';
COMMENT ON COLUMN exercises.duration_weeks          IS 'Duración en semanas (solo aplica si is_permanent es falso)';
COMMENT ON COLUMN exercises.end_date                IS 'Fecha de finalización calculada (formato YYYY-MM-DD, solo si is_permanent es falso)';
COMMENT ON COLUMN exercises.custom_type_description IS 'Descripción personalizada cuando type es "otro"';

-- Acceso compartido entre usuarios
CREATE TABLE shared_access (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shared_with_email TEXT NOT NULL,
  shared_with_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status           TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(owner_id, shared_with_email)
);

-- Horarios de comidas configurables por usuario
-- Migración: create_meal_times_table (integrada directamente)
CREATE TABLE meal_times (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  time        TIME NOT NULL,
  order_index INTEGER NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT check_order_index_positive CHECK (order_index > 0),
  CONSTRAINT check_name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

COMMENT ON TABLE  meal_times             IS 'Horarios de comidas configurables por usuario para programar medicamentos';
COMMENT ON COLUMN meal_times.name        IS 'Nombre personalizable de la comida (ej: Desayuno, Merienda)';
COMMENT ON COLUMN meal_times.time        IS 'Hora de la comida en formato HH:MM';
COMMENT ON COLUMN meal_times.order_index IS 'Orden de la comida en el día (1, 2, 3, 4...)';

-- Completions — registro de tareas completadas
-- Migración: create_completions_table + alter_completions_add_scheduled_time (integradas)
CREATE TABLE completions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_type      TEXT NOT NULL CHECK (item_type IN ('medication', 'exercise', 'appointment')),
  item_id        UUID NOT NULL,
  scheduled_time TEXT,
  completed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(item_id, item_type, completed_date, scheduled_time)
);

COMMENT ON TABLE  completions                IS 'Registra cuando los usuarios completan tareas (medicaciones, ejercicios, citas)';
COMMENT ON COLUMN completions.item_type      IS 'Tipo de tarea: medication, exercise, o appointment';
COMMENT ON COLUMN completions.item_id        IS 'ID de la tarea completada';
COMMENT ON COLUMN completions.scheduled_time IS 'Horario específico (HH:mm) para medicamentos y ejercicios que se dan múltiples veces al día';
COMMENT ON COLUMN completions.completed_date IS 'Fecha en que se completó (permite múltiples completions por día si aplica)';
COMMENT ON COLUMN completions.completed_at   IS 'Timestamp exacto de cuando se marcó como completado';


-- =============================================================
-- ÍNDICES
-- =============================================================

CREATE INDEX dogs_user_id_idx                          ON dogs(user_id);
CREATE INDEX appointments_user_id_idx                  ON appointments(user_id);
CREATE INDEX appointments_dog_id_idx                   ON appointments(dog_id);
CREATE INDEX appointments_date_idx                     ON appointments(date);
CREATE INDEX appointments_recurrence_parent_id_idx     ON appointments(recurrence_parent_id);
CREATE INDEX medications_user_id_idx                   ON medications(user_id);
CREATE INDEX medications_dog_id_idx                    ON medications(dog_id);
CREATE INDEX medications_is_active_idx                 ON medications(is_active);
CREATE INDEX exercises_user_id_idx                     ON exercises(user_id);
CREATE INDEX exercises_dog_id_idx                      ON exercises(dog_id);
CREATE INDEX exercises_is_active_idx                   ON exercises(is_active);
CREATE INDEX shared_access_owner_id_idx                ON shared_access(owner_id);
CREATE INDEX shared_access_shared_with_id_idx          ON shared_access(shared_with_id);
CREATE INDEX idx_meal_times_user_order                 ON meal_times(user_id, order_index);
CREATE INDEX idx_meal_times_user                       ON meal_times(user_id);
CREATE INDEX idx_completions_item                      ON completions(item_id, item_type);
CREATE INDEX idx_completions_date                      ON completions(completed_date);
CREATE INDEX idx_completions_user                      ON completions(user_id);


-- =============================================================
-- FUNCIONES Y TRIGGERS
-- =============================================================

-- Función genérica para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dogs_updated_at
  BEFORE UPDATE ON dogs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medications_updated_at
  BEFORE UPDATE ON medications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at
  BEFORE UPDATE ON exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para crear comidas por defecto al registrarse un usuario
CREATE OR REPLACE FUNCTION create_default_meal_times()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO meal_times (user_id, name, time, order_index) VALUES
    (NEW.id, 'Desayuno', '08:00', 1),
    (NEW.id, 'Almuerzo', '14:00', 2),
    (NEW.id, 'Cena',     '20:00', 3);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_meal_times
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_meal_times();


-- =============================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================

ALTER TABLE dogs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises     ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_times    ENABLE ROW LEVEL SECURITY;
ALTER TABLE completions   ENABLE ROW LEVEL SECURITY;

-- dogs
CREATE POLICY "Users can view their own dogs"
ON dogs FOR SELECT
USING (
  user_id = auth.uid()
  OR user_id IN (
    SELECT owner_id FROM shared_access
    WHERE shared_with_id = auth.uid() AND status = 'accepted'
  )
);
CREATE POLICY "Users can insert their own dogs"   ON dogs FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own dogs"   ON dogs FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete their own dogs"   ON dogs FOR DELETE USING (user_id = auth.uid());

-- appointments
CREATE POLICY "Users can view their own appointments"
ON appointments FOR SELECT
USING (
  user_id = auth.uid()
  OR user_id IN (
    SELECT owner_id FROM shared_access
    WHERE shared_with_id = auth.uid() AND status = 'accepted'
  )
);
CREATE POLICY "Users can insert their own appointments" ON appointments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own appointments" ON appointments FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete their own appointments" ON appointments FOR DELETE USING (user_id = auth.uid());

-- medications
CREATE POLICY "Users can view their own medications"
ON medications FOR SELECT
USING (
  user_id = auth.uid()
  OR user_id IN (
    SELECT owner_id FROM shared_access
    WHERE shared_with_id = auth.uid() AND status = 'accepted'
  )
);
CREATE POLICY "Users can insert their own medications" ON medications FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own medications" ON medications FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete their own medications" ON medications FOR DELETE USING (user_id = auth.uid());

-- exercises
CREATE POLICY "Users can view their own exercises"
ON exercises FOR SELECT
USING (
  user_id = auth.uid()
  OR user_id IN (
    SELECT owner_id FROM shared_access
    WHERE shared_with_id = auth.uid() AND status = 'accepted'
  )
);
CREATE POLICY "Users can insert their own exercises" ON exercises FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own exercises" ON exercises FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete their own exercises" ON exercises FOR DELETE USING (user_id = auth.uid());

-- shared_access
CREATE POLICY "Users can view their own shared access"    ON shared_access FOR SELECT USING (owner_id = auth.uid() OR shared_with_id = auth.uid());
CREATE POLICY "Users can create shared access"            ON shared_access FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Users can update their own shared access"  ON shared_access FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Shared users can update their access status" ON shared_access FOR UPDATE USING (shared_with_id = auth.uid()) WITH CHECK (shared_with_id = auth.uid());
CREATE POLICY "Users can delete their own shared access"  ON shared_access FOR DELETE USING (owner_id = auth.uid());

-- meal_times
CREATE POLICY "Users can view their own meal times"   ON meal_times FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own meal times" ON meal_times FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own meal times" ON meal_times FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own meal times" ON meal_times FOR DELETE USING (auth.uid() = user_id);

-- completions
CREATE POLICY "Users can view own and shared completions"
ON completions FOR SELECT
USING (
  user_id = auth.uid()
  OR user_id IN (
    SELECT owner_id FROM shared_access
    WHERE shared_with_id = auth.uid() AND status = 'accepted'
  )
  OR user_id IN (
    SELECT shared_with_id FROM shared_access
    WHERE owner_id = auth.uid() AND status = 'accepted'
  )
);
CREATE POLICY "Users can create own completions" ON completions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own completions" ON completions FOR DELETE USING (user_id = auth.uid());


-- =============================================================
-- STORAGE — Bucket dog-photos
-- =============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('dog-photos', 'dog-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Eliminar políticas previas para evitar conflictos
DROP POLICY IF EXISTS "Public Access"                   ON storage.objects;
DROP POLICY IF EXISTS "Public read access"              ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload"  ON storage.objects;
DROP POLICY IF EXISTS "Users can update own photos"     ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images"     ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own photos"     ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images"     ON storage.objects;

CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'dog-photos');

CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'dog-photos');

CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'dog-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'dog-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
