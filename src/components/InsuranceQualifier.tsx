import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Heart, Shield, Star, FileText, Loader2 } from 'lucide-react';
import { useInsuranceData, InsuranceProduct } from '@/hooks/useInsuranceData';
import { useQualificationSession } from '@/hooks/useQualificationSession';
import { toast } from '@/components/ui/use-toast';

interface QualificationState {
  currentProductIndex: number;
  askedQuestions: Set<string>;
  currentQuestionIndex: number;
  qualifiedProduct: InsuranceProduct | null;
  isComplete: boolean;
  responses: { [question: string]: boolean };
}

// This component implements the insurance qualification flow:
// 1. Start with "Liberty Preferred" and ask all its questions.
// 2. If the user is disqualified by any question, move to the next product and repeat.
// 3. Continue until a product is qualified or all are exhausted.
// 4. Every question for each product is asked (no skipping).
// 5. (Future) To avoid repetitive questions across products, deduplication logic can be added.
// Map of normalized common question keys to the products they affect
const COMMON_QUESTION_MAP: Record<string, string[]> = {
  // Normalize by lowercasing and removing punctuation/extra spaces for matching
  // --- Existing mappings ---
  'do you use oxygen': ['Royal Graded', 'Liberty Modified'],
  'do you have als': ['Royal Graded', 'Liberty Modified'],
  'do you have congestive heart failure': ['Royal Graded', 'Liberty Modified'],
  'have you had an organ transplant': ['Royal Graded', 'Liberty Modified'],
  'have you been diagnosed with a terminal illness': ['Royal Graded', 'Liberty Modified'],
  'do you experience memory loss': ['Royal Graded', 'Liberty Modified'],
  'do you have systemic lupus': ['Royal Graded', 'Liberty Standard'],
  'do you have sickle cell anemia': ['Royal Graded', 'Liberty Standard'],
  'do you have kidney failure': ['Royal Graded', 'Liberty Modified'],
  'do you have chronic kidney disease': ['Royal Graded', 'Liberty Modified'],
  'do you have insulin-dependent diabetes': ['Liberty Preferred', 'Liberty Standard'],
  'do you have diabetic complications': ['Liberty Preferred', 'Liberty Standard'],
  'were you diagnosed with diabetes at age 9 or younger': ['Liberty Preferred', 'Liberty Standard', 'Liberty Modified'],
  'have you had two or more instances of internal cancer': ['Royal Graded', 'Liberty Modified'],
  'have you had more than one occurrence of cancer': ['Royal Graded', 'Liberty Modified'],
  'do you use a wheelchair': ['Liberty Preferred', 'Liberty Standard'],
  'do you use a walker': ['Liberty Preferred', 'Liberty Standard'],
  'do you use a scooter': ['Liberty Preferred', 'Liberty Standard'],
  'do you have a heart defibrillator implant': ['Royal Graded', 'Liberty Modified'],
  'have you ever used a defibrillator': ['Royal Graded', 'Liberty Modified'],
  'are you currently residing in a nursing home': ['Royal Graded', 'Liberty Modified'],
  'are you currently in a hospice': ['Royal Graded', 'Liberty Modified'],
  'are you currently in a nursing home': ['Royal Graded', 'Liberty Modified'],
  'are you currently in a long-term care': ['Royal Graded', 'Liberty Modified'],
  'are you currently in a memory care facility': ['Royal Graded', 'Liberty Modified'],
  'are you currently residing in a hospice': ['Royal Graded', 'Liberty Modified'],
  'are you currently residing in a long-term care': ['Royal Graded', 'Liberty Modified'],
  'are you currently residing in a memory care facility': ['Royal Graded', 'Liberty Modified'],
  // --- New mappings for Liberty Preferred & Liberty Standard commons ---
  'have you had a tia': ['Liberty Preferred', 'Liberty Standard'],
  'have you had a mini stroke': ['Liberty Preferred', 'Liberty Standard'],
  'have you had a stroke': ['Liberty Preferred', 'Liberty Standard'],
  'have you had paralysis within the last two years': ['Liberty Preferred', 'Liberty Standard'],
  'do you have irregular heartbeat': ['Liberty Preferred', 'Liberty Standard'],
  'do you have heart or circulatory disease': ['Liberty Preferred', 'Liberty Standard'],
  'do you have valve disorder': ['Liberty Preferred', 'Liberty Standard'],
  'do you have angina': ['Liberty Preferred', 'Liberty Standard'],
  'do you have pacemaker': ['Liberty Preferred', 'Liberty Standard'],
  'do you have stent': ['Liberty Preferred', 'Liberty Standard'],
  'do you have atrial fibrillation': ['Liberty Preferred', 'Liberty Standard'],
  'do you have parkinsons': ['Liberty Preferred', 'Liberty Standard'],
  'do you have epileptic seizures': ['Liberty Preferred', 'Liberty Standard'],
  'do you have multiple sclerosis': ['Liberty Preferred', 'Liberty Standard'],
  'do you have mobility limitations': ['Liberty Preferred', 'Liberty Standard'],
  'do you have peripheral vascular disease': ['Liberty Preferred', 'Liberty Standard'],
  'do you have peripheral artery disease': ['Liberty Preferred', 'Liberty Standard'],
  'do you have circulatory problems': ['Liberty Preferred', 'Liberty Standard'],
};

