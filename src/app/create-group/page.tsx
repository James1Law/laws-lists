"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Toaster, toast } from "sonner";
import bcrypt from "bcryptjs";
import { createClient } from '@supabase/supabase-js';

const ADMIN_PASSWORD = "letmein123";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default function CreateGroupPage() {
  const router = useRouter();
  const [hasAdminAccess, setHasAdminAccess] = useState<boolean | null>(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    password: "",
  });

  useEffect(() => {
    // Check localStorage for admin access
    const hasStoredAccess = localStorage.getItem("admin_access") === "true";
    setHasAdminAccess(hasStoredAccess);

    // Log Supabase configuration
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }, []);

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (adminPassword === ADMIN_PASSWORD) {
        localStorage.setItem("admin_access", "true");
        setHasAdminAccess(true);
        toast.success("Admin access granted");
      } else {
        toast.error("Incorrect admin password");
      }
    } catch (error) {
      console.error("Error verifying admin password:", error);
      toast.error("Failed to verify password");
    } finally {
      setIsLoading(false);
      setAdminPassword("");
    }
  };

  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate required fields
      if (!formData.name?.trim()) {
        throw new Error("Group name is required");
      }
      if (!formData.password?.trim()) {
        throw new Error("Group password is required");
      }

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(formData.password, salt);

      // Log the data before insert
      console.log('Attempting to create group with:', {
        name: formData.name.trim(),
        password_hash: passwordHash,
      });

      // Test Supabase connection
      try {
        const { data: testData, error: testError } = await supabase
          .from('groups')
          .select('count')
          .limit(1);
        
        console.log('Supabase connection test:', { testData, testError });
      } catch (testError) {
        console.error('Supabase connection test failed:', testError);
      }

      // Insert into Supabase
      const { data, error } = await supabase
        .from("groups")
        .insert([
          {
            name: formData.name.trim(),
            password_hash: passwordHash,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw new Error(`Failed to create group: ${error.message}`);
      }

      if (!data?.id) {
        throw new Error('No group ID returned from insert');
      }

      console.log('Group created successfully:', data);
      toast.success("Group created successfully!");
      router.push(`/group/${data.id}`);
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create group. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (hasAdminAccess === null) {
    return null; // Loading state
  }

  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Toaster position="top-center" />
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Admin Access Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="adminPassword"
                  className="text-sm font-medium leading-none"
                >
                  Admin Password
                </label>
                <Input
                  id="adminPassword"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                  className="h-12 text-base"
                  placeholder="Enter admin password"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-12 text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying...</span>
                  </div>
                ) : (
                  "Submit"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Toaster position="top-center" />
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Create a New Group
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGroupSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="text-sm font-medium leading-none"
              >
                Group Name
              </label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="h-12 text-base"
                placeholder="Enter group name"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium leading-none"
              >
                Group Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="h-12 text-base"
                placeholder="Enter password"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating...</span>
                </div>
              ) : (
                "Create Group"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 