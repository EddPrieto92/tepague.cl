# Mesa Cobrada / tepague.cl - Contexto v1.0

Fecha de nota: 2026-06-15  
Repo: `git@github.com:EddPrieto92/tepague.cl.git`  
Ruta local original: `/Users/eduprieto/Documents/VernoVentures/tepague.cl`  
Version: `1.0.0`  
Tag: `v1.0`  
Commit publicado: `86b733c Release Mesa Cobrada 1.0`

## Resumen corto

Mesa Cobrada es una app web mobile-first para dividir una cuenta pagada por una persona entre varias personas. El foco del MVP es resolver el dolor de "yo pague la boleta y ahora necesito que cada uno marque lo suyo y pague su parte", sin integrarse aun a pagos, bancos ni OCR/IA externos.

La app procesa una foto de boleta con OCR local usando Tesseract.js, propone productos editables, muestra validacion contra la boleta y genera un flujo compartible para que cada participante reclame consumos.

## Estado Git

La version 1.0 fue commiteada y pusheada a GitHub.

```bash
git clone git@github.com:EddPrieto92/tepague.cl.git
cd tepague.cl
git checkout main
git pull
git tag
```

Estado esperado:

```text
main sincronizado con origin/main
tag v1.0 apuntando a 86b733c
```

Si se clona en otra Mac, configurar autor local:

```bash
git config user.name "EddPrieto92"
git config user.email "edo.prieto92@gmail.com"
```

## Comandos de trabajo

Instalar dependencias:

```bash
npm install
```

Desarrollo local:

```bash
npm run dev
```

Abrir:

```text
http://localhost:3000
```

Validaciones:

```bash
npm run typecheck
npm run build
```

## Stack actual

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Tesseract.js para OCR local
- LocalStorage para persistencia mock
- Supabase instalado, pero aun no usado realmente en el flujo

Dependencias relevantes agregadas durante la iteracion:

- `tesseract.js`
- `@swc/helpers`
- `camelcase-css`

## Propuesta de producto

Nombre de trabajo: Mesa Cobrada  
Repo/dominio: `tepague.cl`

Propuesta:

> Divide cualquier boleta que ya pagaste, sin perseguir a nadie.

No sesgar el producto a restaurantes solamente. Debe funcionar para cualquier boleta pagada por una persona que luego necesita repartir consumos entre otras personas.

Idea clave:

- La app no mueve dinero.
- No es fintech.
- No procesa pagos.
- Ayuda a leer una boleta, dividir consumos y compartir instrucciones de pago externo.

## Flujo MVP

Rutas principales:

- `/`
- `/create`
- `/create/review`
- `/create/payment`
- `/create/share`
- `/bill/[shareId]`
- `/bill/[shareId]/join`
- `/bill/[shareId]/pay/[participantId]`

Flujo:

1. Organizador sube o toma foto de una boleta.
2. OCR local detecta productos, subtotal, propina y total cuando puede.
3. Organizador revisa y corrige productos.
4. La app muestra validacion contra boleta.
5. Organizador configura pago externo: transferencia, QR o link.
6. Organizador comparte link por WhatsApp.
7. Participante entra, pone nombre y reclama consumos.
8. Cada participante ve su parte, con propina incluida por defecto.
9. Participante puede desmarcar propina si no quiere incluirla.
10. Participante ve instrucciones de pago y marca "Ya transferi".

## Decisiones importantes

### OCR local, no IA

Se decidio usar OCR local con Tesseract.js para evitar dependencia de IA generativa y reducir costo.

La app usa:

- `lib/receipt-ocr.ts`
- assets locales de Tesseract en `public/ocr`
- preprocesado de imagen en canvas

El OCR procesa en el navegador.

Limitaciones esperadas:

- Fotos buenas: 85-95% de lineas utiles.
- Fotos con angulo, sombras o pliegues: 65-85%.
- Fotos borrosas o con contraste pobre: 40-70%.

El objetivo no es 100% automatico. El objetivo correcto para MVP es:

> 80% precargado + correccion rapida.

### Boleta manda, no la app

Decision de producto importante:

- Los productos sirven para repartir.
- El subtotal, propina y total final deben venir de la boleta cuando el OCR los detecta.
- Si algo no calza, se muestra como validacion.
- La app no debe esconder diferencias ni fingir certeza.

En la pantalla de revision se muestra:

- Productos detectados
- Productos vs subtotal
- Subtotal + propina vs total

### Total con propina

Cambio de la version 1.0:

- El total mostrado abajo se genera desde `subtotal + propina` cuando el checkbox `Incluir propina en total` esta marcado.
- Ese checkbox esta marcado por defecto.
- Si se desmarca, muestra total sin propina.
- Esto evita que un total OCR mal leido gane sobre subtotal y propina correctos.

En Chile la propina suele ser 10%, pero la app no debe inventarla si el usuario subio boleta. Si OCR no lee la propina, debe quedar claro para corregirla manualmente.

### Propina por participante

Cada participante tambien tiene un checkbox `Incluir propina`, marcado por defecto. Si lo desmarca, su monto se recalcula sin propina.

Campos relacionados:

- `Bill.includeTipInTotal`
- `Participant.includeTip`

## Archivos clave

OCR:

- `lib/receipt-ocr.ts`
- `public/ocr/core/*`
- `public/ocr/worker/worker.min.js`

Persistencia mock:

- `lib/storage.ts`

