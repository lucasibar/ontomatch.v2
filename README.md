# OntoMatch v2 - Plataforma de Conexión para Coaches Ontológicos

Una aplicación de matching moderna para conectar profesionales del coaching ontológico, construida con React, TypeScript, Supabase y Ably.

## 🚀 Características

### ✅ Autenticación
- Login/Registro unificado con email
- Verificación de perfiles completos
- Gestión de sesiones persistentes

### ✅ Matching
- Algoritmo de compatibilidad basado en preferencias
- Sistema de likes y matches automáticos
- Interfaz de swipe intuitiva
- Lista de matches y likes recibidos

### ✅ Chat en Tiempo Real
- Mensajería instantánea con Ably
- Persistencia de mensajes en Supabase
- Indicadores de lectura y presencia
- Interfaz de chat moderna

### ✅ Perfiles de Usuario
- Gestión completa de perfiles
- Subida de fotos múltiples
- Preferencias de matching
- Información de escuelas

## 🛠️ Tecnologías

- **Frontend**: React 18, TypeScript, Redux Toolkit
- **UI**: Material-UI + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Tiempo Real**: Ably
- **Build**: Vite

## 📦 Instalación

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd ontomatch.v2
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crear un archivo `.env` en la raíz del proyecto:

```env
# Supabase
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Ably
VITE_ABLY_API_KEY=your-ably-api-key
```

### 4. Configurar Supabase
Ejecutar los comandos SQL proporcionados en la documentación de la base de datos para crear todas las tablas, funciones y políticas necesarias.

### 5. Ejecutar la aplicación
```bash
npm run dev
```

## 🗄️ Base de Datos

### Tablas Principales
- `profiles` - Perfiles de usuario
- `fotos` - Fotos de usuario
- `matches` - Matches entre usuarios
- `likes` - Likes unidireccionales
- `chats` - Chats para matches
- `messages` - Mensajes de chat
- `escuelas_habilitadas` - Escuelas disponibles

### Funciones SQL
- `get_compatible_users()` - Obtener usuarios compatibles
- `create_mutual_match()` - Crear matches automáticos
- `update_updated_at_column()` - Actualizar timestamps

### Políticas RLS
- Acceso controlado a todos los datos
- Usuarios solo pueden ver/modificar sus propios datos
- Chats solo accesibles para participantes

## 🎯 Funcionalidades Principales

### Sistema de Matching
1. **Algoritmo de Compatibilidad**: Basado en género, preferencias y búsquedas
2. **Likes Automáticos**: Creación automática de matches cuando hay like mutuo
3. **Interfaz de Swipe**: Navegación intuitiva entre usuarios
4. **Filtros Inteligentes**: Exclusión de usuarios ya vistos

### Chat en Tiempo Real
1. **Mensajería Instantánea**: Conectividad en tiempo real con Ably
2. **Persistencia**: Todos los mensajes se guardan en Supabase
3. **Indicadores**: Estado de lectura y presencia online
4. **Notificaciones**: Alertas de nuevos mensajes

### Gestión de Perfiles
1. **Fotos Múltiples**: Hasta 6 fotos por usuario
2. **Preferencias Detalladas**: Género, búsquedas, intereses
3. **Información Académica**: Escuelas y especializaciones
4. **Ubicación**: Coordenadas GPS para proximidad

## 📱 Páginas Principales

- **Home** (`/`) - Dashboard principal
- **Swipe** (`/swipe`) - Descubrir usuarios
- **Matches** (`/matches`) - Ver matches
- **Chat** (`/chat/:matchId`) - Mensajería
- **Auth** (`/auth`) - Login/Registro

## 🔧 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build de producción
- `npm run preview` - Previsualizar build

## 🚀 Despliegue

### Cloudflare Pages
1. Conectar repositorio a Cloudflare Pages
2. Configurar variables de entorno
3. Build command: `npm run build`
4. Output directory: `dist`

### Variables de Entorno Requeridas
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ABLY_API_KEY`

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🆘 Soporte

Para soporte técnico o preguntas, contactar al equipo de desarrollo.

---

**OntoMatch v2** - Conectando coaches ontológicos desde 2024 🎯 
