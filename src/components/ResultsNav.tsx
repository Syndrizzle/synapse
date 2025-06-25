import { Button } from "./Button";

interface QuestionResult {
  questionId: string;
  userAnswer: number | null;
  correctAnswer: number;
  isCorrect: boolean;
  question: string;
  options: string[];
  explanation: string;
  topic: string;
}

interface ResultsNavProps {
  questionResults: QuestionResult[];
  selectedQuestionIndex: number;
  onQuestionSelect: (index: number) => void;
}

export const ResultsNav = ({ questionResults, selectedQuestionIndex, onQuestionSelect }: ResultsNavProps) => {
  return (
    <div className="grid lg:grid-cols-5 md:grid-cols-4 grid-cols-5 items-center justify-center gap-2">
      {questionResults.map((result, index) => {
        const isSelected = index === selectedQuestionIndex;
        const variant = isSelected ? "default" : result.isCorrect ? "outline" : "destructive";
        
        return (
          <Button 
            key={result.questionId}
            className="flex items-center justify-center" 
            size={"lg"}
            variant={variant}
            onClick={() => onQuestionSelect(index)}
          >
            {index + 1}.
          </Button>
        );
      })}
    </div>
  );
}
