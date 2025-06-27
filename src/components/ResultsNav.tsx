import { Button } from "./Button";
import { type ResultsNavProps } from "../types/quiz";

export const ResultsNav = ({ questionResults, selectedQuestionIndex, onQuestionSelect }: ResultsNavProps) => {
  return (
    <div className="grid lg:grid-cols-5 md:grid-cols-4 grid-cols-5 items-center justify-center gap-2">
      {questionResults.map((result, index) => {
        const isSelected = index === selectedQuestionIndex;
        const variant = isSelected ? "default" : result.isCorrect ? "outline" : "destructive";
        
        return (
          <Button 
            key={result.id}
            className="flex items-center justify-center" 
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
