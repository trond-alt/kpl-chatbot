// Seed script for KPL chatbot knowledge base
// Run with: node scripts/seed-knowledge.js

const { createClient } = require("@supabase/supabase-js");
const { readFileSync } = require("fs");
const { resolve } = require("path");

const supabaseUrl = "https://tsubhqyasdkqkgrofjri.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzdWJocXlhc2RrcWtncm9manJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MDI3NjcsImV4cCI6MjA5MDI3ODc2N30.eyvl-oVdlGBsg_dBgVA4anY3uu3qv78i2fomdDF4Igw";
const supabase = createClient(supabaseUrl, supabaseKey);

const moduleCategories = {
  1: "base", 2: "hms", 3: "hms", 4: "hms", 5: "hms",
  6: "kpl2002", 7: "kpl2002", 8: "kpl2001", 9: "kpl2001", 10: "kpl2001",
  11: "kpl2001", 12: "kpl2001", 13: "kpl2001", 14: "kpl2001", 15: "kpl2001",
  16: "kpl2002", 17: "kpl2002", 18: "kpl2002", 19: "kpl2002", 20: "kpl2002",
  21: "kpl2003", 22: "kpl2003", 23: "kpl2003", 24: "kpl2001",
  25: "kpl2003", 26: "kpl2003", 27: "kpl2003", 28: "hms", 29: "base", 30: "base",
};

const moduleNames = {
  1: "Innledning til kjemiprosess- og laboratoriefag",
  2: "HMS og sikkerhetskultur", 3: "Risikovurdering og verneutstyr",
  4: "Avfallshåndtering og bærekraft", 5: "Yrkesetikk og arbeidsliv",
  6: "Grunnleggende kjemi og fysikk i prosess", 7: "Støkiometri og kjemiske beregninger",
  8: "Blokkskjema og flytskjema", 9: "Start- og stopprosedyrer",
  10: "Skjermbaserte styringssystemer (SCADA/DCS)", 11: "Måle-, styre- og reguleringsutstyr",
  12: "Reguleringsprinsipper", 13: "Kontroll og optimalisering",
  14: "Feilkilder og avviksbehandling", 15: "Vedlikehold av utstyr og instrumenter",
  16: "Enhetsoperasjoner og prosessutstyr", 17: "Masse- og energibalanser",
  18: "Varme- og energibalanse", 19: "Trykktap og energiomsetning i rørsystemer",
  20: "Kjemiske reaksjoner i prosess og analyse", 21: "Kjemiske analysemetoder og laboratoriearbeid",
  22: "Kalibrering og systematisk vedlikehold", 23: "Kvalitetssikring og prøvetaking",
  24: "Prosessens helhet", 25: "Analyse og usikkerhet i målinger",
  26: "Miljøtester i nærmiljøet", 27: "Mikrobiologiske preparater og mikroskopi",
  28: "Arbeidsliv og HMS-dokumentasjon", 29: "Egenvurdering og kompetanseutvikling",
  30: "Tverrfaglig prosjektarbeid og eksamensforberedelse",
};

const moduleKeywords = {
  1: ["innledning", "fagterminologi", "kommunikasjon", "prosessindustri"],
  2: ["hms", "sikkerhetskultur", "arbeidsmiljøloven", "internkontroll", "prosedyrer"],
  3: ["risikovurdering", "verneutstyr", "risiko", "sannsynlighet", "konsekvens", "pvu", "sja"],
  4: ["avfall", "bærekraft", "miljø", "resirkulering", "gjenvinning", "forurensning"],
  5: ["yrkesetikk", "arbeidsliv", "rettigheter", "plikter", "inkludering"],
  6: ["kjemi", "fysikk", "temperatur", "trykk", "gass", "gasslov", "faseovergang", "ph"],
  7: ["støkiometri", "mol", "molarmasse", "beregning", "reaksjonsligning", "konsentrasjon"],
  8: ["blokkskjema", "flytskjema", "pid", "p&id", "pfd", "symbol", "forrigling"],
  9: ["oppstart", "nedkjøring", "start", "stopp", "prosedyre", "sjekkliste", "esd"],
  10: ["scada", "dcs", "kontrollrom", "styringssystem", "hmi", "alarm"],
  11: ["måling", "trykkmåling", "temperaturmåling", "nivåmåling", "flowmåling", "transmitter"],
  12: ["regulering", "pid", "p-regulering", "pi-regulering", "tuning", "settpunkt", "kaskade"],
  13: ["kontroll", "optimalisering", "produksjon", "spc", "lean", "variasjon"],
  14: ["feilkilder", "avvik", "feilsøking", "kalibrering", "signalfeil"],
  15: ["vedlikehold", "forebyggende", "tilstandsbasert", "prediktivt"],
  16: ["enhetsoperasjon", "destillasjon", "varmeveksler", "filtrering", "blanding"],
  17: ["massebalanse", "energibalanse", "stasjonær", "beregning"],
  18: ["varmebalanse", "energi", "varmekapasitet", "varmetap"],
  19: ["trykktap", "rørsystem", "bernoulli", "friksjon", "strømning", "reynolds"],
  20: ["reaksjon", "forbrenning", "syre-base", "redoks", "utfelling", "katalysator", "likevekt"],
  21: ["analyse", "titrering", "spektrofotometri", "kvalitativ", "kvantitativ"],
  22: ["kalibrering", "vedlikehold", "sporbarhet", "buffer", "justering"],
  23: ["kvalitetssikring", "prøvetaking", "representativ", "sop", "dokumentasjon"],
  24: ["prosesshelhet", "verdikjede", "enhetsoperasjoner", "sammenheng"],
  25: ["usikkerhet", "måleusikkerhet", "standardavvik", "rapportering"],
  26: ["miljøtest", "vannkvalitet", "luftkvalitet", "miljøovervåking"],
  27: ["mikrobiologi", "mikroskop", "bakterie", "gram-farging", "agar", "preparat"],
  28: ["dokumentasjon", "internkontroll", "kvalitetssystem", "iso", "revisjon"],
  29: ["egenvurdering", "kompetanse", "utvikling", "refleksjon"],
  30: ["prosjektarbeid", "eksamen", "tverrfaglig", "repetisjon"],
};

