# StarShip — Kosmoselaev

IVKHK JavaScripti õppeprojekt, rühm **JKITEs25**. HTML5 Canvas ja tavaline JavaScript, ilma väliste teekide, pildifailide ja tasuliste teenusteta.

## Käivitamine

Ava `index.html` brauseris (Chrome, Firefox või Safari). Paigaldamist ega serverit pole vaja. Mäng vajab klaviatuuri.

Terminalist macOS-is:

```bash
cd ~/Downloads/StarShip
open index.html
```

Soovi korral saab kasutada kohalikku serverit:

```bash
python3 -m http.server 8000
```

Seejärel ava `http://localhost:8000`.

## Juhtimine ja reeglid

| Klahv | Tegevus |
| --- | --- |
| ← / A | Liikumine vasakule |
| → / D | Liikumine paremale |
| Tühik | Tulistamine, ka klahvi all hoides |
| P | Paus / jätkamine |
| Enter | Uus katse pärast mängu lõppu |
| Nupp „Uus katse” (`id="restart"`) | Uus katse pärast mängu lõppu |

Tabamus annab **10 punkti**. Alguses on **3 elu**. Laevaga kokku põrganud või mänguvälja alumise piirini jõudnud vaenlane eemaldatakse ja võtab ühe elu. Nulli elu korral kuvatakse **MÄNG LÄBI**. Fookuse kadumine puhastab klahvide oleku ja paneb mängu pausile; jätkamiseks vajuta P.

## Seos õpetaja etappidega

Lõppversioon ühendab kuue etapi funktsioonid. Projekti StarShip 2–6 DOCX-failides olevad koodipildid olid lähteallikad. Esimese etapi eraldi pilti ei olnud töö ajal saadaval; laeva ja tähtede joonistus on olemas ka järgmiste etappide näidetes.

1. **Kosmoselaev:** taust `#080d22`, 65 tähte ja ristkülikutest laev. Laeva suurus 32 × 32, kiirus 280 px/s. Joonistus ja värvid järgivad näidet.
2. **Kosmoselaeva juhtimine:** nooled, A ja D, piiride kontroll, `requestAnimationFrame`, ajavahe sekundites, klahvide vabastamine ja fookuse kaotus.
3. **Tulistamine:** kuul 4 × 14, kiirus 430 px/s, laskude vahe 0,22 s. Ekraanilt väljunud kuulid eemaldatakse.
4. **Vaenlaste lisamine:** vaenlane 28 × 28, algkiirus 110 px/s, algne ilmumisintervall 0,9 s. Roosad vastased ja nende silmad on joonistatud õpetaja näite järgi.
5. **Tabamused ja punktid:** ristkülikute kattumine, tabatud kuuli ja vaenlase eemaldamine, 10 punkti ning `PUNKTID`.
6. **Täisväärtuslik mäng:** elud, `ELUD`, paus, mängu lõpp, taaskäivitus ja raskusastme kasv.

Õpetaja kuuenda osa täpsed raskusastme valemid:

```javascript
Math.max(0.3, 0.9 - Math.floor(score / 100) * 0.08)
110 + Math.floor(score / 100) * 12
```

Esimene valem annab vaenlaste ilmumisintervalli sekundites, teine kiiruse px/s. Raskusaste suureneb iga 100 punkti järel.

Ülesande lõpus nõutud suurem mänguväli on **800 × 600** (4 : 3). CSS vähendab vajaduse korral ainult kuva suurust, säilitades proportsioonid; mängu koordinaadid jäävad samaks. Laeva ja vaenlaste mõõtmed ei muutu.

Väikesed täiendused näitele: esimese kaadri ja taaskäivituse ajamärgi lähtestamine, laeva mõlema koordinaadi lähtestamine, elude kaitse alla nulli mineku vastu ning korduva Enter-sündmuse vältimine. Laeva mootorileek ulatub õpetaja joonistuses laeva 32-pikslisest kokkupõrkekastist allapoole; see on ka siin dekoratiivne.

## Testid

Vajalik on kaasaegne Node.js, näiteks 22 või uuem. Sõltuvusi pole vaja paigaldada.

```bash
node --test game.test.js
node --check game.js
```

30 testi kontrollivad algseisu, HTML-elemente, mõlemat juhtimisviisi, piire, fookust, kuule, laskmise intervalli, vaenlaste ilmumist ja kiirust, kokkupõrkeid, punkte, elusid, pausi, mängu lõppu, mõlemat taaskäivitust, raskusastet, kaadriaega ja joonistuskutseid. Iga test käivitab päris `game.js` faili uues `vm`-kontekstis. Brauseri DOM, Canvas ja kaadriplaneerija on testides asendatud kontrollitavate objektidega.

Tegelik tulemus 13.11.2026, Node.js v24.22.0: **30 edukat, 0 ebaõnnestunud, 0 vahele jäetud testi**. Süntaksikontroll läbis vigadeta.

Need testid ei asenda visuaalset brauserikontrolli. Töö käigus prooviti avada mängu kohalikus Chrome'is, kuid protsess lõppes käivitumisel koodiga 134. Brauseris nähtavat tulemust ega päris klaviatuuriga mängimist ei ole seetõttu kinnitatud.

## Failid ja GitHub

- `index.html` — suurendatud Canvas, eestikeelsed juhised ja taaskäivitamise nupp.
- `game.js` — kogu mänguloogika ning joonistamine.
- `game.test.js` — 30 automaattesti Node.js-i sisseehitatud testivahendiga.
- `.gitignore` — välistab ajutised failid, varukoopiad ja ZIP-arhiivid.
- `README.md` — käivitusjuhend ja projekti kirjeldus.

Projekt on valmis eraldi GitHubi repositooriumi `StarShip` jaoks. Avaldamist ei ole kinnitatud: töö ajal polnud terminalist GitHubi võrguühendust ning GitHubi ühendus polnud aktiveeritud. Arkanoidi repositooriumi ei muudetud.
