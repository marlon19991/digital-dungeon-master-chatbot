
import type { AbilityKey, AbilityScores, BaseRaceDetail, BaseClassDetail, BaseBackgroundDetail, Character, Enemy, AttackRollResult, DamageRoll, SkillCheckResult, SavingThrowResult, ItemProperty } from '../types';
import { DEFAULT_UNARMORED_AC_BASE, ABILITIES, SKILL_TO_ABILITY_MAP, ITEMS_DATA } from '../constants';
import { rollD20, rollDice as rollMultipleDice, type D20RollResult } from './diceUtils'; 

export const calculateAbilityModifier = (score: number): number => {
  return Math.floor((score - 10) / 2);
};

export const getProficiencyBonus = (level: number): number => {
  if (level >= 17) return 6;
  if (level >= 13) return 5;
  if (level >= 9) return 4;
  if (level >= 5) return 3;
  return 2;
};

// WEAPON_DAMAGE_MAP is deprecated in favor of richer ITEMS_DATA
// export const WEAPON_DAMAGE_MAP: Record<string, { damageDice: string; abilityKeyForDamage: AbilityKey; versatileDice?: string }> = { ... };


export const getCombinedProficiencies = (
  race: BaseRaceDetail | null,
  primaryClass: BaseClassDetail | null,
  secondaryClass: BaseClassDetail | null, 
  background: BaseBackgroundDetail | null
): { skills: string[], weapons: string[], armors: string[], savingThrows: AbilityKey[] } => {
  const proficiencies = {
    skills: new Set<string>(), weapons: new Set<string>(),
    armors: new Set<string>(), savingThrows: new Set<AbilityKey>(),
  };

  if (background) background.skillProficiencies.forEach(skill => proficiencies.skills.add(skill));
  if (race) {
    race.skillProficiencies?.forEach(skill => proficiencies.skills.add(skill));
    race.weaponProficiencies?.forEach(wp => proficiencies.weapons.add(wp));
    race.armorProficiencies?.forEach(ap => proficiencies.armors.add(ap));
  }
  if (primaryClass) {
    primaryClass.savingThrows.forEach(st => proficiencies.savingThrows.add(st));
    primaryClass.armorProficiencies.forEach(ap => proficiencies.armors.add(ap));
    primaryClass.weaponProficiencies.forEach(wp => proficiencies.weapons.add(wp));
    if (primaryClass.skillProficiencyOptions) {
      primaryClass.skillProficiencyOptions.options.slice(0, primaryClass.skillProficiencyOptions.count).forEach(skill => proficiencies.skills.add(skill));
    }
  }
  if (secondaryClass) { // Simplified multiclass proficiencies
    secondaryClass.armorProficiencies.forEach(ap => { 
        if(["Armadura Ligera", "Armadura Media", "Escudos"].includes(ap) && !proficiencies.armors.has(ap)) {
            proficiencies.armors.add(ap);
        }
    });
    secondaryClass.weaponProficiencies.forEach(wp => { 
        if (wp === "Armas Sencillas" && !proficiencies.weapons.has(wp)) proficiencies.weapons.add(wp);
    });
     if (secondaryClass.skillProficiencyOptions && secondaryClass.skillProficiencyOptions.options.length > 0) {
        const skillToAdd = secondaryClass.skillProficiencyOptions.options.find(s => !proficiencies.skills.has(s));
        if (skillToAdd) proficiencies.skills.add(skillToAdd);
     }
  }
  return {
    skills: Array.from(proficiencies.skills), weapons: Array.from(proficiencies.weapons),
    armors: Array.from(proficiencies.armors), savingThrows: Array.from(proficiencies.savingThrows),
  };
};

