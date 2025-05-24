

import type { AbilityKey, BaseRaceDetail, BaseClassDetail, BaseBackgroundDetail, AbilityScores, SkillProficiencyChoice, Spell, SpellcastingDefinition, PactMagicDefinition, ItemProperty, Shopkeeper, ShopItemStock, FeatDetail, Enemy } from './types';

export enum Screen {
  Welcome,
  ExperienceLevel,
  CharacterCreation,
  LoadGame,
  Game,
}

export const APP_TITLE = "Maestro de Mazmorras Digital";
export const LOCAL_STORAGE_CHARACTER_KEY = "ddm_character";
export const DEFAULT_UNARMORED_AC_BASE = 10;
export const ADVENTURE_START_NODE_ID = "intro"; // ID del primer nodo de la aventura

export const STANDARD_ABILITY_SCORES: readonly number[] = Object.freeze([15, 14, 13, 12, 10, 8]);

export interface AbilityDetail {
  key: AbilityKey;
  name: string;
  description: string;
}

export const ABILITIES: readonly AbilityDetail[] = Object.freeze([
  { key: 'str', name: 'Fuerza (FUE)', description: 'Poder físico, proeza atlética.' },
  { key: 'dex', name: 'Destreza (DES)', description: 'Agilidad, reflejos, equilibrio, finura.' },
  { key: 'con', name: 'Constitución (CON)', description: 'Salud, aguante, fuerza vital.' },
  { key: 'int', name: 'Inteligencia (INT)', description: 'Razonamiento, memoria, habilidad analítica.' },
  { key: 'wis', name: 'Sabiduría (SAB)', description: 'Percepción, intuición, perspicacia.' },
  { key: 'cha', name: 'Carisma (CAR)', description: 'Fuerza de personalidad, influencia social.' },
]);

export const MAX_ABILITY_REROLLS = 3;

export const getAverageHitDieValue = (hitDie: number): number => {
  return Math.floor(hitDie / 2) + 1; 
};

export const XP_THRESHOLDS_PER_LEVEL: readonly number[] = Object.freeze([
  0,    // Nivel 0 (no existe)
  0,    // Nivel 1
  300,  // Nivel 2
  900,  // Nivel 3
  2700, // Nivel 4
  6500, // Nivel 5
  14000, // Nivel 6
  23000, // Nivel 7
  34000, // Nivel 8
  48000, // Nivel 9
  64000, // Nivel 10
  // D&D 5e standard progression continues...
  85000,  // Level 11
  100000, // Level 12
  120000, // Level 13
  140000, // Level 14
  165000, // Level 15
  195000, // Level 16
  225000, // Level 17
  265000, // Level 18
  305000, // Level 19
  355000  // Level 20
]);


