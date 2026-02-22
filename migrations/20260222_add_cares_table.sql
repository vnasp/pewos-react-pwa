-- =============================================================
-- Migración: 20260222_add_cares_table
-- Descripción: Tabla para cuidados post-operatorios (limpiar herida,
--              aplicar frío/calor, luz infrarroja, láser, etc.)
-- =============================================================

CREATE TABLE cares (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                  UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  dog_id                   UUID REFERENCES dogs(id) ON DELETE CASCADE NOT NULL,
  type                     TEXT NOT NULL,
  custom_type_description  TEXT,
  duration_minutes         INTEGER DEFAULT 0,
  times_per_day            INTEGER DEFAULT 1,
  start_time               TEXT NOT NULL,
  end_time                 TEXT NOT NULL,
  scheduled_times          TEXT[]  DEFAULT '{}',
  start_date               DATE NOT NULL,
  is_permanent             BOOLEAN DEFAULT true,
  duration_days            INTEGER,
  end_date                 DATE,
  notes                    TEXT,
  is_active                BOOLEAN DEFAULT true,
  notification_time        TEXT DEFAULT 'none',
  created_at               TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at               TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE cares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own cares"
  ON cares
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
