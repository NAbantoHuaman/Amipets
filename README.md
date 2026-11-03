# Amipets 🐾 — Sistema de Gestión de Solicitudes de Atención Veterinaria

> Aplicación móvil profesional desarrollada en **React Native** con TypeScript bajo principios de **Clean Architecture** para la gestión, priorización, triaje y seguimiento del ciclo de vida de atenciones en la clínica veterinaria Amipets.

---

## 👥 Datos del Proyecto y Equipo de Desarrollo

- **Institución:** Escuela de Tecnología — IDAT
- **Curso:** Desarrollo de Aplicaciones Móviles
- **Integrantes:**
  1. **Nestor Jose Abanto Huaman** — Arquitectura Limpia en 4 Capas, Modelado de Dominio y Estado Global (`src/domain/`, `src/application/`, `src/infrastructure/`)
  2. **Elmo Torres Ordoñez** — Diseño UI/UX, Sistema de Diseño, Tokens y Componentes Reutilizables (`src/presentation/components/`, `src/presentation/theme/`)
  3. **Joel Yaro Leguia** — Pantallas Asistenciales, Alta de Recepcionistas, Agenda Compartida y Flujo CRUD (`src/presentation/screens/`, `src/presentation/navigation/`, `src/presentation/utils/`)

---

## 📋 Contexto y Problemática

Una clínica veterinaria que brinda servicios de **consultas, vacunación, emergencias y grooming** registraba diariamente sus solicitudes mediante canales informales (WhatsApp, llamadas telefónicas y cuadernos de papel). Esta práctica generaba:
1. **Pérdida de información** de los pacientes y tutores.
2. **Duplicidad de registros** entre recepcionistas y médicos.
3. **Falta de visibilidad sobre el estado de cada atención** (`PENDIENTE`, `EN_ATENCION`, `FINALIZADO`).
4. **Falta de priorización médica** para urgencias vitales que requieren atención inmediata frente a servicios programados.
5. **Falta de trazabilidad:** Imposibilidad de auditar qué recepcionista o médico registró cada solicitud.

### Solución Implementada: **Amipets**
Una aplicación móvil desacoplada, moderna y reactiva que centraliza el registro, seguimiento y ciclo de vida de cada solicitud de atención, optimizando la toma de decisiones clínicas con las siguientes características:
- **Clean Architecture en 4 Capas** (`domain/`, `application/`, `infrastructure/`, `presentation/`).
- **Sistema multi-usuario compartido:** Con registro especializado de recepcionistas por turnos y auditoría de registro (`registradoPor`).
- **Paleta Coral Profesional** con cumplimiento de accesibilidad **WCAG AA**.
- **Sistema Integral de Animaciones Nativas** (`FadeInView`, `PulseView`, `PressableScale`).
- **Tarifario Oficial Dinámico** en soles (S/.) con control de permisos para el Director Médico.

---

## 🛠️ Stack Tecnológico

