
-- Create insurance_products table
CREATE TABLE public.insurance_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('Preferred', 'Standard', 'Graded', 'Modified')),
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
('Royal Neighbors Graded', 'Graded', 'Guaranteed acceptance coverage with graded benefits.', ARRAY[
  'Guaranteed acceptance',
  'No medical questions after qualification',
  'Coverage builds over time',
  'Final expense coverage'
]),
('Assurity Modified', 'Modified', 'Simplified issue coverage designed for those with health challenges.', ARRAY[
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
  'Do you have chronic obstructive pulmonary disease?',
  'Do you have chronic bronchitis?',
  'Do you have emphysema?',
  'Do you have an irregular heartbeat?',
  'Have you ever had a heart attack?'
]) AS question
WHERE name = 'Liberty Preferred';

-- Insert questions for Liberty Standard
INSERT INTO public.disqualifying_questions (product_id, question_text, question_order)
SELECT id, question, row_number() OVER () as question_order
FROM public.insurance_products,
UNNEST(ARRAY[
  'Do you have lymphedema?',
  'Have you had chemotherapy in the last three years?',
  'Have you had radiation therapy in the last three years?',
  'Do you have leukemia?',
  'Have you been diagnosed with cancer in the past 5 years?'
]) AS question
WHERE name = 'Liberty Standard';

-- Insert questions for Royal Neighbors Graded
INSERT INTO public.disqualifying_questions (product_id, question_text, question_order)
SELECT id, question, row_number() OVER () as question_order
FROM public.insurance_products,
UNNEST(ARRAY[
  'Do you have chronic kidney disease?',
  'Have you been on dialysis in the last year?',
  'Do you have HIV/AIDS?',
  'Have you had a stroke in the last 2 years?',
  'Have you been hospitalized for a serious illness in the last 6 months?'
]) AS question
WHERE name = 'Royal Neighbors Graded';

-- Insert questions for Assurity Modified
INSERT INTO public.disqualifying_questions (product_id, question_text, question_order)
SELECT id, question, row_number() OVER () as question_order
FROM public.insurance_products,
UNNEST(ARRAY[
  'Do you need assistance with daily living activities (eating, bathing)?',
  'Are you currently bedridden or in hospice care?',
  'Do you have Alzheimer''s or dementia?',
  'Have you had a major surgery in the past year?',
  'Have you had any organ transplant?'
]) AS question
WHERE name = 'Assurity Modified';