export const ITEMS_DATA: Record<string, ItemProperty> = {
  "Daga": { name: "Daga", type: 'weapon', value: 2, damageDice: "1d4", damageType: "Perforante", properties: ["finesse", "light", "thrown (range 20/60)"], attackAbility: 'dex', weight: 1 },
  "Maza": { name: "Maza", type: 'weapon', value: 5, damageDice: "1d6", damageType: "Contundente", weight: 4 },
  "Hacha de Mano": { name: "Hacha de Mano", type: 'weapon', value: 5, damageDice: "1d6", damageType: "Cortante", properties: ["light", "thrown (range 20/60)"], weight: 2 },
  "Jabalina": { name: "Jabalina", type: 'weapon', value: 1, damageDice: "1d6", damageType: "Perforante", properties: ["thrown (range 30/120)"], weight: 2 },
  "Espada Corta": { name: "Espada Corta", type: 'weapon', value: 10, damageDice: "1d6", damageType: "Perforante", properties: ["finesse", "light"], attackAbility: 'dex', weight: 2 },
  "Espada Larga": { name: "Espada Larga", type: 'weapon', value: 15, damageDice: "1d8", damageType: "Cortante", properties: ["versatile (1d10)"], weight: 3 },
  "Hacha de Batalla": { name: "Hacha de Batalla", type: 'weapon', value: 10, damageDice: "1d8", damageType: "Cortante", properties: ["versatile (1d10)"], weight: 4 },
  "Martillo de Guerra": { name: "Martillo de Guerra", type: 'weapon', value: 15, damageDice: "1d8", damageType: "Contundente", properties: ["versatile (1d10)"], weight: 2 },
  "Estoque": { name: "Estoque", type: 'weapon', value: 25, damageDice: "1d8", damageType: "Perforante", properties: ["finesse"], attackAbility: 'dex', weight: 2 },
  "Arco Corto": { name: "Arco Corto", type: 'weapon', value: 25, damageDice: "1d6", damageType: "Perforante", properties: ["ammunition (range 80/320)", "two-handed"], attackAbility: 'dex', weight: 2 },
  "Arco Largo": { name: "Arco Largo", type: 'weapon', value: 50, damageDice: "1d8", damageType: "Perforante", properties: ["ammunition (range 150/600)", "heavy", "two-handed"], attackAbility: 'dex', weight: 2 },
  "Ballesta Ligera": { name: "Ballesta Ligera", type: 'weapon', value: 25, damageDice: "1d8", damageType: "Perforante", properties: ["ammunition (range 80/320)", "loading", "two-handed"], attackAbility: 'dex', weight: 5 },
  
  "Armadura Acolchada": { name: "Armadura Acolchada", type: 'armor', value: 5, acBonus: 11, addDexModifier: true, stealthDisadvantage: true, weight: 8 },
  "Armadura de Cuero": { name: "Armadura de Cuero", type: 'armor', value: 10, acBonus: 11, addDexModifier: true, weight: 10 },
  "Armadura de Cuero Tachonado": { name: "Armadura de Cuero Tachonado", type: 'armor', value: 45, acBonus: 12, addDexModifier: true, weight: 13 },
  "Armadura de Pieles": { name: "Armadura de Pieles", type: 'armor', value: 10, acBonus: 12, addDexModifier: true, maxDexBonus: 2, weight: 12 },
  "Cota de Escamas": { name: "Cota de Escamas", type: 'armor', value: 50, acBonus: 14, addDexModifier: true, maxDexBonus: 2, stealthDisadvantage: true, weight: 45 },
  "Coraza": { name: "Coraza", type: 'armor', value: 400, acBonus: 14, addDexModifier: true, maxDexBonus: 2, weight: 20 },
  "Cota de Malla": { name: "Cota de Malla", type: 'armor', value: 75, acBonus: 16, requiredStrength: 13, stealthDisadvantage: true, weight: 55 },
  "Armadura de Placas": { name: "Armadura de Placas", type: 'armor', value: 1500, acBonus: 18, requiredStrength: 15, stealthDisadvantage: true, weight: 65 },

  "Escudo": { name: "Escudo", type: 'shield', value: 10, acBonus: 2, weight: 6 },

  "Poción de Curación": { name: "Poción de Curación", type: 'potion', value: 50, description: "Recuperas 2d4+2 Puntos de Golpe al beber esta poción.", effects: [{ type: 'heal', amount: '2d4+2' }], weight: 0.5 },
  "Poción de Curación Menor": { name: "Poción de Curación Menor", type: 'potion', value: 25, description: "Recuperas 1d4+1 Puntos de Golpe al beber esta poción.", effects: [{ type: 'heal', amount: '1d4+1' }], weight: 0.5 },
  "Poción de Curación Mayor": { name: "Poción de Curación Mayor", type: 'potion', value: 250, description: "Recuperas 4d4+4 Puntos de Golpe.", effects: [{ type: 'heal', amount: '4d4+4' }], weight: 0.5 },

  "Paquete de Explorador": { name: "Paquete de Explorador", type: 'misc', value: 10, description: "Incluye una mochila, saco de dormir, raciones, etc.", weight: 59 },
  "Paquete de Mazmorreo": { name: "Paquete de Mazmorreo", type: 'misc', value: 12, description: "Incluye una mochila, palanca, martillo, etc.", weight: 61},
  "Paquete de Sacerdote": { name: "Paquete de Sacerdote", type: 'misc', value: 19, description: "Incluye una mochila, manta, velas, etc.", weight: 25},
  "Paquete de Erudito": { name: "Paquete de Erudito", type: 'misc', value: 40, description: "Incluye una mochila, libro de sabiduría, tinta, etc.", weight: 11},
  "Símbolo Sagrado": { name: "Símbolo Sagrado", type: 'misc', value: 5, description: "Un símbolo de tu deidad.", weight: 1},
  "Antorcha": { name: "Antorcha", type: 'misc', value: 0.01, description: "Una antorcha que ilumina durante 1 hora.", weight: 1},
  "Raciones (1 día)": { name: "Raciones (1 día)", type: 'misc', value: 0.5, description: "Comida y agua para un día.", weight: 2},
  "Cuerda (50 pies)": { name: "Cuerda (50 pies)", type: 'misc', value: 1, description: "50 pies de cuerda de cáñamo.", weight: 10},
  "Mochila": { name: "Mochila", type: 'misc', value: 2, description: "Una mochila para llevar tus cosas.", weight: 5},
  "Virotes (20)": { name: "Virotes (20)", type: 'misc', value: 1, description: "Veinte virotes para ballesta.", weight: 1.5 },
  "Flechas (20)": { name: "Flechas (20)", type: 'misc', value: 1, description: "Veinte flechas para arco.", weight: 1 },
  "Herramientas de Ladrón": { name: "Herramientas de Ladrón", type: 'misc', value: 25, description: "Un juego de ganzúas, pequeñas limas, etc.", weight: 1 },
  "Bolsa de Componentes": { name: "Bolsa de Componentes", type: 'misc', value: 25, description: "Una pequeña bolsa impermeable que contiene los componentes materiales para tus conjuros.", weight: 2 },
  "Piel de Lobo": { name: "Piel de Lobo", type: 'misc', value: 2, description: "La piel de un lobo, útil para artesanía o venta.", weight: 3 },
};

