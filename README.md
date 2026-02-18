# AppTIempo — Weather app (Next.js + TypeScript)

Aplicación web para **mostrar el tiempo** según la **ubicación aproximada** detectada por IP y permitir también la **búsqueda por localidad**.

> Estado: el repositorio contiene el scaffold de Next.js (App Router). La lógica de “detectar IP → geolocalizar → consultar tiempo” puede añadirse encima de esta base.

---

## Stack

- **Next.js** (App Router)
- **React**
- **TypeScript**
- **Tailwind CSS**
- **ESLint**

---

## Funcionalidades (objetivo)

- Detectar la **IP** del usuario (o usar un servicio de geolocalización por IP)
- Obtener una **localización** (ciudad / país / lat/lon)
- Consultar una API meteorológica y mostrar:
  - Temperatura
  - Sensación térmica
  - Humedad
  - Viento
  - Estado del cielo
- Buscar por **localidad** manualmente
- (Opcional) Guardar últimas búsquedas

---

## Requisitos

- Node.js 18+ (recomendado)
- npm

---

## Instalación y ejecución

```bash
# 1) Clonar
git clone https://github.com/asogomez22/AppTIempo.git
cd AppTIempo

# 2) Instalar dependencias
npm install

# 3) Arrancar en desarrollo
npm run dev
