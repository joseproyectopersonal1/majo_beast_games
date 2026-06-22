# 🦁 Majos Games

Juego educativo de matemáticas para practicar **tablas de multiplicar, divisiones, multiplicación de varias cifras, MCM/MCD y problemas analíticos** — pensado para una niña de 9 años, con estética de show de premios.

**100% offline**: todo el progreso vive en el dispositivo (IndexedDB). Sin backend, sin cuentas, sin datos en la nube.

## ✨ Qué tiene

### Módulos de contenido (320 ejercicios)
| Módulo | Contenido |
|--------|-----------|
| ✖️ Tablas | Multiplicaciones 2–9 (64 ítems) |
| ➗ Divisiones | Divisiones exactas (64 ítems) |
| 🔢 Varias cifras | 11..18 × 2..9 (64 ítems) |
| ⚙️ MCM / MCD | Mínimo común múltiplo y máximo común divisor (64 ítems) |
| 🧩 Analíticos | Problemas de texto y patrones (64 ítems) |

### Modos de juego
- **🎮 Reto Reloj** — 10 preguntas, 3 vidas, 12s por pregunta, escalera de premios de 10 peldaños (monedas, gemas, trofeos)
- **✏️ Practicar** — sin timer ni vidas, gana la mitad de monedas
- **📖 Aprender** — explicaciones con visualizaciones por módulo

### Motor de aprendizaje
Repetición espaciada con **sistema Leitner de 5 cajas**: los ejercicios fallados aparecen más seguido; los dominados descansan. La sesión se cierra automáticamente tras 30 minutos de inactividad.

### Extras de motivación (T02)
- **🛒 Tienda Bestial** — 6 ventajas comprables con monedas: 💡 Pista, 🧊 Congelar tiempo, ⏱️ Tiempo extra, ❤️ Vida extra, 🛡️ Escudo y ✨ Doble monedas. *Las ventajas nunca responden por la jugadora.*
- **🔥 Rachas** — racha de respuestas correctas y racha de días jugados, con récords
- **🏆 Salón de Récords** — mejor puntaje y peldaño por módulo y modo, precisión global
- **🎯 Zona de Refuerzo** — detecta ítems frágiles (2+ fallos) y ofrece entrenarlos; superar una debilidad da bonus de +500 monedas (una vez por ítem)

## 🚀 Cómo correr

Requisitos: Node 18+ y [pnpm](https://pnpm.io).

```bash
pnpm install
pnpm dev          # desarrollo → http://localhost:3000
pnpm build        # build de producción
pnpm start        # servir el build
```

## 🧪 Tests

```bash
pnpm vitest run              # 183 tests
pnpm vitest run --coverage   # cobertura (100% en src/domain)
pnpm exec tsc --noEmit       # chequeo de tipos
```

La capa de dominio (`src/domain/**`) exige 100% de cobertura en líneas/funciones/statements y 90% en branches. Los tests de infraestructura usan `fake-indexeddb`, incluyendo un test de migración que garantiza que actualizar el schema nunca pierde datos del jugador.

## 🏗️ Arquitectura

```
src/
├── content/   Bancos de ítems por módulo + metadata (datos puros)
├── domain/    Lógica de negocio pura — sin I/O, sin React
│   ├── leitner/    Motor de repetición espaciada (5 cajas)
│   ├── scoring/    Escalera de premios y monedas
│   ├── shop/       Catálogo de ventajas y efectos
│   ├── streaks/    Rachas de respuestas y días
│   ├── records/    Récords por módulo×modo
│   └── reinforce/  Selección de ítems frágiles
├── infra/     Dexie (IndexedDB) + audio. Único lugar que toca la DB.
├── state/     Stores Zustand — puente entre dominio y UI
├── ui/        Componentes React (game, home, shop, shared)
└── app/       Rutas Next.js (App Router)
```

Regla de capas: `ui → state → infra/domain`. La UI nunca importa repos directamente; el dominio nunca hace I/O.

**Persistencia**: Dexie v2 con 8 tablas (`settings`, `leitnerStates`, `prizeLedger`, `sessionLog`, `inventory`, `streaks`, `records`, `globalsRecord`). Las migraciones son aditivas y están cubiertas por tests.

## 🛠️ Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Zustand · Dexie · Framer Motion · Vitest · Serwist (PWA)