export const FEATS_DATA: Record<string, FeatDetail> = {
  'adepto_marcial': { id: 'adepto_marcial', name: 'Adepto Marcial', description: 'Ganas competencia con cuatro armas de tu elección. Ganas una maniobra de Maestro de Batalla y un dado de superioridad (d6).' },
  'alerta': { id: 'alerta', name: 'Alerta', description: '+5 a la iniciativa, no puedes ser sorprendido mientras estés consciente, otras criaturas no ganan ventaja en tiradas de ataque contra ti como resultado de estar ocultas.'},
  'afortunado': { id: 'afortunado', name: 'Afortunado', description: 'Tienes 3 puntos de suerte. Puedes gastar un punto para repetir cualquier tirada de ataque, prueba de característica o tirada de salvación tuya o de otra criatura.'},
  'observador': { id: 'observador', name: 'Observador', description: '+1 a Inteligencia o Sabiduría. Lees los labios. +5 a tus puntuaciones pasivas de Percepción e Investigación.'}
};


export const SPELLS_DATA: Record<string, Spell> = {
  "Luz": { name: "Luz", level: 0, description: "Un objeto emite luz brillante.", school: "Evocación" },
  "Mano de Mago": { name: "Mano de Mago", level: 0, description: "Creas una mano espectral flotante.", school: "Conjuración" },
  "Explosión Sobrenatural": { name: "Explosión Sobrenatural", level: 0, description: "Un rayo de energía crepitante impacta a un objetivo.", school: "Evocación", damageDice: "1d10", damageType: "Fuerza", range: "120 pies" },
  "Taumaturgia": { name: "Taumaturgia", level: 0, description: "Manifiestas un pequeño prodigio mágico.", school: "Transmutación" },
  "Llama Sagrada": { name: "Llama Sagrada", level: 0, description: "Una llama desciende sobre una criatura, ignorando cobertura.", school: "Evocación", damageDice: "1d8", damageType: "Radiante" },
  "Toque Helado": { name: "Toque Helado", level: 0, description: "Una mano esquelética fantasmal te agarra. Haz un ataque de conjuro a distancia. Con un impacto, el objetivo recibe 1d8 de daño necrótico y no puede recuperar puntos de golpe hasta el inicio de tu siguiente turno.", school: "Necromancia", damageDice: "1d8", damageType: "Necrótico", range: "120 pies" },
  "Curar Heridas": { name: "Curar Heridas", level: 1, description: "Restauras Puntos de Golpe a una criatura que tocas.", school: "Evocación", healingDice: "1d8" },
  "Escudo de Fe": { name: "Escudo de Fe", level: 1, description: "Una criatura gana +2 a la CA.", school: "Abjuración", duration: "Concentración, hasta 10 minutos" },
  "Mandato": { name: "Mandato", level: 1, description: "Das una orden de una palabra a una criatura.", school: "Encantamiento" },
  "Maleficio": { name: "Maleficio", level: 1, description: "Maldices a una criatura para que reciba daño extra de tus ataques y tenga desventaja en un tipo de prueba de característica.", school: "Encantamiento", damageDice: "1d6", damageType: "Necrótico (extra en ataques)" },
  "Armadura de Agathys": { name: "Armadura de Agathys", level: 1, description: "Ganas 5 PG temporales y causas 5 de daño de frío a quien te golpee cuerpo a cuerpo.", school: "Abjuración", damageDice: "5", damageType: "Frío (reactivo)" },
  "Proyectil Mágico": { name: "Proyectil Mágico", level: 1, description: "Creas tres dardos de energía mágica que impactan automáticamente.", school: "Evocación", damageDice: "1d4+1", damageType: "Fuerza (por dardo)"},
  "Dormir": { name: "Dormir", level: 1, description: "Pones a dormir a criaturas, empezando por las de menos PG.", school: "Encantamiento" },
  "Bendición": { name: "Bendición", level: 1, description: "Hasta tres criaturas de tu elección tienen un bonificador de 1d4 a las tiradas de ataque y de salvación.", school: "Encantamiento"},
  "Favor Divino": { name: "Favor Divino", level: 1, description: "Tus ataques con arma infligen 1d4 de daño radiante extra.", school: "Evocación", damageDice: "1d4", damageType: "Radiante (extra en ataques con arma)"},
  "Golpe Atronador": { name: "Golpe Atronador", level: 1, description: "La primera vez que impactes con un ataque con arma cuerpo a cuerpo, infliges 2d6 de daño de trueno extra y el objetivo debe hacer una salvación de Fuerza o ser empujado 10 pies y caer tumbado.", school: "Evocación"},
  "Golpe Colérico": { name: "Golpe Colérico", level: 1, description: "La primera vez que impactes con un ataque con arma cuerpo a cuerpo, infliges 1d6 de daño psíquico extra y el objetivo debe hacer una salvación de Sabiduría o quedar asustado de ti hasta el final de tu siguiente turno.", school: "Evocación"},
  "Detectar Magia": { name: "Detectar Magia", level: 1, description: "Sientes la presencia de magia a 30 pies de ti.", school: "Adivinación"},
  "Detectar Veneno y Enfermedad": { name: "Detectar Veneno y Enfermedad", level: 1, description: "Sientes la presencia de venenos, criaturas venenosas y enfermedades a 30 pies de ti.", school: "Adivinación"},
  "Detectar el Bien y el Mal": { name: "Detectar el Bien y el Mal", level: 1, description: "Conoces la localización de cualquier aberración, celestial, elemental, feérico, infernal o muerto viviente a 30 pies de ti, así como cualquier lugar u objeto consagrado o profanado.", school: "Adivinación"},
  "Protección contra el Bien y el Mal": { name: "Protección contra el Bien y el Mal", level: 1, description: "Una criatura voluntaria que toques tiene protección contra ciertos tipos de criaturas.", school: "Abjuración"},
  "Purificar Comida y Bebida": { name: "Purificar Comida y Bebida", level: 1, description: "Toda la comida y bebida no mágica en una esfera de 5 pies de radio se purifica y se vuelve libre de veneno y enfermedad.", school: "Transmutación"},
  "Brazos de Hadar": { name: "Brazos de Hadar", level: 1, description: "Invocas tentáculos oscuros que infligen 2d6 de daño necrótico a las criaturas a tu alrededor y reducen su velocidad.", school: "Conjuración"},
  "Hechizar Persona": { name: "Hechizar Persona", level: 1, description: "Hechizas a un humanoide.", school: "Encantamiento"},
  "Reprensión Infernal": { name: "Reprensión Infernal", level: 1, description: "Como reacción cuando recibes daño, el atacante es consumido por llamas infernales, recibiendo 2d10 de daño de fuego.", school: "Evocación"},
  "Comprensión Idiomas": { name: "Comprensión Idiomas", level: 1, description: "Comprendes el significado literal de cualquier idioma hablado que escuches. También entiendes cualquier idioma escrito que toques.", school: "Adivinación"},
  "Retirada Expeditiva": { name: "Retirada Expeditiva", level: 1, description: "Te permite realizar la acción de Correr como una acción bonificada en cada uno de tus turnos.", school: "Transmutación"},
  "Sirviente Invisible": { name: "Sirviente Invisible", level: 1, description: "Creas una fuerza invisible que realiza tareas simples a tus órdenes.", school: "Conjuración"},
};


