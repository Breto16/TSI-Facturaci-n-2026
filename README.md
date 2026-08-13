# TSI Facturación 2026

Sistema web de punto de venta (POS) y operación de restaurante. Centraliza la atención de mesas, comandas, facturación, impresión térmica y cierre de caja, con una operación pensada para trabajo simultáneo entre salón, cocina y caja.

> **Proyecto privado de portafolio:** esta documentación preserva la configuración, el alcance y los procedimientos de ejecución para futuras demostraciones, mantenimiento o despliegues personales. No está planteado como un proyecto de contribución pública.

## Índice

- [Qué resuelve el sistema](#qué-resuelve-el-sistema)
- [Flujo operativo](#flujo-operativo)
- [Características](#características)
- [Arquitectura](#arquitectura)
- [Requisitos](#requisitos)
- [Instalación y configuración](#instalación-y-configuración)
- [Ejecutar el proyecto](#ejecutar-el-proyecto)
- [Pruebas y verificación](#pruebas-y-verificación)
- [Operación en producción](#operación-en-producción)
- [Despliegue actual en producción](#despliegue-actual-en-producción)
- [Base de datos y migración](#base-de-datos-y-migración)
- [API y seguridad](#api-y-seguridad)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Consideraciones y trabajo pendiente](#consideraciones-y-trabajo-pendiente)

## Qué resuelve el sistema

TSI Facturación 2026 es una solución para restaurante —con soporte específico para venta de trucha por peso— que cubre el recorrido completo de una orden:

```text
Mesa → cuenta/factura → comanda → cocina o salón → cobro → impresión → cierre diario
```

Los perfiles de uso son:

| Perfil | Responsabilidad principal |
| --- | --- |
| `salonero` | Acceder a mesas y registrar/gestionar comandas. |
| `cajero` | Administrar facturas, ítems, cobros e impresión. |
| `admin` | Acceso operativo completo, catálogo, personal, configuración y cierre. |

## Flujo operativo

1. Un usuario inicia sesión. Las rutas y acciones están protegidas mediante JWT.
2. El salón selecciona una mesa y abre o elige una cuenta/factura.
3. El salonero registra una comanda con productos, variantes, acompañamientos, detalle y ficha cuando aplica.
4. La cocina/salón recibe y despacha los ítems. Socket.IO notifica los cambios para refrescar el estado de las mesas en tiempo real.
5. Caja revisa la factura, agrega o ajusta ítems, aplica descuento/servicio, divide cuentas si es necesario y registra el pago.
6. El sistema genera comprobantes PDF para impresión térmica, puede abrir la gaveta y registra información para consultas y cierre.

## Características

- Mapa visual de mesas con estados de disponibilidad, ocupación, pago y división.
- Múltiples cuentas por mesa y facturas divididas.
- Comandas ligadas a facturas, con despacho, cancelación, reducción de cantidad, reimpresión y fichas.
- Catálogo de productos de salón/cocina, disponibilidad, prioridades, variantes y acompañamientos.
- Facturación con subtotal, descuento, servicio, total, efectivo/tarjeta y cálculo de cambio.
- Producto especializado de trucha cruda: precio por gramo e histórico de precios.
- Impresión de factura y cierre; integración con impresora térmica y gaveta registradora.
- Consultas rápidas de productos, ventas, servicio por salonero y cierre de caja por rango de fechas.
- Administración de usuarios, saloneros y PIN de salonero.
- Interfaz React adaptable y actualizaciones en tiempo real mediante Socket.IO.

## Arquitectura

| Capa | Tecnología | Función |
| --- | --- | --- |
| Cliente | React 19, Vite, React Bootstrap, Axios | Interfaz de operación y consumo de API. |
| Servidor | Node.js, Express 5 | API REST, autenticación, archivos estáticos y reglas de negocio. |
| Tiempo real | Socket.IO | Sincronización de mesas y comandas entre puestos. |
| Datos | PostgreSQL (`pg`) | Facturas, ítems, comandas, productos, usuarios, cierres e históricos. |
| Impresión | PDFKit, `node-thermal-printer` | Generación de comprobantes e impresión térmica. |
| Seguridad de transporte | HTTPS + redirección HTTP | Servicio de la aplicación en la LAN. |

En producción, Express sirve el contenido generado en `frontend/dist` y la API bajo `/api`. En desarrollo Vite sirve el cliente en un puerto distinto, por lo que el frontend debe conocer la URL de la API.

## Requisitos

- Node.js LTS (se recomienda Node.js 20 o posterior).
- npm.
- PostgreSQL 14 o posterior, accesible desde el backend.
- Windows para el flujo actual de impresión local (SumatraPDF/gaveta, si se usan).
- Para HTTPS local: [mkcert](https://github.com/FiloSottile/mkcert) o certificados TLS válidos para los equipos de la red.

## Instalación y configuración

### 1. Instalar dependencias

Desde la raíz del proyecto:

```powershell
cd backend
npm install

cd ..\frontend
npm install
```

Si se va a ejecutar la migración desde una base MySQL histórica:

```powershell
cd ..\migracion
npm install
```

### 2. Crear la base de datos

Crear una base de datos PostgreSQL vacía e importar el esquema incluido:

```powershell
psql -U postgres -d tsi_facturacion -f .\bd.sql
```

El script es idempotente en gran parte: crea tablas, tipos, índices y varias columnas con `IF NOT EXISTS`. Aun así, antes de ejecutarlo sobre una instalación con datos reales, haga un respaldo de la base.

### 3. Configurar variables de entorno

Crear `backend/.env` con, como mínimo:

```dotenv
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=CAMBIAR_POR_UN_SECRETO
PG_DATABASE=tsi_facturacion
JWT_SECRET=CAMBIAR_POR_UN_SECRETO_LARGO_Y_ALEATORIO

# Puertos del servidor integrado
HTTPS_PORT=4443
PORT=4000

# Datos que aparecerán en el comprobante; son opcionales
RESTAURANTE_EMAIL=correo@ejemplo.com
RESTAURANTE_WEB=https://ejemplo.com
RESTAURANTE_TEL=0000-0000
RESTAURANTE_DIRECCION=Dirección del restaurante
RESTAURANTE_MENSAJE=¡Muchas gracias por su visita!

# Opcionales: impresión local en Windows
PRINTER_NAME=Nombre exacto de la impresora
SUMATRA_PATH=C:\Program Files\SumatraPDF\SumatraPDF.exe
CAJA_REGISTRADORA=false
```

Crear `frontend/.env` para desarrollo:

```dotenv
VITE_API_URL=https://localhost:4443/api
```

> `*.env` está ignorado por Git. No versionar contraseñas, claves JWT ni configuraciones internas.

### 4. Preparar certificados HTTPS

El servidor actual exige que `backend/certs` contenga un certificado y una llave PEM; busca automáticamente un archivo `*-key.pem` y otro `.pem`. Esta carpeta está excluida de Git deliberadamente.

Ejemplo con mkcert, ejecutado desde `backend`:

```powershell
mkcert -install
New-Item -ItemType Directory -Force certs
mkcert -key-file certs\localhost-key.pem -cert-file certs\localhost.pem localhost 127.0.0.1 ::1
```

Para utilizar la aplicación en otros equipos de la LAN, genere el certificado incluyendo el nombre DNS y/o IP privada del servidor, e instale la autoridad raíz de mkcert en los clientes que corresponda. Sin ambos archivos, el backend no inicia actualmente.

### 5. Crear el primer usuario administrador

Con la base configurada:

```powershell
cd backend
node .\scripts\crearAdmin.js
```

El script crea `admin` / `admin`. Úselo solo para la inicialización y cambie esa contraseña inmediatamente desde una vía administrativa segura. Si ya existe ese usuario, PostgreSQL rechazará la inserción por ser único.

## Ejecutar el proyecto

### Desarrollo

Abra dos terminales desde la raíz.

Terminal 1, backend:

```powershell
cd backend
npm run dev
```

Terminal 2, frontend:

```powershell
cd frontend
npm run dev
```

Abra la URL indicada por Vite, normalmente `http://localhost:5173`. También puede usar `Dev Launcher.bat`, que abre ambos procesos y luego el navegador.

El frontend se comunica con `VITE_API_URL`; configure esa variable con `https://` para que coincida con el servidor actual. Si el navegador alerta sobre el certificado local, instale/confíe la autoridad de mkcert en vez de ignorar el aviso.

### Producción / servidor integrado

```powershell
cd frontend
npm run build

cd ..\backend
npm start
```

Express servirá la aplicación compilada por HTTPS en `https://<servidor>:4443` de forma predeterminada. El puerto `4000` solo redirige al puerto HTTPS; no sirve la aplicación directamente.

## Pruebas y verificación

### Verificaciones automatizables disponibles

El repositorio no define pruebas unitarias o de integración. Antes de desplegar, ejecute como mínimo:

```powershell
cd frontend
npm run lint
npm run build
```

El backend no dispone de un script de prueba; compruebe su arranque con `npm start` después de cargar la configuración y la base de datos. Debe aparecer `BD CONECTADA` en la consola.

### Recorrido manual recomendado

| Caso | Resultado esperado |
| --- | --- |
| Inicio de sesión | Solo usuarios activos acceden; el perfil determina las rutas visibles. |
| Mesa nueva | Se crea o selecciona una factura y la mesa refleja su estado. |
| Comanda | Se agregan productos, variante/acompañamiento/detalle y se refleja en las vistas activas. |
| Despacho | El ítem cambia su estado y el resto de puestos se actualiza sin recargar manualmente. |
| Factura | Subtotal, descuento, servicio y total son coherentes al añadir/modificar/eliminar ítems. |
| Cobro | Efectivo/tarjeta, monto recibido y cambio quedan registrados. |
| División | Los ítems migran a la factura hija y los totales se mantienen correctos. |
| Impresión | Se genera el comprobante y, si está configurada, se envía a la impresora/gaveta correcta. |
| Cierre | Los totales por rango, servicios y el cierre impreso coinciden con las facturas pagadas. |

## Operación en producción

- Use una cuenta de PostgreSQL con permisos mínimos necesarios para la aplicación.
- Realice respaldos periódicos y pruebe la restauración. Por ejemplo: `pg_dump -U <usuario> tsi_facturacion > respaldo.sql`.
- Mantenga secretos en variables de entorno administradas, no en archivos compartidos ni en Git.
- Use una clave `JWT_SECRET` aleatoria y distinta por entorno.
- Cambie las credenciales iniciales y los valores por defecto (`cierre_password` y `pin_salonero`) antes de abrir operación.
- Verifique que cada estación de la red confíe el certificado HTTPS. Socket.IO usa el mismo origen HTTPS en producción.
- Confirme el nombre exacto de la impresora Windows antes de habilitar `PRINTER_NAME` y `CAJA_REGISTRADORA`.

## Despliegue actual en producción

El sistema se encuentra en uso en un entorno real de restaurante. Su despliegue actual es intencionalmente simple y está orientado a una red local:

```text
Dispositivos del restaurante
       │  HTTPS (certificado confiable instalado)
       ▼
PC servidor · Linux Mint
       │  PM2 ejecuta el backend Express
       ├── API REST + Socket.IO
       └── frontend compilado (frontend/dist)
       ▼
PostgreSQL
```

La PC de producción ejecuta el backend con PM2 al iniciar el sistema. Express sirve tanto la API como el frontend previamente compilado; por ello, antes de actualizar producción se debe ejecutar `npm run build` dentro de `frontend` y luego reiniciar el proceso de PM2.

Ejemplo de operación en el servidor Linux:

```bash
# Una vez instaladas las dependencias y configurado backend/.env
cd /ruta/al/proyecto/frontend
npm run build

cd ../backend
pm2 start index.js --name tsi-facturacion
pm2 save
pm2 startup
```

Después de que PM2 muestre el comando de inicio generado, ejecútelo con los permisos indicados por PM2. Para actualizaciones posteriores:

```bash
cd /ruta/al/proyecto/frontend && npm run build
pm2 restart tsi-facturacion
pm2 logs tsi-facturacion
```

Los equipos clientes tienen instalados los certificados necesarios para confiar en el HTTPS del servidor, evitando advertencias del navegador y permitiendo que las conexiones de Socket.IO funcionen con el mismo origen seguro.

### Alcance y riesgos operativos

Este modelo es adecuado para una operación LAN pequeña o mediana, y demuestra un uso productivo real. Sin embargo, la PC servidor y la base de datos constituyen puntos únicos de fallo. Para preservar la continuidad del negocio se recomienda:

- Programar respaldos diarios de PostgreSQL hacia una ubicación distinta al servidor y probar su restauración periódicamente.
- Supervisar procesos y registros con `pm2 status` y `pm2 logs`; instalar `pm2-logrotate` para evitar que los registros agoten el disco.
- Restringir los puertos del servidor al segmento de red necesario; no exponer el sistema directamente a Internet.
- Respaldar y proteger `backend/.env` y las llaves/certificados TLS, sin incorporarlos al repositorio.
- Documentar la renovación de certificados y el procedimiento para incorporar un dispositivo nuevo.
- Considerar, como evolución futura, un proxy inverso (Caddy o Nginx) para centralizar TLS y configuración de red.

## Base de datos y migración

`bd.sql` define el modelo de PostgreSQL. Sus entidades principales son:

| Grupo | Tablas |
| --- | --- |
| Operación | `mesas`, `saloneros`, `comandas`, `comanda_items` |
| Venta | `facturas`, `factura_items`, `factura_divisiones`, `cierres_caja` |
| Catálogo | `productos`, `producto_variantes`, `producto_historico_precio`, `trucha_cruda_precio` |
| Administración | `usuarios`, `configuracion`, `consultas_rapidas` |

La carpeta `migracion/` contiene una utilidad para mover datos desde MySQL a PostgreSQL. **No es una tarea de rutina:** su proceso limpia la base destino antes de migrar. Ejecútela únicamente sobre una base de destino validada y respaldada.

Para configurarla, cree `migracion/.env` con las variables de PostgreSQL ya descritas y además:

```dotenv
MYSQL_HOST=localhost
MYSQL_USER=usuario_origen
MYSQL_PASSWORD=secreto_origen
MYSQL_DATABASE=base_origen
```

Después de revisar conexiones y respaldos:

```powershell
cd migracion
node .\index.js
```

## API y seguridad

La API se publica bajo `/api`. Salvo `POST /api/usuarios/login`, las rutas usan el encabezado `x-token` con un JWT. El token dura 12 horas.

Principales grupos de endpoints:

| Ruta | Propósito |
| --- | --- |
| `/api/usuarios` | Inicio de sesión y administración de usuarios. |
| `/api/mesas` | Mesas y su estado operativo. |
| `/api/facturas` | Facturas, ítems, totales, divisiones y movimientos. |
| `/api/comandas` | Creación, consulta, despacho, cambios y reimpresión de comandas. |
| `/api/productos` | Productos, disponibilidad y variantes. |
| `/api/saloneros` | Personal de salón. |
| `/api/trucha` | Precio vigente por gramo. |
| `/api/consultas` | Ventas, servicio, consultas rápidas y cierre. |
| `/api/impresion` | Factura, cierre y apertura de caja. |
| `/api/configuracion` | PIN de salonero y contraseña de cierre. |

Actualmente la autorización de administrador se aplica explícitamente a la administración de usuarios y a la interfaz; al extender la API, proteja también en el servidor toda acción sensible, no solo en React.

## Estructura del repositorio

```text
.
├── backend/                 # Express, API, Socket.IO, modelos e impresión
│   ├── controllers/         # Casos de uso HTTP
│   ├── models/              # Consultas SQL y generación de comprobantes
│   ├── routes/              # Endpoints REST
│   ├── middlewares/         # JWT y roles
│   ├── scripts/             # Inicialización administrativa
│   └── db/                  # Conexión PostgreSQL
├── frontend/                # React + Vite
│   └── src/
│       ├── pages/           # Mesas, comandas, facturas, cierre, etc.
│       ├── services/        # Cliente API y Socket.IO
│       └── context/         # Autenticación y tema
├── migracion/               # Migración MySQL → PostgreSQL
├── bd.sql                   # Esquema y ajustes de base de datos
└── Dev Launcher.bat         # Atajo Windows para desarrollo
```

## Consideraciones y trabajo pendiente

- Documentar y versionar una estrategia de despliegue de certificados (o hacer configurables las rutas TLS). Hoy los certificados son un prerrequisito local no incluido en el repositorio.
- Incorporar pruebas unitarias, de integración y de flujo crítico de facturación/comandas.
- Añadir ejemplos de variables de entorno como `backend/.env.example`, `frontend/.env.example` y `migracion/.env.example` sin secretos.
- Revisar la autorización de todos los endpoints sensibles en backend y no depender solo de restricciones de la interfaz.
- Definir procedimientos operativos para respaldo, restauración, cierre diario y recuperación ante indisponibilidad de impresora/red.

---

Este README funciona como referencia de portafolio y guía personal de operación: permite reconstruir el entorno, demostrar el flujo de negocio y mantener el proyecto a futuro sin depender de conocimiento externo.
