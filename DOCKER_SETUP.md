# Instrucciones de Despliegue con Docker

## Requisitos Previos
1. Tener Docker y Docker Compose instalados en tu sistema
2. Tener una clave de API de OpenAI
3. Tener acceso a las imágenes Docker en Docker Hub o configurar para construirlas localmente

## Pasos para Desplegar

### 1. Configurar Variables de Entorno
Copia el archivo de ejemplo `.env.docker.example` a `.env`:

```bash
cp .env.docker.example .env
```

Edita el archivo `.env` y asegúrate de reemplazar:
- `DOCKERHUB_USERNAME`: Tu nombre de usuario de Docker Hub (si vas a usar imágenes publicadas)
- `OPENAI_API_KEY`: Tu clave de API de OpenAI
- `NEXTAUTH_SECRET`: Una cadena aleatoria segura para NextAuth
- Los demás valores si necesitas personalizarlos

### 2. Construir y Iniciar los Contenedores

```bash
docker-compose up -d
```

Este comando construirá las imágenes necesarias (frontend, backend) y configurará la base de datos PostgreSQL.

### 3. Aplicar Migraciones de Prisma (primera vez)

```bash
docker-compose exec frontend npx prisma migrate deploy
```

### 4. Acceder a la Aplicación
La aplicación estará disponible en:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Estructura de Volúmenes Persistentes
- `postgres_data`: Almacena los datos de PostgreSQL
- `pdf_data`: Almacena los archivos PDF subidos
- `chroma_data`: Almacena la base de datos vectorial ChromaDB

## Comandos Útiles

### Ver Logs
```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f db
```

### Reiniciar Servicios
```bash
docker-compose restart frontend
docker-compose restart backend
```

### Detener Todos los Servicios
```bash
docker-compose down
```

### Detener y Eliminar Volúmenes (borra todos los datos)
```bash
docker-compose down -v
```

## Solución de Problemas

### Si el frontend no se conecta al backend
Verifica que la variable `BACKEND_URL` esté correctamente configurada en `.env`.

### Si el backend muestra errores de permisos
Verifica que los volúmenes de Docker tengan los permisos adecuados.

### Si la base de datos muestra errores de conexión
Asegúrate de que la variable `DATABASE_URL` esté configurada correctamente.