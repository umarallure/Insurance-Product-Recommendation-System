
-- Create insurance_products table
CREATE TABLE public.insurance_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('Preferred', 'Standard', 'Graded', 'Modified','Ultimate')),
  description TEXT,
  benefits TEXT[], -- Array of benefit strings
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create disqualifying_questions table
CREATE TABLE public.disqualifying_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.insurance_products(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_responses table to track qualification sessions
CREATE TABLE public.user_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.disqualifying_questions(id) ON DELETE CASCADE,
  response BOOLEAN NOT NULL,
  answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create qualification_results table to store final recommendations
CREATE TABLE public.qualification_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  qualified_product_id UUID REFERENCES public.insurance_products(id),
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) - making tables publicly readable for now
-- You can modify these policies later based on your authentication needs
ALTER TABLE public.insurance_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disqualifying_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qualification_results ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (modify as needed)
CREATE POLICY "Allow public read access to insurance_products" 
  ON public.insurance_products FOR SELECT 
  TO public 
  USING (true);

CREATE POLICY "Allow public read access to disqualifying_questions" 
  ON public.disqualifying_questions FOR SELECT 
  TO public 
  USING (true);

CREATE POLICY "Allow public insert to user_responses" 
  ON public.user_responses FOR INSERT 
  TO public 
  WITH CHECK (true);

CREATE POLICY "Allow public insert to qualification_results" 
  ON public.qualification_results FOR INSERT 
  TO public 
  WITH CHECK (true);

-- Insert your existing products and questions
INSERT INTO public.insurance_products (name, tier, description, benefits) VALUES
('Liberty Preferred', 'Preferred', 'Our premium coverage with the best rates and most comprehensive benefits.', ARRAY[
  'Lowest premium rates',
  'Accelerated underwriting',
  'No medical exam required',
  'Coverage up to $1M'
]),
('Liberty Standard', 'Standard', 'Quality coverage with competitive rates for most applicants.', ARRAY[
  'Competitive premium rates',
  'Flexible coverage options',
  'Coverage up to $750K',
  'Multiple payment options'
]),
('Royal Graded', 'Graded', 'Guaranteed acceptance coverage with graded benefits.', ARRAY[
  'Guaranteed acceptance',
  'No medical questions after qualification',
  'Coverage builds over time',
  'Final expense coverage'
]),
('Liberty Modified', 'Modified', 'Simplified issue coverage designed for those with health challenges.', ARRAY[
  'Simplified application process',
  'Immediate coverage available',
  'No health exam required',
  'Final expense protection'
]),
('Guaranteed Issue', 'Ultimate', 'Simplified issue coverage designed for those with health challenges.', ARRAY[
  'Simplified application process',
  'Immediate coverage available',
  'No health exam required',
  'Final expense protection'
]);

-- Insert questions for Liberty Preferred
INSERT INTO public.disqualifying_questions (product_id, question_text, question_order)
SELECT id, question, row_number() OVER () as question_order
FROM public.insurance_products,
UNNEST(ARRAY[
'Do you have Chronic Obstructive Pulmonary Disease (COPD)?',
'Do you have chronic bronchitis?',
'Do you have emphysema?',
'Do you have an irregular heartbeat?',      
'Do you have atrial fibrillation?',
'Do you have peripheral vascular disease?',
'Do you have peripheral artery disease?',
'Do you have insulin-dependent diabetes?',
'Have you had epileptic seizures within the last two years?',
'Have you had a Transient Ischemic Attack (TIA / mini-stroke) within the last two years?'
]) AS question
WHERE name = 'Liberty Preferred';

-- Insert questions for Liberty Standard
INSERT INTO public.disqualifying_questions (product_id, question_text, question_order)
SELECT id, question, row_number() OVER () as question_order
FROM public.insurance_products,
UNNEST(ARRAY[
  'Have you had lymphoma, leukemia, or any cancer (excluding basal cell skin cancer) within the last 3 years?',
  'Have you undergone chemotherapy or radiation in the last 3 years?',
  'Have you had angina, heart or circulatory disease, valve disorder, heart attack, pacemaker, or stent within the last two years?',
  'Have you had a stroke (excluding mini-stroke/TIA) or paralysis within the last two years?',
  'Have you had an aneurysm, brain tumor, or sickle cell anemia within the last two years?',
  'Do you have diabetic complications affecting your kidneys, nerves, or eyes?',
  'Do you have multiple sclerosis, Parkinsons disease, or require a walker, wheelchair, or scooter due to a chronic illness?',
  'Do you have chronic hepatitis, Hepatitis C, cirrhosis, chronic pancreatitis, kidney disease, or systemic lupus (SLE)?',
  'Have you been convicted of a felony or misdemeanor, or have a pending charge within the last two years?'
]) AS question
WHERE name = 'Liberty Standard';

