
export interface D20RollOptions {
  advantage?: boolean;
  disadvantage?: boolean;
}

export interface D20RollResult {
  finalRoll: number;
  individualRolls: number[];
  isCriticalSuccess: boolean;
  isCriticalFailure: boolean;
  withAdvantage: boolean;
  withDisadvantage: boolean;
}

export const rollDie = (dieType: number): number => {
  if (dieType <= 0) throw new Error("El tipo de dado debe ser positivo.");
  return Math.floor(Math.random() * dieType) + 1;
};

export const rollDice = (numDice: number, dieType: number): { total: number, individualRolls: number[] } => {
  if (numDice <= 0) throw new Error("El número de dados debe ser positivo.");
  const individualRolls: number[] = [];
  let total = 0;
  for (let i = 0; i < numDice; i++) {
    const roll = rollDie(dieType);
    individualRolls.push(roll);
    total += roll;
  }
  return { total, individualRolls };
};

export const rollD20 = (options?: D20RollOptions): D20RollResult => {
  const advantage = options?.advantage ?? false;
  const disadvantage = options?.disadvantage ?? false;

  const roll1 = rollDie(20);
  let finalRoll = roll1;
  const individualRolls = [roll1];

  if (advantage && disadvantage) {
    // Si ambas, se anulan, es una tirada normal
  } else if (advantage) {
    const roll2 = rollDie(20);
    individualRolls.push(roll2);
    finalRoll = Math.max(roll1, roll2);
  } else if (disadvantage) {
    const roll2 = rollDie(20);
    individualRolls.push(roll2);
    finalRoll = Math.min(roll1, roll2);
  }

  // Un 20 natural en el resultado final (después de ventaja/desventaja) es crítico.
  // Un 1 natural en el resultado final (después de ventaja/desventaja) es fallo crítico.
  const isCriticalSuccess = finalRoll === 20;
  const isCriticalFailure = finalRoll === 1;
  
  // Para ser más precisos con las reglas de D&D 5e:
  // Un 20 natural *en el dado* es un crítico, incluso si el total modificado no fuera a impactar.
  // Un 1 natural *en el dado* es un fallo automático, incluso si el total modificado fuera a impactar.
  // La lógica actual de `finalRoll` ya refleja el dado que se usó.

  return {
    finalRoll,
    individualRolls,
    isCriticalSuccess,
    isCriticalFailure,
    withAdvantage: advantage && !disadvantage,
    withDisadvantage: disadvantage && !advantage,
  };
};
