import { MapPin } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side - Form */}
      <div className="flex flex-col min-h-screen bg-background">
        {/* Logo */}
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2">
            <img src="/images/logo.png" alt="EventGuard Logo" className="h-10 w-auto object-contain" />
            <span className="text-xl font-bold tracking-tight">
              EventGuard
            </span>
          </Link>
        </div>

        {/* Form Content */}
        <div className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-md">{children}</div>
        </div>

        {/* Footer */}
        <div className="p-6 text-center text-sm text-muted-foreground">
          <p>
            Copyright © EventGuard. All Rights Reserved.{" "}
            <Link href="#" className="text-primary hover:underline">
              Terms & Conditions
            </Link>{" "}
            |{" "}
            <Link href="#" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex flex-col justify-between bg-primary p-12 text-primary-foreground relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
        
        {/* Images Container - 2x2 Grid */}
        <div className="relative flex-1 flex items-center justify-center">
          <div className="grid grid-cols-2 gap-5 w-full max-w-lg">
            {/* Image 1 - Top Left */}
            <div className="w-full h-52 rounded-2xl overflow-hidden shadow-2xl rotate-[-2deg] hover:rotate-0 transition-transform">
              <img 
                src="/images/signupimg1.avif" 
                alt="Venue visual 1" 
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Image 2 - Top Right */}
            <div className="w-full h-52 rounded-2xl overflow-hidden shadow-2xl rotate-[2deg] hover:rotate-0 transition-transform">
              <img 
                src="/images/signupimg2.avif" 
                alt="Venue visual 2" 
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Image 3 - Bottom Left */}
            <div className="w-full h-52 rounded-2xl overflow-hidden shadow-2xl rotate-[2deg] hover:rotate-0 transition-transform">
              <img 
                src="/images/signupimg3.webp" 
                alt="Venue visual 3" 
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Image 4 - Bottom Right */}
            <div className="w-full h-52 rounded-2xl overflow-hidden shadow-2xl rotate-[-2deg] hover:rotate-0 transition-transform">
              <img 
                src="/images/signupimg4.avif" 
                alt="Venue visual 4" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Bottom Content */}
        <div className="relative z-10 mt-auto">
          <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center mb-6">
            <MapPin className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-bold mb-2">
            A Unified Hub for Smarter
            <br />
            Attendeeage Management
          </h2>
          <p className="text-sm opacity-80 max-w-md">
            EventGuard empowers you with a unified crowd management center—
            delivering real-time insights and a 360° view of your venue
            experience.
          </p>
        </div>
      </div>
    </div>
  );
}
