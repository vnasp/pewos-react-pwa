-- Tabla de veterinarios
CREATE TABLE IF NOT EXISTS veterinarians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dog_id UUID NOT NULL,
  dog_name TEXT NOT NULL,
  name TEXT NOT NULL,
  clinic_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_veterinarians_user_id ON veterinarians(user_id);
CREATE INDEX IF NOT EXISTS idx_veterinarians_dog_id ON veterinarians(dog_id);

-- Habilitar RLS
ALTER TABLE veterinarians ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propios veterinarios
CREATE POLICY "Users can view their own veterinarians"
  ON veterinarians FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden insertar sus propios veterinarios
CREATE POLICY "Users can insert their own veterinarians"
  ON veterinarians FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden actualizar sus propios veterinarios
CREATE POLICY "Users can update their own veterinarians"
  ON veterinarians FOR UPDATE
  USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden eliminar sus propios veterinarios
CREATE POLICY "Users can delete their own veterinarians"
  ON veterinarians FOR DELETE
  USING (auth.uid() = user_id);
