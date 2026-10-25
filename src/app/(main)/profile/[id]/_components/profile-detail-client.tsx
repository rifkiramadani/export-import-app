"use client";

import Image from "next/image";
import { Profile } from "@/types/profile";
import { Category } from "@/types/category";
import { UserMarketTable } from "./user-market-table";
import { Globe, Phone, Building } from "lucide-react";

interface ProfileDetailClientProps {
  profile: Profile;
  categories: Category[];
}

export default function ProfileDetailClient({
  profile,
  categories,
}: ProfileDetailClientProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Facebook-style Cover & Avatar Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Banner */}
        <div className="relative h-64 w-full bg-slate-200">
          {profile.banner_url ? (
            <Image
              src={profile.banner_url}
              alt="Profile Banner"
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 font-light">
              No Cover Photo
            </div>
          )}
        </div>

        {/* Profile Info Container */}
        <div className="px-6 pb-6 relative flex flex-col md:flex-row items-center md:items-end justify-between -mt-16 gap-4">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-4 text-center md:text-left">
            {/* Avatar */}
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white bg-slate-700 shadow-md flex items-center justify-center text-white text-4xl font-bold">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.name || "Avatar"}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <span>{profile.name?.[0]?.toUpperCase() || "U"}</span>
              )}
            </div>

            <div className="mb-1">
              <h1 className="text-2xl font-bold text-slate-900">
                {profile.name || "Unnamed User"}
              </h1>
              {profile.company_name && (
                <p className="text-slate-600 font-medium flex items-center justify-center md:justify-start gap-1 text-sm mt-0.1">
                  <Building size={14} /> {profile.company_name}
                </p>
              )}
            </div>
          </div>

          {/* Additional Badges / Meta */}
          <div className="flex flex-wrap gap-2 justify-center md:justify-end text-xs text-slate-500">
            {profile.country && (
              <span className="bg-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-1 font-medium">
                <Globe size={14} /> {profile.country.name} (
                {profile.country.code})
              </span>
            )}
            {profile.whatsapp && (
              <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg flex items-center gap-1 font-medium">
                <Phone size={14} /> {profile.whatsapp}
              </span>
            )}
          </div>
        </div>

        {/* Bio Section */}
        {profile.bio && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 text-slate-700 text-sm leading-relaxed">
            <span className="font-semibold block text-slate-900 mb-1">
              About
            </span>
            {profile.bio}
          </div>
        )}
      </div>

      {/* Tables Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-10">
        <UserMarketTable
          userId={profile.id}
          type="export"
          title="Export Products"
          categories={categories}
        />

        <div className="border-t border-slate-200 pt-8">
          <UserMarketTable
            userId={profile.id}
            type="import"
            title="Import Requests"
            categories={categories}
          />
        </div>
      </div>
    </div>
  );
}