async function seed() {
  const files = [];

  // Base prompt (extracted from system-prompt.ts)
  const sysPromptFile = readFileSync(resolve(__dirname, "../src/lib/system-prompt.ts"), "utf-8");
  const baseMatch = sysPromptFile.match(/export const SYSTEM_PROMPT = `([\s\S]*?)`;/);
  const examMatch = sysPromptFile.match(/export const EXAM_TRAINING_PROMPT = `([\s\S]*?)`;/);

  files.push({
    id: "base",
    category: "base",
    title: "Grunnleggende instruksjoner",
    keywords: [],
    content: baseMatch ? baseMatch[1] : "Fagassistent for kjemiprosess- og laboratoriefag vg2",
    sort_order: 0,
  });

  files.push({
    id: "base-exam",
    category: "base",
    title: "Eksamenstrening-modus",
    keywords: ["eksamen", "eksamenstrening", "øving", "prøve"],
    content: examMatch ? examMatch[1] : "Eksamenstrening for KPL",
    sort_order: 1,
  });

  // Module files from extracted text
  const knowledgeDir = "C:\\tmp\\kpl_knowledge";
  for (let i = 1; i <= 30; i++) {
    try {
      const content = readFileSync(resolve(knowledgeDir, `modul_${i}.txt`), "utf-8");
      files.push({
        id: `modul-${i}`,
        category: moduleCategories[i] || "base",
        title: `Modul ${i}: ${moduleNames[i] || ""}`,
        keywords: moduleKeywords[i] || [],
        content: content.substring(0, 15000),
        sort_order: i + 10,
      });
    } catch {
      console.log(`Skipping modul ${i} - file not found`);
    }
  }

  // Formler
  files.push({
    id: "formler",
    category: "formler",
    title: "Formler og beregninger",
    keywords: ["formel", "beregning", "mol", "konsentrasjon", "trykk", "ph", "massebalanse", "energi"],
    content: `## Viktige formler\n\n### Molberegninger\nn = m/M, m = n×M, c = n/V, c1V1 = c2V2\n\n### Gasslov\npV = nRT (p=Pa, V=m³, n=mol, R=8.314, T=K)\nMolarvolum STP: 22.4 L/mol\n\n### Trykk\np = ρgh\n\n### pH\npH = -log[H3O+], pH + pOH = 14\n\n### Varme\nQ = mcΔT\n\n### Massebalanse\nInn = Ut (stasjonær)\n\n### Strømning\nBernoulli: p1 + ½ρv1² + ρgh1 = p2 + ½ρv2² + ρgh2\nKontinuitet: A1v1 = A2v2\nReynolds: Re = ρvd/μ (laminær<2300, turbulent>4000)\n\n### Utbytte\n% = (faktisk/teoretisk) × 100\n\n### Titrering\nc1V1 = c2V2 (ekvivalenspunktet)`,
    sort_order: 5,
  });

  // Ordliste
  files.push({
    id: "ordliste",
    category: "ordliste",
    title: "Fagterminologi norsk/engelsk",
    keywords: ["ordliste", "terminologi", "oversettelse", "fagord", "engelsk"],
    content: `## Fagterminologi norsk/engelsk\n\nTrykkmåler/Pressure transmitter, Temperatursensor/Temperature transmitter, Reguleringsventil/Control valve, Settpunkt/Setpoint, Varmeveksler/Heat exchanger, Destillasjonskolonne/Distillation column, Reaktor/Reactor, Pumpe/Pump, Molarmasse/Molar mass, Stoffmengde/Amount of substance, Konsentrasjon/Concentration, Syre/Acid, Base/Base, Katalysator/Catalyst, Likevekt/Equilibrium, Risikovurdering/Risk assessment, Sikkerhetsdatablad/SDS, Verneutstyr/PPE, Titrering/Titration, Pipette/Pipette, Byrette/Burette, Kalibrering/Calibration, Prøvetaking/Sampling`,
    sort_order: 6,
  });

  console.log(`Seeding ${files.length} knowledge files...`);

  for (const file of files) {
    const { error } = await supabase
      .from("knowledge_files")
      .upsert(file, { onConflict: "id" });

    if (error) {
      console.error(`✗ ${file.id}: ${error.message}`);
    } else {
      console.log(`✓ ${file.id} (${file.content.length} chars)`);
    }
  }

  console.log("\nDone!");
}

seed().catch(console.error);