export const calculateAc = (
  abilities: AbilityScores,
  charArmorProficiencies: string[], // Names of armor types the character is proficient with (e.g., "Armadura Ligera", "Todas las Armaduras")
  equipmentNames: string[] // Names of items currently in inventory/equipped
): number => {
  const dexMod = calculateAbilityModifier(abilities.dex);
  let calculatedAC = DEFAULT_UNARMORED_AC_BASE + dexMod; // Start with unarmored AC

  let equippedArmorItemDetails: ItemProperty | null = null;
  
  // Find the best armor equipped
  for (const itemName of equipmentNames) {
    const itemDetails = ITEMS_DATA[itemName];
    if (itemDetails && itemDetails.type === 'armor') {
      if (!equippedArmorItemDetails || (itemDetails.acBonus || 0) > (equippedArmorItemDetails.acBonus || 0)) {
        equippedArmorItemDetails = itemDetails;
      }
    }
  }
  
  if (equippedArmorItemDetails) {
    // Check proficiency with the specific armor type
    let isProficientWithEquipped = charArmorProficiencies.includes("Todas las Armaduras");
    if (!isProficientWithEquipped) {
        // Determine armor category (light, medium, heavy) based on properties
        if (equippedArmorItemDetails.addDexModifier && equippedArmorItemDetails.maxDexBonus === undefined) { // Light
            isProficientWithEquipped = charArmorProficiencies.includes("Armadura Ligera");
        } else if (equippedArmorItemDetails.addDexModifier && equippedArmorItemDetails.maxDexBonus !== undefined) { // Medium
            isProficientWithEquipped = charArmorProficiencies.includes("Armadura Media");
        } else if (!equippedArmorItemDetails.addDexModifier) { // Heavy
             isProficientWithEquipped = charArmorProficiencies.includes("Armadura Pesada");
        }
    }


    if (isProficientWithEquipped) {
        calculatedAC = equippedArmorItemDetails.acBonus || DEFAULT_UNARMORED_AC_BASE; // Armor's base AC value
        if (equippedArmorItemDetails.addDexModifier) {
            if (equippedArmorItemDetails.maxDexBonus !== undefined) {
                calculatedAC += Math.min(dexMod, equippedArmorItemDetails.maxDexBonus);
            } else {
                calculatedAC += dexMod; // Light armor adds full Dex
            }
        }
        // Note: requiredStrength for heavy armor disadvantage (movement penalty) not implemented here
    }
    // If not proficient, AC remains Unarmored AC (10 + Dex Mod). 
    // D&D rules also state you can't cast spells if wearing armor you're not proficient with.
  }
  
  // Check for equipped shield
  const shieldItem = ITEMS_DATA["Escudo"]; // Assuming "Escudo" is the standard name
  if (equipmentNames.includes("Escudo") && shieldItem && shieldItem.type === 'shield') {
    if (charArmorProficiencies.includes("Escudos")) {
      calculatedAC += shieldItem.acBonus || 2;
    }
  }

  return calculatedAC;
};


