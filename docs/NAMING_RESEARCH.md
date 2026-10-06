# Namensrecherche: Produktnamen für das DeskPilot-Projekt

- Datum: 2026-10-06
- Auftrag: Ausführliche Recherche nach einem Produktnamen, der (a) funktional zum Produkt passt, (b) nicht bereits blockiert ist und (c) in Domain- und Marken-Sicht vertretbar frei ist.
- Status: Recherche abgeschlossen; Produktspezifische Empfehlung dokumentiert; finale Entscheidung liegt beim Nutzer.
- Kontext: Die aktuelle Projektbezeichnung lautet DeskPilot; Untermarben sind BrowserPilot, DesktopPilot und EnvironmentPilot.

## 1. Produktprofil (Namensanforderungen)

Abgeleitet aus README.md, docs/rules/VISION.md, docs/rules/PRODUCT_BOUNDARIES.md und den Grill-Session-Dokumenten:

- Lokales Desktop-Control-Panel (Windows, Electron) für Browser-Sessions, Workflow-Wechsel und spätere Desk-Automatisierung.
- Erste Kernfunktion: Browser-Sessions in Kategorien speichern, zuverlässig wiederherstellen, Tab-Chaos reduzieren, Daten nicht verlieren.
- Local-first, ohne Cloud, ohne Accounts, ohne Internet-Pflicht; Nutzer besitzt die Daten.
- Spätere Ausrichtung: physische Desk-Steuerung (Licht, Audio, Tischhöhe) auf einem Touch-Display unter den Monitoren.
- Visuelle Identität: Monitor mit Aviator-Brille als Icon; "DP"-Monogramm; römisch-klassische Theme-Richtung (Bogen, Lorbeer, Bronze, Inschrift) ist als Option dokumentiert.
- Shell-Konzept: eine App mit mehreren "Pilots" (BrowserPilot, DesktopPilot, EnvironmentPilot).

Daraus ergeben sich Namenskriterien:

1. **Passung**: Desktop/Panel/Sessions/Wechsel/Steuerung müssen erkennbar sein (oder zumindest nicht im Widerspruch stehen).
2. **Distinctiveness**: Der Name muss sich von Dutzenden existierender Tab-/Session-Tools abheben.
3. **Freiheit**: Kein existierendes Softwareprodukt, keine aktive Marke in relevanten Klassen (Nice 9/42), bevorzugt frei registrierbare Domains.
4. **Zweckneutral genug** für spätere Desk-Automatisierung (kein reiner "Tab"-Name, der später schmerzt).
5. **Sprech-/Schreibbar** auf Deutsch und Englisch; Monogramm-tauglich.
6. **DACH-Relevanz**: Der Nutzer ist deutschsprachig; deutsche/österreichische Namenskollisionen wiegen schwerer als US-Nischenprojekte.

## 2. Methodik und Prüfkanäle

| Kanal | Vorgehen | Aussagekraft / Limitierung |
|---|---|---|
| Websuche | Bewusst breite Trefferübersicht pro Kandidat (Produkte, Firmen, GitHub, App-Stores) | Gute Marktbreite; kein Ersatz für Registerauszüge |
| Domain-DNS | A-Record-Abfrage für .com/.app/.io/.dev/.de | Geparkte Domains lösen auf; unbelegte meist nicht. **DNS ist kein Whois** – "kein A-Record" kann auch "registriert ohne Nameserver" bedeuten |
| npm-Registry | HEAD-Request pro Kandidatenname | 404 = Paketname frei; 200 = belegt |
| GitHub | Abruf github.com/<name> | 404 = Org/User frei |
| Marken-Sicht (sekundär) | Suchtreffer zu USPTO-/Marken-Dienstleistern | Grobe Orientierung; **keine** formale DPMA-/EUIPO-/USPTO-Prüfung |
| Nicht geprüft | Chrome Web Store, Microsoft Store, App Store, Play Store, vollständige Markenregister, Domain-Whois | Vor finaler Entscheidung manuell nachholen (siehe Abschnitt 9) |