const PALADIN_SPELLCASTING: SpellcastingDefinition = {
  spellAbility: 'cha',
  slotProgressionTable: [ 
    [0,0,0,0,0], // Nivel 1 Paladín no tiene espacios
    [2,0,0,0,0], // Nivel 2 Paladín: 2 espacios de nivel 1
    [3,0,0,0,0], // Nivel 3 Paladín: 3 espacios de nivel 1
    [3,0,0,0,0], // Nivel 4 Paladín: 3 espacios de nivel 1
    [4,2,0,0,0], // Nivel 5 Paladín: 4 de nivel 1, 2 de nivel 2
  ],
  preparationSlots: (paladinLevel: number, chaMod: number) => Math.max(1, chaMod + Math.floor(paladinLevel / 2)),
  spellList: Object.keys(SPELLS_DATA).filter(key => {
    const spell = SPELLS_DATA[key];
    return spell.level === 1 && (spell.school === "Evocación" || spell.school === "Abjuración" || spell.school === "Adivinación" || spell.school === "Encantamiento" || spell.name.includes("Golpe") || spell.name === "Bendición" || spell.name === "Mandato" || spell.name === "Escudo de Fe" || spell.name === "Favor Divino" || spell.name === "Detectar Magia" || spell.name === "Curar Heridas");
  }),
};

