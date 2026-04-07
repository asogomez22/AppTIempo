# AppTiempo

Aplicacion del tiempo hecha con Next.js y preparada para desplegarse en un VPS con Docker y GitHub Actions, publicada solo por el puerto `1234`.

## Que incluye este repo

- App real, no solo el scaffold de Next.js.
- Busqueda de ciudades.
- Consulta por ubicacion actual del navegador.
- Prevision por horas y por dias.
- Dockerfile listo para produccion.
- CI con `lint` + `build`.
- CD con push de imagen a GHCR y redeploy automatico por SSH al VPS.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Docker
- GitHub Actions
- Open-Meteo API

## Estructura importante

- `app/`: layout y pagina principal.
- `components/weather-dashboard.tsx`: interfaz y logica cliente.
- `lib/weather.ts`: llamadas a Open-Meteo y formateo.
- `.github/workflows/ci.yml`: validacion continua.
- `.github/workflows/deploy.yml`: despliegue automatico al VPS.
- `Dockerfile`: imagen de produccion en puerto `1234`.

## Ejecutar en local

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

## Probar el contenedor en local

```bash
docker build -t apptiempo .
docker run --rm -p 1234:1234 apptiempo
```

Abre `http://localhost:1234`.

## Secrets que tienes que crear en GitHub

En `GitHub -> Settings -> Secrets and variables -> Actions` crea:

- `VPS_HOST`: IP o dominio del VPS.
- `VPS_USER`: usuario SSH del VPS.
- `VPS_PORT`: puerto SSH, normalmente `22`.
- `VPS_SSH_KEY`: clave privada SSH del usuario que entra al VPS.
- `GHCR_USERNAME`: usuario de GitHub que tenga acceso al paquete.
- `GHCR_TOKEN`: token con al menos `read:packages`.

Notas:

- El workflow usa `GITHUB_TOKEN` para publicar la imagen en GHCR desde Actions.
- En el VPS se usa `GHCR_USERNAME` + `GHCR_TOKEN` para hacer `docker pull`.
- Si el repo o el paquete son privados, el token debe tener acceso suficiente.

## Preparacion del VPS

Entra al VPS y deja Docker instalado:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

Cierra y abre sesion otra vez si has anadido el grupo `docker`.

Comprueba que Docker funciona:

```bash
docker ps
```

Si usas `ufw`, abre tambien el puerto publico de la app:

```bash
sudo ufw allow 1234/tcp
```

## Como funciona el despliegue

Cuando haces push a `main`:

1. `ci.yml` ejecuta `npm ci`, `npm run lint` y `npm run build`.
2. `deploy.yml` vuelve a validar, construye la imagen Docker y la sube a GHCR.
3. GitHub Actions entra por SSH al VPS.
4. Hace `docker pull`.
5. Para y recrea el contenedor `apptiempo`.
6. Publica la app con `-p 1234:1234`.

La URL final sera:

```text
http://TU_IP_DEL_VPS:1234
```

## Lo que tienes que hacer ahora

1. Sube este repo a GitHub si aun no esta.
2. Asegurate de que la rama principal sea `main`.
3. Crea los secrets indicados arriba.
4. Instala Docker en el VPS.
5. Haz un push a `main`.
6. Revisa la pestana `Actions` y espera a que termine `Deploy to VPS`.
7. Abre `http://TU_IP_DEL_VPS:1234`.

## Comandos utiles en el VPS

```bash
docker ps
docker logs -f apptiempo
docker inspect apptiempo --format '{{json .State.Health}}'
```

## Que ensenar en el video de la actividad

1. La app funcionando en `http://TU_IP:1234`.
2. El codigo del proyecto y que hace.
3. Los workflows de GitHub Actions.
4. Un commit y push real.
5. Como se vuelve a desplegar solo.
6. El contenedor corriendo en el VPS con `docker ps` y `docker logs`.

## Nota para la defensa

El enunciado dice "preferiblemente en Laravel", pero no obliga. Este proyecto sigue siendo valido porque:

- Es un proyecto propio.
- Esta desplegado en produccion.
- Usa CI/CD real con GitHub Actions.
- Automatiza el redeploy en un VPS.

Si quieres optar a mejor nota, en el video explica bien por que elegiste esta app, como funciona el pipeline y demuestra el redeploy de extremo a extremo.