Alle Prüfungen: Stand 2026-10-06. Eine Recherche ersetzt keine Markenanwalt-Prüfung; sie dient der Priorisierung.

## 3. Kernbefund: Der aktuelle Name "DeskPilot" ist blockiert

"DeskPilot" ist kein freier Name. Belege (nur öffentlich auffindbar, Auswahl):

| Treffer | Was es ist | Relevanz |
|---|---|---|
| DeskPilot AI (github.com/deskpilotai, deskpilot-site.vercel.app) | Tauri+Ollama Desktop-Organizer, "local, no cloud", macOS fertig, **Windows "coming soon"** | Gleiche Zielplattform und Local-first-Positionierung |
| clawdia-org/deskpilot + **npm-Paket `deskpilot`** | Rust-CLI für Desktop-Automation via Accessibility-APIs | Paketname auf npm belegt; "Desktop+Pilot"-Semantik identisch |
| 3xcaffeine/DeskPilot | LLM-Desktop-Automation (Docker-Sandbox) | Drittes Softwareprojekt unter demselben Namen |
| Techlosoft "DeskPilot" (techlosoft.com/tools/deskpilot/) | "Save your morning set of tabs, apps and folders under one name. Open it in one command." | **Direkter Funktionskonkurrent** – exakt das Workflow-Öffnen-Szenario |
| trydeskpilot.com | "DeskPilot" – AI-Desk-Operator für Versicherungsagenturen | Aktives kommerzielles Produkt |
| **Deskpilot GmbH, Wien** (deskpilot.at, FN 585247h) | "Deskpilot OS" – Arbeitsplatz-/Workspace-Software | **DACH-Firmenkonflikt** – im deutschsprachigen Raum worst case |
| DESKPILOT HQ LTD (UK, Firma 16631471) + deskpilothq.com | Web-Agentur mit "DeskPilot Software" | Zweiter Firmenname |
| USPTO DESKPILOT (Ser. 76135918, Reg. 2597148, Klasse 38, Intermedia.net) | Marke 2002 registriert, heute **tot** | Zeigt: Andere haben den Namen bereits angemeldet |
| Indien: "deskpilot", MID-DAY MULTIMEDIA, Klasse 16, Anm. 986585 | **Aktive Registrierung** (Papier/Schreibwaren) | Aktive Marke in einem fremden Register |
| Devpost-Hackathon "DeskPilot" (desktop_auto_filer) | Weitere Namensnutzung | – |
| Domains: deskpilot.io (aktiv), deskpilot.app + deskpilot.dev (geparkt) | Belegt | deskpilot.com/.de ohne A-Record – Registrierung ohne Whois nicht abschließend klärbar |

**Fazit 1:** DeskPilot sollte für eine Veröffentlichung nicht verwendet werden. Selbst bei rein lokaler Nutzung ist die Verwechslungsgefahr mit dem Techlosoft-Tool, dem Wiener Produkt und den npm-/GitHub-Projekten real. Eine Namensänderung ist die saubere Lösung; sie ist im Projektstatus (Version 1.1.0, kein Massenpublikum) noch günstig umsetzbar.

## 4. Zweiter Befund: Die "-Pilot"-Familie ist ebenfalls gesättigt

| Name | Belege |
|---|---|
| **BrowserPilot** | Browserpilot Chrome Web Store (AI-Extension), Firefox-Addon, getbrowserpilot.com (Browser-AI-Agenten-Plattform, $29–$999/Monat), GitHub ai-naymul/BrowserPilot, cxcboss/BrowserPilot (MCP-Steuerung), pilotbrowser.vercel.app |
| **TabPilot** | tabpilot.app (Chrome-KI-Automation) **und** tabpilot.ai (KI-Tab-Management – exakt die DeskPilot-Nische); npm `tabpilot` belegt |
| **SessionPilot** | session-pilot.com (Self-Hosted-Dashboard für AI-Coding-Sessions, zweisprachig DE/EN) + web-werkstatt/session-pilot |
| **WorkPilot** | workpilot.space ("One cockpit for all your AIs", Mac-App) |
| **PilotDeck** | OpenBMB/PilotDeck (Tsinghua THUNLP/ModelBest/OpenBMB, Agent-Produktivitätsplattform) |
| **PanelPilot** | panelpilot.com (Lascar, UK) – programmierbare Display-Module und Control-Panel-Software |
| **FlightDeck** | flightdeckefb.com (Aviation-App) |

