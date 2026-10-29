const STORAGE_KEY = "zulassung24-auftrag";
const LAST_STEP = 7;
const PHOTO_KEYS = [
  ["kennzeichenVorne", "Kennzeichen vorne mit Siegel"],
  ["kennzeichenHinten", "Kennzeichen hinten mit Siegel"],
  ["zb1", "Zulassungsbescheinigung Teil I mit Siegel"],
];
const IDENT_KEYS = [
  ["selfie", "Gesicht (Selfie)"],
  ["ausweisVorn", "Ausweis Vorderseite"],
  ["ausweisHinten", "Ausweis Rückseite"],
];
const ALL_PHOTO_KEYS = [...PHOTO_KEYS, ...IDENT_KEYS];

const photos = {};

const VAT_RATE = 0.19;

function euro(value) {
  return value.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

function priceFromGross(gross) {
  const net = Math.round((gross / (1 + VAT_RATE)) * 100) / 100;
  const vat = Math.round((gross - net) * 100) / 100;
  return { net, vatRate: VAT_RATE, vat, gross };
}

const PRICE_ABMELDUNG = priceFromGross(19.9);
const PRICE_RESERVIERUNG = priceFromGross(19.9);
const PRICE_UMSCHREIBUNG = priceFromGross(49.9);
const PRICE_NORMAL = priceFromGross(119.9);
const PRICE_ALL_IN = priceFromGross(129.9);
const PRICE_FREE = priceFromGross(0);

function needsPaket(vorgang = currentVorgang()) {
  return (
    Boolean(vorgang) &&
    !["Abmeldung", "Kennzeichenreservierung", "Umschreibung", "Kurzzeitkennzeichen", "Saisonkennzeichen"].includes(
      vorgang
    )
  );
}

function currentPaket() {
  return formData().paket || "";
}

function currentPrice() {
  const vorgang = currentVorgang();
  if (!vorgang) return PRICE_FREE;
  if (vorgang === "Kennzeichenreservierung") return PRICE_RESERVIERUNG;
  if (vorgang === "Abmeldung") return PRICE_ABMELDUNG;
  if (vorgang === "Umschreibung") return PRICE_UMSCHREIBUNG;
  if (vorgang === "Kurzzeitkennzeichen" || vorgang === "Saisonkennzeichen") return PRICE_NORMAL;
  if (currentPaket() === "Normal") return PRICE_NORMAL;
  return PRICE_ALL_IN;
}

function priceLabel(price) {
  return price.gross === 0 ? "kostenlos" : euro(price.gross);
}

function renderPriceBox() {
  const box = document.getElementById("price-box-pay");
  if (!box) return;
  const price = currentPrice();
  const vorgang = currentVorgang() || "Vorgang";
  const hint = box.querySelector(".hint");
  const title = box.querySelector(".price-box__title");
  const paketName =
    vorgang === "Abmeldung"
      ? "Abmeldung"
      : vorgang === "Kennzeichenreservierung"
        ? "Reservierung"
        : vorgang === "Umschreibung"
          ? "Umschreibung"
          : vorgang === "Kurzzeitkennzeichen"
            ? "Kurzzeitkennzeichen"
            : vorgang === "Saisonkennzeichen"
              ? "Saisonkennzeichen"
        : currentPaket() === "Normal"
          ? "Normale Zulassung"
          : "All-Inclusive";
  if (title) title.textContent = `${paketName} · inkl. MwSt.`;
  const net = box.querySelector("[data-price-net]");
  const vat = box.querySelector("[data-price-vat]");
  const gross = box.querySelector("[data-price-gross]");
  if (net) net.textContent = euro(price.net);
  if (vat) vat.textContent = euro(price.vat);
  if (gross) gross.textContent = priceLabel(price);
  if (hint) {
    hint.textContent =
      price.gross === 0
        ? "Keine Servicegebühr. Behördengebühren sind nicht enthalten. In der Demo wird nichts abgebucht."
        : vorgang === "Kennzeichenreservierung"
          ? "Prüfung des Wunschkennzeichens, keine amtliche Reservierung. In der Demo wird nichts abgebucht."
          : vorgang === "Abmeldung"
            ? "Abmeldung inkl. 19 % MwSt. Behördengebühren nicht enthalten. In der Demo wird nichts abgebucht."
          : vorgang === "Umschreibung"
            ? "Umschreibung inkl. 19 % MwSt. Behördengebühren nicht enthalten. In der Demo wird nichts abgebucht."
          : vorgang === "Kurzzeitkennzeichen" || vorgang === "Saisonkennzeichen"
            ? "119,90 € inkl. 19 % MwSt. Behördengebühren nicht enthalten. In der Demo wird nichts abgebucht."
        : currentPaket() === "Normal"
          ? "Normale Zulassung ohne neue Schilder. Behördengebühren nicht enthalten. In der Demo wird nichts abgebucht."
          : "All-Inclusive mit Schildern, Fotos und Foto-Ident. Behördengebühren nicht enthalten. In der Demo wird nichts abgebucht.";
  }
  const zahlungLegend = document.getElementById("zahlung-legend");
  if (zahlungLegend) zahlungLegend.hidden = price.gross === 0;
  document.querySelectorAll('input[name="zahlung"]').forEach((input) => {
    const row = input.closest(".choice");
    if (row) row.hidden = price.gross === 0;
  });
  const cardHint = document.querySelector("#karten-felder")?.nextElementSibling;
  if (price.gross === 0) {
    document.getElementById("karten-felder").hidden = true;
    if (cardHint?.classList.contains("hint")) {
      cardHint.hidden = true;
    }
  } else if (cardHint?.classList.contains("hint")) {
    cardHint.hidden = false;
  }
}

const ZULASSUNGSSTELLEN = [
  { from: 1067, to: 1328, city: "Dresden", office: "Kfz-Zulassungsbehörde Dresden" },
  { from: 4103, to: 4357, city: "Leipzig", office: "Kfz-Zulassungsbehörde Leipzig" },
  { from: 10115, to: 14199, city: "Berlin", office: "Kfz-Zulassung Berlin (LABO)" },
  { from: 14467, to: 14482, city: "Potsdam", office: "Kfz-Zulassungsstelle Potsdam" },
  { from: 18055, to: 18147, city: "Rostock", office: "Kfz-Zulassungsbehörde Rostock" },
  { from: 20095, to: 22769, city: "Hamburg", office: "Landesbetrieb Verkehr Hamburg, Kfz-Zulassung" },
  { from: 24103, to: 24159, city: "Kiel", office: "Kfz-Zulassungsbehörde Kiel" },
  { from: 28195, to: 28779, city: "Bremen", office: "Bürgeramt Bremen, Kfz-Zulassung" },
  { from: 30159, to: 30659, city: "Hannover", office: "Kfz-Zulassungsstelle Hannover" },
  { from: 33602, to: 33739, city: "Bielefeld", office: "Kfz-Zulassungsbehörde Bielefeld" },
  { from: 39104, to: 39130, city: "Magdeburg", office: "Kfz-Zulassungsbehörde Magdeburg" },
  { from: 40210, to: 40629, city: "Düsseldorf", office: "Kfz-Zulassungsbehörde Düsseldorf" },
  { from: 44135, to: 44388, city: "Dortmund", office: "Bürgerdienste Dortmund, Kfz-Zulassung" },
  { from: 45127, to: 45359, city: "Essen", office: "Kfz-Zulassungsbehörde Essen" },
  { from: 47051, to: 47279, city: "Duisburg", office: "Kfz-Zulassungsbehörde Duisburg" },
  { from: 50667, to: 51149, city: "Köln", office: "Kfz-Zulassungsstelle Köln" },
  { from: 52062, to: 52080, city: "Aachen", office: "Kfz-Zulassungsbehörde Aachen" },
  { from: 53111, to: 53229, city: "Bonn", office: "Kfz-Zulassungsbehörde Bonn" },
  { from: 55116, to: 55131, city: "Mainz", office: "Kfz-Zulassungsbehörde Mainz" },
  { from: 60306, to: 60599, city: "Frankfurt am Main", office: "Kfz-Zulassungsbehörde Frankfurt am Main" },
  { from: 65183, to: 65207, city: "Wiesbaden", office: "Kfz-Zulassungsbehörde Wiesbaden" },
  { from: 66111, to: 66133, city: "Saarbrücken", office: "Kfz-Zulassungsbehörde Saarbrücken" },
  { from: 68159, to: 68309, city: "Mannheim", office: "Kfz-Zulassungsbehörde Mannheim" },
  { from: 70173, to: 70619, city: "Stuttgart", office: "Bürgerbüro Auto, Stuttgart" },
  { from: 76131, to: 76229, city: "Karlsruhe", office: "Kfz-Zulassungsbehörde Karlsruhe" },
  { from: 79098, to: 79117, city: "Freiburg", office: "Kfz-Zulassungsbehörde Freiburg" },
  { from: 80331, to: 81929, city: "München", office: "Kfz-Zulassungsbehörde München" },
  { from: 86150, to: 86199, city: "Augsburg", office: "Kfz-Zulassungsbehörde Augsburg" },
  { from: 90402, to: 90491, city: "Nürnberg", office: "Kfz-Zulassungsbehörde Nürnberg" },
  { from: 97070, to: 97084, city: "Würzburg", office: "Kfz-Zulassungsbehörde Würzburg" },
  { from: 99084, to: 99099, city: "Erfurt", office: "Kfz-Zulassungsbehörde Erfurt" },
];

const CITY_STELLEN = {
  berlin: "Berlin",
  hamburg: "Hamburg",
  muenchen: "München",
  münchen: "München",
  koeln: "Köln",
  köln: "Köln",
  frankfurt: "Frankfurt am Main",
  "frankfurt am main": "Frankfurt am Main",
  stuttgart: "Stuttgart",
  duesseldorf: "Düsseldorf",
  düsseldorf: "Düsseldorf",
  dortmund: "Dortmund",
  essen: "Essen",
  leipzig: "Leipzig",
  dresden: "Dresden",
  hannover: "Hannover",
  nürnberg: "Nürnberg",
  nuernberg: "Nürnberg",
  bremen: "Bremen",
  duisburg: "Duisburg",
  bochum: "Dortmund",
  wuppertal: "Düsseldorf",
  bielefeld: "Bielefeld",
  bonn: "Bonn",
  münster: "Dortmund",
  muenster: "Dortmund",
  karlsruhe: "Karlsruhe",
  mannheim: "Mannheim",
  augsburg: "Augsburg",
  wiesbaden: "Wiesbaden",
  aachen: "Aachen",
  kiel: "Kiel",
  chemnitz: "Leipzig",
  magdeburg: "Magdeburg",
  freiburg: "Freiburg",
  krefeld: "Düsseldorf",
  mainz: "Mainz",
  erfurt: "Erfurt",
  rostock: "Rostock",
  saarbrücken: "Saarbrücken",
  saarbruecken: "Saarbrücken",
  potsdam: "Potsdam",
  würzburg: "Würzburg",
  wuerzburg: "Würzburg",
};

const UNTERLAGEN = {
  Neuzulassung: [
    { id: "zb1", label: "Zulassungsbescheinigung Teil I", required: true },
    { id: "zb2", label: "Zulassungsbescheinigung Teil II", required: true },
    { id: "evbDoc", label: "eVB-Nummer der Versicherung", required: true },
    { id: "ausweisDoc", label: "Personalausweis oder Aufenthaltstitel", required: true },
    { id: "sepa", label: "SEPA-Mandat für die Kfz-Steuer", required: true },
    { id: "coc", label: "COC / Übereinstimmungsbescheinigung", required: false },
  ],
  Umschreibung: [
    { id: "zb1", label: "Zulassungsbescheinigung Teil I", required: true },
    { id: "zb2", label: "Zulassungsbescheinigung Teil II", required: true },
    { id: "evbDoc", label: "eVB-Nummer der Versicherung", required: true },
    { id: "ausweisDoc", label: "Personalausweis oder Aufenthaltstitel", required: true },
    { id: "plates", label: "Aktuelle Kennzeichen", required: true },
    { id: "kaufvertrag", label: "Kaufvertrag", required: false },
  ],
  Abmeldung: [
    { id: "zb1", label: "Zulassungsbescheinigung Teil I", required: true },
    { id: "plates", label: "Beide Kennzeichen", required: true },
    { id: "ausweisDoc", label: "Personalausweis oder Aufenthaltstitel", required: true },
  ],
  Kennzeichenreservierung: [
    { id: "ausweisDoc", label: "Personalausweis oder Aufenthaltstitel", required: true },
  ],
  Kurzzeitkennzeichen: [
    { id: "ausweisDoc", label: "Personalausweis oder Aufenthaltstitel", required: true },
    { id: "evbDoc", label: "eVB-Nummer der Versicherung", required: true },
    { id: "zb1", label: "Zulassungsbescheinigung Teil I", required: false },
  ],
  Saisonkennzeichen: [
    { id: "zb1", label: "Zulassungsbescheinigung Teil I", required: true },
    { id: "zb2", label: "Zulassungsbescheinigung Teil II", required: true },
    { id: "evbDoc", label: "eVB-Nummer der Versicherung", required: true },
    { id: "ausweisDoc", label: "Personalausweis oder Aufenthaltstitel", required: true },
    { id: "plates", label: "Aktuelle Kennzeichen", required: false },
  ],
};

let lastUnterlagenVorgang = "";

function normalizeCity(value) {
  return (value || "").trim().toLowerCase();
}

function findStelle(plz, stadt) {
  const digits = (plz || "").replace(/\D/g, "").slice(0, 5);
  if (digits.length === 5) {
    const n = Number(digits);
    const hit = ZULASSUNGSSTELLEN.find((row) => n >= row.from && n <= row.to);
    if (hit) return { ...hit, plz: digits, estimated: false };
  }
  const mapped = CITY_STELLEN[normalizeCity(stadt)];
  if (mapped) {
    const hit = ZULASSUNGSSTELLEN.find((row) => row.city === mapped);
    if (hit) return { ...hit, plz: digits, estimated: false };
  }
  if (digits.length === 5) {
    return {
      city: stadt || "unbekannt",
      office: `Zulassungsbehörde für PLZ ${digits}`,
      plz: digits,
      estimated: true,
    };
  }
  return null;
}

function updateStelle() {
  const plzInput = document.querySelector('[name="plz"]');
  const cityInput = document.querySelector('[name="stadt"]');
  const stelle = findStelle(plzInput?.value, cityInput?.value);
  const box = document.getElementById("stelle-box");
  if (!stelle) {
    box.hidden = true;
    document.getElementById("stelleName").value = "";
    document.getElementById("stelleOrt").value = "";
    return;
  }
  if (stelle.city && stelle.city !== "unbekannt" && !cityInput.value.trim()) {
    cityInput.value = stelle.city;
  }
  box.hidden = false;
  document.getElementById("stelle-name").textContent = stelle.office;
  document.getElementById("stelle-meta").textContent = stelle.estimated
    ? `${stelle.plz} · Demo-Zuordnung anhand der PLZ, keine amtliche Auskunft.`
    : `${stelle.city}${stelle.plz ? ` · PLZ ${stelle.plz}` : ""} · Demo-Zuordnung.`;
  document.getElementById("stelleName").value = stelle.office;
  document.getElementById("stelleOrt").value = stelle.city;
}

function currentVorgang() {
  return formData().vorgang || "";
}

function unterlagenFor() {
  return UNTERLAGEN[currentVorgang()] || UNTERLAGEN.Neuzulassung;
}

function renderUnterlagen() {
  const vorgang = currentVorgang() || "Neuzulassung";
  const list = document.getElementById("unterlagen-list");
  if (lastUnterlagenVorgang === vorgang && list.innerHTML) return;
  lastUnterlagenVorgang = vorgang;
  const items = UNTERLAGEN[vorgang] || UNTERLAGEN.Neuzulassung;
  document.getElementById("unterlagen-hint").textContent =
    vorgang === "Abmeldung"
      ? "Nur mitnehmen, was für die Abmeldung nötig ist."
      : "Haken setzen, sobald die Unterlage vorliegt. Optionale Nachweise kannst du weglassen.";
  list.innerHTML = items
    .map(
      (item) => `
        <label class="check">
          <input type="checkbox" name="unterlage_${item.id}" value="ja" />
          <span>${item.label}</span>
          <em class="tag">${item.required ? "nötig" : "optional"}</em>
        </label>`
    )
    .join("");
}

function needsEvb() {
  return !["Abmeldung", "Kennzeichenreservierung"].includes(currentVorgang());
}

function skipFotos() {
  return currentVorgang() === "Kennzeichenreservierung";
}

function updateVorgangUi() {
  const vorgang = currentVorgang();
  const abmeldung = vorgang === "Abmeldung";
  const reservierung = vorgang === "Kennzeichenreservierung";
  document.getElementById("wunsch-wrap").hidden = abmeldung;
  document.getElementById("kennzeichen-check-row").hidden = abmeldung;
  document.getElementById("evb-wrap").hidden = !needsEvb();
  document.getElementById("saison-wrap").hidden = vorgang !== "Saisonkennzeichen";
  document.getElementById("kennzeichen-wrap").querySelector("input").placeholder = abmeldung
    ? "B AB 1234"
    : "falls schon vorhanden";
  document.getElementById("foto-hint").textContent = reservierung
    ? "Für die Reservierung sind keine Kennzeichenfotos nötig."
    : abmeldung
      ? "Für die Abmeldung: beide Kennzeichen mit Siegel und die Zulassungsbescheinigung Teil I."
      : "Bitte so fotografieren, dass Siegel und Schrift gut zu erkennen sind.";
  const title = document.getElementById("auftrag-title");
  if (title) title.textContent = vorgang ? `${vorgang} · Auftrag` : "Auftrag starten";
  const paketWrap = document.getElementById("paket-wrap");
  if (paketWrap) paketWrap.hidden = !needsPaket(vorgang);
  if (!needsPaket(vorgang)) {
    document.querySelectorAll('input[name="paket"]').forEach((input) => {
      input.checked = false;
    });
  } else if (!currentPaket()) {
    const allIn = document.querySelector('input[name="paket"][value="AllInclusive"]');
    if (allIn) allIn.checked = true;
  }
  renderUnterlagen();
  renderPriceBox();
}

function currentPanel() {
  return Number(document.querySelector("fieldset:not([hidden])")?.dataset.panel || 1);
}

function identDocName() {
  return formData().ausweis || "Ausweis";
}

function updateIdentLabels() {
  const doc = identDocName();
  IDENT_KEYS[1][1] = `${doc} Vorderseite`;
  IDENT_KEYS[2][1] = `${doc} Rückseite`;
  const front = document.getElementById("ident-front-label");
  const back = document.getElementById("ident-back-label");
  if (front) front.textContent = IDENT_KEYS[1][1];
  if (back) back.textContent = IDENT_KEYS[2][1];
}

function showPanel(step) {
  if (step === 2) updateStelle();
  if (step === 3 || step === 4) updateVorgangUi();
  if (step === 5) updateIdentLabels();
  if (step === 6) renderPriceBox();
  document.querySelectorAll("#auftrag-form fieldset").forEach((set) => {
    set.hidden = Number(set.dataset.panel) !== step;
  });
  document.querySelectorAll(".steps li").forEach((li) => {
    li.classList.toggle("is-active", Number(li.dataset.step) === step);
  });
  const stepCopy = [
    "",
    "Vorgang · etwa 1 Minute",
    "Halter · etwa 2 Minuten",
    "Fahrzeug · etwa 2 Minuten",
    "Fotos · etwa 3 Minuten",
    "Ident · etwa 2 Minuten",
    "Zahlung · etwa 1 Minute",
    "Prüfen und speichern",
  ];
  document.getElementById("wizard-status").textContent =
    `Schritt ${step} von ${LAST_STEP} — ${stepCopy[step] || ""}`;
  const bar = document.getElementById("progress-bar");
  if (bar) bar.style.width = `${Math.round((step / LAST_STEP) * 100)}%`;
  document.getElementById("btn-back").hidden = step === 1;
  document.getElementById("btn-next").textContent =
    step === LAST_STEP ? "Auftrag speichern" : "Weiter";
}

function formData() {
  const form = document.getElementById("auftrag-form");
  const data = new FormData(form);
  const values = Object.fromEntries(data.entries());
  return values;
}

function missingFrom(list) {
  return list.filter(([key]) => !photos[key]).map(([, label]) => label);
}

function validate(step) {
  const error = document.getElementById("form-error");
  error.hidden = true;
  const values = formData();
  let message = "";
  if (step === 1) {
    if (!values.vorgang) message = "Bitte einen Vorgang wählen.";
    else if (needsPaket(values.vorgang) && !values.paket) {
      message = "Bitte normale Zulassung oder All-Inclusive wählen.";
    }
  }
  if (step === 2) {
    if (!values.halterart) message = "Bitte Privatperson oder Firma wählen.";
    else if (values.halterart === "Firma" && !values.firma?.trim()) message = "Firmenname fehlt.";
    else if (!values.name?.trim()) message = "Name fehlt.";
    else if (!values.email?.includes("@")) message = "Bitte eine gültige E-Mail angeben.";
    else if ((values.telefon || "").replace(/\D/g, "").length < 6) message = "Bitte eine Telefonnummer angeben.";
    else if (!values.anschrift?.trim()) message = "Straße und Hausnummer fehlen.";
    else if (!/^\d{5}$/.test(values.plz || "")) message = "Bitte eine fünfstellige Postleitzahl angeben.";
    else if (!values.stadt?.trim()) message = "Stadt fehlt.";
  }
  if (step === 3) {
    const missingDocs = unterlagenFor()
      .filter((item) => item.required && values[`unterlage_${item.id}`] !== "ja")
      .map((item) => item.label);
    if (values.vorgang === "Kennzeichenreservierung" && !values.wunschkennzeichen?.trim()) {
      message = "Bitte ein Wunschkennzeichen angeben.";
    } else if (needsEvb() && !values.evb?.trim()) {
      message = "Für diesen Vorgang wird eine eVB-Nummer benötigt.";
    } else if (values.vorgang === "Saisonkennzeichen" && !values.saison?.trim()) {
      message = "Bitte die Saison-Monate angeben.";
    } else if (missingDocs.length) {
      message = "Bitte die nötigen Unterlagen abhaken: " + missingDocs.join(", ") + ".";
    }
  }
  if (step === 4 && !skipFotos()) {
    if (missingFrom(PHOTO_KEYS).length) {
      message = "Bitte alle Fotos machen: " + missingFrom(PHOTO_KEYS).join(", ") + ".";
    } else {
      const missingChecks = PHOTO_KEYS.flatMap(([key, label]) => {
        if (values[`check_${key}_siegel`] !== "ja") return [`Siegel: ${label}`];
        if (values[`check_${key}_scharf`] !== "ja") return [`Lesbarkeit: ${label}`];
        return [];
      });
      if (missingChecks.length) {
        message = "Bitte die Foto-Hilfe abhaken: " + missingChecks.join(", ") + ".";
      }
    }
  }
  if (step === 5) {
    if (!values.ausweis) message = "Bitte Personalausweis oder Aufenthaltstitel wählen.";
    else if (missingFrom(IDENT_KEYS).length) {
      message = "Bitte das Foto-Ident abschließen: " + missingFrom(IDENT_KEYS).join(", ") + ".";
    } else if (values.identDemo !== "ja") {
      message = "Bitte den Demo-Ident-Abgleich bestätigen.";
    }
  }
  if (step === 6) {
    const free = currentPrice().gross === 0;
    if (!values.lieferung) message = "Bitte Abholung oder Versand wählen.";
    else if (values.lieferung !== "Abholung" && !values.strasse?.trim()) {
      message = "Für den Versand fehlt die Straße.";
    } else if (!free && !values.zahlung) message = "Bitte eine Zahlungsart wählen.";
    else if (values.zahlung === "Kreditkarte") {
      const digits = (values.kartennummer || "").replace(/\D/g, "");
      const [mm, yy] = (values.kartenAblauf || "").split("/");
      const expOk = /^\d{2}\/\d{2}$/.test(values.kartenAblauf || "") &&
        Number(mm) >= 1 && Number(mm) <= 12;
      const cvc = (values.kartencode || "").replace(/\D/g, "");
      if (!values.kartenVorname?.trim()) message = "Vorname auf der Karte fehlt.";
      else if (!values.kartenNachname?.trim()) message = "Nachname auf der Karte fehlt.";
      else if (!values.kartenEmail?.includes("@")) message = "Bitte eine E-Mail für die Kartenzahlung angeben.";
      else if (digits.length < 13 || digits.length > 19) message = "Bitte eine gültige Kreditkartennummer angeben.";
      else if (!expOk) message = "Bitte das Ablaufdatum als MM/JJ angeben.";
      else if (cvc.length < 3 || cvc.length > 4) message = "Bitte den Kreditkartencode (CVC) angeben.";
    }
  }
  if (message) {
    error.textContent = message;
    error.hidden = false;
    return false;
  }
  return true;
}

function renderSummary() {
  const v = formData();
  const docs = v.ausweis || "–";
  const thumbs = (list) =>
    list
      .map(([key, label]) => {
        const src = photos[key];
        return src
          ? `<figure><img src="${src}" alt="${label}" /><figcaption>${label}</figcaption></figure>`
          : "";
      })
      .join("");
  document.getElementById("summary").innerHTML = `
    <p><strong>Vorgang:</strong> ${v.vorgang || "–"}${
      v.paket === "AllInclusive"
        ? " · All-Inclusive (mit Schildern)"
        : v.paket === "Normal"
          ? " · normale Zulassung (ohne neue Schilder)"
          : ""
    }</p>
    <p><strong>Halter:</strong> ${v.name || "–"}, ${v.plz || ""} ${v.stadt || "–"}</p>
    <p><strong>Zulassungsstelle:</strong> ${v.stelleName || "–"}</p>
    <p><strong>Kontakt:</strong> ${v.email || "–"}</p>
    <p><strong>Kennzeichen:</strong> ${v.kennzeichen || "wird zugeteilt"}</p>
    <p><strong>Wunschkennzeichen:</strong> ${v.wunschkennzeichen || "–"}</p>
    <p><strong>eVB:</strong> ${v.evb || "–"}</p>
    <p><strong>Unterlagen:</strong> ${unterlagenFor()
      .filter((item) => v[`unterlage_${item.id}`] === "ja")
      .map((item) => item.label)
      .join(", ") || "–"}</p>
    <p><strong>Ident-Dokument:</strong> ${docs}</p>
    <p><strong>Fotos:</strong></p>
    <div class="summary-photos">${thumbs(PHOTO_KEYS)}</div>
    <p><strong>Foto-Ident:</strong></p>
    <div class="summary-photos">${thumbs(IDENT_KEYS)}</div>
    <p><strong>Lieferung:</strong> ${v.lieferung || "–"}${v.strasse ? ` · ${v.strasse}` : ""}${v.termin ? ` · ${v.termin}` : ""}</p>
    <p><strong>Zahlung:</strong> ${paymentSummary(v)} (Demo, nicht ausgeführt)</p>
    <p><strong>Preis:</strong> ${
      currentPrice().gross === 0
        ? "kostenlos (keine Servicegebühr)"
        : `${euro(currentPrice().net)} zzgl. ${euro(currentPrice().vat)} MwSt. (19 %), gesamt ${euro(currentPrice().gross)} brutto`
    }</p>
  `;
}

function paymentSummary(v) {
  if (v.zahlung !== "Kreditkarte") return v.zahlung || "–";
  const last4 = (v.kartennummer || "").replace(/\D/g, "").slice(-4);
  const name = `${v.kartenVorname || ""} ${v.kartenNachname || ""}`.trim();
  return `Kreditkarte ·•••• ${last4 || "––––"} · ${v.kartenAblauf || "––/––"} · ${name} · ${v.kartenEmail || "–"}`;
}

const STATUS_BASE = [
  "Auftrag eingegangen",
  "Unterlagenprüfung",
  "Ident geprüft (Demo)",
  "Zahlung vorgemerkt (Demo)",
  "Bei der Zulassungsstelle (Demo)",
];

let statusTimer = null;

function statusLabels(lieferung) {
  const last =
    lieferung === "Abholung"
      ? "Abholbereit (Demo)"
      : lieferung === "Express"
        ? "Expressversand vorbereitet (Demo)"
        : lieferung === "Versand"
          ? "Versand vorbereitet (Demo)"
          : "Abschluss (Demo)";
  return [...STATUS_BASE, last];
}

function renderStatus(index, lieferung) {
  const labels = statusLabels(lieferung);
  document.getElementById("status-list").innerHTML = labels
    .map((label, i) => {
      const state = i < index ? "is-done" : i === index ? "is-active" : "";
      return `<li class="${state}">${label}</li>`;
    })
    .join("");
}

function startStatusDemo(lieferung) {
  clearInterval(statusTimer);
  let index = 0;
  const labels = statusLabels(lieferung);
  renderStatus(0, lieferung);
  statusTimer = setInterval(() => {
    index = Math.min(index + 1, labels.length - 1);
    renderStatus(index, lieferung);
    if (index >= labels.length - 1) clearInterval(statusTimer);
  }, 2200);
}

function saveAuftrag() {
  const values = formData();
  const digits = (values.kartennummer || "").replace(/\D/g, "");
  const payload = {
    ...values,
    kartennummer: digits ? `•••• ${digits.slice(-4)}` : "",
    kartencode: "",
    fotos: Object.fromEntries(ALL_PHOTO_KEYS.map(([key]) => [key, Boolean(photos[key])])),
    preis: currentPrice(),
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  document.getElementById("auftrag-form").hidden = true;
  document.getElementById("wizard-status").hidden = true;
  document.querySelector(".steps").hidden = true;
  const done = document.getElementById("done");
  done.hidden = false;
  const ref = payload.savedAt.slice(0, 16).replace("T", " ");
  document.getElementById("done-text").textContent =
    `${payload.vorgang} für ${payload.name} · ${payload.lieferung || "ohne Lieferung"} · ${payload.zahlung || "ohne Zahlung"} (Demo) · ${priceLabel(payload.preis)} · Referenz: ${ref}`;
  startStatusDemo(payload.lieferung);
}

function clearPhotos() {
  ALL_PHOTO_KEYS.forEach(([key]) => {
    if (photos[key]) URL.revokeObjectURL(photos[key]);
    delete photos[key];
    const preview = document.querySelector(`[data-preview="${key}"]`);
    if (preview) {
      preview.removeAttribute("src");
      preview.hidden = true;
    }
    const input = document.querySelector(`[data-photo="${key}"]`);
    if (input) {
      input.value = "";
      input.closest(".photo-card").querySelector("[data-photo-label]").textContent =
        "Fotografieren";
    }
    const checks = document.querySelector(`[data-checks="${key}"]`);
    if (checks) checks.hidden = true;
  });
}

function resetWizard() {
  localStorage.removeItem(STORAGE_KEY);
  clearPhotos();
  document.getElementById("auftrag-form").reset();
  document.getElementById("auftrag-form").hidden = false;
  document.getElementById("wizard-status").hidden = false;
  document.querySelector(".steps").hidden = false;
  document.getElementById("done").hidden = true;
  lastUnterlagenVorgang = "";
  document.getElementById("unterlagen-list").innerHTML = "";
  clearInterval(statusTimer);
  toggleKartenFelder();
  toggleVersandFelder();
  updateStelle();
  showHome();
}

function toggleKartenFelder() {
  const card = document.querySelector('input[name="zahlung"][value="Kreditkarte"]');
  document.getElementById("karten-felder").hidden = !card?.checked;
}

function toggleVersandFelder() {
  const lieferung = formData().lieferung;
  const ship = lieferung === "Versand" || lieferung === "Express";
  document.getElementById("versand-felder").hidden = !ship;
  const street = document.querySelector('[name="strasse"]');
  const fromHalter = document.querySelector('[name="anschrift"]')?.value?.trim();
  if (ship && street && !street.value.trim() && fromHalter) {
    street.value = fromHalter;
  }
  const hint = document.getElementById("liefer-hint");
  if (lieferung === "Abholung") {
    hint.textContent = "Abholung an der angezeigten Zulassungsstelle. In der Demo kein echter Termin.";
  } else if (lieferung === "Express") {
    hint.textContent = "Express nur dargestellt. Es geht kein Paket raus.";
  } else if (lieferung === "Versand") {
    hint.textContent = "Versandadresse für die Demo. Es wird nichts verschickt.";
  } else {
    hint.textContent = "In der Demo wird nichts verschickt und kein Termin bei der Behörde gebucht.";
  }
}

document.querySelectorAll('input[name="zahlung"]').forEach((input) => {
  input.addEventListener("change", toggleKartenFelder);
});

document.querySelectorAll('input[name="lieferung"]').forEach((input) => {
  input.addEventListener("change", toggleVersandFelder);
});

document.querySelectorAll('input[name="vorgang"]').forEach((input) => {
  input.addEventListener("change", () => {
    lastUnterlagenVorgang = "";
    updateVorgangUi();
  });
});

document.querySelector('[name="plz"]')?.addEventListener("input", (event) => {
  event.target.value = event.target.value.replace(/\D/g, "").slice(0, 5);
  updateStelle();
});

document.querySelector('[name="stadt"]')?.addEventListener("input", updateStelle);

document.querySelector('[name="kartennummer"]')?.addEventListener("input", (event) => {
  const digits = event.target.value.replace(/\D/g, "").slice(0, 16);
  event.target.value = digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
});

document.querySelector('[name="kartenAblauf"]')?.addEventListener("input", (event) => {
  const digits = event.target.value.replace(/\D/g, "").slice(0, 4);
  event.target.value = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
});

document.querySelector('[name="kartencode"]')?.addEventListener("input", (event) => {
  event.target.value = event.target.value.replace(/\D/g, "").slice(0, 4);
});

document.querySelectorAll('input[name="ausweis"]').forEach((input) => {
  input.addEventListener("change", updateIdentLabels);
});

document.querySelectorAll("[data-photo]").forEach((input) => {
  input.addEventListener("change", () => {
    const key = input.dataset.photo;
    const file = input.files?.[0];
    if (!file) return;
    if (photos[key]) URL.revokeObjectURL(photos[key]);
    photos[key] = URL.createObjectURL(file);
    const preview = document.querySelector(`[data-preview="${key}"]`);
    preview.src = photos[key];
    preview.alt = ALL_PHOTO_KEYS.find(([id]) => id === key)?.[1] || "";
    preview.hidden = false;
    input.closest(".photo-card").querySelector("[data-photo-label]").textContent = "Foto ersetzen";
    const checks = document.querySelector(`[data-checks="${key}"]`);
    if (checks) checks.hidden = false;
  });
});

function simulatePayment() {
  if (currentPrice().gross === 0) return Promise.resolve();
  const values = formData();
  const overlay = document.getElementById("pay-overlay");
  const title = {
    PayPal: "PayPal wird geöffnet (Demo)",
    Klarna: "Klarna wird geöffnet (Demo)",
    Kreditkarte: "Kartenzahlung wird geprüft (Demo)",
    Überweisung: "Überweisung wird vorgemerkt (Demo)",
  };
  document.getElementById("pay-overlay-title").textContent =
    title[values.zahlung] || "Zahlung wird vorbereitet (Demo)";
  overlay.hidden = false;
  return new Promise((resolve) => {
    setTimeout(() => {
      overlay.hidden = true;
      resolve();
    }, 1100);
  });
}

document.getElementById("btn-next").addEventListener("click", () => {
  const step = currentPanel();
  if (!validate(step)) return;
  if (step === LAST_STEP) {
    saveAuftrag();
    return;
  }
  if (step === 6) {
    simulatePayment().then(() => {
      renderSummary();
      showPanel(7);
    });
    return;
  }
  if (step === 3 && skipFotos()) {
    showPanel(5);
    return;
  }
  showPanel(step + 1);
});

document.getElementById("btn-back").addEventListener("click", () => {
  document.getElementById("form-error").hidden = true;
  const step = currentPanel();
  if (step === 5 && skipFotos()) {
    showPanel(3);
    return;
  }
  showPanel(Math.max(1, step - 1));
});

document.getElementById("btn-reset").addEventListener("click", resetWizard);

const APP_PAGES = ["impressum", "preisliste", "agb", "datenschutz", "kontakt"];

let inWizard = false;

function showHome() {
  inWizard = false;
  window.scrollTo(0, 0);
  document.getElementById("home-view").hidden = false;
  document.getElementById("auftrag-view").hidden = true;
  document.getElementById("done").hidden = true;
  document.getElementById("auftrag-form").hidden = false;
  document.getElementById("wizard-status").hidden = false;
  document.querySelector(".steps").hidden = false;
  APP_PAGES.forEach((id) => {
    const view = document.getElementById(`${id}-view`);
    if (view) view.hidden = true;
  });
}

function startAuftrag(vorgang, paket) {
  inWizard = true;
  document.getElementById("home-view").hidden = true;
  document.getElementById("auftrag-view").hidden = false;
  if (vorgang) {
    const radio = document.querySelector(`input[name="vorgang"][value="${vorgang}"]`);
    if (radio) radio.checked = true;
    if (needsPaket(vorgang)) {
      const chosen = paket || "AllInclusive";
      const paketRadio = document.querySelector(`input[name="paket"][value="${chosen}"]`);
      if (paketRadio) paketRadio.checked = true;
    }
    lastUnterlagenVorgang = "";
    updateVorgangUi();
    showPanel(2);
  } else {
    showPanel(1);
  }
}

function showAppPage(page) {
  const legal = Boolean(page);
  document.getElementById("home-view").hidden = legal || inWizard;
  document.getElementById("auftrag-view").hidden = legal || !inWizard;
  APP_PAGES.forEach((id) => {
    const view = document.getElementById(`${id}-view`);
    if (view) view.hidden = page !== id;
  });
}

document.querySelectorAll("[data-page]").forEach((btn) => {
  btn.addEventListener("click", () => showAppPage(btn.dataset.page));
});
document.querySelectorAll("[data-back-app]").forEach((btn) => {
  btn.addEventListener("click", () => showAppPage(null));
});

document.querySelectorAll("[data-start]").forEach((btn) => {
  btn.addEventListener("click", () => startAuftrag(btn.dataset.start, btn.dataset.paket));
});

document.querySelectorAll('input[name="paket"]').forEach((input) => {
  input.addEventListener("change", renderPriceBox);
});

document.getElementById("btn-home")?.addEventListener("click", showHome);

document.getElementById("btn-track")?.addEventListener("click", () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    startAuftrag();
    document.getElementById("form-error").hidden = false;
    document.getElementById("form-error").textContent =
      "Noch kein Auftrag gespeichert. Starte zuerst einen Vorgang.";
    return;
  }
  const payload = JSON.parse(raw);
  inWizard = true;
  document.getElementById("home-view").hidden = true;
  document.getElementById("auftrag-view").hidden = false;
  document.getElementById("auftrag-form").hidden = true;
  document.getElementById("wizard-status").hidden = true;
  document.querySelector(".steps").hidden = true;
  document.getElementById("done").hidden = false;
  document.getElementById("done-text").textContent =
    `${payload.vorgang} für ${payload.name} · ${payload.lieferung || ""} · Referenz ${String(payload.savedAt || "").slice(0, 16).replace("T", " ")}`;
  startStatusDemo(payload.lieferung);
});

