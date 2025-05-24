import {
  type Character,
  type AbilityScores,
  type BaseClassDetail,
  type Spell,
  type SpellSlots,
  type PactMagicSlots,
} from '../types';
import { SPELLS_DATA } from '../constants'; // Assume ALL_CLASSES_ADVANCED is not needed here, passed as args
import { calculateAbilityModifier } from './characterUtils';

// PHB p. 165
const MULTICLASS_SPELL_SLOTS: { [casterLevel: number]: number[] } = {
  1:  [2,0,0,0,0,0,0,0,0],
  2:  [3,0,0,0,0,0,0,0,0],
  3:  [4,2,0,0,0,0,0,0,0],
  4:  [4,3,0,0,0,0,0,0,0],
  5:  [4,3,2,0,0,0,0,0,0],
  6:  [4,3,3,0,0,0,0,0,0],
  7:  [4,3,3,1,0,0,0,0,0],
  8:  [4,3,3,2,0,0,0,0,0],
  9:  [4,3,3,3,1,0,0,0,0],
  10: [4,3,3,3,2,0,0,0,0],
  11: [4,3,3,3,2,1,0,0,0],
  12: [4,3,3,3,2,1,0,0,0],
  13: [4,3,3,3,2,1,1,0,0],
  14: [4,3,3,3,2,1,1,0,0],
  15: [4,3,3,3,2,1,1,1,0],
  16: [4,3,3,3,2,1,1,1,0],
  17: [4,3,3,3,2,1,1,1,1],
  18: [4,3,3,3,3,1,1,1,1],
  19: [4,3,3,3,3,2,1,1,1],
  20: [4,3,3,3,3,2,2,1,1],
};

type CasterType = 'full' | 'half' | 'third' | 'none';

const getClassCasterType = (classDetails: BaseClassDetail): CasterType => {
  if (!classDetails.spellcasting && !classDetails.pactMagic) return 'none';
  if (classDetails.pactMagic) return 'none'; // Warlocks are handled separately for slots

  // Simplified: Assume Paladin is half. Others with spellcasting are full.
  // A more robust system would have casterType in SpellcastingDefinition.
  // For now, only Paladin from ALL_CLASSES_ADVANCED is 'half'.
  if (classDetails.name === 'Paladín') return 'half';
  // Add Ranger here if/when defined as 'half'
  // Add Eldritch Knight/Arcane Trickster if defined as 'third'
  if (classDetails.spellcasting) return 'full'; // Default for other spellcasting classes
  return 'none';
};

const calculateCombinedCasterLevel = (
  primaryClassDetails: BaseClassDetail,
  primaryClassLevel: number,
  secondaryClassDetails?: BaseClassDetail | null,
  secondaryClassLevel?: number
): number => {
  let combinedLevel = 0;

  const primaryCasterType = getClassCasterType(primaryClassDetails);
  if (primaryCasterType === 'full') combinedLevel += primaryClassLevel;
  else if (primaryCasterType === 'half') combinedLevel += Math.floor(primaryClassLevel / 2);
  else if (primaryCasterType === 'third') combinedLevel += Math.floor(primaryClassLevel / 3);

  if (secondaryClassDetails && secondaryClassLevel && secondaryClassLevel > 0) {
    const secondaryCasterType = getClassCasterType(secondaryClassDetails);
    if (secondaryCasterType === 'full') combinedLevel += secondaryClassLevel;
    else if (secondaryCasterType === 'half') combinedLevel += Math.floor(secondaryClassLevel / 2);
    else if (secondaryCasterType === 'third') combinedLevel += Math.floor(secondaryClassLevel / 3);
  }
  return combinedLevel;
};

