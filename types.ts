

export enum ExperienceLevel {
  Beginner = "Principiante",
  Intermediate = "Intermedio",
  Advanced = "Avanzado",
}

export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export interface AbilityScores {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface HitDice {
  total: number;
  current: number;
  dieType: number; // e.g., 6, 8, 10, 12 (represents a d6, d8 etc.)
}

export interface ChampionAbilities {
  secondWindUsed: boolean;
  actionSurgeUsed: boolean;
}

// --- Magia ---
export interface Spell {
  name: string;
  level: number; // 0 for cantrips
  description: string;
  school?: string;
  castingTime?: string;
  range?: string;
  components?: string; // V, S, M (material component details)
  duration?: string;
  damageDice?: string; // e.g., "3d10"
  damageType?: string; // e.g., "Fuego", "Radiante"
  healingDice?: string; // e.g., "1d4"
  // Add other relevant spell properties as needed
}

export interface SpellSlotInfo {
  max: number;
  current: number;
}

export interface SpellSlots {
  level1?: SpellSlotInfo;
  level2?: SpellSlotInfo;
  level3?: SpellSlotInfo;
  level4?: SpellSlotInfo;
  level5?: SpellSlotInfo;
  // Extend as needed for higher level play
}

export interface PactMagicSlots {
  level: number; // All pact slots are of this level
  max: number;
  current: number;
}

// --- Inventario ---
export type ItemType = 'weapon' | 'armor' | 'shield' | 'potion' | 'misc';

export interface ItemEffect {
  type: 'heal' | 'damage_boost' | 'stat_boost'; // Expand as needed
  amount?: string; // e.g., "2d4+2" for heal, "1d6" for damage_boost
  stat?: AbilityKey; // For stat_boost
  durationRounds?: number;
  description?: string;
}

export interface ItemProperty {
  name: string;
  type: ItemType;
  value: number; // Costo en oro
  description?: string;
  damageDice?: string; // Para armas, ej: "1d8"
  damageType?: string; // Para armas
  attackAbility?: AbilityKey; // Para armas, ej: 'str' o 'dex' para finesse
  properties?: string[]; // ej: ['finesse', 'versatile (1d10)']
  acBonus?: number; // Para armaduras y escudos // For armors, this is the base AC it provides (e.g. Leather is 11, Plate is 18)
  addDexModifier?: boolean; // For light armor
  maxDexBonus?: number; // For medium armor (e.g., 2)
  requiredStrength?: number; // Para armaduras pesadas
  stealthDisadvantage?: boolean; // Para ciertas armaduras
  effects?: ItemEffect[]; // Para pociones y otros consumibles
  weight: number; // Peso del objeto
}

export interface FeatDetail {
  id: string;
  name: string;
  description: string;
  // prerequisites?: any[]; // Future enhancement
}


export interface Character {
  id: string;
  name: string;
  experienceLevel: ExperienceLevel;
  race: string;
  primaryClass: string;
  multiclassOption?: string;
  subclass?: string;
  level: number;

  abilities: AbilityScores;
  background: string;
  skills: string[]; 
  equipment: string[]; // Lista de nombres de objetos que posee el personaje

  weaponProficiencies: string[];
  armorProficiencies: string[];
  savingThrowProficiencies: AbilityKey[];

  armorClass: number;
  maxHp: number;
  currentHp: number;
  hitDice: HitDice;
  initiativeRoll?: number;
  championAbilities?: ChampionAbilities; 

  // Magia
  knownSpells?: Spell[];
  spellSlots?: SpellSlots; // Para Paladín, Clérigo, Mago, etc.
  pactMagicSlots?: PactMagicSlots; // Para Brujo

  rolledScores?: number[];
  rerollAttemptsLeft?: number;

  gold: number;
  xp: number;
  feats?: string[]; // IDs de las dotes adquiridas
}

export interface GameState {
  currentCharacterId: string | null;
}

export interface BaseRaceDetail {
  name: string;
  abilityBonuses: Partial<AbilityScores>;
  features?: string[];
  description?: string;
  armorProficiencies?: string[];
  weaponProficiencies?: string[];
  skillProficiencies?: string[];
}

export interface SkillProficiencyChoice {
  options: string[];
  count: number;
}

export interface SpellcastingDefinition {
  spellAbility: AbilityKey;
  slotProgressionTable: number[][]; // This might become less relevant for slots if strictly using multiclass table
  casterType?: 'full' | 'half' | 'third'; // Recommended for more accurate caster level calculation
  knownCantrips?: number | ((classLevel: number) => number); 
  knownSpells?: number | ((classLevel: number, abilityMod: number) => number); 
  spellList?: string[]; 
  preparationSlots?: (level: number, abilityMod: number) => number; 
}

export interface PactMagicDefinition {
  spellAbility: AbilityKey;
  slotsAtLevel: (charLevel: number) => number; 
  slotLevelAtLevel: (charLevel: number) => number; 
  knownCantripsAtLevel: (charLevel: number) => number;
  knownSpellsAtLevel: (charLevel: number) => number;
  spellList: string[]; 
}


export interface BaseClassDetail {
  name: string;
  hitDie: number;
  primaryAbility: AbilityKey[];
  savingThrows: AbilityKey[]; 
  multiclassRequirements?: Partial<AbilityScores>;
  description?: string;
  startingEquipment?: string[]; // Nombres de los items
  armorProficiencies: string[]; 
  weaponProficiencies: string[]; 
  skillProficiencyOptions?: SkillProficiencyChoice;
  spellcasting?: SpellcastingDefinition; 
  pactMagic?: PactMagicDefinition; 
  asiLevels?: number[]; // Niveles en los que se obtiene ASI/Dote
}

export interface BaseBackgroundDetail {
  name: string;
  skillProficiencies: string[];
  toolProficiencies?: string[];
  languages?: string[] | 'anyOne' | 'anyTwo';
  equipment: string[]; // Nombres de los items
  featureName: string;
  featureDescription: string;
  description?: string;
  startingGold?: number;
}

export interface Enemy {
  id: string;
  name: string;
  dexterity: number; 
  maxHp: number;
  currentHp: number;
  initiativeRoll?: number;
  armorClass: number;
  attackBonus: number; 
  attacks?: { name: string; damageDice: string, damageModifierAbility?: AbilityKey }[]; 
  loot?: { itemId: string, chance?: number, quantity?: number }[]; // chance 0-1, quantity 1 por defecto
  goldDrop?: { min: number, max: number, chance?: number };
  xpValue?: number; // XP otorgado al derrotar
  groupId?: string; // Para agrupar enemigos en encuentros predefinidos
  specialAbilitiesDescription?: string; // Descripciones narrativas de habilidades
}

export type CombatParticipant = (Character | Enemy) & { participantType: 'player' | 'enemy' };

export interface DamageRoll {
  diceCount: number;
  dieType: number;
  rolls: number[];
  modifier: number;
  total: number;
  damageType?: string; 
}

export interface D20RollResult { 
  finalRoll: number;
  individualRolls: number[];
  isCriticalSuccess: boolean;
  isCriticalFailure: boolean;
  withAdvantage: boolean;
  withDisadvantage: boolean;
}

export interface AttackRollResult {
  attackerName: string;
  targetName: string;
  attackBonusValue: number;
  abilityMod: number;
  proficiencyBonusUsed: number;
  usedAbilityKey: AbilityKey;
  d20Rolls: number[];
  finalD20Roll: number;
  totalAttackRoll: number;
  targetAC: number;
  isCriticalHit: boolean;
  isCriticalMiss: boolean;
  isHit: boolean;
  advantageUsed: boolean;
  disadvantageUsed: boolean;
  details: string; 
  
  damageRolls?: DamageRoll[]; 
  totalDamageDealt?: number;
  damageDetails?: string; 
}

export interface SkillCheckResult {
  skillName: string;
  abilityKey: AbilityKey;
  abilityMod: number;
  proficiencyBonusUsed: number;
  totalBonus: number;
  d20RollResult: D20RollResult;
  finalRollValue: number;
  targetDC: number;
  isSuccess: boolean;
  isCriticalSuccess: boolean;
  isCriticalFailure: boolean;
  details: string;
}

export interface SavingThrowResult {
  savingThrowAbility: AbilityKey;
  abilityMod: number;
  proficiencyBonusUsed: number;
  totalBonus: number;
  d20RollResult: D20RollResult;
  finalRollValue: number;
  targetDC: number;
  isSuccess: boolean;
  isCriticalSuccess: boolean;
  isCriticalFailure: boolean;
  details: string;
}


// --- Tienda ---
export interface ShopItemStock { // Para el inventario del tendero
  itemId: string; // ID del Item en ITEMS_DATA
  quantity: number | 'Infinity'; // 'Infinity' para ilimitado, o un número
}

export interface Shopkeeper {
  id: string;
  name: string;
  description?: string;
  inventory: ShopItemStock[]; // Lo que vende
  buyPriceModifier: number;  // Ej. 1.2 (tienda vende al 120% del valor base del item)
  sellPriceModifier: number; // Ej. 0.5 (tienda compra al 50% del valor base del item)
}

// --- Estructura de Aventura Modular ---
export type SceneActionType = 
  | 'moveToNode' 
  | 'skillCheck' 
  | 'savingThrow' 
  | 'combat' 
  | 'npcInteraction' 
  | 'openShop' 
  | 'customEvent'
  | 'rest';

export interface GameScreenApi {
  updateCharacterStats: (updatedStats: Partial<Character>) => void;
  addSystemMessage: (message: string, data?: SkillCheckResult | SavingThrowResult | AttackRollResult) => void;
  addPlayerMessage: (message: string) => void;
  addDmMessage: (message: string) => void;
  initiateCombat: (enemyGroupIds: string[], victoryNodeId?: string, defeatNodeId?: string, combatDescription?: string) => void;
  openShop: (shopId: string) => void;
  changeScene: (sceneId: string) => void; // Para que onSelect/onEnter puedan cambiar de escena si es necesario
  getCharacter: () => Character; // Para que las funciones de escena puedan leer el estado actual del personaje
  // Add more functions as needed for scenes to interact with the game state
}

export interface SceneSkillCheckDetails {
  skill: string; // Nombre de la habilidad, ej. "Percepción"
  dc: number;
  advantage?: boolean;
  disadvantage?: boolean;
  successNodeId?: string;
  failureNodeId?: string;
  successMessage?: string; // Mensaje de sistema al tener éxito
  failureMessage?: string; // Mensaje de sistema al fallar
  // Callbacks para generar prompts para Gemini basados en el resultado
  successDMCallback?: (character: Character, gameApi: GameScreenApi) => string; 
  failureDMCallback?: (character: Character, gameApi: GameScreenApi) => string; 
}

export interface SceneCombatDetails {
  enemyGroupIds: string[]; // IDs de grupos de enemigos de PREDEFINED_ENEMY_GROUPS
  victoryNodeId?: string;
  defeatNodeId?: string;
  combatDescription?: string; // Descripción específica del combate para el DM
}

export interface SceneNPCOption { 
  id: string;
  dialogueText: string;
  playerResponse?: string; 
  nextNodeId?: string; 
  skillCheck?: SceneSkillCheckDetails; 
}

export interface SceneRestDetails {
    type: 'short' | 'long';
    durationMessage?: string; // e.g., "Descansas durante una hora."
    completionNodeId?: string; // Node to go to after rest
}

export interface SceneOption {
  text: string | ((character: Character) => string);
  targetNodeId?: string; 
  actionType?: SceneActionType;
  
  skillCheckDetails?: SceneSkillCheckDetails;
  combatDetails?: SceneCombatDetails;
  restDetails?: SceneRestDetails;
  
  npcId?: string; 
  shopId?: string; 
  customEventId?: string; 

  requires?: (character: Character) => boolean; 
  onSelect?: (character: Character, gameApi: GameScreenApi) => void | Promise<void>; 
}

export interface SceneNode {
  id: string;
  title?: string;
  description: string | ((character: Character, gameApi?: GameScreenApi) => string);
  image?: string; 
  options: SceneOption[];
  onEnter?: (character: Character, gameApi: GameScreenApi) => void | Promise<void>; 
}