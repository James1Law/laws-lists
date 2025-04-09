"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Laws Lists</CardTitle>
            <CardDescription className="text-center">
              Manage your gift lists with friends and family
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-gray-600">
              This is a simple app for managing gift lists within groups. Each group has a password to restrict access.
            </p>
            
            <div className="space-y-2">
              <Link href="/admin">
                <Button className="w-full h-12 text-base">
                  Admin Login
                </Button>
              </Link>
              
              <p className="text-center text-sm text-gray-500 mt-4">
                To access a group, use the direct group URL provided by the group creator.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
