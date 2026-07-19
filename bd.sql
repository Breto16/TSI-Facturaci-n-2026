-- ============================================
-- ENUMs (creados solo si no existen)
-- ============================================
DO $$ BEGIN
    CREATE TYPE estado_factura AS ENUM ('abierta', 'impresa', 'dividida', 'pagada', 'anulada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE tipo_pago AS ENUM ('efectivo', 'tarjeta');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE categoria_producto AS ENUM ('salon', 'cocina');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE rol_usuario AS ENUM ('admin', 'cajero', 'salonero');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE acompanamiento_tipo AS ENUM ('yuca', 'papa', 'patacon', 'especial', 'solo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- Usuarios
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(60) NOT NULL,
    usuario VARCHAR(30) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol rol_usuario NOT NULL DEFAULT 'cajero',
    activo BOOLEAN NOT NULL DEFAULT true,
    creado_en TIMESTAMP NOT NULL DEFAULT now()
);

-- ============================================
-- Mesas
-- ============================================
CREATE TABLE IF NOT EXISTS mesas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(20) NOT NULL,
    activa BOOLEAN NOT NULL DEFAULT true
);

-- ============================================
-- Saloneros
-- ============================================
CREATE TABLE IF NOT EXISTS saloneros (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(60) NOT NULL,
    disponible BOOLEAN NOT NULL DEFAULT true,
    usuario_id INT REFERENCES usuarios(id)
);

-- ============================================
-- Productos
-- ============================================
CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(45),
    descripcion VARCHAR(100) NOT NULL,
    precio NUMERIC(10,2) NOT NULL,
    disponible BOOLEAN NOT NULL DEFAULT true,
    prioridad INT NOT NULL DEFAULT 0,
    categoria categoria_producto NOT NULL DEFAULT 'salon',
    requiere_acompanamiento BOOLEAN NOT NULL DEFAULT false,
    tiene_variantes BOOLEAN NOT NULL DEFAULT false,
    requiere_ficha BOOLEAN NOT NULL DEFAULT false,
    prefijo_en_variante BOOLEAN NOT NULL DEFAULT false
);

-- Por si la tabla ya existía de una instalación anterior sin estas columnas
ALTER TABLE productos ADD COLUMN IF NOT EXISTS requiere_acompanamiento BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS tiene_variantes BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS requiere_ficha BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS prefijo_en_variante BOOLEAN NOT NULL DEFAULT false;

-- ============================================
-- Variantes de producto
-- ============================================
CREATE TABLE IF NOT EXISTS producto_variantes (
    id SERIAL PRIMARY KEY,
    producto_id INT NOT NULL REFERENCES productos(id),
    nombre VARCHAR(60) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT true
);

-- ============================================
-- Histórico de precios de producto
-- ============================================
CREATE TABLE IF NOT EXISTS producto_historico_precio (
    id SERIAL PRIMARY KEY,
    producto_id INT NOT NULL REFERENCES productos(id),
    precio_anterior NUMERIC(10,2),
    precio_nuevo NUMERIC(10,2),
    cambiado_en TIMESTAMP NOT NULL DEFAULT now()
);

-- ============================================
-- Histórico de precio de trucha cruda
-- ============================================
CREATE TABLE IF NOT EXISTS trucha_cruda_precio (
    id SERIAL PRIMARY KEY,
    precio_gramo NUMERIC(10,2) NOT NULL,
    fecha_inicio TIMESTAMP NOT NULL DEFAULT now(),
    fecha_fin TIMESTAMP
);

-- ============================================
-- Facturas
-- ============================================
CREATE TABLE IF NOT EXISTS facturas (
    id SERIAL PRIMARY KEY,
    mesa_id INT REFERENCES mesas(id),
    salonero_id INT REFERENCES saloneros(id),
    detalle VARCHAR(250),
    estado estado_factura NOT NULL DEFAULT 'abierta',
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
    descuento NUMERIC(10,2) NOT NULL DEFAULT 0,
    servicio NUMERIC(10,2) NOT NULL DEFAULT 0,
    total NUMERIC(10,2) NOT NULL DEFAULT 0,
    tiene_trucha BOOLEAN NOT NULL DEFAULT false,
    trucha_gramos NUMERIC(10,2),
    trucha_precio_gramo NUMERIC(10,2),
    trucha_total NUMERIC(10,2),
    tipo_pago tipo_pago,
    monto_recibido NUMERIC(10,2),
    cambio NUMERIC(10,2),
    truchas_pendientes_cocina INT DEFAULT 0,
    fecha_apertura TIMESTAMP NOT NULL DEFAULT now(),
    fecha_cierre TIMESTAMP
);

ALTER TABLE facturas ADD COLUMN IF NOT EXISTS truchas_pendientes_cocina INT DEFAULT 0;

-- ============================================
-- Items de factura
-- ============================================
CREATE TABLE IF NOT EXISTS factura_items (
    id SERIAL PRIMARY KEY,
    factura_id INT NOT NULL REFERENCES facturas(id),
    producto_id INT REFERENCES productos(id),
    descripcion VARCHAR(100) NOT NULL,
    precio_unitario NUMERIC(10,2) NOT NULL,
    cantidad INT NOT NULL,
    total NUMERIC(10,2) NOT NULL
);

-- ============================================
-- Divisiones de factura
-- ============================================
CREATE TABLE IF NOT EXISTS factura_divisiones (
    id SERIAL PRIMARY KEY,
    factura_padre_id INT NOT NULL REFERENCES facturas(id),
    factura_hija_id INT NOT NULL REFERENCES facturas(id)
);

