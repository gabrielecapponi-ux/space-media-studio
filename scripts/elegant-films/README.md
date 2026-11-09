# LUMA e campagna SHIFT

Due film desktop montati nuovamente a 2560×1440 e 60 fotogrammi al secondo, durata dieci secondi. Il livello intermedio è 1920×1080 a 60 fps, codificato a circa 3 Mbit/s per connessioni tra 6 e 12 Mbit/s. I profili compatti sono 1280×720 a 30 fps, con un limite verificato di 1,4 Mbit/s su finestre di un secondo. Gli export sono silenziosi, H.264, pixel YUV 4:2:0 e MP4 con indice iniziale per la riproduzione progressiva.

## Produzione

LUMA viene rasterizzata dalla geometria originale di Blender con 314.906 triangoli, fotografie Cycles native da 2880×1620 e una seconda esposizione dell’ottica da 2560×1440. Le fotografie sono proiettate sulle superfici attraverso le camere calibrate. La traiettoria del corpo, del vetro e delle ghiere viene campionata su 600 nuove pose. La durata di ciascuna ripresa è maggiore rispetto all’edizione Director, con una velocità che si assesta prima dei tagli e un raccordo continuo fra ultima e prima posa del corpo macchina. Metal rende la geometria a risoluzione QHD con antialiasing multisample 4×.

La campagna SHIFT compone nello spazio tre supporti con spessore, supporti metallici e ombre di contatto. Le grafiche di stampa vengono ridisegnate a 2048 pixel, incluse lettere e dettagli tipografici, da fotografie Cycles originali del campionatore. Il montaggio usa intervalli leggibili e spostamenti della camera più lunghi, con un movimento durante le soste più contenuto. Ogni fotogramma è composto direttamente alla risoluzione di consegna.

Le fotografie, la geometria dei prodotti e la grafica sono originali Space Media. I font DM Mono e Space Grotesk conservano le licenze OFL in `public/fonts`. La ricetta riutilizza le funzioni di proiezione prospettica di `scripts/director-shift/`.

## Rigenerazione

Da root, con Blender 5.2, macOS Metal, clang++, Python 3, Pillow e FFmpeg con libx264 disponibili.

```sh
blender -b -t 2 --python-exit-code 1 -P scripts/elegant-films/calibrate.py
python3 scripts/elegant-films/encode-product.py
python3 scripts/elegant-films/campaign.py
python3 scripts/elegant-films/deliver.py product
python3 scripts/elegant-films/deliver.py campaign
python3 scripts/elegant-films/hd.py product
python3 scripts/elegant-films/hd.py campaign
```

Sono necessari i master di studio in `outputs/flagship-20261106/luma/`, le esposizioni in `outputs/director-20261106/craft/product/desktop/` e le fotografie SHIFT in `outputs/flagship-20261106/shift/`. La calibrazione e gli intermedi vengono scritti in `outputs/reentry-20261109/films/`. I master privati restano nell’archivio locale.

Le tre distribuzioni seguono la stessa regia e durata. Il livello QHD viene scelto sopra 12 Mbit/s, il livello HD sopra 6 Mbit/s e il compatto sotto questa soglia. `hd.py` aggiorna le ricevute dopo aver decodificato tutti i fotogrammi del livello intermedio.

I risultati hanno prefisso `elegant-product` e `elegant-campaign`, in `public/films/` e `public/images/`. I poster JPEG/WebP rappresentano il frame zero. Le miniature misurano 320×180. `deliver.py` controlla tutti i fotogrammi, cadenza, duplicati consecutivi, continuità del loop, peso, avvio progressivo e hash dei file e salva una ricevuta JSON nell’archivio di lavorazione. I tagli portrait mantengono la loro produzione indipendente.