- **Framework:** [React Native](https://reactnative.dev/) (v0.76+) con [Expo](https://expo.dev/) (SDK 52)
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/) (Tipado estricto, interfaces de dominio y DTOs)
- **Navegación:** [@react-navigation/native](https://reactnavigation.org/) con `@react-navigation/native-stack` y `@react-navigation/bottom-tabs`
- **Iconografía:** [@expo/vector-icons](https://icons.expo.fyi/) (`Ionicons`, `MaterialCommunityIcons`)
- **Tipografía:** [Poppins](https://fonts.google.com/specimen/Poppins) (`400`, `500`, `600`, `700`) + [Caveat](https://fonts.google.com/specimen/Caveat) (`600`)
- **Manejo de Safe Areas:** `react-native-safe-area-context`
- **Arquitectura:** Clean Architecture (Domain Driven Design modular)

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
  - Xcode 15 o superior con simulador configurado.
  - CocoaPods (`sudo gem install cocoapods`).
- **Alternativa Rápida (Cualquier plataforma / Dispositivo físico):**
  - Aplicación **Expo Go** disponible en Google Play Store o Apple App Store.

---

## 📦 Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/NAbantoHuaman/Amipets.git
   cd Amipets
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Verificar compilación TypeScript:**
   ```bash
   node .\node_modules\typescript\bin\tsc --noEmit
   ```

---

## ▶️ Ejecución del Proyecto

### Opción A: Servidor Interactivo Expo (Recomendado)
Inicia el empaquetador Metro:
```bash
npx expo start
# o con npm:
npm run start
```
- Presiona `a` para abrir en **Emulador Android**.
- Presiona `i` para abrir en **Simulador iOS** (en macOS).
- Presiona `w` para abrir en **Navegador Web**.
- O escanea el **código QR** desde la aplicación **Expo Go** en tu smartphone (ambos dispositivos en la misma red WiFi).

### Opción B: Ejecución directa en Android
```bash
npm run android
```

### Opción C: Ejecución directa en iOS (macOS)
```bash
npm run ios
```

---

## 🧪 Guía para Probar el Flujo Completo

La aplicación cuenta con un flujo completo de punta a punta, persistencia local y soporte para múltiples cuentas de colaboradores:

### 1. Inicio de Sesión (WelcomeScreen)
- La pantalla de bienvenida presenta el encabezado oficial de Amipets con su distintivo de estado clínico en vivo.
- El banner de bienvenida se ubica en el centro entre la marca y el formulario de acceso.
- **Acceso de Administrador / Director Médico:**
  - **Usuario:** `admin`
  - **Contraseña:** `admin`
- Cuenta con validaciones reactivas en tiempo real y ocultamiento/visualización de contraseña.

### 2. Registro de Nuevas Recepcionistas (RegisterScreen)
- En la pantalla de acceso, toca el botón **"Crear cuenta"** (botón Outlined con borde Coral).
- Se abre el formulario de alta exclusiva de **Recepcionistas de la clínica**:
  - **Nombre y Apellidos:** Nombre del colaborador (ej. `Mariana Ruiz`).
  - **Turno Asignado:** Selección entre *Turno Mañana (08:00 - 14:00)*, *Turno Tarde (14:00 - 20:00)* o *Turno Completo (08:00 - 20:00)*.
  - **Usuario y Contraseña:** Credenciales personales con confirmación de clave y validaciones de seguridad.
- Al presionar **"Crear cuenta"**, la recepcionista queda registrada en el sistema clínico compartido, inicia sesión automáticamente y su nombre aparecerá en todas las solicitudes que ingrese.

### 3. Panel Principal / Dashboard (HomeScreen)
- **Saludo Clínico:** Encabezado con respiración visual que muestra la fecha del día y el nombre del profesional en sesión.
- **Hero Banner:** Muestra el contador de atenciones del día con una micro-animación de pulso (*PulseView*) y acceso directo a nueva solicitud.
- **Tarjetas de Estado:** Contadores en negrita de alto contraste (`#18181B`, 24px) para solicitudes *Pendientes*, *En atención* y *Finalizadas*.
- **Servicios Asistenciales:** Grilla con los 4 servicios clínicos (*Consulta*, *Vacunación*, *Emergencia*, *Grooming*), tarifa oficial en soles y etiquetas de atenciones activas ancladas a la esquina superior derecha.
- **Alerta de Emergencias Activas:** Si existe un paciente en estado Urgente no finalizado, se despliega una tarjeta de alerta con botón directo para atender el caso.

### 4. Nueva Solicitud y Admisión de Pacientes (CreateRequestScreen)
- Accesible mediante el botón **(+)** del banner, en el listado o en el calendario.
- Formulario dividido en secciones asistenciales con animación escalonada:
  - **Datos del Cliente:** Nombre del tutor y teléfono de contacto con validación de formato.
  - **Mascota y Selector de Especie:** Selección entre *Perro*, *Gato*, *Conejo* u *Otro*. Las especies no seleccionadas permanecen en tono neutro limpio, y la especie activa resalta en Coral con su insignia de verificación (✓).
  - **Servicio Solicitado:** Botones táctiles con tarifa actualizada en soles. Seleccionar *Emergencia* eleva la prioridad automáticamente a *Urgente* y activa la insignia *Prioridad UCI*.
  - **Triage y Nivel de Prioridad:** Barra segmentada (*Urgente*, *Alta*, *Media*, *Baja*) con indicador del impacto clínico del tiempo de espera.
  - **Motivo de Atención:** Campo de texto multilínea con contador de caracteres.
  - **Auditoría de Registro:** Muestra la fecha/hora de ingreso (ISO 8601), el nombre del recepcionista o médico que ingresa la solicitud (`registradoPor`) y la tarifa calculada.

### 5. Directorio y Triaje de Solicitudes (RequestsScreen)
- Listado general de pacientes ordenados por **prioridad clínica médica y hora de llegada**.
- **Buscador en tiempo real:** Búsqueda rápida por nombre de paciente, cliente o teléfono.
- **Filtros por Estado y Prioridad:** Chips interactivos para filtrar rápidamente por *Pendientes*, *En atención*, *Finalizadas* o por nivel de triage.
- **Estado Vacío Centrado:** Cuando no hay solicitudes o no hay coincidencias de búsqueda, el estado vacío se ubica exactamente en el centro vertical de la pantalla.
- **Entrada en Cascada:** Cada tarjeta de solicitud aparece con una suave animación escalonada.

### 6. Ficha Clínica Integral y Ciclo de Vida (RequestDetailScreen)
- Tarjeta hero del paciente con avatar de especie, código correlativo (`#AP-XXXX`), tutor y chips de estado.
- **Cambio de Estado con Deshacer:**
  - Permite avanzar la atención a *Pendiente*, *En atención* o *Finalizado*.
  - Al cambiar de estado, se emite un Toast interactivo con botón **"Deshacer"** durante 5 segundos para revertir cualquier cambio accidental.
- **Edición Completa:** Botón superior para editar cualquier dato del paciente o motivo de atención.
- **Eliminación Segura:** Sección de baja con diálogo modal de confirmación destructiva (`ConfirmDialog`).

### 7. Agenda Médica Compartida (CalendarScreen)
- Vista semanal con selector de días táctil y espacioso (`minWidth: 42`, `minHeight: 66`), donde el día seleccionado se resalta con cápsula Coral y sombra suave.
- **Sistema Clínico Compartido:** Muestra todas las atenciones programadas y atendidas por cualquier miembro del equipo de recepción o dirección médica.
- Cronograma ordenado cronológicamente por hora y prioridad, con indicador de turno en vivo y distinción de emergencias con barra lateral roja.
- Tocar cualquier cita abre de inmediato su ficha clínica de detalle.

### 8. Ajustes, Tarifario Oficial y Equipo Clínico (SettingsScreen)
- **Perfil Profesional:** Muestra los datos del Director Médico (o recepcionista activo) con indicador de conexión en vivo (*online dot*).
- **Equipo Clínico:** Lista a todos los colaboradores registrados en el sistema, su cargo, estado activo y el número total de atenciones ingresadas por cada uno.
- **Tarifario de Servicios Oficial:** Precios de los 4 servicios clínicos. Si la sesión es de Administrador (`admin`), permite editar el precio de cada servicio mediante un modal interactivo; si es recepcionista, muestra permisos de solo lectura.
- **Preferencias del Sistema:** Switches interactivos para notificaciones de urgencias en tiempo real, sonido de alerta y recordatorios de vacunas.
- **Mantenimiento y Sesión:** Opción para vaciar la base de solicitudes (exclusivo admin) y botón de cierre de sesión.

---

## 🎨 Sistema de Diseño, Tokens y Accesibilidad

El proyecto implementa un sistema de diseño institucional, limpio y accesible:

### Paleta Oficial Coral
- **Primario (`colors.primary`):** Coral profesional `#FF5C53`
- **Primario Oscuro (`colors.primaryDark`):** `#DE3F35`
- **Fondo Suave (`colors.primarySoft`):** `#FFEBE8`
- **Superficie Cálida (`colors.surfaceWarm`):** `#FFF2F0`
- **Superficie Base (`colors.surface`):** `#FFFFFF`
- **Fondo General (`colors.background`):** `#FAF8F6`
- **Textos de Alto Contraste:** `#18181B` (títulos y números), `#3F3F46` (cuerpo), `#52525B` (placeholders e inactivos)

### Estándares de Accesibilidad (WCAG AA)
- **Contraste de Placeholders:** Se utiliza `#52525B` sobre fondos claros (ratio de contraste > 4.7:1), asegurando legibilidad en exteriores o pantallas de bajo brillo.
- **Navegación Inferior:** Íconos y textos inactivos a 12.5px con peso `Medium` en `#52525B`, equilibrando visibilidad sin opacar la pestaña activa en Coral.
- **Zonas Táctiles (Tap Targets):** Botones y cápsulas de calendario con altura mínima de 44-48dp, facilitando la interacción en pantallas táctiles de cualquier tamaño.

### Sistema de Animaciones Nativas
- **`FadeInView`:** Transiciones de entrada por aceleración nativa (`useNativeDriver: true`) con parámetros de `delay`, `distance`, `direction` y `scale` para un despliegue escalonado en todas las pantallas.
- **`PulseView`:** Animaciones continuas de pulso suave para elementos en vivo (atenciones activas, indicador de turno, online dot del personal).
- **`PressableScale`:** Micro-interacciones de retroalimentación elástica al presionar tarjetas, chips, servicios y botones.

---

## 🪝 Uso de Hooks Obligatorios en el Proyecto

| Hook Obligatorio | Archivos de Implementación | Justificación Técnica en Amipets |
| :--- | :--- | :--- |
| **`useState`** | `CreateRequestScreen`, `RegisterScreen`, `WelcomeScreen`, `HomeScreen`, `RequestsScreen`, `CalendarScreen`, `RequestDetailScreen`, `SettingsScreen` | Controla el estado reactivo local: inputs de login y registro de recepcionistas, turno asignado, filtros de búsqueda, selector de fecha activa, switches y modales interactivos. |
| **`useEffect`** | `RequestsProvider.tsx`, `RequestsScreen.tsx`, `CreateRequestScreen.tsx` | Sincroniza en segundo plano las solicitudes con el almacenamiento local, coordina parámetros de navegación enviados desde el Dashboard y activa animaciones escalonadas. |
| **`useReducer`** | `RequestsProvider.tsx` (`requestsReducer.ts`, `actions.ts`, `initialState.ts`) | Centraliza la máquina de estados del CRUD clínico (`CREATE`, `UPDATE`, `UPDATE_STATUS`, `DELETE`, `CLEAR_ALL`) en una función pura, garantizando inmutabilidad y transiciones predecibles. |
| **`useContext` (Context API)** | `RequestsProvider.tsx`, `AuthContext.tsx`, `ToastContext.tsx` | Comparte el estado global clínico, la sesión activa del personal y el sistema de alertas Toast con botón Deshacer a lo largo de toda la jerarquía de componentes sin *prop drilling*. |

---

## 🏛️ Clean Architecture (4 Capas Claras)

El proyecto adopta **Clean Architecture**, desacoplando responsabilidades en 4 capas concéntricas con flujo de dependencias unidireccional:

```
Amipets/
├── assets/                     # Recursos gráficos (hero.jpg, welcome.jpg, avatares)
├── src/
│   ├── domain/                 # [1] CAPA DE DOMINIO (Entidades, Modelos y Contratos)
│   │   ├── models/
│   │   │   ├── request.ts      # Entidad VeterinaryRequest, estados, prioridades, registradoPor
│   │   │   └── user.ts         # Entidad User, Session, UserRole, turnos y DTOs
│   │   ├── repositories/
│   │   │   ├── IRequestRepository.ts # Contrato abstracto para el CRUD de solicitudes
│   │   │   └── IAuthRepository.ts    # Contrato abstracto para autenticación y colaboradores
│   │   └── index.ts
│   │
│   ├── application/            # [2] CAPA DE APLICACIÓN (Casos de Uso y Reglas de Negocio)
│   │   ├── services/
│   │   │   ├── requestService.ts     # Ordenamiento clínico por triage, filtros y conteos
│   │   │   └── authService.ts        # Validaciones de roles, turnos y credenciales
│   │   └── index.ts
│   │
│   ├── infrastructure/         # [3] CAPA DE INFRAESTRUCTURA (Implementaciones y Persistencia)
│   │   ├── repositories/
│   │   │   ├── InMemoryRequestRepository.ts # Persistencia local de solicitudes y tarifario
│   │   │   └── InMemoryAuthRepository.ts    # Persistencia de personal y admin preconfigurado
│   │   └── index.ts
│   │
│   └── presentation/           # [4] CAPA DE PRESENTACIÓN (UI, Vistas y Componentes)
│       ├── screens/
│       │   ├── WelcomeScreen.tsx       # Inicio de sesión con marca Amipets
│       │   ├── RegisterScreen.tsx      # Registro de recepcionistas con turno
│       │   ├── HomeScreen.tsx          # Dashboard clínico con métricas en vivo
│       │   ├── RequestsScreen.tsx      # Directorio general con buscador y filtros
│       │   ├── CalendarScreen.tsx      # Agenda semanal compartida por turnos
│       │   ├── CreateRequestScreen.tsx # Admisión con triage asistido y tarifario
│       │   ├── RequestDetailScreen.tsx # Ficha clínica integral y ciclo de vida
│       │   └── SettingsScreen.tsx      # Tarifario oficial, equipo clínico y mantenimiento
│       ├── components/                 # Componentes atómicos (Cards, Chips, Modales, Animaciones)
│       │   ├── FadeInView.tsx          # Animación de entrada escalonada nativa
│       │   ├── PulseView.tsx           # Animación de pulso suave en vivo
│       │   ├── PressableScale.tsx      # Respuesta táctil elástica
│       │   ├── RequestCard.tsx         # Tarjeta de paciente con triage
│       │   ├── FormField.tsx           # Input accesible con iconos y validación
│       │   ├── PrimaryButton.tsx       # Botón principal y outlined
│       │   └── ...
│       ├── navigation/                 # RootNavigator (Stack) y MainTabs (Bottom Tabs)
│       ├── context/                    # AuthContext, RequestsContext, RequestsProvider, ToastContext
│       ├── store/                      # Reducer puro, estado inicial y acciones del CRUD
│       ├── theme/                      # Tokens (colors, typography, spacing, radius, shadows)
│       └── utils/                      # Formateadores de fecha, IDs, metadatos y validaciones UI
├── App.tsx                     # Punto de entrada con fuentes y Providers
├── app.json                    # Configuración de Expo / React Native
├── package.json                # Dependencias y scripts
└── tsconfig.json               # Configuración del compilador TypeScript
```

---

## 📄 Licencia

Este proyecto fue desarrollado con fines educativos y de demostración técnica para la Escuela de Tecnología de IDAT.
