import React from 'react';

interface NumberGridProps {
  availableNumbers: number[];
  takenNumbers: number[];
  selectedNumbers: number[];
  onToggleNumber: (number: number) => void;
  disabled?: boolean;
}

const NumberGrid: React.FC<NumberGridProps> = ({
  availableNumbers,
  takenNumbers,
  selectedNumbers,
  onToggleNumber,
  disabled = false,
}) => {
  const getNumberState = (num: number) => {
    if (selectedNumbers.includes(num)) return 'selected';
    if (takenNumbers.includes(num)) return 'taken';
    if (availableNumbers.includes(num)) return 'available';
    return 'taken';
  };

  const getNumberClass = (num: number) => {
    const state = getNumberState(num);
    const baseClass = 'number-btn';
    
    if (state === 'selected') return `${baseClass} number-selected`;
    if (state === 'taken') return `${baseClass} number-taken`;
    if (disabled) return `${baseClass} number-taken opacity-50 cursor-not-allowed`;
    return `${baseClass} number-available`;
  };

  return (
    <div className="grid grid-cols-10 gap-2 p-4">
      {Array.from({ length: 100 }, (_, i) => i + 1).map((num) => {
        const state = getNumberState(num);
        const isDisabled = disabled || state === 'taken';

        return (
          <button
            key={num}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              if (!isDisabled) {
                onToggleNumber(num);
              }
            }}
            disabled={isDisabled}
            className={getNumberClass(num)}
            title={
              state === 'taken' 
                ? 'Número já selecionado' 
                : state === 'selected'
                ? 'Clique para desselecionar'
                : 'Clique para selecionar'
            }
          >
            {num}
          </button>
        );
      })}
    </div>
  );
};

export default NumberGrid;
