# Debug de la Tabla Profiles

## Problema
El usuario se autentica exitosamente pero no se muestra el formulario de registro. Esto sugiere que la función `checkUserProfile` está encontrando un perfil cuando no debería.

## Consultas SQL para Verificar

### 1. Verificar estructura de la tabla
```sql
-- Ver la estructura de la tabla
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
```

### 2. Verificar si existen perfiles para el usuario
```sql
-- Reemplaza 'USER_ID_AQUI' con el ID real del usuario
SELECT * FROM profiles WHERE id = 'USER_ID_AQUI';
```

### 3. Verificar todos los perfiles existentes
```sql
-- Ver todos los perfiles (útil para debug)
SELECT id, nombre_completo, email, created_at 
FROM profiles 
ORDER BY created_at DESC 
LIMIT 10;
```

### 4. Verificar políticas RLS en profiles
```sql
-- Ver políticas de la tabla profiles
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

### 5. Verificar si RLS está habilitado
```sql
-- Verificar si RLS está habilitado en profiles
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';
```

## Posibles Causas del Problema

1. **Perfil existente**: El usuario ya tiene un perfil en la base de datos
2. **Políticas RLS**: Las políticas están bloqueando la consulta
3. **Estructura de tabla**: La tabla no tiene los campos esperados
4. **Datos corruptos**: Hay datos inconsistentes en la tabla

## Solución Temporal

Si el usuario ya tiene un perfil y quieres que complete el formulario de nuevo:

```sql
-- Eliminar el perfil del usuario (reemplaza USER_ID_AQUI)
DELETE FROM profiles WHERE id = 'USER_ID_AQUI';
```

## Verificación en el Frontend

Revisa la consola del navegador para ver los logs de:
- `=== VERIFICANDO PERFIL ===`
- `=== AUTHFORM STATE ===`

Estos logs te dirán exactamente qué está pasando.

## 1. Verificar estructura de la tabla
```sql
-- Ver todas las columnas de la tabla profiles
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

## 2. Verificar triggers en la tabla
```sql
-- Ver todos los triggers en la tabla profiles
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'profiles';
```

## 3. Verificar datos actuales
```sql
-- Ver todos los perfiles existentes
SELECT * FROM profiles ORDER BY created_at DESC;
```

## 4. Verificar constraints
```sql
-- Ver constraints de la tabla
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'profiles';
```

## 5. Verificar enums
```sql
-- Ver tipos enum definidos
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN ('genero_enum', 'relacion_enum')
ORDER BY t.typname, e.enumsortorder;
```

## 6. Problema específico: updated_at
El error indica que hay un trigger o constraint que intenta acceder a `updated_at` pero esa columna no existe.

### Solución temporal:
```sql
-- Agregar columna updated_at si no existe
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

### O eliminar triggers problemáticos:
```sql
-- Ver triggers específicos
SELECT * FROM pg_trigger WHERE tgrelid = 'profiles'::regclass;

-- Eliminar trigger si es necesario
DROP TRIGGER IF EXISTS nombre_del_trigger ON profiles;
```
