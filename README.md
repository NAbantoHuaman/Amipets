# Amipets — Clínica Veterinaria y Pet Shop

## Descarga del APK Compilado (Android)

- **Descargar instalador (`Amipets.apk`):** [Descargar APK desde Google Drive](https://drive.google.com/file/d/107RAk9mZtTZ_DxvMwzMRM8DUJob6T5kr/view?usp=sharing)
- **Instalación directa:** Descarga el archivo en tu dispositivo Android, habilita *"Instalar aplicaciones desconocidas"* si el sistema lo solicita e instala el paquete `com.amipets.app` (Android 7.0+ / `minSdk 24`).
- **Incluye:** Ícono y pantalla de carga personalizados, persistencia offline en SQLite, sincronización con Firebase, catálogo Pet Shop, clima para paseos y guía clínica de razas.

---

## Descripción del Proyecto

**Amipets** es una aplicación móvil desarrollada en **React Native** con **Expo (SDK 58)**, **TypeScript**, **SQLite (`expo-sqlite`)**, **Firebase** y **APIs REST externas** bajo **Clean Architecture** en 4 capas. Está orientada a emprendimientos veterinarios y tiendas de mascotas que necesitan gestionar solicitudes clínicas y controlar pedidos de tienda con funcionamiento completo sin conexión a internet y sincronización automática en la nube.

### Contexto y Problemática
Amipets opera simultáneamente como clínica veterinaria y tienda de mascotas (alimentos, accesorios, ropa y juguetes para perros y gatos). Anteriormente, los pedidos y atenciones se anotaban de forma manual por WhatsApp y hojas de cálculo, ocasionando duplicidad de registros, errores de cálculo, desorden en el historial por operador y bloqueos cuando no había cobertura móvil.

Con la aplicación móvil, el equipo autenticado trabaja siempre sobre una interfaz unificada:
- Los pedidos se almacenan primero en **SQLite (`amipets_store.db`)**, sobreviven al cierre o reinicio del teléfono sin internet y se sincronizan automáticamente con **Cloud Firestore** sin generar duplicados apenas regresa la conexión.
- El catálogo, el clima para paseos y la guía de razas consumen **servicios REST externos reales** con manejo explícito de carga, error, reintento y respaldo local.

---

## Integrantes del Equipo

- **Institución:** Escuela de Tecnología — IDAT
- **Proyecto:** Aplicativo Móvil para Clínica Veterinaria y Pet Shop (**Amipets**)
- **Equipo de Desarrollo:**
  1. **Nestor Jose Abanto Huaman** — Arquitectura Limpia en 4 Capas, Modelado de Dominio, SQLite, Firebase, Sincronización Offline/Online e Integraciones REST (`src/domain/`, `src/application/`, `src/infrastructure/`)
  2. **Elmo Torres Ordoñez** — Diseño UI/UX, Sistema de Diseño, Tokens y Componentes Reutilizables (`src/presentation/components/`, `src/presentation/theme/`)
  3. **Joel Yaro Leguia** — Pantallas Asistenciales y Tienda, Navegación, Flujo CRUD y Consumo REST en UI (`src/presentation/screens/`, `src/presentation/navigation/`, `src/presentation/utils/`)

---

## Requisitos del Entorno

- **Sistema Operativo:** Windows 10/11, macOS o Linux
- **Node.js:** Versión 20.x o superior
- **Gestor de paquetes:** `npm` (incluido con Node.js)
- **Control de versiones:** Git
- **Ejecución móvil:**
  - Android Studio con emulador Android, o dispositivo físico Android con **Expo Go** / `.apk` compilado
- **Cuentas en la nube (opcional para despliegue propio o build remoto):**
  - Cuenta en **Firebase** (proyecto vinculado: `amipets-d469c`)
  - Cuenta en **Expo (EAS)** para compilación remota de `.apk` / `.aab`

---

## Configuración del Entorno y Credenciales de Firebase (Variables de Entorno)

La aplicación utiliza **Firebase Authentication**, **Cloud Firestore** y **Cloud Storage** mediante variables públicas de Expo (`EXPO_PUBLIC_*`).

> **Inicio inmediato sin configuración adicional:** `src/infrastructure/services/firebaseConfig.ts` ya incluye como respaldo automático la configuración pública del proyecto `amipets-d469c` (la misma declarada en `eas.json` y protegida por `firestore.rules` y `storage.rules`). Por ello, al clonar el repositorio basta ejecutar `npm install` y `npx expo start` para que el aplicativo levante directamente sin requerir un archivo `.env` manual.

### 1. (Opcional) Sobrescribir con un archivo `.env` propio
En la raíz del proyecto, copia `.env.example` hacia `.env`:

```powershell
Copy-Item .env.example .env
```

Completa las 6 variables con los valores de tu Web App registrada en **Firebase Console -> Configuración del proyecto -> Tus apps**:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=tu_api_key_de_firebase
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=tu_app_id
```

| Variable | Propósito |
|---|---|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Clave pública de la Web App en Firebase |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Dominio de autenticación de Firebase |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Identificador del proyecto Firebase (`amipets-d469c`) |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Bucket de Cloud Storage para comprobantes de pedido |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Identificador del remitente de Firebase |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Identificador de la aplicación registrada en Firebase |

### 2. Credenciales para compilación remota en Expo (EAS)
Expo EAS Build no sube archivos ignorados por Git (`.env`), por lo que los perfiles `development`, `preview` y `production` en `eas.json` ya declaran el bloque `"env"` con las variables `EXPO_PUBLIC_FIREBASE_*` necesarias para compilar en la nube (alternativamente pueden gestionarse como EAS Environment Variables desde `expo.dev`).

### 3. Reglas y servicios de Firebase
El repositorio incluye la configuración lista en `firebase.json`, `.firebaserc`, `firestore.rules`, `firestore.indexes.json` y `storage.rules`:
- **Firebase Authentication:** proveedor `Email/Password` habilitado (`auth.providers.emailPassword: true`).
- **Cloud Firestore:** reglas por propietario (`request.auth.uid == resource.data.userId`).
- **Cloud Storage:** reglas por carpeta de usuario (`receipts/{userId}/...`, límite de imagen de 5 MB). Si deseas desplegar o actualizar reglas con Firebase CLI:

```powershell
npx.cmd -y firebase-tools@latest login
npx.cmd -y firebase-tools@latest deploy --only firestore:rules,auth --project amipets-d469c
npx.cmd -y firebase-tools@latest deploy --only storage --project amipets-d469c
```

### 4. APIs externas sin API key
Las APIs externas integradas para catálogo (`dummyjson.com`), clima (`api.open-meteo.com`) y razas (`dogapi.dog`, `dog.ceo`, `catfact.ninja`) son públicas y no requieren credenciales ni claves adicionales en `.env`.

---

## Pasos de Instalación

1. **Clonar el repositorio:**
   ```powershell
   git clone https://github.com/NAbantoHuaman/Amipets.git
   cd Amipets
   ```

2. **Instalar las dependencias del proyecto:**
   ```powershell
   npm install
   ```

3. *(Opcional)* **Variables de entorno personalizadas:**
   El proyecto levanta de forma directa tras `npm install` gracias a los valores por defecto en `firebaseConfig.ts`. Solo necesitas crear `.env` desde `.env.example` si deseas apuntar a otro proyecto de Firebase.

4. **Verificar compilación TypeScript:**
   ```powershell
   node ./node_modules/typescript/bin/tsc --noEmit
   ```

---

## Pasos de Ejecución

1. **Iniciar el servidor de desarrollo de Expo:**
   ```powershell
   npx expo start
   ```
   Opciones dentro de la consola interactiva:
   - Presiona `a` para abrir la app en **emulador Android**.
   - Presiona `w` para abrir la versión **Web** en el navegador.
   - Escanea el código **QR** con **Expo Go** desde un teléfono Android conectado a la misma red.

2. **Verificar el bundle de producción Android localmente (sin compilar en la nube):**
   ```powershell
   npx.cmd expo export --platform android --output-dir .expo-verify-dist
   ```
   Esta comprobación empaqueta el código JavaScript/Hermes y los 90 assets locales usando `metro.config.js`. Tras verificar, puedes eliminar la carpeta `.expo-verify-dist`.

---

## Pasos para Generar el APK

El proyecto ya cuenta con:
- **`app.json`:** paquete Android `com.amipets.app`, ícono ilustrado personalizado adaptativo (`#27705F`), pantalla de carga (`#FAF6EF`), orientación `portrait`, modo claro (`userInterfaceStyle: "light"`) y plugins nativos (`expo-sqlite`, `expo-font`, `expo-image-picker` con `microphonePermission: false`).
- **`eas.json`:** perfil `preview` configurado con `"buildType": "apk"` (instalación directa) y perfil `production` con `"buildType": "app-bundle"` (`.aab` para Google Play).
- **`metro.config.js`:** soporte `.cjs` compatible con `firebase@^13.4.0` en builds nativos Android.

Ejecuta los siguientes comandos en la raíz del proyecto para compilar el `.apk`:

1. **Iniciar sesión en tu cuenta de Expo:**
   ```powershell
   npx.cmd -y eas-cli login
   ```

2. **Vincular el proyecto con Expo EAS (solo la primera vez):**
   ```powershell
   npx.cmd -y eas-cli init
   ```

3. **Generar el archivo `.apk` instalable en Android:**
   ```powershell
   npx.cmd -y eas-cli build -p android --profile preview
   ```
   Al finalizar el proceso en la nube de EAS, la terminal mostrará la URL de descarga directa y un código QR para instalar el `.apk` en cualquier dispositivo Android.

4. *(Opcional)* **Generar `.aab` para publicación en Play Store:**
   ```powershell
   npx.cmd -y eas-cli build -p android --profile production
   ```

---

## Funcionalidades Implementadas

### 1. Autenticación y Control de Acceso (Firebase Authentication)
- Inicio de sesión (`WelcomeScreen`) y registro de usuarios (`RegisterScreen`) con correo electrónico, contraseña, nombre completo y horario de atención.
- Persistencia de sesión nativa mediante `AsyncStorage` (`getReactNativePersistence`) y perfil almacenado en Firestore (`users/{uid}`).
- Guard de navegación en `RootNavigator.tsx`: ningún usuario no autenticado puede acceder a las pantallas internas; al cerrar sesión desde **Ajustes**, la aplicación retorna al login.

### 2. Gestión de Pedidos con Persistencia Local SQLite (`expo-sqlite`)
- Base de datos relacional local `amipets_store.db` (tabla `orders`) administrada desde `src/infrastructure/database/sqlite.ts` y `SqliteOrderRepository.ts`.
- Creación, consulta, actualización de datos y estado (`PENDIENTE`, `EN_PROCESO`, `ENTREGADO`, `CANCELADO`), eliminación individual y vaciado controlado.
- Historial aislado por `userId` autenticado, recuperación inmediata tras reiniciar la app incluso sin conexión, cálculo automático de subtotales/totales y control dinámico de stock.

### 3. Sincronización Automática Offline/Online Sin Duplicados
- Detección automática de conectividad con `@react-native-community/netinfo` en `OrdersContext.tsx`.
- Envío automático de pedidos pendientes y eliminaciones hacia **Cloud Firestore** cuando vuelve la conexión, usando cola de resincronización (`resyncQueuedRef`) para cambios consecutivos rápidos.
- Prevención de duplicados mediante ID determinístico (`setDoc(doc(db, 'orders', order.id), ...)`), borrado lógico (`deletedAt`) sincronizado y fusión inteligente al recuperar el historial desde la nube.

### 4. Comprobantes de Pedido (`expo-image-picker` + Firebase Storage)
- Adjunto opcional de foto de comprobante desde cámara o galería en `CreateOrderScreen.tsx`.
- Almacenamiento local inmediato en el dispositivo y subida automática a **Firebase Storage** (`receipts/{userId}/{orderId}.jpg`) al sincronizar, con fallback visual en `OrderDetailScreen.tsx` si una imagen remota se abre sin internet.

### 5. Consumo de Servicios REST y APIs Externas
- **Catálogo Pet Shop (`GET https://dummyjson.com/products?limit=24`):** Carga 24 productos reales de mascota con fotografía local, SKU, especie objetivo (`Perro` / `Gato`), búsqueda, filtros por categoría, stock dinámico y modal de detalle rápido.
- **Clima para paseos y baño (`GET https://api.open-meteo.com/v1/forecast`):** Consulta temperatura actual, sensación térmica, humedad, viento e índice UV para 6 ciudades de Perú (`Lima`, `Arequipa`, `Trujillo`, `Cusco`, `Piura`, `Chiclayo`) generando recomendaciones clínicas para paseos y grooming desde `weatherAdviceService.ts`.
- **Guía clínica y selector de razas (`Dog API v2`, `Dog CEO` y `CatFact Ninja`):**
  - Pantalla `BreedGuideScreen` accesible desde Inicio con pestañas **Perros** y **Gatos**, buscador en vivo, paginación incremental, fichas técnicas detalladas y acceso directo para crear una solicitud con la raza elegida.
  - Selector modal `BreedPickerModal` integrado en `CreateRequestScreen` para asignar rápidamente la raza al registrar una solicitud veterinaria.

### 6. Módulo Clínico Veterinario y Sistema de Diseño
- Admisión de pacientes con triaje (`URGENTE`, `ALTA`, `MEDIA`, `BAJA`), especie, raza opcional, agenda semanal (`CalendarScreen`), tarifario configurable y persistencia de solicitudes, avisos leídos y preferencias en `AsyncStorage`.
- Paleta visual **Verde Salvia Clínico + Crema Cálido** (`#1F6F5C` primario, `#B8652A` acento de tienda, `#FAF6EF` fondo con patrón sutil de patitas `PawBackdrop`, retratos reales por especie en `PetAvatar` e ilustraciones en `EmptyState`) con tipografías `Poppins` y `Caveat`.

### Stack Tecnológico
- **Framework:** React Native `0.88.1` + Expo `~58.0.26`
- **Lenguaje:** TypeScript (`strict: true`)
- **Nube:** `firebase@^13.4.0` (Authentication, Cloud Firestore, Cloud Storage)
- **Persistencia local:** `expo-sqlite` + `@react-native-async-storage/async-storage`
- **Red y multimedia:** `@react-native-community/netinfo`, `expo-image-picker`, `expo-system-ui`
- **Navegación e íconos:** `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`, `@expo/vector-icons`

---

## Cómo Probar el CRUD con SQLite

1. **Iniciar sesión:** Crea una cuenta en **Crear cuenta** o inicia sesión en la pantalla inicial.
2. **Probar CREATE sin conexión (Modo Avión):**
   - Activa el **Modo Avión** (o desconecta WiFi/datos).
   - Ve a la pestaña **Pedidos**: verás el indicador de **Sin conexión · Guardado local**.
   - Toca **+ Nuevo**, selecciona un producto del catálogo (disponible offline gracias al respaldo incluido), ajusta cantidad, ingresa datos del cliente, adjunta opcionalmente un comprobante y presiona **Guardar pedido**.
3. **Probar READ y persistencia al reiniciar:**
   - Verifica el pedido creado en la lista de **Pedidos** con su estado pendiente de envío a la nube.
   - Cierra por completo la aplicación (swipe out desde recientes) y vuelve a abrirla aún en Modo Avión: el pedido sigue visible y filtrado únicamente para el usuario autenticado porque proviene de **SQLite**.
4. **Probar UPDATE:**
   - Abre el pedido en **Detalle del pedido** (`OrderDetailScreen`).
   - Cambia su estado (`En proceso` o `Entregado`) o toca **Editar** para modificar cliente, producto o cantidad y guardar.
5. **Probar sincronización automática y prevención de duplicados:**
   - Desactiva el Modo Avión y espera unos segundos (o desliza hacia abajo para refrescar / presiona **Sincronizar**).
   - `NetInfo` detecta el retorno de conexión, envía el pedido y sus cambios a Firestore usando su `id` único sin duplicarlo y actualiza su indicador a **Sincronizado**.
6. **Probar DELETE:**
   - En **Detalle del pedido**, toca **Eliminar pedido** y confirma. El registro se retira de SQLite y la eliminación se propaga también a Firestore para evitar que reaparezca.

---

## Cómo Probar el Consumo REST

### 1. Catálogo Pet Shop (`dummyjson.com`)
1. Con internet activo, entra a la pestaña **Catálogo**: observa el indicador de carga inicial y luego la lista de 24 productos reales.
2. Usa la barra de búsqueda, filtra por categoría (`Alimento`, `Accesorios`, `Ropa`, `Juguetes`) o especie (`Perro` / `Gato`), y toca un producto para abrir el modal de detalle rápido.
3. Activa el **Modo Avión** y recarga el catálogo (botón de actualizar o pull-to-refresh) desde cero para comprobar el estado de error de red y el botón **Reintentar** al recuperar conexión.

### 2. Clima para Paseos y Baño (`api.open-meteo.com`)
1. En la pantalla **Inicio**, toca la píldora de clima en vivo integrada en el banner superior para abrir el panel **Clima para paseos**.
2. Cambia entre ciudades (`Lima`, `Arequipa`, `Trujillo`, `Cusco`, `Piura`, `Chiclayo`) y observa cómo se actualizan temperatura, sensación térmica, humedad, viento, índice UV máximo y las recomendaciones automáticas de **Paseo** y **Baño y grooming**.
3. Toca el botón de recarga para consultar nuevamente en vivo; si pierdes internet después de consultar una ciudad, verás los últimos datos guardados con el aviso discreto de respaldo offline (o el botón **Reintentar** si nunca se consultó antes).

### 3. Guía Clínica y Selector de Razas (`dogapi.dog`, `dog.ceo`, `catfact.ninja`)
1. En **Inicio**, toca **Guía clínica de razas**.
2. Explora la pestaña **Perros** (fotografías, peso, esperanza de vida, indicador hipoalergénico y botón **Cargar más razas** para probar paginación) y cambia a **Gatos** para revisar las 98 razas felinas.
3. Usa el buscador, abre la ficha de una raza y presiona **Registrar atención con esta raza**: se abrirá **Nueva solicitud** con la especie y raza precargadas.
4. También puedes abrir **Nueva solicitud** manualmente, elegir especie **Perro** o **Gato** y tocar **Explorar razas** para abrir `BreedPickerModal` con búsqueda en vivo y selección inmediata.

---

## Estructura del Proyecto

El código fuente dentro de `src/` sigue **Clean Architecture** en 4 capas independientes (`domain` <- `application` <- `infrastructure` <- `presentation`):

```text
Amipets/
├── assets/
│   ├── images/                        # Imágenes de portada, bienvenida e ilustraciones vacías
│   ├── pets/                          # Retratos de mascotas por especie
│   └── products/                      # 24 fotografías reales del catálogo Pet Shop
├── docs/                              # Documentación del proyecto en PDF
├── src/
│   ├── domain/                        # [1] Entidades y contratos de repositorios
│   │   ├── models/                    # breed.ts, order.ts, product.ts, request.ts, user.ts, weather.ts
│   │   └── repositories/              # IOrderRepository.ts, IRequestRepository.ts
│   ├── application/                   # [2] Casos de uso, lógica de negocio y utilidades
│   │   ├── services/                  # authService.ts, orderService.ts, requestService.ts, weatherAdviceService.ts
│   │   └── utils/                     # id.ts
│   ├── infrastructure/                # [3] SQLite, consumo REST y Firebase
│   │   ├── database/                  # sqlite.ts (tabla orders y migraciones)
│   │   ├── repositories/              # SqliteOrderRepository.ts, InMemoryRequestRepository.ts
│   │   └── services/                  # breedsApiService.ts, catalogApiService.ts, firebaseConfig.ts, firebaseOrderSyncService.ts, weatherApiService.ts
│   └── presentation/                  # [4] UI, pantallas, navegación y estado
│       ├── components/                # BreedPickerModal.tsx, CatalogPickerModal.tsx, OrderCard.tsx, PawBackdrop.tsx, PetAvatar.tsx, RequestCard.tsx, WeatherPetCard.tsx, Chips.tsx, etc.
│       ├── context/                   # AuthContext.tsx, CatalogContext.tsx, OrdersContext.tsx, RequestsProvider.tsx, ToastContext.tsx
│       ├── navigation/                # MainTabs.tsx, RootNavigator.tsx, types.ts
│       ├── screens/                   # WelcomeScreen, RegisterScreen, HomeScreen, BreedGuideScreen, OrdersScreen, CreateOrderScreen, OrderDetailScreen, CatalogScreen, RequestsScreen, CreateRequestScreen, RequestDetailScreen, CalendarScreen, SettingsScreen
│       ├── store/                     # actions.ts, initialState.ts, requestsReducer.ts
│       ├── theme/                     # colors.ts, typography.ts, index.ts
│       └── utils/                     # date.ts, orderMeta.ts, requestMeta.ts, requests.ts, validation.ts
├── App.tsx                            # Punto de entrada raíz y proveedores
├── app.json                           # Configuración de Expo, paquete Android y plugins nativos
├── eas.json                           # Perfiles de compilación EAS (preview APK / production AAB)
├── metro.config.js                    # Configuración Metro compatible con Firebase JS SDK
├── firebase.json                      # Configuración CLI de Auth, Firestore y Storage
├── firestore.rules                    # Reglas de seguridad por usuario en Firestore
├── firestore.indexes.json             # Índices compuestos de Firestore
├── storage.rules                      # Reglas de seguridad para comprobantes en Storage
├── .env.example                       # Plantilla de variables de entorno de Firebase
├── tsconfig.json                      # Configuración TypeScript (strict)
└── package.json                       # Dependencias y scripts
```

---

## Licencia

Proyecto académico desarrollado para fines educativos y de demostración técnica en la Escuela de Tecnología — IDAT.
