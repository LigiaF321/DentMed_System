# DentMed_System

Sistema de Gestión para Clínica Dental DENTMED - Proyecto Universitario

## Base de datos (XAMPP)

1. **Iniciar XAMPP**: Apache y MySQL en verde.
2. **Crear base de datos**: En [phpMyAdmin](http://localhost/phpmyadmin) crear la base de datos `dentmed_db` con collation `utf8mb4_unicode_ci`.
3. **Variables de entorno**: Copiar `.env.example` a `.env` y ajustar (XAMPP suele usar usuario `root` y contraseña vacía):
   ```bash
   cp .env.example .env
   ```
4. **Instalar dependencias y verificar conexión**:
   ```bash
   npm install
   npm run db:verify
   ```
5. **Crear tablas** (sincronizar modelos con MySQL):
   ```bash
   npm run db:sync
   ```
6. **Datos iniciales** (opcional):
   ```bash
   npm run db:seed
   ```
   Usuario de prueba: `admin@dentmed.com` / `admin123`