const WARLOCK_PACT_MAGIC: PactMagicDefinition = {
  spellAbility: 'cha',
  slotsAtLevel: (charLevel: number) => {
    if (charLevel >= 11) return 3; // Ejemplo, la tabla real de Brujo es más compleja y tiene Invocaciones
    if (charLevel >= 2) return 2;
    if (charLevel >= 1) return 1;
    return 0;
  },
  slotLevelAtLevel: (charLevel: number) => {
    if (charLevel >= 9) return 5;
    if (charLevel >= 7) return 4;
    if (charLevel >= 5) return 3;
    if (charLevel >= 3) return 2;
    if (charLevel >= 1) return 1;
    return 0;
  }, 
  knownCantripsAtLevel: (charLevel: number) => (charLevel >= 10 ? 4 : charLevel >= 4 ? 3 : charLevel >=1 ? 2: 0),
  knownSpellsAtLevel: (charLevel: number) => { // Esto es solo un ejemplo simplificado
      if (charLevel >= 9) return 10;
      if (charLevel >= 8) return 9;
      if (charLevel >= 7) return 8;
      if (charLevel >= 6) return 7;
      if (charLevel >= 5) return 6;
      if (charLevel >= 4) return 5;
      if (charLevel >= 3) return 4;
      if (charLevel >= 2) return 3;
      // FIX: Corrected if statement. Was `if (charLevel >=1 ? 2 : 0);` which is an empty statement.
      // Changed to `if (charLevel >= 1) return 2;` to fit the pattern.
      if (charLevel >= 1) return 2;
      return 0;
  }, 
  spellList: Object.keys(SPELLS_DATA).filter(key => SPELLS_DATA[key].level <=5 && (SPELLS_DATA[key].school === "Encantamiento" || SPELLS_DATA[key].school === "Evocación" || SPELLS_DATA[key].school === "Abjuración" || SPELLS_DATA[key].school === "Conjuración" || SPELLS_DATA[key].school === "Ilusión" || SPELLS_DATA[key].school === "Necromancia" || SPELLS_DATA[key].school === "Transmutación" || SPELLS_DATA[key].name === "Explosión Sobrenatural" || SPELLS_DATA[key].name === "Toque Helado")),
};