export const getAttackRollDetails = (
  attacker: Character | Enemy,
  targetAC: number,
  weaponName: string, // This will now be an item ID from ITEMS_DATA
  isPlayerAttacker: boolean,
  advantage?: boolean,
  disadvantage?: boolean
): AttackRollResult => {
  let attackBonusValue = 0;
  let abilityMod = 0;
  let proficiencyBonusUsed = 0;
  let usedAbilityKey: AbilityKey = 'str';
  let attackerName = attacker.name;
  let damageRolls: DamageRoll[] = [];
  let totalDamageDealt = 0;
  let damageDetailsStr = "";

  const weaponItemData = ITEMS_DATA[weaponName];
  
  // Default to unarmed strike if weapon not found or not a weapon
  const actualWeaponData = (weaponItemData?.type === 'weapon' ? weaponItemData : ITEMS_DATA["Mano Desnuda"]) || 
                           { name: "Mano Desnuda", type: 'weapon', value: 0, damageDice: "1", damageType: "Contundente", attackAbility: 'str', weight: 0 } as ItemProperty;


  if (isPlayerAttacker && 'level' in attacker) {
    const player = attacker as Character;
    attackerName = player.name;
    const profBonus = getProficiencyBonus(player.level);

    usedAbilityKey = actualWeaponData.attackAbility || 'str'; // Default to STR if not specified
    if (actualWeaponData.properties?.includes('finesse') && player.abilities.dex > player.abilities.str) {
        usedAbilityKey = 'dex';
    }
    abilityMod = calculateAbilityModifier(player.abilities[usedAbilityKey]);
    attackBonusValue += abilityMod;
    
    // Check proficiency: either with the specific weapon name or its general category
    const isProficient = player.weaponProficiencies.some(prof => 
        prof.toLowerCase() === actualWeaponData.name.toLowerCase() || // Specific weapon proficiency
        (prof === "Armas Sencillas" && actualWeaponData.properties?.includes('sencilla')) || // Generic "Simple Weapons"
        (prof === "Armas Marciales" && actualWeaponData.properties?.includes('marcial')) || // Generic "Martial Weapons"
        // Fallback for items not explicitly tagged 'sencilla'/'marcial' but are generally considered such
        (prof === "Armas Sencillas" && ["Daga", "Maza", "Hoz", "Lanza", "Bastón", "Hacha de Mano", "Jabalina"].includes(actualWeaponData.name)) ||
        (prof === "Armas Marciales" && ["Espada Larga", "Hacha de Batalla", "Estoque", "Espada Corta", "Arco Largo", "Arco Corto", "Ballesta Ligera"].includes(actualWeaponData.name))
    );

    if (isProficient) {
      attackBonusValue += profBonus;
      proficiencyBonusUsed = profBonus;
    }
  } else { 
    const enemy = attacker as Enemy;
    attackerName = enemy.name;
    attackBonusValue = enemy.attackBonus; // This usually includes their ability mod and proficiency
    const enemyAttackInfo = enemy.attacks?.find(att => att.name === actualWeaponData.name); // Try to match with detailed enemy attacks
    usedAbilityKey = enemyAttackInfo?.damageModifierAbility || 'str'; // Default for enemy damage
    abilityMod = 0; // For enemies, assume abilityMod is baked into attackBonus unless more detailed stats are provided
  }

  const d20RollResult = rollD20({ advantage, disadvantage });
  const totalAttackRoll = d20RollResult.finalRoll + attackBonusValue;
  const isHit = d20RollResult.isCriticalSuccess ? true : d20RollResult.isCriticalFailure ? false : totalAttackRoll >= targetAC;
  
  let attackDetailsStr = `${attackerName} ataca con ${actualWeaponData.name}. D20: ${d20RollResult.finalRoll} (Tiradas: ${d20RollResult.individualRolls.join(', ')})`;
  if (advantage && !disadvantage) attackDetailsStr += " c/Ventaja"; 
  if (disadvantage && !advantage) attackDetailsStr += " c/Desventaja";
  attackDetailsStr += ` + Bono Atq ${attackBonusValue} (Mod ${usedAbilityKey.toUpperCase()}: ${abilityMod}, Comp: ${proficiencyBonusUsed}) = Total ${totalAttackRoll} vs CA ${targetAC}. `;
  attackDetailsStr += d20RollResult.isCriticalSuccess ? "¡GOLPE CRÍTICO!" : d20RollResult.isCriticalFailure ? "¡FALLO CRÍTICO!" : isHit ? "¡Impacto!" : "¡Fallo!";

  if (isHit) {
    const damageAbilityKeyForDamage = actualWeaponData.attackAbility || 'str'; // Usually same as attack for weapons
    let damageAbilityModValue = 0;

    if (isPlayerAttacker && 'abilities' in attacker) {
        const playerChar = attacker as Character;
        if(actualWeaponData.properties?.includes('finesse') && playerChar.abilities.dex > playerChar.abilities.str) {
            damageAbilityModValue = calculateAbilityModifier(playerChar.abilities.dex);
        } else {
            damageAbilityModValue = calculateAbilityModifier(playerChar.abilities[damageAbilityKeyForDamage]);
        }
    } else if ('dexterity' in attacker && actualWeaponData.name !== "Mano Desnuda") { // Enemy
         // For enemies, if they have specific attacks array, use that logic, else a generic one
        const enemyAttackInfo = (attacker as Enemy).attacks?.find(att => att.name === actualWeaponData.name);
        if (enemyAttackInfo && enemyAttackInfo.damageModifierAbility) {
            // This part is tricky if enemy doesn't have full ability scores. Assume dex based or str based from attackBonus
            // For simplicity, if damageModifierAbility is 'dex', use dex, else use a general mod if attackBonus implies it
            if (enemyAttackInfo.damageModifierAbility === 'dex') damageAbilityModValue = calculateAbilityModifier((attacker as Enemy).dexterity);
            // else if (enemyAttackInfo.damageModifierAbility === 'str') // would need enemy.strength
            // else default to 0 if no specific ability for damage is clear
        }
        // If no damageModifierAbility, assume it's baked into their damage dice or attackBonus, or it's 0.
    }
    
    // For "Mano Desnuda" (Unarmed Strike), damage mod is STR
    if (actualWeaponData.name === "Mano Desnuda" && isPlayerAttacker && 'abilities' in attacker) {
        damageAbilityModValue = calculateAbilityModifier((attacker as Character).abilities.str);
    }


    const baseDamageDice = actualWeaponData.damageDice || "1"; // e.g., "1d8", or "1" for 1 point of damage
    let numDamageDice = 1;
    let dieType = 4; // Default for simple unarmed or basic damage
    let fixedDamage = 0;

    if (baseDamageDice.includes('d')) {
        const parts = baseDamageDice.split('d');
        numDamageDice = parseInt(parts[0], 10);
        dieType = parseInt(parts[1], 10);
    } else {
        fixedDamage = parseInt(baseDamageDice, 10) || 1; // If not 'd' format, it's fixed damage
        numDamageDice = 0; // No dice to roll
    }

    if (d20RollResult.isCriticalSuccess && numDamageDice > 0) numDamageDice *= 2; // Double dice on crit

    let damageRollTotal = 0;
    let damageRollsIndividual: number[] = [];

    if (numDamageDice > 0) {
        const damageRoll = rollMultipleDice(numDamageDice, dieType);
        damageRollTotal = damageRoll.total;
        damageRollsIndividual = damageRoll.individualRolls;
    } else {
        damageRollTotal = fixedDamage; // Use fixed damage if no dice
    }
    
    const currentDamageTotal = Math.max(0, damageRollTotal + damageAbilityModValue); // Damage can't be negative
    
    damageRolls.push({ 
        diceCount: numDamageDice, 
        dieType, 
        rolls: damageRollsIndividual, 
        modifier: damageAbilityModValue, 
        total: currentDamageTotal, 
        damageType: actualWeaponData.damageType || "Genérico" 
    });
    totalDamageDealt += currentDamageTotal;
    
    damageDetailsStr += ` Daño (${numDamageDice > 0 ? `${numDamageDice}d${dieType}` : `${fixedDamage}`}): ${damageRollsIndividual.join('+')} (${damageRollTotal}) + Mod ${damageAbilityKeyForDamage.toUpperCase()} ${damageAbilityModValue} = ${currentDamageTotal} pts de daño ${actualWeaponData.damageType || ""}.`;
  }

  return {
    attackerName, targetName: 'Objetivo', attackBonusValue, abilityMod, proficiencyBonusUsed, usedAbilityKey,
    d20Rolls: d20RollResult.individualRolls, finalD20Roll: d20RollResult.finalRoll, totalAttackRoll, targetAC,
    isCriticalHit: d20RollResult.isCriticalSuccess, isCriticalMiss: d20RollResult.isCriticalFailure, isHit,
    advantageUsed: !!advantage && !disadvantage, disadvantageUsed: !!disadvantage && !advantage, details: attackDetailsStr,
    damageRolls, totalDamageDealt, damageDetails: damageDetailsStr,
  };
};

