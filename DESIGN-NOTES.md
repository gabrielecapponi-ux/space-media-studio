# Space / Creative Objects — 12 ottobre 2026

La nuova direzione mantiene quattro capitoli commerciali: branding, web, film 3D e campagne. Cambia la regia della pagina: quattro composizioni diverse, tipografia di grande scala e un oggetto protagonista per scena. L’offerta rimane leggibile senza aprire i concept; Progetti & bandi e i cinque box idea restano parte del percorso.

## Composizione

La palette approvata resta bianco caldo, nero e giallo lime. Space Grotesk e DM Mono sono locali. Titoli grandi, pochi livelli tipografici, distanze generose e sovrapposizioni controllate danno rilievo agli oggetti. Il linguaggio comune è quello di una mostra creativa, evitando di ripetere quattro volte la stessa coppia testo a sinistra/film a destra.

1. **Branding:** scena chiara e asimmetrica, titolo dominante, segno Space e scultura a otto moduli che si scompone e ricompone. Il film di carta e packaging rimane nell’approfondimento del concept.
2. **Web:** ambiente scuro, laptop a sinistra e titolo a destra. Siti essenziali, e-commerce ed esperienze web 3D restano espliciti.
3. **Film 3D:** scena calda di prodotto, vetro e luce, titolo ampio e film privo della precedente cornice da scheda. La fragranza Aura conserva il proprio ruolo di esempio dimostrativo.
4. **Campagne:** campo lime, tipografia “Fatti vedere. Fatti scegliere.” e scena audio scura. Il contrasto evidenzia contenuti, social e creatività pubblicitarie.

La navigazione numerata 01–04 e la linea di avanzamento mantengono l’orientamento. Su telefono la composizione passa a testo, film completo in 16:9 e informazioni; non si ritagliano i soggetti per imitare un video verticale. «Quattro scroll» indica quattro passaggi dell’offerta, senza imporre quattro gesti o quattro altezze esatte a ogni dispositivo.

## Nuova scultura e continuità

La scultura Space è originale: otto moduli pieni e arrotondati, con superfici gialle, scure e metalliche. L’animazione deve mostrare separazione ordinata e ricomposizione leggibile del segno. Render nativo Blender verificato: **3840×2160 a 60 fps**, **240 fotogrammi distinti / quattro secondi**, con derivati web 4K e Full HD. Dimensioni, hash, decodifica completa, faststart e continuità sono registrati in `ASSET-SPATIAL-SCULPTURE.json`.

La pipeline locale monta due segmenti consecutivi in ComfyUI e prepara i derivati in FFmpeg. È un montaggio CGI deterministico, non nuova generazione AI. Le scene laptop, fragranza e cuffie sono conservate; il packaging originale resta disponibile nel dialog branding mediante gli override dedicati ai media del concept.

## Movimento dell’interfaccia

`src/spatial-motion.js` possiede i transform dei quattro `.service-frame`. Il movimento dello scroll resta entro 28 px verticali complessivi, con scala tra 1 e 1,045. Solo il puntatore mouse fine e hover aggiunge inclinazione fino a 2° e spostamenti fino a 7 px. Lo scroll non viene intercettato o trasformato in una navigazione artificiale.

Il ciclo di assestamento si arresta da solo. Pausa, loader, menu, concept aperto e documento nascosto interrompono il movimento; movimento ridotto e SaveData ripristinano la posa statica. Le preferenze aggiornate durante la visita, il ritorno della pagina dalla cache e la pulizia di listener e observer fanno parte del contratto del componente. La linea di avanzamento rimane informativa anche con animazioni in pausa.

Il dialog amplia il concept selezionato, sospende i film sottostanti e ripristina il focus alla chiusura. Riproduzione, pausa, cursore e concept successivo restano controlli nativi. Il cursore esplora i film guidati dei concept, non un modello 3D ruotabile liberamente. La nuova scultura di apertura e il packaging del dialog sono due media distinti: non si trasferisce fra loro una posa incompatibile.

## Concept e richieste

Tutti i visual sono **concept originali dimostrativi**, non incarichi, clienti o risultati commerciali inventati. Le tre anteprime web Seta, Forma e Nova sono direzioni visive originali in SVG, non tre siti completi già pubblicati.

I cinque moduli in elementi `details` preparano una bozza WhatsApp, uno per servizio più Progetti & bandi. Il form GET funziona anche senza JavaScript; il miglioramento aggiunge contesto, conteggio e validazione. Il visitatore decide se inviare. Il sito non invia messaggi automaticamente, non archivia idee e non usa un backend di raccolta.

Progetti & bandi diventa una sezione editoriale compatta, con tre passaggi: idea, progetto e budget, opportunità e candidatura. Si rivolge ad aziende, APS e ASD e include fonti europee, nazionali, regionali, provinciali, private, fondazioni e istituti bancari. Digitalizzazione, cultura e sport restano esempi generali; non si annunciano bandi aperti e non si promettono finanziamenti.

## Skill e provenienza

`studio-siti-space` coordina la direzione; Studio frontend e UI animation guidano gerarchia, composizione, continuità e lifecycle. `siti-3d` e Blender guidano la scena originale. La denominazione “City 3D Wow” non corrisponde a una skill presente nel catalogo: si applica `siti-3d` senza dichiarare l’uso di un pacchetto assente.

`video-non-higgsfield` è applicata al montaggio locale ComfyUI dei segmenti consecutivi e agli export FFmpeg. Non vengono dichiarati nuovi video generati da AI, nuovi pesi modello o produzione Higgsfield.

**Horizon CoverFlow non è acquisito né integrato:** la risorsa è stata selezionata, ma l’accesso autenticato resta pendente. La ricerca non costituisce integrazione. I sorgenti e le anteprime correnti sono originali; nessun codice Horizon entra nel repository pubblico.

## Verifica e pubblicazione

La build finale è stata verificata nel browser su desktop, viewport iPhone 390×844 e 320×667 e orientamento orizzontale 844×390: nessun overflow laterale; menu, focus, dialog, pausa e formato responsive funzionano. I controlli deterministici coprono anche preferenze, errori media e cleanup. Queste prove non certificano consumi o prestazioni su un iPhone fisico. I media della nuova apertura hanno il proprio manifest verificato; quello dei film precedenti conserva il proprio ambito.

Il deploy sostituisce soltanto le radici Space dichiarate nello script, preservando altri siti, cartelle estranee e `CNAME` nel ramo di pubblicazione. Diritti e fonti restano documentati in `ASSET-SOURCES.md`; codice e composizioni originali non ricevono una licenza generale di riutilizzo con la pubblicazione dei sorgenti.