document.querySelectorAll('input[name="halterart"]').forEach((input) => {
  input.addEventListener("change", () => {
    document.getElementById("firma-wrap").hidden = formData().halterart !== "Firma";
  });
});

function plateValueFrom(root) {
  const kreis = (root.querySelector('[data-part="kreis"]')?.value || "").trim().toUpperCase();
  const letters = (root.querySelector('[data-part="letters"]')?.value || "").trim().toUpperCase();
  const digits = (root.querySelector('[data-part="digits"]')?.value || "").trim();
  return [kreis, letters, digits].filter(Boolean).join(" ");
}

function homePlateValue() {
  return plateValueFrom(document.getElementById("home-plate-form") || document);
}

function syncWishPlate() {
  const hidden = document.getElementById("wunschkennzeichen");
  const root = document.getElementById("wish-plate");
  if (hidden && root) hidden.value = plateValueFrom(root);
}

function bindPlateWidget(root) {
  if (!root) return;
  root.querySelectorAll("[data-part]").forEach((input) => {
    input.addEventListener("focus", () => {
      root.querySelectorAll("[data-plate-field]").forEach((field) => field.classList.remove("is-active"));
      input.closest("[data-plate-field]")?.classList.add("is-active");
    });
    input.addEventListener("input", () => {
      if (input.dataset.part === "digits") input.value = input.value.replace(/\D/g, "");
      else input.value = input.value.toUpperCase().replace(/[^A-ZÄÖÜ]/g, "");
      if (root.id === "wish-plate") syncWishPlate();
      const max = Number(input.getAttribute("maxlength") || 0);
      if (max && input.value.length >= max) {
        const parts = [...root.querySelectorAll("[data-part]")];
        const next = parts[parts.indexOf(input) + 1];
        next?.focus();
      }
    });
  });
}