export const manageCharacterSpellcasting = (
  character: Partial<Character>,
  primaryClassDetails: BaseClassDetail,
  secondaryClassDetails?: BaseClassDetail | null,
  characterTotalLevel?: number
): Pick<Character, 'knownSpells' | 'spellSlots' | 'pactMagicSlots'> => {
  const totalLevel = characterTotalLevel ?? character.level ?? 1;
  const abilities = character.abilities as AbilityScores;

  let knownSpellsList: Spell[] = [];
  let spellSlotsOutput: SpellSlots | undefined = undefined;
  let pactMagicSlotsOutput: PactMagicSlots | undefined = undefined;

  // Determine effective levels for primary and secondary classes based on simplification
  let primaryClassLevel = totalLevel;
  let secondaryClassLevel = 0;

  if (secondaryClassDetails && primaryClassDetails && character.multiclassOption === secondaryClassDetails.name) {
    if (totalLevel > 1) {
      // Per task instruction: primary gets totalLevel - 1, secondary gets 1.
      primaryClassLevel = totalLevel - 1;
      secondaryClassLevel = 1;
      // Ensure primaryClassLevel is at least 1 if totalLevel was 2 (making secondary 1, primary 1)
      if (primaryClassLevel < 1 && totalLevel > 1) primaryClassLevel = 1;
    } else { // totalLevel is 1, all in primary
      secondaryClassLevel = 0;
    }
  }

  // --- Calculate Spell Slots based on Combined Caster Level (excluding Warlock) ---
  const combinedCasterLevel = calculateCombinedCasterLevel(
    primaryClassDetails, primaryClassLevel,
    secondaryClassDetails, secondaryClassLevel
  );

  if (combinedCasterLevel > 0) {
    const slotsArray = MULTICLASS_SPELL_SLOTS[combinedCasterLevel];
    if (slotsArray) {
      spellSlotsOutput = {};
      slotsArray.forEach((numSlots, index) => {
        if (numSlots > 0) {
          const key = `level${index + 1}` as keyof SpellSlots;
          spellSlotsOutput[key] = { max: numSlots, current: numSlots };
        }
      });
    }
  }
  
  // --- Pact Magic (Warlock) ---
  // Pact Magic slots are always separate and based on Warlock class level.
  // If primary class is Warlock:
  if (primaryClassDetails.pactMagic && primaryClassLevel > 0) {
    const pmDef = primaryClassDetails.pactMagic;
    pactMagicSlotsOutput = {
      level: pmDef.slotLevelAtLevel(primaryClassLevel),
      max: pmDef.slotsAtLevel(primaryClassLevel),
      current: pmDef.slotsAtLevel(primaryClassLevel),
    };
  }
  // If secondary class is Warlock (and primary is not, or even if it is, Warlock levels don't stack pact slots in a combined way)
  // This assumes only one class can grant Pact Magic, or the primary takes precedence if both somehow could.
  // For simplicity, if secondary is Warlock and primary wasn't, it gets its pact slots.
  // If primary was Warlock, secondary Warlock levels don't add more pact slots on top of primary.
  // True Warlock multiclassing uses total Warlock level for pact features.
  // Our current level split doesn't support "total warlock level" directly if both were Warlock.
  // So, this handles case where secondary is Warlock and primary ISN'T.
  else if (secondaryClassDetails?.pactMagic && secondaryClassLevel > 0 && !primaryClassDetails.pactMagic) {
    const pmDefSec = secondaryClassDetails.pactMagic;
    pactMagicSlotsOutput = {
      level: pmDefSec.slotLevelAtLevel(secondaryClassLevel),
      max: pmDefSec.slotsAtLevel(secondaryClassLevel),
      current: pmDefSec.slotsAtLevel(secondaryClassLevel),
    };
  }


  // --- Known/Prepared Spells (Class by Class) ---
  // Primary Class Spells
  if (primaryClassDetails.spellcasting && primaryClassLevel > 0) {
    const scDef = primaryClassDetails.spellcasting;
    if (scDef.spellList && scDef.knownCantrips) {
      const numKnownCantrips = typeof scDef.knownCantrips === 'function' ? scDef.knownCantrips(primaryClassLevel) : scDef.knownCantrips;
      scDef.spellList.filter(sn => SPELLS_DATA[sn]?.level === 0).slice(0, numKnownCantrips).forEach(spellName => {
        if (SPELLS_DATA[spellName] && !knownSpellsList.find(s => s.name === spellName)) knownSpellsList.push(SPELLS_DATA[spellName]);
      });
    }
    if (scDef.spellList && scDef.knownSpells) {
      const abilityMod = abilities && scDef.spellAbility ? calculateAbilityModifier(abilities[scDef.spellAbility]) : 0;
      const numKnownSpells = typeof scDef.knownSpells === 'function' ? scDef.knownSpells(primaryClassLevel, abilityMod) : scDef.knownSpells;
      scDef.spellList.filter(sn => SPELLS_DATA[sn]?.level > 0 && SPELLS_DATA[sn].level <= (spellSlotsOutput ? 9 : 0) /* Only learn spells for which slots might exist */).slice(0, numKnownSpells).forEach(spellName => {
        if (SPELLS_DATA[spellName] && !knownSpellsList.find(s => s.name === spellName)) knownSpellsList.push(SPELLS_DATA[spellName]);
      });
    }
  } else if (primaryClassDetails.pactMagic && primaryClassLevel > 0) { // Warlock primary class spells
    const pmDef = primaryClassDetails.pactMagic;
    if (pmDef.spellList) {
      const cantripsToLearn = pmDef.knownCantripsAtLevel(primaryClassLevel);
      pmDef.spellList.filter(sn => SPELLS_DATA[sn]?.level === 0).slice(0, cantripsToLearn).forEach(spellName => {
        if (SPELLS_DATA[spellName] && !knownSpellsList.find(s => s.name === spellName)) knownSpellsList.push(SPELLS_DATA[spellName]);
      });
      const spellsToLearn = pmDef.knownSpellsAtLevel(primaryClassLevel);
      // Warlocks can only learn spells up to their pact slot level (max 5th, but table goes higher)
      const maxPactSpellLevel = pmDef.slotLevelAtLevel(primaryClassLevel);
      pmDef.spellList.filter(sn => SPELLS_DATA[sn]?.level > 0 && SPELLS_DATA[sn].level <= maxPactSpellLevel).slice(0, spellsToLearn).forEach(spellName => {
        if (SPELLS_DATA[spellName] && !knownSpellsList.find(s => s.name === spellName)) knownSpellsList.push(SPELLS_DATA[spellName]);
      });
    }
  }

  // Secondary Class Spells
  if (secondaryClassDetails && secondaryClassLevel > 0) {
    if (secondaryClassDetails.spellcasting) {
      const scDefSec = secondaryClassDetails.spellcasting;
      if (scDefSec.spellList && scDefSec.knownCantrips) {
        const numKnownCantripsSec = typeof scDefSec.knownCantrips === 'function' ? scDefSec.knownCantrips(secondaryClassLevel) : scDefSec.knownCantrips;
        scDefSec.spellList.filter(sn => SPELLS_DATA[sn]?.level === 0).slice(0, numKnownCantripsSec).forEach(spellName => {
          if (SPELLS_DATA[spellName] && !knownSpellsList.find(s => s.name === spellName)) knownSpellsList.push(SPELLS_DATA[spellName]);
        });
      }
      if (scDefSec.spellList && scDefSec.knownSpells) {
        const abilityModSec = abilities && scDefSec.spellAbility ? calculateAbilityModifier(abilities[scDefSec.spellAbility]) : 0;
        const numKnownSpellsSec = typeof scDefSec.knownSpells === 'function' ? scDefSec.knownSpells(secondaryClassLevel, abilityModSec) : scDefSec.knownSpells;
        scDefSec.spellList.filter(sn => SPELLS_DATA[sn]?.level > 0 && SPELLS_DATA[sn].level <= (spellSlotsOutput ? 9 : 0)).slice(0, numKnownSpellsSec).forEach(spellName => {
          if (SPELLS_DATA[spellName] && !knownSpellsList.find(s => s.name === spellName)) knownSpellsList.push(SPELLS_DATA[spellName]);
        });
      }
    } else if (secondaryClassDetails.pactMagic) { // Warlock secondary class spells
        // Only add spells if primary was not also Warlock, to avoid double-dipping on Warlock spell list
        // (Pact slots themselves are handled above and don't stack additively if both are Warlock)
        if (!primaryClassDetails.pactMagic) {
            const pmDefSec = secondaryClassDetails.pactMagic;
            if (pmDefSec.spellList) {
                const cantripsToLearnSec = pmDefSec.knownCantripsAtLevel(secondaryClassLevel);
                pmDefSec.spellList.filter(sn => SPELLS_DATA[sn]?.level === 0).slice(0, cantripsToLearnSec).forEach(spellName => {
                    if (SPELLS_DATA[spellName] && !knownSpellsList.find(s => s.name === spellName)) knownSpellsList.push(SPELLS_DATA[spellName]);
                });
                const spellsToLearnSec = pmDefSec.knownSpellsAtLevel(secondaryClassLevel);
                const maxPactSpellLevelSec = pmDefSec.slotLevelAtLevel(secondaryClassLevel);
                pmDefSec.spellList.filter(sn => SPELLS_DATA[sn]?.level > 0 && SPELLS_DATA[sn].level <= maxPactSpellLevelSec).slice(0, spellsToLearnSec).forEach(spellName => {
                    if (SPELLS_DATA[spellName] && !knownSpellsList.find(s => s.name === spellName)) knownSpellsList.push(SPELLS_DATA[spellName]);
                });
            }
        }
    }
  }
  
  return {
    knownSpells: knownSpellsList.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name)),
    spellSlots: spellSlotsOutput,
    pactMagicSlots: pactMagicSlotsOutput,
  };
};

// Helper to get class details (already in constants.ts but good to have if utils becomes more standalone)
// For now, assume CLASSES_DATA is imported where this util is used.
// import { CLASSES_DATA } from '../constants';
// const getFullClassDetails = (className: string): BaseClassDetail | undefined => {
//   return CLASSES_DATA.find(c => c.name === className);
// };
