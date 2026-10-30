# Los Navegantes • Memorización Bíblica TMS (PWA Offline-First)

Aplicación Web Progresiva (**PWA**) mobile-first para la memorización bíblica basada en el **Sistema de Memorización Tópica (TMS - "Los Navegantes")**, con los **60 versículos precargados en español (Reina-Valera 1960)**, diseño editorial sobrio, animaciones fluidas con **Framer Motion** y persistencia local 100% sin conexión mediante **IndexedDB (Dexie.js)**.

---

## Características Principales

### 1. Plan Completo Precargado: "Los Navegantes" (60 Versículos RVR1960)
Organizado en 5 series temáticas de 12 versículos cada una, respetando la regla clásica de recitación de Los Navegantes (**Cita al principio + Versículo + Cita al final**):
- **Serie A:** *Vivir la nueva vida* (Cristo el Centro, La obediencia a Cristo, La Palabra, La oración, El compañerismo, El testimonio).
- **Serie B:** *Proclamar a Cristo* (Todos pecaron, El castigo del pecado, Cristo pagó la culpa, Salvación no por obras, Recibir a Cristo, La seguridad de la salvación).
- **Serie C:** *Confiar en los recursos de Dios* (Su Espíritu, Su fortaleza, Su fidelidad, Su paz, Su provisión, Su ayuda en la tentación).
- **Serie D:** *Ser discípulo de Cristo* (Poner a Cristo primero, Separación del pecado, Firmeza, Servir a otros, Dar con generosidad, La visión mundial).
- **Serie E:** *Desarrollar el carácter de Cristo* (Amor, Humildad, Pureza, Honestidad, Fe, Buenas obras).

### 2. Entrenamiento Progresivo en 4 Fases
1. **Tarjeta 3D (Flashcard Clásica):** Rotación 3D con física de resorte al tocar (`tap to flip`) y gestos de arrastre lateral (`swipe horizontal`) para calificar el repaso.
2. **Método de Primera Letra (First-Letter Prompt):** Codifica cada palabra del versículo mostrando únicamente su inicial y signos de puntuación españoles (`¿N. s. q. s. t. d. D....?`). Permite tocar cualquier inicial para revelar esa palabra puntual si te atascas.
3. **Completar Huecos (Cloze Deletion):** Oculta las palabras clave teológicas de cada versículo para ejercitar la recuperación contextual.
4. **Dictado por Inicial (Active Recall):** Escribe la primera letra de cada palabra en el teclado y el versículo se autocompleta en tiempo real, iluminando pistas instantáneas si cometes un error.

### 3. Algoritmo de Repetición Espaciada (SRS) y Gamificación Sobria
- **Evaluación adaptativa (SM-2 / FSRS simplificado):** 4 niveles de respuesta tras cada repaso:
  - `Otra vez` (1 día)
  - `Difícil` (3 días)
  - `Bien` (7+ días)
  - `Fácil` (14+ días)
- **Dashboard Analítico:**
  - Contador de **racha diaria** de meditación y récord histórico.
  - **Embudo de progreso visual:** *Nuevos*, *En Aprendizaje*, *Repaso Frecuente* y *Dominados*.
  - **Mapa de calor (Heatmap)** de los últimos 28 días.
  - Configuración de **meta diaria** (3, 5, 10 o 15 versículos/día), modo oscuro y recordatorios locales.

---

## Requisitos Previos

- **Node.js** `>= 18.0.0`
- **npm** `>= 9.0.0` (o `pnpm` / `yarn`)
- **Git** instalado en tu sistema

---

## Instalación y Ejecución Local

```bash
# 1. Instalar las dependencias
npm install

# 2. Iniciar el servidor de desarrollo
npm run dev

# 3. Compilar para producción (incluye Service Worker y manifiesto PWA)
npm run build

# 4. Previsualizar la compilación de producción localmente
npm run preview
```

---

## Guía Paso a Paso para Publicar en GitHub

El proyecto ya cuenta con el repositorio Git inicializado y un archivo `.gitignore` configurado. Para subirlo a tu cuenta de GitHub:

### 1. Crear el repositorio en GitHub
1. Entra en [https://github.com/new](https://github.com/new).
2. Asigna un nombre al repositorio (por ejemplo: `tms-navegantes-pwa`).
3. Déjalo vacío (**sin** marcar *Add a README file* ni *.gitignore*, ya que este proyecto ya los incluye).
4. Haz clic en **Create repository**.

### 2. Hacer el commit inicial y conectar con GitHub
Ejecuta los siguientes comandos en la terminal dentro de la carpeta del proyecto:

```bash
# Añadir todos los archivos al área de preparación
git add .

# Crear el primer commit
git commit -m "feat: PWA inicial Los Navegantes TMS (60 versículos RVR1960, 4 modos, SRS e IndexedDB)"

# Renombrar la rama principal a 'main'
git branch -M main

# Conectar con tu repositorio remoto
git remote add origin https://github.com/converso72/tms-navegantes-pwa.git

# Subir los cambios a GitHub
git push -u origin main
```

### 3. Despliegue Gratuito Recomendado (Vercel / Netlify / GitHub Pages)
- **Vercel / Netlify:** Importa el repositorio desde tu cuenta de GitHub. El comando de compilación es `npm run build` y el directorio de salida es `dist`.
- Al abrir la URL desde tu móvil (Safari en iOS o Chrome en Android), selecciona **"Añadir a la pantalla de inicio"** para instalarla como aplicación nativa 100% offline.