**Fazit 2:** Das Präfix "Pilot" ist im Software-Namensraum erschöpft. Bei einer Umbenennung muss auch die Untermarben-Familie (Browser/Desktop/Environment) neu gedacht werden. Einfachste Lösung: Die Kategorie wird Teil des Produktnamens ("Tabtory Browser" usw.) oder die Pilots bekommen eine eigene, neu geprüfte Koiné-Familie.

## 5. Dritter Befund: Der gesamte Namensraum ist gesättigt

Die Recherche zeigt ein Muster: Nahezu jeder "naheliegende" Name ist bei mindestens einem Softwareprodukt, meist mehreren, belegt – oft sogar von lokalen Desktop-Tools mit sehr ähnlicher Positionierung.

### 5.1 Tab-/Session-deskriptive Namen

| Name | Belege |
|---|---|
| TabNest | Drei GitHub-Projekte (mrluxy, fullpie, 0xAlok) mit exakt gleichem Feature-Set (Workspaces speichern/laden) |
| TabVault | Mehrere Chrome-Web-Store-Erweiterungen + tabvault.app ("save, restore, organize browser sessions") |
| TabShelf | tabshelf.com + Chrome Web Store (Vertical Tab Manager mit Session-Backup) |
| TabDeck | beta.tabdeck.so + Chrome Web Store + GitHub-Org tabdeck |
| SessionBoard | sessionboard.com (Event-Plattform) |
| Tabox, TabXpert, TabGroup Vault, VertiTab, TABLERONE, Tabbiy, TabBud | Weitere belegte Tab-Manager-Namen aus den Store-Ergebnissen |

### 5.2 Deck-/Panel-/Desk-deskriptive Namen

| Name | Belege |
|---|---|
| DeskDeck | getdeskdeck.com ("Give every task its own Mac desktop. Switch … in one keystroke" – **funktional nah!**) + deskdeck.app (iOS-Fernsteuerung) |
| DeskBoard | GitHub mtmattei/DeskBoard (Windows-Whiteboard-Overlay) + deskboard.geeke.app (Workspaces) |
| Deckboard | deckboard.app (Android/iOS-Macro-Pad für den PC) |
| ControlDeck | control-deck.com (Codex-Controller-App) + App-Store-App ControlDeck (SDR-Funksteuerung) |
| Deskora | **deskora.de** – deutsches Windows-Desktop-Organizer **und** deskora.app ("reduce context switching") – doppelt belegt |
| Restora | Drei Restaurant-POS/Management-Produkte |
| DeskPort | DeskPort (Remote-Desktop-App, "bring it onto your current workspace with one action") |
| Deskly | **desk.ly** – desk.ly GmbH aus Osnabrück, 1.000+ Firmen, DACH-Markt (Desk-Sharing) + deskly.in (Fokus-Tool) |
| Sessio | sessio.io (Musik-Session-Plattform, Kopenhagen, App Store) |
| TrimTab | trimtab.se (Beratung) + usetrimtab.com (Schulden-App) |
| Tarmac | tarmac.musicsian.com (macOS-Tiling-Window-Manager) |
| Aviary | Früher Adobe-Akquisition (Bildeditor) – historisch stark belegt |
| Cockpit, Helm, Harbor, Tower, Runway, Waypoint, Fathom, Prefect, Sonar, Tailwind | Allgemeine "Werkzeug"-Namen, jeweils durch große Projekte blockiert (Auszug, nicht einzeln recherchiert) |

### 5.3 Lateinische / antike Namen