export const ALL_RACES_ADVANCED: readonly BaseRaceDetail[] = Object.freeze([
  { name: 'Humano', abilityBonuses: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 }, features: ['Versátil'], description: 'Adaptables y ambiciosos, los humanos se encuentran en todas partes.', skillProficiencies: ['Elige una habilidad adicional'] },
  { name: 'Elfo (Alto)', abilityBonuses: { dex: 2, int: 1 }, features: ['Visión en la Oscuridad', 'Linaje Feérico', 'Trance', 'Truco de Mago adicional'], weaponProficiencies: ['Espada Larga', 'Espada Corta', 'Arco Largo', 'Arco Corto'], skillProficiencies: ['Percepción'], description: 'Gráciles y mágicos, con una mente aguda y amor por el conocimiento arcano.' },
  { name: 'Elfo (del Bosque)', abilityBonuses: { dex: 2, wis: 1 }, features: ['Visión en la Oscuridad', 'Linaje Feérico', 'Trance', 'Pies Ligeros', 'Máscara de la Espesura'], weaponProficiencies: ['Espada Larga', 'Espada Corta', 'Arco Largo', 'Arco Corto'], skillProficiencies: ['Percepción'], description: 'Ágiles y sigilosos, en armonía con la naturaleza.' },
  { name: 'Enano (de las Colinas)', abilityBonuses: { con: 2, wis: 1 }, features: ['Visión en la Oscuridad', 'Resistencia Enana', 'Entrenamiento de Combate Enano', 'Fortaleza Enana'], weaponProficiencies: ['Hacha de Batalla', 'Hacha de Mano', 'Martillo Ligero', 'Martillo de Guerra'], description: 'Resistentes y sabios, con una fuerte conexión con sus clanes.' },
  { name: 'Enano (de las Montañas)', abilityBonuses: { con: 2, str: 2 }, features: ['Visión en la Oscuridad', 'Resistencia Enana', 'Entrenamiento de Combate Enano'], weaponProficiencies: ['Hacha de Batalla', 'Hacha de Mano', 'Martillo Ligero', 'Martillo de Guerra'], armorProficiencies: ['Armadura Ligera', 'Armadura Media'], description: 'Fuertes y valientes, acostumbrados a la vida en las montañas escarpadas.' },
  { name: 'Mediano (Piesligeros)', abilityBonuses: { dex: 2, cha: 1 }, features: ['Suerte', 'Valentía', 'Agilidad de Mediano', 'Sigiloso por Naturaleza'], description: 'Alegres y amigables, con una habilidad natural para pasar desapercibidos.' },
  { name: 'Dracónido', abilityBonuses: { str: 2, cha: 1 }, features: ['Herencia Dracónica (elegir tipo)', 'Arma de Aliento', 'Resistencia a Daño (según tipo)'], description: 'Orgullosos y honorables, con la sangre de los dragones corriendo por sus venas.' },
  { name: 'Tiefling', abilityBonuses: { int: 1, cha: 2 }, features: ['Visión en la Oscuridad', 'Resistencia Infernal (fuego)', 'Legado Infernal (Taumaturgia; Fuego Feérico N3; Oscuridad N5)'], description: 'Marcados por un linaje infernal, poseen un carisma inquietante y habilidades arcanas.' },
]);

const DEFAULT_ASI_LEVELS = [4, 8, 12, 16, 19];

export const ALL_CLASSES_ADVANCED: readonly BaseClassDetail[] = Object.freeze([
  { 
    name: 'Guerrero', hitDie: 10, primaryAbility: ['str', 'dex'], savingThrows: ['str', 'con'], 
    multiclassRequirements: { str: 13, dex: 13 }, 
    startingEquipment: ['Cota de Malla', 'Espada Larga', 'Escudo', 'Ballesta Ligera', 'Virotes (20)', 'Paquete de Mazmorreo'],
    armorProficiencies: ["Todas las Armaduras", "Escudos"],
    weaponProficiencies: ["Armas Sencillas", "Armas Marciales"],
    skillProficiencyOptions: { options: ['Acrobacias', 'Trato con Animales', 'Atletismo', 'Historia', 'Perspicacia', 'Intimidación', 'Percepción', 'Supervivencia'], count: 2 },
    asiLevels: [4, 6, 8, 12, 14, 16, 19] 
  },
  { 
    name: 'Paladín', hitDie: 10, primaryAbility: ['str', 'cha'], savingThrows: ['wis', 'cha'], 
    multiclassRequirements: { str: 13, cha: 13 }, 
    startingEquipment: ['Cota de Malla', 'Espada Larga', 'Escudo', 'Jabalina', 'Jabalina', 'Jabalina', 'Jabalina', 'Jabalina', 'Paquete de Explorador', 'Símbolo Sagrado'],
    armorProficiencies: ["Todas las Armaduras", "Escudos"],
    weaponProficiencies: ["Armas Sencillas", "Armas Marciales"],
    skillProficiencyOptions: { options: ['Atletismo', 'Perspicacia', 'Intimidación', 'Medicina', 'Persuasión', 'Religión'], count: 2 },
    spellcasting: PALADIN_SPELLCASTING,
    asiLevels: DEFAULT_ASI_LEVELS,
  },
  { 
    name: 'Brujo', hitDie: 8, primaryAbility: ['cha'], savingThrows: ['wis', 'cha'], 
    multiclassRequirements: { cha: 13 }, 
    startingEquipment: ['Armadura de Cuero', 'Ballesta Ligera', 'Virotes (20)', 'Daga', 'Daga', 'Bolsa de Componentes', 'Paquete de Erudito'],
    armorProficiencies: ["Armadura Ligera"],
    weaponProficiencies: ["Armas Sencillas"],
    skillProficiencyOptions: { options: ['Arcanos', 'Engaño', 'Historia', 'Intimidación', 'Investigación', 'Naturaleza', 'Religión'], count: 2 },
    pactMagic: WARLOCK_PACT_MAGIC,
    asiLevels: DEFAULT_ASI_LEVELS,
  },
  { 
    name: 'Pícaro', hitDie: 8, primaryAbility: ['dex'], savingThrows: ['dex', 'int'], 
    multiclassRequirements: { dex: 13 }, 
    startingEquipment: ['Estoque', 'Arco Corto', 'Flechas (20)', 'Armadura de Cuero', 'Daga', 'Daga', 'Herramientas de Ladrón', 'Paquete de Mazmorreo'],
    armorProficiencies: ["Armadura Ligera"],
    weaponProficiencies: ["Armas Sencillas", "Ballesta de Mano", "Espada Larga", "Estoque", "Espada Corta"],
    skillProficiencyOptions: { options: ['Acrobacias', 'Atletismo', 'Engaño', 'Perspicacia', 'Intimidación', 'Investigación', 'Percepción', 'Interpretación', 'Persuasión', 'Juego de Manos', 'Sigilo'], count: 4 },
    asiLevels: [4, 8, 10, 12, 16, 19], 
  },
]);

