import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { calculate, type Operator } from "../lib/calculatorEngine";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface CalculatorDisplayProps {
  value: string;
}

function CalculatorDisplay({ value }: CalculatorDisplayProps) {
  return (
    <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-4 min-h-20 flex items-end justify-end">
      <div className="text-4xl font-mono font-semibold text-right break-all">
        {value || "0"}
      </div>
    </div>
  );
}

type ButtonVariant = "default" | "operator" | "equals" | "secondary";

interface CalculatorButtonProps {
  children: ReactNode;
  onClick: () => void;
  variant?: ButtonVariant;
  className?: string;
  isPressed?: boolean;
}

function CalculatorButton({
  children,
  onClick,
  variant = "default",
  className,
  isPressed = false,
}: CalculatorButtonProps) {
  const base =
    "h-14 rounded-md border text-center select-none active:translate-y-px transition-all duration-200";
  const variants: Record<ButtonVariant, string> = {
    default:
      "bg-white/90 dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xl font-semibold",
    operator:
      "bg-blue-50 dark:bg-blue-900/20 border-blue-200/70 dark:border-blue-800/70 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xl font-semibold",
    equals:
      "bg-blue-600 hover:bg-blue-700 text-white border-blue-700 dark:border-blue-600 text-xl font-semibold",
    secondary:
      "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-lg font-medium",
  };

  const pressedStyle = isPressed
    ? "ring-2 ring-blue-500 dark:ring-blue-400 ring-offset-2 scale-95 shadow-lg"
    : "";

  return (
    <Button
      onClick={onClick}
      className={`${base} ${variants[variant]} ${pressedStyle} ${
        className ?? ""
      }`}
      variant="outline"
    >
      {children}
    </Button>
  );
}