export const getSkillCheckResult = (
  character: Character,
  skillName: string,
  targetDC: number,
  advantage?: boolean,
  disadvantage?: boolean,
  preRolledD20?: D20RollResult 
): SkillCheckResult => {
  const abilityKey = SKILL_TO_ABILITY_MAP[skillName] || 'int'; 
  const abilityMod = calculateAbilityModifier(character.abilities[abilityKey]);
  let proficiencyBonusUsed = 0;
  let totalBonus = abilityMod;
  if (character.skills.includes(skillName)) {
    proficiencyBonusUsed = getProficiencyBonus(character.level);
    totalBonus += proficiencyBonusUsed;
  }

  const d20RollResultToUse = preRolledD20 || rollD20({ advantage, disadvantage });
  const finalRollValue = d20RollResultToUse.finalRoll + totalBonus;
  const isSuccess = d20RollResultToUse.isCriticalSuccess ? true : d20RollResultToUse.isCriticalFailure ? false : finalRollValue >= targetDC;

  const details = 
    `Prueba de ${skillName} (${abilityKey.toUpperCase()}): D20(${d20RollResultToUse.finalRoll}) ${d20RollResultToUse.withAdvantage ? '(V)' : ''}${d20RollResultToUse.withDisadvantage ? '(D)' : ''} +Mod(${abilityMod}) +Comp(${proficiencyBonusUsed}) = Total ${finalRollValue} vs CD ${targetDC}. ${isSuccess ? '¡Éxito!' : '¡Fallo!'}${d20RollResultToUse.isCriticalSuccess ? ' (CRIT)' : ''}${d20RollResultToUse.isCriticalFailure ? ' (PIFIA)' : ''}`;

  return {
    skillName, abilityKey, abilityMod, proficiencyBonusUsed, totalBonus, d20RollResult: d20RollResultToUse,
    finalRollValue, targetDC, isSuccess, 
    isCriticalSuccess: d20RollResultToUse.isCriticalSuccess, 
    isCriticalFailure: d20RollResultToUse.isCriticalFailure, 
    details,
  };
};