export const ALL_BACKGROUNDS_ADVANCED: readonly BaseBackgroundDetail[] = Object.freeze([
  { name: 'Acólito', skillProficiencies: ['Perspicacia', 'Religión'], languages: 'anyTwo', equipment: ['Símbolo Sagrado', 'Libro de oraciones', 'Vestiduras', 'Ropa común', 'Incienso (5 varitas)'], startingGold: 15, featureName: 'Refugio de los Fieles', featureDescription: 'Puedes recibir curación y cuidados gratuitos en templos de tu fe.' },
  { name: 'Soldado', skillProficiencies: ['Atletismo', 'Intimidación'], toolProficiencies: ['vehiclesLand'], equipment: ['Insignia de rango', 'Un trofeo enemigo', 'Ropa común', 'Juego de dados de hueso'], startingGold: 10, featureName: 'Rango Militar', featureDescription: 'Los soldados leales a tu antigua organización aún te reconocen.' },
  { name: 'Sabio', skillProficiencies: ['Arcanos', 'Historia'], languages: 'anyTwo', equipment: ['Botella de tinta', 'Pluma', 'Ropa común', 'Carta de un colega muerto'], startingGold: 10, featureName: 'Investigador', featureDescription: 'Sabes dónde y cómo encontrar información.' },
  { name: 'Criminal', skillProficiencies: ['Engaño', 'Sigilo'], toolProficiencies: ['thievesTools', 'oneTypeOfGamingSet'], equipment: ['Palanca', 'Ropa oscura con capucha', 'Bolsa con 15 po (adicionales al startingGold)'], startingGold: 15, featureName: 'Contacto Criminal', featureDescription: 'Tienes un contacto fiable en el submundo criminal.' },
]);

export const MULTICLASS_REQUIREMENTS: Record<string, Partial<AbilityScores>> = {
  Bárbaro: { str: 13 }, Bardo: { cha: 13 }, Clérigo: { wis: 13 }, Druida: { wis: 13 },
  Guerrero: { str: 13, dex: 13 }, Monje: { dex: 13, wis: 13 }, Paladín: { str: 13, cha: 13 },
  Explorador: { dex: 13, wis: 13 }, Pícaro: { dex: 13 }, Hechicero: { cha: 13 },
  Brujo: { cha: 13 }, Mago: { int: 13 },
};

export const SKILL_TO_ABILITY_MAP: Record<string, AbilityKey> = {
  'Acrobacias': 'dex', 'Trato con Animales': 'wis', 'Arcanos': 'int', 'Atletismo': 'str',
  'Engaño': 'cha', 'Historia': 'int', 'Perspicacia': 'wis', 'Intimidación': 'cha',
  'Investigación': 'int', 'Medicina': 'wis', 'Naturaleza': 'int', 'Percepción': 'wis',
  'Interpretación': 'cha', 'Persuasión': 'cha', 'Religión': 'int',
  'Juego de Manos': 'dex', 'Sigilo': 'dex', 'Supervivencia': 'wis',
};