export function Calculator() {
  const [display, setDisplay] = useState<string>("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState<boolean>(false);
  const [lastPressedButton, setLastPressedButton] = useState<string | null>(
    null
  );

  const handleNumber = useCallback(
    (digit: string) => {
      setLastPressedButton(`number-${digit}`);
      setDisplay((prev) => {
        if (waitingForOperand) {
          setWaitingForOperand(false);
          return digit;
        }
        const next = prev === "0" ? digit : prev + digit;
        if (next.replace(".", "").length > 15) return prev;
        return next;
      });
    },
    [waitingForOperand]
  );

  const handleOperator = useCallback(
    (nextOperator: Operator) => {
      setLastPressedButton(`operator-${nextOperator}`);
      const inputValue = Number.parseFloat(display);
      if (previousValue === null) {
        setPreviousValue(inputValue);
        setOperator(nextOperator);
        setWaitingForOperand(true);
        return;
      }
      if (operator !== null && !waitingForOperand) {
        const result = calculate(previousValue, inputValue, operator);
        setDisplay(String(result));
        setPreviousValue(result);
        setOperator(nextOperator);
        setWaitingForOperand(true);
        return;
      }
      setOperator(nextOperator);
      setWaitingForOperand(true);
    },
    [display, operator, previousValue, waitingForOperand]
  );

  const handleEquals = useCallback(() => {
    if (operator === null || previousValue === null) return;
    setLastPressedButton(null);
    const inputValue = Number.parseFloat(display);
    const result = calculate(previousValue, inputValue, operator);
    setDisplay(String(result));
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(true);
  }, [display, operator, previousValue]);

  const handleClear = useCallback(() => {
    setLastPressedButton(null);
    setDisplay("0");
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  }, []);

  const handleDecimal = useCallback(() => {
    setLastPressedButton("decimal");
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
      return;
    }
    setDisplay((prev) => (prev.includes(".") ? prev : prev + "."));
  }, [waitingForOperand]);

  const handleBackspace = useCallback(() => {
    if (waitingForOperand) return;
    setLastPressedButton("backspace");
    setDisplay((prev) => {
      const next = prev.slice(0, -1);
      return next || "0";
    });
  }, [waitingForOperand]);

  // キーボード入力のハンドラー
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { key } = event;

      // 数字キー (0-9)
      if ("0" <= key && key <= "9") {
        event.preventDefault();
        handleNumber(key);
        return;
      }

      // 演算子キー
      if (key === "+") {
        event.preventDefault();
        handleOperator("+");
        return;
      }
      if (key === "-") {
        event.preventDefault();
        handleOperator("-");
        return;
      }
      if (key === "*") {
        event.preventDefault();
        handleOperator("*");
        return;
      }
      if (key === "/") {
        event.preventDefault();
        handleOperator("/");
        return;
      }

      // イコールキー (Enter, =)
      if (key === "Enter" || key === "=") {
        event.preventDefault();
        handleEquals();
        return;
      }

      // 小数点キー
      if (key === "." || key === ",") {
        event.preventDefault();
        handleDecimal();
        return;
      }

      // バックスペース (Backspace, Delete)
      if (key === "Backspace" || key === "Delete") {
        event.preventDefault();
        handleBackspace();
        return;
      }

      // クリアキー (Escape)
      if (key === "Escape") {
        event.preventDefault();
        handleClear();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    handleNumber,
    handleOperator,
    handleEquals,
    handleDecimal,
    handleBackspace,
    handleClear,
  ]);

  return (
    <Card className="w-full max-w-sm mx-auto p-6">
      <div className="space-y-4">
        <CalculatorDisplay value={display} />

        <div className="grid grid-cols-4 gap-2">
          <CalculatorButton
            variant="secondary"
            onClick={handleClear}
            className="col-span-2"
          >
            AC
          </CalculatorButton>
          <CalculatorButton
            variant="secondary"
            onClick={handleBackspace}
            isPressed={lastPressedButton === "backspace"}
          >
            ⌫
          </CalculatorButton>
          <CalculatorButton
            variant="operator"
            onClick={() => handleOperator("/")}
            isPressed={lastPressedButton === "operator-/"}
          >
            ÷
          </CalculatorButton>

          <CalculatorButton
            onClick={() => handleNumber("7")}
            isPressed={lastPressedButton === "number-7"}
          >
            7
          </CalculatorButton>
          <CalculatorButton
            onClick={() => handleNumber("8")}
            isPressed={lastPressedButton === "number-8"}
          >
            8
          </CalculatorButton>
          <CalculatorButton
            onClick={() => handleNumber("9")}
            isPressed={lastPressedButton === "number-9"}
          >
            9
          </CalculatorButton>
          <CalculatorButton
            variant="operator"
            onClick={() => handleOperator("*")}
            isPressed={lastPressedButton === "operator-*"}
          >
            ×
          </CalculatorButton>

          <CalculatorButton
            onClick={() => handleNumber("4")}
            isPressed={lastPressedButton === "number-4"}
          >
            4
          </CalculatorButton>
          <CalculatorButton
            onClick={() => handleNumber("5")}
            isPressed={lastPressedButton === "number-5"}
          >
            5
          </CalculatorButton>
          <CalculatorButton
            onClick={() => handleNumber("6")}
            isPressed={lastPressedButton === "number-6"}
          >
            6
          </CalculatorButton>
          <CalculatorButton
            variant="operator"
            onClick={() => handleOperator("-")}
            isPressed={lastPressedButton === "operator--"}
          >
            −
          </CalculatorButton>

          <CalculatorButton
            onClick={() => handleNumber("1")}
            isPressed={lastPressedButton === "number-1"}
          >
            1
          </CalculatorButton>
          <CalculatorButton
            onClick={() => handleNumber("2")}
            isPressed={lastPressedButton === "number-2"}
          >
            2
          </CalculatorButton>
          <CalculatorButton
            onClick={() => handleNumber("3")}
            isPressed={lastPressedButton === "number-3"}
          >
            3
          </CalculatorButton>
          <CalculatorButton
            variant="operator"
            onClick={() => handleOperator("+")}
            isPressed={lastPressedButton === "operator-+"}
          >
            +
          </CalculatorButton>

          <CalculatorButton
            onClick={() => handleNumber("0")}
            className="col-span-2"
            isPressed={lastPressedButton === "number-0"}
          >
            0
          </CalculatorButton>
          <CalculatorButton
            onClick={handleDecimal}
            isPressed={lastPressedButton === "decimal"}
          >
            .
          </CalculatorButton>
          <CalculatorButton variant="equals" onClick={handleEquals}>
            =
          </CalculatorButton>
        </div>
      </div>
    </Card>
  );
}
