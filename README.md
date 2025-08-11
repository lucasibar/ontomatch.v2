# OntoMatch v2

Plataforma de conexión para coaches ontológicos construida con React, TypeScript, Redux Toolkit y Supabase.

## Características

- **Autenticación completa** con Supabase
- **Registro de usuarios** con validación de fotos
- **Interfaz moderna** con Material-UI
- **Arquitectura limpia** con Redux Toolkit
- **Tipado completo** con TypeScript

## Requisitos

- Node.js 16+ 
- npm o yarn
- Cuenta de Supabase

## Instalación

1. Clona el repositorio:
```bash
git clone <repository-url>
cd ontomatch.v2
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
```bash
cp env.example .env.local
```

Edita el archivo `.env.local` y agrega tus credenciales de Supabase:
```
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

4. Ejecuta el proyecto en modo desarrollo:
```bash
npm run dev
```

El proyecto estará disponible en `http://localhost:3000`

## Estructura del Proyecto

```
src/
├── app/                 # Configuración de la aplicación
│   ├── App.tsx         # Componente principal
│   ├── store.ts        # Store de Redux
│   └── theme.ts        # Tema de Material-UI
├── entities/           # Tipos y entidades
│   └── user/           # Tipos de usuario
├── features/           # Funcionalidades
│   └── auth/           # Autenticación
├── pages/              # Páginas de la aplicación
├── shared/             # Componentes y utilidades compartidas
│   ├── config/         # Configuraciones
│   └── ui/             # Componentes UI
└── main.tsx           # Punto de entrada
```

## Configuración de Supabase

### 1. Tablas Requeridas

#### Tabla `profiles`
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  nombre_completo TEXT NOT NULL,
  email TEXT,
  busca TEXT[] CHECK (array_length(busca, 1) >= 1 AND array_length(busca, 1) <= 3),
  descripcion TEXT,
  escuela_id UUID REFERENCES escuelas_habilitadas(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Función para validar valores de busca
CREATE OR REPLACE FUNCTION busca_valida(busca TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) = array_length(busca, 1)
    FROM unnest(busca) AS valor
    WHERE valor IN ('pareja', 'amistad', 'negocios')
  );
END;
$$ LANGUAGE plpgsql;

-- Constraint para validar busca
ALTER TABLE profiles ADD CONSTRAINT check_busca_valida 
CHECK (busca_valida(busca));
```

#### Tabla `fotos`
```sql
CREATE TABLE fotos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  position INTEGER CHECK (position >= 1 AND position <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, position)
);
```

#### Tabla `escuelas_habilitadas`
```sql
CREATE TABLE escuelas_habilitadas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar escuela por defecto
INSERT INTO escuelas_habilitadas (nombre) 
VALUES ('Escuela Latinoamericana de Coaching Ontologico');
```

### 2. Políticas RLS

#### Para `profiles`
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- SELECT público
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

-- INSERT solo propio perfil
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- UPDATE solo propio perfil
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

#### Para `fotos`
```sql
ALTER TABLE fotos ENABLE ROW LEVEL SECURITY;

-- SELECT público (MVP)
CREATE POLICY "Photos are viewable by everyone" ON fotos
  FOR SELECT USING (true);

-- INSERT/UPDATE/DELETE solo dueño
CREATE POLICY "Users can manage their own photos" ON fotos
  FOR ALL USING (auth.uid() = user_id);
```

#### Para `escuelas_habilitadas`
```sql
ALTER TABLE escuelas_habilitadas ENABLE ROW LEVEL SECURITY;

-- SELECT público
CREATE POLICY "Schools are viewable by everyone" ON escuelas_habilitadas
  FOR SELECT USING (true);
```

### 3. Storage Bucket

#### Crear bucket `avatars`
```sql
-- En Supabase Dashboard > Storage
-- Crear bucket llamado "avatars" (privado)
```

#### Políticas de Storage
```sql
-- Política para INSERT/UPDATE/DELETE (solo dueño)
CREATE POLICY "Users can upload to their own folder" ON storage.objects
  FOR ALL USING (
    bucket_id = 'avatars' AND 
    split_part(name, '/', 1) = auth.uid()::text
  );

-- Política para SELECT (solo dueño - usamos Signed URLs)
CREATE POLICY "Users can view their own photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'avatars' AND 
    split_part(name, '/', 1) = auth.uid()::text
  );
```

### 4. Configuración de Auth

#### En Supabase Dashboard > Authentication > Settings:
- **Site URL**: `http://localhost:3000` (desarrollo)
- **Redirect URLs**: `http://localhost:3000/**`
- **Enable email confirmations**: Opcional (recomendado para producción)

## Scripts Disponibles

- `npm run dev` - Ejecuta el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la build de producción

## Despliegue en Cloudflare Pages

1. Conecta tu repositorio a Cloudflare Pages
2. Configura las variables de entorno en Cloudflare Pages:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Configura el comando de build: `npm run build`
4. Configura el directorio de salida: `dist`

## Tecnologías Utilizadas

- **React 18** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Redux Toolkit** - Manejo de estado
- **Material-UI** - Componentes de UI
- **React Router** - Enrutamiento
- **Supabase** - Backend como servicio
- **Vite** - Herramienta de build 
