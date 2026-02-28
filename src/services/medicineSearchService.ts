import { Medicine } from '../types';

interface SearchResult {
  medicine: Medicine;
  matchScore: number;
}

// Common medicines database for search suggestions
const COMMON_MEDICINES = [
  { name: 'Aspirin', category: 'Pain Relief' },
  { name: 'Ibuprofen', category: 'Pain Relief' },
  { name: 'Paracetamol', category: 'Pain Relief' },
  { name: 'Metformin', category: 'Diabetes' },
  { name: 'Amlodipine', category: 'Blood Pressure' },
  { name: 'Losartan', category: 'Blood Pressure' },
  { name: 'Atorvastatin', category: 'Cholesterol' },
  { name: 'Rosuvastatin', category: 'Cholesterol' },
  { name: 'Omeprazole', category: 'Gastric' },
  { name: 'Pantoprazole', category: 'Gastric' },
  { name: 'Levothyroxine', category: 'Thyroid' },
  { name: 'Cetirizine', category: 'Allergy' },
  { name: 'Loratadine', category: 'Allergy' },
  { name: 'Amla', category: 'Ayurvedic' },
  { name: 'Ashwagandha', category: 'Ayurvedic' },
  { name: 'Turmeric', category: 'Ayurvedic' },
  { name: 'Glibenclamide', category: 'Diabetes' },
  { name: 'Glipizide', category: 'Diabetes' },
  { name: 'Telmisartan', category: 'Blood Pressure' },
  { name: 'Bisoprolol', category: 'Heart' },
];

export const searchMedicines = (
  query: string,
  medicines: Medicine[]
): SearchResult[] => {
  if (!query.trim()) return [];
  
  const lowerQuery = query.toLowerCase();
  const results: SearchResult[] = [];
  
  medicines.forEach(medicine => {
    const name = medicine.name.toLowerCase();
    const dosage = medicine.dosage.toLowerCase();
    
    let matchScore = 0;
    
    if (name.includes(lowerQuery)) {
      matchScore += 10;
      if (name.startsWith(lowerQuery)) matchScore += 5;
    }
    
    if (dosage.includes(lowerQuery)) {
      matchScore += 5;
    }
    
    if (matchScore > 0) {
      results.push({ medicine, matchScore });
    }
  });
  
  return results.sort((a, b) => b.matchScore - a.matchScore);
};

export const getMedicineSuggestions = (query: string): string[] => {
  if (!query.trim()) return [];
  
  const lowerQuery = query.toLowerCase();
  
  return COMMON_MEDICINES
    .filter(med => med.name.toLowerCase().includes(lowerQuery))
    .slice(0, 5)
    .map(med => med.name);
};

export const getCommonMedicines = (): { name: string; category: string }[] => {
  return COMMON_MEDICINES;
};

export const filterMedicinesByFrequency = (
  medicines: Medicine[],
  frequency: string
): Medicine[] => {
  return medicines.filter(med => 
    med.frequency.toLowerCase() === frequency.toLowerCase()
  );
};

export const sortMedicinesByStock = (
  medicines: Medicine[],
  ascending: boolean = true
): Medicine[] => {
  return [...medicines].sort((a, b) => 
    ascending ? a.stock - b.stock : b.stock - a.stock
  );
};
