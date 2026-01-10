"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import './CasioCalculator.css';

type Operator = '+' | '-' | '×' | '÷' | null;

interface CalculationStep {
    value: number;
    operator: Operator;
    resultSoFar: number;
}

const CasioCalculator: React.FC = () => {
    // Basic calculation state
    const [display, setDisplay] = useState('0');
    const [prevValue, setPrevValue] = useState<number | null>(null);
    const [currentOperator, setCurrentOperator] = useState<Operator>(null);
    const [waitingForOperand, setWaitingForOperand] = useState(false);

    // Memory and GT
    const [memory, setMemory] = useState(0);
    const [grandTotal, setGrandTotal] = useState(0);

    // Check & Correct (300 steps)
    const [history, setHistory] = useState<CalculationStep[]>([]);
    const [checkIndex, setCheckIndex] = useState<number | null>(null);

    // Selectors
    const [rounding, setRounding] = useState<'UP' | '5/4' | 'CUT' | 'F'>('F');
    const [decimal, setDecimal] = useState<'4' | '3' | '2' | '1' | '0' | 'ADD2'>('2');

    const buzzerRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Initialize buzzer
        buzzerRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    }, []);

    const playBuzzer = () => {
        if (buzzerRef.current) {
            buzzerRef.current.currentTime = 0;
            buzzerRef.current.play().catch(() => { });
        }
    };

    const formatDisplay = (val: number | string) => {
        if (typeof val === 'string') return val.substring(0, 12);

        // Apply decimal and rounding logic
        let num = val;
        if (rounding !== 'F') {
            const d = decimal === 'ADD2' ? 2 : parseInt(decimal);
            const factor = Math.pow(10, d);
            if (rounding === 'UP') num = Math.ceil(num * factor) / factor;
            else if (rounding === 'CUT') num = Math.floor(num * factor) / factor;
            else if (rounding === '5/4') num = Math.round(num * factor) / factor;
        }

        const str = num.toString();
        // Casio 12 digit limit
        if (str.length > 12) {
            return num.toExponential(6).substring(0, 12);
        }
        return str;
    };

    const performCalculation = (first: number, second: number, op: Operator): number => {
        switch (op) {
            case '+': return first + second;
            case '-': return first - second;
            case '×': return first * second;
            case '÷': return second !== 0 ? first / second : 0;
            default: return second;
        }
    };

    const handleDigit = (digit: string) => {
        if (checkIndex !== null) setCheckIndex(null); // Exit check mode

        if (waitingForOperand) {
            setDisplay(digit);
            setWaitingForOperand(false);
        } else {
            setDisplay(display === '0' ? digit : display + digit);
        }
    };

    const handleOperator = (nextOp: Operator) => {
        const inputValue = parseFloat(display);

        if (prevValue === null) {
            setPrevValue(inputValue);
        } else if (currentOperator) {
            const result = performCalculation(prevValue, inputValue, currentOperator);
            setDisplay(formatDisplay(result));
            setPrevValue(result);

            // Add to history
            const newHistory = [...history, { value: inputValue, operator: currentOperator, resultSoFar: result }];
            if (newHistory.length > 300) newHistory.shift();
            setHistory(newHistory);
        }

        setWaitingForOperand(true);
        setCurrentOperator(nextOp);
    };

    const handleEqual = () => {
        const inputValue = parseFloat(display);
        if (currentOperator && prevValue !== null) {
            const result = performCalculation(prevValue, inputValue, currentOperator);
            setDisplay(formatDisplay(result));
            setGrandTotal(prev => prev + result);

            // Finalize history
            const newHistory = [...history, { value: inputValue, operator: currentOperator, resultSoFar: result }];
            setHistory(newHistory);

            setPrevValue(null);
            setCurrentOperator(null);
            setWaitingForOperand(true);
        }
    };

    const handleClear = () => {
        setDisplay('0');
        setPrevValue(null);
        setCurrentOperator(null);
        setWaitingForOperand(false);
        setCheckIndex(null);
    };

    const handleAllClear = () => {
        handleClear();
        setMemory(0);
        setGrandTotal(0);
        setHistory([]);
    };

    const handleMemory = (type: 'M+' | 'M-' | 'MR' | 'MC') => {
        const val = parseFloat(display);
        switch (type) {
            case 'M+': setMemory(prev => prev + val); setWaitingForOperand(true); break;
            case 'M-': setMemory(prev => prev - val); setWaitingForOperand(true); break;
            case 'MR': setDisplay(formatDisplay(memory)); break;
            case 'MC': setMemory(0); break;
        }
    };

    const handleCheck = (direction: 'back' | 'forward') => {
        if (history.length === 0) { playBuzzer(); return; }

        let nextIndex = checkIndex === null ? history.length - 1 : (direction === 'back' ? checkIndex - 1 : checkIndex + 1);

        if (nextIndex < 0 || nextIndex >= history.length) {
            playBuzzer();
            return;
        }

        setCheckIndex(nextIndex);
        setDisplay(formatDisplay(history[nextIndex].resultSoFar));
    };

    return (
        <div className="casio-calculator">
            <div className="casio-display-container">
                <div className="casio-indicators">
                    <span>{currentOperator}</span>
                    <span>{memory !== 0 ? 'M' : ''}</span>
                    <span>{grandTotal !== 0 ? 'GT' : ''}</span>
                    {checkIndex !== null && <span className="casio-check-mode">STEP {checkIndex + 1}</span>}
                </div>
                <div className="casio-main-display">
                    {display}
                </div>
            </div>

            <div className="casio-controls-top">
                <div className="casio-switch-group">
                    <div className="casio-switch-label">UP 5/4 CUT</div>
                    <div className="casio-switch" onClick={() => {
                        const modes: ('UP' | '5/4' | 'CUT' | 'F')[] = ['UP', '5/4', 'CUT', 'F'];
                        const idx = modes.indexOf(rounding);
                        setRounding(modes[(idx + 1) % modes.length]);
                    }}>
                        <div className="casio-switch-knob" style={{ left: rounding === 'UP' ? '2px' : rounding === '5/4' ? '12px' : rounding === 'CUT' ? '22px' : '32px' }}></div>
                    </div>
                </div>

                <div className="casio-switch-group">
                    <div className="casio-switch-label">F 4 3 2 1 0 ADD2</div>
                    <div className="casio-switch" onClick={() => {
                        const modes: any[] = ['F', '4', '3', '2', '1', '0', 'ADD2'];
                        const idx = modes.indexOf(decimal);
                        setDecimal(modes[(idx + 1) % modes.length]);
                    }}>
                        <div className="casio-switch-knob" style={{ left: `${(parseInt(decimal) || 0) * 6}px` }}></div>
                    </div>
                </div>
            </div>

            <div className="casio-grid">
                {/* Row 1 */}
                <button className="casio-btn btn-func" onClick={() => handleCheck('back')}>CHECK ◀</button>
                <button className="casio-btn btn-func" onClick={() => handleCheck('forward')}>CHECK ▶</button>
                <button className="casio-btn btn-func" onClick={() => { }}>CORRECT</button>
                <button className="casio-btn btn-func" onClick={() => { }}>TAX+</button>
                <button className="casio-btn btn-func" onClick={() => { }}>TAX-</button>

                {/* Row 2 */}
                <button className="casio-btn btn-memory" onClick={() => handleMemory('MC')}>MC</button>
                <button className="casio-btn btn-memory" onClick={() => handleMemory('MR')}>MR</button>
                <button className="casio-btn btn-memory" onClick={() => handleMemory('M-')}>M-</button>
                <button className="casio-btn btn-memory" onClick={() => handleMemory('M+')}>M+</button>
                <button className="casio-btn btn-op" onClick={() => handleOperator('÷')}>÷</button>

                {/* Row 3 */}
                <button className="casio-btn btn-func" onClick={() => setGrandTotal(0)}>GT</button>
                <button className="casio-btn btn-num" onClick={() => handleDigit('7')}>7</button>
                <button className="casio-btn btn-num" onClick={() => handleDigit('8')}>8</button>
                <button className="casio-btn btn-num" onClick={() => handleDigit('9')}>9</button>
                <button className="casio-btn btn-op" onClick={() => handleOperator('×')}>×</button>

                {/* Row 4 */}
                <button className="casio-btn btn-func" onClick={() => setDisplay(prev => (-parseFloat(prev)).toString())}>+/-</button>
                <button className="casio-btn btn-num" onClick={() => handleDigit('4')}>4</button>
                <button className="casio-btn btn-num" onClick={() => handleDigit('5')}>5</button>
                <button className="casio-btn btn-num" onClick={() => handleDigit('6')}>6</button>
                <button className="casio-btn btn-op" onClick={() => handleOperator('-')}>-</button>

                {/* Row 5 */}
                <button className="casio-btn btn-func" onClick={() => setDisplay(Math.sqrt(parseFloat(display)).toString())}>√</button>
                <button className="casio-btn btn-num" onClick={() => handleDigit('1')}>1</button>
                <button className="casio-btn btn-num" onClick={() => handleDigit('2')}>2</button>
                <button className="casio-btn btn-num" onClick={() => handleDigit('3')}>3</button>
                <button className="casio-btn btn-op" onClick={() => handleOperator('+')}>+</button>

                {/* Row 6 */}
                <button className="casio-btn btn-clear" onClick={handleAllClear}>AC</button>
                <button className="casio-btn btn-clear" onClick={handleClear}>C</button>
                <button className="casio-btn btn-num" onClick={() => handleDigit('0')}>0</button>
                <button className="casio-btn btn-num" onClick={() => handleDigit('.')}>.</button>
                <button className="casio-btn btn-equal" onClick={handleEqual}>=</button>
            </div>
        </div>
    );
};

export default CasioCalculator;
