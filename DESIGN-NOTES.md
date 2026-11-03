# Space / Launch Room — Regia cinematografica

«**Le idee. In azione.**» è accompagnato da una promessa esplicita: **loghi, siti web e motion design, dal primo segno al lancio**. Il percorso mostra quattro discipline attraverso oggetti riconoscibili e animazioni con una funzione. I concept spiegano che cosa lo studio potrebbe realizzare; la sezione progetti e bandi estende l'offerta ad aziende e associazioni.

## Direzione visiva

La palette mantiene bianco caldo, nero e giallo elettrico. Space Grotesk e DM Mono sono serviti localmente. La composizione lascia alla tipografia una zona di lettura e al 3D uno spazio misurabile. Titoli, offerta, azioni e moduli rimangono HTML e leggibili durante lo scorrimento.

1. **Branding:** quattro parti spesse e smussate ricostruiscono la bussola Space. Apertura e ricomposizione mostrano come più elementi diventano un'identità. Carta, campioni di colore e tipografia legano il marchio a un sistema visivo.
2. **Web:** desktop, mobile e un modulo di navigazione sono superfici originali con spessore. Entrano su piani differenti e rimangono coordinati, presentando la stessa direzione web AVANT. Non sono dispositivi o siti completi già consegnati.
3. **Motion & 3D:** ORA è un vero modello procedurale originale: corpo smussato, contenuto ambrato, collare, erogatore, etichetta e tappo indirizzabili. Il tappo si solleva e torna; il movimento del flacone e della luce espone forma e materiali. Il contenuto è una mesh e non una simulazione liquida.
4. **Campagne:** un manifesto tipografico e tre nastri con volume condividono un movimento continuo. La coreografia si riferisce a motion design e formati di comunicazione; non simula un tessuto fisico.

Il progetto usa geometria realmente calcolata nel browser, materiali fisici, ambiente, luci, ombre e camera prospettica. Non rappresenta rendering offline Blender o un film 4K a 60 fps. I nomi e gli scenari dei concept non dichiarano clienti o incarichi.

## Movimento e struttura

`src/scene-objects.js` contiene modelli e animazioni locali. `src/launch-room.js` coordina le stazioni, l'ambiente e il viaggio della camera in base alla posizione assoluta dello scroll nativo. Le pose locali derivano da tempo, ingresso e distanza dalla stazione attiva. Tornare indietro nello scroll non accumula spostamenti.

L'apertura assembla il marchio mentre il contenuto è già disponibile. Il puntatore fine aggiunge un movimento contenuto. I cicli di separazione e ricomposizione, l'avvicinamento delle interfacce e il sollevamento del tappo danno un'azione leggibile a ogni scena. Wheel e swipe non vengono intercettati e non viene imposto un numero esatto di gesti.

Il rendering è confinato ai quattro capitoli. Pausa e box idea aperti mantengono il ripiego fotografico; menu, dialog e documento nascosto sospendono l'animazione. Movimento ridotto e SaveData conservano il percorso statico. Importazione e caricamento sono differiti; listener, observer e risorse GPU appartengono al controller e vengono rilasciati alla chiusura della pagina.

La vista stretta riserva uno slot 4:3 per la composizione. Il controller lo misura per adattare scala e inquadratura; non trasferisce testo o comandi nel canvas. I capitoli possono crescere quando il contenuto o un box aperto richiedono spazio.

## Concept e richieste

Quattro dialog presentano **scenario ipotetico, obiettivo e deliverable**:

- FORMA: identità per una torrefazione che apre il primo caffè.
- AVANT: sito per uno studio di architettura che cerca nuovi committenti.
- ORA: direzione visiva e motion per il lancio di una fragranza.
- SPAZIO: comunicazione e iscrizioni per una rassegna culturale organizzata da un'APS.

Ogni azione porta al box idea del servizio. Menu e dialog usano controlli HTML e ripristino del focus. I cinque form GET preparano una bozza WhatsApp con contesto, conteggio e validazione; il visitatore decide se inviarla.

Progetti & bandi presenta analisi dei bisogni e obiettivi, attività e piano economico, ricerca dei bandi e dossier. Si rivolge ad aziende, APS e ASD e considera opportunità europee, nazionali, regionali, provinciali, private, fondazioni e istituti bancari. Gli esempi di digitalizzazione, cultura e sport sono generali; nessun bando viene dichiarato aperto e nessun contributo viene garantito.

## Materiali e provenienza

Le quattro immagini image_gen della versione precedente, **1672×941 pixel nativi**, rimangono nei dialog e nei ripieghi. L'immagine architettonica appare anche nelle interfacce web. Le foto non sono state convertite in mesh: flacone, bussola e nastri sono modelli costruiti separatamente nel codice. Non vengono prodotte nuove immagini o nuovi video in questa revisione.

I master raster sono locali e ignorati; i JPEG sono registrati con hash e byte in `ASSET-LAUNCH-ROOM.json`. Il visual branding era stato rifinito con image_gen per eliminare microtesti di contatto, indirizzo e anno. Three.js 0.186.1 conserva la licenza MIT; i font locali conservano la SIL Open Font License.

`studio-siti-space`, Studio frontend, UI animation, Siti 3D e i moduli Three.js pertinenti guidano gerarchia, forma, materiali, luce e comportamento. La precedente prova Video Non Higgsfield con ComfyUI/LTX non ha prodotto fotogrammi e non fornisce asset alla produzione. Horizon CoverFlow non è acquisito né integrato.

## Verifica e pubblicazione

Build e 31 gruppi di contratti passano con `npm test`: controller, brief e scena con geometrie Three reali, renderer e DOM simulati. I controlli separati dei modelli verificano pose reversibili, vertici finiti e proiezioni desktop/mobile; 256 campioni verificano il clipping nei quattro formati stretti. La build dedicata alla sola pagina principale, prima dell’anteprima Atelier, pesava 1.901.750 byte. La scena scarica inizialmente una sola immagine, quella architettonica.

Sotto 901 px lo spazio 4:3 segue il layout nativo: il canvas è ritagliato sul suo slot, sopra i fondi solidi dei capitoli, e non attraversa i testi. Sul desktop una superficie di lettura a sinistra mantiene il contrasto quando il colore della scena cambia. Titoli e azioni non scompaiono durante lo scroll.

Quattro studi diagnostici in Blender 5.2.1, ricavati dalle geometrie effettive, sono in `outputs/cinematic-qa/`. Illuminazione, resa e font diagnostico non sono la configurazione WebGL: aiutano a controllare silhouette e parti, senza sostituire il browser. Quest’ultimo rimane disabilitato nelle impostazioni Work; non è stata eseguita una verifica visiva della pagina corrente. Non sono misurati tempo GPU, frame rate, draw call o tempi al 3D nel browser, né è dichiarata una prova su iPhone fisico.

Il deploy aggiorna soltanto le radici Space dichiarate nello script, preservando siti e cartelle estranee nel ramo di pubblicazione. Scene e film precedenti rimangono archivio storico e non fanno parte dei media correnti.
