import { useState, useEffect } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useSession, signOut } from "../../lib/auth";
import { LoginForm } from "../../components/auth/LoginForm";
import { SignupForm } from "../../components/auth/SignupForm";
import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import { Separator } from "../../components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "../../components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "../../components/ui/tooltip";
import {
  LayoutDashboard,
  FolderOpen,
  BookOpen,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Home,
  User,
  Settings,
  Bell,
  Search,
} from "lucide-react";

type Props = {
  children: React.ReactNode;
};

const navItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard, color: "text-info", exact: true },
  { path: "/admin/categories", label: "Categories", icon: FolderOpen, color: "text-warning" },
  { path: "/admin/content", label: "Content", icon: BookOpen, color: "text-success" },
];

function SidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const location = useLocation();
  
  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="flex-1 p-3 space-y-1">
      {navItems.map((item) => {
        const active = isActive(item.path, item.exact);
        return (
          <Tooltip key={item.path}>
            <TooltipTrigger asChild>
              <Link
                to={item.path}
                onClick={onNavigate}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200
                  ${active 
                    ? "bg-primary/10 text-primary font-medium shadow-sm" 
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }
                `}
              >
                <item.icon className={`h-5 w-5 flex-shrink-0 ${active ? "text-primary" : item.color}`} />
                {!collapsed && (
                  <span className="truncate">{item.label}</span>
                )}
                {active && !collapsed && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
                )}
              </Link>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right">
                {item.label}
              </TooltipContent>
            )}
          </Tooltip>
        );
      })}
    </nav>
  );
}

function UserMenu({ user, collapsed }: { user: any; collapsed: boolean }) {
  const initials = user?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "U";
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={`
          w-full flex items-center gap-3 p-3 hover:bg-accent rounded-lg transition-colors
          ${collapsed ? "justify-center" : ""}
        `}>
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-semibold text-sm">
            {initials}
          </div>
          {!collapsed && (
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || "Admin"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Breadcrumbs() {
  const location = useLocation();
  const pathParts = location.pathname.split("/").filter(Boolean);
  
  const breadcrumbs = pathParts.map((part, index) => {
    const path = "/" + pathParts.slice(0, index + 1).join("/");
    const label = part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " ");
    const isLast = index === pathParts.length - 1;
    
    return { path, label, isLast };
  });

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.path} className="flex items-center gap-1">
          {index > 0 && <ChevronRight className="h-4 w-4" />}
          {crumb.isLast ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link to={crumb.path} className="hover:text-foreground transition-colors">
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}

export function AdminLayout({ children }: Props) {
  const { data: session, isPending } = useSession();
  const [showSignup, setShowSignup] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Keyboard shortcut to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "b") {
        e.preventDefault();
        setCollapsed((c) => !c);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-4 w-64">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-8 w-1/2" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <div className="w-full max-w-md">
          {showSignup ? (
            <SignupForm
              onSuccess={() => window.location.reload()}
              onLoginClick={() => setShowSignup(false)}
            />
          ) : (
            <LoginForm
              onSuccess={() => window.location.reload()}
              onSignupClick={() => setShowSignup(true)}
            />
          )}
        </div>
      </div>
    );
  }

  const isAdmin = (session.user as any)?.role === "admin";

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <LogOut className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access the admin dashboard. Please contact an administrator.
          </p>
          <Button onClick={() => signOut()} variant="outline">
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background flex">
        {/* Desktop Sidebar */}
        <aside
          className={`
            hidden lg:flex flex-col border-r bg-card transition-all duration-300 ease-in-out
            ${collapsed ? "w-[72px]" : "w-64"}
          `}
        >
          {/* Logo */}
          <div className={`p-4 border-b flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
            {!collapsed && (
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg">LMS Admin</span>
              </div>
            )}
            {collapsed && (
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary-foreground" />
              </div>
            )}
          </div>

          {/* Navigation */}
          <SidebarContent collapsed={collapsed} />

          {/* Bottom section */}
          <div className="mt-auto border-t">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/"
                  className={`
                    flex items-center gap-3 px-3 py-2.5 mx-3 my-2 rounded-lg text-muted-foreground 
                    hover:bg-accent hover:text-accent-foreground transition-colors
                    ${collapsed ? "justify-center" : ""}
                  `}
                >
                  <Home className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>Home</span>}
                </Link>
              </TooltipTrigger>
              {collapsed && <TooltipContent side="right">Home</TooltipContent>}
            </Tooltip>
            
            <Separator />
            
            <UserMenu user={session.user} collapsed={collapsed} />
          </div>

          {/* Collapse button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-20 h-6 w-6 rounded-full border bg-background shadow-sm flex items-center justify-center hover:bg-accent transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
          {/* Header */}
          <header className="h-16 border-b bg-card/50 backdrop-blur-sm flex items-center px-4 gap-4 sticky top-0 z-40">
            {/* Mobile menu button */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="p-4 border-b flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-lg">LMS Admin</span>
                </div>
                <SidebarContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
                <div className="mt-auto border-t p-3">
                  <Link
                    to="/"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-accent"
                  >
                    <Home className="h-5 w-5" />
                    <span>Home</span>
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-destructive hover:bg-destructive/10 mt-1"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </SheetContent>
            </Sheet>

            {/* Breadcrumbs */}
            <Breadcrumbs />

            {/* Right side actions */}
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="sm" className="hidden sm:flex">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button variant="ghost" size="sm">
                <Bell className="h-5 w-5" />
              </Button>
              <div className="hidden lg:block">
                <UserMenu user={session.user} collapsed={false} />
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