function normalizeQuestion(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const InsuranceQualifier = () => {
  const { products, loading, error } = useInsuranceData();
  const { saveResponse, saveResult } = useQualificationSession();
  
  const [state, setState] = useState<QualificationState>({
    currentProductIndex: 0,
    askedQuestions: new Set(),
    currentQuestionIndex: 0,
    qualifiedProduct: null,
    isComplete: false,
    responses: {}
  });

  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [showIntro, setShowIntro] = useState(true);
  // Track products to auto-disqualify due to common question disqualification
  const [autoDisqualifiedProducts, setAutoDisqualifiedProducts] = useState<Set<string>>(new Set());

  // Get all questions for the current product (no filtering)
  const getQuestionsForCurrentProduct = () => {
    if (!products[state.currentProductIndex]) return [];
    return products[state.currentProductIndex].disqualifying_questions;
  };

  // Initialize or update current question
  useEffect(() => {
    if (!showIntro && !state.isComplete && products.length > 0) {
      const questions = getQuestionsForCurrentProduct();
      if (questions.length > 0 && state.currentQuestionIndex < questions.length) {
        setCurrentQuestion(questions[state.currentQuestionIndex]);
      }
    }
  }, [state.currentProductIndex, state.currentQuestionIndex, showIntro, state.isComplete, products]);

  // Handles the user's answer to a question.
  // If the answer is disqualifying ("Yes"), move to the next product.
  // Otherwise, continue to the next question for the current product.
  const handleAnswer = async (answer: boolean) => {
    const question = currentQuestion;
    setState(prev => ({
      ...prev,
      askedQuestions: new Set([...prev.askedQuestions, question]),
      responses: { ...prev.responses, [question]: answer }
    }));

    const questions = getQuestionsForCurrentProduct();
    const normalized = normalizeQuestion(question);

    if (answer) {
      // If this is a common question, mark all affected products for auto-disqualification
      if (COMMON_QUESTION_MAP[normalized]) {
        setAutoDisqualifiedProducts(prev => {
          const newSet = new Set(prev);
          for (const prod of COMMON_QUESTION_MAP[normalized]) {
            newSet.add(prod);
          }
          return newSet;
        });
      }
      // Disqualified from current product, show notification and move to next product
      toast({
        title: `Disqualified for ${products[state.currentProductIndex].name}`,
        description: `We'll try to qualify you for the next available product.`,
        variant: 'destructive',
      });
      moveToNextProduct();
    } else {
      // Continue with next question for current product
      if (state.currentQuestionIndex + 1 < questions.length) {
        setState(prev => ({
          ...prev,
          currentQuestionIndex: prev.currentQuestionIndex + 1
        }));
      } else {
        // Qualified for current product
        const qualifiedProduct = products[state.currentProductIndex];
        setState(prev => ({
          ...prev,
          qualifiedProduct,
          isComplete: true
        }));
        // Save result to database
        await saveResult(qualifiedProduct.id);
      }
    }
  };

  const moveToNextProduct = async () => {
    let nextIndex = state.currentProductIndex + 1;
    // Skip any products that are auto-disqualified
    while (nextIndex < products.length && autoDisqualifiedProducts.has(products[nextIndex].name)) {
      toast({
        title: `Auto-disqualified for ${products[nextIndex].name}`,
        description: `You were already disqualified for a common question in a previous product.`,
        variant: 'destructive',
      });
      nextIndex++;
    }
    if (nextIndex < products.length) {
      setState(prev => ({
        ...prev,
        currentProductIndex: nextIndex,
        currentQuestionIndex: 0
      }));
    } else {
      // No more products to try
      setState(prev => ({
        ...prev,
        isComplete: true,
        qualifiedProduct: null
      }));
      // Save result to database (no qualification)
      await saveResult(null);
    }
  };

  const startQualification = () => {
    setShowIntro(false);
  };

  const restart = () => {
    setState({
      currentProductIndex: 0,
      askedQuestions: new Set(),
      currentQuestionIndex: 0,
      qualifiedProduct: null,
      isComplete: false,
      responses: {}
    });
    setShowIntro(true);
  };

  const getTotalProgress = () => {
    if (products.length === 0) return 0;
    const totalQuestions = Array.from(new Set(
      products.flatMap(p => p.disqualifying_questions)
    )).length;
    return totalQuestions > 0 ? (state.askedQuestions.size / totalQuestions) * 100 : 0;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mr-2" />
            <span>Loading insurance products...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="py-12 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Data</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showIntro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              Find Your Perfect Insurance
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 mt-2">
              We'll recommend the best insurance product for you by asking a few health questions.
              We start with our premium options and find what works best for your situation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map((product, index) => (
                <div key={product.id} className="text-center p-4 rounded-lg bg-white border-2 border-gray-100">
                  <div className="flex items-center justify-center mb-2">
                    {index === 0 && <Star className="w-5 h-5 text-yellow-500 mr-1" />}
                    {index === 1 && <Shield className="w-5 h-5 text-blue-500 mr-1" />}
                    {index === 2 && <Heart className="w-5 h-5 text-green-500 mr-1" />}
                    {index === 3 && <FileText className="w-5 h-5 text-purple-500 mr-1" />}
                    <Badge variant={index === 0 ? "default" : "secondary"}>
                      {product.tier}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-sm">{product.name}</h3>
                </div>
              ))}
            </div>
            <Button onClick={startQualification} className="w-full text-lg py-6 bg-blue-600 hover:bg-blue-700">
              Start Qualification Process
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state.isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            {state.qualifiedProduct ? (
              <>
                <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900">
                  Congratulations!
                </CardTitle>
                <CardDescription className="text-lg text-gray-600 mt-2">
                  You qualify for {state.qualifiedProduct.name}
                </CardDescription>
              </>
            ) : (
              <>
                <div className="mx-auto w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center mb-4">
                  <XCircle className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900">
                  No Qualifying Products
                </CardTitle>
                <CardDescription className="text-lg text-gray-600 mt-2">
                  Based on your responses, none of our current products are a match.
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {state.qualifiedProduct && (
              <div className="bg-white p-6 rounded-lg border-2 border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">{state.qualifiedProduct.name}</h3>
                  <Badge className="bg-green-100 text-green-800">
                    {state.qualifiedProduct.tier}
                  </Badge>
                </div>
                <p className="text-gray-600 mb-4">{state.qualifiedProduct.description}</p>
                <div className="space-y-2">
                  <h4 className="font-semibold">Key Benefits:</h4>
                  <ul className="space-y-1">
                    {state.qualifiedProduct.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            <div className="flex gap-4">
              <Button onClick={restart} variant="outline" className="flex-1">
                Start Over
              </Button>
              {state.qualifiedProduct && (
                <Button className="flex-1 bg-green-600 hover:bg-green-700">
                  Apply Now
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentProduct = products[state.currentProductIndex];
  const questions = getQuestionsForCurrentProduct();
  const questionProgress = questions.length > 0 ? 
    ((state.currentQuestionIndex + 1) / questions.length) * 100 : 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Progress indicator */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-gray-500">{Math.round(getTotalProgress())}%</span>
            </div>
            <Progress value={getTotalProgress()} className="mb-4" />
            <div className="flex items-center justify-between text-sm">
              <span>Currently qualifying for:</span>
              <Badge variant={state.currentProductIndex === 0 ? "default" : "secondary"}>
                {currentProduct?.name}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Question card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Health Question</CardTitle>
            <CardDescription>
              Question {state.currentQuestionIndex + 1} of {questions.length} for {currentProduct?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-lg font-medium leading-relaxed">
              {currentQuestion}
            </div>
            <div className="flex gap-4">
              <Button 
                onClick={() => handleAnswer(true)}
                variant="outline"
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
              >
                Yes
              </Button>
              <Button 
                onClick={() => handleAnswer(false)}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                No
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InsuranceQualifier;
