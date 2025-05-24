
import type { Character } from '../types';
import { LOCAL_STORAGE_CHARACTER_KEY } from '../constants';

export const saveCharacter = (character: Character): void => {
  try {
    const characterJson = JSON.stringify(character);
    localStorage.setItem(LOCAL_STORAGE_CHARACTER_KEY, characterJson);
  } catch (error) {
    console.error("Error saving character to local storage:", error);
    // Optionally, notify the user or handle the error more gracefully
  }
};

export const loadCharacter = (): Character | null => {
  try {
    const characterJson = localStorage.getItem(LOCAL_STORAGE_CHARACTER_KEY);
    if (characterJson === null) {
      return null;
    }
    return JSON.parse(characterJson) as Character;
  } catch (error) {
    console.error("Error loading character from local storage:", error);
    // If parsing fails or data is corrupted, remove the faulty item
    localStorage.removeItem(LOCAL_STORAGE_CHARACTER_KEY);
    return null;
  }
};

export const clearCharacter = (): void => {
  try {
    localStorage.removeItem(LOCAL_STORAGE_CHARACTER_KEY);
  } catch (error) {
    console.error("Error clearing character from local storage:", error);
  }
};
    