export const SHOPKEEPERS_DATA: Record<string, Shopkeeper> = {
  'herrero_local': {
    id: 'herrero_local',
    name: 'Baldar el Herrero',
    description: "Un herrero robusto con manos callosas y una mirada amable. Su tienda huele a carbón y metal.",
    inventory: [
      { itemId: "Daga", quantity: 5 }, { itemId: "Maza", quantity: 3 },
      { itemId: "Espada Corta", quantity: 2 }, { itemId: "Espada Larga", quantity: 1 },
      { itemId: "Escudo", quantity: 3 }, { itemId: "Armadura de Cuero", quantity: 2 },
      { itemId: "Cota de Malla", quantity: 1 },
    ],
    buyPriceModifier: 1.2, sellPriceModifier: 0.5,
  },
  'alquimista_viajero': {
    id: 'alquimista_viajero',
    name: 'Elara la Alquimista',
    description: "Una mujer misteriosa con una bolsa llena de viales burbujeantes y hierbas exóticas.",
    inventory: [
      { itemId: "Poción de Curación", quantity: 10 }, { itemId: "Poción de Curación Mayor", quantity: 3 },
      { itemId: "Poción de Curación Menor", quantity: 'Infinity' }, { itemId: "Antorcha", quantity: 20 },
    ],
    buyPriceModifier: 1.5, sellPriceModifier: 0.4,
  }
};

export const PREDEFINED_ENEMY_GROUPS: Record<string, { enemies: Enemy[], description?: string }> = {
  "dos_goblins": {
    enemies: [
      { id: 'goblin_scout_1', name: 'Goblin Explorador Alfa', dexterity: 14, maxHp: 7, currentHp: 7, armorClass: 13, attackBonus: 4, attacks: [{name: "Cimitarra", damageDice: "1d6"}], loot: [{itemId: "Daga", chance: 0.5}, {itemId: "Poción de Curación Menor", chance: 0.1}], goldDrop: {min:1, max: 5, chance: 0.7}, xpValue: 25, groupId: "dos_goblins", specialAbilitiesDescription: "Este goblin intenta usar su Cimitarra con rapidez y retirarse si es posible." },
      { id: 'goblin_thug_1', name: 'Goblin Matón Beta', dexterity: 12, maxHp: 10, currentHp: 10, armorClass: 13, attackBonus: 4, attacks: [{name: "Maza", damageDice: "1d6"}], loot: [{itemId: "Maza", chance: 0.3}], goldDrop: {min:3, max:10, chance: 0.5}, xpValue: 25, groupId: "dos_goblins", specialAbilitiesDescription: "Este goblin es más bruto y ataca sin mucha estrategia." },
    ],
    description: "Dos goblins malencarados bloquean el camino."
  },
  "lobo_solitario": {
    enemies: [
       { id: 'wolf_1', name: 'Lobo Solitario', dexterity: 15, maxHp: 11, currentHp: 11, armorClass: 13, attackBonus: 4, attacks: [{name: "Mordisco", damageDice: "2d4", damageModifierAbility: 'dex'}], loot: [{itemId: "Piel de Lobo", chance: 0.8}], xpValue: 50, groupId: "lobo_solitario", specialAbilitiesDescription: "El lobo usa su agilidad para esquivar y morder en puntos débiles. Si el objetivo está solo, intentará derribarlo (efecto narrativo)." },
    ],
    description: "Un lobo solitario te acecha desde las sombras."
  },
  "cultist_acolytes": {
    enemies: [
      { id: 'cult_acolyte_1', name: 'Acólito Cultista', dexterity: 10, maxHp: 9, currentHp: 9, armorClass: 10, attackBonus: 2, attacks: [{name: "Daga", damageDice: "1d4"}], loot: [{itemId: "Símbolo Sagrado Profano", chance: 0.6}], goldDrop: {min:2, max:8, chance:0.8}, xpValue: 25, groupId: "cultist_acolytes", specialAbilitiesDescription: "Canta himnos oscuros mientras ataca. Podría intentar usar 'Mandato' (narrativo si no es lanzador)." },
      { id: 'cult_acolyte_2', name: 'Acólito Cultista Devoto', dexterity: 10, maxHp: 9, currentHp: 9, armorClass: 10, attackBonus: 2, attacks: [{name: "Daga", damageDice: "1d4"}], loot: [{itemId: "Daga", chance: 0.4}], xpValue: 25, groupId: "cultist_acolytes", specialAbilitiesDescription: "Lucha con fanatismo, protegiendo a otros cultistas si es posible." }
    ],
    description: "Un par de acólitos con túnicas oscuras realizan un ritual."
  }
};
// Añadir "Símbolo Sagrado Profano" a ITEMS_DATA si se va a usar mecánicamente.
ITEMS_DATA["Símbolo Sagrado Profano"] = { name: "Símbolo Sagrado Profano", type: 'misc', value: 1, description: "Un símbolo sagrado corrompido, emana una leve energía oscura.", weight: 1 };