Calculos:

- `lib/calculations.ts`

Tipos:

- `lib/types.ts`

Pantalla de carga OCR:

- `components/BillUpload.tsx`

Revision de productos y totales:

- `components/BillItemEditor.tsx`
- `components/BillTotalsEditor.tsx`

Flujo participante:

- `components/ParticipantEntry.tsx`
- `components/ItemClaimList.tsx`
- `components/PaymentInstructions.tsx`

Shell/UI base:

- `components/ui.tsx`
- `app/globals.css`

## OCR: detalles tecnicos actuales

`lib/receipt-ocr.ts` hace:

1. Recorte automatico de la zona clara de boleta.
2. Reescalado a ancho objetivo.
3. Conversion a escala de grises.
4. Ajuste suave de contraste.
5. OCR con Tesseract `SINGLE_BLOCK`.
6. Parser de lineas con cantidad/precio.
7. Separacion de productos vs bloque final de boleta.

Reglas de parser:

- Precios aceptados con `$` o `§`.
- Cantidades tipo `1x`, `2x`, `3x`.
- Filtro de comentarios, encabezados, fecha, mesa, cuenta, etc.
- Dedupe por nombre + precio.
- Heuristica chilena para cuando OCR lee `$12.99` en vez de `$12.990`.

Reglas de resumen de boleta:

- Busca lineas con `subtotal`, `propina`, `total`, `c/prop`.
- Si no reconoce etiqueta, intenta usar el bloque final por orden.
- No debe inventar propina desde `total - subtotal` si no detecto el dato explicitamente o como monto intermedio claro.

## Problemas vistos y fixes

### Git bloqueado por Xcode

Al inicio `git` fallaba por licencia de Xcode. Se resolvio aceptando licencia:

```bash
sudo xcodebuild -license accept
```

### DNS en sandbox

Varios comandos de red fallaron dentro del sandbox con:

```text
Could not resolve host
ENOTFOUND
```

Solucion: repetir comandos con acceso de red autorizado.

### GitHub push

Inicialmente HTTPS no tenia credenciales:

```text
could not read Username for 'https://github.com'
```

Se creo llave SSH:

```bash
ssh-keygen -t ed25519 -C "edo.prieto92@gmail.com" -f ~/.ssh/id_ed25519 -N ""
```

Se agrego en GitHub como `MacBook Codex`.

Remote actual:

```bash
origin git@github.com:EddPrieto92/tepague.cl.git
```

### Tailwind / camelcase-css

En un momento falto `camelcase-css`, requerido por `postcss-js`/Tailwind:

```text
Cannot find module 'camelcase-css'
```

Se corrigio agregando dependencia directa:

```bash
npm install camelcase-css
```

## Estado publicado

Commit:

```text
86b733c Release Mesa Cobrada 1.0
```

Tag:

```text
v1.0
```

Push realizado:

```bash
git push origin main
git push origin v1.0
```

## Ideas siguientes

### Producto

- Mejorar copy para que el usuario entienda que OCR es asistencia, no verdad absoluta.
- Mostrar estado de confianza por item: alto, medio, revisar.
- Permitir eliminar rapido items con precio 0 o comentarios mal leidos.
- Permitir fusionar items iguales.
- Permitir marcar items compartidos desde revision de organizador.
- Permitir participantes sugeridos o nombres guardados.

### OCR

- Usar coordenadas TSV/blocks para leer columnas mas robustamente.
- Detectar lineas divisorias `-----` como frontera entre productos y resumen.
- Mejorar lectura de bloque final: subtotal, propina, total.
- Permitir recorte manual de boleta si el automatico falla.
- Guardar raw OCR y preview solo en memoria/session, no en localStorage pesado.

### Backend

- Migrar de localStorage a Supabase.
- Guardar mesas y participantes reales.
- Hacer links compartibles entre dispositivos reales.
- Autenticacion opcional para organizador, no necesaria para participante en MVP.

### Deploy

Probable camino:

- Vercel para Next.js.
- Configurar dominio `tepague.cl`.
- Revisar peso de assets OCR en `public/ocr`; si afecta deploy, servir worker/core desde CDN o solo incluir variantes necesarias.

## Como retomar desde otra Mac

1. Instalar Node compatible.
2. Clonar repo:

```bash
git clone git@github.com:EddPrieto92/tepague.cl.git
cd tepague.cl
```

3. Instalar dependencias:

```bash
npm install
```

4. Correr:

```bash
npm run dev
```

5. Validar:

```bash
npm run typecheck
npm run build
```

6. Configurar Git:

```bash
git config user.name "EddPrieto92"
git config user.email "edo.prieto92@gmail.com"
```

7. Si falta SSH:

```bash
ssh-keygen -t ed25519 -C "edo.prieto92@gmail.com"
cat ~/.ssh/id_ed25519.pub
```

Pegar la llave publica en GitHub: Settings -> SSH and GPG keys -> New SSH key.

## Nota para futuros agentes

Este proyecto esta en fase MVP iterativa. Evitar sobredisenar. La prioridad es que la experiencia de dividir una boleta sea mas rapida que hacerlo manualmente en WhatsApp/calculadora.

Principios:

- Mobile-first.
- Todo editable.
- OCR como acelerador, no como verdad absoluta.
- La boleta manda.
- No mover dinero.
- No integrar pagos hasta validar uso.
- Mantener flujo simple y compartible.

