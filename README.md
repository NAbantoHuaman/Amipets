# Amipets 🐾 — Sistema de Gestión de Solicitudes de Atención Veterinaria

> Aplicación móvil profesional desarrollada en **React Native** con TypeScript para la gestión, priorización y seguimiento del flujo de atenciones en la clínica veterinaria Amipets.

---

## 👥 Datos del Proyecto y Equipo de Desarrollo

- **Institución:** Escuela de Tecnología — IDAT
- **Curso:** Desarrollo de Aplicaciones Móviles
- **Integrantes:**
  1. **Nestor Jose Abanto Huaman** — Arquitectura de Software, Modelado de Datos y Gestión de Estado Global (`models/`, `store/`, `context/`)
  2. **Elmo Torres Ordoñez** — Diseño UI/UX, Sistema de Diseño, Tokens y Componentes Reutilizables (`components/`, `theme/`)
  3. **Joel Yaro Leguia** — Pantallas Asistenciales, Navegación, Lógica de Negocio y Flujo CRUD (`screens/`, `navigation/`, `utils/`)

---

## 📋 Contexto y Problemática

Una clínica veterinaria que brinda servicios de **consultas, vacunación, emergencias y grooming** registraba diariamente sus solicitudes mediante canales informales (WhatsApp y llamadas telefónicas). Esta práctica generaba:
1. **Pérdida de información** de los pacientes y tutores.
2. **Duplicidad de registros**.
3. **Falta de visibilidad sobre el estado de cada atención** (`PENDIENTE`, `EN_ATENCION`, `FINALIZADO`).
4. **Falta de priorización médica** para urgencias que requieren atención inmediata.

### Solución Implementada: **Amipets**
Una aplicación móvil desacoplada, moderna y reactiva que centraliza el registro, seguimiento y ciclo de vida de cada solicitud de atención, optimizando la toma de decisiones clínicas y ofreciendo una experiencia de usuario (UI/UX) de alto nivel.

---

## 🚀 Requisitos del Entorno

Asegúrate de contar con las siguientes herramientas instaladas en tu equipo:

