// Attendee dashboard onboarding tour steps
export const attendeeTourSteps = [
  {
    tour: "attendee-welcome",
    steps: [
      {
        icon: <>👋</>,
        title: "Welcome to EventGuard!",
        content: (
          <>
            We&apos;re excited to have you here! Let&apos;s take a quick tour of
            your dashboard to help you get started.
          </>
        ),
        selector: "#nav-overview",
        side: "right" as const,
        showControls: true,
        pointerPadding: 10,
        pointerRadius: 10,
      },
      {
        icon: <>🎫</>,
        title: "My Tickets",
        content: (
          <>
            View all your venue bookings here. Each ticket includes a QR code
            that you&apos;ll show at the venue entrance.
          </>
        ),
        selector: "#nav-tickets",
        side: "right" as const,
        showControls: true,
        pointerPadding: 8,
        pointerRadius: 8,
      },
      {
        icon: <>📅</>,
        title: "Book a Slot",
        content: (
          <>
            Reserve your venue visit here. Choose your preferred date, time
            slot, and add visitor details.
          </>
        ),
        selector: "#nav-booking",
        side: "right" as const,
        showControls: true,
        pointerPadding: 8,
        pointerRadius: 8,
      },
      {
        icon: <>🤖</>,
        title: "AI Assistant",
        content: (
          <>
            Need help? Chat with our AI assistant! You can book slots, ask
            questions, and get guidance through conversation.
          </>
        ),
        selector: "#nav-assistant",
        side: "right" as const,
        showControls: true,
        pointerPadding: 8,
        pointerRadius: 8,
      },
      {
        icon: <>🆘</>,
        title: "SOS Emergency",
        content: (
          <>
            In case of emergency, use this button to alert security and medical
            staff immediately. Stay safe!
          </>
        ),
        selector: "#nav-sos",
        side: "right" as const,
        showControls: true,
        pointerPadding: 8,
        pointerRadius: 8,
      },
      {
        icon: <>🎉</>,
        title: "You're All Set!",
        content: (
          <>
            That&apos;s it! You&apos;re ready to explore. Start by booking your
            first venue visit or chat with our AI assistant.
          </>
        ),
        selector: "#nav-booking",
        side: "right" as const,
        showControls: true,
        pointerPadding: 8,
        pointerRadius: 8,
      },
    ],
  },
];

// Check if user needs to see the tour
export function shouldShowTour(): boolean {
  if (typeof window === "undefined") return false;
  const hasSeenTour = localStorage.getItem("eventguard-tour-completed");
  return !hasSeenTour;
}

// Mark tour as completed
export function markTourCompleted(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("eventguard-tour-completed", "true");
}

// Reset tour (for testing)
export function resetTour(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("eventguard-tour-completed");
}
