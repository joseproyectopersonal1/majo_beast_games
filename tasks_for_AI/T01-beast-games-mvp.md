# T01 — Beast Games MVP

Registro de fases de implementación, decisiones de reordenamiento y estado actual.

---

## Estado de fases

| Fase | Descripción | Estado |
|------|-------------|--------|
| F1–F7 | Dominio, infra, state (Leitner, scoring, DB, stores) | ✅ completada |
| F8 | UI compartida (Button, Modal, FeedbackFlash, PrizeLadder, etc.) | ✅ completada |
| F9 | Home screen (ModuleCard grid, HomeHeader, /modulo/[id] picker) | ✅ completada |
| F10 | Bancos de contenido: tablas (64 ítems), divisiones (64 ítems), feedback templates | ✅ completada |
| **F16** | **GameScreen — UI de juego activa con tablas** | ⬅ **EN CURSO** |
| F11 | Banco de contenido: varias-cifras (multidigit) | pendiente |
| F12 | Banco de contenido: mcm-mcd | pendiente |
| F13 | Banco de contenido: analíticos | pendiente |
| F14 | Learn screen (/aprender/[moduleId]) | pendiente |
| F15 | Practice screen (/practicar/[moduleId]) | pendiente |

---

## Decisión de reordenamiento: F16 antes de F11

**Fecha:** 2026-06-05
**Motivo:** Tener una sesión de juego real y jugable con las tablas (contenido ya disponible en F10) antes de continuar con los bancos de contenido de los demás módulos.

**Razonamiento:**
- F10 ya entregó 64 ítems de tablas y 64 de divisiones — suficiente contenido para un mini-juego real.
- Sin GameScreen, la app no es jugable y no se puede validar el flujo completo (pregunta → respuesta → Leitner → monedas → escalera de premios).
- Con GameScreen funcionando primero, F11/F12/F13 solo requieren enchufar su contenido al mismo motor — sin riesgo de integración tardía.

**Consecuencia:**
- F11, F12, F13 quedan para después de que el mini-juego esté corriendo con tablas.
- /modulo/[id] actualmente muestra "próximamente" para todos los modos; F16 activa al menos el modo **reto-reloj** con tablas.

---

## Alcance de F16 — GameScreen

Componentes y páginas a construir:

- `src/ui/game/PromptDisplay.tsx` — renderiza `ItemPrompt` (arithmetic AxB op)
- `src/ui/game/NumericInput.tsx` — teclado numérico táctil (0-9 + borrar + confirmar)
- `src/ui/game/GameHUD.tsx` — barra superior: vidas, racha, monedas, timer
- `src/ui/game/GameScreen.tsx` — ensamble del juego: flujo pregunta → respuesta → siguiente
- `src/app/jugar/[moduleId]/[mode]/page.tsx` — ruta dinámica; arranca el juego con el módulo y modo seleccionados
- Activar la navegación desde /modulo/[id] para el modo reto-reloj con tablas

El modo **memoria** y **jefe-final** pueden quedar como "próximamente" dentro de GameScreen hasta F17/F18.

---

## Notas de arquitectura

- `useGameStore.startGame()` ya existe con lives, rung, streak, timer.
- `selectNextItem()` del Leitner engine es la única fuente de selección de ítems.
- Al final de cada respuesta: `useProgressStore.recordAnswer()` persiste el estado Leitner; `useProgressStore.addCoins()` acredita monedas.
- `FeedbackFlash` (F8) se usa directamente para feedback visual.
- `PrizeLadder` (F8) se muestra en un panel lateral o modal durante el juego.
