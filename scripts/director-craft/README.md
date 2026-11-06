# Film di Space Media

Space Media ha realizzato le scene, la fotografia e il montaggio dai propri master Blender. La consegna include tre film in composizione desktop e portrait. I film per telefono misurano 720×900 e mantengono 30 fotogrammi al secondo. Le versioni desktop misurano 1920×1080 e mantengono 60 fotogrammi al secondo.

| Film | Durata | Riprese e montaggio |
|---|---:|---|
| LUMA | 8 s | Una camera segue una traiettoria 3D intorno al corpo, all’ottica e alle ghiere. Due esposizioni Cycles danno forma ai riflessi sul vetro e sul metallo. Il renderer Metal proietta le fotografie sulle 314.906 facce triangolari della scena. |
| CACAO | 8 s | Le panoramiche native del cofanetto si alternano a una ripresa macro. Le due esposizioni Cycles mettono in luce la grana della carta, il rilievo della lamina e i bordi dei cioccolatini. |
| Funding | 12 s | Il disegno architettonico Freestyle e la fotografia Cycles condividono la camera e la geometria. Il passaggio dal disegno alla maquette conserva la posizione di tetto, ingresso e arredi. |

## Verifica della consegna

Dalla root del repository eseguire `python3 scripts/director-craft/produce.py --verify`. Il comando controlla SHA-256 di film, poster e miniature, poi legge formato, dimensioni, numero e cadenza dei fotogrammi di ogni film con ffprobe. La ricevuta della versione pubblicata è in `delivery.json`.

## Produzione con l’archivio dello studio

Usare macOS con GPU Metal, compilatore clang++, Blender 5.2.1, Python 3.11 o successivo, Pillow e FFmpeg con libx264. Blender fornisce la propria copia di NumPy. Il comando `python3 scripts/director-craft/produce.py --check` controlla la presenza dei programmi e di ogni input dell’archivio.

La struttura relativa alla root del repository è la seguente.

- `outputs/flagship-20261106/luma/` contiene il master dell’ottica, la geometria e le cartelle desktop e mobile con le proiezioni, le fotografie delle superfici e i fondali.
- `outputs/flagship-20261106/{brand,funding}/{desktop,mobile}/` contiene i quattro master macro e le fotografie di riferimento.
- `outputs/motion-refinement-20261105/` contiene le riprese native dei campi larghi, le dissolvenze e i passaggi opachi di funding.
- `public/films/flagship-*.mp4` fornisce i riferimenti per i confronti visivi.

Per rigenerare i sei film eseguire `python3 scripts/director-craft/produce.py`. Il comando compila `rail.mm`, calibra le camere, fotografa le scene, monta i campi larghi e le macro e prepara le versioni a 30 fps per telefono. Ogni fotogramma viene decodificato e controllato prima della consegna. I risultati aggiornano `public/films/director-*.mp4` e i corrispondenti poster e miniature in `public/images/`.

I master di lavoro, i log e la ricevuta della nuova esecuzione vengono scritti in `outputs/director-20261106/craft/`. La ricevuta versionata documenta gli export pubblicati il 6 novembre 2026.