export const getSavingThrowResult = (
  character: Character,
  savingThrowAbility: AbilityKey,
  targetDC: number,
  advantage?: boolean,
  disadvantage?: boolean,
  preRolledD20?: D20RollResult
): SavingThrowResult => {
  const abilityMod = calculateAbilityModifier(character.abilities[savingThrowAbility]);
  let proficiencyBonusUsed = 0;
  let totalBonus = abilityMod;
  if (character.savingThrowProficiencies.includes(savingThrowAbility)) {
    proficiencyBonusUsed = getProficiencyBonus(character.level);
    totalBonus += proficiencyBonusUsed;
  }
  const d20RollResultToUse = preRolledD20 || rollD20({ advantage, disadvantage });
  const finalRollValue = d20RollResultToUse.finalRoll + totalBonus;
  const isSuccess = d20RollResultToUse.isCriticalSuccess ? true : d20RollResultToUse.isCriticalFailure ? false : finalRollValue >= targetDC;

  const details = 
    `Salvación de ${savingThrowAbility.toUpperCase()}: D20(${d20RollResultToUse.finalRoll}) ${d20RollResultToUse.withAdvantage ? '(V)' : ''}${d20RollResultToUse.withDisadvantage ? '(D)' : ''} +Mod(${abilityMod}) +Comp(${proficiencyBonusUsed}) = Total ${finalRollValue} vs CD ${targetDC}. ${isSuccess ? '¡Éxito!' : '¡Fallo!'}${d20RollResultToUse.isCriticalSuccess ? ' (ÉXITO CRIT)' : ''}${d20RollResultToUse.isCriticalFailure ? ' (FALLO CRIT)' : ''}`;
  return {
    savingThrowAbility, abilityMod, proficiencyBonusUsed, totalBonus, d20RollResult: d20RollResultToUse,
    finalRollValue, targetDC, isSuccess,
    isCriticalSuccess: d20RollResultToUse.isCriticalSuccess,
    isCriticalFailure: d20RollResultToUse.isCriticalFailure,
    details,
  };
};
// Funcion para calcular peso total (si se implementa)
// export const calculateCurrentCarryWeight = (equipmentNames: string[]): number => {
//   return equipmentNames.reduce((total, itemName) => {
//     const item = ITEMS_DATA[itemName];
//     return total + (item?.weight || 0);
//   }, 0);
// };
