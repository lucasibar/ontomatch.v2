# Debug de la Tabla Fotos

## Problema
El usuario tiene perfil pero no tiene fotos, por lo que el sistema debería considerarlo como perfil incompleto.

## Consultas SQL para Verificar

### 1. Verificar si la tabla fotos existe
```sql
-- Verificar si la tabla fotos existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'fotos';
```

### 2. Verificar estructura de la tabla fotos
```sql
-- Ver la estructura de la tabla fotos
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'fotos' 
ORDER BY ordinal_position;
```

### 3. Verificar si existen fotos para el usuario
```sql
-- Reemplaza 'USER_ID_AQUI' con el ID real del usuario
SELECT * FROM fotos WHERE user_id = 'USER_ID_AQUI';
```

### 4. Verificar todas las fotos existentes
```sql
-- Ver todas las fotos (útil para debug)
SELECT user_id, path, position, created_at 
FROM fotos 
ORDER BY created_at DESC 
LIMIT 10;
```

### 5. Verificar políticas RLS en fotos
```sql
-- Ver políticas de la tabla fotos
SELECT * FROM pg_policies WHERE tablename = 'fotos';
```

### 6. Verificar si RLS está habilitado en fotos
```sql
-- Verificar si RLS está habilitado en fotos
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'fotos';
```

## Crear Tabla Fotos (si no existe)

Si la tabla no existe, créala con esta estructura:

```sql
-- Crear tabla fotos
CREATE TABLE IF NOT EXISTS fotos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, position)
);

-- Habilitar RLS
ALTER TABLE fotos ENABLE ROW LEVEL SECURITY;

-- Política para SELECT (público para MVP)
CREATE POLICY "Photos are viewable by everyone" ON fotos
  FOR SELECT USING (true);

-- Política para INSERT/UPDATE/DELETE (solo dueño)
CREATE POLICY "Users can manage their own photos" ON fotos
  FOR ALL USING (auth.uid() = user_id);
```

## Verificar en el Frontend

Revisa la consola del navegador para ver los logs de:
- `Consulta a fotos - data:`
- `Usuario no tiene fotos - perfil incompleto`

Estos logs te dirán si:
1. La tabla fotos existe
2. El usuario tiene fotos
3. El perfil se considera completo o incompleto
