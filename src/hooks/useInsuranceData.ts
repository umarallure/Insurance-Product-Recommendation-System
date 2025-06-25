
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DatabaseProduct, DatabaseQuestion } from '@/types/database';

export interface InsuranceProduct {
  id: string;
  name: string;
  tier: 'Preferred' | 'Standard' | 'Graded' | 'Modified';
  description: string;
  benefits: string[];
  disqualifying_questions: string[];
}

export const useInsuranceData = () => {
  const [products, setProducts] = useState<InsuranceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products
        const { data: productsData, error: productsError } = await supabase
          .from('insurance_products')
          .select('*')
          .order('tier');

        if (productsError) throw productsError;

        // Fetch questions
        const { data: questionsData, error: questionsError } = await supabase
          .from('disqualifying_questions')
          .select('*')
          .order('product_id, question_order');

        if (questionsError) throw questionsError;

        // Combine products with their questions
        const productsWithQuestions: InsuranceProduct[] = (productsData as DatabaseProduct[]).map(product => ({
          id: product.id,
          name: product.name,
          tier: product.tier,
          description: product.description || '',
          benefits: product.benefits || [],
          disqualifying_questions: (questionsData as DatabaseQuestion[])
            .filter(q => q.product_id === product.id)
            .map(q => q.question_text)
        }));

        setProducts(productsWithQuestions);
      } catch (err) {
        console.error('Error fetching insurance data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { products, loading, error };
};
