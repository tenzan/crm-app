"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// Define types for our data
interface Tenant {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string | null;
  address: string | null;
  createdAt: string;
  _count: {
    users: number;
  };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [newTenantEmail, setNewTenantEmail] = useState("");
  const [addingTenant, setAddingTenant] = useState(false);
  
  useEffect(() => {
    // Redirect to login if not authenticated
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    
    if (status === "authenticated") {
      if (session.user.role === "SUPER_ADMIN") {
        loadTenants();
      } else {
        setLoading(false);
      }
    }
  }, [status, session, router]);
  
  const loadTenants = async () => {
    try {
      const response = await fetch("/api/tenants");
      if (!response.ok) {
        throw new Error("Failed to load tenants");
      }
      const data = await response.json();
      setTenants(data);
    } catch (error) {
      console.error("Error loading tenants:", error);
      setError("Failed to load tenants");
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantEmail) return;
    
    setAddingTenant(true);
    try {
      const response = await fetch("/api/magic-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: newTenantEmail }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add tenant");
      }
      
      setNewTenantEmail("");
      alert("Invitation sent successfully!");
    } catch (error: any) {
      console.error("Error adding tenant:", error);
      setError(error.message || "Failed to add tenant");
    } finally {
      setAddingTenant(false);
    }
  };
  

  
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">CRM Dashboard</h1>
          <div className="flex items-center">
            <span className="mr-4">
              {session?.user?.name || session?.user?.email}
            </span>
            <button
              onClick={() => router.push("/api/auth/signout")}
              className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {/* Super Admin Dashboard */}
        {session?.user?.role === "SUPER_ADMIN" && (
          <div>
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Add New Tenant</h2>
              <form onSubmit={handleAddTenant} className="flex gap-4">
                <input
                  type="email"
                  value={newTenantEmail}
                  onChange={(e) => setNewTenantEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="submit"
                  disabled={addingTenant}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded disabled:opacity-50"
                >
                  {addingTenant ? "Sending..." : "Send Invitation"}
                </button>
              </form>
            </div>
            
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Tenants</h2>
              {tenants.length === 0 ? (
                <p className="text-gray-500">No tenants found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Slug
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Users
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created At
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tenants.map((tenant) => (
                        <tr key={tenant.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {tenant.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {tenant.slug}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {tenant._count.users}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            {new Date(tenant.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Admin Dashboard */}
        {session?.user?.role === "ADMIN" && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Welcome to Admin Dashboard</h2>
            <p className="text-gray-600">
              You are logged in as an admin user.
            </p>
          </div>
        )}
        
        {/* User Dashboard */}
        {session?.user?.role === "USER" && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Welcome to the CRM</h2>
            <p className="text-gray-600">
              You are logged in as a user. Your tenant administrator will be in touch with you.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
