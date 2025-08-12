# Configuración de Storage en Supabase

## Problema del Error 400

El error 400 al subir imágenes generalmente se debe a problemas de configuración en Supabase. Sigue estos pasos para solucionarlo:

## 1. Crear el Bucket "avatars"

En Supabase Dashboard > Storage:
1. Click en "New bucket"
2. Nombre: `avatars`
3. **IMPORTANTE**: Marca como **Private** (no público)
4. Click en "Create bucket"

## 2. Configurar Políticas RLS (Row Level Security)

Ejecuta estas consultas SQL en el Editor SQL de Supabase:

### Política para INSERT (subir archivos)
```sql
CREATE POLICY "Users can upload to their own folder" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND 
  split_part(name, '/', 1) = auth.uid()::text
);
```

### Política para SELECT (leer archivos)
```sql
CREATE POLICY "Users can view their own photos" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'avatars' AND 
  split_part(name, '/', 1) = auth.uid()::text
);
```

### Política para UPDATE (actualizar archivos)
```sql
CREATE POLICY "Users can update their own photos" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars' AND 
  split_part(name, '/', 1) = auth.uid()::text
);
```

### Política para DELETE (eliminar archivos)
```sql
CREATE POLICY "Users can delete their own photos" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars' AND 
  split_part(name, '/', 1) = auth.uid()::text
);
```

## 3. Verificar Configuración

### Verificar que RLS esté habilitado
```sql
-- Verificar que RLS esté habilitado en storage.objects
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'objects' AND schemaname = 'storage';
```

### Verificar políticas existentes
```sql
-- Ver todas las políticas en storage.objects
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
```

## 4. Configuración del Frontend

El código ya está configurado correctamente con:
- Extensión de archivo dinámica
- Content-Type correcto
- Verificación de sesión
- Manejo de errores mejorado

## 5. Troubleshooting

### Si sigue el error 400:

1. **Verificar sesión**: Asegúrate de que el usuario esté autenticado
2. **Verificar bucket**: Confirma que el bucket `avatars` existe
3. **Verificar políticas**: Ejecuta las políticas SQL anteriores
4. **Verificar permisos**: El usuario debe tener permisos de autenticación

### Logs útiles:
El código ahora incluye logs detallados en la consola del navegador que te ayudarán a identificar el problema específico.

## 6. Prueba de Funcionamiento

Después de aplicar estos cambios:
1. Inicia sesión en la aplicación
2. Intenta subir una imagen
3. Revisa la consola del navegador para ver los logs
4. Verifica en Supabase Dashboard > Storage que la imagen se subió correctamente
