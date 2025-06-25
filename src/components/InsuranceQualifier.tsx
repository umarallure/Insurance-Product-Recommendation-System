import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Heart, Shield, Star, FileText, Loader2 } from 'lucide-react';
import { useInsuranceData, InsuranceProduct } from '@/hooks/useInsuranceData';
import { useQualificationSession } from '@/hooks/useQualificationSession';

interface QualificationState {
  currentProductIndex: number;
  askedQuestions: Set<string>;
  currentQuestionIndex: number;
  qualifiedProduct: InsuranceProduct | null;
  isComplete: boolean;
  responses: { [question: string]: boolean };
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

  // Get unique questions for current product that haven't been asked
  const getUniqueQuestionsForCurrentProduct = () => {
    if (!products[state.currentProductIndex]) return [];
    const currentProduct = products[state.currentProductIndex];
    return currentProduct.disqualifying_questions.filter(
      question => !state.askedQuestions.has(question)
    );
  };

  // Initialize or update current question
  useEffect(() => {
    if (!showIntro && !state.isComplete && products.length > 0) {
      const uniqueQuestions = getUniqueQuestionsForCurrentProduct();
      if (uniqueQuestions.length > 0 && state.currentQuestionIndex < uniqueQuestions.length) {
        setCurrentQuestion(uniqueQuestions[state.currentQuestionIndex]);
      }
    }
  }, [state.currentProductIndex, state.currentQuestionIndex, showIntro, state.isComplete, products]);

  const handleAnswer = async (answer: boolean) => {
    const question = currentQuestion;
    
    // Save response to database (note: we don't have question IDs in the current structure)
    // For now, we'll just save the response locally
    
    setState(prev => ({
      ...prev,
      askedQuestions: new Set([...prev.askedQuestions, question]),
      responses: { ...prev.responses, [question]: answer }
    }));

    if (answer) {
      // Disqualified from current product, move to next tier
      moveToNextProduct();
    } else {
      // Continue with next question for current product
      const uniqueQuestions = getUniqueQuestionsForCurrentProduct();
      if (state.currentQuestionIndex + 1 < uniqueQuestions.length) {
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
    if (state.currentProductIndex + 1 < products.length) {
      setState(prev => ({
        ...prev,
        currentProductIndex: prev.currentProductIndex + 1,
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
  const uniqueQuestions = getUniqueQuestionsForCurrentProduct();
  const questionProgress = uniqueQuestions.length > 0 ? 
    ((state.currentQuestionIndex + 1) / uniqueQuestions.length) * 100 : 100;

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
              Question {state.currentQuestionIndex + 1} of {uniqueQuestions.length} for {currentProduct?.name}
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
