import { Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  BookOpen,
  GraduationCap,
  Trophy,
  LayoutDashboard,
  ArrowRight,
  Sparkles,
} from "lucide-react";

import logo from "../../assets/logo.svg";
import reactLogo from "../../assets/react.svg";

function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardContent className="pt-6">
        <div className={`h-12 w-12 rounded-xl ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}

export function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 lg:py-24">
        <div className="flex flex-col items-center text-center">
          {/* Logos */}
          <div className="flex justify-center items-center gap-6 mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
              <img
                src={logo}
                alt="Bun Logo"
                className="relative h-20 lg:h-28 transition-all duration-300 hover:scale-110"
              />
            </div>
            <div className="text-4xl font-light text-muted-foreground">+</div>
            <div className="relative">
              <div className="absolute inset-0 bg-info/20 rounded-full blur-xl" />
              <img
                src={reactLogo}
                alt="React Logo"
                className="relative h-20 lg:h-28 transition-all duration-300 hover:scale-110 animate-[spin_20s_linear_infinite]"
              />
            </div>
          </div>

          {/* Title */}
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="h-3 w-3 mr-1" />
            Independent Learning Module
          </Badge>
          
          <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-4">
            Learn at Your Own Pace
          </h1>
          
          <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mb-8">
            A self-directed learning platform with curated educational content across
            History, Astronomy, Wildlife, and more. Built with Bun, React, and Hono.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" asChild className="text-lg px-8">
              <Link to="/admin">
                <LayoutDashboard className="h-5 w-5 mr-2" />
                Admin Dashboard
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                View Documentation
                <ArrowRight className="h-5 w-5 ml-2" />
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 pb-16 lg:pb-24">
        <div className="text-center mb-12">
          <h2 className="text-2xl lg:text-3xl font-bold mb-4">Platform Features</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Everything you need to create, manage, and deliver engaging educational content.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={BookOpen}
            title="Curated Content"
            description="Browse educational content organized by categories like History, Astronomy, Wildlife, and more."
            color="bg-gradient-to-br from-info to-info/80"
          />
          <FeatureCard
            icon={GraduationCap}
            title="Progress Tracking"
            description="Track your learning progress, mark lessons complete, and resume from where you left off."
            color="bg-gradient-to-br from-success to-success/80"
          />
          <FeatureCard
            icon={Trophy}
            title="Completion Recognition"
            description="Earn completion status as you finish content modules and build your learning portfolio."
            color="bg-gradient-to-br from-warning to-warning/80"
          />
        </div>
      </div>

      {/* Tech Stack Section */}
      <div className="bg-muted/30 border-t">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Built With Modern Technology</h2>
            <p className="text-muted-foreground">Production-ready stack for performance and developer experience</p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {[
              { name: "Bun", desc: "Runtime" },
              { name: "React 19", desc: "Frontend" },
              { name: "Hono", desc: "API" },
              { name: "Drizzle", desc: "ORM" },
              { name: "PostgreSQL", desc: "Database" },
              { name: "TanStack Router", desc: "Routing" },
              { name: "Tailwind CSS", desc: "Styling" },
              { name: "shadcn/ui", desc: "Components" },
            ].map((tech) => (
              <Card key={tech.name} className="w-32">
                <CardContent className="p-4 text-center">
                  <p className="font-semibold text-sm">{tech.name}</p>
                  <p className="text-xs text-muted-foreground">{tech.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Independent Learning Module • Built with Bun + React + Hono</p>
        </div>
      </footer>
    </div>
  );
}
