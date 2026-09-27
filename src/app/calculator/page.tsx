"use client";

import { useState } from "react";
import Link from "next/link";
import { useDirectToolRoute } from "@/lib/use-direct-tool-route";
import { calculateCalendarAge, parseLocalDate } from "@/lib/calendar";

export default function CalculatorTools() {
  const { activeTool, setActiveTool, openTool } = useDirectToolRoute("calculator", [
    "percentage", "emi", "gst", "age", "discount", "unit", "bmi", "compound-interest", "date-difference",
  ]);

  const tools = [
    { id: "percentage", name: "Percentage Calculator", description: "Calculate percentages, percentage increase/decrease", icon: "📊" },
    { id: "emi", name: "EMI Calculator", description: "Calculate loan EMI with interest and tenure", icon: "💰" },
    { id: "gst", name: "GST Calculator", description: "Calculate GST inclusive and exclusive amounts", icon: "🧾" },
    { id: "age", name: "Age Calculator", description: "Calculate your exact age in years, months, and days", icon: "🎂" },
    { id: "discount", name: "Discount Calculator", description: "Calculate the discount amount and final price", icon: "🏷️" },
    { id: "unit", name: "Unit Converter", description: "Convert between different units of measurement", icon: "🔄" },
    { id: "bmi", name: "BMI Calculator", description: "Calculate BMI from weight and height", icon: "⚖️" },
    { id: "compound-interest", name: "Compound Interest Calculator", description: "Calculate compound interest and total amount", icon: "📈" },
    { id: "date-difference", name: "Date Difference", description: "Calculate the time between two dates", icon: "📅" },
  ];

  if (activeTool) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-16">
          <Link
            href="/calculator"
            onClick={() => setActiveTool(null)}
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-8"
          >
            ← Back to Calculators
          </Link>
          {activeTool === "age" && <AgeCalculator />}
          {activeTool === "percentage" && <PercentageCalculator />}
          {activeTool === "emi" && <EMICalculator />}
          {activeTool === "gst" && <GSTCalculator />}
          {activeTool === "unit" && <UnitConverter />}
          {activeTool === "discount" && <DiscountCalculator />}
          {activeTool === "bmi" && <BMICalculator />}
          {activeTool === "date-difference" && <DateDifferenceCalculator />}
          {activeTool === "compound-interest" && <CompoundInterestCalculator />}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        <Link
          href="/"
          className="mb-8 inline-flex min-h-11 items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-blue-300 dark:hover:border-gray-500 dark:hover:bg-gray-700 dark:focus-visible:ring-offset-gray-900"
        >
          ← Back to Home
        </Link>

        <div className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-3">
            <span className="text-4xl sm:text-5xl">🧮</span>
            Calculators
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Age, date difference, compound interest, percentage, EMI, GST, discount, BMI, and unit conversion calculators
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={`/calculator?tool=${encodeURIComponent(tool.id)}`}
              onClick={(event) => { event.preventDefault(); openTool(tool.id); }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 cursor-pointer"
            >
              <div className="text-4xl mb-4">{tool.icon}</div>
              <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">
                {tool.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {tool.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function CompoundInterestCalculator() {
  const [principal, setPrincipal] = useState("");
  const [annualRate, setAnnualRate] = useState("");
  const [timeYears, setTimeYears] = useState("");
  const [frequency, setFrequency] = useState(12);
  const [result, setResult] = useState<{ totalAmount: number; interestEarned: number } | null>(null);
  const [error, setError] = useState("");

  const clearResult = () => {
    setResult(null);
    setError("");
  };

  const calculate = () => {
    if (!principal.trim() || !annualRate.trim() || !timeYears.trim()) {
      setResult(null);
      setError("Enter a principal amount, annual interest rate, and time period.");
      return;
    }

    const principalAmount = Number(principal);
    const rate = Number(annualRate);
    const years = Number(timeYears);

    if (!Number.isFinite(principalAmount) || principalAmount <= 0) {
      setResult(null);
      setError("Principal amount must be a valid number greater than 0.");
      return;
    }
    if (!Number.isFinite(rate) || rate < 0) {
      setResult(null);
      setError("Annual interest rate must be a valid number greater than or equal to 0%.");
      return;
    }
    if (!Number.isFinite(years) || years <= 0) {
      setResult(null);
      setError("Time period must be a valid number of years greater than 0.");
      return;
    }

    const totalAmount = principalAmount * Math.pow(1 + (rate / 100) / frequency, frequency * years);
    const interestEarned = totalAmount - principalAmount;
    if (!Number.isFinite(totalAmount) || !Number.isFinite(interestEarned)) {
      setResult(null);
      setError("The result is too large to calculate. Check the rate and time period.");
      return;
    }

    setResult({ totalAmount, interestEarned });
    setError("");
  };

  const reset = () => {
    setPrincipal("");
    setAnnualRate("");
    setTimeYears("");
    setFrequency(12);
    setResult(null);
    setError("");
  };

  const formatAmount = (amount: number) => amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">📈 Compound Interest Calculator</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="mb-4">
          <label htmlFor="compound-principal" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Principal Amount
          </label>
          <input
            id="compound-principal"
            type="number"
            min="0"
            step="any"
            value={principal}
            onChange={(event) => {
              setPrincipal(event.target.value);
              clearResult();
            }}
            placeholder="Enter principal amount"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="compound-rate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Annual Interest Rate (%)
          </label>
          <input
            id="compound-rate"
            type="number"
            min="0"
            step="any"
            value={annualRate}
            onChange={(event) => {
              setAnnualRate(event.target.value);
              clearResult();
            }}
            placeholder="Enter annual interest rate"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="compound-time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Time Period (years)
          </label>
          <input
            id="compound-time"
            type="number"
            min="0"
            step="any"
            value={timeYears}
            onChange={(event) => {
              setTimeYears(event.target.value);
              clearResult();
            }}
            placeholder="Enter time in years"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="compound-frequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Compounding Frequency
          </label>
          <select
            id="compound-frequency"
            value={frequency}
            onChange={(event) => {
              setFrequency(Number(event.target.value));
              clearResult();
            }}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={1}>Annually</option>
            <option value={2}>Semi-annually</option>
            <option value={4}>Quarterly</option>
            <option value={12}>Monthly</option>
            <option value={365}>Daily</option>
          </select>
        </div>
        <div className="flex gap-3">
          <button
            onClick={calculate}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Calculate
          </button>
          <button
            onClick={reset}
            className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Reset
          </button>
        </div>
        {error && (
          <div role="alert" className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}
        {result && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg space-y-2">
            <p className="text-green-800 dark:text-green-300">
              Interest Earned: {formatAmount(result.interestEarned)}
            </p>
            <p className="text-green-800 dark:text-green-300 font-semibold">
              Total Amount: {formatAmount(result.totalAmount)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function DateDifferenceCalculator() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [result, setResult] = useState<{
    totalDays: number;
    weeks: number;
    remainingDays: number;
    years: number;
    months: number;
    days: number;
  } | null>(null);
  const [error, setError] = useState("");

  const parseDate = (value: string): Date | null => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
      ? parsed
      : null;
  };

  const addCalendarMonths = (date: Date, monthCount: number): Date => {
    const originalDay = date.getUTCDate();
    const resultDate = new Date(date.getTime());
    resultDate.setUTCDate(1);
    resultDate.setUTCMonth(resultDate.getUTCMonth() + monthCount);

    const lastDayOfTargetMonth = new Date(resultDate.getTime());
    lastDayOfTargetMonth.setUTCMonth(lastDayOfTargetMonth.getUTCMonth() + 1, 0);
    resultDate.setUTCDate(Math.min(originalDay, lastDayOfTargetMonth.getUTCDate()));
    return resultDate;
  };

  const calculate = () => {
    if (!startDate || !endDate) {
      setResult(null);
      setError("Enter both a start date and an end date.");
      return;
    }

    const parsedStart = parseDate(startDate);
    const parsedEnd = parseDate(endDate);
    if (!parsedStart || !parsedEnd) {
      setResult(null);
      setError("Enter valid calendar dates for both the start and end dates.");
      return;
    }

    const earlier = parsedStart <= parsedEnd ? parsedStart : parsedEnd;
    const later = parsedStart <= parsedEnd ? parsedEnd : parsedStart;
    const totalDays = (later.getTime() - earlier.getTime()) / 86_400_000;
    let years = later.getUTCFullYear() - earlier.getUTCFullYear();
    let yearAnchor = addCalendarMonths(earlier, years * 12);
    if (yearAnchor > later) {
      years -= 1;
      yearAnchor = addCalendarMonths(earlier, years * 12);
    }

    let months = (later.getUTCFullYear() - yearAnchor.getUTCFullYear()) * 12 +
      later.getUTCMonth() - yearAnchor.getUTCMonth();
    let monthAnchor = addCalendarMonths(yearAnchor, months);
    if (monthAnchor > later) {
      months -= 1;
      monthAnchor = addCalendarMonths(yearAnchor, months);
    }

    const days = (later.getTime() - monthAnchor.getTime()) / 86_400_000;
    setResult({
      totalDays,
      weeks: Math.floor(totalDays / 7),
      remainingDays: totalDays % 7,
      years,
      months,
      days,
    });
    setError("");
  };

  const reset = () => {
    setStartDate("");
    setEndDate("");
    setResult(null);
    setError("");
  };

  const pluralize = (value: number, unit: string) => `${value} ${unit}${value === 1 ? "" : "s"}`;

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">📅 Date Difference</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="mb-4">
          <label htmlFor="date-difference-start" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Start Date
          </label>
          <input
            id="date-difference-start"
            type="date"
            value={startDate}
            onChange={(event) => {
              setStartDate(event.target.value);
              setResult(null);
              setError("");
            }}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="date-difference-end" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            End Date
          </label>
          <input
            id="date-difference-end"
            type="date"
            value={endDate}
            onChange={(event) => {
              setEndDate(event.target.value);
              setResult(null);
              setError("");
            }}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          The difference is shown as a positive duration, regardless of date order.
        </p>
        <div className="flex gap-3">
          <button
            onClick={calculate}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Calculate
          </button>
          <button
            onClick={reset}
            className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Reset
          </button>
        </div>
        {error && (
          <div role="alert" className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}
        {result && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg space-y-2">
            <p className="text-green-800 dark:text-green-300 font-semibold">
              Total: {result.totalDays.toLocaleString()} {result.totalDays === 1 ? "day" : "days"}
            </p>
            <p className="text-green-800 dark:text-green-300">
              Weeks: {pluralize(result.weeks, "week")} and {pluralize(result.remainingDays, "day")}
            </p>
            <p className="text-green-800 dark:text-green-300">
              Calendar difference: {pluralize(result.years, "year")}, {pluralize(result.months, "month")}, {pluralize(result.days, "day")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function BMICalculator() {
  const [weight, setWeight] = useState("");
  const [heightUnit, setHeightUnit] = useState<"cm" | "ft-in">("cm");
  const [heightCm, setHeightCm] = useState("");
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [result, setResult] = useState<{ bmi: number; category: string } | null>(null);
  const [error, setError] = useState("");

  const clearResult = () => {
    setResult(null);
    setError("");
  };

  const calculate = () => {
    if (!weight.trim()) {
      setResult(null);
      setError("Enter your weight in kilograms.");
      return;
    }
    const weightKg = Number(weight);
    if (!Number.isFinite(weightKg) || weightKg <= 0) {
      setResult(null);
      setError("Weight must be a valid number greater than 0 kg.");
      return;
    }

    let heightMeters: number;
    if (heightUnit === "cm") {
      if (!heightCm.trim()) {
        setResult(null);
        setError("Enter your height in centimeters.");
        return;
      }
      const centimeters = Number(heightCm);
      if (!Number.isFinite(centimeters) || centimeters <= 0) {
        setResult(null);
        setError("Height must be a valid number greater than 0 cm.");
        return;
      }
      heightMeters = centimeters / 100;
    } else {
      if (!heightFeet.trim() && !heightInches.trim()) {
        setResult(null);
        setError("Enter your height in feet, inches, or both.");
        return;
      }
      const feet = heightFeet.trim() ? Number(heightFeet) : 0;
      const inches = heightInches.trim() ? Number(heightInches) : 0;
      if (!Number.isFinite(feet) || feet < 0) {
        setResult(null);
        setError("Feet must be a valid number greater than or equal to 0.");
        return;
      }
      if (!Number.isFinite(inches) || inches < 0 || inches >= 12) {
        setResult(null);
        setError("Inches must be a number from 0 up to, but not including, 12.");
        return;
      }
      const totalInches = feet * 12 + inches;
      if (!Number.isFinite(totalInches) || totalInches <= 0) {
        setResult(null);
        setError("Height must be greater than 0.");
        return;
      }
      heightMeters = totalInches * 0.0254;
    }

    const bmi = weightKg / (heightMeters * heightMeters);
    if (!Number.isFinite(bmi) || bmi <= 0) {
      setResult(null);
      setError("These measurements are outside the calculator's supported range.");
      return;
    }

    const category = bmi < 18.5
      ? "Underweight"
      : bmi < 25
        ? "Normal weight"
        : bmi < 30
          ? "Overweight"
          : "Obesity";
    setResult({ bmi, category });
    setError("");
  };

  const reset = () => {
    setWeight("");
    setHeightUnit("cm");
    setHeightCm("");
    setHeightFeet("");
    setHeightInches("");
    setResult(null);
    setError("");
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">⚖️ BMI Calculator</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="mb-4">
          <label htmlFor="bmi-weight" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Weight (kg)
          </label>
          <input
            id="bmi-weight"
            type="number"
            min="0"
            step="any"
            value={weight}
            onChange={(event) => {
              setWeight(event.target.value);
              clearResult();
            }}
            placeholder="Enter weight in kilograms"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="mb-4">
          <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Height unit</span>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              aria-pressed={heightUnit === "cm"}
              onClick={() => {
                setHeightUnit("cm");
                setHeightCm("");
                setHeightFeet("");
                setHeightInches("");
                clearResult();
              }}
              className={`py-2 px-4 rounded-lg transition-colors ${heightUnit === "cm" ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"}`}
            >
              Centimeters
            </button>
            <button
              type="button"
              aria-pressed={heightUnit === "ft-in"}
              onClick={() => {
                setHeightUnit("ft-in");
                setHeightCm("");
                setHeightFeet("");
                setHeightInches("");
                clearResult();
              }}
              className={`py-2 px-4 rounded-lg transition-colors ${heightUnit === "ft-in" ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"}`}
            >
              Feet &amp; inches
            </button>
          </div>
        </div>
        {heightUnit === "cm" ? (
          <div className="mb-4">
            <label htmlFor="bmi-height-cm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Height (cm)
            </label>
            <input
              id="bmi-height-cm"
              type="number"
              min="0"
              step="any"
              value={heightCm}
              onChange={(event) => {
                setHeightCm(event.target.value);
                clearResult();
              }}
              placeholder="Enter height in centimeters"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="bmi-height-feet" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Height (ft)
              </label>
              <input
                id="bmi-height-feet"
                type="number"
                min="0"
                step="1"
                value={heightFeet}
                onChange={(event) => {
                  setHeightFeet(event.target.value);
                  clearResult();
                }}
                placeholder="Feet"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="bmi-height-inches" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Height (in)
              </label>
              <input
                id="bmi-height-inches"
                type="number"
                min="0"
                max="11.999"
                step="any"
                value={heightInches}
                onChange={(event) => {
                  setHeightInches(event.target.value);
                  clearResult();
                }}
                placeholder="Inches"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={calculate}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Calculate
          </button>
          <button
            onClick={reset}
            className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Reset
          </button>
        </div>
        {error && (
          <div role="alert" className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}
        {result && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-800 dark:text-green-300 text-lg font-semibold">BMI: {result.bmi.toFixed(1)}</p>
            <p className="mt-1 text-green-800 dark:text-green-300">Category: {result.category}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DiscountCalculator() {
  const [originalPrice, setOriginalPrice] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [result, setResult] = useState<{ discountAmount: number; finalPrice: number } | null>(null);
  const [error, setError] = useState("");

  const calculate = () => {
    if (!originalPrice.trim() || !discountPercent.trim()) {
      setResult(null);
      setError("Enter both the original price and discount percentage.");
      return;
    }

    const price = Number(originalPrice);
    const percentage = Number(discountPercent);
    if (!Number.isFinite(price) || price < 0) {
      setResult(null);
      setError("Original price must be a valid number greater than or equal to 0.");
      return;
    }
    if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
      setResult(null);
      setError("Discount percentage must be between 0 and 100.");
      return;
    }

    const discountAmount = price * (percentage / 100);
    setResult({ discountAmount, finalPrice: price - discountAmount });
    setError("");
  };

  const reset = () => {
    setOriginalPrice("");
    setDiscountPercent("");
    setResult(null);
    setError("");
  };

  const formatAmount = (amount: number) => amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">🏷️ Discount Calculator</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="mb-4">
          <label htmlFor="discount-original-price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Original Price
          </label>
          <input
            id="discount-original-price"
            type="number"
            min="0"
            step="any"
            value={originalPrice}
            onChange={(event) => {
              setOriginalPrice(event.target.value);
              setResult(null);
              setError("");
            }}
            placeholder="Enter original price"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="discount-percent" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Discount Percentage (%)
          </label>
          <input
            id="discount-percent"
            type="number"
            min="0"
            max="100"
            step="any"
            value={discountPercent}
            onChange={(event) => {
              setDiscountPercent(event.target.value);
              setResult(null);
              setError("");
            }}
            placeholder="Enter discount percentage"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={calculate}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Calculate
          </button>
          <button
            onClick={reset}
            className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Reset
          </button>
        </div>
        {error && (
          <div role="alert" className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}
        {result && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg space-y-2">
            <p className="text-green-800 dark:text-green-300">
              Discount Amount: {formatAmount(result.discountAmount)}
            </p>
            <p className="text-green-800 dark:text-green-300 font-semibold">
              Final Price: {formatAmount(result.finalPrice)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function AgeCalculator() {
  const [birthDate, setBirthDate] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");

  const calculateAge = () => {
    if (!birthDate) {
      setResult(null);
      setError("Enter a date of birth.");
      return;
    }

    const birth = parseLocalDate(birthDate);
    if (!birth) {
      setResult(null);
      setError("Enter a valid date of birth.");
      return;
    }

    const today = new Date();
    if (birth.getTime() > today.getTime()) {
      setResult(null);
      setError("Date of birth cannot be in the future.");
      return;
    }

    const age = calculateCalendarAge(birth, today);
    setResult(
      `You are ${age.years} years, ${age.months} months, and ${age.days} days old (${age.totalDays.toLocaleString()} total days)`,
    );
    setError("");
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">🎂 Age Calculator</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="mb-4">
          <label htmlFor="age-birth-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Date of Birth
          </label>
          <input
            id="age-birth-date"
            type="date"
            value={birthDate}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => {
              setBirthDate(e.target.value);
              setResult(null);
              setError("");
            }}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={calculateAge}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Calculate Age
        </button>
        {error && (
          <div role="alert" className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}
        {result && (
          <div aria-live="polite" className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-800 dark:text-green-300 font-semibold">{result}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PercentageCalculator() {
  const [value, setValue] = useState("");
  const [percentage, setPercentage] = useState("");
  const [result, setResult] = useState<number | null>(null);
  const [mode, setMode] = useState<"calculate" | "increase" | "decrease">("calculate");


  const calculate = () => {
    const numValue = parseFloat(value);
    const numPercentage = parseFloat(percentage);

    if (isNaN(numValue) || isNaN(numPercentage)) return;

    let result: number;
    if (mode === "calculate") {
      result = (numValue * numPercentage) / 100;
    } else if (mode === "increase") {
      result = numValue + (numValue * numPercentage) / 100;
    } else {
      result = numValue - (numValue * numPercentage) / 100;
    }

    setResult(result);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">📊 Percentage Calculator</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="mb-4">
            <label htmlFor="percentage-mode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Calculation Mode
            </label>
            <select
              id="percentage-mode"
              value={mode}
              onChange={(e) => setMode(e.target.value as "calculate" | "increase" | "decrease")}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="calculate">Calculate Percentage</option>
            <option value="increase">Percentage Increase</option>
            <option value="decrease">Percentage Decrease</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Value
          </label>
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter value"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Percentage
          </label>
          <input
            type="number"
            value={percentage}
            onChange={(e) => setPercentage(e.target.value)}
            placeholder="Enter percentage"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={calculate}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Calculate
        </button>
        {result !== null && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-800 dark:text-green-300 font-semibold">
              Result: {result.toFixed(2)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function EMICalculator() {
  const [principal, setPrincipal] = useState("");
  const [rate, setRate] = useState("");
  const [tenure, setTenure] = useState("");
  const [result, setResult] = useState<{
    emi: number;
    totalPayment: number;
    totalInterest: number;
  } | null>(null);

  const calculateEMI = () => {
    const p = parseFloat(principal);
    const r = parseFloat(rate) / 12 / 100;
    const n = parseFloat(tenure) * 12;

    if (isNaN(p) || isNaN(r) || isNaN(n) || p <= 0 || r <= 0 || n <= 0) return;

    const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayment = emi * n;
    const totalInterest = totalPayment - p;

    setResult({ emi, totalPayment, totalInterest });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">💰 EMI Calculator</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Principal Amount
          </label>
          <input
            type="number"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            placeholder="Enter loan amount"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Annual Interest Rate (%)
          </label>
          <input
            type="number"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="Enter interest rate"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Loan Tenure (Years)
          </label>
          <input
            type="number"
            value={tenure}
            onChange={(e) => setTenure(e.target.value)}
            placeholder="Enter tenure in years"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={calculateEMI}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Calculate EMI
        </button>
        {result && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg space-y-2">
            <p className="text-green-800 dark:text-green-300 font-semibold">
              Monthly EMI: {result.emi.toFixed(2)}
            </p>
            <p className="text-green-800 dark:text-green-300">
              Total Payment: {result.totalPayment.toFixed(2)}
            </p>
            <p className="text-green-800 dark:text-green-300">
              Total Interest: {result.totalInterest.toFixed(2)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function GSTCalculator() {
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("18");
  const [mode, setMode] = useState<"exclusive" | "inclusive">("exclusive");
  const [result, setResult] = useState<{
    netAmount: number;
    gstAmount: number;
    totalAmount: number;
  } | null>(null);

  const calculateGST = () => {
    const numAmount = parseFloat(amount);
    const numRate = parseFloat(rate);

    if (isNaN(numAmount) || isNaN(numRate) || numAmount <= 0) return;

    let netAmount: number, gstAmount: number, totalAmount: number;

    if (mode === "exclusive") {
      netAmount = numAmount;
      gstAmount = (numAmount * numRate) / 100;
      totalAmount = netAmount + gstAmount;
    } else {
      totalAmount = numAmount;
      netAmount = (numAmount * 100) / (100 + numRate);
      gstAmount = totalAmount - netAmount;
    }

    setResult({ netAmount, gstAmount, totalAmount });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">🧾 GST Calculator</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="mb-4">
          <label htmlFor="gst-mode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Calculation Mode
          </label>
          <select
            id="gst-mode"
            value={mode}
            onChange={(e) => setMode(e.target.value as "exclusive" | "inclusive")}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="exclusive">Add GST (Exclusive)</option>
            <option value="inclusive">Remove GST (Inclusive)</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Amount
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            GST Rate (%)
          </label>
          <select
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="5">5%</option>
            <option value="12">12%</option>
            <option value="18">18%</option>
            <option value="28">28%</option>
          </select>
        </div>
        <button
          onClick={calculateGST}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Calculate GST
        </button>
        {result && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg space-y-2">
            <p className="text-green-800 dark:text-green-300 font-semibold">
              Net Amount: {result.netAmount.toFixed(2)}
            </p>
            <p className="text-green-800 dark:text-green-300">
              GST Amount: {result.gstAmount.toFixed(2)}
            </p>
            <p className="text-green-800 dark:text-green-300">
              Total Amount: {result.totalAmount.toFixed(2)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function UnitConverter() {
  const [value, setValue] = useState("");
  const [category, setCategory] = useState("length");
  const [fromUnit, setFromUnit] = useState("m");
  const [toUnit, setToUnit] = useState("ft");
  const [result, setResult] = useState<number | null>(null);

  const conversions: Record<string, Record<string, number>> = {
    length: {
      m: 1,
      km: 0.001,
      cm: 100,
      mm: 1000,
      ft: 3.28084,
      in: 39.3701,
      yd: 1.09361,
      mi: 0.000621371,
    },
    weight: {
      kg: 1,
      g: 1000,
      mg: 1000000,
      lb: 2.20462,
      oz: 35.274,
      ton: 0.001,
    },
    temperature: {
      c: 1,
      f: 1,
      k: 1,
    },
  };

  const unitLabels: Record<string, Record<string, string>> = {
    length: {
      m: "Meters",
      km: "Kilometers",
      cm: "Centimeters",
      mm: "Millimeters",
      ft: "Feet",
      in: "Inches",
      yd: "Yards",
      mi: "Miles",
    },
    weight: {
      kg: "Kilograms",
      g: "Grams",
      mg: "Milligrams",
      lb: "Pounds",
      oz: "Ounces",
      ton: "Metric Tons",
    },
    temperature: {
      c: "Celsius",
      f: "Fahrenheit",
      k: "Kelvin",
    },
  };

  const convert = () => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    let converted: number;

    if (category === "temperature") {
      let celsius: number;
      if (fromUnit === "c") celsius = numValue;
      else if (fromUnit === "f") celsius = (numValue - 32) * (5 / 9);
      else celsius = numValue - 273.15;

      if (toUnit === "c") converted = celsius;
      else if (toUnit === "f") converted = celsius * (9 / 5) + 32;
      else converted = celsius + 273.15;
    } else {
      const baseValue = numValue / conversions[category][fromUnit];
      converted = baseValue * conversions[category][toUnit];
    }

    setResult(converted);
  };

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    const units = Object.keys(conversions[newCategory]);
    setFromUnit(units[0]);
    setToUnit(units[1]);
    setResult(null);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">🔄 Unit Converter</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="length">Length</option>
            <option value="weight">Weight</option>
            <option value="temperature">Temperature</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Value
          </label>
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter value"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              From
            </label>
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Object.keys(conversions[category]).map((unit) => (
                <option key={unit} value={unit}>
                  {unitLabels[category][unit]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              To
            </label>
            <select
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Object.keys(conversions[category]).map((unit) => (
                <option key={unit} value={unit}>
                  {unitLabels[category][unit]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={convert}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Convert
        </button>
        {result !== null && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-800 dark:text-green-300 font-semibold">
              Result: {result.toFixed(4)} {unitLabels[category][toUnit]}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
