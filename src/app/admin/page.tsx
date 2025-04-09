"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

// This would normally be in an env var, but for simplicity we're hardcoding it
const ADMIN_PASSWORD = "admin123";

export default function AdminPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simple password check
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      toast.success("Admin authenticated successfully");
      
      // In a real app, you might set a cookie or use localStorage
      sessionStorage.setItem("adminAuthenticated", "true");
    } else {
      toast.error("Invalid admin password");
    }

    setIsLoading(false);
  };

  // If authenticated, show admin dashboard
  if (isAuthenticated) {
    return (
      <div className="min-h-screen p-4 bg-gray-50">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Admin Dashboard</CardTitle>
              <CardDescription>Create and manage groups</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => router.push("/admin/create-group")}
                className="mr-2"
              >
                Create New Group
              </Button>
              <Button 
                onClick={() => router.push("/admin/manage-groups")}
                variant="outline"
              >
                Manage Groups
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Otherwise show login form
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Admin Access</CardTitle>
            <CardDescription className="text-center">
              Enter the admin password to manage groups
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Admin Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 text-base"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-12 text-base"
                disabled={isLoading}
              >
                {isLoading ? "Authenticating..." : "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 