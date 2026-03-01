-- =============================================================
-- Migración: 20260301_add_days_of_week_to_cares
-- Descripción: Agrega columna days_of_week para especificar
--              qué días de la semana se realiza el cuidado
--              (por ejemplo, solo martes y viernes)
-- =============================================================

-- Agregar columna days_of_week como array de enteros (0=Domingo, 1=Lunes, ..., 6=Sábado)
-- Si es NULL o array vacío, se aplica todos los días
ALTER TABLE cares 
ADD COLUMN days_of_week INTEGER[] DEFAULT NULL;

COMMENT ON COLUMN cares.days_of_week IS 'Días de la semana en que se realiza el cuidado (0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado). NULL o vacío = todos los días';
