# Amipets 🐾 — Sistema de Gestión de Solicitudes de Atención Veterinaria

> Aplicación móvil profesional desarrollada en **React Native** con TypeScript bajo principios de **Clean Architecture** para la gestión, priorización y seguimiento del flujo de atenciones en la clínica veterinaria Amipets.

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
   git clone https://github.com/NAbantoHuaman/Amipets.git
   cd Amipets
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
```

### Opción C: Ejecución directa en iOS (macOS)
```bash
npm run ios
```

### Opción D: Ejecución en Web (revisión inmediata sin emulador)
```bash
npm run web
```

---

## 🧪 Guía para Probar el Flujo Completo

La aplicación inicia con un **estado limpio sin datos falsos ni solicitudes mocked** (`requests: []`), permitiendo evaluar la experiencia real de registro, los estados vacíos (*Empty States*) y el ciclo de vida completo de cada atención. Sigue estos pasos para evaluar el flujo:

### 1. Inicio de Sesión y Acceso
- Al abrir la app se presenta la **Pantalla de Bienvenida** con branding oficial de Amipets.
- El personal de la clínica puede ingresar con las credenciales fijas de administrador:
  - **Usuario:** `admin`
  - **Contraseña:** `admin`
  - O tocar el botón de acceso rápido: **admin / admin**.

### 2. Registro de Nuevos Usuarios y Recepcionistas (Crear Cuenta)
- En la pantalla de Bienvenida, presiona el botón **"Crear cuenta de personal / recepción"**.
- Se abrirá la pantalla dedicada **`RegisterScreen`**:
  - **Nombre y Apellidos:** Ingresa el nombre del colaborador (ej. `Mariana Ruiz`).
  - **Rol o Cargo Clínico:** Selecciona interactivamente entre *Recepcionista*, *Asistente Veterinario*, *Médico Veterinario* o *Administrador*.
  - **Colegiatura (Opcional):** Si se selecciona Médico Veterinario, se habilita el campo de C.M.V.P.
  - **Usuario y Contraseña:** Asigna credenciales personalizadas con validaciones en tiempo real y confirmación de clave.
- Al presionar **"Crear cuenta y entrar"**, el usuario queda registrado en la capa de persistencia (`InMemoryAuthRepository`), se inicia sesión automáticamente y el saludo del Dashboard reflejará su nombre y cargo.

### 3. Panel Principal (Dashboard en Estado Inicial)
- Al entrar sin solicitudes previas, observa el estado limpio:
  - Saludo personalizado al profesional en sesión activa.
  - Accesos rápidos a los 4 servicios con indicación de *"Sin activas"*.
  - Contadores en cero (`0 Pendientes`, `0 En atención`, `0 Finalizadas`).
  - Tarjeta de estado vacío en *Últimas atenciones* con botón directo para crear la primera solicitud.

### 4. Crear Nueva Solicitud (Create)
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

### 5. Seguimiento y Actualización de Estado (Read & Update)
- Desde la pestaña **"Solicitudes"**, observa la tarjeta con el código de atención correlativo (`#AP-XXXX`), especie, tutor, chip de prioridad con borde y chip de estado relleno.
- **Buscador en tiempo real:** Filtra instantáneamente por nombre de mascota, tutor o teléfono.
- **Filtros por Estado y Prioridad:** Prueba los segmentos para aislar solicitudes urgentes o pendientes.
- **Actualización de Estado con Acción Deshacer:**
  - Abre el detalle de la solicitud y cambia su estado a `En atención` o `Finalizado`.
  - Aparecerá un Toast con el botón interactivo **"Deshacer"** por 5 segundos para revertir cualquier cambio involuntario.
- **Edición Completa:** Toca el botón superior **"Editar"** para modificar datos del paciente o síntomas y guardar los cambios.

### 6. Agenda Médica en Vivo (Calendario)
- Dirígete a la pestaña **"Calendario"**.
- Observa la semana en curso calculada en tiempo real.
- Las atenciones registradas se integran automáticamente en el cronograma ordenadas por prioridad médica y hora de llegada. Tocar cualquier turno abre su ficha clínica.

