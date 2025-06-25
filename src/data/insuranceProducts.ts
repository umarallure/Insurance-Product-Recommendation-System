
export interface InsuranceProduct {
  name: string;
  tier: 'Preferred' | 'Standard' | 'Graded' | 'Modified';
  disqualifying_questions: string[];
  description: string;
  benefits: string[];
}

export const insuranceProducts: InsuranceProduct[] = [
  {
    name: "Liberty Preferred",
    tier: "Preferred",
    description: "Our premium coverage with the best rates and most comprehensive benefits.",
    benefits: [
      "Lowest premium rates",
      "Accelerated underwriting",
      "No medical exam required",
      "Coverage up to $1M"
    ],
    disqualifying_questions: [
      "Do you have chronic obstructive pulmonary disease?",
      "Do you have chronic bronchitis?", 
      "Do you have emphysema?",
      "Do you have an irregular heartbeat?",
      "Have you ever had a heart attack?"
    ]
  },
  {
    name: "Liberty Standard",
    tier: "Standard",
    description: "Quality coverage with competitive rates for most applicants.",
    benefits: [
      "Competitive premium rates",
      "Flexible coverage options",
      "Coverage up to $750K",
      "Multiple payment options"
    ],
    disqualifying_questions: [
      "Do you have lymphedema?",
      "Have you had chemotherapy in the last three years?",
      "Have you had radiation therapy in the last three years?",
      "Do you have leukemia?",
      "Have you been diagnosed with cancer in the past 5 years?"
    ]
  },
  {
    name: "Royal Neighbors Graded",
    tier: "Graded",
    description: "Guaranteed acceptance coverage with graded benefits.",
    benefits: [
      "Guaranteed acceptance",
      "No medical questions after qualification",
      "Coverage builds over time",
      "Final expense coverage"
    ],
    disqualifying_questions: [
      "Do you have chronic kidney disease?",
      "Have you been on dialysis in the last year?",
      "Do you have HIV/AIDS?",
      "Have you had a stroke in the last 2 years?",
      "Have you been hospitalized for a serious illness in the last 6 months?"
    ]
  },
  {
    name: "Assurity Modified",
    tier: "Modified",
    description: "Simplified issue coverage designed for those with health challenges.",
    benefits: [
      "Simplified application process",
      "Immediate coverage available",
      "No health exam required",
      "Final expense protection"
    ],
    disqualifying_questions: [
      "Do you need assistance with daily living activities (eating, bathing)?",
      "Are you currently bedridden or in hospice care?",
      "Do you have Alzheimer's or dementia?",
      "Have you had a major surgery in the past year?",
      "Have you had any organ transplant?"
    ]
  }
];
