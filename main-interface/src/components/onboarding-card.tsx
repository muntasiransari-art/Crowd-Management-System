"use client";

import type { CardComponentProps } from "onborda";
import { Button } from "@/components/ui/button";
import { X, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useOnborda } from "onborda";
import { markTourCompleted } from "@/lib/onboarding-steps";

export function OnboardingCard({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  arrow,
}: CardComponentProps) {
  const { closeOnborda } = useOnborda();

  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;

  const handleClose = () => {
    markTourCompleted();
    closeOnborda();
  };

  const handleNext = () => {
    if (isLastStep) {
      markTourCompleted();
      closeOnborda();
    } else {
      nextStep();
    }
  };

  return (
    <div className="relative">
      {/* Arrow pointing to target */}
      <div className="text-primary">{arrow}</div>

      <div className="w-80 z-50! bg-background border border-border rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-primary/5 px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{step.icon}</span>
              <div>
                <h3 className="font-semibold text-foreground">{step.title}</h3>
                <p className="text-xs text-muted-foreground">
                  Step {currentStep + 1} of {totalSteps}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {step.content}
          </p>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-muted/30 border-t border-border flex items-center justify-between">
          {/* Progress dots */}
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full transition-colors ${
                  i <= currentStep ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-2">
            {!isFirstStep && (
              <Button
                variant="outline"
                size="sm"
                onClick={prevStep}
                className="h-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <Button size="sm" onClick={handleNext} className="h-8">
              {isLastStep ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Done
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
