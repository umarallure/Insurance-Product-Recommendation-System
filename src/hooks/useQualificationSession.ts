
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export const useQualificationSession = () => {
  const [sessionId] = useState(() => uuidv4());

  const saveResponse = async (questionId: string, response: boolean) => {
    try {
      const { error } = await supabase
        .from('user_responses')
        .insert({
          session_id: sessionId,
          question_id: questionId,
          response
        });

      if (error) throw error;
    } catch (err) {
      console.error('Error saving response:', err);
    }
  };

  const saveResult = async (qualifiedProductId: string | null) => {
    try {
      const { error } = await supabase
        .from('qualification_results')
        .insert({
          session_id: sessionId,
          qualified_product_id: qualifiedProductId
        });

      if (error) throw error;
    } catch (err) {
      console.error('Error saving result:', err);
    }
  };

  return { sessionId, saveResponse, saveResult };
};