-- Insert questions for Royal Neighbors Graded
INSERT INTO public.disqualifying_questions (product_id, question_text, question_order)
SELECT id, question, row_number() OVER () as question_order
FROM public.insurance_products,
UNNEST(ARRAY[
  'Do you need assistance with activities of daily living (ADLs)?',
  'Do you have AIDS?',
  'Do you have ALS (Lou Gehrig’s Disease)?',
  'Have you completed cancer treatment within the last two years?',
  'Have you had more than one occurrence of cancer?',
  'Do you have chronic kidney disease and are currently on dialysis?',
  'Are you currently undergoing or have you been recommended to have testing or evaluation for a condition that has not been diagnosed?',
  'Have you had an organ transplant?',
  'Do you use oxygen of any kind?',
  'Do you regularly use a wheelchair or electric scooter?',
  'Do you have sickle cell anemia?',
  'Do you have systemic lupus (SLE)?',
  'Have you been diagnosed with a terminal illness?',
  'Do you have Alzheimer’s disease, dementia, or experience memory loss?',
  'Have you been diagnosed with chronic kidney disease within the last year?',
  'Do you have cirrhosis?',
  'Do you have congestive heart failure?',
  'Are you currently hospitalized?',
  'Have you ever used a defibrillator?',
  'Are you currently in a hospice, nursing home, long-term care, or memory care facility?',
  'Have you been diagnosed with kidney failure within the last year?'
]) AS question
WHERE name = 'Royal Graded';

-- Insert questions for Assurity Modified
INSERT INTO public.disqualifying_questions (product_id, question_text, question_order)
SELECT id, question, row_number() OVER () as question_order
FROM public.insurance_products,
UNNEST(ARRAY[
  'Do you have a heart defibrillator implant?',
  'Do you have kidney failure or require dialysis?',
  'Do you have congestive heart failure (CHF)?',
  'Have you been diagnosed with cardiomyopathy?',
  'Do you experience memory loss, Alzheimers disease, senile dementia, or other forms of dementia?',
  'Have you had an organ transplant (excluding corneal transplants)?',
  'Have you had two or more instances of internal cancer?',
  'Have you been diagnosed with a terminal illness with an expected death within 24 months?',
  'Have you had a bone marrow transplant or stem cell treatment?',
  'Do you have muscular dystrophy?',
  'Do you have any form of mental incapacity?',
  'Do you have ALS (Lou Gehrigs disease)?',
  'Do you have Downs syndrome?',
  'Do you have cystic fibrosis?',
  'Do you have Huntingtons disease?',
  'Were you diagnosed with diabetes at age 9 or younger?',
  'Do you have AIDS, AIDS-related complex, HIV, or any other immune system disorder?',
  'Have you had uncontrolled diabetes or high blood pressure within the last two years?',
  'Have you ever experienced a diabetic coma or insulin shock?',
  'Have you had an amputation due to diabetic complications?',
  'Have you been advised to have surgery or hospitalization but have not yet completed it?',
  'Do you have pulmonary fibrosis?',
  'Do you have schizophrenia?',
  'Do you have a history of alcohol or drug abuse?',
  'Do you currently use illegal drugs or are you dependent on prescription medication?',
  'Have you been hospitalized for more than 5 days within the last year?',
  'Do you use oxygen due to a medical condition?',
  'Are you bedridden or unable to care for yourself?',
  'Are you currently residing in a nursing home, hospice, long-term care, or assisted living facility?'
]) AS question
WHERE name = 'Liberty Modified';


-- Insert questions for Assurity Modified
INSERT INTO public.disqualifying_questions (product_id, question_text, question_order)
SELECT id, question, row_number() OVER () as question_order
FROM public.insurance_products,
UNNEST(ARRAY[
  'Have you applied for life insurance coverage within the past year?',
  'Do you currently have a policy with an effective date within the past year?'
]) AS question
WHERE name = 'Guaranteed Issue';