- **Node.js:** Versión 18.x o 20.x LTS ([Descargar Node.js](https://nodejs.org/))
- **Gestor de paquetes:** `npm` (incluido con Node.js) o `yarn`
- **Git:** Para clonar el repositorio y control de versiones
- **Para Android:**
  - Android Studio con SDK Platform (API 33 o superior).
  - Herramientas de compilación: Android SDK Build-Tools.
  - JDK 17 (Java Development Kit).
  - Variable de entorno `ANDROID_HOME` configurada y agregada al `PATH`.
  - Emulador Android (AVD) o dispositivo físico con Depuración USB habilitada.
- **Para iOS (exclusivo macOS):**
  - Xcode 15 o superior.
  - CocoaPods (`sudo gem install cocoapods`).
  - Simulador de iOS configurado.
- **Alternativa Rápida (Cualquier plataforma / Dispositivo físico):**
  - Aplicación **Expo Go** disponible en Google Play Store o Apple App Store.

---

## 📦 Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone <URL_DEL_REPOSITORIO_GITHUB>
   cd app/Amipets
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

---

## ▶️ Ejecución del Proyecto

### Opción A: Servidor Interactivo Expo / React Native (Recomendado)
Inicia el empaquetador Metro y selecciona la plataforma deseada en el menú interactivo:
```bash
npm run start
# o con npx:
npx expo start
```
- Presiona `a` para abrir en **Emulador Android**.
- Presiona `i` para abrir en **Simulador iOS** (en macOS).
- Presiona `w` para abrir en **Navegador Web**.
- O escanea el **código QR** desde la app **Expo Go** en tu smartphone (conectado a la misma red WiFi).

### Opción B: Ejecución directa en Android
```bash
npm run android
# o comando nativo:
npx react-native run-android
```

### Opción C: Ejecución directa en iOS (macOS)
```bash
npm run ios
# o comando nativo:
npx react-native run-ios
```

### Opción D: Ejecución en Web (revisión inmediata sin emulador)
```bash
npm run web
```

---

## 🧪 Guía para Probar el Flujo CRUD Completo

La aplicación inicia con un **estado limpio sin datos falsos ni solicitudes mocked** (`requests: []`), permitiendo evaluar la experiencia real de registro, los estados vacíos (*Empty States*) y el ciclo de vida completo de cada atención. Sigue estos pasos para evaluar el flujo:

### 1. Inicio de Sesión / Bienvenida
- Al abrir la app se presenta la **Pantalla de Bienvenida** con branding oficial de Amipets.
- El personal de la clínica puede ingresar con las credenciales configuradas:
  - **Usuario:** `admin`
  - **Contraseña:** `admin`
  - O tocar el acceso rápido inferior: **admin / admin**.
- Valida que al intentar ingresar campos vacíos o incompletos se muestren mensajes de validación visibles debajo de cada input.

### 2. Panel Principal (Dashboard en Estado Inicial)
- Al entrar sin solicitudes previas, observa el estado limpio:
  - Saludo personalizado al médico o profesional en sesión.
  - Accesos rápidos a los 4 servicios con indicación de *"Sin activas"*.
  - Contadores en cero (`0 Pendientes`, `0 En atención`, `0 Finalizadas`).
  - Tarjeta de estado vacío en *Últimas atenciones* con botón directo para crear la primera solicitud.

### 3. Crear Nueva Solicitud (Create)
- Toca el botón **"Nueva solicitud"** (+) en el banner principal, en la cabecera de Solicitudes o en cualquiera de los accesos rápidos.
- Completa el formulario asistencial:
  - **Cliente:** Nombre del tutor (ej. `Martín Rivas`).
  - **Teléfono:** 9 dígitos (ej. `987112233`).
  - **Mascota:** Selecciona la especie con su ícono (*Perro, Gato, Conejo u Otro*) e ingresa su nombre (ej. `Pelusa`).
  - **Tipo de Servicio:** Selecciona una especialidad (*Consulta, Vacunación, Emergencia o Grooming*). Si eliges Emergencia, la prioridad se elevará automáticamente a Urgente.
  - **Prioridad:** Elige `Urgente`, `Alta`, `Media` o `Baja`.
  - **Descripción:** Describe los síntomas o motivo de la visita.
- **Fecha y Hora:** Se genera automáticamente con la marca temporal exacta (ISO 8601).
- Presiona **"Guardar solicitud"**:
  - Se emitirá un **Toast animado** de confirmación.
  - La solicitud se añadirá al estado global reactivo y se abrirá su ficha clínica de detalle.

### 4. Seguimiento y Actualización de Estado (Read & Update)
- Desde la pestaña **"Solicitudes"**, observa la tarjeta con el código de atención correlativo (`#AP-XXXX`), especie, tutor, chip de prioridad con borde y chip de estado relleno.
- **Buscador en tiempo real:** Filtra instantáneamente por nombre de mascota, tutor o teléfono.
- **Filtros por Estado y Prioridad:** Prueba los segmentos para aislar solicitudes urgentes o pendientes.
- **Actualización de Estado con Acción Deshacer:**
  - Abre el detalle de la solicitud y cambia su estado a `En atención` o `Finalizado`.
  - Aparecerá un Toast con el botón interactivo **"Deshacer"** por 5 segundos para revertir cualquier cambio involuntario.
- **Edición Completa:** Toca el botón superior **"Editar"** para modificar datos del paciente o síntomas y guardar los cambios.

### 5. Agenda Médica en Vivo (Calendario)
- Dirígete a la pestaña **"Calendario"**.
- Observa la semana en curso calculada en tiempo real.
- Las atenciones registradas se integran automáticamente en el cronograma ordenadas por prioridad médica y hora de llegada. Tocar cualquier turno abre su ficha clínica.

### 6. Eliminar Solicitud (Delete)
- En la parte inferior de la ficha de detalle, ubica la sección **"Eliminar esta solicitud"**.
- Presiona el botón rojo.
- **Confirmación Obligatoria:** Se abrirá el modal interactivo `ConfirmDialog` solicitando confirmación explícita.
- Si confirmas, la solicitud se retira de la memoria y la pantalla regresa fluidamente al listado general.

### 7. Vaciar todas las solicitudes (Mantenimiento)
- En la pestaña **"Ajustes"**, ubica la opción **"Vaciar todas las solicitudes"**.
- Permite limpiar la memoria del dispositivo con confirmación mediante diálogo modal.

---

## 🏛️ Arquitectura del Software y Estructura de Carpetas

El proyecto sigue una arquitectura en capas basada en **alta cohesión y bajo acoplamiento**, separando la presentación visual, la lógica de negocio y la gestión del estado global:

```
Amipets/
├── assets/
│   ├── images/               # Ilustraciones y recursos visuales (welcome, hero)
│   └── pets/                 # Fotografías y avatares para especies (perro, gato, conejo, etc.)
├── src/
│   ├── models/               # Modelado de datos e interfaces TypeScript
│   │   └── request.ts        # Interface VeterinaryRequest, tipos, enums y constantes
│   ├── store/                # Lógica del estado global (State Management desacoplado)
│   │   ├── actions.ts        # Action creators tipados (LOAD, CREATE, UPDATE, DELETE, etc.)
│   │   ├── initialState.ts   # Estado inicial y generador de datos demo
│   │   └── requestsReducer.ts# Reducer puro con inmutabilidad estricta
│   ├── context/              # Proveedores de Context API
│   │   ├── RequestsContext.ts# Tipos e interfaz del contexto de solicitudes
│   │   ├── RequestsProvider.tsx # Provider que encapsula useReducer + Context
│   │   ├── AuthContext.tsx   # Sesión de usuario simulada (Dra. Ana Torres)
│   │   └── ToastContext.tsx  # Sistema global de notificaciones no bloqueantes
│   ├── components/           # Componentes atómicos reutilizables
│   │   ├── RequestCard.tsx   # Tarjeta de solicitud con barra de urgencia y avatar
│   │   ├── FormField.tsx     # Input con etiqueta, icono, contador y mensaje de error inferior
│   │   ├── Chips.tsx         # Chips de estado y prioridad con contraste accesible
│   │   ├── StatusChip.tsx    # Wrapper semántico para chips de estado
│   │   ├── PriorityChip.tsx  # Wrapper semántico para chips de prioridad
│   │   ├── ConfirmDialog.tsx # Modal de confirmación para acciones críticas (eliminar/descartar)
│   │   ├── SearchBar.tsx     # Barra de búsqueda con limpieza rápida
│   │   ├── FilterTabs.tsx    # Tabs y filtros tipo píldora para estados y prioridades
│   │   ├── EmptyState.tsx    # Vistas de estado vacío con ilustración y acción sugerida
│   │   ├── PrimaryButton.tsx # Botón táctil con variantes (primary, outline, danger)
│   │   ├── IconButton.tsx    # Botón de icono con badge de notificaciones
│   │   ├── PressableScale.tsx# Microinteracción con escala suave al presionar
│   │   ├── IconTile.tsx      # Contenedor estilizado para iconografía
│   │   ├── PetAvatar.tsx     # Avatar circular/redondeado por especie de mascota
│   │   ├── ScreenHeader.tsx  # Cabecera de pantalla con navegación hacia atrás
│   │   ├── SectionHeader.tsx # Título de sección con acción rápida
│   │   └── FadeInView.tsx    # Entrada con fade-in y slide animado
│   ├── screens/              # Vistas principales de la aplicación
│   │   ├── WelcomeScreen.tsx # Bienvenida y login simulado con validaciones
│   │   ├── HomeScreen.tsx    # Dashboard con alertas de urgencia, contadores y accesos rápidos
│   │   ├── RequestsScreen.tsx# Listado general con buscador reactivo y filtros combinados
│   │   ├── CalendarScreen.tsx# Agenda en vivo con orden cronológico de atención y turnos
│   │   ├── CreateRequestScreen.tsx # Formulario para crear y editar solicitudes
│   │   ├── RequestDetailScreen.tsx # Ficha clínica de detalle con controles de estado y borrado
│   │   └── SettingsScreen.tsx# Ajustes de clínica, tarifario, equipo y reseteo de datos
│   ├── navigation/           # Enrutamiento tipado con React Navigation
│   │   ├── RootNavigator.tsx # Stack Navigator raíz (Bienvenida / Tabs / Detalle / Formulario)
│   │   ├── MainTabs.tsx      # Bottom Tab Navigator de 4 pestañas: Inicio, Solicitudes, Calendario, Ajustes
│   │   └── types.ts          # Tipado estricto de parámetros de rutas (ParamList)
│   ├── theme/                # Sistema de diseño centralizado (Design Tokens)
│   │   ├── colors.ts         # Paleta de colores cálida y accesible (Sage, Rose, Lavender, Sky)
│   │   ├── typography.ts     # Fuentes (Poppins, Caveat) y jerarquía de texto
│   │   └── index.ts          # Espaciados, radios, sombras y estilos compartidos
│   └── utils/                # Utilidades y funciones puras
│       ├── validation.ts     # Reglas de validación y límites de caracteres
│       ├── requests.ts       # Filtros, ordenamiento de atención y contadores
│       ├── requestMeta.ts    # Metadatos, colores e iconos por servicio/estado/prioridad
│       ├── date.ts           # Formateo de fechas relativas y absolutas en español
│       └── id.ts             # Generador de identificadores únicos
├── App.tsx                   # Punto de entrada con fuentes y jerarquía de Providers
├── app.json                  # Configuración de la aplicación móvil (Expo/React Native)
├── package.json              # Manifiesto de dependencias y scripts
└── tsconfig.json             # Configuración del compilador TypeScript
```

---

## 📄 Licencia

Este proyecto fue desarrollado con fines educativos para la Escuela de Tecnología de IDAT.