bindPlateWidget(document.getElementById("home-plate-form"));
bindPlateWidget(document.getElementById("wish-plate"));

document.getElementById("home-plate-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const plate = homePlateValue().replace(/\s/g, "");
  const out = document.getElementById("home-plate-result");
  out.hidden = false;
  const go = document.getElementById("home-plate-go-wrap");
  if (plate.length < 4) {
    out.textContent = "Bitte Kreis, Buchstaben und Zahl eintragen.";
    if (go) go.hidden = true;
    return;
  }
  const home = document.getElementById("home-plate-form");
  const wishRoot = document.getElementById("wish-plate");
  ["kreis", "letters", "digits"].forEach((part) => {
    const from = home?.querySelector(`[data-part="${part}"]`);
    const to = wishRoot?.querySelector(`[data-part="${part}"]`);
    if (from && to) to.value = from.value;
  });
  syncWishPlate();
  out.textContent = `Demo-Prüfung: ${homePlateValue()} wirkt verfügbar. Keine amtliche Reservierung.`;
  if (go) go.hidden = false;
});

document.querySelectorAll("[data-kreis]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const field = document.getElementById("plate-kreis");
    if (field) field.value = btn.dataset.kreis;
    document.getElementById("wunsch")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

document.querySelectorAll("[data-jump]").forEach((btn) => {
  btn.addEventListener("click", () => {
    showHome();
    document.getElementById(btn.dataset.jump)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

document.getElementById("btn-more-nav")?.addEventListener("click", () => {
  const panel = document.getElementById("more-nav");
  const open = panel.hidden;
  panel.hidden = !open;
  document.getElementById("btn-more-nav").setAttribute("aria-expanded", String(open));
});

document.getElementById("btn-kennzeichen-check")?.addEventListener("click", () => {
  const plate = (formData().wunschkennzeichen || "").replace(/\s/g, "");
  const out = document.getElementById("kennzeichen-check-result");
  out.hidden = false;
  if (plate.length < 4) {
    out.textContent = "Bitte zuerst ein Wunschkennzeichen eintragen.";
    return;
  }
  out.textContent = `Demo-Prüfung: ${plate.toUpperCase()} wirkt verfügbar bei ${formData().stelleName || "der Zulassungsstelle"}. Keine amtliche Reservierung.`;
});

document.getElementById("kontakt-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  document.getElementById("kontakt-ok").hidden = false;
});

function applySiteConfig() {
  const cfg = window.MZ50 || {};
  const brand = cfg.brand || "Mikail-Zulassung50";
  const owner = cfg.owner || "Mikail Seyhan";
  const domain = cfg.domain || "";
  document.querySelectorAll("[data-cfg='owner']").forEach((el) => {
    el.textContent = owner;
  });
  document.querySelectorAll("[data-cfg='brand']").forEach((el) => {
    el.textContent = brand;
  });
  const domainLabel = document.querySelector("[data-cfg='domain-label']");
  if (domainLabel && domain) domainLabel.textContent = `${domain} · Demo`;
  const parts = [cfg.strasse, [cfg.plz, cfg.stadt].filter(Boolean).join(" "), cfg.telefon, cfg.email].filter(Boolean);
  const addr = document.getElementById("impressum-adresse");
  if (addr) {
    addr.textContent = parts.length
      ? parts.join(" · ")
      : "Noch offen: in www/config.js Straße, PLZ, Stadt, Telefon und E-Mail eintragen.";
  }
  const impKontakt = document.getElementById("impressum-kontakt");
  if (impKontakt) impKontakt.textContent = cfg.email ? `${owner} · ${cfg.email}` : `${owner} · Kontaktformular`;
  const ds = document.getElementById("datenschutz-verantwortlicher");
  if (ds) ds.textContent = `${owner}, Anbieter von ${brand}${cfg.email ? ` · ${cfg.email}` : ""}.`;
  const kopf = document.getElementById("kontakt-kopf");
  if (kopf) kopf.textContent = `${owner} · ${brand}`;
  const hinweis = document.getElementById("kontakt-hinweis");
  if (hinweis) {
    hinweis.textContent = cfg.email
      ? `E-Mail: ${cfg.email}. Nachrichten im Formular bleiben zusätzlich auf diesem Gerät.`
      : "Nachrichten bleiben auf diesem Gerät, bis eine E-Mail in config.js steht.";
  }
  const copy = document.querySelector(".footer-copy");
  if (copy) copy.textContent = `© ${new Date().getFullYear()} ${owner} · ${brand}`;
}

applySiteConfig();
toggleKartenFelder();
toggleVersandFelder();
showHome();

(function initNativeShell() {
  const StatusBar = window.Capacitor?.Plugins?.StatusBar;
  if (!StatusBar) return;
  StatusBar.setStyle({ style: "LIGHT" }).catch(() => {});
  StatusBar.setBackgroundColor({ color: "#111111" }).catch(() => {});
})();