-- ============================================
-- Cierres de caja
-- ============================================
CREATE TABLE IF NOT EXISTS cierres_caja (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL UNIQUE,
    total_sistema NUMERIC(10,2) NOT NULL,
    total_efectivo_contado NUMERIC(10,2),
    total_tarjeta_datafono NUMERIC(10,2),
    diferencia NUMERIC(10,2),
    creado_en TIMESTAMP NOT NULL DEFAULT now(),
    creado_por INT REFERENCES usuarios(id)
);

-- ============================================
-- Consultas rápidas
-- ============================================
CREATE TABLE IF NOT EXISTS consultas_rapidas (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(60) NOT NULL,
    producto_codigos TEXT[] NOT NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT now()
);

-- Por si la tabla viene de una instalación vieja con el nombre/tipo original
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'consultas_rapidas' AND column_name = 'producto_ids'
    ) THEN
        ALTER TABLE consultas_rapidas RENAME COLUMN producto_ids TO producto_codigos;
        ALTER TABLE consultas_rapidas ALTER COLUMN producto_codigos TYPE TEXT[];
    END IF;
END $$;

-- ============================================
-- Comandas
-- ============================================
CREATE TABLE IF NOT EXISTS comandas (
    id SERIAL PRIMARY KEY,
    mesa_id INT NOT NULL REFERENCES mesas(id),
    salonero_id INT REFERENCES saloneros(id),
    factura_id INT REFERENCES facturas(id),
    detalle VARCHAR(250),
    ficha VARCHAR(30),
    creado_en TIMESTAMP NOT NULL DEFAULT now()
);

ALTER TABLE comandas ADD COLUMN IF NOT EXISTS detalle VARCHAR(250);
ALTER TABLE comandas ADD COLUMN IF NOT EXISTS ficha VARCHAR(30);
ALTER TABLE comandas ADD COLUMN IF NOT EXISTS factura_id INT REFERENCES facturas(id);

-- ============================================
-- Items de comanda
-- ============================================
CREATE TABLE IF NOT EXISTS comanda_items (
    id SERIAL PRIMARY KEY,
    comanda_id INT NOT NULL REFERENCES comandas(id),
    producto_id INT REFERENCES productos(id),
    descripcion VARCHAR(100) NOT NULL,
    cantidad INT NOT NULL,
    categoria categoria_producto NOT NULL,
    variante VARCHAR(60),
    acompanamiento acompanamiento_tipo,
    detalle VARCHAR(200),
    ficha VARCHAR(30),
    despachado BOOLEAN NOT NULL DEFAULT false,
    despachado_en TIMESTAMP
);

ALTER TABLE comanda_items ADD COLUMN IF NOT EXISTS ficha VARCHAR(30);

-- ============================================
-- Configuración general
-- ============================================
CREATE TABLE IF NOT EXISTS configuracion (
    clave VARCHAR(50) PRIMARY KEY,
    valor TEXT NOT NULL
);

INSERT INTO configuracion (clave, valor) VALUES ('cierre_password', 'clave123')
ON CONFLICT (clave) DO NOTHING;

INSERT INTO configuracion (clave, valor) VALUES ('pin_salonero', '1234')
ON CONFLICT (clave) DO NOTHING;

-- ============================================
-- Índices
-- ============================================
CREATE INDEX IF NOT EXISTS idx_facturas_mesa_estado ON facturas(mesa_id, estado);
CREATE INDEX IF NOT EXISTS idx_facturas_fecha ON facturas(fecha_apertura);
CREATE INDEX IF NOT EXISTS idx_factura_items_factura ON factura_items(factura_id);
CREATE INDEX IF NOT EXISTS idx_factura_items_producto ON factura_items(producto_id);
CREATE INDEX IF NOT EXISTS idx_comandas_mesa ON comandas(mesa_id);
CREATE INDEX IF NOT EXISTS idx_comandas_factura ON comandas(factura_id);
CREATE INDEX IF NOT EXISTS idx_comanda_items_comanda ON comanda_items(comanda_id);
CREATE INDEX IF NOT EXISTS idx_comanda_items_despachado ON comanda_items(despachado);

-- ============================================
-- Normalización y flags de negocio para productos
-- (son UPDATE por condición: seguros de re-ejecutar, no duplican nada)
-- ============================================
UPDATE productos SET descripcion = 'Trucha Acompañada' WHERE descripcion ILIKE 'trucha acompañada';
UPDATE productos SET descripcion = 'Trucha Doble' WHERE descripcion ILIKE 'trucha doble';
UPDATE productos SET descripcion = 'Trucha Sola' WHERE descripcion ILIKE 'trucha sola';
UPDATE productos SET descripcion = 'Trucha Jumbo' WHERE descripcion ILIKE 'trucha jumbo';

UPDATE productos SET requiere_acompanamiento = true
WHERE descripcion ILIKE 'trucha%'
   OR descripcion ILIKE 'lomo%'
   OR descripcion ILIKE 'pollo%'
   OR descripcion ILIKE 'tilapia%';

UPDATE productos SET requiere_ficha = true
WHERE descripcion ILIKE 'trucha%';

UPDATE productos SET categoria = 'cocina'
WHERE descripcion ILIKE 'trucha%'
   OR descripcion ILIKE 'lomo%'
   OR descripcion ILIKE 'pollo%'
   OR descripcion ILIKE 'tilapia%';