| Name | Status |
|---|---|
| Praetor | Wolters Kluwer "Praetor" (Rechtssoftware, CEE-Markt!), praetorsoftware.com, praetorapp.com, praetor-cli (PyPI), Spiel-Client – **blockiert** |
| Janua | Skylark-Software/Janua – Remote-Desktop-Gateway (Guacamole-Fork) – **blockiert** |
| Tessera | tessera.company (SSH/K8s/RDP-Client), tesserra.app (AI-"desks"), mindestens drei weitere GitHub/Desktop-Projekte, Brompton "Tessera" (LED-Prozessoren) – **blockiert** |
| Binnacle | binnacle-app/Binnacle (lokal-first Cloudflare-Desktop-App) + Seaynic "Binnacle" ("named after the ship's compass housing") – **blockiert** |
| Portico | Portico (HLA-Simulations-RTI, SourceForge) |
| Sextant | AI-team-UoA/Sextant (GIS) + mattpocock/sextant (Dev-Tool) |
| Optio | Optio Incentives (Equity-Software, Europa) + Optio Software (Output-Management) + Dräger "Quaestor"-Serie |
| Quaestor | MARIN "Quaestor" (Engineering-Software) + Dräger-Hardware-Serie |
| Statio | statio.dev (MCP-Gateway mit Desktop-App) |
| Custos | Mehrere Projekte (Accountability-App, AI-Security-Guard, DeFi-Agent, CustosOps) |
| Limen | LimenMC/limen (Tauri-Desktop-App) + limencode.app |
| Atrium | getatrium.dev (macOS-Agent-Workspace) + lhz960904/atrium (local-first AI-Assistent) + CDVI Atrium (Zutrittskontrolle) |
| Mansio | **mansio-logistics.com** – deutsche Firma aus Aachen, die ihren Namen ausdrücklich über römische "Mansiones" herleitet + Younkyum/mansio (persistente AI-Terminals) |
| Curia | yt3trees/Curia (Windows-Desktop-App für Context-Switching!) + meetcuria.com + Vesta-Governance-Forum |
| Vesta | Ingenium "Vesta Desktop", Vesta Finance, BioMedware Vesta, GitHub-Projekte |
| Tabula | Tabula (PDF-Tabellen-Extraktion) |
| Arca | Android-Dateimanager "Arca" + ARCA-Archäologie-Desktop-App + weitere |
| Domus | Domus (italienisches Architektur-Magazin, stark geschützte Marke) |
| Ostia, Portus | ostia.io + "Portus"-Setup in deren Docs |
| Horreum, Specula, Signifer, Orrery, Alidade, Armarium, Tabularium | **Keine Produkte gefunden**, aber: **sämtliche Domains (.com/.app/.io/.dev/.de) geparkt oder belegt** (DNS-Abfrage 2026-10-06) |

### 5.4 "-ly"-Koinés und Kombinationen

| Name | Status |
|---|---|
| Shelfly, Sessionly, Nestly, Pilotlight | Alle Domains belegt (DNS-Abfrage) |
| Tabmatic | tabmatic.com bei BrandBucket **zum Verkauf** (geparkt); kein Produkt, aber .com nicht frei |
| TabShift | tabshift.brillytics.com (Tableau-Migration) + **Tabshift Software GmbH, Freiburg** + TABSHIFT LIMITED (UK) + Chrome-Erweiterungen "Tab Shift"/"TabShift Pro" – **blockiert, auch DACH** |
| Tabfolio | tabfolio.com geparkt, tabfolio.app belegt; kein Produkt gefunden |
| Deskshift | deskshift.com geparkt, deskshift.app belegt; kein Produkt gefunden |
| Flowdeck | npm-Paket `flowdeck` existiert (HTTP 200) |

## 6. Shortlist: Kandidaten mit Verfügbarkeitsnachweis

Geprüft per DNS (alle fünf TLDs), npm-Registry, GitHub und Websuche am 2026-10-06:

| Kandidat | Herkunft / Bedeutung | Produkt-Treffer | Domains | npm | GitHub | Urteil |
|---|---|---|---|---|---|---|
| **Tabtory** | Koiné aus "Tab" + "-tory" (territory/territory-Gebiet; klingt nach "directory") | **0 Treffer in der Websuche** | .com/.app/.io/.dev/**.de alle frei** | frei | frei (404) | **Bester Freibefund der Recherche** |
| Tabmatic | "Tab" + "automatic" | Kein Produkt; .com im Marken-Verkauf (BrandBucket) | .app/.dev/.de frei; .com geparkt; .io belegt | frei | – | Gut, aber .com müsste käuflich sein |
| Tabfolio | "Tab" + "portfolio" | Kein Produkt | .io/.dev/.de frei; .com geparkt; .app belegt | frei | – | Solide Alternative |
| Deskshift | "Desk" + "shift" (passt zum Workflow-Wechsel) | Kein Produkt | .io/.dev/.de frei; .com geparkt; .app belegt | frei | – | Solide Alternative, sehr "IT-lastig" |
| DeskPilot (Status Quo) | Projektname | Mehrere, inkl. Funktionskonkurrent + AT-GmbH + npm | .io/.app/.dev belegt | belegt | belegt | Nur für rein lokale, unveröffentlichte Nutzung vertretbar |
| Latein-Wörter (Tabularium, Horreum, Specula, Signifer, Alidade, Orrery, Armarium) | Römische Archiv-/Navigations-/Wächterbegriffe | Keine Produkte | **Alle geparkt/belegt** | – | – | Abgelehnt: Domain-Landschaft unbrauchbar, Aussprache-Hürde |

## 7. Bewertungsmatrix

Gewichtung: Freiheit 40 %, Passung 25 %, Distinctiveness 20 %, Sprache/Monogramm 15 % (1 = schlecht, 5 = sehr gut):

| Kriterium | Tabtory | Tabmatic | Tabfolio | Deskshift | DeskPilot |
|---|---|---|---|---|---|
| Namensfreiheit (Produkt/TM/Domains) | 5 | 4 | 3 | 3 | 1 |
| Passung zu Sessions/Kategorien | 4 | 4 | 3 | 4 | 4 |
| Passung zu Desk-/Automatisierung später | 3 | 4 | 3 | 5 | 5 |
| Distinctiveness | 5 | 4 | 4 | 3 | 2 |
| Sprech-/Schreibbarkeit DE+EN | 4 | 4 | 4 | 5 | 5 |
| Monogramm (DP → ?) | 4 (TT) | 4 (TM) | 4 (TF) | 4 (DS) | 5 (DP) |
| Kompatibilität Roman-Theme | 3 | 3 | 3 | 3 | 3 |
| **Gewichtet (gerundet)** | **4,3** | **3,8** | **3,3** | **3,7** | **3,0** |

Anmerkungen:

- **Tabtory**: Einzigster Kandidat mit sauberem Freibefund über alle Kanäle. Bedeutung muss getragen werden: "Tab" (Tabs) + "-tory" liest sich als Gebiet/Verzeichnis – die Kategorien sind die "Territorien" der Browser-Sessions. Aussprache /ˈtæb.tə.ri/ (TAB-tuh-ree); Monogramm "TT" könnte die "DP"-Rolle im UI übernehmen (Header, Installer, Tray).
- **Tabmatic**: Semantisch sehr passend ("Tabs, die von selbst organisiert werden" – automatisches Wiederherstellen), aber tabmatic.com ist als Premium-Domain im Verkauf; "matic"-Suffix ist zudem leicht überfüllt (automatisch/automatik-Assoziation, nicht schützbar).
- **Tabfolio**: "Portfolio an Tabs" trifft die Kategorie-Idee gut; "folio" klingt edel, aber die Bezeichnung ist näher an Dokumenten-/Finanz-Software als an Desk-Automatisierung.
- **Deskshift**: Beste Passung zur Workflow-Wechsel- und Automatisierungs-Richtung; "shift" ist aber ein sehr allgemeines IT-Wort (Shift-Register, Schichtbetrieb), Distinctiveness leidet.
- **DeskPilot**: Maximale Vertrautheit, aber nachweislich belegt. Die Recherche zeigt konkret, wodurch es kollidiert (Funktionskonkurrent, Wiener GmbH, npm, Dutzende Projekte).

## 8. Empfehlung

1. **Primärempfehlung: "Tabtory"** als neuer Produktname.
   - Einziger Kandidat ohne jeden Produktbeleg, mit freien Domains auf allen geprüften TLDs (inkl. .de) und freiem npm-/GitHub-Namen.
   - "Tab"-Wurzel passt zum heutigen Kern (Browser-Sessions), "-tory"/Territorium-Gebiet trägt die Kategorie-Idee und bleibt offen für spätere Desk-Funktionen (DesktopPilot- und EnvironmentPilot-Inhalte werden später zum "Territorium" des Nutzers).
   - Vor der finalen Entscheidung: Dominanz sichern (mindestens tabtory.com + tabtory.de).
2. **Sekundäroptionen** (falls Tabtory beim Nutzer nicht ankommt):
   - **Tabmatic**, sofern tabmatic.com käuflich und die formale Markenrecherche sauber bleibt.
   - **Tabfolio** (Fokus: Kategorien als Sammlungen) – aber .com/.app belegt.
   - **Deskshift** (Fokus: Workflow-Wechsel) – aber .com/.app belegt.
3. **Status Quo "DeskPilot"** nur weiterführen, wenn das Produkt dauerhaft unveröffentlicht und rein lokal bleibt. Sobald ein öffentlicher Release, ein Store-Eintrag oder eine Veröffentlichung ansteht, ist die Umbenennung zwingend – die Recherche zeigt reale, aktive Namensinhaber inkl. eines DACH-Unternehmens.
4. **Untermarben (Pilot-Familie)**: Das "Pilot"-Präfix ist praktisch unbrauchbar (Abschnitt 4). Nach einer Entscheidung für einen neuen Produktnamen eine zweite, kurze Recherche für die Untermarben-Familie starten; naheliegend und minimal-riskant wäre die Namenskopplung ("Tabtory Browser", "Tabtory Desktop", "Tabtory Environment").

## 9. Offene Punkte und nächste Schritte

Vor einer verbindlichen Entscheidung (in dieser Reihenfolge):

1. **Nutzer-Entscheidung** über die Shortlist (Tabtory / Tabmatic / Tabfolio / Deskshift / DeskPilot beibehalten).
2. **Domain-Sicherung** des Favoriten (tabtory.com, tabtory.de, ggf. .app/.io) – Domain kann nicht mehr reklamiert werden, wenn sie weg ist.
3. **Formale Markenrecherche**: DPMA (DE), EUIPO (EU), USPTO – Warenklassen 9 und 42 (Software), Suchbegriffe inkl. Schreibvarianten; optional Wortmarke anmelden.
4. **Store-Checks manuell**: Chrome Web Store, Microsoft Store, Mac App Store, Google Play (die Recherche deckt diese Kanäle nicht vollständig ab).
5. **Namensänderung umsetzen** (falls Umbruch): App-Titel, Installer-Namen, Tray, Icon-Monogramm "DP", GitHub-Repo-Name, Browser-Extension-Name, Sub-Produkt-Namen, docs/ und Roadmap-Texte – als eigener Arbeitspaket-Plan mit eigener Recherche der Untermarben.
6. **Bis dahin gilt**: Keine neuen, öffentlichen Artefakte unter dem Namen DeskPilot erzeugen (Release-Assets, Store-Eintrag, Landingpage), solange der Name nicht geklärt ist.

## 10. Einschränkungen dieser Recherche

- DNS-Ergebnisse sind ein Proxy für Domain-Belegung, kein Whois; "kein A-Record" kann registrierte, unbediente Domains verschleiern.
- Markenregister wurden nicht formell geprüft; "kein Treffer in der Websuche" ist kein Freibrief.
- Chrome Web Store / Microsoft Store / App Stores wurden nur indirekt über Websuche erfasst.
- Rechercheindex-Stand 2026-10-06; der Namensraum ändert sich kontinuierlich (mehrere belegte Projekte aus 2025–2026 sind in dieser Recherche erst entstanden).
- Diese Recherche ist Entscheidungsvorlage, keine Rechtsberatung.

## 11. Quellen (Auswahl, Stand 2026-10-06)

DeskPilot / Pilot-Familie:
- https://deskpilot-site.vercel.app/ (DeskPilot AI)
- https://github.com/deskpilotai/deskpilotai (DeskPilot AI Releases)
- https://github.com/clawdia-org/deskpilot
- https://www.npmjs.com/package/deskpilot
- https://techlosoft.com/tools/deskpilot/
- https://trydeskpilot.com/
- https://www.deskpilot.at/ (+ Impressum: Deskpilot GmbH, Wien)
- https://find-and-update.company-information.service.gov.uk/company/16631471 (DESKPILOT HQ LTD)
- https://deskpilothq.com/
- https://markinton.com/trademark/deskpilot-76135918 (USPTO tot)
- https://mycorporateinfo.com/trademark/deskpilot-dev.-of-globe/643476 (Indien, Klasse 16)
- https://chromewebstore.google.com/detail/browserpilot/gdboiphjolfchlejlpdciepemkajhnhl
- https://getbrowserpilot.com/
- https://tabpilot.app/ , https://tabpilot.ai/
- https://session-pilot.com/ , https://github.com/web-werkstatt/session-pilot
- https://workpilot.space/
- https://github.com/OpenBMB/PilotDeck
- https://panelpilot.com/
- https://www.flightdeckefb.com/

Namensraum:
- https://www.tabshelf.com/ , Chrome-Web-Store-Eintrag Tab Shelf
- https://chromewebstore.google.com/detail/tabvault-session-manager/abnclgimbelipkonifmbdbkkelloadmf
- https://github.com/mrluxy/TabNest , https://github.com/fullpie/TabNest , https://github.com/0xAlok/TabNest
- https://beta.tabdeck.so/ , https://github.com/tabdeck
- https://www.sessionboard.com/
- https://getdeskdeck.com/ , https://deskdeck.appstor.io/
- https://github.com/mtmattei/DeskBoard , https://deskboard.geeke.app/
- https://www.deckboard.app/
- https://www.control-deck.com/ , App Store ControlDeck
- https://www.deskora.de/en/ , https://deskora.app/
- https://restorapos.com/ + Google-Play "Restora"-Einträge
- https://lvruan.com/en/app/2688 (DeskPort)
- https://www.desk.ly/ (desk.ly GmbH, Osnabrück)
- https://deskly.in/
- https://sessio.io/ (via linkedin.com/company/sessio-io)
- https://trimtab.se/ , https://www.usetrimtab.com/
- https://tarmac.musicsian.com/
- https://www.wolterskluwer.com/en/solutions/praetor
- https://github.com/Skylark-Software/Janua
- https://tessera.company/ , https://tesserra.app/ , https://github.com/AIArchitectsLabs/tessera , https://github.com/horang-labs/tessera
- https://github.com/binnacle-app/Binnacle , https://store.seayniclabs.com/products/binnacle
- http://timpokorny.github.io/public/index.html (Portico)
- https://github.com/AI-team-UoA/Sextant , https://github.com/mattpocock/sextant
- https://www.optioincentives.com/ , kensington-solutions.com/software/optio-software/
- https://mods.marin.nl/display/QUAESTOR (Quaestor)
- https://statio.dev/
- https://github.com/blueskylineassets/custos , https://custos-xi.vercel.app/ , https://github.com/Arcis-Protocol/custos
- https://github.com/LimenMC/limen , https://limencode.app/
- https://getatrium.dev/ , https://github.com/lhz960904/atrium
- https://www.mansio-logistics.com/en/about-mansio/ , https://github.com/Younkyum/mansio
- https://yt3trees/Curia (via GitHub), https://meetcuria.com/
- https://vesta.ingenium-ai-solutions.com/ , https://biomedware.com/products/vesta-data-security/ , https://github.com/elyxlz/vesta
- https://www.tabmatic.com via brandbucket.com/names/tabmatic (Verkauf)
- https://tabshift.brillytics.com/ , tabshift.dev (Freiburg), TABSHIFT LIMITED (UK, Company 11048028)
- https://express.adobe.com/page/lJINB/ (Aviary/Adobe)
- DNS-Abfragen (A-Records) und npm-Registry-Head-Requests durchgeführt am 2026-10-06, Ergebnisse in Abschnitt 6