### 7. Eliminar Solicitud (Delete)
- En la parte inferior de la ficha de detalle, ubica la sección **"Eliminar esta solicitud"**.
- Presiona el botón rojo.
- **Confirmación Obligatoria:** Se abrirá el modal interactivo `ConfirmDialog` solicitando confirmación explícita.
- Si confirmas, la solicitud se retira de la memoria y la pantalla regresa fluidamente al listado general.

### 8. Vaciar todas las solicitudes (Mantenimiento)
- En la pestaña **"Ajustes"**, ubica la opción **"Vaciar todas las solicitudes"**.
- Permite limpiar la memoria del dispositivo con confirmación mediante diálogo modal.

---

## 🏛️ Clean Architecture (4 Capas Claras)

El proyecto adopta **Clean Architecture**, desacoplando responsabilidades en 4 capas concéntricas con flujo de dependencias unidireccional:

```
Amipets/
├── assets/                   # Recursos estáticos (ilustraciones, avatares)
├── src/
│   ├── domain/               # [1] CAPA DE DOMINIO (Entidades, Modelos e Interfaces)
│   │   ├── models/
│   │   │   ├── request.ts    # Entidad VeterinaryRequest, tipos de estado, prioridad y servicios
│   │   │   └── user.ts       # Entidad User, Session, UserRole y DTOs de registro
│   │   ├── repositories/
│   │   │   ├── IRequestRepository.ts # Contrato abstracto para el CRUD de solicitudes
│   │   │   └── IAuthRepository.ts    # Contrato abstracto para autenticación y registro
│   │   └── index.ts
│   │
│   ├── application/          # [2] CAPA DE APLICACIÓN (Casos de Uso y Lógica de Negocio)
│   │   ├── services/
│   │   │   ├── requestService.ts     # Ordenamiento clínico, filtrado reactivo y conteos
│   │   │   └── authService.ts        # Validaciones de registro, roles y perfiles
│   │   └── index.ts
│   │
│   ├── infrastructure/       # [3] CAPA DE INFRAESTRUCTURA (Persistencia e Implementaciones)
│   │   ├── repositories/
│   │   │   ├── InMemoryRequestRepository.ts # Persistencia en memoria de solicitudes
│   │   │   └── InMemoryAuthRepository.ts    # Persistencia de usuarios y admin preconfigurado
│   │   └── index.ts
│   │
│   └── presentation/         # [4] CAPA DE PRESENTACIÓN (UI, Vistas y Flujos de Usuario)
│       ├── screens/
│       │   ├── WelcomeScreen.tsx       # Inicio de sesión y acceso rápido
│       │   ├── RegisterScreen.tsx      # Registro de nuevos usuarios y recepcionistas
│       │   ├── HomeScreen.tsx          # Dashboard asistencial con contadores y métricas
│       │   ├── RequestsScreen.tsx      # Directorio general con buscador y filtros
│       │   ├── CalendarScreen.tsx      # Agenda cronológica de atenciones
│       │   ├── CreateRequestScreen.tsx # Formulario asistido para registro/edición
│       │   ├── RequestDetailScreen.tsx # Ficha clínica integral y controles de estado
│       │   └── SettingsScreen.tsx      # Tarifario editable y perfil de clínica
│       ├── components/                 # Componentes atómicos reutilizables (Cards, Chips, Modales)
│       ├── navigation/                 # RootNavigator (Stack) y MainTabs (Tabs)
│       ├── context/                    # AuthContext, RequestsContext, RequestsProvider, ToastContext
│       ├── theme/                      # Tokens de diseño (colors, typography, spacing, radius)
│       └── index.ts
├── App.tsx                   # Punto de entrada con fuentes y Providers
├── app.json                  # Manifiesto de Expo / React Native
├── package.json              # Dependencias y scripts
└── tsconfig.json             # Configuración del compilador TypeScript
```

---

## 📄 Licencia

Este proyecto fue desarrollado con fines educativos para la Escuela de Tecnología de IDAT.
