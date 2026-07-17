-- ============================================
-- ENUMs
-- ============================================
CREATE TYPE estado_factura AS ENUM ('abierta', 'impresa', 'dividida', 'pagada', 'anulada');
CREATE TYPE tipo_pago AS ENUM ('efectivo', 'tarjeta');
CREATE TYPE categoria_producto AS ENUM ('salon', 'cocina');
CREATE TYPE rol_usuario AS ENUM ('admin', 'cajero', 'salonero');

-- ============================================
-- Usuarios
-- ============================================
CREATE TABLE usuarios (
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
CREATE TABLE mesas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(20) NOT NULL,
    activa BOOLEAN NOT NULL DEFAULT true
);

-- ============================================
-- Saloneros
-- ============================================
CREATE TABLE saloneros (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(60) NOT NULL,
    disponible BOOLEAN NOT NULL DEFAULT true,
    usuario_id INT REFERENCES usuarios(id)
);

-- ============================================
-- Productos
-- ============================================
CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(45),
    descripcion VARCHAR(100) NOT NULL,
    precio NUMERIC(10,2) NOT NULL,
    disponible BOOLEAN NOT NULL DEFAULT true,
    prioridad INT NOT NULL DEFAULT 0,
    categoria categoria_producto NOT NULL DEFAULT 'salon'
);

-- ============================================
-- Histórico de precios de producto
-- ============================================
CREATE TABLE producto_historico_precio (
    id SERIAL PRIMARY KEY,
    producto_id INT NOT NULL REFERENCES productos(id),
    precio_anterior NUMERIC(10,2),
    precio_nuevo NUMERIC(10,2),
    cambiado_en TIMESTAMP NOT NULL DEFAULT now()
);

-- ============================================
-- Histórico de precio de trucha cruda
-- ============================================
CREATE TABLE trucha_cruda_precio (
    id SERIAL PRIMARY KEY,
    precio_gramo NUMERIC(10,2) NOT NULL,
    fecha_inicio TIMESTAMP NOT NULL DEFAULT now(),
    fecha_fin TIMESTAMP
);

-- ============================================
-- Facturas
-- ============================================
CREATE TABLE facturas (
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
    fecha_apertura TIMESTAMP NOT NULL DEFAULT now(),
    fecha_cierre TIMESTAMP
);

-- ============================================
-- Items de factura
-- ============================================
CREATE TABLE factura_items (
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
CREATE TABLE factura_divisiones (
    id SERIAL PRIMARY KEY,
    factura_padre_id INT NOT NULL REFERENCES facturas(id),
    factura_hija_id INT NOT NULL REFERENCES facturas(id)
);

-- ============================================
-- Cierres de caja
-- ============================================
CREATE TABLE cierres_caja (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL UNIQUE,
    total_sistema NUMERIC(10,2) NOT NULL,
    total_efectivo_contado NUMERIC(10,2),
    total_tarjeta_datafono NUMERIC(10,2),
    diferencia NUMERIC(10,2),
    creado_en TIMESTAMP NOT NULL DEFAULT now(),
    creado_por INT REFERENCES usuarios(id)
);

CREATE TABLE consultas_rapidas (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(60) NOT NULL,
    producto_ids INT[] NOT NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT now()
);

-- ============================================
-- Índices
-- ============================================
CREATE INDEX idx_facturas_mesa_estado ON facturas(mesa_id, estado);
CREATE INDEX idx_facturas_fecha ON facturas(fecha_apertura);
CREATE INDEX idx_factura_items_factura ON factura_items(factura_id);
CREATE INDEX idx_factura_items_producto ON factura_items(producto_id);


ALTER TABLE consultas_rapidas RENAME COLUMN producto_ids TO producto_codigos;
ALTER TABLE consultas_rapidas ALTER COLUMN producto_codigos TYPE TEXT[];
ALTER TABLE facturas ADD COLUMN truchas_pendientes_cocina INT DEFAULT 0;
CREATE TABLE configuracion (
    clave VARCHAR(50) PRIMARY KEY,
    valor TEXT NOT NULL
);

INSERT INTO configuracion (clave, valor) VALUES ('cierre_password', 'clave123');

CREATE TYPE acompanamiento_tipo AS ENUM ('yuca', 'papa', 'patacon', 'especial', 'solo');

ALTER TABLE productos ADD COLUMN requiere_acompanamiento BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE productos ADD COLUMN tiene_variantes BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE producto_variantes (
    id SERIAL PRIMARY KEY,
    producto_id INT NOT NULL REFERENCES productos(id),
    nombre VARCHAR(60) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE comandas (
    id SERIAL PRIMARY KEY,
    mesa_id INT NOT NULL REFERENCES mesas(id),
    salonero_id INT REFERENCES saloneros(id),
    creado_en TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE comanda_items (
    id SERIAL PRIMARY KEY,
    comanda_id INT NOT NULL REFERENCES comandas(id),
    producto_id INT REFERENCES productos(id),
    descripcion VARCHAR(100) NOT NULL,
    cantidad INT NOT NULL,
    categoria categoria_producto NOT NULL,
    variante VARCHAR(60),
    acompanamiento acompanamiento_tipo,
    detalle VARCHAR(200),
    despachado BOOLEAN NOT NULL DEFAULT false,
    despachado_en TIMESTAMP
);

CREATE INDEX idx_comandas_mesa ON comandas(mesa_id);
CREATE INDEX idx_comanda_items_comanda ON comanda_items(comanda_id);
CREATE INDEX idx_comanda_items_despachado ON comanda_items(despachado);

ALTER TABLE productos ADD COLUMN requiere_ficha BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE comanda_items ADD COLUMN ficha VARCHAR(30);

UPDATE productos SET descripcion = 'Trucha Acompañada' WHERE descripcion ILIKE 'trucha acompañada';
UPDATE productos SET descripcion = 'Trucha Doble' WHERE descripcion ILIKE 'trucha doble';
UPDATE productos SET descripcion = 'Trucha Sola' WHERE descripcion ILIKE 'trucha sola';
UPDATE productos SET descripcion = 'Trucha Jumbo' WHERE descripcion ILIKE 'trucha jumbo';


-- Acompañamiento aplica a los 4 platos principales (y sus versiones de niño)
UPDATE productos SET requiere_acompanamiento = true
WHERE descripcion ILIKE 'trucha%'
   OR descripcion ILIKE 'lomo%'
   OR descripcion ILIKE 'pollo%'
   OR descripcion ILIKE 'tilapia%';

-- Ficha solo aplica a trucha (es la única que depende de la ficha del cliente)
UPDATE productos SET requiere_ficha = true
WHERE descripcion ILIKE 'trucha%';

ALTER TABLE comandas ADD COLUMN detalle VARCHAR(250);

ALTER TABLE comandas ADD COLUMN ficha VARCHAR(30);

ALTER TABLE productos ADD COLUMN prefijo_en_variante BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE comandas ADD COLUMN factura_id INT REFERENCES facturas(id);
CREATE INDEX idx_comandas_factura ON comandas(factura_id);